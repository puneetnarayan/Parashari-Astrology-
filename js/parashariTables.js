// Fixed reference tables (not user data): signs, nakshatras, pada, DMS
// formatting. Ported from the sibling KP app's kpTables.js — this math
// (longitude -> sign/nakshatra/pada, DMS formatting) is pure astronomy/
// numerology, identical across KP and Parashari technique, so it is reused
// verbatim rather than re-derived. No KP-specific concept (sub-lords,
// cuspal theory) is included here.

const PARASHARI_TABLES_LOGIC_TEXT = [
  ['Reference Tables — Logic and Sequence'],
  [''],
  ['1. 12 zodiac signs (Aries..Pisces), each spanning exactly 30° of sidereal longitude, with their classical ruling planet (sign lord).'],
  ['2. 27 nakshatras, each spanning exactly 13°20\' (360/27), in fixed zodiacal order starting at 0° Aries (Ashwini).'],
  ['3. Pada (quarter): each nakshatra divides into 4 equal parts of 3°20\' each — used for pada-based techniques and as the D9 navamsa building block.'],
  ['4. Degree-Minute-Second (DMS) formatting: a sidereal longitude 0-360° is split into its sign (30° each) plus the degree/minute/second position WITHIN that sign (0-29°59\'59"), the standard way a classical Parashari chart displays a planet\'s position.'],
  [''],
  ['Caveat: this file intentionally contains no KP-specific concepts (sub-lord division, cuspal sub-lord theory) — only the sign/nakshatra/pada/DMS math that is identical across every sidereal Vedic technique.']
];

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];
const SIGN_LORD = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter'
};
const MOVABLE_SIGNS = ['Aries', 'Cancer', 'Libra', 'Capricorn'];
const FIXED_SIGNS = ['Taurus', 'Leo', 'Scorpio', 'Aquarius'];
// Dual signs (Gemini/Virgo/Sagittarius/Pisces) are the implicit remaining case.

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];
const VIMSHOTTARI_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
// Classical Vimshottari Dasha years per planet (totals to the 120-year cycle), used by js/dasha/vimshottariDasha.js.
const VIMSHOTTARI_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const VIMSHOTTARI_TOTAL_YEARS = 120;

function buildNakshatraTable() {
  const table = [];
  const span = 360 / 27;
  for (let i = 0; i < 27; i++) {
    table.push({ name: NAKSHATRAS[i], startDeg: i * span, endDeg: (i + 1) * span, starLord: VIMSHOTTARI_SEQUENCE[i % 9] });
  }
  return table;
}
const NAKSHATRA_TABLE = buildNakshatraTable();

const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// Standard 2-letter abbreviations, used in chart cells (the Planet Table
// keeps full names; only drawn charts use these, to save cell space).
const PLANET_ABBR = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke'
};

function normalizeDegrees(deg) {
  return ((deg % 360) + 360) % 360;
}

function nakshatraFromLongitude(longitude) {
  const lon = normalizeDegrees(longitude);
  const entry = NAKSHATRA_TABLE.find(n => lon >= n.startDeg && lon < n.endDeg);
  if (!entry) return null;
  const elapsedFraction = (lon - entry.startDeg) / (entry.endDeg - entry.startDeg);
  return { ...entry, elapsedFraction };
}

// Nakshatra quarter (1-4): each 13°20' nakshatra splits into 4 equal 3°20' padas.
function padaOf(longitude, nak) {
  const padaSpan = (nak.endDeg - nak.startDeg) / 4;
  return Math.min(4, Math.floor((longitude - nak.startDeg) / padaSpan) + 1);
}

// { sign, degree, minute, second } — degree is the whole-degree position
// WITHIN the sign (0-29), the standard Parashari notation.
function longitudeToDegMinSec(longitude) {
  const lon = normalizeDegrees(Number(longitude));
  let signIndex = Math.floor(lon / 30);
  let degInSign = lon - signIndex * 30;

  let degree = Math.floor(degInSign);
  let minuteFloat = (degInSign - degree) * 60;
  let minute = Math.floor(minuteFloat);
  let second = Math.round((minuteFloat - minute) * 60);

  if (second === 60) { second = 0; minute += 1; }
  if (minute === 60) { minute = 0; degree += 1; }
  if (degree === 30) { degree = 0; signIndex = (signIndex + 1) % 12; }

  return { sign: SIGNS[signIndex], degree, minute, second };
}

// "12°34'56" Ari" — compact DMS + sign abbreviation, for chart cells.
function formatDegMinSecShort(longitude) {
  if (longitude === undefined || longitude === null || longitude === '' || isNaN(Number(longitude))) return '';
  const { sign, degree, minute, second } = longitudeToDegMinSec(longitude);
  const pad = n => String(n).padStart(2, '0');
  return `${degree}°${pad(minute)}'${pad(second)}" ${sign.slice(0, 3)}`;
}

// "12°34'56"" — DMS only, no sign (sign already known from context, e.g. table column).
function formatDegMinSec(longitude) {
  if (longitude === undefined || longitude === null || longitude === '' || isNaN(Number(longitude))) return '';
  const { degree, minute, second } = longitudeToDegMinSec(longitude);
  const pad = n => String(n).padStart(2, '0');
  return `${degree}°${pad(minute)}'${pad(second)}"`;
}

// "12°34'" — degree-minute only, no seconds (used in chart cells when the
// "show seconds" option is off, to keep cells compact).
function formatDegMin(longitude) {
  if (longitude === undefined || longitude === null || longitude === '' || isNaN(Number(longitude))) return '';
  const { degree, minute } = longitudeToDegMinSec(longitude);
  const pad = n => String(n).padStart(2, '0');
  return `${degree}°${pad(minute)}'`;
}

if (typeof module !== 'undefined') {
  module.exports = {
    PARASHARI_TABLES_LOGIC_TEXT, SIGNS, SIGN_LORD, MOVABLE_SIGNS, FIXED_SIGNS,
    NAKSHATRAS, NAKSHATRA_TABLE, PLANET_NAMES, PLANET_ABBR,
    VIMSHOTTARI_SEQUENCE, VIMSHOTTARI_YEARS, VIMSHOTTARI_TOTAL_YEARS,
    normalizeDegrees, nakshatraFromLongitude, padaOf,
    longitudeToDegMinSec, formatDegMinSec, formatDegMinSecShort, formatDegMin
  };
}
