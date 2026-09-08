// Classical Parashari Yoga (planetary combination) detection rules. Each
// rule is a small function that inspects the birth chart's planets/houses
// and returns either null (not present) or a record describing the yoga,
// its strength (0-100, used only to RANK yogas of the same polarity
// against each other — see yogaEngine.js), the planets involved, and a
// plain-English description. Reuses existing chart data (sign/house/
// longitude already computed by birthChart.js) and existing reference
// data (EXALTATION_SIGN/DEBILITATION_SIGN from planetTraits.js,
// SIGN_LORD/MOVABLE_SIGNS/FIXED_SIGNS from parashariTables.js,
// wholeSignHouseOf from parashariCharts.js) rather than re-deriving them.

const YOGA_RULES_LOGIC_TEXT = [
  ['Yoga Rules Reference — Logic and Sequence'],
  [''],
  ['1. Each yoga rule is evaluated purely from this chart\'s already-computed planet signs/houses/longitudes and the Ascendant — no new astronomical calculation, only classical combination logic (BPHS-derived).'],
  ['2. "Strength" (0-100) is THIS APP\'S OWN heuristic used only to rank yogas of the same polarity (auspicious or inauspicious) against each other for display order — it is not a classical numeric measure. It generally rewards exact/exalted dignity, Kendra (angular) placement, and multiple confirming factors.'],
  ['3. Kendra houses = 1, 4, 7, 10. Trikona (trine) houses = 1, 5, 9. Dusthana (malefic) houses = 6, 8, 12 — the classical building blocks most yogas below are defined in terms of.'],
  [''],
  ['Caveat: yoga detection is one of the most elaborated (and most debated) areas of classical practice — this is a representative, commonly-taught subset (Panch Mahapurush, Gaja Kesari, Raja/Dhana combinations, Neecha Bhanga, Budhaditya, Chandra-Mangal, Kaal Sarpa, Kemadruma, and several others), not an exhaustive classical catalog. Cancellation/exception sub-rules beyond what is coded here are not evaluated.']
];

const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];
const DUSTHANA_HOUSES = [6, 8, 12];

function byName(planets, name) {
  return planets.find(p => p.name === name);
}
function houseDistance(houseA, houseB) {
  return ((houseB - houseA + 12) % 12) + 1;
}
function sameSign(a, b) {
  return a && b && a.sign === b.sign;
}
function isKendraFrom(houseA, houseB) {
  return KENDRA_HOUSES.includes(houseDistance(houseA, houseB));
}
function houseLord(planets, ascSignIndex, houseNumber) {
  const signIndex = (ascSignIndex + houseNumber - 1) % 12;
  return SIGN_LORD[SIGNS[signIndex]];
}
function ascSignIndexOf(ascendant) {
  return SIGNS.indexOf(ascendant.sign);
}

// --- Panch Mahapurusha Yogas: a planet in its own or exaltation sign, in a Kendra from Lagna. ---
const MAHAPURUSHA_PLANETS = {
  Mars: 'Ruchaka', Mercury: 'Bhadra', Jupiter: 'Hamsa', Venus: 'Malavya', Saturn: 'Sasha'
};
function mahapurushaYogas(planets) {
  const results = [];
  Object.keys(MAHAPURUSHA_PLANETS).forEach(name => {
    const p = byName(planets, name);
    if (!p || !KENDRA_HOUSES.includes(Number(p.house))) return;
    const isOwn = SIGN_LORD[p.sign] === name;
    const isExalted = EXALTATION_SIGN[name] === p.sign;
    if (!isOwn && !isExalted) return;
    results.push({
      name: `${MAHAPURUSHA_PLANETS[name]} Yoga`,
      polarity: 'good',
      strength: isExalted ? 95 : 85,
      planets: [name],
      description: `${name} is in ${isExalted ? 'its exaltation' : 'its own'} sign (${p.sign}) in House ${p.house}, a Kendra (angular house) from the Ascendant — one of the five classical Panch Mahapurusha Yogas, giving the native strong, self-made ${name.toLowerCase() === 'saturn' ? 'discipline and authority' : 'personal'} prominence in that planet's significations.`
    });
  });
  return results;
}

