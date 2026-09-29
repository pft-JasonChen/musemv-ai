import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import type { MvJob } from "@/lib/api/schemas";
import { mockStoryboard } from "@/lib/mv/mock";
import { DEFAULT_COMPOSE } from "@/lib/mv/types";
import { CreditsProvider } from "./CreditsProvider";
import { HistoryProvider, useHistory } from "./HistoryProvider";
import { MvFlowProvider, useMvFlow } from "./MvFlowProvider";

// Merge MV re-renders a CREATION, keyed by its History id (product owner,
// 2026-09-29). Before this, `startRender` keyed off `jobId.current`, which
// opening a History row never resets — so a Merge on a seed row either filed a
// brand-new History row or re-rendered into an unrelated earlier MV's record.

function wrapper({ children }: { children: ReactNode }) {
  return (
    <HistoryProvider>
      <CreditsProvider>
        <MvFlowProvider>{children}</MvFlowProvider>
      </CreditsProvider>
    </HistoryProvider>
  );
}

function setup() {
  return renderHook(() => ({ flow: useMvFlow(), hist: useHistory() }), { wrapper });
}

let seq = 0;
function job(id: string, status: MvJob["status"] = "processing"): MvJob {
  return {
    id,
    mode: "direct",
    status,
    progress: status === "done" ? 100 : 10,
    step: "Rendering",
    compose: DEFAULT_COMPOSE,
    thumb: "",
    resultUrl: status === "done" ? `${id}.mp4` : undefined,
  };
}

function mockApi() {
  const create = vi
    .spyOn(api, "createMvJob")
    .mockImplementation(async () => job(`job-${++seq}`));
  const render = vi.spyOn(api, "renderMvJob").mockImplementation(async (id) => job(id));
  vi.spyOn(api, "getMvJob").mockImplementation(async (id) => job(id, "done"));
  return { create, render };
}

afterEach(() => vi.restoreAllMocks());

describe("MvFlowProvider — Merge re-renders the creation in place", () => {
  it("a seed row keeps its id: new API job underneath, same History row on top", async () => {
    const { create, render } = mockApi();
    const { result } = setup();
    act(() => result.current.flow.setStoryboard(mockStoryboard()));

    act(() => result.current.flow.resetForRerender("merge", "h-cinematic-night"));
    act(() => result.current.flow.startRender());

    await waitFor(() => expect(result.current.hist.history[0]?.status).toBe("completed"), {
      timeout: 3000,
    });
    expect(create).toHaveBeenCalledTimes(1);
    const apiId = render.mock.calls[0]?.[0];
    expect(apiId).toMatch(/^job-/);
    // One row, under the SEED's id — `/history` overlays it onto the seed card.
    expect(result.current.hist.history.map((h) => h.id)).toEqual(["h-cinematic-night"]);

    // A second Merge of the same creation re-renders ITS job, no new one.
    act(() => result.current.flow.resetForRerender("merge", "h-cinematic-night"));
    act(() => result.current.flow.startRender());
    await waitFor(() => expect(render).toHaveBeenCalledTimes(2));
    expect(render.mock.calls[1]?.[0]).toBe(apiId);
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.current.hist.history).toHaveLength(1);
  });

  it("never re-renders into an unrelated MV generated earlier in the session", async () => {
    const { render } = mockApi();
    const { result } = setup();
    // An earlier, unrelated MV: a plain direct render leaves `jobId` set.
    act(() => result.current.flow.startRender());
    await waitFor(() => expect(result.current.hist.history[0]?.status).toBe("completed"), {
      timeout: 3000,
    });
    const earlier = result.current.hist.history[0]!.id;

    act(() => result.current.flow.setStoryboard(mockStoryboard()));
    act(() => result.current.flow.resetForRerender("merge", "h-neon-city-nights"));
    act(() => result.current.flow.startRender());

    await waitFor(() =>
      expect(result.current.hist.history.some((h) => h.id === "h-neon-city-nights")).toBe(true),
    );
    expect(render.mock.calls.map((c) => c[0])).not.toContain(earlier);
    expect(result.current.hist.history.find((h) => h.id === earlier)?.status).toBe("completed");
  });
});
