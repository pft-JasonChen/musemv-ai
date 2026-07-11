import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockMuseApi } from "./mock";
import { DEFAULT_COMPOSE, DEFAULT_SONG_COMPOSE } from "@/lib/mv/types";

describe("MockMuseApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("storyboard-first job progresses over time and completes with a storyboard", async () => {
    const api = new MockMuseApi();
    const job = await api.createMvJob({ mode: "storyboard_first", compose: DEFAULT_COMPOSE });
    expect(job.status).toBe("processing");
    expect(job.progress).toBe(0);
    expect(job.storyboard).toBeUndefined();

    vi.advanceTimersByTime(3500); // halfway through the 7s storyboard timeline
    const mid = await api.getMvJob(job.id);
    expect(mid.status).toBe("processing");
    expect(mid.progress).toBe(50);
    expect(mid.step).not.toBe("");

    vi.advanceTimersByTime(4000); // past the end
    const done = await api.getMvJob(job.id);
    expect(done.status).toBe("done");
    expect(done.progress).toBe(100);
    expect(done.storyboard?.scenes.length).toBeGreaterThan(0);
    expect(done.resultUrl).toBeUndefined(); // storyboard phase does not render
  });

  it("renderMvJob resets progress and completes with a result URL", async () => {
    const api = new MockMuseApi();
    const job = await api.createMvJob({ mode: "storyboard_first", compose: DEFAULT_COMPOSE });
    vi.advanceTimersByTime(8000);
    const withSb = await api.getMvJob(job.id);

    const rendering = await api.renderMvJob(job.id, withSb.storyboard!);
    expect(rendering.status).toBe("processing");
    expect(rendering.progress).toBe(0);
    expect(rendering.storyboard).toEqual(withSb.storyboard);

    vi.advanceTimersByTime(12000); // past the 11s render timeline
    const done = await api.getMvJob(job.id);
    expect(done.status).toBe("done");
    expect(done.resultUrl).toBeTruthy();
  });

  it("direct mode renders immediately without a storyboard phase", async () => {
    const api = new MockMuseApi();
    const job = await api.createMvJob({ mode: "direct", compose: DEFAULT_COMPOSE });
    vi.advanceTimersByTime(12000);
    const done = await api.getMvJob(job.id);
    expect(done.status).toBe("done");
    expect(done.resultUrl).toBeTruthy();
    expect(done.storyboard).toBeUndefined();
  });

  it("song job exposes title/cover while generating and the result only when done", async () => {
    const api = new MockMuseApi();
    const compose = {
      ...DEFAULT_SONG_COMPOSE,
      describe: "An upbeat summer anthem",
      title: "My Song",
    };
    const job = await api.createSongJob(compose);
    expect(job.title).toBe("My Song");
    expect(job.cover).toBeTruthy();
    expect(job.result).toBeUndefined();

    vi.advanceTimersByTime(9000); // past the 8s song timeline
    const done = await api.getSongJob(job.id);
    expect(done.status).toBe("done");
    expect(done.result?.title).toBe("My Song");
    expect(done.result?.audioUrl).toBeTruthy();
  });

  it("rejects malformed input at the contract boundary", async () => {
    const api = new MockMuseApi();
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      api.createMvJob({ mode: "nope", compose: DEFAULT_COMPOSE } as any),
    ).rejects.toThrow();
    await expect(api.getMvJob("missing-id")).rejects.toThrow(/not found/);
  });
});
