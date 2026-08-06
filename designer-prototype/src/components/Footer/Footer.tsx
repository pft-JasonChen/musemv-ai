import logo from '../../assets/brand/Logo.svg'
import './Footer.css'

const STUDIO_LINKS = ['Music Video Creator', 'Song Composer', 'Storybook Creator']
const SUPPORT_LINKS = ['Pricing', 'Blogs', 'FAQ']
const COMPANY_LINKS = ['Terms of Service', 'Privacy Policy', 'Contact']

function Footer() {
  return (
    <footer className="footer">
      {/* Background/border-top stay full-bleed on .footer itself; this
          inner wrapper caps at the same 1440px as .home-page so the
          content (logo, links) lines up with Main above it. */}
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <img src={logo} alt="MUSE" className="footer__logo" />
            <p className="footer__tagline">
              Transforming music production and video editing through intuitive AI creators. Join the
              visual rhythm revolution.
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
                <a key={link} className="footer__link" href={link === 'Blogs' ? '/blog' : '#'}>
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
  )
}

export default Footer
