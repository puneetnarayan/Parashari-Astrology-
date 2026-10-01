/* =========================================================
   RELOCATION — location data structures and geography helpers.
   No astrology calculations live here — only the small, genuinely new
   geographic utilities (great-circle bearing/direction) this app does
   not already have, plus a small sample-city list and a simple cache
   key helper. Namespaced as window.RelocationLocations.
   ========================================================= */

window.RelocationLocations = (function () {
  const NS = {};

  // A small starter set only — the UI lets the user add any lat/lon
  // location, per the spec's "do not hard-code to a fixed list" rule.
  NS.SAMPLE_CITIES = [
    { name: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708 },
    { name: 'London', country: 'UK', latitude: 51.5072, longitude: -0.1276 },
    { name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060 },
    { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
    { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 }
  ];

  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }

  // Initial great-circle bearing (degrees, 0-360, 0 = true north) from
  // (lat1,lon1) to (lat2,lon2). Standard forward-azimuth formula — not a
  // duplicate of anything astrological elsewhere in this app.
  NS.bearing = function (lat1, lon1, lat2, lon2) {
    const phi1 = toRad(lat1), phi2 = toRad(lat2), dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  NS.compassDirection = function (bearingDeg) {
    return COMPASS[Math.round(bearingDeg / 45) % 8];
  };

  NS.DIRECTION_LABELS = { N: 'North', NE: 'North-East', E: 'East', SE: 'South-East', S: 'South', SW: 'South-West', W: 'West', NW: 'North-West' };

  // Great-circle distance in km (haversine) — shown alongside direction
  // for context only; not used in any scoring.
  NS.distanceKm = function (lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Cache key: birth data + candidate coordinates, so relocation charts
  // for unchanged locations are never recomputed (Section 16).
  NS.cacheKey = function (birthUtc, lat, lon) {
    return `${birthUtc.getTime()}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
  };

  return NS;
})();
