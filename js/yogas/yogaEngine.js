// Runs every rule in yogaRules.js against the current birth chart and
// splits the results into two independently-sorted lists: auspicious
// (good) yogas sorted BEST first (highest strength first) and inauspicious
// (bad) yogas sorted WORST first (highest severity first) — exactly the
// ordering the Yogas tab needs, computed once per Generate Chart.

const YOGA_ENGINE_LOGIC_TEXT = [
  ['Yoga Engine — Logic and Sequence'],
  [''],
  ['1. Every rule function in yogaRules.js is run against the current chart\'s planets and Ascendant. Some rules can match more than once (e.g. more than one Panch Mahapurusha Yoga, or a Raja Yoga formed by more than one Kendra/Trikona lord pairing) and so return an array; others return at most one match.'],
  ['2. All matches are split by polarity: "good" (auspicious) and "bad" (inauspicious) — a chart can have both at once, since classical yogas are not mutually exclusive.'],
  ['3. Good yogas are sorted BEST FIRST, by descending strength. Bad yogas are sorted WORST FIRST, by descending severity. Both "strength" and "severity" are this app\'s own 0-100 heuristic (see yogaRules.js), used only to order same-polarity yogas relative to each other — not a classical numeric scale.'],
  ['4. This runs automatically every time a chart is generated (see ui.js\'s generateChart()) — there is no separate "compute yogas" step to trigger.'],
  ['']
];

function flatten(results) {
  return results.reduce((acc, r) => {
    if (!r) return acc;
    return acc.concat(Array.isArray(r) ? r.filter(Boolean) : [r]);
  }, []);
}

// planets/ascendant: the same birth-chart objects generateBirthChart() produces.
function computeYogas(planets, ascendant) {
  const all = flatten([
    mahapurushaYogas(planets),
    gajaKesariYoga(planets),
    budhadityaYoga(planets),
    chandraMangalYoga(planets),
    dhanaYoga(planets, ascendant),
    rajaYogas(planets, ascendant),
    neechaBhangaYoga(planets, ascendant),
    adhiYoga(planets),
    kemadrumaYoga(planets),
    shakatYoga(planets),
    grahanYogas(planets),
    guruChandalYoga(planets),
    vishYoga(planets),
    angarakYoga(planets),
    kaalSarpaYoga(planets)
  ]);

  const goodYogas = all.filter(y => y.polarity === 'good').sort((a, b) => b.strength - a.strength);
  const badYogas = all.filter(y => y.polarity === 'bad').sort((a, b) => b.severity - a.severity);

  return { goodYogas, badYogas };
}

if (typeof module !== 'undefined') {
  module.exports = { YOGA_ENGINE_LOGIC_TEXT, computeYogas };
}
