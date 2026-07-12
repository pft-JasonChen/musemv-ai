import type { MvType, Song, Storyboard } from "./types";

export interface MvTypeOption {
  id: MvType;
  name: string;
  desc: string;
  video: string;
}

export const MV_TYPES: MvTypeOption[] = [
  {
    id: "singing",
    name: "Singing",
    desc: "A virtual artist lip-syncs to your vocals, focusing on the singing performance.",
    video: "/assets/videos/mv-preview/feature_intro_ai_mv_singing_480x640.mp4",
  },
  {
    id: "storytelling",
    name: "Storytelling",
    desc: "A cinematic narrative unfolds scene by scene, driven by your description.",
    video: "/assets/videos/mv-preview/feature_intro_ai_mv_storytelling_480x640.mp4",
  },
  {
    id: "hybrid",
    name: "Hybrid",
    desc: "Blends singing performance with story-driven cinematic moments.",
    video: "/assets/videos/mv-preview/feature_intro_ai_mv_hybrid_480x640.mp4",
  },
];

// Only two real audio files exist; every sample song maps to one of them so
// playback/trim preview always has real audio (demo decision 2026-07-11).
// durationSec is ALWAYS the full track length of the assigned file — the trim
// range lives in Song.trim, never overwrites the duration.
const AUDIO_PARTY_DANCE = "/assets/songs/Party%20Dance.mp3"; // 160s
const AUDIO_TOP_FLOW = "/assets/songs/Top%20Flow%20Production%20-%20Party.mp3"; // 114s
const DUR_PARTY_DANCE = 160;
const DUR_TOP_FLOW = 114;

export const SAMPLE_SONGS: Song[] = [
  { id: "s1", source: "sample", title: "Top Flow - Party", durationSec: DUR_TOP_FLOW, art: "/assets/images/album-art/album_05.jpg", url: AUDIO_TOP_FLOW },
  { id: "s2", source: "sample", title: "Party Dance", durationSec: DUR_PARTY_DANCE, art: "/assets/images/album-art/album_08.jpg", url: AUDIO_PARTY_DANCE },
  { id: "s3", source: "sample", title: "Forest Morning", durationSec: DUR_TOP_FLOW, art: "/assets/images/album-art/album_01.jpg", url: AUDIO_TOP_FLOW },
  { id: "s4", source: "sample", title: "Golden Hour", durationSec: DUR_PARTY_DANCE, art: "/assets/images/album-art/album_03.jpg", url: AUDIO_PARTY_DANCE },
  { id: "s5", source: "sample", title: "Neon Pulse", durationSec: DUR_TOP_FLOW, art: "/assets/images/album-art/album_02.jpg", url: AUDIO_TOP_FLOW },
  { id: "s6", source: "sample", title: "Ethereal Echoes", durationSec: DUR_PARTY_DANCE, art: "/assets/images/album-art/album_06.jpg", url: AUDIO_PARTY_DANCE },
  { id: "s7", source: "sample", title: "Elysian Reverie", durationSec: DUR_TOP_FLOW, art: "/assets/images/album-art/album_07.jpg", url: AUDIO_TOP_FLOW },
];

export const MY_SONGS: Song[] = [
  { id: "m1", source: "library", title: "My Wedding Ballad", durationSec: DUR_PARTY_DANCE, art: "/assets/images/album-art/album_04.jpg", url: AUDIO_PARTY_DANCE },
  { id: "m2", source: "library", title: "Summer Vibes", durationSec: DUR_TOP_FLOW, art: "/assets/images/album-art/album_09.jpg", url: AUDIO_TOP_FLOW },
];

export const SAMPLE_FACES: string[] = Array.from(
  { length: 8 },
  (_, i) => `/assets/images/character-photos/samples/Sample_P${i + 1}.jpg`,
);

export interface TemplateOption {
  id: string;
  name: string;
  cover: string;
  prompt: string;
}

