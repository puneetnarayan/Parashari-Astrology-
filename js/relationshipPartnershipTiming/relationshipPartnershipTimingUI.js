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
  let loveRelFocus = 'Full Timeline';
  let showExplain = false;
  let showDistinctionNote = true;
  let showAttractionTrace = false;

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

  function renderExplainTab() {
    const body = `<ul style="font-size:0.9em;line-height:1.5;">
        <li><strong>What this tab analyzes / does not establish:</strong> It describes astrological evidence in the natal chart, D9, Dasha, and transit for relationship/partnership-related themes (premarital connection, during-marriage relationship quality, and broad attraction/boundary temperament themes). It does not establish, verify, or predict real-world events, a specific partner's identity, or anyone's actual conduct — including infidelity, which a chart can never confirm or deny.</li>
        <li><strong>How to read the three stages:</strong> "Premarital" covers connection/partnership-start themes (reusing the existing natal-promise and candidate-window calculation). "During Marriage" covers the ongoing quality of the 7th-house/Venus/Jupiter partnership significators over time. "Attraction & Boundaries" covers broad temperament factors read qualitatively, each shown as Present/Absent/Ambiguous — never as a verdict.</li>
        <li><strong>Plain-language meaning of factors:</strong> Each factor (e.g., "Venus–Rahu association") is a classical astrological signature with a specific, limited meaning explained in its own rule panel below — it is not a label for a person.</li>
        <li><strong>Why timing = reflection windows, not guarantees:</strong> Dasha/transit windows show when a theme is astrologically emphasized. They are prompts for reflection, not predictions that something specific will occur during that window.</li>
        <li><strong>Why a chart can't prove an affair or reveal someone else's private conduct:</strong> A birth chart reflects the native's own astrological evidence only. It cannot observe real-world behavior, and it cannot be used to analyze a partner's chart unless that partner's own separately-supplied chart is explicitly selected and clearly labelled as theirs.</li>
      </ul>`;
    return `<p><button id="relpart-explain-btn" type="button" class="tab-button" style="margin-bottom:6px;">${showExplain ? 'Hide' : 'What does this tab do?'}</button></p>
      ${showExplain ? `<div class="output-box pastel-lavender">${body}</div>` : ''}`;
  }

  function renderOverview(lr) {
    const ov = lr.overview;
    return `<h3 id="relpart-sec-overview">A. Relationship Overview</h3><div class="output-box pastel-lavender">
      <ul>${ov.summary.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      <p style="font-size:0.85em;color:#777;">"Evidence" labels throughout this tab describe the strength/consistency of astrological indicators found in this chart only — they are never a probability or likelihood of any real-world outcome, including infidelity.</p>
    </div>`;
  }

  function renderFocusSelector() {
    const options = ['Premarital', 'During Marriage', 'Attraction & Boundaries', 'Full Timeline'];
    return `<p><label>Focus: <select id="relpart-focus-select">${options.map(o => `<option value="${esc(o)}" ${o === loveRelFocus ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label></p>`;
  }

  function renderDuringMarriage(lr) {
    const dm = lr.duringMarriage;
    if (!dm || !dm.available) return '<p style="font-size:0.9em;color:#555;">During-marriage analysis unavailable (generate a chart first).</p>';
    const rows = dm.factors.map(f => `<tr><td>${esc(f.label)}</td><td class="${qualityClass(f.present ? 'Supported' : 'Mixed')}">${f.present ? 'Present' : 'Absent'}</td><td>${esc(f.evidence)}</td></tr>`).join('');
    return `<h3 id="relpart-sec-duringmarriage">C. During Marriage — Relationship Quality Themes</h3><div class="output-box pastel-peach">
      <p><strong>${badge(dm.qualityLabel)}</strong></p>
      <table class="rem-table"><thead><tr><th>Factor</th><th>Status</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table>
      <ul style="font-size:0.85em;color:#555;">${dm.contextualNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
      <ul style="font-size:0.85em;color:#777;">${dm.caveats.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>`;
  }

  function renderAttractionBoundaries(lr) {
    const ab = lr.attractionBoundaries;
    if (!ab || !ab.available) return '<p style="font-size:0.9em;color:#555;">Attraction &amp; Boundaries analysis unavailable (generate a chart first).</p>';
    const rows = ab.factors.map(f => `<tr><td>${esc(f.label)}</td><td class="${qualityClass(f.present === 'Present' ? 'Mixed' : '')}">${esc(f.present)}</td><td>${esc(f.evidence)}</td><td>${evidenceDetails('Alternative reading / rule', [f.alternativeReading])}</td></tr>`).join('');
    const distinctionToggleLabel = showDistinctionNote ? 'Hide' : 'Show';
    const traceToggleLabel = showAttractionTrace ? 'Hide calculation sequence' : 'Show calculation sequence';
    const traceSteps = ab.factors.map((f, i) =>
      `Step ${i + 1} — ${esc(f.label)} [${f.rule && f.rule.id ? esc(f.rule.id) : 'no rule id'}]: raw chart check &rarr; <strong>${esc(f.present)}</strong><br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;Raw evidence: ${esc(f.evidence)}`
    ).join('<br><br>');
    const traceBlock = `<br><br>Step ${ab.factors.length + 1} — Tally: ${ab.corroboratingCount} of ${ab.factors.length} factors Present` +
      `<br>&darr;<br>Step ${ab.factors.length + 2} — Threshold rule applied (hard-coded, not adjustable by factor content): 0 present &rarr; Limited Evidence · 1 present &rarr; Requires Careful Interpretation · 2 present &rarr; Mixed · 3+ present &rarr; Supported · "Strongly Supported" is never reachable in this section` +
      `<br>&darr;<br>Step ${ab.factors.length + 3} — Result: <strong>${esc(ab.evidenceLabel)}</strong>`;
    return `<h3 id="relpart-sec-attraction">D. Attraction, Boundaries &amp; Relationship Complexity</h3>
      <div class="output-box pastel-yellow" style="border:1px solid #e0b800;">
        <p><strong>This is not an affair detector.</strong>
          <button id="relpart-distinction-toggle" type="button" class="tab-button" style="margin-left:8px;font-size:0.8em;padding:2px 8px;">${distinctionToggleLabel}</button>
        </p>
        ${showDistinctionNote ? `<p>${esc(ab.distinctionNote)}</p>` : ''}
      </div>
      <div class="output-box pastel-blue">
        <p><strong>Evidence level:</strong> ${badge(ab.evidenceLabel)} &nbsp; <span style="font-size:0.85em;color:#777;">(${ab.corroboratingCount} of ${ab.factors.length} factors present — a single present factor never produces a strong evidence level)</span>
          <button id="relpart-attraction-trace-toggle" type="button" class="tab-button" style="margin-left:8px;font-size:0.8em;padding:2px 8px;">${traceToggleLabel}</button>
        </p>
        ${showAttractionTrace ? `<details class="avp-calc" open><summary>CALCULATION SEQUENCE — how this result was derived</summary><p style="font-family:monospace;line-height:1.8;font-size:0.85em;">${traceSteps}${traceBlock}</p></details>` : ''}
        <table class="rem-table"><thead><tr><th>Factor</th><th>Status</th><th>Evidence</th><th>Explanation</th></tr></thead><tbody>${rows}</tbody></table>
        <p style="font-size:0.85em;color:#a33;"><strong>${esc(ab.neverVerdict)}</strong></p>
      </div>`;
  }

  function renderCombinedTimeline(lr) {
    const t = lr.timeline;
    if (!t || !t.available || !t.entries.length) return `<h3 id="relpart-sec-timeline">E. Relationship Timeline</h3><p style="font-size:0.9em;color:#555;">No timeline entries available for the current focus/horizon (real Dasha-based windows only — no dates are fabricated).</p>`;
    const rows = t.entries.map(e => `<tr class="${qualityClass(e.label)}"><td>${esc(e.section)}</td><td>${fmtDate(e.startDate)} &rarr; ${fmtDate(e.endDate)}</td><td>${badge(e.label)}</td></tr>`).join('');
    return `<h3 id="relpart-sec-timeline">E. Relationship Timeline (Focus: ${esc(lr.focus)})</h3>
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Section</th><th>Period</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p style="font-size:0.85em;color:#777;">All dates come directly from this chart's computed Vimshottari Dasha periods. None are fabricated or estimated.</p>`;
  }

  function renderDataCompleteness(lr) {
    const dc = lr.dataCompleteness;
    if (!dc) return '';
    return `<div class="output-box pastel-yellow" style="border:1px solid #e0b800;"><p style="font-size:0.85em;"><strong>Data completeness:</strong> ${esc(dc.note)}</p></div>`;
  }

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
    const focusSelect = root.querySelector('#relpart-focus-select'); if (focusSelect) focusSelect.addEventListener('change', () => { loveRelFocus = focusSelect.value; UI.render(); });
    const explainBtn = root.querySelector('#relpart-explain-btn'); if (explainBtn) explainBtn.addEventListener('click', () => { showExplain = !showExplain; UI.render(); });
    const distinctionBtn = root.querySelector('#relpart-distinction-toggle'); if (distinctionBtn) distinctionBtn.addEventListener('click', () => { showDistinctionNote = !showDistinctionNote; UI.render(); });
    const attractionTraceBtn = root.querySelector('#relpart-attraction-trace-toggle'); if (attractionTraceBtn) attractionTraceBtn.addEventListener('click', () => { showAttractionTrace = !showAttractionTrace; UI.render(); });
  }

  UI.render = function () {
    const root = document.getElementById('relpart-root');
    if (!root) return;
    const result = window.RelationshipPartnershipTiming.refresh(horizonYears, minStrength);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Relationship / Partnership Start Timing analysis.</p>'; return; }
    const lr = window.RelationshipPartnershipTiming.refreshLoveRelationshipTimeline(horizonYears, loveRelFocus);
    const showPremarital = loveRelFocus === 'Premarital' || loveRelFocus === 'Full Timeline';
    const showDuringMarriage = loveRelFocus === 'During Marriage' || loveRelFocus === 'Full Timeline';
    const showAttraction = loveRelFocus === 'Attraction & Boundaries' || loveRelFocus === 'Full Timeline';
    root.innerHTML = [
      renderExplainTab(),
      renderScopeNote(),
      lr ? renderDataCompleteness(lr) : '',
      '<p>Parashari/Vimshottari love &amp; relationship analysis: premarital connection timing, during-marriage relationship quality, and attraction/boundaries/complexity temperament factors, plus a combined timeline below. Traces: <strong>Natal Promise &rarr; D9 Confirmation &rarr; Dasha &rarr; Transit &rarr; Candidate Window &rarr; Personal/Professional Context &rarr; Cross-Module Checks</strong>.</p>',
      lr ? renderOverview(lr) : '',
      renderFocusSelector(),
      showPremarital ? (renderPromise(result) + renderD9(result) + renderCurrentDasha(result) + renderWindows(result)) : '',
      showDuringMarriage && lr ? renderDuringMarriage(lr) : '',
      showAttraction && lr ? renderAttractionBoundaries(lr) : '',
      lr ? renderCombinedTimeline(lr) : '',
      renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.RelationshipPartnershipTiming) window.RelationshipPartnershipTiming.init(); };
  UI.init();
  return UI;
})();
