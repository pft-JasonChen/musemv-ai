import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import Button from '../../components/Button/Button'
import IconButton from '../../components/IconButton/IconButton'
import icStar from '../../assets/icons/ic_star.svg'
import icChevronLeft from '../../assets/icons/ic_chevron-left.svg'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import video01 from '../../assets/hero/hero_01_Vintage Car-tmp-tmp.mp4?url'
import thumb01 from '../../assets/hero/hero_01_Vintage Car.png'
import video02 from '../../assets/hero/hero_02_Splash-tmp-tmp.mp4?url'
import thumb02 from '../../assets/hero/hero_02_Splash.png'
import video03 from '../../assets/hero/hero_03_Urban Fashion-tmp-tmp.mp4?url'
import thumb03 from '../../assets/hero/hero_03_Urban Fashion.png'
import video04 from '../../assets/hero/hero_04_midnight_static-tmp-tmp.mp4?url'
import thumb04 from '../../assets/hero/hero_04_midnight_static.jpg'
import video05 from '../../assets/hero/hero_05_pastel_film_converted.mp4?url'
import thumb05 from '../../assets/hero/hero_05_pastel_film.jpg'
import video06 from '../../assets/hero/hero_06_alice_in_wonderland.mp4?url'
import thumb06 from '../../assets/hero/hero_06_alice_in_wonderland.jpg'
import video07 from '../../assets/hero/hero_07_jpop.mp4?url'
import thumb07 from '../../assets/hero/hero_07_jpop.jpg'
import video08 from '../../assets/hero/hero_08_paper_wonderland_converted.mp4?url'
import thumb08 from '../../assets/hero/hero_08_paper_wonderland.jpg'
import './HeroBannerSection.css'

// Mock content — no API to call yet, this is UI-only per project scope.
const HERO_ITEMS = [
  { title: 'Vintage Drive', subtitle: 'Retro | 2-3 min', video: video01, thumbnail: thumb01 },
  { title: 'Splash Zone', subtitle: 'Energetic | 2-3 min', video: video02, thumbnail: thumb02 },
  { title: 'Urban Runway', subtitle: 'Fashion | 2-3 min', video: video03, thumbnail: thumb03 },
  { title: 'Midnight Static', subtitle: 'Ambient | 3-4 min', video: video04, thumbnail: thumb04 },
  { title: 'Pastel Dreams', subtitle: 'Dreamy | 2-3 min', video: video05, thumbnail: thumb05 },
  { title: 'Wonderland Echoes', subtitle: 'Fantasy | 3-4 min', video: video06, thumbnail: thumb06 },
  { title: 'J-Pop Rush', subtitle: 'Pop | 2-3 min', video: video07, thumbnail: thumb07 },
  { title: 'Paper Wonderland', subtitle: 'Whimsical | 2-3 min', video: video08, thumbnail: thumb08 },
]

const ROTATE_INTERVAL_MS = 3000
const FADE_MS = 250

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

// Fixed marketing headline (Figma node 1805:43562's "Text + CTA") — unlike
// the video title/subtitle above it, this is NOT tied to which hero video is
// showing. It just cycles between these 2 lines on its own 5s timer.
const HEADLINES = [
  { lead: 'Transform song into ', accent: 'Cinematic Video' },
  { lead: 'Turn your selfie into ', accent: 'Music Video' },
]
const HEADLINE_REAL = HEADLINES.length
const HEADLINE_INTERVAL_MS = 5000
const HEADLINE_ANIM_MS = 300
// Same clone-then-silently-reset trick as HeroBannerMobile's infinite drag
// carousel below: padding one clone on each side lets the track always slide
// the same direction (up), snapping back invisibly once it lands on a clone.
const HEADLINE_PADDED = [HEADLINES[HEADLINE_REAL - 1], ...HEADLINES, HEADLINES[0]]

function headlineRealIndex(domIndex: number) {
  return (((domIndex - 1) % HEADLINE_REAL) + HEADLINE_REAL) % HEADLINE_REAL
}

