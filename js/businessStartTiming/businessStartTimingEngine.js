/* =========================================================
   BUSINESS START TIMING — pure calculation engine. Parashari/
   Vimshottari method only: no KP sub-lords/significators/ruling-
   planets, no Western technique. Reuses this app's existing chart/
   dignity/aspect/dasha/divisional-chart/transit calculations
   throughout — same architecture as the 9 prior timing modules in
   this app, most directly Career Start Timing (employment-vs-
   business scoring pattern) and Foreign Travel Timing (dual cross-
   module read pattern).
   Exposed only as window.BusinessStartTiming (namespaced). UI code
   lives entirely in businessStartTimingUI.js — this file returns
   plain data only.
   ========================================================= */

window.BusinessStartTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, result }

  const BUSINESS_HOUSES = [2, 3, 5, 6, 7, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[BusinessStartTiming]', text); }
  function ruleById(id) { return (window.BUSINESS_START_TIMING_RULES || []).find(r => r.id === id); }

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
  // 2. D10 (primary) & D9 (optional supporting context only) —
  //    reuse vargaPosition() directly, the app's EXISTING
  //    divisional-chart engine. No new varga implementation.
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
      secondSign: houseSign(2), secondLord: SIGN_LORD[houseSign(2)],
      seventhSign: houseSign(7), seventhLord: SIGN_LORD[houseSign(7)],
      tenthSign: houseSign(10), tenthLord: SIGN_LORD[houseSign(10)],
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      planets
    };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d10.planets.find(p => p.name === name); return x ? x.d10Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d10.tenthLord))) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${dig(d10.tenthLord)} in D10.`); }
    if (strong.includes(dig(d10.seventhLord))) { points += 2; evidence.push(`D10 7th lord (${d10.seventhLord}) is ${dig(d10.seventhLord)} in D10.`); }
    if (strong.includes(dig(d10.eleventhLord))) { points += 1; evidence.push(`D10 11th lord (${d10.eleventhLord}) is ${dig(d10.eleventhLord)} in D10.`); }
    if (strong.includes(dig(d10.secondLord))) { points += 1; evidence.push(`D10 2nd lord (${d10.secondLord}) is ${dig(d10.secondLord)} in D10.`); }
    if (strong.includes(dig(d10.lagnaLord))) { points += 1; evidence.push(`D10 Lagna lord (${d10.lagnaLord}) is ${dig(d10.lagnaLord)} in D10.`); }
    if (strong.includes(dig('Mercury'))) { points += 1; evidence.push(`Mercury is ${dig('Mercury')} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for the business/profession axis (7th/10th/11th/2nd/Lagna lords, Mercury).');
    const level = points >= 6 ? 'Strong D10 confirmation' : points >= 4 ? 'D10 confirmation' : points >= 2 ? 'Partial D10 confirmation' : points >= 1 ? 'Mixed D10 indication' : 'Weak D10 confirmation';
    return { d10, points, level, evidence, rule: ruleById('BUS-D10-001') };
  };

  NS.getD9Context = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    const planets = chart.planets.map(p => {
      const d9 = vargaPosition(p.longitude, 'D9');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d9DegreeInSign = normalizeDegrees(d9.longitude) % 30;
      const d9Dignity = isClassical ? detailedDignity(p.name, d9.sign, d9DegreeInSign).tier : 'Neutral';
      return { name: p.name, d9Sign: d9.sign, d9Dignity };
    });
    const strongCount = planets.filter(p => strong.includes(p.d9Dignity)).length;
    return { planets, strongCount, note: 'D9 (Navamsha) is used only as supporting context here — it never overrides the D1/D10 business-timing logic.', rule: ruleById('BUS-D9-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL BUSINESS PROMISE (Natal Promise + Formation Signatures)
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

  NS.assessNatalBusinessPromise = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'BUS-NATAL-002');
    const third = classifyHouse(3, 'BUS-NATAL-003');
    const fifth = classifyHouse(5, 'BUS-NATAL-005');
    const sixth = classifyHouse(6, 'BUS-NATAL-006');
    const seventh = classifyHouse(7, 'BUS-NATAL-007');
    const ninth = classifyHouse(9, 'BUS-NATAL-009');
    const tenth = classifyHouse(10, 'BUS-NATAL-010');
    const eleventh = classifyHouse(11, 'BUS-NATAL-011');
    const twelfth = classifyHouse(12, 'BUS-NATAL-012');

    const mercury = classifyKaraka('Mercury', 'BUS-NATAL-MERCURY', 7);
    const venus = classifyKaraka('Venus', 'BUS-NATAL-VENUS', 7);
    const jupiter = classifyKaraka('Jupiter', 'BUS-NATAL-JUPITER', 9);
    const saturn = classifyKaraka('Saturn', 'BUS-NATAL-SATURN', 10);
    const sun = classifyKaraka('Sun', 'BUS-NATAL-SUN', 10);
    const mars = classifyKaraka('Mars', 'BUS-NATAL-MARS', 3);
    const rahu = classifyKaraka('Rahu', 'BUS-NATAL-RAHU', 10);

    const secondH = NS.getHouseSnapshot(2), thirdH = NS.getHouseSnapshot(3), seventhH = NS.getHouseSnapshot(7),
      ninthH = NS.getHouseSnapshot(9), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11),
      twelfthH = NS.getHouseSnapshot(12), fifthH = NS.getHouseSnapshot(5);

    const pairs = [
      { id: 'BUS-PAIR-7-10', a: seventhH, b: tenthH }, { id: 'BUS-PAIR-7-11', a: seventhH, b: eleventhH },
      { id: 'BUS-PAIR-3-7', a: thirdH, b: seventhH }, { id: 'BUS-PAIR-3-10', a: thirdH, b: tenthH },
      { id: 'BUS-PAIR-7-2', a: seventhH, b: secondH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const profit2_7_11 = [relationships.find(r => r.houseA === 7 && r.houseB === 2).connected, relationships.find(r => r.houseA === 7 && r.houseB === 11).connected,
      housesConnected(secondH, eleventhH, chart).connected].filter(Boolean).length >= 2;
    const profit5_7_11 = [housesConnected(fifthH, seventhH, chart).connected, relationships.find(r => r.houseA === 7 && r.houseB === 11).connected,
      housesConnected(fifthH, eleventhH, chart).connected].filter(Boolean).length >= 2;
    const profitSignatures = [
      { rule: ruleById('BUS-PROFIT-2-7-11'), present: profit2_7_11, evidence: `2nd/7th/11th convergence: ${profit2_7_11 ? 'present' : 'not present'}.` },
      { rule: ruleById('BUS-PROFIT-5-7-11'), present: profit5_7_11, evidence: `5th/7th/11th convergence: ${profit5_7_11 ? 'present' : 'not present'}.` }
    ];

    const foreignBusiness = [relationships.find(r => r.houseA === 7 && r.houseB === 10).connected, housesConnected(ninthH, twelfthH, chart).connected,
      rahu.connected || [9, 10, 12].includes(NS.getPlanetSnapshot('Rahu').house)].filter(Boolean).length >= 2;

    const connectedCount = relationships.filter(r => r.connected).length;
    const overall = connectedCount >= 2
      ? 'The natal chart supports business formation and trade activity.'
      : connectedCount === 1 ? 'The natal chart shows a single moderate indication of business activity.'
      : 'The natal chart shows limited natal indication of business formation; any apparent activation should be weighed cautiously.';

    return {
      secondHouse: second, thirdHouse: third, fifthHouse: fifth, sixthHouse: sixth, seventhHouse: seventh,
      ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      mercury, venus, jupiter, saturn, sun, mars, rahu,
      relationships, profitSignatures, foreignBusiness, connectedCount, overall
    };
  };

  // ---------------------------------------------------------------
  // 4. EMPLOYMENT vs. BUSINESS vs. INDEPENDENT-PROFESSIONAL (Section 4)
  // ---------------------------------------------------------------
  NS.assessEmploymentVsBusiness = function () {
    const promise = NS.assessNatalBusinessPromise();
    const chart = NS.getChartData();
    const sixth = NS.getHouseSnapshot(6), tenth = NS.getHouseSnapshot(10), second = NS.getHouseSnapshot(2);

    const employmentScore = [
      housesConnected(sixth, tenth, chart).connected,
      housesConnected(sixth, second, chart).connected,
      promise.sixthHouse.result === 'Strong' || promise.sixthHouse.result === 'Supporting',
      promise.saturn.result === 'Strong' || promise.saturn.result === 'Supporting',
      promise.sun.result === 'Strong' || promise.sun.result === 'Supporting'
    ].filter(Boolean).length;

    const businessScore = [
      promise.relationships.find(r => r.houseA === 7 && r.houseB === 10).connected,
      promise.relationships.find(r => r.houseA === 7 && r.houseB === 11).connected,
      promise.mercury.result === 'Strong' || promise.mercury.result === 'Supporting',
      promise.venus.result === 'Strong' || promise.venus.result === 'Supporting',
      promise.rahu.connected
    ].filter(Boolean).length;

    const independentScore = [
      promise.fifthHouse.result === 'Strong' || promise.fifthHouse.result === 'Supporting',
      promise.relationships.find(r => r.houseA === 7 && r.houseB === 11).connected,
      promise.mercury.result === 'Strong' || promise.mercury.result === 'Supporting',
      promise.jupiter.result === 'Strong' || promise.jupiter.result === 'Supporting',
      promise.venus.result === 'Strong' || promise.venus.result === 'Supporting'
    ].filter(Boolean).length;

    let tendency;
    const scores = { Employment: employmentScore, Business: businessScore, 'Independent Professional': independentScore };
    const max = Math.max(employmentScore, businessScore, independentScore);
    const leaders = Object.keys(scores).filter(k => scores[k] === max && max >= 2);
    if (max < 2) tendency = 'Insufficient evidence to distinguish employment, business, or independent-professional tendencies.';
    else if (leaders.length > 1) tendency = `The chart shows comparable indications across: ${leaders.join(', ')}.`;
    else tendency = `The chart shows stronger ${leaders[0]} indicators than the other two — this is a chart indication, not a deterministic career outcome.`;

    return {
      tendency, employmentScore, businessScore, independentScore,
      employmentEvidence: [
        `6th↔10th connected: ${housesConnected(sixth, tenth, chart).connected ? 'Yes' : 'No'}.`,
        `6th↔2nd connected: ${housesConnected(sixth, second, chart).connected ? 'Yes' : 'No'}.`,
        `6th house: ${promise.sixthHouse.result}.`, `Saturn: ${promise.saturn.result}.`, `Sun: ${promise.sun.result}.`
      ],
      businessEvidence: [
        `7th↔10th connected: ${promise.relationships.find(r => r.houseA === 7 && r.houseB === 10).connected ? 'Yes' : 'No'}.`,
        `7th↔11th connected: ${promise.relationships.find(r => r.houseA === 7 && r.houseB === 11).connected ? 'Yes' : 'No'}.`,
        `Mercury: ${promise.mercury.result}.`, `Venus: ${promise.venus.result}.`, `Rahu connected: ${promise.rahu.connected ? 'Yes' : 'No'}.`
      ],
      independentEvidence: [
        `5th house: ${promise.fifthHouse.result}.`,
        `7th↔11th connected: ${promise.relationships.find(r => r.houseA === 7 && r.houseB === 11).connected ? 'Yes' : 'No'}.`,
        `Mercury: ${promise.mercury.result}.`, `Jupiter: ${promise.jupiter.result}.`, `Venus: ${promise.venus.result}.`
      ],
      rule: ruleById('BUS-EMPLOYMENT-VS-BUSINESS-001')
    };
  };

  // ---------------------------------------------------------------
  // 5. VIMSHOTTARI DASHA — Business Activation Map
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.businessFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (BUSINESS_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => BUSINESS_HOUSES.includes(h)).join(', ')}.`);
    if (BUSINESS_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const seventh = NS.getHouseSnapshot(7), tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11), second = NS.getHouseSnapshot(2);
    if (lordName === seventh.lord) factors.push(`${lordName} is the 7th lord.`);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (lordName === second.lord) factors.push(`${lordName} is the 2nd lord.`);
    if (lordName === 'Mercury' || lordName === 'Venus') factors.push(`${lordName} is a natural commerce/trade significator.`);
    const seventhConnection = lordName === seventh.lord || p.conjunctWith.includes(seventh.lord) || p.aspectedBy.includes(seventh.lord);
    if (seventhConnection && lordName !== seventh.lord) factors.push(`${lordName} is connected to the 7th lord (${seventh.lord}) by conjunction/aspect.`);
    const d10 = NS.getD10();
    const pD10 = d10.planets.find(x => x.name === lordName);
    const d10Confirmation = [7, 10, 11].includes(pD10.d10House) || [d10.seventhLord, d10.tenthLord, d10.eleventhLord].includes(lordName);
    if (d10Confirmation) factors.push(`${lordName} is connected to the D10 business/profession axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, seventhConnection, d10Confirmation };
  };

  NS.buildBusinessActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.businessFactorsForLord(md.lord);
        const adFactors = NS.businessFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.businessFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const seventhConnection = mdFactors.seventhConnection || adFactors.seventhConnection || pdFactors.seventhConnection;
          const d10Confirmation = mdFactors.d10Confirmation || adFactors.d10Confirmation || pdFactors.d10Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, seventhConnection, d10Confirmation, matchCount, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 6. TRANSIT — Jupiter/Saturn primary confirmation, nodes secondary
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const seventhLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(7).lord);

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
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === seventhLordNatal.signIndex) || signIdx === seventhLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 7th lord's sign (${seventhLordNatal.sign}).`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [2, 7, 10, 11], 'BUS-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [3, 7, 10, 11], 'BUS-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [7, 10, 11], 'BUS-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [7, 10, 11], 'BUS-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 7. EVENT CLASSIFICATION + EVENT STAGE
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, d10, natalPromise, employmentVsBusiness) {
    const d10Confirms = d10.points >= 4;
    const secondInvolved = candidate.activatedHouses.includes(2);
    const thirdInvolved = candidate.activatedHouses.includes(3);
    const fifthInvolved = candidate.activatedHouses.includes(5);
    const seventhInvolved = candidate.activatedHouses.includes(7);
    const ninthInvolved = candidate.activatedHouses.includes(9);
    const tenthInvolved = candidate.activatedHouses.includes(10);
    const eleventhInvolved = candidate.activatedHouses.includes(11);
    const twelfthInvolved = candidate.activatedHouses.includes(12);

    if (natalPromise.foreignBusiness && (ninthInvolved || twelfthInvolved) && seventhInvolved && tenthInvolved) return { label: 'Foreign/International Business Activity', rule: ruleById('BUS-FOREIGN-001') };
    if (seventhInvolved && tenthInvolved && eleventhInvolved && d10Confirms && secondInvolved) return { label: 'First Major Commercial Activity', rule: ruleById('BUS-EVENT-001') };
    if (seventhInvolved && tenthInvolved && d10Confirms) return { label: 'Business Registration/Formation', rule: ruleById('BUS-EVENT-001') };
    if (seventhInvolved && (thirdInvolved || tenthInvolved) && !d10Confirms) return { label: 'Business Idea/Preparation', rule: ruleById('BUS-EVENT-001') };
    if (seventhInvolved && fifthInvolved && (eleventhInvolved || secondInvolved)) return { label: 'Independent Professional Practice', rule: ruleById('BUS-EVENT-001') };
    if (seventhInvolved && candidate.lordsInvolved.some(l => l === NS.getHouseSnapshot(7).lord) && employmentVsBusiness.businessScore >= employmentVsBusiness.employmentScore) return { label: 'Partnership/Joint Business Start', rule: ruleById('BUS-EVENT-001') };
    return { label: 'Business-Related Activation (evidence insufficient for a specific classification)', rule: ruleById('BUS-EVENT-001') };
  };

  NS.classifyStage = function (candidate, transit) {
    const seventhInvolved = candidate.activatedHouses.includes(7);
    const tenthInvolved = candidate.activatedHouses.includes(10);
    const eleventhInvolved = candidate.activatedHouses.includes(11);
    const d10Confirms = candidate.d10Confirmation;
    if (!d10Confirms && seventhInvolved) return { label: 'Idea / Preparation', rule: ruleById('BUS-STAGE-001') };
    if (d10Confirms && seventhInvolved && tenthInvolved && !eleventhInvolved) return { label: 'Registration / Formation', rule: ruleById('BUS-STAGE-001') };
    if (d10Confirms && seventhInvolved && tenthInvolved && eleventhInvolved && (transit.jupiter.active || transit.saturn.active)) return { label: 'Launch', rule: ruleById('BUS-STAGE-001') };
    if (eleventhInvolved && d10Confirms) return { label: 'First Commercial Activity', rule: ruleById('BUS-STAGE-001') };
    return { label: 'Stabilization / Expansion (if applicable)', rule: ruleById('BUS-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 8. CROSS-MODULE CHECKS (Job Change + Financial Gain)
  // ---------------------------------------------------------------
  NS.checkJobChangeCrossCheck = function (candidate) {
    if (!window.JobChangeTiming) return null;
    const jcResult = window.JobChangeTiming.refresh();
    if (!jcResult) return null;
    const overlapping = jcResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, jobChangeEvent: overlapping.event.label,
      interpretation: 'The chart contains evidence for either a new employment role or business commencement during this period — both possibilities are shown rather than forcing one conclusion.',
      rule: ruleById('BUS-JOBCHANGE-CROSSCHECK-001')
    };
  };

  NS.checkFinancialCrossCheck = function (candidate) {
    if (!window.FinancialGainTiming) return null;
    const finResult = window.FinancialGainTiming.refresh();
    if (!finResult) return null;
    const overlapping = finResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, financialEvent: overlapping.event.label,
      interpretation: 'Business-start evidence overlaps with a financially-active period — tagged descriptively only; this never overrides the business-timing classification itself.',
      rule: ruleById('BUS-FINANCIAL-CROSSCHECK-001')
    };
  };

  // ---------------------------------------------------------------
  // 9. CANDIDATE WINDOWS + WINDOW STRENGTH (non-numeric)
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
    const activationMap = NS.buildBusinessActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d10 = NS.assessD10Confirmation();
    const natalPromise = NS.assessNatalBusinessPromise();
    const employmentVsBusiness = NS.assessEmploymentVsBusiness();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const event = NS.classifyEvent(c, d10, natalPromise, employmentVsBusiness);
      const stage = NS.classifyStage(c, transit);
      const jobChangeCrossCheck = NS.checkJobChangeCrossCheck(c);
      const financialCrossCheck = NS.checkFinancialCrossCheck(c);
      const convergenceFactors = [c.seventhConnection, c.d10Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('BUS-STRENGTH-001') };
      let eventLabel = event.label;
      if (financialCrossCheck && financialCrossCheck.overlapping && !eventLabel.includes('Preparation')) eventLabel = eventLabel + ' + Financial Realization';
      return Object.assign({}, c, { transit, event: Object.assign({}, event, { label: eventLabel, baseLabel: event.label }), stage, jobChangeCrossCheck, financialCrossCheck, convergenceFactors, qualification, strength });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 10. HISTORICAL VALIDATION
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
    function activated(lordName) { return lordName ? NS.businessFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.businessFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d10 = NS.assessD10Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      seventhActivation: houseActivated(7), tenthActivation: houseActivated(10), eleventhActivation: houseActivated(11), secondActivation: lords.some(activated),
      d10Level: d10.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Business Promise (2nd/3rd/5th/6th/7th/9th/10th/11th/12th)', anchor: 'bus-sec-promise' },
    { id: 2, label: 'Business Formation/Entrepreneurship/Profit signatures', anchor: 'bus-sec-signature' },
    { id: 3, label: 'Employment vs. Business vs. Independent-Professional tendency', anchor: 'bus-sec-tendency' },
    { id: 4, label: 'Mahadasha activates business houses', anchor: 'bus-sec-dasha' },
    { id: 5, label: 'Antardasha activates business houses', anchor: 'bus-sec-dasha' },
    { id: 6, label: 'Pratyantardasha activates business houses', anchor: 'bus-sec-dasha' },
    { id: 7, label: 'D10 confirms business/professional direction', anchor: 'bus-sec-d10' },
    { id: 8, label: 'D9 supporting context (optional, non-overriding)', anchor: 'bus-sec-d9' },
    { id: 9, label: 'Jupiter supports business opportunity', anchor: 'bus-sec-windows' },
    { id: 10, label: 'Saturn supports structure/sustained operations', anchor: 'bus-sec-windows' },
    { id: 11, label: 'Candidate Business-Start Window', anchor: 'bus-sec-windows' },
    { id: 12, label: 'Event Classification and Event Stage', anchor: 'bus-sec-windows' },
    { id: 13, label: 'Job Change / Financial Gain cross-checks', anchor: 'bus-sec-crosscheck' }
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
    const natalPromise = NS.assessNatalBusinessPromise();
    log(calculationLog, '[02] 2nd/3rd/5th/6th/7th/9th/10th/11th/12th houses and Mercury/Venus/Jupiter/Saturn/Sun/Mars/Rahu analysed');
    const employmentVsBusiness = NS.assessEmploymentVsBusiness();
    log(calculationLog, '[03] Employment vs. Business vs. Independent-Professional tendency assessed: ' + employmentVsBusiness.tendency);
    const d10 = NS.assessD10Confirmation();
    log(calculationLog, '[04] D10 (Dashamsha) business/profession confirmation computed: ' + d10.level);
    const d9Context = NS.getD9Context();
    log(calculationLog, '[05] D9 (Navamsha) supporting context computed (non-overriding)');

    const missing = [];
    let windowsResult = { available: false, windows: [] };
    let currentDasha = null;
    if (!state.dasha || !state.dasha.length) {
      missing.push('Vimshottari Dasha');
    } else {
      log(calculationLog, '[06] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx];
        const aIdx = findCurrentIndex(md.antardashas);
        const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null;
        if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = {
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.businessFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.businessFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.businessFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[07] Business Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[08] Candidate business-start windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (eventFilter && eventFilter !== 'All') {
      windows = windows.filter(w => w.event.baseLabel === eventFilter || w.event.label === eventFilter);
      log(calculationLog, '[09] Filtered by event type: ' + eventFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['BUS-NATAL-002', 'BUS-NATAL-003', 'BUS-NATAL-005', 'BUS-NATAL-006', 'BUS-NATAL-007', 'BUS-NATAL-009', 'BUS-NATAL-010', 'BUS-NATAL-011', 'BUS-NATAL-012', 'BUS-NATAL-MERCURY', 'BUS-NATAL-VENUS', 'BUS-NATAL-JUPITER', 'BUS-NATAL-SATURN', 'BUS-NATAL-SUN', 'BUS-NATAL-MARS', 'BUS-NATAL-RAHU', 'BUS-PAIR-7-10', 'BUS-PAIR-7-11', 'BUS-PAIR-3-7', 'BUS-PAIR-3-10', 'BUS-PAIR-7-2', 'BUS-PROFIT-2-7-11', 'BUS-PROFIT-5-7-11', 'BUS-FOREIGN-001', 'BUS-D10-001', 'BUS-D9-001', 'BUS-EMPLOYMENT-VS-BUSINESS-001']);
    if (windowsResult.available) { rulesUsedIds.add('BUS-DASHA-001'); rulesUsedIds.add('BUS-TRANSIT-JUP'); rulesUsedIds.add('BUS-TRANSIT-SAT'); rulesUsedIds.add('BUS-TRANSIT-NODES'); rulesUsedIds.add('BUS-EVENT-001'); rulesUsedIds.add('BUS-STAGE-001'); rulesUsedIds.add('BUS-JOBCHANGE-CROSSCHECK-001'); rulesUsedIds.add('BUS-FINANCIAL-CROSSCHECK-001'); rulesUsedIds.add('BUS-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, employmentVsBusiness, d10Confirmation: d10, d9Context, currentDasha,
      candidateWindows: windows, horizonYears: horizon, eventFilter: eventFilter || 'All',
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, eventFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
