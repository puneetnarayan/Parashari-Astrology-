// Sudarshana Chakra — three-reference-point (Lagna/Moon/Sun) analysis of
// the SAME natal chart. No new astronomy or dignity engine is built here:
// every calculation reuses existing app functions —
//   - wholeSignHouseOf(signIndex, referenceSignIndex)  (parashariCharts.js)
//     — already the generic "zodiac distance" house-from-any-reference
//     function the spec calls for; used here for Lagna, Moon, Sun, and the
//     Annual reference alike, not a separately invented formula.
//   - detailedDignity, relationBetween, SIGN_LORD                 (existing)
//   - NATURAL_BENEFICS, functionalClassification                  (existing)
//   - computePlanetaryStrength (Friendship & Strength tab's score) (existing)
//   - state.shadbala, state.dasha, state.yogas                     (existing)
//   - HOUSE_THEMES (base house-meaning layer)                      (existing)
//   - computeSingleLongitude(name, date) for current transits       (existing,
//     the same function used by Ashtakvarga Predictions' transit section)
//   - renderNorthIndianChart (ui.js) draws each of the three chakras —
//     the SAME chart-drawing code used everywhere else in this app.
//
// Astrological hierarchy enforced throughout, per the spec: Natal promise
// (Lagna-based) -> Dasha activation -> Transit activation -> Sudarshana
// (3-reference) confirmation/synthesis. Sudarshana support never overrides
// an absent natal promise — see sudarLifeAreaSynthesis()'s natalPromise
// field, which always anchors to the Lagna-based score.

const SUDARSHANA_REFERENCE_MEANING = {
  Lagna: { label: 'Lagna Chakra', axis: 'External Life', question: 'What is likely to happen externally, in the physical/circumstantial world?' },
  Moon: { label: 'Chandra Chakra', axis: 'Mind / Experience', question: 'How is this likely to be experienced mentally and emotionally?' },
  Sun: { label: 'Surya Chakra', axis: 'Identity / Status', question: 'How does this affect vitality, authority, identity, and recognition?' }
};

// ~22 life areas (spec Section 11), each mapped to its primary house
// number(s) — organizational data only (which houses classically govern
// which life area), not a new scoring system. Named distinctly from the
// existing Ashtakvarga Predictions' own (smaller, differently-shaped)
// LIFE_AREAS constant to avoid any collision between the two globals.
const SUDARSHANA_LIFE_AREAS = [
  { name: 'Self / Personality', houses: [1] },
  { name: 'Health / Vitality', houses: [1, 6] },
  { name: 'Wealth', houses: [2, 11] },
  { name: 'Family', houses: [2, 4] },
  { name: 'Speech', houses: [2] },
  { name: 'Education', houses: [4, 5] },
  { name: 'Children', houses: [5] },
  { name: 'Creativity', houses: [5] },
  { name: 'Career', houses: [10] },
  { name: 'Business', houses: [7, 10] },
  { name: 'Marriage', houses: [7] },
  { name: 'Partnerships', houses: [7] },
  { name: 'Property / Home', houses: [4] },
  { name: 'Mother', houses: [4] },
  { name: 'Father', houses: [9] },
  { name: 'Higher Education', houses: [9] },
  { name: 'Fortune / Dharma', houses: [9] },
  { name: 'Foreign Travel / Residence', houses: [12] },
  { name: 'Spirituality', houses: [12, 9] },
  { name: 'Gains / Income', houses: [11] },
  { name: 'Debt', houses: [6] },
  { name: 'Enemies / Competition', houses: [6] },
  { name: 'Sudden Events / Transformation', houses: [8] }
];

const SUDARSHANA_KENDRA = [1, 4, 7, 10];
const SUDARSHANA_TRIKONA = [1, 5, 9];
const SUDARSHANA_UPACHAYA = [3, 6, 10, 11];
const SUDARSHANA_DUSTHANA = [6, 8, 12];

// Major transiting bodies tracked (spec Section 22).
const SUDARSHANA_TRANSIT_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function sudarSignIndex(sign) { return SIGNS.indexOf(sign); }

