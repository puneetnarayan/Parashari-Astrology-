// Sade Sati ("7.5 Saturn") — the classical Parashari transit period when
// Saturn moves through the 12th, 1st (own), and 2nd sign counted from the
// natal Moon. Computed by scanning transiting Saturn's real sidereal
// longitude (same Swiss-Ephemeris-first engine as the rest of this app)
// across a multi-decade window, rather than approximating from Saturn's
// mean 29.5-year period — this correctly captures retrograde-caused
// re-entries into a sign, not just one clean forward pass through each.

const SADE_SATI_LOGIC_TEXT = [
  ['Sade Sati — Logic and Sequence'],
  [''],
  ['1. The natal Moon\'s sidereal sign fixes the 3 relevant signs: the 12th, 1st (the Moon\'s own sign), and 2nd counted from it — classically named the Rising, Peak, and Setting phases (or "first/second/third Dhaiya").'],
  ['2. Transiting Saturn\'s sidereal longitude is sampled every ~20 days across a birth-minus-3-years to birth-plus-80-years window; whenever the sampled sign changes, the exact crossing instant is found by binary search on the same longitude function — this correctly finds retrograde-caused re-entries into a sign, not just forward entries.'],
  ['3. Consecutive time segments that stay within the 3 relevant signs are grouped into one Sade Sati EPISODE (one full ~7.5-9 year period); each segment within an episode is labelled by whichever of the 3 signs is currently occupied, since Saturn can revisit a sign during its retrograde stations.'],
  ['4. Each phase segment\'s quality (good/neutral/bad) combines: transiting Saturn\'s own dignity in the sign it occupies (Exalted/Own = favorable; Debilitated = unfavorable; Friend/Neutral/Enemy sign via Naisargika Maitri in between), plus any NATAL planet whose graha drishti (Parashari aspect) lands on that transited sign — a natural benefic aspecting it helps, a natural malefic aspecting it (Saturn\'s own natal aspect included) adds pressure.'],
  ['5. The affected house is shown two ways: the classical phase-based house FROM THE MOON (fixed: 12th/1st/2nd) sets the phase name and its traditional significations; the same transited sign is also converted to a house FROM THIS CHART\'S LAGNA, whose classical significations (houseThemes.js) describe the concrete life area affected for this specific chart.'],
  [''],
  ['Caveat: the ~20-day coarse sampling step can, in rare cases, miss a very short retrograde double-crossing of a sign boundary within that window (Saturn\'s retrograde arc is slow, so this is uncommon but not impossible) — treat episode boundaries as accurate to within a few days, not to the exact hour, for such edge cases. The good/neutral/bad quality score is this app\'s own heuristic (not a classical numeric scale), for a quick-read comparison only.']
];

const SADE_SATI_METHOD_TABLE = [
  ['Step', 'What is checked', 'Why / classical basis'],
  ['1. Natal Moon sign', 'Read the Moon\'s sidereal Rasi from the birth chart.', 'Sade Sati is defined relative to the Moon (the mind), not the Lagna.'],
  ['2. The 3 relevant signs', '12th, 1st (own), and 2nd sign counted from the Moon.', 'Saturn\'s transit through these 3 signs, ~2.5 years each, is the classical "7.5 Saturn."'],
  ['3. Scan Saturn\'s transit', 'Sample real sidereal Saturn longitude across birth -3y to +80y; binary-search each sign-change instant.', 'Finds every entry/exit date & time, including retrograde re-entries, using this app\'s Swiss Ephemeris engine.'],
  ['4. Group into episodes/phases', 'Consecutive relevant-sign segments become one episode; each segment is labelled Rising/Peak/Setting.', 'One Sade Sati is a single continuous period even though retrograde can make Saturn revisit a sign.'],
  ['5. Score each phase', 'Transiting Saturn\'s dignity in the sign, plus natal-planet aspects landing on that sign, combine into a good/neutral/bad rating.', 'Severity is not uniform — a well-dignified, well-aspected transit is classically read as far milder.'],
  ['6. House-from-Lagna', 'The transited sign is converted to a house from THIS chart\'s Ascendant.', 'Names the concrete life area affected in this specific chart, alongside the Moon-based phase name.']
];

const SADE_SATI_PHASE_INFO = {
  rising: {
    label: 'Rising (1st Dhaiya — 12th from Moon)',
    houseFromMoon: 12,
    description: 'Saturn approaches the natal Moon from the 12th sign — classically the onset phase: rising restlessness, sleep/health disruptions, quiet expenses, and a sense of things starting to feel heavier before the peak.'
  },
  peak: {
    label: 'Peak (2nd Dhaiya — Moon\'s own sign)',
    houseFromMoon: 1,
    description: 'Saturn transits the Moon\'s own sign directly — the most intense phase classically, pressing on the mind and emotions themselves: self-doubt, isolation, or heavy responsibility, but also the phase most associated with lasting maturity and discipline once worked through.'
  },
  setting: {
    label: 'Setting (3rd Dhaiya — 2nd from Moon)',
    houseFromMoon: 2,
    description: 'Saturn moves into the 2nd sign from the Moon — classically a phase of financial/family pressure (speech, food, accumulated wealth) that gradually eases as Saturn approaches its final exit from the Sade Sati signs.'
  }
};