// --- Gaja Kesari Yoga: Jupiter and Moon in mutual Kendra. ---
function gajaKesariYoga(planets) {
  const moon = byName(planets, 'Moon'), jupiter = byName(planets, 'Jupiter');
  if (!moon || !jupiter) return null;
  if (!isKendraFrom(Number(moon.house), Number(jupiter.house))) return null;
  return {
    name: 'Gaja Kesari Yoga',
    polarity: 'good',
    strength: 80,
    planets: ['Moon', 'Jupiter'],
    description: `Jupiter is in a Kendra (angular house) from the Moon (Moon in House ${moon.house}, Jupiter in House ${jupiter.house}) — a classical yoga for intelligence, respect, and a well-regarded reputation.`
  };
}

// --- Budhaditya Yoga: Sun and Mercury conjunct (same sign). ---
function budhadityaYoga(planets) {
  const sun = byName(planets, 'Sun'), mercury = byName(planets, 'Mercury');
  if (!sameSign(sun, mercury)) return null;
  return {
    name: 'Budhaditya Yoga',
    polarity: 'good',
    strength: 55,
    planets: ['Sun', 'Mercury'],
    description: `Sun and Mercury are conjunct in ${sun.sign} (House ${sun.house}) — a classical yoga for sharp intellect, analytical skill, and success through communication or learning.`
  };
}

// --- Chandra-Mangal Yoga: Moon and Mars conjunct. ---
function chandraMangalYoga(planets) {
  const moon = byName(planets, 'Moon'), mars = byName(planets, 'Mars');
  if (!sameSign(moon, mars)) return null;
  return {
    name: 'Chandra-Mangal Yoga',
    polarity: 'good',
    strength: 50,
    planets: ['Moon', 'Mars'],
    description: `Moon and Mars are conjunct in ${moon.sign} (House ${moon.house}) — classically associated with drive, resourcefulness, and the ability to generate wealth through determined effort.`
  };
}

// --- Dhana Yoga (simplified): lords of 2nd and 11th house conjunct. ---
function dhanaYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const lord2 = houseLord(planets, ascSignIndex, 2);
  const lord11 = houseLord(planets, ascSignIndex, 11);
  if (lord2 === lord11) return null; // same planet can't be "conjunct with itself"
  const p2 = byName(planets, lord2), p11 = byName(planets, lord11);
  if (!sameSign(p2, p11)) return null;
  return {
    name: 'Dhana Yoga',
    polarity: 'good',
    strength: 60,
    planets: [lord2, lord11],
    description: `The 2nd lord (${lord2}) and 11th lord (${lord11}) — houses of accumulated wealth and gains — are conjunct in ${p2.sign} (House ${p2.house}), a classical wealth-producing combination.`
  };
}

// --- Raja Yoga (simplified): a Kendra lord conjunct a Trikona lord (excluding Lagna lord doubling as both). ---
function rajaYogas(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const results = [];
  const seen = new Set();
  KENDRA_HOUSES.forEach(kHouse => {
    TRIKONA_HOUSES.forEach(tHouse => {
      if (kHouse === tHouse) return;
      const kLord = houseLord(planets, ascSignIndex, kHouse);
      const tLord = houseLord(planets, ascSignIndex, tHouse);
      if (kLord === tLord) return;
      const pk = byName(planets, kLord), pt = byName(planets, tLord);
      if (!sameSign(pk, pt)) return;
      const key = [kLord, tLord].sort().join('-') + '@' + pk.sign;
      if (seen.has(key)) return;
      seen.add(key);
      results.push({
        name: 'Raja Yoga',
        polarity: 'good',
        strength: 70,
        planets: [kLord, tLord],
        description: `The lord of Kendra house ${kHouse} (${kLord}) and the lord of Trikona house ${tHouse} (${tLord}) are conjunct in ${pk.sign} (House ${pk.house}) — a classical Raja Yoga (power/status-conferring combination), formed by the union of an angular and a trinal lord.`
      });
    });
  });
  return results;
}

