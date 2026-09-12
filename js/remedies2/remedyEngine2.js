// Remedies_2 — a second, independently-built deterministic Parashari
// remedy engine (per an explicit separate prompt). It reuses the SAME
// underlying chart calculations as the rest of this app (and as
// Remedies_1's engine) — dignity (dignityDetails.js), functional lordship
// (interpretations2/ruleEngine.js), Shadbala (state.shadbala), Vargottama/
// Neecha Bhanga (interpretations2/ruleEngine.js), Yogas (state.yogas),
// Dasha (state.dasha), conjunctions/aspects/combustion (already on each
// chart planet) — but scores, consolidates and ranks independently of
// Remedies_1, and is architected around this prompt's specific
// requirements: a rawScore -> modifiers -> caps/floors -> finalScore
// pipeline, separate natalSeverity / dashaActivation / currentRelevance
// components, and a full debug/explainability object per planet.
//
// NO LLM, external API, or runtime web search is used anywhere in this
// file — every rule, weight, and remedy mapping is a fixed constant or
// deterministic function of already-computed chart data. Given the same
// birth data, this engine always produces the same output.

const REMEDY2_CONFIG = {
  weights: {
    functionalMalefic: 15,          // ruleId: FUNCTIONAL_MALEFIC_ROLE
    naturalMaleficNoLordship: 8,     // Rahu/Ketu baseline (no house lordship to classify by)
    debilitated: 20,                 // ruleId: DEBILITATION
    dusthanaPlacementUnfavorable: 10, // ruleId: DUSTHANA_PLACEMENT (functionally unfavorable planet)
    dusthanaPlacementFavorable: 5,    // same placement, functionally favorable planet — less concerning
    kendraOrTrikonaUnfavorable: 5,    // a good house does not fully offset a bad functional role
    maleficConjunctionEach: 8, maleficConjunctionCap: 16,
    maleficAspectEach: 8, maleficAspectCap: 16,               // ruleId: ASPECT_FROM_MALEFIC
    severeCombustion: 15, mildCombustion: 6,                   // ruleId: COMBUSTION (context-gated, see assessPlanet2)
    enemySignRelation: 8,             // ruleId: SIGN_LORD_RELATIONSHIP
    weakShadbala: 10,                 // ruleId: SHADBALA_WEAK (reused, not recomputed)
    lagnaLordAfflicted: 15,
    moonAfflicted: 12,
    presentBadYogaEach: 10, presentBadYogaCap: 20,
    // Protective / cancellation modifiers (negative = reduce score)
    exalted: -25, ownOrMoolatrikona: -18, vargottama: -8, neechaBhangaApplies: -22,
    beneficConjunctionEach: -8, beneficConjunctionCap: -16,
    beneficAspectEach: -6, beneficAspectCap: -12,
    strongShadbala: -8, kendraOrTrikonaFavorable: -5,
    // Dasha activation is tracked SEPARATELY from natal severity (see
    // Section 13 of the prompt: "Do not permanently alter natal severity
    // simply because a planet is currently in dasha").
    dashaActivationMahadasha: 15, dashaActivationAntardasha: 10
  },
  floor: 0, ceiling: 100,
  // Section 14/22 of the prompt: two related but distinct scales — a
  // descriptive severity label for the natal condition, and a priority
  // band (used for sorting/display) that additionally reflects dasha
  // activation via priorityScore = natalSeverity + dashaActivation.
  severityBands: [
    { min: 80, label: 'Very Severe' }, { min: 65, label: 'Severe' }, { min: 50, label: 'Significant' },
    { min: 35, label: 'Moderate' }, { min: 20, label: 'Mild' }, { min: -Infinity, label: 'Minimal' }
  ],
  priorityBands: [
    { min: 80, label: 'Critical' }, { min: 65, label: 'High' }, { min: 50, label: 'Significant' },
    { min: 35, label: 'Moderate' }, { min: 20, label: 'Mild' }, { min: -Infinity, label: 'Suppress' }
  ],
  // Below this priority score, a planet's remedy package is left out of
  // the default top list (still visible in the diagnostic matrix and the
  // "All detected afflictions" expandable section) — Section 26.
  suppressBelow: 20,
  maxPrimaryPackages: 7 // "approximately 3-7 meaningful remedy packages" (Section 26)
};

