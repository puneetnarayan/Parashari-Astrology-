# Marriage Timing — Implementation Notes

## What was implemented

A new **Marriage Timing** tab, inserted between Sudarshana Chakra and
Parashari Analysis in the tab strip, implementing the attached
Marriage Timing spec's full pipeline:

```
Birth Chart -> Marriage Promise -> Marriage Significators ->
Vimshottari Dasha -> Candidate Periods -> Transit Confirmation ->
D1/D9 Confirmation -> Final Marriage Window
```

Architecture follows this session's established pattern (same as the
Parashari Analysis tab): a pure calculation engine
(`js/marriageTiming/marriageTimingEngine.js`, `window.MarriageTiming`)
returning a plain structured result object, a separate rule database
(`js/marriageTiming/marriageTimingRules.js`, `window.MARRIAGE_TIMING_RULES`),
and a rendering-only UI layer
(`js/marriageTiming/marriageTimingUI.js`, `window.MarriageTimingUI`) that
reuses this app's existing shared conventions (`output-box`/`pastel-*`
panels, `.rem-table`, `quality-good/neutral/bad` coloring, `avp-calc`
expandable `<details>`) rather than introducing a new visual language.

### Reuse (nothing recomputed)

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `relationBetween`, `NATURAL_BENEFICS`,
  `ASPECT_OFFSETS`, `normalizeDegrees`, `SHADBALA_PLANETS` — all reused
  directly, exactly as in `birthChart.js`/`aspects.js`/
  `interpretations/dignityDetails.js`.
- **D9 (Navamsha)**: `vargaPosition(longitude, 'D9')`, the same function
  already used by Divisional Charts and Parashari Analysis — no second
  D9 calculator.
