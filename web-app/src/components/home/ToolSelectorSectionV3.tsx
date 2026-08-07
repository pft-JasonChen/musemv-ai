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
 * Port of DP's `pages/HomePage/ToolSelectorSectionV3.tsx`; classes from
 * `src/styles/designer/ToolSelectorSectionV3.css`, verbatim. No Tailwind (G3-d).
 *
 * The DESKTOP tool selector — the product owner's chosen "review-c" treatment:
 * a display-size heading above the cards, and it sits ABOVE the hero rather
 * than below it (see `HomeView`'s ordering, which is DP's).
 *
 * ── TWO CARDS, NOT THREE, AND THAT IS DELIBERATE ───────────────────────────
 *
 * DP's stylesheet still carries `--story` rules and its tsx still carries the
 * commented-out AI Storybooks card and its icon import. The product owner asked
 * for it to stay hidden until the feature ships, so the third card is not
 * built here either. The CSS is vendored whole regardless, so adding it later
 * is markup — the same argument `ListItem` makes for its unbuilt variants.
 *
 * ── SAME TAG/GATE SPLIT AS THE PHONE SELECTOR ──────────────────────────────
 *
 * DP's card is an anchor; it stays one (`next/link` + `localePath()`, R-9) and
 * the `requireLogin` gate (`AC-EXP-02` / GL-02) is applied by intercepting the
 * click, not by swapping the element for a `<button>`.
 *
 * `.tool-selector-v3__icon` is `background-color` + `mask-*` ⇒ `DpIcon` (D4).
 */
export function ToolSelectorSectionV3() {
  const router = useRouter();
  const { locale } = useLocale();
  const { requireLogin } = useAuth();

  function card({
    href,
    kind,
    icon,
    title,
    description,
  }: {
    href: string;
    kind: "mv" | "song";
    icon: string;
    title: string;
    description: string;
  }) {
    return (
      <Link
        href={localePath(locale, href)}
        className={`tool-selector-v3__card tool-selector-v3__card--${kind}`}
        onClick={(event) => {
          event.preventDefault();
          requireLogin(() => router.push(localePath(locale, href)));
        }}
      >
        <div className={`tool-selector-v3__icon-badge tool-selector-v3__icon-badge--${kind}`}>
          <DpIcon name={icon} className="tool-selector-v3__icon" />
        </div>
        <div className="tool-selector-v3__text">
          <p className="tool-selector-v3__title">{title}</p>
          <p className="tool-selector-v3__description">{description}</p>
        </div>
      </Link>
    );
  }

  return (
    <section className="tool-selector-v3">
      <h1 className="tool-selector-v3__heading">What would you like to create today?</h1>

      <div className="tool-selector-v3__row">
        {card({
          href: "/mv/room",
          kind: "mv",
          icon: "ic_video_ai",
          title: "AI Music Video",
          description: "Upload a selfie and let AI create your music video.",
        })}
        {card({
          href: "/song/create",
          kind: "song",
          icon: "ic_song_ai",
          title: "AI Song",
          description: "Write your lyrics or idea and let AI create the song.",
        })}
      </div>
    </section>
  );
}
