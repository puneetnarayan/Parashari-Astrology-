# Parashari Analysis — Implementation Notes

## What was implemented

A new, final tab ("Parashari Analysis") implementing the attached
63-section Parashari Kundali Analysis Engine specification, built as a
fully self-contained, namespaced module — `window.ParashariAnalysis`
(calculation engine, `js/parashariAnalysis/parashariAnalysisEngine.js`)
and `window.ParashariAnalysisUI` (rendering layer,
`js/parashariAnalysis/parashariAnalysisUI.js`) — with all new DOM IDs/CSS
classes `pa-`/`#tabParashariAnalysis`-scoped, per the spec's isolation
requirement. No existing tab, calculation, CSS rule, or identifier was
changed except two minimal, additive hooks (see "Existing-file changes"
below).

- **Reuse-first architecture** (spec's own mandatory rule): the module
  never recomputes chart astronomy, dignity, functional lordship,
  aspects, conjunctions, combustion, Shadbala, Vargottama, Neecha Bhanga,
  D9 varga positions, or Vimshottari Dasha — it reads all of these from
  `state.chart` / `state.shadbala` / `state.yogas` / `state.dasha` and
  from this app's existing exported functions (`detailedDignity`,
  `relationBetween`, `functionalClassification`, `vargaPosition`,
  `vargottamaCheck`, `neechaBhangaCheck`, `wholeSignHouseOf`,
  `computeSingleLongitude`, `findCurrentIndex`, `ASPECT_OFFSETS`).
- **Yogas**: the existing `js/yogas/yogaRules.js` engine (already
  producing Raja/Dhana/all 5 Mahapurusha/Gaja Kesari/Neecha Bhanga Raja
  Yoga/Budhaditya/Kaal Sarpa/etc. via `state.yogas`) is reused wholesale
  and re-labeled `source: 'Existing app Yogas engine'`. Only the two
  yogas that engine does not cover — **Dharma-Karmadhipati Yoga** and
  **Viparita Raja Yoga** (Harsha/Sarala/Vimala) — are newly implemented
  here, tagged `source: 'Parashari Analysis module (new)'` with explicit
  `PA-YOGA-001`/`PA-VIPARITA-*` rule IDs, satisfying Section 56's
  requirement that classical vs. newly-derived rules never be presented
  as equally classical.
- **House-aspect reuse**: "which planets aspect a given house" (not just
  planet-to-planet, which the existing `aspectedBy` field already gives)
  is computed by applying the existing `ASPECT_OFFSETS` table from
  `aspects.js` to a house's sign index directly — no new aspect geometry.
