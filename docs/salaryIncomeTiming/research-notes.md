# Salary / Income Increase Timing — Implementation Notes

## What was implemented

A new event-timing module, **Salary / Income Increase Timing** (`salaryIncomeTiming`), explicitly distinct from Financial Gain/Wealth Timing (broader gains: investments, business profit, inheritance), Promotion Timing (designation/responsibility change), and Job Change Timing (employer transition). It identifies astrologically supportive periods for salary increments, bonus/incentive payouts, salary revision, promotion-linked pay increases, arrears realization, compensation restructuring, employer-change-linked compensation change, and income restoration — and explicitly distinguishes which of those linkage types a given window is most consistent with. Core flow: Relevant Houses → House Lords → Natal Salary Indicators → Dasha → Transit → Convergence → Candidate Window. **No divisional chart is used**, per the spec's explicit Section 5 instruction — confirmed in code: `salaryIncomeTimingEngine.js` contains no `vargaPosition()` call anywhere.

## Existing components reused (confirmed by code inspection)

- Chart/dignity primitives: `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS`, `ASPECT_OFFSETS` — identical helper-function shapes to the six prior modules (e.g. `getPlanetSnapshot`, `getHouseSnapshot`, `classifyHouse`, `classifyKaraka`, `housesConnected` mirror `js/propertySaleTiming/propertySaleTimingEngine.js` line-for-line in structure).
- Dasha: `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()`.
- Transit: `computeSingleLongitude(name, date)` plus `ASPECT_OFFSETS`.
- Cross-module reads (all defensive, read-only, via each module's own `.refresh()`):
  - `window.PromotionTiming.refresh()` (confirmed global name: `js/promotionTiming/promotionTimingEngine.js` line 13) — promotion overlap.
  - `window.JobChangeTiming.refresh()` (confirmed global name: `js/jobChangeTiming/jobChangeTimingEngine.js` line 15) — employer-transition overlap.
  - `window.CareerTurningPointTiming.refresh()` (confirmed global name: `js/careerTurningPointTiming/careerTurningPointTimingEngine.js` line 18 — this is the actual global for "Major Career Turning Point") — broader career-transition overlap.
  - `window.FinancialGainTiming.refresh()` (confirmed global name: `js/financialGainTiming/financialGainTimingEngine.js` line 21) — broader financial-gain overlap.

## Rule provenance

51 rules in `window.SALARY_INCOME_TIMING_RULES` (`js/salaryIncomeTiming/salaryIncomeTimingRules.js`): Natal Promise (4), Supporting House (5), Natural Significator (8), House Relationship Signature (11 primary + 5 contextual), Methodology Note (no-divisional-chart), Natal Promise Scale, Dasha, Transit (4 rule entries), Event Classification, Salary Event Stage, Cross-Module Checks (4), Limitations, Window Confidence — application-synthesis rules each explicitly labeled `provenance: 'application'`.

## Key distinctions enforced

- **Promotion ≠ Salary Increase**: every candidate window carries an explicit `linkage` field — `promotion-linked`, `employer/job-change linked`, `bonus/incentive linked`, `salary-revision linked`, or `independent of promotion` — computed from house-activation pattern, never assumed from the mere presence of a gain.
- **Never assumes every financial gain is salary-related**: event classification (`classifyEventType`) requires 6th-house (employment/service) activation as a baseline signature before any salary-specific label is applied; absent that, Financial Gain Timing's own output is the appropriate module.
- **No numeric prediction**: no salary amount, percentage increase, or bonus figure is ever computed or displayed — confirmed by forbidden-language scan (regex for `\d+%\s*(increase|raise)` found no genuine match in rendered output).

## Testing performed

`node --check` on all three files (pass). Full Playwright regression: 48 total tabs after all three new modules are added, zero real console/page errors. Forbidden-language scan confirmed no exact-amount, percentage, or employer/loan/investment-recommendation language anywhere in rendered output (the one regex match found was inside the module's own "never guarantees a salary..." disclaimer sentence).

## Known limitations

Salary-event-stage classification (Performance Evaluation → ... → First Revised Payment) is a house-convergence heuristic with no awareness of an actual employer review cycle or payroll calendar; it indicates a broader astrological process window, not an exact payroll date.