function HeroHeadline() {
  const trackRef = useRef<HTMLDivElement>(null)
  const domIndexRef = useRef(1)
  const timerRef = useRef<number | undefined>(undefined)

  function goToDom(domIndex: number, animated: boolean) {
    domIndexRef.current = domIndex
    const track = trackRef.current
    if (!track) return
    // translateY(%) resolves against the track's OWN total height (all 4
    // padded items), not one item's height — so the offset has to be
    // computed in px from an actual item's rendered height instead.
    const itemHeight = track.firstElementChild instanceof HTMLElement ? track.firstElementChild.offsetHeight : 0
    track.style.transition = animated ? `transform ${HEADLINE_ANIM_MS}ms cubic-bezier(0.3, 0, 0.1, 1)` : 'none'
    track.style.transform = `translateY(-${domIndex * itemHeight}px)`
  }

  function settleAfterSnap() {
    if (domIndexRef.current >= HEADLINE_REAL + 1) goToDom(1, false)
  }

  function next() {
    goToDom(domIndexRef.current + 1, true)
    window.setTimeout(settleAfterSnap, HEADLINE_ANIM_MS + 10)
  }

  useEffect(() => {
    goToDom(1, false)
    timerRef.current = window.setInterval(next, HEADLINE_INTERVAL_MS)
    return () => window.clearInterval(timerRef.current)
    // Mount-only: goToDom/next close over refs, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="hero-banner__headline-mask">
      <div className="hero-banner__headline-track" ref={trackRef}>
        {HEADLINE_PADDED.map((headline, domIndex) => (
          <div className="hero-banner__headline" key={`${domIndex}-${headlineRealIndex(domIndex)}`}>
            <p className="hero-banner__headline-line">{headline.lead}</p>
            <p className="hero-banner__headline-line hero-banner__headline-accent">{headline.accent}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// App-mobile variant only (see layoutMode.ts) — Figma "Top Hero Banner"
// (node 369:7479), matched against the reference build's infinite draggable
// carousel (scottwu630/ycmuse-prototype muse-prototype-v1.html): fixed
// 272x153 cards, a single clone on each side for the infinite loop (rather
// than the desktop carousel's 3-copy trick above, since this recenters via
// drag release instead of free scroll), and only the centered card's
// title/subtitle/CTA are revealed — the rest stay image+badge only.
const MOBILE_CARD_W = 272
const MOBILE_GAP = 8
const MOBILE_STEP = MOBILE_CARD_W + MOBILE_GAP
const MOBILE_AUTO_MS = 4000
const MOBILE_ANIM_MS = 380
const MOBILE_DRAG_THRESHOLD = 60
const MOBILE_REAL = HERO_ITEMS.length
// domIndex 0 = clone of the last real card, 1..MOBILE_REAL = real cards,
// MOBILE_REAL+1 = clone of the first real card.
const MOBILE_PADDED_ITEMS = [HERO_ITEMS[MOBILE_REAL - 1], ...HERO_ITEMS, HERO_ITEMS[0]]

function mobileRealIndex(domIndex: number) {
  return (((domIndex - 1) % MOBILE_REAL) + MOBILE_REAL) % MOBILE_REAL
}

function HeroBannerMobile() {
  const trackRef = useRef<HTMLDivElement>(null)
  const domIndexRef = useRef(1)
  const dragRef = useRef({ startX: 0, dragging: false })
  const timerRef = useRef<number | undefined>(undefined)
  const [activeReal, setActiveReal] = useState(0)

  function setTrackX(x: number, animated: boolean) {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animated ? `transform ${MOBILE_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none'
    track.style.transform = `translateX(${x}px)`
  }

  function goToDom(domIndex: number, animated: boolean) {
    domIndexRef.current = domIndex
    setTrackX(-domIndex * MOBILE_STEP, animated)
    setActiveReal(mobileRealIndex(domIndex))
  }

  // After animating onto a clone, silently (no transition) snap to its real
  // equivalent — since the clone is pixel-identical, the jump is invisible.
  function settleAfterSnap() {
    if (domIndexRef.current >= MOBILE_REAL + 1) goToDom(1, false)
    else if (domIndexRef.current <= 0) goToDom(MOBILE_REAL, false)
  }

  function next() {
    goToDom(domIndexRef.current + 1, true)
    window.setTimeout(settleAfterSnap, MOBILE_ANIM_MS + 10)
  }

  function startAuto() {
    window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(next, MOBILE_AUTO_MS)
  }

  useEffect(() => {
    goToDom(1, false)
    startAuto()
    function handleVisibility() {
      if (document.hidden) window.clearInterval(timerRef.current)
      else startAuto()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
    // Mount-only: goToDom/startAuto close over refs, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePointerDown(event: ReactPointerEvent) {
    dragRef.current = { startX: event.clientX, dragging: true }
    event.currentTarget.setPointerCapture(event.pointerId)
    window.clearInterval(timerRef.current)
    setTrackX(-domIndexRef.current * MOBILE_STEP, false)
  }

  function handlePointerMove(event: ReactPointerEvent) {
    if (!dragRef.current.dragging) return
    const dx = event.clientX - dragRef.current.startX
    setTrackX(-domIndexRef.current * MOBILE_STEP + dx, false)
  }

  function handlePointerUp(event: ReactPointerEvent) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dx = event.clientX - dragRef.current.startX
    if (dx < -MOBILE_DRAG_THRESHOLD) {
      next()
    } else if (dx > MOBILE_DRAG_THRESHOLD) {
      goToDom(domIndexRef.current - 1, true)
      window.setTimeout(settleAfterSnap, MOBILE_ANIM_MS + 10)
    } else {
      goToDom(domIndexRef.current, true)
    }
    startAuto()
  }

  return (
    <div className="hero-banner-mobile">
      <div
        className="hero-banner-mobile__track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {MOBILE_PADDED_ITEMS.map((item, domIndex) => {
          const isActive = mobileRealIndex(domIndex) === activeReal
          return (
            <div className="hero-banner-mobile__card" key={`${domIndex}-${item.title}`}>
              {item.thumbnail && (
                <img src={item.thumbnail} alt="" className="hero-banner-mobile__bg" draggable={false} />
              )}
              <div className="hero-banner-mobile__scrim" aria-hidden="true" />
              <span className="hero-banner-mobile__badge">
                <span className="hero-banner-mobile__badge-icon" style={maskStyle(icStar)} aria-hidden="true" />
                Trending MV
              </span>
              <div className={`hero-banner-mobile__bottom${isActive ? ' hero-banner-mobile__bottom--active' : ''}`}>
                <div className="hero-banner-mobile__text">
                  <p className="hero-banner-mobile__title">{item.title}</p>
                  <p className="hero-banner-mobile__subtitle">{item.subtitle}</p>
                </div>
                <Button size="Small" variant="Secondary" className="hero-banner-mobile__cta">
                  Create MV
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeroBannerSection() {
  // `activeIndex` moves the thumbnail highlight immediately; `displayedIndex`
  // (what actually renders) waits for the fade-out before swapping, so the
  // banner crossfades instead of jumping straight to the next item.
  const [activeIndex, setActiveIndex] = useState(1)
  const [displayedIndex, setDisplayedIndex] = useState(1)
  const [isFading, setIsFading] = useState(false)
  const fadeTimeoutRef = useRef<number | undefined>(undefined)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  // setInterval's closure would otherwise see a stale activeIndex, since it's
  // only ever created once on mount.
  const activeIndexRef = useRef(activeIndex)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  function goTo(index: number) {
    if (index === activeIndexRef.current) return
    setActiveIndex(index)
    setIsFading(true)
    window.clearTimeout(fadeTimeoutRef.current)
    fadeTimeoutRef.current = window.setTimeout(() => {
      setDisplayedIndex(index)
      setIsFading(false)
    }, FADE_MS)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((activeIndexRef.current + 1) % HERO_ITEMS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => () => window.clearTimeout(fadeTimeoutRef.current), [])

  // Keep the active thumbnail visible without scrollIntoView(), which can
  // also move the page vertically when the user is reading below the hero.
  useEffect(() => {
    const row = thumbnailsRef.current
    const thumb = thumbRefs.current[activeIndex]
    if (!row || !thumb) return

    const visibleLeft = row.scrollLeft
    const visibleRight = visibleLeft + row.clientWidth
    const thumbLeft = thumb.offsetLeft
    const thumbRight = thumbLeft + thumb.offsetWidth

    if (activeIndex === 0) {
      row.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (activeIndex === HERO_ITEMS.length - 1) {
      row.scrollTo({ left: row.scrollWidth - row.clientWidth, behavior: 'smooth' })
    } else if (thumbLeft < visibleLeft) {
      row.scrollTo({ left: thumbLeft, behavior: 'smooth' })
    } else if (thumbRight > visibleRight) {
      row.scrollTo({ left: thumbRight - row.clientWidth, behavior: 'smooth' })
    }
  }, [activeIndex])

  function goPrev() {
    goTo((activeIndex - 1 + HERO_ITEMS.length) % HERO_ITEMS.length)
  }

  function goNext() {
    goTo((activeIndex + 1) % HERO_ITEMS.length)
  }

  const displayed = HERO_ITEMS[displayedIndex]

  return (
    <>
      <section className="hero-banner">
        <video
          key={displayed.video}
          className={`hero-banner__bg${isFading ? ' hero-banner__bg--fading' : ''}`}
          src={displayed.video}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="hero-banner__scrim" aria-hidden="true" />

        <div className="hero-banner__top">
          <div className={`hero-banner__title-group${isFading ? ' hero-banner__title-group--fading' : ''}`}>
            <p className="hero-banner__title">{displayed.title}</p>
            <p className="hero-banner__subtitle">{displayed.subtitle}</p>
          </div>

          <div className="hero-banner__text-cta">
            <HeroHeadline />

            <div className="hero-banner__action-row">
              <Button size="Large" variant="Secondary" onClick={() => (window.location.href = '/mv-create')}>
                Create Music Video
              </Button>
              <div className="hero-banner__arrows">
                <IconButton size="Medium" variant="Tertiary" icon={icChevronLeft} label="Previous" onClick={goPrev} />
                <IconButton size="Medium" variant="Tertiary" icon={icChevronRight} label="Next" onClick={goNext} />
              </div>
            </div>
          </div>
        </div>

        <div className="hero-banner__thumbnails" ref={thumbnailsRef}>
          {HERO_ITEMS.map((item, index) => (
            <button
              key={item.title}
              ref={(el) => {
                thumbRefs.current[index] = el
              }}
              type="button"
              className={`hero-banner__thumb${index === activeIndex ? ' hero-banner__thumb--active' : ''}`}
              onClick={() => goTo(index)}
            >
              {item.thumbnail && <img src={item.thumbnail} alt="" className="hero-banner__thumb-bg" />}
              <span className="hero-banner__thumb-scrim" aria-hidden="true" />
              <p className="hero-banner__thumb-title">{item.title}</p>
            </button>
          ))}
        </div>
      </section>

      <HeroBannerMobile />
    </>
  )
}

export default HeroBannerSection
