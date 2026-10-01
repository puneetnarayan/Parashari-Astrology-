/* =========================================================
   JOB CHANGE TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/functional/aspect/dasha/D10/transit calculations
   throughout — same architecture as Marriage Timing and Promotion
   Timing (js/promotionTiming/promotionTimingEngine.js), with
   job-change-specific houses/significators/rules, and an explicit
   cross-check against window.PromotionTiming's own output to
   implement the mandatory Promotion-vs-Job-Change distinction.
   Exposed only as window.JobChangeTiming (namespaced). UI code lives
   entirely in jobChangeTimingUI.js — this file returns plain data only.
   ========================================================= */

window.JobChangeTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, result }

  const CHANGE_HOUSES = [3, 6, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[JobChangeTiming]', text); }
  function ruleById(id) { return (window.JOB_CHANGE_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER — reuses state.chart / state.dasha.
  // ---------------------------------------------------------------
  NS.getChartData = function () { return state.chart || null; };

  NS.getPlanetSnapshot = function (name) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const p = chart.planets.find(pl => pl.name === name);
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
  // 2. D10 (DASHAMSHA) — reuses vargaPosition/detailedDignity. Same
  //    functions Promotion Timing already uses, extended here to also
  //    read D10 6th/12th.
  // ---------------------------------------------------------------
  NS.getD10 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD10 = vargaPosition(chart.ascendant.longitude, 'D10');
    const ascD10SignIndex = SIGNS.indexOf(ascD10.sign);
    const d10LagnaLord = SIGN_LORD[ascD10.sign];
    function houseSign(h) { return SIGNS[(ascD10SignIndex + h - 1) % 12]; }
    const planets = chart.planets.map(p => {
      const d10 = vargaPosition(p.longitude, 'D10');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d10DegreeInSign = normalizeDegrees(d10.longitude) % 30;
      const d10Dignity = isClassical ? detailedDignity(p.name, d10.sign, d10DegreeInSign).tier : 'Neutral';
      const d10House = ((SIGNS.indexOf(d10.sign) - ascD10SignIndex + 12) % 12) + 1;
      return { name: p.name, d10Sign: d10.sign, d10House, d10Dignity };
    });
    return {
      ascendantSign: ascD10.sign, lagnaLord: d10LagnaLord,
      tenthSign: houseSign(10), tenthLord: SIGN_LORD[houseSign(10)],
      sixthSign: houseSign(6), sixthLord: SIGN_LORD[houseSign(6)],
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      twelfthSign: houseSign(12), twelfthLord: SIGN_LORD[houseSign(12)],
      planets,
      tenthOccupants: planets.filter(p => p.d10House === 10).map(p => p.name),
      sixthOccupants: planets.filter(p => p.d10House === 6).map(p => p.name),
      twelfthOccupants: planets.filter(p => p.d10House === 12).map(p => p.name)
    };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d10.planets.find(p => p.name === name); return x ? x.d10Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d10.tenthLord))) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${dig(d10.tenthLord)} in D10.`); }
    else if (dig(d10.tenthLord) === 'Debilitated') evidence.push(`D10 10th lord (${d10.tenthLord}) is Debilitated in D10.`);
    if (strong.includes(dig(d10.sixthLord))) { points += 1; evidence.push(`D10 6th lord (${d10.sixthLord}) is ${dig(d10.sixthLord)} in D10.`); }
    if (strong.includes(dig(d10.twelfthLord))) { points += 1; evidence.push(`D10 12th lord (${d10.twelfthLord}) is ${dig(d10.twelfthLord)} in D10.`); }
    if (strong.includes(dig(d10.eleventhLord))) { points += 1; evidence.push(`D10 11th lord (${d10.eleventhLord}) is ${dig(d10.eleventhLord)} in D10.`); }
    if (strong.includes(dig(d10.lagnaLord))) { points += 1; evidence.push(`D10 Lagna lord (${d10.lagnaLord}) is ${dig(d10.lagnaLord)} in D10.`); }
    if (d10.tenthOccupants.length) { points += 1; evidence.push(`D10 10th house occupied by: ${d10.tenthOccupants.join(', ')}.`); }
    if (d10.sixthOccupants.length) { points += 1; evidence.push(`D10 6th house occupied by: ${d10.sixthOccupants.join(', ')}.`); }
    if (d10.twelfthOccupants.length) { points += 1; evidence.push(`D10 12th house occupied by: ${d10.twelfthOccupants.join(', ')}.`); }
    if (strong.includes(dig('Sun'))) { points += 1; evidence.push(`Sun is ${dig('Sun')} in D10.`); }
    if (strong.includes(dig('Saturn'))) { points += 1; evidence.push(`Saturn is ${dig('Saturn')} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for the career-change axis (10th/6th/12th/11th/Lagna lords, Sun, Saturn).');
    const level = points >= 6 ? 'Strong D10 confirmation' : points >= 4 ? 'D10 confirmation' : points >= 2 ? 'Partial D10 confirmation' : points >= 1 ? 'Mixed D10 indication' : 'Weak D10 confirmation';
    return { d10, points, level, evidence, rule: ruleById('JC-D10-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL CAREER-CHANGE PROMISE (Steps 3-5, 7)
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

  function classifyKaraka(name, ruleId) {
    const p = NS.getPlanetSnapshot(name);
    const tenth = NS.getHouseSnapshot(10);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connectedToTenth = p.house === 10 || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord) || tenth.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Neutral';
    if (connectedToTenth && result === 'Neutral') result = 'Supporting';
    return {
      planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connectedToTenth,
      evidence: [
        `${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`,
        p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.',
        p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.',
        `Connected to 10th: ${connectedToTenth ? 'Yes' : 'No'}.`
      ]
    };
  }

  function relationLabel(a, b) { return a === b ? 'Same planet' : relationBetween(a, b); }

  function housesConnected(h1, h2, chart) {
    if (h1.lord === h2.lord) return { connected: true, how: `${h1.house}th and ${h2.house}th houses share the same lord (${h1.lord}).` };
    const l1 = chart.planets.find(p => p.name === h1.lord), l2 = chart.planets.find(p => p.name === h2.lord);
    if (l1.sign === l2.sign) return { connected: true, how: `${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord) are conjunct in ${l1.sign}.` };
    if ((l1.aspectedBy || []).includes(h2.lord) || (l2.aspectedBy || []).includes(h1.lord)) return { connected: true, how: `${h1.lord} and ${h2.lord} (${h1.house}th/${h2.house}th lords) aspect each other.` };
    if (SIGN_LORD[l1.sign] === h2.lord && SIGN_LORD[l2.sign] === h1.lord) return { connected: true, how: `${h1.lord} and ${h2.lord} are in mutual sign exchange (Parivartana).` };
    return { connected: false, how: `No conjunction, aspect, or exchange found between ${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord).` };
  }

  NS.assessNatalChangePromise = function () {
    const chart = NS.getChartData();
    const third = classifyHouse(3, 'JC-NATAL-003');
    const sixth = classifyHouse(6, 'JC-NATAL-006');
    const ninth = classifyHouse(9, 'JC-NATAL-009');
    const tenth = classifyHouse(10, 'JC-NATAL-010');
    const eleventh = classifyHouse(11, 'JC-NATAL-011');
    const twelfth = classifyHouse(12, 'JC-NATAL-012');
    const saturn = classifyKaraka('Saturn', 'JC-NATAL-SATURN');
    const sun = classifyKaraka('Sun', 'JC-NATAL-SUN');
    const mercury = classifyKaraka('Mercury', 'JC-NATAL-MERCURY');
    const rahu = classifyKaraka('Rahu', 'JC-NATAL-RAHU');

    const tenthH = NS.getHouseSnapshot(10), sixthH = NS.getHouseSnapshot(6), ninthH = NS.getHouseSnapshot(9), thirdH = NS.getHouseSnapshot(3), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);
    const relationships = [
      { id: 'JC-PAIR-10-6', a: tenthH, b: sixthH }, { id: 'JC-PAIR-10-12', a: tenthH, b: twelfthH },
      { id: 'JC-PAIR-10-3', a: tenthH, b: thirdH }, { id: 'JC-PAIR-10-9', a: tenthH, b: ninthH },
      { id: 'JC-PAIR-10-11', a: tenthH, b: eleventhH }, { id: 'JC-PAIR-6-12', a: sixthH, b: twelfthH }
    ].map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const connectedCount = relationships.filter(r => r.connected).length;
    const strongCount = [third, sixth, ninth, tenth, eleventh, twelfth].filter(h => h.result === 'Strong' || h.result === 'Supporting').length + connectedCount;
    const challengingCount = [third, sixth, ninth, tenth, eleventh, twelfth].filter(h => h.result === 'Challenging').length;
    const overall = connectedCount >= 2 ? 'The natal chart contains meaningful indications of professional change.' : connectedCount === 1 ? 'The natal chart shows a single moderate indication of professional change.' : 'The natal chart shows limited natal indication of professional change; any apparent activation should be weighed cautiously.';

    return { thirdHouse: third, sixthHouse: sixth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth, saturn, sun, mercury, rahu, relationships, connectedCount, overall };
  };

  // ---------------------------------------------------------------
  // 4. CHANGE SIGNATURE ENGINE (Step 6)
  // ---------------------------------------------------------------
  NS.buildChangeSignature = function () {
    const promise = NS.assessNatalChangePromise();
    const d10 = NS.assessD10Confirmation();
    return {
      employerChange: { present: promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-12').connected || promise.relationships.find(r => r.rule.id === 'JC-PAIR-6-12').connected, rules: ['JC-PAIR-10-12', 'JC-PAIR-6-12'].map(ruleById) },
      newOpportunity: { present: promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-11').connected && (promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-9').connected || promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-3').connected), rules: ['JC-PAIR-10-11', 'JC-PAIR-10-9', 'JC-PAIR-10-3'].map(ruleById) },
      transfer: { present: promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-3').connected && promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-12').connected, rules: ['JC-PAIR-10-3', 'JC-PAIR-10-12'].map(ruleById) },
      foreignJob: { present: (promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-9').connected || promise.relationships.find(r => r.rule.id === 'JC-PAIR-10-12').connected) && promise.rahu.connectedToTenth, rules: ['JC-NATAL-RAHU'].map(ruleById) },
      separation: { present: promise.relationships.find(r => r.rule.id === 'JC-PAIR-6-12').connected && promise.twelfthHouse.result === 'Challenging', rules: ['JC-PAIR-6-12', 'JC-DELAY-001'].map(ruleById) },
      d10Level: d10.level, d10Points: d10.points
    };
  };

  // ---------------------------------------------------------------
  // 5. VIMSHOTTARI DASHA — Job Change Activation Map (Steps 9-11).
  //    Reuses state.dasha + buildSubPeriods(), bounded to ADs already
  //    flagged change-relevant.
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.changeFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (CHANGE_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => CHANGE_HOUSES.includes(h)).join(', ')}.`);
    if (CHANGE_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const tenth = NS.getHouseSnapshot(10);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === 'Saturn') factors.push('Saturn is the natural employment/service karaka.');
    if (lordName === 'Sun') factors.push('Sun is the natural authority karaka.');
    const tenthConnection = lordName === tenth.lord || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord);
    if (tenthConnection && lordName !== tenth.lord) factors.push(`${lordName} is connected to the 10th lord (${tenth.lord}) by conjunction/aspect.`);
    const d10 = NS.getD10();
    const pD10 = d10.planets.find(x => x.name === lordName);
    const d10Confirmation = [6, 10, 11, 12].includes(pD10.d10House) || [d10.tenthLord, d10.sixthLord, d10.twelfthLord].includes(lordName);
    if (d10Confirmation) factors.push(`${lordName} is connected to the D10 career-change axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, tenthConnection, d10Confirmation };
  };

  NS.buildChangeActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.changeFactorsForLord(md.lord);
        const adFactors = NS.changeFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.changeFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const tenthConnection = mdFactors.tenthConnection || adFactors.tenthConnection || pdFactors.tenthConnection;
          const d10Confirmation = mdFactors.d10Confirmation || adFactors.d10Confirmation || pdFactors.d10Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, tenthConnection, d10Confirmation, matchCount, reasons });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 6. TRANSIT (Steps 13-15) — Jupiter/Saturn primary, Rahu/Ketu
  //    secondary, all supporting confirmation only.
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const tenth = NS.getHouseSnapshot(10), sixth = NS.getHouseSnapshot(6), ninth = NS.getHouseSnapshot(9), eleventh = NS.getHouseSnapshot(11), twelfth = NS.getHouseSnapshot(12);
    const sunNatal = NS.getPlanetSnapshot('Sun'), moonNatal = NS.getPlanetSnapshot('Moon');
    const tenthLordNatal = NS.getPlanetSnapshot(tenth.lord);

    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    function checkBody(name, houseSet, ruleId) {
      const signIdx = transitSignIndex(name);
      const house = ((signIdx - ascIndex + 12) % 12) + 1;
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default;
      const reasons = [];
      let active = false;
      houseSet.forEach(h => {
        const hd = NS.getHouseSnapshot(h);
        const targetSignIdx = SIGNS.indexOf(hd.sign);
        if (house === h) { active = true; reasons.push(`Transiting ${name} is in the natal ${h}th house.`); }
        else if (offsets.some(o => (signIdx + (o - 1)) % 12 === targetSignIdx)) { active = true; reasons.push(`Transiting ${name} aspects the natal ${h}th house.`); }
      });
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === tenthLordNatal.signIndex) || signIdx === tenthLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 10th lord's sign (${tenthLordNatal.sign}).`); }
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === sunNatal.signIndex) || signIdx === sunNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting natal Sun.`); }
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === moonNatal.signIndex) || signIdx === moonNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting natal Moon.`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [10, 11, 9, 6], 'JC-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [10, 6, 11, 12], 'JC-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [10, 6, 12, 9], 'JC-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [10, 6, 12, 9], 'JC-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 7. ADVERSE/SEPARATION CONTEXT (part of Job Loss classification)
  // ---------------------------------------------------------------
  NS.assessAdverseContext = function (candidate) {
    const chart = NS.getChartData();
    const d10 = NS.assessD10Confirmation();
    const tenthLordP = chart.planets.find(p => p.name === NS.getHouseSnapshot(10).lord);
    const sixthLordP = chart.planets.find(p => p.name === NS.getHouseSnapshot(6).lord);
    const twelfthLordP = chart.planets.find(p => p.name === NS.getHouseSnapshot(12).lord);
    const flags = [];
    if (DUSTHANA.includes(Number(tenthLordP.house))) flags.push('10th lord occupies a Dusthana house.');
    if (DUSTHANA.includes(Number(sixthLordP.house))) flags.push('6th lord occupies a Dusthana house.');
    if (d10.points <= 1) flags.push('D10 shows weak/mixed confirmation for this career-change axis.');
    const dashaLord = chart.planets.find(p => p.name === candidate.pratyantar);
    if (dashaLord && Number(dashaLord.house) === 8) flags.push(`Current Pratyantardasha lord (${candidate.pratyantar}) is natally placed in the 8th house.`);
    return { flags, hasAdverseContext: flags.length >= 2, rule: ruleById('JC-DELAY-001') };
  };

  // ---------------------------------------------------------------
  // 8. EVENT CLASSIFICATION (Step 17)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, signature, transit, adverse) {
    const d10Confirms = signature.d10Points >= 4;
    if (signature.separation.present && adverse.hasAdverseContext) return { label: 'Job Separation / Loss (evidence-supported — review adverse factors)', rule: ruleById('JC-EVENT-001') };
    if (signature.foreignJob.present) return { label: 'Foreign Job', rule: ruleById('JC-EVENT-001') };
    if (signature.employerChange.present && d10Confirms) return { label: 'Employer / Organization Change', rule: ruleById('JC-EVENT-001') };
    if (signature.newOpportunity.present && transit.jupiter.active && d10Confirms) return { label: 'Better Job / Career Opportunity', rule: ruleById('JC-EVENT-001') };
    if (candidate.activatedHouses.includes(3) && candidate.tenthConnection && d10Confirms) return { label: 'Role / Function Change', rule: ruleById('JC-EVENT-001') };
    if (candidate.activatedHouses.includes(3) && signature.employerChange.present) return { label: 'Transfer / Workplace Change', rule: ruleById('JC-EVENT-001') };
    return { label: 'Career Change Activation (evidence insufficient for a specific classification)', rule: ruleById('JC-EVENT-001') };
  };

  // ---------------------------------------------------------------
  // 9. PROMOTION VS. JOB CHANGE (Step 18) — cross-checks against the
  //    existing Promotion Timing module's own output rather than
  //    re-deriving promotion logic.
  // ---------------------------------------------------------------
  NS.comparePromotionAndJobChange = function (candidate) {
    if (!window.PromotionTiming) return null;
    const ptResult = window.PromotionTiming.refresh();
    if (!ptResult) return null;
    const overlapping = ptResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    const promotionStrength = overlapping.event.label.startsWith('Promotion') ? 'Strong' : 'Moderate';
    const jobChangeStrength = candidate.tenthConnection && candidate.d10Confirmation ? 'Strong' : 'Moderate';
    return {
      overlapping: true, promotionEvent: overlapping.event.label, promotionStrength, jobChangeStrength,
      interpretation: `The period strongly activates career advancement. The manifestation may occur either through advancement within the existing organization (Promotion: ${overlapping.event.label}) or through a change of organization/role (Job Change evidence: ${jobChangeStrength}). Additional Dasha/transit evidence should be examined before classifying it definitively.`,
      rule: ruleById('JC-DISTINGUISH-001')
    };
  };

  // ---------------------------------------------------------------
  // 10. CANDIDATE WINDOWS (Step 16)
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
    const activationMap = NS.buildChangeActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const signature = NS.buildChangeSignature();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const adverse = NS.assessAdverseContext(c);
      const event = NS.classifyEvent(c, signature, transit, adverse);
      const promotionComparison = NS.comparePromotionAndJobChange(c);
      const convergenceFactors = [c.tenthConnection, c.d10Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      return Object.assign({}, c, { transit, adverse, event, promotionComparison, convergenceFactors, qualification });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged, signature };
  };

  // ---------------------------------------------------------------
  // 11. HISTORICAL VALIDATION (Step 22)
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
    if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pdIdx = findCurrentIndex(pds, eventDate); pd = pdIdx >= 0 ? pds[pdIdx] : null; }
    function activated(lordName) { return lordName ? NS.changeFactorsForLord(lordName).relevant : false; }
    const transit = NS.transitCheckAt(eventDate);
    const d10 = NS.assessD10Confirmation();
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.changeFactorsForLord(l).activatedHouses.includes(h)); }
    return {
      eventDate, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      thirdActivation: houseActivated(3), sixthActivation: houseActivated(6), ninthActivation: houseActivated(9),
      tenthActivation: lords.some(activated), eleventhActivation: houseActivated(11), twelfthActivation: houseActivated(12),
      d10Level: d10.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Career-Change Promise', anchor: 'jc-sec-promise' },
    { id: 2, label: '10th lord connected with 12th/6th/3rd/9th', anchor: 'jc-sec-signature' },
    { id: 3, label: 'Career + change relationship identified', anchor: 'jc-sec-signature' },
    { id: 4, label: 'Mahadasha activates change houses', anchor: 'jc-sec-dasha' },
    { id: 5, label: 'Antardasha activates change houses', anchor: 'jc-sec-dasha' },
    { id: 6, label: 'Pratyantardasha narrows timing', anchor: 'jc-sec-dasha' },
    { id: 7, label: 'D10 confirms career transition', anchor: 'jc-sec-d10' },
    { id: 8, label: 'Jupiter supports new opportunity', anchor: 'jc-sec-windows' },
    { id: 9, label: 'Saturn activates organizational responsibility/change', anchor: 'jc-sec-windows' },
    { id: 10, label: 'Candidate window identified', anchor: 'jc-sec-windows' },
    { id: 11, label: 'Event classification', anchor: 'jc-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalChangePromise();
    log(calculationLog, '[02] 3rd/6th/9th/10th/11th/12th houses and Saturn/Sun/Mercury/Rahu analysed');
    const signature = NS.buildChangeSignature();
    log(calculationLog, '[03] Change signature evidence built');
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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.changeFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.changeFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.changeFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[06] Job Change Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate job-change windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['JC-NATAL-003', 'JC-NATAL-006', 'JC-NATAL-009', 'JC-NATAL-010', 'JC-NATAL-011', 'JC-NATAL-012', 'JC-NATAL-SATURN', 'JC-NATAL-SUN', 'JC-NATAL-MERCURY', 'JC-NATAL-RAHU', 'JC-PAIR-10-6', 'JC-PAIR-10-12', 'JC-PAIR-10-3', 'JC-PAIR-10-9', 'JC-PAIR-10-11', 'JC-PAIR-6-12', 'JC-D10-001']);
    if (windowsResult.available) { rulesUsedIds.add('JC-DASHA-001'); rulesUsedIds.add('JC-TRANSIT-JUP'); rulesUsedIds.add('JC-TRANSIT-SAT'); rulesUsedIds.add('JC-TRANSIT-NODES'); rulesUsedIds.add('JC-EVENT-001'); rulesUsedIds.add('JC-DISTINGUISH-001'); rulesUsedIds.add('JC-DELAY-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, signature, d10Confirmation: d10, currentDasha,
      candidateWindows: windowsResult.windows, horizonYears: horizon,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
