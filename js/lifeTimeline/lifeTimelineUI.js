/* =========================================================
   IMPORTANT EVENT SEQUENCE / LIFE TIMELINE — rendering layer only.
   Consumes window.LifeTimeline (engine) and renders into
   #lifetimeline-root. Namespaced as window.LifeTimelineUI.
   Filters (horizon/domain/evidence/display-mode) only re-call
   window.LifeTimeline.refresh(...), which itself only recomputes
   module output when the horizon or custom range actually changed
   (cache-by-ref) — changing domain/evidence/display never triggers the
   chart engine or any new astrology calculation.
   ========================================================= */

window.LifeTimelineUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let customStart = null, customEnd = null, useCustomRange = false;
  let domainFilter = 'All';
  let evidenceFilter = 'All';
  let displayMode = 'Both';
  let expandedClusterId = null;
  let expandedPhaseId = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function fmtYear(d) { return d ? d.getUTCFullYear() : '?'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l === 'strong' || l === 'primary event') return 'quality-good';
    if (l === 'moderate' || l === 'secondary event') return 'quality-neutral';
    if (l === 'contextual' || l === 'contextual event' || l === 'correlated event') return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return items && items.length ? `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>` : ''; }

  const DOMAIN_COLOR = {
    'Career': '#cfe8ff', 'Finance': '#d8f5e3', 'Property/Residence': '#ffe7c2', 'Relationship/Family': '#f3d9f7',
    'Education': '#fff6c2', 'Health': '#ffd6d6', 'Legal/Structural': '#e3dcf7', 'Spiritual/Personal': '#d6f0f0'
  };
  function domainColor(domain) { return DOMAIN_COLOR[domain] || '#e6e6e6'; }

  // --- Controls (section 28) ---
  function renderControls(r) {
    const horizonOptions = [1, 3, 5, 10].map(y => `<option value="${y}" ${!useCustomRange && y === horizonYears ? 'selected' : ''}>${y} Year${y > 1 ? 's' : ''}</option>`).join('')
      + `<option value="custom" ${useCustomRange ? 'selected' : ''}>Custom Range</option>`;
    const domainOptions = (window.LIFETIMELINE_DOMAINS || ['All']).map(d => `<option value="${esc(d)}" ${d === domainFilter ? 'selected' : ''}>${esc(d)}</option>`).join('');
    const evidenceOptions = ['All', 'Contextual', 'Moderate', 'Strong'].map(s => `<option value="${esc(s)}" ${s === evidenceFilter ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const displayOptions = ['Events', 'Clusters', 'Both'].map(s => `<option value="${esc(s)}" ${s === displayMode ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const customInputs = useCustomRange ? `
      <label>From: <input type="date" id="lifetimeline-custom-start" value="${customStart ? customStart.toISOString().slice(0, 10) : ''}"></label>
      <label>To: <input type="date" id="lifetimeline-custom-end" value="${customEnd ? customEnd.toISOString().slice(0, 10) : ''}"></label>` : '';
    return `<h3 id="lifetimeline-sec-controls">Timeline Controls</h3><div class="output-box pastel-lavender">
      <p>
        <label>Time Horizon: <select id="lifetimeline-horizon-select">${horizonOptions}</select></label> &nbsp;
        <label>Domain: <select id="lifetimeline-domain-select">${domainOptions}</select></label> &nbsp;
        <label>Minimum Evidence: <select id="lifetimeline-evidence-select">${evidenceOptions}</select></label> &nbsp;
        <label>Display: <select id="lifetimeline-display-select">${displayOptions}</select></label>
      </p>
      <p>${customInputs}</p>
      <p style="font-size:0.85em;color:#777;">Filters only change what is displayed from the already-computed timeline; they never recalculate the horoscope or any underlying module.</p>
    </div>`;
  }

  // --- Current Life Phase (section 16) ---
  function renderCurrentPhase(r) {
    return `<h3 id="lifetimeline-sec-current">Current Life Phase</h3><div class="output-box pastel-blue">
      <p>${esc(r.currentPhase.narrative)}</p>
    </div>`;
  }

  // --- Next Significant Cluster (section 17) ---
  function renderNextCluster(r) {
    if (!r.nextCluster) return `<h3 id="lifetimeline-sec-next">Next Significant Timing Cluster</h3><p style="font-size:0.9em;color:#555;">No sufficiently supported upcoming cluster was found in the selected horizon.</p>`;
    const n = r.nextCluster;
    return `<h3 id="lifetimeline-sec-next">Next Significant Timing Cluster</h3><div class="output-box pastel-mint">
      <p><strong>${fmtMonthYear(n.startDate)} &ndash; ${fmtMonthYear(n.endDate)}</strong></p>
      <p><strong>Domains:</strong> ${n.domains.map(esc).join(', ')}</p>
      <p><strong>Label:</strong> ${esc(n.label)}</p>
      <p><strong>Contributing modules:</strong> ${Array.from(new Set(n.moduleIds)).join(', ')}</p>
      <p style="font-size:0.85em;color:#777;">${esc(n.note)}</p>
    </div>`;
  }

  // --- Horizontal timeline visualization (section 18) ---
  function renderVisualization(r) {
    const items = r.displayMode === 'Events'
      ? [].concat(...r.eventClusters.map(c => c.windows))
      : r.phaseClusters.length ? r.phaseClusters : r.eventClusters;
    if (!items.length) return `<h3 id="lifetimeline-sec-viz">Timeline Visualization</h3><p style="font-size:0.9em;color:#555;">No timing windows to display for the current filters.</p>`;
    const minDate = items.reduce((m, i) => (i.startDate < m ? i.startDate : m), items[0].startDate);
    const maxDate = items.reduce((m, i) => (i.endDate > m ? i.endDate : m), items[0].endDate);
    const totalMs = Math.max(1, maxDate.getTime() - minDate.getTime());
    const rows = items.map((it, i) => {
      const leftPct = ((it.startDate.getTime() - minDate.getTime()) / totalMs) * 100;
      const widthPct = Math.max(2, ((it.endDate.getTime() - it.startDate.getTime()) / totalMs) * 100);
      const label = it.label || it.moduleName || it.eventType;
      const domain = it.domain || (it.domains && it.domains[0]) || 'General';
      return `<div class="lifetimeline-row" style="position:relative;height:28px;margin-bottom:4px;">
        <div style="position:absolute;left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%;min-width:40px;height:22px;background:${domainColor(domain)};border:1px solid #888;border-radius:4px;font-size:0.72em;line-height:22px;overflow:hidden;white-space:nowrap;padding:0 4px;" title="${esc(label)} (${fmtDate(it.startDate)} → ${fmtDate(it.endDate)})">${esc(label)}</div>
      </div>`;
    }).join('');
    return `<h3 id="lifetimeline-sec-viz">Timeline Visualization</h3><div class="output-box pastel-yellow">
      <p style="font-size:0.85em;color:#777;">${fmtYear(minDate)} &ndash; ${fmtYear(maxDate)} (bar width is proportional to each window's own duration; the layout below reflows to a vertical stack automatically on narrow/mobile screens via normal block layout).</p>
      <div class="lifetimeline-viz" style="overflow-x:auto;">${rows}</div>
    </div>`;
  }

  // --- Timeline cards (sections 19, 29) ---
  function renderDashaContext(w) {
    return `<strong>MD:</strong> ${esc(w.dasha.mahadasha || '—')} &nbsp; <strong>AD:</strong> ${esc(w.dasha.antardasha || '—')} &nbsp; <strong>PD:</strong> ${esc(w.dasha.pratyantar || '—')}`;
  }
  function renderEventCard(w, tierOverride) {
    return `<div class="output-box pastel-blue" style="margin-bottom:8px;">
      <p><strong>${esc(w.eventType)}</strong> ${badge(tierOverride || w.evidenceLevel)} &nbsp; <span style="font-size:0.85em;color:#555;">${esc(w.domain)}</span></p>
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</p>
      <p><strong>Stage:</strong> ${esc(w.eventStage)}</p>
      <p>${renderDashaContext(w)}</p>
      <p><strong>Evidence:</strong> ${badge(w.evidenceLevel)} &nbsp; <strong>Transit support:</strong> ${w.transitSupport ? 'Yes' : 'No'}</p>
      ${w.houses.length ? `<p><strong>Key houses:</strong> ${w.houses.join(', ')}</p>` : ''}
      ${w.divisionalSupport.length ? `<p><strong>Divisional support:</strong> ${w.divisionalSupport.map(d => `${esc(d.varga)}: ${esc(d.level)}`).join('; ')}</p>` : ''}
      <p><strong>Contributing module:</strong> ${esc(w.moduleName)} <span style="font-size:0.8em;color:#777;">(trace: ${esc(w.traceId)})</span></p>
      ${evidenceDetails('Why it appears', w.reasons)}
      ${w.cautions.length ? `<p><strong>Caution (from source module, shown verbatim):</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${w.disclaimer ? `<p style="font-size:0.8em;color:#777;"><strong>Source-module disclaimer:</strong> ${esc(w.disclaimer)}</p>` : ''}
    </div>`;
  }

  // --- Event Cluster Card (section 20) ---
  function renderClusterCard(c, idx) {
    const expanded = expandedClusterId === c.id;
    const seqItem = null;
    return `<div class="output-box pastel-mint" style="margin-bottom:8px;">
      <p data-lifetimeline-cluster="${esc(c.id)}" style="cursor:pointer;"><strong>${esc(c.label)}</strong> ${badge(c.tier)} ${c.isCluster ? `<span style="font-size:0.8em;color:#777;">(${c.windows.length} contributing modules)</span>` : ''}</p>
      <p><strong>Period:</strong> ${fmtDate(c.startDate)} &rarr; ${fmtDate(c.endDate)}</p>
      <p><strong>Domains:</strong> ${c.domains.join(', ')} ${c.domainDiversity > 1 ? '<span style="font-size:0.8em;color:#2a7;">(multi-domain convergence)</span>' : ''}</p>
      <p><strong>Contributing modules:</strong> ${c.windows.map(w => esc(w.moduleName)).join(', ')}</p>
      ${expanded ? renderClusterDetail(c) : '<p style="font-size:0.85em;color:#555;">Click to expand full detail.</p>'}
    </div>`;
  }
  function renderClusterDetail(c) {
    const sharedDasha = c.windows[0] ? renderDashaContext(c.windows[0]) : '';
    const interpretation = c.isCluster
      ? `The timing windows for ${c.windows.map(w => w.moduleName).join(', ')} overlap or sit in close sequence in this period and are shown here as one ${c.domainDiversity > 1 ? 'multi-domain' : 'single-domain'} cluster rather than ${c.windows.length} independent major events.`
      : `This is a single-module timing window; no correlated window from another module was found overlapping it in the selected horizon.`;
    return `<div style="border-top:1px dashed #999;margin-top:6px;padding-top:6px;">
      <p><strong>Underlying timing (shared, shown once for the cluster):</strong> ${sharedDasha}</p>
      <p><strong>Interpretation:</strong> ${esc(interpretation)}</p>
      <h4>Contributing Events</h4>
      ${c.windows.map(w => renderEventCard(w)).join('')}
      <details class="avp-calc"><summary>CLUSTER CALCULATION TRACE</summary><p style="font-family:monospace;line-height:1.8;">
        Step 1 — Source modules: ${c.windows.map(w => w.moduleName).join(', ')}<br>&darr;<br>
        Step 2 — Candidate windows read from each module's own .refresh() output<br>&darr;<br>
        Step 3 — Normalized to common TimingWindow shape<br>&darr;<br>
        Step 4 — Deduplicated via correlation-group + overlap/close-sequence grouping (groupCorrelatedEvents)<br>&darr;<br>
        Step 5 — Domain classification: ${c.domains.join(', ')}<br>&darr;<br>
        Step 6 — Overlap/sequence calculated against neighboring clusters<br>&darr;<br>
        Step 7 — Independent domain count: ${c.domainDiversity}<br>&darr;<br>
        Step 8 — Dasha/transit/divisional context carried through from source windows<br>&darr;<br>
        Step 9 — Life-phase classification considered<br>&darr;<br>
        Step 10 — Importance tier assigned: ${c.tier}
      </p></details>
    </div>`;
  }

  // --- Life-Phase cluster card ---
  function renderPhaseCard(p) {
    const expanded = expandedPhaseId === p.id;
    return `<div class="output-box pastel-peach" style="margin-bottom:8px;">
      <p data-lifetimeline-phase="${esc(p.id)}" style="cursor:pointer;"><strong>${esc(p.label)}</strong> ${p.isMultiCluster ? `<span style="font-size:0.8em;color:#777;">(${p.eventClusters.length} event clusters)</span>` : ''}</p>
      <p><strong>Period:</strong> ${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</p>
      <p><strong>Domains:</strong> ${p.domains.join(', ')}</p>
      ${expanded ? renderPhaseDetail(p) : '<p style="font-size:0.85em;color:#555;">Click to expand full detail.</p>'}
    </div>`;
  }
  function renderPhaseDetail(p) {
    return `<div style="border-top:1px dashed #999;margin-top:6px;padding-top:6px;">
      <p><strong>Sequence:</strong></p>
      <ol>${p.eventClusters.map(ec => `<li>${esc(ec.label)} (${fmtMonthYear(ec.startDate)} – ${fmtMonthYear(ec.endDate)})</li>`).join('')}</ol>
      <p><strong>Interpretation:</strong> ${esc(p.interpretation)}</p>
      ${p.eventClusters.map(ec => renderClusterCard(ec)).join('')}
    </div>`;
  }

  // --- Chronological Sequence section (section 12) ---
  function renderSequence(r) {
    if (!r.sequence.length) return '';
    const rows = r.sequence.map(c => `<div style="margin-bottom:10px;">
      <p><strong>${fmtMonthYear(c.startDate)}${c.startDate.getTime() !== c.endDate.getTime() ? ' – ' + fmtMonthYear(c.endDate) : ''}</strong> &mdash; ${esc(c.label)} ${badge(c.tier)}</p>
      ${c.sequenceType ? `<p style="font-size:0.85em;color:#555;">${esc(c.sequenceType)} sequence: ${esc(c.sequenceNote)}</p>` : ''}
    </div>`).join('<p style="text-align:center;">↓</p>');
    return `<h3 id="lifetimeline-sec-sequence">Chronological Sequence</h3><div class="output-box pastel-lavender">
      <p style="font-size:0.85em;color:#777;">The timing windows below form a chronological sequence. This never implies that an earlier event causes a later one.</p>
      ${rows}
    </div>`;
  }

  function renderEventsOrClusters(r) {
    const mode = r.displayMode || 'Both';
    let html = '';
    if (mode === 'Events' || mode === 'Both') {
      html += `<h3 id="lifetimeline-sec-events">Timeline Events</h3>`;
      if (!r.eventClusters.length) html += '<p style="font-size:0.9em;color:#555;">No timing windows match the current filters.</p>';
      else html += r.eventClusters.map((c, i) => renderClusterCard(c, i)).join('');
    }
    if (mode === 'Clusters' || mode === 'Both') {
      html += `<h3 id="lifetimeline-sec-phases">Life-Phase Clusters</h3>`;
      if (!r.phaseClusters.length) html += '<p style="font-size:0.9em;color:#555;">No multi-event life-phase clusters identified for the current filters.</p>';
      else html += r.phaseClusters.map(p => renderPhaseCard(p)).join('');
    }
    return html;
  }

  function renderSkipped(r) {
    if (!r.skipped.length) return '';
    return `<h3 id="lifetimeline-sec-skipped">Modules Not Integrated</h3><div class="output-box pastel-yellow">
      <p style="font-size:0.85em;color:#777;">These registered modules were not included for this chart (optional; the timeline never fails for a missing module):</p>
      <ul style="font-size:0.85em;">${r.skipped.map(s => `<li>${esc(s.label)} &mdash; ${esc(s.reason)}</li>`).join('')}</ul>
    </div>`;
  }

  function renderIntegrated(r) {
    return `<h3 id="lifetimeline-sec-integrated">Integrated Timing Modules</h3><div class="output-box pastel-mint">
      <p style="font-size:0.85em;">${r.integratedModules.length} module(s) integrated: ${r.integratedModules.join(', ') || '—'}</p>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} &mdash; ${esc(rule.name)} (${rule.provenance === 'application' ? 'application synthesis' : 'classical'})</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="lifetimeline-sec-rules">Rule Provenance (Synthesis-Layer Rules)</h3><div class="output-box pastel-peach">
      <p style="font-size:0.85em;color:#777;">Each contributing event also retains its own source module's rule provenance (see that event card's trace identifier). The rules below are this synthesis layer's own normalization/deduplication/clustering rules only.</p>
      ${items}
    </div>`;
  }

  function renderLog(r) {
    return `<h3 id="lifetimeline-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }
  function renderDisclaimer(r) {
    return `<div class="output-box pastel-yellow"><p style="font-size:0.85em;"><strong>Disclaimer:</strong> ${esc(r.disclaimer)}</p></div>`;
  }

  function attachInteractions(root) {
    const horizonSelect = root.querySelector('#lifetimeline-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => {
      if (horizonSelect.value === 'custom') { useCustomRange = true; }
      else { useCustomRange = false; horizonYears = Number(horizonSelect.value); }
      expandedClusterId = null; expandedPhaseId = null; UI.render();
    });
    const domainSelect = root.querySelector('#lifetimeline-domain-select');
    if (domainSelect) domainSelect.addEventListener('change', () => { domainFilter = domainSelect.value; UI.render(); });
    const evidenceSelect = root.querySelector('#lifetimeline-evidence-select');
    if (evidenceSelect) evidenceSelect.addEventListener('change', () => { evidenceFilter = evidenceSelect.value; UI.render(); });
    const displaySelect = root.querySelector('#lifetimeline-display-select');
    if (displaySelect) displaySelect.addEventListener('change', () => { displayMode = displaySelect.value; UI.render(); });
    const customStartInput = root.querySelector('#lifetimeline-custom-start');
    if (customStartInput) customStartInput.addEventListener('change', () => { customStart = customStartInput.value ? new Date(customStartInput.value + 'T00:00:00Z') : null; UI.render(); });
    const customEndInput = root.querySelector('#lifetimeline-custom-end');
    if (customEndInput) customEndInput.addEventListener('change', () => { customEnd = customEndInput.value ? new Date(customEndInput.value + 'T00:00:00Z') : null; UI.render(); });
    root.querySelectorAll('[data-lifetimeline-cluster]').forEach(el => el.addEventListener('click', () => {
      const id = el.getAttribute('data-lifetimeline-cluster');
      expandedClusterId = expandedClusterId === id ? null : id;
      UI.render();
    }));
    root.querySelectorAll('[data-lifetimeline-phase]').forEach(el => el.addEventListener('click', () => {
      const id = el.getAttribute('data-lifetimeline-phase');
      expandedPhaseId = expandedPhaseId === id ? null : id;
      UI.render();
    }));
  }

  UI.render = function () {
    const root = document.getElementById('lifetimeline-root');
    if (!root) return;
    const customRange = (useCustomRange && customStart && customEnd) ? { start: customStart, end: customEnd } : null;
    const result = window.LifeTimeline.refresh(useCustomRange ? (customRange ? 10 : horizonYears) : horizonYears, domainFilter, evidenceFilter, displayMode, customRange);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Important Event Sequence / Life Timeline.</p>'; return; }
    root.innerHTML = [
      '<p>Master chronological synthesis of this application\'s existing timing modules. This tab does not calculate any new event independently — it consumes each module\'s own candidate windows and aggregates, deduplicates, sequences, and clusters them. Traces: <strong>Module Output &rarr; Normalization &rarr; Deduplication &rarr; Domain Classification &rarr; Overlap/Sequence &rarr; Independent-Domain Analysis &rarr; Life-Phase Clustering &rarr; Timeline Placement</strong>.</p>',
      renderControls(result),
      renderCurrentPhase(result),
      renderNextCluster(result),
      renderVisualization(result),
      renderSequence(result),
      renderEventsOrClusters(result),
      renderIntegrated(result),
      renderSkipped(result),
      renderDisclaimer(result),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.LifeTimeline) window.LifeTimeline.init(); };
  UI.init();
  return UI;
})();
