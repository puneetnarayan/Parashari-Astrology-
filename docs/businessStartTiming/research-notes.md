# Business Start Timing — Implementation Notes

## What was implemented

A tenth event-timing module, **Business Start Timing**, added alongside Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, and Financial Gain Timing. It follows the identical architecture: Natal Business Promise → Employment-vs-Business-vs-Independent-Professional Tendency → D10 Confirmation (D9 supporting context) → Vimshottari Dasha Activation → Transit Confirmation → Candidate Window → Event Classification → Event Stage, with Job Change and Financial Gain cross-checks. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `relationBetween()` (via `housesConnected`), `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Divisional charts:** `vargaPosition(longitude, 'D10')` and `vargaPosition(longitude, 'D9')` from `js/divisionalCharts.js` — confirmed present before writing any code; no new varga implementation created. D10 is the primary business/profession confirmation chart; D9 is used only as supporting context (never override authority), per the spec.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module, enabling both forward candidate-window search and historical validation at arbitrary past dates.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **Cross-module reads (not duplication):** `window.JobChangeTiming.refresh()` for the business-vs-employment distinction, and `window.FinancialGainTiming.refresh()` for the optional financial-realization tag — same pattern Job Change Timing itself uses for its Promotion comparison, and Foreign Travel Timing uses for its Job Change comparison.

## Section-by-section mapping to the spec

- **Natal Promise:** 2nd/3rd/5th/6th/7th/9th/10th/11th/12th houses plus Mercury/Venus/Jupiter/Saturn/Sun/Mars/Rahu karakas, each classified Strong/Supporting/Moderate/Challenging from actual dignity, occupants, and aspects — never a blanket assumption. 6th house is never automatically read as negative; Rahu is never treated as automatically positive or negative; Saturn is never defaulted to negative.
- **Business Formation/Entrepreneurship/Profit Signatures:** 7-10, 7-11, 3-7, 3-10, 7-2 house-lord relationships, plus 2-7-11 and 5-7-11 convergence for the profit-specific signature, and a 7-9-10-12+Rahu convergence for foreign business.
- **Employment vs. Business vs. Independent-Professional:** three independent evidence-based tendency scores (never a single forced occupational destiny), presented as "the chart shows stronger X indicators," exactly matching the spec's required phrasing style.
- **D10 Confirmation:** reused directly via `vargaPosition('D10')`; five-level non-numeric scale (Strong/​/Partial/Mixed/Weak D10 confirmation).
- **D9 Context:** reused via `vargaPosition('D9')`; explicitly supporting-only, never override authority.
- **Dasha Activation Map:** MD/AD/PD lord connection to 2nd/3rd/5th/7th/9th/10th/11th houses.
- **Transit:** Jupiter/Saturn primary confirmation over 2nd/3rd/7th/10th/11th; Rahu/Ketu secondary only — never standalone triggers.
- **Event Classification:** Business Idea/Preparation, Business Registration/Formation, First Major Commercial Activity, Independent Professional Practice, Partnership/Joint Business Start, Foreign/International Business Activity — derived from exactly which houses/significators converge; preparation is never classified as launch.
- **Event Stage:** Idea/Preparation → Registration/Formation → Launch → First Commercial Activity → Stabilization/Expansion, distinct from the event-type classification.
- **Job Change cross-check:** reads `window.JobChangeTiming.refresh()` directly; shows both possibilities rather than forcing one conclusion on overlap.
- **Financial Gain cross-check:** reads `window.FinancialGainTiming.refresh()` directly; tags "+ Financial Realization" descriptively, never overriding the business classification.
- **Window Strength (non-numeric):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, star rating, or "best date."
- **Historical Validation:** arbitrary past-date lookup against the same dasha/transit/D10 machinery, never adjusting rules to fit the outcome.
- **Calculation Trace/Log:** full copy-able log plus per-window click-to-expand trace, matching every prior module.

## Deliberate scope decisions

- D9 is read-only supporting context (strong-dignity planet count) — it is never given override authority over the D1/D10 business logic, per the spec's explicit instruction.
- The Employment/Business/Independent-Professional tendency is reported descriptively ("the chart shows stronger X indicators than Y"), never as a deterministic career mandate.
- 6th-house and Rahu involvement are read contextually rather than defaulted to negative/neutral, matching the spec's explicit prohibition on automatic negative/positive bias.
- Cross-module checks (Job Change, Financial Gain) are purely additive tags read from each module's own `.refresh()` output — no business-specific logic was duplicated into those modules, and no job-change/financial rule was re-derived here.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 35 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- Engine correctness: natal promise, employment-vs-business tendency, D10 confirmation level, current dasha, 2 candidate windows generated for the test chart, non-numeric window strength and event-stage labels populated correctly.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero "Registration" events generated from fewer than 2 convergence factors; zero windows tagged "Launch" stage without D10 confirmation.
- Forbidden-language scan: the only text match for "guaranteed" is the rule database's own cautionary phrase "...not by itself a guaranteed business launch" (a negated caution, not an affirmative claim) — no numeric score, star rating, or ranking pattern found anywhere in the rendered output.
- UI interaction: horizon selector, event-type filter, historical-date add/remove, and window-row click-to-expand trace all verified working.

## Known limitations

- Business-type classification (e.g. trade vs. consulting vs. manufacturing) is inferred from karaka/house evidence only; it cannot read an actual business plan or industry.
- The Employment-vs-Business tendency assessment uses a fixed five-factor scoring model per category; it is an internal, documented heuristic, not a validated predictive instrument.
- As with every prior module, this analysis is a classical-method chart indication, not a guarantee of any business outcome.

## Next recommended event-timing module

With Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, and now Business Start Timing complete, a natural next addition would be **Health/Medical Event Timing** (6th/8th/12th houses and Ayurvedic/Parashari dasha-based health-event indications) or **Education/Higher Studies Timing** (4th/5th/9th houses), both following the same established architecture.
