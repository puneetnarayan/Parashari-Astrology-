// Brief classical character notes for each of the 27 nakshatras (deity,
// symbol, one-line character keynote). Reference data only — pure text,
// independent of any chart. Nakshatra LORD dignity is not re-derived here;
// it reuses the existing Dignity module (see ruleEngine.js's nakshatra
// section) rather than duplicating that logic.

const NAKSHATRA_TRAITS = {
  Ashwini: { deity: 'Ashwini Kumaras', symbol: 'Horse\'s head', keynote: 'swift, pioneering, a natural healer/first-mover energy' },
  Bharani: { deity: 'Yama', symbol: 'Yoni', keynote: 'intense, bears burdens and transformation, strong willpower' },
  Krittika: { deity: 'Agni', symbol: 'Razor/flame', keynote: 'sharp, purifying, cutting through illusion, can be critical' },
  Rohini: { deity: 'Brahma/Prajapati', symbol: 'Ox cart, chariot', keynote: 'sensual, growth-oriented, magnetic charm, materially fortunate' },
  Mrigashira: { deity: 'Soma', symbol: 'Deer\'s head', keynote: 'searching, curious, gentle restlessness, love of exploration' },
  Ardra: { deity: 'Rudra', symbol: 'Teardrop', keynote: 'stormy, transformative through upheaval, intense emotional depth' },
  Punarvasu: { deity: 'Aditi', symbol: 'Bow and quiver', keynote: 'renewal, resilience, nurturing optimism after hardship' },
  Pushya: { deity: 'Brihaspati', symbol: 'Cow\'s udder / lotus', keynote: 'nourishing, protective, considered one of the most auspicious nakshatras' },
  Ashlesha: { deity: 'Nagas (serpents)', symbol: 'Coiled serpent', keynote: 'penetrating, hypnotic, strategic — can be secretive or manipulative' },
  Magha: { deity: 'Pitrs (ancestors)', symbol: 'Royal throne', keynote: 'ancestral pride, authority, connection to lineage and legacy' },
  'Purva Phalguni': { deity: 'Bhaga', symbol: 'Front legs of a bed', keynote: 'pleasure-loving, creative, socially warm and relaxed' },
  'Uttara Phalguni': { deity: 'Aryaman', symbol: 'Back legs of a bed', keynote: 'reliable, contractual, patron of partnerships and generosity' },
  Hasta: { deity: 'Savitar', symbol: 'Hand', keynote: 'skillful, dexterous, resourceful — good with the hands and with people' },
  Chitra: { deity: 'Vishwakarma', symbol: 'Bright jewel', keynote: 'artistic, a builder/craftsperson instinct, drawn to beauty and form' },
  Swati: { deity: 'Vayu', symbol: 'Young sprout in the wind', keynote: 'independent, adaptable, values freedom and fair dealing' },
  Vishakha: { deity: 'Indra-Agni', symbol: 'Decorated archway', keynote: 'goal-driven, determined, willing to endure a long path to a purpose' },
  Anuradha: { deity: 'Mitra', symbol: 'Lotus/triumphal archway', keynote: 'devoted, cooperative, builds deep and loyal friendships/alliances' },
  Jyeshtha: { deity: 'Indra', symbol: 'Circular amulet/umbrella', keynote: 'senior, protective, carries authority and can be domineering under pressure' },
  Mula: { deity: 'Nirriti', symbol: 'Bunch of roots', keynote: 'root-seeking, investigative, dismantles the old to reach the foundation' },
  'Purva Ashadha': { deity: 'Apas (water)', symbol: 'Fan/tusk', keynote: 'invincible resolve, persuasive, early/unbeatable momentum' },
  'Uttara Ashadha': { deity: 'Vishwadevas', symbol: 'Elephant tusk', keynote: 'enduring victory, principled, steady leadership that outlasts others' },
  Shravana: { deity: 'Vishnu', symbol: 'Ear / three footprints', keynote: 'listening, learning, connective — good at gathering and transmitting knowledge' },
  Dhanishta: { deity: 'Eight Vasus', symbol: 'Drum', keynote: 'rhythmic, ambitious, musical/material drive and group leadership' },
  Shatabhisha: { deity: 'Varuna', symbol: 'Empty circle', keynote: 'healing, secretive, solitary depth — drawn to hidden or unconventional knowledge' },
  'Purva Bhadrapada': { deity: 'Aja Ekapada', symbol: 'Front of funeral cot / sword', keynote: 'intense idealism, fiery spirituality, can swing between extremes' },
  'Uttara Bhadrapada': { deity: 'Ahir Budhnya', symbol: 'Back of funeral cot / twin', keynote: 'deep, wise, quietly steady — a slow-burning depth of understanding' },
  Revati: { deity: 'Pushan', symbol: 'Fish / drum', keynote: 'nurturing, guiding, gentle completion — the safe conclusion of a journey' }
};

if (typeof module !== 'undefined') {
  module.exports = { NAKSHATRA_TRAITS };
}
