"use client";

// Active-locale context. The locale comes from the URL ([locale] segment) and
// is passed in by the server layout. `t(key)` returns the active translation,
// falling back to English when the key is missing or empty. `setLocale` writes
// the NEXT_LOCALE cookie (so middleware honours the choice on unprefixed paths)
// and navigates to the same path under the new locale prefix.

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DICTIONARIES, EN } from "@/lib/i18n/dictionaries";
import type { TKey } from "@/lib/i18n/dictionaries/en";
import { HTML_LANG, localePath, LOCALES, stripLocalePrefix, type Locale } from "@/lib/i18n/config";

interface LocaleValue {
  locale: Locale;
  t: (key: TKey) => string;
  setLocale: (next: Locale) => void;
}

const Ctx = createContext<LocaleValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Keep <html lang> in sync with the active locale for a11y/SEO.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const t = useCallback(
    (key: TKey): string => {
      const value = DICTIONARIES[locale]?.[key];
      return value && value.length > 0 ? value : EN[key];
    },
    [locale],
  );

  const setLocale = useCallback(
    (next: Locale) => {
      // 1 year; honoured by middleware for any unprefixed navigation.
      document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
      // Rebuild the current path under the target locale (English stays unprefixed).
      router.push(localePath(next, stripLocalePrefix(pathname)));
    },
    [pathname, router],
  );

  const value = useMemo<LocaleValue>(() => ({ locale, t, setLocale }), [locale, t, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocale must be used within LocaleProvider");
  return v;
}

/** Convenience hook for components that only need the translate function. */
export function useT() {
  return useLocale().t;
}

// Re-export so consumers can import the locale list from the provider module.
export { LOCALES };
