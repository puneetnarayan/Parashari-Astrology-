// Classical Parashari Yoga (planetary combination) definitions — a FIXED
// list, each with static "how it's derived" and "what it means" text that
// is shown regardless of whether the yoga is present in a given chart, plus
// a compute() function that checks THIS chart and returns whether it's
// present, its magnitude, and which planets/houses triggered it. Reuses
// existing chart data (sign/house/longitude already computed by
// birthChart.js) and existing reference data (EXALTATION_SIGN/
// DEBILITATION_SIGN from planetTraits.js, SIGN_LORD from parashariTables.js)
// rather than re-deriving them.

const YOGA_RULES_LOGIC_TEXT = [
  ['Yoga Rules Reference — Logic and Sequence'],
  [''],
  ['1. Each yoga has a FIXED classical derivation rule and meaning (shown in the Yogas tab table for every yoga, whether present or not) — only whether THIS chart satisfies the rule, and the magnitude, differ per chart.'],
  ['2. Magnitude (0-100, always a multiple of 5) is THIS APP\'S OWN heuristic used only to rank same-polarity yogas against each other and to color-code rows — it is not a classical numeric measure. It generally rewards exact/exalted dignity, Kendra (angular) placement, and multiple confirming factors. A yoga that is not present in this chart is shown with magnitude 0.'],
  ['3. Kendra houses = 1, 4, 7, 10. Trikona (trine) houses = 1, 5, 9. Dusthana (malefic) houses = 6, 8, 12 — the classical building blocks most yogas below are defined in terms of.'],
  ['4. Raja Yoga and Neecha Bhanga Raja Yoga can each be satisfied by more than one planet pairing in the same chart; when that happens the strongest pairing sets the magnitude and all matching pairings are listed in the Details column.'],
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
const NOT_PRESENT = { present: false, magnitude: 0, planets: [], details: '—' };

function mahapurushaYoga(planetName) {
  return (planets) => {
    const p = byName(planets, planetName);
    if (!p || !KENDRA_HOUSES.includes(Number(p.house))) return NOT_PRESENT;
    const isOwn = SIGN_LORD[p.sign] === planetName;
    const isExalted = EXALTATION_SIGN[planetName] === p.sign;
    if (!isOwn && !isExalted) return NOT_PRESENT;
    return {
      present: true, magnitude: isExalted ? 95 : 85, planets: [planetName],
      details: `${planetName} in ${isExalted ? 'exaltation' : 'own'} sign ${p.sign}, House ${p.house} (Kendra).`
    };
  };
}

function gajaKesariYoga(planets) {
  const moon = byName(planets, 'Moon'), jupiter = byName(planets, 'Jupiter');
  if (!moon || !jupiter || !isKendraFrom(Number(moon.house), Number(jupiter.house))) return NOT_PRESENT;
  return { present: true, magnitude: 80, planets: ['Moon', 'Jupiter'], details: `Jupiter (House ${jupiter.house}) is in a Kendra from the Moon (House ${moon.house}).` };
}

function budhadityaYoga(planets) {
  const sun = byName(planets, 'Sun'), mercury = byName(planets, 'Mercury');
  if (!sameSign(sun, mercury)) return NOT_PRESENT;
  return { present: true, magnitude: 55, planets: ['Sun', 'Mercury'], details: `Sun and Mercury conjunct in ${sun.sign}, House ${sun.house}.` };
}

function chandraMangalYoga(planets) {
  const moon = byName(planets, 'Moon'), mars = byName(planets, 'Mars');
  if (!sameSign(moon, mars)) return NOT_PRESENT;
  return { present: true, magnitude: 50, planets: ['Moon', 'Mars'], details: `Moon and Mars conjunct in ${moon.sign}, House ${moon.house}.` };
}

function dhanaYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const lord2 = houseLord(planets, ascSignIndex, 2);
  const lord11 = houseLord(planets, ascSignIndex, 11);
  if (lord2 === lord11) return NOT_PRESENT;
  const p2 = byName(planets, lord2), p11 = byName(planets, lord11);
  if (!sameSign(p2, p11)) return NOT_PRESENT;
  return { present: true, magnitude: 60, planets: [lord2, lord11], details: `2nd lord (${lord2}) and 11th lord (${lord11}) conjunct in ${p2.sign}, House ${p2.house}.` };
}

function rajaYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const matches = [];
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
      matches.push({ kHouse, tHouse, kLord, tLord, sign: pk.sign, house: pk.house });
    });
  });
  if (!matches.length) return NOT_PRESENT;
  const planetsSet = Array.from(new Set(matches.flatMap(m => [m.kLord, m.tLord])));
  return {
    present: true, magnitude: 70, planets: planetsSet,
    details: matches.map(m => `${m.kLord} (${m.kHouse}th lord) + ${m.tLord} (${m.tHouse}th lord) in ${m.sign}, House ${m.house}`).join('; ')
  };
}

function neechaBhangaYoga(planets, ascendant) {
  const matches = [];
  planets.forEach(p => {
    if (DEBILITATION_SIGN[p.name] !== p.sign) return;
    const debSignLord = SIGN_LORD[p.sign];
    const lordPlanet = byName(planets, debSignLord);
    if (!lordPlanet || !KENDRA_HOUSES.includes(Number(lordPlanet.house))) return;
    matches.push({ planet: p.name, sign: p.sign, lord: debSignLord, lordHouse: lordPlanet.house });
  });
  if (!matches.length) return NOT_PRESENT;
  const planetsSet = Array.from(new Set(matches.flatMap(m => [m.planet, m.lord])));
  return {
    present: true, magnitude: 65, planets: planetsSet,
    details: matches.map(m => `${m.planet} debilitated in ${m.sign}, but its dispositor ${m.lord} is angular (House ${m.lordHouse})`).join('; ')
  };
}

function adhiYoga(planets) {
  const moon = byName(planets, 'Moon');
  if (!moon) return NOT_PRESENT;
  const benefics = ['Mercury', 'Venus', 'Jupiter'];
  const found = benefics.filter(name => {
    const p = byName(planets, name);
    return p && [6, 7, 8].includes(houseDistance(Number(moon.house), Number(p.house)));
  });
  if (!found.length) return NOT_PRESENT;
  return {
    present: true, magnitude: 40 + found.length * 15, planets: found,
    details: `${found.join(', ')} in the 6th/7th/8th house from the Moon (House ${moon.house}).`
  };
}

function kemadrumaYoga(planets) {
  const moon = byName(planets, 'Moon');
  if (!moon) return NOT_PRESENT;
  const others = planets.filter(p => p.name !== 'Moon' && p.name !== 'Rahu' && p.name !== 'Ketu');
  const hasNeighbor = others.some(p => [2, 12].includes(houseDistance(Number(moon.house), Number(p.house))));
  const hasConjunction = others.some(p => sameSign(p, moon));
  if (hasNeighbor || hasConjunction) return NOT_PRESENT;
  return { present: true, magnitude: 55, planets: ['Moon'], details: `Moon (House ${moon.house}) has no planet conjunct or in the houses immediately before/after it.` };
}

function shakatYoga(planets) {
  const moon = byName(planets, 'Moon'), jupiter = byName(planets, 'Jupiter');
  if (!moon || !jupiter || !DUSTHANA_HOUSES.includes(houseDistance(Number(jupiter.house), Number(moon.house)))) return NOT_PRESENT;
  return { present: true, magnitude: 40, planets: ['Moon', 'Jupiter'], details: `Moon (House ${moon.house}) is 6th/8th/12th from Jupiter (House ${jupiter.house}).` };
}

function grahanYoga(luminaryName, nodeName) {
  return (planets) => {
    const lp = byName(planets, luminaryName), np = byName(planets, nodeName);
    if (!sameSign(lp, np)) return NOT_PRESENT;
    return {
      present: true, magnitude: luminaryName === 'Sun' ? 60 : 65, planets: [luminaryName, nodeName],
      details: `${luminaryName} conjunct ${nodeName} in ${lp.sign}, House ${lp.house}.`
    };
  };
}

function guruChandalYoga(planets) {
  const jupiter = byName(planets, 'Jupiter'), rahu = byName(planets, 'Rahu');
  if (!sameSign(jupiter, rahu)) return NOT_PRESENT;
  return { present: true, magnitude: 50, planets: ['Jupiter', 'Rahu'], details: `Jupiter conjunct Rahu in ${jupiter.sign}, House ${jupiter.house}.` };
}

