import { describe, expect, it } from "vitest";
import { DEFAULT_COMPOSE, isComposeReady, type Song } from "./types";
import { formatDuration } from "./mock";

const song: Song = { id: "1", source: "sample", title: "x", durationSec: 60, art: "" };

describe("isComposeReady", () => {
  it("is false with no song or description", () => {
    expect(isComposeReady(DEFAULT_COMPOSE)).toBe(false);
  });
  it("is false with song but blank description", () => {
    expect(isComposeReady({ ...DEFAULT_COMPOSE, song })).toBe(false);
  });
  it("is true with song + non-empty description", () => {
    expect(isComposeReady({ ...DEFAULT_COMPOSE, song, description: "a story" })).toBe(true);
  });
});

describe("formatDuration", () => {
  it("formats mm:ss", () => expect(formatDuration(125)).toBe("02:05"));
  it("handles zero as placeholder", () => expect(formatDuration(0)).toBe("--:--"));
});
