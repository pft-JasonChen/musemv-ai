// Locale model for the 9 supported languages. URL-facing codes are lowercase
// versions of the product locale codes (ENU/JPN/…). Everything is pure so it
// can be imported from middleware (edge runtime) as well as client components.

export const LOCALES = ["enu", "jpn", "kor", "cht", "chs", "deu", "fra", "esp", "ptg"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "enu";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Native + English display names for the language picker. */
export const LOCALE_NAMES: Record<Locale, { native: string; english: string }> = {
  enu: { native: "English", english: "English" },
  jpn: { native: "日本語", english: "Japanese" },
  kor: { native: "한국어", english: "Korean" },
  cht: { native: "繁體中文", english: "Chinese (Traditional)" },
  chs: { native: "简体中文", english: "Chinese (Simplified)" },
  deu: { native: "Deutsch", english: "German" },
  fra: { native: "Français", english: "French" },
  esp: { native: "Español", english: "Spanish" },
  ptg: { native: "Português", english: "Portuguese" },
};

/** BCP-47 tag used for the <html lang> attribute per locale. */
export const HTML_LANG: Record<Locale, string> = {
  enu: "en",
  jpn: "ja",
  kor: "ko",
  cht: "zh-Hant",
  chs: "zh-Hans",
  deu: "de",
  fra: "fr",
  esp: "es",
  ptg: "pt",
};

/**
 * Build a path for a locale. English (the default) is served UNPREFIXED, every
 * other locale is prefixed: localePath("jpn", "/profile") → "/jpn/profile",
 * localePath("enu", "/profile") → "/profile".
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path === "" ? "/" : path;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === "/") return `/${locale}`;
  return `/${locale}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

/** Split a leading locale segment off a pathname. Returns the path without it. */
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    const rest = "/" + parts.slice(2).join("/");
    return rest === "/" ? "/" : rest.replace(/\/+$/, "");
  }
  return pathname || "/";
}

function tagToLocale(tag: string): Locale | null {
  // Chinese needs script/region disambiguation before the primary-subtag fallback.
  if (tag.startsWith("zh")) {
    if (/zh-(hant|tw|hk|mo)/.test(tag)) return "cht";
    return "chs"; // zh, zh-cn, zh-hans, zh-sg → Simplified
  }
  switch (tag.split("-")[0]) {
    case "en": return "enu";
    case "ja": return "jpn";
    case "ko": return "kor";
    case "de": return "deu";
    case "fr": return "fra";
    case "es": return "esp";
    case "pt": return "ptg";
    default: return null;
  }
}

/**
 * Pick the best locale from an Accept-Language header value, honouring the
 * client's quality-ordered preference list. Falls back to English.
 */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const tags = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .filter(Boolean);
  for (const tag of tags) {
    const match = tagToLocale(tag);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
