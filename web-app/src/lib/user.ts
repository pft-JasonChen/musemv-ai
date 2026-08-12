export interface CreditPack {
  id: number;
  credits: number;
  price: string;
  /** Store SKU (Business Model "Credit form", ycm_*_sub_discount). */
  sku: string;
  badge?: "POPULAR" | "BEST VALUE";
}

// CR-02: credit packs, prices, and SKUs are the as-approved values from the
// YouCam Muse Business Model (2026-07-13) — "Credit form" backend table
// ("price 須跟後台一樣"). Credits are subscriber-only (see CreditsProvider/BuyCreditsModal).
// Displayed largest→smallest to match the app IAP; BEST VALUE (2000) is the default
// selection and POPULAR is pinned to the 1000 pack. Packs are valid for 2 years.
export const CREDIT_PACKS: CreditPack[] = [
  { id: 8000, credits: 8000, price: "$239.99", sku: "ycm_ios_8000_credits_sub_discount" },
  { id: 5000, credits: 5000, price: "$148.99", sku: "ycm_ios_5000_credits_sub_discount" },
  {
    id: 2000,
    credits: 2000,
    price: "$59.99",
    sku: "ycm_2000_credits_sub_discount",
    badge: "BEST VALUE",
  },
  {
    id: 1000,
    credits: 1000,
    price: "$39.99",
    sku: "ycm_1000_credits_sub_discount",
    badge: "POPULAR",
  },
  { id: 600, credits: 600, price: "$23.99", sku: "ycm_600_credits_sub_discount" },
  { id: 300, credits: 300, price: "$14.99", sku: "ycm_300_credits_sub_discount" },
];

/** Default-selected credit pack (BEST VALUE, per the Business Model). */
export const DEFAULT_CREDIT_PACK_ID = 2000;

// TBD-CR-07 (SAMPLE): illustrates the Business Model discount presentation — a
// struck-through original price + a "% off" badge. This is a demo of the UI
// only, not a committed promotion; RD owns the real discount rules and values.
// Set to 0 to show list prices without the sale treatment.
export const CREDIT_SALE_PCT = 20;

/** Sale price string for a list price at CREDIT_SALE_PCT off (e.g. "$59.99" → "$47.99"). */
export function salePrice(price: string): string {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return "$" + (n * (1 - CREDIT_SALE_PCT / 100)).toFixed(2);
}

/**
 * Discount % for display, rounded UP to the nearest 5 (Business Model rule:
 * "捨棄小數…往上級距取整, 5 or 0 結尾" — e.g. 19.2 → 20, 11 → 15, 17 → 20).
 */
export function displayDiscountPct(pct: number): number {
  return Math.ceil(pct / 5) * 5;
}

export const MOCK_USER = {
  name: "Scott Wu",
  email: "scott_wu@mail.com",
};

/**
 * Starting balance for a signed-in free account — **the product rule**.
 *
 * 10 by product decision 2026-08-12 (`TBD-CR-06a`). Was `390`, which existed only
 * so the demo stayed playable before CR-06 made credit packs subscriber-only.
 *
 * ⚠️ **10 does not cover any MV.** The cheapest MV path is 220 (`COST_STORYBOARD`
 * 20 + `COST_RENDER` 200) and an instrumental song is 12, so a fresh free account
 * can generate exactly one vocal song (6) and then meets the paywall. That is the
 * intended funnel — and it is why `startingCredits()` below exists.
 */
export const DEFAULT_CREDITS = 10;

/** Env var that overrides the starting balance for demo builds. */
export const DEMO_CREDITS_ENV = "NEXT_PUBLIC_DEMO_CREDITS";

/**
 * Starting balance actually used by `CreditsProvider`.
 *
 * `DEFAULT_CREDITS` is the product rule; this is the rule **plus a demo escape
 * hatch**, added 2026-08-12 because those two needs genuinely conflict in a
 * backend-less prototype:
 *
 * - the real free-tier grant should meet the paywall almost immediately, and
 * - `AGENTS.md` calls this a **CEO-demoable** prototype, which means walking the
 *   whole MV flow without stopping to subscribe.
 *
 * Set `NEXT_PUBLIC_DEMO_CREDITS=1000` for a demo build and the flow runs end to
 * end; leave it unset and every user sees the real rule. Nothing else changes —
 * no UI branch, no debug affordance, and the value is not readable from the URL.
 *
 * `process.env.NEXT_PUBLIC_*` is inlined by Next at build time, so this must stay
 * a literal member access — do not refactor it to `process.env[DEMO_CREDITS_ENV]`,
 * which would silently always be `undefined` in the browser bundle.
 */
export function startingCredits(): number {
  const raw = process.env.NEXT_PUBLIC_DEMO_CREDITS;
  const n = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_CREDITS;
}

/** Sample avatar photos cycled by the profile "Change Photo" action (mock upload). */
export const AVATAR_SAMPLES = [
  "/assets/images/character-photos/samples/Sample_P1.jpg",
  "/assets/images/character-photos/samples/Sample_P2.jpg",
  "/assets/images/character-photos/samples/Sample_P3.jpg",
  "/assets/images/character-photos/samples/Sample_P4.jpg",
  "/assets/images/character-photos/samples/Sample_P5.jpg",
  "/assets/images/character-photos/samples/Sample_P6.jpg",
];

