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

/**
 * ── CREDIT COSTS — read this before changing a number (TBD-CC-05) ───────────
 *
 * `specs/areas/11-credit-consumption.md` is authoritative; the cloud config
 * (`[YCM] Credit Consume Cloud Config .json` at the repo root) is the source of
 * its numbers. **Four of the six costs below are NOT fixed values** — they are
 * `base + rate × seconds`, so no constant can express them correctly.
 *
 * Product decision 2026-08-12: fix the ones that ARE fixed, and leave the
 * duration-dependent ones as placeholders with their real formula recorded
 * here, because TBD-CC-05's own resolution is **"由後端回傳而非 hardcode"** —
 * the real value arrives with the backend, and inventing a client-side
 * calculator now would build the wrong thing.
 *
 * | constant                | authoritative rule (spec 11)                    | fixed? |
 * | ----------------------- | ----------------------------------------------- | ------ |
 * | COST_STORYBOARD         | §3.3 tier by song length: 12 / 15 / 18          | NO     |
 * | COST_RENDER             | §3.2 `45 + N×sec` (N = mvType × resolution)     | NO     |
 * | COST_REGEN              | §3.5 `8 + N×sec` (sing 7 · story 2/4)           | NO     |
 * | COST_SONG_*             | §3.1 vocal 6 / instrumental 12                  | YES ✔ |
 * | COST_COVER              | `edit_poster` — 4 per result                    | YES ✔ |
 *
 * ⚠️ DP's `ModeModal` comp hardcodes "20 Credits" / "200 Credits", which happen
 * to match the two placeholders below. When the real values land they will
 * diverge from the comp — `DESIGNER-TODO` A22.
 */

/** 🔒 PLACEHOLDER. Real rule: spec 11 §3.3 — 12 / 15 / 18 by song length. */
export const COST_STORYBOARD = 20;
/** 🔒 PLACEHOLDER. Real rule: spec 11 §3.2 — `45 + N×sec`; a 30s singing/1080p MV is 225. */
export const COST_RENDER = 200;

// MV Edit costs. Moved here from `components/mv/MvEditor.tsx` on 2026-08-12 so
// that all six live on the C8 contract surface (two of them previously did not).
/** 🔒 PLACEHOLDER. Real rule: spec 11 §3.5 — `8 + N×sec`; a 5s shot is 28. */
export const COST_REGEN = 20;
/** ✔ REAL VALUE (2026-08-12). `edit_poster`: 4 per result. Was a 10 placeholder. */
export const COST_COVER = 4;

export const DEFAULT_SETTINGS: MvSettings = {
  ratio: "9:16",
  resolution: "Standard",
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
  bpm: 120,
  key: null,
};

// SONG-01: musical keys offered by the custom-mode Key selector ("Auto" = null).
export const SONG_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const BPM_MIN = 60;
export const BPM_MAX = 200;

/**
 * ✔ REAL VALUES (2026-08-12). Spec 11 §3.1: the four `ai_song_*` actions bill a
 * flat per-result cost that depends ONLY on the Instrumental toggle, not on
 * mode (Simple/Custom) and not on length.
 */
export const COST_SONG_VOCAL = 6;
export const COST_SONG_INSTRUMENTAL = 12;

/** Cost of one AI Song generation. Was a single `COST_SONG = 10` placeholder. */
export function songCost(instrumental: boolean): number {
  return instrumental ? COST_SONG_INSTRUMENTAL : COST_SONG_VOCAL;
}

/**
 * SONG-03: Recreate keeps the prior take, but it **is just another generation** —
 * product decision 2026-08-12, closing the gap where the old
 * `COST_SONG_RECREATE = 50` had no counterpart anywhere in spec 11 or the cloud
 * config. It bills exactly what a fresh generation bills.
 */
export const songRecreateCost = songCost;

export function isSongReady(s: SongCompose): boolean {
  return s.mode === "custom" ? true : s.describe.trim().length > 0;
}
