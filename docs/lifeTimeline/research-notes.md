# Important Event Sequence / Life Timeline — Research Notes

## Purpose
Master chronological visualization/synthesis layer (spec: `Parashari_Important_Event_Sequence_Life_Timeline_Claude_Code.md`).
It answers "what sequence of major life events is currently indicated?" by
aggregating the existing timing modules' own candidate windows. It performs
**no new astrological calculation** — no planetary, house, Dasha, transit, or
divisional-chart computation is duplicated here.

Files:
- `js/lifeTimeline/lifeTimelineRules.js` — module registry, correlation
  groups, life-phase templates, this layer's own rule/provenance table and
  forbidden-language patterns (synthesis-layer rules only).
- `js/lifeTimeline/lifeTimelineEngine.js` — pure calculation engine,
  `window.LifeTimeline`.
- `js/lifeTimeline/lifeTimelineUI.js` — rendering layer, `window.LifeTimelineUI`,
  `#lifetimeline-root`.
- Wiring: `index.html` tab button `#tabBtnLifeTimeline` / panel
  `#tabLifeTimeline` (last among all timing-module tabs/scripts), and one
  line in `js/ui.js`'s tab-click handler.

## Reused components (cite file/line)
- `state.chart`, `state.dasha` — read only, never recomputed (see
  `js/ui.js` ~line 2018, `js/dasha/vimshottariDasha.js`).
- Discovery-inventory defensive idiom for cross-module calls — `const
  windowsRaw = result && (result.candidateWindows || result.windows);
  const windows = Array.isArray(windowsRaw) ? windowsRaw :
  (windowsRaw && typeof windowsRaw==='object' ? [windowsRaw.primary,
  windowsRaw.secondary].filter(Boolean) : null);` — mirrored verbatim as
  `windowsArrayFrom()` in `lifeTimelineEngine.js` (same pattern already used
  in `js/dashaLifePhase/dashaLifePhaseEngine.js` line ~166-171 and
  `js/yogaActivationTiming/yogaActivationTimingEngine.js` line ~150-155).
- Cache-by-ref + filters-never-recompute pattern — mirrored from
  `yogaActivationTimingEngine.js`'s `NS.refresh`/`NS.applyFilters` (lines
  ~297-349) and `dashaLifePhaseEngine.js`'s `NS.refresh`/`NS.applyResultFilters`
  (lines ~379-421).
- Correlation-grouping + domain-diversity pattern — mirrored in spirit from
  `yogaActivationTimingEngine.js`'s `groupCorrelatedYogaActivations` /
  `calculateYogaDomainDiversity` (lines ~234-250): group first, then count
  distinct domains per group, rather than a flat count of grouped items.
  Not literally shared code (no existing shared-utility file to import from
  in this codebase's architecture — each timing module is self-contained),
  but the same two-step shape (`groupCorrelatedEvents()` then
  `calculateDomainDiversity()`) is reused intentionally.
- UI conventions — `esc()`, `fmtDate()`, `badge()`/`qualityClass()`,
  `evidenceDetails()` expandable `avp-calc` blocks, `output-box pastel-*`
  section styling — copied verbatim from
  `js/wealthProtectionTiming/wealthProtectionTimingUI.js`'s established
  helpers, per the discovery inventory's UI-conventions section.

## Existing timing modules integrated
All 27 registered in `window.LIFETIMELINE_MODULE_REGISTRY`
(`lifeTimelineRules.js`) were present and returned usable output against the
bundled example chart (1990-08-15, 10:30 IST, New Delhi) at a 10-year
horizon in verification: careerStart, jobChange, promotion, salaryIncome,
careerTurningPoint, businessStart, recognitionAward, retirement,
financialGain, majorExpenditure, loanDebtRelief, insuranceProtection,
wealthProtection, inheritanceLegacy, property, propertySale,
homeConstruction, foreignTravel, vehiclePurchase, relationshipPartnership,
marriage, marriageSeparationDivorce, childbirth, childEducation,
higherEducation, healthRecovery, legalMatter, spiritualTurningPoint.
`skipped: []` for this chart. The engine's `NS.collectRawModuleOutput()`
still defensively records a `skipped` entry (module name + reason) for any
module that is absent, throws, or returns an unexpected shape, so a build
missing an optional module never fails the tab.

`YogaActivationTiming`, `DashaLifePhase`, and the chart/dignity/Dasha core
utilities are intentionally NOT in the registry: they are synthesis/context
layers themselves rather than event-candidate-window sources, and the spec
scopes this module to the timing-window-producing modules listed in its
section 2.

## Normalized TimingWindow interface
`NS.normalizeWindow(mod, rawResult, w)` in `lifeTimelineEngine.js` builds
`{ id, moduleId, moduleName, domain, eventType, eventStage, startDate,
endDate, evidenceLevel, dasha:{mahadasha,antardasha,pratyantar}, houses,
planets, transitSupport, divisionalSupport, traceId, reasons, cautions,
disclaimer, rulesUsed, parentEventId, relatedEventIds }` — adapted from the
spec's suggested schema per its own instruction ("adapt to the application's
actual architecture"), because field names differ module to module (e.g.
`w.evidence.label` vs `w.strength.label` vs `w.qualification` vs
`w.convergenceFactors`/`w.matchCount`): `evidenceLevelOf()` tries each in
priority order before falling back to a convergence-factor heuristic, never
fabricating a number where none exists.

