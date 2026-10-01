/* =========================================================
   HIGHER EDUCATION / DEGREE TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/aspect/dasha/divisional-chart/transit calculations
   throughout — same architecture as the ten prior timing modules in
   this app, most directly Business Start Timing (D-chart confirmation
   + dual cross-module read pattern) and Foreign Travel Timing (cross-
   module read pattern).
   Exposed only as window.HigherEducationTiming (namespaced). UI code
   lives entirely in higherEducationTimingUI.js — this file returns
   plain data only.
   ========================================================= */

window.HigherEducationTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, eventFilter, result }

  const EDUCATION_HOUSES = [2, 3, 4, 5, 6, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[HigherEducationTiming]', text); }
  function ruleById(id) { return (window.HIGHER_EDUCATION_TIMING_RULES || []).find(r => r.id === id); }

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
  // 2. D24 (primary) & D9/D10 (optional supporting context only) —
  //    reuse vargaPosition() directly, the app's EXISTING
  //    divisional-chart engine. No new varga implementation.
  // ---------------------------------------------------------------
  NS.getD24 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD24 = vargaPosition(chart.ascendant.longitude, 'D24');
    const ascD24SignIndex = SIGNS.indexOf(ascD24.sign);
    const d24LagnaLord = SIGN_LORD[ascD24.sign];
    function houseSign(h) { return SIGNS[(ascD24SignIndex + h - 1) % 12]; }
    const planets = chart.planets.map(p => {
      const d24 = vargaPosition(p.longitude, 'D24');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d24DegreeInSign = normalizeDegrees(d24.longitude) % 30;
      const d24Dignity = isClassical ? detailedDignity(p.name, d24.sign, d24DegreeInSign).tier : 'Neutral';
      const d24House = ((SIGNS.indexOf(d24.sign) - ascD24SignIndex + 12) % 12) + 1;
      return { name: p.name, d24Sign: d24.sign, d24House, d24Dignity };
    });
    return {
      ascendantSign: ascD24.sign, lagnaLord: d24LagnaLord,
      fourthSign: houseSign(4), fourthLord: SIGN_LORD[houseSign(4)],
      fifthSign: houseSign(5), fifthLord: SIGN_LORD[houseSign(5)],
      ninthSign: houseSign(9), ninthLord: SIGN_LORD[houseSign(9)],
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      planets, available: true
    };
  };

  NS.assessD24Confirmation = function () {
    const d24 = NS.getD24();
    if (!d24) return { available: false, level: 'D24 confirmation unavailable', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('EDU-D24-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d24.planets.find(p => p.name === name); return x ? x.d24Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d24.ninthLord))) { points += 2; evidence.push(`D24 9th lord (${d24.ninthLord}) is ${dig(d24.ninthLord)} in D24.`); }
    if (strong.includes(dig(d24.fifthLord))) { points += 2; evidence.push(`D24 5th lord (${d24.fifthLord}) is ${dig(d24.fifthLord)} in D24.`); }
    if (strong.includes(dig(d24.eleventhLord))) { points += 1; evidence.push(`D24 11th lord (${d24.eleventhLord}) is ${dig(d24.eleventhLord)} in D24.`); }
    if (strong.includes(dig(d24.fourthLord))) { points += 1; evidence.push(`D24 4th lord (${d24.fourthLord}) is ${dig(d24.fourthLord)} in D24.`); }
    if (strong.includes(dig(d24.lagnaLord))) { points += 1; evidence.push(`D24 Lagna lord (${d24.lagnaLord}) is ${dig(d24.lagnaLord)} in D24.`); }
    if (strong.includes(dig('Jupiter'))) { points += 1; evidence.push(`Jupiter is ${dig('Jupiter')} in D24.`); }
    if (strong.includes(dig('Mercury'))) { points += 1; evidence.push(`Mercury is ${dig('Mercury')} in D24.`); }
    if (!evidence.length) evidence.push('No strong D24 confirmation factors found for the education axis (5th/9th/11th/4th/Lagna lords, Jupiter, Mercury).');
    const level = points >= 6 ? 'Strong D24 confirmation' : points >= 4 ? 'D24 confirmation' : points >= 2 ? 'Partial D24 confirmation' : points >= 1 ? 'Mixed D24 indication' : 'Weak D24 confirmation';
    return { available: true, d24, points, level, evidence, rule: ruleById('EDU-D24-001') };
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
    return { planets, strongCount, note: 'D9 (Navamsha) is used only as supporting context here — it never overrides the D1/D24 education-timing logic.', rule: ruleById('EDU-D9-001') };
  };

  NS.assessD10ProfessionalContext = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD10 = vargaPosition(chart.ascendant.longitude, 'D10');
    const ascD10SignIndex = SIGNS.indexOf(ascD10.sign);
    function houseSign(h) { return SIGNS[(ascD10SignIndex + h - 1) % 12]; }
    const tenthLord = SIGN_LORD[houseSign(10)];
    const isClassical = SHADBALA_PLANETS.includes(tenthLord);
    const lordP = chart.planets.find(p => p.name === tenthLord);
    const d10 = vargaPosition(lordP.longitude, 'D10');
    const d10DegreeInSign = normalizeDegrees(d10.longitude) % 30;
    const dignity = isClassical ? detailedDignity(tenthLord, d10.sign, d10DegreeInSign).tier : 'Neutral';
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
    return {
      tenthLord, dignity, strong,
      note: 'D10 is used only for professional qualifications that directly affect career — it never overrides the main D1/D24 education logic.',
      rule: ruleById('EDU-D10-001')
    };
  };

  // ---------------------------------------------------------------
  // 3. NATAL EDUCATION PROMISE
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

  NS.assessNatalEducationPromise = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'EDU-NATAL-002');
    const third = classifyHouse(3, 'EDU-NATAL-003');
    const fourth = classifyHouse(4, 'EDU-NATAL-004');
    const fifth = classifyHouse(5, 'EDU-NATAL-005');
    const sixth = classifyHouse(6, 'EDU-NATAL-006');
    const ninth = classifyHouse(9, 'EDU-NATAL-009');
    const tenth = classifyHouse(10, 'EDU-NATAL-010');
    const eleventh = classifyHouse(11, 'EDU-NATAL-011');
    const twelfth = classifyHouse(12, 'EDU-NATAL-012');

    const jupiter = classifyKaraka('Jupiter', 'EDU-NATAL-JUPITER', 9);
    const mercury = classifyKaraka('Mercury', 'EDU-NATAL-MERCURY', 5);
    const moon = classifyKaraka('Moon', 'EDU-NATAL-MOON', 4);
    const sun = classifyKaraka('Sun', 'EDU-NATAL-SUN', 10);
    const venus = classifyKaraka('Venus', 'EDU-NATAL-VENUS', 5);
    const saturn = classifyKaraka('Saturn', 'EDU-NATAL-SATURN', 9);

    const secondH = NS.getHouseSnapshot(2), fourthH = NS.getHouseSnapshot(4), fifthH = NS.getHouseSnapshot(5),
      ninthH = NS.getHouseSnapshot(9), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'EDU-5-9', a: fifthH, b: ninthH }, { id: 'EDU-4-9', a: fourthH, b: ninthH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const higherEdu_5_9_11 = [relationships.find(r => r.houseA === 5 && r.houseB === 9).connected,
      housesConnected(ninthH, eleventhH, chart).connected, housesConnected(fifthH, eleventhH, chart).connected].filter(Boolean).length >= 2;
    const higherEdu_2_5_9 = [housesConnected(secondH, fifthH, chart).connected,
      relationships.find(r => r.houseA === 5 && r.houseB === 9).connected, housesConnected(secondH, ninthH, chart).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('EDU-5-9-11'), present: higherEdu_5_9_11, evidence: `5th/9th/11th convergence: ${higherEdu_5_9_11 ? 'present' : 'not present'}.` },
      { rule: ruleById('EDU-2-5-9'), present: higherEdu_2_5_9, evidence: `2nd/5th/9th convergence: ${higherEdu_2_5_9 ? 'present' : 'not present'}.` }
    ];

    const foreignEducation = [housesConnected(ninthH, twelfthH, chart).connected, housesConnected(fifthH, twelfthH, chart).connected,
      NS.getPlanetSnapshot('Rahu').house === 9 || NS.getPlanetSnapshot('Rahu').house === 12].filter(Boolean).length >= 2;

    const connectedCount = relationships.filter(r => r.connected).length;
    const overall = connectedCount >= 1 && (fifth.result === 'Strong' || fifth.result === 'Supporting' || ninth.result === 'Strong' || ninth.result === 'Supporting')
      ? 'The chart supports higher education.'
      : connectedCount >= 1 ? 'The chart shows a moderate indication for higher education.'
      : 'The chart shows limited natal indication for higher education; any apparent activation should be weighed cautiously.';

    return {
      secondHouse: second, thirdHouse: third, fourthHouse: fourth, fifthHouse: fifth, sixthHouse: sixth,
      ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      jupiter, mercury, moon, sun, venus, saturn,
      relationships, convergenceSignatures, foreignEducation, connectedCount, overall
    };
  };

  // ---------------------------------------------------------------
  // 4. EDUCATION TYPE CLASSIFICATION (Section 10)
  // ---------------------------------------------------------------
  NS.classifyEducationType = function (natalPromise) {
    const chart = NS.getChartData();
    const tenth = NS.getHouseSnapshot(10);
    const types = [];
    if (natalPromise.jupiter.result === 'Strong' || natalPromise.jupiter.result === 'Supporting') types.push('Postgraduate / Advanced Education');
    if (natalPromise.saturn.result === 'Strong' || natalPromise.saturn.result === 'Supporting') types.push('Technical / Engineering Education');
    if (natalPromise.venus.result === 'Strong' || natalPromise.venus.result === 'Supporting') types.push('Arts / Humanities / Design Education');
    if (natalPromise.mercury.result === 'Strong' || natalPromise.mercury.result === 'Supporting') types.push('Finance / Accounting / Analytical Education');
    if (housesConnected(NS.getHouseSnapshot(5), tenth, chart).connected || housesConnected(NS.getHouseSnapshot(9), tenth, chart).connected) types.push('Management / Business / Professional Qualification');
    if (natalPromise.foreignEducation) types.push('Foreign Higher Education');
    if (natalPromise.jupiter.result === 'Strong' && natalPromise.ninthHouse.result === 'Strong') types.push('Research / Doctoral Education');
    if (!types.length) types.push('Undergraduate / General Higher Education');
    return {
      types: Array.from(new Set(types)),
      note: 'A specific degree or institution is never invented from astrology alone; these are broad thematic indications only.',
      rule: ruleById('EDU-TYPE-001')
    };
  };

  // ---------------------------------------------------------------
  // 5. VIMSHOTTARI DASHA — Education Activation Map
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.educationFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (EDUCATION_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => EDUCATION_HOUSES.includes(h)).join(', ')}.`);
    if (EDUCATION_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const fifth = NS.getHouseSnapshot(5), ninth = NS.getHouseSnapshot(9), eleventh = NS.getHouseSnapshot(11);
    if (lordName === fifth.lord) factors.push(`${lordName} is the 5th lord.`);
    if (lordName === ninth.lord) factors.push(`${lordName} is the 9th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (lordName === 'Jupiter' || lordName === 'Mercury') factors.push(`${lordName} is a natural learning/education significator.`);
    const ninthConnection = lordName === ninth.lord || p.conjunctWith.includes(ninth.lord) || p.aspectedBy.includes(ninth.lord);
    if (ninthConnection && lordName !== ninth.lord) factors.push(`${lordName} is connected to the 9th lord (${ninth.lord}) by conjunction/aspect.`);
    const d24 = NS.getD24();
    const d24Confirmation = d24 ? (() => {
      const pD24 = d24.planets.find(x => x.name === lordName);
      return [5, 9, 11].includes(pD24.d24House) || [d24.fifthLord, d24.ninthLord, d24.eleventhLord].includes(lordName);
    })() : false;
    if (d24Confirmation) factors.push(`${lordName} is connected to the D24 education axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, ninthConnection, d24Confirmation };
  };

  NS.buildEducationActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.educationFactorsForLord(md.lord);
        const adFactors = NS.educationFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.educationFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const ninthConnection = mdFactors.ninthConnection || adFactors.ninthConnection || pdFactors.ninthConnection;
          const d24Confirmation = mdFactors.d24Confirmation || adFactors.d24Confirmation || pdFactors.d24Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, ninthConnection, d24Confirmation, matchCount, reasons, lordsInvolved });
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
    const ninthLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(9).lord);

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
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === ninthLordNatal.signIndex) || signIdx === ninthLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 9th lord's sign (${ninthLordNatal.sign}).`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [4, 5, 9, 11], 'EDU-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [5, 9, 11], 'EDU-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [5, 9, 11], 'EDU-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [5, 9, 11], 'EDU-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 7. EVENT STAGE (Admission/Commencement/Examination/Result/
  //    Completion/Qualification) with differential exam-vs-result
  //    weighting (Section 17)
  // ---------------------------------------------------------------
  NS.classifyStage = function (candidate, d24, transit) {
    const h = candidate.activatedHouses;
    const secondInvolved = h.includes(2), thirdInvolved = h.includes(3), fifthInvolved = h.includes(5),
      sixthInvolved = h.includes(6), ninthInvolved = h.includes(9), eleventhInvolved = h.includes(11);
    const d24Confirms = candidate.d24Confirmation;

    const examWeight = [fifthInvolved, sixthInvolved, thirdInvolved].filter(Boolean).length;
    const resultWeight = [fifthInvolved, ninthInvolved, eleventhInvolved, transit.jupiter.active].filter(Boolean).length;
    const completionWeight = [ninthInvolved, eleventhInvolved, secondInvolved, d24Confirms].filter(Boolean).length;

    if (ninthInvolved && eleventhInvolved && !d24Confirms) return { label: 'Admission', rule: ruleById('EDU-STAGE-001') };
    if (ninthInvolved && fifthInvolved && !eleventhInvolved && !d24Confirms) return { label: 'Commencement', rule: ruleById('EDU-STAGE-001') };
    if (examWeight >= 2 && examWeight >= resultWeight && examWeight >= completionWeight) return { label: 'Examination', rule: ruleById('EDU-STAGE-001') };
    if (completionWeight >= 3 && completionWeight > resultWeight) return { label: 'Completion', rule: ruleById('EDU-STAGE-001') };
    if (resultWeight >= 3) return { label: 'Result', rule: ruleById('EDU-STAGE-001') };
    if (d24Confirms && eleventhInvolved) return { label: 'Qualification', rule: ruleById('EDU-STAGE-001') };
    return { label: 'Application', rule: ruleById('EDU-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 8. EVENT CLASSIFICATION (education sub-type for display)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, d24, natalPromise, stage) {
    const h = candidate.activatedHouses;
    const tenthInvolved = h.includes(10), twelfthInvolved = h.includes(12);
    if (natalPromise.foreignEducation && (h.includes(9) || twelfthInvolved)) return { label: 'Foreign Higher Education', baseLabel: stage.label, rule: ruleById('EDU-FOREIGN-001') };
    if (tenthInvolved && h.includes(5) && h.includes(9) && h.includes(11)) return { label: 'Professional Qualification', baseLabel: stage.label, rule: ruleById('EDU-PROFQUAL-001') };
    return { label: stage.label, baseLabel: stage.label, rule: ruleById('EDU-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 9. CROSS-MODULE CHECKS (Foreign Travel + Career-linked)
  // ---------------------------------------------------------------
  NS.checkForeignEducationCrossCheck = function (candidate) {
    if (!window.ForeignTravelTiming) return null;
    const ftResult = window.ForeignTravelTiming.refresh();
    if (!ftResult) return null;
    const overlapping = ftResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, foreignTravelEvent: overlapping.event.label,
      interpretation: 'Education indication and foreign-location indication are shown separately — not every 9th/12th combination means foreign education.',
      rule: ruleById('EDU-FOREIGN-CROSSCHECK-001')
    };
  };

  NS.checkCareerCrossCheck = function (candidate) {
    const modules = [
      { mod: window.CareerStartTiming, label: 'Career Start Timing' },
      { mod: window.PromotionTiming, label: 'Promotion Timing' },
      { mod: window.BusinessStartTiming, label: 'Business Start Timing' },
      { mod: window.JobChangeTiming, label: 'Job Change Timing' }
    ];
    for (const { mod, label } of modules) {
      if (!mod) continue;
      const result = mod.refresh();
      if (!result || !result.candidateWindows) continue;
      const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
      if (overlapping) {
        return {
          overlapping: true, sourceModule: label, careerEvent: overlapping.event.label,
          interpretation: `Qualification → Career Opportunity: this period overlaps a candidate window from ${label}.`,
          rule: ruleById('EDU-CAREER-CROSSCHECK-001')
        };
      }
    }
    return null;
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
    const activationMap = NS.buildEducationActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d24 = NS.assessD24Confirmation();
    const natalPromise = NS.assessNatalEducationPromise();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyStage(c, d24, transit);
      const event = NS.classifyEvent(c, d24, natalPromise, stage);
      const foreignCrossCheck = NS.checkForeignEducationCrossCheck(c);
      const careerCrossCheck = NS.checkCareerCrossCheck(c);
      const convergenceFactors = [c.ninthConnection, c.d24Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('EDU-STRENGTH-001') };
      return Object.assign({}, c, { transit, stage, event, foreignCrossCheck, careerCrossCheck, convergenceFactors, qualification, strength });
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
    function activated(lordName) { return lordName ? NS.educationFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.educationFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d24 = NS.assessD24Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      fifthActivation: houseActivated(5), ninthActivation: houseActivated(9), eleventhActivation: houseActivated(11), secondActivation: lords.some(activated),
      d24Level: d24.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Education Promise (2nd/3rd/4th/5th/6th/9th/10th/11th/12th)', anchor: 'edu-sec-promise' },
    { id: 2, label: 'Higher Education / Admission / Examination / Completion signatures', anchor: 'edu-sec-signature' },
    { id: 3, label: 'Education Type Classification', anchor: 'edu-sec-type' },
    { id: 4, label: 'Mahadasha activates education houses', anchor: 'edu-sec-dasha' },
    { id: 5, label: 'Antardasha activates education houses', anchor: 'edu-sec-dasha' },
    { id: 6, label: 'Pratyantardasha activates education houses', anchor: 'edu-sec-dasha' },
    { id: 7, label: 'D24 confirms educational direction', anchor: 'edu-sec-d24' },
    { id: 8, label: 'D9 supporting context (optional, non-overriding)', anchor: 'edu-sec-d9' },
    { id: 9, label: 'D10 professional-qualification context (optional, non-overriding)', anchor: 'edu-sec-d10' },
    { id: 10, label: 'Jupiter supports higher-education opportunity', anchor: 'edu-sec-windows' },
    { id: 11, label: 'Saturn supports discipline/structured study', anchor: 'edu-sec-windows' },
    { id: 12, label: 'Candidate Education Window', anchor: 'edu-sec-windows' },
    { id: 13, label: 'Event Stage Classification', anchor: 'edu-sec-windows' },
    { id: 14, label: 'Foreign Education / Career cross-checks', anchor: 'edu-sec-crosscheck' }
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
    const natalPromise = NS.assessNatalEducationPromise();
    log(calculationLog, '[02] 2nd/3rd/4th/5th/6th/9th/10th/11th/12th houses and Jupiter/Mercury/Moon/Sun/Venus/Saturn analysed');
    const educationType = NS.classifyEducationType(natalPromise);
    log(calculationLog, '[03] Education type classified: ' + educationType.types.join(', '));
    const d24 = NS.assessD24Confirmation();
    log(calculationLog, '[04] D24 (Chaturvimshamsha) education confirmation computed: ' + d24.level);
    const d9Context = NS.getD9Context();
    log(calculationLog, '[05] D9 (Navamsha) supporting context computed (non-overriding)');
    const d10Context = NS.assessD10ProfessionalContext();
    log(calculationLog, '[06] D10 (Dashamsha) professional-qualification context computed (non-overriding)');

    const missing = [];
    let windowsResult = { available: false, windows: [] };
    let currentDasha = null;
    if (!state.dasha || !state.dasha.length) {
      missing.push('Vimshottari Dasha');
    } else {
      log(calculationLog, '[07] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx];
        const aIdx = findCurrentIndex(md.antardashas);
        const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null;
        if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = {
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.educationFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.educationFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.educationFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[08] Education Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[09] Candidate education windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (eventFilter && eventFilter !== 'All') {
      windows = windows.filter(w => w.event.baseLabel === eventFilter || w.event.label === eventFilter);
      log(calculationLog, '[10] Filtered by education event: ' + eventFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['EDU-NATAL-002', 'EDU-NATAL-003', 'EDU-NATAL-004', 'EDU-NATAL-005', 'EDU-NATAL-006', 'EDU-NATAL-009', 'EDU-NATAL-010', 'EDU-NATAL-011', 'EDU-NATAL-012', 'EDU-NATAL-JUPITER', 'EDU-NATAL-MERCURY', 'EDU-NATAL-MOON', 'EDU-NATAL-SUN', 'EDU-NATAL-VENUS', 'EDU-NATAL-SATURN', 'EDU-5-9', 'EDU-4-9', 'EDU-5-9-11', 'EDU-2-5-9', 'EDU-ADMISSION-001', 'EDU-EXAM-001', 'EDU-COMPLETION-001', 'EDU-PROFQUAL-001', 'EDU-FOREIGN-001', 'EDU-D24-001', 'EDU-D9-001', 'EDU-D10-001', 'EDU-TYPE-001']);
    if (windowsResult.available) { rulesUsedIds.add('EDU-DASHA-001'); rulesUsedIds.add('EDU-TRANSIT-JUP'); rulesUsedIds.add('EDU-TRANSIT-SAT'); rulesUsedIds.add('EDU-TRANSIT-NODES'); rulesUsedIds.add('EDU-STAGE-001'); rulesUsedIds.add('EDU-EXAMRESULT-001'); rulesUsedIds.add('EDU-FOREIGN-CROSSCHECK-001'); rulesUsedIds.add('EDU-CAREER-CROSSCHECK-001'); rulesUsedIds.add('EDU-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, educationType, d24Confirmation: d24, d9Context, d10Context, currentDasha,
      candidateWindows: windows, horizonYears: horizon, eventFilter: eventFilter || 'All',
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, eventFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
