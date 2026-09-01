"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { IconButton } from "@/components/ui/IconButton";
import { HERO_ITEMS } from "./heroItems";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (landing page, the 17th route) ─────
 *
 * Port of DP's `pages/HomePage/HeroBannerSection.tsx`; classes come from
 * `src/styles/designer/HeroBannerSection.css`, verbatim. No Tailwind (G3-d).
 *
 * ONE FILE, TWO HEROES — and that is DP's structure, not an accident of the
 * port. `.hero-banner` (a rotating backdrop + a thumbnail strip) and
 * `.hero-banner-mobile` (a draggable infinite card carousel) are BOTH rendered,
 * and the stylesheet picks: below 768px `.hero-banner` is `display: none` and
 * `.hero-banner-mobile` becomes `display: block`; above it the reverse.
 * `HomeView` only mounts this file at all below 768px, so in practice
 * `.hero-banner` never paints in WA — it is kept because deleting it would make
 * the next drop a merge instead of a file-level re-sync, which is the one thing
 * D1 exists to avoid.
 *
 * ── WHAT WA ADDS THAT DP DOES NOT HAVE ─────────────────────────────────────
 *
 * `requireLogin` on both Create-MV CTAs (`AC-EXP-02` / GL-02). DP has no
 * `AuthProvider` at all, so its hero just navigates. This is the fifth time a
 * migrated screen has had to notice that DP is missing a gate WA already ships;
 * it is not a DP defect, DP simply has no auth.
 *
 * ── ICON TAGS, DECIDED FROM THE CSS (D4) ───────────────────────────────────
 *
 * The only icons here are the prev/next arrows, which are `IconButton`s —
 * `.icon-button__icon` is `background-color: currentColor` + `mask-*`, so they
 * are masks, and `IconButton` already renders `DpIcon` for them. The thumbnail
 * strip's `.hero-banner__thumb-bg` and the card art are `width`/`height` only
 * with no `mask-*` ⇒ real `<img>`. `/` is in the mask sweep in
 * `e2e/behaviour-regressions.spec.ts`.
 */

const ROTATE_INTERVAL_MS = 3000;
const FADE_MS = 250;

// Fixed marketing headline — deliberately NOT tied to which hero video is
// showing; it cycles between these two lines on its own 5s timer.
const HEADLINES = [
  { lead: "Transform song into ", accent: "Cinematic Video" },
  { lead: "Turn your selfie into ", accent: "Music Video" },
];
const HEADLINE_REAL = HEADLINES.length;
const HEADLINE_INTERVAL_MS = 5000;
const HEADLINE_ANIM_MS = 300;
// One clone padded onto each side lets the track always slide the same
// direction (up), snapping back invisibly once it lands on a clone.
const HEADLINE_PADDED = [HEADLINES[HEADLINE_REAL - 1], ...HEADLINES, HEADLINES[0]];

function headlineRealIndex(domIndex: number) {
  return (((domIndex - 1) % HEADLINE_REAL) + HEADLINE_REAL) % HEADLINE_REAL;
}