## Domain classification
Static per-module mapping in `LIFETIMELINE_MODULE_REGISTRY` to the nine
spec-section-6 domains (Career, Finance, Property/Residence,
Relationship/Family, Education, Health, Legal/Structural,
Spiritual/Personal — "Life Transition" is reserved for multi-domain
life-phase clusters, never a per-module domain).

## Deduplication / correlation control (highest-risk area)
`NS.groupCorrelatedEvents(windows)` — **deliberately a greedy, chronological,
edge-bounded merge, not a global union-find.** An early implementation used
union-find over all pairwise (same-correlation-group AND
overlap-or-within-6-months) links; against the live 10-year example chart
this transitively chained far-apart same-module-pair occurrences (e.g. a
Promotion+Salary pairing near 2027 and an unrelated occurrence of the same
pairing near 2033, bridged by intermediate windows) into one unbounded
decade-spanning "mega-cluster" — a direct violation of the spec's Cluster
Separation rule (section 38). Fixed by sorting windows chronologically and,
for each window, only merging it into the most-recently-opened compatible
cluster when it is close to *that cluster's current trailing edge*
(`classifyOverlap` against `{startDate:lastEnd, endDate:lastEnd}`), so a
cluster's span can only grow by true adjacency, never by a transitive chain
through unrelated instances. `calculateDomainDiversity(windows)` and
`calculateIndependentDomainCount(cluster)` then count **distinct domains**
among a cluster's members (mirroring
`calculateYogaDomainDiversity`'s shape in `yogaActivationTimingEngine.js`).

### Verified against the live example chart (1990-08-15, 10:30 IST, New Delhi, 10-year horizon)
- **Promotion + Salary Increase + Recognition/Award** (all `promotion`,
  `salaryIncome`, `recognitionAward` — correlation group
  `career-advancement`) rendered as **one** cluster labeled "Career
  Advancement", `isCluster: true`, `domains: ["Career"]`,
  `domainDiversity: 1`, tier `Secondary Event` — NOT three independent
  top-level events.
- A genuinely **multi-domain convergence** — `retirement` (Career) +
  `financialGain` (Finance) — rendered as a **separate** cluster, "Retirement
  & Financial Consolidation", `domains: ["Career","Finance"]`,
  `domainDiversity: 2`, tier **Primary Event**. Likewise `majorExpenditure`
  + `loanDebtRelief` + `property` + `homeConstruction` +
  `foreignTravel` clustered as "Property Acquisition / Financial
  Commitment" with `domains: ["Finance","Property/Residence"]`,
  `domainDiversity: 2`, tier **Primary Event**.
- These two cases are kept as distinct clusters with different domain-count
  and different tiers, confirming domain-diversity counting actually
  distinguishes a single-domain correlated cluster (Secondary) from a true
  independent-domain convergence (Primary), per spec section 10/36.
- `NS.classifyClusterTier()`: `domainDiversity >= 2` (with non-Contextual
  evidence) → Primary Event; multi-window single-domain cluster →
  Secondary Event; single standalone window with Strong evidence → Primary
  Event; otherwise Contextual/Correlated Event.

