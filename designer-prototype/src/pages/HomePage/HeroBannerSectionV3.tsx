import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button/Button'
import IconButton from '../../components/IconButton/IconButton'
import icArrowLeft from '../../assets/icons/ic_arrow_left.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import { HERO_ITEMS } from './HeroBannerSection'
import './HeroBannerSectionV3.css'

// Real Home desktop Hero Banner (product owner picked this review-c
// treatment) — Figma "Hero Banner Section" (node 1871:33666). Desktop-only
// — HomePage.tsx renders the original HeroBannerSection on mobile instead.
// See HeroBannerSectionV3.css for the mask/sizing notes.
//
// A real native scroll container (not a JS-transform carousel like
// HeroBannerMobile) — CSS scroll-snap does the "one scroll = exactly one
// card" and hides the scrollbar; this file only drives the auto-advance
// (scrollBy every few seconds) and the infinite-loop illusion (a clone card
// padded onto each end — see PADDED_ITEMS — that gets silently swapped for
// its real equivalent via an instant, no-animation scrollTo once the user
// or the auto-advance lands on it and scrolling settles).
const GAP = 20
const AUTO_MS = 4000
const SETTLE_MS = 150
const REAL = HERO_ITEMS.length
// domIndex 0 = clone of the last real card, 1..REAL = real cards,
// REAL+1 = clone of the first real card.
const PADDED_ITEMS = [HERO_ITEMS[REAL - 1], ...HERO_ITEMS, HERO_ITEMS[0]]

function HeroBannerSectionV3() {
  const trackRef = useRef<HTMLDivElement>(null)
  const domIndexRef = useRef(1)
  const stepRef = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)
  const settleTimeoutRef = useRef<number | undefined>(undefined)
  // Mirrors domIndexRef as actual state (the ref alone doesn't trigger a
  // re-render) so the centered card can swap its static thumbnail for its
  // video — only ever one at a time, matching whichever card is centered.
  const [activeDomIndex, setActiveDomIndex] = useState(1)

  function measureStep() {
    const firstCard = trackRef.current?.firstElementChild
    return firstCard instanceof HTMLElement ? firstCard.offsetWidth + GAP : 0
  }

  function scrollToIndex(domIndex: number, animated: boolean) {
    const track = trackRef.current
    if (!track) return
    domIndexRef.current = domIndex
    setActiveDomIndex(domIndex)
    track.scrollTo({ left: domIndex * stepRef.current, behavior: animated ? 'smooth' : 'instant' })
  }

  function startAuto() {
    window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => scrollToIndex(domIndexRef.current + 1, true), AUTO_MS)
  }

  // Fires for both the auto-advance's own smooth scroll AND any real user
  // wheel/trackpad/drag scroll — debounced so it only runs once scrolling
  // has actually stopped (not on every intermediate frame of the gesture).
  function handleScroll() {
    window.clearTimeout(settleTimeoutRef.current)
    settleTimeoutRef.current = window.setTimeout(handleSettle, SETTLE_MS)
  }

  function handleSettle() {
    const track = trackRef.current
    if (!track || !stepRef.current) return
    const nearest = Math.round(track.scrollLeft / stepRef.current)
    domIndexRef.current = nearest
    // Landed on a clone — the clone is pixel-identical to its real
    // equivalent, so jumping to it with no transition is invisible.
    if (nearest >= REAL + 1) scrollToIndex(1, false)
    else if (nearest <= 0) scrollToIndex(REAL, false)
    // Re-arm the auto-advance timer fresh after ANY settle (auto-driven or
    // user-driven), so a manual scroll doesn't get immediately overridden
    // by an auto-advance that was already mid-countdown.
    startAuto()
  }

  useEffect(() => {
    stepRef.current = measureStep()
    scrollToIndex(1, false)
    startAuto()
    function handleResize() {
      stepRef.current = measureStep()
      scrollToIndex(domIndexRef.current, false)
    }
    function handleVisibility() {
      if (document.hidden) window.clearInterval(timerRef.current)
      else startAuto()
    }
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(timerRef.current)
      window.clearTimeout(settleTimeoutRef.current)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
    // Mount-only: everything above closes over refs, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="hero-banner-v3">
      <div className="hero-banner-v3__previous">
        <IconButton
          size="Large"
          variant="Ghost"
          icon={icArrowLeft}
          label="Previous"
          onClick={() => scrollToIndex(domIndexRef.current - 1, true)}
        />
      </div>

      <div className="hero-banner-v3__track" ref={trackRef} onScroll={handleScroll}>
        {PADDED_ITEMS.map((item, domIndex) => {
          const isActive = domIndex === activeDomIndex
          return (
            <div className="hero-banner-v3__card" key={`${domIndex}-${item.title}`}>
              {isActive && item.video ? (
                <video className="hero-banner-v3__bg" src={item.video} autoPlay loop muted playsInline />
              ) : (
                item.thumbnail && <img src={item.thumbnail} alt="" className="hero-banner-v3__bg" draggable={false} />
              )}
              <div className="hero-banner-v3__scrim" aria-hidden="true" />
              <div className="hero-banner-v3__bottom">
                <div className="hero-banner-v3__text">
                  <p className="hero-banner-v3__title">{item.title}</p>
                  <p className="hero-banner-v3__subtitle">{item.subtitle}</p>
                </div>
                <Button
                  size="Medium"
                  variant="Secondary"
                  className="hero-banner-v3__cta"
                  onClick={() => (window.location.href = '/mv-create')}
                >
                  Create MV
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hero-banner-v3__next">
        <IconButton
          size="Large"
          variant="Ghost"
          icon={icArrowRight}
          label="Next"
          onClick={() => scrollToIndex(domIndexRef.current + 1, true)}
        />
      </div>
    </section>
  )
}

export default HeroBannerSectionV3