// --- Neecha Bhanga Raja Yoga (simplified): a debilitated planet whose debilitation is cancelled
//     because the lord of its debilitation sign is itself angular (Kendra) from the Lagna. ---
function neechaBhangaYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const results = [];
  planets.forEach(p => {
    if (DEBILITATION_SIGN[p.name] !== p.sign) return;
    const debSignLord = SIGN_LORD[p.sign];
    const lordPlanet = byName(planets, debSignLord);
    if (!lordPlanet || !KENDRA_HOUSES.includes(Number(lordPlanet.house))) return;
    results.push({
      name: 'Neecha Bhanga Raja Yoga',
      polarity: 'good',
      strength: 65,
      planets: [p.name, debSignLord],
      description: `${p.name} is debilitated in ${p.sign}, but the lord of that sign (${debSignLord}) is itself angular (House ${lordPlanet.house}) from the Ascendant — a classical debilitation-cancellation (Neecha Bhanga), which can turn the affliction into an unusually strong, self-made rise.`
    });
  });
  return results;
}

// --- Adhi Yoga: benefics (Mercury, Venus, Jupiter) in 6th, 7th, or 8th from the Moon. ---
function adhiYoga(planets) {
  const moon = byName(planets, 'Moon');
  if (!moon) return null;
  const benefics = ['Mercury', 'Venus', 'Jupiter'];
  const found = benefics.filter(name => {
    const p = byName(planets, name);
    return p && [6, 7, 8].includes(houseDistance(Number(moon.house), Number(p.house)));
  });
  if (found.length === 0) return null;
  return {
    name: 'Adhi Yoga',
    polarity: 'good',
    strength: 40 + found.length * 15,
    planets: found,
    description: `${found.join(', ')} occup${found.length === 1 ? 'ies' : 'y'} the 6th, 7th, or 8th house from the Moon — a classical yoga for a comfortable, well-supported life, strengthening with each additional benefic found here (${found.length} of 3 possible).`
  };
}

// --- Kemadruma Yoga (inauspicious): Moon with no planet in the 2nd or 12th from it, and not conjunct any planet. ---
function kemadrumaYoga(planets) {
  const moon = byName(planets, 'Moon');
  if (!moon) return null;
  const others = planets.filter(p => p.name !== 'Moon' && p.name !== 'Rahu' && p.name !== 'Ketu');
  const hasNeighbor = others.some(p => [2, 12].includes(houseDistance(Number(moon.house), Number(p.house))));
  const hasConjunction = others.some(p => sameSign(p, moon));
  if (hasNeighbor || hasConjunction) return null;
  return {
    name: 'Kemadruma Yoga',
    polarity: 'bad',
    severity: 55,
    planets: ['Moon'],
    description: `The Moon (House ${moon.house}) has no planet conjunct it and none in the houses immediately before or after it — a classical yoga for a mind prone to isolation, self-doubt, or a sense of unsupported struggle, especially during Moon-related periods.`
  };
}

// --- Shakat Yoga (inauspicious): Moon in the 6th, 8th, or 12th house from Jupiter. ---
function shakatYoga(planets) {
  const moon = byName(planets, 'Moon'), jupiter = byName(planets, 'Jupiter');
  if (!moon || !jupiter) return null;
  if (!DUSTHANA_HOUSES.includes(houseDistance(Number(jupiter.house), Number(moon.house)))) return null;
  return {
    name: 'Shakat Yoga',
    polarity: 'bad',
    severity: 40,
    planets: ['Moon', 'Jupiter'],
    description: `The Moon (House ${moon.house}) falls in a Dusthana (6th/8th/12th) house counted from Jupiter (House ${jupiter.house}) — classically associated with fluctuating fortune, especially financial ups and downs.`
  };
}

// --- Grahan (eclipse) Yoga (inauspicious): Sun or Moon conjunct Rahu/Ketu. ---
function grahanYogas(planets) {
  const results = [];
  ['Sun', 'Moon'].forEach(luminary => {
    ['Rahu', 'Ketu'].forEach(node => {
      const lp = byName(planets, luminary), np = byName(planets, node);
      if (!sameSign(lp, np)) return;
      results.push({
        name: `Grahan Yoga (${luminary}-${node})`,
        polarity: 'bad',
        severity: luminary === 'Sun' ? 60 : 65,
        planets: [luminary, node],
        description: `${luminary} is conjunct ${node} in ${lp.sign} (House ${lp.house}) — a classical "eclipse" affliction, considered to cloud the native's ${luminary === 'Sun' ? 'self-confidence, authority, or paternal relationships' : 'mind, emotional stability, or relationship with the mother'} until this influence is worked through.`
      });
    });
  });
  return results;
}

