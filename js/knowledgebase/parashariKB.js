const PARASHARI_KB = {
  "meta": {
    "system": "Parashari (classical Vedic astrology)",
    "content_type": "Standard/consensus interpretive synthesis drawn from common Parashari principles (e.g. as found across Brihat Parashara Hora Shastra-derived tradition). Not a verbatim quotation of any single text — treat as a starting rule-base to refine with your own source material.",
    "coverage": {
      "lagna_in_sign": "complete (12/12)",
      "planet_in_house": "complete (9 planets x 12 houses = 108/108)",
      "planet_in_sign": "STUB ONLY — structure present, content not yet authored (108 entries pending)"
    }
  },
  "signs": [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces"
  ],
  "planets": [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
    "Rahu",
    "Ketu"
  ],
  "houseThemes": {
    "1": "self, physical body, personality, and outward identity",
    "2": "wealth, family, speech, and accumulated resources",
    "3": "courage, siblings, short journeys, and self-effort",
    "4": "home, mother, emotional foundation, and property",
    "5": "children, intelligence, creativity, and past-life merit",
    "6": "health, debts, enemies, service, and daily struggle",
    "7": "marriage, partnerships, and public dealings",
    "8": "transformation, longevity, secrets, and sudden events",
    "9": "fortune, dharma, higher learning, and the father",
    "10": "career, status, public reputation, and authority",
    "11": "gains, income, elder siblings, and social networks",
    "12": "loss, expenditure, foreign lands, isolation, and liberation"
  },
  "planetCoreSignifications": {
    "Sun": "soul, authority, father, government, vitality, ego",
    "Moon": "mind, mother, emotions, public, comfort, receptivity",
    "Mars": "energy, courage, siblings, land/property, conflict, drive",
    "Mercury": "intellect, communication, commerce, analysis, adaptability",
    "Jupiter": "wisdom, expansion, fortune, teachers, dharma, wealth",
    "Venus": "love, beauty, relationships, luxury, art, pleasure",
    "Saturn": "discipline, delay, hard work, longevity, restriction, service",
    "Rahu": "obsession, ambition, foreign/unconventional matters, sudden gain, illusion",
    "Ketu": "detachment, spirituality, past-life karma, isolation, loss of interest"
  },
  "lagnaInSign": {
    "Aries": {
      "summary": "Mars-ruled lagna gives a pioneering, energetic, action-first temperament.",
      "personality": "Bold, impulsive, competitive, quick to start things but sometimes slow to finish them. Natural leadership instinct and a need for physical activity or challenge.",
      "body_health": "Prone to head/face injuries, headaches, fevers, and impulsive accidents; benefits from regular physical outlet for energy.",
      "career_tendency": "Suited to entrepreneurship, defense, sports, surgery, engineering, or any field rewarding initiative and courage.",
      "caution": "Watch for impatience, temper, and a tendency to abandon projects once the initial excitement fades."
    },
    "Taurus": {
      "summary": "Venus-ruled lagna gives a stable, sensual, security-seeking temperament.",
      "personality": "Patient, steady, values comfort, beauty and material stability; can be stubborn once a position is taken.",
      "body_health": "Throat, neck, and thyroid are typically sensitive areas; tendency toward weight gain from love of good food.",
      "career_tendency": "Finance, banking, luxury goods, agriculture, arts, and hospitality suit this lagna well.",
      "caution": "Resistance to change and possessiveness (over people or possessions) are the main growth edges."
    },
    "Gemini": {
      "summary": "Mercury-ruled lagna gives a quick, communicative, restless, intellectually curious temperament.",
      "personality": "Versatile, witty, adaptable, enjoys variety and conversation; can seem inconsistent because interests shift quickly.",
      "body_health": "Nervous system, hands/arms, and lungs are typical areas of sensitivity; benefits from calming routines.",
      "career_tendency": "Writing, media, sales, teaching, IT, and any multi-tasking or communication-heavy career.",
      "caution": "Scattered focus and difficulty with follow-through on long projects are common challenges."
    },
    "Cancer": {
      "summary": "Moon-ruled lagna gives an emotionally sensitive, nurturing, home-and-family-oriented temperament.",
      "personality": "Empathetic, protective, intuitive, deeply attached to family and roots; moods can fluctuate with circumstances.",
      "body_health": "Stomach/digestion and chest area are typical sensitive zones; emotional state directly affects physical health.",
      "career_tendency": "Hospitality, food, real estate, caregiving professions (nursing, counseling), and hospitality/domestic-related business.",
      "caution": "Over-sensitivity, mood swings, and difficulty letting go of the past need conscious management."
    },
    "Leo": {
      "summary": "Sun-ruled lagna gives a confident, dignified, leadership-oriented temperament.",
      "personality": "Proud, generous, wants recognition and respect, natural authority and dramatic flair.",
      "body_health": "Heart and upper back/spine are typical sensitive areas; benefits from cardiovascular care.",
      "career_tendency": "Administration, government, politics, entertainment, and any position of visible authority.",
      "caution": "Ego sensitivity and difficulty taking direction from others are common friction points."
    },
    "Virgo": {
      "summary": "Mercury-ruled lagna gives an analytical, detail-oriented, service-minded temperament.",
      "personality": "Practical, precise, health-conscious, a natural problem-solver, often self-critical.",
      "body_health": "Digestive system and gut health are typical sensitive areas; tends toward anxiety-linked digestive issues.",
      "career_tendency": "Accounting, medicine/health services, editing, quality control, research, and analytical/technical fields.",
      "caution": "Perfectionism and excessive worry can undermine confidence and relationships."
    },
    "Libra": {
      "summary": "Venus-ruled lagna gives a diplomatic, relationship-oriented, aesthetically refined temperament.",
      "personality": "Charming, fair-minded, seeks balance and partnership, sometimes indecisive when forced to choose.",
      "body_health": "Kidneys and lower back are typical sensitive areas; balance in diet and routine matters.",
      "career_tendency": "Law, diplomacy, design, counseling/mediation, and partnership-based business.",
      "caution": "Over-dependence on others' approval and difficulty with confrontation are common issues."
    },
    "Scorpio": {
      "summary": "Mars-ruled lagna gives an intense, private, transformation-oriented temperament.",
      "personality": "Determined, perceptive, magnetic, comfortable with depth and crisis; guards privacy closely.",
      "body_health": "Reproductive organs and excretory system are typical sensitive areas; prone to intense health cycles (crisis-then-recovery pattern).",
      "career_tendency": "Research, investigation, surgery, psychology, occult sciences, finance/insurance, and crisis management.",
      "caution": "Suspicion, jealousy, and a tendency to hold grudges need conscious release."
    },
    "Sagittarius": {
      "summary": "Jupiter-ruled lagna gives an optimistic, philosophical, freedom-loving temperament.",
      "personality": "Honest, generous, seeks meaning and growth, drawn to travel, higher learning, and belief systems.",
      "body_health": "Hips/thighs and liver are typical sensitive areas; overindulgence is a recurring health theme.",
      "career_tendency": "Teaching, law, publishing, travel, higher education, religion/philosophy, and consulting.",
      "caution": "Overconfidence, bluntness, and a tendency to overpromise are common blind spots."
    },
    "Capricorn": {
      "summary": "Saturn-ruled lagna gives a disciplined, ambitious, structure-seeking temperament.",
      "personality": "Patient, hardworking, status-conscious, matures slowly but achieves durable, long-term results.",
      "body_health": "Bones, joints, and knees are typical sensitive areas; chronic rather than acute health patterns.",
      "career_tendency": "Administration, engineering, mining/real-estate, government service, and any long-horizon, hierarchy-based career.",
      "caution": "Pessimism, rigidity, and difficulty expressing warmth are common growth edges."
    },
    "Aquarius": {
      "summary": "Saturn-ruled lagna gives a detached, unconventional, socially/idealistically oriented temperament.",
      "personality": "Independent, humanitarian, intellectually driven, more comfortable with groups/causes than intimate one-on-one closeness.",
      "body_health": "Circulatory system and ankles are typical sensitive areas; irregular routines can affect health.",
      "career_tendency": "Technology, social work, science, astrology/unconventional fields, and network- or community-based work.",
      "caution": "Emotional detachment and stubborn contrarianism can isolate this lagna if unchecked."
    },
    "Pisces": {
      "summary": "Jupiter-ruled lagna gives a compassionate, imaginative, spiritually inclined temperament.",
      "personality": "Sensitive, intuitive, artistic, easily affected by environment and the emotions of others.",
      "body_health": "Feet and immune/lymphatic system are typical sensitive areas; prone to escapism-linked health issues (substance sensitivity).",
      "career_tendency": "Arts, music, healing professions, spirituality/charity work, and any field involving imagination or service.",
      "caution": "Escapism, poor boundaries, and susceptibility to deception are recurring themes."
    }
  },
  "planetInHouse": {
    "Sun": {
      "1": "Strong sense of self, natural authority and visibility, but can create ego-centeredness; often gives good vitality and a commanding presence.",
      "2": "Assertive, direct speech; income often tied to authority, government, or father-figures; family relations can carry friction from ego clashes.",
      "3": "Courage and initiative in self-effort and communication; good relations with authority figures but sibling relationships may be strained by dominance.",
      "4": "Tension between personal ambition and domestic peace; often indicates distance from or friction with the mother, but pride in home/property.",
      "5": "Strong-willed, confident children or creative output; good for leadership in intellectual pursuits, though can create a domineering approach to romance.",
      "6": "Favorable for overcoming enemies, litigation, and competition; strengthens ability to handle service roles and health challenges through willpower.",
      "7": "Dominant or authoritative spouse/partner; partnerships thrive when Sun is well-placed but can otherwise create ego conflict in relationships.",
      "8": "Challenges around sudden change, authority disputes, or health crises; can also give resilience and interest in hidden/occult knowledge.",
      "9": "Favorable placement — strong father figure, fortune tied to authority or higher learning, respect for tradition and dharma.",
      "10": "Classically strong placement — career success, public recognition, and natural authority in professional life.",
      "11": "Gains through authority, government, or powerful networks; strong achievement of ambitions and goals.",
      "12": "Can indicate distance from father, expenditure on status, or a need for solitude/introspection to process ego; sometimes foreign residence tied to authority."
    },
    "Moon": {
      "1": "Emotionally sensitive, changeable moods, strong intuition, and a personality that reflects the surrounding environment.",
      "2": "Wealth and speech fluctuate with emotional state; often a nurturing, family-oriented approach to finances.",
      "3": "Emotional courage, close bond with siblings, and comfort communicating feelings; mind is active but can be restless.",
      "4": "Very strong placement — deep emotional connection to home and mother, contentment, and emotional stability when otherwise well-placed.",
      "5": "Emotionally invested in children and creative pursuits; intuitive intelligence and a romantic, imaginative approach to love.",
      "6": "Emotional sensitivity around health, service, or conflict; can indicate fluctuating health or emotional strain from daily struggles.",
      "7": "Emotionally driven partnerships; seeks a nurturing spouse, but moods can create instability in close relationships.",
      "8": "Emotional intensity around transformation and hidden matters; sensitive to sudden change, but often intuitively perceptive about the unseen.",
      "9": "Emotional connection to belief systems, father, or teachers; often gives a compassionate approach to dharma and philosophy.",
      "10": "Public-facing emotional nature; career often involves the public, nurturing roles, or a fluctuating professional reputation.",
      "11": "Emotional fulfillment through friendships and social gains; income tends to fluctuate but overall supports gain.",
      "12": "Emotional withdrawal, strong inner/imaginative life, and sometimes disturbed sleep or a pull toward solitude or foreign residence."
    },
    "Mars": {
      "1": "Energetic, assertive, physically active personality; courage and directness, but temper needs management.",
      "2": "Sharp or aggressive speech; family finances can involve conflict or sudden expenditure; strong drive to accumulate.",
      "3": "Excellent placement for courage — bold, self-driven, and protective of siblings, strong initiative in self-effort.",
      "4": "Tension in domestic life or with the mother; can indicate property disputes but also drive to acquire land/real estate.",
      "5": "Assertive approach to creativity and romance; can indicate strong-willed children or impulsiveness in matters of the heart.",
      "6": "Very favorable — Mars is strong in fighting enemies, competition, and overcoming health challenges through sheer will.",
      "7": "Can create friction or conflict in marriage/partnerships; passionate but needs conscious effort to avoid dominance in relationships.",
      "8": "Indicates potential for accidents, surgery, or sudden crisis; also gives resilience and courage to face transformation.",
      "9": "Assertive approach to belief systems and higher learning; can create friction with father or teachers if ego is unchecked.",
      "10": "Strong drive and courage in career; excellent for fields requiring initiative, though can create workplace conflict.",
      "11": "Strong drive toward achieving goals and gains, often through effort and competition; supportive for entrepreneurial gains.",
      "12": "Hidden or suppressed aggression; can indicate expenditure on conflict/litigation, or channeled energy toward solitary/spiritual pursuits."
    },
    "Mercury": {
      "1": "Communicative, witty, analytical personality; quick thinking and adaptable, values intellectual engagement.",
      "2": "Articulate speech, good for accumulating wealth through communication, trade, or intellectual work.",
      "3": "Strong for writing, short journeys, and sibling communication; sharp, versatile self-expression.",
      "4": "Intellectual approach to home life; often indicates an analytical mother or comfort found in learning environments.",
      "5": "Strong for intelligence, education, and creative/analytical thinking; favors well-reasoned romantic choices.",
      "6": "Good analytical approach to overcoming health issues or resolving disputes; detail-oriented service or work.",
      "7": "Communicative, intellectually compatible partnerships; business partnerships often favored over purely emotional ones.",
      "8": "Interest in research, investigation, or occult knowledge; analytical approach to transformation and hidden matters.",
      "9": "Intellectual approach to philosophy and higher learning; often favors teaching, publishing, or scholarly pursuits.",
      "10": "Favorable for career involving communication, trade, analysis, or writing; adaptable professional path.",
      "11": "Gains through networking, communication, or intellectual/commercial ventures; social circle often intellectually stimulating.",
      "12": "Introspective or private mental activity; can indicate quiet study, writing in solitude, or overthinking/anxiety."
    },
    "Jupiter": {
      "1": "Optimistic, wise, and often physically expansive personality; generally seen as a favorable, fortune-supporting placement.",
      "2": "Favorable for wealth, family harmony, and truthful, wise speech; supports accumulated resources.",
      "3": "Supports courage through wisdom and good counsel; favorable for expansion through self-effort and communication.",
      "4": "Very favorable — emotional wisdom, comfort, education-supportive home environment, and good relationship with mother.",
      "5": "Highly favorable — supports intelligent, virtuous children, strong creative and educational ability, wise decision-making.",
      "6": "Can reduce the malefic effects of the sixth house; supports resolving disputes and health issues through wisdom, though can also indicate excess.",
      "7": "Favorable for a wise, supportive, and often fortunate spouse or business partner; generally good for marriage.",
      "8": "Can bring interest in philosophy of death/transformation and hidden knowledge; sometimes gives longevity or unexpected fortune despite crisis.",
      "9": "Excellent placement — strong dharma, fortune, higher learning, and a wise/benevolent father figure.",
      "10": "Favorable for a respected, ethical career often connected to teaching, law, finance, or guidance roles.",
      "11": "Excellent for gains — supports achievement of goals, prosperous social network, and generosity toward others.",
      "12": "Can indicate spiritual growth, charitable expenditure, or foreign connections tied to higher learning or philosophy."
    },
    "Venus": {
      "1": "Charming, aesthetically refined personality with a natural appreciation for beauty, comfort, and relationships.",
      "2": "Favorable for wealth accumulation through art, beauty, or relationship-based work; pleasant, refined speech.",
      "3": "Supports artistic or charming self-expression; enjoyable relationship with siblings, though may lack Mars-style drive.",
      "4": "Very favorable — comfortable, beautiful home environment, close and affectionate relationship with mother.",
      "5": "Romantic, creative, and pleasure-oriented approach to love and children; strong artistic or aesthetic intelligence.",
      "6": "Can indicate relationship-related conflicts or health issues tied to indulgence; also supports service in beauty/wellness fields.",
      "7": "Very favorable — strong indicator of a loving, attractive partnership and general marital harmony.",
      "8": "Interest in intimacy and transformation within relationships; can also indicate financial gain through partnership or inheritance.",
      "9": "Refined approach to belief and philosophy; may indicate fortune through relationships, arts, or a loving father figure.",
      "10": "Career connected to arts, beauty, luxury, entertainment, or diplomacy; generally a pleasant professional reputation.",
      "11": "Gains through relationships, arts, or social/aesthetic ventures; social circle often pleasant and supportive.",
      "12": "Indicates enjoyment of solitude, foreign luxury/travel, or expenditure on pleasure; can also give deep, private romantic bonds."
    },
    "Saturn": {
      "1": "Serious, disciplined, sometimes reserved personality; matures slowly but builds lasting strength and endurance.",
      "2": "Cautious or delayed accumulation of wealth; disciplined but sometimes restrictive speech or family relations.",
      "3": "Strong for persistent, disciplined self-effort; steady rather than flashy courage; can indicate a distant relationship with siblings.",
      "4": "Can create emotional distance or delayed domestic comfort; but supports long-term stability once established.",
      "5": "Delayed but potentially deep and responsible relationship with children; disciplined, structured approach to creativity and learning.",
      "6": "Very favorable — Saturn's discipline is well-suited to overcoming enemies, debt, and health challenges through persistence.",
      "7": "Can indicate a delayed or serious/mature partnership; commitment-oriented but may lack early romantic spontaneity.",
      "8": "Classically associated with longevity when well-placed, but also chronic difficulty, delay, or serious transformation.",
      "9": "Disciplined approach to dharma and philosophy; can indicate a distant or strict father, or fortune earned through long effort.",
      "10": "Favorable for long-term career achievement through sustained discipline; success often comes later in life but endures.",
      "11": "Gains through sustained effort and long-term networks; achievement of goals tends to be slow but durable.",
      "12": "Supports solitude, service, or spiritual discipline; can indicate isolation, chronic worry, or expenditure requiring restraint."
    },
    "Rahu": {
      "1": "Unconventional, ambitious, sometimes restless personality with a strong drive to stand out or reinvent one's identity.",
      "2": "Unusual or sudden approach to wealth and speech; can indicate unconventional family situations or exaggerated ambitions around resources.",
      "3": "Bold, unconventional courage and self-effort; strong drive for achievement through unusual or modern methods.",
      "4": "Unsettled or unconventional domestic life; may indicate a foreign home, unusual relationship with mother, or restless need for change.",
      "5": "Unconventional approach to creativity, education, or children; can indicate unusual romantic entanglements or obsessive intellectual pursuits.",
      "6": "Strong drive to overcome enemies and competition through unconventional means; can amplify conflict if unchecked.",
      "7": "Unconventional or foreign-connected partnerships; strong desire for partnership can also bring instability or illusion in relationships.",
      "8": "Intense interest in the occult, hidden knowledge, or sudden transformative events; volatile but potentially powerful placement.",
      "9": "Unconventional beliefs or foreign-influenced philosophy; can create tension with traditional father figures or dharma.",
      "10": "Strong, sometimes obsessive ambition for status and public recognition; can bring sudden, unconventional career rise.",
      "11": "Very favorable for material gain — strong placement for sudden or large gains, though desires can be insatiable.",
      "12": "Interest in foreign lands, spirituality, or escapism; can indicate hidden anxieties or unconventional forms of loss/expenditure."
    },
    "Ketu": {
      "1": "Detached, introspective, sometimes self-effacing personality; spiritually inclined with reduced interest in worldly self-image.",
      "2": "Detachment from material accumulation or family matters; can indicate unusual speech patterns or lack of interest in wealth.",
      "3": "Reduced drive for conventional self-effort, but can indicate quiet spiritual courage or unusual relationship with siblings.",
      "4": "Detachment from home/domestic life or a spiritually-oriented mother; comfort may come from within rather than external environment.",
      "5": "Detached or unconventional approach to children/creativity; can indicate past-life talent surfacing intuitively, or disinterest in typical romance.",
      "6": "Favorable for spiritually overcoming enemies and health struggles; reduces attachment to conflict, aiding quiet resolution.",
      "7": "Detachment or instability in partnership; can indicate a spiritually significant but conventionally difficult marriage.",
      "8": "Strong for occult insight, spiritual transformation, and detachment from fear of death; a classically deep, mystical placement.",
      "9": "Detachment from conventional belief systems in favor of direct spiritual experience; can indicate distance from father.",
      "10": "Reduced interest in conventional career recognition; can indicate a career in spiritual, research, or behind-the-scenes work.",
      "11": "Detachment from material gain despite opportunities; can indicate disinterest in typical social/network-driven ambition.",
      "12": "Classically excellent for spirituality and liberation (moksha); supports meditation, foreign residence, and release of worldly attachment."
    }
  },
  "planetInSign": {
    "Sun": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Moon": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Mars": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Mercury": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Jupiter": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Venus": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Saturn": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Rahu": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    },
    "Ketu": {
      "Aries": null,
      "Taurus": null,
      "Gemini": null,
      "Cancer": null,
      "Leo": null,
      "Virgo": null,
      "Libra": null,
      "Scorpio": null,
      "Sagittarius": null,
      "Capricorn": null,
      "Aquarius": null,
      "Pisces": null
    }
  }
};

if (typeof module !== "undefined") { module.exports = { PARASHARI_KB }; }
