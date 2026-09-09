// Shadbala ("six-fold strength") — classical Parashari quantitative planetary
// strength, for the 7 classical planets (Sun..Saturn). Rahu/Ketu are NOT
// scored: classical Shadbala (BPHS) is defined only for the 7 grahas that
// have a physical body/orbit; this app has no settled methodology for a
// nodal Shadbala (their exaltation/debilitation is itself flagged elsewhere
// in this app as disputed), so they are excluded rather than guessed at.
//
// Units: all six Balas are computed in VIRUPA (1/60 of a Rupa) and summed;
// the total is also shown in RUPA (virupas / 60), the classical display
// unit. This file is the calculation engine only — see
// shadbalaInterpretation.js for the human-readable narrative layer.
//
// Reuses, rather than recomputes: planet longitude/sign/house/retrograde/
// combust/nakshatra (birthChart.js via state.chart), sign dignity
// (dignityDetails.js), sign lord (parashariTables.js), Naisargika Maitri
// (planetaryStrength.js), whole-sign graha drishti (aspects.js), D9/D2/D3/
// D7/D12/D30 varga positions (divisionalCharts.js's vargaPosition), and
// real-time planet longitudes (ephemeris.js's computeSingleLongitude /
// computePlanetLongitudes) for the extra date offsets Shadbala itself needs
// (speed, declination-adjacent dates). Sunrise/sunset is the one genuinely
// NEW capability this app lacks and now gains (sunTimes.js).

const SHADBALA_LOGIC_TEXT = [
  ['Shadbala — Logic and Sequence'],
  [''],
  ['1. SCOPE: computed for the 7 classical planets only (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) — not Rahu/Ketu, which have no settled classical Shadbala methodology.'],
  ['2. UNITS: all sub-components are computed in Virupa (1/60 Rupa) and summed; totals are also shown in Rupa (virupas/60), the standard classical display unit.'],
  ['3. SIX COMPONENTS: Sthana Bala (positional, 5 sub-parts: Uchcha/Saptavargaja/Oja-Yugma/Kendradi/Drekkana), Dig Bala (directional), Kala Bala (temporal, 6 sub-parts: Nathonnata/Paksha/Tribhaga/Dina-Hora/Ayana/Yuddha), Cheshta Bala (motion-based, for the 5 non-luminaries; Sun/Moon use documented substitute conventions), Naisargika Bala (fixed natural strength, a constant table), and Drik Bala (aspectual, this app\'s own simplified reuse of its existing whole-sign graha drishti rather than the classical exact-degree virupa table).'],
  ['4. STRENGTH ≠ GOODNESS: Shadbala measures a planet\'s CAPACITY to deliver results, not whether those results are favorable — a strong functional malefic delivers difficult results strongly; a weak benefic has good intent but limited capacity to manifest it. This distinction is carried through explicitly in the interpretation layer (shadbalaInterpretation.js), never collapsed into a single "strong = good" reading.'],
  [''],
  ['Caveat — known simplifications from the full classical methodology (documented rather than silently approximated): Dig Bala uses this app\'s whole-sign house boundaries (Ascendant longitude + 30° per house) as a stand-in for the classical quadrant angle cusps (Lagna/7th/10th/4th from a full house system), since this app is whole-sign-only throughout. Varsha Bala and Masa Bala (year/month lord) are NOT computed — they require Hindu luni-solar calendar/Sankranti determination this app does not implement; only Dina (weekday, using the birth location\'s LOCAL calendar day) and Hora (planetary-hour) lord matching are used for that Kala Bala sub-part. Ayana Bala uses a linear declination-based approximation (applied uniformly to all 7 planets) rather than the classical Rsine/dyujya trigonometric table. Nathonnata Bala uses a linear 12-hour model from the nearest true noon/midnight rather than ghati-based day/night-length-proportional arithmetic. Cheshta Bala uses a continuous speed-ratio approximation rather than the classical discrete named motion-states (Vakra/Anuvakra/Manda/Sama/Chara/Ati-chara), since exact virupa values for each named state vary across secondary sources. Drik Bala reuses this app\'s existing whole-sign graha drishti with a fixed per-aspect virupa magnitude, rather than the classical exact-degree-graded virupa table. Yuddha Bala uses a fixed app-defined transfer magnitude. Every one of these is a deliberate, labeled choice — not a hidden shortcut — and each is called out again at the point it is used.']
];

