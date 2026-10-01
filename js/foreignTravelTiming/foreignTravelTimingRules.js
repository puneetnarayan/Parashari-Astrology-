/* =========================================================
   FOREIGN TRAVEL / FOREIGN SETTLEMENT TIMING — rule database
   (Parashari/Vimshottari method only; no KP sub-lords/significators/
   ruling-planets, no Western technique). Mirrors the pattern
   established for the six prior timing modules.
   ========================================================= */

window.FOREIGN_TRAVEL_TIMING_RULES = [
  {
    id: 'FT-NATAL-003', category: 'Natal Promise', provenance: 'classical',
    name: '3rd house — short travel/movement (used carefully)',
    description: '3rd house/lord support short journeys, movement, applications, and travel preparation — never used alone to predict foreign travel.',
    explanation: 'Per the spec\'s explicit instruction: 3rd alone does not predict foreign travel; it is read only alongside 9th/12th.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, short journeys).'
  },
  {
    id: 'FT-NATAL-004', category: 'Natal Promise', provenance: 'classical',
    name: '4th house — home/native residence',
    description: 'The 4th house and its lord represent home, native residence, and domestic foundation; foreign settlement requires a meaningful relationship between this house and the foreign/distance houses (9th/12th), not the 4th alone.',
    explanation: 'The 4th here is the residence anchor against which "leaving" is measured, not itself a foreign-travel house.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: home, native place).'
  },
  {
    id: 'FT-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — long-distance/foreign travel',
    description: '9th house/lord support long-distance journeys, higher travel, and international opportunity — never used alone to predict foreign travel.',
    explanation: 'Per the spec\'s explicit instruction: 9th alone does not mean foreign travel; read alongside 3rd/12th/10th.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, long journeys).'
  },
  {
    id: 'FT-NATAL-012', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — foreign residence/separation from native place (used carefully)',
    description: '12th house/lord are the primary classical significator of foreign residence and separation from the familiar environment — never automatically interpreted as loss, and never alone sufficient for a settlement classification.',
    explanation: 'Per the spec\'s explicit instruction: 12th alone does not mean foreign settlement, and is never read as loss by default.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: foreign lands, separation, loss of native-place ties).'
  },
  {
    id: 'FT-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house — foreign employment/service abroad (supporting)',
    description: '6th house, when connected with the foreign-travel houses, supports foreign employment/service-abroad specifically.',
    explanation: 'Read as supporting the employment dimension of a foreign event, never a standalone foreign-travel signal.',
    source: 'Classical Parashari house signification (6th = service/employment).'
  },
  {
    id: 'FT-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house — career-related foreign travel (supporting)',
    description: '10th house, when connected with the foreign-travel houses, supports career-driven foreign travel/international assignment.',
    explanation: 'Read as supporting the career dimension of a foreign event.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession).'
  },
  {
    id: 'FT-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house — fulfilment of travel/residence goals (supporting)',
    description: '11th house supports successful realization/gain from a foreign travel or residence opportunity.',
    explanation: 'Read as a supporting realization factor, never a foreign-travel house itself.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, fulfilment).'
  },
  {
    id: 'FT-NATAL-RAHU', category: 'Natal Promise', provenance: 'classical',
    name: 'Rahu — foreign/unconventional environments (secondary significator)',
    description: 'Rahu is the classical secondary significator for foreign/unfamiliar environments, international organizations, and unconventional relocation — never automatically meaning foreign settlement by itself.',
    explanation: 'Per the spec\'s explicit instruction: Rahu alone does not mean foreign residence; it is a supporting factor, read from its actual placement/connections.',
    source: 'Classical Parashari karaka extension (Rahu = foreign lands, unconventional contexts).'
  },
  {
    id: 'FT-NATAL-KETU', category: 'Natal Promise', provenance: 'classical',
    name: 'Ketu — detachment, separation, nontraditional residence (secondary)',
    description: 'Ketu is read for detachment from the familiar environment, separation, spiritual travel, and nontraditional residence patterns.',
    explanation: 'A secondary, supporting significator, never a standalone foreign-settlement trigger.',
    source: 'Classical Parashari karaka extension (Ketu = detachment, moksha, non-attachment to place).'
  },
  {
    id: 'FT-NATAL-MOON', category: 'Natal Promise', provenance: 'classical',
    name: 'Moon — movement, residence, emotional adjustment',
    description: 'The Moon is read for movement, change of residence, and emotional adjustment to a new environment.',
    explanation: 'A supporting psychological/residential-comfort significator.',
    source: 'Classical Parashari significance of the Moon (mind, home, emotional context).'
  },
  {
    id: 'FT-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — long-distance travel, higher education, international opportunity',
    description: 'Jupiter is read for long-distance travel, higher education abroad, international opportunity, and expansion, from its actual chart condition.',
    explanation: 'Jupiter\'s functional ownership and actual condition determine its contribution — not a blanket assumption.',
    source: 'Classical Parashari karaka system (Jupiter = growth, wisdom, expansion, long journeys).'
  },
  {
    id: 'FT-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — long-term residence, sustained relocation, institutional work',
    description: 'Saturn is read for long-term residence, sustained relocation, institutional work, and durable responsibility away from home — never automatically negative.',
    explanation: 'Saturn\'s actual condition determines whether it supports durable settlement or genuine difficulty — never a default negative reading.',
    source: 'Classical Parashari significance of Saturn (structure, longevity, sustained commitment).'
  },
  {
    id: 'FT-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — authority-related foreign assignments (used carefully)',
    description: 'The Sun is read carefully for authority-related or government/institutional foreign assignments, alongside the primary houses.',
    explanation: 'A supporting significator, read from its actual condition.',
    source: 'Classical Parashari significance of the Sun (authority, institutional/government context).'
  },
  {
    id: 'FT-PAIR-4-12', category: 'Foreign Connection Signature', provenance: 'classical',
    name: '4th <-> 12th connection',
    description: 'Connection between the 4th and 12th houses/lords is the central classical combination for leaving the native home/residence for a foreign one.',
    explanation: 'The textbook Parashari combination for residence/foreign-settlement indications.',
    source: 'Classical Parashari house-lord relationship analysis (4th-12th nexus).'
  },
  {
    id: 'FT-PAIR-9-12', category: 'Foreign Connection Signature', provenance: 'classical',
    name: '9th <-> 12th connection',
    description: 'Connection between the 9th and 12th houses/lords supports fortunate, purposeful foreign travel or residence.',
    explanation: 'Combines the long-distance/fortune house with the foreign-residence house.',
    source: 'Classical Parashari house-lord relationship analysis (9th-12th nexus).'
  },
  {
    id: 'FT-PAIR-10-12', category: 'Foreign Connection Signature', provenance: 'classical',
    name: '10th <-> 12th connection',
    description: 'Connection between the 10th and 12th houses/lords supports career-driven foreign relocation (foreign job/assignment).',
    explanation: 'Combines the career house with the foreign-residence house.',
    source: 'Classical Parashari house-lord relationship analysis (10th-12th nexus).'
  },
  {
    id: 'FT-PAIR-6-12', category: 'Foreign Connection Signature', provenance: 'classical',
    name: '6th <-> 12th connection',
    description: 'Connection between the 6th and 12th houses/lords supports foreign employment/service abroad specifically.',
    explanation: 'Combines the service/employment house with the foreign-residence house.',
    source: 'Classical Parashari house-lord relationship analysis (6th-12th nexus).'
  },
  {
    id: 'FT-PAIR-3-9', category: 'Foreign Connection Signature', provenance: 'classical',
    name: '3rd <-> 9th connection',
    description: 'Connection between the 3rd and 9th houses/lords supports effort-driven long-distance travel.',
    explanation: 'Combines the initiative/movement house with the long-distance house.',
    source: 'Classical Parashari house-lord relationship analysis (3rd-9th nexus).'
  },
  {
    id: 'FT-PAIR-9-10', category: 'Foreign Connection Signature', provenance: 'classical',
    name: '9th <-> 10th connection',
    description: 'Connection between the 9th and 10th houses/lords supports career-driven long-distance/international opportunity.',
    explanation: 'Combines the fortune/long-distance house with the career house.',
    source: 'Classical Parashari house-lord relationship analysis (9th-10th nexus).'
  },
  {
    id: 'FT-RAHU-FOREIGN', category: 'Foreign Connection Signature', provenance: 'classical',
    name: 'Rahu connected with 9th/12th/10th',
    description: 'Rahu conjunct, aspecting, or lord-exchanging with the 9th, 12th, or 10th houses or their lords strengthens the foreign-connection signature.',
    explanation: 'Direct application of Rahu\'s foreign/unconventional karaka role to the foreign-travel houses themselves.',
    source: 'Classical Parashari karaka-to-house connection analysis.'
  },
  {
    id: 'FT-D4-001', category: 'D4 Confirmation', provenance: 'classical',
    name: 'D4 (Chaturthamsha) as the residence confirmation chart',
    description: 'D4 Lagna/Lagna lord, D4 4th/9th/12th houses and lords, and D4 placement of Moon/Rahu/Saturn/dasha lords confirm or qualify D1\'s residence/relocation promise — never an independent substitute for D1.',
    explanation: 'D4 is the classical divisional chart for residence/property; it is reused directly here exactly as in Property Purchase Timing — no second D4 implementation was created.',
    source: 'Classical Parashari Varga theory (D4 = Chaturthamsa, residence/property divisional chart).'
  },
  {
    id: 'FT-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as the foreign-employment confirmation chart (career-related events only)',
    description: 'D10 10th/6th/12th/9th/11th houses and lords confirm foreign-employment/foreign-career indications — used only when the event is career-related, never as the primary chart for pure travel/tourism.',
    explanation: 'Per the spec\'s explicit instruction: D10 is reused (exactly as in Promotion/Job-Change/Career-Start Timing) only for the Foreign Employment event type, not for travel-only windows.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, professional divisional chart).'
  },
  {
    id: 'FT-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to foreign-travel houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 3rd/4th/6th/9th/10th/11th/12th houses or Rahu/Ketu activates foreign-travel themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the foreign-travel-specific houses — an activation/timing signal, not by itself a settlement prediction.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'FT-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 9th/12th/4th/10th/11th/Moon',
    description: 'Jupiter transiting or aspecting these houses/natal Moon is read as supporting opportunity, higher education abroad, or successful relocation — never a standalone trigger.',
    explanation: 'Per the spec: a single transit must never generate a foreign-settlement prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'FT-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 4th/9th/10th/12th/Moon',
    description: 'Saturn transiting or aspecting these houses is read as long-term relocation, sustained foreign employment, institutional residence, or delayed-but-durable relocation — NOT automatically negative.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never defaulted to a negative reading here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'FT-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary)',
    description: 'Rahu/Ketu transit to the 4th/9th/10th/12th is used as a secondary confirmation only — never as the primary timing mechanism and never alone sufficient for a prediction.',
    explanation: 'Per the spec\'s explicit instruction: a node transit alone must never create a foreign-settlement prediction.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'FT-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Foreign-event classification from converging evidence',
    description: 'A candidate window is classified as Short/Temporary Foreign Travel, Long-Distance Travel, Foreign Employment, Foreign Education, Extended Foreign Stay, or Foreign Settlement based on exactly which houses/significators/D4/D10/Dasha/transit converge — never a default classification, and temporary travel is never labeled settlement.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which kind of foreign event (Step 21). The underlying evidence is classical; the mapping to these named event types is this module\'s own.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'FT-SETTLEMENT-001', category: 'Settlement Strength', provenance: 'application',
    name: 'Settlement strength (non-numeric)',
    description: 'Settlement strength is expressed as one of five qualitative labels (Strong/Supportive/Temporary-Conditional/Travel-stronger-than-settlement/Mixed) based on duration, repetition across multiple candidate windows, D4 confirmation, and Dasha/transit convergence — never a numeric score.',
    explanation: 'Per the spec\'s explicit instruction (Section 22): no numeric settlement score. A single short travel-qualifying window is never labeled settlement regardless of how strong that one window looks.',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  },
  {
    id: 'FT-CAREER-CROSSCHECK-001', category: 'Foreign Career Cross-Check', provenance: 'application',
    name: 'Job Change Timing cross-check for foreign-career overlap',
    description: 'When a candidate window overlaps one already identified by the existing Job Change Timing module as a Foreign Job, both modules\' evidence are shown together ("Job change + foreign opportunity indicators are active") rather than duplicating job-change logic.',
    explanation: 'Reads window.JobChangeTiming\'s own output directly (the same cross-module read pattern Job Change Timing itself uses for its Promotion-vs-Job-Change distinction) rather than re-deriving any job-change rule.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical two-chart technique.'
  },
  {
    id: 'FT-EDUCATION-001', category: 'Foreign Education Cross-Check', provenance: 'application',
    name: 'No dedicated Education Timing or D24 module exists yet',
    description: 'This app currently has no Education Timing module or D24 (Siddhamsha) calculation to cross-check against for Foreign Education. The 5th/9th/12th house evidence already computed as part of the natal promise is used as the available proxy.',
    explanation: 'Per the spec\'s explicit instruction ("do not create a second education engine"), this module does not fabricate a D24 calculation — it documents the gap, consistent with Career Start Timing\'s identical documented gap for the same reason.',
    source: 'Application synthesis — documents a deliberate scope limitation rather than inventing an unvalidated calculation.'
  }
];
