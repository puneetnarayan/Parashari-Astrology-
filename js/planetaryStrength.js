// Planetary relations (Naisargika Maitri, classical NATURAL friendship) and
// a simplified composite strength score derived from three factors: the
// relationship a planet has with the LORD of the sign it occupies, the
// relationships it has with each planet it's CONJUNCT with, and with each
// planet ASPECTING it. This is deliberately a simplified aggregate for a
// quick favorable/unfavorable read — NOT a substitute for full classical
// Shadbala or Panchadha Maitri (compound, positional friendship), which this
// app does not yet compute.

const PLANETARY_STRENGTH_LOGIC_TEXT = [
  ['Planetary Relations & Strength — Logic and Sequence'],
  [''],
  ['1. Naisargika Maitri (natural/permanent friendship) is a fixed classical table (from Brihat Parashara Hora Shastra) — each of the 7 classical planets has a fixed set of natural friends and enemies; everyone else is neutral. This is independent of the chart (it never changes), unlike temporary/positional friendship (Panchadha Maitri), which this app does not yet compute.'],
  ['2. Rahu and Ketu have no natural-friendship entry in BPHS itself; this app extends the table using the common convention followed by most Vedic software: Rahu befriends Venus/Saturn/Mercury and opposes Sun/Moon/Mars (mirroring Saturn/Aquarius); Ketu befriends Mars/Venus/Saturn and opposes Sun/Moon (mirroring Mars/Scorpio) — treat this extension as a widely used approximation, not a BPHS-sourced rule.'],
  ['3. Sign Lord Relation: the relationship between a planet and the ruling lord of the SIGN it occupies. If the planet IS that sign\'s lord, it is "Own" (its own sign) — the strongest placement. Otherwise it is Friend/Neutral/Enemy per the Naisargika Maitri table.'],
  ['4. Conjunct-With Relation and Aspected-By Relation: the same Naisargika Maitri lookup applied to every planet this planet is conjunct with (same sign) or aspected by (Parashari graha drishti) respectively.'],
  ['5. Composite strength score (this app\'s own simplified weighting, expressed as a percentage from -100 to +100): Sign Lord Relation contributes Own=+100, Friend=+50, Neutral=0, Enemy=-50. Each conjunct planet contributes Friend=+15, Neutral=0, Enemy=-15. Each aspecting planet contributes Friend=+10, Neutral=0, Enemy=-10. All three are summed and the total is clamped to [-100, +100].'],
  [''],
  ['Caveat: this composite score is a simplified, this-app-specific aggregate meant for a quick favorable/unfavorable read at a glance — it is NOT classical Shadbala (six-fold strength) or Panchadha Maitri (five-tier compound friendship), both of which weigh positional/temporary friendship, exaltation/debilitation, directional strength, and more. Treat a strongly negative score as "worth a closer classical look," not a final verdict.']
];

// Classical Naisargika Maitri (BPHS) for the 7 classical planets, extended
// for Rahu/Ketu per the common software convention noted above.
const NATURAL_FRIENDSHIP = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
  Rahu: { friends: ['Venus', 'Saturn', 'Mercury'], enemies: ['Sun', 'Moon', 'Mars'] },
  Ketu: { friends: ['Mars', 'Venus', 'Saturn'], enemies: ['Sun', 'Moon'] }
};

const SIGN_RELATION_SCORE = { Own: 100, Friend: 50, Neutral: 0, Enemy: -50 };
const CONJUNCTION_RELATION_SCORE = { Friend: 15, Neutral: 0, Enemy: -15 };
const ASPECT_RELATION_SCORE = { Friend: 10, Neutral: 0, Enemy: -10 };

// Naisargika Maitri relation FROM planetA's perspective TOWARD planetB.
function relationBetween(planetA, planetB) {
  if (planetA === planetB) return 'Own';
  const rel = NATURAL_FRIENDSHIP[planetA];
  if (!rel) return 'Neutral';
  if (rel.friends.includes(planetB)) return 'Friend';
  if (rel.enemies.includes(planetB)) return 'Enemy';
  return 'Neutral';
}

function signLordRelation(planetName, sign) {
  const lord = SIGN_LORD[sign];
  if (!lord) return 'Neutral';
  if (lord === planetName) return 'Own';
  return relationBetween(planetName, lord);
}

// planets: birth-chart planets, each with { name, sign, conjunctWith: [names], aspectedBy: [names] }.
// Returns one strength record per planet.
function computePlanetaryStrength(planets) {
  return planets.map(p => {
    const signRelation = signLordRelation(p.name, p.sign);
    const signScore = SIGN_RELATION_SCORE[signRelation];

    const conjRelations = (p.conjunctWith || []).map(name => ({ name, relation: relationBetween(p.name, name) }));
    const conjScore = conjRelations.reduce((sum, c) => sum + CONJUNCTION_RELATION_SCORE[c.relation], 0);

    const aspectRelations = (p.aspectedBy || []).map(name => ({ name, relation: relationBetween(p.name, name) }));
    const aspectScore = aspectRelations.reduce((sum, a) => sum + ASPECT_RELATION_SCORE[a.relation], 0);

    const totalRaw = signScore + conjScore + aspectScore;
    const total = Math.max(-100, Math.min(100, totalRaw));

    return {
      name: p.name, sign: p.sign, signRelation, signScore,
      conjRelations, conjScore, aspectRelations, aspectScore,
      totalRaw, total
    };
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    PLANETARY_STRENGTH_LOGIC_TEXT, NATURAL_FRIENDSHIP,
    SIGN_RELATION_SCORE, CONJUNCTION_RELATION_SCORE, ASPECT_RELATION_SCORE,
    relationBetween, signLordRelation, computePlanetaryStrength
  };
}
