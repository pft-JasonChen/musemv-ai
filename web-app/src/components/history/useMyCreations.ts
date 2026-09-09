"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { HISTORY_SAMPLES } from "@/lib/mv/mock";
import { MOCK_USER } from "@/lib/user";
import type { OpenableCreation } from "@/components/history/useOpenCreation";

/**
 * ── THE "MY CREATIONS" RAIL'S DATA (YMW260902P0013, 2026-09-09) ─────────────
 *
 * `/mv/room` and `/song/create` each show a side rail that is either the
 * signed-in user's own finished creations or a Trending fallback. Both read it
 * from here.
 *
 * **What the bug actually was.** The two screens were already running the same
 * condition — `loggedIn && myThings.length > 0` — over the same source, the
 * session-local `HistoryProvider`. That provider starts EMPTY, so a signed-in
 * user saw "My Creations" on whichever screen they had just generated
 * something on and "Trending" on the other. It read as the two pages
 * disagreeing; the code was identical and the DATA was lopsided.
 *
 * **The fix is to give both rails the source `/history` has always had.**
 * `/history` shows live jobs merged with `HISTORY_SAMPLES` — a seeded set of
 * finished creations, which is why that screen is never empty for a signed-in
 * user. The rails ignored the seed entirely. Merging it in the same order
 * (live first, newest work at the top) makes "signed in ⇒ my creations" true
 * on both screens at once, which is what was asked for.
 *
 * **Why the `length > 0` guard survives.** It is still load-bearing for a
 * signed-OUT visitor (no creations, so Trending) and it is the documented
 * revert of a 2026-08-07 attempt at DP's literal `isSignedIn`: a "My
 * Creations" heading over an empty card read as broken, not as empty. With the
 * seed in place the signed-in branch is simply no longer empty by default.
 *
 * ── WHAT COUNTS, AND WHAT DOESN'T ──────────────────────────────────────────
 * `status: "done"` only — a rail row navigates straight to a result screen, so
 * a processing or failed row has nothing to open. And `source: "community"` is
 * excluded: `h-whispers-past` is a community song that appears in History, not
 * something the user made, and a rail literally titled "My Creations" must not
 * claim it. `kind: "storyboard"` drops out on its own (neither rail asks for
 * it, and `creationHref` only maps mv/song).
 *
 * NOT shared with `HistoryView`'s own row builder, deliberately: that screen
 * shows everything — processing, failed, community, storyboards — so there is
 * no common filter to extract, only a common SOURCE, which is
 * `HISTORY_SAMPLES` itself.
 */
export interface MyCreation extends OpenableCreation {
  /** Rail rows show a community-style stat line. */
  plays: number;
  likes: number;
  shares: number;
  /** Attribution for the row's avatar — always the signed-in user here. */
  username: string;
}

export function useMyCreations(kind: "mv" | "song"): MyCreation[] {
  const { loggedIn } = useAuth();
  const { history } = useHistory();

  return useMemo(() => {
    if (!loggedIn) return [];

    const live: MyCreation[] = history
      .filter((h) => h.kind === kind && h.status === "completed")
      .map((h) => ({
        id: h.id,
        kind: h.kind,
        title: h.title,
        thumb: h.thumb,
        resultUrl: h.resultUrl,
        // Genuinely 0 for a just-created, unpublished creation —
        // `HistoryItem` carries no stats. Not a fabricated stand-in.
        plays: 0,
        likes: 0,
        shares: 0,
        username: MOCK_USER.name,
      }));

    const seeded: MyCreation[] = HISTORY_SAMPLES.filter(
      (s) => s.kind === kind && s.status === "done" && s.source !== "community",
    ).map((s) => ({
      id: s.id,
      kind,
      title: s.title,
      thumb: s.thumb,
      resultUrl: s.resultUrl,
      plays: s.plays,
      likes: s.likes,
      shares: s.shares,
      username: MOCK_USER.name,
    }));

    return [...live, ...seeded];
  }, [loggedIn, history, kind]);
}
