// Vimshottari Dasha — the standard 120-year Parashari planetary-period
// system, computed from the Moon's nakshatra at birth, to 4 nested levels:
// Mahadasha (MD) -> Antardasha (AD) -> Pratyantardasha (PD) -> Sookshma
// Dasha (SD). Reuses existing reference data (VIMSHOTTARI_SEQUENCE,
// VIMSHOTTARI_YEARS, VIMSHOTTARI_TOTAL_YEARS, nakshatraFromLongitude from
// parashariTables.js) rather than re-deriving it — this file only adds the
// date-arithmetic (balance of the first period + proportional subdivision)
// on top of that existing table.

const VIMSHOTTARI_DASHA_LOGIC_TEXT = [
  ['Vimshottari Dasha — Logic and Sequence'],
  [''],
  ['1. The Moon\'s nakshatra at birth determines both the STARTING Mahadasha (MD) lord (that nakshatra\'s star lord, per the fixed 9-lord Vimshottari cycle already used elsewhere in this app) and how much of that first Mahadasha has already elapsed at birth: elapsed fraction = how far the Moon has traveled through that nakshatra\'s 13°20\' span.'],
  ['2. Balance of the first (birth) Mahadasha = (1 - elapsed fraction) x that lord\'s total Vimshottari years (Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 — totaling the classical 120-year cycle). Subsequent Mahadashas follow the fixed Vimshottari sequence at their own full length, continuing until one complete 120-year cycle from birth is covered.'],
  ['3. Each level is divided into 9 sub-periods (one per planet) in the SAME fixed sequence, STARTING FROM THAT PERIOD\'S OWN LORD (e.g. a Venus Mahadasha\'s Antardashas run Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury, Ketu) — this rule is applied identically at every level: Antardasha within Mahadasha, Pratyantardasha within Antardasha, and Sookshma Dasha within Pratyantardasha. Each sub-period\'s duration = (parent period\'s years) x (sub-period lord\'s years / 120).'],
  ['4. Only Mahadasha and Antardasha (the first two levels) are computed eagerly for the whole 120-year cycle; Pratyantardasha and Sookshma Dasha (levels 3-4) are computed ON DEMAND for whichever Antardasha/Pratyantardasha the user selects in the Dasha tab, since a full eager 4-level expansion would be 9x9x9x9 = 6,561 rows.'],
  ['5. Dates are computed by simple calendar-year arithmetic from the birth UTC instant (1 year = 365.25 days) — the standard approximation used by most Vimshottari software; it is not adjusted for leap-year specifics beyond that average. "Age at start" for a period is a calendar-accurate (not 365.25-approximated) years/months/days difference from the birth instant.'],
  ['']
];

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

function addYears(date, years) {
  return new Date(date.getTime() + years * YEAR_MS);
}

function sequenceFrom(startLord) {
  const startIndex = VIMSHOTTARI_SEQUENCE.indexOf(startLord);
  return VIMSHOTTARI_SEQUENCE.map((_, i) => VIMSHOTTARI_SEQUENCE[(startIndex + i) % 9]);
}

// Generic one-level subdivision: 9 sub-periods of `totalYears` starting from
// `startLord`, beginning at `startDate`. Used for Antardasha (from a
// Mahadasha), Pratyantardasha (from an Antardasha), and Sookshma Dasha
// (from a Pratyantardasha) alike — the classical rule is identical at
// every level.
function buildSubPeriods(startLord, totalYears, startDate) {
  const order = sequenceFrom(startLord);
  let cursor = startDate;
  return order.map(lord => {
    const years = totalYears * (VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL_YEARS);
    const start = cursor;
    const end = addYears(start, years);
    cursor = end;
    return { lord, years, startDate: start, endDate: end };
  });
}

// moonLongitude: sidereal Moon longitude at birth. birthDateUtc: JS Date (UTC).
// Returns an array of 9 Mahadasha (MD) records covering one full 120-year
// cycle from birth, each with its own eagerly-computed antardashas (AD)
// array. Pratyantardasha/Sookshma (levels 3-4) are NOT computed here —
// call buildSubPeriods() again on demand for a selected AD/PD.
function computeVimshottariDasha(moonLongitude, birthDateUtc) {
  const nak = nakshatraFromLongitude(moonLongitude);
  if (!nak) return [];

  const firstLord = nak.starLord;
  const firstBalanceYears = (1 - nak.elapsedFraction) * VIMSHOTTARI_YEARS[firstLord];
  const order = sequenceFrom(firstLord);

  const mahadashas = [];
  let cursor = birthDateUtc;
  order.forEach((lord, i) => {
    const years = i === 0 ? firstBalanceYears : VIMSHOTTARI_YEARS[lord];
    const start = cursor;
    const end = addYears(start, years);
    cursor = end;
    mahadashas.push({
      lord, years, startDate: start, endDate: end,
      antardashas: buildSubPeriods(lord, years, start)
    });
  });
  return mahadashas;
}

// Index of the period in `periods` that contains `atDate` (defaults to
// now), or -1 if none does (e.g. before birth or after the 120-year span).
function findCurrentIndex(periods, atDate) {
  const when = atDate || new Date();
  return periods.findIndex(p => when >= p.startDate && when < p.endDate);
}

// Calendar-accurate (not 365.25-approximated) age at `atDate`, relative to
// `birthDateUtc`, as { years, months, days }.
function ageAt(birthDateUtc, atDate) {
  let years = atDate.getUTCFullYear() - birthDateUtc.getUTCFullYear();
  let months = atDate.getUTCMonth() - birthDateUtc.getUTCMonth();
  let days = atDate.getUTCDate() - birthDateUtc.getUTCDate();
  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(Date.UTC(atDate.getUTCFullYear(), atDate.getUTCMonth(), 0)).getUTCDate();
    days += daysInPrevMonth;
  }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, days };
}

if (typeof module !== 'undefined') {
  module.exports = { VIMSHOTTARI_DASHA_LOGIC_TEXT, computeVimshottariDasha, buildSubPeriods, findCurrentIndex, ageAt };
}
