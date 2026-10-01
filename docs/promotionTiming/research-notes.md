# Promotion Timing — Implementation Notes

## What was implemented

A new **Promotion Timing** tab (added at the end of the tab strip, after
Relocation), implementing a strictly **Parashari/Vimshottari** career
-advancement timing method — no KP sub-lords, KP significators, KP ruling
planets, or Western technique are used anywhere in this module.

Architecture directly follows the Marriage Timing module this app
already has (`js/marriageTiming/`), per the spec's explicit instruction
to study it first: a rule database, a pure calculation engine, and a
rendering-only UI layer, all reusing existing calculations.

- `js/promotionTiming/promotionTimingRules.js` — `window.PROMOTION_TIMING_RULES`:
  20 documented rules (`PT-NATAL-*`, `PT-PAIR-*`, `PT-SUN-CAREER`,
  `PT-SATURN-CAREER`, `PT-YOGA-001`, `PT-D10-001`, `PT-DASHA-*`,
  `PT-TRANSIT-*`, `PT-DELAY-001`, `PT-EVENT-001`), each tagged
  `provenance: 'classical'` or `'application'` so the UI can always show
  which rules are direct classical principles and which are this
  module's own synthesis (Step 21 of the spec).
- `js/promotionTiming/promotionTimingEngine.js` — `window.PromotionTiming`:
  all calculation logic, returning plain data only.
- `js/promotionTiming/promotionTimingUI.js` — `window.PromotionTimingUI`:
  rendering, using this app's existing `output-box`/`pastel-*`/
  `.rem-table`/`quality-good/neutral/bad`/`avp-calc` conventions —
  identical visual language to Marriage Timing and every other tab.

### Reuse (nothing duplicated)

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `relationBetween`, `NATURAL_BENEFICS`,
  `ASPECT_OFFSETS`, `normalizeDegrees`, `SHADBALA_PLANETS` — identical to
  Marriage Timing/Parashari Analysis/Relocation.
- **D10 (Dashamsha)**: `vargaPosition(longitude, 'D10')` — the same
  divisional-chart function already used for D9 in Marriage Timing and
  for every divisional chart in the Divisional Charts tab. No second
  varga calculator.
