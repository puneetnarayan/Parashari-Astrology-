# Muhurta / Electional Timing — research notes

## What this module answers (and what it does not)

Classical Muhurta (electional astrology) answers: "Given that I am going to
do activity X, which specific date(s) in a range I choose are traditionally
more favorable for it?" It does **not** answer "when will X happen" — that
is the job of this app's many natal/Dasha-based Timing modules.

**Explicit distinction from Marriage Timing** (`js/marriageTiming/` /
`window.MarriageTiming`): that module forecasts, from the native's natal
chart and Dasha sequence, *when marriage is astrologically likely to
occur*. This module (`activityId: 'marriage'`) assumes a marriage ceremony
is already being planned and instead scores *which calendar date(s)* in a
user-chosen range are classically more favorable for the ceremony itself,
using day-level Panchang factors (Tithi, weekday, Nakshatra, daily
inauspicious periods). The two modules are never merged and neither
re-derives the other's candidate windows; this module's UI states this
distinction directly (see `renderScopeNote`/`renderExplainTab` in
`muhurtaElectionalUI.js`).

## Architecture

Three files, following the established `window.<Name>` (engine) /
`window.<Name>UI` (renderer) / `window.<NAME>_RULES` (rule registry)
convention used by the app's 59+ Timing modules:

- `js/muhurtaElectional/muhurtaElectionalRules.js` — `window.MUHURTA_RULES`
  (classical-factor registry with `{id, category, provenance, name,
  description, explanation, source}`), plus `window.MUHURTA_ACTIVITIES`,
  `window.MUHURTA_TITHI_TABLE`, `window.MUHURTA_WEEKDAY_TABLE`,
  `window.MUHURTA_NAKSHATRA_TABLE`, `window.MUHURTA_NAKSHATRA_NAMES`,
  `window.MUHURTA_FORBIDDEN_PATTERNS`.
- `js/muhurtaElectional/muhurtaElectionalEngine.js` — `window.MuhurtaElectional`,
  the day-scan engine (`evaluateDay`, `scanRange`).
- `js/muhurtaElectional/muhurtaElectionalUI.js` — `window.MuhurtaElectionalUI`,
  renders tab `tabMuhurtaElectional` (button `tabBtnMuhurtaElectional`).

Wired into `index.html` (tab button, tab panel `<div id="tabMuhurtaElectional">`,
three `<script>` tags loaded after `panchangDailyAlmanacUI.js`) and
`js/ui.js` (tab-click dispatch calling `window.MuhurtaElectionalUI.render()`).

## Exact reused components (cite file/line)

- `computeSingleLongitude('Moon'|'Sun', date)` — `js/ephemeris.js:69`
  (fallback engine) — used by `MuhurtaElectional.computeMinimalPanchang`
  for the self-contained Tithi/Nakshatra formula when the Panchang module
  is unavailable.
- `normalizeDegrees` — `js/parashariTables.js` (re-exported globally from
  `js/ephemeris.js:26`) — used for the Moon-Sun angular difference.
- `state.dasha` (global state object, `js/ui.js:21`) — read in
  `MuhurtaElectional.getDashaContext` to show the native's current
  Mahadasha/Antardasha next to each candidate date, strictly as
  **supporting context**, never as a classification input (see the
  `dasha-context-only` rule, `provenance: 'application'`).
- `window.PanchangDailyAlmanac.computeForDate(date)` — when present
  (`js/panchangDailyAlmanac/`, confirmed already implemented in this
  repo at build time), `MuhurtaElectional.getDayPanchang` defensively
  checks `typeof window.PanchangDailyAlmanac.computeForDate === 'function'`
  and reuses its Tithi/Nakshatra output instead of recomputing. If that
  call throws or returns an unexpected shape, the code falls through to
  the self-contained Moon/Sun-longitude computation rather than failing.
  **Known integration point to revisit**: once Panchang's Karana/Yoga
  output is confirmed stable, Bhadra (Vishti Karana) detection and the
  classical "Yoga of the day" factor could be added here by reading
  `PanchangDailyAlmanac`'s own Karana field, rather than this module ever
  deriving Karana boundaries itself.

## Classical factor table (with provenance)