const YEAR_MS_SS = 365.25 * 24 * 60 * 60 * 1000;

function addDaysSS(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Generic calendar-accurate duration (years/months/days), same arithmetic
// as vimshottariDasha.js's ageAt() but for an arbitrary start (not just birth).
function durationBetweenSS(startDate, endDate) {
  return ageAt(startDate, endDate);
}

// Binary-search the exact instant Saturn's longitude crosses `boundaryDeg`
// (0-360, the edge between two signs) between `lowDate` (before crossing)
// and `highDate` (after crossing). ~25 iterations narrows to sub-minute precision.
function findCrossingInstant(lowDate, highDate, boundaryDeg) {
  function signedDiff(date) {
    const lon = computeSingleLongitude('Saturn', date);
    let d = lon - boundaryDeg;
    d = ((d + 540) % 360) - 180; // shortest signed difference, (-180, 180]
    return d;
  }
  let lo = lowDate.getTime(), hi = highDate.getTime();
  const loSign = Math.sign(signedDiff(lowDate)) || -1;
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    const midDate = new Date(mid);
    const midSign = Math.sign(signedDiff(midDate)) || loSign;
    if (midSign === loSign) lo = mid; else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

// Scans Saturn's sign across [startDate, endDate] at `stepDays` resolution,
// returning a timeline of { signIndex, start, end } segments covering the
// whole window (crossing instants found by binary search, not just the
// coarse sample dates).
function computeSaturnSignTimeline(startDate, endDate, stepDays) {
  const samples = [];
  for (let t = startDate.getTime(); t <= endDate.getTime(); t += stepDays * 86400000) {
    const d = new Date(t);
    const lon = computeSingleLongitude('Saturn', d);
    samples.push({ date: d, signIndex: Math.floor(lon / 30) % 12 });
  }
  if (samples[samples.length - 1].date.getTime() < endDate.getTime()) {
    const lon = computeSingleLongitude('Saturn', endDate);
    samples.push({ date: endDate, signIndex: Math.floor(lon / 30) % 12 });
  }

  const timeline = [];
  let segmentStart = samples[0].date;
  let segmentSign = samples[0].signIndex;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].signIndex !== segmentSign) {
      // Boundary crossed is the edge between segmentSign and the new sign,
      // whichever direction (forward or retrograde) it was crossed from.
      const forward = (segmentSign + 1) % 12 === samples[i].signIndex;
      const boundaryDeg = forward ? ((segmentSign + 1) % 12) * 30 : segmentSign * 30;
      const crossing = findCrossingInstant(samples[i - 1].date, samples[i].date, boundaryDeg === 0 ? 360 : boundaryDeg);
      timeline.push({ signIndex: segmentSign, start: segmentStart, end: crossing });
      segmentStart = crossing;
      segmentSign = samples[i].signIndex;
    }
  }
  timeline.push({ signIndex: segmentSign, start: segmentStart, end: samples[samples.length - 1].date });
  return timeline;
}

function phaseKeyFor(signIndex, moonSignIndex) {
  if (signIndex === (moonSignIndex + 11) % 12) return 'rising';
  if (signIndex === moonSignIndex) return 'peak';
  if (signIndex === (moonSignIndex + 1) % 12) return 'setting';
  return null;
}

// Dignity + natal-aspect based quality score for transiting Saturn in `sign`.
function scoreTransitQuality(sign, natalPlanets) {
  let score = 0;
  const notes = [];
  if (EXALTATION_SIGN.Saturn === sign) { score += 2; notes.push('Transiting Saturn is exalted here (+2).'); }
  else if (SIGN_LORD[sign] === 'Saturn') { score += 2; notes.push('Transiting Saturn is in its own sign here (+2).'); }
  else if (DEBILITATION_SIGN.Saturn === sign) { score -= 2; notes.push('Transiting Saturn is debilitated here (-2).'); }
  else {
    const rel = relationBetween('Saturn', SIGN_LORD[sign]);
    if (rel === 'Friend') { score += 1; notes.push(`Transiting Saturn is in a friendly sign (lord ${SIGN_LORD[sign]}) (+1).`); }
    else if (rel === 'Enemy') { score -= 1; notes.push(`Transiting Saturn is in an unfriendly sign (lord ${SIGN_LORD[sign]}) (-1).`); }
  }

  const aspectingPlanets = [];
  const signIndex = SIGNS.indexOf(sign);
  natalPlanets.forEach(p => {
    const casterSignIndex = SIGNS.indexOf(p.sign);
    const offsets = ASPECT_OFFSETS[p.name] || ASPECT_OFFSETS.default;
    const hits = offsets.some(o => (casterSignIndex + (o - 1)) % 12 === signIndex);
    if (!hits) return;
    const natural = NATURAL_BENEFICS.includes(p.name) ? 'benefic' : 'malefic';
    aspectingPlanets.push({ name: p.name, natural });
  });
  const beneficHits = aspectingPlanets.filter(a => a.natural === 'benefic').length;
  const maleficHits = aspectingPlanets.filter(a => a.natural === 'malefic').length;
  score += Math.min(2, beneficHits);
  score -= Math.min(2, maleficHits);
  if (beneficHits) notes.push(`Aspected by natal benefic(s) ${aspectingPlanets.filter(a => a.natural === 'benefic').map(a => a.name).join(', ')} (+${Math.min(2, beneficHits)}).`);
  if (maleficHits) notes.push(`Aspected by natal malefic(s) ${aspectingPlanets.filter(a => a.natural === 'malefic').map(a => a.name).join(', ')} (-${Math.min(2, maleficHits)}).`);

  const quality = score >= 2 ? 'good' : score <= -2 ? 'bad' : 'neutral';
  return { score, quality, notes, aspectingPlanets };
}

