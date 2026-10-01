/* =========================================================
   MARRIAGE TIMING — rule database.
   Every rule the Marriage Timing engine can cite is declared here, each
   independently testable and carrying its own id/category/explanation/
   source, so the engine never applies an undocumented rule and the UI's
   Rule Explorer can show exactly which classical principle produced a
   given conclusion (per the spec's transparency requirement).
   No calculation logic lives in this file — only rule metadata and the
   small pure `condition` predicates the engine calls.
   ========================================================= */

window.MARRIAGE_TIMING_RULES = [
  {
    id: 'MT-PROMISE-001', category: 'Promise',
    name: '7th house occupants and influences',
    description: 'Natural benefics occupying or aspecting the 7th house support marriage and partnership; natural malefics there (without mitigation) can delay or complicate it.',
    explanation: 'The 7th house (from Lagna) is the classical Parashari significator of marriage/partnership. Its occupants and aspects set the baseline quality of that promise before dasha/transit timing is considered.',
    source: 'Classical Parashari house signification (7th = marriage/partner); this app\'s existing benefic/malefic classification.'
  },
  {
    id: 'MT-PROMISE-002', category: 'Promise',
    name: '7th lord dignity and placement',
    description: 'An exalted/own-sign/Moolatrikona 7th lord well-placed (Kendra/Trikona, not Dusthana) strengthens marriage promise; a debilitated or Dusthana-placed 7th lord weakens it unless otherwise supported.',
    explanation: 'The 7th lord carries the house\'s promise into the rest of the chart; its own strength and placement are read before any dasha timing.',
    source: 'Classical house-lord analysis; this app\'s existing dignity engine (detailedDignity).'
  },
  {
    id: 'MT-PROMISE-003', category: 'Promise',
    name: 'Venus as natural marriage significator (karaka)',
    description: 'Venus is the natural karaka (significator) for marriage/spouse in a male chart and love/romance generally; its dignity, house, and relationship to the 7th lord matter.',
    explanation: 'Classical Parashari assigns Venus as the Kalatra Karaka (spouse significator). Its condition is read independently of the 7th house/lord and then cross-checked against them.',
    source: 'Classical Parashari karaka system (Kalatra Karaka = Venus).'
  },
  {
    id: 'MT-PROMISE-004', category: 'Promise',
    name: 'Jupiter as marriage/dharma significator',
    description: 'Jupiter is the natural karaka for marriage/husband in a female chart and for dharma/expansion generally; also the primary transit trigger for marriage events in most traditions.',
    explanation: 'Jupiter is read as a secondary marriage significator for all charts in this tool (not only for female charts), consistent with its broader role as a 7th-house/relationship benefic, while flagging that classical texts specifically assign it as the husband-karaka in a female chart.',
    source: 'Classical Parashari karaka system (Putra/Pati karaka distinctions vary slightly by tradition — documented as a variation, not silently resolved).'
  },
  {
    id: 'MT-PROMISE-005', category: 'Promise',
    name: '2nd house — family/kutumba',
    description: '2nd house supports marriage as the house of family formation and immediate family added by marriage.',
    explanation: 'The 2nd house is a supporting, not primary, marriage house — it is read as context, never as a standalone trigger.',
    source: 'Classical Parashari house signification (2nd = kutumba/family).'
  },
  {
    id: 'MT-PROMISE-006', category: 'Promise',
    name: '5th house — romance',
    description: '5th house supports romance/courtship preceding marriage.',
    explanation: 'Read as a supporting house for love-marriage indications, never as a standalone marriage trigger.',
    source: 'Classical Parashari house signification (5th = romance/intelligence).'
  },
  {
    id: 'MT-PROMISE-007', category: 'Promise',
    name: '11th house — fulfilment of desire',
    description: '11th house supports the fulfilment/realization of the 7th house\'s promise (11th from 7th... and directly, the house of gains/desires fulfilled).',
    explanation: 'Read as a supporting house, not a primary marriage house.',
    source: 'Classical Parashari house signification (11th = labha/gains, fulfilment of desires).'
  },
  {
    id: 'MT-D9-001', category: 'D9',
    name: 'Navamsha (D9) as the marriage divisional chart',
    description: 'D9 is the classical divisional chart used to confirm (not replace) D1 marriage indications — specifically the D9 Ascendant, D9 7th house/lord, and D9 placement of Venus/Jupiter/7th lord.',
    explanation: 'D9 is read strictly as a confirming layer on top of D1, never as an independent substitute, per the spec\'s explicit instruction.',
    source: 'Classical Parashari Varga theory (D9 = Navamsha, primary marriage/dharma divisional chart).'
  },
  {
    id: 'MT-SIG-001', category: 'Significators',
    name: 'Marriage significator identification',
    description: 'A planet is classified as a marriage significator if it owns or occupies 2/5/7/11, is Venus or Jupiter, is conjunct the 7th lord/Venus/Jupiter, or is meaningfully placed in D9 relative to the D9 7th house.',
    explanation: 'This mirrors the classical approach of identifying all planets connected to marriage houses/karakas before timing is attempted — timing (dasha/transit) is only meaningful once significators are known.',
    source: 'Classical Parashari significator (karaka) methodology, applied here to the marriage houses specifically.'
  },
  {
    id: 'MT-DASHA-001', category: 'Dasha',
    name: 'Mahadasha/Antardasha lord connection to marriage houses',
    description: 'A Mahadasha or Antardasha whose lord owns or occupies 2nd/5th/7th/11th house activates marriage-related themes during that period.',
    explanation: 'Classical Vimshottari Dasha timing: a period is read as activating the significations of the houses its lord rules or occupies.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha).'
  },
  {
    id: 'MT-DASHA-002', category: 'Dasha',
    name: 'Dasha lord is a marriage significator (Venus/Jupiter/7th lord)',
    description: 'A period run by Venus, Jupiter, or the 7th lord directly activates marriage promise, independent of house ownership.',
    explanation: 'The natural/functional significator\'s own period is classically read as a strong trigger window.',
    source: 'Classical Vimshottari Dasha theory, karaka activation principle.'
  },
  {
    id: 'MT-DASHA-003', category: 'Dasha',
    name: 'Pratyantardasha refinement',
    description: 'Within a marriage-relevant Antardasha, the specific Pratyantardasha further narrows the window — a PD lord that is itself a marriage significator strengthens that narrower window.',
    explanation: 'The third dasha level (PD) is used only to narrow candidate Antardashas already identified as marriage-relevant, not to introduce new unrelated periods — this keeps the candidate set bounded and classically grounded.',
    source: 'Classical 3-level Vimshottari subdivision; this app\'s existing buildSubPeriods() function.'
  },
  {
    id: 'MT-TRANSIT-001', category: 'Transit',
    name: 'Jupiter transit over/aspecting the 7th house or 7th lord',
    description: 'Jupiter transiting the natal 7th house, or aspecting it or the natal 7th lord\'s sign, is a classical marriage-trigger transit.',
    explanation: 'Jupiter is the most widely used transit confirmation for marriage timing across Parashari traditions.',
    source: 'Classical Parashari transit (gochara) methodology for marriage timing.'
  },
  {
    id: 'MT-TRANSIT-002', category: 'Transit',
    name: 'Jupiter transit relationship with natal Venus',
    description: 'Jupiter transiting in conjunction with or aspecting natal Venus\'s sign is read as supporting marriage timing.',
    explanation: 'Venus (karaka) activated by the benefic Jupiter\'s transit is a commonly cited confirming condition.',
    source: 'Classical Parashari transit methodology (karaka activation by transit).'
  },
  {
    id: 'MT-TRANSIT-003', category: 'Transit',
    name: 'Saturn transit relationship with the 7th house/lord or dasha lord',
    description: 'Saturn transiting the 7th house or its lord\'s sign, or the current dasha lord\'s sign, is read as a maturation/commitment-timing influence on marriage, not purely an obstacle.',
    explanation: 'Saturn is read here as a maturity/responsibility-timing signal for marriage (classical "Saturn brings what is due, in its own time"), not only as an obstruction — this interpretation is documented since some traditions read Saturn transits to the 7th primarily as delay/obstacle instead.',
    source: 'Classical Parashari transit methodology; documented interpretive variation (maturation vs. obstruction) rather than silently picking one.'
  },
  {
    id: 'MT-CONVERGENCE-001', category: 'Convergence',
    name: 'Multi-factor convergence',
    description: 'A candidate window is strongest when natal promise, dasha activation, sub-period refinement, transit confirmation, and D1/D9 confirmation independently agree — not when any single factor is strong alone.',
    explanation: 'This is the spec\'s core anti-black-box principle: no single factor is ever allowed to produce a "final" window by itself.',
    source: 'This module\'s own transparent convergence design (not a named classical text) — documented as an internal aggregation mechanism, not a validated predictive score.'
  }
];
