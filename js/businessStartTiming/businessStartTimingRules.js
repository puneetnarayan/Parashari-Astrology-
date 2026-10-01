/* =========================================================
   BUSINESS START TIMING — rule database (Parashari/Vimshottari method
   only; no KP sub-lords/significators/ruling-planets, no Western
   technique). Mirrors the pattern established for the nine prior
   timing modules.
   ========================================================= */

window.BUSINESS_START_TIMING_RULES = [
  {
    id: 'BUS-NATAL-007', category: 'Natal Promise', provenance: 'classical',
    name: '7th house/lord — business, trade, partnership',
    description: 'The 7th house and its lord are the primary classical significator of business, trade, commercial interaction, clients, and partnerships.',
    explanation: 'The 7th is the central house for this module; its own condition (dignity, occupants, aspects, placement) is assessed before any timing or event-type classification.',
    source: 'Classical Parashari house signification (7th = Yuvati/Kalatra Bhava: partnership, trade, public-facing commercial dealings).'
  },
  {
    id: 'BUS-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house/lord — profession, action, business execution',
    description: 'The 10th house and its lord represent profession, authority, public activity, and business execution.',
    explanation: 'Read alongside the 7th for business-specific indications, never a standalone business trigger (10th alone is as readily employment as business).',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, action in the world).'
  },
  {
    id: 'BUS-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — gains, revenue, fulfilment',
    description: 'The 11th house and its lord represent profits, gains, network benefits, and revenue realization.',
    explanation: 'Read as the realization house for a business promise, not a business-direction house itself.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, fulfilment of desire).'
  },
  {
    id: 'BUS-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house/lord — capital, resources, sustenance',
    description: 'The 2nd house and its lord represent financial resources, accumulated wealth, and the business\'s financial foundation.',
    explanation: 'Read as the capital/resource dimension underlying business formation.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: wealth, resources, sustenance).'
  },
  {
    id: 'BUS-NATAL-003', category: 'Natal Promise', provenance: 'classical',
    name: '3rd house/lord — initiative, enterprise, self-effort',
    description: 'The 3rd house and its lord represent courage, initiative, self-effort, entrepreneurship, communication, marketing, and sales.',
    explanation: 'Read as the entrepreneurial-effort dimension of a business start, not a standalone business house.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, courage, initiative).'
  },
  {
    id: 'BUS-NATAL-005', category: 'Natal Promise', provenance: 'classical',
    name: '5th house — creativity, strategy, speculation (supporting)',
    description: '5th house, when connected with the business houses, supports creativity, strategy, speculation, and intellectual products relevant to professional practice or a creative business.',
    explanation: 'Read as supporting, never a standalone business trigger.',
    source: 'Classical Parashari house signification (5th = Putra Bhava, also creative intelligence/speculation in some traditions).'
  },
  {
    id: 'BUS-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house — employees, service, competition (used carefully)',
    description: '6th house, when connected with the business houses, represents employees, service delivery, competition, debt, and operational challenges — never automatically interpreted as negative for business.',
    explanation: 'Per the spec\'s explicit instruction: 6th-house involvement in a business context (e.g. operational/competitive activity) must not be automatically read as negative.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: service, competition, daily operations).'
  },
  {
    id: 'BUS-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — fortune, mentors, expansion (supporting)',
    description: '9th house, when connected with the business houses, supports fortune, mentorship, long-distance business, and higher support for the venture.',
    explanation: 'Read as supporting context, not a standalone business-start trigger.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, higher support, mentors).'
  },
  {
    id: 'BUS-NATAL-012', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — foreign business, outflow, remote operations (used contextually)',
    description: '12th house, when connected with the business houses, represents foreign business, overseas expenditure, business outflow, and remote/isolated operations.',
    explanation: 'Read contextually, never automatically negative, consistent with every other timing module\'s treatment of the 12th.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: outflow, foreign context, isolation).'
  },
  {
    id: 'BUS-NATAL-MERCURY', category: 'Natal Promise', provenance: 'classical',
    name: 'Mercury — commerce, trade, sales, business intelligence',
    description: 'Mercury is read for commerce, trade, communication, sales, accounting, and business intelligence, from its actual chart condition.',
    explanation: 'Classical significator of commerce/trade; its actual dignity/placement/relationships determine its contribution — not a blanket assumption.',
    source: 'Classical Parashari karaka system (Mercury = commerce, calculation, business intellect).'
  },
  {
    id: 'BUS-NATAL-VENUS', category: 'Natal Promise', provenance: 'classical',
    name: 'Venus — commerce, contracts, client-facing business',
    description: 'Venus is read for commerce, luxury, contracts, public relations, and client-facing business dealings.',
    explanation: 'A supporting significator for the client-relations/contracts dimension of business.',
    source: 'Classical Parashari significance of Venus (relationship, contracts, public-facing comfort/luxury trade).'
  },
  {
    id: 'BUS-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — advisory work, knowledge, finance, consulting',
    description: 'Jupiter is read for advisory work, knowledge-based business, finance, education, consulting, and expansion, from its actual chart condition.',
    explanation: 'Jupiter\'s functional ownership and actual condition determine its contribution to a professional-practice or consulting-type business.',
    source: 'Classical Parashari karaka system (Jupiter = wisdom, expansion, advisory/consulting significator).'
  },
  {
    id: 'BUS-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — long-term enterprise, industry, sustained operations',
    description: 'Saturn is read for long-term enterprise, industry, infrastructure, manufacturing, large organizations, and sustained operations — never automatically negative.',
    explanation: 'Saturn\'s actual condition determines whether it supports durable, structured enterprise or genuine delay — never a default negative reading.',
    source: 'Classical Parashari significance of Saturn (structure, longevity, sustained effort, industry).'
  },
  {
    id: 'BUS-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — leadership, authority, independent authority',
    description: 'The Sun is read for leadership, authority, government-related activity, and independent authority relevant to running a business.',
    explanation: 'A supporting significator for the leadership/authority dimension of business ownership.',
    source: 'Classical Parashari significance of the Sun (authority, leadership, independent standing).'
  },
  {
    id: 'BUS-NATAL-MARS', category: 'Natal Promise', provenance: 'classical',
    name: 'Mars — engineering, machinery, technical enterprise, initiative',
    description: 'Mars is read for engineering, machinery, technical enterprise, construction, and entrepreneurial initiative, from its actual chart condition.',
    explanation: 'A supporting significator for technical/manufacturing-type business and the initiative to start one.',
    source: 'Classical Parashari significance of Mars (initiative, engineering, construction, technical skill).'
  },
  {
    id: 'BUS-NATAL-RAHU', category: 'Natal Promise', provenance: 'classical',
    name: 'Rahu — unconventional enterprise, technology, foreign connections (neutral by default)',
    description: 'Rahu is read for unconventional enterprise, technology-driven business, foreign connections, and unusual markets — never automatically treated as positive or negative.',
    explanation: 'Per the spec\'s explicit instruction: Rahu must never be treated as automatically positive or negative; its actual placement/connections determine its reading.',
    source: 'Classical Parashari karaka extension (Rahu = unconventional/foreign/technology context), read neutrally by default.'
  },
  {
    id: 'BUS-PAIR-7-10', category: 'Business Formation Signature', provenance: 'classical',
    name: '7th <-> 10th connection',
    description: 'Connection between the 7th and 10th houses/lords is a central classical combination for business formation (trade combined with professional execution).',
    explanation: 'Combines the trade/partnership house with the career/execution house.',
    source: 'Classical Parashari house-lord relationship analysis (7th-10th nexus).'
  },
  {
    id: 'BUS-PAIR-7-11', category: 'Business Formation Signature', provenance: 'classical',
    name: '7th <-> 11th connection',
    description: 'Connection between the 7th and 11th houses/lords supports business/trade converting into realized gain.',
    explanation: 'Combines the trade house with the gain-realization house.',
    source: 'Classical Parashari house-lord relationship analysis (7th-11th nexus).'
  },
  {
    id: 'BUS-PAIR-3-7', category: 'Entrepreneurship Signature', provenance: 'classical',
    name: '3rd <-> 7th connection',
    description: 'Connection between the 3rd and 7th houses/lords supports effort-driven entrepreneurship and self-initiated trade.',
    explanation: 'Combines the initiative house with the trade house.',
    source: 'Classical Parashari house-lord relationship analysis (3rd-7th nexus).'
  },
  {
    id: 'BUS-PAIR-3-10', category: 'Entrepreneurship Signature', provenance: 'classical',
    name: '3rd <-> 10th connection',
    description: 'Connection between the 3rd and 10th houses/lords supports self-initiated professional/commercial activity.',
    explanation: 'Combines the initiative house with the career/execution house.',
    source: 'Classical Parashari house-lord relationship analysis (3rd-10th nexus).'
  },
  {
    id: 'BUS-PAIR-7-2', category: 'Business Formation Signature', provenance: 'classical',
    name: '7th <-> 2nd connection',
    description: 'Connection between the 7th and 2nd houses/lords supports business backed by adequate capital/resources.',
    explanation: 'Combines the trade house with the capital house.',
    source: 'Classical Parashari house-lord relationship analysis (7th-2nd nexus).'
  },
  {
    id: 'BUS-PROFIT-2-7-11', category: 'Business Profit Signature', provenance: 'classical',
    name: '2nd/7th/11th convergence (business profit)', description: 'Convergence of capital (2nd), trade (7th), and gain (11th) houses supports business profit specifically, distinct from simple formation.',
    explanation: 'This multi-house convergence is read as the business-profit signature, distinct from the formation-only signature (7th+10th/11th alone).',
    source: 'Classical Parashari house-combination analysis (2nd-7th-11th nexus for commercial profit).'
  },
  {
    id: 'BUS-PROFIT-5-7-11', category: 'Business Profit Signature', provenance: 'classical',
    name: '5th/7th/11th convergence (business profit via creative/speculative activity)',
    description: 'Convergence of creative/speculative (5th), trade (7th), and gain (11th) houses supports profit from creative, strategic, or intellectual-product business activity.',
    explanation: 'Distinguishes creative/strategy-driven business profit from pure capital-driven profit.',
    source: 'Classical Parashari house-combination analysis (5th-7th-11th nexus).'
  },
  {
    id: 'BUS-FOREIGN-001', category: 'Foreign Business Signature', provenance: 'classical',
    name: '7th/9th/10th/12th convergence with Rahu (foreign business)',
    description: 'Convergence of the 7th, 9th, 10th, and 12th houses, with Rahu contextually connected, supports foreign/international business activity.',
    explanation: 'Combines trade, fortune/long-distance, career, and foreign-context houses with the foreign karaka.',
    source: 'Classical Parashari house-combination analysis (7th-9th-10th-12th nexus with Rahu).'
  },
  {
    id: 'BUS-D10-001', category: 'D10 Confirmation', provenance: 'classical',
    name: 'D10 (Dashamsha) as the principal business/profession confirmation chart',
    description: 'D10 10th house/lord, and relevant business/profession planets, confirm or qualify D1\'s business promise — D10 confirms the professional/business direction, it never replaces D1.',
    explanation: 'D10 is reused directly via this app\'s existing divisional-chart engine, exactly as in Promotion/Job-Change/Career-Start/Foreign-Travel Timing — no second D10 implementation was created.',
    source: 'Classical Parashari Varga theory (D10 = Dashamsha, primary professional/business divisional chart).'
  },
  {
    id: 'BUS-D9-001', category: 'D9 Context (Optional)', provenance: 'classical',
    name: 'D9 (Navamsha) as supporting context only',
    description: 'D9 planetary strength/dignity is used only as a supporting confirmation for business timing — it never overrides the primary D1+D10 business logic.',
    explanation: 'Per the spec\'s explicit Section 14 instruction: D9 is optional supporting context only, reused via the same vargaPosition(\'D9\') function already used by Marriage Timing — not a second D9 implementation, and never given override authority.',
    source: 'Classical Parashari Varga theory (D9 = Navamsha, general strength-confirmation chart).'
  },
  {
    id: 'BUS-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to business houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/3rd/5th/7th/9th/10th/11th houses activates business-start themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the business-specific houses — an activation/timing signal, not by itself a guaranteed business launch.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'BUS-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 2nd/7th/10th/11th',
    description: 'Jupiter transiting or aspecting these houses, or the natal business lords, is read as a supporting confirmation for business-start timing — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never generate a business-start prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'BUS-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 3rd/7th/10th/11th',
    description: 'Saturn transiting or aspecting these houses is read as formalization, structure, sustained work, or (where evidence supports it) delayed commencement — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never defaulted to a negative reading here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'BUS-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary)',
    description: 'Rahu/Ketu transit to the business houses is used only as a secondary modifier for unconventional/foreign/technology business or sudden changes — never alone sufficient to create a business-start window.',
    explanation: 'Per the spec\'s explicit instruction: Rahu/Ketu alone must never create a business-start window.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'BUS-EMPLOYMENT-VS-BUSINESS-001', category: 'Employment vs. Business', provenance: 'application',
    name: 'Employment vs. Business vs. Independent-Professional distinction',
    description: 'The chart is scored independently for Employment/Service tendency (6th/10th/2nd/Saturn/Sun), Business/Entrepreneurship tendency (7th/10th/11th/2nd/3rd/Mercury/Venus/Rahu), and Independent-Professional tendency (5th/7th/10th/11th/2nd/Mercury-Jupiter-Venus), presented as a chart indication, never a deterministic statement ("the chart shows stronger X indicators than Y," never "you must become a businessman").',
    explanation: 'Per the spec\'s explicit Section 4 instruction and example language — this module never forces a single occupational destiny.',
    source: 'Application synthesis combining classical house/karaka groupings into three comparative tendency scores — not a named classical technique.'
  },
  {
    id: 'BUS-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Business-event classification from converging evidence',
    description: 'A candidate window is classified into one of the named business-start event types (Business Idea/Preparation, Registration/Formation, Launch, First Major Commercial Activity, Partnership/Joint Business Start, Family Business Entry, Independent Professional Practice) based on exactly which houses/significators converge — never a default classification, and preparation/planning is never classified as an actual launch.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which business-start event (Section 3/11). The underlying evidence is classical; the mapping to these named types is this module\'s own.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'BUS-STAGE-001', category: 'Event Stage', provenance: 'application',
    name: 'Event stage distinction (Idea -> Registration -> Launch -> First Commercial Activity -> Stabilization -> Expansion)',
    description: 'Each candidate window is additionally tagged with the most consistent event stage, distinguishing the six named stages — this module focuses on Stage 2 (Registration/Formation) and Stage 3 (Launch), with surrounding stages shown where evidence exists.',
    explanation: 'Per the spec\'s explicit Section 17 instruction, this prevents confusing company registration with actual business commencement.',
    source: 'Application synthesis mapping classical house-activation strength/convergence to a staged business-lifecycle model — not a named classical technique.'
  },
  {
    id: 'BUS-JOBCHANGE-CROSSCHECK-001', category: 'Business vs. Job Change', provenance: 'application',
    name: 'Job Change Timing cross-check for business-vs-employment overlap',
    description: 'When a candidate window overlaps one already identified by the existing Job Change Timing module, both possibilities are shown together ("the chart contains evidence for either a new employment role or business commencement") rather than forcing one conclusion.',
    explanation: 'Reads window.JobChangeTiming\'s own output directly (the same cross-module read pattern already used by Job Change Timing\'s own Promotion comparison, and Foreign Travel Timing\'s own Job Change comparison) rather than re-deriving any job-change rule.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'BUS-FINANCIAL-CROSSCHECK-001', category: 'Financial Confirmation', provenance: 'application',
    name: 'Financial Gain/Wealth Timing cross-check (optional)',
    description: 'When a candidate window overlaps one already identified by the existing Financial Gain/Wealth Timing module as financially active (2nd/5th/9th/11th), the window is tagged "Business Start + Financial Realization" rather than plain "Business Start" — optional, descriptive only, and never allowed to override the business-timing classification itself.',
    explanation: 'Per the spec\'s explicit Section 20 instruction: financial timing must never override business timing. Reads window.FinancialGainTiming\'s own output directly rather than re-deriving any financial rule.',
    source: 'Application synthesis combining two independently-computed module outputs — not a named classical technique.'
  },
  {
    id: 'BUS-STRENGTH-001', category: 'Window Strength', provenance: 'application',
    name: 'Window strength (non-numeric)',
    description: 'Candidate window strength is expressed as one of five descriptive categories (Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional) — never a numeric score, star rating, ranking, or "best date" claim.',
    explanation: 'Per the spec\'s explicit Section 21 instruction: no numerical scores, no star ratings, no rankings, no "best date."',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  }
];
