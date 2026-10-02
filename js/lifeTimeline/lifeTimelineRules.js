/* =========================================================
   IMPORTANT EVENT SEQUENCE / LIFE TIMELINE — rule/provenance database
   and static registries for the synthesis-layer module. This file does
   NOT define any new astrological calculation rule (house/dasha/transit/
   divisional-chart rules all remain owned by the individual timing
   modules listed in MODULE_REGISTRY below). It documents only this
   module's own synthesis-layer rules: normalization, deduplication,
   correlation grouping, overlap/sequence detection and life-phase
   clustering (spec section 26, "multi-domain synthesis rule" category).
   ========================================================= */

// ---------------------------------------------------------------------
// Module registry — every existing timing module this layer MAY consume.
// `global` = window.<Name>Timing engine name (verified in discovery
// inventory). `domain` follows spec section 6's nine domains. Only
// modules that actually exist with a working .refresh() are used at
// runtime (engine checks `window[global] && typeof .refresh === 'function'`
// defensively) — this static list simply enumerates candidates.
// ---------------------------------------------------------------------
window.LIFETIMELINE_MODULE_REGISTRY = [
  { id: 'careerStart', global: 'CareerStartTiming', label: 'Career Start', domain: 'Career' },
  { id: 'jobChange', global: 'JobChangeTiming', label: 'Job Change', domain: 'Career' },
  { id: 'promotion', global: 'PromotionTiming', label: 'Promotion', domain: 'Career' },
  { id: 'salaryIncome', global: 'SalaryIncomeTiming', label: 'Salary / Income Increase', domain: 'Career' },
  { id: 'careerTurningPoint', global: 'CareerTurningPointTiming', label: 'Major Career Turning Point', domain: 'Career' },
  { id: 'businessStart', global: 'BusinessStartTiming', label: 'Business Start', domain: 'Career' },
  { id: 'recognitionAward', global: 'RecognitionAwardTiming', label: 'Recognition / Award', domain: 'Career' },
  { id: 'retirement', global: 'RetirementTiming', label: 'Retirement', domain: 'Career' },

  { id: 'financialGain', global: 'FinancialGainTiming', label: 'Financial Gain / Wealth Accumulation', domain: 'Finance' },
  { id: 'majorExpenditure', global: 'MajorExpenditureTiming', label: 'Major Expenditure / Financial Commitment', domain: 'Finance' },
  { id: 'loanDebtRelief', global: 'LoanDebtReliefTiming', label: 'Loan / Debt Relief', domain: 'Finance' },
  { id: 'insuranceProtection', global: 'InsuranceProtectionTiming', label: 'Insurance / Financial Protection', domain: 'Finance' },
  { id: 'wealthProtection', global: 'WealthProtectionTiming', label: 'Wealth Protection / Asset Consolidation', domain: 'Finance' },
  { id: 'inheritanceLegacy', global: 'InheritanceLegacyTiming', label: 'Inheritance / Legacy', domain: 'Finance' },

  { id: 'property', global: 'PropertyTiming', label: 'Property Purchase', domain: 'Property/Residence' },
  { id: 'propertySale', global: 'PropertySaleTiming', label: 'Property Sale', domain: 'Property/Residence' },
  { id: 'homeConstruction', global: 'HomeConstructionTiming', label: 'Home Construction / Renovation', domain: 'Property/Residence' },
  { id: 'foreignTravel', global: 'ForeignTravelTiming', label: 'Foreign Travel / Settlement (Relocation)', domain: 'Property/Residence' },
  { id: 'vehiclePurchase', global: 'VehiclePurchaseTiming', label: 'Vehicle Purchase', domain: 'Property/Residence' },

  { id: 'relationshipPartnership', global: 'RelationshipPartnershipTiming', label: 'Relationship / Partnership Start', domain: 'Relationship/Family' },
  { id: 'marriage', global: 'MarriageTiming', label: 'Marriage Timing', domain: 'Relationship/Family' },
  { id: 'marriageSeparationDivorce', global: 'MarriageSeparationDivorceTiming', label: 'Marriage Separation / Divorce', domain: 'Relationship/Family' },
  { id: 'childbirth', global: 'ChildbirthTiming', label: 'Childbirth', domain: 'Relationship/Family' },
  { id: 'childEducation', global: 'ChildEducationTiming', label: 'Child Education / Academic Milestone', domain: 'Relationship/Family' },

  { id: 'higherEducation', global: 'HigherEducationTiming', label: 'Higher Education / Degree', domain: 'Education' },

  { id: 'healthRecovery', global: 'HealthRecoveryTiming', label: 'Health & Recovery', domain: 'Health' },

  { id: 'legalMatter', global: 'LegalMatterTiming', label: 'Legal Matter Resolution', domain: 'Legal/Structural' },

  { id: 'spiritualTurningPoint', global: 'SpiritualTurningPointTiming', label: 'Spiritual Turning Point', domain: 'Spiritual/Personal' }
];

