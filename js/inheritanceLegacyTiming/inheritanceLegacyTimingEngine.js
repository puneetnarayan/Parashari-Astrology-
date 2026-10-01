/* =========================================================
   INHERITANCE / LEGACY TIMING — pure calculation engine. Parashari/
   Vimshottari method only. Reuses chart/dignity/aspect/dasha/D4/
   transit calculations throughout. This module focuses strictly on
   asset/succession developments — it NEVER predicts death, lifespan,
   or infers when a relative will die.
   Exposed only as window.InheritanceLegacyTiming (namespaced).
   ========================================================= */

window.InheritanceLegacyTiming = (function () {
  const NS = {};
  NS.debug = false; NS.initialized = false; NS.cache = null;
  const INHERIT_HOUSES = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 4, 'Supportive': 3, 'Moderately Supportive': 2, 'Mixed': 1, 'Conditional': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[InheritanceLegacyTiming]', text); }
  function ruleById(id) { return (window.INHERITANCE_LEGACY_TIMING_RULES || []).find(r => r.id === id); }

  NS.getChartData = function () { return state.chart || null; };
  NS.getPlanetSnapshot = function (name) {
    const chart = NS.getChartData(); if (!chart) return null;
    const p = chart.planets.find(pl => pl.name === name); if (!p) return null;
    const isClassical = SHADBALA_PLANETS.includes(name);
    const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral' };
    return { name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude, house: Number(p.house), dignityTier: dignity.tier, conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || [] };
  };
  NS.getHouseSnapshot = function (houseNum) {
    const chart = NS.getChartData(); if (!chart) return null;
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const signIndex = (ascSignIndex + houseNum - 1) % 12;
    const sign = SIGNS[signIndex]; const lord = SIGN_LORD[sign];
    const occupants = chart.planets.filter(p => Number(p.house) === houseNum).map(p => p.name);
    const aspectingHere = chart.planets.filter(p => { const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default; const fromIdx = SIGNS.indexOf(p.sign); return offsets.some(o => (fromIdx + (o - 1)) % 12 === signIndex); }).map(p => p.name);
    return { house: houseNum, sign, lord, occupants, aspectingHere };
  };

  NS.getD4 = function () {
    const chart = NS.getChartData(); if (!chart) return null;
    const ascD4 = vargaPosition(chart.ascendant.longitude, 'D4');
    const ascD4SignIndex = SIGNS.indexOf(ascD4.sign); const d4LagnaLord = SIGN_LORD[ascD4.sign];
    function houseSign(h) { return SIGNS[(ascD4SignIndex + h - 1) % 12]; }
    const planets = chart.planets.map(p => { const d4 = vargaPosition(p.longitude, 'D4'); const isClassical = SHADBALA_PLANETS.includes(p.name); const d4DegreeInSign = normalizeDegrees(d4.longitude) % 30; const d4Dignity = isClassical ? detailedDignity(p.name, d4.sign, d4DegreeInSign).tier : 'Neutral'; const d4House = ((SIGNS.indexOf(d4.sign) - ascD4SignIndex + 12) % 12) + 1; return { name: p.name, d4Sign: d4.sign, d4House, d4Dignity }; });
    return { ascendantSign: ascD4.sign, lagnaLord: d4LagnaLord, fourthSign: houseSign(4), fourthLord: SIGN_LORD[houseSign(4)], eighthSign: houseSign(8), eighthLord: SIGN_LORD[houseSign(8)], eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)], secondSign: houseSign(2), secondLord: SIGN_LORD[houseSign(2)], available: true, planets };
  };

  NS.assessD4Confirmation = function () {
    const d4 = NS.getD4();
    if (!d4) return { available: false, level: 'Does Not Materially Confirm', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('INHERIT-D4-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d4.planets.find(p => p.name === name); return x ? x.d4Dignity : 'Neutral'; }
    let points = 0; const evidence = [];
    if (strong.includes(dig(d4.fourthLord))) { points += 2; evidence.push(`D4 4th lord (${d4.fourthLord}) is ${dig(d4.fourthLord)} in D4.`); }
    if (strong.includes(dig(d4.eighthLord))) { points += 1; evidence.push(`D4 8th lord (${d4.eighthLord}) is ${dig(d4.eighthLord)} in D4.`); }
    if (strong.includes(dig(d4.eleventhLord))) { points += 1; evidence.push(`D4 11th lord (${d4.eleventhLord}) is ${dig(d4.eleventhLord)} in D4.`); }
    if (strong.includes(dig(d4.secondLord))) { points += 1; evidence.push(`D4 2nd lord (${d4.secondLord}) is ${dig(d4.secondLord)} in D4.`); }
    if (!evidence.length) evidence.push('No strong D4 confirmation factors found for the inherited-property axis (4th/8th/11th/2nd lords).');
    const level = points >= 4 ? 'Supports' : points >= 2 ? 'Moderately Supports' : points >= 1 ? 'Mixed' : 'Does Not Materially Confirm';
    return { available: true, d4, points, level, evidence, rule: ruleById('INHERIT-D4-001') };
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

  NS.assessNatalInheritancePotential = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'INHERIT-NATAL-002'), third = classifyHouse(3, 'INHERIT-NATAL-003'), fourth = classifyHouse(4, 'INHERIT-NATAL-004'),
      fifth = classifyHouse(5, 'INHERIT-NATAL-005'), sixth = classifyHouse(6, 'INHERIT-NATAL-006'), seventh = classifyHouse(7, 'INHERIT-NATAL-007'),
      eighth = classifyHouse(8, 'INHERIT-NATAL-008'), ninth = classifyHouse(9, 'INHERIT-NATAL-009'), tenth = classifyHouse(10, 'INHERIT-NATAL-010'),
      eleventh = classifyHouse(11, 'INHERIT-NATAL-011'), twelfth = classifyHouse(12, 'INHERIT-NATAL-012');
    const jupiter = classifyKaraka('Jupiter', 'INHERIT-SIGNIF-JUPITER', 8), saturn = classifyKaraka('Saturn', 'INHERIT-SIGNIF-SATURN', 8), moon = classifyKaraka('Moon', 'INHERIT-SIGNIF-MOON', 4),
      venus = classifyKaraka('Venus', 'INHERIT-SIGNIF-VENUS', 4), mercury = classifyKaraka('Mercury', 'INHERIT-SIGNIF-MERCURY', 3), sun = classifyKaraka('Sun', 'INHERIT-SIGNIF-SUN', 9), mars = classifyKaraka('Mars', 'INHERIT-SIGNIF-MARS', 4);

    const secondH = NS.getHouseSnapshot(2), fourthH = NS.getHouseSnapshot(4), fifthH = NS.getHouseSnapshot(5), sixthH = NS.getHouseSnapshot(6),
      eighthH = NS.getHouseSnapshot(8), ninthH = NS.getHouseSnapshot(9), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12), thirdH = NS.getHouseSnapshot(3);

    const pairs = [
      { id: 'INHERIT-HOUSE-2-8', a: secondH, b: eighthH }, { id: 'INHERIT-HOUSE-8-11', a: eighthH, b: eleventhH }, { id: 'INHERIT-HOUSE-2-11', a: secondH, b: eleventhH },
      { id: 'INHERIT-HOUSE-4-8', a: fourthH, b: eighthH }, { id: 'INHERIT-HOUSE-4-11', a: fourthH, b: eleventhH }, { id: 'INHERIT-HOUSE-8-6', a: eighthH, b: sixthH },
      { id: 'INHERIT-HOUSE-8-9', a: eighthH, b: ninthH }, { id: 'INHERIT-HOUSE-8-12', a: eighthH, b: twelfthH }, { id: 'INHERIT-HOUSE-5-8', a: fifthH, b: eighthH }, { id: 'INHERIT-HOUSE-5-11', a: fifthH, b: eleventhH }
    ];
    const relationships = pairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });

    const conv_4_8_11 = [relationships.find(r => r.houseA === 4 && r.houseB === 8).connected, relationships.find(r => r.houseA === 8 && r.houseB === 11).connected, relationships.find(r => r.houseA === 4 && r.houseB === 11).connected].filter(Boolean).length >= 2;
    const conv_2_4_8 = [relationships.find(r => r.houseA === 2 && r.houseB === 8).connected, relationships.find(r => r.houseA === 4 && r.houseB === 8).connected, housesConnected(secondH, fourthH, chart).connected].filter(Boolean).length >= 2;
    const conv_3_8_10 = [housesConnected(thirdH, eighthH, chart).connected, housesConnected(eighthH, tenthH, chart).connected, housesConnected(thirdH, tenthH, chart).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('INHERIT-CONV-4-8-11'), present: conv_4_8_11, evidence: `4th/8th/11th convergence: ${conv_4_8_11 ? 'present' : 'not present'}.` },
      { rule: ruleById('INHERIT-CONV-2-4-8'), present: conv_2_4_8, evidence: `2nd/4th/8th convergence: ${conv_2_4_8 ? 'present' : 'not present'}.` },
      { rule: ruleById('INHERIT-CONV-3-8-10'), present: conv_3_8_10, evidence: `3rd/8th/10th convergence: ${conv_3_8_10 ? 'present' : 'not present'}.` }
    ];

    const connectedCount = relationships.filter(r => r.connected).length;
    const potential = connectedCount >= 4 ? 'Clearly Present' : connectedCount >= 2 ? 'Present' : connectedCount === 1 ? 'Mixed' : 'Limited Evidence';
    const reasons = [`8th house: ${eighth.result} (${eighth.sign}, lord ${eighth.lord}).`, `${connectedCount} of ${relationships.length} inheritance house-relationship signatures connected.`, `Jupiter: ${jupiter.result}, Saturn: ${saturn.result}.`];

    return { secondHouse: second, thirdHouse: third, fourthHouse: fourth, fifthHouse: fifth, sixthHouse: sixth, seventhHouse: seventh, eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      jupiter, saturn, moon, venus, mercury, sun, mars, relationships, convergenceSignatures, connectedCount, potential, reasons };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.inheritanceFactorsForLord = function (lordName) {
    const chart = NS.getChartData(); const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex); const p = NS.getPlanetSnapshot(lordName);
    const factors = []; const activatedHouses = owned.slice();
    if (INHERIT_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => INHERIT_HOUSES.includes(h)).join(', ')}.`);
    if (INHERIT_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const eighth = NS.getHouseSnapshot(8), second = NS.getHouseSnapshot(2), eleventh = NS.getHouseSnapshot(11);
    if (lordName === eighth.lord) factors.push(`${lordName} is the 8th lord.`);
    if (lordName === second.lord) factors.push(`${lordName} is the 2nd lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    const d4 = NS.getD4();
    const d4Confirmation = d4 ? (() => { const pD4 = d4.planets.find(x => x.name === lordName); return [4, 8, 11, 2].includes(pD4.d4House) || [d4.fourthLord, d4.eighthLord, d4.eleventhLord, d4.secondLord].includes(lordName); })() : false;
    if (d4Confirmation) factors.push(`${lordName} is connected to the D4 inherited-property axis.`);
    return { relevant: factors.length > 0, factors, activatedHouses, d4Confirmation };
  };

  NS.buildInheritanceActivationMap = function (horizonYears) {
    const dasha = state.dasha; if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => { if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => { if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.inheritanceFactorsForLord(md.lord), adFactors = NS.inheritanceFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => { if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.inheritanceFactorsForLord(pd.lord); const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const d4Confirmation = mdFactors.d4Confirmation || adFactors.d4Confirmation || pdFactors.d4Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, d4Confirmation, matchCount, reasons, lordsInvolved: [md.lord, ad.lord, pd.lord] }); }); }); });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData(); const ascIndex = SIGNS.indexOf(chart.ascendant.sign); const eighthLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(8).lord);
    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    function checkBody(name, houseSet, ruleId) {
      const signIdx = transitSignIndex(name); const house = ((signIdx - ascIndex + 12) % 12) + 1;
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default; const reasons = []; let active = false;
      houseSet.forEach(h => { const hd = NS.getHouseSnapshot(h); const targetSignIdx = SIGNS.indexOf(hd.sign);
        if (house === h) { active = true; reasons.push(`Transiting ${name} is in the natal ${h}th house.`); }
        else if (offsets.some(o => (signIdx + (o - 1)) % 12 === targetSignIdx)) { active = true; reasons.push(`Transiting ${name} aspects the natal ${h}th house.`); } });
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === eighthLordNatal.signIndex) || signIdx === eighthLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 8th lord's sign (${eighthLordNatal.sign}).`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return { date, jupiter: checkBody('Jupiter', [2, 4, 8, 9, 11], 'INHERIT-TRANSIT-JUP'), saturn: checkBody('Saturn', [2, 4, 8, 11, 12], 'INHERIT-TRANSIT-SAT'), rahu: checkBody('Rahu', [8, 12], 'INHERIT-TRANSIT-NODES'), ketu: checkBody('Ketu', [8, 12], 'INHERIT-TRANSIT-NODES') };
  };

  NS.classifyEvent = function (candidate) {
    const h = candidate.activatedHouses;
    const second = h.includes(2), third = h.includes(3), fourth = h.includes(4), sixth = h.includes(6), eighth = h.includes(8), ninth = h.includes(9), tenth = h.includes(10), eleventh = h.includes(11), twelfth = h.includes(12);
    if (eighth && sixth && (ninth || tenth)) return { label: 'Legal/Succession Process', rule: ruleById('INHERIT-EVENT-001') };
    if (third && eighth && tenth) return { label: 'Documentation / Registration', rule: ruleById('INHERIT-EVENT-001') };
    if (fourth && eighth && eleventh) return { label: 'Property Transfer', rule: ruleById('INHERIT-EVENT-001') };
    if (second && eighth && eleventh) return { label: 'Financial Asset Transfer', rule: ruleById('INHERIT-EVENT-001') };
    if (eighth && twelfth && eleventh) return { label: 'Settlement / Distribution', rule: ruleById('INHERIT-EVENT-001') };
    if (eighth && eleventh && !twelfth) return { label: 'Receipt / Realization', rule: ruleById('INHERIT-EVENT-001') };
    if (fourth && twelfth) return { label: 'Inherited Property Sale', rule: ruleById('INHERIT-EVENT-001') };
    if (second && (ninth || tenth)) return { label: 'Legacy Planning', rule: ruleById('INHERIT-EVENT-001') };
    if (eighth) return { label: 'Family Succession Discussion', rule: ruleById('INHERIT-EVENT-001') };
    return { label: 'Mixed Inheritance Development', rule: ruleById('INHERIT-EVENT-001') };
  };

  NS.checkPropertyCrossCheck = function (candidate) {
    const mods = [{ mod: window.PropertyTiming, label: 'Property Purchase Timing' }, { mod: window.PropertySaleTiming, label: 'Property Sale Timing' }];
    for (const { mod, label } of mods) {
      if (!mod) continue;
      const result = mod.refresh(); if (!result || !result.candidateWindows) continue;
      const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
      if (overlapping) return { overlapping: true, sourceModule: label, interpretation: 'Inherited-property indicators overlap with the property timing analysis.', rule: ruleById('INHERIT-PROPERTY-CROSSCHECK-001') };
    }
    return null;
  };
  NS.checkFinancialCrossCheck = function (candidate) {
    if (!window.FinancialGainTiming) return null;
    const result = window.FinancialGainTiming.refresh(); if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Inheritance-related asset realization overlaps with financial-gain indicators — no amount is predicted or guaranteed.', rule: ruleById('INHERIT-FINANCIAL-CROSSCHECK-001') };
  };
  NS.checkLegalCrossCheck = function (candidate) {
    if (!window.LegalMatterTiming) return null;
    const result = window.LegalMatterTiming.refresh(); if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Inheritance-related legal/procedural indicators are also activated — no legal advice is provided.', rule: ruleById('INHERIT-LEGAL-CROSSCHECK-001') };
  };

  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate); const merged = [];
    sorted.forEach(c => { const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) { last.endDate = c.endDate; last.members.push(c); }
      else merged.push(Object.assign({}, c, { members: [c] })); });
    return merged;
  }
  function assessWindowStrength(f) { if (f >= 5) return 'Strongly Supportive'; if (f >= 4) return 'Supportive'; if (f >= 3) return 'Moderately Supportive'; if (f >= 2) return 'Mixed'; return 'Conditional'; }

  NS.buildCandidateWindows = function (horizonYears, assetContext) {
    const activationMap = NS.buildInheritanceActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const event = NS.classifyEvent(c);
      const propertyCrossCheck = NS.checkPropertyCrossCheck(c);
      const financialCrossCheck = NS.checkFinancialCrossCheck(c);
      const legalCrossCheck = NS.checkLegalCrossCheck(c);
      const convergenceFactors = [c.d4Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3, c.activatedHouses.includes(8) && c.activatedHouses.includes(11)].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('INHERIT-STRENGTH-001') };
      const cautions = [];
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      if ((transit.rahu.active || transit.ketu.active) && convergenceFactors < 3) cautions.push('Rahu/Ketu activation present, but this alone is not sufficient for an inheritance window.');
      return Object.assign({}, c, { transit, event, propertyCrossCheck, financialCrossCheck, legalCrossCheck, convergenceFactors, qualification, strength, cautions, assetContext: assetContext || 'General' });
    }).filter(c => c.qualification !== 'weak');
    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  NS.validateHistoricalDate = function (eventDate, eventType) {
    const chart = NS.getChartData(); if (!chart || !state.dasha || !state.dasha.length) return null;
    const mdIdx = findCurrentIndex(state.dasha, eventDate); if (mdIdx < 0) return { eventDate, eventType, inRange: false };
    const md = state.dasha[mdIdx]; const adIdx = findCurrentIndex(md.antardashas, eventDate); const ad = adIdx >= 0 ? md.antardashas[adIdx] : null;
    let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pdIdx = findCurrentIndex(pds, eventDate); pd = pdIdx >= 0 ? pds[pdIdx] : null; }
    function activated(lordName) { return lordName ? NS.inheritanceFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.inheritanceFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate); const d4 = NS.assessD4Confirmation();
    return { eventDate, eventType, inRange: true, mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      eighthActivation: houseActivated(8), eleventhActivation: houseActivated(11), fourthActivation: houseActivated(4), secondActivation: lords.some(activated),
      d4Level: d4.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Inheritance Factors (2nd/3rd/4th/5th/6th/8th/9th/10th/11th/12th)', anchor: 'inherit-sec-promise' },
    { id: 2, label: 'Dasha (MD/AD/PD)', anchor: 'inherit-sec-dasha' }, { id: 3, label: 'D4 Confirmation', anchor: 'inherit-sec-d4' },
    { id: 4, label: 'Transit (Jupiter/Saturn/Rahu/Ketu)', anchor: 'inherit-sec-windows' }, { id: 5, label: 'Related Events', anchor: 'inherit-sec-windows' },
    { id: 6, label: 'Event Classification', anchor: 'inherit-sec-windows' }, { id: 7, label: 'Final Window', anchor: 'inherit-sec-windows' }
  ];

  NS.refresh = function (horizonYears, assetContext, minSupport, stageFilter) {
    const chart = NS.getChartData(); const horizon = horizonYears || 5; const context = assetContext || 'General';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.assetContext === context && NS.cache.minSupport === minSupport && NS.cache.stageFilter === stageFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalInheritancePotential();
    log(calculationLog, '[02] 2nd/3rd/4th/5th/6th/8th/9th/10th/11th/12th houses and Jupiter/Saturn/Moon/Venus/Mercury/Sun/Mars analysed');
    log(calculationLog, '[03] Natal Inheritance / Legacy Indicators: ' + natalPromise.potential);
    const d4 = NS.assessD4Confirmation();
    log(calculationLog, '[04] D4 (Chaturthamsha) inherited-property confirmation computed: ' + d4.level);
    log(calculationLog, '[05] This module never calculates death dates, lifespan, or mortality probability.');

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[06] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.inheritanceFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.inheritanceFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.inheritanceFactorsForLord(pd.lord) } : null };
      }
      log(calculationLog, '[07] Inheritance Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon, context);
      log(calculationLog, '[08] Candidate inheritance windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minSupport && minSupport !== 'All') { const t = SUPPORT_RANK[minSupport] != null ? SUPPORT_RANK[minSupport] : 0; windows = windows.filter(w => SUPPORT_RANK[w.strength.label] >= t); }
    if (stageFilter && stageFilter !== 'All') { windows = windows.filter(w => w.event.label === stageFilter); }

    const rulesUsedIds = new Set(['INHERIT-NATAL-002', 'INHERIT-NATAL-003', 'INHERIT-NATAL-004', 'INHERIT-NATAL-005', 'INHERIT-NATAL-006', 'INHERIT-NATAL-007', 'INHERIT-NATAL-008', 'INHERIT-NATAL-009', 'INHERIT-NATAL-010', 'INHERIT-NATAL-011', 'INHERIT-NATAL-012', 'INHERIT-SIGNIF-JUPITER', 'INHERIT-SIGNIF-SATURN', 'INHERIT-SIGNIF-MOON', 'INHERIT-SIGNIF-VENUS', 'INHERIT-SIGNIF-MERCURY', 'INHERIT-SIGNIF-SUN', 'INHERIT-SIGNIF-MARS', 'INHERIT-HOUSE-2-8', 'INHERIT-HOUSE-8-11', 'INHERIT-HOUSE-2-11', 'INHERIT-HOUSE-4-8', 'INHERIT-HOUSE-4-11', 'INHERIT-CONV-4-8-11', 'INHERIT-HOUSE-8-6', 'INHERIT-HOUSE-8-9', 'INHERIT-HOUSE-8-12', 'INHERIT-HOUSE-5-8', 'INHERIT-HOUSE-5-11', 'INHERIT-CONV-2-4-8', 'INHERIT-CONV-3-8-10', 'INHERIT-D4-001', 'INHERIT-NODEATH-001', 'INHERIT-NOGUARANTEE-001']);
    if (windowsResult.available) { rulesUsedIds.add('INHERIT-DASHA-001'); rulesUsedIds.add('INHERIT-TRANSIT-JUP'); rulesUsedIds.add('INHERIT-TRANSIT-SAT'); rulesUsedIds.add('INHERIT-TRANSIT-NODES'); rulesUsedIds.add('INHERIT-EVENT-001'); rulesUsedIds.add('INHERIT-PROPERTY-CROSSCHECK-001'); rulesUsedIds.add('INHERIT-FINANCIAL-CROSSCHECK-001'); rulesUsedIds.add('INHERIT-LEGAL-CROSSCHECK-001'); rulesUsedIds.add('INHERIT-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, d4Confirmation: d4, currentDasha, candidateWindows: windows, horizonYears: horizon, assetContext: context, minSupport: minSupport || 'All', stageFilter: stageFilter || 'All', calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, assetContext: context, minSupport, stageFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
