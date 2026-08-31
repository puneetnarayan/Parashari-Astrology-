// Parashari graha drishti (planetary aspect) rules — whole-sign, the
// classical convention distinct from Western degree-based aspects and from
// KP's cuspal significator logic (not used here at all).

const ASPECTS_LOGIC_TEXT = [
  ['Aspects (Graha Drishti) — Logic and Sequence'],
  [''],
  ['1. Every planet casts a full aspect (drishti) on the sign 7th from its own sign (counted inclusively, i.e. directly opposite) — this is the universal Parashari base aspect all 7 classical planets (and the nodes, by common extension) share.'],
  ['2. Special extra full aspects, per classical Parashari rule: Mars additionally aspects the 4th and 8th signs from itself; Jupiter additionally aspects the 5th and 9th; Saturn additionally aspects the 3rd and 10th. These three "special drishti" planets are the ones classical texts single out as casting more than the universal 7th-house aspect.'],
  ['3. Aspect is evaluated sign-to-sign (whole-sign/rasi drishti), the standard and most common Parashari convention — not a degree-tapering aspect with orbs.'],
  ['4. "Aspected by" for a given planet lists every OTHER planet whose drishti (by the rules above) lands on that planet\'s own sign.'],
  [''],
  ['Caveat: this is whole-sign (rasi) drishti, not a graded/varying-strength aspect model some later commentators use — the aspect is treated as either fully present or absent, with no partial strength.']
];

// Offsets counted from the aspecting planet's own sign (1 = own sign, 7 = opposite, etc.)
const ASPECT_OFFSETS = {
  default: [7],
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10]
};

function signIndexOf(longitude) {
  return Math.floor(normalizeDegrees(longitude) / 30) % 12;
}

// planets: [{ name, longitude }]. Returns { planetName: [otherPlanetNames aspecting it] }.
function computeAspectedBy(planets) {
  const withLon = planets.filter(p => typeof p.longitude === 'number');
  const aspectedBy = {};
  planets.forEach(p => { aspectedBy[p.name] = []; });

  withLon.forEach(caster => {
    const fromSignIndex = signIndexOf(caster.longitude);
    const offsets = ASPECT_OFFSETS[caster.name] || ASPECT_OFFSETS.default;
    const aspectedSignIndices = new Set(offsets.map(o => (fromSignIndex + (o - 1)) % 12));
    withLon.forEach(target => {
      if (target.name === caster.name) return;
      const targetSignIndex = signIndexOf(target.longitude);
      if (aspectedSignIndices.has(targetSignIndex)) {
        aspectedBy[target.name].push(caster.name);
      }
    });
  });
  return aspectedBy;
}

if (typeof module !== 'undefined') {
  module.exports = { ASPECTS_LOGIC_TEXT, ASPECT_OFFSETS, computeAspectedBy };
}
