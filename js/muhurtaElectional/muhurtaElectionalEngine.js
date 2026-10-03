/* =========================================================
   MUHURTA / ELECTIONAL TIMING — engine.

   Answers "which date in a chosen future range is traditionally more
   favorable for starting activity X?" — a day-level Panchang-style scan,
   NOT a natal-chart "when will X happen" prediction. Explicitly distinct
   from window.MarriageTiming (which predicts WHEN marriage is likely);
   this module assumes the activity is already planned and scores
   CANDIDATE DATES for it.

   Reuses, never re-derives:
     - computeSingleLongitude('Moon'|'Sun', date)  (js/ephemeris.js)
     - normalizeDegrees                             (js/parashariTables.js)
     - state.dasha / buildSubPeriods / findCurrentIndex (js/dasha/vimshottariDasha.js)
       — shown as supporting context only, never a classification driver.
     - window.PanchangDailyAlmanac.computeForDate(date), when present, for
       Tithi/Nakshatra/Yoga/Karana — this module falls back to its own
       minimal Tithi/Nakshatra computation (same Moon-Sun longitude
       formula) when that sibling module is not loaded.

   Exposed as window.MuhurtaElectional. UI lives in
   muhurtaElectionalUI.js, rules in muhurtaElectionalRules.js.
   ========================================================= */