Known limitation: because several modules emit one candidate window per
Pratyantardasha across the whole Vimshottari cycle, at a 10-year horizon
some single-correlation-group clusters (e.g. "Career Change / Transition")
span the full horizon rather than a short window — this reflects that
module's own window density, not a dedup bug (confirmed by inspecting the
underlying per-module window counts directly). Shorter horizons (1Y/3Y)
produce tighter, more typical cluster spans.

## Overlap detection
`NS.classifyOverlap(a, b)` returns `exact | partial | close-3m | close-6m |
close-12m | null`, using only `startDate`/`endDate` arithmetic (no new date
utility; thresholds from `LIFETIMELINE_PROXIMITY_DAYS` in
`lifeTimelineRules.js`, per spec section 11).

## Sequence detection
`NS.buildEventSequence(clusters)` sorts chronologically and labels each
item's gap to its predecessor as `Direct` (overlap), `Transitional` (<=3mo
gap), `Progressive` (<=12mo gap), or `Long-cycle` (>12mo — explicitly NOT
merged, per section 38). Narrative text always says "forms a chronological
sequence," never "causes."

## Life-phase clustering
`NS.buildLifePhaseClusters(eventClusters)` uses the same bounded-edge greedy
approach (for the identical transitive-chaining reason given above) to
group event-clusters that are both time-adjacent and either (a) match the
same named phase template in `LIFETIMELINE_PHASE_TEMPLATES`, or (b)
represent a genuine multi-domain convergence (`domainDiversity >= 2` across
the pair). An unmatched multi-domain convergence is labeled a generic
"`<domains>` Life Transition" rather than forcing it into a named template.

## Current life phase / next significant cluster
`NS.getCurrentLifePhaseSummary()` reads phase clusters whose span contains
"now" and produces one qualitative narrative sentence (never deterministic
language). `NS.getNextSignificantCluster()` picks the earliest upcoming
phase cluster with at least one non-Contextual-evidence event cluster, and
is explicitly annotated "not labeled as the 'best' period," per section 17.

## Timeline view model / UI
Horizontal proportional-width bar visualization (`renderVisualization`) that
reflows to a vertical stack on narrow viewports via normal block layout (no
new charting dependency, per section 18's "do not introduce a large
dependency unnecessarily"). Expandable Event Cluster cards (section 20) and
Life-Phase cluster cards show period/domains/sequence/supporting
modules/interpretation/10-step calculation trace. Each underlying event card
(section 19) shows dasha/transit/houses/divisional support/why-it-appears/
contributing module + trace id, and source-module cautions/disclaimer text
verbatim.

## Filters (section 28) and performance (section 39)
Time Horizon (1Y/3Y/5Y/10Y/Custom), Domain, Evidence, Display Mode
(Events/Clusters/Both). Verified via Playwright: a chart-generation call
counter installed on `window.generateChart` stayed at `1` through all 57 tab
clicks AND through all four filter changes — filters only call
`window.LifeTimeline.refresh(...)`, which itself only recomputes module
output when the horizon/custom-range cache key actually changes (mirroring
`yogaActivationTimingEngine.js`'s own horizon-keyed cache), and
`NS.applyResultFilters()` for domain/evidence/display-mode is a pure slice
of the already-computed result with no further module calls.

## Calculation trace & rule provenance
`NS.CALCULATION_SEQUENCE` (10 steps, spec section 25) is logged into
`calculationLog` and rendered in the Calculation Log section. Each event
card also keeps its own source module's `rulesUsed` (see `traceId`
`<moduleId>:<windowGlobal>`); the Rule Provenance section renders this
synthesis layer's own `LIFETIMELINE_RULES` only (deduplication, clustering,
sequencing, safety, filter-no-recalculate rules), explicitly stating that
per-event provenance lives on that event's own card.

