// Remedy database — DATA ONLY, no scoring/decision logic (that lives in
// remedyEngine.js). Every entry carries source metadata so the UI never
// presents a remedy without saying where it comes from and how confident
// the app is. This is a curated, small, conservative set (per-planet
// mantra/donation/action + gemstones + a handful of dosha-specific
// remedies) — not an exhaustive remedy encyclopedia.
//
// SOURCE HONESTY: exact chapter/verse citations are given only where this
// app's author can state them with real confidence (the Navagraha day-of-
// week and dignity/exaltation framework, which is uncontroversial BPHS
// material already used elsewhere in this app). Mantra wording, donation
// item lists, and behavioural upayas are extremely widely repeated across
// mainstream Vedic astrology practice but are NOT individually traceable
// to a specific BPHS verse by this app's author — these are honestly
// labeled "Traditional" (mainstream, later-but-established practice) or
// "Modern" (practitioner convention), never "Classical", and never given
// a fabricated chapter/verse. See docs/remedies/research-notes.md.

const PLANET_DAY = {
  Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
  Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday', Rahu: 'Saturday', Ketu: 'Tuesday'
};

// Standard "Om [Graha]-dative Namah" salutation mantras — the correct
// Sanskrit dative form for each graha's name, not a mechanical
// concatenation of the English planet name (that would produce
// ungrammatical Sanskrit). These one-line salutations are extremely
// widely published and safe for general use without initiation.
const PLANET_MANTRA_FORM = {
  Sun: { sanskrit: 'ॐ सूर्याय नमः', transliteration: 'Om Suryaya Namah' },
  Moon: { sanskrit: 'ॐ चन्द्राय नमः', transliteration: 'Om Chandraya Namah' },
  Mars: { sanskrit: 'ॐ अङ्गारकाय नमः', transliteration: 'Om Angarakaya Namah' },
  Mercury: { sanskrit: 'ॐ बुधाय नमः', transliteration: 'Om Budhaya Namah' },
  Jupiter: { sanskrit: 'ॐ बृहस्पतये नमः', transliteration: 'Om Brihaspataye Namah' },
  Venus: { sanskrit: 'ॐ शुक्राय नमः', transliteration: 'Om Shukraya Namah' },
  Saturn: { sanskrit: 'ॐ शनैश्चराय नमः', transliteration: 'Om Shanaishcharaya Namah' },
  Rahu: { sanskrit: 'ॐ राहवे नमः', transliteration: 'Om Rahave Namah' },
  Ketu: { sanskrit: 'ॐ केतवे नमः', transliteration: 'Om Ketave Namah' }
};

// --- 1. Chant / Mantra ---
// The safe default for every planet is the simple "Namah" (salutation)
// mantra — universally taught, requires no initiation, and is not
// disputed across mainstream sources. The classical Beeja (seed) mantras
// exist too but require correct pronunciation/accent (svara) traditionally
// taught by a qualified teacher; they are marked advanced here rather than
// spelled out from memory, since incorrect svara is itself a traditional
// concern this app is not positioned to guarantee.
const MANTRA_DB = SHADBALA_PLANETS.concat(['Rahu', 'Ketu']).map(planet => ({
  id: `${planet.toUpperCase()}_MANTRA_NAMAH`,
  category: 'chant',
  planet,
  name: `${planet} Namah Mantra (safe, general-use)`,
  sanskrit: PLANET_MANTRA_FORM[planet].sanskrit,
  transliteration: PLANET_MANTRA_FORM[planet].transliteration,
  meaning: `Salutations to ${planet} — a simple, direct salutation mantra, not a Vedic hymn requiring initiation.`,
  recommendedCount: 'Traditionally a multiple of 108 (one mala); 108 daily is a common, sustainable practice.',
  recommendedDayTime: `${PLANET_DAY[planet]}, ideally morning`,
  deity: null,
  preparation: 'None required beyond quiet, clean surroundings; a mala (108-bead rosary) is traditional but not mandatory.',
  suitableForOrdinaryUsers: true,
  advanced: false,
  sourceType: 'Traditional', sourceTitle: 'Mainstream Navagraha japa convention', sourceAuthor: null, sourceReference: 'Widely taught salutation-mantra practice; not a specific classical verse citation.', confidence: 'Medium'
})).concat(SHADBALA_PLANETS.concat(['Rahu', 'Ketu']).map(planet => ({
  id: `${planet.toUpperCase()}_MANTRA_BEEJA_ADVANCED`,
  category: 'chant',
  planet,
  name: `${planet} Beeja (seed) Mantra — advanced/traditionally initiated`,
  sanskrit: null,
  transliteration: null,
  meaning: `The classical seed-syllable mantra for ${planet} is traditionally learned directly from a qualified teacher (guru) for correct pronunciation (svara) — this app does not print it, to avoid the risk of an unverified rendering being chanted incorrectly.`,
  recommendedCount: 'Per traditional guidance from the initiating teacher.',
  recommendedDayTime: `${PLANET_DAY[planet]}`,
  deity: null,
  preparation: 'Traditionally requires initiation/guidance (diksha or direct instruction) for correct pronunciation.',
  suitableForOrdinaryUsers: false,
  advanced: true,
  contraindications: ['Not recommended without a qualified teacher\'s guidance — use the Namah mantra above as the safe default.'],
  sourceType: 'Traditional', sourceTitle: 'Classical Navagraha beeja mantra tradition', sourceAuthor: null, sourceReference: 'Referenced across mainstream Jyotisha practice; exact wording withheld here pending qualified instruction.', confidence: 'Low'
})));

