// D1 (Rasi) and D9 (Navamsa) chart data builders + South/North Indian
// rendering. D1 here is WHOLE-SIGN houses from the Ascendant's sign — house 1
// = Ascendant's sign, house 2 = next sign, etc. — the classical Parashari
// house convention, NOT Placidus cuspal houses (deliberately different from
// the sibling KP app, which is Placidus-based). The D9 navamsa formula and
// the South/North Indian rendering technique (including the D9
// degree-rescaling trick) are ported from that app's vedicCharts.js since
// that pure math/display logic is identical across techniques.

const PARASHARI_CHARTS_LOGIC_TEXT = [
  ['D1 / D9 Charts — Logic and Sequence'],
  [''],
  ['1. Two selectable layouts: SOUTH INDIAN — a fixed 4x4 grid where each of the 12 signs always sits in the same cell; sign positions never rotate, only which house number lands in each sign changes. NORTH INDIAN — a diamond-in-square divided into 12 house-shaped regions in fixed screen positions (house 1 always the top diamond, proceeding clockwise); house positions never rotate, and the sign written inside each house rotates with the Ascendant.'],
  ['2. D1 (Rasi) Chart — WHOLE-SIGN houses: house 1 is the Ascendant\'s own sign, house 2 is the next sign forward, and so on through house 12 — the classical Parashari house convention (distinct from Placidus cuspal houses). South Indian places each planet in its natal sign\'s fixed cell; North Indian places each planet in its natal house\'s fixed position, with the sign label per house derived the same whole-sign way.'],
  ['3. D9 (Navamsa) Chart: each 30° sign divides into 9 equal parts of 3°20\' (a "navamsa"). Which sign a planet\'s navamsa falls in depends on the classical rule: for a movable sign (Aries/Cancer/Libra/Capricorn), navamsa counting starts from that same sign; for a fixed sign (Taurus/Leo/Scorpio/Aquarius), counting starts from the 9th sign from it; for a dual sign (Gemini/Virgo/Sagittarius/Pisces), counting starts from the 5th sign from it. South Indian places each planet directly in its resulting navamsa sign\'s fixed cell. North Indian first derives a "Navamsa Ascendant" (the natal Ascendant\'s own navamsa sign), then places each planet\'s house by counting whole signs forward from that Navamsa Ascendant.'],
  ['4. D9 degree shown: the planet\'s position WITHIN its 3°20\' navamsa part is rescaled proportionally to a full 0-30° span, becoming its degree within the resulting D9 sign — the standard way a divisional chart\'s own internal degree is derived, not the natal D1 degree.'],
  ['5. Every planet in every chart cell shows its exact degree-minute-second position (D1: the natal degree within its sign; D9: the rescaled D9-internal degree above), not just a sign/planet abbreviation.'],
  [''],
  ['Caveat: this app displays only D1 and D9 in v1 — further divisional charts (D10, D7, D12, etc.) and additional analysis tabs (yogas, bhava bala, dasha, transits) are left for follow-up requests.']
];

const SOUTH_INDIAN_GRID = [
  'Pisces', 'Aries', 'Taurus', 'Gemini',
  'Aquarius', null, null, 'Cancer',
  'Capricorn', null, null, 'Leo',
  'Sagittarius', 'Scorpio', 'Libra', 'Virgo'
];

const NORTH_INDIAN_HOUSES = [
  { house: 1, points: '150,0 225,75 150,150 75,75', label: [150, 45] },
  { house: 2, points: '150,0 300,0 225,75', label: [200, 25] },
  { house: 3, points: '300,0 300,150 225,75', label: [270, 60] },
  { house: 4, points: '300,150 225,225 150,150 225,75', label: [250, 150] },
  { house: 5, points: '300,150 300,300 225,225', label: [270, 240] },
  { house: 6, points: '300,300 150,300 225,225', label: [200, 275] },
  { house: 7, points: '150,300 75,225 150,150 225,225', label: [150, 255] },
  { house: 8, points: '150,300 0,300 75,225', label: [100, 275] },
  { house: 9, points: '0,300 0,150 75,225', label: [30, 240] },
  { house: 10, points: '0,150 75,75 150,150 75,225', label: [50, 150] },
  { house: 11, points: '0,150 0,0 75,75', label: [30, 60] },
  { house: 12, points: '0,0 150,0 75,75', label: [100, 25] }
];

