import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryProvider, useHistory } from "./HistoryProvider";

function setup() {
  return renderHook(() => useHistory(), { wrapper: HistoryProvider });
}

describe("HistoryProvider.remove (YMW260917P0008)", () => {
  it("records a removed id so the grid can filter it out", () => {
    const { result } = setup();
    expect(result.current.removed.has("h-cinematic-night")).toBe(false);

    act(() => result.current.remove("h-cinematic-night"));

    expect(result.current.removed.has("h-cinematic-night")).toBe(true);
  });

  it("removes a SEED row's id too, not just a live job's", () => {
    // The row `/mv/edit` deletes is usually a `HISTORY_SAMPLES` constant, which
    // cannot be spliced out of a module-level array. Removal has to work purely
    // by id, with no entry in `history` at all.
    const { result } = setup();
    expect(result.current.history).toHaveLength(0);

    act(() => result.current.remove("h-neon-city-nights"));

    expect(result.current.removed.has("h-neon-city-nights")).toBe(true);
  });

  it("keeps the same Set identity when the id is already removed", () => {
    // `removed` is a `useMemo` dependency of the History grid; returning a new
    // Set for a no-op delete would re-render every card for nothing.
    const { result } = setup();
    act(() => result.current.remove("h-golden-hour"));
    const first = result.current.removed;

    act(() => result.current.remove("h-golden-hour"));

    expect(result.current.removed).toBe(first);
  });

  it("accumulates removals rather than replacing the previous one", () => {
    const { result } = setup();

    act(() => result.current.remove("a"));
    act(() => result.current.remove("b"));

    expect([...result.current.removed].sort()).toEqual(["a", "b"]);
  });

  it("leaves the live history list untouched — removal is a filter, not a splice", () => {
    const { result } = setup();
    act(() => result.current.upsertGenerating({ id: "live-1", kind: "mv", title: "X", thumb: "" }));

    act(() => result.current.remove("live-1"));

    expect(result.current.history.map((h) => h.id)).toEqual(["live-1"]);
    expect(result.current.removed.has("live-1")).toBe(true);
  });
});
