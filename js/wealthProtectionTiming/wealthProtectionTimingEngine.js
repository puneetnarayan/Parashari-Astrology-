/* =========================================================
   WEALTH PROTECTION & ASSET CONSOLIDATION TIMING — pure calculation
   engine. Parashari/Vimshottari method only. Reuses this app's existing
   chart/dignity/aspect/dasha/divisional-chart/transit calculations —
   same architecture as prior timing modules (see
   docs/_moduleDiscoveryInventory.md). Never recommends a specific
   investment, lender, tax strategy, or guarantees financial success;
   never infers death/lifespan from the 8th house.
   Exposed only as window.WealthProtectionTiming. UI lives entirely in
   wealthProtectionTimingUI.js.
   ========================================================= */

window.WealthProtectionTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  // Section 5/6 houses.
  const PRIMARY_HOUSES = [2, 11, 8, 4, 9, 12];
  const SUPPORTING_HOUSES = [1, 5, 6, 7, 10, 3];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const EVIDENCE_RANK = { Strong: 3, Moderate: 2, Contextual: 1, Limited: 0 };

  // Section 21 context selectors.
  const OBJECTIVES = ['General Wealth Protection', 'Asset Consolidation', 'Family Asset Organization', 'Documentation / Nomination', 'Liability Management', 'Legacy Preparation', 'Financial Simplification'];
  const ASSET_CONTEXTS = ['General', 'Property', 'Financial Assets', 'Family Assets', 'Business Assets', 'Mixed'];
  NS.OBJECTIVES = OBJECTIVES;
  NS.ASSET_CONTEXTS = ASSET_CONTEXTS;

  // Section 4 — event types, Section 20 — event stages.
  const EVENT_TYPES = {
    wealthPreservation: 'Wealth Preservation', assetConsolidation: 'Asset Consolidation', financialSimplification: 'Financial Simplification',
    familyAssetOrganization: 'Family Asset Organization', ownershipRestructuring: 'Ownership Restructuring', nominationDocumentation: 'Nomination / Documentation',
    liabilityAssetBalancing: 'Liability-Asset Balancing', legacyPreparation: 'Legacy Preparation', accumulationToPreservation: 'Accumulation → Preservation',
    financialReorganization: 'Financial Reorganization', assetProtection: 'Asset Protection', consolidationCompletion: 'Consolidation Completion'
  };
  NS.EVENT_TYPES = EVENT_TYPES;
  const EVENT_STAGES = ['Financial Review', 'Planning', 'Documentation', 'Ownership/Structure Review', 'Consolidation', 'Liability Rebalancing', 'Asset Reorganization', 'Nomination/Beneficiary Review', 'Legacy Preparation', 'Preservation', 'Simplification', 'Completion', 'Mixed / Transitional'];
  NS.EVENT_STAGES = EVENT_STAGES;

  // Financial-safety forbidden-language scanner (Section 31/32/33). Independent of
  // HealthRecoveryTiming's medical scanner — this one targets investment/lender/
  // tax-advice/guaranteed-outcome/death-lifespan language specific to this domain.
  const FORBIDDEN_PATTERNS = [
    /\bguarantee(d|s)?\s+(financial\s+)?success\b/i, /\bguaranteed\s+returns?\b/i,
    /\bwill\s+(definitely|certainly)\s+(succeed|gain|profit)\b/i,
    /\binvest\s+in\b/i, /\bbuy\s+(this|these)\s+(stock|fund|bond|security|securities)\b/i,
    /\brecommend(ed|s)?\s+(stock|fund|bond|security|securities|insurance\s+product|lender|tax\s+strategy)\b/i,
    /\bexact(ly)?\s+(amount|wealth|asset\s+price)\b/i, /\bwill\s+(die|pass\s+away)\b/i,
    /\bdate\s+of\s+death\b/i, /\blifespan\b/i, /\blife\s+expectancy\b/i, /\bdeath\s+of\s+(a\s+)?relative\b/i,
    /\btax\s+advice\b/i, /\blegal\s+advice\b/i, /\bestate[- ]planning\s+advice\b/i
  ];
  NS.scanForForbiddenLanguage = function (text) {
    const s = String(text || '');
    const hits = FORBIDDEN_PATTERNS.filter(re => re.test(s));
    return { forbidden: hits.length > 0, matched: hits.map(re => re.source) };
  };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[WealthProtectionTiming]', text); }
  function ruleById(id) { return (window.WEALTHPROTECTION_TIMING_RULES || []).find(r => r.id === id); }

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

  // Classifies a house's wealth-protection-relevant condition. For the 8th house
  // this NEVER emits death/lifespan language — only restructuring/shared-asset/
  // legacy wording (Section 32 safety rule, tested explicitly).
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
    if (houseNum === 8) evidence.push('8th-house reading is limited to restructuring, shared resources, succession/legacy themes, transformation of ownership and long-term financial reorganization — never death, lifespan or fatal-event inference.');
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

  // Section 7 — house relationships (lord-connection check between two houses).
  function lordsConnected(houseA, houseB) {
    const chart = NS.getChartData();
    const hA = NS.getHouseSnapshot(houseA), hB = NS.getHouseSnapshot(houseB);
    const pA = chart.planets.find(p => p.name === hA.lord), pB = chart.planets.find(p => p.name === hB.lord);
    if (!pA || !pB) return { connected: false, detail: 'Lord data unavailable.' };
    const sameHouse = Number(pA.house) === Number(pB.house);
    const conjunct = (pA.conjunctWith || []).includes(hB.lord) || (pB.conjunctWith || []).includes(hA.lord);
    const aspect = (pA.aspectedBy || []).includes(hB.lord) || (pB.aspectedBy || []).includes(hA.lord);
    const mutualOccupation = Number(pA.house) === houseB || Number(pB.house) === houseA;
    const connected = sameHouse || conjunct || aspect || mutualOccupation;
    return { connected, detail: `${hA.lord} (${houseA}th lord, house ${pA.house}) ↔ ${hB.lord} (${houseB}th lord, house ${pB.house}): ${connected ? 'connected' : 'no direct connection detected'}.` };
  }

  NS.assessHouseRelationships = function () {
    const pairs = [
      ['2-11', 2, 11, 'WEALTHPROTECTION-REL-2-11'], ['2-8', 2, 8, 'WEALTHPROTECTION-REL-2-8'], ['2-4', 2, 4, 'WEALTHPROTECTION-REL-2-4'],
      ['2-9', 2, 9, 'WEALTHPROTECTION-REL-2-9'], ['2-12', 2, 12, 'WEALTHPROTECTION-REL-2-12'], ['4-8', 4, 8, 'WEALTHPROTECTION-REL-4-8'],
      ['4-11', 4, 11, 'WEALTHPROTECTION-REL-4-11'], ['6-2', 6, 2, 'WEALTHPROTECTION-REL-6-2'], ['6-11', 6, 11, 'WEALTHPROTECTION-REL-6-11'],
      ['8-9', 8, 9, 'WEALTHPROTECTION-REL-8-9'], ['8-11', 8, 11, 'WEALTHPROTECTION-REL-8-11'], ['9-11', 9, 11, 'WEALTHPROTECTION-REL-9-11']
    ];
    const relationships = pairs.map(([key, a, b, ruleId]) => Object.assign({ key, houseA: a, houseB: b, rule: ruleById(ruleId) }, lordsConnected(a, b)));
    const tenTo211 = { key: '10-2/11', connected: lordsConnected(10, 2).connected || lordsConnected(10, 11).connected, detail: lordsConnected(10, 2).detail + ' / ' + lordsConnected(10, 11).detail, rule: ruleById('WEALTHPROTECTION-REL-10-2-11') };
    const twelveTo211 = { key: '12-2/11', connected: lordsConnected(12, 2).connected || lordsConnected(12, 11).connected, detail: lordsConnected(12, 2).detail + ' / ' + lordsConnected(12, 11).detail, rule: ruleById('WEALTHPROTECTION-REL-12-2-11') };
    relationships.push(tenTo211, twelveTo211);
    return relationships;
  };

  // Section 10 — natal promise.
  NS.evaluateWealthProtectionNatalPromise = function () {
    const second = classifyHouse(2, 'WEALTHPROTECTION-NATAL-002'), eleventh = classifyHouse(11, 'WEALTHPROTECTION-NATAL-011'),
      eighth = classifyHouse(8, 'WEALTHPROTECTION-NATAL-008'), fourth = classifyHouse(4, 'WEALTHPROTECTION-NATAL-004'),
      ninth = classifyHouse(9, 'WEALTHPROTECTION-NATAL-009'), twelfth = classifyHouse(12, 'WEALTHPROTECTION-NATAL-012');
    const relationships = NS.assessHouseRelationships();
    const connectedCount = relationships.filter(r => r.connected).length;
    const jupiter = classifyKaraka('Jupiter', 'WEALTHPROTECTION-SIGNIF-JUPITER', 2), venus = classifyKaraka('Venus', 'WEALTHPROTECTION-SIGNIF-VENUS', 4),
      mercury = classifyKaraka('Mercury', 'WEALTHPROTECTION-SIGNIF-MERCURY', 3), saturn = classifyKaraka('Saturn', 'WEALTHPROTECTION-SIGNIF-SATURN', 2),
      moon = classifyKaraka('Moon', 'WEALTHPROTECTION-SIGNIF-MOON', 2), sun = classifyKaraka('Sun', 'WEALTHPROTECTION-SIGNIF-SUN', 2), mars = classifyKaraka('Mars', 'WEALTHPROTECTION-SIGNIF-MARS', 4);
    const d2 = NS.assessD2Confirmation();

    const coreResults = [second, eleventh, eighth, fourth, ninth].map(h => h.result);
    const strongCount = coreResults.filter(r => r === 'Strong').length;
    const challengeCount = coreResults.filter(r => r === 'Challenging').length;
    let classification;
    if (strongCount >= 2 && connectedCount >= 3) classification = 'Strong';
    else if (strongCount >= 1 && connectedCount >= 2) classification = 'Moderate';
    else if (connectedCount >= 1 || strongCount >= 1) classification = 'Contextual';
    else classification = 'Limited';
    if (challengeCount >= 4 && classification !== 'Limited') classification = 'Contextual';

    const narrative = classification === 'Strong'
      ? 'The natal chart shows recurring, well-connected signatures between accumulated resources, long-term assets and restructuring/consolidation houses.'
      : classification === 'Moderate'
      ? 'The natal chart shows a meaningful but partial signature for wealth protection and consolidation themes.'
      : classification === 'Contextual'
      ? 'The natal chart shows limited, isolated signatures relevant to wealth protection and consolidation.'
      : 'The natal chart does not show a strong recurring signature for wealth protection and consolidation themes.';

    return { second, eleventh, eighth, fourth, ninth, twelfth, relationships, connectedCount, jupiter, venus, mercury, saturn, moon, sun, mars, d2, classification, narrative };
  };

  // Section 11 — D2/Hora confirmation. Reuses vargaPosition() only; gracefully
  // degrades if chart data unavailable. Never a standalone timing mechanism.
  NS.assessD2Confirmation = function () {
    const chart = NS.getChartData();
    if (!chart) return { available: false, level: 'Mixed', evidence: ['Chart data unavailable.'], rule: ruleById('WEALTHPROTECTION-D2-001') };
    const ascD2 = vargaPosition(chart.ascendant.longitude, 'D2');
    const jupiterPlanet = chart.planets.find(p => p.name === 'Jupiter');
    const jupiterD2 = jupiterPlanet ? vargaPosition(jupiterPlanet.longitude, 'D2') : null;
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    const jupDignity = jupiterD2 ? detailedDignity('Jupiter', jupiterD2.sign, normalizeDegrees(jupiterD2.longitude) % 30).tier : 'Neutral';
    const supportive = jupiterD2 && (strong.includes(jupDignity) || jupiterD2.sign === ascD2.sign);
    return { available: true, level: supportive ? 'Supports' : 'Mixed', evidence: [`D2 ascendant sign: ${ascD2.sign}.`, jupiterD2 ? `Jupiter in D2: ${jupiterD2.sign} (${jupDignity}).` : 'Jupiter D2 position unavailable.'], rule: ruleById('WEALTHPROTECTION-D2-001') };
  };

  // Section 12 — Shadbala support, only when state.shadbala actually exists.
  NS.assessShadbalaSupport = function () {
    if (!state.shadbala) return { available: false };
    const relevant = ['Jupiter', 'Venus', 'Mercury', 'Saturn', 'Moon', 'Sun'];
    const details = relevant.map(name => {
      const entry = state.shadbala[name] || (Array.isArray(state.shadbala) ? state.shadbala.find(s => s.name === name) : null);
      return entry ? { planet: name, data: entry } : null;
    }).filter(Boolean);
    if (!details.length) return { available: false };
    return { available: true, details, evidence: ['Shadbala support considered for Jupiter/Venus/Mercury/Saturn/Moon/Sun.'], rule: ruleById('WEALTHPROTECTION-SHADBALA-001') };
  };

  // Section 13 — Ashtakavarga support, only when state.ashtakvarga actually exists.
  NS.assessAshtakavargaSupport = function () {
    if (!state.ashtakvarga) return { available: false };
    const relevantHouses = [2, 4, 8, 9, 11, 12];
    return { available: true, houses: relevantHouses, evidence: ['Ashtakavarga bindu strength of 2nd/4th/8th/9th/11th/12th considered as supporting confirmation.'], rule: ruleById('WEALTHPROTECTION-ASHTAKAVARGA-001') };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  // Section 14 — reusable dasha-period evaluator: evaluateWealthProtectionDashaPeriod(md, ad, pd, chart).
  NS.evaluateWealthProtectionDashaPeriod = function (mdLord, adLord, pdLord) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    function factorsFor(lordName) {
      if (!lordName) return { relevant: false, factors: [], activatedHouses: [], activatedPrimary: [], activatedSupporting: [] };
      const owned = planetHouseOwnership(lordName, ascSignIndex);
      const p = NS.getPlanetSnapshot(lordName);
      const factors = []; const activatedHouses = [];
      owned.forEach(h => { if (PRIMARY_HOUSES.includes(h) || SUPPORTING_HOUSES.includes(h)) { activatedHouses.push(h); factors.push(`${lordName} owns house ${h}.`); } });
      if ((PRIMARY_HOUSES.includes(p.house) || SUPPORTING_HOUSES.includes(p.house)) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
      const activatedPrimary = activatedHouses.filter(h => PRIMARY_HOUSES.includes(h));
      const activatedSupporting = activatedHouses.filter(h => SUPPORTING_HOUSES.includes(h));
      return { relevant: activatedHouses.length > 0, factors, activatedHouses, activatedPrimary, activatedSupporting, dignityTier: p.dignityTier, naturalSignificatorRole: naturalSignificatorRole(lordName) };
    }
    const md = factorsFor(mdLord), ad = factorsFor(adLord), pd = factorsFor(pdLord);
    return { mahadasha: Object.assign({ lord: mdLord }, md), antardasha: Object.assign({ lord: adLord }, ad), pratyantardasha: Object.assign({ lord: pdLord }, pd) };
  };

  function naturalSignificatorRole(name) {
    const roles = { Jupiter: 'wealth continuity / expansion', Venus: 'material resources / comfort', Mercury: 'documentation / accounts', Saturn: 'preservation / discipline / liabilities', Moon: 'liquidity / household resources', Sun: 'authority / ownership', Mars: 'property / restructuring action', Rahu: 'unconventional restructuring (contextual)', Ketu: 'detachment / simplification (contextual)' };
    return roles[name] || null;
  }

  // Section 15 — stage-sensitive classification from activated-house pattern.
  // Section 4 — maps to event types too.
  NS.classifyEventStageAndType = function (activatedHouses) {
    const has = (h) => activatedHouses.includes(h);
    const stages = []; const types = [];
    if (has(2) && has(11)) { stages.push('Consolidation'); types.push('assetConsolidation', 'accumulationToPreservation'); }
    if (has(2) && has(4)) { stages.push('Asset Reorganization'); types.push('assetConsolidation'); }
    if (has(2) && has(8)) { stages.push('Ownership/Structure Review'); types.push('ownershipRestructuring'); }
    if (has(2) && has(12)) { stages.push('Simplification'); types.push('financialSimplification'); }
    if (has(6) && has(2)) { stages.push('Liability Rebalancing'); types.push('liabilityAssetBalancing'); }
    if (has(8) && has(9)) { stages.push('Legacy Preparation'); types.push('legacyPreparation'); }
    if (has(8) && has(11)) { stages.push('Asset Reorganization'); types.push('financialReorganization'); }
    if (has(9) && !has(8) && !stages.length) { stages.push('Legacy Preparation'); types.push('legacyPreparation'); }
    if (has(3)) { stages.push('Documentation'); types.push('nominationDocumentation'); }
    if (has(7)) { stages.push('Ownership/Structure Review'); types.push('familyAssetOrganization'); }
    if (has(1) || has(5)) stages.push('Planning');
    if (has(10)) stages.push('Financial Review');
    if (!stages.length) { stages.push('Mixed / Transitional'); types.push('wealthPreservation'); }
    if (!types.length) types.push('wealthPreservation');
    const uniqueStages = Array.from(new Set(stages));
    const uniqueTypes = Array.from(new Set(types));
    return { stages: uniqueStages, eventTypes: uniqueTypes.map(t => ({ key: t, label: EVENT_TYPES[t] })) };
  };

  NS.buildActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const dashaEval = NS.evaluateWealthProtectionDashaPeriod(md.lord, ad.lord, null);
        if (!dashaEval.mahadasha.relevant && !dashaEval.antardasha.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const full = NS.evaluateWealthProtectionDashaPeriod(md.lord, ad.lord, pd.lord);
          const reasons = [];
          if (full.mahadasha.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${full.mahadasha.factors.join(' ')}`);
          if (full.antardasha.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${full.antardasha.factors.join(' ')}`);
          if (full.pratyantardasha.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${full.pratyantardasha.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(full.mahadasha.activatedHouses, full.antardasha.activatedHouses, full.pratyantardasha.activatedHouses)));
          const activatedPrimary = activatedHouses.filter(h => PRIMARY_HOUSES.includes(h));
          const matchCount = [full.mahadasha.relevant, full.antardasha.relevant, full.pratyantardasha.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, activatedPrimary, matchCount, reasons, dashaDetail: full });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // Section 16/17 — transit analysis. Jupiter/Saturn primary; Rahu/Ketu/Mars/Venus/
  // Mercury/Sun/Moon secondary/contextual. Reuses computeSingleLongitude + ASPECT_OFFSETS only.
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    function checkBody(name, houseSet, ruleId) {
      const signIdx = transitSignIndex(name); const house = ((signIdx - ascIndex + 12) % 12) + 1;
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default; const reasons = []; let active = false; const activatedHouses = [];
      houseSet.forEach(h => { const hd = NS.getHouseSnapshot(h); const targetSignIdx = SIGNS.indexOf(hd.sign);
        if (house === h) { active = true; activatedHouses.push(h); reasons.push(`Transiting ${name} is in the natal ${h}th house.`); }
        else if (offsets.some(o => (signIdx + (o - 1)) % 12 === targetSignIdx)) { active = true; activatedHouses.push(h); reasons.push(`Transiting ${name} aspects the natal ${h}th house.`); } });
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, activatedHouses, rule: ruleById(ruleId) };
    }
    const jupiter = checkBody('Jupiter', [2, 11, 4, 8, 9], 'WEALTHPROTECTION-TRANSIT-JUP');
    const saturn = checkBody('Saturn', [2, 6, 8, 12], 'WEALTHPROTECTION-TRANSIT-SAT');
    const convergence = jupiter.active && saturn.active;
    return { date, jupiter, saturn, convergence, convergenceRule: convergence ? ruleById('WEALTHPROTECTION-TRANSIT-CONV') : null };
  };

  // Section 29 — cross-module checks (descriptive only, never a recommendation).
  function windowsArrayFrom(result) {
    const raw = result && (result.candidateWindows || result.windows);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return [raw.primary, raw.secondary].filter(Boolean);
    return null;
  }
  NS.checkCrossModules = function (candidate) {
    const mods = [
      ['FinancialGainTiming', 'Financial Gain / Wealth Accumulation'], ['SalaryIncomeTiming', 'Salary / Income Increase'],
      ['MajorExpenditureTiming', 'Major Expenditure / Financial Commitment'], ['LoanDebtReliefTiming', 'Loan / Debt Relief'],
      ['PropertyTiming', 'Property Purchase'], ['PropertySaleTiming', 'Property Sale'], ['InheritanceLegacyTiming', 'Inheritance / Legacy'],
      ['InsuranceProtectionTiming', 'Insurance / Financial Protection'], ['RetirementTiming', 'Retirement']
    ];
    const hits = [];
    mods.forEach(([key, label]) => {
      if (window[key] && typeof window[key].refresh === 'function') {
        let result; try { result = window[key].refresh(); } catch (e) { result = null; }
        const windows = windowsArrayFrom(result);
        const overlap = windows && windows.find(w => w && w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
        if (overlap) hits.push(label);
      }
    });
    if (!hits.length) return null;
    return { overlapping: true, modules: hits, interpretation: `This period also overlaps ${hits.join(', ')} timing — descriptive overlap only, not a recommendation.`, rule: ruleById('WEALTHPROTECTION-CROSSCHECK-001') };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }

  // Section 18/19 — multi-factor convergence gate + candidate-window generation.
  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d2 = NS.assessD2Confirmation();
    const shadbala = NS.assessShadbalaSupport();
    const ashtakavarga = NS.assessAshtakavargaSupport();
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const d2Confirms = d2.level === 'Supports';
      // Convergence factors (Section 18): never let a single weak factor force the strongest classification.
      const factorFlags = [
        c.matchCount >= 3,
        transit.jupiter.active || transit.saturn.active,
        transit.convergence,
        d2Confirms,
        c.activatedPrimary.length >= 2
      ];
      const convergenceFactors = factorFlags.filter(Boolean).length;
      // Section 18 evidence hierarchy: Strong (dasha+natal+transit), Moderate (dasha+one supporting layer), Contextual (single layer).
      const evidence = convergenceFactors >= 4 ? 'Strong' : convergenceFactors >= 2 ? 'Moderate' : convergenceFactors >= 1 ? 'Contextual' : 'Limited';
      const stageType = NS.classifyEventStageAndType(c.activatedHouses);
      const crossCheck = NS.checkCrossModules(c);
      const cautions = ['Astrological timing interpretation only — not financial, investment, legal, tax or estate-planning advice.'];
      if (c.activatedHouses.includes(8)) cautions.push('8th-house activation here refers only to restructuring, shared resources, succession/legacy themes and transformation of ownership — never death, lifespan, or a fatal-event prediction.');
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      return Object.assign({}, c, { transit, d2, shadbala: shadbala.available ? shadbala : null, ashtakavarga: ashtakavarga.available ? ashtakavarga : null, evidence: { label: evidence }, convergenceFactors, stages: stageType.stages, eventTypes: stageType.eventTypes, crossCheck, cautions });
    }).filter(c => c.convergenceFactors >= 1);
    const merged = mergeAdjacent(evaluated).sort((a, b) => EVIDENCE_RANK[b.evidence.label] - EVIDENCE_RANK[a.evidence.label] || a.startDate - b.startDate);
    return { available: true, windows: merged };
  };

  // Section 22 — 10-step calculation trace sequence.
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Foundation (2nd/11th/8th/4th/9th/12th + supporting houses)', anchor: 'wealthprotection-sec-promise' },
    { id: 2, label: 'House Relationships (2↔11/2↔8/2↔4/2↔9/2↔12/4↔8/4↔11/6↔2/6↔11/8↔9/8↔11/9↔11/10↔2,11/12↔2,11)', anchor: 'wealthprotection-sec-relationships' },
    { id: 3, label: 'Natural Significators (Jupiter/Venus/Mercury/Saturn/Moon/Sun/Mars/Rahu-Ketu)', anchor: 'wealthprotection-sec-promise' },
    { id: 4, label: 'Dasha (MD/AD/PD house connections)', anchor: 'wealthprotection-sec-dasha' },
    { id: 5, label: 'Transit (Jupiter/Saturn primary; Rahu/Ketu/Mars/Venus/Mercury/Sun/Moon contextual)', anchor: 'wealthprotection-sec-windows' },
    { id: 6, label: 'D2 (Hora) Confirmation', anchor: 'wealthprotection-sec-divisional' },
    { id: 7, label: 'Shadbala/Ashtakavarga Supporting Evidence (if available)', anchor: 'wealthprotection-sec-divisional' },
    { id: 8, label: 'Convergence (why the period qualifies)', anchor: 'wealthprotection-sec-windows' },
    { id: 9, label: 'Event-Stage Mapping', anchor: 'wealthprotection-sec-windows' },
    { id: 10, label: 'Final Interpretation', anchor: 'wealthprotection-sec-windows' }
  ];

  NS.refresh = function (horizonYears, objective, assetContext, minEvidence) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5; const obj = objective || OBJECTIVES[0]; const ctx = assetContext || ASSET_CONTEXTS[0];
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.objective === obj && NS.cache.assetContext === ctx && NS.cache.minEvidence === minEvidence) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded; natal foundation (2nd/11th/8th/4th/9th/12th + supporting houses) analysed');
    const natalPromise = NS.evaluateWealthProtectionNatalPromise();
    log(calculationLog, '[02] House relationships evaluated: ' + natalPromise.connectedCount + ' of ' + natalPromise.relationships.length + ' qualifying connections found');
    log(calculationLog, '[03] Natural significators analysed (Jupiter/Venus/Mercury/Saturn/Moon/Sun/Mars)');
    log(calculationLog, '[04] Natal promise classified: ' + natalPromise.classification);
    const d2 = NS.assessD2Confirmation();
    log(calculationLog, '[05] D2 (Hora) confirmation computed: ' + d2.level);
    const shadbala = NS.assessShadbalaSupport();
    log(calculationLog, '[06] Shadbala support: ' + (shadbala.available ? 'available' : 'not available — omitted'));
    const ashtakavarga = NS.assessAshtakavargaSupport();
    log(calculationLog, '[07] Ashtakavarga support: ' + (ashtakavarga.available ? 'available' : 'not available — omitted'));

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[08] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        const dashaEval = NS.evaluateWealthProtectionDashaPeriod(md.lord, ad ? ad.lord : null, pd ? pd.lord : null);
        currentDasha = { mahadasha: Object.assign({ startDate: md.startDate, endDate: md.endDate }, dashaEval.mahadasha),
          antardasha: ad ? Object.assign({ startDate: ad.startDate, endDate: ad.endDate }, dashaEval.antardasha) : null,
          pratyantardasha: pd ? Object.assign({ startDate: pd.startDate, endDate: pd.endDate }, dashaEval.pratyantardasha) : null };
      }
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[09] Candidate wealth-protection windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minEvidence && minEvidence !== 'All') { const t = EVIDENCE_RANK[minEvidence] != null ? EVIDENCE_RANK[minEvidence] : 0; windows = windows.filter(w => EVIDENCE_RANK[w.evidence.label] >= t); }
    log(calculationLog, '[10] Final interpretation assembled for ' + windows.length + ' window(s) at minimum evidence "' + (minEvidence || 'All') + '"');

    const rulesUsedIds = new Set([
      'WEALTHPROTECTION-NATAL-002', 'WEALTHPROTECTION-NATAL-011', 'WEALTHPROTECTION-NATAL-008', 'WEALTHPROTECTION-NATAL-004', 'WEALTHPROTECTION-NATAL-009', 'WEALTHPROTECTION-NATAL-012',
      'WEALTHPROTECTION-SIGNIF-JUPITER', 'WEALTHPROTECTION-SIGNIF-VENUS', 'WEALTHPROTECTION-SIGNIF-MERCURY', 'WEALTHPROTECTION-SIGNIF-SATURN', 'WEALTHPROTECTION-SIGNIF-MOON', 'WEALTHPROTECTION-SIGNIF-SUN', 'WEALTHPROTECTION-SIGNIF-MARS',
      'WEALTHPROTECTION-D2-001', 'WEALTHPROTECTION-CONV-001', 'WEALTHPROTECTION-STAGE-001', 'WEALTHPROTECTION-NOINVEST-001', 'WEALTHPROTECTION-NODEATH-001', 'WEALTHPROTECTION-CROSSCHECK-001'
    ]);
    natalPromise.relationships.forEach(r => { if (r.connected && r.rule) rulesUsedIds.add(r.rule.id); });
    if (shadbala.available) rulesUsedIds.add('WEALTHPROTECTION-SHADBALA-001');
    if (ashtakavarga.available) rulesUsedIds.add('WEALTHPROTECTION-ASHTAKAVARGA-001');
    if (windowsResult.available) { rulesUsedIds.add('WEALTHPROTECTION-DASHA-001'); rulesUsedIds.add('WEALTHPROTECTION-TRANSIT-JUP'); rulesUsedIds.add('WEALTHPROTECTION-TRANSIT-SAT'); if (windows.some(w => w.transit && w.transit.convergence)) rulesUsedIds.add('WEALTHPROTECTION-TRANSIT-CONV'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, d2, shadbala, ashtakavarga, currentDasha, candidateWindows: windows, horizonYears: horizon, objective: obj, assetContext: ctx, minEvidence: minEvidence || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing, disclaimer: 'This is an astrological timing interpretation for informational purposes only. It is not financial, investment, legal, tax or estate-planning advice. Actual financial decisions should be based on appropriate professional advice and your own circumstances.' };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, objective: obj, assetContext: ctx, minEvidence, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
