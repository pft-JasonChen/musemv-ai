// Community sample data — ported from the mobile prototype (muse-prototype-v2.html).
// Powers the homepage community sections (New MVs, Top Picks Songs, New Songs),
// the MV/song player pages, the creator profile, and the explore pages.

// Entity types live as Zod schemas in @/lib/api/schemas; re-exported here so
// existing imports keep working.
import type { CommunityCreator, CommunityMv, CommunitySong, SongResult } from "@/lib/api/schemas";
import { HERO_ITEMS } from "@/components/home/heroItems";

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
  {
    id: "mv-cinematic-dark",
    title: "Cinematic Dark",
    thumb: mv("mv_01_cinematic_dark.jpg"),
    video: V_SINGING,
    badge: "HOT",
    meta: "Popular | 2-3 min",
    prompt: "A cinematic dark visual journey — neon lights, dramatic angles, emotive close-ups.",
    mvType: "singing",
    creator: "EchoingDreams",
    plays: 11200,
    likes: 682,
    shares: 82,
    date: "2026-06-06",
    matchedSong: SONG_GOLDEN,
  },
  {
    id: "mv-nature-earth",
    title: "Nature & Earth",
    thumb: mv("mv_07_nature_earth.jpg"),
    video: V_STORY,
    badge: "NEW",
    meta: "Trending | 1-2 min",
    prompt: "Nature meets music — sweeping landscapes, organic textures, earthy tones.",
    mvType: "storytelling",
    creator: "ChasingWaves",
    plays: 1100,
    likes: 1100,
    shares: 96,
    date: "2026-06-04",
    matchedSong: SONG_ETHEREAL,
  },
  {
    id: "mv-late-night-stage",
    title: "Late Night Stage",
    thumb: mv("mv_02_late_night_stage.jpg"),
    video: V_SINGING,
    badge: null,
    meta: "New | 2-3 min",
    prompt: "Late night stage performance — moody lighting, intimate venue, raw energy.",
    mvType: "singing",
    creator: "MysticRhythm",
    plays: 870,
    likes: 231,
    shares: 45,
    date: "2026-06-02",
    matchedSong: SONG_NEON,
  },
  {
    id: "mv-neon-city",
    title: "Neon City",
    thumb: mv("mv_03_neon_city.jpg"),
    video: V_STORY,
    badge: null,
    meta: "Hot | 2-3 min",
    prompt: "Urban neon city vibes — glowing streets, fast cuts, electric atmosphere.",
    mvType: "storytelling",
    creator: "CinematicSoul",
    plays: 98,
    likes: 98,
    shares: 12,
    date: "2026-05-30",
    matchedSong: SONG_NEON,
  },
  {
    id: "mv-anime-style",
    title: "Anime Style",
    thumb: mv("mv_05_anime_style.jpg"),
    video: V_HYBRID,
    badge: null,
    meta: "Fan fav | 1-2 min",
    prompt: "Anime-inspired visual adventure — vibrant colors, dynamic motion, bold style.",
    mvType: "hybrid",
    creator: "EchoingStars",
    plays: 689,
    likes: 38,
    shares: 9,
    date: "2026-05-28",
    matchedSong: SONG_ELYSIAN,
  },
  // Grid extras
  {
    id: "mv-law-rhythm",
    title: "Law Rhythm",
    thumb: mv("mv_04_eletronic.jpg"),
    video: V_SINGING,
    badge: null,
    meta: "Fan fav | 1-2 min",
    prompt: "Electric rhythms and hypnotic beats — pulsing neon, raw energy, bold performance.",
    mvType: "singing",
    creator: "StarryNights",
    plays: 1300,
    likes: 1300,
    shares: 134,
    date: "2026-05-26",
    matchedSong: SONG_NEON,
  },
  {
    id: "mv-adventurous-echoes",
    title: "Adventurous Echoes",
    thumb: mv("mv_06_cinematic_movie.jpg"),
    video: V_STORY,
    badge: null,
    meta: "Trending | 1-2 min",
    prompt: "Wide-open nature landscapes and soaring cinematic shots — earthy tones, golden light.",
    mvType: "storytelling",
    creator: "VividVisions",
    plays: 106,
    likes: 106,
    shares: 18,
    date: "2026-05-24",
    matchedSong: SONG_ETHEREAL,
  },
  {
    id: "mv-dreamy-pastel",
    title: "Dreamy Pastel",
    thumb: mv("mv_11_halo.jpg"),
    video: V_HYBRID,
    badge: "NEW",
    meta: "New | 1-3 min",
    prompt: "Soft pastel dreamscape — floating visuals, delicate palette, surreal atmosphere.",
    mvType: "hybrid",
    creator: "LunarDreamer",
    plays: 68,
    likes: 68,
    shares: 6,
    date: "2026-05-22",
    matchedSong: SONG_ELYSIAN,
  },
  {
    id: "mv-hot-love",
    title: "Hot Love",
    thumb: mv("mv_08_dramatic_scene.jpg"),
    video: V_STORY,
    badge: null,
    meta: "Fan fav | 1-2 min",
    prompt:
      "Passionate story of love and desire — warm tones, cinematic storytelling, emotional depth.",
    mvType: "storytelling",
    creator: "MysticRhythm",
    plays: 870,
    likes: 870,
    shares: 88,
    date: "2026-05-20",
    matchedSong: SONG_GOLDEN,
  },
  {
    id: "mv-urban-fashion",
    title: "Urban Fashion",
    thumb: mv("mv_10_monochrome.jpg"),
    video: V_SINGING,
    badge: "HOT",
    meta: "Hot | 2-3 min",
    prompt: "Street style meets music — bold fashion, urban energy, attitude-filled performance.",
    mvType: "singing",
    creator: "UrbanExplorer",
    plays: 285,
    likes: 285,
    shares: 28,
    date: "2026-05-18",
    matchedSong: SONG_NEON,
  },
  {
    id: "mv-rock-n-roll",
    title: "Rock & Roll",
    thumb: mv("mv_09_urban_performer.jpg"),
    video: V_SINGING,
    badge: null,
    meta: "Fan fav | 1-2 min",
    prompt: "Raw rock energy — guitar-driven visuals, stage presence, electrifying performance.",
    mvType: "singing",
    creator: "MysticWaves",
    plays: 38,
    likes: 38,
    shares: 4,
    date: "2026-05-15",
    matchedSong: SONG_NEON,
  },
];

