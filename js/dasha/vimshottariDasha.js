// Vimshottari Dasha — the standard 120-year Parashari planetary-period
// system, computed from the Moon's nakshatra at birth. Reuses existing
// reference data (VIMSHOTTARI_SEQUENCE, VIMSHOTTARI_YEARS,
// VIMSHOTTARI_TOTAL_YEARS, nakshatraFromLongitude from parashariTables.js)
// rather than re-deriving it — this file only adds the date-arithmetic
// (Mahadasha balance + full Mahadasha/Antardasha sequence generation) on
// top of that existing table.

const VIMSHOTTARI_DASHA_LOGIC_TEXT = [
  ['Vimshottari Dasha — Logic and Sequence'],
  [''],
  ['1. The Moon\'s nakshatra at birth determines both the STARTING Mahadasha lord (that nakshatra\'s star lord, per the fixed 9-lord Vimshottari cycle already used elsewhere in this app) and how much of that first Mahadasha has already elapsed at birth: elapsed fraction = how far the Moon has traveled through that nakshatra\'s 13°20\' span.'],
  ['2. Balance of the first (birth) Mahadasha = (1 - elapsed fraction) x that lord\'s total Vimshottari years (Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 — totaling the classical 120-year cycle).'],
  ['3. Subsequent Mahadashas follow the FIXED Vimshottari sequence (Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury, back to Ketu, ...), each running its own full number of years, continuing until one complete 120-year cycle from birth is covered.'],
  ['4. Each Mahadasha is itself divided into 9 Antardashas (sub-periods), one per planet, in the SAME fixed sequence STARTING FROM THE MAHADASHA\'S OWN LORD (e.g. a Venus Mahadasha\'s Antardashas run Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury, Ketu). Each Antardasha\'s duration = (Mahadasha\'s total years) x (Antardasha lord\'s years / 120).'],
  ['5. Dates are computed by simple calendar-year arithmetic from the birth UTC instant (1 year = 365.25 days) — the standard approximation used by most Vimshottari software; it is not adjusted for leap-year specifics beyond that average.'],
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

// Antardashas for one Mahadasha: 9 sub-periods starting from the Mahadasha lord.
function buildAntardashas(mahaLord, mahaYears, mahaStart) {
  const order = sequenceFrom(mahaLord);
  let cursor = mahaStart;
  return order.map(lord => {
    const years = mahaYears * (VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL_YEARS);
    const start = cursor;
    const end = addYears(start, years);
    cursor = end;
    return { lord, years, startDate: start, endDate: end };
  });
}

// moonLongitude: sidereal Moon longitude at birth. birthDateUtc: JS Date (UTC).
// Returns an array of Mahadasha records covering one full 120-year cycle
// from birth, each with its own antardashas array.
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
      antardashas: buildAntardashas(lord, years, start)
    });
  });
  return mahadashas;
}

// Finds the Mahadasha and Antardasha (if any) that contain the given date
// (defaults to now) — used to highlight the "current" running period.
function findCurrentDasha(mahadashas, atDate) {
  const when = atDate || new Date();
  const maha = mahadashas.find(m => when >= m.startDate && when < m.endDate);
  if (!maha) return { maha: null, antar: null };
  const antar = maha.antardashas.find(a => when >= a.startDate && when < a.endDate);
  return { maha, antar };
}

if (typeof module !== 'undefined') {
  module.exports = { VIMSHOTTARI_DASHA_LOGIC_TEXT, computeVimshottariDasha, findCurrentDasha };
}
