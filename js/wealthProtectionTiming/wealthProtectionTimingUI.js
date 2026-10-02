/* =========================================================
   WEALTH PROTECTION & ASSET CONSOLIDATION TIMING — rendering layer
   only. Consumes window.WealthProtectionTiming (engine) and renders
   into #wealthprotection-root. Namespaced as
   window.WealthProtectionTimingUI.
   ========================================================= */

window.WealthProtectionTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let objective = 'General Wealth Protection';
  let assetContext = 'General';
  let minEvidence = 'All';
  let selectedWindowIndex = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l === 'strong' || l === 'supports') return 'quality-good';
    if (l === 'moderate' || l === 'mixed' || l === 'supporting') return 'quality-neutral';
    if (l === 'contextual' || l === 'limited' || l === 'challenging') return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h, label) { return h ? `<tr><td>${esc(label)} (${h.house}th, ${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>` : ''; }
    const karakas = [['Jupiter', np.jupiter], ['Venus', np.venus], ['Mercury', np.mercury], ['Saturn', np.saturn], ['Moon', np.moon], ['Sun', np.sun], ['Mars', np.mars]];
    return `<h3 id="wealthprotection-sec-promise">Natal Wealth Protection Pattern</h3>
      <div class="output-box pastel-blue">
        <p><strong>Natal Promise:</strong> ${badge(np.classification)}</p>
        <p>${esc(np.narrative)}</p>
        <table class="rem-table"><thead><tr><th>House</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>
          ${houseRow(np.second, '2nd — Accumulated Wealth')}${houseRow(np.eleventh, '11th — Retention/Realization')}${houseRow(np.eighth, '8th — Restructuring/Shared/Legacy')}${houseRow(np.fourth, '4th — Property/Foundation')}${houseRow(np.ninth, '9th — Legacy/Continuity')}${houseRow(np.twelfth, '12th — Outflow/Leakage')}
        </tbody></table>
        <h4>Natural Significators</h4>
        <table class="rem-table"><thead><tr><th>Planet</th><th>Role</th><th>Classification</th></tr></thead><tbody>
          ${karakas.map(([name, k]) => `<tr><td>${esc(name)} (${esc(k.sign)}, house ${k.house}, ${esc(k.dignity)})</td><td>${esc(k.rule ? k.rule.explanation : '')}</td><td>${badge(k.result)}</td></tr>`).join('')}
        </tbody></table>
        <p style="font-size:0.85em;color:#777;">This indicates whether the horoscope shows meaningful signatures for wealth protection and consolidation — it never predicts a specific amount, investment, or guaranteed outcome. The 8th house here is read only as restructuring/shared-resource/legacy, never as a death or lifespan indicator.</p>
      </div>`;
  }

  function renderRelationships(r) {
    const rows = r.natalPromise.relationships.map(rel => `<tr><td>${esc(rel.key)}</td><td class="${qualityClass(rel.connected ? 'Strong' : 'Limited')}">${badge(rel.connected ? 'Connected' : 'Not Connected')}</td><td>${esc(rel.detail)}</td></tr>`).join('');
    return `<h3 id="wealthprotection-sec-relationships">House Relationships</h3><div class="output-box pastel-lavender">
      <table class="rem-table"><thead><tr><th>Pair</th><th>Status</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-size:0.85em;color:#777;">${r.natalPromise.connectedCount} of ${r.natalPromise.relationships.length} house-relationship pairs show a direct lord connection in this chart.</p>
    </div>`;
  }

  function renderDivisional(r) {
    let html = `<h3 id="wealthprotection-sec-divisional">Divisional &amp; Supporting Evidence</h3><div class="output-box pastel-mint">
      <p><strong>D2 (Hora):</strong> ${badge(r.d2.level)}</p>${evidenceDetails('D2 evidence', r.d2.evidence)}`;
    if (r.shadbala && r.shadbala.available) html += `<p><strong>Shadbala support:</strong> available for Jupiter/Venus/Mercury/Saturn/Moon/Sun.</p>`;
    else html += `<p style="font-size:0.85em;color:#777;">Shadbala data not available for this chart — omitted.</p>`;
    if (r.ashtakavarga && r.ashtakavarga.available) html += `<p><strong>Ashtakavarga support:</strong> considered for 2nd/4th/8th/9th/11th/12th.</p>`;
    else html += `<p style="font-size:0.85em;color:#777;">Ashtakavarga data not available for this chart — omitted.</p>`;
    html += `<p style="font-size:0.85em;color:#777;">Divisional/Shadbala/Ashtakavarga layers confirm D1 — they never replace it, and are reused directly from this app's existing engines, never duplicated.</p></div>`;
    return html;
  }

  function renderContext() {
    const objectives = window.WealthProtectionTiming.OBJECTIVES;
    const assetContexts = window.WealthProtectionTiming.ASSET_CONTEXTS;
    const objOpts = objectives.map(o => `<option value="${esc(o)}" ${o === objective ? 'selected' : ''}>${esc(o)}</option>`).join('');
    const ctxOpts = assetContexts.map(c => `<option value="${esc(c)}" ${c === assetContext ? 'selected' : ''}>${esc(c)}</option>`).join('');
    return `<h3 id="wealthprotection-sec-context">Objective &amp; Asset Context</h3><div class="output-box pastel-lavender">
      <p><label>Objective: <select id="wealthprotection-objective-select">${objOpts}</select></label> &nbsp; <label>Asset Context: <select id="wealthprotection-assetcontext-select">${ctxOpts}</select></label></p>
      <p style="font-size:0.85em;color:#777;">These selectors change interpretation emphasis only — never the underlying horoscope. This module never recommends a specific investment, lender, or tax strategy.</p>
    </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="wealthprotection-sec-dasha">Current Indicators</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p && p.lord ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.relevant ? badge('Supporting') : badge('Neutral')}</td><td>${p.activatedHouses ? p.activatedHouses.join(', ') : '&mdash;'}</td></tr>` : `<tr><td>${label}</td><td colspan="4">&mdash;</td></tr>`; }
    return `<h3 id="wealthprotection-sec-dasha">Current Indicators</h3><div class="output-box pastel-peach">
      <table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Connection</th><th>Activated Houses</th></tr></thead><tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody></table>
    </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const evidenceOptions = ['All', 'Contextual', 'Moderate', 'Strong'].map(s => `<option value="${esc(s)}" ${s === minEvidence ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="wealthprotection-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Evidence: <select id="wealthprotection-evidence-select">${evidenceOptions}</select></label></p>`;
    if (!r.candidateWindows.length) return `<h3 id="wealthprotection-sec-windows">Stronger Consolidation Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence.</p>`;
    const rows = r.candidateWindows.map((w, i) => `<tr data-wealthprotection-window="${i}" style="cursor:pointer;" class="${qualityClass(w.evidence.label)}"><td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td><td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td><td>${w.eventTypes.map(t => esc(t.label)).join(', ')}</td><td>${w.stages.map(esc).join(' → ')}</td><td>${badge(w.evidence.label)}</td></tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `<h3 id="wealthprotection-sec-windows">Stronger Consolidation Windows</h3>${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;"><table class="rem-table"><thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Primary Theme</th><th>Stage</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h4 id="wealthprotection-sec-detail">Detailed Calculation</h4>${detail}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Step 1 — Natal foundation (2nd/11th/8th/4th/9th/12th + supporting) established',
      '&darr;', `Step 2 — House relationships reviewed`,
      '&darr;', `Step 3 — Natural significators reviewed`,
      '&darr;', `Step 4 — MD=${w.mahadasha}, AD=${w.antardasha}, PD=${w.pratyantar}; activated houses: ${w.activatedHouses.join(', ')}`,
      '&darr;', `Step 5 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'} (house ${w.transit.jupiter.house}), Saturn ${w.transit.saturn.active ? 'active' : 'not active'} (house ${w.transit.saturn.house})${w.transit.convergence ? ' — Jupiter+Saturn convergence' : ''}`,
      '&darr;', `Step 6 — D2 confirmation: ${w.d2.level}`,
      '&darr;', `Step 7 — Shadbala: ${w.shadbala ? 'supporting' : 'not available'}; Ashtakavarga: ${w.ashtakavarga ? 'supporting' : 'not available'}`,
      '&darr;', `Step 8 — Convergence factors: ${w.convergenceFactors}`,
      '&darr;', `Step 9 — Event stage(s): ${w.stages.join(', ')}; event type(s): ${w.eventTypes.map(t => t.label).join(', ')}`,
      '&darr;', `Step 10 — Evidence classification: ${w.evidence.label}`
    ].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
      <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
      <p><strong>Primary Theme(s):</strong> ${w.eventTypes.map(t => esc(t.label)).join(', ')}</p>
      <p><strong>Stage:</strong> ${w.stages.map(esc).join(' → ')}</p>
      <p><strong>Evidence:</strong> ${badge(w.evidence.label)}</p>
      <p><strong>Why this period:</strong></p><ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
      <p><strong>Astrological Basis:</strong> Houses activated: ${w.activatedHouses.join(', ')}. D2: ${esc(w.d2.level)}.</p>
      ${w.cautions.length ? `<p><strong>Caution:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p><strong>Jupiter transit:</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
      <p><strong>Saturn transit:</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
      ${w.crossCheck ? `<div class="output-box pastel-yellow"><p><strong>Cross-Checks:</strong> ${esc(w.crossCheck.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>WEALTH PROTECTION TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="wealthprotection-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    return `<h3 id="wealthprotection-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`;
  }

  function renderDisclaimer(r) {
    return `<div class="output-box pastel-yellow"><p style="font-size:0.85em;"><strong>Disclaimer:</strong> ${esc(r.disclaimer)}</p></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#wealthprotection-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });
    const objectiveSelect = root.querySelector('#wealthprotection-objective-select'); if (objectiveSelect) objectiveSelect.addEventListener('change', () => { objective = objectiveSelect.value; selectedWindowIndex = null; UI.render(); });
    const assetContextSelect = root.querySelector('#wealthprotection-assetcontext-select'); if (assetContextSelect) assetContextSelect.addEventListener('change', () => { assetContext = assetContextSelect.value; selectedWindowIndex = null; UI.render(); });
    const evidenceSelect = root.querySelector('#wealthprotection-evidence-select'); if (evidenceSelect) evidenceSelect.addEventListener('change', () => { minEvidence = evidenceSelect.value; selectedWindowIndex = null; UI.render(); });
    root.querySelectorAll('tr[data-wealthprotection-window]').forEach(tr => tr.addEventListener('click', () => { selectedWindowIndex = Number(tr.getAttribute('data-wealthprotection-window')); UI.render(); const el = document.getElementById('wealthprotection-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('wealthprotection-root');
    if (!root) return;
    const result = window.WealthProtectionTiming.refresh(horizonYears, objective, assetContext, minEvidence);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Wealth Protection &amp; Asset Consolidation Timing analysis.</p>'; return; }
    root.innerHTML = [
      '<p>Parashari/Vimshottari wealth-protection and asset-consolidation timing. Traces: <strong>Natal Foundation &rarr; House Relationships &rarr; Natural Significators &rarr; Dasha &rarr; Transit &rarr; D2 &rarr; Shadbala/Ashtakavarga &rarr; Convergence &rarr; Event Stage &rarr; Final Interpretation</strong>. This module never recommends a specific investment, lender, tax strategy, or guarantees financial success, and never infers death or lifespan from the 8th house.</p>',
      renderPromise(result), renderRelationships(result), renderDivisional(result), renderContext(), renderCurrentDasha(result), renderWindows(result), renderDisclaimer(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.WealthProtectionTiming) window.WealthProtectionTiming.init(); };
  UI.init();
  return UI;
})();
