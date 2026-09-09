// Kakshya ("cell") Analysis — a micro-timing refinement layered on top of
// the EXISTING Bhinnashtakavarga/Sarvashtakavarga data (js/ashtakvarga.js)
// and the existing Swiss-Ephemeris-first longitude engine
// (js/ephemeris.js's computeSingleLongitude). No BAV/SAV or planetary
// position calculation is duplicated here.
//
// KAKSHYA DIVISION (classical, Brihat Parashara Hora Shastra's Ashtakavarga
// chapter): each 30-degree sign is split into 8 equal Kakshyas of 3d45m
// each, ruled in this FIXED sequence: Saturn, Jupiter, Mars, Sun, Venus,
// Mercury, Moon, Lagna.

const KAKSHYA_LOGIC_TEXT = [
  ['Kakshya Analysis — Logic and Sequence'],
  [''],
  ['1. NOTATION: same Bindu convention as the rest of this app\'s Ashtakavarga (0-8 bindus per sign) — see ashtakvargaRuleDatabase.js\'s notation statement.'],
  ['2. DIVISION: each sign is split into 8 equal Kakshyas of 3d45m (3.75 degrees) each, in the fixed classical sequence Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna — this exact division and sequence is standard across Ashtakavarga texts (Classical / Textually Supported).'],
  ['3. RELEVANT BAV CONTRIBUTOR: for a transiting planet P currently in sign S, its "Kakshya lord" K is checked as a CONTRIBUTOR in P\'s OWN Bhinnashtakavarga rule table — does K\'s classical house-list (js/ashtakvarga.js\'s ASHTAKVARGA_TABLES) include the house-count from K\'s NATAL sign to S? This reuses the exact same rule table the app\'s existing BAV already uses; it does not add a new rule, only answers a more granular per-contributor question the existing summed BAV total does not expose on its own.'],
  ['4. TRANSIT TIMELINE: entry/exit instants for each Kakshya are found by sampling the planet\'s real sidereal longitude (via computeSingleLongitude, the same engine used everywhere else in this app) and binary-searching the exact crossing instant whenever the sampled Kakshya number changes — this correctly handles retrograde re-entries into a previously-visited Kakshya, the same technique already used for Sade Sati episode detection.'],
  ['5. ASSESSMENT: a qualitative Strongly Supportive .. Strongly Challenging label combines three factors — whether the Kakshya lord contributes a bindu to the transited sign, whether the transiting planet\'s own BAV bindus in that sign are above/below its own 12-sign average, and whether the sign\'s SAV is above/below the chart average. This is THIS APP\'S OWN synthesis pattern (a Practitioner Technique, not a single classical citation) combining independently classical inputs — see AV_RULE_007 in the rule database.'],
  ['6. HIERARCHY: Kakshya is a REFINEMENT layer only. It never overrides natal promise, house/lord analysis, dasha, or the larger transit — it only refines WHEN, within an already-indicated transit, the influence is more or less likely to express.'],
  ['']
];

const KAKSHYA_LORDS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Lagna'];
const KAKSHYA_WIDTH_DEG = 3.75;
const KAKSHYA_RANGES = KAKSHYA_LORDS.map((lord, i) => ({
  number: i + 1, lord,
  startDeg: i * KAKSHYA_WIDTH_DEG, endDeg: (i + 1) * KAKSHYA_WIDTH_DEG,
  rangeText: `${degToDM(i * KAKSHYA_WIDTH_DEG)}-${degToDM((i + 1) * KAKSHYA_WIDTH_DEG)}`
}));

function degToDM(deg) {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}'`;
}

function kkNormDeg(d) { return ((d % 360) + 360) % 360; }
function kkSignIndex(lon) { return Math.floor(kkNormDeg(lon) / 30) % 12; }
function kakshyaNumberOf(degInSign) { return Math.min(7, Math.floor(degInSign / KAKSHYA_WIDTH_DEG)) + 1; }

// Does contributor `contributorName` (a planet name, or 'Lagna') contribute a
// bindu to `transitSignIndex` within `targetPlanet`'s own Bhinnashtakavarga,
// per the EXISTING ASHTAKVARGA_TABLES rule (ashtakvarga.js) — reusing that
// table, not adding a new one.
function contributorContributes(targetPlanet, contributorName, contributorNatalSignIndex, transitSignIndex) {
  const table = ASHTAKVARGA_TABLES[targetPlanet];
  if (!table || contributorNatalSignIndex === null || contributorNatalSignIndex === undefined) return null;
  const houses = table[contributorName];
  if (!houses) return null;
  const count = ((transitSignIndex - contributorNatalSignIndex + 12) % 12) + 1;
  return houses.includes(count);
}