// --- 2. Donation / Dana ---
// Standard Navagraha dana associations, extremely widely repeated across
// mainstream practice. Framed as ethical charity to a real recipient, not
// ritual object disposal.
const DONATION_DB = [
  { planet: 'Sun', items: ['wheat', 'jaggery (gur)', 'copper items', 'red cloth'], recipient: 'a temple, a person in need, or an educational/medical charity' },
  { planet: 'Moon', items: ['rice', 'white cloth', 'milk or milk sweets', 'silver (small token)'], recipient: 'a person in need, especially caregivers of children or the elderly' },
  { planet: 'Mars', items: ['red lentils (masoor dal)', 'jaggery', 'red cloth'], recipient: 'those doing physical/manual labor, or a blood-donation drive' },
  { planet: 'Mercury', items: ['green gram (moong dal)', 'green cloth', 'books or writing materials'], recipient: 'students or an educational charity' },
  { planet: 'Jupiter', items: ['turmeric', 'yellow cloth', 'chickpeas (chana dal)', 'books'], recipient: 'teachers, students, or a scholarship/education fund' },
  { planet: 'Venus', items: ['white cloth', 'rice', 'sugar', 'ghee'], recipient: 'a person in need, especially women\'s welfare organizations' },
  { planet: 'Saturn', items: ['black sesame (til)', 'mustard oil', 'black urad dal', 'iron items'], recipient: 'elderly, disabled, or economically disadvantaged people; labor-welfare charities' },
  { planet: 'Rahu', items: ['mustard oil', 'blue/black cloth', 'coconut'], recipient: 'a marginalized-community welfare organization' },
  { planet: 'Ketu', items: ['multicolored cloth', 'sesame seeds', 'a small charitable sum'], recipient: 'a temple or spiritual/educational institution' }
].map(d => ({
  id: `${d.planet.toUpperCase()}_DONATION_01`,
  category: 'donation',
  planet: d.planet,
  name: `${d.planet} Dana (${PLANET_DAY[d.planet]})`,
  description: `Traditional Navagraha dana for ${d.planet}: ${d.items.join(', ')}.`,
  procedure: `Donate the above item(s) to ${d.recipient}, ideally on ${PLANET_DAY[d.planet]}. This is traditionally used as a propitiatory measure for ${d.planet} — it is not claimed to have a scientifically proven causal effect.`,
  frequency: `Weekly on ${PLANET_DAY[d.planet]}, or as a one-time act during an activated dasha period`,
  duration: 'Ongoing weekly practice, or for the duration of a concerning dasha/antardasha',
  sourceType: 'Traditional', sourceTitle: 'Mainstream Navagraha dana convention', sourceAuthor: null, sourceReference: 'Widely repeated across Jyotisha practitioner tradition; item lists vary slightly by regional source.', confidence: 'Medium'
}));

