/* =========================================================
   REPORTS — tab renderer. window.ReportsUI.
   Renders #reports-root, holds checkbox state for Researcher mode,
   and drives window.ReportsEngine + window.ReportsPdfBuilder to
   produce and download a PDF. Follows the established UI conventions
   (esc(), output-box pastel classes, "What does this tab do?" button)
   from js/relationshipPartnershipTiming/relationshipPartnershipTimingUI.js
   and js/lifeTimeline/lifeTimelineUI.js.
   ========================================================= */

window.ReportsUI = (function () {
  const UI = {};
  let initialized = false;
  let reportType = 'layman'; // 'layman' | 'researcher'
  let showExplain = false;
  let selectedTopicIds = null; // null = not yet initialized (defaults to all)
  let selectedCore = null;
  let selectedSynthesis = null;
  let selectedDaily = null;
  let statusMsg = '';
  let chartStyle = 'north'; // 'north' | 'south' — controls every chart diagram this tab produces

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  const CORE_ITEMS = [
    { id: 'd1Table', label: 'D1 Chart — Full Planetary Table' },
    { id: 'divisionalCharts', label: 'Divisional Charts (D2–D60)' },
    { id: 'dashaTree', label: 'Full Vimshottari Dasha Tree (MD/AD)' },
    { id: 'currentPD', label: "Current Period's Pratyantardasha Breakdown" },
    { id: 'shadbala', label: 'Shadbala Table' },
    { id: 'ashtakavarga', label: 'Ashtakavarga' },
    { id: 'yogaReport', label: 'Full Yoga Report' }
  ];
  const SYNTHESIS_ITEMS = [
    { id: 'yogaActivation', label: 'Yoga Activation Timing (full detail)' },
    { id: 'dashaLifePhase', label: 'Dasha-Based Life Phase Analysis (full detail)' },
    { id: 'lifeTimeline', label: 'Life Timeline (full cluster data)' },
    { id: 'majorLifeTransition', label: 'Major Life Transition' }
  ];
  const DAILY_ITEMS = [
    { id: 'panchang', label: "Panchang for Today" },
    { id: 'muhurtaScan', label: 'Muhurta Scan (next 30 days, general activity)' }
  ];

  function allTopicIds() { return window.ReportsEngine.getTopics().map(t => t.id); }
  function ensureDefaults() {
    if (selectedTopicIds === null) selectedTopicIds = new Set(allTopicIds());
    if (selectedCore === null) selectedCore = new Set(CORE_ITEMS.map(i => i.id));
    if (selectedSynthesis === null) selectedSynthesis = new Set(SYNTHESIS_ITEMS.map(i => i.id));
    if (selectedDaily === null) selectedDaily = new Set(DAILY_ITEMS.map(i => i.id));
  }

  function renderExplainTab() {
    const body = `<ul style="font-size:0.9em;line-height:1.5;">
      <li><strong>What this tab does:</strong> Generates a downloadable PDF report for the currently generated chart, entirely in your browser — nothing about this native is ever sent to any external service.</li>
      <li><strong>Layman Report:</strong> A readable, reassuring, non-technical summary for the client themselves: chart snapshot, current life phase, upcoming timeline highlights, a topic-by-topic snapshot, notable yogas, Panchang for today, a glossary, and a closing disclaimer. It is a fixed structure — no module checklist.</li>
      <li><strong>Researcher Report:</strong> Full technical transparency for a practitioner/researcher — raw chart data, divisional charts, the full Dasha tree, Shadbala, Ashtakavarga, the full Yoga report, every selected timing module's complete candidate-window table and calculation trace, the synthesis modules' full detail, Panchang/Muhurta, and a methodology/limitations appendix. You choose which modules to include via the checkboxes below (all checked by default).</li>
      <li><strong>Only sections with real findings appear:</strong> a checked module with zero findings for this chart is silently omitted, never shown as an empty section or filled with a fabricated finding.</li>
      <li><strong>Shared disclaimer framing:</strong> every included module's own safety/disclaimer language is reused verbatim; nothing here guarantees any outcome, and this is not medical, legal, financial or relationship advice.</li>
    </ul>`;
    return `<p><button id="reports-explain-btn" type="button" class="tab-button" style="margin-bottom:6px;">${showExplain ? 'Hide' : 'What does this tab do?'}</button></p>
      ${showExplain ? `<div class="output-box pastel-lavender">${body}</div>` : ''}`;
  }

  function renderNativePreview(native) {
    if (!native) return `<div class="output-box pastel-peach"><p><strong>Generate a chart first</strong> on the "Chart &amp; Analysis" tab before using the Reports tab.</p></div>`;
    return `<div class="output-box pastel-mint">
      <h3>Native</h3>
      <table><tbody>
        <tr><td><strong>Name</strong></td><td>${esc(native.name)}</td></tr>
        <tr><td><strong>Sex</strong></td><td>${esc(native.sex)}</td></tr>
        <tr><td><strong>Birth Date</strong></td><td>${esc(native.birthDate || 'Unknown')}</td></tr>
        <tr><td><strong>Birth Time</strong></td><td>${esc(native.birthTime || 'Unknown')}</td></tr>
        <tr><td><strong>Birth Place</strong></td><td>${esc(native.place)}</td></tr>
        <tr><td><strong>Lat / Lon</strong></td><td>${esc(native.lat)} / ${esc(native.lon)}</td></tr>
        <tr><td><strong>Time Zone</strong></td><td>${esc(native.timezone)}</td></tr>
      </tbody></table>
    </div>`;
  }

  function renderTypeSelector() {
    return `<div class="output-box pastel-blue">
      <label><input type="radio" name="reports-type" value="layman" ${reportType === 'layman' ? 'checked' : ''}> Layman Report</label>
      &nbsp;&nbsp;
      <label><input type="radio" name="reports-type" value="researcher" ${reportType === 'researcher' ? 'checked' : ''}> Researcher Report</label>
      &nbsp;&nbsp;&nbsp;
      <label>Chart Style:
        <select id="reports-chart-style">
          <option value="north" ${chartStyle === 'north' ? 'selected' : ''}>North Indian</option>
          <option value="south" ${chartStyle === 'south' ? 'selected' : ''}>South Indian</option>
        </select>
      </label>
      <div style="font-size:0.8em;color:#666;margin-top:4px;">Controls how every chart diagram (D1, D9, and all divisional charts) is drawn in the generated PDF.</div>
    </div>`;
  }

  function checklistGroup(title, items, selectedSet, groupKey) {
    const boxes = items.map(i => `<label style="display:block;margin:2px 0;">
        <input type="checkbox" class="reports-chk" data-group="${groupKey}" data-id="${esc(i.id)}" ${selectedSet.has(i.id) ? 'checked' : ''}> ${esc(i.label)}
      </label>`).join('');
    return `<div style="margin-bottom:10px;"><strong>${esc(title)}</strong><div style="margin-left:8px;">${boxes}</div></div>`;
  }

  function renderResearcherChecklist() {
    ensureDefaults();
    const topics = window.ReportsEngine.getTopics();
    const byDomain = {};
    topics.forEach(t => { (byDomain[t.domain] = byDomain[t.domain] || []).push(t); });
    const topicGroups = Object.keys(byDomain).map(domain =>
      checklistGroup('Timing Modules — ' + domain, byDomain[domain], selectedTopicIds, 'topic')
    ).join('');
    return `<div class="output-box pastel-yellow">
      <p><button id="reports-select-all" type="button" class="tab-button">Select All</button>
      &nbsp;<button id="reports-select-none" type="button" class="tab-button">Select None</button></p>
      ${checklistGroup('Core Chart Data', CORE_ITEMS, selectedCore, 'core')}
      ${topicGroups}
      ${checklistGroup('Synthesis Modules', SYNTHESIS_ITEMS, selectedSynthesis, 'synthesis')}
      ${checklistGroup('Daily / Electional', DAILY_ITEMS, selectedDaily, 'daily')}
    </div>`;
  }

  UI.render = function () {
    const root = document.getElementById('reports-root');
    if (!root) return;
    ensureDefaults();
    const native = window.ReportsEngine.getNativeInfo();
    root.innerHTML = [
      renderExplainTab(),
      '<p>Generate a downloadable PDF report for the currently loaded native, fully client-side — no birth data ever leaves your browser.</p>',
      renderNativePreview(native),
      native ? renderTypeSelector() : '',
      native && reportType === 'researcher' ? renderResearcherChecklist() : '',
      native ? `<p><button id="reports-generate-btn" type="button" class="tab-button">Generate PDF</button></p>` : '',
      statusMsg ? `<p style="font-size:0.9em;">${esc(statusMsg)}</p>` : ''
    ].join('');
    attachInteractions(root);
  };

  function attachInteractions(root) {
    const explainBtn = document.getElementById('reports-explain-btn');
    if (explainBtn) explainBtn.addEventListener('click', () => { showExplain = !showExplain; UI.render(); });

    root.querySelectorAll('input[name="reports-type"]').forEach(r => {
      r.addEventListener('change', (e) => { reportType = e.target.value; UI.render(); });
    });

    const styleSel = document.getElementById('reports-chart-style');
    if (styleSel) styleSel.addEventListener('change', (e) => { chartStyle = e.target.value; });

    root.querySelectorAll('.reports-chk').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const group = e.target.dataset.group;
        const id = e.target.dataset.id;
        const set = group === 'topic' ? selectedTopicIds : group === 'core' ? selectedCore : group === 'synthesis' ? selectedSynthesis : selectedDaily;
        if (e.target.checked) set.add(id); else set.delete(id);
      });
    });

    const selAll = document.getElementById('reports-select-all');
    if (selAll) selAll.addEventListener('click', () => {
      selectedTopicIds = new Set(allTopicIds());
      selectedCore = new Set(CORE_ITEMS.map(i => i.id));
      selectedSynthesis = new Set(SYNTHESIS_ITEMS.map(i => i.id));
      selectedDaily = new Set(DAILY_ITEMS.map(i => i.id));
      UI.render();
    });
    const selNone = document.getElementById('reports-select-none');
    if (selNone) selNone.addEventListener('click', () => {
      selectedTopicIds = new Set(); selectedCore = new Set(); selectedSynthesis = new Set(); selectedDaily = new Set();
      UI.render();
    });

    const genBtn = document.getElementById('reports-generate-btn');
    if (genBtn) genBtn.addEventListener('click', async () => {
      try {
        statusMsg = 'Generating…';
        UI.render();
        if (reportType === 'layman') await generateLayman();
        else await generateResearcher();
        statusMsg = 'PDF generated and downloaded.';
      } catch (e) {
        console.error('Report generation failed:', e);
        statusMsg = 'Could not generate the report: ' + (e && e.message);
      }
      UI.render();
    });
  }

  function fileSafeName(s) { return String(s || 'Native').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Native'; }
  function dateStamp() { return new Date().toISOString().slice(0, 10); }

  // ---------------------------------------------------------------
  // LAYMAN assembly
  // ---------------------------------------------------------------
  async function generateLayman() {
    const E = window.ReportsEngine;
    const native = E.getNativeInfo();
    if (!native) throw new Error('Generate a chart first.');
    const chartSnapshot = E.getChartSnapshot();
    const disclaimerResults = [];

    let currentLifePhase = null;
    const dlp = E.collectDashaLifePhase();
    if (dlp.ok) {
      const parts = [];
      if (dlp.phase.mdTheme) parts.push(dlp.phase.mdTheme.narrative);
      if (dlp.phase.adTheme) parts.push(dlp.phase.adTheme.narrative);
      currentLifePhase = parts.filter(Boolean).join(' ');
    }
    const lt = E.collectLifeTimeline(3);
    if (lt.ok) {
      disclaimerResults.push({ label: 'Life Timeline', result: lt.result });
      if (lt.result.currentPhase && lt.result.currentPhase.active && lt.result.currentPhase.narrative) {
        currentLifePhase = (currentLifePhase ? currentLifePhase + ' ' : '') + lt.result.currentPhase.narrative;
      }
    }

    let timelineHighlights = [];
    if (lt.ok && lt.result.phaseClusters) {
      timelineHighlights = lt.result.phaseClusters
        .filter(p => p.endDate >= new Date())
        .slice(0, 3)
        .map(p => p.narrative || `${p.label}: ${(p.domains || []).join(', ')}`);
    }

    const topicFindings = E.collectTopicFindings(null, 5); // all topics, layman always evaluates all, next 5 years
    const topics = topicFindings.filter(f => f.ok).map(f => {
      disclaimerResults.push({ label: f.topic.label, result: f.result });
      const w = f.windows[0];
      const summary = `This chart shows at least one astrologically notable window related to ${f.topic.label.toLowerCase()} (around ${w.mahadasha || ''}${w.antardasha ? '/' + w.antardasha : ''} Dasha), shown here as a theme to reflect on rather than a guaranteed event.`;
      return { label: f.topic.label, summary, windows: f.windows };
    });

    let yogas = [];
    const ya = E.collectYogaActivation();
    if (ya.ok) {
      disclaimerResults.push({ label: 'Yoga Activation Timing', result: ya.result });
      const rows = (ya.result.rows || []).filter(r => r.present && r.activationLevel && r.activationLevel !== 'Dormant-No-Current-Activation');
      yogas = rows.slice(0, 8).map(r => ({ name: r.name, note: r.activationLevel ? `Currently classified as: ${r.activationLevel}.` : 'Present in this chart.' }));
    }

    let panchang = null;
    const pan = E.collectPanchangToday(new Date());
    if (pan.ok) {
      disclaimerResults.push({ label: 'Panchang / Daily Almanac', result: pan.result });
      panchang = [
        ['Tithi', pan.result.tithi && pan.result.tithi.name],
        ['Vara (Weekday)', pan.result.vara && pan.result.vara.name],
        ["Nakshatra of the Day", pan.result.nakshatra && pan.result.nakshatra.name],
        ['Yoga', pan.result.yoga && pan.result.yoga.name],
        ['Karana', pan.result.karana && pan.result.karana.name]
      ].filter(r => r[1]);
    }

    const disclaimers = E.collectDisclaimers(disclaimerResults);

    let d1DiagramHtml = null;
    try {
      if (state.chart && typeof renderNorthIndianChart === 'function') {
        const { planets, ascendant } = state.chart;
        d1DiagramHtml = chartStyle === 'south'
          ? renderSouthIndianChart('D1 (Rasi)', buildD1ChartData(planets))
          : renderNorthIndianChart('D1 (Rasi)', buildD1NorthIndian(planets, ascendant.longitude));
      }
    } catch (e) { d1DiagramHtml = null; }

    const content = { native, chartSnapshot, currentLifePhase, timelineHighlights, topics, yogas, panchang, glossary: E.GLOSSARY, disclaimers, chartStyle, d1DiagramHtml };
    const doc = await window.ReportsPdfBuilder.buildLaymanPdf(content);
    window.ReportsPdfBuilder.download(doc, `LaymanReport-${fileSafeName(native.name)}-${dateStamp()}.pdf`);
  }

  // ---------------------------------------------------------------
  // RESEARCHER assembly
  // ---------------------------------------------------------------
  async function generateResearcher() {
    const E = window.ReportsEngine;
    const native = E.getNativeInfo();
    if (!native) throw new Error('Generate a chart first.');
    const chartSnapshot = E.getChartSnapshot();
    const disclaimerResults = [];
    const content = { native, chartSnapshot, disclaimers: [], chartStyle };

    if (selectedCore.has('d1Table')) content.d1Table = E.getD1Table();
    if (selectedCore.has('divisionalCharts')) {
      content.divisionalCharts = E.getDivisionalCharts();
      // Full verified varga list (D1..D60, from js/divisionalCharts.js's own
      // DIVISIONAL_CHART_LIST) — the same checkbox now also drives the
      // diagram gallery, per the task's "reuse the existing checkbox" guidance.
      content.divisionalDiagramKeys = (typeof DIVISIONAL_CHART_LIST !== 'undefined') ? DIVISIONAL_CHART_LIST.slice() : ['D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60'];
    }
    if (selectedCore.has('dashaTree')) content.dashaTree = E.getDashaTree();
    if (selectedCore.has('currentPD')) content.currentPratyantardasha = E.getCurrentPratyantardasha();
    if (selectedCore.has('shadbala')) content.shadbala = E.getShadbalaTable();
    if (selectedCore.has('ashtakavarga')) content.ashtakavarga = E.getAshtakavarga();
    if (selectedCore.has('yogaReport')) content.yogaReport = E.getFullYogaReport();

    const selectedTopics = Array.from(selectedTopicIds);
    const topicFindings = selectedTopics.length ? E.collectTopicFindings(selectedTopics, 5) : [];
    content.topics = topicFindings.filter(f => f.ok).map(f => {
      disclaimerResults.push({ label: f.topic.label, result: f.result });
      return { label: f.topic.label, windows: f.windows, calculationLog: f.result.calculationLog };
    });

    if (selectedSynthesis.has('yogaActivation')) {
      const ya = E.collectYogaActivation();
      if (ya.ok) { content.yogaActivation = ya.result; disclaimerResults.push({ label: 'Yoga Activation Timing', result: ya.result }); }
    }
    if (selectedSynthesis.has('dashaLifePhase')) {
      const dlp = E.collectDashaLifePhase();
      if (dlp.ok) content.dashaLifePhase = dlp.phase;
    }
    if (selectedSynthesis.has('lifeTimeline')) {
      const lt = E.collectLifeTimeline(5);
      if (lt.ok) { content.lifeTimeline = lt.result; disclaimerResults.push({ label: 'Life Timeline', result: lt.result }); }
    }
    if (selectedSynthesis.has('majorLifeTransition')) {
      const mlt = E.collectMajorLifeTransition();
      if (mlt.ok) { content.majorLifeTransition = mlt.result; disclaimerResults.push({ label: 'Major Life Transition', result: mlt.result }); }
    }

    if (selectedDaily.has('panchang')) {
      const pan = E.collectPanchangToday(new Date());
      if (pan.ok) {
        disclaimerResults.push({ label: 'Panchang / Daily Almanac', result: pan.result });
        content.panchang = [
          ['Tithi', pan.result.tithi && pan.result.tithi.name],
          ['Vara (Weekday)', pan.result.vara && pan.result.vara.name],
          ["Nakshatra of the Day", pan.result.nakshatra && pan.result.nakshatra.name],
          ['Yoga', pan.result.yoga && pan.result.yoga.name],
          ['Karana', pan.result.karana && pan.result.karana.name]
        ].filter(r => r[1]);
      }
    }
    if (selectedDaily.has('muhurtaScan')) {
      const ms = E.collectMuhurtaScan();
      if (ms.ok) content.muhurtaScan = ms;
    }

    content.disclaimers = E.collectDisclaimers(disclaimerResults);

    const doc = await window.ReportsPdfBuilder.buildResearcherPdf(content);
    window.ReportsPdfBuilder.download(doc, `ResearcherReport-${fileSafeName(native.name)}-${dateStamp()}.pdf`);
  }

  UI.init = function () { if (initialized) return; initialized = true; };
  UI.init();
  return UI;
})();
