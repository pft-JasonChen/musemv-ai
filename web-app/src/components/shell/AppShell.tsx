"use client";

import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/config";
import { useTrackInAppNavigation } from "@/lib/navHistory";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Navbar } from "@/components/home/Navbar";
import { HomeBackground } from "@/components/home/HomeBackground";
import { Footer } from "@/components/home/Footer";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar } from "./MobileTabBar";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 2, Slice 2a) ────────────────────
 *
 * The wrapper classes are DP's `AppLayout` (`src/styles/designer/AppLayout.css`,
 * verbatim). Using them rather than re-deriving the responsive rules in Tailwind
 * is deliberate: DP already expresses the phone cutover as
 * `@media (max-width: 767px) { .app-layout--mobile-app .sidebar { display: none } }`,
 * so the switch is one stylesheet we re-sync on the next drop, rather than a
 * breakpoint maintained in two places that must be kept in step by hand.
 *
 * WHAT CHANGED BEHAVIOURALLY (plan R12 / S13 — why this slice carries its own e2e):
 *   · the phone cutover moves 640px → 767px
 *   · below it the chrome is MobileHeader (top) + MobileTabBar (bottom, 3 items),
 *     replacing the 5-item bar `Sidebar` used to draw itself
 *   · Profile is no longer a bottom-bar tab — it is reached from MobileHeader's
 *     account button, or the Sidebar profile footer on desktop
 *
 * `TopBar` survives as the DEFAULT for routes not yet migrated (CH2) — in
 * practice only `/mv/creating` now (DP has no MV-render progress screen at
 * all, so that route can't move — see `docs/DESIGNER-TODO.md` §B).
 *
 * Home (`/`) is no longer one of those: it now gets DP's own marketing
 * `Navbar` (`src/components/home/Navbar.tsx`), ported from designer feedback
 * that the legacy `TopBar` on the landing page didn't match the design at
 * all. `/` can never appear in `OWN_CHROME` (see the comment below), so it
 * has to be special-cased here rather than added to that list.
 */
/**
 * Routes whose view renders its own DP navbar (RoomNavbar / DetailNavbar) and so
 * must NOT also get the legacy TopBar.
 *
 * This list grows by one entry per migrated screen and is deleted outright when
 * the last route moves and TopBar goes with it. Keeping it here — rather than
 * having each page try to hand a navbar upward — is what App Router allows: the
 * page renders inside the layout, so the layout can only be told which routes to
 * stay out of the way for.
 */
const OWN_CHROME = [
  "/history",
  "/explore/mvs",
  "/explore/songs",
  "/song/play",
  "/profile",
  "/settings",
  "/watch",
  "/creator",
  "/mv/room",
  "/mv/thinking",
  "/mv/storyboard",
  "/mv/result",
  "/song/create",
  "/song/creating",
  "/song/result",
  "/mv/edit",
  // `/mv/creating` joined 2026-08-22 (see MOBILE_TAB_ROUTES below) — it now
  // carries its own DetailNavbar (GenerationView.tsx) instead of the legacy
  // TopBar, matching every other generation-adjacent screen.
  "/mv/creating",
];

/**
 * ── "LAYER 1" VS EVERYTHING ELSE, 2026-08-22 (product owner) ────────────────
 *
 * `MobileHeader`/`MobileTabBar` used to mount unconditionally on every route
 * (only `/share` opted out, via the early return below), and per-page CSS
 * `:has()` overrides in `designer-overrides.css` hid them one page at a time
 * as each screen grew its own back+title bar (`/explore/mvs`, `/watch`,
 * `/creator`). The product owner's request generalizes that: the tab bar and
 * the generic header should ONLY show on the pages `MobileTabBar` actually
 * links to — Home and History, "layer 1" — and every other route should hide
 * both and show a back button + page title instead.
 *
 * This is the general rule now; the three page-specific `:has()` overrides it
 * replaces were removed from `designer-overrides.css` in the same change.
 * Every OTHER route already renders its own back+title bar on mobile
 * (`DetailNavbar` without `hideMobileBar`, or a page's own custom header like
 * `.mv-player__mobile-header`) — those bars were previously stacking UNDER
 * the shell's own `MobileHeader` (same `position: sticky; top: 0; z-index:
 * 20`, see `DetailNavbar.tsx`'s own note); hiding `MobileHeader` here fixes
 * that double-header for all of them at once. The exceptions that had NO
 * mobile back/title mechanism at all (`/mv/room`, `/song/create`,
 * `/song/creating`, `/profile` — all `RoomNavbar`, which never had a back
 * button; `/explore/songs`'s list view) each gained one in this same change —
 * see `RoomNavbar.tsx`'s `mobileBackHref` and `SongDetailView.tsx`'s own
 * `.mv-detail__mobile-header` (reused from `/explore/mvs`, not duplicated).
 */
const MOBILE_TAB_ROUTES = ["/history"];

/**
 * ── HISTORY STOPS MOUNTING `MobileHeader` TOO, 2026-08-23 (product owner:
 *    "same div on both desktop and mobile") ─────────────────────────────────
 *
 * History is still "layer 1" for the TAB BAR — it's one of the two places
 * `MobileTabBar` links to, so it keeps that. But it no longer also mounts the
 * generic `MobileHeader`: that page already renders its own `RoomNavbar`
 * (title + tabs), and on desktop that's the ONLY header — the shell draws no
 * second one there. Mobile used to differ for no real reason: `MobileHeader`
 * sat above `RoomNavbar`, so a phone saw two stacked bars where desktop saw
 * one. `RoomNavbar` now absorbs `MobileHeader`'s job itself on mobile
 * (`mobileHeaderActions`: subscribe crown + account link, shown inside
 * `.room-navbar__top` instead of a separate element) — so header-mounting is
 * split from tab-bar-mounting here: `isHome` alone decides `MobileHeader`,
 * `isMobileTabRoute` (Home + History) still decides `MobileTabBar`.
 */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const path = stripLocalePrefix(pathname);

  // Feeds DetailNavbar's Q6 back decision — see src/lib/navHistory.ts. It sits
  // here because AppShell is the one component mounted for every route, and it
  // must run before the /share early return so the hook order stays stable.
  useTrackInAppNavigation(pathname);

  // The public share-link page (/share) is a standalone, no-navigation page
  // (spec P2-S1) — render it bare, without the app sidebar/top bar.
  if (path.startsWith("/share")) return <>{children}</>;

  const ownChrome = OWN_CHROME.some((r) => path === r || path.startsWith(`${r}/`));
  const isHome = path === "/";
  const isMobileTabBarRoute =
    isHome || MOBILE_TAB_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));

  return (
    <div className="app-layout app-layout--mobile-app">
      <Sidebar />
      <div className="app-layout__main">
        {isHome && <HomeBackground />}
        {!ownChrome && (isHome ? <Navbar /> : <TopBar />)}
        {isHome && <MobileHeader />}
        <main className="app-layout__content">{children}</main>
        {isHome && <Footer />}
        {isMobileTabBarRoute && <MobileTabBar />}
      </div>
    </div>
  );
}
