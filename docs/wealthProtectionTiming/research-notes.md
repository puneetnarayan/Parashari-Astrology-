# Wealth Protection & Asset Consolidation Timing — Research Notes

## Purpose

Identifies astrologically relevant periods for wealth preservation, asset consolidation,
financial simplification, family asset organization, ownership/documentation
restructuring, nomination/beneficiary review, liability-asset balancing, legacy
preparation, and the transition from accumulation toward preservation. It is a timing
interpretation module only — never financial, investment, legal, tax or estate-planning
advice.

## Architecture

Standard 4-file module following this app's established timing-module pattern (see
`docs/_moduleDiscoveryInventory.md` for the verified global-name/shape inventory this
build relied on):

- `js/wealthProtectionTiming/wealthProtectionTimingRules.js` — `window.WEALTHPROTECTION_TIMING_RULES`, an array of rule objects with provenance (`classical` vs `application`).
- `js/wealthProtectionTiming/wealthProtectionTimingEngine.js` — `window.WealthProtectionTiming`, pure calculation engine, no DOM access.
- `js/wealthProtectionTiming/wealthProtectionTimingUI.js` — `window.WealthProtectionTimingUI`, rendering layer only, writes into `#wealthprotection-root`.
- Tab wiring: `index.html` button `#tabBtnWealthProtectionTiming` / panel `#tabWealthProtectionTiming`; `js/ui.js` tab-click handler line `if (btn.dataset.tab === 'tabWealthProtectionTiming' && window.WealthProtectionTimingUI) window.WealthProtectionTimingUI.render();`.

## Exact reused components (no duplicate astrology engines created)

- `state.chart` (populated in `js/ui.js` ~line 2018) — planets/ascendant data, read via `NS.getChartData()`.
- `SIGNS`, `SIGN_LORD`, `normalizeDegrees()` — `js/parashariTables.js`.
- `detailedDignity()` — `js/interpretations/dignityDetails.js`.
- `NATURAL_BENEFICS` — `js/interpretations2/ruleEngine.js`.
- `SHADBALA_PLANETS` — `js/shadbala/shadbalaEngine.js` (used only to decide whether `detailedDignity` applies; actual Shadbala numeric data is read defensively from `state.shadbala` in `NS.assessShadbalaSupport()`, which returns `{available:false}` when absent — Shadbala is never recalculated).
- `ASPECT_OFFSETS` — `js/aspects.js`, used in `NS.getHouseSnapshot()` and `NS.transitCheckAt()`.
- `computeSingleLongitude()` — `js/ephemeris.js`, used for transit position at an arbitrary date.
- `vargaPosition()` — `js/divisionalCharts.js`, used only for D2/Hora in `NS.assessD2Confirmation()`. No separate divisional-chart engine was built.
- `state.ashtakvarga` — read defensively in `NS.assessAshtakavargaSupport()`; returns `{available:false}` when absent. No duplicate Ashtakavarga calculation.
- `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` — `js/dasha/vimshottariDasha.js`, used for MD/AD/PD extraction exactly as every other timing module does.
- Cross-module overlap check reuses the established defensive idiom `if (window[key] && typeof window[key].refresh === 'function')` with `Array.isArray` guards, and additionally handles MarriageTiming-style `{primary, secondary}` object shapes via `windowsArrayFrom()` (a local helper), since that shape was confirmed during discovery to be inconsistent with the array-based modules.

## New reusable functions this module adds

- `NS.evaluateWealthProtectionNatalPromise()` — natal-promise evaluator as specified (spec section 10), classifying Strong/Moderate/Contextual/Limited from house + relationship convergence, never a numeric score.
- `NS.evaluateWealthProtectionDashaPeriod(mdLord, adLord, pdLord)` — reusable dasha-period evaluator as specified (spec section 14), returning per-level house ownership/occupation, dignity, and natural-significator role.
- `NS.assessHouseRelationships()` — the full section-7 relationship matrix (2↔11, 2↔8, 2↔4, 2↔9, 2↔12, 4↔8, 4↔11, 6↔2, 6↔11, 8↔9, 8↔11, 9↔11, 10↔2/11, 12↔2/11), each backed by a provenance rule.
- `NS.classifyEventStageAndType(activatedHouses)` — maps an activated-house set to one or more event stages (section 20) and event types (section 4), never a single generic "wealth" label.
- `NS.scanForForbiddenLanguage(text)` — this module's own financial-domain safety scanner (investment/lender/tax-advice/guaranteed-outcome/death-lifespan patterns), independent of `HealthRecoveryTiming`'s medical-domain scanner, since the forbidden-pattern sets differ by domain.

