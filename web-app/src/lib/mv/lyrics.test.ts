import { describe, it, expect } from "vitest";
import { activeLineIndex, buildTimedLines, parseLrc, timedLyrics } from "./lyrics";
import { lyricsForTitle, lyricsLrcForTitle } from "./community";

// YMW260903P0005 — clicking a lyric seeks to its timestamp, so the timestamps
// themselves are now load-bearing rather than decorative. These cover the two
// sources (`parseLrc` real / `buildTimedLines` derived) and the selector
// between them, because a silently-empty parse would degrade to the estimate
// and look like it worked.

describe("parseLrc", () => {
  it("reads [mm:ss.cc] lines into seconds", () => {
    const lines = parseLrc(
      "[00:14.94]Wires hum beneath the floor\n[01:03.18]There's no way turning back",
    );
    expect(lines).toEqual([
      { t: 14.94, line: "Wires hum beneath the floor" },
      { t: 63.18, line: "There's no way turning back" },
    ]);
  });

  it("scales the fraction by its own digit count, not by assuming centiseconds", () => {
    expect(parseLrc("[00:14.9]a")[0].t).toBeCloseTo(14.9, 5);
    expect(parseLrc("[00:14.94]a")[0].t).toBeCloseTo(14.94, 5);
    expect(parseLrc("[00:14.940]a")[0].t).toBeCloseTo(14.94, 5);
    expect(parseLrc("[00:14]a")[0].t).toBe(14);
  });

  it("drops untimed and empty lines instead of guessing a time for them", () => {
    // `[verse]` is a SECTION tag, not a timestamp — it must not become 0s.
    expect(parseLrc("[verse]\n[00:10.00]sung line\n[00:12.00]   \nplain text")).toEqual([
      { t: 10, line: "sung line" },
    ]);
  });

  it("sorts by time so activeLineIndex's forward scan holds", () => {
    expect(parseLrc("[00:20.00]b\n[00:10.00]a").map((l) => l.line)).toEqual(["a", "b"]);
  });

  it("is empty for undefined, so callers can test length instead of null-checking", () => {
    expect(parseLrc(undefined)).toEqual([]);
    expect(parseLrc("")).toEqual([]);
  });
});

describe("timedLyrics", () => {
  it("prefers real LRC over the even-spread estimate", () => {
    const lines = timedLyrics("one\ntwo", "[00:30.00]sung one\n[00:45.00]sung two", 120);
    expect(lines).toEqual([
      { t: 30, line: "sung one" },
      { t: 45, line: "sung two" },
    ]);
  });

  it("falls back to the estimate when there is no LRC", () => {
    expect(timedLyrics("one\ntwo", undefined, 120)).toEqual(buildTimedLines("one\ntwo", 120));
  });

  it("falls back when the LRC exists but parses to nothing", () => {
    expect(timedLyrics("one\ntwo", "[intro]\n[chorus]", 120)).toEqual(
      buildTimedLines("one\ntwo", 120),
    );
  });
});

describe("the vendored Neon Static sample", () => {
  // The whole point of the sample is that its timing is REAL. If the LRC ever
  // stops parsing, `timedLyrics` degrades to the estimate silently and the
  // demo still "works" — which is exactly the failure this asserts against.
  const lrc = lyricsLrcForTitle("Neon Static");

  it("carries a parseable LRC", () => {
    expect(lrc).toBeTruthy();
    expect(parseLrc(lrc).length).toBe(24);
  });

  it("starts after the intro and stays inside the track", () => {
    const lines = parseLrc(lrc);
    expect(lines[0].t).toBeCloseTo(14.94, 2);
    expect(lines[lines.length - 1].t).toBeCloseTo(114.46, 2);
  });

  it("also has prose lyrics, so the no-LRC screens still render", () => {
    expect(lyricsForTitle("Neon Static")).toContain("Lost in neon static");
  });

  it("is the only prototype song with real timing", () => {
    // Guards the claim `lyrics.ts` and the specs make. If a second timed song
    // is added deliberately, update this number in the same change.
    expect(lyricsForTitle("Pop Anthem")).toBeTruthy();
    expect(lyricsLrcForTitle("Pop Anthem")).toBeUndefined();
  });
});

describe("activeLineIndex", () => {
  it("returns the last line whose time has been reached", () => {
    const lines = parseLrc("[00:10.00]a\n[00:20.00]b\n[00:30.00]c");
    expect(activeLineIndex(lines, 0)).toBe(0);
    expect(activeLineIndex(lines, 19.9)).toBe(0);
    expect(activeLineIndex(lines, 20)).toBe(1);
    expect(activeLineIndex(lines, 999)).toBe(2);
  });
});
