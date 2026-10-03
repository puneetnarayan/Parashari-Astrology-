/* =========================================================
   LOVE & RELATIONSHIP TIMELINE — extension of window.RelationshipPartnershipTiming.
   Integration decision (documented per spec section 2): the existing
   Relationship/Partnership Start Timing module already computes the 5th/7th/11th
   natal promise, D9 confirmation, Dasha/transit candidate windows and
   cross-module checks that the spec's "Premarital" section (B) calls for.
   Building a second, separate tab would duplicate that exact calculation
   path. Instead this file extends the SAME window.RelationshipPartnershipTiming
   namespace with the sections the existing module does not cover:
     A — Relationship overview (reframes existing natal promise as an overview)
     C — During-marriage relationship-quality themes (NEW)
     D — Attraction, Boundaries & Relationship Complexity (NEW, safety-critical)
     E — Combined timeline merging B's existing candidate windows with C's
         in-marriage quality windows, using only real Dasha dates
     F — Evidence/provenance (reuses existing rulesUsed/evidenceDetails pattern)
   No new window.* namespace is introduced for the engine. The UI layer is
   window.RelationshipPartnershipTimingUI (also extended in place).
   This module explicitly does NOT duplicate Marriage Timing, Marriage
   Separation/Divorce Timing, or Matching — it reads their refresh() output
   read-only via the existing NS.checkCrossModules idiom only.
   Jaimini techniques (Upapada Lagna, Darakaraka, Chara Karaka) were searched
   for in this codebase and do NOT exist anywhere; they are therefore NOT
   implemented here (no new Jaimini calculation logic was invented) and are
   listed as "needs sourced rule review" in documentation instead.
   ========================================================= */

