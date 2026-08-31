// Conjunctions: simple same-SIGN grouping (Parashari convention — two
// planets are "conjunct" if they occupy the same rasi, regardless of exact
// degree separation within it). This is intentionally simpler than the
// sibling KP app's degree-orb conjunction check, matching how conjunction is
// normally read in a whole-sign Parashari chart.

const CONJUNCTIONS_LOGIC_TEXT = [
  ['Conjunctions — Logic and Sequence'],
  [''],
  ['1. Two or more planets are conjunct if they occupy the same zodiac SIGN (rasi) — the standard Parashari whole-sign convention, distinct from a Western-style tight degree orb.'],
  ['2. "Conjunct With" for a given planet lists every other planet sharing its sign.'],
  [''],
  ['Caveat: this is sign-level (whole-sign) conjunction; two planets at opposite ends of a large sign (e.g. 1° and 29°) are still counted as conjunct here, per classical Parashari practice, even though their exact degree separation is wide.']
];

function signIndexOf(longitude) {
  return Math.floor(normalizeDegrees(longitude) / 30) % 12;
}

// planets: [{ name, longitude, sign }]. Returns { planetName: [otherPlanetNames in same sign] }.
function computeConjunctions(planets) {
  const conjunctWith = {};
  planets.forEach(p => { conjunctWith[p.name] = []; });
  planets.forEach(a => {
    planets.forEach(b => {
      if (a.name === b.name) return;
      const sameSign = a.sign && b.sign
        ? a.sign === b.sign
        : (typeof a.longitude === 'number' && typeof b.longitude === 'number' && signIndexOf(a.longitude) === signIndexOf(b.longitude));
      if (sameSign) conjunctWith[a.name].push(b.name);
    });
  });
  return conjunctWith;
}

if (typeof module !== 'undefined') {
  module.exports = { CONJUNCTIONS_LOGIC_TEXT, computeConjunctions };
}
