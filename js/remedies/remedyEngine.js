// Remedies — Affliction & Remedial Assessment Engine. Pure calculation +
// deterministic rule logic, NO UI code and NO runtime LLM call — every
// remedy is looked up from remedyData.js's fixed database. Reuses this
// app's EXISTING calculations throughout: dignity (dignityDetails.js),
// functional benefic/malefic classification (interpretations2/ruleEngine.js),
// combustion/retrograde/conjunctions/aspects (already on each chart planet),
// Shadbala (state.shadbala), Vargottama and Neecha Bhanga checks
// (interpretations2/ruleEngine.js), Yogas (state.yogas), and Dasha
// (state.dasha) — nothing here recomputes any of those.

const REMEDIES_LOGIC_TEXT = [
  ['Remedies — Logic and Sequence'],
  [''],
  ['1. PIPELINE: for each of the 9 grahas, this engine reuses the chart\'s already-computed dignity, functional role, combustion/retrograde, conjunctions/aspects, Shadbala (7 classical planets only), Vargottama, Neecha Bhanga, and involvement in currently-present Yogas, to build an Affliction Assessment — a 0-100 afflictionScore, a severity label, and a determination of what should actually be remedied (remedyMode).'],
  ['2. STRENGTH vs GOODNESS, AGAIN: the engine never recommends strengthening a planet merely because it is weak, and never recommends pacifying a planet merely because it is a natural malefic. The functional role for THIS Lagna (already computed) decides the direction; the score only decides how urgently.'],
  ['3. GEMSTONES are the most conservative category: eligible ONLY when the planet\'s functional role is favorable (or mildly so) AND its weakness (not affliction by outside malefics) is the dominant driver of its score. A functionally unfavorable planet is NEVER gemstone-eligible, however weak or strong. Rahu/Ketu gemstones are capped at CONDITIONALLY_RECOMMENDED at most.'],
  ['4. SOURCE LABELING: every remedy record carries sourceType (Classical/Traditional/Modern/Folk-Regional) and a confidence level — see remedyData.js and docs/remedies/research-notes.md for what was actually researched vs. widely-repeated mainstream convention. Nothing here is presented as scientifically proven, and no remedy promises a guaranteed outcome.'],
  ['5. RANKING: remedies are grouped per planet (merging all the reasons that point to the same remedy, rather than showing duplicate cards), scored by natal severity plus a current-dasha-relevance boost, and split into Primary (top 5), Secondary (next 7), and Supportive/Optional tiers.'],
  ['']
];

const REMEDY_ENGINE_CONFIG = {
  scoringWeights: {
    debilitated: 30, severeCombustion: 15, mildCombustion: 8,
    conjunctMaleficEach: 10, conjunctMaleficCap: 20,
    aspectedByMaleficEach: 8, aspectedByMaleficCap: 16,
    dusthanaPlacement: 12, functionalMaleficRole: 15,
    lagnaOrLagnaLordAffliction: 20, moonAffliction: 15,
    presentBadYogaEach: 10, presentBadYogaCap: 20, grahaYuddhaLoser: 15,
    enemySignRelation: 8, weakShadbala: 10, lackOfBeneficSupport: 5,
    currentDashaActivation: 10,
    exalted: -30, ownOrMoolatrikona: -20, vargottama: -10, neechaBhangaApplies: -25,
    conjunctBeneficEach: -8, conjunctBeneficCap: -16,
    aspectedByBeneficEach: -6, aspectedByBeneficCap: -12,
    strongShadbala: -10, strongDispositor: -6
  },
  severityThresholds: [
    { min: 80, label: 'EXTREME' }, { min: 65, label: 'VERY SEVERE' }, { min: 50, label: 'SEVERE' },
    { min: 30, label: 'MODERATE' }, { min: 15, label: 'MILD' }, { min: -Infinity, label: 'SUPPORTIVE' }
  ],
  maxPrimaryRemedies: 5, maxSecondaryRemedies: 7,
  gemstonePolicy: 'CONSERVATIVE', sourcePolicy: 'CLASSICAL_FIRST'
};

