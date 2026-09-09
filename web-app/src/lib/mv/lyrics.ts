// Lyrics timing for the Display Lyrics panel and the Lyrics sheet.
//
// TWO SOURCES, AND THE DIFFERENCE MATTERS
//
//   1. REAL per-line timing, as the AI Song backend returns it — an LRC block
//      (`[mm:ss.cc]line`) on `SongResult.lyricsLrc`. `parseLrc` reads it.
//      Only songs that actually carry one get this; in the prototype that is
//      the vendored sample (`Neon Static`, see `community.ts`).
//   2. DERIVED timing — non-empty lines spread evenly across the track's
//      duration. Every other song. It is an estimate, and it is what has
//      always driven the "current line" highlight on those songs.
//
// `timedLyrics` picks between them, so a caller never has to. Click-to-seek
// (YMW260903P0005) is offered on BOTH: the highlight already asserts a
// line↔time correspondence on an estimated song, so seeking to the same
// estimate is consistent with what the screen is already showing. What the
// real timestamps change is accuracy, not whether the affordance exists.

export interface TimedLine {
  /** Start time in seconds. */
  t: number;
  line: string;
}

/** `[mm:ss.cc]` or `[mm:ss]` at the start of a line, plus the line's text. */
const LRC_LINE = /^\s*\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/;

/**
 * Parse an LRC-style timestamped lyric block into `TimedLine[]`.
 *
 * The backend's own field (`timestamps.lyrics_lrc_timestamps`) is the source
 * shape, so this is a wire parser, not a convenience: lines without a
 * timestamp are DROPPED rather than guessed at, and the result is sorted by
 * time so `activeLineIndex`'s single forward scan stays correct even if the
 * payload is not ordered.
 *
 * Note the timed line list is NOT a subset of the plain `lyrics` field —
 * `Neon Static` splits one written line across two sung ones, adds an
 * ad-lib, and drops the `[verse]`/`[chorus]` section tags. Where a real LRC
 * exists it is therefore what gets DISPLAYED, not just what gets timed;
 * aligning it against the prose lyrics would be inventing a mapping.
 */
export function parseLrc(lrc: string | undefined): TimedLine[] {
  if (!lrc) return [];
  const out: TimedLine[] = [];
  for (const raw of lrc.split("\n")) {
    const m = LRC_LINE.exec(raw);
    if (!m) continue;
    const [, mm, ss, frac, text] = m;
    if (!text.trim()) continue;
    // A 2-digit fraction is centiseconds (LRC's own convention), 3 is
    // milliseconds. Normalising by length rather than assuming one of them
    // keeps "[00:14.9]" from reading as 14.09s.
    const fractional = frac ? Number(frac) / 10 ** frac.length : 0;
    out.push({ t: Number(mm) * 60 + Number(ss) + fractional, line: text.trim() });
  }
  return out.sort((a, b) => a.t - b.t);
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

/**
 * The lines to display, timed — real LRC when the song carries one, the
 * even-spread estimate otherwise. Empty when the song has no lyrics at all
 * (the `DESIGNER-TODO` A23 empty state).
 */
export function timedLyrics(
  lyrics: string | undefined,
  lyricsLrc: string | undefined,
  durationSec: number,
): TimedLine[] {
  const timed = parseLrc(lyricsLrc);
  return timed.length > 0 ? timed : buildTimedLines(lyrics, durationSec);
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
