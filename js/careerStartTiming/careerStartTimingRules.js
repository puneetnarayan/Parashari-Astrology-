/* =========================================================
   CAREER START / FIRST JOB TIMING — rule database (Parashari/
   Vimshottari method only; no KP sub-lords/significators/ruling-
   planets, no Western technique). Mirrors the pattern established for
   Marriage Timing, Promotion Timing, and Job Change Timing.
   ========================================================= */

window.CAREER_START_TIMING_RULES = [
  {
    id: 'CS-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house/lord — profession/career entry',
    description: 'The 10th house and its lord represent the profession/career itself; entry into it is confirmed by its connections to 6th/11th/2nd, never the 10th alone.',
    explanation: 'The 10th is read here as the career-direction anchor, never as a standalone first-job signal.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, status).'
  },
  {
    id: 'CS-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house/lord — service/employment',
    description: 'The 6th house and its lord govern service/employment specifically; especially important for salaried first-job analysis.',
    explanation: 'Classical significator of daily service/employment; a strong 6th-10th connection is central to employment-type career entry.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: service, daily labor).'
  },
  {
    id: 'CS-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — gains/fulfilment of the opportunity',
    description: 'The 11th house/lord indicate successful realization of the employment opportunity (an offer actually converting to gain).',
    explanation: 'Read as supporting a career entry being successfully realized, not as a career-direction house itself.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, realization).'
  },
  {
    id: 'CS-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house/lord — income/sustenance',
    description: '2nd house/lord indicate the beginning of income through employment.',
    explanation: 'Used especially to confirm that a career-house activation specifically produces earned income.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: wealth, sustenance).'
  },
  {
    id: 'CS-NATAL-003', category: 'Natal Promise', provenance: 'classical',
    name: '3rd house — initiative, applications, interviews, skill development',
    description: '3rd house/lord support applications, interviews, communication, effort, and skill development leading to a first job.',
    explanation: 'A supporting house for the search/effort side of career entry, not a career-direction house.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, communication).'
  },
  {
    id: 'CS-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — higher learning, fortune, transition to profession',
    description: '9th house/lord support completion of education/qualification, fortunate first opportunity, and the transition from education to profession.',
    explanation: 'Read as a supporting house for a fortunate, well-qualified career start, not a standalone career-start trigger.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, higher learning).'
  },
  {
    id: 'CS-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — service, structure, sustained career',
    description: 'Saturn is read for service/employment, organizational hierarchy, responsibility, and the capacity for a sustained career — never assumed negative by default.',
    explanation: 'Saturn\'s actual dignity/placement/relationships determine whether it supports a stable, structured career entry.',
    source: 'Classical Parashari significance of Saturn (karma, structure, longevity).'
  },
  {
    id: 'CS-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — professional identity, authority, recognition',
    description: 'The Sun is read for professional identity, authority, and recognition relevant to how a first career entry shapes standing.',
    explanation: 'Direct application of the Sun\'s authority/identity karaka role.',
    source: 'Classical Parashari karaka system (Sun = authority/status/identity contexts).'
  },
  {
    id: 'CS-NATAL-MERCURY', category: 'Natal Promise', provenance: 'classical',
    name: 'Mercury — interviews, communication, commerce, analytical skills',
    description: 'Mercury is read, where relevant, for interviews, communication, commerce, analysis, and technology/skills-oriented first roles.',
    explanation: 'A supporting significator for the communicative/transactional mechanics of career entry.',
    source: 'Classical Parashari karaka system (Mercury = communication, commerce, intellect).'
  },
  {
    id: 'CS-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — opportunity, education-to-career transition, growth',
    description: 'Jupiter is read natally as a growth/opportunity/guidance significator relevant to the education-to-career transition, and separately as a transit confirming factor (Step 13).',
    explanation: 'Jupiter\'s role here mirrors its role in Promotion Timing — a supporting/expansion significator, never the sole basis for a career-start classification.',
    source: 'Classical Parashari karaka system (Jupiter = growth, wisdom, expansion, guidance).'
  },
  {
    id: 'CS-PAIR-6-10', category: 'Career Start Indicators', provenance: 'classical',
    name: '6th lord <-> 10th lord connection',
    description: 'Connection between the 6th and 10th lords is the central classical combination for entry into employment/service.',
    explanation: 'The textbook Parashari combination for a service-sector career beginning.',
    source: 'Classical Parashari house-lord relationship analysis (6th-10th nexus).'
  },
  {
    id: 'CS-PAIR-6-11', category: 'Career Start Indicators', provenance: 'classical',
    name: '6th lord <-> 11th lord connection',
    description: 'Connection between the 6th and 11th lords supports the employment opportunity actually being realized/gained.',
    explanation: 'Combines the service house with the realization-of-gain house.',
    source: 'Classical Parashari house-lord relationship analysis (6th-11th nexus).'
  },
  {
    id: 'CS-PAIR-10-11', category: 'Career Start Indicators', provenance: 'classical',
    name: '10th lord <-> 11th lord connection',
    description: 'Connection between the 10th and 11th lords supports a successful, gain-realizing professional appointment.',
    explanation: 'The central classical combination for first major professional appointment (as distinct from pure employment, which needs 6th too).',
    source: 'Classical Parashari house-lord relationship analysis (10th-11th nexus).'
  },
  {
    id: 'CS-PAIR-2-6-10', category: 'Career Start Indicators', provenance: 'classical',
    name: '2nd lord <-> 6th/10th lord connection',
    description: 'Connection between the 2nd lord and the 6th/10th lords supports the career entry specifically producing earned income.',
    explanation: 'Confirms the income dimension of career entry, distinct from designation/role.',
    source: 'Classical Parashari house-lord relationship analysis (2nd-6th/10th nexus).'
  },
  {
    id: 'CS-PAIR-2-11', category: 'Career Start Indicators', provenance: 'classical',
    name: '2nd lord <-> 11th lord connection',
    description: 'Connection between the 2nd and 11th lords supports income being realized/gained from the new role.',
    explanation: 'Confirms income realization specifically.',
    source: 'Classical Parashari house-lord relationship analysis (2nd-11th nexus).'
  },
  {
    id: 'CS-PAIR-9-10', category: 'Career Start Indicators', provenance: 'classical',
    name: '9th lord <-> 10th lord connection',
    description: 'Connection between the 9th and 10th lords supports a fortunate, well-qualified transition from education/training into a professional role.',
    explanation: 'Supports the education-to-career transition specifically.',
    source: 'Classical Parashari house-lord relationship analysis (9th-10th nexus).'
  },
  {
    id: 'CS-PAIR-5-9-10', category: 'Career Start Indicators', provenance: 'classical',
    name: '5th/9th connection with 10th',
    description: 'Connection of the 5th or 9th with the 10th supports career entry following and building on education/qualification.',
    explanation: 'Supports the spec\'s Step 4 education-to-career transition concept using existing house-lord connection logic.',
    source: 'Classical Parashari house-lord relationship analysis (5th/9th-10th nexus).'
  },
  {
    id: 'CS-BUSINESS-7-10-11', category: 'Employment vs. Business', provenance: 'classical',
    name: '7th <-> 10th/11th connection (business/self-employment)',
    description: 'A 7th-house/lord connection with the 10th/11th (alongside 2nd and Mercury/Jupiter) supports business/self-employment as the career-entry mode rather than salaried employment.',
    explanation: 'The 7th signifies partnership/trade/independent dealings classically; its connection to career houses, read alongside the absence/presence of strong 6th evidence, differentiates business from employment.',
    source: 'Classical Parashari house signification (7th = trade, partnership, independent dealings).'
  },
  {
    id: 'CS-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as the professional-entry confirmation chart',
    description: 'D10 Lagna/Lagna lord, D10 6th/10th/11th houses and lords, and D10 placement of Sun/Saturn/dasha lords confirm or qualify D1\'s career-start promise — never an independent substitute for D1.',
    explanation: 'D10 is the classical divisional chart for profession; it confirms D1 here exactly as in Promotion Timing and Job Change Timing.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, primary professional divisional chart).'
  },
  {
    id: 'CS-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to career-start houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/3rd/6th/9th/10th/11th houses activates career-start themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the career-start-specific houses — an activation/timing signal, not by itself a first-job prediction.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'CS-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 10th/6th/11th/9th/Moon',
    description: 'Jupiter transiting or aspecting these houses/natal Moon is read as an opportunity/growth confirmation for career-start timing — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never predict the first job; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'CS-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 6th/10th/11th/Sun/Moon',
    description: 'Saturn transiting or aspecting these houses is read as entry into structured employment, formalization, responsibility, or a delayed-but-stable career start — NOT automatically delay.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never defaulted to "delay" — its meaning is read from the surrounding natal/dasha evidence.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'CS-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Career-entry event classification from converging evidence',
    description: 'A candidate window is classified as First Salaried Employment, First Major Professional Appointment, Internship/Apprenticeship, Business/Self-Employment Start, or Family Business Entry based on exactly which houses/significators converge — never a default classification.',
    explanation: 'This application\'s own synthesis of which house/lord/Dasha/D10 combination corresponds to which real-world career-entry event (Step 17).',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord evidence it combines is classical.'
  },
  {
    id: 'CS-SEARCH-JOIN-001', category: 'Job Search vs. Joining', provenance: 'application',
    name: 'Search/Selection/Joining stage distinction',
    description: 'Within a career-start-relevant period, 3rd/Mercury-dominant activation (without strong 6th/10th/11th/D10 convergence) is read as a Search/Application stage, while 6th+10th+11th+D10 convergence is read as Selection/Joining.',
    explanation: 'This application\'s own synthesis distinguishing the search effort from the actual appointment, built from the same house evidence rather than a separate rule set (Step 18).',
    source: 'Application synthesis combining classical house significations (3rd=effort/search, 6th+10th+11th=appointment) into a staged reading.'
  },
  {
    id: 'CS-EDUCATION-001', category: 'Education Cross-Check', provenance: 'application',
    name: 'Education-to-career transition (no dedicated Education Timing/D24 engine exists yet)',
    description: 'This app currently has no Education Timing module or D24 (Siddhamsha) calculation to cross-check against. The 9th/5th-to-10th connections (CS-PAIR-9-10, CS-PAIR-5-9-10) are used as the available proxy for the education-to-career transition.',
    explanation: 'Per the spec\'s explicit instruction ("if education timing is not available, do not create a duplicate education engine"), this module does not fabricate an education-completion calculation — it documents the gap and uses only the house-lord connections already available.',
    source: 'Application synthesis — documents a deliberate scope limitation rather than inventing an unvalidated calculation.'
  }
];
