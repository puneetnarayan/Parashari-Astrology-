# Job Change Timing — Implementation Notes

## What was implemented

A new **Job Change Timing** tab (added after Promotion Timing in the
sidebar), implementing a strictly **Parashari/Vimshottari** job-change
timing method — no KP sub-lords, KP significators, KP ruling planets, or
Western technique anywhere in this module.

Architecture directly follows Promotion Timing (`js/promotionTiming/`),
which itself follows Marriage Timing — a rule database, a pure
calculation engine, and a rendering-only UI layer, all reusing existing
calculations.

- `js/jobChangeTiming/jobChangeTimingRules.js` — `window.JOB_CHANGE_TIMING_RULES`:
  24 documented rules (`JC-NATAL-*`, `JC-PAIR-*`, `JC-D10-001`,
  `JC-DASHA-001`, `JC-TRANSIT-*`, `JC-EVENT-001`, `JC-DISTINGUISH-001`,
  `JC-DELAY-001`), each tagged `provenance: 'classical'` or `'application'`.
- `js/jobChangeTiming/jobChangeTimingEngine.js` — `window.JobChangeTiming`:
  all calculation logic, returning plain data only.
- `js/jobChangeTiming/jobChangeTimingUI.js` — `window.JobChangeTimingUI`:
  rendering, using this app's existing `output-box`/`pastel-*`/
  `.rem-table`/`quality-good/neutral/bad`/`avp-calc` conventions.

### Existing modules reused

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `relationBetween`, `NATURAL_BENEFICS`,
  `ASPECT_OFFSETS`, `normalizeDegrees`, `SHADBALA_PLANETS`.
- **D10 (Dashamsha)**: `vargaPosition(longitude, 'D10')` — same function
  Promotion Timing already uses, extended here to also read D10 6th/12th.
- **Vimshottari Dasha**: `state.dasha` + `buildSubPeriods()` (existing,
  `js/dasha/vimshottariDasha.js`) — no second dasha engine.
- **Transit**: `computeSingleLongitude()` (existing, `js/ephemeris.js`).
- **Historical date lookup**: `findCurrentIndex(periods, atDate)` at an
  arbitrary past date — same mechanism Promotion Timing's historical
  validation uses.
- **Promotion Timing itself** (`window.PromotionTiming.refresh()`): the
  Promotion-vs-Job-Change distinction (Step 18) is implemented by
  directly reading Promotion Timing's own candidate windows and matching
  them by MD/AD/PD against this module's candidates — not by
  re-deriving any promotion logic.

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Event Definition (Step 2)

The engine's event classification (`classifyEvent`) never produces a
"Promotion," "routine salary increment," "appraisal," "additional
responsibility," or "ordinary transfer" label — its only possible
outputs are Employer/Organization Change, Better Job/Career Opportunity,
Role/Function Change, Transfer/Workplace Change, Foreign Job, Job
Separation/Loss, or the explicit non-committal fallback. Those excluded
events remain the responsibility of the existing Promotion Timing
module.

## Core Houses (Step 3) & Natal Promise (Steps 5, 7)

`assessNatalChangePromise()` classifies the 3rd/6th/9th/10th/11th/12th
houses and Saturn/Sun/Mercury/Rahu, each with evidence. Per the spec's
explicit instruction, **12th-house activation is never read as job loss
by itself** — `classifyHouse(12, ...)` only describes separation/exit
context, and the Job Separation/Loss classification additionally
requires `assessAdverseContext()` to return `hasAdverseContext: true`
(at least 2 independent affliction flags) before that label is ever
produced — verified in testing (see below).

Six house-lord relationships are checked (`JC-PAIR-10-6/10-12/10-3/
10-9/10-11/6-12`), matching Step 5's explicit list.

## Change Signature Engine (Step 6)

`buildChangeSignature()` returns a structured, named checklist
(Employer/Organization Change, New Opportunity, Transfer, Foreign Job,
Separation), each with a boolean `present` flag and the specific rules
behind it — never a numeric score, matching Step 6's explicit example.

## Promise vs. Timing (Step 8)

Exactly the same strict separation Marriage Timing and Promotion Timing
already establish: the promise layer (`assessNatalChangePromise`,
`buildChangeSignature`, `assessD10Confirmation`) is date-independent; the
timing layer (`buildChangeActivationMap`, `transitCheckAt`,
`buildCandidateWindows`) is date-dependent. A transit is only ever
checked for already-identified candidate dasha windows, never used alone
to generate one.

## Vimshottari Dasha (Steps 9-11)

`changeFactorsForLord()` + `buildChangeActivationMap()` bound
Pratyantardasha expansion to Antardashas already flagged change-relevant
— the same strategy as Marriage/Promotion Timing, keeping candidate
generation tractable.

## D10 Confirmation (Step 12)

`assessD10Confirmation()` checks D10 Lagna lord, D10 10th/6th/12th/11th
lords/occupants, and Sun/Saturn's D10 dignity, producing the five levels
the spec names: Strong D10 confirmation / D10 confirmation / Partial D10
confirmation / Mixed D10 indication / Weak D10 confirmation.

## Transit (Steps 13-15)

