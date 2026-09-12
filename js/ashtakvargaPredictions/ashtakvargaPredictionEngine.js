// Ashtakvarga Predictions — interpretation/prediction layer built ON TOP OF
// the existing computeAshtakvarga() output (js/ashtakvarga.js). This file
// does NOT recompute BAV/SAV; it only reads state.ashtakvarga's bav/sav
// arrays and derives predictions, mathematical techniques (Shodhana,
// Pinda), and transit assessments from them, reusing existing chart data
// (house/sign/lordship from birthChart.js + parashariTables.js,
// HOUSE_THEMES from interpretations/houseThemes.js) wherever needed.

const TRIKONA_GROUPS = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]]; // sign indices, 0=Aries
const EKADHIPATYA_PAIRS = [[0, 7], [1, 6], [2, 5], [8, 11], [9, 10]]; // Mars, Venus, Mercury, Jupiter, Saturn

// --- 1. Mathematical / derived techniques (Section 9) ---

function trikonaShodhana(bav12) {
  const result = [...bav12];
  TRIKONA_GROUPS.forEach(group => {
    const min = Math.min(...group.map(i => result[i]));
    group.forEach(i => { result[i] = min; });
  });
  return result;
}

function ekadhipatyaShodhana(bav12) {
  const result = [...bav12];
  EKADHIPATYA_PAIRS.forEach(([a, b]) => {
    const min = Math.min(result[a], result[b]);
    result[a] = min; result[b] = min;
  });
  return result;
}

// Full calculation-step trail for one planet's Shodhana (for "show your work" UI).
function computeShodhanaTrail(planetName, bav12) {
  const afterTrikona = trikonaShodhana(bav12);
  const afterEkadhipatya = ekadhipatyaShodhana(afterTrikona);
  const shodhyaPinda = afterEkadhipatya.reduce((s, v) => s + v, 0);
  return { planet: planetName, original: bav12, afterTrikona, afterEkadhipatya, shodhyaPinda };
}

function computeAllShodhanaTrails(bav) {
  return AV_PLANETS.map(name => computeShodhanaTrail(name, bav[name]));
}

// --- 2. SAV dashboard summary (Section 3/5) ---

function computeSavSummary(sav, ascendantSignIndex) {
  const byHouse = sav.map((_, signIdx) => ({
    house: wholeSignHouseOf(signIdx, ascendantSignIndex),
    sign: SIGNS[signIdx],
    signIndex: signIdx,
    sav: sav[signIdx]
  })).sort((a, b) => a.house - b.house);

  const total = sav.reduce((s, v) => s + v, 0);
  const average = total / 12;
  const highest = Math.max(...sav);
  const lowest = Math.min(...sav);
  const aboveAverage = byHouse.filter(h => h.sav > average);
  const belowAverage = byHouse.filter(h => h.sav < average);

  return { byHouse, total, average, highest, lowest, aboveAverage, belowAverage };
}

// --- 3. Planetary BAV summary (Section 7) ---

function computePlanetaryBavSummary(bav) {
  return AV_PLANETS.map(name => {
    const values = bav[name];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const strongSigns = values.map((v, i) => ({ sign: SIGNS[i], value: v })).filter(s => s.value === max);
    const weakSigns = values.map((v, i) => ({ sign: SIGNS[i], value: v })).filter(s => s.value === min);
    return { planet: name, values, max, min, strongSigns, weakSigns, average: values.reduce((s, v) => s + v, 0) / 12 };
  });
}

// --- 4. House-wise predictions (Section 6) ---

const HOUSE_QUALITATIVE_NOTE = {
  1: 'general vitality, self-direction, and how readily the native\'s own initiatives find support',
  2: 'accumulated wealth, family resources, and speech',
  3: 'courage, effort, and sibling relationships',
  4: 'home, mother, property, and emotional comfort',
  5: 'intelligence, creativity, children, and speculative gains',
  6: 'capacity to handle competition, debt, and daily obstacles',
  7: 'partnership and marital dynamics',
  8: 'resilience through transformation and unexpected events',
  9: 'fortune, higher learning, and guidance from father/mentors',
  10: 'career traction, authority, and public standing',
  11: 'income, gains, and fulfillment of ambitions',
  12: 'expenditure, loss, and matters requiring withdrawal or release'
};

