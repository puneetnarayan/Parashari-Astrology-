// UI glue: tabs, birth input handling, Planet Table rendering, D1/D9 chart
// rendering (South/North Indian), Ashtakvarga rendering. No astrology math
// lives here — everything is delegated to the other modules.

const DEFAULT_BIRTH = {
  date: '1970-06-02',
  time: '18:45:00',
  lat: '26.7663',
  lon: '83.3689',
  timezoneMode: 'offset',
  utcOffset: '+5:30'
};

const state = {
  chart: null // { planets, ascendant }
};

function initTabs() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      // Every tab renders straight from state, so switching tabs always
      // reflects the latest generated chart without recomputation.
      if (btn.dataset.tab === 'tabCharts') renderCharts();
      if (btn.dataset.tab === 'tabAshtakvarga') renderAshtakvargaTab();
      if (btn.dataset.tab === 'tabDivisional') renderDivisionalTab();
      if (btn.dataset.tab === 'tabStrength') renderStrengthTab();
      if (btn.dataset.tab === 'tabInterpretations') renderInterpretationsTab();
    });
  });
}

function initEngineStatusBadge() {
  const badge = document.getElementById('engineStatusBadge');
  const update = () => {
    if (window.SWISSEPH_READY) {
      badge.textContent = 'Calculation engine: Swiss Ephemeris (WebAssembly) — offline, high precision.';
      badge.style.color = '#2e7d32';
    } else if (window.SWISSEPH_LOAD_ERROR) {
      badge.textContent = 'Swiss Ephemeris failed to load — using offline analytic fallback engine instead.';
      badge.style.color = '#b23b3b';
    } else {
      badge.textContent = 'Loading Swiss Ephemeris (WebAssembly)...';
    }
  };
  document.addEventListener('swisseph-ready', update);
  document.addEventListener('swisseph-load-failed', update);
  update();
  setTimeout(update, 1500);
}

function populateIanaZones() {
  const select = document.getElementById('ianaZone');
  let zones;
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch (e) {
    zones = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London'];
  }
  select.innerHTML = zones.map(z => `<option value="${z}">${z}</option>`).join('');
  const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (guessed && zones.includes(guessed)) select.value = guessed;
}

function initTimezoneModeToggle() {
  const modeSelect = document.getElementById('timezoneMode');
  modeSelect.addEventListener('change', () => {
    const isIana = modeSelect.value === 'iana';
    document.getElementById('ianaZoneLabel').hidden = !isIana;
    document.getElementById('utcOffsetLabel').hidden = isIana;
  });
}

function applyDefaultBirthInputs() {
  document.getElementById('birthLocalDate').value = DEFAULT_BIRTH.date;
  document.getElementById('birthLocalTime').value = DEFAULT_BIRTH.time;
  document.getElementById('birthLat').value = DEFAULT_BIRTH.lat;
  document.getElementById('birthLon').value = DEFAULT_BIRTH.lon;
  document.getElementById('timezoneMode').value = DEFAULT_BIRTH.timezoneMode;
  document.getElementById('utcOffset').value = DEFAULT_BIRTH.utcOffset;
  document.getElementById('ianaZoneLabel').hidden = DEFAULT_BIRTH.timezoneMode !== 'iana';
  document.getElementById('utcOffsetLabel').hidden = DEFAULT_BIRTH.timezoneMode === 'iana';
}