function contributorNatalSignIndexOf(contributorName, chart, ascendantSignIndex) {
  if (contributorName === 'Lagna') return ascendantSignIndex;
  const p = chart.planets.find(pp => pp.name === contributorName);
  return p ? SIGNS.indexOf(p.sign) : null;
}

// Full "show your work" chain for one planet at one instant.
function computeKakshyaInfo(planetName, atDate, chart, ashtakvarga) {
  const longitude = computeSingleLongitude(planetName, atDate);
  const lon = kkNormDeg(longitude);
  const signIndex = kkSignIndex(lon);
  const sign = SIGNS[signIndex];
  const degInSign = lon - signIndex * 30;
  const kakshyaNumber = kakshyaNumberOf(degInSign);
  const kakshyaLord = KAKSHYA_LORDS[kakshyaNumber - 1];
  const house = wholeSignHouseOf(signIndex, ashtakvarga.ascendantSignIndex);
  const bavValues = ashtakvarga.bav[planetName] || null;
  const bavTotal = bavValues ? bavValues[signIndex] : null;
  const bavAverage = bavValues ? bavValues.reduce((s, v) => s + v, 0) / 12 : null;
  const sav = ashtakvarga.sav[signIndex];
  const savAverage = ashtakvarga.sav.reduce((s, v) => s + v, 0) / 12;

  const contributorNatalSignIndex = contributorNatalSignIndexOf(kakshyaLord, chart, ashtakvarga.ascendantSignIndex);
  const contributes = contributorContributes(planetName, kakshyaLord, contributorNatalSignIndex, signIndex);

  let score = 0;
  score += contributes ? 1 : (contributes === false ? -1 : 0);
  if (bavTotal !== null) score += bavTotal > bavAverage ? 1 : (bavTotal < bavAverage ? -1 : 0);
  score += sav > savAverage ? 1 : (sav < savAverage ? -1 : 0);
  const assessment = score >= 2 ? 'Strongly Supportive' : score === 1 ? 'Supportive' : score === 0 ? 'Mixed'
    : score === -1 ? 'Challenging' : 'Strongly Challenging';

  return {
    planet: planetName, atDate, longitude: lon, sign, signIndex, degInSign, house,
    kakshyaNumber, kakshyaLord, kakshyaRange: KAKSHYA_RANGES[kakshyaNumber - 1].rangeText,
    bavTotal, bavAverage, sav, savAverage, contributes, assessment,
    houseTheme: HOUSE_THEMES[house]
  };
}

