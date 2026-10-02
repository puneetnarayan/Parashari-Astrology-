/* =========================================================
   INSURANCE / FINANCIAL PROTECTION TIMING — pure calculation engine.
   Parashari/Vimshottari method only. Reuses this app's existing chart/
   dignity/aspect/dasha/divisional-chart/transit calculations. The 8th
   house is NEVER interpreted as death/lifespan here — only as risk/
   transformation/claim context. Never recommends a specific insurer,
   policy, premium, or coverage amount; never guarantees a claim outcome.
   Exposed only as window.InsuranceProtectionTiming. UI lives entirely in
   insuranceProtectionTimingUI.js.
   ========================================================= */

window.InsuranceProtectionTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const EVENT_HOUSES = {
    General: [2, 6, 8, 11, 12],
    'Life/Family': [2, 5, 6, 8, 11, 12],
    'Health-related': [1, 2, 6, 8, 11, 12],
    Property: [2, 4, 6, 8, 11, 12],
    Vehicle: [2, 4, 6, 8, 11, 12],
    Business: [2, 6, 8, 10, 11, 12],
    Travel: [2, 3, 6, 8, 9, 11, 12],
    'Claim/Settlement': [2, 6, 8, 11, 12],
    'Maturity/Payout': [2, 9, 11, 12],
    Other: [2, 6, 8, 11, 12]
  };
  const EVENT_VARGA = { Property: 'D4', Vehicle: 'D16', Business: 'D10' };
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const STRENGTH_RANK = { 'Strongly Indicated': 4, 'Indicated': 3, 'Mixed': 2, 'Conditional': 1, 'Requires Careful Interpretation': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[InsuranceProtectionTiming]', text); }
  function ruleById(id) { return (window.INSURANCE_PROTECTION_TIMING_RULES || []).find(r => r.id === id); }

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
    const evidence = [`${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`, h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.', h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.'];
    if (houseNum === 8) evidence.push('Read only as risk/transformation/claim context — never as death or lifespan.');
    return { house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId), occupants: h.occupants, aspectingHere: h.aspectingHere, evidence };
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

  NS.assessNatalProtectionPattern = function (eventContext) {
    const second = classifyHouse(2, 'INS-NATAL-002'), sixth = classifyHouse(6, 'INS-NATAL-006'), eighth = classifyHouse(8, 'INS-NATAL-008'),
      eleventh = classifyHouse(11, 'INS-NATAL-011'), twelfth = classifyHouse(12, 'INS-NATAL-012');
    const houses = EVENT_HOUSES[eventContext] || EVENT_HOUSES.General;
    const supporting = {
      1: houses.includes(1) ? classifyHouse(1, 'INS-NATAL-001') : null,
      4: houses.includes(4) ? classifyHouse(4, 'INS-NATAL-004') : null,
      5: houses.includes(5) ? classifyHouse(5, 'INS-NATAL-005') : null,
      7: houses.includes(7) ? classifyHouse(7, 'INS-NATAL-007') : null,
      9: houses.includes(9) ? classifyHouse(9, 'INS-NATAL-009') : null,
      10: houses.includes(10) ? classifyHouse(10, 'INS-NATAL-010') : null
    };
    const saturn = classifyKaraka('Saturn', 'INS-SIGNIF-SATURN', 6), jupiter = classifyKaraka('Jupiter', 'INS-SIGNIF-JUPITER', 11), rahu = classifyKaraka('Rahu', 'INS-SIGNIF-RAHU', 8);

    const coreResults = [second, sixth, eighth, eleventh, twelfth].map(h => h.result);
    const strongCount = coreResults.filter(r => r === 'Strong').length;
    const challengeCount = coreResults.filter(r => r === 'Challenging').length;
    const pattern = strongCount >= 3 ? 'Strongly Indicated' : strongCount >= 2 ? 'Indicated' : challengeCount >= 2 ? 'Requires Careful Interpretation' : strongCount >= 1 ? 'Mixed' : 'Conditional';
    const reasons = [`2nd: ${second.result}; 6th: ${sixth.result}; 8th (risk/transformation context only): ${eighth.result}; 11th: ${eleventh.result}; 12th: ${twelfth.result}.`, `Saturn: ${saturn.result}, Jupiter: ${jupiter.result}.`, 'This is not a recommendation to buy or avoid insurance.'];
    return { second, sixth, eighth, eleventh, twelfth, supporting, saturn, jupiter, rahu, pattern, reasons };
  };

  // D2 (Hora) — resource/value supporting confirmation.
  NS.assessD2Confirmation = function () {
    const chart = NS.getChartData();
    if (!chart) return { available: false, level: 'Mixed', evidence: ['Chart data unavailable.'], rule: ruleById('INS-D2-001') };
    const ascD2 = vargaPosition(chart.ascendant.longitude, 'D2');
    const jupiterD2 = vargaPosition(chart.planets.find(p => p.name === 'Jupiter').longitude, 'D2');
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    const jupDignity = detailedDignity('Jupiter', jupiterD2.sign, normalizeDegrees(jupiterD2.longitude) % 30).tier;
    const supportive = strong.includes(jupDignity) || jupiterD2.sign === ascD2.sign;
    return { available: true, level: supportive ? 'Supports' : 'Mixed', evidence: [`D2 ascendant sign: ${ascD2.sign}.`, `Jupiter in D2: ${jupiterD2.sign} (${jupDignity}).`], rule: ruleById('INS-D2-001') };
  };

  NS.assessEventDivisionalConfirmation = function (eventContext) {
    const vargaKey = EVENT_VARGA[eventContext];
    if (!vargaKey) return null;
    const chart = NS.getChartData();
    if (!chart) return { available: false, varga: vargaKey, level: 'Mixed', evidence: ['Chart data unavailable.'], rule: ruleById('INS-DIVISIONAL-CONTEXT-001') };
    const ascV = vargaPosition(chart.ascendant.longitude, vargaKey);
    const lagnaLordV = SIGN_LORD[ascV.sign];
    const lagnaLordPlanet = chart.planets.find(p => p.name === lagnaLordV);
    const lagnaLordVPos = lagnaLordPlanet ? vargaPosition(lagnaLordPlanet.longitude, vargaKey) : null;
    const dignity = lagnaLordVPos ? detailedDignity(lagnaLordV, lagnaLordVPos.sign, normalizeDegrees(lagnaLordVPos.longitude) % 30).tier : 'Neutral';
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
    return { available: true, varga: vargaKey, level: strong ? 'Supports' : 'Mixed', evidence: [`${vargaKey} ascendant: ${ascV.sign}, lagna lord ${lagnaLordV} (${dignity}) in ${vargaKey}.`], rule: ruleById('INS-DIVISIONAL-CONTEXT-001') };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.protectionFactorsForLord = function (lordName, eventContext) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const houses = EVENT_HOUSES[eventContext] || EVENT_HOUSES.General;
    const factors = []; const activatedHouses = [];
    owned.forEach(h => { if (houses.includes(h)) { activatedHouses.push(h); factors.push(`${lordName} owns house ${h}.`); } });
    if (houses.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    return { relevant: factors.length > 0, factors, activatedHouses };
  };

  NS.buildProtectionActivationMap = function (horizonYears, eventContext) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.protectionFactorsForLord(md.lord, eventContext), adFactors = NS.protectionFactorsForLord(ad.lord, eventContext);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.protectionFactorsForLord(pd.lord, eventContext);
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
    return { date, saturn: checkBody('Saturn', [6, 8, 12], 'INS-TRANSIT-SAT'), jupiter: checkBody('Jupiter', [2, 11], 'INS-TRANSIT-JUP') };
  };

  NS.classifyStage = function (candidate, eventContext) {
    const h = candidate.activatedHouses;
    if (eventContext === 'Maturity/Payout' && h.includes(11)) return 'Maturity/Payout Context';
    if (eventContext === 'Claim/Settlement' && h.includes(8) && h.includes(11)) return 'Claim/Settlement Context';
    if (h.includes(6) && h.includes(12)) return 'Protection Planning/Review Period';
    if (h.includes(8) && h.includes(11)) return 'Risk-Realization/Claim Context';
    if (h.includes(2) && h.includes(12)) return 'Premium Commitment Period';
    return 'General Protection-Relevant Period';
  };

  NS.checkCrossModules = function (candidate) {
    const mods = [['FinancialGainTiming', 'Financial Gain'], ['MajorExpenditureTiming', 'Major Expenditure'], ['LoanDebtReliefTiming', 'Loan/Debt Relief'], ['PropertyTiming', 'Property Purchase'], ['PropertySaleTiming', 'Property Sale'], ['VehiclePurchaseTiming', 'Vehicle Purchase'], ['InheritanceLegacyTiming', 'Inheritance/Legacy'], ['LegalMatterTiming', 'Legal Matter Resolution']];
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
    return { overlapping: true, modules: hits, interpretation: `This period also overlaps ${hits.join(', ')} timing — no claim, settlement, or amount is implied.` };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }

  NS.buildCandidateWindows = function (horizonYears, eventContext) {
    const activationMap = NS.buildProtectionActivationMap(horizonYears, eventContext);
    if (!activationMap.available) return { available: false, windows: [] };
    const divisionalConfirmation = NS.assessEventDivisionalConfirmation(eventContext);
    const d2 = NS.assessD2Confirmation();
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const divConfirms = !!(divisionalConfirmation && divisionalConfirmation.level === 'Supports');
      const d2Confirms = d2.level === 'Supports';
      // convergenceFactors gate: 8th-house activation alone must never trigger the strongest classification.
      const convergenceFactors = [c.matchCount >= 3, transit.saturn.active || transit.jupiter.active, divConfirms, d2Confirms, c.activatedHouses.includes(6) && c.activatedHouses.includes(11)].filter(Boolean).length;
      const strength = convergenceFactors >= 4 ? 'Strongly Indicated' : convergenceFactors >= 3 ? 'Indicated' : convergenceFactors >= 2 ? 'Mixed' : convergenceFactors >= 1 ? 'Conditional' : 'Requires Careful Interpretation';
      const stage = NS.classifyStage(c, eventContext);
      const crossModules = NS.checkCrossModules(c);
      const cautions = [];
      if (!transit.saturn.active && !transit.jupiter.active) cautions.push('Neither Saturn nor Jupiter transit shows qualifying activation for this window midpoint.');
      if (c.activatedHouses.includes(8) && convergenceFactors < 2) cautions.push('8th-house activation alone is present but does not, by itself, raise this window above a weak classification — and is never read as death or lifespan.');
      return Object.assign({}, c, { transit, divisionalConfirmation, d2, strength: { label: strength }, stage, convergenceFactors, crossModules, cautions, eventContext });
    }).filter(c => c.convergenceFactors >= 1);
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Promise (2nd/6th/8th/11th/12th + context houses)', anchor: 'ins-sec-promise' },
    { id: 2, label: 'Divisional Confirmation (D2 + context-specific)', anchor: 'ins-sec-divisional' },
    { id: 3, label: 'Dasha (MD/AD/PD)', anchor: 'ins-sec-dasha' },
    { id: 4, label: 'Transit (Saturn/Jupiter)', anchor: 'ins-sec-windows' },
    { id: 5, label: 'Candidate Window', anchor: 'ins-sec-windows' },
    { id: 6, label: 'Protection-Context Stage', anchor: 'ins-sec-windows' },
    { id: 7, label: 'Cross-Module Checks', anchor: 'ins-sec-windows' }
  ];

  NS.refresh = function (horizonYears, eventContext, minStrength) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5; const ctx = eventContext || 'General';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.eventContext === ctx && NS.cache.minStrength === minStrength) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalProtectionPattern(ctx);
    log(calculationLog, '[02] 2nd/6th/8th/11th/12th and context houses analysed: ' + natalPromise.pattern);
    const d2 = NS.assessD2Confirmation();
    log(calculationLog, '[03] D2 (Hora) resource-axis confirmation computed: ' + d2.level);
    const eventDivisional = NS.assessEventDivisionalConfirmation(ctx);
    if (eventDivisional) log(calculationLog, `[04] ${eventDivisional.varga} context-specific confirmation computed: ${eventDivisional.level}`);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.protectionFactorsForLord(md.lord, ctx) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.protectionFactorsForLord(ad.lord, ctx) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.protectionFactorsForLord(pd.lord, ctx) } : null };
      }
      windowsResult = NS.buildCandidateWindows(horizon, ctx);
      log(calculationLog, '[06] Candidate protection-timing windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minStrength && minStrength !== 'All') { const t = STRENGTH_RANK[minStrength] != null ? STRENGTH_RANK[minStrength] : 0; windows = windows.filter(w => STRENGTH_RANK[w.strength.label] >= t); }

    const rulesUsedIds = new Set(['INS-NATAL-002', 'INS-NATAL-006', 'INS-NATAL-008', 'INS-NATAL-011', 'INS-NATAL-012', 'INS-SIGNIF-SATURN', 'INS-SIGNIF-JUPITER', 'INS-SIGNIF-RAHU', 'INS-D2-001', 'INS-CONV-001', 'INS-NOGUARANTEE-001', 'INS-NODEATH-001', 'INS-CROSSCHECK-001']);
    const supportingRuleMap = { 1: 'INS-NATAL-001', 4: 'INS-NATAL-004', 5: 'INS-NATAL-005', 7: 'INS-NATAL-007', 9: 'INS-NATAL-009', 10: 'INS-NATAL-010' };
    Object.keys(supportingRuleMap).forEach(h => { if (natalPromise.supporting[h]) rulesUsedIds.add(supportingRuleMap[h]); });
    if (eventDivisional) rulesUsedIds.add('INS-DIVISIONAL-CONTEXT-001');
    if (windowsResult.available) { rulesUsedIds.add('INS-DASHA-001'); rulesUsedIds.add('INS-TRANSIT-SAT'); rulesUsedIds.add('INS-TRANSIT-JUP'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, d2, eventDivisional, currentDasha, candidateWindows: windows, horizonYears: horizon, eventContext: ctx, minStrength: minStrength || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, eventContext: ctx, minStrength, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
