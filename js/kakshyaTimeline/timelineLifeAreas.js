// Life-area definitions for the Kakshya Life-Area Timeline tab. Reuses the
// SAME house groupings already used by ashtakvargaPredictions/LIFE_AREAS
// where they overlap, extended with a few more rows toward the spec's
// suggested 22 areas — a representative subset, not the full 22, kept
// tractable at this scope. Each area is data (houses + primary houses),
// not hard-coded UI logic, per the spec's requirement.

const TIMELINE_LIFE_AREAS = [
  { id: 'self', name: 'Self / Personality', houses: [1], primary: [1] },
  { id: 'general', name: 'General Life Progress', houses: [1, 10], primary: [1] },
  { id: 'career', name: 'Career / Profession', houses: [10, 6, 2, 11, 9], primary: [10] },
  { id: 'business', name: 'Business', houses: [10, 11, 7], primary: [10, 11] },
  { id: 'income', name: 'Income', houses: [2, 11], primary: [11] },
  { id: 'wealth', name: 'Wealth', houses: [2, 11, 5, 9], primary: [2, 11] },
  { id: 'savings', name: 'Savings', houses: [2, 8, 11], primary: [2] },
  { id: 'property', name: 'Property / Real Estate', houses: [4, 2, 11, 12], primary: [4] },
  { id: 'marriage', name: 'Marriage', houses: [7, 2, 11], primary: [7] },
  { id: 'family', name: 'Family', houses: [2, 4, 9], primary: [2, 4] },
  { id: 'children', name: 'Children', houses: [5, 2, 11], primary: [5] },
  { id: 'education', name: 'Education', houses: [4, 5, 9], primary: [5, 9] },
  { id: 'health', name: 'Health / Vitality', houses: [1, 6, 8, 12], primary: [1, 6] },
  { id: 'travel', name: 'Travel', houses: [3, 9, 12], primary: [3, 12] },
  { id: 'gains', name: 'Gains / Fulfilment', houses: [11], primary: [11] },
  { id: 'spirituality', name: 'Spirituality', houses: [9, 12], primary: [12] },
  { id: 'litigation', name: 'Litigation / Competition', houses: [6, 7], primary: [6] },
  { id: 'status', name: 'Social Status / Recognition', houses: [10, 1, 11], primary: [10] }
];

const TIMELINE_LIFE_AREA_GROUPS = {
  All: TIMELINE_LIFE_AREAS.map(a => a.id),
  'Career & Money': ['career', 'business', 'income', 'wealth', 'savings'],
  Relationships: ['marriage', 'family'],
  'Family & Children': ['family', 'children'],
  'Property & Assets': ['property'],
  Education: ['education'],
  Health: ['health'],
  Travel: ['travel'],
  Business: ['business'],
  Spirituality: ['spirituality']
};

if (typeof module !== 'undefined') {
  module.exports = { TIMELINE_LIFE_AREAS, TIMELINE_LIFE_AREA_GROUPS };
}
