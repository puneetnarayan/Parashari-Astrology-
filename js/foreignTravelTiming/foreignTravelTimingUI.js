/* =========================================================
   FOREIGN TRAVEL / FOREIGN SETTLEMENT TIMING — rendering layer only.
   Consumes window.ForeignTravelTiming (engine) and renders into
   #ft-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — same visual language as
   every other timing tab.
   Namespaced as window.ForeignTravelTimingUI.
   ========================================================= */

window.ForeignTravelTimingUI = (function () {
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
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('temporary') || l.includes('conditional')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="ft-sec-promise">Foreign Connection Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.rahu, 'Rahu')}${karakaRow(np.ketu, 'Ketu')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.sun, 'Sun')}
          </tbody>
        </table>
      </div>
      <h4 id="ft-sec-signature">Foreign Connection Signature (House Relationships)</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${np.relationships.map(rel => `
          <tr class="${rel.connected ? 'quality-good' : ''}">
            <td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td>
          </tr>`).join('')}</tbody></table>
        <p style="font-size:0.85em;color:#777;">No single connection is treated as sufficient for permanent settlement — see Settlement Strength below.</p>
      </div>`;
  }

  function renderD4(r) {
    const d4 = r.d4Confirmation;
    return `
      <h3 id="ft-sec-d4">D4 (Chaturthamsha) Confirmation</h3>
      <div class="output-box pastel-lavender">
        <p><strong>${esc(d4.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D4 Ascendant</td><td>${esc(d4.d4.ascendantSign)} (lord ${esc(d4.d4.lagnaLord)})</td></tr>
          <tr><td>D4 4th</td><td>${esc(d4.d4.fourthSign)} (lord ${esc(d4.d4.fourthLord)})</td></tr>
          <tr><td>D4 9th</td><td>${esc(d4.d4.ninthSign)} (lord ${esc(d4.d4.ninthLord)})</td></tr>
          <tr><td>D4 12th</td><td>${esc(d4.d4.twelfthSign)} (lord ${esc(d4.d4.twelfthLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D4 level?', d4.evidence)}
        <p style="font-size:0.85em;color:#777;">D4 confirms or qualifies D1 — it never replaces it.</p>
      </div>`;
  }

  function renderD10(r) {
    const d10 = r.d10Confirmation;
    return `
      <h3 id="ft-sec-d10">D10 (Dashamsha) Foreign-Career Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d10.level)}</strong></p>
        <p style="font-size:0.85em;color:#777;">Shown only because the event may be career-related — D10 is not used as the primary chart for pure travel/tourism windows.</p>
        ${evidenceDetails('Why this D10 level?', d10.evidence)}
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="ft-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Foreign Travel / Settlement Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="ft-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Foreign-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct foreign-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderSettlementStrength(r) {
    if (!r.settlementStrength) return '';
    const s = r.settlementStrength;
    return `
      <h3 id="ft-sec-strength">Settlement Strength</h3>
      <div class="output-box pastel-pink">
        <p><strong>${badge(s.label)}</strong></p>
        <p style="font-size:0.85em;color:#777;">Based on ${s.settlementWindowCount} settlement-type window(s) vs. ${s.travelWindowCount} travel-type window(s) among the candidates below, plus D4 confirmation — never a numeric score, and never derived from a single short window.</p>
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    if (!r.candidateWindows.length) {
      return `<h3 id="ft-sec-windows">Foreign Travel / Settlement Windows</h3><p><label>Search horizon: <select id="ft-horizon-select">${horizonOptions}</select></label></p><p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient foreign-travel convergence (3rd/4th/6th/9th/10th/11th/12th, Rahu/Ketu, or D4).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-ft-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.d4Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.event.label.includes('Employment') ? 'Yes' : '&mdash;'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="ft-sec-windows">Foreign Travel / Settlement Windows</h3>
      <p><label>Search horizon: <select id="ft-horizon-select">${horizonOptions}</select></label></p>
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>Foreign Activation</th><th>D4</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th>Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="ft-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Foreign Connection', '&darr;',
      `9th/12th connection: ${w.twelfthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `4th/residence axis activated: ${w.activatedHouses.includes(4) ? 'Yes' : 'No'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D4 ${w.d4Confirmation ? 'confirms' : 'does not confirm'} residence change`, '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports opportunity' : 'shows no qualifying support'} (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'supports long-term relocation' : 'shows no qualifying activation'} (transit)`, '&darr;',
      'Candidate Foreign Residence Window', '&darr;',
      `Event Classification = ${w.event.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-blue">
        <p><strong>Window:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Reasons:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Rahu/Ketu (secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <p><strong>Event Classification:</strong> ${badge(w.event.label)}</p>
        ${w.careerCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Career Transition:</strong> ${esc(w.careerCrossCheck.interpretation)} (Job Change Timing event: ${esc(w.careerCrossCheck.jobChangeEvent)})</p></div>` : ''}
        <details class="avp-calc"><summary>FOREIGN SETTLEMENT TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="ft-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Foreign Travel', 'Long-Distance Travel', 'Foreign Education', 'Foreign Job', 'Foreign Residence', 'Relocation', 'Permanent Settlement'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.ForeignTravelTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.ForeignTravelTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">No chart/dasha data.</td><td><button type="button" class="ft-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="ft-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.fourthActivation ? 'Yes' : 'No')}</td><td>${badge(v.ninthActivation ? 'Yes' : 'No')}</td><td>${badge(v.tenthActivation ? 'Yes' : 'No')}</td><td>${badge(v.twelfthActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d4Level)}</td><td>${esc(v.d10Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="ft-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="ft-sec-historical">Historical Foreign Travel / Settlement Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous foreign-travel/education/job/residence/relocation/settlement date to see what the method would have shown for it — this validates the method against actual history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="ft-hist-date-input"> <select id="ft-hist-type-select">${typeOptions}</select> <button type="button" id="ft-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>4th</th><th>9th</th><th>10th</th><th>12th</th><th>D4</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="ft-sec-rules">Rules Used</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="ft-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="ft-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#ft-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-ft-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-ft-window'));
      UI.render();
      const el = document.getElementById('ft-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#ft-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#ft-hist-date-input').value;
      const type = root.querySelector('#ft-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.ft-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#ft-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('ft-root');
    if (!root) return;
    const result = window.ForeignTravelTiming.refresh(horizonYears);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Foreign Travel / Settlement Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari foreign travel/settlement timing (no KP or Western technique). Traces the chain: <strong>Natal Foreign Connection &rarr; D4/D10 Confirmation &rarr; Vimshottari Dasha Activation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Event Classification &rarr; Settlement Strength</strong>. 12th-house activation alone, 9th-house activation alone, Rahu alone, and a single transit never produce a foreign-settlement classification; temporary travel is never labeled settlement.</p>',
      renderPromise(result),
      renderD4(result),
      renderD10(result),
      renderCurrentDasha(result),
      renderSettlementStrength(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.ForeignTravelTiming) window.ForeignTravelTiming.init(); };
  UI.init();
  return UI;
})();
