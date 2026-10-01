/* =========================================================
   PROMOTION TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/functional/aspect/dasha/D10/transit/yoga calculations
   throughout — same architecture as Marriage Timing
   (js/marriageTiming/marriageTimingEngine.js), with career-specific
   houses/significators/rules.
   Exposed only as window.PromotionTiming (namespaced). UI code lives
   entirely in promotionTimingUI.js — this file returns plain data only.
   ========================================================= */

window.PromotionTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, result }

  const CAREER_HOUSES = [2, 6, 10, 11];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[PromotionTiming]', text); }
  function ruleById(id) { return (window.PROMOTION_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER — reuses state.chart / state.dasha / state.yogas.
  // ---------------------------------------------------------------
  NS.getChartData = function () { return state.chart || null; };

  NS.getPlanetSnapshot = function (name, planetsOverride) {
    const chart = NS.getChartData();
    const planets = planetsOverride || (chart ? chart.planets : []);
    const p = planets.find(pl => pl.name === name);
    if (!p) return null;
    const isClassical = SHADBALA_PLANETS.includes(name);
    const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral' };
    return {
      name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude,
      house: Number(p.house), dignityTier: dignity.tier,
      conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || []
    };
  };

  NS.getHouseSnapshot = function (houseNum, ascSignIndexOverride, planetsOverride) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascSignIndex = ascSignIndexOverride !== undefined ? ascSignIndexOverride : SIGNS.indexOf(chart.ascendant.sign);
    const planets = planetsOverride || chart.planets;
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
  };

  // ---------------------------------------------------------------
  // 2. D10 (DASHAMSHA) — reuses vargaPosition/detailedDignity, the
  //    same functions this app's Divisional Charts/Parashari Analysis/
  //    Marriage Timing (D9) already use. Never recomputed.
  // ---------------------------------------------------------------
  NS.getD10 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD10 = vargaPosition(chart.ascendant.longitude, 'D10');
    const ascD10SignIndex = SIGNS.indexOf(ascD10.sign);
    const d10LagnaLord = SIGN_LORD[ascD10.sign];
    const tenthD10SignIndex = (ascD10SignIndex + 9) % 12;
    const eleventhD10SignIndex = (ascD10SignIndex + 10) % 12;
    const planets = chart.planets.map(p => {
      const d10 = vargaPosition(p.longitude, 'D10');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d10DegreeInSign = normalizeDegrees(d10.longitude) % 30;
      const d10Dignity = isClassical ? detailedDignity(p.name, d10.sign, d10DegreeInSign) : { tier: 'Neutral' };
      const d10House = ((SIGNS.indexOf(d10.sign) - ascD10SignIndex + 12) % 12) + 1;
      return { name: p.name, d10Sign: d10.sign, d10House, d10Dignity: d10Dignity.tier };
    });
    return {
      ascendantSign: ascD10.sign, lagnaLord: d10LagnaLord,
      tenthSign: SIGNS[tenthD10SignIndex], tenthLord: SIGN_LORD[SIGNS[tenthD10SignIndex]],
      eleventhSign: SIGNS[eleventhD10SignIndex], eleventhLord: SIGN_LORD[SIGNS[eleventhD10SignIndex]],
      planets,
      tenthOccupants: planets.filter(p => p.d10House === 10).map(p => p.name),
      eleventhOccupants: planets.filter(p => p.d10House === 11).map(p => p.name)
    };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    const lagnaLordInfo = d10.planets.find(p => p.name === d10.lagnaLord);
    const tenthLordInfo = d10.planets.find(p => p.name === d10.tenthLord);
    const eleventhLordInfo = d10.planets.find(p => p.name === d10.eleventhLord);
    const sunInfo = d10.planets.find(p => p.name === 'Sun');
    const saturnInfo = d10.planets.find(p => p.name === 'Saturn');
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    let points = 0;
    const evidence = [];
    if (tenthLordInfo && strong.includes(tenthLordInfo.d10Dignity)) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${tenthLordInfo.d10Dignity} in D10.`); }
    else if (tenthLordInfo && tenthLordInfo.d10Dignity === 'Debilitated') { evidence.push(`D10 10th lord (${d10.tenthLord}) is Debilitated in D10.`); }
    if (eleventhLordInfo && strong.includes(eleventhLordInfo.d10Dignity)) { points += 2; evidence.push(`D10 11th lord (${d10.eleventhLord}) is ${eleventhLordInfo.d10Dignity} in D10.`); }
    if (lagnaLordInfo && strong.includes(lagnaLordInfo.d10Dignity)) { points += 1; evidence.push(`D10 Lagna lord (${d10.lagnaLord}) is ${lagnaLordInfo.d10Dignity} in D10.`); }
    if (d10.tenthOccupants.length) { points += 1; evidence.push(`D10 10th house occupied by: ${d10.tenthOccupants.join(', ')}.`); }
    if (d10.eleventhOccupants.length) { points += 1; evidence.push(`D10 11th house occupied by: ${d10.eleventhOccupants.join(', ')}.`); }
    if (sunInfo && strong.includes(sunInfo.d10Dignity)) { points += 1; evidence.push(`Sun is ${sunInfo.d10Dignity} in D10.`); }
    if (saturnInfo && strong.includes(saturnInfo.d10Dignity)) { points += 1; evidence.push(`Saturn is ${saturnInfo.d10Dignity} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for the career axis (10th/11th/Lagna lords, Sun, Saturn).');
    const level = points >= 5 ? 'Strong D10 confirmation' : points >= 3 ? 'D10 confirmation' : points >= 1 ? 'Partial D10 confirmation' : 'Mixed D10 indication';
    return { d10, points, level, evidence, rule: ruleById('PT-D10-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL CAREER PROMISE (Steps 3-4)
  // ---------------------------------------------------------------
  function classifyHouse(houseNum, ruleId) {
    const chart = NS.getChartData();
    const h = NS.getHouseSnapshot(houseNum);
    const lordP = chart.planets.find(p => p.name === h.lord);
    const isClassical = SHADBALA_PLANETS.includes(h.lord);
    const dignity = isClassical ? detailedDignity(h.lord, lordP.sign, normalizeDegrees(lordP.longitude) % 30).tier : 'Neutral';
    const beneficOccupants = h.occupants.filter(n => NATURAL_BENEFICS.includes(n)).length;
    const maleficOccupants = h.occupants.filter(n => !NATURAL_BENEFICS.includes(n)).length;
    const lordWellPlaced = KENDRA.includes(Number(lordP.house)) || TRIKONA.includes(Number(lordP.house));
    const lordInDusthana = DUSTHANA.includes(Number(lordP.house));
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
    let result = 'Neutral';
    if (strongDignity && !lordInDusthana && beneficOccupants >= maleficOccupants) result = 'Strong';
    else if (lordInDusthana || dignity === 'Debilitated' || maleficOccupants > beneficOccupants) result = 'Challenging';
    else if (lordWellPlaced || beneficOccupants > 0) result = 'Supporting';
    else result = 'Moderate';
    return {
      house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId),
      occupants: h.occupants, aspectingHere: h.aspectingHere,
      evidence: [
        `${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`,
        h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.',
        h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.',
        lordInDusthana ? `${h.lord} occupies a Dusthana house (${lordP.house}).` : lordWellPlaced ? `${h.lord} occupies a Kendra/Trikona house (${lordP.house}).` : `${h.lord} occupies a Panapara/Upachaya house (${lordP.house}).`
      ]
    };
  }

  function relationLabel(a, b) { return a === b ? 'Same planet' : relationBetween(a, b); }

  function classifyKaraka(name, ruleId) {
    const chart = NS.getChartData();
    const p = NS.getPlanetSnapshot(name);
    const tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connectedToTenth = p.house === 10 || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord) || tenth.aspectingHere.includes(name);
    const connectedToEleventh = p.house === 11 || p.conjunctWith.includes(eleventh.lord) || p.aspectedBy.includes(eleventh.lord) || eleventh.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Neutral';
    if ((connectedToTenth || connectedToEleventh) && result === 'Neutral') result = 'Supporting';
    return {
      planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId),
      connectedToTenth, connectedToEleventh,
      evidence: [
        `${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`,
        p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.',
        p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.',
        `Connected to 10th: ${connectedToTenth ? 'Yes' : 'No'}. Connected to 11th: ${connectedToEleventh ? 'Yes' : 'No'}.`
      ]
    };
  }

  NS.assessNatalCareerPromise = function () {
    const chart = NS.getChartData();
    const tenth = classifyHouse(10, 'PT-NATAL-010');
    const eleventh = classifyHouse(11, 'PT-NATAL-011');
    const second = classifyHouse(2, 'PT-NATAL-002');
    const sixth = classifyHouse(6, 'PT-NATAL-006');
    const sun = classifyKaraka('Sun', 'PT-NATAL-SUN');
    const saturn = classifyKaraka('Saturn', 'PT-NATAL-SATURN');
    const jupiter = classifyKaraka('Jupiter', 'PT-NATAL-JUPITER');

    // 2nd vs 10th/11th relationship — distinguishes raise-vs-designation.
    const tenthLordP = chart.planets.find(p => p.name === tenth.lord);
    const secondLordP = chart.planets.find(p => p.name === second.lord);
    const tenthSecondConnected = tenth.lord === second.lord || tenthLordP.sign === secondLordP.sign || (tenthLordP.aspectedBy || []).includes(second.lord) || (secondLordP.aspectedBy || []).includes(tenth.lord);

    const strongCount = [tenth, eleventh, second, sixth].filter(h => h.result === 'Strong' || h.result === 'Supporting').length
      + [sun, saturn].filter(k => k.result === 'Strong' || k.result === 'Supporting').length;
    const challengingCount = [tenth, eleventh, second, sixth].filter(h => h.result === 'Challenging').length + [sun, saturn].filter(k => k.result === 'Challenging').length;
    const overall = strongCount >= challengingCount + 2 ? 'The natal chart supports professional advancement.'
      : challengingCount > strongCount ? 'The natal chart shows meaningful challenges to easy professional advancement; advancement, if it comes, may require more sustained effort.'
      : 'The natal chart moderately supports professional advancement; timing and context (service vs. business, sector) matter.';

    return { tenthHouse: tenth, eleventhHouse: eleventh, secondHouse: second, sixthHouse: sixth, sun, saturn, jupiter, tenthSecondConnected, overall };
  };

  // ---------------------------------------------------------------
  // 4. PROMOTION SIGNATURE ENGINE (Step 5) — structured evidence,
  //    never a bare numeric score.
  // ---------------------------------------------------------------
  function housesConnected(h1, h2, chart) {
    if (h1.lord === h2.lord) return { connected: true, how: `${h1.house}th and ${h2.house}th houses share the same lord (${h1.lord}).` };
    const l1 = chart.planets.find(p => p.name === h1.lord), l2 = chart.planets.find(p => p.name === h2.lord);
    if (l1.sign === l2.sign) return { connected: true, how: `${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord) are conjunct in ${l1.sign}.` };
    if ((l1.aspectedBy || []).includes(h2.lord) || (l2.aspectedBy || []).includes(h1.lord)) return { connected: true, how: `${h1.lord} and ${h2.lord} (${h1.house}th/${h2.house}th lords) aspect each other.` };
    if (SIGN_LORD[l1.sign] === h2.lord && SIGN_LORD[l2.sign] === h1.lord) return { connected: true, how: `${h1.lord} and ${h2.lord} are in mutual sign exchange (Parivartana).` };
    return { connected: false, how: `No conjunction, aspect, or exchange found between ${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord).` };
  }

  NS.buildPromotionSignature = function () {
    const chart = NS.getChartData();
    const tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11), second = NS.getHouseSnapshot(2), sixth = NS.getHouseSnapshot(6);
    const evidence = [];

    const r1 = housesConnected(tenth, eleventh, chart);
    evidence.push({ rule: ruleById('PT-PAIR-10-11'), present: r1.connected, text: r1.how });

    const r2 = housesConnected(tenth, second, chart);
    evidence.push({ rule: ruleById('PT-PAIR-10-2'), present: r2.connected, text: r2.how });

    const tenthEleventhConnected = r1.connected;
    const sixthConnected = housesConnected(tenth, sixth, chart).connected || housesConnected(eleventh, sixth, chart).connected;
    evidence.push({ rule: ruleById('PT-PAIR-10-6'), present: tenthEleventhConnected && sixthConnected, text: sixthConnected ? `6th house/lord connects with the 10th/11th axis${tenthEleventhConnected ? ' (which is itself connected)' : ' (10th/11th not directly connected)'}.` : 'No 6th-house connection to the 10th/11th axis found.' });

    const sunP = NS.getPlanetSnapshot('Sun');
    const sunCareerConnected = sunP.house === 10 || sunP.house === 11 || sunP.conjunctWith.includes(tenth.lord) || sunP.conjunctWith.includes(eleventh.lord) || sunP.aspectedBy.includes(tenth.lord) || sunP.aspectedBy.includes(eleventh.lord) || tenth.aspectingHere.includes('Sun') || eleventh.aspectingHere.includes('Sun');
    evidence.push({ rule: ruleById('PT-SUN-CAREER'), present: sunCareerConnected, text: sunCareerConnected ? 'Sun is connected (placement/conjunction/aspect) with the 10th/11th houses or their lords.' : 'Sun shows no direct connection to the 10th/11th houses or their lords.' });

    const satP = NS.getPlanetSnapshot('Saturn');
    const satCareerConnected = [10, 6, 11].includes(satP.house) || satP.conjunctWith.includes(tenth.lord) || satP.conjunctWith.includes(sixth.lord) || satP.conjunctWith.includes(eleventh.lord) || satP.aspectedBy.includes(tenth.lord) || tenth.aspectingHere.includes('Saturn') || eleventh.aspectingHere.includes('Saturn') || sixth.aspectingHere.includes('Saturn');
    evidence.push({ rule: ruleById('PT-SATURN-CAREER'), present: satCareerConnected, text: satCareerConnected ? 'Saturn is connected (placement/conjunction/aspect) with the 10th/6th/11th houses or their lords.' : 'Saturn shows no direct connection to the 10th/6th/11th houses or their lords.' });

    const careerLords = [tenth.lord, eleventh.lord, second.lord];
    const yogas = (state.yogas ? state.yogas.rows : []).filter(y => y.present && (y.planets || []).some(p => careerLords.includes(p)));
    evidence.push({ rule: ruleById('PT-YOGA-001'), present: yogas.length > 0, text: yogas.length ? `Career-relevant Raja Yoga(s) present: ${yogas.map(y => y.name).join(', ')}.` : 'No existing-engine Raja Yoga involves the 10th/11th/2nd lords.' });

    const d10 = NS.assessD10Confirmation();
    evidence.push({ rule: ruleById('PT-D10-001'), present: d10.points >= 3, text: `${d10.level} (${d10.points} supporting factor(s)).` });

    return evidence;
  };

  // ---------------------------------------------------------------
  // 5. VIMSHOTTARI DASHA — Career Activation Map (Steps 7-10). Reuses
  //    state.dasha (MD/AD eagerly computed) and buildSubPeriods()
  //    (also existing) for on-demand PD, bounded to ADs already
  //    flagged career-relevant.
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.careerFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (CAREER_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => CAREER_HOUSES.includes(h)).join(', ')}.`);
    if (CAREER_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (lordName === 'Sun') factors.push('Sun is the natural authority/recognition karaka.');
    if (lordName === 'Saturn') factors.push('Saturn is the natural service/hierarchy karaka.');
    const tenthConnection = lordName === tenth.lord || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord);
    const eleventhConnection = lordName === eleventh.lord || p.conjunctWith.includes(eleventh.lord) || p.aspectedBy.includes(eleventh.lord);
    if (tenthConnection && lordName !== tenth.lord) factors.push(`${lordName} is connected to the 10th lord (${tenth.lord}) by conjunction/aspect.`);
    if (eleventhConnection && lordName !== eleventh.lord) factors.push(`${lordName} is connected to the 11th lord (${eleventh.lord}) by conjunction/aspect.`);
    const d10 = NS.getD10();
    const pD10 = d10.planets.find(x => x.name === lordName);
    const d10Confirmation = pD10.d10House === 10 || pD10.d10House === 11 || lordName === d10.tenthLord || lordName === d10.eleventhLord;
    if (d10Confirmation) factors.push(`${lordName} is connected to the D10 career axis (10th/11th).`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, tenthConnection, eleventhConnection, d10Confirmation };
  };

  NS.buildCareerActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.careerFactorsForLord(md.lord);
        const adFactors = NS.careerFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.careerFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const tenthConnection = mdFactors.tenthConnection || adFactors.tenthConnection || pdFactors.tenthConnection;
          const eleventhConnection = mdFactors.eleventhConnection || adFactors.eleventhConnection || pdFactors.eleventhConnection;
          const d10Confirmation = mdFactors.d10Confirmation || adFactors.d10Confirmation || pdFactors.d10Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({
            mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord,
            startDate: pd.startDate, endDate: pd.endDate,
            activatedHouses, tenthConnection, eleventhConnection, d10Confirmation,
            matchCount, reasons
          });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 6. TRANSIT (Steps 12-13) — supporting confirmation only.
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11);
    const sunNatal = NS.getPlanetSnapshot('Sun'), moonNatal = NS.getPlanetSnapshot('Moon');
    const tenthLordNatal = NS.getPlanetSnapshot(tenth.lord), eleventhLordNatal = NS.getPlanetSnapshot(eleventh.lord);

    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    function checkBody(name, ruleId) {
      const signIdx = transitSignIndex(name);
      const house = ((signIdx - ascIndex + 12) % 12) + 1;
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default;
      const aspectsTenth = house === 10 || offsets.some(o => (signIdx + (o - 1)) % 12 === SIGNS.indexOf(tenth.sign));
      const aspectsEleventh = house === 11 || offsets.some(o => (signIdx + (o - 1)) % 12 === SIGNS.indexOf(eleventh.sign));
      const aspectsTenthLord = offsets.some(o => (signIdx + (o - 1)) % 12 === tenthLordNatal.signIndex) || signIdx === tenthLordNatal.signIndex;
      const aspectsEleventhLord = offsets.some(o => (signIdx + (o - 1)) % 12 === eleventhLordNatal.signIndex) || signIdx === eleventhLordNatal.signIndex;
      const aspectsSun = offsets.some(o => (signIdx + (o - 1)) % 12 === sunNatal.signIndex) || signIdx === sunNatal.signIndex;
      const aspectsMoon = offsets.some(o => (signIdx + (o - 1)) % 12 === moonNatal.signIndex) || signIdx === moonNatal.signIndex;
      const active = aspectsTenth || aspectsEleventh || aspectsTenthLord || aspectsEleventhLord || aspectsSun || aspectsMoon;
      const reasons = [];
      if (house === 10) reasons.push(`Transiting ${name} is in the natal 10th house.`);
      if (house === 11) reasons.push(`Transiting ${name} is in the natal 11th house.`);
      if (aspectsTenth && house !== 10) reasons.push(`Transiting ${name} aspects the natal 10th house.`);
      if (aspectsEleventh && house !== 11) reasons.push(`Transiting ${name} aspects the natal 11th house.`);
      if (aspectsTenthLord) reasons.push(`Transiting ${name} is conjunct/aspecting the natal 10th lord's sign (${tenthLordNatal.sign}).`);
      if (aspectsEleventhLord) reasons.push(`Transiting ${name} is conjunct/aspecting the natal 11th lord's sign (${eleventhLordNatal.sign}).`);
      if (aspectsSun) reasons.push(`Transiting ${name} is conjunct/aspecting natal Sun.`);
      if (aspectsMoon) reasons.push(`Transiting ${name} is conjunct/aspecting natal Moon.`);
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return { date, jupiter: checkBody('Jupiter', 'PT-TRANSIT-JUP'), saturn: checkBody('Saturn', 'PT-TRANSIT-SAT') };
  };

  // ---------------------------------------------------------------
  // 7. DELAY/OBSTRUCTION ANALYSIS (Step 16)
  // ---------------------------------------------------------------
  NS.assessDelayFactors = function (candidate) {
    const chart = NS.getChartData();
    const d10 = NS.assessD10Confirmation();
    const eighth = NS.getHouseSnapshot(8), twelfth = NS.getHouseSnapshot(12);
    const tenthLordP = chart.planets.find(p => p.name === NS.getHouseSnapshot(10).lord);
    const eleventhLordP = chart.planets.find(p => p.name === NS.getHouseSnapshot(11).lord);
    const flags = [];
    if (DUSTHANA.includes(Number(tenthLordP.house))) flags.push('10th lord occupies a Dusthana house.');
    if (DUSTHANA.includes(Number(eleventhLordP.house))) flags.push('11th lord occupies a Dusthana house.');
    if (d10.points <= 1) flags.push('D10 shows only mixed/weak confirmation for this career axis.');
    const dashaLord = chart.planets.find(p => p.name === candidate.pratyantar);
    if (dashaLord && DUSTHANA.includes(Number(dashaLord.house))) flags.push(`Current Pratyantardasha lord (${candidate.pratyantar}) is natally placed in a Dusthana house.`);
    const sixthHeavy = candidate.activatedHouses.includes(6) && !candidate.tenthConnection && !candidate.eleventhConnection;
    if (sixthHeavy) flags.push('6th house is activated without a direct 10th/11th connection — suggests workload/competition more than advancement.');
    let interpretation;
    if (!flags.length) interpretation = 'No significant delay/obstruction factors found for this period.';
    else if (flags.length >= 3) interpretation = 'This period may produce more work, responsibility, or competition rather than a clean promotion — manifestation is uncertain, not denied.';
    else interpretation = 'This period shows some mixed indications alongside its career activation — actual promotion is plausible but not assured; watch for delayed recognition.';
    return { flags, interpretation, rule: ruleById('PT-DELAY-001') };
  };

  // ---------------------------------------------------------------
  // 8. EVENT CLASSIFICATION (Step 15)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, d10, transit, signature, natalPromise) {
    const tenth = candidate.tenthConnection, eleventh = candidate.eleventhConnection;
    const secondConnected = natalPromise.tenthSecondConnected;
    const d10Confirms = d10.points >= 3;
    const sunStrong = natalPromise.sun.result === 'Strong' || natalPromise.sun.result === 'Supporting';
    const jupiterActive = transit.jupiter.active;
    const saturnActive = transit.saturn.active;
    const sixthInvolved = candidate.activatedHouses.includes(6);

    if (tenth && eleventh && secondConnected && d10Confirms) return { label: 'Promotion + Financial Improvement', rule: ruleById('PT-EVENT-001') };
    if (tenth && eleventh && d10Confirms) return { label: 'Promotion / Designation Rise', rule: ruleById('PT-EVENT-001') };
    if (tenth && saturnActive && sixthInvolved) return { label: 'Responsibility Increase', rule: ruleById('PT-EVENT-001') };
    if (tenth && sunStrong && (eleventh || jupiterActive)) return { label: 'Recognition / Visibility', rule: ruleById('PT-EVENT-001') };
    if (tenth && !eleventh && !d10Confirms) return { label: 'Job Change (unconfirmed — evaluate change indicators manually)', rule: ruleById('PT-EVENT-001') };
    return { label: 'Career Activation (evidence insufficient for a specific classification)', rule: ruleById('PT-EVENT-001') };
  };

  // ---------------------------------------------------------------
  // 9. CANDIDATE PROMOTION WINDOWS (Step 14)
  // ---------------------------------------------------------------
  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate);
    const merged = [];
    sorted.forEach(c => {
      const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) {
        last.endDate = c.endDate; last.members.push(c);
      } else merged.push(Object.assign({}, c, { members: [c] }));
    });
    return merged;
  }

  NS.buildCandidateWindows = function (horizonYears) {
    const chart = NS.getChartData();
    const activationMap = NS.buildCareerActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const natalPromise = NS.assessNatalCareerPromise();
    const signature = NS.buildPromotionSignature();
    const d10 = NS.assessD10Confirmation();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const delay = NS.assessDelayFactors(c);
      const event = NS.classifyEvent(c, d10, transit, signature, natalPromise);
      const convergenceFactors = [c.tenthConnection, c.eleventhConnection, c.d10Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      return Object.assign({}, c, { transit, delay, event, convergenceFactors, qualification });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged, natalPromise, signature, d10 };
  };

  // ---------------------------------------------------------------
  // 10. HISTORICAL VALIDATION (Step 17)
  // ---------------------------------------------------------------
  NS.validateHistoricalDate = function (eventDate) {
    const chart = NS.getChartData();
    if (!chart || !state.dasha || !state.dasha.length) return null;
    const mdIdx = findCurrentIndex(state.dasha, eventDate);
    if (mdIdx < 0) return { eventDate, inRange: false };
    const md = state.dasha[mdIdx];
    const adIdx = findCurrentIndex(md.antardashas, eventDate);
    const ad = adIdx >= 0 ? md.antardashas[adIdx] : null;
    let pd = null;
    if (ad) {
      const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
      const pdIdx = findCurrentIndex(pds, eventDate);
      pd = pdIdx >= 0 ? pds[pdIdx] : null;
    }
    const tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11), second = NS.getHouseSnapshot(2), sixth = NS.getHouseSnapshot(6);
    function activated(lordName) {
      if (!lordName) return false;
      const f = NS.careerFactorsForLord(lordName);
      return f.relevant;
    }
    const transit = NS.transitCheckAt(eventDate);
    const d10 = NS.assessD10Confirmation();
    return {
      eventDate, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      tenthActivation: activated(md.lord) || activated(ad && ad.lord) || activated(pd && pd.lord),
      eleventhActivation: [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean).some(l => l === eleventh.lord || NS.careerFactorsForLord(l).eleventhConnection),
      secondActivation: [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean).some(l => l === second.lord),
      sixthActivation: [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean).some(l => l === sixth.lord),
      d10Level: d10.level,
      jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Career Promise', anchor: 'pt-sec-promise' },
    { id: 2, label: '10th Lord', anchor: 'pt-sec-promise' },
    { id: 3, label: '10th connected with 11th', anchor: 'pt-sec-signature' },
    { id: 4, label: 'Career advancement promise identified', anchor: 'pt-sec-signature' },
    { id: 5, label: 'Current Mahadasha', anchor: 'pt-sec-dasha' },
    { id: 6, label: 'Current Antardasha', anchor: 'pt-sec-dasha' },
    { id: 7, label: 'Current Pratyantardasha', anchor: 'pt-sec-dasha' },
    { id: 8, label: '10th + 11th activated', anchor: 'pt-sec-windows' },
    { id: 9, label: 'D10 confirms career axis', anchor: 'pt-sec-d10' },
    { id: 10, label: 'Jupiter transit support', anchor: 'pt-sec-windows' },
    { id: 11, label: 'Saturn transit support', anchor: 'pt-sec-windows' },
    { id: 12, label: 'Candidate window identified', anchor: 'pt-sec-windows' },
    { id: 13, label: 'Event classification', anchor: 'pt-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    const cacheKey = horizon;
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === cacheKey) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalCareerPromise();
    log(calculationLog, '[02] 10th/11th/2nd/6th houses and Sun/Saturn/Jupiter analysed');
    const signature = NS.buildPromotionSignature();
    log(calculationLog, '[03] Promotion signature evidence built');
    const d10 = NS.assessD10Confirmation();
    log(calculationLog, '[04] D10 confirmation computed: ' + d10.level);

    const missing = [];
    let windowsResult = { available: false, windows: [] };
    let currentDasha = null;
    if (!state.dasha || !state.dasha.length) {
      missing.push('Vimshottari Dasha');
    } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx];
        const aIdx = findCurrentIndex(md.antardashas);
        const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null;
        if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = {
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.careerFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.careerFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.careerFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[06] Career Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate promotion windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['PT-NATAL-010', 'PT-NATAL-011', 'PT-NATAL-002', 'PT-NATAL-006', 'PT-NATAL-SUN', 'PT-NATAL-SATURN', 'PT-NATAL-JUPITER', 'PT-PAIR-10-11', 'PT-PAIR-10-2', 'PT-PAIR-10-6', 'PT-SUN-CAREER', 'PT-SATURN-CAREER', 'PT-YOGA-001', 'PT-D10-001']);
    if (windowsResult.available) { rulesUsedIds.add('PT-DASHA-001'); rulesUsedIds.add('PT-DASHA-002'); rulesUsedIds.add('PT-TRANSIT-JUP'); rulesUsedIds.add('PT-TRANSIT-SAT'); rulesUsedIds.add('PT-DELAY-001'); rulesUsedIds.add('PT-EVENT-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, signature, d10Confirmation: d10, currentDasha,
      candidateWindows: windowsResult.windows, horizonYears: horizon,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon: cacheKey, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
