/* =========================================================
   INSURANCE / FINANCIAL PROTECTION TIMING — rendering layer only.
   Consumes window.InsuranceProtectionTiming (engine) and renders into
   #ins-root. Namespaced as window.InsuranceProtectionTimingUI.
   ========================================================= */

window.InsuranceProtectionTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let eventContext = 'General';
  let minStrength = 'All';
  let selectedWindowIndex = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l === 'supports') return 'quality-good';
    if (l === 'indicated' || l === 'mixed') return 'quality-neutral';
    if (l.includes('conditional') || l.includes('careful')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderDisclaimer() {
    return `<div class="output-box pastel-yellow" style="border:1px solid #e0b800;"><p style="font-size:0.9em;"><strong>Notice:</strong> This is an astrological timing analysis for general financial-protection context. It never recommends a specific insurer, policy, premium, or coverage amount, and never guarantees claim approval, settlement, or payout. It is not financial, legal, or medical advice.</p></div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h, label) { return h ? `<tr><td>${esc(label)} (${h.house}th, ${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>` : ''; }
    return `<h3 id="ins-sec-promise">Natal Insurance / Financial Protection Pattern</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.pattern)}</strong></p>
        ${evidenceDetails('Why this pattern?', np.reasons)}
        <table class="rem-table"><thead><tr><th>House</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(np.second, '2nd — Resources')}${houseRow(np.sixth, '6th — Risk Management')}${houseRow(np.eighth, '8th — Risk/Transformation (never death)')}${houseRow(np.eleventh, '11th — Gains/Proceeds')}${houseRow(np.twelfth, '12th — Premium Outflow')}
          ${Object.entries(np.supporting).map(([h, v]) => v ? houseRow(v, h + 'th — Context House') : '').join('')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This is not a recommendation to buy or avoid insurance, and the 8th house is never read as death or lifespan in this module.</p>
      </div>`;
  }

  function renderDivisional(r) {
    let html = `<h3 id="ins-sec-divisional">Divisional Confirmation</h3><div class="output-box pastel-mint">
      <p><strong>D2 (Hora):</strong> ${badge(r.d2.level)}</p>${evidenceDetails('D2 evidence', r.d2.evidence)}`;
    if (r.eventDivisional) html += `<p><strong>${esc(r.eventDivisional.varga)} (event-specific):</strong> ${badge(r.eventDivisional.level)}</p>${evidenceDetails(r.eventDivisional.varga + ' evidence', r.eventDivisional.evidence)}`;
    html += `<p style="font-size:0.85em;color:#777;">Divisional charts confirm D1 — they never replace it. Reused directly from this app's existing divisional-chart engine.</p></div>`;
    return html;
  }

  function renderContext() {
    const contexts = ['General', 'Life/Family', 'Health-related', 'Property', 'Vehicle', 'Business', 'Travel', 'Claim/Settlement', 'Maturity/Payout', 'Other'];
    const opts = contexts.map(c => `<option value="${esc(c)}" ${c === eventContext ? 'selected' : ''}>${esc(c)}</option>`).join('');
    return `<h3 id="ins-sec-context">Event Context</h3><div class="output-box pastel-lavender">
      <p><label>Event Context: <select id="ins-context-select">${opts}</select></label></p>
      <p style="font-size:0.85em;color:#777;">The context changes which supporting houses/divisional chart are checked — never the underlying horoscope.</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="ins-sec-dasha">Current Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="ins-sec-dasha">Current Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const strengthOptions = ['All', 'Conditional', 'Mixed', 'Indicated', 'Strongly Indicated'].map(s => `<option value="${esc(s)}" ${s === minStrength ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="ins-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Strength: <select id="ins-strength-select">${strengthOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="ins-sec-windows">Upcoming Protection-Relevant Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-ins-window="${i}" style="cursor:pointer;" class="${qualityClass(w.strength.label)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${badge(w.strength.label)}</td><td>${esc(w.stage)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="ins-sec-windows">Upcoming Protection-Relevant Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>Strength</th><th>Stage</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="ins-sec-detail">Detailed Calculation</h4>${detail}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Natal Promise established', '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — Divisional confirmation checked`, '&darr;', `Step 4 — Saturn ${w.transit.saturn.active ? 'active' : 'not active'}, Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}`, '&darr;', `Step 5 — Convergence factors: ${w.convergenceFactors}`, '&darr;', `Step 6 — Stage: ${w.stage}`, '&darr;', `Step 7 — Window included: ${w.strength.label}`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Strength:</strong> ${badge(w.strength.label)}</p><p><strong>Stage:</strong> ${badge(w.stage)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      ${w.crossModules ? `<div class="output-box pastel-yellow"><p><strong>Cross-Module Check:</strong> ${esc(w.crossModules.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>INSURANCE/PROTECTION TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="ins-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="ins-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#ins-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const contextSelect = root.querySelector('#ins-context-select'); if (contextSelect) contextSelect.addEventListener('change', () => { eventContext = contextSelect.value; selectedWindowIndex = null; UI.render(); });
    const strengthSelect = root.querySelector('#ins-strength-select'); if (strengthSelect) strengthSelect.addEventListener('change', () => { minStrength = strengthSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-ins-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-ins-window')); UI.render(); const el = document.getElementById('ins-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('ins-root');
    if (!root) return;
    const result = window.InsuranceProtectionTiming.refresh(horizonYears, eventContext, minStrength);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Insurance / Financial Protection Timing analysis.</p>'; return; }
    root.innerHTML = [
      renderDisclaimer(),
      '<p>Parashari/Vimshottari insurance/financial-protection timing. Traces: <strong>Natal Promise &rarr; Divisional Confirmation &rarr; Dasha &rarr; Transit &rarr; Candidate Window &rarr; Protection-Context Stage &rarr; Cross-Module Checks</strong>.</p>',
      renderPromise(result), renderDivisional(result), renderContext(), renderCurrentDasha(result), renderWindows(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.InsuranceProtectionTiming) window.InsuranceProtectionTiming.init(); };
  UI.init();
  return UI;
})();