// Builds one reference model (Lagna/Moon/Sun/Annual). referenceSignIndex
// is the sign that becomes "House 1" for this reference. Returns a
// byHouse object directly usable by the existing renderNorthIndianChart().
function sudarBuildReferenceModel(referenceLabel, referenceSignIndex, chart) {
  const byHouse = {};
  for (let h = 1; h <= 12; h++) {
    const signIndex = (referenceSignIndex + h - 1) % 12;
    byHouse[h] = { signIndex, planets: [] };
  }
  const houseOfPlanet = {};
  chart.planets.forEach(p => {
    const psi = sudarSignIndex(p.sign);
    const house = wholeSignHouseOf(psi, referenceSignIndex);
    byHouse[house].planets.push({ name: p.name, longitude: p.longitude });
    houseOfPlanet[p.name] = house;
  });
  const houseSign = {}, houseLord = {};
  for (let h = 1; h <= 12; h++) {
    houseSign[h] = SIGNS[byHouse[h].signIndex];
    houseLord[h] = SIGN_LORD[houseSign[h]];
  }
  return { reference: referenceLabel, referenceSign: SIGNS[referenceSignIndex], referenceSignIndex, byHouse, houseOfPlanet, houseSign, houseLord };
}

function sudarComputeThreeReferences(chart) {
  const lagnaIdx = sudarSignIndex(chart.ascendant.sign);
  const moonPlanet = chart.planets.find(p => p.name === 'Moon');
  const sunPlanet = chart.planets.find(p => p.name === 'Sun');
  return {
    Lagna: sudarBuildReferenceModel('Lagna', lagnaIdx, chart),
    Moon: sudarBuildReferenceModel('Moon', sudarSignIndex(moonPlanet.sign), chart),
    Sun: sudarBuildReferenceModel('Sun', sudarSignIndex(sunPlanet.sign), chart)
  };
}

// Planetary comparison table rows (Section 8).
function sudarPlanetaryComparison(chart, models, functional) {
  return PLANET_NAMES.map(name => {
    const p = chart.planets.find(pl => pl.name === name);
    const fromLagna = models.Lagna.houseOfPlanet[name];
    const fromMoon = models.Moon.houseOfPlanet[name];
    const fromSun = models.Sun.houseOfPlanet[name];
    const theme = HOUSE_THEMES[fromLagna];
    const funcInfo = functional[name];
    const keyInterpretation = `${theme.title} (from Lagna) — ${funcInfo.label.toLowerCase()}${NATURAL_BENEFICS.includes(name) ? ', natural benefic' : ', natural malefic'}.`;
    return { planet: name, sign: p.sign, longitude: p.longitude, fromLagna, fromMoon, fromSun, keyInterpretation };
  });
}

