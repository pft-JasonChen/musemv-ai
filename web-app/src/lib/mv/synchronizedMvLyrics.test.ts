import { describe, expect, it } from "vitest";
import { synchronizedMvLyrics } from "./synchronizedMvLyrics";
import type { Song } from "./types";
const song: Song = {
  id: "import-1",
  title: "Uploaded song",
  source: "import",
  durationSec: 60,
  art: "",
};
describe("MV synchronized lyric eligibility", () => {
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
});