function severityLabelFor(score) {
  for (const t of REMEDY_ENGINE_CONFIG.severityThresholds) { if (score >= t.min) return t.label; }
  return 'SUPPORTIVE';
}

function currentDashaLords() {
  if (!state.dasha) return { maha: null, antar: null };
  const idx = findCurrentIndex(state.dasha);
  if (idx < 0) return { maha: null, antar: null };
  const maha = state.dasha[idx];
  const aIdx = findCurrentIndex(maha.antardashas);
  return { maha: maha.lord, antar: aIdx >= 0 ? maha.antardashas[aIdx].lord : null };
}

// --- Assessment for one planet ---
function assessPlanet(planetName, chart, functional, dashaLords) {
  const W = REMEDY_ENGINE_CONFIG.scoringWeights;
  const planet = chart.planets.find(p => p.name === planetName);
  const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);
  const degreeInSign = normalizeDegrees(planet.longitude) % 30;
  const isClassical = SHADBALA_PLANETS.includes(planetName);
  const dignity = isClassical ? detailedDignity(planetName, planet.sign, degreeInSign) : { tier: 'Neutral', text: 'Rahu/Ketu dignity is classically disputed; treated as neutral for scoring.' };
  const funcInfo = functional[planetName];
  const naturalNature = NATURAL_BENEFICS.includes(planetName) ? 'benefic' : 'malefic';
  const isFunctionallyUnfavorable = funcInfo.label === 'Functional Malefic' || funcInfo.label.indexOf('Natural Malefic') === 0;
  const isFunctionallyFavorable = funcInfo.label === 'Yogakaraka' || funcInfo.label === 'Functional Benefic'
    || funcInfo.label.indexOf('exempt from Kendradhipatya') !== -1;

  let score = 0;
  const afflictions = [];
  const beneficSupport = [];
  let afflictionSubscore = 0;
  let weaknessSubscore = 0;

  // Severe factors
  if (dignity.tier === 'Debilitated') { score += W.debilitated; weaknessSubscore += W.debilitated; afflictions.push('Debilitated in sign.'); }
  if (planet.combust) {
    const deep = planet.combustDetail && planet.combustDetail.separationFromSun !== undefined && planet.combustDetail.separationFromSun <= (planet.combustDetail.orb || 15) / 2;
    const w = deep ? W.severeCombustion : W.mildCombustion;
    score += w; afflictionSubscore += w;
    afflictions.push(`${deep ? 'Deeply' : 'Mildly'} combust (within ${planet.combustDetail ? planet.combustDetail.separationFromSun.toFixed(1) : '?'}° of the Sun).`);
  }
  const maleficConjunctions = (planet.conjunctWith || []).filter(n => !NATURAL_BENEFICS.includes(n));
  if (maleficConjunctions.length) {
    const w = Math.min(W.conjunctMaleficCap, maleficConjunctions.length * W.conjunctMaleficEach);
    score += w; afflictionSubscore += w;
    afflictions.push(`Conjunct natural malefic(s): ${maleficConjunctions.join(', ')}.`);
  }
  const maleficAspects = (planet.aspectedBy || []).filter(n => !NATURAL_BENEFICS.includes(n));
  if (maleficAspects.length) {
    const w = Math.min(W.aspectedByMaleficCap, maleficAspects.length * W.aspectedByMaleficEach);
    score += w; afflictionSubscore += w;
    afflictions.push(`Aspected by natural malefic(s): ${maleficAspects.join(', ')}.`);
  }
  const house = Number(planet.house);
  if ([6, 8, 12].includes(house)) { score += W.dusthanaPlacement; afflictionSubscore += W.dusthanaPlacement; afflictions.push(`Placed in a Dusthana house (${house}).`); }
  if (isFunctionallyUnfavorable) { score += W.functionalMaleficRole; afflictionSubscore += W.functionalMaleficRole; afflictions.push('Functionally unfavorable for this Lagna.'); }

  const lagnaLordName = SIGN_LORD[chart.ascendant.sign];
  const afflictsLagna = planetName === lagnaLordName && (dignity.tier === 'Debilitated' || maleficConjunctions.length || maleficAspects.length);
  if (afflictsLagna) { score += W.lagnaOrLagnaLordAffliction; afflictionSubscore += W.lagnaOrLagnaLordAffliction; afflictions.push('This planet is the Lagna lord and is itself afflicted.'); }
  if (planetName === 'Moon' && (dignity.tier === 'Debilitated' || maleficConjunctions.length || maleficAspects.length || house === 8 || house === 12)) {
    score += W.moonAffliction; afflictionSubscore += W.moonAffliction; afflictions.push('The Moon (mind) itself is afflicted.');
  }

  const badYogasInvolving = (state.yogas ? state.yogas.presentBad : []).filter(y => (y.planets || []).includes(planetName));
  if (badYogasInvolving.length) {
    const w = Math.min(W.presentBadYogaCap, badYogasInvolving.length * W.presentBadYogaEach);
    score += w; afflictionSubscore += w;
    afflictions.push(`Involved in present inauspicious yoga(s): ${badYogasInvolving.map(y => y.name).join(', ')}.`);
  }

  // Graha Yuddha (planetary war) loser status is not separately exposed on
  // state today (it's computed transiently inside the Interpretation-2 tab's
  // conjunction narratives) — rather than recompute it here, this factor is
  // intentionally omitted from scoring; see REMEDY_ENGINE_CONFIG's
  // grahaYuddhaLoser weight, which is currently unused for that reason.

  // Moderating factors
  const signLordRel = SIGN_LORD[planet.sign] === planetName ? 'Own' : relationBetween(planetName, SIGN_LORD[planet.sign]);
  if (signLordRel === 'Enemy') { score += W.enemySignRelation; weaknessSubscore += W.enemySignRelation; afflictions.push('In an enemy\'s sign.'); }
  const sbResult = isClassical && state.shadbala ? state.shadbala.planets[planetName] : null;
  if (sbResult && sbResult.ratio < 0.85) { score += W.weakShadbala; weaknessSubscore += W.weakShadbala; afflictions.push(`Below-average Shadbala (ratio ${sbResult.ratio.toFixed(2)}).`); }
  const hasBeneficConjOrAspect = (planet.conjunctWith || []).some(n => NATURAL_BENEFICS.includes(n)) || (planet.aspectedBy || []).some(n => NATURAL_BENEFICS.includes(n));
  if (!hasBeneficConjOrAspect) { score += W.lackOfBeneficSupport; weaknessSubscore += W.lackOfBeneficSupport; }

  const isDashaActive = dashaLords.maha === planetName || dashaLords.antar === planetName;
  if (isDashaActive) score += W.currentDashaActivation; // tracked separately as dasha relevance too

  // Protective factors
  if (dignity.tier === 'Exalted') { score += W.exalted; beneficSupport.push('Exalted.'); }
  if (dignity.tier === 'Own Sign' || dignity.tier === 'Moolatrikona') { score += W.ownOrMoolatrikona; beneficSupport.push(`In ${dignity.tier}.`); }
  if (isClassical) {
    const varg = vargottamaCheck(planet);
    if (varg.isVargottama) { score += W.vargottama; beneficSupport.push('Vargottama (same sign in D1 and D9).'); }
  }
  if (dignity.tier === 'Debilitated' && chart.planets) {
    const nb = neechaBhangaCheck([planet].concat(chart.planets.filter(p => p.name !== planetName)), chart.ascendant.sign);
    const applies = nb.find(n => n.planet === planetName && n.conditionsMet.length);
    if (applies) { score += W.neechaBhangaApplies; beneficSupport.push('Possible Neecha Bhanga (debilitation cancellation) — see Interpretation-2 tab for the full check.'); }
  }
  const beneficConjunctions = (planet.conjunctWith || []).filter(n => NATURAL_BENEFICS.includes(n));
  if (beneficConjunctions.length) { score += Math.max(W.conjunctBeneficCap, beneficConjunctions.length * W.conjunctBeneficEach); beneficSupport.push(`Conjunct natural benefic(s): ${beneficConjunctions.join(', ')}.`); }
  const beneficAspects = (planet.aspectedBy || []).filter(n => NATURAL_BENEFICS.includes(n));
  if (beneficAspects.length) { score += Math.max(W.aspectedByBeneficCap, beneficAspects.length * W.aspectedByBeneficEach); beneficSupport.push(`Aspected by natural benefic(s): ${beneficAspects.join(', ')}.`); }
  if (sbResult && sbResult.ratio >= 1.15) { score += W.strongShadbala; beneficSupport.push(`Above-average Shadbala (ratio ${sbResult.ratio.toFixed(2)}).`); }
  const dispositorName = SIGN_LORD[planet.sign];
  const dispositor = chart.planets.find(p => p.name === dispositorName);
  if (dispositor) {
    const dispDignity = detailedDignity(dispositorName, dispositor.sign, normalizeDegrees(dispositor.longitude) % 30);
    if (dispDignity.tier === 'Exalted' || dispDignity.tier === 'Own Sign') { score += W.strongDispositor; beneficSupport.push(`Dispositor ${dispositorName} is ${dispDignity.tier}.`); }
  }

  score = Math.max(0, Math.min(100, score));
  const severity = severityLabelFor(score);

  // Determine remedy target/mode.
  const afflictionDominant = afflictionSubscore >= weaknessSubscore;
  let remedyMode, gemstoneEligible;
  if (severity === 'SUPPORTIVE') {
    remedyMode = 'GENERAL_PROPITIATION'; gemstoneEligible = false;
  } else if (isFunctionallyUnfavorable) {
    remedyMode = 'PACIFY_PLANET'; gemstoneEligible = false;
  } else if (isFunctionallyFavorable) {
    remedyMode = afflictionDominant ? 'PACIFY_AFFLICTION' : 'STRENGTHEN_PLANET';
    gemstoneEligible = !afflictionDominant; // only when weakness (not outside affliction) is the driver
  } else {
    remedyMode = afflictionDominant ? 'PACIFY_AFFLICTION' : 'GENERAL_PROPITIATION';
    gemstoneEligible = false; // neutral functional role isn't a confident strengthening candidate
  }

  let gemstoneStatus;
  if (!gemstoneEligible) {
    gemstoneStatus = isFunctionallyUnfavorable && score >= REMEDY_ENGINE_CONFIG.severityThresholds[2].min ? 'AVOID' : 'NOT_RECOMMENDED';
  } else if (['Rahu', 'Ketu'].includes(planetName)) {
    gemstoneStatus = 'CONDITIONALLY_RECOMMENDED'; // capped, never plain RECOMMENDED, per spec's conservative rule
  } else if (!isClassical || !state.shadbala) {
    gemstoneStatus = 'PROFESSIONAL_REVIEW_REQUIRED';
  } else if (severity === 'MILD') {
    gemstoneStatus = 'CONDITIONALLY_RECOMMENDED';
  } else if (severity === 'MODERATE' || severity === 'SEVERE') {
    gemstoneStatus = 'RECOMMENDED';
  } else {
    gemstoneStatus = 'PROFESSIONAL_REVIEW_REQUIRED'; // very severe/extreme even on a "favorable" planet warrants a second look
  }

  const affectedHouses = Array.from(new Set([house].concat(funcInfo.houses || [])));
  const affectedSignifications = affectedHouses.map(h => HOUSE_THEMES[h] ? HOUSE_THEMES[h].title : `House ${h}`);

  return {
    planet: planetName, naturalNature, functionalNature: funcInfo.label,
    houseLordships: funcInfo.houses || [], placementHouse: house, sign: planet.sign, dignity: dignity.tier,
    strength: sbResult ? sbResult.strength : null, shadbalaRatio: sbResult ? sbResult.ratio : null,
    afflictions, beneficSupport, affectedHouses, affectedSignifications,
    afflictionScore: score, severity, remedyMode, gemstoneEligible, gemstoneStatus,
    isDashaActive, dashaRelevance: isDashaActive ? (dashaLords.maha === planetName ? 'High (current Mahadasha lord)' : 'High (current Antardasha lord)') : 'Low'
  };
}

