/* =========================================================
   CHILD EDUCATION / ACADEMIC MILESTONE TIMING — rendering layer only.
   Consumes window.ChildEducationTiming (engine) and renders into
   #cedu-root. Namespaced as window.ChildEducationTimingUI.
   Always displays the active analysis-subject mode prominently —
   never lets parent-chart and child's-own-chart analysis look the same.
   ========================================================= */

window.ChildEducationTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let subjectMode = 'parent';
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

  function renderModeBanner(r) {
    const isChild = r.subjectMode === 'child';
    return `<h3 id="cedu-sec-mode">Analysis Subject</h3>
      <div class="output-box ${isChild ? 'pastel-mint' : 'pastel-lavender'}">
        <p><strong>Active Mode: ${isChild ? "Child's Own Saved Chart" : "Parent's Chart (child-related houses)"}</strong></p>
        <p style="font-size:0.85em;color:#555;">${isChild
          ? 'This analysis reads the currently loaded chart AS the child\'s own natal chart. To analyze a different child, load that child\'s record from the Saved Natives tab first, then return here.'
          : 'This analysis reads the currently loaded chart as the PARENT\'s chart, using the 5th/9th houses and their lords as child-related indicators — it is not the child\'s own chart.'}</p>
        <p><label><select id="cedu-mode-select"><option value="parent" ${!isChild ? 'selected' : ''}>Parent's Chart (5th/9th house indicators)</option><option value="child" ${isChild ? 'selected' : ''}>Child's Own Saved Chart (currently loaded chart)</option></select></label></p>
      </div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h, label) { return `<tr><td>${esc(label)} (${h.house}th, ${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    return `<h3 id="cedu-sec-promise">Natal ${r.subjectMode === 'child' ? "Child's" : 'Parent-Chart'} Education / Academic Potential</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.pattern)}</strong></p>
        ${evidenceDetails('Why this pattern?', np.reasons)}
        <table class="rem-table"><thead><tr><th>House</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(np.fifth, '5th — Learning/Intelligence Context')}${houseRow(np.fourth, '4th — Foundational Education')}${houseRow(np.ninth, '9th — Higher Learning')}
          ${houseRow(np.second, '2nd — Early Learning')}${houseRow(np.eleventh, '11th — Goal Fulfilment')}${houseRow(np.third, '3rd — Effort/Practice')}
          ${houseRow(np.sixth, '6th — Examination/Competition Context')}${houseRow(np.eighth, '8th — Research/Specialised Study')}${houseRow(np.tenth, '10th — Institutional Recognition')}${houseRow(np.twelfth, '12th — Study Abroad/Residential')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This is not a prediction of marks, rank, IQ, guaranteed admission/scholarship, or exam success. It never diagnoses a learning disability or infers intelligence.</p>
      </div>`;
  }

  function renderD24(r) {
    return `<h3 id="cedu-sec-d24">D24 (Siddhamsha) Confirmation</h3><div class="output-box pastel-mint">
      <p><strong>${badge(r.d24.level)}</strong></p>${evidenceDetails('D24 evidence', r.d24.evidence)}
      <p style="font-size:0.85em;color:#777;">D24 confirms D1 — it never replaces it. This is the same D24 engine Higher Education Timing uses, reused here, not duplicated.</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="cedu-sec-dasha">Current Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `<h3 id="cedu-sec-dasha">Current Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Connection</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const strengthOptions = ['All', 'Delayed / Conditional', 'Mixed', 'Supported', 'Strongly Supported'].map(s => `<option value="${esc(s)}" ${s === minStrength ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="cedu-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Strength: <select id="cedu-strength-select">${strengthOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="cedu-sec-windows">Upcoming Academic Milestone Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-cedu-window="${i}" style="cursor:pointer;" class="${qualityClass(w.strength.label)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.activatedHouses.join(', ')}</td><td>${badge(w.strength.label)}</td><td>${esc(w.stage)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="cedu-sec-windows">Upcoming Academic Milestone Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>Strength</th><th>Stage</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="cedu-sec-detail">Detailed Calculation</h4>${detail}`;
  }

  function renderWindowDetail(w) {
    const trace = ['Step 1 — Natal Promise established', '&darr;', `Step 2 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}`, '&darr;', `Step 3 — D24 confirmation checked`, '&darr;', `Step 4 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Mercury ${w.transit.mercury.active ? 'active' : 'not active'}`, '&darr;', `Step 5 — Convergence factors: ${w.convergenceFactors}`, '&darr;', `Step 6 — Stage: ${w.stage}`, '&darr;', `Step 7 — Window included: ${w.strength.label}`].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Strength:</strong> ${badge(w.strength.label)}</p><p><strong>Stage:</strong> ${badge(w.stage)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      ${w.cautions.length ? `<p><strong>Caution:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Mercury transit:</strong> ${esc(w.transit.mercury.sign)}, house ${w.transit.mercury.house} ${badge(w.transit.mercury.active ? 'Active' : 'Not active')}</p>
      ${w.crossModules ? `<div class="output-box pastel-yellow"><p><strong>Cross-Module Check:</strong> ${esc(w.crossModules.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>CHILD EDUCATION TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="cedu-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="cedu-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#cedu-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const modeSelect = root.querySelector('#cedu-mode-select'); if (modeSelect) modeSelect.addEventListener('change', () => { subjectMode = modeSelect.value; selectedWindowIndex = null; UI.render(); });
    const strengthSelect = root.querySelector('#cedu-strength-select'); if (strengthSelect) strengthSelect.addEventListener('change', () => { minStrength = strengthSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-cedu-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-cedu-window')); UI.render(); const el = document.getElementById('cedu-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('cedu-root');
    if (!root) return;
    const result = window.ChildEducationTiming.refresh(horizonYears, subjectMode, minStrength);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Child Education Timing analysis.</p>'; return; }
    root.innerHTML = [
      '<p>Parashari/Vimshottari child-education/academic-milestone timing. Traces: <strong>Analysis Subject &rarr; Natal Promise &rarr; D24 Confirmation &rarr; Dasha &rarr; Transit &rarr; Candidate Window &rarr; Milestone Stage &rarr; Cross-Module Checks</strong>. This module never predicts exact marks, rank, IQ, guaranteed admission/scholarship, or exam success, and never diagnoses a learning disability, infers intelligence, or predicts a child\'s health or lifespan.</p>',
      renderModeBanner(result), renderPromise(result), renderD24(result), renderCurrentDasha(result), renderWindows(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.ChildEducationTiming) window.ChildEducationTiming.init(); };
  UI.init();
  return UI;
})();
