"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { MvSheet } from "./MvSheet";
import { DpIcon } from "@/components/ui/DpIcon";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { formatDuration } from "@/lib/mv/mock";
import type { Song } from "@/lib/mv/types";

interface Props {
  open: boolean;
  song: Song | null;
  onClose: () => void;
  onConfirm: (song: Song) => void;
}

/**
 * Figma "Trim Audio" (node 90:1452) waveform's own 45 bar heights, copied from
 * DP verbatim — there is no real audio analysis to derive real ones from.
 */
const BARS = [
  6, 16, 10, 26, 14, 36, 8, 28, 16, 38, 12, 32, 21, 42, 16, 34, 12, 26, 18, 22, 14, 18, 8, 20, 6,
  16, 10, 26, 14, 36, 8, 28, 16, 38, 12, 32, 21, 6, 16, 34, 12, 26, 18, 22, 14,
];
const DEFAULT_START_PCT = 15;
const DEFAULT_END_PCT = 70;
/**
 * S2 / MV-01: an MV needs at least 30s of audio; the trim can't be shorter.
 *
 * **Exported since 2026-09-01** because `MvRoom.importAudio` enforces the same
 * floor at UPLOAD time (a track shorter than this can never be trimmed up to
 * it, so it is rejected before this dialog ever opens). Two hardcoded 30s
 * literals in two files is exactly the drift that makes one of them wrong
 * later — there is one constant, and this is it.
 */