export const TEMPLATES: TemplateOption[] = [
  { id: "t1", name: "Neon City", cover: "/assets/videos/sample-mvs/mv_03_neon_city.jpg", prompt: "A glamorous night drive through a neon-lit city, reflections shimmering on wet streets." },
  { id: "t2", name: "Cinematic Dark", cover: "/assets/videos/sample-mvs/mv_01_cinematic_dark.jpg", prompt: "Moody cinematic close-ups under dramatic low-key lighting, deep shadows and rim light." },
  { id: "t3", name: "Late Night Stage", cover: "/assets/videos/sample-mvs/mv_02_late_night_stage.jpg", prompt: "A spotlit performance on a smoky late-night stage, intimate and emotional." },
  { id: "t4", name: "Anime Style", cover: "/assets/videos/sample-mvs/mv_05_anime_style.jpg", prompt: "Stylized anime visuals with vibrant colors and expressive motion." },
  { id: "t5", name: "Nature Earth", cover: "/assets/videos/sample-mvs/mv_07_nature_earth.jpg", prompt: "Sweeping natural landscapes at golden hour, organic and serene." },
  { id: "t6", name: "Urban Performer", cover: "/assets/videos/sample-mvs/mv_09_urban_performer.jpg", prompt: "Raw urban rooftop performance, city skyline behind, energetic handheld camera." },
];

export const IDEAS: string[] = [
  "A radiant artist performing in a softly lit studio, dreamy and devoted.",
  "Cinematic story of a midnight journey through glowing city streets.",
  "An intimate acoustic moment by a window as golden light pours in.",
  "Bold stage performance with dynamic lighting and confident energy.",
];

export const SAMPLE_RESULT_VIDEO =
  "/assets/videos/mv-preview/feature_intro_ai_mv_singing_480x640.mp4";

/** Build a mock storyboard (3 scenes, prototype-faithful). */
export function mockStoryboard(): Storyboard {
  return {
    characterImage: "/assets/images/storyboard/storyboard_01.jpg",
    visualStyle:
      "Radiant and joyful, with a dreamy yet devoted expression. Her look is glamorous and sophisticated.",
    scenes: [
      { id: "sc1", index: 1, range: "00:00–00:09", text: "In a softly lit, elegant dressing room, the woman stands before a grand mirror." },
      { id: "sc2", index: 2, range: "00:09–00:12", text: "Close-up on the vocalist as she begins to sing, her expression serene." },
      { id: "sc3", index: 3, range: "00:12–00:15", text: "The camera follows her hands as she traces the intricate lace patterns on her dress." },
    ],
  };
}