function severityLabelFor2(score) {
  for (const b of REMEDY2_CONFIG.severityBands) if (score >= b.min) return b.label;
  return 'Minimal';
}
function priorityBandFor2(score) {
  for (const b of REMEDY2_CONFIG.priorityBands) if (score >= b.min) return b.label;
  return 'Suppress';
}

// Declarative planet x house CONTEXT table (Section 5) — rather than
// hand-author 108 individual cells (most of which would just restate
// "Dusthana = bad" or "Kendra = good", which Section 5 explicitly warns
// against assuming), this combines the house's classical category
// (Dusthana/Kendra/Trikona/Upachaya — already known from HOUSE_THEMES-style
// classification) with the planet's FUNCTIONAL role for this specific
// Ascendant (already computed by functionalClassification) to decide
// whether the placement is actually a problem, a non-issue, or a support —
// which is the declarative equivalent of evaluating "classical context"
// per planet x house rather than a blanket rule.
function houseContext2(house, isFunctionallyFavorable, isFunctionallyUnfavorable) {
  const W = REMEDY2_CONFIG.weights;
  const isDusthana = [6, 8, 12].includes(house);
  const isKendra = [1, 4, 7, 10].includes(house);
  const isTrikona = [1, 5, 9].includes(house);
  if (isDusthana) {
    const weight = isFunctionallyFavorable ? W.dusthanaPlacementFavorable : W.dusthanaPlacementUnfavorable;
    return { weight, note: `Occupies a Dusthana house (${house})${isFunctionallyFavorable ? ', though its favorable functional role for this Ascendant meaningfully offsets this' : ''}.` };
  }
  if (isKendra || isTrikona) {
    if (isFunctionallyUnfavorable) return { weight: W.kendraOrTrikonaUnfavorable, note: `Occupies a classically favorable house (${house}), but this does not fully offset an unfavorable functional role for this Ascendant.` };
    return { weight: W.kendraOrTrikonaFavorable, note: `Occupies a classically favorable house (${house}), supporting a positive result.` };
  }
  return { weight: 0, note: `House ${house} placement is not itself a strong classical factor either way.` };
}

// --- Dasha activation (kept separate from natal severity, Section 13) ---
function dashaActivation2(planetName) {
  if (!state.dasha) return { level: 'none', weight: 0 };
  const idx = findCurrentIndex(state.dasha);
  if (idx < 0) return { level: 'none', weight: 0 };
  const maha = state.dasha[idx];
  if (maha.lord === planetName) return { level: 'mahadasha', weight: REMEDY2_CONFIG.weights.dashaActivationMahadasha };
  const aIdx = findCurrentIndex(maha.antardashas);
  if (aIdx >= 0 && maha.antardashas[aIdx].lord === planetName) return { level: 'antardasha', weight: REMEDY2_CONFIG.weights.dashaActivationAntardasha };
  return { level: 'none', weight: 0 };
}