(function () {
  const NS = window.RelationshipPartnershipTiming;
  if (!NS) return;

  function ruleById(id) { return (window.RELATIONSHIP_PARTNERSHIP_TIMING_RULES || []).find(r => r.id === id); }

  // ---- Domain-specific safety scanner (forbidden language for THIS module) ----
  // Mirrors the established window.HealthRecoveryTiming.scanForForbiddenLanguage /
  // applySafetyFilter pattern, but with a love/relationship-specific forbidden list
  // (never reuse the medical scanner's pattern list for this domain).
  const FORBIDDEN_PATTERNS = [
    /\bis having an affair\b/i, /\baffair is happening\b/i, /\baffair (has|had) happened\b/i,
    /\bwill have an affair\b/i, /\baffair will happen\b/i, /\bis cheating\b/i, /\bhas cheated\b/i,
    /\bwill cheat\b/i, /\binfidelity (percentage|probability|score|risk score)\b/i,
    /\b\d{1,3}%\s*(chance|likelihood|probability)\s*of\s*(an?\s*)?(affair|infidelity|cheating)\b/i,
    /\byou should confront\b/i, /\byou should divorce\b/i, /\byou should leave (him|her|them)\b/i,
    /\bconfront (him|her|them|your partner|your spouse)\b/i, /\bmonitor (his|her|their) (phone|messages|location)\b/i,
    /\btrack (his|her|their) (phone|location|whereabouts)\b/i, /\bhire a (private investigator|detective)\b/i,
    /\byour (partner|spouse) is (secretly|definitely)\b/i
  ];
  NS.scanForForbiddenLanguage = function (text) {
    const s = String(text || '');
    for (const re of FORBIDDEN_PATTERNS) { if (re.test(s)) return { matched: true, pattern: re.toString() }; }
    return { matched: false };
  };
  NS.applySafetyFilter = function (text) {
    const scan = NS.scanForForbiddenLanguage(text);
    if (!scan.matched) return text;
    return 'This output was withheld because it matched disallowed language for this module. Astrological evidence quality is described qualitatively and never as a verdict about an affair, infidelity, or a partner\'s private conduct.';
  };
  NS.applySafetyFilterToList = function (list) { return (list || []).map(t => NS.applySafetyFilter(t)); };

  // =========================================================
  // SECTION A — Relationship Overview (reframes existing natal promise)
  // =========================================================
  NS.buildRelationshipOverview = function () {
    const np = NS.assessNatalRelationshipPattern();
    const d9 = NS.assessD9Confirmation();
    return {
      overallEvidenceLabel: np.pattern,
      d9Confirms: d9.level,
      summary: [
        'This overview describes the astrological evidence found in this chart for relationship/partnership themes. It never establishes, predicts, or verifies real-world relationship events, a partner\'s identity, or a partner\'s conduct.',
        `Natal promise (5th/7th/11th houses and supporting houses): ${np.pattern}.`,
        `D9 (Navamsha) confirmation: ${d9.level}.`
      ],
      rule: ruleById('RELPART-NOGUARANTEE-001')
    };
  };

  // =========================================================
  // SECTION C — During-Marriage Relationship Quality Themes (NEW)
  // Reuses: 7th house/lord, Venus, Jupiter aspect, D9 7th-lord dignity,
  // current/future MD-AD-PD activation of 7th (ongoing partnership) and
  // 2nd (domestic/family continuity, contextual) houses. 8th/12th are used
  // only as explicitly-labelled contextual information, never to infer a
  // partner's conduct or to produce death/danger/divorce language (that is
  // Marriage Separation/Divorce Timing's domain, cross-checked read-only).
  // =========================================================
  NS.assessDuringMarriageQuality = function () {
    const chart = NS.getChartData();
    if (!chart) return { available: false };
    const seventh = NS.getHouseSnapshot(7);
    const venus = NS.getPlanetSnapshot('Venus');
    const jupiter = NS.getPlanetSnapshot('Jupiter');
    const d9 = NS.assessD9Confirmation();

    const seventhLordPlanet = chart.planets.find(p => p.name === seventh.lord);
    const seventhLordDignity = seventhLordPlanet ? (SHADBALA_PLANETS.includes(seventh.lord)
      ? detailedDignity(seventh.lord, seventhLordPlanet.sign, normalizeDegrees(seventhLordPlanet.longitude) % 30).tier : 'Neutral') : 'Neutral';
    const jupiterAspectsSeventh = (ASPECT_OFFSETS.Jupiter || ASPECT_OFFSETS.default).some(o => {
      const fromIdx = SIGNS.indexOf(jupiter.sign);
      return (fromIdx + (o - 1)) % 12 === SIGNS.indexOf(seventh.sign);
    });
    const venusWellPlaced = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(venus.dignityTier) && !['6', '8', '12'].includes(String(venus.house));
    const strongSeventhLord = ['Exalted', 'Own Sign', 'Moolatrikona'].includes(seventhLordDignity);

    const factors = [
      { label: '7th lord dignity', present: strongSeventhLord, evidence: `7th lord ${seventh.lord} is in ${seventhLordPlanet ? seventhLordPlanet.sign : 'unknown'} (${seventhLordDignity}).` },
      { label: 'Venus placement/dignity', present: venusWellPlaced, evidence: `Venus is in ${venus.sign} (${venus.dignityTier}), house ${venus.house}.` },
      { label: 'Jupiter aspect on 7th house', present: jupiterAspectsSeventh, evidence: jupiterAspectsSeventh ? 'Jupiter aspects the 7th house.' : 'Jupiter does not aspect the 7th house.' },
      { label: 'D9 7th-lord confirmation', present: d9.level === 'Supports', evidence: d9.evidence[0] }
    ];
    const supportCount = factors.filter(f => f.present).length;
    const qualityLabel = supportCount >= 3 ? 'Strongly Supported' : supportCount === 2 ? 'Supported' : supportCount === 1 ? 'Mixed' : 'Requires Careful Interpretation';

    // Contextual-only notes (8th/12th) — never used to compute qualityLabel.
    const eighth = NS.getHouseSnapshot(8), twelfth = NS.getHouseSnapshot(12);
    const contextualNotes = [
      `8th house (contextual only — shared intensity/transformation, never conflict or danger): ${eighth.sign}, lord ${eighth.lord}.`,
      `12th house (contextual only — shared private space, never secrecy or wrongdoing): ${twelfth.sign}, lord ${twelfth.lord}.`
    ];

    return {
      available: true,
      qualityLabel,
      factors,
      contextualNotes,
      caveats: [
        'This describes the astrological quality of the 7th-house/Venus/Jupiter partnership significators only — it is not a prediction of marital satisfaction, conflict, or a partner\'s behavior.',
        'For separation/divorce timing specifically, see the separate Marriage Separation/Divorce Timing tab — this section never duplicates that module\'s logic.'
      ],
      rule: ruleById('LOVEREL-DURINGMARRIAGE-001')
    };
  };

  NS.buildDuringMarriageWindows = function (horizonYears) {
    const dasha = state.dasha;
    if (!dasha || !dasha.length) return { available: false, windows: [] };
    const now = new Date(); const horizonEnd = new Date(now.getTime() + (horizonYears || 5) * 365.25 * 24 * 60 * 60 * 1000);
    const quality = NS.assessDuringMarriageQuality();
    const windows = [];
    dasha.forEach(md => {
      if (md.endDate < now || md.startDate > horizonEnd) return;
      md.antardashas.forEach(ad => {
        if (ad.endDate < now || ad.startDate > horizonEnd) return;
        const mdFactors = NS.relationshipFactorsForLord(md.lord), adFactors = NS.relationshipFactorsForLord(ad.lord);
        const relevantTo7 = mdFactors.activatedHouses.includes(7) || adFactors.activatedHouses.includes(7);
        if (!relevantTo7) return;
        windows.push({
          mahadasha: md.lord, antardasha: ad.lord, startDate: ad.startDate, endDate: ad.endDate,
          theme: 'Ongoing-partnership emphasis (7th house activated by current Dasha)',
          qualityLabel: quality.available ? quality.qualityLabel : 'Mixed',
          reasons: [`Mahadasha ${md.lord} / Antardasha ${ad.lord} activates the 7th house.`, 'Reflects a period where partnership themes are astrologically emphasized, not a specific real-world event.']
        });
      });
    });
    return { available: true, windows };
  };

  // =========================================================
  // SECTION D — Attraction, Boundaries & Relationship Complexity (NEW)
  // EXPLICITLY NOT an "affair detector." Presents classical significators of
  // attraction, boundary themes, and relational complexity as present/absent/
  // ambiguous, each with an alternative-reading caveat. Requires corroboration
  // across >= 2 independent factors before any label stronger than "Mixed" is
  // shown, and a single factor is NEVER sufficient for a strong-evidence result.
  // No percentage, score, or probability of any kind is ever produced here.
  // =========================================================
  NS.assessAttractionBoundariesComplexity = function () {
    const chart = NS.getChartData();
    if (!chart) return { available: false };
    const venus = NS.getPlanetSnapshot('Venus');
    const seventh = NS.getHouseSnapshot(7);
    const fifth = NS.getHouseSnapshot(5);
    const rahu = chart.planets.find(p => p.name === 'Rahu');
    const moon = NS.getPlanetSnapshot('Moon');

    function presence(ok, label, evidence, altReading, ruleId) {
      return { label, present: ok === true ? 'Present' : ok === false ? 'Absent' : 'Ambiguous', evidence, alternativeReading: altReading, rule: ruleById(ruleId) };
    }

    const venusRahuConjunct = !!(rahu && venus.conjunctWith.includes('Rahu'));
    const factorVenusRahu = presence(
      venusRahuConjunct,
      'Venus–Rahu association (attraction to the unconventional/intense)',
      venusRahuConjunct ? 'Venus is conjunct Rahu in this chart.' : 'Venus is not conjunct Rahu in this chart.',
      'Classically read as attraction to novelty, intensity, or circumstances outside convention. This is a broad temperament signature with many possible expressions (unconventional interests, cross-cultural attraction, intense aesthetic taste, etc.) — it does not by itself indicate infidelity, non-monogamy, secrecy, or any specific behavior.',
      'LOVEREL-ATTRACT-VENUSRAHU-001'
    );

    const venusMultipleConjunctions = venus.conjunctWith && venus.conjunctWith.length >= 2;
    const factorVenusMultiplicity = presence(
      venusMultipleConjunctions,
      'Venus in multiple planetary conjunctions (complexity in how affection is expressed)',
      venusMultipleConjunctions ? `Venus is conjunct ${venus.conjunctWith.join(', ')}.` : 'Venus is not in multiple conjunctions.',
      'Multiple conjunctions with Venus are classically read as complexity or multiplicity of influences on how affection/romantic expression shows up. This can express as having wide-ranging interests, complex emotional processing, or many close relationships of any kind (platonic, familial, romantic) — it is not evidence of romantic or sexual behavior with any specific person.',
      'LOVEREL-ATTRACT-VENUSMULTI-001'
    );

    const seventhMultipleOccupants = seventh.occupants && seventh.occupants.length >= 2;
    const factorSeventhMultiplicity = presence(
      seventhMultipleOccupants,
      '7th house with multiple occupants (complexity in the partnership house)',
      seventhMultipleOccupants ? `7th house occupants: ${seventh.occupants.join(', ')}.` : '7th house has fewer than two occupants.',
      'Multiple planets in the 7th house are classically read as added complexity, multiple influences, or multiple significant relationships/partnerships across a lifetime (which may include business partners, close friendships, or sequential relationships) — never a prediction of concurrent romantic/sexual relationships.',
      'LOVEREL-ATTRACT-7THMULTI-001'
    );

    const moonVenusConnected = moon.conjunctWith.includes('Venus') || venus.conjunctWith.includes('Moon');
    const factorMoonVenus = presence(
      moonVenusConnected,
      'Moon–Venus connection (emotional and romantic expression intertwined)',
      moonVenusConnected ? 'Moon and Venus are connected (conjunction) in this chart.' : 'Moon and Venus are not connected in this chart.',
      'Classically read as emotional needs and romantic/aesthetic expression being closely linked — this can express as emotional depth in relationships, artistic sensitivity, or a strong need for emotional closeness. It says nothing about fidelity, honesty, or secrecy.',
      'LOVEREL-ATTRACT-MOONVENUS-001'
    );

    const fifthEighthLink = fifth.occupants.includes(SIGN_LORD[NS.getHouseSnapshot(8).sign]) || NS.getHouseSnapshot(8).occupants.includes(fifth.lord);
    const factorFifthEighth = presence(
      fifthEighthLink,
      '5th–8th house link (romance house connected to the house of intensity/transformation — contextual only)',
      fifthEighthLink ? 'A link exists between the 5th house/lord and the 8th house/lord.' : 'No direct link found between the 5th and 8th house/lord.',
      'Read only as a general intensity/transformation theme touching romantic expression (e.g., deep emotional transformation through a relationship, intensity of feeling). This is explicitly NOT used, here or anywhere in this module, to infer secrecy, wrongdoing, or any specific conduct.',
      'LOVEREL-ATTRACT-5TH8TH-001'
    );

    const factorsAll = [factorVenusRahu, factorVenusMultiplicity, factorSeventhMultiplicity, factorMoonVenus, factorFifthEighth];
    const presentCount = factorsAll.filter(f => f.label && f.present === 'Present').length;

    // Hard safeguard: a single present factor is NEVER sufficient for a strong label.
    let evidenceLabel;
    if (presentCount >= 3) evidenceLabel = 'Supported';
    else if (presentCount === 2) evidenceLabel = 'Mixed';
    else if (presentCount === 1) evidenceLabel = 'Requires Careful Interpretation';
    else evidenceLabel = 'Limited Evidence';
    // Note: 'Strongly Supported' is intentionally never reachable in this section regardless
    // of factor count, since no combination of these broad temperament factors can rise to
    // a confident astrological statement about a private, non-chart-visible behavior.

    return {
      available: true,
      factors: factorsAll,
      corroboratingCount: presentCount,
      evidenceLabel,
      distinctionNote: 'This "evidence" label describes how much classical astrological signal is present for broad attraction/boundary temperament themes in THIS chart. It is never a statement about the probability, likelihood, or occurrence of infidelity, non-monogamy, or any specific real-world behavior. Romantic attraction, non-monogamy, emotional closeness, secrecy, sexual behavior, and infidelity are different concepts and are never conflated in this module.',
      neverVerdict: 'No combination of factors in this section ever produces a verdict, accusation, confirmation, or denial about an affair or a partner\'s conduct.',
      rule: ruleById('LOVEREL-NOAFFAIRDETECTOR-001')
    };
  };

  // =========================================================
  // SECTION E — Combined Timeline (real Dasha dates only, never fabricated)
  // =========================================================
  NS.buildCombinedTimeline = function (horizonYears, focus) {
    const premarital = NS.buildCandidateWindows(horizonYears);
    const duringMarriage = NS.buildDuringMarriageWindows(horizonYears);
    let entries = [];
    if (focus === 'Premarital' || focus === 'Full Timeline') {
      (premarital.windows || []).forEach(w => entries.push({ section: 'Premarital / New Connection', startDate: w.startDate, endDate: w.endDate, label: w.strength.label, detail: w }));
    }
    if (focus === 'During Marriage' || focus === 'Full Timeline') {
      (duringMarriage.windows || []).forEach(w => entries.push({ section: 'During Marriage / Ongoing Partnership', startDate: w.startDate, endDate: w.endDate, label: w.qualityLabel, detail: w }));
    }
    entries.sort((a, b) => a.startDate - b.startDate);
    return { available: premarital.available || duringMarriage.available, entries };
  };

  // =========================================================
  // Focus-aware refresh wrapper (Section 4 workflow: focus selector)
  // Does not replace NS.refresh (used by the existing B-only consumers);
  // adds a combined refresh for the expanded tab sections.
  // =========================================================
  NS.refreshLoveRelationshipTimeline = function (horizonYears, focus) {
    const chart = NS.getChartData();
    if (!chart) return null;
    const horizon = horizonYears || 5;
    const base = NS.refresh(horizon, 'All');
    const overview = NS.buildRelationshipOverview();
    const duringMarriage = NS.assessDuringMarriageQuality();
    const attractionBoundaries = NS.assessAttractionBoundariesComplexity();
    const timeline = NS.buildCombinedTimeline(horizon, focus || 'Full Timeline');

    const dataCompleteness = {
      hasBirthTime: !!(chart.ascendant && chart.ascendant.sign),
      hasDasha: !!(state.dasha && state.dasha.length),
      note: (!state.dasha || !state.dasha.length)
        ? 'Dasha-based timing is unavailable; only natal (birth-chart-only) evidence is shown, with no timing windows.'
        : 'Birth time determines house placements (including the 5th/7th/11th and Ascendant); if birth time is uncertain, treat house-based findings as directional rather than exact, especially near a house-cusp boundary.'
    };

    return { base, overview, duringMarriage, attractionBoundaries, timeline, focus: focus || 'Full Timeline', horizonYears: horizon, dataCompleteness };
  };
})();
