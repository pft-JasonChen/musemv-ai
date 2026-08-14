"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NEW_SONGS,
  songAudioUrl,
  getCommunitySong,
  songResultFromCommunity,
  type CommunitySong,
} from "@/lib/mv/community";
import { buildShareUrl } from "@/lib/share";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { localePath } from "@/lib/i18n/config";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListItem } from "@/components/ui/ListItem";
import { SongPlayBar } from "@/components/song/SongPlayBar";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (landing page, the 17th route) ─────
 *
 * Port of DP's `pages/HomePage/NewSongsSection.tsx`; classes from
 * `src/styles/designer/NewSongsSection.css`, verbatim. No Tailwind (G3-d).
 *
 * Six rows in two columns above 768px, one stacked column below — the reflow is
 * pure CSS on `.new-songs__layout`, so both layouts are the same markup. DP
 * notes it once paginated the phone view into swipeable pages of three and
 * removed that, because it hid half the list behind a gesture nobody found.
 *
 * ── THIS IS `SongPlayBar`'s SECOND CONSUMER, AND WHY IT EXISTS AT ALL ──────
 *
 * Drop 2 extracted the bar out of `SongDetailPage.css` into its own stylesheet
 * precisely so this section could reuse it. Clicking a row's ALBUM ART previews
 * the song in place; clicking its TITLE navigates. That is the same two-way
 * split drop 2 introduced on `/explore/songs`, and it is deliberate that home
 * and that screen behave identically.
 *
 * `.song-bar` is `display: none` below 768px, so the bar is desktop-only BY
 * STYLESHEET — which means a phone tap on the art would start audio with no
 * visible transport and no way to stop it. DP guards that by falling back to
 * navigation on phones, and so does this (`useMediaQuery(PHONE_QUERY)`, R-2 —
 * NOT DP's `matchMedia` read inside the handler, which is the same SSR-unsafe
 * shape in a different place).
 *
 * ── THE AUDIO STATE IS OWNED HERE, NOT BY `useSongPlayer` ──────────────────
 *
 * DP's hook was deliberately not ported when the bar was (see `SongPlayBar`'s
 * header): it does not catch `audio.play()`'s rejection, and an uncaught
 * `NotAllowedError` on a cold load is a console error the R-2 specs fail on.
 * `SongDetailView` owns its own state for the same reason; this mirrors it.
 *
 * ── WHAT WA ADDS THAT DP DOES NOT HAVE ─────────────────────────────────────
 *
 * `requireLogin` on the Create pill (`AC-EXP-02`), and it seeds SongCompose with
 * the song's genre/mood/title/lyrics before routing — the behaviour the
 * pre-migration home already had on its own Create button. DP's Create is a bare
 * href to its create page, because DP has neither auth nor a compose store.
 */

const COLUMN_1 = NEW_SONGS.slice(0, 3);
const COLUMN_2 = NEW_SONGS.slice(3, 6);
/** The six rows the preview bar's prev/next step through. */
const PREVIEW_SONGS = [...COLUMN_1, ...COLUMN_2];

