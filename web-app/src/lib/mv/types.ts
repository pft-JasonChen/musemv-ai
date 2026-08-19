// Domain types + rules for the AI MV / AI Song flows.
//
// Entity types are defined once as Zod schemas in @/lib/api/schemas and
// re-exported here so existing imports keep working. This module owns the
// pure domain constants and rules (defaults, costs, CTA-enable predicates).
// The backend contract lives in @/lib/api/contract (MuseApi).

export type {
  MvType,
  ShotKind,
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

import type {
  ComposeState,
  MvSettings,
  MvType,
  Scene,
  ShotKind,
  Song,
  SongCompose,
} from "@/lib/api/schemas";

export const DESCRIPTION_MAX = 2500;

/**
 * ── CREDIT COSTS — read this before changing a number (TBD-CC-05) ───────────
 *
 * `specs/areas/11-credit-consumption.md` is authoritative; the cloud config
 * (`[YCM] Credit Consume Cloud Config .json` at the repo root) is the source of
 * its numbers. **Four of the six costs below are NOT fixed values** — they are
 * `base + rate × seconds`, so no constant can express them correctly.
 *
 * **REWRITTEN 2026-08-19 — the placeholders are gone; these ARE spec 11's rules.**
 *
 * The 2026-08-12 note that used to sit here argued the duration-dependent costs
 * should wait for the backend, because `TBD-CC-05`'s own wording is "由後端回傳
 * 而非 hardcode". That reasoning conflated two different things and cost us a
 * wrong price on every MV for a week:
 *
 *   · WHO owns the number at runtime (the backend, eventually) — still true, and
 *     these functions are the single place that swap gets made.
 *   · WHETHER the prototype charges the RIGHT amount today — it did not. A 30s
 *     singing/1080p MV cost 225 in the spec and 200 here, Merge cost 10 in the
 *     spec and 200 here, and the storyboard tier did not exist at all.
 *
 * `TBD-CC-06` (the payload field names) genuinely IS unresolved, but it blocks
 * only the API CALL. It never blocked the arithmetic, and this prototype has no
 * backend to call anyway — the balance is local. So the formulas land now.
 *
 * | scenario           | spec  | rule                                              |
 * | ------------------ | ----- | ------------------------------------------------- |
 * | AI Song            | §3.1  | flat 6 vocal / 12 instrumental                    |
 * | Create MV          | §3.2  | `upload_song` 45 + per-second by mvType × res     |
 * | Create Script      | §3.3  | tier by song length: 12 / 15 / 18                 |
 * | Generate MV        | §3.4  | `from_script` 35 + the same per-second table      |
 * | Edit MV · Recreate | §3.5  | `recreate` 8 + per-second by SHOT kind × res      |
 * | Edit MV · Merge    | §3.6  | flat 10, any length                               |
 * | Edit MV · Cover    | §6.1  | `edit_poster` — flat 4 per result                 |
 */

/** UI "Standard"/"High" are the cloud-config `720p`/`1080p` tiers. */
export type Resolution = "720p" | "1080p";
export function resolutionOf(settings: Pick<MvSettings, "resolution">): Resolution {
  return settings.resolution === "High" ? "1080p" : "720p";
}

/** §4 — per-song sub actions, charged once per job. */
export const COST_UPLOAD_SONG = 45;
export const COST_FROM_SCRIPT = 35;
export const COST_RECREATE = 8;

/** §4 — `<mvType>_<res>_seedance15`, charged per second of MV. */
const RENDER_PER_SEC: Record<MvType, Record<Resolution, number>> = {
  singing: { "720p": 5, "1080p": 6 },
  storytelling: { "720p": 2, "1080p": 4 },
  hybrid: { "720p": 4, "1080p": 5 },
};

/**
 * §4 — `sing_<res>` / `story_<res>`, charged per second of the SHOT.
 * Note `sing` is 7 at both resolutions; that is the spec's table, not a typo.
 */
const SHOT_PER_SEC: Record<ShotKind, Record<Resolution, number>> = {
  sing: { "720p": 7, "1080p": 7 },
  story: { "720p": 2, "1080p": 4 },
};

/** §3.3 + §6.1 — `create_script_upload_song`'s three `procUnitRange` tiers. */
const SCRIPT_TIERS: ReadonlyArray<{ maxSec: number; credits: number }> = [
  { maxSec: 40, credits: 12 },
  { maxSec: 120, credits: 15 },
  { maxSec: 240, credits: 18 },
];

/** §3.3 — Create Storyboard First. Priced off the song, before any MV exists. */
export function scriptCost(songSec: number): number {
  const tier = SCRIPT_TIERS.find((t) => songSec <= t.maxSec);
  // Above 240s is out of product range (§2 caps length at 240) — charge the top
  // tier rather than returning 0, which would silently give away a render.
  return (tier ?? SCRIPT_TIERS[SCRIPT_TIERS.length - 1]).credits;
}

/** §3.2 — Create MV Directly: `upload_song` + per-second render. */
export function createMvCost(mvType: MvType, res: Resolution, sec: number): number {
  return COST_UPLOAD_SONG + RENDER_PER_SEC[mvType][res] * Math.round(sec);
}

/** §3.4 — Generate MV from a storyboard. Same render rate; the script was paid for. */
export function generateMvCost(mvType: MvType, res: Resolution, sec: number): number {
  return COST_FROM_SCRIPT + RENDER_PER_SEC[mvType][res] * Math.round(sec);
}

/** §3.5 — one shot's Recreate. Charged per shot, never batched (§5.4). */
export function recreateShotCost(kind: ShotKind, res: Resolution, sec: number): number {
  return COST_RECREATE + SHOT_PER_SEC[kind][res] * Math.round(sec);
}

/**
 * A shot's billing kind, with the fallback for storyboards that predate the
 * field. `singing`/`storytelling` MVs are uniform; a `hybrid` alternates, which
 * is what the mock generator writes — the real answer will come from the model.
 */
export function shotKind(scene: Pick<Scene, "index" | "kind">, mvType: MvType): ShotKind {
  if (scene.kind) return scene.kind;
  if (mvType === "singing") return "sing";
  if (mvType === "storytelling") return "story";
  return scene.index % 2 === 0 ? "sing" : "story";
}

/**
 * Seconds in a scene's `range` ("00:00–00:09" → 9). Returns 0 when the string
 * is not in that shape, so an unparseable range charges the flat `recreate` 8
 * rather than an invented duration.
 */
export function sceneDurationSec(range: string): number {
  const parts = range.split(/[–-]/).map((t) => t.trim());
  if (parts.length !== 2) return 0;
  const toSec = (t: string) => {
    const m = /^(\d+):(\d{1,2})$/.exec(t);
    return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
  };
  const a = toSec(parts[0]);
  const b = toSec(parts[1]);
  return Number.isFinite(a) && Number.isFinite(b) && b > a ? b - a : 0;
}

/** §3.6 — Merge MV: flat, any length 1–240s. */
export const COST_MERGE = 10;
/** §6.1 — `edit_poster`: flat 4 per result. */
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
