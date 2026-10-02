/* =========================================================
   HOME CONSTRUCTION / RENOVATION TIMING — rendering layer only.
   Consumes window.HomeConstructionTiming (engine) and renders into
   #hc-root. Uses this app's EXISTING shared UI conventions.
   Namespaced as window.HomeConstructionTimingUI.
   ========================================================= */

window.HomeConstructionTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let selectedWindowIndex = null;
  let historicalEvents = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes' || l.includes('supports')) return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('delayed') || l.includes('partial')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('careful interpretation') || l.includes('does not')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="hc-sec-promise">Natal Home Construction / Renovation Potential</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.potential)}</strong></p>
        ${evidenceDetails('Why this potential level?', np.reasons)}
        <table class="rem-table"><thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(np.fourthHouse)}${houseRow(np.secondHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.thirdHouse)}${houseRow(np.sixthHouse)}${houseRow(np.eighthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.twelfthHouse)}
          ${karakaRow(np.mars, 'Mars')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.sun, 'Sun')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This indicates whether the horoscope contains meaningful construction/renovation signatures — it does not guarantee completion, approval, cost, or contractor performance.</p>
      </div>
      <h4 id="hc-sec-signature">House Relationship Signatures</h4>
      <div class="output-box pastel-mint"><table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
        ${np.relationships.map(rel => `<tr class="${rel.connected ? 'quality-good' : ''}"><td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td></tr>`).join('')}
        ${np.transformRelationships.map(rel => `<tr class="${rel.connected ? 'quality-good' : ''}"><td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function renderD4(r) {
    const d4 = r.d4Confirmation;
    if (!d4.available) return `<h3 id="hc-sec-d4">D4 Confirmation</h3><p style="color:#a33;">D4 confirmation is unavailable for this chart.</p>`;
    return `<h3 id="hc-sec-d4">D4 (Chaturthamsha) Confirmation</h3><div class="output-box pastel-yellow">
      <p><strong>${badge(d4.level)}</strong></p>
      <table class="rem-table"><tr><td>D4 Ascendant</td><td>${esc(d4.d4.ascendantSign)} (lord ${esc(d4.d4.lagnaLord)})</td></tr><tr><td>D4 4th</td><td>${esc(d4.d4.fourthSign)} (lord ${esc(d4.d4.fourthLord)})</td></tr><tr><td>D4 10th</td><td>${esc(d4.d4.tenthSign)} (lord ${esc(d4.d4.tenthLord)})</td></tr><tr><td>D4 11th</td><td>${esc(d4.d4.eleventhSign)} (lord ${esc(d4.d4.eleventhLord)})</td></tr></table>
      ${evidenceDetails('Why this D4 level?', d4.evidence)}
      <p style="font-size:0.85em;color:#777;">D4 confirms D1 — it never replaces it. This is the same D4 engine Property Purchase/Sale Timing use, reused here, not duplicated.</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="hc-sec-dasha">Current Construction Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Home Construction Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="hc-sec-dasha">Current Construction Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Construction-Factor Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
      ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct construction-connection factor found for the current Pratyantardasha lord.']) : ''}
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="hc-horizon-select">${horizonOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="hc-sec-windows">Candidate Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence for a home construction/renovation window.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-hc-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.stage.label)}</td><td>${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)}</td><td>${w.d4Confirmation ? 'Yes' : 'No'}</td><td>${w.transit.jupiter.active || w.transit.saturn.active || w.transit.mars.active ? 'Active' : '&mdash;'}</td><td>${w.activatedHouses.join(', ')}</td><td>${badge(w.strength.label)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="hc-sec-windows">Candidate Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>Stage</th><th>Dasha</th><th>D4</th><th>Transit</th><th>Houses</th><th>Assessment</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="hc-sec-detail">Detailed Analysis</h4>${detail}${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Relevant Houses established', '&darr;', 'Step 2 — House Lords analysed', '&darr;', 'Step 3 — Natal Property/Construction Promise computed', '&darr;', `Step 4 — D4 ${w.d4Confirmation ? 'confirms' : 'does not confirm'} construction`, '&darr;', `Step 5 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 6 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}, Mars ${w.transit.mars.active ? 'active' : 'not active'}`, '&darr;', `Step 7 — Convergence factors: ${w.convergenceFactors}`, '&darr;', `Step 8 — Event Stage = ${w.stage.label} (${w.eventType})`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Stage:</strong> ${badge(w.stage.label)}</p><p><strong>Event Type:</strong> ${badge(w.eventType)}</p><p><strong>Assessment:</strong> ${badge(w.strength.label)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Delay/Obstruction Context:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      <p><strong>Mars transit (execution indicator only):</strong> ${esc(w.transit.mars.sign)}, house ${w.transit.mars.house} ${badge(w.transit.mars.active ? 'Active' : 'Not active')}</p>
      <p><strong>Venus/Moon transit:</strong> Venus ${badge(w.transit.venus.active ? 'Active' : 'Not active')}, Moon ${badge(w.transit.moon.active ? 'Active' : 'Not active')}</p>
      <p><strong>Rahu/Ketu (secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
      ${w.purchaseCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Property Purchase Cross-Check:</strong> ${esc(w.purchaseCrossCheck.interpretation)}</p></div>` : ''}
      ${w.saleCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Property Sale Cross-Check:</strong> ${esc(w.saleCrossCheck.interpretation)}</p></div>` : ''}
      ${w.relocationTheme ? `<div class="output-box pastel-yellow"><p><strong>Relocation Theme:</strong> ${esc(w.relocationTheme.interpretation)}</p></div>` : ''}
      ${w.loanCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Loan/Debt Cross-Check:</strong> ${esc(w.loanCrossCheck.interpretation)}</p></div>` : ''}
      ${w.financialCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Financial Gain Cross-Check:</strong> ${esc(w.financialCrossCheck.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>HOME CONSTRUCTION TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span><span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.stage.label)}</span></div>`).join('');
    return `<h4 id="hc-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Construction Start', 'Foundation', 'Major Renovation', 'Extension', 'Reconstruction', 'Completion', 'Possession'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.HomeConstructionTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.HomeConstructionTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">No chart/dasha data.</td><td><button type="button" class="hc-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="hc-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td><td>${badge(v.fourthActivation ? 'Yes' : 'No')}</td><td>${badge(v.tenthActivation ? 'Yes' : 'No')}</td><td>${esc(v.d4Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td><button type="button" class="hc-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
    }).join('');
    return `<h3 id="hc-sec-historical">Historical Validation</h3><div class="output-box pastel-yellow">
      <p>Enter a previous construction/renovation/completion date to see what the method would have shown for it.</p>
      <p><input type="date" id="hc-hist-date-input"> <select id="hc-hist-type-select">${typeOptions}</select> <button type="button" id="hc-hist-add-btn">Add Event Date</button></p>
      ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>4th</th><th>10th</th><th>D4</th><th>Jupiter</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="hc-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="hc-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre><button type="button" id="hc-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function renderLimitations() {
    return `<h3 id="hc-sec-limitations">Limitations</h3><div class="output-box pastel-peach">
      <p style="font-size:0.9em;">This is an astrological timing analysis, not construction, engineering, legal, or financial advice. It cannot guarantee construction success, completion, approvals, cost, contractor performance, or property value. Actual outcomes depend on engineering, permits, contractors, materials, financing, regulations, and real-world conditions. Do not use this module as the sole basis for construction or financial decisions. This module never predicts accidents, injuries, or deaths, and never provides a legal conclusion from astrological indicators.</p>
    </div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#hc-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-hc-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-hc-window')); UI.render(); const el = document.getElementById('hc-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    const addHistBtn = root.querySelector('#hc-hist-add-btn'); if (addHistBtn) addHistBtn.addEventListener('click', () => { const val = root.querySelector('#hc-hist-date-input').value; const type = root.querySelector('#hc-hist-type-select').value; if (val) { historicalEvents.push({ date: val, type }); UI.render(); } });
    root.querySelectorAll('.hc-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => { historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1); UI.render(); }));
    const copyBtn = root.querySelector('#hc-copy-log-btn'); if (copyBtn) copyBtn.addEventListener('click', () => { const text = result.calculationLog.join('\n'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); }); });
  }

  UI.render = function () {
    const root = document.getElementById('hc-root');
    if (!root) return;
    const result = window.HomeConstructionTiming.refresh(horizonYears);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Home Construction / Renovation Timing analysis.</p>'; return; }
    root.innerHTML = [
      '<p>Parashari/Vimshottari home construction/renovation timing (no KP or Western technique). Explicitly distinct from Property Purchase Timing (acquisition), Property Sale Timing (disposal), Relocation (movement), and Vehicle Timing. Traces: <strong>Relevant Houses &rarr; House Lords &rarr; Natal Promise &rarr; D4 Confirmation &rarr; Dasha &rarr; Transit &rarr; Convergence &rarr; Event Stage</strong>. No single house combination is treated as an automatic construction event, and this module never guarantees construction success, completion, approvals, cost, or contractor performance, and never predicts accidents, injuries, or deaths.</p>',
      renderPromise(result), renderD4(result), renderCurrentDasha(result), renderWindows(result), renderHistorical(), renderLog(result), renderRules(result), renderLimitations()
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.HomeConstructionTiming) window.HomeConstructionTiming.init(); };
  UI.init();
  return UI;
})();
