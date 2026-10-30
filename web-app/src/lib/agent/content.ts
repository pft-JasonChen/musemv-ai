/**
 * Video Shorts Agent — every string, asset and template the three demo flows
 * use. Ported from the YCA Launcher prototype handoff
 * (`YCA_AgentFlow_Handoff/HANDOFF.md`, 2026-10-27). Copy is VERBATIM — curly
 * quotes, emoji and ellipses included — because the handoff makes wording,
 * order and timing the part that must not drift; only the visuals are Muse's.
 *
 * Media lives in `public/assets/agent/` (copied whole from the handoff's
 * `source/media/`, picker cell art under `pk/`).
 */

export const media = (file: string) => `/assets/agent/${file}`;

/** The three runnable demos (handoff §0): F7 sub-skill, F8 Creator, F9 Marketer. */
export type AgentFlowId = "ugc" | "pet" | "bag";

/* ── Launcher ─────────────────────────────────────────────────────────────── */

/** Input-card pills (handoff §1.1). Only UGC Review does anything — the other
 *  six are on screen as the planned catalogue and are deliberately inert. */
export const SHORTS_SKILLS = [
  "UGC Review",
  "UGC Tutorial",
  "Product Showcase Ad",
  "Product Demo & Solution",
  "Cinematic Brand Ad",
  "Unboxing & First-Use",
  "Person Action Remix",
] as const;

export const SHORTS_PLACEHOLDER = "Describe the video you want to make";

export const DEMO_URL =
  "www.anthropologie.com/shop/femmue-dream-glow-revitalize-radiance-mask-set-of-6";

export const IMG = {
  sample: media("model-sample.jpg"),
  picked: media("model-picked.jpg"),
  product: media("product-bottle.jpg"),
  pet: media("Pet_diary.PNG"),
  bag: media("agent-f9-bag.png"),
};

/* ── Photo pickers (handoff §3.2) ─────────────────────────────────────────── */

/** Session-storage key that carries a typed AI Shorts prompt from the
 *  composer to `/agent?flow=prompt` (2026-10-30). Storage, not the URL: the
 *  prompt is free text of any length. Kept after reading, so a reload of the
 *  chat replays the same prompt. */
export const AGENT_PROMPT_KEY = "muse_agent_prompt";

export type PickerSheet = "recents" | "product";

/** `rows` × 3 slots of YCA's picker cut; slot (0,0) is YCA's camera tile and
 *  has no photo, so the photos start at (0,1). */
export const PICKER: Record<PickerSheet, { rows: number; cell: (r: number, c: number) => string }> =
  {
    recents: { rows: 5, cell: (r, c) => media(`pk/r${r}${c}.jpg`) },
    product: { rows: 4, cell: (r, c) => media(`pk/p${r}${c}.jpg`) },
  };

/** Hinted cell per demo (row, col). From the launcher every cell returns the
 *  flow's fixed photo; the hint just points at the one that matches it. */
export const PICK_CELL = {
  pet: [2, 1],
  bag: [1, 0],
  model: [2, 0],
  ugcProduct: [2, 2],
} as const satisfies Record<string, readonly [number, number]>;

/* ── Templates (handoff §1.3; YCA Creator / Marketer tabs) ────────────────── */

/* Card and category names were renamed for clarity by the product owner on
   2026-10-30 — they no longer match the YCA handoff word for word (e.g. its
   "Polished Bag" is "Handbag Showcase", "Beauty Brian" is "Brian · Beauty
   Host", "Foodie Lover" is "Food Review"). Slugs and media files keep YCA's
   names, so a new YCA drop still maps by slug. */

