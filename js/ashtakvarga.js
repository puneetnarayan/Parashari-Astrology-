// Ashtakvarga: classical Parashari benefic-point (bindu) system.
// For each of the 7 classical planets, each of 8 "contributors" (the 7
// planets + the Lagna/Ascendant) casts a bindu (point) onto specific houses
// counted from the CONTRIBUTOR's own sign — the house-set per contributor is
// a fixed classical table (below), not a calculation. Summing all 8
// contributors' bindus per sign gives that planet's Bhinnashtakavarga (BAV).
// Summing the 7 planets' BAV per sign gives the Sarvashtakavarga (SAV).
//
// Rahu/Ketu are not part of the classical 8-contributor Ashtakvarga scheme
// and are excluded entirely, per standard Parashari practice.

const ASHTAKVARGA_LOGIC_TEXT = [
  ['Ashtakvarga — Logic and Sequence'],
  [''],
  ['1. Each of the 7 classical planets (Sun..Saturn) has its own Bhinnashtakavarga (BAV) — a bindu (point) count, 0 or 1, contributed to each of the 12 signs by each of 8 "contributors": the 7 planets plus the Lagna (Ascendant).'],
  ['2. Each contributor casts a bindu onto a FIXED set of houses counted (whole-sign, 1 = the contributor\'s own sign) from the contributor\'s own natal sign — this house-set is a fixed classical table (from Parashari Hora Shastra), not something computed from the chart; only which sign each contributor sits in (and therefore which signs those houses land on) is chart-specific.'],
  ['3. A planet\'s total BAV score for a sign = the number of the 8 contributors (out of a possible 8) that cast a bindu on that sign. Maximum classical totals per planet: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39.'],
  ['4. Sarvashtakavarga (SAV) for a sign = the sum of all 7 planets\' BAV scores for that sign (Lagna\'s own contribution is only used inside each planet\'s BAV above, not summed again separately) — maximum classical total 337 across the zodiac.'],
  ['5. Rahu and Ketu are shadow points, not physical planets, and are excluded from the classical 8-contributor Ashtakvarga scheme entirely (neither as a contributor nor as a scored planet).'],
  ['6. Scores are shown by HOUSE (counted from the Ascendant, whole-sign) in this app\'s table and chart, for direct reading against the D1 chart — high SAV houses are considered classically strong, low ones weak, for transit and general strength assessment.'],
  [''],
  ['Caveat: the 8x8 house-set tables below are the standard tables as commonly published (e.g. following Parashari Hora Shastra-derived references) — a small number of published sources disagree on isolated entries; cross-check against a second reference if a bindu count looks off for your chart.']
];

const AV_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const AV_CONTRIBUTORS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];

// ASHTAKVARGA_TABLES[targetPlanet][contributor] = array of houses (1-12,
// counted from the contributor's own sign) that receive a bindu.
const ASHTAKVARGA_TABLES = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [3, 4, 6, 10, 11, 12]
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Lagna: [3, 6, 10, 11]
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 3, 6, 10, 11]
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 2, 4, 6, 8, 10, 11]
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11]
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Lagna: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Lagna: [1, 3, 4, 6, 10, 11]
  }
};

function signIndexOf(longitude) {
  return Math.floor(normalizeDegrees(longitude) / 30) % 12;
}

// Whole-sign count (1-12) from contributor's sign to target sign.
function houseCountFrom(fromSignIndex, toSignIndex) {
  return ((toSignIndex - fromSignIndex + 12) % 12) + 1;
}

// planetSignIndex: { Sun: signIndex, ..., Saturn: signIndex, Lagna: signIndex }.
// Returns a 12-entry array (index 0 = Aries .. 11 = Pisces) of bindu counts
// (0-8) for the given target planet's Bhinnashtakavarga.
function computeBhinnashtakavarga(targetPlanet, planetSignIndex) {
  const table = ASHTAKVARGA_TABLES[targetPlanet];
  const scoresBySign = new Array(12).fill(0);
  AV_CONTRIBUTORS.forEach(contributor => {
    const fromSignIndex = planetSignIndex[contributor];
    if (fromSignIndex === undefined || fromSignIndex === null) return;
    const houses = table[contributor];
    for (let toSignIndex = 0; toSignIndex < 12; toSignIndex++) {
      const count = houseCountFrom(fromSignIndex, toSignIndex);
      if (houses.includes(count)) scoresBySign[toSignIndex] += 1;
    }
  });
  return scoresBySign;
}

// Returns { bav: { planetName: [12 bindu counts by sign] }, sav: [12 totals by sign] }.
// planets: [{ name, longitude }] (7 classical planets; Rahu/Ketu ignored).
// ascendantLongitude: sidereal Ascendant longitude, used as the Lagna contributor.
function computeAshtakvarga(planets, ascendantLongitude) {
  const planetSignIndex = { Lagna: signIndexOf(ascendantLongitude) };
  planets.forEach(p => {
    if (AV_CONTRIBUTORS.includes(p.name) && typeof p.longitude === 'number') {
      planetSignIndex[p.name] = signIndexOf(p.longitude);
    }
  });

  const bav = {};
  AV_PLANETS.forEach(name => { bav[name] = computeBhinnashtakavarga(name, planetSignIndex); });

  const sav = new Array(12).fill(0);
  AV_PLANETS.forEach(name => { bav[name].forEach((score, i) => { sav[i] += score; }); });

  return { bav, sav, ascendantSignIndex: planetSignIndex.Lagna };
}

if (typeof module !== 'undefined') {
  module.exports = {
    ASHTAKVARGA_LOGIC_TEXT, AV_PLANETS, AV_CONTRIBUTORS, ASHTAKVARGA_TABLES,
    computeBhinnashtakavarga, computeAshtakvarga
  };
}
