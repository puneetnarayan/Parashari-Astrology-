/* =========================================================
   YOGA ACTIVATION TIMING — rendering layer only. Consumes
   window.YogaActivationTiming (engine) and renders into
   #yogaactivation-root. Namespaced as window.YogaActivationTimingUI.
   ========================================================= */

window.YogaActivationTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let categoryFilter = 'All';
  let activationFilter = 'All';
  let selectedYogaKey = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l === 'strong' || l === 'supports') return 'quality-good';
    if (l === 'moderate' || l === 'mixed') return 'quality-neutral';
    if (l === 'contextual' || l === 'not applicable' || l.indexOf('dormant') === 0) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderContext(result) {
    const cats = window.YogaActivationTiming.CATEGORIES || ['All'];
    const levels = window.YogaActivationTiming.ACTIVATION_LEVELS || ['All'];
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const catOpts = cats.map(c => `<option value="${esc(c)}" ${c === categoryFilter ? 'selected' : ''}>${esc(c)}</option>`).join('');
    const levelOpts = levels.map(l => `<option value="${esc(l)}" ${l === activationFilter ? 'selected' : ''}>${esc(l)}</option>`).join('');
    return `<h3 id="yogaactivation-sec-context">Filters</h3><div class="output-box pastel-lavender">
      <p><label>Category: <select id="yogaactivation-category-select">${catOpts}</select></label> &nbsp;
      <label>Activation Level: <select id="yogaactivation-activation-select">${levelOpts}</select></label> &nbsp;
      <label>Upcoming Horizon: <select id="yogaactivation-horizon-select">${horizonOptions}</select></label></p>
      <p style="font-size:0.85em;color:#777;">Filters only change which already-computed results are shown — they never recalculate the horoscope. This module reads the existing Yogas tab's own detection results; it does not re-derive yoga formation rules.</p>
    </div>`;
  }

  function renderCurrentlyActive(result) {
    if (!result.currentlyActive.length) return `<h3 id="yogaactivation-sec-active">Currently Active Yogas</h3><p style="font-size:0.9em;color:#555;">No present yoga shows a current dasha/transit/divisional activation signature under the current filters.</p>`;
    const rows = result.currentlyActive.map(y => `<tr data-yogaactivation-key="${esc(y.key)}" style="cursor:pointer;" class="${qualityClass(y.activationLevel)}">
        <td>${esc(y.name)}</td><td>${esc(y.domain)}</td><td>${badge(y.formationStrength)}</td><td>${badge(y.activationLevel)}</td><td>${(y.planets || []).join(', ')}</td>
      </tr>`).join('');
    return `<h3 id="yogaactivation-sec-active">Currently Active Yogas</h3><div class="output-box pastel-mint" style="overflow-x:auto;">
      <table class="rem-table"><thead><tr><th>Yoga</th><th>Domain</th><th>Formation Strength</th><th>Activation Level</th><th>Planets</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  }

  function renderDetail(result) {
    const y = selectedYogaKey ? result.evaluated.find(e => e.key === selectedYogaKey) : null;
    if (!y) return '<p style="font-size:0.9em;color:#555;">Click a yoga row above for its full calculation trace.</p>';
    const d = y.dashaActivation;
    const dashaRows = d.available && d.matches.length ? d.matches.map(m => `<tr><td>${esc(m.level)}</td><td>${esc(m.lord)}</td><td>${fmtDate(m.startDate)} &rarr; ${fmtDate(m.endDate)}</td></tr>`).join('') : `<tr><td colspan="3">No current MD/AD/PD match among this yoga's planets.</td></tr>`;
    const divisional = y.divisional.available ? y.divisional.results.map(r => `<li>${esc(r.varga)}: ${r.entries.map(e => `${esc(e.planet)} in ${esc(e.sign)} (${esc(e.dignity)})`).join('; ') || 'no data'} — ${badge(r.supportive ? 'Supports' : 'Mixed')}</li>`).join('') : '';
    const trace = [
      `Step 1 — Formation read from existing Yoga engine: ${y.present ? 'Present' : 'Not present'}, magnitude ${y.magnitude}`,
      '&darr;', `Step 2 — Formation Strength: ${y.formationStrength}`,
      '&darr;', `Step 3 — Domain: ${y.domain} (related modules: ${y.relatedModules.length ? y.relatedModules.join(', ') : 'none'})`,
      '&darr;', `Step 4 — Dasha Activation: ${d.available ? d.level : 'unavailable'} (current MD=${d.currentMD || '—'}, AD=${d.currentAD || '—'}, PD=${d.currentPD || '—'})`,
      '&darr;', `Step 5 — Transit Confirmation: ${y.transit.available ? (y.transit.active ? 'Active' : 'Not active') : 'unavailable'}`,
      '&darr;', `Step 6 — Divisional Confirmation (${y.vargas.join(', ')}): ${y.divisional.available ? y.divisional.level : 'unavailable'}`,
      '&darr;', `Step 7 — Cross-Module Correlation: ${y.crossCheck ? y.crossCheck.interpretation : 'No overlapping existing-module window found for this period.'}`,
      '&darr;', `Step 8 — Activation Classification: ${y.activationLevel}`
    ].join('<br>');
    return `<div class="output-box pastel-blue">
      <p><strong>${esc(y.name)}</strong> (${esc(y.polarity === 'good' ? 'auspicious' : 'challenging')}) — ${badge(y.formationStrength)} / ${badge(y.activationLevel)}</p>
      <p><em>${esc(y.howDerived)}</em></p>
      <p>${esc(y.meaning)}</p>
      ${y.special ? `<div class="output-box pastel-yellow"><p>${esc(y.special)}</p></div>` : ''}
      <h4>Dasha Activation</h4><table class="rem-table"><thead><tr><th>Level</th><th>Lord</th><th>Dates</th></tr></thead><tbody>${dashaRows}</tbody></table>
      ${y.transit.available ? evidenceDetails('Transit evidence', y.transit.evidence) : ''}
      <h4>Divisional Confirmation</h4><ul>${divisional || '<li>Not available.</li>'}</ul>
      ${y.crossCheck ? `<div class="output-box pastel-peach"><p><strong>Cross-Module Correlation:</strong> ${esc(y.crossCheck.interpretation)}</p></div>` : ''}
      <details class="avp-calc"><summary>YOGA ACTIVATION TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
    </div>`;
  }

  function renderClusters(result) {
    if (!result.groups.length) return `<h3 id="yogaactivation-sec-clusters">Correlated Activation Clusters</h3><p style="font-size:0.9em;color:#555;">No cluster of multiple yogas sharing the same current planetary period was found.</p>`;
    const rows = result.groups.map(g => `<tr><td>${esc(g.mahadasha)} / ${esc(g.antardasha)}${g.pratyantardasha ? ' / ' + esc(g.pratyantardasha) : ''}</td><td>${fmtDate(g.periodStart)} &rarr; ${fmtDate(g.periodEnd)}</td><td>${g.yogas.map(y => esc(y.name)).join(', ')}</td><td>${g.domainDiversity.count} (${g.domainDiversity.domains.map(esc).join(', ')})</td></tr>`).join('');
    return `<h3 id="yogaactivation-sec-clusters">Correlated Activation Clusters</h3><div class="output-box pastel-peach" style="overflow-x:auto;">
      <table class="rem-table"><thead><tr><th>MD/AD/PD</th><th>Period</th><th>Yogas in this cluster</th><th>Domain Diversity</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-size:0.85em;color:#777;">Multiple yogas sharing the same current planetary period are grouped into one cluster above, with a domain-diversity count — never reported as independent major-life events.</p>
    </div>`;
  }

  function renderUpcoming(result) {
    if (!result.upcoming.length) return `<h3 id="yogaactivation-sec-upcoming">Upcoming Activations (next ${result.horizonYears} year(s))</h3><p style="font-size:0.9em;color:#555;">No upcoming Mahadasha/Antardasha period in this horizon activates a present yoga.</p>`;
    const rows = result.upcoming.map(u => `<tr><td>${fmtDate(u.startDate)} &rarr; ${fmtDate(u.endDate)}</td><td>${esc(u.name)}</td><td>${esc(u.domain)}</td><td>${esc(u.mahadasha)} / ${esc(u.antardasha)}</td><td>${badge(u.level)}</td></tr>`).join('');
    return `<h3 id="yogaactivation-sec-upcoming">Upcoming Activations (next ${result.horizonYears} year(s))</h3><div class="output-box pastel-mint" style="overflow-x:auto;">
      <table class="rem-table"><thead><tr><th>Period</th><th>Yoga</th><th>Domain</th><th>MD/AD</th><th>Level</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  }

  // Section 21 — compact horizontal timeline bars (vertical stack on mobile via CSS flex-wrap).
  function renderTimeline(result) {
    const items = result.currentlyActive.concat(result.upcoming.map(u => ({ name: u.name, dashaActivation: { periodStart: u.startDate, periodEnd: u.endDate }, activationLevel: u.level })));
    if (!items.length) return '';
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + result.horizonYears * 365.25 * 24 * 60 * 60 * 1000);
    const spanStart = now.getTime() - 180 * 24 * 60 * 60 * 1000;
    const spanMs = horizonEnd.getTime() - spanStart;
    const bars = items.map(it => {
      const s = (it.dashaActivation && it.dashaActivation.periodStart) || now;
      const e = (it.dashaActivation && it.dashaActivation.periodEnd) || now;
      const left = Math.max(0, Math.min(100, ((s.getTime() - spanStart) / spanMs) * 100));
      const width = Math.max(1, Math.min(100 - left, ((e.getTime() - s.getTime()) / spanMs) * 100));
      return `<div style="display:flex;align-items:center;margin:4px 0;flex-wrap:wrap;"><div style="width:140px;font-size:0.8em;">${esc(it.name)}</div><div style="flex:1;min-width:120px;background:#eee;height:10px;border-radius:5px;position:relative;"><div class="${qualityClass(it.activationLevel)}" style="position:absolute;left:${left}%;width:${width}%;height:10px;border-radius:5px;background:currentColor;opacity:0.55;"></div></div></div>`;
    }).join('');
    return `<h3 id="yogaactivation-sec-timeline">Activation Timeline</h3><div class="output-box pastel-lavender">${bars}<p style="font-size:0.8em;color:#777;">Bar position/length is proportional only within this window (~6 months back to ${result.horizonYears} years ahead) — not to scale across the whole chart.</p></div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="yogaactivation-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) { return `<h3 id="yogaactivation-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`; }
  function renderDisclaimer(r) { return `<div class="output-box pastel-yellow"><p style="font-size:0.85em;"><strong>Disclaimer:</strong> ${esc(r.disclaimer)}</p></div>`; }

  function attachInteractions(root, result) {
    const catSelect = root.querySelector('#yogaactivation-category-select'); if (catSelect) catSelect.addEventListener('change', () => { categoryFilter = catSelect.value; UI.render(); });
    const actSelect = root.querySelector('#yogaactivation-activation-select'); if (actSelect) actSelect.addEventListener('change', () => { activationFilter = actSelect.value; UI.render(); });
    const horizonSelect = root.querySelector('#yogaactivation-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); UI.render(); });
    root.querySelectorAll('tr[data-yogaactivation-key]').forEach(tr => tr.addEventListener('click', () => { selectedYogaKey = tr.getAttribute('data-yogaactivation-key'); UI.render(); const el = document.getElementById('yogaactivation-sec-detail'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('yogaactivation-root');
    if (!root) return;
    const result = window.YogaActivationTiming.refresh(horizonYears, categoryFilter, activationFilter);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Yoga Activation Timing analysis. This reads the existing Yogas tab\'s own detection results.</p>'; return; }
    root.innerHTML = [
      '<p>Timing synthesis for this chart\'s existing yoga (planetary combination) results — reusing the Yogas tab\'s own formation detection, never re-deriving it. Pipeline: <strong>Formation &rarr; Formation Strength &rarr; Domain Mapping &rarr; Dasha Activation (MD/AD/PD) &rarr; Transit Confirmation &rarr; Divisional Confirmation &rarr; Existing-Module Correlation &rarr; Activation Classification &rarr; Correlation/Deduplication</strong>. Never guarantees any event; never predicts death, lifespan, illness, or a guaranteed financial/relationship/career outcome.</p>',
      renderContext(result), renderCurrentlyActive(result),
      `<h4 id="yogaactivation-sec-detail">Detailed Calculation</h4>${renderDetail(result)}`,
      renderClusters(result), renderTimeline(result), renderUpcoming(result),
      renderDisclaimer(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.YogaActivationTiming) window.YogaActivationTiming.init(); };
  UI.init();
  return UI;
})();
