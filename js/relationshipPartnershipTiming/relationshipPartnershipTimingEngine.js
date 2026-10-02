/* =========================================================
   RELATIONSHIP / PARTNERSHIP START TIMING — pure calculation engine.
   Parashari/Vimshottari method only. Reuses this app's existing chart/
   dignity/aspect/dasha/D9-divisional/transit calculations. Explicitly
   distinct from Marriage Timing, Marriage Separation/Divorce Timing,
   and Matching — never duplicates or modifies their logic (read-only
   cross-checks of their own refresh() output only). Never guarantees a
   relationship/commitment, infers another person's intentions/fidelity,
   infers abuse/mental-health/character, predicts coercion/violence, or
   identifies a specific destined partner.
   Exposed only as window.RelationshipPartnershipTiming. UI lives
   entirely in relationshipPartnershipTimingUI.js.
   ========================================================= */

window.RelationshipPartnershipTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const RELATIONSHIP_HOUSES = [1, 2, 3, 5, 7, 9, 11, 12];
  const CONTEXTUAL_ONLY_HOUSES = [6, 8];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const STRENGTH_RANK = { 'Strongly Supported': 4, 'Supported': 3, 'Mixed': 2, 'Delayed / Conditional': 1, 'Requires Careful Interpretation': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[RelationshipPartnershipTiming]', text); }
  function ruleById(id) { return (window.RELATIONSHIP_PARTNERSHIP_TIMING_RULES || []).find(r => r.id === id); }

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
    if (CONTEXTUAL_ONLY_HOUSES.includes(houseNum)) evidence.push('Used only as contextual information — never to infer conflict, danger, or a partner\'s character/intentions.');
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

  NS.assessNatalRelationshipPattern = function () {
    const fifth = classifyHouse(5, 'RELPART-NATAL-005'), seventh = classifyHouse(7, 'RELPART-NATAL-007'), eleventh = classifyHouse(11, 'RELPART-NATAL-011'),
      first = classifyHouse(1, 'RELPART-NATAL-001'), second = classifyHouse(2, 'RELPART-NATAL-002'), third = classifyHouse(3, 'RELPART-NATAL-003'),
      ninth = classifyHouse(9, 'RELPART-NATAL-009'), twelfth = classifyHouse(12, 'RELPART-NATAL-012'),
      sixth = classifyHouse(6, 'RELPART-NATAL-006'), eighth = classifyHouse(8, 'RELPART-NATAL-008');
    const venus = classifyKaraka('Venus', 'RELPART-SIGNIF-VENUS', 7), jupiter = classifyKaraka('Jupiter', 'RELPART-SIGNIF-JUPITER', 11), mercury = classifyKaraka('Mercury', 'RELPART-SIGNIF-MERCURY', 7);

    const coreResults = [fifth, seventh, eleventh].map(h => h.result);
    const strongCount = coreResults.filter(r => r === 'Strong').length;
    const challengeCount = coreResults.filter(r => r === 'Challenging').length;
    const pattern = strongCount >= 2 ? 'Strongly Supported' : strongCount >= 1 ? 'Supported' : challengeCount >= 2 ? 'Requires Careful Interpretation' : seventh.result !== 'Challenging' ? 'Mixed' : 'Delayed / Conditional';
    const reasons = [`5th: ${fifth.result}; 7th: ${seventh.result}; 11th: ${eleventh.result}.`, `Venus: ${venus.result}, Jupiter: ${jupiter.result}.`, 'Houses are never labelled inherently good or bad, and no personality or character judgement is made.'];
    return { fifth, seventh, eleventh, first, second, third, ninth, twelfth, sixth, eighth, venus, jupiter, mercury, pattern, reasons };
  };

  // D9 (Navamsha) — same engine pattern as Marriage Timing, supporting confirmation only.
  NS.assessD9Confirmation = function () {
    const chart = NS.getChartData();
    if (!chart) return { available: false, level: 'Mixed', evidence: ['Chart data unavailable.'], rule: ruleById('RELPART-D9-001') };
    const ascD9 = vargaPosition(chart.ascendant.longitude, 'D9');
    const ascD9SignIndex = SIGNS.indexOf(ascD9.sign);
    const seventhD9Sign = SIGNS[(ascD9SignIndex + 6) % 12];
    const seventhD9Lord = SIGN_LORD[seventhD9Sign];
    const lordPlanet = chart.planets.find(p => p.name === seventhD9Lord);
    const lordD9 = lordPlanet ? vargaPosition(lordPlanet.longitude, 'D9') : null;
    const dignity = lordD9 ? detailedDignity(seventhD9Lord, lordD9.sign, normalizeDegrees(lordD9.longitude) % 30).tier : 'Neutral';
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
    return { available: true, level: strong ? 'Supports' : 'Mixed', evidence: [`D9 ascendant: ${ascD9.sign}; D9 7th: ${seventhD9Sign}, lord ${seventhD9Lord} (${dignity}) in D9.`], rule: ruleById('RELPART-D9-001') };
  };

  // Personal (romantic) vs professional/business partnership context distinction.
  NS.classifyPartnershipContext = function (candidate, natalPromise) {
    const h = candidate.activatedHouses;
    const personalSignals = [h.includes(5), natalPromise.venus.result !== 'Challenging' && h.includes(7)].filter(Boolean).length;
    const professionalSignals = [h.includes(10), h.includes(11) && natalPromise.mercury.result !== 'Challenging'].filter(Boolean).length;
    if (h.includes(7) && personalSignals === 0 && professionalSignals === 0) return 'Partnership indicated; personal vs professional context requires real-world context';
    if (personalSignals > professionalSignals) return 'Personal/Romantic Context Emphasis';
    if (professionalSignals > personalSignals) return 'Business/Professional Context Emphasis';
    return 'Partnership indicated; personal vs professional context requires real-world context';
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.relationshipFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = []; const activatedHouses = [];
    owned.forEach(h => { if (RELATIONSHIP_HOUSES.concat([10]).includes(h)) { activatedHouses.push(h); factors.push(`${lordName} owns house ${h}.`); } });
    if (RELATIONSHIP_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    return { relevant: factors.length > 0, factors, activatedHouses };
  };

  NS.buildRelationshipActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.relationshipFactorsForLord(md.lord), adFactors = NS.relationshipFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.relationshipFactorsForLord(pd.lord);
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
    return { date, venus: checkBody('Venus', [5, 7, 11], 'RELPART-TRANSIT-VEN'), jupiter: checkBody('Jupiter', [7, 11], 'RELPART-TRANSIT-JUP') };
  };

  NS.checkCrossModules = function (candidate) {
    const mods = [['MarriageTiming', 'Marriage Timing'], ['MarriageSeparationDivorceTiming', 'Marriage Separation/Divorce'], ['BusinessStartTiming', 'Business Start']];
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
    if (window.KundaliMatching && typeof window.KundaliMatching.refresh === 'function') {
      const result = window.KundaliMatching.refresh();
      if (result) hits.push('Matching/Compatibility (see that module for compatibility analysis)');
    }
    if (!hits.length) return null;
    return { overlapping: true, modules: hits, interpretation: `This period also overlaps ${hits.join(', ')} timing. This module stays distinct from those modules and never duplicates their logic.` };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }

  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildRelationshipActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const natalPromise = NS.assessNatalRelationshipPattern();
    const d9 = NS.assessD9Confirmation();
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const d9Confirms = d9.level === 'Supports';
      const convergenceFactors = [c.matchCount >= 3, transit.venus.active || transit.jupiter.active, d9Confirms, c.activatedHouses.includes(5) && c.activatedHouses.includes(7)].filter(Boolean).length;
      const strength = convergenceFactors >= 3 ? 'Strongly Supported' : convergenceFactors >= 2 ? 'Supported' : convergenceFactors >= 1 ? 'Mixed' : 'Delayed / Conditional';
      const context = NS.classifyPartnershipContext(c, natalPromise);
      const crossModules = NS.checkCrossModules(c);
      const cautions = [];
      if (!transit.venus.active && !transit.jupiter.active) cautions.push('Neither Venus nor Jupiter transit shows qualifying activation for this window midpoint.');
      cautions.push('This never guarantees a relationship, commitment, or marriage, and never identifies a specific destined partner.');
      return Object.assign({}, c, { transit, d9, strength: { label: strength }, context, convergenceFactors, crossModules, cautions });
    }).filter(c => c.convergenceFactors >= 1);
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Promise (5th/7th/11th + supporting houses)', anchor: 'relpart-sec-promise' },
    { id: 2, label: 'D9 Confirmation', anchor: 'relpart-sec-d9' },
    { id: 3, label: 'Dasha (MD/AD/PD)', anchor: 'relpart-sec-dasha' },
    { id: 4, label: 'Transit (Venus/Jupiter)', anchor: 'relpart-sec-windows' },
    { id: 5, label: 'Candidate Window', anchor: 'relpart-sec-windows' },
    { id: 6, label: 'Personal vs Professional Context', anchor: 'relpart-sec-windows' },
    { id: 7, label: 'Cross-Module Checks', anchor: 'relpart-sec-windows' }
  ];

  NS.refresh = function (horizonYears, minStrength) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.minStrength === minStrength) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalRelationshipPattern();
    log(calculationLog, '[02] 5th/7th/11th and supporting houses analysed: ' + natalPromise.pattern);
    const d9 = NS.assessD9Confirmation();
    log(calculationLog, '[03] D9 (Navamsha) partnership-axis confirmation computed: ' + d9.level);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[04] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.relationshipFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.relationshipFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.relationshipFactorsForLord(pd.lord) } : null };
      }
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[05] Candidate relationship/partnership windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minStrength && minStrength !== 'All') { const t = STRENGTH_RANK[minStrength] != null ? STRENGTH_RANK[minStrength] : 0; windows = windows.filter(w => STRENGTH_RANK[w.strength.label] >= t); }

    const rulesUsedIds = new Set(['RELPART-NATAL-005', 'RELPART-NATAL-007', 'RELPART-NATAL-011', 'RELPART-NATAL-001', 'RELPART-NATAL-002', 'RELPART-NATAL-003', 'RELPART-NATAL-009', 'RELPART-NATAL-012', 'RELPART-NATAL-006', 'RELPART-NATAL-008', 'RELPART-SIGNIF-VENUS', 'RELPART-SIGNIF-JUPITER', 'RELPART-SIGNIF-MERCURY', 'RELPART-D9-001', 'RELPART-PERSONAL-VS-PROFESSIONAL-001', 'RELPART-CONV-001', 'RELPART-NOGUARANTEE-001', 'RELPART-CROSSCHECK-001']);
    if (windowsResult.available) { rulesUsedIds.add('RELPART-DASHA-001'); rulesUsedIds.add('RELPART-TRANSIT-VEN'); rulesUsedIds.add('RELPART-TRANSIT-JUP'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, d9, currentDasha, candidateWindows: windows, horizonYears: horizon, minStrength: minStrength || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, minStrength, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
