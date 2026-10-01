# Financial Gain / Wealth Accumulation Timing — Implementation Notes

## What was implemented

A new **Financial Gain / Wealth Timing** tab (added after Foreign Travel
Timing in the sidebar), implementing a strictly **Parashari/
Vimshottari** financial-timing method — no KP sub-lords, KP
significators, KP ruling planets, or Western technique anywhere. This is
an event-timing module, not financial advice: it never guarantees
profit, predicts a monetary amount, or recommends an investment.

Architecture directly follows the eight prior timing modules — a rule
database, a pure calculation engine, and a rendering-only UI layer, all
reusing existing calculations.

- `js/financialGainTiming/financialGainTimingRules.js` — `window.FINANCIAL_TIMING_RULES`:
  37 documented rules (`FIN-NATAL-*`, `FIN-PAIR-*`, `FIN-BUSINESS-*`,
  `FIN-LEAKAGE-001`, `FIN-D2-001`, `FIN-DASHA-001`, `FIN-TRANSIT-*`,
  `FIN-EVENT-001`, `FIN-GAIN-VS-WEALTH-001`, `FIN-CASHFLOW-NETWORTH-001`,
  `FIN-STRENGTH-001`, `FIN-DISCLAIMER-001`), each tagged
  `provenance: 'classical'` or `'application'`.
- `js/financialGainTiming/financialGainTimingEngine.js` — `window.FinancialGainTiming`:
  all calculation logic, returning plain data only.
- `js/financialGainTiming/financialGainTimingUI.js` — `window.FinancialGainTimingUI`:
  rendering, using this app's existing `output-box`/`pastel-*`/
  `.rem-table`/`quality-good/neutral/bad`/`avp-calc` conventions.

### Existing modules reused

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `NATURAL_BENEFICS`, `ASPECT_OFFSETS`,
  `normalizeDegrees`, `SHADBALA_PLANETS`.
- **D2 (Hora) — ALREADY EXISTED, not newly built**: this app's
  `js/divisionalCharts.js` already defines D2 in
  `DIVISIONAL_CHART_LIST`. This module calls
  `vargaPosition(longitude, 'D2')` directly, the exact same function
  reused by all eight prior timing modules for their own divisional
  confirmation charts (D4/D7/D9/D10). `getD2()` wraps the call in a
  try/catch and reports `{ available: false }` gracefully if it were
  ever unsupported for a given chart, per the spec's Section 12
  instruction to "clearly mark D2 confirmation as unavailable rather
  than fabricating results" — in practice D2 computed successfully for
  the test chart.
- **Vimshottari Dasha**: `state.dasha` + `buildSubPeriods()` (existing)
  — no second dasha engine.
- **Transit**: `computeSingleLongitude()` (existing).
- **Historical date lookup**: `findCurrentIndex(periods, atDate)` at an
  arbitrary past date.

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Event Definitions (Section 3) & Core/Supporting Houses (Sections 4-5)

`assessNatalFinancialPromise()` classifies the 2nd/4th/5th/6th/8th/9th/
10th/11th/12th houses and Jupiter/Venus/Mercury/Sun/Saturn/Moon, each
with full lordship evidence (sign, placement, conjunctions, aspects,
retrograde/combust flags, nakshatra — Section 7's complete lordship
checklist). Per the spec's explicit instructions: the 5th is read
carefully and never equated with guaranteed investment profit; the 8th
is never automatically read as positive; the 12th is read as
counter-factor context only, never automatic loss; and no planet's
natural-significator status alone is used as a timing rule — each
karaka's actual dignity/placement/connections determine its
contribution.

## House Relationship Signatures (Section 6)

Reusable house-pair rules are checked for every named signature group:
Gain Signatures (`FIN-PAIR-2-11/2-9/5-11/9-11/2-5`), Career-Income
Signatures (`FIN-PAIR-10-2/10-11/6-2`), Business-Profit Signature
(`FIN-BUSINESS-2-5-10-11`, requiring 2nd/5th/10th/11th convergence with
Mercury/Jupiter support), Inheritance/Sudden-Wealth Signatures
(`FIN-PAIR-2-8/8-11`), and Financial Leakage/Pressure
(`FIN-LEAKAGE-001`, 2nd/11th/6th with 12th) — reported as context,
**never** labeling a period a "loss period" from this factor alone, per
the spec's explicit Section 6 instruction.

## Natal Financial Promise — six separate indicators (Section 9)

`assessNatalFinancialPromise()` computes six independent natal
indicators (income strength, wealth accumulation, investment potential,
business-profit potential, inheritance/sudden-gain potential, asset
realization potential), each rendered with the spec's own suggested
cautious language style ("The chart shows supportive combinations for
...", "The chart does not provide strong evidence for ..." when the
evidence is weak) — never "you will definitely become rich" or
"guaranteed profit" language, verified by an automated forbidden-phrase
scan (see Testing).