// Detailed per-planet analysis (used by the comparison table's click-to-expand).
function sudarPlanetDetail(planetName, chart, models, functional) {
  const p = chart.planets.find(pl => pl.name === planetName);
  const isClassical = SHADBALA_PLANETS.includes(planetName);
  const degreeInSign = normalizeDegrees(p.longitude) % 30;
  const dignity = isClassical ? detailedDignity(planetName, p.sign, degreeInSign) : { tier: 'Neutral', text: 'Rahu/Ketu dignity is classically disputed; treated as neutral here.' };
  const funcInfo = functional[planetName];
  const fromLagna = models.Lagna.houseOfPlanet[planetName];
  const fromMoon = models.Moon.houseOfPlanet[planetName];
  const fromSun = models.Sun.houseOfPlanet[planetName];

  const lordshipFrom = (ref) => {
    const model = models[ref];
    const lorded = Object.keys(model.houseLord).filter(h => model.houseLord[h] === planetName).map(Number);
    return lorded.length ? `Lord of house(s) ${lorded.join(', ')} from ${ref}` : `Does not rule any house from ${ref}`;
  };

  const houseCategoryFrom = (houseNum) => {
    const cats = [];
    if (SUDARSHANA_KENDRA.includes(houseNum)) cats.push('Kendra');
    if (SUDARSHANA_TRIKONA.includes(houseNum)) cats.push('Trikona');
    if (SUDARSHANA_UPACHAYA.includes(houseNum)) cats.push('Upachaya');
    if (SUDARSHANA_DUSTHANA.includes(houseNum)) cats.push('Dusthana');
    return cats.length ? cats.join('/') : 'Panapara (other)';
  };

  const relevantLifeAreas = SUDARSHANA_LIFE_AREAS.filter(a => a.houses.includes(fromLagna)).map(a => a.name);

  const themeLagna = HOUSE_THEMES[fromLagna].title, themeMoon = HOUSE_THEMES[fromMoon].title, themeSun = HOUSE_THEMES[fromSun].title;
  const synthesisByReference = {
    lagna: `From Lagna, ${planetName} activates ${themeLagna} (${houseCategoryFrom(fromLagna)}, house ${fromLagna}) — the external/circumstantial layer. ${dignity.text} ${funcInfo.text}`,
    moon: `From Moon, ${planetName} falls in the house governing ${themeMoon} (house ${fromMoon}), coloring how this is mentally/emotionally experienced.`,
    sun: `From Sun, ${planetName} falls in the house governing ${themeSun} (house ${fromSun}), affecting how this connects to identity, vitality and status.`
  };
  const synthesisText = `${synthesisByReference.lagna} ${synthesisByReference.moon} ${synthesisByReference.sun}`;

  return {
    planet: planetName, sign: p.sign, longitude: p.longitude, dignity: dignity.tier, dignityText: dignity.text,
    fromLagna, fromMoon, fromSun,
    lordshipLagna: lordshipFrom('Lagna'), lordshipMoon: lordshipFrom('Moon'), lordshipSun: lordshipFrom('Sun'),
    houseCategoryLagna: houseCategoryFrom(fromLagna), houseCategoryMoon: houseCategoryFrom(fromMoon), houseCategorySun: houseCategoryFrom(fromSun),
    conjunctions: p.conjunctWith || [], aspects: p.aspectedBy || [], combust: !!p.combust, retrograde: !!p.retrograde,
    functionalNature: funcInfo.label, relevantLifeAreas, synthesis: synthesisText, synthesisByReference
  };
}

