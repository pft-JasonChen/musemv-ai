import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import IconButton from '../IconButton/IconButton'
import Button from '../Button/Button'
import UpgradeDialog from '../UpgradeDialog/UpgradeDialog'
import { useAuth } from '../AuthProvider/AuthProvider'
import logo from '../../assets/brand/Logo.svg'
import icPanelLeft from '../../assets/icons/ic_panel_left.svg'
import icCompass from '../../assets/icons/ic_compass_OL.svg'
import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icSongAi from '../../assets/icons/ic_song_ai.svg'
import icStoryAi from '../../assets/icons/ic_story_ai.svg'
import icHistory from '../../assets/icons/ic_history_OL.svg'
import icFileText from '../../assets/icons/ic_file_text.svg'
import icUser from '../../assets/icons/ic_user.svg'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import './Sidebar.css'

// href "#" means that page doesn't exist in the prototype yet.
const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: icCompass, href: '/home' },
  { key: 'mv', label: 'AI Music Video', icon: icVideoAi, href: '/mv-create' },
  { key: 'song', label: 'AI Song', icon: icSongAi, href: '/song-create' },
  { key: 'story', label: 'AI Storybook', icon: icStoryAi, badge: 'NEW', href: '#' },
  { key: 'history', label: 'History', icon: icHistory, href: '/history' },
  { key: 'blog', label: 'Blog', icon: icFileText, href: '/blog1' },
]

// Below Laptop (1024px), the sidebar collapses to icon-only by default.
// A manual toggle can override that default at any width.
const COLLAPSE_QUERY = '(max-width: 1024px)'

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function Sidebar() {
  const { isSignedIn, requireSignIn } = useAuth()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(COLLAPSE_QUERY).matches : false,
  )
  const manuallyOverridden = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(COLLAPSE_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      if (!manuallyOverridden.current) setCollapsed(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  function toggleCollapsed() {
    manuallyOverridden.current = true
    setCollapsed((current) => !current)
  }

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  function isActive(href: string) {
    if (href === '#') return false
    if (href === '/home') return pathname === '/' || pathname.startsWith('/home')
    if (href === '/history') return pathname.startsWith('/history')
    if (href === '/blog1') return pathname.startsWith('/blog')
    return pathname.startsWith(href)
  }

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar__top">
        <div className="sidebar__logo-row">
          {!collapsed && (
            <a href="/home" className="sidebar__logo">
              <img src={logo} alt="MUSE" />
            </a>
          )}
          <IconButton
            size="Small"
            variant="Ghost"
            icon={icPanelLeft}
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapsed}
          />
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`sidebar__nav-item${isActive(item.href) ? ' sidebar__nav-item--active' : ''}`}
              onClick={(event) => {
                // History is the one main-nav item that's actually personal
                // data (your own creation history) — signed-out visitors get
                // the sign-in modal instead of the page itself, same
                // convention as every other requireSignIn(...) gate in this
                // app. The rest of the nav (Home, creators, Blog) stays open.
                if (item.key === 'history' && !isSignedIn) {
                  event.preventDefault()
                  requireSignIn(() => {
                    window.location.href = item.href
                  })
                }
              }}
            >
              <span className="sidebar__nav-icon" style={maskStyle(item.icon)} aria-hidden="true" />
              <span className="sidebar__nav-label">
                <span className="sidebar__nav-label-text">{item.label}</span>
                {item.badge && <span className="sidebar__nav-badge">{item.badge}</span>}
              </span>
            </a>
          ))}
        </nav>
      </div>

      {isSignedIn && (
        <div className="sidebar__bottom">
          <a
            href="/account"
            className="sidebar__profile"
          >
            <span className="sidebar__profile-avatar">
              <span className="sidebar__profile-avatar-icon" style={maskStyle(icUser)} aria-hidden="true" />
            </span>
            <span className="sidebar__profile-copy">
              <span className="sidebar__profile-name">Scott Wu</span>
              <span className="sidebar__profile-plan">Weekly Pro</span>
            </span>
            <span className="sidebar__profile-chevron" style={maskStyle(icChevronRight)} aria-hidden="true" />
          </a>
          <Button
            size="Medium"
            variant="Tertiary"
            className="sidebar__upgrade-button"
            onClick={() => setUpgradeOpen(true)}
          >
            Upgrade
          </Button>
        </div>
      )}

      <UpgradeDialog isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </aside>
  )
}

export default Sidebar
