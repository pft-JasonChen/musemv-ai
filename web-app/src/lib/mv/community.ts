// Community sample data — ported from the mobile prototype (muse-prototype-v2.html).
// Powers the homepage community sections (New MVs, Top Picks Songs, New Songs),
// the MV/song player pages, the creator profile, and the explore pages.

// Entity types live as Zod schemas in @/lib/api/schemas; re-exported here so
// existing imports keep working.
import type { CommunityCreator, CommunityMv, CommunitySong } from "@/lib/api/schemas";

export type { Badge, CommunityCreator, CommunityMv, CommunitySong } from "@/lib/api/schemas";

const V_SINGING = "/assets/videos/mv-preview/feature_intro_ai_mv_singing_480x640.mp4";
const V_STORY = "/assets/videos/mv-preview/feature_intro_ai_mv_storytelling_480x640.mp4";
const V_HYBRID = "/assets/videos/mv-preview/feature_intro_ai_mv_hybrid_480x640.mp4";
const mv = (n: string) => `/assets/videos/sample-mvs/${n}`;
const art = (n: number) => `/assets/images/album-art/album_${String(n).padStart(2, "0")}.jpg`;

// Matched songs by MV style (from prototype _styleSongMap, extended).
const SONG_GOLDEN = { title: "Golden Hour", art: art(1), durationSec: 150 };
const SONG_ETHEREAL = { title: "Ethereal Echoes", art: art(6), durationSec: 165 };
const SONG_NEON = { title: "Neon Pulse", art: art(2), durationSec: 205 };
const SONG_ELYSIAN = { title: "Elysian Reverie", art: art(7), durationSec: 165 };

// ── New MVs (home carousel + "See all" grid) ───────────────────────────────
export const NEW_MVS: CommunityMv[] = [
  { id: "mv-cinematic-dark", title: "Cinematic Dark", thumb: mv("mv_01_cinematic_dark.jpg"), video: V_SINGING, badge: "HOT", meta: "Popular | 2-3 min", prompt: "A cinematic dark visual journey — neon lights, dramatic angles, emotive close-ups.", mvType: "singing", creator: "EchoingDreams", plays: 11200, likes: 682, shares: 82, date: "2026-06-06", matchedSong: SONG_GOLDEN },
  { id: "mv-nature-earth", title: "Nature & Earth", thumb: mv("mv_07_nature_earth.jpg"), video: V_STORY, badge: "NEW", meta: "Trending | 1-2 min", prompt: "Nature meets music — sweeping landscapes, organic textures, earthy tones.", mvType: "storytelling", creator: "ChasingWaves", plays: 1100, likes: 1100, shares: 96, date: "2026-06-04", matchedSong: SONG_ETHEREAL },
  { id: "mv-late-night-stage", title: "Late Night Stage", thumb: mv("mv_02_late_night_stage.jpg"), video: V_SINGING, badge: null, meta: "New | 2-3 min", prompt: "Late night stage performance — moody lighting, intimate venue, raw energy.", mvType: "singing", creator: "MysticRhythm", plays: 870, likes: 231, shares: 45, date: "2026-06-02", matchedSong: SONG_NEON },
  { id: "mv-neon-city", title: "Neon City", thumb: mv("mv_03_neon_city.jpg"), video: V_STORY, badge: null, meta: "Hot | 2-3 min", prompt: "Urban neon city vibes — glowing streets, fast cuts, electric atmosphere.", mvType: "storytelling", creator: "CinematicSoul", plays: 98, likes: 98, shares: 12, date: "2026-05-30", matchedSong: SONG_NEON },
  { id: "mv-anime-style", title: "Anime Style", thumb: mv("mv_05_anime_style.jpg"), video: V_HYBRID, badge: null, meta: "Fan fav | 1-2 min", prompt: "Anime-inspired visual adventure — vibrant colors, dynamic motion, bold style.", mvType: "hybrid", creator: "EchoingStars", plays: 689, likes: 38, shares: 9, date: "2026-05-28", matchedSong: SONG_ELYSIAN },
  // Grid extras
  { id: "mv-law-rhythm", title: "Law Rhythm", thumb: mv("mv_04_eletronic.jpg"), video: V_SINGING, badge: null, meta: "Fan fav | 1-2 min", prompt: "Electric rhythms and hypnotic beats — pulsing neon, raw energy, bold performance.", mvType: "singing", creator: "StarryNights", plays: 1300, likes: 1300, shares: 134, date: "2026-05-26", matchedSong: SONG_NEON },
  { id: "mv-adventurous-echoes", title: "Adventurous Echoes", thumb: mv("mv_06_cinematic_movie.jpg"), video: V_STORY, badge: null, meta: "Trending | 1-2 min", prompt: "Wide-open nature landscapes and soaring cinematic shots — earthy tones, golden light.", mvType: "storytelling", creator: "VividVisions", plays: 106, likes: 106, shares: 18, date: "2026-05-24", matchedSong: SONG_ETHEREAL },
  { id: "mv-dreamy-pastel", title: "Dreamy Pastel", thumb: mv("mv_11_halo.jpg"), video: V_HYBRID, badge: "NEW", meta: "New | 1-3 min", prompt: "Soft pastel dreamscape — floating visuals, delicate palette, surreal atmosphere.", mvType: "hybrid", creator: "LunarDreamer", plays: 68, likes: 68, shares: 6, date: "2026-05-22", matchedSong: SONG_ELYSIAN },
  { id: "mv-hot-love", title: "Hot Love", thumb: mv("mv_08_dramatic_scene.jpg"), video: V_STORY, badge: null, meta: "Fan fav | 1-2 min", prompt: "Passionate story of love and desire — warm tones, cinematic storytelling, emotional depth.", mvType: "storytelling", creator: "MysticRhythm", plays: 870, likes: 870, shares: 88, date: "2026-05-20", matchedSong: SONG_GOLDEN },
  { id: "mv-urban-fashion", title: "Urban Fashion", thumb: mv("mv_10_monochrome.jpg"), video: V_SINGING, badge: "HOT", meta: "Hot | 2-3 min", prompt: "Street style meets music — bold fashion, urban energy, attitude-filled performance.", mvType: "singing", creator: "UrbanExplorer", plays: 285, likes: 285, shares: 28, date: "2026-05-18", matchedSong: SONG_NEON },
  { id: "mv-rock-n-roll", title: "Rock & Roll", thumb: mv("mv_09_urban_performer.jpg"), video: V_SINGING, badge: null, meta: "Fan fav | 1-2 min", prompt: "Raw rock energy — guitar-driven visuals, stage presence, electrifying performance.", mvType: "singing", creator: "MysticWaves", plays: 38, likes: 38, shares: 4, date: "2026-05-15", matchedSong: SONG_NEON },
];

