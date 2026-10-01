/* =========================================================
   RELOCATION — rendering layer only.
   Consumes window.Relocation (engine) + window.RelocationLocations and
   renders into #reloc-root, using this app's existing shared UI
   conventions (output-box/pastel-* panels, .rem-table, quality-good/
   neutral/bad coloring, avp-calc expandable details) — the same visual
   language as every other tab. Candidate locations and the selected
   purpose are kept in this module's own closure state (not
   window.state), since they are user selections independent of the
   chart's own lifecycle and should survive a tab switch without being
   reset by chart regeneration.
   Namespaced as window.RelocationUI.
   ========================================================= */

window.RelocationUI = (function () {
  const UI = {};
  let initialized = false;
  let locations = []; // { name, country, latitude, longitude }
  let purpose = 'Overall Residence';
  let selectedLocationIndex = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting')) return 'quality-good';
    if (l.includes('moderate') || l === 'neutral') return 'quality-neutral';
    if (l.includes('challenging')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }

  function evidenceDetails(title, items) {
    return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`;
  }

  function getBirthLatLon() {
    const lat = parseFloat(document.getElementById('birthLat') ? document.getElementById('birthLat').value : NaN);
    const lon = parseFloat(document.getElementById('birthLon') ? document.getElementById('birthLon').value : NaN);
    return { lat: isNaN(lat) ? 0 : lat, lon: isNaN(lon) ? 0 : lon };
  }

  // ---------------------------------------------------------------
  // Input section
  // ---------------------------------------------------------------
  function renderInput() {
    const birth = getBirthLatLon();
    const sampleOptions = window.RelocationLocations.SAMPLE_CITIES.map(c => `<option value="${esc(c.name)}">${esc(c.name)}, ${esc(c.country)}</option>`).join('');
    const purposeOptions = window.Relocation.PURPOSES.map(p => `<option value="${esc(p)}" ${p === purpose ? 'selected' : ''}>${esc(p)}</option>`).join('');
    const locationRows = locations.map((loc, i) => `
      <tr>
        <td>${esc(loc.name)}</td>
        <td>${esc(loc.country || '')}</td>
        <td>${loc.latitude.toFixed(4)}</td>
        <td>${loc.longitude.toFixed(4)}</td>
        <td><button type="button" class="reloc-remove-btn" data-idx="${i}">Remove</button></td>
      </tr>`).join('');
    return `
      <h3 id="reloc-sec-input">Input</h3>
      <div class="output-box pastel-peach">
        <p><strong>Birth place:</strong> Lat ${birth.lat.toFixed(4)}, Lon ${birth.lon.toFixed(4)} (from Chart &amp; Analysis tab)</p>
        <p>
          <label>Purpose: <select id="reloc-purpose-select">${purposeOptions}</select></label>
        </p>
        <p>
          <label>Add a sample city: <select id="reloc-sample-select"><option value="">-- choose --</option>${sampleOptions}</select></label>
          <button type="button" id="reloc-add-sample-btn">Add</button>
        </p>
        <p>
          <label>Or add a custom location: Name <input type="text" id="reloc-custom-name" size="14"></label>
          Lat <input type="number" id="reloc-custom-lat" step="0.0001" size="8">
          Lon <input type="number" id="reloc-custom-lon" step="0.0001" size="8">
          <button type="button" id="reloc-add-custom-btn">Add</button>
        </p>
        ${locations.length ? `<table class="rem-table"><thead><tr><th>Name</th><th>Country</th><th>Lat</th><th>Lon</th><th></th></tr></thead><tbody>${locationRows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No candidate locations added yet.</p>'}
        <p><button type="button" id="reloc-analyse-btn" ${locations.length ? '' : 'disabled'}>Analyse</button></p>
      </div>`;
  }

  // ---------------------------------------------------------------
  // Natal relocation promise section
  // ---------------------------------------------------------------
  function renderNatalPromise() {
    const promise = window.Relocation.assessNatalPromise();
    const houseRows = promise.houseClassifications.map(h => `
      <tr>
        <td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td>
        <td class="${qualityClass(h.result)}">${badge(h.result)}</td>
        <td>${h.rule ? esc(h.rule.name) : ''}</td>
        <td>${evidenceDetails('Why?', h.evidence)}</td>
      </tr>`).join('');
    const relRows = promise.relationships.map(r => `
      <tr>
        <td>${esc(r.rule.name)}</td>
        <td class="${r.connected ? 'quality-good' : 'quality-bad'}">${r.connected ? 'Connected' : 'Not connected'}</td>
        <td>${evidenceDetails('Evidence', [r.evidence])}</td>
      </tr>`).join('');
    return `
      <h3 id="reloc-sec-natal">Natal Relocation Analysis</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(promise.overall)}</p>
        <table class="rem-table"><thead><tr><th>House/Lord</th><th>Classification</th><th>Rule</th><th>Evidence</th></tr></thead><tbody>${houseRows}</tbody></table>
        <p><strong>Moon:</strong> ${badge(promise.moonAssessment.result)} ${evidenceDetails('Why?', promise.moonAssessment.evidence)}</p>
      </div>
      <h4>House Relationships</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Relationship</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${relRows}</tbody></table>
      </div>`;
  }

  // ---------------------------------------------------------------
  // Comparison table (Section 12)
  // ---------------------------------------------------------------
  function scoreLabel(frac) { return frac >= 0.65 ? 'Strong' : frac >= 0.45 ? 'Supporting' : frac >= 0.3 ? 'Moderate' : 'Challenging'; }

  function renderComparison() {
    if (!locations.length) return '';
    const birth = getBirthLatLon();
    const comparisonPurposes = ['Overall Residence', 'Career', 'Finance', 'Family & Relationships', 'Retirement'];
    const rows = comparisonPurposes.map(p => {
      const cells = locations.map(loc => {
        const idx = window.Relocation.computeCompatibilityIndex(loc, p);
        const frac = idx.score / idx.maxScore;
        return `<td class="${qualityClass(scoreLabel(frac))}">${idx.score}/${idx.maxScore} ${badge(scoreLabel(frac))}</td>`;
      }).join('');
      return `<tr><td>${esc(p)}</td>${cells}</tr>`;
    }).join('');
    const dashaRow = locations.map(loc => {
      const dasha = window.Relocation.assessDashaForRelocation();
      const label = !dasha ? 'N/A' : dasha.classification.timing ? 'Strong' : dasha.classification.activation ? 'Supporting' : dasha.classification.promise ? 'Moderate' : 'Neutral';
      return `<td class="${qualityClass(label)}">${badge(label)}</td>`;
    }).join('');
    const headerCells = locations.map(loc => `<th>${esc(loc.name)}</th>`).join('');
    return `
      <h3 id="reloc-sec-compare">Location Comparison</h3>
      <p style="font-size:0.9em;color:#555;">No location is labeled universally "best" — compare the factors below and decide based on your own priorities. Click a location name in the detail section below for its full breakdown.</p>
      <div class="output-box pastel-yellow" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Factor</th>${headerCells}</tr></thead>
          <tbody>${rows}<tr><td>Dasha (current period)</td>${dashaRow}</tr></tbody>
        </table>
      </div>`;
  }

  // ---------------------------------------------------------------
  // Location detail (Section 13-14)
  // ---------------------------------------------------------------
  function houseDetailRow(label, houseData, chartPlanetsForDignity) {
    const lordP = chartPlanetsForDignity.find(p => p.name === houseData.lord);
    const isClassical = SHADBALA_PLANETS.includes(houseData.lord);
    const dignity = isClassical ? detailedDignity(houseData.lord, lordP.sign, normalizeDegrees(lordP.longitude) % 30).tier : 'Neutral';
    return `
      <tr>
        <td>${esc(label)}</td>
        <td>${esc(houseData.sign)}</td>
        <td>${esc(houseData.lord)} (${esc(lordP.sign)}, house ${lordP.house})</td>
        <td>${esc(dignity)}</td>
        <td>${houseData.aspectingHere.length ? esc(houseData.aspectingHere.join(', ')) : '&mdash;'}</td>
        <td>${houseData.occupants.length ? esc(houseData.occupants.join(', ')) : '&mdash;'}</td>
      </tr>`;
  }

  function renderLocationDetail(loc, idx) {
    const birth = getBirthLatLon();
    const analysis = window.Relocation.analyzeLocation(loc, purpose, birth.lat, birth.lon);
    const r = analysis.relocated;
    const idxResult = analysis.index;
    const dir = analysis.direction;
    const dasha = analysis.dasha;
    const av = analysis.ashtakavarga;

    const houseRows = [
      houseDetailRow('4th House', r.houses[4], r.planets),
      houseDetailRow('9th House', r.houses[9], r.planets),
      houseDetailRow('10th House', r.houses[10], r.planets),
      houseDetailRow('12th House', r.houses[12], r.planets)
    ].join('');

    const purposeInterpretations = window.Relocation.PURPOSES.map(p => {
      const pIdx = window.Relocation.computeCompatibilityIndex(loc, p);
      return `<p><strong>${esc(p)}:</strong> ${pIdx.score}/${pIdx.maxScore} ${badge(scoreLabel(pIdx.score / pIdx.maxScore))}</p>`;
    }).join('');

    const compBreakdown = Object.keys(idxResult.components).map(k => `<li>${esc(k)}: ${idxResult.components[k]}</li>`).join('');

    let dashaBlock = '<p style="font-size:0.9em;color:#555;">Dasha data unavailable.</p>';
    if (dasha) {
      dashaBlock = `
        <table class="rem-table">
          <tr><td>Mahadasha</td><td>${esc(dasha.mahadasha.lord)}</td></tr>
          <tr><td>Antardasha</td><td>${dasha.antardasha ? esc(dasha.antardasha.lord) : '&mdash;'}</td></tr>
          <tr><td>Pratyantardasha</td><td>${dasha.pratyantardasha ? esc(dasha.pratyantardasha.lord) : '&mdash;'}</td></tr>
        </table>
        <p>Promise: ${badge(dasha.classification.promise ? 'Yes' : 'No')} &nbsp; Activation: ${badge(dasha.classification.activation ? 'Yes' : 'No')} &nbsp; Timing: ${badge(dasha.classification.timing ? 'Yes' : 'No')}</p>`;
    }

    return `
      <div class="output-box pastel-pink" style="margin-top:8px;">
        <h4>${esc(loc.name)}${loc.country ? ', ' + esc(loc.country) : ''}</h4>
        <p><strong>Relocated Ascendant:</strong> ${esc(r.ascendant.sign)} ${esc(r.ascendant.degreeDms)}</p>
        <p><strong>Direction from birthplace:</strong> ${esc(dir.label)} (${dir.bearing.toFixed(1)}&deg;, ${dir.compass}), ~${Math.round(dir.distanceKm)} km ${evidenceDetails('About direction', ['Direction is shown as supplementary geographic context only (Rule ' + dir.rule.id + ') and never overrides house/lord/dasha evidence.'])}</p>
        <table class="rem-table"><thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Dignity</th><th>Aspects</th><th>Occupants</th></tr></thead><tbody>${houseRows}</tbody></table>

        <h5>Compatibility Index (${esc(purpose)}): ${idxResult.score}/${idxResult.maxScore}</h5>
        <p><strong>Natal Promise &rarr; Location Effect &rarr; Dasha Activation &rarr; Transit Timing</strong></p>
        <p>Positive factors: ${idxResult.positiveFactors.length ? esc(idxResult.positiveFactors.join('; ')) : 'none'}</p>
        <p>Challenging factors: ${idxResult.negativeFactors.length ? esc(idxResult.negativeFactors.join('; ')) : 'none'}</p>
        <p>Neutral factors: ${idxResult.neutralFactors.length ? esc(idxResult.neutralFactors.join('; ')) : 'none'}</p>
        <details class="avp-calc"><summary>Component breakdown</summary><ul>${compBreakdown}</ul></details>
        <details class="avp-calc"><summary>Rules used</summary><ul>${idxResult.ruleIds.map(rule => `<li>${esc(rule.id)} — ${esc(rule.name)}: ${esc(rule.explanation)}</li>`).join('')}</ul></details>

        <h5>Dasha Activation</h5>
        ${dashaBlock}

        ${av ? `<h5>Ashtakavarga (SAV bindus)</h5><p>4th: ${av[4]} &nbsp; 9th: ${av[9]} &nbsp; 10th: ${av[10]} &nbsp; 12th: ${av[12]}</p>` : ''}

        <h5>Purpose-specific Interpretations</h5>
        ${purposeInterpretations}
      </div>`;
  }

  function renderDetailSection() {
    if (!locations.length) return '';
    const buttons = locations.map((loc, i) => `<button type="button" class="reloc-detail-btn" data-idx="${i}">${esc(loc.name)}</button>`).join(' ');
    const detail = selectedLocationIndex !== null && locations[selectedLocationIndex] ? renderLocationDetail(locations[selectedLocationIndex], selectedLocationIndex) : '<p style="font-size:0.9em;color:#555;">Click a location above for its full detail.</p>';
    return `
      <h3 id="reloc-sec-detail">Location Detail</h3>
      <div class="output-box pastel-lavender">${buttons}</div>
      ${detail}`;
  }

  function attachInteractions(root) {
    const purposeSelect = root.querySelector('#reloc-purpose-select');
    if (purposeSelect) purposeSelect.addEventListener('change', () => { purpose = purposeSelect.value; UI.render(); });

    const addSampleBtn = root.querySelector('#reloc-add-sample-btn');
    if (addSampleBtn) addSampleBtn.addEventListener('click', () => {
      const sel = root.querySelector('#reloc-sample-select');
      const city = window.RelocationLocations.SAMPLE_CITIES.find(c => c.name === sel.value);
      if (city && !locations.some(l => l.name === city.name)) { locations.push(Object.assign({}, city)); UI.render(); }
    });

    const addCustomBtn = root.querySelector('#reloc-add-custom-btn');
    if (addCustomBtn) addCustomBtn.addEventListener('click', () => {
      const name = root.querySelector('#reloc-custom-name').value.trim();
      const lat = parseFloat(root.querySelector('#reloc-custom-lat').value);
      const lon = parseFloat(root.querySelector('#reloc-custom-lon').value);
      if (!name || isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        alert('Enter a name and valid latitude (-90 to 90) / longitude (-180 to 180).');
        return;
      }
      locations.push({ name, country: '', latitude: lat, longitude: lon });
      UI.render();
    });

    root.querySelectorAll('.reloc-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-idx'));
      locations.splice(idx, 1);
      if (selectedLocationIndex === idx) selectedLocationIndex = null;
      else if (selectedLocationIndex !== null && selectedLocationIndex > idx) selectedLocationIndex -= 1;
      UI.render();
    }));

    const analyseBtn = root.querySelector('#reloc-analyse-btn');
    if (analyseBtn) analyseBtn.addEventListener('click', () => { selectedLocationIndex = locations.length ? 0 : null; UI.render(); });

    root.querySelectorAll('.reloc-detail-btn').forEach(btn => btn.addEventListener('click', () => {
      selectedLocationIndex = Number(btn.getAttribute('data-idx'));
      UI.render();
    }));
  }

  UI.render = function () {
    const root = document.getElementById('reloc-root');
    if (!root) return;
    if (!window.Relocation.getChartData()) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to use Relocation Analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Determines whether the natal chart supports relocation, how different locations change the house-based picture (natal planets are never altered — only the Ascendant/houses are recalculated for each location), and how the current Dasha/transits activate that promise. Hierarchy: <strong>Natal Promise &rarr; Location Effect &rarr; Dasha Activation &rarr; Transit Timing</strong>.</p>',
      renderInput(),
      renderNatalPromise(),
      renderComparison(),
      renderDetailSection()
    ].join('');
    attachInteractions(root);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.Relocation) window.Relocation.init(); };
  UI.init();
  return UI;
})();