## Event types implemented (spec section 4)

`wealthPreservation`, `assetConsolidation`, `financialSimplification`, `familyAssetOrganization`, `ownershipRestructuring`, `nominationDocumentation`, `liabilityAssetBalancing`, `legacyPreparation`, `accumulationToPreservation`, `financialReorganization`, `assetProtection`, `consolidationCompletion`. One or more can apply per candidate window (`NS.classifyEventStageAndType`).

## House logic (spec sections 5–9)

Primary houses: 2nd, 11th, 8th, 4th, 9th, 12th. Supporting/contextual houses: 1st, 5th, 6th, 7th, 10th, 3rd. Each primary house is classified via `classifyHouse()` (Strong/Supporting/Moderate/Challenging) using dignity, occupants, and lord placement — reused unchanged in spirit from `majorExpenditureTiming`'s `classifyHouse()` but re-implemented locally per module convention (no shared utility module exists yet for this). Natural significators (Jupiter/Venus/Mercury/Saturn/Moon/Sun/Mars, Rahu/Ketu noted contextually) are evaluated via `classifyKaraka()`.

## Dasha logic (spec sections 14–15)

MD/AD/PD house-connection evaluation via `evaluateWealthProtectionDashaPeriod`; stage classification is driven by the combination of activated primary houses (2+11 → consolidation, 2+8 → ownership restructuring, 8+9 → legacy preparation, 6+2 → liability rebalancing, etc.) per spec section 15, never a generic "wealth" dasha label.

## Transit logic (spec sections 16–17)

Jupiter and Saturn are primary transit planets, checked against houses 2/11/4/8/9 (Jupiter) and 2/6/8/12 (Saturn) via `NS.transitCheckAt()`, reusing `computeSingleLongitude` + `ASPECT_OFFSETS` exactly as other modules do. Jupiter+Saturn simultaneous activation is flagged as `transit.convergence` and treated as stronger structural confirmation only when also supported by dasha/natal evidence (never alone).

## D2/Shadbala/Ashtakavarga integration status