function vishYoga(planets) {
  const moon = byName(planets, 'Moon'), saturn = byName(planets, 'Saturn');
  if (!sameSign(moon, saturn)) return NOT_PRESENT;
  return { present: true, magnitude: 35, planets: ['Moon', 'Saturn'], details: `Moon conjunct Saturn in ${moon.sign}, House ${moon.house}.` };
}

const UPACHAYA_HOUSES = [3, 6, 10, 11];
const BENEFICS = ['Mercury', 'Venus', 'Jupiter'];
const MALEFICS = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];

function isStrong(p) {
  return SIGN_LORD[p.sign] === p.name || EXALTATION_SIGN[p.name] === p.sign;
}

// Sunapha/Anapha/Durudhara: planets (other than Sun) in the 2nd and/or 12th house from the Moon.
function sunaphaYoga(planets) {
  const moon = byName(planets, 'Moon');
  if (!moon) return NOT_PRESENT;
  const found = planets.filter(p => p.name !== 'Moon' && p.name !== 'Sun' && houseDistance(Number(moon.house), Number(p.house)) === 2);
  if (!found.length) return NOT_PRESENT;
  return { present: true, magnitude: 45, planets: found.map(p => p.name), details: `${found.map(p => p.name).join(', ')} in the 2nd house from the Moon (House ${moon.house}).` };
}
function anaphaYoga(planets) {
  const moon = byName(planets, 'Moon');
  if (!moon) return NOT_PRESENT;
  const found = planets.filter(p => p.name !== 'Moon' && p.name !== 'Sun' && houseDistance(Number(moon.house), Number(p.house)) === 12);
  if (!found.length) return NOT_PRESENT;
  return { present: true, magnitude: 45, planets: found.map(p => p.name), details: `${found.map(p => p.name).join(', ')} in the 12th house from the Moon (House ${moon.house}).` };
}
function durudharaYoga(planets) {
  const sunapha = sunaphaYoga(planets), anapha = anaphaYoga(planets);
  if (!sunapha.present || !anapha.present) return NOT_PRESENT;
  return { present: true, magnitude: 55, planets: Array.from(new Set([...sunapha.planets, ...anapha.planets])), details: `Both the 2nd house (${sunapha.planets.join(', ')}) and 12th house (${anapha.planets.join(', ')}) from the Moon are occupied.` };
}

// Vasumati Yoga: benefics occupy Upachaya houses (3rd/6th/10th/11th) from the Ascendant.
function vasumatiYoga(planets) {
  const found = BENEFICS.filter(name => { const p = byName(planets, name); return p && UPACHAYA_HOUSES.includes(Number(p.house)); });
  if (!found.length) return NOT_PRESENT;
  return { present: true, magnitude: 40 + found.length * 10, planets: found, details: `${found.join(', ')} in Upachaya houses (3rd/6th/10th/11th) from the Ascendant.` };
}

// Amala Yoga: only a benefic (no malefic) occupies the 10th house from the Lagna.
function amalaYoga(planets) {
  const tenth = planets.filter(p => Number(p.house) === 10);
  if (!tenth.length) return NOT_PRESENT;
  const hasMalefic = tenth.some(p => MALEFICS.includes(p.name));
  const hasBenefic = tenth.some(p => BENEFICS.includes(p.name));
  if (hasMalefic || !hasBenefic) return NOT_PRESENT;
  return { present: true, magnitude: 50, planets: tenth.map(p => p.name), details: `${tenth.map(p => p.name).join(', ')} — benefic-only occupation of the 10th house from the Ascendant.` };
}

// Saraswati Yoga: Jupiter, Venus, Mercury all in Kendra/Trikona/2nd from Lagna, with Jupiter strong.
function saraswatiYoga(planets) {
  const houses = [...KENDRA_HOUSES, ...TRIKONA_HOUSES, 2];
  const jup = byName(planets, 'Jupiter'), ven = byName(planets, 'Venus'), merc = byName(planets, 'Mercury');
  if (!jup || !ven || !merc) return NOT_PRESENT;
  const allPlaced = [jup, ven, merc].every(p => houses.includes(Number(p.house)));
  if (!allPlaced || !isStrong(jup)) return NOT_PRESENT;
  return { present: true, magnitude: 75, planets: ['Jupiter', 'Venus', 'Mercury'], details: `Jupiter (strong, House ${jup.house}), Venus (House ${ven.house}), and Mercury (House ${merc.house}) all occupy Kendra/Trikona/2nd houses.` };
}

