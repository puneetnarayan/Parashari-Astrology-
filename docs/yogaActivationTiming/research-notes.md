# Yoga Activation Timing — research notes

## What this module is
A synthesis/orchestration layer on top of the **existing** Yogas tab
(`js/yogas/yogaEngine.js` + `js/yogas/yogaRules.js`). It does not detect
yoga formation itself. It takes the existing engine's own per-yoga rows
(`{key, name, polarity, howDerived, meaning, present, magnitude, planets,
details}`) and runs a Formation -> Formation Strength -> Domain Mapping ->
Dasha Activation (MD/AD/PD) -> Transit Confirmation -> Divisional-Chart
Confirmation -> Existing-Timing-Module Correlation -> Activation
Classification -> Correlation/Deduplication pipeline on top of them.

## How the existing yoga engine was reused (no reimplementation)
`js/yogas/yogaEngine.js`'s `computeYogas(planets, ascendant)` had **no**
`window.*` export before this module — it was only consumed internally by
`ui.js`'s `generateChart()` (which stores the result as `state.yogas`) and,
in Node, via `module.exports`. A minimal, non-invasive export wrapper was
appended **at the end of the file, after the existing `module.exports`
block**, changing nothing about `computeYogas()`'s internal logic:

```js
if (typeof window !== 'undefined') {
  window.YogaEngine = { detect: computeYogas };
}
```

`YogaActivationTiming.getYogaFormations()` prefers the already-computed
`state.yogas` (set once per chart generation by `ui.js`, avoiding a
redundant recompute), and falls back to calling `window.YogaEngine.detect`
directly (then a bare `computeYogas` global) only if `state.yogas` is not
yet populated. This guarantees:
1. Formation/presence/magnitude/derivation text for every yoga is **read
   from the existing engine only**, never re-derived.
2. The existing Yogas tab's own rendering and behavior are completely
   unaffected — it still reads `state.yogas` exactly as before; the
   `window.YogaEngine` export is purely additive.

Verified (section "existing Yogas tab still renders identically") by
clicking the Yogas tab before and after this module's addition, with the
same chart loaded, and confirming the same rows/magnitudes/order.

## Yoga -> domain -> existing-module mapping
Implemented in `yogaActivationTimingRules.js` as `window.YOGA_DOMAIN_MAP`,
keyed by the exact `key` values read directly from `js/yogas/yogaRules.js`'s
`YOGA_DEFINITIONS` (not guessed). Each entry carries a `domain` label, the
divisional charts (`vargas`) relevant to that domain, and the existing
timing-module global names (`modules`) that may show a correlated window
for that yoga's domain (e.g. `dhana` -> `FinancialGainTiming`,
`SalaryIncomeTiming`, `WealthProtectionTiming`, `MajorExpenditureTiming`,
`BusinessStartTiming`; `raja` -> career/promotion/recognition modules).

## "Do not duplicate event timing" (section 16)
`YogaActivationTiming.checkCrossModules()` calls each correlated module's
own `window.<Module>.refresh()`, defensively normalizes its window(s) with
`windowsArrayFrom()` (handles both an array of windows — the common shape —
**and** `MarriageTiming`'s unique `{primary, secondary}` object shape, via
`Array.isArray()` guarding, per the discovery inventory's documented
gotcha), and checks for an overlap with this yoga's current MD/AD/PD
period. When found, the UI renders that module's own window/interpretation
as supporting evidence (`crossCheck.interpretation`) instead of computing
or displaying any independently-derived date range for the same event.

## Correlation / deduplication (section 32)
`groupCorrelatedYogaActivations()` groups all currently-activated yogas by
their shared `currentMD|currentAD|currentPD` key into clusters, and
`calculateYogaDomainDiversity()` counts the distinct `domain` values within
each cluster. A cluster of e.g. Raja Yoga + Dhana Yoga + a career yoga all
sharing one Antardasha is rendered as **one** cluster row with a
domain-diversity count, not as three independent "major life events".

## Safety
- Qualitative-only Formation Strength (Strong/Moderate/Contextual/Not
  Applicable) and Activation Level (Strong/Moderate/Contextual/
  Dormant-No-Current-Activation) — no numeric "yoga power score".
- Raja Yoga / Neecha Bhanga Raja Yoga are never auto-equated with
  "promotion" or "government position" (section 27) — `specialHandlingNote()`
  only makes a specific-event connection when an existing career/
  recognition module's own window actually overlaps.
- Dhana Yoga is described only as a qualitative supportive period — never
  an exact wealth figure (section 28).
- Viparita/Dusthana-lord patterns (e.g. Daridra Yoga) are read as
  reversal-of-fortune context only, never a guaranteed windfall (section 29).
- Neecha Bhanga uses only the existing engine's own single cancellation
  check (`neechaBhangaYoga` in `yogaRules.js`) — no additional classical
  conditions invented (section 30).
- A dedicated forbidden-language scanner
  (`YogaActivationTiming.scanForForbiddenLanguage`) guards against
  guarantee/death/lifespan/illness/investment/legal/medical-advice phrasing,
  independent of other modules' own scanners, per this codebase's
  established per-module pattern.

## Namespacing
- `window.YogaActivationTiming` — engine (pure calculation, no DOM).
- `window.YogaActivationTimingUI` — renderer (`#yogaactivation-root`).
- `window.YOGAACTIVATION_TIMING_RULES` — rule/provenance registry.
- `window.YOGA_DOMAIN_MAP` / `window.YOGA_DOMAIN_DEFAULT` — yoga-to-domain
  mapping tables (module-specific, not a generic rules array, so kept as a
  separate global rather than folded into `YOGAACTIVATION_TIMING_RULES`).