// ── Trending MVs (home hero carousel + Create MV right-side panel) ──────────
export const TRENDING_MVS: CommunityMv[] = [
  {
    id: "trend-adventurous-echoes",
    title: "Adventurous Echoes",
    thumb: "/assets/videos/sample-mvs/mv_12_Splash.jpg",
    video: V_SINGING,
    badge: null,
    meta: "Adventure · 2-3 min",
    prompt: "Wide-open landscapes and soaring cinematic shots — earthy tones, golden light.",
    mvType: "singing",
    creator: "VividVisions",
    plays: 9800,
    likes: 2100,
    shares: 240,
    date: "2026-06-09",
    matchedSong: SONG_ETHEREAL,
  },
  {
    id: "trend-thrilling-harmonies",
    title: "Thrilling Harmonies",
    thumb: "/assets/videos/sample-mvs/mv_13_Urban%20Fashion.jpg",
    video: V_HYBRID,
    badge: null,
    meta: "Hybrid · 3-4 min",
    prompt: "A hybrid cinematic journey — bold fashion, vivid energy, soaring harmonies.",
    mvType: "hybrid",
    creator: "UrbanExplorer",
    plays: 7400,
    likes: 1600,
    shares: 180,
    date: "2026-06-08",
    matchedSong: SONG_NEON,
  },
  {
    id: "trend-epic-journeys",
    title: "Epic Journeys",
    thumb: "/assets/videos/sample-mvs/mv_14_Vintage%20Car.jpg",
    video: V_STORY,
    badge: null,
    meta: "Storytelling · 3-4 min",
    prompt: "A cinematic road trip — vintage car, golden light, open highway.",
    mvType: "storytelling",
    creator: "CinematicSoul",
    plays: 12300,
    likes: 3050,
    shares: 410,
    date: "2026-06-07",
    matchedSong: SONG_GOLDEN,
  },
];