// ── Trending MVs (home hero carousel + Create MV right-side panel) ──────────
export const TRENDING_MVS: CommunityMv[] = [
  { id: "trend-adventurous-echoes", title: "Adventurous Echoes", thumb: "/assets/videos/sample-mvs/mv_12_Splash.jpg", video: V_SINGING, badge: null, meta: "Adventure · 2-3 min", prompt: "Wide-open landscapes and soaring cinematic shots — earthy tones, golden light.", mvType: "singing", creator: "VividVisions", plays: 9800, likes: 2100, shares: 240, date: "2026-06-09", matchedSong: SONG_ETHEREAL },
  { id: "trend-thrilling-harmonies", title: "Thrilling Harmonies", thumb: "/assets/videos/sample-mvs/mv_13_Urban%20Fashion.jpg", video: V_HYBRID, badge: null, meta: "Hybrid · 3-4 min", prompt: "A hybrid cinematic journey — bold fashion, vivid energy, soaring harmonies.", mvType: "hybrid", creator: "UrbanExplorer", plays: 7400, likes: 1600, shares: 180, date: "2026-06-08", matchedSong: SONG_NEON },
  { id: "trend-epic-journeys", title: "Epic Journeys", thumb: "/assets/videos/sample-mvs/mv_14_Vintage%20Car.jpg", video: V_STORY, badge: null, meta: "Storytelling · 3-4 min", prompt: "A cinematic road trip — vintage car, golden light, open highway.", mvType: "storytelling", creator: "CinematicSoul", plays: 12300, likes: 3050, shares: 410, date: "2026-06-07", matchedSong: SONG_GOLDEN },
];

