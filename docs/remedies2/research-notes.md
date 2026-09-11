# Remedies_2 — Research Notes & Limitations

## Purpose and relationship to Remedies_1

Remedies_2 is a **second, independently-built** deterministic Parashari
remedy engine, added per an explicit separate prompt
(`Parashari_Remedy_Engine_Claude_Code_Prompt.md`) that specifies its own
architecture (a `rawScore -> modifiers -> caps/floors -> finalScore`
pipeline; separate `natalSeverity` / `dashaActivation` / `currentRelevance`
components; a full debug/explainability JSON per planet; priority bands
named Critical/High/Significant/Moderate/Mild/Suppress). It is **not** a
UI reskin of Remedies_1 — the scoring, consolidation and ranking code in
`js/remedies2/remedyEngine2.js` is separate from `js/remedies/remedyEngine.js`
and was designed from this new prompt's requirements directly.

Both engines reuse the exact same underlying chart calculations — dignity
(`dignityDetails.js`), functional lordship (`interpretations2/ruleEngine.js`),
Shadbala (`state.shadbala`), Vargottama/Neecha Bhanga
(`interpretations2/ruleEngine.js`), Yogas (`state.yogas`), Dasha
(`state.dasha`), and conjunctions/aspects/combustion already attached to
each chart planet (`aspects.js`, `combustion.js`, `conjunctions.js`) — no
astronomy or dignity math is duplicated. Nothing in either module calls an
LLM, an external API, or performs a runtime web search; every rule, weight,
and remedy mapping is a fixed constant or a deterministic function of
already-computed chart data.

## Adaptation from the literal prompt: the Planet x House matrix

