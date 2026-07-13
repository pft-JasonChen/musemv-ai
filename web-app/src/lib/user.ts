export interface CreditPack {
  id: number;
  credits: number;
  price: string;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 1, credits: 100, price: "$0.99" },
  { id: 2, credits: 300, price: "$2.49", popular: true },
  { id: 3, credits: 600, price: "$4.49" },
  { id: 4, credits: 1000, price: "$6.49" },
];

export const MOCK_USER = {
  name: "Scott Wu",
  email: "scott_wu@mail.com",
};

export const DEFAULT_CREDITS = 390;

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