function computeHousePredictions(ashtakvarga, chart) {
  const { bav, sav, ascendantSignIndex } = ashtakvarga;
  const savSummary = computeSavSummary(sav, ascendantSignIndex);
  return savSummary.byHouse.map(h => {
    const houseLordName = SIGN_LORD[h.sign];
    const lordPlanet = chart.planets.find(p => p.name === houseLordName);
    const occupants = chart.planets.filter(p => Number(p.house) === h.house).map(p => p.name);
    const contributingBav = AV_PLANETS.map(name => ({ planet: name, bindus: bav[name][h.signIndex] }))
      .filter(c => c.bindus > 0).sort((a, b) => b.bindus - a.bindus);
    const comparison = h.sav > savSummary.average ? 'above' : h.sav < savSummary.average ? 'below' : 'at';

    const lordBav = lordPlanet ? bav[houseLordName][SIGNS.indexOf(lordPlanet.sign)] : null;
    const evidence = `SAV of House ${h.house} (${h.sign}) is ${h.sav}, ${comparison} the chart average of ${savSummary.average.toFixed(1)}. Contributing planets (bindus): ${contributingBav.map(c => `${c.planet} ${c.bindus}`).join(', ') || 'none'}. House lord ${houseLordName} is placed in ${lordPlanet ? lordPlanet.sign : 'n/a'}${lordBav !== null ? ` (own-sign BAV there: ${lordBav})` : ''}. Occupants: ${occupants.join(', ') || 'none'}.`;

    const text = `House ${h.house} (${h.sign}) governs ${HOUSE_QUALITATIVE_NOTE[h.house]}. Its Ashtakavarga support is ${comparison} this chart's own average, which indicates ${comparison === 'above' ? 'comparatively strong background support for this house\'s matters' : comparison === 'below' ? 'comparatively limited background support, meaning results here may need more sustained effort or favorable timing to manifest' : 'ordinary, chart-typical support'} — the house lord's own condition, occupying planets, relevant yogas, dasha, and transits must still be assessed for the actual outcome; SAV alone does not determine whether this house's matters are favorable or difficult, only how much background support exists.`;

    return { house: h.house, sign: h.sign, sav: h.sav, comparison, houseLordName, occupants, contributingBav, evidence, text };
  });
}

// --- 5. Life-area synthesis (Sections 10-19) ---

const LIFE_AREAS = {
  Wealth: { houses: [2, 11, 5, 9, 8, 12], primary: [2, 11] },
  Career: { houses: [10, 6, 2, 11, 9], primary: [10] },
  Health: { houses: [1, 6, 8, 12], primary: [1, 6] },
  Marriage: { houses: [7, 2, 11], primary: [7] },
  Children: { houses: [5, 2, 11], primary: [5] },
  Property: { houses: [4, 2, 11, 12], primary: [4] },
  Education: { houses: [4, 5, 9], primary: [5, 9] }
};

