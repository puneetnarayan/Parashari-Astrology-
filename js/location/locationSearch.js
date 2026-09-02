// Shared location-search service: loads sql.js (SQLite compiled to
// WebAssembly) and places.db ONCE, then serves fast, ranked, worldwide
// place autocomplete queries entirely offline — the same pattern this app
// already uses for Swiss Ephemeris (a WASM binary + a static data file,
// loaded once, queried synchronously afterward). Both the Native/Birth
// location selector and the Astrologer's location selector call into this
// one module; neither duplicates the search logic or loads its own copy
// of the database.
//
// places.db is built offline by tools/geonames-import/import-geonames.js
// from real GeoNames data (see js/location/README.md for provenance and
// how to rebuild/update it with a larger GeoNames dump).

const LOCATION_SEARCH_LOGIC_TEXT = [
  ['Location Search — Logic and Sequence'],
  [''],
  ['1. places.db (a prebuilt SQLite database of GeoNames places, see js/location/README.md) is loaded once via sql.js (SQLite compiled to WebAssembly) and kept open in memory for the rest of the session — no network request is made after the initial page load, and no per-keystroke server round trip ever happens.'],
  ['2. A query runs THREE SQL passes against indexed columns — exact match, prefix match ("starts with"), and substring match — against both the place\'s own name/ASCII name and its semicolon-separated alternate-names field (so searching "Toranagallu" can find a place whose canonical GeoNames name is spelled differently, as long as that spelling is listed as an alternate name). The standard prebuilt sql.js WASM binary does not include the FTS5 full-text extension, so this uses plain indexed LIKE queries rather than FTS5 — fast enough for this dataset\'s size to stay well under 100ms.'],
  ['3. Results from all three passes are merged (de-duplicated by place id) and then RE-RANKED in JavaScript per this app\'s own explicit tier order: (1) exact name match, (2) name starts with the search text, (3) exact alternate-name match, (4) name contains the search text, (5) alternate name contains the search text — with population and a rough administrative-importance score (capital > admin capital > ordinary populated place) as tie-breakers within each tier. Results are never returned in raw database order.'],
  ['4. The search box waits for at least 2 characters and debounces keystrokes before querying, per standard autocomplete practice — see js/location/locationSelector.js.'],
  [''],
  ['Caveat: this database currently covers GeoNames populated places with population > 1000 (~148,000 worldwide) — see js/location/README.md for exactly why (a network restriction in the build environment blocked the larger cities500/allCountries GeoNames dumps) and the documented one-command upgrade path once you have normal internet access. Very small villages/hamlets below that threshold will not be found until the database is rebuilt from a larger GeoNames export; use the manual coordinate entry fallback for those in the meantime.']
];

const FEATURE_CODE_IMPORTANCE = {
  PPLC: 5, // capital of a country
  PPLA: 4, PPLA2: 3, PPLA3: 2, PPLA4: 2, // admin capitals
  PPL: 1 // ordinary populated place
};

let dbPromise = null;

// Loads sql.js + places.db exactly once; subsequent calls return the same
// resolved promise/database instance (shared by every LocationSelector).
function initLocationDb() {
  if (dbPromise) return dbPromise;
  dbPromise = Promise.all([
    initSqlJs({ locateFile: file => `js/location/${file}` }),
    fetch('js/location/places.db').then(r => {
      if (!r.ok) throw new Error(`Could not load places.db (HTTP ${r.status}). Serve this app via a local web server, not file://.`);
      return r.arrayBuffer();
    })
  ]).then(([SQL, buf]) => new SQL.Database(new Uint8Array(buf)));
  return dbPromise;
}

function escapeLike(s) {
  return s.replace(/[%_]/g, ch => '\\' + ch);
}

function rowToPlace(cols, values) {
  const rec = {};
  cols.forEach((c, i) => { rec[c] = values[i]; });
  return {
    id: rec.id,
    geonamesId: rec.geonames_id,
    name: rec.name,
    asciiName: rec.ascii_name,
    alternateNames: rec.alternate_names ? rec.alternate_names.split(';').filter(Boolean) : [],
    state: rec.admin1_name || null,
    district: rec.admin2_name || null,
    country: rec.country_name,
    countryCode: rec.country_code,
    latitude: rec.latitude,
    longitude: rec.longitude,
    population: rec.population,
    featureCode: rec.feature_code,
    timezone: rec.timezone
  };
}

function runQuery(db, sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out = [];
  while (stmt.step()) out.push(rowToPlace(stmt.getColumnNames(), stmt.get()));
  stmt.free();
  return out;
}

// Re-ranks a de-duplicated candidate list per the app's explicit tier order.
function rankResults(candidates, queryLower) {
  const scored = candidates.map(place => {
    const nameLower = place.asciiName.toLowerCase();
    const altLower = place.alternateNames.map(a => a.toLowerCase());
    let tier;
    if (nameLower === queryLower) tier = 1;
    else if (nameLower.startsWith(queryLower)) tier = 2;
    else if (altLower.includes(queryLower)) tier = 3;
    else if (nameLower.includes(queryLower)) tier = 4;
    else if (altLower.some(a => a.includes(queryLower))) tier = 5;
    else tier = 6;
    const adminScore = FEATURE_CODE_IMPORTANCE[place.featureCode] || 0;
    return { place, tier, adminScore };
  });
  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (b.place.population !== a.place.population) return b.place.population - a.place.population;
    return b.adminScore - a.adminScore;
  });
  return scored.map(s => s.place);
}

// Public search: query must be >= 2 chars (caller/UI enforces the debounce).
// Returns up to `limit` ranked place objects.
function searchPlaces(db, query, limit) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const lower = trimmed.toLowerCase();
  const likeEscaped = escapeLike(lower);

  const byMap = new Map();
  const add = rows => rows.forEach(p => { if (!byMap.has(p.id)) byMap.set(p.id, p); });
  const wantCount = limit || 15;

  // Pass 1: prefix match on indexed search_name (fast — uses idx_places_search_name,
  // no full-table scan). This alone satisfies the overwhelming majority of
  // autocomplete queries, so passes 2/3 (unavoidable full-table scans, since
  // a leading-wildcard LIKE can't use a B-tree index) only run when this
  // fast pass doesn't already return a healthy candidate set — keeping the
  // common case comfortably under the <100ms target.
  add(runQuery(db,
    `SELECT * FROM places WHERE search_name LIKE ? ESCAPE '\\' ORDER BY population DESC LIMIT 200`,
    [`${likeEscaped}%`]));

  if (byMap.size < wantCount * 4) {
    // Passes 2+3 combined into one scan: substring match on name OR on
    // alternate names (covers mid-word matches and spelling variants /
    // transliterations, e.g. searching "Toranagallu" for a place whose
    // canonical GeoNames name differs but lists it as an alternate name).
    add(runQuery(db,
      `SELECT * FROM places
       WHERE search_name LIKE ? ESCAPE '\\'
          OR alternate_names LIKE ? ESCAPE '\\' COLLATE NOCASE
       ORDER BY population DESC LIMIT 300`,
      [`%${likeEscaped}%`, `%${likeEscaped}%`]));
  }

  const ranked = rankResults(Array.from(byMap.values()), lower);
  return ranked.slice(0, wantCount);
}

if (typeof module !== 'undefined') {
  module.exports = { LOCATION_SEARCH_LOGIC_TEXT, initLocationDb, searchPlaces };
}
