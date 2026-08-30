// Classical Parashari significations (bhava karakatva) for the 12 houses —
// reference data used by the planet-in-house interpretation generator.
// Pure reference data (not chart-specific).

const HOUSE_THEMES_LOGIC_TEXT = [
  ['House Themes Reference — Logic and Sequence'],
  [''],
  ['1. Each of the 12 houses (bhavas) has a fixed classical set of significations, independent of any chart — the standard Parashari bhava karakatva list.'],
  ['2. Whole-sign houses are used throughout this app (house 1 = the Ascendant\'s own sign) — see parashariCharts.js / birthChart.js.']
];

const HOUSE_THEMES = {
  1: { title: 'Self / Body', description: 'the native\'s physical body, personality, temperament, and general outlook on life' },
  2: { title: 'Wealth / Family', description: 'accumulated wealth, family, speech, food habits, and early childhood values' },
  3: { title: 'Courage / Siblings', description: 'siblings, courage, short journeys, communication skills, and self-effort' },
  4: { title: 'Home / Mother', description: 'the mother, home, property, emotional foundation, vehicles, and domestic comfort' },
  5: { title: 'Intellect / Children', description: 'children, intelligence, creativity, romance, speculation, and past-life merit (purva punya)' },
  6: { title: 'Obstacles / Health', description: 'disease, debt, enemies, daily work, service, and the native\'s capacity to overcome obstacles' },
  7: { title: 'Partnerships / Marriage', description: 'marriage, business partnerships, public dealings, and the spouse' },
  8: { title: 'Transformation / Longevity', description: 'longevity, sudden events, inheritance, occult matters, and deep transformation' },
  9: { title: 'Fortune / Dharma', description: 'fortune, father, higher learning, long journeys, religion/philosophy, and one\'s guiding beliefs' },
  10: { title: 'Career / Status', description: 'career, public status, authority, reputation, and actions in the world' },
  11: { title: 'Gains / Aspirations', description: 'income, gains, elder siblings, social networks, and the fulfillment of desires' },
  12: { title: 'Loss / Liberation', description: 'expenditure, loss, foreign residence, isolation, sleep, and spiritual liberation (moksha)' }
};

if (typeof module !== 'undefined') {
  module.exports = { HOUSE_THEMES_LOGIC_TEXT, HOUSE_THEMES };
}
