"use client";

// Public, unauthenticated Share Link Page.
// Redesigned 2026-08-24 (product owner, Figma "Share Page - MV" / song
// equivalent, node 2906:61191 / 2881:57358) — this REVERSES the 2026-07-23
// "simplified chrome" decision below: title/creator and a two-button footer
// are back, and the native `<audio>`/`<video controls>` are replaced by a
// custom controller matching the one already shipped for `/watch`
// (`CommunityMvPlayer.tsx`) and `/song/play` (`SongPlayBar.tsx`) — same
// `DpIcon` names and the shared `SeekBar`, new BEM classes in
// `designer-overrides.css` since DP has not vendored a Share Page stylesheet
// yet (there is nothing in `src/styles/designer/` to copy from).
// This route renders WITHOUT the app shell (see AppShell) and is not behind AuthGuard.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { resolveShare, type SharedMedia } from "@/lib/share";
import { downloadFile } from "@/lib/download";
import { DpIcon } from "@/components/ui/DpIcon";
import { SeekBar } from "@/components/ui/SeekBar";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const PLAYBACK_RATES = [1, 1.5, 2, 0.5] as const;

/** The MV controller's "more" menu (product owner, 2026-08-24): Download,
 *  Playback Speed (cycles through `PLAYBACK_RATES` on each click, so the
 *  menu stays open for repeated adjustment), and Picture-in-Picture — closes
 *  on Escape, an outside click, or picking Download/PiP (one-shot actions). */
function MvMoreMenu({
  open,
  onClose,
  rate,
  onCycleRate,
  onDownload,
  onPictureInPicture,
}: {
  open: boolean;
  onClose: () => void;
  rate: number;
  onCycleRate: () => void;
  onDownload: () => void;
  onPictureInPicture: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="share-mv__menu-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="share-mv__menu" role="menu">
        <button
          type="button"
          role="menuitem"
          className="share-mv__menu-item"
          onClick={() => {
            onDownload();
            onClose();
          }}
        >
          Download
        </button>
        <button type="button" role="menuitem" className="share-mv__menu-item" onClick={onCycleRate}>
          Playback Speed
          <span className="share-mv__menu-item-value">{rate}x</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="share-mv__menu-item"
          onClick={() => {
            onPictureInPicture();
            onClose();
          }}
        >
          Picture in Picture
        </button>
      </div>
    </>
  );
}

/** Product owner, 2026-08-24: the app-icon badge was rendering as a circle —
 *  `ic_app_ycm.png` already bakes in its own rounded-SQUARE corners (a proper
 *  superellipse, not 50%), so clipping it with a large `border-radius` cut
 *  those corners off into a circle instead of just being redundant. And the
 *  wordmark switches from an image (`muse_wordmark_logo_white.png`) to real
 *  text, matching this page's own pre-redesign convention and every other
 *  header in the app (`MobileHeader.tsx`, the original `ShareLinkView`).
 *
 *  Badge swapped 2026-09-02 (product owner) from the placeholder
 *  `/assets/icons/app/ic_app_ycm.png` (a musical-note glyph, never updated
 *  once the real brand assets landed) to the actual YCM brand mark —
 *  `/assets/brand/ic_app_ycm.svg`, same rounded-square-plus-gradient shape
 *  the comment above already assumes, just the correct artwork. SVG over
 *  that folder's own `.png`/`@2x.png` siblings for the usual reason: it's
 *  resolution-independent and every other brand-logo consumer already
 *  prefers it. */
function Logo() {
  return (
    <span className="share-page__logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/brand/ic_app_ycm.svg" alt="" className="share-page__logo-badge" />
      <span className="share-page__logo-text">
        YouCam <span className="share-page__logo-text-accent">Muse</span>
      </span>
    </span>
  );
}

/** Song panel: album art + title/creator + a pill-shaped media controller
 *  (play/pause, combined time, seek, mute, download) — matches
 *  `SongPlayBar.tsx`'s icon vocabulary, laid out per the Figma "Song Panel". */
