# Module Discovery Inventory (internal dev reference)

Generated during the Wealth Protection & Asset Consolidation Timing build (step 1 of a
6-step plan to add 5 new timing modules). Verified by reading actual source, not assumed
from naming conventions. Reuse these exact names/shapes in all subsequent module builds
this session instead of re-deriving them.

## Core chart/dignity utilities (global, no namespace)
- `state.chart` — set in `js/ui.js` (~line 2018): `{ planets, ascendant, birthUtc, birthTimeZoneInfo }`.
  `planets` is an array of `{ name, sign, longitude, house, conjunctWith: [names], aspectedBy: [names] }`.
  `ascendant` is `{ sign, longitude }`.
- `state.dasha` — Vimshottari Mahadasha array (see Dasha section below).
- `state.ashtakvarga` — set alongside `state.chart` via `computeAshtakvarga(planets, ascendant.longitude)` (js/ashtakvarga.js). No `window.*` namespace — plain global function `computeAshtakvarga`. Return shape: inspect `js/ashtakvarga.js` lines ~103-160 (`computeBhinnashtakavarga`, totals per sign). Used directly, not wrapped as an engine with `.refresh()`.
- `SIGNS` — array of 12 sign names, declared in `js/parashariTables.js` (~line 19).
- `SIGN_LORD` — object mapping sign name -> lord planet name, `js/parashariTables.js` (~line 23).
- `normalizeDegrees(deg)` — `js/parashariTables.js` (~line 63).
- `detailedDignity(planetName, sign, degreeInSign)` — `js/interpretations/dignityDetails.js`. Returns `{ tier, ... }` where `tier` is one of `Exalted | Own Sign | Moolatrikona | ... | Debilitated | Neutral` etc.
- `NATURAL_BENEFICS` — `js/interpretations2/ruleEngine.js` (~line 36): `['Jupiter', 'Venus', 'Mercury', 'Moon']`.
- `SHADBALA_PLANETS` — `js/shadbala/shadbalaEngine.js` (~line 36): `['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']` (classical 7 — excludes Rahu/Ketu; used to decide whether `detailedDignity` applies).
- `ASPECT_OFFSETS` — `js/aspects.js` (~line 17): object keyed by planet name (plus `default`) giving aspect offsets (e.g. Mars/Jupiter/Saturn special aspects).
- `computeSingleLongitude(bodyName, date)` — `js/ephemeris.js` (~line 69). Used for transit checks at an arbitrary date.
- `vargaPosition(longitude, vargaKey)` — `js/divisionalCharts.js` (~line 120). Returns `{ sign, longitude }` (synthetic DN longitude for DMS display). Supports `'D1'`, `'D2'` (Hora), `'D30'`, and all other varga keys defined in `VARGA_DEFS`. **D2/Hora access is via this single function, not a separate engine.**

## Dasha utilities (global, no namespace) — `js/dasha/vimshottariDasha.js`
- `buildSubPeriods(startLord, totalYears, startDate)` (~line 37) — builds an array of sub-periods `{ lord, startDate, endDate, years }` (used to generate Antardasha-of-Antardasha = Pratyantardasha, by calling it again on an Antardasha).
- `findCurrentIndex(periods, atDate)` (~line 79) — returns index of the period containing `atDate` (defaults to "now" in all modules observed), or `-1`.
- `state.dasha` shape: array of Mahadasha objects `{ lord, startDate, endDate, antardashas: [{ lord, startDate, endDate, years, ... }] }`. Pratyantardasha is NOT precomputed — every module calls `buildSubPeriods(ad.lord, ad.years, ad.startDate)` on demand to get PD array, then `findCurrentIndex` on that.

## Yoga engine — `window` global: NONE (no `window.*` export)
- Files: `js/yogas/yogaRules.js`, `js/yogas/yogaEngine.js`.
- `js/yogas/yogaEngine.js` defines a plain function (not window-namespaced) that returns `{ rows: [...presentGood, ...presentBad, ...notPresent], presentGood, presentBad, notPresent }` (line ~32). Tab: "Yogas (Planetary Combinations)", `#tabYogas`, output rendered to `#yogasTableOutput`. **Not exposed as a reusable `window.X.refresh()` API for other modules to call** — if a future module needs yoga data it must call the underlying function directly (confirm exact function name before use) or re-derive from `yogaRules.js`'s rule list; do not assume a `window.YogaEngine` global exists.

## Shadbala engine — `js/shadbala/shadbalaEngine.js`
- No `window.*` export found; `SHADBALA_PLANETS` constant lives here (see above) and is used as a plain global elsewhere (`js/ui.js`). Shadbala numeric strength values are read via `state.shadbala` (populated by `js/ui.js`, confirm exact field names per planet before using in a new module — treat as "supporting evidence only if present", per spec guidance).

