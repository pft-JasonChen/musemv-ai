import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { jpn } from "./jpn";
import { kor } from "./kor";
import { cht } from "./cht";
import { chs } from "./chs";
import { deu } from "./deu";
import { fra } from "./fra";
import { esp } from "./esp";
import { ptg } from "./ptg";

export type { Dictionary };
export { en as EN };

/** English is complete; every other locale is a partial that falls back to English. */
export const DICTIONARIES: Record<Locale, Partial<Dictionary>> = {
  enu: en,
  jpn,
  kor,
  cht,
  chs,
  deu,
  fra,
  esp,
  ptg,
};
