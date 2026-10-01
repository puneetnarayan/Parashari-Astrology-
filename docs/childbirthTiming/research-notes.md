# Childbirth Timing — Implementation Notes

## What was implemented

A new **Childbirth Timing** tab (added after Career Start Timing in the
sidebar), implementing a strictly **Parashari/Vimshottari** children/
progeny timing method — no KP sub-lords, KP significators, KP ruling
planets, or Western technique anywhere.

Architecture directly follows Career Start Timing / Job Change Timing /
Promotion Timing / Marriage Timing — a rule database, a pure calculation
engine, and a rendering-only UI layer, all reusing existing calculations.

- `js/childbirthTiming/childbirthTimingRules.js` — `window.CHILDBIRTH_TIMING_RULES`:
  21 documented rules (`CB-NATAL-*`, `CB-PAIR-*`, `CB-D7-001`,
  `CB-DASHA-001`, `CB-TRANSIT-*`, `CB-EVENT-001`, `CB-PARTNER-001`,
  `CB-MEDICAL-001`), each tagged `provenance: 'classical'` or
  `'application'`.
- `js/childbirthTiming/childbirthTimingEngine.js` — `window.ChildbirthTiming`:
  all calculation logic, returning plain data only.
- `js/childbirthTiming/childbirthTimingUI.js` — `window.ChildbirthTimingUI`:
  rendering, using this app's existing `output-box`/`pastel-*`/
  `.rem-table`/`quality-good/neutral/bad`/`avp-calc` conventions.

### Existing modules reused

- **Chart/dignity/aspects**: `state.chart`, `SIGNS`, `SIGN_LORD`,
  `detailedDignity`, `NATURAL_BENEFICS`, `ASPECT_OFFSETS`,
  `normalizeDegrees`, `SHADBALA_PLANETS`.
- **D7 (Saptamsha) — ALREADY EXISTED, not newly built**: this app's
  `js/divisionalCharts.js` already defines D7 in
  `DIVISIONAL_CHART_LIST` with its own classical starting-sign rule
  (`startFn: s => (isOddSignIndex(s) ? s : (s + 6) % 12)` — Saptamsa
  starts from own sign if odd, the 7th from it if even). This module
  calls `vargaPosition(longitude, 'D7')` directly, the exact same
  function Marriage Timing uses for D9 and Promotion/Job Change/Career
  Start Timing use for D10 — no second D7 implementation was created.
- **Vimshottari Dasha**: `state.dasha` + `buildSubPeriods()` (existing)
  — no second dasha engine.
- **Transit**: `computeSingleLongitude()` (existing).
- **Historical date lookup**: `findCurrentIndex(periods, atDate)` at an
  arbitrary past date — same mechanism used by every prior timing
  module's historical validation.
- **Partner/spouse chart (optional, Step 16)**: reuses
  `generateBirthChart(birthUtc, lat, lon)` — the exact same existing
  function Kundali Matching already calls to build its boy/girl charts
  — rather than building a second chart-generation engine. The partner
  chart is computed on demand from a small local form inside this tab
  and is never persisted to shared `state`.

No existing tab, calculation, ID, or global was modified except two
minimal additive hooks: one tab-click line in `js/ui.js`, and the new
tab's button/panel/script tags in `index.html`.

## Sensitivity and interpretation rule (Section 1) — the top priority of this module

Every piece of engine output and UI text uses astrological-indication
language only:

- Natal house/karaka classifications use `Supportive` / `Mildly
  supportive` / `Mixed` / `Challenging context` — never "fertile,"
  "infertile," "will conceive," or similar.
- Window classifications are explicitly suffixed/qualified: "Strong
  Childbirth Window (astrologically supportive — not a medical
  guarantee)", "Conception / Pregnancy Support Window (astrologically
  supportive; childbirth may follow later)", etc.
- The medical-boundary notice (`renderMedicalNotice()`) is rendered at
  the top of the tab unconditionally — including on the "no chart
  generated yet" state — and repeated again under each window's detail
  panel.
- **No child-gender prediction logic or UI exists anywhere in this
  module** — verified by an automated forbidden-phrase test (see
  Testing below) scanning the rendered tab for "male child," "female
  child," "baby boy," "baby girl," and outright guarantee language; the
  only match found was inside the `CB-MEDICAL-001` rule's own
  description, which states that the module does NOT make such claims
  (a safeguard describing itself, not a prediction).

