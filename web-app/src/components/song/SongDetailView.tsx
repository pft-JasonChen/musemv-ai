"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
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
import { buildShareUrl } from "@/lib/share";
import { CommunityEmpty, useOnline } from "@/components/community/EmptyState";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useMediaQuery, useIsMounted, PHONE_QUERY } from "@/lib/ssr";
import {
  TOP_PICKS_SONGS,
  NEW_SONGS,
  ALL_COMMUNITY_SONGS,
  CREATOR_SONGS,
  getCommunitySong,
  songAudioUrl,
  type CommunitySong,
} from "@/lib/mv/community";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3b) ─────────────────────
 *
 * ONE VIEW, TWO ROUTES. `/explore/songs` and `/song/play` both render this.
 * Plan §2.1 originally had them as separate slices — take DP's list block for
 * one, DP's player for the other — and that plan does not survive contact with
 * the CSS: at >=1024px `.song-detail__lists` is `flex: 0 0 calc(50% - 20px)` and
 * `.now-playing` is its SIBLING at the same width (Figma 1409:34847 / 1778:28997,
 * "two equal 516px columns, a true 1:1"). They share one `activeId`, one
 * `playing`, one `<audio>`. Porting only the left half leaves 1440px with an
 * empty right half. Decision 2026-08-05 (product owner): both URLs render the
 * whole screen and differ only in `?id=` / `?tab=`.
 *
 * Keeping BOTH `page.tsx` files is the point — C7 stays at zero diff, G4-c still
 * passes, and every existing link into either URL keeps working. Merging them
 * into one route would have broken all of that for no visual gain.
 *
 * ── WHAT CHANGED BEHAVIOURALLY (each has its own e2e — A4's lesson) ──────────
 *
 *  · DESKTOP CLICKING A SONG NO LONGER NAVIGATES. It swaps the right column.
 *    WA used to `router.push("/song/play?id=")` from the list.
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
 *    are fake ("no real per-tab data exists to actually filter by"). WA has two
 *    real catalogs, so: All <- both, Top Picks <- TOP_PICKS_SONGS, New Releases
 *    <- NEW_SONGS. Same judgement 3a made for its two sections; `DESIGNER-TODO`
 *    A6 asks what Trending should be fed.
 *
 * ── WHAT DID NOT CHANGE ──────────────────────────────────────────────────────
 * EXP-09 (an id resolves to the playlist it belongs to), EXP-06 (not-found and
 * offline states), the `requireLogin` gate on Create and Like (GL-02/EXP-02),
 * lyrics, and share.
 */

const TABS = [
  { id: "All", label: "All" },
  { id: "Top Picks", label: "Top Picks" },
  { id: "New Releases", label: "New Releases" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const isTab = (v: string | null): v is Tab => TABS.some((t) => t.id === v);

function songsForTab(tab: Tab): readonly CommunitySong[] {
  if (tab === "Top Picks") return TOP_PICKS_SONGS;
  if (tab === "New Releases") return NEW_SONGS;
  return ALL_COMMUNITY_SONGS;
}

const FALLBACK_LYRICS = ["♪ No lyrics available for this one yet ♪"];

const linesOf = (song: CommunitySong): string[] => {
  const lines = (song.lyrics ?? "").split("\n").filter((l) => l.trim().length > 0);
  return lines.length ? lines : FALLBACK_LYRICS;
};

/**
 * Shared by both players. DP duplicates this whole handler in each; the two
 * copies were identical, so it comes across once.
 *
 * The `pointermove`/`pointerup` listeners are added inside the handler, not in a
 * render-time effect — benign, and the pre-flight's SSR sweep cleared them.
 */
function useSeek(audioRef: RefObject<HTMLAudioElement | null>) {
  const trackRef = useRef<HTMLDivElement>(null);

  function seekFromClientX(clientX: number) {
    const track = trackRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !audio.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    // S3: no clamp. The old player capped this at `maxPct` for free accounts and
    // opened SubscribeModal when you tried to pass it.
    audio.currentTime = ratio * audio.duration;
  }

  function onPointerDown(event: ReactPointerEvent) {
    seekFromClientX(event.clientX);
    function handleMove(moveEvent: PointerEvent) {
      seekFromClientX(moveEvent.clientX);
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return { trackRef, onPointerDown };
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

/** Desktop right column (>=1024px 1:1 with the list; hidden below 768px). */
function NowPlaying({
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
}: PlayerProps) {
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { locale } = useLocale();
  const { trackRef, onPointerDown } = useSeek(audioRef);

  const lyricLines = linesOf(song);
  // No per-line timestamps exist for generated lyrics, so the "current" line is
  // estimated from playback position — enough for the highlight to track along.
  const activeLineIndex = Math.min(
    lyricLines.length - 1,
    Math.floor((duration ? currentTime / duration : 0) * lyricLines.length),
  );

  useEffect(() => {
    if (showLyrics) activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLineIndex, showLyrics]);

  const progressRatio = duration ? currentTime / duration : 0;

  return (
    <section className="now-playing">
      <div className={`now-playing__art${showLyrics ? " now-playing__art--lyrics-open" : ""}`}>
        {/* Cover and lyrics overlay both stay mounted so the crossfade can
            transition instead of snapping — DP's "always mount, toggle a
            modifier" convention. Visibility is opacity/pointer-events only. */}
        <img
          src={song.cover}
          alt=""
          className={`now-playing__art-image${playing ? " now-playing__art-image--spinning" : ""}${showLyrics ? " now-playing__art-image--hidden" : ""}`}
        />

        {/* `inert` for the same reason LyricsSheet has it, and it was MISSED here on
            the first pass: DP's closed state is `opacity: 0; pointer-events: none`,
            which hides this from the eye and the mouse but leaves "Close lyrics" in
            the tab order on every desktop load. Caught by G7's independent review
            and then measured — a DOM sweep for focusable-but-invisible elements at
            1440px returned exactly this one node. Two overlays on this screen share
            that CSS pattern; both now need the attribute. */}
        <div
          className={`now-playing__lyrics-overlay${showLyrics ? " now-playing__lyrics-overlay--open" : ""}`}
          inert={!showLyrics}
        >
          <div
            className="now-playing__lyrics-backdrop"
            onClick={() => setShowLyrics(false)}
            aria-hidden="true"
          />
          <div className="now-playing__lyrics-panel">
            <button
              type="button"
              className="now-playing__lyrics-close"
              onClick={() => setShowLyrics(false)}
              aria-label="Close lyrics"
            >
              <span className="now-playing__lyrics-close-icon" aria-hidden="true">
                ×
              </span>
            </button>
            <div className="now-playing__lyrics-lines">
              {lyricLines.map((line, index) => (
                <p
                  key={index}
                  ref={index === activeLineIndex ? activeLineRef : undefined}
                  className={`now-playing__lyrics-line${index === activeLineIndex ? " now-playing__lyrics-line--active" : ""}`}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="now-playing__controller">
        <div className="now-playing__meta-row">
          <div className="now-playing__meta">
            <p className="now-playing__title">{song.title}</p>
            <Link href={localePath(locale, "/creator")} className="now-playing__user">
              <span className="now-playing__avatar">
                <DpIcon name="ic_account" className="now-playing__avatar-icon" />
              </span>
              <span className="now-playing__username">{song.creator}</span>
            </Link>
          </div>

          <div className="now-playing__meta-actions">
            <button
              type="button"
              className={`now-playing__icon-btn${liked ? " now-playing__icon-btn--active" : ""}`}
              onClick={onToggleLike}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <DpIcon
                name={liked ? "ic_favorite_on" : "ic_favorite_off"}
                className="now-playing__icon"
              />
            </button>
            <button
              type="button"
              className="now-playing__icon-btn"
              onClick={() => setShareOpen(true)}
              aria-label="Share"
            >
              <DpIcon name="ic_share" className="now-playing__icon" />
            </button>
            <button
              type="button"
              className={`now-playing__icon-btn${showLyrics ? " now-playing__icon-btn--active" : ""}`}
              onClick={() => setShowLyrics((current) => !current)}
              aria-label={showLyrics ? "Show cover art" : "Show lyrics"}
            >
              <DpIcon name="ic_singing_mic" className="now-playing__icon" />
            </button>
          </div>
        </div>

        <div className="now-playing__progress" ref={trackRef} onPointerDown={onPointerDown}>
          <div className="now-playing__progress-track" />
          <div
            className="now-playing__progress-fill"
            style={{ width: `${progressRatio * 100}%` }}
          />
          <div
            className="now-playing__progress-thumb"
            style={{ left: `${progressRatio * 100}%` }}
          />
        </div>
        <div className="now-playing__time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="now-playing__transport">
          <button
            type="button"
            className="now-playing__transport-btn"
            onClick={onPrev}
            aria-label="Previous"
          >
            <DpIcon name="ic_skip_back" className="now-playing__transport-icon" />
          </button>
          <button
            type="button"
            className="now-playing__play"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            <DpIcon name={playing ? "ic_pause" : "ic_play"} className="now-playing__play-icon" />
          </button>
          <button
            type="button"
            className="now-playing__transport-btn"
            onClick={onNext}
            aria-label="Next"
          >
            <DpIcon name="ic_skip_forward" className="now-playing__transport-icon" />
          </button>
        </div>
      </div>

      <button type="button" className="now-playing__cta" onClick={onCreate}>
        Create AI Song
        <DpIcon name="ic_arrow_right" className="now-playing__cta-icon" />
      </button>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={song.title}
        url={buildShareUrl(song.id)}
      />
    </section>
  );
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
  const { trackRef, onPointerDown } = useSeek(audioRef);

  const progressRatio = duration ? currentTime / duration : 0;

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

        <div
          className="song-detail-mobile-player__progress"
          ref={trackRef}
          onPointerDown={onPointerDown}
        >
          <div className="song-detail-mobile-player__progress-track" />
          <div
            className="song-detail-mobile-player__progress-fill"
            style={{ width: `${progressRatio * 100}%` }}
          />
          <div
            className="song-detail-mobile-player__progress-thumb"
            style={{ left: `${progressRatio * 100}%` }}
          />
        </div>
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
  const { patchSongCompose } = useSongFlow();
  const { requireLogin } = useAuth();
  const online = useOnline();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const goBack = useBackNavigation("/explore/songs");

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
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong) return;
    audio.src = songAudioUrl(activeSong.id);
    void audio.play().catch(() => {});
  }, [activeSong]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }

  function selectSong(songId: string) {
    if (isPhone) {
      // Q6's router, not DP's `history.pushState` — a real route change, carrying
      // the locale prefix (R-9), so Back is the router's own and `navHistory`
      // counts it. This is also what opens the full-screen player, since "open"
      // is derived from `?id=`.
      router.push(localePath(locale, `/song/play?id=${songId}`));
      return;
    }
    setSelectedId(songId);
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

  const tabsSlot = <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />;

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
      {/* A5: no phone back — the list half is an Explore tab-bar destination. The
          full-screen mobile player has its own back (that is why 3b was safe). */}
      <DetailNavbar fallbackPath="/explore/songs" tabsSlot={tabsSlot} hideMobileBar />

      {!online ? (
        <CommunityEmpty variant="offline" />
      ) : (
        <>
          <audio
            ref={audioRef}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => step(1)}
          />

          <div
            className={`song-detail${mobilePlayerOpen ? " song-detail--mobile-player-open" : ""}`}
          >
            <div className="song-detail__lists">
              <div className="song-detail__list">
                {displayedSongs.map((song) => (
                  <TopSongListItem
                    key={song.id}
                    songId={song.id}
                    title={song.title}
                    username={song.creator}
                    plays={song.plays}
                    likes={song.likes + (likedIds.has(song.id) ? 1 : 0)}
                    shares={song.shares}
                    coverImage={song.cover}
                    isPlaying={song.id === activeId && playing}
                    onSelect={() => selectSong(song.id)}
                    onCreate={() => createFromSong(song)}
                    onToggleLike={() => toggleLike(song.id)}
                    liked={likedIds.has(song.id)}
                  />
                ))}
              </div>
            </div>

            {activeSong && (
              <NowPlaying
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
              />
            )}
          </div>

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
