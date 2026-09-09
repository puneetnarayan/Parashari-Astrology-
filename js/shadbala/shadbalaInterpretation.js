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
  module.exports = { SHADBALA_INTERPRETATION_LOGIC_TEXT, buildPlanetInterpretation, ratioText };
}
