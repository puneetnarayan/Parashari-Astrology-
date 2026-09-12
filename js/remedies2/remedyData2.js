// Remedies_2 — planet remedy configuration (data only, no logic).
// This is a SEPARATE, independently-designed engine from Remedies_1's
// remedyData.js/remedyEngine.js, per an explicit new prompt requesting its
// own distinct implementation — both reuse the SAME underlying chart
// calculations (dignity, functional lordship, Shadbala, aspects,
// conjunctions, combustion, dasha) but score/consolidate/rank
// independently. Dignity tables (exaltation/debilitation/own/Moolatrikona/
// friend/enemy/neutral) already exist in parashariTables.js
// (detailedDignity, relationBetween, SIGN_LORD) and are reused rather than
// duplicated here — only remedy-specific content lives in this file.

// Exact classical total Beej Mantra Japa counts (source: mainstream
// Navagraha Shanti convention, widely repeated across Parashari remedial
// texts — sourceType 'Traditional', not tied to one citable BPHS verse).
const PLANET_REMEDY_CONFIG = {
  Sun: {
    naturalNature: 'malefic', gender: 'Male', element: 'Fire', weekday: 'Sunday',
    mantra: { sanskrit: 'ॐ सूर्याय नमः', transliteration: 'Om Suryaya Namah', totalJapa: 7000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Sunday' },
    donation: { primary: 'Wheat and jaggery', alternatives: ['Copper items', 'Red/orange cloth'], beneficiary: 'Temple, father figures, or a community cause related to leadership/authority', frequency: 'Weekly on Sunday', cautions: 'Keep the donation modest and voluntary; do not treat as an obligation.' },
    action: ['Respect father and elders/authority figures', 'Maintain personal integrity and honesty', 'Keep a disciplined daily routine', 'Offer appropriate service to institutions or public causes'],
    gemstone: { name: 'Ruby (Manik)', metal: 'Gold or copper', finger: 'Ring finger', day: 'Sunday morning', substitute: 'Red Garnet (Traditional substitute, lower confidence)' }
  },
  Moon: {
    naturalNature: 'benefic', gender: 'Female', element: 'Water', weekday: 'Monday',
    mantra: { sanskrit: 'ॐ चन्द्राय नमः', transliteration: 'Om Chandraya Namah', totalJapa: 11000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Monday' },
    donation: { primary: 'Rice and milk (or another white food item)', alternatives: ['White cloth', 'Silver items'], beneficiary: 'Mothers, children, or those in genuine need', frequency: 'Weekly on Monday', cautions: 'Prefer non-perishable or immediately usable items.' },
    action: ['Maintain emotional steadiness and routine', 'Care for and respect mother/elder women in the family', 'Prioritize hydration, sleep and a stable routine', 'Support charitable food distribution where feasible'],
    gemstone: { name: 'Pearl (Moti)', metal: 'Silver', finger: 'Little finger', day: 'Monday evening', substitute: 'Moonstone (Traditional substitute, lower confidence)' }
  },
  Mars: {
    naturalNature: 'malefic', gender: 'Male', element: 'Fire', weekday: 'Tuesday',
    mantra: { sanskrit: 'ॐ अङ्गारकाय नमः', transliteration: 'Om Angarakaya Namah', totalJapa: 11000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Tuesday' },
    donation: { primary: 'Red lentils (masoor dal)', alternatives: ['Red cloth', 'Jaggery'], beneficiary: 'General food/support donation to those in need', frequency: 'Weekly on Tuesday', cautions: 'Avoid donating weapons or sharp objects even symbolically.' },
    action: ['Channel physical energy into disciplined exercise', 'Actively work on anger management', 'Redirect aggression into constructive action rather than confrontation', 'Prefer service and direct action over conflict'],
    gemstone: { name: 'Red Coral (Moonga)', metal: 'Gold or copper', finger: 'Ring finger', day: 'Tuesday morning', substitute: 'Carnelian (Traditional substitute, lower confidence)' }
  },
  Mercury: {
    naturalNature: 'benefic', gender: 'Neutral', element: 'Earth', weekday: 'Wednesday',
    mantra: { sanskrit: 'ॐ बुधाय नमः', transliteration: 'Om Budhaya Namah', totalJapa: 9000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Wednesday' },
    donation: { primary: 'Green gram (moong dal)', alternatives: ['Educational materials, books'], beneficiary: 'Students or educational causes', frequency: 'Weekly on Wednesday', cautions: 'None specific.' },
    action: ['Practice truthful, direct communication', 'Maintain disciplined study/learning habits', 'Avoid manipulation or deceptive dealings', 'Support education where feasible'],
    gemstone: { name: 'Emerald (Panna)', metal: 'Gold or silver', finger: 'Little finger', day: 'Wednesday morning', substitute: 'Peridot (Traditional substitute, lower confidence)' }
  },
  Jupiter: {
    naturalNature: 'benefic', gender: 'Male', element: 'Ether', weekday: 'Thursday',
    mantra: { sanskrit: 'ॐ बृहस्पतये नमः', transliteration: 'Om Brihaspataye Namah', totalJapa: 19000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Thursday' },
    donation: { primary: 'Yellow gram/chickpeas and turmeric', alternatives: ['Yellow cloth', 'Books'], beneficiary: 'Teachers, educational or spiritual charitable causes', frequency: 'Weekly on Thursday', cautions: 'None specific.' },
    action: ['Show respect to teachers and mentors', 'Maintain ethical conduct in dealings', 'Study or teach where appropriate', 'Practice charity and offer guidance to others'],
    gemstone: { name: 'Yellow Sapphire (Pukhraj)', metal: 'Gold', finger: 'Index finger', day: 'Thursday morning', substitute: 'Yellow Topaz (Traditional substitute, lower confidence)' }
  },
  Venus: {
    naturalNature: 'benefic', gender: 'Female', element: 'Water', weekday: 'Friday',
    mantra: { sanskrit: 'ॐ शुक्राय नमः', transliteration: 'Om Shukraya Namah', totalJapa: 16000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Friday' },
    donation: { primary: 'White clothing and rice/sugar', alternatives: ['Perfume, cosmetics (modest amounts)'], beneficiary: 'Women\'s welfare, arts or social welfare causes', frequency: 'Weekly on Friday', cautions: 'Keep any donation modest, not extravagant.' },
    action: ['Nurture relationships with respect and honesty', 'Maintain personal cleanliness and aesthetics', 'Avoid excess or indulgence', 'Support artistic or social welfare causes'],
    gemstone: { name: 'Diamond (Heera)', metal: 'Silver or platinum', finger: 'Middle or ring finger', day: 'Friday morning', substitute: 'White Sapphire or Zircon (Traditional substitute, lower confidence)' }
  },
  Saturn: {
    naturalNature: 'malefic', gender: 'Neutral', element: 'Air', weekday: 'Saturday',
    mantra: { sanskrit: 'ॐ शनैश्चराय नमः', transliteration: 'Om Shanaishcharaya Namah', totalJapa: 23000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Saturday' },
    donation: { primary: 'Black sesame and sesame oil', alternatives: ['Blankets', 'Footwear'], beneficiary: 'Elderly, workers, or disadvantaged people', frequency: 'Weekly on Saturday', cautions: 'Choose durable, dignified items; avoid anything demeaning to the recipient.' },
    action: ['Practice humility in daily conduct', 'Offer service to workers, the elderly or disadvantaged', 'Maintain punctuality and responsibility', 'Avoid cruelty or exploitation of others'],
    gemstone: { name: 'Blue Sapphire (Neelam)', metal: 'Silver or panchdhatu', finger: 'Middle finger', day: 'Saturday evening', substitute: 'Amethyst (Traditional substitute, lower confidence)' }
  },
  Rahu: {
    naturalNature: 'malefic', gender: 'Neutral (shadow planet)', element: 'Air (by convention)', weekday: 'Saturday (by common convention)',
    mantra: { sanskrit: 'ॐ राहवे नमः', transliteration: 'Om Rahave Namah', totalJapa: 18000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Saturday' },
    donation: { primary: 'Black sesame and blankets', alternatives: ['Mustard oil'], beneficiary: 'Marginalized or disadvantaged persons', frequency: 'Weekly on Saturday', cautions: 'Practical, dignified support only — no unsafe or coercive practices.' },
    action: ['Avoid deception, obsession, and unethical shortcuts', 'Guard against addictive tendencies', 'Simplify excessive material fixation', 'Support marginalized people through practical charity'],
    gemstone: { name: 'Hessonite (Gomed)', metal: 'Silver', finger: 'Middle finger', day: 'Saturday evening', substitute: 'None widely agreed; treat with extra caution.' }
  },
  Ketu: {
    naturalNature: 'malefic', gender: 'Neutral (shadow planet)', element: 'Fire (by convention)', weekday: 'Tuesday (by common convention)',
    mantra: { sanskrit: 'ॐ केतवे नमः', transliteration: 'Om Ketave Namah', totalJapa: 17000, recommendedDailyJapa: 108, recommendedDuration: '40 days (practical default; total count is the primary requirement)', preferredDay: 'Tuesday' },
    donation: { primary: 'Mixed grains and blankets', alternatives: ['Sesame'], beneficiary: 'Spiritual or charitable institutions', frequency: 'Weekly on Tuesday', cautions: 'Practical, dignified support only.' },
    action: ['Reduce needless attachment to outcomes', 'Practice spiritual discipline appropriate to one\'s own tradition', 'Cultivate humility', 'Offer appropriate service and meditation practice'],
    gemstone: { name: 'Cat\'s Eye (Lehsunia)', metal: 'Silver', finger: 'Middle finger', day: 'Tuesday evening', substitute: 'None widely agreed; treat with extra caution.' }
  }
};

// House -> life areas (spec section 24).
const HOUSE_LIFE_AREAS_2 = {
  1: ['Self', 'Body', 'Personality', 'Vitality'],
  2: ['Wealth', 'Family', 'Speech', 'Food'],
  3: ['Courage', 'Siblings', 'Communication', 'Effort'],
  4: ['Mother', 'Home', 'Property', 'Emotional security'],
  5: ['Children', 'Education', 'Intelligence', 'Creativity'],
  6: ['Disease', 'Debts', 'Disputes', 'Service'],
  7: ['Marriage', 'Partnerships', 'Public dealings'],
  8: ['Longevity', 'Obstacles', 'Transformation', 'Inheritance'],
  9: ['Fortune', 'Dharma', 'Father', 'Higher learning'],
  10: ['Career', 'Status', 'Authority', 'Profession'],
  11: ['Gains', 'Income', 'Networks', 'Fulfilment'],
  12: ['Expenses', 'Foreign matters', 'Isolation', 'Sleep', 'Liberation']
};

// Gemstone contraindication reasons (used by remedyEngine2.js's gemstone
// gate) — kept here as data so the "why not" text is centralized.
const GEMSTONE_CONTRAINDICATIONS_2 = {
  functionallyMalefic: 'This planet is functionally malefic for this Ascendant; strengthening it could intensify its adverse results rather than help.',
  dusthanaOnlyLord: 'This planet rules only Dusthana house(s) (6th/8th/12th) with no Kendra/Trikona lordship, so amplifying it is not classically indicated.',
  naturalMaleficNoLordship: 'Rahu/Ketu gemstones require the highest caution and are only ever conditionally suggested, never unconditionally recommended.',
  afflictionDominant: 'This planet\'s difficulty is driven mainly by outside affliction, not by its own weakness — pacifying the affliction is the appropriate response, not amplifying the planet.',
  severeUnresolved: 'The affliction here is severe enough that gemstone use should only proceed under individual professional review, not as a default recommendation.'
};

if (typeof module !== 'undefined') {
  module.exports = { PLANET_REMEDY_CONFIG, HOUSE_LIFE_AREAS_2, GEMSTONE_CONTRAINDICATIONS_2 };
}
