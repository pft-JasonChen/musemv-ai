// Lyrics timing for the Display Lyrics panel.
//
// The prototype has real per-line timestamps for only one song; every other
// track carries plain-text lyrics with no timing. To reproduce the app's synced
// auto-scroll for ALL songs, we derive timestamps by spreading the non-empty
// lines evenly across the track duration. Good enough for a demo; swap for real
// timestamps if the backend ever provides them.

export interface TimedLine {
  /** Start time in seconds. */
  t: number;
  line: string;
}

export function buildTimedLines(lyrics: string | undefined, durationSec: number): TimedLine[] {
  if (!lyrics) return [];
  const lines = lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  // Fall back to a per-line unit so timing stays monotonic before audio metadata loads.
  const dur = durationSec > 0 ? durationSec : lines.length;
  return lines.map((line, i) => ({ t: (i / lines.length) * dur, line }));
}

/** Index of the last line whose start time has been reached. Returns 0 for an empty list. */
export function activeLineIndex(lines: TimedLine[], currentSec: number): number {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].t <= currentSec) idx = i;
    else break;
  }
  return idx;
}