// --- Build explainable remedy cards from one planet's assessment ---

function reasonSentenceFor(assessment) {
  const parts = [`${assessment.planet} is ${assessment.naturalNature === 'benefic' ? 'a natural benefic' : 'a natural malefic'} and ${assessment.functionalNature.toLowerCase()} for this Ascendant`];
  if (assessment.houseLordships.length) parts.push(`ruling house(s) ${assessment.houseLordships.join(', ')}`);
  parts.push(`placed in ${assessment.sign} (${assessment.dignity}) in House ${assessment.placementHouse}`);
  if (assessment.afflictions.length) parts.push(`Afflictions: ${assessment.afflictions.join(' ')}`);
  if (assessment.beneficSupport.length) parts.push(`Mitigating factors: ${assessment.beneficSupport.join(' ')}`);
  if (assessment.isDashaActive) parts.push(`Currently activated by dasha (relevance: ${assessment.dashaRelevance}).`);
  return parts.join('. ') + '.';
}

const MODE_LABEL = {
  PACIFY_PLANET: 'Pacification', STRENGTHEN_PLANET: 'Strengthening', PACIFY_AFFLICTION: 'Pacification of Affliction',
  SUPPORT_HOUSE: 'House Support', SUPPORT_SIGNIFICATION: 'Signification Support',
  SUPPORT_CURRENT_DASHA: 'Dasha Support', GENERAL_PROPITIATION: 'General Propitiation'
};

