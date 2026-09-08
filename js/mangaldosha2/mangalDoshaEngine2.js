// Extended, single-chart Mangal Dosha (Kuja Dosha) analysis for its own tab
// — how it's derived, a 0-100 (multiples of 5) strength score, classical
// neutralization factors, and commonly cited remedies. This is layered ON
// TOP of, and does not replace, matching/mangalDoshaRules.js's existing
// Lagna-only check used by the Kundali Matching tab (that file's exports
// are reused here, not modified, so Kundali Matching is unaffected).
//
// Extension: classical practice often checks Mangal Dosha from THREE
// reference points — the Lagna, the Moon, and Venus — not the Lagna alone;
// a dosha appearing from only 1 of the 3 is traditionally read as much
// milder than one appearing from all 3.

const MANGAL_DOSHA2_LOGIC_TEXT = [
  ['Mangal Dosha (Extended) — Logic and Sequence'],
  [''],
  ['1. DERIVATION: Mars is checked from THREE classical reference points — the Lagna (Ascendant), the Moon, and Venus — for whether it falls in that reference\'s 1st, 2nd, 4th, 7th, 8th, or 12th house. Most basic checks use the Lagna alone (see the Kundali Matching tab); this tab additionally reports the Moon and Venus references, since several classical sources hold the dosha is only "full strength" when present from all three.'],
  ['2. STRENGTH SCORE (multiples of 5): each reference point with a dosha gets a base severity from its house (8th=100, 7th=90, 4th/12th=60, 2nd=50, 1st=40), then classical reductions are subtracted: -30 if Mars is in its own/exaltation sign, -20 if aspected by Jupiter, -15 if aspected by Venus, -20 if Mars is the Lagna lord (Lagna reference only) — every input is already a multiple of 5, so the result always lands on a multiple of 5. The combined/overall score is the average of the severities from whichever reference points show a dosha, rounded to the nearest multiple of 5.'],
  ['3. OVERALL STRENGTH LABEL: None (0 of 3 references show a dosha), Mild (1 of 3), Moderate (2 of 3), Strong (3 of 3) — reflecting the classical view that a dosha confirmed from all three points is far more significant than one appearing from a single point.'],
  ['4. NEUTRALIZATION: lists which classical mitigating factors are present for THIS chart (own/exaltation sign, Jupiter aspect, Venus aspect, Lagna lordship, or the dosha being present from only 1 of 3 reference points) — presented as contributing factors already folded into the score above, not a separate override.'],
  ['5. REMEDIES: a static list of commonly cited traditional remedies (see below) — these are cultural/faith-based practices, not scientifically validated, and not a substitute for a direct conversation between partners or consultation with a qualified astrologer.'],
  [''],
  ['Caveat: Mangal Dosha analysis is one of the most debated areas of classical matching practice; several further classical checks exist (e.g. requiring the SAME house to also show a dosha in a prospective partner\'s chart) that are only evaluated on the Kundali Matching tab, since they require a second chart.']
];

const MANGAL_DOSHA2_REMEDIES = [
  { title: 'Kumbh Vivah (symbolic marriage)', text: 'A symbolic marriage ceremony to a peepal tree, banana tree, or a silver/gold idol of Vishnu performed before the real marriage — one of the most commonly cited traditional remedies.' },
  { title: 'Mangal / Kuja mantra japa', text: 'Chanting the Hanuman Chalisa or a Mangal (Kuja) mantra, traditionally on Tuesdays (Mars\'s day).' },
  { title: 'Tuesday fasting', text: 'Observing a fast on Tuesdays, often alongside the mantra practice above.' },
  { title: 'Mangal Shanti Puja', text: 'A Navagraha or Mangal-specific peace ceremony performed by a qualified priest to propitiate Mars.' },
  { title: 'Charitable giving (daan)', text: 'Donating red lentils (masoor dal), jaggery, or red cloth, traditionally on Tuesdays.' },
  { title: 'Red coral (Moonga)', text: 'Wearing red coral is sometimes prescribed — but ONLY after a qualified astrologer confirms it suits the individual chart, since an unsuitable gemstone is classically held to aggravate rather than help.' },
  { title: 'Age-based softening', text: 'Some traditions hold the dosha\'s practical intensity naturally reduces after Mars\'s own maturity age (commonly cited as ~28) — this is a widely repeated folk view, not a universally accepted classical rule.' },
  { title: 'Matching dosha in partner', text: 'If both prospective partners carry Mangal Dosha of comparable strength, classical tradition reads this as a mutual cancellation — see the Kundali Matching tab to check this for a specific pair.' }
];

