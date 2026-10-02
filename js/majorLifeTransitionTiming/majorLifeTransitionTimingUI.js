/* =========================================================
   MAJOR LIFE TRANSITION / PHASE CHANGE TIMING — rendering layer only.
   Consumes window.MajorLifeTransitionTiming (engine) and renders into
   #majorlifetransition-root. Namespaced as window.MajorLifeTransitionTimingUI.
   Transition Focus / Transition Type filters only re-call
   window.MajorLifeTransitionTiming.refresh(...), which itself only
   recomputes when the horizon actually changed (cache-by-ref) — changing
   focus/type never triggers the chart engine or any new astrology
   calculation.
   ========================================================= */

window.MajorLifeTransitionTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let focusFilter = 'All';
  let typeFilter = 'All';
  let expandedId = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.indexOf('strong') === 0 || l === 'strong') return 'quality-good';
    if (l.indexOf('moderate') === 0) return 'quality-neutral';
    return 'quality-bad';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return items && items.length ? `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>` : ''; }

  function renderControls() {
    const horizonOptions = (window.MAJORLIFETRANSITION_HORIZONS || [1, 2, 3, 5, 10]).map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} Year${y > 1 ? 's' : ''}</option>`).join('');
    const focusOptions = (window.MAJORLIFETRANSITION_FOCUS_OPTIONS || ['All']).map(f => `<option value="${esc(f)}" ${f === focusFilter ? 'selected' : ''}>${esc(f)}</option>`).join('');
    const typeOptions = (window.MAJORLIFETRANSITION_TYPE_OPTIONS || ['All']).map(t => `<option value="${esc(t)}" ${t === typeFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    return `<h3 id="mlt-sec-controls">Controls</h3><div class="output-box pastel-lavender">
      <p>
        <label>Time Horizon: <select id="mlt-horizon-select">${horizonOptions}</select></label> &nbsp;
        <label>Transition Focus: <select id="mlt-focus-select">${focusOptions}</select></label> &nbsp;
        <label>Transition Type: <select id="mlt-type-select">${typeOptions}</select></label>
      </p>
      <p style="font-size:0.85em;color:#777;">Focus and Type filters only change what is displayed from the already-computed result; they never recalculate the horoscope, Life Timeline, or any underlying timing module.</p>
    </div>`;
  }

  function renderNatalFoundation(r) {
    const np = r.natalPattern;
    if (!np) return '';
    const groupRows = np.groupResults.map(g => `<li>${esc(g.label)} (${esc(g.domain)}): ${g.connectedPairs}/${g.totalPairs} connected pair(s)</li>`).join('');
    return `<h3 id="mlt-sec-natal">Independent Natal Transition-Sensitivity Foundation</h3><div class="output-box pastel-blue">
      <p><strong>Overall sensitivity:</strong> ${badge(np.sensitivity)}</p>
      <p>${esc(np.narrative)}</p>
      <details class="avp-calc"><summary>Transition-signature house-pair detail</summary><ul>${groupRows}</ul></details>
    </div>`;
  }

  function renderDashaSynthesis(r) {
    const d = r.dashaSynthesis;
    if (!d) return '';
    return `<h3 id="mlt-sec-dasha">Current Dasha Multi-Domain Synthesis</h3><div class="output-box pastel-mint">
      <p><strong>Active lord(s):</strong> ${esc(d.lords.join(', '))}</p>
      <p><strong>Houses touched:</strong> ${esc(d.houses.join(', '))}</p>
      <p><strong>Domains:</strong> ${esc(d.domains.join(', ') || 'none clearly mapped')}</p>
      <p>${esc(d.narrative)}</p>
    </div>`;
  }

  function renderHorizonWindows(r) {
    const rows = r.horizonWindows.map(h => `<li><strong>${h.years}-Year horizon</strong> (through ${fmtMonthYear(h.endDate)}): ${h.candidateCount} candidate transition period(s), ${h.majorCount} classified as multi-domain convergence.</li>`).join('');
    return `<h3 id="mlt-sec-horizons">Candidate Windows by Horizon</h3><div class="output-box pastel-yellow"><ul>${rows}</ul></div>`;
  }

  function renderTransitionCard(t) {
    const expanded = expandedId === t.id;
    return `<div class="output-box pastel-peach" style="margin-bottom:8px;">
      <p data-mlt-transition="${esc(t.id)}" style="cursor:pointer;"><strong>${fmtMonthYear(t.startDate)} &ndash; ${fmtMonthYear(t.endDate)}</strong> &nbsp; ${badge(t.strength)}</p>
      <p><strong>Taxonomy:</strong> ${esc(t.taxonomyLabel)} &nbsp; <strong>Type:</strong> ${esc(t.transitionType)}</p>
      <p><strong>Domains:</strong> ${t.domains.map(esc).join(', ')} &nbsp; <span style="font-size:0.85em;color:#777;">(${esc(t.domainIndependence.label)})</span></p>
      <p><strong>Contributing modules:</strong> ${Array.from(new Set(t.windows.map(w => w.moduleName))).join(', ')}</p>
      ${expanded ? renderTransitionDetail(t) : '<p style="font-size:0.85em;color:#555;">Click to expand full detail and calculation trace.</p>'}
    </div>`;
  }
  function renderTransitionDetail(t) {
    const e = t.dedupedEvidence;
    return `<div style="border-top:1px dashed #999;margin-top:6px;padding-top:6px;">
      <p><strong>Interpretation:</strong> ${esc(t.interpretation)}</p>
      <p><strong>Domain independence:</strong> ${esc(t.domainIndependence.label)} &mdash; ${esc(t.domainIndependence.explanation)}</p>
      ${evidenceDetails('Deduplicated reasons (why this period appears)', e.reasons)}
      ${evidenceDetails('Deduplicated cautions (from source modules, shown verbatim)', e.cautions)}
      ${evidenceDetails('Dasha context per contributing window', e.dashaExplanations)}
      ${evidenceDetails('House logic per contributing module', e.houseLogic)}
      <details class="avp-calc"><summary>TRANSITION CALCULATION TRACE</summary><p style="font-family:monospace;line-height:1.8;">
        ${t.cluster && t.cluster.windows ? 'Step 1-2 — Independent natal foundation + Dasha synthesis considered alongside (not overriding) this window<br>&darr;<br>' : ''}
        Step 3 — window.LifeTimeline\'s already-normalized, already-deduplicated event cluster read: ${esc(t.windows.map(w => w.moduleName).join(', '))}<br>&darr;<br>
        Step 4 — Domain independence calculated: ${esc(t.domainIndependence.label)}<br>&darr;<br>
        Step 5 — Transition taxonomy assigned: ${esc(t.taxonomyLabel)}<br>&darr;<br>
        Step 6 — Hard gate applied: single-domain results can never be labeled a major life transition<br>&darr;<br>
        Step 7 — Transition strength: ${esc(t.strength)} (Major transition: ${t.isMajorTransition ? 'Yes' : 'No'})<br>&darr;<br>
        Step 8 — Evidence deduplicated across ${t.windows.length} contributing window(s)<br>&darr;<br>
        Step 9 — Placed in chronological transition sequence<br>&darr;<br>
        Step 10 — Candidate-window horizon placement
      </p></details>
    </div>`;
  }

  function renderSequence(r) {
    if (!r.sequence.length) return `<h3 id="mlt-sec-sequence">Transition Sequence</h3><p style="font-size:0.9em;color:#555;">No candidate transition periods match the current filters.</p>`;
    const rows = r.sequence.map(t => `<div style="margin-bottom:10px;">
      <p><strong>${fmtMonthYear(t.startDate)} &ndash; ${fmtMonthYear(t.endDate)}</strong> &mdash; ${esc(t.taxonomyLabel)} ${badge(t.strength)}</p>
      <p style="font-size:0.85em;color:#555;">${esc(t.sequenceNote)}</p>
    </div>`).join('<p style="text-align:center;">↓</p>');
    return `<h3 id="mlt-sec-sequence">Transition Sequence</h3><div class="output-box pastel-lavender">
      <p style="font-size:0.85em;color:#777;">The periods below form a chronological sequence drawn from the timing sequence of existing module activations. This never implies that an earlier period causes a later one.</p>
      ${rows}
    </div>`;
  }

  function renderTransitions(r) {
    if (!r.transitions.length) return `<h3 id="mlt-sec-transitions">Transition Periods</h3><p style="font-size:0.9em;color:#555;">No candidate transition periods match the current filters.</p>`;
    return `<h3 id="mlt-sec-transitions">Transition Periods</h3>${r.transitions.map(renderTransitionCard).join('')}`;
  }

  function renderSkipped(r) {
    if (!r.skipped || !r.skipped.length) return '';
    return `<h3 id="mlt-sec-skipped">Modules Not Integrated</h3><div class="output-box pastel-yellow">
      <p style="font-size:0.85em;color:#777;">These were not included for this chart/build (optional; this module never fails for a missing module):</p>
      <ul style="font-size:0.85em;">${r.skipped.map(s => `<li>${esc(s.label)} &mdash; ${esc(s.reason)}</li>`).join('')}</ul>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} &mdash; ${esc(rule.name)} (${esc(rule.category)})</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="mlt-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">
      <p style="font-size:0.85em;color:#777;">Each contributing window also retains its own source module's own rule provenance (visible via Life Timeline). The rules below are this synthesis layer's own foundation/taxonomy/gating rules only.</p>
      ${items}
    </div>`;
  }

  function renderLog(r) {
    return `<h3 id="mlt-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }
  function renderDisclaimer(r) {
    return `<div class="output-box pastel-yellow"><p style="font-size:0.85em;"><strong>Disclaimer:</strong> ${esc(r.disclaimer)}</p></div>`;
  }

  function attachInteractions(root) {
    const horizonSelect = root.querySelector('#mlt-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); expandedId = null; UI.render(); });
    const focusSelect = root.querySelector('#mlt-focus-select');
    if (focusSelect) focusSelect.addEventListener('change', () => { focusFilter = focusSelect.value; UI.render(); });
    const typeSelect = root.querySelector('#mlt-type-select');
    if (typeSelect) typeSelect.addEventListener('change', () => { typeFilter = typeSelect.value; UI.render(); });
    root.querySelectorAll('[data-mlt-transition]').forEach(el => el.addEventListener('click', () => {
      const id = el.getAttribute('data-mlt-transition');
      expandedId = expandedId === id ? null : id;
      UI.render();
    }));
  }

  UI.render = function () {
    const root = document.getElementById('majorlifetransition-root');
    if (!root) return;
    const result = window.MajorLifeTransitionTiming.refresh(horizonYears, focusFilter, typeFilter);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see Major Life Transition / Phase Change Timing.</p>'; return; }
    root.innerHTML = [
      '<p>Answers whether several life domains converge strongly enough around the same period to represent a broader life-phase transition. This is not a general chronological timeline (see Life Timeline) and not a replacement for any single-domain timing module. Trace: <strong>Independent Natal Foundation &rarr; Dasha Synthesis &rarr; Life Timeline Reuse &rarr; Domain Independence &rarr; Transition Taxonomy &rarr; Strength Gate &rarr; Evidence Dedup &rarr; Sequence &rarr; Horizon Placement</strong>.</p>',
      renderControls(),
      renderNatalFoundation(result),
      renderDashaSynthesis(result),
      renderHorizonWindows(result),
      renderSequence(result),
      renderTransitions(result),
      renderSkipped(result),
      renderDisclaimer(result),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.MajorLifeTransitionTiming) window.MajorLifeTransitionTiming.init(); };
  UI.init();
  return UI;
})();
