// The actual rule-based interpretation engine described in the Interpretation-2
// reference spec (parashari_interpretation_prompt.md + parashari_rule_tabulation.xlsx).
// Categories 1-5 (Lagna, Planets in Houses, Planets in Signs, Dignity/Strength's
// core tiers, Combustion, Retrograde) are ALREADY implemented by the existing
// Interpretations tab (js/interpretations/interpretationEngine.js and friends) —
// this file adds the categories that tab does not cover: the rest of Dignity/
// Strength (Vargottama, Dig Bala), Degree-Sensitive Conditions (0deg/29deg/
// Gandanta), Conjunction narratives (pairs/stellium/Graha Yuddha), Aspect
// narratives, Functional Benefic/Malefic classification, Nakshatra character,
// and Neecha Bhanga (debilitation cancellation) checks — reusing this app's
// existing computed chart data (dignity, combustion, conjunctWith, aspectedBy,
// planetaryStrength's Naisargika Maitri) rather than re-deriving any of it.

const RULE_ENGINE_LOGIC_TEXT = [
  ['Rule-Based Interpretation Engine — Logic and Sequence'],
  [''],
  ['1. This engine only computes the categories NOT already covered by the Interpretations tab: Vargottama/Dig Bala (rest of Cat. 4), Degree-Sensitive Conditions (Cat. 6), Conjunction narratives (Cat. 7), Aspect narratives (Cat. 8), Functional Benefic/Malefic classification (Cat. 9), Nakshatra character (Cat. 10), and Neecha Bhanga checks (Cat. 11).'],
  ['2. Vargottama: a planet is Vargottama if its D1 (Rasi) sign and its D9 (Navamsa) sign are the same — computed here via divisionalCharts.js\'s vargaPosition(), not re-derived.'],
  ['3. Dig Bala (directional strength): Jupiter/Mercury are directionally strong in House 1, Moon/Venus in House 4, Saturn in House 7, Sun/Mars in House 10 — a simple house-number check, no degree-based partial strength.'],
  ['4. Degree-Sensitive Conditions: near-0 deg ("infant") and near-29 deg ("Vridha") use a 1 deg band; Gandanta additionally checks whether the 0 deg/29 deg point falls at a water-sign-to-fire-sign junction (Pisces-Aries, Cancer-Leo, Scorpio-Sagittarius).'],
  ['5. Conjunction narratives combine each pair\'s Naisargika Maitri relation (from planetaryStrength.js) with both planets\' significations; a 3-or-more-planet stellium and a within-1 deg Graha Yuddha (planetary war, among Mars/Mercury/Jupiter/Venus/Saturn only) are flagged separately.'],
  ['6. Aspect narratives classify each aspecting planet as a natural benefic (Jupiter/Venus/unafflicted Mercury/waxing Moon) or malefic (Sun/Mars/Saturn/Rahu/Ketu) and note mutual (bidirectional) aspects.'],
  ['7. Functional Benefic/Malefic Classification (the 7 classical planets only) follows the lordship rule: a planet ruling a Trikona (1st/5th/9th) AND a Kendra (1st/4th/7th/10th) house from this Lagna is a Yogakaraka; Trikona-only is a functional benefic; Kendra-only is functionally neutral; a planet ruling ONLY Dusthana houses (6th/8th/12th) is a functional malefic. Rahu/Ketu are not classical house lords and are treated by their natural-malefic tendency, tempered by dispositor, instead.'],
  ['8. Neecha Bhanga (debilitation cancellation) here checks 4 commonly cited conditions, applied only to the 7 classical planets (Rahu/Ketu have no settled classical exaltation/debilitation, per this app\'s own caveat): (a) the dispositor of the debilitation sign is in a Kendra (1/4/7/10) from Lagna OR from the Moon; (b) the lord of the debilitated planet\'s OWN exaltation sign is in a Kendra from Lagna or Moon — distinct from (c); (c) the planet that is itself EXALTED IN the debilitated planet\'s current sign is conjunct with, or aspects, the debilitated planet; (d) the dispositor is itself exalted. Flagged as "possible cancellation, verify manually" rather than a final verdict, since sources also cite a 5th/6th condition (the debilitated planet being retrograde, or exalted in Navamsa) that this engine does not check.'],
  [''],
  ['Caveat: as the reference spec itself notes, several thresholds here (Gandanta orb, Graha Yuddha winner convention, functional-benefic edge cases) vary across classical sources; this engine picks one commonly used convention per rule and states it, rather than asserting false precision.']
];

