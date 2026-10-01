/* =========================================================
   VEHICLE PURCHASE TIMING — pure calculation engine. Parashari/
   Vimshottari method only: no KP sub-lords/significators/ruling-
   planets, no Western technique. Reuses this app's existing chart/
   dignity/aspect/dasha/divisional-chart/transit calculations
   throughout — same architecture as the eleven prior timing modules
   in this app, most directly Property Purchase Timing (sibling
   comfort/asset module, read here only as an optional D4 cross-
   check, never duplicated) and Business Start Timing (D-chart
   confirmation + cross-module read pattern).
   Exposed only as window.VehiclePurchaseTiming (namespaced). UI code
   lives entirely in vehiclePurchaseTimingUI.js — this file returns
   plain data only.
   ========================================================= */

window.VehiclePurchaseTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, eventFilter, result }

  const VEHICLE_HOUSES = [2, 3, 4, 6, 8, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[VehiclePurchaseTiming]', text); }
  function ruleById(id) { return (window.VEHICLE_PURCHASE_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER
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
  // 2. D16 (primary) — reuse vargaPosition() directly, the app's
  //    EXISTING divisional-chart engine. No new varga implementation.
  //    D4 is NOT reused as the vehicle chart (per spec) — it is only
  //    optionally cross-referenced via window.PropertyTiming.
  // ---------------------------------------------------------------
  NS.getD16 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD16 = vargaPosition(chart.ascendant.longitude, 'D16');
    const ascD16SignIndex = SIGNS.indexOf(ascD16.sign);
    const d16LagnaLord = SIGN_LORD[ascD16.sign];
    function houseSign(h) { return SIGNS[(ascD16SignIndex + h - 1) % 12]; }
    const planets = chart.planets.map(p => {
      const d16 = vargaPosition(p.longitude, 'D16');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d16DegreeInSign = normalizeDegrees(d16.longitude) % 30;
      const d16Dignity = isClassical ? detailedDignity(p.name, d16.sign, d16DegreeInSign).tier : 'Neutral';
      const d16House = ((SIGNS.indexOf(d16.sign) - ascD16SignIndex + 12) % 12) + 1;
      return { name: p.name, d16Sign: d16.sign, d16House, d16Dignity };
    });
    return {
      ascendantSign: ascD16.sign, lagnaLord: d16LagnaLord,
      fourthSign: houseSign(4), fourthLord: SIGN_LORD[houseSign(4)],
      planets, available: true
    };
  };

  NS.assessD16Confirmation = function () {
    const d16 = NS.getD16();
    if (!d16) return { available: false, level: 'D16 confirmation unavailable', points: 0, evidence: ['Chart data unavailable.'], rule: ruleById('VEH-D16-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d16.planets.find(p => p.name === name); return x ? x.d16Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d16.fourthLord))) { points += 2; evidence.push(`D16 4th lord (${d16.fourthLord}) is ${dig(d16.fourthLord)} in D16.`); }
    if (strong.includes(dig(d16.lagnaLord))) { points += 1; evidence.push(`D16 Lagna lord (${d16.lagnaLord}) is ${dig(d16.lagnaLord)} in D16.`); }
    if (strong.includes(dig('Venus'))) { points += 2; evidence.push(`Venus is ${dig('Venus')} in D16.`); }
    if (strong.includes(dig('Mars'))) { points += 1; evidence.push(`Mars is ${dig('Mars')} in D16.`); }
    if (strong.includes(dig('Moon'))) { points += 1; evidence.push(`Moon is ${dig('Moon')} in D16.`); }
    if (!evidence.length) evidence.push('No strong D16 confirmation factors found for the vehicle/conveyance axis (4th/Lagna lords, Venus, Mars, Moon).');
    const level = points >= 6 ? 'Strong D16 confirmation' : points >= 4 ? 'D16 confirmation' : points >= 2 ? 'Partial D16 confirmation' : points >= 1 ? 'Mixed D16 indication' : 'Weak D16 confirmation';
    return { available: true, d16, points, level, evidence, rule: ruleById('VEH-D16-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL VEHICLE PROMISE
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

  NS.assessNatalVehiclePromise = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'VEH-NATAL-002');
    const third = classifyHouse(3, 'VEH-NATAL-003');
    const fourth = classifyHouse(4, 'VEH-NATAL-004');
    const sixth = classifyHouse(6, 'VEH-NATAL-006');
    const eighth = classifyHouse(8, 'VEH-NATAL-008');
    const tenth = classifyHouse(10, 'VEH-NATAL-010');
    const eleventh = classifyHouse(11, 'VEH-NATAL-011');
    const twelfth = classifyHouse(12, 'VEH-NATAL-012');

    const venus = classifyKaraka('Venus', 'VEH-NATAL-VENUS', 4);
    const mars = classifyKaraka('Mars', 'VEH-NATAL-MARS', 4);
    const moon = classifyKaraka('Moon', 'VEH-NATAL-MOON', 4);
    const mercury = classifyKaraka('Mercury', 'VEH-NATAL-MERCURY', 3);
    const saturn = classifyKaraka('Saturn', 'VEH-NATAL-SATURN', 4);

    const secondH = NS.getHouseSnapshot(2), thirdH = NS.getHouseSnapshot(3), fourthH = NS.getHouseSnapshot(4),
      sixthH = NS.getHouseSnapshot(6), tenthH = NS.getHouseSnapshot(10), eleventhH = NS.getHouseSnapshot(11), eighthH = NS.getHouseSnapshot(8), twelfthH = NS.getHouseSnapshot(12);

    const pairs = [
      { id: 'VEH-PAIR-4-11', a: fourthH, b: eleventhH }, { id: 'VEH-PAIR-4-2', a: fourthH, b: secondH },
      { id: 'VEH-PAIR-3-4', a: thirdH, b: fourthH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });

    const convergence_2_4_11 = [relationships.find(r => r.houseA === 4 && r.houseB === 2).connected,
      relationships.find(r => r.houseA === 4 && r.houseB === 11).connected, housesConnected(secondH, eleventhH, chart).connected].filter(Boolean).length >= 2;
    const convergenceSignatures = [
      { rule: ruleById('VEH-CONV-2-4-11'), present: convergence_2_4_11, evidence: `2nd/4th/11th convergence: ${convergence_2_4_11 ? 'present' : 'not present'}.` }
    ];

    const incomeFunded = [housesConnected(secondH, tenthH, chart).connected, housesConnected(tenthH, fourthH, chart).connected, housesConnected(tenthH, eleventhH, chart).connected].filter(Boolean).length >= 2;
    const loanFunded = [housesConnected(secondH, fourthH, chart).connected, housesConnected(fourthH, sixthH, chart).connected, housesConnected(sixthH, eleventhH, chart).connected].filter(Boolean).length >= 2;
    const professionalVehicle = [housesConnected(fourthH, tenthH, chart).connected, housesConnected(thirdH, tenthH, chart).connected, relationships.find(r => r.houseA === 4 && r.houseB === 11).connected].filter(Boolean).length >= 2;
    const replacementContext = [relationships.find(r => r.houseA === 4 && r.houseB === 11).connected, relationships.find(r => r.houseA === 4 && r.houseB === 2).connected,
      housesConnected(eighthH, fourthH, chart).connected || housesConnected(twelfthH, fourthH, chart).connected].filter(Boolean).length >= 2;

    const connectedCount = relationships.filter(r => r.connected).length;
    const overall = connectedCount >= 2
      ? 'The chart supports vehicle ownership.'
      : connectedCount === 1 ? 'Vehicle acquisition is supported, with a moderate natal indication.'
      : 'The chart shows limited natal indication for vehicle acquisition; any apparent activation should be weighed cautiously.';

    return {
      secondHouse: second, thirdHouse: third, fourthHouse: fourth, sixthHouse: sixth, eighthHouse: eighth,
      tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      venus, mars, moon, mercury, saturn,
      relationships, convergenceSignatures, incomeFunded, loanFunded, professionalVehicle, replacementContext, connectedCount, overall
    };
  };

  // ---------------------------------------------------------------
  // 4. VEHICLE TYPE CLASSIFICATION (Section 11)
  // ---------------------------------------------------------------
  NS.classifyVehicleType = function (natalPromise) {
    const types = [];
    if (natalPromise.venus.result === 'Strong' || natalPromise.venus.result === 'Supporting') types.push('Luxury / Comfort-Oriented Vehicle');
    if (natalPromise.mars.result === 'Strong' || natalPromise.mars.result === 'Supporting') types.push('Utility Vehicle');
    if (natalPromise.professionalVehicle) types.push('Commercial / Professional Vehicle');
    if (natalPromise.saturn.result === 'Strong' || natalPromise.saturn.result === 'Supporting') types.push('Heavy / Industrial Vehicle');
    if (natalPromise.fourthHouse.result === 'Strong' && natalPromise.eleventhHouse.result === 'Strong') types.push('Family Vehicle');
    if (!types.length) types.push('Personal Vehicle');
    return {
      types: Array.from(new Set(types)),
      note: 'An exact make, model, registration number, or colour is never predicted from astrology alone — these are broad thematic indications only.',
      rule: ruleById('VEH-TYPE-001')
    };
  };

  // ---------------------------------------------------------------
  // 5. VIMSHOTTARI DASHA — Vehicle Activation Map
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.vehicleFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (VEHICLE_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => VEHICLE_HOUSES.includes(h)).join(', ')}.`);
    if (VEHICLE_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const fourth = NS.getHouseSnapshot(4), eleventh = NS.getHouseSnapshot(11), second = NS.getHouseSnapshot(2);
    if (lordName === fourth.lord) factors.push(`${lordName} is the 4th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (lordName === second.lord) factors.push(`${lordName} is the 2nd lord.`);
    if (lordName === 'Venus' || lordName === 'Mars') factors.push(`${lordName} is a natural vehicle/comfort significator.`);
    const fourthConnection = lordName === fourth.lord || p.conjunctWith.includes(fourth.lord) || p.aspectedBy.includes(fourth.lord);
    if (fourthConnection && lordName !== fourth.lord) factors.push(`${lordName} is connected to the 4th lord (${fourth.lord}) by conjunction/aspect.`);
    const d16 = NS.getD16();
    const d16Confirmation = d16 ? (() => {
      const pD16 = d16.planets.find(x => x.name === lordName);
      return pD16.d16House === 4 || [d16.fourthLord, d16.lagnaLord].includes(lordName);
    })() : false;
    if (d16Confirmation) factors.push(`${lordName} is connected to the D16 vehicle axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, fourthConnection, d16Confirmation };
  };

  NS.buildVehicleActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.vehicleFactorsForLord(md.lord);
        const adFactors = NS.vehicleFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.vehicleFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const fourthConnection = mdFactors.fourthConnection || adFactors.fourthConnection || pdFactors.fourthConnection;
          const d16Confirmation = mdFactors.d16Confirmation || adFactors.d16Confirmation || pdFactors.d16Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, fourthConnection, d16Confirmation, matchCount, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 6. TRANSIT — Jupiter/Saturn primary, Venus/Mars secondary, nodes
  //    contextual only (never accident/danger inference)
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const fourthLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(4).lord);

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
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === fourthLordNatal.signIndex) || signIdx === fourthLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 4th lord's sign (${fourthLordNatal.sign}).`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [2, 3, 4, 11], 'VEH-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [3, 4, 11], 'VEH-TRANSIT-SAT'),
      mars: checkBody('Mars', [3, 4, 11], 'VEH-TRANSIT-MARS'),
      venus: checkBody('Venus', [4, 11], 'VEH-TRANSIT-VENUS'),
      rahu: checkBody('Rahu', [4, 11], 'VEH-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [4, 11], 'VEH-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 7. EVENT STAGE (Booking/Financing/Purchase/Delivery/Registration/
  //    First Use/Replacement/Upgrade) — Section 19
  // ---------------------------------------------------------------
  NS.classifyStage = function (candidate, d16, transit) {
    const h = candidate.activatedHouses;
    const secondInvolved = h.includes(2), thirdInvolved = h.includes(3), sixthInvolved = h.includes(6),
      eleventhInvolved = h.includes(11), tenthInvolved = h.includes(10), eighthInvolved = h.includes(8), twelfthInvolved = h.includes(12);
    const d16Confirms = candidate.d16Confirmation;

    if (secondInvolved && !eleventhInvolved && !d16Confirms) return { label: 'Booking', rule: ruleById('VEH-STAGE-001') };
    if (sixthInvolved && secondInvolved && !d16Confirms) return { label: 'Financing', rule: ruleById('VEH-STAGE-001') };
    if (eleventhInvolved && d16Confirms && (transit.jupiter.active || transit.venus.active)) return { label: 'Purchase', rule: ruleById('VEH-STAGE-001') };
    if (eleventhInvolved && d16Confirms && transit.mars.active) return { label: 'Delivery', rule: ruleById('VEH-STAGE-001') };
    if (thirdInvolved && d16Confirms && !eleventhInvolved) return { label: 'Registration', rule: ruleById('VEH-STAGE-001') };
    if (thirdInvolved && eleventhInvolved && d16Confirms) return { label: 'First Use', rule: ruleById('VEH-STAGE-001') };
    if ((eighthInvolved || twelfthInvolved) && eleventhInvolved) return { label: 'Replacement', rule: ruleById('VEH-STAGE-001') };
    if ((eighthInvolved || twelfthInvolved) && tenthInvolved) return { label: 'Upgrade', rule: ruleById('VEH-STAGE-001') };
    return { label: 'Booking', rule: ruleById('VEH-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 8. FINANCING / ACQUISITION MODE (Section 17)
  // ---------------------------------------------------------------
  NS.classifyAcquisitionMode = function (natalPromise) {
    if (natalPromise.professionalVehicle) return { label: 'Employer / Business Vehicle', rule: ruleById('VEH-FINANCING-001') };
    if (natalPromise.loanFunded && !natalPromise.incomeFunded) return { label: 'Loan / EMI Purchase', rule: ruleById('VEH-FINANCING-001') };
    if (natalPromise.incomeFunded) return { label: 'Cash Purchase', rule: ruleById('VEH-FINANCING-001') };
    return { label: 'Insufficient evidence for a reasonable acquisition-mode classification', rule: ruleById('VEH-FINANCING-001') };
  };

  // ---------------------------------------------------------------
  // 9. EVENT CLASSIFICATION (replacement/upgrade vs. first purchase)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, natalPromise, stage) {
    if (natalPromise.replacementContext && (stage.label === 'Replacement' || stage.label === 'Upgrade')) return { label: stage.label, baseLabel: stage.label, rule: ruleById('VEH-REPLACE-001') };
    return { label: stage.label, baseLabel: stage.label, rule: ruleById('VEH-STAGE-001') };
  };

  // ---------------------------------------------------------------
  // 10. D4 PROPERTY CROSS-CHECK (optional, Section 14) — read-only,
  //     never used as the vehicle confirmation chart.
  // ---------------------------------------------------------------
  NS.checkPropertyCrossCheck = function (candidate) {
    if (!window.PropertyTiming) return null;
    const ptResult = window.PropertyTiming.refresh();
    if (!ptResult) return null;
    const overlapping = ptResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, propertyEvent: overlapping.event.label,
      interpretation: 'This period also overlaps a candidate window from Property Purchase Timing — shown separately since D4 (property) is not used as the vehicle confirmation chart.',
      rule: ruleById('VEH-D4-CROSSCHECK-001')
    };
  };

  // ---------------------------------------------------------------
  // 11. CANDIDATE WINDOWS + WINDOW STRENGTH (non-numeric)
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
    const activationMap = NS.buildVehicleActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d16 = NS.assessD16Confirmation();
    const natalPromise = NS.assessNatalVehiclePromise();
    const acquisitionMode = NS.classifyAcquisitionMode(natalPromise);

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const stage = NS.classifyStage(c, d16, transit);
      const event = NS.classifyEvent(c, natalPromise, stage);
      const propertyCrossCheck = NS.checkPropertyCrossCheck(c);
      const convergenceFactors = [c.fourthConnection, c.d16Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      const strength = { label: assessWindowStrength(convergenceFactors), rule: ruleById('VEH-STRENGTH-001') };
      return Object.assign({}, c, { transit, stage, event, acquisitionMode, propertyCrossCheck, convergenceFactors, qualification, strength });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 12. HISTORICAL VALIDATION
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
    function activated(lordName) { return lordName ? NS.vehicleFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.vehicleFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d16 = NS.assessD16Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      fourthActivation: houseActivated(4), thirdActivation: houseActivated(3), eleventhActivation: houseActivated(11), secondActivation: lords.some(activated),
      d16Level: d16.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active, marsActive: transit.mars.active, venusActive: transit.venus.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Vehicle Houses (2nd/3rd/4th/6th/8th/10th/11th/12th)', anchor: 'veh-sec-promise' },
    { id: 2, label: 'House Lords', anchor: 'veh-sec-promise' },
    { id: 3, label: 'Natal Vehicle Promise', anchor: 'veh-sec-promise' },
    { id: 4, label: 'Vehicle Type Classification', anchor: 'veh-sec-type' },
    { id: 5, label: 'Mahadasha activates vehicle houses', anchor: 'veh-sec-dasha' },
    { id: 6, label: 'Antardasha activates vehicle houses', anchor: 'veh-sec-dasha' },
    { id: 7, label: 'Pratyantardasha activates vehicle houses', anchor: 'veh-sec-dasha' },
    { id: 8, label: 'D16 confirms vehicle/conveyance direction', anchor: 'veh-sec-d16' },
    { id: 9, label: 'Jupiter/Saturn transit confirmation', anchor: 'veh-sec-windows' },
    { id: 10, label: 'Financing / acquisition mode', anchor: 'veh-sec-financing' },
    { id: 11, label: 'Candidate Window', anchor: 'veh-sec-windows' },
    { id: 12, label: 'Event Stage', anchor: 'veh-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, eventFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.eventFilter === eventFilter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalVehiclePromise();
    log(calculationLog, '[02] 2nd/3rd/4th/6th/8th/10th/11th/12th houses and Venus/Mars/Moon/Mercury/Saturn analysed');
    const vehicleType = NS.classifyVehicleType(natalPromise);
    log(calculationLog, '[03] Vehicle type classified: ' + vehicleType.types.join(', '));
    const acquisitionMode = NS.classifyAcquisitionMode(natalPromise);
    log(calculationLog, '[04] Acquisition mode assessed: ' + acquisitionMode.label);
    const d16 = NS.assessD16Confirmation();
    log(calculationLog, '[05] D16 (Shodashamsha) vehicle confirmation computed: ' + d16.level);

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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.vehicleFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.vehicleFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.vehicleFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[07] Vehicle Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[08] Candidate vehicle windows generated: ' + windowsResult.windows.length);
    }

    let windows = windowsResult.windows;
    if (eventFilter && eventFilter !== 'All') {
      windows = windows.filter(w => w.event.baseLabel === eventFilter || w.event.label === eventFilter);
      log(calculationLog, '[09] Filtered by vehicle event: ' + eventFilter + ' (' + windows.length + ' windows)');
    }

    const rulesUsedIds = new Set(['VEH-NATAL-002', 'VEH-NATAL-003', 'VEH-NATAL-004', 'VEH-NATAL-006', 'VEH-NATAL-008', 'VEH-NATAL-010', 'VEH-NATAL-011', 'VEH-NATAL-012', 'VEH-NATAL-VENUS', 'VEH-NATAL-MARS', 'VEH-NATAL-MOON', 'VEH-NATAL-MERCURY', 'VEH-NATAL-SATURN', 'VEH-PAIR-4-11', 'VEH-PAIR-4-2', 'VEH-PAIR-3-4', 'VEH-CONV-2-4-11', 'VEH-INCOME-001', 'VEH-LOAN-001', 'VEH-PROFESSIONAL-001', 'VEH-REPLACE-001', 'VEH-D16-001', 'VEH-D4-CROSSCHECK-001', 'VEH-TYPE-001', 'VEH-FINANCING-001', 'VEH-SAFETY-001']);
    if (windowsResult.available) { rulesUsedIds.add('VEH-DASHA-001'); rulesUsedIds.add('VEH-TRANSIT-JUP'); rulesUsedIds.add('VEH-TRANSIT-SAT'); rulesUsedIds.add('VEH-TRANSIT-MARS'); rulesUsedIds.add('VEH-TRANSIT-VENUS'); rulesUsedIds.add('VEH-TRANSIT-NODES'); rulesUsedIds.add('VEH-STAGE-001'); rulesUsedIds.add('VEH-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, vehicleType, acquisitionMode, d16Confirmation: d16, currentDasha,
      candidateWindows: windows, horizonYears: horizon, eventFilter: eventFilter || 'All',
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, eventFilter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
