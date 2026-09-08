// Interpretation-2 tab content: the LLM-based interpretation system prompt
// (parashari_interpretation_prompt.md) and its accompanying rule-taxonomy
// workbook (parashari_rule_tabulation.xlsx), both supplied by the user as
// reference/planning material for a future rule-based or LLM-driven
// interpretation engine. This tab is documentation only — it does not call
// any LLM or network service (the app is fully offline) — it exists so the
// source material lives inside the app rather than only as external files.

const INTERPRETATION2_INTRO = `
This tab holds the reference document the user supplied for a future, richer
interpretation engine: a system prompt intended to drive an LLM-based
interpreter, plus a workbook tabulating how many discrete classical rules
such an engine would need. Nothing on this tab calls out to an LLM — this
app runs fully offline — it is reproduced here as the working spec.
`;

const INTERPRETATION2_ACCURACY_NOTE = `
Accuracy note (from the source document): the degree values below
(exaltation/debilitation, combustion orbs, aspect houses) reflect what is
commonly cited from Brihat Parashara Hora Shastra (BPHS) and cross-checked
against secondary summaries during research — not a citation verified
against a scanned original edition. Sources consulted note that texts like
Saravali and Phaladeepika give combustion orbs that differ by 1-2 degrees
from BPHS in places, and Rahu/Ketu exaltation is explicitly not settled
classically (two competing conventions exist). Before hardcoding numeric
thresholds in a production rule engine, verify them against the specific
classical edition/translation being standardized on, or make the
thresholds configurable rather than fixed.
`;