export function NewSongsSection() {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const { patchSongCompose, setSongResult } = useSongFlow();
  const isPhone = useMediaQuery(PHONE_QUERY);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Same `Set<string>` + `requireLogin` shape as SongDetailView's own
  // `likedIds`/`toggleLike` — this section has no other like affordance to
  // share it with, so it's local rather than lifted.
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(() => new Set());

  const previewSong = PREVIEW_SONGS.find((s) => s.id === previewId) ?? null;

  /**
   * Load and play whenever the previewed song changes. The rejection MUST be
   * caught — an autoplay attempt the browser declines rejects with
   * `NotAllowedError`, and an unhandled rejection is a console error that the
   * R-2 specs assert is absent.
   *
   * currentTime/duration reset HERE too — see SongDetailView's identical fix
   * (designer-reported, 2026-08-10): without it the bar briefly shows the
   * PREVIOUS song's leftover progress before snapping to the real value.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewSong) return;
    setCurrentTime(0);
    setDuration(0);
    audio.src = songAudioUrl(previewSong.id);
    void audio.play().catch(() => {});
  }, [previewSong]);

  /**
   * Product owner request, 2026-08-13 — was an unconditional
   * `/song/play?id=`, which on desktop lands back on this same list/preview
   * UI (`SongDetailView` renders both `/song/play` and `/explore/songs`)
   * rather than the dedicated single-song player. Now mirrors
   * `SongDetailView.tsx`'s own `selectSong`: desktop seeds SongFlow and goes
   * straight to `/song/result`; phones keep `/song/play`, which is where
   * `MobileNowPlaying`'s full-screen takeover lives.
   */
  function openSong(songId: string) {
    if (isPhone) {
      router.push(localePath(locale, `/song/play?id=${songId}`));
      return;
    }
    const song = getCommunitySong(songId);
    if (!song) return;
    setSongResult(songResultFromCommunity(song));
    router.push(localePath(locale, `/song/result?id=${songId}&from=home`));
  }

  function handlePlay(songId: string) {
    // No preview bar exists on a phone, so playing here would be audio with no
    // transport. DP falls back to navigating; so do we.
    if (isPhone) {
      openSong(songId);
      return;
    }
    if (previewId === songId) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) void audio.play().catch(() => {});
      else audio.pause();
      return;
    }
    setPreviewId(songId);
  }

  function stepPreview(delta: 1 | -1) {
    const index = PREVIEW_SONGS.findIndex((s) => s.id === previewId);
    if (index < 0) return;
    const next = (index + delta + PREVIEW_SONGS.length) % PREVIEW_SONGS.length;
    setPreviewId(PREVIEW_SONGS[next].id);
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

  function column(songs: readonly CommunitySong[]) {
    return songs.map((song) => (
      <div key={song.id} className="new-songs__item">
        <ListItem
          variant="community"
          title={song.title}
          username={song.creator}
          coverImage={song.cover}
          plays={song.plays}
          likes={song.likes}
          shares={song.shares}
          shareUrl={buildShareUrl(song.id)}
          cta
          isPlaying={previewId === song.id && playing}
          onSelect={() => openSong(song.id)}
          onPlay={() => handlePlay(song.id)}
          onCreate={() => createFromSong(song)}
        />
      </div>
    ));
  }

  return (
    // Keeps the section's own bottom padding clear of the fixed bar once it is
    // open — the same fix `SongDetailView`'s list container makes.
    <section className="new-songs" style={previewSong ? { paddingBottom: 96 } : undefined}>
      <SectionHeader
        title="Newly Released Songs"
        mobileTitle="New Songs"
        seeAllHref="/explore/songs"
      />

      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      <div className="new-songs__layout">
        <div className="new-songs__column">{column(COLUMN_1)}</div>
        <div className="new-songs__column">{column(COLUMN_2)}</div>
      </div>

      {previewSong && (
        // `open` is a new required prop (2026-08-14, see SongPlayBar.tsx) for
        // its slide transition — this section's own mount is still gated on
        // `previewSong` truthiness rather than adopting that transition
        // itself (out of scope here; the request was about the Song see-all
        // page's bar), so it's always mounted-means-open from this caller's
        // side, same behaviour as before.
        <SongPlayBar
          open
          song={previewSong}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          audioRef={audioRef}
          liked={likedIds.has(previewSong.id)}
          onToggleLike={() => toggleLike(previewSong.id)}
          onTogglePlay={() => handlePlay(previewSong.id)}
          onPrev={() => stepPreview(-1)}
          onNext={() => stepPreview(1)}
          onClose={() => {
            audioRef.current?.pause();
            setPreviewId(null);
          }}
        />
      )}
    </section>
  );
}
