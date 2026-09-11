# Nakshatra Interpretations — Research Notes

## Purpose

Adds a "Nakshatra Interpretations" tab giving, for each of the 9 planets,
an interpretation of its current Nakshatra (lunar mansion) and Pada
(quarter) — synthesized deterministically from existing classical
reference data already in this app, with no runtime LLM call and nothing
fabricated per planet/nakshatra/pada combination.

## Web research performed

Before implementing, two targeted searches were run to verify the
technique used for pada-level interpretation (rather than assume it):

- "nakshatra pada navamsa sign mapping technique Vedic astrology 4 padas
  each nakshatra" — confirmed the standard classical fact that a pada
  (3°20') is, by definition, exactly one Navamsa (D9) division (108 padas
  = 27 nakshatras × 4 padas = 12 signs × 9 Navamsas), and that each pada's
  "elemental flavor" is simply its own D9 sign. This matches — and is
  computed by reusing — this app's own existing `vargaPosition(longitude,
  'D9')` function in `divisionalCharts.js`, so no separate/invented pada
  mapping was introduced.
- "planet in nakshatra interpretation meaning Vedic astrology..." —
  confirmed the general framework (planet's own significations, colored
  by the occupied nakshatra's character, with the nakshatra's star lord
  adding dasha-relevance) used for the synthesized paragraph.

## What is reused vs. newly written

Nothing astronomical or dignity-related is recomputed. The synthesis in
`js/nakshatra/nakshatraInterpretationEngine.js` combines, for a given
planet at its already-computed chart longitude:

- **Nakshatra, pada**: from the existing `nakshatraFromLongitude()` /
  `padaOf()` functions (`parashariTables.js`) — already used everywhere
  else in the app (Planet Table, dasha calculations, etc.).
- **Deity, symbol, keynote**: from `NAKSHATRA_TRAITS`
  (`interpretations2/nakshatraTraits.js`), already in this app — a
  general classical reference synthesis, explicitly not presented as a
  verbatim quotation of any single text (consistent with that file's own
  existing caveat).
- **Star lord**: from `NAKSHATRA_TABLE` (`parashariTables.js`) — the
  standard Vimshottari sequence, already computed.
- **Planet's core significations**: from
  `PARASHARI_KB.planetCoreSignifications` (`knowledgebase/parashariKB.js`)
  — already in this app (from the incorporated Knowledge Base package).
- **Pada's Navamsa-sign flavor**: from `vargaPosition(longitude, 'D9')`
  (`divisionalCharts.js`) plus `SIGN_TRAITS`
  (`interpretations/signTraits.js`) — both already in this app.

The only new content is the deterministic template that stitches these
together into one explainable paragraph per planet, plus a
chart-independent "all 27 nakshatras" reference table per planet (deity/
symbol/keynote/star lord — the same fixed facts for every chart, with the
planet's current nakshatra highlighted).

## What was deliberately NOT done

- No 9×27 (243) or 9×27×4 (972) hand-written unique interpretive
  paragraphs were authored. Fabricating that much specific narrative text
  without a verifiable per-combination classical source would risk
  presenting invented content as settled tradition — the same concern
  already documented for Remedies_1/Remedies_2 and the Knowledge Base
  tab's Planet-in-Sign section. Instead, the synthesis is fully
  traceable: every sentence in the paragraph maps directly to one reused
  data source, named in the tab's own source note.
- No new dignity, strength, or dasha-activation scoring was added — this
  tab is descriptive/reference in nature, not a new affliction-assessment
  engine (unlike Remedies_1/Remedies_2).

## Testing performed

Consistent with the rest of this app (no formal automated test
framework): verified via headless-browser (Playwright + Chromium) checks
— full regression pass across every tab (no console/page errors) after
adding this tab, the tab renders real chart-derived nakshatra/pada content
for all 9 planets, and each planet's "all 27 nakshatras" reference table
has exactly 27 rows with the current nakshatra correctly highlighted.

## Areas requiring manual astrological review

- The synthesized paragraph is a template-driven combination of real
  reference facts, not an independently-authored classical commentary on
  each specific planet/nakshatra pairing — a practicing astrologer may
  want to add nuance here (e.g. specific classical remarks for well-known
  combinations like Moon in Ashlesha or Saturn in Pushya) beyond what the
  template alone produces.
- `NAKSHATRA_TRAITS`'s keynotes are short, general characterizations; like
  the rest of this app's reference data, they are a starting point to
  refine with additional source material, not a final authority.