const HOUSE_TYPES = {
  1: ['Kendra', 'Trikona'], 2: [], 3: ['Upachaya'], 4: ['Kendra'], 5: ['Trikona'],
  6: ['Upachaya', 'Dusthana'], 7: ['Kendra'], 8: ['Dusthana'], 9: ['Trikona'],
  10: ['Kendra', 'Upachaya'], 11: ['Upachaya'], 12: ['Dusthana']
};

const GANDANTA_JUNCTIONS = [['Pisces', 'Aries'], ['Cancer', 'Leo'], ['Scorpio', 'Sagittarius']];
const NATURAL_BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
const DIG_BALA_HOUSE = { Jupiter: 1, Mercury: 1, Moon: 4, Venus: 4, Saturn: 7, Sun: 10, Mars: 10 };
const GRAHA_YUDDHA_ELIGIBLE = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function degreeInSignOf(longitude) {
  return normalizeDegrees(longitude) % 30;
}
function signIndexOf(longitude) {
  return Math.floor(normalizeDegrees(longitude) / 30) % 12;
}

// --- 4 (extra). Vargottama & Dig Bala ---
function vargottamaCheck(planet) {
  const navamsaSign = vargaPosition(planet.longitude, 'D9').sign;
  return { isVargottama: navamsaSign === planet.sign, navamsaSign };
}
function digBalaCheck(planet) {
  return DIG_BALA_HOUSE[planet.name] === planet.house;
}

// --- 6. Degree-Sensitive Conditions ---
function degreeSensitiveCheck(planet) {
  const deg = degreeInSignOf(planet.longitude);
  const signIdx = SIGNS.indexOf(planet.sign);
  const prevSign = SIGNS[(signIdx + 11) % 12];
  const nextSign = SIGNS[(signIdx + 1) % 12];
  const near0 = deg <= 1;
  const near29 = deg >= 29;
  const gandantaAt0 = near0 && GANDANTA_JUNCTIONS.some(([w, f]) => w === prevSign && f === planet.sign);
  const gandantaAt29 = near29 && GANDANTA_JUNCTIONS.some(([w, f]) => w === planet.sign && f === nextSign);
  const notes = [];
  if (gandantaAt0 || gandantaAt29) {
    notes.push(`At ${deg.toFixed(2)}° in ${planet.sign}, this placement falls in Gandanta — the water-sign-to-fire-sign junction classically considered a karmic knot/point of instability.`);
  } else if (near0) {
    notes.push(`At ${deg.toFixed(2)}° in ${planet.sign}, this planet has just entered the sign ("infant" degree) — its results here tend to be weak or slow to manifest.`);
  } else if (near29) {
    notes.push(`At ${deg.toFixed(2)}° in ${planet.sign}, this planet is in its last, most depleted degree ("Vridha") — restless to move on, giving hurried or exhausted results even if otherwise well-dignified.`);
  }
  return { near0, near29, gandanta: gandantaAt0 || gandantaAt29, notes };
}

