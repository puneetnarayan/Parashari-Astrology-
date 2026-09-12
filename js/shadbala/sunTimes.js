// Sunrise/sunset finder — a small NEW utility, since no part of this app
// currently computes sunrise/sunset. Several classical Shadbala Kala Bala
// sub-components (Nathonnata, Paksha's day/night context, Tribhaga) need
// real day/night boundaries. Reuses the astronomy-engine library already
// loaded (js/astronomy.browser.min.js, currently used only as the offline
// ephemeris FALLBACK) for its Observer/SearchRiseSet functions — these are
// real astronomical events (sunrise/sunset), independent of ayanamsa or
// sidereal/tropical zodiac choice, so using astronomy-engine here is valid
// regardless of whether Swiss Ephemeris is the active longitude engine.

const SUN_TIMES_LOGIC_TEXT = [
  ['Sun Times — Logic and Sequence'],
  [''],
  ['1. Sunrise/sunset are found via astronomy-engine\'s Astronomy.SearchRiseSet (already bundled with this app as the ephemeris fallback engine) — a real, geometry-based rise/set search, not a simplified/approximated formula.'],
  ['2. To bracket a given birth moment, this searches both forward and backward in time (up to 3 days each direction) for the nearest preceding and following sunrise and sunset, then determines day/night by whichever of those four events most recently preceded the birth moment.'],
  ['']
];

// Returns { prevSunrise, prevSunset, nextSunrise, nextSunset } as JS Dates
// (or null if not found within the search window — should not happen except
// at extreme polar latitudes).
function findSurroundingSunEvents(date, latitude, longitude) {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const nextSunrise = Astronomy.SearchRiseSet('Sun', observer, +1, date, 3);
  const nextSunset = Astronomy.SearchRiseSet('Sun', observer, -1, date, 3);
  const prevSunrise = Astronomy.SearchRiseSet('Sun', observer, +1, date, -3);
  const prevSunset = Astronomy.SearchRiseSet('Sun', observer, -1, date, -3);
  return {
    prevSunrise: prevSunrise ? prevSunrise.date : null,
    prevSunset: prevSunset ? prevSunset.date : null,
    nextSunrise: nextSunrise ? nextSunrise.date : null,
    nextSunset: nextSunset ? nextSunset.date : null
  };
}

// { isDaytime, periodStart, periodEnd } — the day (sunrise-to-sunset) or
// night (sunset-to-sunrise) period that `date` falls inside.
function dayNightContext(date, latitude, longitude) {
  const ev = findSurroundingSunEvents(date, latitude, longitude);
  const candidates = [
    ev.prevSunrise && { time: ev.prevSunrise, type: 'sunrise' },
    ev.prevSunset && { time: ev.prevSunset, type: 'sunset' }
  ].filter(Boolean).sort((a, b) => b.time - a.time);
  const mostRecent = candidates[0];
  const isDaytime = !mostRecent || mostRecent.type === 'sunrise';
  const periodStart = isDaytime ? ev.prevSunrise : ev.prevSunset;
  const periodEnd = isDaytime ? ev.nextSunset : ev.nextSunrise;
  return { isDaytime, periodStart, periodEnd, events: ev };
}

if (typeof module !== 'undefined') {
  module.exports = { SUN_TIMES_LOGIC_TEXT, findSurroundingSunEvents, dayNightContext };
}
