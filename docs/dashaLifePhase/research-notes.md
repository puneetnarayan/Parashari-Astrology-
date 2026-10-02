# Dasha-Based Life Phase Analysis — Research & Architecture Notes

Step 3 of the 6-step timing-modules plan (step 1: Wealth Protection & Asset
Consolidation Timing, 317e8a7; step 2: Yoga Activation Timing, 457dc37). This
module is the **master Dasha interpretation/synthesis layer**: it reads the
chart's already-computed Vimshottari Dasha sequence and overlays a
life-phase-theme interpretation, cross-references existing timing modules and
Yoga Activation Timing, and applies safety filtering — it never computes a
Dasha sequence or a lordship/dignity engine of its own.

## Files

- `js/dashaLifePhase/dashaLifePhaseRules.js` — `window.DASHALIFEPHASE_RULES`
  (provenance registry), `window.DASHALIFEPHASE_THEMES` (the 12 life-phase
  themes), `window.DASHALIFEPHASE_HOUSE_THEME_MAP`,
  `window.DASHALIFEPHASE_PLANET_THEME_MAP`,
  `window.DASHALIFEPHASE_THEME_MODULE_MAP`, `window.DASHALIFEPHASE_STRONG_TIERS`
  / `WEAK_TIERS`, `window.DASHALIFEPHASE_FORBIDDEN_PATTERNS`.
- `js/dashaLifePhase/dashaLifePhaseEngine.js` — `window.DashaLifePhase` pure
  calculation engine.
- `js/dashaLifePhase/dashaLifePhaseUI.js` — `window.DashaLifePhaseUI` renderer,
  `#dashalifephase-root`.
