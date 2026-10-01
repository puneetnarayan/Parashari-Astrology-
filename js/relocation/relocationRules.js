/* =========================================================
   RELOCATION — rule database. Every rule the Relocation engine can
   cite is declared here with its own id/category/explanation/source,
   mirroring the pattern already established for Marriage Timing
   (js/marriageTiming/marriageTimingRules.js) and Parashari Analysis.
   ========================================================= */

window.RELOCATION_RULES = [
  {
    id: 'RL-NATAL-001', category: 'Natal Promise',
    name: '4th house/lord — roots, home, comfort',
    description: 'The 4th house and its lord govern home, land, comfort, and the sense of settled roots; their condition sets the baseline promise for any relocation (a change of home/roots).',
    explanation: 'The 4th is the single most central house for relocation analysis in Parashari — a well-placed, benefic-influenced 4th/4th-lord supports relocation being net positive; an afflicted one suggests relocation may come with difficulty or dissatisfaction.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: home, land, mother, comfort).'
  },
  {
    id: 'RL-NATAL-002', category: 'Natal Promise',
    name: '12th house/lord — foreign lands, distant residence',
    description: 'The 12th house and its lord govern foreign residence, distant lands, and life away from the birthplace.',
    explanation: 'Classically the primary significator of settling far from one\'s native place; its strength supports foreign/distant relocation specifically.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: foreign lands, loss of native-place ties).'
  },
  {
    id: 'RL-NATAL-003', category: 'Natal Promise',
    name: '9th house/lord — fortune abroad, long journeys',
    description: 'The 9th house and its lord govern long-distance travel, fortune, and higher purpose, often realized away from the birthplace.',
    explanation: 'The 9th supports relocation that leads to fortune, higher learning, or dharmic growth — read as a supporting, not primary, relocation house.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, long journeys, dharma).'
  },
  {
    id: 'RL-NATAL-004', category: 'Natal Promise',
    name: '3rd house/lord — short travel, courage to change environment',
    description: 'The 3rd house/lord support short-distance change, courage, and self-effort behind a relocation decision.',
    explanation: 'Read as a minor supporting factor for the initiative/effort side of relocation, not for its scale or destination.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, courage, short journeys).'
  },
  {
    id: 'RL-NATAL-005', category: 'Natal Promise',
    name: '7th house/lord — partnership-driven relocation',
    description: 'The 7th house/lord can indicate relocation driven by marriage/partnership (e.g. moving to a spouse\'s location).',
    explanation: 'Read specifically in its 4th-relationship role (Section 3\'s 4th <-> 7th pairing), not as an independent relocation house.',
    source: 'Classical Parashari house signification (7th = partnership) combined with the 4th\'s home signification.'
  },
  {
    id: 'RL-NATAL-006', category: 'Natal Promise',
    name: '10th house/lord — career-driven relocation',
    description: 'The 10th house/lord can indicate relocation driven by career/profession.',
    explanation: 'Read specifically in its 4th-relationship role (Section 3\'s 4th <-> 10th pairing), not as an independent relocation house.',
    source: 'Classical Parashari house signification (10th = karma/career).'
  },
  {
    id: 'RL-NATAL-007', category: 'Natal Promise',
    name: 'Rahu/Ketu — foreign/unconventional relocation',
    description: 'Rahu connected to the 4th, 9th, or 12th house/lord classically supports foreign or unconventional relocation; Ketu similarly connected supports detachment from the native place.',
    explanation: 'Rahu and Ketu are the classical significators of foreign lands and detachment respectively, read here only through their connection to the core relocation houses (never independently).',
    source: 'Classical Parashari karaka extension (Rahu = foreign lands/unconventional; Ketu = detachment, moksha).'
  },
  {
    id: 'RL-NATAL-008', category: 'Natal Promise',
    name: 'Moon — mind\'s comfort with the environment',
    description: 'The Moon\'s condition reflects mental/emotional comfort with one\'s surroundings, relevant to how well relocation is likely to be experienced.',
    explanation: 'Read as a supporting psychological factor, not a relocation-trigger house.',
    source: 'Classical Parashari significance of the Moon as the mind (manas) and its environment-sensitivity.'
  },
  {
    id: 'RL-PAIR-4-12', category: 'House Relationships',
    name: '4th <-> 12th relationship',
    description: 'Connection (conjunction, mutual aspect, or lord exchange) between the 4th and 12th houses/lords classically supports leaving the native home for a distant/foreign one.',
    explanation: 'This is the single most commonly cited classical combination for relocation/foreign residence.',
    source: 'Classical Parashari relocation indicators (4th-12th nexus).'
  },
  {
    id: 'RL-PAIR-4-9', category: 'House Relationships',
    name: '4th <-> 9th relationship',
    description: 'Connection between the 4th and 9th houses/lords supports relocation that brings fortune or higher purpose.',
    explanation: 'Read as supporting a positive, fortune-linked relocation rather than disruption.',
    source: 'Classical Parashari relocation indicators (4th-9th nexus).'
  },
  {
    id: 'RL-PAIR-4-7', category: 'House Relationships',
    name: '4th <-> 7th relationship',
    description: 'Connection between the 4th and 7th houses/lords supports relocation tied to partnership/marriage.',
    explanation: 'Documented per Section 3 of the spec as a primary relationship to evaluate.',
    source: 'Classical Parashari house-lord relationship analysis.'
  },
  {
    id: 'RL-PAIR-4-10', category: 'House Relationships',
    name: '4th <-> 10th relationship',
    description: 'Connection between the 4th and 10th houses/lords supports relocation tied to career/profession.',
    explanation: 'Documented per Section 3 of the spec as a primary relationship to evaluate.',
    source: 'Classical Parashari house-lord relationship analysis.'
  },
  {
    id: 'RL-PAIR-4-NODES', category: 'House Relationships',
    name: '4th <-> Rahu/Ketu relationship',
    description: 'Connection between the 4th house/lord and Rahu or Ketu supports foreign/unconventional change of residence.',
    explanation: 'Documented per Section 3 of the spec as a primary relationship to evaluate.',
    source: 'Classical Parashari house-lord/karaka relationship analysis.'
  },
  {
    id: 'RL-PAIR-9-12', category: 'House Relationships',
    name: '9th <-> 12th relationship',
    description: 'Connection between the 9th and 12th houses/lords supports fortunate foreign residence (dharma realized abroad).',
    explanation: 'Documented per Section 3 of the spec as a primary relationship to evaluate.',
    source: 'Classical Parashari house-lord relationship analysis.'
  },
  {
    id: 'RL-RELOC-001', category: 'Relocation Chart',
    name: 'Relocated Ascendant/houses (astro*carto-graphy style recalculation)',
    description: 'Keeping natal planetary longitudes fixed and recalculating the Ascendant/houses for a candidate location\'s latitude/longitude (at the same birth instant) shows how the same planets express through different houses there.',
    explanation: 'This is the standard relocation-astrology technique: only the local sidereal time and geographic latitude change (both location-dependent), not the planets\' actual positions in the zodiac.',
    source: 'Standard relocation/astro-locality technique, applied here using this app\'s own existing Ascendant-calculation function at the new coordinates.'
  },
  {
    id: 'RL-WEIGHT-001', category: 'Purpose Weighting',
    name: 'Purpose-specific house/planet emphasis',
    description: 'Each relocation purpose (Career, Finance, Family, etc.) emphasizes a different, documented subset of houses/planets, configurable rather than fixed in code.',
    explanation: 'A single relocation chart can be simultaneously good for one purpose and weak for another — purpose-specific weighting keeps that visible instead of collapsing it to one verdict.',
    source: 'This module\'s own documented, configurable weighting scheme (not a named classical text) — an application heuristic, not claimed as classical doctrine.'
  },
  {
    id: 'RL-DASHA-001', category: 'Dasha',
    name: 'Dasha lord connection to relocation houses',
    description: 'A Mahadasha/Antardasha/Pratyantardasha lord connected (by ownership, occupation, or natal aspect/conjunction) to the 4th/9th/10th/12th house activates relocation themes during that period.',
    explanation: 'Classical Vimshottari timing principle, applied here to the relocation-specific houses.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'RL-TRANSIT-001', category: 'Transit',
    name: 'Jupiter/Saturn/Rahu/Ketu transit over relocation houses or their lords',
    description: 'A major body transiting the natal 4th/9th/10th/12th house or its lord\'s sign is read as a supporting (not primary) timing signal for relocation.',
    explanation: 'Transit is explicitly a secondary, confirming layer here — it can support but never override a weak natal promise, per the spec\'s instruction.',
    source: 'Classical Parashari transit (gochara) methodology.'
  },
  {
    id: 'RL-AV-001', category: 'Ashtakavarga',
    name: 'Sarvashtakavarga (SAV) bindus in relocation houses',
    description: 'Higher SAV bindu counts in the natal 4th/9th/10th/12th houses are read as mild supporting evidence for relocation themes in those houses; low counts as mild caution.',
    explanation: 'Ashtakavarga is explicitly a secondary, supporting factor here (5-10 points of the compatibility index), never the primary determinant, per the spec\'s instruction.',
    source: 'Classical Ashtakavarga theory; this app\'s existing Ashtakavarga engine (computeAshtakvarga).'
  },
  {
    id: 'RL-DIRECTION-001', category: 'Direction',
    name: 'Geographic bearing from birthplace',
    description: 'The compass direction from birthplace to a candidate location is shown as supplementary context, with a low weight, and can never override strong house/lord/dasha evidence.',
    explanation: 'Directional astrology (e.g. favorable/unfavorable directions per some traditions) is not a settled, singular classical system — it is treated here purely as descriptive geography, not as a scored factor, to avoid presenting an unvalidated rule as classical doctrine.',
    source: 'Plain geographic bearing calculation (not a classical astrological technique) — included for descriptive context only, explicitly not scored.'
  },
  {
    id: 'RL-INDEX-001', category: 'Compatibility Index',
    name: 'Multi-component Relocation Compatibility Index',
    description: 'The 100-point index combines natal promise, relocated 4th/9th/12th house condition, purpose-specific factors, planetary strength, dasha compatibility, transit support, and Ashtakavarga support, each as a separately visible, documented component.',
    explanation: 'No single factor can produce the final index value alone — every component and its contribution is shown, per the spec\'s explicit "do not create an opaque score" instruction.',
    source: 'This module\'s own documented, configurable scoring design (not a named classical text) — an internal aggregation mechanism, not a validated predictive score.'
  }
];