function SongPanel({ media, onDownload }: { media: SharedMedia; onDownload: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      // A cold load has no user activation, so play() can reject — catch it
      // rather than letting it surface as an unhandled rejection (R-2).
      void a.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
  }

  function seek(next: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = next;
    setCurrentTime(next);
  }

  return (
    <div className="share-song">
      {/* Hidden native element — the visible controls below drive it, same
          split as CommunityMvPlayer's <video> + custom control row. */}
      <audio
        ref={audioRef}
        src={media.audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        className="share-song__native-audio"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.posterUrl} alt="" className="share-song__art" />
      <div className="share-song__meta">
        <p className="share-song__title">{media.title}</p>
        {media.creator && (
          <div className="share-song__creator">
            <span className="share-song__creator-avatar">
              <DpIcon name="ic_user" className="share-song__creator-avatar-icon" />
            </span>
            <span className="share-song__creator-name">{media.creator}</span>
          </div>
        )}
      </div>
      <div className="share-song__controller">
        <button
          type="button"
          className="share-song__icon-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          <DpIcon name={playing ? "ic_pause" : "ic_play"} className="share-song__icon" />
        </button>
        <div className="share-song__timeline">
          <span className="share-song__time">
            <span className="share-song__time-current">{formatTime(currentTime)}</span>
            {` / ${formatTime(duration)}`}
          </span>
          <SeekBar
            value={currentTime}
            max={duration}
            onSeek={seek}
            label="Seek"
            className="share-song__progress"
            trackClassName="share-song__progress-track"
            fillClassName="share-song__progress-fill"
            thumbClassName="share-song__progress-thumb"
          />
        </div>
        <button
          type="button"
          className="share-song__icon-btn"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <DpIcon name={muted ? "ic_speaker_off" : "ic_speaker_on"} className="share-song__icon" />
        </button>
        <button
          type="button"
          className="share-song__icon-btn"
          onClick={onDownload}
          aria-label="Download"
        >
          <DpIcon name="ic_download" className="share-song__icon" />
        </button>
      </div>
    </div>
  );
}

/** MV panel: portrait video + a bottom gradient-scrim controller (play/pause,
 *  combined time, seek, mute, fullscreen, download) — same control row as
 *  `/watch`'s `CommunityMvPlayer.tsx`, plus the download icon Figma adds. */
function MvPanel({ media, onDownload }: { media: SharedMedia; onDownload: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rateIndex, setRateIndex] = useState(0);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function cycleRate() {
    const v = videoRef.current;
    if (!v) return;
    const next = (rateIndex + 1) % PLAYBACK_RATES.length;
    v.playbackRate = PLAYBACK_RATES[next];
    setRateIndex(next);
  }

  function requestPip() {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    void v.requestPictureInPicture().catch(() => {});
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = panelRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  }

  function seek(next: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = next;
    setCurrentTime(next);
  }

  return (
    <div className="share-mv" ref={panelRef}>
      <video
        ref={videoRef}
        src={media.videoUrl}
        poster={media.posterUrl}
        playsInline
        className="share-mv__video"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
      />
      <div className="share-mv__controller">
        <button
          type="button"
          className="share-mv__icon-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          <DpIcon name={playing ? "ic_pause" : "ic_play"} className="share-mv__icon" />
        </button>
        <div className="share-mv__timeline">
          <span className="share-mv__time">
            <span className="share-mv__time-current">{formatTime(currentTime)}</span>
            {` / ${formatTime(duration)}`}
          </span>
          <SeekBar
            value={currentTime}
            max={duration}
            onSeek={seek}
            label="Seek"
            className="share-mv__progress"
            trackClassName="share-mv__progress-track"
            fillClassName="share-mv__progress-fill"
            thumbClassName="share-mv__progress-thumb"
          />
        </div>
        <button
          type="button"
          className="share-mv__icon-btn"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <DpIcon name={muted ? "ic_speaker_off" : "ic_speaker_on"} className="share-mv__icon" />
        </button>
        <button
          type="button"
          className="share-mv__icon-btn"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
        >
          <DpIcon name="ic_expand" className="share-mv__icon" />
        </button>
        <button
          type="button"
          className="share-mv__icon-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <DpIcon name="ic_more" className="share-mv__icon" />
        </button>
        <MvMoreMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          rate={PLAYBACK_RATES[rateIndex]}
          onCycleRate={cycleRate}
          onDownload={onDownload}
          onPictureInPicture={requestPip}
        />
      </div>
    </div>
  );
}

