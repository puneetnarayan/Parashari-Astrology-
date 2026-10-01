/* =========================================================
   MAJOR CAREER TURNING POINT TIMING — rule database (Parashari/
   Vimshottari method only; no KP sub-lords/significators/ruling-
   planets, no Western technique). Mirrors the pattern established
   for the fourteen prior timing modules. This module is a broader
   synthesis layer above Job Change/Promotion/Business Start/
   Retirement Timing — it never duplicates their calculations, only
   cross-references their own output.
   ========================================================= */

window.CAREER_TURNING_POINT_TIMING_RULES = [
  {
    id: 'CT-10H-001', category: 'Natal Promise', provenance: 'classical',
    name: '10th house/lord — career, profession, authority, direction',
    description: 'The 10th house and its lord are the primary classical significator of career, profession, status, authority, and professional direction.',
    explanation: 'The 10th is the central house for this module; its own condition is assessed before any timing or classification.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, authority, direction).'
  },
  {
    id: 'CT-6H-001', category: 'Natal Promise', provenance: 'classical',
    name: '6th house — employment, service, workplace structure',
    description: 'The 6th house represents job, service, workplace duties, competition, and employment structure.',
    explanation: 'Read alongside the 10th for employment/service-structure transitions, never standalone.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: service, competition, daily duty).'
  },
  {
    id: 'CT-7H-001', category: 'Natal Promise', provenance: 'classical',
    name: '7th house — business, public dealings, independent activity',
    description: 'The 7th house represents independent activity, partnerships, commercial interaction, and public-facing professional activity.',
    explanation: 'Read alongside the 10th for business/independent-practice transitions.',
    source: 'Classical Parashari house signification (7th = Yuvati Bhava: partnership, public dealing, trade).'
  },
  {
    id: 'CT-11H-001', category: 'Natal Promise', provenance: 'classical',
    name: '11th house — gains, achievement, fulfilment, network',
    description: 'The 11th house represents gains, achievement, fulfilment, professional network, and realization of career objectives.',
    explanation: 'Read as the realization/fulfilment house for a career-structure promise.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, fulfilment, realization).'
  },
  {
    id: 'CT-9H-001', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — fortune, major directional change, foreign influence',
    description: 'The 9th house represents fortune, major directional changes, higher professional guidance, long-distance/foreign professional influence, and change in professional philosophy.',
    explanation: 'A primary house for major career-direction change, distinct from ordinary job change.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, direction, higher guidance).'
  },
  {
    id: 'CT-12H-001', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — exit, withdrawal, separation, foreign environment (used carefully)',
    description: '12th house, when connected with career houses, represents exit, withdrawal, separation, foreign environment, and closure of a career phase — never automatically negative.',
    explanation: 'Used carefully and contextually, per the spec\'s architectural pattern established across prior modules.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: exit, closure, foreign context).'
  },
  {
    id: 'CT-3H-001', category: 'Natal Promise', provenance: 'classical',
    name: '3rd house — initiative, effort, self-driven professional change',
    description: 'The 3rd house represents initiative, effort, courage, change through personal action, and new professional initiative.',
    explanation: 'Read as the self-initiated-change dimension, not a standalone career-turning-point house.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, initiative, courage).'
  },
  {
    id: 'CT-5H-001', category: 'Natal Promise', provenance: 'classical',
    name: '5th house — creativity, specialization, strategic development',
    description: 'The 5th house represents creativity, intellectual direction, specialization, and strategic professional development.',
    explanation: 'A supporting house for specialization/creative-direction career changes.',
    source: 'Classical Parashari house signification (5th = Putra Bhava: creative intelligence, specialization).'
  },
  {
    id: 'CT-2H-001', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house — accumulated resources, income/status continuity',
    description: 'The 2nd house represents accumulated resources, income/status continuity, and family/resource implications of a career transition.',
    explanation: 'Read as the resource/continuity dimension underlying a major career transition.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: accumulated resources, continuity).'
  },
  {
    id: 'CT-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — authority, status, leadership, professional identity',
    description: 'The Sun represents authority, status, leadership, recognition, and professional identity.',
    explanation: 'A primary significator for leadership-transition and identity-level career change.',
    source: 'Classical Parashari karaka system (Sun = authority, identity, leadership).'
  },
  {
    id: 'CT-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — work, service, responsibility, structural change',
    description: 'Saturn represents work, service, responsibility, long-term career structure, institutional employment, and major professional restructuring.',
    explanation: 'Never automatically interpreted as negative; its actual condition determines its contribution to structural career change.',
    source: 'Classical Parashari significance of Saturn (structure, responsibility, sustained work).'
  },
  {
    id: 'CT-NATAL-MERCURY', category: 'Natal Promise', provenance: 'classical',
    name: 'Mercury — communication, commerce, skill-based change',
    description: 'Mercury represents communication, commerce, analytical/professional work, business, and skill-based changes.',
    explanation: 'A supporting significator for communication/skill-driven career transitions.',
    source: 'Classical Parashari karaka system (Mercury = communication, commerce, skill).'
  },
  {
    id: 'CT-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — expansion, growth, guidance, major opportunity',
    description: 'Jupiter represents expansion, professional growth, guidance, higher responsibility, and major opportunities.',
    explanation: 'A primary/supporting significator for career expansion and major opportunity-driven transitions.',
    source: 'Classical Parashari karaka system (Jupiter = expansion, growth, guidance).'
  },
  {
    id: 'CT-NATAL-MARS', category: 'Natal Promise', provenance: 'classical',
    name: 'Mars — decisive action, initiative, technical activity (contextual)',
    description: 'Mars represents decisive action, initiative, and technical/professional activity.',
    explanation: 'A contextual significator for decisive, action-driven career change.',
    source: 'Classical Parashari significance of Mars (initiative, decisive action, technical skill).'
  },
  {
    id: 'CT-NATAL-RAHU', category: 'Natal Promise', provenance: 'classical',
    name: 'Rahu — unconventional change, foreign environment (contextual, never automatic)',
    description: 'Rahu represents unconventional change, foreign environment, sudden professional direction change, and unusual career path.',
    explanation: 'Per the spec\'s explicit instruction: Rahu is never treated as an automatic indicator of career change; its role depends on house, lordship, conjunction, dasha, and transit context.',
    source: 'Classical Parashari karaka extension (Rahu = unconventional/foreign context), read neutrally by default.'
  },
  {
    id: 'CT-NATAL-KETU', category: 'Natal Promise', provenance: 'classical',
    name: 'Ketu — detachment, discontinuity (contextual, never automatic)',
    description: 'Ketu represents detachment, discontinuity, and withdrawal from an established professional direction.',
    explanation: 'Per the spec\'s explicit instruction: Ketu is never treated as an automatic indicator of career change; its role depends on house, lordship, conjunction, dasha, and transit context.',
    source: 'Classical Parashari karaka extension (Ketu = detachment, discontinuity), read neutrally by default.'
  },
  {
    id: 'CT-SIG-10-6', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 6th connection (Employment/Service Career Transition)',
    description: 'Connection of the 10th and 6th houses supports an employment/service-related career transition.',
    explanation: 'Must be evaluated with natal promise, dasha, D10, and transit confirmation — never in isolation.',
    source: 'Classical Parashari house-lord relationship analysis (10th-6th nexus).'
  },
  {
    id: 'CT-SIG-10-7', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 7th connection (Business/Independent Professional Transition)',
    description: 'Connection of the 10th and 7th houses supports a business, independent-practice, public-dealing, or employment-structure change.',
    explanation: 'Distinguishes an independent/business-direction transition from an employment-structure one.',
    source: 'Classical Parashari house-lord relationship analysis (10th-7th nexus).'
  },
  {
    id: 'CT-SIG-10-11', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 11th connection (Career Expansion/Achievement)',
    description: 'Connection of the 10th and 11th houses supports career achievement, expansion, gains, or professional fulfilment.',
    explanation: 'Combines the career house with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (10th-11th nexus).'
  },
  {
    id: 'CT-SIG-10-9', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 9th connection (Major Career Direction Change)',
    description: 'Connection of the 10th and 9th houses supports a major career direction change, fortune-linked expansion, or change in trajectory.',
    explanation: 'Distinguishes a major directional change from ordinary job change.',
    source: 'Classical Parashari house-lord relationship analysis (10th-9th nexus).'
  },
  {
    id: 'CT-SIG-10-12', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 12th connection (Career Exit/Foreign/Withdrawal)',
    description: 'Connection of the 10th and 12th houses supports career exit, foreign professional environment, major closure, or withdrawal.',
    explanation: 'The 12th is used contextually here, never a default negative reading.',
    source: 'Classical Parashari house-lord relationship analysis (10th-12th nexus).'
  },
  {
    id: 'CT-SIG-10-3', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 3rd connection (Self-Initiated Career Change)',
    description: 'Connection of the 10th and 3rd houses supports self-initiated professional change or new professional direction.',
    explanation: 'Distinguishes a self-driven transition from an externally-imposed one.',
    source: 'Classical Parashari house-lord relationship analysis (10th-3rd nexus).'
  },
  {
    id: 'CT-SIG-10-5', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 5th connection (Specialization/Creative Career Change)',
    description: 'Connection of the 10th and 5th houses supports a creative, intellectual, or professional specialization change.',
    explanation: 'Distinguishes a specialization-driven transition from a structural one.',
    source: 'Classical Parashari house-lord relationship analysis (10th-5th nexus).'
  },
  {
    id: 'CT-SIG-6-12', category: 'House Relationship Signature', provenance: 'classical',
    name: '6th <-> 12th connection (Service-to-Exit)',
    description: 'Connection of the 6th and 12th houses supports a service-to-exit transition, employment separation, or major work-structure change.',
    explanation: 'Combines the service house with the withdrawal house.',
    source: 'Classical Parashari house-lord relationship analysis (6th-12th nexus).'
  },
  {
    id: 'CT-SIG-7-10', category: 'House Relationship Signature', provenance: 'classical',
    name: '7th <-> 10th connection (Employment/Business Transition)',
    description: 'Connection of the 7th and 10th houses supports an employment/business transition or independent professional activity.',
    explanation: 'Read alongside 10th-7th as the business/independent-direction signature.',
    source: 'Classical Parashari house-lord relationship analysis (7th-10th nexus).'
  },
  {
    id: 'CT-SIG-9-10', category: 'House Relationship Signature', provenance: 'classical',
    name: '9th <-> 10th connection (Major Professional Direction/Fortune-Linked Transition)',
    description: 'Connection of the 9th and 10th houses supports a major professional direction change linked to fortune or higher guidance.',
    explanation: 'Read alongside 10th-9th as the direction-change signature.',
    source: 'Classical Parashari house-lord relationship analysis (9th-10th nexus).'
  },
  {
    id: 'CT-SIG-10-11-2', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 11th <-> 2nd convergence (Career Achievement with Financial Implications)',
    description: 'Convergence of the 10th, 11th, and 2nd houses supports career achievement with financial/resource implications.',
    explanation: 'Combines career achievement with resource continuity.',
    source: 'Classical Parashari house-combination analysis (10th-11th-2nd nexus).'
  },
  {
    id: 'CT-SIG-10-12-9', category: 'House Relationship Signature', provenance: 'classical',
    name: '10th <-> 12th <-> 9th convergence (Foreign/Long-Distance Career Transition)',
    description: 'Convergence of the 10th, 12th, and 9th houses supports a foreign or long-distance career transition.',
    explanation: 'Combines career house, foreign/exit house, and directional-fortune house.',
    source: 'Classical Parashari house-combination analysis (10th-12th-9th nexus).'
  },
  {
    id: 'CT-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as confirmation (not replacement) for major career transitions',
    description: 'D10 Lagna, 10th house/lord, 6th/7th/9th/11th houses, and relevant planets confirm or qualify D1\'s career-turning-point indication — D10 confirms, it never replaces D1.',
    explanation: 'D10 is reused directly via this app\'s existing divisional-chart engine (vargaPosition) — no second D10 implementation was created.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, principal professional divisional chart).'
  },
  {
    id: 'CT-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to career houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/3rd/5th/6th/7th/9th/10th/11th/12th houses activates major career-transition themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the career-specific houses — an activation/timing signal, not by itself a guaranteed transition.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'CT-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 9th/10th/11th and 10th lord',
    description: 'Jupiter transiting or aspecting these houses, or the natal 10th lord, is read as a supporting confirmation for a major career-transition window — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never generate a major-career-turning-point prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'CT-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 6th/10th/11th/12th and 10th lord',
    description: 'Saturn transiting or aspecting these houses is read as sustained restructuring, structural career change, or a long-term transition — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never automatically classified as negative here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'CT-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary only)',
    description: 'Rahu/Ketu transit to the career houses is used only as a secondary modifier for sudden direction change, unconventional career transition, foreign career environment, or detachment/discontinuity — never alone sufficient to create a major career turning-point window.',
    explanation: 'Per the spec\'s explicit instruction: a Rahu/Ketu transit alone must never create a major career turning-point window.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'CT-CONVERGENCE-001', category: 'Multi-Factor Convergence', provenance: 'application',
    name: 'Multi-layer convergence (natal + MD + AD + PD + D10 + transit + related events)',
    description: 'A candidate period becomes more meaningful (and is only shown) when multiple independent layers converge: natal promise, MD, AD, PD, D10 confirmation, Jupiter transit, Saturn transit, optional Rahu/Ketu support, and existing career-event relationships.',
    explanation: 'Per the spec\'s explicit Section 13 instruction: convergence is shown explicitly and transparently, avoiding opaque numerical scoring.',
    source: 'Application synthesis (not a named classical text) — a transparent multi-factor convergence display, not a validated predictive score.'
  },
  {
    id: 'CT-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Career-transition event classification from converging house combinations',
    description: 'A candidate window is classified into one of the eighteen named major-career-turning-point categories (Major Role Transition, Major Responsibility Increase/Reduction, Leadership Transition, Function/Department Change, Industry/Direction Change, Employment Structure Change, Employment<->Business, Employment to Consultancy, Major Overseas Career Transition, Career Interruption, Career Restart, Major Professional Milestone, Major Career Reorientation, Significant Career Expansion/Consolidation, Other) based on exactly which houses/significators converge — these are interpretive classifications, never guaranteed outcomes.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which career-turning-point category. The underlying evidence is classical; the mapping to these named categories is this module\'s own.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'CT-PHASE-001', category: 'Career Phase Classification', provenance: 'application',
    name: 'Career phase classification (Expansion / Restructuring / Redirection / Diversification / Consolidation / Exit)',
    description: 'Each candidate window is additionally tagged with the most consistent higher-level career phase, based on the activated astrological factors — the module never infers the user\'s real-world career choice.',
    explanation: 'Per the spec\'s explicit Section 18 instruction, this provides a higher-level interpretation layer above the specific event classification.',
    source: 'Application synthesis mapping classical house-activation convergence to a career-phase model — not a named classical technique.'
  },
  {
    id: 'CT-RELATEDEVENTS-001', category: 'Related Career Events Cross-Check', provenance: 'application',
    name: 'Cross-check against Job Change, Promotion, Business Start, Recognition/Award, Financial Gain, Relocation, Foreign Travel, Retirement, Higher Education',
    description: 'For every candidate period, the module checks whether it also overlaps a candidate window from the existing Job Change, Promotion, Business Start, Recognition/Award, Financial Gain, Relocation, Foreign Travel/Settlement, Retirement, or Higher Education Timing modules, and reports which are Present/Supportive/Not Prominent.',
    explanation: 'Per the spec\'s explicit Section 17 instruction: this section reuses existing event engines by reading their own `.refresh()` output directly — it never duplicates their calculations.',
    source: 'Application synthesis combining multiple independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'CT-DISTINCTION-001', category: 'Distinction from Other Timing Modules', provenance: 'application',
    name: 'Major Career Turning Point is a broader synthesis, not a duplicate event window',
    description: 'This module does not create a duplicate event window merely because another module (Job Change, Promotion, Business Start, Retirement) already identifies a period; it instead indicates which existing event type most closely explains a candidate period, or reports a broader synthesis when no single existing module captures it.',
    explanation: 'Per the spec\'s explicit Section 4 instruction. This module is a broader synthesis layer, not a substitute for the narrower event-timing modules.',
    source: 'Application policy (not a classical technique) — an explicit architectural boundary for this module.'
  },
  {
    id: 'CT-NOGUARANTEE-001', category: 'Limitations', provenance: 'application',
    name: 'No guaranteed outcomes, no career recommendations, no rankings, no health/lifespan inference',
    description: 'This module never guarantees career outcomes (job loss, promotion, business success, foreign employment), never predicts an exact employer/company, never recommends a specific career choice, never ranks candidate periods as "best"/"worst", never gives financial investment advice, and never infers medical reasons or makes health/lifespan predictions.',
    explanation: 'Per the spec\'s explicit Section 35 instruction: this is a comprehensive, explicit scope boundary for the module.',
    source: 'Application policy (not a classical technique) — an explicit scope boundary for this module.'
  },
  {
    id: 'CT-STRENGTH-001', category: 'Window Strength', provenance: 'application',
    name: 'Window strength (non-numeric)',
    description: 'Candidate window strength is expressed as one of five descriptive categories (Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional) — never a numeric score, percentage, star rating, "best period"/"worst period" label, or ranked list.',
    explanation: 'Per the spec\'s explicit Section 16 instruction: no numerical scores, percentages, star ratings, "best"/"worst" labels, ranked lists, or winner/loser comparisons.',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  }
];
