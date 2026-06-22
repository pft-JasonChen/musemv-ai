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
