# Parashari Astrology

Offline-first classical Vedic (Parashari) astrology web app. Plain HTML/CSS/JS,
no build step, no server-side code, no network calls once loaded.

## Running it

Swiss Ephemeris is loaded as a WebAssembly module via an ES module `<script>`.
Browsers block ES module `import`/WASM loading from a `file://` URL for
security reasons, so **you must serve this folder over a local HTTP server** —
double-clicking `index.html` will not load the ephemeris correctly (it will
silently fall back to the lower-precision analytic engine).

```
cd parashari-astrology
python3 -m http.server 8000
```

Then open http://localhost:8000/ in your browser.

## What it does (v1)

- Computes exact sidereal planetary longitudes (Lahiri ayanamsa) offline via
  the real Swiss Ephemeris (WebAssembly), with an automatic offline fallback
  if the WASM engine fails to load.
- **Chart & Analysis tab**: birth date/time/place input, and a Planet Table
  with Sign, Degree (DMS), Nakshatra, Pada, Combust, Retrograde, Aspected By
  (Parashari graha drishti), and Conjunct With (same-sign grouping).
- **Charts tab**: D1 (Rasi) and D9 (Navamsa) charts, in both South Indian
  (fixed sign grid) and North Indian (diamond, SVG) layouts, with each
  planet's degree-minute-second position shown inside its cell. D1 uses
  classical WHOLE-SIGN houses counted from the Ascendant's sign — not
  Placidus cuspal houses.

More tabs (yogas, bhava bala, dasha, transits, etc.) are intentionally left
for follow-up requests — this is a v1 scope.

## Architecture

Modular, one topic per file under `js/`, each exporting its computation
function(s) plus a `<TOPIC>_LOGIC_TEXT` plain-English description of its
method (for in-app transparency / auditability):

- `parashariTables.js` — signs, nakshatras, pada, DMS formatting (pure math, no KP-specific concepts)
- `ephemeris.js` — sidereal longitudes + Ascendant, Swiss-Ephemeris-first with offline analytic fallback
- `swissephBridge.js` — Swiss Ephemeris WASM bridge (see Licensing below)
- `combustion.js` — classical per-planet combustion (asta) orb rules
- `aspects.js` — Parashari graha drishti (whole-sign aspect) rules, including Mars/Jupiter/Saturn special aspects
- `conjunctions.js` — same-sign conjunction grouping
- `birthChart.js` — ties the above together into one birth-chart generation call
- `parashariCharts.js` — D1/D9 chart data builders + South/North Indian layout data (incl. the D9 degree-rescaling formula)
- `timezone.js` — local-to-UTC birth time conversion (IANA zone or fixed UTC offset)
- `ui.js` — tabbed UI glue

This app deliberately does **not** reuse KP-specific interpretive logic
(cuspal sub-lord theory, KP significators, Placidus cusps) from the sibling
KP astrology app — only pure, technique-agnostic math (longitude-to-sign/
nakshatra/pada, the navamsa formula, DMS formatting, timezone conversion,
the Swiss Ephemeris bridge itself) is shared.

## Licensing note

Swiss Ephemeris is AGPL-3.0-or-later (this WebAssembly build via the
`swisseph-wasm` npm package, itself GPL-3.0-or-later). For personal,
single-user, non-distributed use this carries no copyleft obligations —
AGPL's network-use clause and GPL's distribution clause both hinge on
distributing the software or offering it as a network service to others,
neither of which applies to running this app locally for yourself. Revisit
this note before ever distributing this app to anyone else or hosting it as
a shared/network service. See `ephemeris/LICENSE-swisseph-wasm.txt`.
