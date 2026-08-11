"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useT } from "@/components/providers/LocaleProvider";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 2, Slice 2b / CH2) ──────────────
 *
 * Classes from `src/styles/designer/RoomNavbar.css` + CreditBalance / UpgradeButton
 * / Tabs, all verbatim from DP. This is the "room" variant: a page title, no back
 * button. Detail screens use DetailNavbar instead, which lands with the first
 * detail screen in Phase 3 rather than being built speculatively here.
 *
 * HOW THE SLOT WORKS IN NEXT. DP passes the navbar as a prop to its AppLayout.
 * App Router inverts that — the page renders INSIDE the layout, so it cannot hand
 * anything upward. `.room-navbar` is `position: sticky; top: 0`, so a migrated
 * view renders it as its own first child and it behaves identically. `AppShell`
 * only needs to know not to draw the legacy TopBar for that route (see OWN_CHROME).
 *
 * DP hardcodes `credits={390}` at all 19 of its call sites and opens its own
 * CreditsDialog / UpgradeDialog. Here the balance is `useCredits()` and both
 * actions route to /profile, where WA's real credits and subscribe surfaces
 * already live — porting a second IAP stack inside a shell slice would duplicate
 * them, not migrate them.
 */
export function RoomNavbar({ title, tabsSlot }: { title: string; tabsSlot?: React.ReactNode }) {
  const { loggedIn, subscribed, openSignIn } = useAuth();
  const { openSubscribe, openBuyCredits } = useSubscribe();
  const { credits } = useCredits();
  const t = useT();

  return (
    <header className="room-navbar">
      <div className="room-navbar__top">
        <p className="room-navbar__title">{title}</p>
        {loggedIn ? (
          <div className="room-navbar__actions">
            {/* Designer fix, 2026-08-11: was `<Link href="/profile">`, then
                briefly `/profile/credits` — both still just navigation.
                Figma (node 1783:41659) shows this pill opening "Buy
                Credits" directly, in place, the same way Upgrade opens
                Subscribe — so it's a button now, not a link. */}
            <button
              type="button"
              className="credit-balance"
              aria-label={t("profile.credits")}
              onClick={() => openBuyCredits()}
            >
              {/* A REAL <img>. `CreditBalance.css` sizes this one with
                  `.credit-balance img` — an ELEMENT selector — and gives it no
                  mask treatment, because DP lets the coin keep its own gold.
                  A `<span className="credit-balance__icon">` matches no rule at
                  all: 0×0, transparent, mask clipping nothing. It was invisible
                  on every migrated screen from slice 2b until `.iconcheck.mjs`
                  measured it. The neighbouring `__add` IS a real mask class. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/ui/ic_credit.svg" alt="" />
              <span data-testid="credit-balance">{credits}</span>
              <span
                className="credit-balance__add"
                style={{
                  maskImage: 'url("/assets/icons/ui/ic_add.svg")',
                  WebkitMaskImage: 'url("/assets/icons/ui/ic_add.svg")',
                }}
                aria-hidden="true"
              />
            </button>
            {!subscribed && (
              // Designer fix, 2026-08-11: was `<Link href="/profile">` — a
              // no-op on /profile itself, where WA's SubscribeModal lives.
              // Opens the same dialog directly now, from every page,
              // through the shared SubscribeProvider (see its comment).
              <button
                type="button"
                className="upgrade-button"
                onClick={() => openSubscribe()}
              >
                <span
                  className="upgrade-button__icon"
                  style={{
                    maskImage: 'url("/assets/icons/ui/ic_crown.svg")',
                    WebkitMaskImage: 'url("/assets/icons/ui/ic_crown.svg")',
                  }}
                  aria-hidden="true"
                />
                {t("nav.upgrade")}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="button button--medium button--tertiary room-navbar__login"
            onClick={() => openSignIn()}
          >
            <span className="button__label">Login</span>
          </button>
        )}
      </div>

      {tabsSlot && <div className="room-navbar__tabs">{tabsSlot}</div>}
    </header>
  );
}

/** DP's pill tab bar (`Tabs.css`), used in RoomNavbar's tabs slot. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { id: T; label: string }[];
  /** `null` = none selected. `/song/play?id=cps-*` needs that state: it shows the
   *  creator's playlist (EXP-09), which is not one of the tabs, and highlighting
   *  a tab that is not driving the list would be a lie. */
  active: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tabs__tab${tab.id === active ? " tabs__tab--active" : ""}`}
          aria-pressed={tab.id === active}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
