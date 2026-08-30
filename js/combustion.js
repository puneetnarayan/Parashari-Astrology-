// Classical combustion (Asta) rules: a planet within its traditional orb of
// the Sun's longitude is "combust" (asta) — weakened. Orb-per-planet table
// per Parashari classics (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
// each have their own orb; Mercury and Venus use a tighter orb when
// retrograde). Rahu/Ketu are traditionally not treated as combustible bodies
// since they cast no light of their own to be overpowered.

const COMBUSTION_LOGIC_TEXT = [
  ['Combustion (Asta) — Logic and Sequence'],
  [''],
  ['1. A planet within its traditional orb of the Sun\'s exact sidereal longitude is "combust" (asta) — its own significations are weakened in classical Parashari analysis.'],
  ['2. Orbs used (degrees of angular separation from the Sun): Moon 12°, Mars 17°, Mercury 14° (12° if retrograde), Jupiter 11°, Venus 10° (8° if retrograde), Saturn 15°. These are the standard orbs given in classical Parashari texts (e.g. Phaladeepika, Saravali).'],
  ['3. The Sun itself is never combust (it is the reference body). Rahu and Ketu, being shadow points rather than luminous bodies, are traditionally excluded from combustion analysis.'],
  ['4. Angular separation is measured as the shortest arc between the two longitudes (0-180°), not simple subtraction, so wraparound near 0°/360° is handled correctly.'],
  [''],
  ['Caveat: some classical authorities give a smaller "deep combustion" sub-orb, and a few traditions vary the Venus/Mercury retrograde orb slightly — this app uses the orb table above uniformly.']
];

const COMBUSTION_ORBS = { Moon: 12, Mercury: 14, Venus: 10, Mars: 17, Jupiter: 11, Saturn: 15 };
const COMBUSTION_ORBS_RETROGRADE = { Mercury: 12, Venus: 8 };

function angularSeparation(a, b) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(diff, 360 - diff);
}

// planets: [{ name, longitude, retrograde }]. Returns a Map-like plain
// object { planetName: { combust, separationFromSun, orb } } for every
// eligible planet (excludes Sun, Rahu, Ketu).
function computeCombustion(planets) {
  const sun = planets.find(p => p.name === 'Sun');
  const result = {};
  if (!sun || typeof sun.longitude !== 'number') return result;
  planets.forEach(p => {
    if (p.name === 'Sun' || p.name === 'Rahu' || p.name === 'Ketu') return;
    if (COMBUSTION_ORBS[p.name] === undefined || typeof p.longitude !== 'number') return;
    const orb = (p.retrograde && COMBUSTION_ORBS_RETROGRADE[p.name]) || COMBUSTION_ORBS[p.name];
    const separation = angularSeparation(p.longitude, sun.longitude);
    result[p.name] = { combust: separation <= orb, separationFromSun: Math.round(separation * 100) / 100, orb };
  });
  return result;
}

if (typeof module !== 'undefined') {
  module.exports = { COMBUSTION_LOGIC_TEXT, COMBUSTION_ORBS, COMBUSTION_ORBS_RETROGRADE, computeCombustion, angularSeparation };
}