// Selects which categories apply for a given remedyMode — this is the
// "contraindication" gate from the pipeline (section 27 of the spec):
// gemstones only ever appear via their own explicit eligibility check.
function categoriesForMode(mode) {
  if (mode === 'GENERAL_PROPITIATION') return ['chant']; // mild, low-intensity only
  return ['chant', 'donation', 'action']; // gemstone handled separately via gemstoneStatus
}

function buildRemedyCardsForPlanet(assessment) {
  const cards = [];
  const categories = categoriesForMode(assessment.remedyMode);
  categories.forEach(cat => {
    const db = cat === 'chant' ? MANTRA_DB.filter(m => !m.advanced) : cat === 'donation' ? DONATION_DB : ACTION_DB;
    const entry = db.find(e => e.planet === assessment.planet);
    if (!entry) return;
    cards.push({
      ...entry,
      severityScore: assessment.afflictionScore, severityLabel: assessment.severity,
      remedyMode: assessment.remedyMode, modeLabel: MODE_LABEL[assessment.remedyMode],
      affectedLifeAreas: assessment.affectedSignifications,
      reasons: [reasonSentenceFor(assessment)],
      dashaRelevant: assessment.isDashaActive
    });
  });
  if (assessment.gemstoneStatus === 'RECOMMENDED' || assessment.gemstoneStatus === 'CONDITIONALLY_RECOMMENDED' || assessment.gemstoneStatus === 'PROFESSIONAL_REVIEW_REQUIRED') {
    const gem = GEMSTONE_DB_ENTRIES.find(g => g.planet === assessment.planet);
    if (gem) {
      cards.push({
        ...gem, gemstoneStatus: assessment.gemstoneStatus,
        severityScore: assessment.afflictionScore, severityLabel: assessment.severity,
        remedyMode: 'STRENGTHEN_PLANET', modeLabel: 'Gemstone (Strengthening)',
        affectedLifeAreas: assessment.affectedSignifications,
        reasons: [`${assessment.planet} is being considered for strengthening because its functional role is favorable for this Lagna and its weakness (not outside affliction) is the dominant factor in its assessment. ${reasonSentenceFor(assessment)}`],
        dashaRelevant: assessment.isDashaActive
      });
    }
  } else if (assessment.gemstoneStatus === 'AVOID' && assessment.functionalNature) {
    cards.push({
      id: `${assessment.planet.toUpperCase()}_GEMSTONE_AVOID`, category: 'gemstone', planet: assessment.planet,
      name: `${assessment.planet} gemstone — AVOID`, gemstoneStatus: 'AVOID',
      description: `${assessment.planet}'s gemstone is a strengthening/amplifying remedy. Since ${assessment.planet} is functionally difficult in this chart, strengthening it is not recommended even though it shows affliction — pacification, not amplification, is the appropriate direction here.`,
      severityScore: assessment.afflictionScore, severityLabel: assessment.severity,
      remedyMode: assessment.remedyMode, modeLabel: 'Gemstone — Not Advised',
      affectedLifeAreas: assessment.affectedSignifications,
      reasons: [reasonSentenceFor(assessment)], dashaRelevant: assessment.isDashaActive,
      sourceType: 'Modern', sourceTitle: 'This app\'s own gemstone safety policy', sourceAuthor: null, sourceReference: 'See REMEDY_ENGINE_CONFIG.gemstonePolicy = CONSERVATIVE.', confidence: 'High'
    });
  }
  return cards;
}

