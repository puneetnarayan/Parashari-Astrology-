# Relocation Analysis — Implementation Notes

## What was implemented

A new **Relocation** tab (added at the end of the tab strip, after
Parashari Analysis) implementing the attached spec's full pipeline:

```
Natal Promise -> Location Effect -> Dasha Activation -> Transit Timing
```

Architecture follows this session's established per-feature-folder
pattern (same as Marriage Timing/Parashari Analysis): a location/geo
utility module, a rule database, a pure calculation engine, and a
rendering-only UI layer, all reusing this app's existing calculations.

- `js/relocation/relocationLocations.js` — `window.RelocationLocations`:
  sample-city list, great-circle bearing/compass-direction/distance
  (genuinely new — this app had no geographic bearing utility), and the
  cache-key helper.
- `js/relocation/relocationRules.js` — `window.RELOCATION_RULES`: 20
  documented rules (`RL-NATAL-*`, `RL-PAIR-*`, `RL-RELOC-001`,
  `RL-WEIGHT-001`, `RL-DASHA-001`, `RL-TRANSIT-001`, `RL-AV-001`,
  `RL-DIRECTION-001`, `RL-INDEX-001`).
- `js/relocation/relocationEngine.js` — `window.Relocation`: all
  calculation logic, returning plain data only.
- `js/relocation/relocationUI.js` — `window.RelocationUI`: rendering,
  using this app's existing `output-box`/`pastel-*`/`.rem-table`/
  `quality-good/neutral/bad`/`avp-calc` conventions.

### Reuse (nothing duplicated)

- **Natal chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `NATURAL_BENEFICS`, `ASPECT_OFFSETS`,
  `normalizeDegrees`, `SHADBALA_PLANETS` — identical to every other
  module this session (Marriage Timing, Parashari Analysis, Sudarshana).
- **Relocated Ascendant/houses (Section 4)** — the one genuinely new
  calculation, and even this reuses existing primitives rather than
  writing new astronomy: `computeAscendant(birthUtc, latitude,
  longitude)` (from `js/ephemeris.js`, already used by `generateChart()`
  for the natal chart) is called again at the SAME birth instant but the
  candidate location's coordinates, and `wholeSignHouseOf()` (from
  `js/parashariCharts.js`) re-derives each natal planet's house from the
  new Ascendant sign. **Natal planetary longitudes are copied through
  unchanged** — confirmed by test (see Testing below).
- **Vimshottari Dasha**: `state.dasha` + `buildSubPeriods()` (existing,
  `js/dasha/vimshottariDasha.js`) — no second dasha engine, exactly as
  the spec requires.
- **Transit**: `computeSingleLongitude()` (existing, `js/ephemeris.js`),
  the same call used by every other transit-aware tab in this app.
- **Ashtakavarga**: `state.ashtakvarga` (populated by the existing
  `computeAshtakvarga()` whenever a chart is generated) — read directly
  for SAV bindus in the natal 4th/9th/10th/12th houses; never
  recomputed, and explicitly capped at 5/100 of the compatibility index
  per the spec's "do not make Ashtakavarga the primary determinant" rule.
- **Planetary strength**: `state.shadbala` (existing Shadbala engine),
  read for the relevant relocation-house lords' strength ratio when
  available; gracefully degrades to a documented neutral default when
  Shadbala hasn't been computed for the current chart (see Error
  Handling below) rather than failing.

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Natal Relocation Analysis (Section 3)

`assessNatalPromise()` classifies the 1st/3rd/4th/7th/9th/10th/12th
houses, Moon, and the 4th<->12th/9th/7th/10th and 4th<->Rahu/Ketu and
9th<->12th relationships into Strong/Moderate/Supporting/Neutral/
Challenging, each with its rule id and evidence list — never a bare
label. House-lord connections are detected via conjunction (same
sign), mutual aspect (`aspectedBy`), or Parivartana (sign exchange),
reusing existing planet fields rather than new geometry.

## Relocation Chart (Section 4)

`computeRelocatedChart(latitude, longitude)` is the only new
calculation function. It is cached per `(birthUtc, lat, lon)` via
`RelocationLocations.cacheKey()` so an unchanged candidate location is
never recomputed (Section 16) — verified in testing that repeated
analysis of the same location reuses the cached object.

## Purpose Weighting (Section 5) & Compatibility Index (Section 6)

`Relocation.PURPOSE_WEIGHTS` holds all 8 purposes' house/planet
emphasis exactly as specified, as one plain configurable object (not
scattered through code). `computeCompatibilityIndex(location, purpose)`
builds the 100-point index from the exact 9 named components
(`COMPATIBILITY_COMPONENTS`), returning `{ score, maxScore, components,
positiveFactors, negativeFactors, neutralFactors, ruleIds,
explanations }` — matching the spec's required shape verbatim. No
component can be read without also seeing which rule and which raw
evidence produced it.

## Dasha Integration (Section 7)

`assessDashaForRelocation()` reads the current Mahadasha/Antardasha from
`state.dasha` and computes the current Pratyantardasha via the existing
`buildSubPeriods()`, classifying each level's lord by house ownership/
occupation against the relocation houses (4/9/10/12), then combining
into `{ promise, activation, timing }` exactly as the spec's Section 7
asks — `promise` true if MD or AD is relevant, `activation` if AD or PD
is relevant, `timing` if PD specifically is relevant (the most specific,
narrowest signal).

## Transit Integration (Section 8)

