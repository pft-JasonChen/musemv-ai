"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NEW_MVS, mvCoverRatio } from "@/lib/mv/community";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (landing page, the 17th route) ─────
 *
 * Port of DP's `pages/HomePage/NewMVsSection.tsx`; classes from
 * `src/styles/designer/NewMVsSection.css`, verbatim. No Tailwind (G3-d).
 *
 * ── WHICH CATALOG FEEDS IT ─────────────────────────────────────────────────
 *
 * `NEW_MVS`, the whole list — DP feeds this rail its entire `MUSIC_VIDEOS`
 * catalog rather than a slice, precisely so the Next arrow has something left to
 * reveal. WA's pre-migration home sliced to 8; that cap goes with the Tailwind
 * screen it belonged to.
 *
 * DP's decorative `SUBTITLES` array (six rotating "Cinematic | 2-3 min" strings
 * it uses because it has no per-video metadata) is NOT ported: WA's
 * `CommunityMv` carries a real `meta` field of exactly that shape, and the
 * pre-migration home already showed it. Using invented strings in preference to
 * real data would be a regression dressed as fidelity.
 *
 * ── THE ARROWS ARE STATE, NOT DECORATION ───────────────────────────────────
 *
 * Each is rendered only when the row can actually scroll that way, so an arrow
 * never appears as a dead control at either end. That is DP's own behaviour and
 * it is why `updateScrollState` runs on mount, on scroll and on resize.
 *
 * ── LINKS AND ICONS ────────────────────────────────────────────────────────
 *
 * Cards link with `next/link` + `localePath()` (R-9) at WA's own `/watch?id=`,
 * not DP's `/mv-detail?id=&from=` — D3 keeps WA's routes and Q6 rejects `?from=`.
 * `.icon-button__icon` is `background-color` + `mask-*` ⇒ `DpIcon`, which
 * `IconButton` already renders; `Card`'s cover is a real `<img>` (D4).
 */
export function NewMVsSection() {
  const { locale } = useLocale();
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  function updateScrollState() {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollBack(row.scrollLeft > 1);
    setCanScrollForward(row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
  }

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  function scrollByCard(direction: -1 | 1) {
    const row = rowRef.current;
    const firstItem = row?.querySelector<HTMLElement>(".new-mvs__item");
    if (!row || !firstItem) return;
    const gap = Number.parseFloat(window.getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: "smooth" });
  }

  return (
    <section className="new-mvs">
      <SectionHeader
        title="Trending Music Videos"
        mobileTitle="Trending MV"
        seeAllHref="/explore/mvs"
      />

      <div className="new-mvs__row-wrapper">
        <div className="new-mvs__row" ref={rowRef} onScroll={updateScrollState}>
          {NEW_MVS.map((mv) => (
            <Link
              key={mv.id}
              href={localePath(locale, `/watch?id=${mv.id}`)}
              className="new-mvs__item"
            >
              <Card
                type="Video"
                ratio={mvCoverRatio(mv.id)}
                title={mv.title}
                subtitle={mv.meta}
                badge={mv.badge ?? undefined}
                coverImage={mv.thumb}
              />
            </Link>
          ))}
        </div>

        {canScrollBack && (
          <div className="new-mvs__previous">
            <IconButton
              size="large"
              variant="ghost"
              icon="ic_arrow_left"
              label="Previous"
              onClick={() => scrollByCard(-1)}
            />
          </div>
        )}

        {canScrollForward && (
          <div className="new-mvs__next">
            <IconButton
              size="large"
              variant="ghost"
              icon="ic_arrow_right"
              label="Next"
              onClick={() => scrollByCard(1)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