## Ashtakavarga engine — `js/ashtakvarga.js`
- No `window.*` export. Plain functions `computeBhinnashtakavarga`, `computeAshtakvarga`. Result stored on `state.ashtakvarga` by `js/ui.js`. Use defensively: `if (state.ashtakvarga) { ... }`.

## Health & Recovery Timing safety filter — `window.HealthRecoveryTiming`
File: `js/healthRecoveryTiming/healthRecoveryTimingEngine.js`.
- `NS.scanForForbiddenLanguage = function (text)` (line ~52) — scans a string for forbidden medical-diagnosis/death/treatment-recommendation language, returns a scan result (boolean/match info — confirm exact return shape in file before reuse, but it is truthy/falsy-usable).
- `NS.applySafetyFilter = function (text, isDisclaimerText)` (line ~62) — rewrites a single string if it matches a forbidden pattern (skips rewriting disclaimer text).
- `NS.applySafetyFilterToList = function (list)` (line ~70) — maps `applySafetyFilter` over an array.
- **This filter is domain-specific to medical/death language.** For Wealth Protection module, do NOT reuse `HealthRecoveryTiming`'s filter as the primary safety net (its forbidden-pattern list is medical, not financial) — but it is reasonable to additionally run text through it defensively since it also tends to catch generic death/lifespan phrasing used incorrectly in the 8th-house context. Build the module's own financial-safety scanner (investment/lender/tax-advice/guaranteed-outcome patterns) separately, as instructed.
- Pattern for cross-module checks: `NS.checkCrossModules = function (candidate) { ... if (window[key] && typeof window[key].refresh === 'function') ... }` (line ~234) — the established idiom for defensive cross-module calls used everywhere in this codebase.