export function ShareLinkView() {
  const params = useSearchParams();
  const { locale } = useLocale();
  const { history } = useHistory();

  const id = params.get("id");
  const forcedExpired = params.get("type") === "expired";
  const media = forcedExpired ? null : resolveShare(id, history);

  const home = localePath(locale, "/");

  const Header = (
    <header className="share-page__header">
      <Link href={home} className="share-page__logo-link" aria-label="YouCam Muse home">
        <Logo />
      </Link>
    </header>
  );

  // ── Expired / invalid ───────────────────────────────────────────────────────
  if (!media) {
    return (
      <div className="share-page">
        {Header}
        <main className="share-page__expired">
          <div className="share-page__expired-icon">
            <DpIcon name="ic_alert" className="share-page__expired-icon-glyph" />
          </div>
          {/* Product owner, 2026-08-19: share links DO NOT EXPIRE. The old copy
              ("available for 30 days") described a rule that was never built and
              is now decided against — creations are kept indefinitely, so a link
              to one has no reason to lapse. This state is reached only when an id
              cannot be resolved, so the wording says that instead of inventing a
              deadline the product does not enforce. */}
          <h1 className="share-page__expired-title">This link isn&apos;t available</h1>
          <p className="share-page__expired-body">
            We couldn&apos;t find this creation. Ask the sender to share it again.
          </p>
        </main>
      </div>
    );
  }

  // ── Valid link — panel + two actions ────────────────────────────────────────
  const downloadName = media.kind === "mv" ? `${media.title}.mp4` : `${media.title}.mp3`;
  const downloadUrl = media.videoUrl ?? media.audioUrl;
  const download = () => {
    if (downloadUrl) downloadFile(downloadUrl, downloadName);
  };
  // Product owner, 2026-08-24: this page is unauthenticated and mostly reached
  // by people with no account — dropping them straight into a creation flow
  // skips the product entirely. Both CTAs go to the home page instead, so a
  // new visitor sees the hero/tool selector first.
  //
  // Product owner, 2026-09-01: the LABEL is now neutral too. It used to read
  // "Create MV" / "Create Song" by media kind while both went to the home
  // page, and that mismatch is the kind of thing QA reports as a broken link —
  // the button named a creation flow it never opened. One string for both
  // kinds, naming the destination it actually reaches. The pill keeps its
  // kind-specific GRADIENT (`--gradient-mv` / `--gradient-song`), which is
  // decoration rather than a promise about where it goes.
  const createHref = home;
  const createLabel = "Try YouCam Muse";

  return (
    <div className="share-page">
      {Header}
      <main className="share-page__main">
        <div className="share-page__list">
          {media.kind === "mv" ? (
            <MvPanel media={media} onDownload={download} />
          ) : (
            <SongPanel media={media} onDownload={download} />
          )}
          <div className="share-page__actions">
            <button type="button" className="share-page__pill share-page__pill--dark" onClick={download}>
              Download
              <DpIcon name="ic_download" className="share-page__pill-icon" />
            </button>
            <Link
              href={createHref}
              className={`share-page__pill share-page__pill--gradient-${media.kind}`}
            >
              {createLabel}
              <DpIcon name="ic_arrow_right" className="share-page__pill-icon" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
