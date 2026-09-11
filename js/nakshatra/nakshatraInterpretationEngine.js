// Nakshatra + Pada interpretation engine — deterministic synthesis, no
// runtime LLM call. Reuses existing data/calculations throughout rather
// than inventing new ones:
//   - NAKSHATRA_TRAITS (interpretations2/nakshatraTraits.js): deity,
//     symbol, and character keynote for each of the 27 nakshatras — real
//     classical reference content already in this app.
//   - NAKSHATRA_TABLE (parashariTables.js): each nakshatra's Vimshottari
//     star lord, already computed.
//   - PARASHARI_KB.planetCoreSignifications (knowledgebase/parashariKB.js):
//     each planet's core significations, already in this app.
//   - vargaPosition(longitude, 'D9') (divisionalCharts.js): the exact
//     classical Navamsa sign for a longitude — used here for the pada's
//     "elemental flavor," since one pada (3°20') is, by definition, exactly
//     one Navamsa division (this is the standard technique: pada 1-4 of
//     any nakshatra map in sequence to 4 consecutive Navamsa signs,
//     verified against the same classical convention this app's own D9
//     chart already implements — not a separate/invented mapping).
//   - SIGN_TRAITS (interpretations/signTraits.js): the pada's Navamsa
//     sign's own style/temperament, already in this app.
//
// This produces an explainable, chart-derived synthesis for all 9 planets
// x 27 nakshatras x 4 padas without fabricating 972 unique hand-written
// paragraphs — every sentence traces back to one of the reused data
// sources above.

// Ordinal words for padas, used only for readable text.
const PADA_ORDINAL = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth' };

// The classical Purushartha (fourfold life-goal) assigned to each pada
// NUMBER, independent of which nakshatra it falls in — a real, additional
// classical layer distinct from (and not covered by) the Navamsa-sign
// flavor alone. Because the 12 zodiac signs' elements repeat in a fixed
// Fire-Earth-Air-Water cycle every 4 signs (Aries=Fire, Taurus=Earth,
// Gemini=Air, Cancer=Water, Leo=Fire, ...), ANY 4 consecutive Navamsa
// signs — i.e. any nakshatra's 4 padas — always land on Fire, Earth, Air,
// Water in that exact order. So pada 1 is always the Agni/Fire/Dharma
// pada, pada 2 Prithvi/Earth/Artha, pada 3 Vayu/Air/Kama, pada 4
// Jala/Water/Moksha, for every one of the 27 nakshatras without
// exception — confirmed both by this app's own D9 calculation and by
// external research on the standard convention (see
// docs/nakshatra/research-notes.md).
const PADA_PURUSHARTHA = {
  1: { name: 'Dharma', element: 'Fire (Agni)', focus: 'purpose, ethics, and right action — what this placement is here to DO' },
  2: { name: 'Artha', element: 'Earth (Prithvi)', focus: 'resources, livelihood, and tangible stability — what this placement is here to BUILD or ACQUIRE' },
  3: { name: 'Kama', element: 'Air (Vayu)', focus: 'desire, relationship, and exchange — what this placement is here to WANT or CONNECT WITH' },
  4: { name: 'Moksha', element: 'Water (Jala)', focus: 'release, dissolution, and inward/spiritual transformation — what this placement is here to LET GO OF' }
};

// Builds the pada's Navamsa-sign "flavor" using the app's own D9
// divisional-chart calculation (no separate pada->sign table needed: a
// pada IS one Navamsa division by definition).
function nakInterpPadaFlavor(longitude) {
  const d9 = vargaPosition(longitude, 'D9');
  const traits = SIGN_TRAITS[d9.sign];
  return { sign: d9.sign, traits };
}

