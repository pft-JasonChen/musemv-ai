"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { IconButton } from "@/components/ui/IconButton";
import { HoverCta } from "@/components/ui/HoverCta";
import { HERO_ITEMS, type HeroItem } from "./heroItems";

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
 *
 * ── CLICKING THE VIDEO OR THE TITLE OPENS THE MV'S OWN PAGE, 2026-09-01
 *    (product owner) ──────────────────────────────────────────────────────
 *
 * Same destination and mechanism `NewMVsSection`'s Trending MV cards already
 * use — `localePath(locale, "/watch?id=" + item.id)` — wired here as two
 * separate `Link`s rather than one wrapping the whole card, because the CTA
 * button and the mute toggle are their own clickable controls and nesting an
 * `<a>` inside another is invalid HTML. `.hero-banner-v3__media-link` is new
 * UI with no DP-native class (same reasoning the mute button below already
 * uses for its own inline position), given `position:absolute;inset:0` in
 * `designer-overrides.css` so its box actually covers the card instead of
 * collapsing to 0×0 around its two absolutely-positioned children (`__bg` +
 * `__scrim`). `.hero-banner-v3__text` needs no such override — swapping its
 * tag from `div` to `next/link`'s anchor while keeping the same class
 * changes nothing (R-9's caution about DP's own raw, unprefixed anchors
 * does not apply here — this already goes through `next/link` +
 * `localePath()`).
 *
 * Each hero video also gets its own official `CommunityMv` row
 * (`community.ts`'s `HERO_MVS`) so `/watch?id=` has something to resolve —
 * see that file's header comment for why they're not folded into the
 * regular catalogs.
 *
 * ── NO WATERMARK HERE (product owner, 2026-09-01) ──────────────────────────
 *
 * The YCM watermark (Figma "Guideline_YCM") was tried on this card's active
 * video and explicitly pulled back to the home page — it only shows once a
 * video is opened on its own `/watch` page (`CommunityMvPlayer.tsx`, gated
 * on `isOfficialMv(mv)`). Don't re-add it here without asking again.
 */

const GAP = 20;
const AUTO_MS = 4000;
const SETTLE_MS = 150;

/** A card in the strip. `video` is optional so a still-only catalog (the
 *  composer's Song inspiration row) can reuse the same strip. */
export type HeroCard = Omit<HeroItem, "video"> & { video?: string };

export function HeroBannerSectionV3({
  items = HERO_ITEMS,
  hrefFor = (item) => `/watch?id=${item.id}`,
  compact = false,
  square = false,
  autoAdvance = !compact,
  ctaLabel = "Create MV",
  onCta,
}: {
  /** Defaults to DP's hero catalog. Read once — the loop maths below close
   *  over it from the mount effect, so a caller must not swap it in place. */
  items?: HeroCard[];
  /** Where the card's media and title link to. */
  hrefFor?: (item: HeroCard) => string;
  /** feature/video-agent-home: the smaller "inspiration" treatment under the
   *  Agent composer's Music Video tab (see `agent.css`). */
  compact?: boolean;
  /** Compact only: 1:1 cards with the CTA under the title (Song covers). */
  square?: boolean;
  /** Advance every AUTO_MS. On for the home hero; off for the compact
   *  inspiration strip (2026-10-29): it is browsed and picked from, and a row
   *  that moves on its own drags cards out from under the hover-only "Use". */
  autoAdvance?: boolean;
  ctaLabel?: string;
  /** Replaces the default "go to /mv/room" with a caller action — the
   *  composer uses it to load the card's style into the prompt instead. */
  onCta?: (item: HeroCard) => void;
} = {}) {
  const REAL = items.length;
  // K clones on each side: domIndex 0..K-1 = clones of the last K real cards,
  // K..K+REAL-1 = real cards, then clones of the first K. DP uses K = 1; the
  // square Song strip shows ~6 narrow cards, so the centred card needs more
  // neighbours on its left than one clone, or the strip starts half empty.
  const K = square ? 4 : 1;
  const PADDED_ITEMS = [...items.slice(-K), ...items, ...items.slice(0, K)];
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();

  const trackRef = useRef<HTMLDivElement>(null);
  const domIndexRef = useRef(K);
  const stepRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const settleTimeoutRef = useRef<number | undefined>(undefined);
  // Mirrors domIndexRef as real state (a ref alone does not re-render) so the
  // centered card can swap its poster for its video — only ever one at a time.
  const [activeDomIndex, setActiveDomIndex] = useState(K);
  // Starts muted (required for autoplay to be allowed at all); the button
  // below unmutes on a real user gesture, so browsers permit it. Shared
  // across cards on purpose — only one card is ever mounted with a
  // `<video>` at a time, so this is "the hero's sound", not per-card state.
  // Plain toggle only (product owner, 2026-09-16): no volume-slider popup
  // here, unlike every playing/result screen — this control is mute/unmute
  // only, so `muted` alone (still the declarative `<video muted>` prop, no
  // ref needed) is the whole story.
  const [muted, setMuted] = useState(true);

  function media(item: HeroCard, isActive: boolean) {
    return (
      <>
        {isActive && item.video ? (
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
            muted={muted}
            playsInline
          />
        ) : (
          <img src={item.thumbnail} alt="" className="hero-banner-v3__bg" draggable={false} />
        )}
        {/* A span, not DP's div: inside the button variant it must be
            phrasing content. Absolutely positioned, so it renders the same. */}
        <span className="hero-banner-v3__scrim" aria-hidden="true" />
      </>
    );
  }

  function measureStep() {
    const firstCard = trackRef.current?.firstElementChild;
    // The track's real gap, not the constant: the compact variants tighten it.
    const gap = trackRef.current ? parseFloat(getComputedStyle(trackRef.current).columnGap) : NaN;
    return firstCard instanceof HTMLElement
      ? firstCard.offsetWidth + (Number.isFinite(gap) ? gap : GAP)
      : 0;
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
    if (!autoAdvance) return;
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
    // A manual scroll must move the "playing" card too — without the
    // auto-advance there is no later scrollToIndex() to do it.
    setActiveDomIndex(nearest);
    // Landed on a clone — pixel-identical to its real equivalent, so jumping
    // to it with no transition is invisible.
    if (nearest >= REAL + K) scrollToIndex(nearest - REAL, false);
    else if (nearest < K) scrollToIndex(nearest + REAL, false);
    // Re-arm fresh after ANY settle, so a manual scroll is not immediately
    // overridden by an auto-advance that was already mid-countdown.
    startAuto();
  }

  useEffect(() => {
    stepRef.current = measureStep();
    scrollToIndex(K, false);
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
    <section
      className={`hero-banner-v3${compact ? " hero-banner-v3--compact" : ""}${square ? " hero-banner-v3--square" : ""}`}
    >
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
          const detailHref = localePath(locale, hrefFor(item));
          return (
            <div className="hero-banner-v3__card" key={`${domIndex}-${item.title}`}>
              {/* With `onCta` (the composer's inspiration strip) the WHOLE card
                  applies the style, same as its CTA (product owner, 2026-10-29),
                  so the media is a button rather than a link to /watch. The
                  title row lets clicks fall through to it (agent.css). */}
              {onCta ? (
                <button
                  type="button"
                  className="hero-banner-v3__media-link"
                  aria-label={item.title}
                  onClick={() => onCta(item)}
                >
                  {media(item, isActive)}
                </button>
              ) : (
                <Link
                  href={detailHref}
                  className="hero-banner-v3__media-link"
                  aria-label={item.title}
                >
                  {media(item, isActive)}
                </Link>
              )}
              {isActive && item.video && (
                // Figma node 1875:34094 (2311:63472) — glass circular button,
                // top-right of the card. No DP-native class for this control
                // exists (it's new UI, not a ported one), so position is set
                // inline rather than adding a rule to a verbatim-copied
                // stylesheet; the button itself is the shared `IconButton` in
                // its existing "small/tertiary" preset, which already matches
                // the Figma spec pixel-for-pixel (28px, 16px icon, white-15
                // glass). Plain mute/unmute toggle only (product owner,
                // 2026-09-16) — no volume-slider popup here.
                <div
                  className="hero-banner-v3__volume"
                  style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}
                >
                  <IconButton
                    size="small"
                    variant="tertiary"
                    icon={muted ? "ic_speaker_off" : "ic_speaker_on"}
                    label={muted ? "Unmute" : "Mute"}
                    onClick={() => setMuted(!muted)}
                  />
                </div>
              )}
              <div className="hero-banner-v3__bottom">
                {onCta ? (
                  <div className="hero-banner-v3__text">
                    <p className="hero-banner-v3__title">{item.title}</p>
                    <p className="hero-banner-v3__subtitle">{item.subtitle}</p>
                  </div>
                ) : (
                  <Link href={detailHref} className="hero-banner-v3__text">
                    <p className="hero-banner-v3__title">{item.title}</p>
                    <p className="hero-banner-v3__subtitle">{item.subtitle}</p>
                  </Link>
                )}
                {onCta ? (
                  // Home's inspiration strip: the shared centred hover CTA,
                  // the same component as the skill cards' "Use Skill".
                  <HoverCta label={ctaLabel} onClick={() => onCta(item)} />
                ) : (
                  <button
                    type="button"
                    className="button button--medium button--secondary hero-banner-v3__cta"
                    onClick={createMv}
                  >
                    <span className="button__label">{ctaLabel}</span>
                  </button>
                )}
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