// --- Core per-planet assessment ---
function assessPlanet2(planetName, chart, functional) {
  const W = REMEDY2_CONFIG.weights;
  const planet = chart.planets.find(p => p.name === planetName);
  const isClassical = SHADBALA_PLANETS.includes(planetName);
  const degreeInSign = normalizeDegrees(planet.longitude) % 30;
  const dignity = isClassical ? detailedDignity(planetName, planet.sign, degreeInSign) : { tier: 'Neutral', text: 'Rahu/Ketu dignity is classically disputed; treated as neutral for scoring (selected application convention).' };
  const funcInfo = functional[planetName];
  const isFunctionallyUnfavorable = funcInfo.label === 'Functional Malefic' || funcInfo.label.indexOf('Natural Malefic') === 0;
  const isFunctionallyFavorable = funcInfo.label === 'Yogakaraka' || funcInfo.label === 'Functional Benefic' || funcInfo.label.indexOf('exempt from Kendradhipatya') !== -1;

  const factors = []; // { ruleId, source, confidence, weight, note }
  let rawScore = 0;
  const push = (ruleId, source, confidence, weight, note) => { if (weight !== 0) { rawScore += weight; factors.push({ ruleId, source, confidence, weight, note }); } };

  // Functional role (lordship-based, Section 6)
  if (isFunctionallyUnfavorable) {
    const w = funcInfo.label.indexOf('Natural Malefic') === 0 ? W.naturalMaleficNoLordship : W.functionalMalefic;
    push('FUNCTIONAL_MALEFIC_ROLE', 'Parashari classical functional-lordship principles', 'high', w, `Functionally unfavorable for this Ascendant (${funcInfo.label}).`);
  }

  // House placement (Section 5) — declarative, context-aware
  const house = Number(planet.house);
  const hc = houseContext2(house, isFunctionallyFavorable, isFunctionallyUnfavorable);
  push('PLANET_HOUSE_CONTEXT', 'Parashari classical house principles (application-selected declarative model)', 'medium', hc.weight, hc.note);

  // Dignity (Section 7)
  if (dignity.tier === 'Debilitated') push('DEBILITATION', 'Parashari classical dignity principles', 'high', W.debilitated, 'Debilitated in sign.');
  if (dignity.tier === 'Exalted') push('EXALTATION', 'Parashari classical dignity principles', 'high', W.exalted, 'Exalted — a strong protective factor.');
  if (dignity.tier === 'Own Sign' || dignity.tier === 'Moolatrikona') push('OWN_OR_MOOLATRIKONA', 'Parashari classical dignity principles', 'high', W.ownOrMoolatrikona, `In ${dignity.tier} — a protective factor.`);
  const signLordRel = SIGN_LORD[planet.sign] === planetName ? 'Own' : relationBetween(planetName, SIGN_LORD[planet.sign]);
  if (signLordRel === 'Enemy') push('SIGN_LORD_RELATIONSHIP', 'Parashari classical friendship/enmity principles', 'medium', W.enemySignRelation, 'Placed in an enemy\'s sign — full chart context still applies (Section 7).');

  // Neecha Bhanga (Section 11) — checked before letting debilitation stand at full weight
  if (dignity.tier === 'Debilitated' && chart.planets) {
    const nb = neechaBhangaCheck([planet].concat(chart.planets.filter(p => p.name !== planetName)), chart.ascendant.sign);
    const applies = nb.find(n => n.planet === planetName && n.conditionsMet.length);
    if (applies) push('NEECHA_BHANGA', 'Parashari classical cancellation principles (application-selected convention)', 'medium', W.neechaBhangaApplies, 'Neecha Bhanga (debilitation cancellation) conditions are met — see Interpretation-2 tab for the full check.');
  }
  if (isClassical) {
    const varg = vargottamaCheck(planet);
    if (varg.isVargottama) push('VARGOTTAMA', 'Parashari classical dignity principles', 'medium', W.vargottama, 'Vargottama (same sign in D1 and D9) — a protective factor.');
  }

  // Conjunctions (Section 8) — reuses existing conjunctWith, does not
  // blindly sum every pair: Sun+Mercury (Budha-Aditya-type) and other
  // benefic-adjacent combinations are handled by simply classifying each
  // CONJOINED PLANET's natural nature rather than flagging conjunction
  // itself as inherently adverse.
  const maleficConjunctions = (planet.conjunctWith || []).filter(n => !NATURAL_BENEFICS.includes(n));
  if (maleficConjunctions.length) push('CONJUNCTION_MALEFIC', 'Parashari classical conjunction principles', 'medium', Math.min(W.maleficConjunctionCap, maleficConjunctions.length * W.maleficConjunctionEach), `Conjunct natural malefic(s): ${maleficConjunctions.join(', ')}.`);
  const beneficConjunctions = (planet.conjunctWith || []).filter(n => NATURAL_BENEFICS.includes(n));
  if (beneficConjunctions.length) push('CONJUNCTION_BENEFIC', 'Parashari classical conjunction principles', 'medium', Math.max(W.beneficConjunctionCap, beneficConjunctions.length * W.beneficConjunctionEach), `Conjunct natural benefic(s): ${beneficConjunctions.join(', ')} — a protective factor.`);

  // Aspects (Section 9) — reuses aspects.js's Parashari Graha Drishti
  // output (7th for all planets; Mars 4th/8th, Jupiter 5th/9th, Saturn
  // 3rd/10th special aspects; Rahu/Ketu use the default 7th-aspect
  // convention — this application's explicitly selected convention).
  const maleficAspects = (planet.aspectedBy || []).filter(n => !NATURAL_BENEFICS.includes(n));
  if (maleficAspects.length) push('ASPECT_FROM_MALEFIC', 'Parashari classical Graha Drishti (application-selected convention for Rahu/Ketu)', 'medium', Math.min(W.maleficAspectCap, maleficAspects.length * W.maleficAspectEach), `Aspected by natural malefic(s): ${maleficAspects.join(', ')}.`);
  const beneficAspects = (planet.aspectedBy || []).filter(n => NATURAL_BENEFICS.includes(n));
  if (beneficAspects.length) push('ASPECT_FROM_BENEFIC', 'Parashari classical Graha Drishti', 'medium', Math.max(W.beneficAspectCap, beneficAspects.length * W.beneficAspectEach), `Aspected by natural benefic(s): ${beneficAspects.join(', ')} — reduces severity.`);

  // Combustion (Section 10) — reuses existing astronomical combustion
  // calculation; NOT automatically severe (context-gated: only scored at
  // all when the app's own combustion detector already flagged it, using
  // the app's real Sun-separation data, not an approximation).
  if (planet.combust) {
    const sep = planet.combustDetail ? planet.combustDetail.separationFromSun : null;
    const orb = planet.combustDetail ? (planet.combustDetail.orb || 15) : 15;
    const deep = sep !== null && sep <= orb / 2;
    push('COMBUSTION', 'Parashari classical combustion principles, using this app\'s existing astronomical separation data', 'medium', deep ? W.severeCombustion : W.mildCombustion, `${deep ? 'Deeply' : 'Mildly'} combust${sep !== null ? ` (${sep.toFixed(1)}° from the Sun)` : ''}.`);
  }

  // Strength (Section 21/Shadbala reuse) — never recomputed, only consumed.
  const sbResult = isClassical && state.shadbala ? state.shadbala.planets[planetName] : null;
  if (sbResult && sbResult.ratio < 0.85) push('SHADBALA_WEAK', 'Existing Shadbala engine output (this app)', 'high', W.weakShadbala, `Below-average Shadbala (ratio ${sbResult.ratio.toFixed(2)}).`);
  if (sbResult && sbResult.ratio >= 1.15) push('SHADBALA_STRONG', 'Existing Shadbala engine output (this app)', 'high', W.strongShadbala, `Above-average Shadbala (ratio ${sbResult.ratio.toFixed(2)}) — a protective factor.`);

  // Lagna / Moon condition (repetition-of-affliction sensitivity, Section 24)
  const lagnaLordName = SIGN_LORD[chart.ascendant.sign];
  if (planetName === lagnaLordName && (dignity.tier === 'Debilitated' || maleficConjunctions.length || maleficAspects.length)) {
    push('LAGNA_LORD_AFFLICTED', 'Parashari classical Lagna-lord principles', 'high', W.lagnaLordAfflicted, 'This planet is the Lagna lord and is itself afflicted — affects the whole chart, not just its own significations.');
  }
  if (planetName === 'Moon' && (dignity.tier === 'Debilitated' || maleficConjunctions.length || maleficAspects.length || house === 6 || house === 8 || house === 12)) {
    push('MOON_AFFLICTED', 'Parashari classical principles (Moon as mind-significator)', 'high', W.moonAfflicted, 'The Moon (mind) itself is afflicted.');
  }

  // Yogas (Section 18/relevant yogas) — reused from the existing Yogas engine.
  const badYogasInvolving = (state.yogas ? state.yogas.presentBad : []).filter(y => (y.planets || []).includes(planetName));
  if (badYogasInvolving.length) push('PRESENT_BAD_YOGA', 'This app\'s existing Yogas engine', 'medium', Math.min(W.presentBadYogaCap, badYogasInvolving.length * W.presentBadYogaEach), `Involved in present inauspicious yoga(s): ${badYogasInvolving.map(y => y.name).join(', ')}.`);

  // Retrogression (Section 12) is informational here, not separately
  // scored: classical texts disagree sharply on whether retrogression
  // itself is adverse or actually strengthens a planet (Vakri Bala in
  // Shadbala already credits it positively) — rather than invent a
  // contradictory penalty on top of what Shadbala already accounts for,
  // this engine surfaces retrograde status for explainability only.
  const isRetrograde = !!planet.retrograde;

  // --- Raw -> capped/floored final natal severity ---
  const natalSeverity = Math.max(REMEDY2_CONFIG.floor, Math.min(REMEDY2_CONFIG.ceiling, rawScore));
  const severityLabel = severityLabelFor2(natalSeverity);

  // --- Dasha activation (separate component, Section 13) ---
  const dashaAct = dashaActivation2(planetName);
  const isDashaActive = dashaAct.level !== 'none';
  let currentRelevance;
  if (isDashaActive && natalSeverity >= 20) currentRelevance = 'Natal + Dasha activated';
  else if (isDashaActive) currentRelevance = 'Dasha activated';
  else currentRelevance = 'Natal';

  const priorityScore = Math.max(REMEDY2_CONFIG.floor, Math.min(REMEDY2_CONFIG.ceiling, natalSeverity + dashaAct.weight));
  const priority = priorityBandFor2(priorityScore);

  // --- Pacify vs Strengthen (Section 36, hard architectural distinction) ---
  const afflictionFactors = factors.filter(f => f.weight > 0 && f.ruleId !== 'FUNCTIONAL_MALEFIC_ROLE');
  const afflictionSubscore = afflictionFactors.reduce((s, f) => s + f.weight, 0);
  const weaknessSubscore = factors.filter(f => ['DEBILITATION', 'SIGN_LORD_RELATIONSHIP', 'SHADBALA_WEAK'].includes(f.ruleId)).reduce((s, f) => s + f.weight, 0);
  const outsideAfflictionSubscore = afflictionSubscore - weaknessSubscore;
  const afflictionDominant = outsideAfflictionSubscore >= weaknessSubscore;

  let remedyDirection; // 'pacify' | 'strengthen' | 'both' | 'none'
  if (natalSeverity < REMEDY2_CONFIG.suppressBelow && !isDashaActive) {
    remedyDirection = 'none';
  } else if (isFunctionallyUnfavorable) {
    remedyDirection = 'pacify';
  } else if (isFunctionallyFavorable) {
    remedyDirection = afflictionDominant ? 'pacify' : 'strengthen';
  } else {
    remedyDirection = afflictionDominant ? 'pacify' : 'none';
  }

  // --- Gemstone gate (Section 21) — highest caution ---
  let gemstone = { recommended: false, conditional: false, reason: '' };
  if (remedyDirection !== 'strengthen') {
    gemstone.reason = isFunctionallyUnfavorable
      ? GEMSTONE_CONTRAINDICATIONS_2.functionallyMalefic
      : (afflictionDominant ? GEMSTONE_CONTRAINDICATIONS_2.afflictionDominant : 'Strengthening is not currently indicated for this planet.');
  } else if (['Rahu', 'Ketu'].includes(planetName)) {
    gemstone = { recommended: false, conditional: true, reason: GEMSTONE_CONTRAINDICATIONS_2.naturalMaleficNoLordship };
  } else if (!isClassical || !sbResult) {
    gemstone = { recommended: false, conditional: true, reason: 'Insufficient reliable strength data for a confident gemstone recommendation — professional review suggested.' };
  } else if (natalSeverity >= 80) {
    gemstone = { recommended: false, conditional: true, reason: GEMSTONE_CONTRAINDICATIONS_2.severeUnresolved };
  } else if (natalSeverity >= 20) {
    gemstone = { recommended: true, conditional: natalSeverity < 35, reason: 'Functional role is favorable for this Ascendant, and weakness (not outside affliction) is the dominant driver of its condition.' };
  } else {
    gemstone.reason = 'This planet is not significantly weak, afflicted, or otherwise in need of strengthening at this time.';
  }
  Object.assign(gemstone, PLANET_REMEDY_CONFIG[planetName] ? { name: PLANET_REMEDY_CONFIG[planetName].gemstone.name } : {});

  const affectedHouses = Array.from(new Set([house].concat(funcInfo.houses || [])));
  const affectedLifeAreas = Array.from(new Set(affectedHouses.flatMap(h => HOUSE_LIFE_AREAS_2[h] || [])));

  return {
    planet: planetName, naturalNature: NATURAL_BENEFICS.includes(planetName) ? 'benefic' : 'malefic',
    functionalNature: funcInfo.label, houseLordships: funcInfo.houses || [],
    house, sign: planet.sign, dignity: dignity.tier, combust: !!planet.combust, retrograde: isRetrograde,
    conjunctions: planet.conjunctWith || [], aspectsReceived: planet.aspectedBy || [],
    strength: sbResult ? sbResult.strength : null, shadbalaRatio: sbResult ? sbResult.ratio : null,
    affectedHouses, affectedLifeAreas,
    factors, rawScore, natalSeverity, severityLabel,
    dashaActive: isDashaActive, dashaLevel: dashaAct.level, dashaActivationWeight: dashaAct.weight, currentRelevance,
    priorityScore, priority, remedyDirection, gemstone
  };
}

