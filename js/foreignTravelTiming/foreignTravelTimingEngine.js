/* =========================================================
   FOREIGN TRAVEL / FOREIGN SETTLEMENT TIMING — pure calculation
   engine. Parashari/Vimshottari method only: no KP sub-lords/
   significators/ruling-planets, no Western technique. Reuses this
   app's existing chart/dignity/aspect/dasha/divisional-chart/transit
   calculations throughout — same architecture as Property Purchase
   Timing (js/propertyTiming/propertyTimingEngine.js), with
   foreign-travel-specific houses/significators/rules, a travel-vs-
   settlement distinction, and a Job Change Timing cross-check reused
   directly (same cross-module pattern Job Change Timing itself uses
   for its Promotion comparison).
   Exposed only as window.ForeignTravelTiming (namespaced). UI code
   lives entirely in foreignTravelTimingUI.js — this file returns
   plain data only.
   ========================================================= */

window.ForeignTravelTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, result }

  const FOREIGN_HOUSES = [3, 4, 6, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[ForeignTravelTiming]', text); }
  function ruleById(id) { return (window.FOREIGN_TRAVEL_TIMING_RULES || []).find(r => r.id === id); }

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
  // 2. D4 & D10 — reuse vargaPosition() directly, the app's EXISTING
  //    divisional-chart engine. No new varga implementation.
  // ---------------------------------------------------------------
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
    return {
      ascendantSign: ascD4.sign, lagnaLord: d4LagnaLord,
      fourthSign: houseSign(4), fourthLord: SIGN_LORD[houseSign(4)],
      ninthSign: houseSign(9), ninthLord: SIGN_LORD[houseSign(9)],
      twelfthSign: houseSign(12), twelfthLord: SIGN_LORD[houseSign(12)],
      planets
    };
  };

  NS.assessD4Confirmation = function () {
    const d4 = NS.getD4();
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d4.planets.find(p => p.name === name); return x ? x.d4Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d4.fourthLord))) { points += 1; evidence.push(`D4 4th lord (${d4.fourthLord}) is ${dig(d4.fourthLord)} in D4.`); }
    if (strong.includes(dig(d4.ninthLord))) { points += 2; evidence.push(`D4 9th lord (${d4.ninthLord}) is ${dig(d4.ninthLord)} in D4.`); }
    if (strong.includes(dig(d4.twelfthLord))) { points += 2; evidence.push(`D4 12th lord (${d4.twelfthLord}) is ${dig(d4.twelfthLord)} in D4.`); }
    if (strong.includes(dig(d4.lagnaLord))) { points += 1; evidence.push(`D4 Lagna lord (${d4.lagnaLord}) is ${dig(d4.lagnaLord)} in D4.`); }
    if (strong.includes(dig('Moon'))) { points += 1; evidence.push(`Moon is ${dig('Moon')} in D4.`); }
    if (strong.includes(dig('Rahu'))) { points += 1; evidence.push(`Rahu is ${dig('Rahu')} in D4.`); }
    if (strong.includes(dig('Saturn'))) { points += 1; evidence.push(`Saturn is ${dig('Saturn')} in D4.`); }
    if (!evidence.length) evidence.push('No strong D4 confirmation factors found for the residence/foreign axis (4th/9th/12th/Lagna lords, Moon, Rahu, Saturn).');
    const level = points >= 6 ? 'Strong D4 confirmation' : points >= 4 ? 'D4 confirmation' : points >= 2 ? 'Partial D4 confirmation' : points >= 1 ? 'Mixed D4 indication' : 'Weak D4 confirmation';
    return { d4, points, level, evidence, rule: ruleById('FT-D4-001') };
  };

  NS.getD10 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD10 = vargaPosition(chart.ascendant.longitude, 'D10');
    const ascD10SignIndex = SIGNS.indexOf(ascD10.sign);
    function houseSign(h) { return SIGNS[(ascD10SignIndex + h - 1) % 12]; }
    const planets = chart.planets.map(p => {
      const d10 = vargaPosition(p.longitude, 'D10');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d10DegreeInSign = normalizeDegrees(d10.longitude) % 30;
      const d10Dignity = isClassical ? detailedDignity(p.name, d10.sign, d10DegreeInSign).tier : 'Neutral';
      const d10House = ((SIGNS.indexOf(d10.sign) - ascD10SignIndex + 12) % 12) + 1;
      return { name: p.name, d10Sign: d10.sign, d10House, d10Dignity };
    });
    return { tenthSign: houseSign(10), tenthLord: SIGN_LORD[houseSign(10)], twelfthSign: houseSign(12), twelfthLord: SIGN_LORD[houseSign(12)], planets };
  };

  NS.assessD10Confirmation = function () {
    const d10 = NS.getD10();
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d10.planets.find(p => p.name === name); return x ? x.d10Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d10.tenthLord))) { points += 2; evidence.push(`D10 10th lord (${d10.tenthLord}) is ${dig(d10.tenthLord)} in D10.`); }
    if (strong.includes(dig(d10.twelfthLord))) { points += 1; evidence.push(`D10 12th lord (${d10.twelfthLord}) is ${dig(d10.twelfthLord)} in D10.`); }
    if (!evidence.length) evidence.push('No strong D10 confirmation factors found for foreign-career indications.');
    const level = points >= 3 ? 'D10 confirmation' : points >= 1 ? 'Partial D10 confirmation' : 'Weak D10 confirmation';
    return { d10, points, level, evidence, rule: ruleById('FT-D10-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL FOREIGN CONNECTION PROMISE (Steps 3-5, 9)
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

  NS.assessNatalForeignPromise = function () {
    const chart = NS.getChartData();
    const third = classifyHouse(3, 'FT-NATAL-003');
    const fourth = classifyHouse(4, 'FT-NATAL-004');
    const sixth = classifyHouse(6, 'FT-NATAL-006');
    const ninth = classifyHouse(9, 'FT-NATAL-009');
    const tenth = classifyHouse(10, 'FT-NATAL-010');
    const eleventh = classifyHouse(11, 'FT-NATAL-011');
    const twelfth = classifyHouse(12, 'FT-NATAL-012');
    const rahu = classifyKaraka('Rahu', 'FT-NATAL-RAHU', 12);
    const ketu = classifyKaraka('Ketu', 'FT-NATAL-KETU', 12);
    const moon = classifyKaraka('Moon', 'FT-NATAL-MOON', 4);
    const jupiter = classifyKaraka('Jupiter', 'FT-NATAL-JUPITER', 9);
    const saturn = classifyKaraka('Saturn', 'FT-NATAL-SATURN', 12);
    const sun = classifyKaraka('Sun', 'FT-NATAL-SUN', 10);

    const fourthH = NS.getHouseSnapshot(4), ninthH = NS.getHouseSnapshot(9), tenthH = NS.getHouseSnapshot(10), twelfthH = NS.getHouseSnapshot(12), sixthH = NS.getHouseSnapshot(6), thirdH = NS.getHouseSnapshot(3);
    const pairs = [
      { id: 'FT-PAIR-4-12', a: fourthH, b: twelfthH }, { id: 'FT-PAIR-9-12', a: ninthH, b: twelfthH },
      { id: 'FT-PAIR-10-12', a: tenthH, b: twelfthH }, { id: 'FT-PAIR-6-12', a: sixthH, b: twelfthH },
      { id: 'FT-PAIR-3-9', a: thirdH, b: ninthH }, { id: 'FT-PAIR-9-10', a: ninthH, b: tenthH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });
    const rahuForeignConnected = rahu.connected || [9, 10, 12].includes(NS.getPlanetSnapshot('Rahu').house);
    relationships.push({
      rule: ruleById('FT-RAHU-FOREIGN'), houseA: 12, boundPlanet: 'Rahu', connected: rahuForeignConnected,
      evidence: rahuForeignConnected ? 'Rahu is connected (placement/conjunction/aspect) to the 9th/10th/12th houses or their lords.' : 'Rahu shows no direct connection to the 9th/10th/12th houses or their lords.'
    });

    const connectedCount = relationships.filter(r => r.connected).length;
    const overall = connectedCount >= 2
      ? 'The natal chart supports foreign travel or residence away from the native place.'
      : connectedCount === 1 ? 'The natal chart shows a single moderate indication of foreign travel/residence.'
      : 'The natal chart shows limited natal indication of foreign travel/residence; any apparent activation should be weighed cautiously.';

    return { thirdHouse: third, fourthHouse: fourth, sixthHouse: sixth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth, rahu, ketu, moon, jupiter, saturn, sun, relationships, connectedCount, overall };
  };

  // ---------------------------------------------------------------
  // 4. VIMSHOTTARI DASHA — Foreign Activation Map (Steps 10-12)
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.foreignFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (FOREIGN_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => FOREIGN_HOUSES.includes(h)).join(', ')}.`);
    if (FOREIGN_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const twelfth = NS.getHouseSnapshot(12), ninth = NS.getHouseSnapshot(9), tenth = NS.getHouseSnapshot(10);
    if (lordName === twelfth.lord) factors.push(`${lordName} is the 12th lord.`);
    if (lordName === ninth.lord) factors.push(`${lordName} is the 9th lord.`);
    if (lordName === 'Rahu' || lordName === 'Ketu') factors.push(`${lordName} is the natural foreign-context significator.`);
    const twelfthConnection = lordName === twelfth.lord || p.conjunctWith.includes(twelfth.lord) || p.aspectedBy.includes(twelfth.lord);
    if (twelfthConnection && lordName !== twelfth.lord) factors.push(`${lordName} is connected to the 12th lord (${twelfth.lord}) by conjunction/aspect.`);
    const d4 = NS.getD4();
    const pD4 = d4.planets.find(x => x.name === lordName);
    const d4Confirmation = [4, 9, 12].includes(pD4.d4House) || [d4.fourthLord, d4.ninthLord, d4.twelfthLord].includes(lordName);
    if (d4Confirmation) factors.push(`${lordName} is connected to the D4 residence/foreign axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, twelfthConnection, d4Confirmation };
  };

  NS.buildForeignActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.foreignFactorsForLord(md.lord);
        const adFactors = NS.foreignFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.foreignFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const twelfthConnection = mdFactors.twelfthConnection || adFactors.twelfthConnection || pdFactors.twelfthConnection;
          const d4Confirmation = mdFactors.d4Confirmation || adFactors.d4Confirmation || pdFactors.d4Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, twelfthConnection, d4Confirmation, matchCount, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 5. TRANSIT (Steps 15-17) — Jupiter/Saturn primary, Rahu/Ketu
  //    secondary, all supporting confirmation only.
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const moonNatal = NS.getPlanetSnapshot('Moon');
    const twelfthLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(12).lord);

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
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === twelfthLordNatal.signIndex) || signIdx === twelfthLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 12th lord's sign (${twelfthLordNatal.sign}).`); }
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === moonNatal.signIndex) || signIdx === moonNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting natal Moon.`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [9, 12, 4, 10, 11], 'FT-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [4, 9, 10, 12], 'FT-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [4, 9, 10, 12], 'FT-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [4, 9, 10, 12], 'FT-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 6. EVENT CLASSIFICATION (Step 21) + SETTLEMENT STRENGTH (Step 22,
  //    non-numeric) + FOREIGN CAREER CROSS-CHECK (Step 18)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, d4, d10, natalPromise) {
    const d4Confirms = d4.points >= 4;
    const ninthInvolved = candidate.activatedHouses.includes(9);
    const twelfthInvolved = candidate.activatedHouses.includes(12);
    const tenthInvolved = candidate.activatedHouses.includes(10);
    const sixthInvolved = candidate.activatedHouses.includes(6);
    const thirdInvolved = candidate.activatedHouses.includes(3);
    const fourthInvolved = candidate.activatedHouses.includes(4);
    const d10Confirms = d10.points >= 1;

    if (sixthInvolved && tenthInvolved && twelfthInvolved && d10Confirms) return { label: 'Foreign Employment', rule: ruleById('FT-EVENT-001') };
    if (fourthInvolved && ninthInvolved && twelfthInvolved && d4Confirms) return { label: 'Foreign Settlement (candidate — requires sustained/repeated confirmation, see Settlement Strength)', rule: ruleById('FT-EVENT-001') };
    if (fourthInvolved && ninthInvolved && twelfthInvolved) return { label: 'Extended Foreign Stay', rule: ruleById('FT-EVENT-001') };
    if (ninthInvolved && (thirdInvolved || twelfthInvolved)) return { label: 'Long-Distance Travel', rule: ruleById('FT-EVENT-001') };
    if (thirdInvolved && (ninthInvolved || twelfthInvolved)) return { label: 'Short / Temporary Foreign Travel', rule: ruleById('FT-EVENT-001') };
    return { label: 'Foreign-Related Activation (evidence insufficient for a specific classification)', rule: ruleById('FT-EVENT-001') };
  };

  NS.assessSettlementStrength = function (windows) {
    const settlementCandidates = windows.filter(w => w.event.label.startsWith('Foreign Settlement') || w.event.label === 'Extended Foreign Stay');
    const travelCandidates = windows.filter(w => w.event.label.includes('Travel'));
    const d4Strong = windows.some(w => w.d4Confirmation) && NS.assessD4Confirmation().points >= 4;
    let label;
    if (settlementCandidates.length >= 2 && d4Strong) label = 'Strong settlement indication';
    else if (settlementCandidates.length >= 1 && d4Strong) label = 'Supportive settlement indication';
    else if (settlementCandidates.length >= 1) label = 'Temporary/conditional residence indication';
    else if (travelCandidates.length > settlementCandidates.length) label = 'Travel indication stronger than settlement';
    else label = 'Mixed foreign-residence indication';
    return { label, rule: ruleById('FT-SETTLEMENT-001'), settlementWindowCount: settlementCandidates.length, travelWindowCount: travelCandidates.length };
  };

  NS.checkForeignCareerCrossCheck = function (candidate) {
    if (!window.JobChangeTiming) return null;
    const jcResult = window.JobChangeTiming.refresh();
    if (!jcResult) return null;
    const overlapping = jcResult.candidateWindows.find(w => w.mahadasha === candidate.mahadasha && w.antardasha === candidate.antardasha && w.pratyantar === candidate.pratyantar);
    if (!overlapping) return null;
    return {
      overlapping: true, jobChangeEvent: overlapping.event.label,
      interpretation: 'Job change + foreign opportunity indicators are active.',
      rule: ruleById('FT-CAREER-CROSSCHECK-001')
    };
  };

  // ---------------------------------------------------------------
  // 7. CANDIDATE WINDOWS (Step 20)
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

  NS.buildCandidateWindows = function (horizonYears) {
    const activationMap = NS.buildForeignActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d4 = NS.assessD4Confirmation();
    const d10 = NS.assessD10Confirmation();
    const natalPromise = NS.assessNatalForeignPromise();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const event = NS.classifyEvent(c, d4, d10, natalPromise);
      const careerCrossCheck = NS.checkForeignCareerCrossCheck(c);
      const convergenceFactors = [c.twelfthConnection, c.d4Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      return Object.assign({}, c, { transit, event, careerCrossCheck, convergenceFactors, qualification });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    const settlementStrength = NS.assessSettlementStrength(merged);
    return { available: true, windows: merged, settlementStrength };
  };

  // ---------------------------------------------------------------
  // 8. HISTORICAL VALIDATION (Step 26)
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
    function activated(lordName) { return lordName ? NS.foreignFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.foreignFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d4 = NS.assessD4Confirmation();
    const d10 = NS.assessD10Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      fourthActivation: houseActivated(4), ninthActivation: houseActivated(9), tenthActivation: houseActivated(10), twelfthActivation: lords.some(activated),
      d4Level: d4.level, d10Level: d10.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Foreign Connection', anchor: 'ft-sec-promise' },
    { id: 2, label: '9th house connected with 12th', anchor: 'ft-sec-signature' },
    { id: 3, label: '4th/residence axis activated', anchor: 'ft-sec-promise' },
    { id: 4, label: 'Mahadasha activates 12th', anchor: 'ft-sec-dasha' },
    { id: 5, label: 'Antardasha activates 9th', anchor: 'ft-sec-dasha' },
    { id: 6, label: 'Pratyantardasha activates 4th/12th', anchor: 'ft-sec-dasha' },
    { id: 7, label: 'D4 confirms residence change', anchor: 'ft-sec-d4' },
    { id: 8, label: 'D10 confirms foreign career (if applicable)', anchor: 'ft-sec-d10' },
    { id: 9, label: 'Jupiter supports opportunity', anchor: 'ft-sec-windows' },
    { id: 10, label: 'Saturn supports long-term relocation', anchor: 'ft-sec-windows' },
    { id: 11, label: 'Candidate Foreign Residence Window', anchor: 'ft-sec-windows' },
    { id: 12, label: 'Event Classification', anchor: 'ft-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalForeignPromise();
    log(calculationLog, '[02] 3rd/4th/6th/9th/10th/11th/12th houses and Rahu/Ketu/Moon/Jupiter/Saturn/Sun analysed');
    const d4 = NS.assessD4Confirmation();
    log(calculationLog, '[03] D4 (Chaturthamsha) confirmation computed: ' + d4.level);
    const d10 = NS.assessD10Confirmation();
    log(calculationLog, '[04] D10 (Dashamsha) foreign-career confirmation computed: ' + d10.level);

    const missing = [];
    let windowsResult = { available: false, windows: [], settlementStrength: null };
    let currentDasha = null;
    if (!state.dasha || !state.dasha.length) {
      missing.push('Vimshottari Dasha');
    } else {
      log(calculationLog, '[05] Vimshottari dasha periods read');
      const idx = findCurrentIndex(state.dasha);
      if (idx >= 0) {
        const md = state.dasha[idx];
        const aIdx = findCurrentIndex(md.antardashas);
        const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
        let pd = null;
        if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
        currentDasha = {
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.foreignFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.foreignFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.foreignFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[06] Foreign Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate foreign windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['FT-NATAL-003', 'FT-NATAL-004', 'FT-NATAL-006', 'FT-NATAL-009', 'FT-NATAL-010', 'FT-NATAL-011', 'FT-NATAL-012', 'FT-NATAL-RAHU', 'FT-NATAL-KETU', 'FT-NATAL-MOON', 'FT-NATAL-JUPITER', 'FT-NATAL-SATURN', 'FT-NATAL-SUN', 'FT-PAIR-4-12', 'FT-PAIR-9-12', 'FT-PAIR-10-12', 'FT-PAIR-6-12', 'FT-PAIR-3-9', 'FT-PAIR-9-10', 'FT-RAHU-FOREIGN', 'FT-D4-001', 'FT-D10-001', 'FT-EDUCATION-001']);
    if (windowsResult.available) { rulesUsedIds.add('FT-DASHA-001'); rulesUsedIds.add('FT-TRANSIT-JUP'); rulesUsedIds.add('FT-TRANSIT-SAT'); rulesUsedIds.add('FT-TRANSIT-NODES'); rulesUsedIds.add('FT-EVENT-001'); rulesUsedIds.add('FT-SETTLEMENT-001'); rulesUsedIds.add('FT-CAREER-CROSSCHECK-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, d4Confirmation: d4, d10Confirmation: d10, currentDasha,
      candidateWindows: windowsResult.windows, settlementStrength: windowsResult.settlementStrength, horizonYears: horizon,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
