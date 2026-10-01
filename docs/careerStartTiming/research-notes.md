# Career Start / First Job Timing — Implementation Notes

## What was implemented

A new **Career Start / First Job Timing** tab (added after Job Change
Timing in the sidebar), implementing a strictly **Parashari/
Vimshottari** career-entry timing method — no KP sub-lords, KP
significators, KP ruling planets, or Western technique anywhere.

Architecture directly follows Job Change Timing / Promotion Timing /
Marriage Timing — a rule database, a pure calculation engine, and a
rendering-only UI layer, all reusing existing calculations.

- `js/careerStartTiming/careerStartTimingRules.js` — `window.CAREER_START_TIMING_RULES`:
  25 documented rules (`CS-NATAL-*`, `CS-PAIR-*`, `CS-BUSINESS-7-10-11`,
  `CS-D10-001`, `CS-DASHA-001`, `CS-TRANSIT-*`, `CS-EVENT-001`,
  `CS-SEARCH-JOIN-001`, `CS-EDUCATION-001`), each tagged
  `provenance: 'classical'` or `'application'`.
- `js/careerStartTiming/careerStartTimingEngine.js` — `window.CareerStartTiming`:
  all calculation logic, returning plain data only.
- `js/careerStartTiming/careerStartTimingUI.js` — `window.CareerStartTimingUI`:
  rendering, using this app's existing `output-box`/`pastel-*`/
  `.rem-table`/`quality-good/neutral/bad`/`avp-calc` conventions.

### Existing modules reused

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `NATURAL_BENEFICS`, `ASPECT_OFFSETS`,
  `normalizeDegrees`, `SHADBALA_PLANETS`.
- **D10 (Dashamsha)**: `vargaPosition(longitude, 'D10')` — same function
  Promotion Timing and Job Change Timing already use.
- **Vimshottari Dasha**: `state.dasha` + `buildSubPeriods()` (existing)
  — no second dasha engine.
- **Transit**: `computeSingleLongitude()` (existing).
- **Historical date lookup**: `findCurrentIndex(periods, atDate)` at an
  arbitrary past date — same mechanism used by every prior timing
  module's historical validation.

**Education/D24**: this app has no Education Timing module or D24
(Siddhamsha) calculation. Per the spec's explicit Step 15 instruction
("if education timing is not available, do not create a duplicate
education engine"), no such engine was built — the Education-to-Career
Transition UI section documents this gap explicitly and uses only the
existing 9th-lord↔10th-lord and 5th↔10th house-relationship evidence
(already computed as part of the natal promise) as the available proxy.

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Core Houses (Step 3) & Natal Promise (Step 5)

`assessNatalCareerStartPromise()` classifies the 2nd/3rd/6th/9th/10th/
11th houses and Saturn/Sun/Mercury/Jupiter, each with evidence. Seven
house-lord relationships are checked (`CS-PAIR-6-10/6-11/10-11/2-6-10/
2-11/9-10/5-9-10`), matching Step 5's explicit list (including the 5th/
9th↔10th connection used as the education-to-career proxy).

## Employment vs. Business (Step 6)

`assessEmploymentVsBusiness()` scores Employment evidence (6th↔10th,
6th↔11th, 6th-house strength, Saturn) against Business evidence (7th↔10th,
7th↔11th, Mercury, Jupiter) independently, producing exactly the three
possible outcomes the spec requires: `Employment / Service`,
`Business / Self-Employment`, or `Mixed employment / independent-career
indications` — with a fourth honest fallback,
`Insufficient evidence to distinguish employment from business`, used
when neither side reaches the evidence threshold (verified in testing:
this is what the test chart actually produced, since forcing a
classification without sufficient evidence is explicitly prohibited by
the spec).

## Promise vs. Timing (Step 8)

Same strict separation as every prior timing module: the promise layer
(`assessNatalCareerStartPromise`, `assessEmploymentVsBusiness`,
`assessD10Confirmation`) is date-independent; the timing layer
(`buildCareerStartActivationMap`, `transitCheckAt`,
`buildCandidateWindows`) is date-dependent. A transit is only ever
checked against already-identified candidate dasha windows.

## Vimshottari Dasha (Steps 9-11)

`careerStartFactorsForLord()` + `buildCareerStartActivationMap()` bound
Pratyantardasha expansion to Antardashas already flagged career-start-
relevant — the same strategy as every prior timing module.

## D10 Confirmation (Step 12)

`assessD10Confirmation()` checks D10 Lagna lord, D10 6th/10th/11th
lords/occupants, and Sun/Saturn's D10 dignity, producing the five levels
the spec names.

## Transit (Steps 13-14)

