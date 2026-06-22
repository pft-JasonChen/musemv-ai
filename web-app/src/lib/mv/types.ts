// Typed front-end contract for the AI MV creation flow.
// No backend: async work is modelled as an MvJob fed by a mock handler (see mock.ts).
// Engineers replace the mock MvApi impl with a real backend without touching the UI.

export type MvType = "singing" | "storytelling" | "hybrid";

export type SongSource = "library" | "import" | "sample" | "link";

export interface Song {
  id: string;
  source: SongSource;
  title: string;
  durationSec: number;
  art: string;
  url?: string;
  trim?: { start: number; end: number };
}

export interface CharacterPhoto {
  id: string;
  url: string;
  fromSample?: boolean;
}

export interface MvSettings {
  ratio: "9:16" | "16:9";
  resolution: "720P" | "1080P";
  title: { on: boolean; text: string };
  author: { on: boolean; text: string };
  showSubtitle: boolean;
  watermark: boolean;
}

export interface ComposeState {
  mvType: MvType;
  song: Song | null;
  description: string;
  photos: CharacterPhoto[];
  settings: MvSettings;
}

export type MvMode = "storyboard_first" | "direct";

export type MvJobStatus = "idle" | "queued" | "processing" | "done" | "failed";

export interface Scene {
  id: string;
  index: number;
  range: string; // e.g. "00:00–00:09"
  text: string;
}

export interface Storyboard {
  characterImage: string;
  visualStyle: string;
  scenes: Scene[];
}

export interface MvJob {
  id: string;
  mode: MvMode;
  status: MvJobStatus;
  progress: number; // 0–100
  step: string;
  compose: ComposeState;
  storyboard?: Storyboard;
  resultUrl?: string;
}

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
 * API contract stub. Engineers implement this against the real backend.
 * The mock implementation lives in mock.ts.
 */
export interface MvApi {
  createMvJob(input: { mode: MvMode; compose: ComposeState }): Promise<MvJob>;
  getMvJob(id: string): Promise<MvJob>;
}

// ── AI Song ──────────────────────────────────────────────────────────────
export type SongMode = "simple" | "custom";

export interface SongCompose {
  mode: SongMode;
  describe: string;
  instrumental: boolean;
  lyrics: string;
  genre: string;
  mood: string;
  vocal: string | null;
  title: string;
}

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

export interface SongResult {
  id: string;
  title: string;
  cover: string;
  genre: string;
  mood: string;
  durationSec: number;
  audioUrl?: string;
  instrumental: boolean;
  lyrics?: string;
}

export const COST_SONG = 10;

export function isSongReady(s: SongCompose): boolean {
  return s.mode === "custom" ? true : s.describe.trim().length > 0;
}
