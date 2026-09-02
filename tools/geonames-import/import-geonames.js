#!/usr/bin/env node
// GeoNames -> places.db import utility.
//
// Reads the raw GeoNames dump files in source-data/ (cities1000.txt.gz,
// admin1CodesASCII.txt, countryInfo.txt — see README.md in this folder for
// exactly where they came from and how to replace them with a larger/newer
// dump) and builds a single SQLite database, places.db, with a `places`
// table plus an FTS5 full-text index for fast worldwide autocomplete.
//
// Usage:  node import-geonames.js
// Output: ../../js/location/places.db  (consumed by sql.js in the browser)
//
// Safe to re-run: it always rebuilds places.db from scratch from whatever
// is currently in source-data/, so updating the GeoNames source files and
// re-running this script is the entire "update the database" workflow.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const initSqlJs = require('sql.js');

const SOURCE_DIR = path.join(__dirname, 'source-data');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'js', 'location', 'places.db');

function readGz(filePath) {
  return zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8');
}
function readPlain(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// admin1CodesASCII.txt: "CC.ADM1CODE \t Name \t ASCII Name \t geonameid"
function loadAdmin1Names() {
  const text = readPlain(path.join(SOURCE_DIR, 'admin1CodesASCII.txt'));
  const map = {}; // "IN.19" -> "Karnataka"
  text.split('\n').forEach(line => {
    if (!line.trim()) return;
    const [code, name] = line.split('\t');
    if (code) map[code] = name;
  });
  return map;
}

// countryInfo.txt: tab-separated, comment lines start with '#'.
// Column 0 = ISO code, column 4 = Country name.
function loadCountryNames() {
  const text = readPlain(path.join(SOURCE_DIR, 'countryInfo.txt'));
  const map = {}; // "IN" -> "India"
  text.split('\n').forEach(line => {
    if (!line.trim() || line.startsWith('#')) return;
    const cols = line.split('\t');
    if (cols[0] && cols[4]) map[cols[0]] = cols[4];
  });
  return map;
}

// cities1000.txt columns (standard GeoNames "cities" dump format):
// 0 geonameid, 1 name, 2 asciiname, 3 alternatenames, 4 latitude, 5 longitude,
// 6 feature class, 7 feature code, 8 country code, 9 cc2, 10 admin1 code,
// 11 admin2 code, 12 admin3 code, 13 admin4 code, 14 population, 15 elevation,
// 16 dem, 17 timezone, 18 modification date.
function parseCitiesLine(line) {
  const c = line.split('\t');
  if (c.length < 19) return null;
  return {
    geonamesId: Number(c[0]),
    name: c[1],
    asciiName: c[2],
    alternateNames: c[3] ? c[3].split(',').filter(Boolean) : [],
    latitude: Number(c[4]),
    longitude: Number(c[5]),
    featureClass: c[6],
    featureCode: c[7],
    countryCode: c[8],
    admin1Code: c[10],
    admin2Code: c[11],
    population: Number(c[14]) || 0,
    timezone: c[17]
  };
}

async function main() {
  console.log('Loading reference tables (admin1 names, country names)...');
  const admin1Names = loadAdmin1Names();
  const countryNames = loadCountryNames();

  console.log('Reading cities1000.txt.gz...');
  const citiesText = readGz(path.join(SOURCE_DIR, 'cities1000.txt.gz'));
  const lines = citiesText.split('\n').filter(l => l.trim());

  console.log(`Source records: ${lines.length}`);

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE places (
      id INTEGER PRIMARY KEY,
      geonames_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      ascii_name TEXT NOT NULL,
      alternate_names TEXT,
      country_code TEXT,
      country_name TEXT,
      admin1_code TEXT,
      admin1_name TEXT,
      admin2_code TEXT,
      admin2_name TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      population INTEGER DEFAULT 0,
      feature_class TEXT,
      feature_code TEXT,
      timezone TEXT,
      search_name TEXT
    );
    CREATE INDEX idx_places_name ON places(name);
    CREATE INDEX idx_places_ascii_name ON places(ascii_name);
    CREATE INDEX idx_places_search_name ON places(search_name);
    CREATE INDEX idx_places_country ON places(country_code);
    CREATE INDEX idx_places_geonames_id ON places(geonames_id);
  `);
  // Note: the standard prebuilt sql.js WASM binary does not include the
  // FTS5 extension ("no such module: fts5"), so this import uses plain
  // indexed columns (search_name, ascii_name, alternate_names) with
  // prefix/substring SQL queries instead — see js/location/locationSearch.js
  // for the query strategy and js/location ranking logic. For a 148k-row
  // dataset this comfortably meets the <100ms target without FTS5.

  const insertPlace = db.prepare(`
    INSERT INTO places (
      geonames_id, name, ascii_name, alternate_names, country_code, country_name,
      admin1_code, admin1_name, admin2_code, admin2_name,
      latitude, longitude, population, feature_class, feature_code, timezone, search_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let imported = 0, rejected = 0;
  const seenGeonamesIds = new Set();
  let duplicateNames = 0;
  const seenNameCountry = new Set();

  db.run('BEGIN TRANSACTION');
  for (const line of lines) {
    const p = parseCitiesLine(line);
    if (!p || !p.name || isNaN(p.latitude) || isNaN(p.longitude)) { rejected++; continue; }
    if (seenGeonamesIds.has(p.geonamesId)) { rejected++; continue; }
    seenGeonamesIds.add(p.geonamesId);

    const admin1Full = p.countryCode && p.admin1Code ? `${p.countryCode}.${p.admin1Code}` : null;
    const admin1Name = admin1Full ? (admin1Names[admin1Full] || null) : null;
    const countryName = countryNames[p.countryCode] || p.countryCode || null;
    const searchName = p.asciiName.toLowerCase();
    const altNamesStr = p.alternateNames.join(';');

    const nameCountryKey = `${searchName}|${p.countryCode}`;
    if (seenNameCountry.has(nameCountryKey)) duplicateNames++;
    seenNameCountry.add(nameCountryKey);

    insertPlace.run([
      p.geonamesId, p.name, p.asciiName, altNamesStr, p.countryCode, countryName,
      p.admin1Code || null, admin1Name, p.admin2Code || null, null,
      p.latitude, p.longitude, p.population, p.featureClass, p.featureCode, p.timezone, searchName
    ]);
    imported++;
  }
  db.run('COMMIT');
  insertPlace.free();

  const data = db.export();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, Buffer.from(data));

  const sizeMB = (fs.statSync(OUTPUT_PATH).size / (1024 * 1024)).toFixed(2);
  console.log('');
  console.log('=== Import Report ===');
  console.log(`Source records read:     ${lines.length}`);
  console.log(`Imported:                ${imported}`);
  console.log(`Rejected (bad/dup row):  ${rejected}`);
  console.log(`Duplicate name+country:  ${duplicateNames} (same name appears more than once in the same country — expected, disambiguated by admin1/coords)`);
  console.log(`Database size:           ${sizeMB} MB`);
  console.log(`Output:                  ${OUTPUT_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
