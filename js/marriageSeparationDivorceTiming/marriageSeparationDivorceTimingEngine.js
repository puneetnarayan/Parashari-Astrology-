/* =========================================================
   MARRIAGE SEPARATION / DIVORCE TIMING — pure calculation engine.
   Parashari/Vimshottari method only. Reuses chart/dignity/aspect/
   dasha/D9/transit calculations throughout. This is a SENSITIVE
   relationship-timing module providing astrological timing
   indicators only — never a divorce predictor, never a guarantee of
   any outcome, never spouse-character inference.
   Exposed only as window.MarriageSeparationDivorceTiming.
   ========================================================= */

window.MarriageSeparationDivorceTiming = (function () {
  const NS = {};
  NS.debug = false; NS.initialized = false; NS.cache = null;
  const REL_HOUSES = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 4, 'Supportive': 3, 'Moderately Supportive': 2, 'Mixed': 1, 'Conditional': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[MarriageSeparationDivorceTiming]', text); }
  function ruleById(id) { return (window.MARRIAGE_SEPARATION_DIVORCE_TIMING_RULES || []).find(r => r.id === id); }

  NS.getChartData = function () { return state.chart || null; };
  NS.getPlanetSnapshot = function (name) {
    const chart = NS.getChartData(); if (!chart) return null;
    const p = chart.planets.find(pl => pl.name === name); if (!p) return null;
    const isClassical = SHADBALA_PLANETS.includes(name); const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral' };
    return { name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude, house: Number(p.house), dignityTier: dignity.tier, conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || [] };
  };
  NS.getHouseSnapshot = function (houseNum) {
    const chart = NS.getChartData(); if (!chart) return null;
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign); const signIndex = (ascSignIndex + houseNum - 1) % 12;
    const sign = SIGNS[signIndex]; const lord = SIGN_LORD[sign];
    const occupants = chart.planets.filter(p => Number(p.house) === houseNum).map(p => p.name);
    const aspectingHere = chart.planets.filter(p => { const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default; const fromIdx = SIGNS.indexOf(p.sign); return offsets.some(o => (fromIdx + (o - 1)) % 12 === signIndex); }).map(p => p.name);
    return { house: houseNum, sign, lord, occupants, aspectingHere };
  };

  // D9 — reuse vargaPosition() directly, the same engine Marriage Timing/Matching already use.
  NS.getD9 = function () {
    const chart = NS.getChartData(); if (!chart) return null;
    const ascD9 = vargaPosition(chart.ascendant.longitude, 'D9'); const ascD9SignIndex = SIGNS.indexOf(ascD9.sign);
    const seventhD9Sign = SIGNS[(ascD9SignIndex + 6) % 12];
    const planets = chart.planets.map(p => { const d9 = vargaPosition(p.longitude, 'D9'); const isClassical = SHADBALA_PLANETS.includes(p.name); const d9DegreeInSign = normalizeDegrees(d9.longitude) % 30; const d9Dignity = isClassical ? detailedDignity(p.name, d9.sign, d9DegreeInSign).tier : 'Neutral'; const d9House = ((SIGNS.indexOf(d9.sign) - ascD9SignIndex + 12) % 12) + 1; return { name: p.name, d9Sign: d9.sign, d9House, d9Dignity }; });
    return { ascendantSign: ascD9.sign, seventhSign: seventhD9Sign, seventhLord: SIGN_LORD[seventhD9Sign], available: true, planets };
  };

  NS.assessD9Confirmation = function () {
    const d9 = NS.getD9();
    if (!d9) return { available: false, level: 'Does Not Materially Confirm', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('MARR-SEP-D9-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d9.planets.find(p => p.name === name); return x ? x.d9Dignity : 'Neutral'; }
    let points = 0; const evidence = [];
    if (strong.includes(dig(d9.seventhLord))) { points += 2; evidence.push(`D9 7th lord (${d9.seventhLord}) is ${dig(d9.seventhLord)} in D9.`); } else { evidence.push(`D9 7th lord (${d9.seventhLord}) is ${dig(d9.seventhLord)} in D9 — a challenging D9 7th-lord condition supports restructuring/separation themes rather than continuity.`); }
    if (strong.includes(dig('Venus'))) { points += 2; evidence.push(`Venus is ${dig('Venus')} in D9 — supports continuity.`); } else if (['Debilitated'].includes(dig('Venus'))) { evidence.push('Venus is debilitated in D9 — supports restructuring themes.'); }
    if (strong.includes(dig('Jupiter'))) { points += 1; evidence.push(`Jupiter is ${dig('Jupiter')} in D9.`); }
    const separationOriented = !strong.includes(dig(d9.seventhLord)) && !strong.includes(dig('Venus'));
    const level = separationOriented ? (points >= 1 ? 'Mixed' : 'Supports separation/restructuring') : points >= 3 ? 'Supports marital continuity' : 'Mixed';
    return { available: true, d9, points, level, evidence, separationOriented, rule: ruleById('MARR-SEP-D9-001') };
  };

  function classifyHouse(houseNum, ruleId) {
    const chart = NS.getChartData(); const h = NS.getHouseSnapshot(houseNum);
    const lordP = chart.planets.find(p => p.name === h.lord); const isClassical = SHADBALA_PLANETS.includes(h.lord);
    const dignity = isClassical ? detailedDignity(h.lord, lordP.sign, normalizeDegrees(lordP.longitude) % 30).tier : 'Neutral';
    const beneficOccupants = h.occupants.filter(n => NATURAL_BENEFICS.includes(n)).length; const maleficOccupants = h.occupants.filter(n => !NATURAL_BENEFICS.includes(n)).length;
    const lordWellPlaced = KENDRA.includes(Number(lordP.house)) || TRIKONA.includes(Number(lordP.house)); const lordInDusthana = DUSTHANA.includes(Number(lordP.house));
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
    let result = strongDignity && !lordInDusthana && beneficOccupants >= maleficOccupants ? 'Strong' : lordInDusthana || dignity === 'Debilitated' || maleficOccupants > beneficOccupants ? 'Challenging' : lordWellPlaced || beneficOccupants > 0 ? 'Supporting' : 'Moderate';
    return { house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId), occupants: h.occupants, aspectingHere: h.aspectingHere,
      evidence: [`${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`, h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.', h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.'] };
  }
  function classifyKaraka(name, ruleId, refHouseNum) {
    const p = NS.getPlanetSnapshot(name); const refHouse = NS.getHouseSnapshot(refHouseNum);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier); const inDusthana = DUSTHANA.includes(p.house);
    const connected = p.house === refHouseNum || p.conjunctWith.includes(refHouse.lord) || p.aspectedBy.includes(refHouse.lord) || refHouse.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Neutral'; if (connected && result === 'Neutral') result = 'Supporting';
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

  NS.assessNatalIndicators = function () {
    const chart = NS.getChartData();
    const first = classifyHouse(1, 'MARR-SEP-NATAL-001'), second = classifyHouse(2, 'MARR-SEP-NATAL-002'), third = classifyHouse(3, 'MARR-SEP-NATAL-003'), fourth = classifyHouse(4, 'MARR-SEP-NATAL-004'),
      sixth = classifyHouse(6, 'MARR-SEP-NATAL-006'), seventh = classifyHouse(7, 'MARR-SEP-NATAL-007'), eighth = classifyHouse(8, 'MARR-SEP-NATAL-008'), ninth = classifyHouse(9, 'MARR-SEP-NATAL-009'),
      tenth = classifyHouse(10, 'MARR-SEP-NATAL-010'), eleventh = classifyHouse(11, 'MARR-SEP-NATAL-011'), twelfth = classifyHouse(12, 'MARR-SEP-NATAL-012');
    const venus = classifyKaraka('Venus', 'MARR-SEP-SIGNIF-VENUS', 7), jupiter = classifyKaraka('Jupiter', 'MARR-SEP-SIGNIF-JUPITER', 7), mars = classifyKaraka('Mars', 'MARR-SEP-SIGNIF-MARS', 7),
      saturn = classifyKaraka('Saturn', 'MARR-SEP-SIGNIF-SATURN', 12), moon = classifyKaraka('Moon', 'MARR-SEP-SIGNIF-MOON', 7), mercury = classifyKaraka('Mercury', 'MARR-SEP-SIGNIF-MERCURY', 7), sun = classifyKaraka('Sun', 'MARR-SEP-SIGNIF-SUN', 1);

    const firstH = NS.getHouseSnapshot(1), secondH = NS.getHouseSnapshot(2), fourthH = NS.getHouseSnapshot(4), sixthH = NS.getHouseSnapshot(6), seventhH = NS.getHouseSnapshot(7), eighthH = NS.getHouseSnapshot(8), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'MARR-SEP-HOUSE-7-12', a: seventhH, b: twelfthH }, { id: 'MARR-SEP-HOUSE-7-6', a: seventhH, b: sixthH },
      { id: 'MARR-SEP-HOUSE-7-8', a: seventhH, b: eighthH }, { id: 'MARR-SEP-HOUSE-7-2', a: seventhH, b: secondH },
      { id: 'MARR-SEP-HOUSE-7-11', a: seventhH, b: eleventhH }, { id: 'MARR-SEP-HOUSE-7-4', a: seventhH, b: fourthH }, { id: 'MARR-SEP-HOUSE-6-12', a: sixthH, b: twelfthH }
    ];
    const relationships = pairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });

    const conv_6_7_12 = [relationships.find(r => r.houseA === 7 && r.houseB === 6).connected, relationships.find(r => r.houseA === 7 && r.houseB === 12).connected, housesConnected(sixthH, twelfthH, chart).connected].filter(Boolean).length >= 2;
    const conv_6_7_9 = [relationships.find(r => r.houseA === 7 && r.houseB === 6).connected, housesConnected(sixthH, NS.getHouseSnapshot(9), chart).connected, housesConnected(seventhH, NS.getHouseSnapshot(9), chart).connected].filter(Boolean).length >= 2;
    const conv_7_8_12 = [relationships.find(r => r.houseA === 7 && r.houseB === 8).connected, relationships.find(r => r.houseA === 7 && r.houseB === 12).connected, housesConnected(eighthH, twelfthH, chart).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('MARR-SEP-CONV-6-7-12'), present: conv_6_7_12, evidence: `6th/7th/12th convergence: ${conv_6_7_12 ? 'present' : 'not present'}.` },
      { rule: ruleById('MARR-SEP-CONV-6-7-9'), present: conv_6_7_9, evidence: `6th/7th/9th convergence: ${conv_6_7_9 ? 'present' : 'not present'}.` },
      { rule: ruleById('MARR-SEP-CONV-7-8-12'), present: conv_7_8_12, evidence: `7th/8th/12th convergence: ${conv_7_8_12 ? 'present' : 'not present'}.` }
    ];

    const separationCount = relationships.filter(r => r.connected).length;
    const continuityFactors = [venus.result === 'Strong' || venus.result === 'Supporting', relationships.find(r => r.houseA === 7 && r.houseB === 11).connected, relationships.find(r => r.houseA === 7 && r.houseB === 2).connected, relationships.find(r => r.houseA === 7 && r.houseB === 4).connected].filter(Boolean).length;

    let overallState;
    if (continuityFactors >= 2 && separationCount <= 1) overallState = 'Strong Stability Indicators';
    else if (separationCount >= 3 && continuityFactors === 0) overallState = 'Separation/Restructuring Indicators Present';
    else if (separationCount === 0 && continuityFactors === 0) overallState = 'Limited Evidence';
    else overallState = 'Mixed Indicators';

    const reasons = [`7th house: ${seventh.result} (${seventh.sign}, lord ${seventh.lord}).`, `${separationCount} of ${relationships.length} separation-relevant signatures connected; ${continuityFactors} continuity-supporting factors present.`, `Venus: ${venus.result}, Saturn: ${saturn.result}.`];

    return { firstHouse: first, secondHouse: second, thirdHouse: third, fourthHouse: fourth, sixthHouse: sixth, seventhHouse: seventh, eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      venus, jupiter, mars, saturn, moon, mercury, sun, relationships, convergenceSignatures, separationCount, continuityFactors, overallState, reasons };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.relationshipFactorsForLord = function (lordName) {
    const chart = NS.getChartData(); const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex); const p = NS.getPlanetSnapshot(lordName);
    const factors = []; const activatedHouses = owned.slice();
    if (REL_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => REL_HOUSES.includes(h)).join(', ')}.`);
    if (REL_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const seventh = NS.getHouseSnapshot(7), twelfth = NS.getHouseSnapshot(12);
    if (lordName === seventh.lord) factors.push(`${lordName} is the 7th lord.`);
    if (lordName === twelfth.lord) factors.push(`${lordName} is the 12th lord.`);
    if (lordName === 'Venus') factors.push('Venus is the primary marriage significator.');
    const d9 = NS.getD9();
    const d9Confirmation = d9 ? (() => { const pD9 = d9.planets.find(x => x.name === lordName); return pD9.d9House === 7 || lordName === d9.seventhLord; })() : false;
    if (d9Confirmation) factors.push(`${lordName} is connected to the D9 relationship axis.`);
    return { relevant: factors.length > 0, factors, activatedHouses, d9Confirmation };
  };

  NS.buildActivationMap = function (horizonYears) {
    const dasha = state.dasha; if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => { if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => { if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.relationshipFactorsForLord(md.lord), adFactors = NS.relationshipFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => { if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.relationshipFactorsForLord(pd.lord); const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const d9Confirmation = mdFactors.d9Confirmation || adFactors.d9Confirmation || pdFactors.d9Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, d9Confirmation, matchCount, reasons, lordsInvolved: [md.lord, ad.lord, pd.lord] }); }); }); });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData(); const ascIndex = SIGNS.indexOf(chart.ascendant.sign); const seventhLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(7).lord);
    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    function checkBody(name, houseSet, ruleId) {
      const signIdx = transitSignIndex(name); const house = ((signIdx - ascIndex + 12) % 12) + 1;
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default; const reasons = []; let active = false;
      houseSet.forEach(h => { const hd = NS.getHouseSnapshot(h); const targetSignIdx = SIGNS.indexOf(hd.sign);
        if (house === h) { active = true; reasons.push(`Transiting ${name} is in the natal ${h}th house.`); }
        else if (offsets.some(o => (signIdx + (o - 1)) % 12 === targetSignIdx)) { active = true; reasons.push(`Transiting ${name} aspects the natal ${h}th house.`); } });
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === seventhLordNatal.signIndex) || signIdx === seventhLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 7th lord's sign (${seventhLordNatal.sign}).`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return { date, saturn: checkBody('Saturn', [2, 4, 6, 7, 8, 12], 'MARR-SEP-TRANSIT-SAT'), jupiter: checkBody('Jupiter', [2, 7, 8, 11], 'MARR-SEP-TRANSIT-JUP'), rahu: checkBody('Rahu', [7, 12], 'MARR-SEP-TRANSIT-NODES'), ketu: checkBody('Ketu', [7, 12], 'MARR-SEP-TRANSIT-NODES') };
  };

  NS.classifyStage = function (candidate, d9, transit, natalPromise) {
    const h = candidate.activatedHouses;
    const first = h.includes(1), second = h.includes(2), fourth = h.includes(4), sixth = h.includes(6), eighth = h.includes(8), ninth = h.includes(9), tenth = h.includes(10), eleventh = h.includes(11), twelfth = h.includes(12);
    const reconciliationStrong = second || fourth || eleventh;
    if (sixth && !twelfth && !eighth) return { label: 'Marital Tension', rule: ruleById('MARR-SEP-STAGE-001') };
    if (twelfth && !sixth && !eighth && !reconciliationStrong) return { label: 'Emotional Distance', rule: ruleById('MARR-SEP-STAGE-001') };
    if (twelfth && (transit.saturn.active) && !sixth) return { label: 'Physical Separation', rule: ruleById('MARR-SEP-STAGE-001') };
    if (twelfth && eighth && candidate.matchCount >= 3) return { label: 'Prolonged Separation', rule: ruleById('MARR-SEP-STAGE-001') };
    if (eighth && !twelfth) return { label: 'Relationship Restructuring', rule: ruleById('MARR-SEP-STAGE-001') };
    if (reconciliationStrong && !sixth && !twelfth) return { label: 'Reconciliation-Oriented Period', rule: ruleById('MARR-SEP-STAGE-001') };
    if (sixth && (ninth || tenth) && !twelfth) return { label: 'Legal Separation Process', rule: ruleById('MARR-SEP-STAGE-001') };
    if (sixth && twelfth && (ninth || tenth) && d9.separationOriented && candidate.matchCount >= 3) return { label: 'Divorce Proceedings', rule: ruleById('MARR-SEP-STAGE-001') };
    if (sixth && twelfth && eighth && d9.separationOriented && candidate.matchCount >= 3) return { label: 'Divorce/Order/Closure', rule: ruleById('MARR-SEP-STAGE-001') };
    if (first && twelfth && !sixth) return { label: 'Post-Separation Transition', rule: ruleById('MARR-SEP-STAGE-001') };
    return { label: 'Mixed Relationship Development', rule: ruleById('MARR-SEP-STAGE-001') };
  };

  NS.assessReconciliationIndicators = function (candidate, natalPromise, transit) {
    const h = candidate.activatedHouses;
    const factors = [];
    if (h.includes(7) && h.includes(11)) factors.push('7th/11th fulfilment context present.');
    if (h.includes(2)) factors.push('2nd-house family-continuity activation present.');
    if (h.includes(4)) factors.push('4th-house domestic-peace activation present.');
    if (natalPromise.venus.result === 'Strong' || natalPromise.venus.result === 'Supporting') factors.push('Venus condition supports relationship repair.');
    if (transit.jupiter.active) factors.push('Jupiter transit supports counsel/resolution.');
    if (!factors.length) return null;
    return { present: true, factors, interpretation: 'This period contains relationship-repair indicators alongside any existing conflict indicators.' };
  };

  NS.checkLegalCrossCheck = function (candidate) {
    if (!window.LegalMatterTiming) return null;
    const result = window.LegalMatterTiming.refresh(); if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Legal/procedural relationship factors are also activated — no legal advice is provided.', rule: ruleById('MARR-SEP-LEGAL-CROSSCHECK-001') };
  };
  NS.checkRelocationTheme = function (candidate) {
    const h = candidate.activatedHouses;
    const present = [h.includes(4), h.includes(12), h.includes(3) || h.includes(9)].filter(Boolean).length >= 2;
    if (!present) return null;
    return { present: true, interpretation: 'Relationship timing overlaps with relocation/distance indicators — this does not infer that the spouse will relocate or that relocation causes divorce.', rule: ruleById('MARR-SEP-RELOCATION-CROSSCHECK-001') };
  };
  NS.checkFinancialPropertyCrossCheck = function (candidate) {
    const mods = [{ mod: window.PropertySaleTiming, label: 'Property Sale Timing' }, { mod: window.PropertyTiming, label: 'Property Purchase Timing' }, { mod: window.FinancialGainTiming, label: 'Financial Gain Timing' }];
    for (const { mod, label } of mods) {
      if (!mod) continue;
      const result = mod.refresh(); if (!result || !result.candidateWindows) continue;
      const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
      if (overlapping) return { overlapping: true, sourceModule: label, interpretation: 'Financial/shared-asset themes overlap with the relationship timing — no legal entitlement or asset division is inferred.', rule: ruleById('MARR-SEP-FINANCIAL-CROSSCHECK-001') };
    }
    return null;
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }
  function assessWindowStrength(f) { if (f >= 5) return 'Strongly Supportive'; if (f >= 4) return 'Supportive'; if (f >= 3) return 'Moderately Supportive'; if (f >= 2) return 'Mixed'; return 'Conditional'; }

  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d9 = NS.assessD9Confirmation(); const natalPromise = NS.assessNatalIndicators();
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyStage(c, d9, transit, natalPromise);
      const reconciliation = NS.assessReconciliationIndicators(c, natalPromise, transit);
      const legalCrossCheck = NS.checkLegalCrossCheck(c);
      const relocationTheme = NS.checkRelocationTheme(c);
      const financialCrossCheck = NS.checkFinancialPropertyCrossCheck(c);
      const convergenceFactors = [c.d9Confirmation, transit.saturn.active, transit.jupiter.active, c.matchCount >= 3, c.activatedHouses.includes(7) && (c.activatedHouses.includes(12) || c.activatedHouses.includes(6))].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('MARR-SEP-STRENGTH-001') };
      const cautions = [];
      if (!transit.saturn.active && !transit.jupiter.active) cautions.push('Neither Saturn nor Jupiter transit shows qualifying activation for this window midpoint.');
      if ((transit.rahu.active || transit.ketu.active) && convergenceFactors < 3) cautions.push('Rahu/Ketu activation present, but this alone is not sufficient for a divorce-related window.');
      if ((stage.label === 'Divorce Proceedings' || stage.label === 'Divorce/Order/Closure') && convergenceFactors < 4) cautions.push('Divorce-stage classification requires strong multi-factor convergence; treat this period cautiously.');
      return Object.assign({}, c, { transit, stage, reconciliation, legalCrossCheck, relocationTheme, financialCrossCheck, convergenceFactors, qualification, strength, cautions });
    }).filter(c => c.qualification !== 'weak');
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  NS.validateHistoricalDate = function (eventDate, eventType) {
    const chart = NS.getChartData(); if (!chart || !state.dasha || !state.dasha.length) return null;
    const mdIdx = findCurrentIndex(state.dasha, eventDate); if (mdIdx < 0) return { eventDate, eventType, inRange: false };
    const md = state.dasha[mdIdx]; const adIdx = findCurrentIndex(md.antardashas, eventDate); const ad = adIdx >= 0 ? md.antardashas[adIdx] : null;
    let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pdIdx = findCurrentIndex(pds, eventDate); pd = pdIdx >= 0 ? pds[pdIdx] : null; }
    function activated(lordName) { return lordName ? NS.relationshipFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.relationshipFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate); const d9 = NS.assessD9Confirmation();
    return { eventDate, eventType, inRange: true, mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      seventhActivation: houseActivated(7), twelfthActivation: houseActivated(12), sixthActivation: houseActivated(6), eighthActivation: lords.some(activated),
      d9Level: d9.level, saturnActive: transit.saturn.active, jupiterActive: transit.jupiter.active };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Relationship Factors (7th/2nd/8th/12th/6th etc.)', anchor: 'msd-sec-promise' }, { id: 2, label: 'Venus / Natural Significators', anchor: 'msd-sec-promise' },
    { id: 3, label: 'Dasha (MD/AD/PD)', anchor: 'msd-sec-dasha' }, { id: 4, label: 'D9 Confirmation', anchor: 'msd-sec-d9' },
    { id: 5, label: 'Transit (Jupiter/Saturn/Rahu/Ketu)', anchor: 'msd-sec-windows' }, { id: 6, label: 'Related Events', anchor: 'msd-sec-windows' },
    { id: 7, label: 'Event Classification', anchor: 'msd-sec-windows' }, { id: 8, label: 'Final Candidate Window', anchor: 'msd-sec-windows' }
  ];

  NS.refresh = function (horizonYears, minSupport, stageFilter) {
    const chart = NS.getChartData(); const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.minSupport === minSupport && NS.cache.stageFilter === stageFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalIndicators();
    log(calculationLog, '[02] 1st/2nd/3rd/4th/6th/7th/8th/9th/10th/11th/12th houses and Venus/Jupiter/Mars/Saturn/Moon/Mercury/Sun analysed');
    log(calculationLog, '[03] Natal Marriage / Separation Indicators: ' + natalPromise.overallState);
    const d9 = NS.assessD9Confirmation();
    log(calculationLog, '[04] D9 (Navamsha) relationship confirmation computed: ' + d9.level);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.relationshipFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.relationshipFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.relationshipFactorsForLord(pd.lord) } : null };
      }
      log(calculationLog, '[06] Relationship-Timing Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate relationship-timing windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minSupport && minSupport !== 'All') { const t = SUPPORT_RANK[minSupport] != null ? SUPPORT_RANK[minSupport] : 0; windows = windows.filter(w => SUPPORT_RANK[w.strength.label] >= t); }
    if (stageFilter && stageFilter !== 'All') { windows = windows.filter(w => w.stage.label === stageFilter); }

    const rulesUsedIds = new Set(['MARR-SEP-NATAL-001', 'MARR-SEP-NATAL-002', 'MARR-SEP-NATAL-003', 'MARR-SEP-NATAL-004', 'MARR-SEP-NATAL-006', 'MARR-SEP-NATAL-007', 'MARR-SEP-NATAL-008', 'MARR-SEP-NATAL-009', 'MARR-SEP-NATAL-010', 'MARR-SEP-NATAL-011', 'MARR-SEP-NATAL-012', 'MARR-SEP-SIGNIF-VENUS', 'MARR-SEP-SIGNIF-JUPITER', 'MARR-SEP-SIGNIF-MARS', 'MARR-SEP-SIGNIF-SATURN', 'MARR-SEP-SIGNIF-MOON', 'MARR-SEP-SIGNIF-MERCURY', 'MARR-SEP-SIGNIF-SUN', 'MARR-SEP-SIGNIF-NODES', 'MARR-SEP-HOUSE-7-12', 'MARR-SEP-HOUSE-7-6', 'MARR-SEP-HOUSE-7-8', 'MARR-SEP-HOUSE-7-2', 'MARR-SEP-HOUSE-7-11', 'MARR-SEP-HOUSE-7-4', 'MARR-SEP-HOUSE-6-12', 'MARR-SEP-CONV-6-7-12', 'MARR-SEP-CONV-6-7-9', 'MARR-SEP-CONV-7-8-12', 'MARR-SEP-D9-001', 'MARR-SEP-D1D9-CONVERGENCE-001', 'MARR-SEP-NOAUTO-001', 'MARR-SEP-SAFETY-001']);
    if (windowsResult.available) { rulesUsedIds.add('MARR-SEP-DASHA-001'); rulesUsedIds.add('MARR-SEP-TRANSIT-SAT'); rulesUsedIds.add('MARR-SEP-TRANSIT-JUP'); rulesUsedIds.add('MARR-SEP-TRANSIT-NODES'); rulesUsedIds.add('MARR-SEP-STAGE-001'); rulesUsedIds.add('MARR-SEP-RECON-001'); rulesUsedIds.add('MARR-SEP-LEGAL-CROSSCHECK-001'); rulesUsedIds.add('MARR-SEP-RELOCATION-CROSSCHECK-001'); rulesUsedIds.add('MARR-SEP-FINANCIAL-CROSSCHECK-001'); rulesUsedIds.add('MARR-SEP-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, d9Confirmation: d9, currentDasha, candidateWindows: windows, horizonYears: horizon, minSupport: minSupport || 'All', stageFilter: stageFilter || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, minSupport, stageFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
