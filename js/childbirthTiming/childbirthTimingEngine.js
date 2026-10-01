/* =========================================================
   CHILDBIRTH TIMING — pure calculation engine.
   Parashari/Vimshottari method only: no KP sub-lords/significators/
   ruling-planets, no Western technique. Reuses this app's existing
   chart/dignity/aspect/dasha/divisional-chart/transit calculations
   throughout — same architecture as Career Start Timing
   (js/careerStartTiming/careerStartTimingEngine.js), with
   children-promise-specific houses/significators/rules.

   SENSITIVITY NOTE: this file never produces or implies a medical
   fertility/pregnancy diagnosis, a guaranteed-conception claim, or a
   child-gender prediction. All language in engine output is
   astrological-indication language only ("astrologically supportive",
   "candidate window", "Dasha/transit support is present") — the UI
   layer (childbirthTimingUI.js) enforces the same constraint and
   always displays the medical-boundary notice.

   Exposed only as window.ChildbirthTiming (namespaced). UI code lives
   entirely in childbirthTimingUI.js — this file returns plain data
   only.
   ========================================================= */

window.ChildbirthTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, result }

  const CHILD_HOUSES = [2, 5, 9, 11];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[ChildbirthTiming]', text); }
  function ruleById(id) { return (window.CHILDBIRTH_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER
  // ---------------------------------------------------------------
  NS.getChartData = function () { return state.chart || null; };

  function planetSnapshot(name, planets) {
    const p = planets.find(pl => pl.name === name);
    if (!p) return null;
    const isClassical = SHADBALA_PLANETS.includes(name);
    const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral' };
    return {
      name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude,
      house: Number(p.house), dignityTier: dignity.tier,
      conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || []
    };
  }
  NS.getPlanetSnapshot = function (name) {
    const chart = NS.getChartData();
    return chart ? planetSnapshot(name, chart.planets) : null;
  };

  function houseSnapshot(houseNum, ascSignIndex, planets) {
    const signIndex = (ascSignIndex + houseNum - 1) % 12;
    const sign = SIGNS[signIndex];
    const lord = SIGN_LORD[sign];
    const occupants = planets.filter(p => Number(p.house) === houseNum).map(p => p.name);
    const aspectingHere = planets.filter(p => {
      const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default;
      const fromIdx = SIGNS.indexOf(p.sign);
      return offsets.some(o => (fromIdx + (o - 1)) % 12 === signIndex);
    }).map(p => p.name);
    return { house: houseNum, sign, lord, occupants, aspectingHere };
  }
  NS.getHouseSnapshot = function (houseNum) {
    const chart = NS.getChartData();
    if (!chart) return null;
    return houseSnapshot(houseNum, SIGNS.indexOf(chart.ascendant.sign), chart.planets);
  };

  // ---------------------------------------------------------------
  // 2. D7 (SAPTAMSHA) — reuses vargaPosition('D7'), the app's EXISTING
  //    divisional-chart engine (js/divisionalCharts.js already defines
  //    the D7 Saptamsa starting-sign rule). No new D7 implementation.
  // ---------------------------------------------------------------
  NS.getD7 = function (chartOverride) {
    const chart = chartOverride || NS.getChartData();
    if (!chart) return null;
    const ascD7 = vargaPosition(chart.ascendant.longitude, 'D7');
    const ascD7SignIndex = SIGNS.indexOf(ascD7.sign);
    const d7LagnaLord = SIGN_LORD[ascD7.sign];
    function houseSign(h) { return SIGNS[(ascD7SignIndex + h - 1) % 12]; }
    const planets = chart.planets.map(p => {
      const d7 = vargaPosition(p.longitude, 'D7');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d7DegreeInSign = normalizeDegrees(d7.longitude) % 30;
      const d7Dignity = isClassical ? detailedDignity(p.name, d7.sign, d7DegreeInSign).tier : 'Neutral';
      const d7House = ((SIGNS.indexOf(d7.sign) - ascD7SignIndex + 12) % 12) + 1;
      return { name: p.name, d7Sign: d7.sign, d7House, d7Dignity };
    });
    return {
      ascendantSign: ascD7.sign, lagnaLord: d7LagnaLord,
      fifthSign: houseSign(5), fifthLord: SIGN_LORD[houseSign(5)],
      ninthSign: houseSign(9), ninthLord: SIGN_LORD[houseSign(9)],
      eleventhSign: houseSign(11), eleventhLord: SIGN_LORD[houseSign(11)],
      planets,
      fifthOccupants: planets.filter(p => p.d7House === 5).map(p => p.name)
    };
  };

  NS.assessD7Confirmation = function () {
    const d7 = NS.getD7();
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d7.planets.find(p => p.name === name); return x ? x.d7Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d7.fifthLord))) { points += 2; evidence.push(`D7 5th lord (${d7.fifthLord}) is ${dig(d7.fifthLord)} in D7.`); }
    else if (dig(d7.fifthLord) === 'Debilitated') evidence.push(`D7 5th lord (${d7.fifthLord}) is Debilitated in D7.`);
    if (strong.includes(dig('Jupiter'))) { points += 2; evidence.push(`Jupiter is ${dig('Jupiter')} in D7.`); }
    if (strong.includes(dig(d7.ninthLord))) { points += 1; evidence.push(`D7 9th lord (${d7.ninthLord}) is ${dig(d7.ninthLord)} in D7.`); }
    if (strong.includes(dig(d7.eleventhLord))) { points += 1; evidence.push(`D7 11th lord (${d7.eleventhLord}) is ${dig(d7.eleventhLord)} in D7.`); }
    if (strong.includes(dig(d7.lagnaLord))) { points += 1; evidence.push(`D7 Lagna lord (${d7.lagnaLord}) is ${dig(d7.lagnaLord)} in D7.`); }
    if (d7.fifthOccupants.length) { points += 1; evidence.push(`D7 5th house occupied by: ${d7.fifthOccupants.join(', ')}.`); }
    if (!evidence.length) evidence.push('No strong D7 confirmation factors found for the children-promise axis (5th/9th/11th/Lagna lords, Jupiter).');
    const level = points >= 5 ? 'Strong D7 confirmation' : points >= 3 ? 'D7 confirmation' : points >= 2 ? 'Partial D7 confirmation' : points >= 1 ? 'Mixed D7 indication' : 'Weak D7 confirmation';
    return { d7, points, level, evidence, rule: ruleById('CB-D7-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL CHILDREN PROMISE (Steps 4, 7)
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
    if (strongDignity && !lordInDusthana && beneficOccupants >= maleficOccupants) result = 'Supportive';
    else if (lordInDusthana || dignity === 'Debilitated' || maleficOccupants > beneficOccupants) result = 'Challenging context';
    else if (lordWellPlaced || beneficOccupants > 0) result = 'Mildly supportive';
    else result = 'Mixed';
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
    const fifth = NS.getHouseSnapshot(5);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const connectedToFifth = p.house === 5 || p.conjunctWith.includes(fifth.lord) || p.aspectedBy.includes(fifth.lord) || fifth.aspectingHere.includes(name);
    let result = strongDignity && !inDusthana ? 'Supportive' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging context' : 'Mixed';
    if (connectedToFifth && result === 'Mixed') result = 'Mildly supportive';
    return {
      planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connectedToFifth,
      evidence: [
        `${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`,
        p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.',
        p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.',
        `Connected to 5th: ${connectedToFifth ? 'Yes' : 'No'}.`
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

  NS.assessNatalChildrenPromise = function (chartOverride) {
    const chart = chartOverride || NS.getChartData();
    const getHouse = chartOverride ? (h) => houseSnapshot(h, SIGNS.indexOf(chart.ascendant.sign), chart.planets) : NS.getHouseSnapshot;
    const getPlanet = chartOverride ? (n) => planetSnapshot(n, chart.planets) : NS.getPlanetSnapshot;

    function classifyHouseFor(houseNum, ruleId) {
      const h = getHouse(houseNum);
      const lordP = chart.planets.find(p => p.name === h.lord);
      const isClassical = SHADBALA_PLANETS.includes(h.lord);
      const dignity = isClassical ? detailedDignity(h.lord, lordP.sign, normalizeDegrees(lordP.longitude) % 30).tier : 'Neutral';
      const beneficOccupants = h.occupants.filter(n => NATURAL_BENEFICS.includes(n)).length;
      const maleficOccupants = h.occupants.filter(n => !NATURAL_BENEFICS.includes(n)).length;
      const lordWellPlaced = KENDRA.includes(Number(lordP.house)) || TRIKONA.includes(Number(lordP.house));
      const lordInDusthana = DUSTHANA.includes(Number(lordP.house));
      const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(dignity);
      let result = strongDignity && !lordInDusthana && beneficOccupants >= maleficOccupants ? 'Supportive'
        : lordInDusthana || dignity === 'Debilitated' || maleficOccupants > beneficOccupants ? 'Challenging context'
        : lordWellPlaced || beneficOccupants > 0 ? 'Mildly supportive' : 'Mixed';
      return { house: houseNum, sign: h.sign, lord: h.lord, dignity, result, rule: ruleById(ruleId), occupants: h.occupants, aspectingHere: h.aspectingHere,
        evidence: [`${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`, h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.', h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.'] };
    }
    function classifyKarakaFor(name, ruleId) {
      const p = getPlanet(name);
      const fifth = getHouse(5);
      const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
      const inDusthana = DUSTHANA.includes(p.house);
      const connectedToFifth = p.house === 5 || p.conjunctWith.includes(fifth.lord) || p.aspectedBy.includes(fifth.lord) || fifth.aspectingHere.includes(name);
      let result = strongDignity && !inDusthana ? 'Supportive' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging context' : 'Mixed';
      if (connectedToFifth && result === 'Mixed') result = 'Mildly supportive';
      return { planet: name, sign: p.sign, house: p.house, dignity: p.dignityTier, result, rule: ruleById(ruleId), connectedToFifth,
        evidence: [`${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`, p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.', p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.', `Connected to 5th: ${connectedToFifth ? 'Yes' : 'No'}.`] };
    }

    const second = classifyHouseFor(2, 'CB-NATAL-002');
    const fifth = classifyHouseFor(5, 'CB-NATAL-005');
    const ninth = classifyHouseFor(9, 'CB-NATAL-009');
    const eleventh = classifyHouseFor(11, 'CB-NATAL-011');
    const jupiter = classifyKarakaFor('Jupiter', 'CB-NATAL-JUPITER');
    const moon = classifyKarakaFor('Moon', 'CB-NATAL-MOON');
    const venus = classifyKarakaFor('Venus', 'CB-NATAL-VENUS');
    const sun = classifyKarakaFor('Sun', 'CB-NATAL-SUN');
    const saturn = classifyKarakaFor('Saturn', 'CB-NATAL-SATURN');

    const fifthH = getHouse(5), eleventhH = getHouse(11), secondH = getHouse(2), ninthH = getHouse(9);
    const pairs = [
      { id: 'CB-PAIR-5-11', a: fifthH, b: eleventhH }, { id: 'CB-PAIR-5-2', a: fifthH, b: secondH },
      { id: 'CB-PAIR-9-5', a: ninthH, b: fifthH }
    ];
    const relationships = pairs.map(pair => {
      const rel = housesConnected(pair.a, pair.b, chart);
      return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
    });
    relationships.push({
      rule: ruleById('CB-PAIR-JUP-5'), houseA: 5, boundPlanet: 'Jupiter', connected: jupiter.connectedToFifth,
      evidence: jupiter.connectedToFifth ? 'Jupiter is connected (placement/conjunction/aspect) to the 5th house/lord.' : 'Jupiter shows no direct connection to the 5th house/lord.'
    });

    const connectedCount = relationships.filter(r => r.connected).length;
    const supportiveCount = [second, fifth, ninth, eleventh].filter(h => h.result === 'Supportive' || h.result === 'Mildly supportive').length + connectedCount;
    const challengingCount = [second, fifth, ninth, eleventh].filter(h => h.result === 'Challenging context').length;
    const overall = connectedCount >= 2 && fifth.result !== 'Challenging context'
      ? 'The natal chart shows an astrologically supportive indication for children/progeny.'
      : connectedCount === 1 ? 'The natal chart shows a single moderate astrological indication related to children/progeny.'
      : 'The natal chart shows limited astrological indication in this area; this reflects classical house analysis only, not a medical or fertility assessment.';

    return { secondHouse: second, fifthHouse: fifth, ninthHouse: ninth, eleventhHouse: eleventh, jupiter, moon, venus, sun, saturn, relationships, connectedCount, overall };
  };

  // ---------------------------------------------------------------
  // 4. VIMSHOTTARI DASHA — Children-Promise Activation Map (Steps 9-11)
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.childFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (CHILD_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => CHILD_HOUSES.includes(h)).join(', ')}.`);
    if (CHILD_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const fifth = NS.getHouseSnapshot(5), eleventh = NS.getHouseSnapshot(11);
    if (lordName === fifth.lord) factors.push(`${lordName} is the 5th lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    if (lordName === 'Jupiter') factors.push('Jupiter is the natural children significator (Putra Karaka).');
    const fifthConnection = lordName === fifth.lord || p.conjunctWith.includes(fifth.lord) || p.aspectedBy.includes(fifth.lord) || lordName === 'Jupiter' && p.house === 5;
    if (fifthConnection && lordName !== fifth.lord) factors.push(`${lordName} is connected to the 5th lord (${fifth.lord}) by conjunction/aspect.`);
    const d7 = NS.getD7();
    const pD7 = d7.planets.find(x => x.name === lordName);
    const d7Confirmation = pD7.d7House === 5 || [d7.fifthLord, d7.ninthLord, d7.eleventhLord].includes(lordName);
    if (d7Confirmation) factors.push(`${lordName} is connected to the D7 children-promise axis.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, fifthConnection, d7Confirmation };
  };

  NS.buildChildActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.childFactorsForLord(md.lord);
        const adFactors = NS.childFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.childFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const fifthConnection = mdFactors.fifthConnection || adFactors.fifthConnection || pdFactors.fifthConnection;
          const d7Confirmation = mdFactors.d7Confirmation || adFactors.d7Confirmation || pdFactors.d7Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, fifthConnection, d7Confirmation, matchCount, reasons });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 5. TRANSIT (Steps 13-15) — Jupiter primary, Saturn contextual,
  //    Rahu/Ketu secondary, all supporting confirmation only.
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const fifth = NS.getHouseSnapshot(5), ninth = NS.getHouseSnapshot(9), eleventh = NS.getHouseSnapshot(11), second = NS.getHouseSnapshot(2);
    const moonNatal = NS.getPlanetSnapshot('Moon');
    const fifthLordNatal = NS.getPlanetSnapshot(fifth.lord);

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
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === fifthLordNatal.signIndex) || signIdx === fifthLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 5th lord's sign (${fifthLordNatal.sign}).`); }
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === moonNatal.signIndex) || signIdx === moonNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting natal Moon.`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [5, 9, 11], 'CB-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [5, 2, 11], 'CB-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [5, 2, 11], 'CB-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [5, 2, 11], 'CB-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 6. EVENT CLASSIFICATION (Step 19) — language constrained per the
  //    spec's sensitivity requirement; never "guaranteed", always
  //    "astrologically supportive" / "candidate window".
  // ---------------------------------------------------------------
  NS.classifyWindow = function (candidate, d7, transit, natalPromise) {
    const d7Confirms = d7.points >= 3;
    const strongFifth = natalPromise.fifthHouse.result === 'Supportive';
    const strongJupiter = natalPromise.jupiter.result === 'Supportive' || natalPromise.jupiter.result === 'Mildly supportive';
    const strongSupport = candidate.activatedHouses.includes(11) && strongFifth;

    if (strongFifth && strongJupiter && d7Confirms && candidate.fifthConnection && (transit.jupiter.active || transit.saturn.active) && strongSupport) {
      return { label: 'Strong Childbirth Window (astrologically supportive — not a medical guarantee)', rule: ruleById('CB-EVENT-001') };
    }
    if (strongFifth && d7Confirms && transit.jupiter.active && !strongSupport) {
      return { label: 'Conception / Pregnancy Support Window (astrologically supportive; childbirth may follow later)', rule: ruleById('CB-EVENT-001') };
    }
    if (candidate.activatedHouses.some(h => [2, 5, 11].includes(h)) && !d7Confirms) {
      return { label: 'Child-Related Family Development (evidence not specific enough to narrow to childbirth timing)', rule: ruleById('CB-EVENT-001') };
    }
    if (strongFifth && !d7Confirms) {
      return { label: 'Delayed / Conditional Window (natal promise present; timing confirmation is mixed)', rule: ruleById('CB-EVENT-001') };
    }
    return { label: 'Period of Interest (evidence insufficient for a specific classification)', rule: ruleById('CB-EVENT-001') };
  };

  // ---------------------------------------------------------------
  // 7. OPTIONAL PARTNER/SPOUSE CROSS-CHECK (Step 16) — reuses the
  //    app's existing generateBirthChart() function (the same one
  //    Kundali Matching already uses), never a second chart engine.
  // ---------------------------------------------------------------
  NS.assessPartnerChart = function (birthUtc, lat, lon) {
    const built = generateBirthChart(birthUtc, lat, lon);
    const partnerChart = { planets: built.planets, ascendant: built.ascendant };
    const promise = NS.assessNatalChildrenPromise(partnerChart);
    const d7 = (function () {
      const d7data = NS.getD7(partnerChart);
      const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
      function dig(name) { const x = d7data.planets.find(p => p.name === name); return x ? x.d7Dignity : 'Neutral'; }
      let points = 0;
      if (strong.includes(dig(d7data.fifthLord))) points += 2;
      if (strong.includes(dig('Jupiter'))) points += 2;
      if (strong.includes(dig(d7data.ninthLord))) points += 1;
      if (strong.includes(dig(d7data.eleventhLord))) points += 1;
      const level = points >= 5 ? 'Strong D7 confirmation' : points >= 3 ? 'D7 confirmation' : points >= 2 ? 'Partial D7 confirmation' : points >= 1 ? 'Mixed D7 indication' : 'Weak D7 confirmation';
      return { d7: d7data, points, level };
    })();
    return { promise, d7, rule: ruleById('CB-PARTNER-001') };
  };

  NS.compareWithPartner = function (primaryPromise, partnerResult) {
    const convergence = [];
    if (primaryPromise.fifthHouse.result === 'Supportive' && partnerResult.promise.fifthHouse.result === 'Supportive') convergence.push('Both charts independently show a supportive 5th house.');
    if (primaryPromise.jupiter.connectedToFifth && partnerResult.promise.jupiter.connectedToFifth) convergence.push('Both charts independently show Jupiter connected to the 5th house.');
    if (partnerResult.d7.points >= 3) convergence.push(`Partner chart D7: ${partnerResult.d7.level}.`);
    return { convergencePoints: convergence.length, convergence, interpretation: convergence.length >= 2 ? 'Both charts show independent, converging astrological support.' : convergence.length === 1 ? 'One area of convergence found between the two charts.' : 'No strong convergence found between the two charts for this factor set.' };
  };

  // ---------------------------------------------------------------
  // 8. CANDIDATE WINDOWS (Step 18)
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
    const activationMap = NS.buildChildActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d7 = NS.assessD7Confirmation();
    const natalPromise = NS.assessNatalChildrenPromise();

    const evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const event = NS.classifyWindow(c, d7, transit, natalPromise);
      const convergenceFactors = [c.fifthConnection, c.d7Confirmation, transit.jupiter.active, transit.saturn.active, c.matchCount >= 3].filter(Boolean).length;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      return Object.assign({}, c, { transit, event, convergenceFactors, qualification });
    }).filter(c => c.qualification !== 'weak');

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    return { available: true, windows: merged };
  };

  // ---------------------------------------------------------------
  // 9. HISTORICAL VALIDATION (Step 24)
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
    function activated(lordName) { return lordName ? NS.childFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.childFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d7 = NS.assessD7Confirmation();
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      secondActivation: houseActivated(2), fifthActivation: houseActivated(5), eleventhActivation: houseActivated(11),
      jupiterNatalConnection: lords.includes('Jupiter') || lords.some(activated),
      d7Level: d7.level, jupiterTransitActive: transit.jupiter.active, saturnTransitActive: transit.saturn.active
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Natal Promise', anchor: 'cb-sec-promise' },
    { id: 2, label: '5th house / 5th lord analysed', anchor: 'cb-sec-promise' },
    { id: 3, label: 'Jupiter supports progeny indication', anchor: 'cb-sec-promise' },
    { id: 4, label: '2nd supports family expansion', anchor: 'cb-sec-promise' },
    { id: 5, label: '11th supports fulfilment', anchor: 'cb-sec-promise' },
    { id: 6, label: 'Mahadasha activates 5th', anchor: 'cb-sec-dasha' },
    { id: 7, label: 'Antardasha activates Jupiter/5th lord', anchor: 'cb-sec-dasha' },
    { id: 8, label: 'Pratyantardasha activates supporting factor', anchor: 'cb-sec-dasha' },
    { id: 9, label: 'D7 confirms child-related promise', anchor: 'cb-sec-d7' },
    { id: 10, label: 'Jupiter transit supports 5th', anchor: 'cb-sec-windows' },
    { id: 11, label: 'Saturn provides contextual timing', anchor: 'cb-sec-windows' },
    { id: 12, label: 'Candidate childbirth window', anchor: 'cb-sec-windows' }
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
    const natalPromise = NS.assessNatalChildrenPromise();
    log(calculationLog, '[02] 2nd/5th/9th/11th houses and Jupiter/Moon/Venus/Sun/Saturn analysed');
    const d7 = NS.assessD7Confirmation();
    log(calculationLog, '[03] D7 (Saptamsha) confirmation computed: ' + d7.level);

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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.childFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.childFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.childFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[05] Children-Promise Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon);
      log(calculationLog, '[06] Candidate childbirth windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['CB-NATAL-002', 'CB-NATAL-005', 'CB-NATAL-009', 'CB-NATAL-011', 'CB-NATAL-812', 'CB-NATAL-JUPITER', 'CB-NATAL-MOON', 'CB-NATAL-VENUS', 'CB-NATAL-SUN', 'CB-NATAL-SATURN', 'CB-PAIR-5-11', 'CB-PAIR-5-2', 'CB-PAIR-JUP-5', 'CB-PAIR-9-5', 'CB-D7-001', 'CB-MEDICAL-001']);
    if (windowsResult.available) { rulesUsedIds.add('CB-DASHA-001'); rulesUsedIds.add('CB-TRANSIT-JUP'); rulesUsedIds.add('CB-TRANSIT-SAT'); rulesUsedIds.add('CB-TRANSIT-NODES'); rulesUsedIds.add('CB-EVENT-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, d7Confirmation: d7, currentDasha,
      candidateWindows: windowsResult.windows, horizonYears: horizon,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
