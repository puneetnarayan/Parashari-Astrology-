/* =========================================================
   VEHICLE PURCHASE TIMING — rendering layer only. Consumes
   window.VehiclePurchaseTiming (engine) and renders into #veh-root.
   Uses this app's EXISTING shared UI conventions (output-box/
   pastel-* panels, .rem-table, quality-good/neutral/bad coloring,
   avp-calc expandable details) — same visual language as every
   other timing tab.
   Namespaced as window.VehiclePurchaseTimingUI.
   ========================================================= */

window.VehiclePurchaseTimingUI = (function () {
  const UI = {};
  let initialized = false;
  let horizonYears = 5;
  let eventFilter = 'All';
  let selectedWindowIndex = null;
  let historicalEvents = []; // { date: 'YYYY-MM-DD', type: string }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmtDate(d) { return d ? `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}` : 'N/A'; }
  function fmtMonthYear(d) { return d ? d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A'; }

  function qualityClass(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('strong') || l.includes('supporting') || l.includes('supportive') || l === 'yes') return 'quality-good';
    if (l.includes('moderate') || l === 'neutral' || l === 'candidate' || l.includes('mixed') || l.includes('conditional') || l.includes('partial')) return 'quality-neutral';
    if (l.includes('challenging') || l === 'weak' || l === 'no' || l.includes('insufficient') || l.includes('unavailable')) return 'quality-bad';
    return '';
  }
  function badge(label) { return `<span class="${qualityClass(label)}">${esc(label)}</span>`; }
  function evidenceDetails(title, items) { return `<details class="avp-calc"><summary>${esc(title)}</summary><ul>${items.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`; }

  function renderPromise(r) {
    const np = r.natalPromise;
    function houseRow(h) { return `<tr><td>${h.house}th (${esc(h.sign)}, lord ${esc(h.lord)})</td><td class="${qualityClass(h.result)}">${badge(h.result)}</td><td>${evidenceDetails('Why?', h.evidence)}</td></tr>`; }
    function karakaRow(k, label) { return `<tr><td>${esc(label)} (${esc(k.planet)})</td><td class="${qualityClass(k.result)}">${badge(k.result)}</td><td>${evidenceDetails('Why?', k.evidence)}</td></tr>`; }
    return `
      <h3 id="veh-sec-promise">Natal Vehicle Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.eighthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.venus, 'Venus')}${karakaRow(np.mars, 'Mars')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.saturn, 'Saturn')}
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">The 6th and 8th houses are never automatically read as negative; not every 12th-house connection is labeled a bad purchase; Saturn is never automatically classified as negative.</p>
      </div>
      <h4 id="veh-sec-signature">Vehicle Acquisition / Income / Loan / Professional Signatures</h4>
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
        <p style="font-size:0.85em;color:#777;">No single combination is treated as a guaranteed purchase — see Candidate Windows below.</p>
      </div>`;
  }

  function renderVehicleType(r) {
    const v = r.vehicleType, a = r.acquisitionMode;
    return `
      <h3 id="veh-sec-type">Vehicle Type &amp; Acquisition Mode</h3>
      <div class="output-box pastel-lavender">
        <p><strong>Vehicle Theme:</strong> ${v.types.map(t => badge(t)).join(' ')}</p>
        <p style="font-size:0.85em;color:#777;">${esc(v.note)}</p>
        <p><strong>Likely Acquisition Mode:</strong> ${badge(a.label)}</p>
        <p style="font-size:0.85em;color:#777;">Shown only when astrological evidence supports a reasonable classification; no exact loan amounts or EMI values are ever stated.</p>
      </div>`;
  }

  function renderD16(r) {
    const d16 = r.d16Confirmation;
    if (!d16.available) return `<h3 id="veh-sec-d16">D16 (Shodashamsha) Confirmation</h3><p style="color:#a33;">D16 confirmation is unavailable for this chart.</p>`;
    return `
      <h3 id="veh-sec-d16">D16 (Shodashamsha) Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d16.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D16 Ascendant</td><td>${esc(d16.d16.ascendantSign)} (lord ${esc(d16.d16.lagnaLord)})</td></tr>
          <tr><td>D16 4th</td><td>${esc(d16.d16.fourthSign)} (lord ${esc(d16.d16.fourthLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D16 level?', d16.evidence)}
        <p style="font-size:0.85em;color:#777;">D16 confirms or qualifies D1's vehicle promise — it never replaces D1. D4 remains associated with property and is not used as the vehicle chart (see Property cross-check in each window's detail).</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="veh-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Vehicle Purchase Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="veh-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Vehicle-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct vehicle-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const eventTypes = ['All', 'Booking', 'Financing', 'Purchase', 'Delivery', 'Registration', 'First Use', 'Replacement', 'Upgrade'];
    const eventOptions = eventTypes.map(t => `<option value="${esc(t)}" ${t === eventFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    const controls = `<p><label>Forecast Period: <select id="veh-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Vehicle Event: <select id="veh-type-select">${eventOptions}</select></label></p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="veh-sec-windows">Vehicle Purchase Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient vehicle-activation convergence (2nd/3rd/4th/6th/8th/10th/11th/12th, or D16).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-veh-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.d16Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${badge(w.strength.label)}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="veh-sec-windows">Vehicle Purchase Windows</h3>
      ${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>Vehicle Activation</th><th>D16</th><th>Jupiter</th><th>Saturn</th><th>Strength</th><th>Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="veh-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Vehicle Promise', '&darr;',
      `4th connection: ${w.fourthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D16 ${w.d16Confirmation ? 'confirms' : 'does not confirm'} vehicle/conveyance direction`, '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports acquisition' : 'shows no qualifying support'} (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'indicates durability/structure or a longer timeline' : 'shows no qualifying activation'} (transit)`, '&darr;',
      `Financing: ${w.acquisitionMode.label}`, '&darr;',
      'Candidate Vehicle Window', '&darr;',
      `Event Stage = ${w.event.label}`
    ].join('<br>');
    return `
      <div class="output-box pastel-blue">
        <p><strong>Window:</strong> ${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)} (${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)})</p>
        <p><strong>MD/AD/PD:</strong> ${esc(w.mahadasha)} / ${esc(w.antardasha)} / ${esc(w.pratyantar)}</p>
        <p><strong>Reasons:</strong></p>
        <ul>${w.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ul>
        <p><strong>Jupiter transit (window midpoint):</strong> ${esc(w.transit.jupiter.sign)}, house ${w.transit.jupiter.house} ${badge(w.transit.jupiter.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.jupiter.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Saturn transit (window midpoint):</strong> ${esc(w.transit.saturn.sign)}, house ${w.transit.saturn.house} ${badge(w.transit.saturn.active ? 'Active' : 'Not active')}</p>
        <ul>${w.transit.saturn.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <p><strong>Mars/Venus (secondary):</strong> Mars ${badge(w.transit.mars.active ? 'Active' : 'Not active')}, Venus ${badge(w.transit.venus.active ? 'Active' : 'Not active')}</p>
        <p><strong>Rahu/Ketu (contextual, secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <p><strong>Window Strength:</strong> ${badge(w.strength.label)}</p>
        <p><strong>Event Stage:</strong> ${badge(w.event.label)}</p>
        <p><strong>Likely Acquisition Mode:</strong> ${badge(w.acquisitionMode.label)}</p>
        ${w.propertyCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Property Cross-Check:</strong> ${esc(w.propertyCrossCheck.interpretation)} (Property Purchase Timing event: ${esc(w.propertyCrossCheck.propertyEvent)})</p></div>` : ''}
        <details class="avp-calc"><summary>VEHICLE PURCHASE TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="veh-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Booking', 'Loan Approval', 'Purchase', 'Delivery', 'Registration', 'First Use', 'Replacement', 'Upgrade'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.VehiclePurchaseTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.VehiclePurchaseTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">No chart/dasha data.</td><td><button type="button" class="veh-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="9">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="veh-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.fourthActivation ? 'Yes' : 'No')}</td><td>${badge(v.thirdActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d16Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="veh-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="veh-sec-historical">Historical Vehicle Purchase Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous booking/loan/purchase/delivery/registration date to see what the method would have shown for it — this validates the method against actual history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="veh-hist-date-input"> <select id="veh-hist-type-select">${typeOptions}</select> <button type="button" id="veh-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>4th</th><th>3rd</th><th>11th</th><th>D16</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="veh-sec-rules">Rules Used</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="veh-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="veh-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#veh-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    const typeSelect = root.querySelector('#veh-type-select');
    if (typeSelect) typeSelect.addEventListener('change', () => { eventFilter = typeSelect.value; selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-veh-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-veh-window'));
      UI.render();
      const el = document.getElementById('veh-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#veh-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#veh-hist-date-input').value;
      const type = root.querySelector('#veh-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.veh-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#veh-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('veh-root');
    if (!root) return;
    const result = window.VehiclePurchaseTiming.refresh(horizonYears, eventFilter);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Vehicle Purchase Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari vehicle-purchase timing (no KP or Western technique). Traces the chain: <strong>Natal Vehicle Promise &rarr; Vehicle/Transport Theme &rarr; Dasha Activation &rarr; D16 Confirmation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Vehicle Event Classification</strong>. 4th-house activation alone, a single transit, or a single karaka never produces a purchase classification; financing is never automatically interpreted as the actual purchase; no accident or safety predictions are ever generated by this module.</p>',
      renderPromise(result),
      renderVehicleType(result),
      renderD16(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.VehiclePurchaseTiming) window.VehiclePurchaseTiming.init(); };
  UI.init();
  return UI;
})();