// --- Consolidation: one package per planet, not one card per affliction ---
function buildRemedyPackage2(assessment) {
  const cfg = PLANET_REMEDY_CONFIG[assessment.planet];
  const reasons = assessment.factors.map(f => f.note);
  const protectiveFactors = assessment.factors.filter(f => f.weight < 0).map(f => f.note);
  const adverseFactors = assessment.factors.filter(f => f.weight > 0).map(f => f.note);

  const remedies = [];
  if (assessment.remedyDirection !== 'none') {
    remedies.push({ type: 'chant', ...cfg.mantra, purpose: assessment.remedyDirection === 'strengthen' ? 'Strengthening' : 'Pacification' });
    remedies.push({ type: 'donation', ...cfg.donation });
    remedies.push({ type: 'action', items: cfg.action });
  }
  if (assessment.gemstone.recommended) {
    remedies.push({ type: 'gemstone', ...cfg.gemstone, conditional: assessment.gemstone.conditional, reason: assessment.gemstone.reason });
  }

  return {
    planet: assessment.planet, priority: assessment.priority, priorityScore: assessment.priorityScore,
    natalSeverity: assessment.natalSeverity, severityLabel: assessment.severityLabel,
    currentRelevance: assessment.currentRelevance, dashaActive: assessment.dashaActive,
    remedyDirection: assessment.remedyDirection,
    affectedLifeAreas: assessment.affectedLifeAreas,
    primaryReason: adverseFactors[0] || (assessment.remedyDirection === 'strengthen' ? `${assessment.planet} is functionally favorable but weak — strengthening is indicated.` : 'No significant affliction detected.'),
    adverseFactors, protectiveFactors, reasons,
    gemstone: assessment.gemstone.recommended ? { recommended: true, conditional: assessment.gemstone.conditional, name: cfg.gemstone.name, ...cfg.gemstone, reason: assessment.gemstone.reason } : { recommended: false, reason: assessment.gemstone.reason },
    remedies
  };
}