- **Vimshottari Dasha**: `state.dasha` (eagerly-computed MD/AD from the
  app's existing `computeVimshottariDasha`) plus `buildSubPeriods()`
  (also existing, in `js/dasha/vimshottariDasha.js`) called on demand
  for Pratyantardasha — exactly the mechanism the spec itself expects
  ("do not create a second independent dasha calculator").
- **Transit**: `computeSingleLongitude(name, date)`, the same ephemeris
  call already used by Ashtakvarga Predictions, Sudarshana Chakra, and
  Parashari Analysis for transits — no new ephemeris code.

No existing tab, calculation, or global was modified except two minimal
additive hooks: one tab-click line in `js/ui.js`, and the new tab
button/panel/script tags in `index.html`.

## Calculation engine (where the logic lives)

`js/marriageTiming/marriageTimingEngine.js`. Key functions, matching the
spec's pipeline:

- `getBirthBasis()` — Section 1 (reuses chart/D9 data, no recomputation).
- `assessSeventhHouse/assessSeventhLord/assessVenus/assessJupiter/
  assessSupportingHouse/assessD9Factor` + `buildPromiseMatrix()` —
  Section 2/3. Each factor is classified **qualitatively**
  (Strong/Supportive/Mixed/Challenging) with its own evidence list; there
  is no single "Marriage Score = X/100". `summarizePromise()` produces
  the "N strong / N neutral / N challenging + interpretation" format the
  spec explicitly requests instead.
- `buildSignificators()` — Section 4. Dynamically classifies every
  planet (house ownership of 2/5/7/11, occupation, conjunction/aspect to
  7th lord or Venus/Jupiter, D9 relevance) — nothing hard-coded per the
  spec's explicit instruction.
- `marriageFactorsForLord()` + `buildDashaCandidates()` — Sections 5-7.
  For every MD/AD in the next 15 years (configurable via the `horizonYears`
  argument), an AD is only expanded into its 9 Pratyantardashas if the MD
  or AD lord is already flagged marriage-relevant — this keeps the
  candidate set bounded (verified: 68 candidates for the test chart,
  not the 9x9x9 = 729 a blind expansion would produce) while never
  excluding a period a relevant MD/AD could produce.
- `transitCheckForCandidate()` — Section 8. Checks Jupiter/Saturn's
  transit sign at each candidate's window midpoint against the natal
  7th house/lord, Venus, and (for Saturn) the active dasha lord's natal
  sign — each with its own reasons list, never a bare checkmark.
- `buildD1D9Confirmation()` — Section 10.
- `buildConvergence()` + `buildWindows()` — Sections 11-12. The
  `MARRIAGE_TIMING_WEIGHTS` object (documented, configurable, with its
  source location cited in-engine) aggregates already-qualified
  candidates for *ranking* only — a candidate that fails its underlying
  rule checks is never promoted by weighting. `mergeAdjacent()` merges
  contiguous Pratyantardasha slivers sharing the same MD/AD into one
  broader window before presenting Primary/Secondary windows, avoiding
  false single-date precision (shown as Month Year -> Month Year).
- `CALCULATION_SEQUENCE` — the 19-step list from Section 13, each with
  an anchor id the UI scrolls to on click.
- `refresh()` — builds the full result object (matching the spec's
  suggested shape: `promise`, `significators`, `dashaCandidates`,
  `transitCandidates`, `d9Confirmation`, `windows`, `primaryWindow`,
  `secondaryWindow`, `calculationSteps`, `rulesUsed`, `calculationLog`),
  cached against `(state.chart, state.dasha)` object identity exactly
  like the Parashari Analysis tab's cache.

## Rules (where they are stored)

`js/marriageTiming/marriageTimingRules.js` — `window.MARRIAGE_TIMING_RULES`,
16 rules (`MT-PROMISE-*`, `MT-D9-001`, `MT-SIG-001`, `MT-DASHA-*`,
`MT-TRANSIT-*`, `MT-CONVERGENCE-001`), each with `id`, `category`, `name`,
`description`, `explanation`, and `source`. The engine references rules
by id (`ruleById()`) rather than embedding rule text inline, so the UI's
Rule Explorer (Section 15) always shows the actual rule object, and only
the rules actually triggered for the current chart are listed.

## Dasha (which engine is reused)

The app's existing `js/dasha/vimshottariDasha.js` — `state.dasha`
(Mahadasha/Antardasha, already computed by `generateChart()`) and
`buildSubPeriods()` for on-demand Pratyantardasha. No second dasha
engine was written.

## D9 (which Navamsha calculation is reused)

`vargaPosition(longitude, 'D9')` from `js/divisionalCharts.js`, the same
function the app's Divisional Charts tab and the Parashari Analysis tab
already use.

## Transit (how Jupiter/Saturn confirmation works)

`computeSingleLongitude(name, date)` from `js/ephemeris.js`, evaluated at
each candidate period's midpoint date, converted to a transit house via
the natal Ascendant and checked against the natal 7th house/lord/Venus
(Jupiter) or the natal sign of the active Pratyantardasha lord (Saturn),
using the existing `ASPECT_OFFSETS` table for aspect checks.

## Final result: how the app gets from birth chart to a marriage window

1. `getBirthBasis()`/`getD9()` read D1 and D9 directly from existing state.
2. `buildPromiseMatrix()` classifies 7th house/lord, Venus, Jupiter,
   2nd/5th/11th houses, and D9 — each independently, with evidence.
3. `buildSignificators()` identifies every planet connected to marriage
   via house ownership/occupation/conjunction/aspect/D9.
4. `buildDashaCandidates()` walks the next 15 years of MD/AD/PD and keeps
   only combinations where at least one level's lord is marriage-relevant.
5. `transitCheckForCandidate()` checks Jupiter/Saturn transit at each
   surviving candidate's midpoint.
6. `buildD1D9Confirmation()` cross-checks D1 vs. D9 for the core factors.
7. `buildConvergence()` scores each candidate by how many independent
   factors (7th lord/Venus/Jupiter connection, house activation,
   Pratyantardasha refinement, Jupiter/Saturn transit, D9 confirmation)
   actually apply — never by a single factor.
8. `buildWindows()` merges contiguous qualifying candidates and ranks
   them by convergence score to produce a Primary and (if a meaningfully
   distinct one exists) Secondary window, each with its own "why" list.

## Deliberate scope decisions

- **Sookshma Dasha (4th level)** was not computed — the spec's own
  Marriage Timing pipeline only requests MD/AD/PD (3 levels); this
  matches the existing app's own Dasha tab, which also only expands to
  PD on demand.
- **Additional transit planets** (beyond Jupiter/Saturn) were not added
  — the spec lists them as primary and allows others "if the
  application's methodology supports them"; this app's existing transit
  methodology (Ashtakvarga Predictions, Sudarshana) only uses Jupiter/
  Saturn/Rahu/Ketu as major transit bodies, and Rahu/Ketu have no
  classical marriage-transit rule documented elsewhere in this app, so
  they were deliberately left out rather than inventing one.
- **Saturn transit interpretation**: classical sources vary on whether a
  Saturn transit to the 7th house/lord is read as delay/obstruction or
  as a maturation/commitment-timing signal. This module documents the
  variation (see rule `MT-TRANSIT-003`) rather than silently picking one
  — it currently treats a qualifying Saturn transit as a *supporting*
  convergence factor, flagged as an interpretive choice, not a settled
  classical consensus.
- **Place of birth display**: the existing app stores only latitude/
  longitude (no place-name field anywhere in the codebase), so Section
  1's "Place of birth" is shown as those coordinates with a note
  explaining why, rather than fabricating a place name.
- **No numeric "Marriage Score"**: per the spec's explicit instruction,
  the Promise section uses qualitative per-factor labels plus a
  strong/neutral/challenging count, not a single score. The only
  numeric score in this tab is the internal, documented
  `MARRIAGE_TIMING_WEIGHTS` convergence score used solely to *rank*
  already-qualified candidate windows against each other — never shown
  as a validated prediction, and never able to qualify a candidate that
  failed its rule-based checks.
- **Sub-tabs**: implemented as a single scrollable page with a clickable
  Calculation Sequence nav (Section 13) that jumps to the relevant
  section, rather than separate sub-tab panels — functionally equivalent
  navigation, consistent with how every other tab in this app
  (Sudarshana, Parashari Analysis) presents multiple sections on one
  page with jump-to-calculation links instead of nested tab controls.
- **Caching**: `MarriageTiming.cache` is invalidated by comparing both
  `state.chart` and `state.dasha` object references (dasha is included
  because a new chart always produces a new dasha array, but this keeps
  the cache correct even if dasha is ever recomputed independently) —
  the same pattern as Parashari Analysis's chart-only cache, extended by
  one reference since this module depends on dasha data directly.

## Testing performed

- `node --check` on all three new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 26 tabs
  (25 existing + the new one) clicked in sequence with zero page/console
  errors (the only console entry is the pre-existing, unrelated
  `favicon.ico` 404).
- Confirmed the engine produces real, chart-derived output for a live
  test chart: 8 promise-matrix rows, 7 significators, 68 bounded dasha
  candidates (not a combinatorial 729), a primary window with its
  convergence breakdown, and a secondary window.
- Confirmed the candidate-period table's click-to-expand interaction
  works (clicking a row opens its detail panel with reasons/transit/
  convergence breakdown).
- Confirmed the Calculation Sequence's step buttons and the "Copy
  Calculation Log" button are present and wired.

## Areas requiring manual astrological review

- The dasha candidate qualification thresholds (weak / candidate /
  strong candidate, based on how many of MD/AD/PD independently qualify)
  and the `MARRIAGE_TIMING_WEIGHTS` values are an internally-consistent
  first cut, not independently validated against a named classical text
  — consistent with every other scoring-based module in this app
  (Sudarshana, Remedies, Parashari Analysis), a practicing astrologer may
  want these retuned.
- The merge-adjacent-candidates logic for Primary/Secondary windows can
  produce a fairly wide window (observed ~2.5 years in testing) when many
  consecutive Pratyantardashas under the same MD/AD all qualify — this is
  intentional (avoids false single-date precision) but a stricter
  "most concentrated period" sub-range within that window is not yet
  separately highlighted, which the spec's Section 12 example mentions
  as optional framing; this could be added as a future refinement.