// ── Community songs (master list: Top Picks + New Songs + Songs-all) ────────
// Designer request, 2026-08-11: every entry was a single 4-line verse, which
// left `.song-result__lyrics-inline`'s 426px panel mostly empty — "doesn't
// look like lyrics". Extended each to verse/chorus/verse/chorus (~16 lines),
// same original mock style/theme as the existing 4 lines, not real lyrics
// from any actual song.
const LYRICS: Record<string, string> = {
  "Down the Memory Lane":
    "Walking down the memory lane\nEvery step brings back the rain\nFaded photographs and old love songs\nReminding me of where I belong\n\nOh, take me back, take me back again\nTo simpler days before the pain\nEvery memory's a melody\nPlaying soft inside of me\n\nSunlit rooms and open doors\nLaughter echoing on wooden floors\nOld cassette tapes on the shelf\nSongs that remind me of myself\n\nOh, take me back, take me back again\nTo simpler days before the pain\nEvery memory's a melody\nPlaying soft inside of me",
  "Midnight Drive":
    "Speeding through the neon lights at night\nCity blurs and everything feels right\nWindows down, the music hits so hard\nLosing myself somewhere in the dark\n\nKeep on driving through the night\nChasing every neon light\nNothing's gonna slow us down\nThis is our favorite part of town\n\nRadio playing something new\nEvery mile brings me closer to you\nStreetlights flashing one by one\nWe're just getting started, we're not done\n\nKeep on driving through the night\nChasing every neon light\nNothing's gonna slow us down\nThis is our favorite part of town",
  "Forest Morning":
    "Waking up to birds and morning dew\nSunlight filtering through the green\nEvery breath feels like something new\nNature painting the most peaceful scene\n\nOh, this forest morning light\nEverything feels warm and right\nBirdsong calling from the trees\nDancing softly in the breeze\n\nDew drops resting on the leaves\nQuiet moments, gentle ease\nEvery step upon the trail\nTells a soft and peaceful tale\n\nOh, this forest morning light\nEverything feels warm and right\nBirdsong calling from the trees\nDancing softly in the breeze",
  "Neon Pulse":
    "Electric pulse running through my veins\nCity lights and synthesizer refrains\nLost inside the rhythm of the night\nNeon signs ignite the city bright\n\nFeel the pulse, feel it rise\nNeon colors fill the skies\nWe are electric, we are free\nLiving loud in symphony\n\nBassline pounding through the crowd\nEvery heartbeat feels so loud\nCity never sleeps tonight\nEverything is burning bright\n\nFeel the pulse, feel it rise\nNeon colors fill the skies\nWe are electric, we are free\nLiving loud in symphony",
  "Golden Hour":
    "Golden light is fading slow\nEverything is warm and soft and low\nThis moment passing like a dream\nNothing is quite as it seems\n\nHold this golden hour tight\nBefore it fades into the night\nEvery color, every ray\nWish that we could make it stay\n\nShadows stretching on the ground\nSoftest colors all around\nTime is slipping through our hands\nStanding here on golden sand\n\nHold this golden hour tight\nBefore it fades into the night\nEvery color, every ray\nWish that we could make it stay",
  "Ocean Dreams":
    "Drifting on the ocean blue\nWaves are singing something true\nSalty air and endless sky\nWatching all the clouds drift by\n\nTake me where the ocean dreams\nNothing's ever what it seems\nFloating on this endless blue\nEvery wave brings me to you\n\nSeagulls calling out today\nSalty breeze along the bay\nSunlight dancing on the tide\nNowhere else I'd rather hide\n\nTake me where the ocean dreams\nNothing's ever what it seems\nFloating on this endless blue\nEvery wave brings me to you",
  "Last September":
    "Last September when we said goodbye\nLeaves were falling underneath the sky\nI still hear your voice in the autumn wind\nWondering if we'll ever meet again\n\nLast September, I still remember\nEvery ember, every tender word\nEven now the feeling lingers\nLike a song I've always heard\n\nPhotographs left in a drawer\nMemories I can't ignore\nEvery season brings it back\nThat September, on repeat, on track\n\nLast September, I still remember\nEvery ember, every tender word\nEven now the feeling lingers\nLike a song I've always heard",
  "City Lights":
    "City lights below, they shine for us\nJazz on the rooftop, life is glorious\nEvery note a story to be told\nEverything in blue and bronze and gold\n\nCity lights, they never fade\nEvery corner, serenade\nLiving in this golden hour\nFeeling every note's power\n\nSaxophones along the street\nEvery rhythm, every beat\nRooftop skyline, drinks in hand\nThis is our favorite band\n\nCity lights, they never fade\nEvery corner, serenade\nLiving in this golden hour\nFeeling every note's power",
  "Winter Song":
    "First snow falling soft and white\nWrapped in warmth on a cold winter night\nFire crackling and your hand in mine\nEverything will turn out fine\n\nOh, let it snow, let it stay\nWrapped up close, we'll be okay\nEvery winter night with you\nFeels like something warm and true\n\nFrosted windows, candlelight\nHolding on through the quiet night\nSteam rising from our cups of tea\nThis is exactly where I want to be\n\nOh, let it snow, let it stay\nWrapped up close, we'll be okay\nEvery winter night with you\nFeels like something warm and true",
  "Pop Anthem":
    "Turn it up, we're living for tonight\nEvery sound and every beat feels right\nRaise your hands up to the sky\nThis is our moment, you and I\n\nThis is our anthem, sing it loud\nHands up high, we own this crowd\nTonight we're living without fear\nThis is the moment, this is here\n\nLights flashing, bass so strong\nEverybody sing along\nNothing's gonna bring us down\nWe're the loudest in this town\n\nThis is our anthem, sing it loud\nHands up high, we own this crowd\nTonight we're living without fear\nThis is the moment, this is here",
  "Chill R&B":
    "Late night, dim lights, just you and me\nSmooth sounds, slow vibes, feeling free\nYour heartbeat matching mine so right\nWe can stay like this all night\n\nStay with me a little while\nLost inside your easy smile\nNothing's rushed, we take it slow\nThis is all we need to know\n\nCity hums outside the glass\nEvery worry starts to pass\nJust your voice and gentle sound\nBest place that I've ever found\n\nStay with me a little while\nLost inside your easy smile\nNothing's rushed, we take it slow\nThis is all we need to know",
  // NOTE — "Whispers of the Past" is DELIBERATELY ABSENT from this map.
  // `h-whispers-past` is the one History sample kept WITHOUT lyrics, so the
  // "this song has no lyrics" state is reachable from a real own-creation row
  // and not only from the community catalogue. See `DESIGNER-TODO` A23: that
  // state currently has no design at all — the whole lyrics area just vanishes.
  // Do not "fix" this by adding an entry; the gap is the point until a design
  // for the empty state exists.
  "Acoustic Folk":
    "Picking up my guitar by the fire\nSinging songs that lift me higher\nSimple words and honest chords\nThis is all I need, no more\n\nEvery chord I strum for you\nSimple, honest, always true\nNothing fancy, nothing grand\nJust this music, just this hand\n\nWooden porch and evening air\nSongs I've carried everywhere\nEvery story that I hold\nTurns to music, turns to gold\n\nEvery chord I strum for you\nSimple, honest, always true\nNothing fancy, nothing grand\nJust this music, just this hand",
};
const lyr = (t: string) => LYRICS[t];

