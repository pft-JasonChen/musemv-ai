"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NEW_MVS, TRENDING_MVS, mvCoverRatio, type CommunityMv } from "@/lib/mv/community";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import {
  computeJustifiedRows,
  aspectRatioOf,
  DESKTOP_QUERY,
  MAX_ROW_HEIGHT,
  type MvRatio,
} from "@/lib/mv/justifiedRows";

/**
 * The "Top Picks" / "Newly Released" justified grid — extracted from
 * `MvExplore` (`/explore/mvs`) on its second consumer, `CommunityMvPlayer`
 * (`/watch`). Same rule this codebase already follows for `DpIcon` /
 * `useMediaQuery` / `useDialogTransition`: a third private copy is how two
 * sources of truth start.
 *
 * DP's `MVDetailPage` renders these same two sections below the player in
 * ITS "selected" state too — `/mv-detail?id=…` is one file, list state and
 * player state both keep the grid mounted underneath. WA had split the grid
 * off into its own route (`/explore/mvs`) and `/watch` dropped it entirely;
 * this restores DP's behaviour (designer request, 2026-08-07) without
 * duplicating `MvExplore`'s layout/data logic.
 *
 * Deliberately no "exclude the MV you're watching" filter — DP doesn't
 * filter its own catalog either (`MV_CATALOG` includes the selected item).
 */

const TOP_PICKS = TRENDING_MVS;
const NEWLY_RELEASED = NEW_MVS;

/** `MvTopPicksRow`'s phone-width row height — see its own header comment. */
const PHONE_ROW_HEIGHT = 142;

/** `MvTopPicksRow`'s tablet-width row height — see `MvGrid`'s `!isDesktop`
 *  branch for why tablet needs its own value rather than reusing either of
 *  the other two. */
const TABLET_ROW_HEIGHT = 200;

type GridItem = CommunityMv & { ratio: MvRatio };

const withRatio = (items: readonly CommunityMv[]): GridItem[] =>
  items.map((m) => ({ ...m, ratio: mvCoverRatio(m.id) }));

function gridLink(locale: Locale, mv: GridItem) {
  return { href: localePath(locale, `/watch?id=${mv.id}`) };
}

function gridCard(mv: GridItem) {
  return (
    <Card
      type="Video"
      ratio={mv.ratio}
      community
      title={mv.title}
      username={mv.creator}
      likes={mv.likes}
      badge={mv.badge ?? undefined}
      coverImage={mv.thumb}
    />
  );
}

/**
 * Desktop-only horizontal-scroll row for "Top Picks Music Videos" (product
 * owner, 2026-09-07) — everywhere else (this section on phone/tablet, and
 * "Newly Released Music Videos" at every width) stays the wrapping/justified
 * grid `MvGrid` already rendered; only this ONE section, only ≥1024px,
 * switches to a single row + Previous/Next arrows once it overflows.
 *
 * No DP reference for this exists — `MVDetailPage.css` has no prev/next
 * classes anywhere near `.mv-detail__grid` — so this borrows the Home page's
 * own established pattern instead of inventing a new one: `NewMVsSection`'s
 * scroll-state logic (`canScrollBack`/`canScrollForward`, gated on real
 * overflow so an arrow never sits there as a dead control) duplicated a
 * third time, matching how `TopPicksSection`'s copy of the same pattern
 * already duplicated the first one — this codebase has no shared hook for
 * it yet, and extracting one is a separate refactor, not part of this ask.
 * New classes (`.mv-top-picks-row*`, `designer-overrides.css`) rather than
 * reusing `.new-mvs__*` verbatim — those are `new-mvs`'s own scoped names.
 *
 * ── EQUAL CARD HEIGHT, VARIABLE WIDTH (product owner, 2026-09-07 follow-up) ──
 *
 * `Card`'s own CSS is `width: 100%; aspect-ratio: <ratio>` (`Card.css`) —
 * height always follows whatever width its wrapper gives it. A single fixed
 * `--mv-top-picks-card-width` for every item (the first cut of this row)
 * therefore gave 4:3 cards a SHORTER height than 3:4 ones at the same width
 * — inconsistent with "Newly Released Music Videos"' own justified grid
 * below, where every card in a row shares one height and WIDTH is what
 * varies by ratio. Same fix here: one shared height (`MAX_ROW_HEIGHT`, the
 * justified grid's own ceiling, reused rather than inventing a second
 * constant) and each item's width computed as `height * aspectRatioOf(ratio)`
 * — exactly the arithmetic `computeJustifiedRows` already does per row,
 * just against a single implicit row instead of solving where to break
 * multiple ones (there's only one row here, nothing to justify).
 *
 * ── PHONE, TOO (product owner, 2026-09-11, Figma "New MVs — See All —
 *    Community" node 3940:150442) ─────────────────────────────────────────
 *
 * This row was desktop-only; below 768px this section fell through to
 * `MvGrid`'s two-column masonry branch instead, same as "Newly Released"
 * still does. Figma's phone frame shows this ONE section (retitled
 * "Trending MV" there — see `MvGridSections`' own `mobileTitle`) as a single
 * horizontal-scroll row too, at phone card sizes; "Newly Released" stays the
 * masonry below it, unchanged. `rowHeight` is now a prop instead of a
 * hard-coded `MAX_ROW_HEIGHT` read so `MvGrid` can hand this component a
 * smaller phone height — a flat constant (`PHONE_ROW_HEIGHT`), not a
 * viewport-relative one, matching how `MAX_ROW_HEIGHT` itself is already a
 * flat desktop constant rather than something that scales across every
 * desktop width. Figma's own phone-frame numbers (114×182 portrait /
 * 179×182 landscape, text included) back out to a ~142px cover height,
 * which is where 142 comes from. */
