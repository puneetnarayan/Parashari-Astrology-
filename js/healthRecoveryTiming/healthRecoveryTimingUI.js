/* =========================================================
   HEALTH & RECOVERY TIMING — rendering layer only. Consumes
   window.HealthRecoveryTiming (engine) and renders into #health-root.
   Namespaced as window.HealthRecoveryTimingUI. Always displays the
   medical-safety disclaimer, and every piece of displayed interpretive
   text has already passed through the engine's safety filter.
   ========================================================= */

window.HealthRecoveryTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let context = 'General Wellness';
  let minStrength = 'All';
  let selectedWindowIndex = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l === 'supportive' || l === 'strong') return 'quality-good';
    if (l === 'generally supportive' || l === 'mixed' || l === 'supporting' || l === 'moderate') return 'quality-neutral';
    if (l.includes('attention') || l.includes('delayed') || l.includes('conditional')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderDisclaimer(r) {
    return `<div class="output-box pastel-yellow" style="border:2px solid #cc4444;"><p style="font-size:0.9em;"><strong>Medical Disclaimer:</strong> ${esc(r.disclaimer)}</p></div>`;
  }

  function renderContext() {
    const contexts = ['General Wellness', 'Recovery / Restoration', 'Rehabilitation', 'Existing Treatment/Recovery Phase', 'General Health Timing'];
    const opts = contexts.map(c => `<option value="${esc(c)}" ${c === context ? 'selected' : ''}>${esc(c)}</option>`).join('');
    return `<h3 id="health-sec-context">Wellness/Recovery Context</h3><div class="output-box pastel-lavender">
      <p><label>Context: <select id="health-context-select">${opts}</select></label></p>
      <p style="font-size:0.85em;color:#777;">The selected context changes interpretation only — never the underlying horoscope calculation.</p>
    </div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h, label) { return h ? `<tr><td>${esc(label)} (${h.house}th, ${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>` : ''; }
    return `<h3 id="health-sec-promise">Natal Wellness / Recovery Pattern</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.pattern)}</strong></p>
        ${evidenceDetails('Why this pattern?', np.reasons)}
        <table class="rem-table"><thead><tr><th>House</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(np.first, '1st — Body/Vitality Context')}${houseRow(np.sixth, '6th — Routine/Recovery Effort')}${houseRow(np.eighth, '8th — Transformation/Chronic-Duration (never death)')}${houseRow(np.twelfth, '12th — Rest/Recovery Environment')}${houseRow(np.eleventh, '11th — Improvement/Realization')}
          ${Object.entries(np.supporting).map(([h, v]) => v ? houseRow(v, h + 'th — Supporting House') : '').join('')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">These are astrological categories only. They are never converted into medical diagnoses, medical risk scores, or a medical prognosis.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="health-sec-dasha">Current Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="health-sec-dasha">Current Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const strengthOptions = ['All', 'Delayed / Conditional', 'Requires Greater Attention', 'Mixed', 'Generally Supportive', 'Supportive'].map(s => `<option value="${esc(s)}" ${s === minStrength ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="health-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Strength: <select id="health-strength-select">${strengthOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="health-sec-windows">Upcoming Wellness/Recovery Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-health-window="${i}" style="cursor:pointer;" class="${qualityClass(w.strength.label)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${badge(w.strength.label)}</td><td>${esc(w.stage)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="health-sec-windows">Upcoming Wellness/Recovery Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>Strength</th><th>Stage</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="health-sec-detail">Detailed Calculation</h4>${detail}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Context: ' + esc(w.context), '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}`, '&darr;', `Step 4 — Convergence factors: ${w.convergenceFactors}`, '&darr;', `Step 5 — Stage: ${w.stage}`, '&darr;', `Step 6 — Window included: ${w.strength.label} (safety-filtered interpretation)`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Strength:</strong> ${badge(w.strength.label)}</p><p><strong>Stage:</strong> ${badge(w.stage)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      ${w.crossModules ? `<div class="output-box pastel-yellow"><p><strong>Cross-Module Check:</strong> ${esc(w.crossModules.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>HEALTH &amp; RECOVERY TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="health-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="health-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#health-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const contextSelect = root.querySelector('#health-context-select'); if (contextSelect) contextSelect.addEventListener('change', () => { context = contextSelect.value; selectedWindowIndex = null; UI.render(); });
    const strengthSelect = root.querySelector('#health-strength-select'); if (strengthSelect) strengthSelect.addEventListener('change', () => { minStrength = strengthSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-health-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-health-window')); UI.render(); const el = document.getElementById('health-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('health-root');
    if (!root) return;
    const result = window.HealthRecoveryTiming.refresh(horizonYears, context, minStrength);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Health &amp; Recovery Timing analysis.</p>'; return; }
    root.innerHTML = [
      renderDisclaimer(result),
      '<p>Parashari/Vimshottari wellness/recovery timing. Traces: <strong>Context &rarr; Relevant Houses &rarr; House Lords &rarr; Natal Pattern &rarr; Dasha &rarr; Transit &rarr; Convergence &rarr; Safety-Filtered Interpretation</strong>. This module never diagnoses disease, predicts death/lifespan/accidents/injury, recommends medication or treatment, infers mental-health conditions or disability, or determines medical-procedure success.</p>',
      renderContext(), renderPromise(result), renderCurrentDasha(result), renderWindows(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.HealthRecoveryTiming) window.HealthRecoveryTiming.init(); };
  UI.init();
  return UI;
})();
