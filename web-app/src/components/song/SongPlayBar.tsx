"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { SeekBar } from "@/components/ui/SeekBar";
import type { RefObject } from "react";
import { DpIcon } from "@/components/ui/DpIcon";
import { IconButton } from "@/components/ui/IconButton";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { formatTime } from "@/components/ui/LyricsSheet";
import { buildShareUrl } from "@/lib/share";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import type { CommunitySong } from "@/lib/mv/community";

/**
 * ── DESKTOP PREVIEW BAR, PORTED FROM DP DROP 2 (`2670ed2`) ──────────────────
 *
 * A row's ALBUM-ART play icon starts this; the row's TITLE still navigates. The
 * point of it, in DP's own words, is that browsing continues while a preview
 * plays. It is not the main player and it replaces nothing — an earlier reading
 * of the drop said it replaced `/song/play`'s Now Playing column, and that was
 * wrong (the correction is in `docs/archive/NEXT-SESSION.md` §2.0).
 *
 * `.song-bar` is `display: none` below 768px, so this is desktop-only by
 * stylesheet. Phones keep `MobileNowPlaying`, untouched.
 *
 * ── DP's `useSongPlayer` IS DELIBERATELY NOT PORTED ─────────────────────────
 *
 * `SongDetailView` already owns `playing` / `currentTime` / `duration` and one
 * `<audio>`, already resolves URLs through `songAudioUrl()`, and already
 * `.catch()`es `audio.play()`. DP's hook does NOT catch it, and an uncaught
 * `NotAllowedError` on a cold load is a console error that the R-2 specs fail
 * on. Two sources for "what is playing" would also be two chances to disagree.
 * So this takes the state it needs as props and owns only the bar's own UI.
 *
 * ── EVERY ICON HERE WAS TAG-CHECKED AGAINST `SongPlayBar.css` (D4) ──────────
 *
 * `.song-bar__cover` is `width`/`height` only with no `mask-*` ⇒ a real `<img>`;
 * a `DpIcon` there would be a mask with no background to clip. The transport,
 * play and action icons all set `background-color: currentColor` + `mask-*`
 * ⇒ `DpIcon`. Both failure shapes are swept by `e2e/behaviour-regressions`'
 * mask-icon test.
 */

// `useLayoutEffect` warns during SSR; fall back to `useEffect` there. Not
// imported from `src/lib/ssr.ts` — that module keeps this helper private to
// itself, same as `Sidebar.tsx`'s own local copy.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface SongPlayBarProps {
  /**
   * Product owner request, 2026-08-14 — the bar is now always mounted (its
   * parent renders it whenever there's an `activeSong`, not just while a
   * preview is open) so a slide transition has something to animate to/from
   * in both directions, same "always-mounted + inert" convention already
   * used for `MvSheet`/`DpDialog` instead of a JS-timed unmount. `open`
   * replaces the old mount/unmount gate; `false` slides the bar down off-
   * screen via `transform: translateY(100%)` (designer-overrides.css) and
   * marks it `inert`.
   */
  open: boolean;
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
  onClose: () => void;
}