`transitCheckAt()` checks Jupiter (opportunity/growth, houses 10/6/11/9)
and Saturn (contextual — structured employment/formalization/
responsibility, houses 6/10/11 — **never defaulted to delay**, per the
spec's explicit instruction), each against the natal 10th lord and
Sun/Moon.

## Candidate Windows, Event Classification & Stage (Steps 16-18)

`buildCandidateWindows()` merges contiguous same-MD/AD Pratyantardasha
periods and classifies each via `classifyEvent()` (First Salaried
Employment / First Major Professional Appointment / Internship /
Business-or-Mixed / honest fallback) AND `classifyStage()` (Search &
Application vs. Selection/Joining) — two independent, complementary
classifications per window, exactly matching the spec's Step 17/18
distinction.

## Calculation Trace (Step 20) & Rule Provenance (Step 23)

Every candidate window's detail panel renders a dynamically-built
`FIRST JOB TIMING TRACE` and the Rules Used section tags every rule
`(classical)` or `(application synthesis)`.

## Historical Validation (Step 22)

`validateHistoricalDate(eventDate, eventType)` accepts an optional event
type (First Job / Internship / First Professional Appointment / Business
Start) alongside the date, reusing `findCurrentIndex()` at the arbitrary
past date — matching the spec's extended historical-validation table
(2nd/6th/9th/10th/11th/D10/Jupiter/Saturn columns plus Event Type).

## UI Structure (Step 19)

Career Entry Promise, Employment vs. Business, Education-to-Career
Transition (documents the scope gap), D10 Confirmation, Current/Relevant
Dasha, First Job Windows (table + click-to-expand Detailed Calculation +
Career Entry Timeline), Historical Career Start Validation, Calculation
Log, Rules Used.

## Deliberate scope decisions

- **D10 confirmation thresholds** are an internal first cut, not
  independently validated against a named classical text — consistent
  with every other scoring module in this app.
- **No Education Timing / D24 engine** was created (see above) — this is
  the spec's own explicit instruction, not an oversight.
- **Search horizon default** is "next 5 years from now" rather than "from
  the end of education through 5 years," since this app has no stored
  education-completion date anywhere to anchor from; the horizon selector
  (1/2/3/5/10 years) lets the user adjust the window manually to
  approximate their own timeline.
- **Career Entry Type "Insufficient evidence"** fallback is deliberately
  included (not in the spec's literal Section 6 list) to honor the
  spec's own instruction "do not force a single classification without
  sufficient evidence" — verified this is what actually renders for a
  chart with weak employment/business signatures, rather than the engine
  guessing.

## Testing performed (Step 24)

- `node --check` on all three new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 30 tabs
  (29 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- Confirmed the engine produces real output for a live test chart: natal
  promise overall, Career Entry Type ("Insufficient evidence to
  distinguish employment from business" for this chart — an honest
  result, not a forced guess), D10 level, 2 candidate windows, current
  Mahadasha correctly read, 25 rules referenced.
- **Purity checks (automated)**: verified zero windows are labeled
  "First Salaried Employment" without a verified 6th-house connection,
  zero `qualification: 'weak'` windows leaked into the final list, and
  zero windows were mislabeled "Business" when the chart's own
  Employment-vs-Business classification said "Employment / Service."
- Confirmed Historical Career Start Validation: added a test date
  (2012-07-01, type "First Job"), confirmed it renders with MD/AD/PD and
  house-activation columns.
- Confirmed window-click trace (showing both Event Classification and
  Search/Joining Stage), horizon selector, and copy-log button all
  function correctly.
- Confirmed all previously-existing tabs (Marriage Timing, Promotion
  Timing, Job Change Timing, Relocation, and all others) remain fully
  functional after this addition.

## Known limitations

- D10 confirmation thresholds are an internal first cut, not
  independently validated against a named classical text.
- No Education Timing/D24 cross-check exists in this app — the
  education-to-career transition relies on 9th/5th↔10th house evidence
  only, a narrower proxy than a dedicated education-completion timeline
  would provide.
- Search horizon is "next N years from now," not anchored to an actual
  stored education-completion date, since no such date is tracked
  anywhere in this application.

## Next recommended event-timing module

With Marriage Timing, Promotion Timing, Job Change Timing, and Career
Start Timing now covering four major life-event categories using this
same architecture, a natural next addition would be an **Education
Timing** module (4th/5th/9th houses, Mercury/Jupiter, D24/Siddhamsha) —
which would also let Career Start Timing's "Education-to-Career
Transition" section (currently a documented gap) cross-check against a
real education-completion window instead of the current house-
relationship proxy.
