/* =========================================================
   RECOGNITION / AWARD TIMING — rule database (Parashari/Vimshottari
   method only; no KP sub-lords/significators/ruling-planets, no
   Western technique). Mirrors the pattern established for the
   thirteen prior timing modules.
   ========================================================= */

window.RECOGNITION_AWARD_TIMING_RULES = [
  {
    id: 'REC-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house/lord — profession, achievement, public role',
    description: 'The 10th house and its lord represent professional achievement, career reputation, status, public work, and visible accomplishments.',
    explanation: 'The 10th is a primary house for this module; its own condition is assessed before any timing or recognition classification.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, public standing, achievement).'
  },
  {
    id: 'REC-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — recognition, fulfilment, gains',
    description: 'The 11th house and its lord represent achievement realization, fulfilment, rewards, recognition from networks, and professional gains.',
    explanation: 'The 11th is the central realization house for this module; read alongside the 10th as the primary pair.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, fulfilment of desire, rewards).'
  },
  {
    id: 'REC-NATAL-005', category: 'Natal Promise', provenance: 'classical',
    name: '5th house — merit, creativity, achievement',
    description: 'The 5th house represents talent, creativity, intellectual achievement, distinction, and awards resulting from excellence.',
    explanation: 'A supporting merit-based house for recognition tied to talent/creativity, not a standalone recognition trigger.',
    source: 'Classical Parashari house signification (5th = Putra Bhava: creative intelligence, merit, distinction).'
  },
  {
    id: 'REC-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — honour, fortune, institutional recognition',
    description: 'The 9th house represents honours, blessings, recognition from senior authorities, institutional respect, and prestigious recognition.',
    explanation: 'A supporting house for institutional/senior-authority recognition, read alongside the 10th/11th.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, honour, higher respect).'
  },
  {
    id: 'REC-NATAL-001', category: 'Natal Promise', provenance: 'classical',
    name: '1st house — personal visibility, reputation, identity',
    description: 'The 1st house represents personal visibility, reputation, identity, and recognition attached to the individual.',
    explanation: 'Read as the personal-visibility dimension of recognition, not a standalone recognition house.',
    source: 'Classical Parashari house signification (1st = Lagna: identity, personal visibility).'
  },
  {
    id: 'REC-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house — speech, public expression, reputation',
    description: 'The 2nd house represents speech, public expression, reputation, and accumulated status/resources.',
    explanation: 'A supporting house for the reputation/speech dimension of recognition.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: speech, accumulated resources/status).'
  },
  {
    id: 'REC-NATAL-003', category: 'Natal Promise', provenance: 'classical',
    name: '3rd house — communication, writing, media, publications',
    description: 'The 3rd house represents communication, writing, media, publications, and self-effort.',
    explanation: 'A supporting house for media/publication-related recognition contexts.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, communication, writing).'
  },
  {
    id: 'REC-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house — competitive achievement, service (used carefully)',
    description: '6th house, when connected with recognition houses, represents competitive achievement, service, defeating competition, and organizational contribution.',
    explanation: 'A supporting house for achievement-through-competition, never automatically negative.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: competition, service, daily effort).'
  },
  {
    id: 'REC-NATAL-007', category: 'Natal Promise', provenance: 'classical',
    name: '7th house — public interaction, audience, clients',
    description: 'The 7th house represents public interaction, audience, clients, and public-facing recognition.',
    explanation: 'A supporting house for public-facing/audience-based recognition.',
    source: 'Classical Parashari house signification (7th = Yuvati Bhava: public interaction, partnership).'
  },
  {
    id: 'REC-NATAL-004', category: 'Natal Promise', provenance: 'classical',
    name: '4th house — public/community respect, institutional foundation',
    description: 'The 4th house represents public/community respect, institutional foundation, and local recognition.',
    explanation: 'A supporting house for community/local recognition.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: foundation, local/community standing).'
  },
  {
    id: 'REC-NATAL-012', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — behind-the-scenes, foreign/institutional recognition (used contextually)',
    description: '12th house, when connected with recognition houses, represents behind-the-scenes achievement, foreign/institutional recognition, and recognition associated with distant organizations — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction: the 12th must not automatically be treated as negative.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: foreign/distant context, behind-the-scenes activity).'
  },
  {
    id: 'REC-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — authority, status, recognition, leadership',
    description: 'The Sun is the primary significator for authority, status, recognition, leadership, and institutional honour.',
    explanation: 'Classical primary karaka for recognition; its actual dignity/placement/relationships determine its contribution — a single significator is never sufficient for an award.',
    source: 'Classical Parashari karaka system (Sun = authority, status, recognition).'
  },
  {
    id: 'REC-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — honour, wisdom, respect, institutional recognition',
    description: 'Jupiter is a primary/supporting significator for honour, wisdom, respect, awards, and institutional recognition.',
    explanation: 'A primary/supporting significator read from its actual chart condition.',
    source: 'Classical Parashari karaka system (Jupiter = honour, wisdom, respect).'
  },
  {
    id: 'REC-NATAL-VENUS', category: 'Natal Promise', provenance: 'classical',
    name: 'Venus — popularity, appreciation, public admiration',
    description: 'Venus supports popularity, appreciation, arts, and public admiration.',
    explanation: 'A supporting significator for the popularity/admiration dimension of recognition.',
    source: 'Classical Parashari significance of Venus (popularity, appreciation, arts).'
  },
  {
    id: 'REC-NATAL-MERCURY', category: 'Natal Promise', provenance: 'classical',
    name: 'Mercury — communication, writing, intellectual recognition',
    description: 'Mercury supports communication, writing, intellectual recognition, and professional skill.',
    explanation: 'A supporting significator for communication/skill-based recognition.',
    source: 'Classical Parashari karaka system (Mercury = communication, intellect, skill).'
  },
  {
    id: 'REC-NATAL-MOON', category: 'Natal Promise', provenance: 'classical',
    name: 'Moon — public visibility, popularity, public response',
    description: 'The Moon supports public visibility, popularity, and public response.',
    explanation: 'A supporting significator for public-response-based recognition.',
    source: 'Classical Parashari significance of the Moon (public mind, popularity, response).'
  },
  {
    id: 'REC-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — long-service recognition, institutional recognition',
    description: 'Saturn supports long-service recognition, institutional recognition, and achievement after sustained work.',
    explanation: 'Never automatically interpreted as negative; its actual condition determines its contribution to a long-service/sustained-effort recognition.',
    source: 'Classical Parashari significance of Saturn (sustained effort, longevity, structure).'
  },
  {
    id: 'REC-PROF-10-11', category: 'Professional Recognition Signature', provenance: 'classical',
    name: '10th <-> 11th connection',
    description: 'Connection of the 10th and 11th houses supports professional achievement, recognition, and realization of career-related gains.',
    explanation: 'Must be evaluated with natal promise, dasha, D10, and transit confirmation. No single combination is a guarantee of an award.',
    source: 'Classical Parashari house-lord relationship analysis (10th-11th nexus).'
  },
  {
    id: 'REC-PROF-10-9', category: 'Professional Recognition Signature', provenance: 'classical',
    name: '10th <-> 9th connection',
    description: 'Connection of the 10th and 9th houses supports professional recognition with institutional/senior-authority backing.',
    explanation: 'Combines professional achievement with institutional honour.',
    source: 'Classical Parashari house-lord relationship analysis (10th-9th nexus).'
  },
  {
    id: 'REC-PROF-5-10', category: 'Professional Recognition Signature', provenance: 'classical',
    name: '5th <-> 10th connection',
    description: 'Connection of the 5th and 10th houses supports professional recognition rooted in merit/creativity.',
    explanation: 'Combines merit/creative distinction with professional achievement.',
    source: 'Classical Parashari house-lord relationship analysis (5th-10th nexus).'
  },
  {
    id: 'REC-PROF-5-11', category: 'Professional Recognition Signature', provenance: 'classical',
    name: '5th <-> 11th connection',
    description: 'Connection of the 5th and 11th houses supports recognition of merit/creativity realized as a fulfilled gain.',
    explanation: 'Combines merit/creative distinction with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (5th-11th nexus).'
  },
  {
    id: 'REC-PROF-9-11', category: 'Professional Recognition Signature', provenance: 'classical',
    name: '9th <-> 11th connection',
    description: 'Connection of the 9th and 11th houses supports institutional honour realized as a fulfilled recognition.',
    explanation: 'Combines institutional honour with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (9th-11th nexus).'
  },
  {
    id: 'REC-AWARD-9-10', category: 'Award / Honour Signature', provenance: 'classical',
    name: '9th <-> 10th, 9th <-> 11th, 5th-9th-10th, 5th-10th-11th convergence',
    description: 'These connections and convergences support a formal award or honour specifically, distinct from general professional recognition.',
    explanation: 'The additional 9th-house (honour) or triple convergence distinguishes a formal award from ordinary professional acknowledgement.',
    source: 'Classical Parashari house-combination analysis (9th-10th/11th and 5th-9th-10th/11th nexus).'
  },
  {
    id: 'REC-PUBLIC-1-10', category: 'Public Recognition Signature', provenance: 'classical',
    name: '1st<->10th, 1st<->11th, 7th<->10th, 7th<->11th, 3rd<->10th (media)',
    description: 'These connections support public recognition specifically — personal visibility (1st), public interaction (7th), or media/publication (3rd) combined with the professional/realization houses.',
    explanation: 'Distinguishes public-facing recognition from institutional or purely professional recognition.',
    source: 'Classical Parashari house-combination analysis (1st/7th/3rd with 10th/11th nexus).'
  },
  {
    id: 'REC-ACHIEVEMENT-5-10-11', category: 'Achievement Recognition Signature', provenance: 'classical',
    name: '5th-10th-11th and 6th-10th-11th convergence',
    description: 'Convergence of the 5th/6th, 10th, and 11th houses supports recognition for a major achievement, project, or distinguished contribution.',
    explanation: 'The 6th variant specifically reflects achievement realized through competitive/organizational effort.',
    source: 'Classical Parashari house-combination analysis (5th/6th-10th-11th nexus).'
  },
  {
    id: 'REC-INSTITUTIONAL-9-10', category: 'Institutional / Senior Recognition Signature', provenance: 'classical',
    name: '9th<->10th, 9th<->11th with Sun/Jupiter context',
    description: 'These connections, with Sun/Jupiter contextually relevant, support institutional or senior-authority recognition.',
    explanation: 'The Sun/Jupiter context distinguishes institutional/senior recognition from peer or public recognition.',
    source: 'Classical Parashari house-combination analysis (9th-10th/11th nexus with Sun/Jupiter karakas).'
  },
  {
    id: 'REC-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as the principal professional-recognition confirmation chart',
    description: 'D10 ascendant, 10th/11th/9th/5th houses, relevant lords, and Sun/Jupiter confirm or qualify D1\'s recognition promise for the professional dimension — D10 confirms, it never replaces D1.',
    explanation: 'D10 is reused directly via this app\'s existing divisional-chart engine (vargaPosition) — no second D10 implementation was created.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, principal professional divisional chart).'
  },
  {
    id: 'REC-D24-CROSSCHECK-001', category: 'Academic Recognition Cross-Check', provenance: 'classical',
    name: 'D24/Higher Education Timing cross-check for academic recognition',
    description: 'For academic or educational recognition, the existing Higher Education / Degree Timing module (and its D24 confirmation) is read directly rather than duplicated — Professional Recognition and Academic Recognition are displayed separately when both are possible.',
    explanation: 'Per the spec\'s explicit Section 15 instruction: D24 calculations are never duplicated here; window.HigherEducationTiming\'s own output is read directly.',
    source: 'Classical Parashari Varga theory (D24 = Chaturvimshamsha) — used here only as a cross-reference via the existing module, not duplicated.'
  },
  {
    id: 'REC-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to recognition houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 1st/2nd/3rd/5th/6th/7th/9th/10th/11th houses activates recognition themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the recognition-specific houses — an activation/timing signal, not by itself a guaranteed award.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'REC-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 5th/9th/10th/11th',
    description: 'Jupiter transiting or aspecting these houses, or the natal recognition lords/Sun, is read as a supporting confirmation for recognition timing — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never generate a recognition prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'REC-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 9th/10th/11th',
    description: 'Saturn transiting or aspecting these houses may correspond to recognition for sustained work, long-service achievement, or institutional acknowledgement — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never automatically classified as negative here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'REC-TRANSIT-SUN', category: 'Transit', provenance: 'classical',
    name: 'Sun transit (secondary) — authority, status, public acknowledgement',
    description: 'Sun transit is used as a secondary timing factor for authority, status, and public acknowledgement.',
    explanation: 'Secondary supporting evidence only, never a standalone trigger.',
    source: 'Classical Parashari gochara methodology, secondary transit extension.'
  },
  {
    id: 'REC-TRANSIT-VENUS-MERCURY-MOON', category: 'Transit', provenance: 'classical',
    name: 'Venus/Mercury/Moon transit (secondary) — popularity, communication, creative recognition',
    description: 'Venus/Mercury/Moon transit is used where relevant to popularity, communication, creative recognition, and public visibility.',
    explanation: 'Secondary supporting evidence only, used contextually depending on the recognition type being evaluated.',
    source: 'Classical Parashari gochara methodology, secondary transit extension.'
  },
  {
    id: 'REC-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary)',
    description: 'Rahu/Ketu transit to the recognition houses is used only as a secondary modifier — never alone sufficient to determine an award.',
    explanation: 'Per the spec\'s explicit instruction: nodes alone must never determine an award.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'REC-TYPE-001', category: 'Recognition Type Classification', provenance: 'application',
    name: 'Broad recognition-theme classification from converging evidence',
    description: 'Where the chart supports it, recognition is classified broadly (Professional, Organizational, Industry, Academic, Public, Institutional, Community/Social, Long-Service, Lifetime Achievement, Post-Retirement) based on which houses/karakas converge — a specific award title or organization is never predicted without external factual information.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which broad recognition theme. The underlying evidence is classical; the mapping to named categories is this module\'s own.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'REC-STAGE-001', category: 'Recognition Stage', provenance: 'application',
    name: 'Recognition stage distinction (Achievement -> Nomination/Consideration -> Award/Honour -> Public Announcement -> Post-Award Recognition)',
    description: 'Each candidate window is additionally tagged with the most consistent recognition stage, distinguishing the five named stages.',
    explanation: 'Per the spec\'s explicit Section 18 instruction, the primary event is formal recognition/award, with surrounding stages shown where supported.',
    source: 'Application synthesis mapping classical house-activation strength/convergence to a staged recognition-lifecycle model — not a named classical technique.'
  },
  {
    id: 'REC-VS-PROMOTION-001', category: 'Recognition vs. Promotion Distinction', provenance: 'application',
    name: 'Recognition vs. Promotion — always shown separately',
    description: 'Recognition (acknowledgement of achievement/contribution/reputation) is never collapsed with Promotion (change in formal position/status). When a candidate window overlaps one already identified by the existing Promotion Timing module, both are shown as separate indications: Career Advancement and Recognition/Honour.',
    explanation: 'Per the spec\'s explicit Section 4/19 instruction: this distinction is essential; Promotion Timing output is read directly, never reused as recognition timing.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'REC-VS-FINANCIAL-001', category: 'Recognition vs. Financial Gain Distinction', provenance: 'application',
    name: 'Recognition vs. Financial Gain — cross-checked only when evidence supports it',
    description: 'Recognition (award, acknowledgement, visibility, honour, reputation) is distinguished from Financial Gain (bonus, salary increase, profit, financial receipt). The existing Financial Gain/Wealth Timing module is cross-checked only when an overlapping window exists — an award is never assumed to produce financial gain.',
    explanation: 'Per the spec\'s explicit Section 5/20 instruction: do not automatically infer money from recognition. Reads window.FinancialGainTiming\'s own output directly rather than re-deriving any financial rule.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'REC-RETIREMENT-CROSSCHECK-001', category: 'Post-Retirement Recognition Cross-Check', provenance: 'application',
    name: 'Retirement Timing cross-check for post-retirement/lifetime-achievement recognition',
    description: 'When a candidate window overlaps one already identified by the existing Retirement Timing module, the recognition is additionally considered for a Post-Retirement Recognition / Lifetime Achievement classification.',
    explanation: 'Reads window.RetirementTiming\'s own output directly rather than re-deriving any retirement-timing rule.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'REC-STRENGTH-001', category: 'Window Strength', provenance: 'application',
    name: 'Window strength (non-numeric)',
    description: 'Candidate window strength is expressed as one of five descriptive categories (Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional) — never a numeric score, star rating, ranking, or "best award period" claim.',
    explanation: 'Per the spec\'s explicit Section 21 instruction: no numerical scores, no star ratings, no rankings, no "best award period".',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  }
];
