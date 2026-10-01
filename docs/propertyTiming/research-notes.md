# Property Purchase Timing — Implementation Notes

## What was implemented

A new **Property Purchase Timing** tab (added after Childbirth Timing in
the sidebar), implementing a strictly **Parashari/Vimshottari** property-
acquisition timing method — no KP sub-lords, KP significators, KP ruling
planets, or Western technique anywhere.

Architecture directly follows Childbirth Timing / Career Start Timing /
Job Change Timing / Promotion Timing / Marriage Timing — a rule
database, a pure calculation engine, and a rendering-only UI layer, all
reusing existing calculations.

- `js/propertyTiming/propertyTimingRules.js` — `window.PROPERTY_TIMING_RULES`:
  21 documented rules (`PP-NATAL-*`, `PP-PAIR-*`, `PP-MARS-PROPERTY`,
  `PP-D4-001`, `PP-DASHA-001`, `PP-TRANSIT-*`, `PP-EVENT-001`,
  `PP-LOAN-001`, `PP-WEALTH-001`), each tagged `provenance: 'classical'`
  or `'application'`.
- `js/propertyTiming/propertyTimingEngine.js` — `window.PropertyTiming`:
  all calculation logic, returning plain data only.
- `js/propertyTiming/propertyTimingUI.js` — `window.PropertyTimingUI`:
  rendering, using this app's existing `output-box`/`pastel-*`/
  `.rem-table`/`quality-good/neutral/bad`/`avp-calc` conventions.

### Existing modules reused

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `NATURAL_BENEFICS`, `ASPECT_OFFSETS`,
  `normalizeDegrees`, `SHADBALA_PLANETS`.
