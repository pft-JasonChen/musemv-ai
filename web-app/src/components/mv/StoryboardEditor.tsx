"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { COST_RENDER, DESCRIPTION_MAX } from "@/lib/mv/types";
import { formatDuration, SAMPLE_AUDIO } from "@/lib/mv/mock";
import { buildTimedLines } from "@/lib/mv/lyrics";
import { downloadFile } from "@/lib/download";

const fmtTs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3h) ────────────────────
 *
 * DP source: `MVStoryboardPage`'s SECOND stage (Figma "Edit Storyboard_L",
 * node 1344:26880). Classes from `src/styles/designer/MVStoryboardPage.css`,
 * verbatim. The first stage is `StoryboardGenerationScreen` — one DP file, two
 * WA routes.
 *
 * ── DP'S LAYOUT IS A REAL CHANGE, NOT A RESKIN ──────────────────────────────
 *
 * WA had one column with a 200px character rail. DP is a 700/332 two-column
 * desktop split that COLLAPSES INTO A SINGLE INTERLEAVED SEQUENCE below 1024px
 * (`display: contents` + per-section `order`): Character Image → MV Song →
 * Visual Style → Story → Story Line → Lyrics. That reorder is entirely in the
 * stylesheet, so the section CLASSES (`--char-image`, `--mv-song`, …) are
 * load-bearing markup, not decoration — drop one and its section silently
 * jumps to the end of the phone layout.
 *
 * ── WHAT DP DOES NOT HAVE, AND IS KEPT ──────────────────────────────────────
 *
 * · GL-01 credit gating on the CTA. DP's button navigates unconditionally.
 * · `resetForRerender()` before pushing to `/mv/creating`, so a previous result
 *   cannot leak into the new render.
 * · Real content. DP renders four hardcoded `MOCK_SCENES` and a fixed lyric
 *   list; this renders `storyboard.scenes` from the job and `storyboard.lyrics`
 *   through `buildTimedLines`, which derives each timestamp from the song's
 *   duration instead of hardcoding "00:05:00".
 * · `EnhanceButton`, which goes through `api.enhancePrompt` and charges per
 *   SONG-04 (G5-d #10). DP appends a canned sentence. It is DP-skinned via
 *   `bem="mv-storyboard"`, so the markup is DP's and the behaviour is WA's.
 * · The render cost. DP's CTA reads "Create MV" and never says what it costs;
 *   this is the second place a 200-credit charge can start (the Mode sheet is
 *   the first), so the number stays — as plain text inside DP's own flex CTA,
 *   because inventing a class the stylesheet does not define would render
 *   nothing at all.
 *
 * ── WHAT DP HAS THAT WA DID NOT, AND IS PORTED ──────────────────────────────
 *
 * Download and Expand on the character image (with a full-screen preview), a
 * playable MV Song row with a live position readout, and the collapsible STORY
 * LINE header. The two image buttons wrap real `<img>` tags, not `DpIcon`:
 * `.mv-storyboard__char-download img` is an ELEMENT selector setting only
 * width/height, so a mask span there matches nothing and measures 0x0.
 */
export function StoryboardEditor() {
  const router = useRouter();
  const { locale } = useLocale();
  const { storyboard, setStoryboard, compose, resetForRerender } = useMvFlow();
  const { credits } = useCredits();
  const [buyOpen, setBuyOpen] = useState(false);
  const [storylineOpen, setStorylineOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  // The MV song is play-only here — the song is locked after creation, so this
  // section only previews it. Fall back to the demo track so the control is
  // functional for library/sample songs that carry no local URL.
  const songPlayer = useAudioPlayer({ src: compose.song?.url ?? SAMPLE_AUDIO });

  function generateMv() {
    // GL-01: block the render when the balance can't cover it; route to IAP.
    if (credits < COST_RENDER) {
      setBuyOpen(true);
      return;
    }
    songPlayer.pause();
    resetForRerender();
    router.push(localePath(locale, "/mv/creating"));
  }

  // Tolerant redirect: wait briefly so a persisted storyboard can hydrate.
  useEffect(() => {
    if (storyboard) return;
    const t = setTimeout(() => router.replace(localePath(locale, "/mv/room")), 400);
    return () => clearTimeout(t);
  }, [storyboard, router, locale]);

  useEffect(() => {
    if (!previewOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  if (!storyboard) return null;

  const updateScene = (id: string, text: string) =>
    setStoryboard((sb) =>
      sb ? { ...sb, scenes: sb.scenes.map((s) => (s.id === id ? { ...s, text } : s)) } : sb,
    );
  const setVisualStyle = (visualStyle: string) =>
    setStoryboard((sb) => (sb ? { ...sb, visualStyle } : sb));

  const songDuration = compose.song?.durationSec ?? 0;

  return (
    <>
      <DetailNavbar title="Edit Storyboard" fallbackPath="/mv/room" />

      <div className="mv-storyboard">
        <div className="mv-storyboard__panel">
          <div className="mv-storyboard__section mv-storyboard__section--visual-style">
            <p className="mv-storyboard__label">VISUAL STYLE</p>
            <div className="mv-storyboard__input-box">
              <textarea
                className="mv-storyboard__textarea"
                maxLength={DESCRIPTION_MAX}
                value={storyboard.visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                aria-label="Visual style"
              />
              <div className="mv-storyboard__input-footer">
                <EnhanceButton
                  value={storyboard.visualStyle}
                  kind="storyboard"
                  onEnhanced={setVisualStyle}
                  bem="mv-storyboard"
                />
                <span className="mv-storyboard__char-count">
                  {storyboard.visualStyle.length}/{DESCRIPTION_MAX}
                </span>
              </div>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--story">
            <p className="mv-storyboard__label">STORY</p>
            <div className="mv-storyboard__display-card mv-storyboard__display-card--flat">
              <p className="mv-storyboard__display-text mv-storyboard__display-text--muted">
                {storyboard.story}
              </p>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--story-line">
            <button
              type="button"
              className="mv-storyboard__storyline-header"
              onClick={() => setStorylineOpen((open) => !open)}
              aria-expanded={storylineOpen}
            >
              <p className="mv-storyboard__label">STORY LINE</p>
              <DpIcon
                name="ic_chevron-right"
                className={`mv-storyboard__storyline-chevron${
                  storylineOpen ? " mv-storyboard__storyline-chevron--open" : ""
                }`}
              />
            </button>

            {storylineOpen && (
              <div className="mv-storyboard__scenes">
                {storyboard.scenes.map((scene) => (
                  <div key={scene.id} className="mv-storyboard__scene">
                    <div className="mv-storyboard__scene-header">
                      <p className="mv-storyboard__scene-title">Scene {scene.index}</p>
                      <p className="mv-storyboard__scene-time">{scene.range}</p>
                    </div>
                    <div className="mv-storyboard__input-box">
                      <textarea
                        className="mv-storyboard__textarea"
                        maxLength={DESCRIPTION_MAX}
                        value={scene.text}
                        onChange={(e) => updateScene(scene.id, e.target.value)}
                        aria-label={`Scene ${scene.index}`}
                      />
                      <div className="mv-storyboard__input-footer">
                        <EnhanceButton
                          value={scene.text}
                          kind="storyboard"
                          onEnhanced={(t) => updateScene(scene.id, t)}
                          bem="mv-storyboard"
                        />
                        <span className="mv-storyboard__char-count">
                          {scene.text.length}/{DESCRIPTION_MAX}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <FloatingCTA alignToParent>
            <button type="button" className="mv-storyboard__cta" onClick={generateMv}>
              <span>Create MV</span>
              {/* Plain text, no class: DP's CTA has no price slot, and a class no
                  stylesheet defines paints nothing without erroring. */}
              <span>· {COST_RENDER} Credits</span>
              <DpIcon name="ic_arrow_right" className="mv-storyboard__cta-icon" />
            </button>
          </FloatingCTA>
        </div>

        <div className="mv-storyboard__side">
          <div className="mv-storyboard__section mv-storyboard__section--char-image">
            <p className="mv-storyboard__label">CHARACTER IMAGE</p>
            <div className="mv-storyboard__char-image">
              <img
                src={storyboard.characterImage}
                alt="Storyboard character"
                className="mv-storyboard__char-photo"
              />
              {/* A <button>, not DP's download anchor: `guard-greps.sh` bans a
                  literal internal href, and this one is a real action anyway —
                  the same `downloadFile` History and /creator call. */}
              <button
                type="button"
                className="mv-storyboard__char-download"
                onClick={() => downloadFile(storyboard.characterImage, "character.jpg")}
                aria-label="Download character image"
              >
                <img src="/assets/icons/ui/ic_download.svg" alt="" />
              </button>
              <button
                type="button"
                className="mv-storyboard__char-expand"
                onClick={() => setPreviewOpen(true)}
                aria-label="Expand character image"
              >
                <img src="/assets/icons/ui/ic_expand.svg" alt="" />
              </button>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--mv-song">
            <p className="mv-storyboard__label">MV SONG</p>
            <div className="mv-storyboard__song">
              <button
                type="button"
                className="mv-storyboard__song-art"
                onClick={songPlayer.toggle}
                aria-label={songPlayer.playing ? "Pause song" : "Play song"}
              >
                <img src={compose.song?.art ?? "/assets/images/album-art/album_05.jpg"} alt="" />
                <span className="mv-storyboard__song-art-scrim" aria-hidden="true" />
                <DpIcon
                  name={songPlayer.playing ? "ic_pause" : "ic_play"}
                  className="mv-storyboard__song-art-icon"
                />
              </button>
              <div className="mv-storyboard__song-info">
                <p className="mv-storyboard__song-title">
                  {compose.song?.title ?? "Down the Memory Lane"}
                </p>
                <p className="mv-storyboard__song-duration">
                  {songPlayer.playing ? (
                    <>
                      <span className="mv-storyboard__song-current-time">
                        {formatDuration(Math.floor(songPlayer.currentTime))}
                      </span>
                      <span>{` / ${formatDuration(songDuration || 145)}`}</span>
                    </>
                  ) : (
                    formatDuration(songDuration || 145)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--lyrics">
            <p className="mv-storyboard__label">LYRICS</p>
            {/* G7 a11y: this panel scrolls, so a keyboard-only user needs a way
                into it (axe `scrollable-region-focusable`, WCAG 2.1.1). It holds
                no focusable children of its own, hence tabindex on the region. */}
            <div className="mv-storyboard__lyrics" tabIndex={0} role="region" aria-label="Lyrics">
              {buildTimedLines(storyboard.lyrics, songDuration).map((l, i) => (
                <div key={i} className="mv-storyboard__lyrics-line">
                  <span className="mv-storyboard__lyrics-time">{fmtTs(l.t)}</span>
                  <span className="mv-storyboard__lyrics-text">{l.line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div
          className="mv-storyboard__image-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Character image preview"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="mv-storyboard__image-preview" onClick={(e) => e.stopPropagation()}>
            <img src={storyboard.characterImage} alt="Storyboard character enlarged" />
            <button
              type="button"
              className="mv-storyboard__image-preview-close"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close image preview"
            >
              <img src="/assets/icons/ui/ic_close.svg" alt="" />
            </button>
          </div>
        </div>
      )}

      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </>
  );
}
