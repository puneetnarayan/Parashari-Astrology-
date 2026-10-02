/* =========================================================
   LOAN / DEBT RELIEF TIMING — pure calculation engine. Parashari/
   Vimshottari method only. Reuses this app's existing chart/dignity/
   aspect/dasha/D2-divisional-chart/transit calculations throughout —
   same architecture as the prior timing modules. Explicitly distinct
   from Financial Gain Timing: this module covers borrowing/liability/
   relief, never general income or wealth realization.
   Exposed only as window.LoanDebtReliefTiming (namespaced). UI code
   lives entirely in loanDebtReliefTimingUI.js.
   ========================================================= */

window.LoanDebtReliefTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const DEBT_HOUSES = [2, 4, 6, 7, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 3, 'Supportive': 2, 'Moderately Supportive': 1, 'Mixed': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[LoanDebtReliefTiming]', text); }
  function ruleById(id) { return (window.LOAN_DEBT_RELIEF_TIMING_RULES || []).find(r => r.id === id); }

  NS.getChartData = function () { return state.chart || null; };

  NS.getPlanetSnapshot = function (name) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const p = chart.planets.find(pl => pl.name === name);
    if (!p) return null;
    const isClassical = SHADBALA_PLANETS.includes(name);
    const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral' };
    return { name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude, house: Number(p.house), dignityTier: dignity.tier, conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || [] };
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

  // D2 (Hora) — reused directly from existing divisional-chart engine, as an OPTIONAL confirmation layer.
  NS.getD2 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    try {
      const ascD2 = vargaPosition(chart.ascendant.longitude, 'D2');
      if (!ascD2 || !ascD2.sign) return null;
      const ascD2SignIndex = SIGNS.indexOf(ascD2.sign);
      const d2LagnaLord = SIGN_LORD[ascD2.sign];
      function houseSign(h) { return SIGNS[(ascD2SignIndex + h - 1) % 12]; }
      const planets = chart.planets.map(p => {
        const d2 = vargaPosition(p.longitude, 'D2');
        const isClassical = SHADBALA_PLANETS.includes(p.name);
        const d2DegreeInSign = normalizeDegrees(d2.longitude) % 30;
        const d2Dignity = isClassical ? detailedDignity(p.name, d2.sign, d2DegreeInSign).tier : 'Neutral';
        const d2House = ((SIGNS.indexOf(d2.sign) - ascD2SignIndex + 12) % 12) + 1;
        return { name: p.name, d2Sign: d2.sign, d2House, d2Dignity };
      });
      return { ascendantSign: ascD2.sign, lagnaLord: d2LagnaLord, secondSign: houseSign(2), secondLord: SIGN_LORD[houseSign(2)], eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)], available: true, planets };
    } catch (e) { return null; }
  };

  NS.assessD2Confirmation = function () {
    const d2 = NS.getD2();
    if (!d2) return { available: false, level: 'Not Available for This Chart', points: 0, evidence: ['D2 (Hora) confirmation is optional and is not available for this chart — D1 analysis above is unaffected.'], rule: ruleById('DEBT-D2-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d2.planets.find(p => p.name === name); return x ? x.d2Dignity : 'Neutral'; }
    let points = 0; const evidence = [];
    if (strong.includes(dig(d2.secondLord))) { points += 2; evidence.push(`D2 2nd lord (${d2.secondLord}) is ${dig(d2.secondLord)} in D2.`); }
    if (strong.includes(dig(d2.eleventhLord))) { points += 2; evidence.push(`D2 11th lord (${d2.eleventhLord}) is ${dig(d2.eleventhLord)} in D2.`); }
    if (strong.includes(dig(d2.lagnaLord))) { points += 1; evidence.push(`D2 Lagna lord (${d2.lagnaLord}) is ${dig(d2.lagnaLord)} in D2.`); }
    if (!evidence.length) evidence.push('No strong D2 confirmation factors found for the financial axis (2nd/11th/Lagna lords).');
    const level = points >= 4 ? 'Supports Financial Improvement' : points >= 2 ? 'Moderately Supports' : points >= 1 ? 'Mixed' : 'Does Not Materially Confirm';
    return { available: true, d2, points, level, evidence, rule: ruleById('DEBT-D2-001') };
  };

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
    return { house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId), occupants: h.occupants, aspectingHere: h.aspectingHere,
      evidence: [`${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`, h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.', h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.'] };
  }

  function classifyKaraka(name, ruleId, refHouseNum) {
    const p = NS.getPlanetSnapshot(name);
    const refHouse = NS.getHouseSnapshot(refHouseNum);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connected = p.house === refHouseNum || p.conjunctWith.includes(refHouse.lord) || p.aspectedBy.includes(refHouse.lord) || refHouse.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Neutral';
    if (connected && result === 'Neutral') result = 'Supporting';
    return { planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connected,
      evidence: [`${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`, p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.', p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.', `Connected to ${refHouseNum}th: ${connected ? 'Yes' : 'No'}.`] };
  }

  function housesConnected(h1, h2, chart) {
    if (h1.lord === h2.lord) return { connected: true, how: `${h1.house}th and ${h2.house}th houses share the same lord (${h1.lord}).` };
    const l1 = chart.planets.find(p => p.name === h1.lord), l2 = chart.planets.find(p => p.name === h2.lord);
    if (l1.sign === l2.sign) return { connected: true, how: `${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord) are conjunct in ${l1.sign}.` };
    if ((l1.aspectedBy || []).includes(h2.lord) || (l2.aspectedBy || []).includes(h1.lord)) return { connected: true, how: `${h1.lord} and ${h2.lord} (${h1.house}th/${h2.house}th lords) aspect each other.` };
    if (SIGN_LORD[l1.sign] === h2.lord && SIGN_LORD[l2.sign] === h1.lord) return { connected: true, how: `${h1.lord} and ${h2.lord} are in mutual sign exchange (Parivartana).` };
    return { connected: false, how: `No conjunction, aspect, or exchange found between ${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord).` };
  }

  NS.assessNatalDebtIndicators = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'DEBT-NATAL-002'), fourth = classifyHouse(4, 'DEBT-NATAL-004'), sixth = classifyHouse(6, 'DEBT-NATAL-006'),
      seventh = classifyHouse(7, 'DEBT-NATAL-007'), eighth = classifyHouse(8, 'DEBT-NATAL-008'), ninth = classifyHouse(9, 'DEBT-NATAL-009'),
      tenth = classifyHouse(10, 'DEBT-NATAL-010'), eleventh = classifyHouse(11, 'DEBT-NATAL-011'), twelfth = classifyHouse(12, 'DEBT-NATAL-012');
    const saturn = classifyKaraka('Saturn', 'DEBT-SIGNIF-SATURN', 6), jupiter = classifyKaraka('Jupiter', 'DEBT-SIGNIF-JUPITER', 11), mercury = classifyKaraka('Mercury', 'DEBT-SIGNIF-MERCURY', 6),
      venus = classifyKaraka('Venus', 'DEBT-SIGNIF-VENUS', 2), mars = classifyKaraka('Mars', 'DEBT-SIGNIF-MARS', 4), moon = classifyKaraka('Moon', 'DEBT-SIGNIF-MOON', 2), rahu = classifyKaraka('Rahu', 'DEBT-SIGNIF-RAHU', 8);

    const secondH = NS.getHouseSnapshot(2), fourthH = NS.getHouseSnapshot(4), sixthH = NS.getHouseSnapshot(6), seventhH = NS.getHouseSnapshot(7),
      eighthH = NS.getHouseSnapshot(8), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const debtPairs = [
      { id: 'DEBT-HOUSE-6-8', a: sixthH, b: eighthH }, { id: 'DEBT-HOUSE-6-12', a: sixthH, b: twelfthH },
      { id: 'DEBT-HOUSE-2-6', a: secondH, b: sixthH }, { id: 'DEBT-HOUSE-4-6', a: fourthH, b: sixthH }
    ];
    const reliefPairs = [
      { id: 'DEBT-HOUSE-6-11', a: sixthH, b: eleventhH }, { id: 'DEBT-HOUSE-2-11', a: secondH, b: eleventhH },
      { id: 'DEBT-HOUSE-6-10', a: sixthH, b: tenthH }, { id: 'DEBT-HOUSE-8-11', a: eighthH, b: eleventhH }, { id: 'DEBT-HOUSE-4-12', a: fourthH, b: twelfthH }
    ];
    const debtRelationships = debtPairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });
    const reliefRelationships = reliefPairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });

    const conv_6_11_2 = [housesConnected(sixthH, eleventhH, chart).connected, housesConnected(eleventhH, secondH, chart).connected, housesConnected(sixthH, secondH, chart).connected].filter(Boolean).length >= 2;
    const conv_6_12_2 = [housesConnected(sixthH, twelfthH, chart).connected, housesConnected(twelfthH, secondH, chart).connected, housesConnected(sixthH, secondH, chart).connected].filter(Boolean).length >= 2;
    const conv_6_8_12 = [housesConnected(sixthH, eighthH, chart).connected, housesConnected(eighthH, twelfthH, chart).connected, housesConnected(sixthH, twelfthH, chart).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('DEBT-CONV-6-11-2'), present: conv_6_11_2, evidence: `6th/11th/2nd convergence: ${conv_6_11_2 ? 'present' : 'not present'}.` },
      { rule: ruleById('DEBT-CONV-6-12-2'), present: conv_6_12_2, evidence: `6th/12th/2nd convergence: ${conv_6_12_2 ? 'present' : 'not present'}.` },
      { rule: ruleById('DEBT-CONV-6-8-12'), present: conv_6_8_12, evidence: `6th/8th/12th convergence: ${conv_6_8_12 ? 'present' : 'not present'}.` }
    ];

    const debtConnectedCount = debtRelationships.filter(r => r.connected).length;
    const reliefConnectedCount = reliefRelationships.filter(r => r.connected).length;

    const debtPotential = debtConnectedCount >= 3 ? 'Strong Debt/Repayment Theme' : debtConnectedCount >= 2 ? 'Present' : debtConnectedCount === 1 ? 'Mixed' : 'Limited Evidence';
    const reliefPotential = reliefConnectedCount >= 4 ? 'Clearly Present' : reliefConnectedCount >= 2 ? 'Present' : reliefConnectedCount === 1 ? 'Mixed' : 'Limited Evidence';

    const debtReasons = [`6th house: ${sixth.result} (${sixth.sign}, lord ${sixth.lord}).`, `${debtConnectedCount} of ${debtRelationships.length} debt-signature house relationships connected.`, `Saturn: ${saturn.result}.`];
    const reliefReasons = [`11th house: ${eleventh.result} (${eleventh.sign}, lord ${eleventh.lord}).`, `${reliefConnectedCount} of ${reliefRelationships.length} relief-signature house relationships connected.`, `Jupiter: ${jupiter.result}.`];

    return { secondHouse: second, fourthHouse: fourth, sixthHouse: sixth, seventhHouse: seventh, eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      saturn, jupiter, mercury, venus, mars, moon, rahu, debtRelationships, reliefRelationships, convergenceSignatures, debtConnectedCount, reliefConnectedCount, debtPotential, reliefPotential, debtReasons, reliefReasons };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.debtFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = []; const activatedHouses = owned.slice();
    if (DEBT_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => DEBT_HOUSES.includes(h)).join(', ')}.`);
    if (DEBT_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const sixth = NS.getHouseSnapshot(6), eighth = NS.getHouseSnapshot(8), twelfth = NS.getHouseSnapshot(12), second = NS.getHouseSnapshot(2), eleventh = NS.getHouseSnapshot(11);
    if (lordName === sixth.lord) factors.push(`${lordName} is the 6th lord.`);
    if (lordName === eighth.lord) factors.push(`${lordName} is the 8th lord.`);
    if (lordName === twelfth.lord) factors.push(`${lordName} is the 12th lord.`);
    if (lordName === second.lord) factors.push(`${lordName} is the 2nd lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    const d2 = NS.getD2();
    const d2Confirmation = d2 ? (() => { const pD2 = d2.planets.find(x => x.name === lordName); return pD2 && ([2, 11].includes(pD2.d2House) || [d2.secondLord, d2.eleventhLord].includes(lordName)); })() : false;
    if (d2Confirmation) factors.push(`${lordName} is connected to the D2 financial-relief axis.`);
    return { relevant: factors.length > 0, factors, activatedHouses, d2Confirmation };
  };

  NS.buildDebtActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.debtFactorsForLord(md.lord), adFactors = NS.debtFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.debtFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const d2Confirmation = mdFactors.d2Confirmation || adFactors.d2Confirmation || pdFactors.d2Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, d2Confirmation, matchCount, reasons, lordsInvolved: [md.lord, ad.lord, pd.lord] });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    function checkBody(name, houseSet, ruleId) {
      const signIdx = transitSignIndex(name); const house = ((signIdx - ascIndex + 12) % 12) + 1;
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default; const reasons = []; let active = false;
      houseSet.forEach(h => { const hd = NS.getHouseSnapshot(h); const targetSignIdx = SIGNS.indexOf(hd.sign);
        if (house === h) { active = true; reasons.push(`Transiting ${name} is in the natal ${h}th house.`); }
        else if (offsets.some(o => (signIdx + (o - 1)) % 12 === targetSignIdx)) { active = true; reasons.push(`Transiting ${name} aspects the natal ${h}th house.`); } });
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return { date, jupiter: checkBody('Jupiter', [2, 6, 9, 10, 11], 'DEBT-TRANSIT-JUP'), saturn: checkBody('Saturn', [2, 6, 8, 11, 12], 'DEBT-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [6, 8, 12], 'DEBT-TRANSIT-NODES'), ketu: checkBody('Ketu', [6, 8, 12], 'DEBT-TRANSIT-NODES') };
  };

  // Stage classification — structurally enforces that 12th-house activation ALONE never equals Closure.
  NS.classifyDebtStage = function (candidate) {
    const h = candidate.activatedHouses;
    const sixth = h.includes(6), eighth = h.includes(8), twelfth = h.includes(12), second = h.includes(2), eleventh = h.includes(11);
    const closureConvergence = [sixth, eleventh, (twelfth || second)].filter(Boolean).length;
    if (sixth && eleventh && closureConvergence >= 2 && candidate.matchCount >= 2) return { label: 'Debt Closure', rule: ruleById('DEBT-STAGE-001') };
    if (sixth && second && eleventh) return { label: 'Debt Reduction', rule: ruleById('DEBT-STAGE-001') };
    if (sixth && eighth && NS.getPlanetSnapshot('Saturn').house && (candidate.lordsInvolved.includes('Saturn'))) return { label: 'Debt Restructuring', rule: ruleById('DEBT-STAGE-001') };
    if (sixth && eighth && twelfth) return { label: 'Debt Restructuring', rule: ruleById('DEBT-STAGE-001') };
    if (sixth && (eighth || twelfth) && !eleventh) return { label: 'Debt Creation', rule: ruleById('DEBT-STAGE-001') };
    if (sixth) return { label: 'Debt Maintenance', rule: ruleById('DEBT-STAGE-001') };
    return { label: 'Debt Maintenance', rule: ruleById('DEBT-STAGE-001') };
  };

  NS.classifyEventType = function (candidate, loanType) {
    const h = candidate.activatedHouses;
    const sixth = h.includes(6), eighth = h.includes(8), twelfth = h.includes(12), second = h.includes(2), eleventh = h.includes(11), fourth = h.includes(4), seventh = h.includes(7), tenth = h.includes(10);
    if (fourth && sixth && (eleventh || twelfth)) return loanType === 'Vehicle' ? 'Vehicle-Loan Closure' : 'Property-Loan Closure';
    if (sixth && (seventh || tenth) && eleventh) return 'Business-Debt Resolution';
    if (sixth && eleventh && twelfth && second) return 'Loan Closure';
    if (sixth && eleventh && second) return 'Debt Settlement';
    if (sixth && eighth && twelfth) return 'Debt Restructuring';
    if (sixth && eighth && !eleventh) return 'Debt Accumulation';
    if (sixth && fourth) return 'Loan Requirement / Borrowing Period';
    if (sixth && !eighth && !twelfth && !eleventh) return 'Loan Application';
    return 'Mixed Financial Liability Development';
  };

  NS.checkFinancialCrossCheck = function (candidate) {
    if (!window.FinancialGainTiming) return null;
    const result = window.FinancialGainTiming.refresh();
    if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return { overlapping: true, financialEvent: overlapping.event ? overlapping.event.label : undefined, interpretation: 'Debt-reduction indicators overlap with financial-gain/income indicators — no guaranteed amount is implied.', rule: ruleById('DEBT-FINANCIAL-CROSSCHECK-001') };
  };

  NS.checkPropertyCrossCheck = function (candidate) {
    const h = candidate.activatedHouses;
    if (!(h.includes(4) && h.includes(6))) return null;
    const notes = [];
    if (window.PropertyTiming) { const r = window.PropertyTiming.refresh && window.PropertyTiming.refresh(); if (r && r.candidateWindows && r.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha)) notes.push('Property Purchase Timing'); }
    if (window.PropertySaleTiming) { const r = window.PropertySaleTiming.refresh && window.PropertySaleTiming.refresh(); if (r && r.candidateWindows && r.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha)) notes.push('Property Sale Timing'); }
    if (!notes.length) return null;
    return { overlapping: true, modules: notes, interpretation: `Property-linked loan/closure context overlaps with ${notes.join(' and ')}.`, rule: ruleById('DEBT-PROPERTY-CROSSCHECK-001') };
  };

  NS.checkVehicleCrossCheck = function (candidate) {
    const h = candidate.activatedHouses;
    if (!(h.includes(4) && h.includes(6))) return null;
    if (!window.VehiclePurchaseTiming) return null;
    const r = window.VehiclePurchaseTiming.refresh && window.VehiclePurchaseTiming.refresh();
    if (!r || !r.candidateWindows) return null;
    const overlapping = r.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Vehicle-linked loan/closure context overlaps with Vehicle Purchase Timing.', rule: ruleById('DEBT-VEHICLE-CROSSCHECK-001') };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }
  function assessWindowSupport(f) { if (f >= 4) return 'Strongly Supportive'; if (f >= 3) return 'Supportive'; if (f >= 2) return 'Moderately Supportive'; return 'Mixed'; }

  NS.buildCandidateWindows = function (horizonYears, loanType) {
    const activationMap = NS.buildDebtActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyDebtStage(c);
      const eventType = NS.classifyEventType(c, loanType);
      const financialCrossCheck = NS.checkFinancialCrossCheck(c);
      const propertyCrossCheck = NS.checkPropertyCrossCheck(c);
      const vehicleCrossCheck = NS.checkVehicleCrossCheck(c);
      // Convergence-factor gate (structural; prevents a single weak factor, e.g. Rahu/Ketu alone or a lone house, from forcing the strongest/most-specific classification)
      const convergenceFactors = [c.d2Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3, c.activatedHouses.includes(6) && c.activatedHouses.includes(11)].filter(Boolean).length;
      const nodesOnlyDriver = (transit.rahu.active || transit.ketu.active) && !transit.jupiter.active && !transit.saturn.active;
      const qualification = convergenceFactors >= 3 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const support = { label: assessWindowSupport(convergenceFactors), rule: ruleById('DEBT-STRENGTH-001') };
      const cautions = [];
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      if (nodesOnlyDriver) cautions.push('Rahu/Ketu activation present, but this alone is not sufficient for a debt-relief window.');
      if (stage.label === 'Debt Closure' && convergenceFactors < 3) cautions.push('Closure classification requires multiple independent confirming factors — treat as provisional pending further convergence.');
      return Object.assign({}, c, { transit, stage, eventType, financialCrossCheck, propertyCrossCheck, vehicleCrossCheck, convergenceFactors, qualification, support, cautions, loanType: loanType || 'General' });
    }).filter(c => c.qualification !== 'weak');
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

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
    function houseActivated(h) { const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean); return lords.some(l => NS.debtFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d2 = NS.assessD2Confirmation();
    return { eventDate, eventType, inRange: true, mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      sixthActivation: houseActivated(6), eleventhActivation: houseActivated(11), twelfthActivation: houseActivated(12),
      d2Level: d2.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Debt Factors (6th/8th/12th/2nd/11th)', anchor: 'debt-sec-promise' },
    { id: 2, label: 'Dasha (MD/AD/PD)', anchor: 'debt-sec-dasha' }, { id: 3, label: 'Financial Confirmation (D2)', anchor: 'debt-sec-d2' },
    { id: 4, label: 'Transit (Jupiter/Saturn/Rahu/Ketu)', anchor: 'debt-sec-windows' }, { id: 5, label: 'Related Events', anchor: 'debt-sec-windows' },
    { id: 6, label: 'Event Classification', anchor: 'debt-sec-windows' }, { id: 7, label: 'Final Window', anchor: 'debt-sec-windows' }
  ];

  NS.refresh = function (horizonYears, loanType, minSupport, stageFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5; const loan = loanType || 'General';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.loanType === loan && NS.cache.minSupport === minSupport && NS.cache.stageFilter === stageFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natal = NS.assessNatalDebtIndicators();
    log(calculationLog, '[02] 2nd/4th/6th/7th/8th/9th/10th/11th/12th houses and Saturn/Jupiter/Mercury/Venus/Mars/Moon/Rahu analysed');
    log(calculationLog, '[03] Natal Loan/Debt Indicators: ' + natal.debtPotential + '; Natal Debt-Relief Indicators: ' + natal.reliefPotential);
    const d2 = NS.assessD2Confirmation();
    log(calculationLog, '[04] D2 (Hora) financial confirmation computed: ' + d2.level);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.debtFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.debtFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.debtFactorsForLord(pd.lord) } : null };
      }
      log(calculationLog, '[06] Loan/Debt Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon, loan);
      log(calculationLog, '[07] Candidate loan/debt-relief windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minSupport && minSupport !== 'All') { const t = SUPPORT_RANK[minSupport] != null ? SUPPORT_RANK[minSupport] : 0; windows = windows.filter(w => SUPPORT_RANK[w.support.label] >= t); log(calculationLog, '[08] Filtered by minimum support: ' + minSupport); }
    if (stageFilter && stageFilter !== 'All') { windows = windows.filter(w => w.stage.label === stageFilter || w.eventType === stageFilter); log(calculationLog, '[09] Filtered by stage: ' + stageFilter); }

    const rulesUsedIds = new Set(['DEBT-NATAL-002', 'DEBT-NATAL-004', 'DEBT-NATAL-006', 'DEBT-NATAL-007', 'DEBT-NATAL-008', 'DEBT-NATAL-009', 'DEBT-NATAL-010', 'DEBT-NATAL-011', 'DEBT-NATAL-012',
      'DEBT-SIGNIF-SATURN', 'DEBT-SIGNIF-JUPITER', 'DEBT-SIGNIF-MERCURY', 'DEBT-SIGNIF-VENUS', 'DEBT-SIGNIF-MARS', 'DEBT-SIGNIF-MOON', 'DEBT-SIGNIF-RAHU',
      'DEBT-HOUSE-6-8', 'DEBT-HOUSE-6-12', 'DEBT-HOUSE-6-11', 'DEBT-HOUSE-2-6', 'DEBT-HOUSE-2-11', 'DEBT-HOUSE-6-10', 'DEBT-HOUSE-4-6', 'DEBT-HOUSE-4-12', 'DEBT-HOUSE-8-11',
      'DEBT-CONV-6-11-2', 'DEBT-CONV-6-12-2', 'DEBT-CONV-6-8-12', 'DEBT-D2-001', 'DEBT-NATAL-INDICATORS-001', 'DEBT-RELIEF-INDICATORS-001', 'DEBT-LOANTYPE-001', 'DEBT-NOGUARANTEE-001']);
    if (windowsResult.available) { ['DEBT-DASHA-001', 'DEBT-STAGE-001', 'DEBT-TRANSIT-JUP', 'DEBT-TRANSIT-SAT', 'DEBT-TRANSIT-NODES', 'DEBT-FINANCIAL-CROSSCHECK-001', 'DEBT-PROPERTY-CROSSCHECK-001', 'DEBT-VEHICLE-CROSSCHECK-001', 'DEBT-STRENGTH-001'].forEach(id => rulesUsedIds.add(id)); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natal, d2Confirmation: d2, currentDasha, candidateWindows: windows, horizonYears: horizon, loanType: loan, minSupport: minSupport || 'All', stageFilter: stageFilter || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, loanType: loan, minSupport, stageFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
