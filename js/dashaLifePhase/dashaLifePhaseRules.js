/* =========================================================
   DASHA-BASED LIFE PHASE ANALYSIS — rule/provenance database.
   This module does NOT re-derive Dasha calculation (state.dasha /
   buildSubPeriods / findCurrentIndex remain the sole source — see
   js/dasha/vimshottariDasha.js) and does NOT create a new lordship/
   dignity engine (detailedDignity / SIGN_LORD / vargaPosition remain the
   sole source). This file documents:
     (a) the house -> life-phase-theme priority mapping used to classify
         a Mahadasha lord's thematic weight (spec sections 5-7),
     (b) natural-significator (karaka) theme contributions,
     (c) the twelve broad life-phase themes (spec section 4),
     (d) dasha-hierarchy and safety rules.
   ========================================================= */

// Section 4 — the twelve broad life-phase themes this module ever assigns.
window.DASHALIFEPHASE_THEMES = [
  'Career/Responsibility', 'Wealth/Resources', 'Family/Relationships', 'Property/Residence',
  'Education/Learning', 'Business/Partnership', 'Travel/Relocation', 'Transformation/Restructuring',
  'Spiritual/Inner Development', 'Health/Recovery Context', 'Consolidation/Preservation', 'Mixed/Multi-Domain'
];

// Section 5-7 — house -> theme weight map. A house's lord owning/occupying it
// contributes weight to the listed theme(s). Not a lordship engine: this is a
// pure data table consumed by the engine's own house-lord lookups
// (state.chart.planets / detailedDignity), never a recomputation of who owns
// what. Classical house significations (Parashara, Brihat Parashara Hora
// Shastra, house-signification chapters) as applied generally across this
// codebase's other timing modules.
window.DASHALIFEPHASE_HOUSE_THEME_MAP = {
  1: [{ theme: 'Transformation/Restructuring', weight: 1 }, { theme: 'Health/Recovery Context', weight: 1 }],
  2: [{ theme: 'Wealth/Resources', weight: 2 }, { theme: 'Family/Relationships', weight: 1 }],
  3: [{ theme: 'Travel/Relocation', weight: 1 }, { theme: 'Business/Partnership', weight: 1 }],
  4: [{ theme: 'Property/Residence', weight: 2 }, { theme: 'Family/Relationships', weight: 1 }],
  5: [{ theme: 'Education/Learning', weight: 2 }, { theme: 'Family/Relationships', weight: 1 }],
  6: [{ theme: 'Health/Recovery Context', weight: 1 }, { theme: 'Consolidation/Preservation', weight: 1 }],
  7: [{ theme: 'Business/Partnership', weight: 2 }, { theme: 'Family/Relationships', weight: 1 }],
  8: [{ theme: 'Transformation/Restructuring', weight: 2 }, { theme: 'Health/Recovery Context', weight: 1 }],
  9: [{ theme: 'Spiritual/Inner Development', weight: 1 }, { theme: 'Education/Learning', weight: 1 }, { theme: 'Travel/Relocation', weight: 1 }],
  10: [{ theme: 'Career/Responsibility', weight: 2 }],
  11: [{ theme: 'Wealth/Resources', weight: 1 }, { theme: 'Career/Responsibility', weight: 1 }],
  12: [{ theme: 'Spiritual/Inner Development', weight: 1 }, { theme: 'Travel/Relocation', weight: 1 }, { theme: 'Consolidation/Preservation', weight: 1 }]
};

// Natural-significator (karaka) theme contribution — secondary weight only,
// applied on top of house ownership/occupation, never standing alone.
window.DASHALIFEPHASE_PLANET_THEME_MAP = {
  Sun: [{ theme: 'Career/Responsibility', weight: 1 }],
  Moon: [{ theme: 'Family/Relationships', weight: 1 }],
  Mars: [{ theme: 'Property/Residence', weight: 1 }, { theme: 'Transformation/Restructuring', weight: 1 }],
  Mercury: [{ theme: 'Education/Learning', weight: 1 }, { theme: 'Business/Partnership', weight: 1 }],
  Jupiter: [{ theme: 'Wealth/Resources', weight: 1 }, { theme: 'Spiritual/Inner Development', weight: 1 }],
  Venus: [{ theme: 'Family/Relationships', weight: 1 }, { theme: 'Business/Partnership', weight: 1 }],
  Saturn: [{ theme: 'Career/Responsibility', weight: 1 }, { theme: 'Consolidation/Preservation', weight: 1 }],
  Rahu: [{ theme: 'Transformation/Restructuring', weight: 1 }, { theme: 'Travel/Relocation', weight: 1 }],
  Ketu: [{ theme: 'Spiritual/Inner Development', weight: 1 }, { theme: 'Transformation/Restructuring', weight: 1 }]
};

