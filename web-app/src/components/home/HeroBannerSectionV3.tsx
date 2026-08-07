"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { IconButton } from "@/components/ui/IconButton";
import { HERO_ITEMS } from "./heroItems";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (landing page, the 17th route) ─────
 *
 * Port of DP's `pages/HomePage/HeroBannerSectionV3.tsx`; classes from
 * `src/styles/designer/HeroBannerSectionV3.css`, verbatim. No Tailwind (G3-d).
 *
 * The DESKTOP hero — the product owner's chosen "review-c" treatment. Where
 * `HeroBannerSection` is one big backdrop plus a thumbnail strip, this is a
 * filmstrip where every card carries its own title/subtitle/CTA.
 *
 * ── IT IS A REAL SCROLL CONTAINER, NOT A TRANSFORM CAROUSEL ────────────────
 *
 * CSS scroll-snap does "one gesture = exactly one card"; this file only drives
 * the auto-advance and the infinite-loop illusion (a clone padded onto each
 * end, swapped for its real equivalent by an instant `scrollTo` once scrolling
 * settles). That is why it reads `onScroll` rather than owning a translateX.
 *
 * ── ONLY THE CENTERED CARD PLAYS VIDEO ─────────────────────────────────────
 *
 * DP swaps the active card's poster `<img>` for a `<video>`; the rest stay
 * still images. Kept exactly — eight simultaneous autoplaying mp4s is not a
 * detail to "simplify" on a page whose first paint matters.
 *
 * ── WA ADDS `requireLogin` (AC-EXP-02 / GL-02) ─────────────────────────────
 *
 * DP has no `AuthProvider`, so its CTA assigns `window.location` directly. Here
 * it is `requireLogin` + `router.push(localePath(…))` (R-9).
 */

const GAP = 20;
const AUTO_MS = 4000;
const SETTLE_MS = 150;
const REAL = HERO_ITEMS.length;
// domIndex 0 = clone of the last real card, 1..REAL = real cards,
// REAL+1 = clone of the first real card.
const PADDED_ITEMS = [HERO_ITEMS[REAL - 1], ...HERO_ITEMS, HERO_ITEMS[0]];

export function HeroBannerSectionV3() {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();

  const trackRef = useRef<HTMLDivElement>(null);
  const domIndexRef = useRef(1);
  const stepRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const settleTimeoutRef = useRef<number | undefined>(undefined);
  // Mirrors domIndexRef as real state (a ref alone does not re-render) so the
  // centered card can swap its poster for its video — only ever one at a time.
  const [activeDomIndex, setActiveDomIndex] = useState(1);

  function measureStep() {
    const firstCard = trackRef.current?.firstElementChild;
    return firstCard instanceof HTMLElement ? firstCard.offsetWidth + GAP : 0;
  }

  function scrollToIndex(domIndex: number, animated: boolean) {
    const track = trackRef.current;
    if (!track) return;
    domIndexRef.current = domIndex;
    setActiveDomIndex(domIndex);
    track.scrollTo({ left: domIndex * stepRef.current, behavior: animated ? "smooth" : "instant" });
  }

  function startAuto() {
    window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(
      () => scrollToIndex(domIndexRef.current + 1, true),
      AUTO_MS,
    );
  }

  // Fires for the auto-advance's own smooth scroll AND for any real user
  // wheel/trackpad/drag — debounced so it only runs once scrolling has stopped.
  function handleScroll() {
    window.clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = window.setTimeout(handleSettle, SETTLE_MS);
  }

  function handleSettle() {
    const track = trackRef.current;
    if (!track || !stepRef.current) return;
    const nearest = Math.round(track.scrollLeft / stepRef.current);
    domIndexRef.current = nearest;
    // Landed on a clone — pixel-identical to its real equivalent, so jumping
    // to it with no transition is invisible.
    if (nearest >= REAL + 1) scrollToIndex(1, false);
    else if (nearest <= 0) scrollToIndex(REAL, false);
    // Re-arm fresh after ANY settle, so a manual scroll is not immediately
    // overridden by an auto-advance that was already mid-countdown.
    startAuto();
  }

  useEffect(() => {
    stepRef.current = measureStep();
    scrollToIndex(1, false);
    startAuto();
    function handleResize() {
      stepRef.current = measureStep();
      scrollToIndex(domIndexRef.current, false);
    }
    function handleVisibility() {
      if (document.hidden) window.clearInterval(timerRef.current);
      else startAuto();
    }
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timerRef.current);
      window.clearTimeout(settleTimeoutRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // Mount-only: everything above closes over refs, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createMv() {
    requireLogin(() => router.push(localePath(locale, "/mv/room")));
  }

  return (
    <section className="hero-banner-v3">
      <div className="hero-banner-v3__previous">
        <IconButton
          size="large"
          variant="ghost"
          icon="ic_arrow_left"
          label="Previous"
          onClick={() => scrollToIndex(domIndexRef.current - 1, true)}
        />
      </div>

      <div className="hero-banner-v3__track" ref={trackRef} onScroll={handleScroll}>
        {PADDED_ITEMS.map((item, domIndex) => {
          const isActive = domIndex === activeDomIndex;
          return (
            <div className="hero-banner-v3__card" key={`${domIndex}-${item.title}`}>
              {isActive ? (
                <video
                  className="hero-banner-v3__bg"
                  src={item.video}
                  // `poster` is the ONE attribute added to DP's markup here, and
                  // it is the card's own inactive-state image — so in any browser
                  // that can decode the mp4 it is replaced by the first frame and
                  // changes nothing. It exists because a browser that CANNOT
                  // decode H.264 renders this card as a black rectangle with no
                  // error: Playwright's bundled Chromium is exactly that browser
                  // (`DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, measured 2026-08-07),
                  // which would have committed a black box as this screen's
                  // visual baseline and blinded the gate to the whole hero.
                  poster={item.thumbnail}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img src={item.thumbnail} alt="" className="hero-banner-v3__bg" draggable={false} />
              )}
              <div className="hero-banner-v3__scrim" aria-hidden="true" />
              <div className="hero-banner-v3__bottom">
                <div className="hero-banner-v3__text">
                  <p className="hero-banner-v3__title">{item.title}</p>
                  <p className="hero-banner-v3__subtitle">{item.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="button button--medium button--secondary hero-banner-v3__cta"
                  onClick={createMv}
                >
                  <span className="button__label">Create MV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hero-banner-v3__next">
        <IconButton
          size="large"
          variant="ghost"
          icon="ic_arrow_right"
          label="Next"
          onClick={() => scrollToIndex(domIndexRef.current + 1, true)}
        />
      </div>
    </section>
  );
}
