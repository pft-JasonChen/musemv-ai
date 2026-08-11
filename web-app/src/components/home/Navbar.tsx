"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { localePath, LOCALES, LOCALE_NAMES } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";

/**
 * DP's `Navbar` (Figma "Navbar", node 1330:22661) — the marketing header used
 * only on the landing page (`/`). `/` is the one route AppShell does not give
 * OWN_CHROME (see AppShell.tsx — `path.startsWith(r)` can never match "/" for
 * any real route prefix), so it used to fall through to the legacy `TopBar`.
 * This replaces that fallback for "/" specifically; `TopBar` itself is
 * untouched in case another unmigrated route ever needs it again.
 *
 * Classes are from `src/styles/designer/Navbar.css`, verbatim from DP.
 *
 * ── WHAT'S ADAPTED, NOT PORTED VERBATIM ──────────────────────────────────
 * DP's language picker is mock UI — its own CSS comment says so, and it just
 * sets local component state that goes nowhere. WA has real i18n (9 locales,
 * `localePath`/`setLocale`), so the picker below is the same markup wired to
 * the real thing instead of a second, fake switcher living next to it.
 *
 * DP's signed-in cluster (CreditBalance + UpgradeButton) follows the same
 * pattern already used in DetailNavbar.tsx: `localePath` on every internal
 * link, DP has no `AuthProvider` at all so it just navigates.
 *
 * "Start for Free" does NOT `requireLogin` (2026-08-07, designer request) —
 * unlike the Hero/Tool-selector CTAs elsewhere on Home, this one has to let a
 * guest actually reach `/mv/room` and compose before deciding to sign in, or
 * it is indistinguishable from every other gated button on the page. `/mv/room`
 * dropped its `AuthGuard` to match; the gate now sits on that page's own
 * "Create Music Video" button, the action that actually costs credits.
 */
function LanguagePicker() {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="navbar__lang" ref={wrapperRef}>
      <button
        type="button"
        className="button button--medium button--tertiary"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="button__label">{LOCALE_NAMES[locale].native}</span>
        <DpIcon name="ic_chevron-down" className="button__icon button__icon--mask" />
      </button>

      {isOpen && (
        <ul className="navbar__lang-menu">
          {LOCALES.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                className={`navbar__lang-option${loc === locale ? " navbar__lang-option--active" : ""}`}
                onClick={() => {
                  setLocale(loc);
                  setIsOpen(false);
                }}
              >
                {LOCALE_NAMES[loc].native}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Navbar() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useT();
  const { loggedIn, subscribed, openSignIn } = useAuth();
  const { openSubscribe, openBuyCredits } = useSubscribe();
  const { credits } = useCredits();

  function startForFree() {
    router.push(localePath(locale, "/mv/room"));
  }

  return (
    <header className="navbar">
      <div className="navbar__actions">
        {loggedIn ? (
          <>
            {/* Designer fix, 2026-08-11: was `<Link href="/profile">` — same
                no-op-on-/profile bug as RoomNavbar/DetailNavbar's identical
                cluster (this is the fourth copy of it, on the one route
                those two don't cover). Opens the shared dialogs directly
                now, via SubscribeProvider — see its comment. */}
            <button
              type="button"
              className="credit-balance"
              aria-label={t("profile.credits")}
              onClick={() => openBuyCredits()}
            >
              {/* `.credit-balance img` — an element selector, no mask. See DetailNavbar's note. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/ui/ic_credit.svg" alt="" />
              <span data-testid="credit-balance">{credits}</span>
              <DpIcon name="ic_add" className="credit-balance__add" />
            </button>
            {!subscribed && (
              <button type="button" className="upgrade-button" onClick={() => openSubscribe()}>
                <DpIcon name="ic_crown" className="upgrade-button__icon" />
                {t("nav.upgrade")}
              </button>
            )}
          </>
        ) : (
          <>
            <LanguagePicker />
            <button type="button" className="button button--medium button--tertiary" onClick={() => openSignIn()}>
              <span className="button__label">Login</span>
            </button>
            <button type="button" className="button button--medium button--primary" onClick={startForFree}>
              <DpIcon name="ic_arrow_right" className="button__icon button__icon--mask" />
              <span className="button__label">Start for Free</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