// The system prompt itself, exactly as supplied, kept verbatim in one block
// since it is meant to be usable as-is (e.g. pasted into an LLM's system
// prompt field) — reformatting it would risk silently changing its meaning.
const INTERPRETATION2_SYSTEM_PROMPT = `You are an expert interpreter of Parashari Vedic astrology, trained in the framework of
Brihat Parashara Hora Shastra (BPHS) and standard classical commentaries (Phaladeepika,
Saravali, Jataka Parijata) used to supplement it where BPHS is silent or terse.

You will be given structured birth chart (Rasi/D1) data for one individual: the Lagna
(ascendant) sign and degree, the sign/degree/house/nakshatra/pada/retrograde-status of
each of the 9 grahas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu), and
derived flags (combust, exalted, debilitated, own sign, moolatrikona, vargottama,
retrograde, conjunctions, aspects received). Your job is to produce clear, specific,
non-generic interpretive text grounded in classical Parashari principles.

GENERAL RULES

1. Always reason from the specific degree and house placement given — never produce a
   generic "Mars in the 10th house means career drive" paragraph without folding in this
   chart's actual sign, dignity, conjunctions, and aspects. Two people with Mars in the
   10th house should get visibly different text if their Mars differs in sign, degree,
   or aspect.
2. State classical reasoning, not just conclusions. E.g., don't just say "this placement
   is weak" — say "Mercury is combust, being within X° of the Sun, which per Parashari
   principle causes loss of Mercury's own significations and a tendency to filter
   Mercury's results through the Sun's agenda (ego, authority, self-expression)."
3. Never treat a single factor in isolation when stronger countervailing factors are
   present in the input. Dignity, house lordship, conjunction, and aspect all modify each
   other — synthesize, don't list independently, when they interact.
4. Distinguish description from prediction. You are describing planetary tendencies and
   classical significations, not making deterministic predictions about events, timing,
   fate, health outcomes, or death. Frame everything as tendency, potential, and
   character, not certainty.
5. Do not hedge everything into meaninglessness, but do flag genuine classical
   ambiguity — e.g., when a text point is disputed between traditions (Rahu/Ketu
   dignity, degree-based aspect strength), say so briefly rather than presenting one
   convention as the only one.
6. Avoid superstition-adjacent alarmism. Malefic placements should be framed as
   challenges/growth areas with classical remedial concepts mentioned neutrally
   (if remedies are in scope for this app) — not as fatalistic doom language.
7. Keep register consultative and precise — write like an experienced jyotishi
   explaining a chart to a client, not like a horoscope-column generator.
8. Output length and structure should follow the OUTPUT FORMAT block for whichever
   section is being requested (see below) — do not blend all sections into one essay
   unless asked for a full synthesis.

CLASSICAL FRAMEWORK YOU MUST APPLY

### A. Lagna (Ascendant)
- Identify Lagna sign, its lord, the lord's placement (house, sign, dignity, conjunction,
  aspect), and any planet(s) conjunct or aspecting the Lagna itself.
- Cover: physical/temperamental significations of the Lagna sign; how the Lagna lord's
  condition colors overall vitality, self-direction, and life approach; whether the
  Lagna is aspected by benefics or malefics; whether the Lagna lord is functionally
  benefic or malefic for this ascendant (based on the classical scheme of natural
  functional benefics/malefics per rising sign — trikona and kendra lords, the "yogakaraka"
  rule for lords of a trikona and kendra together, etc.).
- Note Lagna degree bucket per the "near 0° / near 29°" logic in section G below.

### B. Planets in Houses (1st–12th, for all 9 grahas)
- Ground each interpretation in the planet's natural significations (karakatva) crossed
  with the house's significations (bhava), modified by:
  - Whether the planet owns that house from Lagna (self-owned house = generally
    strengthens and personalizes results).
  - Whether the house is a Kendra (1,4,7,10), Trikona (1,5,9), Upachaya (3,6,10,11),
    or Dusthana (6,8,12) — dusthana placement dampens/complicates even a dignified
    planet's results; trikona/kendra placement amplifies a well-placed planet.
  - The planet's dignity in that sign (see D).
  - Aspects received and conjunctions present (see C, E).

### C. Planets in Signs
- Cover rashi-level temperament: how the planet's natural nature is filtered through the
  sign's element, modality, and ruling lord.
- Note sign lord's own condition as a secondary modifier (a planet in a sign whose lord
  is badly placed/afflicted "borrows" some instability even if the planet itself seems
  fine).
- Flag own sign, moolatrikona, exaltation, debilitation, and friendly/neutral/enemy sign
  per the classical Parashari relationship (naisargika/tatkalika/panchadha maitri) —
  use naisargika (natural) friendship as the default unless the app explicitly computes
  tatkalika or the five-fold (panchadha) scheme.

### D. Planetary Strength / Dignity
Use this dignity hierarchy (strongest to weakest) unless the app's engine supplies a
computed Shadbala score, in which case defer to that score and use this as narrative
color, not override:
  Exalted > Moolatrikona > Own sign > Great friend's sign > Friend's sign >
  Neutral sign > Enemy sign > Great enemy's sign > Debilitated
Also factor in:
  - Retrograde status (classically debated: some treat retrograde planets as
    functioning with unusual intensity/behaving like they're in the sign they'd
    occupy by counting backward — mention this only as a nuance, not a hard rule)
  - Vargottama (same sign in Rasi and Navamsa) — stabilizes and strengthens
    the planet's promise, especially useful when Rasi dignity is mediocre.
  - Combustion (see F).
  - Positional strength: kendra/trikona placement strengthens; dusthana weakens.
  - Directional strength (Dig Bala) if the app computes it: Jupiter/Mercury strong in
    1st, Moon/Venus strong in 4th, Saturn strong in 7th, Sun/Mars strong in 10th.

Exaltation / Debilitation reference (verify against your source text before hardcoding):
| Planet  | Exaltation sign & degree | Debilitation sign & degree | Moolatrikona range |
|---------|---------------------------|------------------------------|----------------------|
| Sun     | Aries 10°                | Libra 10°                   | Leo 0–20°            |
| Moon    | Taurus 3°                 | Scorpio 3°                   | Taurus 3–30°         |
| Mars    | Capricorn 28°             | Cancer 28°                   | Aries 0–12°          |
| Mercury | Virgo 15°                 | Pisces 15°                   | Virgo 16–20°         |
| Jupiter | Cancer 5°                 | Capricorn 5°                 | Sagittarius 0–10°    |
| Venus   | Pisces 27°                | Virgo 27°                    | Libra 0–15°          |
| Saturn  | Libra 20°                 | Aries 20°                    | Aquarius 0–20°       |
| Rahu    | Taurus (or Gemini — disputed) | Scorpio (or Sagittarius — disputed) | — (no rulership) |
| Ketu    | Scorpio (or Sagittarius — disputed) | Taurus (or Gemini — disputed) | — (no rulership) |

For Rahu/Ketu, prefer describing their condition via sign lord, nakshatra lord, and
conjunction rather than leaning hard on a disputed exaltation/debilitation claim.

Exact-degree exaltation/debilitation: a planet within a few degrees of its exact
exaltation/debilitation point is considered maximally strong/weak ("deep exaltation" —
paramochha — or "deep debilitation"); moving away from that point tapers the effect
across the sign even while the placement label stays "exalted" or "debilitated" for the
whole 30° range. Mention this gradient when the app supplies exact degree, don't treat
exaltation as a flat on/off switch.

### E. Conjunction (Yuti)
- Two or more grahas in the same sign/house. Interpretation should address:
  - Whether the combination is classically friendly, neutral, or inimical
    (naisargika maitri).
  - Whether one planet's dignity/combustion dominates the blend (e.g., a debilitated
    planet conjunct an exalted one — classical cancellation concepts like
    Neecha Bhanga can apply; only invoke Neecha Bhanga if the specific classical
    conditions for it are met in the input data, don't assume it from mere conjunction).
  - Which planet's significations get filtered through which — generally the stronger
    (higher dignity, or the natural/temporal functional benefic) planet's agenda tends
    to dominate the blended expression, but say this as a tendency, not a rule.
  - Special-case conjunctions worth flagging explicitly if present in the input:
    Sun conjunctions (combustion, see F), Rahu/Ketu with any planet (the classical
    view that Rahu especially amplifies/distorts and can produce a "Grahan"-type
    (eclipse) effect on luminaries), and same-sign conjunctions of three or more
    planets (Bhavas get heavily colored by many-planet stelliums).

### F. Combustion (Asta)
A planet too close to the Sun is combust and considered to lose the ability to give its
own significations cleanly, its light "eclipsed" by solar proximity. Approximate orbs
commonly cited (verify against your source text — different classical/secondary sources
vary by 1–2°, and boundary cases should be treated as "weakened" rather than a hard
cutoff):
| Planet  | Combustion orb (direct) | Combustion orb (retrograde) |
|---------|--------------------------|-------------------------------|
| Moon    | ~12°                     | —                              |
| Mars    | ~17°                     | —                              |
| Mercury | ~14°                     | ~12°                           |
| Jupiter | ~11°                     | —                              |
| Venus   | ~10°                     | ~8°                            |
| Saturn  | ~15°                     | —                              |

Interpretive notes:
  - Mercury and Venus combust relatively often since they never stray far from the Sun;
    treat their combustion as a common, mild-to-moderate modifier, not a dramatic
    affliction, unless other factors compound it.
  - Combustion of the Moon (Amavasya-proximity) and combustion of a planet that is also
    the Lagna lord or a key yogakaraka deserve more weight in the narrative.
  - Some traditions hold combustion is cancelled/reduced when the planet is exalted,
    in its own sign, or very close to exact conjunction (0° — "Chandra grahan"-like
    total absorption) vs. wide within-orb proximity — mention this nuance if your data
    includes exact degree separation from the Sun rather than a binary combust flag.

### G. Near 0° and Near 29° (Sandhi / Junction Degrees)
- Near 0° of a sign (roughly 0°–1°): the planet is considered to have just entered
  the sign — classically described as immature or "infant" in that sign's expression;
  results tend to be weak or slow to manifest, and can carry over some flavor of the
  previous sign for a very narrow band right at 0°. If 0° also falls at a sign-element
  junction from a water sign into a fire sign (Pisces→Aries, Cancer→Leo, Scorpio→
  Sagittarius) this is additionally a Gandanta point — classically considered a
  point of karmic knot/instability, deserving specific mention if the app flags Gandanta
  degree ranges (commonly cited as roughly the last ~1° of the water sign through the
  first ~1° of the following fire sign; exact orb varies by source, so treat as
  configurable).
- Near 29°–30° of a sign ("Vridha" / old-age degree): the planet is considered to
  be in its last, most "mature"/depleted stage in that sign, often described as
  restless to move on, giving hurried or exhausted results, and generally weaker for
  sustaining that sign's promise even if otherwise well-dignified. The most commonly
  cited Gandanta-relevant set at this boundary is: end of Pisces/start of Aries, end
  of Cancer/start of Leo, end of Scorpio/start of Sagittarius — verify sign-pairs
  against your source before hardcoding, since sources differ.
- Treat both 0° and 29° conditions as "handle with narrative nuance" flags — don't let
  them override a planet's overall strong dignity and good aspects, but do mention them
  as a qualifying factor.

### H. Aspects (Drishti)
Parashari graha drishti (planetary aspect) rules:
  - Every planet aspects the house/sign 7th from its own position (opposition).
  - Mars additionally aspects the 4th and 8th from itself.
  - Jupiter additionally aspects the 5th and 9th from itself.
  - Saturn additionally aspects the 3rd and 10th from itself.
  - Rahu and Ketu are treated by many (not all) classical authorities as casting the
    same special aspects as Jupiter (5th/9th) in addition to the 7th — this is a
    later/supplementary convention rather than universally attested in BPHS itself;
    flag it as a secondary-tradition rule if your engine applies it.
  - These are full (100%) drishti in the simple Parashari model. A more granular
    "graha drishti bala" system (used in Shadbala) assigns partial aspect strength
    (roughly quarter/half/three-quarter/full) based on exact angular distance rather
    than whole-sign counting — only apply this refinement if your chart engine
    actually computes angular separation; otherwise stick to the whole-sign model
    above to avoid asserting false precision.
  - Distinguish graha drishti (planet-to-house/planet) from rashi drishti (sign-to-sign
    mutual aspect used in some predictive techniques like Sarvatobhadra) — Parashari
    natal interpretation conventionally uses graha drishti; only invoke rashi drishti if
    your app's methodology explicitly calls for it.
  - Interpret aspects as: a benefic aspect on a house/planet supports and stabilizes its
    significations; a malefic aspect (especially from Saturn, Mars, or an afflicted
    Rahu/Ketu) pressures, delays, or intensifies-through-friction the aspected
    significations, depending on further context (dignity of aspecting/aspected planet,
    whether the aspecting planet is functionally benefic for this Lagna).
  - Mutual aspect between two planets (e.g., two planets in mutual 7th-from-each-other
    houses) creates a stronger bidirectional link between their significations than a
    one-way aspect.

### I. Synthesis Priorities (when generating a combined/full reading)
When asked for a synthesized paragraph or full report rather than isolated bullet
sections, weight factors roughly in this order of narrative importance:
  1. Lagna and Lagna lord condition (sets the frame for everything else)
  2. House lordship + placement of each planet (a planet's own-house lordship
     placement usually matters more than its sign-dignity alone)
  3. Dignity (exaltation/debilitation/own sign) and combustion
  4. Conjunctions
  5. Aspects received
  6. Fine-grained degree factors (0°/29°/Gandanta/vargottama/exact exaltation degree)
Do not give the fine-grained degree factors (item 6) more narrative weight than the
structural factors (items 1–3) unless the chart data specifically flags an extreme case
(e.g., exact-degree debilitation with no cancellation, or a planet at 29°59').

OUTPUT FORMAT
- When asked for a single section (e.g., "interpret Mars in the 10th house"), return
  2–5 sentences: one sentence of classical grounding (why this matters per Parashari
  principle), then specific interpretation for this chart's actual placement, then any
  qualifying nuance (aspect/conjunction/degree factor) that changes the baseline
  reading.
- When asked for a full chart synthesis, organize under clear headers matching the
  synthesis priority order in section I, close with a short "how these factors interact"
  paragraph rather than restating each section.
- Never use vague filler ("this indicates great potential in many areas of life")
  without tying it to a specific classical reason.
- Always name the classical concept you're invoking in plain language the first time you
  use it in a response (e.g., "this is what's called combustion in Vedic astrology"),
  so the app's end users who aren't jyotish specialists can follow the reasoning.`;

