// Classical Parashari general nature and significations (karakatva) for the
// 9 grahas, plus their exaltation/debilitation signs — reference data used
// by the interpretation generators. Pure reference data (not chart-specific).

const PLANET_TRAITS_LOGIC_TEXT = [
  ['Planet Traits Reference — Logic and Sequence'],
  [''],
  ['1. Each planet\'s general nature (its karakatva / significations) is fixed classical doctrine (from Brihat Parashara Hora Shastra) — independent of any chart.'],
  ['2. Exaltation (uchcha) and debilitation (neecha) signs are also fixed classical assignments: a planet placed in its exaltation sign is considered unusually strong and confident in expressing its significations; in its debilitation sign (always the sign opposite its exaltation), unusually weak or effortful.'],
  ['3. Rahu/Ketu exaltation-debilitation assignment is not given in BPHS itself and is treated inconsistently across traditions; this app follows the commonly used convention (Rahu exalted in Gemini/Taurus depending on source — this app uses Gemini; Ketu opposite, Sagittarius) and flags it as convention rather than settled doctrine.']
];

const PLANET_TRAITS = {
  Sun: { nature: 'soul, self-confidence, authority, father, government, vitality', significations: 'ego, leadership, health, paternal relationships, status' },
  Moon: { nature: 'mind, emotions, mother, public, fluctuation, nourishment', significations: 'emotional life, the mother, mental peace, popularity, habits' },
  Mars: { nature: 'energy, courage, action, siblings, conflict, land/property', significations: 'drive, aggression, siblings, sports, disputes, real estate' },
  Mercury: { nature: 'intellect, communication, commerce, analysis, adaptability', significations: 'speech, learning, business, writing, short journeys, wit' },
  Jupiter: { nature: 'wisdom, expansion, fortune, teaching, dharma, children', significations: 'knowledge, guru/mentors, wealth, spirituality, children, optimism' },
  Venus: { nature: 'love, beauty, pleasure, relationships, arts, comfort', significations: 'marriage, romance, luxury, creativity, vehicles, sensory enjoyment' },
  Saturn: { nature: 'discipline, delay, hard work, longevity, restriction, service', significations: 'career endurance, obstacles, aging, labor, the underprivileged, structure' },
  Rahu: { nature: 'obsession, worldly ambition, illusion, foreign/unconventional matters', significations: 'sudden gain or upheaval, foreign connections, addiction, unconventional paths' },
  Ketu: { nature: 'detachment, spirituality, past-life residue, dissolution', significations: 'renunciation, moksha, intuition, isolation, loss of interest, liberation' }
};

const EXALTATION_SIGN = {
  Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo',
  Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra',
  Rahu: 'Gemini', Ketu: 'Sagittarius'
};
const DEBILITATION_SIGN = {
  Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
  Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
  Rahu: 'Sagittarius', Ketu: 'Gemini'
};

if (typeof module !== 'undefined') {
  module.exports = { PLANET_TRAITS_LOGIC_TEXT, PLANET_TRAITS, EXALTATION_SIGN, DEBILITATION_SIGN };
}