// --- House-support scoring (Sections 9-17), reused across life-area
// synthesis, annual chakra, and dasha panel. Combines: occupant natural
// benefic/malefic count, house-lord dignity, house-lord's own Kendra/
// Trikona/Dusthana category from the SAME reference, and benefic/malefic
// aspects on the lord — never a bare house-position count (Section 12).
function sudarHouseSupportScore(model, houseNum, chart) {
  const W = { occupantBenefic: 1, occupantMalefic: -1, exalted: 2, moolatrikona: 1.5, ownSign: 1, debilitated: -2, kendraOrTrikona: 1, dusthana: -1, beneficAspectCap: 1, maleficAspectCap: -1 };
  let score = 5; // neutral baseline out of 10
  const reasons = [];

  const occupants = model.byHouse[houseNum].planets.map(pl => pl.name);
  occupants.forEach(name => {
    if (NATURAL_BENEFICS.includes(name)) { score += W.occupantBenefic; reasons.push(`+ ${name} (natural benefic) occupies this house.`); }
    else { score += W.occupantMalefic; reasons.push(`- ${name} (natural malefic) occupies this house.`); }
  });

  const lordName = model.houseLord[houseNum];
  const lordPlanet = chart.planets.find(p => p.name === lordName);
  if (lordPlanet) {
    const isClassical = SHADBALA_PLANETS.includes(lordName);
    const lordDignity = isClassical ? detailedDignity(lordName, lordPlanet.sign, normalizeDegrees(lordPlanet.longitude) % 30) : { tier: 'Neutral' };
    if (lordDignity.tier === 'Exalted') { score += W.exalted; reasons.push(`+ House lord ${lordName} is Exalted.`); }
    else if (lordDignity.tier === 'Moolatrikona') { score += W.moolatrikona; reasons.push(`+ House lord ${lordName} is in Moolatrikona.`); }
    else if (lordDignity.tier === 'Own Sign') { score += W.ownSign; reasons.push(`+ House lord ${lordName} is in its Own Sign.`); }
    else if (lordDignity.tier === 'Debilitated') { score += W.debilitated; reasons.push(`- House lord ${lordName} is Debilitated.`); }

    const lordHouseFromRef = model.houseOfPlanet[lordName];
    if (SUDARSHANA_KENDRA.includes(lordHouseFromRef) || SUDARSHANA_TRIKONA.includes(lordHouseFromRef)) { score += W.kendraOrTrikona; reasons.push(`+ House lord ${lordName} itself occupies a Kendra/Trikona (house ${lordHouseFromRef}) from ${model.reference}.`); }
    else if (SUDARSHANA_DUSTHANA.includes(lordHouseFromRef)) { score += W.dusthana; reasons.push(`- House lord ${lordName} itself occupies a Dusthana (house ${lordHouseFromRef}) from ${model.reference}.`); }

    const beneficAspects = (lordPlanet.aspectedBy || []).filter(n => NATURAL_BENEFICS.includes(n));
    const maleficAspects = (lordPlanet.aspectedBy || []).filter(n => !NATURAL_BENEFICS.includes(n));
    if (beneficAspects.length) { score += W.beneficAspectCap; reasons.push(`+ House lord ${lordName} is aspected by natural benefic(s): ${beneficAspects.join(', ')}.`); }
    if (maleficAspects.length) { score += W.maleficAspectCap; reasons.push(`- House lord ${lordName} is aspected by natural malefic(s): ${maleficAspects.join(', ')}.`); }
  }

  score = Math.max(0, Math.min(10, score));
  const strength = score >= 7.5 ? 'Strong' : score >= 5.5 ? 'Moderate' : score >= 3.5 ? 'Mixed' : 'Weak';
  return { score: Math.round(score * 10) / 10, strength, reasons, occupants, lordName };
}

function sudarDashaSupportForHouse(lagnaModel, houseNum) {
  if (!state.dasha) return { score: 5, strength: 'Moderate', reasons: ['No dasha data available.'] };
  const idx = findCurrentIndex(state.dasha);
  if (idx < 0) return { score: 5, strength: 'Moderate', reasons: ['No active dasha found for the current date.'] };
  const maha = state.dasha[idx];
  const aIdx = findCurrentIndex(maha.antardashas);
  const antarLord = aIdx >= 0 ? maha.antardashas[aIdx].lord : null;
  const lordOfHouse = lagnaModel.houseLord[houseNum];
  const occupantsOfHouse = lagnaModel.byHouse[houseNum].planets.map(p => p.name);
  let score = 5;
  const reasons = [];
  if (maha.lord === lordOfHouse) { score += 3; reasons.push(`Current Mahadasha lord (${maha.lord}) is this house's lord.`); }
  if (occupantsOfHouse.includes(maha.lord)) { score += 2; reasons.push(`Current Mahadasha lord (${maha.lord}) occupies this house.`); }
  if (antarLord && antarLord === lordOfHouse) { score += 2; reasons.push(`Current Antardasha lord (${antarLord}) is this house's lord.`); }
  if (antarLord && occupantsOfHouse.includes(antarLord)) { score += 1; reasons.push(`Current Antardasha lord (${antarLord}) occupies this house.`); }
  if (!reasons.length) reasons.push('Neither the current Mahadasha nor Antardasha lord is connected to this house.');
  score = Math.max(0, Math.min(10, score));
  const strength = score >= 7.5 ? 'Strong' : score >= 5.5 ? 'Moderate' : score >= 3.5 ? 'Mixed' : 'Weak';
  return { score, strength, reasons, mahaLord: maha.lord, antarLord };
}

