# Home Construction / Renovation Timing — Implementation Notes

## What was implemented

A new event-timing module, **Home Construction / Renovation Timing** (`homeConstructionTiming`), explicitly distinct from Property Purchase Timing (acquisition), Property Sale Timing (disposal), Relocation (movement), and Vehicle Timing. It identifies astrologically supportive periods for construction start, foundation/ground-breaking, major structural renovation, extension, reconstruction, major repair/restoration, construction milestones, completion, and possession/first use. Core flow: Relevant Houses → House Lords → Natal Promise → D4 Confirmation → Dasha → Transit → Convergence → Event Stage.

## Existing components reused (confirmed by code inspection)

- Chart/dignity primitives: `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS`, `ASPECT_OFFSETS` — same pattern as `js/propertySaleTiming/propertySaleTimingEngine.js` lines 25–52.
- Dasha: `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` — identical usage pattern to `js/inheritanceLegacyTiming/inheritanceLegacyTimingEngine.js`.
- Transit: `computeSingleLongitude(name, date)` plus `ASPECT_OFFSETS`.
- Divisional chart: `vargaPosition(longitude, 'D4')` reused directly in `NS.getD4()` (`js/homeConstructionTiming/homeConstructionTimingEngine.js`) — the exact same D4 call pattern used by `js/propertySaleTiming/propertySaleTimingEngine.js` line 58 and Property Purchase Timing; no second D4 engine was created.
- Cross-module reads (all defensive, read-only, via each module's own `.refresh()`):
  - `window.PropertyTiming.refresh()` — property-acquisition overlap.
  - `window.PropertySaleTiming.refresh()` — property-disposal overlap.
  - `window.LoanDebtReliefTiming.refresh()` — guarded with `if (window.LoanDebtReliefTiming && window.LoanDebtReliefTiming.refresh)` so the cross-check degrades gracefully regardless of module load order (Loan/Debt Relief Timing's script tag is in fact loaded earlier in `index.html`, but the check remains defensive per the task's explicit instruction).
  - `window.FinancialGainTiming.refresh()` — broader financial-resource overlap.
  - Relocation theme is **self-computed** from this module's own house activation (4th+12th+3rd/9th), since the existing Relocation module is a direction/compass tool with no timing windows — consistent with how Property Sale Timing documents this same limitation.

## Rule provenance

48 rules in `window.HOME_CONSTRUCTION_TIMING_RULES` (`js/homeConstructionTiming/homeConstructionTimingRules.js`), split into: Natal Promise (4), Supporting House (5), Natural Significator (7), House Relationship Signature (14), D4 Confirmation (1), Dasha (1), Transit (5), Natal Promise Scale / Event Stage / Delay-Obstruction / Cross-Module Checks / Limitations / Window Strength (application-synthesis rules, each explicitly labeled `provenance: 'application'` and never presented as a classical citation).

## Key structural safeguards enforced

- **Convergence gating**: a candidate window is retained only when at least 2 of {D4 confirmation, Jupiter transit, Saturn transit, Mars transit, ≥3 dasha-level matches, simultaneous 4th+10th activation} are present (`qualification` logic in `buildCandidateWindows`); a single Rahu/Ketu-only or house-only factor cannot alone drive the strongest ("Strongly Supportive") label.
- **Mars never implies accident/injury**: Mars transit is read strictly as a secondary execution/construction indicator (`HC-TRANSIT-MARS`); the UI explicitly labels it "(execution indicator only)" and the Limitations section states the module never predicts accidents, injuries, or deaths.
- **12th-house activation is never automatically negative** — used only as expenditure/completion-cost context, consistent with the spec.

## Testing performed

`node --check` on all three files (pass). Full Playwright regression: 48 total tabs after all three new modules are added (up from 45), zero real console/page errors (only a pre-existing unrelated `favicon.ico` 404). Purity check confirmed zero "Completion"-stage windows with fewer than 2 convergence factors. Forbidden-language scan confirmed the only matches for accident/injury/guarantee wording are inside the module's own "never ..." disclaimer sentences, never asserted as fact.

## Known limitations

Event-stage classification is a house-convergence heuristic with no awareness of an actual permit, contractor, or construction schedule; it indicates a broader astrological phase, not a specific calendar date for ground-breaking or completion.
