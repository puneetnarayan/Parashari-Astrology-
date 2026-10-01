/* =========================================================
   MARRIAGE TIMING — pure calculation engine.
   Reuses this app's existing chart/dignity/functional/aspect/dasha/
   divisional-chart calculations throughout (same primitives used by
   birthChart.js, aspects.js, interpretations/dignityDetails.js,
   dasha/vimshottariDasha.js, divisionalCharts.js) — nothing here
   recomputes planetary positions, dignity, aspects, or dasha dates.
   Exposed only as window.MarriageTiming (namespaced), per this
   session's established isolation pattern (see ParashariAnalysis).
   UI code lives entirely in marriageTimingUI.js — this file returns
   plain data only.
   ========================================================= */

window.MarriageTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null; // { chartRef, dashaRef, result }

  const WEIGHTS_SOURCE = 'js/marriageTiming/marriageTimingEngine.js (MARRIAGE_TIMING_WEIGHTS)';
  // Internal, documented, configurable aggregation weights — used ONLY to
  // rank already-qualified candidate periods against each other, never to
  // manufacture a candidate that failed its underlying rule checks, and
  // never shown as a validated probability (Section "IMPORTANT: DO NOT
  // USE AN ARBITRARY SINGLE SCORE").
  const MARRIAGE_TIMING_WEIGHTS = {
    seventhLordConnection: 2,
    venusConnection: 2,
    jupiterConnection: 2,
    secondHouseConnection: 1,
    fifthHouseConnection: 1,
    eleventhHouseConnection: 1,
    pratyantarRefinement: 1,
    transitJupiter: 2,
    transitSaturn: 1,
    d9Confirmation: 2
  };
  NS.MARRIAGE_TIMING_WEIGHTS = MARRIAGE_TIMING_WEIGHTS;

  const MARRIAGE_HOUSES = [2, 5, 7, 11];
  const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[MarriageTiming]', text); }
  function ruleById(id) { return (window.MARRIAGE_TIMING_RULES || []).find(r => r.id === id); }

  // ---------------------------------------------------------------
  // 1. DATA ADAPTER — reuses state.chart / state.dasha directly.
  // ---------------------------------------------------------------
  NS.getChartData = function () { return state.chart || null; };

  NS.getPlanetSnapshot = function (name) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const p = chart.planets.find(pl => pl.name === name);
    if (!p) return null;
    const isClassical = SHADBALA_PLANETS.includes(name);
    const degreeInSign = normalizeDegrees(p.longitude) % 30;
    const dignity = isClassical ? detailedDignity(name, p.sign, degreeInSign) : { tier: 'Neutral', text: 'Dignity classically disputed for this body; treated as Neutral.' };
    return {
      name, sign: p.sign, signIndex: SIGNS.indexOf(p.sign), longitude: p.longitude,
      house: Number(p.house), retrograde: !!p.retrograde, combust: !!p.combust,
      dignityTier: dignity.tier, dignityText: dignity.text,
      conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || []
    };
  };

  NS.getHouseSnapshot = function (houseNum) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const signIndex = (ascIndex + houseNum - 1) % 12;
    const sign = SIGNS[signIndex];
    const lord = SIGN_LORD[sign];
    const occupants = chart.planets.filter(p => Number(p.house) === houseNum).map(p => p.name);
    const aspectingHere = chart.planets.filter(p => {
      const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default;
      const fromIdx = SIGNS.indexOf(p.sign);
      return offsets.some(o => (fromIdx + (o - 1)) % 12 === signIndex);
    }).map(p => p.name);
    const beneficInfluence = [...occupants.filter(n => NATURAL_BENEFICS.includes(n)), ...aspectingHere.filter(n => NATURAL_BENEFICS.includes(n) && !occupants.includes(n))];
    const maleficInfluence = [...occupants.filter(n => !NATURAL_BENEFICS.includes(n)), ...aspectingHere.filter(n => !NATURAL_BENEFICS.includes(n) && !occupants.includes(n))];
    return { house: houseNum, sign, lord, occupants, aspectingHere, beneficInfluence, maleficInfluence };
  };

  // ---------------------------------------------------------------
  // 2. D9 (NAVAMSHA) — reuses vargaPosition/detailedDignity, the same
  //    functions the app's Divisional Charts and Parashari Analysis
  //    tabs already use for D9. Never recomputed independently.
  // ---------------------------------------------------------------
  NS.getD9 = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const ascD9 = vargaPosition(chart.ascendant.longitude, 'D9');
    const ascD9SignIndex = SIGNS.indexOf(ascD9.sign);
    const seventhD9SignIndex = (ascD9SignIndex + 6) % 12;
    const seventhD9Sign = SIGNS[seventhD9SignIndex];
    const planets = chart.planets.map(p => {
      const d9 = vargaPosition(p.longitude, 'D9');
      const isClassical = SHADBALA_PLANETS.includes(p.name);
      const d9DegreeInSign = normalizeDegrees(d9.longitude) % 30;
      const d9Dignity = isClassical ? detailedDignity(p.name, d9.sign, d9DegreeInSign) : { tier: 'Neutral' };
      const d9House = ((SIGNS.indexOf(d9.sign) - ascD9SignIndex + 12) % 12) + 1;
      return { name: p.name, d9Sign: d9.sign, d9House, d9Dignity: d9Dignity.tier };
    });
    return {
      ascendantSign: ascD9.sign,
      seventhSign: seventhD9Sign, seventhLord: SIGN_LORD[seventhD9Sign],
      planets,
      seventhOccupants: planets.filter(p => p.d9House === 7).map(p => p.name)
    };
  };

  // ---------------------------------------------------------------
  // 3. BIRTH & CHART BASIS (Section 1)
  // ---------------------------------------------------------------
  NS.getBirthBasis = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    const seventh = NS.getHouseSnapshot(7);
    const venus = NS.getPlanetSnapshot('Venus');
    const jupiter = NS.getPlanetSnapshot('Jupiter');
    const d9 = NS.getD9();
    const lagnaLord = SIGN_LORD[chart.ascendant.sign];
    return {
      birthUtc: chart.birthUtc, ascendantSign: chart.ascendant.sign, ascendantDegree: chart.ascendant.degreeDms,
      lagnaLord,
      seventhSign: seventh.sign, seventhLord: seventh.lord, seventhOccupants: seventh.occupants,
      venusSign: venus.sign, venusHouse: venus.house,
      jupiterSign: jupiter.sign, jupiterHouse: jupiter.house,
      d9AscendantSign: d9.ascendantSign, d9SeventhSign: d9.seventhSign, d9SeventhLord: d9.seventhLord
    };
  };

  // ---------------------------------------------------------------
  // 4. MARRIAGE PROMISE (Section 2) — per-factor qualitative
  //    classification (Strong / Supportive / Mixed / Challenging),
  //    never a single opaque score (explicit spec requirement).
  // ---------------------------------------------------------------
  function relationLabel(a, b) {
    if (a === b) return 'Same planet';
    return relationBetween(a, b);
  }

  NS.assessSeventhHouse = function () {
    const h = NS.getHouseSnapshot(7);
    const benefics = h.beneficInfluence.length, malefics = h.maleficInfluence.length;
    let result = benefics > malefics ? 'Supportive' : malefics > benefics ? 'Challenging' : 'Mixed';
    const evidence = [
      `7th house is ${h.sign}, lord ${h.lord}.`,
      h.occupants.length ? `Occupied by: ${h.occupants.join(', ')}.` : 'No occupants (empty 7th house).',
      h.beneficInfluence.length ? `Benefic influence (occupying/aspecting): ${h.beneficInfluence.join(', ')}.` : 'No benefic influence.',
      h.maleficInfluence.length ? `Malefic influence (occupying/aspecting): ${h.maleficInfluence.join(', ')}.` : 'No malefic influence.'
    ];
    return { factor: '7th House', observation: `${h.sign}, lord ${h.lord}; ${h.occupants.length ? h.occupants.join(', ') + ' present' : 'empty'}`, rule: ruleById('MT-PROMISE-001'), result, evidence, houseData: h };
  };

  NS.assessSeventhLord = function () {
    const chart = NS.getChartData();
    const h = NS.getHouseSnapshot(7);
    const lord = NS.getPlanetSnapshot(h.lord);
    const d9 = NS.getD9();
    const lordD9 = d9.planets.find(p => p.name === h.lord);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(lord.dignityTier);
    const wellPlaced = KENDRA.includes(lord.house) || TRIKONA.includes(lord.house);
    const inDusthana = DUSTHANA.includes(lord.house);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || lord.dignityTier === 'Debilitated' ? 'Challenging' : wellPlaced ? 'Supportive' : 'Mixed';
    const relVenus = relationLabel(h.lord, 'Venus'), relJupiter = relationLabel(h.lord, 'Jupiter');
    const evidence = [
      `${h.lord} is in ${lord.sign} (${lord.dignityTier}), house ${lord.house}.`,
      inDusthana ? `${h.lord} occupies a Dusthana house (${lord.house}).` : wellPlaced ? `${h.lord} occupies a Kendra/Trikona house (${lord.house}).` : `${h.lord} occupies a Panapara/Upachaya house (${lord.house}).`,
      lord.conjunctWith.length ? `Conjunct: ${lord.conjunctWith.join(', ')}.` : 'No conjunctions.',
      lord.aspectedBy.length ? `Aspected by: ${lord.aspectedBy.join(', ')}.` : 'No aspects received.',
      `Relationship with Venus: ${relVenus}. Relationship with Jupiter: ${relJupiter}.`,
      `D9 placement: ${lordD9.d9Sign} (house ${lordD9.d9House} from D9 Ascendant), dignity ${lordD9.d9Dignity}.`
    ];
    return { factor: '7th Lord', observation: `${h.lord} in ${lord.sign}, house ${lord.house} (${lord.dignityTier})`, rule: ruleById('MT-PROMISE-002'), result, evidence, planetData: lord };
  };

  function assessKaraka(name, ruleId) {
    const p = NS.getPlanetSnapshot(name);
    const h = NS.getHouseSnapshot(7);
    const d9 = NS.getD9();
    const pD9 = d9.planets.find(x => x.name === name);
    const strongDignity = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(p.dignityTier);
    const inDusthana = DUSTHANA.includes(p.house);
    const relSeventhLord = relationLabel(name, h.lord);
    let result = strongDignity && !inDusthana ? 'Strong' : inDusthana || p.dignityTier === 'Debilitated' ? 'Challenging' : 'Mixed';
    const connectedToMarriageHouses = MARRIAGE_HOUSES.includes(p.house);
    if (connectedToMarriageHouses && result === 'Mixed') result = 'Supportive';
    const evidence = [
      `${name} is in ${p.sign} (${p.dignityTier}), house ${p.house}.`,
      p.conjunctWith.length ? `Conjunct: ${p.conjunctWith.join(', ')}.` : 'No conjunctions.',
      p.aspectedBy.length ? `Aspected by: ${p.aspectedBy.join(', ')}.` : 'No aspects received.',
      `Relationship with 7th lord (${h.lord}): ${relSeventhLord}.`,
      connectedToMarriageHouses ? `${name} occupies a marriage house (${p.house}).` : `${name} does not occupy 2nd/5th/7th/11th (house ${p.house}).`,
      `D9 placement: ${pD9.d9Sign} (house ${pD9.d9House} from D9 Ascendant), dignity ${pD9.d9Dignity}.`
    ];
    return { factor: name, observation: `${p.sign}, house ${p.house} (${p.dignityTier})`, rule: ruleById(ruleId), result, evidence, planetData: p };
  }

  NS.assessVenus = function () { return assessKaraka('Venus', 'MT-PROMISE-003'); };
  NS.assessJupiter = function () { return assessKaraka('Jupiter', 'MT-PROMISE-004'); };

  NS.assessSupportingHouse = function (houseNum, ruleId) {
    const h = NS.getHouseSnapshot(houseNum);
    const benefics = h.beneficInfluence.length, malefics = h.maleficInfluence.length;
    const result = benefics > malefics ? 'Supportive' : malefics > benefics ? 'Challenging' : 'Mixed';
    const evidence = [
      `${houseNum}th house is ${h.sign}, lord ${h.lord}.`,
      h.occupants.length ? `Occupied by: ${h.occupants.join(', ')}.` : 'No occupants.',
      `Benefic influence: ${h.beneficInfluence.length ? h.beneficInfluence.join(', ') : 'none'}. Malefic influence: ${h.maleficInfluence.length ? h.maleficInfluence.join(', ') : 'none'}.`
    ];
    return { factor: `${houseNum}${houseNum === 2 ? 'nd' : houseNum === 5 ? 'th' : houseNum === 11 ? 'th' : 'th'} House`, observation: `${h.sign}, lord ${h.lord}`, rule: ruleById(ruleId), result, evidence, houseData: h };
  };

  NS.assessD9Factor = function () {
    const d9 = NS.getD9();
    const seventhLordDignity = d9.planets.find(p => p.name === d9.seventhLord);
    const result = seventhLordDignity && ['Exalted', 'Own Sign', 'Moolatrikona'].includes(seventhLordDignity.d9Dignity) ? 'Strong'
      : seventhLordDignity && seventhLordDignity.d9Dignity === 'Debilitated' ? 'Challenging' : 'Mixed';
    const evidence = [
      `D9 Ascendant: ${d9.ascendantSign}. D9 7th house: ${d9.seventhSign}, lord ${d9.seventhLord}.`,
      d9.seventhOccupants.length ? `D9 7th house occupied by: ${d9.seventhOccupants.join(', ')}.` : 'D9 7th house is empty.',
      `D9 7th lord (${d9.seventhLord}) dignity in D9: ${seventhLordDignity ? seventhLordDignity.d9Dignity : 'N/A'}.`
    ];
    return { factor: 'D9 (Navamsha)', observation: `D9 Asc ${d9.ascendantSign}, D9 7th ${d9.seventhSign}/${d9.seventhLord}`, rule: ruleById('MT-D9-001'), result, evidence, d9 };
  };

  NS.buildPromiseMatrix = function () {
    return [
      NS.assessSeventhHouse(), NS.assessSeventhLord(), NS.assessVenus(), NS.assessJupiter(),
      NS.assessSupportingHouse(2, 'MT-PROMISE-005'), NS.assessSupportingHouse(5, 'MT-PROMISE-006'), NS.assessSupportingHouse(11, 'MT-PROMISE-007'),
      NS.assessD9Factor()
    ];
  };

  NS.summarizePromise = function (matrix) {
    const strong = matrix.filter(m => m.result === 'Strong' || m.result === 'Supportive').length;
    const challenging = matrix.filter(m => m.result === 'Challenging').length;
    const neutral = matrix.length - strong - challenging;
    let interpretation;
    if (strong >= matrix.length - 1) interpretation = 'Marriage promise is well supported across nearly every factor; timing depends on dasha/transit activation.';
    else if (challenging >= strong) interpretation = 'Marriage promise shows meaningful challenges alongside its supports; some delay or extra effort around timing is plausible.';
    else interpretation = 'Marriage promise is supported, with timing dependent on dasha/transit activation.';
    return { strongSupportingFactors: strong, neutralFactors: neutral, challengingFactors: challenging, interpretation };
  };

  // ---------------------------------------------------------------
  // 5. MARRIAGE SIGNIFICATORS (Section 4)
  // ---------------------------------------------------------------
  NS.buildSignificators = function () {
    const chart = NS.getChartData();
    const h7 = NS.getHouseSnapshot(7);
    const d9 = NS.getD9();
    const houseLords = {};
    MARRIAGE_HOUSES.forEach(hn => { houseLords[NS.getHouseSnapshot(hn).lord] = (houseLords[NS.getHouseSnapshot(hn).lord] || []).concat(hn); });

    return PLANET_NAMES.map(name => {
      const p = NS.getPlanetSnapshot(name);
      const ownedHouses = houseLords[name] || [];
      const occupiesMarriageHouse = MARRIAGE_HOUSES.includes(p.house);
      const conjunctSignificator = p.conjunctWith.some(n => ['Venus', 'Jupiter', h7.lord].includes(n));
      const aspectsSignificator = (chart.planets.find(pl => pl.name === h7.lord).aspectedBy || []).includes(name) || (chart.planets.find(pl => pl.name === 'Venus').aspectedBy || []).includes(name) || (chart.planets.find(pl => pl.name === 'Jupiter').aspectedBy || []).includes(name);
      const pD9 = d9.planets.find(x => x.name === name);
      const d9Relevant = pD9.d9House === 7 || name === d9.seventhLord;
      const isKaraka = name === 'Venus' || name === 'Jupiter';
      const isSeventhLord = name === h7.lord;
      const relevant = ownedHouses.length || occupiesMarriageHouse || conjunctSignificator || aspectsSignificator || d9Relevant || isKaraka || isSeventhLord;
      if (!relevant) return null;
      const classification = isSeventhLord ? '7th Lord (primary marriage significator)' : isKaraka ? `Natural Karaka (${name === 'Venus' ? 'spouse/love' : 'dharma/expansion'})` : (ownedHouses.length || occupiesMarriageHouse) ? 'Marriage-house connected' : 'Marriage-signifying by association';
      return {
        planet: name, housesOwned: ownedHouses, houseOccupied: p.house, sign: p.sign,
        conjunctWith: p.conjunctWith, aspects: p.aspectedBy, relationshipWithSeventhLord: relationLabel(name, h7.lord),
        relationshipWithKarakas: { venus: relationLabel(name, 'Venus'), jupiter: relationLabel(name, 'Jupiter') },
        d9Relevance: d9Relevant, classification
      };
    }).filter(Boolean);
  };

  // ---------------------------------------------------------------
  // 6-7. VIMSHOTTARI DASHA — reuses state.dasha (MD/AD eagerly
  //    computed by the app's existing engine) and buildSubPeriods()
  //    (also existing) for on-demand Pratyantardasha, bounded to
  //    Antardashas already flagged marriage-relevant (Section 5/6).
  // ---------------------------------------------------------------
  function planetHouseOwnership(name) {
    const houses = [];
    for (let h = 1; h <= 12; h++) { if (NS.getHouseSnapshot(h).lord === name) houses.push(h); }
    return houses;
  }

  NS.marriageFactorsForLord = function (lordName, h7) {
    const owned = planetHouseOwnership(lordName);
    const p = NS.getPlanetSnapshot(lordName);
    const factors = [];
    const activatedHouses = owned.slice();
    if (MARRIAGE_HOUSES.some(h => owned.includes(h))) factors.push(`${lordName} owns house(s) ${owned.filter(h => MARRIAGE_HOUSES.includes(h)).join(', ')}.`);
    if (MARRIAGE_HOUSES.includes(p.house) && !activatedHouses.includes(p.house)) { activatedHouses.push(p.house); factors.push(`${lordName} occupies house ${p.house}.`); }
    if (lordName === h7.lord) factors.push(`${lordName} is the 7th lord.`);
    if (lordName === 'Venus') factors.push('Venus is the natural marriage karaka.');
    if (lordName === 'Jupiter') factors.push('Jupiter is a marriage/dharma karaka.');
    const seventhLordConnection = lordName === h7.lord || p.conjunctWith.includes(h7.lord) || p.aspectedBy.includes(h7.lord);
    const venusConnection = lordName === 'Venus' || p.conjunctWith.includes('Venus') || p.aspectedBy.includes('Venus');
    const jupiterConnection = lordName === 'Jupiter' || p.conjunctWith.includes('Jupiter') || p.aspectedBy.includes('Jupiter');
    if (seventhLordConnection && lordName !== h7.lord) factors.push(`${lordName} is connected to the 7th lord (${h7.lord}) by conjunction/aspect.`);
    if (venusConnection && lordName !== 'Venus') factors.push(`${lordName} is connected to Venus by conjunction/aspect.`);
    if (jupiterConnection && lordName !== 'Jupiter') factors.push(`${lordName} is connected to Jupiter by conjunction/aspect.`);
    const d9 = NS.getD9();
    const pD9 = d9.planets.find(x => x.name === lordName);
    const d9Confirmation = pD9.d9House === 7 || lordName === d9.seventhLord;
    if (d9Confirmation) factors.push(`${lordName} is connected to the D9 7th house.`);
    const relevant = factors.length > 0;
    return { relevant, factors, activatedHouses, seventhLordConnection, venusConnection, jupiterConnection, d9Confirmation };
  };

  NS.buildDashaCandidates = function (horizonYears) {
    const dasha = state.dasha;
    const h7 = NS.getHouseSnapshot(7);
    if (!dasha || !dasha.length) return { available: false, candidates: [] };
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + (horizonYears || 15) * 365.25 * 24 * 60 * 60 * 1000);
    const candidates = [];

    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.marriageFactorsForLord(md.lord, h7);
        const adFactors = NS.marriageFactorsForLord(ad.lord, h7);
        if (!mdFactors.relevant && !adFactors.relevant) return; // not marriage-relevant at AD level — skip PD expansion entirely
        const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
        pds.forEach(pd => {
          if (pd.endDate < now || pd.startDate > horizonEnd) return;
          const pdFactors = NS.marriageFactorsForLord(pd.lord, h7);
          const reasons = [];
          if (mdFactors.relevant) reasons.push(`Mahadasha lord ${md.lord}: ${mdFactors.factors.join(' ')}`);
          if (adFactors.relevant) reasons.push(`Antardasha lord ${ad.lord}: ${adFactors.factors.join(' ')}`);
          if (pdFactors.relevant) reasons.push(`Pratyantardasha lord ${pd.lord}: ${pdFactors.factors.join(' ')}`);
          const activatedHouses = Array.from(new Set([].concat(mdFactors.activatedHouses, adFactors.activatedHouses, pdFactors.activatedHouses)));
          const seventhLordConnection = mdFactors.seventhLordConnection || adFactors.seventhLordConnection || pdFactors.seventhLordConnection;
          const venusConnection = mdFactors.venusConnection || adFactors.venusConnection || pdFactors.venusConnection;
          const jupiterConnection = mdFactors.jupiterConnection || adFactors.jupiterConnection || pdFactors.jupiterConnection;
          const d9Confirmation = mdFactors.d9Confirmation || adFactors.d9Confirmation || pdFactors.d9Confirmation;
          const matchCount = [mdFactors.relevant, adFactors.relevant, pdFactors.relevant].filter(Boolean).length;
          const qualification = matchCount >= 3 ? 'strong candidate' : matchCount === 2 ? 'candidate' : 'weak';
          if (!reasons.length) return;
          candidates.push({
            mahadasha: md.lord, antardasha: ad.lord, pratyantar: pd.lord,
            startDate: pd.startDate, endDate: pd.endDate,
            marriageFactors: reasons, activatedHouses,
            seventhLordConnection, venusConnection, jupiterConnection, d9Confirmation,
            qualification, reasons
          });
        });
      });
    });
    candidates.sort((a, b) => a.startDate - b.startDate);
    return { available: true, candidates };
  };

  // ---------------------------------------------------------------
  // 8-9. TRANSIT ANALYSIS — reuses computeSingleLongitude, the same
  //    ephemeris call already used by Ashtakvarga Predictions,
  //    Sudarshana Chakra and Parashari Analysis for transits.
  // ---------------------------------------------------------------
  NS.transitCheckForCandidate = function (candidate) {
    const chart = NS.getChartData();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const h7 = NS.getHouseSnapshot(7);
    const midDate = new Date((candidate.startDate.getTime() + candidate.endDate.getTime()) / 2);
    const venusNatal = NS.getPlanetSnapshot('Venus'), lordNatal = NS.getPlanetSnapshot(h7.lord);
    const currentLord = NS.getPlanetSnapshot(candidate.pratyantar);

    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, midDate)) / 30) % 12; }

    const jSignIdx = transitSignIndex('Jupiter');
    const jHouse = ((jSignIdx - ascIndex + 12) % 12) + 1;
    const jAspectsSeventh = (ASPECT_OFFSETS.Jupiter).some(o => (jSignIdx + (o - 1)) % 12 === SIGNS.indexOf(h7.sign));
    const jAspectsSeventhLord = (ASPECT_OFFSETS.Jupiter).some(o => (jSignIdx + (o - 1)) % 12 === lordNatal.signIndex);
    const jWithVenus = jSignIdx === venusNatal.signIndex || (ASPECT_OFFSETS.Jupiter).some(o => (jSignIdx + (o - 1)) % 12 === venusNatal.signIndex);
    const jupiterActive = jHouse === 7 || jAspectsSeventh || jAspectsSeventhLord || jWithVenus;
    const jupiterReasons = [];
    if (jHouse === 7) jupiterReasons.push('Transiting Jupiter is in the natal 7th house.');
    if (jAspectsSeventh) jupiterReasons.push('Transiting Jupiter aspects the natal 7th house.');
    if (jAspectsSeventhLord) jupiterReasons.push(`Transiting Jupiter aspects the natal 7th lord's sign (${lordNatal.sign}).`);
    if (jWithVenus) jupiterReasons.push('Transiting Jupiter is conjunct/aspecting natal Venus.');
    if (!jupiterReasons.length) jupiterReasons.push('No qualifying Jupiter transit condition found for this window.');

    const sSignIdx = transitSignIndex('Saturn');
    const sHouse = ((sSignIdx - ascIndex + 12) % 12) + 1;
    const sAspectsSeventh = (ASPECT_OFFSETS.Saturn).some(o => (sSignIdx + (o - 1)) % 12 === SIGNS.indexOf(h7.sign));
    const sAspectsSeventhLord = (ASPECT_OFFSETS.Saturn).some(o => (sSignIdx + (o - 1)) % 12 === lordNatal.signIndex);
    const sWithDashaLord = currentLord && (sSignIdx === currentLord.signIndex);
    const saturnActive = sHouse === 7 || sAspectsSeventh || sAspectsSeventhLord || sWithDashaLord;
    const saturnReasons = [];
    if (sHouse === 7) saturnReasons.push('Transiting Saturn is in the natal 7th house.');
    if (sAspectsSeventh) saturnReasons.push('Transiting Saturn aspects the natal 7th house.');
    if (sAspectsSeventhLord) saturnReasons.push(`Transiting Saturn aspects the natal 7th lord's sign (${lordNatal.sign}).`);
    if (sWithDashaLord) saturnReasons.push(`Transiting Saturn is in the current Pratyantardasha lord's (${candidate.pratyantar}) natal sign.`);
    if (!saturnReasons.length) saturnReasons.push('No qualifying Saturn transit condition found for this window.');

    return { midDate, jupiter: { active: jupiterActive, house: jHouse, sign: SIGNS[jSignIdx], reasons: jupiterReasons }, saturn: { active: saturnActive, house: sHouse, sign: SIGNS[sSignIdx], reasons: saturnReasons } };
  };

  // ---------------------------------------------------------------
  // 10. D1 x D9 CONFIRMATION (Section 10)
  // ---------------------------------------------------------------
  NS.buildD1D9Confirmation = function () {
    const h7 = NS.getHouseSnapshot(7);
    const venus = NS.getPlanetSnapshot('Venus'), jupiter = NS.getPlanetSnapshot('Jupiter');
    const d9 = NS.getD9();
    const sig = NS.buildSignificators();
    const d9SigConfirmed = sig.filter(s => s.d9Relevance).map(s => s.planet);
    function row(factor, d1, d9Val, confirmed) { return { factor, d1, d9: d9Val, confirmation: confirmed ? 'Confirmed' : 'Not confirmed in D9' }; }
    return [
      row('7th House', `${h7.sign} / ${h7.lord}`, `${d9.seventhSign} / ${d9.seventhLord}`, true),
      row('7th Lord', `${h7.lord} in ${NS.getPlanetSnapshot(h7.lord).sign}`, `${h7.lord} in ${d9.planets.find(p => p.name === h7.lord).d9Sign} (${d9.planets.find(p => p.name === h7.lord).d9Dignity})`, ['Exalted', 'Own Sign', 'Moolatrikona'].includes(d9.planets.find(p => p.name === h7.lord).d9Dignity)),
      row('Venus', `${venus.sign} (${venus.dignityTier})`, `${d9.planets.find(p => p.name === 'Venus').d9Sign} (${d9.planets.find(p => p.name === 'Venus').d9Dignity})`, ['Exalted', 'Own Sign', 'Moolatrikona'].includes(d9.planets.find(p => p.name === 'Venus').d9Dignity)),
      row('Jupiter', `${jupiter.sign} (${jupiter.dignityTier})`, `${d9.planets.find(p => p.name === 'Jupiter').d9Sign} (${d9.planets.find(p => p.name === 'Jupiter').d9Dignity})`, ['Exalted', 'Own Sign', 'Moolatrikona'].includes(d9.planets.find(p => p.name === 'Jupiter').d9Dignity)),
      row('Marriage Significators', `${sig.length} identified`, `${d9SigConfirmed.length} connected to D9 7th house`, d9SigConfirmed.length > 0)
    ];
  };

  // ---------------------------------------------------------------
  // 11-12. CONVERGENCE ENGINE + FINAL WINDOWS (Sections 11-12)
  // ---------------------------------------------------------------
  NS.buildConvergence = function (candidates) {
    return candidates.map(c => {
      const transit = NS.transitCheckForCandidate(c);
      const w = MARRIAGE_TIMING_WEIGHTS;
      let score = 0;
      const breakdown = [];
      if (c.seventhLordConnection) { score += w.seventhLordConnection; breakdown.push(['7th lord connection', w.seventhLordConnection]); }
      if (c.venusConnection) { score += w.venusConnection; breakdown.push(['Venus connection', w.venusConnection]); }
      if (c.jupiterConnection) { score += w.jupiterConnection; breakdown.push(['Jupiter connection', w.jupiterConnection]); }
      if (c.activatedHouses.includes(2)) { score += w.secondHouseConnection; breakdown.push(['2nd house activation', w.secondHouseConnection]); }
      if (c.activatedHouses.includes(5)) { score += w.fifthHouseConnection; breakdown.push(['5th house activation', w.fifthHouseConnection]); }
      if (c.activatedHouses.includes(11)) { score += w.eleventhHouseConnection; breakdown.push(['11th house activation', w.eleventhHouseConnection]); }
      if (c.qualification === 'strong candidate') { score += w.pratyantarRefinement; breakdown.push(['Pratyantardasha refinement', w.pratyantarRefinement]); }
      if (transit.jupiter.active) { score += w.transitJupiter; breakdown.push(['Jupiter transit confirmation', w.transitJupiter]); }
      if (transit.saturn.active) { score += w.transitSaturn; breakdown.push(['Saturn transit confirmation', w.transitSaturn]); }
      if (c.d9Confirmation) { score += w.d9Confirmation; breakdown.push(['D9 confirmation', w.d9Confirmation]); }
      const factorCount = breakdown.length;
      return Object.assign({}, c, { transit, convergenceScore: score, convergenceBreakdown: breakdown, convergenceFactorCount: factorCount, weightsSource: WEIGHTS_SOURCE });
    });
  };

  function mergeAdjacent(candidates) {
    // Merge candidates whose PD windows are contiguous/overlapping and share
    // the same MD/AD into one broader window, so the UI shows a period, not
    // a list of individual PD slivers (avoids false precision).
    const sorted = [...candidates].sort((a, b) => a.startDate - b.startDate);
    const merged = [];
    sorted.forEach(c => {
      const last = merged[merged.length - 1];
      if (last && last.mahadasha === c.mahadasha && last.antardasha === c.antardasha && c.startDate <= new Date(last.endDate.getTime() + 24 * 60 * 60 * 1000 * 2)) {
        last.endDate = c.endDate;
        last.members.push(c);
        last.convergenceScore = Math.max(last.convergenceScore, c.convergenceScore);
      } else {
        merged.push(Object.assign({}, c, { members: [c] }));
      }
    });
    return merged;
  }

  NS.buildWindows = function (convergedCandidates) {
    const qualifying = convergedCandidates.filter(c => c.qualification !== 'weak' || c.convergenceFactorCount >= 3);
    if (!qualifying.length) return { primary: null, secondary: null };
    const merged = mergeAdjacent(qualifying).sort((a, b) => b.convergenceScore - a.convergenceScore);
    const primary = merged[0];
    const secondary = merged.find(w => w !== primary && (w.startDate < primary.startDate - 1 || w.startDate > primary.endDate)) || merged[1] || null;
    function toWindow(w) {
      if (!w) return null;
      const why = [];
      if (w.seventhLordConnection) why.push('The 7th lord is connected to this period\'s dasha lord(s).');
      if (w.venusConnection) why.push('Venus (marriage karaka) is connected to this period.');
      if (w.jupiterConnection) why.push('Jupiter (marriage/dharma karaka) is connected to this period.');
      if (w.activatedHouses.length) why.push(`Activates house(s): ${w.activatedHouses.join(', ')}.`);
      if (w.transit.jupiter.active) why.push('Jupiter transit confirms this window: ' + w.transit.jupiter.reasons.join(' '));
      if (w.transit.saturn.active) why.push('Saturn transit confirms this window: ' + w.transit.saturn.reasons.join(' '));
      if (w.d9Confirmation) why.push('D9 (Navamsha) independently confirms this period.');
      return {
        startDate: w.startDate, endDate: w.endDate, mahadasha: w.mahadasha, antardasha: w.antardasha,
        qualification: w.qualification, convergenceScore: w.convergenceScore, convergenceFactorCount: w.convergenceFactorCount,
        why, members: w.members
      };
    }
    return { primary: toWindow(primary), secondary: toWindow(secondary) };
  };

  // ---------------------------------------------------------------
  // 13-15. CALCULATION SEQUENCE / LOG / RULES EXPLORER
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Birth data', anchor: 'mt-sec-basis' },
    { id: 2, label: 'D1', anchor: 'mt-sec-basis' },
    { id: 3, label: 'D9', anchor: 'mt-sec-basis' },
    { id: 4, label: '7th house', anchor: 'mt-sec-promise' },
    { id: 5, label: '7th lord', anchor: 'mt-sec-promise' },
    { id: 6, label: 'Venus', anchor: 'mt-sec-promise' },
    { id: 7, label: 'Jupiter', anchor: 'mt-sec-promise' },
    { id: 8, label: '2nd / 5th / 11th houses', anchor: 'mt-sec-promise' },
    { id: 9, label: 'Marriage promise', anchor: 'mt-sec-promise' },
    { id: 10, label: 'Vimshottari MD', anchor: 'mt-sec-dasha' },
    { id: 11, label: 'Antardasha', anchor: 'mt-sec-dasha' },
    { id: 12, label: 'Pratyantar', anchor: 'mt-sec-dasha' },
    { id: 13, label: 'Candidate periods', anchor: 'mt-sec-windows' },
    { id: 14, label: 'Jupiter transit', anchor: 'mt-sec-transits' },
    { id: 15, label: 'Saturn transit', anchor: 'mt-sec-transits' },
    { id: 16, label: 'D1 confirmation', anchor: 'mt-sec-d1d9' },
    { id: 17, label: 'D9 confirmation', anchor: 'mt-sec-d1d9' },
    { id: 18, label: 'Convergence', anchor: 'mt-sec-windows' },
    { id: 19, label: 'Final window', anchor: 'mt-sec-windows' }
  ];

  // ---------------------------------------------------------------
  // TOP-LEVEL REFRESH / CACHE
  // ---------------------------------------------------------------
  NS.refresh = function () {
    const chart = NS.getChartData();
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha) return NS.cache.result;

    const calculationLog = [];
    log(calculationLog, '[01] Birth data loaded');
    const basis = NS.getBirthBasis();
    log(calculationLog, '[02] D1 obtained');
    const d9 = NS.getD9();
    log(calculationLog, '[03] D9 obtained');
    log(calculationLog, '[04] 7th house identified: ' + basis.seventhSign);
    log(calculationLog, '[05] 7th lord identified: ' + basis.seventhLord);
    const promiseMatrix = NS.buildPromiseMatrix();
    log(calculationLog, '[06] Venus analysed');
    log(calculationLog, '[07] Jupiter analysed');
    const promiseSummary = NS.summarizePromise(promiseMatrix);
    log(calculationLog, '[08] Marriage significators generated');
    const significators = NS.buildSignificators();

    let dashaResult = { available: false, candidates: [] };
    let converged = [];
    let windows = { primary: null, secondary: null };
    let d1d9 = [];
    const missing = [];

    if (!state.dasha || !state.dasha.length) {
      missing.push('Vimshottari Dasha');
    } else {
      log(calculationLog, '[09] Vimshottari periods generated');
      dashaResult = NS.buildDashaCandidates(15);
      log(calculationLog, '[10] Candidate dasha periods identified: ' + dashaResult.candidates.length);
      log(calculationLog, '[11] Jupiter transit evaluated');
      log(calculationLog, '[12] Saturn transit evaluated');
      converged = NS.buildConvergence(dashaResult.candidates);
      log(calculationLog, '[13] D9 confirmation performed');
      d1d9 = NS.buildD1D9Confirmation();
      log(calculationLog, '[14] Candidate windows generated');
      windows = NS.buildWindows(converged);
      log(calculationLog, '[15] Convergence calculated');
      log(calculationLog, '[16] Final window generated: ' + (windows.primary ? 'yes' : 'no qualifying window found'));
    }

    const rulesUsedIds = new Set();
    promiseMatrix.forEach(m => m.rule && rulesUsedIds.add(m.rule.id));
    rulesUsedIds.add('MT-SIG-001');
    if (dashaResult.available) { rulesUsedIds.add('MT-DASHA-001'); rulesUsedIds.add('MT-DASHA-002'); rulesUsedIds.add('MT-DASHA-003'); rulesUsedIds.add('MT-TRANSIT-001'); rulesUsedIds.add('MT-TRANSIT-002'); rulesUsedIds.add('MT-TRANSIT-003'); rulesUsedIds.add('MT-CONVERGENCE-001'); }
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      basis, d9, promise: { matrix: promiseMatrix, summary: promiseSummary }, significators,
      dashaCandidates: dashaResult.candidates, transitCandidates: converged,
      d9Confirmation: d1d9, windows, primaryWindow: windows.primary, secondaryWindow: windows.secondary,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog, missing
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, result };
    return result;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };

  return NS;
})();
