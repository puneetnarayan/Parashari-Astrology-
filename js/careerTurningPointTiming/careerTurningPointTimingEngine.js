/* =========================================================
   MAJOR CAREER TURNING POINT TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/aspect/dasha/divisional-chart/transit calculations
   throughout — same architecture as the fourteen prior timing
   modules in this app. This module is a broader synthesis layer
   above Job Change / Promotion / Business Start / Retirement Timing
   (and cross-references Recognition/Award, Financial Gain,
   Relocation, Foreign Travel, Higher Education) — it never
   duplicates their calculations, only reads their own `.refresh()`
   output directly.
   Exposed only as window.CareerTurningPointTiming (namespaced). UI
   code lives entirely in careerTurningPointTimingUI.js — this file
   returns plain data only.
   ========================================================= */

window.CareerTurningPointTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, minSupport, eventFilter, result }

  const CAREER_HOUSES = [2, 3, 5, 6, 7, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 4, 'Supportive': 3, 'Moderately Supportive': 2, 'Mixed': 1, 'Conditional': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[CareerTurningPointTiming]', text); }
  function ruleById(id) { return (window.CAREER_TURNING_POINT_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER — reused pattern from every prior timing module
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
  // 2. D10 (confirmation only) — reuse vargaPosition() directly, the
  //    app's EXISTING divisional-chart engine. No new varga engine.
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
      seventhSign: houseSign(7), seventhLord: SIGN_LORD[houseSign(7)],
      ninthSign: houseSign(9), ninthLord: SIGN_LORD[houseSign(9)],
      tenthSign: houseSign(10), tenthLord: SIGN_LORD[houseSign(10)],
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      planets, available: true
    };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    if (!d10) return { available: false, level: 'Does not materially confirm', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('CT-D10-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d10.planets.find(p => p.name === name); return x ? x.d10Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d10.tenthLord))) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${dig(d10.tenthLord)} in D10.`); }
    if (strong.includes(dig(d10.eleventhLord))) { points += 1; evidence.push(`D10 11th lord (${d10.eleventhLord}) is ${dig(d10.eleventhLord)} in D10.`); }
    if (strong.includes(dig(d10.ninthLord))) { points += 1; evidence.push(`D10 9th lord (${d10.ninthLord}) is ${dig(d10.ninthLord)} in D10.`); }
    if (strong.includes(dig(d10.sixthLord))) { points += 1; evidence.push(`D10 6th lord (${d10.sixthLord}) is ${dig(d10.sixthLord)} in D10.`); }
    if (strong.includes(dig(d10.seventhLord))) { points += 1; evidence.push(`D10 7th lord (${d10.seventhLord}) is ${dig(d10.seventhLord)} in D10.`); }
    if (strong.includes(dig(d10.lagnaLord))) { points += 1; evidence.push(`D10 Lagna lord (${d10.lagnaLord}) is ${dig(d10.lagnaLord)} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for the career-transition axis (10th/11th/9th/6th/7th/Lagna lords).');
    const level = points >= 5 ? 'Supports' : points >= 3 ? 'Moderately supports' : points >= 1 ? 'Provides mixed evidence' : 'Does not materially confirm';
    return { available: true, d10, points, level, evidence, rule: ruleById('CT-D10-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL CAREER TURNING-POINT POTENTIAL
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

  NS.assessNatalCareerTurningPointPotential = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'CT-2H-001');
    const third = classifyHouse(3, 'CT-3H-001');
    const fifth = classifyHouse(5, 'CT-5H-001');
    const sixth = classifyHouse(6, 'CT-6H-001');
    const seventh = classifyHouse(7, 'CT-7H-001');
    const ninth = classifyHouse(9, 'CT-9H-001');
    const tenth = classifyHouse(10, 'CT-10H-001');
    const eleventh = classifyHouse(11, 'CT-11H-001');
    const twelfth = classifyHouse(12, 'CT-12H-001');

    const sun = classifyKaraka('Sun', 'CT-NATAL-SUN', 10);
    const saturn = classifyKaraka('Saturn', 'CT-NATAL-SATURN', 10);
    const mercury = classifyKaraka('Mercury', 'CT-NATAL-MERCURY', 10);
    const jupiter = classifyKaraka('Jupiter', 'CT-NATAL-JUPITER', 10);
    const mars = classifyKaraka('Mars', 'CT-NATAL-MARS', 10);
    const rahu = classifyKaraka('Rahu', 'CT-NATAL-RAHU', 10);
    const ketu = classifyKaraka('Ketu', 'CT-NATAL-KETU', 10);

    const secondH = NS.getHouseSnapshot(2), thirdH = NS.getHouseSnapshot(3), fifthH = NS.getHouseSnapshot(5),
      sixthH = NS.getHouseSnapshot(6), seventhH = NS.getHouseSnapshot(7), ninthH = NS.getHouseSnapshot(9),
      tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'CT-SIG-10-6', a: tenthH, b: sixthH }, { id: 'CT-SIG-10-7', a: tenthH, b: seventhH },
      { id: 'CT-SIG-10-11', a: tenthH, b: eleventhH }, { id: 'CT-SIG-10-9', a: tenthH, b: ninthH },
      { id: 'CT-SIG-10-12', a: tenthH, b: twelfthH }, { id: 'CT-SIG-10-3', a: tenthH, b: thirdH },
      { id: 'CT-SIG-10-5', a: tenthH, b: fifthH }, { id: 'CT-SIG-6-12', a: sixthH, b: twelfthH },
      { id: 'CT-SIG-7-10', a: seventhH, b: tenthH }, { id: 'CT-SIG-9-10', a: ninthH, b: tenthH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const convergence_10_11_2 = [relationships.find(r => r.houseA === 10 && r.houseB === 11).connected,
      housesConnected(eleventhH, secondH, chart).connected, housesConnected(tenthH, secondH, chart).connected].filter(Boolean).length >= 2;
    const convergence_10_12_9 = [relationships.find(r => r.houseA === 10 && r.houseB === 12).connected,
      housesConnected(twelfthH, ninthH, chart).connected, relationships.find(r => r.houseA === 10 && r.houseB === 9).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('CT-SIG-10-11-2'), present: convergence_10_11_2, evidence: `10th/11th/2nd convergence: ${convergence_10_11_2 ? 'present' : 'not present'}.` },
      { rule: ruleById('CT-SIG-10-12-9'), present: convergence_10_12_9, evidence: `10th/12th/9th convergence: ${convergence_10_12_9 ? 'present' : 'not present'}.` }
    ];

    const connectedCount = relationships.filter(r => r.connected).length;
    const d10 = NS.assessD10Confirmation();
    let potential;
    if (connectedCount >= 4 && tenth.result !== 'Challenging') potential = 'Clearly Present';
    else if (connectedCount >= 2) potential = 'Present';
    else if (connectedCount === 1) potential = 'Mixed';
    else potential = 'Limited Evidence';

    const reasons = [
      `10th house: ${tenth.result} (${tenth.sign}, lord ${tenth.lord}).`,
      `${connectedCount} of ${relationships.length} career-house relationship signatures connected.`,
      `Sun: ${sun.result}, Saturn: ${saturn.result}, Jupiter: ${jupiter.result}.`,
      `D10 confirmation: ${d10.level}.`
    ];

    return {
      secondHouse: second, thirdHouse: third, fifthHouse: fifth, sixthHouse: sixth, seventhHouse: seventh,
      ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      sun, saturn, mercury, jupiter, mars, rahu, ketu,
      relationships, convergenceSignatures, connectedCount, potential, reasons
    };
  };

  // ---------------------------------------------------------------
  // 4. VIMSHOTTARI DASHA — Career Turning-Point Activation Map
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
    const tenth = NS.getHouseSnapshot(10);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    const tenthConnection = lordName === tenth.lord || p.conjunctWith.includes(tenth.lord) || p.aspectedBy.includes(tenth.lord);
    if (tenthConnection && lordName !== tenth.lord) factors.push(`${lordName} is connected to the 10th lord (${tenth.lord}) by conjunction/aspect.`);
    const d10 = NS.getD10();
    const d10Confirmation = d10 ? (() => {
      const pD10 = d10.planets.find(x => x.name === lordName);
      return [10, 11, 9, 6, 7].includes(pD10.d10House) || [d10.tenthLord, d10.eleventhLord, d10.ninthLord, d10.sixthLord, d10.seventhLord].includes(lordName);
    })() : false;
    if (d10Confirmation) factors.push(`${lordName} is connected to the D10 career axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, tenthConnection, d10Confirmation };
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
  // 5. TRANSIT — Jupiter/Saturn primary, Rahu/Ketu secondary only
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
      jupiter: checkBody('Jupiter', [9, 10, 11], 'CT-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [6, 10, 11, 12], 'CT-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [10, 12], 'CT-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [10, 12], 'CT-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 6. RELATED CAREER EVENTS CROSS-CHECK (Section 17) — read-only,
  //    never duplicates the underlying modules' calculations.
  // ---------------------------------------------------------------
  NS.getRelatedEvents = function (candidate) {
    const checks = [
      { mod: window.JobChangeTiming, label: 'Job Change' },
      { mod: window.PromotionTiming, label: 'Promotion' },
      { mod: window.BusinessStartTiming, label: 'Business Start' },
      { mod: window.RecognitionAwardTiming, label: 'Recognition/Award' },
      { mod: window.FinancialGainTiming, label: 'Financial Gain' },
      { mod: window.Relocation, label: 'Relocation' },
      { mod: window.ForeignTravelTiming, label: 'Foreign Travel/Settlement' },
      { mod: window.RetirementTiming, label: 'Retirement' },
      { mod: window.HigherEducationTiming, label: 'Higher Education' }
    ];
    const related = [];
    checks.forEach(({ mod, label }) => {
      if (!mod || typeof mod.refresh !== 'function') { related.push({ label, status: 'Not Prominent' }); return; }
      if (label === 'Relocation') { related.push({ label, status: 'Not Prominent' }); return; } // direction/compass module, no timing windows
      const result = mod.refresh();
      if (!result || !result.candidateWindows) { related.push({ label, status: 'Not Prominent' }); return; }
      const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
      if (!overlapping) { related.push({ label, status: 'Not Prominent' }); return; }
      const eventLabel = overlapping.event ? (overlapping.event.label || (overlapping.event.labels && overlapping.event.labels.join(', '))) : null;
      related.push({ label, status: 'Present', eventLabel });
    });
    return related;
  };

  // ---------------------------------------------------------------
  // 7. EVENT CLASSIFICATION (Section 15) + CAREER PHASE (Section 18)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, relatedEvents) {
    const h = candidate.activatedHouses;
    const sixth = h.includes(6), seventh = h.includes(7), ninth = h.includes(9), tenth = h.includes(10),
      eleventh = h.includes(11), twelfth = h.includes(12), third = h.includes(3), fifth = h.includes(5), second = h.includes(2);

    const businessPresent = relatedEvents.find(r => r.label === 'Business Start' && r.status === 'Present');
    const jobChangePresent = relatedEvents.find(r => r.label === 'Job Change' && r.status === 'Present');
    const retirementPresent = relatedEvents.find(r => r.label === 'Retirement' && r.status === 'Present');

    if (ninth && twelfth) return { label: 'Major Overseas Career Transition', rule: ruleById('CT-SIG-10-12-9') };
    if (seventh && eleventh && second && businessPresent) return { label: 'Employment to Business', rule: ruleById('CT-SIG-10-7') };
    if (seventh && !sixth) return { label: 'Employment to Consultancy / Independent Practice', rule: ruleById('CT-SIG-10-7') };
    if (sixth && twelfth && retirementPresent) return { label: 'Career Interruption', rule: ruleById('CT-SIG-6-12') };
    if (sixth && twelfth) return { label: 'Employment Structure Change', rule: ruleById('CT-SIG-10-6') };
    if (ninth && !twelfth) return { label: 'Industry / Professional Direction Change', rule: ruleById('CT-SIG-10-9') };
    if (eleventh && second) return { label: 'Significant Career Expansion', rule: ruleById('CT-SIG-10-11-2') };
    if (eleventh && !twelfth && !ninth) return { label: 'Major Responsibility Increase', rule: ruleById('CT-SIG-10-11') };
    if (third) return { label: 'Major Role Transition', rule: ruleById('CT-SIG-10-3') };
    if (fifth) return { label: 'Major Career Reorientation', rule: ruleById('CT-SIG-10-5') };
    if (twelfth && !sixth) return { label: 'Career Restart', rule: ruleById('CT-SIG-10-12') };
    if (jobChangePresent) return { label: 'Function / Department Change', rule: ruleById('CT-EVENT-001') };
    return { label: 'Other Major Career Transition', rule: ruleById('CT-EVENT-001') };
  };

  NS.classifyCareerPhase = function (candidate, event) {
    const h = candidate.activatedHouses;
    if (event.label === 'Significant Career Expansion' || event.label === 'Major Responsibility Increase') return { label: 'Career Expansion', rule: ruleById('CT-PHASE-001') };
    if (event.label === 'Employment Structure Change' || event.label === 'Major Responsibility Reduction') return { label: 'Career Restructuring', rule: ruleById('CT-PHASE-001') };
    if (event.label === 'Industry / Professional Direction Change' || event.label === 'Major Career Reorientation' || event.label === 'Major Overseas Career Transition') return { label: 'Career Redirection', rule: ruleById('CT-PHASE-001') };
    if (event.label === 'Employment to Business' || event.label === 'Employment to Consultancy / Independent Practice') return { label: 'Career Diversification', rule: ruleById('CT-PHASE-001') };
    if (event.label === 'Career Interruption' || event.label === 'Career Restart') return { label: 'Career Exit / Withdrawal', rule: ruleById('CT-PHASE-001') };
    return { label: 'Career Consolidation', rule: ruleById('CT-PHASE-001') };
  };

  // ---------------------------------------------------------------
  // 8. CANDIDATE WINDOWS + WINDOW STRENGTH (non-numeric) — multi-
  //    factor convergence (Section 13)
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
    const activationMap = NS.buildCareerActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const relatedEvents = NS.getRelatedEvents(c);
      const event = NS.classifyEvent(c, relatedEvents);
      const careerPhase = NS.classifyCareerPhase(c, event);
      const relatedPresentCount = relatedEvents.filter(r => r.status === 'Present').length;
      const convergenceFactors = [c.tenthConnection, c.d10Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3, relatedPresentCount >= 1].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('CT-STRENGTH-001') };
      const cautions = [];
      if (!c.d10Confirmation) cautions.push('D10 does not materially confirm this period — treat with additional caution.');
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      if ((transit.rahu.active || transit.ketu.active) && convergenceFactors < 3) cautions.push('Rahu/Ketu activation present, but this alone is not treated as sufficient for a major career turning point.');
      return Object.assign({}, c, { transit, relatedEvents, event, careerPhase, convergenceFactors, qualification, strength, cautions });
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
    function activated(lordName) { return lordName ? NS.careerFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.careerFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d10 = NS.assessD10Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      tenthActivation: houseActivated(10), sixthActivation: houseActivated(6), ninthActivation: houseActivated(9), twelfthActivation: lords.some(activated),
      d10Level: d10.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Career Factors (2nd/3rd/5th/6th/7th/9th/10th/11th/12th, significators)', anchor: 'ct-sec-promise' },
    { id: 2, label: 'Dasha Activation (MD/AD/PD)', anchor: 'ct-sec-dasha' },
    { id: 3, label: 'House Activation', anchor: 'ct-sec-dasha' },
    { id: 4, label: 'D10 Confirmation', anchor: 'ct-sec-d10' },
    { id: 5, label: 'Transit Confirmation (Jupiter/Saturn/Rahu/Ketu)', anchor: 'ct-sec-windows' },
    { id: 6, label: 'Event Classification', anchor: 'ct-sec-windows' },
    { id: 7, label: 'Final Window', anchor: 'ct-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, minSupport, eventFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.minSupport === minSupport && NS.cache.eventFilter === eventFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalCareerTurningPointPotential();
    log(calculationLog, '[02] 2nd/3rd/5th/6th/7th/9th/10th/11th/12th houses and Sun/Saturn/Mercury/Jupiter/Mars/Rahu/Ketu analysed');
    log(calculationLog, '[03] Natal Career Turning-Point Potential: ' + natalPromise.potential);
    const d10 = NS.assessD10Confirmation();
    log(calculationLog, '[04] D10 (Dashamsha) career confirmation computed: ' + d10.level);

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
      log(calculationLog, '[06] Career Turning-Point Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate career turning-point windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minSupport && minSupport !== 'All') {
      const threshold = SUPPORT_RANK[minSupport] != null ? SUPPORT_RANK[minSupport] : 0;
      windows = windows.filter(w => SUPPORT_RANK[w.strength.label] >= threshold);
      log(calculationLog, '[08] Filtered by minimum support level: ' + minSupport + ' (' + windows.length + ' windows)');
    }
    if (eventFilter && eventFilter !== 'All') {
      windows = windows.filter(w => w.event.label.toLowerCase().includes(eventFilter.toLowerCase()) || w.careerPhase.label.toLowerCase().includes(eventFilter.toLowerCase()));
      log(calculationLog, '[09] Filtered by event type: ' + eventFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['CT-10H-001', 'CT-6H-001', 'CT-7H-001', 'CT-11H-001', 'CT-9H-001', 'CT-12H-001', 'CT-3H-001', 'CT-5H-001', 'CT-2H-001', 'CT-NATAL-SUN', 'CT-NATAL-SATURN', 'CT-NATAL-MERCURY', 'CT-NATAL-JUPITER', 'CT-NATAL-MARS', 'CT-NATAL-RAHU', 'CT-NATAL-KETU', 'CT-SIG-10-6', 'CT-SIG-10-7', 'CT-SIG-10-11', 'CT-SIG-10-9', 'CT-SIG-10-12', 'CT-SIG-10-3', 'CT-SIG-10-5', 'CT-SIG-6-12', 'CT-SIG-7-10', 'CT-SIG-9-10', 'CT-SIG-10-11-2', 'CT-SIG-10-12-9', 'CT-D10-001', 'CT-DISTINCTION-001', 'CT-NOGUARANTEE-001']);
    if (windowsResult.available) { rulesUsedIds.add('CT-DASHA-001'); rulesUsedIds.add('CT-TRANSIT-JUP'); rulesUsedIds.add('CT-TRANSIT-SAT'); rulesUsedIds.add('CT-TRANSIT-NODES'); rulesUsedIds.add('CT-CONVERGENCE-001'); rulesUsedIds.add('CT-EVENT-001'); rulesUsedIds.add('CT-PHASE-001'); rulesUsedIds.add('CT-RELATEDEVENTS-001'); rulesUsedIds.add('CT-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, d10Confirmation: d10, currentDasha,
      candidateWindows: windows, horizonYears: horizon, minSupport: minSupport || 'All', eventFilter: eventFilter || 'All',
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, minSupport, eventFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
