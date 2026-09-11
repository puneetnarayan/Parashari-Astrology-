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

const DEFAULT_MATCHING = {
  timezoneMode: 'offset',
  utcOffset: '+5:30',
  boy: { name: 'Puneet Narayan', date: '1970-06-02', time: '18:45:00', lat: '26.7658', lon: '83.3649' },
  girl: { name: 'Sapna Narayan', date: '1972-01-11', time: '05:15:00', lat: '22.8056', lon: '86.2031' }
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
      if (btn.dataset.tab === 'tabBhinnashtakavarga') renderBavAllTab();
      if (btn.dataset.tab === 'tabYogas') renderYogasTab();
      if (btn.dataset.tab === 'tabDasha') renderDashaTab();
      if (btn.dataset.tab === 'tabInterpretations2') renderRuleEngineTab();
      if (btn.dataset.tab === 'tabSadeSati') renderSadeSatiTab();
      if (btn.dataset.tab === 'tabMangalDosha2') renderMangalDosha2Tab();
      if (btn.dataset.tab === 'tabShadbala') renderShadbalaTab();
      if (btn.dataset.tab === 'tabAshtakvargaPredictions') renderAshtakvargaPredictionsTab();
      if (btn.dataset.tab === 'tabKakshya') renderKakshyaTab();
      if (btn.dataset.tab === 'tabKakshyaTimeline') renderKakshyaTimelineTab();
      if (btn.dataset.tab === 'tabRemedies') renderRemediesTab();
      if (btn.dataset.tab === 'tabRemedies2') renderRemedies2Tab();
      if (btn.dataset.tab === 'tabRemediesCompare') renderRemediesCompareTab();
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

function populateIanaZoneSelect(selectId) {
  const select = document.getElementById(selectId);
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

function populateIanaZones() {
  populateIanaZoneSelect('ianaZone');
}

function initTimezoneModeToggle() {
  const modeSelect = document.getElementById('timezoneMode');
  modeSelect.addEventListener('change', () => {
    const isIana = modeSelect.value === 'iana';
    document.getElementById('ianaZoneLabel').hidden = !isIana;
    document.getElementById('utcOffsetLabel').hidden = isIana;
  });
}

function initMatchingTimezoneModeToggle() {
  const modeSelect = document.getElementById('matchingTimezoneMode');
  modeSelect.addEventListener('change', () => {
    const isIana = modeSelect.value === 'iana';
    document.getElementById('matchingIanaZoneLabel').hidden = !isIana;
    document.getElementById('matchingUtcOffsetLabel').hidden = isIana;
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
  document.getElementById('bavAllTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
  document.getElementById('bavAllChartOutput').innerHTML = '';
  document.getElementById('yogasTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
  document.getElementById('dashaTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
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

// cellClassFn(sign) -> extra CSS class name for that sign's cell (e.g.
// Bhinnashtakavarga strength shading). scoreCircleClass overrides the
// default amber Ashtakvarga circle style (e.g. for a neutral BAV circle).
function renderSouthIndianChart(title, bySign, scoresBySign, borderClass, cellClassFn, scoreCircleClass) {
  const cells = SOUTH_INDIAN_GRID.map(sign => {
    if (!sign) return '<div class="vedic-chart-cell"></div>';
    const planets = bySign[sign] || [];
    const planetLines = planets.map(p => `${planetLabel(p.name)} ${chartDegreeFormat(p.longitude)}`).join('<br>');
    const circleClass = scoreCircleClass || 'av-score-circle';
    const scoreHtml = scoresBySign ? `<br><span class="${circleClass}">${scoresBySign[SIGNS.indexOf(sign)]}</span>` : '';
    const extraClass = cellClassFn ? ' ' + cellClassFn(sign) : '';
    return `<div class="vedic-chart-cell${extraClass}"><span class="sign-name">${sign.slice(0, 3)}</span>${planetLines}${scoreHtml}</div>`;
  }).join('');
  return `<div class="chart-block${borderClass ? ' ' + borderClass : ''}"><h3>${title} (South Indian)</h3><div class="vedic-chart-grid">${cells}</div></div>`;
}

// fillColorFn(signIndex) -> hex fill color for that house's polygon (e.g.
// Bhinnashtakavarga strength shading). circleColors overrides the default
// amber score-circle colors ({ fill, stroke, text }).
function renderNorthIndianChart(title, byHouse, scoresBySign, borderClass, fillColorFn, circleColors) {
  const colors = circleColors || { fill: '#fff6e8', stroke: '#a04000', text: '#a04000' };
  const polygons = NORTH_INDIAN_HOUSES.map(h => {
    const data = byHouse[h.house];
    const sign = SIGNS[data.signIndex];
    const planetText = data.planets.map(p => `${planetLabel(p.name)} ${chartDegreeFormat(p.longitude)}`).join(' | ');
    const fill = fillColorFn ? fillColorFn(data.signIndex) : 'none';
    const scoreCircle = scoresBySign ? `
      <circle cx="${h.label[0]}" cy="${h.label[1] + 22}" r="10" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5" />
      <text x="${h.label[0]}" y="${h.label[1] + 26}" text-anchor="middle" font-weight="bold" font-size="11" fill="${colors.text}">${scoresBySign[data.signIndex]}</text>
    ` : '';
    return `
      <polygon points="${h.points}" fill="${fill}" stroke="#555" stroke-width="1.5" />
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

// Sarvashtakavarga strength banding (sum of 7 planets' bindus, typical
// range 0-56, average ~28 per house) — same weak/average/auspicious scheme
// as Bhinnashtakavarga's bavStrengthClass/bavFillColor, just re-scaled:
// mirrors the Excellent/Good vs Average vs Weak cutoffs already used by
// ashtakvargaInterpretations.js's SAV_STRENGTH_THRESHOLDS (Good-and-above
// collapses into "auspicious" for this 3-color scheme).
function savStrengthClass(score) {
  if (score < 20) return 'bav-weak';
  if (score < 30) return 'bav-average';
  return 'bav-auspicious';
}
function savFillColor(score) {
  if (score < 20) return '#ffdcdc';
  if (score < 30) return '#fff6c9';
  return '#d9f2d9';
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
    const cells = byHouse.map(v => `<td class="${bavStrengthClass(v)}">${v}</td>`).join('');
    return `<tr><td>${name}</td>${cells}<td><strong>${byHouse.reduce((a, b) => a + b, 0)}</strong></td></tr>`;
  }).join('');

  const savByHouse = new Array(12);
  for (let signIndex = 0; signIndex < 12; signIndex++) {
    savByHouse[houseNumberForSign(signIndex, ascSignIndex) - 1] = av.sav[signIndex];
  }
  const savCells = savByHouse.map(v => `<td class="${savStrengthClass(v)}"><strong>${v}</strong></td>`).join('');
  const savRow = `<tr><td><strong>Sarvashtakavarga</strong></td>${savCells}<td><strong>${savByHouse.reduce((a, b) => a + b, 0)}</strong></td></tr>`;

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
    el.innerHTML = renderSouthIndianChart('Sarvashtakavarga', d1BySign, av.sav, null,
      sign => savStrengthClass(av.sav[SIGNS.indexOf(sign)]), 'bav-score-circle');
  } else {
    const d1ByHouse = buildD1NorthIndian(planets, ascendant.longitude);
    el.innerHTML = renderNorthIndianChart('Sarvashtakavarga', d1ByHouse, av.sav, null,
      signIndex => savFillColor(av.sav[signIndex]), BAV_CIRCLE_COLORS);
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

// Bhinnashtakavarga strength banding (bindus, 0-8 per house): weak/average/
// auspicious, matching the legend and CSS classes in the Bhinnashtakavarga tab.
function bavStrengthClass(score) {
  if (score <= 3) return 'bav-weak';
  if (score <= 5) return 'bav-average';
  return 'bav-auspicious';
}
function bavFillColor(score) {
  if (score <= 3) return '#ffdcdc';
  if (score <= 5) return '#fff6c9';
  return '#d9f2d9';
}
const BAV_CIRCLE_COLORS = { fill: '#ffffff', stroke: '#555', text: '#333' };

function renderBavAllTable(av, ascSignIndex) {
  const el = document.getElementById('bavAllTableOutput');
  const houseHeaders = Array.from({ length: 12 }, (_, i) => `<th>H${i + 1}</th>`).join('');
  const rows = AV_PLANETS.map(name => {
    const byHouse = new Array(12);
    for (let signIndex = 0; signIndex < 12; signIndex++) {
      byHouse[houseNumberForSign(signIndex, ascSignIndex) - 1] = av.bav[name][signIndex];
    }
    const cells = byHouse.map(v => `<td class="${bavStrengthClass(v)}">${v}</td>`).join('');
    return `<tr><td>${name}</td>${cells}<td><strong>${byHouse.reduce((a, b) => a + b, 0)}</strong></td></tr>`;
  }).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>Planet</th>${houseHeaders}<th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderBavAllCharts(av) {
  const el = document.getElementById('bavAllChartOutput');
  el.innerHTML = '';
  if (!state.chart) return;
  const layout = document.getElementById('bavAllChartLayout').value;
  const { planets, ascendant } = state.chart;

  el.innerHTML = AV_PLANETS.map((name, i) => {
    const scores = av.bav[name];
    const borderClass = borderClassForIndex(i);
    if (layout === 'south') {
      const d1BySign = buildD1ChartData(planets);
      return renderSouthIndianChart(`${name} Bhinnashtakavarga`, d1BySign, scores, borderClass,
        sign => bavStrengthClass(scores[SIGNS.indexOf(sign)]), 'bav-score-circle');
    }
    const d1ByHouse = buildD1NorthIndian(planets, ascendant.longitude);
    return renderNorthIndianChart(`${name} Bhinnashtakavarga`, d1ByHouse, scores, borderClass,
      signIndex => bavFillColor(scores[signIndex]), BAV_CIRCLE_COLORS);
  }).join('');
}

function renderBavAllTab() {
  if (!state.chart) {
    document.getElementById('bavAllTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('bavAllChartOutput').innerHTML = '';
    return;
  }
  const { planets, ascendant } = state.chart;
  const av = computeAshtakvarga(planets, ascendant.longitude);
  state.ashtakvarga = av;
  renderBavAllTable(av, av.ascendantSignIndex);
  renderBavAllCharts(av);
}

// --- Yogas ---

function yogaRowClass(row) {
  if (!row.present) return 'yoga-row-medium';
  return row.polarity === 'good' ? 'yoga-row-good' : 'yoga-row-bad';
}

function renderYogasTable(yogaResult) {
  const el = document.getElementById('yogasTableOutput');
  const rows = yogaResult.rows.map(r => `
    <tr class="${yogaRowClass(r)}">
      <td>${r.name}</td>
      <td>${r.howDerived}</td>
      <td>${r.meaning}</td>
      <td>${r.present ? 'Yes' : 'No'}</td>
      <td><strong>${r.magnitude}</strong></td>
      <td>${r.present ? r.details : '—'}</td>
    </tr>`).join('');
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Yoga</th><th>How It's Derived</th><th>What It Means</th><th>Present</th><th>Magnitude</th><th>Details (this chart)</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderYogasTab() {
  if (!state.chart) {
    document.getElementById('yogasTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  const yogaResult = state.yogas || computeYogas(state.chart.planets, state.chart.ascendant);
  renderYogasTable(yogaResult);
}

// --- Vimshottari Dasha: 4-level drill-down (MD -> AD -> PD -> SD) ---
// state.dashaSelection = { antarIndex, pratyIndex } — which AD/PD is
// currently drilled into (cleared on a fresh Generate Chart). Each level's
// column is independently re-rendered; selecting a row in one column
// populates the next column and clears any deeper selection.

const DASHA_LEVEL_LABELS = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma Dasha'];

function formatDashaDateTime(date) {
  const tz = (state.chart && state.chart.birthTimeZoneInfo) || null;
  if (tz && tz.mode === 'iana') {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz.zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
      return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
    } catch (e) { /* fall through to UTC-based formatting below */ }
  }
  if (tz && tz.mode === 'offset' && typeof tz.offsetMinutes === 'number') {
    const shifted = new Date(date.getTime() + tz.offsetMinutes * 60000);
    return shifted.toISOString().slice(0, 16).replace('T', ' ');
  }
  return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

function formatAge(age) {
  return `${age.years}y ${age.months}m ${age.days}d`;
}

function formatDuration(years) {
  const totalDays = Math.round(years * 365.25);
  const y = Math.floor(totalDays / 365.25);
  const remDays = Math.round(totalDays - y * 365.25);
  const m = Math.floor(remDays / 30.44);
  const d = Math.round(remDays - m * 30.44);
  return `${y}y ${m}m ${d}d`;
}

// Renders one drill-down column (a <table>) for one dasha level.
// periods: array of {lord, years, startDate, endDate}.
// onRowClick(index): called when a row is clicked (ignored for the deepest level).
function renderDashaColumn(containerId, levelLabel, periods, selectedIndex, onRowClick) {
  const container = document.getElementById(containerId);
  if (!periods || !periods.length) { container.innerHTML = ''; return; }
  const currentIndex = findCurrentIndex(periods);
  const rows = periods.map((p, i) => {
    const classes = [];
    if (i === selectedIndex) classes.push('dasha-selected');
    else if (i === currentIndex) classes.push('dasha-current');
    const clickable = onRowClick ? ' class="dasha-clickable"' : '';
    return `
      <tr class="${classes.join(' ')}" data-index="${i}">
        <td${clickable}><a href="#" class="dasha-lord-link" data-index="${i}">${p.lord}</a></td>
        <td>${formatDashaDateTime(p.startDate)}</td>
        <td>${formatAge(ageAt(state.chart.birthUtc, p.startDate))}</td>
        <td>${formatDuration(p.years)}</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <h4>${levelLabel}</h4>
    <table class="dasha-column-table">
      <thead><tr><th>Lord</th><th>Start (birth time zone)</th><th>Age at Start</th><th>Duration</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  if (onRowClick) {
    container.querySelectorAll('.dasha-lord-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        onRowClick(Number(link.dataset.index));
      });
    });
  }
}

function renderDashaColumns() {
  const mahadashas = state.dasha;
  const sel = state.dashaSelection || {};

  renderDashaColumn('dashaColumnMD', 'Mahadasha (MD)', mahadashas, sel.mahaIndex, (i) => {
    state.dashaSelection = { mahaIndex: i };
    renderDashaColumns();
  });

  const selectedMaha = sel.mahaIndex !== undefined ? mahadashas[sel.mahaIndex] : null;
  renderDashaColumn('dashaColumnAD', 'Antardasha (AD)', selectedMaha ? selectedMaha.antardashas : null, sel.antarIndex, (i) => {
    state.dashaSelection = { mahaIndex: sel.mahaIndex, antarIndex: i };
    renderDashaColumns();
  });

  const selectedAntar = selectedMaha && sel.antarIndex !== undefined ? selectedMaha.antardashas[sel.antarIndex] : null;
  const pratyantardashas = selectedAntar ? buildSubPeriods(selectedAntar.lord, selectedAntar.years, selectedAntar.startDate) : null;
  renderDashaColumn('dashaColumnPD', 'Pratyantardasha (PD)', pratyantardashas, sel.pratyIndex, (i) => {
    state.dashaSelection = { mahaIndex: sel.mahaIndex, antarIndex: sel.antarIndex, pratyIndex: i };
    renderDashaColumns();
  });

  const selectedPraty = pratyantardashas && sel.pratyIndex !== undefined ? pratyantardashas[sel.pratyIndex] : null;
  const sookshmaDashas = selectedPraty ? buildSubPeriods(selectedPraty.lord, selectedPraty.years, selectedPraty.startDate) : null;
  renderDashaColumn('dashaColumnSD', 'Sookshma Dasha (SD)', sookshmaDashas, null, null);
}

function renderDashaTab() {
  if (!state.chart) {
    document.getElementById('dashaTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  if (!state.dasha) {
    state.dasha = computeVimshottariDasha(state.chart.planets.find(p => p.name === 'Moon').longitude, state.chart.birthUtc);
  }
  if (!state.dashaSelection) state.dashaSelection = {};
  document.getElementById('dashaTableOutput').innerHTML = `
    <p style="font-size:0.85em;color:#555;">Click a planet name to drill into its sub-periods. Orange = currently running (as of today); yellow = your selection.</p>
    <div class="dasha-columns">
      <div id="dashaColumnMD" class="dasha-column"></div>
      <div id="dashaColumnAD" class="dasha-column"></div>
      <div id="dashaColumnPD" class="dasha-column"></div>
      <div id="dashaColumnSD" class="dasha-column"></div>
    </div>`;
  renderDashaColumns();
}

// --- Interpretation-2 (reference spec, static content) ---

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderRuleTabulationTable(rows, headers) {
  const head = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  const body = rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
  return `<table class="interp2-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function renderInterpretation2Tab() {
  const el = document.getElementById('interpretation2Output');
  if (!el) return;

  const futureTopicsHtml = INTERPRETATION2_FUTURE_TOPICS
    .map(([title, note]) => `<li><strong>${escapeHtml(title)}</strong> — ${escapeHtml(note)}</li>`)
    .join('');

  el.innerHTML = `
    <p>${escapeHtml(INTERPRETATION2_INTRO.trim())}</p>
    <div class="interp2-note">${escapeHtml(INTERPRETATION2_ACCURACY_NOTE.trim())}</div>

    <h3>1. System Prompt (for an LLM-based interpretation engine)</h3>
    <div class="interp2-pre">${escapeHtml(INTERPRETATION2_SYSTEM_PROMPT)}</div>

    <h3>2. Expected Input Schema (example)</h3>
    <div class="interp2-pre">${escapeHtml(INTERPRETATION2_INPUT_SCHEMA)}</div>

    <h3>3. Suggested Per-Topic Call Structure</h3>
    <p>${escapeHtml(INTERPRETATION2_CALL_STRUCTURE.trim())}</p>

    <h3>4. Topics Worth Adding Later</h3>
    <ul>${futureTopicsHtml}</ul>

    <h3>5. Rule Taxonomy Workbook — Category Summary</h3>
    ${renderRuleTabulationTable(
      RULE_TABULATION_SUMMARY.map(([cat, count, type]) => [cat, count, type]),
      ['Category', 'Rule Count', 'Core / Optional']
    )}
    <p style="font-size:0.85em;color:#555;">
      Core build total: <strong>${RULE_TABULATION_TOTALS.core}</strong> &nbsp;|&nbsp;
      Optional Phase 2 total: <strong>${RULE_TABULATION_TOTALS.optionalPhase2}</strong> &nbsp;|&nbsp;
      Grand total: <strong>${RULE_TABULATION_TOTALS.grandTotal}</strong>
    </p>
    <div class="interp2-note">${escapeHtml(RULE_TABULATION_TOTALS.note)}</div>

    <h3>6. Rule Taxonomy Workbook — Rule Detail</h3>
    ${renderRuleTabulationTable(
      RULE_TABULATION_DETAIL.map(([n, cat, sub, count, type, notes]) => [n, cat, sub, count, type, notes || '']),
      ['#', 'Category', 'Subcategory', 'Rule Count', 'Type', 'Notes']
    )}

    <h3>7. Read Me (workbook)</h3>
    <div class="interp2-pre">${escapeHtml(RULE_TABULATION_READ_ME.trim())}</div>
  `;
}

function classFor(label) {
  if (label === 'Yogakaraka') return 'rule-flag-yogakaraka';
  if (label === 'Functional Benefic') return 'rule-flag-benefic';
  if (label === 'Functional Malefic' || label.indexOf('Natural Malefic') === 0) return 'rule-flag-malefic';
  return 'rule-flag-neutral';
}

function renderRuleEngineTab() {
  const el = document.getElementById('ruleEngineOutput');
  if (!el) return;
  if (!state.chart) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  const r = computeRuleEngine(state.chart);

  const dignityExtraHtml = r.dignityExtra.filter(d => d.notes.length).length
    ? r.dignityExtra.filter(d => d.notes.length).map(d => `<div class="rule-item quality-good"><strong>${d.planet}</strong>: ${d.notes.join(' ')}</div>`).join('')
    : '<div class="rule-item">No Vargottama or Dig Bala placements in this chart.</div>';

  const degreeHtml = r.degreeSensitive.length
    ? r.degreeSensitive.map(d => `<div class="rule-item ${d.gandanta ? 'quality-bad' : 'quality-neutral'}"><strong>${d.planet}</strong>: ${d.notes.join(' ')}</div>`).join('')
    : '<div class="rule-item">No planet is within 1° of a sign boundary in this chart.</div>';

  const conjRelationQuality = { Friend: 'quality-good', Enemy: 'quality-bad', Neutral: 'quality-neutral' };
  const conjPairsHtml = r.conjunctions.pairTexts.length
    ? r.conjunctions.pairTexts.map(c => `<div class="rule-item ${conjRelationQuality[c.relation] || ''}">${escapeHtml(c.text)}</div>`).join('')
    : '<div class="rule-item">No planet-to-planet conjunctions (same sign) in this chart.</div>';
  const stelliumHtml = r.conjunctions.stelliums.map(s => `<div class="rule-item quality-neutral">${escapeHtml(s.text)}</div>`).join('');
  const yuddhaHtml = r.conjunctions.yuddha.map(y => `<div class="rule-item quality-neutral">${escapeHtml(y.text)}</div>`).join('');

  const aspectHtml = r.aspects.length
    ? r.aspects.map(a => `<div class="rule-item ${a.natural === 'benefic' ? 'quality-good' : 'quality-bad'}">${escapeHtml(a.text)}</div>`).join('')
    : '<div class="rule-item">No aspects (graha drishti) land on any planet in this chart.</div>';

  const functionalQuality = (label) => {
    if (label === 'Yogakaraka' || label === 'Functional Benefic') return 'quality-good';
    if (label === 'Functional Malefic' || label.indexOf('Natural Malefic') === 0) return 'quality-bad';
    return 'quality-neutral';
  };
  const functionalHtml = Object.entries(r.functional).map(([name, f]) =>
    `<div class="rule-item ${functionalQuality(f.label)}"><span class="${classFor(f.label)}">${escapeHtml(f.label)}</span> — ${escapeHtml(f.text)}</div>`
  ).join('');

  const nakshatraHtml = r.nakshatra.map(n => `<div class="rule-item">${escapeHtml(n.text)}</div>`).join('');

  const neechaHtml = r.neechaBhanga.length
    ? r.neechaBhanga.map(n => `<div class="rule-item ${n.conditionsMet.length ? 'quality-good' : 'quality-bad'}">${escapeHtml(n.text)}</div>`).join('')
    : '<div class="rule-item">No debilitated planets in this chart, so no Neecha Bhanga check applies.</div>';

  el.innerHTML = `
    <div class="rule-section"><h4>Vargottama &amp; Dig Bala</h4>${dignityExtraHtml}</div>
    <div class="rule-section"><h4>Degree-Sensitive Conditions (0&deg;/29&deg;/Gandanta)</h4>${degreeHtml}</div>
    <div class="rule-section"><h4>Conjunctions (Yuti)</h4>${conjPairsHtml}${stelliumHtml}${yuddhaHtml}</div>
    <div class="rule-section"><h4>Aspects (Drishti)</h4>${aspectHtml}</div>
    <div class="rule-section"><h4>Functional Benefic/Malefic Classification (by ${escapeHtml(state.chart.ascendant.sign)} Lagna)</h4>${functionalHtml}</div>
    <div class="rule-section"><h4>Nakshatra Character</h4>${nakshatraHtml}</div>
    <div class="rule-section"><h4>Neecha Bhanga (Debilitation Cancellation) Check</h4>${neechaHtml}</div>
  `;
}

// --- Sade Sati ---

let sadeSatiCountdownTimer = null;

function formatCountdown(msRemaining) {
  if (msRemaining <= 0) return '0d 0h 0m 0s';
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function tickSadeSatiCountdowns() {
  const now = new Date();
  const ongoingEl = document.getElementById('sadeSatiCountdownOngoing');
  const nextEl = document.getElementById('sadeSatiCountdownNext');
  if (ongoingEl) {
    const endTime = Number(ongoingEl.dataset.endTime);
    ongoingEl.textContent = formatCountdown(endTime - now.getTime());
  }
  if (nextEl) {
    const startTime = Number(nextEl.dataset.startTime);
    nextEl.textContent = formatCountdown(startTime - now.getTime());
  }
}

function renderSadeSatiPhaseTable(segments) {
  const rows = segments.map(seg => {
    const startAge = formatAge(ageAt(state.chart.birthUtc, seg.start));
    const endAge = formatAge(ageAt(state.chart.birthUtc, seg.end));
    const duration = durationBetweenSS(seg.start, seg.end);
    const aspectText = seg.aspectingPlanets.length
      ? seg.aspectingPlanets.map(a => `${a.name} (${a.natural})`).join(', ')
      : 'None';
    return `
      <tr class="quality-${seg.quality}">
        <td>${escapeHtml(seg.phaseLabel)}</td>
        <td>${seg.sign}</td>
        <td>${formatDashaDateTime(seg.start)}<br><span style="font-size:0.85em;color:#555;">age ${startAge}</span></td>
        <td>${formatDashaDateTime(seg.end)}<br><span style="font-size:0.85em;color:#555;">age ${endAge}</span></td>
        <td>${formatAge(duration)}</td>
        <td>House ${seg.houseFromLagna} from Lagna — ${escapeHtml(seg.houseFromLagnaTheme.title)}: ${escapeHtml(seg.houseFromLagnaTheme.description)}</td>
        <td>${aspectText}</td>
        <td style="text-transform:capitalize;">${seg.quality} (${seg.qualityScore >= 0 ? '+' : ''}${seg.qualityScore})</td>
      </tr>`;
  }).join('');
  return `
    <table>
      <thead><tr><th>Phase</th><th>Saturn Sign</th><th>Start (age)</th><th>End (age)</th><th>Duration</th><th>House-from-Lagna Affected</th><th>Aspecting Natal Planets</th><th>Quality</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderSadeSatiTab() {
  const el = document.getElementById('sadeSatiOutput');
  if (!el) return;
  if (sadeSatiCountdownTimer) { clearInterval(sadeSatiCountdownTimer); sadeSatiCountdownTimer = null; }
  if (!state.chart) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  if (state.sadeSati) {
    renderSadeSatiContent(el, state.sadeSati);
    return;
  }
  el.innerHTML = '<p>Computing Saturn\'s transit timeline (~80 years of scanning) — this takes a few seconds…</p>';
  setTimeout(() => {
    state.sadeSati = computeSadeSati(state.chart, 80);
    renderSadeSatiContent(el, state.sadeSati);
  }, 20);
}

function renderSadeSatiContent(el, result) {
  const methodRows = SADE_SATI_METHOD_TABLE.slice(1).map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
  const methodHeader = SADE_SATI_METHOD_TABLE[0].map(h => `<th>${escapeHtml(h)}</th>`).join('');

  let countdownHtml = '';
  if (result.ongoing) {
    const endTime = result.ongoing.end.getTime();
    countdownHtml += `
      <div class="countdown-box countdown-ongoing">
        <div class="countdown-label">Ongoing Sade Sati ends in</div>
        <div class="countdown-value" id="sadeSatiCountdownOngoing" data-end-time="${endTime}">${formatCountdown(endTime - Date.now())}</div>
      </div>`;
  }
  if (result.next) {
    const startTime = result.next.start.getTime();
    countdownHtml += `
      <div class="countdown-box countdown-next">
        <div class="countdown-label">${result.ongoing ? 'Next Sade Sati (after this one) starts in' : 'Next Sade Sati starts in'}</div>
        <div class="countdown-value" id="sadeSatiCountdownNext" data-start-time="${startTime}">${formatCountdown(startTime - Date.now())}</div>
      </div>`;
  }
  if (!result.ongoing && !result.next) {
    countdownHtml = '<p>No ongoing or upcoming Sade Sati found within the computed ~80-year window.</p>';
  }

  const overviewRows = result.episodes.map(ep => `
    <tr>
      <td>${ep.index + 1}</td>
      <td><span class="status-badge status-badge-${ep.status}">${ep.status}</span></td>
      <td>${formatDashaDateTime(ep.start)}<br><span style="font-size:0.85em;color:#555;">age ${formatAge(ep.startAge)}</span></td>
      <td>${formatDashaDateTime(ep.end)}<br><span style="font-size:0.85em;color:#555;">age ${formatAge(ep.endAge)}</span></td>
      <td>${formatAge(ep.duration)}</td>
    </tr>`).join('');

  const episodeDetailHtml = result.episodes.map(ep => `
    <div class="sadesati-episode-header">Episode ${ep.index + 1} — <span class="status-badge status-badge-${ep.status}">${ep.status}</span></div>
    ${renderSadeSatiPhaseTable(ep.segments)}
  `).join('');

  el.innerHTML = `
    <p><strong>Natal Moon sign:</strong> ${result.moonSign} — the 3 Sade Sati signs are ${SIGNS[(result.moonSignIndex + 11) % 12]} (Rising), ${SIGNS[result.moonSignIndex]} (Peak), ${SIGNS[(result.moonSignIndex + 1) % 12]} (Setting).</p>
    <p style="font-size:0.85em;color:#555;">Good time is highlighted <span style="background:#d9f2d9;padding:1px 6px;">light green</span>, neutral <span style="background:#fff3d6;padding:1px 6px;">light yellow</span>, bad <span style="background:#ffdcdc;padding:1px 6px;">light red</span>.</p>

    <h3>Countdown</h3>
    ${countdownHtml}

    <h3>Episode Overview</h3>
    <table>
      <thead><tr><th>#</th><th>Status</th><th>Start (age)</th><th>End (age)</th><th>Duration</th></tr></thead>
      <tbody>${overviewRows || '<tr><td colspan="5">No Sade Sati episode found in the computed window.</td></tr>'}</tbody>
    </table>

    <h3>Phase Detail</h3>
    ${episodeDetailHtml || '<p>No Sade Sati episode found in the computed window.</p>'}

    <h3>How This Interpretation Was Arrived At</h3>
    <table>
      <thead><tr>${methodHeader}</tr></thead>
      <tbody>${methodRows}</tbody>
    </table>
  `;

  if (sadeSatiCountdownTimer) clearInterval(sadeSatiCountdownTimer);
  sadeSatiCountdownTimer = setInterval(tickSadeSatiCountdowns, 1000);
}

// --- Mangal Dosha (Extended) ---

function renderMangalDosha2Tab() {
  const el = document.getElementById('mangalDosha2Output');
  if (!el) return;
  if (!state.chart || !state.mangalDosha2) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  const r = state.mangalDosha2;

  const refRows = r.references.map(ref => `
    <tr class="${ref.hasDosha ? (ref.severityPercent >= 50 ? 'quality-bad' : 'quality-neutral') : 'quality-good'}">
      <td>${escapeHtml(ref.referenceLabel)}</td>
      <td>House ${ref.house} (${ref.marsSign})</td>
      <td>${ref.hasDosha ? 'Yes' : 'No'}</td>
      <td>${ref.severityPercent}%</td>
      <td>${ref.factors.map(escapeHtml).join('<br>')}</td>
    </tr>`).join('');

  const neutralizationHtml = r.neutralizationNotes.map(n => `<div class="rule-item">${escapeHtml(n)}</div>`).join('');

  const remedyRows = MANGAL_DOSHA2_REMEDIES.map(rem => `<tr><td><strong>${escapeHtml(rem.title)}</strong></td><td>${escapeHtml(rem.text)}</td></tr>`).join('');

  el.innerHTML = `
    <p><strong>Mars:</strong> ${r.mars.sign}, House ${r.mars.house} from Lagna.
       <strong>Overall strength:</strong> <span class="strength-badge strength-${r.strengthLabel}">${r.strengthLabel}</span>
       (${r.count} of 3 reference points show a dosha; combined severity ${r.combinedSeverity}%, in multiples of 5).</p>

    <h3>1. How It Has Been Derived</h3>
    <table>
      <thead><tr><th>Reference Point</th><th>Mars's Placement</th><th>Dosha?</th><th>Severity</th><th>Factors</th></tr></thead>
      <tbody>${refRows}</tbody>
    </table>

    <h3>2. Scoring of Strength (multiples of 5)</h3>
    <p>Each reference point's severity is built from a base value per house (8th=100, 7th=90, 4th/12th=60, 2nd=50, 1st=40) — always a multiple of 5 — then reduced by fixed multiples of 5 for each mitigating factor present (see table above). The combined severity (${r.combinedSeverity}%) is the average of the severities from reference points showing a dosha, rounded to the nearest multiple of 5. Overall strength label: <strong>${r.strengthLabel}</strong> (None/Mild/Moderate/Strong, based on how many of the 3 reference points show a dosha).</p>

    <h3>3. Neutralization</h3>
    ${neutralizationHtml || '<div class="rule-item">No specific neutralization factors apply.</div>'}

    <h3>4. Remedies (traditional, faith-based — not a substitute for professional or matrimonial counsel)</h3>
    <table>
      <thead><tr><th>Remedy</th><th>Description</th></tr></thead>
      <tbody>${remedyRows}</tbody>
    </table>
  `;
}

// --- Shadbala ---

function sbNum(n, digits) { return Number(n).toFixed(digits === undefined ? 2 : digits); }

function renderShadbalaOverviewTiles(shadbala) {
  return `<div class="sb-overview-grid">${SHADBALA_PLANETS.map(name => {
    const r = shadbala.planets[name];
    const pct = Math.min(100, (r.ratio) * 100);
    return `
      <div class="sb-overview-tile">
        <div class="sb-tile-planet">${name}</div>
        <div style="font-size:0.85em;">${sbNum(r.totalRupa)} Rupa</div>
        <div class="sb-bar-track"><div class="sb-bar-fill" style="width:${Math.min(100, pct)}%;"></div></div>
        <div class="sb-strength-${r.strength.replace(/ /g, '-')}" style="font-size:0.85em;">${r.strength}</div>
        <div style="font-size:0.75em;color:#777;">Rank ${r.rank}/7</div>
      </div>`;
  }).join('')}</div>`;
}

function renderShadbalaComparisonTable(shadbala, functional, sortBy) {
  let rows = SHADBALA_PLANETS.map(name => {
    const r = shadbala.planets[name];
    return { name, r, natural: NATURAL_BENEFICS.includes(name) ? 'Benefic' : 'Malefic', functionalLabel: functional[name].label };
  });
  const sorters = {
    rank: (a, b) => a.r.rank - b.r.rank,
    ratio: (a, b) => b.r.ratio - a.r.ratio,
    name: (a, b) => a.name.localeCompare(b.name),
    natural: (a, b) => a.natural.localeCompare(b.natural) || a.r.rank - b.r.rank,
    functional: (a, b) => a.functionalLabel.localeCompare(b.functionalLabel) || a.r.rank - b.r.rank
  };
  rows = rows.sort(sorters[sortBy] || sorters.rank);
  const body = rows.map(({ name, r, natural, functionalLabel }) => `
    <tr>
      <td>${name}</td>
      <td>${sbNum(r.totalRupa)}</td>
      <td>${r.requiredRupa}</td>
      <td>${sbNum(r.ratio)}</td>
      <td>${r.rank}</td>
      <td class="sb-strength-${r.strength.replace(/ /g, '-')}">${r.strength}</td>
      <td>${natural}</td>
      <td>${escapeHtml(functionalLabel)}</td>
    </tr>`).join('');
  return `
    <table>
      <thead><tr><th>Planet</th><th>Total (Rupa)</th><th>Required Min.</th><th>Ratio</th><th>Rank</th><th>Overall Strength</th><th>Natural</th><th>Functional</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
}

function renderShadbalaComponentTable(r) {
  const rows = [
    ['Sthana Bala', r.sthana.total],
    ['Dig Bala', r.dig.value],
    ['Kala Bala', r.kala.total],
    ['Cheshta Bala', r.cheshta.value],
    ['Naisargika Bala', r.naisargika.value],
    ['Drik Bala', r.drik.total]
  ];
  const body = rows.map(([label, value]) => `
    <tr>
      <td>${label}</td>
      <td>${sbNum(value)}</td>
      <td>${r.totalVirupa ? sbNum(value / r.totalVirupa * 100, 1) : '0'}%</td>
      <td>${value >= r.totalVirupa * 0.25 ? 'Strong' : value >= r.totalVirupa * 0.12 ? 'Moderate' : 'Weak'}</td>
    </tr>`).join('');
  return `
    <table class="sb-component-table">
      <thead><tr><th>Component</th><th>Value (virupa)</th><th>% of Total</th><th>Assessment</th></tr></thead>
      <tbody>${body}
        <tr><td><strong>Total</strong></td><td><strong>${sbNum(r.totalVirupa)} v (${sbNum(r.totalRupa)} Rupa)</strong></td><td><strong>100%</strong></td><td><strong>${r.strength}</strong></td></tr>
      </tbody>
    </table>`;
}

function renderSthanaBalaDetail(sthana) {
  return `
    <table class="sb-component-table">
      <thead><tr><th>Sub-Component</th><th>Value</th><th>Detail</th></tr></thead>
      <tbody>
        <tr><td>Uchcha Bala</td><td>${sbNum(sthana.uchcha.value)}</td><td>${escapeHtml(sthana.uchcha.note || '')}</td></tr>
        <tr><td>Saptavargaja Bala</td><td>${sbNum(sthana.saptavargaja.value)}</td><td>${sthana.saptavargaja.perVarga.map(v => `${v.varga}:${v.sign}(${sbNum(v.points, 1)})`).join(', ')}</td></tr>
        <tr><td>Oja-Yugma Bala</td><td>${sbNum(sthana.ojaYugma.value)}</td><td>Rasi ${sbNum(sthana.ojaYugma.rasiScore, 0)} + Navamsa ${sbNum(sthana.ojaYugma.navamsaScore, 0)}</td></tr>
        <tr><td>Kendradi Bala</td><td>${sbNum(sthana.kendradi.value)}</td><td>${sthana.kendradi.tier}</td></tr>
        <tr><td>Drekkana Bala</td><td>${sbNum(sthana.drekkana.value)}</td><td>Drekkana ${sthana.drekkana.drekkanaIndex} of 3</td></tr>
        <tr><td><strong>Total Sthana Bala</strong></td><td colspan="2"><strong>${sbNum(sthana.total)}</strong></td></tr>
      </tbody>
    </table>`;
}

function renderKalaBalaDetail(kala) {
  return `
    <table class="sb-component-table">
      <thead><tr><th>Sub-Component</th><th>Value</th><th>Detail</th></tr></thead>
      <tbody>
        <tr><td>Nathonnata Bala</td><td>${sbNum(kala.nathonnata.value)}</td><td>${escapeHtml(kala.nathonnata.note || '')}</td></tr>
        <tr><td>Paksha Bala</td><td>${sbNum(kala.paksha.value)}</td><td>Elongation ${sbNum(kala.paksha.elongation, 1)}°</td></tr>
        <tr><td>Tribhaga Bala</td><td>${sbNum(kala.tribhaga.value)}</td><td>${kala.tribhaga.lord ? `Tribhaga ${kala.tribhaga.third} lord: ${kala.tribhaga.lord}` : (kala.tribhaga.note || '')}</td></tr>
        <tr><td>Dina-Hora Bala</td><td>${sbNum(kala.dinaHora.value)}</td><td>Dina lord ${kala.dinaHora.dinaLord}, Hora lord ${kala.dinaHora.horaLord || 'n/a'}</td></tr>
        <tr><td>Ayana Bala</td><td>${sbNum(kala.ayana.value)}</td><td>Declination ${sbNum(kala.ayana.declination, 2)}°${kala.ayana.note ? ' — ' + kala.ayana.note : ''}</td></tr>
        <tr><td>Yuddha Bala</td><td>${sbNum(kala.yuddha.value)}</td><td>${escapeHtml(kala.yuddha.note || 'No planetary war.')}</td></tr>
        <tr><td><strong>Total Kala Bala</strong></td><td colspan="2"><strong>${sbNum(kala.total)}</strong></td></tr>
      </tbody>
    </table>`;
}

function renderDrikBalaDetail(drik) {
  if (!drik.contributions.length) return '<p>No planets aspect this placement — Drik Bala is 0.</p>';
  const rows = drik.contributions.map(c => `<tr><td>${c.from}</td><td>${c.natural}</td><td>${c.value > 0 ? '+' : ''}${c.value}</td></tr>`).join('');
  return `
    <table class="sb-component-table">
      <thead><tr><th>Aspecting Planet</th><th>Influence</th><th>Contribution</th></tr></thead>
      <tbody>${rows}<tr><td colspan="2"><strong>Net Drik Bala</strong></td><td><strong>${drik.total > 0 ? '+' : ''}${drik.total}</strong></td></tr></tbody>
    </table>`;
}

function renderShadbalaPlanetCard(name, shadbala, chart, functional, dashaStrengthLabel, detailed) {
  const r = shadbala.planets[name];
  const planet = chart.planets.find(p => p.name === name);
  const degreeInSign = normalizeDegrees(planet.longitude) % 30;
  const dignityDetail = detailedDignity(name, planet.sign, degreeInSign);
  const dispositorName = SIGN_LORD[planet.sign];
  const dispositorResult = shadbala.planets[dispositorName];
  const interp = buildPlanetInterpretation(r, planet, dignityDetail, functional[name], dispositorName, dispositorResult);
  const impact = buildNativeImpactSynthesis(name, r, dignityDetail, planet, functional[name]);
  const impactClass = impact.direction === 'favorable' ? 'quality-good' : impact.direction === 'unfavorable' ? 'quality-bad' : 'quality-neutral';

  const nakInfo = planet.nakshatra ? NAKSHATRA_TRAITS[planet.nakshatra] : null;
  const nakLord = planet.nakshatra ? NAKSHATRA_TABLE.find(n => n.name === planet.nakshatra).starLord : null;

  const detailBlock = detailed ? `
    <h4>Detailed Calculation</h4>
    ${renderShadbalaComponentTable(r)}
    <h4>Sthana Bala Breakdown</h4>
    ${renderSthanaBalaDetail(r.sthana)}
    <h4>Dig Bala Detail</h4>
    <p>Strong house: ${r.dig.strongHouse}. Distance from its weakest point: ${sbNum(r.dig.distanceFromWeakPoint, 1)}° → ${sbNum(r.dig.value)} virupas.</p>
    <h4>Kala Bala Breakdown</h4>
    ${renderKalaBalaDetail(r.kala)}
    <h4>Cheshta Bala Detail</h4>
    <p>${escapeHtml(r.cheshta.note || '')}</p>
    <h4>Drik Bala Breakdown</h4>
    ${renderDrikBalaDetail(r.drik)}
  ` : `
    <h4>Component Strength</h4>
    ${renderShadbalaComponentTable(r)}
  `;

  return `
    <div class="sb-planet-card" data-planet="${name}">
      <div class="sb-planet-header" onclick="this.parentElement.classList.toggle('expanded')">
        <div><span class="sb-rank-badge">${r.rank}</span><strong>${name}</strong> — ${sbNum(r.totalRupa)} Rupa (req. ${r.requiredRupa}) — <span class="sb-strength-${r.strength.replace(/ /g, '-')}">${r.strength}</span></div>
        <div style="font-size:0.85em;color:#666;">${planet.sign}, House ${planet.house} · Dasha strength: ${dashaStrengthLabel}</div>
      </div>
      <div class="sb-planet-body">
        <p>${interp.summary}</p>
        <h4>How This Affects the Native (Strength + Dignity + House + Role)</h4>
        <div class="rule-item ${impactClass}" style="padding:8px 10px;">${escapeHtml(impact.text)}</div>
        ${detailBlock}
        <h4>Sign, House &amp; Context</h4>
        <table class="sb-component-table">
          <tbody>
            <tr><td>Sign</td><td>${planet.sign} (lord ${SIGN_LORD[planet.sign]})</td></tr>
            <tr><td>Dignity</td><td>${dignityDetail.tier}</td></tr>
            <tr><td>House</td><td>${planet.house} — ${HOUSE_THEMES[Number(planet.house)].title}</td></tr>
            <tr><td>Nakshatra</td><td>${planet.nakshatra || 'n/a'} (pada ${planet.pada || '-'}, lord ${nakLord || '-'})${nakInfo ? ' — ' + escapeHtml(nakInfo.keynote) : ''}</td></tr>
            <tr><td>Dispositor</td><td>${dispositorName} — ${dispositorResult ? `${sbNum(dispositorResult.totalRupa)} Rupa (${dispositorResult.strength})` : 'n/a'}</td></tr>
            <tr><td>Conjunct With</td><td>${(planet.conjunctWith || []).join(', ') || 'None'}</td></tr>
            <tr><td>Aspected By</td><td>${(planet.aspectedBy || []).join(', ') || 'None'}</td></tr>
            <tr><td>Combust</td><td>${planet.combust ? 'Yes' : 'No'}</td></tr>
            <tr><td>Retrograde</td><td>${planet.retrograde ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function shadbalaDashaStrengthLabel(shadbala) {
  if (!state.dasha) return 'n/a';
  const currentIdx = findCurrentIndex(state.dasha);
  if (currentIdx < 0) return 'n/a';
  const maha = state.dasha[currentIdx];
  const antarIdx = findCurrentIndex(maha.antardashas);
  const antar = antarIdx >= 0 ? maha.antardashas[antarIdx] : null;
  const mahaResult = shadbala.planets[maha.lord];
  const antarResult = antar ? shadbala.planets[antar.lord] : null;
  const mahaText = mahaResult ? `MD ${maha.lord}: ${mahaResult.strength}` : `MD ${maha.lord}: n/a`;
  const antarText = antarResult ? `, AD ${antar.lord}: ${antarResult.strength}` : (antar ? `, AD ${antar.lord}: n/a` : '');
  return mahaText + antarText;
}

function renderShadbalaTab() {
  const el = document.getElementById('shadbalaOutput');
  if (!el) return;
  if (!state.chart) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  if (!state.shadbala) {
    el.innerHTML = '<p>Shadbala could not be computed for this chart (see console for details).</p>';
    return;
  }
  const detailed = document.getElementById('shadbalaDetailedToggle').checked;
  const sortBy = document.getElementById('shadbalaSortBy').value;
  const functional = functionalClassification(state.chart.ascendant.sign, state.chart.planets);
  const dashaLabel = shadbalaDashaStrengthLabel(state.shadbala);

  const cards = SHADBALA_PLANETS.map(name => renderShadbalaPlanetCard(name, state.shadbala, state.chart, functional, dashaLabel, detailed)).join('');

  el.innerHTML = `
    <h3>Shadbala Overview</h3>
    ${renderShadbalaOverviewTiles(state.shadbala)}

    <h3>Cross-Planet Comparison</h3>
    ${renderShadbalaComparisonTable(state.shadbala, functional, sortBy)}

    <h3>Per-Planet Detail (click a row to expand)</h3>
    ${cards}
  `;
}

// --- Ashtakvarga Predictions ---

function avpAssessClass(label) { return `assess-${label.replace(/\//g, '-').replace(/ /g, '-')}`; }

function renderAvpDashboard(ashtakvarga) {
  const bavSummary = computePlanetaryBavSummary(ashtakvarga.bav);
  const savSummary = computeSavSummary(ashtakvarga.sav, ashtakvarga.ascendantSignIndex);
  const strongestHouses = [...savSummary.byHouse].sort((a, b) => b.sav - a.sav).slice(0, 3);
  const weakestHouses = [...savSummary.byHouse].sort((a, b) => a.sav - b.sav).slice(0, 3);
  return `
    <table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Total SAV (all 12 signs)</td><td>${savSummary.total}</td></tr>
        <tr><td>Average SAV per house</td><td>${savSummary.average.toFixed(2)}</td></tr>
        <tr><td>Highest SAV</td><td>${savSummary.highest}</td></tr>
        <tr><td>Lowest SAV</td><td>${savSummary.lowest}</td></tr>
        <tr><td>Houses above average</td><td>${savSummary.aboveAverage.map(h => `${h.house} (${h.sign})`).join(', ') || 'None'}</td></tr>
        <tr><td>Houses below average</td><td>${savSummary.belowAverage.map(h => `${h.house} (${h.sign})`).join(', ') || 'None'}</td></tr>
      </tbody>
    </table>
    <p><strong>Strongest houses:</strong> ${strongestHouses.map(h => `House ${h.house} (${h.sign}, SAV ${h.sav})`).join('; ')}. <strong>Weakest houses:</strong> ${weakestHouses.map(h => `House ${h.house} (${h.sign}, SAV ${h.sav})`).join('; ')}. This indicates comparative Ashtakavarga background support — it does not, by itself, guarantee or rule out any life event; the house lord, occupying planets, yogas, dasha and transit must always be assessed alongside it.</p>
    <table>
      <thead><tr><th>Planet</th><th>Strongest Sign(s)</th><th>Weakest Sign(s)</th><th>Own Average</th></tr></thead>
      <tbody>${bavSummary.map(b => `<tr><td>${b.planet}</td><td>${b.strongSigns.map(s => `${s.sign} (${s.value})`).join(', ')}</td><td>${b.weakSigns.map(s => `${s.sign} (${s.value})`).join(', ')}</td><td>${b.average.toFixed(2)}</td></tr>`).join('')}</tbody>
    </table>`;
}

function renderAvpHousePredictions(housePredictions) {
  const rows = housePredictions.map(h => `
    <tr class="${h.comparison === 'above' ? 'quality-good' : h.comparison === 'below' ? 'quality-bad' : 'quality-neutral'}">
      <td>${h.house}</td><td>${h.sign}</td><td>${h.sav}</td><td>${h.comparison}</td><td>${h.houseLordName}</td><td>${h.occupants.join(', ') || 'None'}</td>
      <td>${h.text}<details class="avp-calc"><summary>Show Calculation &amp; Rule</summary><div class="kk-calc-chain">${escapeHtml(h.evidence)}\nRule: AV_RULE_006 (SAV vs. chart average) — Practitioner Technique.</div></details></td>
    </tr>`).join('');
  return `
    <table>
      <thead><tr><th>House</th><th>Sign</th><th>SAV</th><th>vs. Avg</th><th>Lord</th><th>Occupants</th><th>Interpretation</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderAvpShodhana(trails) {
  return trails.map(t => `
    <details class="avp-calc">
      <summary>${t.planet} — Shodhya Pinda ${t.shodhyaPinda} (click to see Trikona + Ekadhipatya Shodhana)</summary>
      <table class="sb-component-table">
        <thead><tr><th>Sign</th>${SIGNS.map(s => `<th>${s.slice(0, 3)}</th>`).join('')}</tr></thead>
        <tbody>
          <tr><td>Original BAV</td>${t.original.map(v => `<td>${v}</td>`).join('')}</tr>
          <tr><td>After Trikona Shodhana</td>${t.afterTrikona.map(v => `<td>${v}</td>`).join('')}</tr>
          <tr><td>After Ekadhipatya Shodhana</td>${t.afterEkadhipatya.map(v => `<td>${v}</td>`).join('')}</tr>
        </tbody>
      </table>
      <p style="font-size:0.85em;color:#555;">Rules: AV_RULE_002 (Trikona Shodhana) and AV_RULE_003 (Ekadhipatya Shodhana) — Classical/Textually Supported. Shodhya Pinda (AV_RULE_004) = sum of the fully-reduced row = ${t.shodhyaPinda}. The additional Rasi-Pinda/Graha-Pinda multiplier some texts add on top of this sum is NOT implemented (AV_RULE_005, labeled Unverified / Do Not Use — see Rule Details tab section below).</p>
    </details>`).join('');
}

function renderAvpLifeArea(synthesis) {
  return `
    <table>
      <tbody>
        <tr><td>Finding</td><td>${escapeHtml(synthesis.finding)}</td></tr>
        <tr><td>Primary Houses</td><td>${synthesis.primaryHouses.join(', ')}</td></tr>
        <tr><td>Supporting Factors</td><td>${synthesis.supporting.join('; ') || 'None'}</td></tr>
        <tr><td>Contradicting Factors</td><td>${synthesis.contradicting.join('; ') || 'None'}</td></tr>
        <tr><td>Interpretation</td><td>${escapeHtml(synthesis.interpretation)}</td></tr>
        <tr><td>Final Assessment</td><td><span class="assess-badge ${avpAssessClass(synthesis.finalAssessment)}">${synthesis.finalAssessment}</span></td></tr>
      </tbody>
    </table>`;
}

function renderAvpTransits(transits) {
  const rows = transits.map(t => `
    <tr class="${t.savComparison === 'above' && t.bav >= 4 ? 'quality-good' : t.savComparison === 'below' && t.bav < 4 ? 'quality-bad' : 'quality-neutral'}">
      <td>${t.planet}</td><td>${t.sign}</td><td>${t.house}</td><td>${t.bav}/8</td><td>${t.sav}</td><td>${t.quadrant}</td>
    </tr>`).join('');
  return `
    <table>
      <thead><tr><th>Planet</th><th>Transit Sign</th><th>House</th><th>Own BAV</th><th>Sign SAV</th><th>BAV+SAV Interaction (AV_RULE_007)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderAvpRuleDatabase() {
  const rows = ASHTAKVARGA_RULE_DATABASE.map(r => `
    <tr><td>${r.id}</td><td>${r.name}</td><td>${r.category}</td><td>${escapeHtml(r.source)}</td><td><strong>${r.reliability}</strong></td><td>${escapeHtml(r.rule)}</td></tr>`).join('');
  return `<table><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Source</th><th>Reliability</th><th>Rule</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderAshtakvargaPredictionsTab() {
  const el = document.getElementById('avpOutput');
  if (!el) return;
  if (!state.chart || !state.ashtakvarga) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  const av = state.ashtakvarga;
  const housePredictions = computeHousePredictions(av, state.chart);
  const trails = computeAllShodhanaTrails(av.bav);
  const lifeArea = document.getElementById('avpLifeAreaSelect').value;
  const synthesis = computeLifeAreaSynthesis(lifeArea, av, state.chart, housePredictions);
  const transits = computeTransitPredictions(av, state.chart, new Date());

  el.innerHTML = `
    <h3>1. Ashtakvarga Dashboard</h3>
    ${renderAvpDashboard(av)}

    <h3>2. House Predictions</h3>
    ${renderAvpHousePredictions(housePredictions)}

    <h3>3. Mathematical Techniques (Trikona &amp; Ekadhipatya Shodhana, Shodhya Pinda)</h3>
    ${renderAvpShodhana(trails)}

    <h3>4. Life-Area Synthesis: ${lifeArea}</h3>
    ${renderAvpLifeArea(synthesis)}

    <h3>5. Current Transit Predictions</h3>
    <p style="font-size:0.85em;color:#555;">Computed for right now (${formatDashaDateTime(new Date())}); reflects only Ashtakavarga support for the transit, not a full transit reading.</p>
    ${renderAvpTransits(transits)}

    <h3>6. Rule Database / Sources</h3>
    ${renderAvpRuleDatabase()}
  `;
}

// --- Kakshya Analysis ---

function kkAssessClass(label) { return `assess-${label.replace(/\//g, '-').replace(/ /g, '-')}`; }

function renderKakshyaGlance(info) {
  return `
    <div class="rule-item ${info.contributes ? 'quality-good' : 'quality-bad'}" style="padding:10px;">
      <strong>WHAT IS HAPPENING NOW? — ${info.planet}</strong><br>
      Transit sign: ${info.sign} &nbsp; Degree: ${sbNum(info.degInSign, 2)}° &nbsp; Current Kakshya: ${info.kakshyaNumber} (${info.kakshyaRange})<br>
      Kakshya lord: ${info.kakshyaLord} &nbsp; Contribution to this sign: ${info.contributes === null ? 'n/a' : (info.contributes ? 'Yes' : 'No')}<br>
      Activated natal house: ${info.house} (${info.houseTheme.title})<br>
      <span class="assess-badge ${kkAssessClass(info.assessment)}">${info.assessment}</span><br>
      <span style="font-size:0.9em;">Simple interpretation: this is a relatively ${info.assessment.toLowerCase().includes('challeng') ? 'challenging' : info.assessment === 'Mixed' ? 'mixed' : 'supportive'} micro-period for matters connected with House ${info.house} (${info.houseTheme.description}), subject to the natal chart, dasha, and the larger transit.</span>
      <details class="avp-calc"><summary>Show Calculation &amp; Rule</summary>
        <div class="kk-calc-chain">Longitude ${sbNum(info.longitude, 4)}°
→ Sign ${info.sign}
→ Degree in sign ${sbNum(info.degInSign, 4)}°
→ Kakshya ${info.kakshyaNumber} (${info.kakshyaRange})
→ Kakshya lord ${info.kakshyaLord}
→ ${info.kakshyaLord}'s natal position used as BAV contributor reference
→ Contribution to ${info.sign} in ${info.planet}'s own Bhinnashtakavarga: ${info.contributes === null ? 'n/a' : info.contributes}
→ ${info.planet}'s total BAV in ${info.sign}: ${info.bavTotal}/8 (own avg ${sbNum(info.bavAverage, 2)})
→ SAV of ${info.sign}: ${info.sav} (chart avg ${sbNum(info.savAverage, 2)})
→ Natal house activated: ${info.house}
→ Rule: AV_RULE_007-style synthesis (Practitioner Technique) — see Ashtakvarga Predictions tab's Rule Database
→ Final synthesis: ${info.assessment}</div>
      </details>
    </div>`;
}

function renderKakshyaCurrentMatrix(chart, ashtakvarga) {
  const now = new Date();
  const rows = SHADBALA_PLANETS.map(name => {
    const info = computeKakshyaInfo(name, now, chart, ashtakvarga);
    return `<tr class="${kkAssessClass(info.assessment)}"><td>${name}</td><td>${info.sign}</td><td>${sbNum(info.degInSign, 2)}°</td><td>${info.kakshyaNumber}</td><td>${info.kakshyaLord}</td><td>${info.bavTotal}</td><td>${info.sav}</td><td>${info.house}</td><td><span class="assess-badge ${kkAssessClass(info.assessment)}">${info.assessment}</span></td></tr>`;
  }).join('');
  return `<table><thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Kakshya</th><th>Lord</th><th>BAV</th><th>SAV</th><th>House</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderKakshyaMasterMatrix(planetName, chart, ashtakvarga) {
  const now = new Date();
  const currentInfo = computeKakshyaInfo(planetName, now, chart, ashtakvarga);
  const signIndex = currentInfo.signIndex;
  const rows = KAKSHYA_RANGES.map(k => {
    const contributorNatalSignIndex = k.lord === 'Lagna' ? ashtakvarga.ascendantSignIndex : (chart.planets.find(p => p.name === k.lord) ? SIGNS.indexOf(chart.planets.find(p => p.name === k.lord).sign) : null);
    const table = ASHTAKVARGA_TABLES[planetName];
    let contributes = null;
    if (table && contributorNatalSignIndex !== null) {
      const count = ((signIndex - contributorNatalSignIndex + 12) % 12) + 1;
      contributes = table[k.lord].includes(count);
    }
    const isCurrent = k.number === currentInfo.kakshyaNumber;
    return `<tr class="${isCurrent ? 'quality-neutral' : ''}"><td>${k.number}${isCurrent ? ' (current)' : ''}</td><td>${k.rangeText}</td><td>${k.lord}</td><td>${contributes === null ? 'n/a' : (contributes ? 'Yes' : 'No')}</td><td>${currentInfo.bavTotal}</td><td>${currentInfo.sav}</td><td>${contributes ? 'Supported' : 'Not supported'}</td></tr>`;
  }).join('');
  return `<p>Current sign: <strong>${currentInfo.sign}</strong> (House ${currentInfo.house})</p><table><thead><tr><th>#</th><th>Degree Range</th><th>Kakshya Lord</th><th>Relevant BAV Contribution</th><th>Total BAV</th><th>SAV</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// Hour-by-hour Kakshya for "today" (the current UTC calendar day) — useful
// for same-day/muhurta-style timing, where the fastest-moving planets
// (chiefly the Moon, ~1 Kakshya every ~7 hours) can change Kakshya more
// than once within a single day; the Timeline tab's day/week/month
// resolution is too coarse to show this. Not meaningful as a matrix
// resolution (most planets barely move hour-to-hour) — see chat discussion.
function renderKakshyaHourByHour(planetName, chart, ashtakvarga) {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const rows = [];
  for (let h = 0; h < 24; h++) {
    const d = new Date(dayStart.getTime() + h * 3600000);
    const info = computeKakshyaInfo(planetName, d, chart, ashtakvarga);
    const isCurrentHour = now >= d && now < new Date(d.getTime() + 3600000);
    rows.push({ hour: h, date: d, info, isCurrentHour });
  }
  // Merge consecutive hours with the same Kakshya into one row, so a slow
  // planet (Saturn, Jupiter) shows one wide block instead of 24 identical rows.
  const merged = [];
  rows.forEach(r => {
    const prev = merged[merged.length - 1];
    if (prev && prev.info.kakshyaNumber === r.info.kakshyaNumber && prev.info.sign === r.info.sign) {
      prev.endHour = r.hour;
      prev.containsCurrentHour = prev.containsCurrentHour || r.isCurrentHour;
    } else {
      merged.push({ startHour: r.hour, endHour: r.hour, info: r.info, containsCurrentHour: r.isCurrentHour });
    }
  });

  const bodyRows = merged.map(m => {
    const startLabel = `${String(m.startHour).padStart(2, '0')}:00`;
    const endLabel = `${String((m.endHour + 1) % 24).padStart(2, '0')}:00`;
    return `
      <tr class="${kkAssessClass(m.info.assessment)} ${m.containsCurrentHour ? 'kk-current-hour' : ''}">
        <td>${startLabel}–${endLabel} UTC${m.containsCurrentHour ? ' (now)' : ''}</td>
        <td>${m.info.sign}</td><td>${sbNum(m.info.degInSign, 2)}°</td>
        <td>${m.info.kakshyaNumber}</td><td>${m.info.kakshyaLord}</td>
        <td>${m.info.contributes === null ? 'n/a' : (m.info.contributes ? 'Yes' : 'No')}</td>
        <td>${m.info.bavTotal}</td><td>${m.info.sav}</td><td>${m.info.house}</td>
        <td><span class="assess-badge ${kkAssessClass(m.info.assessment)}">${m.info.assessment}</span></td>
      </tr>`;
  }).join('');

  return `
    <p style="font-size:0.85em;color:#555;">Today (${dayStart.toISOString().slice(0, 10)}, UTC hours), for ${planetName}. Consecutive hours in the same Kakshya are merged into one block — a slow planet (Saturn, Jupiter) may show only 1-2 blocks all day, while the Moon typically shows 3-4.</p>
    <table><thead><tr><th>Hours</th><th>Sign</th><th>Degree</th><th>Kakshya</th><th>Lord</th><th>Contribution</th><th>BAV</th><th>SAV</th><th>House</th><th>Status</th></tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function renderKakshyaTimeline(planetName, chart, ashtakvarga) {
  const timeline = computeSignKakshyaTimeline(planetName, new Date(), chart, ashtakvarga);
  const rows = timeline.segments.map(seg => `
    <tr>
      <td>${seg.kakshyaNumber}</td><td>${seg.lord}</td>
      <td>${formatDashaDateTime(seg.start)}</td><td>${formatDashaDateTime(seg.end)}</td>
      <td>${formatAge(durationBetweenSS(seg.start, seg.end))}</td>
    </tr>`).join('');
  return `<p>Full passage of ${planetName} through ${timeline.sign} (entry ${formatDashaDateTime(timeline.signEntry)}, exit ${formatDashaDateTime(timeline.signExit)}):</p>
    <table><thead><tr><th>Kakshya</th><th>Lord</th><th>Entry</th><th>Exit</th><th>Duration</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderKakshyaDictionary() {
  const dict = [
    ['BAV', 'Planet-specific Ashtakavarga support'],
    ['SAV', 'Overall Ashtakavarga support'],
    ['Kakshya', 'One of eight smaller sections of a sign'],
    ['Kakshya Lord', 'Planet/source associated with that section'],
    ['Bindu', 'A positive contribution (this app uses Bindu, never the alternate Rekha convention)'],
    ['Transit', 'A planet currently moving through a sign'],
    ['Natal House', 'Life area represented by that sign in the birth chart']
  ];
  return `<table><thead><tr><th>Technical Term</th><th>Simple Meaning</th></tr></thead><tbody>${dict.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table>`;
}

function renderKakshyaWindowsResults(windows, lifeAreaLabel) {
  if (!windows.length) return '<p>No windows found in the given range (try widening the date range or removing the house filter).</p>';
  const rows = windows.map(w => `
    <tr class="${kkAssessClass(w.assessment)}">
      <td>${formatDashaDateTime(w.start)}</td><td>${formatDashaDateTime(w.end)}</td><td>${w.sign}</td><td>${w.kakshyaLord}</td><td>${w.house}</td>
      <td><span class="assess-badge ${kkAssessClass(w.assessment)}">${w.assessment}</span></td>
    </tr>`).join('');
  return `
    <p>${lifeAreaLabel ? `Filtered to houses relevant to ${lifeAreaLabel}. ` : ''}Ashtakavarga indicates stronger or weaker support during these windows. Actual event realization must be confirmed through natal promise, dasha and relevant transits — a window here is never a guarantee.</p>
    <table><thead><tr><th>Start</th><th>End</th><th>Sign</th><th>Kakshya Lord</th><th>House</th><th>Assessment</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderKakshyaTab() {
  const el = document.getElementById('kakshyaOutput');
  if (!el) return;
  if (!state.chart || !state.ashtakvarga) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  const planetName = document.getElementById('kakshyaPlanetSelect').value;
  const now = new Date();
  const currentInfo = computeKakshyaInfo(planetName, now, state.chart, state.ashtakvarga);

  el.innerHTML = `
    ${renderKakshyaGlance(currentInfo)}

    <h3>Current Transit Matrix (all 7 planets)</h3>
    ${renderKakshyaCurrentMatrix(state.chart, state.ashtakvarga)}

    <h3>Eight-Kakshya Matrix — ${planetName}'s Current Sign</h3>
    ${renderKakshyaMasterMatrix(planetName, state.chart, state.ashtakvarga)}

    <h3>Hour-by-Hour Today — ${planetName}</h3>
    ${renderKakshyaHourByHour(planetName, state.chart, state.ashtakvarga)}

    <h3>Full Transit Timeline — ${planetName} Through Its Current Sign</h3>
    <div id="kakshyaTimelineOutput">Computing…</div>

    <h3 id="kakshyaWindowsHeading">Find Kakshya Windows</h3>
    <div id="kakshyaWindowsOutput"><p>Set a date range above and click "Find Kakshya Windows".</p></div>

    <h3>Simple Language Dictionary</h3>
    ${renderKakshyaDictionary()}
  `;
  setTimeout(() => {
    const timelineEl = document.getElementById('kakshyaTimelineOutput');
    if (timelineEl) timelineEl.innerHTML = renderKakshyaTimeline(planetName, state.chart, state.ashtakvarga);
  }, 10);
}

function onFindKakshyaWindows() {
  const el = document.getElementById('kakshyaWindowsOutput');
  if (!state.chart || !state.ashtakvarga) return;
  const planetName = document.getElementById('kakshyaPlanetSelect').value;
  const startStr = document.getElementById('kakshyaWindowStart').value;
  const endStr = document.getElementById('kakshyaWindowEnd').value;
  const houseFilterRaw = document.getElementById('kakshyaHouseFilter').value;
  const lifeArea = document.getElementById('kakshyaLifeAreaSelect').value;
  if (!startStr || !endStr) { el.innerHTML = '<p>Enter both a start and end date.</p>'; return; }
  const startDate = new Date(startStr + 'T00:00:00Z');
  const endDate = new Date(endStr + 'T00:00:00Z');
  if (endDate <= startDate) { el.innerHTML = '<p>End date must be after start date.</p>'; return; }

  el.innerHTML = '<p>Scanning…</p>';
  setTimeout(() => {
    let houseFilter = houseFilterRaw ? Number(houseFilterRaw) : null;
    let label = '';
    if (!houseFilter && lifeArea) {
      label = lifeArea;
    }
    let windows = findKakshyaWindows(planetName, startDate, endDate, state.chart, state.ashtakvarga, houseFilter || null);
    if (!houseFilter && lifeArea) {
      const relevantHouses = LIFE_AREAS[lifeArea].houses;
      windows = windows.filter(w => relevantHouses.includes(w.house));
    }
    windows.sort((a, b) => (a.assessment.includes('Challenging') ? 1 : 0) - (b.assessment.includes('Challenging') ? 1 : 0));
    el.innerHTML = renderKakshyaWindowsResults(windows, label);
  }, 10);
}

// --- Kakshya Life-Area Timeline ---

let ktLastMatrix = null; // { periods, matrix, dashaLordName, areas } — cached for CSV/print/detail lookup

function ktAssessCellClass(assessment) {
  return assessment === 'Insufficient Data' ? 'kt-insufficient' : `kt-assess-${assessment.replace(/ /g, '-')}`;
}

function renderKtLegend() {
  const items = [
    ['Excellent', 'var(--kt-excellent)', 'exceptionally supportive'],
    ['Very Good', 'var(--kt-verygood)', 'strongly supportive'],
    ['Good', 'var(--kt-good)', 'generally supportive'],
    ['Neutral', 'var(--kt-neutral)', 'mixed or limited support'],
    ['Bad', 'var(--kt-bad)', 'unfavourable'],
    ['Worse', 'var(--kt-worse)', 'strongly unfavourable'],
    ['Worst', 'var(--kt-worst)', 'exceptionally difficult'],
    ['Insufficient Data', 'var(--kt-insufficient)', 'not enough evidence — NOT the same as Neutral']
  ];
  document.getElementById('ktLegend').innerHTML = items.map(([label, color, desc]) =>
    `<span class="kt-legend-item"><span class="kt-swatch" style="background:${color};"></span><strong>${label}</strong> — ${desc}</span>`
  ).join('');
}

function renderKtMethodology() {
  document.getElementById('ktMethodology').innerHTML = `
    <div class="kk-calc-chain">Life Area
  -> Relevant Houses (primary houses weighted x1.5)
  -> For each of the 7 planets, sampled Kakshya info across the period (reused from the Kakshya Analysis engine)
  -> Filtered to samples whose activated natal house matches the life area
  -> Each sample's Kakshya assessment -> score -2..+2
  -> Averaged across all contributing samples in the period
  -> +-0.5 Dasha-alignment bonus if the current Mahadasha lord occupies/rules a relevant house
  -> Clamped to -3..+3
  -> Classified into 7 levels via configurable thresholds (see TIMELINE_THRESHOLDS in js/kakshyaTimeline/timelineEngine.js)</div>
    <table class="sb-component-table">
      <thead><tr><th>Score range</th><th>Assessment</th></tr></thead>
      <tbody>${TIMELINE_THRESHOLDS.map((t, i) => `<tr><td>${t.min === -Infinity ? '< ' + TIMELINE_THRESHOLDS[i - 1].min : '>= ' + t.min}</td><td>${t.label}</td></tr>`).join('')}</tbody>
    </table>
    <p style="font-size:0.85em;color:#555;">These thresholds are configuration defaults, not immutable astrological truth. Confidence: High (>=4 consistent-sign samples), Medium (2-3, or mixed sign), Low (1 sample), Insufficient Data (0 relevant samples in the period).</p>`;
}

function ktQuickRangeDates(months) {
  const start = new Date();
  const end = new Date(start.getTime() + months * 30.44 * 86400000);
  return { start, end };
}

function onKtQuickRangeChange() {
  const val = document.getElementById('ktQuickRange').value;
  if (val === 'custom') return;
  const { start, end } = ktQuickRangeDates(Number(val));
  document.getElementById('ktStartDate').value = start.toISOString().slice(0, 10);
  document.getElementById('ktEndDate').value = end.toISOString().slice(0, 10);
}

function renderKtMatrixTable(periods, matrix, areas) {
  const header = `<tr><th class="kt-area-header">Life Area</th>${periods.map(p => `<th>${p.label}</th>`).join('')}</tr>`;
  const rows = areas.map(area => {
    const cells = matrix[area.id].map((cell, i) => {
      const cls = ktAssessCellClass(cell.assessment);
      const ariaLabel = `${area.name}, ${periods[i].label}, ${cell.assessment}${cell.score !== null ? `, score ${cell.score >= 0 ? '+' : ''}${cell.score.toFixed(2)}` : ''}, ${cell.confidence} confidence`;
      const display = cell.score === null ? '—' : (cell.score >= 0 ? '+' : '') + cell.score.toFixed(1);
      return `<td class="kt-cell ${cls}" tabindex="0" role="button" aria-label="${ariaLabel}" title="${ariaLabel}" data-area="${area.id}" data-period="${i}">${display}</td>`;
    }).join('');
    return `<tr><th class="kt-row-header" data-area="${area.id}">${area.name}</th>${cells}</tr>`;
  }).join('');
  return `<table class="kt-matrix"><thead>${header}</thead><tbody>${rows}</tbody></table>`;
}

function renderKtCellDetail(area, period, cell) {
  const el = document.getElementById('ktCellDetail');
  if (cell.assessment === 'Insufficient Data') {
    el.innerHTML = `<h3>${area.name} — ${period.label}</h3><p>Insufficient Data: no planet activated a house relevant to this life area during this period. This is NOT the same as a Neutral astrological reading — it simply means this engine found no relevant Kakshya sample here.</p>`;
    return;
  }
  const rows = cell.contributions.map(c => `
    <tr>
      <td>${c.planet}</td><td>${c.sample.sign}</td><td>${sbNum(c.sample.degInSign, 2)}°</td><td>${c.sample.kakshyaNumber}</td><td>${c.sample.kakshyaLord}</td>
      <td>${c.sample.bavTotal}</td><td>${c.sample.sav}</td><td>House ${c.house}</td><td>${c.sample.assessment}</td>
    </tr>`).join('');
  el.innerHTML = `
    <h3>${area.name} — ${period.label}</h3>
    <p><strong>Assessment:</strong> <span class="assess-badge ${avpAssessClass(cell.assessment)}">${cell.assessment}</span> &nbsp; <strong>Score:</strong> ${cell.score >= 0 ? '+' : ''}${cell.score.toFixed(2)} &nbsp; <strong>Confidence:</strong> ${cell.confidence}${cell.dashaBonus ? ` &nbsp; <strong>Dasha bonus:</strong> +${cell.dashaBonus}` : ''}</p>
    <h4>Kakshya Events Contributing to This Period</h4>
    <table><thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Kakshya</th><th>Lord</th><th>BAV</th><th>SAV</th><th>House</th><th>Effect</th></tr></thead><tbody>${rows}</tbody></table>
    <p>Relevant houses for ${area.name}: ${area.houses.join(', ')} (primary: ${area.primary.join(', ')}). This is a Kakshya-based timing refinement, not a standalone prediction — always read alongside natal promise, house-lord condition, and dasha.</p>`;
}

function renderKtSummary(periods, matrix, areas) {
  const bestWorst = findBestWorstPeriods(matrix, areas);
  const bestWorstRows = bestWorst.map(r => r.best ? `
    <tr><td>${r.area.name}</td><td>${r.best.period.label}</td><td>${r.worst.period.label}</td><td>${r.avg.toFixed(2)}</td><td>${r.strongCount}</td><td>${r.difficultCount}</td></tr>` : '').join('');

  const multiAreaWindows = findMultiAreaWindows(matrix, areas, periods, Math.max(3, Math.floor(areas.length * 0.3)));
  const multiAreaHtml = multiAreaWindows.slice(0, 5).map(w => `
    <div class="rule-item quality-good">
      <strong>${w.period.label}</strong> — ${w.supportedAreas.length} areas well-supported: ${w.supportedAreas.map(s => `${s.area.name} (${s.cell.assessment})`).join(', ')}
    </div>`).join('') || '<p>No period found where several life areas are simultaneously well-supported in this range.</p>';

  document.getElementById('ktSummary').innerHTML = `
    <h3>Row-Level Summary</h3>
    <table><thead><tr><th>Life Area</th><th>Best Period</th><th>Worst Period</th><th>Avg Score</th><th>Strong Periods</th><th>Difficult Periods</th></tr></thead><tbody>${bestWorstRows}</tbody></table>

    <h3>Simultaneous Multi-Area Windows</h3>
    ${multiAreaHtml}`;
}

function onKtCellActivate(e) {
  const td = e.target.closest('.kt-cell');
  if (!td || !ktLastMatrix) return;
  const areaId = td.dataset.area;
  const periodIdx = Number(td.dataset.period);
  const area = ktLastMatrix.areas.find(a => a.id === areaId);
  const cell = ktLastMatrix.matrix[areaId][periodIdx];
  renderKtCellDetail(area, ktLastMatrix.periods[periodIdx], cell);
}

function onKtBuild() {
  if (!state.chart || !state.ashtakvarga) return;
  const startStr = document.getElementById('ktStartDate').value;
  const endStr = document.getElementById('ktEndDate').value;
  if (!startStr || !endStr) { document.getElementById('ktMatrixContainer').innerHTML = '<p>Choose a date range first.</p>'; return; }
  const startDate = new Date(startStr + 'T00:00:00Z');
  const endDate = new Date(endStr + 'T00:00:00Z');
  if (endDate <= startDate) { document.getElementById('ktMatrixContainer').innerHTML = '<p>End date must be after start date.</p>'; return; }
  const resolution = document.getElementById('ktResolution').value;
  const groupName = document.getElementById('ktAreaGroup').value;
  const areaIds = TIMELINE_LIFE_AREA_GROUPS[groupName] || TIMELINE_LIFE_AREA_GROUPS.All;
  const areas = TIMELINE_LIFE_AREAS.filter(a => areaIds.includes(a.id));

  document.getElementById('ktMatrixContainer').innerHTML = '<p>Building timeline (sampling transits across the range) — this can take a few seconds…</p>';
  document.getElementById('ktSummary').innerHTML = '';
  document.getElementById('ktCellDetail').innerHTML = '';
  setTimeout(() => {
    const { periods, matrix, dashaLordName } = buildTimelineMatrix(areas, startDate, endDate, resolution, state.chart, state.ashtakvarga);
    ktLastMatrix = { periods, matrix, areas, dashaLordName };
    const container = document.getElementById('ktMatrixContainer');
    container.innerHTML = `<div class="kt-matrix-scroll">${renderKtMatrixTable(periods, matrix, areas)}</div>`;
    container.querySelectorAll('.kt-cell').forEach(td => {
      td.addEventListener('click', onKtCellActivate);
      td.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onKtCellActivate(ev); } });
    });
    renderKtSummary(periods, matrix, areas);
  }, 20);
}

function onKtExportCsv() {
  if (!ktLastMatrix) { alert('Build the timeline first.'); return; }
  const csv = exportMatrixToCsv(ktLastMatrix.matrix, ktLastMatrix.areas, ktLastMatrix.periods);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'kakshya-life-area-timeline.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderKakshyaTimelineTab() {
  const el = document.getElementById('ktMatrixContainer');
  if (!el) return;
  renderKtLegend();
  renderKtMethodology();
  if (!state.chart || !state.ashtakvarga) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  if (!document.getElementById('ktStartDate').value) onKtQuickRangeChange();
  if (!ktLastMatrix) el.innerHTML = '<p>Choose a range and click "Build Timeline".</p>';
}

// --- Kundali Matching ---

function matchingBirthDateUtc(prefix) {
  const dateStr = document.getElementById(`${prefix}Date`).value;
  const timeStr = document.getElementById(`${prefix}Time`).value || '00:00:00';
  if (!dateStr) throw new Error(`Enter the ${prefix === 'boy' ? "boy's" : "girl's"} birth date.`);
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const mode = document.getElementById('matchingTimezoneMode').value;
  if (mode === 'iana') {
    const zone = document.getElementById('matchingIanaZone').value;
    return zonedLocalToUtc(year, month, day, hour, minute || 0, zone);
  }
  const offsetMinutes = parseUtcOffsetToMinutes(document.getElementById('matchingUtcOffset').value || '0');
  return offsetLocalToUtc(year, month, day, hour, minute || 0, offsetMinutes);
}

function generatePartnerChart(prefix) {
  const birthUtc = matchingBirthDateUtc(prefix);
  const lat = parseFloat(document.getElementById(`${prefix}Lat`).value);
  const lon = parseFloat(document.getElementById(`${prefix}Lon`).value);
  if (isNaN(lat) || isNaN(lon)) throw new Error(`Enter valid ${prefix === 'boy' ? "boy's" : "girl's"} latitude and longitude.`);
  return generateBirthChart(birthUtc, lat, lon);
}

function kootaRowClass(score, max) {
  if (score === 0) return 'bav-weak';
  if (score >= max) return 'bav-auspicious';
  return 'bav-average';
}

function renderMatchingResult(boyName, girlName, result) {
  const el = document.getElementById('matchingOutput');
  const rows = result.kootas.map(k =>
    `<tr class="${kootaRowClass(k.score, k.max)}">
      <td>${k.koota}</td><td>${k.boyValue}</td><td>${k.girlValue}</td><td>${k.score} / ${k.max}</td>
    </tr>`
  ).join('');

  const mangal = result.mangalDosha;
  const mangalPartner = (name, detail) => `
    <div class="mangal-partner">
      <p><strong>${name}:</strong> <span class="${detail.hasDosha ? 'yes-flag' : 'no-flag'}">${detail.hasDosha ? `Mangal Dosha present — ${detail.severityPercent}% severity` : 'No Mangal Dosha'}</span></p>
      <ul>${detail.contributingFactors.map(f => `<li>${f}</li>`).join('')}</ul>
    </div>`;

  const mangalSection = `
    <h3>Mangal Dosha (Kuja Dosha)</h3>
    <p style="font-size:0.85em;color:#555;">Mangal Dosha is checked when Mars occupies house 1, 2, 4, 7, 8, or 12 from each partner's own Ascendant. The severity % and reductions below are this app's own simplified scoring — see the logic notes in js/matching/mangalDoshaRules.js for the exact weighting.</p>
    <div class="mangal-columns">
      ${mangalPartner(boyName || 'Boy', mangal.boy)}
      ${mangalPartner(girlName || 'Girl', mangal.girl)}
    </div>
    <p class="matching-verdict"><strong>Marriage recommendation: ${mangal.recommendation}</strong></p>
    <p>${mangal.reasoning}</p>`;

  el.innerHTML = `
    <p>${boyName || 'Boy'}'s Moon: <strong>${result.boyMoon.sign}</strong> (${result.boyMoon.nakshatra}) &nbsp;|&nbsp;
       ${girlName || 'Girl'}'s Moon: <strong>${result.girlMoon.sign}</strong> (${result.girlMoon.nakshatra})</p>
    <table>
      <thead><tr><th>Koota</th><th>${boyName || 'Boy'}</th><th>${girlName || 'Girl'}</th><th>Score</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="matching-verdict"><strong>Total: ${result.total} / ${result.maxTotal} — ${result.grade}</strong>${result.nadiDosha ? ' <span class="yes-flag">(Nadi Dosha present)</span>' : ''}</p>
    ${mangalSection}`;
}

function onMatchKundalisClick() {
  const el = document.getElementById('matchingOutput');
  try {
    const boyChart = generatePartnerChart('boy');
    const girlChart = generatePartnerChart('girl');
    const result = matchKundalis(boyChart, girlChart);
    const boyName = document.getElementById('boyName').value.trim();
    const girlName = document.getElementById('girlName').value.trim();
    renderMatchingResult(boyName, girlName, result);
  } catch (err) {
    el.innerHTML = `<span style="color:#b23b3b;">Error: ${err.message}</span>`;
  }
}

function applyDefaultMatchingInputs() {
  document.getElementById('boyName').value = DEFAULT_MATCHING.boy.name;
  document.getElementById('boyDate').value = DEFAULT_MATCHING.boy.date;
  document.getElementById('boyTime').value = DEFAULT_MATCHING.boy.time;
  document.getElementById('boyLat').value = DEFAULT_MATCHING.boy.lat;
  document.getElementById('boyLon').value = DEFAULT_MATCHING.boy.lon;

  document.getElementById('girlName').value = DEFAULT_MATCHING.girl.name;
  document.getElementById('girlDate').value = DEFAULT_MATCHING.girl.date;
  document.getElementById('girlTime').value = DEFAULT_MATCHING.girl.time;
  document.getElementById('girlLat').value = DEFAULT_MATCHING.girl.lat;
  document.getElementById('girlLon').value = DEFAULT_MATCHING.girl.lon;

  document.getElementById('matchingTimezoneMode').value = DEFAULT_MATCHING.timezoneMode;
  document.getElementById('matchingUtcOffset').value = DEFAULT_MATCHING.utcOffset;
  document.getElementById('matchingIanaZoneLabel').hidden = DEFAULT_MATCHING.timezoneMode !== 'iana';
  document.getElementById('matchingUtcOffsetLabel').hidden = DEFAULT_MATCHING.timezoneMode === 'iana';
}

function resetMatchingForm() {
  applyDefaultMatchingInputs();
  document.getElementById('matchingOutput').innerHTML = '';
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

// Good/bad/neutral row-highlight classes shared by the Interpretations and
// Interpretation-2 tabs: light green = favorable, light red = unfavorable,
// light yellow = neutral/mixed.
function qualityFromDignity(tier) {
  if (tier === 'Exalted' || tier === 'Moolatrikona' || tier === 'Own Sign') return 'quality-good';
  if (tier === 'Debilitated') return 'quality-bad';
  return 'quality-neutral';
}
function qualityFromHouseTypes(house) {
  const types = HOUSE_TYPES[house] || [];
  if (types.includes('Dusthana')) return 'quality-bad';
  if (types.includes('Kendra') || types.includes('Trikona')) return 'quality-good';
  return 'quality-neutral';
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
    return `<tr class="${qualityFromDignity(result.dignity)}"><td>${p.name}</td><td>${p.sign}</td><td class="${dignityClass(result.dignity)}">${result.dignity}</td><td>${result.text}</td></tr>`;
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
    `<tr class="${qualityFromHouseTypes(p.house)}"><td>${p.name}</td><td>${p.house}</td><td>${interpretPlanetInHouse(p.name, p.house)}</td></tr>`
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
    // Combustion always drags the overall read down a notch; retrograde is
    // left out of this quality call since classical opinion on it is
    // genuinely split (see retrogradeInterpretations.js's own caveat).
    const baseQuality = qualityFromDignity(result.dignityTier);
    const quality = result.combust
      ? (baseQuality === 'quality-good' ? 'quality-neutral' : 'quality-bad')
      : baseQuality;
    return `
      <tr class="${quality}">
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
    const tzMode = document.getElementById('timezoneMode').value;
    const birthTimeZoneInfo = tzMode === 'iana'
      ? { mode: 'iana', zone: document.getElementById('ianaZone').value }
      : { mode: 'offset', offsetMinutes: parseUtcOffsetToMinutes(document.getElementById('utcOffset').value || '0') };
    state.chart = { planets, ascendant, birthUtc, birthTimeZoneInfo };
    state.yogas = computeYogas(planets, ascendant);
    state.dasha = computeVimshottariDasha(planets.find(p => p.name === 'Moon').longitude, birthUtc);
    state.dashaSelection = {}; // clears any drill-down selection from a previous chart
    state.sadeSati = null; // recomputed lazily (expensive) when the Sade Sati tab is opened
    state.remedies = null; // recomputed lazily when the Remedies tab is opened
    state.remedies2 = null; // recomputed lazily when the Remedies_2 tab is opened
    state.mangalDosha2 = computeMangalDosha2(state.chart);
    try {
      state.shadbala = computeShadbala(state.chart, lat, lon);
    } catch (sbErr) {
      state.shadbala = null;
      console.error('Shadbala computation failed:', sbErr);
    }
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
    renderBavAllTab();
    renderYogasTab();
    renderDashaTab();
    renderRuleEngineTab();
    renderMangalDosha2Tab();
    try { renderShadbalaTab(); } catch (sbRenderErr) { console.error('Shadbala render failed:', sbRenderErr); document.getElementById('shadbalaOutput').innerHTML = '<p>Shadbala could not be rendered for this chart (see console for details).</p>'; }
    try { renderAshtakvargaPredictionsTab(); } catch (avpErr) { console.error('Ashtakvarga Predictions render failed:', avpErr); document.getElementById('avpOutput').innerHTML = '<p>Could not be rendered for this chart (see console for details).</p>'; }
    try { renderKakshyaTab(); } catch (kkErr) { console.error('Kakshya render failed:', kkErr); document.getElementById('kakshyaOutput').innerHTML = '<p>Could not be rendered for this chart (see console for details).</p>'; }
    ktLastMatrix = null; // chart changed — any previously built timeline is stale
    try { renderKakshyaTimelineTab(); } catch (ktErr) { console.error('Kakshya Timeline render failed:', ktErr); }
    document.getElementById('sadeSatiOutput').innerHTML = '<p>Open this tab to compute the Sade Sati timeline for this chart (takes a few seconds).</p>';
    document.getElementById('remediesOutput').innerHTML = '<p>Open this tab to compute chart-specific remedies (takes a moment).</p>';
    document.getElementById('remedies2Output').innerHTML = '<p>Open this tab to compute chart-specific remedies (takes a moment).</p>';
    document.getElementById('remediesCompareOutput').innerHTML = '<p>Open this tab to compare Remedies_1 and Remedies_2 for this chart.</p>';
  } catch (err) {
    state.chart = null;
    state.yogas = null;
    state.dasha = null;
    state.sadeSati = null;
    state.remedies = null;
    state.remedies2 = null;
    state.mangalDosha2 = null;
    state.shadbala = null;
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
    document.getElementById('bavAllTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('bavAllChartOutput').innerHTML = '';
    document.getElementById('yogasTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('dashaTableOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('ruleEngineOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('sadeSatiOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('mangalDosha2Output').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('shadbalaOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('avpOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('kakshyaOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('remediesOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('remedies2Output').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('remediesCompareOutput').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    ktLastMatrix = null;
    document.getElementById('ktMatrixContainer').innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    document.getElementById('ktSummary').innerHTML = '';
    document.getElementById('ktCellDetail').innerHTML = '';
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

// --- Saved Natives (shared CSV file, interchangeable with the sibling KP app) ---

const snState = {
  headers: SAVED_NATIVES_REQUIRED_HEADERS.slice(),
  records: [],
  fileHandle: null,       // FileSystemFileHandle when the File System Access API is available and a file is connected
  fallbackFileName: null, // filename to reuse for downloads in the fallback (non-FS-Access) path
  supportsFsApi: typeof window !== 'undefined' && 'showOpenFilePicker' in window
};

function snSetFileStatus(text) { document.getElementById('snFileStatus').textContent = text; }
function snSetSaveStatus(text) { document.getElementById('snSaveStatus').textContent = text; }

function snFindRecordIndexByName(name) {
  const target = name.trim().toLowerCase();
  return snState.records.findIndex(r => (r.Name || '').trim().toLowerCase() === target);
}

function snRecordMatchesSearch(record, term) {
  if (!term) return true;
  const t = term.toLowerCase();
  return Object.values(record).some(v => String(v || '').toLowerCase().includes(t));
}

function snRenderTable() {
  const term = document.getElementById('snSearchBox').value.trim();
  const rows = snState.records
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => snRecordMatchesSearch(r, term));

  const body = rows.map(({ r, i }) => `
    <tr>
      <td>${escapeHtml(r.Name)}</td><td>${escapeHtml(r.Sex)}</td><td>${escapeHtml(r.City)}</td><td>${escapeHtml(r.State)}</td><td>${escapeHtml(r.Country)}</td>
      <td>${escapeHtml(r.BirthDate)}</td><td>${escapeHtml(r.BirthTime)}</td><td>${escapeHtml(r.Latitude)}</td><td>${escapeHtml(r.Longitude)}</td>
      <td>${escapeHtml(r.TimezoneMode)}</td><td>${escapeHtml(r.UTCOffset)}</td><td>${escapeHtml(r.Notes)}</td>
      <td><button type="button" data-sn-load="${i}">Load</button> <button type="button" data-sn-delete="${i}">Delete</button></td>
    </tr>`).join('');

  document.getElementById('snTableOutput').innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Sex</th><th>City</th><th>State</th><th>Country</th><th>Birth Date</th><th>Birth Time</th><th>Latitude</th><th>Longitude</th><th>Timezone Mode</th><th>UTC Offset</th><th>Notes</th><th>Actions</th></tr></thead>
      <tbody>${body || '<tr><td colspan="13">No records yet — connect or start a CSV file, then add a native above.</td></tr>'}</tbody>
    </table>`;

  document.querySelectorAll('#snTableOutput [data-sn-load]').forEach(btn => btn.addEventListener('click', () => snLoadRecord(Number(btn.dataset.snLoad))));
  document.querySelectorAll('#snTableOutput [data-sn-delete]').forEach(btn => btn.addEventListener('click', () => snDeleteRecord(Number(btn.dataset.snDelete))));
}

function snApplyLoadedData(headers, rows) {
  snState.headers = headers;
  snState.records = rows;
  snRenderTable();
}

async function snConnectFile() {
  if (snState.supportsFsApi) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }]
      });
      const file = await handle.getFile();
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      snState.fileHandle = handle;
      snApplyLoadedData(headers, rows);
      snSetFileStatus(`Connected: ${file.name} (${rows.length} record${rows.length === 1 ? '' : 's'}) — reads and saves write directly to this file.`);
    } catch (e) {
      if (e.name !== 'AbortError') snSetFileStatus(`Could not open file: ${e.message}`);
    }
    return;
  }
  document.getElementById('snFileInputFallback').click();
}

function snHandleFallbackFileChosen(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const { headers, rows } = parseCsv(reader.result);
    snState.fileHandle = null;
    snState.fallbackFileName = file.name;
    snApplyLoadedData(headers, rows);
    snSetFileStatus(`Loaded ${file.name} (${rows.length} record${rows.length === 1 ? '' : 's'}) — this browser can't write directly back to disk; "Save" will download a replacement file instead.`);
  };
  reader.readAsText(file);
}

async function snStartNewFile() {
  if (snState.supportsFsApi) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'saved-natives.csv',
        types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }]
      });
      snState.fileHandle = handle;
      snState.headers = SAVED_NATIVES_REQUIRED_HEADERS.slice();
      snState.records = [];
      const writable = await handle.createWritable();
      await writable.write(serializeCsv(snState.headers, snState.records));
      await writable.close();
      snRenderTable();
      snSetFileStatus('New CSV file created — reads and saves write directly to this file.');
    } catch (e) {
      if (e.name !== 'AbortError') snSetFileStatus(`Could not create file: ${e.message}`);
    }
    return;
  }
  snState.fileHandle = null;
  snState.fallbackFileName = 'saved-natives.csv';
  snState.headers = SAVED_NATIVES_REQUIRED_HEADERS.slice();
  snState.records = [];
  snRenderTable();
  snSetFileStatus('New in-memory list started — this browser can\'t write directly to disk; click "Save" to download a CSV file.');
}

async function snSaveFile() {
  const csvText = serializeCsv(snState.headers, snState.records);
  if (snState.fileHandle) {
    try {
      const writable = await snState.fileHandle.createWritable();
      await writable.write(csvText);
      await writable.close();
      snSetFileStatus(`Saved (${snState.records.length} record${snState.records.length === 1 ? '' : 's'}).`);
    } catch (e) {
      snSetFileStatus(`Could not save: ${e.message}`);
    }
    return;
  }
  const blob = new Blob([csvText], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = snState.fallbackFileName || 'saved-natives.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  snSetFileStatus(`Downloaded ${a.download} (${snState.records.length} record${snState.records.length === 1 ? '' : 's'}) — this browser can't write directly back to disk.`);
}

function snReadFormRecord() {
  return {
    Name: document.getElementById('snName').value.trim(),
    Sex: document.getElementById('snSex').value,
    Location: document.getElementById('snLocation').value.trim(),
    City: document.getElementById('snCity').value.trim(),
    State: document.getElementById('snState').value.trim(),
    Country: document.getElementById('snCountry').value.trim(),
    BirthDate: normalizeBirthDateToIso(document.getElementById('snBirthDate').value.trim()),
    BirthTime: document.getElementById('snBirthTime').value.trim(),
    Latitude: document.getElementById('snLat').value.trim(),
    Longitude: document.getElementById('snLon').value.trim(),
    TimezoneMode: document.getElementById('snTimezoneMode').value,
    UTCOffset: document.getElementById('snTimezoneMode').value === 'iana'
      ? document.getElementById('snIanaZone').value
      : document.getElementById('snUtcOffset').value.trim(),
    Notes: document.getElementById('snNotes').value
  };
}

function snSaveNative() {
  const form = snReadFormRecord();
  if (!form.Name) { snSetSaveStatus('Enter a Name before saving.'); return; }
  const existingIndex = snFindRecordIndexByName(form.Name);
  const verb = existingIndex >= 0 ? 'Updated' : 'Added';
  if (existingIndex >= 0) {
    // Preserve any unrecognized/extra columns already on this record.
    snState.records[existingIndex] = { ...snState.records[existingIndex], ...form };
  } else {
    const blank = {};
    snState.headers.forEach(h => { blank[h] = ''; });
    snState.records.push({ ...blank, ...form });
  }
  snRenderTable();
  if (snState.fileHandle) snSaveFile();
  else snSetSaveStatus(`${verb} "${form.Name}" in the in-memory list — click "Save" above to write it to a file.`);
}

function snClearForm() {
  ['snName', 'snLocation', 'snCity', 'snState', 'snCountry', 'snBirthDate', 'snBirthTime', 'snLat', 'snLon', 'snUtcOffset', 'snNotes'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('snSex').value = '';
  document.getElementById('snTimezoneMode').value = 'iana';
  document.getElementById('snIanaZoneLabel').hidden = false;
  document.getElementById('snUtcOffsetLabel').hidden = true;
  snSetSaveStatus('');
}

function snCopyFromChart() {
  document.getElementById('snBirthDate').value = document.getElementById('birthLocalDate').value;
  document.getElementById('snBirthTime').value = document.getElementById('birthLocalTime').value;
  document.getElementById('snLat').value = document.getElementById('birthLat').value;
  document.getElementById('snLon').value = document.getElementById('birthLon').value;
  const mode = document.getElementById('timezoneMode').value;
  document.getElementById('snTimezoneMode').value = mode;
  document.getElementById('snIanaZoneLabel').hidden = mode !== 'iana';
  document.getElementById('snUtcOffsetLabel').hidden = mode === 'iana';
  if (mode === 'iana') document.getElementById('snIanaZone').value = document.getElementById('ianaZone').value;
  else document.getElementById('snUtcOffset').value = document.getElementById('utcOffset').value;
  snSetSaveStatus('Copied birth details from the Chart & Analysis tab.');
}

function snPopulateFormFromRecord(record) {
  document.getElementById('snName').value = record.Name || '';
  document.getElementById('snSex').value = record.Sex || '';
  document.getElementById('snLocation').value = record.Location || '';
  document.getElementById('snCity').value = record.City || '';
  document.getElementById('snState').value = record.State || '';
  document.getElementById('snCountry').value = record.Country || '';
  document.getElementById('snBirthDate').value = record.BirthDate || '';
  document.getElementById('snBirthTime').value = record.BirthTime || '';
  document.getElementById('snLat').value = record.Latitude || '';
  document.getElementById('snLon').value = record.Longitude || '';
  document.getElementById('snNotes').value = record.Notes || '';
  const mode = record.TimezoneMode === 'offset' ? 'offset' : 'iana';
  document.getElementById('snTimezoneMode').value = mode;
  document.getElementById('snIanaZoneLabel').hidden = mode !== 'iana';
  document.getElementById('snUtcOffsetLabel').hidden = mode === 'iana';
  if (mode === 'iana') document.getElementById('snIanaZone').value = record.UTCOffset || '';
  else document.getElementById('snUtcOffset').value = record.UTCOffset || '';
}

function snLoadRecord(index) {
  const record = snState.records[index];
  if (!record) return;
  // Populate this tab's own fields too, so both stay in sync.
  snPopulateFormFromRecord(record);

  // Populate the main Chart & Analysis tab and regenerate.
  document.getElementById('birthLocalDate').value = record.BirthDate || '';
  document.getElementById('birthLocalTime').value = record.BirthTime || '';
  document.getElementById('birthLat').value = record.Latitude || '';
  document.getElementById('birthLon').value = record.Longitude || '';
  const mode = record.TimezoneMode === 'offset' ? 'offset' : 'iana';
  document.getElementById('timezoneMode').value = mode;
  document.getElementById('ianaZoneLabel').hidden = mode !== 'iana';
  document.getElementById('utcOffsetLabel').hidden = mode === 'iana';
  if (mode === 'iana') document.getElementById('ianaZone').value = record.UTCOffset || '';
  else document.getElementById('utcOffset').value = record.UTCOffset || '';

  document.getElementById('tabBtnMain').click(); // switch to the main chart tab
  generateChart();
}

function snDeleteRecord(index) {
  const record = snState.records[index];
  if (!record) return;
  if (!confirm(`Delete "${record.Name}" from the loaded Saved Natives list?`)) return;
  snState.records.splice(index, 1);
  snRenderTable();
  if (snState.fileHandle) snSaveFile();
  else snSetSaveStatus(`Deleted "${record.Name}" from the in-memory list — click "Save" above to write this change to a file.`);
}

function initSavedNatives() {
  populateIanaZoneSelect('snIanaZone');
  document.getElementById('snTimezoneMode').addEventListener('change', () => {
    const isIana = document.getElementById('snTimezoneMode').value === 'iana';
    document.getElementById('snIanaZoneLabel').hidden = !isIana;
    document.getElementById('snUtcOffsetLabel').hidden = isIana;
  });
  document.getElementById('snConnectBtn').addEventListener('click', snConnectFile);
  document.getElementById('snStartNewBtn').addEventListener('click', snStartNewFile);
  document.getElementById('snSaveFileBtn').addEventListener('click', snSaveFile);
  document.getElementById('snFileInputFallback').addEventListener('change', snHandleFallbackFileChosen);
  document.getElementById('snCopyFromChartBtn').addEventListener('click', snCopyFromChart);
  document.getElementById('snSaveNativeBtn').addEventListener('click', snSaveNative);
  document.getElementById('snClearFormBtn').addEventListener('click', snClearForm);
  document.getElementById('snSearchBox').addEventListener('input', snRenderTable);
  snRenderTable();
  if (!snState.supportsFsApi) snSetFileStatus('This browser doesn\'t support direct file read/write — "Connect" opens a file for reading, and "Save" downloads a replacement file instead of writing back to disk.');
}

// --- Remedies ---

function remSevClass(label) { return `rem-sev-${label.replace(/ /g, '-')}`; }

function remSourceLine(c) {
  return `Source: ${c.sourceType}${c.sourceTitle ? ' — ' + escapeHtml(c.sourceTitle) : ''}${c.sourceAuthor ? ' (' + escapeHtml(c.sourceAuthor) + ')' : ''}. Confidence: ${c.confidence}.${c.sourceReference ? ' ' + escapeHtml(c.sourceReference) : ''}`;
}

function remDashaBadge(c) {
  if (c.dashaStatus === 'current') return ' <span class="rem-type-badge" style="background:#fff3d6;">CURRENT DASHA</span>';
  if (c.dashaStatus === 'upcoming') return ' <span class="rem-type-badge" style="background:#e3f0ff;">UPCOMING DASHA</span>';
  return '';
}

function remCardHtml(c) {
  const typeLine = c.category === 'chant'
    ? `${c.sanskrit ? `<div style="font-size:1.1em;">${c.sanskrit}</div>` : ''}${c.transliteration ? `<div><em>${escapeHtml(c.transliteration)}</em></div>` : ''}${c.meaning ? `<div>${escapeHtml(c.meaning)}</div>` : ''}`
    : c.category === 'gemstone'
      ? `<div><span class="rem-gem-status-${c.gemstoneStatus}">${c.gemstoneStatus.replace(/_/g, ' ')}</span>${c.substitute ? ` — Substitute: ${escapeHtml(c.substitute)}` : ''}</div><div>${escapeHtml(c.description)}</div>`
      : `<div>${escapeHtml(c.description)}</div>`;

  return `
    <div class="rem-card">
      <div><span class="rem-sev-badge ${remSevClass(c.severityLabel)}">${c.severityLabel}</span> <strong>${c.planet} — ${escapeHtml(c.modeLabel)}</strong> <span class="rem-type-badge">${c.category.toUpperCase()}</span>${remDashaBadge(c)}</div>
      <h4 style="margin:6px 0 2px;">${escapeHtml(c.name)}</h4>
      ${typeLine}
      ${c.procedure ? `<p><strong>How to perform:</strong> ${escapeHtml(c.procedure)}</p>` : ''}
      <p style="font-size:0.9em;">
        ${c.frequency ? `<strong>Frequency:</strong> ${escapeHtml(c.frequency)}<br>` : ''}
        ${c.duration ? `<strong>Duration:</strong> ${escapeHtml(c.duration)}<br>` : ''}
        <strong>Affected life areas:</strong> ${c.affectedLifeAreas.join(' • ')}
      </p>
      ${c.contraindications && c.contraindications.length ? `<p style="color:#a35c00;"><strong>Contraindications:</strong> ${c.contraindications.map(escapeHtml).join(' ')}</p>` : ''}
      <details class="avp-calc"><summary>Why this remedy? (evidence &amp; source)</summary>
        <div class="kk-calc-chain">${c.reasons.map(escapeHtml).join('\n\n')}</div>
        <p style="font-size:0.85em;color:#555;">${remSourceLine(c)}</p>
      </details>
    </div>`;
}

function remApplyFilters(cards) {
  const category = document.getElementById('remCategoryFilter').value;
  const classicalOnly = document.getElementById('remClassicalOnly').checked;
  const highConfOnly = document.getElementById('remHighConfidenceOnly').checked;
  const dashaOnly = document.getElementById('remDashaOnly').checked;
  return cards.filter(c =>
    (category === 'all' || c.category === category) &&
    (!classicalOnly || c.sourceType === 'Classical' || c.sourceType === 'Traditional') &&
    (!highConfOnly || c.confidence === 'High') &&
    (!dashaOnly || c.dashaRelevant)
  );
}

function remFmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'n/a';
}

function remDashaTimelineTableHtml(dashaLords) {
  const rowHtml = (row) => `
    <tr${row.status === 'Current' ? ' style="background:#eaf7ea;"' : row.flagStart ? ' style="background:#fff3d6;"' : ''}>
      <td>${row.level}</td>
      <td>${row.lord}</td>
      <td>${remFmtDate(row.startDate)}</td>
      <td>${remFmtDate(row.endDate)}</td>
      <td>${row.status}</td>
      <td>${row.flagStart ? '<strong>Start remedies now</strong>' : (row.status === 'Current' ? 'In progress' : '')}</td>
    </tr>`;

  if (!dashaLords.mahaTimeline.length) return '<p>Dasha timeline unavailable for this chart.</p>';

  return `
    <table class="rem-table">
      <thead><tr><th>Level</th><th>Lord</th><th>Start</th><th>End</th><th>Status</th><th>Remedy Timing</th></tr></thead>
      <tbody>
        ${dashaLords.mahaTimeline.map(rowHtml).join('')}
        ${dashaLords.antarTimeline.map(rowHtml).join('')}
      </tbody>
    </table>
    <p style="font-size:0.85em;color:#555;">"Start remedies now" flags a lord whose Mahadasha begins within ~12 months, or whose Antardasha begins within ~3 months — a practical convention for beginning remedial practice before a period starts, not a fixed classical rule.</p>`;
}

function remSummaryTableHtml(cards) {
  if (!cards.length) return '<p>No remedies matched the current filters.</p>';
  const rowHtml = (c) => `
    <tr>
      <td>${c.planet}</td>
      <td>${c.category.toUpperCase()}</td>
      <td>${escapeHtml(c.name)}</td>
      <td><span class="rem-sev-badge ${remSevClass(c.severityLabel)}">${c.severityLabel}</span></td>
      <td>${c.dashaStatus === 'current' ? 'Current' : c.dashaStatus === 'upcoming' ? 'Upcoming' : '—'}</td>
      <td>${c.tier}</td>
    </tr>`;
  return `
    <table class="rem-table">
      <thead><tr><th>Planet</th><th>Category</th><th>Remedy</th><th>Severity</th><th>Dasha Status</th><th>Tier</th></tr></thead>
      <tbody>${cards.map(rowHtml).join('')}</tbody>
    </table>`;
}

function renderRemediesTab() {
  const el = document.getElementById('remediesOutput');
  if (!el) return;
  if (!state.chart) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  if (!state.remedies) {
    try { state.remedies = computeRemedies(state.chart); }
    catch (e) { console.error('Remedies computation failed:', e); el.innerHTML = '<p>Remedies could not be computed for this chart (see console).</p>'; return; }
  }
  const r = state.remedies;
  const mahaLabel = r.dashaLords.maha || 'n/a';
  const antarLabel = r.dashaLords.antar || 'n/a';

  r.primary.forEach(c => { c.tier = 'Primary'; });
  r.secondary.forEach(c => { c.tier = 'Secondary'; });
  r.supportive.forEach(c => { c.tier = 'Supportive'; });
  r.gemstoneCards.forEach(c => { c.tier = 'Gemstone'; });

  const primary = remApplyFilters(r.primary);
  const secondary = remApplyFilters(r.secondary);
  const supportive = remApplyFilters(r.supportive);
  const gemstones = remApplyFilters(r.gemstoneCards);
  const allFiltered = primary.concat(gemstones, secondary, supportive);

  el.innerHTML = `
    <div class="rule-item quality-neutral" style="padding:10px;">
      <strong>Remedial Analysis</strong><br>
      Lagna: ${state.chart.ascendant.sign} &nbsp; Current Mahadasha: ${mahaLabel} &nbsp; Current Antardasha: ${antarLabel}<br>
      Overall remedial priority: <span class="rem-sev-badge ${remSevClass(r.overallPriority)}">${r.overallPriority}</span>
    </div>

    <h3>Dasha Timeline &amp; Remedy Timing</h3>
    ${remDashaTimelineTableHtml(r.dashaLords)}

    <h3>Remedy Summary</h3>
    ${remSummaryTableHtml(allFiltered)}

    <div class="rem-gem-warning">
      <strong>About gemstones:</strong> gemstones are traditionally considered strengthening/amplifying remedies. A gemstone is never recommended solely because a planet is afflicted — it is evaluated for functional role (favorable vs. unfavorable for this Lagna) and the overall horoscope first. This app does not claim gemstones scientifically alter planetary forces.
    </div>

    <h3>Section 1 — Highest Priority</h3>
    ${primary.length ? primary.map(remCardHtml).join('') : '<p>No high-priority remedies matched the current filters.</p>'}

    <h3>Section 2 — Gemstones</h3>
    ${gemstones.length ? gemstones.map(remCardHtml).join('') : '<p>No gemstone recommendations matched the current filters (most planets are NOT gemstone-eligible by design — see the warning above).</p>'}

    <h3>Section 3 — Other Remedies</h3>
    ${secondary.concat(supportive).length ? secondary.concat(supportive).map(remCardHtml).join('') : '<p>No further remedies matched the current filters.</p>'}
  `;
}

// --- Remedies_2 (independent second engine, remedies2/) ---

function rem2Badge(label) { return `<span class="rem2-badge rem2-${label.replace(/ /g, '')}">${label}</span>`; }

function rem2PackageCardHtml(pkg) {
  const remedyHtml = pkg.remedies.map(r => {
    if (r.type === 'chant') return `<p><strong>Chant (${escapeHtml(r.purpose)}):</strong> ${r.sanskrit} — <em>${escapeHtml(r.transliteration)}</em><br>Total Japa: <strong>${r.totalJapa.toLocaleString()}</strong> &nbsp; Suggested: ${Math.round(r.totalJapa / 40)}/day for ~40 days &nbsp; Preferred day: ${r.preferredDay}</p>`;
    if (r.type === 'donation') return `<p><strong>Donation:</strong> ${escapeHtml(r.primary)} (alternatives: ${r.alternatives.map(escapeHtml).join(', ')}) — for ${escapeHtml(r.beneficiary)}. Frequency: ${escapeHtml(r.frequency)}. <em>${escapeHtml(r.cautions)}</em></p>`;
    if (r.type === 'action') return `<p><strong>Action/Conduct:</strong> ${r.items.map(escapeHtml).join('; ')}.</p>`;
    if (r.type === 'gemstone') return `<p><strong>Gemstone${r.conditional ? ' (conditional)' : ''}:</strong> ${escapeHtml(r.name)} — ${escapeHtml(r.metal)}, ${escapeHtml(r.finger)}, ${escapeHtml(r.day)}.<br><span style="color:#a35c00;">${escapeHtml(r.reason)}</span></p>`;
    return '';
  }).join('');

  const gemLine = pkg.gemstone.recommended
    ? ''
    : `<p style="color:#666;"><strong>Gemstone:</strong> NOT RECOMMENDED — ${escapeHtml(pkg.gemstone.reason)}</p>`;

  return `
    <div class="rem2-card">
      <div>${rem2Badge(pkg.priority)} <strong>${pkg.planet}</strong> — Severity ${pkg.natalSeverity}/100 (${pkg.severityLabel}) &nbsp; <span style="font-size:0.85em;color:#555;">${pkg.currentRelevance}</span></div>
      <p><strong>Primary reason:</strong> ${escapeHtml(pkg.primaryReason)}</p>
      <p><strong>Affected life areas:</strong> ${pkg.affectedLifeAreas.join(' • ')}</p>
      ${remedyHtml}
      ${gemLine}
      <details class="avp-calc"><summary>Detailed reasoning (all factors)</summary>
        <div class="kk-calc-chain">
          <strong>Adverse/contributing factors:</strong><br>${pkg.adverseFactors.map(escapeHtml).join('<br>') || 'None.'}<br><br>
          <strong>Protective/mitigating factors:</strong><br>${pkg.protectiveFactors.map(escapeHtml).join('<br>') || 'None.'}
        </div>
      </details>
    </div>`;
}

function rem2DiagnosticMatrixHtml(assessments) {
  const rows = Object.values(assessments).map(a => `
    <tr>
      <td>${a.planet}</td>
      <td>${escapeHtml(a.functionalNature)}</td>
      <td>${a.house}</td>
      <td>${a.sign}</td>
      <td>${a.dignity}</td>
      <td style="font-size:0.85em;">${a.factors.filter(f => f.weight > 0).map(f => escapeHtml(f.note)).join('; ') || 'None'}</td>
      <td>${a.currentRelevance}</td>
      <td>${a.natalSeverity}</td>
      <td>${rem2Badge(a.priority)}</td>
    </tr>`).join('');
  return `
    <table class="rem-table">
      <thead><tr><th>Planet</th><th>Functional Nature</th><th>House</th><th>Sign</th><th>Dignity</th><th>Major Afflictions</th><th>Dasha Status</th><th>Severity</th><th>Priority</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function rem2DebugHtml(assessments) {
  const debugObjects = Object.values(assessments).map(a => ({
    planet: a.planet, functionalNature: a.functionalNature, house: a.house, sign: a.sign, dignity: a.dignity,
    combust: a.combust, retrograde: a.retrograde, conjunctions: a.conjunctions, aspectsReceived: a.aspectsReceived,
    dashaActive: a.dashaActive, dashaLevel: a.dashaLevel, rawScore: a.rawScore,
    natalSeverity: a.natalSeverity, priorityScore: a.priorityScore, priority: a.priority,
    remedyDirection: a.remedyDirection, gemstone: a.gemstone,
    factors: a.factors
  }));
  return `<div class="rem2-debug">${escapeHtml(JSON.stringify(debugObjects, null, 2))}</div>`;
}

function renderRemedies2Tab() {
  const el = document.getElementById('remedies2Output');
  if (!el) return;
  if (!state.chart) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  if (!state.remedies2) {
    try { state.remedies2 = computeRemedies2(state.chart); }
    catch (e) { console.error('Remedies_2 computation failed:', e); el.innerHTML = '<p>Remedies_2 could not be computed for this chart (see console).</p>'; return; }
  }
  const r = state.remedies2;
  const debugMode = document.getElementById('rem2DebugMode').checked;
  const showAll = document.getElementById('rem2ShowAll').checked;
  const listToShow = showAll ? r.packages : r.primary;

  el.innerHTML = `
    <div class="rule-item quality-neutral" style="padding:10px;">
      <strong>Priority Summary</strong><br>
      ${Object.entries(r.summary).map(([label, count]) => `<div class="rem2-summary-card rem2-${label.replace(/ /g, '')}">${label}<br><span style="font-size:1.4em;">${count}</span></div>`).join('')}
    </div>

    <h3>Recommended Remedies</h3>
    ${listToShow.length ? listToShow.map(rem2PackageCardHtml).join('') : '<p>No meaningful afflictions detected above the suppression threshold for this chart.</p>'}
    ${!showAll && r.suppressed.length ? `<p style="font-size:0.85em;color:#555;">${r.suppressed.length} additional low-priority/suppressed planet(s) not shown — check "Show all detected afflictions" above.</p>` : ''}

    <h3>Planetary Diagnostic Matrix</h3>
    ${rem2DiagnosticMatrixHtml(r.assessments)}

    ${debugMode ? `<h3>Debug Output (rule path &amp; scores)</h3>${rem2DebugHtml(r.assessments)}` : ''}
  `;
}

// --- Remedies_Compare (cross-checks Remedies_1 vs Remedies_2) ---

// Normalizes each engine's own remedyMode/remedyDirection vocabulary down
// to a shared 'pacify' | 'strengthen' | 'none' axis so the two independent
// engines can be compared on equal terms.
function remcDirection1(mode) {
  if (mode === 'STRENGTHEN_PLANET') return 'strengthen';
  if (mode === 'PACIFY_PLANET' || mode === 'PACIFY_AFFLICTION') return 'pacify';
  return 'none';
}
function remcDirection2(direction) {
  if (direction === 'strengthen') return 'strengthen';
  if (direction === 'pacify' || direction === 'both') return 'pacify';
  return 'none';
}
// Normalizes each engine's own gemstone vocabulary to 'Yes' | 'Conditional' | 'No'.
function remcGem1(status) {
  if (status === 'RECOMMENDED') return 'Yes';
  if (status === 'CONDITIONALLY_RECOMMENDED' || status === 'PROFESSIONAL_REVIEW_REQUIRED') return 'Conditional';
  return 'No';
}
function remcGem2(gem) {
  if (!gem.recommended) return 'No';
  return gem.conditional ? 'Conditional' : 'Yes';
}

function renderRemediesCompareTab() {
  const el = document.getElementById('remediesCompareOutput');
  if (!el) return;
  if (!state.chart) {
    el.innerHTML = '<p>Generate a chart on the "Chart &amp; Analysis" tab first.</p>';
    return;
  }
  if (!state.remedies) {
    try { state.remedies = computeRemedies(state.chart); }
    catch (e) { console.error('Remedies_1 computation failed:', e); el.innerHTML = '<p>Remedies_1 could not be computed for this chart (see console).</p>'; return; }
  }
  if (!state.remedies2) {
    try { state.remedies2 = computeRemedies2(state.chart); }
    catch (e) { console.error('Remedies_2 computation failed:', e); el.innerHTML = '<p>Remedies_2 could not be computed for this chart (see console).</p>'; return; }
  }
  const r1 = state.remedies, r2 = state.remedies2;
  const planetNames = SHADBALA_PLANETS.concat(['Rahu', 'Ketu']);

  let directionAgree = 0, gemAgree = 0;
  const rows = planetNames.map(name => {
    const a1 = r1.assessments[name], a2 = r2.assessments[name];
    const dir1 = remcDirection1(a1.remedyMode), dir2 = remcDirection2(a2.remedyDirection);
    const gem1 = remcGem1(a1.gemstoneStatus), gem2 = remcGem2(a2.gemstone);
    const dirMatch = dir1 === dir2, gemMatch = gem1 === gem2;
    if (dirMatch) directionAgree++;
    if (gemMatch) gemAgree++;
    return {
      name, a1, a2, dir1, dir2, gem1, gem2, dirMatch, gemMatch,
      rowDisagree: !dirMatch || !gemMatch
    };
  });

  const rowHtml = (row) => `
    <tr${row.rowDisagree ? ' class="remc-row-disagree"' : ''}>
      <td><strong>${row.name}</strong></td>
      <td>${row.a1.severity} (${row.a1.afflictionScore}/100)</td>
      <td>${row.a2.severityLabel} (${row.a2.natalSeverity}/100) &nbsp; ${rem2Badge(row.a2.priority)}</td>
      <td>${row.dir1}</td>
      <td>${row.dir2}</td>
      <td class="${row.dirMatch ? 'remc-agree' : 'remc-disagree'}">${row.dirMatch ? 'Agree' : 'Differ'}</td>
      <td>${row.gem1}</td>
      <td>${row.gem2}</td>
      <td class="${row.gemMatch ? 'remc-agree' : 'remc-disagree'}">${row.gemMatch ? 'Agree' : 'Differ'}</td>
    </tr>`;

  const disagreements = rows.filter(r => r.rowDisagree);
  const disagreementDetailHtml = disagreements.length ? disagreements.map(row => `
    <div class="rem2-card">
      <strong>${row.name}</strong> — ${!row.dirMatch ? `Remedy direction differs: Remedies_1 says <em>${row.dir1}</em>, Remedies_2 says <em>${row.dir2}</em>. ` : ''}${!row.gemMatch ? `Gemstone eligibility differs: Remedies_1 says <em>${row.gem1}</em>, Remedies_2 says <em>${row.gem2}</em>.` : ''}
      <details class="avp-calc"><summary>Why each engine reached its conclusion</summary>
        <div class="kk-calc-chain">
          <strong>Remedies_1 reasoning:</strong><br>${(row.a1.afflictions || []).concat(row.a1.beneficSupport || []).map(escapeHtml).join('<br>') || 'No specific factors recorded.'}<br><br>
          <strong>Remedies_2 reasoning:</strong><br>${row.a2.factors.map(f => escapeHtml(f.note)).join('<br>') || 'No specific factors recorded.'}
        </div>
      </details>
    </div>`).join('') : '<p>No disagreements — both engines reached the same remedy direction and gemstone eligibility for every planet.</p>';

  el.innerHTML = `
    <div class="rule-item quality-neutral" style="padding:10px;">
      <strong>Agreement Summary</strong><br>
      Remedy direction (pacify/strengthen/none): <strong>${directionAgree}/9</strong> planets agree.<br>
      Gemstone eligibility: <strong>${gemAgree}/9</strong> planets agree.
    </div>

    <h3>Side-by-Side Comparison</h3>
    <table class="rem-table">
      <thead>
        <tr><th rowspan="2">Planet</th><th colspan="2">Severity</th><th colspan="3">Remedy Direction</th><th colspan="3">Gemstone</th></tr>
        <tr><th>Remedies_1</th><th>Remedies_2</th><th>Remedies_1</th><th>Remedies_2</th><th></th><th>Remedies_1</th><th>Remedies_2</th><th></th></tr>
      </thead>
      <tbody>${rows.map(rowHtml).join('')}</tbody>
    </table>

    <h3>Where the Engines Disagree</h3>
    ${disagreementDetailHtml}

    <p style="font-size:0.85em;color:#555;">Both engines are independently-built and independently-weighted deterministic rule engines reusing the same underlying chart calculations. Agreement is a useful cross-check; a disagreement means the two rule sets weighed the same underlying factors differently, not that one engine is simply wrong — see each engine's own "why" details above, and each tab's research notes (docs/remedies/research-notes.md, docs/remedies2/research-notes.md) for its specific design choices.</p>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initEngineStatusBadge();
  populateIanaZones();
  initTimezoneModeToggle();
  populateIanaZoneSelect('matchingIanaZone');
  initMatchingTimezoneModeToggle();
  document.getElementById('matchKundalisBtn').addEventListener('click', onMatchKundalisClick);
  document.getElementById('matchingResetBtn').addEventListener('click', resetMatchingForm);
  applyDefaultMatchingInputs();
  applyDefaultBirthInputs();
  document.getElementById('generateChartBtn').addEventListener('click', generateChart);
  document.getElementById('resetBtn').addEventListener('click', resetForm);
  document.getElementById('chartLayout').addEventListener('change', renderCharts);
  document.getElementById('avChartLayout').addEventListener('change', () => renderAshtakvargaChart(state.ashtakvarga));
  document.getElementById('divisionalChartLayout').addEventListener('change', renderDivisionalTab);
  document.getElementById('bavAllChartLayout').addEventListener('change', () => renderBavAllCharts(state.ashtakvarga));
  document.getElementById('showSecondsToggle').addEventListener('change', () => {
    renderCharts();
    if (state.ashtakvarga) {
      renderAshtakvargaChart(state.ashtakvarga);
      renderBavAllCharts(state.ashtakvarga);
    }
    renderDivisionalTab();
  });
  document.getElementById('shadbalaDetailedToggle').addEventListener('change', renderShadbalaTab);
  document.getElementById('shadbalaSortBy').addEventListener('change', renderShadbalaTab);
  document.getElementById('avpLifeAreaSelect').addEventListener('change', renderAshtakvargaPredictionsTab);
  document.getElementById('kakshyaPlanetSelect').addEventListener('change', renderKakshyaTab);
  document.getElementById('kakshyaFindWindowsBtn').addEventListener('click', onFindKakshyaWindows);
  document.getElementById('ktQuickRange').addEventListener('change', onKtQuickRangeChange);
  document.getElementById('ktBuildBtn').addEventListener('click', onKtBuild);
  document.getElementById('ktExportCsvBtn').addEventListener('click', onKtExportCsv);
  document.getElementById('ktPrintBtn').addEventListener('click', () => window.print());
  document.getElementById('remCategoryFilter').addEventListener('change', renderRemediesTab);
  document.getElementById('remClassicalOnly').addEventListener('change', renderRemediesTab);
  document.getElementById('remHighConfidenceOnly').addEventListener('change', renderRemediesTab);
  document.getElementById('remDashaOnly').addEventListener('change', renderRemediesTab);
  document.getElementById('rem2DebugMode').addEventListener('change', renderRemedies2Tab);
  document.getElementById('rem2ShowAll').addEventListener('change', renderRemedies2Tab);
  initSavedNatives();
  initAutoRegenerate();
  renderInterpretation2Tab();
  generateChart();
  // The initial generateChart() above can run before Swiss Ephemeris
  // finishes loading (it's async), in which case it silently used the
  // lower-precision offline fallback engine. Once the real engine becomes
  // ready, regenerate so every tab reflects the higher-precision result
  // instead of leaving the fallback-computed chart in place indefinitely.
  document.addEventListener('swisseph-ready', () => {
    if (state.chart) generateChart();
  });
});
