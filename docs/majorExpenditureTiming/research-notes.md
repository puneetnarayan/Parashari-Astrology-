# Major Expenditure / Financial Commitment Timing — Research Notes

## Architecture
Natal Promise (2nd/12th primary, 4th/11th supporting, purpose-specific houses) → Divisional Confirmation (D2 always + D4/D16/D24/D10 contextually by purpose) → Dasha Activation → Transit Confirmation (Jupiter/Saturn) → Candidate Window → Convergence Gate → Planned-vs-Unplanned Classification → Cross-Module Checks.

## Reused components
Chart/dignity/dasha/transit primitives identical to prior modules. `vargaPosition()` reused contextually for D4 (Property), D16 (Vehicle), D24 (Education), D10 (Business) — never a new divisional engine.

## Rule provenance
`js/majorExpenditureTiming/majorExpenditureTimingRules.js` — 24 rules. Category scale: Strongly Indicated / Indicated / Mixed / Conditional / Requires Careful Interpretation.

## Scope boundaries enforced structurally
- Never recommends a specific investment, loan, lender, financial product, or amount (`MAJEXP-NOINVEST-001`).
- Never predicts medical emergencies/accidents, even when 6th/8th purpose houses (debt-financing) are activated (`MAJEXP-NOMEDICAL-001`).
- Planned-vs-unplanned distinction (`NS.classifyPlannedVsUnplanned`) is an interpretive pattern label, never a prediction of a specific triggering event.
- Cross-checks are read-only against Property Purchase/Sale, Vehicle Purchase, Home Construction (`checkPropertyCrossCheck`) and Financial Gain, Loan/Debt Relief, Business Start, Child Education (`checkFinancialModulesCrossCheck`), all defensively guarded.