`transitCheckAt()` checks Jupiter (opportunity/expansion, houses
10/11/9/6), Saturn (contextual — responsibility/restructuring/
transition, houses 10/6/11/12 — **never defaulted to delay/loss**, per
the spec's explicit instruction), and Rahu/Ketu (secondary confirmation
only, houses 10/6/12/9), each against the natal 10th lord and Sun/Moon
as well.

## Candidate Windows & Event Classification (Steps 16-17)

`buildCandidateWindows()` merges contiguous same-MD/AD Pratyantardasha
periods (avoiding false date precision) and classifies each via
`classifyEvent()` in a fixed priority order (Separation only with
adverse evidence → Foreign Job → Employer Change → New Opportunity →
Role Change → Transfer → the honest "insufficient evidence" fallback) —
never defaulting to one of the five named events when evidence doesn't
support it.

## Promotion vs. Job Change (Step 18)

`comparePromotionAndJobChange()` is called on every candidate window and
checks `window.PromotionTiming.refresh()`'s own candidate windows for an
MD/AD/PD match. When found, both modules' evidence strength is shown
side by side with the exact dual interpretation the spec's example
text illustrates — implemented as a direct cross-module read, not a
reimplementation of promotion logic. Verified in testing that this
cross-check actually fires for the test chart (`hasPromotionComparison:
true`).

## Calculation Trace (Step 20) & Rule Provenance (Step 23)

Every candidate window's detail panel renders a dynamically-built
`JOB CHANGE TIMING TRACE` (built from the window's actual data) and the
Rules Used section tags every rule `(classical)` or `(application
synthesis)`.

## Historical Validation (Step 22)

`validateHistoricalDate()` reuses `findCurrentIndex()` at an arbitrary
past date to report MD/AD/PD and 3rd/6th/9th/10th/11th/12th/D10
activation for a user-entered historical job-change date — exactly the
table Step 22 requests, never adjusting rules to fit the entered date.

## UI Structure (Step 19)

Career-Change Promise, Current Career Dasha, Candidate Job Change
Windows (table + click-to-expand Detailed Calculation + Timeline),
Historical Job Change Validation, Calculation Log, Rules Used — matching
the spec's requested section list.

## Deliberate scope decisions

- **D10 confirmation thresholds** (points >= 6/4/2/1 for the five named
  levels) are an internally-consistent first cut, not independently
  validated against a named classical text — flagged for manual
  astrological review, consistent with every other scoring module in
  this app.
- **Job Separation/Loss** requires BOTH the Separation signature
  (`6th↔12th` connected AND 12th house itself classified Challenging)
  AND `assessAdverseContext()`'s 2+-flag threshold — a deliberately
  conservative gate, since the spec explicitly warns against classifying
  job loss without adequate evidence.
- **D4 (Chaturthamsha)**, mentioned as optionally relevant to Foreign
  Job in Step 6, was not implemented — this app has no existing D4
  calculation anywhere, and adding one would duplicate the D-chart
  infrastructure rather than reuse it; Foreign Job classification here
  relies on D1 9th/12th/Rahu evidence only, documented as a narrower
  scope than the spec's "D4 where relevant" allowance.

## Testing performed (Step 24)

- `node --check` on all three new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 29 tabs
  (28 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- Confirmed the engine produces real output for a live test chart: natal
  promise overall, D10 level ("Partial D10 confirmation"), 2 candidate
  windows, current Mahadasha correctly read, 24 rules referenced.
- **Purity checks (automated)**: verified that zero windows are labeled
  "Job Separation..." without `hasAdverseContext: true`, and zero
  `qualification: 'weak'` windows leaked into the final candidate list
  (the weak-filter in `buildCandidateWindows` is applied correctly).
- **Promotion vs. Job Change cross-check verified firing**: confirmed
  `promotionComparison` is populated on at least one candidate window
  for the test chart, pulling real data from `window.PromotionTiming`.
- Confirmed Historical Job Change Validation: added a test date
  (2018-03-10), confirmed it renders with MD/AD/PD and house-activation
  columns.
- Confirmed window-click trace, horizon selector (1/2/3/5/10 years), and
  copy-log button all function correctly.
- Confirmed all previously-existing tabs (Marriage Timing, Promotion
  Timing, Relocation, Parashari Analysis, Sudarshana, and all others)
  remain fully functional after this addition.

## Known limitations

- D10 confirmation thresholds and the adverse-context flag count are an
  internal first cut, not independently validated against a named
  classical text.
- D4 (Chaturthamsha) is not used for Foreign Job confirmation (see scope
  decision above) — this app has no existing D4 engine.
- The Promotion vs. Job Change comparison only triggers when the exact
  same MD/AD/PD combination appears as a candidate in both modules;
  overlapping-but-not-identical periods (e.g. a job-change PD that
  starts mid-way through a promotion-flagged AD) are not cross-matched.

## Next recommended event-timing module

Marriage Timing, Promotion Timing, Relocation, and Job Change Timing now
cover four of the life areas this app's Parashari Analysis module
already enumerates. A natural next addition, following the exact same
architecture, would be a **Childbirth/Progeny Timing** module (5th
house/lord, Jupiter as putrakaraka, D7/Saptamsha confirmation,
Vimshottari activation) — or, if career-timing coverage is prioritized
instead, a **Business/Self-Employment Timing** module (7th/10th
relationship, 2nd/11th for capital/gains, distinguishing
entrepreneurship from service-sector job change which this module
already covers).
