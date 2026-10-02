/* =========================================================
   RELATIONSHIP / PARTNERSHIP START TIMING — rendering layer only.
   Consumes window.RelationshipPartnershipTiming (engine) and renders
   into #relpart-root. Namespaced as window.RelationshipPartnershipTimingUI.
   ========================================================= */

window.RelationshipPartnershipTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let minStrength = 'All';
  let selectedWindowIndex = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l === 'supports') return 'quality-good';
    if (l === 'supported' || l === 'mixed') return 'quality-neutral';
    if (l.includes('delayed') || l.includes('careful')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderScopeNote() {
    return `<div class="output-box pastel-yellow" style="border:1px solid #e0b800;"><p style="font-size:0.9em;"><strong>Scope:</strong> This module never guarantees a relationship, commitment, or marriage; never infers another person's thoughts, intentions, or fidelity; never infers abuse, a mental-health condition, or a personality disorder; never predicts coercion or violence; and never identifies a specific destined partner. It is explicitly distinct from Marriage Timing, Marriage Separation/Divorce Timing, and Matching/Compatibility.</p></div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h, label) { return `<tr><td>${esc(label)} (${h.house}th, ${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    return `<h3 id="relpart-sec-promise">Natal Relationship Potential</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.pattern)}</strong></p>
        ${evidenceDetails('Why this pattern?', np.reasons)}
        <table class="rem-table"><thead><tr><th>House</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(np.fifth, '5th — Romance/Attraction')}${houseRow(np.seventh, '7th — Partnership (ambiguous alone)')}${houseRow(np.eleventh, '11th — Social Realization')}
          ${houseRow(np.first, '1st — Self/Approach')}${houseRow(np.second, '2nd — Shared Resources')}${houseRow(np.third, '3rd — Initiative')}${houseRow(np.ninth, '9th — Values/Fortune')}${houseRow(np.twelfth, '12th — Intimacy')}
          ${houseRow(np.sixth, '6th — Friction/Negotiation (contextual only)')}${houseRow(np.eighth, '8th — Intensity/Transformation (contextual only)')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This shows the astrological reasoning only. It never makes a personality or character judgement about the native or any potential partner.</p>
      </div>`;
  }

  function renderD9(r) {
    return `<h3 id="relpart-sec-d9">D9 (Navamsha) Confirmation</h3><div class="output-box pastel-mint">
      <p><strong>${badge(r.d9.level)}</strong></p>${evidenceDetails('D9 evidence', r.d9.evidence)}
      <p style="font-size:0.85em;color:#777;">D9 confirms D1 — it never replaces it. Used here only as supporting confirmation; this module is not Marriage Timing.</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="relpart-sec-dasha">Current Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="relpart-sec-dasha">Current Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const strengthOptions = ['All', 'Delayed / Conditional', 'Mixed', 'Supported', 'Strongly Supported'].map(s => `<option value="${esc(s)}" ${s === minStrength ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="relpart-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Strength: <select id="relpart-strength-select">${strengthOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="relpart-sec-windows">Upcoming Relationship/Partnership Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-relpart-window="${i}" style="cursor:pointer;" class="${qualityClass(w.strength.label)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${badge(w.strength.label)}</td><td>${esc(w.context)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="relpart-sec-windows">Upcoming Relationship/Partnership Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>Strength</th><th>Context</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="relpart-sec-detail">Detailed Calculation</h4>${detail}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Natal Promise established', '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — D9 confirmation checked`, '&darr;', `Step 4 — Venus ${w.transit.venus.active ? 'active' : 'not active'}, Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}`, '&darr;', `Step 5 — Convergence factors: ${w.convergenceFactors}`, '&darr;', `Step 6 — Context: ${w.context}`, '&darr;', `Step 7 — Window included: ${w.strength.label}`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Strength:</strong> ${badge(w.strength.label)}</p><p><strong>Context:</strong> ${badge(w.context)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Venus transit:</strong> ${esc(w.transit.venus.sign)}, house ${w.transit.venus.house} ${badge(w.transit.venus.active ? 'Active' : 'Not active')}</p>
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      ${w.crossModules ? `<div class="output-box pastel-yellow"><p><strong>Cross-Module Check:</strong> ${esc(w.crossModules.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>RELATIONSHIP/PARTNERSHIP TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="relpart-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="relpart-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#relpart-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const strengthSelect = root.querySelector('#relpart-strength-select'); if (strengthSelect) strengthSelect.addEventListener('change', () => { minStrength = strengthSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-relpart-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-relpart-window')); UI.render(); const el = document.getElementById('relpart-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('relpart-root');
    if (!root) return;
    const result = window.RelationshipPartnershipTiming.refresh(horizonYears, minStrength);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Relationship / Partnership Start Timing analysis.</p>'; return; }
    root.innerHTML = [
      renderScopeNote(),
      '<p>Parashari/Vimshottari relationship/partnership-start timing. Traces: <strong>Natal Promise &rarr; D9 Confirmation &rarr; Dasha &rarr; Transit &rarr; Candidate Window &rarr; Personal/Professional Context &rarr; Cross-Module Checks</strong>.</p>',
      renderPromise(result), renderD9(result), renderCurrentDasha(result), renderWindows(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.RelationshipPartnershipTiming) window.RelationshipPartnershipTiming.init(); };
  UI.init();
  return UI;
})();
