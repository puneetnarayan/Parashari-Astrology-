# Panchang / Daily Almanac — Research Notes

## Scope

This module computes the classical Vedic daily almanac ("Panchang") for a
**given calendar date** — Tithi, Vara, Nakshatra-of-day, Yoga (Nitya Yoga),
Karana — plus the traditional Rahu Kaal / Yamaganda / Gulika Kaal windows.
It is deliberately **not** tied to a generated birth chart: it works from a
date picker alone (default: today), because Panchang is a general daily
calculation, not a natal one.

It is explicitly distinct from two existing modules that reuse similar
vocabulary:

- `js/nakshatra/nakshatraInterpretationEngine.js` — analyzes the Moon's
  nakshatra **at birth**, for one native. This module instead computes the
  Moon's nakshatra for **any chosen date**, for nobody in particular.
- `js/yogaActivationTiming/` — "Yoga" there means a Raja/Dhana planetary
  combination (auspicious yoga in a birth chart). "Yoga" in Panchang is a
  completely different classical concept: one of 27 fixed daily
  combinations derived from Sun+Moon longitude. The UI calls this out
  explicitly (`panchangDailyAlmanacUI.js`, `renderYoga()`) to avoid
  confusing the two.

## Architecture

Four files, following this app's established `window.<Name>` (engine) /
`window.<Name>UI` (renderer) / `window.<NAME>_RULES` (optional rule
registry) convention:

- `js/panchangDailyAlmanac/panchangDailyAlmanacEngine.js` — `window.PanchangDailyAlmanac`
- `js/panchangDailyAlmanac/panchangDailyAlmanacUI.js` — `window.PanchangDailyAlmanacUI`
- `js/panchangDailyAlmanac/panchangDailyAlmanacRules.js` — `window.PANCHANG_RULES`
- `docs/panchangDailyAlmanac/research-notes.md` — this file

Wired into `index.html` (tab button `tabBtnPanchangDailyAlmanac`, panel
`#tabPanchangDailyAlmanac` with root `<div id="panchang-root">`, and three
new `<script>` tags placed after the existing Relationship/Partnership
Timing scripts and before `js/timezone.js`/`js/ui.js`) and into
`js/ui.js`'s tab-click dispatcher (one added line calling
`window.PanchangDailyAlmanacUI.render()`).

## Components reused (never re-derived)

| Component | File | Used for |
|---|---|---|
| `computeSingleLongitude(bodyName, date)` | `js/ephemeris.js` (line ~69; Swiss-Ephemeris-backed, same engine every other transit-timing module in this app calls, e.g. `js/sadesati/sadeSatiEngine.js:66`, `js/yogaActivationTiming/yogaActivationTimingEngine.js:108`) | Sun and Moon longitude for the chosen date, evaluated at 12:00 UTC |
| `normalizeDegrees(deg)` | `js/parashariTables.js:63` | Wrapping longitude differences/sums into 0-360° |
| `nakshatraFromLongitude(longitude)` + `NAKSHATRA_TABLE` | `js/parashariTables.js:44-73` | The Moon's nakshatra-of-day, using the exact same 27×13°20′ boundary table used for natal nakshatra elsewhere in the app |
| `padaOf(longitude, nak)` | `js/parashariTables.js:76-79` | Nakshatra pada (quarter) of the day |
| `NAKSHATRAS` array | `js/parashariTables.js:32-38` | Index lookup for nakshatra-of-day |
| `renderExplainTab()` convention | `js/relationshipPartnershipTiming/relationshipPartnershipTimingUI.js:31-41` | Copied exactly: a toggle button + `pastel-lavender` output box, same CSS classes (`tab-button`, `output-box`, `avp-calc` for calculation-trace `<details>`) |
| Overall UI/engine file split and rule-provenance table convention | `js/dashaLifePhase/` (engine/UI/rules triple) | Section headings with anchor ids, `<details class="avp-calc">` calculation traces, rule registry entries with `id`/`category`/`description`/`explanation`/`source`/`provenance` |

No new ephemeris/planetary-position calculator, nakshatra-boundary table,
or sign table was written — all astronomy primitives above are reused
verbatim.

## New calculation logic (genuinely new to this module)

### 1. Tithi (lunar day)
`diff = normalizeDegrees(Moon - Sun)`; `index = floor(diff / 12)`, 0-29.
Index 0-13 → Shukla Pratipada..Chaturdashi; index 14 → Purnima; index
15-28 → Krishna Pratipada..Chaturdashi; index 29 → Amavasya. 30 named
tithis total, standard floor-division convention (tithi *n* spans
`[(n-1)*12, n*12)` degrees).

### 2. Vara (weekday)
`date.getUTCDay()` (0=Sunday..6=Saturday) mapped to the classical
planetary lord table (Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn).

### 3. Nakshatra of the day
Moon longitude run through the shared `nakshatraFromLongitude()` (same
13°20′ boundaries as natal nakshatra), returning name, pada and star lord
(Vimshottari sequence), for the Moon's position on the given date instead
of at a birth moment.