window.LIFETIMELINE_DOMAINS = ['All', 'Career', 'Finance', 'Property/Residence', 'Relationship/Family', 'Education', 'Health', 'Legal/Structural', 'Spiritual/Personal'];

// ---------------------------------------------------------------------
// Correlation groups (spec section 9 + 36) — module-id sets this
// synthesis layer treats as plausibly ONE underlying activation when
// their windows overlap or sit in close sequence (<= 6 months apart).
// A cluster's display label is drawn from here when the member module
// set matches (or is a subset of) a named group; otherwise a generic
// domain-based label is built. This table never invents a new
// astrological rule — it only encodes which of the existing timing
// modules' outputs are known to frequently co-occur in real usage.
// ---------------------------------------------------------------------
window.LIFETIMELINE_CORRELATION_GROUPS = [
  { id: 'career-advancement', label: 'Career Advancement', modules: ['promotion', 'salaryIncome', 'recognitionAward'] },
  { id: 'career-change', label: 'Career Change / Transition', modules: ['jobChange', 'careerTurningPoint', 'businessStart'] },
  { id: 'property-acquisition', label: 'Property Acquisition / Financial Commitment', modules: ['property', 'loanDebtRelief', 'majorExpenditure', 'homeConstruction'] },
  { id: 'relocation', label: 'Relocation / Settlement', modules: ['foreignTravel', 'property', 'homeConstruction'] },
  { id: 'retirement-consolidation', label: 'Retirement & Financial Consolidation', modules: ['retirement', 'wealthProtection', 'financialGain', 'loanDebtRelief'] },
  { id: 'education-to-career', label: 'Education → Career Transition', modules: ['higherEducation', 'careerStart'] },
  { id: 'inheritance-settlement', label: 'Inheritance / Legacy Settlement', modules: ['inheritanceLegacy', 'legalMatter', 'propertySale'] },
  { id: 'relationship-formation', label: 'Relationship / Marriage Formation', modules: ['relationshipPartnership', 'marriage'] },
  { id: 'family-formation', label: 'Family Formation', modules: ['marriage', 'childbirth'] },
  { id: 'health-stabilization', label: 'Health Recovery / Stabilization', modules: ['healthRecovery'] },
  { id: 'asset-protection', label: 'Asset / Financial Protection', modules: ['insuranceProtection', 'wealthProtection'] }
];

// ---------------------------------------------------------------------
// Life-phase cluster templates (spec section 13) — higher-level phases
// built from correlated-event clusters / standalone events that
// converge in time. Matching is "any member module present", not
// "all required" (real charts rarely activate every listed module at
// once).
// ---------------------------------------------------------------------
window.LIFETIMELINE_PHASE_TEMPLATES = [
  { id: 'career-expansion', label: 'Career Expansion Phase', modules: ['promotion', 'salaryIncome', 'recognitionAward'] },
  { id: 'career-transition', label: 'Career Transition Phase', modules: ['jobChange', 'careerTurningPoint', 'foreignTravel'] },
  { id: 'family-formation', label: 'Family Formation Phase', modules: ['relationshipPartnership', 'marriage', 'childbirth'] },
  { id: 'asset-acquisition', label: 'Asset Acquisition Phase', modules: ['property', 'vehiclePurchase', 'majorExpenditure', 'loanDebtRelief'] },
  { id: 'financial-consolidation', label: 'Financial Consolidation Phase', modules: ['financialGain', 'loanDebtRelief', 'wealthProtection', 'insuranceProtection', 'inheritanceLegacy'] },
  { id: 'retirement-transition', label: 'Retirement Transition Phase', modules: ['retirement', 'foreignTravel', 'wealthProtection'] },
  { id: 'spiritual-reorientation', label: 'Spiritual Reorientation Phase', modules: ['spiritualTurningPoint', 'foreignTravel'] },
  { id: 'education-career', label: 'Education → Career Phase', modules: ['higherEducation', 'careerStart'] }
];