// Binary-search the exact instant a planet's degree-in-sign crosses
// `boundaryDeg` (0-30) between lowDate and highDate.
function findKakshyaBoundaryInstant(planetName, lowDate, highDate, boundaryDeg, signIndexAtLow) {
  function signedDiff(date) {
    const lon = kkNormDeg(computeSingleLongitude(planetName, date));
    const targetLon = signIndexAtLow * 30 + boundaryDeg;
    let d = lon - targetLon;
    d = ((d + 540) % 360) - 180;
    return d;
  }
  let lo = lowDate.getTime(), hi = highDate.getTime();
  const loSign = Math.sign(signedDiff(lowDate)) || -1;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const midSign = Math.sign(signedDiff(new Date(mid))) || loSign;
    if (midSign === loSign) lo = mid; else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

// Full transit timeline for `planetName` through the sign it currently
// occupies at `aroundDate` — every Kakshya entry/exit within that one sign
// visit, including retrograde re-entries into a Kakshya it already passed.
function computeSignKakshyaTimeline(planetName, aroundDate, chart, ashtakvarga) {
  const currentInfo = computeKakshyaInfo(planetName, aroundDate, chart, ashtakvarga);
  const targetSignIndex = currentInfo.signIndex;

  // Bracket the full sign-occupancy window by scanning outward in steps
  // scaled to the planet's approximate speed, capped to a sane range.
  const stepDays = Math.max(0.25, Math.min(15, 3.75 / (MEAN_DAILY_MOTION[planetName] * 6 || 1)));
  let start = new Date(aroundDate);
  while (kkSignIndex(computeSingleLongitude(planetName, addDaysKK(start, -stepDays))) === targetSignIndex) {
    start = addDaysKK(start, -stepDays);
    if (aroundDate - start > 900 * 86400000) break; // safety cap ~2.5 years
  }
  let end = new Date(aroundDate);
  while (kkSignIndex(computeSingleLongitude(planetName, addDaysKK(end, stepDays))) === targetSignIndex) {
    end = addDaysKK(end, stepDays);
    if (end - aroundDate > 900 * 86400000) break;
  }
  // Refine start/end to the actual sign-boundary crossings.
  start = refineToSignEntry(planetName, start, targetSignIndex, stepDays);
  end = refineToSignExit(planetName, end, targetSignIndex, stepDays);

  // Sample within [start, end] at fine resolution to catch every Kakshya
  // change (including retrograde double-backs).
  const fineStep = Math.max(1 / 24, stepDays / 8); // hours-to-days resolution
  const samples = [];
  for (let t = start.getTime(); t <= end.getTime(); t += fineStep * 86400000) {
    const d = new Date(t);
    const lon = kkNormDeg(computeSingleLongitude(planetName, d));
    const degInSign = lon - targetSignIndex * 30;
    samples.push({ date: d, degInSign, kakshya: kakshyaNumberOf(Math.max(0, Math.min(29.999, degInSign))) });
  }
  samples.push({ date: end, degInSign: kkNormDeg(computeSingleLongitude(planetName, end)) - targetSignIndex * 30, kakshya: kakshyaNumberOf(29.999) });

  const timeline = [];
  let segStart = samples[0].date, segKakshya = samples[0].kakshya;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].kakshya !== segKakshya) {
      // Exact boundary degree crossed (1-indexed kakshya N spans
      // [(N-1)*3.75, N*3.75)): forward crossing exits at N's upper edge;
      // backward (retrograde) crossing exits at N's lower edge.
      const crossedBoundary = samples[i].kakshya > segKakshya
        ? segKakshya * KAKSHYA_WIDTH_DEG
        : segKakshya === 1 ? 0 : (segKakshya - 1) * KAKSHYA_WIDTH_DEG;
      const instant = findKakshyaBoundaryInstant(planetName, samples[i - 1].date, samples[i].date, crossedBoundary, targetSignIndex);
      timeline.push({ kakshyaNumber: segKakshya, lord: KAKSHYA_LORDS[segKakshya - 1], start: segStart, end: instant });
      segStart = instant;
      segKakshya = samples[i].kakshya;
    }
  }
  timeline.push({ kakshyaNumber: segKakshya, lord: KAKSHYA_LORDS[segKakshya - 1], start: segStart, end: end });

  return { sign: SIGNS[targetSignIndex], signIndex: targetSignIndex, signEntry: start, signExit: end, segments: timeline };
}

function addDaysKK(date, days) { return new Date(date.getTime() + days * 86400000); }

function refineToSignEntry(planetName, approxStart, signIndex, stepDays) {
  let lo = addDaysKK(approxStart, -stepDays), hi = approxStart;
  for (let i = 0; i < 20; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    if (kkSignIndex(computeSingleLongitude(planetName, mid)) === signIndex) hi = mid; else lo = mid;
  }
  return hi;
}
function refineToSignExit(planetName, approxEnd, signIndex, stepDays) {
  let lo = approxEnd, hi = addDaysKK(approxEnd, stepDays);
  for (let i = 0; i < 20; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    if (kkSignIndex(computeSingleLongitude(planetName, mid)) === signIndex) lo = mid; else hi = mid;
  }
  return lo;
}

// --- Find Kakshya Windows: scan a date range for a planet, optionally
// filtered by natal house / life area, returning contiguous same-assessment
// windows (coarse daily-ish sampling — a search tool, not an exact timeline).
function findKakshyaWindows(planetName, startDate, endDate, chart, ashtakvarga, filterHouse) {
  const stepDays = Math.max(0.5, Math.min(10, 3.75 / (MEAN_DAILY_MOTION[planetName] * 4 || 1)));
  const samples = [];
  for (let t = startDate.getTime(); t <= endDate.getTime(); t += stepDays * 86400000) {
    samples.push(computeKakshyaInfo(planetName, new Date(t), chart, ashtakvarga));
  }
  const windows = [];
  let current = null;
  samples.forEach(s => {
    if (filterHouse && s.house !== filterHouse) {
      if (current) { windows.push(current); current = null; }
      return;
    }
    if (!current || current.assessment !== s.assessment || current.house !== s.house) {
      if (current) windows.push(current);
      current = { start: s.atDate, end: s.atDate, assessment: s.assessment, house: s.house, sign: s.sign, kakshyaLord: s.kakshyaLord, sample: s };
    } else {
      current.end = s.atDate;
    }
  });
  if (current) windows.push(current);
  return windows.filter(w => w.start.getTime() !== w.end.getTime());
}

if (typeof module !== 'undefined') {
  module.exports = {
    KAKSHYA_LOGIC_TEXT, KAKSHYA_LORDS, KAKSHYA_RANGES, KAKSHYA_WIDTH_DEG,
    kakshyaNumberOf, computeKakshyaInfo, computeSignKakshyaTimeline, findKakshyaWindows
  };
}
