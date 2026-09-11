// Parashari Knowledge Base engine — adapted from the supplied
// interpretation-engine.js (ParashariEngine class) to this app's offline,
// no-server architecture: the knowledge base is loaded as a plain JS data
// object (parashariKB.js's PARASHARI_KB, via a normal <script> tag) rather
// than fetched at runtime, since this app has no server and must work
// fully offline. The lookup/report logic itself is preserved as supplied.
//
// Source: kb.meta describes this content as a "Standard/consensus
// interpretive synthesis drawn from common Parashari principles... Not a
// verbatim quotation of any single text" — presented to the user as such,
// not as a direct classical citation. Planet-in-sign content is a stub
// only (kb.meta.coverage) and is surfaced honestly as "not yet authored"
// rather than filled in with invented text.

function kbIsValidSign(sign) { return PARASHARI_KB.signs.includes(sign); }
function kbIsValidPlanet(planet) { return PARASHARI_KB.planets.includes(planet); }

function kbGetLagnaInSign(sign) {
  if (!kbIsValidSign(sign)) return { error: `Unknown sign "${sign}".` };
  return PARASHARI_KB.lagnaInSign[sign] || { error: `No lagna data found for ${sign}` };
}

function kbGetPlanetInHouse(planet, house) {
  if (!kbIsValidPlanet(planet)) return { error: `Unknown planet "${planet}".` };
  const h = Number(house);
  if (!Number.isInteger(h) || h < 1 || h > 12) return { error: `House must be an integer 1-12, got "${house}"` };
  const text = PARASHARI_KB.planetInHouse[planet] ? PARASHARI_KB.planetInHouse[planet][h] : null;
  if (!text) return { error: `No house-placement data found for ${planet} in house ${h}` };
  return {
    planet, house: h,
    houseTheme: PARASHARI_KB.houseThemes[h],
    coreSignification: PARASHARI_KB.planetCoreSignifications[planet],
    interpretation: text
  };
}

function kbGetPlanetInSign(planet, sign) {
  if (!kbIsValidPlanet(planet)) return { error: `Unknown planet "${planet}"` };
  if (!kbIsValidSign(sign)) return { error: `Unknown sign "${sign}"` };
  const text = PARASHARI_KB.planetInSign && PARASHARI_KB.planetInSign[planet] ? PARASHARI_KB.planetInSign[planet][sign] : null;
  if (!text) return { planet, sign, interpretation: null, note: 'Planet-in-sign content has not been authored yet in this knowledge base (see the coverage note above).' };
  return { planet, sign, interpretation: text };
}

// Builds a full report for the CURRENT chart (state.chart), reusing its
// already-computed ascendant sign and each planet's house/sign — no new
// astronomical or house calculation happens here.
function kbInterpretChart(chart) {
  const lagnaSign = chart.ascendant.sign;
  const report = { lagna: { sign: lagnaSign, ...kbGetLagnaInSign(lagnaSign) }, planets: {} };
  PARASHARI_KB.planets.forEach(planetName => {
    const p = chart.planets.find(pl => pl.name === planetName);
    if (!p) { report.planets[planetName] = { note: `No placement data available for ${planetName}` }; return; }
    const houseResult = kbGetPlanetInHouse(planetName, p.house);
    const signResult = kbGetPlanetInSign(planetName, p.sign);
    report.planets[planetName] = {
      house: p.house, sign: p.sign,
      houseTheme: houseResult.houseTheme, coreSignification: houseResult.coreSignification,
      houseInterpretation: houseResult.interpretation || houseResult.error,
      signInterpretation: signResult.interpretation || signResult.note || signResult.error
    };
  });
  return report;
}

if (typeof module !== 'undefined') {
  module.exports = { kbIsValidSign, kbIsValidPlanet, kbGetLagnaInSign, kbGetPlanetInHouse, kbGetPlanetInSign, kbInterpretChart };
}