// ---------------------------------------------------------------------
// Overlap proximity thresholds (spec section 11), in days.
// ---------------------------------------------------------------------
window.LIFETIMELINE_PROXIMITY_DAYS = { sameMonth: 31, threeMonths: 93, sixMonths: 186, twelveMonths: 372 };

// ---------------------------------------------------------------------
// This module's own forbidden-language scanner patterns (spec section
// 34) — applied ONLY to text this module itself synthesizes (cluster
// interpretation sentences, life-phase/next-cluster summaries). Each
// source module's own reasons/cautions/disclaimer text is passed through
// verbatim and is NEVER re-scanned or re-worded here, per the spec's
// "preserve the underlying module's safety restrictions verbatim"
// instruction.
// ---------------------------------------------------------------------
window.LIFETIMELINE_FORBIDDEN_PATTERNS = [
  /\bwill\s+(die|pass\s+away)\b/i, /\bdate\s+of\s+death\b/i, /\blifespan\b/i, /\blife\s+expectancy\b/i,
  /\b(fatal|terminal)\s+(illness|disease|accident)\b/i, /\bwill\s+be\s+diagnosed\b/i, /\bmedical\s+diagnos/i,
  /\bwill\s+have\s+an?\s+accident\b/i, /\bmental[- ]health\s+diagnos/i, /\b(he|she|they)\s+(secretly|really)\s+(wants|intends|plans)\b/i,
  /\bguarantee(d|s)?\s+(marriage|divorce|childbirth|a\s+child)\b/i, /\bwill\s+(definitely|certainly)\s+(marry|divorce|have\s+a\s+child)\b/i,
  /\bguarantee(d|s)?\s+(financial\s+success|wealth|profit|returns?)\b/i, /\binvest\s+in\b/i,
  /\brecommend(ed|s)?\s+(stock|fund|bond|security|securities|lender|lawyer|doctor|treatment)\b/i,
  /\blegal\s+advice\b/i, /\bmedical\s+advice\b/i, /\bwill\s+win\s+the\s+(case|lawsuit)\b/i,
  /\bevent\s+a\s+causes\s+event\s+b\b/i, /\bcauses\b/i
];