/**
 * Mock lyrics for a song TITLE, or `undefined` when there are none.
 *
 * Exported 2026-08-20 for History. `useOpenCreation` seeded a song result with no
 * `lyrics` at all, so every creation opened from History showed no lyrics panel —
 * which looked like a bug once the invented `FALLBACK_LYRICS` were removed. The
 * data already existed here; it was simply never wired up. Titles that are not in
 * the map (a user's own Simple-mode song) correctly return `undefined`, which is
 * the case `DESIGNER-TODO` A23 still needs an empty state for.
 */
export function lyricsForTitle(title: string): string | undefined {
  return LYRICS[title];
}

export const TOP_PICKS_SONGS: CommunitySong[] = [
  {
    id: "sp-pop-anthem",
    title: "Pop Anthem",
    cover: art(1),
    tags: "Pop · Upbeat",
    genre: "Pop",
    mood: "Uplifting",
    creator: "MelodyMaker123",
    plays: 4200,
    likes: 980,
    shares: 120,
    date: "2026-06-07",
    badge: "NEW",
    lyrics: lyr("Pop Anthem"),
  },
  {
    id: "sp-chill-rnb",
    title: "Chill R&B",
    cover: art(2),
    tags: "R&B · Slow",
    genre: "R&B",
    mood: "Melancholic",
    creator: "SmoothGroove",
    plays: 3100,
    likes: 720,
    shares: 88,
    date: "2026-06-06",
    badge: null,
    lyrics: lyr("Chill R&B"),
  },
  {
    id: "sp-electronic",
    title: "Electronic",
    cover: art(3),
    tags: "Electronic · Fast",
    genre: "Electronic",
    mood: "Energetic",
    creator: "PulseWave",
    plays: 5600,
    likes: 1300,
    shares: 210,
    date: "2026-06-05",
    badge: "HOT",
    lyrics: lyr("Neon Pulse"),
  },
  {
    id: "sp-acoustic-folk",
    title: "Acoustic Folk",
    cover: art(4),
    tags: "Acoustic · Calm",
    genre: "Acoustic",
    mood: "Calm",
    creator: "QuietPines",
    plays: 2400,
    likes: 540,
    shares: 60,
    date: "2026-06-04",
    badge: null,
    lyrics: lyr("Acoustic Folk"),
  },
  // Designer request, 2026-08-11: the row only had 4 cards, not enough to
  // overflow the row and actually demonstrate the horizontal-scroll
  // affordance (prev/next arrows, drag-scroll) at any real viewport width.
  // No more real catalog entries exist for this section, so these reuse the
  // existing album art (already an established pattern in this same file —
  // e.g. art(1)/art(3) each appear 3+ times across TOP_PICKS_SONGS/NEW_SONGS/
  // CREATOR_SONGS) rather than inventing new asset files.
  {
    id: "sp-synth-wave",
    title: "Synth Wave",
    cover: art(6),
    tags: "Synth · Retro",
    genre: "Electronic",
    mood: "Energetic",
    creator: "NightDrive",
    plays: 3800,
    likes: 860,
    shares: 140,
    date: "2026-06-03",
    badge: null,
  },
  {
    id: "sp-indie-vibes",
    title: "Indie Vibes",
    cover: art(7),
    tags: "Indie · Dreamy",
    genre: "Indie",
    mood: "Uplifting",
    creator: "PaperPlanes",
    plays: 2900,
    likes: 610,
    shares: 95,
    date: "2026-06-02",
    badge: null,
  },
  {
    id: "sp-jazz-nights",
    title: "Jazz Nights",
    cover: art(9),
    tags: "Jazz · Smooth",
    genre: "Jazz",
    mood: "Romantic",
    creator: "BlueNoteKid",
    plays: 2100,
    likes: 480,
    shares: 70,
    date: "2026-06-01",
    badge: null,
  },
  {
    id: "sp-chill-beats",
    title: "Chill Beats",
    cover: art(10),
    tags: "Lo-fi · Chill",
    genre: "Lo-fi",
    mood: "Calm",
    creator: "StudyBuddy",
    plays: 4600,
    likes: 990,
    shares: 130,
    date: "2026-05-31",
    badge: "HOT",
  },
  {
    id: "sp-retro-funk",
    title: "Retro Funk",
    cover: art(11),
    tags: "Funk · Groovy",
    genre: "Funk",
    mood: "Energetic",
    creator: "GrooveMachine",
    plays: 1800,
    likes: 390,
    shares: 55,
    date: "2026-05-30",
    badge: null,
  },
  {
    id: "sp-dream-pop",
    title: "Dream Pop",
    cover: art(12),
    tags: "Pop · Dreamy",
    genre: "Pop",
    mood: "Melancholic",
    creator: "CloudNine",
    plays: 2600,
    likes: 570,
    shares: 80,
    date: "2026-05-29",
    badge: null,
  },
  {
    id: "sp-lofi-study",
    title: "Lo-Fi Study",
    cover: art(13),
    tags: "Lo-fi · Focus",
    genre: "Lo-fi",
    mood: "Calm",
    creator: "StudyBuddy",
    plays: 3300,
    likes: 700,
    shares: 90,
    date: "2026-05-28",
    badge: null,
  },
  {
    id: "sp-summer-breeze",
    title: "Summer Breeze",
    cover: art(14),
    tags: "Acoustic · Warm",
    genre: "Acoustic",
    mood: "Uplifting",
    creator: "QuietPines",
    plays: 1950,
    likes: 420,
    shares: 62,
    date: "2026-05-27",
    badge: null,
  },
];