`assessTransitSupport()` checks Jupiter/Saturn/Rahu/Ketu's current
transit position and aspects against the natal 4th/9th/10th/12th houses.
It is deliberately wired as only one component (5/100) of the
compatibility index and is never used to override a weak natal promise
score — the natal-promise component is weighted 4x higher (20 vs. 5).

## Direction (Section 10)

`getDirection()` computes true-north bearing, 8-point compass label, and
great-circle distance — shown in the location detail panel purely as
descriptive geography. It carries no score and cannot affect the
compatibility index in any way (rule `RL-DIRECTION-001` documents this
explicitly, including why: directional/disha astrology is not a single
settled classical system, so it is treated as supplementary context
only rather than presenting an unvalidated scored rule as doctrine).

## Candidate Locations (Section 11)

An extensible `{ name, country, latitude, longitude }` structure, a
small starter list of 8 sample cities (`RelocationLocations.SAMPLE_CITIES`),
and a custom-location form (name + lat/lon, validated to -90..90 /
-180..180) — never hard-coded to a fixed city list. Locations are kept
in `RelocationUI`'s own closure state, not `window.state` or
localStorage: they are user selections independent of the chart's
lifecycle, so switching tabs or regenerating the chart does not wipe
them, and no existing localStorage key or shared-state reset list needed
touching.

## Comparison UI & Location Detail (Sections 12-13)

The comparison table shows Residence/Career/Finance/Family/Retirement/
Dasha as rows and each added location as a column, with no location ever
labeled "best" — only comparative badges. Clicking a location name opens
its full detail: relocated Ascendant, 4th/9th/10th/12th house
sign/lord/dignity/aspects/occupants, the full compatibility index
breakdown with "Why?"/rules-used panels, Dasha activation, Ashtakavarga,
and an interpretation line for every one of the 8 purposes (all 8 are
always computed and shown, since none are classically gated behind
missing data the way D9/transit/dasha can be).

## "Why?" Explanations (Section 14)

Every house classification, house-relationship check, and compatibility
component carries an `avp-calc`-style expandable panel listing its
actual evidence strings — reusing the exact expandable-details
convention already used throughout this app (Sudarshana, Parashari
Analysis, Marriage Timing), not a new UI pattern.

## Error Handling (Section 17)

- **Missing chart**: the tab shows "Generate a chart first" instead of
  attempting any calculation.
- **Invalid coordinates**: the custom-location form validates lat/lon
  ranges before accepting a new location.
- **Unavailable Dasha**: `assessDashaForRelocation()` returns `null`;
  the Dasha compatibility component falls back to a documented neutral
  default (50% of its 10-point weight) rather than erroring, and the
  detail panel shows "Dasha data unavailable."
- **Unavailable Ashtakavarga**: `getAshtakvargaForHouses()` returns
  `null` if `state.ashtakvarga` isn't populated; the Ashtakavarga
  component likewise falls back to a documented neutral default.
- **Unavailable Shadbala**: the planetary-strength component falls back
  to a documented neutral default rather than throwing.

## Deliberate scope decisions

- **No new localStorage structures**: candidate locations live in the
  UI module's in-memory state only (see Candidate Locations above) —
  deliberately avoiding any new persistent-storage schema, per the
  spec's "do not modify existing localStorage structures" instruction
  interpreted conservatively (adding a new, unrelated storage key was
  judged unnecessary complexity for this first version; it could be
  added later without touching anything existing).
- **Direction is never scored** — see Direction section above; this is
  an explicit, documented divergence from treating Section 10 as a
  10th scoring component, because the spec itself says direction must
  never override strong evidence, and a scored-but-capped component
  risked exactly that if misread later.
- **Ashtakavarga and planetary strength** use the chart's natal house
  positions (not the relocated ones) for Shadbala/SAV lookups, since
  neither of this app's existing Ashtakavarga/Shadbala engines are
  relocation-aware (they are natal-only classical techniques) — this
  matches the spec's own framing of Ashtakavarga/strength as natal
  secondary evidence, not something recalculated per location.
- **Comparison table** shows 5 of the 8 purposes (Residence, Career,
  Finance, Family, Retirement) plus Dasha, matching the exact column
  set the spec's own Section 12 example table lists; Retirement/
  Property/Spiritual/Foreign-Settlement are still fully available in
  each location's detail panel (all 8 purposes are always shown there).

## Testing performed

- `node --check` on all four new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 27 tabs
  (26 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- Added 3 sample cities (Mumbai, Dubai, London), confirmed the input
  table, comparison table, and 3 location-detail buttons all render.
- Confirmed programmatically that relocating to New York: (a) left every
  natal planet's longitude byte-for-byte identical
  (`JSON.stringify` equality check) while (b) correctly changing the
  Ascendant sign (natal Scorpio -> relocated Cancer) and planetary house
  placements — i.e., Section 4's core requirement verified directly, not
  just visually.
- Confirmed the compatibility index computes a real, componentized score
  (53/100 for the test case) and the direction/distance calculation
  returns a sensible compass direction and distance.
- Confirmed remove-location and purpose-change interactions update the
  UI correctly without page errors.

## Areas requiring manual astrological review

- The compatibility-index component weightings and the house-strength
  fraction heuristic (`houseStrengthFraction()`) are an
  internally-consistent first cut, not independently validated against
  a named classical relocation text — consistent with every other
  scoring module in this app, a practicing astrologer may want these
  retuned.
- Classical relocation astrology has several competing house-relocation
  conventions (e.g. some traditions also recompute Navamsha/Varga charts
  per location); this implementation follows the spec's own explicit
  scope (relocate D1 Ascendant/houses only) and does not attempt a
  relocated-D9 layer, which the spec did not request.
