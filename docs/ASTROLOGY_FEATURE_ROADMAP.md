# Parashari Astrology App — Feature Roadmap & Audit

Audit date: 2026-10-03
Branch at audit time: `claude/parashari-astrology-app-32c7gj`
Working tree at audit start: clean (`git status --short` empty before this audit's own file additions)
Most recent 5 commits (the "4 recent modules" referenced by the spec, interpreted as the latest module-adding commits):
1. `eab9bdc` Add Major Life Transition / Phase Change Timing module (step 5/5)
2. `eb522b5` Add Important Event Sequence / Life Timeline module (step 4)
3. `9c04d63` Update module discovery inventory for step 3 (Dasha Life Phase)
4. `e3ee831` Add Dasha-Based Life Phase Analysis module (step 3)
5. `457dc37` Add Yoga Activation Timing module

## Status enum used below
`Implemented` / `Partially implemented` / `Missing` / `Duplicate-overlapping` / `Blocked` / `Needs manual verification`

---

## Architecture inventory

- **App type**: static, no-build HTML/CSS/JS. No bundler, no transpiler, no framework. `package.json` has a single script: `"start": "python3 -m http.server 8000"`. No test runner, no linter configured.
- **Entry point**: `index.html` (1,120 lines), loads 153 `<script>` tags (one per module file, no module bundling).
- **Tabs**: 58 distinct `data-tab="..."` values registered in `index.html`, each with a corresponding panel and dedicated JS file(s) under `js/`.
- **Core engines** (verified present, globals confirmed via `docs/_moduleDiscoveryInventory.md` and spot-checked against source):
  - `js/ephemeris.js` — `computeSingleLongitude`, planetary position calculations.
  - `js/divisionalCharts.js` — `vargaPosition`, `VARGA_DEFS` (D1–D60 divisional charts).
  - `js/dasha/vimshottariDasha.js` — `buildSubPeriods`, `findCurrentIndex`, Vimshottari Mahadasha/Antardasha/Pratyantardasha.
  - `js/aspects.js` — `ASPECT_OFFSETS`.
  - `js/parashariTables.js` — `SIGNS`, `SIGN_LORD`, `normalizeDegrees`.
  - `js/yogas/yogaEngine.js`, `js/yogas/yogaRules.js` — yoga detection (no `window.*` export; internal function only).
  - `js/shadbala/shadbalaEngine.js` — Shadbala strength, `SHADBALA_PLANETS`.
  - `js/ashtakvarga.js` — `computeAshtakvarga`, `computeBhinnashtakavarga` (no `window.*` export).
  - `js/matching/` — compatibility/matching engine.
  - `js/interpretations/`, `js/interpretations2/` — two parallel interpretation/rule-engine layers (see Duplication section).
- **Rule registries**: 59 files match `grep -rl "_TIMING_RULES"` across `js/` — i.e. essentially every timing module (career, marriage, property, health, etc.) defines its own `<NAME>_TIMING_RULES` array, following a consistent `window.<Name>Timing` (engine) / `window.<Name>TimingUI` (renderer) / `window.<NAME>_TIMING_RULES` (rules) convention per `docs/_moduleDiscoveryInventory.md`.
- **Documentation**: `docs/_moduleDiscoveryInventory.md` (partially-verified cross-module API inventory, spot-checked below) plus 37 per-module research-note subfolders under `docs/` (one per timing module built to date).
- **Persistence**: No `localStorage`/`indexedDB`/Supabase usage found anywhere in `js/` (`grep -r "localStorage|supabase"` returned zero hits). The "Saved Natives" feature (`js/savedNatives/csvUtil.js`) persists via **CSV import/export**, not browser storage or a backend — confirmed by reading the file header: an RFC4180 CSV parser/serializer for round-tripping birth-data files, including compatibility with a "sibling KP app."
- **Deployment**: `.github/workflows/auto-merge-to-main.yml` triggers `on: workflow_dispatch` only (manual). Its own comment header confirms automatic Vercel deploy-on-push was intentionally disabled by prior user instruction. No deploy was triggered or touched during this audit.
- **Tests/lint/build**: None exist in the repo (no test framework, no `.eslintrc`, no CI test job). The only verification method available is `node --check <file>.js` (JS syntax validation) and manual Playwright-style browser regression (referenced in prior session commit messages, but no automated Playwright config/files found in-repo). **This audit ran `node --check` against every one of the ~153 JS files under `js/`; all passed (zero syntax errors).**

---

## Feature status matrix

Legend: Engine column = confirmed `window.*` global or plain function; Tab = confirmed `data-tab` id in `index.html`.

| Feature (spec candidate) | Status | Evidence | Reusable engines | Complexity if missing | Action |
|---|---|---|---|---|---|
| Career Start Timing | Implemented | dir `js/careerStartTiming/`, tab `tabCareerStartTiming` | Dasha, transit | — | Keep |
| Job Change Timing | Implemented | dir `js/jobChangeTiming/`, tab `tabJobChangeTiming` | Dasha | — | Keep |
| Promotion Timing | Implemented | dir `js/promotionTiming/`, tab `tabPromotionTiming` | Dasha | — | Keep |
| Salary/Income Increase Timing | Implemented | dir `js/salaryIncomeTiming/`, tab `tabSalaryIncomeTiming` | Dasha | — | Keep |
| Major Career Turning Point | Implemented | dir `js/careerTurningPointTiming/`, tab `tabCareerTurningPointTiming`, commit `00d3e2c` | FinancialGainTiming (cross-check) | — | Keep |
| Business Start Timing | Implemented | dir `js/businessStartTiming/`, tab `tabBusinessStartTiming`, commit `586346c` | — | — | Keep |
| Recognition/Award Timing | Implemented | dir `js/recognitionAwardTiming/`, tab `tabRecognitionAwardTiming`, commit `251becc` | FinancialGainTiming | — | Keep |
| Retirement Timing | Implemented | dir `js/retirementTiming/`, tab `tabRetirementTiming`, commit `8feafe0` | — | — | Keep |
| Financial Gain/Wealth Accumulation Timing | Implemented | dir `js/financialGainTiming/`, tab `tabFinancialGainTiming`, commit `3d4a139`. Acts as a cross-check dependency for ≥8 other modules per inventory doc | `window.FinancialGainTiming` | — | Keep (core dependency — treat as higher-risk-of-regression) |
| Major Expenditure Timing | Implemented | dir `js/majorExpenditureTiming/`, tab `tabMajorExpenditureTiming`, confirmed engine `window.MajorExpenditureTiming`, `result.candidateWindows` array shape | — | — | Keep |
| Loan/Debt Relief Timing | Implemented | dir `js/loanDebtReliefTiming/`, tab `tabLoanDebtReliefTiming`, engine `window.LoanDebtReliefTiming` | FinancialGain, PropertySale, PropertyTiming, VehiclePurchase (cross-checked) | — | Keep |
| Insurance/Financial Protection Timing | Implemented | dir `js/insuranceProtectionTiming/`, tab `tabInsuranceProtectionTiming`, engine `window.InsuranceProtectionTiming` | — | — | Keep |
| Wealth Protection/Asset Consolidation Timing | Implemented | dir `js/wealthProtectionTiming/`, tab `tabWealthProtectionTiming`, commit `317e8a7` (this was step 1 of the most recent 6-step 5-module batch) | — | — | Keep |
| Inheritance/Legacy Timing | Implemented | dir `js/inheritanceLegacyTiming/`, tab `tabInheritanceLegacyTiming`, engine `window.InheritanceLegacyTiming`, commit `467b87f` | FinancialGain | — | Keep |
| Property Purchase Timing | Implemented | dir `js/propertyTiming/`, tab `tabPropertyTiming`, engine `window.PropertyTiming` | — | — | Keep |
| Property Sale Timing | Implemented | dir `js/propertySaleTiming/`, tab `tabPropertySaleTiming`, engine `window.PropertySaleTiming`, commit `467b87f` | FinancialGain | — | Keep |
| Home Construction/Renovation Timing | Implemented | dir `js/homeConstructionTiming/`, tab `tabHomeConstructionTiming`, commit `5dc117b` | FinancialGain | — | Keep |
| Foreign Travel/Settlement Timing | Implemented | dir `js/foreignTravelTiming/`, tab `tabForeignTravelTiming`, commit `b17a911` | — | — | Keep |
| Relocation Timing | Implemented | dir `js/relocation/`, tab `tabRelocation` | — | — | Keep |
| Vehicle Purchase Timing | Implemented | dir `js/vehiclePurchaseTiming/`, tab `tabVehiclePurchaseTiming`, commit `a1dc95d` | — | — | Keep |
| Relationship/Partnership Start Timing | Implemented | dir `js/relationshipPartnershipTiming/`, tab `tabRelationshipPartnershipTiming`, commit `0a15d34` batch | — | — | Keep |
| Marriage Timing | Implemented | dir `js/marriageTiming/`, tab `tabMarriageTiming`. **Confirmed non-standard shape**: `result.windows` is an OBJECT `{primary, secondary}`, not an array, unlike all sibling modules — a real cross-module-consumption hazard (see Defects) | — | — | Keep, but flag shape inconsistency |
| Marriage Separation/Divorce Timing | Implemented | dir `js/marriageSeparationDivorceTiming/`, tab `tabMarriageSeparationDivorceTiming`, commit `467b87f` | — | — | Keep |
| Childbirth Timing | Implemented | dir `js/childbirthTiming/`, tab `tabChildbirthTiming` | — | — | Keep |
| Child Education Timing | Implemented | dir `js/childEducationTiming/`, tab `tabChildEducationTiming`, commit `0a15d34` batch | — | — | Keep |
| Higher Education/Degree Timing | Implemented | dir `js/higherEducationTiming/`, tab `tabHigherEducationTiming`, commit `5f72f85` | — | — | Keep |
| Health & Recovery Timing | Implemented | dir `js/healthRecoveryTiming/`, tab `tabHealthRecoveryTiming`, confirmed safety filter `NS.scanForForbiddenLanguage`/`applySafetyFilter` for medical/death language, commit `0a15d34` batch | — | — | Keep |
| Legal Matter Resolution Timing | Implemented | dir `js/legalMatterTiming/`, tab `tabLegalMatterTiming`, engine `window.LegalMatterTiming`, commit `b171ce5` | — | — | Keep |
| Spiritual Turning Point Timing | Implemented | dir `js/spiritualTurningPointTiming/`, tab `tabSpiritualTurningPointTiming`, commit `0da5344` | — | — | Keep |
| Yoga Activation Timing | Implemented | dir `js/yogaActivationTiming/`, tab `tabYogaActivationTiming`, commit `457dc37` (most recent-but-one batch) | Yoga engine (internal function, not window-namespaced) | — | Keep |
| Dasha-Based Life Phase Analysis | Implemented | dir `js/dashaLifePhase/`, tab `tabDashaLifePhase`, commit `e3ee831` (step 3) | Dasha engine | — | Keep |
| Life Timeline / Important Event Sequence | Implemented | dir `js/lifeTimeline/`, tab `tabLifeTimeline`, commit `eb522b5` (step 4, second-most-recent commit) | Cross-module aggregation of other timing engines | — | Keep |
| Major Life Transition/Phase Change Timing | Implemented | dir `js/majorLifeTransitionTiming/`, tab `tabMajorLifeTransition`, commit `eab9bdc` (most recent commit, step 5/5) | — | — | Keep |
| Core chart calculation (D1, ascendant, planets) | Implemented | `js/birthChart.js`, `js/ephemeris.js`, tab `tabCharts` / `tabMain` | — | — | Keep |
| Divisional charts (Vargas) | Implemented | `js/divisionalCharts.js` (`vargaPosition`, `VARGA_DEFS` covering D1–D60 per inventory doc), tab `tabDivisional` | — | — | Keep |
| Vimshottari Dasha engine | Implemented | `js/dasha/vimshottariDasha.js`, tab `tabDasha` | — | — | Keep |
| Transit analysis | Needs manual verification | No dedicated `tabTransit`; transit logic appears embedded inside individual timing modules (via `computeSingleLongitude`) rather than as a standalone tab/engine. Could not confirm a single unified "Transit" module exists separate from per-feature use | Ephemeris | Medium | Needs manual verification — may be intentionally distributed rather than missing |
| Yogas (planetary combinations) | Implemented | `js/yogas/yogaRules.js`, `js/yogas/yogaEngine.js`, tab `tabYogas`. Note: no `window.*` export — internal function only, confirmed in inventory doc | — | — | Keep |
| Ashtakavarga / Bhinnashtakavarga | Implemented | `js/ashtakvarga.js`, tabs `tabAshtakvarga`, `tabBhinnashtakavarga`, `tabAshtakvargaPredictions` (+ `js/ashtakvargaPredictions/`) | — | — | Keep |
| Shadbala (planetary strength) | Implemented | `js/shadbala/shadbalaEngine.js`, tab `tabShadbala`; also `js/planetaryStrength.js`, tab `tabStrength` — two related-but-distinct strength tabs | — | Low | Needs manual verification whether these two overlap/duplicate (see Dedup section) |
| Matching / Compatibility (Kundli Milan) | Implemented | `js/matching/`, tab `tabMatching` | — | — | Keep |
| Mangal Dosha | Implemented | `js/mangaldosha2/`, tab `tabMangalDosha2` (naming suggests a superseded v1 was removed/renamed; no `tabMangalDosha` (v1) found in current tab list, so no duplicate currently live) | — | — | Keep |
| Sade Sati | Implemented | `js/sadesati/`, tab `tabSadeSati` | — | — | Keep |
| Sudarshana Chakra | Implemented | `js/sudarshana/`, tab `tabSudarshana` | — | — | Keep |
| Kakshya / Kakshya Timeline | Implemented | `js/kakshya/`, `js/kakshyaTimeline/`, tabs `tabKakshya`, `tabKakshyaTimeline` | — | — | Keep |
| Nakshatra Interpretations | Implemented | `js/nakshatra/`, tab `tabNakshatraInterp` | — | — | Keep |
| Remedies (two systems) | Duplicate-overlapping | `js/remedies/` + `js/remedies2/`, tabs `tabRemedies`, `tabRemedies2`, **and** `tabRemediesCompare` (a tab that explicitly compares the two) — this is a confirmed, deliberately-surfaced duplication, not an accidental one, since a comparison tab exists | — | — | Consolidate long-term once comparison tab's findings are reviewed; not urgent since compare tab already manages the overlap transparently |
| Interpretations (two systems) | Duplicate-overlapping | `js/interpretations/` + `js/interpretations2/`, tabs `tabInterpretations`, `tabInterpretations2` — parallel rule-engine layers (inventory doc confirms `js/interpretations2/ruleEngine.js` holds `NATURAL_BENEFICS` while `js/interpretations/dignityDetails.js` holds `detailedDignity`) | — | — | Needs manual verification — determine if `2` is a strict superset/rewrite of v1 before consolidating; do not merge blindly |
| Saved Natives (multi-chart management) | Implemented | `js/savedNatives/csvUtil.js`, tab `tabSavedNatives`. Confirmed CSV-based (not localStorage/Supabase) | — | — | Keep |
| Parashari Analysis (general) | Implemented | `js/parashariAnalysis/`, `js/parashariCharts.js`, tab `tabParashariAnalysis` | — | — | Keep |
| Combustion / Conjunctions | Implemented | `js/combustion.js`, `js/conjunctions.js` — used as supporting calculations inside chart/interpretation tabs rather than their own top-level tabs | — | — | Keep |
| Knowledge Base | Implemented | `js/knowledgebase/`, tab `tabKnowledgeBase` | — | — | Keep |
| Panchang/daily almanac | Missing | No `tab` or `js/` directory found for Panchang (tithi/nakshatra-of-day/yoga-of-day/karana daily almanac) as a standalone feature, distinct from natal nakshatra interpretation | Ephemeris engine is reusable | Medium | Defer — add to backlog if spec explicitly calls for it |
| Muhurta (electional astrology) | Missing | No tab/dir found | Dasha, chart engines reusable | Large (new rule corpus) | Defer |
| Ashtottari/other alternate Dasha systems | Missing | Only Vimshottari Dasha confirmed (`js/dasha/vimshottariDasha.js`); no Ashtottari/Yogini/other dasha system file found | Core dasha period-building pattern reusable | Large | Defer |
| KP (Krishnamurti Paddhati) system | Missing / possibly separate app | `docs/_moduleDiscoveryInventory.md` references "the sibling KP app" for CSV compatibility, implying KP astrology lives in a **separate**, sibling repository, not this one | — | N/A | Out of scope — confirm with user whether KP belongs in this repo or stays separate |
| Numerology | Missing | No evidence found | — | Large | Defer |
| Remedy personalization/AI-generated remedies | Needs manual verification | Two remedy tabs exist (see above) but whether either does AI-personalized output vs. static rule lookup could not be confirmed without deeper code read (out of scope for this pass) | `remedies`, `remedies2` | — | Needs manual verification |

---

## Deduplication map

| Candidate name in spec | Already covered by (actual name) | Relationship |
|---|---|---|
| "Career transition timing" | `careerTurningPointTiming` + `careerStartTiming` + `jobChangeTiming` + `promotionTiming` | These four modules together supersede any single generic "career timing" candidate — do not build a new unified one; the decomposition already matches the spec's own granular naming in section 2.1 |
| "Wealth/financial timing" (generic) | `financialGainTiming`, `majorExpenditureTiming`, `loanDebtReliefTiming`, `insuranceProtectionTiming`, `wealthProtectionTiming`, `inheritanceLegacyTiming` | `financialGainTiming` is the hub; the others cross-check against it. A generic "wealth timing" candidate is fully superseded by this cluster |
| "Property timing" (generic) | `propertyTiming` (purchase) + `propertySaleTiming` + `homeConstructionTiming` | Covers purchase/sale/construction separately; no gap, no duplicate |
| "Relationship timing" (generic) | `relationshipPartnershipTiming` + `marriageTiming` + `marriageSeparationDivorceTiming` | Full lifecycle (start → marriage → separation) already covered |
| "Strength/Shadbala" | `js/shadbala/shadbalaEngine.js` (tab `tabStrength`/`tabShadbala` — **two tabs**, needs verification they aren't literal duplicates of the same output) | Possible internal duplication, see matrix row above |
| "Remedies" | `remedies` vs `remedies2` vs `remediesCompare` | Confirmed intentional duplication already being managed via a compare tab — do not naively delete either |
| "Interpretations" | `interpretations` vs `interpretations2` | Confirmed parallel systems; relationship (superset vs. rewrite) not fully resolved this pass — flagged `Needs manual verification`, not auto-consolidated per task's "no uncontrolled rewrite" rule |
| "Mangal Dosha" | `mangaldosha2` only (no live v1 tab) | No duplicate currently surfaced in the UI even though the `2` suffix suggests a prior v1 existed; if a `js/mangaldosha/` directory exists on disk unused, it would be dead code — not confirmed in this pass |

---

## Phased backlog (evidence-based, reordered from spec section 6)

**Phase 0 — Regression safety net (highest priority, lowest risk)**
- No automated tests exist anywhere in the repo for any of the 58 tabs or ~59 rule-array modules. Given the scale (153 JS files, zero syntax errors currently, but zero regression coverage), the single highest-leverage next action is a golden-chart fixture test harness (a fixed birth input + expected output snapshot per core engine: chart, dasha, divisional, yogas, ashtakvarga) so future module additions can be verified mechanically instead of only via `node --check` + manual Playwright spot-checks.
- Acceptance criteria: at least one fixed test-native JSON fixture + a Node script that recomputes chart/dasha/yoga/ashtakvarga outputs and diffs against recorded expected values; runnable via `node <script>.js` with no new dependencies (keep the app dependency-free).
- Risk: low (pure addition, no existing file changes needed).
- Dependencies: none.
- Complexity: Small.

**Phase 1 — Resolve flagged inconsistencies (correctness risk)**
- Marriage Timing's `result.windows` object-shape (`{primary, secondary}`) vs. every sibling module's array shape is a real foot-gun for the Life Timeline aggregator (`js/lifeTimeline/`) and any future cross-module consumer — confirm whether `lifeTimeline` already guards for it (inventory doc shows the correct defensive pattern was documented, but doesn't confirm every consumer uses it).
- Acceptance criteria: grep every consumer of `MarriageTiming.windows` access pattern; confirm each uses the `Array.isArray` guard documented in the inventory; fix any that don't.
- Complexity: Small. Risk: low (defensive-only change, no behavior change for correct callers).

**Phase 2 — Interpretations v1/v2 and Remedies v1/v2 reconciliation study**
- Determine (via deeper reading, not blind merge) whether `interpretations2`/`remedies2` fully supersede `interpretations`/`remedies`, partially overlap, or serve different purposes (e.g. v2 = rule-engine rewrite, v1 = legacy static text). Produce a short findings note before any consolidation.
- Complexity: Medium (requires reading both full trees). Risk: medium if acted on without the study (could remove functionality in active use by `tabRemediesCompare`).

**Phase 3 — Missing-feature candidates (defer, do not build this task)**
- Panchang/daily almanac, Muhurta/electional timing, alternate Dasha systems (Ashtottari etc.), numerology — all genuinely absent. Each would need its own scoped session per the task's "no uncontrolled rewrite" rule. Priority order suggested: Panchang (reuses existing ephemeris engine, moderate user value, medium complexity) > alternate Dasha systems (large, needs new period-building math) > Muhurta (large, new rule corpus) > numerology (orthogonal domain, lowest synergy with existing engines).

**Phase 4 — Shadbala/Strength tab overlap check**
- Confirm whether `tabStrength` (`js/planetaryStrength.js`) and `tabShadbala` (`js/shadbala/shadbalaEngine.js`) present genuinely different information (e.g. simple strength scoring vs. full six-fold Shadbala breakdown) or are redundant UI surfaces over similar data. Small effort, informs whether a future consolidation is warranted.

**Phase 5 — KP system scope decision**
- The module inventory doc references "the sibling KP app" implying KP astrology is intentionally out of this repo. Confirm with the user whether that's correct and whether any KP-related work should ever land here, to avoid future accidental duplication.

**Phase 6 — New feature tabs (explicitly out of scope for this task)**
- Any of the "Missing" items above that the user wants built should go through their own dedicated session with its own audit-informed scope, per the task's explicit instruction not to build new timing modules/tabs in this audit batch.

---

## Audit findings (defects discovered)

1. **No automated regression tests exist** for any of the 58 tabs/59 rule modules. This is a structural gap, not a bug, but is the most actionable finding (see Phase 0).
2. **`MarriageTiming.windows` shape inconsistency** confirmed by direct reading of `js/marriageTiming/marriageTimingEngine.js` (~line 538): it returns an object `{primary, secondary}` while every other sibling timing engine returns `result.candidateWindows` (or `result.windows`) as an **array**. This was already documented defensively in `docs/_moduleDiscoveryInventory.md`, but is re-confirmed here as a standing correctness risk for any new cross-module consumer that doesn't know to check it.
3. **Two parallel interpretation systems** (`interpretations` / `interpretations2`) and **two parallel remedy systems** (`remedies` / `remedies2`, with a third `remediesCompare` tab) exist simultaneously. Not necessarily a bug (a compare tab exists for remedies, suggesting deliberate A/B retention), but represents real maintenance overhead and should be resolved per Phase 2.
4. **No `node --check` failures** found across all ~153 JS files — the codebase is syntactically sound as of this audit.
5. **No localStorage/Supabase usage found** anywhere — confirms the app is fully offline/client-side with CSV-based persistence only for Saved Natives, consistent with the project's "Offline-first" description in `package.json`.

---

## Implementation batch this session

No code implementation was performed in this task beyond this audit/roadmap documentation. Rationale: the audit uncovered no isolated, narrowly-scoped, already-broken defect suitable for a safe one-commit fix (the `MarriageTiming` shape issue requires grepping and verifying every consumer first — itself a Phase 1 task, not a trivial fix verifiable in this same pass without risking an uncontrolled change across multiple files). Building the Phase 0 golden-chart regression fixture is a substantive addition (new fixture data + harness script) that deserves its own reviewed session per the task's explicit scope-control instructions, rather than being rushed into this audit's closing minutes. This is reported honestly per the task's instructions rather than fabricating a low-value change to appear complete.
