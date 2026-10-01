# Higher Education / Degree Timing — Implementation Notes

## What was implemented

An eleventh event-timing module, **Higher Education / Degree Timing**, added alongside Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, and Business Start Timing. It follows the identical architecture: Natal Education Promise → Education Type → Dasha Activation → D24 Confirmation → Transit Confirmation → Candidate Window → Academic Event Classification → Calculation Trace. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Divisional charts:** `vargaPosition(longitude, 'D24')` — confirmed already present in `js/divisionalCharts.js` (`DIVISIONAL_CHART_LIST` includes D24) before writing any code; used as the principal education-confirmation chart. `vargaPosition(longitude, 'D9')` and `vargaPosition(longitude, 'D10')` are reused as optional, non-overriding supporting context (D9 for general strength, D10 for career-linked professional qualifications), exactly as specified.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **Cross-module reads (not duplication):** `window.ForeignTravelTiming.refresh()` for the foreign-education cross-check, and `window.CareerStartTiming.refresh()` / `window.PromotionTiming.refresh()` / `window.BusinessStartTiming.refresh()` / `window.JobChangeTiming.refresh()` for the career-linked-education cross-check — same pattern Job Change, Foreign Travel, and Business Start Timing already use for their own cross-checks.

## Section-by-section mapping to the spec

- **Natal Promise (Section 9):** 2nd/3rd/4th/5th/6th/9th/10th/11th/12th houses plus Jupiter/Mercury/Moon/Sun/Venus/Saturn karakas, each classified from actual dignity, occupants, and aspects. Distinguishes "educational potential" from "timing of an educational event," using only cautious language ("the chart supports higher education," never deterministic claims). 6th house never automatically negative; Saturn never automatically interpreted as failure.
- **House Relationship Signatures (Section 6):** 5-9, 4-9 pairs plus 5-9-11 and 2-5-9 convergence for higher education; admission signature (5th/9th-11th); examination signature (5th/6th/3rd); completion signature (5th/9th/2nd/11th); professional-qualification signature (5th/9th/10th/11th); foreign-education signature (9th/12th with Rahu as secondary evidence only).
- **Education Type Classification (Section 10):** Undergraduate, Postgraduate, Professional Qualification, Technical/Engineering, Management/Business, Arts/Humanities/Design, Finance/Accounting, Research/Doctoral, Foreign Higher Education — derived from converging karaka/house evidence; no specific degree or institution is ever invented.
- **D24 Confirmation (Section 12):** reused directly via `vargaPosition('D24')`; five-level non-numeric scale (Strong/​/Partial/Mixed/Weak D24 confirmation), explicitly marked unavailable rather than fabricated if chart data is missing.
- **D9/D10 Supporting Confirmation (Section 13):** both reused, both explicitly non-overriding.
- **Dasha Activation Map (Section 11):** MD/AD/PD lord connection to 2nd/3rd/4th/5th/6th/9th/10th/11th/12th houses, with full placement/dignity/conjunction/aspect/significator-role detail per period.
- **Transit (Section 14):** Jupiter/Saturn primary confirmation over 4th/5th/9th/11th; Rahu/Ketu secondary only — Saturn explicitly never defaulted to a failure reading.
- **Event-Stage Distinction (Section 16) + Examination vs. Result Logic (Section 17):** Application → Admission → Commencement → Examination → Result → Completion → Qualification, using differential house/karaka weighting so an admission window is never shown as a graduation window and examination timing is never assumed to equal result timing.
- **Foreign Education Cross-Check (Section 18):** reads `window.ForeignTravelTiming.refresh()` directly; shows education indication and foreign-location indication separately rather than assuming every 9th/12th combination means foreign education.
- **Career-Linked Education (Section 19):** reads the relevant career module's `.refresh()` output directly; tags "Qualification → Career Opportunity" only where an actual overlapping window exists.
- **Window Classification (Section 20):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, star rating, ranking, "best year," or guaranteed-success claim.
- **Calculation Trace (Section 21) + Result Display (Section 22) + User Controls (Section 23):** full copy-able log, per-window click-to-expand trace, compact summary card, forecast-period (1/2/3/5/10 years) and education-event filters, matching every prior module's conventions.
- **Historical Validation (Section 31):** arbitrary past-date lookup against the same dasha/transit/D24 machinery, never adjusting rules to fit the outcome.

## Deliberate scope decisions

- D24 is treated strictly as a confirmation layer; it is never allowed to override D1, and is explicitly marked unavailable (not fabricated) if the chart cannot support it.
- D9/D10 are read-only supporting context (D9: strong-dignity planet count; D10: 10th-lord dignity in D10) — neither is given override authority, per the spec's explicit instruction.
- Rahu/Ketu are used only as secondary modifiers in both the natal foreign-education signature and the transit layer — never a standalone trigger.
- Cross-module checks (Foreign Travel, four career modules) are purely additive, read-only lookups against each module's own `.refresh()` output — no foreign-travel or career logic was duplicated into this module.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 36 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- Engine correctness: natal promise, education-type classification, D24 confirmation level, current dasha, 2 candidate windows generated for the test chart, non-numeric window strength and event-stage labels populated correctly.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero windows where an Admission stage was displayed as a Completion event; zero Examination-stage windows generated from insufficient convergence.
- Forbidden-language scan: the only text matches for "star rating"/"best year" phrasing are the rule database's own cautionary descriptions of what to avoid (negated prohibitions, not affirmative claims) — no numeric score, star rating, ranking, or guaranteed-success pattern found anywhere in the rendered output.
- UI interaction: forecast-period selector, education-event filter, historical-date add/remove, and window-row click-to-expand trace all verified working.

## Known limitations

- Education-theme classification (e.g. Engineering vs. Finance vs. Arts) is inferred from karaka/house evidence only; it cannot read an actual curriculum or institution.
- The examination-vs-result-vs-completion weighting uses a fixed differential scoring model; it is an internal, documented heuristic, not a validated predictive instrument.
- As with every prior module, this analysis is a classical-method chart indication, not a guarantee of any academic outcome.

## Next recommended event-timing module

With Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, and now Higher Education Timing complete, a natural next addition would be **Health/Medical Event Timing** (6th/8th/12th houses and Ayurvedic/Parashari dasha-based health-event indications) or **Litigation/Legal Dispute Timing** (6th/7th/8th houses), both following the same established architecture.