export function SongPlayBar({
  open,
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
  onClose,
}: SongPlayBarProps) {
  const { locale } = useLocale();
  const [shareOpen, setShareOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  /**
   * The bar is `position: fixed`, so it spans the viewport — including the
   * width the Sidebar occupies. DP offsets `left` by the Sidebar's MEASURED
   * width rather than a CSS constant, because that width is a runtime toggle
   * (collapsed / expanded), not a breakpoint value. Constraining the bar inside
   * `.app-layout__main` instead is not an option: a transformed ancestor turns
   * `position: fixed` into "scrolls away with the content".
   */
  // `useState(0)` is the SSR-safe answer — the server (and the first client
  // render, before they've had a chance to disagree) both render with no
  // sidebar measured yet. Reading `document` inside the initializer itself
  // (`useState(() => document.querySelector(...))`) is the exact pattern
  // `src/lib/ssr.ts` documents as MEASURED to throw React error 418 on
  // hydration — this needs the same fix as `useMediaQuery`: a safe constant
  // here, corrected in a LAYOUT effect below (before paint, not after).
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    // Read the current width SYNCHRONOUSLY here too, not just once the
    // observer's own first callback fires — that callback is async (fires
    // shortly after `observe()`, not immediately), so without this the bar
    // still rendered flush against the viewport edge for one frame, then
    // visibly snapped sideways once the real width arrived
    // (designer-reported, 2026-08-11). A layout effect runs before paint,
    // so this correction is invisible; the observer then only has to
    // handle actual LATER resizes (collapse/expand toggle).
    setSidebarWidth(sidebar.getBoundingClientRect().width);
    // getBoundingClientRect, not contentRect: Sidebar has padding and a border,
    // and a `left` offset needs the border-box width.
    const observer = new ResizeObserver((entries) =>
      setSidebarWidth(entries[0].target.getBoundingClientRect().width),
    );
    observer.observe(sidebar);
    return () => observer.disconnect();
  }, []);

  // TODO.md #5 / 7a: seeking goes through `ui/SeekBar`, which is keyboard-operable.
  // This bar arrived with the drop-2 re-sync (2026-08-07), AFTER TODO #5 listed the
  // four pointer-only seek bars — so it was a fifth instance of the same Serious
  // WCAG 2.1.1 defect that no list mentioned. Adopted 2026-08-12 with the other four.
  function seek(next: number) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    // S3: no clamp, same as every other seek in the product.
    audio.currentTime = Math.min(audio.duration, Math.max(0, next));
  }

  function applyVolume(next: number) {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = next;
      audio.muted = next === 0;
    }
    setVolume(next);
    setMuted(next === 0);
  }

  function toggleMute() {
    const audio = audioRef.current;
    const next = !muted;
    if (audio) audio.muted = next;
    setMuted(next);
  }

  // Product owner request, 2026-08-14 — album art + title open the song's own
  // detail page; username + avatar open the community profile. `/song/result`
  // already cold-resolves from a bare `?id=` (no flow state needed, see its
  // own header comment), so a plain `Link` is enough — no callback back to
  // the parent the way play/pause etc. need. `/creator` takes no id: same
  // single-mock-creator limitation `TopSongListItem`/`ListItem`/this file's
  // own `MobileNowPlaying`/`CommunityMvPlayer` already live with —
  // `CommunitySong.creator` is a display name, not an id (schemas.ts), so
  // there is no per-creator profile to route to yet. `display: contents` on
  // the two wraps around `.song-bar__cover`/`.song-bar__title` keeps each
  // element as the actual flex item its own class sizes — the `Link` itself
  // takes no part in the layout, only in the click.
  const songHref = localePath(locale, `/song/result?id=${song.id}&from=song-bar`);

  return (
    <div
      className={`song-bar${open ? " song-bar--visible" : ""}`}
      style={{ left: sidebarWidth }}
      inert={!open}
    >
      <Link href={songHref} aria-label={`Open ${song.title}`} style={{ display: "contents" }}>
        <img src={song.cover} alt="" className="song-bar__cover" />
      </Link>
      <div className="song-bar__meta">
        <Link href={songHref} style={{ display: "contents" }}>
          <p className="song-bar__title">{song.title}</p>
        </Link>
        {/* Figma node 2330:63547 (2311:62919) — a circular profile picture
            next to the creator name. `CommunitySong` has no avatar field
            (only `creator: string`, see schemas.ts), so — same as Figma's
            own placeholder — this is a decorative default badge, not a
            per-user photo. No DP-native class covers this new element, so
            it's styled inline rather than adding a rule to a
            verbatim-copied stylesheet. */}
        <Link
          href={localePath(locale, "/creator")}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "flex",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background:
                "linear-gradient(45deg, rgb(255, 107, 206) 14.6%, rgb(168, 85, 247) 50%, rgb(67, 56, 202) 85.4%)",
            }}
          >
            <span
              style={{
                display: "block",
                width: 7,
                height: 7,
                backgroundColor: "var(--neutral-dark-100)",
                WebkitMaskImage: 'url("/assets/icons/ui/ic_user.svg")',
                maskImage: 'url("/assets/icons/ui/ic_user.svg")',
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          </span>
          <p className="song-bar__username">{song.creator}</p>
        </Link>
      </div>

      <div className="song-bar__transport">
        <button
          type="button"
          className="song-bar__transport-btn"
          onClick={onPrev}
          aria-label="Previous"
        >
          <DpIcon name="ic_skip_back" className="song-bar__transport-icon" />
        </button>
        <button
          type="button"
          className="song-bar__play"
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          <DpIcon name={playing ? "ic_pause" : "ic_play"} className="song-bar__play-icon" />
        </button>
        <button
          type="button"
          className="song-bar__transport-btn"
          onClick={onNext}
          aria-label="Next"
        >
          <DpIcon name="ic_skip_forward" className="song-bar__transport-icon" />
        </button>
      </div>

      <span className="song-bar__time">{formatTime(currentTime)}</span>
      <SeekBar
        value={currentTime}
        max={duration}
        onSeek={seek}
        label="Seek within the song"
        className="song-bar__progress"
        trackClassName="song-bar__progress-track"
        fillClassName="song-bar__progress-fill"
        thumbClassName="song-bar__progress-thumb"
      />
      <span className="song-bar__time">{formatTime(duration)}</span>

      {/* Figma node 2330:64177 — order is Volume > Like > Share > Close. */}
      <div className="song-bar__volume">
        <div className="song-bar__volume-slider">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(event) => applyVolume(Number(event.target.value))}
            aria-label="Volume"
          />
        </div>
        <button
          type="button"
          className="song-bar__icon-btn"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <DpIcon
            name={muted || volume === 0 ? "ic_speaker_off" : "ic_speaker_on"}
            className="song-bar__icon"
          />
        </button>
      </div>

      {/* Figma node 2330:64177 (2311:62918's "Like" `SelectionToggle`) — was
          missing entirely from this bar. Wired through the same `likedIds`/
          `toggleLike` SongDetailView already uses for the list rows and for
          `MobileNowPlaying`'s own Like button, so liking here stays in sync
          with both. */}
      <button
        type="button"
        className={`song-bar__icon-btn${liked ? " song-bar__icon-btn--active" : ""}`}
        onClick={onToggleLike}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <DpIcon name={liked ? "ic_favorite_on" : "ic_favorite_off"} className="song-bar__icon" />
      </button>

      <button
        type="button"
        className="song-bar__icon-btn"
        onClick={() => setShareOpen(true)}
        aria-label="Share"
      >
        <DpIcon name="ic_share" className="song-bar__icon" />
      </button>

      {/* Figma node 2330:63547 (2330:64278) — "Button/Circular" XSmall/Tertiary
          glass pill, not the bare/transparent `.song-bar__icon-btn` the other
          icons here use. Reuses the shared `IconButton` (same component the
          hero mute button above now uses) instead of a new CSS rule. */}
      <IconButton
        size="xsmall"
        variant="tertiary"
        icon="ic_close"
        label="Close player"
        onClick={onClose}
      />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={song.title}
        url={buildShareUrl(song.id)}
      />
    </div>
  );
}
