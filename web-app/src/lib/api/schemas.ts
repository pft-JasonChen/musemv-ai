// Zod schemas — single source of truth for the entity types crossing the
// UI ↔ backend boundary. Types are inferred (z.infer), so schema and type
// can never drift. The mock API validates against these at the boundary;
// a real backend client should do the same with response payloads.

import { z } from "zod";
import { FEEDBACK_DESCRIPTION_MAX } from "@/lib/feedback";

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
  /** Carried through from AI Song generation so the MV storyboard can display it. */
  lyrics: z.string().optional(),
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
  resolution: z.enum(["Standard", "High"]),
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

/**
 * Which per-second rate a shot's Recreate is charged at (spec 11 §3.5).
 * Deliberately NOT `MvType`: the spec prices a shot by ITS OWN kind, not the
 * MV's, which is why a Hybrid MV carries both — singing passages bill `sing_*`,
 * narrative ones `story_*`. There is no `hybrid_*` shot rate.
 */
export const ShotKindSchema = z.enum(["sing", "story"]);
export type ShotKind = z.infer<typeof ShotKindSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  index: z.number(),
  range: z.string(), // e.g. "00:00–00:09"
  text: z.string(),
  /**
   * Optional so a storyboard persisted before 2026-08-19 still `.parse()`s;
   * `shotKind()` in `lib/mv/types.ts` supplies the fallback. New storyboards
   * always carry it.
   */
  kind: ShotKindSchema.optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

/** Fallback lyric passthrough — shown when the source song carries no lyrics. */
export const DEFAULT_STORYBOARD_LYRICS =
  "In the stillness of midnight, as raindrops dance upon the pavement,\na story unfolds, a tale of love and loss.\nThe echoes of the past whisper through the droplets,\neach one carrying a memory, a moment lost in time.\nThe rain, a gentle symphony, sets the stage for reflection.\nAnd in your eyes I see the stars we used to chase,\na fleeting moment frozen in the grace of time.\nHold me close beneath the silver light,\nand let the music carry us through the night.";

// Defaults double as a migration path: `StoryboardSchema.parse()` backfills these
// fields onto any storyboard persisted before they existed (see MvFlowProvider).
export const StoryboardSchema = z.object({
  characterImage: z.string(),
  visualStyle: z.string(),
  scenes: z.array(SceneSchema),
  /** Read-only narrative summary (derived from the original MV description). */
  story: z.string().default("A radiant artist performing in a softly lit studio, dreamy and devoted."),
  /** Read-only lyric passthrough — always present so the Lyrics section renders. */
  lyrics: z.string().default(DEFAULT_STORYBOARD_LYRICS),
  /** MV cover art — starts as the character image; regenerable on Edit MV. */
  coverImage: z.string().default("/assets/images/storyboard/storyboard_01.jpg"),
  /** Editable prompt driving cover-art (re)generation. */
  coverDescription: z.string().default('Create a captivating cover image that embodies the essence of a dreamy night sky filled with shimmering stars.'),
});
export type Storyboard = z.infer<typeof StoryboardSchema>;

export const MvJobSchema = z.object({
  id: z.string(),
  mode: MvModeSchema,
  status: MvJobStatusSchema,
  progress: z.number(), // 0–100
  step: z.string(),
  compose: ComposeStateSchema,
  /** Preview image for lists/history; assigned by the backend at creation. */
  thumb: z.string(),
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
  // SONG-01: custom-mode musical controls. Defaulted so existing callers and
  // persisted/mock data stay valid without supplying them.
  bpm: z.number().default(120),
  key: z.string().nullable().default(null),
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

// ── Support ticket (Send Feedback) ────────────────────────────────────────
//
// Field names ARE the CSB params (spec areas/06 §3.1), so there is no mapping
// layer between this type and the wire — RD points `submitFeedback` at the real
// endpoint and sends this object as-is.

/**
 * A picked attachment. Structural rather than `v instanceof File` on purpose:
 * this module is imported during SSR/prerender and by vitest, where the `File`
 * global may not be the same class (or present at all), and a `instanceof`
 * against a missing global throws at parse time instead of failing validation.
 */
const FileLikeSchema = z.custom<File>(
  (v) =>
    typeof v === "object" &&
    v !== null &&
    typeof (v as File).name === "string" &&
    typeof (v as File).size === "number",
  { message: "Expected a File" },
);

export const FeedbackTicketSchema = z.object({
  /** Reply address. Prefilled from the account but user-editable. */
  email: z.string().min(3),
  /**
   * CSB issue type. **Nullable** because "Community Report" has no id yet
   * (TBD-PROF-06) — the label ships, the id does not.
   */
  questionTypeId: z.number().int().nullable(),
  /**
   * ⚠️ **`title` IS GONE — this is a declared C2 contract change**
   * (2026-08-27, product owner; logged in `docs/CHANGELOG-RD.md`).
   *
   * The dialog's **Subject** field was removed, so there is no longer anything
   * to put in CSB's `title` param and the payload omits it entirely rather
   * than sending a placeholder. This reverses `AC-PROF-12`'s old
   * "`title` = Subject" clause, which is why the frozen surface snapshot moved
   * in the same change instead of being regenerated quietly.
   *
   * ❓ **OPEN FOR RD (TBD-PROF-07): which endpoint is this, and does it want a
   * `title` at all?** The product owner reconfirmed "don't send it" on
   * 2026-08-27 with the reason that **Muse looks to be on a DIFFERENT API from
   * YCO's CSB** — which, if right, makes every CSB-inherited value in this
   * schema provisional, not just this one (the four `questionTypeId`s,
   * `prodVerId` 504, and the attachment cap all came from those documents;
   * `src/lib/feedback.ts` links them).
   *
   * If the real endpoint DOES require a title, the decision comes back to the
   * product owner rather than to an invented value — the Type label, the first
   * 60 chars of the description, and a fixed constant were all weighed and
   * rejected. Do not pick one unilaterally.
   */
  /**
   * The description text ALONE. §T3 composes User ID and Order ID into `q`;
   * Muse Web deliberately does not — the User ID is injected server-side from
   * the session, and Order ID is not collected at all (§3.1 divergences 2 & 3).
   */
  q: z.string().min(1).max(FEEDBACK_DESCRIPTION_MAX),
  /** Active product locale code (`enu`…`ptg`), not BCP-47. */
  language: z.string(),
  /** `null` until TBD-PROF-06 supplies Muse Web's own id (YCO's is 504). */
  prodVerId: z.number().int().nullable(),
  /** Any file type, 5 MB across all of them. RD sends as multipart/form-data. */
  attachment: z.array(FileLikeSchema),
});
export type FeedbackTicket = z.infer<typeof FeedbackTicketSchema>;

export const FeedbackReceiptSchema = z.object({ ticketId: z.string() });
export type FeedbackReceipt = z.infer<typeof FeedbackReceiptSchema>;