window.MuhurtaElectional = (function () {
  const NS = {};
  NS.initialized = false;

  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Standard classical 8-part-of-daylight index tables (1-indexed part
  // number out of 8), applied against a nominal 6:00-18:00 local daylight
  // window (see research-notes.md for the true-sunrise caveat).
  const RAHU_KAAL_PART = { Sunday: 8, Monday: 2, Tuesday: 7, Wednesday: 5, Thursday: 6, Friday: 4, Saturday: 3 };
  const YAMAGANDA_PART = { Sunday: 5, Monday: 4, Tuesday: 3, Wednesday: 2, Thursday: 1, Friday: 7, Saturday: 6 };
  const GULIKA_PART = { Sunday: 7, Monday: 6, Tuesday: 5, Wednesday: 4, Thursday: 3, Friday: 2, Saturday: 1 };

  function partWindow(partIndex) {
    const dayStartHour = 6, dayEndHour = 18;
    const partLenHours = (dayEndHour - dayStartHour) / 8;
    const startHour = dayStartHour + (partIndex - 1) * partLenHours;
    const endHour = startHour + partLenHours;
    return { startHour, endHour };
  }

  function fmtHour(h) {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hh12 = ((hh + 11) % 12) + 1;
    return `${hh12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  NS.getInauspiciousPeriods = function (date) {
    const wd = WEEKDAY_NAMES[date.getUTCDay()];
    const rahu = partWindow(RAHU_KAAL_PART[wd]);
    const yama = partWindow(YAMAGANDA_PART[wd]);
    const gulika = partWindow(GULIKA_PART[wd]);
    return {
      weekday: wd,
      rahuKaal: { label: 'Rahu Kaal', start: fmtHour(rahu.startHour), end: fmtHour(rahu.endHour) },
      yamaganda: { label: 'Yamaganda Kaal', start: fmtHour(yama.startHour), end: fmtHour(yama.endHour) },
      gulikaKaal: { label: 'Gulika Kaal', start: fmtHour(gulika.startHour), end: fmtHour(gulika.endHour) },
      note: 'Nominal 6:00 AM-6:00 PM daylight window used (standard 8-part division); true per-location sunrise/sunset is not computed here — see research-notes.md.'
    };
  };

  // ---------------------------------------------------------------
  // Minimal self-contained Tithi/Nakshatra computation, used only when
  // window.PanchangDailyAlmanac is not available. Same formulas a
  // Panchang module would use: Moon-Sun angular difference / 12 for
  // tithi; Moon longitude / (360/27) for nakshatra.
  // ---------------------------------------------------------------
  NS.computeMinimalPanchang = function (date) {
    const moonLon = computeSingleLongitude('Moon', date);
    const sunLon = computeSingleLongitude('Sun', date);
    const diff = normalizeDegrees(moonLon - sunLon);
    const tithiNum = Math.floor(diff / 12) + 1; // 1-30
    const paksha = tithiNum <= 15 ? 'Shukla' : 'Krishna';
    const tithiInPaksha = tithiNum <= 15 ? tithiNum : tithiNum - 15;
    const nakshatraIndex = Math.floor(moonLon / (360 / 27));
    const nakshatraName = (window.MUHURTA_NAKSHATRA_NAMES || [])[nakshatraIndex] || 'Unknown';
    return {
      source: 'self-contained (Moon/Sun longitude)',
      moonLon, sunLon, tithiNum, paksha, tithiInPaksha, nakshatraIndex, nakshatraName
    };
  };

  NS.getDayPanchang = function (date) {
    if (window.PanchangDailyAlmanac && typeof window.PanchangDailyAlmanac.computeForDate === 'function') {
      try {
        const p = window.PanchangDailyAlmanac.computeForDate(date);
        if (p && p.tithi && p.nakshatra) {
          return {
            source: 'window.PanchangDailyAlmanac',
            paksha: p.tithi.paksha || (p.tithi.number <= 15 ? 'Shukla' : 'Krishna'),
            tithiInPaksha: p.tithi.numberInPaksha || (p.tithi.number <= 15 ? p.tithi.number : p.tithi.number - 15),
            nakshatraName: p.nakshatra.name,
            raw: p
          };
        }
      } catch (e) { /* fall through to self-contained */ }
    }
    const m = NS.computeMinimalPanchang(date);
    return { source: m.source, paksha: m.paksha, tithiInPaksha: m.tithiInPaksha, nakshatraName: m.nakshatraName, raw: m };
  };

  // ---------------------------------------------------------------
  // Gross eclipse-proximity flag (Sun-Moon very close conjunction or
  // opposition). Not an eclipse-prediction engine — see rule
  // 'eclipse-proximity-avoid' in muhurtaElectionalRules.js.
  // ---------------------------------------------------------------
  NS.checkEclipseProximity = function (panchang) {
    const diff = normalizeDegrees(panchang.raw && typeof panchang.raw.moonLon === 'number'
      ? panchang.raw.moonLon - panchang.raw.sunLon
      : 0);
    const fromNewMoon = Math.min(diff, 360 - diff);
    const fromFullMoon = Math.abs(diff - 180);
    const orb = 3; // degrees, intentionally coarse
    if (fromNewMoon <= orb) return { flagged: true, kind: 'new-moon-proximity', orbDegrees: Number(fromNewMoon.toFixed(2)) };
    if (fromFullMoon <= orb) return { flagged: true, kind: 'full-moon-proximity', orbDegrees: Number(fromFullMoon.toFixed(2)) };
    return { flagged: false };
  };

  // ---------------------------------------------------------------
  // Dasha context only — never a classification driver.
  // ---------------------------------------------------------------
  NS.getDashaContext = function (date) {
    if (!state.dasha || !state.dasha.length) return null;
    const md = state.dasha.find(m => m.startDate <= date && m.endDate >= date);
    if (!md) return null;
    const ad = Array.isArray(md.antardashas) ? md.antardashas.find(a => a.startDate <= date && a.endDate >= date) : null;
    return { mahadasha: md.lord, antardasha: ad ? ad.lord : null };
  };

  // ---------------------------------------------------------------
  // Per-day evaluation against the classical factor set for one activity.
  // ---------------------------------------------------------------
  NS.evaluateDay = function (date, activityId) {
    const weekdayTable = (window.MUHURTA_WEEKDAY_TABLE || {})[activityId] || window.MUHURTA_WEEKDAY_TABLE.general;
    const nakTable = window.MUHURTA_NAKSHATRA_TABLE || {};
    const tithiTable = window.MUHURTA_TITHI_TABLE || {};
    const panchang = NS.getDayPanchang(date);
    const inauspicious = NS.getInauspiciousPeriods(date);
    const weekday = WEEKDAY_NAMES[date.getUTCDay()];
    const eclipseCheck = NS.checkEclipseProximity(panchang);
    const dashaContext = NS.getDashaContext(date);

    const factors = [];

    // Tithi factor
    if ((tithiTable.riktaTithis || []).includes(panchang.tithiInPaksha)) {
      factors.push({ ruleId: 'rikta-tithi-avoid', verdict: 'avoid', detail: `Tithi ${panchang.tithiInPaksha} (${panchang.paksha} Paksha) is a Rikta tithi, classically avoided for auspicious starts.` });
    } else if ((tithiTable.favorableTithis || []).includes(panchang.tithiInPaksha)) {
      factors.push({ ruleId: 'tithi-favorable', verdict: 'favorable', detail: `Tithi ${panchang.tithiInPaksha} (${panchang.paksha} Paksha) is in the classically favorable tithi group.` });
    } else {
      factors.push({ ruleId: 'tithi-favorable', verdict: 'neutral', detail: `Tithi ${panchang.tithiInPaksha} (${panchang.paksha} Paksha) is neither classically Rikta nor in the favorable group — treated as neutral/mixed.` });
    }

    // Weekday factor
    if ((weekdayTable.favorable || []).includes(weekday)) {
      factors.push({ ruleId: 'weekday-activity-fit', verdict: 'favorable', detail: `${weekday} is classically favorable for this activity category.` });
    } else if ((weekdayTable.avoided || []).includes(weekday)) {
      factors.push({ ruleId: 'weekday-activity-fit', verdict: 'avoid', detail: `${weekday} is classically avoided for this activity category.` });
    } else {
      factors.push({ ruleId: 'weekday-activity-fit', verdict: 'neutral', detail: `${weekday} has no strong classical association either way for this activity category.` });
    }

    // Nakshatra factor
    const useMarriageList = activityId === 'marriage' && Array.isArray(nakTable.marriageFavorable);
    if (useMarriageList && nakTable.marriageFavorable.includes(panchang.nakshatraName)) {
      factors.push({ ruleId: 'nakshatra-marriage-specific', verdict: 'favorable', detail: `${panchang.nakshatraName} is on the classical marriage-muhurta favorable nakshatra list.` });
    } else if ((nakTable.generallyFavorable || []).includes(panchang.nakshatraName)) {
      factors.push({ ruleId: 'nakshatra-general-favorable', verdict: 'favorable', detail: `${panchang.nakshatraName} is a generally favorable nakshatra classically.` });
    } else if ((nakTable.generallyAvoided || []).includes(panchang.nakshatraName)) {
      factors.push({ ruleId: 'nakshatra-general-avoided', verdict: 'avoid', detail: `${panchang.nakshatraName} is generally avoided classically for auspicious starts.` });
    } else {
      factors.push({ ruleId: 'nakshatra-general-favorable', verdict: 'neutral', detail: `${panchang.nakshatraName} has no strong general classification either way.` });
    }

    // Inauspicious-period factors (daily windows, always present/noted)
    factors.push({ ruleId: 'rahu-kaal-avoid', verdict: 'caution', detail: `Rahu Kaal on this date (nominal): ${inauspicious.rahuKaal.start}-${inauspicious.rahuKaal.end}. Avoid starting the activity within this window.` });
    factors.push({ ruleId: 'yamaganda-avoid', verdict: 'caution', detail: `Yamaganda Kaal on this date (nominal): ${inauspicious.yamaganda.start}-${inauspicious.yamaganda.end}.` });
    factors.push({ ruleId: 'gulika-avoid', verdict: 'caution', detail: `Gulika Kaal on this date (nominal): ${inauspicious.gulikaKaal.start}-${inauspicious.gulikaKaal.end}.` });
    factors.push({ ruleId: 'bhadra-note', verdict: 'not-computed', detail: 'Bhadra (Vishti Karana) is not computed by this module; cross-check a Panchang for the exact time if this matters for your activity.' });

    if (eclipseCheck.flagged) {
      factors.push({ ruleId: 'eclipse-proximity-avoid', verdict: 'avoid', detail: `Moon-Sun longitude proximity suggests this date is near a ${eclipseCheck.kind === 'new-moon-proximity' ? 'new moon' : 'full moon'} (within ${eclipseCheck.orbDegrees}°) — review against an almanac before finalizing; this is a coarse flag, not an eclipse determination.` });
    }

    if (dashaContext) {
      factors.push({ ruleId: 'dasha-context-only', verdict: 'context', detail: `Falls within Mahadasha ${dashaContext.mahadasha}${dashaContext.antardasha ? ' / Antardasha ' + dashaContext.antardasha : ''} (context only, not a classification driver).` });
    }

    // ---------------------------------------------------------------
    // Classification. Qualitative labels only, never numeric. A single
    // "avoid" from Tithi/Nakshatra/Weekday core factors is enough to
    // move the day out of "Favorable"; multiple "avoid" verdicts move it
    // to "Classically Avoided". Rahu Kaal/Yamaganda/Gulika/Bhadra are
    // time-of-day cautions (not day-level disqualifiers) since the
    // activity can usually be scheduled outside those windows the same
    // day — they are surfaced as cautions, not as classification
    // demotions, except the eclipse-proximity flag which does demote.
    // ---------------------------------------------------------------
    const coreFactors = factors.filter(f => ['rikta-tithi-avoid', 'tithi-favorable', 'weekday-activity-fit', 'nakshatra-general-favorable', 'nakshatra-general-avoided', 'nakshatra-marriage-specific'].includes(f.ruleId));
    const avoidCount = coreFactors.filter(f => f.verdict === 'avoid').length;
    const favorableCount = coreFactors.filter(f => f.verdict === 'favorable').length;
    const eclipseAvoid = eclipseCheck.flagged;

    let classification;
    if (eclipseAvoid || avoidCount >= 2) {
      classification = 'Classically Avoided';
    } else if (avoidCount === 1) {
      classification = 'Mixed - Review Factors';
    } else if (favorableCount >= 2) {
      classification = 'Favorable';
    } else if (favorableCount === 1) {
      classification = 'Generally Favorable';
    } else {
      classification = 'Mixed - Review Factors';
    }

    return {
      date, weekday, paksha: panchang.paksha, tithiInPaksha: panchang.tithiInPaksha,
      nakshatra: panchang.nakshatraName, panchangSource: panchang.source,
      classification, factors, inauspiciousPeriods: inauspicious, dashaContext,
      eclipseCheck
    };
  };

  // ---------------------------------------------------------------
  // Date-range scan. Default/suggested ranges are 30/60/90 days; caller
  // (UI) is responsible for warning on very large ranges. Hard cap here
  // at 366 days to keep the per-day loop bounded regardless of UI input.
  // ---------------------------------------------------------------
  NS.MAX_SCAN_DAYS = 366;

  NS.scanRange = function (activityId, startDate, endDate) {
    const start = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
    const msPerDay = 86400000;
    let totalDays = Math.round((end - start) / msPerDay) + 1;
    const truncated = totalDays > NS.MAX_SCAN_DAYS;
    if (truncated) totalDays = NS.MAX_SCAN_DAYS;

    const days = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start.getTime() + i * msPerDay);
      days.push(NS.evaluateDay(d, activityId));
    }
    const summary = {
      favorable: days.filter(d => d.classification === 'Favorable').length,
      generallyFavorable: days.filter(d => d.classification === 'Generally Favorable').length,
      mixed: days.filter(d => d.classification === 'Mixed - Review Factors').length,
      avoided: days.filter(d => d.classification === 'Classically Avoided').length
    };
    return {
      activityId, startDate: start, endDate: end, requestedDays: Math.round((end - start) / msPerDay) + 1,
      scannedDays: totalDays, truncated, days, summary,
      disclaimer: 'Classical electional (Muhurta) guidance only — a traditionally favorable date is not a guarantee of a good outcome, and a traditionally avoided date is not a guarantee of a bad one. This module does not predict whether or when the underlying activity (e.g. marriage) will occur; it only scores candidate dates assuming the activity is already planned. It is not legal, financial, or medical advice.'
    };
  };

  NS.init = function () { if (NS.initialized) return; NS.initialized = true; };
  return NS;
})();
