/* =========================================================
   MAJOR LIFE TRANSITION / PHASE CHANGE TIMING — rule/provenance database
   and static registries. This module keeps a lightweight INDEPENDENT
   Parashari foundation (house-pair "transition signatures") in addition
   to consuming the existing timing-module ecosystem (via window.LifeTimeline,
   which has already done normalization + dedup + domain classification).
   This file documents only this module's own rules; individual timing
   modules and window.LifeTimeline keep ownership of their own rules.
   ========================================================= */

// ---------------------------------------------------------------------
// Independent foundation (spec section 6) — primary + supporting houses.
// ---------------------------------------------------------------------
window.MAJORLIFETRANSITION_HOUSES = {
  primary: [1, 4, 7, 9, 10, 12],
  secondary: [2, 8, 11],
  supporting: [3, 5, 6]
};

// ---------------------------------------------------------------------
// Transition signatures (spec section 7) — house-pair relationships per
// life area. "pairs" are evaluated for lordship connection (same lord,
// mutual conjunction, mutual aspect, or lord-exchange) as narrative,
// non-deterministic supporting evidence only (see evaluateLifeTransitionNatalPattern).
// ---------------------------------------------------------------------
window.MAJORLIFETRANSITION_SIGNATURES = [
  { id: 'identity-direction', label: 'Identity / Life-Direction', domain: 'Spiritual/Personal', pairs: [[1, 9], [1, 10], [1, 12]] },
  { id: 'career', label: 'Career Transition', domain: 'Career', pairs: [[10, 6], [10, 7], [10, 11], [10, 12], [10, 9]] },
  { id: 'residential', label: 'Residential Transition', domain: 'Property/Residence', pairs: [[4, 12], [4, 3], [4, 9], [4, 10]] },
  { id: 'financial', label: 'Financial Structure Transition', domain: 'Finance', pairs: [[2, 8], [2, 11], [2, 12], [6, 2], [8, 11]] },
  { id: 'relationship-family', label: 'Relationship / Family Transition', domain: 'Relationship/Family', pairs: [[2, 7], [5, 7], [7, 8], [7, 12]] },
  { id: 'education-career', label: 'Education → Career Transition', domain: 'Education', pairs: [[5, 9], [9, 10], [5, 10], [9, 11]] },
  { id: 'spiritual-personal', label: 'Spiritual / Personal Transition', domain: 'Spiritual/Personal', pairs: [[5, 9], [9, 12], [8, 9], [8, 12], [1, 12]] }
];

// ---------------------------------------------------------------------
// Transition taxonomy (spec section 4). Used only as display labels
// derived from already-known domain/module evidence — never an
// independent new prediction.
// ---------------------------------------------------------------------
window.MAJORLIFETRANSITION_TAXONOMY = [
  'careerLifeTransition', 'workToRetirement', 'employmentToBusiness', 'careerAndRelocation',
  'residentialTransition', 'financialStructureTransition', 'familyStructureTransition',
  'relationshipTransition', 'educationToCareer', 'healthRecoveryToRoutine',
  'propertyAndFinancialTransition', 'legacyAndResponsibilityTransition', 'spiritualLifeTransition',
  'responsibilityExpansion', 'simplificationConsolidation', 'multiDomainTransition',
  'newLifePhase', 'restructuringPhase'
];

window.MAJORLIFETRANSITION_FOCUS_OPTIONS = ['All', 'Career', 'Finance', 'Residence', 'Family', 'Education', 'Health-Recovery', 'Spiritual-Personal'];
window.MAJORLIFETRANSITION_FOCUS_DOMAIN_MAP = {
  'All': null, 'Career': 'Career', 'Finance': 'Finance', 'Residence': 'Property/Residence',
  'Family': 'Relationship/Family', 'Education': 'Education', 'Health-Recovery': 'Health', 'Spiritual-Personal': 'Spiritual/Personal'
};
window.MAJORLIFETRANSITION_TYPE_OPTIONS = [
  'All', 'New Beginning', 'Restructuring', 'Relocation', 'Responsibility Expansion',
  'Simplification', 'Closure → New Phase', 'Multi-Domain'
];

// ---------------------------------------------------------------------
// Candidate-window horizons (spec section 21).
// ---------------------------------------------------------------------
window.MAJORLIFETRANSITION_HORIZONS = [1, 2, 3, 5, 10];

// ---------------------------------------------------------------------
// Temporal proximity thresholds (spec section 18) — reused identically
// to window.LifeTimeline's own thresholds so clustering stays consistent
// across both modules.
// ---------------------------------------------------------------------
window.MAJORLIFETRANSITION_PROXIMITY_DAYS = { direct: 0, threeMonths: 93, sixMonths: 186, twelveMonths: 372 };

