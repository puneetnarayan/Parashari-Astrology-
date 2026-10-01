# Vehicle Purchase Timing — Implementation Notes

## What was implemented

A twelfth event-timing module, **Vehicle Purchase Timing**, added alongside Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, and Higher Education Timing. It follows the identical architecture: Natal Vehicle Promise → Vehicle/Transport Theme → Dasha Activation → D16 Confirmation → Transit Confirmation → Candidate Window → Vehicle Event Classification → Calculation Trace. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Divisional charts:** `vargaPosition(longitude, 'D16')` — confirmed already present in `js/divisionalCharts.js` (`DIVISIONAL_CHART_LIST` includes D16) before writing any code; used as the principal vehicle/conveyance confirmation chart.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **Cross-module read (not duplication):** `window.PropertyTiming.refresh()` for the optional D4/property cross-check — per the spec's explicit instruction that D4 remains associated with property and is never reused as the vehicle confirmation chart.

## Vehicle vs. Property distinction (Section 4)

Property-purchase logic is not reused blindly. Property is primarily 4th/2nd/11th/D4; vehicle is primarily 4th/3rd/Venus/Mars/Moon/D16. The 4th house is shared (both relate to comforts/assets), but the divisional confirmation chart (D16 vs. D4) and natural significators (Venus/Mars for vehicles vs. no vehicle-specific karaka for property) are kept entirely separate. Where a candidate window overlaps an existing Property Purchase Timing window, this is surfaced as an optional cross-check only, never merged into the vehicle logic.

## Section-by-section mapping to the spec

- **Natal Promise (Section 10):** 2nd/3rd/4th/6th/8th/10th/11th/12th houses plus Venus/Mars/Moon/Mercury/Saturn karakas, each classified from actual dignity, occupants, and aspects. Uses only cautious descriptive language ("the chart supports vehicle ownership," never deterministic claims). 6th and 8th houses never automatically negative; 12th-house connections never automatically labeled a bad purchase; Saturn never automatically negative.
- **House Relationship Signatures (Section 7):** 4-11, 4-2, 3-4 pairs plus 2-4-11 convergence for acquisition; income-funded signature (2-10, 10-4, 10-11); loan-funded signature (2-4, 4-6, 6-11); professional-vehicle signature (4-10, 3-10, 4-11); replacement/upgrade signature (4-11/4-2/3-4 with 8th/12th context).
- **Vehicle Type Classification (Section 11):** Personal, Family, Utility, Commercial/Professional, Luxury/Comfort-Oriented, Heavy/Industrial — derived from converging karaka/house evidence; exact make, model, registration number, or colour is never predicted.
- **D16 Confirmation (Section 13):** reused directly via `vargaPosition('D16')`; five-level non-numeric scale, explicitly marked unavailable rather than fabricated if chart data is missing.
- **D4 Property Cross-Check (Section 14):** D4 is never used as the vehicle chart; instead, candidate windows are checked against `window.PropertyTiming.refresh()` output for informational overlap only.
- **Dasha Activation Map (Section 12):** MD/AD/PD lord connection to 2nd/3rd/4th/6th/8th/10th/11th/12th houses, with full placement/dignity/conjunction/aspect/significator-role detail.
- **Transit (Section 15):** Jupiter/Saturn primary confirmation over 2nd/3rd/4th/11th; Mars/Venus secondary; Rahu/Ketu contextual only — Saturn explicitly never defaulted to negative.
- **Safety/Accident Exclusion (Section 16):** this module never outputs accident predictions, "dangerous vehicle period" claims, or driving-avoidance advice, even when nodal/Mars transits activate vehicle houses — enforced as an explicit rule (`VEH-SAFETY-001`) and verified by an automated forbidden-phrase scan.
- **Financing Analysis (Section 17):** Cash Purchase (2nd/4th/11th), Loan/EMI Purchase (2nd/4th/6th/11th), Employer/Business Vehicle (4th/10th/11th) — shown only when evidence supports a reasonable classification; no exact loan amounts or EMI values are ever stated.
- **Event-Stage Distinction (Section 19):** Booking → Financing → Purchase → Delivery → Registration → First Use → Replacement → Upgrade, using house/D16/transit convergence so financing is never automatically shown as the actual purchase.
- **Window Classification (Section 20):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, star rating, ranking, or "best vehicle purchase date."
- **Calculation Trace (Section 21) + Result Display (Section 22) + User Controls (Section 23):** full copy-able log, per-window click-to-expand trace, compact summary card, forecast-period (1/2/3/5/10 years) and vehicle-event filters, matching every prior module's conventions.
- **Historical Validation (Section 31):** arbitrary past-date lookup against the same dasha/transit/D16 machinery, never adjusting rules to fit the outcome.

## Deliberate scope decisions

- D4 is deliberately NOT reused as the vehicle confirmation chart, per the spec's explicit Section 14 instruction; it remains Property Purchase Timing's own chart, surfaced here only as a read-only cross-check.
- Rahu/Ketu are used only as contextual secondary modifiers — the module never infers accidents or danger merely because the nodes activate vehicle houses, and no safety/accident sub-module was built.
- Financing/acquisition-mode classification never states exact loan amounts or EMI values — only a broad mode label (Cash / Loan-EMI / Employer-Business), and only when evidence supports it.
- Vehicle type classification stays at the broad thematic level (Personal/Family/Utility/Commercial/Luxury/Heavy) — no make, model, registration number, or colour is ever predicted.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 37 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- Engine correctness: natal promise, vehicle-type classification, acquisition-mode classification, D16 confirmation level, current dasha, 2 candidate windows generated for the test chart, non-numeric window strength and event-stage labels populated correctly.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero windows where Financing was shown as a confirmed Purchase event.
- Forbidden-language scan: the only text match for "dangerous vehicle period"/"avoid driving" phrasing is the rule database's own cautionary description of what this module must never output (a negated prohibition, not an affirmative claim) — no numeric score, star rating, ranking, "best vehicle purchase date," or actual accident/danger claim found anywhere in the rendered output.
- UI interaction: forecast-period selector, vehicle-event filter, historical-date add/remove, and window-row click-to-expand trace all verified working.

## Known limitations

- Vehicle-theme classification (e.g. two-wheeler vs. four-wheeler) is inferred from karaka/house evidence only; it cannot read an actual purchase decision or vehicle specification.
- The acquisition-mode (cash/loan/employer) classification uses a fixed house-convergence heuristic; it is an internal, documented heuristic, not a validated predictive instrument.
- As with every prior module, this analysis is a classical-method chart indication, not a guarantee of any vehicle-acquisition outcome, and explicitly excludes any safety/accident prediction.

## Next recommended event-timing module

With Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, and now Vehicle Purchase Timing complete, a natural next addition would be **Health/Medical Event Timing** (6th/8th/12th houses) or **Litigation/Legal Dispute Timing** (6th/7th/8th houses), both following the same established architecture.
