/**
 * "Play this song in the Home preview bar" — sent by the composer's Song
 * inspiration cards (their ▶, product owner, 2026-11-02), handled by
 * `TopPicksSection`, which owns that bar for the same catalogue
 * (`TOP_PICKS_SONGS`). A message instead of a third `SongPlayBar`: Home
 * already arbitrates two bar owners (`HomeView`), and the inspiration cards
 * ARE Top Picks songs, so playing them there keeps one `<audio>` and one bar.
 *
 * A plain module-level channel, like `demoStore.ts` — demo-time UI wiring,
 * kept out of `AppProviders` (the C4 surface RD codes against).
 */
type Listener = (songId: string) => void;

const listeners = new Set<Listener>();

export function requestSongPreview(songId: string) {
  listeners.forEach((l) => l(songId));
}

/** Subscribe; returns the unsubscribe. */
export function onSongPreviewRequest(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The other direction: which song the bar is PLAYING right now (null when
 * paused or closed), so a Song cover can show ⏸ on its own song. Published
 * by `TopPicksSection`, read with `useSyncExternalStore`.
 */
let playingId: string | null = null;
const playingListeners = new Set<() => void>();

export function publishSongPlaying(id: string | null) {
  if (id === playingId) return;
  playingId = id;
  playingListeners.forEach((l) => l());
}

export function subscribeSongPlaying(listener: () => void) {
  playingListeners.add(listener);
  return () => {
    playingListeners.delete(listener);
  };
}

export const getSongPlaying = () => playingId;
export const getSongPlayingServer = () => null;
