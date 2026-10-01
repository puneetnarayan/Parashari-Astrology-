/* =========================================================
   BUSINESS START TIMING — rendering layer only. Consumes
   window.BusinessStartTiming (engine) and renders into #bus-root.
   Uses this app's EXISTING shared UI conventions (output-box/
   pastel-* panels, .rem-table, quality-good/neutral/bad coloring,
   avp-calc expandable details) — same visual language as every
   other timing tab.
   Namespaced as window.BusinessStartTimingUI.
   ========================================================= */

window.BusinessStartTimingUI = (function () {
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
      <h3 id="bus-sec-promise">Natal Business Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fifthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.seventhHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.mars, 'Mars')}${karakaRow(np.rahu, 'Rahu')}
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">6th-house involvement is never automatically read as negative; Rahu is never treated as automatically positive or negative; Saturn is never defaulted to a negative reading.</p>
      </div>
      <h4 id="bus-sec-signature">Business Formation / Entrepreneurship / Profit Signatures</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
          ${np.relationships.map(rel => `
          <tr class="${rel.connected ? 'quality-good' : ''}">
            <td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td>
          </tr>`).join('')}
          ${np.profitSignatures.map(p => `
          <tr class="${p.present ? 'quality-good' : ''}">
            <td>${esc(p.rule.name)}</td><td>${p.present ? 'Present' : 'Not present'}</td><td>${evidenceDetails('Evidence', [p.evidence])}</td>
          </tr>`).join('')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">No single house connection alone is treated as sufficient for business-start confirmation — see Candidate Windows below.</p>
      </div>`;
  }

  function renderTendency(r) {
    const e = r.employmentVsBusiness;
    return `
      <h3 id="bus-sec-tendency">Employment vs. Business vs. Independent-Professional Tendency</h3>
      <div class="output-box pastel-lavender">
        <p><strong>${esc(e.tendency)}</strong></p>
        <table class="rem-table">
          <thead><tr><th>Tendency</th><th>Supporting Evidence</th></tr></thead>
          <tbody>
            <tr><td>Employment / Service</td><td>${evidenceDetails('Evidence', e.employmentEvidence)}</td></tr>
            <tr><td>Business / Entrepreneurship</td><td>${evidenceDetails('Evidence', e.businessEvidence)}</td></tr>
            <tr><td>Independent Professional Practice</td><td>${evidenceDetails('Evidence', e.independentEvidence)}</td></tr>
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">This is a chart indication only, never a deterministic statement about which path a person must follow.</p>
      </div>`;
  }

  function renderD10(r) {
    const d10 = r.d10Confirmation;
    return `
      <h3 id="bus-sec-d10">D10 (Dashamsha) Business/Profession Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d10.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D10 Ascendant</td><td>${esc(d10.d10.ascendantSign)} (lord ${esc(d10.d10.lagnaLord)})</td></tr>
          <tr><td>D10 2nd</td><td>${esc(d10.d10.secondSign)} (lord ${esc(d10.d10.secondLord)})</td></tr>
          <tr><td>D10 7th</td><td>${esc(d10.d10.seventhSign)} (lord ${esc(d10.d10.seventhLord)})</td></tr>
          <tr><td>D10 10th</td><td>${esc(d10.d10.tenthSign)} (lord ${esc(d10.d10.tenthLord)})</td></tr>
          <tr><td>D10 11th</td><td>${esc(d10.d10.eleventhSign)} (lord ${esc(d10.d10.eleventhLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D10 level?', d10.evidence)}
        <p style="font-size:0.85em;color:#777;">D10 confirms or qualifies D1's business promise — it never replaces D1.</p>
      </div>`;
  }

  function renderD9(r) {
    const d9 = r.d9Context;
    return `
      <h3 id="bus-sec-d9">D9 (Navamsha) Supporting Context (Optional)</h3>
      <div class="output-box pastel-pink">
        <p>${d9.strongCount} planet(s) in strong Navamsha dignity.</p>
        <p style="font-size:0.85em;color:#777;">${esc(d9.note)}</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="bus-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Business Start Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="bus-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Business-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct business-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const eventTypes = ['All', 'Business Idea/Preparation', 'Business Registration/Formation', 'First Major Commercial Activity', 'Independent Professional Practice', 'Partnership/Joint Business Start', 'Foreign/International Business Activity'];
    const eventOptions = eventTypes.map(t => `<option value="${esc(t)}" ${t === eventFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    const controls = `<p><label>Search horizon: <select id="bus-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Business Event: <select id="bus-type-select">${eventOptions}</select></label></p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="bus-sec-windows">Business Start Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient business-start convergence (2nd/3rd/5th/6th/7th/9th/10th/11th/12th, or D10).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-bus-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.d10Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${badge(w.strength.label)}</td>
        <td>${esc(w.stage.label)}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="bus-sec-windows">Business Start Windows</h3>
      ${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>Business Activation</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th>Strength</th><th>Stage</th><th>Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="bus-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Business Promise', '&darr;',
      `7th connection: ${w.seventhConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D10 ${w.d10Confirmation ? 'confirms' : 'does not confirm'} business/professional direction`, '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports business opportunity' : 'shows no qualifying support'} (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'supports structured/sustained operations' : 'shows no qualifying activation'} (transit)`, '&darr;',
      'Candidate Business-Start Window', '&darr;',
      `Event Stage = ${w.stage.label}`, '&darr;',
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
        <p><strong>Window Strength:</strong> ${badge(w.strength.label)}</p>
        <p><strong>Event Stage:</strong> ${badge(w.stage.label)}</p>
        <p><strong>Event Classification:</strong> ${badge(w.event.label)}</p>
        ${w.jobChangeCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Business vs. Job Change:</strong> ${esc(w.jobChangeCrossCheck.interpretation)} (Job Change Timing event: ${esc(w.jobChangeCrossCheck.jobChangeEvent)})</p></div>` : ''}
        ${w.financialCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Financial Confirmation:</strong> ${esc(w.financialCrossCheck.interpretation)} (Financial Gain Timing event: ${esc(w.financialCrossCheck.financialEvent)})</p></div>` : ''}
        <details class="avp-calc"><summary>BUSINESS START TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="bus-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Business Idea/Preparation', 'Business Registration/Formation', 'Business Launch', 'First Major Commercial Activity', 'Partnership/Joint Business Start', 'Family Business Entry', 'Independent Professional Practice'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.BusinessStartTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.BusinessStartTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">No chart/dasha data.</td><td><button type="button" class="bus-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="bus-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.secondActivation ? 'Yes' : 'No')}</td><td>${badge(v.seventhActivation ? 'Yes' : 'No')}</td><td>${badge(v.tenthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d10Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="bus-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="bus-sec-historical">Historical Business Start Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous business idea/registration/launch/commercial-activity date to see what the method would have shown for it — this validates the method against actual history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="bus-hist-date-input"> <select id="bus-hist-type-select">${typeOptions}</select> <button type="button" id="bus-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>2nd</th><th>7th</th><th>10th</th><th>11th</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="bus-sec-rules">Rules Used</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="bus-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="bus-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#bus-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    const typeSelect = root.querySelector('#bus-type-select');
    if (typeSelect) typeSelect.addEventListener('change', () => { eventFilter = typeSelect.value; selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-bus-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-bus-window'));
      UI.render();
      const el = document.getElementById('bus-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#bus-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#bus-hist-date-input').value;
      const type = root.querySelector('#bus-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.bus-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#bus-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('bus-root');
    if (!root) return;
    const result = window.BusinessStartTiming.refresh(horizonYears, eventFilter);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Business Start Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari business-start timing (no KP or Western technique). Traces the chain: <strong>Natal Business Promise &rarr; Employment/Business Tendency &rarr; D10 Confirmation (D9 supporting context) &rarr; Vimshottari Dasha Activation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Event Classification &rarr; Event Stage</strong>. 7th-house activation alone, 10th-house activation alone, a single transit, or a single karaka never produces a business-launch classification; preparation/planning is never classified as an actual launch.</p>',
      renderPromise(result),
      renderTendency(result),
      renderD10(result),
      renderD9(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.BusinessStartTiming) window.BusinessStartTiming.init(); };
  UI.init();
  return UI;
})();
