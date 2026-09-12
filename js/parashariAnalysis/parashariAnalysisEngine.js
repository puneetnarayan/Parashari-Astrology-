/* =========================================================
   PARASHARI ANALYSIS MODULE — pure calculation engine.
   DO NOT MODIFY EXISTING MODULES. This file only reads from
   the app's existing chart/yoga/dasha/shadbala state and its
   existing calculation functions (dignity, functional lordship,
   aspects, conjunctions, combustion, Neecha Bhanga, Vargottama,
   D9 varga, Vimshottari dasha, current transit longitude) — it
   never recomputes any of them, and never writes to `state`.
   Exposed only as window.ParashariAnalysis (namespaced, per the
   spec's isolation requirement) — no generic global functions.
   ========================================================= */

window.ParashariAnalysis = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, result } — invalidated whenever state.chart changes

  function log() { if (NS.debug) console.log('[Parashari]', ...arguments); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER (Section 3) — maps existing app data into one
  //    consistent internal format without duplicating any calculation.
  // ---------------------------------------------------------------
  NS.getChartData = function () { return state.chart || null; };
  NS.getDashaData = function () { return state.dasha || null; };
  NS.getYogaData = function () { return state.yogas || null; };
  NS.getShadbalaData = function () { return state.shadbala || null; };

  NS.getPlanetData = function () {
    const chart = NS.getChartData();
    if (!chart) return [];
    const functional = functionalClassification(chart.ascendant.sign, chart.planets);
    return chart.planets.map(p => {
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const degreeInSign = normalizeDegrees(p.longitude) % 30;
      const dignity = isClassical
        ? detailedDignity(p.name, p.sign, degreeInSign)
        : { tier: 'Neutral', text: 'Rahu/Ketu dignity is classically disputed; treated as Neutral here.' };
      const funcInfo = functional[p.name];
      const sb = isClassical && state.shadbala ? state.shadbala.planets[p.name] : null;
      return {
        name: p.name, longitude: p.longitude, sign: p.sign, signIndex: SIGNS.indexOf(p.sign),
        degreeInSign, house: Number(p.house), nakshatra: p.nakshatra, nakshatraLord: p.nakshatra ? NAKSHATRA_TABLE.find(n => n.name === p.nakshatra).starLord : null,
        pada: p.pada, retrograde: !!p.retrograde, combust: !!p.combust,
        exalted: dignity.tier === 'Exalted', debilitated: dignity.tier === 'Debilitated',
        ownSign: dignity.tier === 'Own Sign', moolatrikona: dignity.tier === 'Moolatrikona',
        dignityTier: dignity.tier, dignityText: dignity.text,
        functionalNature: funcInfo.label, ownedHouses: funcInfo.houses || [],
        naturalNature: NATURAL_BENEFICS.includes(p.name) ? 'benefic' : 'malefic',
        conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || [],
        isClassical, shadbalaRatio: sb ? sb.ratio : null, shadbalaStrength: sb ? sb.strength : null
      };
    });
  };

  NS.getHouseData = function () {
    const chart = NS.getChartData();
    if (!chart) return [];
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const planets = NS.getPlanetData();
    const houses = [];
    for (let h = 1; h <= 12; h++) {
      const signIndex = (ascIndex + h - 1) % 12;
      const sign = SIGNS[signIndex];
      const lord = SIGN_LORD[sign];
      const occupants = planets.filter(p => p.house === h);
      // Which planets aspect this house's sign (Parashari graha drishti,
      // reusing the same ASPECT_OFFSETS table aspects.js already exports
      // — applied here to a house's sign rather than only planet-to-planet).
      const aspectingHere = planets.filter(p => {
        const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default;
        const fromIdx = p.signIndex;
        return offsets.some(o => (fromIdx + (o - 1)) % 12 === signIndex);
      }).map(p => p.name);
      houses.push({
        house: h, sign, lord,
        occupants: occupants.map(p => p.name),
        beneficInfluence: [...occupants.filter(p => p.naturalNature === 'benefic').map(p => p.name), ...aspectingHere.filter(n => NATURAL_BENEFICS.includes(n))],
        maleficInfluence: [...occupants.filter(p => p.naturalNature === 'malefic').map(p => p.name), ...aspectingHere.filter(n => !NATURAL_BENEFICS.includes(n))],
        category: SUDARSHANA_KENDRA_PA.includes(h) ? 'Kendra' : SUDARSHANA_TRIKONA_PA.includes(h) ? 'Trikona' : PA_DUSTHANA.includes(h) ? 'Dusthana' : PA_UPACHAYA.includes(h) ? 'Upachaya' : 'Panapara'
      });
    }
    return houses;
  };

  NS.getVargaData = function (chart) {
    chart = chart || NS.getChartData();
    if (!chart) return null;
    const d9AscSign = vargaPosition(chart.ascendant.longitude, 'D9').sign;
    const planets = chart.planets.map(p => {
      const d9 = vargaPosition(p.longitude, 'D9');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d9DegreeInSign = normalizeDegrees(d9.longitude) % 30;
      const d9Dignity = isClassical ? detailedDignity(p.name, d9.sign, d9DegreeInSign) : { tier: 'Neutral' };
      const varg = isClassical ? vargottamaCheck(p) : { isVargottama: false };
      return { name: p.name, d1Sign: p.sign, d9Sign: d9.sign, d9Dignity: d9Dignity.tier, vargottama: varg.isVargottama };
    });
    return { d9AscendantSign: d9AscSign, planets };
  };

  // Kendra/Trikona/Dusthana/Upachaya house sets — same classical definition
  // used elsewhere in this app (Sudarshana/Remedies engines); named with a
  // PA suffix/prefix here only to avoid any global-name collision, per the
  // spec's namespacing requirement — not a different rule.
  const SUDARSHANA_KENDRA_PA = [1, 4, 7, 10];
  const SUDARSHANA_TRIKONA_PA = [1, 5, 9];
  const PA_DUSTHANA = [6, 8, 12];
  const PA_UPACHAYA = [3, 6, 10, 11];

  // ---------------------------------------------------------------
  // 2. CHART VALIDATION (Section 6)
  // ---------------------------------------------------------------
  NS.validateChart = function () {
    const chart = NS.getChartData();
    const missing = [];
    if (!chart) return { valid: false, missing: ['Chart data'] };
    if (!chart.ascendant || !chart.ascendant.sign) missing.push('Ascendant sign');
    if (!chart.planets || chart.planets.length < 9) missing.push('All nine Grahas');
    chart.planets.forEach(p => { if (typeof p.longitude !== 'number') missing.push(`${p.name} longitude`); });
    const moon = chart.planets.find(p => p.name === 'Moon');
    if (!moon || !moon.nakshatra) missing.push('Moon Nakshatra');
    if (!state.dasha || !state.dasha.length) missing.push('Vimshottari Dasha');
    return { valid: missing.length === 0, missing };
  };

  // ---------------------------------------------------------------
  // 3. AFFLICTION / SUPPORT SCORING (Sections 18-19) — cumulative
  //    evidence, 0-100, never a single-factor verdict. Independent
  //    scoring pipeline for THIS tab (per spec Section 61: a
  //    self-contained module), while reusing the same underlying
  //    chart facts (dignity/functional/aspects/conjunctions) as the
  //    rest of this app rather than recomputing them.
  // ---------------------------------------------------------------
  const PA_WEIGHTS = {
    exalted: 20, ownOrMoolatrikona: 14, debilitated: -20, enemySign: -8,
    functionalMalefic: -12, functionalBenefic: 10, yogakaraka: 16,
    dusthanaPlacement: -10, kendraOrTrikonaPlacement: 8,
    maleficConjunctionEach: -6, maleficConjunctionCap: -18,
    beneficConjunctionEach: 5, beneficConjunctionCap: 15,
    maleficAspectEach: -5, maleficAspectCap: -15,
    beneficAspectEach: 4, beneficAspectCap: 12,
    combust: -8, retrogradeClassical: 0, // retrogression treated as informational only (Section 14 caveat), not scored
    weakShadbala: -8, strongShadbala: 8,
    vargottama: 6, neechaBhangaApplies: 18
  };

  NS.assessPlanet = function (planetName) {
    const chart = NS.getChartData();
    const planets = NS.getPlanetData();
    const p = planets.find(pl => pl.name === planetName);
    if (!p) return null;
    const W = PA_WEIGHTS;
    let score = 50; // neutral baseline, 0-100
    const positives = [], negatives = [];
    const push = (arr, weight, text) => { score += weight; arr.push(text); };

    if (p.exalted) push(positives, W.exalted, `${p.name} is Exalted.`);
    else if (p.ownSign || p.moolatrikona) push(positives, W.ownOrMoolatrikona, `${p.name} is in ${p.dignityTier}.`);
    else if (p.debilitated) push(negatives, W.debilitated, `${p.name} is Debilitated.`);

    const signLordRel = SIGN_LORD[p.sign] === p.name ? 'Own' : relationBetween(p.name, SIGN_LORD[p.sign]);
    if (signLordRel === 'Enemy') push(negatives, W.enemySign, `${p.name} is in an enemy's sign.`);

    if (p.functionalNature === 'Yogakaraka') push(positives, W.yogakaraka, `${p.name} is a Yogakaraka for this Ascendant.`);
    else if (p.functionalNature === 'Functional Benefic') push(positives, W.functionalBenefic, `${p.name} is functionally benefic for this Ascendant.`);
    else if (p.functionalNature === 'Functional Malefic' || p.functionalNature.indexOf('Natural Malefic') === 0) push(negatives, W.functionalMalefic, `${p.name} is functionally malefic for this Ascendant.`);

    if (PA_DUSTHANA.includes(p.house)) push(negatives, W.dusthanaPlacement, `${p.name} occupies a Dusthana house (${p.house}).`);
    else if (SUDARSHANA_KENDRA_PA.includes(p.house) || SUDARSHANA_TRIKONA_PA.includes(p.house)) push(positives, W.kendraOrTrikonaPlacement, `${p.name} occupies a Kendra/Trikona house (${p.house}).`);

    const maleficConj = p.conjunctWith.filter(n => !NATURAL_BENEFICS.includes(n));
    const beneficConj = p.conjunctWith.filter(n => NATURAL_BENEFICS.includes(n));
    if (maleficConj.length) push(negatives, Math.max(W.maleficConjunctionCap, maleficConj.length * W.maleficConjunctionEach), `Conjunct natural malefic(s): ${maleficConj.join(', ')}.`);
    if (beneficConj.length) push(positives, Math.min(W.beneficConjunctionCap, beneficConj.length * W.beneficConjunctionEach), `Conjunct natural benefic(s): ${beneficConj.join(', ')}.`);

    const maleficAsp = p.aspectedBy.filter(n => !NATURAL_BENEFICS.includes(n));
    const beneficAsp = p.aspectedBy.filter(n => NATURAL_BENEFICS.includes(n));
    if (maleficAsp.length) push(negatives, Math.max(W.maleficAspectCap, maleficAsp.length * W.maleficAspectEach), `Aspected by natural malefic(s): ${maleficAsp.join(', ')}.`);
    if (beneficAsp.length) push(positives, Math.min(W.beneficAspectCap, beneficAsp.length * W.beneficAspectEach), `Aspected by natural benefic(s): ${beneficAsp.join(', ')}.`);

    if (p.combust) push(negatives, W.combust, `${p.name} is combust.`);
    if (p.shadbalaRatio !== null) {
      if (p.shadbalaRatio < 0.85) push(negatives, W.weakShadbala, `Below-average Shadbala (ratio ${p.shadbalaRatio.toFixed(2)}).`);
      else if (p.shadbalaRatio >= 1.15) push(positives, W.strongShadbala, `Above-average Shadbala (ratio ${p.shadbalaRatio.toFixed(2)}).`);
    }
    if (p.isClassical) {
      const varg = vargottamaCheck(chart.planets.find(pl => pl.name === p.name));
      if (varg.isVargottama) push(positives, W.vargottama, `${p.name} is Vargottama.`);
    }
    if (p.debilitated) {
      const nb = neechaBhangaCheck(chart.planets, chart.ascendant.sign);
      const applies = nb.find(n => n.planet === p.name && n.conditionsMet.length);
      if (applies) push(positives, W.neechaBhangaApplies, `Neecha Bhanga conditions are met for ${p.name} — debilitation is cancelled.`);
    }

    score = Math.max(0, Math.min(100, score));
    const label = score >= 80 ? 'Very Strong' : score >= 60 ? 'Strong' : score >= 40 ? 'Moderate' : score >= 20 ? 'Weak' : 'Very Weak';
    return { planet: p.name, score, label, positives, negatives, planetInfo: p };
  };

  NS.assessAllPlanets = function () {
    return PLANET_NAMES.map(name => NS.assessPlanet(name));
  };

  // ---------------------------------------------------------------
  // 4. LAGNA ANALYSIS (Section 8)
  // ---------------------------------------------------------------
  NS.assessLagna = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const lagnaLordName = SIGN_LORD[chart.ascendant.sign];
    const lordAssessment = NS.assessPlanet(lagnaLordName);
    const planetsInLagna = NS.getPlanetData().filter(p => p.house === 1).map(p => p.name);
    const houseData = NS.getHouseData()[0];
    // Lagna strength = weighted evidence: Lagna lord's own score is primary,
    // occupants/aspects on the 1st house itself add a smaller adjustment —
    // never determined from one factor alone (Section 8).
    let score = lordAssessment ? lordAssessment.score : 50;
    score += houseData.beneficInfluence.length * 3 - houseData.maleficInfluence.length * 3;
    score = Math.max(0, Math.min(100, score));
    const label = score >= 80 ? 'Very Strong' : score >= 60 ? 'Strong' : score >= 40 ? 'Moderate' : score >= 20 ? 'Weak' : 'Very Weak';
    return { ascendantSign: chart.ascendant.sign, lagnaLord: lagnaLordName, lordAssessment, planetsInLagna, houseData, score, label };
  };

  // ---------------------------------------------------------------
  // 5. MOON / CHANDRA LAGNA (Sections 22-23)
  // ---------------------------------------------------------------
  NS.assessMoon = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const moon = NS.getPlanetData().find(p => p.name === 'Moon');
    const moonAssessment = NS.assessPlanet('Moon');
    // Chandra Lagna: same house-analysis technique as the Lagna, but with
    // the Moon's own sign as House 1 (reuses wholeSignHouseOf, the same
    // generic function already used by the Sudarshana Chakra tab).
    const moonSignIndex = SIGNS.indexOf(moon.sign);
    const chandraHouses = [];
    for (let h = 1; h <= 12; h++) {
      const signIndex = (moonSignIndex + h - 1) % 12;
      const sign = SIGNS[signIndex];
      const occupants = chart.planets.filter(p => SIGNS.indexOf(p.sign) === signIndex).map(p => p.name);
      chandraHouses.push({ house: h, sign, lord: SIGN_LORD[sign], occupants });
    }
    return { moon: moonAssessment, waxing: null, chandraHouses };
  };

  // ---------------------------------------------------------------
  // 6. YOGAS (Section 20) — REUSES the app's existing Yogas engine
  //    (state.yogas, computeYogas/yogaRules.js) which already
  //    implements Raja Yoga, Dhana Yoga, all 5 Mahapurusha Yogas,
  //    Gaja Kesari, Neecha Bhanga Raja Yoga, and many more — not
  //    recomputed here. Only the two classical yogas the existing
  //    engine does not yet cover (Dharma-Karmadhipati, Viparita Raja)
  //    are added as new, clearly-labeled PA-prefixed rules.
  // ---------------------------------------------------------------
  NS.getYogas = function () {
    const existing = (state.yogas ? state.yogas.rows : []).map(r => ({
      ruleId: `EXISTING-${r.key}`, name: r.name, type: r.polarity === 'good' ? 'Benefic Yoga' : 'Afflicting Yoga',
      formed: r.present, planets: r.planets || [], houses: [],
      conditionsMet: r.present ? [r.howDerived] : [], conditionsMissing: r.present ? [] : [r.howDerived],
      cancellations: [], interpretation: r.meaning, source: 'Existing app Yogas engine'
    }));
    return existing.concat(NS.dharmaKarmadhipatiYoga(), NS.viparitaRajaYogas());
  };

  NS.dharmaKarmadhipatiYoga = function () {
    const chart = NS.getChartData();
    if (!chart) return [];
    const ninthLord = SIGN_LORD[SIGNS[(SIGNS.indexOf(chart.ascendant.sign) + 8) % 12]];
    const tenthLord = SIGN_LORD[SIGNS[(SIGNS.indexOf(chart.ascendant.sign) + 9) % 12]];
    if (ninthLord === tenthLord) return []; // same planet can't form a mutual yoga with itself
    const p9 = chart.planets.find(p => p.name === ninthLord);
    const p10 = chart.planets.find(p => p.name === tenthLord);
    const conjunct = p9.sign === p10.sign;
    const mutualAspect = (p9.aspectedBy || []).includes(tenthLord) && (p10.aspectedBy || []).includes(ninthLord);
    const exchange = p9.sign && SIGN_LORD[p9.sign] === tenthLord && SIGN_LORD[p10.sign] === ninthLord;
    const formed = conjunct || mutualAspect || exchange;
    return [{
      ruleId: 'PA-YOGA-001', name: 'Dharma-Karmadhipati Yoga', type: 'Benefic Yoga', formed,
      planets: [ninthLord, tenthLord], houses: [9, 10],
      conditionsMet: formed ? [conjunct ? 'Conjunct' : mutualAspect ? 'Mutual aspect' : 'Sign exchange'] : [],
      conditionsMissing: formed ? [] : ['No conjunction, mutual aspect, or sign exchange between the 9th and 10th lords'],
      cancellations: [], interpretation: 'One of the most auspicious Raja Yoga combinations — dharma (higher purpose) and karma (action/career) working together.',
      source: 'Parashari Analysis module (new)'
    }];
  };

  NS.viparitaRajaYogas = function () {
    const chart = NS.getChartData();
    if (!chart) return [];
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const lordOfHouse = h => SIGN_LORD[SIGNS[(ascIndex + h - 1) % 12]];
    const houseOfPlanet = name => Number(chart.planets.find(p => p.name === name).house);
    const pairs = [[6, 8], [6, 12], [8, 6], [8, 12], [12, 6], [12, 8]];
    const names = { harsha: [6, 8], sarala: [8, 6], vimala: [12, 6] };
    const results = [];
    pairs.forEach(([lordHouse, placedHouse]) => {
      const lord = lordOfHouse(lordHouse);
      if (houseOfPlanet(lord) === placedHouse && PA_DUSTHANA.includes(placedHouse)) {
        const label = Object.keys(names).find(k => names[k][0] === lordHouse && names[k][1] === placedHouse);
        results.push({
          ruleId: `PA-VIPARITA-${lordHouse}-${placedHouse}`, name: `Viparita Raja Yoga${label ? ` (${label[0].toUpperCase() + label.slice(1)})` : ''}`,
          type: 'Benefic Yoga', formed: true, planets: [lord], houses: [lordHouse, placedHouse],
          conditionsMet: [`Lord of ${lordHouse}th house (${lord}) is placed in the ${placedHouse}th house (a Dusthana).`],
          conditionsMissing: [], cancellations: [],
          interpretation: 'A Dusthana lord placed in another Dusthana classically reverses into unexpected gain, once other affliction is accounted for.',
          source: 'Parashari Analysis module (new)'
        });
      }
    });
    return results;
  };

  // ---------------------------------------------------------------
  // 7. DASHA ACTIVATION (Sections 28, 31) — reuses state.dasha /
  //    findCurrentIndex, no recalculation.
  // ---------------------------------------------------------------
  NS.getCurrentDasha = function () {
    if (!state.dasha || !state.dasha.length) return null;
    const idx = findCurrentIndex(state.dasha);
    if (idx < 0) return null;
    const maha = state.dasha[idx];
    const aIdx = findCurrentIndex(maha.antardashas);
    const antar = aIdx >= 0 ? maha.antardashas[aIdx] : null;
    return { mahaLord: maha.lord, mahaPeriod: maha, antarLord: antar ? antar.lord : null, antarPeriod: antar };
  };

  NS.dashaActivatesHouse = function (houseNum) {
    const current = NS.getCurrentDasha();
    const houses = NS.getHouseData();
    const house = houses[houseNum - 1];
    if (!current) return { active: false, reasons: ['No dasha data available.'] };
    const reasons = [];
    let active = false;
    if (current.mahaLord === house.lord) { active = true; reasons.push(`Mahadasha lord (${current.mahaLord}) rules house ${houseNum}.`); }
    if (house.occupants.includes(current.mahaLord)) { active = true; reasons.push(`Mahadasha lord (${current.mahaLord}) occupies house ${houseNum}.`); }
    if (current.antarLord === house.lord) { active = true; reasons.push(`Antardasha lord (${current.antarLord}) rules house ${houseNum}.`); }
    if (house.occupants.includes(current.antarLord)) { active = true; reasons.push(`Antardasha lord (${current.antarLord}) occupies house ${houseNum}.`); }
    if (!reasons.length) reasons.push(`Neither current dasha lord is connected to house ${houseNum}.`);
    return { active, reasons };
  };

  // ---------------------------------------------------------------
  // 8. TRANSIT TRIGGER (Section 32) — reuses computeSingleLongitude,
  //    the same ephemeris call already used by Ashtakvarga Predictions
  //    and the Sudarshana Chakra tab's transit sections.
  // ---------------------------------------------------------------
  NS.transitTriggersHouse = function (houseNum) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const majorTransits = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];
    const now = new Date();
    const reasons = [];
    let active = false;
    majorTransits.forEach(name => {
      const lon = computeSingleLongitude(name, now);
      const signIndex = Math.floor(normalizeDegrees(lon) / 30) % 12;
      const house = wholeSignHouseOf(signIndex, ascIndex);
      if (house === houseNum) { active = true; reasons.push(`Transiting ${name} is currently in house ${houseNum} (from Lagna).`); }
    });
    if (!reasons.length) reasons.push('No major transiting body is currently in this house.');
    return { active, reasons };
  };

  // ---------------------------------------------------------------
  // 9. PROMISE ENGINE (Section 29) — never says a dasha guarantees an
  //    event the natal chart does not support: natal house/lord score
  //    is always the primary gate.
  // ---------------------------------------------------------------
  NS.assessHousePromise = function (houseNum) {
    const houses = NS.getHouseData();
    const house = houses[houseNum - 1];
    const lordAssessment = NS.assessPlanet(house.lord);
    let score = lordAssessment ? lordAssessment.score : 50;
    score += house.beneficInfluence.length * 4 - house.maleficInfluence.length * 4;
    score = Math.max(0, Math.min(100, score));
    const label = score >= 70 ? 'Strong Promise' : score >= 50 ? 'Moderate Promise' : score >= 30 ? 'Weak Promise' : 'No Clear Promise';
    return { house: houseNum, score, label, lordAssessment, houseData: house };
  };

  // ---------------------------------------------------------------
  // 10. LIFE-AREA / EVENT MODULES (Section 30) — combines Promise +
  //     Dasha activation + Transit trigger, with explicit contradiction
  //     reporting (Section 33) rather than blended opaque scores.
  // ---------------------------------------------------------------
  const PA_LIFE_AREAS = [
    { name: 'Career', house: 10, supportingHouses: [2, 6, 11] },
    { name: 'Wealth', house: 2, supportingHouses: [5, 9, 11] },
    { name: 'Marriage', house: 7, supportingHouses: [2, 8] },
    { name: 'Children', house: 5, supportingHouses: [] },
    { name: 'Education', house: 4, supportingHouses: [5] },
    { name: 'Property', house: 4, supportingHouses: [] },
    { name: 'Health', house: 1, supportingHouses: [6, 8, 12] },
    { name: 'Foreign Travel / Residence', house: 12, supportingHouses: [9, 7] },
    { name: 'Spirituality', house: 9, supportingHouses: [12, 5] }
  ];

  NS.assessLifeArea = function (areaDef) {
    const promise = NS.assessHousePromise(areaDef.house);
    const dasha = NS.dashaActivatesHouse(areaDef.house);
    const transit = NS.transitTriggersHouse(areaDef.house);

    let confidenceScore = Math.round(promise.score * 0.6 + (dasha.active ? 25 : 0) + (transit.active ? 15 : 0));
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));
    const confidence = confidenceScore >= 80 ? 'Very High' : confidenceScore >= 60 ? 'High' : confidenceScore >= 40 ? 'Moderate' : confidenceScore >= 20 ? 'Low' : 'Very Low';

    // Contradiction: natal promise and current activation disagree.
    let contradiction = null;
    if (promise.score >= 60 && !dasha.active && !transit.active) {
      contradiction = `Natal promise is ${promise.label.toLowerCase()}, but the current dasha and transits do not currently activate house ${areaDef.house} — this area is promised but not currently "switched on."`;
    } else if (promise.score < 40 && (dasha.active || transit.active)) {
      contradiction = `The current period activates house ${areaDef.house}, but the natal promise here is limited (${promise.label.toLowerCase()}) — expect activity/attention in this area without it necessarily reaching major proportions.`;
    }

    return { area: areaDef.name, house: areaDef.house, promise, dasha, transit, confidence, confidenceScore, contradiction };
  };

  NS.getLifeAreas = function () { return PA_LIFE_AREAS.map(NS.assessLifeArea); };

  // ---------------------------------------------------------------
  // 11. SYNTHESIS (Sections 38J, 39, 58, 59)
  // ---------------------------------------------------------------
  NS.getSummary = function () {
    const lagna = NS.assessLagna();
    const moon = NS.assessMoon();
    const planetAssessments = NS.assessAllPlanets();
    const sorted = [...planetAssessments].sort((a, b) => b.score - a.score);
    const strongest = sorted.slice(0, 3);
    const weakest = sorted.slice(-3).reverse();
    const yogas = NS.getYogas().filter(y => y.formed);
    const dasha = NS.getCurrentDasha();
    return { lagna, moon, strongest, weakest, yogas, dasha };
  };

  NS.buildSynthesisNarrative = function () {
    const summary = NS.getSummary();
    const lifeAreas = NS.getLifeAreas();
    const lines = [];
    lines.push(`Core Nature: With ${summary.lagna.ascendantSign} rising (Lagna lord ${summary.lagna.lagnaLord}, ${summary.lagna.label.toLowerCase()}) and Moon in ${summary.moon.moon.planetInfo.sign} (${summary.moon.moon.label.toLowerCase()}), the chart's foundation is ${summary.lagna.label.toLowerCase()}.`);
    if (summary.strongest.length) lines.push(`Major Strengths: ${summary.strongest.map(p => `${p.planet} (${p.label.toLowerCase()})`).join(', ')} anchor the chart's better-supported significations.`);
    if (summary.weakest.length) lines.push(`Major Challenges: ${summary.weakest.map(p => `${p.planet} (${p.label.toLowerCase()})`).join(', ')} may need conscious remedial or practical attention.`);
    if (summary.yogas.length) lines.push(`Yogas: ${summary.yogas.length} classical yoga(s) are present, including ${summary.yogas.slice(0, 3).map(y => y.name).join(', ')}.`);
    lifeAreas.forEach(a => {
      lines.push(`${a.area}: ${a.promise.label} (house ${a.house}); current-period confidence ${a.confidence.toLowerCase()}.${a.contradiction ? ' ' + a.contradiction : ''}`);
    });
    if (summary.dasha) lines.push(`Dasha: currently running ${summary.dasha.mahaLord} Mahadasha${summary.dasha.antarLord ? ` / ${summary.dasha.antarLord} Antardasha` : ''}.`);
    return lines;
  };

  // ---------------------------------------------------------------
  // 12. TOP-LEVEL CACHE / INIT (Sections 44, 51-53)
  // ---------------------------------------------------------------
  NS.refresh = function () {
    const chart = NS.getChartData();
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart) return NS.cache.result;
    log('Recomputing Parashari Analysis...');
    const validation = NS.validateChart();
    const result = {
      validation,
      houses: NS.getHouseData(),
      planets: NS.getPlanetData(),
      lagna: NS.assessLagna(),
      moon: NS.assessMoon(),
      yogas: NS.getYogas(),
      varga: NS.getVargaData(chart),
      dasha: NS.getCurrentDasha(),
      lifeAreas: NS.getLifeAreas(),
      summary: NS.getSummary(),
      synthesis: NS.buildSynthesisNarrative()
    };
    NS.cache = { chartRef: chart, result };
    log('Parashari Analysis complete.');
    return result;
  };

  NS.init = function () {
    if (NS.initialized) return;
    NS.initialized = true;
  };

  return NS;
})();
