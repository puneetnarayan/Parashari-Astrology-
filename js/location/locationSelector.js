// Reusable Location Selector component. Instantiated twice by ui.js — once
// for the Native/Birth location, once for the Astrologer's location — both
// calls sharing the ONE locationSearch.js service/database, but each with
// its own independent DOM elements and state object. Selecting a place in
// one selector never touches the other's state.
//
// createLocationSelector(config) wires up:
//   - a text input with debounced autocomplete
//   - a results dropdown (name / state,country / lat,lon per row)
//   - read-only state/country/lat/lon/timezone display fields
//   - an "Edit manually" toggle that unlocks lat/lon/timezone for direct entry
//   - validated manual lat/lon (-90..90 / -180..180)
//   - (optional) a "Use My Current Location" button (geolocation, opt-in only)
//
// config = {
//   inputId, dropdownId, stateFieldId, countryFieldId, latFieldId, lonFieldId,
//   timezoneSelectId, editManualBtnId, currentLocationBtnId (optional),
//   onChange(locationOrNull)   // called whenever the selection changes/clears
// }
//
// getSelectedLocation() returns null (nothing validly selected yet) or:
//   { latitude, longitude, timezone, geonamesId, countryCode, country,
//     state, district, name, manual }

const LOCATION_SELECTOR_LOGIC_TEXT = [
  ['Location Selector Component — Logic and Sequence'],
  [''],
  ['1. As the user types (after 2+ characters, debounced ~200ms), the shared locationSearch.js service is queried and up to 15 ranked results are shown, each labeled with its state/province and country so identically-named places (multiple "London"s, "Delhi"s, etc.) are distinguishable before selection.'],
  ['2. Selecting a result populates state, country, latitude, longitude, and timezone (an IANA zone ID straight from GeoNames), and stores the FULL place record — including its GeoNames ID — as this selector\'s current selection. Latitude/longitude are kept at full source precision, never rounded.'],
  ['3. Latitude/longitude/timezone are READ-ONLY after a database selection; "Edit manually" unlocks them for direct entry (validated: latitude -90..90, longitude -180..180) for places not in the database — historical place names, tiny villages, or anywhere below this database\'s population threshold (see js/location/README.md).'],
  ['4. Each selector keeps its own private state object. Two independent instances (Native/Birth and Astrologer\'s Location) are created from the same component/config shape but never share or overwrite each other\'s selection.'],
  ['5. "Use My Current Location" (only offered where configured, e.g. the Astrologer\'s selector) calls the browser Geolocation API ONLY when the user clicks that specific button — never automatically on page load — and only reverse-looks-up a nearby place name as a label; the raw coordinates it returns are used directly, with timezone left for manual entry/confirmation since GPS coordinates alone don\'t carry a timezone.'],
  [''],
  ['Caveat: reverse-geocoding "Use My Current Location" to a place NAME is a nearest-match lookup against this same limited places.db (population > 1000), so it may label a rural location by a somewhat distant town; the coordinates themselves are always the browser-reported GPS coordinates regardless of that label.']
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatCoord(value, positiveLabel, negativeLabel) {
  const abs = Math.abs(value);
  return `${abs.toFixed(6)}° ${value >= 0 ? positiveLabel : negativeLabel}`;
}

function formatResultLabel(place) {
  const regionCountry = [place.state, place.country].filter(Boolean).join(', ');
  const coords = `${formatCoord(place.latitude, 'N', 'S')}, ${formatCoord(place.longitude, 'E', 'W')}`;
  return { name: place.asciiName, regionCountry, coords };
}

function createLocationSelector(config) {
  const input = document.getElementById(config.inputId);
  const dropdown = document.getElementById(config.dropdownId);
  const stateField = document.getElementById(config.stateFieldId);
  const countryField = document.getElementById(config.countryFieldId);
  const latField = document.getElementById(config.latFieldId);
  const lonField = document.getElementById(config.lonFieldId);
  const timezoneSelect = document.getElementById(config.timezoneSelectId);
  const editManualBtn = document.getElementById(config.editManualBtnId);
  const currentLocationBtn = config.currentLocationBtnId ? document.getElementById(config.currentLocationBtnId) : null;

  let selection = null; // the full place record, or a synthetic manual one
  let manualMode = false;
  let debounceTimer = null;
  let dbInstance = null;

  initLocationDb().then(db => { dbInstance = db; }).catch(err => {
    dropdown.innerHTML = `<div class="location-dropdown-error">Location database failed to load: ${err.message}</div>`;
    dropdown.hidden = false;
  });

  // Ensures the exact IANA zone ID GeoNames gives us is selectable, even if
  // this particular browser's own Intl.supportedValuesOf('timeZone') list
  // (used to populate the dropdown) happens to enumerate an older alias
  // instead of the canonical name (e.g. some ICU builds list "Asia/Calcutta"
  // rather than "Asia/Kolkata") — Intl.DateTimeFormat itself accepts either
  // form correctly, so this only affects which option string is shown/set.
  function selectTimezoneOption(zoneId) {
    if (!zoneId) return;
    const hasOption = Array.from(timezoneSelect.options).some(o => o.value === zoneId);
    if (!hasOption) timezoneSelect.appendChild(new Option(zoneId, zoneId));
    timezoneSelect.value = zoneId;
  }

  function setFieldsFromPlace(place) {
    stateField.value = [place.district, place.state].filter(Boolean).join(', ') || '—';
    countryField.value = place.country || '—';
    latField.value = place.latitude;
    lonField.value = place.longitude;
    selectTimezoneOption(place.timezone);
  }

  function setReadOnly(readOnly) {
    latField.readOnly = readOnly;
    lonField.readOnly = readOnly;
    timezoneSelect.disabled = readOnly;
  }

  function notifyChange() {
    if (config.onChange) config.onChange(getSelectedLocation());
  }

  function selectPlace(place) {
    selection = place;
    manualMode = false;
    input.value = place.asciiName;
    setFieldsFromPlace(place);
    setReadOnly(true);
    dropdown.hidden = true;
    dropdown.innerHTML = '';
    notifyChange();
  }

  function renderResults(results) {
    if (!results.length) {
      dropdown.innerHTML = '<div class="location-dropdown-empty">No matching locations found. Try "Edit manually" below if this place is not in the database.</div>';
      dropdown.hidden = false;
      return;
    }
    dropdown.innerHTML = results.map((place, i) => {
      const label = formatResultLabel(place);
      return `
        <div class="location-dropdown-row" data-index="${i}">
          <div class="location-dropdown-name">${label.name}</div>
          <div class="location-dropdown-region">${label.regionCountry}</div>
          <div class="location-dropdown-coords">${label.coords}</div>
        </div>`;
    }).join('');
    dropdown.hidden = false;
    Array.from(dropdown.querySelectorAll('.location-dropdown-row')).forEach((row, i) => {
      row.addEventListener('click', () => selectPlace(results[i]));
    });
    dropdown._lastResults = results;
  }

  function runSearch(query) {
    if (!dbInstance) return; // still loading; user can retry by typing more
    const results = searchPlaces(dbInstance, query, 15);
    renderResults(results);
  }

  input.addEventListener('input', () => {
    selection = null;
    notifyChange();
    const query = input.value;
    clearTimeout(debounceTimer);
    if (query.trim().length < 2) { dropdown.hidden = true; return; }
    debounceTimer = setTimeout(() => runSearch(query), 200);
  });

  document.addEventListener('click', e => {
    if (e.target !== input && !dropdown.contains(e.target)) dropdown.hidden = true;
  });

  editManualBtn.addEventListener('click', () => {
    manualMode = true;
    setReadOnly(false);
    latField.value = latField.value || '';
    lonField.value = lonField.value || '';
    latField.focus();
  });

  function validateManualCoords() {
    const lat = parseFloat(latField.value);
    const lon = parseFloat(lonField.value);
    if (isNaN(lat) || lat < -90 || lat > 90) throw new Error(`${config.label || 'Location'}: latitude must be between -90 and 90.`);
    if (isNaN(lon) || lon < -180 || lon > 180) throw new Error(`${config.label || 'Location'}: longitude must be between -180 and 180.`);
    return { lat, lon };
  }

  [latField, lonField, timezoneSelect].forEach(el => {
    el.addEventListener('change', () => {
      if (!manualMode) return;
      try {
        const { lat, lon } = validateManualCoords();
        selection = {
          id: null, geonamesId: null, name: input.value.trim() || 'Manual location',
          asciiName: input.value.trim() || 'Manual location', state: null, district: null,
          country: null, countryCode: null, latitude: lat, longitude: lon,
          timezone: timezoneSelect.value, manual: true
        };
      } catch (err) {
        selection = null;
      }
      notifyChange();
    });
  });

  if (currentLocationBtn) {
    currentLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not available in this browser.');
        return;
      }
      currentLocationBtn.disabled = true;
      currentLocationBtn.textContent = 'Locating…';
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          let nearestLabel = 'Current Location';
          let nearestPlace = null;
          if (dbInstance) {
            const stmt = dbInstance.prepare('SELECT * FROM places WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ? ORDER BY population DESC LIMIT 50');
            stmt.bind([latitude - 1, latitude + 1, longitude - 1, longitude + 1]);
            let best = null, bestDist = Infinity;
            while (stmt.step()) {
              const cols = stmt.getColumnNames(), vals = stmt.get();
              const rec = {}; cols.forEach((c, i) => { rec[c] = vals[i]; });
              const d = haversineKm(latitude, longitude, rec.latitude, rec.longitude);
              if (d < bestDist) { bestDist = d; best = rec; }
            }
            stmt.free();
            if (best) nearestPlace = best;
          }
          if (nearestPlace) nearestLabel = `${nearestPlace.name} (nearest known place)`;
          input.value = nearestLabel;
          manualMode = true;
          setReadOnly(false);
          latField.value = latitude;
          lonField.value = longitude;
          stateField.value = nearestPlace ? (nearestPlace.admin1_name || '—') : '—';
          countryField.value = nearestPlace ? (nearestPlace.country_name || '—') : '—';
          selection = {
            id: null, geonamesId: null, name: nearestLabel, asciiName: nearestLabel,
            state: nearestPlace ? nearestPlace.admin1_name : null, district: null,
            country: nearestPlace ? nearestPlace.country_name : null, countryCode: nearestPlace ? nearestPlace.country_code : null,
            latitude, longitude, timezone: timezoneSelect.value || null, manual: true
          };
          currentLocationBtn.disabled = false;
          currentLocationBtn.textContent = 'Use My Current Location';
          notifyChange();
        },
        err => {
          currentLocationBtn.disabled = false;
          currentLocationBtn.textContent = 'Use My Current Location';
          alert('Could not get current location: ' + err.message);
        }
      );
    });
  }

  function getSelectedLocation() {
    if (!selection) return null;
    if (manualMode) {
      try { validateManualCoords(); } catch (e) { return null; }
      return {
        latitude: parseFloat(latField.value), longitude: parseFloat(lonField.value),
        timezone: timezoneSelect.value || null, geonamesId: null,
        countryCode: selection.countryCode || null, country: selection.country || null,
        state: selection.state || null, district: selection.district || null,
        name: input.value.trim() || 'Manual location', manual: true
      };
    }
    return {
      latitude: selection.latitude, longitude: selection.longitude, timezone: selection.timezone,
      geonamesId: selection.geonamesId, countryCode: selection.countryCode, country: selection.country,
      state: selection.state, district: selection.district, name: selection.asciiName, manual: false
    };
  }

  function reset() {
    selection = null;
    manualMode = false;
    input.value = '';
    stateField.value = '';
    countryField.value = '';
    latField.value = '';
    lonField.value = '';
    setReadOnly(true);
    dropdown.hidden = true;
    dropdown.innerHTML = '';
  }

  // Fields start editable (not locked) so a caller that pre-fills default
  // coordinates (e.g. the Birth Location selector's existing defaults) keeps
  // working exactly as before; they only become read-only right after a
  // database selection is made (see selectPlace()).

  return { getSelectedLocation, reset };
}

if (typeof module !== 'undefined') {
  module.exports = { LOCATION_SELECTOR_LOGIC_TEXT, createLocationSelector, formatResultLabel };
}