- Wired into `index.html` (tab button `#tabBtnDashaLifePhase`, panel
  `#tabDashaLifePhase`, script tags placed immediately after the Yoga
  Activation Timing block since this module references that module's output)
  and `js/ui.js` (`tabDashaLifePhase` handler line).

## Exact reused components (verified by reading the source, not assumed)

- `state.chart` / `state.chart.planets` (`{name, sign, longitude, house,
  conjunctWith, aspectedBy}`) and `state.chart.ascendant` — `js/ui.js` ~line
  2018. Used for house ownership (`SIGN_LORD`), house occupation,
  conjunctions, and aspects. No new lordship engine is written —
  `dashaLifePhaseEngine.js`'s `housesOwnedBy`/`houseOccupiedBy`/
  `conjunctions`/`aspectedByList` are thin read-only lookups over this exact
  shape.
- `state.dasha` (Mahadasha array with nested `antardashas`) — the sole source
  of the Dasha sequence. `buildSubPeriods(startLord, totalYears, startDate)`
  and `findCurrentIndex(periods, atDate)` from `js/dasha/vimshottariDasha.js`
  (~lines 37, 79) are used exactly as documented in
  `docs/_moduleDiscoveryInventory.md` to derive the current
  Pratyantardasha on demand (never precomputed/stored separately).
- `SIGNS`, `SIGN_LORD` — `js/parashariTables.js` (~lines 19, 23).
- `detailedDignity(planetName, sign, degreeInSign)` —
  `js/interpretations/dignityDetails.js`, returns `{tier, ...}`; `tier` values
  are read verbatim against `DASHALIFEPHASE_STRONG_TIERS` /
  `_WEAK_TIERS` — no new dignity scale introduced.
- `SHADBALA_PLANETS` — `js/shadbala/shadbalaEngine.js` (~line 36), used (as in
  Yoga Activation Timing) to decide whether `detailedDignity` applies to a
  given body (excludes Rahu/Ketu).
- `vargaPosition(longitude, vargaKey)` — `js/divisionalCharts.js` (~line 120),
  the sole source for all D2/D4/D7/D9/D10/D16/D24 lookups in
  `getRelevantDivisionalCharts`.
- `ASPECT_OFFSETS`, `computeSingleLongitude`, `normalizeDegrees` — used
  identically to Yoga Activation Timing's `assessTransitConfirmation` for the
  Jupiter/Saturn transit-confirmation layer (confirming only, never the
  trigger).
- `window.YogaActivationTiming.refresh()` / `state.yogas` —
  `getRelatedYogas()` prefers `YogaActivationTiming.refresh().currentlyActive`
  (richer, dasha-activation-aware) and falls back to
  `state.yogas.presentGood` (formation-only) if that module's output is
  unavailable; yoga formation/activation logic itself is never re-derived
  (per `DASHALP-YOGAREF-001`).
- Existing timing-module cross-check idiom — copied verbatim from
  `docs/_moduleDiscoveryInventory.md` / Yoga Activation Timing's
  `checkCrossModules`: `window[key].refresh()`,
  `result.candidateWindows || result.windows`, `Array.isArray` guard, and the
  `[windows.primary, windows.secondary].filter(Boolean)` fallback for the
  confirmed MarriageTiming object-shaped exception. See
  `getRelatedTimingWindows()` in `dashaLifePhaseEngine.js`.
- `state.shadbala` / `state.ashtakvarga` — read only if present
  (`getSupportingStrengthContext`), per the discovery inventory's note that
  neither engine exposes a clean `window.*` API; no numeric value is
  fabricated when absent (`DASHALP-NOFAB-001`).
- `window.HealthRecoveryTiming.applySafetyFilter` — called, when present, as
  an *additional* pass on top of this module's own scanner for any
  `Health/Recovery Context` theme narrative (`applyHealthDomainSafety`),
  per the discovery inventory's note that `HealthRecoveryTiming`'s filter is
  medical-domain-specific and can be reused defensively.

## Theme derivation (sections 4-7, 12)

`deriveThemeScores(planetName)` sums weighted contributions from: houses the
planet **owns** (full weight, from `DASHALIFEPHASE_HOUSE_THEME_MAP`), the
house it **occupies** (half weight), and its **natural-significator**
(karaka) role (`DASHALIFEPHASE_PLANET_THEME_MAP`, half weight), then scales
the total by 1.25x for Exalted/Own-Sign/Moolatrikona dignity or 0.75x for
Debilitated. `topThemes()` picks the top-scoring theme as primary; if a
second theme scores within 85% of the top across 3+ candidate themes, the
result is classified `Mixed/Multi-Domain` instead of forcing a single label —
this directly implements spec section 4's twelfth theme as a genuine "no
single theme dominates" outcome rather than a fallback/default.

## Natal Promise vs Dasha Activation (section 8)

`evaluateDashaNatalPromise(planet, chart)` reports a planet's structural
house ownership/occupation/dignity/conjunctions/aspects independent of any
Dasha timing, with an explicit `promiseNote` string stating that this is what
the chart *structurally promises*, distinct from *when it activates* (its own
Mahadasha/Antardasha/Pratyantardasha). This is surfaced at the Mahadasha,
Antardasha, and Pratyantardasha level in the UI so the distinction is visible
at every level of the hierarchy, not just once.

## Mahadasha / Antardasha / Pratyantardasha refinement chain (sections 10-12)

- `generateMahadashaTheme(md)` — the top-level theme for the whole Mahadasha.
- `analyzeAntardashaTheme(ad, mdTheme)` — derives the AD lord's own theme
  scores, then reports whether it **reinforces** the Mahadasha theme (same
  primary/secondary) or introduces a **refinement/nuance** — phrased in the
  narrative as happening "within the broader Mahadasha theme", never as an
  isolated prediction.
- `analyzePratyantarTheme(pd, mdTheme, adTheme)` — implements the **Dasha
  Hierarchy safeguard** (spec section 12) as an explicit structural rule,
  not just prose:
  1. Compute the PD lord's own raw theme.
  2. If that raw theme differs from both the MD and AD theme
     (`conflictsWithParent`), check whether the PD lord has **independent
     structural evidence** of its own — house ownership and/or Exalted/
     Own-Sign/Moolatrikona dignity (`hasOwnStructuralEvidence`).
  3. Only if both conditions hold does the PD theme become the
     `effectiveTheme` (`overrodeParent: true`); otherwise the **effective
     theme stays the parent AD's theme** and the PD's own theme is shown
     only as a minor, clearly-labeled nuance
     (`hierarchyGuardApplied: true`).
  This was verified against the actual generated chart (see Verification
  below): both an "override with evidence" case (Mercury PD, owns houses
  1 & 10, overrides to Career/Responsibility) and a "guard applied, no
  override" case (Rahu PD inside a Moon MD/AD, raw theme
  Education/Learning suppressed back to the parent theme) were produced
  directly from the engine's own output — not constructed as a special case
  in the code.

## Cross-module correlation (sections 13-15, 31) and Yoga reference (section 32)

`getRelatedTimingWindows(dashaPeriod, theme)` maps the period's theme to a
fixed list of plausibly-relevant existing timing modules
(`DASHALIFEPHASE_THEME_MODULE_MAP`), calls each module's own `.refresh()`
defensively, and reports an **overlap only** (start/end date intersection)
as supporting evidence — it never computes or asserts an independent date.
This was verified directly: calling it against the real, already-computed
`WealthProtectionTiming.refresh()` output returned that module's own full
candidate-window object (with its own `reasons`, `activatedHouses`,
`transit`, etc.) unmodified, confirming the "reference, never re-time"
contract holds end-to-end against a real sibling module, not just a mock.

## Divisional charts (section 15) and transit confirmation (section 16)

`getRelevantDivisionalCharts(planet, theme)` looks up only the vargas mapped
to that specific theme in `DASHALIFEPHASE_THEME_MODULE_MAP` (e.g. D10/D9 for
Career/Responsibility, D4/D9 for Property/Residence) — an unrelated varga is
never shown. `assessTransitConfirmation` mirrors Yoga Activation Timing's
Jupiter/Saturn-only confirming-layer pattern exactly.

## Mahadasha transition detection (section 19) and dashboard (sections 20-26)

