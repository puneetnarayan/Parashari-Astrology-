/* =========================================================
   IMPORTANT EVENT SEQUENCE / LIFE TIMELINE — pure calculation engine.
   Master chronological visualization/synthesis layer. This module NEVER
   computes a new planetary, house, dasha, transit, or divisional-chart
   position, and NEVER independently decides a new event date — it only
   consumes the existing timing modules' own .refresh() output (per
   discovery inventory: `result.candidateWindows || result.windows`,
   Array.isArray guard, MarriageTiming object-shape fallback) and layers
   Normalization -> Deduplication -> Domain Classification ->
   Overlap Detection -> Sequence Detection -> Life-Phase Clustering on
   top, exactly mirroring the groupCorrelated-/domain-diversity pattern
   already established in yogaActivationTimingEngine.js
   (groupCorrelatedYogaActivations / calculateYogaDomainDiversity) and the
   cache-by-ref + filters-never-recompute pattern in
   dashaLifePhaseEngine.js / yogaActivationTimingEngine.js.
   Exposed only as window.LifeTimeline. UI lives entirely in
   lifeTimelineUI.js.
   ========================================================= */

window.LifeTimeline = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[LifeTimeline]', text); }
  function ruleById(id) { return (window.LIFETIMELINE_RULES || []).find(r => r.id === id); }

  NS.getChartData = function () { return state.chart || null; };

  // --- Own forbidden-language scanner — applied ONLY to this module's own
  // synthesized narrative text, never to a source module's own strings. ---
  NS.scanForForbiddenLanguage = function (text) {
    const s = String(text || '');
    const patterns = window.LIFETIMELINE_FORBIDDEN_PATTERNS || [];
    const hits = patterns.filter(re => re.test(s));
    return { forbidden: hits.length > 0, matched: hits.map(re => re.source) };
  };
  NS.applySafetyFilter = function (text) {
    const scan = NS.scanForForbiddenLanguage(text);
    if (!scan.forbidden) return text;
    return 'This period is described qualitatively only, as a chronological synthesis of existing module output; specific outcome, diagnosis, causation, or guarantee language has been withheld.';
  };

  // ---------------------------------------------------------------
  // STEP 1-2 — read every registered module's own structured output.
  // Defensive per the discovery-inventory idiom: skip anything absent,
  // throwing, or shaped unexpectedly.
  // ---------------------------------------------------------------
  function windowsArrayFrom(result) {
    const raw = result && (result.candidateWindows || result.windows);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return [raw.primary, raw.secondary].filter(Boolean);
    return null;
  }

  NS.collectRawModuleOutput = function (horizonYears) {
    const out = [];
    const skipped = [];
    (window.LIFETIMELINE_MODULE_REGISTRY || []).forEach(mod => {
      const g = window[mod.global];
      if (!g || typeof g.refresh !== 'function') { skipped.push({ id: mod.id, label: mod.label, reason: 'module not present in this build' }); return; }
      let result;
      try { result = g.refresh(horizonYears); } catch (e) { skipped.push({ id: mod.id, label: mod.label, reason: 'refresh() threw: ' + (e && e.message) }); return; }
      if (!result) { skipped.push({ id: mod.id, label: mod.label, reason: 'no result for current chart' }); return; }
      const windows = windowsArrayFrom(result);
      if (!windows) { skipped.push({ id: mod.id, label: mod.label, reason: 'no candidate windows / unexpected result shape' }); return; }
      out.push({ mod, result, windows });
    });
    return { collected: out, skipped };
  };

  // ---------------------------------------------------------------
  // STEP 3 — Normalization into the common TimingWindow interface
  // (spec section 5, field names adapted to what the real modules emit).
  // ---------------------------------------------------------------
  function evidenceLevelOf(w) {
    if (w.evidence && w.evidence.label) return w.evidence.label;
    if (w.strength && w.strength.label) return w.strength.label;
    if (typeof w.qualification === 'string') {
      if (w.qualification === 'strong candidate') return 'Strong';
      if (w.qualification === 'candidate') return 'Moderate';
    }
    if (typeof w.convergenceFactors === 'number') {
      if (w.convergenceFactors >= 4) return 'Strong';
      if (w.convergenceFactors >= 2) return 'Moderate';
      return 'Contextual';
    }
    if (typeof w.matchCount === 'number') {
      if (w.matchCount >= 3) return 'Strong';
      if (w.matchCount >= 2) return 'Moderate';
      return 'Contextual';
    }
    return 'Contextual';
  }
  function eventStageOf(w) {
    if (Array.isArray(w.stages) && w.stages.length) return w.stages.join(' → ');
    if (w.event && w.event.label) return w.event.label;
    if (w.delay && w.delay.interpretation) return 'Activation (see delay/qualification notes)';
    return 'Activation';
  }
  function transitSupportOf(w) {
    if (!w.transit) return false;
    const t = w.transit;
    if (t.convergence) return true;
    if (t.jupiter && t.jupiter.active) return true;
    if (t.saturn && t.saturn.active) return true;
    return false;
  }
  function divisionalSupportOf(w) {
    const out = [];
    if (w.d2 && w.d2.level) out.push({ varga: 'D2', level: w.d2.level });
    if (w.d4Confirmation && w.d4Confirmation.level) out.push({ varga: 'D4', level: w.d4Confirmation.level });
    if (w.d10Confirmation) out.push({ varga: 'D10', level: 'Confirms' });
    if (w.divisionalConfirmation && w.divisionalConfirmation.level) out.push({ varga: w.divisionalConfirmation.varga || 'D-chart', level: w.divisionalConfirmation.level });
    return out;
  }
  function reasonsOf(w) {
    if (Array.isArray(w.reasons)) return w.reasons;
    if (Array.isArray(w.factors)) return w.factors;
    return [];
  }
  function cautionsOf(w) {
    if (Array.isArray(w.cautions)) return w.cautions;
    return [];
  }

  let nextId = 1;
  NS.normalizeWindow = function (mod, rawResult, w) {
    const id = 'ltw-' + (nextId++);
    return {
      id, moduleId: mod.id, moduleName: mod.label, domain: mod.domain,
      eventType: mod.label, eventStage: eventStageOf(w),
      startDate: w.startDate, endDate: w.endDate,
      evidenceLevel: evidenceLevelOf(w),
      dasha: { mahadasha: w.mahadasha || null, antardasha: w.antardasha || null, pratyantar: w.pratyantar || null },
      houses: Array.isArray(w.activatedHouses) ? w.activatedHouses.slice() : [],
      planets: Array.isArray(w.planets) ? w.planets.slice() : [],
      transitSupport: transitSupportOf(w),
      divisionalSupport: divisionalSupportOf(w),
      traceId: mod.id + ':' + mod.global,
      reasons: reasonsOf(w), cautions: cautionsOf(w),
      disclaimer: rawResult && rawResult.disclaimer ? rawResult.disclaimer : null,
      rulesUsed: Array.isArray(rawResult && rawResult.rulesUsed) ? rawResult.rulesUsed : [],
      parentEventId: null, relatedEventIds: [],
      _raw: w
    };
  };

  NS.buildTimingWindows = function (horizonYears) {
    const { collected, skipped } = NS.collectRawModuleOutput(horizonYears);
    const all = [];
    collected.forEach(c => {
      c.windows.forEach(w => {
        if (!w || !w.startDate || !w.endDate) return;
        all.push(NS.normalizeWindow(c.mod, c.result, w));
      });
    });
    all.sort((a, b) => a.startDate - b.startDate);
    return { windows: all, skipped, integratedModules: collected.map(c => c.mod.id) };
  };

  // ---------------------------------------------------------------
  // STEP 5 — overlap classification (spec section 11).
  // ---------------------------------------------------------------
  const PROX = window.LIFETIMELINE_PROXIMITY_DAYS || { sameMonth: 31, threeMonths: 93, sixMonths: 186, twelveMonths: 372 };
  function daysBetween(a, b) { return Math.abs(a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000); }
  NS.classifyOverlap = function (a, b) {
    const overlapStart = Math.max(a.startDate.getTime(), b.startDate.getTime());
    const overlapEnd = Math.min(a.endDate.getTime(), b.endDate.getTime());
    if (overlapStart <= overlapEnd) {
      const aSpan = a.endDate.getTime() - a.startDate.getTime();
      const bSpan = b.endDate.getTime() - b.startDate.getTime();
      const ov = overlapEnd - overlapStart;
      const nearFull = aSpan > 0 && bSpan > 0 && (ov / Math.min(aSpan, bSpan)) > 0.8;
      return nearFull ? 'exact' : 'partial';
    }
    const gapDays = a.endDate <= b.startDate ? daysBetween(a.endDate, b.startDate) : daysBetween(b.endDate, a.startDate);
    if (gapDays <= PROX.threeMonths) return 'close-3m';
    if (gapDays <= PROX.sixMonths) return 'close-6m';
    if (gapDays <= PROX.twelveMonths) return 'close-12m';
    return null;
  };

  // ---------------------------------------------------------------
  // STEP 4/6 — EVENT DEDUPLICATION + CORRELATION CONTROL (spec section
  // 8-9, 36). Mirrors yogaActivationTimingEngine.js's
  // groupCorrelatedYogaActivations / calculateYogaDomainDiversity pattern:
  // union-find windows whose source modules are in the same correlation
  // group AND whose periods overlap or sit within 6 months of each other.
  // ---------------------------------------------------------------
  function correlationGroupFor(moduleId) {
    return (window.LIFETIMELINE_CORRELATION_GROUPS || []).filter(g => g.modules.includes(moduleId));
  }
  function sameCorrelationGroup(aModId, bModId) {
    if (aModId === bModId) return true;
    const aGroups = correlationGroupFor(aModId).map(g => g.id);
    const bGroups = correlationGroupFor(bModId).map(g => g.id);
    return aGroups.some(g => bGroups.includes(g));
  }
  function correlationLabelFor(moduleIds) {
    const groups = window.LIFETIMELINE_CORRELATION_GROUPS || [];
    let best = null;
    groups.forEach(g => {
      const hit = g.modules.filter(m => moduleIds.includes(m)).length;
      if (hit >= 2 && (!best || hit > best.hit)) best = { label: g.label, hit };
    });
    return best ? best.label : null;
  }

  NS.calculateDomainDiversity = function (windows) {
    const domains = Array.from(new Set(windows.map(w => w.domain)));
    return { count: domains.length, domains };
  };
  NS.calculateIndependentDomainCount = function (cluster) {
    return NS.calculateDomainDiversity(cluster.windows).count;
  };

  // Union-find over normalized windows.
  function unionFind(n) {
    const parent = Array.from({ length: n }, (_, i) => i);
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    function union(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }
    return { find, union };
  }

  // Greedy, chronological, edge-bounded merge — deliberately NOT a global
  // union-find across the whole horizon. A pure union-find transitively
  // chains far-apart same-correlation-group windows (e.g. a 2027 and a 2033
  // occurrence of the same two modules, bridged by intermediate windows)
  // into one unbounded "mega-cluster" spanning years, which would directly
  // violate the spec's Cluster Separation rule (section 38: a 2027 career
  // event and a 2034 property event must not be forced together). Instead,
  // each window is only merged into the MOST RECENTLY OPENED compatible
  // cluster, and only when it is close to that cluster's current edge
  // (its latest endDate), so a cluster's span can never silently balloon
  // across unrelated occurrences years apart.
  NS.groupCorrelatedEvents = function (windows) {
    const sorted = windows.slice().sort((a, b) => a.startDate - b.startDate);
    const clusters = []; // each: { members: [...], moduleIds:Set, lastEnd: Date }
    sorted.forEach(w => {
      let target = null;
      for (let i = clusters.length - 1; i >= 0; i--) {
        const c = clusters[i];
        const compatibleModule = c.moduleIds.has(w.moduleId) || Array.from(c.moduleIds).some(m => sameCorrelationGroup(m, w.moduleId));
        if (!compatibleModule) continue;
        const edgeWindow = { startDate: c.lastEnd, endDate: c.lastEnd };
        const overlap = (w.startDate <= c.lastEnd) ? 'exact' : NS.classifyOverlap(edgeWindow, w);
        if (overlap && overlap !== 'close-12m') { target = c; break; }
      }
      if (target) { target.members.push(w); target.moduleIds.add(w.moduleId); if (w.endDate > target.lastEnd) target.lastEnd = w.endDate; }
      else clusters.push({ members: [w], moduleIds: new Set([w.moduleId]), lastEnd: w.endDate });
    });
    return clusters.map(({ members }) => {
      members.sort((a, b) => a.startDate - b.startDate);
      const moduleIds = Array.from(new Set(members.map(m => m.moduleId)));
      const startDate = members.reduce((min, m) => (m.startDate < min ? m.startDate : min), members[0].startDate);
      const endDate = members.reduce((max, m) => (m.endDate > max ? m.endDate : max), members[0].endDate);
      const domainDiv = NS.calculateDomainDiversity(members);
      const corrLabel = members.length > 1 ? (correlationLabelFor(moduleIds) || (domainDiv.count > 1 ? domainDiv.domains.join(' + ') + ' Convergence' : members[0].domain + ' Activation')) : members[0].moduleName;
      const strongest = members.slice().sort((a, b) => rank(b.evidenceLevel) - rank(a.evidenceLevel))[0];
      return {
        id: 'ltc-' + members.map(m => m.id).join('-'),
        label: corrLabel, windows: members, moduleIds,
        startDate, endDate, domains: domainDiv.domains, domainDiversity: domainDiv.count,
        strongestEvidence: strongest.evidenceLevel,
        isCluster: members.length > 1
      };
    }).sort((a, b) => a.startDate - b.startDate);
  };
  function rank(level) { return { Strong: 3, Moderate: 2, Contextual: 1 }[level] || 0; }

  // ---------------------------------------------------------------
  // STEP 7 — importance tiering (spec section 7, qualitative only).
  // ---------------------------------------------------------------
  NS.classifyClusterTier = function (cluster) {
    if (cluster.domainDiversity >= 2 && cluster.strongestEvidence !== 'Contextual') return 'Primary Event';
    if (!cluster.isCluster && cluster.strongestEvidence === 'Strong') return 'Primary Event';
    if (cluster.isCluster && cluster.strongestEvidence !== 'Contextual') return 'Secondary Event';
    if (cluster.isCluster) return 'Correlated Event';
    return 'Contextual Event';
  };

  // ---------------------------------------------------------------
  // STEP 8 — SEQUENCE DETECTION (spec section 12, 37). Chronological
  // only, never causal. sequenceType describes the gap to the PREVIOUS
  // item in the sorted list; the first item has sequenceType null.
  // ---------------------------------------------------------------
  NS.buildEventSequence = function (clusters) {
    const sorted = clusters.slice().sort((a, b) => a.startDate - b.startDate);
    return sorted.map((c, i) => {
      if (i === 0) return Object.assign({}, c, { sequenceType: null, sequenceNote: 'First timing window in the selected horizon.' });
      const prev = sorted[i - 1];
      const overlap = NS.classifyOverlap(prev, c);
      let sequenceType, note;
      if (overlap === 'exact' || overlap === 'partial') { sequenceType = 'Direct'; note = `Overlaps the preceding ${prev.label} window directly.`; }
      else if (overlap === 'close-3m') { sequenceType = 'Transitional'; note = `Begins as the preceding ${prev.label} window is closing (within ~3 months).`; }
      else if (overlap === 'close-6m' || overlap === 'close-12m') { sequenceType = 'Progressive'; note = `Follows the preceding ${prev.label} window within a reasonable interval (within ~12 months).`; }
      else { sequenceType = 'Long-cycle'; note = `Separated from the preceding ${prev.label} window by a longer interval; shown in sequence chronologically, not as a connected cluster (see Cluster Separation rule).`; }
      return Object.assign({}, c, { sequenceType, sequenceNote: note });
    });
  };

  // ---------------------------------------------------------------
  // STEP 9 — LIFE-PHASE CLUSTERING (spec section 13). Groups correlated
  // clusters that both (a) match a shared phase template's module set and
  // (b) overlap or sit within 12 months of each other, into one named
  // life-phase. A multi-domain convergence not matching any template, but
  // still mutually close in time with domainDiversity >= 2 total modules,
  // is labeled a generic "Life Transition" (never forcing distant,
  // unrelated clusters together — spec section 38).
  // ---------------------------------------------------------------
  function templateFor(moduleIds) {
    const templates = window.LIFETIMELINE_PHASE_TEMPLATES || [];
    let best = null;
    templates.forEach(t => {
      const hit = t.modules.filter(m => moduleIds.includes(m)).length;
      if (hit >= 1 && (!best || hit > best.hit)) best = { template: t, hit };
    });
    return best ? best.template : null;
  }
  // Same bounded-edge greedy approach as groupCorrelatedEvents (and for the
  // same reason: a global union-find here would let two distant, unrelated
  // multi-domain convergences get transitively chained into one phase via
  // an intermediate cluster, which would violate Cluster Separation —
  // section 38 — just as badly as it would for event-level deduplication).
  NS.buildLifePhaseClusters = function (eventClusters) {
    const sorted = eventClusters.slice().sort((a, b) => a.startDate - b.startDate);
    const phases = []; // each: { members:[...], lastEnd: Date }
    sorted.forEach(ec => {
      let target = null;
      for (let i = phases.length - 1; i >= 0; i--) {
        const p = phases[i];
        const edge = { startDate: p.lastEnd, endDate: p.lastEnd };
        const overlap = (ec.startDate <= p.lastEnd) ? 'exact' : NS.classifyOverlap(edge, ec);
        if (!overlap || overlap === 'close-12m') continue;
        const lastMember = p.members[p.members.length - 1];
        const aT = templateFor(lastMember.moduleIds), bT = templateFor(ec.moduleIds);
        const sameTemplate = aT && bT && aT.id === bT.id;
        const multiDomainConvergence = NS.calculateDomainDiversity(lastMember.windows.concat(ec.windows)).count >= 2;
        if (sameTemplate || multiDomainConvergence) { target = p; break; }
      }
      if (target) { target.members.push(ec); if (ec.endDate > target.lastEnd) target.lastEnd = ec.endDate; }
      else phases.push({ members: [ec], lastEnd: ec.endDate });
    });
    return phases.map(p => p.members).filter(members => members.length).map(members => {
      members.sort((a, b) => a.startDate - b.startDate);
      const allWindows = [].concat(...members.map(m => m.windows));
      const moduleIds = Array.from(new Set(allWindows.map(w => w.moduleId)));
      const domainDiv = NS.calculateDomainDiversity(allWindows);
      const startDate = members.reduce((min, m) => (m.startDate < min ? m.startDate : min), members[0].startDate);
      const endDate = members.reduce((max, m) => (m.endDate > max ? m.endDate : max), members[0].endDate);
      const t = templateFor(moduleIds);
      const label = (members.length > 1 && t) ? t.label : (members.length > 1 ? domainDiv.domains.join(' + ') + ' Life Transition' : members[0].label);
      return {
        id: 'ltp-' + members.map(m => m.id).join('-'),
        label, eventClusters: members, domains: domainDiv.domains, domainDiversity: domainDiv.count,
        moduleIds, startDate, endDate, isMultiCluster: members.length > 1,
        interpretation: NS.applySafetyFilter(buildPhaseInterpretation(label, members, domainDiv))
      };
    }).sort((a, b) => a.startDate - b.startDate);
  };
  function buildPhaseInterpretation(label, members, domainDiv) {
    const moduleNames = Array.from(new Set([].concat(...members.map(m => m.windows.map(w => w.moduleName)))));
    const seq = members.map(m => m.label).join(' → ');
    return `This period (${domainDiv.domains.join(', ')}) brings together the timing windows of ${moduleNames.join(', ')}. The underlying windows form a chronological sequence (${seq}); this is a descriptive grouping of existing module output, not a new independent prediction, and it never implies that one event causes another.`;
  }

  // ---------------------------------------------------------------
  // Current life-phase summary (spec section 16) and next significant
  // cluster (spec section 17).
  // ---------------------------------------------------------------
  NS.getCurrentLifePhaseSummary = function (phaseClusters) {
    const now = new Date();
    const active = phaseClusters.filter(p => p.startDate <= now && p.endDate >= now);
    if (!active.length) return { active: false, narrative: 'No currently active major timing window was found among the integrated modules for this chart.' };
    const domains = Array.from(new Set([].concat(...active.map(p => p.domains))));
    const labels = active.map(p => p.label);
    return {
      active: true, phases: active, domains,
      narrative: NS.applySafetyFilter(`Current timing themes for this chart center on ${labels.join(' and ')}${domains.length > 1 ? `, spanning ${domains.join(', ')}` : ''}. These are currently active timing windows drawn from this chart's existing timing modules, shown as themes to be aware of, not a deterministic statement about what will occur.`)
    };
  };
  NS.getNextSignificantCluster = function (phaseClusters) {
    const now = new Date();
    const upcoming = phaseClusters.filter(p => p.endDate >= now && p.domainDiversity >= 1)
      .filter(p => p.eventClusters.some(ec => ec.strongestEvidence !== 'Contextual'))
      .sort((a, b) => a.startDate - b.startDate);
    if (!upcoming.length) return null;
    const next = upcoming[0];
    return Object.assign({}, next, { note: 'Selected as the earliest meaningful high-evidence cluster in the selected horizon — not labeled as the "best" period.' });
  };

  // ---------------------------------------------------------------
  // CALCULATION TRACE (spec section 25) — 10 steps.
  // ---------------------------------------------------------------
  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Existing timing modules identified (registry) and their .refresh() output read defensively' },
    { id: 2, label: 'Candidate windows extracted (candidateWindows/windows, Array.isArray + MarriageTiming object-shape guard)' },
    { id: 3, label: 'Normalization into the common TimingWindow interface' },
    { id: 4, label: 'Event deduplication — correlation-group + overlap/close-sequence union-find (groupCorrelatedEvents)' },
    { id: 5, label: 'Domain classification (Career/Finance/Property-Residence/Relationship-Family/Education/Health/Legal-Structural/Spiritual-Personal)' },
    { id: 6, label: 'Overlap/sequence calculation (classifyOverlap, buildEventSequence)' },
    { id: 7, label: 'Independent-domain analysis (calculateDomainDiversity / calculateIndependentDomainCount)' },
    { id: 8, label: 'Dasha/transit/divisional context carried through from each source window (never recomputed)' },
    { id: 9, label: 'Life-phase classification (buildLifePhaseClusters against named phase templates)' },
    { id: 10, label: 'Final timeline placement, current-phase summary and next-significant-cluster selection' }
  ];

  // ---------------------------------------------------------------
  // MAIN REFRESH — cache keyed by chart/dasha refs + horizon (new
  // windows genuinely differ by horizon, matching yogaActivationTiming's
  // own caching precedent); domain/evidence/displayMode filters below are
  // pure, no-recompute slices of this cached result.
  // ---------------------------------------------------------------
  NS.refresh = function (horizonYears, domainFilter, evidenceFilter, displayMode, customRange) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart || !state.dasha || !state.dasha.length) { NS.cache = null; return null; }
    const cacheKey = { chartRef: chart, dashaRef: state.dasha, horizon, customRange: customRange ? customRange.start + '|' + customRange.end : null };
    if (NS.cache && NS.cache.chartRef === cacheKey.chartRef && NS.cache.dashaRef === cacheKey.dashaRef && NS.cache.horizon === cacheKey.horizon && NS.cache.customRange === cacheKey.customRange) {
      return NS.applyResultFilters(NS.cache.result, domainFilter, evidenceFilter, displayMode);
    }

    const calculationLog = [];
    NS.CALCULATION_SEQUENCE.forEach(s => log(calculationLog, `[${String(s.id).padStart(2, '0')}] ${s.label}`));

    const { windows, skipped, integratedModules } = NS.buildTimingWindows(horizon);
    log(calculationLog, `Integrated modules with usable output: ${integratedModules.length} of ${(window.LIFETIMELINE_MODULE_REGISTRY || []).length} registered`);
    log(calculationLog, `Normalized timing windows: ${windows.length}`);

    let rangeWindows = windows;
    if (customRange && customRange.start && customRange.end) {
      rangeWindows = windows.filter(w => w.endDate >= customRange.start && w.startDate <= customRange.end);
      log(calculationLog, `Custom range applied: ${customRange.start.toISOString().slice(0, 10)} to ${customRange.end.toISOString().slice(0, 10)} — ${rangeWindows.length} windows retained`);
    }

    const eventClusters = NS.groupCorrelatedEvents(rangeWindows);
    eventClusters.forEach(c => { c.tier = NS.classifyClusterTier(c); });
    log(calculationLog, `Correlated-event clusters after deduplication: ${eventClusters.length} (from ${rangeWindows.length} raw windows)`);

    const sequence = NS.buildEventSequence(eventClusters);
    log(calculationLog, `Chronological sequence built across ${sequence.length} clusters`);

    const phaseClusters = NS.buildLifePhaseClusters(eventClusters);
    log(calculationLog, `Life-phase clusters: ${phaseClusters.length}`);

    const currentPhase = NS.getCurrentLifePhaseSummary(phaseClusters);
    const nextCluster = NS.getNextSignificantCluster(phaseClusters);

    const rulesUsed = (window.LIFETIMELINE_RULES || []).slice();

    const result = {
      windows: rangeWindows, eventClusters, sequence, phaseClusters, currentPhase, nextCluster,
      integratedModules, skipped, horizonYears: horizon,
      calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog,
      disclaimer: 'This Life Timeline is a chronological synthesis of this application\'s own existing timing modules, for informational purposes only. It does not independently predict any event, and it is not financial, investment, legal, or medical advice. It never predicts death, lifespan, illness/diagnosis, or accidents, never infers another person\'s private motives, and never guarantees marriage, divorce, or childbirth. Each contributing module\'s own safety restrictions are preserved here exactly as that module states them.'
    };
    NS.cache = Object.assign({ result }, cacheKey);
    return NS.applyResultFilters(result, domainFilter, evidenceFilter, displayMode);
  };

  // Section 28/39 — filters slice only; never recompute.
  NS.applyResultFilters = function (result, domainFilter, evidenceFilter, displayMode) {
    const df = domainFilter || 'All';
    const ef = evidenceFilter || 'All';
    const dm = displayMode || 'Both';
    if (df === 'All' && ef === 'All' && dm === 'Both') return Object.assign({}, result, { domainFilter: df, evidenceFilter: ef, displayMode: dm });
    const matchesDomain = (domains) => df === 'All' || domains.includes(df);
    const matchesEvidence = (level) => ef === 'All' || rank(level) >= rank(ef);
    const filtered = Object.assign({}, result);
    filtered.eventClusters = result.eventClusters.filter(c => matchesDomain(c.domains) && matchesEvidence(c.strongestEvidence));
    filtered.sequence = result.sequence.filter(c => matchesDomain(c.domains) && matchesEvidence(c.strongestEvidence));
    filtered.phaseClusters = result.phaseClusters.filter(p => matchesDomain(p.domains) && p.eventClusters.some(ec => matchesEvidence(ec.strongestEvidence)));
    filtered.domainFilter = df; filtered.evidenceFilter = ef; filtered.displayMode = dm;
    return filtered;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
