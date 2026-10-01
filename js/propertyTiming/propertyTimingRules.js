/* =========================================================
   PROPERTY PURCHASE TIMING — rule database (Parashari/Vimshottari
   method only; no KP sub-lords/significators/ruling-planets, no
   Western technique). Mirrors the pattern established for Marriage/
   Promotion/Job Change/Career Start/Childbirth Timing.
   ========================================================= */

window.PROPERTY_TIMING_RULES = [
  {
    id: 'PP-NATAL-004', category: 'Natal Promise', provenance: 'classical',
    name: '4th house/lord — primary property/residence house',
    description: 'The 4th house and its lord represent home, land, property, and domestic foundation; their dignity, occupants, aspects, and placement set the baseline property-acquisition indication.',
    explanation: 'The 4th is the central house for this module; its own condition is assessed before any timing or event-type classification.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: home, land, mother, comfort).'
  },
  {
    id: 'PP-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house/lord — wealth/financial capacity',
    description: 'The 2nd house/lord indicate accumulated wealth and financial capacity relevant to acquisition.',
    explanation: 'Read alongside the 4th, never as a property house on its own.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: wealth, accumulated resources).'
  },
  {
    id: 'PP-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — gain/realization of acquisition',
    description: 'The 11th house/lord support the realization of the 4th house\'s promise into an actual acquisition/gain.',
    explanation: 'Read as a supporting realization factor, never a property house itself.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, realization of desire).'
  },
  {
    id: 'PP-NATAL-008', category: 'Natal Promise', provenance: 'classical',
    name: '8th house — loans, joint assets, inheritance (used carefully)',
    description: '8th house involvement is read for mortgages/loans, joint assets, inheritance, and sudden property developments — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction: 8th-house activation is context, never an automatic negative verdict, and also the key differentiator for inheritance-type events.',
    source: 'Classical Parashari house signification (8th = transformation, joint/inherited resources).'
  },
  {
    id: 'PP-NATAL-012', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — expenditure/outflow (used carefully)',
    description: '12th house involvement is read for large expenditure, settlement/closing costs, and foreign-property context — never automatically property loss.',
    explanation: 'Per the spec\'s explicit instruction: "12th alone must not mean property loss" — read as financial-outflow context only.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: expenditure, loss, foreign context).'
  },
  {
    id: 'PP-NATAL-005', category: 'Natal Promise', provenance: 'classical',
    name: '5th house — investment/speculative property decisions (supporting)',
    description: '5th house, when connected with the 4th/11th, supports investment-type or speculative property decisions.',
    explanation: 'Read strictly as supporting, never a property house on its own.',
    source: 'Classical Parashari house signification (5th = Putra Bhava, also speculation/investment in some contexts).'
  },
  {
    id: 'PP-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — fortune, inheritance, long-distance property (supporting)',
    description: '9th house supports property acquired through fortune, family support, or inheritance, or long-distance/foreign property.',
    explanation: 'Read strictly as supporting context, not a substitute for the 4th.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, family dharma).'
  },
  {
    id: 'PP-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house — commercial/work-related property (supporting)',
    description: '10th house supports property connected to career/business — office or commercial premises.',
    explanation: 'Read strictly as supporting context for commercial (not residential) property.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, business).'
  },
  {
    id: 'PP-NATAL-MARS', category: 'Natal Promise', provenance: 'classical',
    name: 'Mars — land, construction, structural matters',
    description: 'Mars is read for land, construction, engineering, and structural property matters, from its actual dignity/placement/relationships.',
    explanation: 'Classical significator of land and construction; its actual condition (not a blanket assumption) determines its contribution.',
    source: 'Classical Parashari significance of Mars (Bhumi karaka: land/property significator).'
  },
  {
    id: 'PP-NATAL-VENUS', category: 'Natal Promise', provenance: 'classical',
    name: 'Venus — comfort, residential property, amenities',
    description: 'Venus is read for comfort, residential property, luxury, and home amenities.',
    explanation: 'A supporting significator for the comfort/residential-quality dimension of property.',
    source: 'Classical Parashari significance of Venus (comfort, luxury, vehicles, home amenities).'
  },
  {
    id: 'PP-NATAL-MOON', category: 'Natal Promise', provenance: 'classical',
    name: 'Moon — home, residence, domestic comfort',
    description: 'The Moon is read for home, residence, and domestic/emotional comfort attached to property.',
    explanation: 'A supporting significator for the residential/domestic dimension.',
    source: 'Classical Parashari significance of the Moon (domestic context, home, mother).'
  },
  {
    id: 'PP-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — land, fixed assets, long-term property, delay',
    description: 'Saturn is read for land, fixed/long-term assets, construction, and formal registration — never automatically interpreted as denial.',
    explanation: 'Saturn\'s actual condition determines whether it suggests durable long-term property or genuine delay — never a default negative reading.',
    source: 'Classical Parashari significance of Saturn (structure, longevity, land).'
  },
  {
    id: 'PP-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — expansion, large asset acquisition, supportive finances',
    description: 'Jupiter is read for expansion, wealth, opportunity, and large asset acquisition, from its actual chart ownership and placement.',
    explanation: 'Jupiter\'s functional ownership and actual condition determine its contribution — not a blanket "Jupiter is good" assumption.',
    source: 'Classical Parashari karaka system (Jupiter = wealth/expansion significator).'
  },
  {
    id: 'PP-PAIR-4-11', category: 'Property Acquisition Indicators', provenance: 'classical',
    name: '4th lord <-> 11th lord connection',
    description: 'Connection between the 4th and 11th lords is the central classical combination for a property promise being realized/gained.',
    explanation: 'The textbook Parashari combination for the 4th house promise converting into an actual acquisition.',
    source: 'Classical Parashari house-lord relationship analysis (4th-11th nexus).'
  },
  {
    id: 'PP-PAIR-4-2', category: 'Property Acquisition Indicators', provenance: 'classical',
    name: '4th lord <-> 2nd lord connection',
    description: 'Connection between the 4th and 2nd lords supports the financial-capacity side of acquisition.',
    explanation: 'Combines the property house with the wealth house.',
    source: 'Classical Parashari house-lord relationship analysis (4th-2nd nexus).'
  },
  {
    id: 'PP-MARS-PROPERTY', category: 'Property Acquisition Indicators', provenance: 'classical',
    name: 'Mars connected with the 4th house/lord',
    description: 'Mars conjunct, aspecting, or lord-exchanging with the 4th house or its lord supports land/construction-type acquisition specifically.',
    explanation: 'Direct application of Mars\'s land/construction karaka role to the 4th house itself.',
    source: 'Classical Parashari karaka-to-house connection analysis.'
  },
  {
    id: 'PP-D4-001', category: 'D4 Confirmation', provenance: 'classical',
    name: 'D4 (Chaturthamsha) as the property confirmation chart',
    description: 'D4 Lagna/Lagna lord, D4 4th/2nd/11th houses and lords, and D4 placement of Mars/Venus/Moon/dasha lords confirm or qualify D1\'s property promise — never an independent substitute for D1.',
    explanation: 'D4 is the classical divisional chart for residence/property/land; it confirms D1 here exactly as D7/D9/D10 confirm D1 in the prior timing modules. This app\'s existing divisional-chart engine (vargaPosition with the D4 Chaturthamsa rule already defined) is reused directly — no second D4 implementation was created.',
    source: 'Classical Parashari Varga theory (D4 = Chaturthamsa, primary property/residence divisional chart).'
  },
  {
    id: 'PP-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to property houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/4th/8th/11th/12th houses, the 4th lord, or Mars/Venus/Moon/Jupiter activates property themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the property-specific houses — an activation/timing signal, not by itself a purchase prediction.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'PP-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 4th/4th lord/2nd/11th/Moon',
    description: 'Jupiter transiting or aspecting these houses/natal Moon is read as a supporting expansion/acquisition confirmation — never a standalone trigger.',
    explanation: 'Per the spec: Jupiter transit alone must never create a property-purchase prediction; it only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'PP-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 4th/4th lord/2nd/11th/Moon',
    description: 'Saturn transiting or aspecting these houses is read as land/construction, long-term asset, formal registration, or delayed-but-stable possession — NOT automatically denial.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never defaulted to a negative reading here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'PP-TRANSIT-MARS', category: 'Transit', provenance: 'classical',
    name: 'Mars transit over/aspecting natal 4th/4th lord (secondary)',
    description: 'Mars transit to the 4th/4th lord is used as a secondary factor, especially for land, construction, or registration activity — never alone sufficient to create a property-purchase prediction.',
    explanation: 'Per the spec\'s explicit instruction: Mars alone must never create a property-purchase prediction; it is a secondary, physical-activity confirmation.',
    source: 'Classical Parashari gochara methodology, used cautiously as a secondary factor.'
  },
  {
    id: 'PP-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Property-event classification from converging evidence',
    description: 'A candidate window is classified as Property Purchase, Land Purchase, House/Apartment Purchase, Construction, Possession/Registration, Property Sale, or Inheritance based on exactly which houses/significators converge — never a default "purchase" label, and relocation is never automatically classified as property purchase.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which kind of property event (Step 17). The underlying evidence is classical; the mapping to these named event types is this module\'s own.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'PP-LOAN-001', category: 'Financing', provenance: 'application',
    name: 'Loan/financing indicator (6th/8th involvement)',
    description: 'When the 6th or 8th house is also connected to the property-relevant dasha lords, financing/loan indicators are reported alongside the acquisition promise — never treated as inherently negative.',
    explanation: 'Per the spec\'s explicit instruction: "do not treat loan involvement as inherently negative" — this is reported as a descriptive co-factor, not a scored penalty.',
    source: 'Application synthesis combining classical 6th/8th house signification (debt, obligations) with the property-acquisition evidence — not a named classical financing technique.'
  },
  {
    id: 'PP-WEALTH-001', category: 'Financial Capacity Cross-Check', provenance: 'application',
    name: 'No dedicated Financial/Wealth Timing module exists yet',
    description: 'This app currently has no Financial/Wealth Timing module or D2 (Hora)-based wealth-timing engine to cross-check against. The 2nd-house and 2nd-lord evidence already computed as part of the natal promise is used as the available proxy for financial-capacity context.',
    explanation: 'Per the spec\'s explicit instruction ("if financial timing is not implemented, do not create a duplicate wealth engine"), this module does not fabricate a wealth-timing calculation — it documents the gap and uses only the house-lord evidence already available.',
    source: 'Application synthesis — documents a deliberate scope limitation rather than inventing an unvalidated calculation.'
  }
];