// Current transit positions for the major bodies (reuses this app's own
// computeSingleLongitude — the same ephemeris call Ashtakvarga Predictions'
// transit section already uses — no separate transit engine).
function sudarCurrentTransitPositions(atDate) {
  return SUDARSHANA_TRANSIT_PLANETS.map(name => {
    const longitude = computeSingleLongitude(name, atDate);
    const sign = SIGNS[Math.floor(normalizeDegrees(longitude) / 30) % 12];
    return { name, longitude, sign };
  });
}

function sudarTransitSupportForHouse(transitPositions, lagnaModel, houseNum) {
  const transitingHere = transitPositions.filter(t => {
    const house = wholeSignHouseOf(sudarSignIndex(t.sign), lagnaModel.referenceSignIndex);
    return house === houseNum;
  }).map(t => t.name);
  let score = 5;
  const reasons = [];
  transitingHere.forEach(name => {
    if (NATURAL_BENEFICS.includes(name)) { score += 1; reasons.push(`+ ${name} is currently transiting this house (natural benefic).`); }
    else { score -= 1; reasons.push(`- ${name} is currently transiting this house (natural malefic).`); }
  });
  if (!transitingHere.length) reasons.push('No major body is currently transiting this house.');
  score = Math.max(0, Math.min(10, score));
  const strength = score >= 7.5 ? 'Strong' : score >= 5.5 ? 'Moderate' : score >= 3.5 ? 'Mixed' : 'Weak';
  return { score, strength, reasons, transitingHere };
}

// --- Three-reference + dasha + transit synthesis for one life area
// (Sections 10, 11, 26, 28). Natal promise always anchors to the LAGNA
// score (classical convention: the Lagna chart is the primary natal
// promise reference) — Moon/Sun and dasha/transit only qualify it, never
// override an absent natal promise (Section 26/42).
//
// NOTE: a life area's house NUMBER is meaningful only relative to a
// reference point (e.g. "10th house" means different signs from Lagna vs.
// Moon vs. Sun) — but the house NUMBER ITSELF (e.g. "10th") is what the
// classical life-area mapping refers to consistently across all three
// reference charts (10th from Lagna = career-as-external-action, 10th
// from Moon = how career is mentally experienced, 10th from Sun = how
// career affects status/identity). So each reference's OWN house `houseNum`
// (not a translated sign) is scored directly against that reference's model.
function sudarComputeLifeAreas(models, chart, transitPositions) {
  return SUDARSHANA_LIFE_AREAS.map(area => {
    const houseNum = area.houses[0];
    const lagna = sudarHouseSupportScore(models.Lagna, houseNum, chart);
    const moon = sudarHouseSupportScore(models.Moon, houseNum, chart);
    const sun = sudarHouseSupportScore(models.Sun, houseNum, chart);
    const dashaSupport = sudarDashaSupportForHouse(models.Lagna, houseNum);
    const transitSupport = sudarTransitSupportForHouse(transitPositions, models.Lagna, houseNum);
    const natalPromise = lagna; // Lagna anchors natal promise (Section 26/42)

    const avg = (lagna.score + moon.score + sun.score) / 3;
    const agreementSpread = Math.max(lagna.score, moon.score, sun.score) - Math.min(lagna.score, moon.score, sun.score);
    let synthesisText;
    if (natalPromise.score < 3.5) {
      synthesisText = `Natal promise (Lagna) for ${area.name} is Weak — Sudarshana's Moon/Sun layers can only qualify, not manufacture, a result here; without stronger natal/dasha support this area is unlikely to be a major highlight.`;
    } else if (agreementSpread <= 2) {
      synthesisText = `Lagna, Moon and Sun broadly agree on ${area.name} (all ${avg >= 5.5 ? 'supportive' : 'muted'}) — a consistent multi-dimensional signal.`;
    } else if (lagna.score >= 5.5 && moon.score < 5.5) {
      synthesisText = `Strong external potential for ${area.name} (Lagna), but the native may experience it with more psychological uncertainty or mixed feelings (Moon) than the external circumstances alone would suggest.`;
    } else if (lagna.score < 5.5 && (moon.score >= 5.5 || sun.score >= 5.5)) {
      synthesisText = `${area.name} may be psychologically or identity-wise significant (Moon/Sun), but concrete external manifestation (Lagna) is less certain without stronger natal/dasha support.`;
    } else {
      synthesisText = `Lagna, Moon and Sun show a mixed pattern for ${area.name} — outcome likely depends heavily on dasha and transit timing.`;
    }

    const overallScore = Math.round(((natalPromise.score * 2 + dashaSupport.score + transitSupport.score + moon.score + sun.score) / 6) * 10) / 10;
    const confidence = overallScore >= 8 ? 'Very Strong' : overallScore >= 6.5 ? 'Strong' : overallScore >= 5 ? 'Moderate' : overallScore >= 3.5 ? 'Mixed' : overallScore >= 2 ? 'Weak' : 'Very Weak';

    return {
      area: area.name, house: houseNum,
      lagna, moon, sun, natalPromise, dashaSupport, transitSupport,
      synthesis: { score: overallScore, confidence, text: synthesisText }
    };
  });
}

