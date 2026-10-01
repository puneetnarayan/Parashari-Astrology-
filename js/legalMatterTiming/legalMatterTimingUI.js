/* =========================================================
   LEGAL MATTER RESOLUTION TIMING — rendering layer only. Consumes
   window.LegalMatterTiming (engine) and renders into #legal-root.
   Uses this app's EXISTING shared UI conventions (output-box/
   pastel-* panels, .rem-table, quality-good/neutral/bad coloring,
   avp-calc expandable details) — same visual language as every
   other timing tab.
   Namespaced as window.LegalMatterTimingUI.
   ========================================================= */

window.LegalMatterTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let matterType = 'General';
  let minSupport = 'All';
  let stageFilter = 'All';
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes' || l === 'clearly present') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial') || l === 'present') return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('unavailable') || l.includes('limited')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderDisclaimer() {
    return `<div class="output-box pastel-yellow" style="font-size:0.85em;"><strong>Disclaimer:</strong> This module provides an astrological timing interpretation only. It is not legal advice, does not determine legal rights or outcomes, and should not be used instead of advice from a qualified legal professional.</div>`;
  }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="legal-sec-promise">Natal Legal Matter Indicators</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.potential)}</strong></p>
        ${evidenceDetails('Why this potential level?', np.reasons)}
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.fifthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.seventhHouse)}${houseRow(np.eighthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.mars, 'Mars')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.rahu, 'Rahu')}${karakaRow(np.ketu, 'Ketu')}
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">No planet is treated as automatically positive or negative. A 6th-house activation is never automatically equated with an adverse outcome. This does not state that a legal dispute is certain to occur.</p>
      </div>
      <h4 id="legal-sec-signature">Legal House Relationship Signatures</h4>
      <div class="output-box pastel-mint">
        <table class="rem-table"><thead><tr><th>Indicator</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
          ${np.relationships.map(rel => `
          <tr class="${rel.connected ? 'quality-good' : ''}">
            <td>${esc(rel.rule.name)}</td><td>${rel.connected ? 'Connected' : 'Not connected'}</td><td>${evidenceDetails('Evidence', [rel.evidence])}</td>
          </tr>`).join('')}
          ${np.convergenceSignatures.map(p => `
          <tr class="${p.present ? 'quality-good' : ''}">
            <td>${esc(p.rule.name)}</td><td>${p.present ? 'Present' : 'Not present'}</td><td>${evidenceDetails('Evidence', [p.evidence])}</td>
          </tr>`).join('')}
        </tbody></table>
      </div>`;
  }

  function renderMatterTypeAndHorizon() {
    const matterTypes = ['General', 'Property', 'Family', 'Financial', 'Employment', 'Business/Contract', 'Inheritance', 'Administrative/Government', 'Other'];
    const matterOptions = matterTypes.map(t => `<option value="${esc(t)}" ${t === matterType ? 'selected' : ''}>${esc(t)}</option>`).join('');
    return `
      <h3 id="legal-sec-matter">Matter Type</h3>
      <div class="output-box pastel-lavender">
        <p><label>Matter Type: <select id="legal-matter-select">${matterOptions}</select></label></p>
        <p style="font-size:0.85em;color:#777;">The selected matter type adjusts which supporting houses receive emphasis — it never manufactures a result unsupported by the horoscope, and provides no legal classification or legal strategy.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="legal-sec-dasha">Current Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Legal Matter Resolution Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="legal-sec-dasha">Current Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Legal-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct legal-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const supportOptions = ['All', 'Moderately Supportive', 'Supportive', 'Strongly Supportive'].map(s => `<option value="${esc(s)}" ${s === minSupport ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const stages = ['All', 'Initiation', 'Proceedings', 'Negotiation', 'Settlement', 'Hearing / Order', 'Resolution / Closure', 'Appeal / Review', 'Continued / Delayed'];
    const stageOptions = stages.map(s => `<option value="${esc(s)}" ${s === stageFilter ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="legal-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Support: <select id="legal-support-select">${supportOptions}</select></label> &nbsp; <label>Event Stage: <select id="legal-stage-select">${stageOptions}</select></label></p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="legal-sec-windows">Upcoming Legal Timing Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient convergence for a legal-matter timing window.</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-legal-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${badge(w.strength.label)}</td>
        <td>${esc(w.stage.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="legal-sec-windows">Upcoming Legal Timing Windows</h3>
      ${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Key Houses</th><th>Jupiter</th><th>Saturn</th><th>Support</th><th>Stage</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="legal-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Step 1 — Natal Legal Factors established', '&darr;',
      `Step 2 — Mahadasha = ${w.mahadasha}, Antardasha = ${w.antardasha}, Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `Step 3 — Houses activated: ${w.activatedHouses.join(', ')} (matter-type emphasis match: ${w.emphasisMatch ? 'Yes' : 'No'})`, '&darr;',
      `Step 4 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}, Rahu ${w.transit.rahu.active ? 'active (secondary)' : 'not active'}, Ketu ${w.transit.ketu.active ? 'active (secondary)' : 'not active'}`, '&darr;',
      `Step 5 — Stage Classification = ${w.stage.label}`, '&darr;',
      `Step 6 — Window included: Support = ${w.strength.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-blue">
        <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Stage:</strong> ${badge(w.stage.label)}</p>
        <p><strong>Support:</strong> ${badge(w.strength.label)}</p>
        <p><strong>Why this period:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        ${w.cautions.length ? `<p><strong>Caution / mixed factors:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Rahu/Ketu (secondary only):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <details class="avp-calc"><summary>LEGAL MATTER RESOLUTION TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.stage.label)}</span>
      </div>`).join('');
    return `<h4 id="legal-sec-timeline">Legal Matter Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Filing', 'Notice/Summons', 'First Hearing', 'Negotiation', 'Settlement', 'Judgment/Order', 'Resolution/Closure', 'Appeal'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.LegalMatterTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.LegalMatterTiming.validateHistoricalDate(eventDate, ev.type, matterType) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">No chart/dasha data.</td><td><button type="button" class="legal-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="7">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="legal-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.sixthActivation ? 'Yes' : 'No')}</td><td>${badge(v.ninthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${badge(v.jupiterActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="legal-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="legal-sec-historical">Historical Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous filing/hearing/settlement/judgment date to see what the method would have shown for it — this is empirical testing of the implementation, not proof of astrological certainty. No case numbers, party names, or other sensitive legal details are requested or stored.</p>
        <p><input type="date" id="legal-hist-date-input"> <select id="legal-hist-type-select">${typeOptions}</select> <button type="button" id="legal-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>6th</th><th>9th</th><th>11th</th><th>Jupiter</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
      </div>`;
  }

  function renderRules(r) {
    const items = r.rulesUsed.map(rule => `
      <details class="avp-calc">
        <summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary>
        <p><strong>Category:</strong> ${esc(rule.category)}</p>
        <p><strong>Rule:</strong> ${esc(rule.description)}</p>
        <p><strong>Explanation:</strong> ${esc(rule.explanation)}</p>
        <p><strong>Source:</strong> ${esc(rule.source)}</p>
      </details>`).join('');
    return `<h3 id="legal-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="legal-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="legal-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#legal-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    const matterSelect = root.querySelector('#legal-matter-select');
    if (matterSelect) matterSelect.addEventListener('change', () => { matterType = matterSelect.value; selectedWindowIndex = null; UI.render(); });

    const supportSelect = root.querySelector('#legal-support-select');
    if (supportSelect) supportSelect.addEventListener('change', () => { minSupport = supportSelect.value; selectedWindowIndex = null; UI.render(); });

    const stageSelect = root.querySelector('#legal-stage-select');
    if (stageSelect) stageSelect.addEventListener('change', () => { stageFilter = stageSelect.value; selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-legal-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-legal-window'));
      UI.render();
      const el = document.getElementById('legal-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#legal-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#legal-hist-date-input').value;
      const type = root.querySelector('#legal-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.legal-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#legal-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('legal-root');
    if (!root) return;
    const result = window.LegalMatterTiming.refresh(horizonYears, matterType, minSupport, stageFilter);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Legal Matter Resolution Timing analysis.</p>' + renderDisclaimer();
      return;
    }
    root.innerHTML = [
      renderDisclaimer(),
      '<p>Parashari/Vimshottari legal-matter timing (no KP or Western technique). This is a timing-analysis and classification tool only. Traces: <strong>Natal Legal Factors &rarr; Dasha &rarr; Matter-Specific Houses &rarr; Transit &rarr; Stage Classification &rarr; Final Window</strong>. D10 is deliberately not used here. 6th-house activation alone, a single transit, or Rahu/Ketu alone never creates a resolution window, and this module never states that a party will win or lose, or that a settlement/judgment date is guaranteed.</p>',
      renderPromise(result),
      renderMatterTypeAndHorizon(),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.LegalMatterTiming) window.LegalMatterTiming.init(); };
  UI.init();
  return UI;
})();
