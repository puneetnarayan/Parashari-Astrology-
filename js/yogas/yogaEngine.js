// Runs every yoga in YOGA_DEFINITIONS (yogaRules.js) against the current
// birth chart and produces ONE ordered table's worth of rows: present
// auspicious yogas first (best/highest magnitude first), then present
// inauspicious yogas (worst/highest magnitude first), then every yoga NOT
// present in this chart at the end — each row always carries its static
// derivation/meaning text regardless of presence.

const YOGA_ENGINE_LOGIC_TEXT = [
  ['Yoga Engine — Logic and Sequence'],
  [''],
  ['1. Every entry in YOGA_DEFINITIONS is evaluated against the current chart\'s planets and Ascendant, via that entry\'s own compute() function — every entry always yields a row (present or not), never silently omitted.'],
  ['2. Rows are ordered: (a) present auspicious yogas, highest magnitude first, (b) present inauspicious yogas, highest magnitude first, (c) all not-present yogas, in the fixed reference order from yogaRules.js. This runs automatically every time a chart is generated (see ui.js\'s generateChart()).'],
  ['3. Magnitude is always a multiple of 5 (0 when not present) — this app\'s own 0-100 heuristic for ranking/color-coding, not a classical numeric scale (see yogaRules.js).'],
  ['']
];

function computeYogas(planets, ascendant) {
  const rows = YOGA_DEFINITIONS.map(def => {
    const result = def.compute(planets, ascendant);
    return {
      key: def.key, name: def.name, polarity: def.polarity,
      howDerived: def.howDerived, meaning: def.meaning,
      present: result.present, magnitude: result.magnitude,
      planets: result.planets, details: result.details
    };
  });

  const presentGood = rows.filter(r => r.present && r.polarity === 'good').sort((a, b) => b.magnitude - a.magnitude);
  const presentBad = rows.filter(r => r.present && r.polarity === 'bad').sort((a, b) => b.magnitude - a.magnitude);
  const notPresent = rows.filter(r => !r.present);

  return { rows: [...presentGood, ...presentBad, ...notPresent], presentGood, presentBad, notPresent };
}

if (typeof module !== 'undefined') {
  module.exports = { YOGA_ENGINE_LOGIC_TEXT, computeYogas };
}

// Non-invasive export wrapper only — added for Yoga Activation Timing (and any
// later module) to reuse this file's existing yoga-formation logic without
// reimplementing it. Does not change computeYogas()'s internal logic in any way.
// See docs/_moduleDiscoveryInventory.md for the convention this establishes.
if (typeof window !== 'undefined') {
  window.YogaEngine = { detect: computeYogas };
}