// ---------------------------------------------------------------------
// This module's own forbidden-language scanner patterns (spec section
// 33-34) — applied only to this module's own synthesized narrative text.
// Each source module's own reasons/cautions/disclaimer text is preserved
// verbatim and never re-scanned here.
// ---------------------------------------------------------------------
window.MAJORLIFETRANSITION_FORBIDDEN_PATTERNS = [
  /\bwill\s+(die|pass\s+away)\b/i, /\bdate\s+of\s+death\b/i, /\blifespan\b/i, /\blife\s+expectancy\b/i,
  /\b(fatal|terminal)\s+(illness|disease|accident)\b/i, /\bwill\s+be\s+diagnosed\b/i, /\bmedical\s+diagnos/i,
  /\bwill\s+have\s+an?\s+accident\b/i, /\bmental[- ]health\s+diagnos/i, /\b(he|she|they)\s+(secretly|really)\s+(wants|intends|plans)\b/i,
  /\bguarantee(d|s)?\s+(marriage|divorce|childbirth|a\s+child)\b/i, /\bwill\s+(definitely|certainly)\s+(marry|divorce|have\s+a\s+child)\b/i,
  /\bguarantee(d|s)?\s+(financial|career|business|relocation)?\s*(success|wealth|profit|returns?)\b/i, /\binvest\s+in\b/i,
  /\brecommend(ed|s)?\s+(stock|fund|bond|security|securities|lender|lawyer|doctor|treatment)\b/i,
  /\blegal\s+advice\b/i, /\bmedical\s+advice\b/i, /\bfinancial\s+advice\b/i, /\bwill\s+win\s+the\s+(case|lawsuit)\b/i,
  /\bbest\s+(period|time|phase)\s+of\s+(your|his|her|their)\s+life\b/i, /\bworst\s+(period|time|phase)\b/i,
  /\bdefinitely\s+(change|happen|occur)\b/i, /\byour\s+life\s+will\s+definitely\b/i,
  /\bbest\s+window\b/i, /\bworst\s+window\b/i, /\branked?\s+(number\s*one|#\s*1|top)\b/i
];

window.MAJORLIFETRANSITION_RULES = [
  { id: 'MLT-FOUNDATION-001', category: 'Classical Parashari house principle', provenance: 'classical', name: 'Independent transition-sensitive house foundation', description: 'The 1st, 4th, 7th, 9th, 10th and 12th houses (plus the 2nd/8th/11th and supporting 3rd/5th/6th) are treated as this module\'s own lightweight foundation for life-phase-change sensitivity, independent of (but used alongside) other modules\' outputs.', explanation: 'These houses classically govern self, home, partnership, dharma/fortune, career/status, and endings/transitions respectively — the core axis of any life-phase change.', source: 'Classical Parashari house significations (spec section 6).' },
  { id: 'MLT-SIGNATURE-001', category: 'Classical Parashari house principle', provenance: 'classical', name: 'Transition-signature house-pair connections', description: 'A narrative-only natal sensitivity assessment checks lordship connections (same lord / conjunction / mutual aspect / exchange) across the house-pairs listed for each transition-signature group (identity, career, residence, finance, relationship, education→career, spiritual).', explanation: 'Mirrors the classical technique of reading a life area through the relationship between its significator houses\' lords, never as a deterministic score.', source: 'Spec section 7-8.' },
  { id: 'MLT-NATALPATTERN-001', category: 'Classical Parashari house principle', provenance: 'application', name: 'Natal life-structure pattern is narrative only', description: 'evaluateLifeTransitionNatalPattern() classifies Strong/Moderate/Contextual/Limited transition sensitivity but never gates or overrides the structural (domain-independence) classification of any specific candidate window.', explanation: 'Keeps the independent foundation layer strictly supportive/contextual, matching the spec\'s "narrative only, never deterministic" instruction.', source: 'Spec section 8.' },
  { id: 'MLT-DASHA-001', category: 'Vimshottari Dasha activation', provenance: 'classical', name: 'Multi-domain dasha synthesis', description: 'evaluateLifeTransitionDasha() looks at which houses the current Mahadasha/Antardasha/Pratyantardasha lords own or occupy and maps them to domains (e.g. 10th+12th+4th lords active together is illustrative of career/residence change; 2nd+8th+11th is illustrative of financial restructuring). These are illustrative examples only, never an exhaustive or deterministic rule set.', explanation: 'Classical Dasha activation theory: a lord\'s own house significations manifest during its period.', source: 'Spec section 10-11.' },
  { id: 'MLT-TRANSIT-001', category: 'Transit confirmation', provenance: 'classical', name: 'Jupiter/Saturn as transition triggers', description: 'Jupiter transiting a transition-relevant house is read as a possible expansion/development trigger; Saturn as a possible structural/consolidation trigger — both only when also confirmed by natal and dasha context, never automatically positive or negative.', explanation: 'Classical significations of Jupiter (growth, opportunity) and Saturn (structure, discipline, closure) as transit triggers.', source: 'Spec section 12-14.' },
  { id: 'MLT-DIVISIONAL-001', category: 'Divisional-chart confirmation', provenance: 'classical', name: 'Divisional-chart support where already available', description: 'Where a contributing source module already carries D10 (career), D4 (residence), D9 (relationship), D2 (finance), D24 (education) or D7/D16 confirmation, that support is carried through unchanged; this module never independently computes a new divisional-chart position.', explanation: 'Avoids duplicating divisional-chart calculation that individual timing modules already own.', source: 'Spec section 15.' },
  { id: 'MLT-REUSE-001', category: 'Existing application timing module', provenance: 'application', name: 'Reuse LifeTimeline\'s normalization/dedup layer', description: 'This module reads window.LifeTimeline.refresh()\'s already-normalized, already-deduplicated eventClusters/windows (normalized TimingWindow shape, edge-bounded correlated-event merge) instead of re-querying all ~27 timing modules and re-implementing normalization or clustering.', explanation: 'LifeTimeline (js/lifeTimeline/lifeTimelineEngine.js) already solved normalization and the transitive-chaining dedup bug with an edge-bounded chronological merge; re-deriving that logic here would risk reintroducing the same bug.', source: 'Discovery inventory — Life Timeline module notes.' },
  { id: 'MLT-DOMAININDEP-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Domain independence vs related sub-events', description: 'calculateDomainIndependence() distinguishes "Independent domain evidence" (members span 2+ genuinely distinct domains, e.g. Career + Residence + Finance) from "Related sub-events" (all members share one domain, e.g. Promotion + Salary Increase, both Career) — the former alone can support a multi-domain transition classification.', explanation: 'Directly implements the spec\'s central double-counting-avoidance requirement (section 34) as a hard structural gate, not just a display label.', source: 'Spec section 34.' },
  { id: 'MLT-GATE-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Single-domain results are never labeled a major life transition', description: 'A cluster with only one distinct domain (whether a single window or several related sub-events of the same module/domain) is always classified "Single-Domain Transition" or "Sequential Transition Pattern" and is structurally prevented from being labeled "Major Life Transition", "Strong Multi-Domain Convergence" or "Moderate Multi-Domain Convergence" regardless of how many related windows it contains.', explanation: 'Direct restatement of spec section 20\'s explicit instruction, implemented as a hard gate in classifyTransitionStrength(), not merely a display choice.', source: 'Spec section 20.' },
  { id: 'MLT-DEDUP-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Evidence deduplication within a cluster', description: 'When building a cluster\'s interpretation, duplicate/near-identical date windows, descriptions, dasha explanations and house-logic strings contributed by different member windows are merged rather than repeated verbatim multiple times.', explanation: 'Prevents the same underlying evidence sentence appearing twice just because two source modules independently stated it.', source: 'Spec section 35.' },
  { id: 'MLT-SEQUENCE-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Chronological sequence, never causation', description: 'The transition sequence display orders candidate transitions chronologically with arrows, describing a "timing sequence showing a cluster of related life-domain activations" and never stating or implying that an earlier window causes a later one.', explanation: 'Avoids deterministic causal claims the underlying astrology cannot support.', source: 'Spec section 17, 22.' },
  { id: 'MLT-HISTORICAL-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Retrospective comparison only, never rule-tuning', description: 'Any historical/retrospective comparison this module offers is explicitly labeled "Retrospective astrological comparison — not statistical proof," and this module\'s rules are never tuned to fit a particular chart\'s past outcomes.', explanation: 'Direct restatement of spec section 36.', source: 'Spec section 36.' },
  { id: 'MLT-SAFETY-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Preserve source-module safety language verbatim', description: 'Each contributing module\'s own reasons/cautions/disclaimer text, as carried through from window.LifeTimeline, is displayed unmodified; only this module\'s own synthesized narrative sentences are passed through this module\'s own forbidden-language scanner.', explanation: 'A sensitive module\'s (Health, Marriage Separation/Divorce, Legal, Inheritance, Spiritual) careful wording must never be reworded into something less careful by this synthesis layer.', source: 'Spec section 33-34.' },
  { id: 'MLT-NODEATH-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'No death/lifespan/diagnosis/guarantee synthesis language', description: 'This module\'s own narrative text never predicts death, lifespan, disease, accidents, another person\'s motives, or guarantees marriage/divorce/relocation/business/investment/career outcomes, never ranks windows as best/worst, and never gives investment, legal, or medical advice.', explanation: 'Direct restatement of spec section 33 at this synthesis layer.', source: 'Spec section 33.' },
  { id: 'MLT-FILTER-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Presentation filters never recalculate', description: 'Transition Focus and Transition Type filters only slice the already-computed result object; changing them never re-invokes the chart engine, window.LifeTimeline, or any underlying timing module.', explanation: 'Keeps the calculation layer and presentation layer separated, matching the established pattern from every prior timing module.', source: 'Spec section 28.' },
  { id: 'MLT-MISSING-001', category: 'Existing application timing module', provenance: 'application', name: 'Graceful degradation when LifeTimeline/source modules are absent', description: 'If window.LifeTimeline is absent or its refresh() throws or returns null, this module returns null gracefully rather than failing; any individual source module missing from window.LifeTimeline\'s own integration is likewise simply absent from this module\'s clusters.', explanation: 'Matches the defensive idiom used across the whole codebase for optional module dependencies.', source: 'Discovery inventory — defensive cross-module idiom.' }
];
