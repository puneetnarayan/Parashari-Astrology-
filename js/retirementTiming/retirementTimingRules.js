/* =========================================================
   RETIREMENT TIMING — rule database (Parashari/Vimshottari method
   only; no KP sub-lords/significators/ruling-planets, no Western
   technique). Mirrors the pattern established for the twelve prior
   timing modules. This module is strictly an event-timing module for
   career transitions — it never predicts health, lifespan, or death.
   ========================================================= */

window.RETIREMENT_TIMING_RULES = [
  {
    id: 'RET-NATAL-010', category: 'Natal Career Structure', provenance: 'classical',
    name: '10th house/lord — career, profession, work',
    description: 'The 10th house and its lord represent profession, career, work, public responsibilities, and professional status.',
    explanation: 'Retirement timing must be interpreted through changes in the 10th-house career structure; the 10th is assessed before any transition classification.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, public standing).'
  },
  {
    id: 'RET-NATAL-006', category: 'Natal Career Structure', provenance: 'classical',
    name: '6th house/lord — service, salaried employment',
    description: 'The 6th house and its lord represent salaried employment, service, organizational duties, and daily work.',
    explanation: 'Retirement from service may involve changes in 6th-house activation; read alongside the 10th, never standalone.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: service, daily duty).'
  },
  {
    id: 'RET-NATAL-012', category: 'Natal Career Structure', provenance: 'classical',
    name: '12th house — withdrawal, exit, separation (used carefully)',
    description: '12th house, when connected with career houses, represents leaving a role, withdrawal, separation from the professional environment, and reduction of active involvement — never automatically interpreted as retirement.',
    explanation: 'Per the spec\'s explicit instruction: the 12th must not automatically be interpreted as retirement; it is a supporting withdrawal/exit house only.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: withdrawal, separation, reduction).'
  },
  {
    id: 'RET-NATAL-004', category: 'Natal Career Structure', provenance: 'classical',
    name: '4th house — home, post-career residence',
    description: 'The 4th house represents return home, domestic life, retirement residence, and post-career comfort.',
    explanation: 'Read as the residence/domestic dimension of a career transition, not a standalone retirement house.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: home, domestic comfort).'
  },
  {
    id: 'RET-NATAL-011', category: 'Natal Career Structure', provenance: 'classical',
    name: '11th house — fulfilment, completion of a career phase',
    description: 'The 11th house represents fulfilment of career objectives, realization of professional gains, and completion of a long-term professional phase.',
    explanation: 'Read as the realization/completion house for a career-structure promise, not a standalone transition trigger.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, fulfilment of desire).'
  },
  {
    id: 'RET-NATAL-002', category: 'Natal Career Structure', provenance: 'classical',
    name: '2nd house — accumulated resources, financial security',
    description: 'The 2nd house represents accumulated resources, family financial base, and financial security after retirement.',
    explanation: 'Read as the resource/security dimension underlying a retirement transition.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: accumulated wealth, resources).'
  },
  {
    id: 'RET-NATAL-008', category: 'Natal Career Structure', provenance: 'classical',
    name: '8th house — major transition, restructuring (used carefully)',
    description: '8th house, when connected with career houses, represents major life transition, transformation, restructuring, and retirement-linked financial restructuring — never a guaranteed negative event.',
    explanation: 'Per the spec\'s explicit instruction: the 8th is used carefully and never interpreted as a guaranteed negative event.',
    source: 'Classical Parashari house signification (8th = Ayu/Randhra Bhava: transformation, restructuring).'
  },
  {
    id: 'RET-NATAL-009', category: 'Natal Career Structure', provenance: 'classical',
    name: '9th house — post-career philosophy, higher pursuits',
    description: 'The 9th house represents post-career philosophy, higher learning, travel, retirement exploration, and spiritual/knowledge pursuits.',
    explanation: 'Read as a supporting post-career-direction house.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: higher learning, philosophy, long journeys).'
  },
  {
    id: 'RET-NATAL-005', category: 'Natal Career Structure', provenance: 'classical',
    name: '5th house — creative pursuits, teaching, hobbies',
    description: 'The 5th house represents creative pursuits, hobbies, teaching, and independent intellectual work after retirement.',
    explanation: 'Read as a supporting house for post-retirement creative/teaching activity.',
    source: 'Classical Parashari house signification (5th = Putra Bhava: creative intelligence, teaching).'
  },
  {
    id: 'RET-NATAL-003', category: 'Natal Career Structure', provenance: 'classical',
    name: '3rd house — independent activity, writing, consulting',
    description: 'The 3rd house represents independent activity, writing, consulting, and self-driven post-retirement projects.',
    explanation: 'Read as a supporting house for self-initiated post-career activity, not a standalone retirement house.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, self-initiated activity).'
  },
  {
    id: 'RET-NATAL-SATURN', category: 'Natal Career Structure', provenance: 'classical',
    name: 'Saturn — career duration, duty, long-term work',
    description: 'Saturn is the primary career-duration/duty/long-term-work significator: long service, sustained responsibilities, institutional career, and structured retirement.',
    explanation: 'Per the spec\'s explicit instruction: Saturn is never automatically equated with retirement; its actual condition determines its contribution.',
    source: 'Classical Parashari significance of Saturn (duration, duty, structure, longevity).'
  },
  {
    id: 'RET-NATAL-SUN', category: 'Natal Career Structure', provenance: 'classical',
    name: 'Sun — authority, status, institutional position',
    description: 'The Sun represents authority, status, leadership, institutional position, and government/service context.',
    explanation: 'A supporting significator for institutional standing relevant to a formal career exit.',
    source: 'Classical Parashari significance of the Sun (authority, institutional standing).'
  },
  {
    id: 'RET-NATAL-MERCURY', category: 'Natal Career Structure', provenance: 'classical',
    name: 'Mercury — consultancy, advisory, independent intellectual work',
    description: 'Mercury supports professional activity, consultancy, advisory work, and independent intellectual work.',
    explanation: 'A supporting significator for the consultancy/advisory dimension of a post-employment transition.',
    source: 'Classical Parashari karaka system (Mercury = intellect, advisory communication).'
  },
  {
    id: 'RET-NATAL-JUPITER', category: 'Natal Career Structure', provenance: 'classical',
    name: 'Jupiter — teaching, knowledge, post-retirement learning',
    description: 'Jupiter supports knowledge, teaching, advisory work, and post-retirement learning.',
    explanation: 'A supporting significator for teaching/advisory post-career activity.',
    source: 'Classical Parashari karaka system (Jupiter = wisdom, teaching, advisory role).'
  },
  {
    id: 'RET-NATAL-VENUS', category: 'Natal Career Structure', provenance: 'classical',
    name: 'Venus — comfort, leisure, lifestyle transition',
    description: 'Venus supports comfort, leisure, and lifestyle transition.',
    explanation: 'A supporting significator for the comfort/lifestyle dimension of retirement.',
    source: 'Classical Parashari significance of Venus (comfort, leisure, lifestyle).'
  },
  {
    id: 'RET-NATAL-MOON', category: 'Natal Career Structure', provenance: 'classical',
    name: 'Moon — domestic transition, routine change',
    description: 'The Moon supports domestic transition, change in routine, and emotional shift toward home.',
    explanation: 'A supporting significator for the domestic/emotional dimension of career exit.',
    source: 'Classical Parashari significance of the Moon (mind, routine, domestic orientation).'
  },
  {
    id: 'RET-10-12', category: 'Career Completion / Exit Signature', provenance: 'classical',
    name: '10th <-> 12th connection',
    description: 'Connection of career/service houses with the 12th house can support professional withdrawal or career transition.',
    explanation: 'Must be evaluated with natal career structure, dasha, D10, and transit confirmation — never in isolation.',
    source: 'Classical Parashari house-lord relationship analysis (10th-12th nexus).'
  },
  {
    id: 'RET-6-12', category: 'Career Completion / Exit Signature', provenance: 'classical',
    name: '6th <-> 12th connection',
    description: 'Connection of the service house (6th) with the 12th house can support withdrawal from service/employment.',
    explanation: 'Combines the service house with the withdrawal house; read alongside natal promise, never in isolation.',
    source: 'Classical Parashari house-lord relationship analysis (6th-12th nexus).'
  },
  {
    id: 'RET-10-8', category: 'Career Completion / Exit Signature', provenance: 'classical',
    name: '10th <-> 8th connection',
    description: 'Connection of the career house (10th) with the 8th house can support career restructuring or transformation.',
    explanation: 'The 8th is used carefully here, never as a guaranteed negative event.',
    source: 'Classical Parashari house-lord relationship analysis (10th-8th nexus).'
  },
  {
    id: 'RET-10-4', category: 'Career Completion / Exit Signature', provenance: 'classical',
    name: '10th <-> 4th connection',
    description: 'Connection of the career house (10th) with the 4th house can support a return home / post-career residence transition.',
    explanation: 'Combines career exit with the domestic/residence house.',
    source: 'Classical Parashari house-lord relationship analysis (10th-4th nexus).'
  },
  {
    id: 'RET-10-11-COMPLETION', category: 'Career Completion / Exit Signature', provenance: 'classical',
    name: '10th <-> 11th connection with completion context',
    description: 'Connection of the career house (10th) with the fulfilment house (11th) can support completion of a long-term professional phase.',
    explanation: 'Read specifically as completion/fulfilment, distinct from a career withdrawal driven by the 12th or 8th.',
    source: 'Classical Parashari house-lord relationship analysis (10th-11th nexus for completion).'
  },
  {
    id: 'RET-BUSINESS-10-7', category: 'Employment to Business Signature', provenance: 'classical',
    name: '10th<->7th, 10th<->11th, 3rd<->7th, 3rd<->10th connections',
    description: 'These connections, together with the business combinations from the Business Start Timing module, support a transition from employment into business.',
    explanation: 'Reads window.BusinessStartTiming\'s own output directly for the business-combination dimension, rather than re-deriving business rules here.',
    source: 'Classical Parashari house-combination analysis (10th-7th/11th, 3rd-7th/10th nexus for employment-to-business transition).'
  },
  {
    id: 'RET-CONSULTANCY-001', category: 'Employment to Consultancy Signature', provenance: 'classical',
    name: '10th/3rd/5th/7th/11th with Mercury/Jupiter/Venus',
    description: 'These houses, together with Mercury/Jupiter/Venus depending on professional context, support a transition from employment into consultancy or independent professional practice.',
    explanation: 'Distinguishes independent-practice transition from both full retirement and a business-formation transition.',
    source: 'Classical Parashari house-combination analysis (10th-3rd-5th-7th-11th nexus with relevant karakas).'
  },
  {
    id: 'RET-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as the principal professional-transition confirmation chart',
    description: 'D10 ascendant, 10th/6th/12th houses, relevant lords, and Saturn/Sun/Mercury/Jupiter confirm or qualify D1\'s career-transition indication — D10 confirms the transition, it never replaces D1.',
    explanation: 'D10 is reused directly via this app\'s existing divisional-chart engine (vargaPosition) — no second D10 implementation was created.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, principal professional divisional chart).'
  },
  {
    id: 'RET-D4-RELOCATION-CROSSCHECK-001', category: 'Residence Transition Cross-Check (Optional)', provenance: 'classical',
    name: 'D4/Relocation module cross-check for retirement-linked residence change',
    description: 'When a candidate window shows a 4th/12th/9th residence-transition theme, the existing Relocation module is referenced separately — career transition and residence transition are shown as two distinct indications, never merged.',
    explanation: 'Per the spec\'s explicit Section 15 instruction: career transition and residence transition are displayed separately, and relocation calculations are never duplicated.',
    source: 'Classical Parashari Varga theory (D4 = Chaturthamsha, property/residence divisional chart) — used here only as a descriptive cross-reference, not duplicated.'
  },
  {
    id: 'RET-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to career/withdrawal houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/3rd/4th/5th/6th/7th/8th/9th/10th/11th/12th houses activates career-transition themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the career/withdrawal-specific houses — an activation/timing signal, not by itself a guaranteed retirement event.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'RET-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 10th/6th/12th/4th',
    description: 'Saturn transiting or aspecting these houses may correspond to completion, restructuring, formal responsibility changes, or a long-term career transition — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction: Saturn is never automatically classified as negative; it is given primary attention as the career-duration significator.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'RET-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 10th/11th/4th/9th/12th',
    description: 'Jupiter transiting or aspecting these houses may support transition into teaching/advisory work, post-career opportunities, fulfilment, or a new life direction — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never generate a retirement prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'RET-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary)',
    description: 'Rahu/Ketu transit to the career/withdrawal houses is used only as a secondary modifier for sudden career changes, unconventional post-career direction, or detachment/change — never alone sufficient to determine retirement.',
    explanation: 'Per the spec\'s explicit instruction: nodes alone must never determine retirement timing.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'RET-STRUCTURE-001', category: 'Natal Career Structure Classification', provenance: 'application',
    name: 'Employment / Business / Independent-Professional / Long-Institutional-Career tendency',
    description: 'The chart is scored independently for employment/service orientation, business orientation, independent-professional orientation, and long institutional-career tendency, presented as a chart indication, never a deterministic statement or an actual retirement-age prediction.',
    explanation: 'Per the spec\'s explicit Section 10 instruction and example language — this module never predicts the user\'s actual retirement age, only describes the chart\'s career-structure tendencies.',
    source: 'Application synthesis combining classical house/karaka groupings into comparative career-structure tendencies — not a named classical technique.'
  },
  {
    id: 'RET-EXTERNAL-CONTEXT-001', category: 'External Retirement Context', provenance: 'application',
    name: 'Expected/statutory retirement age or date as contextual information only',
    description: 'An optional user-supplied expected/statutory retirement age or date is used only as contextual information to compare against astrologically supportive career-transition periods — never as an astrological conclusion, and no employer/country retirement rules are invented.',
    explanation: 'Per the spec\'s explicit Section 11/12 instruction: astrology is never forced to produce an exact retirement age; the two are compared and shown separately ("astrological timing overlaps the expected retirement period," etc.).',
    source: 'Application policy (not a classical technique) — a transparent comparison mechanism between external, user-supplied context and astrological timing.'
  },
  {
    id: 'RET-VS-JOBCHANGE-001', category: 'Retirement vs. Job Change Distinction', provenance: 'application',
    name: 'Retirement vs. Job Change vs. Career Transition distinction',
    description: 'A period is distinguished as Job Change (professionally active, changes employer/role), Retirement (exits regular employment/service or substantially reduces formal professional activity), or Career Transition (leaves employment but starts business/consultancy/independent practice) — not every 10th/12th-house activation is classified as retirement.',
    explanation: 'Per the spec\'s explicit Section 4 instruction: this distinction is essential, and reads window.JobChangeTiming\'s own output directly (the same cross-module read pattern already used across prior modules) rather than re-deriving job-change rules.',
    source: 'Application synthesis combining classical house evidence with an independently-computed module output — not a named classical technique.'
  },
  {
    id: 'RET-FINANCIAL-CROSSCHECK-001', category: 'Financial Transition Cross-Check', provenance: 'application',
    name: 'Financial Gain/Wealth Timing cross-check (optional)',
    description: 'When a candidate window overlaps one already identified by the existing Financial Gain/Wealth Timing module, Career Exit and Financial Transition are shown as two separate indications — retirement is never equated with financial loss, and no investment advice is given.',
    explanation: 'Per the spec\'s explicit Section 16 instruction. Reads window.FinancialGainTiming\'s own output directly rather than re-deriving any financial rule.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'RET-BUSINESS-CROSSCHECK-001', category: 'Business/Independent-Work Cross-Check', provenance: 'application',
    name: 'Business Start Timing cross-check (optional)',
    description: 'When a candidate window overlaps one already identified by the existing Business Start Timing module, the period is additionally described as more consistent with a transition from employment into independent professional activity than complete cessation of work, based on chart evidence.',
    explanation: 'Reads window.BusinessStartTiming\'s own output directly rather than re-deriving any business-formation rule.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'RET-EVENT-001', category: 'Retirement Event Classification', provenance: 'application',
    name: 'Retirement-event classification from converging evidence',
    description: 'A candidate window is classified into one or more of the named retirement-transition types (Career Winding-Down, Planned Retirement, Superannuation, Voluntary Retirement, Early Retirement, Employment to Consultancy, Employment to Independent Practice, Employment to Business, Retirement + Relocation, Post-Retirement Activity) based on exactly which houses/significators/cross-checks converge; ambiguous evidence is classified as "Career Transition / Mixed" rather than a forced specific label.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which retirement-transition type. The underlying evidence is classical; the mapping to these named types is this module\'s own. This module never infers the motivation for a transition (e.g. why someone would retire voluntarily or early).',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'RET-NOHEALTH-001', category: 'Health/Death Exclusion', provenance: 'application',
    name: 'No health, lifespan, or death predictions',
    description: 'This module never predicts death, infers lifespan, predicts health decline, claims retirement is caused by illness, or infers medical reasons for a career withdrawal — career withdrawal is described only as a professional transition.',
    explanation: 'Per the spec\'s explicit Section 21 instruction: this is a career-timing module only, never a health/lifespan/death prediction tool.',
    source: 'Application policy (not a classical technique) — an explicit scope boundary for this module.'
  },
  {
    id: 'RET-STRENGTH-001', category: 'Window Strength', provenance: 'application',
    name: 'Window strength (non-numeric)',
    description: 'Candidate window strength is expressed as one of five descriptive categories (Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional) — never a numeric score, star rating, ranking, or exact guaranteed retirement age.',
    explanation: 'Per the spec\'s explicit Section 22 instruction: no numerical scores, no star ratings, no rankings, and no exact guaranteed retirement age.',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  }
];
