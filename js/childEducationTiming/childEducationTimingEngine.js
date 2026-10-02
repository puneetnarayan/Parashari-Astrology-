/* =========================================================
   CHILD EDUCATION / ACADEMIC MILESTONE TIMING — pure calculation
   engine. Parashari/Vimshottari method only. Reuses this app's existing
   chart/dignity/aspect/dasha/D24-divisional/transit calculations.
   CRITICAL: explicitly distinguishes "Parent's Chart" mode (5th/9th
   house from the parent) from "Child's Own Chart" mode (the child's
   saved native chart, currently loaded as state.chart). The active
   mode is never silently assumed — NS.refresh always returns it.
   Exposed only as window.ChildEducationTiming. UI lives entirely in
   childEducationTimingUI.js.
   ========================================================= */

window.ChildEducationTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const STRENGTH_RANK = { 'Strongly Supported': 4, 'Supported': 3, 'Mixed': 2, 'Delayed / Conditional': 1, 'Requires Careful Interpretation': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[ChildEducationTiming]', text); }
  function ruleById(id) { return (window.CHILD_EDUCATION_TIMING_RULES || []).find(r => r.id === id); }

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

  // subjectMode: 'parent' | 'child'. Both read the SAME chart data structure
  // (state.chart) — in 'child' mode that chart must be the child's own saved
  // native chart, already loaded as the active chart (the module never
  // silently assumes which one is active; the UI always displays the mode).
  NS.assessNatalEducationPattern = function (subjectMode) {
    const fifth = classifyHouse(5, 'CHILDEDU-NATAL-005'), fourth = classifyHouse(4, 'CHILDEDU-NATAL-004'), ninth = classifyHouse(9, 'CHILDEDU-NATAL-009'),
      second = classifyHouse(2, 'CHILDEDU-NATAL-002'), eleventh = classifyHouse(11, 'CHILDEDU-NATAL-011'), third = classifyHouse(3, 'CHILDEDU-NATAL-003'),
      sixth = classifyHouse(6, 'CHILDEDU-NATAL-006'), eighth = classifyHouse(8, 'CHILDEDU-NATAL-008'), tenth = classifyHouse(10, 'CHILDEDU-NATAL-010'), twelfth = classifyHouse(12, 'CHILDEDU-NATAL-012');
    const jupiter = classifyKaraka('Jupiter', 'CHILDEDU-SIGNIF-JUPITER', 5), mercury = classifyKaraka('Mercury', 'CHILDEDU-SIGNIF-MERCURY', 5), sun = classifyKaraka('Sun', 'CHILDEDU-SIGNIF-SUN', 9);

    const coreResults = [fifth, fourth, ninth, eleventh].map(h => h.result);
    const strongCount = coreResults.filter(r => r === 'Strong').length;
    const challengeCount = coreResults.filter(r => r === 'Challenging').length;
    const pattern = strongCount >= 3 ? 'Strongly Supported' : strongCount >= 2 ? 'Supported' : challengeCount >= 2 ? 'Requires Careful Interpretation' : strongCount >= 1 ? 'Mixed' : 'Delayed / Conditional';
    const reasons = [`5th house: ${fifth.result}; 4th house: ${fourth.result}; 9th house: ${ninth.result}; 11th house: ${eleventh.result}.`, `Jupiter: ${jupiter.result}, Mercury: ${mercury.result}.`, `Analysis subject: ${subjectMode === 'child' ? "Child's own chart" : "Parent's chart (child-related houses)"}.`];
    return { fifth, fourth, ninth, second, eleventh, third, sixth, eighth, tenth, twelfth, jupiter, mercury, sun, pattern, reasons, subjectMode };
  };

  // D24 (Siddhamsha) — same engine pattern as Higher Education Timing. Reuses vargaPosition() only.
  NS.assessD24Confirmation = function () {
    const chart = NS.getChartData();
    if (!chart) return { available: false, level: 'Mixed', evidence: ['Chart data unavailable.'], rule: ruleById('CHILDEDU-D24-001') };
    const ascD24 = vargaPosition(chart.ascendant.longitude, 'D24');
    const ascD24SignIndex = SIGNS.indexOf(ascD24.sign);
    const lagnaLord = SIGN_LORD[ascD24.sign];
    const lagnaLordPlanet = chart.planets.find(p => p.name === lagnaLord);
    const lagnaD24 = lagnaLordPlanet ? vargaPosition(lagnaLordPlanet.longitude, 'D24') : null;
    const dignity = lagnaD24 ? detailedDignity(lagnaLord, lagnaD24.sign, normalizeDegrees(lagnaD24.longitude) % 30).tier : 'Neutral';
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
    return { available: true, level: strong ? 'Supports' : 'Mixed', evidence: [`D24 ascendant: ${ascD24.sign}, lagna lord ${lagnaLord} (${dignity}) in D24.`], rule: ruleById('CHILDEDU-D24-001') };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }
  const EDU_HOUSES = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];

  NS.educationFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = []; const activatedHouses = [];
    owned.forEach(h => { if (EDU_HOUSES.includes(h)) { activatedHouses.push(h); factors.push(`${lordName} owns house ${h}.`); } });
    if (EDU_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    return { relevant: factors.length > 0, factors, activatedHouses };
  };

  NS.buildEducationActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.educationFactorsForLord(md.lord), adFactors = NS.educationFactorsForLord(ad.lord);
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
    return { date, jupiter: checkBody('Jupiter', [4, 5, 9], 'CHILDEDU-TRANSIT-JUP'), mercury: checkBody('Mercury', [5, 9], 'CHILDEDU-TRANSIT-MERC') };
  };

  NS.classifyMilestoneStage = function (candidate) {
    const h = candidate.activatedHouses;
    if (h.includes(4) && !h.includes(9) && !h.includes(10)) return 'Foundational Learning';
    if (h.includes(6) || h.includes(3)) return 'Active Study Phase';
    if (h.includes(6) && h.includes(5)) return 'Examination/Assessment Period';
    if (h.includes(12) || h.includes(9)) return 'Admission/Transition';
    if (h.includes(10) || h.includes(11)) return 'Achievement/Recognition';
    if (h.includes(9) && h.includes(5)) return 'Higher Education Phase';
    return 'Active Study Phase';
  };

  NS.checkCrossModules = function (candidate) {
    const mods = [['HigherEducationTiming', 'Higher Education'], ['ChildbirthTiming', 'Childbirth'], ['ForeignTravelTiming', 'Foreign Travel/Settlement'], ['Relocation', 'Relocation'], ['FinancialGainTiming', 'Financial Gain'], ['LoanDebtReliefTiming', 'Loan/Debt Relief'], ['RecognitionAwardTiming', 'Recognition/Award']];
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

  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildEducationActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d24 = NS.assessD24Confirmation();
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const d24Confirms = d24.level === 'Supports';
      const convergenceFactors = [c.matchCount >= 3, transit.jupiter.active || transit.mercury.active, d24Confirms, c.activatedHouses.includes(5) && c.activatedHouses.includes(9)].filter(Boolean).length;
      const strength = convergenceFactors >= 3 ? 'Strongly Supported' : convergenceFactors >= 2 ? 'Supported' : convergenceFactors >= 1 ? 'Mixed' : 'Delayed / Conditional';
      const stage = NS.classifyMilestoneStage(c);
      const crossModules = NS.checkCrossModules(c);
      const cautions = [];
      if (!transit.jupiter.active && !transit.mercury.active) cautions.push('Neither Jupiter nor Mercury transit shows qualifying activation for this window midpoint.');
      return Object.assign({}, c, { transit, d24, strength: { label: strength }, stage, convergenceFactors, crossModules, cautions });
    }).filter(c => c.convergenceFactors >= 1);
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Analysis Subject Mode', anchor: 'cedu-sec-mode' },
    { id: 2, label: 'Natal Promise (5th/4th/9th/2nd/11th + supporting houses)', anchor: 'cedu-sec-promise' },
    { id: 3, label: 'D24 Confirmation', anchor: 'cedu-sec-d24' },
    { id: 4, label: 'Dasha (MD/AD/PD)', anchor: 'cedu-sec-dasha' },
    { id: 5, label: 'Transit (Jupiter/Mercury)', anchor: 'cedu-sec-windows' },
    { id: 6, label: 'Candidate Window', anchor: 'cedu-sec-windows' },
    { id: 7, label: 'Milestone Stage Classification', anchor: 'cedu-sec-windows' },
    { id: 8, label: 'Cross-Module Checks', anchor: 'cedu-sec-windows' }
  ];

  NS.refresh = function (horizonYears, subjectMode, minStrength) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5; const mode = subjectMode === 'child' ? 'child' : 'parent';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.mode === mode && NS.cache.minStrength === minStrength) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, `[00] Analysis subject mode: ${mode === 'child' ? "Child's own saved chart" : "Parent's chart (child-related houses)"}`);
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalEducationPattern(mode);
    log(calculationLog, '[02] 5th/4th/9th/2nd/11th and supporting houses analysed: ' + natalPromise.pattern);
    const d24 = NS.assessD24Confirmation();
    log(calculationLog, '[03] D24 (Siddhamsha) confirmation computed: ' + d24.level);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[04] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.educationFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.educationFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.educationFactorsForLord(pd.lord) } : null };
      }
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[05] Candidate education windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minStrength && minStrength !== 'All') { const t = STRENGTH_RANK[minStrength] != null ? STRENGTH_RANK[minStrength] : 0; windows = windows.filter(w => STRENGTH_RANK[w.strength.label] >= t); }

    const rulesUsedIds = new Set(['CHILDEDU-NATAL-005', 'CHILDEDU-NATAL-004', 'CHILDEDU-NATAL-009', 'CHILDEDU-NATAL-002', 'CHILDEDU-NATAL-011', 'CHILDEDU-NATAL-003', 'CHILDEDU-NATAL-006', 'CHILDEDU-NATAL-008', 'CHILDEDU-NATAL-010', 'CHILDEDU-NATAL-012', 'CHILDEDU-SIGNIF-JUPITER', 'CHILDEDU-SIGNIF-MERCURY', 'CHILDEDU-SIGNIF-SUN', 'CHILDEDU-D24-001', 'CHILDEDU-SUBJECT-MODE-001', 'CHILDEDU-CONV-001', 'CHILDEDU-MILESTONE-001', 'CHILDEDU-NOOUTCOME-001', 'CHILDEDU-CROSSCHECK-001']);
    if (windowsResult.available) { rulesUsedIds.add('CHILDEDU-DASHA-001'); rulesUsedIds.add('CHILDEDU-TRANSIT-JUP'); rulesUsedIds.add('CHILDEDU-TRANSIT-MERC'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { subjectMode: mode, natalPromise, d24, currentDasha, candidateWindows: windows, horizonYears: horizon, minStrength: minStrength || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, mode, minStrength, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