// ---------- Constants ----------

const SHADBALA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// Naisargika (natural) Bala — a fixed classical constant table, unrelated to
// any chart: 60 virupas divided into 7 equal steps (60/7 each), assigned in
// this fixed strength order (weakest to strongest): Saturn, Mars, Mercury,
// Jupiter, Venus, Moon, Sun.
const NAISARGIKA_BALA_VIRUPA = {
  Saturn: 60 / 7 * 1, Mars: 60 / 7 * 2, Mercury: 60 / 7 * 3,
  Jupiter: 60 / 7 * 4, Venus: 60 / 7 * 5, Moon: 60 / 7 * 6, Sun: 60 / 7 * 7
};

// Classical minimum required total Shadbala, in RUPA (well-attested BPHS figures).
const REQUIRED_MINIMUM_RUPA = { Sun: 5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5 };

// Dig Bala: house (from Lagna) of maximum directional strength per planet;
// minimum strength is at the opposite (house + 6) house.
const DIG_BALA_STRONG_HOUSE = { Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Moon: 4, Venus: 4, Saturn: 7 };

// Mean daily motion (degrees/day) — standard astronomical mean motions, used
// as the Cheshta Bala "Sama" (mean-speed) reference point.
const MEAN_DAILY_MOTION = { Sun: 0.9856, Moon: 13.176, Mars: 0.524, Mercury: 1.383, Jupiter: 0.0831, Venus: 1.602, Saturn: 0.0335 };

// Ayana Bala directional preference: planets favoring Uttarayana (northern
// declination) vs. the two classical exceptions favoring Dakshinayana.
const AYANA_NORTH_FAVORED = ['Sun', 'Mars', 'Jupiter', 'Venus', 'Mercury'];
const AYANA_SOUTH_FAVORED = ['Moon', 'Saturn'];

const KENDRA_HOUSES_SB = [1, 4, 7, 10];
const PANAPHARA_HOUSES_SB = [2, 5, 8, 11];
const APOKLIMA_HOUSES_SB = [3, 6, 9, 12];

// The 7 vargas classically used for Saptavargaja Bala.
const SAPTAVARGA_KEYS = ['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30'];

// Standard classical Saptavargaja Bala per-varga dignity points (BPHS):
// 45/30/22.5/15/10/7.5/3.75, halving-ish from Moolatrikona down to Great
// Enemy. This app's relationBetween() only distinguishes plain Friend/
// Neutral/Enemy (Naisargika Maitri), not the full 5-tier Panchadha Maitri
// (great friend/great enemy), so "great friend" and "great enemy" are never
// actually assigned by saptavargaDignityPoints() below — documented as a
// simplification rather than silently rounding those two tiers away.
const DIGNITY_POINTS_VIRUPA = {
  moolatrikona: 45, own: 30, greatFriend: 22.5, friend: 15, neutral: 10, enemy: 7.5, greatEnemy: 3.75
};

const OBLIQUITY_DEG = 23.4394;

function normDeg(d) { return ((d % 360) + 360) % 360; }
function signIndexOfSB(lon) { return Math.floor(normDeg(lon) / 30) % 12; }

// ---------- Shared helpers reused by multiple calculators ----------

// Naisargika Maitri-based dignity tier for Saptavargaja Bala (moolatrikona/
// own already known separately; friend tiers use planetaryStrength.js's
// relationBetween, treating "great friend"/"great enemy" as unavailable
// without full Panchadha Maitri — folded into plain friend/enemy).
function saptavargaDignityPoints(planetName, sign, degreeInSign) {
  const detail = detailedDignity(planetName, sign, degreeInSign);
  if (detail.tier === 'Moolatrikona') return DIGNITY_POINTS_VIRUPA.moolatrikona;
  if (detail.tier === 'Own Sign') return DIGNITY_POINTS_VIRUPA.own;
  if (detail.tier === 'Exalted') return DIGNITY_POINTS_VIRUPA.moolatrikona; // treated at Moolatrikona-equivalent ceiling for this sub-bala
  if (detail.tier === 'Debilitated') return DIGNITY_POINTS_VIRUPA.greatEnemy;
  const lord = SIGN_LORD[sign];
  const rel = relationBetween(planetName, lord);
  if (rel === 'Friend') return DIGNITY_POINTS_VIRUPA.friend;
  if (rel === 'Enemy') return DIGNITY_POINTS_VIRUPA.enemy;
  return DIGNITY_POINTS_VIRUPA.neutral;
}

