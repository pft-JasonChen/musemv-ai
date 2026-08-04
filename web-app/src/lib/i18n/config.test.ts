// Locale model — the part RD inherits.
//
// WHY THIS FILE EXISTS
//   config.ts is C6 in the RD contract surface (§9): middleware, URL shape, and the
//   backend language parameter all key off it. contract.surface.test.ts freezes the
//   VALUES (which locales exist, what HTML_LANG maps to); nothing tested the LOGIC.
//   `matchLocale` in particular parses quality-ordered Accept-Language headers and has
//   Chinese script disambiguation — exactly the kind of code that looks right and is not.

import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  localePath,
  matchLocale,
  stripLocalePrefix,
} from "./config";

describe("isLocale", () => {
  it("accepts every declared locale and nothing else", () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
    for (const bad of ["en", "zh", "ENU", "ita", "", null, undefined]) {
      expect(isLocale(bad as string | null | undefined)).toBe(false);
    }
  });
});

describe("localePath", () => {
  it("serves English unprefixed and prefixes every other locale", () => {
    expect(localePath("enu", "/profile")).toBe("/profile");
    expect(localePath("jpn", "/profile")).toBe("/jpn/profile");
  });

  it("handles the root path in both directions", () => {
    expect(localePath("enu", "/")).toBe("/");
    expect(localePath("jpn", "/")).toBe("/jpn");
    expect(localePath("enu", "")).toBe("/");
    expect(localePath("cht", "")).toBe("/cht");
  });

  it("tolerates a path with no leading slash", () => {
    expect(localePath("kor", "settings")).toBe("/kor/settings");
  });

  it("round-trips with stripLocalePrefix for every locale", () => {
    for (const l of LOCALES) {
      expect(stripLocalePrefix(localePath(l, "/history"))).toBe("/history");
      expect(stripLocalePrefix(localePath(l, "/"))).toBe("/");
    }
  });
});

describe("stripLocalePrefix", () => {
  it("leaves an unprefixed path alone", () => {
    expect(stripLocalePrefix("/history")).toBe("/history");
    expect(stripLocalePrefix("/")).toBe("/");
  });

  it("does not strip a segment that merely looks locale-ish", () => {
    // "explore" is not a locale; stripping it would break the route.
    expect(stripLocalePrefix("/explore/mvs")).toBe("/explore/mvs");
  });

  it("drops a trailing slash left behind by the strip", () => {
    expect(stripLocalePrefix("/jpn/")).toBe("/");
    expect(stripLocalePrefix("/jpn/history/")).toBe("/history");
  });
});

describe("matchLocale", () => {
  it("falls back to English on empty or absent headers", () => {
    expect(matchLocale(null)).toBe(DEFAULT_LOCALE);
    expect(matchLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(matchLocale("")).toBe(DEFAULT_LOCALE);
    expect(matchLocale("xx-YY,zz")).toBe(DEFAULT_LOCALE);
  });

  it("honours q-ordered preference rather than document order", () => {
    // German listed first but ranked lower — Japanese must win.
    expect(matchLocale("de;q=0.3,ja;q=0.9")).toBe("jpn");
    expect(matchLocale("fr,de;q=0.8")).toBe("fra");
  });

  it("skips unsupported tags and takes the best supported one", () => {
    expect(matchLocale("it;q=1.0,tr;q=0.9,es;q=0.5")).toBe("esp");
  });

  it("disambiguates Chinese by script and region", () => {
    expect(matchLocale("zh-TW")).toBe("cht");
    expect(matchLocale("zh-Hant")).toBe("cht");
    expect(matchLocale("zh-HK")).toBe("cht");
    expect(matchLocale("zh-CN")).toBe("chs");
    expect(matchLocale("zh-Hans")).toBe("chs");
    expect(matchLocale("zh-SG")).toBe("chs");
    expect(matchLocale("zh")).toBe("chs"); // bare zh => Simplified
  });

  it("is case-insensitive and tolerates whitespace", () => {
    expect(matchLocale("  JA-JP , en ; q=0.1 ")).toBe("jpn");
    expect(matchLocale("ZH-TW")).toBe("cht");
  });

  it("treats a malformed q value as the default weight instead of throwing", () => {
    expect(matchLocale("ko;q=notanumber,ja;q=0.5")).toBe("kor");
  });

  it("maps every primary subtag the product supports", () => {
    const expected: Record<string, string> = {
      en: "enu", ja: "jpn", ko: "kor", de: "deu", fr: "fra", es: "esp", pt: "ptg",
    };
    for (const [tag, locale] of Object.entries(expected)) {
      expect(matchLocale(tag)).toBe(locale);
      expect(matchLocale(`${tag}-XX`)).toBe(locale); // region suffix ignored
    }
  });
});
