// Combines planetTraits.js + signTraits.js + houseThemes.js +
// dignityDetails.js + combustionInterpretations.js +
// retrogradeInterpretations.js + lagnaInterpretations.js into the actual
// interpretation text shown in the Interpretations tab. "Planet in Sign" and
// "Planet in House" cover EVERY possible planet/sign and planet/house
// combination (9x12 = 108 each) by RULE — combining each planet's fixed
// significations with the placement's fixed traits/theme, plus a full
// dignity check (exalted/deep-exalted/moolatrikona/own-sign/debilitated) for
// signs — rather than 216 individually hand-written paragraphs. Lagna (only
// 12 possible signs) is instead hand-composed per sign, in
// lagnaInterpretations.js, since it is the single most consulted placement.

const INTERPRETATION_ENGINE_LOGIC_TEXT = [
  ['Interpretation Engine — Logic and Sequence'],
  [''],
  ['1. Lagna interpretation: a direct lookup of the Ascendant\'s sign against the 12 hand-composed entries in lagnaInterpretations.js.'],
  ['2. Planet-in-Sign interpretation: combines the placed planet\'s fixed general nature/significations (planetTraits.js) with the occupied sign\'s fixed temperament/style (signTraits.js), then adds a full DIGNITY clause — exalted (and whether "deep"/exact), Moolatrikona, own sign, or debilitated (and whether "deep"/exact) — from dignityDetails.js\'s detailedDignity(), which needs the planet\'s exact degree within its sign as well as its sign. This rule combination covers all 9 x 12 = 108 possible planet/sign placements.'],
  ['3. Planet-in-House interpretation: combines the same planet trait data with the occupied house\'s fixed significations (houseThemes.js). This rule combination covers all 9 x 12 = 108 possible planet/house placements.'],
  ['4. Planetary Conditions (a separate table): for each planet, its dignity tier/detail (as above), whether it is combust (combustionInterpretations.js\'s per-planet text, only shown when combustion.js has flagged it), and whether it is retrograde (retrogradeInterpretations.js\'s per-planet text, only shown when the birth chart has flagged it — Rahu/Ketu get a "always retrograde by nature" note instead).'],
  [''],
  ['Caveat: this remains a general, per-factor reading — it does not weigh aspects onto the planet, its own dispositor\'s condition, divisional-chart backing, or the planet\'s Ashtakvarga/strength score (all computed elsewhere in this app) into a single final synthesis; treat each row as one classical factor to weigh, not a final verdict.']
];

function degreeInSignOf(longitude) {
  return normalizeDegrees(longitude) % 30;
}

function dignityClause(planetName, dignityDetail, significations) {
  if (dignityDetail.tier === 'Exalted' || dignityDetail.tier === 'Debilitated' || dignityDetail.tier === 'Moolatrikona' || dignityDetail.tier === 'Own Sign') {
    return `${dignityDetail.text} (Its significations: ${significations}.)`;
  }
  return `Its significations (${significations}) blend with, and are colored by, this sign's temperament.`;
}

function interpretLagna(sign) {
  return LAGNA_INTERPRETATIONS[sign] || `No stored interpretation for Lagna sign "${sign}".`;
}

// longitude (optional): the planet's sidereal longitude, used to compute its
// exact degree-within-sign for the deep-exaltation/Moolatrikona checks. If
// omitted, dignity still resolves correctly for Exalted/Debilitated/Own
// Sign/Neutral, just without the "deep"/Moolatrikona degree-range detail.
function interpretPlanetInSign(planetName, sign, longitude) {
  const traits = PLANET_TRAITS[planetName];
  const signInfo = SIGN_TRAITS[sign];
  if (!traits || !signInfo) return { dignity: 'Neutral', text: `No stored interpretation for ${planetName} in ${sign}.` };
  const degreeInSign = typeof longitude === 'number' ? degreeInSignOf(longitude) : undefined;
  const dignityDetail = detailedDignity(planetName, sign, degreeInSign);
  const clause = dignityClause(planetName, dignityDetail, traits.significations);
  return {
    dignity: dignityDetail.tier,
    text: `${planetName} (${traits.nature}) in ${sign} expresses through a ${signInfo.style} approach — ${signInfo.description}. ${clause}`
  };
}

function interpretPlanetInHouse(planetName, house) {
  const traits = PLANET_TRAITS[planetName];
  const houseInfo = HOUSE_THEMES[house];
  if (!traits || !houseInfo) return `No stored interpretation for ${planetName} in House ${house}.`;
  return `${planetName} in House ${house} (${houseInfo.title}) brings its significations (${traits.significations}) to bear on ${houseInfo.description}.`;
}

// Combined dignity + combustion + retrograde reading for one planet, for the
// Planetary Conditions table. planet: a birth-chart planet record
// { name, sign, longitude, combust, retrograde }.
function interpretPlanetConditions(planet) {
  const degreeInSign = degreeInSignOf(planet.longitude);
  const dignityDetail = detailedDignity(planet.name, planet.sign, degreeInSign);
  const combustText = planet.combust ? interpretCombustion(planet.name) : null;
  const retrogradeText = planet.retrograde ? interpretRetrograde(planet.name) : null;

  const notes = [dignityDetail.text];
  if (combustText) notes.push(combustText);
  if (retrogradeText) notes.push(retrogradeText);

  return {
    dignityTier: dignityDetail.tier,
    combust: !!planet.combust,
    retrograde: !!planet.retrograde,
    text: notes.join(' ')
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    INTERPRETATION_ENGINE_LOGIC_TEXT,
    interpretLagna, interpretPlanetInSign, interpretPlanetInHouse, interpretPlanetConditions
  };
}
