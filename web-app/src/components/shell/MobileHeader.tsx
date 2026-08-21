"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { localePath, stripLocalePrefix } from "@/lib/i18n/config";

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
 * ── PRODUCT OWNER REQUEST, 2026-08-23 ────────────────────────────────────────
 *
 * The crown used to be a `<Link href="/profile">` — a no-op detour through a
 * page that itself just opens the subscribe dialog, the exact indirection
 * `RoomNavbar`/`Sidebar`/`Navbar`/`DetailNavbar`'s own upgrade buttons all
 * moved away from on 2026-08-11 (`openSubscribe()` directly, via the shared
 * `SubscribeProvider`). This component had been missed. Swapped `<Link>` for
 * `<button>` — safe here since `MobileHeader.css`'s rules are class selectors,
 * not `a.mobile-header__subscribe` (R-9/tag-contract concern doesn't apply).
 *
 * The credit balance (`CreditPill`, `useCredits()`) is removed outright, not
 * hidden with CSS — `MobileHeader` itself only ever renders below 767px
 * (DP's own `display: none` until that breakpoint), so a mobile-only
 * component has no "desktop" case where the balance would still be wanted.
 *
 * ── ROUTE-AWARE TITLE, 2026-08-23 (product owner, same day, reversing the
 *    earlier "un-hide `.room-navbar__top`" attempt) ─────────────────────────
 *
 * History wanted its own "My Creations" title visible on mobile. The first
 * cut gave `RoomNavbar` a second, page-specific header row for it
 * (`designer-overrides.css`) — the simpler fix the product owner actually
 * wanted is for THIS component (mobile's only header, mounted on exactly
 * Home and History — see `AppShell.tsx`'s "layer 1" comment) to carry the
 * page's own title instead of a hardcoded wordmark. `usePathname()` +
 * `stripLocalePrefix` is the same check `AppShell.tsx` already does to
 * decide `isHome`; this component just needed its own copy since it isn't
 * handed the route as a prop.
 */

const mask = (name: string) => {
  const url = `url("/assets/icons/ui/${name}.svg")`;
  return { maskImage: url, WebkitMaskImage: url };
};

export function MobileHeader() {
  const { subscribed, hydrated } = useAuth();
  const { openSubscribe } = useSubscribe();
  const { locale } = useLocale();
  const t = useT();
  const profilePath = localePath(locale, "/profile");
  const path = stripLocalePrefix(usePathname() || "/");
  const title = path === "/history" || path.startsWith("/history/") ? "My Creations" : "YouCam Muse";

  // SHELL-E1, phone half. `HeaderActions` has always reserved space until the
  // persisted flag is read; this component did not, so on a signed-in reload it
  // painted the logged-OUT header for a frame and then flipped. Same fix, same
  // reason — `useSyncExternalStore` narrows the window but does not close it.
  // (Found by the 2026-08-19 spec audit; the spec never covered this component.)
  return (
    <header className="mobile-header">
      <p className="mobile-header__title">{title}</p>
      {hydrated && !subscribed && (
        <button
          type="button"
          className="mobile-header__subscribe"
          onClick={() => openSubscribe()}
          aria-label={t("profile.upgrade")}
        >
          <span
            className="mobile-header__subscribe-icon"
            style={mask("ic_crown")}
            aria-hidden="true"
          />
        </button>
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
