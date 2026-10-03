/* =========================================================
   PANCHANG / DAILY ALMANAC — pure calculation engine.

   Computes the five classical "angas" of Panchang (Tithi, Vara,
   Nakshatra-of-day, Yoga, Karana) for a GIVEN CALENDAR DATE/TIME —
   NOT tied to any individual's birth chart. This is a separate,
   general-purpose daily almanac calculation, distinct from the
   natal-birth Nakshatra interpretation in js/nakshatra/ and distinct
   from the "Raja/Dhana Yoga" interpretive sense used in
   js/yogaActivationTiming/ (the word "Yoga" here is the classical
   27-fold Nitya Yoga, a different technical meaning).

   Reused, never re-derived:
     - computeSingleLongitude(bodyName, date) from js/ephemeris.js
       (same Swiss-Ephemeris-backed planetary longitude engine every
       other module in this app uses for Sun/Moon longitude).
     - normalizeDegrees(deg) from js/parashariTables.js.
     - nakshatraFromLongitude(longitude) / NAKSHATRA_TABLE from
       js/parashariTables.js — the exact same 27-nakshatra boundary
       table used for natal nakshatra elsewhere in the app, applied
       here to the Moon's longitude for the given date instead of a
       birth longitude.

   New to this module (because nothing in the app already computes
   them): the Tithi (30), Nitya Yoga (27) and Karana (11-name, 60
   half-tithi cycle) name tables and their index arithmetic, plus the
   weekday/graha-lord table for Vara, and the Rahu Kaal/Yamaganda/
   Gulika Kaal fixed-fraction-of-day-length tables. Sunrise/sunset are
   NOT computed here (see research-notes.md) — the day-length bands
   below are therefore reported as fixed clock-time bands only, NOT
   anchored to a real local sunrise, and are explicitly labelled so.

   Exposed only as window.PanchangDailyAlmanac. UI lives entirely in
   panchangDailyAlmanacUI.js.
   ========================================================= */

