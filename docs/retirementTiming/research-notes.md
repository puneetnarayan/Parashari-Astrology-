# Retirement Timing — Implementation Notes

## What was implemented

A thirteenth event-timing module, **Retirement Timing**, added alongside Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, and Vehicle Purchase Timing. It follows the identical architecture: Natal Career Structure → Retirement/Work-Transition Indicators → Dasha Activation → D10 Confirmation → Transit Confirmation → Candidate Window → Retirement Event Classification → Calculation Trace. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique. This module is strictly a career-transition event-timing module: it never predicts health, lifespan, or death.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Divisional charts:** `vargaPosition(longitude, 'D10')` — reused directly as the principal career-transition confirmation chart, the same D10 engine used by Career Start, Promotion, Job Change, Business Start, and Higher Education Timing.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **Cross-module reads (not duplication):** `window.JobChangeTiming.refresh()` for the essential retirement-vs-job-change distinction; `window.BusinessStartTiming.refresh()` for the employment-to-business/independent-work cross-check; `window.FinancialGainTiming.refresh()` for the financial-transition cross-check.
- **Relocation cross-reference (descriptive only):** `window.Relocation` is a direction/compass-based module (bearing, distance, direction label), not a timing module with candidate windows. Rather than force-fitting it into the timing cross-check pattern used for the other three modules, Retirement Timing detects a 4th/12th/9th residence-transition theme in its own activation data and, when present, points the user to the existing Relocation tab for location-specific guidance — never duplicating or fabricating a timing calculation that module doesn't perform.

## Retirement vs. Job Change distinction (Section 4)

This distinction is enforced structurally, not just descriptively: when a candidate window overlaps an existing Job Change Timing window and the 12th house is not independently activated, the window is classified as "Career Transition / Mixed" rather than being forced into a specific retirement sub-type — directly implementing the spec's Section 4 requirement that not every 10th/12th-house activation be classified as retirement.

## Section-by-section mapping to the spec

- **Natal Career Structure (Section 10):** 2nd/3rd/4th/5th/6th/8th/9th/10th/11th/12th houses plus Saturn/Sun/Mercury/Jupiter/Venus/Moon karakas, each classified from actual dignity, occupants, and aspects. Uses only cautious descriptive language ("the chart shows a strong long-term professional structure," never "you will retire at exactly age X").
- **House Relationship Signatures (Section 7):** 10-12, 6-12, 10-8, 10-4, and 10-11-with-completion-context signatures for career completion/exit; business-transition and consultancy-transition signatures reusing house convergence plus karaka strength.
- **D10 Confirmation (Section 14):** reused directly via `vargaPosition('D10')`; five-level non-numeric scale, explicitly marked unavailable rather than fabricated if chart data is missing.
- **D4/Relocation Cross-Check (Section 15):** Career Transition and Residence Transition are always displayed as two separate indications; D4/relocation calculations are never duplicated.
- **Financial Cross-Check (Section 16):** reads `window.FinancialGainTiming.refresh()` directly; Career Exit and Financial Transition shown separately; retirement is never equated with financial loss, and no investment advice is given.
- **Business/Independent Work Cross-Check (Section 17):** reads `window.BusinessStartTiming.refresh()` directly; produces the exact example interpretation from the spec ("more consistent with a transition from employment into independent professional activity than complete cessation of work") only when chart evidence (an overlapping window) supports it.
- **Dasha Activation Map (Section 13):** MD/AD/PD lord connection to all career/withdrawal houses, with full placement/dignity/conjunction/aspect/significator-role detail.
- **Transit (Section 18):** Saturn given primary attention (never automatically negative) over 4th/6th/10th/12th; Jupiter over 4th/9th/10th/11th/12th; Rahu/Ketu secondary only.
- **External Retirement Context (Sections 11-12):** an optional user-supplied expected retirement age is read from a UI input, converted to an expected date using the chart's own birth date, and compared against each candidate window's midpoint to produce one of the spec's exact comparison outputs ("astrological timing overlaps the expected retirement period," "occurs earlier," "occurs later") — used only as contextual information, never as an astrological conclusion, and no employer/country retirement rules are invented.
- **Retirement Event Classification (Section 20):** Career Winding-Down, Planned Retirement, Superannuation, Voluntary Retirement, Early Retirement, Employment to Independent Practice, Employment to Business, Retirement + Relocation, Post-Retirement Activity — a window can carry multiple labels; ambiguous evidence (including any Job Change overlap without independent 12th-house activation) falls back to "Career Transition / Mixed" rather than a forced specific label. The module never infers the motivation behind a voluntary or early transition.
- **Health/Death Exclusion (Section 21):** enforced as an explicit rule (`RET-NOHEALTH-001`) and verified by an automated forbidden-phrase scan — no lifespan, death, or health-decline claims appear anywhere in the module.
- **Window Classification (Section 22):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, star rating, ranking, or exact guaranteed retirement age.
- **Calculation Trace (Section 23) + Result Display (Section 24) + User Controls (Section 25):** full copy-able log, per-window click-to-expand trace, compact summary card, forecast-period (1/2/3/5/10 years), retirement-event filter, and optional expected-retirement-age input, matching every prior module's conventions.
- **Historical Validation (Section 33):** arbitrary past-date lookup against the same dasha/transit/D10 machinery, never adjusting rules to fit the outcome.

## Deliberate scope decisions

- The Relocation cross-check is descriptive/thematic only (a 4th/12th/9th activation flag pointing to the Relocation tab), not a `.refresh()`-based candidate-window overlap check, because the existing Relocation module is architecturally a direction/compass tool, not a timing module — this is documented explicitly rather than silently assumed.
- Retirement motivation (why someone retires voluntarily or early) is never inferred — the module only distinguishes timing and house/significator evidence, consistent with the spec's repeated "do not infer motivation" instruction.
- No health, lifespan, or death content is generated under any circumstance, enforced by both the engine's design and an automated text scan.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 38 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- Engine correctness: natal career structure, D10 confirmation level, current dasha, 2 candidate windows generated for the test chart, non-numeric window strength and multi-label event classification populated correctly.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero windows where a lone 12th-house activation alone forced a specific (non-"Mixed") retirement classification.
- External-context verification: setting an expected retirement age of 60 produced correctly computed comparison outputs for each candidate window ("occurs earlier than," "overlaps") directly from `window.RetirementTiming.refresh()`.
- Forbidden-language scan: the only text match for lifespan/health/death-related phrasing is the rule database's and UI's own explicit statement of what this module must never do (a negated prohibition, not an affirmative claim) — no numeric score, star rating, ranking, exact guaranteed retirement age, or actual health/lifespan/death claim found anywhere in the rendered output.
- UI interaction: forecast-period selector, retirement-event filter, expected-retirement-age input, historical-date add/remove, and window-row click-to-expand trace all verified working.

## Known limitations

- The employment/business/independent-practice/long-institutional-career tendency scoring is a fixed internal heuristic, not a validated predictive instrument.
- The Relocation cross-check is thematic only; it does not pull timing windows from the Relocation module since that module does not compute any.
- As with every prior module, this analysis is a classical-method chart indication of career-transition timing, never a prediction of exact retirement age, motivation, health, lifespan, or death.

## Next recommended event-timing module

With Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, Vehicle Purchase, and now Retirement Timing complete, a natural next addition would be **Litigation/Legal Dispute Timing** (6th/7th/8th houses) or **Health/Wellness-Linked Lifestyle Timing** (framed strictly around lifestyle/routine changes, never diagnosis or prognosis), both following the same established architecture.