// --- Annual Sudarshana Chakra (Sections 20-21) ---
function sudarAnnualChakra(chart, birthDateUtc, atDate) {
  const age = ageAt(birthDateUtc, atDate);
  const annualHouse = (age.years % 12) + 1; // 1st year of life = house 1, per the traditional 12-house annual cycle
  const cycleStart = addYearsSudar(birthDateUtc, age.years);
  const cycleEnd = addYearsSudar(birthDateUtc, age.years + 1);
  return { age, annualHouse, cycleStart, cycleEnd };
}
function addYearsSudar(date, years) {
  const d = new Date(date.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

function sudarAnnualAnalysis(models, chart, birthDateUtc, atDate, transitPositions) {
  const annual = sudarAnnualChakra(chart, birthDateUtc, atDate);
  const houseNum = annual.annualHouse;
  const natal = sudarHouseSupportScore(models.Lagna, houseNum, chart);
  const dashaSupport = sudarDashaSupportForHouse(models.Lagna, houseNum);
  const transitSupport = sudarTransitSupportForHouse(transitPositions, models.Lagna, houseNum);
  const theme = HOUSE_THEMES[houseNum];
  const overallScore = Math.round(((natal.score * 2 + dashaSupport.score + transitSupport.score) / 4) * 10) / 10;
  const confidence = overallScore >= 8 ? 'Very Strong' : overallScore >= 6.5 ? 'Strong' : overallScore >= 5 ? 'Moderate' : overallScore >= 3.5 ? 'Mixed' : overallScore >= 2 ? 'Weak' : 'Very Weak';
  return {
    age: annual.age, annualHouse: houseNum, cycleStart: annual.cycleStart, cycleEnd: annual.cycleEnd,
    sign: models.Lagna.houseSign[houseNum], lord: models.Lagna.houseLord[houseNum], theme,
    natal, dashaSupport, transitSupport,
    overall: { score: overallScore, confidence, focus: theme.title }
  };
}

// --- Transit analysis (Sections 22-23) ---
function sudarTransitAnalysis(models, transitPositions) {
  return transitPositions.map(t => {
    const fromLagna = wholeSignHouseOf(sudarSignIndex(t.sign), models.Lagna.referenceSignIndex);
    const fromMoon = wholeSignHouseOf(sudarSignIndex(t.sign), models.Moon.referenceSignIndex);
    const fromSun = wholeSignHouseOf(sudarSignIndex(t.sign), models.Sun.referenceSignIndex);
    return {
      planet: t.name, sign: t.sign, fromLagna, fromMoon, fromSun,
      text: `Transiting ${t.sign} — ${fromLagna}th from Lagna (external/circumstantial layer), ${fromMoon}th from Moon (mental/emotional layer), ${fromSun}th from Sun (identity/status layer).`
    };
  });
}

// --- Dasha + Sudarshana panel (Section 24) ---
function sudarDashaPanel(models, chart) {
  if (!state.dasha) return null;
  const idx = findCurrentIndex(state.dasha);
  if (idx < 0) return null;
  const maha = state.dasha[idx];
  const aIdx = findCurrentIndex(maha.antardashas);
  const antar = aIdx >= 0 ? maha.antardashas[aIdx] : null;

  const lordRow = (lordName) => {
    if (!lordName) return null;
    const p = chart.planets.find(pl => pl.name === lordName);
    const isClassical = SHADBALA_PLANETS.includes(lordName);
    const dignity = isClassical ? detailedDignity(lordName, p.sign, normalizeDegrees(p.longitude) % 30) : { tier: 'Neutral' };
    const fromLagna = models.Lagna.houseOfPlanet[lordName];
    const fromMoon = models.Moon.houseOfPlanet[lordName];
    const fromSun = models.Sun.houseOfPlanet[lordName];
    const relevantLifeAreas = SUDARSHANA_LIFE_AREAS.filter(a => a.houses.includes(fromLagna)).map(a => a.name);
    return { lord: lordName, sign: p.sign, dignity: dignity.tier, fromLagna, fromMoon, fromSun, relevantLifeAreas };
  };

  return { mahaLord: lordRow(maha.lord), antarLord: antar ? lordRow(antar.lord) : null };
}

// --- Event Support Engine (Section 25) — user picks a life area, gets a
// structured multi-bar support report built from the SAME synthesis
// already computed for that area, plus transit support for its house.
function sudarEventSupport(areaName, lifeAreas, dashaPanel) {
  const areaResult = lifeAreas.find(a => a.area === areaName);
  if (!areaResult) return null;
  const transitSupport = areaResult.transitSupport;
  const dashaRelevant = dashaPanel && (
    (dashaPanel.mahaLord && dashaPanel.mahaLord.relevantLifeAreas.includes(areaName)) ||
    (dashaPanel.antarLord && dashaPanel.antarLord.relevantLifeAreas.includes(areaName))
  );
  return {
    area: areaName,
    natalPromise: areaResult.natalPromise,
    lagna: areaResult.lagna, moon: areaResult.moon, sun: areaResult.sun,
    dashaSupport: areaResult.dashaSupport, transitSupport,
    dashaRelevant,
    sudarshanaConfirmation: areaResult.synthesis.confidence,
    overallConfidence: areaResult.synthesis.confidence,
    synthesisText: areaResult.synthesis.text
  };
}

// --- Top-level model, cached per chart (Section 48 — recompute only when
// birth data / chart changes; the "atDate" transit/annual layer is cheap
// enough to recompute on open without re-deriving the natal reference
// models each time). ---
function sudarComputeModel(chart, birthDateUtc, atDate) {
  const functional = functionalClassification(chart.ascendant.sign, chart.planets);
  const models = sudarComputeThreeReferences(chart);
  const planetaryComparison = sudarPlanetaryComparison(chart, models, functional);
  const transitPositions = sudarCurrentTransitPositions(atDate);
  const lifeAreas = sudarComputeLifeAreas(models, chart, transitPositions);
  const annual = sudarAnnualAnalysis(models, chart, birthDateUtc, atDate, transitPositions);
  const transits = sudarTransitAnalysis(models, transitPositions);
  const dashaPanel = sudarDashaPanel(models, chart);

  return { models, functional, planetaryComparison, lifeAreas, annual, transitPositions, transits, dashaPanel };
}

if (typeof module !== 'undefined') {
  module.exports = {
    SUDARSHANA_REFERENCE_MEANING, SUDARSHANA_LIFE_AREAS,
    SUDARSHANA_KENDRA, SUDARSHANA_TRIKONA, SUDARSHANA_UPACHAYA, SUDARSHANA_DUSTHANA,
    sudarBuildReferenceModel, sudarComputeThreeReferences, sudarPlanetaryComparison, sudarPlanetDetail,
    sudarHouseSupportScore, sudarDashaSupportForHouse, sudarCurrentTransitPositions, sudarTransitSupportForHouse,
    sudarComputeLifeAreas, sudarAnnualAnalysis, sudarTransitAnalysis, sudarDashaPanel, sudarEventSupport,
    sudarComputeModel
  };
}
