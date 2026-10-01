# Foreign Travel / Foreign Settlement Timing — Implementation Notes

## What was implemented

A new **Foreign Travel / Foreign Settlement Timing** tab (added after
Property Purchase Timing in the sidebar), implementing a strictly
**Parashari/Vimshottari** foreign-travel/residence timing method — no
KP sub-lords, KP significators, KP ruling planets, or Western technique
anywhere.

Architecture directly follows the six prior timing modules — a rule
database, a pure calculation engine, and a rendering-only UI layer, all
reusing existing calculations.

- `js/foreignTravelTiming/foreignTravelTimingRules.js` — `window.FOREIGN_TRAVEL_TIMING_RULES`:
  30 documented rules (`FT-NATAL-*`, `FT-PAIR-*`, `FT-RAHU-FOREIGN`,
  `FT-D4-001`, `FT-D10-001`, `FT-DASHA-001`, `FT-TRANSIT-*`,
  `FT-EVENT-001`, `FT-SETTLEMENT-001`, `FT-CAREER-CROSSCHECK-001`,
  `FT-EDUCATION-001`), each tagged `provenance: 'classical'` or
  `'application'`.
- `js/foreignTravelTiming/foreignTravelTimingEngine.js` — `window.ForeignTravelTiming`:
  all calculation logic, returning plain data only.
- `js/foreignTravelTiming/foreignTravelTimingUI.js` — `window.ForeignTravelTimingUI`:
  rendering, using this app's existing `output-box`/`pastel-*`/
  `.rem-table`/`quality-good/neutral/bad`/`avp-calc` conventions.

### Existing modules reused

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `NATURAL_BENEFICS`, `ASPECT_OFFSETS`,
  `normalizeDegrees`, `SHADBALA_PLANETS`.
- **D4 (Chaturthamsha) and D10 (Dashamsha) — BOTH ALREADY EXISTED, not
  newly built**: `vargaPosition(longitude, 'D4')` and
  `vargaPosition(longitude, 'D10')` from `js/divisionalCharts.js` are
  reused directly — the exact same functions Property Purchase Timing
  uses for D4 and Promotion/Job-Change/Career-Start Timing use for D10.
  No second implementation of either was created. D10 is deliberately
  used ONLY for career-related event types (Foreign Employment), never
  as the primary chart for travel/tourism windows, per the spec's
  Section 14 explicit instruction.
- **Vimshottari Dasha**: `state.dasha` + `buildSubPeriods()` (existing)
  — no second dasha engine.
- **Transit**: `computeSingleLongitude()` (existing).
- **Historical date lookup**: `findCurrentIndex(periods, atDate)` at an
  arbitrary past date.
- **Job Change Timing cross-check (Section 18)**: `checkForeignCareerCrossCheck()`
  reads `window.JobChangeTiming.refresh()` directly and matches by exact
  MD/AD/PD combination — the identical cross-module pattern Job Change
  Timing itself already uses for its own Promotion-Timing comparison.
  No job-change logic was duplicated.

