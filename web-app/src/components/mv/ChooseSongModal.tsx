"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { MvSheet } from "./MvSheet";
import { DpIcon } from "@/components/ui/DpIcon";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { MY_SONGS, SAMPLE_SONGS, formatDuration } from "@/lib/mv/mock";
import type { Song } from "@/lib/mv/types";
import { useDemoFlag } from "@/components/demo/useDemo";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (song: Song) => void;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3g-2) ──────────────────
 *
 * DP source: `SongPickerSheet` inside `MVCreatePage.tsx`. Classes from
 * `src/styles/designer/MVCreatePage.css` (`.mv-song-picker__*`), verbatim.
 *
 * ── DP'S "USE" PILL IS HIDDEN UNTIL THE ROW IS ACTIVE, AND THAT IS A TRAP ───
 *
 * `.mv-song-picker__use` ships `opacity: 0; pointer-events: none`, revealed by
 * `.mv-song-picker__row:hover` (pointer devices) or `--active` (tap). Ported as
 * designed for the mouse, but that leaves the pill INVISIBLE AND FOCUSABLE —
 * the same defect G7 found on `.now-playing__lyrics-overlay`, once per row.
 *
 * The fix needs no new CSS, which matters because the designer stylesheets are
 * gated byte-for-byte: the row also counts as active while focus is inside it
 * (`onFocus`/`onBlur` bubble in React), so tabbing to a row's pill reveals it
 * and makes it clickable. Hover, tap and keyboard now all reach the same
 * control. Guarded by "3g-2: the Use pill is reachable by keyboard".
 *
 * ── WHAT DP DOES NOT HAVE ───────────────────────────────────────────────────
 *
 * MV-11's empty My Songs state — DP's catalog is a constant and can never be
 * empty, so it has no design for this. Product owner, 2026-08-28, Figma
 * "AI MV - Feature Room_Song Picker_Empty_L" (node 3200:69854): icon + "No
 * songs yet" + subtitle, no CTA — replaces this session's earlier hand-built
 * version (icon-less, with a "Create Song" button) now that a real design
 * exists. Reuses History's `.history-page__empty-icon/-message/-title/
 * -subtitle` classes verbatim (identical type spec) rather than duplicating
 * them under a new name.
 *
 * ── WHAT DP HAS THAT WA DID NOT ─────────────────────────────────────────────
 *
 * Row-click audio preview, with the art swapping to a pause icon. Ported
 * through `useAudioPlayer`, NOT DP's raw `audio.play()`: an un-gestured play()
 * rejects with `NotAllowedError`, and an uncaught rejection prints to the
 * console, which the R-2 specs assert is empty. Durations come from WA's own
 * `durationSec` instead of DP's eight hidden `<audio preload="metadata">`
 * probes — the data already has them, so the probes buy nothing.
 */
export function ChooseSongModal({ open, onClose, onPick }: Props) {
  const [tab, setTab] = useState<"my" | "sample">("my");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // `mySongsEmpty` (`?demo=1` panel): a brand-new account already sees this
  // state for free — `MY_SONGS` is only ever non-empty once someone visits
  // /song/create — so the flag exists purely to let an account that already
  // has songs reproduce it. Last render-time branch, per `demoStore.ts`.
  const demoMySongsEmpty = useDemoFlag("mySongsEmpty");
  const songs = tab === "my" ? (demoMySongsEmpty ? [] : MY_SONGS) : SAMPLE_SONGS;

  const preview = useAudioPlayer({
    src: songs.find((s) => s.id === activeId)?.url,
  });

  // Selecting a row starts its preview. It has to happen here rather than in the
  // click handler: `play` closes over the hook's CURRENT `src`, which only
  // becomes the newly-selected song on the render after `setActiveId`. Calling
  // it inline would play the previous row. (`play()` already swallows the
  // autoplay rejection — see the header note.)
  const { play } = preview;
  useEffect(() => {
    if (activeId) play();
  }, [activeId, play]);

  function switchTab(next: "my" | "sample") {
    preview.pause();
    setActiveId(null);
    setTab(next);
  }

  function handleRowClick(song: Song) {
    if (activeId === song.id) preview.toggle();
    else setActiveId(song.id);
  }

  function use(song: Song) {
    preview.pause();
    onPick(song);
    onClose();
  }

  return (
    <MvSheet
      open={open}
      onClose={onClose}
      label="Choose Song"
      title="Choose Song"
      variant="mv-song-picker"
    >
      <div className="mv-song-picker__tabs">
        {(["my", "sample"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`mv-song-picker__tab${t === tab ? " mv-song-picker__tab--active" : ""}`}
            onClick={() => switchTab(t)}
          >
            {t === "my" ? "My Songs" : "Sample Songs"}
          </button>
        ))}
      </div>

      {tab === "my" && songs.length === 0 ? (
        // MV-11: an empty My Songs tab prompts creation instead of a blank list.
        <div className="mv-sheet__body">
          <div className="mv-song-picker__empty">
            <DpIcon name="ic_song_ai" className="history-page__empty-icon" />
            <div className="history-page__empty-message">
              <p className="history-page__empty-title">No songs yet</p>
              <p className="history-page__empty-subtitle">
                Create your first AI song to use it here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mv-sheet__body mv-sheet__body--list">
          {songs.map((song) => {
            const active = activeId === song.id || focusedId === song.id;
            const playing = activeId === song.id && preview.playing;
            return (
              <div
                key={song.id}
                className={`mv-song-picker__row${active ? " mv-song-picker__row--active" : ""}`}
                onClick={() => handleRowClick(song)}
                onFocus={() => setFocusedId(song.id)}
                onBlur={() => setFocusedId((id) => (id === song.id ? null : id))}
              >
                <span className="mv-song-picker__art">
                  <img src={song.art} alt="" />
                  <span className="mv-song-picker__art-scrim" aria-hidden="true" />
                  <DpIcon
                    name={playing ? "ic_pause" : "ic_play"}
                    className="mv-song-picker__art-icon"
                  />
                </span>
                <span className="mv-song-picker__info">
                  <span className="mv-song-picker__title">{song.title}</span>
                  <span className="mv-song-picker__duration">
                    {playing ? (
                      <>
                        <span className="mv-song-picker__duration-current">
                          {formatDuration(Math.floor(preview.currentTime))}
                        </span>
                        <span> / {formatDuration(song.durationSec)}</span>
                      </>
                    ) : (
                      formatDuration(song.durationSec)
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  className="mv-song-picker__use"
                  onClick={(e) => {
                    e.stopPropagation();
                    use(song);
                  }}
                >
                  Use
                </button>
              </div>
            );
          })}
        </div>
      )}
    </MvSheet>
  );
}
