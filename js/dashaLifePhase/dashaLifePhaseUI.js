/* =========================================================
   DASHA-BASED LIFE PHASE ANALYSIS — rendering layer only. Consumes
   window.DashaLifePhase (engine) and renders into #dashalifephase-root.
   Namespaced as window.DashaLifePhaseUI.
   ========================================================= */

window.DashaLifePhaseUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonFilter = 'full-life';
  let domainFilter = 'All';
  let selectedAdIndex = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }
  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l === 'start' || l === 'strong') return 'quality-good';
    if (l === 'middle' || l === 'moderate') return 'quality-neutral';
    if (l === 'transition' || l === 'end' || l === 'weak') return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderContext(result) {
    const themes = ['All'].concat(window.DASHALIFEPHASE_THEMES || []);
    const horizons = [{ v: '1', l: '1 year' }, { v: '3', l: '3 years' }, { v: '5', l: '5 years' }, { v: '10', l: '10 years' }, { v: 'full-life', l: 'Full life' }];
    const themeOpts = themes.map(t => `<option value="${esc(t)}" ${t === domainFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    const horizonOpts = horizons.map(h => `<option value="${h.v}" ${h.v === horizonFilter ? 'selected' : ''}>${esc(h.l)}</option>`).join('');
    return `<h3 id="dashalifephase-sec-context">Filters</h3><div class="output-box pastel-lavender">
      <p><label>Time Horizon: <select id="dashalifephase-horizon-select">${horizonOpts}</select></label> &nbsp;
      <label>Life Domain: <select id="dashalifephase-domain-select">${themeOpts}</select></label></p>
      <p style="font-size:0.85em;color:#777;">Filters only change which already-computed Dasha periods are shown in the dashboard below — they never recalculate the horoscope or the Dasha sequence itself.</p>
    </div>`;
  }

  function renderNatalPromise(p, label) {
    if (!p) return '';
    return `<p style="font-size:0.85em;color:#555;"><strong>${esc(label)} natal promise:</strong> ${esc(p.promiseNote)}</p>`;
  }

  function renderCurrentPhase(result) {
    const c = result.current;
    if (!c) return `<h3 id="dashalifephase-sec-current">Current Life Phase</h3><p style="font-size:0.9em;color:#555;">No current Dasha period found for this chart.</p>`;
    const md = c.mahadasha, mdTheme = c.mdTheme;
    const adBlock = c.antardasha ? `<h4>Current Antardasha: ${esc(c.antardasha.lord)}</h4>
      <p>${fmtDate(c.antardasha.startDate)} &rarr; ${fmtDate(c.antardasha.endDate)} — Theme: ${badge(c.adTheme.theme)} ${c.adTheme.refinesMahadashaTheme ? '(reinforces Mahadasha theme)' : '(refinement/nuance)'}</p>
      <p>${esc(c.adTheme.narrative)}</p>${renderNatalPromise(c.adTheme.natalPromise, c.antardasha.lord)}` : '';
    const pdBlock = c.pratyantar && c.pdTheme ? `<h4>Current Pratyantardasha: ${esc(c.pratyantar.lord)}</h4>
      <p>${fmtDate(c.pratyantar.startDate)} &rarr; ${fmtDate(c.pratyantar.endDate)} — Effective theme: ${badge(c.pdTheme.effectiveTheme)} ${c.pdTheme.overrodeParent ? '(independent structural evidence found)' : c.pdTheme.hierarchyGuardApplied ? '(hierarchy guard applied — did not override MD/AD)' : ''}</p>
      <p>${esc(c.pdTheme.narrative)}</p>${renderNatalPromise(c.pdTheme.natalPromise, c.pratyantar.lord)}` : '';
    const divisional = mdTheme.divisional.map(d => `<li>${esc(d.varga)}: ${esc(d.sign)} (${esc(d.dignity)})</li>`).join('');
    const yogas = mdTheme.relatedYogas.length ? `<ul>${mdTheme.relatedYogas.map(y => `<li>${esc(y.name)}${y.domain ? ' — ' + esc(y.domain) : ''} (${esc(y.activationLevel)})</li>`).join('')}</ul>` : '<p style="font-size:0.85em;color:#777;">No currently active yoga referenced from the Yoga Activation Timing module.</p>';
    const related = mdTheme.relatedTimingWindows.length ? `<ul>${mdTheme.relatedTimingWindows.map(h => `<li>${esc(h.module)}: ${fmtDate(h.window.startDate)} &rarr; ${fmtDate(h.window.endDate)}</li>`).join('')}</ul>` : '<p style="font-size:0.85em;color:#777;">No overlapping window found from existing timing modules for this period.</p>';
    return `<h3 id="dashalifephase-sec-current">Current Life Phase</h3><div class="output-box pastel-blue">
      <p><strong>Mahadasha: ${esc(md.lord)}</strong> (${fmtDate(md.startDate)} &rarr; ${fmtDate(md.endDate)}) — ${badge(mdTheme.theme)}${mdTheme.secondaryTheme && !mdTheme.isMultiDomain ? ` / secondary: ${esc(mdTheme.secondaryTheme)}` : ''} — Transition phase: ${badge(c.transitionPhase)}</p>
      <p>${esc(mdTheme.narrative)}</p>
      ${renderNatalPromise(mdTheme.natalPromise, md.lord)}
      <h4>Relevant Divisional Charts</h4><ul>${divisional || '<li>None mapped for this theme.</li>'}</ul>
      <h4>Related Active Yogas (referenced from Yoga Activation Timing)</h4>${yogas}
      <h4>Related Existing Timing-Module Windows (referenced, not re-timed)</h4>${related}
      ${adBlock}${pdBlock}
      <details class="avp-calc"><summary>CALCULATION TRACE — Current Phase</summary><p style="font-family:monospace;line-height:1.8;">${result.calculationSteps.map(s => `[${s.id}] ${esc(s.label)}`).join('<br>')}</p></details>
    </div>`;
  }

  function renderNextPhase(result) {
    const n = result.next;
    if (!n) return `<h3 id="dashalifephase-sec-next">Next Life Phase</h3><p style="font-size:0.9em;color:#555;">No further Mahadasha/Antardasha found on record beyond the current one.</p>`;
    const period = n.level === 'Mahadasha' ? n.mahadasha : n.antardasha;
    const theme = n.level === 'Mahadasha' ? n.mdTheme : n.adTheme;
    return `<h3 id="dashalifephase-sec-next">Next Life Phase</h3><div class="output-box pastel-mint">
      <p><strong>Next ${esc(n.level)}: ${esc(period.lord)}</strong> (${fmtDate(period.startDate)} &rarr; ${fmtDate(period.endDate)}) — ${badge(theme.theme)}</p>
      <p>${esc(theme.narrative)}</p>
      ${renderNatalPromise(theme.natalPromise, period.lord)}
      <details class="avp-calc"><summary>CALCULATION TRACE — Next Phase</summary><p style="font-family:monospace;line-height:1.8;">Theme derived from the same house-lordship/natural-significator pipeline as the current phase, applied to ${esc(period.lord)}'s own house ownership/occupation/dignity.</p></details>
    </div>`;
  }

  function renderDashboard(result) {
    if (!result.dashboard.length) return `<h3 id="dashalifephase-sec-dashboard">Full Life Dashboard</h3><p style="font-size:0.9em;color:#555;">No Dasha periods match the current filters.</p>`;
    const rows = result.dashboard.map((r, i) => `<tr class="${r.isCurrent ? 'quality-good' : ''}">
      <td>${esc(r.lord)}</td><td>${fmtMonthYear(r.startDate)} &rarr; ${fmtMonthYear(r.endDate)}</td><td>${esc(r.theme)}</td><td>${r.secondaryTheme ? esc(r.secondaryTheme) : '—'}</td><td>${r.isCurrent ? badge(r.transitionPhase) : (r.startDate > new Date() ? 'Upcoming' : 'Past')}</td>
    </tr>`).join('');
    return `<h3 id="dashalifephase-sec-dashboard">Full Life Dashboard</h3><div class="output-box pastel-peach" style="overflow-x:auto;">
      <table class="rem-table"><thead><tr><th>Mahadasha Lord</th><th>Period</th><th>Theme</th><th>Secondary</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  }

  function renderAntardashaTimeline(result) {
    const c = result.current;
    if (!c) return '';
    const mdTheme = c.mdTheme;
    const breakdown = window.DashaLifePhase.buildMahadashaBreakdown(c.mahadasha);
    const rows = breakdown.antardashas.map((ad, i) => `<tr data-dashalifephase-ad-index="${i}" style="cursor:pointer;">
      <td>${esc(ad.lord)}</td><td>${fmtDate(ad.startDate)} &rarr; ${fmtDate(ad.endDate)}</td><td>${badge(ad.themeAnalysis.theme)}</td><td>${ad.themeAnalysis.refinesMahadashaTheme ? 'Reinforces MD' : 'Refinement/nuance'}</td>
    </tr>`).join('');
    const detail = selectedAdIndex != null && breakdown.antardashas[selectedAdIndex]
      ? (function () {
          const ad = breakdown.antardashas[selectedAdIndex];
          const a = ad.themeAnalysis;
          return `<div class="output-box pastel-yellow"><p><strong>${esc(ad.lord)} Antardasha detail</strong></p><p>${esc(a.narrative)}</p>${renderNatalPromise(a.natalPromise, ad.lord)}${a.transit.available ? evidenceDetails('Transit evidence', a.transit.evidence) : ''}
          <details class="avp-calc"><summary>ANTARDASHA TRACE</summary><p style="font-family:monospace;line-height:1.8;">Step 1 — Theme scores derived from ${esc(ad.lord)}'s house ownership/occupation/natural significator role.<br>Step 2 — Compared against Mahadasha theme (${esc(mdTheme.theme)}): ${a.refinesMahadashaTheme ? 'matches/reinforces' : 'introduces a refinement'}.<br>Step 3 — Narrative assembled as a refinement of the Mahadasha theme, never an isolated prediction.</p></details></div>`;
        })()
      : '<p style="font-size:0.9em;color:#555;">Click an Antardasha row above for its full calculation trace.</p>';
    return `<h3 id="dashalifephase-sec-timeline">Antardasha Timeline (within current Mahadasha)</h3><div class="output-box pastel-lavender" style="overflow-x:auto;">
      <table class="rem-table"><thead><tr><th>Antardasha Lord</th><th>Period</th><th>Theme</th><th>Relation to MD</th></tr></thead><tbody>${rows}</tbody></table>
      ${detail}
    </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="dashalifephase-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }
  function renderMissing(r) {
    if (!r.missing.length) return '';
    return `<div class="output-box pastel-yellow"><p style="font-size:0.85em;"><strong>Not available for this chart:</strong> ${r.missing.map(esc).join('; ')}</p></div>`;
  }
  function renderLog(r) { return `<h3 id="dashalifephase-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(r.calculationLog.join('\n'))}</pre></div>`; }
  function renderDisclaimer(r) { return `<div class="output-box pastel-yellow"><p style="font-size:0.85em;"><strong>Disclaimer:</strong> ${esc(r.disclaimer)}</p></div>`; }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#dashalifephase-horizon-select'); if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonFilter = horizonSelect.value; UI.render(); });
    const domainSelect = root.querySelector('#dashalifephase-domain-select'); if (domainSelect) domainSelect.addEventListener('change', () => { domainFilter = domainSelect.value; UI.render(); });
    root.querySelectorAll('tr[data-dashalifephase-ad-index]').forEach(tr => tr.addEventListener('click', () => { selectedAdIndex = Number(tr.getAttribute('data-dashalifephase-ad-index')); UI.render(); const el = document.getElementById('dashalifephase-sec-timeline'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  }

  UI.render = function () {
    const root = document.getElementById('dashalifephase-root');
    if (!root) return;
    const result = window.DashaLifePhase.refresh(horizonFilter, domainFilter);
    if (!result) { root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Dasha-Based Life Phase Analysis. This reads the existing Vimshottari Dasha sequence already computed for this chart.</p>'; return; }
    root.innerHTML = [
      '<p>Master Dasha interpretation/synthesis for this chart\'s existing Vimshottari Mahadasha/Antardasha/Pratyantardasha sequence — reusing the Dasha engine\'s own computed periods, never recomputing them. Pipeline: <strong>Natal Promise &rarr; Mahadasha Theme &rarr; Antardasha Refinement &rarr; Pratyantardasha Refinement (Dasha-Hierarchy guarded) &rarr; Divisional Relevance &rarr; Transit Confirmation &rarr; Existing-Module &amp; Yoga Correlation &rarr; Transition Phase</strong>. Never guarantees any event; never predicts death, lifespan, illness, or a guaranteed life outcome.</p>',
      renderMissing(result), renderContext(result), renderCurrentPhase(result), renderNextPhase(result),
      renderAntardashaTimeline(result), renderDashboard(result), renderDisclaimer(result), renderLog(result), renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.DashaLifePhase) window.DashaLifePhase.init(); };
  UI.init();
  return UI;
})();