// --- 3. Action / Conduct / Upaya ---
// Behavioural upayas connect a planet's classical significations to
// everyday conduct. These are NOT individually traceable to a specific
// classical verse — labeled Traditional/Interpretive, matching the
// prompt's own instruction not to assume they're automatically classical.
const ACTION_ITEMS = {
  Sun: ['Show appropriate respect toward father, mentors, and legitimate authority.', 'Maintain a disciplined morning routine (waking early).', 'Practice truthful, direct conduct.', 'Offering water to the rising Sun is a widely taught traditional practice.'],
  Moon: ['Practice emotional regulation rather than suppression or venting.', 'Show care/respect toward one\'s mother or maternal figures.', 'Maintain a steady sleep/eating routine.', 'Water-related charitable acts (e.g. supporting clean-water access) are a traditional association for Moon.'],
  Mars: ['Channel physical energy into disciplined exercise or sport rather than conflict.', 'Avoid unnecessary arguments or provocations.', 'Direct assertiveness into protective or service-oriented roles.'],
  Mercury: ['Communicate truthfully; avoid exaggeration or deception.', 'Engage in regular learning or study.', 'Handle documents, contracts, and accounts carefully and responsibly.'],
  Jupiter: ['Show respect toward teachers and mentors.', 'Engage in teaching, mentoring, or lifelong learning.', 'Support educational causes.', 'Maintain ethical, principled conduct in dealings.'],
  Venus: ['Nurture relationships with honesty and respect.', 'Maintain personal cleanliness and an aesthetically calm environment.', 'Cultivate an art or creative practice.', 'Practice generosity without excess/indulgence.'],
  Saturn: ['Serve or support elderly, disabled, or economically disadvantaged people.', 'Practice punctuality and follow-through on commitments.', 'Approach work with discipline rather than shortcuts.', 'Cultivate humility rather than status-seeking.'],
  Rahu: ['Avoid deception, obsessive pursuit of shortcuts, or unethical opportunism.', 'Regulate intoxicants or compulsive/excessive behaviours.', 'Cultivate discernment before acting on sudden impulses.'],
  Ketu: ['Practice a regular meditation or self-observation routine.', 'Reduce attachment to outcomes; practice non-attachment in daily decisions.', 'Cultivate humility and periods of quiet withdrawal.']
};
const ACTION_DB = Object.entries(ACTION_ITEMS).map(([planet, items]) => ({
  id: `${planet.toUpperCase()}_ACTION_01`,
  category: 'action',
  planet,
  name: `${planet} Conduct / Upaya`,
  description: items.join(' '),
  procedure: 'A sustained behavioural practice rather than a one-time ritual — consistency matters more than intensity.',
  frequency: 'Ongoing / daily habit',
  duration: 'Long-term, especially through an activated dasha/antardasha of this planet',
  sourceType: 'Traditional', sourceTitle: 'Mainstream behavioural-upaya convention (planet-signification-derived)', sourceAuthor: null, sourceReference: 'Interpretive extension of classical karakatva (significations) already used elsewhere in this app, not a direct verse citation.', confidence: 'Low'
}));

// --- 4. Gemstone / Ratna ---
const GEMSTONE_DB = {
  Sun: { name: 'Ruby (Manikya)', substitute: 'Red Garnet or Red Spinel' },
  Moon: { name: 'Pearl (Moti)', substitute: 'Moonstone' },
  Mars: { name: 'Red Coral (Moonga)', substitute: 'Carnelian' },
  Mercury: { name: 'Emerald (Panna)', substitute: 'Peridot or Green Onyx' },
  Jupiter: { name: 'Yellow Sapphire (Pukhraj)', substitute: 'Yellow Topaz or Citrine' },
  Venus: { name: 'Diamond (Heera)', substitute: 'White Sapphire or White Zircon' },
  Saturn: { name: 'Blue Sapphire (Neelam)', substitute: 'Amethyst' },
  Rahu: { name: 'Hessonite (Gomed)', substitute: 'Orange/Brown Zircon' },
  Ketu: { name: 'Cat\'s Eye (Lehsunia)', substitute: 'Chrysoberyl (non-chatoyant) or Tiger\'s Eye' }
};
const GEMSTONE_DB_ENTRIES = Object.entries(GEMSTONE_DB).map(([planet, g]) => ({
  id: `${planet.toUpperCase()}_GEMSTONE_01`,
  category: 'gemstone',
  planet,
  name: g.name,
  description: `Traditional gemstone associated with ${planet}. Gemstones are traditionally considered STRENGTHENING/AMPLIFYING remedies for the planet they represent — they are not automatically appropriate just because the planet is afflicted or weak; see the eligibility assessment for this chart.`,
  substitute: g.substitute,
  procedure: 'Traditionally worn as a ring or pendant in a specified metal, set to touch the skin, after a purification/energizing ritual (prana pratishtha) performed by a qualified priest — and, per common modern practice, only after a short trial period to check for adverse physical reaction.',
  frequency: 'Worn continuously once adopted',
  duration: 'Long-term (years), typically reviewed alongside major dasha changes',
  contraindications: ['Do not combine with a gemstone for a planet in a strongly inimical relationship without specific classical justification.', 'Discontinue and consult a qualified professional if physical discomfort occurs.'],
  sourceType: 'Traditional', sourceTitle: 'Ratna Shastra / mainstream Jyotisha gemstone tradition', sourceAuthor: null, sourceReference: 'Widely attested planet-gemstone association; this app does not assert a specific BPHS verse for the wearing procedure.', confidence: 'Medium'
}));