`classifyTransitionPhase` buckets the current Mahadasha into Start (<10%
elapsed), Middle, Transition (>75%), or End (>90%) by elapsed fraction.
`buildLifeDashboard()` produces one themed row per Mahadasha on
`state.dasha` (full life, both past and future, exactly as that array already
exists). `applyFilters(dashboard, horizonYears, domainFilter)` and the UI's
`applyResultFilters` **slice the already-built dashboard/result** by date
window or theme — confirmed via the Playwright check below that changing
either filter does not re-invoke chart generation.

## Safety filtering (sections 39-40)

`DASHALIFEPHASE_FORBIDDEN_PATTERNS` (own scanner, modeled directly on Yoga
Activation Timing's and Wealth Protection Timing's own-scanner pattern)
blocks death/lifespan/diagnosis/accident-prediction/other-person-motive/
guarantee/investment/legal/medical-advice/"always difficult" language.
`scanForForbiddenLanguage` / `applySafetyFilter` run over every generated
narrative string before it is returned from `refresh()`. For any Mahadasha
whose derived theme is specifically `Health/Recovery Context`,
`applyHealthDomainSafety` additionally pipes the text through
`window.HealthRecoveryTiming.applySafetyFilter` when that module is loaded,
per the discovery inventory's explicit guidance to reuse or match
`HealthRecoveryTiming`'s medical-domain scanner for any health-domain theme
this module generates. A grep of the three new JS files for the forbidden
vocabulary confirmed every hit is confined to rule descriptions, the
scanner's own regex source, and the disclaimer text — none appear in a
generated narrative string.

## Scope boundaries (explicit, matching the master-constraint list)

- No new Dasha calculation engine (`state.dasha`, `buildSubPeriods`,
  `findCurrentIndex` only).
- No new lordship/dignity engine (`SIGN_LORD`, `detailedDignity`,
  `vargaPosition` only).
- No new yoga-formation logic (`window.YogaActivationTiming` /
  `state.yogas` only).
- No independent event timing — every cross-module reference is read-only.
- No fabricated Shadbala/Ashtakavarga numbers.
- No death/lifespan/diagnosis/accident/other-person-motive/guarantee/
  investment/legal/medical-advice language, and no blanket "this
  Mahadasha is always difficult" claims — every theme and caution is
  derived from this specific chart's house lordship/occupation/dignity/
  conjunctions/aspects.

## Verification performed

1. `node --check` on all three new JS files — passed.
2. Playwright (chromium at `/opt/pw-browsers/chromium-1194`, launched with
   `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) against `python3 -m http.server
   9000`:
   - Tab count: 55 before -> 56 after (`<button class="tab-button">` count,
     and `data-tab="tab*"` count independently cross-checked).
   - A chart was generated (birth date 1990-08-15, 10:30 local, Delhi
     28.6139/77.2090, UTC+5.5) via `#generateChartBtn`, confirmed by an
     instrumented counter wrapping `window.generateChart` (`GEN_COUNT` = 1).
   - All 56 tabs were clicked without a thrown page error (one benign 404
     console message only, from an unrelated favicon/resource request, not
     from this module).
   - The Dasha Life Phase tab rendered Current Phase, Next Phase, Antardasha
     Timeline, and Full Life Dashboard sections.
   - Changing the Time Horizon filter and the Life Domain filter afterward
     left `GEN_COUNT` unchanged (`FILTER_TRIGGERED_RECALC: false`) —
     confirming filters never re-invoke chart generation.
   - All `<details class="avp-calc">` calculation-trace elements (15 found)
     were clicked/expanded without error; clicking an Antardasha timeline
     row expanded its own calculation-trace detail block
     (`AD_DETAIL_EXPANDED: true`).
3. Purity checks:
   - (a) Dasha-hierarchy guard: scanning every MD/AD/PD combination in the
     generated chart's full Dasha sequence produced both a guard-applied
     case (Rahu PD inside Moon MD/Moon AD — raw theme Education/Learning
     suppressed, effective theme stays the parent's) and a legitimate
     override case (Mercury PD inside Jupiter MD/Ketu AD — Mercury's own
     house-1/house-10 ownership and dignity justified overriding to
     Career/Responsibility) — both produced directly by the engine, not
     hand-constructed.
   - (b) Cross-module reference: `getRelatedTimingWindows` was confirmed
     against the real `window.WealthProtectionTiming.refresh()` output for
     the chart's current Jupiter Mahadasha — it returned that module's own
     already-computed candidate window verbatim as a reference, with no
     independent date computed by this module.
   - (c) Health-domain safety: the generated-chart's own narratives (current
     MD/AD/PD and next MD) were scanned with
     `DashaLifePhase.scanForForbiddenLanguage` and returned `forbidden:
     false` for all of them; the `Health/Recovery Context` theme path itself
     was exercised via `applyHealthDomainSafety`'s code path (no
     `Health/Recovery Context` Mahadasha happened to occur in this
     particular chart's sequence, so the additional
     `HealthRecoveryTiming.applySafetyFilter` pass was confirmed reachable
     and defensively guarded, not exercised against live chart data from
     this specific chart).
4. Forbidden-language grep of the three new JS files: every match is in a
   rule description, the scanner's own pattern-source string, or the
   disclaimer — none in generated narrative text.