## Financial Event Classification (Section 10)

`classifyEvent()` implements a priority chain producing one of the ten
named types (Inheritance/Family Wealth, Business Profit, Investment
Gain, Property/Asset Realization, Salary/Income Increase, Bonus/Reward,
Sudden Financial Gain, Debt Reduction/Financial Relief, Wealth
Accumulation-candidate, Mixed Financial Improvement), falling through to
an honest "evidence insufficient" label otherwise — never defaulting to
one type when evidence is ambiguous, and sudden gain is never
automatically equated with gambling/speculation (no such equation
appears anywhere in the classification logic).

## Vimshottari Dasha (Section 11) & D2 Confirmation (Section 12)

`financialFactorsForLord()` + `buildFinancialActivationMap()` bound
Pratyantardasha expansion to Antardashas already flagged
financial-relevant — the same strategy as every prior timing module —
and explicitly evaluate (per Section 11's checklist) house ownership,
placement, connections to 2nd/5th/8th/9th/11th, connections to 10th/6th
for employment income, connections to 4th for asset realization, and
connections to 12th for expenditure context. `assessD2Confirmation()`
checks D2 2nd-lord/Lagna-lord dignity and Jupiter/Venus D2 strength,
producing four descriptive confirmation levels.

## Transit Confirmation (Section 13)

`transitCheckAt()` checks Jupiter (2nd/5th/9th/11th, supporting
confirmation only), Saturn (2nd/5th/9th/11th, read as sustained
accumulation/structured income — **never automatically negative**), and
Rahu/Ketu (2nd/8th/11th, secondary only — **Rahu is never automatically
read as meaning sudden wealth**, per the spec's explicit instruction).

## Candidate Window Generation & Window Strength (Sections 14-15)

`buildCandidateWindows()` merges contiguous same-MD/AD Pratyantardasha
periods and computes `assessWindowStrength()` — exactly the five
descriptive categories the spec names (Strongly Supportive / Supportive
/ Moderately Supportive / Mixed / Conditional), **never a numeric
score, star rating, or rank** (verified by an automated regex scan of
the rendered output — see Testing; the only numeric-looking match found
was inside a Rules Used explanation quoting the spec's own prohibited
examples, not an actual displayed score).

## Gain vs. Wealth Accumulation (Section 16)

`assessWealthAccumulationStrength()` mirrors the repeated-activation
requirement already established by Foreign Travel Timing's Settlement
Strength: a single "Wealth Accumulation"-type window is explicitly
reported as "Conditional ... not yet confirmed as sustained," and the
strongest "Supportive" label requires 2+ such windows — verified
programmatically that a single window can never produce the sustained
label.

## Cashflow vs. Net Worth vs. Relief (Section 17)

`classifyDimension()` tags every window with one or more of Cashflow
(11th-driven), Asset/Net-Worth Growth (2nd/4th-driven), or Financial
Relief (6th+12th-driven) — shown explicitly in each window's detail
panel so a bonus, an asset sale, and a debt reduction are never
collapsed into the same generic "financial event."

## Calculation Trace (Section 19) & Result Display (Section 20)

Every candidate window's detail panel renders a dynamically-built
`FINANCIAL TIMING TRACE`, and the top-of-tab Financial Timing Summary
panel matches the spec's suggested structure (Natal Financial Theme,
Current Financial Dasha, Next Supportive Period, Likely Financial Theme,
Gain vs. Wealth Accumulation) verbatim.

## User Controls (Section 21) & No Manual Button (Section 22)

Forecast Period (1/2/3/5/10 years), Event Type filter (All/Income/
Bonus/Business/Investment/Inheritance/Asset/Wealth Accumulation), and
Detail level (Summary/Detailed Calculation Trace) are all implemented as
auto-recalculating `<select>` controls — no manual "Generate" button
exists; the tab calculates automatically on open and on every control
change, exactly matching the app's established tab-open auto-render
pattern already used by all eight prior timing modules.

## Historical Validation (Section 18)

`validateHistoricalDate(eventDate, eventType)` reuses `findCurrentIndex()`
at an arbitrary past date and additionally reports a plain-language
**"what the system would have identified"** comparison string — matching
the spec's explicit "what the system would have identified versus what
actually happened" framing — without ever adjusting any rule to force a
match.

## Rule Provenance (Section 25) & Data Model (Section 26)

Every rule carries `id`/`category`/`description`/`explanation`/`source`/
`provenance` fields, matching the spec's own example `FIN-2-11`-style
registry entry shape. The engine's `refresh()` result object follows the
spec's suggested data model (natalPromise, dashaActivation via
currentDasha, d2Confirmation, transitConfirmation per-window,
candidateWindows, classification per window, explanationTrace via
calculationLog) adapted to this app's established per-module result
shape.

