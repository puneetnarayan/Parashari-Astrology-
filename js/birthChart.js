// Ties ephemeris.js + parashariTables.js + combustion.js + aspects.js +
// conjunctions.js together: given a birth UTC instant and place, produce the
// full planet data set (sign, DMS, nakshatra, pada, combust, retrograde,
// aspected-by, conjunct-with) plus the Ascendant, in the shape the Planet
// Table and D1/D9 charts consume.

const BIRTH_CHART_LOGIC_TEXT = [
  ['Birth Chart Generation — Logic and Sequence'],
  [''],
  ['1. Compute each of the 9 planets\' (7 classical + Rahu/Ketu) exact sidereal longitude at the birth UTC instant (ephemeris.js), plus the sidereal Ascendant for the birth place.'],
  ['2. For each planet, derive its sign, nakshatra, and pada from its longitude (parashariTables.js).'],
  ['3. Determine each planet\'s WHOLE-SIGN house by counting signs forward from the Ascendant\'s sign (house 1 = Ascendant\'s sign) — the classical Parashari house convention.'],
  ['4. Retrograde: Mercury, Venus, Mars, Jupiter, and Saturn are flagged retrograde if their longitude one day later is behind (not ahead of) their longitude now. Rahu and Ketu are always retrograde by convention (the lunar nodes only ever move backward through the zodiac). The Sun and Moon are never retrograde.'],
  ['5. Combustion, graha drishti (aspect), and conjunction are then computed from the finished longitude/sign/retrograde data (combustion.js, aspects.js, conjunctions.js).'],
  [''],
  ['Everything computed here is a starting chart — review it, especially near a Rahu/Ketu-affecting sign boundary or at extreme birth latitudes, before relying on it.']
];

function signIndexOf(longitude) {
  return Math.floor(normalizeDegrees(longitude) / 30) % 12;
}

// birthDateUtc: JS Date (UTC instant). latitude/longitude: degrees, east positive.
function generateBirthChart(birthDateUtc, latitude, longitude) {
  const planetLongitudes = computePlanetLongitudes(birthDateUtc);
  const ascendantLongitude = computeAscendant(birthDateUtc, latitude, longitude);
  const ascSignIndex = signIndexOf(ascendantLongitude);

  let planets = PLANET_NAMES.map(name => {
    const lon = planetLongitudes[name];
    const nak = nakshatraFromLongitude(lon);
    const signIdx = signIndexOf(lon);
    return {
      name,
      longitude: Number(lon.toFixed(6)),
      sign: SIGNS[signIdx],
      degreeDms: formatDegMinSec(lon),
      nakshatra: nak ? nak.name : null,
      pada: nak ? padaOf(lon, nak) : null,
      house: wholeSignHouseOf(signIdx, ascSignIndex),
      retrograde: isRetrogradeNow(name, birthDateUtc)
    };
  });

  const combustion = computeCombustion(planets);
  const aspectedBy = computeAspectedBy(planets);
  const conjunctWith = computeConjunctions(planets);

  planets = planets.map(p => ({
    ...p,
    combust: combustion[p.name] ? combustion[p.name].combust : false,
    combustDetail: combustion[p.name] || null,
    aspectedBy: aspectedBy[p.name] || [],
    conjunctWith: conjunctWith[p.name] || []
  }));

  return {
    planets,
    ascendant: {
      longitude: Number(ascendantLongitude.toFixed(6)),
      sign: SIGNS[ascSignIndex],
      degreeDms: formatDegMinSec(ascendantLongitude)
    }
  };
}

if (typeof module !== 'undefined') {
  module.exports = { BIRTH_CHART_LOGIC_TEXT, generateBirthChart };
}