export const MIN_TRIM_SEC = 30;
/** Handles can't cross. A PERCENTAGE clamp, deliberately looser than the 30s rule. */
const MIN_GAP_PCT = 5;

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3g-2) ──────────────────
 *
 * DP source: `TrimAudioSheet` inside `MVCreatePage.tsx`. Classes from
 * `src/styles/designer/MVCreatePage.css` (`.mv-trim-sheet__*`), verbatim.
 *
 * ── S2 LIVES HERE, AND DP'S VERSION OF IT IS NOT EQUIVALENT ─────────────────
 *
 * DP enforces `TRIM_MIN_GAP = 0.08` — eight percent OF THE TRACK, not an
 * absolute duration. On a 60-second song that permits a 4.8-second clip. The
 * plan (§1.4, S2) decided WA's absolute `MIN_TRIM_SEC = 30` wins, so DP's
 * constant is NOT ported and the rule keeps both of its halves: the user is
 * told why (`minimum 30s`) and the confirming action is blocked, in the footer
 * and in the phone header check alike.
 *
 * The 5% handle clamp is a SEPARATE, looser rule and stays as it was: it only
 * stops the two handles crossing. If it were raised to the 30s floor the error
 * state would be unreachable and `e2e`'s "S2 trim floor" would pass because the
 * rule could never be violated, not because it is enforced.
 *
 * ── TWO THINGS DP HAS NO CLASS FOR ──────────────────────────────────────────
 *
 * · The floor's reason line. Rendered with DP's own `.mv-trim-sheet__desc`
 *   typography, tinted with the native `--color-action-danger` token when the
 *   selection is short.
 * · The playback playhead. DP's sheet previews the WHOLE song and draws no
 *   position marker; WA's preview is confined to the trim range, where a marker
 *   is what tells you the preview restarted at the handle. There is no DP class
 *   to reuse, so it is inline-styled — the alternative, inventing a class name
 *   no stylesheet defines, is the documented invisible-element trap, and the
 *   designer stylesheets are gated byte-for-byte and cannot gain one.
 *
 * A11y parity note: the handles keep WA's `role="slider"` + `aria-label` +
 * `aria-valuenow` (which `e2e`'s S2 test locates them by). Like WA's pre-
 * migration version they are still pointer-only; that gap is unchanged by this
 * slice, not introduced by it.
 */
export function TrimAudioModal({ open, song, onClose, onConfirm }: Props) {
  const total = song?.durationSec && song.durationSec > 0 ? song.durationSec : 180;
  const trackRef = useRef<HTMLDivElement>(null);
  // ONE piece of state, not two: each handle clamps against the other, and the
  // window `pointermove` listener below closes over the render that installed
  // it. A functional update reads both edges live; two separate `useState`s
  // would need refs written during render, which `react-hooks/refs` rejects.
  const [{ startPct, endPct }, setTrim] = useState({
    startPct: DEFAULT_START_PCT,
    endPct: DEFAULT_END_PCT,
  });

  const startSec = Math.round((startPct / 100) * total);
  const endSec = Math.round((endPct / 100) * total);

  const { playing, currentTime, toggle, pause } = useAudioPlayer({
    src: song?.url,
    range: { start: startSec, end: endSec },
  });

  // Re-seed the handles each time the sheet opens: from the song's existing trim
  // when re-editing, otherwise the defaults (render-phase adjustment).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (song?.trim && total > 0) {
        setTrim({
          startPct: (song.trim.start / total) * 100,
          endPct: (song.trim.end / total) * 100,
        });
      } else {
        setTrim({ startPct: DEFAULT_START_PCT, endPct: DEFAULT_END_PCT });
      }
    }
  }

  function dragHandle(edge: "start" | "end") {
    return (event: ReactPointerEvent) => {
      event.stopPropagation();
      const track = trackRef.current;
      if (!track) return;

      function updateFrom(clientX: number) {
        const rect = track!.getBoundingClientRect();
        const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
        setTrim((t) =>
          edge === "start"
            ? { ...t, startPct: Math.min(pct, t.endPct - MIN_GAP_PCT) }
            : { ...t, endPct: Math.max(pct, t.startPct + MIN_GAP_PCT) },
        );
      }

      updateFrom(event.clientX);
      const onMove = (e: PointerEvent) => updateFrom(e.clientX);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
  }

  const selectedSec = endSec - startSec;
  const tooShort = selectedSec < MIN_TRIM_SEC;

  function confirm() {
    if (!song || tooShort) return;
    pause();
    // durationSec stays the FULL track length; only the trim range changes.
    onConfirm({ ...song, trim: { start: startSec, end: endSec } });
  }
  function close() {
    pause();
    onClose();
  }

  const playheadPct = playing || currentTime > 0 ? (currentTime / total) * 100 : null;

  if (!song) return null;

  return (
    <MvSheet
      open={open}
      onClose={close}
      label="Trim Audio"
      title="Trim Audio"
      variant="mv-trim-sheet"
      confirm={{ onConfirm: confirm, disabled: tooShort }}
    >
      <div className="mv-trim-sheet__intro">
        <p className="mv-trim-sheet__title">Trim Audio</p>
        <p className="mv-trim-sheet__desc">Only trim the audio to the parts you like the best.</p>
      </div>

      <div className="mv-trim-sheet__song">
        <button
          type="button"
          className="mv-trim-sheet__song-art"
          onClick={toggle}
          disabled={!song.url}
          aria-label={playing ? "Pause preview" : "Play trimmed section"}
        >
          {song.art && <img src={song.art} alt="" />}
          <span className="mv-trim-sheet__song-art-scrim" aria-hidden="true" />
          <DpIcon
            name={playing ? "ic_pause" : "ic_play"}
            className="mv-trim-sheet__song-art-icon"
          />
        </button>
        <div className="mv-trim-sheet__song-info">
          <p className="mv-trim-sheet__song-title">{song.title}</p>
          <p className="mv-trim-sheet__song-duration">{formatDuration(total)}</p>
        </div>
      </div>

      <div className="mv-trim-sheet__trimmer">
        <div className="mv-trim-sheet__time-row">
          <span>{formatDuration(startSec)}</span>
          <span>{formatDuration(endSec)}</span>
        </div>
        <div className="mv-trim-sheet__waveform" ref={trackRef}>
          <div className="mv-trim-sheet__bars" aria-hidden="true">
            {BARS.map((height, i) => (
              <span key={i} className="mv-trim-sheet__bar" style={{ height: `${height}px` }} />
            ))}
          </div>
          <div
            className="mv-trim-sheet__selection"
            style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
            aria-hidden="true"
          />
          {playheadPct != null && (
            // No DP class exists for this — see the header note.
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 4,
                bottom: 4,
                left: `${Math.min(endPct, Math.max(startPct, playheadPct))}%`,
                width: 2,
                borderRadius: 1,
                background: "var(--neutral-dark-100)",
                opacity: playing ? 1 : 0.5,
                pointerEvents: "none",
              }}
            />
          )}
          <button
            type="button"
            className="mv-trim-sheet__handle mv-trim-sheet__handle--start"
            style={{ left: `${startPct}%` }}
            onPointerDown={dragHandle("start")}
            role="slider"
            aria-label="Trim start"
            aria-valuenow={startSec}
          />
          <button
            type="button"
            className="mv-trim-sheet__handle mv-trim-sheet__handle--end"
            style={{ left: `${endPct}%` }}
            onPointerDown={dragHandle("end")}
            role="slider"
            aria-label="Trim end"
            aria-valuenow={endSec}
          />
        </div>
        <p
          className="mv-trim-sheet__desc"
          style={tooShort ? { color: "var(--color-action-danger)" } : undefined}
        >
          Selected: {formatDuration(selectedSec)}
          {tooShort && ` · minimum ${MIN_TRIM_SEC}s`}
        </p>
      </div>
    </MvSheet>
  );
}
