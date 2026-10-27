import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { deu } from "./deu";
import { esp } from "./esp";
import { fra } from "./fra";
import { hi } from "./hi";
import { id } from "./id";
import { jpn } from "./jpn";
import { kor } from "./kor";
import { ptg } from "./ptg";
import { cht } from "./cht";
import { chs } from "./chs";

export type { Dictionary };
export { en as EN };

/** English is complete; every other locale is a partial that falls back to English. */
export const DICTIONARIES: Record<Locale, Partial<Dictionary>> = {
  deu,
  enu: en,
  esp,
  fra,
  hi,
  id,
  jpn,
  kor,
  ptg,
  cht,
  chs,
};
