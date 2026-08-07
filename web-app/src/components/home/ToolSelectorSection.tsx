"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (landing page, the 17th route) ─────
 *
 * Port of DP's `pages/HomePage/ToolSelectorSection.tsx`; classes from
 * `src/styles/designer/ToolSelectorSection.css`, verbatim. No Tailwind (G3-d).
 *
 * The PHONE tool selector. Its desktop twin is `ToolSelectorSectionV3`; both
 * ship, and `HomeView` picks. Below 768px the stylesheet turns these into two
 * compact full-gradient tiles with the title only — which is why each card
 * renders BOTH a long and a short title and lets CSS choose
 * (`--desktop` / `--mobile`). CSS cannot swap text content, only visibility.
 *
 * ── THE TAG IS DP'S, THE NAVIGATION IS WA'S (R-9) ──────────────────────────
 *
 * DP makes each tile a real anchor to its create route so the whole tile is the
 * click target, and demotes the arrow to a decorative span (a `<button>` cannot
 * legally nest inside an `<a>`). Both halves are kept: the tile stays an
 * anchor — via `next/link` with a `localePath()` href, so middle-click and
 * hover-preview still work and the locale prefix survives — and the auth gate
 * is layered on by intercepting the click, rather than by swapping the element
 * for a `<button>`. Changing DP's tag is how `/creator`'s primary menu action
 * silently lost a specificity fight; not repeating it.
 *
 * `requireLogin` on both tiles is `AC-EXP-02` / GL-02, and it exists only in
 * WA — DP has no `AuthProvider` at all.
 *
 * ── ICON TAGS, DECIDED FROM THE CSS (D4) ───────────────────────────────────
 *
 * `.tool-selector__icon` and `.icon-button__icon` are both `background-color`
 * + `mask-*` ⇒ `DpIcon` (a `<span>`; neither rule selects by element). There is
 * no real `<img>` on this component.
 */
export function ToolSelectorSection() {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();

  function card({
    href,
    bright,
    icon,
    desktopTitle,
    mobileTitle,
    description,
  }: {
    href: string;
    bright?: boolean;
    icon: string;
    desktopTitle: string;
    mobileTitle: string;
    description: string;
  }) {
    return (
      <Link
        href={localePath(locale, href)}
        className={`tool-selector__card${bright ? " tool-selector__card--bright" : ""}`}
        onClick={(event) => {
          // The href is real so the anchor behaves like one; the gate runs
          // instead of the default navigation.
          event.preventDefault();
          requireLogin(() => router.push(localePath(locale, href)));
        }}
      >
        <span className="tool-selector__glow" aria-hidden="true" />
        <div
          className={`tool-selector__icon-badge tool-selector__icon-badge--${bright ? "mv" : "song"}`}
        >
          <DpIcon name={icon} className="tool-selector__icon" />
        </div>
        <div className="tool-selector__text">
          <p className="tool-selector__title tool-selector__title--desktop">{desktopTitle}</p>
          <p className="tool-selector__title tool-selector__title--mobile">{mobileTitle}</p>
          <p className="tool-selector__description">{description}</p>
        </div>
        <span
          className="icon-button icon-button--medium icon-button--secondary tool-selector__action"
          aria-hidden="true"
        >
          <DpIcon name="ic_arrow_right" className="icon-button__icon" />
        </span>
      </Link>
    );
  }

  return (
    <section className="tool-selector">
      {card({
        href: "/mv/room",
        bright: true,
        icon: "ic_video_ai",
        desktopTitle: "Music Video Creator",
        mobileTitle: "Music Video",
        description:
          "Upload your selfie, choose a style, and watch AI craft a stunning music video in minutes.",
      })}
      {card({
        href: "/song/create",
        icon: "ic_song_ai",
        desktopTitle: "AI Song Composer",
        mobileTitle: "AI Song",
        description:
          "Write your lyrics, pick a style, and AI generates a full song ready to share or use in your MV.",
      })}
    </section>
  );
}
