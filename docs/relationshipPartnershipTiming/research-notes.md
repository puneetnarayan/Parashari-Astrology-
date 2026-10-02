# Relationship / Partnership Start Timing — Research Notes

## Architecture
Natal Promise (5th/7th/11th primary, 1st/2nd/3rd/9th/12th supporting, 6th/8th contextual-only) → D9 Confirmation (supporting only) → Dasha Activation → Transit (Venus/Jupiter) → Candidate Window → Personal-vs-Professional Context Classification → Cross-Module Checks.

## Distinctness from Marriage Timing / Matching
This module never recomputes marriage-promise logic or compatibility scoring. `NS.checkCrossModules` reads `window.MarriageTiming.refresh()`, `window.MarriageSeparationDivorceTiming.refresh()`, and `window.BusinessStartTiming.refresh()` output only (read-only, guarded by `typeof ... === 'function'`), and separately notes if `window.KundaliMatching` exists (the Matching module in this app does not expose a global engine object — verified by grep of `js/matching/`; the check degrades gracefully).

## D9 reuse
`NS.assessD9Confirmation` follows the same engine pattern as `js/marriageTiming/marriageTimingEngine.js`'s `NS.getD9` (vargaPosition('D9') reused, never duplicated) — used here only as supporting confirmation of the 1st/7th axis, never as this module's main logic.

## Ambiguity handling (critical requirement)
`NS.classifyPartnershipContext` never forces a personal/professional classification when the 7th house alone is activated without 5th or 10th/11th+Mercury emphasis — it returns the literal string `"Partnership indicated; personal vs professional context requires real-world context"` in that case, matching the spec's required wording.

## Rule provenance
`js/relationshipPartnershipTiming/relationshipPartnershipTimingRules.js` — 20 rules. Category scale: Strongly Supported / Supported / Mixed / Delayed / Conditional / Requires Careful Interpretation.

## Scope boundaries enforced structurally
Never guarantees a relationship/commitment/marriage; never infers another person's thoughts/intentions/fidelity; never infers abuse/mental-health/personality-disorder/character; never predicts coercion/violence; never identifies a specific destined partner (`RELPART-NOGUARANTEE-001`, scope banner on every render).