function HeroHeadline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const domIndexRef = useRef(1);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // translateY(%) resolves against the track's OWN total height (all four
    // padded items), not one item's height — so the offset is computed in px
    // from an actual item's rendered height instead.
    function goToDom(domIndex: number, animated: boolean) {
      domIndexRef.current = domIndex;
      const track = trackRef.current;
      if (!track) return;
      const itemHeight =
        track.firstElementChild instanceof HTMLElement ? track.firstElementChild.offsetHeight : 0;
      track.style.transition = animated
        ? `transform ${HEADLINE_ANIM_MS}ms cubic-bezier(0.3, 0, 0.1, 1)`
        : "none";
      track.style.transform = `translateY(-${domIndex * itemHeight}px)`;
    }

    function next() {
      goToDom(domIndexRef.current + 1, true);
      window.setTimeout(() => {
        if (domIndexRef.current >= HEADLINE_REAL + 1) goToDom(1, false);
      }, HEADLINE_ANIM_MS + 10);
    }

    goToDom(1, false);
    timerRef.current = window.setInterval(next, HEADLINE_INTERVAL_MS);
    return () => window.clearInterval(timerRef.current);
  }, []);

  return (
    <div className="hero-banner__headline-mask">
      <div className="hero-banner__headline-track" ref={trackRef}>
        {HEADLINE_PADDED.map((headline, domIndex) => (
          <div className="hero-banner__headline" key={`${domIndex}-${headlineRealIndex(domIndex)}`}>
            <p className="hero-banner__headline-line">{headline.lead}</p>
            <p className="hero-banner__headline-line hero-banner__headline-accent">
              {headline.accent}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOBILE_GAP = 8;
const MOBILE_AUTO_MS = 4000;
const MOBILE_ANIM_MS = 380;
const MOBILE_DRAG_THRESHOLD = 60;
/** How far a pointer has to move before a press commits to a drag — see
 *  `handlePointerMove`'s comment for why this can't be 0. */
const MOBILE_DRAG_COMMIT_PX = 8;
const MOBILE_REAL = HERO_ITEMS.length;
// domIndex 0 = clone of the last real card, 1..MOBILE_REAL = real cards,
// MOBILE_REAL+1 = clone of the first real card.
const MOBILE_PADDED_ITEMS = [HERO_ITEMS[MOBILE_REAL - 1], ...HERO_ITEMS, HERO_ITEMS[0]];

function mobileRealIndex(domIndex: number) {
  return (((domIndex - 1) % MOBILE_REAL) + MOBILE_REAL) % MOBILE_REAL;
}

/**
 * The phone hero: an infinite, draggable, auto-advancing carousel. Card width
 * is 85vw (not a fixed px), so every translateX figure is measured from the
 * rendered card on mount and on resize rather than assumed.
 *
 * ── CLICKING THE PHOTO OR THE TITLE OPENS THE MV'S OWN PAGE, 2026-09-01
 *    (product owner) ──────────────────────────────────────────────────────
 *
 * Same `localePath(locale, "/watch?id=" + item.id)` destination
 * `HeroBannerSectionV3`'s desktop cards and `NewMVsSection`'s Trending MV
 * cards both use — see that file's header comment for the full reasoning
 * (`HERO_MVS`, the media-link override, the tag-swap-is-safe note). No video
 * ever plays here (this carousel is photos only, see the file header above),
 * so there is no watermark to add — the product owner's watermark ask was
 * specifically about the PLAYING hero video, which only exists on desktop.
 *
 * The text link is additionally gated the same way the CTA button already
 * is (`tabIndex`/`aria-hidden` on `isActive`) — `.hero-banner-mobile__bottom`
 * is `opacity:0;pointer-events:none` for a flanking card, and an invisible
 * link left focusable/announced would be the exact "opacity 0 is not
 * hidden" defect this codebase has already caught twice elsewhere.
 */
function HeroBannerMobile({
  onCreate,
  locale,
}: {
  onCreate: () => void;
  locale: Locale;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const domIndexRef = useRef(1);
  const dragRef = useRef({ startX: 0, dragging: false });
  const timerRef = useRef<number | undefined>(undefined);
  const stepRef = useRef(0);
  const [activeReal, setActiveReal] = useState(0);

  function measureStep() {
    const firstCard = trackRef.current?.firstElementChild;
    return firstCard instanceof HTMLElement ? firstCard.offsetWidth + MOBILE_GAP : 0;
  }

  function setTrackX(x: number, animated: boolean) {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = animated
      ? `transform ${MOBILE_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
      : "none";
    track.style.transform = `translateX(${x}px)`;
  }

  function goToDom(domIndex: number, animated: boolean) {
    domIndexRef.current = domIndex;
    setTrackX(-domIndex * stepRef.current, animated);
    setActiveReal(mobileRealIndex(domIndex));
  }

  // After animating onto a clone, silently snap to its real equivalent — the
  // clone is pixel-identical, so the jump is invisible.
  function settleAfterSnap() {
    if (domIndexRef.current >= MOBILE_REAL + 1) goToDom(1, false);
    else if (domIndexRef.current <= 0) goToDom(MOBILE_REAL, false);
  }

  function next() {
    goToDom(domIndexRef.current + 1, true);
    window.setTimeout(settleAfterSnap, MOBILE_ANIM_MS + 10);
  }

  function startAuto() {
    window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(next, MOBILE_AUTO_MS);
  }

  useEffect(() => {
    stepRef.current = measureStep();
    // Pin the track to the first REAL card (domIndex 1, past the leading clone)
    // without going through goToDom: its `setActiveReal(0)` would be a no-op
    // set — `activeReal` already starts at 0 — but a setState inside a mount
    // effect is a cascading render either way, and the lint rule is right to
    // say so. The DOM write is the only part this needs.
    domIndexRef.current = 1;
    setTrackX(-stepRef.current, false);
    startAuto();
    function handleVisibility() {
      if (document.hidden) window.clearInterval(timerRef.current);
      else startAuto();
    }
    // 85vw changes with the viewport, so remeasure and re-pin without a
    // transition on resize/rotate.
    function handleResize() {
      stepRef.current = measureStep();
      setTrackX(-domIndexRef.current * stepRef.current, false);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize);
    return () => {
      window.clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
    };
    // Mount-only: goToDom/startAuto close over refs, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePointerDown(event: ReactPointerEvent) {
    dragRef.current = { startX: event.clientX, dragging: false };
    window.clearInterval(timerRef.current);
  }

  function handlePointerMove(event: ReactPointerEvent) {
    const dx = event.clientX - dragRef.current.startX;
    if (!dragRef.current.dragging) {
      // Found while wiring this carousel's new click-through links,
      // 2026-09-01: capturing on pointerDOWN (the previous behaviour) means
      // even a plain tap — zero movement — commits to a captured pointer,
      // and a captured pointer also retargets the CLICK that follows its
      // pointerup to the capturing element (this track), not to whatever
      // was actually under the finger. Every card's link/button tap was
      // silently swallowed by it. Only capturing once real movement crosses
      // a small threshold means a plain tap never captures at all, so its
      // click reaches the tapped link/button completely normally.
      if (Math.abs(dx) < MOBILE_DRAG_COMMIT_PX) return;
      dragRef.current.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setTrackX(-domIndexRef.current * stepRef.current + dx, false);
  }

  function handlePointerUp(event: ReactPointerEvent) {
    if (!dragRef.current.dragging) {
      // Never crossed the drag threshold above — a plain tap. No pointer
      // capture was ever taken, so there's nothing to settle; just resume
      // auto-rotating (paused on pointerdown) and let the tap's own click
      // reach its target on its own.
      startAuto();
      return;
    }
    dragRef.current.dragging = false;
    const dx = event.clientX - dragRef.current.startX;
    if (dx < -MOBILE_DRAG_THRESHOLD) {
      next();
    } else if (dx > MOBILE_DRAG_THRESHOLD) {
      goToDom(domIndexRef.current - 1, true);
      window.setTimeout(settleAfterSnap, MOBILE_ANIM_MS + 10);
    } else {
      goToDom(domIndexRef.current, true);
    }
    startAuto();
  }

  return (
    <div className="hero-banner-mobile">
      <div
        className="hero-banner-mobile__track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {MOBILE_PADDED_ITEMS.map((item, domIndex) => {
          const isActive = mobileRealIndex(domIndex) === activeReal;
          const detailHref = localePath(locale, `/watch?id=${item.id}`);
          return (
            <div className="hero-banner-mobile__card" key={`${domIndex}-${item.title}`}>
              <Link href={detailHref} className="hero-banner-mobile__media-link" aria-label={item.title}>
                <img
                  src={item.thumbnail}
                  alt=""
                  className="hero-banner-mobile__bg"
                  draggable={false}
                />
                <div className="hero-banner-mobile__scrim" aria-hidden="true" />
              </Link>
              <div
                className={`hero-banner-mobile__bottom${isActive ? " hero-banner-mobile__bottom--active" : ""}`}
              >
                <Link
                  href={detailHref}
                  className="hero-banner-mobile__text"
                  tabIndex={isActive ? 0 : -1}
                  aria-hidden={!isActive}
                >
                  <p className="hero-banner-mobile__title">{item.title}</p>
                  <p className="hero-banner-mobile__subtitle">{item.subtitle}</p>
                </Link>
                <button
                  type="button"
                  className="button button--small button--secondary hero-banner-mobile__cta"
                  onClick={onCreate}
                  // The flanking cards are opacity 0 / pointer-events none, but
                  // opacity 0 is NOT hidden — an inactive card's CTA would stay
                  // in the tab order and be announced. Same rule 3b learned on
                  // `/song/play`'s two lyrics overlays.
                  tabIndex={isActive ? 0 : -1}
                  aria-hidden={!isActive}
                >
                  <span className="button__label">Create MV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HeroBannerSection() {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();

  // `activeIndex` moves the thumbnail highlight immediately; `displayedIndex`
  // (what actually renders) waits for the fade-out, so the banner crossfades.
  const [activeIndex, setActiveIndex] = useState(1);
  const [displayedIndex, setDisplayedIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef<number | undefined>(undefined);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // setInterval's closure would otherwise see a stale activeIndex.
  const activeIndexRef = useRef(activeIndex);

  function createMv() {
    requireLogin(() => router.push(localePath(locale, "/mv/room")));
  }

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  function goTo(index: number) {
    if (index === activeIndexRef.current) return;
    setActiveIndex(index);
    setIsFading(true);
    window.clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = window.setTimeout(() => {
      setDisplayedIndex(index);
      setIsFading(false);
    }, FADE_MS);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((activeIndexRef.current + 1) % HERO_ITEMS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
    // Mount-only: goTo closes over refs and setters, not state.
  }, []);

  useEffect(() => () => window.clearTimeout(fadeTimeoutRef.current), []);

  // Keep the active thumbnail visible without scrollIntoView(), which can also
  // move the page vertically when the user is reading below the hero.
  useEffect(() => {
    const row = thumbnailsRef.current;
    const thumb = thumbRefs.current[activeIndex];
    if (!row || !thumb) return;

    const visibleLeft = row.scrollLeft;
    const visibleRight = visibleLeft + row.clientWidth;
    const thumbLeft = thumb.offsetLeft;
    const thumbRight = thumbLeft + thumb.offsetWidth;

    if (activeIndex === 0) {
      row.scrollTo({ left: 0, behavior: "smooth" });
    } else if (activeIndex === HERO_ITEMS.length - 1) {
      row.scrollTo({ left: row.scrollWidth - row.clientWidth, behavior: "smooth" });
    } else if (thumbLeft < visibleLeft) {
      row.scrollTo({ left: thumbLeft, behavior: "smooth" });
    } else if (thumbRight > visibleRight) {
      row.scrollTo({ left: thumbRight - row.clientWidth, behavior: "smooth" });
    }
  }, [activeIndex]);

  const displayed = HERO_ITEMS[displayedIndex];

  return (
    <>
      <section className="hero-banner">
        <video
          key={displayed.video}
          className={`hero-banner__bg${isFading ? " hero-banner__bg--fading" : ""}`}
          src={displayed.video}
          // Same one-attribute addition as HeroBannerSectionV3 — the item's own
          // poster, so a browser without an H.264 decoder shows the design
          // instead of a black rectangle. See that file for the measurement.
          poster={displayed.thumbnail}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="hero-banner__scrim" aria-hidden="true" />

        <div className="hero-banner__top">
          <div
            className={`hero-banner__title-group${isFading ? " hero-banner__title-group--fading" : ""}`}
          >
            <p className="hero-banner__title">{displayed.title}</p>
            <p className="hero-banner__subtitle">{displayed.subtitle}</p>
          </div>

          <div className="hero-banner__text-cta">
            <HeroHeadline />

            <div className="hero-banner__action-row">
              <button
                type="button"
                className="button button--large button--secondary"
                onClick={createMv}
              >
                <span className="button__label">Create Music Video</span>
              </button>
              <div className="hero-banner__arrows">
                <IconButton
                  size="medium"
                  variant="tertiary"
                  icon="ic_chevron-left"
                  label="Previous"
                  onClick={() => goTo((activeIndex - 1 + HERO_ITEMS.length) % HERO_ITEMS.length)}
                />
                <IconButton
                  size="medium"
                  variant="tertiary"
                  icon="ic_chevron-right"
                  label="Next"
                  onClick={() => goTo((activeIndex + 1) % HERO_ITEMS.length)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="hero-banner__thumbnails" ref={thumbnailsRef}>
          {HERO_ITEMS.map((item, index) => (
            <button
              key={item.title}
              ref={(el) => {
                thumbRefs.current[index] = el;
              }}
              type="button"
              className={`hero-banner__thumb${index === activeIndex ? " hero-banner__thumb--active" : ""}`}
              onClick={() => goTo(index)}
            >
              <img src={item.thumbnail} alt="" className="hero-banner__thumb-bg" />
              <span className="hero-banner__thumb-scrim" aria-hidden="true" />
              <p className="hero-banner__thumb-title">{item.title}</p>
            </button>
          ))}
        </div>
      </section>

      <HeroBannerMobile onCreate={createMv} locale={locale} />
    </>
  );
}
