/* =========================================================
   DASHA-BASED LIFE PHASE ANALYSIS — pure calculation engine. Master
   Dasha interpretation/synthesis layer: it never computes a new Dasha
   sequence (reuses state.dasha / buildSubPeriods / findCurrentIndex) and
   never creates a new lordship/dignity engine (reuses house-ownership
   lookups on state.chart.planets, SIGN_LORD, detailedDignity,
   vargaPosition). Pipeline per Mahadasha/Antardasha/Pratyantardasha:
   Natal Promise -> Theme Derivation -> Dasha Hierarchy -> Yoga Reference ->
   Divisional Relevance -> Transit Confirmation -> Existing-Module
   Correlation -> Transition Detection -> Safety Filter.
   Exposed only as window.DashaLifePhase. UI lives entirely in
   dashaLifePhaseUI.js.
   ========================================================= */

window.DashaLifePhase = (function () {
  const NS = {};
  NS.debug = false;
  NS.initialized = false;
  NS.cache = null;

  function log(entries, text) { entries.push(text); if (NS.debug) console.log('[DashaLifePhase]', text); }
  function ruleById(id) { return (window.DASHALIFEPHASE_RULES || []).find(r => r.id === id); }

  NS.getChartData = function () { return state.chart || null; };

  NS.scanForForbiddenLanguage = function (text) {
    const s = String(text || '');
    const patterns = window.DASHALIFEPHASE_FORBIDDEN_PATTERNS || [];
    const hits = patterns.filter(re => re.test(s));
    return { forbidden: hits.length > 0, matched: hits.map(re => re.source) };
  };
  NS.applySafetyFilter = function (text) {
    const scan = NS.scanForForbiddenLanguage(text);
    if (!scan.forbidden) return text;
    return 'This period is described qualitatively only; specific outcome, diagnosis, or guarantee language has been withheld. See the disclaimer for this module\'s scope.';
  };

  // --- House ownership / occupation helpers (reads only, never recomputes dignity/lordship) ---
  function housesOwnedBy(chart, planetName) {
    const houses = [];
    for (let h = 1; h <= 12; h++) {
      const signIdx = (SIGNS.indexOf(chart.ascendant.sign) + h - 1) % 12;
      const sign = SIGNS[signIdx];
      if (SIGN_LORD[sign] === planetName) houses.push(h);
    }
    return houses;
  }
  function houseOccupiedBy(chart, planetName) {
    const p = chart.planets.find(pl => pl.name === planetName);
    return p ? Number(p.house) : null;
  }
  function conjunctions(chart, planetName) {
    const p = chart.planets.find(pl => pl.name === planetName);
    return p && Array.isArray(p.conjunctWith) ? p.conjunctWith : [];
  }
  function aspectedByList(chart, planetName) {
    const p = chart.planets.find(pl => pl.name === planetName);
    return p && Array.isArray(p.aspectedBy) ? p.aspectedBy : [];
  }
  function dignityOf(chart, planetName) {
    const p = chart.planets.find(pl => pl.name === planetName);
    if (!p) return null;
    const isClassical = typeof SHADBALA_PLANETS !== 'undefined' && SHADBALA_PLANETS.includes(planetName);
    if (!isClassical) return { tier: 'Neutral' };
    try { return detailedDignity(planetName, p.sign, normalizeDegrees(p.longitude) % 30); } catch (e) { return { tier: 'Neutral' }; }
  }

  // Step 1 — Theme Derivation for a single planet (MD or AD lord), from house
  // ownership + occupation + natural-significator role, weighted by dignity.
  NS.deriveThemeScores = function (planetName) {
    const chart = NS.getChartData();
    const scores = {};
    function add(theme, weight) { scores[theme] = (scores[theme] || 0) + weight; }
    if (!chart) return scores;
    const owned = housesOwnedBy(chart, planetName);
    owned.forEach(h => {
      const entries = window.DASHALIFEPHASE_HOUSE_THEME_MAP[h] || [];
      entries.forEach(e => add(e.theme, e.weight));
    });
    const occHouse = houseOccupiedBy(chart, planetName);
    if (occHouse) {
      const entries = window.DASHALIFEPHASE_HOUSE_THEME_MAP[occHouse] || [];
      entries.forEach(e => add(e.theme, e.weight * 0.5)); // occupation weighs half of ownership
    }
    const karakaEntries = window.DASHALIFEPHASE_PLANET_THEME_MAP[planetName] || [];
    karakaEntries.forEach(e => add(e.theme, e.weight * 0.5));
    const dignity = dignityOf(chart, planetName);
    if (dignity && window.DASHALIFEPHASE_STRONG_TIERS.includes(dignity.tier)) {
      Object.keys(scores).forEach(t => { scores[t] *= 1.25; });
    } else if (dignity && window.DASHALIFEPHASE_WEAK_TIERS.includes(dignity.tier)) {
      Object.keys(scores).forEach(t => { scores[t] *= 0.75; });
    }
    return scores;
  };

  function topThemes(scores) {
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return { primary: 'Mixed/Multi-Domain', secondary: null, isMultiDomain: false };
    const top = entries[0];
    const second = entries[1];
    const isMultiDomain = second && second[1] >= top[1] * 0.85 && entries.length >= 3;
    return { primary: isMultiDomain ? 'Mixed/Multi-Domain' : top[0], secondary: second ? second[0] : null, isMultiDomain, scores: entries };
  }

  // Section 8 — Natal Promise vs Dasha Activation.
  NS.evaluateDashaNatalPromise = function (planetName, chart) {
    chart = chart || NS.getChartData();
    if (!chart) return null;
    const owned = housesOwnedBy(chart, planetName);
    const occHouse = houseOccupiedBy(chart, planetName);
    const dignity = dignityOf(chart, planetName);
    const conj = conjunctions(chart, planetName);
    const aspBy = aspectedByList(chart, planetName);
    const strength = dignity && window.DASHALIFEPHASE_STRONG_TIERS.includes(dignity.tier) ? 'Strong'
      : dignity && window.DASHALIFEPHASE_WEAK_TIERS.includes(dignity.tier) ? 'Weak' : 'Moderate';
    return {
      planet: planetName, housesOwned: owned, houseOccupied: occHouse, dignityTier: dignity ? dignity.tier : 'Unknown',
      conjunctions: conj, aspectedBy: aspBy, natalStrength: strength,
      promiseNote: `${planetName} structurally owns house(s) ${owned.length ? owned.join(', ') : 'none'} and sits in house ${occHouse || '—'} (${dignity ? dignity.tier : 'Unknown'} dignity). This is what the chart promises structurally; it activates specifically during ${planetName}'s own Mahadasha/Antardasha/Pratyantardasha, not necessarily at other times.`
    };
  };

  // Section 13-15 — relevant divisional charts for a theme (never an irrelevant D-chart).
  NS.getRelevantDivisionalCharts = function (planetName, theme) {
    const chart = NS.getChartData();
    if (!chart) return [];
    const info = window.DASHALIFEPHASE_THEME_MODULE_MAP[theme] || { vargas: ['D9'] };
    const p = chart.planets.find(pl => pl.name === planetName);
    if (!p) return [];
    return (info.vargas || ['D9']).map(key => {
      const dn = vargaPosition(p.longitude, key);
      const isClassical = typeof SHADBALA_PLANETS !== 'undefined' && SHADBALA_PLANETS.includes(planetName);
      const dignity = isClassical ? detailedDignity(planetName, dn.sign, normalizeDegrees(dn.longitude) % 30).tier : 'Neutral';
      return { varga: key, sign: dn.sign, dignity };
    });
  };

  // Section 16 — transit confirmation (Jupiter/Saturn only, confirming layer only).
  NS.assessTransitConfirmation = function (planetName, atDate) {
    const chart = NS.getChartData();
    if (!chart) return { available: false };
    const date = atDate || new Date();
    const natal = chart.planets.find(p => p.name === planetName);
    if (!natal) return { available: false };
    function transitSignIndex(name) { return Math.floor(normalizeDegrees(computeSingleLongitude(name, date)) / 30) % 12; }
    const natalSignIdx = SIGNS.indexOf(natal.sign);
    const hits = [];
    ['Jupiter', 'Saturn'].forEach(transiter => {
      const signIdx = transitSignIndex(transiter);
      const offsets = ASPECT_OFFSETS[transiter] || ASPECT_OFFSETS.default;
      if (signIdx === natalSignIdx) hits.push(`Transiting ${transiter} is in ${SIGNS[signIdx]}, conjunct natal ${planetName}.`);
      else if (offsets.some(o => (signIdx + (o - 1)) % 12 === natalSignIdx)) hits.push(`Transiting ${transiter} aspects natal ${planetName} (${natal.sign}).`);
    });
    return { available: true, active: hits.length > 0, evidence: hits.length ? hits : ['No qualifying Jupiter/Saturn transit confirmation found for this date.'] };
  };

  // Sections 17-18 — Shadbala/Ashtakavarga used only if actually present on state (degrade gracefully, never fabricate).
  NS.getSupportingStrengthContext = function (planetName) {
    const ctx = { shadbala: null, ashtakavarga: null };
    if (state.shadbala && state.shadbala[planetName] !== undefined) ctx.shadbala = state.shadbala[planetName];
    if (state.ashtakvarga && state.ashtakvarga[planetName] !== undefined) ctx.ashtakavarga = state.ashtakvarga[planetName];
    return ctx;
  };

  // Section 13-15 / 14 — existing-timing-module correlation. Reference, never re-time.
  function windowsArrayFrom(result) {
    const raw = result && (result.candidateWindows || result.windows);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return [raw.primary, raw.secondary].filter(Boolean);
    return null;
  }
  function overlaps(aStart, aEnd, bStart, bEnd) { return aStart <= bEnd && bStart <= aEnd; }
  NS.getRelatedTimingWindows = function (dashaPeriod, theme) {
    const info = window.DASHALIFEPHASE_THEME_MODULE_MAP[theme] || { modules: [] };
    const hits = [];
    (info.modules || []).forEach(key => {
      if (window[key] && typeof window[key].refresh === 'function') {
        let result; try { result = window[key].refresh(); } catch (e) { result = null; }
        const windows = windowsArrayFrom(result);
        if (!windows) return;
        const overlap = windows.find(w => w && w.startDate && w.endDate && overlaps(dashaPeriod.startDate, dashaPeriod.endDate, w.startDate, w.endDate));
        if (overlap) hits.push({ module: key, window: overlap });
      }
    });
    return hits;
  };

  // Section 32 / step-2 reference — active yogas during this period, read from
  // Yoga Activation Timing (or state.yogas), never re-derived.
  NS.getRelatedYogas = function () {
    if (window.YogaActivationTiming && typeof window.YogaActivationTiming.refresh === 'function') {
      try {
        const r = window.YogaActivationTiming.refresh();
        if (r && Array.isArray(r.currentlyActive)) return r.currentlyActive.map(y => ({ name: y.name, domain: y.domain, activationLevel: y.activationLevel }));
      } catch (e) { /* ignore, degrade gracefully */ }
    }
    if (state.yogas && Array.isArray(state.yogas.presentGood)) {
      return state.yogas.presentGood.map(y => ({ name: y.name, domain: null, activationLevel: 'Present (formation only)' }));
    }
    return [];
  };

  // Section 19 — Mahadasha transition phase (Start/Middle/Transition/End).
  NS.classifyTransitionPhase = function (period, now) {
    now = now || new Date();
    const total = period.endDate.getTime() - period.startDate.getTime();
    if (total <= 0) return 'Middle';
    const elapsed = now.getTime() - period.startDate.getTime();
    const frac = elapsed / total;
    if (frac < 0.1) return 'Start';
    if (frac > 0.9) return 'End';
    if (frac > 0.75) return 'Transition';
    return 'Middle';
  };

  // Section 12 — Mahadasha theme engine.
  NS.generateMahadashaTheme = function (md) {
    const scores = NS.deriveThemeScores(md.lord);
    const t = topThemes(scores);
    const promise = NS.evaluateDashaNatalPromise(md.lord);
    const divisional = NS.getRelevantDivisionalCharts(md.lord, t.primary);
    const yogas = NS.getRelatedYogas();
    const related = NS.getRelatedTimingWindows(md, t.primary);
    return {
      lord: md.lord, startDate: md.startDate, endDate: md.endDate, theme: t.primary, secondaryTheme: t.secondary,
      isMultiDomain: t.isMultiDomain, themeScores: t.scores || [], natalPromise: promise, divisional,
      relatedYogas: yogas, relatedTimingWindows: related,
      narrative: NS.applySafetyFilter(`${md.lord}'s Mahadasha (${fmtDateShort(md.startDate)} to ${fmtDateShort(md.endDate)}) carries a broad life-phase theme of ${t.primary}${t.secondary && !t.isMultiDomain ? ` with a secondary emphasis on ${t.secondary}` : ''}, based on ${md.lord}'s house ownership/occupation, sign/dignity, and natural-significator role in this specific chart.`)
    };
  };

  function fmtDateShort(d) { return d ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` : '?'; }

  // Section 10 — Antardasha refinement: AD refines the MD theme, never an
  // isolated prediction. AD theme is blended with MD theme (MD retains
  // majority weight) rather than replacing it outright.
  NS.analyzeAntardashaTheme = function (ad, mdTheme) {
    const scores = NS.deriveThemeScores(ad.lord);
    const t = topThemes(scores);
    const refinesMD = t.primary === mdTheme.theme || t.primary === mdTheme.secondaryTheme;
    const promise = NS.evaluateDashaNatalPromise(ad.lord);
    const transit = NS.assessTransitConfirmation(ad.lord);
    const related = NS.getRelatedTimingWindows(ad, t.primary);
    return {
      lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate, theme: t.primary, refinesMahadashaTheme: refinesMD,
      natalPromise: promise, transit, relatedTimingWindows: related,
      narrative: NS.applySafetyFilter(refinesMD
        ? `${ad.lord}'s Antardasha (within ${mdTheme.lord}'s Mahadasha) reinforces the ${mdTheme.theme} theme, adding ${t.primary === mdTheme.theme ? 'direct emphasis' : 'a related secondary note'}.`
        : `${ad.lord}'s Antardasha introduces a refinement toward ${t.primary} within the broader ${mdTheme.theme} Mahadasha theme — read as a nuance inside the Mahadasha's overall arc, not a separate, isolated prediction.`)
    };
  };

  // Section 11-12 — Pratyantardasha refinement + Dasha Hierarchy guard. A weak,
  // isolated PD theme must never override a strong MD/AD theme without its own
  // structural evidence (house ownership/occupation/dignity/conjunction tying
  // it to a different theme).
  NS.analyzePratyantarTheme = function (pd, mdTheme, adTheme) {
    const scores = NS.deriveThemeScores(pd.lord);
    const t = topThemes(scores);
    const promise = NS.evaluateDashaNatalPromise(pd.lord);
    const hasOwnStructuralEvidence = (promise.housesOwned && promise.housesOwned.length > 0) || promise.natalStrength === 'Strong';
    const conflictsWithParent = t.primary !== mdTheme.theme && t.primary !== adTheme.theme;
    const allowedToOverride = conflictsWithParent && hasOwnStructuralEvidence;
    const effectiveTheme = allowedToOverride ? t.primary : adTheme.theme;
    return {
      lord: pd.lord, startDate: pd.startDate, endDate: pd.endDate, rawTheme: t.primary, effectiveTheme,
      overrodeParent: allowedToOverride, hierarchyGuardApplied: conflictsWithParent && !allowedToOverride,
      natalPromise: promise,
      narrative: NS.applySafetyFilter(allowedToOverride
        ? `${pd.lord}'s Pratyantardasha shows its own structural evidence (house ownership/strong dignity) for a ${t.primary} emphasis, refining the timing within ${adTheme.theme}.`
        : conflictsWithParent
          ? `${pd.lord}'s Pratyantardasha alone suggests ${t.primary}, but without independent structural evidence (house ownership/strong dignity) it does not override the established ${adTheme.theme} theme of the surrounding Antardasha/Mahadasha — shown here as a minor, non-dominant nuance only.`
          : `${pd.lord}'s Pratyantardasha refines the timing within the ${adTheme.theme} theme already established at the Mahadasha/Antardasha level.`)
    };
  };

  // Full hierarchy build for one MD -> all AD -> current PD.
  NS.buildMahadashaBreakdown = function (md) {
    const mdTheme = NS.generateMahadashaTheme(md);
    const antardashas = (md.antardashas || []).map(ad => {
      const adTheme = NS.analyzeAntardashaTheme(ad, mdTheme);
      return Object.assign({}, ad, { themeAnalysis: adTheme });
    });
    return { mahadasha: md, mdTheme, antardashas };
  };

  // Section 22-23 — current & next phase synthesis.
  NS.getCurrentPhase = function () {
    if (!state.dasha || !state.dasha.length) return null;
    const idx = findCurrentIndex(state.dasha);
    if (idx < 0) return null;
    const md = state.dasha[idx];
    const mdTheme = NS.generateMahadashaTheme(md);
    const aIdx = findCurrentIndex(md.antardashas);
    const ad = aIdx >= 0 ? md.antardashas[aIdx] : null;
    const adTheme = ad ? NS.analyzeAntardashaTheme(ad, mdTheme) : null;
    let pd = null, pdTheme = null;
    if (ad) {
      const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
      const pIdx = findCurrentIndex(pds);
      pd = pIdx >= 0 ? pds[pIdx] : null;
      if (pd && adTheme) pdTheme = NS.analyzePratyantarTheme(pd, mdTheme, adTheme);
    }
    const transitionPhase = NS.classifyTransitionPhase(md);
    return { mahadasha: md, mdTheme, antardasha: ad, adTheme, pratyantar: pd, pdTheme, transitionPhase };
  };
  NS.getNextPhase = function () {
    if (!state.dasha || !state.dasha.length) return null;
    const idx = findCurrentIndex(state.dasha);
    if (idx < 0 || idx + 1 >= state.dasha.length) {
      // no next MD on record (or currently in last known) — check next AD within current MD
      if (idx >= 0) {
        const md = state.dasha[idx];
        const aIdx = findCurrentIndex(md.antardashas);
        if (aIdx >= 0 && aIdx + 1 < md.antardashas.length) {
          const ad = md.antardashas[aIdx + 1];
          const mdTheme = NS.generateMahadashaTheme(md);
          return { level: 'Antardasha', mahadasha: md, mdTheme, antardasha: ad, adTheme: NS.analyzeAntardashaTheme(ad, mdTheme) };
        }
      }
      return null;
    }
    const nextMd = state.dasha[idx + 1];
    return { level: 'Mahadasha', mahadasha: nextMd, mdTheme: NS.generateMahadashaTheme(nextMd) };
  };

  // Section 24 — full life dashboard table, every Mahadasha with its theme.
  NS.buildLifeDashboard = function () {
    if (!state.dasha || !state.dasha.length) return [];
    const now = new Date();
    return state.dasha.map(md => {
      const mdTheme = NS.generateMahadashaTheme(md);
      const isCurrent = md.startDate <= now && now <= md.endDate;
      return { lord: md.lord, startDate: md.startDate, endDate: md.endDate, theme: mdTheme.theme, secondaryTheme: mdTheme.secondaryTheme, isCurrent, transitionPhase: isCurrent ? NS.classifyTransitionPhase(md, now) : null };
    });
  };

  // Section 25-26 — time + domain filters (never recalculate; slice only).
  NS.applyFilters = function (dashboard, horizonYears, domainFilter) {
    const now = new Date();
    let rows = dashboard;
    if (horizonYears && horizonYears !== 'full-life') {
      const end = new Date(now.getTime() + Number(horizonYears) * 365.25 * 24 * 60 * 60 * 1000);
      rows = rows.filter(r => r.startDate <= end && r.endDate >= now);
    }
    if (domainFilter && domainFilter !== 'All') {
      rows = rows.filter(r => r.theme === domainFilter || r.secondaryTheme === domainFilter);
    }
    return rows;
  };

  // Section 40 — health-domain theme safety pass. Reuses
  // HealthRecoveryTiming's own scanner when available (per discovery
  // inventory guidance), in addition to this module's own scanner.
  NS.applyHealthDomainSafety = function (theme, text) {
    if (theme !== 'Health/Recovery Context') return text;
    let out = NS.applySafetyFilter(text);
    if (window.HealthRecoveryTiming && typeof window.HealthRecoveryTiming.applySafetyFilter === 'function') {
      try { out = window.HealthRecoveryTiming.applySafetyFilter(out, false); } catch (e) { /* degrade gracefully */ }
    }
    return out;
  };

  NS.CALCULATION_SEQUENCE = [
    { id: 1, label: 'Dasha structure read from state.dasha / buildSubPeriods / findCurrentIndex (never recomputed)' },
    { id: 2, label: 'Natal Promise evaluated per planet (house ownership/occupation/dignity/conjunction/aspect)' },
    { id: 3, label: 'Mahadasha theme derived (house-lordship + natural-significator weighting)' },
    { id: 4, label: 'Antardasha theme derived and blended as a refinement of the Mahadasha theme' },
    { id: 5, label: 'Pratyantardasha theme derived, subject to the Dasha-Hierarchy guard (no override without evidence)' },
    { id: 6, label: 'Relevant divisional chart(s) selected for the theme domain only' },
    { id: 7, label: 'Transit confirmation assessed (Jupiter/Saturn, confirming layer only)' },
    { id: 8, label: 'Shadbala/Ashtakavarga context read only if present on state (no fabrication)' },
    { id: 9, label: 'Existing-timing-module correlation checked (reference, never re-time)' },
    { id: 10, label: 'Related Yoga Activation Timing output referenced (never re-derived)' },
    { id: 11, label: 'Mahadasha transition phase classified (Start/Middle/Transition/End)' },
    { id: 12, label: 'Health-domain themes passed through safety filter (own scanner + HealthRecoveryTiming\'s when available)' }
  ];

  NS.refresh = function (horizonYears, domainFilter) {
    const chart = NS.getChartData();
    const horizon = horizonYears || 'full-life';
    if (!chart || !state.dasha || !state.dasha.length) { NS.cache = null; return null; }
    if (NS.cache && NS.cache.chartRef === chart && NS.cache.dashaRef === state.dasha && NS.cache.yogasRef === state.yogas) {
      return NS.applyResultFilters(NS.cache.result, horizon, domainFilter);
    }
    const calculationLog = [];
    NS.CALCULATION_SEQUENCE.forEach(s => log(calculationLog, `[${String(s.id).padStart(2, '0')}] ${s.label}`));

    const current = NS.getCurrentPhase();
    const next = NS.getNextPhase();
    const dashboard = NS.buildLifeDashboard();

    // health-domain safety sweep across dashboard + current/next narratives
    if (current && current.mdTheme) current.mdTheme.narrative = NS.applyHealthDomainSafety(current.mdTheme.theme, current.mdTheme.narrative);
    if (current && current.adTheme) current.adTheme.narrative = NS.applyHealthDomainSafety(current.adTheme.theme, current.adTheme.narrative);
    if (current && current.pdTheme) current.pdTheme.narrative = NS.applyHealthDomainSafety(current.pdTheme.effectiveTheme, current.pdTheme.narrative);
    if (next && next.mdTheme) next.mdTheme.narrative = NS.applyHealthDomainSafety(next.mdTheme.theme, next.mdTheme.narrative);

    const rulesUsedIds = new Set(['DASHALP-REUSE-001', 'DASHALP-THEME-001', 'DASHALP-PROMISE-001', 'DASHALP-HIER-001', 'DASHALP-CROSSMODULE-001', 'DASHALP-YOGAREF-001', 'DASHALP-VARGA-001', 'DASHALP-TRANSIT-001', 'DASHALP-NOFAB-001', 'DASHALP-NOGUARANTEE-001', 'DASHALP-NODEATH-001', 'DASHALP-NOALWAYS-001', 'DASHALP-FILTER-001']);
    const rulesUsed = Array.from(rulesUsedIds).map(ruleById).filter(Boolean);

    const missing = [];
    if (!state.shadbala) missing.push('Shadbala (not computed for this chart / no window.* export — degraded gracefully)');
    if (!state.ashtakvarga) missing.push('Ashtakavarga (not present on state for this chart — degraded gracefully)');

    const result = {
      current, next, dashboard, missing, calculationSteps: NS.CALCULATION_SEQUENCE, rulesUsed, calculationLog,
      disclaimer: 'This is an astrological life-phase interpretation of this chart\'s existing Dasha (planetary period) sequence, for informational purposes only. It never guarantees a specific event, and it is not financial, investment, legal, or medical advice. It never predicts death, lifespan, illness/diagnosis, accidents, or another person\'s private motives, and it never guarantees marriage, divorce, or childbirth.'
    };
    NS.cache = { chartRef: chart, dashaRef: state.dasha, yogasRef: state.yogas, result };
    return NS.applyResultFilters(result, horizon, domainFilter);
  };

  NS.applyResultFilters = function (result, horizonYears, domainFilter) {
    if ((!horizonYears || horizonYears === 'full-life') && (!domainFilter || domainFilter === 'All')) return result;
    const filtered = Object.assign({}, result);
    filtered.dashboard = NS.applyFilters(result.dashboard, horizonYears, domainFilter);
    filtered.horizonYears = horizonYears;
    filtered.domainFilter = domainFilter;
    return filtered;
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