- **Vimshottari Dasha**: `state.dasha` (eagerly-computed MD/AD) +
  `buildSubPeriods()` (existing, `js/dasha/vimshottariDasha.js`) for
  on-demand Pratyantardasha — exactly the mechanism Marriage Timing
  already established, and exactly what the spec requires ("do not
  create a second Dasha calculation engine").
- **Transit**: `computeSingleLongitude()` (existing, `js/ephemeris.js`)
  — the same ephemeris call used by every transit-aware tab.
- **Yogas**: `state.yogas.rows` (the app's existing Yogas engine output)
  is filtered for career-house involvement (`PT-YOGA-001`) rather than
  re-deriving any yoga rule — a direct reuse, not a reimplementation.
- **Historical date lookup**: `findCurrentIndex(periods, atDate)` already
  accepts an arbitrary date (not just "now"), so historical validation
  (Step 17) reuses it directly rather than writing a new period-lookup
  function.

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Natal Career Promise (Step 3-4)

`assessNatalCareerPromise()` classifies the 10th/11th/2nd/6th houses and
Sun/Saturn/Jupiter into Strong/Supporting/Moderate/Neutral/Challenging,
each with its rule id and evidence list. Per the spec's explicit
instruction, **6th-house activation is never read as promotion by
itself** — `classifyHouse(6, ...)` only describes service/competition/
workload context, and the Promotion Signature / event-classification
logic (below) only lets 6th-house evidence contribute to a classification
when it co-occurs with 10th/11th evidence. The 10th↔2nd connection
(`tenthSecondConnected`) is computed separately and surfaced explicitly
so the UI can distinguish promotion-with-raise from promotion-without-
raise from raise-without-promotion, per Step 3's 2nd-house instruction.

Sun and Saturn are classified by their **actual** dignity/placement/
connections (`classifyKaraka`) — neither is ever assumed positive or
negative by default, per the spec's explicit instruction for both.

## Promotion Signature Engine (Step 5)

`buildPromotionSignature()` returns a checklist of named evidence items
(10th↔11th, 10th↔2nd, 10th/11th↔6th, Sun↔10th/11th, Saturn↔10th/6th/11th,
career-relevant Raja Yoga, D10 confirmation level), each with a boolean
`present` flag and its own text — **never a numeric score**, directly
matching Step 5's explicit instruction and example checklist format.

## Separating Promise from Timing (Step 6)

The engine strictly separates `assessNatalCareerPromise()` /
`buildPromotionSignature()` / `assessD10Confirmation()` (promise layer,
date-independent) from `buildCareerActivationMap()` /
`buildCandidateWindows()` / `transitCheckAt()` (timing layer,
date-dependent). A candidate window is only ever generated from the
timing layer, and `classifyEvent()` requires *multiple* converging
timing-layer and promise-layer factors before producing anything other
than "Career Activation (evidence insufficient for a specific
classification)" — verified by a direct test (see Testing) that no
window is labeled with a "Promotion..." event unless it has both 10th
and 11th connection AND D10 confirmation, never from a single transit or
a single house activation alone.

## Vimshottari Dasha — Career Activation Map (Steps 7-10)

`careerFactorsForLord()` evaluates a single dasha lord's connection to
the career houses/significators/D10; `buildCareerActivationMap()` walks
the configurable horizon (1/2/3/5/10 years, default 5) and only expands
an Antardasha into its 9 Pratyantardashas if the MD or AD lord is already
career-relevant — the same bounding strategy Marriage Timing uses, which
keeps candidate generation tractable without ever excluding a period a
relevant MD/AD could produce.

## D10 Confirmation (Step 11)

`assessD10Confirmation()` checks D10 Lagna lord, D10 10th/11th
lords/occupants, and Sun/Saturn's D10 dignity, producing exactly the
four levels the spec names: Strong D10 confirmation / D10 confirmation /
Partial D10 confirmation / Mixed D10 indication — with the full evidence
list always shown, and explicitly documented (and shown in the UI) as a
confirmation layer that never replaces D1.

## Jupiter & Saturn Transit (Steps 12-13)

`transitCheckAt(date)` checks each body's transit sign against the natal
10th/11th houses, their lords, and natal Sun/Moon. Per the spec's
explicit instruction, **Saturn is never automatically interpreted as
delay** — `PT-TRANSIT-SAT`'s rule text and the engine's own classification
logic treat an active Saturn transit as a potential promotion/seniority/
responsibility/restructuring signal, not an obstruction by default. Both
transits are wired as supporting confirmations only (contributing to
`convergenceFactors`, never able to single-handedly produce a candidate
window, since window generation requires Dasha-level relevance first).

## Candidate Promotion Windows & Event Classification (Steps 14-15)

`buildCandidateWindows(horizonYears)` merges contiguous Pratyantardasha
periods sharing the same MD/AD into broader windows (same technique as
Marriage Timing, avoiding false single-date precision), filters out
`qualification === 'weak'` windows, and classifies each surviving window
via `classifyEvent()` into: Promotion/Designation Rise, Promotion +
Financial Improvement, Responsibility Increase, Recognition/Visibility,
Job Change (unconfirmed), or the explicit non-committal "Career
Activation" fallback — never defaulting to "Promotion" when evidence is
ambiguous.

## Delay/Obstruction Analysis (Step 16)

`assessDelayFactors()` flags 8th/12th-adjacent conditions (via Dusthana
placement of the 10th/11th lords), weak D10, an afflicted current dasha
lord, and 6th-house activation without 10th/11th support, producing an
interpretation that explicitly never states promotion is "permanently
denied" — only that a given period's manifestation is less certain.

## Historical Promotion Validation (Step 17)

`validateHistoricalDate(eventDate)` reuses `findCurrentIndex()` at an
arbitrary past date (not "now") to find the MD/AD/PD active on that date,
then reports 10th/11th/2nd/6th activation, D10 level, and Jupiter/Saturn
transit state for that date — exactly the table the spec's Step 17
requests. This never adjusts any rule to fit an entered date; it only
reports what the existing rules would have shown.

## Calculation Trace (Step 19) & Rule Provenance (Step 21)

Every candidate window's detail panel renders a dynamically-generated
`PROMOTION TIMING TRACE` (the exact chain format the spec requests, built
from the window's actual data, not a static template) and the Rules Used
section tags every rule `(classical)` or `(application synthesis)` so
the UI never presents an application heuristic as a direct classical
quotation.

## UI Structure (Step 18)

Career Promise, Current Career Dasha, Promotion Windows (table +
click-to-expand Detailed Calculation + Timeline), Historical Promotion
Validation, Calculation Log, and Rules Used — matching the spec's
requested section list, styled with this app's existing conventions.

## Deliberate scope decisions

- **Search horizon selector** offers exactly the 5 options the spec
  lists (1/2/3/5/10 years), defaulting to 5 years.
- **D10 confirmation thresholds** (points >= 5/3/1 for the four named
  levels) are an internally-consistent first cut, not independently
  validated against a named classical text — flagged for manual
  astrological review, consistent with every other scoring module in
  this app.
- **Event classification combinations** (Step 15) are implemented
  exactly as the spec lists them (10th+11th+D10 for Promotion/Designation
  Rise, etc.); where a window matches none of the named combinations, the
  engine reports the honest "Career Activation (evidence insufficient)"
  fallback rather than forcing it into one of the five named categories.
- **Job Change classification** is intentionally qualified
  ("unconfirmed — evaluate change indicators manually") since this app
  has no existing module for detecting job-change-specific combinations
  (e.g. 10th-lord-in-12th-from-10th conventions some traditions use) —
  documented here rather than inventing an unvalidated rule.

## Testing performed (Step 22)

- `node --check` on all three new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 28 tabs
  (27 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- Confirmed the engine produces real, chart-derived output for a live
  test chart: natal promise classification, D10 level ("Partial D10
  confirmation"), 7 signature-evidence items (2 present), 2 candidate
  windows over a 5-year horizon, current Mahadasha correctly read.
- **Purity check (automated, not just visual)**: verified programmatically
  that zero candidate windows carry a "Promotion..." event label unless
  they have 10th connection AND 11th connection AND D10 confirmation —
  i.e., confirmed no promotion is predicted from 10th-activation alone,
  a single transit alone, or 6th-house activation alone.
- Confirmed Historical Promotion Validation: added a test date
  (2015-06-15), confirmed it correctly resolved to the MD/AD/PD active on
  that historical date (via `findCurrentIndex` at an arbitrary past date)
  and displayed 10th/11th/2nd/D10/Jupiter/Saturn activation for it.
- Confirmed the window detail click-to-expand renders a dynamically-built
  calculation trace, the horizon selector (1/2/3/5/10 years) updates
  results, and the "Copy Calculation Log" button is present and wired.
- Confirmed all previously-existing tabs (including the two most
  recently added, Marriage Timing and Relocation) remain fully
  functional after this addition.

## Known limitations

- D10 confirmation thresholds and the delay/obstruction flag count are
  an internal first cut, not independently validated against a named
  classical text (see Deliberate scope decisions).
- Job Change detection has no dedicated rule set in this app yet and is
  reported as unconfirmed rather than definitively classified.
- Saturn's transit role is read generically as "supporting" when active;
  distinguishing its promotion-vs-seniority-vs-restructuring nuance
  further would need additional classical source rules not currently
  documented anywhere in this app.

## Next recommended improvement

Add a dedicated Job Change signature (e.g. involving the 10th lord's
relationship with the 12th-from-10th, or Rahu/Ketu connections to the
10th) once a reliable classical source for that specific distinction is
identified — following the same "document the gap rather than invent
the rule" approach used throughout this app.
