# Legal Matter Resolution Timing — Implementation Notes

## What was implemented

A sixteenth event-timing module, **Legal Matter Resolution Timing**, added alongside the fifteen prior modules. This is a **timing-analysis and classification tool only**: it never provides legal advice, determines legal rights, predicts a court's decision as a certainty, or replaces a qualified lawyer. Core flow: Natal Legal Factors → Dasha → Matter-Specific Houses → Transit → Stage Classification → Final Window. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **No divisional chart is used.** Per the spec's explicit Section 14 instruction, D10 is deliberately not forced into this module — legal-matter timing is not a career/profession-timing question, so reusing D10 here would misapply a professional divisional chart to an unrelated domain. This scope decision is documented and enforced via rule `LEGAL-NOD10-001`.

## Section-by-section mapping to the spec

- **Natal Legal Matter Potential (Section 9):** 2nd/3rd/4th/5th/6th/7th/8th/9th/10th/11th/12th houses plus Saturn/Jupiter/Mars/Mercury/Venus/Sun/Rahu/Ketu karakas, each classified from actual dignity, occupants, and aspects. Reports one of four descriptive states (Clearly Present / Present / Mixed / Limited Evidence) — never states a dispute is certain to occur.
- **House Relationship Signatures (Section 6):** all eleven named pairwise signatures (6-7, 6-9, 6-10, 6-11, 6-12, 7-9, 7-11, 8-9, 8-11, 9-10, 9-11) plus the 3-6-9 documents/dispute/process convergence, implemented as explicit reusable rules.
- **Natural Significators (Section 8):** Saturn/Jupiter/Mars/Mercury/Venus/Sun/Rahu/Ketu, each read contextually — no planet is treated as automatically positive or negative, interpreted strictly from house ownership, placement, relationships, dasha, and transit.
- **Vimshottari Dasha (Section 10):** MD/AD/PD lord connection to 2nd/3rd/4th/6th/7th/8th/9th/10th/11th/12th houses, with contextual (not deterministic) dasha signatures documented for Litigation/Proceedings, Court/Authority, Settlement, Resolution, and Legal Expense/Prolongation.
- **Transit (Section 12):** Jupiter over 6th/9th/10th/11th and Saturn over 6th/8th/9th/10th/12th given primary attention (Saturn never automatically negative); Rahu/Ketu strictly secondary and never alone sufficient to create a resolution window (enforced structurally — nodal activation alone never reaches the convergence threshold for a "strong candidate," verified by an automated purity check).
- **Multi-Factor Convergence (Section 14):** explicitly combines matter-type emphasis match, Jupiter transit, Saturn transit, dasha-level match count, and 6th/9th house activation — surfaced transparently in each window's reasons/cautions, never as an opaque score. D10 is explicitly excluded from this convergence (per Section 14's own instruction).
- **Matter-Specific Mode (Section 15):** an optional Matter Type selector (General/Property/Family/Financial/Employment/Business-Contract/Inheritance/Administrative-Government/Other) adjusts house emphasis only — implemented as a lookup table (`MATTER_TYPE_HOUSES`) that never manufactures evidence unsupported by the horoscope; the property (4-6-8) and inheritance (2-8-11) matter-specific convergence signatures are additionally always computed and shown regardless of the selected matter type.
- **Legal Event Stage Timeline (Section 16) + Dasha Stage Classification (Section 11):** Initiation → Proceedings → Negotiation → Settlement → Hearing/Order → Resolution/Closure → Appeal/Review → Continued/Delayed, derived from house convergence — a 6th-house activation is never automatically equated with an adverse outcome.
- **Window Classification (Section 20):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, percentage, star rating, or ranked legal outcome.
- **Legal Disclaimer (Section 18):** a compact, always-visible disclaimer card is rendered at the top of the tab on every render (including the "no chart loaded" state), using the spec's exact wording.
- **No Guarantee of Court Outcome (Section 19):** enforced as an explicit rule (`LEGAL-NOOUTCOME-001`) and verified by an automated forbidden-phrase scan covering all six example phrases from the spec ("you will win," "will definitely lose," "court will rule in your favour," "definitely be dismissed," "guaranteed settlement," "guaranteed judgment date").
- **Calculation Trace (Section 21) + Rule Provenance (Section 22) + Result UI (Section 23) + User Controls (Section 24):** six-step trace, rule-ID-tagged evidence throughout, compact summary cards, forecast-horizon (1/2/3/5/10 years), matter-type selector, minimum-support filter, and event-stage filter, matching every prior module's conventions.
- **User-Entered Historical/Current Matter (Section 17) + Historical Validation (Section 34):** historical date entry requests only a date and a stage label — no case numbers, party names, addresses, or documents are ever requested or stored, per the spec's explicit instruction.

## Deliberate scope decisions

- D10 is never used, by explicit architectural decision matching the spec's own instruction — this module relies entirely on D1 house/lord/karaka analysis, dasha, and transit.
- The Matter Type selector changes only which houses are emphasized in the dasha-activation scoring (`emphasisMatch`); it never adds a classification, rule, or window that the underlying D1 evidence does not already support.
- Historical validation deliberately accepts only a date and a generic stage label (Filing/Notice/Hearing/Negotiation/Settlement/Judgment/Resolution/Appeal) — no free-text case details field was added, to avoid inviting the entry of sensitive legal information.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 41 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- Disclaimer verified present in the rendered output on every load, including before a chart is generated.
- Engine correctness: natal potential, current dasha, 2 candidate windows generated for the test chart, non-numeric window strength and stage classification populated correctly; matter-type and forecast-horizon controls verified changing results.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero windows where Rahu/Ketu activation alone (without Jupiter/Saturn support) produced a "strong candidate" (≥4 convergence factors) classification.
- Forbidden-language scan: zero matches for any of the six explicit outcome-guarantee phrases from the spec, and zero numeric score/star-rating patterns anywhere in the rendered output.
- UI interaction: forecast-horizon selector, matter-type selector, minimum-support filter, event-stage filter, historical-date add/remove, and window-row click-to-expand trace all verified working.

## Known limitations

- Stage classification (Initiation vs. Proceedings vs. Settlement, etc.) is a fixed house-convergence heuristic; it cannot read an actual court calendar, filing status, or case docket.
- The matter-type emphasis is a simple house-list lookup; it does not distinguish finer sub-categories within, say, "Family" or "Business/Contract" matters.
- As with every prior module, this analysis is a classical-method chart indication of legal-matter timing only — it is explicitly not legal advice and does not determine legal rights or outcomes.

## Next recommended event-timing module

With sixteen event-timing modules now complete (Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, Vehicle Purchase, Retirement, Recognition/Award, Major Career Turning Point, and now Legal Matter Resolution Timing), the core life/career/legal-event timing surface is comprehensively covered. A natural next addition, if desired, would be a strictly lifestyle-framed **Health/Wellness Timing** module (never diagnosis or prognosis) following the same established architecture.
