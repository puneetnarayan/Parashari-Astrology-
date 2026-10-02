# Health & Recovery Timing — Research Notes

## Architecture
Standard pipeline: Natal Promise (1st/6th/8th/12th/11th + 5th/9th/10th/2nd) → Dasha Activation (MD/AD/PD) → Transit Confirmation (Jupiter/Saturn) → Candidate Window → Convergence Gate → Wellness/Recovery-Stage Classification → Automated Safety Filter → Calculation Trace.

## Reused components (cite file)
- Chart/dignity: `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` (global, defined in `js/parashariCharts.js`/`js/planetaryStrength.js`, used exactly as in `js/propertySaleTiming/propertySaleTimingEngine.js`).
- Dasha: `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` (`js/dasha/`).
- Transit: `computeSingleLongitude()`, `ASPECT_OFFSETS` (`js/aspects.js`, `js/ephemeris.js`).
- No divisional chart is used per the spec (D9/other only "where already relevant" — not required here).

## Rule provenance
See `js/healthRecoveryTiming/healthRecoveryTimingRules.js` — 24 rules: classical house/karaka significations (provenance `classical`), plus application-synthesis rules for the context selector, convergence gate, stage classification, the mandatory safety filter, the no-diagnosis scope limit, the always-visible disclaimer, and cross-module checks.

## Historical validation
Supported via the standard candidate-window mechanism; the module does not require or store sensitive medical details — only a broad category label via `NS.recordKnownEvent()`.

## Scope boundaries / safety rules enforced structurally
- The 8th house is never read as death/lifespan — every 8th-house evidence string and caution explicitly states this.
- `NS.applySafetyFilter(text, isDisclaimerText)` scans every generated interpretation string for a list of forbidden patterns (death/dying/lifespan, diagnosis, disease/cancer/tumour/heart attack/stroke, accident/injury/surgery, medication/prescription/treatment, stopping/delaying care, pregnancy/childbirth, mental-health conditions/disorder) and rewrites any match to a safe fallback sentence. This runs on every evidence/reason/caution string before `NS.refresh()` returns — not just a UI-level disclaimer.
- Convergence gating: 8th-house activation alone is explicitly prevented from raising a window above a weak classification (`convergenceFactors` formula excludes it unless `matchCount >= 2`).
- Unit test: `safety_filter_test.js` (run in this session) proves the filter catches a deliberately-injected phrase ("...may die soon and should stop taking medication...") and rewrites it; a safe astrological sentence passes through unchanged.
- The medical disclaimer is included in every `NS.refresh()` result (`result.disclaimer`) and rendered at the top of every UI render, not only once.
