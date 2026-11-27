"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useDemoFlag } from "@/components/demo/useDemo";
import { useMyCreations } from "@/components/history/useMyCreations";
import { creationHref, useOpenCreation } from "@/components/history/useOpenCreation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RECENT_SHORTS, type AgentFlowId } from "@/lib/agent/content";
import { localePath } from "@/lib/i18n/config";

/**
 * "Recent" — the signed-in user's own recent work, across all three
 * products (home redesign, 2026-11-26). It is the one row on Home that is
 * about the person rather than the catalogue, which is most of what makes a
 * screen read as a home (ElevenLabs' "Recent projects", Fresha's "Recently
 * viewed", Figma's Recents).
 *
 * Drawn with `/shorts`' own Recent row (product owner, 2026-11-26): the same
 * `.shorts-recent*` list items — a small cover, the title, one meta line, in a
 * bordered pill — so the two pages show "my recent work" the same way. Home's
 * row differs only in mixing the three products and in its limit.
 *
 * Order follows `/history`'s own "All" rule: jobs still generating, then this
 * visit's finished work, then AI Shorts runs, then the seeded older rows by
 * date. Capped at 4 — it is a shortcut back in, not a second History page
 * ("See all" goes there).
 *
 * Renders NOTHING when signed out or when there is nothing to continue. A new
 * user's starter row is an open design decision, not something to invent here.
 * `historyEmpty` (the `?demo=1` panel) is applied last, never by mutating data.
 */
type Item =
  | {
      key: string;
      type: "creation";
      kind: "mv" | "song";
      id: string;
      title: string;
      thumb?: string;
      resultUrl?: string;
      sub: string;
      generating?: boolean;
    }
  | { key: string; type: "shorts"; title: string; thumb: string; flow: AgentFlowId; sub: string };

const MAX = 4;
const KIND: Record<"mv" | "song", string> = { mv: "Music Video", song: "Song" };
/** "2026-09-22" → "Sep 22" — the shape `/shorts`' Recent row uses ("Oct 27"). */
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export function ContinueRow() {
  const { loggedIn, requireLogin } = useAuth();
  const { history, removed } = useHistory();
  const demoEmpty = useDemoFlag("historyEmpty");
  const mv = useMyCreations("mv");
  const songs = useMyCreations("song");
  const openCreation = useOpenCreation();
  const router = useRouter();
  const { locale } = useLocale();

  const items = useMemo<Item[]>(() => {
    if (!loggedIn) return [];
    const generating: Item[] = history
      .filter((h) => h.status === "generating" && !removed.has(h.id))
      .map((h) => ({
        key: `g-${h.id}`,
        type: "creation",
        kind: h.kind,
        id: h.id,
        title: h.title,
        sub: `Generating… · ${KIND[h.kind]}`,
        generating: true,
      }));
    const doneIds = new Set(generating.map((g) => (g.type === "creation" ? g.id : "")));
    const done = [...mv, ...songs].filter((c) => !doneIds.has(c.id));
    // `date` is absent on a job from THIS visit ("Just now"): newest first.
    const fresh = done.filter((c) => !c.date);
    const older = done
      .filter((c) => c.date)
      .sort((a, b) => (b.date as string).localeCompare(a.date as string));
    const toItem = (c: (typeof done)[number], sub: string): Item => ({
      key: `c-${c.id}`,
      type: "creation",
      kind: c.kind,
      id: c.id,
      title: c.title,
      thumb: c.thumb,
      resultUrl: c.resultUrl,
      sub,
    });
    const shorts: Item[] = RECENT_SHORTS.map((s) => ({
      key: `s-${s.id}`,
      type: "shorts",
      title: s.title,
      thumb: s.poster,
      flow: s.flow,
      sub: `${s.when} · AI Short`,
    }));
    return [
      ...generating,
      ...fresh.map((c) => toItem(c, `Just now · ${KIND[c.kind]}`)),
      ...shorts,
      ...older.map((c) => toItem(c, `${shortDate(c.date as string)} · ${KIND[c.kind]}`)),
    ].slice(0, MAX);
  }, [loggedIn, history, removed, mv, songs]);

  if (demoEmpty || items.length === 0) return null;

  const thumb = (src?: string) =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="shorts-recent__thumb" src={src} alt="" />
    ) : (
      <span className="shorts-recent__thumb shorts-recent__thumb--empty" aria-hidden="true" />
    );

  return (
    <section className="shorts-recent home-recent" aria-label="Recent">
      <SectionHeader title="Recent" seeAllHref="/history" />
      <div className="shorts-recent__list">
        {items.map((it) => {
          const body = (
            <>
              {thumb(it.type === "creation" && it.generating ? undefined : it.thumb)}
              <span className="shorts-recent__meta">
                <b>{it.title}</b>
                <span>{it.sub}</span>
              </span>
            </>
          );
          if (it.type === "shorts") {
            return (
              <button
                key={it.key}
                type="button"
                className="shorts-recent__item"
                onClick={() =>
                  requireLogin(() => router.push(localePath(locale, `/agent?flow=${it.flow}`)))
                }
              >
                {body}
              </button>
            );
          }
          // A job that has not finished has nothing to open, so it is not a link.
          if (it.generating) {
            return (
              <div key={it.key} className="shorts-recent__item shorts-recent__item--static">
                {body}
              </div>
            );
          }
          return (
            <Link
              key={it.key}
              href={localePath(locale, creationHref({ id: it.id, kind: it.kind }))}
              className="shorts-recent__item"
              onClick={(e) => {
                e.preventDefault();
                openCreation({
                  id: it.id,
                  kind: it.kind,
                  title: it.title,
                  thumb: it.thumb,
                  resultUrl: it.resultUrl,
                });
              }}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
