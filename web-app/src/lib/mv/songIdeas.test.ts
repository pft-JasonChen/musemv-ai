import { describe, it, expect } from "vitest";
import { SONG_IDEA_PROMPTS, LYRIC_PRESETS, pickIdea } from "./songIdeas";
import { DESCRIPTION_MAX } from "./types";

describe("song compose fills", () => {
  it("carries the product owner's two lists in full (12 ideas / 10 lyric sheets)", () => {
    // Counts, not contents: if a later drop of the CSVs changes them, this line
    // is the reminder to update the spec's numbers too.
    expect(SONG_IDEA_PROMPTS).toHaveLength(12);
    expect(LYRIC_PRESETS).toHaveLength(10);
  });

  it("has no duplicate or empty entry in either pool", () => {
    for (const pool of [SONG_IDEA_PROMPTS, LYRIC_PRESETS]) {
      expect(pool.every((s) => s.trim().length > 0)).toBe(true);
      expect(new Set(pool).size).toBe(pool.length);
    }
  });

  it("keeps every fill inside the 2500-char field cap", () => {
    // A fill is set programmatically, so `maxLength` would NOT clip it — an
    // over-long preset would silently ship a value the user cannot retype.
    for (const s of [...SONG_IDEA_PROMPTS, ...LYRIC_PRESETS]) {
      expect(s.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
  });

  it("keeps the lyric sheets in section-marker format", () => {
    // The engine reads `[verse]` / `[chorus]`; the Lyrics button exists to show
    // that format, so a preset without it defeats the control.
    for (const s of LYRIC_PRESETS) {
      expect(s).toContain("[verse]");
      expect(s).toContain("[chorus]");
    }
  });

  it("never returns the string already in the box", () => {
    // 200 draws because the failure is probabilistic: with a 10-item pool a
    // plain random pick repeats about one click in ten.
    for (const current of [SONG_IDEA_PROMPTS[0], LYRIC_PRESETS[3]]) {
      const pool = SONG_IDEA_PROMPTS.includes(current) ? SONG_IDEA_PROMPTS : LYRIC_PRESETS;
      for (let i = 0; i < 200; i++) {
        expect(pickIdea(pool, current)).not.toBe(current);
      }
    }
  });

  it("ignores surrounding whitespace when deciding what the box already holds", () => {
    // Looped for the same reason as above: a single draw passes 11 times in 12
    // even with the comparison removed entirely.
    for (let i = 0; i < 200; i++) {
      expect(pickIdea(SONG_IDEA_PROMPTS, `  ${SONG_IDEA_PROMPTS[5]}\n`)).not.toBe(
        SONG_IDEA_PROMPTS[5],
      );
    }
  });

  it("falls back to the single item rather than returning undefined", () => {
    // Degenerate pools: one item that IS the current value, and an empty box.
    expect(pickIdea(["only"], "only")).toBe("only");
    expect(SONG_IDEA_PROMPTS).toContain(pickIdea(SONG_IDEA_PROMPTS, ""));
  });
});
