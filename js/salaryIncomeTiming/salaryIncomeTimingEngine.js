/* =========================================================
   SALARY / INCOME INCREASE TIMING — pure calculation engine.
   Parashari/Vimshottari method only. Reuses this app's existing
   chart/dignity/aspect/dasha/transit calculations throughout — same
   architecture as the prior timing modules. No divisional chart is
   used, per the spec. Explicitly distinct from Financial Gain/Wealth
   Timing (broader gains), Promotion Timing (designation change), and
   Job Change Timing (employer transition).
   Exposed only as window.SalaryIncomeTiming (namespaced). UI code
   lives entirely in salaryIncomeTimingUI.js.
   ========================================================= */

window.SalaryIncomeTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const INCOME_HOUSES = [2, 3, 5, 6, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 4, 'Supportive': 3, 'Moderately Supportive': 2, 'Mixed': 1, 'Conditional': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[SalaryIncomeTiming]', text); }
  function ruleById(id) { return (window.SALARY_INCOME_TIMING_RULES || []).find(r => r.id === id); }

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

  NS.assessNatalSalaryPotential = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'SAL-NATAL-002'), third = classifyHouse(3, 'SAL-NATAL-003'), fifth = classifyHouse(5, 'SAL-NATAL-005'),
      sixth = classifyHouse(6, 'SAL-NATAL-006'), eighth = classifyHouse(8, 'SAL-NATAL-008'), ninth = classifyHouse(9, 'SAL-NATAL-009'),
      tenth = classifyHouse(10, 'SAL-NATAL-010'), eleventh = classifyHouse(11, 'SAL-NATAL-011'), twelfth = classifyHouse(12, 'SAL-NATAL-012');
    const jupiter = classifyKaraka('Jupiter', 'SAL-SIGNIF-JUPITER', 11), mercury = classifyKaraka('Mercury', 'SAL-SIGNIF-MERCURY', 2), sun = classifyKaraka('Sun', 'SAL-SIGNIF-SUN', 10),
      saturn = classifyKaraka('Saturn', 'SAL-SIGNIF-SATURN', 6), venus = classifyKaraka('Venus', 'SAL-SIGNIF-VENUS', 2), moon = classifyKaraka('Moon', 'SAL-SIGNIF-MOON', 2), mars = classifyKaraka('Mars', 'SAL-SIGNIF-MARS', 10), rahu = classifyKaraka('Rahu', 'SAL-SIGNIF-RAHU', 6);

    const secondH = NS.getHouseSnapshot(2), thirdH = NS.getHouseSnapshot(3), fifthH = NS.getHouseSnapshot(5), sixthH = NS.getHouseSnapshot(6),
      eighthH = NS.getHouseSnapshot(8), ninthH = NS.getHouseSnapshot(9), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'SAL-HOUSE-2-6', a: secondH, b: sixthH }, { id: 'SAL-HOUSE-2-10', a: secondH, b: tenthH }, { id: 'SAL-HOUSE-2-11', a: secondH, b: eleventhH },
      { id: 'SAL-HOUSE-6-10', a: sixthH, b: tenthH }, { id: 'SAL-HOUSE-6-11', a: sixthH, b: eleventhH }, { id: 'SAL-HOUSE-10-11', a: tenthH, b: eleventhH },
      { id: 'SAL-HOUSE-5-11', a: fifthH, b: eleventhH }, { id: 'SAL-HOUSE-9-10', a: ninthH, b: tenthH }, { id: 'SAL-HOUSE-9-11', a: ninthH, b: eleventhH },
      { id: 'SAL-HOUSE-3-10', a: thirdH, b: tenthH }, { id: 'SAL-HOUSE-3-11', a: thirdH, b: eleventhH }
    ];
    const relationships = pairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });

    const contextPairs = [
      { id: 'SAL-CONTEXT-8-2', a: eighthH, b: secondH }, { id: 'SAL-CONTEXT-8-11', a: eighthH, b: eleventhH },
      { id: 'SAL-CONTEXT-12-2', a: twelfthH, b: secondH }, { id: 'SAL-CONTEXT-12-6', a: twelfthH, b: sixthH }, { id: 'SAL-CONTEXT-12-10', a: twelfthH, b: tenthH }
    ];
    const contextRelationships = contextPairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });

    const connectedCount = relationships.filter(r => r.connected).length;
    const potential = connectedCount >= 5 ? 'Strongly Supported' : connectedCount >= 3 ? 'Supported' : connectedCount === 2 ? 'Mixed' : connectedCount === 1 ? 'Delayed / Conditional' : 'Requires Careful Interpretation';
    const reasons = [`6th house: ${sixth.result} (${sixth.sign}, lord ${sixth.lord}).`, `${connectedCount} of ${relationships.length} salary/income house-relationship signatures connected.`, `Jupiter: ${jupiter.result}, Saturn: ${saturn.result}.`];

    return { secondHouse: second, thirdHouse: third, fifthHouse: fifth, sixthHouse: sixth, eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      jupiter, mercury, sun, saturn, venus, moon, mars, rahu, relationships, contextRelationships, connectedCount, potential, reasons };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.salaryFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = []; const activatedHouses = owned.slice();
    if (INCOME_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => INCOME_HOUSES.includes(h)).join(', ')}.`);
    if (INCOME_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const second = NS.getHouseSnapshot(2), sixth = NS.getHouseSnapshot(6), tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11);
    if (lordName === second.lord) factors.push(`${lordName} is the 2nd lord.`);
    if (lordName === sixth.lord) factors.push(`${lordName} is the 6th lord.`);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    return { relevant: factors.length > 0, factors, activatedHouses };
  };

  NS.buildSalaryActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.salaryFactorsForLord(md.lord), adFactors = NS.salaryFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.salaryFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, matchCount, reasons, lordsInvolved: [md.lord, ad.lord, pd.lord] });
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
    return { date, jupiter: checkBody('Jupiter', [2, 6, 10, 11], 'SAL-TRANSIT-JUP'), saturn: checkBody('Saturn', [2, 6, 10, 11], 'SAL-TRANSIT-SAT'),
      sun: checkBody('Sun', [10, 11], 'SAL-TRANSIT-SECONDARY'), mercury: checkBody('Mercury', [2, 6], 'SAL-TRANSIT-SECONDARY'), venus: checkBody('Venus', [2, 11], 'SAL-TRANSIT-SECONDARY'), moon: checkBody('Moon', [2, 11], 'SAL-TRANSIT-SECONDARY'),
      rahu: checkBody('Rahu', [6, 10], 'SAL-TRANSIT-NODES'), ketu: checkBody('Ketu', [6, 10], 'SAL-TRANSIT-NODES') };
  };

  NS.classifyEventType = function (candidate) {
    const h = candidate.activatedHouses;
    const second = h.includes(2), fifth = h.includes(5), sixth = h.includes(6), eighth = h.includes(8), ninth = h.includes(9), tenth = h.includes(10), eleventh = h.includes(11), twelfth = h.includes(12);
    if (eighth && (second || eleventh)) return 'Arrears / Delayed Income Realization';
    if (fifth && eleventh) return 'Bonus / Incentive';
    if (twelfth && sixth && tenth) return 'Employer Change With Compensation Change';
    if (eighth && sixth && tenth) return 'Compensation Restructuring';
    if (sixth && tenth && eleventh && ninth) return 'Promotion-Linked Pay Increase';
    if (sixth && second && eleventh) return 'Salary Increment';
    if (sixth && tenth && !eleventh) return 'Salary Revision';
    if (sixth && !second && !eleventh) return 'Restoration / Recovery of Employment Income';
    return 'Other Employment-Linked Income Increase';
  };

  NS.classifyLinkage = function (eventType) {
    if (eventType === 'Promotion-Linked Pay Increase') return 'promotion-linked';
    if (eventType === 'Employer Change With Compensation Change') return 'employer/job-change linked';
    if (eventType === 'Bonus / Incentive') return 'bonus/incentive linked';
    if (eventType === 'Salary Revision') return 'salary-revision linked';
    return 'independent of promotion';
  };

  NS.classifySalaryStage = function (candidate, transit) {
    const h = candidate.activatedHouses;
    if (h.includes(8)) return 'Arrears Realization';
    if (h.includes(10) && h.includes(11) && (transit.jupiter.active || transit.saturn.active)) return 'Effective Date';
    if (h.includes(9) && h.includes(10)) return 'Management Approval';
    if (h.includes(6) && h.includes(10) && !h.includes(11)) return 'Recommendation / Proposal';
    if (h.includes(6) && h.includes(11)) return 'Salary Revision Decision';
    if (h.includes(2) && h.includes(11)) return 'First Revised Payment';
    return 'Performance Evaluation';
  };

  NS.checkPromotionCrossCheck = function (candidate) {
    if (!window.PromotionTiming || !window.PromotionTiming.refresh) return null;
    const result = window.PromotionTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Salary increase window overlaps with a promotion-oriented period.', rule: ruleById('SAL-PROMOTION-CROSSCHECK-001') };
  };

  NS.checkJobChangeCrossCheck = function (candidate) {
    if (!window.JobChangeTiming || !window.JobChangeTiming.refresh) return null;
    const result = window.JobChangeTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Compensation change may be associated with an employer/job transition.', rule: ruleById('SAL-JOBCHANGE-CROSSCHECK-001') };
  };

  NS.checkCareerCrossCheck = function (candidate) {
    if (!window.CareerTurningPointTiming || !window.CareerTurningPointTiming.refresh) return null;
    const result = window.CareerTurningPointTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Income change occurs within a broader career-transition window.', rule: ruleById('SAL-CAREER-CROSSCHECK-001') };
  };

  NS.checkFinancialCrossCheck = function (candidate) {
    if (!window.FinancialGainTiming || !window.FinancialGainTiming.refresh) return null;
    const result = window.FinancialGainTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Employment-linked income timing also overlaps with a broader financial-gain period.', rule: ruleById('SAL-FINANCIAL-CROSSCHECK-001') };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }
  function assessWindowConfidence(f) { if (f >= 5) return 'Strongly Supportive'; if (f >= 4) return 'Supportive'; if (f >= 3) return 'Moderately Supportive'; if (f >= 2) return 'Mixed'; return 'Conditional'; }

  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildSalaryActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const eventType = NS.classifyEventType(c);
      const linkage = NS.classifyLinkage(eventType);
      const salaryStage = NS.classifySalaryStage(c, transit);
      const promotionCrossCheck = NS.checkPromotionCrossCheck(c);
      const jobChangeCrossCheck = NS.checkJobChangeCrossCheck(c);
      const careerCrossCheck = NS.checkCareerCrossCheck(c);
      const financialCrossCheck = NS.checkFinancialCrossCheck(c);
      const convergenceFactors = [transit.jupiter.active, transit.saturn.active, c.matchCount >= 3, c.activatedHouses.includes(6) && c.activatedHouses.includes(11), c.activatedHouses.includes(2) && c.activatedHouses.includes(10)].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const confidence = { label: assessWindowConfidence(convergenceFactors), rule: ruleById('SAL-STRENGTH-001') };
      const cautions = [];
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      if ((transit.rahu.active || transit.ketu.active) && convergenceFactors < 3) cautions.push('Rahu/Ketu activation present, but this alone is not sufficient for an income-increase window.');
      return Object.assign({}, c, { transit, eventType, linkage, salaryStage, promotionCrossCheck, jobChangeCrossCheck, careerCrossCheck, financialCrossCheck, convergenceFactors, qualification, confidence, cautions });
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
    function houseActivated(h) { const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean); return lords.some(l => NS.salaryFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    return { eventDate, eventType, inRange: true, mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      sixthActivation: houseActivated(6), tenthActivation: houseActivated(10), eleventhActivation: houseActivated(11), jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Relevant Houses (2nd/6th/10th/11th + supporting)', anchor: 'sal-sec-promise' },
    { id: 2, label: 'House Lords', anchor: 'sal-sec-promise' }, { id: 3, label: 'Natal Salary Indicators', anchor: 'sal-sec-promise' },
    { id: 4, label: 'Dasha (MD/AD/PD)', anchor: 'sal-sec-dasha' }, { id: 5, label: 'Transit', anchor: 'sal-sec-windows' },
    { id: 6, label: 'Convergence', anchor: 'sal-sec-windows' }, { id: 7, label: 'Candidate Window', anchor: 'sal-sec-windows' }
  ];

  NS.refresh = function (horizonYears) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalSalaryPotential();
    log(calculationLog, '[02] 2nd/3rd/5th/6th/8th/9th/10th/11th/12th houses and Jupiter/Mercury/Sun/Saturn/Venus/Moon/Mars/Rahu analysed');
    log(calculationLog, '[03] Natal Salary/Income Potential: ' + natalPromise.potential);
    log(calculationLog, '[04] No divisional chart used for this module (per methodology).');

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.salaryFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.salaryFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.salaryFactorsForLord(pd.lord) } : null };
      }
      log(calculationLog, '[06] Salary/Income Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate salary/income windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['SAL-NATAL-002', 'SAL-NATAL-003', 'SAL-NATAL-005', 'SAL-NATAL-006', 'SAL-NATAL-008', 'SAL-NATAL-009', 'SAL-NATAL-010', 'SAL-NATAL-011', 'SAL-NATAL-012',
      'SAL-SIGNIF-JUPITER', 'SAL-SIGNIF-MERCURY', 'SAL-SIGNIF-SUN', 'SAL-SIGNIF-SATURN', 'SAL-SIGNIF-VENUS', 'SAL-SIGNIF-MOON', 'SAL-SIGNIF-MARS', 'SAL-SIGNIF-RAHU',
      'SAL-HOUSE-2-6', 'SAL-HOUSE-2-10', 'SAL-HOUSE-2-11', 'SAL-HOUSE-6-10', 'SAL-HOUSE-6-11', 'SAL-HOUSE-10-11', 'SAL-HOUSE-5-11', 'SAL-HOUSE-9-10', 'SAL-HOUSE-9-11', 'SAL-HOUSE-3-10', 'SAL-HOUSE-3-11',
      'SAL-CONTEXT-8-2', 'SAL-CONTEXT-8-11', 'SAL-CONTEXT-12-2', 'SAL-CONTEXT-12-6', 'SAL-CONTEXT-12-10', 'SAL-NODIVISIONAL-001', 'SAL-NATAL-PROMISE-001', 'SAL-NOGUARANTEE-001']);
    if (windowsResult.available) { ['SAL-DASHA-001', 'SAL-TRANSIT-JUP', 'SAL-TRANSIT-SAT', 'SAL-TRANSIT-NODES', 'SAL-TRANSIT-SECONDARY', 'SAL-EVENTCLASS-001', 'SAL-STAGE-001', 'SAL-PROMOTION-CROSSCHECK-001', 'SAL-JOBCHANGE-CROSSCHECK-001', 'SAL-CAREER-CROSSCHECK-001', 'SAL-FINANCIAL-CROSSCHECK-001', 'SAL-STRENGTH-001'].forEach(id => rulesUsedIds.add(id)); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, currentDasha, candidateWindows: windowsResult.windows, horizonYears: horizon, calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
