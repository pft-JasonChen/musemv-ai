// Real song content — cover + audio + lyrics pulled from
// src/assets/covers/Top Picks Songs/<Song Title>/{cover.*, song.mp3, title.json}.
// More songs get added there over time; import.meta.glob picks up any new
// folder automatically, no code change needed here.

export interface Song {
  id: string
  title: string
  cover: string
  audio: string
  /** Generated lyrics from title.json, split into lines — not official
   *  lyrics, just per-song placeholder content. One entry per line, section
   *  markers like [chorus] stripped, so the Now Playing panel can highlight
   *  a line at a time as playback progresses. */
  lyricLines: string[]
  /** No real per-song creator identity data exists yet — assigned HERE,
   *  once, same convention as MUSIC_VIDEOS' own USERNAMES pool, so every
   *  page shares the same creator per song instead of each hardcoding its
   *  own placeholder. This is a community "See All Songs" list, not the
   *  user's own songs, so none of these are ever "ScottWu" (the current
   *  user) — see src/data/profile.ts. */
  username: string
}

const USERNAMES = [
  'MelodyMaker123',
  'SonicWave',
  'EchoStudio',
  'RhythmRider',
  'AudioAlchemist',
  'BeatCrafters',
  'HarmonyHive',
  'PulseProducer',
  'VelvetVerse',
  'LoFiLuna',
]

const coverModules = import.meta.glob('../assets/covers/Top Picks Songs/*/cover.{png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const audioModules = import.meta.glob('../assets/covers/Top Picks Songs/*/song.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const titleModules = import.meta.glob('../assets/covers/Top Picks Songs/*/title.json', {
  eager: true,
}) as Record<string, { song_title?: string; lyrics?: string }>

function folderNameFromPath(path: string): string | null {
  const match = path.match(/Top Picks Songs\/([^/]+)\//)
  return match ? match[1] : null
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Strips the [section] markers from the generated lyrics, one line per
// array entry (for the line-at-a-time highlight in Now Playing).
function cleanLyrics(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split('\n')
    .map((line) => line.replace(/\[[^\]]*\]/g, '').trim())
    .filter(Boolean)
}

const folderNames = Array.from(
  new Set(Object.keys(audioModules).map(folderNameFromPath).filter((name): name is string => name !== null)),
).sort()

export const SONGS: Song[] = folderNames
  .map((folder, index) => {
    const coverPath = Object.keys(coverModules).find((path) => path.includes(`/${folder}/cover.`))
    const audioPath = Object.keys(audioModules).find((path) => path.includes(`/${folder}/song.mp3`))
    const titlePath = Object.keys(titleModules).find((path) => path.includes(`/${folder}/title.json`))
    if (!coverPath || !audioPath) return null
    return {
      id: slugify(folder),
      title: folder,
      cover: coverModules[coverPath],
      audio: audioModules[audioPath],
      lyricLines: cleanLyrics(titlePath ? titleModules[titlePath].lyrics : undefined),
      username: USERNAMES[index % USERNAMES.length],
    }
  })
  .filter((song): song is Song => song !== null)
