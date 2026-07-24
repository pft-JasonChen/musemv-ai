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
  { id: 2000, credits: 2000, price: "$59.99", sku: "ycm_2000_credits_sub_discount", badge: "BEST VALUE" },
  { id: 1000, credits: 1000, price: "$39.99", sku: "ycm_1000_credits_sub_discount", badge: "POPULAR" },
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

export const DEFAULT_CREDITS = 390;

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
}

// CR-02: Muse Pro plans (Business Model 2026-07-13, "Subscription Plans
// Proposal 1 — Benchmark Sondo, Final Decision" + "Subscription form" backend
// table). Two weekly tiers + one yearly; the credit allowance and its expiry
// follow the plan (weekly credits expire weekly, yearly credits expire yearly).
// Weekly Pro is the default-selected plan.
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "weekly", name: "Weekly", price: "$19.99", credits: 200, cadence: "Weekly", per: "week", sku: "subscribe_1_week_no_trial_ycm", badge: "MOST POPULAR" },
  { id: "weekly_pro", name: "Weekly Pro", price: "$29.99", credits: 1000, cadence: "Weekly", per: "week", sku: "subscribe_1_week_pro_no_trial_ycm", badge: "BEST VALUE" },
  { id: "yearly", name: "Yearly", price: "$59.99", credits: 2000, cadence: "Yearly", per: "year", sku: "subscribe_12_month_no_trial_ycm" },
];

/** Default-selected Muse Pro plan (Business Model: "Default on weekly pro"). */
export const DEFAULT_PLAN_ID: PlanId = "weekly_pro";

// The Muse Pro benefit list (app IAP). A per-plan "Credits Expire {cadence}"
// line is appended in SubscribeModal from the selected plan's cadence.
export const MUSE_PRO_FEATURES: string[] = [
  "MV without Watermark",
  "Enable Download MV & Song",
  "Priority AI Generation",
  "Commercial License",
];

export interface CreditTxn {
  id: number;
  label: string;
  date: string;
  /** Positive = credits added, negative = credits spent. */
  amount: number;
}

/** Recent credit ledger shown in the Credits Detail view (prototype seed). */
export const CREDIT_TRANSACTIONS: CreditTxn[] = [
  { id: 1, label: "Credit pack purchase", date: "2026-07-12", amount: 300 },
  { id: 2, label: "MV render — Neon City Nights", date: "2026-07-11", amount: -200 },
  { id: 3, label: "Song generation — Golden Hour", date: "2026-07-10", amount: -10 },
  { id: 4, label: "Scene regenerate — Electric Dreams", date: "2026-07-09", amount: -20 },
  { id: 5, label: "Daily sign-in bonus", date: "2026-07-09", amount: 20 },
  { id: 6, label: "Storyboard — Starfall Serenade", date: "2026-07-08", amount: -20 },
  { id: 7, label: "Welcome bonus", date: "2026-07-01", amount: 500 },
];
