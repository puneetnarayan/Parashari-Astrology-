/* =========================================================
   JOB CHANGE TIMING — rendering layer only.
   Consumes window.JobChangeTiming (engine) and renders into #jc-root.
   Uses this app's EXISTING shared UI conventions (output-box/pastel-*
   panels, .rem-table, quality-good/neutral/bad coloring, avp-calc
   expandable details) — same visual language as Marriage Timing and
   Promotion Timing.
   Namespaced as window.JobChangeTimingUI.
   ========================================================= */

window.JobChangeTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let selectedWindowIndex = null;
  let historicalDates = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l === 'yes') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate') return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no') return 'quality-bad';
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
      <h3 id="jc-sec-promise">Career-Change Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.thirdHouse)}${houseRow(np.sixthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.rahu, 'Rahu')}
          </tbody>
        </table>
      </div>
      <h4>House Relationships</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Relationship</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${relRows}</tbody></table>
      </div>`;
  }

  function renderSignature(r) {
    const s = r.signature;
    const rows = [
      ['Employer / Organization Change', s.employerChange], ['New Opportunity / Better Direction', s.newOpportunity],
      ['Transfer / Workplace Change', s.transfer], ['Foreign Job', s.foreignJob], ['Separation (context-dependent)', s.separation]
    ].map(([label, obj]) => `
      <tr class="${obj.present ? 'quality-good' : ''}">
        <td>${obj.present ? '&check;' : '&mdash;'} ${esc(label)}</td>
        <td>${evidenceDetails('Rules', obj.rules.map(rule => `${rule.id}: ${rule.name}`))}</td>
      </tr>`).join('');
    return `
      <h3 id="jc-sec-signature">Job Change Signature Evidence</h3>
      <div class="output-box pastel-lavender">
        <table class="rem-table"><thead><tr><th>Signature</th><th>Rules</th></tr></thead><tbody>${rows}</tbody></table>
        <p style="font-size:0.85em;color:#777;">D10 level: ${esc(s.d10Level)} (${s.d10Points} supporting factor(s)). This is a checklist of structured evidence, not a numeric score.</p>
      </div>`;
  }

  function renderD10(r) {
    const d10 = r.d10Confirmation;
    return `
      <h3 id="jc-sec-d10">D10 (Dashamsha) Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d10.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D10 Ascendant</td><td>${esc(d10.d10.ascendantSign)} (lord ${esc(d10.d10.lagnaLord)})</td></tr>
          <tr><td>D10 10th</td><td>${esc(d10.d10.tenthSign)} (lord ${esc(d10.d10.tenthLord)})${d10.d10.tenthOccupants.length ? ', occupied by ' + esc(d10.d10.tenthOccupants.join(', ')) : ''}</td></tr>
          <tr><td>D10 6th</td><td>${esc(d10.d10.sixthSign)} (lord ${esc(d10.d10.sixthLord)})${d10.d10.sixthOccupants.length ? ', occupied by ' + esc(d10.d10.sixthOccupants.join(', ')) : ''}</td></tr>
          <tr><td>D10 11th</td><td>${esc(d10.d10.eleventhSign)} (lord ${esc(d10.d10.eleventhLord)})</td></tr>
          <tr><td>D10 12th</td><td>${esc(d10.d10.twelfthSign)} (lord ${esc(d10.d10.twelfthLord)})${d10.d10.twelfthOccupants.length ? ', occupied by ' + esc(d10.d10.twelfthOccupants.join(', ')) : ''}</td></tr>
        </table>
        ${evidenceDetails('Why this D10 level?', d10.evidence)}
        <p style="font-size:0.85em;color:#777;">D10 confirms or qualifies D1 — it never replaces it.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="jc-sec-dasha">Current Career Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Job Change Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="jc-sec-dasha">Current Career Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Change Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD change connection factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct change connection found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    if (!r.candidateWindows.length) {
      return `<h3 id="jc-sec-windows">Candidate Job Change Windows</h3><p><label>Search horizon: <select id="jc-horizon-select">${horizonOptions}</select></label></p><p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient career-change convergence (3rd/6th/9th/10th/11th/12th, Saturn, Sun, or D10).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-jc-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.d10Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="jc-sec-windows">Candidate Job Change Windows</h3>
      <p><label>Search horizon: <select id="jc-horizon-select">${horizonOptions}</select></label></p>
      <div class="output-box pastel-pink" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th>Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="jc-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Career Change Promise', '&darr;',
      `10th lord connected with 12th/6th/3rd/9th: ${w.tenthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      'Career + change relationship identified', '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `Houses activated: ${w.activatedHouses.join(', ') || 'none'}`, '&darr;',
      `D10 ${w.d10Confirmation ? 'confirms' : 'does not confirm'} career transition`, '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports' : 'does not support'} new opportunity (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'activates organizational responsibility/change' : 'shows no qualifying activation'} (transit)`, '&darr;',
      'Candidate Window', '&darr;',
      `Event Classification = ${w.event.label}`
    ].join('<br>');
    const pc = w.promotionComparison;
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
        <p><strong>Rahu/Ketu (secondary confirmation):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <p><strong>Adverse/separation context:</strong> ${w.adverse.flags.length ? esc(w.adverse.flags.join(' ')) : 'None found.'}</p>
        <p><strong>Event Classification:</strong> ${badge(w.event.label)}</p>
        ${pc ? `<div class="output-box pastel-blue"><p><strong>Promotion vs. Job Change — overlapping period detected</strong></p><p>Promotion indicators: ${badge(pc.promotionStrength)} (${esc(pc.promotionEvent)})</p><p>Job-change indicators: ${badge(pc.jobChangeStrength)}</p><p>${esc(pc.interpretation)}</p></div>` : ''}
        <details class="avp-calc"><summary>JOB CHANGE TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="jc-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const rows = historicalDates.map((dateStr, i) => {
      const chart = window.JobChangeTiming.getChartData();
      const eventDate = new Date(dateStr + 'T12:00:00Z');
      const v = chart ? window.JobChangeTiming.validateHistoricalDate(eventDate) : null;
      if (!v) return `<tr><td>${esc(dateStr)}</td><td colspan="9">No chart/dasha data.</td><td><button type="button" class="jc-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(dateStr)}</td><td colspan="9">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="jc-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(dateStr)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.thirdActivation ? 'Yes' : 'No')}</td><td>${badge(v.sixthActivation ? 'Yes' : 'No')}</td><td>${badge(v.ninthActivation ? 'Yes' : 'No')}</td>
          <td>${badge(v.tenthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td><td>${badge(v.twelfthActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d10Level)}</td>
          <td><button type="button" class="jc-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="jc-sec-historical">Historical Job Change Validation</h3>
      <div class="output-box pastel-blue">
        <p>Enter a known previous job-change date to see what the method would have shown for it — this validates the method against actual career history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="jc-hist-date-input"> <button type="button" id="jc-hist-add-btn">Add Event Date</button></p>
        ${historicalDates.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>MD</th><th>AD</th><th>PD</th><th>3rd</th><th>6th</th><th>9th</th><th>10th</th><th>11th</th><th>12th</th><th>D10</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="jc-sec-rules">Rules Used</h3><div class="output-box pastel-mint">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="jc-sec-log">Calculation Log</h3><div class="output-box pastel-peach"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="jc-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#jc-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-jc-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-jc-window'));
      UI.render();
      const el = document.getElementById('jc-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#jc-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#jc-hist-date-input').value;
      if (val && !historicalDates.includes(val)) { historicalDates.push(val); UI.render(); }
    });
    root.querySelectorAll('.jc-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalDates.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#jc-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('jc-root');
    if (!root) return;
    const result = window.JobChangeTiming.refresh(horizonYears);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Job Change Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari job-change timing (no KP or Western technique). Traces the chain: <strong>Natal Career-Change Promise &rarr; Change Signature &rarr; D10 Confirmation &rarr; Vimshottari Dasha Activation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Event Classification</strong>. Promotion within the same organization, routine salary increment, and ordinary transfer are NOT classified as job change here — those are covered by the separate Promotion Timing tab.</p>',
      renderPromise(result),
      renderSignature(result),
      renderD10(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.JobChangeTiming) window.JobChangeTiming.init(); };
  UI.init();
  return UI;
})();
