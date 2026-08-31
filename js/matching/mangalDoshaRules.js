// Mangal Dosha (Kuja Dosha) — classical check for Mars afflicting marital
// harmony when placed in specific houses from the Ascendant, PLUS a
// severity-percentage heuristic and a marriage recommendation. Kept
// separate from ashtakootRules.js since it is a check layered ON TOP of
// the 36-point Guna Milan score, not one of the 8 kootas itself.

const MANGAL_DOSHA_LOGIC_TEXT = [
  ['Mangal Dosha (Kuja Dosha) — Logic and Sequence'],
  [''],
  ['1. PRESENCE: Mangal Dosha is classically present when Mars occupies the 1st, 2nd, 4th, 7th, 8th, or 12th house counted from the Ascendant (whole-sign, matching this app\'s D1 house convention) — these houses govern self, family wealth/speech, home, marriage/partnership, longevity/in-laws, and marital bed/loss respectively, and Mars\'s aggressive nature there is considered to threaten marital harmony.'],
  ['2. SEVERITY (%): this app assigns each dosha-causing house a base severity — 8th house 100%, 7th house 90%, 4th and 12th houses 60%, 2nd house 50%, 1st house 40% — reflecting the commonly taught view that the 7th/8th house placements are the most serious (direct impact on the spouse/marriage and its longevity) and 1st/2nd the mildest. This percentage is THIS APP\'S OWN simplified severity scale for a quick-read comparison — classical texts describe relative severity qualitatively, not as a percentage.'],
  ['3. REDUCTIONS (partial cancellation, Bhanga): the base severity is reduced by 30 percentage points if Mars sits in its own sign (Aries/Scorpio) or exaltation sign (Capricorn); by 20 points if Mars is aspected by Jupiter (a classical benefic-cancellation factor); and by 20 points if Mars is itself the Lagna lord (Aries/Scorpio Ascendant), since a dosha-causing planet that also rules the self is read more mildly. The result is clamped to 0-100%.'],
  ['4. CONTRIBUTING FACTORS: each factor above (house placement, dignity, Jupiter aspect, Lagna lordship) is listed explicitly for the chart being checked, so the source of the percentage is fully visible rather than a black-box number.'],
  ['5. COMPATIBILITY: comparing both partners\' severity gives a recommendation — neither afflicted, or both afflicted at comparable strength, is classically read as fine (mutual cancellation in the second case); one afflicted and the other not is read as a concern scaled to how severe the lone affliction is.'],
  [''],
  ['Caveat: this severity percentage and the specific point-deductions are a simplified heuristic this app uses to make the classical "is it serious or mild" judgment call legible at a glance — they are not a standardized or universally agreed classical formula. Several further classical cancellation rules exist (e.g. checking Mars from the Moon and from Venus in addition to the Lagna, or a matching Mangal Dosha in the spouse\'s chart specifically in the SAME house) that this app does not compute. Treat the result as a starting point for a fuller consultation, not a final verdict — Mangal Dosha analysis is one of the most debated areas of classical matching practice.']
];

const MANGAL_DOSHA_HOUSE_SEVERITY = { 1: 40, 2: 50, 4: 60, 7: 90, 8: 100, 12: 60 };
const MANGAL_DOSHA_OWN_OR_EXALTED_SIGNS = ['Aries', 'Scorpio', 'Capricorn'];

