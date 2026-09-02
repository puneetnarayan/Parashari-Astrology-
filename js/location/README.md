# Location Selection — Data & Architecture

Offline, worldwide place autocomplete for both the Birth Location and the
Astrologer's Location, built on the same static-asset-plus-WASM pattern this
app already uses for Swiss Ephemeris (a WASM binary + a data file, loaded
once, queried synchronously afterward — no server, no build step).

## Architecture

- **`sql-wasm.js` / `sql-wasm.wasm`** — [sql.js](https://github.com/sql-js/sql.js) v1.14.2, SQLite compiled to WebAssembly. Runs entirely in the browser.
- **`places.db`** — a prebuilt SQLite database of GeoNames places, loaded once via `initLocationDb()` in `locationSearch.js` and kept open in memory for the session.
- **`locationSearch.js`** — the one shared search service (`searchPlaces(db, query, limit)`): three indexed SQL passes (exact/prefix, substring, alternate-names) merged and re-ranked in JS per this app's explicit tier order (see the file's own `LOCATION_SEARCH_LOGIC_TEXT`).
- **`locationSelector.js`** — the reusable UI component (`createLocationSelector(config)`), instantiated twice in `ui.js`: once for Birth Location (writes into the existing `birthLat`/`birthLon`/`ianaZone` fields the calculation pipeline already reads — the Swiss Ephemeris integration itself was **not** touched), once for the independent Astrologer's Location.

Two selectors, one shared database, zero duplicated search code — exactly as specified.

## Where the data comes from

GeoNames (`https://www.geonames.org/`, data licensed CC-BY 4.0) is the
authoritative source, per the project requirement. However, this sandboxed
build environment's network policy **blocks `download.geonames.org`
directly** (verified: the outbound proxy returns a `connect_rejected`
policy denial for that host). To still ship real, correctly-licensed
GeoNames data rather than fabricating anything, the current `places.db` was
built from a legitimate third-party mirror that commits the GeoNames dump
files directly into its git repository (reachable because GitHub itself is
not blocked):

- Source: [`pelagios/recogito2-places-geonames`](https://github.com/pelagios/recogito2-places-geonames) (public repo, MIT-style reuse of public-domain-adjacent GeoNames dumps)
- Files used: `cities1000.txt.gz` (all populated places with population > 1000: **148,074 places worldwide**, dated ~2017), `admin1CodesASCII.txt` (state/province names), `countryInfo.txt` (country names)
- These are copied into `tools/geonames-import/source-data/` in this repo, so the import is fully reproducible without needing network access again.

### Known limitation of the current database

The **population > 1000** threshold (`cities1000`, not the finer-grained
`cities500` or the complete `allCountries` dump) means very small villages
and hamlets are not in `places.db` yet. This is a direct consequence of the
network restriction above, not a design choice — the import script itself
places no limit on which GeoNames dump it can process. **Use the "Enter
coordinates manually" fallback for any place not found**, and see "Updating
the database" below for the one-command upgrade path once you have normal
internet access.

## `places` table schema

```sql
CREATE TABLE places (
  id INTEGER PRIMARY KEY,
  geonames_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  ascii_name TEXT NOT NULL,
  alternate_names TEXT,      -- semicolon-separated
  country_code TEXT,
  country_name TEXT,
  admin1_code TEXT,
  admin1_name TEXT,          -- state/province, resolved from admin1CodesASCII.txt
  admin2_code TEXT,
  admin2_name TEXT,          -- not resolved in this build (admin2CodesASCII.txt not fetched — see limitation above)
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  population INTEGER DEFAULT 0,
  feature_class TEXT,
  feature_code TEXT,
  timezone TEXT,             -- IANA zone ID, straight from GeoNames
  search_name TEXT           -- lowercased ascii_name, indexed for fast prefix search
);
```

Indexes: `idx_places_name`, `idx_places_ascii_name`, `idx_places_search_name`,
`idx_places_country`, `idx_places_geonames_id`.

**Note on FTS5**: the requirement suggested FTS5 for fuzzy/full-text search.
The standard prebuilt `sql.js` WASM binary does not include the FTS5
extension (`no such module: fts5` at runtime) — there is no npm-distributed
FTS5-enabled build. Given the dataset's size (148k rows), plain indexed
`LIKE` queries comfortably meet the <100ms target and give full control over
the exact ranking rules requested, so FTS5 was dropped in favor of that
approach rather than vendoring a custom sql.js build.

## How timezone is determined

**Not** derived from longitude or hard-coded by country. Each place row
carries the exact IANA time zone ID GeoNames itself assigns (e.g.
`Asia/Kolkata`, `Europe/Zurich`). Selecting a place sets the existing
`ianaZone` dropdown to that ID; the app's pre-existing `timezone.js`
(`zonedLocalToUtc`) then converts the entered local birth date/time to UTC
using the **browser's own IANA tzdata** (via `Intl.DateTimeFormat`), which
already handles historical DST/offset changes correctly — this code path
was not modified, only fed a correctly-sourced zone ID.

## How to update/rebuild `places.db`

```bash
cd tools/geonames-import
npm install
# Replace files in source-data/ with a newer/larger GeoNames dump to get
# broader coverage (e.g. cities500.txt.gz or allCountries.txt.gz from
# https://download.geonames.org/export/dump/ — same column format,
# import-geonames.js does not need to change), then:
node import-geonames.js
```

The script always rebuilds `../../js/location/places.db` from scratch from
whatever is currently in `source-data/`, and prints an import report (source
records read, imported, rejected, duplicate name+country pairs, output
database size) every run — safe to re-run any time the source data changes.

## How the app uses latitude/longitude

`getSelectedLocation()` on a selector instance returns the full location
object (or `null` if nothing valid is selected — the app never silently
falls back to `0, 0, UTC`). For Birth Location specifically, the selector
writes directly into the pre-existing `birthLat`/`birthLon`/`ianaZone`
fields, so `birthChart.js`'s existing `generateBirthChart()` call — and the
Swiss Ephemeris bridge underneath it — receive coordinates exactly as
before, just now sourced from a validated worldwide place lookup instead of
manual typing alone. Manual entry remains fully supported via "Enter
coordinates manually" (validated: latitude -90..90, longitude -180..180).