| Factor | Provenance | Source summary |
|---|---|---|
| Rikta Tithi (4/9/14) avoidance | classical | Standard Muhurta Shastra exclusion, widely cited in Panchang reference works |
| Favorable Tithi group (2,3,5,7,10,11,13) | classical | Common favorable-tithi convention |
| Weekday (Vara) suitability per activity | classical | General weekday-planet association (Thu/Fri favored for marriage/ventures; Tue/Sat generally avoided for starts) |
| Generally favorable Nakshatra list | classical | Classical nakshatra-nature classification |
| Generally avoided Nakshatra list | classical | Classical nakshatra-nature classification |
| Marriage-specific favorable Nakshatra list | classical | Distinct, narrower classical marriage-muhurta nakshatra convention |
| Rahu Kaal / Yamaganda / Gulika Kaal avoidance | classical | Standard daily 8-part-of-daylight Panchang convention |
| Bhadra (Vishti Karana) | application (documented gap) | Not computed — see Omissions below |
| Eclipse-proximity gross flag | application | This app's own coarse Sun-Moon-longitude proximity check; the *avoidance principle itself* is classical, the detection method is this app's synthesis |
| Dasha-as-context | application | Design decision specific to this module, keeping Muhurta a day-level question rather than a multi-year Dasha question |

Full entries with `explanation`/`source` text live in
`window.MUHURTA_RULES` (`muhurtaElectionalRules.js`).

## Scope boundaries honored

- Exactly the six activity categories specified: General, Travel,
  Business/Venture, Property (Griha Pravesh/Construction), Marriage
  Ceremony Date, Document Signing/Contract. No invented categories.
- Qualitative classification only (`Favorable` / `Generally Favorable` /
  `Mixed - Review Factors` / `Classically Avoided`) — no numeric score
  anywhere in engine or UI output.
- Full calculation-trace transparency: every classified day exposes its
  full `factors` array (rule id, verdict, plain-language detail,
  provenance/source), expandable per row in the UI — never a black-box
  verdict.
- Scan range is user-selected (30/60/90/180 days from today), hard-capped
  at `MuhurtaElectional.MAX_SCAN_DAYS = 366` regardless of UI input, with
  a UI performance warning shown at the 180-day option.
- No new ephemeris, nakshatra-boundary, or Dasha engine was built —
  everything above lists the exact reused function/state.
- Language scan: `window.MUHURTA_FORBIDDEN_PATTERNS` blocks
  deterministic/guarantee phrasing; engine/UI text uses "traditionally
  considered more/less favorable" phrasing throughout, and the
  `contract` category's own description explicitly disclaims legal-advice
  framing.

## Known omissions (explicit, not hidden)

1. **Bhadra (Vishti Karana)** is not computed directly. It requires
   sub-day Karana boundary computation (a Karana is half a Tithi, ~6°
   of Moon-Sun separation), which this module treats as out of its
   bounded scope. The `bhadra-note` rule (`provenance: 'application'`)
   surfaces this as an explicit "not computed" factor in every day's
   factor list rather than silently omitting it, and recommends a manual
   Panchang cross-check. If `window.PanchangDailyAlmanac` later exposes a
   Karana field, this is the first place to wire it in (see Integration
   point above).
2. **True eclipse prediction** is explicitly out of scope per the build
   spec. Only a coarse Sun-Moon longitude-proximity flag (within 3° of
   conjunction/opposition) is implemented, clearly labeled as a prompt to
   manually cross-check an almanac, never a determination that an eclipse
   is occurring on that date.
3. **Rahu Kaal / Yamaganda / Gulika Kaal timing** uses a nominal
   6:00 AM-6:00 PM daylight window divided into 8 equal parts (the
   standard simplification used when true per-location sunrise/sunset is
   not being computed), rather than computing actual sunrise/sunset for
   the birth location via `Astronomy.SearchRiseSet` or similar. `state`
   in this app does not currently retain the generated chart's
   latitude/longitude/timezone in an easily reusable form at the point
   this module reads it, so true sunrise-based timing was judged out of
   this module's bounded scope; the approximation is disclosed in the UI
   (`inauspiciousPeriods.note`) and in the `rahu-kaal-avoid` rule's
   `explanation` field. Revisit if/when birth-location data becomes more
   directly accessible to timing modules generally.

## Verification performed

- `node --check` passed on all three new JS files.
- Playwright smoke test (chromium, local static server on port 9000):
  generated a chart, clicked every tab including the new Muhurta tab with
  zero console/page errors, exercised all six activity categories, ran a
  30-day scan, expanded factor details for multiple rows, and changed the
  scan range. See session verification log for the exact script used.
