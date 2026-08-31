// Classical interpretation rules for the D1 Ashtakvarga (Sarvashtakavarga and
// Bhinnashtakavarga) results — kept in this separate file so the
// interpretation THRESHOLDS/TEXT can be revised independently of the
// Ashtakvarga computation itself (ashtakvarga.js).

const ASHTAKVARGA_INTERPRETATION_LOGIC_TEXT = [
  ['Ashtakvarga Interpretation — Logic and Sequence'],
  [''],
  ['1. Sarvashtakavarga (SAV) per house is graded against the classical rule-of-thumb thresholds: 30+ bindus = excellent, 25-29 = good, 20-24 = average, below 20 = weak — the average across all 12 houses is always 337/12 ≈ 28, so 25+ is the commonly used "above average" cutoff.'],
  ['2. A house graded excellent/good is considered classically favorable for the significations of that house (its natural karakatva) during its dasha/transit activation; a house graded weak is considered to need extra support (a strong dasha lord or benefic transit) before its matters prosper.'],
  ['3. Bhinnashtakavarga (BAV): a planet occupying a sign that carries FEWER than 5 of its own bindus there is classically considered to give weaker results from that placement (transit and, by extension, general placement strength); 5 or more bindus is considered a favorable placement for that planet.'],
  [''],
  ['Caveat: these are the commonly taught headline rules-of-thumb (as in Ashtakvarga Rekha Chintanam-derived practice) — full classical Ashtakvarga interpretation also applies trikona and ekadhipatya bindu-reduction (Samudaya/Sodhana) before final judgment, which this app does not yet compute; treat this section as a first-pass reading, not a final verdict.']
];

const SAV_STRENGTH_THRESHOLDS = [
  { min: 30, label: 'Excellent', text: 'well above average — classically strong support for this house\'s significations.' },
  { min: 25, label: 'Good', text: 'above the 337/12 ≈ 28-bindu average — favorable support for this house\'s significations.' },
  { min: 20, label: 'Average', text: 'below average — mixed, moderate support for this house\'s significations.' },
  { min: 0, label: 'Weak', text: 'well below average — this house classically needs a strong dasha lord or benefic transit before its significations prosper.' }
];

function interpretSavForHouse(score) {
  const tier = SAV_STRENGTH_THRESHOLDS.find(t => score >= t.min);
  return { label: tier.label, text: `${score} bindus — ${tier.text}` };
}

// A planet's own Bhinnashtakavarga bindu count IN THE SIGN IT OCCUPIES —
// the classical "is this a strong placement for this planet" reading.
function interpretPlanetOwnBav(planetName, score) {
  if (score >= 5) {
    return { label: 'Favorable', text: `${score} of its own bindus in its occupied sign — a classically favorable placement for ${planetName}.` };
  }
  return { label: 'Unfavorable', text: `${score} of its own bindus in its occupied sign — below the classical 5-bindu threshold, a weaker placement for ${planetName}.` };
}

// planets: [{ name, sign }] (from the D1 birth chart). av: computeAshtakvarga() result.
// ascSignIndex: Ascendant's sign index (for house numbering).
// Returns { houses: [{house, score, label, text}], planets: [{name, sign, house, score, label, text}] }.
function generateAshtakvargaInterpretation(av, planets, ascSignIndex) {
  const houses = [];
  for (let signIndex = 0; signIndex < 12; signIndex++) {
    const house = wholeSignHouseOf(signIndex, ascSignIndex);
    const score = av.sav[signIndex];
    const { label, text } = interpretSavForHouse(score);
    houses[house - 1] = { house, score, label, text };
  }

  const planetInterpretations = AV_PLANETS.map(name => {
    const planet = planets.find(p => p.name === name);
    if (!planet) return null;
    const signIndex = SIGNS.indexOf(planet.sign);
    const score = av.bav[name][signIndex];
    const house = wholeSignHouseOf(signIndex, ascSignIndex);
    const { label, text } = interpretPlanetOwnBav(name, score);
    return { name, sign: planet.sign, house, score, label, text };
  }).filter(Boolean);

  return { houses, planets: planetInterpretations };
}

if (typeof module !== 'undefined') {
  module.exports = {
    ASHTAKVARGA_INTERPRETATION_LOGIC_TEXT, SAV_STRENGTH_THRESHOLDS,
    interpretSavForHouse, interpretPlanetOwnBav, generateAshtakvargaInterpretation
  };
}