// Adds dosha/yoga-specific reasons onto whichever planet cards already
// cover the involved planets, rather than creating separate duplicate cards.
function attachDoshaReasons(cardsByPlanet, presentBadYogas) {
  presentBadYogas.forEach(yoga => {
    const mapping = DOSHA_REMEDY_MAP[yoga.key];
    if (!mapping) return;
    (yoga.planets || []).forEach(planetName => {
      const cards = cardsByPlanet[planetName];
      if (!cards) return;
      cards.forEach(c => c.reasons.push(`${yoga.name} is present in this chart: ${mapping.note}`));
    });
  });
}

function computeRemedies(chart) {
  const functional = functionalClassification(chart.ascendant.sign, chart.planets);
  const dashaLords = currentDashaLords();
  const planetNames = SHADBALA_PLANETS.concat(['Rahu', 'Ketu']);

  const assessments = {};
  const cardsByPlanet = {};
  planetNames.forEach(name => {
    const assessment = assessPlanet(name, chart, functional, dashaLords);
    assessments[name] = assessment;
    cardsByPlanet[name] = buildRemedyCardsForPlanet(assessment);
  });

  if (state.yogas) attachDoshaReasons(cardsByPlanet, state.yogas.presentBad);

  let allCards = Object.values(cardsByPlanet).flat();
  // Rank: dasha-active planets get a priority boost independent of natal score.
  allCards.forEach(c => { c.priorityScore = c.severityScore + (c.dashaRelevant ? REMEDY_ENGINE_CONFIG.scoringWeights.currentDashaActivation : 0); });
  allCards.sort((a, b) => b.priorityScore - a.priorityScore);

  const gemstoneCards = allCards.filter(c => c.category === 'gemstone');
  const nonGemstoneCards = allCards.filter(c => c.category !== 'gemstone');

  const primary = nonGemstoneCards.slice(0, REMEDY_ENGINE_CONFIG.maxPrimaryRemedies);
  const secondary = nonGemstoneCards.slice(REMEDY_ENGINE_CONFIG.maxPrimaryRemedies, REMEDY_ENGINE_CONFIG.maxPrimaryRemedies + REMEDY_ENGINE_CONFIG.maxSecondaryRemedies);
  const supportive = nonGemstoneCards.slice(REMEDY_ENGINE_CONFIG.maxPrimaryRemedies + REMEDY_ENGINE_CONFIG.maxSecondaryRemedies);

  const overallPriority = primary.length ? primary[0].severityLabel : 'SUPPORTIVE';

  return { assessments, primary, secondary, supportive, gemstoneCards, dashaLords, overallPriority, allCards };
}

if (typeof module !== 'undefined') {
  module.exports = {
    REMEDIES_LOGIC_TEXT, REMEDY_ENGINE_CONFIG, severityLabelFor, currentDashaLords, assessPlanet,
    buildRemedyCardsForPlanet, attachDoshaReasons, computeRemedies
  };
}