### 4. Yoga (Nitya Yoga — 27-fold, NOT Raja/Dhana Yoga)
`sum = normalizeDegrees(Moon + Sun)`; `index = floor(sum / (360/27))`,
0-26, looked up against a new 27-name table (Vishkambha..Vaidhriti). This
is the classical "Nitya Yoga" sense of the word, unrelated to the
auspicious-planetary-combination "Yoga" sense used by
`js/yogaActivationTiming/`. Clearly labelled as such in the UI.

### 5. Karana (half-tithi)
`diff = normalizeDegrees(Moon - Sun)`; `index = floor(diff / 6)`, 0-59 (2
karanas per tithi × 30 tithis = 60). Classical cyclic rule: karana #1 is
the fixed karana Kimstughna; karanas #2-57 cycle 8× through the 7 movable
karanas (Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti); karanas
#58-60 are the fixed karanas Shakuni, Chatushpada, Naga (occurring once
each, at the end of the lunar month).

### 6. Rahu Kaal / Yamaganda / Gulika Kaal
Classical fixed-fraction-of-day-length method: divide the day into 8
equal "octants" and assign each weekday a fixed octant index per anga
(three separate weekday→octant tables, one each for Rahu Kaal, Yamaganda,
Gulika Kaal). **This app has no real local sunrise/sunset calculation to
anchor the day boundary to** (see "Omitted" below), so the octant
boundaries are computed against a fixed 06:00–18:00 civil-day assumption
instead of true local sunrise/sunset. This is clearly labelled in the UI
as an approximation (`inauspicious.basis` string, rendered in a
yellow-bordered box), not presented as precise clock time.

## Omitted: real sunrise/sunset

A targeted grep (`grep -rn "sunrise\|sunset" js/`) found no existing
sunrise/sunset calculation anywhere in this codebase — the app's
ephemeris layer (`js/ephemeris.js`, `js/swissephBridge.js`) computes
planetary *longitudes*, not horizon-crossing events, and no other module
reuses or approximates one. Rather than fabricate a precise-looking
sunrise/sunset time (which would misrepresent its accuracy), this module:

- Omits a `sunrise`/`sunset` field entirely (`result.sunriseSunset =
  null` in the engine, with an explicit on-screen note explaining why).
- Uses the clearly-labelled 06:00–18:00 civil-day approximation only for
  the Rahu Kaal/Yamaganda/Gulika Kaal octant boundaries, which are a
  well-defined deterministic calculation once *some* day-length is
  assumed, and are explicitly described as approximate in the UI.

A correct implementation would need latitude/longitude plus a proper
solar-elevation/horizon calculation; this is tracked as a known gap and a
natural follow-up once (or if) a real sunrise/sunset engine is added to
the app for other modules to reuse.

## Scope boundaries / safety

- Deterministic astronomical/classical calculation — no confidence levels
  or evidentiary language (per task guidance, this is not a prediction
  module in the sense the timing modules are).
- Rahu Kaal etc. are described as "traditionally considered less
  favorable for starting new ventures," never as a claim that something
  negative will happen to the user during that window.
- `PANCHANG_RULES` is intentionally small: most of this module is pure
  index arithmetic needing no interpretive provenance. The four entries
  that exist cover genuine interpretive content (which tithis/yogas/
  karanas are traditionally considered auspicious/inauspicious for new
  beginnings), each citing "classical" provenance.

## Verification performed

- `node --check` passed on all three new JS files.
- Playwright (chromium, `/opt/pw-browsers/chromium-1194`) against
  `python3 -m http.server 9000`:
  - Tab count confirmed 59 both by `.tab-button` count and `.tab-panel`
    count (58 pre-existing + 1 new Panchang tab).
  - Generated a chart, clicked through all 59 tabs with zero new
    console/page errors (the one pre-existing `favicon.ico` 404 is
    unrelated to this module and reproduces on a vanilla page load with
    no interaction).
  - Exercised the date picker across four dates, including the real
    2026-01-18 new moon and 2025-05-12 full moon: results showed
    Amavasya at 68.7% elapsed and Purnima at 81.3% elapsed respectively
    (both evaluated at the fixed 12:00 UTC sampling instant), consistent
    with those dates' actual new-moon/full-moon timestamps falling later
    the same day.
  - Expanded the "What does this tab do?" explain panel and a
    calculation-trace `<details>` element; both rendered correctly.
- Internal consistency sanity check (Node, outside the browser):
  `diff = 180°` → tithi index 15 (boundary case, falls into tithi #16
  bucket under floor-division, as expected for an exact boundary);
  `diff = 179.9°` → tithi #15 (Purnima), `diff = 359.9°` → tithi #30
  (Amavasya). Confirms tithi 15 = Purnima spans [168°, 180°) and tithi
  30 = Amavasya spans [348°, 360°), matching the classical definition.
