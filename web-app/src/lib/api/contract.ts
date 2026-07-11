// Typed front-end ↔ backend contract for the Muse prototype.
//
// The UI never talks to a backend implementation directly — it imports `api`
// from `@/lib/api` (see index.ts), which satisfies this interface. Today the
// only implementation is the in-memory mock (mock.ts). To go live, implement
// this interface against the real backend (fetch/SDK) and swap the export in
// index.ts — no UI or provider code changes.
//
// Async generation is modelled as jobs: `create*Job` starts work and returns
// an initial snapshot; the client polls `get*Job` until `status === "done"`
// (or "failed") and reads the attached result. A real backend can keep this
// exact shape over REST, or an implementation may bridge WebSocket/SSE pushes
// into the same polling contract.

import type { MvCreateRequest, MvJob, SongCompose, SongJob, Storyboard } from "./schemas";

export interface MuseApi {
  /**
   * Start an MV job. `mode: "storyboard_first"` produces a storyboard for the
   * user to review/edit (job completes with `job.storyboard` set);
   * `mode: "direct"` renders the video immediately (completes with `job.resultUrl`).
   */
  createMvJob(input: MvCreateRequest): Promise<MvJob>;

  /** Poll an MV job. Progress/step advance until `status` is "done" or "failed". */
  getMvJob(id: string): Promise<MvJob>;

  /**
   * Render the final video for a storyboard-first job, using the (possibly
   * user-edited) storyboard. Resets progress; completes with `job.resultUrl`.
   */
  renderMvJob(id: string, storyboard: Storyboard): Promise<MvJob>;

  /** Start an AI Song job. Completes with `job.result` set. */
  createSongJob(input: SongCompose): Promise<SongJob>;

  /** Poll an AI Song job. */
  getSongJob(id: string): Promise<SongJob>;
}
