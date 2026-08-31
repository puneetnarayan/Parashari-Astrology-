// Ties birthChart.js (per-partner chart generation) + ashtakootRules.js +
// mangalDoshaRules.js together into one Kundali Matching (Guna Milan)
// result for a boy/girl pair.

const KUNDALI_MATCHING_LOGIC_TEXT = [
  ['Kundali Matching — Logic and Sequence'],
  [''],
  ['1. Generate a full birth chart for each partner independently (birthChart.js — same Swiss-Ephemeris-first engine used everywhere else in this app).'],
  ['2. Read each partner\'s Moon sign and Moon nakshatra from their chart\'s Moon placement — Ashtakoot Guna Milan is traditionally computed from the MOON alone (not the Ascendant), since the Moon represents the mind in Vedic astrology.'],
  ['3. Score all 8 kootas (ashtakootRules.js) from those two Moon placements, sum to a total out of 36, and grade the total against the classical bands (18+ acceptable, 24+ good, 32+ excellent).'],
  ['4. Independently check Mangal Dosha (mangalDoshaRules.js) for each partner from their own Ascendant-relative Mars house, and compare.'],
  [''],
  ['Caveat: this is Ashtakoot matching only — some traditions (especially South Indian) weigh Rajju and Vedha dosha, or a 10-koota Dasakoot system, in addition; those are not computed here.']
];

const GUNA_TOTAL_BANDS = [
  { min: 32, label: 'Excellent Match' },
  { min: 24, label: 'Good Match' },
  { min: 18, label: 'Acceptable Match' },
  { min: 0, label: 'Not Recommended' }
];

function gradeTotal(total) {
  return GUNA_TOTAL_BANDS.find(b => total >= b.min).label;
}

// boyChart/girlChart: { planets, ascendant } from generateBirthChart().
function matchKundalis(boyChart, girlChart) {
  const boyMoon = boyChart.planets.find(p => p.name === 'Moon');
  const girlMoon = girlChart.planets.find(p => p.name === 'Moon');
  const boyNak = nakshatraFromLongitude(boyMoon.longitude);
  const girlNak = nakshatraFromLongitude(girlMoon.longitude);
  const boyNakIndex = NAKSHATRAS.indexOf(boyNak.name);
  const girlNakIndex = NAKSHATRAS.indexOf(girlNak.name);

  const kootas = [
    scoreVarna(boyMoon.sign, girlMoon.sign),
    scoreVashya(boyMoon.sign, girlMoon.sign),
    scoreTara(boyNakIndex, girlNakIndex, boyNak.name, girlNak.name),
    scoreYoni(boyNak.name, girlNak.name),
    scoreGrahaMaitri(boyMoon.sign, girlMoon.sign),
    scoreGana(boyNak.name, girlNak.name),
    scoreBhakoot(boyMoon.sign, girlMoon.sign),
    scoreNadi(boyNak.name, girlNak.name)
  ];

  const total = kootas.reduce((sum, k) => sum + k.score, 0);
  const mangalDosha = compareMangalDosha(boyChart.planets, boyChart.ascendant, girlChart.planets, girlChart.ascendant);

  return {
    boyMoon: { sign: boyMoon.sign, nakshatra: boyNak.name },
    girlMoon: { sign: girlMoon.sign, nakshatra: girlNak.name },
    kootas,
    total,
    maxTotal: 36,
    grade: gradeTotal(total),
    nadiDosha: kootas.find(k => k.koota === 'Nadi').score === 0,
    mangalDosha
  };
}

if (typeof module !== 'undefined') {
  module.exports = { KUNDALI_MATCHING_LOGIC_TEXT, GUNA_TOTAL_BANDS, gradeTotal, matchKundalis };
}
