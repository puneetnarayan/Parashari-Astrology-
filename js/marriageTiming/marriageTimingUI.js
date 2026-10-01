/* =========================================================
   MARRIAGE TIMING — rendering layer only.
   Consumes window.MarriageTiming (the calculation engine) and renders
   into #mt-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — the same visual language
   as every other tab, per this session's established pattern.
   Namespaced as window.MarriageTimingUI.
   ========================================================= */

window.MarriageTimingUI = (function () {
  const UI = {};
  let initialized = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l === 'confirmed' || l.includes('supportive')) return 'quality-good';
    if (l.includes('mixed') || l === 'candidate') return 'quality-neutral';
    if (l.includes('challenging') || l.includes('not confirmed') || l === 'weak') return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }

  function renderBasis(r) {
    const b = r.basis;
    return `
      <h3 id="mt-sec-basis">1. Birth &amp; Chart Basis</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <tr><td>Date / Time of Birth (UTC)</td><td>${esc(b.birthUtc.toISOString().replace('T', ' ').slice(0, 19))}</td></tr>
          <tr><td>Ascendant</td><td>${esc(b.ascendantSign)} ${esc(b.ascendantDegree)}</td></tr>
          <tr><td>Ascendant Lord</td><td>${esc(b.lagnaLord)}</td></tr>
          <tr><td>7th House Sign</td><td>${esc(b.seventhSign)}</td></tr>
          <tr><td>7th Lord</td><td>${esc(b.seventhLord)}</td></tr>
          <tr><td>Planets in 7th House</td><td>${b.seventhOccupants.length ? esc(b.seventhOccupants.join(', ')) : '&mdash; (empty)'}</td></tr>
          <tr><td>Venus</td><td>${esc(b.venusSign)}, house ${b.venusHouse}</td></tr>
          <tr><td>Jupiter</td><td>${esc(b.jupiterSign)}, house ${b.jupiterHouse}</td></tr>
          <tr><td>D9 Ascendant</td><td>${esc(b.d9AscendantSign)}</td></tr>
          <tr><td>D9 7th House</td><td>${esc(b.d9SeventhSign)}</td></tr>
          <tr><td>D9 7th Lord</td><td>${esc(b.d9SeventhLord)}</td></tr>
        </table>
        <p style="font-size:0.85em;color:#777;">Place of birth is read from the latitude/longitude entered on the Chart &amp; Analysis tab; this app does not store a separate place-name field.</p>
      </div>`;
  }

  function evidenceDetails(ev) { return `<details class="avp-calc"><summary>Show calculation</summary><ul>${ev.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const rows = r.promise.matrix.map(m => `
      <tr>
        <td>${esc(m.factor)}</td>
        <td>${esc(m.observation)}</td>
        <td>${m.rule ? esc(m.rule.name) : '&mdash;'}</td>
        <td class="${qualityClass(m.result)}">${badge(m.result)}</td>
        <td>${evidenceDetails(m.evidence)}</td>
      </tr>`).join('');
    const s = r.promise.summary;
    return `
      <h3 id="mt-sec-promise">2 &amp; 3. Marriage Promise</h3>
      <div class="output-box pastel-blue">
        <table class="rem-table">
          <thead><tr><th>Factor</th><th>Observation</th><th>Rule</th><th>Result</th><th>Evidence</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="output-box pastel-mint">
        <p><strong>Strong/supporting factors:</strong> ${s.strongSupportingFactors} &nbsp; <strong>Neutral/mixed factors:</strong> ${s.neutralFactors} &nbsp; <strong>Challenging factors:</strong> ${s.challengingFactors}</p>
        <p><strong>Overall interpretation:</strong> ${esc(s.interpretation)}</p>
        <p style="font-size:0.85em;color:#777;">This is a qualitative count, not a single arbitrary score — each factor's classification is shown above with its own evidence.</p>
      </div>`;
  }

  function renderSignificators(r) {
    const rows = r.significators.map(s => `
      <tr>
        <td>${esc(s.planet)}</td>
        <td>${s.housesOwned.length ? s.housesOwned.join(', ') : '&mdash;'}</td>
        <td>${s.houseOccupied}</td>
        <td>${s.conjunctWith.length ? esc(s.conjunctWith.join(', ')) : '&mdash;'}</td>
        <td>${s.aspects.length ? esc(s.aspects.join(', ')) : '&mdash;'}</td>
        <td>${esc(s.relationshipWithSeventhLord)}</td>
        <td>${s.d9Relevance ? 'Yes' : 'No'}</td>
        <td>${esc(s.classification)}</td>
      </tr>`).join('');
    return `
      <h3 id="mt-sec-significators">4. Marriage Significators</h3>
      <div class="output-box pastel-lavender">
        <table class="rem-table">
          <thead><tr><th>Planet</th><th>Houses Owned</th><th>House Occupied</th><th>Conjunct</th><th>Aspects</th><th>Rel. to 7th Lord</th><th>D9 Relevant</th><th>Classification</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderDashaAndTransits(r) {
    if (r.missing.includes('Vimshottari Dasha')) {
      return `<h3 id="mt-sec-dasha">5-9. Dasha &amp; Transit Analysis</h3><p style="color:#a33;">Marriage Timing analysis cannot be completed because: Vimshottari Dasha data is unavailable.</p>`;
    }
    if (!r.transitCandidates.length) {
      return `<h3 id="mt-sec-dasha">5-9. Dasha &amp; Transit Analysis</h3><p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next 15 years was found to connect to the 7th lord, Venus, Jupiter, or the 2nd/5th/11th houses.</p>`;
    }
    const rows = r.transitCandidates.map((c, i) => `
      <tr data-mt-candidate="${i}" style="cursor:pointer;" class="${qualityClass(c.qualification)}">
        <td>${fmtDate(c.startDate)}</td>
        <td>${fmtDate(c.endDate)}</td>
        <td>${esc(c.mahadasha)}</td>
        <td>${esc(c.antardasha)}</td>
        <td>${esc(c.pratyantar)}</td>
        <td>${badge(c.qualification)}</td>
        <td>${c.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${c.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${c.convergenceScore}</td>
      </tr>`).join('');
    const details = r.transitCandidates.map((c, i) => `
      <div id="mt-candidate-detail-${i}" class="mt-candidate-detail" hidden>
        <div class="output-box pastel-peach">
          <p><strong>Candidate Period</strong></p>
          <table class="rem-table">
            <tr><td>Mahadasha</td><td>${esc(c.mahadasha)}</td></tr>
            <tr><td>Antardasha</td><td>${esc(c.antardasha)}</td></tr>
            <tr><td>Pratyantar</td><td>${esc(c.pratyantar)}</td></tr>
            <tr><td>Start</td><td>${fmtDate(c.startDate)}</td></tr>
            <tr><td>End</td><td>${fmtDate(c.endDate)}</td></tr>
          </table>
          <p><strong>Why was this period selected?</strong></p>
          <ul>${c.reasons.map(reason => `<li>&check; ${esc(reason)}</li>`).join('')}</ul>
          <p><strong>Jupiter transit (at window midpoint):</strong> ${c.transit.jupiter.sign}, house ${c.transit.jupiter.house} — ${badge(c.transit.jupiter.active ? 'Active' : 'Not active')}</p>
          <ul>${c.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          <p><strong>Saturn transit (at window midpoint):</strong> ${c.transit.saturn.sign}, house ${c.transit.saturn.house} — ${badge(c.transit.saturn.active ? 'Active' : 'Not active')}</p>
          <ul>${c.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          <p><strong>Convergence score:</strong> ${c.convergenceScore} &mdash; ${c.convergenceBreakdown.map(b => `${esc(b[0])} (+${b[1]})`).join(', ') || 'no contributing factors'}</p>
        </div>
      </div>`).join('');
    return `
      <h3 id="mt-sec-dasha">5-7. Vimshottari Dasha Candidate Periods</h3>
      <p style="font-size:0.9em;color:#555;">Click any row for the full reasoning, transit confirmation, and convergence breakdown.</p>
      <div class="output-box pastel-yellow" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Start</th><th>End</th><th>MD</th><th>AD</th><th>PD</th><th>Qualification</th><th id="mt-sec-transits">Jupiter Transit</th><th>Saturn Transit</th><th>Convergence</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${details}`;
  }

  function renderD1D9(r) {
    if (!r.d9Confirmation.length) return '';
    const rows = r.d9Confirmation.map(row => `
      <tr>
        <td>${esc(row.factor)}</td>
        <td>${esc(row.d1)}</td>
        <td>${esc(row.d9)}</td>
        <td class="${qualityClass(row.confirmation)}">${badge(row.confirmation)}</td>
      </tr>`).join('');
    return `
      <h3 id="mt-sec-d1d9">10. D1 &times; D9 Confirmation</h3>
      <div class="output-box pastel-mint">
        <table class="rem-table">
          <thead><tr><th>Factor</th><th>D1</th><th>D9</th><th>Confirmation</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderWindow(title, w) {
    if (!w) return `<h4>${esc(title)}</h4><p style="font-size:0.9em;color:#555;">No meaningful qualifying period found.</p>`;
    return `
      <h4>${esc(title)}</h4>
      <div class="output-box pastel-pink">
        <p><strong>${fmtMonthYear(w.startDate)} &rarr; ${fmtMonthYear(w.endDate)}</strong> (${esc(w.mahadasha)} / ${esc(w.antardasha)} ${badge(w.qualification)})</p>
        <p><strong>Why this window?</strong></p>
        <ol>${w.why.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    return `
      <h3 id="mt-sec-windows">11-12. Convergence &amp; Final Marriage Window</h3>
      ${renderWindow('Primary Window', r.primaryWindow)}
      ${renderWindow('Secondary Window', r.secondaryWindow)}
      <p style="font-size:0.85em;color:#777;">Shown as a broad period, not a single predicted date — the methodology supports timing windows, not false day-level precision.</p>`;
  }

  function renderCalculationSequence(r) {
    const steps = r.calculationSteps.map(s => `<button type="button" class="mt-step-btn" data-mt-anchor="${s.anchor}">${s.id}. ${esc(s.label)}</button>`).join(' &rarr; ');
    return `
      <h3 id="mt-sec-sequence">13. Calculation Sequence</h3>
      <div class="output-box pastel-lavender" style="line-height:2.2;">${steps}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `
      <h3 id="mt-sec-log">14. Calculation Log</h3>
      <div class="output-box pastel-blue">
        <pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre>
        <button type="button" id="mt-copy-log-btn">Copy Calculation Log</button>
      </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `
      <details class="avp-calc">
        <summary>${esc(rule.id)} — ${esc(rule.name)}</summary>
        <p><strong>Category:</strong> ${esc(rule.category)}</p>
        <p><strong>Rule:</strong> ${esc(rule.description)}</p>
        <p><strong>Explanation:</strong> ${esc(rule.explanation)}</p>
        <p><strong>Source:</strong> ${esc(rule.source)}</p>
      </details>`).join('');
    return `
      <h3 id="mt-sec-rules">15. Rules Used</h3>
      <div class="output-box pastel-peach">${items}</div>`;
  }

  function attachInteractions(root, result) {
    root.querySelectorAll('tr[data-mt-candidate]').forEach(tr => {
      tr.addEventListener('click', () => {
        const idx = tr.getAttribute('data-mt-candidate');
        const detail = root.querySelector(`#mt-candidate-detail-${idx}`);
        if (!detail) return;
        const wasHidden = detail.hidden;
        root.querySelectorAll('.mt-candidate-detail').forEach(d => { d.hidden = true; });
        detail.hidden = !wasHidden;
        if (!detail.hidden) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
    root.querySelectorAll('.mt-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.getAttribute('data-mt-anchor'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    const copyBtn = root.querySelector('#mt-copy-log-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = result.calculationLog.join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
        }
      });
    }
  }

  UI.render = function () {
    const root = document.getElementById('mt-root');
    if (!root) return;
    const result = window.MarriageTiming.refresh();
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Marriage Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>This tab traces the full chain from birth chart to a candidate marriage window: <strong>Birth Chart &rarr; Marriage Promise &rarr; Marriage Significators &rarr; Vimshottari Dasha &rarr; Candidate Periods &rarr; Transit Confirmation &rarr; D1/D9 Confirmation &rarr; Final Marriage Window</strong>. Every conclusion below is traceable to its evidence — expand any "Show calculation" panel or click a candidate row.</p>',
      renderBasis(result),
      renderPromise(result),
      renderWindows(result),
      renderSignificators(result),
      renderDashaAndTransits(result),
      renderD1D9(result),
      renderCalculationSequence(result),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.MarriageTiming) window.MarriageTiming.init(); };
  UI.init();
  return UI;
})();
