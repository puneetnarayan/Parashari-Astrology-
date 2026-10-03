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
  // Color helpers — reuse the app's existing 3-color convention
  // (js/ui.js bavFillColor/savFillColor, '#ffdcdc'/'#fff6c9'/'#d9f2d9')
  // via autotable's documented per-cell { content, styles: { fillColor } }
  // object form (verified empirically against the vendored autotable build).
  // ---------------------------------------------------------------
  function hexToRgbArr(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return null;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }
  function coloredCell(text, hex) {
    const rgb = hex ? hexToRgbArr(hex) : null;
    return rgb ? { content: text, styles: { fillColor: rgb } } : text;
  }

  // ---------------------------------------------------------------
  // Color legend — shown once near the front of each report type.
  // ---------------------------------------------------------------
  function addColorLegend(doc, y) {
    y = ensureRoom(doc, y, 24);
    y = addHeading(doc, 'Color Key', y);
    y = addParagraph(doc, 'Shaded table cells and chart houses in this report use this application\'s existing three-color convention (the same one used on the Ashtakavarga and Bhinnashtakavarga tabs). It is a visual summary of each module\'s own existing classical scoring or wording — not a separate prediction. Green = stronger astrological support. Yellow = mixed / neutral support. Red = weaker or more mixed support for that specific placement, period, or theme.', y);
    y = addTable(doc, ['Color', 'Meaning'], [
      [coloredCell('Stronger support', window.ReportsEngine.COLOR_GREEN), 'This house/planet/period/theme has classically favorable scoring or wording.'],
      [coloredCell('Mixed / neutral', window.ReportsEngine.COLOR_YELLOW), 'Average or context-dependent — neither clearly favorable nor unfavorable.'],
      [coloredCell('Weaker / more challenging', window.ReportsEngine.COLOR_RED), 'Classically weaker scoring, or wording suggesting extra care/support is needed.']
    ], y);
    return y;
  }

  // ---------------------------------------------------------------
  // Chart diagram rasterization — html2canvas renders the EXACT SAME
  // chart HTML the Charts/Ashtakavarga/Divisional Charts tabs already
  // build via js/ui.js's renderNorthIndianChart()/renderSouthIndianChart()
  // (never a re-derived geometry), into a PNG embedded via doc.addImage().
  // Vendored locally at js/vendor/html2canvas/html2canvas.min.js — see
  // docs/reports/research-notes.md for the CDN-block/vendoring rationale
  // (same approach as jsPDF/jspdf-autotable).
  // ---------------------------------------------------------------
  function renderChartHtmlToImage(html) {
    if (typeof window.html2canvas !== 'function') return Promise.resolve(null);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.background = '#ffffff';
    container.style.padding = '6px';
    container.innerHTML = html;
    document.body.appendChild(container);
    return new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.html2canvas(container, { backgroundColor: '#ffffff', scale: 2 })
          .then(canvas => {
            let dataUrl = null;
            // JPEG at high quality — these diagrams are flat white-background
            // vector-ish renders, so JPEG's chroma/DCT loss is visually
            // negligible, but it avoids jsPDF's uncompressed PNG embedding
            // (which otherwise balloons the PDF to tens of MB per chart).
            try { dataUrl = canvas.toDataURL('image/jpeg', 0.92); } catch (e) { dataUrl = null; }
            document.body.removeChild(container);
            if (!dataUrl || dataUrl.length < 100) { resolve(null); return; }
            resolve({ dataUrl, width: canvas.width, height: canvas.height });
          })
          .catch(err => {
            console.warn('Chart rasterization failed (html2canvas):', err);
            if (container.parentNode) document.body.removeChild(container);
            resolve(null);
          });
      }));
    });
  }

  // Embeds a single chart diagram as a full-width image, with a
  // numeric-table fallback note if rasterization is unavailable/fails.
  async function addChartImage(doc, title, html, y) {
    y = ensureRoom(doc, y, 20);
    y = addHeading(doc, title, y);
    const img = await renderChartHtmlToImage(html);
    if (!img) {
      y = addParagraph(doc, 'Chart diagram unavailable — see table.', y);
      return y;
    }
    const maxWidthMm = 150;
    const maxHeightMm = 150;
    let wMm = maxWidthMm;
    let hMm = wMm * (img.height / img.width);
    if (hMm > maxHeightMm) { hMm = maxHeightMm; wMm = hMm * (img.width / img.height); }
    y = ensureRoom(doc, y, hMm + 6);
    doc.addImage(img.dataUrl, 'JPEG', 14, y, wMm, hMm);
    return y + hMm + 8;
  }

  // Builds the chart-diagram HTML for one divisional chart (D1..D60),
  // reusing the EXACT same data-builders and chart-renderer functions as
  // the Charts/Divisional Charts tabs (js/ui.js / js/parashariCharts.js /
  // js/divisionalCharts.js) — never a re-derived geometry or house mapper.
  function buildVargaChartHtml(vargaKey, chartStyle, planets, ascendant) {
    if (vargaKey === 'D1') {
      return chartStyle === 'south'
        ? renderSouthIndianChart('D1 (Rasi)', buildD1ChartData(planets))
        : renderNorthIndianChart('D1 (Rasi)', buildD1NorthIndian(planets, ascendant.longitude));
    }
    if (vargaKey === 'D9') {
      const d9 = chartStyle === 'south' ? buildD9ChartData(planets) : buildD9NorthIndian(planets, ascendant.longitude);
      return chartStyle === 'south'
        ? renderSouthIndianChart('D9 (Navamsa)', d9.bySign)
        : renderNorthIndianChart('D9 (Navamsa)', d9.byHouse);
    }
    const title = (typeof DIVISIONAL_CHART_NAMES !== 'undefined' && DIVISIONAL_CHART_NAMES[vargaKey]) || vargaKey;
    if (chartStyle === 'south') {
      const data = buildDivisionalChartData(planets, vargaKey);
      return renderSouthIndianChart(title, data.bySign);
    }
    const data = buildDivisionalNorthIndian(planets, ascendant.longitude, vargaKey);
    return renderNorthIndianChart(title, data.byHouse);
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
  NS.buildLaymanPdf = async function (content) {
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error('jsPDF library is not loaded.');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = addFrontMatter(doc, content.native, 'Layman Report — a plain-language summary for the native');
    y = addColorLegend(doc, y);
    y = addChartSnapshot(doc, content.chartSnapshot, y);

    // Single D1 diagram (North/South per the Reports tab's Chart Style
    // selector) — a simple visual snapshot, kept lean per the Layman
    // report's scope (the full divisional-chart gallery is Researcher-only).
    if (content.d1DiagramHtml) {
      y = await addChartImage(doc, 'D1 (Rasi) Chart', content.d1DiagramHtml, y);
    }

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
      y = addHeading(doc, 'Topic-by-Topic Snapshot (Timing Windows, Next 5 Years)', y);
      content.topics.forEach(t => {
        y = ensureRoom(doc, y, 14);
        doc.setFont(undefined, 'bold');
        doc.text(t.label, 14, y);
        doc.setFont(undefined, 'normal');
        y += 5.5;
        y = addParagraph(doc, t.summary, y);
        if (t.windows && t.windows.length) {
          y = addTable(doc, ['Period', 'Theme / Assessment'],
            t.windows.map(w => {
              const label = (w.strength && w.strength.label) || w.qualification || w.evidenceLabel || '—';
              return [fmtDate(w.startDate) + ' – ' + fmtDate(w.endDate), coloredCell(label, window.ReportsEngine.labelColorHex(label))];
            }), y);
        }
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
  NS.buildResearcherPdf = async function (content) {
    const jsPDF = getJsPDF();
    if (!jsPDF) throw new Error('jsPDF library is not loaded.');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = addFrontMatter(doc, content.native, 'Researcher Report — full technical detail');
    y = addColorLegend(doc, y);
    y = addChartSnapshot(doc, content.chartSnapshot, y);

    if (content.d1Table) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'D1 Chart — Full Planetary Table', y);
      y = addTable(doc, ['Planet', 'Longitude', 'Sign', 'House', 'Retro', 'Combust', 'Dignity'],
        content.d1Table.map(p => [p.name, p.longitude.toFixed(2) + '°', p.sign, p.house, p.retrograde ? 'Yes' : 'No', p.combust ? 'Yes' : 'No', p.dignityTier || '—']), y);
    }

    // All divisional chart DIAGRAMS (North/South per the Reports tab's
    // Chart Style selector), including D1 and D9, each as a full-width
    // image on its own page — built from the exact same data/render
    // functions as the Divisional Charts tab (js/ui.js, js/divisionalCharts.js).
    if (content.divisionalDiagramKeys && content.divisionalDiagramKeys.length && state.chart) {
      const { planets, ascendant } = state.chart;
      const names = (typeof DIVISIONAL_CHART_NAMES !== 'undefined') ? DIVISIONAL_CHART_NAMES : {};
      for (const key of content.divisionalDiagramKeys) {
        doc.addPage(); y = 20;
        let html = null;
        try { html = buildVargaChartHtml(key, content.chartStyle, planets, ascendant); } catch (e) { html = null; }
        const title = `Divisional Chart ${names[key] || key} Diagram`;
        if (html) {
          y = await addChartImage(doc, title, html, y);
        } else {
          y = addHeading(doc, title, y);
          y = addParagraph(doc, 'Chart diagram unavailable — see table.', y);
        }
      }
    }

    if (content.divisionalCharts && content.divisionalCharts.length) {
      content.divisionalCharts.forEach(dv => {
        y = ensureRoom(doc, y, 30);
        y = addTable(doc, ['Planet', 'Sign'], dv.rows.map(r => [r.planet, r.sign]), y, `Divisional Chart ${dv.varga} — Table`);
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
        content.shadbala.map(s => [s.name, s.totalRupa.toFixed(2), s.requiredRupa, s.ratio.toFixed(2), coloredCell(s.strength, window.ReportsEngine.labelColorHex(s.strength))]), y, 'Shadbala Table');
    }

    if (content.ashtakavarga) {
      doc.addPage(); y = 20;
      y = addHeading(doc, 'Ashtakavarga Chart — Sarvashtakavarga (SAV)', y);
      y = addParagraph(doc, 'Total bindu (benefic-point) count per sign, summed across all 7 classical planets. Signs shown Aries → Pisces. Cell colors use the same Weak(<20)/Average(20-29)/Auspicious(30+) banding as the Ashtakavarga tab (savFillColor, js/ui.js).', y);
      const signHead = ['Sign'].concat(SIGNS);
      y = addTable(doc, signHead, [['SAV Total'].concat(content.ashtakavarga.sav.map(v => coloredCell(String(v), savFillColor(v))))], y);

      if (content.chartStyle && state.chart) {
        try {
          const { planets, ascendant } = state.chart;
          const sav = content.ashtakavarga.sav;
          const html = content.chartStyle === 'south'
            ? renderSouthIndianChart('Sarvashtakavarga', buildD1ChartData(planets), sav, null,
                sign => savStrengthClass(sav[SIGNS.indexOf(sign)]), 'bav-score-circle')
            : renderNorthIndianChart('Sarvashtakavarga', buildD1NorthIndian(planets, ascendant.longitude), sav, null,
                signIndex => savFillColor(sav[signIndex]), BAV_CIRCLE_COLORS);
          y = await addChartImage(doc, 'Sarvashtakavarga Chart Diagram (colored by strength)', html, y);
        } catch (e) { /* non-fatal — table above already shown */ }
      }

      y = ensureRoom(doc, y, 20);
      y = addHeading(doc, 'Bhinnashtakavarga (BAV) — Per-Planet Bindu Grid', y);
      y = addParagraph(doc, 'Bindu count (0–8) cast by each planet onto each sign, per classical Ashtakavarga rules. Cell colors use the same Weak(0-3)/Average(4-5)/Auspicious(6-8) banding as the Bhinnashtakavarga tab (bavFillColor, js/ui.js).', y);
      const bavRows = AV_PLANETS.map(name => [name].concat((content.ashtakavarga.bav[name] || []).map(v => coloredCell(String(v), bavFillColor(v)))));
      y = addTable(doc, signHead, bavRows, y);
    }

    if (content.yogaReport) {
      y = ensureRoom(doc, y, 20);
      const rows = content.yogaReport.rows.map(r => [r.name, r.present ? 'Present' : 'Absent', r.magnitude != null ? r.magnitude : '—', (r.planets || []).join(', ')]);
      y = addTable(doc, ['Yoga', 'Status', 'Magnitude', 'Planets'], rows, y, 'Full Yoga Report');
    }

    if (content.topics && content.topics.length) {
      content.topics.forEach(t => {
        doc.addPage(); y = 20;
        y = addHeading(doc, t.label + ' — Candidate Windows (Next 5 Years)', y);
        y = addTable(doc, ['Mahadasha', 'Antardasha', 'Pratyantar', 'Start', 'End', 'Evidence'],
          t.windows.map(w => {
            const label = (w.strength && w.strength.label) || w.qualification || '—';
            return [w.mahadasha || '—', w.antardasha || '—', w.pratyantar || '—', fmtDate(w.startDate), fmtDate(w.endDate), coloredCell(label, window.ReportsEngine.labelColorHex(label))];
          }), y);
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
