/* =========================================================
   MUHURTA / ELECTIONAL TIMING — rule registry.

   Muhurta answers "which date/time in a chosen future range is
   traditionally more favorable for starting activity X?" — it is NOT a
   natal-chart "when will X happen" prediction (that question is answered
   by this app's many Timing modules, e.g. window.MarriageTiming for
   marriage). Every rule here is a classical electional-astrology factor,
   cited with provenance. Rules with provenance:'application' are this
   app's own synthesis (activity-to-factor applicability mapping), never
   presented as an ancient scriptural rule.

   Namespacing: window.MUHURTA_RULES (array), window.MUHURTA_ACTIVITIES
   (category registry), window.MUHURTA_NAKSHATRA_TABLE,
   window.MUHURTA_TITHI_TABLE, window.MUHURTA_WEEKDAY_TABLE,
   window.MUHURTA_FORBIDDEN_PATTERNS.
   ========================================================= */

// ---------------------------------------------------------------
// Activity categories (Scope section of the build spec — exactly these
// six, no invented categories).
// ---------------------------------------------------------------
window.MUHURTA_ACTIVITIES = [
  { id: 'general', label: 'General / Auspicious Activity', description: 'A broad favorable-window finder for any generally auspicious undertaking not covered by a more specific category below.' },
  { id: 'travel', label: 'Travel', description: 'Starting a journey (classical "Yatra" muhurta).' },
  { id: 'business', label: 'New Venture / Business Start', description: 'Launching a new business, shop opening, or starting a new professional venture.' },
  { id: 'property', label: 'Property — Griha Pravesh / Construction Start', description: 'Housewarming (Griha Pravesh) or beginning construction.' },
  { id: 'marriage', label: 'Marriage Ceremony Date', description: 'Selecting a specific ceremony date, assuming a marriage is already planned. Distinct from the Marriage Timing module (see explain tab).' },
  { id: 'contract', label: 'Document Signing / Contract', description: 'Signing an important document, contract, or agreement. Traditional date-selection only — not legal advice.' }
];

// ---------------------------------------------------------------
// Tithi suitability (classical). Provenance: classical — the Rikta
// (4th/9th/14th) tithis of each paksha are the long-standing classical
// "avoid for auspicious starts" tithis (Muhurta Chintamani / general
// Panchang convention). Purnima/Amavasya have mixed classical treatment
// depending on activity; treated here as "Mixed" rather than flatly
// favorable or avoided.
// ---------------------------------------------------------------
window.MUHURTA_TITHI_TABLE = {
  // tithi number within paksha (1-15); 15 of shukla = Purnima, 15 of krishna = Amavasya
  riktaTithis: [4, 9, 14],
  favorableTithis: [2, 3, 5, 7, 10, 11, 13],
  mixedTithis: [1, 6, 8, 12, 15]
};

// ---------------------------------------------------------------
// Weekday (Vara) suitability per activity. Provenance: classical
// (general Muhurta Shastra weekday associations widely cited in
// Panchang/Muhurta reference works, e.g. Thursday/Friday for marriage
// and venture starts, Tuesday generally avoided for travel/marriage,
// Saturday generally avoided for new starts).
// ---------------------------------------------------------------
window.MUHURTA_WEEKDAY_TABLE = {
  general: { favorable: ['Monday', 'Wednesday', 'Thursday', 'Friday'], avoided: ['Tuesday', 'Saturday'] },
  travel: { favorable: ['Monday', 'Wednesday', 'Thursday', 'Friday'], avoided: ['Tuesday', 'Saturday', 'Sunday'] },
  business: { favorable: ['Wednesday', 'Thursday', 'Friday'], avoided: ['Tuesday', 'Saturday'] },
  property: { favorable: ['Monday', 'Thursday', 'Friday'], avoided: ['Tuesday', 'Saturday', 'Sunday'] },
  marriage: { favorable: ['Monday', 'Wednesday', 'Thursday', 'Friday'], avoided: ['Tuesday', 'Saturday', 'Sunday'] },
  contract: { favorable: ['Wednesday', 'Thursday', 'Friday'], avoided: ['Tuesday', 'Saturday'] }
};

