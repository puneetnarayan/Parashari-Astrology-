/* =========================================================
   INHERITANCE / LEGACY TIMING — rendering layer only. Consumes
   window.InheritanceLegacyTiming and renders into #inherit-root.
   Namespaced as window.InheritanceLegacyTimingUI.
   ========================================================= */

window.InheritanceLegacyTimingUI = (function () {
  const UI = {};
  let initialized = false, horizonYears = 5, assetContext = 'General', minSupport = 'All', stageFilter = 'All', selectedWindowIndex = null, historicalEvents = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes' || l === 'clearly present' || l === 'supports') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial') || l === 'present') return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('unavailable') || l.includes('limited') || l.includes('does not')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderDisclaimer() {
    return `<div class="output-box pastel-yellow" style="font-size:0.85em;"><strong>Important:</strong> This module never predicts death, lifespan, or when a relative will die, never guarantees inheritance or a particular amount, and does not determine legal entitlement or provide legal/tax advice. It focuses only on astrologically indicated asset/succession developments.</div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `<h3 id="inherit-sec-promise">Natal Inheritance / Legacy Indicators</h3><div class="output-box pastel-blue">
      <p><strong>${badge(np.potential)}</strong></p>${evidenceDetails('Why this potential level?', np.reasons)}
      <table class="rem-table"><thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
        ${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.fifthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.seventhHouse)}${houseRow(np.eighthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
        ${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.mars, 'Mars')}
      </tbody></table>
      <p style="font-size:0.85em;color:#777;">Do not interpret this as a statement that inheritance is guaranteed.</p>
    </div>
    <h4 id="inherit-sec-signature">Inheritance Signatures</h4><div class="output-box pastel-mint"><table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
      ${np.relationships.map(rel => `<tr class="${rel.connected ? 'quality-good' : ''}"><td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td></tr>`).join('')}
      ${np.convergenceSignatures.map(p => `<tr class="${p.present ? 'quality-good' : ''}"><td>${esc(p.rule.name)}</td><td>${p.present ? 'Present' : 'Not present'}</td><td>${evidenceDetails('Evidence', [p.evidence])}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function renderD4(r) {
    const d4 = r.d4Confirmation;
    if (!d4.available) return `<h3 id="inherit-sec-d4">D4 Confirmation</h3><p style="color:#a33;">D4 confirmation is unavailable for this chart.</p>`;
    return `<h3 id="inherit-sec-d4">D4 (Chaturthamsha) Confirmation</h3><div class="output-box pastel-yellow">
      <p><strong>${badge(d4.level)}</strong></p>
      <table class="rem-table"><tr><td>D4 Ascendant</td><td>${esc(d4.d4.ascendantSign)} (lord ${esc(d4.d4.lagnaLord)})</td></tr><tr><td>D4 4th</td><td>${esc(d4.d4.fourthSign)} (lord ${esc(d4.d4.fourthLord)})</td></tr><tr><td>D4 8th</td><td>${esc(d4.d4.eighthSign)} (lord ${esc(d4.d4.eighthLord)})</td></tr><tr><td>D4 11th</td><td>${esc(d4.d4.eleventhSign)} (lord ${esc(d4.d4.eleventhLord)})</td></tr></table>
      ${evidenceDetails('Why this D4 level?', d4.evidence)}
      <p style="font-size:0.85em;color:#777;">D4 confirms D1 — it never replaces it. The same D4 engine Property Purchase/Sale Timing use, reused here, not duplicated.</p>
    </div>`;
  }

  function renderContextAndHorizon() {
    const contexts = ['General', 'Property', 'Financial Assets', 'Business/Family Assets', 'Inherited Property', 'Other'];
    const contextOptions = contexts.map(c => `<option value="${esc(c)}" ${c === assetContext ? 'selected' : ''}>${esc(c)}</option>`).join('');
    return `<h3 id="inherit-sec-context">Asset Context</h3><div class="output-box pastel-lavender"><p><label>Asset Context: <select id="inherit-context-select">${contextOptions}</select></label></p></div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="inherit-sec-dasha">Current Inheritance Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Inheritance / Legacy Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="inherit-sec-dasha">Current Inheritance Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Inheritance-Factor Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
      ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct inheritance-connection factor found for the current Pratyantardasha lord.']) : ''}
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const supportOptions = ['All', 'Moderately Supportive', 'Supportive', 'Strongly Supportive'].map(s => `<option value="${esc(s)}" ${s === minSupport ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const stages = ['All', 'Family Succession Discussion', 'Documentation / Registration', 'Legal/Succession Process', 'Property Transfer', 'Financial Asset Transfer', 'Settlement / Distribution', 'Receipt / Realization', 'Inherited Property Sale', 'Legacy Planning', 'Mixed Inheritance Development'];
    const stageOptions = stages.map(s => `<option value="${esc(s)}" ${s === stageFilter ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="inherit-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Support: <select id="inherit-support-select">${supportOptions}</select></label> &nbsp; <label>Event Stage: <select id="inherit-stage-select">${stageOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="inherit-sec-windows">Upcoming Inheritance Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence for an inheritance window.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-inherit-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${w.d4Confirmation ? 'Yes' : 'No'}</td><td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td><td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td><td>${badge(w.strength.label)}</td><td>${esc(w.event.label)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="inherit-sec-windows">Upcoming Inheritance Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>D4</th><th>Jupiter</th><th>Saturn</th><th>Support</th><th>Event</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="inherit-sec-detail">Detailed Calculation</h4>${detail}${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Natal Inheritance Factors established', '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — D4 ${w.d4Confirmation ? 'confirms' : 'does not confirm'}`, '&darr;', `Step 4 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}`, '&darr;', 'Step 5 — Related events checked', '&darr;', `Step 6 — Event Classification = ${w.event.label}`, '&darr;', `Step 7 — Window included: ${w.strength.label}`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Event:</strong> ${badge(w.event.label)}</p><p><strong>Support:</strong> ${badge(w.strength.label)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution/Mixed Factors:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      <p><strong>Rahu/Ketu (secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
      ${w.propertyCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Property Cross-Check:</strong> ${esc(w.propertyCrossCheck.interpretation)}</p></div>` : ''}
      ${w.financialCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Financial Cross-Check:</strong> ${esc(w.financialCrossCheck.interpretation)}</p></div>` : ''}
      ${w.legalCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Legal Cross-Check:</strong> ${esc(w.legalCrossCheck.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>INHERITANCE / LEGACY TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span><span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span></div>`).join('');
    return `<h4 id="inherit-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Succession Discussion', 'Documentation', 'Legal Process', 'Property Transfer', 'Settlement', 'Receipt/Realization'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.InheritanceLegacyTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.InheritanceLegacyTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">No chart/dasha data.</td><td><button type="button" class="inherit-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="inherit-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td><td>${badge(v.eighthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td><td>${esc(v.d4Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td><button type="button" class="inherit-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
    }).join('');
    return `<h3 id="inherit-sec-historical">Historical Validation</h3><div class="output-box pastel-yellow">
      <p>Enter a previous succession/documentation/settlement date to see what the method would have shown for it. This module never asks for a relative's date of death.</p>
      <p><input type="date" id="inherit-hist-date-input"> <select id="inherit-hist-type-select">${typeOptions}</select> <button type="button" id="inherit-hist-add-btn">Add Event Date</button></p>
      ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>8th</th><th>11th</th><th>D4</th><th>Jupiter</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="inherit-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }
  function renderLog(r) { return `<h3 id="inherit-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre><button type="button" id="inherit-copy-log-btn">Copy Calculation Log</button></div>`; }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#inherit-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const contextSelect = root.querySelector('#inherit-context-select'); if (contextSelect) contextSelect.addEventListener('change', () => { assetContext = contextSelect.value; selectedWindowIndex = null; UI.render(); });
    const supportSelect = root.querySelector('#inherit-support-select'); if (supportSelect) supportSelect.addEventListener('change', () => { minSupport = supportSelect.value; selectedWindowIndex = null; UI.render(); });
    const stageSelect = root.querySelector('#inherit-stage-select'); if (stageSelect) stageSelect.addEventListener('change', () => { stageFilter = stageSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-inherit-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-inherit-window')); UI.render(); const el = document.getElementById('inherit-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    const addHistBtn = root.querySelector('#inherit-hist-add-btn'); if (addHistBtn) addHistBtn.addEventListener('click', () => { const val = root.querySelector('#inherit-hist-date-input').value; const type = root.querySelector('#inherit-hist-type-select').value; if (val) { historicalEvents.push({ date: val, type }); UI.render(); } });
    root.querySelectorAll('.inherit-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => { historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1); UI.render(); }));
    const copyBtn = root.querySelector('#inherit-copy-log-btn'); if (copyBtn) copyBtn.addEventListener('click', () => { const text = result.calculationLog.join('\n'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); }); });
  }

  UI.render = function () {
    const root = document.getElementById('inherit-root');
    if (!root) return;
    const result = window.InheritanceLegacyTiming.refresh(horizonYears, assetContext, minSupport, stageFilter);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Inheritance / Legacy Timing analysis.</p>' + renderDisclaimer(); return; }
    root.innerHTML = [
      renderDisclaimer(),
      '<p>Parashari/Vimshottari inheritance/legacy timing (no KP or Western technique). This is an asset/succession-development timing module only — it never predicts death, lifespan, or infers when a relative will die. Traces: <strong>Natal Inheritance Factors &rarr; Dasha &rarr; D4 Confirmation &rarr; Transit &rarr; Related Events &rarr; Event Classification &rarr; Final Window</strong>. A period is never classified as inheritance merely because the 8th house is activated.</p>',
      renderPromise(result), renderD4(result), renderContextAndHorizon(), renderCurrentDasha(result), renderWindows(result), renderHistorical(), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.InheritanceLegacyTiming) window.InheritanceLegacyTiming.init(); };
  UI.init();
  return UI;
})();
