import { describe, it, expect } from "vitest";
import { defaultTrim, MIN_TRIM_SEC } from "./TrimAudioModal";

/** Mirrors the modal's own arithmetic: whole seconds, rounded per edge. */
function selectedSec(total: number) {
  const { startPct, endPct } = defaultTrim(total);
  return Math.round((endPct / 100) * total) - Math.round((startPct / 100) * total);
}

describe("defaultTrim (YMW260930P0004)", () => {
  it("keeps 15%→70% when that window already clears the 30s floor", () => {
    expect(defaultTrim(114)).toEqual({ startPct: 15, endPct: 70 });
    expect(defaultTrim(180)).toEqual({ startPct: 15, endPct: 70 });
  });

  it("never opens below the floor for any track the upload check accepts", () => {
    for (let total = MIN_TRIM_SEC; total <= 300; total++) {
      expect(selectedSec(total), `${total}s track`).toBeGreaterThanOrEqual(MIN_TRIM_SEC);
    }
  });

  it("widens a short track to exactly the floor, inside the track", () => {
    for (const total of [30, 31, 45, 50, 53]) {
      const { startPct, endPct } = defaultTrim(total);
      expect(selectedSec(total)).toBe(MIN_TRIM_SEC);
      expect(startPct).toBeGreaterThanOrEqual(0);
      expect(endPct).toBeLessThanOrEqual(100);
    }
  });

  it("uses the whole track when it is exactly 30s", () => {
    expect(defaultTrim(30)).toEqual({ startPct: 0, endPct: 100 });
  });
});
