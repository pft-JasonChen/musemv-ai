"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { hasInAppHistory } from "@/lib/navHistory";
import { DpIcon } from "@/components/ui/DpIcon";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, /explore/mvs slice / CH2) ─────
 *
 * The back-bearing counterpart to RoomNavbar. Slice 2b deliberately did NOT build
 * this — with no detail screen migrated yet, its interface would have been
 * guesswork. It lands here, with its first real caller.
 *
 * Classes from `src/styles/designer/DetailNavbar.css` + CreditBalance /
 * UpgradeButton, verbatim from DP. Sticky, so a migrated view renders it as its
 * own first child exactly like RoomNavbar (see that file for why App Router
 * cannot use DP's navbar-as-a-prop arrangement).
 *
 * ── Q6: WHAT "BACK" MEANS ───────────────────────────────────────────────────
 *
 * This is the first implementation of the plan's back-navigation decision, so it
 * is worth being precise about it.
 *
 * DP encodes the origin in the URL (`?from=history`) and renders a plain link to
 * it. Q6 rejects that: a caller that forgets the parameter silently degrades to
 * "back = home", and the parameter travels into any URL the user copies or
 * shares. So: `router.back()`, with a fallback to the section entry when there is
 * no history to go back to.
 *
 * "Is there history to go back to" comes from `hasInAppHistory()` — a count of
 * client-side route changes since page load. The obvious alternative,
 * `window.history.length`, is wrong and was measured to be wrong: it counts the
 * entry the app replaced, so a tab opened straight onto this URL still claims
 * history and Back walks out of the app entirely. See `src/lib/navHistory.ts`.
 *
 * It is read inside the click handler, never during render — reading navigation
 * state in render or a `useState` initializer is the R-2 hydration hazard.
 */
export function useBackNavigation(fallbackPath: string) {
  const router = useRouter();
  const { locale } = useLocale();

  return function goBack() {
    if (hasInAppHistory()) {
      router.back();
      return;
    }
    router.push(localePath(locale, fallbackPath));
  };
}

export function DetailNavbar({
  fallbackPath,
  title,
  tabsSlot,
}: {
  /** Where "back" goes when there is no history — the section entry, per Q6. */
  fallbackPath: string;
  /** MV Result / Storyboard Edit / Edit MV use an icon-only back button plus a
   *  centred page title instead of the "‹ Back" text. Passing a title switches to
   *  that layout; omitting it keeps MV/Song Detail's original behaviour. */
  title?: string;
  /** Extra content (e.g. a Tabs row) rendered as a second row inside this SAME
   *  sticky box, so the two share one background instead of showing a seam. */
  tabsSlot?: React.ReactNode;
}) {
  const { loggedIn, subscribed, openSignIn } = useAuth();
  const { credits } = useCredits();
  const { locale } = useLocale();
  const t = useT();
  const goBack = useBackNavigation(fallbackPath);
  const profilePath = localePath(locale, "/profile");

  return (
    <header className="detail-navbar">
      <div className="detail-navbar__top">
        {/*
          A real anchor to the fallback, with the click intercepted so it runs
          `router.back()` instead — same pattern the /history card uses. The href
          is what makes middle-click and "copy link address" work and what lets
          axe see a link with a destination; the handler is what makes plain
          clicks honour the user's actual history.
        */}
        <a
          href={localePath(locale, fallbackPath)}
          onClick={(e) => {
            e.preventDefault();
            goBack();
          }}
          className={`detail-navbar__back${title ? " detail-navbar__back--icon-only" : ""}`}
          aria-label={title ? "Back" : undefined}
        >
          <span className="detail-navbar__back-button">
            <DpIcon name="ic_arrow_left" className="detail-navbar__back-icon" />
          </span>
          {!title && "Back"}
        </a>

        {title && <p className="detail-navbar__title">{title}</p>}

        {loggedIn ? (
          <div className="detail-navbar__actions">
            <Link href={profilePath} className="credit-balance" aria-label={t("profile.credits")}>
              <DpIcon name="ic_credit" className="credit-balance__icon" />
              <span data-testid="credit-balance">{credits}</span>
              <DpIcon name="ic_add" className="credit-balance__add" />
            </Link>
            {!subscribed && (
              <Link href={profilePath} className="upgrade-button">
                <DpIcon name="ic_crown" className="upgrade-button__icon" />
                {t("nav.upgrade")}
              </Link>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="button button--medium button--tertiary detail-navbar__login"
            onClick={() => openSignIn()}
          >
            Login
          </button>
        )}
      </div>

      {tabsSlot && <div className="detail-navbar__tabs">{tabsSlot}</div>}
    </header>
  );
}
