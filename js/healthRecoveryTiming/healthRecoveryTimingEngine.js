/* =========================================================
   HEALTH & RECOVERY TIMING — pure calculation engine. Parashari/
   Vimshottari method only. Reuses this app's existing chart/dignity/
   aspect/dasha/transit calculations. STRICT medical-safety scope: never
   diagnoses disease, predicts death/lifespan/cause of death, predicts
   accidents/injury, recommends medication/treatment, infers mental-
   health conditions/disability, or determines medical-procedure
   success. The 8th house is NEVER interpreted as death/lifespan.
   Includes NS.applySafetyFilter() — an automated scan/rewrite layer run
   on every generated interpretation string before it reaches the UI.
   Exposed only as window.HealthRecoveryTiming. UI lives entirely in
   healthRecoveryTimingUI.js.
   ========================================================= */

window.HealthRecoveryTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const CONTEXT_HOUSES = {
    'General Wellness': [1, 6, 11, 5, 9, 10, 2],
    'Recovery / Restoration': [1, 6, 8, 11, 5, 9, 10],
    'Rehabilitation': [1, 6, 8, 12, 11, 10],
    'Existing Treatment/Recovery Phase': [1, 6, 8, 12, 11],
    'General Health Timing': [1, 6, 8, 12, 11, 5, 9, 10, 2]
  };
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const STRENGTH_RANK = { 'Supportive': 4, 'Generally Supportive': 3, 'Mixed': 2, 'Requires Greater Attention': 1, 'Delayed / Conditional': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[HealthRecoveryTiming]', text); }
  function ruleById(id) { return (window.HEALTH_RECOVERY_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // MANDATORY SAFETY FILTER — scans any generated interpretation text
  // for forbidden medical-diagnosis/death/treatment-recommendation
  // patterns and rewrites the OFFENDING SENTENCE to a safe fallback.
  // This is a structural guard, not just a disclaimer: it runs on every
  // piece of generated text before NS.refresh() returns it.
  // ---------------------------------------------------------------
  const FORBIDDEN_PATTERNS = [
    /\bdiagnos(e|is|ed|ing)\b/i,
    /\bdeath\b/i, /\bdie[sd]?\b/i, /\bdying\b/i, /\blifespan\b/i, /\bcause of death\b/i,
    /\baccident(s)?\b/i, /\binjur(y|ies|ed)\b/i, /\bsurger(y|ies)\b/i, /\bsurgical\b/i,
    /\bmedication(s)?\b/i, /\bprescri(be|ption|bed)\b/i, /\bdrug(s)?\b/i, /\btreat(ment|ments|ed)\b/i,
    /\bstop(ping)? (taking|your|the) (medication|treatment)\b/i, /\bdelay(ing)? (care|treatment)\b/i,
    /\bpregnan(t|cy)\b/i, /\bchildbirth\b/i, /\bmental[- ]health condition\b/i, /\bdisorder\b/i,
    /\bdisease\b/i, /\bcancer\b/i, /\btumou?r\b/i, /\bheart attack\b/i, /\bstroke\b/i
  ];
  const SAFE_FALLBACK = 'This astrological timing pattern is noted for general wellness/recovery context only; it is not a medical diagnosis, prognosis, or treatment recommendation.';

  NS.scanForForbiddenLanguage = function (text) {
    if (!text) return { flagged: false, matches: [] };
    const matches = FORBIDDEN_PATTERNS.filter(re => re.test(text)).map(re => re.source);
    return { flagged: matches.length > 0, matches };
  };

  // Rewrites a SINGLE string: if it matches any forbidden pattern, the
  // whole string is replaced with the safe fallback sentence (the
  // disclaimer/"never..." scope-limit text itself is exempt, since that
  // text exists precisely to name what this module must never do).
  NS.applySafetyFilter = function (text, isDisclaimerText) {
    if (isDisclaimerText) return text;
    const scan = NS.scanForForbiddenLanguage(text);
    if (!scan.flagged) return text;
    if (NS.debug) console.warn('[HealthRecoveryTiming] Safety filter blocked text:', text, scan.matches);
    return SAFE_FALLBACK;
  };

  NS.applySafetyFilterToList = function (list) { return (list || []).map(t => NS.applySafetyFilter(t, false)); };

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
      : lordInDusthana || dignity === 'Debilitated' || maleficOccupants > beneficOccupants ? 'Requires Attention'
      : lordWellPlaced || beneficOccupants > 0 ? 'Supporting' : 'Moderate';
    const evidenceRaw = [`${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`, h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.', h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.'];
    if (houseNum === 8) evidenceRaw.push('Read only as transformation/chronic-duration context — never as death or lifespan.');
    const evidence = NS.applySafetyFilterToList(evidenceRaw);
    return { house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId), occupants: h.occupants, aspectingHere: h.aspectingHere, evidence };
  }

  function classifyKaraka(name, ruleId, refHouseNum) {
    const p = NS.getPlanetSnapshot(name);
    const refHouse = NS.getHouseSnapshot(refHouseNum);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connected = p.house === refHouseNum || p.conjunctWith.includes(refHouse.lord) || p.aspectedBy.includes(refHouse.lord) || refHouse.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Requires Attention' : 'Neutral';
    if (connected && result === 'Neutral') result = 'Supporting';
    const evidence = NS.applySafetyFilterToList([`${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`, `Connected to ${refHouseNum}th: ${connected ? 'Yes' : 'No'}.`]);
    return { planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connected, evidence };
  }

  NS.assessNatalWellnessPattern = function (context) {
    const first = classifyHouse(1, 'HEALTH-NATAL-001'), sixth = classifyHouse(6, 'HEALTH-NATAL-006'), eighth = classifyHouse(8, 'HEALTH-NATAL-008'),
      twelfth = classifyHouse(12, 'HEALTH-NATAL-012'), eleventh = classifyHouse(11, 'HEALTH-NATAL-011');
    const houses = CONTEXT_HOUSES[context] || CONTEXT_HOUSES['General Health Timing'];
    const supporting = {
      5: houses.includes(5) ? classifyHouse(5, 'HEALTH-NATAL-005') : null,
      9: houses.includes(9) ? classifyHouse(9, 'HEALTH-NATAL-009') : null,
      10: houses.includes(10) ? classifyHouse(10, 'HEALTH-NATAL-010') : null,
      2: houses.includes(2) ? classifyHouse(2, 'HEALTH-NATAL-002') : null
    };
    const sun = classifyKaraka('Sun', 'HEALTH-SIGNIF-SUN', 1), moon = classifyKaraka('Moon', 'HEALTH-SIGNIF-MOON', 1),
      jupiter = classifyKaraka('Jupiter', 'HEALTH-SIGNIF-JUPITER', 11), saturn = classifyKaraka('Saturn', 'HEALTH-SIGNIF-SATURN', 6);

    const coreResults = [first, sixth, eighth, twelfth, eleventh].map(h => h.result);
    const strongCount = coreResults.filter(r => r === 'Strong').length;
    const attentionCount = coreResults.filter(r => r === 'Requires Attention').length;
    const pattern = strongCount >= 3 ? 'Supportive' : strongCount >= 2 ? 'Generally Supportive' : attentionCount >= 2 ? 'Requires Greater Attention' : strongCount >= 1 ? 'Mixed' : 'Delayed / Conditional';
    const reasonsRaw = [`1st: ${first.result}; 6th: ${sixth.result}; 8th (chronic-duration context only): ${eighth.result}; 12th: ${twelfth.result}; 11th: ${eleventh.result}.`, `Sun: ${sun.result}, Moon: ${moon.result}, Jupiter: ${jupiter.result}, Saturn: ${saturn.result}.`, 'These are astrological categories only, never medical diagnoses or risk scores.'];
    const reasons = NS.applySafetyFilterToList(reasonsRaw);
    return { first, sixth, eighth, twelfth, eleventh, supporting, sun, moon, jupiter, saturn, pattern, reasons };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.wellnessFactorsForLord = function (lordName, context) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const houses = CONTEXT_HOUSES[context] || CONTEXT_HOUSES['General Health Timing'];
    const factors = []; const activatedHouses = [];
    owned.forEach(h => { if (houses.includes(h)) { activatedHouses.push(h); factors.push(`${lordName} owns house ${h}.`); } });
    if (houses.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    return { relevant: factors.length > 0, factors: NS.applySafetyFilterToList(factors), activatedHouses };
  };

  NS.buildWellnessActivationMap = function (horizonYears, context) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.wellnessFactorsForLord(md.lord, context), adFactors = NS.wellnessFactorsForLord(ad.lord, context);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.wellnessFactorsForLord(pd.lord, context);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, matchCount, reasons: NS.applySafetyFilterToList(reasons) });
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
      return { active, house, sign: SIGNS[signIdx], reasons: NS.applySafetyFilterToList(reasons), rule: ruleById(ruleId) };
    }
    return { date, jupiter: checkBody('Jupiter', [1, 5, 9, 11], 'HEALTH-TRANSIT-JUP'), saturn: checkBody('Saturn', [1, 6, 8, 12], 'HEALTH-TRANSIT-SAT') };
  };

  NS.classifyStage = function (candidate, context) {
    const h = candidate.activatedHouses;
    if (context === 'General Wellness' || context === 'General Health Timing') {
      if (h.includes(1) && h.includes(11)) return 'Supportive Wellness Period';
      if (h.includes(6) && !h.includes(8)) return 'Maintenance Period';
      if (h.includes(6) && h.includes(8)) return 'Greater-Attention Period';
      return 'Mixed Period';
    }
    if (h.includes(6) && h.includes(8) && !h.includes(11)) return 'Beginning of Recovery Focus';
    if (h.includes(8) && h.includes(12)) return 'Active Recovery';
    if (h.includes(12) && h.includes(11)) return 'Stabilization';
    if (h.includes(6) && h.includes(12)) return 'Rehabilitation';
    if (h.includes(10) && h.includes(11)) return 'Restoration of Routine';
    if (h.includes(10) && !h.includes(8)) return 'Return-to-Activity Context';
    if (h.includes(11) && h.includes(9)) return 'Recovery-Completion/Supportive Phase';
    if (h.includes(1) && h.includes(6)) return 'Wellness Attention';
    return 'Mixed/Uncertain';
  };

  NS.checkCrossModules = function (candidate) {
    const mods = [['RetirementTiming', 'Retirement'], ['Relocation', 'Relocation'], ['FinancialGainTiming', 'Financial Gain'], ['MajorExpenditureTiming', 'Major Expenditure'], ['InsuranceProtectionTiming', 'Insurance/Financial Protection']];
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
    return { overlapping: true, modules: hits, interpretation: NS.applySafetyFilter(`The wellness/recovery period overlaps with ${hits.join(', ')} timing.`) };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }

  NS.buildCandidateWindows = function (horizonYears, context) {
    const activationMap = NS.buildWellnessActivationMap(horizonYears, context);
    if (!activationMap.available) return { available: false, windows: [] };
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      // convergenceFactors gate: 8th-house activation alone must never force the strongest classification.
      const convergenceFactors = [c.matchCount >= 3, transit.jupiter.active || transit.saturn.active, c.activatedHouses.includes(1) && c.activatedHouses.includes(11), !(c.activatedHouses.includes(8) && c.matchCount < 2)].filter(Boolean).length;
      const strength = convergenceFactors >= 4 ? 'Supportive' : convergenceFactors >= 3 ? 'Generally Supportive' : convergenceFactors >= 2 ? 'Mixed' : convergenceFactors >= 1 ? 'Requires Greater Attention' : 'Delayed / Conditional';
      const stage = NS.classifyStage(c, context);
      const crossModules = NS.checkCrossModules(c);
      const cautionsRaw = [];
      if (!transit.jupiter.active && !transit.saturn.active) cautionsRaw.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      if (c.activatedHouses.includes(8) && convergenceFactors < 2) cautionsRaw.push('8th-house activation alone is present but does not, by itself, raise this window above a weak classification — and is never read as death or lifespan.');
      return Object.assign({}, c, { transit, strength: { label: strength }, stage, convergenceFactors, crossModules, cautions: NS.applySafetyFilterToList(cautionsRaw), context });
    }).filter(c => c.convergenceFactors >= 1);
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  NS.recordKnownEvent = function (eventDate, recoveryStartDate, category) {
    // Stored only as contextual timing information — never used to
    // independently diagnose a condition. No sensitive medical details
    // are required or stored beyond a broad category label.
    return { eventDate, recoveryStartDate, category: NS.applySafetyFilter(category || 'General') };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Context Selection', anchor: 'health-sec-context' },
    { id: 2, label: 'Relevant Houses (1st/6th/8th/12th/11th + supporting)', anchor: 'health-sec-promise' },
    { id: 3, label: 'House Lords', anchor: 'health-sec-promise' },
    { id: 4, label: 'Natal Wellness/Recovery Pattern', anchor: 'health-sec-promise' },
    { id: 5, label: 'Dasha (MD/AD/PD)', anchor: 'health-sec-dasha' },
    { id: 6, label: 'Transit (Jupiter/Saturn)', anchor: 'health-sec-windows' },
    { id: 7, label: 'Convergence', anchor: 'health-sec-windows' },
    { id: 8, label: 'Interpretation (Safety-Filtered)', anchor: 'health-sec-windows' }
  ];

  NS.refresh = function (horizonYears, context, minStrength) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5; const ctx = context || 'General Wellness';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.context === ctx && NS.cache.minStrength === minStrength) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, `[00] Context selected: ${ctx}`);
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalWellnessPattern(ctx);
    log(calculationLog, '[02] 1st/6th/8th/12th/11th and supporting houses analysed: ' + natalPromise.pattern);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[03] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.wellnessFactorsForLord(md.lord, ctx) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.wellnessFactorsForLord(ad.lord, ctx) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.wellnessFactorsForLord(pd.lord, ctx) } : null };
      }
      windowsResult = NS.buildCandidateWindows(horizon, ctx);
      log(calculationLog, '[04] Candidate wellness/recovery windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minStrength && minStrength !== 'All') { const t = STRENGTH_RANK[minStrength] != null ? STRENGTH_RANK[minStrength] : 0; windows = windows.filter(w => STRENGTH_RANK[w.strength.label] >= t); }

    const rulesUsedIds = new Set(['HEALTH-NATAL-001', 'HEALTH-NATAL-006', 'HEALTH-NATAL-008', 'HEALTH-NATAL-012', 'HEALTH-NATAL-011', 'HEALTH-SIGNIF-SUN', 'HEALTH-SIGNIF-MOON', 'HEALTH-SIGNIF-JUPITER', 'HEALTH-SIGNIF-SATURN', 'HEALTH-CONTEXT-001', 'HEALTH-CONV-001', 'HEALTH-STAGE-001', 'HEALTH-SAFETY-FILTER-001', 'HEALTH-NODIAGNOSIS-001', 'HEALTH-DISCLAIMER-001', 'HEALTH-CROSSCHECK-001']);
    const supportingRuleMap = { 5: 'HEALTH-NATAL-005', 9: 'HEALTH-NATAL-009', 10: 'HEALTH-NATAL-010', 2: 'HEALTH-NATAL-002' };
    Object.keys(supportingRuleMap).forEach(h => { if (natalPromise.supporting[h]) rulesUsedIds.add(supportingRuleMap[h]); });
    if (windowsResult.available) { rulesUsedIds.add('HEALTH-DASHA-001'); rulesUsedIds.add('HEALTH-TRANSIT-JUP'); rulesUsedIds.add('HEALTH-TRANSIT-SAT'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, currentDasha, candidateWindows: windows, horizonYears: horizon, context: ctx, minStrength: minStrength || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing,
      disclaimer: 'This is an astrological timing analysis for general wellness and recovery context. It is not medical diagnosis or medical advice. For health concerns, diagnosis, treatment and urgent symptoms, consult a qualified healthcare professional.' };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, context: ctx, minStrength, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
