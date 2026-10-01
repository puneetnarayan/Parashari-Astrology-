# Spiritual Turning Point Timing — Implementation Notes

## What was implemented

A seventeenth event-timing module, **Spiritual Turning Point Timing**, added alongside the sixteen prior modules. This is a **timing and interpretive astrology module only**: it never diagnoses mental-health conditions, claims enlightenment as fact, declares spiritual superiority, prescribes religious beliefs, tells the user which religion or guru to follow, makes deterministic claims about divine intervention, or replaces qualified medical/psychological care. Core flow: Natal Spiritual Factors → Dasha Activation → Spiritual Stage → Transit Confirmation → Final Candidate Window. Parashari/Vimshottari method only — no KP sub-lords/significators/ruling-planets, no Western technique.

## Existing modules reused (no duplication)

- **Chart/dignity primitives:** `state.chart`, `SIGNS`, `SIGN_LORD`, `detailedDignity()`, `NATURAL_BENEFICS`, `normalizeDegrees()`, `SHADBALA_PLANETS` — all from the existing chart engine.
- **Vimshottari Dasha:** `state.dasha`, `buildSubPeriods()`, `findCurrentIndex()` from `js/dasha/vimshottariDasha.js` — identical to every prior module.
- **Transit:** `computeSingleLongitude()` and `ASPECT_OFFSETS` from the existing ephemeris engine.
- **No divisional chart is forced into this module** — none of the app's existing Vargas is specifically established as a "spiritual confirmation chart" in this app's rule base, so D1 + dasha + transit alone drive the analysis, consistent with every prior module's rule of never inventing an unsupported divisional-chart role.
- **Cross-module read (not duplication):** `window.ForeignTravelTiming.refresh()` for the pilgrimage/sacred-travel cross-check — per the spec's explicit Section 16 instruction, the existing travel-timing calculation is reused directly and only a spiritual-purpose classification is added on top, never duplicating the travel calculation itself.

## Section-by-section mapping to the spec

- **Natal Spiritual Potential (Section 9):** 1st/2nd/3rd/4th/5th/8th/9th/10th/11th/12th houses plus Jupiter/Ketu/Saturn/Moon/Sun/Mercury/Venus/Rahu karakas, each classified from actual dignity, occupants, and aspects. Reports one of four descriptive states (Clearly Present / Present / Mixed / Limited Evidence) — never labels the person "spiritual" or "non-spiritual" as a personality judgment.
- **House Relationship Signatures (Section 6):** all eleven named pairwise signatures (5-9, 9-12, 8-9, 8-12, 4-12, 5-12, 9-10, 9-11, 1-9, 1-12, 4-9) plus the 3-5-9 self-initiated-study convergence, implemented as explicit reusable rules.
- **Natural Significators (Section 8):** Jupiter/Ketu/Saturn/Moon/Sun/Mercury/Venus/Rahu, each read contextually — Rahu and Ketu are explicitly never treated as automatically spiritual, interpreted strictly through house ownership, placement, relationships, dasha, and transit.
- **Vimshottari Dasha (Section 10):** MD/AD/PD lord connection to all ten spiritual-relevant houses, with contextual (not deterministic) dasha signatures documented for Spiritual Study, Meditation/Retreat, Pilgrimage, Guru/Teacher Connection, Deep Transformation, Detachment, and Spiritual Service.
- **Transit (Section 12):** Jupiter over 4th/5th/8th/9th/12th and Saturn over 4th/8th/9th/12th given primary attention (Saturn never automatically negative); Rahu/Ketu strictly secondary and structurally cannot alone create a "strong candidate" window (verified by an automated purity check).
- **Multi-Factor Convergence (Section 14):** explicitly combines Jupiter transit, Saturn transit, dasha-level match count, and 9th/12th/5th house activation — surfaced transparently in each window's reasons/cautions, never as an opaque score.
- **Spiritual Development Stage (Sections 11, 15):** Interest/Awakening → Study → Practice → Pilgrimage/Teacher → Transformation → Detachment → Service → Integration, derived from house/transit convergence — not every 12th-house dasha is automatically classified as renunciation (enforced structurally and verified by an automated purity check), and the module never claims enlightenment, liberation, or spiritual superiority.
- **Pilgrimage / Spiritual Travel (Section 16):** reads `window.ForeignTravelTiming.refresh()` directly; a period is classified Pilgrimage/Teacher only when it overlaps an actual Foreign Travel Timing window AND shows 9th/12th spiritual-house activation — never assumed from travel alone.
- **Guru / Teacher Connection (Section 17):** a contextual interpretation ("astrologically supportive period for contact with a teacher, mentor, or spiritual tradition") is shown when 9th-house or Jupiter-dasha activation is present — never identifying a specific real-world guru or telling the user whom to follow.
- **Window Classification (Section 13/23):** Strongly Supportive / Supportive / Moderately Supportive / Mixed / Conditional — never a score, percentage, star rating, or ranking.
- **Safety/Interpretive Limitations (Section 32):** enforced as an explicit rule (`SPIRIT-SAFETY-001`) and an always-visible UI disclaimer card, and verified by an automated forbidden-phrase scan covering enlightenment guarantees, spiritual-superiority claims, specific-guru endorsements, and divine-approval claims.
- **Calculation Trace (Section 20) + Rule Provenance (Section 21) + Result UI (Section 22) + User Controls (Section 23):** five-step trace, rule-ID-tagged evidence throughout, compact summary cards, forecast-horizon (1/2/3/5/10 years), minimum-support filter, and spiritual-stage filter, matching every prior module's conventions.
- **Spiritual Practice Tracking (Section 18) + Historical Validation (Section 19):** historical date entry requests only a date and a generic stage label (meditation/mantra/pilgrimage/course/teacher-connection/retreat/philosophical-shift/service) — no private beliefs are requested or stored.