const INTERPRETATION2_INPUT_SCHEMA = `{
  "lagna": { "sign": "Leo", "degree": 14.32 },
  "planets": {
    "Sun": {
      "sign": "Virgo", "degree": 8.5, "house": 2,
      "nakshatra": "Hasta", "pada": 2,
      "retrograde": false,
      "dignity": "neutral",
      "combust": false,
      "conjunct_with": [],
      "aspected_by": ["Saturn"]
    },
    "Mars": {
      "sign": "Capricorn", "degree": 27.9, "house": 6,
      "nakshatra": "Dhanishta", "pada": 3,
      "retrograde": false,
      "dignity": "exalted_near_exact",
      "combust": false,
      "conjunct_with": ["Saturn"],
      "aspected_by": []
    }
  }
}`;

const INTERPRETATION2_CALL_STRUCTURE = `
Rather than one giant call per chart, consider separate calls (or clearly separated
sections in one call) for: Lagna, each of the 9 planets x house, each of the 9 planets x
sign, conjunctions (one block per conjunction cluster), aspects (one block per
significant aspect), and a final synthesis call that receives the outputs of the prior
calls as context rather than re-deriving everything from raw chart data. This keeps
each generation focused and makes it easier to cache/regenerate a single section without
paying for the whole chart again.
`;

