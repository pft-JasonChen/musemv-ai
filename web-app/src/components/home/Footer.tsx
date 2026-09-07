"use client";

import { useState } from "react";
import Link from "next/link";
import { FeedbackDialog } from "@/components/profile/FeedbackDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

/**
 * DP's `Footer` (Figma "Website Footer", node 1330:22087) — shown on Home and
 * Blog in DP; WA doesn't have Blog ported, so this only ever renders on "/"
 * (see AppShell.tsx).
 *
 * Classes are from `src/styles/designer/Footer.css`, verbatim from DP.
 *
 * ── WHY THIS IS NOW A CLIENT COMPONENT ───────────────────────────────────
 *
 * It used to be static markup with no directive. **Contact** now opens the
 * Send Feedback dialog (product owner, 2026-09-01), which needs `useState`,
 * so the file takes `"use client"`. Everything else about it is unchanged.
 *
 * ── WHAT'S ADAPTED, NOT PORTED VERBATIM ──────────────────────────────────
 * The logo is `/assets/brand/ycm_logo_word_hor.svg` (Next's `public/` path)
 * instead of DP's Vite asset import — a combined icon+wordmark lockup
 * (Figma "Website Footer", node 1724:36697), swapped in from the old
 * placeholder `Logo.svg` 2026-09-01.
 *
 * ── THREE LINKS DP HAS THAT V1 DELIBERATELY DOES NOT ────────────────────
 *
 * Removed on product-owner request (2026-08-27): **Pricing**, **Blogs** and
 * **Storybook Creator**. None of the three is a V1 surface — WA has no
 * `/blog` route, no pricing page, and no Storybook Creator product at all —
 * so DP shipping them as `href="#"` was three links advertising features
 * that do not exist. A drop that re-adds them is DP being ahead of V1's
 * scope, not DP correcting us: re-remove them rather than "restoring" them.
 * (Same standing-deviation shape as `/mv/room`'s `Ideas` button, per
 * `CLAUDE.md`.)
 *
 * **FAQ deliberately stays as a placeholder.** The product owner confirmed it
 * IS a V1 link and will supply the destination later, so "Support" keeps its
 * column with a single entry. FAQ, Terms of Service and Privacy Policy are
 * still `href="#"` — tracked as `DESIGNER-TODO` A29, which is now down to
 * those three plus the same pair inside `BuyCreditsModal`.
 */

/**
 * **Studio's two links now navigate** (product owner, 2026-09-02). They are
 * the only footer entries whose destination was a routing question rather
 * than a missing URL — both targets already exist in the app, nobody had
 * decided they were the targets.
 *
 * `next/link` + `localePath()` is not stylistic here (R-9). DP writes its
 * footer links as plain anchor tags pointing at a bare same-origin path (no
 * `next/link`), and copying that would make every footer click a full page
 * load AND drop the locale prefix — which looks perfect in English and is
 * broken in the other eight locales, where nobody testing in English would
 * ever see it. `guard-greps.sh`'s G1-b rule fails on exactly that literal
 * anchor shape for this reason — see the rule itself for the pattern, not
 * repeated here since spelling it out verbatim would itself match the grep.
 *
 * Neither target is auth-gated: `AC-AUTH-08` says /mv/room and /song/create
 * render their full compose screen for a guest, with the gate at the ACTION
 * inside them — so these are plain links, not `requireLogin` handlers like
 * Contact below.
 */
const STUDIO_LINKS: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Music Video Creator", "/mv/room"],
  ["Song Composer", "/song/create"],
];
const SUPPORT_LINKS = ["FAQ"];

/**
 * **Contact** is the ONLY footer link with a destination (2026-09-01) — it is
 * a `<button>`, not an `<a href="#">`, because it opens a dialog rather than
 * navigating. The other two in this column (Terms of Service, Privacy Policy)
 * and FAQ above are still placeholders awaiting their URLs (`DESIGNER-TODO`
 * A29), so they stay anchors and are rendered from this list.
 */
const COMPANY_LINKS = ["Terms of Service", "Privacy Policy"];

export function Footer() {
  const [fbOpen, setFbOpen] = useState(false);
  const { requireLogin } = useAuth();
  const { locale } = useLocale();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/ycm_logo_word_hor.svg" alt="MUSE" className="footer__logo" />
            <p className="footer__tagline">
              Transforming music production and video editing through intuitive AI creators. Join
              the visual rhythm revolution.
            </p>
          </div>

          <div className="footer__sitemap">
            <div className="footer__column">
              <p className="footer__column-title">Studio</p>
              {STUDIO_LINKS.map(([label, href]) => (
                <Link key={label} className="footer__link" href={localePath(locale, href)}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="footer__column">
              <p className="footer__column-title">Support</p>
              {SUPPORT_LINKS.map((link) => (
                <a key={link} className="footer__link" href="#">
                  {link}
                </a>
              ))}
            </div>
            <div className="footer__column">
              <p className="footer__column-title">Company</p>
              {COMPANY_LINKS.map((link) => (
                <a key={link} className="footer__link" href="#">
                  {link}
                </a>
              ))}
              {/* Same `.footer__link` class as its neighbours so it is
                  visually indistinguishable from them — DP drew one column of
                  links, not two link types. `.footer__link` already declares
                  font-family / size / weight / color, and a class beats the
                  UA button styles, so the ONLY things this has to undo are the
                  button chrome the class does not mention: background, border,
                  padding and the centred text.

                  ⚠️ Do NOT add `font: inherit` here. It was in the first
                  version of this and it rendered Contact at **16px** against
                  its neighbours' 12px — an inline shorthand outranks the
                  class, so it replaced `.footer__link`'s own font instead of
                  supplying a fallback. Measured in the browser, not reasoned
                  about; the two look identical in the source. */}
              <button
                type="button"
                className="footer__link"
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onClick={() => requireLogin(() => setFbOpen(true))}
              >
                Contact
              </button>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">© 2026 Perfect Corp. All rights reserved.</p>
        </div>
      </div>

      {/* Conditionally mounted, exactly as `ProfileView` mounts it — unmounting
          IS the form reset, so re-opening always gives an empty form
          (`FeedbackDialog`'s header).

          ⚠️ **`requireLogin` GATES THIS** (product owner, 2026-09-01). The
          first version of this shipped ungated, on the argument that a visitor
          who cannot sign in is the one most likely to need support. The
          product owner ruled the other way: a guest gets the sign-in dialog
          first, and the form opens only after they are in.

          That also removes the defect the ungated version had: `AuthProvider`
          serves `DEFAULT_PROFILE` regardless of sign-in state, so a signed-out
          visitor was shown the mock address `scott_wu@mail.com` prefilled in
          the Email field. Behind the gate, `profile.email` is always the
          signed-in user's. */}
      {fbOpen && <FeedbackDialog onClose={() => setFbOpen(false)} />}
    </footer>
  );
}
