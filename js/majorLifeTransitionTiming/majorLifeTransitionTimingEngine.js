/* =========================================================
   MAJOR LIFE TRANSITION / PHASE CHANGE TIMING — engine.
   Answers: "do several life domains converge strongly enough around the
   same period to represent a broader life-phase transition?" This is
   NOT a general chronological timeline (window.LifeTimeline already does
   that) and NOT a replacement for any single-domain module.

   Architecture: sits between window.LifeTimeline (pure chronological
   aggregation, reused directly for normalization/dedup) and
   window.DashaLifePhase (independent astrological foundation layer,
   conceptually referenced but not re-derived). Per spec section 6 this
   module ALSO keeps its own lightweight independent Parashari foundation
   (house-pair transition signatures) in addition to consuming
   window.LifeTimeline's already-normalized output.

   REUSE (not re-mirror) of the Life Timeline dedup fix: window.LifeTimeline
   already exposes groupCorrelatedEvents()/classifyOverlap()/
   calculateDomainDiversity() on its own namespace (js/lifeTimeline/
   lifeTimelineEngine.js), which already applies the edge-bounded
   chronological merge instead of a naive transitive union-find. This
   module calls those functions directly via window.LifeTimeline rather
   than re-implementing (and risking re-breaking) that logic.

   Exposed only as window.MajorLifeTransitionTiming. UI lives entirely in
   majorLifeTransitionTimingUI.js.
   ========================================================= */