// planets: birth-chart planets array (each with { name, sign, house, aspectedBy }).
// ascendant: { sign } — used to check whether Mars is the Lagna lord.
function computeMangalDoshaDetail(planets, ascendant) {
  const mars = planets.find(p => p.name === 'Mars');
  const house = Number(mars.house);
  const baseSeverity = MANGAL_DOSHA_HOUSE_SEVERITY[house] || 0;
  const hasDosha = baseSeverity > 0;
  const contributingFactors = [];
  let severity = baseSeverity;

  if (!hasDosha) {
    contributingFactors.push(`Mars occupies House ${house} (${mars.sign}), which is not one of the six Mangal Dosha houses (1, 2, 4, 7, 8, 12) — no dosha present.`);
    return { hasDosha, marsHouse: house, marsSign: mars.sign, severityPercent: 0, contributingFactors };
  }

  contributingFactors.push(`Mars occupies House ${house} (${mars.sign}) — a Mangal Dosha house, base severity ${baseSeverity}%.`);

  if (MANGAL_DOSHA_OWN_OR_EXALTED_SIGNS.includes(mars.sign)) {
    severity -= 30;
    contributingFactors.push(`Mars is in ${mars.sign} (its own sign or exaltation sign) — classically weakens the dosha; -30%.`);
  }
  if ((mars.aspectedBy || []).includes('Jupiter')) {
    severity -= 20;
    contributingFactors.push('Mars is aspected by Jupiter — a classical benefic cancellation factor; -20%.');
  }
  if (ascendant.sign === 'Aries' || ascendant.sign === 'Scorpio') {
    severity -= 20;
    contributingFactors.push('Mars is the Lagna lord in this chart — classically read more mildly since it also rules the self; -20%.');
  }
  severity = Math.max(0, Math.min(100, severity));

  return { hasDosha, marsHouse: house, marsSign: mars.sign, severityPercent: Math.round(severity), contributingFactors };
}

// Combines both partners' detailed Mangal Dosha checks into a marriage
// recommendation, using the severity percentages above.
function compareMangalDosha(boyPlanets, boyAscendant, girlPlanets, girlAscendant) {
  const boy = computeMangalDoshaDetail(boyPlanets, boyAscendant);
  const girl = computeMangalDoshaDetail(girlPlanets, girlAscendant);
  const diff = Math.abs(boy.severityPercent - girl.severityPercent);

  let recommendation, reasoning;
  if (!boy.hasDosha && !girl.hasDosha) {
    recommendation = 'Recommended';
    reasoning = 'Neither partner has Mangal Dosha — no conflict on this factor.';
  } else if (boy.hasDosha && girl.hasDosha) {
    if (diff <= 25) {
      recommendation = 'Recommended (classical cancellation)';
      reasoning = `Both partners have Mangal Dosha at comparable strength (${boy.severityPercent}% vs ${girl.severityPercent}%) — classically considered to cancel each other out (Dosha-to-Dosha).`;
    } else {
      recommendation = 'Consult an astrologer';
      reasoning = `Both partners have Mangal Dosha, but at noticeably different strengths (${boy.severityPercent}% vs ${girl.severityPercent}%) — mutual cancellation is less certain here; further review is recommended.`;
    }
  } else {
    const strong = boy.hasDosha ? boy : girl;
    const whose = boy.hasDosha ? "the boy's" : "the girl's";
    if (strong.severityPercent >= 50) {
      recommendation = 'Not recommended without remedies';
      reasoning = `Only ${whose} chart has Mangal Dosha, at significant strength (${strong.severityPercent}%) — classically considered a real concern for marital harmony unless remedial measures (e.g. Kumbh Vivah, or gemstone/mantra remedies prescribed by a qualified astrologer) are undertaken.`;
    } else {
      recommendation = 'Cautiously recommended';
      reasoning = `Only ${whose} chart has Mangal Dosha, but at mild strength (${strong.severityPercent}%) — classically considered a minor imbalance, often not treated as a serious obstacle.`;
    }
  }

  return { boy, girl, recommendation, reasoning };
}

if (typeof module !== 'undefined') {
  module.exports = {
    MANGAL_DOSHA_LOGIC_TEXT, MANGAL_DOSHA_HOUSE_SEVERITY, MANGAL_DOSHA_OWN_OR_EXALTED_SIGNS,
    computeMangalDoshaDetail, compareMangalDosha
  };
}