// --- 7. Conjunction narratives ---
function conjunctionNarratives(planets) {
  const byName = {};
  planets.forEach(p => { byName[p.name] = p; });
  const seenPairs = new Set();
  const pairTexts = [];
  planets.forEach(p => {
    (p.conjunctWith || []).forEach(otherName => {
      const key = [p.name, otherName].sort().join('-');
      if (seenPairs.has(key)) return;
      seenPairs.add(key);
      const other = byName[otherName];
      if (!other) return;
      const relation = relationBetween(p.name, otherName);
      pairTexts.push({
        pair: [p.name, otherName],
        relation,
        text: `${p.name}-${otherName} conjunction in ${p.sign} (${relation.toLowerCase()} planets, per Naisargika Maitri): blends ${PLANET_TRAITS[p.name].significations} with ${PLANET_TRAITS[otherName].significations}${relation === 'Enemy' ? ' — an inherently frictional pairing whose combined results need the stronger/more dignified planet\'s condition weighed to judge which agenda dominates' : relation === 'Friend' ? ' — a naturally cooperative blend that tends to reinforce both planets\' significations' : ' — a neutral blend, largely shaped by each planet\'s own dignity here'}.`
      });
    });
  });

  const bySign = {};
  planets.forEach(p => { (bySign[p.sign] = bySign[p.sign] || []).push(p.name); });
  const stelliums = Object.entries(bySign).filter(([, names]) => names.length >= 3)
    .map(([sign, names]) => ({ sign, planets: names, text: `Stellium of ${names.length} planets (${names.join(', ')}) in ${sign}: this house/sign's affairs get heavily colored by all of them at once — read it as one combined, complex signification rather than separable individual placements.` }));

  const yuddha = [];
  const eligible = planets.filter(p => GRAHA_YUDDHA_ELIGIBLE.includes(p.name));
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const a = eligible[i], b = eligible[j];
      if (a.sign !== b.sign) continue;
      const diff = Math.abs(a.longitude - b.longitude);
      if (diff <= 1) {
        const winner = a.longitude > b.longitude ? a.name : b.name;
        yuddha.push({ planets: [a.name, b.name], winner, text: `Graha Yuddha (planetary war): ${a.name} and ${b.name} are within ${diff.toFixed(2)}° of each other in ${a.sign}. By the common (higher-longitude) convention, ${winner} is considered the winner — its significations dominate, while the loser's are considered weakened for this placement. (The winner criterion is disputed across sources; treat this as one common convention, not settled doctrine.)` });
      }
    }
  }

  return { pairTexts, stelliums, yuddha };
}

// --- 8. Aspect narratives ---
function aspectNarratives(planets) {
  const byName = {};
  planets.forEach(p => { byName[p.name] = p; });
  const results = [];
  planets.forEach(p => {
    (p.aspectedBy || []).forEach(casterName => {
      const caster = byName[casterName];
      if (!caster) return;
      const natural = NATURAL_BENEFICS.includes(casterName) ? 'benefic' : 'malefic';
      results.push({
        from: casterName, to: p.name, natural,
        text: `${casterName} (natural ${natural}) aspects ${p.name} in ${p.sign}: ${natural === 'benefic' ? 'supports and stabilizes' : 'pressures, delays, or intensifies-through-friction'} ${p.name}'s significations here${(caster.aspectedBy || []).includes(p.name) ? ' — this is a MUTUAL aspect (both planets aspect each other), creating a stronger bidirectional link between their significations' : ''}.`
      });
    });
  });
  return results;
}

// --- 9. Functional Benefic/Malefic Classification ---
function functionalClassification(lagnaSign, planets) {
  const lagnaSignIndex = SIGNS.indexOf(lagnaSign);
  const results = {};
  const classicalPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  classicalPlanets.forEach(planetName => {
    const ruledSigns = Object.keys(SIGN_LORD).filter(s => SIGN_LORD[s] === planetName);
    const houses = ruledSigns.map(s => wholeSignHouseOf(SIGNS.indexOf(s), lagnaSignIndex));
    const houseDesc = houses.map(h => `${h} (${(HOUSE_TYPES[h] || []).join('/') || 'Panapara/other'})`).join(' & ');
    const isTrikona = houses.some(h => [1, 5, 9].includes(h));
    const isKendra = houses.some(h => [1, 4, 7, 10].includes(h));
    const isDusthanaOnly = houses.length > 0 && houses.every(h => [6, 8, 12].includes(h));
    let label, text;
    if (isTrikona && isKendra) {
      label = 'Yogakaraka';
      text = `${planetName} rules house(s) ${houseDesc} from ${lagnaSign} Lagna — the SAME planet lords a Trikona (1/5/9) and a Kendra (1/4/7/10), making it a Yogakaraka: one of the most powerfully benefic planets for this ascendant.`;
    } else if (isTrikona) {
      label = 'Functional Benefic';
      text = `${planetName} rules house(s) ${houseDesc} from ${lagnaSign} Lagna, including a Trikona (1/5/9) — a functional benefic for this ascendant.`;
    } else if (isDusthanaOnly) {
      label = 'Functional Malefic';
      text = `${planetName} rules only Dusthana house(s) ${houseDesc} from ${lagnaSign} Lagna — a functional malefic for this ascendant, however well-dignified it may be.`;
    } else if (isKendra) {
      label = 'Functionally Neutral';
      text = `${planetName} rules house(s) ${houseDesc} from ${lagnaSign} Lagna — a Kendra (1/4/7/10) placement with no Trikona lordship — functionally neutral for this ascendant (any co-owned Dusthana house tempers this further).`;
    } else {
      label = 'Mixed/Neutral';
      text = `${planetName} rules house(s) ${houseDesc} from ${lagnaSign} Lagna — a mixed classification not cleanly Trikona, Kendra-only, or Dusthana-only.`;
    }
    results[planetName] = { label, houses, text };
  });
  ['Rahu', 'Ketu'].forEach(node => {
    results[node] = {
      label: 'Natural Malefic (no house lordship)',
      houses: [],
      text: `${node} is not a classical sign lord, so it is not classified by lordship — treat its functional character via its dispositor's (sign lord's) condition, its nakshatra lord, and its conjunctions instead (per the general classical convention followed by this app).`
    };
  });
  return results;
}

