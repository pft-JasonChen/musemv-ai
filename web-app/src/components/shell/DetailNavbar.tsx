"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
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
  mobileTitle,
  tabsSlot,
  hideMobileBar = false,
}: {
  /** Where "back" goes when there is no history — the section entry, per Q6. */
  fallbackPath: string;
  /** MV Result / Storyboard Edit / Edit MV use an icon-only back button plus a
   *  centred page title instead of the "‹ Back" text. Passing a title switches to
   *  that layout; omitting it keeps MV/Song Detail's original behaviour. */
  title?: string;
  /**
   * Phone-only heading, for a screen whose DESKTOP layout keeps the "‹ Back"
   * text link (i.e. passes no `title`) but still needs something in the compact
   * mobile bar. Ignored when `title` is set — that already drives both.
   * New in the 2026-08-06 drop; DP uses it for `/creator` and Settings.
   */
  mobileTitle?: string;
  /** Extra content (e.g. a Tabs row) rendered as a second row inside this SAME
   *  sticky box, so the two share one background instead of showing a seam.
   *  NOTE: the 2026-08-06 drop hides `.detail-navbar__tabs` below 767px on
   *  purpose ("not designed for mobile yet"), so a tabs row is desktop-only. */
  tabsSlot?: React.ReactNode;
  /**
   * Suppress the compact mobile bar entirely. Two reasons to pass it, and DP
   * uses it for the first: the page renders its OWN mobile header (DP's
   * MVDetailPage list/player views do), so the two would stack; or the route is
   * reachable from the mobile tab bar, where a back control solves nothing —
   * which is what WA's retired `phoneBack={false}` meant.
   */
  hideMobileBar?: boolean;
}) {
  const { loggedIn, subscribed, openSignIn } = useAuth();
  const { openSubscribe, openBuyCredits } = useSubscribe();
  const { credits } = useCredits();
  const { locale } = useLocale();
  const t = useT();
  const goBack = useBackNavigation(fallbackPath);

  return (
    <>
      {/*
        ── A5 IS ANSWERED, AND WA'S WORKAROUND IS GONE (2026-08-06 drop) ───────
        Until this drop, `AppLayout.css` set `.detail-navbar { display: none }`
        below 767px and DP's `MobileHeader` carried no back affordance, so every
        detail screen was enterable and not leavable on a phone. WA filled the
        gap with its own Tailwind row right here — deliberately NOT using
        `.detail-navbar` classes, because that box was the thing being hidden.

        `2670ed2` supersedes it: AppLayout no longer hides `.detail-navbar` at
        all, and DetailNavbar.css gives it a compact 50px back+title bar built
        out of `__top` on a 28px/1fr/28px grid. So the workaround is deleted
        rather than kept alongside — two back controls stacked on one phone
        screen is its own defect, and `.detail-navbar--hide-mobile-bar` is now
        the supported way to say "this route does not need one".

        The guard does NOT change: `e2e/behaviour-regressions.spec.ts`'s "A5:
        every DetailNavbar route has a working back control at 375px" still has
        to pass, now against DP's control instead of ours. That is the point of
        having written it against BEHAVIOUR rather than against the markup.
      */}
      <header className={`detail-navbar${hideMobileBar ? " detail-navbar--hide-mobile-bar" : ""}`}>
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
            /*
              ALWAYS labelled, which is a deliberate divergence from DP.

              DP labels this only in its icon-only form, and relies on the visible
              word "Back" the rest of the time. That reasoning stops holding at
              767px: the 2026-08-06 drop hides `.detail-navbar__back-label`, so
              the anchor's only child is an aria-hidden mask span and its
              accessible name computes to EMPTY — an unnamed link that is the
              sole way off the screen on a phone (WCAG 2.4.4 / 4.1.2).

              It is worth knowing how this was caught, because it was nearly
              missed: a DOM sweep counting "controls whose text matches /back/"
              reported one on every affected route and looked like proof. It was
              reading `textContent`, which still returns text inside a
              `display: none` element. `getByRole(..., { name })` does not, and
              the four A5 e2e guards went red. The cheap measurement agreed with
              the wrong answer; the accessibility-tree one did not.

              Costs no pixels, so it needs no designer decision — but DP has the
              same hole, hence DESIGNER-TODO A19.
            */
            aria-label="Back"
          >
            <span className="detail-navbar__back-button">
              <DpIcon name="ic_arrow_left" className="detail-navbar__back-icon" />
            </span>
            {/* The 2026-08-06 drop wraps this word in its own span and hides
                THAT below 767px, so the compact mobile bar's 28px/1fr/28px grid
                gets a 28px back cell instead of a "‹ Back" text link wide enough
                to shove the title off centre. A bare string here still renders
                on a phone and no rule can reach it. */}
            {!title && <span className="detail-navbar__back-label">Back</span>}
          </a>

          {title && <p className="detail-navbar__title">{title}</p>}
          {!title && mobileTitle && (
            <p className="detail-navbar__title detail-navbar__title--mobile-only">{mobileTitle}</p>
          )}

          {loggedIn ? (
            <div className="detail-navbar__actions">
              {/* Designer fix, 2026-08-11: was `<Link href="/profile">` — a
                  no-op on /profile itself. Figma (node 1783:41659) shows
                  this pill opening "Buy Credits" directly; see
                  RoomNavbar's identical fix and SubscribeProvider's
                  comment. */}
              <button
                type="button"
                className="credit-balance"
                aria-label={t("profile.credits")}
                onClick={() => openBuyCredits()}
              >
                {/* `.credit-balance img` — an element selector, and no mask.
                    See the note in RoomNavbar: the class form renders nothing. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/icons/ui/ic_credit.svg" alt="" />
                <span data-testid="credit-balance">{credits}</span>
                <DpIcon name="ic_add" className="credit-balance__add" />
              </button>
              {!subscribed && (
                // Designer fix, 2026-08-11: was `<Link href="/profile">` —
                // same no-op bug, same fix as RoomNavbar's Upgrade pill.
                <button type="button" className="upgrade-button" onClick={() => openSubscribe()}>
                  <DpIcon name="ic_crown" className="upgrade-button__icon" />
                  {t("nav.upgrade")}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="button button--medium button--tertiary detail-navbar__login"
              onClick={() => openSignIn()}
            >
              <span className="button__label">Login</span>
            </button>
          )}
        </div>

        {tabsSlot && <div className="detail-navbar__tabs">{tabsSlot}</div>}
      </header>
    </>
  );
}