// --- 5. Dosha/Yoga-specific remedies (mapped to existing yogaRules.js keys) ---
// Only maps yogas this app ALREADY computes (state.yogas) — no new yoga
// detection logic here, and no sensational internet-only "doshas" added.
const DOSHA_REMEDY_MAP = {
  kaalsarpa: { relatedPlanets: ['Rahu', 'Ketu'], note: 'This app\'s Kaal Sarpa Yoga check (see the Yogas tab\'s own caveat: a popular modern combination, not itself in BPHS) — remedies here follow the standard Rahu/Ketu propitiation approach, not a separate "Kaal Sarpa puja" claim.' },
  shrapit: { relatedPlanets: ['Saturn', 'Rahu'], note: 'Saturn-Rahu conjunction (this app\'s "Shrapit Yoga", also a later/modern label per the Yogas tab caveat) — remedies follow standard Saturn and Rahu propitiation.' },
  guruchandal: { relatedPlanets: ['Jupiter', 'Rahu'], note: 'Jupiter-Rahu conjunction — remedies follow standard Jupiter and Rahu propitiation, since this specific combination has no separate classical remedy distinct from propitiating both grahas.' },
  kemadruma: { relatedPlanets: ['Moon'], note: 'Isolated Moon (no conjunction/adjacent-house support) — remedies follow standard Moon strengthening/pacification depending on this chart\'s Moon assessment.' },
  vish: { relatedPlanets: ['Moon', 'Saturn'], note: 'Moon-Saturn conjunction — remedies follow standard Moon and Saturn propitiation.' },
  grahan_sun_rahu: { relatedPlanets: ['Sun', 'Rahu'], note: 'Sun-Rahu conjunction (Grahan Yoga) — remedies follow standard Sun and Rahu propitiation.' },
  grahan_sun_ketu: { relatedPlanets: ['Sun', 'Ketu'], note: 'Sun-Ketu conjunction (Grahan Yoga) — remedies follow standard Sun and Ketu propitiation.' },
  grahan_moon_rahu: { relatedPlanets: ['Moon', 'Rahu'], note: 'Moon-Rahu conjunction (Grahan Yoga) — remedies follow standard Moon and Rahu propitiation.' },
  grahan_moon_ketu: { relatedPlanets: ['Moon', 'Ketu'], note: 'Moon-Ketu conjunction (Grahan Yoga) — remedies follow standard Moon and Ketu propitiation.' },
  angarak_rahu: { relatedPlanets: ['Mars', 'Rahu'], note: 'Mars-Rahu conjunction — remedies follow standard Mars and Rahu propitiation.' },
  angarak_ketu: { relatedPlanets: ['Mars', 'Ketu'], note: 'Mars-Ketu conjunction — remedies follow standard Mars and Ketu propitiation.' },
  daridra: { relatedPlanets: [], note: '11th-lord affliction combination — remedies follow standard propitiation of the 11th lord identified in this chart.' },
  shakat: { relatedPlanets: ['Moon', 'Jupiter'], note: 'Moon 6th/8th/12th from Jupiter — remedies follow standard Moon and Jupiter propitiation.' }
};

if (typeof module !== 'undefined') {
  module.exports = { PLANET_DAY, MANTRA_DB, DONATION_DB, ACTION_DB, GEMSTONE_DB_ENTRIES, DOSHA_REMEDY_MAP };
}
