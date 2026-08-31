// Ashtakoot Guna Milan — the classical 8-factor (36-point) Vedic kundali
// matching system. Each koota's rule table is fixed classical data
// (independent of any chart); only which nakshatra/rashi each partner's
// Moon occupies is chart-specific. Reuses parashariTables.js's NAKSHATRAS/
// SIGNS/nakshatraFromLongitude and planetaryStrength.js's NATURAL_FRIENDSHIP
// (for Graha Maitri) rather than re-deriving that math.

const ASHTAKOOT_LOGIC_TEXT = [
  ['Ashtakoot Guna Milan — Logic and Sequence'],
  [''],
  ['1. Eight kootas (factors) are scored from each partner\'s Moon nakshatra/pada and Moon rashi (sign), for a maximum total of 36 points: Varna (1), Vashya (2), Tara (3), Yoni (4), Graha Maitri (5), Gana (6), Bhakoot (7), Nadi (8).'],
  ['2. Varna and Vashya are read from the Moon\'s RASHI (sign); Tara, Yoni, Gana, and Nadi are read from the Moon\'s NAKSHATRA; Graha Maitri is read from the natural friendship between the two Moon-rashi lords (see planetaryStrength.js\'s Naisargika Maitri table); Bhakoot is read from the sign-distance between the two Moon rashis.'],
  ['3. Classical interpretation of the total: 18+ is generally considered an acceptable match, 24+ good, 32+ excellent; below 18 is traditionally not recommended, REGARDLESS of the total, if there is an uncancelled Nadi Dosha (same Nadi group, 0/8 on that koota alone) — Nadi Dosha is classically treated as a near-disqualifying defect on its own.'],
  [''],
  ['Caveat: Varna and Vashya are technically pada-sensitive (a few signs classically split at 15° into two different group assignments) — this app uses the common WHOLE-SIGN simplification most basic matching tools use, which can occasionally disagree with a pada-exact reference near a sign\'s midpoint. Yoni compatibility here uses a simplified 3-tier (same/enemy/other) scheme rather than the full 14x14 classical matrix. Bhakoot and Nadi Dosha CANCELLATION rules (Bhanga) — several classical exceptions that waive an apparent dosha — are not computed; a 0 on Bhakoot or Nadi here means the raw rule triggered, not a final verdict after exceptions.']
];

// --- Varna (1 point): Moon rashi grouped by caste-class hierarchy. ---
const VARNA_GROUP = {
  Cancer: 'Brahmin', Scorpio: 'Brahmin', Pisces: 'Brahmin',
  Aries: 'Kshatriya', Leo: 'Kshatriya', Sagittarius: 'Kshatriya',
  Taurus: 'Vaishya', Virgo: 'Vaishya', Capricorn: 'Vaishya',
  Gemini: 'Shudra', Libra: 'Shudra', Aquarius: 'Shudra'
};
const VARNA_RANK = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };

function scoreVarna(boySign, girlSign) {
  const boyVarna = VARNA_GROUP[boySign], girlVarna = VARNA_GROUP[girlSign];
  const score = VARNA_RANK[boyVarna] >= VARNA_RANK[girlVarna] ? 1 : 0;
  return { koota: 'Varna', max: 1, score, boyValue: boyVarna, girlValue: girlVarna };
}

// --- Vashya (2 points): Moon rashi grouped by "who controls whom" animal class. ---
const VASHYA_GROUP = {
  Aries: 'Chatushpada', Taurus: 'Chatushpada', Sagittarius: 'Chatushpada', Capricorn: 'Chatushpada',
  Gemini: 'Manav', Virgo: 'Manav', Libra: 'Manav', Aquarius: 'Manav',
  Cancer: 'Jalachar', Pisces: 'Jalachar',
  Leo: 'Vanachar',
  Scorpio: 'Keeta'
};
// score[boyGroup][girlGroup] out of 2.
const VASHYA_MATRIX = {
  Chatushpada: { Chatushpada: 2, Manav: 1, Jalachar: 1, Vanachar: 0, Keeta: 0 },
  Manav: { Chatushpada: 1, Manav: 2, Jalachar: 1, Vanachar: 1, Keeta: 0 },
  Jalachar: { Chatushpada: 1, Manav: 1, Jalachar: 2, Vanachar: 0, Keeta: 1 },
  Vanachar: { Chatushpada: 1, Manav: 0, Jalachar: 0, Vanachar: 2, Keeta: 0 },
  Keeta: { Chatushpada: 0, Manav: 0, Jalachar: 1, Vanachar: 0, Keeta: 2 }
};

function scoreVashya(boySign, girlSign) {
  const boyGroup = VASHYA_GROUP[boySign], girlGroup = VASHYA_GROUP[girlSign];
  const score = VASHYA_MATRIX[boyGroup][girlGroup];
  return { koota: 'Vashya', max: 2, score, boyValue: boyGroup, girlValue: girlGroup };
}