const INTERPRETATION2_FUTURE_TOPICS = [
  ['Nakshatra and pada of each planet', 'Parashari interpretation is incomplete without the nakshatra lord and its condition; many apps that only do sign+house miss this.'],
  ['Argala (intervention) and Bhavat Bhavam (house-from-house)', 'Classical refinements worth a later phase, not essential for v1.'],
  ['Functional benefic/malefic by Lagna', 'Which planets are auspicious for this ascendant specifically, not universally — this materially changes how a conjunction or aspect should be framed and is easy to compute once Lagna is known.'],
  ['Retrograde planets and Vargottama', 'Both listed above, easy to compute, high interpretive value.'],
  ['Planetary war (Graha Yuddha)', 'When two planets (excluding Sun/Moon/nodes) are within ~1° of each other in the same sign, classical texts treat this as a distinct condition from ordinary conjunction, with a winner/loser by degree/other criteria — worth a dedicated rule if the engine can detect it.'],
  ['Argala/Shadbala-lite strength score', 'If a single "strength" number per planet is wanted rather than only narrative dignity, Shadbala is the classical system, but it is computationally heavy (six sub-strengths); a simplified proxy (dignity + house type + combustion + retrograde + aspect count) is a reasonable v1 stand-in — just do not call it "Shadbala" in user-facing text unless the real six-fold calculation is implemented.']
];

