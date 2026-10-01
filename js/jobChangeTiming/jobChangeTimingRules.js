/* =========================================================
   JOB CHANGE TIMING — rule database (Parashari/Vimshottari method only;
   no KP sub-lords/significators/ruling-planets, no Western technique).
   Every rule is declared here with its own id/category/explanation/
   source/provenance, mirroring the pattern established for Marriage
   Timing and Promotion Timing.
   ========================================================= */

window.JOB_CHANGE_TIMING_RULES = [
  {
    id: 'JC-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house/lord — existing professional position',
    description: 'The 10th house and its lord represent the existing career direction and professional position; its connections to the 3rd/6th/9th/12th houses are what indicate CHANGE, not the 10th alone.',
    explanation: 'The 10th is read here as the anchor of the current role, never as a standalone job-change signal — only its connections to the change-indicating houses matter for this module.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, status).'
  },
  {
    id: 'JC-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house/lord — employment/service',
    description: 'The 6th house and its lord govern employment/service specifically (as distinct from business), and is particularly important for job-change analysis in a service career.',
    explanation: 'Classical significator of daily service/employment; its connection to the 10th is a primary job-change indicator.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: service, daily labor, competition).'
  },
  {
    id: 'JC-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — gain/new opportunity',
    description: 'The 11th house/lord support a successful transition and material gain arising from a professional change.',
    explanation: 'Read as supporting a change being net-beneficial, not as a change-trigger itself.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, realization).'
  },
  {
    id: 'JC-NATAL-003', category: 'Natal Promise', provenance: 'classical',
    name: '3rd house — movement, initiative, applications, interviews',
    description: '3rd house/lord support short-distance professional movement, initiative, applications, interviews, and change of immediate working environment.',
    explanation: 'A supporting house for the effort/initiative side of a job search or transition, not a career-direction house by itself.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, courage, short journeys, communication).'
  },
  {
    id: 'JC-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — major career direction change, fortune, foreign opportunity',
    description: '9th house/lord support a major, fortune-linked change of career direction, long-distance professional movement, or a higher-level/foreign opportunity.',
    explanation: 'Read as supporting a positive, dharma/fortune-linked redirection of career, not routine job switching.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, long journeys, higher direction).'
  },
  {
    id: 'JC-NATAL-012', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — separation/exit from current environment',
    description: '12th house/lord support leaving the current organization/environment, including foreign employment — but 12th activation alone must never be read as job loss.',
    explanation: 'The 12th signifies exit/separation/foreign context generically; whether that separation is a chosen transition, a foreign placement, or an involuntary loss depends on the rest of the evidence (Saturn/8th/affliction), never on the 12th alone.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: loss, separation, foreign lands, exit) — explicitly NOT equated with job loss by itself, per the spec\'s instruction.'
  },
  {
    id: 'JC-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — employment, hierarchy, long-term work, restructuring',
    description: 'Saturn is read for employment/service, organizational hierarchy, long-term work, responsibility, and restructuring/separation depending on context — never assumed negative by default.',
    explanation: 'Saturn\'s actual dignity/placement/relationships determine whether it supports stable long-term service, a formal transition, or (in affliction) separation — not a blanket "Saturn = bad" reading.',
    source: 'Classical Parashari significance of Saturn (karma, structure, longevity, formal hierarchy).'
  },
  {
    id: 'JC-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — authority, management, organizational status',
    description: 'The Sun is read for authority, management, recognition, and organizational status relevant to how a job change affects standing.',
    explanation: 'Direct application of the Sun\'s authority/status karaka role.',
    source: 'Classical Parashari karaka system (Sun = authority/status contexts).'
  },
  {
    id: 'JC-NATAL-MERCURY', category: 'Natal Promise', provenance: 'classical',
    name: 'Mercury — interviews, communication, contracts, negotiations',
    description: 'Mercury is read, where relevant, for interviews, communication, contracts, applications, and professional negotiation/analysis-oriented roles.',
    explanation: 'A supporting significator for the communicative/transactional mechanics of a job change, not a career-direction house.',
    source: 'Classical Parashari karaka system (Mercury = communication, commerce, contracts, intellect).'
  },
  {
    id: 'JC-NATAL-RAHU', category: 'Natal Promise', provenance: 'classical',
    name: 'Rahu — unconventional/foreign/technology-related career shifts',
    description: 'Rahu connected to career houses can indicate unconventional career shifts, foreign organizations, technology-related change, or sudden professional transitions — never assumed automatically negative.',
    explanation: 'Rahu\'s classical association with foreign/unconventional contexts is applied here specifically to career-house connections, used carefully as the spec requires rather than as a default malefic signal.',
    source: 'Classical Parashari karaka extension (Rahu = foreign lands, unconventional/sudden change).'
  },
  {
    id: 'JC-PAIR-10-6', category: 'Change Signature', provenance: 'classical',
    name: '10th lord <-> 6th lord connection',
    description: 'Connection between the 10th and 6th lords supports a change within/of employment/service specifically.',
    explanation: 'The central classical combination for a service-sector job change.',
    source: 'Classical Parashari house-lord relationship analysis (10th-6th nexus).'
  },
  {
    id: 'JC-PAIR-10-12', category: 'Change Signature', provenance: 'classical',
    name: '10th lord <-> 12th lord connection',
    description: 'Connection between the 10th and 12th lords supports leaving the current organization/environment for another.',
    explanation: 'The central classical combination for employer/organization change.',
    source: 'Classical Parashari house-lord relationship analysis (10th-12th nexus).'
  },
  {
    id: 'JC-PAIR-10-3', category: 'Change Signature', provenance: 'classical',
    name: '10th lord <-> 3rd lord connection',
    description: 'Connection between the 10th and 3rd lords supports initiative-driven change — applications, interviews, self-effort toward a new role.',
    explanation: 'Supports the effort/initiative side of a transition.',
    source: 'Classical Parashari house-lord relationship analysis (10th-3rd nexus).'
  },
  {
    id: 'JC-PAIR-10-9', category: 'Change Signature', provenance: 'classical',
    name: '10th lord <-> 9th lord connection',
    description: 'Connection between the 10th and 9th lords supports a major, fortune-linked redirection of career.',
    explanation: 'Supports a higher-level or foreign-opportunity-driven change.',
    source: 'Classical Parashari house-lord relationship analysis (10th-9th nexus).'
  },
  {
    id: 'JC-PAIR-10-11', category: 'Change Signature', provenance: 'classical',
    name: '10th lord <-> 11th lord connection',
    description: 'Connection between the 10th and 11th lords supports a new opportunity/better career direction, read alongside 9th/3rd and Jupiter support.',
    explanation: 'The same combination Promotion Timing treats as its primary signature — here it is read as "new opportunity" only when combined with 3rd/9th/12th evidence, never as proof of either promotion or job change alone (see Step 18 distinction).',
    source: 'Classical Parashari house-lord relationship analysis (10th-11th nexus).'
  },
  {
    id: 'JC-PAIR-6-12', category: 'Change Signature', provenance: 'classical',
    name: '6th lord <-> 12th lord connection',
    description: 'Connection between the 6th and 12th lords supports leaving current employment/service specifically.',
    explanation: 'Combines the employment house with the exit/separation house.',
    source: 'Classical Parashari house-lord relationship analysis (6th-12th nexus).'
  },
  {
    id: 'JC-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as the professional confirmation chart',
    description: 'D10 Lagna/Lagna lord, D10 10th/6th/11th/12th houses and lords, and D10 placement of Sun/Saturn/dasha lords confirm or qualify D1\'s career-change promise — never an independent substitute for D1.',
    explanation: 'D10 is the classical divisional chart for profession; it confirms D1 here exactly as it does in the existing Promotion Timing module.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, primary professional divisional chart).'
  },
  {
    id: 'JC-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to change houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 3rd/6th/9th/10th/11th/12th houses activates job-change themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the change-specific houses — an activation/timing signal, not by itself a job-change prediction.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'JC-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 10th/11th/9th/6th/Moon',
    description: 'Jupiter transiting or aspecting these houses/natal Moon is read as an opportunity/expansion confirmation for job-change timing — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never create a job-change prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'JC-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 10th/6th/11th/12th/Sun/Moon',
    description: 'Saturn transiting or aspecting these houses is read contextually as responsibility increase, formal transition, restructuring, long-term shift, delayed transition, or consolidation — NOT automatically delay or loss.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never defaulted to "delay" or "loss" — its meaning is read from the surrounding natal/dasha evidence.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'JC-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit over/aspecting natal 10th/6th/12th/9th/Sun/Moon (secondary)',
    description: 'Rahu/Ketu transit to these houses is used as a secondary confirmation only, never as the primary timing mechanism.',
    explanation: 'Per the spec\'s explicit instruction: nodal transits are optional, secondary confirmation.',
    source: 'Classical Parashari gochara methodology, nodal transit extension.'
  },
  {
    id: 'JC-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Job-change event classification from converging evidence',
    description: 'A candidate window is classified as Employer/Organization Change, Better Job/Career Opportunity, Role/Function Change, Transfer/Workplace Change, Foreign Job, or Job Separation/Loss based on exactly which houses/significators converge — never a default classification, and never Job Loss without adequate adverse evidence.',
    explanation: 'This application\'s own synthesis of which house/lord/Dasha/D10 combination corresponds to which real-world job-change event — the underlying evidence is classical, the mapping to named event types is this module\'s own (Step 17).',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord evidence it combines is classical.'
  },
  {
    id: 'JC-DISTINGUISH-001', category: 'Promotion vs. Job Change', provenance: 'application',
    name: 'Promotion vs. Job Change distinction',
    description: 'When a period shows both Promotion Timing\'s signature (10th+11th+D10) and Job Change Timing\'s signature (10th+12th/3rd/9th+D10), both possibilities are presented together with an explicit interpretation, rather than forcing the event into one category.',
    explanation: 'This directly implements the spec\'s Step 18 requirement — reusing Promotion Timing\'s own engine output (window.PromotionTiming) for the comparison rather than re-deriving promotion logic.',
    source: 'Application synthesis combining this module\'s own signature evidence with the existing Promotion Timing module\'s output.'
  },
  {
    id: 'JC-DELAY-001', category: 'Delay/Obstruction', provenance: 'application',
    name: 'Adverse/separation context factors',
    description: 'When a dasha is change-relevant but the 8th house is prominent, the 10th/6th/12th lord is afflicted, or D10 is weak, the period is flagged with mixed/adverse context rather than a clean positive-change classification — used only to inform the Job Separation/Loss classification, never asserted without this evidence.',
    explanation: 'This is the module\'s own synthesis of classical affliction indicators into a single "adverse context" flag — it never states job loss is certain, only that this period\'s context includes adverse indicators alongside its change activation.',
    source: 'Application synthesis combining classical affliction indicators (8th prominence, lord affliction, weak D10) per the spec\'s Section 6 Job Loss/Separation guidance.'
  }
];
