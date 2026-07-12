// Generic job-polling loop used by the flow providers. Framework-free so it
// can be unit-tested and reused if a screen ever needs to poll directly.

interface JobLike {
  status: string;
  progress: number;
  step: string;
}

export interface PollOptions<T extends JobLike> {
  intervalMs?: number;
  /** Called on every poll tick, including the final one. */
  onUpdate: (job: T) => void;
  /** Called once, when status is "done". */
  onDone: (job: T) => void;
  /** Called once, when status is "failed" or a poll throws. */
  onError?: (error: unknown) => void;
}

const DEFAULT_INTERVAL_MS = 120;

/**
 * Poll `fetchJob` until the job reports "done" or "failed".
 * Returns a cancel function; overlapping ticks are skipped while a fetch is in flight.
 */
export function pollJob<T extends JobLike>(
  fetchJob: () => Promise<T>,
  opts: PollOptions<T>,
): () => void {
  const { intervalMs = DEFAULT_INTERVAL_MS, onUpdate, onDone, onError } = opts;
  let cancelled = false;
  let inFlight = false;

  const timer = setInterval(async () => {
    if (cancelled || inFlight) return;
    inFlight = true;
    try {
      const job = await fetchJob();
      if (cancelled) return;
      onUpdate(job);
      if (job.status === "done") {
        stop();
        onDone(job);
      } else if (job.status === "failed") {
        stop();
        onError?.(new Error("job failed"));
      }
    } catch (error) {
      if (!cancelled) {
        stop();
        onError?.(error);
      }
    } finally {
      inFlight = false;
    }
  }, intervalMs);

  function stop() {
    cancelled = true;
    clearInterval(timer);
  }

  return stop;
}
