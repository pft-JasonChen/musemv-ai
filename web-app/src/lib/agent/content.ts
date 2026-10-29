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

export type PickerSheet = "recents" | "product";

export const PICKER: Record<
  PickerSheet,
  { title: string; album: number; rows: number; cell: (r: number, c: number) => string }
> = {
  recents: { title: "Recents", album: 0, rows: 5, cell: (r, c) => media(`pk/r${r}${c}.jpg`) },
  product: { title: "Sample Photos", album: 1, rows: 4, cell: (r, c) => media(`pk/p${r}${c}.jpg`) },
};

export const PICKER_ALBUMS = ["Recents", "Sample Photos", "Favorite", "Selfie"];

/** Hinted cell per demo (row, col). From the launcher every cell returns the
 *  flow's fixed photo; the hint just points at the one that matches it. */
export const PICK_CELL = {
  pet: [2, 1],
  bag: [1, 0],
  model: [2, 0],
  ugcProduct: [2, 2],
} as const satisfies Record<string, readonly [number, number]>;

/* ── Templates (handoff §1.3; YCA Creator / Marketer tabs) ────────────────── */

const LABEL: Record<string, string> = {
  ballet: "Ballet",
  breaking: "Breaking",
  "group-dance": "Group Dance",
  "pet-diary": "Pet Diary",
  "outer-space-journey": "Outer Space Journey",
  "royal-court-drama": "Royal Court Drama",
  "fantasy-anime": "Fantasy Anime",
  "supernatural-action": "Supernatural Action",
  "mystery-thriller": "Mystery Thriller",
  "product-detail-demo": "Polished Bag",
  "luxe-product-reveal": "Luxe Product Reveal",
  "product-demo-jewelry": "Product Demo Jewelry",
  "close-up-demo": "Close-up Demo",
  "product-demo-car": "Product Demo Car",
  "product-feature-demo": "Product Feature Demo",
  "ugc-hand-gesture": "UGC with Hand Gesture",
  "home-shopping-demo": "Home Shopping Demo",
  "skin-renewal-effect": "Skin Renewal Effect",
  "product-demo-watch": "Product Demo Watch",
  "beauty-brian": "Beauty Brian",
  "beauty-natalie": "Beauty Natalie",
  "electronics-steven": "Electronics Steven",
  "fashion-trevor": "Fashion Trevor",
  "commercial-display": "Commercial Display",
  "nature-bloom": "Nature Bloom",
  "woodland-swing": "Woodland Swing",
  "themed-sale-display": "Themed Sale Display",
  "themed-sale-unbox": "Themed Sale Unbox",
  "themed-sale-hightech": "Themed Sale High-Tech",
  "fashion-erica": "Fashion Erica",
  "fashion-kian": "Fashion Kian",
  "fashion-ava": "Fashion Ava",
  "fashion-lara": "Fashion Lara",
  "foodie-kevin": "Foodie Kevin",
  "foodie-amy": "Foodie Amy",
  "foodie-kira": "Foodie Kira",
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
      rail("Fashion Speaker", ["fashion-erica", "fashion-kian", "fashion-ava", "fashion-lara"]),
      rail("Foodie Lover", ["foodie-kevin", "foodie-amy", "foodie-kira"]),
    ],
  },
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
