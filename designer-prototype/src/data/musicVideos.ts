// Real MV content — cover + video pulled from
// src/assets/covers/New Music Videos/mv_<N>_<slug>.{png,mp4} pairs (matching
// basenames). More videos get added there over time; import.meta.glob picks
// up any new pair automatically, no code change needed here.
//
// username/likes/badge/ratio have no real per-video data yet, so those stay
// mock — but they're assigned HERE, once, so every page (Home's New Music
// Videos teaser, the MV Detail "See all" page) shares the exact same values
// per id instead of each page inventing its own and drifting apart.

export type MvRatio = '3:4' | '4:3'

export interface MusicVideo {
  id: string
  title: string
  cover: string
  video: string
  username: string
  likes: number
  badge: string | undefined
  ratio: MvRatio
}

const coverModules = import.meta.glob('../assets/covers/New Music Videos/mv_*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const videoModules = import.meta.glob('../assets/covers/New Music Videos/mv_*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function basenameNoExt(path: string): string {
  const file = path.split('/').pop() ?? ''
  return file.replace(/\.[^.]+$/, '')
}

function indexFromBasename(basename: string): number {
  const match = basename.match(/^mv_(\d+)_/)
  return match ? parseInt(match[1], 10) : 0
}

// "mv_04_eletronic" -> "Electronic" (fixes the one typo'd slug so it isn't
// shown verbatim as a title), "mv_01_cinematic_dark" -> "Cinematic Dark".
function titleFromBasename(basename: string): string {
  const slug = basename.replace(/^mv_\d+_/, '')
  return slug
    .split('_')
    .map((word) => (word.toLowerCase() === 'eletronic' ? 'Electronic' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

const USERNAMES = [
  'StarryNights',
  'ChasingWaves',
  'MysticRhythm',
  'DreamyPastel',
  'ForestMorning',
  'NeonCity',
  'RockNRoll',
  'NatureAndEarth',
  'MidnightDrive',
  'AnimeStyle',
  'UrbanPerformer',
]
const RATIOS: MvRatio[] = ['3:4', '4:3']
const BADGES: (string | undefined)[] = ['HOT', undefined, 'HOT', 'HOT', 'HOT', 'HOT', 'HOT', 'HOT', 'HOT', 'HOT', 'NEW']

const basenames = Array.from(new Set(Object.keys(videoModules).map(basenameNoExt))).sort(
  (a, b) => indexFromBasename(a) - indexFromBasename(b),
)

export const MUSIC_VIDEOS: MusicVideo[] = basenames
  .map((basename, index) => {
    const coverPath = Object.keys(coverModules).find((path) => basenameNoExt(path) === basename)
    const videoPath = Object.keys(videoModules).find((path) => basenameNoExt(path) === basename)
    if (!coverPath || !videoPath) return null
    return {
      id: `mv-${indexFromBasename(basename)}`,
      title: titleFromBasename(basename),
      cover: coverModules[coverPath],
      video: videoModules[videoPath],
      username: USERNAMES[index % USERNAMES.length],
      likes: 38,
      badge: BADGES[index % BADGES.length],
      ratio: RATIOS[index % RATIOS.length],
    }
  })
  .filter((mv): mv is MusicVideo => mv !== null)