function MvTopPicksRow({ items, rowHeight }: { items: readonly GridItem[]; rowHeight: number }) {
  const { locale } = useLocale();
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  function updateScrollState() {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollBack(row.scrollLeft > 1);
    setCanScrollForward(row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
  }

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  /**
   * YMW260909P0008 (product owner, 2026-09-11): a single-card step per click
   * read as too slow — RD's own build advances by roughly a full row's worth
   * per click and that pace is the one to keep, so this now steps by the
   * row's visible width (a "page") rather than one item + gap. Spec updated
   * to match in `specs/areas/04-explore-community.md`.
   */
  function scrollByCard(direction: -1 | 1) {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * row.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="mv-top-picks-row-wrapper">
      <div className="mv-top-picks-row" ref={rowRef} onScroll={updateScrollState}>
        {items.map((mv) => (
          <Link
            key={mv.id}
            {...gridLink(locale, mv)}
            className="mv-top-picks-item"
            style={{ width: rowHeight * aspectRatioOf(mv.ratio) }}
          >
            {gridCard(mv)}
          </Link>
        ))}
      </div>

      {canScrollBack && (
        <div className="mv-top-picks-previous">
          <IconButton
            size="large"
            variant="ghost"
            icon="ic_arrow_left"
            label="Previous"
            onClick={() => scrollByCard(-1)}
          />
        </div>
      )}

      {canScrollForward && (
        <div className="mv-top-picks-next">
          <IconButton
            size="large"
            variant="ghost"
            icon="ic_arrow_right"
            label="Next"
            onClick={() => scrollByCard(1)}
          />
        </div>
      )}
    </div>
  );
}

function MvGrid({ items, asRow = false }: { items: readonly GridItem[]; asRow?: boolean }) {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // See `MvExplore`'s header note (the R-2 pattern) for why this isn't a
  // `typeof window` SSR-guarded `useState` initializer.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isPhone = useMediaQuery(PHONE_QUERY);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) =>
      setContainerWidth(entries[0].contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function link(mv: GridItem) {
    return { href: localePath(locale, `/watch?id=${mv.id}`) };
  }

  function card(mv: GridItem) {
    return (
      <Card
        type="Video"
        ratio={mv.ratio}
        community
        title={mv.title}
        username={mv.creator}
        likes={mv.likes}
        badge={mv.badge ?? undefined}
        coverImage={mv.thumb}
      />
    );
  }

  // Phone, opted in (see `MvTopPicksRow`'s own header comment): the same
  // single-row treatment desktop gets, just at a smaller `rowHeight`.
  // Everything else phone-width stays the two-column masonry below.
  if (isPhone && asRow) {
    return <MvTopPicksRow items={items} rowHeight={PHONE_ROW_HEIGHT} />;
  }

  // Phones get DP's two-column masonry — see `MvExplore`'s header note for
  // why this branch exists at all (without it the grid is blank <768px).
  if (isPhone) {
    const columns: GridItem[][] = [[], []];
    const heights = [0, 0];
    items.forEach((mv) => {
      const shorter = heights[0] <= heights[1] ? 0 : 1;
      columns[shorter].push(mv);
      heights[shorter] += 1 / aspectRatioOf(mv.ratio);
    });

    return (
      <div className="mv-detail__mobile-grid" ref={containerRef}>
        {columns.map((column, columnIndex) => (
          <div className="mv-detail__mobile-column" key={columnIndex}>
            {column.map((mv) => (
              <Link key={mv.id} {...link(mv)} className="mv-detail__grid-item">
                {card(mv)}
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Tablet, opted in (product owner, 2026-09-11 follow-up — "we forgot the
  // tablet version"): same row treatment as phone and desktop, just its own
  // row height. Neither of the other two constants fit here: `MAX_ROW_HEIGHT`
  // (280, desktop) sizes a card to roughly half the tablet viewport's own
  // width, and `PHONE_ROW_HEIGHT` (142) was picked for a 320-767px column
  // this row never has to wrap into any more (it scrolls, not wraps) — so
  // there's no reason to keep it phone-small once there's real width to use.
  // `TABLET_ROW_HEIGHT` is a middle value with no Figma frame behind it
  // (Figma only supplied a phone frame and the existing desktop one).
  if (!isDesktop && asRow) {
    return <MvTopPicksRow items={items} rowHeight={TABLET_ROW_HEIGHT} />;
  }

  // Below Laptop width the justified-row maths (built around the 1440 desktop
  // frame Figma provides) has no room to work — fall back to the simpler
  // fixed-width wrapping grid. Unaffected by `asRow` above 767px only when
  // `asRow` is false — "Newly Released" keeps this at every non-desktop
  // width, as it always did.
  if (!isDesktop) {
    return (
      <div className="mv-detail__grid mv-detail__grid--wrap" ref={containerRef}>
        {items.map((mv) => (
          <Link
            key={mv.id}
            {...link(mv)}
            className={`mv-detail__grid-item mv-detail__grid-item--${mv.ratio.replace(":", "-")}`}
          >
            {card(mv)}
          </Link>
        ))}
      </div>
    );
  }

  // Desktop opt-in (phone's and tablet's own `asRow` branches are above).
  if (asRow) {
    return <MvTopPicksRow items={items} rowHeight={MAX_ROW_HEIGHT} />;
  }

  const rows = computeJustifiedRows(items, containerWidth);

  return (
    <div className="mv-detail__grid" ref={containerRef}>
      {rows.map((row, rowIndex) => (
        <div className="mv-detail__grid-row" key={rowIndex}>
          {row.items.map((mv) => (
            <Link
              key={mv.id}
              {...link(mv)}
              className="mv-detail__grid-item"
              style={{ width: row.coverHeight * aspectRatioOf(mv.ratio) }}
            >
              {card(mv)}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The two sections together, exactly as both `/explore/mvs` and `/watch` mount them. */
export function MvGridSections() {
  const topPicks = withRatio(TOP_PICKS);
  const newlyReleased = withRatio(NEWLY_RELEASED);

  return (
    <>
      <section className="mv-detail__grid-section mv-detail__grid-section--primary">
        {/* mobileTitle changed from "Top Picks" to "Trending MV" — product
            owner, 2026-09-11, Figma node 3940:150442 — matching the string
            `MvExplore.tsx`'s own `.mv-detail__mobile-header` used to render
            as a page `<h1>`. That `<h1>` is now REMOVED (see its own
            comment) for the same reason `/explore/songs` has none: this
            SectionHeader is the one copy of the page title now, not a
            second one duplicating a fixed top bar.
            title changed from "Top Picks Music Videos" to "Trending Music
            Videos" — product owner, 2026-09-11 follow-up — so desktop and
            tablet read the same "Trending" naming the mobile title already
            uses, just unabbreviated. */}
        <SectionHeader title="Trending Music Videos" mobileTitle="Trending MV" />
        <MvGrid items={topPicks} asRow />
      </section>

      <section className="mv-detail__grid-section">
        {/* mobileTitle changed from "New MVs" to "Newly Released MV" —
            product owner, 2026-09-11, matching Figma node 3940:150442's own
            abbreviation exactly (it reads the section's full title, just
            without "Music Videos" → "MV"). */}
        <SectionHeader title="Newly Released Music Videos" mobileTitle="Newly Released MV" />
        <MvGrid items={newlyReleased} />
      </section>
    </>
  );
}
