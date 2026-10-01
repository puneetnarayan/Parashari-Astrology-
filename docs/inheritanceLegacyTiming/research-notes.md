# Inheritance / Legacy Timing — Implementation Notes

## What was implemented

A nineteenth event-timing module, **Inheritance / Legacy Timing**. This module is strictly an asset/succession-development timing tool: it never predicts death, a death date, lifespan, or infers when a relative will die, and never guarantees inheritance or a particular amount. Core flow: Natal Inheritance Factors → Dasha → D4 Confirmation → Transit → Related Events → Event Classification → Final Window.

## Existing modules reused (no duplication)

- Chart/dignity primitives, Vimshottari Dasha, transit engine — standard across all prior modules.
- **D4 (Chaturthamsha):** reused directly via `vargaPosition('D4')` — the same D4 engine Property Purchase/Sale Timing use, confirming the inherited-property axis (4th/8th/11th/2nd) only, never replacing D1.
- **Cross-module reads:** `window.PropertyTiming.refresh()` and `window.PropertySaleTiming.refresh()` (inherited-property overlap), `window.FinancialGainTiming.refresh()` (financial-realization overlap, no amount predicted), `window.LegalMatterTiming.refresh()` (inheritance-related legal/procedural overlap, no legal advice).

## Key safeguard

`INHERIT-NODEATH-001` is an explicit, enforced scope boundary: the engine contains no date-of-death, lifespan, or mortality calculation of any kind — timing is derived entirely from 2nd/4th/8th/11th (and supporting 3rd/5th/6th/9th/10th/12th) house activation, dasha, D4, and transit, never from any death-prediction logic.

## Testing performed

`node --check` on all files; full Playwright regression (45 total tabs, zero real console errors); purity check confirmed zero windows classified as inheritance from 8th-house activation alone; forbidden-language scan (death date/lifespan/guaranteed inheritance) found zero matches outside the engine's own negated scope-boundary text.

## Known limitations

Event classification (Documentation vs. Legal Process vs. Settlement, etc.) is a house-convergence heuristic; asset-context selector adjusts emphasis only and never fabricates evidence.
