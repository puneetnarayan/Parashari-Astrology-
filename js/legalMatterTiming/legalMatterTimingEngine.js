/* =========================================================
   LEGAL MATTER RESOLUTION TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/aspect/dasha/transit calculations throughout — same
   architecture as the fifteen prior timing modules in this app. D10
   is deliberately NOT used (per the spec's explicit instruction —
   legal-matter timing is not a career/profession-timing question).
   This is a TIMING-ANALYSIS AND CLASSIFICATION TOOL ONLY. It never
   provides legal advice, determines legal rights, or predicts a
   court's decision as a certainty.
   Exposed only as window.LegalMatterTiming (namespaced). UI code
   lives entirely in legalMatterTimingUI.js — this file returns plain
   data only.
   ========================================================= */

window.LegalMatterTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, matterType, minSupport, stageFilter, result }

  const LEGAL_HOUSES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 4, 'Supportive': 3, 'Moderately Supportive': 2, 'Mixed': 1, 'Conditional': 0 };

  const MATTER_TYPE_HOUSES = {
    'General': [6, 7, 9, 10, 11],
    'Property': [4, 6, 8, 9, 11],
    'Family': [2, 4, 7, 8, 9, 11],
    'Financial': [2, 6, 8, 11, 12],
    'Employment': [6, 10, 11],
    'Business/Contract': [3, 6, 7, 10, 11],
    'Inheritance': [2, 8, 9, 11],
    'Administrative/Government': [9, 10, 11],
    'Other': [6, 7, 9, 10, 11]
  };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[LegalMatterTiming]', text); }
  function ruleById(id) { return (window.LEGAL_MATTER_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER — reused pattern from every prior timing module
  // ---------------------------------------------------------------
  NS.getChartData = function () { return state.chart || null; };

  NS.getPlanetSnapshot = function (name) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const p = chart.planets.find(pl => pl.name === name);
    if (!p) return null;
    const isClassical = SHADBALA_PLANETS.includes(name);
    const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral' };
    return {
      name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude,
      house: Number(p.house), dignityTier: dignity.tier,
      conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || []
    };
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

  // ---------------------------------------------------------------
  // 2. NATAL LEGAL-MATTER POTENTIAL
  // ---------------------------------------------------------------
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
    return {
      house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId),
      occupants: h.occupants, aspectingHere: h.aspectingHere,
      evidence: [
        `${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`,
        h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.',
        h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.'
      ]
    };
  }

  function classifyKaraka(name, ruleId, refHouseNum) {
    const p = NS.getPlanetSnapshot(name);
    const refHouse = NS.getHouseSnapshot(refHouseNum);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connected = p.house === refHouseNum || p.conjunctWith.includes(refHouse.lord) || p.aspectedBy.includes(refHouse.lord) || refHouse.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Neutral';
    if (connected && result === 'Neutral') result = 'Supporting';
    return {
      planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connected,
      evidence: [
        `${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`,
        p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.',
        p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.',
        `Connected to ${refHouseNum}th: ${connected ? 'Yes' : 'No'}.`
      ]
    };
  }

  function housesConnected(h1, h2, chart) {
    if (h1.lord === h2.lord) return { connected: true, how: `${h1.house}th and ${h2.house}th houses share the same lord (${h1.lord}).` };
    const l1 = chart.planets.find(p => p.name === h1.lord), l2 = chart.planets.find(p => p.name === h2.lord);
    if (l1.sign === l2.sign) return { connected: true, how: `${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord) are conjunct in ${l1.sign}.` };
    if ((l1.aspectedBy || []).includes(h2.lord) || (l2.aspectedBy || []).includes(h1.lord)) return { connected: true, how: `${h1.lord} and ${h2.lord} (${h1.house}th/${h2.house}th lords) aspect each other.` };
    if (SIGN_LORD[l1.sign] === h2.lord && SIGN_LORD[l2.sign] === h1.lord) return { connected: true, how: `${h1.lord} and ${h2.lord} are in mutual sign exchange (Parivartana).` };
    return { connected: false, how: `No conjunction, aspect, or exchange found between ${h1.lord} (${h1.house}th lord) and ${h2.lord} (${h2.house}th lord).` };
  }

  NS.assessNatalLegalMatterPotential = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'LEGAL-NATAL-002');
    const third = classifyHouse(3, 'LEGAL-NATAL-003');
    const fourth = classifyHouse(4, 'LEGAL-NATAL-004');
    const fifth = classifyHouse(5, 'LEGAL-NATAL-005');
    const sixth = classifyHouse(6, 'LEGAL-NATAL-006');
    const seventh = classifyHouse(7, 'LEGAL-NATAL-007');
    const eighth = classifyHouse(8, 'LEGAL-NATAL-008');
    const ninth = classifyHouse(9, 'LEGAL-NATAL-009');
    const tenth = classifyHouse(10, 'LEGAL-NATAL-010');
    const eleventh = classifyHouse(11, 'LEGAL-NATAL-011');
    const twelfth = classifyHouse(12, 'LEGAL-NATAL-012');

    const saturn = classifyKaraka('Saturn', 'LEGAL-SIGNIF-SATURN', 6);
    const jupiter = classifyKaraka('Jupiter', 'LEGAL-SIGNIF-JUPITER', 9);
    const mars = classifyKaraka('Mars', 'LEGAL-SIGNIF-MARS', 6);
    const mercury = classifyKaraka('Mercury', 'LEGAL-SIGNIF-MERCURY', 7);
    const venus = classifyKaraka('Venus', 'LEGAL-SIGNIF-VENUS', 7);
    const sun = classifyKaraka('Sun', 'LEGAL-SIGNIF-SUN', 10);
    const rahu = classifyKaraka('Rahu', 'LEGAL-SIGNIF-RAHU', 6);
    const ketu = classifyKaraka('Ketu', 'LEGAL-SIGNIF-KETU', 12);

    const thirdH = NS.getHouseSnapshot(3), fourthH = NS.getHouseSnapshot(4), sixthH = NS.getHouseSnapshot(6),
      seventhH = NS.getHouseSnapshot(7), eighthH = NS.getHouseSnapshot(8), ninthH = NS.getHouseSnapshot(9),
      tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12),
      secondH = NS.getHouseSnapshot(2);

    const pairs = [
      { id: 'LEGAL-HOUSE-6-7', a: sixthH, b: seventhH }, { id: 'LEGAL-HOUSE-6-9', a: sixthH, b: ninthH },
      { id: 'LEGAL-HOUSE-6-10', a: sixthH, b: tenthH }, { id: 'LEGAL-HOUSE-6-11', a: sixthH, b: eleventhH },
      { id: 'LEGAL-HOUSE-6-12', a: sixthH, b: twelfthH }, { id: 'LEGAL-HOUSE-7-9', a: seventhH, b: ninthH },
      { id: 'LEGAL-HOUSE-7-11', a: seventhH, b: eleventhH }, { id: 'LEGAL-HOUSE-8-9', a: eighthH, b: ninthH },
      { id: 'LEGAL-HOUSE-8-11', a: eighthH, b: eleventhH }, { id: 'LEGAL-HOUSE-9-10', a: ninthH, b: tenthH },
      { id: 'LEGAL-HOUSE-9-11', a: ninthH, b: eleventhH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const convergence_3_6_9 = [housesConnected(thirdH, sixthH, chart).connected, housesConnected(sixthH, ninthH, chart).connected,
      housesConnected(thirdH, ninthH, chart).connected].filter(Boolean).length >= 2;
    const convergence_4_6_8 = [housesConnected(fourthH, sixthH, chart).connected, housesConnected(sixthH, eighthH, chart).connected,
      housesConnected(fourthH, eighthH, chart).connected].filter(Boolean).length >= 2;
    const convergence_2_8_11 = [housesConnected(secondH, eighthH, chart).connected, housesConnected(eighthH, eleventhH, chart).connected,
      housesConnected(secondH, eleventhH, chart).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('LEGAL-HOUSE-3-6-9'), present: convergence_3_6_9, evidence: `3rd/6th/9th convergence: ${convergence_3_6_9 ? 'present' : 'not present'}.` },
      { rule: ruleById('LEGAL-PROPERTY-001'), present: convergence_4_6_8, evidence: `4th/6th/8th convergence (property dispute): ${convergence_4_6_8 ? 'present' : 'not present'}.` },
      { rule: ruleById('LEGAL-INHERITANCE-001'), present: convergence_2_8_11, evidence: `2nd/8th/11th convergence (inheritance/shared-asset): ${convergence_2_8_11 ? 'present' : 'not present'}.` }
    ];

    const connectedCount = relationships.filter(r => r.connected).length;
    let potential;
    if (connectedCount >= 4 && sixth.result !== 'Challenging') potential = 'Clearly Present';
    else if (connectedCount >= 2) potential = 'Present';
    else if (connectedCount === 1) potential = 'Mixed';
    else potential = 'Limited Evidence';

    const reasons = [
      `6th house: ${sixth.result} (${sixth.sign}, lord ${sixth.lord}).`,
      `9th house: ${ninth.result} (${ninth.sign}, lord ${ninth.lord}).`,
      `${connectedCount} of ${relationships.length} legal-house relationship signatures connected.`,
      `Saturn: ${saturn.result}, Jupiter: ${jupiter.result}, Mars: ${mars.result}.`
    ];

    return {
      secondHouse: second, thirdHouse: third, fourthHouse: fourth, fifthHouse: fifth, sixthHouse: sixth,
      seventhHouse: seventh, eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      saturn, jupiter, mars, mercury, venus, sun, rahu, ketu,
      relationships, convergenceSignatures, connectedCount, potential, reasons
    };
  };

  // ---------------------------------------------------------------
  // 3. VIMSHOTTARI DASHA — Legal-Matter Activation Map (matter-type
  //    aware: the selected matter type adjusts house emphasis only)
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.legalFactorsForLord = function (lordName, matterType) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const emphasisHouses = MATTER_TYPE_HOUSES[matterType] || MATTER_TYPE_HOUSES.General;
    const factors = [];
    const activatedHouses = owned.slice();
    if (LEGAL_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => LEGAL_HOUSES.includes(h)).join(', ')}.`);
    if (LEGAL_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const sixth = NS.getHouseSnapshot(6), ninth = NS.getHouseSnapshot(9);
    if (lordName === sixth.lord) factors.push(`${lordName} is the 6th lord.`);
    if (lordName === ninth.lord) factors.push(`${lordName} is the 9th lord.`);
    if (lordName === 'Saturn' || lordName === 'Jupiter') factors.push(`${lordName} is a natural legal-process significator.`);
    const emphasisMatch = activatedHouses.some(h => emphasisHouses.includes(h));
    if (emphasisMatch) factors.push(`${lordName} activates a house emphasized for ${matterType} matters.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, emphasisMatch };
  };

  NS.buildLegalActivationMap = function (horizonYears, matterType) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.legalFactorsForLord(md.lord, matterType);
        const adFactors = NS.legalFactorsForLord(ad.lord, matterType);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.legalFactorsForLord(pd.lord, matterType);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const emphasisMatch = mdFactors.emphasisMatch || adFactors.emphasisMatch || pdFactors.emphasisMatch;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, matchCount, emphasisMatch, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 4. TRANSIT — Jupiter/Saturn primary, Rahu/Ketu secondary only
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const ninthLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(9).lord);

    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    function checkBody(name, houseSet, ruleId) {
      const signIdx = transitSignIndex(name);
      const house = ((signIdx - ascIndex + 12) % 12) + 1;
      const offsets = ASPECT_OFFSETS[name] || ASPECT_OFFSETS.default;
      const reasons = [];
      let active = false;
      houseSet.forEach(h => {
        const hd = NS.getHouseSnapshot(h);
        const targetSignIdx = SIGNS.indexOf(hd.sign);
        if (house === h) { active = true; reasons.push(`Transiting ${name} is in the natal ${h}th house.`); }
        else if (offsets.some(o => (signIdx + (o - 1)) % 12 === targetSignIdx)) { active = true; reasons.push(`Transiting ${name} aspects the natal ${h}th house.`); }
      });
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === ninthLordNatal.signIndex) || signIdx === ninthLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 9th lord's sign (${ninthLordNatal.sign}).`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [6, 9, 10, 11], 'LEGAL-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [6, 8, 9, 10, 12], 'LEGAL-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [6, 12], 'LEGAL-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [6, 12], 'LEGAL-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 5. LEGAL STAGE CLASSIFICATION (Sections 4, 11, 16)
  // ---------------------------------------------------------------
  NS.classifyStage = function (candidate, transit) {
    const h = candidate.activatedHouses;
    const sixth = h.includes(6), seventh = h.includes(7), eighth = h.includes(8), ninth = h.includes(9),
      tenth = h.includes(10), eleventh = h.includes(11), twelfth = h.includes(12), third = h.includes(3);

    if (third && sixth && !ninth) return { label: 'Initiation', rule: ruleById('LEGAL-STAGE-001') };
    if (sixth && ninth && !eleventh) return { label: 'Proceedings', rule: ruleById('LEGAL-STAGE-001') };
    if (seventh && eleventh && (transit.jupiter.active)) return { label: 'Negotiation', rule: ruleById('LEGAL-STAGE-001') };
    if (seventh && eleventh) return { label: 'Settlement', rule: ruleById('LEGAL-STAGE-001') };
    if (ninth && tenth) return { label: 'Hearing / Order', rule: ruleById('LEGAL-STAGE-001') };
    if ((sixth || ninth) && eleventh) return { label: 'Resolution / Closure', rule: ruleById('LEGAL-STAGE-001') };
    if (sixth && twelfth && candidate.matchCount >= 3) return { label: 'Appeal / Review', rule: ruleById('LEGAL-STAGE-001') };
    if (sixth && twelfth) return { label: 'Continued / Delayed', rule: ruleById('LEGAL-STAGE-001') };
    return { label: 'Proceedings', rule: ruleById('LEGAL-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 6. CANDIDATE WINDOWS + WINDOW STRENGTH (non-numeric)
  // ---------------------------------------------------------------
  function mergeAdjacent(candidates) {
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate);
    const merged = [];
    sorted.forEach(c => {
      const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 2 * 24 * 60 * 60 * 1000)) {
        last.endDate = c.endDate; last.members.push(c);
      } else merged.push(Object.assign({}, c, { members: [c] }));
    });
    return merged;
  }

  function assessWindowStrength(convergenceFactors) {
    if (convergenceFactors >= 5) return 'Strongly Supportive';
    if (convergenceFactors >= 4) return 'Supportive';
    if (convergenceFactors >= 3) return 'Moderately Supportive';
    if (convergenceFactors >= 2) return 'Mixed';
    return 'Conditional';
  }

  NS.buildCandidateWindows = function (horizonYears, matterType) {
    const activationMap = NS.buildLegalActivationMap(horizonYears, matterType);
    if (!activationMap.available) return { available: false, windows: [] };

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyStage(c, transit);
      const convergenceFactors = [c.emphasisMatch, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3, c.activatedHouses.includes(6) || c.activatedHouses.includes(9)].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('LEGAL-STRENGTH-001') };
      const cautions = [];
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      if ((transit.rahu.active || transit.ketu.active) && convergenceFactors < 3) cautions.push('Rahu/Ketu activation present, but this alone is not treated as sufficient for a resolution window.');
      if (c.activatedHouses.includes(6) && !c.activatedHouses.includes(11) && !c.activatedHouses.includes(9)) cautions.push('6th-house activation present without 9th/11th support — this is not automatically an adverse outcome, only continued dispute/procedural activity.');
      return Object.assign({}, c, { transit, stage, convergenceFactors, qualification, strength, cautions });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 7. HISTORICAL VALIDATION
  // ---------------------------------------------------------------
  NS.validateHistoricalDate = function (eventDate, eventType, matterType) {
    const chart = NS.getChartData();
    if (!chart || !state.dasha || !state.dasha.length) return null;
    const mdIdx = findCurrentIndex(state.dasha, eventDate);
    if (mdIdx < 0) return { eventDate, eventType, inRange: false };
    const md = state.dasha[mdIdx];
    const adIdx = findCurrentIndex(md.antardashas, eventDate);
    const ad = adIdx >= 0 ? md.antardashas[adIdx] : null;
    let pd = null;
    if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pdIdx = findCurrentIndex(pds, eventDate); pd = pdIdx >= 0 ? pds[pdIdx] : null; }
    function activated(lordName) { return lordName ? NS.legalFactorsForLord(lordName, matterType || 'General').relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.legalFactorsForLord(l, matterType || 'General').activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      sixthActivation: houseActivated(6), ninthActivation: houseActivated(9), eleventhActivation: houseActivated(11), twelfthActivation: lords.some(activated),
      jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Legal Factors (2nd/3rd/4th/5th/6th/7th/8th/9th/10th/11th/12th)', anchor: 'legal-sec-promise' },
    { id: 2, label: 'Dasha (MD/AD/PD) and legal relevance', anchor: 'legal-sec-dasha' },
    { id: 3, label: 'Matter-Specific Houses', anchor: 'legal-sec-matter' },
    { id: 4, label: 'Transit (Jupiter/Saturn/Rahu/Ketu)', anchor: 'legal-sec-windows' },
    { id: 5, label: 'Stage Classification', anchor: 'legal-sec-windows' },
    { id: 6, label: 'Final Candidate Window', anchor: 'legal-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, matterType, minSupport, stageFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    const matter = matterType || 'General';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.matterType === matter && NS.cache.minSupport === minSupport && NS.cache.stageFilter === stageFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalLegalMatterPotential();
    log(calculationLog, '[02] 2nd/3rd/4th/5th/6th/7th/8th/9th/10th/11th/12th houses and Saturn/Jupiter/Mars/Mercury/Venus/Sun/Rahu/Ketu analysed');
    log(calculationLog, '[03] Natal Legal Matter Indicators: ' + natalPromise.potential);
    log(calculationLog, '[04] Matter type selected: ' + matter + ' — adjusts house emphasis only, never manufactures unsupported evidence');
    log(calculationLog, '[05] D10 deliberately not used for legal-matter timing (per architectural scope decision)');

    const missing = [];
    let windowsResult = { available: false, windows: [] };
    let currentDasha = null;
    if (!state.dasha || !state.dasha.length) {
      missing.push('Vimshottari Dasha');
    } else {
      log(calculationLog, '[06] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx];
        const aIdx = findCurrentIndex(md.antardashas);
        const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null;
        if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = {
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.legalFactorsForLord(md.lord, matter) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.legalFactorsForLord(ad.lord, matter) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.legalFactorsForLord(pd.lord, matter) } : null
        };
      }
      log(calculationLog, '[07] Legal-Matter Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon, matter);
      log(calculationLog, '[08] Candidate legal-matter windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minSupport && minSupport !== 'All') {
      const threshold = SUPPORT_RANK[minSupport] != null ? SUPPORT_RANK[minSupport] : 0;
      windows = windows.filter(w => SUPPORT_RANK[w.strength.label] >= threshold);
      log(calculationLog, '[09] Filtered by minimum support: ' + minSupport + ' (' + windows.length + ' windows)');
    }
    if (stageFilter && stageFilter !== 'All') {
      windows = windows.filter(w => w.stage.label === stageFilter);
      log(calculationLog, '[10] Filtered by stage: ' + stageFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['LEGAL-NATAL-002', 'LEGAL-NATAL-003', 'LEGAL-NATAL-004', 'LEGAL-NATAL-005', 'LEGAL-NATAL-006', 'LEGAL-NATAL-007', 'LEGAL-NATAL-008', 'LEGAL-NATAL-009', 'LEGAL-NATAL-010', 'LEGAL-NATAL-011', 'LEGAL-NATAL-012', 'LEGAL-SIGNIF-SATURN', 'LEGAL-SIGNIF-JUPITER', 'LEGAL-SIGNIF-MARS', 'LEGAL-SIGNIF-MERCURY', 'LEGAL-SIGNIF-VENUS', 'LEGAL-SIGNIF-SUN', 'LEGAL-SIGNIF-RAHU', 'LEGAL-SIGNIF-KETU', 'LEGAL-HOUSE-6-7', 'LEGAL-HOUSE-6-9', 'LEGAL-HOUSE-6-10', 'LEGAL-HOUSE-6-11', 'LEGAL-HOUSE-6-12', 'LEGAL-HOUSE-7-9', 'LEGAL-HOUSE-7-11', 'LEGAL-HOUSE-8-9', 'LEGAL-HOUSE-8-11', 'LEGAL-HOUSE-9-10', 'LEGAL-HOUSE-9-11', 'LEGAL-HOUSE-3-6-9', 'LEGAL-PROPERTY-001', 'LEGAL-INHERITANCE-001', 'LEGAL-NOD10-001', 'LEGAL-MATTERTYPE-001', 'LEGAL-NOOUTCOME-001']);
    if (windowsResult.available) { rulesUsedIds.add('LEGAL-DASHA-001'); rulesUsedIds.add('LEGAL-TRANSIT-JUP'); rulesUsedIds.add('LEGAL-TRANSIT-SAT'); rulesUsedIds.add('LEGAL-TRANSIT-NODES'); rulesUsedIds.add('LEGAL-STAGE-001'); rulesUsedIds.add('LEGAL-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, currentDasha,
      candidateWindows: windows, horizonYears: horizon, matterType: matter, minSupport: minSupport || 'All', stageFilter: stageFilter || 'All',
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, matterType: matter, minSupport, stageFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
