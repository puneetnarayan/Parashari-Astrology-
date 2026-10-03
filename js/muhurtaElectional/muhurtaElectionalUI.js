/* =========================================================
   MUHURTA / ELECTIONAL TIMING — renderer.
   window.MuhurtaElectionalUI, delegating all calculation to
   window.MuhurtaElectional.
   ========================================================= */

window.MuhurtaElectionalUI = (function () {
  const UI = {};
  let initialized = false;
  let showExplain = false;
  let selectedActivity = 'general';
  let rangeDays = 30;
  let expandedDate = null;
  let lastResult = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function classBadge(classification) {
    const map = {
      'Favorable': 'pastel-green', 'Generally Favorable': 'pastel-mint',
      'Mixed - Review Factors': 'pastel-yellow', 'Classically Avoided': 'pastel-pink'
    };
    const cls = map[classification] || 'pastel-lavender';
    return `<span class="output-box ${cls}" style="padding:2px 8px;display:inline-block;">${esc(classification)}</span>`;
  }

  function renderExplainTab() {
    const body = `<ul style="font-size:0.9em;line-height:1.5;">
      <li><strong>What this tab answers:</strong> "Given that I'm doing activity X, which specific date(s) in a range I choose are traditionally more favorable for it?" It does NOT answer "when will X happen" — that is a different question this app's Timing modules answer (e.g. the Marriage Timing tab predicts when marriage is astrologically likely; this Muhurta tab assumes a marriage ceremony is already planned and scores candidate dates for the ceremony itself).</li>
      <li><strong>Why this is different from the 30+ Timing modules elsewhere in this app:</strong> Those modules analyze the native's own natal chart/Dasha over years to forecast life events. Muhurta is a day-level, Panchang-style selection practice: it looks at the Tithi, weekday, Nakshatra and daily inauspicious periods of each candidate calendar date itself, largely independent of the native's personal chart (the native's current Dasha is shown only as light background context, never as a determining factor).</li>
      <li><strong>Plain-language meaning of the factors:</strong> <em>Tithi</em> is the lunar day; certain tithis (4/9/14, "Rikta") are classically avoided for starts. <em>Nakshatra</em> is the Moon's constellation for the day; some are classically favorable, some avoided. <em>Weekday</em> carries classical planetary associations making some days more fitting per activity. <em>Rahu Kaal / Yamaganda / Gulika Kaal</em> are daily ~90-minute windows classically avoided for starting anything new — these are time-of-day cautions, not reasons to avoid the whole day.</li>
      <li><strong>Traditional guidance, not a guarantee:</strong> A "Favorable" date is traditionally considered more supportive; it never guarantees a good outcome. A "Classically Avoided" date never guarantees a bad one. This is classical electional astrology, offered for informational/traditional reference only — not legal, financial, or medical advice, including for the document-signing/contract category.</li>
      <li><strong>Known gaps (documented, not hidden):</strong> Bhadra (Vishti Karana) sub-day boundaries are not computed here. Eclipse dates are only coarsely flagged via Sun-Moon longitude proximity, never predicted precisely. Rahu Kaal/Yamaganda/Gulika use a nominal 6 AM-6 PM day window rather than true per-location sunrise/sunset. See the research notes for details.</li>
    </ul>`;
    return `<p><button id="muhurta-explain-btn" type="button" class="tab-button" style="margin-bottom:6px;">${showExplain ? 'Hide' : 'What does this tab do?'}</button></p>
      ${showExplain ? `<div class="output-box pastel-lavender">${body}</div>` : ''}`;
  }

  function renderScopeNote() {
    const activities = window.MUHURTA_ACTIVITIES || [];
    return `<div class="output-box pastel-peach" style="font-size:0.85em;">
      <strong>Scope:</strong> General, Travel, New Venture/Business, Property (Griha Pravesh/Construction), Marriage Ceremony Date, and Document Signing/Contract. Marriage here means "pick a good date for the ceremony," not "predict when marriage will happen" (see the Marriage Timing tab for that question).
    </div>`;
  }

  function renderControls() {
    const activities = window.MUHURTA_ACTIVITIES || [];
    const opts = activities.map(a => `<option value="${esc(a.id)}" ${a.id === selectedActivity ? 'selected' : ''}>${esc(a.label)}</option>`).join('');
    const activityDesc = (activities.find(a => a.id === selectedActivity) || {}).description || '';
    return `<div class="output-box pastel-lavender">
      <p><label>Activity category: <select id="muhurta-activity-select">${opts}</select></label></p>
      <p style="font-size:0.85em;color:#555;">${esc(activityDesc)}</p>
      <p><label>Scan range (days from today): <select id="muhurta-range-select">
        <option value="30" ${rangeDays === 30 ? 'selected' : ''}>Next 30 days</option>
        <option value="60" ${rangeDays === 60 ? 'selected' : ''}>Next 60 days</option>
        <option value="90" ${rangeDays === 90 ? 'selected' : ''}>Next 90 days</option>
        <option value="180" ${rangeDays === 180 ? 'selected' : ''}>Next 180 days (larger scan - may take a moment)</option>
      </select></label>
      <button id="muhurta-scan-btn" type="button" class="tab-button">Scan dates</button></p>
      ${rangeDays >= 180 ? '<p style="font-size:0.8em;color:#a66;">Larger ranges scan more days and may take noticeably longer to render; consider a narrower range first.</p>' : ''}
    </div>`;
  }

  function renderFactorList(day) {
    const rulesById = {};
    (window.MUHURTA_RULES || []).forEach(r => { rulesById[r.id] = r; });
    const rows = day.factors.map(f => {
      const rule = rulesById[f.ruleId] || {};
      return `<tr>
        <td>${esc(rule.name || f.ruleId)}</td>
        <td>${esc(f.verdict)}</td>
        <td>${esc(f.detail)}</td>
        <td style="font-size:0.8em;color:#777;">${esc(rule.provenance || '')}${rule.source ? ' — ' + esc(rule.source) : ''}</td>
      </tr>`;
    }).join('');
    return `<table class="rem-table"><thead><tr><th>Factor</th><th>Verdict</th><th>Detail</th><th>Provenance / Source</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderResultsTable(result) {
    const rows = result.days.map(day => {
      const key = day.date.toISOString().slice(0, 10);
      const expanded = expandedDate === key;
      return `<tr>
          <td>${esc(key)}</td>
          <td>${esc(day.weekday)}</td>
          <td>${esc(day.paksha)} ${esc(day.tithiInPaksha)}</td>
          <td>${esc(day.nakshatra)}</td>
          <td>${classBadge(day.classification)}</td>
          <td><button type="button" class="tab-button muhurta-expand-btn" data-date="${esc(key)}">${expanded ? 'Hide factors' : 'Show factors'}</button></td>
        </tr>
        ${expanded ? `<tr><td colspan="6">${renderFactorList(day)}</td></tr>` : ''}`;
    }).join('');
    return `<table class="rem-table"><thead><tr><th>Date</th><th>Weekday</th><th>Tithi</th><th>Nakshatra</th><th>Classification</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderSummary(result) {
    return `<div class="output-box pastel-mint">
      <p><strong>Scan summary</strong> (${esc(result.scannedDays)} day(s) scanned${result.truncated ? `, capped from ${esc(result.requestedDays)} requested — see note below` : ''}):</p>
      <ul>
        <li>Favorable: ${result.summary.favorable}</li>
        <li>Generally Favorable: ${result.summary.generallyFavorable}</li>
        <li>Mixed - Review Factors: ${result.summary.mixed}</li>
        <li>Classically Avoided: ${result.summary.avoided}</li>
      </ul>
      ${result.truncated ? '<p style="font-size:0.85em;color:#a66;">The scan range was capped at the module\'s maximum of 366 days for performance; narrow your range for full coverage of a very large window.</p>' : ''}
      <p style="font-size:0.85em;color:#777;">${esc(result.disclaimer)}</p>
    </div>`;
  }

  function attachInteractions(root) {
    const explainBtn = root.querySelector('#muhurta-explain-btn');
    if (explainBtn) explainBtn.addEventListener('click', () => { showExplain = !showExplain; UI.render(); });

    const activitySelect = root.querySelector('#muhurta-activity-select');
    if (activitySelect) activitySelect.addEventListener('change', e => { selectedActivity = e.target.value; UI.render(); });

    const rangeSelect = root.querySelector('#muhurta-range-select');
    if (rangeSelect) rangeSelect.addEventListener('change', e => { rangeDays = Number(e.target.value); UI.render(); });

    const scanBtn = root.querySelector('#muhurta-scan-btn');
    if (scanBtn) scanBtn.addEventListener('click', () => {
      const start = new Date();
      const end = new Date(start.getTime() + (rangeDays - 1) * 86400000);
      lastResult = window.MuhurtaElectional.scanRange(selectedActivity, start, end);
      expandedDate = null;
      UI.render();
    });

    root.querySelectorAll('.muhurta-expand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = btn.dataset.date;
        expandedDate = expandedDate === d ? null : d;
        UI.render();
      });
    });
  }

  UI.render = function () {
    const root = document.getElementById('tabMuhurtaElectional');
    if (!root) return;
    if (window.MuhurtaElectional && typeof window.MuhurtaElectional.init === 'function') window.MuhurtaElectional.init();

    root.innerHTML = [
      '<h2>Muhurta / Electional Timing</h2>',
      renderExplainTab(),
      renderScopeNote(),
      renderControls(),
      lastResult ? renderSummary(lastResult) : '<p style="font-size:0.9em;color:#555;">Choose an activity category and scan range, then click "Scan dates".</p>',
      lastResult ? renderResultsTable(lastResult) : ''
    ].join('');
    attachInteractions(root);
  };

  UI.init = function () { if (initialized) return; initialized = true; if (window.MuhurtaElectional) window.MuhurtaElectional.init(); };
  UI.init();
  return UI;
})();
