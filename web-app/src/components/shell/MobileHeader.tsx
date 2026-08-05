"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { CreditPill } from "@/components/ui/CreditPill";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 2, Slice 2a / CH5) ──────────────
 *
 * Classes from `src/styles/designer/MobileHeader.css`, verbatim from DP. Shown
 * only below the phone cutover (DP's own `@media (max-width: 767px)`), where it
 * replaces the wordmark WA used to render inside `TopBar`.
 *
 * This is now the ONLY way to reach the account on a phone — Profile left the
 * bottom bar when it went 5 items → 3 (CH5), so the account button is load
 * bearing, not decoration.
 *
 * DP's version has two dead `<button>`s and no balance. Both are wired here:
 * the crown routes to the subscribe surface, the avatar to the account screen,
 * and the credit balance comes from `useCredits()` via CreditPill rather than
 * DP's hardcoded 390.
 */

const mask = (name: string) => {
  const url = `url("/assets/icons/ui/${name}.svg")`;
  return { maskImage: url, WebkitMaskImage: url };
};

export function MobileHeader() {
  const { loggedIn, subscribed } = useAuth();
  const { credits } = useCredits();
  const { locale } = useLocale();
  const t = useT();
  const profilePath = localePath(locale, "/profile");

  return (
    <header className="mobile-header">
      <p className="mobile-header__title">YouCam Muse</p>
      {loggedIn && <CreditPill credits={credits} />}
      {!subscribed && (
        <Link
          href={profilePath}
          className="mobile-header__subscribe"
          aria-label={t("profile.upgrade")}
        >
          <span
            className="mobile-header__subscribe-icon"
            style={mask("ic_crown")}
            aria-hidden="true"
          />
        </Link>
      )}
      <Link href={profilePath} className="mobile-header__account" aria-label={t("nav.account")}>
        <span
          className="mobile-header__account-icon"
          style={mask("ic_account")}
          aria-hidden="true"
        />
      </Link>
    </header>
  );
}
