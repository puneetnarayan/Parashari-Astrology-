# Property Sale Timing — Implementation Notes

## What was implemented

An eighteenth event-timing module, **Property Sale Timing**, explicitly distinct from Property Purchase Timing: this module covers disposal, transfer, realization of asset value, and reduction/change of property holding — never acquisition, ownership gain, expenditure, or possession. Core flow: Natal Property Factors → Dasha → D4 Confirmation → Transit → Related Events → Transaction Stage → Final Window.

## Existing modules reused (no duplication)

- Chart/dignity primitives, Vimshottari Dasha, transit engine — standard across all prior modules.
- **D4 (Chaturthamsha):** reused directly via `vargaPosition('D4')` — the exact same D4 implementation Property Purchase Timing uses; no second D4 engine was created.
- **Cross-module reads:** `window.LegalMatterTiming.refresh()` (property-related legal/procedural factors), `window.FinancialGainTiming.refresh()` (financial-gain overlap, no profit promised). Relocation theme is detected from the module's own house activation (4th/12th/3rd-9th) rather than a dedicated Relocation module call, since Relocation is a direction/compass tool with no timing windows (consistent with prior modules' documented treatment of that module).

## Key distinctions enforced

- **Sale vs. Purchase:** separate rule set and separate house-weighting from Property Purchase Timing; the D4 engine is reused but never the purchase-specific rules.
- **Sale vs. Gain:** four distinct classifications (Property Disposal / Disposal With Realization / Disposal With Strong Financial Context / Transfer Without Clear Gain) so a sale is never conflated with a guaranteed profit.
- **Transaction stages:** Preparation → Listing → Buyer Interest → Negotiation → Agreement → Registration/Sale → Handover → Delayed/Conditional → Closure.

## Testing performed

`node --check` on all files; full Playwright regression (45 total tabs after all three new modules, zero real console errors); purity check confirmed zero weak-qualification windows leaked; forbidden-language scan confirmed no sale/price/profit guarantee language anywhere in rendered output.

## Known limitations

Transaction-stage classification is a house-convergence heuristic with no awareness of an actual listing or buyer; property-context selector adjusts emphasis only.
