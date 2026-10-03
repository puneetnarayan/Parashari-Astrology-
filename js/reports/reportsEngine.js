/* =========================================================
   REPORTS — pure data-aggregation layer. window.ReportsEngine.

   This module NEVER computes a new planetary, house, dasha, transit,
   or divisional-chart position, and NEVER derives a new finding. It
   only reads the existing engines' own already-computed state
   (state.chart/state.dasha/state.yogas/state.shadbala/state.ashtakvarga)
   and the existing ~27 single-event timing modules' own .refresh()
   output (per docs/_moduleDiscoveryInventory.md: candidateWindows ||
   windows, Array.isArray guard, MarriageTiming object-shape fallback),
   plus the synthesis layers (YogaActivationTiming, DashaLifePhase,
   LifeTimeline, MajorLifeTransitionTiming) and the daily/electional
   modules (PanchangDailyAlmanac, MuhurtaElectional).

   No new _RULES array is defined here — this module aggregates
   existing rule provenance, it does not introduce new astrological
   rules (documented in docs/reports/research-notes.md).

   Placed LAST among all module scripts in index.html, exactly like
   Life Timeline's own placement, since it consumes virtually
   everything else.
   ========================================================= */

window.ReportsEngine = (function () {
  const NS = {};

  // ---------------------------------------------------------------
  // Shared defensive helpers (copied verbatim idiom from
  // docs/_moduleDiscoveryInventory.md's "GOTCHA" section).
  // ---------------------------------------------------------------
  function windowsArrayFrom(result) {
    const raw = result && (result.candidateWindows || result.windows);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return [raw.primary, raw.secondary].filter(Boolean);
    return null;
  }

  // Safe call of window[globalName].refresh(...args) — never throws out.
  function safeRefresh(globalName, args) {
    try {
      const g = window[globalName];
      if (!g || typeof g.refresh !== 'function') return { ok: false, reason: 'module not present in this build' };
      const result = g.refresh.apply(g, args || []);
      if (!result) return { ok: false, reason: 'no result for current chart' };
      return { ok: true, result };
    } catch (e) {
      return { ok: false, reason: 'refresh() threw: ' + (e && e.message) };
    }
  }

  // ---------------------------------------------------------------
  // Topic registry — reuses window.LIFETIMELINE_MODULE_REGISTRY (the
  // already-verified list of the ~27 single-event timing modules) when
  // present, falling back to a hardcoded equivalent list so this tab
  // still renders even if load order ever changes. Per the discovery
  // inventory, this is the exact set of modules LifeTimeline itself
  // integrates.
  // ---------------------------------------------------------------
  const FALLBACK_TOPICS = [
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

  NS.getTopics = function () {
    const reg = window.LIFETIMELINE_MODULE_REGISTRY;
    return Array.isArray(reg) && reg.length ? reg : FALLBACK_TOPICS;
  };

  // ---------------------------------------------------------------
  // Native / birth-detail preview. Reuses state.chart exactly as set
  // by js/ui.js's generateChart() (see discovery inventory). Name/Sex
  // are not part of the main Chart tab's own inputs (only lat/lon/
  // date/time/timezone are) — this app's only place a name/sex is
  // entered is the Saved Natives form, so best-effort pull those DOM
  // fields if present (same native the user is currently working
  // with), without requiring them.
  // ---------------------------------------------------------------
  function domVal(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  NS.getNativeInfo = function () {
    if (!state.chart) return null;
    const c = state.chart;
    const name = domVal('snName') || 'Untitled Native';
    const sex = domVal('snSex');
    const place = [domVal('snCity'), domVal('snState'), domVal('snCountry')].filter(Boolean).join(', ') || domVal('snLocation');
    const lat = document.getElementById('birthLat') ? document.getElementById('birthLat').value : '';
    const lon = document.getElementById('birthLon') ? document.getElementById('birthLon').value : '';
    const tzMode = c.birthTimeZoneInfo && c.birthTimeZoneInfo.mode;
    const tzLabel = tzMode === 'iana' ? c.birthTimeZoneInfo.zone : (tzMode === 'offset' ? ('UTC offset ' + c.birthTimeZoneInfo.offsetMinutes + ' min') : 'Unknown');
    return {
      name, sex: sex || 'Not specified', place: place || 'Not specified',
      lat, lon, timezone: tzLabel,
      birthDate: document.getElementById('birthLocalDate') ? document.getElementById('birthLocalDate').value : '',
      birthTime: document.getElementById('birthLocalTime') ? document.getElementById('birthLocalTime').value : '',
      birthUtc: c.birthUtc,
      generatedOn: new Date()
    };
  };

  NS.getChartSnapshot = function () {
    if (!state.chart) return null;
    const planets = state.chart.planets;
    const moon = planets.find(p => p.name === 'Moon');
    const sun = planets.find(p => p.name === 'Sun');
    return {
      ascendantSign: state.chart.ascendant.sign,
      moonSign: moon ? moon.sign : 'Unknown',
      sunSign: sun ? sun.sign : 'Unknown'
    };
  };

  // ---------------------------------------------------------------
  // Topic finding collection — the ~27 single-event timing modules.
  // Returns { topic, ok, windows, result, reason }.
  // ---------------------------------------------------------------
  NS.collectTopicFindings = function (topicIds) {
    const topics = NS.getTopics().filter(t => !topicIds || topicIds.includes(t.id));
    const out = [];
    topics.forEach(t => {
      const r = safeRefresh(t.global);
      if (!r.ok) { out.push({ topic: t, ok: false, reason: r.reason }); return; }
      const windows = windowsArrayFrom(r.result);
      if (!windows || !windows.length) { out.push({ topic: t, ok: false, reason: 'no candidate windows for this chart' }); return; }
      out.push({ topic: t, ok: true, windows, result: r.result });
    });
    return out;
  };

  // ---------------------------------------------------------------
  // Synthesis module findings.
  // ---------------------------------------------------------------
  NS.collectDashaLifePhase = function () {
    const r = safeRefresh ? null : null; // DashaLifePhase has no .refresh(); uses getCurrentPhase()
    try {
      if (window.DashaLifePhase && typeof window.DashaLifePhase.getCurrentPhase === 'function') {
        const phase = window.DashaLifePhase.getCurrentPhase();
        if (!phase) return { ok: false, reason: 'no current Dasha phase available' };
        return { ok: true, phase };
      }
    } catch (e) { return { ok: false, reason: 'getCurrentPhase() threw: ' + (e && e.message) }; }
    return { ok: false, reason: 'module not present in this build' };
  };

  NS.collectLifeTimeline = function (horizonYears) {
    const r = safeRefresh('LifeTimeline', [horizonYears || 3]);
    if (!r.ok) return r;
    return { ok: true, result: r.result };
  };

  NS.collectYogaActivation = function () {
    const r = safeRefresh('YogaActivationTiming');
    if (!r.ok) return r;
    return { ok: true, result: r.result };
  };

  NS.collectMajorLifeTransition = function () {
    const r = safeRefresh('MajorLifeTransitionTiming');
    if (!r.ok) return r;
    return { ok: true, result: r.result };
  };

  NS.collectPanchangToday = function (dateObj) {
    try {
      if (window.PanchangDailyAlmanac && typeof window.PanchangDailyAlmanac.compute === 'function') {
        const result = window.PanchangDailyAlmanac.compute(dateObj || new Date());
        return { ok: true, result };
      }
    } catch (e) { return { ok: false, reason: 'compute() threw: ' + (e && e.message) }; }
    return { ok: false, reason: 'module not present in this build' };
  };

  // Muhurta has no "last scan" persisted anywhere in its module (no
  // window.MuhurtaElectional.lastScan / state.muhurta* field exists —
  // confirmed by reading muhurtaElectionalEngine.js in full). Rather
  // than silently omitting it, this report runs one lightweight,
  // sensible-default re-scan (next 30 days, "general" activity) via its
  // own exposed NS.scanRange, so the Researcher report still carries
  // genuine Muhurta data without re-deriving any astrology itself —
  // documented explicitly in research-notes.md.
  NS.collectMuhurtaScan = function () {
    try {
      if (window.MuhurtaElectional && typeof window.MuhurtaElectional.scanRange === 'function') {
        const start = new Date();
        const end = new Date(start.getTime() + 30 * 24 * 3600 * 1000);
        const activities = (window.MUHURTA_ACTIVITIES || []).map(a => a.id || a);
        const activityId = activities.includes('general') ? 'general' : (activities[0] || 'general');
        const rows = window.MuhurtaElectional.scanRange(activityId, start, end);
        if (!rows || !rows.length) return { ok: false, reason: 'no scored days returned for the default 30-day window' };
        return { ok: true, rows, activityId, start, end };
      }
    } catch (e) { return { ok: false, reason: 'scanRange() threw: ' + (e && e.message) }; }
    return { ok: false, reason: 'module not present in this build' };
  };

  // ---------------------------------------------------------------
  // Core chart data (Researcher mode).
  // ---------------------------------------------------------------
  NS.getD1Table = function () {
    if (!state.chart) return null;
    return state.chart.planets.map(p => {
      let dignityTier = '';
      try {
        if (typeof SHADBALA_PLANETS !== 'undefined' && SHADBALA_PLANETS.includes(p.name) && typeof detailedDignity === 'function') {
          const deg = typeof normalizeDegrees === 'function' ? (p.longitude % 30) : (p.longitude % 30);
          const d = detailedDignity(p.name, p.sign, deg);
          dignityTier = d && d.tier ? d.tier : '';
        }
      } catch (e) { dignityTier = ''; }
      return {
        name: p.name, longitude: p.longitude, sign: p.sign, house: p.house,
        retrograde: !!p.retrograde, combust: !!p.combust,
        conjunctWith: p.conjunctWith || [], aspectedBy: p.aspectedBy || [],
        dignityTier
      };
    });
  };

  const DIVISIONAL_CHART_LIST = ['D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'];
  NS.getDivisionalCharts = function (selectedVargas) {
    if (!state.chart || typeof vargaPosition !== 'function') return null;
    const keys = (selectedVargas && selectedVargas.length ? selectedVargas : DIVISIONAL_CHART_LIST);
    const out = [];
    keys.forEach(key => {
      try {
        const rows = state.chart.planets.map(p => {
          const vp = vargaPosition(p.longitude, key);
          return vp ? { planet: p.name, sign: vp.sign } : null;
        }).filter(Boolean);
        if (rows.length) out.push({ varga: key, rows });
      } catch (e) { /* skip this varga if it throws */ }
    });
    return out;
  };

  NS.getDashaTree = function () {
    if (!state.dasha || !state.dasha.length) return null;
    return state.dasha.map(md => ({
      lord: md.lord, startDate: md.startDate, endDate: md.endDate,
      antardashas: (md.antardashas || []).map(ad => ({ lord: ad.lord, startDate: ad.startDate, endDate: ad.endDate }))
    }));
  };

  NS.getCurrentPratyantardasha = function () {
    if (!state.dasha || !state.dasha.length || typeof findCurrentIndex !== 'function' || typeof buildSubPeriods !== 'function') return null;
    const mIdx = findCurrentIndex(state.dasha);
    if (mIdx < 0) return null;
    const md = state.dasha[mIdx];
    const aIdx = findCurrentIndex(md.antardashas);
    if (aIdx < 0) return null;
    const ad = md.antardashas[aIdx];
    const pds = buildSubPeriods(ad.lord, ad.years, ad.startDate);
    return { mahadasha: md.lord, antardasha: ad.lord, pratyantardashas: pds.map(p => ({ lord: p.lord, startDate: p.startDate, endDate: p.endDate })) };
  };

  NS.getShadbalaTable = function () {
    // computeShadbala() returns { planets, dayNight, ranked } — the
    // per-planet map is on the `.planets` field, not state.shadbala itself
    // (confirmed by reading js/shadbala/shadbalaEngine.js in full).
    if (!state.shadbala || !state.shadbala.planets) return null;
    try {
      return Object.keys(state.shadbala.planets).map(name => {
        const r = state.shadbala.planets[name];
        return { name, totalRupa: r.totalRupa, requiredRupa: r.requiredRupa, ratio: r.ratio, strength: r.strength };
      });
    } catch (e) { return null; }
  };

  NS.getAshtakavarga = function () {
    if (!state.ashtakvarga) return null;
    return state.ashtakvarga;
  };

  NS.getFullYogaReport = function () {
    try {
      if (state.yogas) return state.yogas;
      if (window.YogaEngine && typeof window.YogaEngine.detect === 'function' && state.chart) {
        return window.YogaEngine.detect(state.chart.planets, state.chart.ascendant);
      }
    } catch (e) { return null; }
    return null;
  };

  // ---------------------------------------------------------------
  // Rule provenance appendix — pulls only rules actually referenced by
  // the included modules' own result.rulesUsed arrays (never the full
  // static registry).
  // ---------------------------------------------------------------
  NS.collectRuleProvenance = function (resultsWithRules) {
    const seen = new Map();
    (resultsWithRules || []).forEach(r => {
      const rules = r && Array.isArray(r.rulesUsed) ? r.rulesUsed : [];
      rules.forEach(rule => {
        if (rule && rule.id && !seen.has(rule.id)) seen.set(rule.id, rule);
      });
    });
    return Array.from(seen.values());
  };

  // Collect disclaimer strings (verbatim) from a list of module results
  // that expose a `.disclaimer` field — the established convention
  // confirmed across majorExpenditureTiming, dashaLifePhase, lifeTimeline,
  // yogaActivationTiming, wealthProtectionTiming, muhurtaElectional,
  // panchangDailyAlmanac, majorLifeTransitionTiming, etc.
  NS.collectDisclaimers = function (labeledResults) {
    const out = [];
    (labeledResults || []).forEach(({ label, result }) => {
      if (result && typeof result.disclaimer === 'string' && result.disclaimer.trim()) {
        out.push({ label, text: result.disclaimer });
      }
    });
    return out;
  };

  NS.GENERIC_DISCLAIMER = 'This report is a client-side aggregation of this application\'s own existing astrological calculation modules, for general informational and self-reflective purposes only. No outcome described here is guaranteed. This is not medical, legal, financial, or relationship advice, and it never predicts death, lifespan, illness/diagnosis, or another person\'s private conduct. For any health, legal, financial, or relationship decision, consult an appropriately qualified professional.';

  NS.GLOSSARY = [
    { term: 'Ascendant (Lagna)', def: 'The zodiac sign rising on the eastern horizon at the exact moment and place of birth; the reference point for the whole chart.' },
    { term: 'Dasha', def: 'A classical Vedic system (Vimshottari, used in this app) that divides a lifetime into planetary periods (Mahadasha), sub-periods (Antardasha) and sub-sub-periods (Pratyantardasha), each ruled by a planet.' },
    { term: 'Nakshatra', def: 'One of the 27 lunar constellations the Moon (or any planet) occupies; used for finer-grained interpretation than sign alone.' },
    { term: 'Yoga (planetary combination)', def: 'A specific classical configuration of two or more planets/houses believed to confer a particular life theme when present and activated.' },
    { term: 'Divisional chart (Varga, e.g. D9/Navamsa)', def: 'A chart derived by subdividing each natal sign into further parts, used to examine a specific life theme (e.g. D9 for marriage/dharma) in more detail than the main D1 chart.' },
    { term: 'Transit (Gochar)', def: 'The real-time position of a planet in the sky, as distinct from its fixed natal position, used to time when a natal promise may become active.' },
    { term: 'Shadbala', def: 'A six-fold classical strength-scoring system for the seven classical planets, used as supporting evidence of a planet\'s capacity to deliver its significations.' },
    { term: 'Ashtakavarga', def: 'A point-based classical system that tallies benefic contribution points to each sign from each planet, used to gauge relative house/sign strength.' },
    { term: 'Combust', def: 'A planet positioned very close to the Sun, classically considered to have its own significations weakened.' },
    { term: 'Retrograde', def: 'A planet whose apparent motion (as seen from Earth) is backward through the zodiac; classically read as an intensified or introspective expression of that planet.' }
  ];

  return NS;
})();
