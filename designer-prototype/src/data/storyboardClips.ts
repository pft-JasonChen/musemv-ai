export interface StoryboardClip {
  id: string
  cover: string
  video: string
}

const coverModules = import.meta.glob('../assets/storyboard-clips/clip_*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const videoModules = import.meta.glob('../assets/storyboard-clips/clip_*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function clipNumber(path: string): number {
  const match = path.match(/clip_(\d+)\.[^.]+$/)
  return match ? parseInt(match[1], 10) : 0
}

function assetForNumber(modules: Record<string, string>, number: number): string | undefined {
  const path = Object.keys(modules).find((candidate) => clipNumber(candidate) === number)
  return path ? modules[path] : undefined
}

export const STORYBOARD_COVER = assetForNumber(coverModules, 1) ?? ''

export const STORYBOARD_CLIPS: StoryboardClip[] = Array.from({ length: 10 }, (_, index) => index + 2)
  .map((number) => {
    const cover = assetForNumber(coverModules, number)
    const video = assetForNumber(videoModules, number)
    if (!cover || !video) return null
    return {
      id: `storyboard-clip-${number}`,
      cover,
      video,
    }
  })
  .filter((clip): clip is StoryboardClip => clip !== null)
