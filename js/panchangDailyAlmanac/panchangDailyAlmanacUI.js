/* =========================================================
   PANCHANG / DAILY ALMANAC — rendering layer only. Consumes
   window.PanchangDailyAlmanac (engine) and renders into
   #panchang-root. Namespaced as window.PanchangDailyAlmanacUI.
   Not tied to the generated birth chart — this tab works from a
   date picker alone (defaults to today), since Panchang is a
   general daily almanac, not a natal calculation.
   ========================================================= */

window.PanchangDailyAlmanacUI = (function () {
  const UI = {};
  let initialized = false;
  let showExplain = false;
  let selectedDateStr = null; // 'YYYY-MM-DD', null = today

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function todayStr() { const d = new Date(); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; }
  function fmtDate(d) { return `${pad2(d.getUTCDate())}-${pad2(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`; }

  function renderExplainTab() {
    const body = `<ul style="font-size:0.9em;line-height:1.5;">
      <li><strong>What Panchang is:</strong> "Panchang" (literally "five limbs") is the classical Vedic daily almanac: five calculated quantities for any given calendar date, computed from the Sun's and Moon's positions and the weekday. It is a general-purpose daily calculation — it describes the day itself, not any individual's birth chart.</li>
      <li><strong>How this differs from other tabs in this app:</strong> The Nakshatra Interpretation tab elsewhere in this app analyzes the Moon's nakshatra <em>at birth</em>, for one specific native. This tab instead computes the Moon's nakshatra <em>for today (or any chosen date)</em>, for everyone, independent of any birth chart. Likewise, "Yoga" here means one of the 27 classical Nitya Yogas (a Sun+Moon combination for the day) — a completely different technical meaning from the "Raja/Dhana Yoga" planetary-combination sense used by the Yoga Activation Timing tab elsewhere in this app.</li>
      <li><strong>Tithi (lunar day):</strong> The angular distance between Moon and Sun, divided into 30 steps of 12deg each. Marks the lunar calendar day (Shukla Paksha = waxing fortnight, 1-15 ending at Purnima/full moon; Krishna Paksha = waning fortnight, 1-15 ending at Amavasya/new moon).</li>
      <li><strong>Vara (weekday):</strong> The ordinary calendar weekday, each classically ruled by a planet (Sunday=Sun, Monday=Moon, Tuesday=Mars, Wednesday=Mercury, Thursday=Jupiter, Friday=Venus, Saturday=Saturn).</li>
      <li><strong>Nakshatra (of the day):</strong> Which of the 27 nakshatras (lunar mansions) the Moon currently occupies, found the same way a birth nakshatra is found, just applied to today's Moon position instead of a birth-moment Moon position.</li>
      <li><strong>Yoga (Nitya Yoga):</strong> One of 27 named combinations, derived from the Sun+Moon longitude total divided into 27 equal parts. Not the same concept as a "Raja Yoga"/"Dhana Yoga" planetary-combination elsewhere in this app — same Sanskrit word, different classical meaning.</li>
      <li><strong>Karana (half-tithi):</strong> Each tithi divides into two karanas (so 60 half-tithis per synodic month), cycling through 11 named karanas (7 repeating "movable" ones, 4 "fixed" ones that occur once each per month).</li>
      <li><strong>Rahu Kaal / Yamaganda / Gulika Kaal:</strong> Traditional daily time windows considered less favorable for starting new ventures. They are shown descriptively, never as a claim that anything bad will happen during that window — see the approximation note on that section.</li>
      <li><strong>Scope:</strong> This tab is a deterministic astronomical/classical calculation for the chosen date. It is not a prediction module and does not require, or relate to, a generated birth chart.</li>
    </ul>`;
    return `<p><button id="panchang-explain-btn" type="button" class="tab-button" style="margin-bottom:6px;">${showExplain ? 'Hide' : 'What does this tab do?'}</button></p>
      ${showExplain ? `<div class="output-box pastel-lavender">${body}</div>` : ''}`;
  }

  function renderDatePicker(dateStr) {
    return `<h3 id="panchang-sec-date">Date</h3><div class="output-box pastel-blue">
      <p><label>Choose date (calculated at 12:00 UTC noon for that calendar date): <input type="date" id="panchang-date-input" value="${esc(dateStr)}"></label>
      &nbsp; <button id="panchang-today-btn" type="button" class="tab-button">Today</button></p>
      <p style="font-size:0.85em;color:#777;">This tab is independent of any generated birth chart — it always computes the general daily almanac for the date chosen above.</p>
    </div>`;
  }

  function renderTithi(t) {
    return `<h3 id="panchang-sec-tithi">1. Tithi (Lunar Day)</h3><div class="output-box pastel-mint">
      <p><strong>${esc(t.paksha)} Paksha, ${esc(t.name)}</strong> (Tithi #${t.tithiNumber1to30} of 30) &mdash; ${(t.elapsedFraction * 100).toFixed(1)}% elapsed</p>
      <details class="avp-calc"><summary>CALCULATION TRACE — Tithi</summary><p style="font-family:monospace;line-height:1.8;font-size:0.85em;">${esc(t.calcTrace)}</p></details>
    </div>`;
  }

  function renderVara(v) {
    return `<h3 id="panchang-sec-vara">2. Vara (Weekday)</h3><div class="output-box pastel-peach">
      <p><strong>${esc(v.day)}</strong> &mdash; ruled by ${esc(v.lord)}</p>
      <details class="avp-calc"><summary>CALCULATION TRACE — Vara</summary><p style="font-family:monospace;line-height:1.8;font-size:0.85em;">${esc(v.calcTrace)}</p></details>
    </div>`;
  }

  function renderNakshatra(n) {
    return `<h3 id="panchang-sec-nakshatra">3. Nakshatra of the Day (Moon's Nakshatra)</h3><div class="output-box pastel-lavender">
      <p><strong>${esc(n.name)}</strong> (pada ${n.pada}) &mdash; star lord ${esc(n.starLord)} &mdash; ${(n.elapsedFraction * 100).toFixed(1)}% elapsed</p>
      <p style="font-size:0.85em;color:#777;">This is the Moon's nakshatra for the chosen date, not any individual's birth nakshatra. See the natal Nakshatra Interpretation tab elsewhere in this app for birth-chart-specific analysis.</p>
      <details class="avp-calc"><summary>CALCULATION TRACE — Nakshatra</summary><p style="font-family:monospace;line-height:1.8;font-size:0.85em;">${esc(n.calcTrace)}</p></details>
    </div>`;
  }

  function renderYoga(y) {
    return `<h3 id="panchang-sec-yoga">4. Yoga (Nitya Yoga)</h3><div class="output-box pastel-yellow">
      <p><strong>${esc(y.name)}</strong> (Nitya Yoga #${y.index0to26 + 1} of 27) &mdash; ${(y.elapsedFraction * 100).toFixed(1)}% elapsed</p>
      <p style="font-size:0.85em;color:#a33;"><strong>Note:</strong> this is the classical Panchang "Nitya Yoga" (27-fold Sun+Moon combination), not the "Raja/Dhana Yoga" planetary-combination sense used by the Yoga Activation Timing tab elsewhere in this app.</p>
      <details class="avp-calc"><summary>CALCULATION TRACE — Yoga</summary><p style="font-family:monospace;line-height:1.8;font-size:0.85em;">${esc(y.calcTrace)}</p></details>
    </div>`;
  }

  function renderKarana(k) {
    return `<h3 id="panchang-sec-karana">5. Karana (Half-Tithi)</h3><div class="output-box pastel-blue">
      <p><strong>${esc(k.name)}</strong> (Karana #${k.karanaNumber1to60} of 60, ${k.isFixed ? 'fixed' : 'movable'}) &mdash; ${(k.elapsedFraction * 100).toFixed(1)}% elapsed</p>
      <details class="avp-calc"><summary>CALCULATION TRACE — Karana</summary><p style="font-family:monospace;line-height:1.8;font-size:0.85em;">${esc(k.calcTrace)}</p></details>
    </div>`;
  }

  function renderInauspicious(inaus) {
    return `<h3 id="panchang-sec-inauspicious">Rahu Kaal / Yamaganda / Gulika Kaal</h3><div class="output-box pastel-peach" style="border:1px solid #e0b800;">
      <table class="rem-table"><thead><tr><th>Window</th><th>Octant (of 8)</th><th>Approx. time</th></tr></thead><tbody>
        <tr><td>Rahu Kaal</td><td>${inaus.rahuKaal.octant}</td><td>${inaus.rahuKaal.start} &ndash; ${inaus.rahuKaal.end}</td></tr>
        <tr><td>Yamaganda</td><td>${inaus.yamaganda.octant}</td><td>${inaus.yamaganda.start} &ndash; ${inaus.yamaganda.end}</td></tr>
        <tr><td>Gulika Kaal</td><td>${inaus.gulikaKaal.octant}</td><td>${inaus.gulikaKaal.start} &ndash; ${inaus.gulikaKaal.end}</td></tr>
      </tbody></table>
      <p style="font-size:0.85em;color:#777;"><strong>Approximation:</strong> ${esc(inaus.basis)}</p>
      <p style="font-size:0.85em;color:#555;">These windows are traditionally considered less favorable for starting new ventures. They describe a classical convention only — never a claim that anything negative will happen during them.</p>
    </div>`;
  }

  function renderSunriseNote() {
    return `<div class="output-box pastel-yellow" style="border:1px solid #e0b800;"><p style="font-size:0.85em;"><strong>Sunrise/sunset:</strong> omitted. This app has no real astronomical sunrise/sunset calculation available to reuse, and a fabricated precise value would be worse than an honest omission. The Rahu Kaal/Yamaganda/Gulika Kaal windows above instead use a fixed 06:00-18:00 civil-day approximation, clearly labelled as such.</p></div>`;
  }

  function renderRawLongitudes(r) {
    return `<h3 id="panchang-sec-raw">Raw Longitudes Used</h3><div class="output-box pastel-mint">
      <p>Sun longitude: <strong>${r.rawLongitudes.sun.toFixed(4)}&deg;</strong> &nbsp; Moon longitude: <strong>${r.rawLongitudes.moon.toFixed(4)}&deg;</strong></p>
      <p style="font-size:0.85em;color:#777;">Computed via computeSingleLongitude('Sun'|'Moon', date) — the same ephemeris engine (js/ephemeris.js) used throughout this app, evaluated at 12:00 UTC on the chosen calendar date.</p>
    </div>`;
  }

  function renderRules() {
    const rules = window.PANCHANG_RULES || [];
    if (!rules.length) return '';
    const items = rules.map(rule => `<details class="avp-calc"><summary>${esc(rule.id)} — ${esc(rule.name)} ${rule.provenance === 'application' ? '(application synthesis)' : '(classical)'}</summary><p><strong>Category:</strong> ${esc(rule.category)}</p><p><strong>Rule:</strong> ${esc(rule.description)}</p><p><strong>Explanation:</strong> ${esc(rule.explanation)}</p><p><strong>Source:</strong> ${esc(rule.source)}</p></details>`).join('');
    return `<h3 id="panchang-sec-rules">Rule Provenance</h3><div class="output-box pastel-peach">${items}</div>`;
  }

  function renderDisclaimer(r) {
    return `<div class="output-box pastel-yellow"><p style="font-size:0.85em;"><strong>Disclaimer:</strong> ${esc(r.disclaimer)}</p></div>`;
  }

  function attachInteractions(root) {
    const dateInput = root.querySelector('#panchang-date-input');
    if (dateInput) dateInput.addEventListener('change', () => { selectedDateStr = dateInput.value || todayStr(); UI.render(); });
    const todayBtn = root.querySelector('#panchang-today-btn');
    if (todayBtn) todayBtn.addEventListener('click', () => { selectedDateStr = todayStr(); UI.render(); });
    const explainBtn = root.querySelector('#panchang-explain-btn');
    if (explainBtn) explainBtn.addEventListener('click', () => { showExplain = !showExplain; UI.render(); });
  }

  UI.render = function () {
    const root = document.getElementById('panchang-root');
    if (!root) return;
    const dateStr = selectedDateStr || todayStr();
    // Noon UTC on the chosen calendar date, consistent with how this
    // module's transit-style calculations elsewhere evaluate a single
    // representative moment for a given date.
    const dateObj = new Date(`${dateStr}T12:00:00Z`);
    const result = window.PanchangDailyAlmanac.compute(dateObj);
    root.innerHTML = [
      renderExplainTab(),
      `<p>General Vedic daily almanac (Panchang) for <strong>${fmtDate(result.date)}</strong> — the five classical "angas": Tithi, Vara, Nakshatra, Yoga, Karana. Computed purely from the chosen calendar date; independent of any generated birth chart.</p>`,
      renderDatePicker(dateStr),
      renderTithi(result.tithi), renderVara(result.vara), renderNakshatra(result.nakshatra),
      renderYoga(result.yoga), renderKarana(result.karana),
      renderInauspicious(result.inauspicious), renderSunriseNote(),
      renderRawLongitudes(result),
      renderDisclaimer(result),
      renderRules()
    ].join('');
    attachInteractions(root);
  };

  UI.init = function () { if (initialized) return; initialized = true; };
  UI.init();
  return UI;
})();
