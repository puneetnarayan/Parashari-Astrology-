# Major Career Turning Point Timing — Implementation Notes

## What was implemented

A fifteenth event-timing module, **Major Career Turning Point Timing**, added alongside Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, Vehicle Purchase, Retirement, and Recognition/Award Timing. Unlike those modules, this one is explicitly a **broader synthesis layer**: it identifies periods of substantial career-direction/phase change and reports which of the narrower existing modules (Job Change, Promotion, Business Start, Retirement, Recognition/Award, Financial Gain, Relocation, Foreign Travel, Higher Education) also explain the same period, rather than duplicating any of their calculations. Core flow: Natal Career Factors → Dasha Activation → D10 Confirmation → Transit Confirmation → Candidate Window → Event Classification → Career Phase. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Divisional charts:** `vargaPosition(longitude, 'D10')` — reused directly, the same D10 engine used by Career Start, Promotion, Job Change, Business Start, Higher Education, Retirement, and Recognition/Award Timing.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **Cross-module reads (the core of this module, never duplicated):** `window.JobChangeTiming`, `window.PromotionTiming`, `window.BusinessStartTiming`, `window.RecognitionAwardTiming`, `window.FinancialGainTiming`, `window.ForeignTravelTiming`, `window.RetirementTiming`, `window.HigherEducationTiming` — each module's own `.refresh()` output is read directly via exact MD/AD/PD match (the same cross-module read pattern established by Job Change Timing's own Promotion comparison, carried through every subsequent module). `window.Relocation` (direction/compass module, no timing windows) is reported as "Not Prominent" by design, consistent with how Retirement Timing treats the same module.

## Distinction from other timing modules (Section 4)

This is the architectural core of the module: a candidate window is never created merely because another module already identifies that period. Instead, `getRelatedEvents()` checks all nine related modules for an exact MD/AD/PD overlap and reports Present/Not Prominent for each, and `classifyEvent()` uses both the activated houses AND the related-events result (e.g. a Business Start overlap combined with 7th/11th/2nd activation specifically classifies as "Employment to Business," while a Retirement overlap combined with 6th/12th activation classifies as "Career Interruption" rather than generic "Employment Structure Change").

## Section-by-section mapping to the spec

- **Natal Career Turning-Point Potential (Section 9):** 2nd/3rd/5th/6th/7th/9th/10th/11th/12th houses plus Sun/Saturn/Mercury/Jupiter/Mars/Rahu/Ketu karakas, each classified from actual dignity, occupants, and aspects. Reports one of four descriptive states (Clearly Present / Present / Mixed / Limited Evidence) — never a numerical score.
- **House Relationship Signatures (Section 6):** all twelve named signatures (10-6, 10-7, 10-11, 10-9, 10-12, 10-3, 10-5, 6-12, 7-10, 9-10) plus two triple-house convergences (10-11-2, 10-12-9) implemented as explicit reusable rules.
- **Natural Significators (Section 8):** Sun/Saturn/Mercury/Jupiter primary/supporting, Mars/Rahu/Ketu contextual — Rahu/Ketu explicitly never treated as automatic indicators; their role is read purely from house/lordship/conjunction/dasha/transit context.
- **D10 Confirmation (Section 11):** reused directly via `vargaPosition('D10')`; four-level descriptive scale (Supports / Moderately supports / Provides mixed evidence / Does not materially confirm) matching the spec's exact wording, confirmation only, never replacing D1.
- **Dasha Activation (Section 10):** MD/AD/PD lord connection to all nine career-relevant houses, with full placement/dignity/conjunction/aspect/significator-role detail per period.
- **Transit Confirmation (Section 12):** Jupiter over 9th/10th/11th, Saturn over 6th/10th/11th/12th (never automatically negative), Rahu/Ketu strictly secondary — a nodal transit alone never creates a window (enforced structurally: nodes contribute to `convergenceFactors` only via the unrelated `matchCount`/`d10Confirmation`/other-transit checks, never counted on their own).
- **Multi-Factor Convergence (Section 13):** `convergenceFactors` explicitly combines natal 10th-lord connection, D10 confirmation, Jupiter transit, Saturn transit, dasha-level match count, and related-event presence — surfaced transparently in each window's "Why this period" list and cautions, never as an opaque score.
- **Event Classification (Section 15):** all relevant named categories (Major Role Transition, Major Responsibility Increase, Employment to Business, Employment to Consultancy/Independent Practice, Major Overseas Career Transition, Career Interruption, Career Restart, Industry/Direction Change, Significant Career Expansion, Function/Department Change, Other) derived from house convergence plus related-event cross-checks — interpretive, never guaranteed.
- **Window Classification (Section 16):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, percentage, star rating, or "best"/"worst" label.
- **Related Career Events (Section 17):** a dedicated cross-check section against all nine related modules, read-only.
- **Career Phase Transition (Section 18):** Career Expansion / Restructuring / Redirection / Diversification / Consolidation / Exit, derived from the event classification — the module never infers the user's real-world career choice.
- **Historical Validation (Section 19):** arbitrary past-date lookup against the same dasha/transit/D10 machinery, treated as empirical implementation testing, never as proof of astrological certainty.
- **Calculation Trace (Section 20) + Rule Provenance (Section 21) + Result UI (Section 22) + User Controls (Section 23):** full seven-step trace, rule-ID-tagged evidence throughout, compact summary cards, forecast-horizon (1/2/3/5/10 years), minimum-support filter, and event-type filter, matching every prior module's conventions.
- **Important Astrological Limitations (Section 35):** enforced as an explicit rule (`CT-NOGUARANTEE-001`) — no guaranteed outcomes, no career recommendations, no rankings, no health/lifespan inference.

