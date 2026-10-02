# Child Education / Academic Milestone Timing — Research Notes

## Architecture
Analysis-Subject Mode (Parent's Chart vs. Child's Own Chart, always displayed) → Natal Promise (5th/4th/9th/2nd/11th + 3rd/6th/8th/10th/12th) → D24 Confirmation → Dasha Activation → Transit (Jupiter/Mercury) → Candidate Window → Convergence Gate → Milestone Stage Classification → Cross-Module Checks.

## Methodological requirement: subject mode
`NS.refresh(horizonYears, subjectMode, minStrength)` takes an explicit `subjectMode` ('parent' | 'child'), returned as `result.subjectMode` and rendered as a banner (`renderModeBanner`) at the top of every render — the two modes are never silently treated as identical. In "child" mode, the module reads `state.chart` as the child's own chart (loaded via the Saved Natives tab); in "parent" mode it reads the parent's 5th/9th houses as child-indicators.

## Reused components
Same chart/dignity/dasha/transit primitives. D24 confirmation (`NS.assessD24Confirmation`) follows the exact same engine pattern as `js/higherEducationTiming/higherEducationTimingEngine.js`'s `NS.getD24`/`assessD24Confirmation` (vargaPosition('D24') reused, not duplicated). D7 was checked and found not used by any existing child-related module, so it is correctly omitted per the spec.

## Rule provenance
`js/childEducationTiming/childEducationTimingRules.js` — 21 rules. Category scale: Strongly Supported / Supported / Mixed / Delayed / Conditional / Requires Careful Interpretation.

## Scope boundaries enforced structurally
- Never predicts exact marks, rank, IQ, guaranteed admission/scholarship, or exam success; never diagnoses a learning disability or infers intelligence; never predicts a child's health, lifespan, or death (`CHILDEDU-NOOUTCOME-001`).
- Cross-checks (read-only) against Higher Education Timing, Childbirth Timing, Foreign Travel/Settlement, Relocation, Financial Gain/Loan-Debt, Recognition/Award — global names verified by grep (`HigherEducationTiming`, `ChildbirthTiming`, `ForeignTravelTiming`, `Relocation`, `FinancialGainTiming`, `LoanDebtReliefTiming`, `RecognitionAwardTiming`).
