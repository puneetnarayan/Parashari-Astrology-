// Loads the real Swiss Ephemeris (compiled to WebAssembly) and, once ready,
// becomes the app's calculation engine. Ported from the sibling KP app's
// swissephBridge.js (same ephemeris/ files, same bridging approach) —
// this is pure Swiss Ephemeris integration, nothing KP-specific.
//
// Bridging approach: this file is an ES module (Swiss Ephemeris's JS wrapper
// requires ESM + async init), but the rest of the app is plain synchronous
// <script> files loaded in order. This bridge initializes Swiss Ephemeris as
// early as possible and exposes plain synchronous global functions once
// ready. ephemeris.js checks window.SWISSEPH_READY at call time: true -> use
// Swiss Ephemeris; false (still loading, or the WASM failed to load at all)
// -> fall back to the astronomy-engine implementation, unchanged.
//
// Licensing note: Swiss Ephemeris is AGPL-3.0-or-later (this WASM build via
// the "swisseph-wasm" npm package, itself GPL-3.0-or-later). For personal,
// single-user, non-distributed use this carries no copyleft obligations —
// AGPL's network-use clause and GPL's distribution clause both hinge on
// distributing the software or offering it as a network service to others,
// neither of which applies here. Revisit this note before ever distributing
// this app to anyone else or hosting it as a shared service.

import SwissEph from '../ephemeris/src/swisseph.js';

window.SWISSEPH_READY = false;
window.SWISSEPH_LOAD_ERROR = null;

const swe = new SwissEph();

window.SWISSEPH_INIT_PROMISE = swe.initSwissEph()
  .then(() => {
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
    window.SWISSEPH_READY = true;

    const SWE_BODY_ID = {
      Sun: swe.SE_SUN, Moon: swe.SE_MOON, Mars: swe.SE_MARS, Mercury: swe.SE_MERCURY,
      Jupiter: swe.SE_JUPITER, Venus: swe.SE_VENUS, Saturn: swe.SE_SATURN
    };

    // Sidereal longitude (Lahiri) for one body, for the given UTC Date.
    window.sweSingleLongitude = function (bodyName, date) {
      const jd = dateToJulianDayUtc(date);
      if (bodyName === 'Rahu') {
        return normalize360(swe.calc_ut(jd, swe.SE_MEAN_NODE, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL)[0]);
      }
      if (bodyName === 'Ketu') {
        return normalize360(swe.calc_ut(jd, swe.SE_MEAN_NODE, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL)[0] + 180);
      }
      return normalize360(swe.calc_ut(jd, SWE_BODY_ID[bodyName], swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL)[0]);
    };

    // Sidereal longitudes for all 9 Parashari planets/nodes at once.
    window.swePlanetLongitudes = function (date) {
      const result = {};
      Object.keys(SWE_BODY_ID).forEach(name => { result[name] = window.sweSingleLongitude(name, date); });
      result.Rahu = window.sweSingleLongitude('Rahu', date);
      result.Ketu = window.sweSingleLongitude('Ketu', date);
      return result;
    };

    // Sidereal Ascendant only, for the given UTC Date + place. Parashari D1
    // uses whole-sign houses counted from the Ascendant's SIGN, so only the
    // Ascendant's sign matters (no cuspal house system is used), but the
    // exact degree is still useful to display.
    window.sweAscendantSidereal = function (date, latitude, longitude) {
      const jd = dateToJulianDayUtc(date);
      const ayanamsa = swe.get_ayanamsa(jd);
      const houses = swe.houses(jd, latitude, longitude, 'P');
      return normalize360(houses.ascmc[0] - ayanamsa);
    };

    document.dispatchEvent(new CustomEvent('swisseph-ready'));
  })
  .catch(err => {
    window.SWISSEPH_LOAD_ERROR = err;
    window.SWISSEPH_READY = false;
    document.dispatchEvent(new CustomEvent('swisseph-load-failed', { detail: err }));
  });

function dateToJulianDayUtc(date) {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return swe.julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour);
}

function normalize360(deg) {
  return ((deg % 360) + 360) % 360;
}