// ---------- 1. STHANA BALA ----------

function computeUchchaBala(planetName, sign, degreeInSign) {
  // Angular distance from the EXACT debilitation point (0-180); 180 (exact
  // exaltation, opposite the debilitation point) -> 60 virupas; 0 (exact
  // debilitation) -> 0 virupas.
  const exaltDeg = EXALTATION_DEGREE[planetName];
  if (exaltDeg === undefined) return { value: 0, note: 'No classical exact exaltation degree defined for this planet.' };
  const debilSign = DEBILITATION_SIGN[planetName];
  const debilExactLongitude = normDeg(SIGNS.indexOf(debilSign) * 30 + exaltDeg);
  const planetLongitude = normDeg(SIGNS.indexOf(sign) * 30 + degreeInSign);
  let diff = Math.abs(planetLongitude - debilExactLongitude);
  if (diff > 180) diff = 360 - diff;
  const value = diff / 3;
  return { value, distanceFromDebilitation: diff, note: `${diff.toFixed(2)}° from its exact debilitation point (${debilSign} ${exaltDeg}°).` };
}

function computeSaptavargajaBala(planetName, planetLongitude) {
  const perVarga = SAPTAVARGA_KEYS.map(key => {
    const pos = vargaPosition(planetLongitude, key);
    const degInSign = normDeg(pos.longitude) % 30;
    const points = saptavargaDignityPoints(planetName, pos.sign, degInSign);
    return { varga: key, sign: pos.sign, points };
  });
  const value = perVarga.reduce((s, v) => s + v.points, 0) / perVarga.length;
  return { value, perVarga };
}

function computeOjaYugmaBala(planetName, rasiSign, navamsaSign) {
  const oddPreferring = ['Sun', 'Mars', 'Jupiter', 'Saturn'];
  const evenPreferring = ['Moon', 'Venus'];
  function isOddSign(sign) { return SIGNS.indexOf(sign) % 2 === 0; } // Aries(0)=odd sign #1
  function halfScore(sign) {
    if (planetName === 'Mercury') return 15; // classically always gets full points here
    const odd = isOddSign(sign);
    if (oddPreferring.includes(planetName)) return odd ? 15 : 0;
    if (evenPreferring.includes(planetName)) return !odd ? 15 : 0;
    return 0;
  }
  const rasiScore = halfScore(rasiSign);
  const navamsaScore = halfScore(navamsaSign);
  return { value: rasiScore + navamsaScore, rasiScore, navamsaScore };
}

function computeKendradiBala(house) {
  if (KENDRA_HOUSES_SB.includes(house)) return { value: 60, tier: 'Kendra (angular)' };
  if (PANAPHARA_HOUSES_SB.includes(house)) return { value: 30, tier: 'Panaphara (succedent)' };
  return { value: 15, tier: 'Apoklima (cadent)' };
}

const DREKKANA_MALE = ['Sun', 'Mars', 'Jupiter'];
const DREKKANA_FEMALE = ['Moon', 'Venus'];
const DREKKANA_NEUTER = ['Mercury', 'Saturn'];
function computeDrekkanaBala(planetName, degreeInSign) {
  const drekkanaIndex = Math.floor(degreeInSign / 10); // 0,1,2
  let matches;
  if (drekkanaIndex === 0) matches = DREKKANA_MALE.includes(planetName);
  else if (drekkanaIndex === 1) matches = DREKKANA_FEMALE.includes(planetName);
  else matches = DREKKANA_NEUTER.includes(planetName);
  return { value: matches ? 15 : 0, drekkanaIndex: drekkanaIndex + 1 };
}

