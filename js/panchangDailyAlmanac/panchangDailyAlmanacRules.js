/* =========================================================
   PANCHANG / DAILY ALMANAC — lightweight interpretive rule registry.
   This module is primarily deterministic astronomy (Tithi/Vara/
   Nakshatra/Yoga/Karana index arithmetic), so most of it needs no rule
   registry at all. The handful of entries below cover the one place
   genuine interpretive content appears: which tithis/yogas are
   traditionally associated with which kind of activity. Each entry
   follows this app's established provenance convention (id, name,
   category, description, explanation, source, provenance: 'classical'
   | 'application').
   ========================================================= */

window.PANCHANG_RULES = [
  {
    id: 'PANCHANG-001', name: 'Purnima / Amavasya as turning points',
    category: 'Tithi', provenance: 'classical',
    description: 'Purnima (full moon, tithi 15) and Amavasya (new moon, tithi 30/0) mark the Shukla/Krishna Paksha boundary and are traditionally treated as significant tithis for religious observance (vrata, Satyanarayan puja on Purnima; ancestral rites, Shraddha on Amavasya).',
    explanation: 'These two tithis occur when Moon-Sun angular distance is closest to 180deg (Purnima) or 0deg/360deg (Amavasya) — described here only as the classical observance association, never as a claim that any specific event will occur on these dates.',
    source: 'Classical Panchang / Dharmashastra convention (general, not scheme-specific).'
  },
  {
    id: 'PANCHANG-002', name: 'Rikta tithis (4th, 9th, 14th) traditionally avoided for new beginnings',
    category: 'Tithi', provenance: 'classical',
    description: 'Chaturthi (4th), Navami (9th) and Chaturdashi (14th) of each paksha are classically called "Rikta" (empty/void) tithis and are traditionally considered less favorable for starting new auspicious ventures.',
    explanation: 'Presented descriptively as a traditional preference, not as a prediction that an action taken on these tithis will fail or cause harm.',
    source: 'Classical Muhurta/Panchang convention.'
  },
  {
    id: 'PANCHANG-003', name: 'Vishkambha, Atiganda, Shoola, Ganda, Vyaghata, Vajra, Vyatipata, Parigha, Vaidhriti considered inauspicious Nitya Yogas',
    category: 'Yoga (Nitya Yoga)', provenance: 'classical',
    description: 'Of the 27 Nitya Yogas, a traditional subset (commonly: Vishkambha, Atiganda, Shoola, Ganda, Vyaghata, Vajra, Vyatipata, Parigha, Vaidhriti) is classically regarded as less favorable for beginning new ventures, while the rest are considered neutral-to-favorable.',
    explanation: 'This is the classical Panchang sense of "Yoga" (27-fold Sun+Moon combination), distinct from the Raja/Dhana planetary-combination "Yoga" used elsewhere in this app. Presented descriptively only.',
    source: 'Classical Muhurta/Panchang convention (general).'
  },
  {
    id: 'PANCHANG-004', name: 'Vishti (Bhadra) Karana traditionally avoided for auspicious starts',
    category: 'Karana', provenance: 'classical',
    description: 'Of the 7 movable karanas, Vishti (also called Bhadra) is classically the one most consistently flagged as unfavorable for starting new auspicious activities.',
    explanation: 'Presented descriptively as a traditional preference only, never as a deterministic claim about outcomes.',
    source: 'Classical Muhurta/Panchang convention.'
  }
];
