# Loan / Debt Relief Timing — Implementation Notes

## What was implemented

A new event-timing module, **Loan / Debt Relief Timing** (`loanDebtReliefTiming`), covering loan requirement/borrowing, loan approval/sanction, debt accumulation, debt restructuring, repayment acceleration, debt-burden reduction, loan closure, debt settlement, and property/vehicle/business-debt resolution. Explicitly distinct from Financial Gain Timing (income/profit/wealth realization) and Property Purchase Timing (acquisition, though a purchase may involve a loan). Core flow: Natal Debt Factors → Dasha → Financial Confirmation (D2, optional) → Transit → Related Events → Event Classification → Final Window.

## Existing components reused (confirmed by code inspection)

- Chart/dignity primitives: `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS`, `ASPECT_OFFSETS`.
- Dasha: `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()`.
- Transit: `computeSingleLongitude(name, date)` plus `ASPECT_OFFSETS`.
- Divisional chart: `vargaPosition(longitude, 'D2')` reused directly in `NS.getD2()` (`js/loanDebtReliefTiming/loanDebtReliefTimingEngine.js`) as an **optional** confirmation layer, wrapped in try/catch so a chart where D2 is unavailable degrades to `{ available: false }` rather than failing or spawning a second divisional-chart engine — per the spec's explicit Section 10 instruction.
- Cross-module reads (all defensive, read-only, via each module's own `.refresh()`):
  - `window.FinancialGainTiming.refresh()` — financial-gain overlap.
  - `window.PropertyTiming.refresh()` and `window.PropertySaleTiming.refresh()` — property-linked loan/closure context (both checked via `if (window.X && window.X.refresh)`).
  - `window.VehiclePurchaseTiming.refresh()` (confirmed global name: `js/vehiclePurchaseTiming/vehiclePurchaseTimingEngine.js` line 16) — vehicle-linked loan/closure context.

## Rule provenance

43 rules in `window.LOAN_DEBT_RELIEF_TIMING_RULES` (`js/loanDebtReliefTiming/loanDebtReliefTimingRules.js`), using the `DEBT-*` ID namespace the spec suggested (`DEBT-NATAL-*`, `DEBT-HOUSE-*`, `DEBT-DASHA-*`, `DEBT-D2-*`, `DEBT-TRANSIT-*`, `DEBT-STAGE-*`), split into: Natal Promise (5), Supporting House (4), Natural Significator (7), House Relationship Signature (9 primary + 3 convergence), D2 Confirmation (1), Natal Debt Indicators / Natal Debt-Relief Indicators (2 dedicated scale rules), Dasha, Debt Stage, Transit (3), Cross-Module Checks (3), Loan Type Selector, Limitations, Window Support Level — application-synthesis rules each explicitly labeled `provenance: 'application'`.

## Two separate natal-indicator displays (per spec Section 9)

- **Natal Loan/Debt Indicators**: `Strong Debt/Repayment Theme / Present / Mixed / Limited Evidence`, computed from 6th/8th/12th/4th-linked house-relationship connectivity (`debtRelationships`, `debtConnectedCount`).
- **Natal Debt-Relief Indicators**: `Clearly Present / Present / Mixed / Limited Evidence`, computed independently from 2nd/11th/10th/8th-linked house-relationship connectivity (`reliefRelationships`, `reliefConnectedCount`).

These are computed from entirely separate house-pair sets in `assessNatalDebtIndicators()` and rendered as two distinct sections in the UI, never merged into one scale.

## Structural safety rules enforced (not just prose)

- **12th-house activation alone never equals "Debt Closure"**: `classifyDebtStage()` requires 6th+11th activation plus a convergence count (`closureConvergence`) of at least 2 among {6th, 11th, (12th-or-2nd)} AND `matchCount >= 2` (i.e. at least two dasha levels independently relevant) before the "Debt Closure" label is assigned. A lone 12th-house signal, absent 6th+11th, instead falls through to "Debt Maintenance" or "Debt Creation."
- **Rahu/Ketu never alone sufficient**: `nodesOnlyDriver` is computed and added as an explicit caution whenever Rahu/Ketu activation is present without Jupiter/Saturn support, and the `convergenceFactors` gate (requiring ≥2, strong requiring ≥3, among D2/Jupiter/Saturn/matchCount/6th+11th) structurally prevents a nodes-only signal from reaching "Strongly Supportive."
- **No numeric score** anywhere — support level is one of four descriptive categories only (`DEBT-STRENGTH-001`).

## Loan Type selector

A `Loan Type` selector (General/Home/Vehicle/Personal/Business/Education/Other) adjusts only the `eventType` label mapping (e.g. Home/Vehicle context routes a 4th+6th+11th/12th window to "Property-Loan Closure" vs. "Vehicle-Loan Closure") — it never adds or removes any underlying house/dasha/transit evidence (`DEBT-LOANTYPE-001`).

## Testing performed

`node --check` on all three files (pass). Full Playwright regression: 48 total tabs after all three new modules are added, zero real console/page errors. Purity check confirmed zero "Debt Closure" windows with fewer than 2 convergence factors across a 10-year horizon. Forbidden-language scan confirmed the only matches for lender-recommendation/approval-guarantee/forgiveness wording are inside the module's own "never ..." disclaimer sentences in the Financial Caution section, never asserted as fact — no lender name, no approval/repayment guarantee, no credit-score prediction, and no debt-forgiveness promise appears anywhere in rendered output.

## Known limitations

D2 (Hora) confirmation is optional per the spec; when `vargaPosition('D2')` is unavailable or throws for a given chart, the module documents this in the UI ("D2 (Hora) confirmation is optional and is not available for this chart") rather than failing or building a second divisional-chart engine. Debt-stage classification is a house-convergence heuristic with no awareness of an actual loan account, contract terms, or lender decision.
