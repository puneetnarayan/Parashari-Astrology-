# Love & Relationship Timeline — extension notes

## Integration decision (why no new tab was created)

The spec's "Love & Relationship Timeline" module asks for sections A (overview), B
(premarital), C (during marriage), D (Attraction, Boundaries & Relationship
Complexity), E (timeline), F (evidence/provenance). Inspection of the existing
Relationship / Partnership Start Timing module
(`js/relationshipPartnershipTiming/relationshipPartnershipTimingEngine.js`) showed
it already fully implements section B's exact calculation path:

- Natal promise across 5th/7th/11th (+ supporting 1st/2nd/3rd/9th/12th, contextual
  6th/8th) — `NS.assessNatalRelationshipPattern` (lines ~89–104).
- D9 confirmation — `NS.assessD9Confirmation` (lines ~107–118).
- Dasha (MD/AD/PD) activation windows — `NS.buildRelationshipActivationMap` /
  `NS.buildCandidateWindows` (lines ~155–230).
- Venus/Jupiter transit confirmation — `NS.transitCheckAt` (lines ~232–246).
- Cross-module read-only checks against Marriage Timing, Marriage
  Separation/Divorce Timing, Business Start Timing, and Matching —
  `NS.checkCrossModules` (lines ~248–264).

Per the task's explicit instruction ("prefer integration over a redundant tab"),
this was extended in place rather than duplicated. The result:

- **No new tab, no new tab button, no new `#...-root` div.** Tab count before
  and after this change: **58** (verified live via Playwright — see Testing).
- **No new top-level `window.*` namespace.** `js/relationshipPartnershipTiming/loveRelationshipTimelineEngine.js`
  is a small IIFE that reads `window.RelationshipPartnershipTiming` (must already
  exist — it is a no-op if not) and adds new methods onto that same object:
  `buildRelationshipOverview`, `assessDuringMarriageQuality`,
  `buildDuringMarriageWindows`, `assessAttractionBoundariesComplexity`,
  `buildCombinedTimeline`, `refreshLoveRelationshipTimeline`,
  `scanForForbiddenLanguage`, `applySafetyFilter`, `applySafetyFilterToList`.
  It does not touch or redefine any existing method on that namespace.
- The UI (`relationshipPartnershipTimingUI.js`) was extended with a **focus
  selector** (Premarital / During Marriage / Attraction & Boundaries / Full
  Timeline), an "Explain this tab" toggle, a Relationship Overview section
  (A), During-Marriage section (C), Attraction/Boundaries section (D), and a
  combined timeline (E). Existing B-section rendering (`renderPromise`,
  `renderD9`, `renderCurrentDasha`, `renderWindows`) is reused unchanged and
  only gated by the focus selector.
- The tab panel heading and tab button label were updated to
  "Relationship / Partnership Start Timing & Love & Relationship Timeline" /
  "... & Love Timeline" so the expanded scope is discoverable, without
  changing the panel's `id` or the `#relpart-root` mount point.

## Existing engines/rules reused (file:line)

- `state.chart`, `state.dasha` — read via the existing module's own
  `NS.getChartData()` (engine line ~32).
- `SIGNS`, `SIGN_LORD`, `normalizeDegrees`, `detailedDignity`,
  `SHADBALA_PLANETS`, `NATURAL_BENEFICS`, `ASPECT_OFFSETS` — all consumed via
  the existing module's own helper functions (`NS.getPlanetSnapshot`,
  `NS.getHouseSnapshot`, `classifyHouse`), not re-imported directly in the
  extension file except where a fresh dignity/aspect check was needed
  (`js/relationshipPartnershipTiming/loveRelationshipTimelineEngine.js`,
  `NS.assessDuringMarriageQuality`).
- `vargaPosition` (D9) — reused via the existing `NS.assessD9Confirmation`
  (`relationshipPartnershipTimingEngine.js` lines ~107–118); the extension
  calls this existing method rather than calling `vargaPosition` again.
- `buildSubPeriods`, `findCurrentIndex` — reused via the existing
  `NS.buildRelationshipActivationMap` pattern; `NS.buildDuringMarriageWindows`
  (new) iterates `state.dasha` directly using the same MD/AD loop shape as
  the existing `NS.buildRelationshipActivationMap`
  (`relationshipPartnershipTimingEngine.js` lines ~155–175) to avoid
  recomputing anything already computed by `NS.refresh()`.
- `window.YogaEngine.detect` / `state.yogas` — **not used.** No relationship-
  themed yoga was found in `js/yogas/yogaRules.js` specific enough to this
  module's sections to reuse without inventing new interpretation; omitted
  rather than guessed.

## Jaimini / Upapada Lagna / Darakaraka — confirmed absent, not implemented

`grep -ril "upapada\|darakaraka\|chara karaka\|charakaraka" js/` returned **zero
matches** in this codebase before this change. No Jaimini calculation logic
was written for this module. This is recorded as rule
`LOVEREL-JAIMINI-PENDING-001` ("needs sourced rule review") in
`relationshipPartnershipTimingRules.js` rather than silently omitted, so a
future contributor sees explicitly that this is a known gap, not an
oversight.

## Itemized factor provenance (Sections C and D)

