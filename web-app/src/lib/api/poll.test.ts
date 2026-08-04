// pollJob — the loop behind every generation screen.
//
// WHY THIS FILE EXISTS
//   poll.ts's own header says "Framework-free so it can be unit-tested and reused" — and
//   it had no test. It was covered only transitively, through mock.test.ts and the e2e
//   flows, which means a regression in its cancel/overlap semantics would surface as a
//   confusing UI hang rather than a failing unit test. Its contract is small and exact,
//   so it is worth pinning directly:
//     · onUpdate fires on every tick, including the final one
//     · onDone fires once, only on "done", and the loop stops
//     · onError fires once, on "failed" OR a throw, and the loop stops
//     · overlapping ticks are skipped while a fetch is in flight
//     · the returned cancel() stops everything, and late results are dropped
//
//   The refund rule (GL-01) hangs off onError, so "onError fires exactly once" is a
//   billing-correctness property, not a cosmetic one.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pollJob } from "./poll";

type Job = { status: string; progress: number; step: string };
const job = (status: string, progress = 0): Job => ({ status, progress, step: "s" });

describe("pollJob", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports every tick and completes once on done", async () => {
    const seq = [job("processing", 25), job("processing", 75), job("done", 100)];
    let i = 0;
    const fetchJob = vi.fn(async () => seq[Math.min(i++, seq.length - 1)]);
    const onUpdate = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    pollJob(fetchJob, { intervalMs: 10, onUpdate, onDone, onError });

    // Each tick awaits a promise, so advance and flush the microtask queue per tick.
    for (let t = 0; t < 3; t++) {
      await vi.advanceTimersByTimeAsync(10);
    }

    expect(onUpdate).toHaveBeenCalledTimes(3);
    expect(onUpdate.mock.calls.map(([j]) => (j as Job).progress)).toEqual([25, 75, 100]);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0][0]).toMatchObject({ status: "done", progress: 100 });
    expect(onError).not.toHaveBeenCalled();

    // Stopped: further time passes without another fetch.
    const callsAtDone = fetchJob.mock.calls.length;
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchJob).toHaveBeenCalledTimes(callsAtDone);
  });

  it("calls onError exactly once when the job fails, and stops", async () => {
    // GL-01 refunds from onError — a second call would refund twice.
    const seq = [job("processing", 50), job("failed", 60)];
    let i = 0;
    const fetchJob = vi.fn(async () => seq[Math.min(i++, seq.length - 1)]);
    const onDone = vi.fn();
    const onError = vi.fn();

    pollJob(fetchJob, { intervalMs: 10, onUpdate: () => {}, onDone, onError });
    await vi.advanceTimersByTimeAsync(30);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
    const calls = fetchJob.mock.calls.length;
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchJob).toHaveBeenCalledTimes(calls);
  });

  it("calls onError once when the fetch throws, and stops", async () => {
    const fetchJob = vi.fn(async () => {
      throw new Error("network");
    });
    const onError = vi.fn();
    pollJob(fetchJob, { intervalMs: 10, onUpdate: () => {}, onDone: () => {}, onError });

    await vi.advanceTimersByTimeAsync(30);

    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as Error).message).toBe("network");
    const calls = fetchJob.mock.calls.length;
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchJob).toHaveBeenCalledTimes(calls);
  });

  it("skips overlapping ticks while a fetch is still in flight", async () => {
    // A slow backend must not queue up N concurrent polls.
    //
    // Held in an object, not a `let`: TypeScript's control-flow analysis cannot see the
    // assignment inside the Promise executor, so a plain `let release: (() => void) | null`
    // narrows to `never` at the call site and `tsc --noEmit` rejects it. (vitest passed —
    // it does not typecheck. The Stop gate's tsc leg caught it.)
    const held: { resolve?: (j: Job) => void } = {};
    const fetchJob = vi.fn(
      () =>
        new Promise<Job>((resolve) => {
          held.resolve = resolve;
        }),
    );
    pollJob(fetchJob, { intervalMs: 10, onUpdate: () => {}, onDone: () => {}, onError: () => {} });

    await vi.advanceTimersByTimeAsync(10);   // tick 1 starts, never resolves yet
    await vi.advanceTimersByTimeAsync(50);   // 5 more intervals elapse
    expect(fetchJob).toHaveBeenCalledTimes(1);

    held.resolve?.(job("processing", 10));
    await vi.advanceTimersByTimeAsync(10);   // now the next tick may run
    expect(fetchJob).toHaveBeenCalledTimes(2);
  });

  it("cancel() stops the loop and suppresses callbacks from a late result", async () => {
    const held: { resolve?: (j: Job) => void } = {};   // see the note above re: `never`
    const fetchJob = vi.fn(
      () =>
        new Promise<Job>((resolve) => {
          held.resolve = resolve;
        }),
    );
    const onUpdate = vi.fn();
    const onDone = vi.fn();
    const cancel = pollJob(fetchJob, {
      intervalMs: 10,
      onUpdate,
      onDone,
      onError: () => {},
    });

    await vi.advanceTimersByTimeAsync(10);   // a fetch is in flight
    cancel();
    held.resolve?.(job("done", 100));        // resolves AFTER cancellation
    await vi.advanceTimersByTimeAsync(50);

    // MvFlowProvider cancels on unmount and before starting a new job; a late "done"
    // leaking through would set a stale result on the next flow.
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});