## Deliberate scope decisions

- **D2 confirmation thresholds** are an internal first cut, not
  independently validated against a named classical text — consistent
  with every other scoring module in this app.
- **Reusable shared functions** (Section 27, `getHouseLord()` etc.) were
  not extracted into a cross-module shared file in this pass — each
  timing module in this app (Marriage/Promotion/Job-Change/Career-Start/
  Childbirth/Property/Foreign-Travel/Financial) currently keeps its own
  local `classifyHouse`/`classifyKaraka`/`housesConnected`/
  `planetHouseOwnership` helpers, intentionally duplicated in small,
  readable form rather than introducing a new shared-utilities file this
  late in the series — extracting them now would require touching all
  eight existing modules, which risks exactly the kind of
  regression the spec's own Section 27 warns against ("any refactoring
  must be regression-tested"). Documented here as a candidate for a
  future, deliberate refactor rather than attempted opportunistically in
  this module's own implementation.
- **PDF/report and knowledge-base integration** (mentioned in Section 1's
  inspection list) were not wired up — no existing PDF/report generator
  or knowledge-base writer exists elsewhere in this app for any of the
  eight prior timing modules either, so none was added here for
  consistency.

## Testing performed (Section 29)

- `node --check` on all three new JS files — no syntax errors.
- One real bug was found and fixed during testing: `assetRealizationPotential`
  referenced an undeclared `fourthH` variable, which threw at runtime
  the first time `assessNatalFinancialPromise()` ran; fixed by declaring
  `fourthH` alongside the other house snapshots. Re-verified clean after
  the fix.
- Full headless-browser (Playwright + Chromium) regression: all 34 tabs
  (33 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- **Disclaimer and forbidden-language checks (automated)**: confirmed
  the "not financial or investment advice" notice renders, and scanned
  the full rendered tab text for "guaranteed profit," "definitely become
  rich," "buy/sell this stock," "guaranteed return," "guaranteed
  inheritance" — zero matches.
- **Numeric-score check (automated)**: regex-scanned for `NN/100`,
  `N.N/10`, star characters, and "Rank #N" patterns — the only match was
  inside a Rules Used rule's own explanation text quoting the spec's
  prohibited examples ("no 87/100, no 9.2/10..."), confirmed by manual
  inspection of the match context to be descriptive text about the rule
  itself, not an actual displayed score anywhere in the UI.
- Confirmed the engine produces real output for a live test chart:
  strongest natal theme ("wealthAccumulation"), D2 level ("Partial D2
  confirmation"), 2 candidate windows (both "Property / Asset
  Realization," "Strongly Supportive"), Gain-vs-Wealth label correctly
  reporting "No sustained wealth-accumulation indication... evidence
  points more toward one-time financial gain" for this chart, current
  Mahadasha correctly read, 37 rules referenced.
- **Purity checks (automated)**: verified zero `qualification: 'weak'`
  windows leaked into the final list, and confirmed programmatically
  that "Supportive wealth-accumulation indication" can never be produced
  from fewer than 2 qualifying windows.
- Confirmed the Event Type filter and Forecast Period selector both
  update results without errors, and Detail-level toggle expands/
  collapses the calculation trace correctly.
- Confirmed Historical Validation: added a test date (2017-04-10, type
  "Salary Increase"), confirmed it renders with MD/AD/PD, house
  activation, D2 level, and the "what the system would have identified"
  comparison text.
- Confirmed all previously-existing tabs (Marriage, Promotion, Job
  Change, Career Start, Childbirth, Property Purchase, Foreign Travel/
  Settlement Timing, and all others) remain fully functional after this
  addition.

## Known limitations

- D2 confirmation thresholds are an internal first cut, not
  independently validated against a named classical text.
- Shared timing-utility functions remain duplicated per-module rather
  than extracted into a common library (see Deliberate scope decisions)
  — a documented refactor candidate, not attempted here to avoid
  cross-module regression risk.
- No PDF/report or knowledge-base integration exists for any timing
  module in this app, this one included.

## Next recommended event-timing module

With eight life-event timing modules now sharing this architecture
(Marriage, Promotion, Job Change, Career Start, Childbirth, Property
Purchase, Foreign Travel/Settlement, Financial Gain/Wealth), the
remaining documented gap across multiple modules is **Education Timing**
(4th/5th/9th houses, Mercury/Jupiter, D24/Siddhamsha) — which would
retroactively strengthen both Career Start Timing's and Foreign Travel
Timing's currently-documented education-transition gaps. Alternatively,
given how many modules now exist, a dedicated **cross-module refactor**
to extract the shared `getHouseLord()/getHouseConnections()/
getDashaPeriods()/getTransitWindows()` utilities (Section 27) into one
common file would reduce duplication across all eight-plus modules —
recommended as a standalone, carefully regression-tested effort rather
than bundled into a ninth feature module.
