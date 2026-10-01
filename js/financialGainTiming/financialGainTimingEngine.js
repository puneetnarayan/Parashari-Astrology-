/* =========================================================
   FINANCIAL GAIN / WEALTH ACCUMULATION TIMING — pure calculation
   engine. Parashari/Vimshottari method only: no KP sub-lords/
   significators/ruling-planets, no Western technique. Reuses this
   app's existing chart/dignity/aspect/dasha/divisional-chart/transit
   calculations throughout — same architecture as the seven prior
   timing modules, with financial-promise-specific houses/
   significators/rules, a 10-type event classification, a gain-vs-
   wealth-accumulation distinction, and a cashflow/net-worth/relief
   tagging layer.

   IMPORTANT: this is an event-timing module, not financial advice —
   no function here returns a monetary amount, a guarantee, or an
   investment recommendation; see FIN-DISCLAIMER-001.

   Exposed only as window.FinancialGainTiming (namespaced). UI code
   lives entirely in financialGainTimingUI.js — this file returns
   plain data only.
   ========================================================= */

window.FinancialGainTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, horizon, result }

  const FINANCIAL_HOUSES = [2, 4, 5, 6, 8, 9, 10, 11, 12];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[FinancialGainTiming]', text); }
  function ruleById(id) { return (window.FINANCIAL_TIMING_RULES || []).find(r => r.id === id); }

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
      house: Number(p.house), dignityTier: dignity.tier, retrograde: !!p.retrograde, combust: !!p.combust,
      nakshatra: p.nakshatra, conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || []
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
  // 2. D2 (HORA) — reuses vargaPosition('D2'), the app's EXISTING
  //    divisional-chart engine. No new D2 implementation.
  // ---------------------------------------------------------------
  NS.getD2 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    try {
      const ascD2 = vargaPosition(chart.ascendant.longitude, 'D2');
      const ascD2SignIndex = SIGNS.indexOf(ascD2.sign);
      const d2LagnaLord = SIGN_LORD[ascD2.sign];
      function houseSign(h) { return SIGNS[(ascD2SignIndex + h - 1) % 12]; }
      const planets = chart.planets.map(p => {
        const d2 = vargaPosition(p.longitude, 'D2');
        const isClassical = SHADBALA_PLANETS.includes(p.name);
        const d2DegreeInSign = normalizeDegrees(d2.longitude) % 30;
        const d2Dignity = isClassical ? detailedDignity(p.name, d2.sign, d2DegreeInSign).tier : 'Neutral';
        const d2House = ((SIGNS.indexOf(d2.sign) - ascD2SignIndex + 12) % 12) + 1;
        return { name: p.name, d2Sign: d2.sign, d2House, d2Dignity };
      });
      return { available: true, ascendantSign: ascD2.sign, lagnaLord: d2LagnaLord, secondSign: houseSign(2), secondLord: SIGN_LORD[houseSign(2)], planets };
    } catch (e) {
      return { available: false, reason: 'D2 (Hora) could not be computed for this chart.' };
    }
  };

  NS.assessD2Confirmation = function () {
    const d2 = NS.getD2();
    if (!d2.available) return { available: false, level: 'D2 confirmation unavailable', evidence: [d2.reason], rule: ruleById('FIN-D2-001') };
    const strong = ['Exalted', 'Own Sign', 'Moolatrikona'];
    function dig(name) { const x = d2.planets.find(p => p.name === name); return x ? x.d2Dignity : 'Neutral'; }
    let points = 0;
    const evidence = [];
    if (strong.includes(dig(d2.secondLord))) { points += 2; evidence.push(`D2 2nd lord (${d2.secondLord}) is ${dig(d2.secondLord)} in D2.`); }
    else if (dig(d2.secondLord) === 'Debilitated') evidence.push(`D2 2nd lord (${d2.secondLord}) is Debilitated in D2.`);
    if (strong.includes(dig(d2.lagnaLord))) { points += 1; evidence.push(`D2 Lagna lord (${d2.lagnaLord}) is ${dig(d2.lagnaLord)} in D2.`); }
    if (strong.includes(dig('Jupiter'))) { points += 1; evidence.push(`Jupiter is ${dig('Jupiter')} in D2.`); }
    if (strong.includes(dig('Venus'))) { points += 1; evidence.push(`Venus is ${dig('Venus')} in D2.`); }
    if (!evidence.length) evidence.push('No strong D2 confirmation factors found for the wealth-capacity axis (2nd/Lagna lords, Jupiter, Venus).');
    const level = points >= 4 ? 'Strong D2 confirmation' : points >= 2 ? 'D2 confirmation' : points >= 1 ? 'Partial D2 confirmation' : 'Mixed D2 indication';
    return { available: true, d2, points, level, evidence, rule: ruleById('FIN-D2-001') };
  };

  // ---------------------------------------------------------------
  // 3. NATAL FINANCIAL PROMISE (Sections 4, 7, 9)
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
      occupants: h.occupants, aspectingHere: h.aspectingHere, lordHouse: Number(lordP.house),
      lordConjunctions: lordP.conjunctWith || [], lordAspects: lordP.aspectedBy || [],
      lordRetrograde: !!lordP.retrograde, lordCombust: !!lordP.combust, lordNakshatra: lordP.nakshatra,
      evidence: [
        `${houseNum}th house is ${h.sign}, lord ${h.lord} in ${lordP.sign}, house ${lordP.house} (${dignity}).`,
        h.occupants.length ? `Occupants: ${h.occupants.join(', ')}.` : 'No occupants.',
        h.aspectingHere.length ? `Aspected by: ${h.aspectingHere.join(', ')}.` : 'No aspects received.',
        (lordP.conjunctWith || []).length ? `Lord conjunct: ${lordP.conjunctWith.join(', ')}.` : 'Lord has no conjunctions.',
        lordInDusthana ? `${h.lord} occupies a Dusthana house (${lordP.house}).` : lordWellPlaced ? `${h.lord} occupies a Kendra/Trikona house (${lordP.house}).` : `${h.lord} occupies a Panapara/Upachaya house (${lordP.house}).`
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

  NS.assessNatalFinancialPromise = function () {
    const chart = NS.getChartData();
    const second = classifyHouse(2, 'FIN-NATAL-002');
    const fourth = classifyHouse(4, 'FIN-NATAL-004');
    const fifth = classifyHouse(5, 'FIN-NATAL-005');
    const sixth = classifyHouse(6, 'FIN-NATAL-006');
    const eighth = classifyHouse(8, 'FIN-NATAL-008');
    const ninth = classifyHouse(9, 'FIN-NATAL-009');
    const tenth = classifyHouse(10, 'FIN-NATAL-010');
    const eleventh = classifyHouse(11, 'FIN-NATAL-011');
    const twelfth = classifyHouse(12, 'FIN-NATAL-012');
    const jupiter = classifyKaraka('Jupiter', 'FIN-NATAL-JUPITER', 2);
    const venus = classifyKaraka('Venus', 'FIN-NATAL-VENUS', 2);
    const mercury = classifyKaraka('Mercury', 'FIN-NATAL-MERCURY', 11);
    const sun = classifyKaraka('Sun', 'FIN-NATAL-SUN', 10);
    const saturn = classifyKaraka('Saturn', 'FIN-NATAL-SATURN', 2);
    const moon = classifyKaraka('Moon', 'FIN-NATAL-MOON', 11);

    const secondH = NS.getHouseSnapshot(2), fourthH = NS.getHouseSnapshot(4), fifthH = NS.getHouseSnapshot(5), ninthH = NS.getHouseSnapshot(9), eleventhH = NS.getHouseSnapshot(11), tenthH = NS.getHouseSnapshot(10), sixthH = NS.getHouseSnapshot(6), eighthH = NS.getHouseSnapshot(8), twelfthH = NS.getHouseSnapshot(12);

    const gainPairs = [
      { id: 'FIN-PAIR-2-11', a: secondH, b: eleventhH }, { id: 'FIN-PAIR-2-9', a: secondH, b: ninthH },
      { id: 'FIN-PAIR-5-11', a: fifthH, b: eleventhH }, { id: 'FIN-PAIR-9-11', a: ninthH, b: eleventhH },
      { id: 'FIN-PAIR-2-5', a: secondH, b: fifthH }
    ];
    const careerIncomePairs = [
      { id: 'FIN-PAIR-10-2', a: tenthH, b: secondH }, { id: 'FIN-PAIR-10-11', a: tenthH, b: eleventhH },
      { id: 'FIN-PAIR-6-2', a: sixthH, b: secondH }
    ];
    const inheritancePairs = [
      { id: 'FIN-PAIR-2-8', a: secondH, b: eighthH }, { id: 'FIN-PAIR-8-11', a: eighthH, b: eleventhH }
    ];

    function buildRelationships(pairs) {
      return pairs.map(pair => {
        const rel = housesConnected(pair.a, pair.b, chart);
        return { rule: ruleById(pair.id), houseA: pair.a.house, houseB: pair.b.house, connected: rel.connected, evidence: rel.how };
      });
    }
    const gainRelationships = buildRelationships(gainPairs);
    const careerIncomeRelationships = buildRelationships(careerIncomePairs);
    const inheritanceRelationships = buildRelationships(inheritancePairs);
    const businessConnected = gainRelationships.some(r => r.connected) && careerIncomeRelationships.some(r => r.connected) &&
      (mercury.result === 'Strong' || mercury.result === 'Supporting' || jupiter.result === 'Strong' || jupiter.result === 'Supporting');
    const businessRelationship = { rule: ruleById('FIN-BUSINESS-2-5-10-11'), connected: businessConnected,
      evidence: businessConnected ? '2nd/5th/10th/11th convergence found, with Mercury/Jupiter support — business-profit signature present.' : 'No sufficient 2nd/5th/10th/11th convergence with Mercury/Jupiter support for a business-profit signature.' };

    // Financial leakage / pressure context (never a standalone loss label).
    const leakagePairs = [
      { a: secondH, b: twelfthH }, { a: eleventhH, b: twelfthH }, { a: sixthH, b: twelfthH }
    ];
    const leakageConnected = leakagePairs.some(pair => housesConnected(pair.a, pair.b, chart).connected);
    const leakageEvidence = leakagePairs.map(pair => housesConnected(pair.a, pair.b, chart).how);

    // Separate natal indicators (Section 9): income / wealth accumulation / investment / business / inheritance / asset realization.
    const incomeStrength = (careerIncomeRelationships.some(r => r.connected) ? 1 : 0) + (sixth.result === 'Strong' || sixth.result === 'Supporting' ? 1 : 0) + (tenth.result === 'Strong' || tenth.result === 'Supporting' ? 1 : 0);
    const wealthAccumulation = (second.result === 'Strong' || second.result === 'Supporting' ? 1 : 0) + (eleventh.result === 'Strong' || eleventh.result === 'Supporting' ? 1 : 0) + (gainRelationships.filter(r => r.connected).length);
    const investmentPotential = (fifth.result === 'Strong' || fifth.result === 'Supporting' ? 1 : 0) + (gainRelationships.find(r => r.rule.id === 'FIN-PAIR-5-11').connected ? 1 : 0) + (gainRelationships.find(r => r.rule.id === 'FIN-PAIR-2-5').connected ? 1 : 0);
    const businessProfitPotential = businessConnected ? 2 : 0;
    const inheritancePotential = inheritanceRelationships.filter(r => r.connected).length + (eighth.result === 'Strong' || eighth.result === 'Supporting' ? 1 : 0);
    const assetRealizationPotential = (fourth.result === 'Strong' || fourth.result === 'Supporting' ? 1 : 0) + (housesConnected(fourthH, eleventhH, chart).connected ? 1 : 0);

    function describe(score, label) {
      if (score >= 3) return `The chart shows strong supportive combinations for ${label}.`;
      if (score >= 1) return `The chart shows supportive combinations for ${label}.`;
      return `The chart does not provide strong evidence for ${label}.`;
    }

    const natalThemes = {
      income: { score: incomeStrength, text: describe(incomeStrength, 'career-linked income') },
      wealthAccumulation: { score: wealthAccumulation, text: describe(wealthAccumulation, 'accumulated wealth') },
      investment: { score: investmentPotential, text: describe(investmentPotential, 'investment potential') },
      businessProfit: { score: businessProfitPotential, text: describe(businessProfitPotential, 'business profit') },
      inheritance: { score: inheritancePotential, text: describe(inheritancePotential, 'inheritance/sudden-gain potential') },
      assetRealization: { score: assetRealizationPotential, text: describe(assetRealizationPotential, 'asset realization') }
    };
    const strongestTheme = Object.keys(natalThemes).reduce((best, key) => natalThemes[key].score > natalThemes[best].score ? key : best, 'income');

    return {
      secondHouse: second, fourthHouse: fourth, fifthHouse: fifth, sixthHouse: sixth, eighthHouse: eighth, ninthHouse: ninth, tenthHouse: tenth, eleventhHouse: eleventh, twelfthHouse: twelfth,
      jupiter, venus, mercury, sun, saturn, moon,
      gainRelationships, careerIncomeRelationships, inheritanceRelationships, businessRelationship,
      leakageConnected, leakageEvidence, leakageRule: ruleById('FIN-LEAKAGE-001'),
      natalThemes, strongestTheme
    };
  };

  // ---------------------------------------------------------------
  // 4. VIMSHOTTARI DASHA — Financial Activation Map (Section 11)
  // ---------------------------------------------------------------
  function planetHouseOwnership(name, ascSignIndex) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (SIGN_LORD[SIGNS[(ascSignIndex + h - 1) % 12]] === name) houses.push(h); }
    return houses;
  }

  NS.financialFactorsForLord = function (lordName) {
    const chart = NS.getChartData();
    const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
    const owned = planetHouseOwnership(lordName, ascSignIndex);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (FINANCIAL_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => FINANCIAL_HOUSES.includes(h)).join(', ')}.`);
    if (FINANCIAL_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    const second = NS.getHouseSnapshot(2), eleventh = NS.getHouseSnapshot(11);
    if (lordName === second.lord) factors.push(`${lordName} is the 2nd lord.`);
    if (lordName === eleventh.lord) factors.push(`${lordName} is the 11th lord.`);
    const second2nd = lordName === second.lord || p.conjunctWith.includes(second.lord) || p.aspectedBy.includes(second.lord);
    const eleventhConn = lordName === eleventh.lord || p.conjunctWith.includes(eleventh.lord) || p.aspectedBy.includes(eleventh.lord);
    if (second2nd && lordName !== second.lord) factors.push(`${lordName} is connected to the 2nd lord (${second.lord}) by conjunction/aspect.`);
    if (eleventhConn && lordName !== eleventh.lord) factors.push(`${lordName} is connected to the 11th lord (${eleventh.lord}) by conjunction/aspect.`);
    const employmentConn = activatedHouses.includes(10) || activatedHouses.includes(6);
    const assetConn = activatedHouses.includes(4);
    const expenditureConn = activatedHouses.includes(12);
    if (employmentConn) factors.push(`${lordName} connects to 10th/6th (employment income context).`);
    if (assetConn) factors.push(`${lordName} connects to 4th (asset/property realization context).`);
    if (expenditureConn) factors.push(`${lordName} connects to 12th (expenditure/outflow context — not automatically loss).`);
    const d2 = NS.assessD2Confirmation();
    let d2Confirmation = false;
    if (d2.available) {
      const pD2 = d2.d2.planets.find(x => x.name === lordName);
      d2Confirmation = pD2.d2House === 2 || [d2.d2.secondLord, d2.d2.lagnaLord].includes(lordName);
      if (d2Confirmation) factors.push(`${lordName} is connected to the D2 wealth-capacity axis.`);
    }
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, second2nd, eleventhConn, employmentConn, assetConn, expenditureConn, d2Confirmation };
  };

  NS.buildFinancialActivationMap = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.financialFactorsForLord(md.lord);
        const adFactors = NS.financialFactorsForLord(ad.lord);
        if (!mdFactors.relevant && !adFactors.relevant) return;
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.financialFactorsForLord(pd.lord);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          if (!reasons.length) return;
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const second2nd = mdFactors.second2nd || adFactors.second2nd || pdFactors.second2nd;
          const eleventhConn = mdFactors.eleventhConn || adFactors.eleventhConn || pdFactors.eleventhConn;
          const employmentConn = mdFactors.employmentConn || adFactors.employmentConn || pdFactors.employmentConn;
          const assetConn = mdFactors.assetConn || adFactors.assetConn || pdFactors.assetConn;
          const expenditureConn = mdFactors.expenditureConn || adFactors.expenditureConn || pdFactors.expenditureConn;
          const d2Confirmation = mdFactors.d2Confirmation || adFactors.d2Confirmation || pdFactors.d2Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const lordsInvolved = [md.lord, ad.lord, pd.lord];
          candidates.push({ mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord, startDate: pd.startDate, endDate: pd.endDate, activatedHouses, second2nd, eleventhConn, employmentConn, assetConn, expenditureConn, d2Confirmation, matchCount, reasons, lordsInvolved });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 5. TRANSIT (Section 13) — Jupiter/Saturn primary, Rahu/Ketu
  //    secondary, all supporting confirmation only.
  // ---------------------------------------------------------------
  NS.transitCheckAt = function (date) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const secondLordNatal = NS.getPlanetSnapshot(NS.getHouseSnapshot(2).lord);

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
      if (offsets.some(o => (signIdx + (o - 1)) % 12 === secondLordNatal.signIndex) || signIdx === secondLordNatal.signIndex) { active = true; reasons.push(`Transiting ${name} is conjunct/aspecting the natal 2nd lord's sign (${secondLordNatal.sign}).`); }
      if (!reasons.length) reasons.push(`No qualifying ${name} transit condition found for this date.`);
      return { active, house, sign: SIGNS[signIdx], reasons, rule: ruleById(ruleId) };
    }
    return {
      date,
      jupiter: checkBody('Jupiter', [2, 5, 9, 11], 'FIN-TRANSIT-JUP'),
      saturn: checkBody('Saturn', [2, 5, 9, 11], 'FIN-TRANSIT-SAT'),
      rahu: checkBody('Rahu', [2, 8, 11], 'FIN-TRANSIT-NODES'),
      ketu: checkBody('Ketu', [2, 8, 11], 'FIN-TRANSIT-NODES')
    };
  };

  // ---------------------------------------------------------------
  // 6. EVENT CLASSIFICATION (Section 10) + CASHFLOW/NET-WORTH/RELIEF
  //    TAGGING (Section 17) + WINDOW STRENGTH (Section 15, non-numeric)
  // ---------------------------------------------------------------
  NS.classifyEvent = function (candidate, d2, natalPromise) {
    const d2Confirms = d2.available && d2.points >= 2;
    const employment = candidate.employmentConn;
    const asset = candidate.assetConn;
    const expenditure = candidate.expenditureConn;
    const second = candidate.second2nd;
    const eleventh = candidate.eleventhConn;
    const lords = candidate.lordsInvolved;
    const investmentInvolved = candidate.activatedHouses.includes(5);
    const inheritanceInvolved = candidate.activatedHouses.includes(8);
    const businessSignature = natalPromise.businessRelationship.connected && second && eleventh && (lords.includes('Mercury') || lords.includes('Jupiter'));

    if (inheritanceInvolved && second && d2Confirms) return { label: 'Inheritance / Family Wealth', rule: ruleById('FIN-EVENT-001') };
    if (businessSignature) return { label: 'Business Profit', rule: ruleById('FIN-EVENT-001') };
    if (investmentInvolved && eleventh && d2Confirms) return { label: 'Investment Gain', rule: ruleById('FIN-EVENT-001') };
    if (asset && eleventh) return { label: 'Property / Asset Realization', rule: ruleById('FIN-EVENT-001') };
    if (employment && second && eleventh && d2Confirms) return { label: 'Salary / Income Increase', rule: ruleById('FIN-EVENT-001') };
    if (employment && eleventh && !second) return { label: 'Bonus / Reward', rule: ruleById('FIN-EVENT-001') };
    if (inheritanceInvolved && !second) return { label: 'Sudden Financial Gain', rule: ruleById('FIN-EVENT-001') };
    if (candidate.activatedHouses.includes(6) && expenditure && !eleventh) return { label: 'Debt Reduction / Financial Relief', rule: ruleById('FIN-EVENT-001') };
    if (second && eleventh && candidate.matchCount >= 3) return { label: 'Wealth Accumulation (candidate — requires sustained/repeated confirmation)', rule: ruleById('FIN-EVENT-001') };
    if (second || eleventh) return { label: 'Mixed Financial Improvement', rule: ruleById('FIN-EVENT-001') };
    return { label: 'Financial Activation (evidence insufficient for a specific classification)', rule: ruleById('FIN-EVENT-001') };
  };

  NS.classifyDimension = function (candidate) {
    const dims = [];
    if (candidate.eleventhConn) dims.push('Cashflow');
    if (candidate.second2nd || candidate.assetConn) dims.push('Asset / Net-Worth Growth');
    if (candidate.expenditureConn && candidate.activatedHouses.includes(6)) dims.push('Financial Relief');
    if (!dims.length) dims.push('Cashflow');
    return { dimensions: dims, rule: ruleById('FIN-CASHFLOW-NETWORTH-001') };
  };

  NS.assessWindowStrength = function (candidate, transit, d2) {
    const factors = [candidate.second2nd, candidate.eleventhConn, candidate.d2Confirmation, transit.jupiter.active, transit.saturn.active, candidate.matchCount >= 3].filter(Boolean).length;
    let label;
    if (factors >= 5) label = 'Strongly Supportive';
    else if (factors >= 4) label = 'Supportive';
    else if (factors >= 3) label = 'Moderately Supportive';
    else if (factors >= 2) label = 'Mixed';
    else label = 'Conditional';
    return { label, factorCount: factors, rule: ruleById('FIN-STRENGTH-001') };
  };

  NS.assessWealthAccumulationStrength = function (windows) {
    const wealthWindows = windows.filter(w => w.event.label.startsWith('Wealth Accumulation'));
    const gainWindows = windows.filter(w => !w.event.label.startsWith('Wealth Accumulation'));
    let label;
    if (wealthWindows.length >= 2) label = 'Supportive wealth-accumulation indication (sustained activation across multiple periods)';
    else if (wealthWindows.length === 1) label = 'Conditional wealth-accumulation indication (single period only — not yet confirmed as sustained)';
    else label = 'No sustained wealth-accumulation indication found; evidence points more toward one-time financial gain';
    return { label, wealthWindowCount: wealthWindows.length, gainWindowCount: gainWindows.length, rule: ruleById('FIN-GAIN-VS-WEALTH-001') };
  };

  // ---------------------------------------------------------------
  // 7. CANDIDATE WINDOWS (Section 14)
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

  NS.buildCandidateWindows = function (horizonYears, eventTypeFilter) {
    const activationMap = NS.buildFinancialActivationMap(horizonYears);
    if (!activationMap.available) return { available: false, windows: [] };
    const d2 = NS.assessD2Confirmation();
    const natalPromise = NS.assessNatalFinancialPromise();

    let evaluated = activationMap.candidates.map(c => {
      const midDate = new Date((c.startDate.getTime() + c.endDate.getTime()) / 2);
      const transit = NS.transitCheckAt(midDate);
      const event = NS.classifyEvent(c, d2, natalPromise);
      const dimension = NS.classifyDimension(c);
      const strength = NS.assessWindowStrength(c, transit, d2);
      const convergenceFactors = strength.factorCount;
      const qualification = convergenceFactors >= 4 ? 'strong candidate' : convergenceFactors >= 2 ? 'candidate' : 'weak';
      return Object.assign({}, c, { transit, event, dimension, strength, convergenceFactors, qualification });
    }).filter(c => c.qualification !== 'weak');

    if (eventTypeFilter && eventTypeFilter !== 'All') {
      evaluated = evaluated.filter(w => w.event.label.toLowerCase().includes(eventTypeFilter.toLowerCase()));
    }

    const merged = mergeAdjacent(evaluated).sort((a, b) => b.convergenceFactors - a.convergenceFactors);
    const wealthAccumulationAssessment = NS.assessWealthAccumulationStrength(merged);
    return { available: true, windows: merged, wealthAccumulationAssessment };
  };

  // ---------------------------------------------------------------
  // 8. HISTORICAL VALIDATION (Section 18)
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
    function activated(lordName) { return lordName ? NS.financialFactorsForLord(lordName).relevant : false; }
    const lords = [md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean);
    function houseActivated(h) { return lords.some(l => NS.financialFactorsForLord(l).activatedHouses.includes(h)); }
    const transit = NS.transitCheckAt(eventDate);
    const d2 = NS.assessD2Confirmation();
    const whatSystemWouldShow = lords.some(activated)
      ? (houseActivated(2) && houseActivated(11) ? 'Financially active period (2nd/11th activated) — would have been surfaced as a candidate window.' : 'Partial financial activation — may not have met the full candidate-window threshold.')
      : 'No significant financial-house activation found for this date — the system would NOT have surfaced this as a candidate window.';
    return {
      eventDate, eventType, inRange: true,
      mahadasha: md.lord, antardasha: ad ? ad.lord : null, pratyantar: pd ? pd.lord : null,
      secondActivation: houseActivated(2), eleventhActivation: houseActivated(11), fifthActivation: houseActivated(5), eighthActivation: houseActivated(8),
      d2Level: d2.available ? d2.level : 'Unavailable', jupiterActive: transit.jupiter.active, saturnActive: transit.saturn.active,
      whatSystemWouldShow
    };
  };

  // ---------------------------------------------------------------
  // CALCULATION SEQUENCE
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Financial Houses (2nd/5th/8th/9th/11th + supporting)', anchor: 'fin-sec-promise' },
    { id: 2, label: 'House Lords', anchor: 'fin-sec-promise' },
    { id: 3, label: 'Natal Financial Promise', anchor: 'fin-sec-promise' },
    { id: 4, label: 'Dasha Activation (MD -> AD -> PD)', anchor: 'fin-sec-dasha' },
    { id: 5, label: 'D2 Confirmation', anchor: 'fin-sec-d2' },
    { id: 6, label: 'Transit Confirmation', anchor: 'fin-sec-windows' },
    { id: 7, label: 'Candidate Windows', anchor: 'fin-sec-windows' },
    { id: 8, label: 'Event Classification', anchor: 'fin-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, eventTypeFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    const filter = eventTypeFilter || 'All';
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon && NS.cache.filter === filter) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth/chart data loaded');
    const natalPromise = NS.assessNatalFinancialPromise();
    log(calculationLog, '[02] 2nd/4th/5th/6th/8th/9th/10th/11th/12th houses and Jupiter/Venus/Mercury/Sun/Saturn/Moon analysed');
    const d2 = NS.assessD2Confirmation();
    log(calculationLog, '[03] D2 (Hora) confirmation computed: ' + d2.level);

    const missing = [];
    let windowsResult = { available: false, windows: [], wealthAccumulationAssessment: null };
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
          mahadasha: { lord: md.lord, startDate: md.startDate, endDate: md.endDate, factors: NS.financialFactorsForLord(md.lord) },
          antardasha: ad ? { lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, factors: NS.financialFactorsForLord(ad.lord) } : null,
          pratyantardasha: pd ? { lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, factors: NS.financialFactorsForLord(pd.lord) } : null
        };
      }
      log(calculationLog, '[05] Financial Activation Map built');
      windowsResult = NS.buildCandidateWindows(horizon, filter);
      log(calculationLog, '[06] Candidate financial windows generated: ' + windowsResult.windows.length);
    }

    const rulesUsedIds = new Set(['FIN-NATAL-002', 'FIN-NATAL-004', 'FIN-NATAL-005', 'FIN-NATAL-006', 'FIN-NATAL-008', 'FIN-NATAL-009', 'FIN-NATAL-010', 'FIN-NATAL-011', 'FIN-NATAL-012', 'FIN-NATAL-JUPITER', 'FIN-NATAL-VENUS', 'FIN-NATAL-MERCURY', 'FIN-NATAL-SUN', 'FIN-NATAL-SATURN', 'FIN-NATAL-MOON', 'FIN-PAIR-2-11', 'FIN-PAIR-2-9', 'FIN-PAIR-5-11', 'FIN-PAIR-9-11', 'FIN-PAIR-2-5', 'FIN-PAIR-10-2', 'FIN-PAIR-10-11', 'FIN-PAIR-6-2', 'FIN-PAIR-2-8', 'FIN-PAIR-8-11', 'FIN-BUSINESS-2-5-10-11', 'FIN-LEAKAGE-001', 'FIN-D2-001', 'FIN-DISCLAIMER-001']);
    if (windowsResult.available) { rulesUsedIds.add('FIN-DASHA-001'); rulesUsedIds.add('FIN-TRANSIT-JUP'); rulesUsedIds.add('FIN-TRANSIT-SAT'); rulesUsedIds.add('FIN-TRANSIT-NODES'); rulesUsedIds.add('FIN-EVENT-001'); rulesUsedIds.add('FIN-GAIN-VS-WEALTH-001'); rulesUsedIds.add('FIN-CASHFLOW-NETWORTH-001'); rulesUsedIds.add('FIN-STRENGTH-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      natalPromise, d2Confirmation: d2, currentDasha,
      candidateWindows: windowsResult.windows, wealthAccumulationAssessment: windowsResult.wealthAccumulationAssessment,
      horizonYears: horizon, eventTypeFilter: filter,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, horizon, filter, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