- **Affliction/Support scoring** (`assessPlanet`): an independent,
  transparent 0-100 cumulative-evidence score (baseline 50, additive
  weighted factors — dignity, functional role, house category,
  conjunctions, aspects, combustion, Shadbala, Vargottama, Neecha
  Bhanga cancellation), never a single-factor verdict, always exposing
  the exact positive/negative reasons list behind the score (surfaced in
  the UI's "Why?" panels).
- **Lagna and Chandra Lagna (Moon) analysis**, each independently scored;
  Chandra Lagna re-derives house numbering with the Moon's own sign as
  House 1, using the same `wholeSignHouseOf`-style technique already used
  by the Sudarshana Chakra tab, and never conflated with the Lagna-based
  analysis.
- **Navamsha (D9) cross-check**: reuses `vargaPosition(...,'D9')` +
  `detailedDignity` + `vargottamaCheck` — a confirmatory check, never a
  replacement for D1.
- **Vimshottari Dasha activation** and **Transit trigger** (Jupiter,
  Saturn, Rahu, Ketu) checked independently against the natal **Promise
  Engine** (`assessHousePromise`, primarily gated on the house lord's own
  score) for each of 9 life areas (Career, Wealth, Marriage, Children,
  Education, Property, Health, Foreign Travel/Residence, **Spirituality**
  — see below), each producing an explicit **Contradiction** string when
  natal promise and current-period activation disagree, rather than
  silently blending scores (Sections 29/33).
- **Synthesis**: a plain-language narrative pulling together Lagna/Moon
  foundation, strongest/weakest planets, formed yogas, life-area
  promises with current confidence, and the running dasha — never a
  single opaque "prediction."
- **Styling**: per the explicit instruction, this tab's presentation
  follows *only* the supplied Master UI Design System (Inter font,
  neutral `#F5F7FA`/`#FFFFFF`/`#E5E7EB` surfaces, `#2563EB` primary,
  4px-multiple spacing, 34-36px rows/buttons, right-aligned
  `tabular-nums` numeric columns, WCAG-AA focus rings) — deliberately
  **not** this app's shared pastel-\*/quality-\*/rem-table conventions
  used by every other tab. All of it lives in one scoped stylesheet,
  `js/parashariAnalysis/parashariAnalysis.css`, entirely under the
  `#tabParashariAnalysis` selector so it cannot leak into, or be
  overridden by, any other tab's CSS.

## Existing-file changes (minimal, additive only)

- `index.html`: one new tab button + panel at the end of the tab strip,
  one new `<link>` for the scoped stylesheet, two new `<script>` tags
  (engine, then UI) — no existing markup altered.
- `js/ui.js`:
  1. One line in the existing tab-click handler calling
     `window.ParashariAnalysisUI.render()` when the new tab is opened —
     the same lazy render-on-tab-open pattern used by every other tab.
  2. A guard added to the existing app-wide `centerNumericCellsIn()`
     (the `MutationObserver`-based utility that force-centers numeric/
     Yes-No table cells everywhere) to skip any cell inside
     `#tabParashariAnalysis`. This was necessary because that observer
     sets `td.style.textAlign` inline, which would otherwise override
     this tab's Master-UI-Design-System-mandated right-alignment via
     higher specificity. No other tab's centering behavior changed.

No `state.parashariAnalysis = null` reset was added to `generateChart()`:
unlike some earlier tabs, this module's cache invalidation
(`ParashariAnalysis.cache`) compares the `state.chart` object reference
directly, so a fresh chart generation naturally invalidates it without
any shared-state hook — keeping the module fully self-contained as the
spec requires.

## Deliberate scope decisions

- **Ishta/Kashta Phala**: not implemented. Neither this app nor any
  existing module has a validated source for these calculations, and the
  spec itself says to implement them only "if reliable source rules are
  available" (same standard applied to prior modules' omissions).
- **Pratyantardasha**: not shown, for the same reason already documented
  in `docs/sudarshana/research-notes.md` — this app's Vimshottari engine
  only eagerly computes Mahadasha/Antardasha; Pratyantardasha requires an
  on-demand `buildSubPeriods()` call against a selected Antardasha
  elsewhere in the app.
- **Spirituality** was added as the 9th life area (house 9, supporting
  houses 12 and 5) to match the spec's Section 38H nine-card life-area
  layout — the initial draft of this module only had 8.
- **No separate automated test suite**: consistent with the rest of this
  app (no test framework exists anywhere in the codebase), verification
  was done via headless-browser (Playwright) checks — see Testing below.

## Testing performed

- `node --check` on both new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 25 tabs
  (24 existing + the new one) clicked in sequence with zero page/console
  errors (the only console entry is a pre-existing, unrelated
  `favicon.ico` 404).
- Confirmed the new tab renders real chart-derived content (4 tables:
  Houses, Planets, Yogas, Navamsha) with no placeholder text, using the
  default chart already loaded on page load.
- Confirmed numeric table cells (`.pa-num`) computed `text-align: right`
  — i.e. the `centerNumericCellsIn` guard successfully keeps this tab's
  cells under the Master UI Design System's control rather than the
  app-wide center-alignment observer.

## Areas requiring manual astrological review

- The affliction/support scoring weights (`PA_WEIGHTS`) are an
  internally-consistent first cut, not independently validated against a
  named classical text — as with the Sudarshana Chakra and Remedies
  modules, a practicing astrologer may want specific weights retuned.
- Viparita Raja Yoga here only checks house-lord placement in another
  Dusthana; it does not yet evaluate the cancellation conditions
  (affliction of the placed lord, etc.) some classical sources require —
  flagged in the UI as "Benefic Yoga" formed on the placement condition
  alone, consistent with how this module documents its own confidence
  and reasoning transparently rather than silently applying an
  unstated exception.