// ── Community songs (master list: Top Picks + New Songs + Songs-all) ────────
const LYRICS: Record<string, string> = {
  "Down the Memory Lane": "Walking down the memory lane\nEvery step brings back the rain\nFaded photographs and old love songs\nReminding me of where I belong",
  "Midnight Drive": "Speeding through the neon lights at night\nCity blurs and everything feels right\nWindows down, the music hits so hard\nLosing myself somewhere in the dark",
  "Forest Morning": "Waking up to birds and morning dew\nSunlight filtering through the green\nEvery breath feels like something new\nNature painting the most peaceful scene",
  "Neon Pulse": "Electric pulse running through my veins\nCity lights and synthesizer refrains\nLost inside the rhythm of the night\nNeon signs ignite the city bright",
  "Golden Hour": "Golden light is fading slow\nEverything is warm and soft and low\nThis moment passing like a dream\nNothing is quite as it seems",
  "Ocean Dreams": "Drifting on the ocean blue\nWaves are singing something true\nSalty air and endless sky\nWatching all the clouds drift by",
  "Last September": "Last September when we said goodbye\nLeaves were falling underneath the sky\nI still hear your voice in the autumn wind\nWondering if we'll ever meet again",
  "City Lights": "City lights below, they shine for us\nJazz on the rooftop, life is glorious\nEvery note a story to be told\nEverything in blue and bronze and gold",
  "Winter Song": "First snow falling soft and white\nWrapped in warmth on a cold winter night\nFire crackling and your hand in mine\nEverything will turn out fine",
  "Pop Anthem": "Turn it up, we're living for tonight\nEvery sound and every beat feels right\nRaise your hands up to the sky\nThis is our moment, you and I",
  "Chill R&B": "Late night, dim lights, just you and me\nSmooth sounds, slow vibes, feeling free\nYour heartbeat matching mine so right\nWe can stay like this all night",
  "Acoustic Folk": "Picking up my guitar by the fire\nSinging songs that lift me higher\nSimple words and honest chords\nThis is all I need, no more",
};
const lyr = (t: string) => LYRICS[t];

export const TOP_PICKS_SONGS: CommunitySong[] = [
  { id: "sp-pop-anthem", title: "Pop Anthem", cover: art(1), tags: "Pop · Upbeat", genre: "Pop", mood: "Uplifting", creator: "MelodyMaker123", plays: 4200, likes: 980, shares: 120, date: "2026-06-07", badge: "NEW", lyrics: lyr("Pop Anthem") },
  { id: "sp-chill-rnb", title: "Chill R&B", cover: art(2), tags: "R&B · Slow", genre: "R&B", mood: "Melancholic", creator: "SmoothGroove", plays: 3100, likes: 720, shares: 88, date: "2026-06-06", badge: null, lyrics: lyr("Chill R&B") },
  { id: "sp-electronic", title: "Electronic", cover: art(3), tags: "Electronic · Fast", genre: "Electronic", mood: "Energetic", creator: "PulseWave", plays: 5600, likes: 1300, shares: 210, date: "2026-06-05", badge: "HOT", lyrics: lyr("Neon Pulse") },
  { id: "sp-acoustic-folk", title: "Acoustic Folk", cover: art(4), tags: "Acoustic · Calm", genre: "Acoustic", mood: "Calm", creator: "QuietPines", plays: 2400, likes: 540, shares: 60, date: "2026-06-04", badge: null, lyrics: lyr("Acoustic Folk") },
];

