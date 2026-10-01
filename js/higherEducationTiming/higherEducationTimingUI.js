/* =========================================================
   HIGHER EDUCATION / DEGREE TIMING — rendering layer only.
   Consumes window.HigherEducationTiming (engine) and renders into
   #edu-root. Uses this app's EXISTING shared UI conventions
   (output-box/pastel-* panels, .rem-table, quality-good/neutral/bad
   coloring, avp-calc expandable details) — same visual language as
   every other timing tab.
   Namespaced as window.HigherEducationTimingUI.
   ========================================================= */

window.HigherEducationTimingUI = (function () {
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
      <h3 id="edu-sec-promise">Natal Education Promise (D1)</h3>
      <div class="output-box pastel-blue">
        <p><strong>Overall:</strong> ${esc(np.overall)}</p>
        <table class="rem-table">
          <thead><tr><th>House/Significator</th><th>Classification</th><th>Evidence</th></tr></thead>
          <tbody>
            ${houseRow(np.secondHouse)}${houseRow(np.thirdHouse)}${houseRow(np.fourthHouse)}${houseRow(np.fifthHouse)}${houseRow(np.sixthHouse)}${houseRow(np.ninthHouse)}${houseRow(np.tenthHouse)}${houseRow(np.eleventhHouse)}${houseRow(np.twelfthHouse)}
            ${karakaRow(np.jupiter, 'Jupiter')}${karakaRow(np.mercury, 'Mercury')}${karakaRow(np.moon, 'Moon')}${karakaRow(np.sun, 'Sun')}${karakaRow(np.venus, 'Venus')}${karakaRow(np.saturn, 'Saturn')}
          </tbody>
        </table>
        <p style="font-size:0.85em;color:#777;">A strong education promise does not mean a particular degree occurs at a particular time — see Candidate Windows below. The 6th house is never automatically read as negative; Saturn is never automatically read as failure.</p>
      </div>
      <h4 id="edu-sec-signature">Higher Education / Admission / Examination / Completion Signatures</h4>
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
        <p style="font-size:0.85em;color:#777;">No single combination is treated as a guaranteed academic outcome — see Candidate Windows below.</p>
      </div>`;
  }

  function renderEducationType(r) {
    const e = r.educationType;
    return `
      <h3 id="edu-sec-type">Education Type Classification</h3>
      <div class="output-box pastel-lavender">
        <p>${e.types.map(t => badge(t)).join(' ')}</p>
        <p style="font-size:0.85em;color:#777;">${esc(e.note)}</p>
      </div>`;
  }

  function renderD24(r) {
    const d24 = r.d24Confirmation;
    if (!d24.available) return `<h3 id="edu-sec-d24">D24 (Chaturvimshamsha) Confirmation</h3><p style="color:#a33;">D24 confirmation is unavailable for this chart.</p>`;
    return `
      <h3 id="edu-sec-d24">D24 (Chaturvimshamsha) Confirmation</h3>
      <div class="output-box pastel-yellow">
        <p><strong>${esc(d24.level)}</strong></p>
        <table class="rem-table">
          <tr><td>D24 Ascendant</td><td>${esc(d24.d24.ascendantSign)} (lord ${esc(d24.d24.lagnaLord)})</td></tr>
          <tr><td>D24 4th</td><td>${esc(d24.d24.fourthSign)} (lord ${esc(d24.d24.fourthLord)})</td></tr>
          <tr><td>D24 5th</td><td>${esc(d24.d24.fifthSign)} (lord ${esc(d24.d24.fifthLord)})</td></tr>
          <tr><td>D24 9th</td><td>${esc(d24.d24.ninthSign)} (lord ${esc(d24.d24.ninthLord)})</td></tr>
          <tr><td>D24 11th</td><td>${esc(d24.d24.eleventhSign)} (lord ${esc(d24.d24.eleventhLord)})</td></tr>
        </table>
        ${evidenceDetails('Why this D24 level?', d24.evidence)}
        <p style="font-size:0.85em;color:#777;">D24 confirms or qualifies D1's education promise — it never replaces D1.</p>
      </div>`;
  }

  function renderD9D10(r) {
    const d9 = r.d9Context, d10 = r.d10Context;
    return `
      <h3 id="edu-sec-d9">D9 Supporting Context (Optional)</h3>
      <div class="output-box pastel-pink">
        <p>${d9.strongCount} planet(s) in strong Navamsha dignity.</p>
        <p style="font-size:0.85em;color:#777;">${esc(d9.note)}</p>
      </div>
      <h4 id="edu-sec-d10">D10 Professional-Qualification Context (Optional)</h4>
      <div class="output-box pastel-pink">
        <p>D10 10th lord (${esc(d10.tenthLord)}): ${badge(d10.strong ? 'Strong' : 'Not strong')} in D10.</p>
        <p style="font-size:0.85em;color:#777;">${esc(d10.note)}</p>
      </div>`;
  }

  function renderCurrentDasha(r) {
    if (!r.currentDasha) return `<h3 id="edu-sec-dasha">Current / Relevant Dasha</h3><p style="color:#a33;">${r.missing.includes('Vimshottari Dasha') ? 'Higher Education Timing analysis cannot be completed because Vimshottari Dasha data is unavailable.' : 'Birth date is outside the computed Dasha cycle for "now."'}</p>`;
    const d = r.currentDasha;
    function row(label, p) { return p ? `<tr><td>${label}</td><td>${esc(p.lord)}</td><td>${fmtDate(p.startDate)} &rarr; ${fmtDate(p.endDate)}</td><td>${p.factors.relevant ? badge('Supporting') : badge('Neutral')}</td></tr>` : `<tr><td>${label}</td><td colspan="3">&mdash;</td></tr>`; }
    return `
      <h3 id="edu-sec-dasha">Current / Relevant Dasha</h3>
      <div class="output-box pastel-peach">
        <table class="rem-table">
          <thead><tr><th>Level</th><th>Lord</th><th>Dates</th><th>Education-Factor Connection</th></tr></thead>
          <tbody>${row('Mahadasha', d.mahadasha)}${row('Antardasha', d.antardasha)}${row('Pratyantardasha', d.pratyantardasha)}</tbody>
        </table>
        ${d.pratyantardasha ? evidenceDetails('PD factors', d.pratyantardasha.factors.factors.length ? d.pratyantardasha.factors.factors : ['No direct education-connection factor found for the current Pratyantardasha lord.']) : ''}
      </div>`;
  }

  function renderWindows(r) {
    if (r.missing.includes('Vimshottari Dasha')) return '';
    const horizonOptions = [1, 2, 3, 5, 10].map(y => `<option value="${y}" ${y === horizonYears ? 'selected' : ''}>${y} year${y > 1 ? 's' : ''}</option>`).join('');
    const eventTypes = ['All', 'Application', 'Admission', 'Commencement', 'Examination', 'Result', 'Completion', 'Qualification', 'Postgraduate / Advanced Education', 'Research / Doctoral Education', 'Foreign Higher Education'];
    const eventOptions = eventTypes.map(t => `<option value="${esc(t)}" ${t === eventFilter ? 'selected' : ''}>${esc(t)}</option>`).join('');
    const controls = `<p><label>Forecast Period: <select id="edu-horizon-select">${horizonOptions}</select></label> &nbsp; <label>Education Event: <select id="edu-type-select">${eventOptions}</select></label></p>`;
    if (!r.candidateWindows.length) {
      return `<h3 id="edu-sec-windows">Higher Education Windows</h3>${controls}<p style="font-size:0.9em;color:#555;">No Mahadasha/Antardasha/Pratyantardasha combination in the next ${horizonYears} year(s) showed sufficient education-activation convergence (2nd/3rd/4th/5th/6th/9th/10th/11th/12th, or D24).</p>`;
    }
    const rows = r.candidateWindows.map((w, i) => `
      <tr data-edu-window="${i}" style="cursor:pointer;" class="${qualityClass(w.qualification)}">
        <td>${fmtDate(w.startDate)} &rarr; ${fmtDate(w.endDate)}</td>
        <td>${esc(w.mahadasha)}</td><td>${esc(w.antardasha)}</td><td>${esc(w.pratyantar)}</td>
        <td>${w.activatedHouses.join(', ')}</td>
        <td>${w.d24Confirmation ? 'Yes' : 'No'}</td>
        <td>${w.transit.jupiter.active ? 'Active' : '&mdash;'}</td>
        <td>${w.transit.saturn.active ? 'Active' : '&mdash;'}</td>
        <td>${badge(w.strength.label)}</td>
        <td>${esc(w.stage.label)}</td>
        <td>${esc(w.event.label)}</td>
      </tr>`).join('');
    const detail = selectedWindowIndex !== null && r.candidateWindows[selectedWindowIndex] ? renderWindowDetail(r.candidateWindows[selectedWindowIndex]) : '<p style="font-size:0.9em;color:#555;">Click a window row above for its full calculation trace.</p>';
    return `
      <h3 id="edu-sec-windows">Higher Education Windows</h3>
      ${controls}
      <div class="output-box pastel-mint" style="overflow-x:auto;">
        <table class="rem-table">
          <thead><tr><th>Window</th><th>MD</th><th>AD</th><th>PD</th><th>Education Activation</th><th>D24</th><th>Jupiter</th><th>Saturn</th><th>Strength</th><th>Stage</th><th>Event</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <h4 id="edu-sec-detail">Detailed Calculation</h4>
      ${detail}
      ${renderTimeline(r.candidateWindows)}`;
  }

  function renderWindowDetail(w) {
    const trace = [
      'Natal Education Promise', '&darr;',
      `9th connection: ${w.ninthConnection ? 'Yes' : 'Partial/No'}`, '&darr;',
      `Mahadasha = ${w.mahadasha}`, '&darr;',
      `Antardasha = ${w.antardasha}`, '&darr;',
      `Pratyantardasha = ${w.pratyantar}`, '&darr;',
      `D24 ${w.d24Confirmation ? 'confirms' : 'does not confirm'} educational direction`, '&darr;',
      `Jupiter ${w.transit.jupiter.active ? 'supports higher-education opportunity' : 'shows no qualifying support'} (transit)`, '&darr;',
      `Saturn ${w.transit.saturn.active ? 'supports discipline/structured study' : 'shows no qualifying activation'} (transit)`, '&darr;',
      'Candidate Education Window', '&darr;',
      `Event Stage = ${w.stage.label}`, '&darr;',
      `Event Classification = ${w.event.label}`
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
        <p><strong>Rahu/Ketu (secondary):</strong> Rahu ${badge(w.transit.rahu.active ? 'Active' : 'Not active')}, Ketu ${badge(w.transit.ketu.active ? 'Active' : 'Not active')}</p>
        <p><strong>Window Strength:</strong> ${badge(w.strength.label)}</p>
        <p><strong>Event Stage:</strong> ${badge(w.stage.label)} &mdash; astrologically supportive period for this type of activity, never a guarantee of success.</p>
        <p><strong>Event Classification:</strong> ${badge(w.event.label)}</p>
        ${w.foreignCrossCheck ? `<div class="output-box pastel-yellow"><p><strong>Foreign Education:</strong> ${esc(w.foreignCrossCheck.interpretation)} (Foreign Travel Timing event: ${esc(w.foreignCrossCheck.foreignTravelEvent)})</p></div>` : ''}
        ${w.careerCrossCheck ? `<div class="output-box pastel-peach"><p><strong>Career-Linked Education:</strong> ${esc(w.careerCrossCheck.interpretation)} (${esc(w.careerCrossCheck.sourceModule)} event: ${esc(w.careerCrossCheck.careerEvent)})</p></div>` : ''}
        <details class="avp-calc"><summary>HIGHER EDUCATION TIMING TRACE</summary><p style="font-family:monospace;line-height:1.8;">${trace}</p></details>
      </div>`;
  }

  function renderTimeline(windows) {
    if (!windows.length) return '';
    const items = windows.map(w => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:160px;font-size:0.85em;">${fmtMonthYear(w.startDate)} &ndash; ${fmtMonthYear(w.endDate)}</span>
        <span class="${qualityClass(w.qualification)}" style="flex:1;padding:4px 8px;border-radius:3px;font-size:0.85em;">${esc(w.mahadasha)}/${esc(w.antardasha)}/${esc(w.pratyantar)} &mdash; ${esc(w.event.label)}</span>
      </div>`).join('');
    return `<h4 id="edu-sec-timeline">Timeline</h4><div class="output-box pastel-lavender">${items}</div>`;
  }

  function renderHistorical() {
    const typeOptions = ['Admission', 'Course Commencement', 'Major Examination', 'Result', 'Graduation', 'Professional Qualification', 'Postgraduate Admission', 'Postgraduate Completion', 'Research Milestone'].map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    const rows = historicalEvents.map((ev, i) => {
      const chart = window.HigherEducationTiming.getChartData();
      const eventDate = new Date(ev.date + 'T12:00:00Z');
      const v = chart ? window.HigherEducationTiming.validateHistoricalDate(eventDate, ev.type) : null;
      if (!v) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">No chart/dasha data.</td><td><button type="button" class="edu-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      if (!v.inRange) return `<tr><td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td colspan="8">Date is outside the computed 120-year Dasha cycle.</td><td><button type="button" class="edu-hist-remove-btn" data-idx="${i}">Remove</button></td></tr>`;
      return `
        <tr>
          <td>${esc(ev.date)}</td><td>${esc(ev.type)}</td><td>${esc(v.mahadasha)}</td><td>${v.antardasha ? esc(v.antardasha) : '&mdash;'}</td><td>${v.pratyantar ? esc(v.pratyantar) : '&mdash;'}</td>
          <td>${badge(v.fifthActivation ? 'Yes' : 'No')}</td><td>${badge(v.ninthActivation ? 'Yes' : 'No')}</td><td>${badge(v.eleventhActivation ? 'Yes' : 'No')}</td>
          <td>${esc(v.d24Level)}</td><td>${badge(v.jupiterActive ? 'Active' : 'No')}</td><td>${badge(v.saturnActive ? 'Active' : 'No')}</td>
          <td><button type="button" class="edu-hist-remove-btn" data-idx="${i}">Remove</button></td>
        </tr>`;
    }).join('');
    return `
      <h3 id="edu-sec-historical">Historical Higher Education Validation</h3>
      <div class="output-box pastel-yellow">
        <p>Enter a previous admission/commencement/examination/result/graduation date to see what the method would have shown for it — this validates the method against actual history and never changes the rules to fit the outcome.</p>
        <p><input type="date" id="edu-hist-date-input"> <select id="edu-hist-type-select">${typeOptions}</select> <button type="button" id="edu-hist-add-btn">Add Event Date</button></p>
        ${historicalEvents.length ? `<table class="rem-table" style="overflow-x:auto;"><thead><tr><th>Event Date</th><th>Event Type</th><th>MD</th><th>AD</th><th>PD</th><th>5th</th><th>9th</th><th>11th</th><th>D24</th><th>Jupiter</th><th>Saturn</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="font-size:0.9em;color:#555;">No historical dates added yet.</p>'}
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
    return `<h3 id="edu-sec-rules">Rules Used</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderLog(r) {
    const text = r.calculationLog.join('\n');
    return `<h3 id="edu-sec-log">Calculation Log</h3><div class="output-box pastel-blue"><pre style="white-space:pre-wrap;font-size:0.85em;">${esc(text)}</pre><button type="button" id="edu-copy-log-btn">Copy Calculation Log</button></div>`;
  }

  function attachInteractions(root, result) {
    const horizonSelect = root.querySelector('#edu-horizon-select');
    if (horizonSelect) horizonSelect.addEventListener('change', () => { horizonYears = Number(horizonSelect.value); selectedWindowIndex = null; UI.render(); });

    const typeSelect = root.querySelector('#edu-type-select');
    if (typeSelect) typeSelect.addEventListener('change', () => { eventFilter = typeSelect.value; selectedWindowIndex = null; UI.render(); });

    root.querySelectorAll('tr[data-edu-window]').forEach(tr => tr.addEventListener('click', () => {
      selectedWindowIndex = Number(tr.getAttribute('data-edu-window'));
      UI.render();
      const el = document.getElementById('edu-sec-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const addHistBtn = root.querySelector('#edu-hist-add-btn');
    if (addHistBtn) addHistBtn.addEventListener('click', () => {
      const val = root.querySelector('#edu-hist-date-input').value;
      const type = root.querySelector('#edu-hist-type-select').value;
      if (val) { historicalEvents.push({ date: val, type }); UI.render(); }
    });
    root.querySelectorAll('.edu-hist-remove-btn').forEach(btn => btn.addEventListener('click', () => {
      historicalEvents.splice(Number(btn.getAttribute('data-idx')), 1);
      UI.render();
    }));

    const copyBtn = root.querySelector('#edu-copy-log-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const text = result.calculationLog.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy Calculation Log'; }, 1500); });
      }
    });
  }

  UI.render = function () {
    const root = document.getElementById('edu-root');
    if (!root) return;
    const result = window.HigherEducationTiming.refresh(horizonYears, eventFilter);
    if (!result) {
      root.innerHTML = '<p style="font-size:0.9em;color:#555;">Generate a chart first (Chart &amp; Analysis tab) to see the Higher Education / Degree Timing analysis.</p>';
      return;
    }
    root.innerHTML = [
      '<p>Parashari/Vimshottari higher-education timing (no KP or Western technique). Traces the chain: <strong>Natal Education Promise &rarr; Education Type &rarr; Dasha Activation &rarr; D24 Confirmation &rarr; Transit Confirmation &rarr; Candidate Window &rarr; Academic Event Classification</strong>. 9th-house activation alone, a single transit, or a single karaka never produces an admission/examination/completion classification; examination timing is never assumed to equal result timing, and admission is never shown as a graduation window.</p>',
      renderPromise(result),
      renderEducationType(result),
      renderD24(result),
      renderD9D10(result),
      renderCurrentDasha(result),
      renderWindows(result),
      renderHistorical(),
      renderLog(result),
      renderRules(result)
    ].join('');
    attachInteractions(root, result);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.HigherEducationTiming) window.HigherEducationTiming.init(); };
  UI.init();
  return UI;
})();
