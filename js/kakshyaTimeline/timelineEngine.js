// Kakshya Life-Area Timeline — aggregation/scoring layer built ENTIRELY on
// top of the existing Kakshya engine (js/kakshya/kakshyaEngine.js's
// computeKakshyaInfo), the existing Ashtakavarga data (state.ashtakvarga),
// and the existing Dasha engine (js/dasha/vimshottariDasha.js). No planet
// longitude, BAV/SAV, or Kakshya calculation is duplicated here — this file
// only samples, weights, and classifies what those engines already compute.

const TIMELINE_LOGIC_TEXT = [
  ['Kakshya Life-Area Timeline — Logic and Sequence'],
  [''],
  ['1. REUSE: every raw fact (planet longitude, sign, Kakshya, BAV, SAV, natal house, dasha lord) comes from the existing engines (kakshyaEngine.js, ashtakvarga.js\'s cached state.ashtakvarga, vimshottariDasha.js\'s cached state.dasha) — this file adds only sampling, weighting, and classification on top.'],
  ['2. SAMPLING: for the requested date range, each of the 7 classical planets\' Kakshya info (computeKakshyaInfo) is sampled at a resolution scaled to the planet\'s own mean speed (finer for the Moon, coarser for Saturn) ONCE across the whole range, then reused for every life area and every period — this avoids recomputing the same transit fact once per life-area-cell (see Performance caveat).'],
  ['3. SCORING: for each sample where a planet\'s activated natal house intersects a life area\'s house list, its Kakshya assessment (Strongly Supportive..Strongly Challenging) contributes a score from -2 to +2, weighted x1.5 if the activated house is one of the area\'s PRIMARY houses. A small dasha-alignment bonus (+-0.5) is added if the CURRENT Mahadasha lord occupies or rules one of the area\'s houses (Tier 2 evidence, reusing state.dasha — this is this app\'s own configurable weighting, not a claim that dasha and Kakshya combine via a single settled classical formula).'],
  ['4. PERIOD AGGREGATION: all contributing sample scores within a period (month/week/day) are averaged (not just the first or a single dominant event), then clamped to [-3, +3].'],
  ['5. CLASSIFICATION: the clamped score maps to 7 levels via CONFIGURABLE thresholds (TIMELINE_THRESHOLDS below) — Excellent/Very Good/Good/Neutral/Bad/Worse/Worst — defaults only, not immutable astrological truth.'],
  ['6. CONFIDENCE: High if >=4 contributing samples with consistent sign; Medium if fewer or mixed-sign; Insufficient Data if zero relevant samples in the period — shown distinctly from a genuine Neutral score, never colored the same.'],
  ['7. HIERARCHY: this is a Kakshya-based REFINEMENT/timing layer only — it never claims an event will occur. A favorable color means the sampled factors provide comparatively stronger support during that period, not a guarantee.'],
  ['']
];

// Configurable defaults (Section 12 of the spec) — edit here, not scattered in UI code.
const TIMELINE_THRESHOLDS = [
  { min: 2.25, label: 'Excellent' },
  { min: 1.50, label: 'Very Good' },
  { min: 0.50, label: 'Good' },
  { min: -0.49, label: 'Neutral' },
  { min: -1.49, label: 'Bad' },
  { min: -2.24, label: 'Worse' },
  { min: -Infinity, label: 'Worst' }
];

const ASSESSMENT_SCORE = { 'Strongly Supportive': 2, Supportive: 1, Mixed: 0, Challenging: -1, 'Strongly Challenging': -2 };

function classifyScore(score) {
  for (const t of TIMELINE_THRESHOLDS) { if (score >= t.min) return t.label; }
  return 'Worst';
}

// --- Period generation ---

function startOfUTCDay(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }

function generatePeriods(startDate, endDate, resolution) {
  const periods = [];
  let cursor = startOfUTCDay(startDate);
  while (cursor < endDate) {
    let periodEnd;
    let label;
    if (resolution === 'day') {
      periodEnd = new Date(cursor.getTime() + 86400000);
      label = cursor.toISOString().slice(0, 10);
    } else if (resolution === 'week') {
      periodEnd = new Date(cursor.getTime() + 7 * 86400000);
      label = `${cursor.toISOString().slice(0, 10)}`;
    } else { // month
      periodEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
      label = cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    }
    if (periodEnd > endDate) periodEnd = endDate;
    periods.push({ start: cursor, end: periodEnd, label });
    cursor = periodEnd;
  }
  return periods;
}

// --- Sampling (once per planet across the whole range) ---

function samplePlanetKakshyaSeries(planetName, startDate, endDate, chart, ashtakvarga) {
  const mean = MEAN_DAILY_MOTION[planetName] || 0.5;
  const stepDays = Math.max(0.5, Math.min(10, 3.75 / (mean * 3 || 1)));
  const series = [];
  for (let t = startDate.getTime(); t <= endDate.getTime(); t += stepDays * 86400000) {
    series.push(computeKakshyaInfo(planetName, new Date(t), chart, ashtakvarga));
  }
  return series;
}

function precomputeAllPlanetSeries(startDate, endDate, chart, ashtakvarga) {
  const series = {};
  SHADBALA_PLANETS.forEach(name => { series[name] = samplePlanetKakshyaSeries(name, startDate, endDate, chart, ashtakvarga); });
  return series;
}

// --- Dasha alignment bonus (Tier 2 evidence) ---