export const NEW_SONGS: CommunitySong[] = [
  { id: "ns-memory-lane", title: "Down the Memory Lane", cover: art(5), tags: "Lo-fi · Soothing · Cozy", genre: "Lo-fi", mood: "Calm", creator: "StarryNights", plays: 286, likes: 107, shares: 68, date: "2026-06-08", badge: "NEW", lyrics: lyr("Down the Memory Lane") },
  { id: "ns-midnight-drive", title: "Midnight Drive", cover: art(8), tags: "Electronic · Dark", genre: "Electronic", mood: "Dark", creator: "ChasingWaves", plays: 108, likes: 68, shares: 34, date: "2026-06-08", badge: null, lyrics: lyr("Midnight Drive") },
  { id: "ns-forest-morning", title: "Forest Morning", cover: art(1), tags: "Acoustic · Folk", genre: "Acoustic", mood: "Calm", creator: "MysticRhythm", plays: 68, likes: 42, shares: 26, date: "2026-06-07", badge: null, lyrics: lyr("Forest Morning") },
  { id: "ns-neon-pulse", title: "Neon Pulse", cover: art(2), tags: "Electronic · Energetic", genre: "Electronic", mood: "Energetic", creator: "LyricLover", plays: 195, likes: 84, shares: 41, date: "2026-06-07", badge: null, lyrics: lyr("Neon Pulse") },
  { id: "ns-golden-hour", title: "Golden Hour", cover: art(3), tags: "R&B · Warm", genre: "R&B", mood: "Uplifting", creator: "SoundSculptor", plays: 143, likes: 56, shares: 29, date: "2026-06-06", badge: null, lyrics: lyr("Golden Hour") },
  { id: "ns-ocean-dreams", title: "Ocean Dreams", cover: art(4), tags: "Ambient · Calm", genre: "Acoustic", mood: "Calm", creator: "TuneTraveler", plays: 92, likes: 31, shares: 17, date: "2026-06-06", badge: null, lyrics: lyr("Ocean Dreams") },
  { id: "ns-last-september", title: "Last September", cover: art(6), tags: "Pop · Nostalgic", genre: "Pop", mood: "Melancholic", creator: "BeatExplorer", plays: 74, likes: 28, shares: 12, date: "2026-06-05", badge: null, lyrics: lyr("Last September") },
  { id: "ns-city-lights", title: "City Lights", cover: art(7), tags: "Jazz · Cinematic", genre: "Jazz", mood: "Calm", creator: "HarmonicWaves", plays: 57, likes: 18, shares: 6, date: "2026-06-05", badge: null, lyrics: lyr("City Lights") },
  { id: "ns-winter-song", title: "Winter Song", cover: art(9), tags: "Acoustic · Cozy", genre: "Acoustic", mood: "Calm", creator: "ChillVibes", plays: 103, likes: 32, shares: 10, date: "2026-06-04", badge: null, lyrics: lyr("Winter Song") },
  { id: "ns-random-access", title: "Random Access Memories", cover: art(10), tags: "Dreamy · Synth · Retro", genre: "Electronic", mood: "Energetic", creator: "SunnyDaze", plays: 215, likes: 94, shares: 53, date: "2026-06-03", badge: null, lyrics: lyr("Neon Pulse") },
  { id: "ns-whispers-past", title: "Whispers of the Past", cover: art(5), tags: "Lo-fi · Soothing", genre: "Lo-fi", mood: "Calm", creator: "SunnyDaze", plays: 1200, likes: 265, shares: 68, date: "2026-06-02", badge: null, lyrics: lyr("Down the Memory Lane") },
  { id: "ns-neon-city-nights", title: "Neon City Nights", cover: art(3), tags: "Electronic · Urban", genre: "Electronic", mood: "Dark", creator: "GrooveMaster", plays: 168, likes: 16, shares: 8, date: "2026-06-01", badge: null, lyrics: lyr("Neon Pulse") },
];

/** Full ordered playlist for the song player prev/next navigation. */
export const ALL_COMMUNITY_SONGS: CommunitySong[] = [...TOP_PICKS_SONGS, ...NEW_SONGS];

// ── Creator profile (reached from any avatar; single sample creator) ────────
export const DEFAULT_CREATOR: CommunityCreator = {
  id: "liam-johnson",
  name: "Liam Johnson",
  email: "liam_johnson@mail.com",
  avatar: "/assets/images/character-photos/samples/Sample_P1.jpg",
  plays: "11.4k",
  likes: "258",
};

export const CREATOR_MVS: CommunityMv[] = [
  { id: "cp-cinematic-night", title: "Cinematic Night", thumb: mv("mv_01_cinematic_dark.jpg"), video: V_SINGING, badge: null, meta: "Popular | 2-3 min", prompt: "A cinematic dark visual journey — neon lights, dramatic angles, emotive close-ups.", mvType: "singing", creator: DEFAULT_CREATOR.name, plays: 1200, likes: 472, shares: 82, date: "2026-06-06", matchedSong: SONG_GOLDEN },
  { id: "cp-neon-city-nights", title: "Neon City Nights", thumb: mv("mv_03_neon_city.jpg"), video: V_STORY, badge: null, meta: "Hot | 2-3 min", prompt: "Urban neon city vibes — glowing streets, fast cuts, electric atmosphere.", mvType: "storytelling", creator: DEFAULT_CREATOR.name, plays: 13, likes: 0, shares: 0, date: "2026-06-02", matchedSong: SONG_NEON },
  { id: "cp-starfall-serenade", title: "Starfall Serenade", thumb: mv("mv_01_cinematic_dark.jpg"), video: V_SINGING, badge: null, meta: "Trending | 1-2 min", prompt: "A dreamy serenade beneath a sky full of falling stars — soft glow, gentle motion.", mvType: "singing", creator: DEFAULT_CREATOR.name, plays: 847, likes: 231, shares: 45, date: "2026-05-30", matchedSong: SONG_ELYSIAN },
  { id: "cp-electric-dreams", title: "Electric Dreams", thumb: mv("mv_03_neon_city.jpg"), video: V_STORY, badge: null, meta: "Hot | 2-3 min", prompt: "Electric neon dreamscape — vivid colors, pulsing light, futuristic energy.", mvType: "storytelling", creator: DEFAULT_CREATOR.name, plays: 2100, likes: 689, shares: 134, date: "2026-05-25", matchedSong: SONG_NEON },
  { id: "cp-urban-whispers", title: "Urban Whispers", thumb: mv("mv_01_cinematic_dark.jpg"), video: V_SINGING, badge: null, meta: "New | 2-3 min", prompt: "Quiet urban moments — soft shadows, intimate close-ups, late-night calm.", mvType: "singing", creator: DEFAULT_CREATOR.name, plays: 412, likes: 88, shares: 19, date: "2026-05-20", matchedSong: SONG_GOLDEN },
  { id: "cp-crystal-horizon", title: "Crystal Horizon", thumb: mv("mv_03_neon_city.jpg"), video: V_HYBRID, badge: null, meta: "New | 1-2 min", prompt: "A crystalline horizon at dawn — prismatic light, expansive vistas, serene awe.", mvType: "hybrid", creator: DEFAULT_CREATOR.name, plays: 5, likes: 0, shares: 0, date: "2026-05-15", matchedSong: SONG_ETHEREAL },
];

