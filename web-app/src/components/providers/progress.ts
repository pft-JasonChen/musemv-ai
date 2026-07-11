// UI-facing generation progress, derived from polled job snapshots.

export type GenStatus = "idle" | "processing" | "done";

export interface Gen {
  status: GenStatus;
  progress: number;
  step: string;
}

export const IDLE_GEN: Gen = { status: "idle", progress: 0, step: "" };

export function toGen(job: { status: string; progress: number; step: string }): Gen {
  return {
    status: job.status === "done" ? "done" : "processing",
    progress: job.progress,
    step: job.step,
  };
}