function computeLifeAreaSynthesis(areaName, ashtakvarga, chart, housePredictions) {
  const area = LIFE_AREAS[areaName];
  const relevantHouses = housePredictions.filter(h => area.houses.includes(h.house));
  const primaryHouses = housePredictions.filter(h => area.primary.includes(h.house));
  const avgSav = relevantHouses.reduce((s, h) => s + h.sav, 0) / relevantHouses.length;
  const chartAvg = computeSavSummary(ashtakvarga.sav, ashtakvarga.ascendantSignIndex).average;

  const supporting = relevantHouses.filter(h => h.comparison === 'above').map(h => `House ${h.house} (${h.sign}) SAV ${h.sav}`);
  const contradicting = relevantHouses.filter(h => h.comparison === 'below').map(h => `House ${h.house} (${h.sign}) SAV ${h.sav}`);

  let finalAssessment;
  const supportRatio = supporting.length / relevantHouses.length;
  if (supportRatio >= 0.75) finalAssessment = 'Strong';
  else if (supportRatio >= 0.5) finalAssessment = 'Moderate';
  else if (supportRatio > 0.25) finalAssessment = 'Mixed';
  else finalAssessment = 'Weak';
  if (relevantHouses.length < 2) finalAssessment = 'Insufficient Evidence';

  const finding = `Ashtakavarga support for ${areaName} across houses ${area.houses.join(', ')} (primary: ${area.primary.join(', ')}) averages ${avgSav.toFixed(1)} vs. the chart's overall average of ${chartAvg.toFixed(1)}.`;
  const interpretation = `${finalAssessment === 'Strong' ? `Most of the houses relevant to ${areaName} carry above-average Ashtakavarga support, suggesting a comparatively favorable background for this life area.` : finalAssessment === 'Weak' ? `Most of the houses relevant to ${areaName} carry below-average support, suggesting this life area may require greater effort, patience, or favorable dasha/transit timing to develop fully.` : `The houses relevant to ${areaName} show a mixed pattern of support — some above, some below the chart average — so this life area's outcome likely depends heavily on the specific dasha/transit period and the natal condition of the relevant house lords.`} This is background support only — natal promise (house lord condition, yogas), dasha, and transit must be assessed for a specific conclusion.`;

  return {
    area: areaName, primaryHouses: area.primary, avgSav, chartAvg, supporting, contradicting, finalAssessment, finding, interpretation
  };
}

// --- 6. Transit predictions (Sections 21-24) ---

function computeTransitPredictions(ashtakvarga, chart, atDate) {
  const { bav, sav, ascendantSignIndex } = ashtakvarga;
  const savSummary = computeSavSummary(sav, ascendantSignIndex);
  return SHADBALA_PLANETS.map(name => {
    const currentLongitude = computeSingleLongitude(name, atDate);
    const signIndex = Math.floor(normalizeDegrees(currentLongitude) / 30) % 12;
    const sign = SIGNS[signIndex];
    const house = wholeSignHouseOf(signIndex, ascendantSignIndex);
    const planetBav = bav[name] ? bav[name][signIndex] : null;
    const signSav = sav[signIndex];
    const savComparison = signSav > savSummary.average ? 'above' : signSav < savSummary.average ? 'below' : 'at';

    let quadrant;
    if (planetBav >= 4 && savComparison !== 'below') quadrant = 'High SAV + High BAV — stronger combined support';
    else if (planetBav < 4 && savComparison !== 'below') quadrant = 'High SAV + Low BAV — general house support, weaker planet-specific support';
    else if (planetBav >= 4 && savComparison === 'below') quadrant = 'Low SAV + High BAV — planet-specific support in a weaker overall environment';
    else quadrant = 'Low SAV + Low BAV — comparatively weak support';

    return {
      planet: name, sign, house, longitude: currentLongitude, bav: planetBav, sav: signSav, savComparison, quadrant,
      text: `${name} is transiting ${sign} (House ${house} from this Lagna), where it has ${planetBav}/8 of its own Bhinnashtakavarga bindus; this sign's SAV (${signSav}) is ${savComparison} the chart average (${savSummary.average.toFixed(1)}). ${quadrant}. This indicates the RELATIVE strength of Ashtakavarga support for this transit only — the planet's natal condition, house lordship, dasha, and other transit factors must still be assessed before drawing a conclusion.`
    };
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    trikonaShodhana, ekadhipatyaShodhana, computeShodhanaTrail, computeAllShodhanaTrails,
    computeSavSummary, computePlanetaryBavSummary, computeHousePredictions,
    LIFE_AREAS, computeLifeAreaSynthesis, computeTransitPredictions
  };
}
