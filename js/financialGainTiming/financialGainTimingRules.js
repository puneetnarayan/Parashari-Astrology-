/* =========================================================
   FINANCIAL GAIN / WEALTH ACCUMULATION TIMING — rule database
   (Parashari/Vimshottari method only; no KP sub-lords/significators/
   ruling-planets, no Western technique). Mirrors the pattern
   established for the seven prior timing modules.

   IMPORTANT: this is an event-timing module, not financial advice. No
   rule here implies a guaranteed profit, a specific monetary amount, or
   an investment recommendation — see FIN-DISCLAIMER-001.
   ========================================================= */

window.FINANCIAL_TIMING_RULES = [
  {
    id: 'FIN-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house/lord — wealth, assets, savings',
    description: 'The 2nd house and its lord represent accumulated wealth, savings, family wealth, and financial security; their dignity, occupants, aspects, and placement set the baseline financial-promise indication.',
    explanation: 'The 2nd is a central house for this module; its own condition is assessed before any timing or event-type classification.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: wealth, accumulated resources, family wealth).'
  },
  {
    id: 'FIN-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — gains, income fulfilment',
    description: 'The 11th house and its lord represent gains, financial inflow, realization of benefits, profits, and receipts.',
    explanation: 'Classically the house of labha (gain) — the primary house for an actual financial inflow being realized.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, realization of desire).'
  },
  {
    id: 'FIN-NATAL-005', category: 'Natal Promise', provenance: 'classical',
    name: '5th house — investment/speculation/creative gain (used carefully)',
    description: '5th house/lord represent investments, speculation, calculated risk, and gains from intellectual/creative activity — never automatically equated with guaranteed investment profit.',
    explanation: 'Per the spec\'s explicit instruction: the 5th is read carefully and never treated as a guarantee of investment gain.',
    source: 'Classical Parashari house signification (5th = Putra Bhava, also speculation/purva-punya in some traditions).'
  },
  {
    id: 'FIN-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — fortune, opportunity',
    description: '9th house/lord represent fortune, luck, blessings, opportunities, and higher support relevant to favorable financial circumstances.',
    explanation: 'Read as a supporting fortune-context house, not a standalone financial-gain trigger.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, higher support).'
  },
  {
    id: 'FIN-NATAL-008', category: 'Natal Promise', provenance: 'classical',
    name: '8th house — sudden wealth, inheritance, joint assets (used carefully)',
    description: '8th house/lord represent inheritance, joint/spouse-linked assets, sudden financial transformation, and hidden resources — never automatically interpreted as positive wealth.',
    explanation: 'Per the spec\'s explicit instruction: the 8th must never be automatically read as positive; its actual condition (dignity, affliction) determines whether it supports sudden gain or signals financial strain.',
    source: 'Classical Parashari house signification (8th = Ayu/Randhra Bhava: transformation, joint resources, inheritance).'
  },
  {
    id: 'FIN-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house — professional/career-linked income (supporting)',
    description: '10th house, when connected with the wealth houses, supports professional/career-linked and promotion-linked financial improvement.',
    explanation: 'Read as supporting the career-income dimension of a financial event.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, authority).'
  },
  {
    id: 'FIN-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house — employment income, debt context (supporting)',
    description: '6th house, when connected with the wealth houses, supports employment/salary income, and separately provides debt/loan/financial-obligation context.',
    explanation: 'Read as supporting the service-income dimension, not a standalone wealth house.',
    source: 'Classical Parashari house signification (6th = service, debt, obligations).'
  },
  {
    id: 'FIN-NATAL-004', category: 'Natal Promise', provenance: 'classical',
    name: '4th house — property-linked wealth (supporting)',
    description: '4th house, when connected with the wealth houses, supports property-linked financial realization (fixed-asset wealth).',
    explanation: 'Read as supporting the asset-realization dimension specifically.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: property, fixed assets).'
  },
  {
    id: 'FIN-NATAL-012', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — expenditure/outflow (used as context, never automatic loss)',
    description: '12th house involvement is read for expenditure, financial leakage, and outflow — a counter-factor/context factor, never automatically "financial loss," and never labeling a period a "loss period" from this factor alone.',
    explanation: 'Per the spec\'s explicit instruction: the 12th is counter-factor context only; a loss-period label requires combining the complete chart, dasha, and transit evidence, not this house alone.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: expenditure, outflow).'
  },
  {
    id: 'FIN-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — wealth, expansion, prosperity (not a standalone timing rule)',
    description: 'Jupiter is read for wealth, expansion, prosperity, and financial opportunity, from its actual dignity/placement/relationships — its natural-significator status alone is never used as a standalone timing rule.',
    explanation: 'Per the spec\'s explicit instruction: a planet\'s natural significator status is never by itself a timing trigger — Jupiter\'s actual chart condition and house connections determine its contribution.',
    source: 'Classical Parashari karaka system (Jupiter = wealth/expansion significator).'
  },
  {
    id: 'FIN-NATAL-VENUS', category: 'Natal Promise', provenance: 'classical',
    name: 'Venus — comforts, material enjoyment, assets',
    description: 'Venus is read for comforts, material enjoyment, wealth, assets, and luxuries, from its actual chart condition.',
    explanation: 'A supporting significator for the material-comfort dimension of wealth.',
    source: 'Classical Parashari significance of Venus (comfort, luxury, material enjoyment).'
  },
  {
    id: 'FIN-NATAL-MERCURY', category: 'Natal Promise', provenance: 'classical',
    name: 'Mercury — commerce, trade, financial transactions',
    description: 'Mercury is read for commerce, trade, calculation, business, and financial transactions.',
    explanation: 'A supporting significator for the transactional/business dimension.',
    source: 'Classical Parashari karaka system (Mercury = commerce, calculation, business).'
  },
  {
    id: 'FIN-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — authority/government-linked income (used carefully)',
    description: 'The Sun is read carefully for authority, government-linked income, and status-related financial benefit.',
    explanation: 'A supporting significator, read from its actual condition.',
    source: 'Classical Parashari significance of the Sun (authority, government/institutional context).'
  },
  {
    id: 'FIN-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — long-term accumulation, structured income',
    description: 'Saturn is read for long-term accumulation, structured income, delayed-but-sustained gains, and institutional employment income — never automatically negative.',
    explanation: 'Saturn\'s actual condition determines whether it supports durable accumulation or genuine difficulty — never a default negative reading.',
    source: 'Classical Parashari significance of Saturn (structure, longevity, sustained effort).'
  },
  {
    id: 'FIN-NATAL-MOON', category: 'Natal Promise', provenance: 'classical',
    name: 'Moon — liquidity, public dealing, changing income patterns',
    description: 'The Moon is read for liquidity, public-facing dealings, and fluctuating/changing income patterns.',
    explanation: 'A supporting significator for the cashflow/liquidity dimension.',
    source: 'Classical Parashari significance of the Moon (mind, fluctuation, public dealing).'
  },
  {
    id: 'FIN-PAIR-2-11', category: 'Gain Signature', provenance: 'classical',
    name: '2nd lord <-> 11th lord connection',
    description: 'Connection between the 2nd and 11th lords is the central classical combination for wealth/gain themes.',
    explanation: 'The textbook Parashari combination for accumulated wealth converting into realized gain.',
    source: 'Classical Parashari house-lord relationship analysis (2nd-11th nexus).'
  },
  {
    id: 'FIN-PAIR-2-9', category: 'Gain Signature', provenance: 'classical',
    name: '2nd lord <-> 9th lord connection',
    description: 'Connection between the 2nd and 9th lords supports fortune-linked wealth.',
    explanation: 'Combines the wealth house with the fortune house.',
    source: 'Classical Parashari house-lord relationship analysis (2nd-9th nexus).'
  },
  {
    id: 'FIN-PAIR-5-11', category: 'Gain Signature', provenance: 'classical',
    name: '5th lord <-> 11th lord connection',
    description: 'Connection between the 5th and 11th lords supports investment/speculative gain being realized.',
    explanation: 'Combines the speculation house with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (5th-11th nexus).'
  },
  {
    id: 'FIN-PAIR-9-11', category: 'Gain Signature', provenance: 'classical',
    name: '9th lord <-> 11th lord connection',
    description: 'Connection between the 9th and 11th lords supports fortune-linked gain being realized.',
    explanation: 'Combines the fortune house with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (9th-11th nexus).'
  },
  {
    id: 'FIN-PAIR-2-5', category: 'Gain Signature', provenance: 'classical',
    name: '2nd lord <-> 5th lord connection',
    description: 'Connection between the 2nd and 5th lords supports investment-linked wealth.',
    explanation: 'Combines the wealth house with the speculation/investment house.',
    source: 'Classical Parashari house-lord relationship analysis (2nd-5th nexus).'
  },
  {
    id: 'FIN-PAIR-10-2', category: 'Career-Income Signature', provenance: 'classical',
    name: '10th lord <-> 2nd lord connection',
    description: 'Connection between the 10th and 2nd lords supports professional/career-linked income improvement.',
    explanation: 'Combines the career house with the wealth house.',
    source: 'Classical Parashari house-lord relationship analysis (10th-2nd nexus).'
  },
  {
    id: 'FIN-PAIR-10-11', category: 'Career-Income Signature', provenance: 'classical',
    name: '10th lord <-> 11th lord connection',
    description: 'Connection between the 10th and 11th lords supports professional/career-linked income being realized as gain.',
    explanation: 'Combines the career house with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (10th-11th nexus).'
  },
  {
    id: 'FIN-PAIR-6-2', category: 'Career-Income Signature', provenance: 'classical',
    name: '6th lord <-> 2nd lord connection',
    description: 'Connection between the 6th and 2nd lords supports employment/salary income.',
    explanation: 'Combines the service house with the wealth house.',
    source: 'Classical Parashari house-lord relationship analysis (6th-2nd nexus).'
  },
  {
    id: 'FIN-PAIR-2-8', category: 'Inheritance/Sudden-Wealth Signature', provenance: 'classical',
    name: '2nd lord <-> 8th lord connection',
    description: 'Connection between the 2nd and 8th lords supports inheritance/joint-asset-linked wealth.',
    explanation: 'Combines the wealth house with the inheritance/transformation house.',
    source: 'Classical Parashari house-lord relationship analysis (2nd-8th nexus).'
  },
  {
    id: 'FIN-PAIR-8-11', category: 'Inheritance/Sudden-Wealth Signature', provenance: 'classical',
    name: '8th lord <-> 11th lord connection',
    description: 'Connection between the 8th and 11th lords supports inheritance/sudden gain being realized.',
    explanation: 'Combines the inheritance/transformation house with the realization house.',
    source: 'Classical Parashari house-lord relationship analysis (8th-11th nexus).'
  },
  {
    id: 'FIN-BUSINESS-2-5-10-11', category: 'Business-Profit Signature', provenance: 'classical',
    name: '2nd/5th/10th/11th convergence (business profit)',
    description: 'Convergence of wealth (2nd), investment/creative (5th), career/business (10th), and gain (11th) houses, alongside Mercury/Jupiter, supports business profit specifically.',
    explanation: 'This multi-house convergence is read as the business-profit signature distinct from simple career-income (which needs only 10th+2nd/11th).',
    source: 'Classical Parashari house-combination analysis (2nd-5th-10th-11th nexus for commercial profit).'
  },
  {
    id: 'FIN-LEAKAGE-001', category: 'Financial Leakage/Pressure', provenance: 'application',
    name: '2nd/11th/6th connection with 12th (context only)',
    description: 'When the 2nd, 11th, or 6th connects with the 12th, financial-leakage/expenditure context is reported alongside the financial promise — never alone sufficient to label a period a "loss period."',
    explanation: 'Per the spec\'s explicit instruction: a loss-period label must combine the complete chart, dasha, and transit evidence, never one rule alone.',
    source: 'Application synthesis combining classical 12th-house signification with the wealth-house evidence — not a named classical loss-prediction technique.'
  },
  {
    id: 'FIN-D2-001', category: 'D2 Confirmation', provenance: 'classical',
    name: 'D2 (Hora) as the wealth-capacity confirmation chart',
    description: 'D2 2nd-house themes, planetary strength in D2, and benefic/malefic influence confirm or qualify D1\'s financial promise — never an independent substitute for D1.',
    explanation: 'D2 (Hora) is the classical divisional chart for wealth; it is reused here directly via this app\'s existing divisional-chart engine, exactly as D4/D7/D9/D10 are reused by the seven prior timing modules — no second D2 implementation was created.',
    source: 'Classical Parashari Varga theory (D2 = Hora, primary wealth/prosperity divisional chart).'
  },
  {
    id: 'FIN-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to financial houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/5th/8th/9th/11th houses, or the supporting 4th/6th/10th/12th, activates financial themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the financial-specific houses — an activation/timing signal, not by itself a guaranteed-gain prediction.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'FIN-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 2nd/5th/9th/11th',
    description: 'Jupiter transiting or aspecting these houses, or the natal financial lords, is read as a supporting confirmation for financial timing — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never generate a financial-gain prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'FIN-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 2nd/5th/9th/11th',
    description: 'Saturn transiting or aspecting these houses is read as sustained accumulation, structured income, or a restriction/delay theme depending on the broader evidence — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never defaulted to a negative reading here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'FIN-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary)',
    description: 'Rahu/Ketu transit to the 2nd/8th/11th is used only as a secondary modifier — Rahu is never automatically read as meaning sudden wealth.',
    explanation: 'Per the spec\'s explicit instruction: Rahu alone does not mean sudden wealth; it is a secondary, supporting factor.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'FIN-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Financial-event classification from converging evidence',
    description: 'A candidate window is classified into one of ten named financial themes (Salary/Income Increase, Bonus/Reward, Business Profit, Investment Gain, Inheritance/Family Wealth, Sudden Financial Gain, Property/Asset Realization, Debt Reduction/Financial Relief, Wealth Accumulation, Mixed Financial Improvement) based on exactly which houses/significators converge — never a default classification, and a sudden gain is never automatically equated with gambling/speculation.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which financial theme (Section 10). The underlying evidence is classical; the mapping to these ten named types is this module\'s own.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'FIN-GAIN-VS-WEALTH-001', category: 'Gain vs. Wealth Accumulation', provenance: 'application',
    name: 'One-time gain is distinguished from sustained wealth accumulation',
    description: 'A single strong candidate window (one-time gain evidence) is never automatically read as long-term wealth accumulation; Wealth Accumulation requires sustained/repeated activation of 2nd/11th/9th/10th across multiple windows, mirroring the Settlement Strength distinction in Foreign Travel Timing.',
    explanation: 'Per the spec\'s explicit Section 16 instruction: "a large one-time gain does not automatically mean long-term wealth accumulation."',
    source: 'Application synthesis (not a named classical text) — mirrors the repeated-activation requirement already used for Settlement Strength in the Foreign Travel/Settlement Timing module.'
  },
  {
    id: 'FIN-CASHFLOW-NETWORTH-001', category: 'Cashflow vs. Net Worth', provenance: 'application',
    name: 'Cashflow, asset/net-worth growth, and financial relief are reported separately',
    description: 'Each candidate window is tagged with which of Cashflow (money coming in), Asset/Net-Worth Growth (property/investment/savings accumulation), or Financial Relief (debt/liability reduction) it most corresponds to, based on which houses converge.',
    explanation: 'Per the spec\'s explicit Section 17 instruction to prevent all financial events from being interpreted as the same thing.',
    source: 'Application synthesis mapping classical house groupings (11th=cashflow, 2nd/4th=net worth, 6th/12th relief) to these three descriptive dimensions.'
  },
  {
    id: 'FIN-STRENGTH-001', category: 'Window Strength', provenance: 'application',
    name: 'Window strength (non-numeric)',
    description: 'Candidate window strength is expressed as one of five descriptive categories (Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional) — never a numeric score, star rating, or rank.',
    explanation: 'Per the spec\'s explicit Section 15 instruction: no 87/100, no 9.2/10, no star ratings, no "Rank #1."',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  },
  {
    id: 'FIN-DISCLAIMER-001', category: 'Scope Boundary', provenance: 'application',
    name: 'Not financial or investment advice',
    description: 'This module never guarantees profit, predicts an exact monetary amount, or recommends buying/selling/investing in any specific asset. It identifies astrologically supportive periods only.',
    explanation: 'A mandatory, non-classical safeguard this application applies around a financial-outcome-adjacent module, consistent with the spec\'s explicit Section 24 language requirements.',
    source: 'Application policy (not a classical rule) — ensures this tool is never mistaken for financial/investment advice.'
  }
];