- **D2 (Hora): fully integrated.** `NS.assessD2Confirmation()` reuses `vargaPosition(..., 'D2')` for ascendant and Jupiter; used only as supporting confirmation, never standalone.
- **Shadbala: integrated, conditional.** `NS.assessShadbalaSupport()` reads `state.shadbala` defensively; returns `{available:false}` and is gracefully omitted from the UI/trace when absent (confirmed in this app's current chart data — no `state.shadbala` structure was populated at test time, so the module correctly displayed "not available — omitted").
- **Ashtakavarga: integrated, conditional.** `NS.assessAshtakavargaSupport()` reads `state.ashtakvarga` defensively; gracefully omitted when absent.

## Candidate-window generation (spec sections 18–19)

`NS.buildCandidateWindows()` requires convergence ≥1 from: dasha match count ≥3, Jupiter/Saturn transit activity, Jupiter+Saturn convergence, D2 support, and ≥2 activated primary houses. Evidence classification (never numeric): **Strong** (convergenceFactors ≥4), **Moderate** (≥2), **Contextual** (≥1), **Limited** (0, filtered out). No candidate window is ever generated from a single factor.

## Calculation trace (spec section 22) — 10 steps

Implemented as `NS.CALCULATION_SEQUENCE` (10 entries) plus a per-window `calculationLog` array and a per-window trace block in the UI (`renderWindowDetail`) covering: natal foundation → house relationships → natural significators → dasha → transit → D2 → Shadbala/Ashtakavarga → convergence → event-stage mapping → final interpretation.

## Rule provenance (spec section 23)

Every rule in `WEALTHPROTECTION_TIMING_RULES` carries `provenance: 'classical' | 'application'` and a `source` string; classical house/karaka rules cite the Parashari Bhava name, application-synthesized rules (house relationships, convergence, safety) say so explicitly. No fabricated classical citations.

## Cross-module integration (spec section 29)

`NS.checkCrossModules()` checks (descriptively only) against `FinancialGainTiming`, `SalaryIncomeTiming`, `MajorExpenditureTiming`, `LoanDebtReliefTiming`, `PropertyTiming`, `PropertySaleTiming`, `InheritanceLegacyTiming`, `InsuranceProtectionTiming`, `RetirementTiming`, using the app's established defensive `window[key].refresh()` idiom with `Array.isArray` guards and explicit handling of the `{primary, secondary}` object shape (MarriageTiming-style) in case any checked module returns that shape. All overlap language is descriptive ("also overlaps X timing"), never a recommendation.

## Scope boundaries (how this module is distinct from existing ones — spec section 3/29)

This module never duplicates the calculations of Financial Gain (income/gain timing), Salary Increase, Major Expenditure (outflow/commitment timing), Loan/Debt Relief (borrowing/repayment timing), Property Purchase/Sale (acquisition/disposal timing), or Inheritance/Legacy (succession-event timing) — it only cross-references their candidate windows descriptively for overlap, via `NS.checkCrossModules()`, and otherwise computes its own independent natal/dasha/transit analysis scoped to preservation/consolidation/restructuring/documentation/simplification themes.

## Safety (spec sections 31–32)

- 8th house is used **only** for restructuring, shared resources, succession/legacy themes, transformation of ownership, and long-term financial reorganization. `classifyHouse(8, ...)` and the per-window caution text explicitly state this boundary; it never emits death/lifespan/fatal-event language. Verified by an automated Playwright test (`test_wealthprotection_purity.js`) that confirms (a) no 8th-house-only-activated candidate window reaches the "Strong" evidence tier, and (b) the only occurrences of words like "death"/"lifespan" anywhere in engine output are inside the safety-caution/disclaimer text itself (negated form: "never death, lifespan...").
- `NS.scanForForbiddenLanguage()` is this module's own financial-domain forbidden-language scanner (investment/lender/tax-advice/guaranteed-outcome/death-lifespan patterns), tested directly (positive and negative cases both verified).
- Explicit disclaimer included in every `refresh()` result (`result.disclaimer`) and rendered in the UI.
- Manual grep of the shipped `.js` source confirms every occurrence of guarantee/lender/invest/tax-advice/legal-advice/lifespan/death-related words is inside comments or negated disclaimer/caution prose — never an affirmative recommendation or prediction.

## Tests run

1. `node --check` on all 3 new `.js` files — passed.
2. Playwright regression (`test_wealthprotection.js`): loads app, generates example chart, clicks all 53 tab buttons (tab count went from 52 to 53 `class="tab-button"` elements in `index.html`), exercises the Wealth Protection tab's objective/asset-context/horizon/evidence selectors, expands all `<details>` calculation-trace elements, clicks a candidate-window row to expand its detail — zero `pageerror`/console errors.
3. Purity/safety test (`test_wealthprotection_purity.js`): confirmed 0 candidate windows are both 8th-house-only-activated and classified "Strong"; confirmed all "death/lifespan" regex hits across all candidate windows are confined to the safety-caution/disclaimer text; confirmed `scanForForbiddenLanguage` correctly flags a guaranteed-success sentence and correctly passes a compliant "astrologically supportive" sentence.
4. Forbidden-language source grep across the Engine/UI files — all hits are comments or negated disclaimer/caution text, no affirmative violations.

## Limitations / follow-up

- Shadbala/Ashtakavarga support is conditional on `state.shadbala`/`state.ashtakvarga` structures being populated by the app in the exact shape this module expects (`state.shadbala[name]` or an array with `{name}`); if the app's actual Shadbala storage shape differs, `NS.assessShadbalaSupport()` will harmlessly report "not available" rather than crash, but should be revisited once a module with firmer Shadbala integration confirms the exact field layout.
- Report/PDF integration was not located as an existing generic hook in this pass; this module exposes all data needed for a future report-section addition via `window.WealthProtectionTiming.refresh()`'s structured return value, but no existing PDF/report generator call site was found to wire into during this build.
