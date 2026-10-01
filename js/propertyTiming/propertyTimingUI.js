/* =========================================================
   PROPERTY PURCHASE TIMING — rendering layer only.
   Consumes window.PropertyTiming (engine) and renders into #pp-root.
   Uses this app's EXISTING shared UI conventions (output-box/pastel-*
   panels, .rem-table, quality-good/neutral/bad coloring, avp-calc
   expandable details) — same visual language as every other timing
   tab.
   Namespaced as window.PropertyTimingUI.
   ========================================================= */

window.PropertyTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l === 'yes') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate') return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    const relRows = np.relationships.map(rel => `
      <tr class="${rel.connected ? 'quality-good' : ''}">
        <td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td>
      </tr>`).join('');
    return `
      <h3 id="pp-sec-promise">Property Acquisition Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        ${np.loanIndicatorsActive ? `<p style="color:#8a6d00;">Property acquisition is supported. Financing/loan indicators (6th/8th) are also active. ${evidenceDetails('About this', [np.loanRule.description, np.loanRule.explanation])}</p>` : ''}
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.fourthHouse)}${houseRow(np.eighthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.mars, 'Mars')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.saturn, 'Saturn')}
          </tbody>
        </table>
      </div>
      <h4>Property Acquisition Indicators (House Relationships)</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${relRows}</tbody></table>
      </div>`;
  }

  function renderD4(r) {
    const d4 = r.d4Confirmation;
    return `
      <h3 id="pp-sec-d4">D4 (Chaturthamsha) Confirmation</h3>
      <div class="output-box pastel-lavender">
        <p><strong>${esc(d4.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D4 Ascendant</td><td>${esc(d4.d4.ascendantSign)} (lord ${esc(d4.d4.lagnaLord)})</td></tr>
          <tr><td>D4 4th</td><td>${esc(d4.d4.fourthSign)} (lord ${esc(d4.d4.fourthLord)})${d4.d4.fourthOccupants.length ? ', occupied by ' + esc(d4.d4.fourthOccupants.join(', ')) : ''}</td></tr>
          <tr><td>D4 2nd</td><td>${esc(d4.d4.secondSign)} (lord ${esc(d4.d4.secondLord)})</td></tr>
          <tr><td>D4 11th</td><td>${esc(d4.d4.eleventhSign)} (lord ${esc(d4.d4.eleventhLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D4 level?', d4.evidence)}
        <p style="font-size:0.85em;color:#777;">D4 confirms or qualifies D1 — it never replaces it.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="pp-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Property Purchase Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="pp-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Property-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct property-promise connection found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    if (!r.candidateWindows.length) {
      return `<h3 id="pp-sec-windows">Property Windows</h3><p><label>Search horizon: <select id="pp-horizon-select">${horizonOptions}</select></label></p><p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient property-related convergence (2nd/4th/8th/11th/12th, Mars/Venus/Moon/Jupiter/Saturn, or D4).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-pp-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.activatedHouses.some(h => [2, 11].includes(h)) ? 'Yes' : 'No'}</td>
        <td>${w.d4Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="pp-sec-windows">Property Windows</h3>
      <p><label>Search horizon: <select id="pp-horizon-select">${horizonOptions}</select></label></p>
      <div class="output-box pastel-pink" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>4th Activation</th><th>2nd/11th</th><th>D4</th><th>Jupiter</th><th>Saturn</th><th>Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="pp-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Property Promise', '&darr;',
      '4th house / 4th lord analysed', '&darr;',
      `2nd ${w.activatedHouses.includes(2) ? 'supports asset acquisition' : 'shows limited activation'}`, '&darr;',
      `11th ${w.activatedHouses.includes(11) ? 'supports gain/acquisition' : 'shows limited activation'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D4 ${w.d4Confirmation ? 'confirms' : 'does not confirm'} property acquisition`, '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports acquisition' : 'shows no qualifying support'} (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'supports long-term asset/formalization' : 'shows no qualifying activation'} (transit)`, '&darr;',
      'Candidate Property Window', '&darr;',
      `Event Classification = ${w.event.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-mint">
        <p><strong>Window:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Reasons:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Mars transit (secondary, window midpoint):</strong> ${esc(w.transit.mars.sign)}, house ${w.transit.mars.house} ${badge(w.transit.mars.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.mars.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Event Classification:</strong> ${badge(w.event.label)}</p>
        <details class="avp-calc"><summary>PROPERTY PURCHASE TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="pp-sec-timeline">Property Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Property Purchase', 'Land Purchase', 'Registration', 'Possession', 'Construction Start', 'Property Sale'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.PropertyTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.PropertyTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">No chart/dasha data.</td><td><button type="button" class="pp-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="pp-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.secondActivation ? 'Yes' : 'No')}</td><td>${badge(v.fourthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d4Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="pp-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="pp-sec-historical">Historical Property Event Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous property purchase/registration/possession/land-purchase/construction-start/sale date to see what the method would have shown for it — this validates the method against actual property history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="pp-hist-date-input"> <select id="pp-hist-type-select">${typeOptions}</select> <button type="button" id="pp-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>2nd</th><th>4th</th><th>11th</th><th>D4</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
      </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `
      <details class="avp-calc">
        <summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary>
        <p><strong>Category:</strong> ${esc(rule.category)}</p>
        <p><strong>Rule:</strong> ${esc(rule.description)}</p>
        <p><strong>Explanation:</strong> ${esc(rule.explanation)}</p>
        <p><strong>Source:</strong> ${esc(rule.source)}</p>
      </details>`).join('');
    return `<h3 id="pp-sec-rules">Rules Used</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="pp-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="pp-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#pp-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-pp-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-pp-window'));
      UI.render();
      const el = document.getElementById('pp-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#pp-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#pp-hist-date-input').value;
      const type = root.querySelector('#pp-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.pp-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#pp-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('pp-root');
    if (!root) return;
    const result = window.PropertyTiming.refresh(horizonYears);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Property Purchase Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari property-acquisition timing (no KP or Western technique). Traces the chain: <strong>Natal Property Promise &rarr; D4 Confirmation &rarr; Vimshottari Dasha Activation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Event Classification</strong>. 4th-house activation alone, Jupiter transit alone, and Mars transit alone never produce a property-purchase classification; inheritance, sale, and construction are distinguished from purchase rather than defaulted to it.</p>',
      renderPromise(result),
      renderD4(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.PropertyTiming) window.PropertyTiming.init(); };
  UI.init();
  return UI;
})();
