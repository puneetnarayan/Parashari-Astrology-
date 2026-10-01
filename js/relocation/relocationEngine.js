/* =========================================================
   RELOCATION — pure calculation engine.
   Reuses this app's existing chart/dignity/functional/aspect/dasha/
   Ashtakavarga/Shadbala calculations throughout. The ONLY genuinely new
   calculation here is the relocated Ascendant/house recomputation
   (Section 4) — and even that reuses the existing computeAscendant()
   and wholeSignHouseOf() functions verbatim, at a different
   latitude/longitude, same birth instant. Natal planetary longitudes
   are never touched.
   Exposed only as window.Relocation (namespaced). UI code lives
   entirely in relocationUI.js — this file returns plain data only.
   ========================================================= */

window.Relocation = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, locationCache: Map<cacheKey, relocatedChart> }

  const RELOCATION_HOUSES = [1, 3, 4, 7, 9, 10, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function ruleById(id) { return (window.RELOCATION_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // PURPOSE WEIGHTS (Section 5) — configurable, documented, never
  // hidden inside scoring code.
  // ---------------------------------------------------------------
  NS.PURPOSE_WEIGHTS = {
    'Overall Residence': { houses: { 1: 10, 2: 10, 4: 25, 9: 10, 12: 15 }, planets: { Moon: 15 }, dasha: 10, transitAv: 5 },
    'Career': { houses: { 1: 10, 6: 15, 10: 25, 11: 15 }, planets: {}, dasha: 15, transitAv: 5 },
    'Finance': { houses: { 2: 20, 5: 15, 9: 15, 10: 10, 11: 15 }, planets: {}, dasha: 15, transitAv: 5 },
    'Family & Relationships': { houses: { 2: 15, 4: 20, 7: 20 }, planets: { Moon: 20 }, dasha: 10, transitAv: 5 },
    'Retirement': { houses: { 2: 10, 4: 20, 8: 10, 9: 15, 12: 15 }, planets: { Moon: 10 }, dasha: 10, transitAv: 5 },
    'Property & Comfort': { houses: { 2: 15, 4: 25, 11: 15 }, planets: { Venus: 15, Moon: 10 }, dasha: 10, transitAv: 5 },
    'Spiritual Development': { houses: { 5: 15, 8: 10, 9: 20, 12: 20 }, planets: { Jupiter: 15, Ketu: 10 }, dasha: 5, transitAv: 5 },
    'Foreign Settlement': { houses: { 7: 15, 9: 15, 12: 25 }, planets: { Rahu: 15 }, dasha: 10, transitAv: 5, houseExtra: { 4: 10 } }
  };
  NS.PURPOSES = Object.keys(NS.PURPOSE_WEIGHTS);

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER — natal chart, reused as-is.
  // ---------------------------------------------------------------
  NS.getChartData = function () { return state.chart || null; };

  function planetSnapshot(name, planets) {
    const p = planets.find(pl => pl.name === name);
    const isClassical = SHADBALA_PLANETS.includes(name);
    const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral' };
    return { name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude, house: Number(p.house), dignityTier: dignity.tier, conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || [] };
  }

  function houseSnapshot(houseNum, ascSignIndex, planets) {
    const signIndex = (ascSignIndex + houseNum - 1) % 12;
    const sign = SIGNS[signIndex];
    const lord = SIGN_LORD[sign];
    const occupants = planets.filter(p => Number(p.house) === houseNum).map(p => p.name);
    const aspectingHere = planets.filter(p => {
      const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default;
      const fromIdx = SIGNS.indexOf(p.sign);
      return offsets.some(o => (fromIdx + (o - 1)) % 12 === signIndex);
    }).map(p => p.name);
    return { house: houseNum, sign, lord, occupants, aspectingHere };
  }

  // ---------------------------------------------------------------
  // 2. NATAL RELOCATION ANALYSIS (Section 3)
  // ---------------------------------------------------------------
  NS.getNatalHouseData = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const data = {};
    RELOCATION_HOUSES.forEach(h => { data[h] = houseSnapshot(h, ascSignIndex, chart.planets); });
    return data;
  };

  function housesConnected(h1Data, h2Data, chart) {
    if (h1Data.lord === h2Data.lord) return { connected: true, how: `${h1Data.house}th and ${h2Data.house}th houses share the same lord (${h1Data.lord}).` };
    const l1 = chart.planets.find(p => p.name === h1Data.lord);
    const l2 = chart.planets.find(p => p.name === h2Data.lord);
    if (l1.sign === l2.sign) return { connected: true, how: `${h1Data.lord} (${h1Data.house}th lord) and ${h2Data.lord} (${h2Data.house}th lord) are conjunct in ${l1.sign}.` };
    if ((l1.aspectedBy || []).includes(h2Data.lord) || (l2.aspectedBy || []).includes(h1Data.lord)) return { connected: true, how: `${h1Data.lord} and ${h2Data.lord} (${h1Data.house}th/${h2Data.house}th lords) aspect each other.` };
    const exchange = SIGN_LORD[l1.sign] === h2Data.lord && SIGN_LORD[l2.sign] === h1Data.lord;
    if (exchange) return { connected: true, how: `${h1Data.lord} and ${h2Data.lord} are in mutual sign exchange (Parivartana).` };
    return { connected: false, how: `No conjunction, aspect, or exchange found between ${h1Data.lord} (${h1Data.house}th lord) and ${h2Data.lord} (${h2Data.house}th lord).` };
  }

  NS.assessHouseRelationships = function () {
    const chart = NS.getChartData();
    const houses = NS.getNatalHouseData();
    const pairs = [
      { id: 'RL-PAIR-4-12', a: 4, b: 12 }, { id: 'RL-PAIR-4-9', a: 4, b: 9 },
      { id: 'RL-PAIR-4-7', a: 4, b: 7 }, { id: 'RL-PAIR-4-10', a: 4, b: 10 },
      { id: 'RL-PAIR-9-12', a: 9, b: 12 }
    ];
    const results = pairs.map(pair => {
      const rel = housesConnected(houses[pair.a], houses[pair.b], chart);
      return { rule: ruleById(pair.id), houseA: pair.a, houseB: pair.b, connected: rel.connected, evidence: rel.how };
    });
    // Rahu/Ketu to 4th separately (nodes aren't house lords).
    const fourth = houses[4];
    const fourthLordPlanet = chart.planets.find(p => p.name === fourth.lord);
    ['Rahu', 'Ketu'].forEach(node => {
      const nodeP = chart.planets.find(p => p.name === node);
      const connected = fourth.occupants.includes(node) || fourth.aspectingHere.includes(node) || nodeP.sign === fourthLordPlanet.sign || (fourthLordPlanet.aspectedBy || []).includes(node);
      results.push({
        rule: ruleById('RL-PAIR-4-NODES'), houseA: 4, boundNode: node, connected,
        evidence: connected ? `${node} is connected to the 4th house/lord (occupies, aspects, or shares sign with ${fourth.lord}).` : `${node} shows no connection to the 4th house/lord.`
      });
    });
    return results;
  };

  NS.assessNatalPromise = function () {
    const chart = NS.getChartData();
    const houses = NS.getNatalHouseData();
    const relationships = NS.assessHouseRelationships();
    const connectedCount = relationships.filter(r => r.connected).length;

    function classifyHouse(h, ruleId) {
      const lordP = chart.planets.find(p => p.name === h.lord);
      const beneficOccupants = h.occupants.filter(n => NATURAL_BENEFICS.includes(n)).length;
      const maleficOccupants = h.occupants.filter(n => !NATURAL_BENEFICS.includes(n)).length;
      const lordDignityGood = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(lordP && SHADBALA_PLANETS.includes(h.lord) ? detailedDignity(h.lord, lordP.sign, normalizeDegrees(lordP.longitude) % 30).tier : 'Neutral');
      const lordWellPlaced = KENDRA.includes(Number(lordP.house)) || TRIKONA.includes(Number(lordP.house));
      const lordInDusthana = DUSTHANA.includes(Number(lordP.house));
      let result = 'Neutral';
      if (lordDignityGood && !lordInDusthana && beneficOccupants >= maleficOccupants) result = 'Strong';
      else if (lordInDusthana || maleficOccupants > beneficOccupants) result = 'Challenging';
      else if (lordWellPlaced || beneficOccupants > 0) result = 'Supporting';
      else result = 'Moderate';
      return {
        house: h.house, sign: h.sign, lord: h.lord, result, rule: ruleById(ruleId),
        evidence: [
          `${h.house}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house}.`,
          h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.',
          `Lord dignity: ${SHADBALA_PLANETS.includes(h.lord) ? detailedDignity(h.lord, lordP.sign, normalizeDegrees(lordP.longitude) % 30).tier : 'Neutral (node/outer)'}.`
        ]
      };
    }

    const houseClassifications = [
      classifyHouse(houses[4], 'RL-NATAL-001'), classifyHouse(houses[12], 'RL-NATAL-002'),
      classifyHouse(houses[9], 'RL-NATAL-003'), classifyHouse(houses[3], 'RL-NATAL-004'),
      classifyHouse(houses[7], 'RL-NATAL-005'), classifyHouse(houses[10], 'RL-NATAL-006')
    ];

    const moon = planetSnapshot('Moon', chart.planets);
    const moonStrong = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(moon.dignityTier) || NATURAL_BENEFICS.includes('Moon') && (moon.aspectedBy.filter(n => NATURAL_BENEFICS.includes(n)).length > moon.aspectedBy.filter(n => !NATURAL_BENEFICS.includes(n)).length);
    const moonAssessment = { planet: 'Moon', sign: moon.sign, result: moonStrong ? 'Supporting' : 'Neutral', rule: ruleById('RL-NATAL-008'), evidence: [`Moon is in ${moon.sign} (${moon.dignityTier}).`, moon.aspectedBy.length ? `Aspected by: ${moon.aspectedBy.join(', ')}.` : 'No aspects received.'] };

    const strongCount = houseClassifications.filter(h => h.result === 'Strong' || h.result === 'Supporting').length + relationships.filter(r => r.connected).length;
    const challengingCount = houseClassifications.filter(h => h.result === 'Challenging').length;
    const overall = strongCount >= challengingCount + 2 ? 'Relocation is well supported by the natal chart.'
      : challengingCount > strongCount ? 'Relocation shows meaningful natal challenges; careful location selection matters more than usual.'
      : 'Relocation is moderately supported by the natal chart; location and timing selection matter.';

    return { houseClassifications, moonAssessment, relationships, connectedCount, overall };
  };

  // ---------------------------------------------------------------
  // 3. RELOCATION CHART (Section 4) — natal longitudes untouched; only
  //    the Ascendant/houses are recomputed at the candidate's lat/lon,
  //    using the app's existing computeAscendant() and
  //    wholeSignHouseOf(), at the SAME birth instant.
  // ---------------------------------------------------------------
  NS.computeRelocatedChart = function (latitude, longitude) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const relocatedAscLongitude = computeAscendant(chart.birthUtc, latitude, longitude);
    const ascSignIndex = Math.floor(normalizeDegrees(relocatedAscLongitude) / 30) % 12;
    const ascSign = SIGNS[ascSignIndex];
    const planets = chart.planets.map(p => {
      const pSignIndex = SIGNS.indexOf(p.sign);
      return Object.assign({}, p, { house: wholeSignHouseOf(pSignIndex, ascSignIndex) });
    });
    const houses = {};
    RELOCATION_HOUSES.concat([2, 5, 6, 8, 11]).forEach(h => { houses[h] = houseSnapshot(h, ascSignIndex, planets); });
    return {
      ascendant: { longitude: relocatedAscLongitude, sign: ascSign, degreeDms: formatDegMinSec(relocatedAscLongitude) },
      planets, houses
    };
  };

  NS.getRelocatedChartCached = function (location) {
    const chart = NS.getChartData();
    if (!chart) return null;
    if (!NS.cache || NS.cache.chartRef !== chart) NS.cache = { chartRef: chart, locationCache: new Map() };
    const key = window.RelocationLocations.cacheKey(chart.birthUtc, location.latitude, location.longitude);
    if (NS.cache.locationCache.has(key)) return NS.cache.locationCache.get(key);
    const relocated = NS.computeRelocatedChart(location.latitude, location.longitude);
    NS.cache.locationCache.set(key, relocated);
    return relocated;
  };

  // ---------------------------------------------------------------
  // 4. ASHTAKAVARGA SUPPORT (Section 9) — reuses state.ashtakvarga
  //    (computeAshtakvarga), never recomputed.
  // ---------------------------------------------------------------
  NS.getAshtakvargaForHouses = function () {
    const chart = NS.getChartData();
    if (!chart || !state.ashtakvarga) return null;
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const sav = state.ashtakvarga.sav;
    const result = {};
    [4, 9, 10, 12].forEach(h => {
      const signIndex = (ascSignIndex + h - 1) % 12;
      result[h] = sav[signIndex];
    });
    return result;
  };

  // ---------------------------------------------------------------
  // 5. DASHA INTEGRATION (Section 7) — reuses state.dasha +
  //    buildSubPeriods(), never a second dasha engine.
  // ---------------------------------------------------------------
  function houseOwnership(name, ascSignIndex) {
    const owned = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) owned.push(h); }
    return owned;
  }

  NS.assessDashaForRelocation = function () {
    const chart = NS.getChartData();
    if (!chart || !state.dasha || !state.dasha.length) return null;
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const idx = findCurrentIndex(state.dasha);
    if (idx < 0) return null;
    const maha = state.dasha[idx];
    const aIdx = findCurrentIndex(maha.antardashas);
    const antar = aIdx >= 0 ? maha.antardashas[aIdx] : null;
    let pratyantar = null;
    if (antar) {
      const pds = buildSubPeriods(antar.lord, antar.years, antar.startDate);
      const pIdx = findCurrentIndex(pds);
      pratyantar = pIdx >= 0 ? pds[pIdx] : null;
    }
    function evaluateLord(name) {
      const owned = houseOwnership(name, ascSignIndex);
      const p = chart.planets.find(pl => pl.name === name);
      const natalPlacement = Number(p.house);
      const connectedHouses = Array.from(new Set(owned.concat(RELOCATION_HOUSES.includes(natalPlacement) ? [natalPlacement] : [])));
      const relevant = connectedHouses.some(h => RELOCATION_HOUSES.includes(h));
      return { lord: name, housesOwned: owned, natalPlacement, connectedRelocationHouses: connectedHouses.filter(h => RELOCATION_HOUSES.includes(h)), relevant };
    }
    const mahaEval = evaluateLord(maha.lord);
    const antarEval = antar ? evaluateLord(antar.lord) : null;
    const pratyantarEval = pratyantar ? evaluateLord(pratyantar.lord) : null;
    const promise = mahaEval.relevant || (antarEval && antarEval.relevant);
    const activation = (antarEval && antarEval.relevant) || (pratyantarEval && pratyantarEval.relevant);
    const timing = pratyantarEval && pratyantarEval.relevant;
    return {
      mahadasha: { lord: maha.lord, startDate: maha.startDate, endDate: maha.endDate, evaluation: mahaEval },
      antardasha: antar ? { lord: antar.lord, startDate: antar.startDate, endDate: antar.endDate, evaluation: antarEval } : null,
      pratyantardasha: pratyantar ? { lord: pratyantar.lord, startDate: pratyantar.startDate, endDate: pratyantar.endDate, evaluation: pratyantarEval } : null,
      classification: { promise, activation, timing },
      rule: ruleById('RL-DASHA-001')
    };
  };

  // ---------------------------------------------------------------
  // 6. TRANSIT INTEGRATION (Section 8) — supporting factor only,
  //    reuses computeSingleLongitude (same ephemeris call used
  //    elsewhere in this app for transits).
  // ---------------------------------------------------------------
  NS.assessTransitSupport = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const houses = NS.getNatalHouseData();
    const now = new Date();
    const bodies = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];
    const hits = [];
    bodies.forEach(name => {
      const signIndex = Math.floor(normalizeDegrees(computeSingleLongitude(name, now)) / 30) % 12;
      const house = wholeSignHouseOf(signIndex, ascSignIndex);
      if (RELOCATION_HOUSES.includes(house)) hits.push(`Transiting ${name} is currently in house ${house} (natal).`);
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default;
      RELOCATION_HOUSES.forEach(h => {
        const targetSignIndex = (ascSignIndex + h - 1) % 12;
        if (offsets.some(o => (signIndex + (o - 1)) % 12 === targetSignIndex) && house !== h) hits.push(`Transiting ${name} aspects natal house ${h}.`);
      });
    });
    return { active: hits.length > 0, reasons: hits.length ? hits : ['No major transiting body currently aspects/occupies the relocation houses (4th/9th/10th/12th).'], rule: ruleById('RL-TRANSIT-001') };
  };

  // ---------------------------------------------------------------
  // 7. COMPATIBILITY INDEX (Section 6) — fully transparent, every
  //    component stored and explained, never an opaque total.
  // ---------------------------------------------------------------
  NS.COMPATIBILITY_COMPONENTS = { natalPromise: 20, relocated4th: 15, relocated12th: 10, relocated9th: 10, purposeSpecific: 15, planetaryStrength: 10, dashaCompatibility: 10, transitSupport: 5, ashtakavargaSupport: 5 };

  function houseStrengthFraction(houseData, chart) {
    const lordP = chart.planets.find(p => p.name === houseData.lord);
    const isClassical = SHADBALA_PLANETS.includes(houseData.lord);
    const dignity = isClassical ? detailedDignity(houseData.lord, lordP.sign, normalizeDegrees(lordP.longitude) % 30).tier : 'Neutral';
    let f = 0.5;
    if (['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity)) f += 0.3;
    else if (dignity === 'Debilitated') f -= 0.3;
    if (KENDRA.includes(Number(lordP.house)) || TRIKONA.includes(Number(lordP.house))) f += 0.1;
    if (DUSTHANA.includes(Number(lordP.house))) f -= 0.2;
    const benefics = houseData.occupants.filter(n => NATURAL_BENEFICS.includes(n)).length;
    const malefics = houseData.occupants.filter(n => !NATURAL_BENEFICS.includes(n)).length;
    f += (benefics - malefics) * 0.05;
    return Math.max(0, Math.min(1, f));
  }

  NS.computeCompatibilityIndex = function (location, purpose) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const relocated = NS.getRelocatedChartCached(location);
    const natal = NS.assessNatalPromise();
    const C = NS.COMPATIBILITY_COMPONENTS;
    const weights = NS.PURPOSE_WEIGHTS[purpose] || NS.PURPOSE_WEIGHTS['Overall Residence'];
    const components = {};
    const positiveFactors = [], negativeFactors = [], neutralFactors = [], ruleIds = [], explanations = [];

    // Natal promise component
    const strongHouses = natal.houseClassifications.filter(h => h.result === 'Strong' || h.result === 'Supporting').length;
    const natalFraction = Math.min(1, (strongHouses + natal.connectedCount) / (natal.houseClassifications.length + natal.relationships.length));
    components.natalPromise = Math.round(C.natalPromise * natalFraction);
    (natalFraction >= 0.6 ? positiveFactors : natalFraction <= 0.3 ? negativeFactors : neutralFactors).push(`Natal relocation promise: ${components.natalPromise}/${C.natalPromise}`);
    ruleIds.push('RL-NATAL-001'); explanations.push('Natal promise is the sum of 4th/12th/9th/3rd/7th/10th-house classifications and 4th/9th/7th/10th/12th-nexus connections.');

    // Relocated 4th/9th/12th
    [['relocated4th', 4], ['relocated9th', 9], ['relocated12th', 12]].forEach(([key, h]) => {
      const frac = houseStrengthFraction(relocated.houses[h], Object.assign({}, chart, { planets: relocated.planets }));
      components[key] = Math.round(C[key] * frac);
      (frac >= 0.6 ? positiveFactors : frac <= 0.3 ? negativeFactors : neutralFactors).push(`Relocated ${h}th house: ${components[key]}/${C[key]}`);
    });
    ruleIds.push('RL-RELOC-001'); explanations.push('Relocated 4th/9th/12th house strength uses the same dignity/placement/occupant logic as the natal assessment, applied to the relocated Ascendant.');

    // Purpose-specific
    let purposeFrac = 0, purposeTotalWeight = 0;
    Object.keys(weights.houses || {}).forEach(hStr => {
      const h = Number(hStr);
      const w = weights.houses[hStr];
      const hd = relocated.houses[h] || houseSnapshot(h, SIGNS.indexOf(relocated.ascendant.sign), relocated.planets);
      const frac = houseStrengthFraction(hd, Object.assign({}, chart, { planets: relocated.planets }));
      purposeFrac += frac * w; purposeTotalWeight += w;
    });
    Object.keys(weights.planets || {}).forEach(name => {
      const w = weights.planets[name];
      const p = relocated.planets.find(pl => pl.name === name);
      const isClassical = SHADBALA_PLANETS.includes(name);
      const dignity = isClassical ? detailedDignity(name, p.sign, normalizeDegrees(p.longitude) % 30).tier : 'Neutral';
      const frac = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity) ? 0.85 : dignity === 'Debilitated' ? 0.2 : 0.55;
      purposeFrac += frac * w; purposeTotalWeight += w;
    });
    const purposeFraction = purposeTotalWeight ? purposeFrac / purposeTotalWeight : 0.5;
    components.purposeSpecific = Math.round(C.purposeSpecific * purposeFraction);
    (purposeFraction >= 0.6 ? positiveFactors : purposeFraction <= 0.3 ? negativeFactors : neutralFactors).push(`Purpose-specific factors (${purpose}): ${components.purposeSpecific}/${C.purposeSpecific}`);
    ruleIds.push('RL-WEIGHT-001'); explanations.push(`${purpose} emphasizes: ${Object.keys(weights.houses || {}).map(h => h + 'th house').concat(Object.keys(weights.planets || {})).join(', ')}.`);

    // Planetary strength (Shadbala, if available — graceful degrade otherwise)
    if (state.shadbala && state.shadbala.planets) {
      const relevantPlanets = Array.from(new Set(RELOCATION_HOUSES.map(h => natal.houseClassifications.find(hc => hc.house === h)).filter(Boolean).map(hc => hc.lord)));
      const ratios = relevantPlanets.map(n => state.shadbala.planets[n] ? state.shadbala.planets[n].ratio : 1).filter(r => typeof r === 'number');
      const avgRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 1;
      const frac = Math.max(0, Math.min(1, (avgRatio - 0.7) / 0.6));
      components.planetaryStrength = Math.round(C.planetaryStrength * frac);
      neutralFactors.push(`Planetary strength (Shadbala of relocation-house lords): ${components.planetaryStrength}/${C.planetaryStrength}`);
    } else {
      components.planetaryStrength = Math.round(C.planetaryStrength * 0.5);
      neutralFactors.push('Planetary strength: Shadbala not computed for this chart — neutral default applied.');
    }

    // Dasha compatibility
    const dashaResult = NS.assessDashaForRelocation();
    if (dashaResult) {
      const frac = dashaResult.classification.timing ? 1 : dashaResult.classification.activation ? 0.7 : dashaResult.classification.promise ? 0.4 : 0.1;
      components.dashaCompatibility = Math.round(C.dashaCompatibility * frac);
      (frac >= 0.6 ? positiveFactors : negativeFactors).push(`Dasha compatibility: ${components.dashaCompatibility}/${C.dashaCompatibility}`);
      ruleIds.push('RL-DASHA-001');
    } else {
      components.dashaCompatibility = Math.round(C.dashaCompatibility * 0.5);
      neutralFactors.push('Dasha compatibility: Dasha data unavailable — neutral default applied.');
    }

    // Transit support
    const transit = NS.assessTransitSupport();
    components.transitSupport = transit && transit.active ? C.transitSupport : Math.round(C.transitSupport * 0.3);
    (transit && transit.active ? positiveFactors : neutralFactors).push(`Transit support: ${components.transitSupport}/${C.transitSupport}`);
    if (transit) ruleIds.push('RL-TRANSIT-001');

    // Ashtakavarga support
    const avHouses = NS.getAshtakvargaForHouses();
    if (avHouses) {
      const avg = (avHouses[4] + avHouses[9] + avHouses[10] + avHouses[12]) / 4;
      const frac = Math.max(0, Math.min(1, (avg - 20) / 15));
      components.ashtakavargaSupport = Math.round(C.ashtakavargaSupport * frac);
      neutralFactors.push(`Ashtakavarga support (avg SAV of 4/9/10/12): ${components.ashtakavargaSupport}/${C.ashtakavargaSupport} (avg bindus ${avg.toFixed(1)})`);
      ruleIds.push('RL-AV-001');
    } else {
      components.ashtakavargaSupport = Math.round(C.ashtakavargaSupport * 0.5);
      neutralFactors.push('Ashtakavarga support: not available — neutral default applied.');
    }

    const score = Object.values(components).reduce((a, b) => a + b, 0);
    return { score, maxScore: Object.values(C).reduce((a, b) => a + b, 0), components, positiveFactors, negativeFactors, neutralFactors, ruleIds: Array.from(new Set(ruleIds)).map(ruleById).filter(Boolean), explanations };
  };

  // ---------------------------------------------------------------
  // 8. DIRECTION (Section 10) — supplementary context only, never
  //    scored into the compatibility index.
  // ---------------------------------------------------------------
  NS.getDirection = function (birthLat, birthLon, location) {
    const bearing = window.RelocationLocations.bearing(birthLat, birthLon, location.latitude, location.longitude);
    const compass = window.RelocationLocations.compassDirection(bearing);
    const distanceKm = window.RelocationLocations.distanceKm(birthLat, birthLon, location.latitude, location.longitude);
    return { bearing, compass, label: window.RelocationLocations.DIRECTION_LABELS[compass], distanceKm, rule: ruleById('RL-DIRECTION-001') };
  };

  // ---------------------------------------------------------------
  // TOP-LEVEL: full location analysis bundle (for the detail panel).
  // ---------------------------------------------------------------
  NS.analyzeLocation = function (location, purpose, birthLat, birthLon) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const relocated = NS.getRelocatedChartCached(location);
    const index = NS.computeCompatibilityIndex(location, purpose);
    const direction = NS.getDirection(birthLat, birthLon, location);
    const dasha = NS.assessDashaForRelocation();
    const transit = NS.assessTransitSupport();
    const ashtakavarga = NS.getAshtakvargaForHouses();
    return { location, purpose, relocated, index, direction, dasha, transit, ashtakavarga };
  };

  NS.analyzeAllPurposes = function (location, birthLat, birthLon) {
    const result = {};
    NS.PURPOSES.forEach(purpose => { result[purpose] = NS.computeCompatibilityIndex(location, purpose); });
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
