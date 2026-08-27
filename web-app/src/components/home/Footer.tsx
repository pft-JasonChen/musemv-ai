/**
 * DP's `Footer` (Figma "Website Footer", node 1330:22087) — shown on Home and
 * Blog in DP; WA doesn't have Blog ported, so this only ever renders on "/"
 * (see AppShell.tsx). Static content, no state or handlers, so no client
 * directive is needed even though it's mounted from a client component.
 *
 * Classes are from `src/styles/designer/Footer.css`, verbatim from DP.
 *
 * ── WHAT'S ADAPTED, NOT PORTED VERBATIM ──────────────────────────────────
 * The logo is `/assets/brand/Logo.svg` (Next's `public/` path, already used
 * by Sidebar) instead of DP's Vite asset import.
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
 * column with a single entry. Every remaining link is still `href="#"` —
 * tracked as `DESIGNER-TODO` A29, since a footer of five dead controls is
 * its own open item and not something this change introduced.
 */
const STUDIO_LINKS = ["Music Video Creator", "Song Composer"];
const SUPPORT_LINKS = ["FAQ"];
const COMPANY_LINKS = ["Terms of Service", "Privacy Policy", "Contact"];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/Logo.svg" alt="MUSE" className="footer__logo" />
            <p className="footer__tagline">
              Transforming music production and video editing through intuitive AI creators. Join the visual
              rhythm revolution.
            </p>
          </div>

          <div className="footer__sitemap">
            <div className="footer__column">
              <p className="footer__column-title">Studio</p>
              {STUDIO_LINKS.map((link) => (
                <a key={link} className="footer__link" href="#">
                  {link}
                </a>
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
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">© 2026 Perfect Corp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