// --- Guru Chandal Yoga (inauspicious): Jupiter conjunct Rahu. ---
function guruChandalYoga(planets) {
  const jupiter = byName(planets, 'Jupiter'), rahu = byName(planets, 'Rahu');
  if (!sameSign(jupiter, rahu)) return null;
  return {
    name: 'Guru Chandal Yoga',
    polarity: 'bad',
    severity: 50,
    planets: ['Jupiter', 'Rahu'],
    description: `Jupiter is conjunct Rahu in ${jupiter.sign} (House ${jupiter.house}) — classically considered to distort Jupiter's wisdom/guru-related significations with Rahu's unconventional, obsessive, or ethically ambiguous influence.`
  };
}

// --- Vish (poison) Yoga (inauspicious): Moon conjunct Saturn. ---
function vishYoga(planets) {
  const moon = byName(planets, 'Moon'), saturn = byName(planets, 'Saturn');
  if (!sameSign(moon, saturn)) return null;
  return {
    name: 'Vish Yoga',
    polarity: 'bad',
    severity: 35,
    planets: ['Moon', 'Saturn'],
    description: `Moon is conjunct Saturn in ${moon.sign} (House ${moon.house}) — classically associated with emotional heaviness, delay, or pessimism, though Saturn's discipline can also mature the Moon's significations over time.`
  };
}

// --- Angarak Yoga (inauspicious): Mars conjunct Rahu or Ketu. ---
function angarakYoga(planets) {
  const mars = byName(planets, 'Mars');
  const results = [];
  ['Rahu', 'Ketu'].forEach(node => {
    const np = byName(planets, node);
    if (!sameSign(mars, np)) return;
    results.push({
      name: `Angarak Yoga (Mars-${node})`,
      polarity: 'bad',
      severity: 45,
      planets: ['Mars', node],
      description: `Mars is conjunct ${node} in ${mars.sign} (House ${mars.house}) — classically associated with impulsive aggression, accidents, or disputes, particularly during periods this combination is activated.`
    });
  });
  return results;
}

// --- Kaal Sarpa Yoga (inauspicious): all 7 classical planets fall on one side of the Rahu-Ketu axis. ---
function kaalSarpaYoga(planets) {
  const rahu = byName(planets, 'Rahu'), ketu = byName(planets, 'Ketu');
  if (!rahu || !ketu) return null;
  const classical = planets.filter(p => !['Rahu', 'Ketu'].includes(p.name));
  const rahuLon = rahu.longitude;
  const allOnOneSide = classical.every(p => {
    const diff = ((p.longitude - rahuLon + 360) % 360);
    return diff > 0 && diff < 180;
  }) || classical.every(p => {
    const diff = ((p.longitude - rahuLon + 360) % 360);
    return diff > 180 && diff < 360;
  });
  if (!allOnOneSide) return null;
  return {
    name: 'Kaal Sarpa Yoga',
    polarity: 'bad',
    severity: 70,
    planets: ['Rahu', 'Ketu'],
    description: 'All 7 classical planets fall on one side of the Rahu-Ketu axis (the lunar nodes "hem in" every other planet) — a well-known classical yoga associated with a life that feels externally obstructed or delayed, though it is also linked to sudden, unconventional rises once the native works through it.'
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    YOGA_RULES_LOGIC_TEXT,
    mahapurushaYogas, gajaKesariYoga, budhadityaYoga, chandraMangalYoga, dhanaYoga,
    rajaYogas, neechaBhangaYoga, adhiYoga,
    kemadrumaYoga, shakatYoga, grahanYogas, guruChandalYoga, vishYoga, angarakYoga, kaalSarpaYoga
  };
}
