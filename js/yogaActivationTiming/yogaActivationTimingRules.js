/* =========================================================
   YOGA ACTIVATION TIMING — rule/provenance database.
   This module does NOT re-derive yoga FORMATION rules (those remain solely
   in js/yogas/yogaRules.js / yogaEngine.js — see
   docs/yogaActivationTiming/research-notes.md for how they are reused here
   without duplication). This file only documents:
     (a) the domain/category mapping applied to each existing yoga key,
     (b) the activation-pipeline rules (dasha/transit/divisional/convergence),
     (c) safety rules.
   ========================================================= */

// Section 14/15 — Yoga -> domain mapping, and Yoga -> existing-timing-module
// correlation targets. Keyed by the SAME `key` values as YOGA_DEFINITIONS in
// js/yogas/yogaRules.js (verified by direct read of that file — not guessed).
window.YOGA_DOMAIN_MAP = {
  // Pancha Mahapurusha Yogas — never auto-equated with "promotion" or a
  // specific government post (Section 27); read via actual houses/planets,
  // then connected to whichever existing module is actually active.
  ruchaka:      { domain: 'Career/Authority',     vargas: ['D10', 'D9'], modules: ['PromotionTiming', 'RecognitionAwardTiming', 'CareerTurningPointTiming', 'BusinessStartTiming'] },
  bhadra:       { domain: 'Career/Intellect',     vargas: ['D10', 'D9'], modules: ['CareerStartTiming', 'JobChangeTiming', 'HigherEducationTiming'] },
  hamsa:        { domain: 'Career/Wisdom',        vargas: ['D10', 'D9'], modules: ['RecognitionAwardTiming', 'SpiritualTurningPointTiming', 'RetirementTiming'] },
  malavya:      { domain: 'Wealth/Comfort',       vargas: ['D9', 'D4'],  modules: ['FinancialGainTiming', 'PropertyTiming', 'MarriageTiming'] },
  sasha:        { domain: 'Career/Authority',     vargas: ['D10', 'D9'], modules: ['PromotionTiming', 'CareerTurningPointTiming', 'RetirementTiming'] },
  gajakesari:   { domain: 'Career/Reputation',    vargas: ['D9', 'D10'], modules: ['RecognitionAwardTiming', 'PromotionTiming'] },
  budhaditya:   { domain: 'Education/Career',     vargas: ['D9', 'D24', 'D10'], modules: ['HigherEducationTiming', 'CareerStartTiming', 'RecognitionAwardTiming'] },
  chandramangal:{ domain: 'Wealth/Drive',         vargas: ['D2', 'D9'],  modules: ['FinancialGainTiming', 'BusinessStartTiming', 'SalaryIncomeTiming'] },
  dhana:        { domain: 'Wealth',               vargas: ['D2', 'D9'],  modules: ['FinancialGainTiming', 'SalaryIncomeTiming', 'WealthProtectionTiming', 'MajorExpenditureTiming', 'BusinessStartTiming'] },
  raja:         { domain: 'Career/Status',        vargas: ['D10', 'D9'], modules: ['CareerStartTiming', 'PromotionTiming', 'JobChangeTiming', 'CareerTurningPointTiming', 'RecognitionAwardTiming', 'RetirementTiming'] },
  neechabhanga: { domain: 'Career/Resilience',    vargas: ['D9', 'D10'], modules: ['CareerTurningPointTiming', 'PromotionTiming'] },
  adhi:         { domain: 'General Wellbeing',    vargas: ['D9'],        modules: [] },
  sunapha:      { domain: 'Wealth/Self-Effort',   vargas: ['D2', 'D9'],  modules: ['FinancialGainTiming', 'SalaryIncomeTiming'] },
  anapha:       { domain: 'General Wellbeing',    vargas: ['D9'],        modules: [] },
  durudhara:    { domain: 'Wealth/Comfort',       vargas: ['D2', 'D4', 'D9'], modules: ['FinancialGainTiming', 'VehiclePurchaseTiming', 'PropertyTiming'] },
  vasumati:     { domain: 'Wealth',               vargas: ['D2', 'D9'],  modules: ['FinancialGainTiming', 'SalaryIncomeTiming'] },
  amala:        { domain: 'Career/Reputation',    vargas: ['D10', 'D9'], modules: ['RecognitionAwardTiming', 'PromotionTiming'] },
  saraswati:    { domain: 'Education',            vargas: ['D24', 'D9'], modules: ['HigherEducationTiming', 'ChildEducationTiming'] },
  lakshmi:      { domain: 'Wealth/Fortune',       vargas: ['D9', 'D2'],  modules: ['FinancialGainTiming', 'WealthProtectionTiming'] },
  kahala:       { domain: 'Career/Authority',     vargas: ['D10', 'D9'], modules: ['CareerTurningPointTiming', 'PromotionTiming'] },
  parvata:      { domain: 'General Wellbeing',    vargas: ['D9'],        modules: [] },
  chamara:      { domain: 'Career/Recognition',   vargas: ['D10', 'D9'], modules: ['RecognitionAwardTiming', 'PromotionTiming'] },
  vesi:         { domain: 'General',              vargas: ['D9'],        modules: [] },
  vasi:         { domain: 'General',              vargas: ['D9'],        modules: [] },
  ubhayachari:  { domain: 'General',              vargas: ['D9'],        modules: [] },
  // Inauspicious/challenging yogas — mapped to a "Challenge Window" domain.
  // Never framed as a guaranteed bad event; see safety rules below.
  kemadruma:    { domain: 'Challenge/Mind',        vargas: ['D9'], modules: [] },
  shakat:       { domain: 'Challenge/Finance',     vargas: ['D9', 'D2'], modules: ['FinancialGainTiming', 'MajorExpenditureTiming'] },
  grahan_sun_rahu:  { domain: 'Challenge/Authority', vargas: ['D9', 'D10'], modules: [] },
  grahan_sun_ketu:  { domain: 'Challenge/Authority', vargas: ['D9', 'D10'], modules: [] },
  grahan_moon_rahu: { domain: 'Challenge/Mind',      vargas: ['D9'], modules: [] },
  grahan_moon_ketu: { domain: 'Challenge/Mind',      vargas: ['D9'], modules: [] },
  guruchandal:  { domain: 'Challenge/Wisdom',      vargas: ['D9', 'D24'], modules: [] },
  vish:         { domain: 'Challenge/Mind',        vargas: ['D9'], modules: [] },
  angarak_rahu: { domain: 'Challenge/Property',    vargas: ['D4', 'D9'], modules: ['PropertyTiming', 'LegalMatterTiming'] },
  angarak_ketu: { domain: 'Challenge/Property',    vargas: ['D4', 'D9'], modules: ['PropertyTiming', 'LegalMatterTiming'] },
  kaalsarpa:    { domain: 'Challenge/General',     vargas: ['D9'], modules: [] },
  daridra:      { domain: 'Challenge/Finance',     vargas: ['D2', 'D9'], modules: ['FinancialGainTiming', 'LoanDebtReliefTiming'] },
  shrapit:      { domain: 'Challenge/Delay',       vargas: ['D9'], modules: [] },
  // Relationship/Property domains have no direct yoga in this engine's rule
  // list (confirmed by reading yogaRules.js in full) — domain buckets are
  // still defined here for the mapping/filter UI and for any future yoga
  // additions to yogaRules.js to pick up automatically via default fallback.
};
window.YOGA_DOMAIN_DEFAULT = { domain: 'General', vargas: ['D9'], modules: [] };

