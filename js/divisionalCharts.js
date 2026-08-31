// Divisional (Varga) charts: the classical Shodasavarga set (16 divisional
// charts) used in Parashari practice. Each varga divides every 30° sign
// into N equal parts (D30 alone uses 5 classically UNEQUAL parts), and maps
// each part to a resulting sign per a fixed classical starting-sign rule.
// This generalizes the same D9 (Navamsa) technique already used elsewhere
// in this app (equal-part division + proportional degree rescaling) to the
// full varga set, rather than re-deriving each one from scratch.

const DIVISIONAL_CHARTS_LOGIC_TEXT = [
  ['Divisional (Varga) Charts — Logic and Sequence'],
  [''],
  ['1. Each divisional chart (DN) divides every 30° natal sign into N equal parts (D30 is the one classical exception, using 5 unequal parts). Which part a planet\'s longitude falls into, and a fixed classical rule for which sign that part maps to, together determine the planet\'s DN sign.'],
  ['2. D1 = the natal Rasi chart itself (no division). D9 = Navamsa (see the Charts tab) — included here again for a consistent, single place to compare all vargas.'],
  ['3. Starting-sign rules used (standard Parashari): D2 Hora — alternates Cancer/Leo by half-sign and odd/even sign. D3 Drekkana — own/5th/9th sign (trine spacing). D4 Chaturthamsa — own/4th/7th/10th sign (quadrant spacing). D7 Saptamsa — starts from own sign (odd) or the 7th from it (even). D9 Navamsa — starts from own sign (movable), the 9th from it (fixed), or the 5th from it (dual). D10 Dasamsa — own sign (odd) or the 9th from it (even). D12 Dwadasamsa — always starts from own sign. D16 Shodasamsa — starts from Aries (movable sign), Leo (fixed sign), or Sagittarius (dual sign). D20 Vimsamsa — Aries (movable), Sagittarius (fixed), Leo (dual). D24 Chaturvimsamsa — Leo (odd sign) or Cancer (even sign). D27 Bhamsa — Aries (fire sign), Cancer (earth sign), Libra (air sign), Capricorn (water sign). D30 Trimsamsa — 5 unequal degree bands per odd/even sign, each ruled by a fixed planet/sign. D40 Khavedamsa — Aries (odd) or Libra (even). D45 Akshavedamsa — Aries (movable), Leo (fixed), Sagittarius (dual). D60 Shashtiamsa — always starts from own sign.'],
  ['4. Each planet\'s degree WITHIN its resulting DN sign is its position within its N-th part, rescaled proportionally to a full 0-30° span — the same rescaling technique the D9 chart already uses, applied uniformly to every varga.'],
  ['5. The divisional Ascendant (used for North Indian house placement) is simply the DN sign of the natal Ascendant\'s own longitude, exactly as the D9 chart already derives its own Navamsa Ascendant.'],
  [''],
  ['Caveat: a small number of published sources vary D16/D20/D45\'s exact starting-sign assignment by one step — this app uses the most commonly published Parashari convention for each. Divisional charts below D9 in fineness (D16 and finer) divide a sign into parts smaller than 2°, so at extreme precision boundaries a planet very close to a part boundary is sensitive to the exact ayanamsa/engine used.']
];

const DIVISIONAL_CHART_LIST = ['D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'];
const DIVISIONAL_CHART_NAMES = {
  D1: 'D1 — Rasi', D2: 'D2 — Hora', D3: 'D3 — Drekkana', D4: 'D4 — Chaturthamsa',
  D7: 'D7 — Saptamsa', D9: 'D9 — Navamsa', D10: 'D10 — Dasamsa', D12: 'D12 — Dwadasamsa',
  D16: 'D16 — Shodasamsa', D20: 'D20 — Vimsamsa', D24: 'D24 — Chaturvimsamsa',
  D27: 'D27 — Bhamsa', D30: 'D30 — Trimsamsa', D40: 'D40 — Khavedamsa',
  D45: 'D45 — Akshavedamsa', D60: 'D60 — Shashtiamsa'
};