Section 5 of the prompt asks for explicit rules "for every planet occupying
every house 1-12" (a 9x12 = 108-cell matrix). Rather than hand-author 108
cells — most of which would just restate "Dusthana = concerning" or
"Kendra/Trikona = supportive" (exactly the blanket assumption Section 5
itself warns against: "Do not assume that every Dusthana placement is
automatically bad... do not assume every Trikona/Kendra placement is
automatically beneficial") — `houseContext2()` in `remedyEngine2.js`
computes the same judgment declaratively: it classifies the occupied house
(Dusthana/Kendra/Trikona/other) and combines that with the planet's
**functional** role for the specific Ascendant (already computed by
`functionalClassification()`), so a Dusthana placement is scored lower when
the planet is functionally favorable, and a Kendra/Trikona placement does
not fully offset an unfavorable functional role. This produces the required
contextual per-cell judgment without fabricating 108 individually-cited
classical rules, consistent with Section 27's own preference for
"declarative data structures over huge procedural if/else chains."

## Classical Beej Mantra Japa counts

Used exactly as specified in the prompt's Section 18 table (Sun 7,000;
Moon 11,000; Mars 11,000; Mercury 9,000; Jupiter 19,000; Venus 16,000;
Saturn 23,000; Rahu 18,000; Ketu 17,000) — stored in
`js/remedies2/remedyData2.js`, not recomputed or re-derived. The UI shows
both the total count and a suggested daily count over a 40-day practical
default, explicitly labeled as a practical default rather than the only
valid classical schedule (per Section 18's own caution).

## Dasha integration (Section 13) — kept separate from natal severity

`dashaActivation2()` reads the current Mahadasha/Antardasha lord from the
existing `state.dasha` timeline (no new dasha math) and returns a
**separate** activation weight, never folded into `natalSeverity` itself.
`natalSeverity` stays a pure function of natal factors; `priorityScore =
natalSeverity + dashaActivation.weight` is used only for ranking/priority
banding, and `currentRelevance` explicitly tells the UI whether a planet's
priority is "Natal", "Dasha activated", or "Natal + Dasha activated" — per
Section 13's explicit requirement.

## Avoiding double counting (Section 15)

Debilitation, enemy-sign relationship, and weak Shadbala are related but
distinct classical facts (dignity, sign-lord relationship, and calculated
strength respectively) and are scored as separate, smaller contributions
rather than one large "weak" penalty repeated three ways. The
`afflictionSubscore` vs `weaknessSubscore` split (used for the
pacify-vs-strengthen decision) also deliberately separates "harm from
outside" from "the planet's own condition" so the same underlying fact is
not read as evidence for two different remedy directions at once.

## Gemstone gate (Section 21) — highest caution

A gemstone is only ever offered when `remedyDirection === 'strengthen'`,
which itself requires: the planet's functional role is favorable for this
specific Ascendant, AND weakness (not outside affliction) is the dominant
driver of its condition. Additional gates: Rahu/Ketu are always
`conditional`, never a plain recommendation; missing/unreliable Shadbala
data routes to "professional review" rather than a guess; and a natal
severity of 80+ (Very Severe) on an otherwise-favorable planet is treated
as needing individual review rather than a default gemstone suggestion,
since a severity that high usually means something in the assessment is
unusual enough to warrant a second look.

## Priority suppression and consolidation (Sections 25-26)

All 9 planets are always assessed and appear in the Planetary Diagnostic
Matrix, but only planets scoring at or above `suppressBelow` (20) appear in
the default "Recommended Remedies" list, capped at
`maxPrimaryPackages` (7), so the tab does not flood the user with dozens of
low-value remedies (Section 26). Each planet produces exactly **one**
consolidated remedy package combining every contributing factor into a
single primary reason plus a full adverse/protective factor list (Section
25), rather than one card per individual affliction.

## Rule provenance (Section 35)

Every scored factor in `assessPlanet2()` carries a `ruleId`, `source`, and
`confidence` field (e.g. `DEBILITATION` / "Parashari classical dignity
principles" / "high"; `ASPECT_FROM_MALEFIC` / "application-selected
convention for Rahu/Ketu" / "medium"), visible in Debug Mode, so a disputed
or application-selected convention is never presented as an undisputed
classical fact.

## Testing performed

This codebase has no formal automated test framework (consistent with the
rest of the app and with Remedies_1) — Section 32's exhaustive matrix of
automated tests (12 Ascendants x 9 planets, all planet pairs, etc.) was
not built as a separate test suite for the same reason Remedies_1 does not
have one; instead, verification was performed via headless-browser
(Playwright + Chromium) checks:
- Full regression pass across every tab (including the newly-renamed
  Remedies_1 tab) after adding Remedies_2 — no console/page errors.
- Confirmed the Recommended Remedies list, Priority Summary cards,
  Planetary Diagnostic Matrix, and Debug Mode toggle all render with
  real chart-derived content.
- Confirmed `packages.length === 9` (one consolidated package per planet,
  never a duplicate card for the same planet).
- Confirmed `priorityScore` sorting is strictly descending.
- Confirmed no functionally-malefic or Natural-Malefic-labeled planet ever
  receives `gemstone.recommended: true` on a live chart.
- Using synthetic charts: confirmed the `STRENGTHEN_PLANET`/gemstone-
  eligible path fires correctly for a functionally-favorable, genuinely
  weak (not merely afflicted) planet, and does NOT fire when the same
  planet's low score is explained by Neecha Bhanga cancellation (i.e., the
  engine correctly treats a cancelled debilitation as not requiring a
  remedy at all, rather than still recommending strengthening).

## Areas requiring manual astrological review

- The specific weight constants in `REMEDY2_CONFIG.weights` are an
  internally-consistent first cut aligned to the prompt's own worked
  example (Section 14), not independently validated against a named
  classical scoring system.
- The declarative Planet x House context model (see above) is an explicit
  adaptation from a literal 108-cell matrix; a practicing astrologer may
  want particular planet/house combinations reviewed individually.
- As with Remedies_1, any user considering an actual gemstone purchase
  should consult a qualified astrologer/gemologist before acting — this
  module is a decision-support and educational tool, not a prescriptive
  authority, and makes no medical, legal, or financial guarantees.
