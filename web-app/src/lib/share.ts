// Share-link model — one URL scheme for every shareable result.
//
// Spec: the recipient page lives at `domain/share?id={hash}` (see the shared
// Share Link Page behaviour spec, path P2-S1). `buildShareUrl` produces that
// link; `resolveShare` maps an id back to its media for the /share page.
//
// PROTOTYPE LIMIT: community items resolve from static fixtures (survive reload
// and cross-tab), but a user's OWN creations live only in the in-memory History
// provider — a fresh tab/reload can't resolve them and the page shows the
// expired state. Production resolves every id server-side (see spec §
// "Prototype Simplifications").

import type { HistoryItem } from "@/components/providers/HistoryProvider";
import { getCommunityMv, getCommunitySong } from "@/lib/mv/community";
import { SAMPLE_AUDIO } from "@/lib/mv/mock";

export interface SharedMedia {
  kind: "mv" | "song";
  title: string;
  /** Poster (MV) or cover art (song). */
  posterUrl: string;
  /** Present for an MV. */
  videoUrl?: string;
  /** Present for a song. */
  audioUrl?: string;
  creator?: string;
}

/** Absolute link a recipient opens. Uses the app's own origin (client-only). */
export function buildShareUrl(id: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share?id=${encodeURIComponent(id)}`;
}

/**
 * Resolve a share id to its media. Community fixtures first (always available),
 * then the user's in-memory History. Returns null → the /share page renders its
 * expired/invalid empty state.
 */
export function resolveShare(id: string | null, history: HistoryItem[]): SharedMedia | null {
  if (!id) return null;

  const cMv = getCommunityMv(id);
  if (cMv) {
    return { kind: "mv", title: cMv.title, posterUrl: cMv.thumb, videoUrl: cMv.video, creator: cMv.creator };
  }
  const cSong = getCommunitySong(id);
  if (cSong) {
    return { kind: "song", title: cSong.title, posterUrl: cSong.cover, audioUrl: SAMPLE_AUDIO, creator: cSong.creator };
  }

  const own = history.find((h) => h.id === id && h.status === "completed");
  if (own) {
    return own.kind === "mv"
      ? { kind: "mv", title: own.title, posterUrl: own.thumb, videoUrl: own.resultUrl }
      : { kind: "song", title: own.title, posterUrl: own.thumb, audioUrl: own.resultUrl };
  }

  return null;
}
