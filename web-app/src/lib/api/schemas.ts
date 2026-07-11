// Zod schemas — single source of truth for the entity types crossing the
// UI ↔ backend boundary. Types are inferred (z.infer), so schema and type
// can never drift. The mock API validates against these at the boundary;
// a real backend client should do the same with response payloads.

import { z } from "zod";

// ── AI MV ────────────────────────────────────────────────────────────────

export const MvTypeSchema = z.enum(["singing", "storytelling", "hybrid"]);
export type MvType = z.infer<typeof MvTypeSchema>;

export const SongSourceSchema = z.enum(["library", "import", "sample", "link"]);
export type SongSource = z.infer<typeof SongSourceSchema>;

export const SongSchema = z.object({
  id: z.string(),
  source: SongSourceSchema,
  title: z.string(),
  durationSec: z.number(),
  art: z.string(),
  url: z.string().optional(),
  trim: z.object({ start: z.number(), end: z.number() }).optional(),
});
export type Song = z.infer<typeof SongSchema>;

export const CharacterPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  fromSample: z.boolean().optional(),
});
export type CharacterPhoto = z.infer<typeof CharacterPhotoSchema>;

export const MvSettingsSchema = z.object({
  ratio: z.enum(["9:16", "16:9"]),
  resolution: z.enum(["720P", "1080P"]),
  title: z.object({ on: z.boolean(), text: z.string() }),
  author: z.object({ on: z.boolean(), text: z.string() }),
  showSubtitle: z.boolean(),
  watermark: z.boolean(),
});
export type MvSettings = z.infer<typeof MvSettingsSchema>;

export const ComposeStateSchema = z.object({
  mvType: MvTypeSchema,
  song: SongSchema.nullable(),
  description: z.string(),
  photos: z.array(CharacterPhotoSchema),
  settings: MvSettingsSchema,
});
export type ComposeState = z.infer<typeof ComposeStateSchema>;

export const MvModeSchema = z.enum(["storyboard_first", "direct"]);
export type MvMode = z.infer<typeof MvModeSchema>;

export const MvJobStatusSchema = z.enum(["idle", "queued", "processing", "done", "failed"]);
export type MvJobStatus = z.infer<typeof MvJobStatusSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  index: z.number(),
  range: z.string(), // e.g. "00:00–00:09"
  text: z.string(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const StoryboardSchema = z.object({
  characterImage: z.string(),
  visualStyle: z.string(),
  scenes: z.array(SceneSchema),
});
export type Storyboard = z.infer<typeof StoryboardSchema>;

export const MvJobSchema = z.object({
  id: z.string(),
  mode: MvModeSchema,
  status: MvJobStatusSchema,
  progress: z.number(), // 0–100
  step: z.string(),
  compose: ComposeStateSchema,
  storyboard: StoryboardSchema.optional(),
  resultUrl: z.string().optional(),
});
export type MvJob = z.infer<typeof MvJobSchema>;

export const MvCreateRequestSchema = z.object({
  mode: MvModeSchema,
  compose: ComposeStateSchema,
});
export type MvCreateRequest = z.infer<typeof MvCreateRequestSchema>;

// ── AI Song ──────────────────────────────────────────────────────────────

export const SongModeSchema = z.enum(["simple", "custom"]);
export type SongMode = z.infer<typeof SongModeSchema>;

export const SongComposeSchema = z.object({
  mode: SongModeSchema,
  describe: z.string(),
  instrumental: z.boolean(),
  lyrics: z.string(),
  genre: z.string(),
  mood: z.string(),
  vocal: z.string().nullable(),
  title: z.string(),
});
export type SongCompose = z.infer<typeof SongComposeSchema>;

export const SongResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  cover: z.string(),
  genre: z.string(),
  mood: z.string(),
  durationSec: z.number(),
  audioUrl: z.string().optional(),
  instrumental: z.boolean(),
  lyrics: z.string().optional(),
});
export type SongResult = z.infer<typeof SongResultSchema>;

export const SongJobSchema = z.object({
  id: z.string(),
  status: MvJobStatusSchema,
  progress: z.number(), // 0–100
  step: z.string(),
  compose: SongComposeSchema,
  /** Assigned at job creation so the UI can show it while generating. */
  title: z.string(),
  cover: z.string(),
  result: SongResultSchema.optional(),
});
export type SongJob = z.infer<typeof SongJobSchema>;

// ── Community ────────────────────────────────────────────────────────────

export const BadgeSchema = z.enum(["HOT", "NEW"]).nullable();
export type Badge = z.infer<typeof BadgeSchema>;

export const CommunityCreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string(),
  /** Display strings, prototype-faithful (e.g. "11.4k"). */
  plays: z.string(),
  likes: z.string(),
});
export type CommunityCreator = z.infer<typeof CommunityCreatorSchema>;

export const CommunityMvSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumb: z.string(),
  video: z.string(),
  badge: BadgeSchema,
  meta: z.string(), // e.g. "Popular | 2-3 min"
  prompt: z.string(),
  mvType: MvTypeSchema,
  creator: z.string(), // username
  plays: z.number(),
  likes: z.number(),
  shares: z.number(),
  date: z.string(),
  /** Pre-matched song used when "Create Music Video" is tapped. */
  matchedSong: z.object({ title: z.string(), art: z.string(), durationSec: z.number() }),
});
export type CommunityMv = z.infer<typeof CommunityMvSchema>;

export const CommunitySongSchema = z.object({
  id: z.string(),
  title: z.string(),
  cover: z.string(),
  tags: z.string(), // e.g. "Lo-fi · Soothing · Cozy"
  genre: z.string(),
  mood: z.string(),
  creator: z.string(),
  plays: z.number(),
  likes: z.number(),
  shares: z.number(),
  date: z.string(),
  badge: BadgeSchema,
  lyrics: z.string().optional(),
});
export type CommunitySong = z.infer<typeof CommunitySongSchema>;
