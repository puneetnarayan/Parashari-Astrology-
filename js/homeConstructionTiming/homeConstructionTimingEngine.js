/* =========================================================
   HOME CONSTRUCTION / RENOVATION TIMING — pure calculation engine.
   Parashari/Vimshottari method only. Reuses this app's existing
   chart/dignity/aspect/dasha/D4-divisional-chart/transit calculations
   throughout — same architecture as the prior timing modules.
   Explicitly distinct from Property Purchase (acquisition), Property
   Sale (disposal), and Relocation (movement): this module covers
   construction/renovation/extension/reconstruction/completion.
   Exposed only as window.HomeConstructionTiming (namespaced). UI code
   lives entirely in homeConstructionTimingUI.js.
   ========================================================= */

window.HomeConstructionTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const CONSTRUCTION_HOUSES = [2, 3, 4, 6, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 4, 'Supportive': 3, 'Moderately Supportive': 2, 'Mixed': 1, 'Conditional': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[HomeConstructionTiming]', text); }
  function ruleById(id) { return (window.HOME_CONSTRUCTION_TIMING_RULES || []).find(r => r.id === id); }

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

  // D4 — reused directly via vargaPosition(), same architecture as Property Purchase/Sale Timing.
  NS.getD4 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD4 = vargaPosition(chart.ascendant.longitude, 'D4');
    const ascD4SignIndex = SIGNS.indexOf(ascD4.sign);
    const d4LagnaLord = SIGN_LORD[ascD4.sign];
    function houseSign(h) { return SIGNS[(ascD4SignIndex + h - 1) % 12]; }
    const planets = chart.planets.map(p => {
      const d4 = vargaPosition(p.longitude, 'D4');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d4DegreeInSign = normalizeDegrees(d4.longitude) % 30;
      const d4Dignity = isClassical ? detailedDignity(p.name, d4.sign, d4DegreeInSign).tier : 'Neutral';
      const d4House = ((SIGNS.indexOf(d4.sign) - ascD4SignIndex + 12) % 12) + 1;
      return { name: p.name, d4Sign: d4.sign, d4House, d4Dignity };
    });
    return { ascendantSign: ascD4.sign, lagnaLord: d4LagnaLord, fourthSign: houseSign(4), fourthLord: SIGN_LORD[houseSign(4)], tenthSign: houseSign(10), tenthLord: SIGN_LORD[houseSign(10)], eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)], available: true, planets };
  };

  NS.assessD4Confirmation = function () {
    const d4 = NS.getD4();
    if (!d4) return { available: false, level: 'Does Not Materially Confirm', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('HC-D4-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d4.planets.find(p => p.name === name); return x ? x.d4Dignity : 'Neutral'; }
    let points = 0; const evidence = [];
    if (strong.includes(dig(d4.fourthLord))) { points += 2; evidence.push(`D4 4th lord (${d4.fourthLord}) is ${dig(d4.fourthLord)} in D4.`); }
    if (strong.includes(dig(d4.tenthLord))) { points += 1; evidence.push(`D4 10th lord (${d4.tenthLord}) is ${dig(d4.tenthLord)} in D4.`); }
    if (strong.includes(dig(d4.eleventhLord))) { points += 1; evidence.push(`D4 11th lord (${d4.eleventhLord}) is ${dig(d4.eleventhLord)} in D4.`); }
    if (strong.includes(dig(d4.lagnaLord))) { points += 1; evidence.push(`D4 Lagna lord (${d4.lagnaLord}) is ${dig(d4.lagnaLord)} in D4.`); }
    if (!evidence.length) evidence.push('No strong D4 confirmation factors found for the construction axis (4th/10th/11th/Lagna lords).');
    const level = points >= 4 ? 'Supports' : points >= 2 ? 'Moderately Supports' : points >= 1 ? 'Mixed' : 'Does Not Materially Confirm';
    return { available: true, d4, points, level, evidence, rule: ruleById('HC-D4-001') };
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

  NS.assessNatalConstructionPotential = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'HC-NATAL-002'), third = classifyHouse(3, 'HC-NATAL-003'), fourth = classifyHouse(4, 'HC-NATAL-004'),
      sixth = classifyHouse(6, 'HC-NATAL-006'), eighth = classifyHouse(8, 'HC-NATAL-008'), ninth = classifyHouse(9, 'HC-NATAL-009'),
      tenth = classifyHouse(10, 'HC-NATAL-010'), eleventh = classifyHouse(11, 'HC-NATAL-011'), twelfth = classifyHouse(12, 'HC-NATAL-012');
    const mars = classifyKaraka('Mars', 'HC-SIGNIF-MARS', 4), venus = classifyKaraka('Venus', 'HC-SIGNIF-VENUS', 4), moon = classifyKaraka('Moon', 'HC-SIGNIF-MOON', 4),
      saturn = classifyKaraka('Saturn', 'HC-SIGNIF-SATURN', 4), jupiter = classifyKaraka('Jupiter', 'HC-SIGNIF-JUPITER', 11), mercury = classifyKaraka('Mercury', 'HC-SIGNIF-MERCURY', 3), sun = classifyKaraka('Sun', 'HC-SIGNIF-SUN', 10);

    const secondH = NS.getHouseSnapshot(2), thirdH = NS.getHouseSnapshot(3), fourthH = NS.getHouseSnapshot(4), sixthH = NS.getHouseSnapshot(6),
      eighthH = NS.getHouseSnapshot(8), ninthH = NS.getHouseSnapshot(9), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'HC-HOUSE-4-2', a: fourthH, b: secondH }, { id: 'HC-HOUSE-4-11', a: fourthH, b: eleventhH },
      { id: 'HC-HOUSE-4-10', a: fourthH, b: tenthH }, { id: 'HC-HOUSE-4-3', a: fourthH, b: thirdH },
      { id: 'HC-HOUSE-4-9', a: fourthH, b: ninthH }, { id: 'HC-HOUSE-4-6', a: fourthH, b: sixthH },
      { id: 'HC-HOUSE-4-12', a: fourthH, b: twelfthH }, { id: 'HC-HOUSE-2-11', a: secondH, b: eleventhH },
      { id: 'HC-HOUSE-2-10', a: secondH, b: tenthH }, { id: 'HC-HOUSE-10-11', a: tenthH, b: eleventhH },
      { id: 'HC-HOUSE-3-10', a: thirdH, b: tenthH }, { id: 'HC-HOUSE-6-10', a: sixthH, b: tenthH }
    ];
    const relationships = pairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });

    const transformPairs = [
      { id: 'HC-HOUSE-4-8', a: fourthH, b: eighthH }, { id: 'HC-HOUSE-8-10', a: eighthH, b: tenthH }, { id: 'HC-HOUSE-8-11', a: eighthH, b: eleventhH }
    ];
    const transformRelationships = transformPairs.map(pair => { const rel = housesConnected(pair.a, pair.b, chart); return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how }; });

    const connectedCount = relationships.filter(r => r.connected).length;
    const transformConnectedCount = transformRelationships.filter(r => r.connected).length;
    const potential = connectedCount >= 5 ? 'Strongly Supported' : connectedCount >= 3 ? 'Supported' : connectedCount === 2 ? 'Mixed' : connectedCount === 1 ? 'Delayed / Conditional' : 'Requires Careful Interpretation';
    const reasons = [`4th house: ${fourth.result} (${fourth.sign}, lord ${fourth.lord}).`, `${connectedCount} of ${relationships.length} home-construction house-relationship signatures connected.`, `Mars: ${mars.result}, Saturn: ${saturn.result}, Jupiter: ${jupiter.result}.`];

    return { secondHouse: second, thirdHouse: third, fourthHouse: fourth, sixthHouse: sixth, eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      mars, venus, moon, saturn, jupiter, mercury, sun, relationships, transformRelationships, connectedCount, transformConnectedCount, potential, reasons };
  };

  function planetHouseOwnership(name, ascSignIndex) { const houses = []; for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); } return houses; }

  NS.constructionFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = []; const activatedHouses = owned.slice();
    if (CONSTRUCTION_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => CONSTRUCTION_HOUSES.includes(h)).join(', ')}.`);
    if (CONSTRUCTION_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const fourth = NS.getHouseSnapshot(4), tenth = NS.getHouseSnapshot(10), eleventh = NS.getHouseSnapshot(11);
    if (lordName === fourth.lord) factors.push(`${lordName} is the 4th lord.`);
    if (lordName === tenth.lord) factors.push(`${lordName} is the 10th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    const d4 = NS.getD4();
    const d4Confirmation = d4 ? (() => { const pD4 = d4.planets.find(x => x.name === lordName); return [4, 10, 11].includes(pD4.d4House) || [d4.fourthLord, d4.tenthLord, d4.eleventhLord].includes(lordName); })() : false;
    if (d4Confirmation) factors.push(`${lordName} is connected to the D4 construction axis.`);
    return { relevant: factors.length > 0, factors, activatedHouses, d4Confirmation };
  };

  NS.buildConstructionActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.constructionFactorsForLord(md.lord), adFactors = NS.constructionFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.constructionFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const d4Confirmation = mdFactors.d4Confirmation || adFactors.d4Confirmation || pdFactors.d4Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, d4Confirmation, matchCount, reasons, lordsInvolved: [md.lord, ad.lord, pd.lord] });
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
    return { date, jupiter: checkBody('Jupiter', [2, 4, 10, 11], 'HC-TRANSIT-JUP'), saturn: checkBody('Saturn', [4, 10], 'HC-TRANSIT-SAT'),
      mars: checkBody('Mars', [4, 10], 'HC-TRANSIT-MARS'), venus: checkBody('Venus', [4, 10, 11], 'HC-TRANSIT-VENUS-MOON'), moon: checkBody('Moon', [4, 10], 'HC-TRANSIT-VENUS-MOON'),
      rahu: checkBody('Rahu', [4, 10], 'HC-TRANSIT-NODES'), ketu: checkBody('Ketu', [4, 10], 'HC-TRANSIT-NODES') };
  };

  NS.classifyStage = function (candidate, transit) {
    const h = candidate.activatedHouses;
    const second = h.includes(2), third = h.includes(3), sixth = h.includes(6), eighth = h.includes(8), ninth = h.includes(9), tenth = h.includes(10), eleventh = h.includes(11), twelfth = h.includes(12);
    if (third && !tenth) return { label: 'Planning', rule: ruleById('HC-STAGE-001') };
    if (second && !tenth) return { label: 'Financial Preparation', rule: ruleById('HC-STAGE-001') };
    if (ninth && third && !tenth) return { label: 'Approval/Documentation', rule: ruleById('HC-STAGE-001') };
    if (tenth && third && !eleventh) return { label: 'Ground-Breaking/Foundation', rule: ruleById('HC-STAGE-001') };
    if (tenth && candidate.d4Confirmation && !eleventh) return { label: 'Construction Commencement', rule: ruleById('HC-STAGE-001') };
    if (eighth && tenth) return { label: 'Major Construction Milestone', rule: ruleById('HC-STAGE-001') };
    if (sixth && tenth && !eleventh) return { label: 'Construction Resumption After Delay', rule: ruleById('HC-STAGE-001') };
    if (tenth && eleventh && (transit.jupiter.active || transit.saturn.active)) return { label: 'Completion', rule: ruleById('HC-STAGE-001') };
    if (eleventh && (transit.venus.active || transit.moon.active)) return { label: 'Possession/First Use', rule: ruleById('HC-STAGE-001') };
    if (twelfth && tenth) return { label: 'Renovation/Extension', rule: ruleById('HC-STAGE-001') };
    return { label: 'Mixed/Uncertain', rule: ruleById('HC-STAGE-001') };
  };

  NS.classifyEventType = function (candidate, stage) {
    const h = candidate.activatedHouses;
    const eighth = h.includes(8), eleventh = h.includes(11), tenth = h.includes(10), sixth = h.includes(6);
    if (eighth && tenth) return 'Reconstruction';
    if (stage.label === 'Completion') return 'Completion';
    if (stage.label === 'Possession/First Use') return 'Possession / First Use';
    if (stage.label === 'Construction Resumption After Delay') return 'Delayed Construction Resumption';
    if (stage.label === 'Ground-Breaking/Foundation') return 'Foundation / Ground-Breaking';
    if (stage.label === 'Major Construction Milestone') return 'Construction Milestone';
    if (sixth && tenth && !eleventh) return 'Major Repair / Restoration';
    if (tenth && !eleventh) return 'Construction Start';
    return 'Other Major Property Improvement';
  };

  NS.checkDelayObstruction = function (candidate) {
    const h = candidate.activatedHouses;
    const cautions = [];
    if (h.includes(6)) cautions.push('6th-house activation present — additional coordination may be indicated.');
    if (h.includes(8)) cautions.push('8th-house activation present — hidden/structural factors may extend the project timeline.');
    if (h.includes(12) && !h.includes(11)) cautions.push('12th-house activation without 11th support — completion may extend beyond the initial window.');
    return cautions;
  };

  NS.checkPurchaseCrossCheck = function (candidate) {
    if (!window.PropertyTiming || !window.PropertyTiming.refresh) return null;
    const result = window.PropertyTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Construction-related timing overlaps with a property acquisition window.', rule: ruleById('HC-PURCHASE-CROSSCHECK-001') };
  };

  NS.checkSaleCrossCheck = function (candidate) {
    if (!window.PropertySaleTiming || !window.PropertySaleTiming.refresh) return null;
    const result = window.PropertySaleTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Construction timing overlaps with a property-disposal/restructuring period; interpretation should consider the actual property involved.', rule: ruleById('HC-SALE-CROSSCHECK-001') };
  };

  NS.checkRelocationTheme = function (candidate) {
    const h = candidate.activatedHouses;
    const present = [h.includes(4), h.includes(12), h.includes(3) || h.includes(9)].filter(Boolean).length >= 2;
    if (!present) return null;
    return { present: true, interpretation: 'Construction timing overlaps with a residence-change window — relocation is never inferred to be certain.', rule: ruleById('HC-RELOCATION-CROSSCHECK-001') };
  };

  NS.checkLoanCrossCheck = function (candidate) {
    if (!window.LoanDebtReliefTiming || !window.LoanDebtReliefTiming.refresh) return null;
    const result = window.LoanDebtReliefTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Construction timing overlaps with a loan/debt-related period.', rule: ruleById('HC-LOAN-CROSSCHECK-001') };
  };

  NS.checkFinancialCrossCheck = function (candidate) {
    if (!window.FinancialGainTiming || !window.FinancialGainTiming.refresh) return null;
    const result = window.FinancialGainTiming.refresh();
    if (!result || !result.candidateWindows) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return { overlapping: true, interpretation: 'Construction timing overlaps with a broader financial-resource window.', rule: ruleById('HC-FINANCIAL-CROSSCHECK-001') };
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
    const activationMap = NS.buildConstructionActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyStage(c, transit);
      const eventType = NS.classifyEventType(c, stage);
      const purchaseCrossCheck = NS.checkPurchaseCrossCheck(c);
      const saleCrossCheck = NS.checkSaleCrossCheck(c);
      const relocationTheme = NS.checkRelocationTheme(c);
      const loanCrossCheck = NS.checkLoanCrossCheck(c);
      const financialCrossCheck = NS.checkFinancialCrossCheck(c);
      const delayObstruction = NS.checkDelayObstruction(c);
      const convergenceFactors = [c.d4Confirmation, transit.jupiter.active, transit.saturn.active, transit.mars.active, c.matchCount >= 3, c.activatedHouses.includes(4) && c.activatedHouses.includes(10)].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('HC-STRENGTH-001') };
      const cautions = delayObstruction.slice();
      if (!transit.jupiter.active && !transit.saturn.active && !transit.mars.active) cautions.push('No qualifying Jupiter/Saturn/Mars transit activation found for this window midpoint.');
      if ((transit.rahu.active || transit.ketu.active) && convergenceFactors < 3) cautions.push('Rahu/Ketu activation present, but this alone is not sufficient for a construction window.');
      return Object.assign({}, c, { transit, stage, eventType, purchaseCrossCheck, saleCrossCheck, relocationTheme, loanCrossCheck, financialCrossCheck, convergenceFactors, qualification, strength, cautions });
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
    function houseActivated(h) { const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean); return lords.some(l => NS.constructionFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d4 = NS.assessD4Confirmation();
    return { eventDate, eventType, inRange: true, mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      fourthActivation: houseActivated(4), tenthActivation: houseActivated(10), eleventhActivation: houseActivated(11),
      d4Level: d4.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active };
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Relevant Houses (4th/2nd/10th/11th + supporting)', anchor: 'hc-sec-promise' },
    { id: 2, label: 'House Lords', anchor: 'hc-sec-promise' }, { id: 3, label: 'Natal Property/Construction Promise', anchor: 'hc-sec-promise' },
    { id: 4, label: 'D4 Confirmation', anchor: 'hc-sec-d4' }, { id: 5, label: 'Dasha (MD/AD/PD)', anchor: 'hc-sec-dasha' },
    { id: 6, label: 'Transit (Jupiter/Saturn/Mars/Venus/Moon/Rahu/Ketu)', anchor: 'hc-sec-windows' }, { id: 7, label: 'Convergence', anchor: 'hc-sec-windows' },
    { id: 8, label: 'Event Stage', anchor: 'hc-sec-windows' }
  ];

  NS.refresh = function (horizonYears) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalConstructionPotential();
    log(calculationLog, '[02] 2nd/3rd/4th/6th/8th/9th/10th/11th/12th houses and Mars/Venus/Moon/Saturn/Jupiter/Mercury/Sun analysed');
    log(calculationLog, '[03] Natal Home Construction/Renovation Potential: ' + natalPromise.potential);
    const d4 = NS.assessD4Confirmation();
    log(calculationLog, '[04] D4 (Chaturthamsha) construction confirmation computed: ' + d4.level);

    const missing = []; let windowsResult = { available: false, windows: [] }; let currentDasha = null;
    if (!state.dasha || !state.dasha.length) { missing.push('Vimshottari Dasha'); } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx]; const aIdx = findCurrentIndex(md.antardashas); const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null; if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = { mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.constructionFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.constructionFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.constructionFactorsForLord(pd.lord) } : null };
      }
      log(calculationLog, '[06] Home Construction Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate construction windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['HC-NATAL-002', 'HC-NATAL-003', 'HC-NATAL-004', 'HC-NATAL-006', 'HC-NATAL-008', 'HC-NATAL-009', 'HC-NATAL-010', 'HC-NATAL-011', 'HC-NATAL-012',
      'HC-SIGNIF-MARS', 'HC-SIGNIF-VENUS', 'HC-SIGNIF-MOON', 'HC-SIGNIF-SATURN', 'HC-SIGNIF-JUPITER', 'HC-SIGNIF-MERCURY', 'HC-SIGNIF-SUN',
      'HC-HOUSE-4-2', 'HC-HOUSE-4-11', 'HC-HOUSE-4-10', 'HC-HOUSE-4-3', 'HC-HOUSE-4-9', 'HC-HOUSE-4-6', 'HC-HOUSE-4-12', 'HC-HOUSE-2-11', 'HC-HOUSE-2-10', 'HC-HOUSE-10-11', 'HC-HOUSE-3-10', 'HC-HOUSE-6-10',
      'HC-HOUSE-4-8', 'HC-HOUSE-8-10', 'HC-HOUSE-8-11', 'HC-D4-001', 'HC-NATAL-PROMISE-001', 'HC-DELAY-001', 'HC-NOGUARANTEE-001']);
    if (windowsResult.available) { ['HC-DASHA-001', 'HC-TRANSIT-JUP', 'HC-TRANSIT-SAT', 'HC-TRANSIT-MARS', 'HC-TRANSIT-VENUS-MOON', 'HC-TRANSIT-NODES', 'HC-STAGE-001', 'HC-PURCHASE-CROSSCHECK-001', 'HC-SALE-CROSSCHECK-001', 'HC-RELOCATION-CROSSCHECK-001', 'HC-LOAN-CROSSCHECK-001', 'HC-FINANCIAL-CROSSCHECK-001', 'HC-STRENGTH-001'].forEach(id => rulesUsedIds.add(id)); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = { natalPromise, d4Confirmation: d4, currentDasha, candidateWindows: windowsResult.windows, horizonYears: horizon, calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