function isOddSignIndex(signIndex) {
  return signIndex % 2 === 0; // Aries(0) is sign #1 = odd
}
function movableFixedDualCategory(signIndex) {
  const m = signIndex % 3;
  return m === 0 ? 'movable' : m === 1 ? 'fixed' : 'dual';
}
function elementOf(signIndex) {
  const m = signIndex % 4;
  return m === 0 ? 'fire' : m === 1 ? 'earth' : m === 2 ? 'air' : 'water';
}

const VARGA_DEFS = {
  D3: { n: 3, spacing: 4, startFn: s => s },
  D4: { n: 4, spacing: 3, startFn: s => s },
  D7: { n: 7, spacing: 1, startFn: s => (isOddSignIndex(s) ? s : (s + 6) % 12) },
  D9: {
    n: 9, spacing: 1, startFn: s => {
      const cat = movableFixedDualCategory(s);
      return cat === 'movable' ? s : cat === 'fixed' ? (s + 8) % 12 : (s + 4) % 12;
    }
  },
  D10: { n: 10, spacing: 1, startFn: s => (isOddSignIndex(s) ? s : (s + 8) % 12) },
  D12: { n: 12, spacing: 1, startFn: s => s },
  D16: {
    n: 16, spacing: 1, startFn: s => {
      const cat = movableFixedDualCategory(s);
      return cat === 'movable' ? 0 : cat === 'fixed' ? 4 : 8;
    }
  },
  D20: {
    n: 20, spacing: 1, startFn: s => {
      const cat = movableFixedDualCategory(s);
      return cat === 'movable' ? 0 : cat === 'fixed' ? 8 : 4;
    }
  },
  D24: { n: 24, spacing: 1, startFn: s => (isOddSignIndex(s) ? 4 : 3) },
  D27: {
    n: 27, spacing: 1, startFn: s => {
      const el = elementOf(s);
      return el === 'fire' ? 0 : el === 'earth' ? 3 : el === 'air' ? 6 : 9;
    }
  },
  D40: { n: 40, spacing: 1, startFn: s => (isOddSignIndex(s) ? 0 : 6) },
  D45: {
    n: 45, spacing: 1, startFn: s => {
      const cat = movableFixedDualCategory(s);
      return cat === 'movable' ? 0 : cat === 'fixed' ? 4 : 8;
    }
  },
  D60: { n: 60, spacing: 1, startFn: s => s }
};

// D30 Trimsamsa: 5 classically UNEQUAL degree bands per odd/even sign, each
// naming the resulting sign directly (not an offset formula).
const D30_ODD_BANDS = [
  { start: 0, end: 5, sign: 0 },   // Aries (Mars)
  { start: 5, end: 10, sign: 10 }, // Aquarius (Saturn)
  { start: 10, end: 18, sign: 8 }, // Sagittarius (Jupiter)
  { start: 18, end: 25, sign: 2 }, // Gemini (Mercury)
  { start: 25, end: 30, sign: 6 }  // Libra (Venus)
];
const D30_EVEN_BANDS = [
  { start: 0, end: 5, sign: 1 },   // Taurus (Venus)
  { start: 5, end: 12, sign: 5 },  // Virgo (Mercury)
  { start: 12, end: 20, sign: 11 }, // Pisces (Jupiter)
  { start: 20, end: 25, sign: 9 }, // Capricorn (Saturn)
  { start: 25, end: 30, sign: 7 }  // Scorpio (Mars)
];

function d30Position(signIndex, degInSign) {
  const bands = isOddSignIndex(signIndex) ? D30_ODD_BANDS : D30_EVEN_BANDS;
  const band = bands.find(b => degInSign >= b.start && degInSign < b.end) || bands[bands.length - 1];
  const scaledDegree = (degInSign - band.start) / (band.end - band.start) * 30;
  return { sign: SIGNS[band.sign], longitude: band.sign * 30 + scaledDegree };
}