export type PlanId = "weekly" | "weekly_pro" | "yearly";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price: string;
  /** Credits granted per cycle. */
  credits: number;
  /** How the credit allowance is described / when it expires: "Weekly" or "Yearly". */
  cadence: "Weekly" | "Yearly";
  /** Billing-period suffix shown after the price (e.g. "week"). */
  per: string;
  /** Store SubscriptionID (Business Model "Subscription form"). */
  sku: string;
  badge?: string;
  /**
   * One-line pitch under the plan name. Added in slice 3f — DP's `UpgradeDialog`
   * shows one per card and WA had nowhere to put the text. Copy is DP's; the
   * prices next to it are still WA's (S20).
   */
  description: string;
  /**
   * Which of DP's three CTA treatments this card uses
   * (`.upgrade-dialog__cta--{default|gradient|white}`). Card-level styling is
   * per-plan in the Figma, not derived from selection state.
   */
  cta: "default" | "gradient" | "white";
  /** DP's `--featured` card (raised border + emphasis). */
  featured?: boolean;
}

// CR-02: Muse Pro plans (Business Model 2026-07-13, "Subscription Plans
// Proposal 1 — Benchmark Sondo, Final Decision" + "Subscription form" backend
// table). Two weekly tiers + one yearly; the credit allowance and its expiry
// follow the plan (weekly credits expire weekly, yearly credits expire yearly).
// Weekly Pro is the default-selected plan.
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "weekly",
    name: "Weekly",
    price: "$19.99",
    credits: 200,
    cadence: "Weekly",
    per: "week",
    sku: "subscribe_1_week_no_trial_ycm",
    badge: "MOST POPULAR",
    description: "Everything you need to start creating.",
    cta: "default",
  },
  {
    id: "weekly_pro",
    name: "Weekly Pro",
    price: "$29.99",
    credits: 1000,
    cadence: "Weekly",
    per: "week",
    sku: "subscribe_1_week_pro_no_trial_ycm",
    badge: "BEST VALUE",
    // DP's copy, and it happens to be arithmetically true of WA's numbers too:
    // 1,000 vs Weekly's 200 is exactly 5x.
    description: "5x the credits, create more freely.",
    cta: "gradient",
    featured: true,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$59.99",
    credits: 2000,
    cadence: "Yearly",
    per: "year",
    sku: "subscribe_12_month_no_trial_ycm",
    description: "Every feature unlocked, all year.",
    cta: "white",
  },
];

/** Default-selected Muse Pro plan (Business Model: "Default on weekly pro"). */
export const DEFAULT_PLAN_ID: PlanId = "weekly_pro";

// The Muse Pro benefit list (app IAP). A per-plan "Credits Expire {cadence}"
// line is appended in SubscribeModal from the selected plan's cadence.
//
// Slice 3f paired each line with DP's icon (`ic_*` under
// `public/assets/icons/ui/`) — DP's UpgradeDialog draws one per row and the
// labels already matched one-for-one, so this is a widening, not a rewrite.
export interface ProFeature {
  label: string;
  icon: string;
}

export const MUSE_PRO_FEATURES: ProFeature[] = [
  { label: "MV without Watermark", icon: "ic_video_ai" },
  { label: "Enable Download MV & Song", icon: "ic_download" },
  { label: "Priority AI Generation", icon: "ic_flash" },
  { label: "Commercial License", icon: "ic_shield_check" },
];

/** DP gives the yearly card one benefit the weekly cards do not have. */
export const YEARLY_EXTRA_FEATURES: ProFeature[] = [
  { label: "First Access to New Features", icon: "ic_star" },
];

export interface CreditTxn {
  id: number;
  label: string;
  date: string;
  /** Positive = credits added, negative = credits spent. */
  amount: number;
  /**
   * Icon filename for the ledger row (slice 3f). DP draws a per-kind icon and
   * WA's rows had none, so every row carries one now. `ic_credit` is special:
   * DP renders it as a plain `<img>` so the coin keeps its gold instead of
   * being tinted white by the shared `currentColor` mask.
   */
  icon: string;
}

/** Recent credit ledger shown in the Credits Detail view (prototype seed). */
export const CREDIT_TRANSACTIONS: CreditTxn[] = [
  { id: 1, label: "Credit pack purchase", date: "2026-07-12", amount: 300, icon: "ic_credit" },
  {
    id: 2,
    label: "MV render — Neon City Nights",
    date: "2026-07-11",
    amount: -200,
    icon: "ic_video_ai",
  },
  {
    id: 3,
    label: "Song generation — Golden Hour",
    date: "2026-07-10",
    amount: -10,
    icon: "ic_song_ai",
  },
  {
    id: 4,
    label: "Scene regenerate — Electric Dreams",
    date: "2026-07-09",
    amount: -20,
    icon: "ic_script",
  },
  { id: 5, label: "Daily sign-in bonus", date: "2026-07-09", amount: 20, icon: "ic_gift" },
  {
    id: 6,
    label: "Storyboard — Starfall Serenade",
    date: "2026-07-08",
    amount: -20,
    icon: "ic_script",
  },
  { id: 7, label: "Welcome bonus", date: "2026-07-01", amount: 500, icon: "ic_gift" },
];
