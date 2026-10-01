/* =========================================================
   LEGAL MATTER RESOLUTION TIMING — rule database (Parashari/
   Vimshottari method only; no KP sub-lords/significators/ruling-
   planets, no Western technique). Mirrors the pattern established
   for the fifteen prior timing modules. This module is a timing-
   analysis and classification tool only — it never provides legal
   advice, determines legal rights, or predicts a court's decision as
   a certainty. D10 is deliberately NOT used here (per the spec's
   explicit Section 14 instruction).
   ========================================================= */

window.LEGAL_MATTER_TIMING_RULES = [
  {
    id: 'LEGAL-NATAL-006', category: 'Natal Legal Potential', provenance: 'classical',
    name: '6th house/lord — disputes, litigation, opposition',
    description: 'The 6th house and its lord represent disputes, litigation, opposition, competition, overcoming adversaries, and service-related disputes.',
    explanation: 'The 6th is a primary house for this module; its own condition is assessed before any timing or stage classification. A 6th-house activation is never automatically equated with an adverse outcome.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: disputes, opposition, litigation).'
  },
  {
    id: 'LEGAL-NATAL-007', category: 'Natal Legal Potential', provenance: 'classical',
    name: '7th house/lord — opponents, contracts, negotiations',
    description: 'The 7th house and its lord represent opponents, the opposing party, contracts, agreements, negotiations, and settlement/interpersonal legal matters.',
    explanation: 'A primary house for the opposing-party and negotiation/settlement dimension of a legal matter.',
    source: 'Classical Parashari house signification (7th = Yuvati Bhava: opposing party, contracts, agreements).'
  },
  {
    id: 'LEGAL-NATAL-008', category: 'Natal Legal Potential', provenance: 'classical',
    name: '8th house/lord — complications, shared assets, inheritance, prolonged complexity',
    description: 'The 8th house and its lord represent sudden complications, disputes involving shared assets, inheritance, hidden matters, prolonged complexity, and transformation/closure of difficult situations.',
    explanation: 'Used carefully and contextually — never a default negative reading.',
    source: 'Classical Parashari house signification (8th = Ayu/Randhra Bhava: complications, shared assets, transformation).'
  },
  {
    id: 'LEGAL-NATAL-009', category: 'Natal Legal Potential', provenance: 'classical',
    name: '9th house/lord — law, justice, courts, higher authority',
    description: 'The 9th house and its lord represent law, justice, courts, higher legal authority, and judgment-related matters.',
    explanation: 'The central house for court/judicial-authority timing.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: law, justice, higher authority).'
  },
  {
    id: 'LEGAL-NATAL-010', category: 'Natal Legal Potential', provenance: 'classical',
    name: '10th house/lord — authority, official decision, institutional action',
    description: 'The 10th house and its lord represent authority, official decision, institutional action, and government/legal authority.',
    explanation: 'Read alongside the 9th for official/institutional decision-related activation.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: authority, official action).'
  },
  {
    id: 'LEGAL-NATAL-011', category: 'Natal Legal Potential', provenance: 'classical',
    name: '11th house/lord — fulfilment, gains, desired outcome',
    description: 'The 11th house and its lord represent fulfilment, gains, desired outcome, and successful completion of an objective.',
    explanation: 'Read as the realization/fulfilment house for a legal-matter promise.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: fulfilment, desired outcome).'
  },
  {
    id: 'LEGAL-NATAL-012', category: 'Natal Legal Potential', provenance: 'classical',
    name: '12th house/lord — expenditure, loss, withdrawal, closure (used carefully)',
    description: '12th house, when connected with legal houses, represents expenditure, loss, withdrawal, confinement/isolation where contextually relevant, closure, and legal expenses.',
    explanation: 'Used carefully and contextually, never automatically negative.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: expenditure, closure, withdrawal).'
  },
  {
    id: 'LEGAL-NATAL-002', category: 'Supporting House', provenance: 'classical',
    name: '2nd house — family, accumulated assets, speech/statements',
    description: 'The 2nd house represents family, accumulated assets, speech/statements, and financial implications.',
    explanation: 'A supporting house for financial/family-implication aspects of a legal matter.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: assets, speech, family).'
  },
  {
    id: 'LEGAL-NATAL-003', category: 'Supporting House', provenance: 'classical',
    name: '3rd house — documents, communication, petitions, procedural action',
    description: 'The 3rd house represents documents, communication, petitions, courage, effort, and procedural action.',
    explanation: 'A supporting house for the procedural/documentation dimension of a legal matter.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, documents, communication).'
  },
  {
    id: 'LEGAL-NATAL-004', category: 'Supporting House', provenance: 'classical',
    name: '4th house — property, domestic matters, peace of mind, fixed assets',
    description: 'The 4th house represents property, domestic matters, peace of mind, and fixed assets.',
    explanation: 'A supporting house relevant specifically to property-type legal matters.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: property, domestic foundation).'
  },
  {
    id: 'LEGAL-NATAL-005', category: 'Supporting House', provenance: 'classical',
    name: '5th house — judgment/discretion, strategy, counsel',
    description: 'The 5th house represents judgment/discretion, strategy, and counsel/intellectual decision-making.',
    explanation: 'A supporting house for the strategic/counsel dimension of a legal matter.',
    source: 'Classical Parashari house signification (5th = Putra Bhava: discretion, intellect, counsel).'
  },
  {
    id: 'LEGAL-SIGNIF-SATURN', category: 'Natural Significator', provenance: 'classical',
    name: 'Saturn — prolonged disputes, delay, institutional process',
    description: 'Saturn is read for prolonged disputes, delay, institutional processes, formal structures, and persistence.',
    explanation: 'Never treated as automatically positive or negative; interpreted based on house ownership, placement, relationships, dasha, and transit.',
    source: 'Classical Parashari significance of Saturn (delay, structure, persistence).'
  },
  {
    id: 'LEGAL-SIGNIF-JUPITER', category: 'Natural Significator', provenance: 'classical',
    name: 'Jupiter — law, justice, counsel, resolution, guidance',
    description: 'Jupiter is read for law, justice, counsel, resolution, and guidance.',
    explanation: 'A primary significator for judicial/counsel-related confirmation, read from its actual chart condition.',
    source: 'Classical Parashari karaka system (Jupiter = law, justice, wisdom).'
  },
  {
    id: 'LEGAL-SIGNIF-MARS', category: 'Natural Significator', provenance: 'classical',
    name: 'Mars — conflict, disputes, aggressive action, confrontation',
    description: 'Mars is read for conflict, disputes, aggressive action, and litigation-related confrontation.',
    explanation: 'Never treated as automatically negative; interpreted contextually from its actual chart condition.',
    source: 'Classical Parashari significance of Mars (conflict, aggression, confrontation).'
  },
  {
    id: 'LEGAL-SIGNIF-MERCURY', category: 'Natural Significator', provenance: 'classical',
    name: 'Mercury — documents, contracts, communication, petitions, negotiation',
    description: 'Mercury is read for documents, contracts, communication, petitions, and negotiation.',
    explanation: 'A supporting significator for the documentation/negotiation dimension of a legal matter.',
    source: 'Classical Parashari karaka system (Mercury = documents, contracts, communication).'
  },
  {
    id: 'LEGAL-SIGNIF-VENUS', category: 'Natural Significator', provenance: 'classical',
    name: 'Venus — agreements, settlements, contracts, compromise',
    description: 'Venus is read for agreements, settlements, contracts, and compromise.',
    explanation: 'A supporting significator for settlement/compromise-oriented resolution.',
    source: 'Classical Parashari significance of Venus (agreements, compromise, contracts).'
  },
  {
    id: 'LEGAL-SIGNIF-SUN', category: 'Natural Significator', provenance: 'classical',
    name: 'Sun — authority, government, official decisions, status',
    description: 'The Sun is read for authority, government, official decisions, and status.',
    explanation: 'A supporting significator for official/governmental decision-related timing.',
    source: 'Classical Parashari significance of the Sun (authority, official standing).'
  },
  {
    id: 'LEGAL-SIGNIF-RAHU', category: 'Natural Significator', provenance: 'classical',
    name: 'Rahu — unusual complexity, unconventional circumstances, sudden developments',
    description: 'Rahu is read for unusual complexity, unconventional legal circumstances, and sudden developments.',
    explanation: 'Never treated as automatically positive or negative; used only as secondary context, dependent on house, lordship, conjunction, dasha, and transit.',
    source: 'Classical Parashari karaka extension (Rahu = unconventional/sudden context), read neutrally by default.'
  },
  {
    id: 'LEGAL-SIGNIF-KETU', category: 'Natural Significator', provenance: 'classical',
    name: 'Ketu — separation, detachment, discontinuity, closure-related developments',
    description: 'Ketu is read for separation, detachment, discontinuity, and closure-related developments.',
    explanation: 'Never treated as automatically positive or negative; used only as secondary context.',
    source: 'Classical Parashari karaka extension (Ketu = detachment, discontinuity), read neutrally by default.'
  },
  {
    id: 'LEGAL-HOUSE-6-7', category: 'House Relationship Signature', provenance: 'classical',
    name: '6th <-> 7th connection (Dispute Involving Opposing Party)',
    description: 'Connection of the 6th and 7th houses supports a dispute involving an opposing party.',
    explanation: 'Must be evaluated with natal promise, dasha, and transit confirmation — never in isolation.',
    source: 'Classical Parashari house-lord relationship analysis (6th-7th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-6-9', category: 'House Relationship Signature', provenance: 'classical',
    name: '6th <-> 9th connection (Litigation/Legal/Court-Related Activation)',
    description: 'Connection of the 6th and 9th houses supports litigation/legal/court-related activation.',
    explanation: 'Combines dispute activity with the law/court house.',
    source: 'Classical Parashari house-lord relationship analysis (6th-9th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-6-10', category: 'House Relationship Signature', provenance: 'classical',
    name: '6th <-> 10th connection (Official/Legal Authority or Institutional Action)',
    description: 'Connection of the 6th and 10th houses supports official/legal authority or institutional action in a dispute.',
    explanation: 'Combines dispute activity with institutional authority.',
    source: 'Classical Parashari house-lord relationship analysis (6th-10th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-6-11', category: 'House Relationship Signature', provenance: 'classical',
    name: '6th <-> 11th connection (Resolution/Fulfilment After Dispute)',
    description: 'Connection of the 6th and 11th houses supports resolution/fulfilment after a dispute.',
    explanation: 'Combines dispute activity with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (6th-11th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-6-12', category: 'House Relationship Signature', provenance: 'classical',
    name: '6th <-> 12th connection (Legal Expenditure, Prolonged Dispute, Withdrawal/Closure)',
    description: 'Connection of the 6th and 12th houses supports legal expenditure, prolonged dispute, withdrawal, or closure context.',
    explanation: 'The 12th is used contextually here, never a default negative reading.',
    source: 'Classical Parashari house-lord relationship analysis (6th-12th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-7-9', category: 'House Relationship Signature', provenance: 'classical',
    name: '7th <-> 9th connection (Opponent/Contract + Legal/Court Matters)',
    description: 'Connection of the 7th and 9th houses supports opponent/contract matters combined with legal/court process.',
    explanation: 'Combines the opposing-party house with the law/court house.',
    source: 'Classical Parashari house-lord relationship analysis (7th-9th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-7-11', category: 'House Relationship Signature', provenance: 'classical',
    name: '7th <-> 11th connection (Settlement/Agreement/Desired Resolution)',
    description: 'Connection of the 7th and 11th houses supports a settlement/agreement/desired-resolution context.',
    explanation: 'Combines the negotiation house with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (7th-11th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-8-9', category: 'House Relationship Signature', provenance: 'classical',
    name: '8th <-> 9th connection (Complex Legal/Inheritance/Shared-Asset Matter)',
    description: 'Connection of the 8th and 9th houses supports a complex legal, inheritance, or shared-asset matter.',
    explanation: 'Combines complication/shared-asset themes with the law/court house.',
    source: 'Classical Parashari house-lord relationship analysis (8th-9th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-8-11', category: 'House Relationship Signature', provenance: 'classical',
    name: '8th <-> 11th connection (Resolution Involving Assets or Long-Standing Disputes)',
    description: 'Connection of the 8th and 11th houses supports resolution involving assets or long-standing disputes.',
    explanation: 'Combines complication/shared-asset themes with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (8th-11th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-9-10', category: 'House Relationship Signature', provenance: 'classical',
    name: '9th <-> 10th connection (Official/Legal Authority or Judgment-Related Activation)',
    description: 'Connection of the 9th and 10th houses supports official/legal authority or judgment-related activation.',
    explanation: 'Combines the law/court house with institutional authority.',
    source: 'Classical Parashari house-lord relationship analysis (9th-10th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-9-11', category: 'House Relationship Signature', provenance: 'classical',
    name: '9th <-> 11th connection (Legal Resolution/Desired Result)',
    description: 'Connection of the 9th and 11th houses supports a legal resolution/desired-result context.',
    explanation: 'Combines the law/court house with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (9th-11th nexus).'
  },
  {
    id: 'LEGAL-HOUSE-3-6-9', category: 'House Relationship Signature', provenance: 'classical',
    name: '3rd <-> 6th <-> 9th convergence (Documents/Petitions + Dispute + Legal Process)',
    description: 'Convergence of the 3rd, 6th, and 9th houses supports documents/petitions combined with a dispute and legal process.',
    explanation: 'Combines the procedural/documentation house with dispute activity and the law house.',
    source: 'Classical Parashari house-combination analysis (3rd-6th-9th nexus).'
  },
  {
    id: 'LEGAL-PROPERTY-001', category: 'Matter-Specific Signature', provenance: 'classical',
    name: '4th <-> 6th <-> 8th convergence (Property-Related Dispute)',
    description: 'Convergence of the 4th, 6th, and 8th houses supports a property-related dispute.',
    explanation: 'Combines the property house with dispute activity and complication/shared-asset themes.',
    source: 'Classical Parashari house-combination analysis (4th-6th-8th nexus).'
  },
  {
    id: 'LEGAL-INHERITANCE-001', category: 'Matter-Specific Signature', provenance: 'classical',
    name: '2nd <-> 8th <-> 11th convergence (Inheritance/Shared-Asset/Financial Legal Resolution)',
    description: 'Convergence of the 2nd, 8th, and 11th houses supports an inheritance/shared-asset/financial legal-resolution context.',
    explanation: 'Combines the asset house with shared-asset/complication themes and the realization house.',
    source: 'Classical Parashari house-combination analysis (2nd-8th-11th nexus).'
  },
  {
    id: 'LEGAL-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to legal houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/3rd/4th/6th/7th/8th/9th/10th/11th/12th houses activates legal-matter themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the legal-specific houses — an activation/timing signal, not by itself a guaranteed legal event. Contextual dasha signatures include Litigation/Proceedings (6th+7th+9th), Court/Authority (9th+10th), Settlement (7th+11th with Venus/Mercury), Resolution (6th+11th or 9th+11th), and Legal Expense/Prolongation (6th+12th or 8th+12th) — these are contextual, not deterministic.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'LEGAL-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 6th/9th/10th/11th',
    description: 'Jupiter transiting or aspecting these houses, or relevant lords/natal planets, can be a supporting indicator for legal guidance, judicial processes, resolution, or fulfilment depending on the natal chart.',
    explanation: 'Per the spec: a transit alone must never generate a legal-event prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'LEGAL-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 6th/8th/9th/10th/12th',
    description: 'Saturn transiting or aspecting these houses may correspond to sustained proceedings, delay, formal processes, or eventual closure depending on context — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never automatically classified as negative here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'LEGAL-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary only)',
    description: 'Rahu/Ketu transit to the legal houses is used only as secondary confirmation for unusual developments, sudden procedural changes, unexpected developments, or discontinuity — never alone sufficient to create a resolution window.',
    explanation: 'Per the spec\'s explicit instruction: Rahu/Ketu alone must never create a resolution window.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'LEGAL-NOD10-001', category: 'Divisional Chart Scope', provenance: 'application',
    name: 'D10 deliberately not used for legal-matter timing',
    description: 'D10 (Dashamsha) is not treated as primary or forced into this module\'s confirmation layer, consistent with the spec\'s explicit Section 14 instruction.',
    explanation: 'Legal-matter timing is not a career/profession-timing question; using D10 here would misapply a professional divisional chart to an unrelated domain.',
    source: 'Application policy (not a classical technique) — an explicit scope boundary for this module.'
  },
  {
    id: 'LEGAL-MATTERTYPE-001', category: 'Matter-Specific Mode', provenance: 'application',
    name: 'Matter-type selector adjusts supporting-house emphasis only',
    description: 'An optional Matter Type selector (General/Property/Family/Financial/Employment/Business-Contract/Inheritance/Administrative-Government/Other) adjusts which supporting houses receive emphasis — it never manufactures a result unsupported by the horoscope.',
    explanation: 'Per the spec\'s explicit Section 15 instruction: the selector changes emphasis/weighting only, never generates evidence that is not otherwise present in the chart.',
    source: 'Application synthesis combining classical house groupings into matter-specific weighting — not a named classical technique.'
  },
  {
    id: 'LEGAL-STAGE-001', category: 'Legal Stage Classification', provenance: 'application',
    name: 'Legal-matter stage classification (Initiation -> Proceedings -> Negotiation -> Settlement -> Hearing/Order -> Resolution/Closure -> Appeal/Review -> Continued/Delayed)',
    description: 'Each candidate window is classified into the most appropriate legal-matter stage supported by the astrology, distinguishing initiation from ongoing proceedings from settlement/negotiation from judgment/order from resolution/closure from appeal/review — a 6th-house activation is never automatically equated with an adverse outcome.',
    explanation: 'Per the spec\'s explicit Section 4/11 instruction: this prevents treating every legal-related period as a final-resolution period.',
    source: 'Application synthesis mapping classical house-activation convergence to a staged legal-process model — not a named classical technique.'
  },
  {
    id: 'LEGAL-NOOUTCOME-001', category: 'Limitations', provenance: 'application',
    name: 'No guaranteed court outcome, no legal advice, no legal rights determination',
    description: 'This module never states that a party will win or lose, that a court will rule in anyone\'s favour, that a case will be dismissed, or that a settlement/judgment date is guaranteed. It never provides legal advice, determines legal rights, or replaces a qualified legal professional. It uses only cautious language such as "astrologically supportive period for resolution-related developments."',
    explanation: 'Per the spec\'s explicit Section 19 instruction: this is a comprehensive, explicit scope boundary for the module.',
    source: 'Application policy (not a classical technique) — an explicit scope boundary for this module.'
  },
  {
    id: 'LEGAL-STRENGTH-001', category: 'Window Strength', provenance: 'application',
    name: 'Window strength (non-numeric)',
    description: 'Candidate window strength is expressed as one of five descriptive categories (Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional) — never a numeric score, percentage, star rating, "best"/"worst period" label, or ranked legal outcome.',
    explanation: 'Per the spec\'s explicit Section 20 instruction: no numerical scores, percentages, star ratings, best/worst periods, or ranked legal outcomes.',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  }
];