window.PanchangDailyAlmanac = (function () {
  const NS = {};

  // --- 1. TITHI (lunar day) -----------------------------------------
  // 30 tithis across the synodic month: Shukla Paksha (waxing) 1-15
  // (Pratipada..Purnima), Krishna Paksha (waning) 1-15 (Pratipada..
  // Amavasya). Index = floor((Moon - Sun) / 12deg), 0..29.
  const TITHI_NAMES_HALF = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
    'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi',
    'Trayodashi', 'Chaturdashi'
  ];

  function tithiNameFor(index0to29) {
    // index0to29: 0..29. 0-13 = Shukla Pratipada..Chaturdashi, 14 = Purnima,
    // 15-28 = Krishna Pratipada..Chaturdashi, 29 = Amavasya.
    if (index0to29 === 14) return { name: 'Purnima', paksha: 'Shukla' };
    if (index0to29 === 29) return { name: 'Amavasya', paksha: 'Krishna' };
    if (index0to29 < 14) return { name: TITHI_NAMES_HALF[index0to29], paksha: 'Shukla' };
    return { name: TITHI_NAMES_HALF[index0to29 - 15], paksha: 'Krishna' };
  }

  NS.computeTithi = function (moonLon, sunLon) {
    const diff = normalizeDegrees(moonLon - sunLon);
    const index0to29 = Math.min(29, Math.floor(diff / 12));
    const tithiNumber1to30 = index0to29 + 1;
    const info = tithiNameFor(index0to29);
    const elapsedFraction = (diff - index0to29 * 12) / 12;
    return {
      diffDegrees: diff,
      index0to29,
      tithiNumber1to30,
      name: info.name,
      paksha: info.paksha,
      elapsedFraction,
      calcTrace: `Moon longitude ${moonLon.toFixed(4)}deg - Sun longitude ${sunLon.toFixed(4)}deg = ${diff.toFixed(4)}deg (normalized 0-360). Tithi index = floor(${diff.toFixed(4)} / 12) = ${index0to29} -> Tithi #${tithiNumber1to30} (${info.paksha} Paksha ${info.name}).`
    };
  };

  // --- 2. VARA (weekday) ----------------------------------------------
  // Classical weekday-to-planetary-lord mapping (Sun=Sunday ... Saturn=Saturday).
  const VARA_TABLE = [
    { day: 'Sunday', lord: 'Sun' },
    { day: 'Monday', lord: 'Moon' },
    { day: 'Tuesday', lord: 'Mars' },
    { day: 'Wednesday', lord: 'Mercury' },
    { day: 'Thursday', lord: 'Jupiter' },
    { day: 'Friday', lord: 'Venus' },
    { day: 'Saturday', lord: 'Saturn' }
  ];

  NS.computeVara = function (date) {
    const idx = date.getUTCDay(); // 0=Sunday..6=Saturday
    const v = VARA_TABLE[idx];
    return {
      index0to6: idx,
      day: v.day,
      lord: v.lord,
      calcTrace: `Calendar weekday index (0=Sunday..6=Saturday) = ${idx} -> ${v.day}, ruled by ${v.lord}.`
    };
  };

  // --- 3. NAKSHATRA OF THE DAY (Moon's nakshatra) ----------------------
  // Reuses the shared NAKSHATRA_TABLE / nakshatraFromLongitude() from
  // parashariTables.js — the identical 27-nakshatra, 13deg20' boundary
  // table used for natal nakshatra elsewhere in the app.
  NS.computeNakshatraOfDay = function (moonLon) {
    const lon = normalizeDegrees(moonLon);
    const nak = nakshatraFromLongitude(lon);
    const padaNum = padaOf(lon, nak);
    return {
      longitude: lon,
      name: nak.name,
      index0to26: NAKSHATRAS.indexOf(nak.name),
      starLord: nak.starLord,
      pada: padaNum,
      elapsedFraction: nak.elapsedFraction,
      calcTrace: `Moon longitude ${lon.toFixed(4)}deg / 13.3333deg (13deg20') per nakshatra -> index ${NAKSHATRAS.indexOf(nak.name)} -> ${nak.name} (pada ${padaNum}), star lord ${nak.starLord}. Same NAKSHATRA_TABLE boundaries used for natal nakshatra elsewhere in this app, applied here to today's Moon position instead of a birth position.`
    };
  };

  // --- 4. YOGA (27 Nitya Yogas) -----------------------------------------
  // NOTE: this is the classical Panchang sense of "Yoga" (a 27-fold cycle
  // derived from combined Sun+Moon longitude), UNRELATED to the
  // Raja/Dhana-Yoga ("auspicious planetary combination") sense used by
  // the existing Yoga Activation Timing module elsewhere in this app.
  const NITYA_YOGAS = [
    'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
    'Sukarma', 'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva',
    'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana',
    'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
    'Brahma', 'Indra', 'Vaidhriti'
  ];

  NS.computeYoga = function (moonLon, sunLon) {
    const sum = normalizeDegrees(moonLon + sunLon);
    const index0to26 = Math.min(26, Math.floor(sum / (360 / 27)));
    const span = 360 / 27;
    const elapsedFraction = (sum - index0to26 * span) / span;
    return {
      sumDegrees: sum,
      index0to26,
      name: NITYA_YOGAS[index0to26],
      elapsedFraction,
      calcTrace: `(Moon longitude ${moonLon.toFixed(4)}deg + Sun longitude ${sunLon.toFixed(4)}deg) normalized = ${sum.toFixed(4)}deg. Yoga index = floor(${sum.toFixed(4)} / 13.3333) = ${index0to26} -> ${NITYA_YOGAS[index0to26]} (Nitya Yoga #${index0to26 + 1} of 27).`
    };
  };

  // --- 5. KARANA (half-tithi) --------------------------------------------
  // 11 karana names cycle across the 60 half-tithis (2 per tithi x 30
  // tithis = 60) of the synodic month: 7 "movable" karanas (Bava,
  // Balava, Kaulava, Taitila, Gara, Vanija, Vishti) repeat cyclically for
  // karanas #1-57 (8 repetitions of the 7-cycle), then the 4 "fixed"
  // karanas (Shakuni, Chatushpada, Naga, Kimstughna) occupy the final
  // 4 half-tithis #57-60 exactly once each, in fixed order.
  const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
  const FIXED_KARANAS = ['Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'];

  function karanaNameForIndex(karanaIndex0to59) {
    // Classical rule: karana #1 = Kimstughna (fixed, start of cycle),
    // karanas #2-57 cycle through the 7 movable karanas 8 times,
    // karanas #58-60 = Shakuni, Chatushpada, Naga (fixed).
    if (karanaIndex0to59 === 0) return FIXED_KARANAS[3]; // Kimstughna
    if (karanaIndex0to59 >= 57) return FIXED_KARANAS[karanaIndex0to59 - 57]; // 57->Shakuni,58->Chatushpada,59->Naga
    return MOVABLE_KARANAS[(karanaIndex0to59 - 1) % 7];
  }

  NS.computeKarana = function (moonLon, sunLon) {
    const diff = normalizeDegrees(moonLon - sunLon);
    const index0to59 = Math.min(59, Math.floor(diff / 6));
    const name = karanaNameForIndex(index0to59);
    const isFixed = FIXED_KARANAS.includes(name);
    const elapsedFraction = (diff - index0to59 * 6) / 6;
    return {
      diffDegrees: diff,
      index0to59,
      karanaNumber1to60: index0to59 + 1,
      name,
      isFixed,
      elapsedFraction,
      calcTrace: `(Moon - Sun) = ${diff.toFixed(4)}deg. Karana index = floor(${diff.toFixed(4)} / 6) = ${index0to59} -> Karana #${index0to59 + 1} of 60 -> ${name} (${isFixed ? 'fixed karana' : 'movable karana, cycles 8x through the 7-karana sequence'}).`
    };
  };

  // --- 6. RAHU KAAL / YAMAGANDA / GULIKA KAAL --------------------------
  // Classical deterministic calculation: divide the daytime (sunrise to
  // sunset, conventionally approximated here as a fixed 06:00-18:00
  // civil-clock day since this app has no real local sunrise/sunset
  // engine — see research-notes.md) into 8 equal parts ("octants" of
  // ~90 minutes each in the 06:00-18:00 approximation), and each weekday
  // has a fixed octant index assigned to Rahu Kaal, Yamaganda and Gulika
  // Kaal. This fixed-fraction method is the same one almanac sources use
  // when exact sunrise/sunset is substituted with a 6am-6pm civil
  // approximation; the result is therefore explicitly labelled
  // "approximate (06:00-18:00 civil day assumed)" rather than presented
  // as precise clock time.
  const RAHU_KAAL_OCTANT = { Sunday: 8, Monday: 2, Tuesday: 7, Wednesday: 5, Thursday: 6, Friday: 4, Saturday: 3 };
  const YAMAGANDA_OCTANT = { Sunday: 5, Monday: 4, Tuesday: 3, Wednesday: 2, Thursday: 1, Friday: 7, Saturday: 6 };
  const GULIKA_OCTANT = { Sunday: 7, Monday: 6, Tuesday: 5, Wednesday: 4, Thursday: 3, Friday: 2, Saturday: 1 };

  function octantToClock(octant1to8) {
    // 06:00-18:00 assumed civil day split into 8 equal 90-minute octants.
    const startMin = 6 * 60 + (octant1to8 - 1) * 90;
    const endMin = startMin + 90;
    function fmt(totalMin) {
      const h = Math.floor(totalMin / 60) % 24;
      const m = totalMin % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return { start: fmt(startMin), end: fmt(endMin) };
  }

  NS.computeInauspiciousWindows = function (varaDay) {
    const rahuOctant = RAHU_KAAL_OCTANT[varaDay];
    const yamaOctant = YAMAGANDA_OCTANT[varaDay];
    const gulikaOctant = GULIKA_OCTANT[varaDay];
    return {
      approximate: true,
      basis: '06:00-18:00 civil day assumed (no real local sunrise/sunset engine is available in this app) — see research-notes.md. Treat clock times as an approximation, not a precise local sunrise-anchored value.',
      rahuKaal: { octant: rahuOctant, ...octantToClock(rahuOctant) },
      yamaganda: { octant: yamaOctant, ...octantToClock(yamaOctant) },
      gulikaKaal: { octant: gulikaOctant, ...octantToClock(gulikaOctant) }
    };
  };

  // --- Orchestration -----------------------------------------------------
  NS.compute = function (dateObj) {
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const moonLon = normalizeDegrees(computeSingleLongitude('Moon', date));
    const sunLon = normalizeDegrees(computeSingleLongitude('Sun', date));
    const tithi = NS.computeTithi(moonLon, sunLon);
    const vara = NS.computeVara(date);
    const nakshatra = NS.computeNakshatraOfDay(moonLon);
    const yoga = NS.computeYoga(moonLon, sunLon);
    const karana = NS.computeKarana(moonLon, sunLon);
    const inauspicious = NS.computeInauspiciousWindows(vara.day);
    return {
      date,
      rawLongitudes: { moon: moonLon, sun: sunLon },
      tithi, vara, nakshatra, yoga, karana, inauspicious,
      sunriseSunset: null, // intentionally omitted — see research-notes.md
      disclaimer: 'This is a deterministic astronomical/classical daily-almanac calculation for the given calendar date, independent of any individual\'s birth chart. It is not a prediction module. Traditionally inauspicious windows (Rahu Kaal etc.) are presented descriptively ("traditionally considered less favorable for starting new ventures"), never as a claim that anything negative will occur.'
    };
  };

  NS.NITYA_YOGAS = NITYA_YOGAS;
  NS.MOVABLE_KARANAS = MOVABLE_KARANAS;
  NS.FIXED_KARANAS = FIXED_KARANAS;
  NS.VARA_TABLE = VARA_TABLE;

  return NS;
})();
