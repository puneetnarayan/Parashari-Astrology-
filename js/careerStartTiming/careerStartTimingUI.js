/* =========================================================
   CAREER START / FIRST JOB TIMING — rendering layer only.
   Consumes window.CareerStartTiming (engine) and renders into
   #cs-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — same visual language as
   Marriage/Promotion/Job Change Timing.
   Namespaced as window.CareerStartTimingUI.
   ========================================================= */

window.CareerStartTimingUI = (function () {
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
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('partial')) return 'quality-neutral';
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
      <h3 id="cs-sec-promise">Career Entry Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.sixthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}
            ${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.jupiter, 'Jupiter')}
          </tbody>
        </table>
      </div>
      <h4>Career Start Indicators (House Relationships)</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${relRows}</tbody></table>
      </div>`;
  }

  function renderEmploymentVsBusiness(r) {
    const e = r.employmentVsBusiness;
    return `
      <h3 id="cs-sec-type">Employment vs. Business</h3>
      <div class="output-box pastel-lavender">
        <p><strong>Career Entry Type:</strong> ${badge(e.careerEntryType)}</p>
        <p>Employment score: ${e.employmentScore} &nbsp; Business score: ${e.businessScore}</p>
        ${evidenceDetails('Employment evidence', e.employmentEvidence)}
        ${evidenceDetails('Business evidence', e.businessEvidence)}
      </div>`;
  }

  function renderEducationCrossCheck() {
    const rule = (window.CAREER_START_TIMING_RULES || []).find(r => r.id === 'CS-EDUCATION-001');
    return `
      <h3 id="cs-sec-education">Education-to-Career Transition</h3>
      <div class="output-box pastel-peach">
        <p style="font-size:0.9em;color:#555;">This application does not currently have a dedicated Education Timing or D24 (Siddhamsha) module. Per this module's design, no duplicate education-completion calculation was created. The 9th-lord↔10th-lord and 5th↔10th house relationships shown in the Career Entry Promise above are used as the available proxy evidence for an education-to-career transition.</p>
        ${rule ? evidenceDetails('Why no dedicated education engine?', [rule.description, rule.explanation]) : ''}
      </div>`;
  }

  function renderD10(r) {
    const d10 = r.d10Confirmation;
    return `
      <h3 id="cs-sec-d10">D10 (Dashamsha) Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d10.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D10 Ascendant</td><td>${esc(d10.d10.ascendantSign)} (lord ${esc(d10.d10.lagnaLord)})</td></tr>
          <tr><td>D10 6th</td><td>${esc(d10.d10.sixthSign)} (lord ${esc(d10.d10.sixthLord)})${d10.d10.sixthOccupants.length ? ', occupied by ' + esc(d10.d10.sixthOccupants.join(', ')) : ''}</td></tr>
          <tr><td>D10 10th</td><td>${esc(d10.d10.tenthSign)} (lord ${esc(d10.d10.tenthLord)})${d10.d10.tenthOccupants.length ? ', occupied by ' + esc(d10.d10.tenthOccupants.join(', ')) : ''}</td></tr>
          <tr><td>D10 11th</td><td>${esc(d10.d10.eleventhSign)} (lord ${esc(d10.d10.eleventhLord)})${d10.d10.eleventhOccupants.length ? ', occupied by ' + esc(d10.d10.eleventhOccupants.join(', ')) : ''}</td></tr>
        </table>
        ${evidenceDetails('Why this D10 level?', d10.evidence)}
        <p style="font-size:0.85em;color:#777;">D10 confirms or qualifies D1 — it never replaces it.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="cs-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Career Start Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="cs-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-pink">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Career-Start Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD career-start connection factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct career-start connection found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    if (!r.candidateWindows.length) {
      return `<h3 id="cs-sec-windows">First Job Windows</h3><p><label>Search horizon: <select id="cs-horizon-select">${horizonOptions}</select></label></p><p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient career-start convergence (2nd/3rd/6th/9th/10th/11th, Saturn, Sun, or D10).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-cs-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.sixthConnection ? 'Yes' : 'No'}</td>
        <td>${w.d10Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="cs-sec-windows">First Job Windows</h3>
      <p><label>Search horizon: <select id="cs-horizon-select">${horizonOptions}</select></label></p>
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>Employment (6th)</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th>Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="cs-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Career Promise', '&darr;',
      `6th house supports service: ${w.sixthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `10th house supports profession: ${w.tenthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `11th house supports realization/gain: ${w.eleventhConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D10 ${w.d10Confirmation ? 'confirms' : 'does not confirm'} professional entry`, '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports opportunity' : 'shows no qualifying support'} (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'supports formal employment' : 'shows no qualifying activation'} (transit)`, '&darr;',
      `Candidate ${w.stage.stage} Window`, '&darr;',
      `Event Classification = ${w.event.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-blue">
        <p><strong>Window:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Stage:</strong> ${badge(w.stage.stage)}</p>
        <p><strong>Reasons:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Event Classification:</strong> ${badge(w.event.label)}</p>
        <details class="avp-calc"><summary>FIRST JOB TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.stage.stage)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="cs-sec-timeline">Career Entry Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['First Job', 'Internship / Apprenticeship', 'First Professional Appointment', 'Business Start'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.CareerStartTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.CareerStartTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">No chart/dasha data.</td><td><button type="button" class="cs-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="cs-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.secondActivation ? 'Yes' : 'No')}</td><td>${badge(v.sixthActivation ? 'Yes' : 'No')}</td>
          <td>${badge(v.tenthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d10Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="cs-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="cs-sec-historical">Historical Career Start Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter the actual first-job date (or an internship/appointment/business-start date) to see what the method would have shown for it — this validates the method against actual career history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="cs-hist-date-input"> <select id="cs-hist-type-select">${typeOptions}</select> <button type="button" id="cs-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>2nd</th><th>6th</th><th>10th</th><th>11th</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="cs-sec-rules">Rules Used</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="cs-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="cs-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#cs-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-cs-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-cs-window'));
      UI.render();
      const el = document.getElementById('cs-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#cs-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#cs-hist-date-input').value;
      const type = root.querySelector('#cs-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.cs-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#cs-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('cs-root');
    if (!root) return;
    const result = window.CareerStartTiming.refresh(horizonYears);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Career Start / First Job Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari career-start timing (no KP or Western technique). Traces the chain: <strong>Natal Career-Start Promise &rarr; Employment-vs-Business &rarr; D10 Confirmation &rarr; Vimshottari Dasha Activation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Event Classification</strong>. School/college part-time work, casual temporary work, minor internships, and family assistance are NOT automatically classified as the first career event.</p>',
      renderPromise(result),
      renderEmploymentVsBusiness(result),
      renderEducationCrossCheck(),
      renderD10(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.CareerStartTiming) window.CareerStartTiming.init(); };
  UI.init();
  return UI;
})();