const LABEL: Record<string, string> = {
  ballet: "Ballet",
  breaking: "Breakdance",
  "group-dance": "Group Dance",
  "pet-diary": "Pet Diary",
  "outer-space-journey": "Outer Space Journey",
  "royal-court-drama": "Royal Court Drama",
  "fantasy-anime": "Fantasy Anime",
  "supernatural-action": "Supernatural Action",
  "mystery-thriller": "Mystery Thriller",
  "product-detail-demo": "Handbag Showcase",
  "luxe-product-reveal": "Luxury Product Reveal",
  "product-demo-jewelry": "Jewelry Showcase",
  "close-up-demo": "Product Close-up",
  "product-demo-car": "Car Showcase",
  "product-feature-demo": "Feature Walkthrough",
  "ugc-hand-gesture": "Handheld Review",
  "home-shopping-demo": "At-home Demo",
  "skin-renewal-effect": "Skin Before & After",
  "product-demo-watch": "Watch Review",
  "beauty-brian": "Brian · Beauty Host",
  "beauty-natalie": "Natalie · Beauty Host",
  "electronics-steven": "Steven · Tech Host",
  "fashion-trevor": "Trevor · Fashion Host",
  "commercial-display": "Launch Key Visual",
  "nature-bloom": "Spring Bloom Scene",
  "woodland-swing": "Enchanted Forest Scene",
  "themed-sale-display": "Seasonal Sale Promo",
  "themed-sale-unbox": "Bundle Deal Promo",
  "themed-sale-hightech": "Tech Deal Promo",
  "fashion-erica": "Erica · Fashion Host",
  "fashion-kian": "Kian · Fashion Host",
  "fashion-ava": "Ava · Fashion Host",
  "fashion-lara": "Lara · Fashion Host",
  "foodie-kevin": "Kevin · Food Taster",
  "foodie-amy": "Amy · Food Taster",
  "foodie-kira": "Kira · Food Taster",
};

/** The Creator cards whose files are named differently from their slug. */
const FILE: Record<string, string> = {
  ballet: "Creator_dance_ballet",
  breaking: "Creator_dance_breaking",
  "group-dance": "Creator_dance_group",
  "pet-diary": "Creator_petdiary",
  "outer-space-journey": "Creator_outer-space",
  "royal-court-drama": "Creator_royal-court-drama",
  "fantasy-anime": "Creator_fantasy_anime",
  "supernatural-action": "Creator_supernatural_action",
  "mystery-thriller": "Creator_mystery_thrille",
};

export interface TemplateCard {
  slug: string;
  label: string;
  poster: string;
  video: string;
  /** Set on the one card per tab that starts a demo (handoff §1.3). */
  flow?: AgentFlowId;
}

/** One rail of 4:3 cards. YCA's mixed layouts (Chic Edit, Pet Companions,
 *  Text to Video Motion, Be the Director) were dropped and every rail uses the
 *  same landscape card (product owner, 2026-10-28). */
export interface TemplateSection {
  title: string;
  cards: TemplateCard[];
}

const FLOWS: Record<string, AgentFlowId> = { "pet-diary": "pet", "product-detail-demo": "bag" };

function card(slug: string, first: boolean): TemplateCard {
  const base = FILE[slug] ?? slug;
  return {
    slug,
    label: LABEL[slug] ?? slug,
    poster: media(`${base}.jpg`),
    video: media(`${base}.mp4`),
    flow: first ? FLOWS[slug] : undefined,
  };
}

/** YCA doubles every short rail so it reads as a long catalogue. */
const x2 = (a: string[]) => a.concat(a);
const rail = (title: string, slugs: string[]): TemplateSection => ({
  title,
  cards: x2(slugs).map((s, i) => card(s, i === 0)),
});

export const TEMPLATE_TABS: { id: "creator" | "marketer"; label: string; rows: TemplateSection[] }[] = [
  {
    id: "creator",
    label: "Creator",
    rows: [
      rail("Drama", ["pet-diary", "outer-space-journey", "royal-court-drama"]),
      rail("Dance", ["ballet", "group-dance", "breaking"]),
      rail("Action", ["fantasy-anime", "supernatural-action", "mystery-thriller"]),
    ],
  },
  {
    id: "marketer",
    label: "Marketer",
    rows: [
      rail("Luxury Ads", ["product-detail-demo", "luxe-product-reveal", "product-demo-jewelry"]),
      rail("Feature Demo", ["close-up-demo", "product-demo-car", "product-feature-demo"]),
      rail("User Testimonial", ["ugc-hand-gesture", "home-shopping-demo", "skin-renewal-effect", "product-demo-watch"]),
      rail("KOL Seller", ["beauty-brian", "beauty-natalie", "electronics-steven", "fashion-trevor"]),
      rail("Campaign", ["commercial-display", "nature-bloom", "woodland-swing"]),
      rail("Sale Event", ["themed-sale-display", "themed-sale-unbox", "themed-sale-hightech"]),
      rail("Fashion Host", ["fashion-erica", "fashion-kian", "fashion-ava", "fashion-lara"]),
      rail("Food Review", ["foodie-kevin", "foodie-amy", "foodie-kira"]),
    ],
  },
];

