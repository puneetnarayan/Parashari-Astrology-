# Insurance / Financial Protection Timing — Research Notes

## Architecture
Natal Promise (2nd/6th/8th/11th/12th + 1st/4th/5th/7th/9th/10th context houses) → Divisional Confirmation (D2 always + D4/D16/D10 contextually) → Dasha Activation → Transit Confirmation (Saturn/Jupiter) → Candidate Window → Convergence Gate → Protection-Context Stage → Cross-Module Checks → Calculation Trace.

## Reused components
Same chart/dignity/dasha/transit primitives as `propertySaleTiming`. Divisional charts via `vargaPosition()` from `js/divisionalCharts.js` (D2 always; D4/D16/D10 only when Property/Vehicle/Business event context is selected — never a new divisional engine).

## Rule provenance
`js/insuranceProtectionTiming/insuranceProtectionTimingRules.js` — 23 rules. Category scale used exactly as specified: Strongly Indicated / Indicated / Mixed / Conditional / Requires Careful Interpretation.

## Scope boundaries enforced structurally
- 8th house is read only as "risk/transformation/claim context" — never death/lifespan (`INS-NODEATH-001`, asserted in every 8th-house evidence string).
- Never recommends a specific insurer/policy/premium/coverage amount, never guarantees claim approval/settlement/payout (`INS-NOGUARANTEE-001`, disclaimer banner on every render).
- Convergence gate (`convergenceFactors`) structurally prevents 8th-house activation alone from reaching "Strongly Indicated" — a caution is emitted whenever 8th-house activation is present with `convergenceFactors < 2`.
- Cross-checks (`NS.checkCrossModules`) are read-only against `FinancialGainTiming`, `MajorExpenditureTiming`, `LoanDebtReliefTiming`, `PropertyTiming`, `PropertySaleTiming`, `VehiclePurchaseTiming`, `InheritanceLegacyTiming`, `LegalMatterTiming` — all guarded with `typeof window[key].refresh === 'function'` so build order never matters.
