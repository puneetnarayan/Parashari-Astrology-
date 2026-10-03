/* =========================================================
   REPORTS — jsPDF-specific layout/rendering layer. window.ReportsPdfBuilder.

   Takes the already-assembled content object from window.ReportsEngine
   (via window.ReportsUI) and turns it into a downloadable PDF, entirely
   client-side (jsPDF + jspdf-autotable, loaded as local vendored files —
   see docs/reports/research-notes.md for why these are vendored rather
   than CDN-loaded in this environment). No network call of any kind is
   made from this file.
   ========================================================= */

window.ReportsPdfBuilder = (function () {
  const NS = {};

  function getJsPDF() {
    return window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null;
  }

  function fmtDate(d) {
    if (!d) return 'Unknown';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = dt.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  function addHeading(doc, text, y) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(text, 14, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    return y + 8;
  }

  function addParagraph(doc, text, y, opts) {
    const width = (opts && opts.width) || 182;
    const lines = doc.splitTextToSize(String(text || ''), width);
    const pageHeight = doc.internal.pageSize.getHeight();
    lines.forEach(line => {
      if (y > pageHeight - 15) { doc.addPage(); y = 15; }
      doc.text(line, 14, y);
      y += 5.5;
    });
    return y + 2;
  }

  function ensureRoom(doc, y, needed) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - 15) { doc.addPage(); return 15; }
    return y;
  }

  function addTable(doc, head, body, y, title) {
    if (!body || !body.length) return y;
    y = ensureRoom(doc, y, 20);
    if (title) y = addHeading(doc, title, y);
    if (typeof doc.autoTable !== 'function') {
      // Defensive fallback if autotable failed to load — never throw.
      return addParagraph(doc, '[Table omitted — autotable plugin unavailable]', y);
    }
    doc.autoTable({ head: [head], body, startY: y, styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [90, 70, 140] }, margin: { left: 14, right: 14 } });
    return doc.lastAutoTable.finalY + 6;
  }

  // ---------------------------------------------------------------
  // Front matter — shared by both report types.
  // ---------------------------------------------------------------
  function addFrontMatter(doc, native, label) {
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Vedic Astrology Report', 14, 20);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(label, 14, 28);
    let y = 40;
    const rows = [
      ['Name', native.name],
      ['Sex', native.sex],
      ['Birth Date', native.birthDate || 'Unknown'],
      ['Birth Time', native.birthTime || 'Unknown'],
      ['Birth Place', native.place],
      ['Latitude / Longitude', `${native.lat || '—'} / ${native.lon || '—'}`],
      ['Time Zone', native.timezone],
      ['Ayanamsa / House System', 'Lahiri sidereal ayanamsa; whole-sign / Parashari house assignment (as used throughout this application)'],
      ['Report Generated On', fmtDate(native.generatedOn) + ' ' + new Date(native.generatedOn).toISOString().slice(11, 16) + ' UTC']
    ];
    y = addTable(doc, ['Field', 'Value'], rows, y);
    return y;
  }

  function addChartSnapshot(doc, snapshot, y) {
    y = addHeading(doc, 'Chart Snapshot', y);
    y = addTable(doc, ['Point', 'Sign'], [
      ['Ascendant (Lagna)', snapshot.ascendantSign],
      ['Moon Sign (Rashi)', snapshot.moonSign],
      ['Sun Sign', snapshot.sunSign]
    ], y);
    return y;
  }

  // ---------------------------------------------------------------
  // LAYMAN REPORT
  // ---------------------------------------------------------------
  NS.buildLaymanPdf = function (content) {
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error('jsPDF library is not loaded.');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = addFrontMatter(doc, content.native, 'Layman Report — a plain-language summary for the native');
    y = addChartSnapshot(doc, content.chartSnapshot, y);

    if (content.currentLifePhase) {
      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, 'Current Life Phase', y);
      y = addParagraph(doc, content.currentLifePhase, y);
    }

    if (content.timelineHighlights && content.timelineHighlights.length) {
      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, 'Life Timeline — Highlights (Next 1-3 Years)', y);
      content.timelineHighlights.forEach(h => { y = addParagraph(doc, '• ' + h, y); });
    }

    if (content.topics && content.topics.length) {
      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, 'Topic-by-Topic Snapshot', y);
      content.topics.forEach(t => {
        y = ensureRoom(doc, y, 14);
        doc.setFont(undefined, 'bold');
        doc.text(t.label, 14, y);
        doc.setFont(undefined, 'normal');
        y += 5.5;
        y = addParagraph(doc, t.summary, y);
      });
    }

    if (content.yogas && content.yogas.length) {
      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, 'Notable Yogas', y);
      content.yogas.forEach(yg => { y = addParagraph(doc, `• ${yg.name}: ${yg.note}`, y); });
    }

    if (content.panchang) {
      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, "Today's Panchang Snapshot", y);
      y = addTable(doc, ['Anga', 'Value'], content.panchang, y);
    }

    y = ensureRoom(doc, y, 20);
    y = addHeading(doc, 'Glossary', y);
    y = addTable(doc, ['Term', 'Meaning'], content.glossary.map(g => [g.term, g.def]), y);

    doc.addPage();
    y = 20;
    y = addHeading(doc, 'Disclaimer', y);
    (content.disclaimers.length ? content.disclaimers : [{ label: 'General', text: window.ReportsEngine.GENERIC_DISCLAIMER }]).forEach(d => {
      y = ensureRoom(doc, y, 14);
      doc.setFont(undefined, 'bold'); doc.text(d.label + ':', 14, y); doc.setFont(undefined, 'normal'); y += 5.5;
      y = addParagraph(doc, d.text, y);
    });

    return doc;
  };

  // ---------------------------------------------------------------
  // RESEARCHER REPORT
  // ---------------------------------------------------------------
  NS.buildResearcherPdf = function (content) {
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error('jsPDF library is not loaded.');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = addFrontMatter(doc, content.native, 'Researcher Report — full technical detail');
    y = addChartSnapshot(doc, content.chartSnapshot, y);

    if (content.d1Table) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'D1 Chart — Full Planetary Table', y);
      y = addTable(doc, ['Planet', 'Longitude', 'Sign', 'House', 'Retro', 'Combust', 'Dignity'],
        content.d1Table.map(p => [p.name, p.longitude.toFixed(2) + '°', p.sign, p.house, p.retrograde ? 'Yes' : 'No', p.combust ? 'Yes' : 'No', p.dignityTier || '—']), y);
    }

    if (content.divisionalCharts && content.divisionalCharts.length) {
      content.divisionalCharts.forEach(dv => {
        y = ensureRoom(doc, y, 30);
        y = addTable(doc, ['Planet', 'Sign'], dv.rows.map(r => [r.planet, r.sign]), y, `Divisional Chart ${dv.varga}`);
      });
    }

    if (content.dashaTree) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'Vimshottari Dasha — Full Mahadasha / Antardasha Tree', y);
      const rows = [];
      content.dashaTree.forEach(md => {
        rows.push([md.lord + ' (MD)', fmtDate(md.startDate), fmtDate(md.endDate)]);
        (md.antardashas || []).forEach(ad => rows.push(['  ' + ad.lord + ' (AD)', fmtDate(ad.startDate), fmtDate(ad.endDate)]));
      });
      y = addTable(doc, ['Period', 'Start', 'End'], rows, y);
    }

    if (content.currentPratyantardasha) {
      y = ensureRoom(doc, y, 20);
      const cp = content.currentPratyantardasha;
      y = addTable(doc, ['Pratyantardasha Lord', 'Start', 'End'],
        cp.pratyantardashas.map(p => [p.lord, fmtDate(p.startDate), fmtDate(p.endDate)]), y,
        `Current Period's Pratyantardasha Breakdown (MD ${cp.mahadasha} / AD ${cp.antardasha})`);
    }

    if (content.shadbala) {
      y = ensureRoom(doc, y, 20);
      y = addTable(doc, ['Planet', 'Total (Rupa)', 'Required (Rupa)', 'Ratio', 'Strength'],
        content.shadbala.map(s => [s.name, s.totalRupa.toFixed(2), s.requiredRupa, s.ratio.toFixed(2), s.strength]), y, 'Shadbala Table');
    }

    if (content.ashtakavarga) {
      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, 'Ashtakavarga', y);
      y = addParagraph(doc, 'Sarvashtakavarga and Bhinnashtakavarga totals as computed by this chart\'s existing Ashtakavarga engine (see the Ashtakavarga tab for the full sign-by-sign breakdown).', y);
    }

    if (content.yogaReport) {
      y = ensureRoom(doc, y, 20);
      const rows = content.yogaReport.rows.map(r => [r.name, r.present ? 'Present' : 'Absent', r.magnitude != null ? r.magnitude : '—', (r.planets || []).join(', ')]);
      y = addTable(doc, ['Yoga', 'Status', 'Magnitude', 'Planets'], rows, y, 'Full Yoga Report');
    }

    if (content.topics && content.topics.length) {
      content.topics.forEach(t => {
        doc.addPage(); y = 20;
        y = addHeading(doc, t.label + ' — Candidate Windows', y);
        y = addTable(doc, ['Mahadasha', 'Antardasha', 'Pratyantar', 'Start', 'End', 'Evidence'],
          t.windows.map(w => [w.mahadasha || '—', w.antardasha || '—', w.pratyantar || '—', fmtDate(w.startDate), fmtDate(w.endDate), (w.strength && w.strength.label) || w.qualification || '—']), y);
        if (t.calculationLog && t.calculationLog.length) {
          y = ensureRoom(doc, y, 14);
          doc.setFont(undefined, 'bold'); doc.text('Calculation trace:', 14, y); doc.setFont(undefined, 'normal'); y += 5.5;
          y = addParagraph(doc, t.calculationLog.join('  |  '), y);
        }
      });
    }

    if (content.yogaActivation) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'Yoga Activation Timing — Full Detail', y);
      y = addParagraph(doc, content.yogaActivation.disclaimer || '', y);
    }

    if (content.dashaLifePhase) {
      y = ensureRoom(doc, y, 20);
      const p = content.dashaLifePhase;
      y = addHeading(doc, 'Dasha-Based Life Phase Analysis — Current Period', y);
      y = addTable(doc, ['Level', 'Lord', 'Theme'], [
        ['Mahadasha', p.mahadasha.lord, (p.mdTheme && p.mdTheme.narrative) || '—'],
        ['Antardasha', p.antardasha ? p.antardasha.lord : '—', (p.adTheme && p.adTheme.narrative) || '—'],
        ['Pratyantardasha', p.pratyantar ? p.pratyantar.lord : '—', (p.pdTheme && p.pdTheme.narrative) || '—']
      ], y);
    }

    if (content.lifeTimeline) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'Life Timeline — Full Cluster Data', y);
      y = addTable(doc, ['Cluster', 'Start', 'End', 'Domains', 'Tier'],
        content.lifeTimeline.eventClusters.map(c => [c.label || c.id || '—', fmtDate(c.startDate), fmtDate(c.endDate), (c.domains || []).join(', '), c.tier || '—']), y);
    }

    if (content.majorLifeTransition) {
      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, 'Major Life Transition — Summary', y);
      y = addParagraph(doc, content.majorLifeTransition.disclaimer || '', y);
    }

    if (content.panchang) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'Panchang for Selected Date', y);
      y = addTable(doc, ['Anga', 'Value'], content.panchang, y);
    }

    if (content.muhurtaScan) {
      y = ensureRoom(doc, y, 20);
      y = addTable(doc, ['Date', 'Verdict', 'Score'], content.muhurtaScan.rows.map(r => [fmtDate(r.date), r.verdict || '—', r.score != null ? r.score : '—']), y,
        `Muhurta Scan (${content.muhurtaScan.activityId}, ${fmtDate(content.muhurtaScan.start)} to ${fmtDate(content.muhurtaScan.end)})`);
    }

    if (content.ruleProvenance && content.ruleProvenance.length) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'Rule Provenance Appendix', y);
      y = addTable(doc, ['ID', 'Category', 'Provenance', 'Source'],
        content.ruleProvenance.map(r => [r.id, r.category || '—', r.provenance + (r.provenance === 'needs_review' ? ' [NEEDS SOURCED RULE REVIEW]' : ''), r.source || '—']), y);
    }

    doc.addPage(); y = 20;
    y = addHeading(doc, 'Methodology & Limitations', y);
    y = addParagraph(doc, 'Ayanamsa: Lahiri sidereal. House system: whole-sign / Parashari bhava assignment (as used throughout this application). Dasha system: Vimshottari.', y);
    (content.disclaimers.length ? content.disclaimers : [{ label: 'General', text: window.ReportsEngine.GENERIC_DISCLAIMER }]).forEach(d => {
      y = ensureRoom(doc, y, 14);
      doc.setFont(undefined, 'bold'); doc.text(d.label + ':', 14, y); doc.setFont(undefined, 'normal'); y += 5.5;
      y = addParagraph(doc, d.text, y);
    });

    return doc;
  };

  NS.download = function (doc, filename) {
    doc.save(filename);
  };

  return NS;
})();