// ---------------------------------------------------------------
// Nakshatra-of-day suitability (classical, general list widely cited in
// Muhurta reference works — "fixed/benefic" nakshatras generally
// favorable for most starts; a smaller "generally avoided" set for
// auspicious starts). Per-activity refinements (e.g. marriage-specific
// preferred nakshatras) are marked provenance:'classical' where a
// distinct classical tradition exists, otherwise the general list is
// reused and marked application-level reuse.
// ---------------------------------------------------------------
window.MUHURTA_NAKSHATRA_TABLE = {
  generallyFavorable: ['Rohini', 'Uttara Phalguni', 'Uttarashadha', 'Uttarabhadrapada', 'Revati', 'Mrigashira', 'Hasta', 'Swati', 'Anuradha'],
  generallyAvoided: ['Bharani', 'Krittika', 'Ashlesha', 'Jyeshtha', 'Moola', 'Ashwini'],
  // Marriage-specific classically preferred nakshatras (a distinct, commonly
  // cited classical marriage-muhurta list; narrower than the general list).
  marriageFavorable: ['Rohini', 'Mrigashira', 'Magha', 'Uttara Phalguni', 'Hasta', 'Swati', 'Anuradha', 'Uttarashadha', 'Uttarabhadrapada', 'Revati']
};

const MUHURTA_NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Moola', 'Purva Ashadha', 'Uttarashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttarabhadrapada', 'Revati'
];
window.MUHURTA_NAKSHATRA_NAMES = MUHURTA_NAKSHATRA_NAMES;

