# Major Life Transition / Phase Change Timing — research notes

## Architecture

Three files: `majorLifeTransitionTimingRules.js`, `majorLifeTransitionTimingEngine.js`,
`majorLifeTransitionTimingUI.js`, namespaced `window.MajorLifeTransitionTiming` /
`window.MajorLifeTransitionTimingUI` / `window.MAJORLIFETRANSITION_RULES`, mounted at
`#majorlifetransition-root`, tab `tabMajorLifeTransition` placed after both
`js/lifeTimeline/*` and `js/dashaLifePhase/*` script blocks in `index.html`.

This module answers "do several life domains converge strongly enough around the same
period to represent a broader life-phase transition?" — distinct from Life Timeline
(pure chronological aggregation of all events) and from any single-domain module.

Layering:
1. **Independent Parashari foundation** (own, not reused) — `evaluateLifeTransitionNatalPattern`
   (`js/majorLifeTransitionTiming/majorLifeTransitionTimingEngine.js:92-105`) checks
   house-lord connections (same lord / conjunction / mutual aspect / house-exchange,
   `mutuallyLinked` at lines 68-82) across 7 transition-signature house-pair groups
   (`window.MAJORLIFETRANSITION_SIGNATURES`, rules file) and classifies
   Strong/Moderate/Contextual/Limited sensitivity — narrative only, never gates anything.
2. **Dasha synthesis** — `evaluateLifeTransitionDasha` (engine lines 112-128) maps the
   current MD/AD/PD lords' owned+occupied houses to domains and surfaces a handful of
   illustrative (non-exhaustive) multi-domain examples (e.g. 10th+12th+4th → career/
   residence).
3. **Reuse of Life Timeline's synthesis layer** — `NS.getLifeTimelineResult` (engine
   lines 134-137) calls `window.LifeTimeline.refresh(horizon, 'All','All','Both',null)`
   directly and consumes its already-normalized, already-deduplicated `eventClusters`.

## Reuse vs. mirror of Life Timeline's dedup fix