export const NEW_SONGS: CommunitySong[] = [
  {
    id: "ns-memory-lane",
    title: "Down the Memory Lane",
    cover: art(5),
    tags: "Lo-fi · Soothing · Cozy",
    genre: "Lo-fi",
    mood: "Calm",
    creator: "StarryNights",
    plays: 286,
    likes: 107,
    shares: 68,
    date: "2026-06-08",
    badge: "NEW",
    lyrics: lyr("Down the Memory Lane"),
  },
  {
    id: "ns-midnight-drive",
    title: "Midnight Drive",
    cover: art(8),
    tags: "Electronic · Dark",
    genre: "Electronic",
    mood: "Dark",
    creator: "ChasingWaves",
    plays: 108,
    likes: 68,
    shares: 34,
    date: "2026-06-08",
    badge: null,
    lyrics: lyr("Midnight Drive"),
  },
  {
    id: "ns-forest-morning",
    title: "Forest Morning",
    cover: art(1),
    tags: "Acoustic · Folk",
    genre: "Acoustic",
    mood: "Calm",
    creator: "MysticRhythm",
    plays: 68,
    likes: 42,
    shares: 26,
    date: "2026-06-07",
    badge: null,
    lyrics: lyr("Forest Morning"),
  },
  {
    id: "ns-neon-pulse",
    title: "Neon Pulse",
    cover: art(2),
    tags: "Electronic · Energetic",
    genre: "Electronic",
    mood: "Energetic",
    creator: "LyricLover",
    plays: 195,
    likes: 84,
    shares: 41,
    date: "2026-06-07",
    badge: null,
    lyrics: lyr("Neon Pulse"),
  },
  {
    id: "ns-golden-hour",
    title: "Golden Hour",
    cover: art(3),
    tags: "R&B · Warm",
    genre: "R&B",
    mood: "Uplifting",
    creator: "SoundSculptor",
    plays: 143,
    likes: 56,
    shares: 29,
    date: "2026-06-06",
    badge: null,
    lyrics: lyr("Golden Hour"),
  },
  {
    id: "ns-ocean-dreams",
    title: "Ocean Dreams",
    cover: art(4),
    tags: "Ambient · Calm",
    genre: "Acoustic",
    mood: "Calm",
    creator: "TuneTraveler",
    plays: 92,
    likes: 31,
    shares: 17,
    date: "2026-06-06",
    badge: null,
    lyrics: lyr("Ocean Dreams"),
  },
  {
    id: "ns-last-september",
    title: "Last September",
    cover: art(6),
    tags: "Pop · Nostalgic",
    genre: "Pop",
    mood: "Melancholic",
    creator: "BeatExplorer",
    plays: 74,
    likes: 28,
    shares: 12,
    date: "2026-06-05",
    badge: null,
    lyrics: lyr("Last September"),
  },
  {
    id: "ns-city-lights",
    title: "City Lights",
    cover: art(7),
    tags: "Jazz · Cinematic",
    genre: "Jazz",
    mood: "Calm",
    creator: "HarmonicWaves",
    plays: 57,
    likes: 18,
    shares: 6,
    date: "2026-06-05",
    badge: null,
    lyrics: lyr("City Lights"),
  },
  {
    id: "ns-winter-song",
    title: "Winter Song",
    cover: art(9),
    tags: "Acoustic · Cozy",
    genre: "Acoustic",
    mood: "Calm",
    creator: "ChillVibes",
    plays: 103,
    likes: 32,
    shares: 10,
    date: "2026-06-04",
    badge: null,
    lyrics: lyr("Winter Song"),
  },
  {
    id: "ns-random-access",
    title: "Random Access Memories",
    cover: art(10),
    tags: "Dreamy · Synth · Retro",
    genre: "Electronic",
    mood: "Energetic",
    creator: "SunnyDaze",
    plays: 215,
    likes: 94,
    shares: 53,
    date: "2026-06-03",
    badge: null,
    lyrics: lyr("Neon Pulse"),
  },
  {
    id: "ns-whispers-past",
    title: "Whispers of the Past",
    cover: art(5),
    tags: "Lo-fi · Soothing",
    genre: "Lo-fi",
    mood: "Calm",
    creator: "SunnyDaze",
    plays: 1200,
    likes: 265,
    shares: 68,
    date: "2026-06-02",
    badge: null,
    lyrics: lyr("Down the Memory Lane"),
  },
  {
    id: "ns-neon-city-nights",
    title: "Neon City Nights",
    cover: art(3),
    tags: "Electronic · Urban",
    genre: "Electronic",
    mood: "Dark",
    creator: "GrooveMaster",
    plays: 168,
    likes: 16,
    shares: 8,
    date: "2026-06-01",
    badge: null,
    lyrics: lyr("Neon Pulse"),
  },
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
  {
    id: "cp-cinematic-night",
    title: "Cinematic Night",
    thumb: mv("mv_01_cinematic_dark.jpg"),
    video: V_SINGING,
    badge: null,
    meta: "Popular | 2-3 min",
    prompt: "A cinematic dark visual journey — neon lights, dramatic angles, emotive close-ups.",
    mvType: "singing",
    creator: DEFAULT_CREATOR.name,
    plays: 1200,
    likes: 472,
    shares: 82,
    date: "2026-06-06",
    matchedSong: SONG_GOLDEN,
  },
  {
    id: "cp-neon-city-nights",
    title: "Neon City Nights",
    thumb: mv("mv_03_neon_city.jpg"),
    video: V_STORY,
    badge: null,
    meta: "Hot | 2-3 min",
    prompt: "Urban neon city vibes — glowing streets, fast cuts, electric atmosphere.",
    mvType: "storytelling",
    creator: DEFAULT_CREATOR.name,
    plays: 13,
    likes: 0,
    shares: 0,
    date: "2026-06-02",
    matchedSong: SONG_NEON,
  },
  {
    id: "cp-starfall-serenade",
    title: "Starfall Serenade",
    thumb: mv("mv_01_cinematic_dark.jpg"),
    video: V_SINGING,
    badge: null,
    meta: "Trending | 1-2 min",
    prompt: "A dreamy serenade beneath a sky full of falling stars — soft glow, gentle motion.",
    mvType: "singing",
    creator: DEFAULT_CREATOR.name,
    plays: 847,
    likes: 231,
    shares: 45,
    date: "2026-05-30",
    matchedSong: SONG_ELYSIAN,
  },
  {
    id: "cp-electric-dreams",
    title: "Electric Dreams",
    thumb: mv("mv_03_neon_city.jpg"),
    video: V_STORY,
    badge: null,
    meta: "Hot | 2-3 min",
    prompt: "Electric neon dreamscape — vivid colors, pulsing light, futuristic energy.",
    mvType: "storytelling",
    creator: DEFAULT_CREATOR.name,
    plays: 2100,
    likes: 689,
    shares: 134,
    date: "2026-05-25",
    matchedSong: SONG_NEON,
  },
  {
    id: "cp-urban-whispers",
    title: "Urban Whispers",
    thumb: mv("mv_01_cinematic_dark.jpg"),
    video: V_SINGING,
    badge: null,
    meta: "New | 2-3 min",
    prompt: "Quiet urban moments — soft shadows, intimate close-ups, late-night calm.",
    mvType: "singing",
    creator: DEFAULT_CREATOR.name,
    plays: 412,
    likes: 88,
    shares: 19,
    date: "2026-05-20",
    matchedSong: SONG_GOLDEN,
  },
  {
    id: "cp-crystal-horizon",
    title: "Crystal Horizon",
    thumb: mv("mv_03_neon_city.jpg"),
    video: V_HYBRID,
    badge: null,
    meta: "New | 1-2 min",
    prompt: "A crystalline horizon at dawn — prismatic light, expansive vistas, serene awe.",
    mvType: "hybrid",
    creator: DEFAULT_CREATOR.name,
    plays: 5,
    likes: 0,
    shares: 0,
    date: "2026-05-15",
    matchedSong: SONG_ETHEREAL,
  },
];

