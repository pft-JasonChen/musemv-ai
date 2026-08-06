// Bridges state between AI Music Video's separate pages (Feature Room →
// Storyboard Edit → Result → Edit MV). Navigation between them is a plain
// full-page `<a href>`/`window.location` change (App.tsx routes on
// window.location.pathname, no client-side router), so component state
// can't just carry over — sessionStorage is the simplest way to pass a
// small draft across that reload without a routing/state library.
//
// Anything that only exists as a blob: URL (an uploaded character photo)
// can't survive a full page reload either, so the character image on
// Storyboard/Edit is always one of the fixed sample photos rather than
// trying to persist the user's real upload.

import sample1 from '../assets/covers/Avatar/Sample_P1.png'
import { MUSIC_VIDEOS } from './musicVideos'

export interface MvDraft {
  songTitle: string
  songCover: string
  mvTitle: string
  authorName: string
  mvType: string
  aspect: '9:16' | '16:9'
  quality: 'SD' | 'HD'
  showSubtitle: boolean
  showWatermark: boolean
  characterPhoto: string
  /** Picked once when "Create Music Video" is clicked, so every downstream
   *  page (Storyboard, Result, Edit MV) shows the same "generated" video. */
  resultVideo: { title: string; cover: string; video: string }
}

const STORAGE_KEY = 'ycm-mv-draft'

const DEFAULT_DRAFT: MvDraft = {
  songTitle: 'Down the Memory Lane',
  songCover: MUSIC_VIDEOS[0]?.cover ?? '',
  mvTitle: 'Starlight In Your Eyes',
  authorName: 'Isabella Rose Thompson',
  mvType: 'Singing',
  aspect: '9:16',
  quality: 'SD',
  showSubtitle: true,
  showWatermark: false,
  characterPhoto: sample1,
  resultVideo: {
    title: MUSIC_VIDEOS[0]?.title ?? 'Starlight In Your Eyes',
    cover: MUSIC_VIDEOS[0]?.cover ?? '',
    video: MUSIC_VIDEOS[0]?.video ?? '',
  },
}

export function saveMvDraft(draft: MvDraft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Storage can fail (private mode, quota) — the read side already falls
    // back to DEFAULT_DRAFT, so there's nothing else to do here.
  }
}

export function loadMvDraft(): MvDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_DRAFT, ...JSON.parse(raw) }
  } catch {
    // Fall through to the default below.
  }
  return DEFAULT_DRAFT
}

// Same generated lyrics/story content across Storyboard Edit, Result, and
// Edit MV — matches Figma's mock ("Starlight In Your Eyes") rather than
// trying to derive real scenes from the user's idea text, same convention
// as Song Create's mocked lyrics/result content.
export const MOCK_VISUAL_STYLE =
  'Radiant and joyful, with a dreamy yet devoted expression. Her look is glamorous and sophisticated.'

export const MOCK_STORY =
  'A woman prepares for a night to remember, her reflection catching the glow of a thousand city lights as she steps into a story written in starlight.'

export interface MockScene {
  title: string
  timestamp: string
  text: string
}

export const MOCK_SCENES: MockScene[] = [
  {
    title: 'Scene 1',
    timestamp: '00:00–00:09',
    text: 'In a softly lit, elegant dressing room, the woman stands before a grand mirror. She gently adjusts the strap of her shimmering white gown, her eyes filled with a quiet, dreamy anticipation.',
  },
  {
    title: 'Scene 2',
    timestamp: '00:09–00:12',
    text: 'Close-up on the vocalist as she begins to sing, her expression serene.',
  },
  {
    title: 'Scene 3',
    timestamp: '00:12–00:15',
    text: 'The camera follows her hands as she traces the intricate lace patterns on her dress.',
  },
  {
    title: 'Scene 4',
    timestamp: '00:16–00:23',
    text: 'The camera follows her hands as she traces the intricate lace patterns on her dress.',
  },
]

export interface MockLyricLine {
  time: string
  text: string
}

export const MOCK_LYRICS: MockLyricLine[] = [
  { time: '00:00:00', text: 'In the stillness of midnight, as raindrops dance upon the pavement,' },
  { time: '00:05:00', text: 'a story unfolds, a tale of love and loss.' },
  { time: '00:10:00', text: 'The echoes of the past whisper through the droplets,' },
  { time: '00:15:00', text: 'each one carrying a memory, a moment lost in time.' },
  { time: '00:20:00', text: 'The rain, a gentle symphony, sets the stage for reflection.' },
  { time: '00:26:00', text: 'And in your eyes I see the stars we used to chase,' },
]