export function formatDuration(sec: number): string {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export interface Creation {
  id: string;
  kind: "mv" | "song";
  title: string;
  thumb: string;
  date: string;
  plays: number;
  likes: number;
  shares: number;
  liked: boolean;
}

// ── History ("My Creations") samples — ported from the app prototype ────────
export type HistoryStatus = "done" | "processing" | "failed";
export type HistoryKind = "mv" | "song" | "storyboard";

export interface HistorySample {
  id: string;
  kind: HistoryKind;
  title: string;
  thumb?: string; // image for done/community; omitted for processing/failed
  meta?: string; // shown instead of stats (e.g. "AI Song", "Storyboard")
  status: HistoryStatus;
  source?: "community";
  date: string;
  plays: number;
  likes: number;
  shares: number;
  liked: boolean;
  published?: boolean;
  /** Community rows open this song in the player. */
  communitySongId?: string;
}

export const HISTORY_SAMPLES: HistorySample[] = [
  { id: "h-cinematic-night", kind: "mv", title: "Cinematic Night", thumb: "/assets/videos/sample-mvs/mv_01_cinematic_dark.jpg", status: "done", date: "2026-06-08", plays: 0, likes: 0, shares: 0, liked: true },
  { id: "h-new-ai-song-proc", kind: "song", title: "New AI Song", meta: "AI Song", status: "processing", date: "2026-06-08", plays: 0, likes: 0, shares: 0, liked: false },
  { id: "h-golden-hour", kind: "song", title: "Golden Hour", thumb: "/assets/images/album-art/album_01.jpg", status: "done", date: "2026-06-08", plays: 108, likes: 38, shares: 15, liked: true },
  { id: "h-starlight", kind: "storyboard", title: "Starlight in Your Eyes", thumb: "/assets/images/storyboard/storyboard_01.jpg", meta: "Storyboard", status: "done", date: "2026-06-06", plays: 0, likes: 0, shares: 0, liked: false },
  { id: "h-neon-city-nights", kind: "mv", title: "Neon City Nights", thumb: "/assets/videos/sample-mvs/mv_03_neon_city.jpg", status: "done", date: "2026-06-06", plays: 68, likes: 12, shares: 3, liked: false },
  { id: "h-midnight-drive", kind: "song", title: "Midnight Drive", thumb: "/assets/images/album-art/album_08.jpg", status: "done", date: "2026-06-05", plays: 26, likes: 16, shares: 8, liked: false },
  { id: "h-whispers-past", kind: "song", title: "Whispers of the Past", thumb: "/assets/images/album-art/album_05.jpg", status: "done", source: "community", date: "2026-06-09", plays: 1200, likes: 265, shares: 68, liked: true, communitySongId: "ns-whispers-past" },
  { id: "h-midnight-drive-failed", kind: "song", title: "Midnight Drive", meta: "AI Song", status: "failed", date: "2026-06-05", plays: 0, likes: 0, shares: 0, liked: false },
];

export const SAMPLE_CREATIONS: Creation[] = [
  { id: "c1", kind: "mv", title: "Cinematic Night", thumb: "/assets/videos/sample-mvs/mv_01_cinematic_dark.jpg", date: "2026-06-08", plays: 0, likes: 0, shares: 0, liked: true },
  { id: "c2", kind: "song", title: "Golden Hour", thumb: "/assets/images/album-art/album_01.jpg", date: "2026-06-08", plays: 108, likes: 38, shares: 15, liked: true },
  { id: "c3", kind: "mv", title: "Neon City Drive", thumb: "/assets/videos/sample-mvs/mv_03_neon_city.jpg", date: "2026-06-05", plays: 42, likes: 12, shares: 3, liked: false },
  { id: "c4", kind: "song", title: "Ethereal Echoes", thumb: "/assets/images/album-art/album_06.jpg", date: "2026-06-03", plays: 215, likes: 64, shares: 22, liked: false },
  { id: "c5", kind: "mv", title: "Urban Performer", thumb: "/assets/videos/sample-mvs/mv_09_urban_performer.jpg", date: "2026-05-30", plays: 9, likes: 2, shares: 0, liked: false },
];

import type { SongCompose, SongResult } from "./types";

export const GENRES = ["Pop", "R&B", "Electronic", "Hip-Hop", "Acoustic", "Jazz", "Classical", "Lo-fi"];
export const MOODS = ["Uplifting", "Melancholic", "Romantic", "Energetic", "Calm", "Dark"];
export const VOCALS = ["Male", "Female"];

export const SONG_IDEAS = [
  "A bittersweet love song about leaving a city you called home, melancholic yet hopeful.",
  "An upbeat summer anthem about chasing dreams with friends.",
  "A calm lo-fi track for late-night studying, warm and nostalgic.",
  "An energetic pop song about starting over and feeling unstoppable.",
];

export const SAMPLE_AUDIO = "/assets/songs/Party%20Dance.mp3";

const SONG_TITLES = ["Golden Hour", "Midnight Drive", "Paper Hearts", "Neon Skyline", "Afterglow", "Holding On"];

export function mockSongResult(c: SongCompose): SongResult {
  const n = Math.floor(Math.random() * 12) + 1;
  const cover = `/assets/images/album-art/album_${String(n).padStart(2, "0")}.jpg`;
  const title = c.title.trim() || SONG_TITLES[Math.floor(Math.random() * SONG_TITLES.length)];
  return {
    id: crypto.randomUUID(),
    title,
    cover,
    genre: c.genre,
    mood: c.mood,
    durationSec: 62 + Math.floor(Math.random() * 120),
    audioUrl: SAMPLE_AUDIO,
    instrumental: c.instrumental,
    lyrics: c.lyrics || undefined,
  };
}
