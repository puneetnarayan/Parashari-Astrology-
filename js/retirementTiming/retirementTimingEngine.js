/* =========================================================
   RETIREMENT TIMING — pure calculation engine. Parashari/Vimshottari
   method only: no KP sub-lords/significators/ruling-planets, no
   Western technique. Reuses this app's existing chart/dignity/
   aspect/dasha/divisional-chart/transit calculations throughout —
   same architecture as the twelve prior timing modules in this app.
   This is strictly a CAREER-TRANSITION event-timing module: it never
   predicts health, lifespan, or death, and never infers the
   motivation behind a voluntary/early retirement.
   Exposed only as window.RetirementTiming (namespaced). UI code
   lives entirely in retirementTimingUI.js — this file returns plain
   data only.
   ========================================================= */

window.RetirementTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, eventFilter, expectedAge, result }

  const CAREER_HOUSES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[RetirementTiming]', text); }
  function ruleById(id) { return (window.RETIREMENT_TIMING_RULES || []).find(r => r.id === id); }

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
      sixthSign: houseSign(6), sixthLord: SIGN_LORD[houseSign(6)],
      tenthSign: houseSign(10), tenthLord: SIGN_LORD[houseSign(10)],
      twelfthSign: houseSign(12), twelfthLord: SIGN_LORD[houseSign(12)],
      planets, available: true
    };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    if (!d10) return { available: false, level: 'D10 confirmation unavailable', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('RET-D10-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d10.planets.find(p => p.name === name); return x ? x.d10Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d10.tenthLord))) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${dig(d10.tenthLord)} in D10.`); }
    if (strong.includes(dig(d10.sixthLord))) { points += 1; evidence.push(`D10 6th lord (${d10.sixthLord}) is ${dig(d10.sixthLord)} in D10.`); }
    if (strong.includes(dig(d10.twelfthLord))) { points += 1; evidence.push(`D10 12th lord (${d10.twelfthLord}) is ${dig(d10.twelfthLord)} in D10.`); }
    if (strong.includes(dig(d10.lagnaLord))) { points += 1; evidence.push(`D10 Lagna lord (${d10.lagnaLord}) is ${dig(d10.lagnaLord)} in D10.`); }
    if (strong.includes(dig('Saturn'))) { points += 2; evidence.push(`Saturn is ${dig('Saturn')} in D10.`); }
    if (strong.includes(dig('Sun'))) { points += 1; evidence.push(`Sun is ${dig('Sun')} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for the career-transition axis (10th/6th/12th/Lagna lords, Saturn, Sun).');
    const level = points >= 6 ? 'Strong D10 confirmation' : points >= 4 ? 'D10 confirmation' : points >= 2 ? 'Partial D10 confirmation' : points >= 1 ? 'Mixed D10 indication' : 'Weak D10 confirmation';
    return { available: true, d10, points, level, evidence, rule: ruleById('RET-D10-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL CAREER STRUCTURE
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

  NS.assessNatalCareerStructure = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'RET-NATAL-002');
    const third = classifyHouse(3, 'RET-NATAL-003');
    const fourth = classifyHouse(4, 'RET-NATAL-004');
    const fifth = classifyHouse(5, 'RET-NATAL-005');
    const sixth = classifyHouse(6, 'RET-NATAL-006');
    const eighth = classifyHouse(8, 'RET-NATAL-008');
    const ninth = classifyHouse(9, 'RET-NATAL-009');
    const tenth = classifyHouse(10, 'RET-NATAL-010');
    const eleventh = classifyHouse(11, 'RET-NATAL-011');
    const twelfth = classifyHouse(12, 'RET-NATAL-012');

    const saturn = classifyKaraka('Saturn', 'RET-NATAL-SATURN', 10);
    const sun = classifyKaraka('Sun', 'RET-NATAL-SUN', 10);
    const mercury = classifyKaraka('Mercury', 'RET-NATAL-MERCURY', 3);
    const jupiter = classifyKaraka('Jupiter', 'RET-NATAL-JUPITER', 9);
    const venus = classifyKaraka('Venus', 'RET-NATAL-VENUS', 4);
    const moon = classifyKaraka('Moon', 'RET-NATAL-MOON', 4);

    const thirdH = NS.getHouseSnapshot(3), fourthH = NS.getHouseSnapshot(4), sixthH = NS.getHouseSnapshot(6),
      seventhH = NS.getHouseSnapshot(7), eighthH = NS.getHouseSnapshot(8), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'RET-10-12', a: tenthH, b: twelfthH }, { id: 'RET-6-12', a: sixthH, b: twelfthH },
      { id: 'RET-10-8', a: tenthH, b: eighthH }, { id: 'RET-10-4', a: tenthH, b: fourthH },
      { id: 'RET-10-11-COMPLETION', a: tenthH, b: eleventhH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const businessTransition = [housesConnected(tenthH, seventhH, chart).connected, housesConnected(tenthH, eleventhH, chart).connected,
      housesConnected(thirdH, seventhH, chart).connected, housesConnected(thirdH, tenthH, chart).connected].filter(Boolean).length >= 2;
    const consultancyTransition = [mercury.result === 'Strong' || mercury.result === 'Supporting', jupiter.result === 'Strong' || jupiter.result === 'Supporting', venus.result === 'Strong' || venus.result === 'Supporting'].filter(Boolean).length >= 1;

    const withdrawalSignatureCount = relationships.filter(r => r.connected).length;
    const overall = withdrawalSignatureCount >= 3
      ? 'The chart contains indicators of a significant career transition.'
      : withdrawalSignatureCount >= 1 ? 'The chart shows a moderate indication of career-structure change.'
      : 'The chart shows limited natal indication for an active career transition at this time; any apparent activation should be weighed cautiously.';

    const longInstitutional = (saturn.result === 'Strong' || saturn.result === 'Supporting') && (sun.result === 'Strong' || sun.result === 'Supporting');
    const structureNote = longInstitutional
      ? 'The chart shows a strong long-term professional structure.'
      : consultancyTransition
      ? 'The chart supports continued independent activity after formal employment.'
      : withdrawalSignatureCount >= 2
      ? 'The chart shows a transition from institutional work toward independent activity.'
      : 'The chart shows a typical career structure without a pronounced long-term-institutional or independent-activity bias.';

    return {
      secondHouse: second, thirdHouse: third, fourthHouse: fourth, fifthHouse: fifth, sixthHouse: sixth,
      eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      saturn, sun, mercury, jupiter, venus, moon,
      relationships, businessTransition, consultancyTransition, longInstitutional, structureNote,
      withdrawalSignatureCount, overall
    };
  };

  // ---------------------------------------------------------------
  // 4. VIMSHOTTARI DASHA — Career-Transition Activation Map
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.transitionFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (CAREER_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => CAREER_HOUSES.includes(h)).join(', ')}.`);
    if (CAREER_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const tenth = NS.getHouseSnapshot(10), sixth = NS.getHouseSnapshot(6), twelfth = NS.getHouseSnapshot(12);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === sixth.lord) factors.push(`${lordName} is the 6th lord.`);
    if (lordName === twelfth.lord) factors.push(`${lordName} is the 12th lord.`);
    if (lordName === 'Saturn') factors.push('Saturn is the natural career-duration/duty significator.');
    const tenthConnection = lordName === tenth.lord || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord);
    if (tenthConnection && lordName !== tenth.lord) factors.push(`${lordName} is connected to the 10th lord (${tenth.lord}) by conjunction/aspect.`);
    const twelfthConnection = lordName === twelfth.lord || p.conjunctWith.includes(twelfth.lord) || p.aspectedBy.includes(twelfth.lord);
    if (twelfthConnection && lordName !== twelfth.lord) factors.push(`${lordName} is connected to the 12th lord (${twelfth.lord}) by conjunction/aspect.`);
    const d10 = NS.getD10();
    const d10Confirmation = d10 ? (() => {
      const pD10 = d10.planets.find(x => x.name === lordName);
      return [10, 6, 12].includes(pD10.d10House) || [d10.tenthLord, d10.sixthLord, d10.twelfthLord].includes(lordName);
    })() : false;
    if (d10Confirmation) factors.push(`${lordName} is connected to the D10 career-transition axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, tenthConnection, twelfthConnection, d10Confirmation };
  };

  NS.buildTransitionActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.transitionFactorsForLord(md.lord);
        const adFactors = NS.transitionFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.transitionFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const tenthConnection = mdFactors.tenthConnection || adFactors.tenthConnection || pdFactors.tenthConnection;
          const twelfthConnection = mdFactors.twelfthConnection || adFactors.twelfthConnection || pdFactors.twelfthConnection;
          const d10Confirmation = mdFactors.d10Confirmation || adFactors.d10Confirmation || pdFactors.d10Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, tenthConnection, twelfthConnection, d10Confirmation, matchCount, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 5. TRANSIT — Saturn primary, Jupiter primary, nodes secondary
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
      saturn: checkBody('Saturn', [4, 6, 10, 12], 'RET-TRANSIT-SAT'),
      jupiter: checkBody('Jupiter', [4, 9, 10, 11, 12], 'RET-TRANSIT-JUP'),
      rahu: checkBody('Rahu', [10, 12], 'RET-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [10, 12], 'RET-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 6. CROSS-MODULE CHECKS (Job Change, Business Start, Financial
  //    Gain, Relocation — descriptive reference only for Relocation,
  //    since that module is location/direction-based, not a timing
  //    module with candidate windows)
  // ---------------------------------------------------------------
  NS.checkJobChangeCrossCheck = function (candidate) {
    if (!window.JobChangeTiming) return null;
    const jcResult = window.JobChangeTiming.refresh();
    if (!jcResult) return null;
    const overlapping = jcResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, jobChangeEvent: overlapping.event.label,
      interpretation: 'This period also overlaps a candidate window from Job Change Timing — the chart contains evidence for either continued professional activity in a new role, or a career exit; both are shown rather than forcing one conclusion.',
      rule: ruleById('RET-VS-JOBCHANGE-001')
    };
  };

  NS.checkBusinessCrossCheck = function (candidate) {
    if (!window.BusinessStartTiming) return null;
    const bsResult = window.BusinessStartTiming.refresh();
    if (!bsResult) return null;
    const overlapping = bsResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, businessEvent: overlapping.event.label,
      interpretation: 'The period appears more consistent with a transition from employment into independent professional activity than complete cessation of work.',
      rule: ruleById('RET-BUSINESS-CROSSCHECK-001')
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
      interpretation: 'Career Exit and Financial Transition are shown as two separate indications here — retirement is never equated with financial loss, and this is not investment advice.',
      rule: ruleById('RET-FINANCIAL-CROSSCHECK-001')
    };
  };

  NS.checkRelocationContext = function (candidate) {
    const residenceThemeHouses = [4, 12, 9];
    const present = candidate.activatedHouses.filter(h => residenceThemeHouses.includes(h)).length >= 2;
    if (!present) return null;
    const relocationModuleAvailable = !!window.Relocation;
    return {
      present: true, relocationModuleAvailable,
      interpretation: relocationModuleAvailable
        ? 'A residence-transition theme (4th/12th/9th) is also active during this period. Career Transition and Residence Transition are shown separately — see the Relocation tab for location-specific guidance; no relocation calculation is duplicated here.'
        : 'A residence-transition theme (4th/12th/9th) is also active during this period, shown as a separate indication from the career transition itself.',
      rule: ruleById('RET-D4-RELOCATION-CROSSCHECK-001')
    };
  };

  // ---------------------------------------------------------------
  // 7. RETIREMENT EVENT CLASSIFICATION (Section 20) with external
  //    retirement-age/date context comparison (Section 11/12)
  // ---------------------------------------------------------------
  NS.compareExternalContext = function (candidate, expectedAge, birthDate) {
    if (!expectedAge || !birthDate) return null;
    const expectedDate = new Date(birthDate.getTime());
    expectedDate.setUTCFullYear(expectedDate.getUTCFullYear() + Number(expectedAge));
    const windowMid = new Date((candidate.startDate.getTime() + candidate.endDate.getTime()) / 2);
    const diffYears = (windowMid.getTime() - expectedDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    let comparison;
    if (Math.abs(diffYears) <= 2) comparison = 'Astrological timing overlaps the expected retirement period.';
    else if (diffYears < -2) comparison = 'Astrological career-transition indicators occur earlier than the expected retirement period.';
    else comparison = 'Astrological career-transition indicators occur later than the expected retirement period.';
    return { expectedAge: Number(expectedAge), expectedDate, comparison, diffYears, rule: ruleById('RET-EXTERNAL-CONTEXT-001') };
  };

  NS.classifyEvent = function (candidate, d10, natalPromise, jobChangeCrossCheck, businessCrossCheck, financialCrossCheck, relocationContext, externalContext) {
    const h = candidate.activatedHouses;
    const tenthInvolved = h.includes(10), sixthInvolved = h.includes(6), twelfthInvolved = h.includes(12),
      fourthInvolved = h.includes(4), eleventhInvolved = h.includes(11), eighthInvolved = h.includes(8);
    const d10Confirms = candidate.d10Confirmation;
    const labels = [];

    if (jobChangeCrossCheck && jobChangeCrossCheck.overlapping && !twelfthInvolved) {
      return { labels: ['Career Transition / Mixed'], primary: 'Career Transition / Mixed', rule: ruleById('RET-EVENT-001') };
    }
    if (businessCrossCheck && businessCrossCheck.overlapping) labels.push('Employment to Business');
    if (natalPromise.consultancyTransition && (h.includes(3) || h.includes(5) || h.includes(7) || h.includes(11))) labels.push('Employment to Independent Practice');
    if (sixthInvolved && twelfthInvolved && tenthInvolved && d10Confirms) labels.push('Superannuation');
    else if (tenthInvolved && twelfthInvolved && d10Confirms && candidate.matchCount >= 3) labels.push('Voluntary Retirement');
    else if (tenthInvolved && fourthInvolved && !sixthInvolved) labels.push('Early Retirement');
    else if (tenthInvolved && eleventhInvolved && !twelfthInvolved) labels.push('Planned Retirement');
    else if (twelfthInvolved && !d10Confirms) labels.push('Career Winding-Down');
    if (relocationContext && relocationContext.present) labels.push('Retirement + Relocation');
    if (natalPromise.jupiter && (natalPromise.jupiter.result === 'Strong' || natalPromise.jupiter.result === 'Supporting') && eleventhInvolved) labels.push('Post-Retirement Activity');

    if (!labels.length) return { labels: ['Career Transition / Mixed'], primary: 'Career Transition / Mixed', rule: ruleById('RET-EVENT-001') };
    return { labels: Array.from(new Set(labels)), primary: labels[0], rule: ruleById('RET-EVENT-001') };
  };

  // ---------------------------------------------------------------
  // 8. CANDIDATE WINDOWS + WINDOW STRENGTH (non-numeric)
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

  NS.buildCandidateWindows = function (horizonYears, expectedAge) {
    const activationMap = NS.buildTransitionActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d10 = NS.assessD10Confirmation();
    const natalPromise = NS.assessNatalCareerStructure();
    const chart = NS.getChartData();
    const birthDate = chart && chart.birthUtc ? new Date(chart.birthUtc) : null;

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const jobChangeCrossCheck = NS.checkJobChangeCrossCheck(c);
      const businessCrossCheck = NS.checkBusinessCrossCheck(c);
      const financialCrossCheck = NS.checkFinancialCrossCheck(c);
      const relocationContext = NS.checkRelocationContext(c);
      const externalContext = NS.compareExternalContext(c, expectedAge, birthDate);
      const event = NS.classifyEvent(c, d10, natalPromise, jobChangeCrossCheck, businessCrossCheck, financialCrossCheck, relocationContext, externalContext);
      const convergenceFactors = [c.tenthConnection, c.twelfthConnection, c.d10Confirmation, transit.saturn.active, transit.jupiter.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('RET-STRENGTH-001') };
      return Object.assign({}, c, { transit, event, jobChangeCrossCheck, businessCrossCheck, financialCrossCheck, relocationContext, externalContext, convergenceFactors, qualification, strength });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 9. HISTORICAL VALIDATION
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
    function activated(lordName) { return lordName ? NS.transitionFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.transitionFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d10 = NS.assessD10Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      tenthActivation: houseActivated(10), sixthActivation: houseActivated(6), twelfthActivation: houseActivated(12), fourthActivation: lords.some(activated),
      d10Level: d10.level, saturnActive: transit.saturn.active, jupiterActive: transit.jupiter.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Career Houses (2nd/3rd/4th/5th/6th/7th/8th/9th/10th/11th/12th)', anchor: 'ret-sec-promise' },
    { id: 2, label: 'House Lords', anchor: 'ret-sec-promise' },
    { id: 3, label: 'Natal Career Structure', anchor: 'ret-sec-promise' },
    { id: 4, label: 'External Retirement Context (optional)', anchor: 'ret-sec-external' },
    { id: 5, label: 'Mahadasha activates career/withdrawal houses', anchor: 'ret-sec-dasha' },
    { id: 6, label: 'Antardasha activates career/withdrawal houses', anchor: 'ret-sec-dasha' },
    { id: 7, label: 'Pratyantardasha activates career/withdrawal houses', anchor: 'ret-sec-dasha' },
    { id: 8, label: 'D10 confirms professional transition', anchor: 'ret-sec-d10' },
    { id: 9, label: 'Saturn/Jupiter transit confirmation', anchor: 'ret-sec-windows' },
    { id: 10, label: 'Cross-checks (Job Change, Business, Financial, Relocation)', anchor: 'ret-sec-crosscheck' },
    { id: 11, label: 'Candidate Window', anchor: 'ret-sec-windows' },
    { id: 12, label: 'Retirement Classification', anchor: 'ret-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, eventFilter, expectedAge) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.eventFilter === eventFilter && NS.cache.expectedAge === expectedAge) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalCareerStructure();
    log(calculationLog, '[02] 2nd/3rd/4th/5th/6th/7th/8th/9th/10th/11th/12th houses and Saturn/Sun/Mercury/Jupiter/Venus/Moon analysed');
    log(calculationLog, '[03] Natal career structure: ' + natalPromise.structureNote);
    const d10 = NS.assessD10Confirmation();
    log(calculationLog, '[04] D10 (Dashamsha) professional-transition confirmation computed: ' + d10.level);
    if (expectedAge) log(calculationLog, '[05] External retirement context supplied: expected age ' + expectedAge + ' (contextual only, not an astrological conclusion)');

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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.transitionFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.transitionFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.transitionFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[07] Career-Transition Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon, expectedAge);
      log(calculationLog, '[08] Candidate career-transition windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (eventFilter && eventFilter !== 'All') {
      windows = windows.filter(w => w.event.labels.includes(eventFilter));
      log(calculationLog, '[09] Filtered by retirement event: ' + eventFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['RET-NATAL-002', 'RET-NATAL-003', 'RET-NATAL-004', 'RET-NATAL-005', 'RET-NATAL-006', 'RET-NATAL-008', 'RET-NATAL-009', 'RET-NATAL-010', 'RET-NATAL-011', 'RET-NATAL-012', 'RET-NATAL-SATURN', 'RET-NATAL-SUN', 'RET-NATAL-MERCURY', 'RET-NATAL-JUPITER', 'RET-NATAL-VENUS', 'RET-NATAL-MOON', 'RET-10-12', 'RET-6-12', 'RET-10-8', 'RET-10-4', 'RET-10-11-COMPLETION', 'RET-BUSINESS-10-7', 'RET-CONSULTANCY-001', 'RET-D10-001', 'RET-D4-RELOCATION-CROSSCHECK-001', 'RET-STRUCTURE-001', 'RET-NOHEALTH-001']);
    if (expectedAge) rulesUsedIds.add('RET-EXTERNAL-CONTEXT-001');
    if (windowsResult.available) { rulesUsedIds.add('RET-DASHA-001'); rulesUsedIds.add('RET-TRANSIT-SAT'); rulesUsedIds.add('RET-TRANSIT-JUP'); rulesUsedIds.add('RET-TRANSIT-NODES'); rulesUsedIds.add('RET-VS-JOBCHANGE-001'); rulesUsedIds.add('RET-FINANCIAL-CROSSCHECK-001'); rulesUsedIds.add('RET-BUSINESS-CROSSCHECK-001'); rulesUsedIds.add('RET-EVENT-001'); rulesUsedIds.add('RET-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, d10Confirmation: d10, currentDasha,
      candidateWindows: windows, horizonYears: horizon, eventFilter: eventFilter || 'All', expectedAge: expectedAge || null,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, eventFilter, expectedAge, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
