import type { Song } from "./types";
import { lyricsLrcForTitle } from "./community";
import { parseLrc, type TimedLine } from "./lyrics";

/** Explicit review fixtures approved by the product owner (2026-10-29).
 * These cues enable Subtitle review on sample MVs; they are not measured engine
 * alignment. Match source, id and title so user uploads never inherit demo cues.
 * History currently prefixes its creation id with "h-" when seeding the song.
 */
const SAMPLE_MV_CUES: Record<string, { title: string; lrc: string }> = {
  "h-h-cinematic-night": {
    title: "Cinematic Night",
    lrc: "[00:00]Under the city lights\n[00:02]We follow stars into the night\n[00:04]Every moment shines so bright\n[00:06]Keep this dream alive",
  },
  "h-h-neon-city-nights": {
    title: "Neon City Nights",
    lrc: "[00:00]Neon colors fill the sky\n[00:02]Hear the rhythm passing by\n[00:04]Through the streets we come alive\n[00:06]Let the music be our guide",
  },
};

/** Inline timing, the vendored timed song, or an explicit sample review fixture
 * qualifies. Untimed lyrics and arbitrary matching titles never qualify.
 */
export function synchronizedMvLyrics(song: Song | null): TimedLine[] {
  if (!song) return [];
  const fixture = song.source === "sample" ? SAMPLE_MV_CUES[song.id] : undefined;
  const sampleLines = fixture?.title === song.title ? parseLrc(fixture.lrc) : [];
  const inline = parseLrc(song.lyrics);
  const lines = inline.length
    ? inline
    : song.id === "h-neon-static" && song.title === "Neon Static"
      ? parseLrc(lyricsLrcForTitle(song.title))
      : sampleLines;
  const start = song.trim?.start ?? 0;
  const end = song.trim?.end ?? (song.durationSec > 0 ? song.durationSec : Infinity);
  return lines
    .filter((line, i) => line.t < end && (lines[i + 1]?.t ?? Infinity) > start)
    .map((line) => ({ ...line, t: Math.max(0, line.t - start) }));
}