// Theme -> relevant divisional chart(s) and theme -> existing-timing-module
// correlation targets (section 13-15, "reference, never re-time").
window.DASHALIFEPHASE_THEME_MODULE_MAP = {
  'Career/Responsibility': { vargas: ['D10', 'D9'], modules: ['CareerStartTiming', 'PromotionTiming', 'JobChangeTiming', 'CareerTurningPointTiming', 'RecognitionAwardTiming', 'RetirementTiming', 'BusinessStartTiming'] },
  'Wealth/Resources': { vargas: ['D2', 'D9'], modules: ['FinancialGainTiming', 'WealthProtectionTiming', 'MajorExpenditureTiming', 'LoanDebtReliefTiming', 'InheritanceLegacyTiming'] },
  'Family/Relationships': { vargas: ['D9', 'D7'], modules: ['MarriageTiming', 'ChildbirthTiming', 'MarriageSeparationDivorceTiming'] },
  'Property/Residence': { vargas: ['D4', 'D9'], modules: ['PropertyTiming', 'PropertySaleTiming', 'HomeConstructionTiming', 'VehiclePurchaseTiming'] },
  'Education/Learning': { vargas: ['D24', 'D9'], modules: ['HigherEducationTiming', 'ChildEducationTiming'] },
  'Business/Partnership': { vargas: ['D10', 'D7'], modules: ['BusinessStartTiming', 'LegalMatterTiming'] },
  'Travel/Relocation': { vargas: ['D9', 'D16'], modules: ['ForeignTravelTiming'] },
  'Transformation/Restructuring': { vargas: ['D9'], modules: ['LegalMatterTiming', 'LoanDebtReliefTiming'] },
  'Spiritual/Inner Development': { vargas: ['D9', 'D24'], modules: [] },
  'Health/Recovery Context': { vargas: ['D9', 'D16'], modules: ['HealthRecoveryTiming'] },
  'Consolidation/Preservation': { vargas: ['D2', 'D9'], modules: ['WealthProtectionTiming', 'RetirementTiming'] },
  'Mixed/Multi-Domain': { vargas: ['D9'], modules: [] }
};

// Dignity tiers treated as strengthening vs weakening for theme-confidence
// purposes (reuses detailedDignity's own `tier` strings verbatim — never a
// new dignity scale).
window.DASHALIFEPHASE_STRONG_TIERS = ['Exalted', 'Own Sign', 'Moolatrikona'];
window.DASHALIFEPHASE_WEAK_TIERS = ['Debilitated'];

// Section 39 — financial/medical/legal/guarantee/other-person forbidden
// language scanner (module's own safety net, independent of
// HealthRecoveryTiming's medical scanner, per the established per-module
// pattern in this codebase — see WealthProtectionTiming / YogaActivationTiming).
window.DASHALIFEPHASE_FORBIDDEN_PATTERNS = [
  /\bwill\s+(die|pass\s+away)\b/i, /\bdate\s+of\s+death\b/i, /\blifespan\b/i, /\blife\s+expectancy\b/i,
  /\b(fatal|terminal)\s+(illness|disease|accident)\b/i, /\bwill\s+be\s+diagnosed\b/i, /\bdiagnos(e|is|ed)\b/i,
  /\bmental[- ]health\s+diagnos/i, /\bpredict(s|ed)?\s+an?\s+accident\b/i,
  /\b(he|she|they)\s+(secretly|really|actually)\s+(wants?|intends?|plans?)\b/i,
  /\bguarantee(d|s)?\s+(this\s+)?(marriage|divorce|childbirth|child|event|success|outcome)\b/i,
  /\bwill\s+(definitely|certainly)\s+(get\s+married|get\s+divorced|have\s+a\s+child|succeed)\b/i,
  /\bguaranteed\s+(financial|wealth|income|returns?)\b/i,
  /\binvest\s+in\b/i, /\brecommend(ed|s)?\s+(stock|fund|bond|security|securities|lender|lawyer|doctor|treatment)\b/i,
  /\blegal\s+advice\b/i, /\bmedical\s+advice\b/i, /\balways\s+difficult\b/i, /\balways\s+a\s+bad\s+period\b/i
];