function computeRemedies2(chart) {
  const functional = functionalClassification(chart.ascendant.sign, chart.planets);
  const planetNames = SHADBALA_PLANETS.concat(['Rahu', 'Ketu']);

  const assessments = {};
  const packages = [];
  planetNames.forEach(name => {
    const assessment = assessPlanet2(name, chart, functional);
    assessments[name] = assessment;
    packages.push(buildRemedyPackage2(assessment));
  });

  packages.sort((a, b) => b.priorityScore - a.priorityScore);

  const shown = packages.filter(p => p.priorityScore >= REMEDY2_CONFIG.suppressBelow);
  const primary = shown.slice(0, REMEDY2_CONFIG.maxPrimaryPackages);
  const suppressed = packages.filter(p => p.priorityScore < REMEDY2_CONFIG.suppressBelow);

  const summary = { Critical: 0, High: 0, Significant: 0, Moderate: 0 };
  packages.forEach(p => { if (summary[p.priority] !== undefined) summary[p.priority]++; });

  return { assessments, packages, primary, suppressed, summary };
}

if (typeof module !== 'undefined') {
  module.exports = {
    REMEDY2_CONFIG, severityLabelFor2, priorityBandFor2, houseContext2, dashaActivation2,
    assessPlanet2, buildRemedyPackage2, computeRemedies2
  };
}