// Classical Navamsa (D9) position: which sign it falls in, plus a synthetic
// 0-360° "D9 longitude" for DMS display within that D9 sign.
function navamsaPosition(longitude) {
  const lon = normalizeDegrees(longitude);
  const signIndex = Math.floor(lon / 30);
  const sign = SIGNS[signIndex];
  const degInSign = lon % 30;
  const partSize = 30 / 9;
  const navamsaPart = Math.floor(degInSign / partSize);
  const remainderInPart = degInSign - navamsaPart * partSize;
  const scaledDegree = remainderInPart * 9;

  let startIndex;
  if (MOVABLE_SIGNS.includes(sign)) startIndex = signIndex;
  else if (FIXED_SIGNS.includes(sign)) startIndex = (signIndex + 8) % 12;
  else startIndex = (signIndex + 4) % 12; // dual sign

  const resultSignIndex = (startIndex + navamsaPart) % 12;
  return { sign: SIGNS[resultSignIndex], longitude: resultSignIndex * 30 + scaledDegree };
}

function navamsaSign(longitude) {
  return navamsaPosition(longitude).sign;
}

// Whole-sign house-1-from-ascendant offset: house N's sign = ascendantSignIndex + (N-1), wrapped.
function wholeSignHouseOf(signIndex, ascendantSignIndex) {
  return ((signIndex - ascendantSignIndex + 12) % 12) + 1;
}

// { sign: [{name, longitude}] } for D1, South Indian (position by sign only).
function buildD1ChartData(planets) {
  const bySign = {};
  SIGNS.forEach(s => { bySign[s] = []; });
  planets.forEach(p => {
    if (p.sign && bySign[p.sign]) bySign[p.sign].push({ name: p.name, longitude: p.longitude });
  });
  return bySign;
}

// { sign: [{name, longitude: <synthetic D9 longitude>}] } for D9, South Indian.
function buildD9ChartData(planets) {
  const bySign = {};
  SIGNS.forEach(s => { bySign[s] = []; });
  const skipped = [];
  planets.forEach(p => {
    const lon = p.longitude;
    if (typeof lon !== 'number' || isNaN(lon)) { skipped.push(p.name); return; }
    const nav = navamsaPosition(lon);
    bySign[nav.sign].push({ name: p.name, longitude: nav.longitude });
  });
  return { bySign, skipped };
}

// D1, North Indian: whole-sign houses from the Ascendant's sign.
// ascendantLongitude: the Ascendant's sidereal longitude (0-360).
function buildD1NorthIndian(planets, ascendantLongitude) {
  const ascSignIndex = Math.floor(normalizeDegrees(ascendantLongitude) / 30);
  const byHouse = {};
  for (let h = 1; h <= 12; h++) byHouse[h] = { signIndex: (ascSignIndex + h - 1) % 12, planets: [] };
  planets.forEach(p => {
    if (typeof p.longitude !== 'number') return;
    const signIndex = Math.floor(normalizeDegrees(p.longitude) / 30);
    const house = wholeSignHouseOf(signIndex, ascSignIndex);
    byHouse[house].planets.push({ name: p.name, longitude: p.longitude });
  });
  return byHouse;
}

// D9, North Indian: derive the Navamsa Ascendant (D9 sign of the natal
// Ascendant's own longitude), then place each planet's navamsa sign as a
// house counted forward from that Navamsa Ascendant.
function buildD9NorthIndian(planets, ascendantLongitude) {
  const navAscSignIndex = SIGNS.indexOf(navamsaSign(ascendantLongitude));
  const byHouse = {};
  for (let h = 1; h <= 12; h++) byHouse[h] = { signIndex: (navAscSignIndex + h - 1) % 12, planets: [] };
  const skipped = [];
  planets.forEach(p => {
    const lon = p.longitude;
    if (typeof lon !== 'number' || isNaN(lon)) { skipped.push(p.name); return; }
    const nav = navamsaPosition(lon);
    const signIndex = SIGNS.indexOf(nav.sign);
    const house = wholeSignHouseOf(signIndex, navAscSignIndex);
    byHouse[house].planets.push({ name: p.name, longitude: nav.longitude });
  });
  return { byHouse, skipped, navAscSignIndex };
}

if (typeof module !== 'undefined') {
  module.exports = {
    PARASHARI_CHARTS_LOGIC_TEXT, SOUTH_INDIAN_GRID, NORTH_INDIAN_HOUSES,
    navamsaSign, navamsaPosition, wholeSignHouseOf,
    buildD1ChartData, buildD9ChartData, buildD1NorthIndian, buildD9NorthIndian
  };
}
