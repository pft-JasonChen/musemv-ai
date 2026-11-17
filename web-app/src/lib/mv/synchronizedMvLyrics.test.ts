import { describe, expect, it } from "vitest";
import {
  firstSubtitleAnchorSec,
  synchronizedMvLyrics,
  subtitleDataState,
} from "./synchronizedMvLyrics";
import type { Song } from "./types";
const song: Song = {
  id: "import-1",
  title: "Uploaded song",
  source: "import",
  durationSec: 60,
  art: "",
};
describe("MV synchronized lyric eligibility", () => {
  it("distinguishes missing lyrics, untimed lyrics and usable timing", () => {
    expect(subtitleDataState(null)).toBe("no-lyrics");
    expect(subtitleDataState({ ...song, lyrics: "  \n " })).toBe("no-lyrics");
    expect(subtitleDataState({ ...song, lyrics: "A line without timestamps" })).toBe("untimed");
    expect(subtitleDataState({ ...song, lyrics: "[00:01]A timed line" })).toBe("available");
    expect(
      subtitleDataState({
        ...song,
        source: "sample",
        id: "h-h-cinematic-night",
        title: "Cinematic Night",
      }),
    ).toBe("available");
    expect(
      subtitleDataState({ ...song, lyrics: "[00:10]Outside trim", trim: { start: 0, end: 5 } }),
    ).toBe("untimed");
  });
  it("never enables timing from ordinary lyrics or a matching title alone", () => {
    expect(synchronizedMvLyrics({ ...song, lyrics: "First line\nSecond line" })).toEqual([]);
    expect(synchronizedMvLyrics({ ...song, title: "Neon Static" })).toEqual([]);
  });
  it("preserves real timings and offsets them for a trimmed song", () => {
    expect(
      synchronizedMvLyrics({
        ...song,
        trim: { start: 12, end: 24 },
        lyrics: "[00:10]Still singing\n[00:20]Next line\n[00:30]Outside trim",
      }),
    ).toEqual([
      { t: 0, line: "Still singing" },
      { t: 8, line: "Next line" },
    ]);
  });
  it("enables the approved sample MVs without unlocking uploads or unrelated samples", () => {
    for (const [id, title] of [
      ["h-h-cinematic-night", "Cinematic Night"],
      ["h-h-neon-city-nights", "Neon City Nights"],
    ]) {
      const sample = { ...song, source: "sample" as const, id, title };
      expect(synchronizedMvLyrics(sample)).toHaveLength(4);
      expect(synchronizedMvLyrics({ ...sample, source: "import" })).toEqual([]);
      expect(synchronizedMvLyrics({ ...sample, title: "Other MV" })).toEqual([]);
    }
    expect(synchronizedMvLyrics({ ...song, source: "sample" })).toEqual([]);
  });
  it("recognizes the actual vendored timed fixture", () => {
    expect(
      synchronizedMvLyrics({ ...song, id: "h-neon-static", title: "Neon Static" }).length,
    ).toBeGreaterThan(0);
  });
  it("anchors Subtitle preview at the first real cue on the trimmed MV timeline", () => {
    const sample = {
      ...song,
      source: "sample" as const,
      id: "h-h-cinematic-night",
      title: "Cinematic Night",
    };
    expect(firstSubtitleAnchorSec(sample)).toBe(4);
    expect(
      firstSubtitleAnchorSec({
        ...song,
        lyrics: "[00:10]A\n[00:20]B",
        trim: { start: 15, end: 40 },
      }),
    ).toBe(0);
    expect(
      firstSubtitleAnchorSec({
        ...song,
        lyrics: "[00:10]A\n[00:20]B",
        trim: { start: 2, end: 40 },
      }),
    ).toBe(8);
    expect(firstSubtitleAnchorSec({ ...song, lyrics: "Untimed words" })).toBeNull();
    expect(firstSubtitleAnchorSec(null)).toBeNull();
  });
});
