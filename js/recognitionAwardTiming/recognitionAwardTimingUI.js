/* =========================================================
   RECOGNITION / AWARD TIMING — rendering layer only. Consumes
   window.RecognitionAwardTiming (engine) and renders into #rec-root.
   Uses this app's EXISTING shared UI conventions (output-box/
   pastel-* panels, .rem-table, quality-good/neutral/bad coloring,
   avp-calc expandable details) — same visual language as every
   other timing tab.
   Namespaced as window.RecognitionAwardTimingUI.
   ========================================================= */

window.RecognitionAwardTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let eventFilter = 'All';
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('unavailable')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="rec-sec-promise">Natal Recognition Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <p><strong>Visibility:</strong> ${esc(np.visibilityNote)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.firstHouse)}${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.fifthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.seventhHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.sun, 'Sun')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.saturn, 'Saturn')}
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">The 12th house is never automatically treated as negative. This module never claims "you will definitely win an award" — recognition potential and recognition timing are distinguished.</p>
      </div>
      <h4 id="rec-sec-signature">Professional Recognition / Award / Public / Achievement Signatures</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
          ${np.relationships.map(rel => `
          <tr class="${rel.connected ? 'quality-good' : ''}">
            <td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td>
          </tr>`).join('')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">No single combination is treated as a guarantee of an award — see Candidate Windows below.</p>
      </div>`;
  }

  function renderRecognitionType(r) {
    const t = r.recognitionType;
    return `
      <h3 id="rec-sec-type">Recognition Type Classification</h3>
      <div class="output-box pastel-lavender">
        <p>${t.types.map(x => badge(x)).join(' ')}</p>
        <p style="font-size:0.85em;color:#777;">${esc(t.note)}</p>
      </div>`;
  }

  function renderD10(r) {
    const d10 = r.d10Confirmation;
    if (!d10.available) return `<h3 id="rec-sec-d10">D10 (Dashamsha) Confirmation</h3><p style="color:#a33;">D10 confirmation is unavailable for this chart.</p>`;
    return `
      <h3 id="rec-sec-d10">D10 (Dashamsha) Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d10.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D10 Ascendant</td><td>${esc(d10.d10.ascendantSign)} (lord ${esc(d10.d10.lagnaLord)})</td></tr>
          <tr><td>D10 5th</td><td>${esc(d10.d10.fifthSign)} (lord ${esc(d10.d10.fifthLord)})</td></tr>
          <tr><td>D10 9th</td><td>${esc(d10.d10.ninthSign)} (lord ${esc(d10.d10.ninthLord)})</td></tr>
          <tr><td>D10 10th</td><td>${esc(d10.d10.tenthSign)} (lord ${esc(d10.d10.tenthLord)})</td></tr>
          <tr><td>D10 11th</td><td>${esc(d10.d10.eleventhSign)} (lord ${esc(d10.d10.eleventhLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D10 level?', d10.evidence)}
        <p style="font-size:0.85em;color:#777;">D10 confirms or qualifies D1's professional-recognition promise — it never replaces D1. For academic recognition, see the Higher Education cross-check in each window's detail (D24 calculations are never duplicated here).</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="rec-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Recognition / Award Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="rec-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Recognition-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct recognition-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const eventTypes = ['All', 'Professional Recognition', 'Formal Award', 'Public Recognition', 'Institutional Honor', 'Career Achievement Recognition', 'Academic / Professional Recognition', 'Post-Retirement Recognition'];
    const eventOptions = eventTypes.map(t => `<option value="${esc(t)}" ${t === eventFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    const controls = `<p><label>Forecast Period: <select id="rec-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Recognition Event: <select id="rec-type-select">${eventOptions}</select></label></p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="rec-sec-windows">Recognition / Award Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient recognition convergence (1st/2nd/3rd/5th/6th/7th/9th/10th/11th/12th, or D10).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-rec-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.d10Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${badge(w.strength.label)}</td>
        <td>${esc(w.stage.label)}</td>
        <td>${w.event.labels.map(l => badge(l)).join(' ')}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="rec-sec-windows">Recognition / Award Windows</h3>
      ${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>Activation</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th>Strength</th><th>Stage</th><th>Recognition Type</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="rec-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Recognition Promise', '&darr;',
      `10th connection: ${w.tenthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D10 ${w.d10Confirmation ? 'confirms' : 'does not confirm'} professional recognition`, '&darr;',
      w.academicCrossCheck ? 'D24/Higher Education cross-check: academic recognition also indicated' : 'D24/Higher Education cross-check: no overlap', '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports honour/recognition' : 'shows no qualifying support'} (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'supports long-service/sustained-work recognition' : 'shows no qualifying activation'} (transit)`, '&darr;',
      'Candidate Recognition Window', '&darr;',
      `Recognition Stage = ${w.stage.label}`, '&darr;',
      `Recognition Classification = ${w.event.labels.join(', ')}`
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
        <p><strong>Secondary transits:</strong> Sun ${badge(w.transit.sun.active ? 'Active' : 'Not active')}, Venus ${badge(w.transit.venus.active ? 'Active' : 'Not active')}, Mercury ${badge(w.transit.mercury.active ? 'Active' : 'Not active')}, Moon ${badge(w.transit.moon.active ? 'Active' : 'Not active')}, Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <p><strong>Window Strength:</strong> ${badge(w.strength.label)}</p>
        <p><strong>Recognition Stage:</strong> ${badge(w.stage.label)}</p>
        <p><strong>Recognition Classification:</strong> ${w.event.labels.map(l => badge(l)).join(' ')}</p>
        ${w.promotionCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Vs. Promotion:</strong> ${esc(w.promotionCrossCheck.interpretation)} (Promotion Timing event: ${esc(w.promotionCrossCheck.promotionEvent)})</p></div>` : ''}
        ${w.financialCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Vs. Financial Gain:</strong> ${esc(w.financialCrossCheck.interpretation)} (Financial Gain Timing event: ${esc(w.financialCrossCheck.financialEvent)})</p></div>` : ''}
        ${w.academicCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Academic Recognition:</strong> ${esc(w.academicCrossCheck.interpretation)} (Higher Education Timing event: ${esc(w.academicCrossCheck.academicEvent)})</p></div>` : ''}
        ${w.retirementCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Post-Retirement Recognition:</strong> ${esc(w.retirementCrossCheck.interpretation)} (Retirement Timing event: ${esc(w.retirementCrossCheck.retirementEvent)})</p></div>` : ''}
        <details class="avp-calc"><summary>RECOGNITION / AWARD TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.labels.join(', '))}</span>
      </div>`).join('');
    return `<h4 id="rec-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Award Date', 'Recognition Date', 'Nomination', 'Professional Appreciation', 'Institutional Honour', 'Public Recognition', 'Long-Service Recognition'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.RecognitionAwardTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.RecognitionAwardTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">No chart/dasha data.</td><td><button type="button" class="rec-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="rec-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.tenthActivation ? 'Yes' : 'No')}</td><td>${badge(v.ninthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d10Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="rec-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="rec-sec-historical">Historical Recognition / Award Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous award/recognition/nomination date to see what the method would have shown for it — this validates the method against actual history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="rec-hist-date-input"> <select id="rec-hist-type-select">${typeOptions}</select> <button type="button" id="rec-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>10th</th><th>9th</th><th>11th</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="rec-sec-rules">Rules Used</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="rec-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="rec-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#rec-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    const typeSelect = root.querySelector('#rec-type-select');
    if (typeSelect) typeSelect.addEventListener('change', () => { eventFilter = typeSelect.value; selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-rec-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-rec-window'));
      UI.render();
      const el = document.getElementById('rec-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#rec-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#rec-hist-date-input').value;
      const type = root.querySelector('#rec-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.rec-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#rec-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('rec-root');
    if (!root) return;
    const result = window.RecognitionAwardTiming.refresh(horizonYears, eventFilter);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Recognition / Award Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari recognition/award timing (no KP or Western technique). Traces the chain: <strong>Natal Recognition Promise &rarr; Recognition Type &rarr; Dasha Activation &rarr; D10/Relevant Confirmation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Recognition Event Classification</strong>. Recognition is always shown separately from Promotion and from Financial Gain — an award is never assumed to produce money, and a recognition period is never collapsed into a promotion event. 10th/11th activation alone, a single transit, or a single karaka never produces an award classification.</p>',
      renderPromise(result),
      renderRecognitionType(result),
      renderD10(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.RecognitionAwardTiming) window.RecognitionAwardTiming.init(); };
  UI.init();
  return UI;
})();
