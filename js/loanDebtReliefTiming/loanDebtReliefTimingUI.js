/* =========================================================
   LOAN / DEBT RELIEF TIMING — rendering layer only. Consumes
   window.LoanDebtReliefTiming (engine) and renders into #debt-root.
   Uses this app's EXISTING shared UI conventions.
   Namespaced as window.LoanDebtReliefTimingUI.
   ========================================================= */

window.LoanDebtReliefTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let loanType = 'General';
  let minSupport = 'All';
  let stageFilter = 'All';
  let selectedWindowIndex = null;
  let historicalEvents = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('clearly present') || l.includes('supporting') || l.includes('supportive') || l === 'yes' || l.includes('supports')) return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial') || l === 'present') return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('not available') || l.includes('limited') || l.includes('does not')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderNatal(r) {
    const n = r.natal;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="debt-sec-promise">Natal Loan / Debt Indicators</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(n.debtPotential)}</strong></p>
        ${evidenceDetails('Why this level?', n.debtReasons)}
        <table class="rem-table"><thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(n.sixthHouse)}${houseRow(n.eighthHouse)}${houseRow(n.twelfthHouse)}${houseRow(n.fourthHouse)}${houseRow(n.seventhHouse)}
          ${karakaRow(n.saturn, 'Saturn')}${karakaRow(n.mercury, 'Mercury')}${karakaRow(n.mars, 'Mars')}${karakaRow(n.rahu, 'Rahu')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This indicates whether the horoscope contains meaningful debt/liability signatures — it does not mean the user must take, or already has, debt.</p>
      </div>
      <h3 id="debt-sec-relief">Natal Debt-Relief Indicators</h3>
      <div class="output-box pastel-mint">
        <p><strong>${badge(n.reliefPotential)}</strong></p>
        ${evidenceDetails('Why this level?', n.reliefReasons)}
        <table class="rem-table"><thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(n.secondHouse)}${houseRow(n.eleventhHouse)}${houseRow(n.tenthHouse)}${houseRow(n.ninthHouse)}
          ${karakaRow(n.jupiter, 'Jupiter')}${karakaRow(n.venus, 'Venus')}${karakaRow(n.moon, 'Moon')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This dedicated relief scale is kept entirely separate from the debt-indicators scale above, per the module's design.</p>
      </div>
      <h4 id="debt-sec-signature">House Relationship Signatures</h4>
      <div class="output-box pastel-lavender"><table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
        ${n.debtRelationships.map(rel => `<tr class="${rel.connected ? 'quality-good' : ''}"><td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td></tr>`).join('')}
        ${n.reliefRelationships.map(rel => `<tr class="${rel.connected ? 'quality-good' : ''}"><td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td></tr>`).join('')}
        ${n.convergenceSignatures.map(p => `<tr class="${p.present ? 'quality-good' : ''}"><td>${esc(p.rule.name)}</td><td>${p.present ? 'Present' : 'Not present'}</td><td>${evidenceDetails('Evidence', [p.evidence])}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function renderD2(r) {
    const d2 = r.d2Confirmation;
    if (!d2.available) return `<h3 id="debt-sec-d2">D2 (Hora) Confirmation (Optional)</h3><div class="output-box pastel-yellow"><p>${esc(d2.evidence[0])}</p></div>`;
    return `<h3 id="debt-sec-d2">D2 (Hora) Confirmation (Optional)</h3><div class="output-box pastel-yellow">
      <p><strong>${badge(d2.level)}</strong></p>
      <table class="rem-table"><tr><td>D2 Ascendant</td><td>${esc(d2.d2.ascendantSign)} (lord ${esc(d2.d2.lagnaLord)})</td></tr><tr><td>D2 2nd</td><td>${esc(d2.d2.secondSign)} (lord ${esc(d2.d2.secondLord)})</td></tr><tr><td>D2 11th</td><td>${esc(d2.d2.eleventhSign)} (lord ${esc(d2.d2.eleventhLord)})</td></tr></table>
      ${evidenceDetails('Why this D2 level?', d2.evidence)}
      <p style="font-size:0.85em;color:#777;">D2 confirms D1 — it never replaces it. This is an optional confirmation layer, reused from the app's existing divisional-chart engine, not duplicated.</p>
    </div>`;
  }

  function renderLoanContext() {
    const types = ['General', 'Home', 'Vehicle', 'Personal', 'Business', 'Education', 'Other'];
    const options = types.map(t => `<option value="${esc(t)}" ${t === loanType ? 'selected' : ''}>${esc(t)}</option>`).join('');
    return `<h3 id="debt-sec-context">Loan Context</h3><div class="output-box pastel-lavender">
      <p><label>Loan Type: <select id="debt-loantype-select">${options}</select></label></p>
      <p style="font-size:0.85em;color:#777;">The selected loan type adjusts interpretation only — it never invents unsupported rules.</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="debt-sec-dasha">Current Debt/Relief Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Loan/Debt Relief Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="debt-sec-dasha">Current Debt/Relief Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Debt-Factor Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
      ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct debt-connection factor found for the current Pratyantardasha lord.']) : ''}
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const supportOptions = ['All', 'Moderately Supportive', 'Supportive', 'Strongly Supportive'].map(s => `<option value="${esc(s)}" ${s === minSupport ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const stages = ['All', 'Debt Creation', 'Debt Maintenance', 'Debt Reduction', 'Debt Restructuring', 'Debt Closure'];
    const stageOptions = stages.map(s => `<option value="${esc(s)}" ${s === stageFilter ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="debt-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Support: <select id="debt-support-select">${supportOptions}</select></label> &nbsp; <label>Debt Stage: <select id="debt-stage-select">${stageOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="debt-sec-windows">Upcoming Debt Timing Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence for a loan/debt-relief window.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-debt-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${w.d2Confirmation ? 'Yes' : 'No'}</td><td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td><td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td><td>${badge(w.support.label)}</td><td>${esc(w.stage.label)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="debt-sec-windows">Upcoming Debt Timing Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>D2</th><th>Jupiter</th><th>Saturn</th><th>Support</th><th>Stage</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="debt-sec-detail">Detailed Calculation</h4>${detail}${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Natal Debt Factors established', '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — D2 ${w.d2Confirmation ? 'confirms' : 'does not confirm'} financial-relief axis`, '&darr;', `Step 4 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}`, '&darr;', `Step 5 — Related events checked`, '&darr;', `Step 6 — Stage = ${w.stage.label}, Event = ${w.eventType}`, '&darr;', `Step 7 — Window included: ${w.support.label}`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Stage:</strong> ${badge(w.stage.label)}</p><p><strong>Support:</strong> ${badge(w.support.label)}</p><p><strong>Event Type:</strong> ${badge(w.eventType)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution/Mixed Factors:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      <p><strong>Rahu/Ketu (secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
      ${w.financialCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Financial Cross-Check:</strong> ${esc(w.financialCrossCheck.interpretation)}</p></div>` : ''}
      ${w.propertyCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Property Cross-Check:</strong> ${esc(w.propertyCrossCheck.interpretation)}</p></div>` : ''}
      ${w.vehicleCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Vehicle Cross-Check:</strong> ${esc(w.vehicleCrossCheck.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>LOAN / DEBT RELIEF TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span><span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.stage.label)}</span></div>`).join('');
    return `<h4 id="debt-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Borrowing', 'Approval/Disbursement', 'Restructuring', 'Repayment Milestone', 'Closure'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.LoanDebtReliefTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.LoanDebtReliefTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">No chart/dasha data.</td><td><button type="button" class="debt-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="debt-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td><td>${badge(v.sixthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td><td>${esc(v.d2Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td><button type="button" class="debt-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
    }).join('');
    return `<h3 id="debt-sec-historical">Historical Validation</h3><div class="output-box pastel-yellow">
      <p>Enter a previous borrowing/repayment/closure date to see what the method would have shown for it.</p>
      <p><input type="date" id="debt-hist-date-input"> <select id="debt-hist-type-select">${typeOptions}</select> <button type="button" id="debt-hist-add-btn">Add Event Date</button></p>
      ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>6th</th><th>11th</th><th>D2</th><th>Jupiter</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="debt-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="debt-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre><button type="button" id="debt-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function renderCaution() {
    return `<h3 id="debt-sec-caution">Financial Caution</h3><div class="output-box pastel-peach">
      <p style="font-size:0.9em;">This is an astrological timing analysis, not financial, legal, or tax advice. It cannot guarantee loan approval, repayment, debt forgiveness, or any financial outcome, does not predict a credit score, and never recommends a specific lender or that borrowing is financially safe. Real-world financial decisions should be based on actual income, expenses, interest rates, contractual terms, and professional financial advice.</p>
    </div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#debt-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const loanSelect = root.querySelector('#debt-loantype-select'); if (loanSelect) loanSelect.addEventListener('change', () => { loanType = loanSelect.value; selectedWindowIndex = null; UI.render(); });
    const supportSelect = root.querySelector('#debt-support-select'); if (supportSelect) supportSelect.addEventListener('change', () => { minSupport = supportSelect.value; selectedWindowIndex = null; UI.render(); });
    const stageSelect = root.querySelector('#debt-stage-select'); if (stageSelect) stageSelect.addEventListener('change', () => { stageFilter = stageSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-debt-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-debt-window')); UI.render(); const el = document.getElementById('debt-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    const addHistBtn = root.querySelector('#debt-hist-add-btn'); if (addHistBtn) addHistBtn.addEventListener('click', () => { const val = root.querySelector('#debt-hist-date-input').value; const type = root.querySelector('#debt-hist-type-select').value; if (val) { historicalEvents.push({ date: val, type }); UI.render(); } });
    root.querySelectorAll('.debt-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => { historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1); UI.render(); }));
    const copyBtn = root.querySelector('#debt-copy-log-btn'); if (copyBtn) copyBtn.addEventListener('click', () => { const text = result.calculationLog.join('\n'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); }); });
  }

  UI.render = function () {
    const root = document.getElementById('debt-root');
    if (!root) return;
    const result = window.LoanDebtReliefTiming.refresh(horizonYears, loanType, minSupport, stageFilter);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Loan / Debt Relief Timing analysis.</p>'; return; }
    root.innerHTML = [
      '<p>Parashari/Vimshottari loan/debt-relief timing (no KP or Western technique). Explicitly distinct from Financial Gain Timing — this module focuses on borrowing/liability/relief, never general income or wealth realization. Traces: <strong>Natal Debt Factors &rarr; Dasha &rarr; D2 Confirmation (optional) &rarr; Transit &rarr; Related Events &rarr; Event Classification &rarr; Final Window</strong>. No single house combination is treated as an automatic debt or relief event, and this module never recommends a lender, guarantees approval/repayment, predicts a credit score, or promises debt forgiveness.</p>',
      renderNatal(result), renderD2(result), renderLoanContext(), renderCurrentDasha(result), renderWindows(result), renderHistorical(), renderLog(result), renderRules(result), renderCaution()
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.LoanDebtReliefTiming) window.LoanDebtReliefTiming.init(); };
  UI.init();
  return UI;
})();
