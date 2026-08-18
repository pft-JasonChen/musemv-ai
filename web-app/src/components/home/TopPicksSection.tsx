"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TOP_PICKS_SONGS, songAudioUrl } from "@/lib/mv/community";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SongPlayBar } from "@/components/song/SongPlayBar";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (landing page, the 17th route) ─────
 *
 * Port of DP's `pages/HomePage/TopPicksSection.tsx`; classes from
 * `src/styles/designer/TopPicksSection.css`, verbatim. No Tailwind (G3-d).
 *
 * Fed by `TOP_PICKS_SONGS` — DP slices its own catalog to 12 because it has one
 * flat list; WA's is already the "top picks" catalog, so it is used whole.
 *
 * ── THE PLAY BUTTON OPENS `SongPlayBar`, ADDED 2026-08-18 ──────────────────
 *
 * Product owner request: Top Picks' Play button used to just start an
 * invisible `<audio>` element with no transport — no way to pause, seek, or
 * even tell something was playing. It now mirrors `NewSongsSection.tsx`'s
 * desktop preview exactly: a `previewId` resolves to a full `CommunitySong`,
 * `playing`/`currentTime`/`duration` are lifted off the `<audio>` element,
 * and `SongPlayBar` renders fixed to the bottom of the viewport. `Card`'s
 * `onPlayClick` still stops the click from reaching the wrapping link, so the
 * cover art previews in place while the rest of the card still navigates —
 * DP's own split. `audio.play()` returns a promise that REJECTS when the
 * browser declines (no user activation, an interrupted load), and an
 * unhandled rejection is a console error the R-2 specs fail on — the
 * `.catch()` is not optional decoration.
 *
 * `.song-bar` is `display: none` below 768px (desktop-only by stylesheet), so
 * a phone tap on Play falls back to navigation instead of starting audio with
 * no visible way to stop it — same `useMediaQuery(PHONE_QUERY)` guard
 * `NewSongsSection.tsx` uses, and the same reasoning (R-2: not DP's own
 * `matchMedia` read, which is the SSR-unsafe shape in a different place).
 *
 * See `NewSongsSection.tsx`'s own header for why `suspend` /
 * `onPreviewOpen` / `onPreviewClose` exist: `HomeView` renders both sections,
 * `.song-bar` is `position: fixed`, and two independently-owned previews
 * could otherwise mount two bars — and two playing `<audio>` elements — at
 * once.
 *
 * ── LINKS AND ICONS ────────────────────────────────────────────────────────
 *
 * Cards link to `/song/play?id=` (`next/link` + `localePath()`, R-9) — WA's own
 * route for a community song, and where the pre-migration home already sent
 * them. `.icon-button__icon` is a mask ⇒ `DpIcon` via `IconButton`; `Card`'s
 * cover is a real `<img>` (D4).
 */
export interface TopPicksSectionProps {
  /** True when another home-page section's preview bar has taken over. */
  suspend?: boolean;
  onPreviewOpen?: () => void;
  onPreviewClose?: () => void;
}

export function TopPicksSection({
  suspend,
  onPreviewOpen,
  onPreviewClose,
}: TopPicksSectionProps = {}) {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Same shape as `NewSongsSection`'s own local `likedIds` — this section has
  // no other like affordance to share it with.
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  /**
   * `NewSongsSection` won the arbitration in `HomeView` — close ours rather
   * than let two `.song-bar`s (and two `<audio>`s) run at once. Cleared
   * during render (React's own documented pattern for resetting state when
   * a prop changes), not in a `useEffect` — `react-hooks/set-state-in-effect`
   * flags a `setState` called synchronously inside an effect body, and this
   * both avoids that and skips the wasted extra render an effect-based
   * reset would cost.
   */
  const [wasSuspended, setWasSuspended] = useState(Boolean(suspend));
  if (Boolean(suspend) !== wasSuspended) {
    setWasSuspended(Boolean(suspend));
    if (suspend) setPreviewId(null);
  }

  const previewSong = TOP_PICKS_SONGS.find((s) => s.id === previewId) ?? null;

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
   * Load and play whenever the previewed song changes — identical to
   * `NewSongsSection.tsx`'s own effect, including resetting currentTime/
   * duration first so the bar doesn't briefly show the previous song's
   * leftover progress, and catching the rejection an unaccepted autoplay
   * attempt throws.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewSong) return;
    setCurrentTime(0);
    setDuration(0);
    audio.src = songAudioUrl(previewSong.id);
    void audio.play().catch(() => {});
  }, [previewSong]);

  // The render-time reset above clears `previewId`, but pausing the actual
  // `<audio>` element is a real side effect (not derivable during render),
  // so it stays in an effect — it just never calls setState.
  useEffect(() => {
    if (suspend) audioRef.current?.pause();
  }, [suspend]);

  function scrollByCard(direction: -1 | 1) {
    const row = rowRef.current;
    const firstItem = row?.querySelector<HTMLElement>(".top-picks__item");
    if (!row || !firstItem) return;
    const gap = Number.parseFloat(window.getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: "smooth" });
  }

  function handlePlayClick(songId: string) {
    // No preview bar exists on a phone (`.song-bar` is `display: none` below
    // 768px), so playing here would be audio with no transport. Navigate
    // instead, same as `NewSongsSection.tsx`'s `handlePlay`.
    if (isPhone) {
      router.push(localePath(locale, `/song/play?id=${songId}`));
      return;
    }
    if (previewId === songId) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) void audio.play().catch(() => {});
      else audio.pause();
      return;
    }
    onPreviewOpen?.();
    setPreviewId(songId);
  }

  function stepPreview(delta: 1 | -1) {
    const index = TOP_PICKS_SONGS.findIndex((s) => s.id === previewId);
    if (index < 0) return;
    const next = (index + delta + TOP_PICKS_SONGS.length) % TOP_PICKS_SONGS.length;
    setPreviewId(TOP_PICKS_SONGS[next].id);
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

  return (
    <section className="top-picks">
      <SectionHeader title="Top Picks Songs" seeAllHref="/explore/songs" />

      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      <div className="top-picks__row-wrapper">
        <div className="top-picks__row" ref={rowRef} onScroll={updateScrollState}>
          {TOP_PICKS_SONGS.map((song) => (
            <Link
              key={song.id}
              href={localePath(locale, `/song/play?id=${song.id}`)}
              className="top-picks__item"
            >
              <Card
                type="Song"
                title={song.title}
                subtitle="AI Song"
                badge={song.badge ?? undefined}
                coverImage={song.cover}
                isPlaying={previewId === song.id && playing}
                onPlayClick={() => handlePlayClick(song.id)}
              />
            </Link>
          ))}
        </div>

        {canScrollBack && (
          <div className="top-picks__previous">
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
          <div className="top-picks__next">
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

      {previewSong && (
        <SongPlayBar
          open
          song={previewSong}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          audioRef={audioRef}
          liked={likedIds.has(previewSong.id)}
          onToggleLike={() => toggleLike(previewSong.id)}
          onTogglePlay={() => handlePlayClick(previewSong.id)}
          onPrev={() => stepPreview(-1)}
          onNext={() => stepPreview(1)}
          onClose={() => {
            audioRef.current?.pause();
            setPreviewId(null);
            onPreviewClose?.();
          }}
        />
      )}
    </section>
  );
}