// ---------------------------------------------------------------
// Rule registry — one entry per classical factor, following the
// established _RULES convention ({id, category, provenance, name,
// description, explanation, source}).
// ---------------------------------------------------------------
window.MUHURTA_RULES = [
  {
    id: 'rikta-tithi-avoid', category: 'Tithi', provenance: 'classical',
    name: 'Rikta Tithi avoidance',
    description: 'Tithis 4, 9 and 14 of each paksha ("Rikta" / empty tithis) are classically avoided for auspicious starts.',
    explanation: 'Rikta tithis are traditionally associated with obstruction or incompleteness and are a standard classical exclusion across most Muhurta categories.',
    source: 'Classical Muhurta Shastra convention, widely cited in Panchang reference works.'
  },
  {
    id: 'tithi-favorable', category: 'Tithi', provenance: 'classical',
    name: 'Favorable Tithi',
    description: 'Tithis 2, 3, 5, 7, 10, 11, 13 of each paksha are classically considered favorable (Nanda/Bhadra/Jaya/Purna groupings vary by source; this app uses the widely-cited common favorable subset).',
    explanation: 'These tithis fall outside the Rikta group and are commonly treated as supportive of new beginnings.',
    source: 'Classical Muhurta Shastra convention.'
  },
  {
    id: 'weekday-activity-fit', category: 'Weekday', provenance: 'classical',
    name: 'Weekday (Vara) suitability for the chosen activity',
    description: 'Each weekday carries classical associations making it more or less suited to a given activity category (e.g. Thursday/Friday favored for marriage and new ventures; Tuesday generally avoided for travel and marriage; Saturday generally avoided for new starts).',
    explanation: 'This is a longstanding classical weekday-planet association (Thursday=Jupiter/benefic, Tuesday=Mars/aggressive, Saturday=Saturn/obstruction-associated, etc.) applied per activity.',
    source: 'General Muhurta Shastra weekday-planet association, widely cited in Panchang/Muhurta reference works.'
  },
  {
    id: 'nakshatra-general-favorable', category: 'Nakshatra', provenance: 'classical',
    name: 'Generally favorable Nakshatra of the day',
    description: 'Rohini, Uttara Phalguni, Uttarashadha, Uttarabhadrapada, Revati, Mrigashira, Hasta, Swati and Anuradha are classically treated as generally favorable nakshatras for most auspicious activities.',
    explanation: 'These nakshatras are classified in classical Muhurta texts as "fixed," "movable-benefic," or otherwise broadly auspicious in nature.',
    source: 'Classical nakshatra-nature classification, widely cited in Muhurta/Panchang reference works.'
  },
  {
    id: 'nakshatra-general-avoided', category: 'Nakshatra', provenance: 'classical',
    name: 'Generally avoided Nakshatra of the day',
    description: 'Bharani, Krittika, Ashlesha, Jyeshtha, Moola and Ashwini are classically treated as generally avoided for auspicious starts (though some are used for specific sharp/fierce-natured activities, not covered by this module\'s scope).',
    explanation: 'These nakshatras are classified in classical Muhurta texts as fierce/sharp-natured and are typically excluded from general auspicious-start lists.',
    source: 'Classical nakshatra-nature classification, widely cited in Muhurta/Panchang reference works.'
  },
  {
    id: 'nakshatra-marriage-specific', category: 'Nakshatra', provenance: 'classical',
    name: 'Marriage-specific favorable Nakshatra',
    description: 'A narrower, distinctly classical list of nakshatras (Rohini, Mrigashira, Magha, Uttara Phalguni, Hasta, Swati, Anuradha, Uttarashadha, Uttarabhadrapada, Revati) specifically cited for marriage-muhurta selection.',
    explanation: 'Marriage muhurta classically draws on its own nakshatra list, distinct from (though overlapping) the general list.',
    source: 'Classical marriage-muhurta nakshatra convention, widely cited in Vedic marriage-Panchang reference works.'
  },
  {
    id: 'rahu-kaal-avoid', category: 'Inauspicious Period', provenance: 'classical',
    name: 'Rahu Kaal avoidance',
    description: 'Rahu Kaal is a daily ~90-minute period, timing determined by weekday, classically avoided for starting any new/auspicious activity.',
    explanation: 'The day (sunrise to sunset) is divided into 8 equal parts; a fixed part-index per weekday is assigned to Rahu and avoided for new beginnings. This module uses the standard 6:00 AM-6:00 PM nominal day-length approximation documented in research-notes.md rather than true per-location sunrise/sunset.',
    source: 'Classical Panchang convention (daily Rahu Kaal table by weekday).'
  },
  {
    id: 'yamaganda-avoid', category: 'Inauspicious Period', provenance: 'classical',
    name: 'Yamaganda Kaal avoidance',
    description: 'Yamaganda is a second daily inauspicious period (different part-index per weekday from Rahu Kaal), classically avoided alongside Rahu Kaal.',
    explanation: 'Same 8-part day division as Rahu Kaal, a different fixed part-index per weekday.',
    source: 'Classical Panchang convention.'
  },
  {
    id: 'gulika-avoid', category: 'Inauspicious Period', provenance: 'classical',
    name: 'Gulika Kaal avoidance',
    description: 'Gulika Kaal is a third daily inauspicious sub-period (son of Saturn, Gulika/Mandi), classically avoided alongside Rahu Kaal and Yamaganda.',
    explanation: 'Same 8-part day division, a third fixed part-index per weekday.',
    source: 'Classical Panchang convention.'
  },
  {
    id: 'bhadra-note', category: 'Inauspicious Period', provenance: 'application',
    name: 'Bhadra (Vishti Karana) — not computed, flagged as a known gap',
    description: 'Bhadra (the Vishti karana period) is a classical exclusion for most auspicious activities, but this module does not compute Karana boundaries directly.',
    explanation: 'This is an honest scope note, not a calculated factor: Bhadra/Vishti timing requires sub-day Karana boundary computation. When window.PanchangDailyAlmanac is available and exposes Karana data, this module reuses it; otherwise this factor is omitted from the per-day classification and the UI says so explicitly.',
    source: 'Documented omission — see docs/muhurtaElectional/research-notes.md.'
  },
  {
    id: 'eclipse-proximity-avoid', category: 'Inauspicious Period', provenance: 'application',
    name: 'Close Sun-Moon conjunction/opposition (gross eclipse-proximity avoidance)',
    description: 'Dates where the Sun-Moon angular separation (or its supplement) is within a small orb of 0 degrees (new moon) or 180 degrees are flagged as "review — possible eclipse-season proximity," a coarse, non-predictive gross check only.',
    explanation: 'This is NOT an eclipse-prediction engine (explicitly out of scope). It is a simple longitude-based proximity flag using the already-available computeSingleLongitude for Sun and Moon, intended only to prompt a manual cross-check against an almanac for the exact date, never a determination that an eclipse is occurring.',
    source: 'Application-level synthesis (classical sources avoid eclipse dates for auspicious activity; the detection method here is this app\'s own coarse approximation, not a scriptural rule).'
  },
  {
    id: 'dasha-context-only', category: 'Dasha Context', provenance: 'application',
    name: 'Current Dasha period shown as supporting context',
    description: 'The native\'s current Mahadasha/Antardasha is shown alongside each candidate date purely as background context.',
    explanation: 'Muhurta is a daily/Panchang-level selection question, not a multi-year Dasha-timing question. Dasha is never used here to favor or disqualify a specific date — it is shown only so the user can see which broader period a candidate date falls within.',
    source: 'Application-level design decision, consistent with this module\'s scope boundary (see research-notes.md).'
  }
];

// ---------------------------------------------------------------
// Forbidden-language scanner patterns (own synthesized narrative text
// only, per established per-module safety-filter convention).
// ---------------------------------------------------------------
window.MUHURTA_FORBIDDEN_PATTERNS = [
  /will guarantee/i, /guaranteed success/i, /will definitely succeed/i, /will definitely fail/i,
  /will prevent (harm|disaster|failure)/i, /ensures success/i, /certain to succeed/i, /certain to fail/i,
  /100% (favorable|safe|auspicious)/i, /always succeeds/i, /never fails/i, /legal advice/i, /financial advice/i, /medical advice/i
];