window.MajorLifeTransitionTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[MajorLifeTransitionTiming]', text); }

  NS.getChartData = function () { return state.chart || null; };

  // --- Own forbidden-language scanner — applied ONLY to this module's own
  // synthesized narrative text, never to a source module's own strings. ---
  NS.scanForForbiddenLanguage = function (text) {
    const s = String(text || '');
    const patterns = window.MAJORLIFETRANSITION_FORBIDDEN_PATTERNS || [];
    const hits = patterns.filter(re => re.test(s));
    return { forbidden: hits.length > 0, matched: hits.map(re => re.source) };
  };
  NS.applySafetyFilter = function (text) {
    const scan = NS.scanForForbiddenLanguage(text);
    if (!scan.forbidden) return text;
    return 'This period is described qualitatively only, as a multi-domain convergence synthesis of existing module output; specific outcome, ranking, causation, or guarantee language has been withheld.';
  };

  // ---------------------------------------------------------------
  // SECTION 6-8 — Independent Parashari foundation (narrative only,
  // never deterministic, never overrides the structural domain-
  // independence gate below).
  // ---------------------------------------------------------------
  function lordOfHouse(chart, h) {
    const signIdx = (SIGNS.indexOf(chart.ascendant.sign) + h - 1) % 12;
    return SIGN_LORD[SIGNS[signIdx]];
  }
  function houseOccupiedBy(chart, planetName) {
    const p = chart.planets.find(pl => pl.name === planetName);
    return p ? Number(p.house) : null;
  }
  function housesOwnedBy(chart, planetName) {
    const houses = [];
    for (let h = 1; h <= 12; h++) if (lordOfHouse(chart, h) === planetName) houses.push(h);
    return houses;
  }
  function mutuallyLinked(chart, planetA, planetB) {
    if (planetA === planetB) return true;
    const pa = chart.planets.find(p => p.name === planetA);
    const pb = chart.planets.find(p => p.name === planetB);
    if (!pa || !pb) return false;
    if (Array.isArray(pa.conjunctWith) && pa.conjunctWith.includes(planetB)) return true;
    if (Array.isArray(pa.aspectedBy) && pa.aspectedBy.includes(planetB)) return true;
    if (Array.isArray(pb.aspectedBy) && pb.aspectedBy.includes(planetA)) return true;
    // Simple house-exchange check: A's lord occupies B's house-sign's owned house and vice versa.
    const aHouses = housesOwnedBy(chart, planetA);
    const bHouses = housesOwnedBy(chart, planetB);
    const aOcc = houseOccupiedBy(chart, planetA);
    const bOcc = houseOccupiedBy(chart, planetB);
    if (aOcc && bHouses.includes(aOcc) && bOcc && aHouses.includes(bOcc)) return true;
    return false;
  }
  NS.checkSignaturePair = function (chart, h1, h2) {
    const l1 = lordOfHouse(chart, h1), l2 = lordOfHouse(chart, h2);
    return mutuallyLinked(chart, l1, l2);
  };
  NS.evaluateLifeTransitionNatalPattern = function (chart) {
    chart = chart || NS.getChartData();
    if (!chart) return null;
    const groupResults = (window.MAJORLIFETRANSITION_SIGNATURES || []).map(group => {
      const connectedPairs = group.pairs.filter(([a, b]) => NS.checkSignaturePair(chart, a, b));
      return { id: group.id, label: group.label, domain: group.domain, totalPairs: group.pairs.length, connectedPairs: connectedPairs.length, pairs: connectedPairs };
    });
    const totalConnections = groupResults.reduce((s, g) => s + g.connectedPairs, 0);
    let sensitivity;
    if (totalConnections >= 6) sensitivity = 'Strong';
    else if (totalConnections >= 3) sensitivity = 'Moderate';
    else if (totalConnections >= 1) sensitivity = 'Contextual';
    else sensitivity = 'Limited';
    const narrative = `This chart's natal house-lord connections across the identity, career, residence, finance, relationship, education and spiritual transition-signature groups show ${totalConnections} notable connection(s) out of ${groupResults.reduce((s, g) => s + g.totalPairs, 0)} examined pairs, read as "${sensitivity}" natal sensitivity to life-phase transitions overall. This is a narrative, background observation about the chart's general structure — it never determines, scores, or overrides the classification of any specific timing window below.`;
    return { sensitivity, groupResults, totalConnections, narrative: NS.applySafetyFilter(narrative) };
  };

  // ---------------------------------------------------------------
  // SECTION 10-11 — Dasha synthesis (illustrative multi-domain examples
  // only, never exhaustive/deterministic).
  // ---------------------------------------------------------------
  const DASHA_HOUSE_DOMAIN_MAP = {
    1: 'Spiritual/Personal', 2: 'Finance', 3: 'Relationship/Family', 4: 'Property/Residence', 5: 'Education',
    6: 'Career', 7: 'Relationship/Family', 8: 'Finance', 9: 'Education', 10: 'Career', 11: 'Finance', 12: 'Spiritual/Personal'
  };
  function housesTouchedBy(chart, planetName) {
    const owned = housesOwnedBy(chart, planetName);
    const occ = houseOccupiedBy(chart, planetName);
    return Array.from(new Set(occ ? owned.concat([occ]) : owned));
  }
  NS.evaluateLifeTransitionDasha = function (md, ad, pd, chart) {
    chart = chart || NS.getChartData();
    if (!chart || !md) return null;
    const lords = Array.from(new Set([md.lord, ad && ad.lord, pd && pd.lord].filter(Boolean)));
    const houses = Array.from(new Set([].concat(...lords.map(l => housesTouchedBy(chart, l)))));
    const domains = Array.from(new Set(houses.map(h => DASHA_HOUSE_DOMAIN_MAP[h]).filter(Boolean)));
    const illustrativeExamples = [];
    if (houses.includes(10) && houses.includes(12) && houses.includes(4)) illustrativeExamples.push('10th + 12th + 4th house activation together is illustrative of a career-with-residence-change period.');
    if (houses.includes(2) && houses.includes(8) && houses.includes(11)) illustrativeExamples.push('2nd + 8th + 11th house activation together is illustrative of a financial-restructuring period.');
    if (houses.includes(7) && houses.includes(9) && houses.includes(10)) illustrativeExamples.push('7th + 9th + 10th house activation together is illustrative of a partnership-and-direction period.');
    if (houses.includes(5) && houses.includes(9)) illustrativeExamples.push('5th + 9th house activation together is illustrative of an education/spiritual-direction period.');
    return {
      lords, houses: houses.sort((a, b) => a - b), domains, illustrativeExamples,
      narrative: NS.applySafetyFilter(`The current Dasha lord(s) (${lords.join(', ')}) touch house(s) ${houses.sort((a, b) => a - b).join(', ')}, spanning ${domains.join(', ') || 'no clearly mapped'} domain(s). ${illustrativeExamples.join(' ')}`.trim())
    };
  };

  // ---------------------------------------------------------------
  // SECTION 16-19 — reuse window.LifeTimeline's own normalization/
  // dedup/domain-classification layer rather than re-querying every
  // timing module and re-implementing clustering.
  // ---------------------------------------------------------------
  NS.getLifeTimelineResult = function (horizonYears) {
    if (!window.LifeTimeline || typeof window.LifeTimeline.refresh !== 'function') return null;
    try { return window.LifeTimeline.refresh(horizonYears, 'All', 'All', 'Both', null); } catch (e) { return null; }
  };

  // ---------------------------------------------------------------
  // SECTION 34 (CRITICAL) — domain independence, the exact same failure
  // mode window.LifeTimeline already fixed with an edge-bounded merge.
  // Here we take window.LifeTimeline's already-deduplicated eventClusters
  // (whose domains array is already a DEDUPED set of distinct domains per
  // cluster, built by calculateDomainDiversity) and classify each
  // cluster's domain-independence directly from that.
  // ---------------------------------------------------------------
  NS.calculateDomainIndependence = function (cluster) {
    const domains = cluster.domains || [];
    if (domains.length >= 2) {
      return { kind: 'independent', label: 'Independent domain evidence', domains, explanation: `Member windows span ${domains.length} genuinely distinct domains (${domains.join(', ')}), not just repeated signals within one domain.` };
    }
    if (cluster.isCluster) {
      return { kind: 'related-subevents', label: 'Related sub-events', domains, explanation: `All member windows (${cluster.windows.map(w => w.moduleName).join(', ')}) fall within the single "${domains[0] || cluster.windows[0].domain}" domain — these are treated as one underlying signal expressed through related sub-events, not as separate independent evidence.` };
    }
    return { kind: 'single-window', label: 'Single window, single domain', domains, explanation: `Only one timing window (${cluster.windows[0].moduleName}) contributes to this period.` };
  };

  // ---------------------------------------------------------------
  // SECTION 4 — transition taxonomy classification (display label only,
  // derived from already-known domain/module evidence).
  // ---------------------------------------------------------------
  function hasModule(cluster, id) { return (cluster.moduleIds || []).includes(id); }
  NS.classifyTransitionTaxonomy = function (cluster) {
    const domains = cluster.domains || [];
    const has = id => hasModule(cluster, id);
    if (has('retirement')) return 'workToRetirement';
    if (has('businessStart') && (has('jobChange') || has('careerTurningPoint'))) return 'employmentToBusiness';
    if (domains.includes('Career') && domains.includes('Property/Residence')) return 'careerAndRelocation';
    if (has('inheritanceLegacy') || has('legalMatter')) return 'legacyAndResponsibilityTransition';
    if (domains.includes('Finance') && domains.includes('Property/Residence')) return 'propertyAndFinancialTransition';
    if (domains.includes('Education') && domains.includes('Career')) return 'educationToCareer';
    if (domains.includes('Health')) return 'healthRecoveryToRoutine';
    if (domains.includes('Spiritual/Personal') && domains.length === 1) return 'spiritualLifeTransition';
    if (domains.length === 1 && domains[0] === 'Career') return (has('promotion') || has('recognitionAward')) ? 'responsibilityExpansion' : 'careerLifeTransition';
    if (domains.length === 1 && domains[0] === 'Property/Residence') return 'residentialTransition';
    if (domains.length === 1 && domains[0] === 'Finance') return (has('wealthProtection') || has('insuranceProtection')) ? 'simplificationConsolidation' : 'financialStructureTransition';
    if (domains.length === 1 && domains[0] === 'Relationship/Family') return (has('marriageSeparationDivorce')) ? 'familyStructureTransition' : 'relationshipTransition';
    if (domains.length >= 3) return 'multiDomainTransition';
    if (domains.length === 2) return 'restructuringPhase';
    if (cluster.isCluster) return 'newLifePhase';
    return 'newLifePhase';
  };
  const TAXONOMY_TO_TYPE = {
    careerLifeTransition: 'Restructuring', workToRetirement: 'Simplification', employmentToBusiness: 'New Beginning',
    careerAndRelocation: 'Relocation', residentialTransition: 'Relocation', financialStructureTransition: 'Restructuring',
    familyStructureTransition: 'Closure → New Phase', relationshipTransition: 'New Beginning', educationToCareer: 'New Beginning',
    healthRecoveryToRoutine: 'Closure → New Phase', propertyAndFinancialTransition: 'Restructuring',
    legacyAndResponsibilityTransition: 'Responsibility Expansion', spiritualLifeTransition: 'New Beginning',
    responsibilityExpansion: 'Responsibility Expansion', simplificationConsolidation: 'Simplification',
    multiDomainTransition: 'Multi-Domain', newLifePhase: 'New Beginning', restructuringPhase: 'Restructuring'
  };
  NS.transitionTypeFor = function (taxonomyKey) { return TAXONOMY_TO_TYPE[taxonomyKey] || 'Restructuring'; };

  // ---------------------------------------------------------------
  // SECTION 20 (CRITICAL, hard gate) — transition strength. Single-domain
  // results are structurally prevented from ever being labeled a major/
  // multi-domain transition, regardless of how many related sub-event
  // windows they contain.
  // ---------------------------------------------------------------
  function rank(level) { return { Strong: 3, Moderate: 2, Contextual: 1 }[level] || 0; }
  NS.classifyTransitionStrength = function (cluster) {
    const indep = NS.calculateDomainIndependence(cluster);
    if (indep.kind === 'independent') {
      const domains = indep.domains;
      if (domains.length >= 3 && cluster.strongestEvidence !== 'Contextual') {
        return { label: 'Strong Multi-Domain Convergence', isMajorTransition: true, domainIndependence: indep };
      }
      if (domains.length >= 2 && cluster.strongestEvidence !== 'Contextual') {
        return { label: 'Moderate Multi-Domain Convergence', isMajorTransition: true, domainIndependence: indep };
      }
      // 2+ domains but only contextual evidence strength — still independent domains, but weak.
      return { label: 'Moderate Multi-Domain Convergence', isMajorTransition: domains.length >= 2, domainIndependence: indep };
    }
    if (indep.kind === 'related-subevents') {
      return { label: 'Sequential Transition Pattern', isMajorTransition: false, domainIndependence: indep };
    }
    return { label: 'Single-Domain Transition', isMajorTransition: false, domainIndependence: indep };
  };

  // ---------------------------------------------------------------
  // SECTION 35 — evidence deduplication within a cluster (merge
  // duplicate/near-identical reason/caution strings across member
  // windows before display).
  // ---------------------------------------------------------------
  NS.dedupeEvidence = function (cluster) {
    const reasons = new Set(), cautions = new Set(), dashaExplanations = new Set(), houseLogic = new Set();
    cluster.windows.forEach(w => {
      (w.reasons || []).forEach(r => reasons.add(r));
      (w.cautions || []).forEach(c => cautions.add(c));
      if (w.dasha) dashaExplanations.add(`MD ${w.dasha.mahadasha || '—'} / AD ${w.dasha.antardasha || '—'} / PD ${w.dasha.pratyantar || '—'}`);
      if (w.houses && w.houses.length) houseLogic.add(`${w.moduleName}: houses ${w.houses.join(', ')}`);
    });
    return { reasons: Array.from(reasons), cautions: Array.from(cautions), dashaExplanations: Array.from(dashaExplanations), houseLogic: Array.from(houseLogic) };
  };

  // ---------------------------------------------------------------
  // SECTION 22 — transition sequence display, chronological, no causation.
  // ---------------------------------------------------------------
  NS.buildTransitionSequence = function (transitions) {
    const sorted = transitions.slice().sort((a, b) => a.startDate - b.startDate);
    return sorted.map((t, i) => Object.assign({}, t, {
      sequenceIndex: i,
      sequenceNote: i === 0 ? 'First transition window in the selected horizon.' : `Follows ${sorted[i - 1].taxonomyLabel} chronologically; this never implies the earlier window caused this one.`
    }));
  };

  // ---------------------------------------------------------------
  // SECTION 23 — 10-step calculation trace.
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Independent Parashari foundation evaluated (primary/secondary/supporting houses + transition-signature pairs)' },
    { id: 2, label: 'Natal life-structure pattern classified (narrative sensitivity only, never deterministic)' },
    { id: 3, label: 'Current Mahadasha/Antardasha/Pratyantardasha synthesized for multi-domain house activation' },
    { id: 4, label: 'Jupiter/Saturn transit confirmation checked against natal + dasha context (never automatic)' },
    { id: 5, label: 'window.LifeTimeline\'s already-normalized, already-deduplicated event clusters read (reuse, not recompute)' },
    { id: 6, label: 'Domain independence calculated per cluster: Independent domain evidence vs Related sub-events (section 34 gate)' },
    { id: 7, label: 'Transition taxonomy label assigned per cluster from its domain/module evidence' },
    { id: 8, label: 'Transition strength classified with hard structural gate: single-domain never labeled a major life transition' },
    { id: 9, label: 'Evidence deduplication within each cluster (reasons/cautions/dasha/house logic merged, not repeated)' },
    { id: 10, label: 'Chronological transition sequence built and candidate windows placed at the requested horizon' }
  ];

  // ---------------------------------------------------------------
  // MAIN REFRESH — cache keyed by chart/dasha refs + horizon; focus/type
  // filters below are pure, no-recompute slices of this cached result.
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, focusFilter, typeFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart || !state.dasha || !state.dasha.length) { NS.cache = null; return null; }
    const cacheKey = { chartRef: chart, dashaRef: state.dasha, horizon };
    if (NS.cache && NS.cache.chartRef === cacheKey.chartRef && NS.cache.dashaRef === cacheKey.dashaRef && NS.cache.horizon === cacheKey.horizon) {
      return NS.applyResultFilters(NS.cache.result, focusFilter, typeFilter);
    }

    const calculationLog = [];
    NS.CALCULATION_SEQUENCE.forEach(s => log(calculationLog, `[${String(s.id).padStart(2, '0')}] ${s.label}`));

    const natalPattern = NS.evaluateLifeTransitionNatalPattern(chart);
    log(calculationLog, `Natal transition sensitivity: ${natalPattern ? natalPattern.sensitivity : 'n/a'} (${natalPattern ? natalPattern.totalConnections : 0} connections)`);

    const now = new Date();
    let dashaSynthesis = null;
    if (state.dasha && state.dasha.length) {
      const md = state.dasha.find(m => m.startDate <= now && m.endDate >= now) || state.dasha[0];
      const ad = md && Array.isArray(md.antardashas) ? (md.antardashas.find(a => a.startDate <= now && a.endDate >= now) || md.antardashas[0]) : null;
      let pd = null;
      if (ad && typeof buildSubPeriods === 'function') {
        try {
          const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
          const idx = typeof findCurrentIndex === 'function' ? findCurrentIndex(pds, now) : -1;
          pd = idx >= 0 ? pds[idx] : null;
        } catch (e) { pd = null; }
      }
      dashaSynthesis = NS.evaluateLifeTransitionDasha(md, ad, pd, chart);
    }
    log(calculationLog, `Dasha synthesis domains touched: ${dashaSynthesis ? dashaSynthesis.domains.join(', ') || 'none mapped' : 'n/a'}`);

    const ltResult = NS.getLifeTimelineResult(horizon);
    const integrated = !!ltResult;
    log(calculationLog, integrated ? `Life Timeline integration: ${ltResult.eventClusters.length} event cluster(s) read from window.LifeTimeline` : 'Life Timeline integration: window.LifeTimeline not available for this chart/build');

    const eventClusters = integrated ? ltResult.eventClusters : [];
    const transitions = eventClusters.map(cluster => {
      const domainIndependence = NS.calculateDomainIndependence(cluster);
      const strength = NS.classifyTransitionStrength(cluster);
      const taxonomyKey = NS.classifyTransitionTaxonomy(cluster);
      const taxonomyLabel = taxonomyKey.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
      const transitionType = NS.transitionTypeFor(taxonomyKey);
      const dedupedEvidence = NS.dedupeEvidence(cluster);
      const interpretation = NS.applySafetyFilter(
        strength.isMajorTransition
          ? `The timing sequence shows a cluster of related life-domain activations across ${cluster.domains.join(', ')} around ${cluster.startDate.getUTCFullYear()}–${cluster.endDate.getUTCFullYear()}, consistent with a ${taxonomyLabel.toLowerCase()} type of life-phase change. This reflects a convergence of this chart's own existing timing-module output, not an independent new prediction, and does not imply one domain's event causes another's.`
          : `This period shows timing activity within the ${cluster.domains[0] || cluster.windows[0].domain} domain only (${domainIndependence.explanation}). Per this module's own gating rule, a single-domain result like this is not labeled a "major life transition" even when it includes several related windows.`
      );
      return {
        id: 'mlt-' + cluster.id, cluster, startDate: cluster.startDate, endDate: cluster.endDate,
        domains: cluster.domains, domainIndependence, strength: strength.label, isMajorTransition: strength.isMajorTransition,
        taxonomyKey, taxonomyLabel, transitionType, moduleIds: cluster.moduleIds, windows: cluster.windows,
        dedupedEvidence, interpretation
      };
    });
    log(calculationLog, `Transition candidates classified: ${transitions.length} (Major: ${transitions.filter(t => t.isMajorTransition).length}, Single/Sequential: ${transitions.filter(t => !t.isMajorTransition).length})`);

    const sequence = NS.buildTransitionSequence(transitions);

    const horizonWindows = (window.MAJORLIFETRANSITION_HORIZONS || [1, 2, 3, 5, 10]).map(y => {
      const end = new Date(now.getTime()); end.setUTCFullYear(end.getUTCFullYear() + y);
      const inRange = transitions.filter(t => t.startDate <= end && t.endDate >= now);
      return { years: y, endDate: end, candidateCount: inRange.length, majorCount: inRange.filter(t => t.isMajorTransition).length, transitions: inRange };
    });

    const rulesUsed = (window.MAJORLIFETRANSITION_RULES || []).slice();

    const result = {
      natalPattern, dashaSynthesis, transitions, sequence, horizonWindows,
      integratedFromLifeTimeline: integrated,
      skipped: integrated ? (ltResult.skipped || []) : [{ id: 'lifeTimeline', label: 'Important Event Sequence / Life Timeline', reason: 'window.LifeTimeline not present for this build' }],
      horizonYears: horizon, calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog,
      disclaimer: 'This Major Life Transition / Phase Change Timing module is a multi-domain convergence synthesis built on top of this application\'s own existing timing modules (via Life Timeline) plus a lightweight independent Parashari house-pair foundation, for informational purposes only. It does not predict death, lifespan, illness/diagnosis, or accidents, never infers another person\'s private motives, and never guarantees marriage, divorce, childbirth, career, business, relocation, or investment outcomes. It never ranks any window as the "best" or "worst" period of life. Each contributing module\'s own safety restrictions are preserved here exactly as that module states them.'
    };
    NS.cache = Object.assign({ result }, cacheKey);
    return NS.applyResultFilters(result, focusFilter, typeFilter);
  };

  // Section 28 — filters slice only; never recompute.
  NS.applyResultFilters = function (result, focusFilter, typeFilter) {
    const ff = focusFilter || 'All';
    const tf = typeFilter || 'All';
    if (ff === 'All' && tf === 'All') return Object.assign({}, result, { focusFilter: ff, typeFilter: tf });
    const focusDomain = (window.MAJORLIFETRANSITION_FOCUS_DOMAIN_MAP || {})[ff];
    const filtered = Object.assign({}, result);
    const matches = t => (!focusDomain || t.domains.includes(focusDomain)) && (tf === 'All' || t.transitionType === tf);
    filtered.transitions = result.transitions.filter(matches);
    filtered.sequence = result.sequence.filter(matches);
    filtered.horizonWindows = result.horizonWindows.map(h => Object.assign({}, h, { transitions: h.transitions.filter(matches) }));
    filtered.focusFilter = ff; filtered.typeFilter = tf;
    return filtered;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
