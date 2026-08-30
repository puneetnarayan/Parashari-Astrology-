// Finer-grained classical dignity data: exact exaltation/debilitation
// degrees (the "deep"/"exact" point within the exaltation or debilitation
// sign) and Moolatrikona ranges (a sign-and-degree-range dignity, almost as
// strong as exaltation, distinct from a planet's plain own sign). Extends
// planetTraits.js's simple Exalted/Debilitated/Own-Sign/Neutral check with
// this extra classical detail.

const DIGNITY_DETAILS_LOGIC_TEXT = [
  ['Dignity Details Reference — Logic and Sequence'],
  [''],
  ['1. Exact exaltation/debilitation degree: within a planet\'s exaltation sign, one specific degree is its point of MAXIMUM exaltation strength (and, mirrored in the debilitation sign, its point of maximum weakness) — a placement close to that exact degree ("deep" exaltation/debilitation) is classically stronger/weaker than one merely elsewhere in the same sign.'],
  ['2. Moolatrikona: a further classical dignity, a specific degree-range (usually, but not always, inside the planet\'s own sign) where the planet is considered almost as strong as when exalted — distinct from and stronger than an ordinary own-sign placement outside that range.'],
  ['3. Dignity tiers used by this app, strongest to weakest: Exalted > Moolatrikona > Own Sign > Neutral > Debilitated.'],
  [''],
  ['Caveat: Rahu/Ketu have no classically settled Moolatrikona and their exaltation/debilitation degrees are convention-dependent (see planetTraits.js) — this app applies exact-degree "deep" dignity checks only to the 7 classical planets.']
];

// Exact degree-within-sign of maximum exaltation strength (mirrored for debilitation).
const EXALTATION_DEGREE = { Sun: 10, Moon: 3, Mars: 28, Mercury: 15, Jupiter: 5, Venus: 27, Saturn: 20 };

const MOOLATRIKONA = {
  Sun: { sign: 'Leo', start: 0, end: 20 },
  Moon: { sign: 'Taurus', start: 4, end: 30 },
  Mars: { sign: 'Aries', start: 0, end: 12 },
  Mercury: { sign: 'Virgo', start: 16, end: 20 },
  Jupiter: { sign: 'Sagittarius', start: 0, end: 10 },
  Venus: { sign: 'Libra', start: 0, end: 15 },
  Saturn: { sign: 'Aquarius', start: 0, end: 20 }
};

// Fuller dignity check than planetTraits.js's dignityOf(): also detects
// Moolatrikona and flags a "deep" exaltation/debilitation when the placement
// is within 1 degree of the exact exaltation/debilitation point.
function detailedDignity(planetName, sign, degreeInSign) {
  if (EXALTATION_SIGN[planetName] === sign) {
    const exactDeg = EXALTATION_DEGREE[planetName];
    const isDeep = exactDeg !== undefined && typeof degreeInSign === 'number' && Math.abs(degreeInSign - exactDeg) <= 1;
    return {
      tier: 'Exalted',
      text: exactDeg !== undefined
        ? `Exalted in ${sign} (exact exaltation point: ${exactDeg}°).${isDeep ? ' This placement is within 1° of that exact point — a "deep" exaltation, classically considered maximally strong.' : ''}`
        : `Exalted in ${sign}.`
    };
  }
  if (DEBILITATION_SIGN[planetName] === sign) {
    const exactDeg = EXALTATION_DEGREE[planetName];
    const isDeep = exactDeg !== undefined && typeof degreeInSign === 'number' && Math.abs(degreeInSign - exactDeg) <= 1;
    return {
      tier: 'Debilitated',
      text: exactDeg !== undefined
        ? `Debilitated in ${sign} (exact debilitation point: ${exactDeg}°).${isDeep ? ' This placement is within 1° of that exact point — a "deep" debilitation, classically considered maximally weak (though classical Neecha Bhanga cancellation rules, not computed by this app, can still rescue it).' : ''}`
        : `Debilitated in ${sign}.`
    };
  }
  const mt = MOOLATRIKONA[planetName];
  if (mt && mt.sign === sign && typeof degreeInSign === 'number' && degreeInSign >= mt.start && degreeInSign < mt.end) {
    return { tier: 'Moolatrikona', text: `In Moolatrikona (${mt.sign} ${mt.start}°-${mt.end}°) — nearly as strong as exaltation, one of this planet's most favorable placements.` };
  }
  if (SIGN_LORD[sign] === planetName) {
    return { tier: 'Own Sign', text: `In its own sign (${sign}) — comfortable, stable, and reliably strong.` };
  }
  return { tier: 'Neutral', text: `Ordinary sign dignity in ${sign} — neither specially strengthened nor weakened by sign placement alone.` };
}

if (typeof module !== 'undefined') {
  module.exports = { DIGNITY_DETAILS_LOGIC_TEXT, EXALTATION_DEGREE, MOOLATRIKONA, detailedDignity };
}
