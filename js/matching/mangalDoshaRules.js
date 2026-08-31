// Mangal Dosha (Kuja Dosha) — classical check for Mars afflicting marital
// harmony when placed in specific houses from the Ascendant. Kept separate
// from ashtakootRules.js since it is a pass/fail check layered ON TOP of
// the 36-point Guna Milan score, not one of the 8 kootas itself.

const MANGAL_DOSHA_LOGIC_TEXT = [
  ['Mangal Dosha (Kuja Dosha) — Logic and Sequence'],
  [''],
  ['1. Mangal Dosha is classically present when Mars occupies the 1st, 2nd, 4th, 7th, 8th, or 12th house counted from the Ascendant (whole-sign, matching this app\'s D1 house convention) — these houses govern self, family wealth/speech, home, marriage/partnership, longevity/in-laws, and marital bed/loss respectively, and Mars\'s aggressive nature there is considered to threaten marital harmony.'],
  ['2. For Guna Milan purposes, the classical rule of thumb is: Mangal Dosha in ONE partner\'s chart without the same affliction in the other\'s is considered a mismatch worth addressing (traditionally by an astrologer\'s further review); if BOTH partners have Mangal Dosha, it is classically considered to cancel out (Dosha to Dosha), and if NEITHER has it, there is nothing to reconcile.'],
  [''],
  ['Caveat: several classical cancellation (Bhanga) rules exist beyond the "both have it" case — e.g. Mars in its own sign or exalted, or aspected by Jupiter — none of which are computed here; this is a first-pass presence/absence check on the house placement alone.']
];

const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

// planets: birth-chart planets array (each with { name, house }).
function checkMangalDosha(planets) {
  const mars = planets.find(p => p.name === 'Mars');
  const hasDosha = !!mars && MANGAL_DOSHA_HOUSES.includes(Number(mars.house));
  return { hasDosha, marsHouse: mars ? mars.house : null };
}

// Combines both partners' Mangal Dosha checks into a compatibility verdict.
function compareMangalDosha(boyPlanets, girlPlanets) {
  const boy = checkMangalDosha(boyPlanets);
  const girl = checkMangalDosha(girlPlanets);
  let verdict;
  if (boy.hasDosha && girl.hasDosha) verdict = 'Both have Mangal Dosha — classically considered to cancel out.';
  else if (!boy.hasDosha && !girl.hasDosha) verdict = 'Neither has Mangal Dosha — no conflict on this factor.';
  else verdict = `Only ${boy.hasDosha ? "the boy's" : "the girl's"} chart has Mangal Dosha — classically flagged as a mismatch worth an astrologer's further review (cancellation rules not computed here).`;
  return { boy, girl, verdict };
}

if (typeof module !== 'undefined') {
  module.exports = { MANGAL_DOSHA_LOGIC_TEXT, MANGAL_DOSHA_HOUSES, checkMangalDosha, compareMangalDosha };
}
