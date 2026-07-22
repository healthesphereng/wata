/**
 * Age- and weight-based feeding coach. Bands follow WHO infant-feeding
 * guidance (exclusive breast/formula milk to 6 months, iron-rich solids from
 * 6 months); bottle volumes use the standard ~150 ml per kg per day rule of
 * thumb. General guidance for healthy, term babies — never medical advice,
 * and the UI must say so.
 */

export interface BottleGuidance {
  perFeedMinMl: number;
  perFeedMaxMl: number;
  dailyMl: number;
}

export interface FeedingGuidance {
  stage: string;
  /** How often to feed, in plain words. */
  rhythm: string;
  /** Formula/expressed-milk volumes derived from body weight; null once solids share the load. */
  bottle: BottleGuidance | null;
  /** What milk looks like at this stage (breast and bottle alike). */
  milk: string;
  /** Solid-food guidance; null before ~6 months. */
  solids: string | null;
  tips: string[];
}

const roundTo10 = (n: number) => Math.round(n / 10) * 10;

/** ~150 ml/kg/day split across the day's feeds, capped at 1 litre. */
function bottleFor(weightKg: number, feedsMin: number, feedsMax: number): BottleGuidance {
  const dailyMl = Math.min(1000, Math.round(weightKg * 150));
  return {
    perFeedMinMl: roundTo10(dailyMl / feedsMax),
    perFeedMaxMl: roundTo10(dailyMl / feedsMin),
    dailyMl,
  };
}

export function feedingGuidance(ageDays: number, weightKg: number): FeedingGuidance {
  if (ageDays < 28) {
    return {
      stage: 'Newborn · 0–4 weeks',
      rhythm: '8–12 feeds a day — roughly every 2–3 hours, day and night.',
      bottle: bottleFor(weightKg, 8, 12),
      milk: 'Breast milk or formula only. In the first few days start small (30–60 ml a feed) and build up as baby demands more.',
      solids: null,
      tips: [
        'Feed on early hunger cues — stirring, rooting, hands to mouth. Crying is a late cue.',
        'Wake baby to feed if a daytime stretch passes 4 hours.',
        '6+ wet diapers a day is the simplest sign baby is getting enough.',
        'Burp halfway through and after each feed.',
      ],
    };
  }
  if (ageDays < 90) {
    return {
      stage: 'Young infant · 1–3 months',
      rhythm: '7–9 feeds a day; night stretches slowly lengthen.',
      bottle: bottleFor(weightKg, 7, 9),
      milk: 'Breast milk or formula only — no water, juice, or anything else yet.',
      solids: null,
      tips: [
        'Growth spurts (around 6 weeks) bring a few days of cluster feeding — feed on demand, supply catches up.',
        'Steady weight gain at clinic visits beats any feeding chart.',
        'Never prop a bottle; hold baby semi-upright and let them pace the feed.',
      ],
    };
  }
  if (ageDays < 180) {
    return {
      stage: 'Infant · 3–6 months',
      rhythm: '6–8 feeds a day; many babies settle into a predictable rhythm.',
      bottle: bottleFor(weightKg, 6, 8),
      milk: 'Milk is still the only food — WHO recommends exclusive breast milk or formula until 6 months.',
      solids: null,
      tips: [
        'Hold off on solids until about 6 months, even if baby watches you eat.',
        'Watch for readiness signs near 6 months: sitting with support, good head control, reaching for food.',
        'Distracted feeding is normal now — a quiet, dim room helps.',
      ],
    };
  }
  if (ageDays < 270) {
    return {
      stage: 'Starting solids · 6–9 months',
      rhythm: '4–6 milk feeds plus 2–3 small solid meals a day.',
      bottle: null,
      milk: 'Milk stays the main food (roughly 600–800 ml a day, or breastfeed on demand) — solids are for practice and iron.',
      solids:
        'Start with iron-rich foods — mashed beans, egg, fish, meat, fortified pap — one new food at a time, from smooth to mashed.',
      tips: [
        'Offer milk first, solids after, so milk intake stays up.',
        'Introduce one new food every 2–3 days to spot reactions.',
        'Sips of clean water from a cup can start with meals.',
        'No honey before 12 months, and no added salt or sugar.',
      ],
    };
  }
  if (ageDays < 365) {
    return {
      stage: 'Older infant · 9–12 months',
      rhythm: '3 solid meals plus 1–2 snacks, with 3–4 milk feeds around them.',
      bottle: null,
      milk: 'Roughly 500–600 ml of milk a day alongside meals — breastfeeding on demand still counts.',
      solids:
        'Move to lumpy textures and soft finger foods — baby should be chewing, not just swallowing purées.',
      tips: [
        'Let baby self-feed with fingers; mess is part of learning.',
        'Aim for iron and variety: grains, legumes, fruit, vegetables, egg, fish, meat.',
        'Keep offering rejected foods — it can take 10+ tries.',
      ],
    };
  }
  return {
    stage: 'Toddler · 12+ months',
    rhythm: '3 family meals plus 2 snacks a day.',
    bottle: null,
    milk: 'About 400–500 ml of milk a day; breastfeeding can continue to 2 years and beyond. Move bottles to a cup.',
    solids: 'Chopped family foods — the same balanced plate as everyone else, in toddler portions.',
    tips: [
      'Whole eggs, beans, fish, and groundnut pastes are great protein at this age.',
      'Appetite swings are normal — offer, don’t force.',
      'Water or milk only; skip sugary drinks.',
    ],
  };
}
