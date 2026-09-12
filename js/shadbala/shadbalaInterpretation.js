// Converts the raw Shadbala numbers (shadbalaEngine.js) into the
// human-readable "why/what/how" narrative, reusing this app's EXISTING
// context modules rather than recomputing anything: sign dignity
// (dignityDetails.js), house themes (houseThemes.js), functional benefic/
// malefic classification (interpretations2/ruleEngine.js), nakshatra
// character (interpretations2/nakshatraTraits.js), combustion/retrograde
// flags (already on the birth-chart planet record), and Naisargika Maitri
// (planetaryStrength.js) for the dispositor relationship. This file
// contains NO astrology calculation of its own — only narrative assembly.

const SHADBALA_INTERPRETATION_LOGIC_TEXT = [
  ['Shadbala Interpretation — Logic and Sequence'],
  [''],
  ['1. STRENGTH vs GOODNESS are always reported as two SEPARATE dimensions: numerical Shadbala answers "how much capacity does this planet have to act", while natural/functional benefic-malefic status (reused from interpretations2/ruleEngine.js\'s Functional Classification) answers "what kind of results is it likely to deliver" — the two are never merged into one verdict.'],
  ['2. The narrative follows a fixed hierarchy per planet: (a) how strong — from total Shadbala vs. the classical minimum; (b) why — from the top strength/weakness contributing components; (c) what it can deliver — from house ownership/occupation and sign dignity; (d) how it is likely to manifest — from natural/functional status, conjunctions, aspects, combustion, retrograde, dispositor, and nakshatra.'],
  ['3. Every sentence is assembled from this chart\'s actual computed values — no fixed/canned text is reused across different charts beyond the sentence templates themselves.'],
  ['']
];

function ratioText(ratio) {
  if (ratio >= 1) return `${(ratio * 100).toFixed(0)}% of the classical minimum — comfortably above threshold`;
  return `${(ratio * 100).toFixed(0)}% of the classical minimum — below the classically required threshold`;
}

function componentName(key) { return key; }

function buildWhyText(planetResult) {
  const top = planetResult.topStrengths.filter(c => c.value > 0);
  const bottom = planetResult.topWeaknesses;
  const strongPart = top.length
    ? `Its strength comes mainly from ${top.map(c => `${componentName(c.key)} (${c.value.toFixed(1)} virupas, ${c.percentOfTotal.toFixed(0)}% of its total)`).join(', ')}.`
    : 'No single component dominates its total strength.';
  const weakPart = bottom.length
    ? ` Its weakest contributor${bottom.length > 1 ? 's are' : ' is'} ${bottom.map(c => `${componentName(c.key)} (${c.value.toFixed(1)} virupas)`).join(', ')}.`
    : '';
  return strongPart + weakPart;
}

function buildSignDignityText(planet, dignityDetail) {
  return `${planet.name} is in ${planet.sign} — ${dignityDetail.text}`;
}

function buildHouseText(planet, functionalInfo) {
  const houseTheme = HOUSE_THEMES[Number(planet.house)];
  const ownedHouses = functionalInfo ? functionalInfo.houses : [];
  const ownershipText = ownedHouses.length
    ? ` It also rules house(s) ${ownedHouses.join(', ')}, so part of its capacity to act flows through whatever those houses govern.`
    : '';
  return `Occupying House ${planet.house} (${houseTheme.title}), its results are most directly channeled into ${houseTheme.description}.${ownershipText}`;
}

function buildManifestationText(planet, functionalInfo, conjunctions, aspectsReceived, dispositorSummary) {
  const parts = [];
  parts.push(`Natural status: ${NATURAL_BENEFICS.includes(planet.name) ? 'natural benefic' : 'natural malefic'}. Functional status (by this chart's Lagna): ${functionalInfo.label}.`);
  if (conjunctions.length) {
    parts.push(`Conjunct with ${conjunctions.join(', ')} in ${planet.sign}, which blends/modifies its expression (see the Interpretation-2 tab for the detailed conjunction reading).`);
  }
  if (aspectsReceived.length) {
    const beneficAsp = aspectsReceived.filter(a => NATURAL_BENEFICS.includes(a));
    const maleficAsp = aspectsReceived.filter(a => !NATURAL_BENEFICS.includes(a));
    if (beneficAsp.length) parts.push(`Aspected by natural benefic(s) ${beneficAsp.join(', ')}, generally supporting its expression.`);
    if (maleficAsp.length) parts.push(`Aspected by natural malefic(s) ${maleficAsp.join(', ')}, adding pressure/friction to its expression.`);
  }
  if (planet.combust) parts.push(`It is combust — its own significations are harder to express cleanly, filtered through the Sun's agenda, independent of its numerical Shadbala.`);
  if (planet.retrograde) parts.push(`It is retrograde — classically read as intensified/inward-turned engagement with its significations, NOT as weak; its Cheshta Bala already reflects this as a strength contributor, not a penalty.`);
  parts.push(dispositorSummary);
  return parts.join(' ');
}

