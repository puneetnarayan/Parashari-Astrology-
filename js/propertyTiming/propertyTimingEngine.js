/* =========================================================
   PROPERTY PURCHASE TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/aspect/dasha/divisional-chart/transit calculations
   throughout — same architecture as Childbirth Timing
   (js/childbirthTiming/childbirthTimingEngine.js), with
   property-promise-specific houses/significators/rules and a
   multi-type event classification (purchase/land/house/construction/
   possession/sale/inheritance).
   Exposed only as window.PropertyTiming (namespaced). UI code lives
   entirely in propertyTimingUI.js — this file returns plain data only.
   ========================================================= */

window.PropertyTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, result }

  const PROPERTY_HOUSES = [2, 4, 8, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[PropertyTiming]', text); }
  function ruleById(id) { return (window.PROPERTY_TIMING_RULES || []).find(r => r.id === id); }

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
  // 2. D4 (CHATURTHAMSHA) — reuses vargaPosition('D4'), the app's
  //    EXISTING divisional-chart engine (js/divisionalCharts.js already
  //    defines the D4 Chaturthamsa starting-sign rule). No new D4
  //    implementation.
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
      secondSign: houseSign(2), secondLord: SIGN_LORD[houseSign(2)],
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      planets,
      fourthOccupants: planets.filter(p => p.d4House === 4).map(p => p.name)
    };
  };

  NS.assessD4Confirmation = function () {
    const d4 = NS.getD4();
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d4.planets.find(p => p.name === name); return x ? x.d4Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d4.fourthLord))) { points += 2; evidence.push(`D4 4th lord (${d4.fourthLord}) is ${dig(d4.fourthLord)} in D4.`); }
    else if (dig(d4.fourthLord) === 'Debilitated') evidence.push(`D4 4th lord (${d4.fourthLord}) is Debilitated in D4.`);
    if (strong.includes(dig(d4.secondLord))) { points += 1; evidence.push(`D4 2nd lord (${d4.secondLord}) is ${dig(d4.secondLord)} in D4.`); }
    if (strong.includes(dig(d4.eleventhLord))) { points += 1; evidence.push(`D4 11th lord (${d4.eleventhLord}) is ${dig(d4.eleventhLord)} in D4.`); }
    if (strong.includes(dig(d4.lagnaLord))) { points += 1; evidence.push(`D4 Lagna lord (${d4.lagnaLord}) is ${dig(d4.lagnaLord)} in D4.`); }
    if (d4.fourthOccupants.length) { points += 1; evidence.push(`D4 4th house occupied by: ${d4.fourthOccupants.join(', ')}.`); }
    if (strong.includes(dig('Mars'))) { points += 1; evidence.push(`Mars is ${dig('Mars')} in D4.`); }
    if (strong.includes(dig('Venus'))) { points += 1; evidence.push(`Venus is ${dig('Venus')} in D4.`); }
    if (strong.includes(dig('Moon'))) { points += 1; evidence.push(`Moon is ${dig('Moon')} in D4.`); }
    if (!evidence.length) evidence.push('No strong D4 confirmation factors found for the property axis (4th/2nd/11th/Lagna lords, Mars, Venus, Moon).');
    const level = points >= 6 ? 'Strong D4 confirmation' : points >= 4 ? 'D4 confirmation' : points >= 2 ? 'Partial D4 confirmation' : points >= 1 ? 'Mixed D4 indication' : 'Weak D4 confirmation';
    return { d4, points, level, evidence, rule: ruleById('PP-D4-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL PROPERTY ACQUISITION PROMISE (Steps 3, 4, 6)
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
    let result = 'Neutral';
    if (strongDignity && !lordInDusthana && beneficOccupants >= maleficOccupants) result = 'Strong';
    else if (lordInDusthana || dignity === 'Debilitated' || maleficOccupants > beneficOccupants) result = 'Challenging';
    else if (lordWellPlaced || beneficOccupants > 0) result = 'Supporting';
    else result = 'Moderate';
    return {
      house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId),
      occupants: h.occupants, aspectingHere: h.aspectingHere,
      evidence: [
        `${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`,
        h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.',
        h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.',
        lordInDusthana ? `${h.lord} occupies a Dusthana house (${lordP.house}).` : lordWellPlaced ? `${h.lord} occupies a Kendra/Trikona house (${lordP.house}).` : `${h.lord} occupies a Panapara/Upachaya house (${lordP.house}).`
      ]
    };
  }

  function classifyKaraka(name, ruleId) {
    const p = NS.getPlanetSnapshot(name);
    const fourth = NS.getHouseSnapshot(4);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connectedToFourth = p.house === 4 || p.conjunctWith.includes(fourth.lord) || p.aspectedBy.includes(fourth.lord) || fourth.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Neutral';
    if (connectedToFourth && result === 'Neutral') result = 'Supporting';
    return {
      planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connectedToFourth,
      evidence: [
        `${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`,
        p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.',
        p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.',
        `Connected to 4th: ${connectedToFourth ? 'Yes' : 'No'}.`
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

  NS.assessNatalPropertyPromise = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'PP-NATAL-002');
    const fourth = classifyHouse(4, 'PP-NATAL-004');
    const eighth = classifyHouse(8, 'PP-NATAL-008');
    const eleventh = classifyHouse(11, 'PP-NATAL-011');
    const twelfth = classifyHouse(12, 'PP-NATAL-012');
    const mars = classifyKaraka('Mars', 'PP-NATAL-MARS');
    const venus = classifyKaraka('Venus', 'PP-NATAL-VENUS');
    const moon = classifyKaraka('Moon', 'PP-NATAL-MOON');
    const jupiter = classifyKaraka('Jupiter', 'PP-NATAL-JUPITER');
    const saturn = classifyKaraka('Saturn', 'PP-NATAL-SATURN');

    const fourthH = NS.getHouseSnapshot(4), eleventhH = NS.getHouseSnapshot(11), secondH = NS.getHouseSnapshot(2);
    const relationships = [
      { id: 'PP-PAIR-4-11', a: fourthH, b: eleventhH }, { id: 'PP-PAIR-4-2', a: fourthH, b: secondH }
    ].map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });
    relationships.push({
      rule: ruleById('PP-MARS-PROPERTY'), houseA: 4, boundPlanet: 'Mars', connected: mars.connectedToFourth,
      evidence: mars.connectedToFourth ? 'Mars is connected (placement/conjunction/aspect) to the 4th house/lord.' : 'Mars shows no direct connection to the 4th house/lord.'
    });

    // 6th/8th loan-financing co-factor (Step 8) — descriptive, never scored negative.
    const sixth = NS.getHouseSnapshot(6);
    const loanIndicatorsActive = housesConnected(fourthH, sixth, chart).connected || housesConnected(fourthH, NS.getHouseSnapshot(8), chart).connected;

    const connectedCount = relationships.filter(r => r.connected).length;
    const strongCount = [second, fourth, eleventh].filter(h => h.result === 'Strong' || h.result === 'Supporting').length + connectedCount;
    const challengingCount = [second, fourth].filter(h => h.result === 'Challenging').length;
    const overall = connectedCount >= 2 && fourth.result !== 'Challenging'
      ? 'The natal chart supports acquisition of immovable property.'
      : connectedCount === 1 ? 'The natal chart shows a single moderate indication of property acquisition.'
      : 'The natal chart shows limited natal indication of property acquisition; timing should be read cautiously.';

    return { secondHouse: second, fourthHouse: fourth, eighthHouse: eighth, eleventhHouse: eleventh, twelfthHouse: twelfth, mars, venus, moon, jupiter, saturn, relationships, connectedCount, overall, loanIndicatorsActive, loanRule: ruleById('PP-LOAN-001') };
  };

  // ---------------------------------------------------------------
  // 4. VIMSHOTTARI DASHA — Property Activation Map (Steps 9-11)
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.propertyFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (PROPERTY_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => PROPERTY_HOUSES.includes(h)).join(', ')}.`);
    if (PROPERTY_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const fourth = NS.getHouseSnapshot(4), eleventh = NS.getHouseSnapshot(11);
    if (lordName === fourth.lord) factors.push(`${lordName} is the 4th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (['Mars', 'Venus', 'Moon', 'Jupiter'].includes(lordName)) factors.push(`${lordName} is a natural property significator.`);
    const fourthConnection = lordName === fourth.lord || p.conjunctWith.includes(fourth.lord) || p.aspectedBy.includes(fourth.lord);
    if (fourthConnection && lordName !== fourth.lord) factors.push(`${lordName} is connected to the 4th lord (${fourth.lord}) by conjunction/aspect.`);
    const d4 = NS.getD4();
    const pD4 = d4.planets.find(x => x.name === lordName);
    const d4Confirmation = [4, 2, 11].includes(pD4.d4House) || [d4.fourthLord, d4.secondLord, d4.eleventhLord].includes(lordName);
    if (d4Confirmation) factors.push(`${lordName} is connected to the D4 property axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, fourthConnection, d4Confirmation };
  };

  NS.buildPropertyActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.propertyFactorsForLord(md.lord);
        const adFactors = NS.propertyFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.propertyFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const fourthConnection = mdFactors.fourthConnection || adFactors.fourthConnection || pdFactors.fourthConnection;
          const d4Confirmation = mdFactors.d4Confirmation || adFactors.d4Confirmation || pdFactors.d4Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, fourthConnection, d4Confirmation, matchCount, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 5. TRANSIT (Steps 13-15) — Jupiter primary, Saturn contextual,
  //    Mars secondary, all supporting confirmation only.
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const fourth = NS.getHouseSnapshot(4), second = NS.getHouseSnapshot(2), eleventh = NS.getHouseSnapshot(11);
    const moonNatal = NS.getPlanetSnapshot('Moon');
    const fourthLordNatal = NS.getPlanetSnapshot(fourth.lord);

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
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === moonNatal.signIndex) || signIdx === moonNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting natal Moon.`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [4, 2, 11], 'PP-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [4, 2, 11], 'PP-TRANSIT-SAT'),
      mars: checkBody('Mars', [4], 'PP-TRANSIT-MARS')
    };
  };

  // ---------------------------------------------------------------
  // 6. EVENT CLASSIFICATION (Step 17) — multiple property-event types,
  //    never defaulting to "Purchase"; relocation never auto-classified
  //    as purchase (this module has no relocation-detection logic at
  //    all, so there is nothing that could conflate the two).
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, d4, natalPromise, transit) {
    const d4Confirms = d4.points >= 4;
    const partialD4 = d4.points >= 2;
    const eleventhInvolved = candidate.activatedHouses.includes(11);
    const secondInvolved = candidate.activatedHouses.includes(2);
    const eighthInvolved = candidate.activatedHouses.includes(8);
    const twelfthInvolved = candidate.activatedHouses.includes(12);
    const marsInvolved = candidate.lordsInvolved.includes('Mars');
    const saturnInvolved = candidate.lordsInvolved.includes('Saturn');
    const venusInvolved = candidate.lordsInvolved.includes('Venus');
    const moonInvolved = candidate.lordsInvolved.includes('Moon');
    const jupiterInvolved = candidate.lordsInvolved.includes('Jupiter');

    if (eighthInvolved && natalPromise.eighthHouse.result !== 'Challenging' && candidate.fourthConnection) {
      return { label: 'Inheritance (4th + 8th convergence — review family/wealth context)', rule: ruleById('PP-EVENT-001') };
    }
    if (marsInvolved && saturnInvolved && candidate.fourthConnection && partialD4) {
      return { label: 'Construction', rule: ruleById('PP-EVENT-001') };
    }
    if (candidate.fourthConnection && (marsInvolved || saturnInvolved) && (secondInvolved || eleventhInvolved) && d4Confirms) {
      return { label: 'Land Purchase', rule: ruleById('PP-EVENT-001') };
    }
    if (candidate.fourthConnection && (venusInvolved || moonInvolved || jupiterInvolved) && (secondInvolved || eleventhInvolved) && d4Confirms) {
      return { label: 'House / Apartment Purchase', rule: ruleById('PP-EVENT-001') };
    }
    if (candidate.fourthConnection && secondInvolved && eleventhInvolved && d4Confirms) {
      return { label: 'Property Purchase', rule: ruleById('PP-EVENT-001') };
    }
    if (candidate.fourthConnection && eleventhInvolved && d4Confirms && (transit.jupiter.active || transit.saturn.active)) {
      return { label: 'Possession / Registration', rule: ruleById('PP-EVENT-001') };
    }
    if (twelfthInvolved && candidate.fourthConnection && !eleventhInvolved) {
      return { label: 'Property Sale / Expenditure Context (review — not necessarily a loss)', rule: ruleById('PP-EVENT-001') };
    }
    return { label: 'Property-Related Activation (evidence insufficient for a specific classification)', rule: ruleById('PP-EVENT-001') };
  };

  // ---------------------------------------------------------------
  // 7. CANDIDATE WINDOWS (Step 16)
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
    const activationMap = NS.buildPropertyActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d4 = NS.assessD4Confirmation();
    const natalPromise = NS.assessNatalPropertyPromise();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const event = NS.classifyEvent(c, d4, natalPromise, transit);
      const convergenceFactors = [c.fourthConnection, c.d4Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      return Object.assign({}, c, { transit, event, convergenceFactors, qualification });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 8. HISTORICAL VALIDATION (Step 22)
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
    function activated(lordName) { return lordName ? NS.propertyFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.propertyFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d4 = NS.assessD4Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      secondActivation: houseActivated(2), fourthActivation: lords.some(activated), eleventhActivation: houseActivated(11),
      d4Level: d4.level, jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Property Promise', anchor: 'pp-sec-promise' },
    { id: 2, label: '4th house / 4th lord analysed', anchor: 'pp-sec-promise' },
    { id: 3, label: '2nd supports asset acquisition', anchor: 'pp-sec-promise' },
    { id: 4, label: '11th supports gain/acquisition', anchor: 'pp-sec-promise' },
    { id: 5, label: 'Mahadasha activates 4th', anchor: 'pp-sec-dasha' },
    { id: 6, label: 'Antardasha activates 11th', anchor: 'pp-sec-dasha' },
    { id: 7, label: 'Pratyantardasha activates 2nd', anchor: 'pp-sec-dasha' },
    { id: 8, label: 'D4 confirms property acquisition', anchor: 'pp-sec-d4' },
    { id: 9, label: 'Jupiter supports acquisition', anchor: 'pp-sec-windows' },
    { id: 10, label: 'Saturn supports long-term asset/formalization', anchor: 'pp-sec-windows' },
    { id: 11, label: 'Candidate Property Window', anchor: 'pp-sec-windows' },
    { id: 12, label: 'Event Classification', anchor: 'pp-sec-windows' }
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
    const natalPromise = NS.assessNatalPropertyPromise();
    log(calculationLog, '[02] 2nd/4th/8th/11th/12th houses and Mars/Venus/Moon/Jupiter/Saturn analysed');
    const d4 = NS.assessD4Confirmation();
    log(calculationLog, '[03] D4 (Chaturthamsha) confirmation computed: ' + d4.level);
    if (natalPromise.loanIndicatorsActive) log(calculationLog, '[04] Financing/loan indicators (6th/8th) also active alongside property promise');

    const missing = [];
    let windowsResult = { available: false, windows: [] };
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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.propertyFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.propertyFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.propertyFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[06] Property Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[07] Candidate property windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['PP-NATAL-002', 'PP-NATAL-004', 'PP-NATAL-008', 'PP-NATAL-011', 'PP-NATAL-012', 'PP-NATAL-MARS', 'PP-NATAL-VENUS', 'PP-NATAL-MOON', 'PP-NATAL-SATURN', 'PP-NATAL-JUPITER', 'PP-PAIR-4-11', 'PP-PAIR-4-2', 'PP-MARS-PROPERTY', 'PP-D4-001', 'PP-LOAN-001', 'PP-WEALTH-001']);
    if (windowsResult.available) { rulesUsedIds.add('PP-DASHA-001'); rulesUsedIds.add('PP-TRANSIT-JUP'); rulesUsedIds.add('PP-TRANSIT-SAT'); rulesUsedIds.add('PP-TRANSIT-MARS'); rulesUsedIds.add('PP-EVENT-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, d4Confirmation: d4, currentDasha,
      candidateWindows: windowsResult.windows, horizonYears: horizon,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
