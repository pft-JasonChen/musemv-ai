"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

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
  const { credits } = useCredits();
  const { locale } = useLocale();
  const t = useT();
  const profilePath = localePath(locale, "/profile");

  return (
    <header className="room-navbar">
      <div className="room-navbar__top">
        <p className="room-navbar__title">{title}</p>
        {loggedIn ? (
          <div className="room-navbar__actions">
            <Link href={profilePath} className="credit-balance" aria-label={t("profile.credits")}>
              <span
                className="credit-balance__icon"
                style={{
                  maskImage: 'url("/assets/icons/ui/ic_credit.svg")',
                  WebkitMaskImage: 'url("/assets/icons/ui/ic_credit.svg")',
                }}
                aria-hidden="true"
              />
              <span data-testid="credit-balance">{credits}</span>
              <span
                className="credit-balance__add"
                style={{
                  maskImage: 'url("/assets/icons/ui/ic_add.svg")',
                  WebkitMaskImage: 'url("/assets/icons/ui/ic_add.svg")',
                }}
                aria-hidden="true"
              />
            </Link>
            {!subscribed && (
              <Link href={profilePath} className="upgrade-button">
                <span
                  className="upgrade-button__icon"
                  style={{
                    maskImage: 'url("/assets/icons/ui/ic_crown.svg")',
                    WebkitMaskImage: 'url("/assets/icons/ui/ic_crown.svg")',
                  }}
                  aria-hidden="true"
                />
                {t("nav.upgrade")}
              </Link>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="button button--medium button--tertiary room-navbar__login"
            onClick={() => openSignIn()}
          >
            Login
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
  active: T;
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
