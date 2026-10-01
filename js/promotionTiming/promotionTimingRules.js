/* =========================================================
   PROMOTION TIMING — rule database (Parashari/Vimshottari method only;
   no KP sub-lords/significators/ruling-planets, no Western technique).
   Every rule the Promotion Timing engine can cite is declared here with
   its own id/category/explanation/source, distinguishing classical
   Parashari principles from this application's own synthesis — mirrors
   the pattern already established for Marriage Timing
   (js/marriageTiming/marriageTimingRules.js).
   ========================================================= */

window.PROMOTION_TIMING_RULES = [
  {
    id: 'PT-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house/lord — profession and professional standing',
    description: 'The 10th house and its lord govern karma/profession, designation, and public professional standing; their condition sets the baseline career-advancement promise.',
    explanation: 'The 10th is the central house for any career-timing question in Parashari astrology.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, status, action in the world).'
  },
  {
    id: 'PT-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — gains, advancement, fulfilment of ambition',
    description: 'The 11th house and its lord govern gains, income growth, and the fulfilment of the 10th house\'s ambitions — read as the house of actually realizing career gains.',
    explanation: 'Classically the house of labha (gain); a 10th promise without 11th support can remain unrealized ambition.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, realization of effort).'
  },
  {
    id: 'PT-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house/lord — income/salary distinct from designation',
    description: 'The 2nd house/lord govern accumulated wealth and salary specifically, which can move independently of designation (10th) — used to distinguish promotion-with-raise from promotion-without-raise and raise-without-promotion.',
    explanation: 'Reading 2nd alongside 10th/11th lets the engine separate a designation change from a compensation change rather than treating "career improvement" as one undifferentiated event.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: wealth, accumulated resources, family income).'
  },
  {
    id: 'PT-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house/lord — service, competition, workload',
    description: '6th house/lord govern service/employment (as opposed to business), competition, workplace struggle, and increased workload/responsibility — read alongside 10th for service-sector advancement, never alone as a promotion signal.',
    explanation: '6th-house activation alone (e.g. a Dasha of the 6th lord) is explicitly NOT treated as promotion — only as service/competition/workload, per the spec\'s own instruction; it must co-occur with 10th/11th evidence to contribute to a promotion classification.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: service, disease, competition, daily labor).'
  },
  {
    id: 'PT-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — authority, recognition, status, leadership',
    description: 'The Sun is read for organizational authority, recognition, visibility, and leadership standing, based on its actual dignity/placement/relationships — never assumed positive or negative by default.',
    explanation: 'The Sun is a natural significator of authority/status in Parashari astrology; its own condition (not a blanket assumption) determines whether it supports or strains career authority.',
    source: 'Classical Parashari karaka system (Sun = Atmakaraka of status/authority contexts; Pitri/Raja karaka associations).'
  },
  {
    id: 'PT-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — service, hierarchy, seniority, formal advancement',
    description: 'Saturn is read for service, hierarchy, seniority, and formal/organizational advancement through sustained effort, based on its actual dignity/placement/relationships — never assumed to mean delay by default.',
    explanation: 'Saturn classically governs structure, longevity in a role, and the slow, earned nature of formal advancement — it can indicate promotion/seniority as readily as obstruction, depending on its actual condition.',
    source: 'Classical Parashari significance of Saturn (karma, structure, longevity, formal hierarchy).'
  },
  {
    id: 'PT-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — growth and expansion (natal), transit confirmation',
    description: 'Jupiter is read natally as a growth/wisdom/expansion significator and, separately, as a transit confirming factor for career timing (Step 12) — never as the sole basis for a promotion classification.',
    explanation: 'Jupiter\'s primary role in this module is as a supporting/expansion confirmation at the transit layer, per the spec\'s explicit instruction; its natal placement is read only as general supporting context.',
    source: 'Classical Parashari karaka system (Jupiter = growth, wisdom, expansion); classical gochara (transit) methodology.'
  },
  {
    id: 'PT-PAIR-10-11', category: 'Promotion Signature', provenance: 'classical',
    name: '10th lord <-> 11th lord/house connection',
    description: 'Connection (conjunction, mutual aspect, sign exchange, or lord-in-house placement) between the 10th and 11th lords/houses is the single most central classical promotion-signature combination.',
    explanation: 'Profession (10th) connecting with gains/fulfilment (11th) is the textbook Parashari combination for career advancement actually being realized.',
    source: 'Classical Parashari house-lord relationship analysis (10th-11th nexus).'
  },
  {
    id: 'PT-PAIR-10-2', category: 'Promotion Signature', provenance: 'classical',
    name: '10th lord <-> 2nd lord connection',
    description: 'Connection between the 10th and 2nd lords supports career change accompanied by a change in income/salary specifically.',
    explanation: 'Used to help distinguish promotion-with-raise from promotion-without-raise (Step 3, 2nd house).',
    source: 'Classical Parashari house-lord relationship analysis (10th-2nd nexus).'
  },
  {
    id: 'PT-PAIR-10-6', category: 'Promotion Signature', provenance: 'classical',
    name: '10th/11th connection with 6th (service context)',
    description: 'A 10th/11th connection with the 6th house/lord, in a service (employed) context, supports advancement within service/hierarchy — read alongside 10th/11th, never as a standalone promotion signal.',
    explanation: 'The 6th by itself signifies service/competition/workload; only its co-occurrence with 10th/11th evidence is read as advancement-relevant.',
    source: 'Classical Parashari house signification combined per the spec\'s explicit combination rule.'
  },
  {
    id: 'PT-SUN-CAREER', category: 'Promotion Signature', provenance: 'classical',
    name: 'Sun connected with 10th/11th',
    description: 'The Sun conjunct, aspecting, or lord-exchanging with the 10th/11th houses or lords supports recognition/visibility/authority-linked advancement.',
    explanation: 'Direct application of the Sun\'s authority/recognition karaka role to the career houses.',
    source: 'Classical Parashari karaka-to-house connection analysis.'
  },
  {
    id: 'PT-SATURN-CAREER', category: 'Promotion Signature', provenance: 'classical',
    name: 'Saturn connected with 10th/6th/11th',
    description: 'Saturn conjunct, aspecting, or lord-exchanging with the 10th/6th/11th houses or lords supports formal, hierarchy-based advancement/seniority.',
    explanation: 'Direct application of Saturn\'s structure/hierarchy karaka role to the career houses.',
    source: 'Classical Parashari karaka-to-house connection analysis.'
  },
  {
    id: 'PT-YOGA-001', category: 'Promotion Signature', provenance: 'application',
    name: 'Career-relevant Raja Yoga (reused from existing Yogas engine)',
    description: 'Any existing-engine Raja Yoga whose planets include the 10th lord, 11th lord, or 2nd lord is surfaced here as career-relevant evidence.',
    explanation: 'This reuses the app\'s existing Yogas engine output (state.yogas) rather than re-deriving yoga rules — only the career-relevance filter is this module\'s own synthesis.',
    source: 'Application synthesis: filters this app\'s existing js/yogas/yogaRules.js output for career-house involvement.'
  },
  {
    id: 'PT-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as the professional confirmation chart',
    description: 'D10 Lagna/Lagna lord, D10 10th/11th house and lords, and D10 placement of Sun/Saturn/dasha lords are read as a confirming layer on D1\'s career promise — never as an independent substitute for D1.',
    explanation: 'D10 is the classical divisional chart for profession; it confirms or qualifies D1, exactly as D9 does for marriage in this app\'s Marriage Timing module.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, primary professional divisional chart).'
  },
  {
    id: 'PT-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to career houses',
    description: 'A dasha level whose lord owns, occupies, or is otherwise connected (conjunction/aspect) to the 10th/11th/2nd/6th houses activates career themes during that period.',
    explanation: 'Classical Vimshottari Dasha timing principle, applied here to the career-specific houses — this is a timing/activation signal, not by itself a promotion prediction.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'PT-DASHA-002', category: 'Dasha', provenance: 'classical',
    name: 'Dasha lord is Sun, Saturn, or a connected career-house lord',
    description: 'A period run by Sun, Saturn, the 10th lord, the 11th lord, or a planet in career-relevant Raja Yoga directly activates career promise, independent of transient house ownership.',
    explanation: 'The natural/functional career significator\'s own period is classically read as a strong activation window.',
    source: 'Classical Vimshottari Dasha theory, karaka activation principle.'
  },
  {
    id: 'PT-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 10th/11th/Sun/Moon',
    description: 'Jupiter transiting the natal 10th or 11th house, or aspecting their lords, or aspecting natal Sun/Moon, is read as a supporting/expansion confirmation for career timing — never as a standalone promotion trigger.',
    explanation: 'Per the spec\'s explicit instruction: a transit alone must never create a promotion prediction; Jupiter here only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology for career timing.'
  },
  {
    id: 'PT-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 10th/11th/Sun/Moon',
    description: 'Saturn transiting the natal 10th or 11th house, or aspecting their lords, or aspecting natal Sun/Moon, is read as a supporting factor for formal advancement/seniority/responsibility — NOT automatically as delay or obstruction.',
    explanation: 'Per the spec\'s explicit instruction: Saturn transits to career houses may indicate promotion, seniority, formal authority, responsibility, or organizational restructuring, depending on the broader evidence — this module does not default to a "Saturn = delay" reading.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth (not limited to "obstruction") per the spec.'
  },
  {
    id: 'PT-DELAY-001', category: 'Delay/Obstruction', provenance: 'application',
    name: 'Delay/obstruction context factors',
    description: 'When a dasha is career-relevant but the 8th/12th houses are prominent, the 10th/11th lord is afflicted, D10 is weak, or the 6th is excessively activated without 10th/11th support, the period is flagged as having mixed/uncertain manifestation rather than a clean promotion classification.',
    explanation: 'This is the module\'s own synthesis of classical affliction indicators into a single "manifestation may be weaker" flag — it never states that promotion is permanently denied, only that this specific period\'s manifestation is less certain.',
    source: 'Application synthesis combining classical affliction indicators (8th/12th prominence, lord affliction, weak D10, excess 6th) per the spec\'s Step 16.'
  },
  {
    id: 'PT-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Event classification from converging evidence',
    description: 'A candidate window is classified as Promotion/Designation Rise, Promotion + Financial Improvement, Responsibility Increase, Recognition/Visibility, or Job Change based on exactly which houses/significators converge — never a default "promotion" label.',
    explanation: 'This is this application\'s own synthesis of which combination of classical evidence corresponds to which real-world career event — the combinations themselves are documented per classification (see Step 15 of the spec), not claimed as a direct classical quotation.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord evidence it combines is classical; the mapping to named event types is this module\'s own.'
  }
];