function computeSthanaBala(planet) {
  const degreeInSign = normDeg(planet.longitude) % 30;
  const uchcha = computeUchchaBala(planet.name, planet.sign, degreeInSign);
  const saptavargaja = computeSaptavargajaBala(planet.name, planet.longitude);
  const navamsaSign = vargaPosition(planet.longitude, 'D9').sign;
  const ojaYugma = computeOjaYugmaBala(planet.name, planet.sign, navamsaSign);
  const kendradi = computeKendradiBala(Number(planet.house));
  const drekkana = computeDrekkanaBala(planet.name, degreeInSign);
  const total = uchcha.value + saptavargaja.value + ojaYugma.value + kendradi.value + drekkana.value;
  return { total, uchcha, saptavargaja, ojaYugma, kendradi, drekkana };
}

// ---------- 2. DIG BALA ----------

function computeDigBala(planet, ascendantLongitude) {
  const strongHouse = DIG_BALA_STRONG_HOUSE[planet.name];
  const strongCuspLongitude = normDeg(ascendantLongitude + (strongHouse - 1) * 30);
  const weakPointLongitude = normDeg(strongCuspLongitude + 180);
  let diff = Math.abs(normDeg(planet.longitude) - weakPointLongitude);
  if (diff > 180) diff = 360 - diff;
  const value = diff / 3;
  return { value, strongHouse, distanceFromWeakPoint: diff };
}

// ---------- 3. KALA BALA ----------

function computeNathonnataBala(planetName, birthUtc, dayNight) {
  if (planetName === 'Mercury') return { value: 60, note: 'Mercury is classically treated as always strong in this Kala Bala sub-part.' };
  const nightStrong = ['Moon', 'Mars', 'Saturn'].includes(planetName);
  if (!dayNight.periodStart || !dayNight.periodEnd) return { value: 30, note: 'Sunrise/sunset unavailable at this latitude/date — using a neutral midpoint value.' };
  // True noon/midnight = midpoint of the current day or night period; find
  // the NEAREST occurrence of the planet's preferred reference (noon for
  // day-strong planets, midnight for night-strong) and linearly scale by
  // its distance from birth, over a fixed 12-hour half-cycle.
  const dayMid = new Date((dayNight.periodStart.getTime() + dayNight.periodEnd.getTime()) / 2);
  const referenceIsNow = (dayNight.isDaytime && !nightStrong) || (!dayNight.isDaytime && nightStrong);
  const hoursFromReference = referenceIsNow
    ? Math.abs(birthUtc.getTime() - dayMid.getTime()) / 3600000
    : 12 - Math.min(12, Math.abs(birthUtc.getTime() - dayMid.getTime()) / 3600000);
  const clamped = Math.max(0, Math.min(12, hoursFromReference));
  const value = 60 * (1 - clamped / 12);
  return { value, note: `${dayNight.isDaytime ? 'Daytime' : 'Nighttime'} birth; ${clamped.toFixed(1)}h (linearized) from this planet's peak reference point.` };
}

function computePakshaBala(moonLongitude, sunLongitude, planetName) {
  const elongation = normDeg(moonLongitude - sunLongitude); // 0-360, 0=new, 180=full
  const baseValue = elongation <= 180 ? elongation : 360 - elongation; // 0 (new/full boundary side) .. 180 (full moon)
  const naturalBenefics = ['Moon', 'Jupiter', 'Venus', 'Mercury'];
  if (planetName === 'Moon') {
    return { value: (baseValue / 180) * 120, elongation, note: 'Moon\'s own Paksha Bala uses double the standard scale (max 120, not 60).' };
  }
  if (naturalBenefics.includes(planetName)) {
    return { value: (baseValue / 180) * 60, elongation };
  }
  return { value: ((180 - baseValue) / 180) * 60, elongation };
}

function computeTribhagaBala(planetName, birthUtc, dayNight) {
  if (planetName === 'Jupiter') return { value: 60, note: 'Jupiter is classically treated as always strong in Tribhaga Bala.' };
  if (!dayNight.periodStart || !dayNight.periodEnd) return { value: 0, note: 'Sunrise/sunset unavailable — cannot determine Tribhaga.' };
  const fraction = (birthUtc.getTime() - dayNight.periodStart.getTime()) / (dayNight.periodEnd.getTime() - dayNight.periodStart.getTime());
  const third = Math.min(2, Math.max(0, Math.floor(fraction * 3)));
  const dayLords = ['Mercury', 'Sun', 'Saturn'];
  const nightLords = ['Moon', 'Venus', 'Mars'];
  const lord = (dayNight.isDaytime ? dayLords : nightLords)[third];
  return { value: lord === planetName ? 60 : 0, third: third + 1, lord };
}

const WEEKDAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // 0=Sun..6=Sat
const HORA_SEQUENCE = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']; // Chaldean order

// Weekday index (0=Sun..6=Sat) in the birth location's LOCAL civil calendar,
// not UTC — a birth late at night or just after midnight local time can
// fall on a different UTC calendar date, which would otherwise assign the
// wrong Dina (weekday) lord.
function localWeekdayIndex(date, tzInfo) {
  if (tzInfo && tzInfo.mode === 'iana') {
    try {
      const weekdayAbbr = new Intl.DateTimeFormat('en-US', { timeZone: tzInfo.zone, weekday: 'short' }).format(date);
      const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      if (weekdayAbbr in map) return map[weekdayAbbr];
    } catch (e) { /* fall through to offset/UTC below */ }
  }
  if (tzInfo && tzInfo.mode === 'offset' && typeof tzInfo.offsetMinutes === 'number') {
    return new Date(date.getTime() + tzInfo.offsetMinutes * 60000).getUTCDay();
  }
  return date.getUTCDay();
}

function computeDinaHoraBala(planetName, birthUtc, dayNight, tzInfo) {
  // Weekday is determined at the LOCAL sunrise of the current day/night
  // period, the classical start-of-day convention, not UTC midnight — and
  // now in the birth location's own local calendar day, not UTC's.
  const referenceForWeekday = dayNight.isDaytime ? dayNight.periodStart : (dayNight.events.prevSunrise || birthUtc);
  const weekdayIndex = localWeekdayIndex(referenceForWeekday || birthUtc, tzInfo);
  const dinaLord = WEEKDAY_LORDS[weekdayIndex];
  const dinaMatch = dinaLord === planetName;

  let horaLord = null;
  if (dayNight.periodStart && dayNight.periodEnd) {
    const totalPeriodHours = (dayNight.periodEnd - dayNight.periodStart) / 3600000;
    const horaLengthHours = totalPeriodHours / 12;
    const elapsedHours = (birthUtc - dayNight.periodStart) / 3600000;
    const horaIndex = Math.min(11, Math.max(0, Math.floor(elapsedHours / horaLengthHours)));
    // Each day's first daytime hora is ruled by that day's own weekday lord;
    // the sequence then cycles through all 24 horas (12 day + 12 night) in
    // the fixed Chaldean order starting from the weekday lord.
    const startIndex = HORA_SEQUENCE.indexOf(dinaLord);
    const sequencePosition = dayNight.isDaytime ? horaIndex : horaIndex + 12;
    horaLord = HORA_SEQUENCE[(startIndex + sequencePosition) % 7];
  }
  const horaMatch = horaLord === planetName;
  const value = Math.max(dinaMatch ? 45 : 0, horaMatch ? 45 : 0);
  return { value, dinaLord, horaLord, dinaMatch, horaMatch, note: 'Varsha (year) and Masa (month) lord matching are NOT included — see file-level caveat.' };
}

function computeAyanaBala(declinationDeg, planetName) {
  // Unlike Nathonnata Bala, Mercury does NOT get an automatic maximum here —
  // that "always strong" convention is specific to Nathonnata (and Jupiter's
  // to Tribhaga); Ayana Bala applies the same declination formula to all 7
  // planets, with Mercury grouped among the Uttarayana(north)-favoring set.
  const normalized = Math.max(-1, Math.min(1, declinationDeg / OBLIQUITY_DEG));
  if (AYANA_SOUTH_FAVORED.includes(planetName)) {
    return { value: 30 - normalized * 30, declination: declinationDeg };
  }
  return { value: 30 + normalized * 30, declination: declinationDeg };
}

