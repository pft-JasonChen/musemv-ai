"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (plan Phase 3, /explore/mvs slice) ──
 *
 * Port of DP's `components/SectionHeader/SectionHeader.tsx`; classes from
 * `src/styles/designer/SectionHeader.css`, verbatim. No Tailwind here (G3-d).
 *
 * WA already has `src/components/ui/SectionLabel.tsx` and this does NOT replace
 * it — SectionLabel is the legacy Tailwind heading still used by unmigrated
 * screens. The two coexist until those screens migrate, same as TopBar and
 * RoomNavbar do.
 *
 * DP renders both titles and lets CSS pick one per layout mode, so the mobile
 * abbreviation is a pure style concern; that is kept as-is.
 *
 * `seeAllHref` is a WA route run through `localePath` (R-9). DP defaults it to
 * "#"; here it is required whenever `showSeeAll` is on, so a "See all" link that
 * goes nowhere cannot ship by omission.
 */
export function SectionHeader({
  title,
  mobileTitle = title,
  seeAllHref,
}: {
  title: string;
  /** Shorter title shown in the app-mobile layout — Figma abbreviates some
   *  headings (e.g. "New Music Videos" → "New MVs"). Defaults to `title`. */
  mobileTitle?: string;
  /** Where "See all" links to, as an unprefixed WA path. Omit to hide the link —
   *  which is what the page a "See all" leads to should do. */
  seeAllHref?: string;
}) {
  const { locale } = useLocale();

  return (
    <div className="section-header">
      <p className="section-header__title section-header__title--desktop">{title}</p>
      <p className="section-header__title section-header__title--mobile">{mobileTitle}</p>
      {seeAllHref && (
        <Link href={localePath(locale, seeAllHref)} className="section-header__see-all">
          See all
          <DpIcon name="ic_chevron-right" className="section-header__see-all-icon" />
        </Link>
      )}
    </div>
  );
}
