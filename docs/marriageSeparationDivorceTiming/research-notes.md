# Marriage Separation / Divorce Timing — Implementation Notes

## What was implemented

A twentieth event-timing module, **Marriage Separation / Divorce Timing**. This is a sensitive relationship-timing module providing astrological timing indicators only — it never guarantees divorce or reconciliation, never tells the user to divorce or stay married, never labels a spouse good/bad, never infers abuse/infidelity as fact, never diagnoses mental health, and never predicts harm to a spouse. Core flow: Natal Relationship Factors → Venus/Significators → Dasha → D9 Confirmation → Transit → Related Events → Event Classification → Final Window.

## Existing modules reused (no duplication)

- Chart/dignity primitives, Vimshottari Dasha, transit engine — standard across all prior modules.
- **D9 (Navamsha):** reused directly via `vargaPosition('D9')` — the same D9 implementation Marriage Timing/Matching already use. Used for confirmation of relationship themes only, never as a replacement for D1 and never reduced to a simplistic "divorce score."
- **Cross-module reads:** `window.LegalMatterTiming.refresh()` (legal/procedural relationship factors), `window.PropertySaleTiming.refresh()` / `window.PropertyTiming.refresh()` / `window.FinancialGainTiming.refresh()` (financial/shared-asset overlap, no asset division inferred).

## Critical safeguard: 6th/8th/12th are never automatically divorce

Per the spec's most important instruction, the engine structurally distinguishes Conflict (6th alone), Transformation (8th alone), and Separation (12th alone) from Divorce Proceedings/Closure, which requires a `convergenceFactors >= 4` threshold combining D9 confirmation, Saturn transit, Jupiter transit, dasha match count, and 7th+12th/6th house activation together — verified by an automated purity check confirming zero divorce-stage classifications occur below that convergence threshold.

## Reconciliation shown separately

`assessReconciliationIndicators()` independently checks for 7th/11th, 2nd, 4th-house activation, Venus condition, and Jupiter transit, and — when present — displays Reconciliation / Relationship Continuity Indicators alongside any conflict indicators in the same window, so the module is never one-directional toward divorce.

## Testing performed

`node --check` on all files; full Playwright regression (45 total tabs, zero real console errors); purity check confirmed zero Divorce Proceedings/Closure classifications with fewer than 4 convergence factors; forbidden-language scan (divorce guarantee, spouse character claims) found zero matches; the compact relationship-safety disclaimer was verified present in the rendered output in all states.

## Known limitations

Relationship-stage classification is a house/D9/transit convergence heuristic with no awareness of the user's actual relationship history or communication; it cannot and does not attempt to verify real-world facts about either spouse.
