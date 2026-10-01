/* =========================================================
   CHILDBIRTH TIMING — rule database (Parashari/Vimshottari method
   only; no KP sub-lords/significators/ruling-planets, no Western
   technique). Mirrors the pattern established for Marriage/Promotion/
   Job Change/Career Start Timing.

   SENSITIVITY NOTE: every rule here describes an ASTROLOGICAL
   indication only. None of these rules claim, diagnose, or predict a
   medical/biological/fertility outcome. See childbirthTimingEngine.js
   and childbirthTimingUI.js for the mandatory language constraints
   ("astrologically supportive period", never "guaranteed pregnancy").
   ========================================================= */

window.CHILDBIRTH_TIMING_RULES = [
  {
    id: 'CB-NATAL-005', category: 'Natal Promise', provenance: 'classical',
    name: '5th house/lord — primary children/progeny house',
    description: 'The 5th house and its lord are the primary classical significator of children/progeny; its dignity, occupants, aspects, and placement set the baseline astrological indication.',
    explanation: 'The 5th is read here as the central house for this module; its own condition is assessed before any timing is considered.',
    source: 'Classical Parashari house signification (5th = Putra Bhava: children, progeny, intelligence).'
  },
  {
    id: 'CB-NATAL-002', category: 'Natal Promise', provenance: 'classical',
    name: '2nd house/lord — family expansion',
    description: 'The 2nd house/lord are read as a supporting family-expansion indicator, connected to the 5th rather than independently.',
    explanation: 'A supporting house, never a substitute for the 5th.',
    source: 'Classical Parashari house signification (2nd = Kutumba Bhava: family).'
  },
  {
    id: 'CB-NATAL-011', category: 'Natal Promise', provenance: 'classical',
    name: '11th house/lord — fulfilment/realization',
    description: 'The 11th house/lord support the realization/fulfilment of the 5th house\'s promise.',
    explanation: 'Read as a supporting realization factor, not a children-signifying house on its own.',
    source: 'Classical Parashari house signification (11th = Labha Bhava: gains, fulfilment of desire).'
  },
  {
    id: 'CB-NATAL-009', category: 'Natal Promise', provenance: 'classical',
    name: '9th house — fortune/higher dharma (secondary)',
    description: 'The 9th house is used only as a secondary supporting factor where it connects with the 5th, 5th lord, Jupiter, or D7 — never as a substitute for the 5th.',
    explanation: 'Read strictly as supporting context, per the spec\'s explicit instruction not to substitute the 9th for the 5th.',
    source: 'Classical Parashari house signification (9th = Bhagya Bhava: fortune, dharma).'
  },
  {
    id: 'CB-NATAL-812', category: 'Natal Promise', provenance: 'classical',
    name: '8th/12th houses — obstacles, delay, transformation (used carefully)',
    description: '8th and 12th house involvement is read as possible obstacles, delays, major transformation, or expenditure/separation context around the event — never automatically as denial of childbirth.',
    explanation: 'Per the spec\'s explicit instruction: 8th/12th activation is context, never an automatic negative verdict.',
    source: 'Classical Parashari house signification (8th = transformation/obstacles; 12th = loss/separation/expenditure).'
  },
  {
    id: 'CB-NATAL-JUPITER', category: 'Natal Promise', provenance: 'classical',
    name: 'Jupiter — natural significator of children',
    description: 'Jupiter is the classical natural karaka (Putra Karaka) for children; its sign, house, lordship, dignity, conjunctions, aspects, and relation to the 5th/5th lord are read from its actual condition, never assumed favorable by default.',
    explanation: 'Jupiter\'s functional ownership and actual condition in this specific chart determine its contribution — not a blanket "Jupiter is good" assumption.',
    source: 'Classical Parashari karaka system (Jupiter = Putra Karaka, children/progeny significator).'
  },
  {
    id: 'CB-NATAL-MOON', category: 'Natal Promise', provenance: 'classical',
    name: 'Moon — family development and emotional/timing context',
    description: 'The Moon is read for family development context, emotional readiness, and traditional reproductive symbolism — never as a medical fertility indicator.',
    explanation: 'Read as supporting psychological/family context only; explicitly not a fertility diagnosis.',
    source: 'Classical Parashari significance of the Moon (manas = mind; family/domestic context).'
  },
  {
    id: 'CB-NATAL-VENUS', category: 'Natal Promise', provenance: 'classical',
    name: 'Venus — family/marital context (supporting)',
    description: 'Venus is read as a supporting significator for family/relationship/marital context and traditional reproductive symbolism — never a medical conclusion.',
    explanation: 'A supporting, not primary, significator for this module.',
    source: 'Classical Parashari significance of Venus (relationship, marital harmony, Kalatra-adjacent context).'
  },
  {
    id: 'CB-NATAL-SUN', category: 'Natal Promise', provenance: 'classical',
    name: 'Sun — progeny/lineage context (used carefully)',
    description: 'The Sun is read carefully for traditional child/progeny and family-lineage/authority significations, alongside the 5th and Jupiter.',
    explanation: 'A supporting significator, read from its actual condition.',
    source: 'Classical Parashari significance of the Sun in some traditions\' progeny context; used cautiously here as a secondary factor.'
  },
  {
    id: 'CB-NATAL-SATURN', category: 'Natal Promise', provenance: 'classical',
    name: 'Saturn — delay, maturation, family responsibility',
    description: 'Saturn is read for delay, maturation of timing, and family responsibility — never automatically interpreted as denial.',
    explanation: 'Saturn\'s actual condition determines whether it suggests a later, more deliberate timing or genuine difficulty — never a default negative reading.',
    source: 'Classical Parashari significance of Saturn (karma, structure, delay/maturation).'
  },
  {
    id: 'CB-PAIR-5-11', category: 'Childbirth Indicators', provenance: 'classical',
    name: '5th lord <-> 11th lord connection',
    description: 'Connection between the 5th and 11th lords supports the fulfilment/realization of the children\'s-house promise.',
    explanation: 'The central classical combination for the 5th house promise being realized.',
    source: 'Classical Parashari house-lord relationship analysis (5th-11th nexus).'
  },
  {
    id: 'CB-PAIR-5-2', category: 'Childbirth Indicators', provenance: 'classical',
    name: '5th lord <-> 2nd lord connection',
    description: 'Connection between the 5th and 2nd lords supports family expansion alongside the children\'s-house promise.',
    explanation: 'Combines the children house with the family-expansion house.',
    source: 'Classical Parashari house-lord relationship analysis (5th-2nd nexus).'
  },
  {
    id: 'CB-PAIR-JUP-5', category: 'Childbirth Indicators', provenance: 'classical',
    name: 'Jupiter connected with the 5th house/lord',
    description: 'Jupiter conjunct, aspecting, or lord-exchanging with the 5th house or its lord is a primary classical children-promise combination.',
    explanation: 'Direct application of Jupiter\'s Putra Karaka role to the 5th house itself.',
    source: 'Classical Parashari karaka-to-house connection analysis.'
  },
  {
    id: 'CB-PAIR-9-5', category: 'Childbirth Indicators', provenance: 'classical',
    name: '9th connection with 5th/5th lord/Jupiter/D7 (secondary)',
    description: 'A 9th-house connection with the 5th, 5th lord, Jupiter, or D7 is read as secondary supporting fortune context, never a substitute for the 5th itself.',
    explanation: 'Explicitly secondary, per the spec\'s Section 4 instruction.',
    source: 'Classical Parashari house-lord relationship analysis (9th-5th nexus), read as supporting only.'
  },
  {
    id: 'CB-D7-001', category: 'D7 Confirmation', provenance: 'classical',
    name: 'D7 (Saptamsha) as the progeny confirmation chart',
    description: 'D7 Lagna/Lagna lord, D7 5th/9th/11th houses and lords, and D7 placement of Jupiter/dasha lords confirm or qualify D1\'s children promise — never an independent substitute for D1.',
    explanation: 'D7 is the classical divisional chart for progeny; it confirms D1 here exactly as D9/D10 confirm D1 in Marriage/Promotion/Job-Change/Career-Start Timing. This app\'s existing divisional-chart engine (vargaPosition with the D7 Saptamsa rule already defined) is reused directly — no second D7 implementation was created.',
    source: 'Classical Parashari Varga theory (D7 = Saptamsa, primary progeny divisional chart).'
  },
  {
    id: 'CB-DASHA-001', category: 'Dasha', provenance: 'classical',
    name: 'Mahadasha/Antardasha/Pratyantardasha lord connection to children-promise houses',
    description: 'A dasha level whose lord owns, occupies, or is connected to the 2nd/5th/9th/11th houses, the 5th lord, or Jupiter activates child-related themes during that period.',
    explanation: 'Classical Vimshottari timing principle applied to the children-promise-specific houses — an activation/timing signal, not by itself a childbirth guarantee.',
    source: 'Classical Vimshottari Dasha theory; this app\'s existing Dasha engine (computeVimshottariDasha / buildSubPeriods).'
  },
  {
    id: 'CB-TRANSIT-JUP', category: 'Transit', provenance: 'classical',
    name: 'Jupiter transit over/aspecting natal 5th/5th lord/9th/11th/Moon',
    description: 'Jupiter transiting or aspecting these houses/natal Moon is read as a major confirmation layer for childbirth timing — never a standalone trigger.',
    explanation: 'Per the spec: Jupiter transit alone must never generate a childbirth prediction; it only confirms an already-identified candidate dasha window with independent natal support.',
    source: 'Classical Parashari gochara (transit) methodology.'
  },
  {
    id: 'CB-TRANSIT-SAT', category: 'Transit', provenance: 'classical',
    name: 'Saturn transit over/aspecting natal 5th/5th lord/2nd/11th/Moon',
    description: 'Saturn transiting or aspecting these houses is read as delay, maturation, responsibility, or formal family development — NOT automatically denial.',
    explanation: 'Per the spec\'s explicit instruction, Saturn is never defaulted to a negative reading here.',
    source: 'Classical Parashari gochara (transit) methodology; documented interpretive breadth per the spec.'
  },
  {
    id: 'CB-TRANSIT-NODES', category: 'Transit', provenance: 'classical',
    name: 'Rahu/Ketu transit (secondary, optional)',
    description: 'Rahu/Ketu transit to the 5th/2nd/11th is used only as a secondary, optional confirmation — never as the primary timing mechanism and never alone sufficient for a prediction.',
    explanation: 'Per the spec\'s explicit instruction: node transits remain secondary and never solely generate a childbirth prediction.',
    source: 'Classical Parashari gochara methodology, nodal transit extension, used cautiously.'
  },
  {
    id: 'CB-EVENT-001', category: 'Event Classification', provenance: 'application',
    name: 'Childbirth-window classification from converging evidence',
    description: 'A candidate window is classified as a Strong Childbirth Window, Conception/Pregnancy Support Window, Child-Related Family Development, or Delayed/Conditional Window based on exactly which houses/significators/D7/Dasha/transit converge — never a default classification, and never presented as certain.',
    explanation: 'This application\'s own synthesis of which combination of classical evidence corresponds to which kind of child-related astrological indication (Step 19). The underlying evidence is classical; the mapping to these four window types is this module\'s own, and no window type is ever described using guaranteed/certain language.',
    source: 'Application synthesis (not a named classical text) — the underlying house/lord/karaka evidence it combines is classical.'
  },
  {
    id: 'CB-PARTNER-001', category: 'Partner Cross-Check', provenance: 'application',
    name: 'Optional spouse/partner chart convergence',
    description: 'When a partner\'s birth details are provided, the same 5th/2nd/11th/Jupiter/D7 evidence is independently computed for that chart and compared for convergence with the primary chart\'s candidate windows — purely as an additional descriptive layer, never a required input and never a medical conclusion.',
    explanation: 'Reuses this app\'s existing generateBirthChart() function (the same one Kundali Matching already uses for a second chart) rather than building a new two-chart engine.',
    source: 'Application synthesis combining two independently-computed classical chart readings — not a named classical two-chart progeny technique.'
  },
  {
    id: 'CB-MEDICAL-001', category: 'Medical Boundary', provenance: 'application',
    name: 'Astrology is not a medical or fertility assessment',
    description: 'This module never states or implies a guaranteed pregnancy, a medical fertility diagnosis, or a prediction that overrides medical advice. It describes astrologically supportive periods only.',
    explanation: 'A mandatory, non-classical safeguard this application applies around a sensitive life-event module, consistent with the spec\'s explicit sensitivity requirement.',
    source: 'Application policy (not a classical rule) — ensures this tool is never mistaken for medical guidance.'
  }
];