- **D4 (Chaturthamsha) — ALREADY EXISTED, not newly built**: this app's
  `js/divisionalCharts.js` already defines D4 in `DIVISIONAL_CHART_LIST`
  with its own classical starting-sign rule (`startFn: s => s` —
  Chaturthamsa always starts from the planet's own sign). This module
  calls `vargaPosition(longitude, 'D4')` directly, the exact same
  function Childbirth/Career-Start/Job-Change/Promotion Timing use for
  D7/D10, and Marriage Timing uses for D9 — no second D4 implementation
  was created.
- **Vimshottari Dasha**: `state.dasha` + `buildSubPeriods()` (existing)
  — no second dasha engine.
- **Transit**: `computeSingleLongitude()` (existing).
- **Historical date lookup**: `findCurrentIndex(periods, atDate)` at an
  arbitrary past date — same mechanism used by every prior timing
  module's historical validation.

**Financial/Wealth Timing**: this app has no such module or a D2
(Hora)-based wealth-timing engine. Per the spec's explicit Step 18
instruction ("if financial timing is not implemented, do not create a
duplicate wealth engine"), none was built — `PP-WEALTH-001` documents
this gap explicitly, and the module uses only the already-computed
2nd-house/2nd-lord evidence as the available proxy for financial-
capacity context.

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Core Houses (Sections 3-4) & Natal Promise (Section 6)

`assessNatalPropertyPromise()` classifies the 2nd/4th/8th/11th/12th
houses and Mars/Venus/Moon/Jupiter/Saturn, each with evidence. Two
house-lord relationships are checked (`PP-PAIR-4-11`, `PP-PAIR-4-2`)
plus a Mars-to-4th connection (`PP-MARS-PROPERTY`). The 5th/9th/10th
supporting houses named in Section 4 are read only through their role in
event classification (5th/9th feeding "Inheritance"/fortune context,
10th reserved for commercial-property distinction in a future
refinement) rather than duplicated as separate scored promise factors —
documented here as a scope note rather than silently dropped.

8th and 12th house involvement (`PP-NATAL-008`, `PP-NATAL-012`) are
classified descriptively but — per the spec's explicit "do not
automatically interpret 8th as negative" / "12th alone must not mean
property loss" instructions — neither is wired as an automatic negative
contributor to the overall promise score; they inform event
classification (8th → Inheritance path, 12th → Sale/Expenditure path)
instead.

## Purchase vs. Other Property Events (Section 7) & Loan/Financing (Section 8)

`classifyEvent()` implements the full Section 7 + Section 17 priority
chain: Inheritance (4th+8th) is checked before Construction
(Mars+Saturn+4th), before Land Purchase (Mars/Saturn+4th+2nd/11th),
before House/Apartment Purchase (Venus/Moon/Jupiter+4th+2nd/11th),
before generic Property Purchase (4th+2nd+11th+D4), before
Possession/Registration (4th+11th+D4+transit), before Sale/Expenditure
(12th+4th without 11th) — falling through to an honest
"evidence insufficient" label otherwise. `assessNatalPropertyPromise()`
separately reports `loanIndicatorsActive` (`PP-LOAN-001`) whenever 6th
or 8th connects to the 4th, displayed as a co-factor ("Property
acquisition is supported. Financing/loan indicators are also active.")
exactly matching the spec's Section 8 example output — never as a
penalty.

## Promise vs. Timing (implicit throughout, per every prior module's pattern)

Same strict separation as every prior timing module: the promise layer
(`assessNatalPropertyPromise`, `assessD4Confirmation`) is
date-independent; the timing layer (`buildPropertyActivationMap`,
`transitCheckAt`, `buildCandidateWindows`) is date-dependent. Window
generation requires Dasha-level relevance first, so a Jupiter or Mars
transit alone can never produce a candidate window — verified by
construction and by the automated purity check (see Testing).

## Vimshottari Dasha (Sections 9-11)

`propertyFactorsForLord()` + `buildPropertyActivationMap()` bound
Pratyantardasha expansion to Antardashas already flagged
property-relevant — the same strategy as every prior timing module. Each
candidate also records `lordsInvolved` (the MD/AD/PD lord names) so
`classifyEvent()` can check for Mars/Saturn/Venus/Moon/Jupiter
involvement directly from the dasha chain, per Section 10's explicit
"Mars MD/AD with strong 4th connection" style combinations.

## D4 Confirmation (Section 12)

`assessD4Confirmation()` checks D4 Lagna lord, D4 4th/2nd/11th
lords/occupants, and Mars/Venus/Moon's D4 dignity, producing the five
levels the spec names: Strong / D4 confirmation / Partial / Mixed / Weak.

## Transit (Sections 13-15)

`transitCheckAt()` checks Jupiter (supporting expansion/acquisition,
houses 4/2/11 — **never used alone**), Saturn (contextual —
land/construction/long-term asset/formal registration, houses 4/2/11 —
**never defaulted to denial**), and Mars (secondary, house 4 only, for
land/construction/physical activity — **never alone sufficient**), each
also checked against the natal 4th lord and Moon.

## Candidate Windows (Section 16)

`buildCandidateWindows()` merges contiguous same-MD/AD Pratyantardasha
periods (avoiding false date precision) and classifies each via
`classifyEvent()`.

## Calculation Trace (Section 20) & Rule Provenance (Section 23)

Every candidate window's detail panel renders a dynamically-built
`PROPERTY PURCHASE TIMING TRACE` and the Rules Used section tags every
rule `(classical)` or `(application synthesis)`.

## Historical Validation (Section 22)

`validateHistoricalDate(eventDate, eventType)` accepts an event type
(Property Purchase / Land Purchase / Registration / Possession /
Construction Start / Property Sale) alongside the date, reusing
`findCurrentIndex()` at the arbitrary past date.

## UI Structure (Section 19)

Property Acquisition Promise (with the loan co-factor note) → D4
Confirmation → Current/Relevant Dasha → Property Windows (table +
click-to-expand Detailed Calculation + Property Timeline) → Historical
Property Event Validation → Calculation Log → Rules Used.

## Deliberate scope decisions

- **D4 confirmation thresholds** are an internal first cut, not
  independently validated against a named classical text — consistent
  with every other scoring module in this app.
- **No Financial/Wealth Timing cross-check** (see above) — the spec's
  own explicit instruction, not an oversight; property timing remains
  fully functional without it.
- **5th/9th/10th supporting houses** are used within event
  classification (9th context for Inheritance, Mars/Saturn for
  land/construction) rather than as three additional standalone scored
  promise factors, to keep the natal-promise table at a readable size
  matching the spec's own Section 21 UI house list (2nd/4th/8th/11th/
  12th) — documented here as a scope note rather than a silent omission.
- **8th/12th are never scored negative** (see Core Houses section) — a
  deliberate, conservative choice directly implementing the spec's two
  explicit "do not automatically interpret as negative/loss" rules.

## Testing performed (Section 24)

- `node --check` on all three new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 32 tabs
  (31 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- Confirmed the engine produces real output for a live test chart:
  natal promise overall, loan-indicator co-factor correctly fired
  (`loanIndicatorsActive: true`), D4 level ("Weak D4 confirmation" for
  this chart — an honest result), 2 candidate windows, current
  Mahadasha correctly read, 21 rules referenced.
- **Purity checks (automated)**: verified zero `qualification: 'weak'`
  windows leaked into the final list, zero "Property Purchase"/"Land
  Purchase"/"House/Apartment Purchase" labels without a verified
  4th-house connection, zero windows double-labeled as both
  "Inheritance" and "Purchase," and zero sale/expenditure windows
  labeled with "loss" language.
- Confirmed Historical Property Event Validation: added a test date
  (2019-11-05, type "Property Purchase"), confirmed it renders with
  MD/AD/PD and house-activation columns.
- Confirmed window-click trace, horizon selector (1/2/3/5/10 years), and
  copy-log button all function correctly.
- Confirmed all previously-existing tabs (Marriage Timing, Promotion
  Timing, Job Change Timing, Career Start Timing, Childbirth Timing, and
  all others) remain fully functional after this addition.

## Known limitations

- D4 confirmation thresholds are an internal first cut, not
  independently validated against a named classical text.
- No Financial/Wealth Timing cross-check exists in this app, so
  financial-capacity context relies on 2nd-house evidence only, a
  narrower proxy than a dedicated wealth-timing module would provide.
- 5th/9th/10th are used only within event classification, not as
  separately displayed natal-promise rows — a deliberate scope choice
  (see above) rather than a gap.

## Next recommended event-timing module

With Marriage, Promotion, Job Change, Career Start, Childbirth, and now
Property Purchase Timing covering six major life-event categories using
this same architecture, a natural next addition would be a **Foreign
Travel/Relocation-Abroad Timing** module (12th house, Rahu, D9's role in
foreign residence already partially explored in the Relocation tab) or a
**Financial/Wealth Timing** module (2nd/5th/9th/11th, D2/Hora) — which
would also retroactively strengthen this module's currently-documented
financial-capacity cross-check gap.
