/* =========================================================
   RECOGNITION / AWARD TIMING — pure calculation engine. Parashari/
   Vimshottari method only: no KP sub-lords/significators/ruling-
   planets, no Western technique. Reuses this app's existing chart/
   dignity/aspect/dasha/divisional-chart/transit calculations
   throughout — same architecture as the thirteen prior timing
   modules in this app.
   Exposed only as window.RecognitionAwardTiming (namespaced). UI code
   lives entirely in recognitionAwardTimingUI.js — this file returns
   plain data only.
   ========================================================= */

window.RecognitionAwardTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, eventFilter, result }

  const RECOGNITION_HOUSES = [1, 2, 3, 5, 6, 7, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[RecognitionAwardTiming]', text); }
  function ruleById(id) { return (window.RECOGNITION_AWARD_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER
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

  NS.getHouseSnapshot = function (houseNum) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const signIndex = (ascSignIndex + houseNum - 1) % 12;
    const sign = SIGNS[signIndex];
    const lord = SIGN_LORD[sign];
    const occupants = chart.planets.filter(p => Number(p.house) === houseNum).map(p => p.name);
    const aspectingHere = chart.planets.filter(p => {
      const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default;
      const fromIdx = SIGNS.indexOf(p.sign);
      return offsets.some(o => (fromIdx + (o - 1)) % 12 === signIndex);
    }).map(p => p.name);
    return { house: houseNum, sign, lord, occupants, aspectingHere };
  };

  // ---------------------------------------------------------------
  // 2. D10 (primary) — reuse vargaPosition() directly, the app's
  //    EXISTING divisional-chart engine. No new varga implementation.
  //    D24 (academic) is NOT reused here — it is only cross-checked
  //    via window.HigherEducationTiming's own output.
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
      fifthSign: houseSign(5), fifthLord: SIGN_LORD[houseSign(5)],
      ninthSign: houseSign(9), ninthLord: SIGN_LORD[houseSign(9)],
      tenthSign: houseSign(10), tenthLord: SIGN_LORD[houseSign(10)],
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      planets, available: true
    };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    if (!d10) return { available: false, level: 'D10 confirmation unavailable', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('REC-D10-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d10.planets.find(p => p.name === name); return x ? x.d10Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d10.tenthLord))) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${dig(d10.tenthLord)} in D10.`); }
    if (strong.includes(dig(d10.eleventhLord))) { points += 2; evidence.push(`D10 11th lord (${d10.eleventhLord}) is ${dig(d10.eleventhLord)} in D10.`); }
    if (strong.includes(dig(d10.ninthLord))) { points += 1; evidence.push(`D10 9th lord (${d10.ninthLord}) is ${dig(d10.ninthLord)} in D10.`); }
    if (strong.includes(dig(d10.fifthLord))) { points += 1; evidence.push(`D10 5th lord (${d10.fifthLord}) is ${dig(d10.fifthLord)} in D10.`); }
    if (strong.includes(dig(d10.lagnaLord))) { points += 1; evidence.push(`D10 Lagna lord (${d10.lagnaLord}) is ${dig(d10.lagnaLord)} in D10.`); }
    if (strong.includes(dig('Sun'))) { points += 1; evidence.push(`Sun is ${dig('Sun')} in D10.`); }
    if (strong.includes(dig('Jupiter'))) { points += 1; evidence.push(`Jupiter is ${dig('Jupiter')} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for the recognition axis (10th/11th/9th/5th/Lagna lords, Sun, Jupiter).');
    const level = points >= 6 ? 'Strong D10 confirmation' : points >= 4 ? 'D10 confirmation' : points >= 2 ? 'Partial D10 confirmation' : points >= 1 ? 'Mixed D10 indication' : 'Weak D10 confirmation';
    return { available: true, d10, points, level, evidence, rule: ruleById('REC-D10-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL RECOGNITION PROMISE
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
    let result = strongDignity && !lordInDusthana && beneficOccupants >= maleficOccupants ? 'Strong'
      : lordInDusthana || dignity === 'Debilitated' || maleficOccupants > beneficOccupants ? 'Challenging'
      : lordWellPlaced || beneficOccupants > 0 ? 'Supporting' : 'Moderate';
    return {
      house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId),
      occupants: h.occupants, aspectingHere: h.aspectingHere,
      evidence: [
        `${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`,
        h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.',
        h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.'
      ]
    };
  }

  function classifyKaraka(name, ruleId, refHouseNum) {
    const p = NS.getPlanetSnapshot(name);
    const refHouse = NS.getHouseSnapshot(refHouseNum);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connected = p.house === refHouseNum || p.conjunctWith.includes(refHouse.lord) || p.aspectedBy.includes(refHouse.lord) || refHouse.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Neutral';
    if (connected && result === 'Neutral') result = 'Supporting';
    return {
      planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connected,
      evidence: [
        `${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`,
        p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.',
        p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.',
        `Connected to ${refHouseNum}th: ${connected ? 'Yes' : 'No'}.`
      ]
    };
  }

  function housesConnected(h1, h2, chart) {
    if (h1.lord === h2.lord) return { connected: true, how: `${h1.house}th and ${h2.house}th houses share the same lord (${h1.lord}).` };
    const l1 = chart.planets.find(p => p.name === h1.lord), l2 = chart.planets.find(p => p.name === h2.lord);
    if (l1.sign === l2.sign) return { connected: true, how: `${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord) are conjunct in ${l1.sign}.` };
    if ((l1.aspectedBy || []).includes(h2.lord) || (l2.aspectedBy || []).includes(h1.lord)) return { connected: true, how: `${h1.lord} and ${h2.lord} (${h1.house}th/${h2.house}th lords) aspect each other.` };
    if (SIGN_LORD[l1.sign] === h2.lord && SIGN_LORD[l2.sign] === h1.lord) return { connected: true, how: `${h1.lord} and ${h2.lord} are in mutual sign exchange (Parivartana).` };
    return { connected: false, how: `No conjunction, aspect, or exchange found between ${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord).` };
  }

  NS.assessNatalRecognitionPromise = function () {
    const chart = NS.getChartData();
    const first = classifyHouse(1, 'REC-NATAL-001');
    const second = classifyHouse(2, 'REC-NATAL-002');
    const third = classifyHouse(3, 'REC-NATAL-003');
    const fourth = classifyHouse(4, 'REC-NATAL-004');
    const fifth = classifyHouse(5, 'REC-NATAL-005');
    const sixth = classifyHouse(6, 'REC-NATAL-006');
    const seventh = classifyHouse(7, 'REC-NATAL-007');
    const ninth = classifyHouse(9, 'REC-NATAL-009');
    const tenth = classifyHouse(10, 'REC-NATAL-010');
    const eleventh = classifyHouse(11, 'REC-NATAL-011');
    const twelfth = classifyHouse(12, 'REC-NATAL-012');

    const sun = classifyKaraka('Sun', 'REC-NATAL-SUN', 10);
    const jupiter = classifyKaraka('Jupiter', 'REC-NATAL-JUPITER', 9);
    const venus = classifyKaraka('Venus', 'REC-NATAL-VENUS', 7);
    const mercury = classifyKaraka('Mercury', 'REC-NATAL-MERCURY', 3);
    const moon = classifyKaraka('Moon', 'REC-NATAL-MOON', 7);
    const saturn = classifyKaraka('Saturn', 'REC-NATAL-SATURN', 10);

    const firstH = NS.getHouseSnapshot(1), thirdH = NS.getHouseSnapshot(3), fifthH = NS.getHouseSnapshot(5),
      sixthH = NS.getHouseSnapshot(6), seventhH = NS.getHouseSnapshot(7), ninthH = NS.getHouseSnapshot(9),
      tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11);

    const pairs = [
      { id: 'REC-PROF-10-11', a: tenthH, b: eleventhH }, { id: 'REC-PROF-10-9', a: tenthH, b: ninthH },
      { id: 'REC-PROF-5-10', a: fifthH, b: tenthH }, { id: 'REC-PROF-5-11', a: fifthH, b: eleventhH },
      { id: 'REC-PROF-9-11', a: ninthH, b: eleventhH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const award = [housesConnected(ninthH, tenthH, chart).connected, housesConnected(ninthH, eleventhH, chart).connected,
      [housesConnected(fifthH, ninthH, chart).connected, housesConnected(ninthH, tenthH, chart).connected].filter(Boolean).length === 2,
      [housesConnected(fifthH, tenthH, chart).connected, housesConnected(tenthH, eleventhH, chart).connected].filter(Boolean).length === 2].filter(Boolean).length >= 2;

    const publicRecognition = [housesConnected(firstH, tenthH, chart).connected, housesConnected(firstH, eleventhH, chart).connected,
      housesConnected(seventhH, tenthH, chart).connected, housesConnected(seventhH, eleventhH, chart).connected,
      housesConnected(thirdH, tenthH, chart).connected].filter(Boolean).length >= 2;

    const achievement = [housesConnected(fifthH, tenthH, chart).connected && housesConnected(tenthH, eleventhH, chart).connected,
      housesConnected(sixthH, tenthH, chart).connected && housesConnected(tenthH, eleventhH, chart).connected].filter(Boolean).length >= 1;

    const institutional = [housesConnected(ninthH, tenthH, chart).connected, housesConnected(ninthH, eleventhH, chart).connected].filter(Boolean).length >= 1 &&
      [sun.result === 'Strong' || sun.result === 'Supporting', jupiter.result === 'Strong' || jupiter.result === 'Supporting'].filter(Boolean).length >= 1;

    const longService = (saturn.result === 'Strong' || saturn.result === 'Supporting') && relationships.filter(r => r.connected).length >= 1;

    const connectedCount = relationships.filter(r => r.connected).length;
    const overall = connectedCount >= 2
      ? 'The chart supports professional recognition.'
      : connectedCount === 1 ? 'The chart contains achievement-related recognition indicators.'
      : 'The chart shows limited natal indication for professional recognition; any apparent activation should be weighed cautiously.';

    const visibilityNote = publicRecognition ? 'The chart shows potential for public visibility.'
      : institutional ? 'Institutional recognition is supported.'
      : 'The chart does not show a pronounced public-visibility or institutional-recognition bias.';

    return {
      firstHouse: first, secondHouse: second, thirdHouse: third, fourthHouse: fourth, fifthHouse: fifth,
      sixthHouse: sixth, seventhHouse: seventh, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      sun, jupiter, venus, mercury, moon, saturn,
      relationships, award, publicRecognition, achievement, institutional, longService,
      connectedCount, overall, visibilityNote
    };
  };

  // ---------------------------------------------------------------
  // 4. RECOGNITION TYPE CLASSIFICATION (Section 12)
  // ---------------------------------------------------------------
  NS.classifyRecognitionType = function (natalPromise) {
    const types = [];
    if (natalPromise.institutional) types.push('Institutional');
    if (natalPromise.publicRecognition) types.push('Public');
    if (natalPromise.award) types.push('Organizational');
    if (natalPromise.longService) types.push('Long-Service');
    if (natalPromise.sun.result === 'Strong' || natalPromise.sun.result === 'Supporting') types.push('Professional');
    if (natalPromise.achievement) types.push('Industry');
    if (natalPromise.thirdHouse.result === 'Strong' || natalPromise.thirdHouse.result === 'Supporting') types.push('Community/Social');
    if (!types.length) types.push('Professional');
    return {
      types: Array.from(new Set(types)),
      note: 'A specific award title or organization is never predicted without external factual information — these are broad thematic indications only.',
      rule: ruleById('REC-TYPE-001')
    };
  };

  // ---------------------------------------------------------------
  // 5. VIMSHOTTARI DASHA — Recognition Activation Map
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.recognitionFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (RECOGNITION_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => RECOGNITION_HOUSES.includes(h)).join(', ')}.`);
    if (RECOGNITION_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11), ninth = NS.getHouseSnapshot(9);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (lordName === ninth.lord) factors.push(`${lordName} is the 9th lord.`);
    if (lordName === 'Sun' || lordName === 'Jupiter') factors.push(`${lordName} is a natural recognition/honour significator.`);
    const tenthConnection = lordName === tenth.lord || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord);
    if (tenthConnection && lordName !== tenth.lord) factors.push(`${lordName} is connected to the 10th lord (${tenth.lord}) by conjunction/aspect.`);
    const d10 = NS.getD10();
    const d10Confirmation = d10 ? (() => {
      const pD10 = d10.planets.find(x => x.name === lordName);
      return [10, 11, 9].includes(pD10.d10House) || [d10.tenthLord, d10.eleventhLord, d10.ninthLord].includes(lordName);
    })() : false;
    if (d10Confirmation) factors.push(`${lordName} is connected to the D10 recognition axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, tenthConnection, d10Confirmation };
  };

  NS.buildRecognitionActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.recognitionFactorsForLord(md.lord);
        const adFactors = NS.recognitionFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.recognitionFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const tenthConnection = mdFactors.tenthConnection || adFactors.tenthConnection || pdFactors.tenthConnection;
          const d10Confirmation = mdFactors.d10Confirmation || adFactors.d10Confirmation || pdFactors.d10Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, tenthConnection, d10Confirmation, matchCount, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 6. TRANSIT — Jupiter/Saturn primary, Sun/Venus/Mercury/Moon
  //    secondary, nodes secondary
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const tenthLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(10).lord);

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
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [5, 9, 10, 11], 'REC-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [9, 10, 11], 'REC-TRANSIT-SAT'),
      sun: checkBody('Sun', [1, 9, 10], 'REC-TRANSIT-SUN'),
      venus: checkBody('Venus', [1, 7, 11], 'REC-TRANSIT-VENUS-MERCURY-MOON'),
      mercury: checkBody('Mercury', [3, 10, 11], 'REC-TRANSIT-VENUS-MERCURY-MOON'),
      moon: checkBody('Moon', [1, 7, 11], 'REC-TRANSIT-VENUS-MERCURY-MOON'),
      rahu: checkBody('Rahu', [10, 11], 'REC-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [10, 11], 'REC-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 7. RECOGNITION STAGE (Section 18)
  // ---------------------------------------------------------------
  NS.classifyStage = function (candidate, d10, transit) {
    const h = candidate.activatedHouses;
    const fifthInvolved = h.includes(5), ninthInvolved = h.includes(9), tenthInvolved = h.includes(10), eleventhInvolved = h.includes(11), firstInvolved = h.includes(1);
    const d10Confirms = candidate.d10Confirmation;

    if (fifthInvolved && tenthInvolved && !eleventhInvolved) return { label: 'Achievement', rule: ruleById('REC-STAGE-001') };
    if (tenthInvolved && !eleventhInvolved && !d10Confirms) return { label: 'Nomination / Consideration', rule: ruleById('REC-STAGE-001') };
    if (ninthInvolved && tenthInvolved && eleventhInvolved && d10Confirms) return { label: 'Award / Honour', rule: ruleById('REC-STAGE-001') };
    if (firstInvolved && eleventhInvolved && (transit.sun.active || transit.moon.active)) return { label: 'Public Announcement', rule: ruleById('REC-STAGE-001') };
    if (eleventhInvolved && d10Confirms && candidate.matchCount >= 3) return { label: 'Post-Award Recognition', rule: ruleById('REC-STAGE-001') };
    return { label: 'Award / Honour', rule: ruleById('REC-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 8. CROSS-MODULE CHECKS (Promotion, Financial Gain, Higher
  //    Education/D24, Retirement)
  // ---------------------------------------------------------------
  NS.checkPromotionCrossCheck = function (candidate) {
    if (!window.PromotionTiming) return null;
    const result = window.PromotionTiming.refresh();
    if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, promotionEvent: overlapping.event.label,
      interpretation: 'Career Advancement and Recognition / Honour are shown as two separate indications here — Promotion Timing output is never reused as recognition timing.',
      rule: ruleById('REC-VS-PROMOTION-001')
    };
  };

  NS.checkFinancialCrossCheck = function (candidate) {
    if (!window.FinancialGainTiming) return null;
    const result = window.FinancialGainTiming.refresh();
    if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, financialEvent: overlapping.event.label,
      interpretation: 'This recognition period also overlaps a financially active period — shown separately; an award is never assumed to produce financial gain.',
      rule: ruleById('REC-VS-FINANCIAL-001')
    };
  };

  NS.checkAcademicCrossCheck = function (candidate) {
    if (!window.HigherEducationTiming) return null;
    const result = window.HigherEducationTiming.refresh();
    if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, academicEvent: overlapping.event.label,
      interpretation: 'Professional Recognition and Academic Recognition are shown separately here — D24/Higher Education Timing calculations are read directly, never duplicated.',
      rule: ruleById('REC-D24-CROSSCHECK-001')
    };
  };

  NS.checkRetirementCrossCheck = function (candidate) {
    if (!window.RetirementTiming) return null;
    const result = window.RetirementTiming.refresh();
    if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, retirementEvent: overlapping.event.labels ? overlapping.event.labels.join(', ') : overlapping.event.label,
      interpretation: 'This recognition period overlaps a career-transition window from Retirement Timing — considered for a Post-Retirement Recognition / Lifetime Achievement classification.',
      rule: ruleById('REC-RETIREMENT-CROSSCHECK-001')
    };
  };

  // ---------------------------------------------------------------
  // 9. RECOGNITION EVENT CLASSIFICATION
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, natalPromise, stage, academicCrossCheck, retirementCrossCheck) {
    const labels = [];
    if (academicCrossCheck && academicCrossCheck.overlapping) labels.push('Academic / Professional Recognition');
    if (retirementCrossCheck && retirementCrossCheck.overlapping) labels.push('Post-Retirement Recognition');
    if (natalPromise.publicRecognition && candidate.activatedHouses.includes(1)) labels.push('Public Recognition');
    if (natalPromise.institutional) labels.push('Institutional Honor');
    if (natalPromise.award) labels.push('Formal Award');
    if (natalPromise.longService) labels.push('Career Achievement Recognition');
    if (natalPromise.sun.result === 'Strong' || natalPromise.sun.result === 'Supporting') labels.push('Professional Recognition');
    if (!labels.length) labels.push('Professional Recognition');
    return { labels: Array.from(new Set(labels)), primary: labels[0], stage: stage.label, rule: ruleById('REC-TYPE-001') };
  };

  // ---------------------------------------------------------------
  // 10. CANDIDATE WINDOWS + WINDOW STRENGTH (non-numeric)
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

  function assessWindowStrength(convergenceFactors) {
    if (convergenceFactors >= 5) return 'Strongly Supportive';
    if (convergenceFactors >= 4) return 'Supportive';
    if (convergenceFactors >= 3) return 'Moderately Supportive';
    if (convergenceFactors >= 2) return 'Mixed';
    return 'Conditional';
  }

  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildRecognitionActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d10 = NS.assessD10Confirmation();
    const natalPromise = NS.assessNatalRecognitionPromise();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyStage(c, d10, transit);
      const promotionCrossCheck = NS.checkPromotionCrossCheck(c);
      const financialCrossCheck = NS.checkFinancialCrossCheck(c);
      const academicCrossCheck = NS.checkAcademicCrossCheck(c);
      const retirementCrossCheck = NS.checkRetirementCrossCheck(c);
      const event = NS.classifyEvent(c, natalPromise, stage, academicCrossCheck, retirementCrossCheck);
      const convergenceFactors = [c.tenthConnection, c.d10Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('REC-STRENGTH-001') };
      return Object.assign({}, c, { transit, stage, event, promotionCrossCheck, financialCrossCheck, academicCrossCheck, retirementCrossCheck, convergenceFactors, qualification, strength });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 11. HISTORICAL VALIDATION
  // ---------------------------------------------------------------
  NS.validateHistoricalDate = function (eventDate, eventType) {
    const chart = NS.getChartData();
    if (!chart || !state.dasha || !state.dasha.length) return null;
    const mdIdx = findCurrentIndex(state.dasha, eventDate);
    if (mdIdx < 0) return { eventDate, eventType, inRange: false };
    const md = state.dasha[mdIdx];
    const adIdx = findCurrentIndex(md.antardashas, eventDate);
    const ad = adIdx >= 0 ? md.antardashas[adIdx] : null;
    let pd = null;
    if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pdIdx = findCurrentIndex(pds, eventDate); pd = pdIdx >= 0 ? pds[pdIdx] : null; }
    function activated(lordName) { return lordName ? NS.recognitionFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.recognitionFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d10 = NS.assessD10Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      tenthActivation: houseActivated(10), ninthActivation: houseActivated(9), eleventhActivation: houseActivated(11), fifthActivation: lords.some(activated),
      d10Level: d10.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Recognition Houses (1st/2nd/3rd/5th/6th/7th/9th/10th/11th/12th)', anchor: 'rec-sec-promise' },
    { id: 2, label: 'House Lords', anchor: 'rec-sec-promise' },
    { id: 3, label: 'Natal Recognition Promise', anchor: 'rec-sec-promise' },
    { id: 4, label: 'Recognition Type Classification', anchor: 'rec-sec-type' },
    { id: 5, label: 'Mahadasha activates recognition houses', anchor: 'rec-sec-dasha' },
    { id: 6, label: 'Antardasha activates recognition houses', anchor: 'rec-sec-dasha' },
    { id: 7, label: 'Pratyantardasha activates recognition houses', anchor: 'rec-sec-dasha' },
    { id: 8, label: 'D10 confirms professional recognition', anchor: 'rec-sec-d10' },
    { id: 9, label: 'D24 / Higher Education cross-check (academic recognition)', anchor: 'rec-sec-academic' },
    { id: 10, label: 'Jupiter/Saturn transit confirmation', anchor: 'rec-sec-windows' },
    { id: 11, label: 'Cross-checks (Promotion, Financial Gain, Retirement)', anchor: 'rec-sec-crosscheck' },
    { id: 12, label: 'Candidate Window', anchor: 'rec-sec-windows' },
    { id: 13, label: 'Recognition Classification', anchor: 'rec-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, eventFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.eventFilter === eventFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalRecognitionPromise();
    log(calculationLog, '[02] 1st/2nd/3rd/5th/6th/7th/9th/10th/11th/12th houses and Sun/Jupiter/Venus/Mercury/Moon/Saturn analysed');
    const recognitionType = NS.classifyRecognitionType(natalPromise);
    log(calculationLog, '[03] Recognition type classified: ' + recognitionType.types.join(', '));
    const d10 = NS.assessD10Confirmation();
    log(calculationLog, '[04] D10 (Dashamsha) professional-recognition confirmation computed: ' + d10.level);

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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.recognitionFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.recognitionFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.recognitionFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[06] Recognition Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate recognition windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (eventFilter && eventFilter !== 'All') {
      windows = windows.filter(w => w.event.labels.some(l => l.startsWith(eventFilter)));
      log(calculationLog, '[08] Filtered by recognition event: ' + eventFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['REC-NATAL-001', 'REC-NATAL-002', 'REC-NATAL-003', 'REC-NATAL-004', 'REC-NATAL-005', 'REC-NATAL-006', 'REC-NATAL-007', 'REC-NATAL-009', 'REC-NATAL-010', 'REC-NATAL-011', 'REC-NATAL-012', 'REC-NATAL-SUN', 'REC-NATAL-JUPITER', 'REC-NATAL-VENUS', 'REC-NATAL-MERCURY', 'REC-NATAL-MOON', 'REC-NATAL-SATURN', 'REC-PROF-10-11', 'REC-PROF-10-9', 'REC-PROF-5-10', 'REC-PROF-5-11', 'REC-PROF-9-11', 'REC-AWARD-9-10', 'REC-PUBLIC-1-10', 'REC-ACHIEVEMENT-5-10-11', 'REC-INSTITUTIONAL-9-10', 'REC-D10-001', 'REC-D24-CROSSCHECK-001', 'REC-TYPE-001']);
    if (windowsResult.available) { rulesUsedIds.add('REC-DASHA-001'); rulesUsedIds.add('REC-TRANSIT-JUP'); rulesUsedIds.add('REC-TRANSIT-SAT'); rulesUsedIds.add('REC-TRANSIT-SUN'); rulesUsedIds.add('REC-TRANSIT-VENUS-MERCURY-MOON'); rulesUsedIds.add('REC-TRANSIT-NODES'); rulesUsedIds.add('REC-STAGE-001'); rulesUsedIds.add('REC-VS-PROMOTION-001'); rulesUsedIds.add('REC-VS-FINANCIAL-001'); rulesUsedIds.add('REC-RETIREMENT-CROSSCHECK-001'); rulesUsedIds.add('REC-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, recognitionType, d10Confirmation: d10, currentDasha,
      candidateWindows: windows, horizonYears: horizon, eventFilter: eventFilter || 'All',
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, eventFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
