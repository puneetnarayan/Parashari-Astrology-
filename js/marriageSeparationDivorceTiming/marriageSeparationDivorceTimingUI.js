/* =========================================================
   MARRIAGE SEPARATION / DIVORCE TIMING — rendering layer only.
   Consumes window.MarriageSeparationDivorceTiming and renders into
   #msd-root. Namespaced as window.MarriageSeparationDivorceTimingUI.
   ========================================================= */

window.MarriageSeparationDivorceTimingUI = (function () {
  const UI = {};
  let initialized = false, horizonYears = 5, minSupport = 'All', stageFilter = 'All', selectedWindowIndex = null, historicalEvents = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes' || l.includes('stability') || l === 'supports marital continuity') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('unavailable') || l.includes('limited') || l.includes('separation')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderDisclaimer() {
    return `<div class="output-box pastel-yellow" style="font-size:0.85em;"><strong>Important:</strong> This module provides astrological timing indicators only. It does not guarantee divorce or reconciliation, does not tell you to divorce or remain married, does not determine whether a spouse is "good" or "bad," does not infer abuse or infidelity as fact, does not diagnose mental-health conditions, and does not provide legal advice or predict harm to a spouse. Your own circumstances and professional advice should remain primary.</div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `<h3 id="msd-sec-promise">Natal Marriage / Separation Indicators</h3><div class="output-box pastel-blue">
      <p><strong>${badge(np.overallState)}</strong></p>${evidenceDetails('Why this state?', np.reasons)}
      <table class="rem-table"><thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
        ${houseRow(np.firstHouse)}${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.seventhHouse)}${houseRow(np.eighthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
        ${karakaRow(np.venus, 'Venus')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.mars, 'Mars')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.sun, 'Sun')}
      </tbody></table>
      <p style="font-size:0.85em;color:#777;">This is not a deterministic statement that divorce will occur. No single house independently triggers a divorce result.</p>
    </div>
    <h4 id="msd-sec-signature">Separation/Transformation Signatures</h4><div class="output-box pastel-mint"><table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
      ${np.relationships.map(rel => `<tr class="${rel.connected ? 'quality-neutral' : ''}"><td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td></tr>`).join('')}
      ${np.convergenceSignatures.map(p => `<tr class="${p.present ? 'quality-neutral' : ''}"><td>${esc(p.rule.name)}</td><td>${p.present ? 'Present' : 'Not present'}</td><td>${evidenceDetails('Evidence', [p.evidence])}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function renderD9(r) {
    const d9 = r.d9Confirmation;
    if (!d9.available) return `<h3 id="msd-sec-d9">D9 Confirmation</h3><p style="color:#a33;">D9 confirmation is unavailable for this chart.</p>`;
    return `<h3 id="msd-sec-d9">D9 (Navamsha) Confirmation</h3><div class="output-box pastel-yellow">
      <p><strong>${badge(d9.level)}</strong></p>
      <table class="rem-table"><tr><td>D9 Ascendant</td><td>${esc(d9.d9.ascendantSign)}</td></tr><tr><td>D9 7th</td><td>${esc(d9.d9.seventhSign)} (lord ${esc(d9.d9.seventhLord)})</td></tr></table>
      ${evidenceDetails('Why this D9 level?', d9.evidence)}
      <p style="font-size:0.85em;color:#777;">D9 is essential for this module, used as confirmation of relationship themes — never a replacement for D1, and never reduced to a simplistic "divorce score."</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="msd-sec-dasha">Current Relationship Timing</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Marriage Separation / Divorce Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="msd-sec-dasha">Current Relationship Timing</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Relationship-Factor Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
      ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct relationship-connection factor found for the current Pratyantardasha lord.']) : ''}
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const supportOptions = ['All', 'Moderately Supportive', 'Supportive', 'Strongly Supportive'].map(s => `<option value="${esc(s)}" ${s === minSupport ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const stages = ['All', 'Marital Tension', 'Emotional Distance', 'Physical Separation', 'Prolonged Separation', 'Relationship Restructuring', 'Reconciliation-Oriented Period', 'Legal Separation Process', 'Divorce Proceedings', 'Divorce/Order/Closure', 'Post-Separation Transition', 'Mixed Relationship Development'];
    const stageOptions = stages.map(s => `<option value="${esc(s)}" ${s === stageFilter ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="msd-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Support: <select id="msd-support-select">${supportOptions}</select></label> &nbsp; <label>Event Stage: <select id="msd-stage-select">${stageOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="msd-sec-windows">Upcoming Relationship Timing Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence for a relationship-transition window.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-msd-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${w.d9Confirmation ? 'Yes' : 'No'}</td><td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td><td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td><td>${badge(w.strength.label)}</td><td>${esc(w.stage.label)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="msd-sec-windows">Upcoming Relationship Timing Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>D9</th><th>Saturn</th><th>Jupiter</th><th>Support</th><th>Stage</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="msd-sec-detail">Detailed Calculation</h4>${detail}${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Natal Relationship Factors established', '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — D9 ${w.d9Confirmation ? 'confirms' : 'does not confirm'} the relationship axis`, '&darr;', `Step 4 — Saturn ${w.transit.saturn.active ? 'active' : 'not active'}, Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}`, '&darr;', 'Step 5 — Related events checked', '&darr;', `Step 6 — Stage = ${w.stage.label}`, '&darr;', `Step 7 — Window included: ${w.strength.label}`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Stage:</strong> ${badge(w.stage.label)} — candidate relationship-transition window, not a certainty.</p><p><strong>Support:</strong> ${badge(w.strength.label)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution/Mixed Factors:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Rahu/Ketu (secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
      ${w.reconciliation ? `<div class="output-box pastel-mint"><p><strong>Reconciliation / Relationship Continuity Indicators:</strong> ${esc(w.reconciliation.interpretation)}</p><ul>${w.reconciliation.factors.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
      ${w.legalCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Legal Cross-Check:</strong> ${esc(w.legalCrossCheck.interpretation)}</p></div>` : ''}
      ${w.relocationTheme ? `<div class="output-box pastel-yellow"><p><strong>Relocation Theme:</strong> ${esc(w.relocationTheme.interpretation)}</p></div>` : ''}
      ${w.financialCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Financial/Property Cross-Check:</strong> ${esc(w.financialCrossCheck.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>MARRIAGE SEPARATION / DIVORCE TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span><span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.stage.label)}</span></div>`).join('');
    return `<h4 id="msd-sec-timeline">Relationship Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Marriage Date', 'Conflict/Separation Date', 'Reconciliation Date', 'Legal Proceeding Date', 'Divorce/Order Date'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.MarriageSeparationDivorceTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.MarriageSeparationDivorceTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">No chart/dasha data.</td><td><button type="button" class="msd-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="msd-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td><td>${badge(v.seventhActivation ? 'Yes' : 'No')}</td><td>${badge(v.twelfthActivation ? 'Yes' : 'No')}</td><td>${esc(v.d9Level)}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td><td><button type="button" class="msd-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
    }).join('');
    return `<h3 id="msd-sec-historical">Historical Validation</h3><div class="output-box pastel-yellow">
      <p>Enter a previous marriage/separation/reconciliation/legal/divorce date to see what the method would have shown for it. No private messages, allegations, or confidential details are requested or stored.</p>
      <p><input type="date" id="msd-hist-date-input"> <select id="msd-hist-type-select">${typeOptions}</select> <button type="button" id="msd-hist-add-btn">Add Event Date</button></p>
      ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>7th</th><th>12th</th><th>D9</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="msd-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }
  function renderLog(r) { return `<h3 id="msd-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre><button type="button" id="msd-copy-log-btn">Copy Calculation Log</button></div>`; }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#msd-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const supportSelect = root.querySelector('#msd-support-select'); if (supportSelect) supportSelect.addEventListener('change', () => { minSupport = supportSelect.value; selectedWindowIndex = null; UI.render(); });
    const stageSelect = root.querySelector('#msd-stage-select'); if (stageSelect) stageSelect.addEventListener('change', () => { stageFilter = stageSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-msd-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-msd-window')); UI.render(); const el = document.getElementById('msd-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    const addHistBtn = root.querySelector('#msd-hist-add-btn'); if (addHistBtn) addHistBtn.addEventListener('click', () => { const val = root.querySelector('#msd-hist-date-input').value; const type = root.querySelector('#msd-hist-type-select').value; if (val) { historicalEvents.push({ date: val, type }); UI.render(); } });
    root.querySelectorAll('.msd-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => { historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1); UI.render(); }));
    const copyBtn = root.querySelector('#msd-copy-log-btn'); if (copyBtn) copyBtn.addEventListener('click', () => { const text = result.calculationLog.join('\n'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); }); });
  }

  UI.render = function () {
    const root = document.getElementById('msd-root');
    if (!root) return;
    const result = window.MarriageSeparationDivorceTiming.refresh(horizonYears, minSupport, stageFilter);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Marriage Separation / Divorce Timing analysis.</p>' + renderDisclaimer(); return; }
    root.innerHTML = [
      renderDisclaimer(),
      '<p>Parashari/Vimshottari relationship-timing analysis (no KP or Western technique). This is a sensitive relationship-timing module providing astrological timing indicators only. Traces: <strong>Natal Relationship Factors &rarr; Venus/Significators &rarr; Dasha &rarr; D9 Confirmation &rarr; Transit &rarr; Related Events &rarr; Event Classification &rarr; Final Window</strong>. A difficult period is never automatically a divorce period — no single house (6th, 8th, or 12th) independently triggers a divorce result.</p>',
      renderPromise(result), renderD9(result), renderCurrentDasha(result), renderWindows(result), renderHistorical(), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.MarriageSeparationDivorceTiming) window.MarriageSeparationDivorceTiming.init(); };
  UI.init();
  return UI;
})();
