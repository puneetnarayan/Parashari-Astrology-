/* =========================================================
   PARASHARI ANALYSIS MODULE — rendering layer only.
   Consumes window.ParashariAnalysis (the calculation engine) and
   renders into #pa-root. All DOM is created here; no astrology
   math lives in this file. Uses this app's EXISTING shared UI
   conventions (output-box/pastel-* boxes, .rem-table, the
   quality-good/neutral/bad color coding, and the avp-calc
   expandable-details pattern) rather than a separate design system,
   so the tab looks and behaves consistently with every other tab.
   Namespaced as window.ParashariAnalysisUI, guarded against
   double-initialization, per the spec's isolation requirements.
   ========================================================= */

window.ParashariAnalysisUI = (function () {
  const UI = {};
  let initialized = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function qualityClassFor(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('very strong') || l.includes('strong') || l.includes('high')) return 'quality-good';
    if (l.includes('moderate') || l.includes('mixed')) return 'quality-neutral';
    if (l.includes('weak') || l.includes('low') || l.includes('no clear')) return 'quality-bad';
    return '';
  }

  function badge(label) {
    return `<span class="${qualityClassFor(label)}">${esc(label)}</span>`;
  }

  function whyPanel(title, reasons) {
    if (!reasons || !reasons.length) return '';
    return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul></details>`;
  }

  // ---------------------------------------------------------------
  // Section renderers
  // ---------------------------------------------------------------
  function renderOverview(result) {
    const s = result.summary;
    return `
      <h3>Overview</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <tr><td>Lagna</td><td>${esc(s.lagna.ascendantSign)}</td><td class="${qualityClassFor(s.lagna.label)}">${esc(s.lagna.label)}</td></tr>
          <tr><td>Lagna Lord</td><td colspan="2">${esc(s.lagna.lagnaLord)}</td></tr>
          <tr><td>Moon Sign</td><td>${esc(s.moon.moon.planetInfo.sign)}</td><td class="${qualityClassFor(s.moon.moon.label)}">${esc(s.moon.moon.label)}</td></tr>
          <tr><td>Current Dasha</td><td colspan="2">${s.dasha ? esc(s.dasha.mahaLord) + (s.dasha.antarLord ? ' / ' + esc(s.dasha.antarLord) : '') : 'N/A'}</td></tr>
          <tr><td>Yogas Formed</td><td colspan="2">${s.yogas.length}</td></tr>
        </table>
        ${!result.validation.valid ? `<p style="color:#a33;">Chart data incomplete: ${esc(result.validation.missing.join(', '))}. Some sections below may be limited.</p>` : ''}
      </div>`;
  }

  function renderHouses(result) {
    const rows = result.houses.map(h => `
      <tr>
        <td>${h.house}</td>
        <td>${esc(h.sign)}</td>
        <td>${esc(h.lord)}</td>
        <td>${esc(h.category)}</td>
        <td>${h.occupants.length ? esc(h.occupants.join(', ')) : '&mdash;'}</td>
        <td>${h.beneficInfluence.length ? esc(h.beneficInfluence.join(', ')) : '&mdash;'}</td>
        <td>${h.maleficInfluence.length ? esc(h.maleficInfluence.join(', ')) : '&mdash;'}</td>
      </tr>`).join('');
    return `
      <h3>12-House Analysis</h3>
      <div class="output-box pastel-blue">
        <table class="rem-table">
          <thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Category</th><th>Occupants</th><th>Benefic Influence</th><th>Malefic Influence</th></tr></thead>
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
        <td>${p.house}</td>
        <td>${esc(p.dignityTier)}</td>
        <td>${esc(p.functionalNature)}</td>
        <td>${assess.score}</td>
        <td class="${qualityClassFor(assess.label)}">${badge(assess.label)}</td>
      </tr>`;
    }).join('');
    return `
      <h3>Planet Analysis</h3>
      <div class="output-box pastel-mint">
        <table class="rem-table">
          <thead><tr><th>Planet</th><th>Sign</th><th>House</th><th>Dignity</th><th>Functional Nature</th><th>Score</th><th>Assessment</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderPlanetWhy(result) {
    const panels = result.planets.map(p => {
      const a = ParashariAnalysis.assessPlanet(p.name);
      return `<details class="avp-calc"><summary>${esc(p.name)} — why ${a.score}/100 (${esc(a.label)})?</summary><ul>${
        a.positives.map(t => `<li>+ ${esc(t)}</li>`).concat(a.negatives.map(t => `<li>&minus; ${esc(t)}</li>`)).join('')
      }</ul></details>`;
    }).join('');
    return `<h4>Why? — Planet Score Breakdown</h4>${panels}`;
  }

  function renderYogas(result) {
    const rows = result.yogas.map(y => `
      <tr class="${y.formed ? 'quality-good' : ''}">
        <td>${esc(y.name)}</td>
        <td>${esc(y.type)}</td>
        <td>${y.formed ? 'Formed' : 'Not formed'}</td>
        <td>${y.planets.length ? esc(y.planets.join(', ')) : '&mdash;'}</td>
        <td>${esc(y.source)}</td>
        <td>${whyPanel('Why?', y.formed ? y.conditionsMet : y.conditionsMissing)}</td>
      </tr>`).join('');
    return `
      <h3>Yogas</h3>
      <p style="font-size:0.9em;color:#555;">Existing classical yogas are reused directly from this app's Yogas engine; only Dharma-Karmadhipati and Viparita Raja Yoga are newly added here, both clearly labeled by source.</p>
      <div class="output-box pastel-lavender">
        <table class="rem-table">
          <thead><tr><th>Yoga</th><th>Type</th><th>Status</th><th>Planets</th><th>Source</th><th>Details</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderVarga(result) {
    if (!result.varga) return '';
    const rows = result.varga.planets.map(p => `
      <tr class="${p.vargottama ? 'quality-good' : ''}">
        <td>${esc(p.name)}</td>
        <td>${esc(p.d1Sign)}</td>
        <td>${esc(p.d9Sign)}</td>
        <td>${esc(p.d9Dignity)}</td>
        <td>${p.vargottama ? 'Vargottama' : '&mdash;'}</td>
      </tr>`).join('');
    return `
      <h3>Navamsha (D9) Cross-Check</h3>
      <p style="font-size:0.9em;color:#555;">D9 Ascendant: ${esc(result.varga.d9AscendantSign)}. Confirms or qualifies D1 strength — never a replacement for it.</p>
      <div class="output-box pastel-yellow">
        <table class="rem-table">
          <thead><tr><th>Planet</th><th>D1 Sign</th><th>D9 Sign</th><th>D9 Dignity</th><th>Vargottama</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderDasha(result) {
    const d = result.dasha;
    if (!d) return `<h3>Dasha</h3><p style="font-size:0.9em;color:#555;">No Vimshottari Dasha data available.</p>`;
    return `
      <h3>Vimshottari Dasha</h3>
      <div class="output-box pastel-pink">
        <table class="rem-table">
          <tr><td>Mahadasha</td><td>${esc(d.mahaLord)}</td></tr>
          <tr><td>Antardasha</td><td>${d.antarLord ? esc(d.antarLord) : '&mdash;'}</td></tr>
        </table>
      </div>`;
  }

  function renderLifeAreas(result) {
    const rows = result.lifeAreas.map(a => `
      <tr>
        <td>${esc(a.area)} (House ${a.house})</td>
        <td class="${qualityClassFor(a.promise.label)}">${badge(a.promise.label)}</td>
        <td class="${qualityClassFor(a.confidence)}">${badge(a.confidence)}</td>
        <td>${a.contradiction ? `<span style="color:#a33;">${esc(a.contradiction)}</span>` : '&mdash;'}</td>
        <td>${whyPanel('Show reasoning', [
          `Natal promise score: ${a.promise.score}/100 (house lord ${esc(a.promise.lordAssessment ? a.promise.lordAssessment.planet : '')}).`,
          ...a.dasha.reasons, ...a.transit.reasons
        ])}</td>
      </tr>`).join('');
    return `
      <h3>Life Areas</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Life Area</th><th>Natal Promise</th><th>Current-Period Confidence</th><th>Contradiction</th><th>Details</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderSynthesis(result) {
    const items = result.synthesis.map(line => `<li>${esc(line)}</li>`).join('');
    return `
      <h3>Final Synthesis</h3>
      <div class="output-box pastel-mint">
        <ul>${items}</ul>
      </div>`;
  }

  function renderHelp() {
    return `<p>A full classical Parashari Kundali synthesis, built entirely on top of this app's existing chart, dignity, functional-lordship, aspect, Shadbala, Yoga, and Vimshottari Dasha calculations — nothing here is a duplicate calculation engine. Scores are transparent, cumulative-evidence estimates (never single-factor verdicts), and dasha/transit activation is always checked against natal promise rather than allowed to manufacture an event the chart does not support. Every score has a "Why?" panel showing the exact reasons behind it.</p>`;
  }

  UI.render = function () {
    const root = document.getElementById('pa-root');
    if (!root) return;
    const result = window.ParashariAnalysis.refresh();
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Parashari Analysis.</p>';
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
