# Sudarshana Chakra — Implementation Notes

## What was implemented

A new "Sudarshana Chakra" tab implementing the three-reference-point
(Lagna/Moon/Sun) analysis requested, reusing this app's existing
calculations throughout — no duplicate astronomy or dignity engine:

- **Three reference models** (`js/sudarshana/sudarshanaEngine.js`,
  `sudarBuildReferenceModel`): for each of Lagna, Moon, and Sun, the
  reference sign becomes House 1 and every planet's house is computed via
  `wholeSignHouseOf(signIndex, referenceSignIndex)` — an existing function
  in `parashariCharts.js` already used for the natal D1 chart, which is
  exactly the generic "zodiac distance" formula the spec calls for.
  Planetary signs/degrees/conjunctions/aspects are never altered — only
  the house number.
- **Three Chakra display**: reuses the existing `renderNorthIndianChart()`
  function verbatim (the same chart-drawing code used everywhere else in
  this app) — no new wheel-drawing code was written.
- **Planetary comparison table**: clickable rows open a full per-planet
  detail (house from each reference, lordship from each reference,
  Kendra/Trikona/Dusthana category from each reference, conjunctions,
  aspects, dignity, functional nature, relevant life areas, and a
  generated synthesis sentence) — verified by hand-checking the house/
  lordship arithmetic for a live chart (see Testing below).
