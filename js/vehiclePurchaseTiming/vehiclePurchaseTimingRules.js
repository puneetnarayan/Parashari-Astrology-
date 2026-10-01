/* =========================================================
   VEHICLE PURCHASE TIMING — rule database (Parashari/Vimshottari
   method only; no KP sub-lords/significators/ruling-planets, no
   Western technique). Mirrors the pattern established for the
   eleven prior timing modules.
   ========================================================= */

window.VEHICLE_PURCHASE_TIMING_RULES = [
  {
    id: 'VEH-NATAL-004', category: 'Natal Promise', provenance: 'classical',
    name: '4th house/lord — vehicle, comfort, conveyance',
    description: 'The 4th house and its lord are the primary classical significator of vehicles, conveyances, comforts, and personal transportation.',
    explanation: 'The 4th is the central house for this module; its own condition is assessed before any timing or event classification. Shared with property/assets, but D16 and vehicle-specific significators differentiate vehicle timing from property timing.',
    source: 'Classical Parashari house signification (4th = Sukha Bhava: comforts, conveyances, vehicles).'
  },
  {
    id: 'VEH-NATAL-003', category: 'Natal Promise', provenance: 'classical',
    name: '3rd house/lord — travel, movement, vehicle operation',
    description: 'The 3rd house and its lord represent mobility, driving, short-distance travel, vehicle operation, and personal movement.',
    explanation: 'Read as a supporting mobility/operation dimension alongside the 4th, never a standalone vehicle house.',
    source: 'Classical Parashari house signification (3rd = Parakrama Bhava: effort, short travel, courage).'
  },
  {
    id: 'VEH-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house/lord — financial resources for purchase',
    description: 'The 2nd house and its lord represent purchase funding, accumulated wealth, and expenditure from savings or family resources.',
    explanation: 'Read as the funding dimension underlying a vehicle acquisition.',
    source: 'Classical Parashari house signification (2nd = Dhana Bhava: wealth, accumulated resources).'
  },
  {
    id: 'VEH-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — acquisition, fulfilment',
    description: 'The 11th house and its lord represent acquisition, fulfilment of desire, successful purchase, and financial gain supporting acquisition.',
    explanation: 'Read as the realization/fulfilment house for a vehicle promise, not a standalone vehicle-direction house.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, fulfilment of desire).'
  },
  {
    id: 'VEH-NATAL-006', category: 'Natal Promise', provenance: 'classical',
    name: '6th house — loan, debt, financing obligations (used carefully)',
    description: '6th house, when connected with vehicle houses, represents vehicle loan, debt, financing obligations, and monthly EMI — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction: the 6th must not be automatically treated as negative for vehicle timing.',
    source: 'Classical Parashari house signification (6th = Ripu/Karma-sthana: debt, obligation, routine effort).'
  },
  {
    id: 'VEH-NATAL-008', category: 'Natal Promise', provenance: 'classical',
    name: '8th house — insurance, financing complexity (used carefully)',
    description: '8th house, when connected with vehicle houses, represents insurance, financing complexities, sudden changes, and repair/maintenance themes.',
    explanation: 'Used carefully and contextually, per the spec\'s explicit instruction — never a default negative reading.',
    source: 'Classical Parashari house signification (8th = Ayu/Randhra Bhava: sudden change, complications, insurance-type events).'
  },
  {
    id: 'VEH-NATAL-012', category: 'Natal Promise', provenance: 'classical',
    name: '12th house — expenditure, outflow, foreign/imported vehicle (used contextually)',
    description: '12th house, when connected with vehicle houses, represents expenditure, outflow, high cost, foreign/imported vehicle context, and loss/maintenance expense.',
    explanation: 'Per the spec\'s explicit instruction: not every 12th-house connection is labeled a bad purchase.',
    source: 'Classical Parashari house signification (12th = Vyaya Bhava: expenditure, foreign context).'
  },
  {
    id: 'VEH-NATAL-010', category: 'Natal Promise', provenance: 'classical',
    name: '10th house — professional/business vehicle',
    description: '10th house, when connected with vehicle houses, represents business/professional vehicle, company vehicle, and work-related transport.',
    explanation: 'Read as the professional-use dimension for a vehicle acquired for work, not a standalone vehicle-direction house.',
    source: 'Classical Parashari house signification (10th = Karma Bhava: profession, work-related activity).'
  },
  {
    id: 'VEH-NATAL-VENUS', category: 'Natal Promise', provenance: 'classical',
    name: 'Venus — primary vehicle/comfort significator',
    description: 'Venus is the primary natural significator for vehicles, comforts, luxury, convenience, and enjoyment.',
    explanation: 'Classical karaka for vehicles; its actual dignity/placement/relationships determine its contribution — a single planet is never sufficient for vehicle timing.',
    source: 'Classical Parashari karaka system (Venus = vehicles, comforts, luxury).'
  },
  {
    id: 'VEH-NATAL-MARS', category: 'Natal Promise', provenance: 'classical',
    name: 'Mars — automobiles, machinery, mechanical systems',
    description: 'Mars is read for automobiles, machinery, mechanical systems, engines, and driving energy.',
    explanation: 'A supporting significator for the mechanical/engine dimension of a vehicle.',
    source: 'Classical Parashari significance of Mars (machinery, engineering, mechanical energy).'
  },
  {
    id: 'VEH-NATAL-MOON', category: 'Natal Promise', provenance: 'classical',
    name: 'Moon — comfort, mobility, personal convenience',
    description: 'The Moon is read for comfort, mobility, and personal convenience.',
    explanation: 'A supporting significator for the personal-comfort dimension of vehicle use.',
    source: 'Classical Parashari significance of the Moon (mind, comfort, personal convenience).'
  },
  {
    id: 'VEH-NATAL-MERCURY', category: 'Natal Promise', provenance: 'classical',
    name: 'Mercury — transport, documentation, commercial vehicles',
    description: 'Mercury is read for transport, communication, commercial vehicles, and documentation (registration/paperwork).',
    explanation: 'A supporting significator for the documentation/commercial-vehicle dimension.',
    source: 'Classical Parashari karaka system (Mercury = communication, documentation, commerce).'
  },
  {
    id: 'VEH-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — durable/industrial vehicles, long-term ownership',
    description: 'Saturn is read contextually for durable/industrial vehicles, heavy machinery, long-term ownership, older vehicles, and delays/maintenance — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction: Saturn is never automatically classified as negative; it may indicate delayed acquisition or a durable, practical vehicle.',
    source: 'Classical Parashari significance of Saturn (durability, structure, delay, longevity).'
  },
  {
    id: 'VEH-PAIR-4-11', category: 'Vehicle Acquisition Signature', provenance: 'classical',
    name: '4th <-> 11th connection',
    description: 'Connection between the 4th and 11th houses/lords supports acquisition/fulfilment related to vehicles and comforts.',
    explanation: 'Combines the vehicle/comfort house with the fulfilment house. Must be evaluated with natal promise, dasha, and D16 confirmation.',
    source: 'Classical Parashari house-lord relationship analysis (4th-11th nexus).'
  },
  {
    id: 'VEH-PAIR-4-2', category: 'Vehicle Acquisition Signature', provenance: 'classical',
    name: '4th <-> 2nd connection',
    description: 'Connection between the 4th and 2nd houses/lords supports vehicle acquisition backed by financial resources.',
    explanation: 'Combines the vehicle house with the funding house.',
    source: 'Classical Parashari house-lord relationship analysis (4th-2nd nexus).'
  },
  {
    id: 'VEH-PAIR-3-4', category: 'Vehicle Acquisition Signature', provenance: 'classical',
    name: '3rd <-> 4th connection',
    description: 'Connection between the 3rd and 4th houses/lords supports vehicle acquisition linked to mobility/operation.',
    explanation: 'Combines the movement/operation house with the vehicle house.',
    source: 'Classical Parashari house-lord relationship analysis (3rd-4th nexus).'
  },
  {
    id: 'VEH-CONV-2-4-11', category: 'Vehicle Acquisition Signature', provenance: 'classical',
    name: '2nd/4th/11th convergence',
    description: 'Convergence of the funding (2nd), vehicle (4th), and fulfilment (11th) houses supports vehicle acquisition specifically, distinct from a single pairwise connection.',
    explanation: 'This multi-house convergence is read as the strongest acquisition signature.',
    source: 'Classical Parashari house-combination analysis (2nd-4th-11th nexus).'
  },
  {
    id: 'VEH-INCOME-001', category: 'Vehicle Purchase Through Income Signature', provenance: 'classical',
    name: '2nd<->10th, 10th<->4th, 10th<->11th connections',
    description: 'These connections support vehicle purchase funded through professional income rather than borrowing.',
    explanation: 'Combines the income/profession house (10th) with the funding, vehicle, and fulfilment houses.',
    source: 'Classical Parashari house-combination analysis (10th-2nd/4th/11th nexus).'
  },
  {
    id: 'VEH-LOAN-001', category: 'Vehicle Purchase Through Loan Signature', provenance: 'classical',
    name: '2nd<->4th, 4th<->6th, 6th<->11th, and 2nd/4th/6th/11th convergence',
    description: 'These connections support vehicle purchase through financing/loan, distinct from cash purchase.',
    explanation: 'The 6th (debt/obligation) distinguishes a financed acquisition from a cash-funded one.',
    source: 'Classical Parashari house-combination analysis (2nd-4th-6th-11th nexus for debt-funded acquisition).'
  },
  {
    id: 'VEH-PROFESSIONAL-001', category: 'Professional Vehicle Signature', provenance: 'classical',
    name: '4th<->10th, 3rd<->10th, 4th<->11th connections',
    description: 'These connections support a professional/business/company vehicle acquired for work-related transport.',
    explanation: 'The 10th distinguishes a professional-use vehicle from a purely personal one.',
    source: 'Classical Parashari house-combination analysis (4th-10th-3rd-11th nexus).'
  },
  {
    id: 'VEH-REPLACE-001', category: 'Vehicle Replacement/Upgrade Signature', provenance: 'classical',
    name: '4th<->11th, 4th<->2nd, 3rd<->4th, with 8th/12th context',
    description: 'These connections, with 8th/12th involvement as context (not negative default), support vehicle replacement or upgrade rather than a first acquisition.',
    explanation: 'The 8th/12th context (change, expenditure) differentiates a replacement/upgrade from an initial purchase.',
    source: 'Classical Parashari house-combination analysis (4th-11th/2nd/3rd nexus with 8th/12th context).'
  },
  {
    id: 'VEH-D16-001', category: 'D16 Confirmation', provenance: 'classical',
    name: 'D16 (Shodashamsha) as the principal vehicle/conveyance confirmation chart',
    description: 'D16 ascendant, 4th house, relevant lords, and Venus/Mars/Moon confirm or qualify D1\'s vehicle promise — D16 confirms the vehicle/conveyance direction, it never replaces D1.',
    explanation: 'D16 is reused directly via this app\'s existing divisional-chart engine (vargaPosition) — no second D16 implementation was created. D16 confirmation is explicitly marked unavailable rather than fabricated if the chart cannot support it.',
    source: 'Classical Parashari Varga theory (D16 = Shodashamsha, principal vehicle/conveyance/comfort divisional chart).'
  },
  {
    id: 'VEH-D4-CROSSCHECK-001', category: 'D4 Property Cross-Check (Optional)', provenance: 'classical',
    name: 'D4 remains associated with property, not used as the primary vehicle chart',
    description: 'D4 (property\'s own divisional confirmation) is shown separately, read from the existing Property Purchase Timing module, rather than reused as the vehicle confirmation chart.',
    explanation: 'Per the spec\'s explicit Section 14 instruction: D4 is not the primary vehicle chart; it is shown only as an optional cross-check via the existing Property Purchase Timing module\'s own output.',
    source: 'Classical Parashari Varga theory (D4 = Chaturthamsha, property/asset divisional chart) — used here only as a cross-reference, not duplicated.'
  },
  {
    id: 'VEH-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to vehicle houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/3rd/4th/6th/8th/10th/11th/12th houses activates vehicle-acquisition themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the vehicle-specific houses — an activation/timing signal, not by itself a guaranteed purchase.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'VEH-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 2nd/3rd/4th/11th',
    description: 'Jupiter transiting or aspecting these houses, or the natal vehicle lords/Venus/Mars, is read as a supporting confirmation for vehicle-acquisition timing — never a standalone trigger.',
    explanation: 'Per the spec: a transit alone must never generate a vehicle-acquisition prediction; Jupiter only confirms an already-identified candidate dasha window.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'VEH-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 3rd/4th/11th',
    description: 'Saturn transiting or aspecting these houses may indicate delayed acquisition, a durable asset, a practical vehicle, or financing/obligation — never automatically negative.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never automatically classified as negative here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'VEH-TRANSIT-MARS', category: 'Transit', provenance: 'classical',
    name: 'Mars transit (secondary) — vehicle acquisition, mechanical activity',
    description: 'Mars transit is used as a secondary timing factor for vehicle acquisition, machinery, driving, and mechanical activity.',
    explanation: 'Secondary supporting evidence only, never a standalone trigger, and never used to infer accidents or danger.',
    source: 'Classical Parashari gochara methodology, secondary transit extension.'
  },
  {
    id: 'VEH-TRANSIT-VENUS', category: 'Transit', provenance: 'classical',
    name: 'Venus transit (secondary) — comfort, luxury, vehicle enjoyment',
    description: 'Venus transit is used as a secondary timing factor for comfort, luxury, and vehicle enjoyment.',
    explanation: 'Secondary supporting evidence only, never a standalone trigger.',
    source: 'Classical Parashari gochara methodology, secondary transit extension.'
  },
  {
    id: 'VEH-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (contextual, secondary)',
    description: 'Rahu/Ketu transit to the vehicle houses is used only as a contextual secondary modifier — never to infer accidents or danger merely because the nodes activate vehicle houses.',
    explanation: 'Per the spec\'s explicit Section 15/16 instruction: nodes are contextual only, and this module never generates accident/danger predictions.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously and never for safety/accident claims.'
  },
  {
    id: 'VEH-TYPE-001', category: 'Vehicle Type Classification', provenance: 'application',
    name: 'Broad vehicle-theme classification from converging evidence',
    description: 'Where the chart supports it, the vehicle theme is classified into a broad category (Personal, Family, Utility, Commercial/Professional, Luxury/Comfort-Oriented, Two-Wheeler, Four-Wheeler, Heavy/Industrial) based on which houses/karakas converge — an exact make, model, registration number, or colour is never predicted.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which broad vehicle theme. The underlying evidence is classical; the mapping to named categories is this module\'s own.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'VEH-STAGE-001', category: 'Event Stage', provenance: 'application',
    name: 'Event stage distinction (Booking -> Financing -> Purchase -> Delivery -> Registration -> First Use -> Replacement -> Upgrade)',
    description: 'Each candidate window is tagged with the most consistent event stage, distinguishing the eight named stages — financing is never automatically interpreted as the actual purchase, and the module never collapses all stages into one event.',
    explanation: 'Per the spec\'s explicit Section 19 instruction, this prevents confusing financing/booking/delivery/registration with the actual purchase/acquisition event.',
    source: 'Application synthesis mapping classical house-activation strength/convergence to a staged acquisition-lifecycle model — not a named classical technique.'
  },
  {
    id: 'VEH-FINANCING-001', category: 'Financing Analysis', provenance: 'application',
    name: 'Cash vs. Loan/EMI vs. Employer/Business acquisition mode',
    description: 'Where evidence supports a reasonable classification, the likely acquisition mode is shown as Cash Purchase (2nd/4th/11th), Loan/EMI Purchase (2nd/4th/6th/11th), or Employer/Business Vehicle (4th/10th/11th) — never an exact loan amount or EMI value.',
    explanation: 'Per the spec\'s explicit Section 17 instruction: acquisition mode is shown only when astrological evidence supports a reasonable classification, and no exact financial figures are ever stated.',
    source: 'Application synthesis combining classical house groupings into a financing-mode classification — not a named classical technique.'
  },
  {
    id: 'VEH-SAFETY-001', category: 'Safety/Accident Exclusion', provenance: 'application',
    name: 'No accident/danger predictions',
    description: 'This module never outputs accident predictions, "dangerous vehicle period" claims, or driving-avoidance advice, even when nodal or Mars transits activate vehicle houses.',
    explanation: 'Per the spec\'s explicit Section 16 instruction: this module is specifically for vehicle acquisition timing, not safety/accident astrology.',
    source: 'Application policy (not a classical technique) — an explicit scope boundary for this module.'
  },
  {
    id: 'VEH-STRENGTH-001', category: 'Window Strength', provenance: 'application',
    name: 'Window strength (non-numeric)',
    description: 'Candidate window strength is expressed as one of five descriptive categories (Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional) — never a numeric score, star rating, ranking, or "best vehicle purchase date" claim.',
    explanation: 'Per the spec\'s explicit Section 20 instruction: no numerical scores, no star ratings, no rankings, no "best vehicle purchase date" — the module identifies supportive periods, not guaranteed outcomes.',
    source: 'Application synthesis (not a named classical text) — an internal, documented qualitative aggregation, not a validated predictive score.'
  }
];