// Lakshmi Yoga: 9th lord strong (own/exalted) and Venus strong (own/exalted or in Kendra).
function lakshmiYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const lord9 = houseLord(planets, ascSignIndex, 9);
  const p9 = byName(planets, lord9);
  const venus = byName(planets, 'Venus');
  if (!p9 || !venus || !isStrong(p9)) return NOT_PRESENT;
  const venusStrong = isStrong(venus) || KENDRA_HOUSES.includes(Number(venus.house));
  if (!venusStrong) return NOT_PRESENT;
  return { present: true, magnitude: 70, planets: [lord9, 'Venus'], details: `9th lord ${lord9} is strong (House ${p9.house}) and Venus is strong/angular (House ${venus.house}).` };
}

// Kahala Yoga: 4th and 9th lords in mutual Kendra, and Jupiter is in a Kendra or Trikona from Lagna.
function kahalaYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const lord4 = houseLord(planets, ascSignIndex, 4), lord9 = houseLord(planets, ascSignIndex, 9);
  if (lord4 === lord9) return NOT_PRESENT;
  const p4 = byName(planets, lord4), p9 = byName(planets, lord9), jup = byName(planets, 'Jupiter');
  if (!p4 || !p9 || !jup) return NOT_PRESENT;
  if (!isKendraFrom(Number(p4.house), Number(p9.house))) return NOT_PRESENT;
  if (![...KENDRA_HOUSES, ...TRIKONA_HOUSES].includes(Number(jup.house))) return NOT_PRESENT;
  return { present: true, magnitude: 60, planets: [lord4, lord9, 'Jupiter'], details: `4th lord ${lord4} (House ${p4.house}) and 9th lord ${lord9} (House ${p9.house}) are in mutual Kendra; Jupiter is angular/trinal (House ${jup.house}).` };
}

// Parvata Yoga (simplified): lords of the 6th and 8th houses are both themselves in Kendra houses.
function parvataYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const lord6 = houseLord(planets, ascSignIndex, 6), lord8 = houseLord(planets, ascSignIndex, 8);
  const p6 = byName(planets, lord6), p8 = byName(planets, lord8);
  if (!p6 || !p8) return NOT_PRESENT;
  if (!KENDRA_HOUSES.includes(Number(p6.house)) || !KENDRA_HOUSES.includes(Number(p8.house))) return NOT_PRESENT;
  return { present: true, magnitude: 45, planets: [lord6, lord8], details: `6th lord ${lord6} (House ${p6.house}) and 8th lord ${lord8} (House ${p8.house}) are both angular, and neither is placed in a Dusthana.` };
}

// Chamara Yoga: Lagna lord is exalted and angular, conjunct or aspected by Jupiter.
function chamaraYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const lagnaLordName = SIGN_LORD[ascendant.sign];
  const lagnaLord = byName(planets, lagnaLordName);
  const jup = byName(planets, 'Jupiter');
  if (!lagnaLord || !jup) return NOT_PRESENT;
  if (EXALTATION_SIGN[lagnaLordName] !== lagnaLord.sign || !KENDRA_HOUSES.includes(Number(lagnaLord.house))) return NOT_PRESENT;
  const conjunct = sameSign(lagnaLord, jup);
  const aspected = (computeAspectedBy ? computeAspectedBy(planets)[lagnaLordName] || [] : []).includes('Jupiter');
  if (!conjunct && !aspected) return NOT_PRESENT;
  return { present: true, magnitude: 80, planets: [lagnaLordName, 'Jupiter'], details: `Lagna lord ${lagnaLordName} is exalted and angular (House ${lagnaLord.house}), ${conjunct ? 'conjunct' : 'aspected by'} Jupiter.` };
}

