"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { localePath } from "@/lib/i18n/config";
import { DEFAULT_COMPOSE } from "@/lib/mv/types";
import { lyricsForTitle } from "@/lib/mv/community";
import { SAMPLE_AUDIO, SAMPLE_RESULT_VIDEO, mockStoryboard } from "@/lib/mv/mock";

/**
 * ── OPENING A FINISHED CREATION AT ITS OWN RESULT SCREEN ────────────────────
 *
 * Until 2026-08-06 a done MV/song row in `/history` opened `CreationDialog`, a
 * pre-migration Tailwind modal. DP has no such dialog: its History rows are
 * plain links to `/mv-result?from=history` and
 * `/song-create?stage=result&id=…&from=history` — i.e. the same result screens
 * the generation flow ends on. This hook is how WA does that.
 *
 * **Why it needs a hook at all.** `/mv/result` and `/song/result` read the
 * live MV/Song flow, and self-guard back to their flow entry when it is empty
 * (`MvResult.tsx`, `SongResultView.tsx`). A History row is not part of that
 * flow, so the row's data has to be written into it BEFORE navigating —
 * exactly the pattern `HistoryView.seedFlow()` already used for storyboard
 * rows, which is why that function is now folded in here.
 *
 * Three screens need this, not one: `/history`, and the "My Creations" rails on
 * `/mv/room` and `/song/create`. Three copies of the seeding would be three
 * chances for them to drift, and the drift would be invisible — a wrongly
 * seeded flow renders a plausible screen, it does not error.
 *
 * **Flow state is in-memory (see `AGENTS.md`), so a reload still loses it and
 * the guard still fires.** The `?id=` in the URL is therefore not a deep link;
 * it is what makes the row's Share produce the row's own link rather than an
 * empty one, and what makes middle-click / copy-link honest.
 */
export interface OpenableCreation {
  id: string;
  kind: "mv" | "song";
  title: string;
  /** Cover/poster. Absent for a row that never finished. */
  thumb?: string;
  /** The finished artifact, when this entry is a live job that carries one. */
  resultUrl?: string;
}

/**
 * Where a finished creation lives. Shared by the `<a href>` and by the click
 * handler so the two can never disagree — the href is real (middle-click, copy
 * link address, axe) and the handler is what seeds the flow.
 */
export function creationHref(c: Pick<OpenableCreation, "id" | "kind">): string {
  return c.kind === "song" ? `/song/result?id=${c.id}` : `/mv/result?id=${c.id}`;
}

export function useOpenCreation() {
  const router = useRouter();
  const { locale } = useLocale();
  const { setCompose, setStoryboard, saveStoryboard, setResultUrl } = useMvFlow();
  const { setSongResult } = useSongFlow();

  return useCallback(
    (c: OpenableCreation) => {
      if (c.kind === "song") {
        setSongResult({
          id: c.id,
          title: c.title,
          cover: c.thumb ?? "",
          // An earlier song's genre/mood are not carried in History, and
          // inventing them would put a specific claim on screen that nothing
          // backs. `SongResultView` omits the line when they are empty.
          genre: "",
          mood: "",
          durationSec: 0,
          audioUrl: c.resultUrl ?? SAMPLE_AUDIO,
          instrumental: false,
          // Looked up by title from the mock catalogue. This was missing entirely,
          // so every song opened from History rendered without a lyrics panel —
          // invisible while `FALLBACK_LYRICS` papered over it, obvious once that
          // was removed (2026-08-19). A title with no entry stays undefined on
          // purpose: a Simple-mode song genuinely has no lyrics.
          lyrics: lyricsForTitle(c.title),
        });
        router.push(localePath(locale, creationHref(c)));
        return;
      }

      // MV. The storyboard is seeded too because `/mv/result`'s Edit MV needs
      // one to hand to `/mv/edit`; a direct-mode render has none either, and
      // that path already falls back to `mockStoryboard()`.
      const base = mockStoryboard({ description: c.title, title: c.title });
      const sb = c.thumb ? { ...base, coverImage: c.thumb, characterImage: c.thumb } : base;
      setStoryboard(sb);
      saveStoryboard(sb);
      setCompose({
        ...DEFAULT_COMPOSE,
        description: c.title,
        song: c.thumb
          ? { id: `h-${c.id}`, source: "sample", title: c.title, durationSec: 145, art: c.thumb }
          : null,
        settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: c.title } },
      });
      setResultUrl(c.resultUrl ?? SAMPLE_RESULT_VIDEO);
      router.push(localePath(locale, creationHref(c)));
    },
    [router, locale, setCompose, setStoryboard, saveStoryboard, setResultUrl, setSongResult],
  );
}

/**
 * Seed the MV flow from a creation WITHOUT navigating to its result — what
 * `/history`'s "Edit MV" / "Create MV" menu actions and its storyboard rows
 * need. Same seeding as the MV branch above, minus the finished video.
 */
export function useSeedMvFlow() {
  const { setCompose, setStoryboard, saveStoryboard } = useMvFlow();

  return useCallback(
    (c: Pick<OpenableCreation, "id" | "title" | "thumb">) => {
      const base = mockStoryboard({ description: c.title, title: c.title });
      const sb = c.thumb ? { ...base, coverImage: c.thumb, characterImage: c.thumb } : base;
      setStoryboard(sb);
      saveStoryboard(sb);
      setCompose({
        ...DEFAULT_COMPOSE,
        description: c.title,
        song: c.thumb
          ? { id: `h-${c.id}`, source: "sample", title: c.title, durationSec: 145, art: c.thumb }
          : null,
        settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: c.title } },
      });
    },
    [setCompose, setStoryboard, saveStoryboard],
  );
}
