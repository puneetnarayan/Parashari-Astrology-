/* =========================================================
   PARASHARI ANALYSIS MODULE — rendering layer only.
   Consumes window.ParashariAnalysis (the calculation engine) and
   renders into #pa-root. All DOM is created here; no astrology
   math lives in this file. Styled exclusively by
   js/parashariAnalysis/parashariAnalysis.css (Master UI Design
   System) — never this app's shared pastel or quality-label classes.
   Namespaced as window.ParashariAnalysisUI, guarded against
   double-initialization, per the spec's isolation requirements.
   ========================================================= */

window.ParashariAnalysisUI = (function () {
  const UI = {};
  let initialized = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function badgeClassFor(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('very strong') || l.includes('strong') || l.includes('high')) return 'pa-badge-success';
    if (l.includes('moderate') || l.includes('mixed')) return 'pa-badge-warning';
    if (l.includes('weak') || l.includes('low') || l.includes('no clear')) return 'pa-badge-danger';
    return 'pa-badge-neutral';
  }

  function badge(label) {
    return `<span class="pa-badge ${badgeClassFor(label)}">${esc(label)}</span>`;
  }

  function whyPanel(title, reasons) {
    if (!reasons || !reasons.length) return '';
    return `<details class="pa-why"><summary>${esc(title)}</summary><ul>${reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul></details>`;
  }

  // ---------------------------------------------------------------
  // Section renderers
  // ---------------------------------------------------------------
  function renderOverview(result) {
    const s = result.summary;
    return `
      <div class="pa-section">
        <h2>Overview</h2>
        <div class="pa-card-grid">
          <div class="pa-card"><div class="pa-card-label">Lagna</div><div class="pa-card-value">${esc(s.lagna.ascendantSign)} ${badge(s.lagna.label)}</div></div>
          <div class="pa-card"><div class="pa-card-label">Lagna Lord</div><div class="pa-card-value">${esc(s.lagna.lagnaLord)}</div></div>
          <div class="pa-card"><div class="pa-card-label">Moon Sign</div><div class="pa-card-value">${esc(s.moon.moon.planetInfo.sign)} ${badge(s.moon.moon.label)}</div></div>
          <div class="pa-card"><div class="pa-card-label">Current Dasha</div><div class="pa-card-value">${s.dasha ? esc(s.dasha.mahaLord) + (s.dasha.antarLord ? ' / ' + esc(s.dasha.antarLord) : '') : 'N/A'}</div></div>
          <div class="pa-card"><div class="pa-card-label">Yogas Formed</div><div class="pa-card-value">${s.yogas.length}</div></div>
        </div>
        ${!result.validation.valid ? `<div class="pa-contradiction">Chart data incomplete: ${esc(result.validation.missing.join(', '))}. Some sections below may be limited.</div>` : ''}
      </div>`;
  }

  function renderHouses(result) {
    const rows = result.houses.map(h => `
      <tr>
        <td class="pa-num">${h.house}</td>
        <td>${esc(h.sign)}</td>
        <td>${esc(h.lord)}</td>
        <td>${esc(h.category)}</td>
        <td>${h.occupants.length ? esc(h.occupants.join(', ')) : '&mdash;'}</td>
        <td>${h.beneficInfluence.length ? esc(h.beneficInfluence.join(', ')) : '&mdash;'}</td>
        <td>${h.maleficInfluence.length ? esc(h.maleficInfluence.join(', ')) : '&mdash;'}</td>
      </tr>`).join('');
    return `
      <div class="pa-section">
        <h2>12-House Analysis</h2>
        <table>
          <thead><tr><th class="pa-num">House</th><th>Sign</th><th>Lord</th><th>Category</th><th>Occupants</th><th>Benefic Influence</th><th>Malefic Influence</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderPlanets(result) {
    const rows = result.planets.map(p => {
      const assess = ParashariAnalysis.assessPlanet(p.name);
      return `
      <tr>
        <td>${esc(p.name)}</td>
        <td>${esc(p.sign)}</td>
        <td class="pa-num">${p.house}</td>
        <td>${esc(p.dignityTier)}</td>
        <td>${esc(p.functionalNature)}</td>
        <td class="pa-num">${assess.score}</td>
        <td>${badge(assess.label)}</td>
        <td></td>
      </tr>`;
    }).join('');
    const html = `
      <div class="pa-section">
        <h2>Planet Analysis</h2>
        <table id="pa-planet-table">
          <thead><tr><th>Planet</th><th>Sign</th><th class="pa-num">House</th><th>Dignity</th><th>Functional Nature</th><th class="pa-num">Score</th><th>Assessment</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    return html;
  }

  function renderPlanetWhy(result) {
    // Attach "Why?" detail rows beneath the planet table via expandable panels per planet.
    const panels = result.planets.map(p => {
      const a = ParashariAnalysis.assessPlanet(p.name);
      return `<details class="pa-why"><summary>${esc(p.name)} — why ${a.score}/100 (${esc(a.label)})?</summary><ul>${
        a.positives.map(t => `<li>+ ${esc(t)}</li>`).concat(a.negatives.map(t => `<li>&minus; ${esc(t)}</li>`)).join('')
      }</ul></details>`;
    }).join('');
    return `<div class="pa-section"><h3>Why? — Planet Score Breakdown</h3>${panels}</div>`;
  }

  function renderYogas(result) {
    const rows = result.yogas.map(y => `
      <tr>
        <td>${esc(y.name)}</td>
        <td>${esc(y.type)}</td>
        <td>${badge(y.formed ? 'Strong' : 'Weak')}${y.formed ? '' : ' <span class="pa-muted">(not formed)</span>'}</td>
        <td>${y.planets.length ? esc(y.planets.join(', ')) : '&mdash;'}</td>
        <td>${esc(y.source)}</td>
        <td>${whyPanel('Why?', y.formed ? y.conditionsMet : y.conditionsMissing)}</td>
      </tr>`).join('');
    return `
      <div class="pa-section">
        <h2>Yogas</h2>
        <p class="pa-muted">Existing classical yogas are reused directly from this app's Yogas engine; only Dharma-Karmadhipati and Viparita Raja Yoga are newly added here, both clearly labeled by source.</p>
        <table>
          <thead><tr><th>Yoga</th><th>Type</th><th>Status</th><th>Planets</th><th>Source</th><th>Details</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderVarga(result) {
    if (!result.varga) return '';
    const rows = result.varga.planets.map(p => `
      <tr>
        <td>${esc(p.name)}</td>
        <td>${esc(p.d1Sign)}</td>
        <td>${esc(p.d9Sign)}</td>
        <td>${esc(p.d9Dignity)}</td>
        <td>${badge(p.vargottama ? 'Strong' : 'Moderate')}${p.vargottama ? ' Vargottama' : ''}</td>
      </tr>`).join('');
    return `
      <div class="pa-section">
        <h2>Navamsha (D9) Cross-Check</h2>
        <p class="pa-muted">D9 Ascendant: ${esc(result.varga.d9AscendantSign)}. Confirms or qualifies D1 strength — never a replacement for it.</p>
        <table>
          <thead><tr><th>Planet</th><th>D1 Sign</th><th>D9 Sign</th><th>D9 Dignity</th><th>Vargottama</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderDasha(result) {
    const d = result.dasha;
    if (!d) return `<div class="pa-section"><h2>Dasha</h2><p class="pa-muted">No Vimshottari Dasha data available.</p></div>`;
    return `
      <div class="pa-section">
        <h2>Vimshottari Dasha</h2>
        <div class="pa-card-grid">
          <div class="pa-card"><div class="pa-card-label">Mahadasha</div><div class="pa-card-value">${esc(d.mahaLord)}</div></div>
          <div class="pa-card"><div class="pa-card-label">Antardasha</div><div class="pa-card-value">${d.antarLord ? esc(d.antarLord) : '&mdash;'}</div></div>
        </div>
      </div>`;
  }

  function renderLifeAreas(result) {
    const cards = result.lifeAreas.map((a, i) => `
      <div class="pa-card">
        <div class="pa-card-label">${esc(a.area)} (House ${a.house})</div>
        <div class="pa-card-value">${badge(a.promise.label)}</div>
        <div class="pa-muted">Current-period confidence: ${badge(a.confidence)}</div>
        ${a.contradiction ? `<div class="pa-contradiction">${esc(a.contradiction)}</div>` : ''}
        ${whyPanel('Show reasoning', [
          `Natal promise score: ${a.promise.score}/100 (house lord ${esc(a.promise.lordAssessment ? a.promise.lordAssessment.planet : '')}).`,
          ...a.dasha.reasons, ...a.transit.reasons
        ])}
      </div>`).join('');
    return `
      <div class="pa-section">
        <h2>Life Areas</h2>
        <div class="pa-card-grid">${cards}</div>
      </div>`;
  }

  function renderSynthesis(result) {
    const items = result.synthesis.map(line => `<li>${esc(line)}</li>`).join('');
    return `
      <div class="pa-section">
        <h2>Final Synthesis</h2>
        <ul class="pa-synthesis-list">${items}</ul>
      </div>`;
  }

  function renderHelp() {
    return `
      <div class="pa-section">
        <h2>Parashari Analysis</h2>
        <p>A full classical Parashari Kundali synthesis, built entirely on top of this app's existing chart, dignity, functional-lordship, aspect, Shadbala, Yoga, and Vimshottari Dasha calculations — nothing here is a duplicate calculation engine. Scores are transparent, cumulative-evidence estimates (never single-factor verdicts), and dasha/transit activation is always checked against natal promise rather than allowed to manufacture an event the chart does not support. Every score has a "Why?" panel showing the exact reasons behind it.</p>
      </div>`;
  }

  UI.render = function () {
    const root = document.getElementById('pa-root');
    if (!root) return;
    const result = window.ParashariAnalysis.refresh();
    if (!result) {
      root.innerHTML = '<div class="pa-section"><p class="pa-muted">Generate a chart first (Chart &amp; Analysis tab) to see the Parashari Analysis.</p></div>';
      return;
    }
    root.innerHTML = [
      renderHelp(result),
      renderOverview(result),
      renderHouses(result),
      renderPlanets(result),
      renderPlanetWhy(result),
      renderYogas(result),
      renderVarga(result),
      renderDasha(result),
      renderLifeAreas(result),
      renderSynthesis(result)
    ].join('');
  };

  UI.init = function () {
    if (initialized) return;
    initialized = true;
    if (window.ParashariAnalysis) window.ParashariAnalysis.init();
  };

  UI.init();
  return UI;
})();