**Education Timing / D24**: this app has no such module. Per the spec's
explicit Section 19 instruction ("do not create a second education
engine"), none was built — `FT-EDUCATION-001` documents this gap
explicitly, identical in spirit to Career Start Timing's own documented
D24 gap, and Foreign Education classification relies on D1 evidence
only (5th/9th/12th, read via the existing natal-promise houses).

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Event Definitions (Section 2) & Core/Supporting Houses (Sections 3-4)

`assessNatalForeignPromise()` classifies the 3rd/4th/6th/9th/10th/11th/
12th houses and Rahu/Ketu/Moon/Jupiter/Saturn/Sun, each with evidence.
Per the spec's explicit instructions: 3rd is never used alone to predict
foreign travel, 9th is never used alone, 12th is never automatically
interpreted as loss, and the 4th is read as the residence anchor against
which "leaving" is measured (not itself a foreign-travel trigger).

## Foreign Connection Signature (Section 5)

Six house-lord relationships are checked (`FT-PAIR-4-12`, `FT-PAIR-9-12`,
`FT-PAIR-10-12`, `FT-PAIR-6-12`, `FT-PAIR-3-9`, `FT-PAIR-9-10`) plus a
Rahu-to-foreign-houses connection (`FT-RAHU-FOREIGN`) — matching
Section 5's explicit combination list. No single connection is ever
treated as sufficient for a settlement classification by itself (see
Settlement Strength below).

## Travel vs. Settlement (Section 6) & Rahu/Ketu (Section 7)

`classifyEvent()` implements a priority chain distinguishing Foreign
Employment (6th+10th+12th+D10) → Foreign Settlement-candidate
(4th+9th+12th+strong D4, explicitly labeled "candidate — requires
sustained/repeated confirmation") → Extended Foreign Stay (4th+9th+12th
without D4 confirmation) → Long-Distance Travel (9th+3rd/12th) → Short/
Temporary Foreign Travel (3rd+9th/12th) → an honest "evidence
insufficient" fallback. Rahu/Ketu are wired as secondary-only transit
confirmations (`FT-TRANSIT-NODES`), never a standalone settlement
trigger, per the spec's explicit Section 7/17 instruction.

## Natal Promise (Section 9) through Transit (Sections 15-17)

Same strict promise-vs-timing separation as every prior module. Window
generation requires Dasha-level relevance first (`buildForeignActivationMap`
bounds Pratyantardasha expansion to already-relevant Antardashas), so a
single Jupiter/Saturn/Rahu/Ketu transit can never alone produce a
candidate window — verified by construction and by the automated purity
check (no weak-qualification windows survive).

## D4 (Section 13) and D10 (Section 14) Confirmation

`assessD4Confirmation()` checks D4 Lagna lord, D4 4th/9th/12th
lords, and Moon/Rahu/Saturn's D4 dignity, producing the five levels the
spec names. `assessD10Confirmation()` is a narrower, three-level
confirmation (D10 confirmation / Partial / Weak) checking only the D10
10th/12th lords — intentionally lighter-weight than the primary D4
check, since the spec frames D10 here as a secondary, career-only
cross-check rather than this module's primary confirmation chart.

## Settlement Strength (Section 22) — explicitly non-numeric

`assessSettlementStrength()` returns exactly the five qualitative labels
the spec names (Strong / Supportive / Temporary-conditional / Travel-
stronger-than-settlement / Mixed), derived from how many candidate
windows classify as settlement-type vs. travel-type plus overall D4
confirmation — **never a numeric score**, and verified in testing that a
single settlement-qualifying window can never by itself produce "Strong
settlement indication" (that requires 2+ such windows AND strong D4).

## Foreign Career Cross-Check (Section 18)

Implemented exactly as specified: when a candidate window's MD/AD/PD
matches one Job Change Timing already flagged, both modules' evidence
are shown together with the spec's own example text ("Job change +
foreign opportunity indicators are active"). No job-change rule logic
was duplicated — this reads the other module's live output.

## Calculation Trace (Section 24) & Rule Provenance (Section 27)

Every candidate window's detail panel renders a dynamically-built
`FOREIGN SETTLEMENT TIMING TRACE` and the Rules Used section tags every
rule `(classical)` or `(application synthesis)`.

## Historical Validation (Section 26)

`validateHistoricalDate(eventDate, eventType)` accepts an event type
(Foreign Travel / Long-Distance Travel / Foreign Education / Foreign Job
/ Foreign Residence / Relocation / Permanent Settlement) alongside the
date, reusing `findCurrentIndex()` at the arbitrary past date.

## UI Structure (Section 23)

Foreign Connection Promise → Foreign Connection Signature → D4
Confirmation → D10 Foreign-Career Confirmation (always shown, labeled as
career-only context) → Current/Relevant Dasha → Settlement Strength →
Foreign Travel/Settlement Windows (table + click-to-expand Detailed
Calculation, including the career cross-check block when it fires +
Timeline) → Historical Validation → Calculation Log → Rules Used.

## Deliberate scope decisions

- **D4/D10 confirmation thresholds** are an internal first cut, not
  independently validated against a named classical text — consistent
  with every other scoring module in this app.
- **No Education Timing/D24 cross-check** (see above) — the spec's own
  explicit instruction, not an oversight; Foreign Education
  classification uses only D1 5th/9th/12th evidence.
- **D10 is deliberately lighter-weight than D4** in this module (3
  levels vs. 5) since it is explicitly a secondary, career-only
  cross-check here, not the primary confirmation chart — documented
  rather than an inconsistency.
- **Settlement Strength requires multiple windows** to reach its
  strongest label, by design, directly implementing the spec's Section
  6 "do not label one short travel period as settlement" and Section 22
  "base this on duration, repetition" instructions.

## Testing performed (Section 28)

- `node --check` on all three new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 33 tabs
  (32 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- Confirmed the engine produces real output for a live test chart:
  natal promise overall (supportive for this chart), D4/D10 levels, 2
  candidate windows, Settlement Strength ("Mixed foreign-residence
  indication" for this chart — an honest, non-forced result), current
  Mahadasha correctly read, 30 rules referenced.
- **Purity checks (automated)**: verified zero `qualification: 'weak'`
  windows leaked into the final list, zero windows prematurely labeled
  "Foreign Settlement" for this chart's actual evidence, and confirmed
  programmatically that "Strong settlement indication" can never be
  produced from a single settlement-type window (`settlementWindowCount
  < 2` guard verified false for the live result).
- Confirmed Historical Foreign Travel/Settlement Validation: added a
  test date (2014-08-15, type "Foreign Travel"), confirmed it renders
  with MD/AD/PD and house-activation columns.
- Confirmed window-click trace, horizon selector (1/2/3/5/10 years), and
  copy-log button all function correctly.
- Confirmed all previously-existing tabs (Marriage, Promotion, Job
  Change, Career Start, Childbirth, Property Purchase Timing, and all
  others) remain fully functional after this addition.

## Known limitations

- D4/D10 confirmation thresholds are an internal first cut, not
  independently validated against a named classical text.
- No Education Timing/D24 cross-check exists, so Foreign Education
  relies on D1 house evidence only.
- The Foreign Career cross-check only matches an exact identical MD/AD/PD
  combination between the two modules; partially-overlapping periods are
  not cross-matched (same documented limitation as Job Change Timing's
  own Promotion cross-check).

## Next recommended event-timing module

With seven life-event timing modules now sharing this architecture
(Marriage, Promotion, Job Change, Career Start, Childbirth, Property
Purchase, Foreign Travel/Settlement), a natural next addition would be
an **Education Timing** module (4th/5th/9th houses, Mercury/Jupiter,
D24/Siddhamsha) — which would retroactively strengthen both Career Start
Timing's and this module's currently-documented education-transition
gaps.