window.YOGAACTIVATION_TIMING_RULES = [
  { id: 'YOGAACT-REUSE-001', category: 'Formation Source', provenance: 'classical',
    name: 'Formation comes solely from the existing Yoga engine',
    description: 'Every yoga\'s formation/presence, polarity, magnitude and classical derivation text is obtained by calling the existing js/yogas/yogaEngine.js computeYogas() function (exposed here as window.YogaEngine.detect) — never re-derived.',
    explanation: 'This module is a synthesis/orchestration layer on top of the existing Yogas tab, not an independent yoga-detection engine.',
    source: 'js/yogas/yogaEngine.js, js/yogas/yogaRules.js (existing app engine, reused unmodified).' },
  { id: 'YOGAACT-STRENGTH-001', category: 'Formation Strength', provenance: 'application',
    name: 'Qualitative Formation Strength from existing magnitude',
    description: 'The existing engine\'s 0-100 magnitude heuristic (multiples of 5) is bucketed into Strong (>=70) / Moderate (>=40) / Contextual (>0) / Not Applicable (yoga not present in this chart).',
    explanation: 'No new numeric score is invented; magnitude is read, not recomputed.',
    source: 'Application synthesis over the existing engine\'s own magnitude field.' },
  { id: 'YOGAACT-DASHA-001', category: 'Dasha Activation', provenance: 'application',
    name: 'MD/AD/PD membership among a yoga\'s own planets',
    description: 'A yoga is "dasha-activated" when the current Mahadasha, Antardasha, or Pratyantardasha lord is one of the planets the existing engine reports as forming that yoga (result row\'s `planets` field).',
    explanation: 'All 3 levels matching => Strong; 2 => Moderate; 1 => Contextual; none => Dormant/No Current Activation.',
    source: 'Application synthesis using existing Vimshottari dasha utilities (buildSubPeriods, findCurrentIndex).' },
  { id: 'YOGAACT-TRANSIT-001', category: 'Transit Confirmation', provenance: 'application',
    name: 'Jupiter/Saturn transit over or aspecting a yoga planet\'s natal position',
    description: 'Transiting Jupiter or Saturn occupying the natal sign of, or aspecting, one of a yoga\'s own planets is read as supporting transit confirmation.',
    explanation: 'Confirmation only — never a standalone activation trigger.',
    source: 'Application synthesis using existing transit engine (computeSingleLongitude + ASPECT_OFFSETS).' },
  { id: 'YOGAACT-VARGA-001', category: 'Divisional Confirmation', provenance: 'application',
    name: 'Domain-contextual divisional-chart confirmation (D2/D4/D7/D9/D10/D16/D24)',
    description: 'Each yoga is checked in the divisional chart(s) relevant to its mapped domain (e.g. D10 for career yogas, D2/D4 for wealth/property yogas, D7 for relationship-adjacent context, D24 for education yogas, D9 for all yogas as a general confirmation layer).',
    explanation: 'Uses vargaPosition() + detailedDignity() only — never a separate divisional engine.',
    source: 'Application synthesis using existing divisional-chart engine (js/divisionalCharts.js).' },
  { id: 'YOGAACT-CROSSMODULE-001', category: 'Cross-Module Correlation', provenance: 'application',
    name: 'Reference, never duplicate, an existing timing module\'s own window',
    description: 'When a yoga\'s activation period (MD/AD or MD/AD/date-overlap) coincides with an existing timing module\'s own candidate window for a correlated domain, this module displays and references that module\'s window as supporting evidence instead of computing an independent date range for the same event.',
    explanation: 'Mandatory "do not duplicate event timing" rule (module specification, section 16).',
    source: 'Application synthesis — mandatory per module specification.' },
  { id: 'YOGAACT-CLUSTER-001', category: 'Correlation / Deduplication', provenance: 'application',
    name: 'Group correlated yoga activations from the same planetary period',
    description: 'Multiple yogas activating from the same Mahadasha+Antardasha (e.g. Raja Yoga + Dhana Yoga + a career yoga all activated by the same AD lord) are grouped into a single cluster with a domain-diversity count, not reported as N independent major life events.',
    explanation: 'Implemented by groupCorrelatedYogaActivations() / calculateYogaDomainDiversity().',
    source: 'Application synthesis — mandatory per module specification, section 32.' },
  { id: 'YOGAACT-CLASS-001', category: 'Activation Classification', provenance: 'application',
    name: 'Qualitative-only Activation Level',
    description: 'Activation Level is always one of Strong / Moderate / Contextual / Dormant-No-Current-Activation — never a numeric "yoga power score".',
    explanation: 'Derived from the convergence of dasha + transit + divisional + (when present) cross-module confirmation.',
    source: 'Application synthesis per module specification, section 17.' },
  { id: 'YOGAACT-RAJA-001', category: 'Special Handling', provenance: 'application',
    name: 'Raja Yoga is never auto-equated with "promotion" or "government position"',
    description: 'Raja Yoga (and Neecha Bhanga Raja Yoga) is interpreted via the actual Kendra/Trikona houses and planets the existing engine reports, then connected only to whichever existing career/recognition/business module is itself showing an active window during the same period.',
    explanation: 'The word "promotion" or "government post" is never generated directly from Raja Yoga\'s presence alone.',
    source: 'Application synthesis — mandatory per module specification, section 27.' },
  { id: 'YOGAACT-DHANA-001', category: 'Special Handling', provenance: 'application',
    name: 'Dhana Yoga is never equated with an exact wealth amount',
    description: 'Dhana Yoga activation is described qualitatively (supportive period for wealth-related themes) and never assigned a rupee/dollar figure or guaranteed amount.',
    explanation: 'Enforced in both engine wording and UI rendering; scanned by the safety filter.',
    source: 'Application synthesis — mandatory per module specification, section 28.' },
  { id: 'YOGAACT-VIPARITA-001', category: 'Special Handling', provenance: 'application',
    name: 'Viparita-related (Dusthana-lord) combinations read as reversal-of-fortune context, not guaranteed gain',
    description: 'Where the existing engine\'s results touch Dusthana-lord patterns (e.g. Daridra Yoga\'s 6th/8th/12th-lord connections), this module reads any apparent reversal contextually and never promises a sudden windfall from adversity.',
    explanation: 'Qualitative, cautious language only.',
    source: 'Application synthesis — per module specification, section 29.' },
  { id: 'YOGAACT-NEECHABHANGA-001', category: 'Special Handling', provenance: 'application',
    name: 'Neecha Bhanga read exactly as the existing engine defines it',
    description: 'Neecha Bhanga Raja Yoga activation uses the existing engine\'s own single cancellation-condition check (neechaBhangaYoga in yogaRules.js) without adding further cancellation conditions not already implemented there.',
    explanation: 'Avoids inventing additional classical conditions beyond what the existing, reused engine already computes.',
    source: 'js/yogas/yogaRules.js (existing engine, reused unmodified), module specification section 30.' },
  { id: 'YOGAACT-NOGUARANTEE-001', category: 'Safety', provenance: 'application',
    name: 'No event-guarantee language',
    description: 'This module never states that a yoga guarantees any event, and never predicts death, lifespan, illness, accidents, mental-health outcomes, guaranteed marriage, guaranteed childbirth, a guaranteed financial amount, a guaranteed promotion, guaranteed business success, and never gives investment, legal or medical advice.',
    explanation: 'Hard safety boundary enforced in engine wording and verified by an automated forbidden-language scan.',
    source: 'Application synthesis — mandatory per module specification, section 2 and section 38.' },
  { id: 'YOGAACT-FILTER-001', category: 'UI', provenance: 'application',
    name: 'Filters never recalculate the horoscope',
    description: 'Category/Activation-Level/Time-horizon filters only change which already-computed rows are displayed; they never re-run chart/dasha calculation.',
    explanation: 'Implemented by filtering the cached refresh() result client-side in the UI layer.',
    source: 'Application synthesis per module specification, section 33.' }
];
