// Domain types + rules for the AI MV / AI Song flows.
//
// Entity types are defined once as Zod schemas in @/lib/api/schemas and
// re-exported here so existing imports keep working. This module owns the
// pure domain constants and rules (defaults, costs, CTA-enable predicates).
// The backend contract lives in @/lib/api/contract (MuseApi).

export type {
  MvType,
  SongSource,
  Song,
  CharacterPhoto,
  MvSettings,
  ComposeState,
  MvMode,
  MvJobStatus,
  Scene,
  Storyboard,
  MvJob,
  MvCreateRequest,
  SongMode,
  SongCompose,
  SongResult,
  SongJob,
} from "@/lib/api/schemas";

import type { ComposeState, MvSettings, Song, SongCompose } from "@/lib/api/schemas";

export const DESCRIPTION_MAX = 2500;
export const COST_STORYBOARD = 20;
export const COST_RENDER = 200;

export const DEFAULT_SETTINGS: MvSettings = {
  ratio: "9:16",
  resolution: "720P",
  title: { on: true, text: "" },
  author: { on: true, text: "" },
  showSubtitle: true,
  watermark: false,
};

export const DEFAULT_COMPOSE: ComposeState = {
  mvType: "singing",
  song: null,
  description: "",
  photos: [],
  settings: DEFAULT_SETTINGS,
};

/** CTA-enable rule (new web behavior; not in source prototype). */
export function isComposeReady(s: ComposeState): boolean {
  return s.song != null && s.description.trim().length > 0;
}

/**
 * Length that will actually be used in the MV: the trim range when set,
 * the full track otherwise. `durationSec` itself is ALWAYS the full length.
 */
export function effectiveDurationSec(song: Pick<Song, "durationSec" | "trim">): number {
  return song.trim ? song.trim.end - song.trim.start : song.durationSec;
}

// ── AI Song ──────────────────────────────────────────────────────────────

export const DEFAULT_SONG_COMPOSE: SongCompose = {
  mode: "simple",
  describe: "",
  instrumental: false,
  lyrics: "",
  genre: "Pop",
  mood: "Uplifting",
  vocal: null,
  title: "",
};

export const COST_SONG = 10;

export function isSongReady(s: SongCompose): boolean {
  return s.mode === "custom" ? true : s.describe.trim().length > 0;
}