function computeYuddhaBala(planets) {
  const eligible = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const result = {};
  eligible.forEach(name => { result[name] = { value: 0 }; });
  const list = planets.filter(p => eligible.includes(p.name));
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.sign !== b.sign) continue;
      const diff = Math.abs(normDeg(a.longitude) - normDeg(b.longitude));
      const sep = Math.min(diff, 360 - diff);
      if (sep <= 1) {
        const winner = a.longitude > b.longitude ? a.name : b.name;
        const loser = winner === a.name ? b.name : a.name;
        result[winner] = { value: 30, note: `Graha Yuddha winner vs ${loser} (this app's fixed transfer magnitude, not a universally standardized classical value).` };
        result[loser] = { value: -30, note: `Graha Yuddha loser vs ${winner} (this app's fixed transfer magnitude, not a universally standardized classical value).` };
      }
    }
  }
  return result;
}

function computeKalaBala(planet, chart, dayNight, yuddhaResult) {
  const sun = chart.planets.find(p => p.name === 'Sun');
  const moon = chart.planets.find(p => p.name === 'Moon');
  const nathonnata = computeNathonnataBala(planet.name, chart.birthUtc, dayNight);
  const paksha = computePakshaBala(moon.longitude, sun.longitude, planet.name);
  const tribhaga = computeTribhagaBala(planet.name, chart.birthUtc, dayNight);
  const dinaHora = computeDinaHoraBala(planet.name, chart.birthUtc, dayNight, chart.birthTimeZoneInfo);
  const declination = Astronomy.Equator(planet.name, chart.birthUtc, new Astronomy.Observer(0, 0, 0), true, true).dec;
  const ayana = computeAyanaBala(declination, planet.name);
  const yuddha = yuddhaResult[planet.name] || { value: 0 };
  const total = nathonnata.value + paksha.value + tribhaga.value + dinaHora.value + ayana.value + yuddha.value;
  return { total, nathonnata, paksha, tribhaga, dinaHora, ayana, yuddha };
}

// ---------- 4. CHESHTA BALA ----------

function planetDailySpeed(planetName, birthUtc) {
  const now = computeSingleLongitude(planetName, birthUtc);
  const later = computeSingleLongitude(planetName, new Date(birthUtc.getTime() + 86400000));
  return ((later - now + 540) % 360) - 180; // signed degrees/day
}

function computeCheshtaBala(planet, ayanaBalaValue) {
  if (planet.name === 'Sun') {
    return { value: ayanaBalaValue, note: 'Sun does not retrograde; by common classical convention its Cheshta Bala is taken equal to its Ayana Bala.' };
  }
  const speed = planetDailySpeed(planet.name, planet.birthUtcForSpeed);
  const mean = MEAN_DAILY_MOTION[planet.name];
  let value, state;
  if (speed < 0) { value = 60; state = 'Retrograde (Vakra)'; }
  else if (Math.abs(speed) < mean * 0.05) { value = 30; state = 'Near-stationary'; }
  else if (speed > mean) { value = Math.min(50, 30 + ((speed - mean) / mean) * 30); state = 'Fast direct'; }
  else { value = Math.max(15, 30 - ((mean - speed) / mean) * 15); state = 'Slow direct'; }
  return { value, speed, meanSpeed: mean, state, note: `Daily motion ${speed.toFixed(4)}°/day vs. mean ${mean}°/day — ${state}. Numerically HIGH strength at retrograde is the classical convention: it does not mean the outcome is favorable, only that the planet's capacity to act is elevated.` };
}

// ---------- 5. NAISARGIKA BALA ----------

function computeNaisargikaBala(planetName) {
  return { value: NAISARGIKA_BALA_VIRUPA[planetName] };
}

// ---------- 6. DRIK BALA ----------

function computeDrikBala(planet, allPlanets) {
  const signIndex = SIGNS.indexOf(planet.sign);
  const contributions = [];
  allPlanets.forEach(caster => {
    if (caster.name === planet.name) return;
    const casterSignIndex = SIGNS.indexOf(caster.sign);
    const offsets = ASPECT_OFFSETS[caster.name] || ASPECT_OFFSETS.default;
    const hits = offsets.some(o => (casterSignIndex + (o - 1)) % 12 === signIndex);
    if (!hits) return;
    const natural = NATURAL_BENEFICS.includes(caster.name) ? 'benefic' : 'malefic';
    const magnitude = 15; // app-defined fixed per-aspect virupa magnitude — see file-level caveat
    contributions.push({ from: caster.name, natural, value: natural === 'benefic' ? magnitude : -magnitude });
  });
  const total = Math.max(-60, Math.min(60, contributions.reduce((s, c) => s + c.value, 0)));
  return { total, contributions };
}

