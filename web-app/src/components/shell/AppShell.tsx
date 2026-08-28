"use client";

import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/config";
import { useTrackInAppNavigation } from "@/lib/navHistory";
import { Sidebar } from "./Sidebar";
import { Navbar } from "@/components/home/Navbar";
import { HomeBackground } from "@/components/home/HomeBackground";
import { Footer } from "@/components/home/Footer";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar } from "./MobileTabBar";
import { DemoPanel } from "@/components/demo/DemoPanel";

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
 * ── THE LEGACY `TopBar` IS GONE, 2026-08-27 (product owner, S6 Q-01) ───────
 *
 * `TopBar` used to be the DEFAULT header for routes not yet migrated (CH2),
 * with `OWN_CHROME` listing the routes that had to be spared it. The S6
 * `shell-auth` storyboard build measured that list against the routes on disk
 * and found it covers ALL of them: with the migration at 17/17, `TopBar` —
 * and with it `HeaderActions` and `AccountMenu` — had become unreachable, so
 * the account dropdown those two drew was live dead code with no test
 * coverage. All three files are deleted, and `OWN_CHROME` went with them: a
 * list whose only job was gating a component that no longer exists.
 *
 * THE INVARIANT THAT REPLACES IT: below `/`, the shell draws NO header at all.
 * Every route renders its own (`RoomNavbar` / `DetailNavbar`, or a page's own
 * `.mv-player__mobile-header`-style bar), which is what all 16 already did.
 * **So a NEW route must bring its own navbar** — there is no fallback to
 * inherit any more, and forgetting one now shows as a page with no header
 * rather than as a legacy bar that looks wrong. The account destinations that
 * dropdown offered are reached instead from the `Sidebar` profile footer and
 * `MobileHeader`'s account icon (both plain links to `/profile`), Sign Out
 * lives in `Settings`, and Send Feedback is live at `/profile`.
 *
 * Home (`/`) gets DP's own marketing `Navbar` (`src/components/home/Navbar.tsx`),
 * ported from designer feedback that the legacy `TopBar` on the landing page
 * didn't match the design at all — that special case is now the ONLY header
 * this component mounts.
 */
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
  // (spec P2-S1) — render it bare, without the app sidebar/top bar. The demo
  // panel still rides along: /share is a real route QA has to be able to put
  // into an error state, and it renders nothing at all unless `?demo=1` has
  // armed it (see DemoPanel's header).
  if (path.startsWith("/share"))
    return (
      <>
        {children}
        <DemoPanel />
      </>
    );

  const isHome = path === "/";
  const isMobileTabBarRoute =
    isHome || MOBILE_TAB_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));

  return (
    <div className="app-layout app-layout--mobile-app">
      <Sidebar />
      <div className="app-layout__main">
        {isHome && <HomeBackground />}
        {isHome && <Navbar />}
        {isHome && <MobileHeader />}
        <main className="app-layout__content">{children}</main>
        {isHome && <Footer />}
        {isMobileTabBarRoute && <MobileTabBar />}
      </div>
      {/* Bottom-left QA switchboard. Invisible unless `?demo=1` has armed it,
          which is what keeps it out of all 115 visual baselines. */}
      <DemoPanel />
    </div>
  );
}
