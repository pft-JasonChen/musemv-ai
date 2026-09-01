export interface CreditPack {
  id: number;
  credits: number;
  price: string;
  /** Store SKU (Business Model "Credit form", ycm_*_sub_discount). */
  sku: string;
  badge?: "POPULAR" | "BEST VALUE";
}

// CR-02: credit packs, prices, and SKUs.
//
// ⚠️ **PRICES UPDATED 2026-09-01 from "YCM Web SKUs & Pricing: Final"
// (Data & Monetization, dated 2026/09/08, slide headed "YCM FINAL Pricing
// (confirmed)").** That deck supersedes the 2026-07-13 Business Model for the
// WEB packs, and it is a different price list, not a restatement — five of the
// six moved, and one moved by $5.50:
//
//     credits   was (Business Model)   now (Web Final)
//        300           $14.99                $14.89
//        600           $23.99                $29.59
//      1,000           $39.99                $39.59
//      2,000           $59.99                $65.49
//      5,000          $148.99               $140.49
//      8,000          $239.99               $224.49
//
// The old numbers were the **APP** column of that same deck's comparison
// ($16.49/$32.99/$43.99/$76.99/$164.99/$263.99 are the app's own, different
// again) — web and app are priced separately and must not be reconciled.
//
// The deck's "net rev" and "*40% off / *45% off" columns are INTERNAL
// monetization figures (net rev is uniformly 90% of list; the %-off is the
// discount ceiling Monetization may offer, +5% at 20k and above). Neither is a
// price to render — `CREDIT_SALE_PCT` below is still the sample discount UI.
//
// SKUs are unchanged: the deck lists prices, not store identifiers, so the
// 2026-07-13 SKUs stand until RD supplies web ones (TBD-CR-11).
//
// Credits are subscriber-only (see CreditsProvider/BuyCreditsModal), which the
// deck independently confirms ("free user can buy? ✗"). Displayed
// largest→smallest to match the app IAP; BEST VALUE (2000) is the default
// selection and POPULAR is pinned to the 1000 pack. Packs are valid for
// 2 years (deck: "Expiration — 2 years").
export const CREDIT_PACKS: CreditPack[] = [
  { id: 8000, credits: 8000, price: "$224.49", sku: "ycm_ios_8000_credits_sub_discount" },
  { id: 5000, credits: 5000, price: "$140.49", sku: "ycm_ios_5000_credits_sub_discount" },
  {
    id: 2000,
    credits: 2000,
    price: "$65.49",
    sku: "ycm_2000_credits_sub_discount",
    badge: "BEST VALUE",
  },
  {
    id: 1000,
    credits: 1000,
    price: "$39.59",
    sku: "ycm_1000_credits_sub_discount",
    badge: "POPULAR",
  },
  { id: 600, credits: 600, price: "$29.59", sku: "ycm_600_credits_sub_discount" },
  { id: 300, credits: 300, price: "$14.89", sku: "ycm_300_credits_sub_discount" },
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

export type PlanId =
  | "weekly_basic"
  | "weekly_pro"
  | "monthly_basic"
  | "monthly_pro"
  | "yearly_basic"
  | "yearly_pro";

/** Also the Tab Bar label and the "Credits Expire {cadence}" feature line. */
export type PlanCadence = "Weekly" | "Monthly" | "Yearly";

export interface SubscriptionPlan {
  id: PlanId;
  cadence: PlanCadence;
  /** Drives the PRO chip, the gradient CTA/card-border, and the badge choice
   *  — no separate `cta`/`featured` fields; both are just `tier === "pro"`. */
  tier: "basic" | "pro";
  /** Card heading — just the cadence word; the PRO chip renders separately. */
  name: string;
  price: string;
  /** Credits granted per cycle. */
  credits: number;
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
}

// CR-02: Muse Pro plans. Product owner, 2026-08-28, Figma "IAP — Subscribe
// Plan_{Weekly,Monthly,Yearly} - Card_L" (+ tablet/mobile "List_M" twins):
// a duration Tab Bar (Weekly/Monthly/Yearly) replacing the old flat 3-card
// list, each duration offering exactly two tiers (Basic/Pro).
//
// ⚠️ S20 applies only PARTIALLY here. Weekly Basic/Pro and Yearly Basic match
// the Business Model (2026-07-13) exactly — $9.99/200cr, $29.99/1,000cr,
// $59.99/2,000cr — which also means the OLD `weekly` entry's $19.99 here
// before this change was simply wrong, not a deliberate DP-vs-Business-Model
// override; it's corrected to $9.99 in the same change. Monthly (both tiers)
// and Yearly Pro had NO Business Model entry at all — that document predates
// this Tab Bar redesign — so those four prices/skus came from Figma alone.
//
// ✅ **RESOLVED 2026-09-01.** "YCM Web SKUs & Pricing: Final" (Data &
// Monetization, 2026/09/08, "YCM FINAL Pricing (confirmed)") is the missing
// second source, and **all six rows match this table exactly** — including the
// four that previously had none:
//
//     Weekly      $9.99    200 /week      Weekly Pro   $29.99  1,000 /week
//     Monthly    $34.99  1,000 /month     Monthly Pro  $49.99  2,000 /month
//     Yearly     $59.99  2,000 /year      Yearly Pro   $89.99  4,000 /year
//
// So nothing here changes; the flag above is cleared rather than acted on. The
// deck also confirms two rules this file's neighbours already encode: credits
// expire "on each plan renewal", and there is **no free trial** (which is why
// every `sku` carries `no_trial`). SKUs remain Figma's — the deck lists no
// store identifiers (TBD-CR-11).
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "weekly_basic",
    cadence: "Weekly",
    tier: "basic",
    name: "Weekly",
    price: "$9.99",
    credits: 200,
    per: "week",
    sku: "subscribe_1_week_no_trial_ycm",
    badge: "MOST POPULAR",
    description: "Everything you need to start creating.",
  },
  {
    id: "weekly_pro",
    cadence: "Weekly",
    tier: "pro",
    name: "Weekly",
    price: "$29.99",
    credits: 1000,
    per: "week",
    sku: "subscribe_1_week_pro_no_trial_ycm",
    badge: "BEST VALUE",
    // DP's copy, and it happens to be arithmetically true of WA's numbers too:
    // 1,000 vs Weekly's 200 is exactly 5x.
    description: "5x the credits, create more freely.",
  },
  {
    id: "monthly_basic",
    cadence: "Monthly",
    tier: "basic",
    name: "Monthly",
    price: "$34.99",
    credits: 1000,
    per: "month",
    // Not in the 2026-07-13 Business Model — see the note above. Follows the
    // existing "subscribe_{duration}_no_trial_ycm" naming, unconfirmed by RD.
    sku: "subscribe_1_month_no_trial_ycm",
    description: "Everything you need to start creating.",
  },
  {
    id: "monthly_pro",
    cadence: "Monthly",
    tier: "pro",
    name: "Monthly",
    price: "$49.99",
    credits: 2000,
    per: "month",
    sku: "subscribe_1_month_pro_no_trial_ycm",
    badge: "BEST VALUE",
    description: "5x the credits, create more freely.",
  },
  {
    id: "yearly_basic",
    cadence: "Yearly",
    tier: "basic",
    name: "Yearly",
    price: "$59.99",
    credits: 2000,
    per: "year",
    sku: "subscribe_12_month_no_trial_ycm",
    description: "Every feature unlocked, all year.",
  },
  {
    id: "yearly_pro",
    cadence: "Yearly",
    tier: "pro",
    name: "Yearly",
    price: "$89.99",
    credits: 4000,
    per: "year",
    // Not in the Business Model — see the note above.
    sku: "subscribe_12_month_pro_no_trial_ycm",
    badge: "BEST VALUE",
    // Figma repeats the Basic card's copy verbatim for Yearly Pro (unlike the
    // other two durations, where Pro gets its own "5x the credits" line) —
    // kept as designed, not a copy-paste slip to fix.
    description: "Every feature unlocked, all year.",
  },
];

/** Default-selected duration tab. */
export const DEFAULT_DURATION: PlanCadence = "Weekly";

/** Default-selected Muse Pro plan (Business Model: "Default on weekly pro"). */
export const DEFAULT_PLAN_ID: PlanId = "weekly_pro";

/**
 * "Weekly" / "Weekly Pro" — `plan.name` alone is just the cadence (the PRO
 * chip on `SubscribeModal`'s cards renders "Pro" separately), but a subscriber's
 * plan name shown elsewhere (`Sidebar`, `ProfileView`) has nowhere to put a
 * chip and needs the tier spelled out in the string itself.
 */
export function planDisplayName(plan: Pick<SubscriptionPlan, "name" | "tier">): string {
  return plan.tier === "pro" ? `${plan.name} Pro` : plan.name;
}

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
