// Combines planetTraits.js + signTraits.js + houseThemes.js +
// lagnaInterpretations.js into the actual interpretation text shown in the
// Interpretations tab. "Planet in Sign" and "Planet in House" cover EVERY
// possible planet/sign and planet/house combination (9x12 = 108 each) by
// RULE — combining each planet's fixed significations with the placement's
// fixed traits/theme, plus a dignity check (exalted/debilitated/own sign)
// for signs — rather than 216 individually hand-written paragraphs. Lagna
// (only 12 possible signs) is instead hand-composed per sign, in
// lagnaInterpretations.js, since it is the single most consulted placement.

const INTERPRETATION_ENGINE_LOGIC_TEXT = [
  ['Interpretation Engine — Logic and Sequence'],
  [''],
  ['1. Lagna interpretation: a direct lookup of the Ascendant\'s sign against the 12 hand-composed entries in lagnaInterpretations.js.'],
  ['2. Planet-in-Sign interpretation: combines the placed planet\'s fixed general nature/significations (planetTraits.js) with the occupied sign\'s fixed temperament/style (signTraits.js), then adds a DIGNITY clause — exalted, debilitated, or in its own sign (planetTraits.js\'s EXALTATION_SIGN/DEBILITATION_SIGN, and parashariTables.js\'s SIGN_LORD) — since dignity meaningfully changes how strongly/weakly a placement\'s significations tend to express. This rule combination covers all 9 x 12 = 108 possible planet/sign placements.'],
  ['3. Planet-in-House interpretation: combines the same planet trait data with the occupied house\'s fixed significations (houseThemes.js). This rule combination covers all 9 x 12 = 108 possible planet/house placements.'],
  [''],
  ['Caveat: this is a general, single-factor reading of the placement alone — it does not weigh aspects onto the planet, its own dispositor\'s condition, combustion, retrogression, divisional-chart backing, or the planet\'s Ashtakvarga/strength score (all computed elsewhere in this app) — treat it as a starting description, not a full synthesis.']
];

function dignityOf(planetName, sign) {
  if (EXALTATION_SIGN[planetName] === sign) return 'Exalted';
  if (DEBILITATION_SIGN[planetName] === sign) return 'Debilitated';
  if (SIGN_LORD[sign] === planetName) return 'Own Sign';
  return 'Neutral';
}

function dignityClause(planetName, sign, dignity, significations) {
  if (dignity === 'Exalted') {
    return `${planetName} is EXALTED in ${sign}: its significations (${significations}) tend to express with unusual strength, confidence, and favorable outcomes here — one of this planet's most favorable sign placements.`;
  }
  if (dignity === 'Debilitated') {
    return `${planetName} is DEBILITATED in ${sign}: its significations (${significations}) tend to feel weak, hesitant, or blocked, and generally need conscious effort (or a strong dispositor/aspect) to express well here.`;
  }
  if (dignity === 'Own Sign') {
    return `${planetName} is in its OWN SIGN here: it is comfortable and stable, expressing its natural significations (${significations}) with steady, reliable strength.`;
  }
  return `Its significations (${significations}) blend with, and are colored by, this sign's temperament.`;
}

function interpretLagna(sign) {
  return LAGNA_INTERPRETATIONS[sign] || `No stored interpretation for Lagna sign "${sign}".`;
}

function interpretPlanetInSign(planetName, sign) {
  const traits = PLANET_TRAITS[planetName];
  const signInfo = SIGN_TRAITS[sign];
  if (!traits || !signInfo) return `No stored interpretation for ${planetName} in ${sign}.`;
  const dignity = dignityOf(planetName, sign);
  const clause = dignityClause(planetName, sign, dignity, traits.significations);
  return {
    dignity,
    text: `${planetName} (${traits.nature}) in ${sign} expresses through a ${signInfo.style} approach — ${signInfo.description}. ${clause}`
  };
}

function interpretPlanetInHouse(planetName, house) {
  const traits = PLANET_TRAITS[planetName];
  const houseInfo = HOUSE_THEMES[house];
  if (!traits || !houseInfo) return `No stored interpretation for ${planetName} in House ${house}.`;
  return `${planetName} in House ${house} (${houseInfo.title}) brings its significations (${traits.significations}) to bear on ${houseInfo.description}.`;
}

if (typeof module !== 'undefined') {
  module.exports = {
    INTERPRETATION_ENGINE_LOGIC_TEXT, dignityOf,
    interpretLagna, interpretPlanetInSign, interpretPlanetInHouse
  };
}
