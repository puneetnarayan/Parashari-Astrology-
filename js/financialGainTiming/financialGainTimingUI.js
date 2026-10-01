/* =========================================================
   FINANCIAL GAIN / WEALTH ACCUMULATION TIMING — rendering layer only.
   Consumes window.FinancialGainTiming (engine) and renders into
   #fin-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — same visual language as
   every other timing tab.

   SENSITIVITY NOTE: this file never adds language stronger than the
   engine's own ("astrologically supportive period") — no guaranteed
   profit, no monetary amounts, no investment recommendations appear
   anywhere in this file.

   Namespaced as window.FinancialGainTimingUI.
   ========================================================= */

window.FinancialGainTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let eventTypeFilter = 'All';
  let detailLevel = 'summary'; // 'summary' | 'detailed'
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }

  const EVENT_TYPES = ['All', 'Income', 'Bonus', 'Business', 'Investment', 'Inheritance', 'Asset', 'Wealth Accumulation'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderDisclaimer() {
    return `<div class="output-box pastel-yellow" style="border:1px solid #e0c200;">
      <p style="margin:0;"><strong>Important:</strong> This is an astrological timing analysis, not financial or investment advice. It identifies astrologically supportive periods only — it does not guarantee profit, predict exact amounts, or recommend buying/selling any asset.</p>
    </div>`;
  }

  function renderSummary(r) {
    const theme = r.natalPromise.natalThemes[r.natalPromise.strongestTheme];
    const primaryWindow = r.candidateWindows[0];
    return `
      <h3 id="fin-sec-summary">Financial Timing Summary</h3>
      <div class="output-box pastel-blue">
        <p><strong>Natal Financial Theme:</strong> ${esc(theme.text)}</p>
        ${r.currentDasha ? `<p><strong>Current Financial Dasha:</strong> ${esc(r.currentDasha.mahadasha.lord)}${r.currentDasha.antardasha ? ' &rarr; ' + esc(r.currentDasha.antardasha.lord) : ''}${r.currentDasha.pratyantardasha ? ' &rarr; ' + esc(r.currentDasha.pratyantardasha.lord) : ''}</p>` : ''}
        ${primaryWindow ? `<p><strong>Next Supportive Period:</strong> ${fmtMonthYear(primaryWindow.startDate)} &ndash; ${fmtMonthYear(primaryWindow.endDate)}</p><p><strong>Likely Financial Theme:</strong> ${badge(primaryWindow.event.label)}</p>` : '<p style="font-size:0.9em;color:#555;">No strongly converging supportive period identified in the selected horizon.</p>'}
        ${r.wealthAccumulationAssessment ? `<p><strong>Gain vs. Wealth Accumulation:</strong> ${esc(r.wealthAccumulationAssessment.label)}</p>` : ''}
      </div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why? (house lord dignity/conjunctions/aspects)', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="fin-sec-promise">Natal Financial Promise (D1)</h3>
      <div class="output-box pastel-mint">
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.fourthHouse)}${houseRow(np.fifthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.eighthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.moon, 'Moon')}
          </tbody>
        </table>
        ${np.leakageConnected ? `<p style="color:#8a6d00;">Financial leakage/expenditure context is also present (2nd/11th/6th connected with 12th). ${evidenceDetails('About this', np.leakageEvidence)}</p>` : ''}
      </div>
      <h4>Separate Natal Indicators</h4>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Theme</th><th>Indication</th></tr></thead>
          <tbody>
            <tr><td>Income Strength</td><td>${esc(np.natalThemes.income.text)}</td></tr>
            <tr><td>Wealth Accumulation</td><td>${esc(np.natalThemes.wealthAccumulation.text)}</td></tr>
            <tr><td>Investment Potential</td><td>${esc(np.natalThemes.investment.text)}</td></tr>
            <tr><td>Business-Profit Potential</td><td>${esc(np.natalThemes.businessProfit.text)}</td></tr>
            <tr><td>Inheritance/Sudden-Gain Potential</td><td>${esc(np.natalThemes.inheritance.text)}</td></tr>
            <tr><td>Asset Realization Potential</td><td>${esc(np.natalThemes.assetRealization.text)}</td></tr>
          </tbody>
        </table>
      </div>
      <h4>House Relationship Signatures</h4>
      <div class="output-box pastel-lavender">
        ${[['Gain Signatures', np.gainRelationships], ['Career-Income Signatures', np.careerIncomeRelationships], ['Inheritance/Sudden-Wealth Signatures', np.inheritanceRelationships]].map(([label, rels]) => `
          <p><strong>${esc(label)}</strong></p>
          <table class="rem-table"><thead><tr><th>Relationship</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${rels.map(rel => `
            <tr class="${rel.connected ? 'quality-good' : ''}"><td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td></tr>`).join('')}</tbody></table>`).join('')}
        <p class="${qualityClass(np.businessRelationship.connected ? 'Supportive' : 'Neutral')}">${np.businessRelationship.connected ? '&check;' : '&mdash;'} Business-Profit Signature (2nd/5th/10th/11th) ${evidenceDetails('Evidence', [np.businessRelationship.evidence])}</p>
      </div>`;
  }

  function renderD2(r) {
    const d2 = r.d2Confirmation;
    if (!d2.available) return `<h3 id="fin-sec-d2">D2 (Hora) Confirmation</h3><p style="color:#a33;">D2 confirmation is unavailable for this chart. ${esc(d2.evidence[0])}</p>`;
    return `
      <h3 id="fin-sec-d2">D2 (Hora) Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d2.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D2 Ascendant</td><td>${esc(d2.d2.ascendantSign)} (lord ${esc(d2.d2.lagnaLord)})</td></tr>
          <tr><td>D2 2nd</td><td>${esc(d2.d2.secondSign)} (lord ${esc(d2.d2.secondLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D2 level?', d2.evidence)}
        <p style="font-size:0.85em;color:#777;">D2 confirms or qualifies D1 — it never replaces it.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="fin-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Financial Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="fin-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-pink">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Financial-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct financial-promise connection found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const typeOptions = EVENT_TYPES.map(t => `<option value="${esc(t)}" ${t === eventTypeFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    const detailOptions = ['summary', 'detailed'].map(v => `<option value="${v}" ${v === detailLevel ? 'selected' : ''}>${v === 'summary' ? 'Summary' : 'Detailed Calculation Trace'}</option>`).join('');
    const controls = `<p>
      <label>Forecast Period: <select id="fin-horizon-select">${horizonOptions}</select></label> &nbsp;
      <label>Event Type: <select id="fin-type-select">${typeOptions}</select></label> &nbsp;
      <label>Detail: <select id="fin-detail-select">${detailOptions}</select></label>
    </p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="fin-sec-windows">Candidate Financial Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) matching the selected filter showed sufficient financial convergence.</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-fin-window="${i}" style="cursor:pointer;" class="${qualityClass(w.strength.label)}">
        <td>${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</td>
        <td>${esc(w.event.label)}</td>
        <td>${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.transit.jupiter.active || w.transit.saturn.active ? 'Yes' : 'No'}</td>
        <td>${badge(w.strength.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : (detailLevel === 'detailed' ? r.candidateWindows.map((w, i) => renderWindowDetail(w)).join('') : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace, or switch Detail to "Detailed Calculation Trace" to expand all windows.</p>');
    return `
      <h3 id="fin-sec-windows">Candidate Financial Windows</h3>
      ${controls}
      <div class="output-box pastel-blue" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Period</th><th>Financial Theme</th><th>Dasha</th><th>Main Houses</th><th>Transit Confirmation</th><th>Strength</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="fin-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Financial Promise', '&darr;',
      `2nd connected to gain/wealth houses: ${w.second2nd ? 'Yes' : 'Partial/No'}`, '&darr;',
      `11th (gain realization) activated: ${w.eleventhConn ? 'Yes' : 'No'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D2 ${w.d2Confirmation ? 'confirms' : 'does not confirm'} wealth capacity`, '&darr;',
      `Jupiter transit: ${w.transit.jupiter.active ? 'supports' : 'no qualifying support'}`, '&darr;',
      `Saturn transit: ${w.transit.saturn.active ? 'supports sustained accumulation' : 'no qualifying activation'}`, '&darr;',
      'Candidate Financial Window', '&darr;',
      `Event Classification = ${w.event.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-mint" style="margin-bottom:8px;">
        <p><strong>Window:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Financial Dimension(s):</strong> ${w.dimension.dimensions.map(d => badge(d)).join(' ')}</p>
        <p><strong>Reasons:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Rahu/Ketu (secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <p><strong>Event Classification:</strong> ${badge(w.event.label)}</p>
        <p><strong>Window Strength:</strong> ${badge(w.strength.label)}</p>
        <p style="font-size:0.85em;color:#777;">This describes an astrologically supportive period only — not a guarantee, exact amount, or investment recommendation.</p>
        <details class="avp-calc"><summary>FINANCIAL TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.strength.label)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="fin-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Salary Increase', 'Bonus', 'Major Business Profit', 'Investment Gain', 'Property Sale', 'Inheritance', 'Major Asset Purchase', 'Debt Reduction', 'Wealth Milestone'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.FinancialGainTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.FinancialGainTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">No chart/dasha data.</td><td><button type="button" class="fin-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="fin-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.secondActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td><td>${esc(v.d2Level)}</td>
          <td>${esc(v.whatSystemWouldShow)}</td>
          <td><button type="button" class="fin-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="fin-sec-historical">Historical Validation</h3>
      <div class="output-box pastel-peach">
        <p>Enter a previous salary increase / bonus / business profit / investment gain / property sale / inheritance / asset purchase / debt reduction / wealth milestone date to compare what the system would have identified against what actually happened — this never silently changes the rules to force a match.</p>
        <p><input type="date" id="fin-hist-date-input"> <select id="fin-hist-type-select">${typeOptions}</select> <button type="button" id="fin-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>2nd</th><th>11th</th><th>D2</th><th>What the system would have identified</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="fin-sec-rules">Rules Used</h3><div class="output-box pastel-mint">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="fin-sec-log">Calculation Log</h3><div class="output-box pastel-yellow"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="fin-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#fin-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const typeSelect = root.querySelector('#fin-type-select');
    if (typeSelect) typeSelect.addEventListener('change', () => { eventTypeFilter = typeSelect.value; selectedWindowIndex = null; UI.render(); });
    const detailSelect = root.querySelector('#fin-detail-select');
    if (detailSelect) detailSelect.addEventListener('change', () => { detailLevel = detailSelect.value; UI.render(); });

    root.querySelectorAll('tr[data-fin-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-fin-window'));
      UI.render();
      const el = document.getElementById('fin-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#fin-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#fin-hist-date-input').value;
      const type = root.querySelector('#fin-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.fin-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#fin-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('fin-root');
    if (!root) return;
    const result = window.FinancialGainTiming.refresh(horizonYears, eventTypeFilter);
    if (!result) {
      root.innerHTML = renderDisclaimer() + '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Financial Gain / Wealth Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      renderDisclaimer(),
      '<p>Parashari/Vimshottari financial-timing analysis (no KP or Western technique). Traces the chain: <strong>Natal Promise &rarr; Financial Theme &rarr; Dasha Activation &rarr; D2 Confirmation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Event Classification</strong>. This is an event-timing tool, not investment advice — it never guarantees profit, predicts an amount, or recommends a specific asset.</p>',
      renderSummary(result),
      renderPromise(result),
      renderD2(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.FinancialGainTiming) window.FinancialGainTiming.init(); };
  UI.init();
  return UI;
})();