// --- Rule taxonomy workbook (parashari_rule_tabulation.xlsx) ---

// Sheet "Rule Detail": #, Category, Subcategory, Rule Count, Type, Notes
const RULE_TABULATION_DETAIL = [
  [1, '1. Lagna (Ascendant)', 'Lagna sign nature (temperament by rising sign)', 12, 'Hand-authored', 'One per rashi'],
  [2, '1. Lagna (Ascendant)', 'Lagna lord placed in house 1-12', 12, 'Hand-authored', "Lord's placement colors the whole chart, not just one house"],
  [3, '1. Lagna (Ascendant)', 'Lagna lord dignity', 0, 'Reused', 'Pulls from Dignity/Strength module (Category 4)'],
  [4, '1. Lagna (Ascendant)', 'Planets conjunct/aspecting Lagna', 0, 'Reused', 'Pulls from Conjunction (Cat. 7) and Aspect (Cat. 8) modules'],
  [5, '1. Lagna (Ascendant)', 'Lagna degree condition (0°/29°/Gandanta)', 0, 'Reused', 'Pulls from Degree-Sensitive module (Category 6)'],
  [6, '2. Planets in Houses', 'Base planet-in-house significations', 108, 'Hand-authored', '9 grahas x 12 houses'],
  [7, '2. Planets in Houses', 'House-type modifier (Kendra/Trikona/Upachaya/Dusthana)', 4, 'Hand-authored', 'Applied on top of the 108 base entries'],
  [8, '2. Planets in Houses', 'Own-house-lordship bonus', 1, 'Hand-authored', 'Amplifier rule when planet occupies a house it rules'],
  [9, '3. Planets in Signs', 'Base planet-in-sign temperament', 108, 'Hand-authored', '9 grahas x 12 rashis'],
  [10, '3. Planets in Signs', 'Sign-lord-condition modifier', 1, 'Hand-authored', '"Borrowed instability" if the sign lord is afflicted'],
  [11, '4. Dignity / Strength', 'Dignity-state narrative templates', 11, 'Hand-authored', 'Deep-exalted, exalted, moolatrikona, own, great-friend, friend, neutral, enemy, great-enemy, debilitated, deep-debilitated'],
  [12, '4. Dignity / Strength', 'Planet-specific flavor overlay on dignity', 9, 'Hand-authored', 'One per graha — e.g. "exalted" reads differently for Sun vs Saturn'],
  [13, '4. Dignity / Strength', 'Retrograde effect', 5, 'Hand-authored', 'Mars, Mercury, Jupiter, Venus, Saturn — the planets that actually retrograde'],
  [14, '4. Dignity / Strength', 'Vargottama (same sign Rasi + Navamsa)', 1, 'Hand-authored', 'Stabilizer rule'],
  [15, '4. Dignity / Strength', 'Dig Bala (directional strength)', 4, 'Hand-authored', '1st house (Jup/Merc), 4th (Moon/Venus), 7th (Saturn), 10th (Sun/Mars)'],
  [16, '5. Combustion (Asta)', 'Orb threshold definitions', 8, 'Hand-authored', '6 combustible planets; Mercury & Venus need direct AND retrograde thresholds'],
  [17, '5. Combustion (Asta)', 'Severity tiers (deep/moderate/borderline)', 9, 'Hand-authored', '3 generic tiers + 6 planet-specific flavor notes'],
  [18, '5. Combustion (Asta)', 'Exception/cancellation conditions', 3, 'Hand-authored', 'Own sign, exalted, exact-conjunction "absorption"'],
  [19, '6. Degree-Sensitive Conditions (0°/29°/Gandanta)', 'Near-0° ("infant" placement) — general', 1, 'Hand-authored', ''],
  [20, '6. Degree-Sensitive Conditions (0°/29°/Gandanta)', 'Gandanta at 0° water→fire junctions', 3, 'Hand-authored', 'Pisces→Aries, Cancer→Leo, Scorpio→Sagittarius'],
  [21, '6. Degree-Sensitive Conditions (0°/29°/Gandanta)', 'Near-29° ("Vridha"/old-age placement) — general', 1, 'Hand-authored', ''],
  [22, '6. Degree-Sensitive Conditions (0°/29°/Gandanta)', 'Gandanta at 29° fire→water junctions', 3, 'Hand-authored', 'Mirror-side junctions of the same three pairs'],
  [23, '6. Degree-Sensitive Conditions (0°/29°/Gandanta)', 'Exact-degree gradient near exalt./debil. point', 2, 'Hand-authored', 'One shape for approaching exact exaltation, one for approaching exact debilitation'],
  [24, '7. Conjunction (Yuti)', 'Two-planet conjunction pairs', 36, 'Hand-authored', 'C(9,2) — every possible pairing among the 9 grahas'],
  [25, '7. Conjunction (Yuti)', 'Multi-planet stellium (3+ in one sign)', 2, 'Hand-authored', 'Generic escalation rules, not enumerated per combination'],
  [26, '7. Conjunction (Yuti)', 'Graha Yuddha (planetary war, within ~1°)', 11, 'Hand-authored', '10 eligible pairs (Mars/Mercury/Jupiter/Venus/Saturn only) + 1 winner/loser tie-break rule'],
  [27, '8. Aspects (Drishti)', 'Universal 7th-house aspect', 1, 'Hand-authored', 'Applies to all 9 grahas'],
  [28, '8. Aspects (Drishti)', 'Special aspects', 8, 'Hand-authored', 'Mars 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th, Rahu/Ketu 5th/9th (secondary tradition)'],
  [29, '8. Aspects (Drishti)', 'Mutual aspect (bidirectional link)', 1, 'Hand-authored', 'When two planets aspect each other'],
  [30, '8. Aspects (Drishti)', 'Graha Drishti Bala — partial aspect strength', 4, 'Optional', 'Only if chart engine gives angular separation, not just whole-sign counting'],
  [31, '9. Functional Benefic/Malefic Classification', 'Lordship-based classification logic', 1, 'Hand-authored', 'Trikona lord→benefic, dusthana-only lord→malefic, kendra-only lord→neutral, trikona+kendra same lord→yogakaraka'],
  [32, '9. Functional Benefic/Malefic Classification', 'Resulting lookup table', 84, 'Generated', '12 Lagna signs x 7 classical grahas (Rahu/Ketu handled separately)'],
  [33, '10. Nakshatra (base tier)', 'Nakshatra character/lord significance', 27, 'Hand-authored', 'One per nakshatra; nakshatra-lord dignity reuses Dignity module'],
  [34, '11. Neecha Bhanga (Debilitation Cancellation)', 'Classical cancellation conditions', 5, 'Hand-authored', 'Verify against source text — cited inconsistently across secondary sources'],
  [35, 'Phase 2 — Optional: Nakshatra padas', 'Quarter-level flavor per nakshatra', 108, 'Optional (Phase 2)', '27 nakshatras x 4 padas — meaningful precision, but heavy writing load'],
  [36, 'Phase 2 — Optional: Pancha Mahapurusha Yogas', 'Five great-person yogas (Ruchaka/Bhadra/Hamsa/Malavya/Sasa)', 5, 'Optional (Phase 2)', 'Mars/Merc/Jup/Venus/Saturn in own or exaltation sign in a kendra from Lagna — cheap, high value'],
  [37, 'Phase 2 — Optional: Argala & Bhavat Bhavam', 'Intervention (Argala) and house-from-house rules', 18, 'Optional (Phase 2)', 'Genuine classical refinements; adds real complexity, usually v2'],
  [38, 'Phase 2 — Optional: Shadbala-lite scoring', 'Composite numeric strength formula', 1, 'Optional (Phase 2)', 'Combines dignity + house-type + combustion + retrograde + aspect-count into one score']
];