// Section 29-30 — rule provenance entries.
window.DASHALIFEPHASE_RULES = [
  { id: 'DASHALP-REUSE-001', category: 'Engine Boundary', provenance: 'application', name: 'Reuse Existing Dasha Engine', description: 'This module reads state.dasha / buildSubPeriods() / findCurrentIndex() only; it never computes a new Mahadasha/Antardasha/Pratyantardasha sequence.', explanation: 'A synthesis/interpretation layer must not duplicate or drift from the single source of Dasha truth already computed for this chart.', source: 'js/dasha/vimshottariDasha.js (buildSubPeriods, findCurrentIndex); internal architecture convention established in Wealth Protection Timing / Yoga Activation Timing.' },
  { id: 'DASHALP-THEME-001', category: 'Theme Derivation', provenance: 'classical', name: 'House-Lordship Theme Priority', description: 'A Mahadasha/Antardasha lord\'s broad life-phase theme is derived primarily from the house(s) it owns and occupies, then refined by sign/dignity/conjunction/aspect/natural-significator role.', explanation: 'Classical Parashari practice reads a dasha lord\'s results chiefly through the houses it rules and occupies.', source: 'Brihat Parashara Hora Shastra — Dasha-phala and house-lordship chapters (general classical principle, applied here, not a verbatim quotation).' },
  { id: 'DASHALP-PROMISE-001', category: 'Natal Promise vs Activation', provenance: 'classical', name: 'Natal Promise vs Dasha Activation', description: 'What a chart structurally promises (house lordship/dignity/yogas) is distinct from when it activates (the Dasha/Antardasha/Pratyantardasha of the relevant planet).', explanation: 'A strong natal placement with no corresponding Dasha activation at a given time does not manifest as current lived experience; classical Dasha-phala theory reads results primarily during the Dasha of the significator planet.', source: 'Classical Vimshottari Dasha-phala principle; mirrored by this app\'s existing timing modules\' "natal promise then dasha activation" sequencing.' },
  { id: 'DASHALP-HIER-001', category: 'Dasha Hierarchy', provenance: 'application', name: 'MD/AD Precedence Over Isolated PD', description: 'A Pratyantardasha-level theme never overrides a well-supported Mahadasha/Antardasha theme unless the Pratyantardasha lord itself carries independent structural support (house lordship/occupation, dignity, or conjunction/aspect evidence tying it to a different theme). An isolated, weakly-supported PD theme is shown as a minor refinement/nuance, not a replacement headline theme.', explanation: 'Classical Dasha-phala theory treats the Mahadasha as the dominant, longest-acting signification layer; the Pratyantardasha is the finest-grained timing refinement and should not be allowed to overturn the broader picture without its own evidence.', source: 'Classical Vimshottari Dasha hierarchy (Mahadasha > Antardasha > Pratyantardasha as nested, not independently competing, layers); applied as an explicit structural guard in this module (see DashaLifePhase.applyDashaHierarchy).' },
  { id: 'DASHALP-CROSSMODULE-001', category: 'Cross-Module Correlation', provenance: 'application', name: 'Reference, Never Re-Time', description: 'When an existing timing module\'s own candidate window overlaps a Dasha/Antardasha/Pratyantardasha period analyzed here, that window is referenced as supporting evidence; this module never independently computes or asserts its own date for that event.', explanation: 'Avoids duplicate/conflicting timing logic across modules; keeps each domain-specific timing module authoritative for its own event type.', source: 'Established cross-module idiom (window.X.refresh(), Array.isArray guard) documented in docs/_moduleDiscoveryInventory.md.' },
  { id: 'DASHALP-YOGAREF-001', category: 'Yoga Integration', provenance: 'application', name: 'Reference Yoga Activation, Never Duplicate', description: 'Where a Dasha period\'s active yogas are relevant to its theme, this module reads window.YogaActivationTiming\'s own output (or state.yogas) as a reference; it never re-derives yoga formation or activation logic.', explanation: 'Yoga formation/activation is Yoga Activation Timing\'s domain; duplicating it here would risk drift and redundant computation.', source: 'js/yogaActivationTiming/yogaActivationTimingEngine.js (window.YogaActivationTiming), step 2 of this build plan.' },
  { id: 'DASHALP-VARGA-001', category: 'Divisional Chart Relevance', provenance: 'classical', name: 'Theme-Relevant Varga Only', description: 'Divisional charts (D2/D4/D7/D9/D10/D16/D24) are shown only for the varga(s) relevant to the Mahadasha lord\'s assigned theme domain — never an irrelevant D-chart.', explanation: 'Each varga has a specific classical application (D10 career, D4 property, D7 children, D2 wealth, D16 vehicles/general wellbeing, D24 education); showing an unrelated varga adds noise without classical basis.', source: 'Classical varga-application table (general Jyotish principle), applied via vargaPosition().' },
  { id: 'DASHALP-TRANSIT-001', category: 'Transit Confirmation', provenance: 'application', name: 'Transit Confirms, Never Predicts Alone', description: 'A Jupiter/Saturn transit over or aspecting the Dasha lord is shown only as a confirming layer on top of an already-identified Dasha period; transit is never presented as independently predicting an event.', explanation: 'Matches this app\'s existing timing-module convention that Dasha identifies the period and transit adds confirmation only.', source: 'Internal architecture convention (see Yoga Activation Timing Step 4; Major Expenditure Timing, etc.).' },
  { id: 'DASHALP-NOFAB-001', category: 'Shadbala/Ashtakavarga Availability', provenance: 'application', name: 'No Fabricated Strength Scores', description: 'Shadbala (state.shadbala) and Ashtakavarga (state.ashtakvarga / computeAshtakvarga) are used only when actually present on state, and only as supporting qualitative context, never fabricated or treated as authoritative on their own.', explanation: 'These engines are not exposed as clean window.* APIs per the discovery inventory; this module must degrade gracefully instead of inventing numbers.', source: 'docs/_moduleDiscoveryInventory.md — Shadbala/Ashtakavarga engine notes.' },
  { id: 'DASHALP-NOGUARANTEE-001', category: 'Safety', provenance: 'application', name: 'No Outcome Guarantees', description: 'This module never guarantees marriage, divorce, childbirth, financial success, or any other specific outcome for a Dasha period, and never gives investment, legal, or medical advice.', explanation: 'A life-phase theme describes a qualitative domain of emphasis, not a certain event.', source: 'Spec section 39 (forbidden-language list); mirrors Wealth Protection Timing / Yoga Activation Timing safety rules.' },
  { id: 'DASHALP-NODEATH-001', category: 'Safety', provenance: 'application', name: 'No Death/Lifespan/Diagnosis Language', description: 'This module never states or implies a date of death, lifespan, life expectancy, medical diagnosis, or other-person-motive inference, including for 8th/6th/12th-house or malefic-dasha themes.', explanation: 'Classical 8th/6th/12th-house or malefic-planet dasha significations are read qualitatively (transformation, health-context, consolidation) only, never as death/illness prediction.', source: 'Spec section 39; mirrors Health & Recovery Timing\'s own safety scanner pattern (window.HealthRecoveryTiming.scanForForbiddenLanguage).' },
  { id: 'DASHALP-NOALWAYS-001', category: 'Safety', provenance: 'application', name: 'No Blanket "Always Difficult" Claims', description: 'This module never states that a given Mahadasha/planet is "always difficult" or inherently bad in general; every theme and caution is reasoned from this specific chart\'s house lordship/occupation/dignity/conjunctions/aspects.', explanation: 'Classical dasha results are chart-specific, not fixed per planet; a blanket claim is both inaccurate and could cause needless anxiety.', source: 'Spec section 40.' },
  { id: 'DASHALP-FILTER-001', category: 'UI', provenance: 'application', name: 'Filters Never Recalculate', description: 'Time-horizon and life-domain filters only slice the already-computed dashboard result; they never re-invoke chart generation or the Dasha engine.', explanation: 'Matches the established filter idiom used by Yoga Activation Timing and other synthesis modules in this app.', source: 'Internal architecture convention.' }
];
