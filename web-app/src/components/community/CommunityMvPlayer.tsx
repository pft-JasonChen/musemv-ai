"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { DpIcon } from "@/components/ui/DpIcon";
import { SeekBar } from "@/components/ui/SeekBar";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { buildShareUrl } from "@/lib/share";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DEFAULT_COMPOSE } from "@/lib/mv/types";
import { getCommunityMv, NEW_MVS } from "@/lib/mv/community";
import { CommunityEmpty } from "@/components/community/EmptyState";

/**
 * Slice 3d — `/watch`, migrated to DP's `MVDetailPage` UPPER half (`.mv-player*`).
 * The lower half (the justified grid) is `/explore/mvs` and was migrated in 3a;
 * `MVDetailPage.css` was copied verbatim then and already carries these rules.
 *
 * ── This is the screen A5 blocked ───────────────────────────────────────────
 * `MVDetailPage` is where A5 was first found: DP hides every navbar below 767px
 * and this page has no in-page back, so on a phone it was enterable and not
 * leavable. WA worked around it with a bespoke control inside `DetailNavbar`;
 * the 2026-08-06 drop (`2670ed2`) answered it upstream — AppLayout stopped
 * hiding `.detail-navbar` and DetailNavbar.css grew a compact 50px back+title
 * bar — so the workaround is deleted and this screen is on DP's own control.
 *
 * DP goes one step further here and passes `hideMobileBar`, because its
 * MVDetailPage renders a Figma-specific `.mv-player__mobile-header` instead.
 * That header is NOT ported yet, so WA keeps DetailNavbar's bar: it is the
 * same affordance, and dropping one before building the other is exactly how
 * A5 happened the first time.
 *
 * ── What DP's overlay drops, and why that is allowed ────────────────────────
 * WA's pre-migration screen had a side panel with a "# Music Video" badge, the
 * meta line, a stats block (plays/likes/shares) and the source prompt. DP's is
 * an immersive player: video, floating title + creator, like/share, CTA and
 * transport. Those four are genuinely gone.
 *
 * That was checked against the spec rather than assumed. **AC-EXP-04** requires
 * muted 3:4 playback with play/pause + mute, and Like, Share and Create Music
 * Video pre-filling `/mv/room` — all present. The badge/meta/stats/prompt are
 * not in any AC, so this is a redesign, not a silent spec regression. Recorded
 * in `DESIGNER-TODO.md` so the designer sees what the port costs.
 *
 * DP also ADDS a seek bar and fullscreen. The seek bar goes through `SeekBar`,
 * which is keyboard-operable — DP's is pointer-only, the defect G7 logged
 * against the song player (`TODO.md` #5). No point shipping it twice.
 */
