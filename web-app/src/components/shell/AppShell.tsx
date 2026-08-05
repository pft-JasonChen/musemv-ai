"use client";

import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/config";
import { useTrackInAppNavigation } from "@/lib/navHistory";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
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
 * `TopBar` survives as the DEFAULT for routes not yet migrated (CH2) — in practice
 * only Home, until its design lands. DP's per-page RoomNavbar / DetailNavbar
 * replace it route by route in slice 2b. The marketing Navbar and Footer are out
 * of scope entirely (CH3/CH4): both appear only on Home and Blog, both deferred.
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
];

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

  return (
    <div className="app-layout app-layout--mobile-app">
      <Sidebar />
      <div className="app-layout__main">
        {!ownChrome && <TopBar />}
        <MobileHeader />
        <main className="app-layout__content">{children}</main>
        <MobileTabBar />
      </div>
    </div>
  );
}