// --- 10. Nakshatra character ---
function nakshatraNarratives(planets) {
  return planets.map(p => {
    if (!p.nakshatra) return null;
    const info = NAKSHATRA_TRAITS[p.nakshatra];
    if (!info) return null;
    const lord = NAKSHATRA_TABLE.find(n => n.name === p.nakshatra).starLord;
    return {
      planet: p.name, nakshatra: p.nakshatra, pada: p.pada, lord,
      text: `${p.name} is in ${p.nakshatra} (pada ${p.pada}, deity ${info.deity}, symbol: ${info.symbol}) — a nakshatra keynoted by "${info.keynote}". Its nakshatra lord is ${lord}; ${lord}'s own dignity/condition in this chart colors how cleanly ${p.name} expresses this keynote.`
    };
  }).filter(Boolean);
}

// --- 11. Neecha Bhanga (Debilitation Cancellation) ---
function neechaBhangaCheck(planets, lagnaSign) {
  const byName = {};
  planets.forEach(p => { byName[p.name] = p; });
  const lagnaSignIndex = SIGNS.indexOf(lagnaSign);
  const moon = byName.Moon;
  const moonSignIndex = moon ? SIGNS.indexOf(moon.sign) : null;
  const classicalPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  // A placement is a Kendra (1/4/7/10) from EITHER the Lagna or the Moon —
  // most classical sources cite the condition disjunctively ("from Lagna or
  // from Moon"), not Lagna alone.
  function isKendraFromLagnaOrMoon(signName) {
    const idx = SIGNS.indexOf(signName);
    const fromLagna = wholeSignHouseOf(idx, lagnaSignIndex);
    const fromMoon = moonSignIndex !== null ? wholeSignHouseOf(idx, moonSignIndex) : null;
    return {
      fromLagna: [1, 4, 7, 10].includes(fromLagna) ? fromLagna : null,
      fromMoon: fromMoon !== null && [1, 4, 7, 10].includes(fromMoon) ? fromMoon : null
    };
  }

  const results = [];
  planets.forEach(p => {
    if (!classicalPlanets.includes(p.name)) return; // Rahu/Ketu excluded: no settled classical exaltation/debilitation, per this app's own caveat
    if (DEBILITATION_SIGN[p.name] !== p.sign) return;
    const dispositorName = SIGN_LORD[p.sign];
    const dispositor = byName[dispositorName];
    const conditions = [];

    // 1. Dispositor (lord of the sign occupied) is in a Kendra from Lagna or Moon.
    if (dispositor) {
      const k = isKendraFromLagnaOrMoon(dispositor.sign);
      if (k.fromLagna) conditions.push(`its dispositor ${dispositorName} is in a Kendra (house ${k.fromLagna}) from Lagna`);
      else if (k.fromMoon) conditions.push(`its dispositor ${dispositorName} is in a Kendra (house ${k.fromMoon}) from the Moon`);
    }

    // 2. The lord of THIS planet's own exaltation sign is in a Kendra from Lagna or Moon.
    const exaltSignLordName = SIGN_LORD[EXALTATION_SIGN[p.name]];
    const exaltSignLord = byName[exaltSignLordName];
    if (exaltSignLord && exaltSignLordName !== p.name) {
      const k = isKendraFromLagnaOrMoon(exaltSignLord.sign);
      if (k.fromLagna) conditions.push(`the lord of its own exaltation sign, ${exaltSignLordName}, is in a Kendra (house ${k.fromLagna}) from Lagna`);
      else if (k.fromMoon) conditions.push(`the lord of its own exaltation sign, ${exaltSignLordName}, is in a Kendra (house ${k.fromMoon}) from the Moon`);
    }

    // 3. The planet that is EXALTED IN this debilitation sign (not the same as
    // condition 2's "lord of the exaltation sign") is conjunct with, or
    // aspects, the debilitated planet.
    const exaltedInThisSignName = classicalPlanets.find(name => EXALTATION_SIGN[name] === p.sign && name !== p.name);
    if (exaltedInThisSignName) {
      if ((p.conjunctWith || []).includes(exaltedInThisSignName)) {
        conditions.push(`it is conjunct ${exaltedInThisSignName}, which is exalted in this very sign (${p.sign})`);
      } else if ((p.aspectedBy || []).includes(exaltedInThisSignName)) {
        conditions.push(`it is aspected by ${exaltedInThisSignName}, which is exalted in this very sign (${p.sign})`);
      }
    }

    // 4. The dispositor is itself exalted.
    if (dispositor && EXALTATION_SIGN[dispositorName] === dispositor.sign) {
      conditions.push(`its dispositor ${dispositorName} is itself exalted (in ${dispositor.sign})`);
    }

    results.push({
      planet: p.name, sign: p.sign, conditionsMet: conditions,
      text: conditions.length
        ? `${p.name} is debilitated in ${p.sign}, but ${conditions.length} classical cancellation (Neecha Bhanga) condition(s) checked here are met: ${conditions.join('; ')}. This is a POSSIBLE cancellation — verify against your source text, since sources cite a 5th-6th condition (e.g. the debilitated planet itself being retrograde, or exalted in Navamsa) that this engine does not check.`
        : `${p.name} is debilitated in ${p.sign}. None of the 4 cancellation conditions checked here are met (dispositor in Kendra from Lagna/Moon; lord of its own exaltation sign in Kendra from Lagna/Moon; conjunct/aspected by the planet exalted in this sign; dispositor itself exalted) — this does not rule out cancellation by another classically cited condition (e.g. retrograde status, Navamsa exaltation) that this engine does not check; verify manually if needed.`
    });
  });
  return results;
}