// Vesi/Vasi/Ubhayachari: planets (other than Moon) in the 2nd and/or 12th house from the Sun.
function vesiYoga(planets) {
  const sun = byName(planets, 'Sun');
  if (!sun) return NOT_PRESENT;
  const found = planets.filter(p => p.name !== 'Sun' && p.name !== 'Moon' && houseDistance(Number(sun.house), Number(p.house)) === 2);
  if (!found.length) return NOT_PRESENT;
  return { present: true, magnitude: 35, planets: found.map(p => p.name), details: `${found.map(p => p.name).join(', ')} in the 2nd house from the Sun (House ${sun.house}).` };
}
function vasiYoga(planets) {
  const sun = byName(planets, 'Sun');
  if (!sun) return NOT_PRESENT;
  const found = planets.filter(p => p.name !== 'Sun' && p.name !== 'Moon' && houseDistance(Number(sun.house), Number(p.house)) === 12);
  if (!found.length) return NOT_PRESENT;
  return { present: true, magnitude: 35, planets: found.map(p => p.name), details: `${found.map(p => p.name).join(', ')} in the 12th house from the Sun (House ${sun.house}).` };
}
function ubhayachariYoga(planets) {
  const vesi = vesiYoga(planets), vasi = vasiYoga(planets);
  if (!vesi.present || !vasi.present) return NOT_PRESENT;
  return { present: true, magnitude: 45, planets: Array.from(new Set([...vesi.planets, ...vasi.planets])), details: `Both the 2nd house (${vesi.planets.join(', ')}) and 12th house (${vasi.planets.join(', ')}) from the Sun are occupied.` };
}

// Daridra Yoga: 11th lord placed in, or conjunct the lord of, a Dusthana (6th/8th/12th).
function daridraYoga(planets, ascendant) {
  const ascSignIndex = ascSignIndexOf(ascendant);
  const lord11 = houseLord(planets, ascSignIndex, 11);
  const p11 = byName(planets, lord11);
  if (!p11) return NOT_PRESENT;
  if (DUSTHANA_HOUSES.includes(Number(p11.house))) {
    return { present: true, magnitude: 40, planets: [lord11], details: `11th lord ${lord11} is placed in a Dusthana house (House ${p11.house}).` };
  }
  const dusthanaLords = DUSTHANA_HOUSES.map(h => houseLord(planets, ascSignIndex, h));
  const conjunctLord = dusthanaLords.find(name => name !== lord11 && sameSign(p11, byName(planets, name)));
  if (!conjunctLord) return NOT_PRESENT;
  return { present: true, magnitude: 35, planets: [lord11, conjunctLord], details: `11th lord ${lord11} is conjunct Dusthana lord ${conjunctLord} in ${p11.sign}, House ${p11.house}.` };
}

// Shrapit (Cursed) Yoga: Saturn conjunct Rahu.
function shrapitYoga(planets) {
  const saturn = byName(planets, 'Saturn'), rahu = byName(planets, 'Rahu');
  if (!sameSign(saturn, rahu)) return NOT_PRESENT;
  return { present: true, magnitude: 55, planets: ['Saturn', 'Rahu'], details: `Saturn conjunct Rahu in ${saturn.sign}, House ${saturn.house}.` };
}

function angarakYoga(nodeName) {
  return (planets) => {
    const mars = byName(planets, 'Mars'), np = byName(planets, nodeName);
    if (!sameSign(mars, np)) return NOT_PRESENT;
    return { present: true, magnitude: 45, planets: ['Mars', nodeName], details: `Mars conjunct ${nodeName} in ${mars.sign}, House ${mars.house}.` };
  };
}

function kaalSarpaYoga(planets) {
  const rahu = byName(planets, 'Rahu'), ketu = byName(planets, 'Ketu');
  if (!rahu || !ketu) return NOT_PRESENT;
  const classical = planets.filter(p => !['Rahu', 'Ketu'].includes(p.name));
  const rahuLon = rahu.longitude;
  const allOnOneSide = classical.every(p => { const d = ((p.longitude - rahuLon + 360) % 360); return d > 0 && d < 180; })
    || classical.every(p => { const d = ((p.longitude - rahuLon + 360) % 360); return d > 180 && d < 360; });
  if (!allOnOneSide) return NOT_PRESENT;
  return { present: true, magnitude: 70, planets: ['Rahu', 'Ketu'], details: 'All 7 classical planets fall on one side of the Rahu-Ketu axis.' };
}

