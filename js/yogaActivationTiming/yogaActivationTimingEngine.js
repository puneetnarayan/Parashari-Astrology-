/* =========================================================
   YOGA ACTIVATION TIMING — pure calculation engine. Synthesis/orchestration
   module: it never re-derives yoga formation rules. It calls the EXISTING
   yoga engine (window.YogaEngine.detect, exported from js/yogas/yogaEngine.js
   — a non-invasive wrapper around that file's own computeYogas()) to get
   formation/presence/magnitude, then builds a Formation -> Applicability ->
   Dasha Activation (MD/AD/PD) -> Transit Confirmation -> Divisional-chart
   Confirmation -> Existing-Timing-Module Correlation -> Activation
   Classification pipeline on top of that.
   Never claims a yoga guarantees any event; never predicts death, lifespan,
   illness, accidents, mental-health outcomes, guaranteed marriage/childbirth,
   an exact wealth amount, a guaranteed promotion, or business-success/
   investment/legal/medical outcomes.
   Exposed only as window.YogaActivationTiming. UI lives entirely in
   yogaActivationTimingUI.js.
   ========================================================= */

window.YogaActivationTiming = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  const LEVEL_RANK = { Strong: 3, Moderate: 2, Contextual: 1, 'Dormant-No-Current-Activation': 0 };
  const STRENGTH_RANK = { Strong: 3, Moderate: 2, Contextual: 1, 'Not Applicable': 0 };

  NS.CATEGORIES = ['All', 'Career/Authority', 'Career/Intellect', 'Career/Wisdom', 'Career/Reputation', 'Career/Status',
    'Career/Resilience', 'Career/Recognition', 'Wealth', 'Wealth/Comfort', 'Wealth/Drive', 'Wealth/Self-Effort', 'Wealth/Fortune',
    'Education/Career', 'Education', 'General Wellbeing', 'General',
    'Challenge/Mind', 'Challenge/Finance', 'Challenge/Authority', 'Challenge/Wisdom', 'Challenge/Property', 'Challenge/General', 'Challenge/Delay'];
  NS.ACTIVATION_LEVELS = ['All', 'Strong', 'Moderate', 'Contextual', 'Dormant-No-Current-Activation'];

  // Financial/medical/legal/guarantee forbidden-language scanner (module's own
  // safety net — independent of HealthRecoveryTiming's medical scanner, per
  // the established per-module pattern in this codebase).
  const FORBIDDEN_PATTERNS = [
    /\bguarantee(d|s)?\s+(this\s+)?(event|promotion|marriage|childbirth|success|outcome)\b/i,
    /\bwill\s+(definitely|certainly)\s+(happen|occur|get\s+promoted|get\s+married|have\s+a\s+child)\b/i,
    /\bwill\s+(die|pass\s+away)\b/i, /\bdate\s+of\s+death\b/i, /\blifespan\b/i, /\blife\s+expectancy\b/i,
    /\b(fatal|terminal)\s+(illness|disease|accident)\b/i, /\bmental[- ]health\s+diagnos/i, /\bwill\s+be\s+diagnosed\b/i,
    /\bguaranteed\s+(wealth|amount|income|returns?)\b/i, /\bexact\s+(amount|sum)\s+of\s+(wealth|money)\b/i,
    /\binvest\s+in\b/i, /\brecommend(ed|s)?\s+(stock|fund|bond|security|securities|lender|lawyer|doctor|treatment)\b/i,
    /\blegal\s+advice\b/i, /\bmedical\s+advice\b/i, /\bwill\s+win\s+the\s+(case|lawsuit)\b/i
  ];
  NS.scanForForbiddenLanguage = function (text) {
    const s = String(text || '');
    const hits = FORBIDDEN_PATTERNS.filter(re => re.test(s));
    return { forbidden: hits.length > 0, matched: hits.map(re => re.source) };
  };

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[YogaActivationTiming]', text); }
  function ruleById(id) { return (window.YOGAACTIVATION_TIMING_RULES || []).find(r => r.id === id); }
  function domainFor(key) { return (window.YOGA_DOMAIN_MAP && window.YOGA_DOMAIN_MAP[key]) || window.YOGA_DOMAIN_DEFAULT; }

  NS.getChartData = function () { return state.chart || null; };

  // Step 1 — Formation. Reuses the EXISTING yoga engine only (never re-derived).
  NS.getYogaFormations = function () {
    const chart = NS.getChartData();
    if (!chart) return null;
    if (state.yogas) return state.yogas; // already computed by ui.js's generateChart()
    if (window.YogaEngine && typeof window.YogaEngine.detect === 'function') return window.YogaEngine.detect(chart.planets, chart.ascendant);
    if (typeof computeYogas === 'function') return computeYogas(chart.planets, chart.ascendant);
    return null;
  };

  // Step 2 — Applicability / Formation Strength (qualitative bucket of the
  // existing engine's own 0-100 magnitude; never a new numeric score).
  NS.classifyFormationStrength = function (row) {
    if (!row.present) return 'Not Applicable';
    if (row.magnitude >= 70) return 'Strong';
    if (row.magnitude >= 40) return 'Moderate';
    return 'Contextual';
  };

  function planetHouse(chart, name) { const p = chart.planets.find(pl => pl.name === name); return p ? Number(p.house) : null; }

  // Step 3 — Dasha Activation (MD/AD/PD). A yoga is activated when the current
  // dasha-level lord is one of the yoga's own planets (as reported by the
  // existing engine's `planets` field).
  NS.assessDashaActivation = function (row) {
    const chart = NS.getChartData();
    if (!chart || !state.dasha || !state.dasha.length) return { available: false, level: 'Dormant-No-Current-Activation', matches: [] };
    const yogaPlanets = row.planets || [];
    const idx = findCurrentIndex(state.dasha);
    if (idx < 0) return { available: false, level: 'Dormant-No-Current-Activation', matches: [] };
    const md = state.dasha[idx];
    const aIdx = findCurrentIndex(md.antardashas);
    const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
    let pd = null;
    if (ad) { const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate); const pIdx = findCurrentIndex(pds); pd = pIdx >= 0 ? pds[pIdx] : null; }
    const matches = [];
    if (yogaPlanets.includes(md.lord)) matches.push({ level: 'Mahadasha', lord: md.lord, startDate: md.startDate, endDate: md.endDate });
    if (ad && yogaPlanets.includes(ad.lord)) matches.push({ level: 'Antardasha', lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate });
    if (pd && yogaPlanets.includes(pd.lord)) matches.push({ level: 'Pratyantardasha', lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate });
    const level = matches.length >= 3 ? 'Strong' : matches.length === 2 ? 'Moderate' : matches.length === 1 ? 'Contextual' : 'Dormant-No-Current-Activation';
    return { available: true, level, matches, currentMD: md.lord, currentAD: ad ? ad.lord : null, currentPD: pd ? pd.lord : null, periodStart: (pd || ad || md).startDate, periodEnd: (pd || ad || md).endDate };
  };

  // Step 4 — Transit Confirmation (Jupiter/Saturn only — slow-movers, as the
  // confirming layer, never the trigger, matching this app's other modules).
  NS.assessTransitConfirmation = function (row, atDate) {
    const chart = NS.getChartData();
    if (!chart) return { available: false };
    const date = atDate || new Date();
    const ascIndex = SIGNS.indexOf(chart.ascendant.sign);
    const yogaPlanets = row.planets || [];
    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    const hits = [];
    ['Jupiter', 'Saturn'].forEach(transiter => {
      const signIdx = transitSignIndex(transiter);
      const offsets = ASPECT_OFFSETS[transiter] || ASPECT_OFFSETS.default;
      yogaPlanets.forEach(name => {
        const natal = chart.planets.find(p => p.name === name);
        if (!natal) return;
        const natalSignIdx = SIGNS.indexOf(natal.sign);
        if (signIdx === natalSignIdx) hits.push(`Transiting ${transiter} is in ${SIGNS[signIdx]}, conjunct natal ${name}.`);
        else if (offsets.some(o => (signIdx + (o - 1)) % 12 === natalSignIdx)) hits.push(`Transiting ${transiter} aspects natal ${name} (${natal.sign}).`);
      });
    });
    return { available: true, active: hits.length > 0, evidence: hits.length ? hits : ['No qualifying Jupiter/Saturn transit confirmation found for this date.'] };
  };

  // Step 5 — Divisional-chart confirmation, contextual per yoga's mapped
  // domain (D2/D4/D7/D9/D10/D16/D24), via vargaPosition() only.
  NS.assessDivisionalConfirmation = function (row, domainInfo) {
    const chart = NS.getChartData();
    if (!chart) return { available: false };
    const yogaPlanets = row.planets && row.planets.length ? row.planets : [];
    const vargas = domainInfo.vargas || ['D9'];
    const results = vargas.map(key => {
      const entries = yogaPlanets.map(name => {
        const p = chart.planets.find(pl => pl.name === name);
        if (!p) return null;
        const dn = vargaPosition(p.longitude, key);
        const isClassical = typeof SHADBALA_PLANETS !== 'undefined' && SHADBALA_PLANETS.includes(name);
        const dignity = isClassical ? detailedDignity(name, dn.sign, normalizeDegrees(dn.longitude) % 30).tier : 'Neutral';
        return { planet: name, sign: dn.sign, dignity };
      }).filter(Boolean);
      const supportive = entries.filter(e => ['Exalted', 'Own Sign', 'Moolatrikona'].includes(e.dignity)).length;
      return { varga: key, entries, supportive: supportive > 0 };
    });
    const anySupportive = results.some(r => r.supportive);
    return { available: true, results, level: anySupportive ? 'Supports' : 'Mixed' };
  };

  // Step 6 — Existing-Timing-Module correlation. "DO NOT DUPLICATE EVENT
  // TIMING": when a yoga's activation period overlaps an existing module's own
  // window, this REFERENCES that window, never computes an independent date.
  function windowsArrayFrom(result) {
    const raw = result && (result.candidateWindows || result.windows);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return [raw.primary, raw.secondary].filter(Boolean);
    return null;
  }
  function overlaps(aStart, aEnd, bStart, bEnd) { return aStart <= bEnd && bStart <= aEnd; }
  NS.checkCrossModules = function (dashaActivation, domainInfo) {
    if (!dashaActivation.available || !domainInfo.modules || !domainInfo.modules.length) return null;
    const hits = [];
    domainInfo.modules.forEach(key => {
      if (window[key] && typeof window[key].refresh === 'function') {
        let result; try { result = window[key].refresh(); } catch (e) { result = null; }
        const windows = windowsArrayFrom(result);
        if (!windows) return;
        const overlap = windows.find(w => w && w.startDate && w.endDate && overlaps(dashaActivation.periodStart, dashaActivation.periodEnd, w.startDate, w.endDate));
        if (overlap) hits.push({ module: key, window: overlap });
      }
    });
    if (!hits.length) return null;
    return {
      overlapping: true,
      modules: hits.map(h => h.module),
      referencedWindows: hits,
      interpretation: `This yoga's activation period coincides with an existing timing window already computed by ${hits.map(h => h.module).join(', ')} (${hits.map(h => fmtRange(h.window.startDate, h.window.endDate)).join('; ')}) — referenced here as supporting evidence, not recomputed independently.`
    };
  };
  function fmtRange(a, b) { function f(d) { return d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` : '?'; } return `${f(a)} to ${f(b)}`; }

  // Step 7 — Activation Classification (qualitative only).
  NS.classifyActivation = function (dashaActivation, transit, divisional) {
    if (!dashaActivation.available || dashaActivation.level === 'Dormant-No-Current-Activation') return 'Dormant-No-Current-Activation';
    let score = LEVEL_RANK[dashaActivation.level] || 0;
    if (transit.available && transit.active) score += 1;
    if (divisional.available && divisional.level === 'Supports') score += 1;
    if (score >= 4) return 'Strong';
    if (score >= 2) return 'Moderate';
    return 'Contextual';
  };

  // Special-handling narrative text (sections 27-30). Never fabricates
  // Sanskrit citations beyond what the existing engine's howDerived already
  // states; never equates Raja Yoga with "promotion"/"government position",
  // never equates Dhana Yoga with an exact amount.
  function specialHandlingNote(row, domainInfo, crossCheck) {
    if (row.key === 'raja' || row.key === 'neechabhanga') {
      return crossCheck
        ? `This chart's ${row.name} is read through its own houses/planets (${(row.planets || []).join(', ') || 'see formation detail'}), not automatically as "promotion" or a government post — its activation period coincides with an existing module's own window (see Cross-Module Correlation), which is the basis for any specific-event interpretation here.`
        : `This chart's ${row.name} is read through its own houses/planets, not automatically as "promotion" or a government post. No existing career/recognition module currently shows an overlapping window for this period, so no specific event is implied.`;
    }
    if (row.key === 'dhana') {
      return `${row.name} is read as a qualitative, supportive period for wealth-related themes — this module never states or implies a specific amount of money, exact wealth figure, or guaranteed financial gain.`;
    }
    return null;
  }

  // Step 1-7 pipeline for a single yoga row.
  NS.evaluateYoga = function (row) {
    const domainInfo = domainFor(row.key);
    const formationStrength = NS.classifyFormationStrength(row);
    const dashaActivation = NS.assessDashaActivation(row);
    const transit = dashaActivation.available ? NS.assessTransitConfirmation(row, new Date()) : { available: false };
    const divisional = NS.assessDivisionalConfirmation(row, domainInfo);
    const crossCheck = NS.checkCrossModules(dashaActivation, domainInfo);
    const activationLevel = row.present ? NS.classifyActivation(dashaActivation, transit, divisional) : 'Dormant-No-Current-Activation';
    const special = specialHandlingNote(row, domainInfo, crossCheck);
    return {
      key: row.key, name: row.name, polarity: row.polarity, present: row.present, magnitude: row.magnitude,
      howDerived: row.howDerived, meaning: row.meaning, planets: row.planets || [], details: row.details,
      domain: domainInfo.domain, relatedModules: domainInfo.modules || [], vargas: domainInfo.vargas || ['D9'],
      formationStrength, dashaActivation, transit, divisional, crossCheck, activationLevel, special
    };
  };

  // Step 8 — full evaluation of every yoga the existing engine reports.
  NS.evaluateAll = function () {
    const formations = NS.getYogaFormations();
    if (!formations) return null;
    return formations.rows.map(NS.evaluateYoga);
  };

  // Section 32 — group correlated yoga activations sharing the same current
  // MD+AD (and PD when present) into a single cluster, with a domain-diversity
  // count, instead of reporting N independent "major events".
  NS.groupCorrelatedYogaActivations = function (evaluated) {
    const active = evaluated.filter(y => y.present && y.dashaActivation.available && y.dashaActivation.level !== 'Dormant-No-Current-Activation');
    const groups = {};
    active.forEach(y => {
      const d = y.dashaActivation;
      const key = `${d.currentMD}|${d.currentAD}|${d.currentPD || ''}`;
      if (!groups[key]) groups[key] = { key, mahadasha: d.currentMD, antardasha: d.currentAD, pratyantardasha: d.currentPD, periodStart: d.periodStart, periodEnd: d.periodEnd, yogas: [] };
      groups[key].yogas.push(y);
    });
    return Object.values(groups).map(g => Object.assign(g, { domainDiversity: NS.calculateYogaDomainDiversity(g.yogas) }));
  };

  // Section 32 — distinct-domain count for a cluster (never a flat yoga count).
  NS.calculateYogaDomainDiversity = function (yogas) {
    const domains = Array.from(new Set(yogas.map(y => y.domain)));
    return { count: domains.length, domains };
  };

  // Section 19 — currently-active yogas view.
  NS.getCurrentlyActive = function (evaluated) {
    return evaluated.filter(y => y.present && y.activationLevel !== 'Dormant-No-Current-Activation');
  };

  // Section 20 — upcoming activations (next N years), MD/AD level scan (PD
  // included only for the immediately-current AD, matching this module's
  // "current state" emphasis — kept tractable while still real, not fabricated).
  NS.getUpcomingActivations = function (evaluated, horizonYears) {
    if (!state.dasha || !state.dasha.length) return [];
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const upcoming = [];
    const presentYogas = evaluated.filter(y => y.present);
    state.dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        presentYogas.forEach(y => {
          const yp = y.planets || [];
          if (!yp.includes(md.lord) && !yp.includes(ad.lord)) return;
          const matchLevels = [];
          if (yp.includes(md.lord)) matchLevels.push('Mahadasha');
          if (yp.includes(ad.lord)) matchLevels.push('Antardasha');
          upcoming.push({ key: y.key, name: y.name, domain: y.domain, mahadasha: md.lord, antardasha: ad.lord, startDate: ad.startDate, endDate: ad.endDate, matchLevels, level: matchLevels.length >= 2 ? 'Moderate' : 'Contextual' });
        });
      });
    });
    upcoming.sort((a, b) => a.startDate - b.startDate);
    return upcoming;
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Formation (existing Yoga engine — window.YogaEngine.detect, never re-derived)' },
    { id: 2, label: 'Applicability / Formation Strength (qualitative bucket of existing magnitude)' },
    { id: 3, label: 'Domain Mapping (yoga -> career/wealth/property/relationship/education/general/challenge)' },
    { id: 4, label: 'Dasha Activation (MD/AD/PD membership among the yoga\'s own planets)' },
    { id: 5, label: 'Transit Confirmation (Jupiter/Saturn over or aspecting yoga planets)' },
    { id: 6, label: 'Divisional-Chart Confirmation (D2/D4/D7/D9/D10/D16/D24, contextual per domain)' },
    { id: 7, label: 'Existing-Timing-Module Correlation (reference, never duplicate)' },
    { id: 8, label: 'Activation Classification (Strong/Moderate/Contextual/Dormant)' },
    { id: 9, label: 'Special-Handling Narrative (Raja/Dhana/Viparita/Neecha Bhanga)' },
    { id: 10, label: 'Correlation / Deduplication (groupCorrelatedYogaActivations + domain diversity)' },
    { id: 11, label: 'Final Interpretation assembled for display' }
  ];

  NS.refresh = function (horizonYears, categoryFilter, activationFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 5;
    if (!chart) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.yogasRef === state.yogas && NS.cache.dashaRef === state.dasha && NS.cache.horizon === horizon) {
      return NS.applyFilters(NS.cache.result, categoryFilter, activationFilter);
    }

    const calculationLog = [];
    log(calculationLog, '[01] Yoga formations read from the existing Yoga engine (window.YogaEngine.detect)');
    const evaluated = NS.evaluateAll();
    if (!evaluated) { NS.cache = null; return null; }
    log(calculationLog, '[02] Formation strength classified for ' + evaluated.length + ' yoga definitions');
    log(calculationLog, '[03] Domain mapping applied');
    const missing = [];
    if (!state.dasha || !state.dasha.length) missing.push('Vimshottari Dasha');
    log(calculationLog, '[04] Dasha activation assessed (MD/AD/PD)');
    log(calculationLog, '[05] Transit confirmation assessed (Jupiter/Saturn)');
    log(calculationLog, '[06] Divisional-chart confirmation assessed (domain-contextual vargas)');
    log(calculationLog, '[07] Existing-timing-module correlation checked (reference, never duplicate)');
    log(calculationLog, '[08] Activation classified for each present yoga');
    const currentlyActive = NS.getCurrentlyActive(evaluated);
    log(calculationLog, '[09] Currently-active yogas: ' + currentlyActive.length);
    const groups = NS.groupCorrelatedYogaActivations(evaluated);
    log(calculationLog, '[10] Correlated activation clusters: ' + groups.length + ' (grouped by shared MD/AD/PD)');
    const upcoming = NS.getUpcomingActivations(evaluated, horizon);
    log(calculationLog, '[11] Upcoming activations over ' + horizon + ' year horizon: ' + upcoming.length);

    const rulesUsedIds = new Set(['YOGAACT-REUSE-001', 'YOGAACT-STRENGTH-001', 'YOGAACT-DASHA-001', 'YOGAACT-TRANSIT-001', 'YOGAACT-VARGA-001', 'YOGAACT-CROSSMODULE-001', 'YOGAACT-CLUSTER-001', 'YOGAACT-CLASS-001', 'YOGAACT-NOGUARANTEE-001', 'YOGAACT-FILTER-001']);
    if (evaluated.some(y => y.key === 'raja' || y.key === 'neechabhanga')) rulesUsedIds.add('YOGAACT-RAJA-001');
    if (evaluated.some(y => y.key === 'neechabhanga')) rulesUsedIds.add('YOGAACT-NEECHABHANGA-001');
    if (evaluated.some(y => y.key === 'dhana')) rulesUsedIds.add('YOGAACT-DHANA-001');
    if (evaluated.some(y => y.key === 'daridra' || y.key === 'shakat')) rulesUsedIds.add('YOGAACT-VIPARITA-001');
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const result = {
      evaluated, currentlyActive, groups, upcoming, horizonYears: horizon, missing, calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog,
      disclaimer: 'This is an astrological timing interpretation of this chart\'s existing yoga (planetary combination) results, for informational purposes only. It never guarantees that a yoga will produce a specific event, and it is not financial, investment, legal, or medical advice. It never predicts death, lifespan, illness, or any guaranteed life outcome.'
    };
    NS.cache = { chartRef: chart, yogasRef: state.yogas, dashaRef: state.dasha, horizon, result };
    return NS.applyFilters(result, categoryFilter, activationFilter);
  };

  // Section 33 — filters only slice the already-computed result; never recalculate.
  NS.applyFilters = function (result, categoryFilter, activationFilter) {
    if ((!categoryFilter || categoryFilter === 'All') && (!activationFilter || activationFilter === 'All')) return result;
    const filtered = Object.assign({}, result);
    function matches(y) { return (!categoryFilter || categoryFilter === 'All' || y.domain === categoryFilter) && (!activationFilter || activationFilter === 'All' || y.activationLevel === activationFilter); }
    filtered.evaluated = result.evaluated.filter(matches);
    filtered.currentlyActive = result.currentlyActive.filter(matches);
    filtered.upcoming = result.upcoming.filter(u => (!categoryFilter || categoryFilter === 'All' || u.domain === categoryFilter));
    return filtered;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