## Deliberate scope decisions

- No divisional chart is used as a "spiritual confirmation" layer, since this app's existing divisional-chart rule base does not establish one; introducing such a rule here would have violated the "do not invent unsupported rules" instruction shared across this spec and all prior ones.
- The pilgrimage cross-check requires both an exact Foreign Travel Timing overlap AND independent 9th/12th activation — a trip with no spiritual-house activation is never relabeled as a pilgrimage merely because it is a trip.
- The guru/teacher-connection interpretation is deliberately generic and non-prescriptive; no logic anywhere in the engine references or infers a specific religion, tradition, or named teacher.

## Testing performed

- `node --check` on all four new files (rules/engine/UI, plus `js/ui.js` after wiring) — all clean.
- Full Playwright regression: 42 total sidebar tabs, every tab clicked, zero real console/page errors (one harmless pre-existing `favicon.ico` 404, unrelated to this module).
- **One real bug was found and fixed during testing:** `buildSpiritualActivationMap()`'s candidate-push object initially omitted the `reasons` array (present in every prior module's equivalent function), causing a `Cannot read properties of undefined (reading 'map')` runtime error when a window's detail trace was expanded. Fixed by adding `reasons` to the pushed candidate object. Re-ran `node --check` and the full Playwright regression afterward — confirmed clean (42 tabs, zero console errors, trace renders correctly).
- Engine correctness: natal potential, current dasha, 2 candidate windows generated for the test chart, non-numeric window strength and stage classification populated correctly; stage and forecast-horizon controls verified changing results.
- Purity checks: zero `weak`-qualification windows leaked to the UI; zero windows where Rahu/Ketu activation alone (without Jupiter/Saturn support) produced a "strong candidate" (≥4 convergence factors) classification; zero windows where 12th-house activation was classified "Detachment" without accompanying Saturn transit support.
- Forbidden-language scan: the only text match for "divine approval"/religion-or-guru phrasing is the rule database's own explicit statement of what this module must never claim (a negated prohibition, not an affirmative claim) — no enlightenment guarantee, spiritual-superiority claim, specific-guru endorsement, or numeric score/star-rating pattern found anywhere in the rendered output.
- UI interaction: forecast-horizon selector, minimum-support filter, spiritual-stage filter, historical-date add/remove, and window-row click-to-expand trace (including the fixed bug) all verified working.

## Known limitations

- Spiritual-stage classification (Study vs. Practice vs. Transformation, etc.) is a fixed house/transit heuristic; it cannot read an actual practice journal, teacher relationship, or inner experience.
- The pilgrimage cross-check depends on an exact MD/AD/PD overlap with Foreign Travel Timing; a near-miss (adjacent but non-overlapping period) is not flagged.
- As with every prior module, this analysis is a classical-method chart indication of spiritual-development timing only — it is explicitly not a diagnosis, a guarantee of enlightenment, or a religious/guru recommendation.

## Next recommended event-timing module

With seventeen event-timing modules now complete (Marriage, Promotion, Job Change, Career Start, Childbirth, Property Purchase, Foreign Travel, Financial Gain, Business Start, Higher Education, Vehicle Purchase, Retirement, Recognition/Award, Major Career Turning Point, Legal Matter Resolution, and now Spiritual Turning Point Timing), the life/career/legal/spiritual-event timing surface is comprehensively covered. Any further addition should be evaluated against this existing set to avoid redundancy.