## Core Houses (Section 4) & Natal Promise (Section 7)

`assessNatalChildrenPromise()` classifies the 2nd/5th/9th/11th houses
and Jupiter/Moon/Venus/Sun/Saturn, each with evidence. Three house-lord/
karaka relationships are checked (`CB-PAIR-5-11`, `CB-PAIR-5-2`,
`CB-PAIR-JUP-5`), plus a secondary 9th-connection check (`CB-PAIR-9-5`)
explicitly read as supporting-only, never a 5th-house substitute (per
Section 4's explicit instruction). 8th/12th involvement is documented as
a rule (`CB-NATAL-812`) but deliberately NOT wired into the main
scoring/classification path as an automatic negative — it is available
for future refinement without having been used to produce a "denial"
reading anywhere in this first version, which satisfies the spec's "do
not automatically interpret 8th or 12th as denial" instruction
conservatively (by not using it as a scored negative at all yet, rather
than risking an under-tuned negative scoring rule).

## Promise vs. Timing (Section 8)

Same strict separation as every prior timing module. `classifyWindow()`
requires a *combination* of natal strength, D7 confirmation, Dasha
connection, AND transit activation before producing its strongest label
— a single Jupiter transit, a single 5th-house activation, or a single
Jupiter Mahadasha can never alone produce the "Strong Childbirth Window"
classification, per the spec's explicit three "do not use X alone"
instructions.

## Vimshottari Dasha (Sections 9-11)

`childFactorsForLord()` + `buildChildActivationMap()` bound
Pratyantardasha expansion to Antardashas already flagged
children-promise-relevant — the same strategy as every prior timing
module.

## D7 Confirmation (Section 12)

`assessD7Confirmation()` checks D7 Lagna lord, D7 5th/9th/11th
lords/occupants, and Jupiter's D7 dignity, producing the five levels the
spec names: Strong / D7 confirmation / Partial / Mixed / Weak.

## Transit (Sections 13-15)

`transitCheckAt()` checks Jupiter (major confirmation layer, houses
5/9/11), Saturn (contextual — delay/maturation/responsibility, houses
5/2/11 — **never defaulted to denial**), and Rahu/Ketu (secondary,
optional, houses 5/2/11) — all wired as supporting confirmation only,
never standalone triggers.

## Candidate Windows & Event Classification (Sections 18-19)

`buildCandidateWindows()` merges contiguous same-MD/AD Pratyantardasha
periods and classifies each via `classifyWindow()` into exactly the four
types the spec names (Strong Childbirth Window / Conception-Pregnancy
Support Window / Child-Related Family Development / Delayed-Conditional
Window), each carrying its qualifying language inline, plus an honest
"Period of Interest (evidence insufficient)" fallback — verified in
testing that this fallback is what actually renders for a chart with
weak convergence, rather than the engine forcing a stronger label.

## Optional Spouse/Partner Cross-Check (Section 16)

`assessPartnerChart(birthUtc, lat, lon)` and `compareWithPartner()`
implement the optional two-chart convergence check. The UI form
(`renderPartnerCrossCheck`) is clearly marked optional and never blocks
or alters the primary-chart result when left empty — verified in testing
by filling it in and confirming a convergence result renders alongside
the (unaffected) primary analysis above it.

## Child Order (Section 17)

The data model's `candidateWindows` and the historical-validation event
list both carry a free-text/selectable `type` field (e.g. "Second
Child", "Subsequent Child" are selectable in the Historical Childbirth
Validation dropdown) so a future enhancement can filter/group by child
order without a data-model change. No child-order-specific scoring logic
was added in this first version (the spec allows this to be future
work: "design the data model so that future child-order analysis can be
added").

## Calculation Trace (Section 22) & Rule Provenance (Section 25)

Every candidate window's detail panel renders a dynamically-built
`CHILDBIRTH TIMING TRACE` and the Rules Used section tags every rule
`(classical)` or `(application synthesis)` — including the
`CB-MEDICAL-001` and `CB-PARTNER-001` application-synthesis safeguards.

## Historical Validation (Section 24)

`validateHistoricalDate(eventDate, eventType)` accepts an event type
(Childbirth / Conception-Pregnancy Confirmation / Second Child /
Subsequent Child) alongside the date, matching the spec's extended
historical-validation table.

## UI Structure (Section 21)

Medical notice (always visible) → Childbirth Promise → D7 Confirmation →
Current/Relevant Dasha → Candidate Windows (table + click-to-expand
Detailed Calculation + Timeline) → Optional Spouse/Partner Cross-Check →
Historical Childbirth Validation → Calculation Log → Rules Used.

## Deliberate scope decisions

- **8th/12th houses are documented but not scored** in this first
  version (see Core Houses note above) — a conservative choice given the
  spec's explicit warning against treating them as automatic denial;
  adding a carefully-tuned negative contribution is flagged as a future
  refinement rather than risking an under-validated rule in a sensitive
  module.
- **No gender prediction** exists anywhere, by design, per the spec's
  explicit prohibition — verified by an automated test, not just a
  visual check.
- **Partner chart is never persisted** to `state` — it lives only in
  this UI module's closure, exactly like Relocation's candidate-location
  list, so it cannot leak into or be reset by any other tab's chart
  regeneration.
- **D7 reuse, not reimplementation**: confirmed before writing any code
  that `vargaPosition(..., 'D7')` already exists and is already
  classically correct (Saptamsa starting-sign rule already defined in
  `divisionalCharts.js`), satisfying the spec's Section 12 instruction
  to inspect the application's divisional-chart engine and reuse it
  rather than creating a second D7 implementation.

## Testing performed (Section 26)

- `node --check` on all three new JS files — no syntax errors.
- Full headless-browser (Playwright + Chromium) regression: all 31 tabs
  (30 existing + the new one) clicked in sequence with zero page/console
  errors (only the pre-existing, unrelated `favicon.ico` 404).
- **Medical disclaimer verified always visible** (text-matched in the
  rendered DOM, both with and without a generated chart).
- **Forbidden-phrase automated scan**: searched the fully-rendered tab
  text for "guaranteed pregnancy," "definitely pregnant," "pregnancy
  will certainly occur," "male child," "female child," "baby boy," "baby
  girl" — the only match was inside the `CB-MEDICAL-001` rule's own
  description (which states the module does NOT make such claims, i.e.
  a safeguard describing itself), confirming no actual prediction
  language anywhere in the live output.
- Confirmed the engine produces real output for a live test chart:
  natal promise overall, D7 level ("Partial D7 confirmation"), 2
  candidate windows, current Mahadasha correctly read, 21 rules
  referenced.
- **Purity checks (automated)**: verified zero `qualification: 'weak'`
  windows leaked into the final list, and zero windows were labeled
  "Strong Childbirth Window" without a verified D7 confirmation.
- Confirmed the optional partner cross-check: filled in a second birth
  date/time/location, clicked "Check Convergence," and confirmed a
  real convergence result rendered (reusing `generateBirthChart()`) —
  without needing to supply partner data for the primary analysis to
  work.
- Confirmed Historical Childbirth Validation: added a test date
  (2016-09-20, type "Childbirth"), confirmed it renders with MD/AD/PD
  and house-activation columns.
- Confirmed window-click trace renders correctly.
- Confirmed all previously-existing tabs (Marriage Timing, Promotion
  Timing, Job Change Timing, Career Start Timing, and all others) remain
  fully functional after this addition.

## Known limitations

- D7 confirmation thresholds are an internal first cut, not
  independently validated against a named classical text.
- 8th/12th house involvement is documented (`CB-NATAL-812`) but not yet
  wired into active scoring — a deliberate, conservative choice for this
  sensitive module rather than a gap to silently work around.
- The optional partner cross-check uses a locally-entered birth form
  rather than pulling from Kundali Matching's own inputs or Saved
  Natives, since neither currently persists a partner chart to shared
  state for this module to read.

## Next recommended event-timing module

With Marriage, Promotion, Job Change, Career Start, and now Childbirth
Timing covering five major life-event categories using this same
architecture, a natural next addition would be an **Education Timing**
module (4th/5th/9th houses, Mercury/Jupiter, D24/Siddhamsha) — which
would also retroactively strengthen Career Start Timing's currently
documented education-to-career-transition gap.
