# Remedies Module — Research Notes & Limitations

## Purpose
This document records the sources, principles, and deliberate omissions behind
the Remedies tab, per the module's design requirement that nothing in this
feature be LLM-improvised at runtime — all remedy content lives in
`js/remedies/remedyData.js` as a static, human-reviewable database; all
chart-specific logic lives in `js/remedies/remedyEngine.js`.

## Sources consulted (by category)

- **Mantra/Chant**: The standard, widely-taught Navagraha "Om [Graha, dative
  case] Namah" salutation mantras (e.g. "Om Suryaya Namah", "Om
  Shanaishcharaya Namah"). These are common devotional-practice mantras, not
  tied to a single citable verse, and are labeled `sourceType: 'Traditional'`,
  `confidence: 'Medium'` accordingly. The more advanced Beeja (seed)
  mantras used in some traditions require oral transmission/initiation from a
  qualified teacher — the database intentionally does NOT include their
  Sanskrit text, and marks the placeholder entries `advanced: true,
  suitableForOrdinaryUsers: false` rather than fabricating or guessing the
  syllables.
- **Donation (Dāna)**: The standard Navagraha dāna item list (grains, cloth,
  metals, foods associated with each planet) as commonly taught in
  mainstream Jyotish practice manuals. Labeled `sourceType: 'Traditional'`,
  `confidence: 'Medium'`.
- **Action/Conduct (Upāya)**: Behavioral remedies (fasting days, charitable
  conduct, service, etc.) drawn from the same mainstream convention. Labeled
  `confidence: 'Low'` where a specific behavior isn't traceable to one
  named classical source, to avoid overclaiming precision.
- **Gemstones (Ratna)**: The standard 9-planet gem/substitute table found in
  most Jyotish reference works. `sourceType: 'Traditional'`.
- **Dosha-specific remedies**: Mapped directly onto yoga/dosha keys already
  detected by the existing `js/yogas/yogaRules.js` engine (e.g. Kaal Sarpa,
  Shrapit, Guru Chandal, Kemadruma, Vish, Grahan). No new dosha-detection
  logic was written for this module — it reuses what the Yogas tab already
  computes, per the architectural requirement to avoid duplicating
  calculations.

## Deliberately withheld / not fabricated

- No Sanskrit text, meanings, syllable counts, or chapter/verse citations
  were invented. Where a specific classical source (e.g. a BPHS chapter and
  verse number) could not be verified, the entry is labeled `Traditional`
  or `Modern` with an honest confidence level instead of a fabricated
  `Classical` citation.
- Beeja mantras are withheld entirely (see above).
- The Rasi-Pinda/Graha-Pinda-style multiplier layers used elsewhere in this
  app's Ashtakavarga Predictions module were considered for weighting
  remedy priority further, but are explicitly NOT used here — that
  technique remains unverified in this codebase (see
  `ashtakvargaRuleDatabase.js`, rule `AV_RULE_005`), and building remedy
  priority on top of an unverified technique would compound uncertainty.

## Scoring model summary

`REMEDY_ENGINE_CONFIG` (in `remedyEngine.js`) centralizes every weight used
by `assessPlanet()`:

- **Affliction factors** (raise remedial priority): debilitation, severe
  combustion, malefic conjunctions, Dusthana placement, functional-malefic
  role, Lagna/Lagna-lord affliction, Moon affliction, presence in a bad
  yoga, enemy-sign placement, weak Shadbala, current dasha activation.
- **Protective/mitigating factors** (lower it): exaltation, own sign or
  Moolatrikona, Vargottama, Neecha Bhanga applicability.
- The engine tracks an `afflictionSubscore` (external affliction) separately
  from a `weaknessSubscore` (own dignity/strength) so it can distinguish
  "weak but not afflicted" from "afflicted regardless of strength" —
  directly implementing the module's core requirement: **strength alone
  never triggers a "strengthen this planet" remedy**; functional
  desirability for the specific Lagna is checked first via the existing
  `functionalClassification()` from `interpretations2/ruleEngine.js`.
- `remedyMode` (`PACIFY_PLANET` / `STRENGTHEN_PLANET` / `PACIFY_AFFLICTION`
  / `GENERAL_PROPITIATION`) is derived from which subscore dominates and
  the planet's functional favorability, not from Shadbala alone.

## Gemstone safety logic

Deliberately conservative:
- A gemstone is only ever `RECOMMENDED` for a planet found to be genuinely
  functionally favorable for the Lagna, not merely weak.
- Rahu and Ketu are capped at `CONDITIONALLY_RECOMMENDED` at most — never
  `RECOMMENDED` — reflecting the widespread traditional caution around
  Rahu/Ketu gemstones.
- Planets with missing/unreliable Shadbala data, or a severe-but-favorable
  combination the engine can't confidently resolve, are routed to
  `PROFESSIONAL_REVIEW_REQUIRED` rather than guessed.
- A mandatory, non-dismissable warning banner is shown above every gemstone
  section stating that gemstones are not scientifically validated by this
  app and are not a substitute for professional guidance.

## Ranking and deduplication

Cards are ranked by `priorityScore = severityScore + dasha-relevance boost`
and split into Primary (max 5) / Secondary (max 7) / Supportive tiers.
`attachDoshaReasons()` merges dosha-yoga-based reasoning onto a planet's
existing remedy cards rather than creating separate duplicate cards for
the same underlying recommendation (e.g. Vish Yoga's Moon+Saturn remedy is
attached to the existing Saturn/Moon cards, not issued as a new one).

## No false certainty

No remedy card promises a guaranteed outcome (marriage, pregnancy, wealth,
job, disease cure, etc.). Every card carries a "Why this remedy?"
expandable section tracing: chart condition → interpretation → remedy →
source, so every recommendation is auditable back to the actual computed
chart data (dignity, house, yoga, Shadbala, dasha) rather than asserted.

## Testing performed

This codebase has no formal automated test framework (consistent with the
rest of the app, which relies on static HTML/JS with no build step). The
Remedies module was verified via headless-browser (Playwright + Chromium)
checks against a live-generated chart:
- All existing tabs still render without console/page errors after adding
  this tab (regression check).
- The Remedies tab renders with a header (Lagna, current Mahadasha/
  Antardasha, overall priority), the mandatory gemstone warning, and cards
  in all three sections, each with real chart-derived reasoning text (not
  placeholder copy).
- Verified for a real test chart that no functionally-malefic planet ever
  receives `gemstoneStatus: 'RECOMMENDED'`.
- Verified the category filter (e.g. "Gemstone only") actually removes
  other categories from the rendered output, and the "current dasha only"
  filter actually narrows to dasha-relevant cards.

## Areas requiring manual astrological review

- The specific weight values in `REMEDY_ENGINE_CONFIG` are a reasonable,
  internally-consistent first cut, not independently validated against a
  named classical scoring system — a practicing astrologer reviewing edge
  cases (e.g. a planet that is simultaneously exalted, in a Dusthana, and
  in a bad yoga) may want to retune specific weights.
- Deeper Ashtakavarga-based remedy weighting (Rasi/Graha Pinda) was
  intentionally left out pending independent verification of that technique
  itself.
- Any user considering an actual gemstone purchase should be advised, as
  the in-app banner states, to consult a qualified astrologer/gemologist
  before acting — this module is a decision-support and educational tool,
  not a prescriptive authority.