// --- Net effect on the native: combines strength (capacity) with dignity,
// house placement, and functional/natural role into one concrete verdict.
// This is the piece Shadbala alone cannot answer: e.g. a STRONG Saturn that
// is ALSO debilitated in a Dusthana house delivers its difficult
// significations forcefully, not mildly — strength amplifies whatever
// direction the other three factors already point in, it does not create
// a favorable direction on its own.

function capacityTier(ratio) {
  if (ratio >= 1.15) return 'high';
  if (ratio >= 0.85) return 'moderate';
  return 'low';
}

function dignityTier(tier) {
  if (tier === 'Exalted' || tier === 'Moolatrikona' || tier === 'Own Sign') return 'favorable';
  if (tier === 'Debilitated') return 'unfavorable';
  return 'neutral';
}

function houseTier(house) {
  const types = HOUSE_TYPES[Number(house)] || [];
  if (types.includes('Dusthana')) return 'unfavorable';
  if (types.includes('Kendra') || types.includes('Trikona')) return 'favorable';
  return 'neutral';
}

function roleTier(planetName, functionalLabel) {
  const isNaturalBenefic = NATURAL_BENEFICS.includes(planetName);
  const favorableLabels = ['Yogakaraka', 'Functional Benefic'];
  const unfavorableLabels = ['Functional Malefic'];
  if (favorableLabels.includes(functionalLabel)) return 'favorable';
  if (unfavorableLabels.includes(functionalLabel) || functionalLabel.indexOf('Natural Malefic') === 0) return 'unfavorable';
  // Kendra-only lordship: natural malefics are exempt from Kendradhipatya
  // Dosha (mildly favorable-leaning); natural benefics are dosha-reduced
  // toward neutral.
  if (functionalLabel.indexOf('exempt from Kendradhipatya') !== -1) return 'neutral-favorable';
  if (functionalLabel.indexOf('Kendradhipatya Dosha') !== -1) return 'neutral';
  return isNaturalBenefic ? 'neutral-favorable' : 'neutral-unfavorable';
}

const CAPACITY_PHRASE = {
  high: 'a strong, forceful capacity to act',
  moderate: 'a moderate, ordinary capacity to act',
  low: 'a limited, subdued capacity to act'
};
const DIGNITY_PHRASE = {
  favorable: 'well-supported by its sign dignity',
  neutral: 'only ordinarily supported by its sign dignity',
  unfavorable: 'undermined by its debilitated sign dignity'
};
const HOUSE_PHRASE = {
  favorable: 'placed in a supportive house that lets its results reach the native\'s central life areas cleanly',
  neutral: 'placed in a house of steady, effort-built results rather than ready-made ones',
  unfavorable: 'placed in a house of obstacles, loss, or hidden complication, so even capable results arrive entangled with difficulty'
};
const ROLE_PHRASE = {
  favorable: 'a functionally favorable role for this Ascendant',
  'neutral-favorable': 'a mildly favorable-leaning functional role for this Ascendant',
  neutral: 'a functionally neutral role for this Ascendant',
  'neutral-unfavorable': 'a mildly unfavorable-leaning functional role for this Ascendant',
  unfavorable: 'a functionally unfavorable role for this Ascendant'
};

// Direction score: favorable=+1, neutral*=+/-0.5 or 0, unfavorable=-1 for dignity/house/role.
const DIRECTION_SCORE = { favorable: 1, 'neutral-favorable': 0.5, neutral: 0, 'neutral-unfavorable': -0.5, unfavorable: -1 };