// Fixed, always-shown list — each entry's howDerived/meaning text is shown
// in the Yogas tab table regardless of whether compute() finds it present.
const YOGA_DEFINITIONS = [
  { key: 'ruchaka', name: 'Ruchaka Yoga', polarity: 'good', howDerived: 'Mars in its own sign (Aries/Scorpio) or exaltation sign (Capricorn), placed in a Kendra (1st/4th/7th/10th) from the Ascendant.', meaning: 'Courage, physical strength, leadership, and a commanding, self-made presence.', compute: mahapurushaYoga('Mars') },
  { key: 'bhadra', name: 'Bhadra Yoga', polarity: 'good', howDerived: 'Mercury in its own sign (Gemini/Virgo) or exaltation sign (Virgo), placed in a Kendra from the Ascendant.', meaning: 'Sharp intellect, eloquence, business acumen, and skillful communication.', compute: mahapurushaYoga('Mercury') },
  { key: 'hamsa', name: 'Hamsa Yoga', polarity: 'good', howDerived: 'Jupiter in its own sign (Sagittarius/Pisces) or exaltation sign (Cancer), placed in a Kendra from the Ascendant.', meaning: 'Wisdom, ethics, respect from others, and a naturally dharmic, teaching-oriented nature.', compute: mahapurushaYoga('Jupiter') },
  { key: 'malavya', name: 'Malavya Yoga', polarity: 'good', howDerived: 'Venus in its own sign (Taurus/Libra) or exaltation sign (Pisces), placed in a Kendra from the Ascendant.', meaning: 'Charm, artistic talent, comfort, and a magnetic, refined personality.', compute: mahapurushaYoga('Venus') },
  { key: 'sasha', name: 'Sasha Yoga', polarity: 'good', howDerived: 'Saturn in its own sign (Capricorn/Aquarius) or exaltation sign (Libra), placed in a Kendra from the Ascendant.', meaning: 'Discipline, endurance, authority earned through hard work, and lasting achievement.', compute: mahapurushaYoga('Saturn') },
  { key: 'gajakesari', name: 'Gaja Kesari Yoga', polarity: 'good', howDerived: 'Jupiter is in a Kendra (1st/4th/7th/10th house) counted from the Moon.', meaning: 'Intelligence, a well-regarded reputation, and general good fortune.', compute: gajaKesariYoga },
  { key: 'budhaditya', name: 'Budhaditya Yoga', polarity: 'good', howDerived: 'Sun and Mercury are conjunct (same sign).', meaning: 'Sharp analytical intellect and success through communication or learning.', compute: budhadityaYoga },
  { key: 'chandramangal', name: 'Chandra-Mangal Yoga', polarity: 'good', howDerived: 'Moon and Mars are conjunct (same sign).', meaning: 'Drive, resourcefulness, and the ability to generate wealth through determined effort.', compute: chandraMangalYoga },
  { key: 'dhana', name: 'Dhana Yoga', polarity: 'good', howDerived: 'The lords of the 2nd house (wealth) and 11th house (gains) are conjunct (same sign).', meaning: 'A classical wealth-producing combination — accumulated assets and income working together.', compute: dhanaYoga },
  { key: 'raja', name: 'Raja Yoga', polarity: 'good', howDerived: 'The lord of a Kendra house (1st/4th/7th/10th) is conjunct the lord of a Trikona house (1st/5th/9th), same sign.', meaning: 'Power, status, and success — the union of an angular and a trinal lord is one of the classical hallmarks of a strong chart.', compute: rajaYoga },
  { key: 'neechabhanga', name: 'Neecha Bhanga Raja Yoga', polarity: 'good', howDerived: 'A debilitated planet\'s dispositor (the lord of its debilitation sign) is itself angular (Kendra) from the Ascendant, cancelling the debilitation.', meaning: 'A weakness that classically converts into an unusually strong, self-made rise once the cancellation takes hold.', compute: neechaBhangaYoga },
  { key: 'adhi', name: 'Adhi Yoga', polarity: 'good', howDerived: 'One or more of Mercury, Venus, Jupiter occupy the 6th, 7th, or 8th house counted from the Moon.', meaning: 'A comfortable, well-supported life; strengthens with each additional benefic found in these houses.', compute: adhiYoga },
  { key: 'sunapha', name: 'Sunapha Yoga', polarity: 'good', howDerived: 'A planet other than the Sun occupies the 2nd house counted from the Moon.', meaning: 'Self-earned wealth, intelligence, and reputation independent of family inheritance.', compute: sunaphaYoga },
  { key: 'anapha', name: 'Anapha Yoga', polarity: 'good', howDerived: 'A planet other than the Sun occupies the 12th house counted from the Moon.', meaning: 'Good health, dignified conduct, and a contented, comfortable temperament.', compute: anaphaYoga },
  { key: 'durudhara', name: 'Durudhara Yoga', polarity: 'good', howDerived: 'Planets other than the Sun occupy BOTH the 2nd and 12th houses counted from the Moon (Sunapha and Anapha together).', meaning: 'Wealth, vehicles, and comforts, combining the benefits of both Sunapha and Anapha.', compute: durudharaYoga },
  { key: 'vasumati', name: 'Vasumati Yoga', polarity: 'good', howDerived: 'Benefics (Mercury, Venus, Jupiter) occupy Upachaya houses (3rd/6th/10th/11th) from the Ascendant.', meaning: 'Growing prosperity and success that builds steadily over the native\'s lifetime.', compute: vasumatiYoga },
  { key: 'amala', name: 'Amala Yoga', polarity: 'good', howDerived: 'Only a benefic (no malefic) occupies the 10th house from the Ascendant.', meaning: 'An unblemished reputation and enduring fame through one\'s career/public actions.', compute: amalaYoga },
  { key: 'saraswati', name: 'Saraswati Yoga', polarity: 'good', howDerived: 'Jupiter, Venus, and Mercury all occupy Kendra, Trikona, or the 2nd house from the Ascendant, with Jupiter strong (own/exalted sign).', meaning: 'Deep learning, eloquence, artistic and scholarly accomplishment.', compute: saraswatiYoga },
  { key: 'lakshmi', name: 'Lakshmi Yoga', polarity: 'good', howDerived: 'The 9th lord is strong (own/exalted sign) and Venus is strong (own/exalted sign) or angular from the Ascendant.', meaning: 'Fortune, prosperity, and a graceful, well-favored life.', compute: lakshmiYoga },
  { key: 'kahala', name: 'Kahala Yoga', polarity: 'good', howDerived: 'The 4th and 9th lords are in mutual Kendra, and Jupiter is angular or trinal from the Ascendant.', meaning: 'Courage, authority, and the confidence to take bold, decisive action.', compute: kahalaYoga },
  { key: 'parvata', name: 'Parvata Yoga', polarity: 'good', howDerived: 'The lords of the 6th and 8th houses are both themselves placed in Kendra houses (rather than in Dusthanas).', meaning: 'A generally happy, obstacle-light life with good social standing.', compute: parvataYoga },
  { key: 'chamara', name: 'Chamara Yoga', polarity: 'good', howDerived: 'The Lagna lord is exalted and angular, and is conjunct or aspected by Jupiter.', meaning: 'Fame, long life, and eloquence — a classically celebrated combination for eminence.', compute: chamaraYoga },
  { key: 'vesi', name: 'Vesi Yoga', polarity: 'good', howDerived: 'A planet other than the Moon occupies the 2nd house counted from the Sun.', meaning: 'A straightforward, plain-speaking nature and steady effort toward one\'s goals.', compute: vesiYoga },
  { key: 'vasi', name: 'Vasi Yoga', polarity: 'good', howDerived: 'A planet other than the Moon occupies the 12th house counted from the Sun.', meaning: 'A charitable, virtuous disposition and freedom from excessive want.', compute: vasiYoga },
  { key: 'ubhayachari', name: 'Ubhayachari Yoga', polarity: 'good', howDerived: 'Planets other than the Moon occupy BOTH the 2nd and 12th houses counted from the Sun (Vesi and Vasi together).', meaning: 'Balanced fortune and comfort flanking the Sun\'s own significations.', compute: ubhayachariYoga },
  { key: 'kemadruma', name: 'Kemadruma Yoga', polarity: 'bad', howDerived: 'The Moon has no planet conjunct it and none in the houses immediately before or after it (isolated Moon).', meaning: 'A mind prone to isolation, self-doubt, or a sense of unsupported struggle, especially during Moon periods.', compute: kemadrumaYoga },
  { key: 'shakat', name: 'Shakat Yoga', polarity: 'bad', howDerived: 'The Moon falls in the 6th, 8th, or 12th house counted from Jupiter.', meaning: 'Fluctuating fortune, especially financial ups and downs.', compute: shakatYoga },
  { key: 'grahan_sun_rahu', name: 'Grahan Yoga (Sun-Rahu)', polarity: 'bad', howDerived: 'Sun is conjunct Rahu (same sign).', meaning: 'Clouds self-confidence, authority, or paternal relationships until worked through.', compute: grahanYoga('Sun', 'Rahu') },
  { key: 'grahan_sun_ketu', name: 'Grahan Yoga (Sun-Ketu)', polarity: 'bad', howDerived: 'Sun is conjunct Ketu (same sign).', meaning: 'Clouds self-confidence, authority, or paternal relationships until worked through.', compute: grahanYoga('Sun', 'Ketu') },
  { key: 'grahan_moon_rahu', name: 'Grahan Yoga (Moon-Rahu)', polarity: 'bad', howDerived: 'Moon is conjunct Rahu (same sign).', meaning: 'Clouds the mind, emotional stability, or the relationship with the mother until worked through.', compute: grahanYoga('Moon', 'Rahu') },
  { key: 'grahan_moon_ketu', name: 'Grahan Yoga (Moon-Ketu)', polarity: 'bad', howDerived: 'Moon is conjunct Ketu (same sign).', meaning: 'Clouds the mind, emotional stability, or the relationship with the mother until worked through.', compute: grahanYoga('Moon', 'Ketu') },
  { key: 'guruchandal', name: 'Guru Chandal Yoga', polarity: 'bad', howDerived: 'Jupiter is conjunct Rahu (same sign).', meaning: 'Distorts Jupiter\'s wisdom/guru significations with Rahu\'s unconventional or ethically ambiguous influence.', compute: guruChandalYoga },
  { key: 'vish', name: 'Vish Yoga', polarity: 'bad', howDerived: 'Moon is conjunct Saturn (same sign).', meaning: 'Emotional heaviness, delay, or pessimism, though Saturn can also mature the Moon\'s significations over time.', compute: vishYoga },
  { key: 'angarak_rahu', name: 'Angarak Yoga (Mars-Rahu)', polarity: 'bad', howDerived: 'Mars is conjunct Rahu (same sign).', meaning: 'Impulsive aggression, accidents, or disputes, particularly during activated periods.', compute: angarakYoga('Rahu') },
  { key: 'angarak_ketu', name: 'Angarak Yoga (Mars-Ketu)', polarity: 'bad', howDerived: 'Mars is conjunct Ketu (same sign).', meaning: 'Impulsive aggression, accidents, or disputes, particularly during activated periods.', compute: angarakYoga('Ketu') },
  { key: 'kaalsarpa', name: 'Kaal Sarpa Yoga', polarity: 'bad', howDerived: 'All 7 classical planets fall on one side of the Rahu-Ketu axis (the nodes "hem in" every other planet).', meaning: 'A life that can feel externally obstructed or delayed, but also linked to sudden, unconventional rises once worked through.', compute: kaalSarpaYoga },
  { key: 'daridra', name: 'Daridra Yoga', polarity: 'bad', howDerived: 'The 11th lord (house of gains) is placed in a Dusthana (6th/8th/12th house), or is conjunct the lord of a Dusthana.', meaning: 'Difficulty retaining income/gains, or gains achieved only through struggle.', compute: daridraYoga },
  { key: 'shrapit', name: 'Shrapit Yoga', polarity: 'bad', howDerived: 'Saturn is conjunct Rahu (same sign).', meaning: 'Classically read as a "cursed" combination bringing prolonged delay or a sense of being held back until its karmic lesson is resolved.', compute: shrapitYoga }
];

if (typeof module !== 'undefined') {
  module.exports = { YOGA_RULES_LOGIC_TEXT, YOGA_DEFINITIONS };
}
