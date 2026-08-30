// UI glue: tabs, birth input handling, Planet Table rendering, D1/D9 chart
// rendering (South/North Indian). No astrology math lives here — everything
// is delegated to the other modules.

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

function renderSouthIndianChart(title, bySign) {
  const cells = SOUTH_INDIAN_GRID.map(sign => {
    if (!sign) return '<div class="vedic-chart-cell"></div>';
    const planets = bySign[sign] || [];
    const planetLines = planets.map(p => `${p.name} ${formatDegMinSec(p.longitude)}`).join('<br>');
    return `<div class="vedic-chart-cell"><span class="sign-name">${sign.slice(0, 3)}</span>${planetLines}</div>`;
  }).join('');
  return `<div class="chart-block"><h3>${title} (South Indian)</h3><div class="vedic-chart-grid">${cells}</div></div>`;
}

function renderNorthIndianChart(title, byHouse) {
  const polygons = NORTH_INDIAN_HOUSES.map(h => {
    const data = byHouse[h.house];
    const sign = SIGNS[data.signIndex];
    const planetText = data.planets.map(p => `${p.name} ${formatDegMinSec(p.longitude)}`).join(' | ');
    return `
      <polygon points="${h.points}" fill="none" stroke="#555" stroke-width="1.5" />
      <text x="${h.label[0]}" y="${h.label[1]}" text-anchor="middle" font-weight="bold">${sign.slice(0, 3)}</text>
      <text x="${h.label[0]}" y="${h.label[1] + 12}" text-anchor="middle" font-size="8">${planetText}</text>
    `;
  }).join('');
  return `<div class="chart-block"><h3>${title} (North Indian)</h3>
    <svg class="vedic-chart-svg" width="320" height="320" viewBox="-10 -10 320 320">
      <rect x="0" y="0" width="300" height="300" fill="#fff" stroke="#555" stroke-width="2" />
      <line x1="0" y1="0" x2="300" y2="300" stroke="#555" />
      <line x1="300" y1="0" x2="0" y2="300" stroke="#555" />
      ${polygons}
    </svg></div>`;
}

function renderCharts() {
  const output = document.getElementById('chartsOutput');
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

function generateChart() {
  const statusEl = document.getElementById('ascendantOutput');
  try {
    const birthUtc = birthDateUtcFromInputs();
    const lat = parseFloat(document.getElementById('birthLat').value);
    const lon = parseFloat(document.getElementById('birthLon').value);
    if (isNaN(lat) || isNaN(lon)) throw new Error('Enter valid birth latitude and longitude.');

    const { planets, ascendant } = generateBirthChart(birthUtc, lat, lon);
    state.chart = { planets, ascendant };
    renderAscendant(ascendant);
    renderPlanetTable(planets);
    renderCharts();
  } catch (err) {
    statusEl.innerHTML = `<span style="color:#b23b3b;">Error: ${err.message}</span>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initEngineStatusBadge();
  populateIanaZones();
  initTimezoneModeToggle();
  document.getElementById('generateChartBtn').addEventListener('click', generateChart);
  document.getElementById('chartLayout').addEventListener('change', renderCharts);
});