// chart: { planets, ascendant, birthUtc }. yearsAhead: how far past birth to search (default 80).
function computeSadeSati(chart, yearsAhead) {
  const years = yearsAhead || 80;
  const moon = chart.planets.find(p => p.name === 'Moon');
  const moonSignIndex = SIGNS.indexOf(moon.sign);
  const ascSignIndex = SIGNS.indexOf(chart.ascendant.sign);

  const searchStart = addDaysSS(chart.birthUtc, -3 * 365.25);
  const searchEnd = addDaysSS(chart.birthUtc, years * 365.25);
  const timeline = computeSaturnSignTimeline(searchStart, searchEnd, 20);

  const episodes = [];
  let current = null;
  timeline.forEach(seg => {
    const phaseKey = phaseKeyFor(seg.signIndex, moonSignIndex);
    if (phaseKey) {
      if (!current) current = { segments: [] };
      const sign = SIGNS[seg.signIndex];
      const houseFromLagna = wholeSignHouseOf(seg.signIndex, ascSignIndex);
      const quality = scoreTransitQuality(sign, chart.planets);
      const info = SADE_SATI_PHASE_INFO[phaseKey];
      current.segments.push({
        phaseKey, phaseLabel: info.label, sign, houseFromMoon: info.houseFromMoon, houseFromLagna,
        start: seg.start, end: seg.end, quality: quality.quality, qualityScore: quality.score,
        qualityNotes: quality.notes, aspectingPlanets: quality.aspectingPlanets,
        houseFromLagnaTheme: HOUSE_THEMES[houseFromLagna], phaseDescription: info.description
      });
    } else if (current) {
      episodes.push(current);
      current = null;
    }
  });
  if (current) episodes.push(current);

  // Merge episodes separated by a short gap: Saturn's retrograde stations
  // (roughly 4-5° of backward arc) can push it briefly out of the relevant
  // signs and back in again near a boundary, fragmenting what is really one
  // continuous ~7.5-9 year Sade Sati into several short pieces a few weeks
  // to a couple of years apart. Genuinely separate Sade Sati cycles are
  // ~27-30 years apart (Saturn's sidereal period), so any gap under 3 years
  // is treated as the same episode.
  const MERGE_GAP_DAYS = 3 * 365.25;
  const mergedEpisodes = [];
  episodes.forEach(ep => {
    const prev = mergedEpisodes[mergedEpisodes.length - 1];
    if (prev) {
      const gapDays = (ep.segments[0].start.getTime() - prev.segments[prev.segments.length - 1].end.getTime()) / 86400000;
      if (gapDays <= MERGE_GAP_DAYS) {
        prev.segments.push(...ep.segments);
        return;
      }
    }
    mergedEpisodes.push(ep);
  });

  const now = new Date();
  const episodeSummaries = mergedEpisodes.map((ep, i) => {
    const start = ep.segments[0].start;
    const end = ep.segments[ep.segments.length - 1].end;
    const isOngoing = now >= start && now < end;
    const isPast = now >= end;
    const isUpcoming = now < start;
    return {
      index: i, segments: ep.segments, start, end,
      startAge: durationBetweenSS(chart.birthUtc, start),
      endAge: durationBetweenSS(chart.birthUtc, end),
      duration: durationBetweenSS(start, end),
      status: isOngoing ? 'Ongoing' : isPast ? 'Past' : 'Upcoming',
      isOngoing, isPast, isUpcoming
    };
  });

  const ongoing = episodeSummaries.find(e => e.isOngoing) || null;
  const next = episodeSummaries.find(e => e.isUpcoming) || null;

  return {
    moonSign: moon.sign, moonSignIndex, episodes: episodeSummaries,
    ongoing, next, searchStart, searchEnd
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    SADE_SATI_LOGIC_TEXT, SADE_SATI_METHOD_TABLE, SADE_SATI_PHASE_INFO,
    computeSaturnSignTimeline, scoreTransitQuality, computeSadeSati, durationBetweenSS
  };
}