export const CREATOR_SONGS: CommunitySong[] = [
  {
    id: "cps-golden-hour",
    title: "Golden Hour",
    cover: art(5),
    tags: "R&B · Warm",
    genre: "R&B",
    mood: "Uplifting",
    creator: DEFAULT_CREATOR.name,
    plays: 11300,
    likes: 256,
    shares: 5,
    date: "2026-06-05",
    badge: null,
    lyrics: lyr("Golden Hour"),
  },
  {
    id: "cps-midnight-drive",
    title: "Midnight Drive",
    cover: art(6),
    tags: "Electronic · Dark",
    genre: "Electronic",
    mood: "Dark",
    creator: DEFAULT_CREATOR.name,
    plays: 18,
    likes: 2,
    shares: 1,
    date: "2026-06-01",
    badge: null,
    lyrics: lyr("Midnight Drive"),
  },
  {
    id: "cps-dusk-ballad",
    title: "Dusk Ballad",
    cover: art(8),
    tags: "Acoustic · Mellow",
    genre: "Acoustic",
    mood: "Calm",
    creator: DEFAULT_CREATOR.name,
    plays: 3,
    likes: 0,
    shares: 0,
    date: "2026-05-28",
    badge: null,
  },
  {
    id: "cps-forest-morning",
    title: "Forest Morning",
    cover: art(1),
    tags: "Acoustic · Folk",
    genre: "Acoustic",
    mood: "Calm",
    creator: DEFAULT_CREATOR.name,
    plays: 2,
    likes: 0,
    shares: 0,
    date: "2026-05-27",
    badge: null,
    lyrics: lyr("Forest Morning"),
  },
  {
    id: "cps-velvet-sky",
    title: "Velvet Sky",
    cover: art(2),
    tags: "Pop · Dreamy",
    genre: "Pop",
    mood: "Uplifting",
    creator: DEFAULT_CREATOR.name,
    plays: 634,
    likes: 147,
    shares: 28,
    date: "2026-05-22",
    badge: null,
  },
  {
    id: "cps-neon-pulse",
    title: "Neon Pulse",
    cover: art(3),
    tags: "Electronic · Energetic",
    genre: "Electronic",
    mood: "Energetic",
    creator: DEFAULT_CREATOR.name,
    plays: 1800,
    likes: 392,
    shares: 67,
    date: "2026-05-18",
    badge: null,
    lyrics: lyr("Neon Pulse"),
  },
  {
    id: "cps-dreaming-loud",
    title: "Dreaming Loud",
    cover: art(4),
    tags: "Pop · Upbeat",
    genre: "Pop",
    mood: "Uplifting",
    creator: DEFAULT_CREATOR.name,
    plays: 89,
    likes: 12,
    shares: 3,
    date: "2026-05-14",
    badge: null,
  },
  {
    id: "cps-ocean-drift",
    title: "Ocean Drift",
    cover: art(7),
    tags: "Ambient · Calm",
    genre: "Acoustic",
    mood: "Calm",
    creator: DEFAULT_CREATOR.name,
    plays: 7,
    likes: 1,
    shares: 0,
    date: "2026-05-10",
    badge: null,
    lyrics: lyr("Ocean Dreams"),
  },
];