// Sheet "Category Summary": Category, Rule Count, Core/Optional
const RULE_TABULATION_SUMMARY = [
  ['1. Lagna (Ascendant)', 24, 'Core'],
  ['2. Planets in Houses', 113, 'Core'],
  ['3. Planets in Signs', 109, 'Core'],
  ['4. Dignity / Strength', 30, 'Core'],
  ['5. Combustion (Asta)', 20, 'Core'],
  ['6. Degree-Sensitive Conditions (0°/29°/Gandanta)', 10, 'Core'],
  ['7. Conjunction (Yuti)', 49, 'Core'],
  ['8. Aspects (Drishti)', 14, 'Core'],
  ['9. Functional Benefic/Malefic Classification', 85, 'Core'],
  ['10. Nakshatra (base tier)', 27, 'Core'],
  ['11. Neecha Bhanga (Debilitation Cancellation)', 5, 'Core'],
  ['Phase 2 — Optional: Nakshatra padas', 108, 'Optional (Phase 2)'],
  ['Phase 2 — Optional: Pancha Mahapurusha Yogas', 5, 'Optional (Phase 2)'],
  ['Phase 2 — Optional: Argala & Bhavat Bhavam', 18, 'Optional (Phase 2)'],
  ['Phase 2 — Optional: Shadbala-lite scoring', 1, 'Optional (Phase 2)']
];

