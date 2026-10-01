/* =========================================================
   SPIRITUAL TURNING POINT TIMING — rendering layer only. Consumes
   window.SpiritualTurningPointTiming (engine) and renders into
   #spirit-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — same visual language as
   every other timing tab.
   Namespaced as window.SpiritualTurningPointTimingUI.
   ========================================================= */

window.SpiritualTurningPointTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let minSupport = 'All';
  let stageFilter = 'All';
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes' || l === 'clearly present') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial') || l === 'present') return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('unavailable') || l.includes('limited')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderDisclaimer() {
    return `<div class="output-box pastel-yellow" style="font-size:0.85em;"><strong>Note:</strong> This module offers an interpretive astrological timing perspective only. It does not diagnose mental-health conditions, guarantee enlightenment or liberation, declare spiritual superiority, or recommend a specific religion or guru. It is not a substitute for qualified medical or psychological care.</div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="spirit-sec-promise">Natal Spiritual Development Indicators</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.potential)}</strong></p>
        ${evidenceDetails('Why this potential level?', np.reasons)}
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.firstHouse)}${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.fifthHouse)}${houseRow(np.eighthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.ketu, 'Ketu')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.rahu, 'Rahu')}
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">Rahu and Ketu are never treated as automatically spiritual — their role depends on house ownership, placement, relationships, dasha, and transit. This is not a personality judgment about whether the person is "spiritual" or "non-spiritual."</p>
      </div>
      <h4 id="spirit-sec-signature">Spiritual House Relationship Signatures</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
          ${np.relationships.map(rel => `
          <tr class="${rel.connected ? 'quality-good' : ''}">
            <td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td>
          </tr>`).join('')}
          ${np.convergenceSignatures.map(p => `
          <tr class="${p.present ? 'quality-good' : ''}">
            <td>${esc(p.rule.name)}</td><td>${p.present ? 'Present' : 'Not present'}</td><td>${evidenceDetails('Evidence', [p.evidence])}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="spirit-sec-dasha">Current Spiritual Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Spiritual Turning Point Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="spirit-sec-dasha">Current Spiritual Indicators</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Spiritual-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct spiritual-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const supportOptions = ['All', 'Moderately Supportive', 'Supportive', 'Strongly Supportive'].map(s => `<option value="${esc(s)}" ${s === minSupport ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const stages = ['All', 'Interest / Awakening', 'Study', 'Practice', 'Pilgrimage / Teacher', 'Transformation', 'Detachment', 'Service', 'Integration'];
    const stageOptions = stages.map(s => `<option value="${esc(s)}" ${s === stageFilter ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="spirit-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Support: <select id="spirit-support-select">${supportOptions}</select></label> &nbsp; <label>Spiritual Stage: <select id="spirit-stage-select">${stageOptions}</select></label></p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="spirit-sec-windows">Upcoming Spiritual Turning Points</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence for a spiritual turning-point window.</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-spirit-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${badge(w.strength.label)}</td>
        <td>${esc(w.stage.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="spirit-sec-windows">Upcoming Spiritual Turning Points</h3>
      ${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Key Houses</th><th>Jupiter</th><th>Saturn</th><th>Support</th><th>Stage</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="spirit-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Step 1 — Natal Spiritual Factors established', '&darr;',
      `Step 2 — Mahadasha = ${w.mahadasha}, Antardasha = ${w.antardasha}, Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `Houses activated: ${w.activatedHouses.join(', ')}`, '&darr;',
      `Step 3 — Spiritual Stage = ${w.stage.label}`, '&darr;',
      `Step 4 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}, Rahu ${w.transit.rahu.active ? 'active (secondary)' : 'not active'}, Ketu ${w.transit.ketu.active ? 'active (secondary)' : 'not active'}`, '&darr;',
      `Step 5 — Window included: Support = ${w.strength.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-blue">
        <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Stage:</strong> ${badge(w.stage.label)}</p>
        <p><strong>Support:</strong> ${badge(w.strength.label)}</p>
        <p><strong>Why this period:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        ${w.cautions.length ? `<p><strong>Caution / mixed factors:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Rahu/Ketu (secondary only):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        ${w.guruConnection ? `<div class="output-box pastel-peach"><p><strong>Guru/Teacher Connection:</strong> ${esc(w.guruConnection.interpretation)}</p></div>` : ''}
        ${w.pilgrimageCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Pilgrimage / Sacred Travel:</strong> ${esc(w.pilgrimageCrossCheck.interpretation)} (Foreign Travel Timing event: ${esc(w.pilgrimageCrossCheck.foreignTravelEvent)})</p></div>` : ''}
        <details class="avp-calc"><summary>SPIRITUAL TURNING POINT TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.stage.label)}</span>
      </div>`).join('');
    return `<h4 id="spirit-sec-timeline">Spiritual Development Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Meditation Practice Started', 'Mantra Practice Started', 'Pilgrimage', 'Spiritual Course/Study', 'Teacher/Guru Connection', 'Retreat', 'Major Philosophical Shift', 'Service Activity'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.SpiritualTurningPointTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.SpiritualTurningPointTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">No chart/dasha data.</td><td><button type="button" class="spirit-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="spirit-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.fifthActivation ? 'Yes' : 'No')}</td><td>${badge(v.ninthActivation ? 'Yes' : 'No')}</td><td>${badge(v.twelfthActivation ? 'Yes' : 'No')}</td>
          <td>${badge(v.jupiterActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="spirit-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="spirit-sec-historical">Historical Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous meditation/pilgrimage/teacher-connection/retreat date to see what the method would have shown for it — this is empirical testing of the implementation, not proof of astrological certainty. No private beliefs are requested or stored.</p>
        <p><input type="date" id="spirit-hist-date-input"> <select id="spirit-hist-type-select">${typeOptions}</select> <button type="button" id="spirit-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>5th</th><th>9th</th><th>12th</th><th>Jupiter</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="spirit-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="spirit-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="spirit-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#spirit-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    const supportSelect = root.querySelector('#spirit-support-select');
    if (supportSelect) supportSelect.addEventListener('change', () => { minSupport = supportSelect.value; selectedWindowIndex = null; UI.render(); });

    const stageSelect = root.querySelector('#spirit-stage-select');
    if (stageSelect) stageSelect.addEventListener('change', () => { stageFilter = stageSelect.value; selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-spirit-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-spirit-window'));
      UI.render();
      const el = document.getElementById('spirit-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#spirit-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#spirit-hist-date-input').value;
      const type = root.querySelector('#spirit-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.spirit-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#spirit-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('spirit-root');
    if (!root) return;
    const result = window.SpiritualTurningPointTiming.refresh(horizonYears, minSupport, stageFilter);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Spiritual Turning Point Timing analysis.</p>' + renderDisclaimer();
      return;
    }
    root.innerHTML = [
      renderDisclaimer(),
      '<p>Parashari/Vimshottari spiritual-development timing (no KP or Western technique). Traces: <strong>Natal Spiritual Factors &rarr; Dasha Activation &rarr; Spiritual Stage &rarr; Transit Confirmation &rarr; Final Candidate Window</strong>. Not every 9th/12th-house activation is interpreted as spiritual transformation, and 12th-house activation is never automatically classified as renunciation. This module never claims enlightenment, identifies a specific guru, or recommends a specific religion.</p>',
      renderPromise(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.SpiritualTurningPointTiming) window.SpiritualTurningPointTiming.init(); };
  UI.init();
  return UI;
})();
