/* =========================================================
   MAJOR CAREER TURNING POINT TIMING — rendering layer only. Consumes
   window.CareerTurningPointTiming (engine) and renders into
   #ct-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — same visual language as
   every other timing tab.
   Namespaced as window.CareerTurningPointTimingUI.
   ========================================================= */

window.CareerTurningPointTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let minSupport = 'All';
  let eventFilter = 'All';
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes' || l === 'present' || l === 'clearly present' || l.includes('supports')) return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('unavailable') || l.includes('limited') || l === 'not prominent' || l.includes('does not')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="ct-sec-promise">Natal Career Turning-Point Potential</h3>
      <div class="output-box pastel-blue">
        <p><strong>${badge(np.potential)}</strong></p>
        ${evidenceDetails('Why this potential level?', np.reasons)}
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fifthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.seventhHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.sun, 'Sun')}${karakaRow(np.saturn, 'Saturn')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.mars, 'Mars')}${karakaRow(np.rahu, 'Rahu')}${karakaRow(np.ketu, 'Ketu')}
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">Rahu/Ketu are never treated as automatic indicators of career change — their role depends on house, lordship, conjunction, dasha, and transit context. The 12th house is never automatically negative.</p>
      </div>
      <h4 id="ct-sec-signature">Career House Relationship Signatures</h4>
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
        <p style="font-size:0.85em;color:#777;">No single relationship is treated as a guarantee of a major career transition — see Candidate Windows below.</p>
      </div>`;
  }

  function renderD10(r) {
    const d10 = r.d10Confirmation;
    if (!d10.available) return `<h3 id="ct-sec-d10">D10 Career Confirmation</h3><p style="color:#a33;">D10 confirmation is unavailable for this chart.</p>`;
    return `
      <h3 id="ct-sec-d10">D10 Career Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${badge(d10.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D10 Ascendant</td><td>${esc(d10.d10.ascendantSign)} (lord ${esc(d10.d10.lagnaLord)})</td></tr>
          <tr><td>D10 6th</td><td>${esc(d10.d10.sixthSign)} (lord ${esc(d10.d10.sixthLord)})</td></tr>
          <tr><td>D10 7th</td><td>${esc(d10.d10.seventhSign)} (lord ${esc(d10.d10.seventhLord)})</td></tr>
          <tr><td>D10 9th</td><td>${esc(d10.d10.ninthSign)} (lord ${esc(d10.d10.ninthLord)})</td></tr>
          <tr><td>D10 10th</td><td>${esc(d10.d10.tenthSign)} (lord ${esc(d10.d10.tenthLord)})</td></tr>
          <tr><td>D10 11th</td><td>${esc(d10.d10.eleventhSign)} (lord ${esc(d10.d10.eleventhLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D10 level?', d10.evidence)}
        <p style="font-size:0.85em;color:#777;">D10 is used as confirmation, not a replacement for D1 analysis.</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="ct-sec-dasha">Current Career Phase</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Major Career Turning Point analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="ct-sec-dasha">Current Career Phase</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Career-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct career-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const supportOptions = ['All', 'Moderately Supportive', 'Supportive', 'Strongly Supportive'].map(s => `<option value="${esc(s)}" ${s === minSupport ? 'selected' : ''}>${s === 'All' ? 'All' : s + '+'}</option>`).join('');
    const eventTypes = ['All', 'Role Transition', 'Career Direction Change', 'Leadership', 'Employment', 'Business', 'Foreign', 'Restart', 'Exit', 'Other'];
    const eventOptions = eventTypes.map(t => `<option value="${esc(t)}" ${t === eventFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    const controls = `<p><label>Forecast Horizon: <select id="ct-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Minimum Support: <select id="ct-support-select">${supportOptions}</select></label> &nbsp; <label>Event Type: <select id="ct-type-select">${eventOptions}</select></label></p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="ct-sec-windows">Upcoming Major Career Turning Points</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient multi-factor convergence for a major career turning point.</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-ct-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.d10Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${badge(w.strength.label)}</td>
        <td>${esc(w.careerPhase.label)}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="ct-sec-windows">Upcoming Major Career Turning Points</h3>
      ${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Period</th><th>MD</th><th>AD</th><th>PD</th><th>Houses</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th>Support</th><th>Career Phase</th><th>Classification</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="ct-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Step 1 — Natal Career Factors established', '&darr;',
      `10th connection: ${w.tenthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `Step 2 — Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `Step 3 — Houses activated: ${w.activatedHouses.join(', ')}`, '&darr;',
      `Step 4 — D10 ${w.d10Confirmation ? 'confirms' : 'does not confirm'} this candidate period`, '&darr;',
      `Step 5 — Jupiter ${w.transit.jupiter.active ? 'active' : 'not active'}, Saturn ${w.transit.saturn.active ? 'active' : 'not active'}, Rahu ${w.transit.rahu.active ? 'active (secondary)' : 'not active'}, Ketu ${w.transit.ketu.active ? 'active (secondary)' : 'not active'}`, '&darr;',
      `Step 6 — Event Classification = ${w.event.label}; Career Phase = ${w.careerPhase.label}`, '&darr;',
      `Step 7 — Window included: Strength = ${w.strength.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-blue">
        <p><strong>Period:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Classification:</strong> ${badge(w.event.label)}</p>
        <p><strong>Career Phase:</strong> ${badge(w.careerPhase.label)}</p>
        <p><strong>Support:</strong> ${badge(w.strength.label)}</p>
        <p><strong>Why this period:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        ${w.cautions.length ? `<p><strong>Cautions / mixed factors:</strong></p><ul>${w.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Rahu/Ketu (secondary only):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <div class="output-box pastel-peach">
          <p><strong>Related Career Events</strong></p>
          <table class="rem-table"><thead><tr><th>Module</th><th>Status</th><th>Event</th></tr></thead><tbody>
            ${w.relatedEvents.map(re => `<tr><td>${esc(re.label)}</td><td>${badge(re.status)}</td><td>${re.eventLabel ? esc(re.eventLabel) : '&mdash;'}</td></tr>`).join('')}
          </tbody></table>
        </div>
        <details class="avp-calc"><summary>MAJOR CAREER TURNING POINT TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="ct-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Job Change', 'Promotion', 'Business Start', 'Role Transition', 'Transfer', 'Overseas Posting', 'Retirement', 'Major Career Milestone'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.CareerTurningPointTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.CareerTurningPointTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">No chart/dasha data.</td><td><button type="button" class="ct-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="ct-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.tenthActivation ? 'Yes' : 'No')}</td><td>${badge(v.sixthActivation ? 'Yes' : 'No')}</td><td>${badge(v.ninthActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d10Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="ct-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="ct-sec-historical">Historical Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous job change/promotion/business-start/role-transition date to see what the method would have shown for it — this is empirical testing of the implementation, not proof of astrological certainty, and never alters the rules to force agreement.</p>
        <p><input type="date" id="ct-hist-date-input"> <select id="ct-hist-type-select">${typeOptions}</select> <button type="button" id="ct-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>10th</th><th>6th</th><th>9th</th><th>D10</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="ct-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="ct-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="ct-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#ct-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    const supportSelect = root.querySelector('#ct-support-select');
    if (supportSelect) supportSelect.addEventListener('change', () => { minSupport = supportSelect.value; selectedWindowIndex = null; UI.render(); });

    const typeSelect = root.querySelector('#ct-type-select');
    if (typeSelect) typeSelect.addEventListener('change', () => { eventFilter = typeSelect.value; selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-ct-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-ct-window'));
      UI.render();
      const el = document.getElementById('ct-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#ct-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#ct-hist-date-input').value;
      const type = root.querySelector('#ct-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.ct-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#ct-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('ct-root');
    if (!root) return;
    const result = window.CareerTurningPointTiming.refresh(horizonYears, minSupport, eventFilter);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Major Career Turning Point analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari major-career-turning-point timing (no KP or Western technique). This is a broader synthesis layer above Job Change / Promotion / Business Start / Retirement Timing — it never duplicates their calculations, only cross-references their own output. Traces: <strong>Natal Career Factors &rarr; Dasha Activation &rarr; D10 Confirmation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Event Classification &rarr; Career Phase</strong>. This module never guarantees outcomes, ranks periods as "best"/"worst", recommends a career choice, or infers health/lifespan reasons for a transition.</p>',
      renderPromise(result),
      renderD10(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.CareerTurningPointTiming) window.CareerTurningPointTiming.init(); };
  UI.init();
  return UI;
})();