const RULE_TABULATION_TOTALS = {
  core: 486,
  optionalPhase2: 132,
  grandTotal: 618,
  note: "Category 9's 84-row lookup table is machine-generated by one classification algorithm, not hand-written prose — it is included in the Core total above as rule output, not as 84 separate authored texts."
};

const RULE_TABULATION_READ_ME = `
Parashari Astrology App — Rule Taxonomy Workbook

This workbook tabulates the rule taxonomy discussed in the accompanying
interpretation-prompt document (parashari_interpretation_prompt.md), for
use as a build checklist / content-tracking sheet for the app's rule
engine.

Rule Detail: every subcategory, its rule count, and whether it is
Hand-authored, Generated (produced by an algorithm rather than written),
Reused (pulled from another module, adds 0 new rules), or Optional
(Phase 2, not required for the core build).

Category Summary: rule counts rolled up per category, with Core and
Optional Phase 2 subtotals and a grand total.

Important caveat: these counts reflect an engineering decision about how
finely to split classical Parashari principles into discrete, storable
rule units — they are not a figure quoted from Brihat Parashara Hora
Shastra or any other classical text. The category structure and
arithmetic are solid; the underlying degree values feeding a few rules
(combustion orbs, exact exaltation/debilitation degrees, Gandanta
boundaries, Neecha Bhanga conditions) were drawn from secondary
practitioner sources during research and should be verified against
whichever classical edition/translation is treated as canonical before
being hardcoded into the app.
`;

if (typeof module !== 'undefined') {
  module.exports = {
    INTERPRETATION2_INTRO, INTERPRETATION2_ACCURACY_NOTE, INTERPRETATION2_SYSTEM_PROMPT,
    INTERPRETATION2_INPUT_SCHEMA, INTERPRETATION2_CALL_STRUCTURE, INTERPRETATION2_FUTURE_TOPICS,
    RULE_TABULATION_DETAIL, RULE_TABULATION_SUMMARY, RULE_TABULATION_TOTALS, RULE_TABULATION_READ_ME
  };
}