- **Life-Area Analysis**: 23 life areas (Section 11's list), each scored
  from Lagna, Moon, Sun, Dasha, and Transit support, with a Sudarshana
  synthesis and confidence label. The synthesis text explicitly follows
  the spec's conflict-resolution guidance (Section 28) — e.g. "strong
  external potential, but the native may experience it with more
  psychological uncertainty" when Lagna and Moon disagree — rather than
  forcing a single verdict.
- **Annual Sudarshana Chakra**: the traditional 12-year house cycle
  (age % 12 + 1), evaluated against natal condition, dasha, and transit
  support for that house, using the app's existing `ageAt()` function.
- **Transit Analysis**: reuses `computeSingleLongitude()` (the same
  ephemeris call already used by Ashtakvarga Predictions' transit
  section) for the 9 major bodies, shown from all three references.
- **Dasha + Sudarshana panel**: shows the current Mahadasha/Antardasha
  lord's house from all three references and which life areas it's
  relevant to.
- **Event/Timing Support Engine**: a dropdown of all 23 life areas,
  producing a structured multi-bar report (Natal Promise, Lagna/Moon/Sun
  Support, Dasha Support, Transit Support, Sudarshana Confirmation,
  Overall Confidence) — explicitly labeled "Astrological Support Score,"
  not a probability, per Section 47.
- **Methodology and Help panels**: explain the reference hierarchy
  (Natal promise -> Dasha -> Transit -> Sudarshana confirmation), the
  house-support scoring model, and answer the standard clarifying
  questions from Section 45 (are these three separate charts? does a
  positive result guarantee an event?).
- **Explainability**: every life-area card and the annual panel include
  an expandable "Show calculation / rules" section listing the actual
  reasons behind each score (Section 34/35) — nothing is a black box.
- **Color coding, as requested**: Strong/Very Strong = light green,
  Moderate/Mixed = light yellow, Weak/Very Weak = light red (the app's
  existing `.quality-good/.quality-neutral/.quality-bad` convention) —
  always paired with the text label itself, never color alone (Section 32).

## Scoring model (transparent, Section 26/14)

`sudarHouseSupportScore()` starts at a neutral baseline (5/10) and adjusts
for: occupant natural benefic/malefic count, the house lord's dignity
(Exalted/Moolatrikona/Own Sign/Debilitated — via the existing
`detailedDignity()`), whether the house lord itself sits in a Kendra/
Trikona or Dusthana from the SAME reference, and benefic/malefic aspects
on the lord (via each planet's existing `aspectedBy`). This deliberately
avoids the "good house = good result" shortcut the spec explicitly warns
against (Section 12) — a favorable house position is still qualified by
the lord's own condition.

`natalPromise` always anchors to the **Lagna** score specifically (the
classical convention that the Lagna chart is the primary reference for
natal promise), and the overall life-area confidence weights it double —
Moon/Sun/dasha/transit qualify it but cannot manufacture a result absent
from it (Section 2/26/42).

### Dasha Support now folds in the connecting lord's own dignity

A user question exposed a real ambiguity in the original design: "Dasha
Support" only measured whether the current Mahadasha/Antardasha lord was
*connected* to a house (ruling or occupying it) — a pure activation
signal that said nothing about whether that activation was good or bad.
For a house like the 6th (Debt, Enemies/Competition), a "Strong" score
could be misread either way — is the native winning, or is the debt/
enemy problem intensifying?

`sudarDashaSupportForHouse()` now also evaluates the connecting lord's
own dignity (via the existing `detailedDignity()` engine, not
recomputed) and folds it directly into the score: an Exalted/Own-Sign/
Moolatrikona connecting lord pushes the score up and is labeled
**Favorable**; a Debilitated one pulls it down and is labeled
**Unfavorable**. The UI shows this as an explicit badge next to the
Strong/Moderate/Weak label, and the reasons list spells out which
planet's dignity drove the direction. "Strong" now means the current
period both strongly activates AND favorably supports that house's
themes — not merely that the theme is "in focus."

## Deliberate scope decisions

The source prompt (51 sections) asked for several things not implemented
literally, for reasons consistent with this app's existing conventions:

- **No separate image/PNG asset generation** (Section 30-31, "6 required
  images"). Instead, the tab's diagrams are the functional artifacts
  themselves — the three actual North Indian chakra wheels (reusing the
  existing chart renderer) and the methodology/help text panels that
  explain the same concepts textually. A separate static illustration set
  would duplicate what the live, chart-specific wheels already show more
  usefully, and this app has no existing image-asset pipeline to extend.
- **No separate automated test suite** (Sections 36-37, "verify all 144
  reference-sign/planet-sign combinations"). Consistent with the rest of
  this app (no formal test framework exists anywhere in the codebase),
  verification was done via headless-browser (Playwright) checks,
  including manually re-deriving the house/lordship arithmetic for a live
  chart across all three references and confirming it matched the
  engine's output exactly (see Testing below). The underlying house
  formula (`wholeSignHouseOf`) is not new — it is the same function
  already used (and implicitly exercised) by the natal D1 chart
  throughout the rest of this app.
- **Pratyantardasha**: not shown, because this app's own Vimshottari
  engine only computes Mahadasha and Antardasha eagerly (Pratyantardasha
  requires an on-demand `buildSubPeriods()` call for a selected AD, as
  documented in `vimshottariDasha.js`) — showing it here would require
  the user to first drill into a specific Antardasha elsewhere in the app,
  which is out of scope for this tab's summary panel.
- **House cusps**: not used, since this app uses whole-sign houses
  throughout (no cusp-based house system) — consistent with the rest of
  the app, not a gap specific to this tab.

## Testing performed

Consistent with the rest of this app: verified via headless-browser
(Playwright + Chromium) checks —
- Full regression pass across all 24 tabs (no console/page errors) after
  adding this tab.
- Manually re-derived, by hand, the house-from-reference and lordship-
  from-reference arithmetic for a live chart (Sun in Taurus, Lagna
  Scorpio, Moon in Aries) across all three references, and confirmed the
  engine's output matched exactly (e.g. Sun is correctly 7th from Lagna,
  2nd from Moon, 1st from itself/Sun; Sun's own sign Leo is correctly
  10th from Lagna, 5th from Moon, 4th from Sun).
- Confirmed the three Chakra wheels, planetary comparison table (with
  working click-to-expand detail), 23 life-area cards, annual chakra
  panel, transit table, dasha panel, and event-support dropdown (23
  options) all render real chart-derived content with no placeholder text.
- Confirmed the help panel toggles correctly.

## Areas requiring manual astrological review

- The house-support scoring weights are an internally-consistent first
  cut, not independently validated against a named classical Sudarshana
  text — a practicing astrologer may want specific weights retuned.
- Functional lordship (used in the planetary comparison's "key
  interpretation" line) is computed from the natal LAGNA only, per this
  app's existing `functionalClassification()` — some traditions also
  compute a separate functional classification from the Moon (Chandra
  Lagna); this was intentionally not added as a second, parallel
  lordship system to avoid introducing an unvalidated new rule set.