function buildNativeImpactSynthesis(planetName, planetResult, dignityDetail, planet, functionalInfo) {
  const capacity = capacityTier(planetResult.ratio);
  const dignity = dignityTier(dignityDetail.tier);
  const house = houseTier(planet.house);
  const role = roleTier(planetName, functionalInfo.label);

  const directionScore = DIRECTION_SCORE[dignity] + DIRECTION_SCORE[house] + DIRECTION_SCORE[role];
  const direction = directionScore >= 1 ? 'favorable' : directionScore <= -1 ? 'unfavorable' : 'mixed';

  const capacityPhrase = CAPACITY_PHRASE[capacity];
  const dignityPhrase = DIGNITY_PHRASE[dignity];
  const housePhrase = HOUSE_PHRASE[house];
  const rolePhrase = ROLE_PHRASE[role];

  let verdict;
  if (capacity === 'high' && direction === 'unfavorable') {
    verdict = `NET EFFECT — DIFFICULT AND FORCEFUL: ${planetName}'s high Shadbala does NOT mean a good outcome here. Combined with its unfavorable dignity/house/role, the native should expect the difficult matters tied to ${planetName} (its house lordship, its occupied house, and its natural significations) to manifest strongly and hard to avoid, particularly when ${planetName}'s dasha/antardasha or a matching transit activates it. Strength here amplifies the difficulty, it does not soften it.`;
  } else if (capacity === 'high' && direction === 'favorable') {
    verdict = `NET EFFECT — STRONG AND FAVORABLE: ${planetName} has both the capacity and the supportive placement to deliver its promised significations substantially. This is one of this chart's more reliable sources of good results, especially during ${planetName}'s dasha/antardasha or a matching transit.`;
  } else if (capacity === 'low' && direction === 'unfavorable') {
    verdict = `NET EFFECT — DIFFICULT BUT MUTED: ${planetName}'s placement/role points toward difficulty, but its low Shadbala limits how forcefully that difficulty can express — expect the associated troubles to be less frequent, less intense, or slower to surface than the placement alone would suggest, though ${planetName} also has limited capacity to help the native overcome them when they do occur.`;
  } else if (capacity === 'low' && direction === 'favorable') {
    verdict = `NET EFFECT — GOOD INTENT, LIMITED DELIVERY: ${planetName}'s placement/role is favorable, but its low Shadbala means that promise may stay partly unrealized — expect the benefits to be present in potential, requiring more time, effort, or external support to fully manifest, rather than arriving readily.`;
  } else if (direction === 'mixed') {
    verdict = `NET EFFECT — MIXED: ${planetName}'s dignity, house, and functional role do not all point the same way, so its ${capacity} Shadbala mainly determines HOW MUCH gets expressed, while the specific matter (favorable or difficult) depends on which factor is dominant at the time (dasha lord, transit, or the specific life area in question) — read this planet case-by-case rather than as uniformly good or bad.`;
  } else {
    verdict = `NET EFFECT — MODERATE: with moderate Shadbala and a ${direction} overall placement, ${planetName} delivers its significations at an ordinary pace and intensity — neither a standout strength nor a standout weakness in this chart.`;
  }

  return {
    capacity, dignity, house, role, direction,
    text: `${planetName} has ${capacityPhrase}, ${dignityPhrase}, ${housePhrase}, and carries ${rolePhrase}. ${verdict}`
  };
}

// planetResult: one entry from computeShadbala().planets. planet: the birth-chart
// planet record. functionalInfo: from ruleEngine.js's functionalClassification().
// dispositorResult: the OTHER planet's Shadbala result (the sign lord).
function buildPlanetInterpretation(planetResult, planet, dignityDetail, functionalInfo, dispositorPlanetName, dispositorResult) {
  const howStrong = `${planet.name} has Total Shadbala of ${planetResult.totalRupa.toFixed(2)} Rupa (required minimum ${planetResult.requiredRupa} Rupa) — ${ratioText(planetResult.ratio)}. Classified ${planetResult.strength}, ranked ${planetResult.rank} of 7 planets by total strength.`;
  const why = buildWhyText(planetResult);
  const signText = buildSignDignityText(planet, dignityDetail);
  const houseText = buildHouseText(planet, functionalInfo);
  const conjunctions = planet.conjunctWith || [];
  const aspectsReceived = planet.aspectedBy || [];
  let dispositorSummary = '';
  if (dispositorResult) {
    dispositorSummary = `Its dispositor ${dispositorPlanetName} has ${dispositorResult.strength.toLowerCase()} Shadbala (${dispositorResult.totalRupa.toFixed(2)} Rupa) — ${dispositorResult.ratio >= 1
      ? `a well-supported channel for ${planet.name}'s results to flow through.`
      : `a comparatively constrained channel: ${planet.name} may have intrinsic capacity that its own dispositor cannot fully carry through.`}`;
  }
  const manifestation = buildManifestationText(planet, functionalInfo, conjunctions, aspectsReceived, dispositorSummary);

  const strongMalefic = !NATURAL_BENEFICS.includes(planet.name) && planetResult.ratio >= 1;
  const weakBenefic = NATURAL_BENEFICS.includes(planet.name) && planetResult.ratio < 0.85;
  let capacityNote = '';
  if (strongMalefic) {
    capacityNote = `Important: strong Shadbala here does not mean a favorable outcome — as a natural malefic, ${planet.name}'s high capacity means it can deliver the difficult matters of its lordship/placement forcefully, not gently.`;
  } else if (weakBenefic) {
    capacityNote = `Important: as a natural benefic with below-average Shadbala, ${planet.name}'s good intent may be present without the full capacity to manifest it — its promise may be delayed, partial, or require more effort to realize.`;
  } else {
    capacityNote = `Strength here should be read as capacity to act, not as a verdict on whether the outcome is favorable — that verdict depends on the functional/natural status and placement above.`;
  }

  const summary = `${howStrong} ${why} ${signText} ${houseText} ${manifestation} ${capacityNote}`;

  return {
    howStrong, why, signText, houseText, manifestation, capacityNote, summary
  };
}

if (typeof module !== 'undefined') {
  module.exports = { SHADBALA_INTERPRETATION_LOGIC_TEXT, buildPlanetInterpretation, buildNativeImpactSynthesis, ratioText };
}
