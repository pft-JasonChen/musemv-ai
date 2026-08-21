"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SeekBar } from "@/components/ui/SeekBar";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailNavbar, useBackNavigation } from "@/components/shell/DetailNavbar";
import { Tabs } from "@/components/shell/RoomNavbar";
import { TopSongListItem } from "@/components/ui/TopSongListItem";
import { LyricsSheet, formatTime } from "@/components/ui/LyricsSheet";
import { DpIcon } from "@/components/ui/DpIcon";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildShareUrl } from "@/lib/share";
import { CommunityEmpty, useOnline } from "@/components/community/EmptyState";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useMediaQuery, useIsMounted, PHONE_QUERY } from "@/lib/ssr";
import {
  ALL_COMMUNITY_SONGS,
  CREATOR_SONGS,
  TOP_PICKS_SONGS,
  getCommunitySong,
  songAudioUrl,
  songResultFromCommunity,
  type CommunitySong,
} from "@/lib/mv/community";
import { SongPlayBar } from "@/components/song/SongPlayBar";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3b) ─────────────────────
 *
 * ONE VIEW, TWO ROUTES. `/explore/songs` and `/song/play` both render this.
 * Decision 2026-08-05 (product owner): both URLs render the whole screen and
 * differ only in `?id=` / `?tab=`.
 *
 * Keeping BOTH `page.tsx` files is the point — C7 stays at zero diff, G4-c still
 * passes, and every existing link into either URL keeps working. Merging them
 * into one route would have broken all of that for no visual gain.
 *
 * ── DROP 2 (`2670ed2`) DELETED THE DESKTOP NOW PLAYING COLUMN ───────────────
 *
 * 3b built this screen as two equal columns — a list and a `.now-playing` panel
 * sharing one `activeId`, one `playing` and one `<audio>`. Drop 2 removed all
 * 54 `.now-playing__*` rules and made `.song-detail__list` a full-width
 * two-column grid at >=1024px. Re-copying that stylesheet verbatim (which G2-b
 * requires) left WA's panel as markup with no CSS behind it, which is how this
 * came back onto the table at all.
 *
 * Product owner decided 2026-08-07: ADOPT DP. The panel is deleted here, and
 * with it 3b's "clicking a song does not navigate" — see `selectSong`. What DP
 * puts in its place is TWO things, not one, and conflating them is what made an
 * earlier reading of this drop wrong:
 *
 *   · the row's TITLE navigates to the result-stage player (`/song/result`)
 *   · the row's ALBUM ART starts `SongPlayBar`, a desktop preview bar, so
 *     browsing continues while a preview plays
 *
 * Nothing is lost. The disc player, Like, Lyrics and the Create CTA all still
 * exist — on `/song/result` for desktop, in `MobileNowPlaying` on phones — so
 * `AC-EXP-05` keeps every one of its requirements.
 *
 * ── WHAT CHANGED BEHAVIOURALLY (each has its own e2e — A4's lesson) ──────────
 *
 *  · DESKTOP CLICKING A SONG NAVIGATES to `/song/result?id=…&from=song-detail`,
 *    seeding SongFlow first the way `/history` rows do. This INVERTS 3b, and
 *    `AC-EXP-03` was rewritten with it rather than left to contradict the code.
 *  · MOBILE CLICKING A SONG opens the full-screen player, via `router.push` and
 *    Q6's `navHistory`, NOT DP's `history.pushState`/`popstate` pair. "Is the
 *    full-screen player open" is derived from `?id=` — which is DP's own stated
 *    rule for a deep link, so the two models line up.
 *  · S3 LANDS HERE. §1.4 cancelled the 30s free-preview cap long ago but the code
 *    never changed. This screen has no cap, no `maxPct` clamp, and no
 *    seek-triggered `SubscribeModal` upsell. `G5-d #7`'s preview half inverts
 *    with it; the High-quality half waits for the `/mv/room` slice, and
 *    `SongDetail.tsx` (`/song/result`) keeps its own `FREE_PREVIEW_SEC` until its
 *    own slice.
 *  · PLAYBACK IS A REAL `<audio>`. WA faked it with `setInterval` and a
 *    hardcoded `DURATION = 125`; DP's whole player reads duration/currentTime/
 *    onEnded off the element. URLs are derived in `community.ts` (`songAudioUrl`)
 *    rather than added to the frozen `CommunitySongSchema` — same call 3a made
 *    for `ratio`, and the same accepted cost: two mp3s for the whole catalog.
 *  · SHUFFLE + REPEAT ARE GONE. They were WA's (EXP-04) and DP's transport has
 *    no place for them. Product owner decided 2026-08-05 to follow DP and ask
 *    the designer — `DESIGNER-TODO.md` A7, plan S21. This contradicts spec
 *    AC-EXP-05 until the designer answers, which is why it is written down in
 *    three places instead of just done. Do NOT "restore" it to match an older
 *    copy of the spec; the divergence is the decision.
 *  · `Trending` IS NOT BUILT. DP has four tabs and its own comment admits three
 *    are fake ("no real per-tab data exists to actually filter by"). Product
 *    owner request, 2026-08-14, replaces the earlier Top Picks / New Releases
 *    split (itself WA's stand-in for DP's fake tabs) with genre tabs — one per
 *    distinct `CommunitySong.genre` value actually present in the catalog data,
 *    derived rather than hardcoded so a new genre in `community.ts` gets its
 *    own tab for free. Every song already carries a real `genre` (used
 *    elsewhere only to seed the Create flow); this is its first use for
 *    filtering. "Hip-Hop" — one of the examples given alongside Pop/R&B/Jazz/
 *    Acoustic — has no song in the mock catalog tagged with it, so it isn't
 *    one of the derived tabs; adding it would mean inventing catalog content
 *    rather than fixing the tab bar.
 *
 * ── WHAT DID NOT CHANGE ──────────────────────────────────────────────────────
 * EXP-09 (an id resolves to the playlist it belongs to), EXP-06 (not-found and
 * offline states), the `requireLogin` gate on Create and Like (GL-02/EXP-02),
 * lyrics, and share.
 *
 * ── TOP PICKS RAIL + MOVED TABS, 2026-08-18 (same node, newer Figma pass) ────
 *
 * `SongDetailPage.css`'s own header comment already named this screen after
 * Figma node 1409:34847 — a later pass of that SAME node added a "Top Picks
 * Songs" rail above the list and moved the genre tab bar out of
 * `DetailNavbar`'s sticky `tabsSlot` down into the page body, under a new
 * "Newly Released Songs" heading. Product owner request: both Home's "See
 * all" links (`TopPicksSection` and `NewSongsSection`, which already point
 * here) land on one page that now leads with Top Picks, then the tabbed
 * catalog — instead of the old bare list with tabs pinned to the navbar.
 *
 * The rail reuses `TOP_PICKS_SONGS` and `Card` (same fixture and component
 * Home's own `TopPicksSection` renders) but does NOT reuse that section's
 * standalone `SongPlayBar`/`<audio>` — this view already owns exactly one of
 * each for the list below, and routing the rail's Play button through the
 * same `previewSong`/`selectSong` this file already has keeps it that way
 * (one audio element, one bar, matching this file's own "why the active
 * song is state" note above rather than opening a second source of truth).
 * The scroll-arrow bookkeeping (`updateTopPicksScrollState`,
 * `scrollTopPicksByCard`) IS its own small copy of `TopPicksSection.tsx`'s —
 * kept local rather than extracted, since the two call sites' click/preview
 * wiring differs enough that a shared component would need as many
 * indirection props as the logic it saves.
 *
 * Tabs moving out of `DetailNavbar` does not change `tabsSlot`'s own mobile
 * rule: `DetailNavbar.css` hides it below 768px "not designed for mobile
 * yet" (product owner), and that reasoning didn't change just because the
 * tabs changed address — `designer-overrides.css` hides both the rail and
 * the heading+tabs block at the same breakpoint, so a phone still sees
 * exactly today's plain single-column list with no header and no filter.
 * (2026-08-19: those two used to share one wrapper div `designer-overrides.css`
 * could hide in one rule; the wrapper is gone — see that file's own comment
 * on why the sticky heading needed `.song-detail-page` as its direct parent
 * instead — so the mobile rule now names both elements separately.)
 */

const GENRES = Array.from(new Set(ALL_COMMUNITY_SONGS.map((s) => s.genre))).sort();

const TABS: { id: string; label: string }[] = [
  { id: "All", label: "All" },
  ...GENRES.map((genre) => ({ id: genre, label: genre })),
];

type Tab = string;

const isTab = (v: string | null): v is Tab => v !== null && TABS.some((t) => t.id === v);

function songsForTab(tab: Tab): readonly CommunitySong[] {
  if (tab === "All") return ALL_COMMUNITY_SONGS;
  return ALL_COMMUNITY_SONGS.filter((s) => s.genre === tab);
}

// `useLayoutEffect` warns during SSR; fall back to `useEffect` there. Local
// copy, not shared via `src/lib/ssr.ts` — same convention `SongPlayBar.tsx`
// and `Sidebar.tsx` each already follow for this exact helper.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const FALLBACK_LYRICS = ["♪ No lyrics available for this one yet ♪"];

const linesOf = (song: CommunitySong): string[] => {
  const lines = (song.lyrics ?? "").split("\n").filter((l) => l.trim().length > 0);
  return lines.length ? lines : FALLBACK_LYRICS;
};

/**
 * `MobileNowPlaying`'s seek. It was shared with the desktop `NowPlaying` panel
 * until drop 2 deleted that panel; kept as a hook rather than inlined because
 * `SongPlayBar` has the same handler and the two would drift if merged onto one
 * component's internals.
 *
 * The `pointermove`/`pointerup` listeners are added inside the handler, not in a
 * render-time effect — benign, and the pre-flight's SSR sweep cleared them.
 */
// TODO.md #5 / 7a: seeking goes through `ui/SeekBar`, which is keyboard-operable.
// DP draws this bar as a bare div with only `onPointerDown` — a Serious WCAG 2.1.1
// failure. Adopted 2026-08-12; pixel-neutral, same markup and class names.
function useSeek(audioRef: RefObject<HTMLAudioElement | null>) {
  function seek(next: number) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    // S3: no clamp. The old player capped this at `maxPct` for free accounts and
    // opened SubscribeModal when you tried to pass it.
    audio.currentTime = Math.min(audio.duration, Math.max(0, next));
  }
  return { seek };
}

interface PlayerProps {
  song: CommunitySong;
  playing: boolean;
  currentTime: number;
  duration: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  liked: boolean;
  onToggleLike: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCreate: () => void;
}

/**
 * Mobile-only full-screen takeover (Figma "Song Player — Community", 120:1023).
 *
 * ── A5 DOES NOT BLOCK THIS SCREEN, AND THIS IS WHY ───────────────────────────
 * DP hides every navbar below 767px, so a migrated detail screen normally has no
 * way back on a phone — that is what blocks `/watch`. This player carries its
 * OWN back control (`ic_arrow_left`), so the block is not global. Verified by
 * reading DP's code, not inferred.
 *
 * ── THE `createPortal` HAZARD (found by the 3b pre-flight) ────────────────────
 * DP calls `createPortal(…, document.body)` UNCONDITIONALLY during render. Under
 * Vite that is merely wrong; under Next it FAILS THE BUILD, because prerendering
 * runs this component on the server where `document` does not exist. It is a
 * harder failure than R-2's hydration mismatch — and, because it is loud, the
 * one SSR hazard on this screen that could not have been missed. Gated on a
 * mounted flag: the portal exists only after the client has mounted.
 *
 * The portal itself is DP's, and load-bearing: `position: fixed` here would
 * otherwise be trapped in `.app-layout__content`'s stacking context (it sets
 * `z-index: 1`), so nothing could paint over MobileHeader/MobileTabBar at
 * `z-index: 20`.
 */
function MobileNowPlaying({
  song,
  playing,
  currentTime,
  duration,
  audioRef,
  liked,
  onToggleLike,
  onTogglePlay,
  onPrev,
  onNext,
  onCreate,
  isOpen,
  onClose,
}: PlayerProps & { isOpen: boolean; onClose: () => void }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const mounted = useIsMounted();
  const { locale } = useLocale();
  const { seek } = useSeek(audioRef);

  if (!mounted) return null;

  return createPortal(
    /* `inert` for the same reason LyricsSheet has it: below 767px the closed
       state is `display: none` and unreachable, but at >=768px this element is
       `display: none` too — so it is never interactive here, and marking it inert
       when closed keeps the two players from both offering the same controls to
       the keyboard. */
    <div
      className={`song-detail-mobile-player${isOpen ? " song-detail-mobile-player--open" : ""}`}
      inert={!isOpen}
    >
      <img src={song.cover} alt="" className="song-detail-mobile-player__bg" aria-hidden="true" />
      <div className="song-detail-mobile-player__scrim" aria-hidden="true" />

      <div className="song-detail-mobile-player__header">
        <button
          type="button"
          className="song-detail-mobile-player__back"
          onClick={onClose}
          aria-label="Back"
        >
          <DpIcon name="ic_arrow_left" className="song-detail-mobile-player__back-icon" />
        </button>
        <p className="song-detail-mobile-player__header-title">Now Playing</p>
        <span className="song-detail-mobile-player__header-spacer" aria-hidden="true" />
      </div>

      <div className="song-detail-mobile-player__art-wrap">
        <img
          src={song.cover}
          alt=""
          className={`song-detail-mobile-player__art${playing ? " song-detail-mobile-player__art--spinning" : ""}`}
        />
      </div>

      <div className="song-detail-mobile-player__bottom">
        <div className="song-detail-mobile-player__meta-row">
          <div className="song-detail-mobile-player__meta">
            <p className="song-detail-mobile-player__title">{song.title}</p>
            <Link href={localePath(locale, "/creator")} className="song-detail-mobile-player__user">
              <span className="song-detail-mobile-player__avatar">
                <DpIcon name="ic_account" className="song-detail-mobile-player__avatar-icon" />
              </span>
              <span className="song-detail-mobile-player__username">{song.creator}</span>
            </Link>
          </div>

          <div className="song-detail-mobile-player__actions">
            <button
              type="button"
              className={`song-detail-mobile-player__icon-btn${liked ? " song-detail-mobile-player__icon-btn--active" : ""}`}
              onClick={onToggleLike}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <DpIcon
                name={liked ? "ic_favorite_on" : "ic_favorite_off"}
                className="song-detail-mobile-player__icon"
              />
            </button>
            <button
              type="button"
              className="song-detail-mobile-player__icon-btn"
              onClick={() => setShareOpen(true)}
              aria-label="Share"
            >
              <DpIcon name="ic_share" className="song-detail-mobile-player__icon" />
            </button>
            <button
              type="button"
              className="song-detail-mobile-player__icon-btn"
              onClick={() => setShowLyrics(true)}
              aria-label="Show lyrics"
            >
              <DpIcon name="ic_singing_mic" className="song-detail-mobile-player__icon" />
            </button>
          </div>
        </div>

        <SeekBar
          value={currentTime}
          max={duration}
          onSeek={seek}
          label="Seek within the song"
          className="song-detail-mobile-player__progress"
          trackClassName="song-detail-mobile-player__progress-track"
          fillClassName="song-detail-mobile-player__progress-fill"
          thumbClassName="song-detail-mobile-player__progress-thumb"
        />
        <div className="song-detail-mobile-player__time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="song-detail-mobile-player__transport">
          <button
            type="button"
            className="song-detail-mobile-player__transport-btn"
            onClick={onPrev}
            aria-label="Previous"
          >
            <DpIcon name="ic_skip_back" className="song-detail-mobile-player__transport-icon" />
          </button>
          <button
            type="button"
            className="song-detail-mobile-player__play"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            <DpIcon
              name={playing ? "ic_pause" : "ic_play"}
              className="song-detail-mobile-player__play-icon"
            />
          </button>
          <button
            type="button"
            className="song-detail-mobile-player__transport-btn"
            onClick={onNext}
            aria-label="Next"
          >
            <DpIcon name="ic_skip_forward" className="song-detail-mobile-player__transport-icon" />
          </button>
        </div>

        <button type="button" className="song-detail-mobile-player__cta" onClick={onCreate}>
          Create AI Song
          <DpIcon name="ic_arrow_right" className="song-detail-mobile-player__cta-icon" />
        </button>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={song.title}
        url={buildShareUrl(song.id)}
      />

      {/* Mounted only while the full-screen player is open — which is the only
          place it can be reached from. It stays mounted ACROSS its own open/close
          so its CSS transition plays in both directions (see LyricsSheet), but
          scoping it to `isOpen` keeps a `role="dialog"` out of the DOM on desktop
          and on the mobile list. Measured, not theorised: without this, e2e's
          `getByRole("dialog")` on `/explore/songs` resolved to two elements. */}
      {isOpen && (
        <LyricsSheet
          isOpen={showLyrics}
          title={song.title}
          cover={song.cover}
          lyricLines={linesOf(song)}
          currentTime={currentTime}
          duration={duration}
          playing={playing}
          onTogglePlay={onTogglePlay}
          onClose={() => setShowLyrics(false)}
        />
      )}
    </div>,
    document.body,
  );
}

export function SongDetailView() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useLocale();
  const { patchSongCompose, setSongResult } = useSongFlow();
  const { requireLogin } = useAuth();
  const online = useOnline();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const goBack = useBackNavigation("/explore/songs");
  // See this file's "LIST-VIEW MOBILE HEADER" note near the render below —
  // the list's OWN back goes Home, not to itself.
  const goBackHome = useBackNavigation("/");

  /**
   * `useSearchParams`, not a render-time read of the document's query string —
   * DP reads `window.location.search` during render, which is the R-2 hazard in
   * a different shape (the pre-flight's SSR table, row 2). The `<Suspense>`
   * boundary both `page.tsx` files provide is what this hook requires.
   */
  const idParam = params.get("id");
  const tabParam = params.get("tab");

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  /**
   * Liked ids live here rather than inside each row and each player. DP keeps
   * three independent `liked` flags for what is one song, so liking it in the
   * list leaves the player showing it unliked. WA's old `/explore/songs` row had
   * no like button at all, so there is no prior behaviour to preserve — only the
   * `requireLogin` gate, which stays.
   */
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(() => new Set());
  /** Desktop preview bar. Never true on a phone — see `previewSong`. */
  const [previewOpen, setPreviewOpen] = useState(false);

  /** Top Picks rail's own scroll-arrow state — see this file's own header
   *  comment for why it isn't shared with `TopPicksSection.tsx`. */
  const topPicksRowRef = useRef<HTMLDivElement>(null);
  const [canScrollTopPicksBack, setCanScrollTopPicksBack] = useState(false);
  const [canScrollTopPicksForward, setCanScrollTopPicksForward] = useState(false);

  function updateTopPicksScrollState() {
    const row = topPicksRowRef.current;
    if (!row) return;
    setCanScrollTopPicksBack(row.scrollLeft > 1);
    setCanScrollTopPicksForward(row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
  }

  useEffect(() => {
    updateTopPicksScrollState();
    window.addEventListener("resize", updateTopPicksScrollState);
    return () => window.removeEventListener("resize", updateTopPicksScrollState);
  }, []);

  function scrollTopPicksByCard(direction: -1 | 1) {
    const row = topPicksRowRef.current;
    const firstItem = row?.querySelector<HTMLElement>(".top-picks__item");
    if (!row || !firstItem) return;
    const gap = Number.parseFloat(window.getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: "smooth" });
  }

  /**
   * Product owner request, 2026-08-19 — "Newly Released Songs" + its genre
   * tabs should stick to the top and overlay the list while scrolling,
   * rather than scrolling away with it. `position: sticky` alone isn't
   * enough: `.detail-navbar` above it is ALSO sticky at `top: 0` with no
   * fixed height (it sizes to its own content, which varies by breakpoint —
   * see DetailNavbar.css), so a hardcoded `top` would either leave a gap
   * under the navbar or tuck the heading behind it. Measuring the navbar's
   * real height and feeding it in as `top` is the same fix `SongPlayBar.tsx`
   * uses for its own `left` offset (there: the Sidebar's measured width, not
   * a CSS constant, for the identical reason — a runtime value, not a
   * breakpoint one).
   *
   * Measured THREE candidates, not two, since 2026-08-22. It used to be
   * `.mobile-header` too (this view passes `hideMobileBar`, so below 768px
   * `.detail-navbar` itself is 0 height and `AppShell`'s shell header used to
   * occupy that edge instead) — but `AppShell` now only mounts `.mobile-
   * header` on Home/History ("layer 1 vs everything else", see its own
   * comment), so on this route it no longer exists to measure. The THIRD
   * candidate, `.mv-detail__mobile-header` (this file's own new list-view
   * back+title bar, see the render below), is what actually occupies that
   * edge on mobile now. Still just "whichever is currently taller" — no
   * breakpoint check needed, each one's own CSS is the switch.
   */
  const [navbarHeight, setNavbarHeight] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const navbar = document.querySelector(".detail-navbar");
    const mobileHeader = document.querySelector(".mobile-header");
    const listMobileHeader = document.querySelector(".mv-detail__mobile-header");
    if (!navbar && !mobileHeader && !listMobileHeader) return;

    function measure() {
      const navbarH = navbar?.getBoundingClientRect().height ?? 0;
      const mobileH = mobileHeader?.getBoundingClientRect().height ?? 0;
      const listH = listMobileHeader?.getBoundingClientRect().height ?? 0;
      setNavbarHeight(Math.max(navbarH, mobileH, listH));
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (navbar) observer.observe(navbar);
    if (mobileHeader) observer.observe(mobileHeader);
    if (listMobileHeader) observer.observe(listMobileHeader);
    return () => observer.disconnect();
  }, []);

  const requestedSong = getCommunitySong(idParam);

  /**
   * EXP-09, preserved. A `cps-*` id arrives from `/creator`, and those songs are
   * in none of the three tabs. Product owner decided 2026-08-05: the LIST becomes
   * the creator's playlist, so what is listed and what is playing agree — and
   * clicking any tab switches back to the community catalog. `activeTab === null`
   * is that state, which is why `Tabs` accepts null.
   */
  const isCreatorSong =
    requestedSong != null && CREATOR_SONGS.some((s) => s.id === requestedSong.id);
  const [activeTab, setActiveTab] = useState<Tab | null>(
    isTab(tabParam) ? tabParam : isCreatorSong ? null : "All",
  );

  const displayedSongs = useMemo(
    () => (activeTab === null ? CREATOR_SONGS : songsForTab(activeTab)),
    [activeTab],
  );

  /**
   * ── WHY THE ACTIVE SONG IS STATE AND NOT JUST `?id=` ────────────────────────
   *
   * The whole point of the desktop half is that clicking a row does NOT navigate
   * — so a desktop click cannot write to the URL, not even with `replace`:
   * `/explore/songs` would silently become `/song/play`, which is the page jump
   * this slice exists to remove.
   *
   * So a desktop click (and prev/next on both) records a local choice, and the
   * URL is only the STARTING point.
   *
   * Prev/next being local matters on mobile too: if they pushed URLs, the
   * player's Back would step backwards through songs instead of returning to the
   * list.
   *
   * `?id=` STILL WINS AFTER A REAL NAVIGATION — browser back/forward, or a fresh
   * deep link, must not be overridden by a stale click. The choice therefore
   * remembers WHICH `?id=` it was made against and is simply ignored once that
   * changes. Written as a derivation rather than an effect that resets state on a
   * prop change: no cascading render, and nothing to keep in sync.
   *
   * No `?id=` at all — the list's own first song is Now Playing, matching DP and
   * matching what `/song/play` has always done with no id.
   *
   * ── WHY THAT DEFAULT IS FROZEN AT MOUNT ─────────────────────────────────────
   *
   * `displayedSongs[0]` looks like the obvious default and is wrong, because the
   * three tabs are three DIFFERENT catalogs here (DP's four tabs are all reorderings
   * of ONE catalog, so DP never had this problem). Derived live, the default moves
   * whenever the tab moves — so changing a BROWSE FILTER silently changed which song
   * was playing and, via the load effect below, restarted the audio.
   *
   * MEASURED, not theorised: on `/explore/songs` with nothing clicked, switching
   * All → New Releases took Now Playing from "Pop Anthem" to "Down the Memory Lane".
   * An explicitly picked song already stuck correctly, so the bug was the ASYMMETRY
   * between a sticky pick and a live default. Freezing the default removes it.
   */
  const [choice, setChoice] = useState<{ forId: string | null; songId: string } | null>(null);
  const localChoice = choice && choice.forId === idParam ? choice.songId : null;
  const setSelectedId = (songId: string) => setChoice({ forId: idParam, songId });

  const [defaultId] = useState(() => displayedSongs[0]?.id ?? "");

  const activeId = localChoice ?? requestedSong?.id ?? defaultId;
  const activeSong = getCommunitySong(activeId) ?? displayedSongs[0];

  /**
   * "Is the full-screen player open" is DERIVED from the URL, not a state flag
   * DP toggles alongside a `history.pushState`. That is the pre-flight's
   * decision: mobile row taps `router.push` a `?id=` URL, so back navigation is
   * whatever the router already does, and a cold `?id=` deep link opens the
   * player exactly as DP's own comment says it should.
   */
  const mobilePlayerOpen = isPhone && Boolean(requestedSong);

  /**
   * Load and play whenever the selected song changes. The rejection MUST be
   * caught: an autoplay attempt without user activation rejects with
   * `NotAllowedError`, and an unhandled rejection is a console error — which the
   * R-2 hydration specs assert is empty. The first attempt on a cold load is
   * always blocked; once the user has clicked anything, later ones play.
   *
   * currentTime/duration reset HERE too, not just once the new audio's own
   * onTimeUpdate/onLoadedMetadata fire — otherwise the bar/progress UI renders
   * at least one frame with the PREVIOUS song's leftover numbers, which
   * visibly snaps the progress thumb/fill sideways once the real values
   * arrive (designer-reported, 2026-08-10). Resetting synchronously with the
   * track change means it always starts clean at 0.
   */
  /**
   * Product owner request, 2026-08-13 — landing on this view with no `?id=`
   * at all (e.g. "See all" from the Trending Songs rail, a plain
   * `/explore/songs` visit) must NOT autoplay the list's default first song.
   * A cold load WITH an explicit `?id=` (a direct song link) still should —
   * that's a real request for that song, not "just browsing the list".
   * `activeSong` changes on every later user-driven selection too (clicking
   * any row's album art goes through `previewSong`/`selectSong`, which
   * update `activeId`), and those must keep autoplaying as before — so this
   * only ever skips the SINGLE very first run of this effect, never a later
   * one, regardless of which branch that first run took.
   */
  const skipFirstAutoplayRef = useRef(!requestedSong);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong) return;
    setCurrentTime(0);
    setDuration(0);
    audio.src = songAudioUrl(activeSong.id);
    if (skipFirstAutoplayRef.current) {
      skipFirstAutoplayRef.current = false;
      return;
    }
    void audio.play().catch(() => {});
  }, [activeSong]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }

  /**
   * ── DESKTOP NOW NAVIGATES. THIS REVERSES SLICE 3b, DELIBERATELY ────────────
   *
   * 3b made a desktop row click swap an in-page column and leave the URL alone,
   * wrote that into `AC-EXP-03`, and pinned it with an e2e assertion. Drop 2
   * says navigate: DP deleted its desktop Now Playing column outright and its
   * `selectSong` sends the row to the result-stage player. Product owner chose
   * to adopt it (2026-08-07), so the criterion and the assertion moved WITH the
   * code rather than holding it in place — the error log's "a test can hold a
   * decision in place after the decision is wrong".
   *
   * `/song/result` reads SongFlow state and self-guards back to `/song/create`
   * when it is empty, so the song is seeded BEFORE navigating. That is not a new
   * pattern: it is exactly what `/history` rows do (`useOpenCreation.ts`). The
   * `from=song-detail` param is DP's, and it is what swaps that screen's bottom
   * rail to "Newly Released Songs" and drops the two owner-only controls.
   */
  function selectSong(songId: string) {
    if (isPhone) {
      // Q6's router, not DP's `history.pushState` — a real route change, carrying
      // the locale prefix (R-9), so Back is the router's own and `navHistory`
      // counts it. This is also what opens the full-screen player, since "open"
      // is derived from `?id=`.
      router.push(localePath(locale, `/song/play?id=${songId}`));
      return;
    }
    const song = getCommunitySong(songId);
    if (!song) return;
    setSongResult(songResultFromCommunity(song));
    router.push(localePath(locale, `/song/result?id=${songId}&from=song-detail`));
  }

  /**
   * The ALBUM ART, as opposed to the title. Drop 2 splits the row's two
   * affordances: art previews in place, title opens the song. On a phone there
   * is no bar (`.song-bar` is `display: none` below 768px), so the art keeps
   * doing what it always did — open the full-screen player.
   */
  function previewSong(songId: string) {
    if (isPhone) {
      selectSong(songId);
      return;
    }
    // A second click on the row that is already the open preview toggles
    // play/pause instead of re-selecting it — same shape as
    // `NewSongsSection.tsx`'s `handlePlay`. Pausing/resuming the shared
    // `audioRef` fires the `<audio>`'s own onPlay/onPause, which is what
    // `playing` state (and so `isPlaying` on this row AND on `SongPlayBar`)
    // is derived from — so the two stay in sync for free, not via a second
    // flag to keep in step.
    if (previewOpen && songId === activeId) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) void audio.play().catch(() => {});
      else audio.pause();
      return;
    }
    setSelectedId(songId);
    setPreviewOpen(true);
  }

  function closePreview() {
    audioRef.current?.pause();
    setPreviewOpen(false);
  }

  function step(delta: number) {
    if (displayedSongs.length === 0) return;
    // -1 (the active song is not in this tab's list, e.g. after a tab switch)
    // must not feed the modulo, or Prev lands two from the end.
    const index = Math.max(
      0,
      displayedSongs.findIndex((s) => s.id === activeId),
    );
    setSelectedId(
      displayedSongs[(index + delta + displayedSongs.length) % displayedSongs.length].id,
    );
  }

  // GL-02/EXP-02: gate at the action, so Create matches Home's create flow.
  function createFromSong(song: CommunitySong) {
    requireLogin(() => {
      patchSongCompose({
        genre: song.genre,
        mood: song.mood,
        title: song.title,
        lyrics: song.lyrics ?? "",
      });
      router.push(localePath(locale, "/song/create"));
    });
  }

  function toggleLike(songId: string) {
    requireLogin(() =>
      setLikedIds((current) => {
        const next = new Set(current);
        if (next.has(songId)) next.delete(songId);
        else next.add(songId);
        return next;
      }),
    );
  }

  // EXP-06: an id that resolves to nothing is a not-found state, not a silent
  // fall back to the first song. Still WA's Tailwind component — it REPLACES the
  // DP subtree rather than nesting inside it, so the two systems never meet on
  // one element (G3-d). Same arrangement /explore/mvs uses.
  if (idParam && !requestedSong) {
    return (
      <>
        <DetailNavbar fallbackPath="/explore/songs" />
        <CommunityEmpty
          variant="not-found"
          action={
            <Button onClick={() => router.push(localePath(locale, "/explore/songs"))}>
              Explore Songs
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      {/* Sticky, rendered as the view's own first child — see DetailNavbar for why
          App Router cannot use DP's navbar-as-a-prop arrangement. Back falls back
          to /explore/songs: on a cold `?id=` deep link that is this section's
          entry, and it is what the mobile player's back control uses too. */}
      {/* A5, reversed 2026-08-22: `/explore/songs` is NOT actually a tab-bar
          destination (only Home and History are — MobileTabBar.tsx), so
          "the list needs no phone back" was wrong on its own terms even
          before the "layer 1" rule; it now gets one via this file's own
          `.mv-detail__mobile-header` (see the render below), same as
          `/explore/mvs`. `hideMobileBar` stays: that header replaces
          DetailNavbar's compact bar, it doesn't stack with it. The full-
          screen mobile player still has its own separate back (unchanged,
          why 3b was safe regardless of this). */}
      {/* No more `tabsSlot` — the genre tabs moved into the page body below,
          see this file's own header comment ("TOP PICKS RAIL + MOVED TABS"). */}
      <DetailNavbar fallbackPath="/explore/songs" hideMobileBar />

      {!online ? (
        <CommunityEmpty variant="offline" />
      ) : (
        <>
          {/* Product owner request, 2026-08-19 — the list must not be visible
              underneath the navbar while scrolling. `.detail-navbar`'s own
              background is a top-to-bottom fade to transparent (by design —
              elsewhere it sits over a hero image), and `.song-detail-page__
              list-heading` only takes over BELOW it (`top: navbarHeight`), so
              the navbar's own translucent lower edge had nothing opaque
              behind it. This is a solid backdrop sized to the navbar's own
              measured height, stacked BELOW the navbar's own z-index (20) but
              ABOVE the plain scrolling list, so scrolled rows are fully
              masked out the instant they reach the navbar — same measured-
              height source as the heading's `top`, so the two edges align.
              `position: fixed` in the CSS, not `sticky` — `sticky` still
              reserves its own space in normal flow before it starts
              sticking, which pushed the rail down by a second navbar's
              worth of empty space even before any scrolling (product owner
              screenshot). `fixed` takes it out of flow entirely. */}
          <div
            className="song-detail-page__navbar-mask"
            style={{ height: navbarHeight }}
            aria-hidden="true"
          />

          <audio
            ref={audioRef}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => step(1)}
          />

          {/* New wrapper (designer-overrides.css) giving the rail, the moved
              heading+tabs, and the list one shared page rhythm — see this
              file's header comment ("TOP PICKS RAIL + MOVED TABS"). All
              three are DIRECT children of this wrapper — the heading needs
              to be, not just nested somewhere below it, for its
              `position: sticky` to have anywhere to stick: sticky's stuck
              range is bounded by its own PARENT's box, and a parent that
              ends right after the heading (e.g. one wrapping only the rail
              + heading) gives it zero room to stay pinned while the list
              scrolls underneath — it would stick for a single frame and
              immediately get pushed off. `.song-detail-page` spans the
              whole page, so nesting the heading there instead is what
              actually gives the sticky effect somewhere to run. */}
          <div className="song-detail-page">
            {/* ── LIST-VIEW MOBILE HEADER, 2026-08-22 (product owner,
                "layer 1 vs everything else" — AppShell.tsx's own comment)
                Phone-only (`display: none` until 767px), same compact
                back bar `/explore/mvs` already has —
                `.mv-detail__mobile-header` (MVDetailPage.css), REUSED here
                rather than duplicated: it's a generic H50 bar, not visually
                MV-specific, and its `margin: 0 -16px; padding: 10px 16px 0`
                cancels to a net-zero shift regardless of the parent's own
                padding (verified: `.song-detail-page`'s 20px here vs
                `.mv-detail`'s 16px both land the content flush with this
                page's own 20px list/rail inset — same reason it had to be
                nested INSIDE the padded parent, not a sibling before it, the
                first time this bar was built for `/explore/mvs`). Must stay
                this element's FIRST CHILD for exactly that reason.
                `/song/play` (a song selected, `mobilePlayerOpen`) covers this
                with its own full-screen `.song-detail-mobile-player` (z-index
                150 vs this bar's 10), so it never needs hiding separately.
                No `<h1>` here (product owner, 2026-08-23) — unlike
                `/explore/mvs`, this list's own body already opens with a
                "Top Picks Songs" `SectionHeader` right below, so a second
                copy of the same string in the bar itself was a pure
                duplicate, not a page title the body lacks. */}
            <div className="mv-detail__mobile-header">
              <a
                href={localePath(locale, "/")}
                onClick={(e) => {
                  e.preventDefault();
                  goBackHome();
                }}
                className="mv-detail__mobile-back"
                aria-label="Back"
              >
                <DpIcon name="ic_arrow_left" />
              </a>
            </div>

            {/* Hidden below 768px, same breakpoint `tabsSlot` was always
                hidden at (designer-overrides.css). */}
            <section className="top-picks">
              <SectionHeader title="Top Picks Songs" />
              <div className="top-picks__row-wrapper">
                <div
                  className="top-picks__row"
                  ref={topPicksRowRef}
                  onScroll={updateTopPicksScrollState}
                >
                  {TOP_PICKS_SONGS.map((song) => (
                    <div
                      key={song.id}
                      className="top-picks__item"
                      onClick={() => selectSong(song.id)}
                    >
                      <Card
                        type="Song"
                        title={song.title}
                        subtitle="AI Song"
                        badge={song.badge ?? undefined}
                        coverImage={song.cover}
                        isPlaying={song.id === activeId && playing}
                        onPlayClick={() => previewSong(song.id)}
                      />
                    </div>
                  ))}
                </div>

                {canScrollTopPicksBack && (
                  <div className="top-picks__previous">
                    <IconButton
                      size="large"
                      variant="ghost"
                      icon="ic_arrow_left"
                      label="Previous"
                      onClick={() => scrollTopPicksByCard(-1)}
                    />
                  </div>
                )}

                {canScrollTopPicksForward && (
                  <div className="top-picks__next">
                    <IconButton
                      size="large"
                      variant="ghost"
                      icon="ic_arrow_right"
                      label="Next"
                      onClick={() => scrollTopPicksByCard(1)}
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="song-detail-page__list-heading" style={{ top: navbarHeight }}>
              <SectionHeader title="Newly Released Songs" />
              <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
            </div>

            {/* `.song-detail__lists` is GONE, not tidied away: drop 2 deleted the
              rule, so the wrapper now matches nothing and would only add a
              stray block box between `.song-detail` and its grid. The list is
              `.song-detail`'s direct child, which is what makes the ≥1024px
              two-column grid resolve. */}
            <div
              className={`song-detail${mobilePlayerOpen ? " song-detail--mobile-player-open" : ""}`}
              /* Keeps the last rows clear of the fixed preview bar. DP's own
               inline style — its height plus breathing room, not its bare
               content height. */
              style={previewOpen ? { paddingBottom: 96 } : undefined}
            >
              <div className="song-detail__list">
                {displayedSongs.map((song) => (
                  <div key={song.id} className="song-detail__list-item">
                    <TopSongListItem
                      songId={song.id}
                      title={song.title}
                      username={song.creator}
                      plays={song.plays}
                      likes={song.likes + (likedIds.has(song.id) ? 1 : 0)}
                      shares={song.shares}
                      coverImage={song.cover}
                      isPlaying={song.id === activeId && playing}
                      onSelect={() => selectSong(song.id)}
                      onPlay={() => previewSong(song.id)}
                      onCreate={() => createFromSong(song)}
                      onToggleLike={() => toggleLike(song.id)}
                      liked={likedIds.has(song.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product owner request, 2026-08-14 — always mounted (whenever there's
              an `activeSong`, not gated on `previewOpen`) so `SongPlayBar`'s own
              slide transition has something to animate to/from in both
              directions; `open` now carries what this conditional used to. */}
          {activeSong && (
            <SongPlayBar
              open={previewOpen}
              song={activeSong}
              playing={playing}
              currentTime={currentTime}
              duration={duration}
              audioRef={audioRef}
              liked={likedIds.has(activeSong.id)}
              onToggleLike={() => toggleLike(activeSong.id)}
              onTogglePlay={togglePlay}
              onPrev={() => step(-1)}
              onNext={() => step(1)}
              onClose={closePreview}
            />
          )}

          {activeSong && (
            <MobileNowPlaying
              song={activeSong}
              playing={playing}
              currentTime={currentTime}
              duration={duration}
              audioRef={audioRef}
              liked={likedIds.has(activeSong.id)}
              onToggleLike={() => toggleLike(activeSong.id)}
              onTogglePlay={togglePlay}
              onPrev={() => step(-1)}
              onNext={() => step(1)}
              onCreate={() => createFromSong(activeSong)}
              isOpen={mobilePlayerOpen}
              onClose={goBack}
            />
          )}
        </>
      )}
    </>
  );
}