export function CommunityMvPlayer() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useLocale();
  const id = params.get("id");
  const found = getCommunityMv(id);
  // AC-EXP-07: a missing/invalid id falls back to a default item rather than crashing.
  const mv = found ?? NEW_MVS[0];

  const { setCompose } = useMvFlow();
  const { requireLogin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      // A cold load has no user activation, so play() can reject with
      // NotAllowedError. An unhandled rejection is a console error, and the R-2
      // specs assert the console is empty (the 3b lesson).
      void v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = playerRef.current;
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

  // GL-02/EXP-02: gate at the action — creating from a community MV requires sign-in.
  function createMv() {
    requireLogin(() => {
      setCompose({
        ...DEFAULT_COMPOSE,
        mvType: mv.mvType,
        description: mv.prompt,
        song: {
          id: `tpl-${mv.id}`,
          source: "sample",
          title: mv.matchedSong.title,
          durationSec: mv.matchedSong.durationSec,
          art: mv.matchedSong.art,
        },
        settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: mv.title } },
      });
      router.push(localePath(locale, "/mv/room"));
    });
  }

  function toggleLike() {
    requireLogin(() => setLiked((l) => !l));
  }

  // EXP-06: an id that resolves to nothing shows a not-found state, not a silent
  // fallback to the first MV.
  if (id && !found) {
    return (
      <>
        <DetailNavbar fallbackPath="/explore/mvs" />
        <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
          <CommunityEmpty
            variant="not-found"
            action={
              <Button onClick={() => router.push(localePath(locale, "/explore/mvs"))}>
                Explore Music Videos
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <DetailNavbar fallbackPath="/explore/mvs" />

      <div className="mv-player" ref={playerRef}>
        <video
          className="mv-player__backdrop"
          src={mv.video}
          muted
          loop
          autoPlay
          playsInline
          aria-hidden="true"
        />
        <div className="mv-player__backdrop-scrim" aria-hidden="true" />

        <div className="mv-player__stage mv-player__stage--portrait">
          <video
            key={mv.id}
            ref={videoRef}
            className="mv-player__video"
            src={mv.video}
            autoPlay
            loop
            muted={muted}
            playsInline
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={togglePlay}
          />
        </div>

        <div className="mv-player__floating">
          <div className="mv-player__meta-row">
            <div className="mv-player__meta">
              <p className="mv-player__title">{mv.title}</p>
              {/* R-9: next/link + localePath. DP assigns window.location.href here,
                  which is a full page load AND loses the locale prefix. */}
              <Link href={localePath(locale, "/creator")} className="mv-player__user">
                <span className="mv-player__avatar">
                  <DpIcon name="ic_account" className="mv-player__avatar-icon" />
                </span>
                <span className="mv-player__username">{mv.creator}</span>
              </Link>
            </div>

            <div className="mv-player__actions">
              <div className="mv-player__like-share">
                <button
                  type="button"
                  onClick={toggleLike}
                  aria-label={liked ? "Unlike" : "Like"}
                  aria-pressed={liked}
                  className={`icon-button icon-button--medium icon-button--ghost mv-player__action-icon${
                    liked ? " mv-player__action-icon--active" : ""
                  }`}
                >
                  <DpIcon
                    name={liked ? "ic_favorite_on" : "ic_favorite_off"}
                    className="icon-button__icon"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  aria-label="Share"
                  className="icon-button icon-button--medium icon-button--ghost mv-player__action-icon"
                >
                  <DpIcon name="ic_share" className="icon-button__icon" />
                </button>
              </div>
              <Button className="mv-player__cta" onClick={createMv}>
                Create MV
                {/* `--mask` is what PAINTS it: `.button__icon` only sets 16×16,
                    and DP's own Button splits the two (`__icon` alone is for its
                    <img> form). Without the modifier this arrow was a 16×16 hole
                    — found by `.iconcheck.mjs`, not by any screenshot. */}
                <DpIcon name="ic_arrow_right" className="button__icon button__icon--mask" />
              </Button>
            </div>
          </div>

          <div className="mv-player__controls">
            <button
              type="button"
              className="mv-player__control-btn"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              <DpIcon name={playing ? "ic_pause" : "ic_play"} className="mv-player__control-icon" />
            </button>

            <span className="mv-player__time">{formatTime(currentTime)}</span>

            <SeekBar
              value={currentTime}
              max={duration}
              onSeek={seek}
              label="Seek"
              className="mv-player__progress"
              trackClassName="mv-player__progress-track"
              fillClassName="mv-player__progress-fill"
              thumbClassName="mv-player__progress-thumb"
            />

            <span className="mv-player__time">{formatTime(duration)}</span>

            <button
              type="button"
              className="mv-player__control-btn"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              <DpIcon
                name={muted ? "ic_speaker_off" : "ic_speaker_on"}
                className="mv-player__control-icon"
              />
            </button>

            <button
              type="button"
              className="mv-player__control-btn"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
            >
              <DpIcon name="ic_expand" className="mv-player__control-icon" />
            </button>
          </div>
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={mv.title}
        url={buildShareUrl(mv.id)}
      />
    </>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
