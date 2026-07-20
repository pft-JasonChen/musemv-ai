import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, matchLocale } from "@/lib/i18n/config";

// Locale routing with an UNPREFIXED default (English):
//   /profile        → English, rewritten internally to /enu/profile
//   /jpn/profile    → Japanese, served as-is
//   /enu/profile    → canonicalised (redirect) to /profile
// Locale is chosen from: NEXT_LOCALE cookie → Accept-Language → English.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const seg = pathname.split("/")[1];

  // A non-default locale is explicitly in the URL → serve it.
  if (isLocale(seg) && seg !== DEFAULT_LOCALE) return NextResponse.next();

  // The default locale should never be visible in the URL → strip it.
  if (seg === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(`/${DEFAULT_LOCALE}`.length) || "/";
    return NextResponse.redirect(url);
  }

  // No locale prefix. Resolve the intended locale.
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  const target = isLocale(cookieLocale) ? cookieLocale : matchLocale(req.headers.get("accept-language"));

  const url = req.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  // English: rewrite (URL stays clean). Other locales: redirect to the prefix.
  return target === DEFAULT_LOCALE ? NextResponse.rewrite(url) : NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, and any path containing a dot (static files).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
