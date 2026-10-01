/* =========================================================
   CHILDBIRTH TIMING — rendering layer only.
   Consumes window.ChildbirthTiming (engine) and renders into
   #cb-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — same visual language as
   every other timing tab.

   SENSITIVITY NOTE: this file always renders the medical-boundary
   notice and never adds language stronger than the engine's own
   ("astrologically supportive", "candidate window") — no "guaranteed",
   "definitely", or medical/fertility claims are introduced here, and
   no child-gender prediction UI exists.

   Namespaced as window.ChildbirthTimingUI.
   ========================================================= */

window.ChildbirthTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }
  let partnerResult = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('supportive') || l === 'yes') return 'quality-good';
    if (l.includes('mixed') || l.includes('mildly') || l === 'candidate' || l.includes('partial')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderMedicalNotice() {
    return `<div class="output-box pastel-yellow" style="border:1px solid #e0c200;">
      <p style="margin:0;"><strong>Important:</strong> This is an astrological timing analysis, not a medical fertility or pregnancy assessment. Conception, pregnancy and childbirth depend on biological and medical factors. Use qualified medical care for health decisions.</p>
    </div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    const relRows = np.relationships.map(rel => `
      <tr class="${rel.connected ? 'quality-good' : ''}">
        <td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td>
      </tr>`).join('');
    return `
      <h3 id="cb-sec-promise">Childbirth Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Astrological Indication</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.fifthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.eleventhHouse)}
            ${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.saturn, 'Saturn')}
          </tbody>
        </table>
      </div>
      <h4>Childbirth Indicators (House Relationships)</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${relRows}</tbody></table>
      </div>`;
  }

  function renderD7(r) {
    const d7 = r.d7Confirmation;
    return `
      <h3 id="cb-sec-d7">D7 (Saptamsha) Confirmation</h3>
      <div class="output-box pastel-lavender">
        <p><strong>${esc(d7.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D7 Ascendant</td><td>${esc(d7.d7.ascendantSign)} (lord ${esc(d7.d7.lagnaLord)})</td></tr>
          <tr><td>D7 5th</td><td>${esc(d7.d7.fifthSign)} (lord ${esc(d7.d7.fifthLord)})${d7.d7.fifthOccupants.length ? ', occupied by ' + esc(d7.d7.fifthOccupants.join(', ')) : ''}</td></tr>
          <tr><td>D7 9th</td><td>${esc(d7.d7.ninthSign)} (lord ${esc(d7.d7.ninthLord)})</td></tr>
          <tr><td>D7 11th</td><td>${esc(d7.d7.eleventhSign)} (lord ${esc(d7.d7.eleventhLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D7 level?', d7.evidence)}
        <p style="font-size:0.85em;color:#777;">D7 confirms or qualifies D1 — it never replaces it.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="cb-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Childbirth Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supportive') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="cb-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Childbirth-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct children-promise connection found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    if (!r.candidateWindows.length) {
      return `<h3 id="cb-sec-windows">Candidate Windows</h3><p><label>Search horizon: <select id="cb-horizon-select">${horizonOptions}</select></label></p><p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient astrological convergence (2nd/5th/9th/11th, Jupiter, or D7). This reflects the classical house/Dasha analysis available — it is not a statement about actual fertility or family planning.</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-cb-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.d7Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="cb-sec-windows">Candidate Windows</h3>
      <p><label>Search horizon: <select id="cb-horizon-select">${horizonOptions}</select></label></p>
      <div class="output-box pastel-pink" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>5th Activation</th><th>Jupiter</th><th>D7</th><th>Saturn</th><th>Event Type</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="cb-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Promise', '&darr;',
      '5th house / 5th lord analysed', '&darr;',
      `Jupiter ${w.fifthConnection ? 'supports' : 'shows limited connection to'} progeny indication`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D7 ${w.d7Confirmation ? 'confirms' : 'does not confirm'} child-related promise`, '&darr;',
      `Jupiter transit ${w.transit.jupiter.active ? 'supports' : 'does not support'} the 5th`, '&darr;',
      `Saturn transit ${w.transit.saturn.active ? 'provides contextual timing' : 'shows no qualifying activation'}`, '&darr;',
      'Candidate Childbirth Window', '&darr;',
      `Classification = ${w.event.label}`
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
        <p><strong>Rahu/Ketu (secondary, optional):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <p><strong>Classification:</strong> ${badge(w.event.label)}</p>
        <p style="font-size:0.85em;color:#777;">This classification describes an astrologically supportive period, not a medical prediction of conception, pregnancy, or delivery.</p>
        <details class="avp-calc"><summary>CHILDBIRTH TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="cb-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderPartnerCrossCheck(r) {
    let resultBlock = '';
    if (partnerResult) {
      const comparison = window.ChildbirthTiming.compareWithPartner(r.natalPromise, partnerResult);
      resultBlock = `
        <div class="output-box pastel-peach">
          <p><strong>Partner chart 5th house:</strong> ${badge(partnerResult.promise.fifthHouse.result)} &nbsp; <strong>Partner D7:</strong> ${esc(partnerResult.d7.level)}</p>
          <p><strong>Convergence with primary chart:</strong> ${esc(comparison.interpretation)}</p>
          ${comparison.convergence.length ? evidenceDetails('Convergence factors', comparison.convergence) : ''}
        </div>`;
    }
    return `
      <h3 id="cb-sec-partner">Optional Spouse/Partner Cross-Check</h3>
      <div class="output-box pastel-blue">
        <p style="font-size:0.9em;color:#555;">Optional — enter a partner's birth details to see whether their chart independently shows converging astrological support. This is not required to produce a result from the primary chart above.</p>
        <p>
          Date <input type="date" id="cb-partner-date"> Time <input type="time" id="cb-partner-time" step="1">
          Lat <input type="number" id="cb-partner-lat" step="0.0001" size="8"> Lon <input type="number" id="cb-partner-lon" step="0.0001" size="8">
          UTC offset <input type="text" id="cb-partner-offset" placeholder="+5:30" size="6">
          <button type="button" id="cb-partner-check-btn">Check Convergence</button>
        </p>
        ${resultBlock}
      </div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Childbirth', 'Conception/Pregnancy Confirmation', 'Second Child', 'Subsequent Child'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.ChildbirthTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.ChildbirthTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">No chart/dasha data.</td><td><button type="button" class="cb-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="cb-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.secondActivation ? 'Yes' : 'No')}</td><td>${badge(v.fifthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${badge(v.jupiterNatalConnection ? 'Yes' : 'No')}</td><td>${esc(v.d7Level)}</td><td>${badge(v.jupiterTransitActive ? 'Active' : 'No')}</td><td>${badge(v.saturnTransitActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="cb-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="cb-sec-historical">Historical Childbirth Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter an actual childbirth date (or a conception/pregnancy confirmation, second, or subsequent child date) to see what the method would have shown for it — this validates the method against actual family history only and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="cb-hist-date-input"> <select id="cb-hist-type-select">${typeOptions}</select> <button type="button" id="cb-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>2nd</th><th>5th</th><th>11th</th><th>Jupiter</th><th>D7</th><th>Jupiter Transit</th><th>Saturn Transit</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="cb-sec-rules">Rules Used</h3><div class="output-box pastel-mint">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="cb-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="cb-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#cb-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-cb-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-cb-window'));
      UI.render();
      const el = document.getElementById('cb-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const partnerBtn = root.querySelector('#cb-partner-check-btn');
    if (partnerBtn) partnerBtn.addEventListener('click', () => {
      try {
        const dateStr = root.querySelector('#cb-partner-date').value;
        const timeStr = root.querySelector('#cb-partner-time').value || '00:00:00';
        const lat = parseFloat(root.querySelector('#cb-partner-lat').value);
        const lon = parseFloat(root.querySelector('#cb-partner-lon').value);
        const offsetStr = root.querySelector('#cb-partner-offset').value || '+0:00';
        if (!dateStr || isNaN(lat) || isNaN(lon)) { alert('Enter a valid partner date, latitude, and longitude.'); return; }
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute, second] = timeStr.split(':').map(Number);
        const offsetMinutes = parseUtcOffsetToMinutes(offsetStr);
        const birthUtc = offsetLocalToUtc(year, month, day, hour, minute || 0, offsetMinutes);
        partnerResult = window.ChildbirthTiming.assessPartnerChart(birthUtc, lat, lon);
        UI.render();
      } catch (e) {
        alert('Could not compute the partner chart: ' + e.message);
      }
    });

    const addHistBtn = root.querySelector('#cb-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#cb-hist-date-input').value;
      const type = root.querySelector('#cb-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.cb-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#cb-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('cb-root');
    if (!root) return;
    const result = window.ChildbirthTiming.refresh(horizonYears);
    if (!result) {
      root.innerHTML = renderMedicalNotice() + '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Childbirth Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      renderMedicalNotice(),
      '<p>Parashari/Vimshottari childbirth timing (no KP or Western technique). Traces the chain: <strong>Natal Promise &rarr; D7 Confirmation &rarr; Vimshottari Dasha Activation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Classification</strong>. This module never produces a guaranteed-pregnancy claim, a medical fertility diagnosis, or a child-gender prediction — only astrologically supportive periods and candidate windows.</p>',
      renderPromise(result),
      renderD7(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderPartnerCrossCheck(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.ChildbirthTiming) window.ChildbirthTiming.init(); };
  UI.init();
  return UI;
})();
