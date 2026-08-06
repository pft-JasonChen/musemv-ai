import { describe, it, expect } from "vitest";
import {
  computeJustifiedRows,
  aspectRatioOf,
  GRID_GAP,
  MIN_ROW_HEIGHT,
  MAX_ROW_HEIGHT,
  type MvRatio,
} from "./justifiedRows";

const item = (ratio: MvRatio, id: string = ratio) => ({ id, ratio });

/** Total width a row actually occupies: sum of (height * aspect) plus gaps. */
function rowWidth(row: { items: { ratio: MvRatio }[]; coverHeight: number }): number {
  const covers = row.items.reduce((sum, i) => sum + row.coverHeight * aspectRatioOf(i.ratio), 0);
  return covers + GRID_GAP * (row.items.length - 1);
}

describe("computeJustifiedRows", () => {
  it("returns one unsplit row before the container has been measured", () => {
    const items = [item("3:4"), item("4:3"), item("3:4")];
    const rows = computeJustifiedRows(items, 0);
    expect(rows).toHaveLength(1);
    expect(rows[0].items).toHaveLength(3);
    expect(rows[0].coverHeight).toBe(MAX_ROW_HEIGHT);
  });

  it("fills every full row to exactly the container width", () => {
    const items = Array.from({ length: 12 }, (_, i) => item(i % 2 ? "4:3" : "3:4", `mv-${i}`));
    const rows = computeJustifiedRows(items, 1240);

    // Every row but the last is a deliberate fit decision and must justify.
    for (const row of rows.slice(0, -1)) {
      expect(rowWidth(row)).toBeCloseTo(1240, 6);
    }
  });

  it("mixes aspect ratios within a row while keeping one shared height", () => {
    const items = [item("3:4", "a"), item("4:3", "b"), item("3:4", "c"), item("4:3", "d")];
    const rows = computeJustifiedRows(items, 1240);
    const mixed = rows.find((r) => new Set(r.items.map((i) => i.ratio)).size > 1);
    expect(mixed).toBeDefined();
    // A single coverHeight per row is what makes the row line up; widths differ.
    const widths = mixed!.items.map((i) => mixed!.coverHeight * aspectRatioOf(i.ratio));
    expect(new Set(widths).size).toBeGreaterThan(1);
  });

  it("clamps the trailing row instead of stretching it", () => {
    // One leftover 3:4 item would otherwise be blown up to the full width.
    const items = Array.from({ length: 5 }, (_, i) => item("3:4", `mv-${i}`));
    const rows = computeJustifiedRows(items, 1240);
    const last = rows[rows.length - 1];
    expect(last.coverHeight).toBeLessThanOrEqual(MAX_ROW_HEIGHT);
    expect(last.coverHeight).toBeGreaterThanOrEqual(MIN_ROW_HEIGHT);
    expect(rowWidth(last)).toBeLessThan(1240);
  });

  it("never drops or reorders an item", () => {
    const items = Array.from({ length: 17 }, (_, i) => item(i % 3 ? "3:4" : "4:3", `mv-${i}`));
    const flat = computeJustifiedRows(items, 1100).flatMap((r) => r.items.map((i) => i.id));
    expect(flat).toEqual(items.map((i) => i.id));
  });

  it("always emits at least one item per row, even in a container narrower than one cover", () => {
    // Guards the `count === 0` escape hatch: without it this loops forever.
    const items = [item("4:3", "a"), item("4:3", "b")];
    const rows = computeJustifiedRows(items, 50);
    expect(rows.every((r) => r.items.length >= 1)).toBe(true);
    expect(rows.flatMap((r) => r.items)).toHaveLength(2);
  });

  it("handles an empty catalog", () => {
    expect(computeJustifiedRows([], 1240)).toEqual([]);
  });
});

describe("aspectRatioOf", () => {
  it("maps the two designer ratios", () => {
    expect(aspectRatioOf("4:3")).toBeCloseTo(4 / 3);
    expect(aspectRatioOf("3:4")).toBeCloseTo(3 / 4);
  });
});