function clearOutputs() {
  state.chart = null;
  document.getElementById('ascendantOutput').innerHTML = '';
  document.getElementById('planetTableOutput').innerHTML = '';
  document.getElementById('chartsOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
  document.getElementById('ashtakvargaTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
  document.getElementById('ashtakvargaChartOutput').innerHTML = '';
  document.getElementById('ashtakvargaInterpretationOutput').innerHTML = '';
  document.getElementById('divisionalChartOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
  document.getElementById('relationsTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
  document.getElementById('strengthTableOutput').innerHTML = '';
  document.getElementById('lagnaInterpretationOutput').innerHTML = '';
  document.getElementById('planetInSignInterpretationOutput').innerHTML = '';
  document.getElementById('planetInHouseInterpretationOutput').innerHTML = '';
  document.getElementById('planetConditionsOutput').innerHTML = '';
}

function resetForm() {
  applyDefaultBirthInputs();
  clearOutputs();
}

function birthDateUtcFromInputs() {
  const dateStr = document.getElementById('birthLocalDate').value;
  const timeStr = document.getElementById('birthLocalTime').value || '00:00:00';
  if (!dateStr) throw new Error('Enter a birth date.');
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute, second] = timeStr.split(':').map(Number);

  const mode = document.getElementById('timezoneMode').value;
  if (mode === 'iana') {
    const zone = document.getElementById('ianaZone').value;
    return zonedLocalToUtc(year, month, day, hour, minute || 0, zone);
  }
  const offsetMinutes = parseUtcOffsetToMinutes(document.getElementById('utcOffset').value || '0');
  return offsetLocalToUtc(year, month, day, hour, minute || 0, offsetMinutes);
}

function renderAscendant(ascendant) {
  const el = document.getElementById('ascendantOutput');
  el.innerHTML = `<strong>Ascendant (Lagna):</strong> ${ascendant.sign} ${ascendant.degreeDms}`;
}

function renderPlanetTable(planets) {
  const el = document.getElementById('planetTableOutput');
  const rows = planets.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.sign}</td>
      <td>${p.degreeDms}</td>
      <td>${p.nakshatra || ''}</td>
      <td>${p.pada || ''}</td>
      <td class="${p.combust ? 'yes-flag' : 'no-flag'}">${p.combust ? 'Yes' : 'No'}</td>
      <td class="${p.retrograde ? 'yes-flag' : 'no-flag'}">${p.retrograde ? 'Yes' : 'No'}</td>
      <td>${p.aspectedBy.length ? p.aspectedBy.join(', ') : '—'}</td>
      <td>${p.conjunctWith.length ? p.conjunctWith.join(', ') : '—'}</td>
    </tr>`).join('');
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th><th>Pada</th>
        <th>Combust</th><th>Retrograde</th><th>Aspected By</th><th>Conjunct With</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Reads the shared "Show seconds in charts" checkbox — DMS with seconds
// when on, degree-minute only when off (the default).
function chartDegreeFormat(longitude) {
  const showSeconds = document.getElementById('showSecondsToggle').checked;
  return showSeconds ? formatDegMinSec(longitude) : formatDegMin(longitude);
}

function planetLabel(name) {
  return PLANET_ABBR[name] || name;
}

function renderSouthIndianChart(title, bySign, scoresBySign, borderClass) {
  const cells = SOUTH_INDIAN_GRID.map(sign => {
    if (!sign) return '<div class="vedic-chart-cell"></div>';
    const planets = bySign[sign] || [];
    const planetLines = planets.map(p => `${planetLabel(p.name)} ${chartDegreeFormat(p.longitude)}`).join('<br>');
    const scoreHtml = scoresBySign ? `<br><span class="av-score-circle">${scoresBySign[SIGNS.indexOf(sign)]}</span>` : '';
    return `<div class="vedic-chart-cell"><span class="sign-name">${sign.slice(0, 3)}</span>${planetLines}${scoreHtml}</div>`;
  }).join('');
  return `<div class="chart-block${borderClass ? ' ' + borderClass : ''}"><h3>${title} (South Indian)</h3><div class="vedic-chart-grid">${cells}</div></div>`;
}

function renderNorthIndianChart(title, byHouse, scoresBySign, borderClass) {
  const polygons = NORTH_INDIAN_HOUSES.map(h => {
    const data = byHouse[h.house];
    const sign = SIGNS[data.signIndex];
    const planetText = data.planets.map(p => `${planetLabel(p.name)} ${chartDegreeFormat(p.longitude)}`).join(' | ');
    const scoreCircle = scoresBySign ? `
      <circle cx="${h.label[0]}" cy="${h.label[1] + 22}" r="10" fill="#fff6e8" stroke="#a04000" stroke-width="1.5" />
      <text x="${h.label[0]}" y="${h.label[1] + 26}" text-anchor="middle" font-weight="bold" font-size="11" fill="#a04000">${scoresBySign[data.signIndex]}</text>
    ` : '';
    return `
      <polygon points="${h.points}" fill="none" stroke="#555" stroke-width="1.5" />
      <text x="${h.label[0]}" y="${h.label[1]}" text-anchor="middle" font-weight="bold">${sign.slice(0, 3)}</text>
      <text x="${h.label[0]}" y="${h.label[1] + 12}" text-anchor="middle" font-size="8">${planetText}</text>
      ${scoreCircle}
    `;
  }).join('');
  return `<div class="chart-block${borderClass ? ' ' + borderClass : ''}"><h3>${title} (North Indian)</h3>
    <svg class="vedic-chart-svg" width="320" height="320" viewBox="-10 -10 320 320">
      <rect x="0" y="0" width="300" height="300" fill="#fff" stroke="#555" stroke-width="2" />
      <line x1="0" y1="0" x2="300" y2="300" stroke="#555" />
      <line x1="300" y1="0" x2="0" y2="300" stroke="#555" />
      ${polygons}
    </svg></div>`;
}

function renderCharts() {
  const output = document.getElementById('chartsOutput');
  output.innerHTML = '';
  if (!state.chart) {
    output.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  const layout = document.getElementById('chartLayout').value;
  const { planets, ascendant } = state.chart;

  if (layout === 'south') {
    const d1BySign = buildD1ChartData(planets);
    const d9 = buildD9ChartData(planets);
    output.innerHTML = renderSouthIndianChart('D1 (Rasi)', d1BySign) + renderSouthIndianChart('D9 (Navamsa)', d9.bySign);
  } else {
    const d1ByHouse = buildD1NorthIndian(planets, ascendant.longitude);
    const d9 = buildD9NorthIndian(planets, ascendant.longitude);
    output.innerHTML = renderNorthIndianChart('D1 (Rasi)', d1ByHouse) + renderNorthIndianChart('D9 (Navamsa)', d9.byHouse);
  }
}

// House number (1-12 from Ascendant) for a given zodiac sign index.
function houseNumberForSign(signIndex, ascSignIndex) {
  return wholeSignHouseOf(signIndex, ascSignIndex);
}

function renderAshtakvargaTable(av, ascSignIndex) {
  const el = document.getElementById('ashtakvargaTableOutput');
  const houseHeaders = Array.from({ length: 12 }, (_, i) => `<th>H${i + 1}</th>`).join('');
  const rows = AV_PLANETS.map(name => {
    // Re-order each planet's 12-sign array into house order (H1=Ascendant's sign).
    const byHouse = new Array(12);
    for (let signIndex = 0; signIndex < 12; signIndex++) {
      byHouse[houseNumberForSign(signIndex, ascSignIndex) - 1] = av.bav[name][signIndex];
    }
    return `<tr><td>${name}</td>${byHouse.map(v => `<td>${v}</td>`).join('')}<td><strong>${byHouse.reduce((a, b) => a + b, 0)}</strong></td></tr>`;
  }).join('');

  const savByHouse = new Array(12);
  for (let signIndex = 0; signIndex < 12; signIndex++) {
    savByHouse[houseNumberForSign(signIndex, ascSignIndex) - 1] = av.sav[signIndex];
  }
  const savRow = `<tr><td><strong>Sarvashtakavarga</strong></td>${savByHouse.map(v => `<td><strong>${v}</strong></td>`).join('')}<td><strong>${savByHouse.reduce((a, b) => a + b, 0)}</strong></td></tr>`;

  el.innerHTML = `
    <table>
      <thead><tr><th>Planet</th>${houseHeaders}<th>Total</th></tr></thead>
      <tbody>${rows}${savRow}</tbody>
    </table>`;
}

function renderAshtakvargaChart(av) {
  const el = document.getElementById('ashtakvargaChartOutput');
  el.innerHTML = '';
  if (!state.chart) return;
  const layout = document.getElementById('avChartLayout').value;
  const { planets, ascendant } = state.chart;

  if (layout === 'south') {
    const d1BySign = buildD1ChartData(planets);
    el.innerHTML = renderSouthIndianChart('Sarvashtakavarga', d1BySign, av.sav);
  } else {
    const d1ByHouse = buildD1NorthIndian(planets, ascendant.longitude);
    el.innerHTML = renderNorthIndianChart('Sarvashtakavarga', d1ByHouse, av.sav);
  }
}

function renderAshtakvargaInterpretation(av, planets, ascSignIndex) {
  const el = document.getElementById('ashtakvargaInterpretationOutput');
  const interpretation = generateAshtakvargaInterpretation(av, planets, ascSignIndex);

  const houseItems = interpretation.houses.map(h =>
    `<li>House ${h.house}: <span class="av-label-${h.label}">${h.label}</span> — ${h.text}</li>`
  ).join('');

  const planetItems = interpretation.planets.map(p =>
    `<li>${p.name} (${p.sign}, House ${p.house}): <span class="av-label-${p.label}">${p.label}</span> — ${p.text}</li>`
  ).join('');

  el.innerHTML = `
    <p><strong>Sarvashtakavarga strength by house:</strong></p>
    <ul>${houseItems}</ul>
    <p><strong>Each planet's own bindu strength in its occupied sign:</strong></p>
    <ul>${planetItems}</ul>`;
}

function renderAshtakvargaTab() {
  if (!state.chart) {
    document.getElementById('ashtakvargaTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('ashtakvargaChartOutput').innerHTML = '';
    document.getElementById('ashtakvargaInterpretationOutput').innerHTML = '';
    return;
  }
  const { planets, ascendant } = state.chart;
  const av = computeAshtakvarga(planets, ascendant.longitude);
  state.ashtakvarga = av;
  renderAshtakvargaTable(av, av.ascendantSignIndex);
  renderAshtakvargaChart(av);
  renderAshtakvargaInterpretation(av, planets, av.ascendantSignIndex);
}

// Distinct pastel border class per divisional chart, cycling through the
// palette defined in index.html (.cb-0 .. .cb-15).
function borderClassForIndex(i) {
  return `cb-${i % 16}`;
}

function renderDivisionalTab() {
  const output = document.getElementById('divisionalChartOutput');
  output.innerHTML = '';
  if (!state.chart) {
    output.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  const layout = document.getElementById('divisionalChartLayout').value;
  const { planets, ascendant } = state.chart;

  output.innerHTML = DIVISIONAL_CHART_LIST.map((vargaKey, i) => {
    const title = DIVISIONAL_CHART_NAMES[vargaKey];
    const borderClass = borderClassForIndex(i);
    if (layout === 'south') {
      const data = buildDivisionalChartData(planets, vargaKey);
      return renderSouthIndianChart(title, data.bySign, null, borderClass);
    }
    const data = buildDivisionalNorthIndian(planets, ascendant.longitude, vargaKey);
    return renderNorthIndianChart(title, data.byHouse, null, borderClass);
  }).join('');
}

function relationList(items) {
  if (!items.length) return '—';
  return items.map(i => `${i.name} <span class="rel-${i.relation}">(${i.relation})</span>`).join(', ');
}

function renderRelationsTable(strengthData) {
  const el = document.getElementById('relationsTableOutput');
  const rows = strengthData.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.sign}</td>
      <td class="rel-${p.signRelation}">${p.signRelation}</td>
      <td>${relationList(p.conjRelations)}</td>
      <td>${relationList(p.aspectRelations)}</td>
    </tr>`).join('');
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Planet</th><th>Sign</th><th>Sign Lord Relation</th><th>Conjunct With</th><th>Aspected By</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderStrengthTable(strengthData) {
  const el = document.getElementById('strengthTableOutput');
  const scoreCell = v => `<span class="${v >= 0 ? 'score-positive' : 'score-negative'}">${v >= 0 ? '+' : ''}${v}%</span>`;
  const rows = strengthData.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${scoreCell(p.signScore)}</td>
      <td>${scoreCell(p.conjScore)}</td>
      <td>${scoreCell(p.aspectScore)}</td>
      <td>${scoreCell(p.total)}</td>
    </tr>`).join('');
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Planet</th><th>Sign Relation Score</th><th>Conjunction Score</th><th>Aspect Score</th><th>Total Strength</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderStrengthTab() {
  if (!state.chart) {
    document.getElementById('relationsTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('strengthTableOutput').innerHTML = '';
    return;
  }
  const strengthData = computePlanetaryStrength(state.chart.planets);
  renderRelationsTable(strengthData);
  renderStrengthTable(strengthData);
}

function dignityClass(dignity) {
  return `dignity-${dignity.replace(' ', '-')}`;
}

function renderLagnaInterpretation(ascendant) {
  const el = document.getElementById('lagnaInterpretationOutput');
  const text = interpretLagna(ascendant.sign);
  el.innerHTML = `
    <table>
      <thead><tr><th>Lagna Sign</th><th>Interpretation</th></tr></thead>
      <tbody><tr><td>${ascendant.sign}</td><td>${text}</td></tr></tbody>
    </table>`;
}

function renderPlanetInSignInterpretation(planets) {
  const el = document.getElementById('planetInSignInterpretationOutput');
  const rows = planets.map(p => {
    const result = interpretPlanetInSign(p.name, p.sign, p.longitude);
    return `<tr><td>${p.name}</td><td>${p.sign}</td><td class="${dignityClass(result.dignity)}">${result.dignity}</td><td>${result.text}</td></tr>`;
  }).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>Planet</th><th>Sign</th><th>Dignity</th><th>Interpretation</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderPlanetInHouseInterpretation(planets) {
  const el = document.getElementById('planetInHouseInterpretationOutput');
  const rows = planets.map(p =>
    `<tr><td>${p.name}</td><td>${p.house}</td><td>${interpretPlanetInHouse(p.name, p.house)}</td></tr>`
  ).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>Planet</th><th>House</th><th>Interpretation</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function flagCell(isOn, label) {
  return `<span class="${isOn ? 'condition-flag-on' : 'condition-flag-off'}">${isOn ? label : 'No'}</span>`;
}

function renderPlanetConditions(planets) {
  const el = document.getElementById('planetConditionsOutput');
  const rows = planets.map(p => {
    const result = interpretPlanetConditions(p);
    return `
      <tr>
        <td>${p.name}</td>
        <td class="${dignityClass(result.dignityTier)}">${result.dignityTier}</td>
        <td>${flagCell(result.combust, 'Combust')}</td>
        <td>${flagCell(result.retrograde, 'Retrograde')}</td>
        <td>${result.text}</td>
      </tr>`;
  }).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>Planet</th><th>Dignity</th><th>Combust</th><th>Retrograde</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderInterpretationsTab() {
  if (!state.chart) {
    document.getElementById('lagnaInterpretationOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('planetInSignInterpretationOutput').innerHTML = '';
    document.getElementById('planetInHouseInterpretationOutput').innerHTML = '';
    document.getElementById('planetConditionsOutput').innerHTML = '';
    return;
  }
  const { planets, ascendant } = state.chart;
  renderLagnaInterpretation(ascendant);
  renderPlanetInSignInterpretation(planets);
  renderPlanetInHouseInterpretation(planets);
  renderPlanetConditions(planets);
}

function generateChart() {
  const statusEl = document.getElementById('ascendantOutput');
  try {
    const birthUtc = birthDateUtcFromInputs();
    const lat = parseFloat(document.getElementById('birthLat').value);
    const lon = parseFloat(document.getElementById('birthLon').value);
    if (isNaN(lat) || isNaN(lon)) throw new Error('Enter valid birth latitude and longitude.');

    const { planets, ascendant } = generateBirthChart(birthUtc, lat, lon);
    state.chart = { planets, ascendant };
    // Every downstream view (Planet Table, Charts, Ashtakvarga) is fully
    // re-rendered from this fresh state, so any change to the birth inputs
    // automatically propagates everywhere the next time this runs.
    renderAscendant(ascendant);
    renderPlanetTable(planets);
    renderCharts();
    renderAshtakvargaTab();
    renderDivisionalTab();
    renderStrengthTab();
    renderInterpretationsTab();
  } catch (err) {
    state.chart = null;
    statusEl.innerHTML = `<span style="color:#b23b3b;">Error: ${err.message}</span>`;
    document.getElementById('planetTableOutput').innerHTML = '';
    document.getElementById('chartsOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('ashtakvargaTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('ashtakvargaChartOutput').innerHTML = '';
    document.getElementById('ashtakvargaInterpretationOutput').innerHTML = '';
    document.getElementById('divisionalChartOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('relationsTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('strengthTableOutput').innerHTML = '';
    document.getElementById('lagnaInterpretationOutput').innerHTML = '';
    document.getElementById('planetInSignInterpretationOutput').innerHTML = '';
    document.getElementById('planetInHouseInterpretationOutput').innerHTML = '';
    document.getElementById('planetConditionsOutput').innerHTML = '';
  }
}

// Auto-regenerate (debounced) whenever a birth input changes, so every tab
// always reflects the latest entered data without requiring the button.
function initAutoRegenerate() {
  const inputIds = ['birthLocalDate', 'birthLocalTime', 'birthLat', 'birthLon', 'timezoneMode', 'ianaZone', 'utcOffset'];
  let debounceTimer = null;
  const trigger = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const hasDate = document.getElementById('birthLocalDate').value;
      const hasLat = document.getElementById('birthLat').value.trim() !== '';
      const hasLon = document.getElementById('birthLon').value.trim() !== '';
      if (hasDate && hasLat && hasLon) generateChart();
    }, 400);
  };
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', trigger);
    el.addEventListener('change', trigger);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initEngineStatusBadge();
  populateIanaZones();
  initTimezoneModeToggle();
  applyDefaultBirthInputs();
  document.getElementById('generateChartBtn').addEventListener('click', generateChart);
  document.getElementById('resetBtn').addEventListener('click', resetForm);
  document.getElementById('chartLayout').addEventListener('change', renderCharts);
  document.getElementById('avChartLayout').addEventListener('change', () => renderAshtakvargaChart(state.ashtakvarga));
  document.getElementById('divisionalChartLayout').addEventListener('change', renderDivisionalTab);
  document.getElementById('showSecondsToggle').addEventListener('change', () => {
    renderCharts();
    if (state.ashtakvarga) renderAshtakvargaChart(state.ashtakvarga);
    renderDivisionalTab();
  });
  initAutoRegenerate();
  generateChart();
});