| Factor | Section | Provenance | Status |
|---|---|---|---|
| 7th lord dignity | C | classical | verified-existing pattern (reuses `detailedDignity`) |
| Venus placement/dignity | C | classical | verified-existing pattern |
| Jupiter aspect on 7th | C | classical | verified-existing pattern (reuses `ASPECT_OFFSETS`) |
| D9 7th-lord confirmation | C | application | reuses existing `NS.assessD9Confirmation` output directly |
| Venus–Rahu association | D | classical | standard graha-yuti principle, karaka-specific application is this module's own synthesis |
| Venus in multiple conjunctions | D | application | **needs sourced rule review** — the specific "2+ conjunctions = complexity" threshold is this module's own synthesis, not cited from a classical source |
| 7th house multiple occupants | D | classical | classical multiple-occupation-adds-complexity principle |
| Moon–Venus connection | D | classical | standard karaka combination |
| 5th–8th house link | D | application | **needs sourced rule review** — combining two classical house significations into one cross-house reading is this module's own synthesis |
| Upapada Lagna / Darakaraka / Chara Karaka | — | — | **not implemented** — needs sourced rule review and a dedicated Jaimini engine (see `LOVEREL-JAIMINI-PENDING-001`) |

## Safety mechanics specific to this extension

- `NS.scanForForbiddenLanguage` / `NS.applySafetyFilter` — a love/relationship-
  specific forbidden-pattern scanner (separate pattern list from
  `HealthRecoveryTiming`'s medical scanner, per the task's explicit
  instruction not to reuse a domain-mismatched list). Covers affair-is/was/
  will-happen phrasing, infidelity percentage/probability/score phrasing,
  and confrontation/surveillance/monitoring phrasing.
- Section D (`NS.assessAttractionBoundariesComplexity`) is structurally
  incapable of returning "Strongly Supported": the evidence-label ladder
  tops out at `Supported` (3+ of 5 factors present), by design, regardless
  of chart data — see the comment in the engine and the dedicated rule
  `LOVEREL-NOAFFAIRDETECTOR-001`.
- A single present factor in Section D can reach at most "Requires Careful
  Interpretation" — never "Supported" or higher. Verified live: in the
  Playwright test chart (0 of 5 factors present) the evidence label was
  "Limited Evidence"; the code path additionally guarantees this holds
  structurally for any 1-factor case, not just this one data point.
- Section C's 8th/12th-house notes are rendered as clearly-labelled
  "contextual only" text and are excluded from the `qualityLabel`
  computation (see `contextualNotes` vs `factors` in
  `NS.assessDuringMarriageQuality`).
- No percentage, score, or numeric probability appears anywhere in the new
  code (qualitative labels only, reusing the existing
  Strongly Supported/Supported/Mixed/Delayed-Conditional/Requires-Careful-
  Interpretation scale, plus a new "Limited Evidence" floor used only in
  Section D).
- Native-vs-partner chart conflation: this module only ever reads
  `state.chart` (the single loaded chart). No partner-chart input exists in
  this extension, so there is no mechanism by which a second chart could be
  silently conflated with the native's own.

## Test coverage (Playwright, chromium, served on :9000)

- Full regression click-through of all 58 tabs — tab count unchanged (not 59),
  confirming integration rather than a new tab.
- Focus selector exercised across all 4 options; verified via rendered text
  that Section D ("Attraction, Boundaries & Relationship Complexity") is
  gated to appear only under "Attraction & Boundaries" and "Full Timeline",
  and Section A ("Relationship Overview") appears under every focus.
- Expandable `<details>` evidence/rule panels (38 found) expand without
  error.
- "What does this tab do?" toggle renders the 5 required explanation points.
- Full rendered text scanned for forbidden phrasing — all matches found were
  confined to the module's own disclaimer sentences (e.g. "never...
  infidelity", "not an affair detector"); zero genuine forbidden-language
  hits.
- `node --check` passed on all 3 touched/new JS files.
- No console/page errors attributable to the new code (the only console
  error observed was a pre-existing unrelated `favicon.ico` 404).

## Known limitations

- Jaimini techniques (Upapada Lagna, Darakaraka, Chara Karaka) are not
  implemented anywhere in this app; this module omits them rather than
  approximating them.
- Two Section-D factors (Venus-multiplicity threshold, 5th–8th combined
  reading) are application-level syntheses pending a cited classical source;
  they are explicitly marked "needs sourced rule review" in the rule
  registry and should not be read as settled classical doctrine.
- The "During Marriage" windows (`NS.buildDuringMarriageWindows`) only check
  7th-house MD/AD activation; they do not yet cross-reference Antardasha-of-
  Antardasha (Pratyantardasha) granularity the way the Premarital section's
  `NS.buildCandidateWindows` does, since the quality label itself is
  dasha-independent (derived once from natal/D9 factors) — this keeps the
  During-Marriage timeline conservative rather than over-granular.
- No milestone/journal input (optional, private, user-entered relationship
  dates for retrospective comparison) was added in this pass — the spec
  allows it as optional, and the existing app has no generic
  private-notes-per-chart storage primitive to reuse without inventing new
  persistent storage, which was explicitly out of scope (no Supabase/new
  storage). This is left as a follow-up if requested.
