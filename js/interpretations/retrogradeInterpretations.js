// Classical interpretation text for a RETROGRADE planet. Rahu/Ketu are
// always retrograde by nature (lunar nodes only ever move backward through
// the zodiac — see ephemeris.js/birthChart.js) so they get a note about that
// instead of a "special retrograde effect" text; the Sun and Moon are never
// retrograde and are excluded entirely.

const RETROGRADE_INTERPRETATIONS_LOGIC_TEXT = [
  ['Retrograde Interpretation — Logic and Sequence'],
  [''],
  ['1. A classical view (held across several traditions) is that a retrograde planet acts with UNUSUAL intensity — some treat it as functionally close to strong/exalted in effect, because its energy is turned inward and re-examined rather than spent outward — while another common reading emphasizes delay, reversal, and revisiting of that planet\'s themes (especially past patterns) before forward progress resumes.'],
  ['2. This app presents the "turned inward / revisited" reading as the primary text for each planet below, since it is the most widely taught version in contemporary Parashari practice, while flagging the "intensified strength" view as a real classical alternative.'],
  ['3. Rahu and Ketu are always retrograde by their very nature (they are the Moon\'s orbital nodes, never physical bodies with forward motion) — this is not a special condition for them the way it is for the 5 classical retrograding planets, so no separate retrograde effect is read for the nodes.'],
  [''],
  ['Caveat: retrograde interpretation is one of the more debated areas of classical practice — treat this text as one widely taught reading, not a settled consensus.']
];

const RETROGRADE_INTERPRETATIONS = {
  Mars: 'A retrograde Mars turns assertiveness and drive inward — courage becomes more deliberate and less impulsive, energy is more often spent revisiting old conflicts or unfinished efforts than starting new ones, and initiatives may need a second attempt before they truly take off.',
  Mercury: 'A retrograde Mercury is classically associated with revisiting, reviewing, and reconsidering — communication, decisions, contracts, and plans made under its influence may need to be reworked, and the native often thinks in a more internal, unconventional, or delayed-but-thorough way.',
  Jupiter: 'A retrograde Jupiter turns wisdom and the search for meaning inward — growth in fortune or knowledge may come through introspection, philosophy, or revisiting earlier beliefs rather than outward expansion, with visible results often arriving later but proving more deeply rooted.',
  Venus: 'A retrograde Venus often brings relationships, values, and aesthetic tastes up for re-examination — past romantic or creative themes may resurface for resolution, and the native\'s sense of what they truly love or value tends to mature through revision rather than a straight line.',
  Saturn: 'A retrograde Saturn intensifies its karmic, lesson-teaching quality — discipline and structure are worked out more internally, delays can feel especially drawn out, but the eventual mastery or reward, when it comes, is often unusually durable.'
};

// Sun and Moon are never retrograde; Rahu/Ketu are always retrograde by
// nature (see logic text above) rather than by a special chart condition.
function interpretRetrograde(planetName) {
  if (planetName === 'Rahu' || planetName === 'Ketu') {
    return `${planetName} is always retrograde by its very nature (the lunar nodes only ever move backward through the zodiac) — this is not a special chart condition the way it is for the classical planets, so no separate retrograde effect applies.`;
  }
  return RETROGRADE_INTERPRETATIONS[planetName] || null;
}

if (typeof module !== 'undefined') {
  module.exports = { RETROGRADE_INTERPRETATIONS_LOGIC_TEXT, RETROGRADE_INTERPRETATIONS, interpretRetrograde };
}