**Reused directly, not re-implemented.** `js/lifeTimeline/lifeTimelineEngine.js` already
exposes `NS.groupCorrelatedEvents` (lines 238-270) and `NS.calculateDomainDiversity`
(lines 211-214) on its public `window.LifeTimeline` namespace, implementing the
edge-bounded chronological greedy merge that fixed the transitive-chaining mega-cluster
bug discovered in step 4 (naive union-find over "same correlation group AND within 6
months" transitively chained distant same-module-pair occurrences into unbounded
multi-year clusters). Rather than re-deriving that logic — and risking reintroducing the
exact same bug this session already spent effort fixing — `majorLifeTransitionTimingEngine.js`
calls `window.LifeTimeline.refresh()` once per horizon (cached by chart/dasha ref, same
pattern as every other module) and classifies **its own layer on top of**
`ltResult.eventClusters`, each of which already carries a deduped, edge-bounded
`domains` array and `isCluster` flag. This is a clean reuse because Life Timeline's
`eventClusters` are generic (not tied to Life Timeline's own UI state) and are already
exposed as plain data on its return value.

## Double-counting / domain-independence gate (spec section 34, the central risk)

`NS.calculateDomainIndependence(cluster)` (engine lines 142-150) classifies each reused
cluster:
- `domains.length >= 2` → **"Independent domain evidence"** (e.g. Career + Residence +
  Finance — genuinely separate life domains).
- `cluster.isCluster && domains.length === 1` → **"Related sub-events"** (e.g. Promotion +
  Salary Increase + Recognition/Award, all "Career" — one underlying signal expressed
  through several related modules).
- single window, single domain → `"Single window, single domain"`.

`NS.classifyTransitionStrength(cluster)` (engine lines 175-193) is a **hard structural
gate**, not a display choice: only the `"independent"` branch can ever produce
`isMajorTransition: true` (Strong/Moderate Multi-Domain Convergence). The
`"related-subevents"` and `"single-window"` branches always return
`isMajorTransition: false` with labels `"Sequential Transition Pattern"` /
`"Single-Domain Transition"`, regardless of how many related windows they contain. This
directly implements spec section 20's instruction ("single-domain results should NOT be
labelled 'major life transition' unless independent chart evidence supports the broader
classification") as code, not just a rendering decision.

## Live-chart verification (example chart, 1990-08-15 10:30 IST, Delhi, 10-year horizon)

Ran via Playwright against `window.MajorLifeTransitionTiming.refresh(10,'All','All')`:

- **Single-domain purity check (pass):** the cluster made of "Promotion", "Salary /
  Income Increase", "Recognition / Award" (all Career domain) classified as
  `domains: ["Career"]`, `domainIndependence: "Related sub-events"`,
  `strength: "Sequential Transition Pattern"`, `isMajorTransition: false`. It is
  explicitly **not** labeled "major life transition" or any Multi-Domain Convergence,
  even though it aggregates three related windows — matching the exact
  Promotion+Salary-Increase pattern Life Timeline step 4 flagged.
- **Multi-domain convergence purity check (pass):** the largest reused cluster —
  "Insurance / Financial Protection", "Wealth Protection / Asset Consolidation",
  "Retirement", "Financial Gain / Wealth Accumulation", "Loan / Debt Relief", "Property
  Purchase", "Home Construction / Renovation", "Foreign Travel / Settlement
  (Relocation)", "Major Expenditure / Financial Commitment" — spans
  `domains: ["Finance","Career","Property/Residence"]` and is correctly classified
  `domainIndependence: "Independent domain evidence"`,
  `strength: "Strong Multi-Domain Convergence"`, `isMajorTransition: true`. This is the
  same underlying "Retirement & Financial Consolidation" convergence Life Timeline step
  4 already reported with `domainDiversity: 2`+; here, reading the fuller reused
  cluster, it spans 3 distinct domains and correctly reaches "Strong" rather than
  "Moderate".
  A second genuine multi-domain case, "Major Expenditure" + "Loan/Debt Relief" +
  "Property Purchase" + "Home Construction" + "Foreign Travel" alone (before the
  retirement/finance windows merge into it further out), classified
  `domains: ["Finance","Property/Residence"]`,
  `strength: "Moderate Multi-Domain Convergence"`, `isMajorTransition: true` —
  matching the plan's expectation of a genuine Property+Loan+MajorExpenditure+
  HomeConstruction+ForeignTravel convergence being correctly elevated.
- **No naive transitive-chaining bug:** because this module reuses Life Timeline's
  already edge-bounded `eventClusters` rather than re-clustering independently, cluster
  spans stay bounded to the requested 10-year horizon (max end date 2036-11, matching
  the 10-year window from "now") instead of ballooning into an unbounded multi-decade
  mega-cluster. No additional synthetic far-apart test was needed beyond this, since the
  underlying clustering is byte-for-byte the already-verified Life Timeline code path,
  not a reimplementation.

## Transition taxonomy / strength / type mapping

`NS.classifyTransitionTaxonomy` (engine lines 196-215) derives one of the 18 spec-listed
taxonomy labels from each cluster's already-known `domains`/`moduleIds` — e.g.
`retirement` module present → `workToRetirement`; Career+Residence domains →
`careerAndRelocation`; ≥3 domains → `multiDomainTransition`. `NS.transitionTypeFor` maps
each taxonomy key to one of the UI's Transition Type filter values
(New Beginning/Restructuring/Relocation/Responsibility Expansion/Simplification/
Closure→New Phase/Multi-Domain). Both are display-only classifications of
already-existing evidence, never new predictions.

## Evidence deduplication (spec section 35)

`NS.dedupeEvidence(cluster)` (engine lines 218-227) merges each member window's
`reasons`/`cautions` into `Set`s before rendering, and renders one dasha-context line
and one house-logic line per contributing module rather than repeating identical
strings across member windows.

## Filters never recalculate (spec section 28)

`NS.applyResultFilters` (engine, final function) only filters the already-computed
`result.transitions`/`sequence`/`horizonWindows` arrays by Transition Focus (mapped to a
Life-Timeline-style domain string via `MAJORLIFETRANSITION_FOCUS_DOMAIN_MAP`) and
Transition Type; it never calls `refresh()` again or touches `window.LifeTimeline`.
Verified live: a chart-generation call counter stayed at `0` across Transition Focus and
Transition Type changes (Playwright `GEN_COUNT_AFTER_FILTER_CHANGES: 0`), while it was
`1` after generating the chart and clicking through all 58 tabs once.

## Rule provenance

`window.MAJORLIFETRANSITION_RULES` (rules file) categorizes each rule as one of:
Classical Parashari house principle, Vimshottari Dasha activation, Transit confirmation,
Divisional-chart confirmation, Existing application timing module, or Multi-domain
synthesis rule — reusing the exact category taxonomy from spec section 24 and the
established `{id, category, provenance, name, description, explanation, source}` shape
used by every other module in this codebase.

## Scope boundaries

- Never independently computes a new planetary/house/dasha/transit/divisional-chart
  position; the only house-lordship/aspect reads are the lightweight natal-foundation
  check (section 6-8), which is explicitly narrative-only and never gates anything.
- Never duplicates Life Timeline's own normalization/clustering; always reads
  `window.LifeTimeline.refresh()`'s output directly.
- Never labels a single-domain result a "major life transition" (hard gate, not display
  wording).
- Never ranks windows as best/worst, never predicts death/lifespan/illness/diagnosis/
  accidents, never infers another person's private intentions, never guarantees
  marriage/divorce/childbirth/career/business/relocation/investment outcomes, never
  gives investment/legal/medical advice — enforced both by `MAJORLIFETRANSITION_RULES`
  text and by `NS.scanForForbiddenLanguage`/`NS.applySafetyFilter` applied to this
  module's own synthesized narrative sentences (never to a source module's own
  reasons/cautions/disclaimer text, which is passed through verbatim).

## Verification summary

- `node --check` passes on all three new JS files.
- Playwright: chart generated, all 58 tabs clicked with zero click/console/page errors;
  Transition Focus and Transition Type filters exercised with a confirmed
  zero-recalculation chart-generation-call counter; a transition card expanded
  successfully (HTML length grew from control-render to expanded detail).
- Forbidden-language grep across the three new files: every hit is confined to the
  pattern-definition/disclaimer/rule-description text itself (the regexes and their
  prose descriptions), never in narrative output logic.
- Full-batch regression (`regression.js`): generated chart, clicked through all 58 tabs,
  expanded a handful of `<details>` elements and exercised several modules' selector
  controls — 0 console/page errors across the whole app (baseline before this 5-module
  batch was 53 tabs; after Wealth Protection, Yoga Activation Timing, Dasha Life Phase,
  Life Timeline and this module, the app is at 58 tabs, confirmed by two independent
  counting methods: `.tab-button` prefix match and `[data-tab^="tab"]` attribute match,
  both agreeing at 58).
