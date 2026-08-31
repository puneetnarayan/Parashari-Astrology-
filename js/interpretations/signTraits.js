// Classical Parashari trait descriptions for the 12 zodiac signs (rasi) —
// used by the sign, house, and dignity interpretation generators. Pure
// reference data (not chart-specific), stored separately so the
// interpretation engine files can stay short and this data can be revised
// on its own.

const SIGN_TRAITS_LOGIC_TEXT = [
  ['Sign Traits Reference — Logic and Sequence'],
  [''],
  ['1. Each of the 12 signs has a fixed classical temperament (movable/fixed/dual, and elemental nature fire/earth/air/water) and a short descriptive style used to color how any planet placed there tends to express.'],
  ['2. This is general-signification reference data, not itself an interpretation — the interpretation engine files (planetInSignInterpretations.js, planetInHouseInterpretations.js, lagnaInterpretations.js) combine this with planet-trait data to generate the actual per-combination text.']
];

const SIGN_TRAITS = {
  Aries: { style: 'bold, quick-starting, competitive', temperament: 'fiery, impulsive', description: 'a direct, pioneering, somewhat impatient energy that prefers to act first and reflect later' },
  Taurus: { style: 'steady, sensory, possessive', temperament: 'earthy, patient', description: 'a slow, deliberate, comfort-and-security-seeking energy that values what can be touched, owned, and enjoyed' },
  Gemini: { style: 'curious, communicative, versatile', temperament: 'airy, restless', description: 'a quick, talkative, information-hungry energy that thrives on variety and mental stimulation' },
  Cancer: { style: 'nurturing, emotional, protective', temperament: 'watery, sensitive', description: 'a deeply feeling, home-and-family-oriented energy that reacts through mood and memory' },
  Leo: { style: 'confident, dramatic, generous', temperament: 'fiery, proud', description: 'a warm, self-assured, recognition-seeking energy that likes to lead and be seen' },
  Virgo: { style: 'analytical, meticulous, service-minded', temperament: 'earthy, discriminating', description: 'a precise, detail-oriented, self-improving energy that likes to refine, organize, and be useful' },
  Libra: { style: 'diplomatic, relational, aesthetic', temperament: 'airy, balancing', description: 'a partnership-and-harmony-seeking energy that weighs both sides and favors fairness and beauty' },
  Scorpio: { style: 'intense, probing, transformative', temperament: 'watery, secretive', description: 'a deep, all-or-nothing energy that seeks hidden truths and is drawn to crisis and renewal' },
  Sagittarius: { style: 'optimistic, philosophical, freedom-loving', temperament: 'fiery, expansive', description: 'a broad-minded, adventurous, meaning-seeking energy that prefers the big picture to fine print' },
  Capricorn: { style: 'disciplined, ambitious, patient', temperament: 'earthy, structured', description: 'a hardworking, status-and-structure-oriented energy that builds slowly toward long-term goals' },
  Aquarius: { style: 'unconventional, detached, humanitarian', temperament: 'airy, idealistic', description: 'an independent, group-and-cause-oriented energy that favors ideas and reform over tradition and sentiment' },
  Pisces: { style: 'imaginative, compassionate, dreamy', temperament: 'watery, boundaryless', description: 'a merging, spiritually inclined, empathetic energy that can blur boundaries between self and other' }
};

if (typeof module !== 'undefined') {
  module.exports = { SIGN_TRAITS_LOGIC_TEXT, SIGN_TRAITS };
}