function marsHouseFromSign(marsSign, referenceSign) {
  return wholeSignHouseOf(SIGNS.indexOf(marsSign), SIGNS.indexOf(referenceSign));
}

// Generic single-reference-point check (Lagna/Moon/Venus alike). `checkLagnaLordship`
// is only meaningful for the Lagna reference itself.
function computeMangalDoshaFromReference(mars, referenceSign, referenceLabel, checkLagnaLordship) {
  const house = marsHouseFromSign(mars.sign, referenceSign);
  const baseSeverity = MANGAL_DOSHA_HOUSE_SEVERITY[house] || 0;
  const hasDosha = baseSeverity > 0;
  const factors = [];
  if (!hasDosha) {
    factors.push(`Mars is in House ${house} (${mars.sign}) from ${referenceLabel} — not one of the six Mangal Dosha houses.`);
    return { referenceLabel, house, marsSign: mars.sign, hasDosha, severityPercent: 0, factors };
  }
  let severity = baseSeverity;
  factors.push(`Mars is in House ${house} (${mars.sign}) from ${referenceLabel} — a Mangal Dosha house, base severity ${baseSeverity}%.`);
  if (MANGAL_DOSHA_OWN_OR_EXALTED_SIGNS.includes(mars.sign)) {
    severity -= 30;
    factors.push('Mars is in its own sign or exaltation sign — classically weakens the dosha; -30%.');
  }
  if ((mars.aspectedBy || []).includes('Jupiter')) {
    severity -= 20;
    factors.push('Mars is aspected by Jupiter — a classical benefic cancellation factor; -20%.');
  }
  if ((mars.aspectedBy || []).includes('Venus')) {
    severity -= 15;
    factors.push('Mars is aspected by Venus — an additional classically cited mitigating factor; -15%.');
  }
  if (checkLagnaLordship) {
    factors.push('Mars is the Lagna lord in this chart — classically read more mildly since it also rules the self; -20%.');
    severity -= 20;
  }
  severity = Math.max(0, Math.min(100, Math.round(severity / 5) * 5));
  return { referenceLabel, house, marsSign: mars.sign, hasDosha, severityPercent: severity, factors };
}

const STRENGTH_LABELS = { 0: 'None', 1: 'Mild', 2: 'Moderate', 3: 'Strong' };

// chart: { planets, ascendant }.
function computeMangalDosha2(chart) {
  const mars = chart.planets.find(p => p.name === 'Mars');
  const moon = chart.planets.find(p => p.name === 'Moon');
  const venus = chart.planets.find(p => p.name === 'Venus');
  const isLagnaLordly = chart.ascendant.sign === 'Aries' || chart.ascendant.sign === 'Scorpio';

  const references = [
    computeMangalDoshaFromReference(mars, chart.ascendant.sign, 'Lagna (Ascendant)', isLagnaLordly),
    computeMangalDoshaFromReference(mars, moon.sign, 'the Moon', false),
    computeMangalDoshaFromReference(mars, venus.sign, 'Venus', false)
  ];

  const withDosha = references.filter(r => r.hasDosha);
  const count = withDosha.length;
  const combinedSeverity = count ? Math.round((withDosha.reduce((s, r) => s + r.severityPercent, 0) / count) / 5) * 5 : 0;
  const strengthLabel = STRENGTH_LABELS[count];

  const neutralizationNotes = [];
  references.forEach(r => {
    if (!r.hasDosha) return;
    r.factors.slice(1).forEach(f => neutralizationNotes.push(`[from ${r.referenceLabel}] ${f}`));
  });
  if (count === 1) {
    neutralizationNotes.push('This dosha is present from only 1 of the 3 classical reference points (Lagna/Moon/Venus) — several traditions consider a single-point dosha to be largely negligible in practice.');
  }
  if (count === 0) {
    neutralizationNotes.push('No Mangal Dosha house is occupied from any of the 3 reference points — no neutralization needed.');
  }

  return {
    mars: { sign: mars.sign, house: mars.house },
    references, count, strengthLabel, combinedSeverity, neutralizationNotes,
    hasAnyDosha: count > 0
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    MANGAL_DOSHA2_LOGIC_TEXT, MANGAL_DOSHA2_REMEDIES, STRENGTH_LABELS,
    computeMangalDoshaFromReference, computeMangalDosha2
  };
}
