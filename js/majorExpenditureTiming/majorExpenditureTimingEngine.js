/* =========================================================
   MAJOR EXPENDITURE / FINANCIAL COMMITMENT TIMING — pure calculation
   engine. Parashari/Vimshottari method only. Reuses this app's existing
   chart/dignity/aspect/dasha/divisional-chart/transit calculations —
   same architecture as prior timing modules. Never recommends a
   specific investment, loan, lender, product, or amount; never predicts
   medical emergencies or accidents.
   Exposed only as window.MajorExpenditureTiming. UI lives entirely in
   majorExpenditureTimingUI.js.
   ========================================================= */

window.MajorExpenditureTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const PURPOSE_HOUSES = {
    General: [2, 12, 4, 11],
    Property: [2, 12, 4, 11],
    Vehicle: [2, 12, 4, 11],
    Education: [2, 12, 5, 9, 11],
    Business: [2, 12, 10, 11],
    'Debt-Financed': [2, 12, 6, 8, 11],
    'Travel/Partnership': [2, 12, 3, 7, 9, 11]
  };
  const PURPOSE_VARGA = { Property: 'D4', Vehicle: 'D16', Education: 'D24', Business: 'D10' };
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const STRENGTH_RANK = { 'Strongly Indicated': 4, 'Indicated': 3, 'Mixed': 2, 'Conditional': 1, 'Requires Careful Interpretation': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[MajorExpenditureTiming]', text); }
  function ruleById(id) { return (window.MAJOR_EXPENDITURE_TIMING_RULES || []).find(r => r.id === id); }

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
      evidence: [`${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`, `Connected to ${refHouseNum}th: ${connected ? 'Yes' : 'No'}.`] };
  }

  NS.assessNatalMajorExpenditurePattern = function (purpose) {
    const houses = (PURPOSE_HOUSES[purpose] || PURPOSE_HOUSES.General);
    const second = classifyHouse(2, 'MAJEXP-NATAL-002'), twelfth = classifyHouse(12, 'MAJEXP-NATAL-012'),
      fourth = classifyHouse(4, 'MAJEXP-NATAL-004'), eleventh = classifyHouse(11, 'MAJEXP-NATAL-011');
    const purposeDetail = {
      5: houses.includes(5) ? classifyHouse(5, 'MAJEXP-PURPOSE-005') : null,
      9: houses.includes(9) ? classifyHouse(9, 'MAJEXP-PURPOSE-009') : null,
      10: houses.includes(10) ? classifyHouse(10, 'MAJEXP-PURPOSE-010') : null,
      6: houses.includes(6) ? classifyHouse(6, 'MAJEXP-PURPOSE-006') : null,
      8: houses.includes(8) ? classifyHouse(8, 'MAJEXP-PURPOSE-008') : null,
      3: houses.includes(3) ? classifyHouse(3, 'MAJEXP-PURPOSE-003') : null,
      7: houses.includes(7) ? classifyHouse(7, 'MAJEXP-PURPOSE-007') : null
    };
    const jupiter = classifyKaraka('Jupiter', 'MAJEXP-SIGNIF-JUPITER', 2), saturn = classifyKaraka('Saturn', 'MAJEXP-SIGNIF-SATURN', 12),
      venus = classifyKaraka('Venus', 'MAJEXP-SIGNIF-VENUS', 4), mercury = classifyKaraka('Mercury', 'MAJEXP-SIGNIF-MERCURY', 2);

    const coreResults = [second, twelfth, fourth, eleventh].map(h => h.result);
    const strongCount = coreResults.filter(r => r === 'Strong').length;
    const challengeCount = coreResults.filter(r => r === 'Challenging').length;
    const pattern = strongCount >= 3 ? 'Strongly Indicated' : strongCount >= 2 ? 'Indicated' : challengeCount >= 2 ? 'Requires Careful Interpretation' : strongCount >= 1 ? 'Mixed' : 'Conditional';
    const reasons = [`2nd house: ${second.result}; 12th house: ${twelfth.result}; 4th house: ${fourth.result}; 11th house: ${eleventh.result}.`, `Jupiter: ${jupiter.result}, Saturn: ${saturn.result}.`];
    return { second, twelfth, fourth, eleventh, purposeDetail, jupiter, saturn, venus, mercury, pattern, reasons };
  };

  // D2 (Hora) — wealth-axis supporting confirmation. Reuses vargaPosition() only.
  NS.assessD2Confirmation = function () {
    const chart = NS.getChartData();
    if (!chart) return { available: false, level: 'Mixed', evidence: ['Chart data unavailable.'], rule: ruleById('MAJEXP-D2-001') };
    const ascD2 = vargaPosition(chart.ascendant.longitude, 'D2');
    const jupiterD2 = vargaPosition(chart.planets.find(p => p.name === 'Jupiter').longitude, 'D2');
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    const jupDignity = detailedDignity('Jupiter', jupiterD2.sign, normalizeDegrees(jupiterD2.longitude) % 30).tier;
    const supportive = strong.includes(jupDignity) || jupiterD2.sign === ascD2.sign;
    return { available: true, level: supportive ? 'Supports' : 'Mixed', evidence: [`D2 ascendant sign: ${ascD2.sign}.`, `Jupiter in D2: ${jupiterD2.sign} (${jupDignity}).`], rule: ruleById('MAJEXP-D2-001') };
  };

  // Purpose-specific divisional confirmation — reuses vargaPosition() contextually only.
  NS.assessPurposeDivisionalConfirmation = function (purpose) {
    const vargaKey = PURPOSE_VARGA[purpose];
    if (!vargaKey) return null;
    const chart = NS.getChartData();
    if (!chart) return { available: false, varga: vargaKey, level: 'Mixed', evidence: ['Chart data unavailable.'], rule: ruleById('MAJEXP-DIVISIONAL-CONTEXT-001') };
    const ascV = vargaPosition(chart.ascendant.longitude, vargaKey);
    const ascVSignIndex = SIGNS.indexOf(ascV.sign);
    const lagnaLordV = SIGN_LORD[ascV.sign];
    const lagnaLordPlanet = chart.planets.find(p => p.name === lagnaLordV);
    const lagnaLordVPos = lagnaLordPlanet ? vargaPosition(lagnaLordPlanet.longitude, vargaKey) : null;
    const dignity = lagnaLordVPos ? detailedDignity(lagnaLordV, lagnaLordVPos.sign, normalizeDegrees(lagnaLordVPos.longitude) % 30).tier : 'Neutral';
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
    return { available: true, varga: vargaKey, level: strong ? 'Supports' : 'Mixed', evidence: [`${vargaKey} ascendant: ${ascV.sign}, lagna lord ${lagnaLordV} (${dignity}) in ${vargaKey}.`], rule: ruleById('MAJEXP-DIVISIONAL-CONTEXT-001') };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.expenditureFactorsForLord = function (lordName, purpose) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const houses = (PURPOSE_HOUSES[purpose] || PURPOSE_HOUSES.General);
    const factors = []; const activatedHouses = [];
    owned.forEach(h => { if (houses.includes(h)) { activatedHouses.push(h); factors.push(`${lordName} owns house ${h}.`); } });
    if (houses.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    return { relevant: factors.length > 0, factors, activatedHouses };
  };

  NS.buildExpenditureActivationMap = function (horizonYears, purpose) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.expenditureFactorsForLord(md.lord, purpose), adFactors = NS.expenditureFactorsForLord(ad.lord, purpose);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.expenditureFactorsForLord(pd.lord, purpose);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, matchCount, reasons });
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
    return { date, jupiter: checkBody('Jupiter', [2, 4, 11], 'MAJEXP-TRANSIT-JUP'), saturn: checkBody('Saturn', [2, 12], 'MAJEXP-TRANSIT-SAT') };
  };

  NS.classifyPlannedVsUnplanned = function (candidate, transit) {
    const h = candidate.activatedHouses;
    const steadySupport = (h.includes(2) || h.includes(11)) && transit.jupiter.active;
    const suddenSignal = h.includes(8) && !steadySupport;
    if (steadySupport && !suddenSignal) return 'Planned';
    if (suddenSignal) return 'Unplanned/Sudden';
    return 'Mixed';
  };

  NS.checkPropertyCrossCheck = function (candidate) {
    const mods = [['PropertyTiming', 'Property Purchase'], ['PropertySaleTiming', 'Property Sale'], ['VehiclePurchaseTiming', 'Vehicle Purchase'], ['HomeConstructionTiming', 'Home Construction']];
    const hits = [];
    mods.forEach(([key, label]) => {
      if (window[key] && typeof window[key].refresh === 'function') {
        const result = window[key].refresh();
        const windowsRaw = result && (result.candidateWindows || result.windows);
        const windows = Array.isArray(windowsRaw) ? windowsRaw : null;
        const overlap = windows && windows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
        if (overlap) hits.push(label);
      }
    });
    if (!hits.length) return null;
    return { overlapping: true, modules: hits, interpretation: `This period also overlaps ${hits.join(', ')} timing — no specific purchase, loan, or amount is implied.` };
  };

  NS.checkFinancialModulesCrossCheck = function (candidate) {
    const mods = [['FinancialGainTiming', 'Financial Gain'], ['LoanDebtReliefTiming', 'Loan/Debt Relief'], ['BusinessStartTiming', 'Business Start'], ['ChildEducationTiming', 'Child Education']];
    const hits = [];
    mods.forEach(([key, label]) => {
      if (window[key] && typeof window[key].refresh === 'function') {
        const result = window[key].refresh();
        const windowsRaw = result && (result.candidateWindows || result.windows);
        const windows = Array.isArray(windowsRaw) ? windowsRaw : null;
        const overlap = windows && windows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
        if (overlap) hits.push(label);
      }
    });
    if (!hits.length) return null;
    return { overlapping: true, modules: hits, interpretation: `This period also overlaps ${hits.join(', ')} timing.` };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }

  NS.buildCandidateWindows = function (horizonYears, purpose) {
    const activationMap = NS.buildExpenditureActivationMap(horizonYears, purpose);
    if (!activationMap.available) return { available: false, windows: [] };
    const divisionalConfirmation = NS.assessPurposeDivisionalConfirmation(purpose);
    const d2 = NS.assessD2Confirmation();
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const divConfirms = !!(divisionalConfirmation && divisionalConfirmation.level === 'Supports');
      const d2Confirms = d2.level === 'Supports';
      // convergenceFactors gate: never let a single weak factor force the strongest classification.
      const convergenceFactors = [c.matchCount >= 3, transit.jupiter.active || transit.saturn.active, divConfirms, d2Confirms, c.activatedHouses.includes(2) && c.activatedHouses.includes(12)].filter(Boolean).length;
      const strength = convergenceFactors >= 4 ? 'Strongly Indicated' : convergenceFactors >= 3 ? 'Indicated' : convergenceFactors >= 2 ? 'Mixed' : convergenceFactors >= 1 ? 'Conditional' : 'Requires Careful Interpretation';
      const nature = NS.classifyPlannedVsUnplanned(c, transit);
      const propertyCrossCheck = NS.checkPropertyCrossCheck(c);
      const financialCrossCheck = NS.checkFinancialModulesCrossCheck(c);
      const cautions = [];
      if (nature === 'Unplanned/Sudden') cautions.push('Sudden/unplanned-pattern indicators are present; this is a timing pattern only, never a prediction of a medical emergency or accident.');
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      return Object.assign({}, c, { transit, divisionalConfirmation, d2, strength: { label: strength }, nature, convergenceFactors, propertyCrossCheck, financialCrossCheck, cautions, purpose });
    }).filter(c => c.convergenceFactors >= 1);
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Promise (2nd/12th/4th/11th + purpose houses)', anchor: 'majexp-sec-promise' },
    { id: 2, label: 'Divisional Confirmation (D2 + purpose-specific)', anchor: 'majexp-sec-divisional' },
    { id: 3, label: 'Dasha (MD/AD/PD)', anchor: 'majexp-sec-dasha' },
    { id: 4, label: 'Transit (Jupiter/Saturn)', anchor: 'majexp-sec-windows' },
    { id: 5, label: 'Candidate Window', anchor: 'majexp-sec-windows' },
    { id: 6, label: 'Planned vs Unplanned Classification', anchor: 'majexp-sec-windows' },
    { id: 7, label: 'Cross-Module Checks', anchor: 'majexp-sec-windows' }
  ];

  NS.refresh = function (horizonYears, purpose, minStrength) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5; const ctx = purpose || 'General';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.purpose === ctx && NS.cache.minStrength === minStrength) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalMajorExpenditurePattern(ctx);
    log(calculationLog, '[02] 2nd/12th/4th/11th and purpose houses analysed: ' + natalPromise.pattern);
    const d2 = NS.assessD2Confirmation();
    log(calculationLog, '[03] D2 (Hora) wealth-axis confirmation computed: ' + d2.level);
    const purposeDivisional = NS.assessPurposeDivisionalConfirmation(ctx);
    if (purposeDivisional) log(calculationLog, `[04] ${purposeDivisional.varga} purpose-specific confirmation computed: ${purposeDivisional.level}`);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.expenditureFactorsForLord(md.lord, ctx) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.expenditureFactorsForLord(ad.lord, ctx) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.expenditureFactorsForLord(pd.lord, ctx) } : null };
      }
      windowsResult = NS.buildCandidateWindows(horizon, ctx);
      log(calculationLog, '[06] Candidate major-expenditure windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minStrength && minStrength !== 'All') { const t = STRENGTH_RANK[minStrength] != null ? STRENGTH_RANK[minStrength] : 0; windows = windows.filter(w => STRENGTH_RANK[w.strength.label] >= t); }

    const rulesUsedIds = new Set(['MAJEXP-NATAL-002', 'MAJEXP-NATAL-012', 'MAJEXP-NATAL-004', 'MAJEXP-NATAL-011', 'MAJEXP-SIGNIF-JUPITER', 'MAJEXP-SIGNIF-SATURN', 'MAJEXP-SIGNIF-VENUS', 'MAJEXP-SIGNIF-MERCURY', 'MAJEXP-D2-001', 'MAJEXP-CONV-001', 'MAJEXP-PLANNED-001', 'MAJEXP-NOINVEST-001', 'MAJEXP-NOMEDICAL-001', 'MAJEXP-CROSSCHECK-001']);
    const purposeRuleMap = { 5: 'MAJEXP-PURPOSE-005', 9: 'MAJEXP-PURPOSE-009', 10: 'MAJEXP-PURPOSE-010', 6: 'MAJEXP-PURPOSE-006', 8: 'MAJEXP-PURPOSE-008', 3: 'MAJEXP-PURPOSE-003', 7: 'MAJEXP-PURPOSE-007' };
    Object.keys(purposeRuleMap).forEach(h => { if (natalPromise.purposeDetail[h]) rulesUsedIds.add(purposeRuleMap[h]); });
    if (purposeDivisional) rulesUsedIds.add('MAJEXP-DIVISIONAL-CONTEXT-001');
    if (windowsResult.available) { rulesUsedIds.add('MAJEXP-DASHA-001'); rulesUsedIds.add('MAJEXP-TRANSIT-JUP'); rulesUsedIds.add('MAJEXP-TRANSIT-SAT'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, d2, purposeDivisional, currentDasha, candidateWindows: windows, horizonYears: horizon, purpose: ctx, minStrength: minStrength || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, purpose: ctx, minStrength, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