## Safety restrictions (section 34)
`lifeTimelineEngine.js` never re-words a source module's own `reasons`,
`cautions`, or `disclaimer` text — these are copied through unmodified
(`reasonsOf`/`cautionsOf`/`rawResult.disclaimer`). This module's own
`LIFETIMELINE_FORBIDDEN_PATTERNS` scanner (`scanForForbiddenLanguage` /
`applySafetyFilter`) is applied ONLY to this module's own synthesized
narrative sentences (cluster/phase interpretation text, current-phase
summary, next-cluster note) — never to a source module's text. Verified: a
regex sweep of the fully rendered `#lifetimeline-root` text for
death/lifespan/medical-advice/legal-advice/guarantee/causal language found
matches only inside existing modules' own disclaimer sentences, each in
negation context ("It never predicts ... lifespan ...", "not ... medical
advice", "This never implies that an earlier event causes a later one") —
i.e. the safe, intended usage, not a leaked violation. Spot-checked
`LegalMatterTiming`/`HealthRecoveryTiming`/`MarriageSeparationDivorceTiming`
output directly against the corresponding window's `reasons`/`cautions`/
`disclaimer` fields inside the Life Timeline result and confirmed byte-identical
pass-through where those fields exist on the source module's result.

## No political/election logic
Confirmed by code review: no election, political, candidate, or
public-figure logic of any kind exists anywhere in the three new files.

## Saved-native integration
No separate wiring was required: like every other timing module in this
codebase, `LifeTimeline.refresh()` reads `state.chart`/`state.dasha`
directly and caches only by object reference, so selecting a different
saved native (which replaces those references) automatically invalidates
the cache on the next render — the same mechanism already used by
`DashaLifePhase`/`YogaActivationTiming`/`WealthProtectionTiming`.

## Report/PDF integration
Not applicable in this build: none of the three prior modules in this plan
(Wealth Protection, Yoga Activation Timing, Dasha Life Phase) added a
PDF/report section either (no `generatePDF`/report-section hook exists in
this codebase to integrate with), so Life Timeline follows the same
established scope boundary. Flagged as a follow-up item below.

## Historical mode
Not applicable: this codebase has no existing historical-validation
feature for any prior timing module to extend (confirmed by search), so
per spec section 33 ("if historical validation is already supported") this
was correctly left out rather than invented from scratch.

## Tests / verification performed
- `node --check` on all three new JS files — pass.
- Playwright (chromium at `/opt/pw-browsers/chromium-1194`) against
  `python3 -m http.server 9000`, generating the bundled example chart:
  - Tab count: 56 → 57, verified by two independent counting methods
    (`document.querySelectorAll('.tab-button').length` and
    `document.querySelectorAll('[data-tab^="tab"]').length`, both = 57;
    static `index.html` regex counts cross-checked the same way, matching
    the discovery inventory's caution about `class="tab-button"` exact-match
    undercounting the first/active tab).
  - Clicked all 57 tabs with zero click errors.
  - `window.generateChart` call counter stayed at `1` across all 57 tab
    clicks and across all four filter changes (horizon/domain/evidence/
    display-mode) — filters never recalculate the chart.
  - Engine snapshot inspected directly (`window.LifeTimeline.refresh(...)`)
    for integrated/skipped modules, cluster/phase composition, current
    phase, and next cluster.
  - Expanded an event-cluster card via its click handler and confirmed the
    "CLUSTER CALCULATION TRACE" detail block became visible.
  - Forbidden-language regex sweep of rendered Life Timeline text — only
    safe negation-context matches found (see Safety section above).
  - Direct comparison of a sensitive module's (`HealthRecoveryTiming`)
    disclaimer against the corresponding normalized window's `disclaimer`
    field — byte-identical.

## Regression status
No existing tab's script tag, panel id, or `ui.js` handler line was
modified; the new module was added purely additively (new files, new
tab/button/panel, one new handler line, three new script tags appended
last). All 57 tabs clicked without console/page errors attributable to
this change (the single `CONSOLE: Failed to load resource: 404` observed
during verification is an unrelated pre-existing favicon/asset request, not
caused by this module).

## Limitations / follow-up items
- Report/PDF and historical-comparison integration intentionally omitted —
  no existing hook in this codebase for either, consistent with the three
  prior modules in this plan; would need a dedicated follow-up if/when a
  PDF-report feature is added application-wide.
- Cross-module navigation (section 27) shows module name + trace id on
  every event card but does not programmatically switch tabs — the spec
  explicitly allows this ("if direct navigation is not practical, show the
  module name and trace identifier").
- At long (10-year) horizons, a handful of single-correlation-group event
  clusters can span the full horizon when that module alone emits many
  closely-spaced Pratyantardasha-level windows across the whole cycle; this
  is a property of the underlying module's own window density, not of the
  deduplication logic (confirmed by direct inspection), and is most visible
  at 10Y — 1Y/3Y views are tighter and more typical.
