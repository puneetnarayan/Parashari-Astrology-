// Classical interpretation text for a COMBUST planet (within its orb of the
// Sun — see combustion.js for the orb table itself). One entry per planet,
// since the classical severity and flavor of combustion differs
// significantly by planet.

const COMBUSTION_INTERPRETATIONS_LOGIC_TEXT = [
  ['Combustion Interpretation — Logic and Sequence'],
  [''],
  ['1. A combust planet is classically considered to have its own significations "overpowered" or obscured by the Sun\'s glare — its results are delayed, diminished in visible effect, or expressed in a more Sun-colored (ego-driven, authority-mediated) way, until it separates from the Sun by transit/progression.'],
  ['2. Severity varies by planet: Moon combustion (rare, occurring only near new moon) is classically considered one of the more serious combustions, since it directly afflicts the mind; Mercury combustion is extremely common (Mercury is never far from the Sun) and is usually treated as comparatively mild.'],
  [''],
  ['Caveat: this is the general classical reading of combustion alone — the planet\'s own strength (exaltation/dignity), its house lordship, and aspects upon it can substantially offset or aggravate this effect, none of which is factored into this specific text.']
];

const COMBUSTION_INTERPRETATIONS = {
  Moon: 'A combust Moon (occurring only very close to New Moon) is classically one of the more serious combustions — the mind and emotions can feel unsettled, indecisive, or overshadowed by others\' will, and relations with the mother or general public standing may need extra attention during periods this placement is activated.',
  Mars: 'A combust Mars can mean courage and assertiveness are present but not freely expressed — energy may turn inward as frustration or suppressed anger rather than direct action, and initiatives (or disputes with siblings) may need an external push to get moving.',
  Mercury: 'A combust Mercury is very common (Mercury never strays far from the Sun) and is usually mild — intellect and communication can feel temporarily less sharp or confident, decisions delayed, but this rarely causes lasting difficulty and often resolves as Mercury separates from the Sun.',
  Jupiter: 'A combust Jupiter can dim the native\'s natural optimism, wisdom, or sense of fortune for a time — guidance from teachers/mentors (or one\'s own judgment) may feel less trustworthy or less visible, though the underlying wisdom is not lost, only temporarily eclipsed.',
  Venus: 'A combust Venus can suppress the outward expression of love, pleasure, and aesthetic enjoyment — relationships or creative/material comforts may feel muted or complicated for a time, with affection harder to express or receive openly.',
  Saturn: 'A combust Saturn intensifies feelings of restriction or delay — discipline and endurance are still present, but the native may feel unsupported or invisible in the very areas (career, long-term effort) where patience is most needed.'
};

// Sun and the nodes are excluded: the Sun cannot be combust against itself,
// and Rahu/Ketu are traditionally excluded from combustion analysis (see
// combustion.js).
function interpretCombustion(planetName) {
  return COMBUSTION_INTERPRETATIONS[planetName] || null;
}

if (typeof module !== 'undefined') {
  module.exports = { COMBUSTION_INTERPRETATIONS_LOGIC_TEXT, COMBUSTION_INTERPRETATIONS, interpretCombustion };
}
