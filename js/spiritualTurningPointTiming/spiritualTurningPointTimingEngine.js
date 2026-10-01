/* =========================================================
   SPIRITUAL TURNING POINT TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/aspect/dasha/transit calculations throughout — same
   architecture as the sixteen prior timing modules in this app. No
   divisional chart is forced into this module (none of the standard
   Vargas is specifically a "spiritual" confirmation chart in this
   app's existing rule base). This is a TIMING AND INTERPRETIVE
   ASTROLOGY MODULE ONLY. It never diagnoses mental-health conditions,
   claims enlightenment as fact, declares spiritual superiority,
   prescribes religious beliefs, or makes deterministic claims about
   divine intervention.
   Exposed only as window.SpiritualTurningPointTiming (namespaced). UI
   code lives entirely in spiritualTurningPointTimingUI.js — this file
   returns plain data only.
   ========================================================= */

window.SpiritualTurningPointTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, minSupport, stageFilter, result }

  const SPIRITUAL_HOUSES = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
  const SUPPORT_RANK = { 'Strongly Supportive': 4, 'Supportive': 3, 'Moderately Supportive': 2, 'Mixed': 1, 'Conditional': 0 };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[SpiritualTurningPointTiming]', text); }
  function ruleById(id) { return (window.SPIRITUAL_TURNING_POINT_TIMING_RULES || []).find(r => r.id === id); }

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
  // 2. NATAL SPIRITUAL POTENTIAL
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

  NS.assessNatalSpiritualPotential = function () {
    const chart = NS.getChartData();
    const first = classifyHouse(1, 'SPIRIT-NATAL-001');
    const second = classifyHouse(2, 'SPIRIT-NATAL-002');
    const third = classifyHouse(3, 'SPIRIT-NATAL-003');
    const fourth = classifyHouse(4, 'SPIRIT-NATAL-004');
    const fifth = classifyHouse(5, 'SPIRIT-NATAL-005');
    const eighth = classifyHouse(8, 'SPIRIT-NATAL-008');
    const ninth = classifyHouse(9, 'SPIRIT-NATAL-009');
    const tenth = classifyHouse(10, 'SPIRIT-NATAL-010');
    const eleventh = classifyHouse(11, 'SPIRIT-NATAL-011');
    const twelfth = classifyHouse(12, 'SPIRIT-NATAL-012');

    const jupiter = classifyKaraka('Jupiter', 'SPIRIT-SIGNIF-JUPITER', 9);
    const ketu = classifyKaraka('Ketu', 'SPIRIT-SIGNIF-KETU', 12);
    const saturn = classifyKaraka('Saturn', 'SPIRIT-SIGNIF-SATURN', 12);
    const moon = classifyKaraka('Moon', 'SPIRIT-SIGNIF-MOON', 5);
    const sun = classifyKaraka('Sun', 'SPIRIT-SIGNIF-SUN', 9);
    const mercury = classifyKaraka('Mercury', 'SPIRIT-SIGNIF-MERCURY', 5);
    const venus = classifyKaraka('Venus', 'SPIRIT-SIGNIF-VENUS', 5);
    const rahu = classifyKaraka('Rahu', 'SPIRIT-SIGNIF-RAHU', 12);

    const firstH = NS.getHouseSnapshot(1), thirdH = NS.getHouseSnapshot(3), fourthH = NS.getHouseSnapshot(4),
      fifthH = NS.getHouseSnapshot(5), eighthH = NS.getHouseSnapshot(8), ninthH = NS.getHouseSnapshot(9),
      tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'SPIRIT-HOUSE-5-9', a: fifthH, b: ninthH }, { id: 'SPIRIT-HOUSE-9-12', a: ninthH, b: twelfthH },
      { id: 'SPIRIT-HOUSE-8-9', a: eighthH, b: ninthH }, { id: 'SPIRIT-HOUSE-8-12', a: eighthH, b: twelfthH },
      { id: 'SPIRIT-HOUSE-4-12', a: fourthH, b: twelfthH }, { id: 'SPIRIT-HOUSE-5-12', a: fifthH, b: twelfthH },
      { id: 'SPIRIT-HOUSE-9-10', a: ninthH, b: tenthH }, { id: 'SPIRIT-HOUSE-9-11', a: ninthH, b: eleventhH },
      { id: 'SPIRIT-HOUSE-1-9', a: firstH, b: ninthH }, { id: 'SPIRIT-HOUSE-1-12', a: firstH, b: twelfthH },
      { id: 'SPIRIT-HOUSE-4-9', a: fourthH, b: ninthH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const convergence_3_5_9 = [housesConnected(thirdH, fifthH, chart).connected, housesConnected(fifthH, ninthH, chart).connected,
      housesConnected(thirdH, ninthH, chart).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('SPIRIT-HOUSE-3-5-9'), present: convergence_3_5_9, evidence: `3rd/5th/9th convergence: ${convergence_3_5_9 ? 'present' : 'not present'}.` }
    ];

    const connectedCount = relationships.filter(r => r.connected).length;
    let potential;
    if (connectedCount >= 4) potential = 'Clearly Present';
    else if (connectedCount >= 2) potential = 'Present';
    else if (connectedCount === 1) potential = 'Mixed';
    else potential = 'Limited Evidence';

    const reasons = [
      `9th house: ${ninth.result} (${ninth.sign}, lord ${ninth.lord}).`,
      `12th house: ${twelfth.result} (${twelfth.sign}, lord ${twelfth.lord}).`,
      `${connectedCount} of ${relationships.length} spiritual house-relationship signatures connected.`,
      `Jupiter: ${jupiter.result}, Ketu: ${ketu.result}.`
    ];

    return {
      firstHouse: first, secondHouse: second, thirdHouse: third, fourthHouse: fourth, fifthHouse: fifth,
      eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      jupiter, ketu, saturn, moon, sun, mercury, venus, rahu,
      relationships, convergenceSignatures, connectedCount, potential, reasons
    };
  };

  // ---------------------------------------------------------------
  // 3. VIMSHOTTARI DASHA — Spiritual Activation Map
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.spiritualFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (SPIRITUAL_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => SPIRITUAL_HOUSES.includes(h)).join(', ')}.`);
    if (SPIRITUAL_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const fifth = NS.getHouseSnapshot(5), ninth = NS.getHouseSnapshot(9), twelfth = NS.getHouseSnapshot(12);
    if (lordName === ninth.lord) factors.push(`${lordName} is the 9th lord.`);
    if (lordName === twelfth.lord) factors.push(`${lordName} is the 12th lord.`);
    if (lordName === fifth.lord) factors.push(`${lordName} is the 5th lord.`);
    if (lordName === 'Jupiter' || lordName === 'Ketu') factors.push(`${lordName} is a natural spiritual significator.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses };
  };

  NS.buildSpiritualActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.spiritualFactorsForLord(md.lord);
        const adFactors = NS.spiritualFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.spiritualFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, matchCount, reasons, lordsInvolved });
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
      jupiter: checkBody('Jupiter', [4, 5, 8, 9, 12], 'SPIRIT-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [4, 8, 9, 12], 'SPIRIT-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [9, 12], 'SPIRIT-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [9, 12], 'SPIRIT-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 5. PILGRIMAGE CROSS-CHECK (Section 16) — reads Foreign Travel
  //    Timing's own output directly, never duplicates travel calcs.
  // ---------------------------------------------------------------
  NS.checkPilgrimageCrossCheck = function (candidate) {
    if (!window.ForeignTravelTiming) return null;
    const result = window.ForeignTravelTiming.refresh();
    if (!result) return null;
    const overlapping = result.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    const spiritualHousesPresent = candidate.activatedHouses.includes(9) || candidate.activatedHouses.includes(12);
    if (!spiritualHousesPresent) return null;
    return {
      overlapping: true, foreignTravelEvent: overlapping.event.label,
      interpretation: 'This period also overlaps a candidate window from Foreign Travel / Settlement Timing, with 9th/12th spiritual-house activation also present — suggesting the travel may carry a spiritual/pilgrimage purpose rather than an ordinary journey.',
      rule: ruleById('SPIRIT-PILGRIMAGE-001')
    };
  };

  // ---------------------------------------------------------------
  // 6. GURU/TEACHER CONNECTION CONTEXT (Section 17)
  // ---------------------------------------------------------------
  NS.checkGuruConnection = function (candidate, natalPromise) {
    const h = candidate.activatedHouses;
    const ninthInvolved = h.includes(9), fifthInvolved = h.includes(5), twelfthInvolved = h.includes(12);
    const jupiterRelevant = candidate.lordsInvolved.includes('Jupiter');
    if (!ninthInvolved && !jupiterRelevant) return null;
    return {
      present: true,
      interpretation: 'Astrologically supportive period for contact with a teacher, mentor, or spiritual tradition.' + (twelfthInvolved ? ' A retreat/teacher-environment context is also present.' : ''),
      rule: ruleById('SPIRIT-GURU-001')
    };
  };

  // ---------------------------------------------------------------
  // 7. SPIRITUAL STAGE CLASSIFICATION (Sections 11, 15)
  // ---------------------------------------------------------------
  NS.classifyStage = function (candidate, transit, natalPromise) {
    const h = candidate.activatedHouses;
    const first = h.includes(1), second = h.includes(2), third = h.includes(3), fourth = h.includes(4),
      fifth = h.includes(5), eighth = h.includes(8), ninth = h.includes(9), tenth = h.includes(10),
      eleventh = h.includes(11), twelfth = h.includes(12);

    if (third && fifth && !ninth && !twelfth) return { label: 'Study', rule: ruleById('SPIRIT-STAGE-001') };
    if (ninth && twelfth && (transit.jupiter.active)) return { label: 'Pilgrimage / Teacher', rule: ruleById('SPIRIT-STAGE-001') };
    if (fifth && twelfth) return { label: 'Practice', rule: ruleById('SPIRIT-STAGE-001') };
    if (eighth && (ninth || twelfth)) return { label: 'Transformation', rule: ruleById('SPIRIT-STAGE-001') };
    if (twelfth && (transit.rahu.active || transit.ketu.active) && candidate.matchCount < 3) return { label: 'Interest / Awakening', rule: ruleById('SPIRIT-STAGE-001') };
    if (twelfth && transit.saturn.active) return { label: 'Detachment', rule: ruleById('SPIRIT-STAGE-001') };
    if (ninth && tenth && eleventh) return { label: 'Service', rule: ruleById('SPIRIT-STAGE-001') };
    if (fourth && ninth && eleventh) return { label: 'Integration', rule: ruleById('SPIRIT-STAGE-001') };
    if (ninth || first) return { label: 'Interest / Awakening', rule: ruleById('SPIRIT-STAGE-001') };
    return { label: 'Study', rule: ruleById('SPIRIT-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 8. CANDIDATE WINDOWS + WINDOW STRENGTH (non-numeric)
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

  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildSpiritualActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const natalPromise = NS.assessNatalSpiritualPotential();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyStage(c, transit, natalPromise);
      const pilgrimageCrossCheck = NS.checkPilgrimageCrossCheck(c);
      const guruConnection = NS.checkGuruConnection(c, natalPromise);
      const convergenceFactors = [transit.jupiter.active, transit.saturn.active, c.matchCount >= 3, c.activatedHouses.includes(9) || c.activatedHouses.includes(12), c.activatedHouses.includes(5)].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('SPIRIT-STRENGTH-001') };
      const cautions = [];
      if (!transit.jupiter.active && !transit.saturn.active) cautions.push('Neither Jupiter nor Saturn transit shows qualifying activation for this window midpoint.');
      if ((transit.rahu.active || transit.ketu.active) && convergenceFactors < 3) cautions.push('Rahu/Ketu activation present, but this alone is not treated as sufficient for a major spiritual window.');
      if (c.activatedHouses.includes(12) && stage.label !== 'Detachment') cautions.push('12th-house activation present — not automatically classified as renunciation.');
      return Object.assign({}, c, { transit, stage, pilgrimageCrossCheck, guruConnection, convergenceFactors, qualification, strength, cautions });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 9. HISTORICAL VALIDATION
  // ---------------------------------------------------------------
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
    function activated(lordName) { return lordName ? NS.spiritualFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.spiritualFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      fifthActivation: houseActivated(5), ninthActivation: houseActivated(9), twelfthActivation: houseActivated(12), eighthActivation: lords.some(activated),
      jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Spiritual Factors (1st/2nd/3rd/4th/5th/8th/9th/10th/11th/12th)', anchor: 'spirit-sec-promise' },
    { id: 2, label: 'Dasha Activation (MD/AD/PD)', anchor: 'spirit-sec-dasha' },
    { id: 3, label: 'Spiritual Stage Classification', anchor: 'spirit-sec-windows' },
    { id: 4, label: 'Transit Confirmation (Jupiter/Saturn/Rahu/Ketu)', anchor: 'spirit-sec-windows' },
    { id: 5, label: 'Final Candidate Window', anchor: 'spirit-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, minSupport, stageFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.minSupport === minSupport && NS.cache.stageFilter === stageFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalSpiritualPotential();
    log(calculationLog, '[02] 1st/2nd/3rd/4th/5th/8th/9th/10th/11th/12th houses and Jupiter/Ketu/Saturn/Moon/Sun/Mercury/Venus/Rahu analysed');
    log(calculationLog, '[03] Natal Spiritual Development Indicators: ' + natalPromise.potential);

    const missing = [];
    let windowsResult = { available: false, windows: [] };
    let currentDasha = null;
    if (!state.dasha || !state.dasha.length) {
      missing.push('Vimshottari Dasha');
    } else {
      log(calculationLog, '[04] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx];
        const aIdx = findCurrentIndex(md.antardashas);
        const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null;
        if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = {
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.spiritualFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.spiritualFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.spiritualFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[05] Spiritual Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[06] Candidate spiritual windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (minSupport && minSupport !== 'All') {
      const threshold = SUPPORT_RANK[minSupport] != null ? SUPPORT_RANK[minSupport] : 0;
      windows = windows.filter(w => SUPPORT_RANK[w.strength.label] >= threshold);
      log(calculationLog, '[07] Filtered by minimum support: ' + minSupport + ' (' + windows.length + ' windows)');
    }
    if (stageFilter && stageFilter !== 'All') {
      windows = windows.filter(w => w.stage.label === stageFilter);
      log(calculationLog, '[08] Filtered by spiritual stage: ' + stageFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['SPIRIT-NATAL-001', 'SPIRIT-NATAL-002', 'SPIRIT-NATAL-003', 'SPIRIT-NATAL-004', 'SPIRIT-NATAL-005', 'SPIRIT-NATAL-008', 'SPIRIT-NATAL-009', 'SPIRIT-NATAL-010', 'SPIRIT-NATAL-011', 'SPIRIT-NATAL-012', 'SPIRIT-SIGNIF-JUPITER', 'SPIRIT-SIGNIF-KETU', 'SPIRIT-SIGNIF-SATURN', 'SPIRIT-SIGNIF-MOON', 'SPIRIT-SIGNIF-SUN', 'SPIRIT-SIGNIF-MERCURY', 'SPIRIT-SIGNIF-VENUS', 'SPIRIT-SIGNIF-RAHU', 'SPIRIT-HOUSE-5-9', 'SPIRIT-HOUSE-9-12', 'SPIRIT-HOUSE-8-9', 'SPIRIT-HOUSE-8-12', 'SPIRIT-HOUSE-4-12', 'SPIRIT-HOUSE-5-12', 'SPIRIT-HOUSE-3-5-9', 'SPIRIT-HOUSE-9-10', 'SPIRIT-HOUSE-9-11', 'SPIRIT-HOUSE-1-9', 'SPIRIT-HOUSE-1-12', 'SPIRIT-HOUSE-4-9', 'SPIRIT-SAFETY-001']);
    if (windowsResult.available) { rulesUsedIds.add('SPIRIT-DASHA-001'); rulesUsedIds.add('SPIRIT-TRANSIT-JUP'); rulesUsedIds.add('SPIRIT-TRANSIT-SAT'); rulesUsedIds.add('SPIRIT-TRANSIT-NODES'); rulesUsedIds.add('SPIRIT-STAGE-001'); rulesUsedIds.add('SPIRIT-PILGRIMAGE-001'); rulesUsedIds.add('SPIRIT-GURU-001'); rulesUsedIds.add('SPIRIT-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, currentDasha,
      candidateWindows: windows, horizonYears: horizon, minSupport: minSupport || 'All', stageFilter: stageFilter || 'All',
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, minSupport, stageFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
