// Structured rule metadata for the Ashtakvarga Predictions engine — kept
// separate from calculation/interpretation code per the spec's explicit
// requirement not to hard-code interpretations directly into UI components.
// Every rule this engine applies is listed here with its source/tradition
// and reliability classification, so nothing is silently presented as
// universally-accepted classical doctrine.
//
// NOTATION CONVENTION used throughout this app's Ashtakavarga (declared
// once, per spec section 37.15, applies to both new tabs): BINDU convention
// — each sign accumulates 0-8 points, one per contributor whose classical
// rule includes that sign counted from its own position. Higher bindus =
// more contributors support that sign. This app does not use, and never
// displays, the alternate "Rekha" (8-minus-bindu) convention some South
// Indian texts use — a bare 0 here always means zero contributors, never
// "maximum" under a Rekha reading.

const ASHTAKVARGA_RULE_DATABASE = [
  {
    id: 'AV_RULE_001', name: 'Bindu Threshold Bands', category: 'Bindu Threshold', technique: 'SAV/BAV',
    source: 'Widely repeated in modern Parashari practice (e.g. B.V. Raman\'s "Ashtakavarga System"); exact numeric cutoffs are not uniform across texts.',
    reliability: 'Traditional / Later',
    rule: 'SAV per house: <25 very weak, 25-27 weak, 28-32 average, 33-36 strong, >36 very strong (out of a 12-house total of 337 for a maximum 8-per-sign chart; this app compares each house against the chart\'s OWN average instead of these fixed absolute cutoffs, since the fixed-cutoff convention varies by source — see caveat on the Dashboard).'
  },
  {
    id: 'AV_RULE_002', name: 'Trikona Shodhana (Trine Reduction)', category: 'Trikona Shodhana', technique: 'Shodhana',
    source: 'Brihat Parashara Hora Shastra, Ashtakavarga chapter; standard across BAV reduction methodology.',
    reliability: 'Classical / Textually Supported',
    rule: 'For each planet\'s Bhinnashtakavarga, group signs into 4 trikona (trine) sets — {Aries,Leo,Sagittarius}, {Taurus,Virgo,Capricorn}, {Gemini,Libra,Aquarius}, {Cancer,Scorpio,Pisces}. Within each set, reduce all three bindu values down to the LOWEST value in that set.'
  },
  {
    id: 'AV_RULE_003', name: 'Ekadhipatya Shodhana (Same-Lord Reduction)', category: 'Ekadhipatya Shodhana', technique: 'Shodhana',
    source: 'Brihat Parashara Hora Shastra, Ashtakavarga chapter; applied after Trikona Shodhana.',
    reliability: 'Classical / Textually Supported',
    rule: 'For each planet owning TWO signs (Mars: Aries/Scorpio, Venus: Taurus/Libra, Mercury: Gemini/Virgo, Jupiter: Sagittarius/Pisces, Saturn: Capricorn/Aquarius — Sun and Moon are exempt, owning one sign each), reduce the higher of the pair\'s (already Trikona-reduced) bindu values down to match the lower.'
  },
  {
    id: 'AV_RULE_004', name: 'Shodhya Pinda (sum of reduced bindus)', category: 'Pinda', technique: 'Pinda',
    source: 'Derived directly from AV_RULE_002 + AV_RULE_003\'s output; the additional Rasi-Pinda/Graha-Pinda multiplier layer some texts add on top of this sum is NOT implemented — see AV_RULE_005.',
    reliability: 'Classical / Textually Supported (for the reduction itself); this app\'s own choice to stop at the unweighted sum',
    rule: 'Shodhya Pinda for a planet = sum, across all 12 signs, of that planet\'s Trikona+Ekadhipatya-reduced (Shodhita) Bhinnashtakavarga bindus. Used here only for RELATIVE ranking among the 7 planets\' purified support, not as an absolute strength number.'
  },
  {
    id: 'AV_RULE_005', name: 'Rasi Pinda / Graha Pinda (multiplier-weighted)', category: 'Pinda', technique: 'Pinda',
    source: 'Cited in several secondary Ashtakavarga compilations, but the exact per-sign ("Rasi Pinda") and per-planet ("Graha Pinda") multiplier constants are not consistently reproduced across sources this app\'s author could cross-verify.',
    reliability: 'Unverified / Do Not Use',
    rule: 'NOT IMPLEMENTED. Rather than invent or guess the multiplier constants, this app stops at the unweighted Shodhya Pinda (AV_RULE_004) and labels the multiplier-weighted refinement as unverified, per this engine\'s own rule (do not invent classical constants).'
  },
  {
    id: 'AV_RULE_006', name: 'House SAV vs. Chart Average', category: 'SAV', technique: 'SAV',
    source: 'General Ashtakavarga interpretive practice — comparing a house\'s SAV against the chart\'s own mean SAV (rather than a fixed universal cutoff) is a widely used practitioner technique.',
    reliability: 'Practitioner Technique',
    rule: 'A house is "above average" if its SAV exceeds the chart\'s mean SAV across all 12 houses, "below average" if under it — this is a RELATIVE, chart-specific comparison, not an absolute classical threshold.'
  },
  {
    id: 'AV_RULE_007', name: 'BAV + SAV Interaction Matrix', category: 'Special Rules', technique: 'BAV+SAV',
    source: 'This app\'s own interpretive synthesis pattern (spec-directed), not a single classical citation — combines two independently classical inputs (a planet\'s own BAV in a sign, and that sign\'s SAV) into one read.',
    reliability: 'Practitioner Technique',
    rule: 'High SAV + high relevant planetary BAV = stronger combined support. High SAV + low BAV = general house support with weaker planet-specific support. Low SAV + high BAV = planet-specific support in a weaker overall environment. Low SAV + low BAV = comparatively weak support.'
  },
  {
    id: 'AV_RULE_008', name: 'Transit BAV/SAV Assessment', category: 'Transit', technique: 'Transit',
    source: 'Standard modern Ashtakavarga transit (Gochara) practice — checking the transiting planet\'s own BAV bindus in the sign it is transiting, alongside that sign\'s SAV.',
    reliability: 'Traditional / Later',
    rule: 'A transiting planet\'s bindus (0-8) in its own currently-transited sign, combined with that sign\'s SAV, gives a first-order read on how well-supported the transit is — always subject to the planet\'s natal condition, house lordship, dasha, and other transit factors (never used standalone).'
  },
  {
    id: 'AV_RULE_009', name: 'Life-Area House Groupings', category: 'Wealth', technique: 'House Grouping',
    source: 'Standard Parashari bhava karakatva (already used throughout this app\'s houseThemes.js), combined here with the relevant Ashtakavarga houses per widely taught practitioner convention (e.g. 2-11 for wealth, 10-6-2-11-9 for career).',
    reliability: 'Traditional / Later',
    rule: 'Wealth: 2nd/11th (primary), 5th/9th (supporting), 8th/12th (retention/expenditure). Career: 10th/6th/2nd/11th/9th. Property: 4th/2nd/11th/12th. Marriage: 7th/2nd/11th. Children: 5th/2nd/11th. Health: 1st/6th/8th/12th. Education: 4th/5th/9th.'
  }
];

const ASHTAKVARGA_PREDICTIONS_LOGIC_TEXT = [
  ['Ashtakvarga Predictions — Logic and Sequence'],
  [''],
  ['1. NOTATION: this app uses the BINDU convention throughout (0-8 per sign, higher = more support) — never the alternate Rekha convention. See ASHTAKVARGA_RULE_DATABASE above for the full rule list with source/tradition/reliability for every technique this engine applies.'],
  ['2. NO RECALCULATION: this module consumes the EXISTING computeAshtakvarga() output (js/ashtakvarga.js\'s bav/sav) as-is — it does not recompute BAV or SAV from planetary positions itself.'],
  ['3. Every conclusion is built from actual computed values (never hard-coded example numbers) and is labeled with its evidence, the applicable rule/source, and — per the spec\'s own explicit warning — is never presented as a guaranteed event. High bindus indicate support, not certainty; low bindus indicate comparative weakness, not disaster.'],
  ['']
];

if (typeof module !== 'undefined') {
  module.exports = { ASHTAKVARGA_RULE_DATABASE, ASHTAKVARGA_PREDICTIONS_LOGIC_TEXT };
}