export const CREATOR_SONGS: CommunitySong[] = [
  { id: "cps-golden-hour", title: "Golden Hour", cover: art(5), tags: "R&B · Warm", genre: "R&B", mood: "Uplifting", creator: DEFAULT_CREATOR.name, plays: 11300, likes: 256, shares: 5, date: "2026-06-05", badge: null, lyrics: lyr("Golden Hour") },
  { id: "cps-midnight-drive", title: "Midnight Drive", cover: art(6), tags: "Electronic · Dark", genre: "Electronic", mood: "Dark", creator: DEFAULT_CREATOR.name, plays: 18, likes: 2, shares: 1, date: "2026-06-01", badge: null, lyrics: lyr("Midnight Drive") },
  { id: "cps-dusk-ballad", title: "Dusk Ballad", cover: art(8), tags: "Acoustic · Mellow", genre: "Acoustic", mood: "Calm", creator: DEFAULT_CREATOR.name, plays: 3, likes: 0, shares: 0, date: "2026-05-28", badge: null },
  { id: "cps-forest-morning", title: "Forest Morning", cover: art(1), tags: "Acoustic · Folk", genre: "Acoustic", mood: "Calm", creator: DEFAULT_CREATOR.name, plays: 2, likes: 0, shares: 0, date: "2026-05-27", badge: null, lyrics: lyr("Forest Morning") },
  { id: "cps-velvet-sky", title: "Velvet Sky", cover: art(2), tags: "Pop · Dreamy", genre: "Pop", mood: "Uplifting", creator: DEFAULT_CREATOR.name, plays: 634, likes: 147, shares: 28, date: "2026-05-22", badge: null },
  { id: "cps-neon-pulse", title: "Neon Pulse", cover: art(3), tags: "Electronic · Energetic", genre: "Electronic", mood: "Energetic", creator: DEFAULT_CREATOR.name, plays: 1800, likes: 392, shares: 67, date: "2026-05-18", badge: null, lyrics: lyr("Neon Pulse") },
  { id: "cps-dreaming-loud", title: "Dreaming Loud", cover: art(4), tags: "Pop · Upbeat", genre: "Pop", mood: "Uplifting", creator: DEFAULT_CREATOR.name, plays: 89, likes: 12, shares: 3, date: "2026-05-14", badge: null },
  { id: "cps-ocean-drift", title: "Ocean Drift", cover: art(7), tags: "Ambient · Calm", genre: "Acoustic", mood: "Calm", creator: DEFAULT_CREATOR.name, plays: 7, likes: 1, shares: 0, date: "2026-05-10", badge: null, lyrics: lyr("Ocean Dreams") },
];

// ── Lookups ─────────────────────────────────────────────────────────────────
const MV_BY_ID = new Map<string, CommunityMv>([...NEW_MVS, ...TRENDING_MVS, ...CREATOR_MVS].map((m) => [m.id, m]));
const SONG_BY_ID = new Map<string, CommunitySong>([...ALL_COMMUNITY_SONGS, ...CREATOR_SONGS].map((s) => [s.id, s]));

export const getCommunityMv = (id: string | null): CommunityMv | undefined => (id ? MV_BY_ID.get(id) : undefined);
export const getCommunitySong = (id: string | null): CommunitySong | undefined => (id ? SONG_BY_ID.get(id) : undefined);

export function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.max(0, n));
}
