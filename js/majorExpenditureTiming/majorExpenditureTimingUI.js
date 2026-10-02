/* =========================================================
   MAJOR EXPENDITURE / FINANCIAL COMMITMENT TIMING — rendering layer
   only. Consumes window.MajorExpenditureTiming (engine) and renders
   into #majexp-root. Namespaced as window.MajorExpenditureTimingUI.
   ========================================================= */

window.MajorExpenditureTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let purpose = 'General';
  let minStrength = 'All';
  let selectedWindowIndex = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l === 'supports' || l === 'planned') return 'quality-good';
    if (l.includes('indicated') || l === 'mixed' || l === 'moderate') return 'quality-neutral';
    if (l.includes('conditional') || l.includes('careful') || l.includes('unplanned') || l.includes('challenging')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h, label) { return h ? `<tr><td>${esc(label)} (${h.house}th, ${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>` : ''; }
    return `<h3 id="majexp-sec-promise">Natal Major Expenditure Pattern</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.pattern)}</strong></p>
        ${evidenceDetails('Why this pattern?', np.reasons)}
        <table class="rem-table"><thead><tr><th>House</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(np.second, '2nd — Resources')}${houseRow(np.twelfth, '12th — Expenditure')}${houseRow(np.fourth, '4th — Assets')}${houseRow(np.eleventh, '11th — Gains')}
          ${Object.entries(np.purposeDetail).map(([h, v]) => v ? houseRow(v, h + 'th — Purpose House') : '').join('')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This indicates whether the horoscope shows meaningful signatures for a major financial commitment — it never predicts a specific amount, loan, or investment.</p>
      </div>`;
  }

  function renderDivisional(r) {
    let html = `<h3 id="majexp-sec-divisional">Divisional Confirmation</h3><div class="output-box pastel-mint">
      <p><strong>D2 (Hora):</strong> ${badge(r.d2.level)}</p>${evidenceDetails('D2 evidence', r.d2.evidence)}`;
    if (r.purposeDivisional) html += `<p><strong>${esc(r.purposeDivisional.varga)} (purpose-specific):</strong> ${badge(r.purposeDivisional.level)}</p>${evidenceDetails(r.purposeDivisional.varga + ' evidence', r.purposeDivisional.evidence)}`;
    html += `<p style="font-size:0.85em;color:#777;">Divisional charts confirm D1 — they never replace it. Reused directly from this app's existing divisional-chart engine, never duplicated.</p></div>`;
    return html;
  }

  function renderContext() {
    const purposes = ['General', 'Property', 'Vehicle', 'Education', 'Business', 'Debt-Financed', 'Travel/Partnership'];
    const opts = purposes.map(p => `<option value="${esc(p)}" ${p === purpose ? 'selected' : ''}>${esc(p)}</option>`).join('');
    return `<h3 id="majexp-sec-context">Expenditure Purpose</h3><div class="output-box pastel-lavender">
      <p><label>Purpose Context: <select id="majexp-purpose-select">${opts}</select></label></p>
      <p style="font-size:0.85em;color:#777;">The purpose context changes which supporting houses/divisional chart are checked — never the underlying horoscope. This module never recommends a specific investment, loan, lender, or amount.</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="majexp-sec-dasha">Current Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="majexp-sec-dasha">Current Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const strengthOptions = ['All', 'Conditional', 'Mixed', 'Indicated', 'Strongly Indicated'].map(s => `<option value="${esc(s)}" ${s === minStrength ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="majexp-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Strength: <select id="majexp-strength-select">${strengthOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="majexp-sec-windows">Upcoming Major Expenditure Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-majexp-window="${i}" style="cursor:pointer;" class="${qualityClass(w.strength.label)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${badge(w.strength.label)}</td><td>${badge(w.nature)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="majexp-sec-windows">Upcoming Major Expenditure Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>Strength</th><th>Nature</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="majexp-sec-detail">Detailed Calculation</h4>${detail}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Natal Promise established', '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — Divisional confirmation checked`, '&darr;', `Step 4 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}`, '&darr;', `Step 5 — Convergence factors: ${w.convergenceFactors}`, '&darr;', `Step 6 — Nature: ${w.nature}`, '&darr;', `Step 7 — Window included: ${w.strength.label}`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Strength:</strong> ${badge(w.strength.label)}</p><p><strong>Nature:</strong> ${badge(w.nature)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      ${w.propertyCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Property/Vehicle Cross-Check:</strong> ${esc(w.propertyCrossCheck.interpretation)}</p></div>` : ''}
      ${w.financialCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Financial Cross-Check:</strong> ${esc(w.financialCrossCheck.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>MAJOR EXPENDITURE TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="majexp-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="majexp-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#majexp-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const purposeSelect = root.querySelector('#majexp-purpose-select'); if (purposeSelect) purposeSelect.addEventListener('change', () => { purpose = purposeSelect.value; selectedWindowIndex = null; UI.render(); });
    const strengthSelect = root.querySelector('#majexp-strength-select'); if (strengthSelect) strengthSelect.addEventListener('change', () => { minStrength = strengthSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-majexp-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-majexp-window')); UI.render(); const el = document.getElementById('majexp-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('majexp-root');
    if (!root) return;
    const result = window.MajorExpenditureTiming.refresh(horizonYears, purpose, minStrength);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Major Expenditure Timing analysis.</p>'; return; }
    root.innerHTML = [
      '<p>Parashari/Vimshottari major-expenditure/financial-commitment timing. Traces: <strong>Natal Promise &rarr; Divisional Confirmation &rarr; Dasha &rarr; Transit &rarr; Candidate Window &rarr; Planned/Unplanned Classification &rarr; Cross-Module Checks</strong>. This module never recommends a specific investment, loan, lender, financial product, or purchase/borrowing amount, and never predicts a medical emergency or accident.</p>',
      renderPromise(result), renderDivisional(result), renderContext(), renderCurrentDasha(result), renderWindows(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.MajorExpenditureTiming) window.MajorExpenditureTiming.init(); };
  UI.init();
  return UI;
})();
