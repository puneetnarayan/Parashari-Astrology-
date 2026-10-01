/* =========================================================
   CAREER START / FIRST JOB TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/aspect/dasha/D10/transit calculations throughout —
   same architecture as Promotion Timing and Job Change Timing
   (js/jobChangeTiming/jobChangeTimingEngine.js), with career-start-
   specific houses/significators/rules and an Employment-vs-Business
   and Search-vs-Joining distinction.
   Exposed only as window.CareerStartTiming (namespaced). UI code lives
   entirely in careerStartTimingUI.js — this file returns plain data
   only.
   ========================================================= */

window.CareerStartTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, result }

  const CAREER_START_HOUSES = [2, 3, 6, 9, 10, 11];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[CareerStartTiming]', text); }
  function ruleById(id) { return (window.CAREER_START_TIMING_RULES || []).find(r => r.id === id); }

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
  // 2. D10 (DASHAMSHA)
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
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      planets,
      sixthOccupants: planets.filter(p => p.d10House === 6).map(p => p.name),
      tenthOccupants: planets.filter(p => p.d10House === 10).map(p => p.name),
      eleventhOccupants: planets.filter(p => p.d10House === 11).map(p => p.name)
    };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d10.planets.find(p => p.name === name); return x ? x.d10Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d10.sixthLord))) { points += 2; evidence.push(`D10 6th lord (${d10.sixthLord}) is ${dig(d10.sixthLord)} in D10.`); }
    if (strong.includes(dig(d10.tenthLord))) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${dig(d10.tenthLord)} in D10.`); }
    else if (dig(d10.tenthLord) === 'Debilitated') evidence.push(`D10 10th lord (${d10.tenthLord}) is Debilitated in D10.`);
    if (strong.includes(dig(d10.eleventhLord))) { points += 1; evidence.push(`D10 11th lord (${d10.eleventhLord}) is ${dig(d10.eleventhLord)} in D10.`); }
    if (strong.includes(dig(d10.lagnaLord))) { points += 1; evidence.push(`D10 Lagna lord (${d10.lagnaLord}) is ${dig(d10.lagnaLord)} in D10.`); }
    if (d10.sixthOccupants.length) { points += 1; evidence.push(`D10 6th house occupied by: ${d10.sixthOccupants.join(', ')}.`); }
    if (d10.tenthOccupants.length) { points += 1; evidence.push(`D10 10th house occupied by: ${d10.tenthOccupants.join(', ')}.`); }
    if (d10.eleventhOccupants.length) { points += 1; evidence.push(`D10 11th house occupied by: ${d10.eleventhOccupants.join(', ')}.`); }
    if (strong.includes(dig('Sun'))) { points += 1; evidence.push(`Sun is ${dig('Sun')} in D10.`); }
    if (strong.includes(dig('Saturn'))) { points += 1; evidence.push(`Saturn is ${dig('Saturn')} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for the career-entry axis (6th/10th/11th/Lagna lords, Sun, Saturn).');
    const level = points >= 6 ? 'Strong D10 confirmation' : points >= 4 ? 'D10 confirmation' : points >= 2 ? 'Partial D10 confirmation' : points >= 1 ? 'Mixed D10 indication' : 'Weak D10 confirmation';
    return { d10, points, level, evidence, rule: ruleById('CS-D10-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL CAREER-START PROMISE (Steps 3, 5)
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

  function housesConnected(h1, h2, chart) {
    if (h1.lord === h2.lord) return { connected: true, how: `${h1.house}th and ${h2.house}th houses share the same lord (${h1.lord}).` };
    const l1 = chart.planets.find(p => p.name === h1.lord), l2 = chart.planets.find(p => p.name === h2.lord);
    if (l1.sign === l2.sign) return { connected: true, how: `${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord) are conjunct in ${l1.sign}.` };
    if ((l1.aspectedBy || []).includes(h2.lord) || (l2.aspectedBy || []).includes(h1.lord)) return { connected: true, how: `${h1.lord} and ${h2.lord} (${h1.house}th/${h2.house}th lords) aspect each other.` };
    if (SIGN_LORD[l1.sign] === h2.lord && SIGN_LORD[l2.sign] === h1.lord) return { connected: true, how: `${h1.lord} and ${h2.lord} are in mutual sign exchange (Parivartana).` };
    return { connected: false, how: `No conjunction, aspect, or exchange found between ${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord).` };
  }

  NS.assessNatalCareerStartPromise = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'CS-NATAL-002');
    const third = classifyHouse(3, 'CS-NATAL-003');
    const sixth = classifyHouse(6, 'CS-NATAL-006');
    const ninth = classifyHouse(9, 'CS-NATAL-009');
    const tenth = classifyHouse(10, 'CS-NATAL-010');
    const eleventh = classifyHouse(11, 'CS-NATAL-011');
    const saturn = classifyKaraka('Saturn', 'CS-NATAL-SATURN');
    const sun = classifyKaraka('Sun', 'CS-NATAL-SUN');
    const mercury = classifyKaraka('Mercury', 'CS-NATAL-MERCURY');
    const jupiter = classifyKaraka('Jupiter', 'CS-NATAL-JUPITER');

    const secondH = NS.getHouseSnapshot(2), sixthH = NS.getHouseSnapshot(6), ninthH = NS.getHouseSnapshot(9), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), fifthH = NS.getHouseSnapshot(5);
    const pairs = [
      { id: 'CS-PAIR-6-10', a: sixthH, b: tenthH }, { id: 'CS-PAIR-6-11', a: sixthH, b: eleventhH },
      { id: 'CS-PAIR-10-11', a: tenthH, b: eleventhH }, { id: 'CS-PAIR-2-6-10', a: secondH, b: sixthH },
      { id: 'CS-PAIR-2-11', a: secondH, b: eleventhH }, { id: 'CS-PAIR-9-10', a: ninthH, b: tenthH },
      { id: 'CS-PAIR-5-9-10', a: fifthH, b: tenthH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const connectedCount = relationships.filter(r => r.connected).length;
    const strongCount = [second, third, sixth, ninth, tenth, eleventh].filter(h => h.result === 'Strong' || h.result === 'Supporting').length + connectedCount;
    const challengingCount = [second, third, sixth, ninth, tenth, eleventh].filter(h => h.result === 'Challenging').length;
    const overall = connectedCount >= 2 ? 'The natal chart supports entry into professional employment/service.' : connectedCount === 1 ? 'The natal chart shows a single moderate indication of career entry.' : 'The natal chart shows limited natal indication of career entry; timing should be read cautiously.';

    return { secondHouse: second, thirdHouse: third, sixthHouse: sixth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, saturn, sun, mercury, jupiter, relationships, connectedCount, overall };
  };

  // ---------------------------------------------------------------
  // 4. EMPLOYMENT VS. BUSINESS (Step 6)
  // ---------------------------------------------------------------
  NS.assessEmploymentVsBusiness = function () {
    const promise = NS.assessNatalCareerStartPromise();
    const chart = NS.getChartData();
    const employmentScore = [
      promise.relationships.find(r => r.rule.id === 'CS-PAIR-6-10').connected,
      promise.relationships.find(r => r.rule.id === 'CS-PAIR-6-11').connected,
      promise.sixthHouse.result === 'Strong' || promise.sixthHouse.result === 'Supporting',
      promise.saturn.result === 'Strong' || promise.saturn.result === 'Supporting'
    ].filter(Boolean).length;

    const seventh = NS.getHouseSnapshot(7), tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11);
    const businessRel = housesConnected(seventh, tenth, chart);
    const businessRel11 = housesConnected(seventh, eleventh, chart);
    const businessScore = [
      businessRel.connected, businessRel11.connected,
      promise.mercury.result === 'Strong' || promise.mercury.result === 'Supporting',
      promise.jupiter.result === 'Strong' || promise.jupiter.result === 'Supporting'
    ].filter(Boolean).length;

    let careerEntryType;
    if (employmentScore >= 2 && businessScore >= 2) careerEntryType = 'Mixed employment / independent-career indications';
    else if (employmentScore > businessScore && employmentScore >= 2) careerEntryType = 'Employment / Service';
    else if (businessScore > employmentScore && businessScore >= 2) careerEntryType = 'Business / Self-Employment';
    else careerEntryType = 'Insufficient evidence to distinguish employment from business';

    return {
      careerEntryType, employmentScore, businessScore,
      employmentEvidence: [
        `6th↔10th connected: ${promise.relationships.find(r => r.rule.id === 'CS-PAIR-6-10').connected ? 'Yes' : 'No'}.`,
        `6th↔11th connected: ${promise.relationships.find(r => r.rule.id === 'CS-PAIR-6-11').connected ? 'Yes' : 'No'}.`,
        `6th house: ${promise.sixthHouse.result}.`, `Saturn: ${promise.saturn.result}.`
      ],
      businessEvidence: [
        `7th↔10th connected: ${businessRel.connected ? 'Yes' : 'No'} (${businessRel.how})`,
        `7th↔11th connected: ${businessRel11.connected ? 'Yes' : 'No'} (${businessRel11.how})`,
        `Mercury: ${promise.mercury.result}.`, `Jupiter: ${promise.jupiter.result}.`
      ],
      rule: ruleById('CS-BUSINESS-7-10-11')
    };
  };

  // ---------------------------------------------------------------
  // 5. VIMSHOTTARI DASHA — Career-Start Activation Map (Steps 9-11)
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.careerStartFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (CAREER_START_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => CAREER_START_HOUSES.includes(h)).join(', ')}.`);
    if (CAREER_START_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const sixth = NS.getHouseSnapshot(6), tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11);
    if (lordName === sixth.lord) factors.push(`${lordName} is the 6th lord.`);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (lordName === 'Saturn') factors.push('Saturn is the natural employment/service karaka.');
    if (lordName === 'Sun') factors.push('Sun is the natural authority/identity karaka.');
    const sixthConnection = lordName === sixth.lord || p.conjunctWith.includes(sixth.lord) || p.aspectedBy.includes(sixth.lord);
    const tenthConnection = lordName === tenth.lord || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord);
    const eleventhConnection = lordName === eleventh.lord || p.conjunctWith.includes(eleventh.lord) || p.aspectedBy.includes(eleventh.lord);
    if (sixthConnection && lordName !== sixth.lord) factors.push(`${lordName} is connected to the 6th lord (${sixth.lord}) by conjunction/aspect.`);
    if (tenthConnection && lordName !== tenth.lord) factors.push(`${lordName} is connected to the 10th lord (${tenth.lord}) by conjunction/aspect.`);
    if (eleventhConnection && lordName !== eleventh.lord) factors.push(`${lordName} is connected to the 11th lord (${eleventh.lord}) by conjunction/aspect.`);
    const d10 = NS.getD10();
    const pD10 = d10.planets.find(x => x.name === lordName);
    const d10Confirmation = [6, 10, 11].includes(pD10.d10House) || [d10.sixthLord, d10.tenthLord, d10.eleventhLord].includes(lordName);
    if (d10Confirmation) factors.push(`${lordName} is connected to the D10 career-entry axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, sixthConnection, tenthConnection, eleventhConnection, d10Confirmation };
  };

  NS.buildCareerStartActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.careerStartFactorsForLord(md.lord);
        const adFactors = NS.careerStartFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.careerStartFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const sixthConnection = mdFactors.sixthConnection || adFactors.sixthConnection || pdFactors.sixthConnection;
          const tenthConnection = mdFactors.tenthConnection || adFactors.tenthConnection || pdFactors.tenthConnection;
          const eleventhConnection = mdFactors.eleventhConnection || adFactors.eleventhConnection || pdFactors.eleventhConnection;
          const d10Confirmation = mdFactors.d10Confirmation || adFactors.d10Confirmation || pdFactors.d10Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, sixthConnection, tenthConnection, eleventhConnection, d10Confirmation, matchCount, reasons });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 6. TRANSIT (Steps 13-14)
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const sixth = NS.getHouseSnapshot(6), tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11), ninth = NS.getHouseSnapshot(9);
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
    return { date, jupiter: checkBody('Jupiter', [10, 6, 11, 9], 'CS-TRANSIT-JUP'), saturn: checkBody('Saturn', [6, 10, 11], 'CS-TRANSIT-SAT') };
  };

  // ---------------------------------------------------------------
  // 7. EVENT CLASSIFICATION (Step 17) + SEARCH/JOINING STAGE (Step 18)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, d10, employmentVsBusiness) {
    const d10Confirms = d10.points >= 4;
    const strongEmployment = candidate.sixthConnection && candidate.tenthConnection && candidate.eleventhConnection && d10Confirms;
    const strongAppointment = candidate.tenthConnection && candidate.eleventhConnection && d10Confirms;
    const businessLeaning = employmentVsBusiness.careerEntryType === 'Business / Self-Employment' || employmentVsBusiness.careerEntryType === 'Mixed employment / independent-career indications';

    if (businessLeaning && candidate.tenthConnection && candidate.eleventhConnection) {
      if (employmentVsBusiness.careerEntryType === 'Mixed employment / independent-career indications') return { label: 'Mixed Employment / Business Indications — review both possibilities', rule: ruleById('CS-EVENT-001') };
      return { label: 'Business / Self-Employment Start', rule: ruleById('CS-EVENT-001') };
    }
    if (strongEmployment) return { label: 'First Salaried Employment', rule: ruleById('CS-EVENT-001') };
    if (strongAppointment) return { label: 'First Major Professional Appointment', rule: ruleById('CS-EVENT-001') };
    if (candidate.sixthConnection && candidate.tenthConnection && !candidate.eleventhConnection) return { label: 'Internship / Apprenticeship (weaker gain/11th support)', rule: ruleById('CS-EVENT-001') };
    return { label: 'Career Entry Activation (evidence insufficient for a specific classification)', rule: ruleById('CS-EVENT-001') };
  };

  NS.classifyStage = function (candidate, transit) {
    const searchSignal = candidate.activatedHouses.includes(3) && !(candidate.sixthConnection && candidate.tenthConnection && candidate.eleventhConnection);
    const joiningSignal = candidate.sixthConnection && candidate.tenthConnection && candidate.eleventhConnection && candidate.d10Confirmation;
    let stage;
    if (joiningSignal) stage = 'Selection / Joining';
    else if (searchSignal) stage = 'Search / Application';
    else stage = 'Selection (partial evidence)';
    return { stage, rule: ruleById('CS-SEARCH-JOIN-001') };
  };

  // ---------------------------------------------------------------
  // 8. CANDIDATE WINDOWS (Step 16)
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
    const activationMap = NS.buildCareerStartActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d10 = NS.assessD10Confirmation();
    const employmentVsBusiness = NS.assessEmploymentVsBusiness();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const event = NS.classifyEvent(c, d10, employmentVsBusiness);
      const stage = NS.classifyStage(c, transit);
      const convergenceFactors = [c.sixthConnection, c.tenthConnection, c.eleventhConnection, c.d10Confirmation, transit.jupiter.active, transit.saturn.active].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      return Object.assign({}, c, { transit, event, stage, convergenceFactors, qualification });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged, employmentVsBusiness };
  };

  // ---------------------------------------------------------------
  // 9. HISTORICAL VALIDATION (Step 22)
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
    function activated(lordName) { return lordName ? NS.careerStartFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.careerStartFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d10 = NS.assessD10Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      secondActivation: houseActivated(2), sixthActivation: houseActivated(6), ninthActivation: houseActivated(9),
      tenthActivation: lords.some(activated), eleventhActivation: houseActivated(11),
      d10Level: d10.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Career-Start Promise', anchor: 'cs-sec-promise' },
    { id: 2, label: '6th house supports service', anchor: 'cs-sec-promise' },
    { id: 3, label: '10th house supports profession', anchor: 'cs-sec-promise' },
    { id: 4, label: '11th house supports realization/gain', anchor: 'cs-sec-promise' },
    { id: 5, label: '2nd supports income', anchor: 'cs-sec-promise' },
    { id: 6, label: 'Mahadasha activates 10th', anchor: 'cs-sec-dasha' },
    { id: 7, label: 'Antardasha activates 6th', anchor: 'cs-sec-dasha' },
    { id: 8, label: 'Pratyantardasha activates 11th', anchor: 'cs-sec-dasha' },
    { id: 9, label: 'D10 confirms professional entry', anchor: 'cs-sec-d10' },
    { id: 10, label: 'Jupiter supports opportunity', anchor: 'cs-sec-windows' },
    { id: 11, label: 'Saturn supports formal employment', anchor: 'cs-sec-windows' },
    { id: 12, label: 'Candidate joining window', anchor: 'cs-sec-windows' },
    { id: 13, label: 'Event classification', anchor: 'cs-sec-windows' }
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
    const natalPromise = NS.assessNatalCareerStartPromise();
    log(calculationLog, '[02] 2nd/3rd/6th/9th/10th/11th houses and Saturn/Sun/Mercury/Jupiter analysed');
    const employmentVsBusiness = NS.assessEmploymentVsBusiness();
    log(calculationLog, '[03] Employment vs. Business distinction computed: ' + employmentVsBusiness.careerEntryType);
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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.careerStartFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.careerStartFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.careerStartFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[06] Career Start Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate first-job windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['CS-NATAL-002', 'CS-NATAL-003', 'CS-NATAL-006', 'CS-NATAL-009', 'CS-NATAL-010', 'CS-NATAL-011', 'CS-NATAL-SATURN', 'CS-NATAL-SUN', 'CS-NATAL-MERCURY', 'CS-NATAL-JUPITER', 'CS-PAIR-6-10', 'CS-PAIR-6-11', 'CS-PAIR-10-11', 'CS-PAIR-2-6-10', 'CS-PAIR-2-11', 'CS-PAIR-9-10', 'CS-PAIR-5-9-10', 'CS-BUSINESS-7-10-11', 'CS-D10-001', 'CS-EDUCATION-001']);
    if (windowsResult.available) { rulesUsedIds.add('CS-DASHA-001'); rulesUsedIds.add('CS-TRANSIT-JUP'); rulesUsedIds.add('CS-TRANSIT-SAT'); rulesUsedIds.add('CS-EVENT-001'); rulesUsedIds.add('CS-SEARCH-JOIN-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, employmentVsBusiness, d10Confirmation: d10, currentDasha,
      candidateWindows: windowsResult.windows, horizonYears: horizon,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