// --- Top-level: compute everything for the current chart ---
function computeRuleEngine(chart) {
  const { planets, ascendant } = chart;
  const dignityExtra = planets.map(p => {
    const varg = vargottamaCheck(p);
    const digBala = digBalaCheck(p);
    const notes = [];
    if (varg.isVargottama) notes.push(`Vargottama (same sign, ${p.sign}, in both Rasi (D1) and Navamsa (D9)) — this stabilizes and strengthens the placement's promise.`);
    if (digBala) notes.push(`Has Dig Bala (directional strength) in House ${p.house} — one of its classically strongest house placements by direction.`);
    return { planet: p.name, isVargottama: varg.isVargottama, navamsaSign: varg.navamsaSign, hasDigBala: digBala, notes };
  });

  const degreeSensitive = planets.map(p => ({ planet: p.name, ...degreeSensitiveCheck(p) })).filter(d => d.notes.length);

  const conjunctions = conjunctionNarratives(planets);
  const aspects = aspectNarratives(planets);
  const functional = functionalClassification(ascendant.sign, planets);
  const nakshatra = nakshatraNarratives(planets);
  const neechaBhanga = neechaBhangaCheck(planets, ascendant.sign);

  return { dignityExtra, degreeSensitive, conjunctions, aspects, functional, nakshatra, neechaBhanga };
}

if (typeof module !== 'undefined') {
  module.exports = {
    RULE_ENGINE_LOGIC_TEXT, HOUSE_TYPES, GANDANTA_JUNCTIONS, NATURAL_BENEFICS, DIG_BALA_HOUSE, GRAHA_YUDDHA_ELIGIBLE,
    vargottamaCheck, digBalaCheck, degreeSensitiveCheck, conjunctionNarratives, aspectNarratives,
    functionalClassification, nakshatraNarratives, neechaBhangaCheck, computeRuleEngine
  };
}
