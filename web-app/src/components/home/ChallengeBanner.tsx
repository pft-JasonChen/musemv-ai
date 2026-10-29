"use client";
/* eslint-disable @next/next/no-img-element */

import { DpIcon } from "@/components/ui/DpIcon";
import { useMediaQuery } from "@/lib/ssr";

/**
 * AI Music Video Challenge banner (Figma "AI MV Contest" 5489:188328,
 * 2026-10-29). The artwork is only the background; title, subtitle and CTA are
 * live text so they can change without new artwork.
 *
 * Two treatments, picked by `HomeView`'s existing phone branch:
 * · desktop — 728×90 under the hero (5447:90699): centred copy, a "Get Started"
 *   pill on the right, balanced by an invisible copy on the left;
 * · `compact` — phones, between Trending MV and Top Picks Songs (5398:82850).
 *   The phone layout runs up to 767px, so this slot steps through three
 *   treatments as it widens (product owner, 2026-10-29):
 *     < 480px    left-aligned copy, round arrow CTA, phone art (Figma's own);
 *     480–639px  left-aligned copy, "Get Started" pill, phone art — the
 *                centred desktop copy would wrap to two lines here;
 *     ≥ 640px    the desktop treatment (centred copy, pill, leaderboard art).
 *
 * The whole banner is one click target. The challenge page belongs to another
 * team, so it intentionally does nothing in the prototype (product owner,
 * 2026-10-29).
 */
const TITLE = "Join the AI Music Video Challenge";
const SUBTITLE = "$4,400 in Prizes! Ends Dec 20";
const WIDE_ART = "/assets/images/banner/img_leaderboard_contest3.jpg";
const PHONE_ART = "/assets/images/banner/img_banner_contest2.jpg";
const ROOMY_QUERY = "(min-width: 480px)";
const WIDE_QUERY = "(min-width: 640px)";

export function ChallengeBanner({ compact = false }: { compact?: boolean }) {
  // SSR-safe: both are false on the first frame, so a 480–767px screen paints
  // the narrowest treatment for one frame before settling — same trade-off as
  // HomeView's own PHONE_QUERY branch (see `lib/ssr.ts`).
  const roomy = useMediaQuery(ROOMY_QUERY);
  const wide = useMediaQuery(WIDE_QUERY);
  const mid = compact && roomy && !wide;
  // The WHOLE banner is the click target (2026-10-29), so it is one button
  // and the "Get Started" pill / arrow inside it are drawn, not nested
  // buttons. Its children are spans because a button may only hold phrasing
  // content. No destination yet: the challenge page is another team's.
  if (compact && !roomy) {
    return (
      <button type="button" className="challenge-banner challenge-banner--compact">
        <img className="challenge-banner__bg" src={PHONE_ART} alt="" />
        <span className="challenge-banner__text">
          <span className="challenge-banner__title">{TITLE}</span>
          <span className="challenge-banner__subtitle">{SUBTITLE}</span>
        </span>
        <span className="challenge-banner__arrow" aria-hidden="true">
          <DpIcon name="ic_arrow_right" className="challenge-banner__arrow-icon" />
        </span>
      </button>
    );
  }

  return (
    <button type="button" className={`challenge-banner${mid ? " challenge-banner--mid" : ""}`}>
      <img className="challenge-banner__bg" src={mid ? PHONE_ART : WIDE_ART} alt="" />
      <span className="challenge-banner__body">
        {!mid && (
          <span className="challenge-banner__cta challenge-banner__balance" aria-hidden="true">
            Get Started
          </span>
        )}
        <span className="challenge-banner__text">
          <span className="challenge-banner__title">{TITLE}</span>
          <span className="challenge-banner__subtitle">{SUBTITLE}</span>
        </span>
        <span className="challenge-banner__cta">Get Started</span>
      </span>
    </button>
  );
}