// ── Official YCM videos (home page hero banner) ─────────────────────────────
//
// Product owner, 2026-09-01: clicking a hero banner video/title should open
// its own MV detail page, same as a Trending MV card (`localePath(locale,
// "/watch?id=" + mv.id)`) — which means `getCommunityMv` needs a real row to
// resolve for each of `HERO_ITEMS`' 8 videos, or the click has nowhere to go.
//
// NOT folded into NEW_MVS/TRENDING_MVS/CREATOR_MVS: those are the user-facing
// catalogs `MvGridSections`/`MvExplore`/`CommunityMvPlayer`'s swipe feed
// (`MV_LIST`) show, and these eight are YCM's own marketing videos, not
// community content — mixing them in would surface hero footage in the
// Explore grids and Trending rail too. Kept out of `MV_LIST` for the same
// reason `CREATOR_MVS` ids already are (see that file's header comment): the
// player's single-video fallback path (`mvIndex < 0`) already exists for
// exactly this "reachable via its own link, no defined swipe neighbour" case.
//
// `creator` carries the "this is official, not user-submitted" fact instead
// of a new field — `CommunityMvSchema` is frozen contract surface C2 (G4-a
// fails on any diff), same reasoning `mvCoverRatio`/`songAudioUrl` below
// already use to keep a presentation-only fact out of the schema.
export const OFFICIAL_CREATOR_NAME = "YouCam Muse";

/** Whether a community MV is one of YCM's own official videos (the hero
 *  banner) rather than user-submitted content — gates the YCM watermark on
 *  `/watch` (product owner, 2026-09-01, Figma "Guideline_YCM"). */
export function isOfficialMv(mv: CommunityMv): boolean {
  return mv.creator === OFFICIAL_CREATOR_NAME;
}

const HERO_PROMPTS: Record<string, string> = {
  "hero-vintage-drive":
    "A vintage convertible cruising an open highway — sun-faded film grain, retro chrome, golden-hour warmth.",
  "hero-splash-zone":
    "Water bursts and neon pool lights — high-energy motion, bright saturated color, summer chaos.",
  "hero-urban-runway":
    "Runway-ready street style through a glowing city grid — bold silhouettes, editorial lighting, urban attitude.",
  "hero-midnight-static":
    "A quiet city after dark — flickering signage, soft static hum, ambient stillness.",
  "hero-pastel-dreams":
    "Soft pastel skies and floating light — dreamy haze, gentle motion, candy-colored calm.",
  "hero-wonderland-echoes":
    "A tumble through a fantastical wonderland — oversized props, curious creatures, storybook color.",
  "hero-jpop-rush": "Bright J-Pop energy — candy visuals, quick cuts, idol-stage sparkle.",
  "hero-paper-wonderland":
    "A handcrafted paper-diorama world — folded textures, soft shadows, whimsical stop-motion charm.",
};
const HERO_DATES = [
  "2026-07-30",
  "2026-07-24",
  "2026-07-18",
  "2026-07-12",
  "2026-07-06",
  "2026-06-30",
  "2026-06-24",
  "2026-06-18",
];
const HERO_MATCHED_SONGS = [SONG_GOLDEN, SONG_NEON, SONG_ETHEREAL, SONG_ELYSIAN];

export const HERO_MVS: CommunityMv[] = HERO_ITEMS.map((item, i) => ({
  id: item.id,
  title: item.title,
  thumb: item.thumbnail,
  video: item.video,
  badge: null,
  meta: item.subtitle,
  prompt: HERO_PROMPTS[item.id] ?? item.subtitle,
  mvType: "storytelling",
  creator: OFFICIAL_CREATOR_NAME,
  plays: 45000 - i * 3400,
  likes: 9600 - i * 720,
  shares: 1250 - i * 95,
  date: HERO_DATES[i] ?? HERO_DATES[HERO_DATES.length - 1],
  matchedSong: HERO_MATCHED_SONGS[i % HERO_MATCHED_SONGS.length],
}));

// ── Lookups ─────────────────────────────────────────────────────────────────
const MV_BY_ID = new Map<string, CommunityMv>(
  [...NEW_MVS, ...TRENDING_MVS, ...CREATOR_MVS, ...HERO_MVS].map((m) => [m.id, m]),
);
const SONG_BY_ID = new Map<string, CommunitySong>(
  [...ALL_COMMUNITY_SONGS, ...CREATOR_SONGS].map((s) => [s.id, s]),
);

