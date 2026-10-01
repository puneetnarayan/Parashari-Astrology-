# Recognition / Award Timing — Implementation Notes

## What was implemented

A fourteenth event-timing module, **Recognition / Award Timing**, added alongside Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, Vehicle Purchase, and Retirement Timing. It follows the identical architecture: Natal Recognition Promise → Recognition Type → Dasha Activation → D10/Relevant Confirmation → Transit Confirmation → Candidate Window → Recognition Event Classification → Calculation Trace. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Divisional charts:** `vargaPosition(longitude, 'D10')` — reused directly as the principal professional-recognition confirmation chart. D24 is never reused directly here (per the spec's Section 15 instruction) — academic recognition is cross-checked by reading `window.HigherEducationTiming.refresh()` output, which itself owns the D24 calculation.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **Cross-module reads (not duplication):** `window.PromotionTiming.refresh()` (recognition-vs-promotion distinction), `window.FinancialGainTiming.refresh()` (recognition-vs-financial-gain distinction), `window.HigherEducationTiming.refresh()` (academic recognition cross-check), `window.RetirementTiming.refresh()` (post-retirement/lifetime-achievement cross-check).

## Recognition vs. Promotion and vs. Financial Gain (Sections 4-5)

These distinctions are enforced structurally, not just descriptively. Promotion Timing's output is never reused as recognition timing — a separate natal-promise and house-signature set (10-11, 10-9, 5-10, 5-11, 9-11) drives this module's own classification. When a candidate window overlaps a Promotion Timing window, both are shown as separate indications (Career Advancement vs. Recognition/Honour) rather than merged. Likewise, an award is never assumed to produce financial gain: Financial Gain Timing is only cross-checked (and only displayed) when an actual overlapping window exists.

## Section-by-section mapping to the spec

- **Natal Promise (Section 11):** 1st/2nd/3rd/4th/5th/6th/7th/9th/10th/11th/12th houses plus Sun/Jupiter/Venus/Mercury/Moon/Saturn karakas, each classified from actual dignity, occupants, and aspects. Distinguishes "Recognition Potential" from "Timing of Recognition," using only cautious descriptive language ("the chart supports professional recognition," never "you will definitely win an award").
- **House Relationship Signatures (Section 8):** 10-11/10-9/5-10/5-11/9-11 for professional recognition; 9-10/9-11 with 5-9-10/5-10-11 convergence for formal award; 1-10/1-11/7-10/7-11/3-10 for public recognition; 5-10-11/6-10-11 for achievement recognition; 9-10/9-11 with Sun/Jupiter context for institutional/senior recognition.
- **Recognition Type Classification (Section 12):** Professional, Organizational, Industry, Academic, Public, Institutional, Community/Social, Long-Service, Lifetime Achievement, Post-Retirement — derived from converging karaka/house evidence and cross-module overlaps; a specific award title or organization is never predicted.
- **D10 Confirmation (Section 14):** reused directly via `vargaPosition('D10')`; five-level non-numeric scale, explicitly marked unavailable rather than fabricated if chart data is missing.
- **D24/Academic Cross-Check (Section 15):** D24 is never duplicated — `window.HigherEducationTiming.refresh()` is read directly; Professional Recognition and Academic Recognition are always shown as separate indications when both are possible.
- **Dasha Activation Map (Section 13):** MD/AD/PD lord connection to 1st/2nd/3rd/5th/6th/7th/9th/10th/11th houses, with full placement/dignity/conjunction/aspect/significator-role detail.
- **Transit (Section 16):** Jupiter/Saturn given primary attention (Saturn never automatically negative) over 5th/9th/10th/11th; Sun/Venus/Mercury/Moon secondary; Rahu/Ketu secondary only.
- **Recognition Stage (Section 18):** Achievement → Nomination/Consideration → Award/Honour → Public Announcement → Post-Award Recognition, with Award/Honour as the primary event and surrounding stages shown where supported.
- **Promotion Cross-Check (Section 19):** reads `window.PromotionTiming.refresh()` directly; shown separately, never collapsed into one event.
- **Financial Cross-Check (Section 20):** reads `window.FinancialGainTiming.refresh()` directly; only cross-checked (never assumed) when an award includes a financial dimension indicated by an actual overlapping window.
- **Window Classification (Section 21):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, star rating, ranking, or "best award period."
- **Calculation Trace (Section 22) + Result Display (Section 23) + User Controls (Section 24):** full copy-able log, per-window click-to-expand trace, compact summary card, forecast-period (1/2/3/5/10 years) and recognition-event filters, matching every prior module's conventions.
- **Historical Validation (Section 32):** arbitrary past-date lookup against the same dasha/transit/D10 machinery, never adjusting rules to fit the outcome.

## Deliberate scope decisions

- The event-filter dropdown options were aligned directly with the engine's actual output labels (Professional Recognition, Formal Award, Public Recognition, Institutional Honor, Career Achievement Recognition, Academic / Professional Recognition, Post-Retirement Recognition) rather than the spec's broader illustrative list, so that every filter option reliably matches real engine output — documented here rather than left as a silent mismatch.
- D24 is never computed directly in this module; academic recognition is purely a read-only cross-check against Higher Education Timing's own output, consistent with the spec's explicit "do not duplicate D24 calculations" instruction.
- Recognition is never automatically assumed to carry a financial component — the financial cross-check only fires on an actual overlapping Financial Gain Timing window.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 39 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- Engine correctness: natal promise, recognition-type classification, D10 confirmation level, current dasha, 2 candidate windows generated for the test chart (correctly cross-referencing both Higher Education Timing and Retirement Timing overlaps for the test chart), non-numeric window strength and multi-label event classification populated correctly.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero windows with fewer than 2 convergence factors reaching the UI.
- Forbidden-language scan: the only text match for "you will definitely win"/"best award period" phrasing is the UI's own explicit statement of what this module must never claim (a negated prohibition, not an affirmative claim) — no numeric score, star rating, ranking, or deterministic award guarantee found anywhere in the rendered output.
- UI interaction: forecast-period selector, recognition-event filter, historical-date add/remove, and window-row click-to-expand trace all verified working.

## Known limitations

- Recognition-type classification (e.g. distinguishing "Industry" from "Organizational") relies on a fixed house/karaka heuristic; it cannot read an actual nomination process or organizational calendar.
- The academic and post-retirement cross-checks only fire on an exact MD/AD/PD overlap with the respective module's own candidate windows; a near-miss (adjacent but non-overlapping period) is not flagged.
- As with every prior module, this analysis is a classical-method chart indication of recognition timing, never a guarantee of any specific award, title, or organization.

## Next recommended event-timing module

With Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, Vehicle Purchase, Retirement, and now Recognition/Award Timing complete, a natural next addition would be **Litigation/Legal Dispute Timing** (6th/7th/8th houses) or a strictly lifestyle-framed **Health/Wellness Timing** module (never diagnosis or prognosis), both following the same established architecture.
