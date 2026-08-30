// Classical Parashari Lagna (Ascendant sign) interpretations — one
// hand-composed entry per sign, since the Ascendant sign is the single most
// consulted placement in a chart and deserves a distinct, complete
// description rather than a generic rule combination. Stored separately
// from the generator-based sign/house interpretations.

const LAGNA_INTERPRETATIONS_LOGIC_TEXT = [
  ['Lagna Interpretation — Logic and Sequence'],
  [''],
  ['1. The Lagna (Ascendant) sign is the sign whole-sign house 1 falls in — this app already computes it in birthChart.js (ephemeris.js\'s computeAscendant, plus the Ascendant\'s own sign/DMS).'],
  ['2. Each of the 12 possible Lagna signs has a fixed classical description of the native\'s general physical build, temperament, and outlook, per traditional Parashari practice.'],
  [''],
  ['Caveat: the Lagna lord\'s own placement, aspects to the Lagna, and planets placed IN the Lagna all modify this base description significantly — this text is the classical STARTING description for the sign alone, not a complete personality reading.']
];

const LAGNA_INTERPRETATIONS = {
  Aries: 'An Aries Lagna gives a body and temperament ruled by Mars: energetic, athletic, quick to act and quick to anger, with a pioneering, competitive, and often impatient nature. These natives tend to be direct, courageous, and natural self-starters, though they can act before thinking things through and may need to consciously cultivate patience.',
  Taurus: 'A Taurus Lagna gives a body and temperament ruled by Venus: sturdy, comfort-loving, and sensuous, with a calm exterior that hides real stubbornness once the native\'s mind is set. These natives value stability, material security, and beauty, and tend to be reliable, patient, and pleasure-seeking, though change does not come easily to them.',
  Gemini: 'A Gemini Lagna gives a body and temperament ruled by Mercury: quick, restless, and communicative, with a naturally curious and versatile mind. These natives are talkative, adaptable, and mentally agile, often juggling multiple interests at once, though they can struggle with follow-through and consistency.',
  Cancer: 'A Cancer Lagna gives a body and temperament ruled by the Moon: sensitive, nurturing, and emotionally responsive, with moods that shift with circumstance. These natives are caring, home-and-family-oriented, and protective of loved ones, though they can be moody, easily hurt, and prone to living in the past.',
  Leo: 'A Leo Lagna gives a body and temperament ruled by the Sun: confident, warm, and dignified, with a natural desire to lead and be recognized. These natives are generous, proud, and dramatic in self-expression, often drawn to positions of authority, though they can be prone to ego and need for admiration.',
  Virgo: 'A Virgo Lagna gives a body and temperament ruled by Mercury: precise, analytical, and modest, with a natural inclination toward service and self-improvement. These natives are detail-oriented, practical, and hardworking, though they can be overly critical of themselves and others, and prone to worry.',
  Libra: 'A Libra Lagna gives a body and temperament ruled by Venus: graceful, diplomatic, and relationship-oriented, with a strong sense of fairness and aesthetics. These natives are charming, cooperative, and partnership-seeking, though they can be indecisive and overly dependent on others\' approval.',
  Scorpio: 'A Scorpio Lagna gives a body and temperament ruled by Mars: intense, magnetic, and secretive, with deep emotional reserves beneath a controlled exterior. These natives are determined, resourceful, and drawn to the hidden or transformative, though they can be suspicious, jealous, or prone to extremes.',
  Sagittarius: 'A Sagittarius Lagna gives a body and temperament ruled by Jupiter: optimistic, expansive, and philosophically inclined, with a love of freedom and adventure. These natives are honest, generous, and broad-minded, often drawn to higher learning or travel, though they can be tactless, restless, or prone to overpromising.',
  Capricorn: 'A Capricorn Lagna gives a body and temperament ruled by Saturn: disciplined, reserved, and ambitious, with a strong sense of duty and long-term patience. These natives are hardworking, practical, and status-conscious, steadily building toward their goals, though they can be pessimistic, rigid, or overly cautious.',
  Aquarius: 'An Aquarius Lagna gives a body and temperament ruled by Saturn: detached, unconventional, and idealistic, with a strong pull toward groups, causes, and reform. These natives are independent, humanitarian, and original in thought, though they can be emotionally distant or stubbornly attached to their own views.',
  Pisces: 'A Pisces Lagna gives a body and temperament ruled by Jupiter: imaginative, compassionate, and impressionable, with a natural sensitivity to the moods and needs of others. These natives are empathetic, artistic, and spiritually inclined, though they can struggle with boundaries, escapism, or indecision.'
};

if (typeof module !== 'undefined') {
  module.exports = { LAGNA_INTERPRETATIONS_LOGIC_TEXT, LAGNA_INTERPRETATIONS };
}