window.LIFETIMELINE_RULES = [
  { id: 'LIFETL-REUSE-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Consume, never recompute', description: 'This module only consumes already-computed .refresh() output of existing timing modules; it never independently calculates a new planetary, house, dasha, transit, or divisional-chart position.', explanation: 'Prevents duplicate/competing astrological calculations across the application.', source: 'Application architecture (this module\'s own design rule).' },
  { id: 'LIFETL-NORM-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Normalized TimingWindow interface', description: 'Every consumed candidate window is converted into one common TimingWindow shape (domain, eventType, dasha, houses, evidenceLevel, trace, provenance) before any further processing.', explanation: 'Lets dissimilar module output shapes be compared, deduplicated and sequenced consistently.', source: 'Spec section 5.' },
  { id: 'LIFETL-DEDUP-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Event deduplication', description: 'Windows from modules in the same correlation group that overlap or sit within 6 months of each other are merged into one correlated-event cluster rather than listed as independent top-level events.', explanation: 'Prevents Promotion + Salary Increase (etc.) from being double-counted as two unrelated major events.', source: 'Spec section 8-9, 36.' },
  { id: 'LIFETL-DOMDIV-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Independent domain diversity', description: 'A cluster\'s significance tier is influenced by calculateDomainDiversity() — the count of DISTINCT life domains among its member windows, not the raw count of windows.', explanation: 'Career+Residence+Finance converging is treated as more significant than three career-only windows from one activation.', source: 'Spec section 10, 36.' },
  { id: 'LIFETL-OVERLAP-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Overlap classification', description: 'Pairs of windows are classified as exact overlap, partial overlap, or close sequence (within 3/6/12 months), using only date arithmetic on each module\'s own startDate/endDate.', explanation: 'Supplies the basis for both clustering and sequencing without any new astrological computation.', source: 'Spec section 11.' },
  { id: 'LIFETL-SEQ-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Chronological sequence, never causation', description: 'buildEventSequence() orders clusters/events chronologically and labels gaps as Direct/Progressive/Transitional/Long-cycle; it never states or implies that an earlier event causes a later one.', explanation: 'Avoids deterministic causal claims the underlying astrology cannot support.', source: 'Spec section 12, 37.' },
  { id: 'LIFETL-CLUSTERSEP-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Cluster separation', description: 'Two events/clusters are kept separate when they belong to unrelated domains, are far apart in time, and have no correlation-group or life-phase-template support.', explanation: 'Prevents, e.g., a 2027 career event and an unrelated 2034 property event from being forced into one "life transition".', source: 'Spec section 38.' },
  { id: 'LIFETL-PHASE-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Life-phase clustering', description: 'buildLifePhaseClusters() groups correlated-event clusters/standalone events that overlap in time against named phase templates (Career Expansion, Asset Acquisition, Retirement Transition, etc.); an unmatched multi-domain convergence is labeled a generic Life Transition.', explanation: 'Gives the highest-level, most meaningful grouping without fabricating a scored prediction.', source: 'Spec section 13.' },
  { id: 'LIFETL-TIER-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Qualitative importance tiers only', description: 'Events/clusters are labeled Primary/Secondary/Contextual/Correlated Event qualitatively; no numeric score is ever displayed in the UI.', explanation: 'Keeps significance classification honest about its qualitative, non-statistical nature.', source: 'Spec section 7, 10.' },
  { id: 'LIFETL-FILTER-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Presentation filters never recalculate', description: 'Time Horizon, Domain, Evidence, and Display-Mode filters only slice the already-computed result object; changing them never re-invokes the chart engine or re-generates the horoscope.', explanation: 'Keeps the calculation layer, synthesis layer and presentation layer separated per spec section 39-40.', source: 'Spec section 28, 39.' },
  { id: 'LIFETL-SAFETY-001', category: 'Safety rule', provenance: 'application', name: 'Preserve source-module safety language verbatim', description: 'Each contributing module\'s own reasons/cautions/disclaimer text is displayed unmodified; only this module\'s own synthesized narrative sentences are passed through this module\'s own forbidden-language scanner.', explanation: 'A sensitive module\'s (Health, Marriage Separation/Divorce, Legal, Inheritance, Spiritual) careful wording must never be reworded into something less careful by the aggregation layer.', source: 'Spec section 34.' },
  { id: 'LIFETL-NODEATH-001', category: 'Safety rule', provenance: 'application', name: 'No death/lifespan/diagnosis synthesis language', description: 'This module\'s own narrative text never predicts death, lifespan, disease, accidents, another person\'s motives, or guarantees marriage/divorce/childbirth/financial outcomes, and never gives investment, legal, or medical advice.', explanation: 'Direct restatement of spec section 34 at the synthesis layer.', source: 'Spec section 34.' },
  { id: 'LIFETL-NOPOLITICAL-001', category: 'Safety rule', provenance: 'application', name: 'No political/election prediction', description: 'This module contains no election, political, or public-figure prediction logic of any kind.', explanation: 'Direct restatement of spec section 35.', source: 'Spec section 35.' },
  { id: 'LIFETL-MISSING-001', category: 'Multi-domain synthesis rule', provenance: 'application', name: 'Graceful degradation for absent modules', description: 'Any module in the registry that is absent, or whose .refresh() throws or returns a non-array/non-object-pair window shape, is silently skipped; the timeline never fails for a missing optional module.', explanation: 'Matches the MarriageTiming object-shape gotcha and general defensive idiom already established across this codebase.', source: 'Discovery inventory — defensive cross-module idiom.' }
];