// ---------- Orchestration ----------

function classifyStrengthByRatio(ratio) {
  if (ratio >= 1.5) return 'Very Strong';
  if (ratio >= 1.15) return 'Strong';
  if (ratio >= 1.0) return 'Above Average';
  if (ratio >= 0.85) return 'Moderate';
  if (ratio >= 0.6) return 'Below Average';
  if (ratio >= 0.4) return 'Weak';
  return 'Very Weak';
}

// chart: { planets, ascendant, birthUtc }. lat/lon: birth coordinates (for sunrise/sunset).
function computeShadbala(chart, latitude, longitude) {
  const dayNight = dayNightContext(chart.birthUtc, latitude, longitude);
  const yuddhaResult = computeYuddhaBala(chart.planets);
  const ascendantLongitude = chart.ascendant.longitude;

  const results = {};
  SHADBALA_PLANETS.forEach(name => {
    const planet = chart.planets.find(p => p.name === name);
    const sthana = computeSthanaBala(planet);
    const dig = computeDigBala(planet, ascendantLongitude);
    const kala = computeKalaBala(planet, chart, dayNight, yuddhaResult);
    const cheshta = computeCheshtaBala({ ...planet, birthUtcForSpeed: chart.birthUtc }, kala.ayana.value);
    const naisargika = computeNaisargikaBala(name);
    const drik = computeDrikBala(planet, chart.planets);

    const totalVirupa = sthana.total + dig.value + kala.total + cheshta.value + naisargika.value + drik.total;
    const totalRupa = totalVirupa / 60;
    const requiredRupa = REQUIRED_MINIMUM_RUPA[name];
    const ratio = totalRupa / requiredRupa;

    results[name] = {
      name, sign: planet.sign, house: planet.house,
      sthana, dig, kala, cheshta, naisargika, drik,
      totalVirupa, totalRupa, requiredRupa, ratio,
      strength: classifyStrengthByRatio(ratio)
    };
  });

  // Rank (1 = strongest) among the 7 by total Rupa.
  const ranked = Object.values(results).sort((a, b) => b.totalRupa - a.totalRupa);
  ranked.forEach((r, i) => { results[r.name].rank = i + 1; });

  // Top strength/weakness contributors per planet, by each component's % of total.
  Object.values(results).forEach(r => {
    const components = [
      { key: 'Sthana Bala', value: r.sthana.total },
      { key: 'Dig Bala', value: r.dig.value },
      { key: 'Kala Bala', value: r.kala.total },
      { key: 'Cheshta Bala', value: r.cheshta.value },
      { key: 'Naisargika Bala', value: r.naisargika.value },
      { key: 'Drik Bala', value: r.drik.total }
    ];
    r.components = components.map(c => ({ ...c, percentOfTotal: r.totalVirupa ? (c.value / r.totalVirupa) * 100 : 0 }));
    const positive = r.components.filter(c => c.value > 0).sort((a, b) => b.value - a.value);
    const negative = r.components.filter(c => c.value <= 0).sort((a, b) => a.value - b.value);
    r.topStrengths = positive.slice(0, 3);
    r.topWeaknesses = negative.length ? negative.slice(0, 3) : positive.slice(-3).reverse();
  });

  return { planets: results, dayNight, ranked: ranked.map(r => r.name) };
}

if (typeof module !== 'undefined') {
  module.exports = {
    SHADBALA_LOGIC_TEXT, SHADBALA_PLANETS, NAISARGIKA_BALA_VIRUPA, REQUIRED_MINIMUM_RUPA,
    DIG_BALA_STRONG_HOUSE, MEAN_DAILY_MOTION, SAPTAVARGA_KEYS,
    computeSthanaBala, computeDigBala, computeKalaBala, computeCheshtaBala, computeNaisargikaBala, computeDrikBala,
    classifyStrengthByRatio, computeShadbala
  };
}