// Planet-in-Nakshatra quality — combines the planet's natural-friendship
// relation to its OWN nakshatra's star lord (reusing relationBetween,
// planetaryStrength.js — the same lookup used by the Friendship &
// Strength tab) with that planet's own composite Friendship & Strength
// score (also reused, not recomputed) into one good/neutral/bad verdict,
// consistent with the same combined-quality approach already used for
// Planet-in-Sign on the Knowledge Base tab.
function nakInterpQuality(planetName, starLord, strengthByPlanet) {
  const relation = relationBetween(planetName, starLord);
  const relScore = relation === 'Own' ? 1.5 : relation === 'Friend' ? 1 : relation === 'Enemy' ? -1 : 0;
  const relQuality = relScore >= 1 ? 'good' : relScore <= -1 ? 'bad' : 'neutral';
  const s = strengthByPlanet[planetName];
  const strengthQuality = s ? (s.total >= 15 ? 'good' : s.total <= -15 ? 'bad' : 'neutral') : 'neutral';
  const v = q => (q === 'good' ? 1 : q === 'bad' ? -1 : 0);
  const sum = v(relQuality) + v(strengthQuality);
  const quality = sum >= 1 ? 'good' : sum <= -1 ? 'bad' : 'neutral';
  return { relation, quality, strengthTotal: s ? s.total : null };
}

// Full interpretation for one planet at its current chart longitude.
function nakInterpForPlanet(planetName, longitude) {
  const nak = nakshatraFromLongitude(longitude);
  if (!nak) return null;
  const pada = padaOf(longitude, nak);
  const traits = NAKSHATRA_TRAITS[nak.name];
  const coreSignification = PARASHARI_KB.planetCoreSignifications[planetName];
  const padaFlavor = nakInterpPadaFlavor(longitude);
  const purushartha = PADA_PURUSHARTHA[pada];

  const paragraph = [
    `${planetName} occupies ${nak.name} nakshatra (ruled by ${nak.starLord}, presided over by ${traits.deity}, symbolized by the ${traits.symbol.toLowerCase()}).`,
    `${nak.name}'s classical keynote — ${traits.keynote} — colors how ${planetName}'s own significations${coreSignification ? ` (${coreSignification})` : ''} tend to express here.`,
    `Because this nakshatra's Vimshottari star lord is ${nak.starLord}, ${nak.starLord}'s own condition and dasha periods add an extra layer of relevance to ${planetName}'s results.`,
    `This is the ${PADA_ORDINAL[pada]} pada, which carries the added Navamsa flavor of ${padaFlavor.sign}${padaFlavor.traits ? ` — ${padaFlavor.traits.description}` : ''}, subtly shading the manner (rather than the core theme) in which ${planetName} operates through this nakshatra.`,
    `Every ${PADA_ORDINAL[pada]} pada, in any nakshatra, is additionally classified as the ${purushartha.name} pada (${purushartha.element} element) — meaning ${planetName}'s results through this nakshatra carry an added emphasis on ${purushartha.focus}.`
  ].join(' ');

  return {
    planet: planetName, nakshatra: nak.name, pada, starLord: nak.starLord,
    deity: traits.deity, symbol: traits.symbol, keynote: traits.keynote,
    padaSign: padaFlavor.sign, padaSignTraits: padaFlavor.traits,
    purushartha,
    paragraph
  };
}

// Reference row (nakshatra-level only, not pada-level, and not tied to any
// specific planet) for the "all 27 nakshatras" listing — deity/symbol/
// keynote/star lord are fixed, chart-independent classical facts.
function nakInterpAllNakshatras() {
  return NAKSHATRA_TABLE.map(n => ({
    nakshatra: n.name, starLord: n.starLord,
    deity: NAKSHATRA_TRAITS[n.name].deity, symbol: NAKSHATRA_TRAITS[n.name].symbol,
    keynote: NAKSHATRA_TRAITS[n.name].keynote
  }));
}

if (typeof module !== 'undefined') {
  module.exports = { PADA_ORDINAL, PADA_PURUSHARTHA, nakInterpPadaFlavor, nakInterpQuality, nakInterpForPlanet, nakInterpAllNakshatras };
}