// --- Tara (3 points): birth-star counting compatibility. ---
const TARA_GOOD = { 2: true, 4: true, 6: true, 8: true, 9: true, 1: false, 3: false, 5: false, 7: false };

function taraNumberFrom(fromNakIndex, toNakIndex) {
  const count = ((toNakIndex - fromNakIndex + 27) % 27) + 1;
  return ((count - 1) % 9) + 1;
}

function scoreTara(boyNakIndex, girlNakIndex, boyNakName, girlNakName) {
  const boyToGirl = taraNumberFrom(boyNakIndex, girlNakIndex);
  const girlToBoy = taraNumberFrom(girlNakIndex, boyNakIndex);
  const goodCount = (TARA_GOOD[boyToGirl] ? 1 : 0) + (TARA_GOOD[girlToBoy] ? 1 : 0);
  const score = goodCount === 2 ? 3 : goodCount === 1 ? 1.5 : 0;
  return { koota: 'Tara', max: 3, score, boyValue: boyNakName, girlValue: girlNakName };
}

// --- Yoni (4 points): nakshatra animal-symbol compatibility. ---
const YONI_ANIMAL = {
  Ashwini: { animal: 'Horse', gender: 'M' }, Bharani: { animal: 'Elephant', gender: 'M' },
  Krittika: { animal: 'Goat', gender: 'F' }, Rohini: { animal: 'Serpent', gender: 'M' },
  Mrigashira: { animal: 'Serpent', gender: 'F' }, Ardra: { animal: 'Dog', gender: 'F' },
  Punarvasu: { animal: 'Cat', gender: 'F' }, Pushya: { animal: 'Goat', gender: 'M' },
  Ashlesha: { animal: 'Cat', gender: 'M' }, Magha: { animal: 'Rat', gender: 'M' },
  'Purva Phalguni': { animal: 'Rat', gender: 'F' }, 'Uttara Phalguni': { animal: 'Cow', gender: 'F' },
  Hasta: { animal: 'Buffalo', gender: 'F' }, Chitra: { animal: 'Tiger', gender: 'F' },
  Swati: { animal: 'Buffalo', gender: 'M' }, Vishakha: { animal: 'Tiger', gender: 'M' },
  Anuradha: { animal: 'Deer', gender: 'F' }, Jyeshtha: { animal: 'Deer', gender: 'M' },
  Mula: { animal: 'Dog', gender: 'M' }, 'Purva Ashadha': { animal: 'Monkey', gender: 'M' },
  'Uttara Ashadha': { animal: 'Mongoose', gender: 'M' }, Shravana: { animal: 'Monkey', gender: 'F' },
  Dhanishta: { animal: 'Lion', gender: 'F' }, Shatabhisha: { animal: 'Horse', gender: 'F' },
  'Purva Bhadrapada': { animal: 'Lion', gender: 'M' }, 'Uttara Bhadrapada': { animal: 'Cow', gender: 'M' },
  Revati: { animal: 'Elephant', gender: 'F' }
};
// Classical natural-enemy animal pairs (symmetric).
const YONI_ENEMY_PAIRS = [
  ['Cow', 'Tiger'], ['Horse', 'Buffalo'], ['Elephant', 'Lion'], ['Dog', 'Deer'],
  ['Serpent', 'Mongoose'], ['Rat', 'Cat'], ['Goat', 'Monkey']
];
function isYoniEnemyPair(a, b) {
  return YONI_ENEMY_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

function scoreYoni(boyNakName, girlNakName) {
  const boyYoni = YONI_ANIMAL[boyNakName], girlYoni = YONI_ANIMAL[girlNakName];
  let score;
  if (boyYoni.animal === girlYoni.animal) {
    score = boyYoni.gender === girlYoni.gender ? 4 : 3;
  } else if (isYoniEnemyPair(boyYoni.animal, girlYoni.animal)) {
    score = 0;
  } else {
    score = 2; // simplified "compatible/neutral" tier — see file-level caveat
  }
  return { koota: 'Yoni', max: 4, score, boyValue: `${boyYoni.animal} (${boyYoni.gender})`, girlValue: `${girlYoni.animal} (${girlYoni.gender})` };
}

// --- Graha Maitri (5 points): natural friendship between Moon-rashi lords. ---
function scoreGrahaMaitri(boySign, girlSign) {
  const boyLord = SIGN_LORD[boySign], girlLord = SIGN_LORD[girlSign];
  if (boyLord === girlLord) return { koota: 'Graha Maitri', max: 5, score: 5, boyValue: boyLord, girlValue: girlLord };

  const boyToGirl = relationBetween(boyLord, girlLord);
  const girlToBoy = relationBetween(girlLord, boyLord);
  const friendCount = (boyToGirl === 'Friend' ? 1 : 0) + (girlToBoy === 'Friend' ? 1 : 0);
  const enemyCount = (boyToGirl === 'Enemy' ? 1 : 0) + (girlToBoy === 'Enemy' ? 1 : 0);

  let score;
  if (friendCount === 2) score = 4;
  else if (friendCount === 1 && enemyCount === 0) score = 3;
  else if (friendCount === 0 && enemyCount === 0) score = 2;
  else if (enemyCount === 1) score = 1;
  else score = 0; // both enemies
  return { koota: 'Graha Maitri', max: 5, score, boyValue: boyLord, girlValue: girlLord };
}

// --- Gana (6 points): nakshatra temperament group (deva/manushya/rakshasa). ---
const GANA_GROUP = {
  Ashwini: 'Deva', Mrigashira: 'Deva', Punarvasu: 'Deva', Pushya: 'Deva', Hasta: 'Deva',
  Swati: 'Deva', Anuradha: 'Deva', Shravana: 'Deva', Revati: 'Deva',
  Bharani: 'Manushya', Rohini: 'Manushya', Ardra: 'Manushya', 'Purva Phalguni': 'Manushya',
  'Uttara Phalguni': 'Manushya', 'Purva Ashadha': 'Manushya', 'Uttara Ashadha': 'Manushya',
  'Purva Bhadrapada': 'Manushya', 'Uttara Bhadrapada': 'Manushya',
  Krittika: 'Rakshasa', Ashlesha: 'Rakshasa', Magha: 'Rakshasa', Chitra: 'Rakshasa',
  Vishakha: 'Rakshasa', Jyeshtha: 'Rakshasa', Mula: 'Rakshasa', Dhanishta: 'Rakshasa', Shatabhisha: 'Rakshasa'
};
const GANA_MATRIX = {
  Deva: { Deva: 6, Manushya: 5, Rakshasa: 1 },
  Manushya: { Deva: 6, Manushya: 6, Rakshasa: 0 },
  Rakshasa: { Deva: 0, Manushya: 0, Rakshasa: 6 }
};

function scoreGana(boyNakName, girlNakName) {
  const boyGana = GANA_GROUP[boyNakName], girlGana = GANA_GROUP[girlNakName];
  const score = GANA_MATRIX[boyGana][girlGana];
  return { koota: 'Gana', max: 6, score, boyValue: boyGana, girlValue: girlGana };
}

// --- Bhakoot (7 points): Moon rashi distance compatibility. ---
const BHAKOOT_DOSHA_DISTANCES = [2, 12, 5, 9, 6, 8];

function scoreBhakoot(boySign, girlSign) {
  const boyIndex = SIGNS.indexOf(boySign), girlIndex = SIGNS.indexOf(girlSign);
  const forward = ((girlIndex - boyIndex + 12) % 12) + 1;
  const backward = ((boyIndex - girlIndex + 12) % 12) + 1;
  const hasDosha = BHAKOOT_DOSHA_DISTANCES.includes(forward) || BHAKOOT_DOSHA_DISTANCES.includes(backward);
  return { koota: 'Bhakoot', max: 7, score: hasDosha ? 0 : 7, boyValue: boySign, girlValue: girlSign };
}

// --- Nadi (8 points): nakshatra Ayurvedic-dosha grouping (highest-weighted koota). ---
const NADI_GROUP = {
  Ashwini: 'Aadi', Ardra: 'Aadi', Punarvasu: 'Aadi', 'Uttara Phalguni': 'Aadi', Hasta: 'Aadi',
  Jyeshtha: 'Aadi', Mula: 'Aadi', Shatabhisha: 'Aadi', 'Purva Bhadrapada': 'Aadi',
  Bharani: 'Madhya', Mrigashira: 'Madhya', Pushya: 'Madhya', 'Purva Phalguni': 'Madhya', Chitra: 'Madhya',
  Anuradha: 'Madhya', 'Purva Ashadha': 'Madhya', Dhanishta: 'Madhya', 'Uttara Bhadrapada': 'Madhya',
  Krittika: 'Antya', Rohini: 'Antya', Ashlesha: 'Antya', Magha: 'Antya', Swati: 'Antya',
  Vishakha: 'Antya', 'Uttara Ashadha': 'Antya', Shravana: 'Antya', Revati: 'Antya'
};

function scoreNadi(boyNakName, girlNakName) {
  const boyNadi = NADI_GROUP[boyNakName], girlNadi = NADI_GROUP[girlNakName];
  const score = boyNadi === girlNadi ? 0 : 8;
  return { koota: 'Nadi', max: 8, score, boyValue: boyNadi, girlValue: girlNadi };
}

if (typeof module !== 'undefined') {
  module.exports = {
    ASHTAKOOT_LOGIC_TEXT,
    scoreVarna, scoreVashya, scoreTara, scoreYoni, scoreGrahaMaitri, scoreGana, scoreBhakoot, scoreNadi,
    VARNA_GROUP, VASHYA_GROUP, YONI_ANIMAL, GANA_GROUP, NADI_GROUP
  };
}
