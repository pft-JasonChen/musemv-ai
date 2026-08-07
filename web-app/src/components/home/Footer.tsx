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
 * "Blogs" is `href="#"` here, not DP's `/blog` — that route doesn't exist in
 * WA. "Pricing" and "Company" links are `href="#"` in DP too (`PROJECT_CONTEXT`
 * lists Footer's Pricing/FAQ as still-placeholder — no destination page yet),
 * so this isn't WA falling behind DP, it's the same placeholder state.
 */
const STUDIO_LINKS = ["Music Video Creator", "Song Composer", "Storybook Creator"];
const SUPPORT_LINKS = ["Pricing", "Blogs", "FAQ"];
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
