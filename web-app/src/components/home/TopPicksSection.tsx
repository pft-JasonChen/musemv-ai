"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TOP_PICKS_SONGS, songAudioUrl } from "@/lib/mv/community";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (landing page, the 17th route) ─────
 *
 * Port of DP's `pages/HomePage/TopPicksSection.tsx`; classes from
 * `src/styles/designer/TopPicksSection.css`, verbatim. No Tailwind (G3-d).
 *
 * Fed by `TOP_PICKS_SONGS` — DP slices its own catalog to 12 because it has one
 * flat list; WA's is already the "top picks" catalog, so it is used whole.
 *
 * ── THE PLAY BUTTON PLAYS REAL AUDIO, AND ITS REJECTION IS CAUGHT ──────────
 *
 * `Card`'s `onPlayClick` stops the click from reaching the wrapping link, so the
 * cover art previews in place while the rest of the card still navigates —
 * DP's own split. `audio.play()` returns a promise that REJECTS when the browser
 * declines (no user activation, an interrupted load), and an unhandled rejection
 * is a console error that the R-2 specs fail on. 3b paid for that lesson on
 * `/song/play`; the `.catch()` is not optional decoration.
 *
 * ── LINKS AND ICONS ────────────────────────────────────────────────────────
 *
 * Cards link to `/song/play?id=` (`next/link` + `localePath()`, R-9) — WA's own
 * route for a community song, and where the pre-migration home already sent
 * them. `.icon-button__icon` is a mask ⇒ `DpIcon` via `IconButton`; `Card`'s
 * cover is a real `<img>` (D4).
 */
export function TopPicksSection() {
  const { locale } = useLocale();
  const audioRef = useRef<HTMLAudioElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
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

  function scrollByCard(direction: -1 | 1) {
    const row = rowRef.current;
    const firstItem = row?.querySelector<HTMLElement>(".top-picks__item");
    if (!row || !firstItem) return;
    const gap = Number.parseFloat(window.getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: "smooth" });
  }

  function handlePlayClick(id: string) {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.src = songAudioUrl(id);
    void audio.play().catch(() => setPlayingId(null));
    setPlayingId(id);
  }

  return (
    <section className="top-picks">
      <SectionHeader title="Top Picks Songs" seeAllHref="/explore/songs" />

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

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
                isPlaying={playingId === song.id}
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
    </section>
  );
}