/** Home's first skill tab, "Hot" (product owner, 2026-10-30): recommended
 *  skills from both groups. PLACEHOLDER picks, not data — the two demo skills
 *  lead (and both start their demo here), then one popular skill per kind. */
export const HOT_SKILLS: TemplateSection = {
  title: "Hot",
  cards: x2([
    "pet-diary",
    "product-detail-demo",
    "ugc-hand-gesture",
    "ballet",
    "skin-renewal-effect",
    "beauty-natalie",
  ]).map((s, i) => card(s, i < 2)),
};

/* ── /shorts catalogue copy ───────────────────────────────────────────────────
   PLACEHOLDER (product owner, 2026-10-29: "you write it for now, we replace it
   later") — NOT from the YCA handoff, unlike everything above. One line per
   category. Skills have no description: the card's sample clip shows what it
   makes (2026-10-30). */

export const CATEGORY_DESC: Record<string, string> = {
  Drama: "Turn one photo into a short story with a beginning, a twist and an ending.",
  Dance: "Put anyone on the dance floor — from classical to street moves.",
  Action: "High-energy scenes with bold effects, chases and cinematic camera work.",
  "Luxury Ads": "Slow, premium product reveals with rich light and texture.",
  "Feature Demo": "Show how your product works, one close-up at a time.",
  "User Testimonial": "Authentic, creator-style reviews that feel filmed at home.",
  "KOL Seller": "A virtual host presents your product like a live seller.",
  Campaign: "Brand moments built for a launch, a season or a slogan.",
  "Sale Event": "Countdown-ready promos for sales, drops and holidays.",
  "Fashion Host": "A styled presenter talks your look through, outfit by outfit.",
  "Food Review": "Mouth-watering food moments with a host who loves to eat.",
};

/** PLACEHOLDER history of AI Shorts runs — two finished demo runs. The /shorts
 *  "Recent" row and History's All / AI Shorts tabs both list them, and both
 *  reopen the run's Agent conversation (`/agent?flow=`). */
export const RECENT_SHORTS: { id: string; title: string; when: string; poster: string; flow: AgentFlowId }[] = [
  { id: "r-pet", title: "Pet Diary · First snow", when: "Yesterday", poster: media("Creator_petdiary.jpg"), flow: "pet" },
  { id: "r-bag", title: "Handbag Showcase · Luxury ad", when: "Oct 27", poster: media("product-detail-demo.jpg"), flow: "bag" },
];

/* ── Agent chat copy (handoff §3–§5) ──────────────────────────────────────── */

export const PRODUCT_NAME = "Firming Vegan Collagen Prep Serum";
export const PRODUCT_DESC =
  "Firming Vegan Collagen Prep Serum is a lightweight, fast-absorbing treatment that helps skin look firmer, smoother, and more supple. Powered by vegan collagen and hydrating ingredients, it replenishes moisture while improving the appearance of elasticity, texture, and fine lines. Suitable for daily use and all skin types.";
export const ASK_NAME =
  "What is the name of this product? The product name helps me write a better script.";
export const BAG_NAME = "Fawn Calf-Hair Top Handle Bag";

export const KEEP_EXPLORING = ["Change approach", "Make a 30s version", "Try another model"] as const;

export const NEXT_REPLY: Record<(typeof KEEP_EXPLORING)[number], string> = {
  "Change approach":
    "Sure! Tell me what you’d like to change — the story, the style or the pacing — and I’ll take it in a new direction.",
  "Make a 30s version": "On it! I’ll extend this into a 30-second version with a few more shots.",
  "Try another model":
    "Sure! Send me the model photo you’d like to use, or I can generate a new one for you.",
};

export const DEMO_END = "Demo ends here. Tap Back.";

/** Muse prices the generation; YCA's credit gate / Buy page are not ported
 *  (product owner, 2026-10-28: "用 Muse 現有的那一套"). PLACEHOLDER until the
 *  Business Model names a Video Shorts price. */
export const COST_VIDEO_SHORT = 100;