function currentDashaLord() {
  if (!state.dasha) return null;
  const idx = findCurrentIndex(state.dasha);
  return idx >= 0 ? state.dasha[idx].lord : null;
}

function dashaBonusForArea(area, chart, dashaLordName) {
  if (!dashaLordName) return 0;
  const lordPlanet = chart.planets.find(p => p.name === dashaLordName);
  if (!lordPlanet) return 0;
  const occupiesRelevant = area.houses.includes(Number(lordPlanet.house));
  const rulesRelevant = area.houses.some(h => {
    const signOfHouse = SIGNS[(SIGNS.indexOf(chart.ascendant.sign) + h - 1) % 12];
    return SIGN_LORD[signOfHouse] === dashaLordName;
  });
  return (occupiesRelevant || rulesRelevant) ? 0.5 : 0;
}

// --- Per-period scoring for one life area ---

function scorePeriodForArea(area, period, planetSeries, chart, dashaLordName) {
  const contributions = [];
  Object.keys(planetSeries).forEach(planetName => {
    planetSeries[planetName].forEach(sample => {
      if (sample.atDate < period.start || sample.atDate >= period.end) return;
      if (!area.houses.includes(sample.house)) return;
      const base = ASSESSMENT_SCORE[sample.assessment];
      if (base === undefined) return;
      const weight = area.primary.includes(sample.house) ? 1.5 : 1;
      contributions.push({ planet: planetName, house: sample.house, sample, weightedScore: base * weight });
    });
  });

  if (!contributions.length) {
    return { score: null, assessment: 'Insufficient Data', confidence: 'Insufficient Data', contributions: [] };
  }

  const avg = contributions.reduce((s, c) => s + c.weightedScore, 0) / contributions.length;
  const dashaBonus = dashaBonusForArea(area, chart, dashaLordName);
  const score = Math.max(-3, Math.min(3, avg + dashaBonus));
  const assessment = classifyScore(score);

  const positives = contributions.filter(c => c.weightedScore > 0).length;
  const negatives = contributions.filter(c => c.weightedScore < 0).length;
  let confidence;
  if (contributions.length >= 4 && (positives === 0 || negatives === 0)) confidence = 'High';
  else if (contributions.length >= 2) confidence = 'Medium';
  else confidence = 'Low';

  return { score, assessment, confidence, contributions, dashaBonus };
}

// --- Full matrix build ---

// areas: array of TIMELINE_LIFE_AREAS entries. Returns { periods, matrix: {areaId: [cellPerPeriod]} }.
function buildTimelineMatrix(areas, startDate, endDate, resolution, chart, ashtakvarga) {
  const periods = generatePeriods(startDate, endDate, resolution);
  const planetSeries = precomputeAllPlanetSeries(startDate, endDate, chart, ashtakvarga);
  const dashaLordName = currentDashaLord();

  const matrix = {};
  areas.forEach(area => {
    matrix[area.id] = periods.map(period => ({
      period, ...scorePeriodForArea(area, period, planetSeries, chart, dashaLordName)
    }));
  });
  return { periods, matrix, dashaLordName };
}

// --- Derived views ---

function findBestWorstPeriods(matrix, areas) {
  const rows = areas.map(area => {
    const cells = matrix[area.id].filter(c => c.score !== null);
    if (!cells.length) return { area, best: null, worst: null, avg: null };
    const best = cells.reduce((a, b) => (b.score > a.score ? b : a));
    const worst = cells.reduce((a, b) => (b.score < a.score ? b : a));
    const avg = cells.reduce((s, c) => s + c.score, 0) / cells.length;
    const strongCount = cells.filter(c => c.score >= 1.5).length;
    const difficultCount = cells.filter(c => c.score <= -1.5).length;
    return { area, best, worst, avg, strongCount, difficultCount };
  });
  return rows;
}

// Periods where many areas are simultaneously well-supported.
function findMultiAreaWindows(matrix, areas, periods, minAreas) {
  return periods.map((period, i) => {
    const supported = areas.filter(area => matrix[area.id][i] && matrix[area.id][i].score !== null && matrix[area.id][i].score >= 1.5);
    return { period, supportedAreas: supported.map(a => ({ area: a, cell: matrix[a.id][i] })) };
  }).filter(w => w.supportedAreas.length >= (minAreas || 4))
    .sort((a, b) => b.supportedAreas.length - a.supportedAreas.length);
}

function exportMatrixToCsv(matrix, areas, periods) {
  const header = ['periodStart', 'periodEnd', 'lifeArea', 'score', 'assessment', 'confidence'];
  const rows = [header.join(',')];
  areas.forEach(area => {
    matrix[area.id].forEach((cell, i) => {
      const p = periods[i];
      rows.push([
        p.start.toISOString().slice(0, 10), p.end.toISOString().slice(0, 10), area.name,
        cell.score === null ? '' : cell.score.toFixed(2), cell.assessment, cell.confidence
      ].join(','));
    });
  });
  return rows.join('\n');
}

if (typeof module !== 'undefined') {
  module.exports = {
    TIMELINE_LOGIC_TEXT, TIMELINE_THRESHOLDS, ASSESSMENT_SCORE, classifyScore,
    generatePeriods, samplePlanetKakshyaSeries, precomputeAllPlanetSeries,
    scorePeriodForArea, buildTimelineMatrix, findBestWorstPeriods, findMultiAreaWindows, exportMatrixToCsv
  };
}
