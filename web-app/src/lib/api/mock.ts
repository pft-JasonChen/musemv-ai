// In-memory mock implementation of the MuseApi contract.
//
// This is the only place in the codebase that fakes a backend: jobs live in a
// Map and progress is derived from wall-clock time on every poll, exactly like
// polling a real job endpoint. Durations/steps are prototype-faithful (the
// demo pacing the CEO sees). Delete this file when the real backend lands and
// point `@/lib/api` (index.ts) at the real implementation instead.

import type { MuseApi } from "./contract";
import {
  MvCreateRequestSchema,
  MvJobSchema,
  SongComposeSchema,
  SongJobSchema,
  StoryboardSchema,
  type MvCreateRequest,
  type MvJob,
  type SongCompose,
  type SongJob,
  type SongResult,
  type Storyboard,
} from "./schemas";
import { mockSongResult, mockStoryboard, SAMPLE_RESULT_VIDEO } from "@/lib/mv/mock";

const STORYBOARD_MS = 7000;
const RENDER_MS = 11000;
const SONG_MS = 8000;

/**
 * Demo failure trigger: a description/describe containing this token makes the
 * job fail at ~60% so the error/retry UX can be exercised without a backend.
 */
export const FAIL_TRIGGER = "[fail]";
const FAIL_AT_PROGRESS = 60;
const STORYBOARD_STEPS = [
  "Analyzing audio...",
  "Designing scenes...",
  "Composing storyboard...",
  "Finalizing...",
];
const RENDER_STEPS = [
  "Preparing...",
  "Rendering frames...",
  "Syncing to music...",
  "Encoding video...",
];
const SONG_STEPS = [
  "Setting the tempo...",
  "Writing the melody...",
  "Adding vocals...",
  "Mixing the track...",
];

/** Wall-clock timeline a fake job advances along. */
interface Timeline {
  startedAt: number;
  durationMs: number;
  steps: string[];
}

function progressOf(t: Timeline): { progress: number; step: string; done: boolean } {
  const elapsed = Date.now() - t.startedAt;
  const progress = Math.min(100, Math.round((elapsed / t.durationMs) * 100));
  const step = t.steps[Math.min(t.steps.length - 1, Math.floor((progress / 100) * t.steps.length))];
  return { progress, step, done: progress >= 100 };
}

interface MvJobRecord {
  id: string;
  mode: MvJob["mode"];
  compose: MvJob["compose"];
  /** What the current timeline is producing. */
  phase: "storyboard" | "render";
  timeline: Timeline;
  /** Preview image assigned at creation (storyboard image once one exists). */
  thumb: string;
  /** Progress at which this job fails (demo trigger), if any. */
  failAt?: number;
  /** Attached once their phase completes. */
  storyboard?: Storyboard;
  resultUrl?: string;
}

interface SongJobRecord {
  id: string;
  compose: SongCompose;
  timeline: Timeline;
  /** Progress at which this job fails (demo trigger), if any. */
  failAt?: number;
  /** Generated up-front (deterministic for the job), revealed when done. */
  result: SongResult;
}

export class MockMuseApi implements MuseApi {
  private mvJobs = new Map<string, MvJobRecord>();
  private songJobs = new Map<string, SongJobRecord>();

  async createMvJob(input: MvCreateRequest): Promise<MvJob> {
    const { mode, compose } = MvCreateRequestSchema.parse(input);
    const phase = mode === "direct" ? "render" : "storyboard";
    const record: MvJobRecord = {
      id: crypto.randomUUID(),
      mode,
      compose,
      phase,
      timeline: {
        startedAt: Date.now(),
        durationMs: phase === "render" ? RENDER_MS : STORYBOARD_MS,
        steps: phase === "render" ? RENDER_STEPS : STORYBOARD_STEPS,
      },
      thumb: mockStoryboard().characterImage,
      failAt: compose.description.includes(FAIL_TRIGGER) ? FAIL_AT_PROGRESS : undefined,
    };
    this.mvJobs.set(record.id, record);
    return this.snapshotMv(record);
  }

  async getMvJob(id: string): Promise<MvJob> {
    return this.snapshotMv(this.mustGet(this.mvJobs, id, "MV job"));
  }

  async renderMvJob(id: string, storyboard: Storyboard): Promise<MvJob> {
    const record = this.mustGet(this.mvJobs, id, "MV job");
    record.storyboard = StoryboardSchema.parse(storyboard);
    record.phase = "render";
    record.resultUrl = undefined;
    record.timeline = { startedAt: Date.now(), durationMs: RENDER_MS, steps: RENDER_STEPS };
    return this.snapshotMv(record);
  }

  async createSongJob(input: SongCompose): Promise<SongJob> {
    const compose = SongComposeSchema.parse(input);
    const record: SongJobRecord = {
      id: crypto.randomUUID(),
      compose,
      timeline: { startedAt: Date.now(), durationMs: SONG_MS, steps: SONG_STEPS },
      failAt: compose.describe.includes(FAIL_TRIGGER) ? FAIL_AT_PROGRESS : undefined,
      result: mockSongResult(compose),
    };
    this.songJobs.set(record.id, record);
    return this.snapshotSong(record);
  }

  async getSongJob(id: string): Promise<SongJob> {
    return this.snapshotSong(this.mustGet(this.songJobs, id, "Song job"));
  }

  private mustGet<T>(map: Map<string, T>, id: string, label: string): T {
    const record = map.get(id);
    if (!record) throw new Error(`${label} not found: ${id}`);
    return record;
  }

  private snapshotMv(record: MvJobRecord): MvJob {
    const { progress, step, done } = progressOf(record.timeline);
    const failed = record.failAt != null && progress >= record.failAt;
    if (done && !failed) {
      // Complete the current phase: attach what it was producing.
      if (record.phase === "storyboard" && !record.storyboard) record.storyboard = mockStoryboard();
      if (record.phase === "render" && !record.resultUrl) record.resultUrl = SAMPLE_RESULT_VIDEO;
    }
    return MvJobSchema.parse({
      id: record.id,
      mode: record.mode,
      status: failed ? "failed" : done ? "done" : "processing",
      progress: failed ? record.failAt : progress,
      step: failed ? "Generation failed" : step,
      compose: record.compose,
      thumb: record.storyboard?.characterImage ?? record.thumb,
      storyboard: record.storyboard,
      resultUrl: record.resultUrl,
    });
  }

  private snapshotSong(record: SongJobRecord): SongJob {
    const { progress, step, done } = progressOf(record.timeline);
    const failed = record.failAt != null && progress >= record.failAt;
    return SongJobSchema.parse({
      id: record.id,
      status: failed ? "failed" : done ? "done" : "processing",
      progress: failed ? record.failAt : progress,
      step: failed ? "Generation failed" : step,
      compose: record.compose,
      title: record.result.title,
      cover: record.result.cover,
      result: done && !failed ? record.result : undefined,
    });
  }
}
