"use client";

import { useState } from "react";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import { HeroBannerSection } from "./HeroBannerSection";
import { HeroBannerSectionV3 } from "./HeroBannerSectionV3";
import { ToolSelectorSection } from "./ToolSelectorSection";
import { ToolSelectorSectionV3 } from "./ToolSelectorSectionV3";
import { NewMVsSection } from "./NewMVsSection";
import { TopPicksSection } from "./TopPicksSection";
import { NewSongsSection } from "./NewSongsSection";

/**
 * ── MIGRATED TO THE DESIGNER UI — the landing page, and the 17th route ──────
 *
 * Port of DP's `pages/HomePage/HomePage.tsx`; classes from
 * `src/styles/designer/HomePage.css`, verbatim. This was the last screen still
 * on the original Tailwind build, so it is a rewrite rather than an edit, and
 * nothing of the old file survives (G3-d: no Tailwind in this subtree).
 *
 * ── WHY THIS BRANCHES IN JS RATHER THAN IN CSS ─────────────────────────────
 *
 * DP ships TWO treatments of the hero and TWO of the tool selector, and picks
 * between them with a media-query read rather than by hiding one in CSS. That
 * is DP's own decision and it is kept: the desktop pair is the product owner's
 * chosen "review-c" design, the phone pair was finalised separately and never
 * had a review round, and the two are structurally different components rather
 * than one component with a breakpoint. Collapsing them would forfeit exactly
 * what the vendored-stylesheet strategy buys — each file re-syncs whole on the
 * next drop.
 *
 * Note the ORDER inverts with the branch, and that is DP's too: on phones the
 * hero comes first and the tool tiles sit under it; on desktop the heading and
 * the three-card row lead, and the filmstrip hero follows.
 *
 * ── R-2, THE THIRD INSTANCE ────────────────────────────────────────────────
 *
 * DP writes the query as
 *   useState(() => typeof window !== 'undefined' && matchMedia(q).matches)
 * which slice 2a MEASURED throwing React error 418 (hydration failed). The
 * `typeof window` guard is what makes it look safe while guaranteeing that
 * server and first client render disagree whenever the query matches.
 * `useMediaQuery` is the fixed shape. A sweep during 3b concluded the drop
 * contained "exactly two files" with this pattern — that count was taken before
 * the landing page was in scope, and this is the third.
 *
 * The consequence to know, and it is why the desktop pair is the false branch:
 * `useMediaQuery` returns `false` for one frame on every load, phones included.
 * So a phone paints the desktop hero for a frame. `.hero-banner` is
 * `display: none` below 768px anyway, so what actually paints in that frame is
 * nothing — not a wrong layout.
 *
 * ── WHAT THIS SCREEN DELIBERATELY NO LONGER HAS ────────────────────────────
 *
 * The **Trending MV marquee is gone**. It was WA's own 45s infinite auto-scroll
 * rail and DP has no equivalent; the product owner decided 2026-08-07 to follow
 * DP. The consequence, stated because it was not part of what was decided until
 * it was raised and confirmed: `TRENDING_MVS` (3 items) now has **no entry point
 * on home at all** — DP's three rails map to `NEW_MVS`, `TOP_PICKS_SONGS` and
 * `NEW_SONGS`. It remains reachable from `/explore/mvs`, where it is the
 * `--primary` section and therefore the one MV catalog a phone can see (A19).
 * Confirmed by the product owner in the same breath as the decision itself:
 * "TRENDING_MVS 不用首頁 (Match DP)". `DESIGNER-TODO` A20 records it, and the
 * e2e that used to drive `.marquee-animate button` was re-pointed at the
 * Trending Music Videos rail rather than deleted — it guards a real rule (home
 * and `/explore/mvs` must not drift into two behaviours), and that rule outlived
 * the marquee.
 *
 * ── WHAT DP HAS THAT THIS DOES NOT ─────────────────────────────────────────
 *
 * DP wraps HomePage in `AppLayout showBackground showFooter`, i.e. the rotating
 * colorflow background and the marketing Footer. Both belong to the SHELL, not
 * to this screen: CH3/CH4 put the marketing Navbar and Footer out of scope, and
 * `AppShell` has never rendered `.app-layout__background` on any route. Neither
 * is a loss introduced here, and neither is this slice's to add.
 *
 * ── ARBITRATING TWO `SongPlayBar` OWNERS, ADDED 2026-08-18 ─────────────────
 *
 * `TopPicksSection` and `NewSongsSection` each own an independent desktop
 * song preview (state, `<audio>`, `SongPlayBar` — see either file's header
 * for why the state isn't shared). Rendered on the same page, that would let
 * both open at once: two `position: fixed` bars stacked on each other and two
 * `<audio>` elements playing simultaneously. `activeSongSection` is the one
 * bit of arbitration that prevents it — whichever section's Play button was
 * pressed most recently tells this component via `onPreviewOpen`, and that
 * section's sibling is told via `suspend` to close whatever it had open.
 *
 * The same state also answers "is any bar open at all"
 * (`activeSongSection !== null`), passed to `NewSongsSection` as
 * `barVisible` — see its own header comment for why it, not `TopPicksSection`,
 * needs to know that regardless of which section's bar is actually showing.
 */
export function HomeView() {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [activeSongSection, setActiveSongSection] = useState<"top-picks" | "new-songs" | null>(
    null,
  );

  return (
    <div className="home-page">
      {isPhone ? (
        <>
          <HeroBannerSection />
          <ToolSelectorSection />
        </>
      ) : (
        <>
          <ToolSelectorSectionV3 />
          <HeroBannerSectionV3 />
        </>
      )}
      <NewMVsSection />
      <TopPicksSection
        suspend={activeSongSection === "new-songs"}
        onPreviewOpen={() => setActiveSongSection("top-picks")}
        onPreviewClose={() =>
          setActiveSongSection((current) => (current === "top-picks" ? null : current))
        }
      />
      <NewSongsSection
        suspend={activeSongSection === "top-picks"}
        onPreviewOpen={() => setActiveSongSection("new-songs")}
        onPreviewClose={() =>
          setActiveSongSection((current) => (current === "new-songs" ? null : current))
        }
        barVisible={activeSongSection !== null}
      />
    </div>
  );
}