function d2Position(signIndex, degInSign) {
  const half = degInSign < 15 ? 0 : 1;
  // Leo = index 4 (Sun's hora), Cancer = index 3 (Moon's hora).
  const resultSignIndex = isOddSignIndex(signIndex)
    ? (half === 0 ? 4 : 3)
    : (half === 0 ? 3 : 4);
  const remainder = degInSign - half * 15;
  const scaledDegree = remainder * 2;
  return { sign: SIGNS[resultSignIndex], longitude: resultSignIndex * 30 + scaledDegree };
}

// Full varga (divisional) position for one longitude: { sign, longitude:
// <synthetic DN longitude, for DMS display within that DN sign> }.
function vargaPosition(longitude, vargaKey) {
  const lon = normalizeDegrees(longitude);
  const signIndex = Math.floor(lon / 30);
  const degInSign = lon % 30;

  if (vargaKey === 'D1') return { sign: SIGNS[signIndex], longitude: lon };
  if (vargaKey === 'D2') return d2Position(signIndex, degInSign);
  if (vargaKey === 'D30') return d30Position(signIndex, degInSign);

  const def = VARGA_DEFS[vargaKey];
  if (!def) throw new Error('Unknown divisional chart: ' + vargaKey);
  const partSize = 30 / def.n;
  const partIndex = Math.floor(degInSign / partSize);
  const remainder = degInSign - partIndex * partSize;
  const scaledDegree = remainder * def.n;
  const start = def.startFn(signIndex);
  const resultSignIndex = (start + partIndex * def.spacing) % 12;
  return { sign: SIGNS[resultSignIndex], longitude: resultSignIndex * 30 + scaledDegree };
}

// { sign: [{name, longitude: <synthetic DN longitude>}], skipped: [...] } — South Indian data.
function buildDivisionalChartData(planets, vargaKey) {
  const bySign = {};
  SIGNS.forEach(s => { bySign[s] = []; });
  const skipped = [];
  planets.forEach(p => {
    const lon = p.longitude;
    if (typeof lon !== 'number' || isNaN(lon)) { skipped.push(p.name); return; }
    const pos = vargaPosition(lon, vargaKey);
    bySign[pos.sign].push({ name: p.name, longitude: pos.longitude });
  });
  return { bySign, skipped };
}

// North Indian data: derive the DN Ascendant, then place each planet's DN
// sign as a house counted forward from that DN Ascendant.
function buildDivisionalNorthIndian(planets, ascendantLongitude, vargaKey) {
  const ascPos = vargaPosition(ascendantLongitude, vargaKey);
  const vargaAscSignIndex = SIGNS.indexOf(ascPos.sign);

  const byHouse = {};
  for (let h = 1; h <= 12; h++) byHouse[h] = { signIndex: (vargaAscSignIndex + h - 1) % 12, planets: [] };
  const skipped = [];
  planets.forEach(p => {
    const lon = p.longitude;
    if (typeof lon !== 'number' || isNaN(lon)) { skipped.push(p.name); return; }
    const pos = vargaPosition(lon, vargaKey);
    const signIndex = SIGNS.indexOf(pos.sign);
    const house = wholeSignHouseOf(signIndex, vargaAscSignIndex);
    byHouse[house].planets.push({ name: p.name, longitude: pos.longitude });
  });
  return { byHouse, skipped, vargaAscSignIndex };
}

if (typeof module !== 'undefined') {
  module.exports = {
    DIVISIONAL_CHARTS_LOGIC_TEXT, DIVISIONAL_CHART_LIST, DIVISIONAL_CHART_NAMES,
    vargaPosition, buildDivisionalChartData, buildDivisionalNorthIndian
  };
}