export const getCommunityMv = (id: string | null): CommunityMv | undefined =>
  id ? MV_BY_ID.get(id) : undefined;
export const getCommunitySong = (id: string | null): CommunitySong | undefined =>
  id ? SONG_BY_ID.get(id) : undefined;

// ── Cover aspect ratio (presentation only) ──────────────────────────────────
//
// The designer's justified gallery on /explore/mvs lays each row out from each
// video's cover aspect ratio. DP carries that as a `ratio` field on its catalog
// — but DP's values are not real data either: it assigns them
// `RATIOS[index % RATIOS.length]`, i.e. plain alternation, because no per-video
// ratio exists yet upstream.
//
// So this is DERIVED HERE rather than added to `CommunityMvSchema`. That schema
// is contract surface C2, frozen, and G4-a fails on any diff — adding a field
// that no backend will ever send, to describe something the designer is also
// faking, would spend the contract for nothing. It is a layout hint, and it
// lives with the view layer.
//
// Assigned ONCE, keyed by id, over the whole catalog in a fixed order — which is
// DP's own stated reason for doing it in the data file: the same video must get
// the same shape on every screen that shows it, or Home and Explore drift apart.
// Replace this with a real field the moment the API grows one.
const RATIOS = ["3:4", "4:3"] as const;
export type MvCoverRatio = (typeof RATIOS)[number];

const RATIO_BY_ID = new Map<string, MvCoverRatio>(
  [...TRENDING_MVS, ...NEW_MVS, ...CREATOR_MVS].map((m, i) => [m.id, RATIOS[i % RATIOS.length]]),
);
// The hero banner's 8 videos are all real widescreen footage (not alternated
// like the rest of the catalog above, which has no per-video ratio to go on)
// — always the non-portrait bucket, so `/watch` renders them unpillarboxed.
for (const heroMv of HERO_MVS) RATIO_BY_ID.set(heroMv.id, "4:3");

/** Cover aspect ratio for a community MV. Defaults to portrait for ids we don't know. */
export function mvCoverRatio(id: string): MvCoverRatio {
  return RATIO_BY_ID.get(id) ?? "3:4";
}

// ── Song audio URL (presentation only) ──────────────────────────────────────
//
// Slice 3b's player is DP's, and DP's is built around a real `<audio>` element:
// duration, currentTime, seeking and onEnded all come FROM the element rather
// than from a timer. (WA's old player faked it with `setInterval` and a
// hardcoded `DURATION = 125`.) So the screen needs a URL per song.
//
// `CommunitySongSchema` is contract surface C2, frozen, and G4-a fails on any
// diff — it has no `audio` field and no backend is going to start sending one
// because of a demo screen. Same call as `mvCoverRatio` above: DERIVE IT HERE,
// in the presentation layer, and keep the contract at zero diff.
//
// THE KNOWN COST, ACCEPTED (product owner, 2026-08-05): there are exactly two
// mp3s in `public/assets/songs/`, so every song is one of two sounds. That is a
// demo-media limitation (U4), not a flaw in doing it this way — swap this
// function for a real field the moment the API grows one.
//
// Assigned ONCE, keyed by id, over the whole catalog in a fixed order, for the
// same reason the ratio is: the same song must sound the same on every screen.
// Percent-encoded, matching `mock.ts` — both filenames contain spaces, and these
// strings go straight onto `audio.src`.
const AUDIO = [
  "/assets/songs/Party%20Dance.mp3", // 160s
  "/assets/songs/Top%20Flow%20Production%20-%20Party.mp3", // 114s
] as const;

const AUDIO_BY_ID = new Map<string, string>(
  [...TOP_PICKS_SONGS, ...NEW_SONGS, ...CREATOR_SONGS].map((s, i) => [
    s.id,
    AUDIO[i % AUDIO.length],
  ]),
);

/** Playable audio URL for a community song. Unknown ids fall back to the first track. */
export function songAudioUrl(id: string): string {
  return AUDIO_BY_ID.get(id) ?? AUDIO[0];
}

/**
 * A community song, shaped as the `SongResult` that `/song/result` renders.
 *
 * Drop 2 (`2670ed2`) makes a desktop row click on `/explore/songs` navigate to
 * the result-stage player instead of swapping an in-page column, so that screen
 * now has to be able to show a song the user did not create. Seeding the flow
 * with this is the SAME mechanism `/history` rows already use
 * (`useOpenCreation.ts`) — the result screens read flow state, so a non-flow
 * origin writes it before navigating.
 *
 * `durationSec: 0` is honest rather than lazy: the catalog does not carry a
 * duration, and the screen reads the real one off `<audio>`'s metadata anyway.
 * Inventing a number here would put a specific claim on screen that nothing
 * backs — the same call `useOpenCreation` makes for genre/mood on History rows.
 */
export function songResultFromCommunity(song: CommunitySong): SongResult {
  return {
    id: song.id,
    title: song.title,
    cover: song.cover,
    genre: song.genre,
    mood: song.mood,
    durationSec: 0,
    audioUrl: songAudioUrl(song.id),
    instrumental: false,
    lyrics: song.lyrics,
  };
}

export function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.max(0, n));
}