## Timing module engine inventory (verified global names + `.refresh()` shapes)
All of these follow the `window.<Name>Timing` (engine) / `window.<Name>TimingUI` (renderer) / `window.<NAME>_TIMING_RULES` (rule array) convention, with ONE confirmed exception (MarriageTiming's `windows` field).

| Module dir | Engine global | Result `.refresh()` candidate field | Shape |
|---|---|---|---|
| majorExpenditureTiming | `window.MajorExpenditureTiming` | `result.candidateWindows` | **Array** of window objects `{ mahadasha, antardasha, pratyantar, startDate, endDate, activatedHouses, matchCount, reasons, transit, strength:{label}, nature, convergenceFactors, cautions, ... }` |
| marriageTiming | `window.MarriageTiming` | `result.windows` | **OBJECT** `{ primary, secondary }` — NOT an array. (Confirmed at `js/marriageTiming/marriageTimingEngine.js` ~line 538: `let windows = { primary: null, secondary: null }; ... windows = NS.buildWindows(converged);`) Any cross-module consumer must check `Array.isArray(result.windows) ? result.windows : [result.windows.primary, result.windows.secondary].filter(Boolean)`. |
| loanDebtReliefTiming | `window.LoanDebtReliefTiming` | likely `result.candidateWindows` (array) — follows majorExpenditureTiming pattern; cross-checked internally against `FinancialGainTiming`, `PropertySaleTiming`, `PropertyTiming`, `VehiclePurchaseTiming`. |
| insuranceProtectionTiming | `window.InsuranceProtectionTiming` | array-based, same architecture family. |
| financialGainTiming | `window.FinancialGainTiming` | array-based (`candidateWindows` or `windows`) — referenced defensively (`result.candidateWindows || result.windows`, `Array.isArray` guard) by majorExpenditureTiming, businessStartTiming, careerTurningPointTiming, homeConstructionTiming, inheritanceLegacyTiming, loanDebtReliefTiming, propertySaleTiming, recognitionAwardTiming. |
| propertyTiming | `window.PropertyTiming` | array-based. |
| propertySaleTiming | `window.PropertySaleTiming` | array-based. |
| inheritanceLegacyTiming | `window.InheritanceLegacyTiming` | array-based. |
| legalMatterTiming | `window.LegalMatterTiming` | array-based. |
| retirementTiming | `window.RetirementTiming` | array-based. |
| homeConstructionTiming | `window.HomeConstructionTiming` | array-based. |
| vehiclePurchaseTiming | `window.VehiclePurchaseTiming` | array-based. |
| businessStartTiming | `window.BusinessStartTiming` | array-based. |
| jobChangeTiming / promotionTiming / careerStartTiming / careerTurningPointTiming / recognitionAwardTiming / higherEducationTiming / foreignTravelTiming / childEducationTiming / childbirthTiming / marriageSeparationDivorceTiming / healthRecoveryTiming | each `window.<Name>Timing` | array-based (`candidateWindows` or `windows`), all following majorExpenditureTiming's defensive-access idiom: `result && (result.candidateWindows || result.windows)`, then `Array.isArray(windowsRaw) ? windowsRaw : null`. |

**GOTCHA — confirmed, applies broadly:** Never assume `result.windows`/`result.candidateWindows` is an array. Always use the established defensive idiom:
```js
const result = window.X.refresh();
const windowsRaw = result && (result.candidateWindows || result.windows);
const windows = Array.isArray(windowsRaw) ? windowsRaw : null;
```
MarriageTiming is the one confirmed object-shaped exception; treat any other module the same way defensively since not all were individually re-verified field-by-field in this pass (time-boxed to grep + the modules read in full: majorExpenditureTiming, marriageTiming, healthRecoveryTiming).

## Cross-check idiom (copy verbatim pattern)
```js
NS.checkXCrossCheck = function (candidate) {
  const mods = [['FinancialGainTiming', 'Financial Gain'], ['LoanDebtReliefTiming', 'Loan/Debt Relief'], ...];
  const hits = [];
  mods.forEach(([key, label]) => {
    if (window[key] && typeof window[key].refresh === 'function') {
      const result = window[key].refresh();
      const windowsRaw = result && (result.candidateWindows || result.windows);
      const windows = Array.isArray(windowsRaw) ? windowsRaw : null;
      const overlap = windows && windows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
      if (overlap) hits.push(label);
    }
  });
  if (!hits.length) return null;
  return { overlapping: true, modules: hits, interpretation: `This period also overlaps ${hits.join(', ')} timing.` };
};
```

## Tab registration
- `index.html` tab button: `<button class="tab-button" id="tabBtn<Name>" data-tab="tab<Name>">Label</button>`.
- Tab panel: `<div class="tab-panel" id="tab<Name>"> ... <div id="<shortprefix>-root"></div> ... </div>`.
- Script tags at the bottom, grouped by module, in dependency order: `<module>Rules.js`, then `<module>Engine.js`, then `<module>UI.js`.
- `js/ui.js` tab-click handler (~line 78 area, inside the tab-button click listener): one line per module —
  `if (btn.dataset.tab === 'tab<Name>' && window.<Name>UI) window.<Name>UI.render();`
- Tab count before this build: **52** `class="tab-button"` elements in `index.html`.

## UI conventions (from majorExpenditureTimingUI.js, representative)
- Single `window.<Name>TimingUI` IIFE with `UI.render()` (reads horizon/context selector state, calls `window.<Name>Timing.refresh(...)`, renders into `#<prefix>-root`) and `UI.init()`.
- `esc()` HTML-escape helper, `fmtDate()` (`DD-MM-YYYY` UTC), `fmtMonthYear()`.
- `badge(label)` + `qualityClass(label)` for color-coded strength/quality spans (css classes `quality-good/neutral/bad` — reuse, don't invent new ones).
- `evidenceDetails(title, items)` renders an expandable `<details class="avp-calc">` block — standard expandable "why" / calculation-trace block class used everywhere (`avp-calc`).
- Each section uses `<div class="output-box pastel-xxx">` (pastel-blue/mint/peach/lavender/yellow) for visual grouping — reuse these classes, do not add new colors.
- Calculation trace block: `<details class="avp-calc"><summary>... TRACE</summary><p style="font-family:monospace;line-height:1.8;">...</p></details>`.
- Rule provenance rendering: iterate `result.rulesUsed` (array of rule objects with `{id, name, category, description, explanation, source, provenance}`), each in its own `<details>`.
- Interaction wiring: `attachInteractions(root, result)` adds change/click listeners that mutate module-local `let` state then call `UI.render()` again (full re-render each time, not diffed).

## Rule file convention
`window.<NAME>_TIMING_RULES` = array of `{ id, category, provenance: 'classical'|'application', name, description, explanation, source }`. IDs are short module-prefixed codes, e.g. `MAJEXP-NATAL-002`.

## Known safety-pattern precedent (non-medical)
majorExpenditureTiming's rule `MAJEXP-NOINVEST-001` / `MAJEXP-NOMEDICAL-001` establish the precedent of having explicit "never recommend an investment/loan" and "never predict a medical emergency" rules in the rules file itself (not just prose) — Wealth Protection should add analogous `WEALTHPROTECTION-NOINVEST-001`, `WEALTHPROTECTION-NODEATH-001` (8th-house safety) rules.

## Yoga engine export (added for Yoga Activation Timing module)
`js/yogas/yogaEngine.js` had no `window.*` export before this module. A
minimal, non-invasive wrapper was appended at the very end of the file
(after its existing `module.exports` block), without touching
`computeYogas()`'s internal logic at all:
```js
if (typeof window !== 'undefined') {
  window.YogaEngine = { detect: computeYogas };
}
```
`window.YogaEngine.detect(planets, ascendant)` returns the exact same
`{rows, presentGood, presentBad, notPresent}` shape `computeYogas()` always
returned; each row is `{key, name, polarity, howDerived, meaning, present,
magnitude, planets, details}` (fields read directly from
`YOGA_DEFINITIONS` in `js/yogas/yogaRules.js`). Prefer reading the
already-computed `state.yogas` (set once per chart generation by `ui.js`)
over calling `window.YogaEngine.detect` again when both are available, to
avoid a redundant recompute. Later modules that need yoga formation data
should reuse `window.YogaEngine.detect` / `state.yogas` rather than adding
another export or reimplementing yoga rules.

Tab count after Yoga Activation Timing module: **55** `class="tab-button"`
elements in `index.html` (up from 54).

## Dasha-Based Life Phase Analysis module (step 3) — notes for later steps
- `window.DashaLifePhase` (engine) / `window.DashaLifePhaseUI` (renderer) /
  `window.DASHALIFEPHASE_RULES` (provenance), `#dashalifephase-root`.
- This is the master Dasha interpretation/synthesis layer. Later modules
  (e.g. a future Life Timeline module) that need a chart-specific,
  house-lordship-derived "theme" for a given Mahadasha/Antardasha should
  call `window.DashaLifePhase.generateMahadashaTheme(md)` /
  `analyzeAntardashaTheme(ad, mdTheme)` rather than re-deriving a theme
  classification from scratch — these are exposed as plain functions on the
  `window.DashaLifePhase` namespace, not just used internally.
- `window.DashaLifePhase.getCurrentPhase()` / `getNextPhase()` give the
  already-computed current/next MD+AD+PD themed breakdown for "what period
  am I in right now" queries; `buildLifeDashboard()` gives one themed row
  per Mahadasha across the whole `state.dasha` array.
- Dasha-hierarchy guard pattern (PD must not override MD/AD without its own
  structural evidence) is implemented as `analyzePratyantarTheme`'s
  `hasOwnStructuralEvidence` check — reusable precedent for any future
  module layering Pratyantardasha-level interpretation on top of
  Mahadasha/Antardasha-level interpretation.
- Tab count after this module: **56** `<button class="tab-button">` elements
  in `index.html` (up from 55). (Note: a shell `grep -c 'class="tab-button"'`
  invocation can undercount if quoting is mishandled — verify with
  `grep -c 'data-tab="tab' index.html` or a Python regex count instead.)

## Important Event Sequence / Life Timeline module (step 4) — notes
- `window.LifeTimeline` (engine) / `window.LifeTimelineUI` (renderer) /
  `window.LIFETIMELINE_RULES` + `window.LIFETIMELINE_MODULE_REGISTRY` +
  `window.LIFETIMELINE_CORRELATION_GROUPS` + `window.LIFETIMELINE_PHASE_TEMPLATES`
  (provenance/static registries), `#lifetimeline-root`. Placed LAST among all
  timing-module tabs/scripts since it consumes essentially everything else.
- This is the master chronological synthesis/visualization layer. It
  integrates all 27 single-event timing modules' `.refresh()` output (every
  module in the discovery inventory's table above except
  YogaActivationTiming/DashaLifePhase, which are themselves synthesis
  layers, not event-candidate-window sources).
- **Dedup/correlation gotcha discovered and fixed here, reusable for any
  future aggregation module**: a naive global union-find over
  "same-correlation-group AND overlapping-or-within-6-months" pairs
  transitively chains far-apart same-module-pair occurrences into one
  unbounded multi-year "mega-cluster" (because many modules emit one
  candidate window per Pratyantardasha across the whole Dasha cycle, so
  distant occurrences of the same pair are each individually close to some
  intermediate occurrence). Fixed with a chronological, edge-bounded greedy
  merge instead (only merge into the most-recently-opened compatible
  cluster, and only when close to *that cluster's current trailing edge*) —
  see `NS.groupCorrelatedEvents` / `NS.buildLifePhaseClusters` in
  `js/lifeTimeline/lifeTimelineEngine.js`. Any future module building
  clusters out of many modules' own frequently-recurring candidate windows
  should use this edge-bounded pattern, not a plain pairwise union-find.
- Tab count after this module: **57** `class="tab-button"` elements (56
  excluding the first/active tab's `class="tab-button active"`, which the
  exact-match grep misses — both a Python regex count of
  `class="tab-button` (prefix match) and a count of `data-tab="tab` agree
  at 57).