## Deliberate scope decisions

- `window.Relocation` is reported as "Not Prominent" by design rather than attempting a timing-window overlap check, since that module computes direction/distance, not candidate windows — consistent with how Retirement Timing already documents this same limitation.
- The related-events cross-check uses an exact MD/AD/PD match against each module's own candidate windows; a near-miss (adjacent but non-overlapping period) is intentionally not flagged, to avoid fabricating false convergence.
- Event classification purposely favors the most specific category the evidence supports (e.g. "Employment to Business" over generic "Employment Structure Change") only when the relevant cross-module module actually confirms an overlapping window — it never infers a business/consultancy transition from house evidence alone.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 40 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- Engine correctness: natal potential, D10 confirmation level, current dasha, 2 candidate windows generated for the test chart, correctly cross-referencing 7 of 9 related modules as "Present" for the test chart's current window (Relocation correctly "Not Prominent" by design), non-numeric window strength and event/phase classification populated correctly.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero windows where Rahu/Ketu activation alone (without Jupiter/Saturn/D10 support) produced a "strong candidate" (≥4 convergence factors) classification.
- Forbidden-language scan: the only text match for "guaranteed"/"best period"/"worst period" phrasing is the rule database's own explicit statement of what this module must never claim (a negated prohibition, not an affirmative claim) — no numeric score, percentage, star rating, ranking, or deterministic guarantee found anywhere in the rendered output.
- UI interaction: forecast-horizon selector, minimum-support filter, event-type filter, historical-date add/remove, and window-row click-to-expand trace all verified working.

## Known limitations

- Event classification relies on a fixed house/cross-module-overlap heuristic; it cannot read an actual job description, org chart, or employment contract.
- The related-events cross-check requires an exact MD/AD/PD match; it will under-report related events on cuspal/adjacent periods even when a human reviewer might judge them connected.
- As with every prior module, this analysis is a classical-method chart indication of career-transition timing, never a career recommendation, ranking, or guarantee of any outcome.

## Next recommended event-timing module

With fifteen event-timing modules now complete (Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, Vehicle Purchase, Retirement, Recognition/Award, and now Major Career Turning Point Timing), the core career/life-event timing surface is largely saturated. A natural next addition would be **Litigation/Legal Dispute Timing** (6th/7th/8th houses) or a strictly lifestyle-framed **Health/Wellness Timing** module (never diagnosis or prognosis), both following the same established architecture.
