import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import ListItem from '../../components/ListItem/ListItem'
import SectionHeader from '../../components/SectionHeader/SectionHeader'
import { SONGS } from '../../data/songs'
import './NewSongsSection.css'

// Continues the real song catalog right where TopPicksSection's teaser (the
// first 6) leaves off, instead of separate placeholder mock data.
const NEXT_SONGS = SONGS.slice(6, 12)
const COLUMN_1 = NEXT_SONGS.slice(0, 3)
const COLUMN_2 = NEXT_SONGS.slice(3, 6)

// Same Song Detail page as Top Picks Songs, just landing on a different tab.
const SEE_ALL_HREF = `/song-detail?tab=${encodeURIComponent('New Releases')}&from=home`

function songHref(id: string) {
  return `/song-detail?id=${id}&tab=${encodeURIComponent('New Releases')}&from=home`
}

// App-mobile layout only (see layoutMode.ts) — Figma "New Songs" (node
// 369:7558) paginates this section as swipeable full-width pages of 3 with
// dot indicators, instead of the 2-column list used on desktop/tablet.
// Reuses the same NEXT_SONGS, just re-grouped into pages.
const MOBILE_PAGE_SIZE = 3
const MOBILE_PAGES = Array.from({ length: Math.ceil(NEXT_SONGS.length / MOBILE_PAGE_SIZE) }, (_, i) =>
  NEXT_SONGS.slice(i * MOBILE_PAGE_SIZE, i * MOBILE_PAGE_SIZE + MOBILE_PAGE_SIZE),
)
const DRAG_THRESHOLD = 60

function NewSongsMobilePager() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  // Mutable during a drag — every pointermove would otherwise force a
  // re-render per pixel of movement; only page settling needs one (for the
  // dot indicators), so that alone goes through state.
  const pageIndexRef = useRef(0)
  const dragRef = useRef({ startX: 0, dragging: false })
  const [pageIndex, setPageIndex] = useState(0)

  function applyTransform(index: number, animated: boolean, extraPx = 0) {
    const track = trackRef.current
    const wrap = wrapRef.current
    if (!track || !wrap) return
    const pageWidth = wrap.clientWidth
    track.style.transition = animated ? 'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
    track.style.transform = `translateX(${-index * pageWidth + extraPx}px)`
  }

  function goToPage(index: number) {
    const clamped = Math.max(0, Math.min(MOBILE_PAGES.length - 1, index))
    pageIndexRef.current = clamped
    setPageIndex(clamped)
    applyTransform(clamped, true)
  }

  function handlePointerDown(event: ReactPointerEvent) {
    dragRef.current = { startX: event.clientX, dragging: true }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent) {
    if (!dragRef.current.dragging) return
    const dx = event.clientX - dragRef.current.startX
    const atStart = pageIndexRef.current === 0
    const atEnd = pageIndexRef.current === MOBILE_PAGES.length - 1
    // Resist dragging past the first/last page instead of a hard stop.
    const resisted = (dx > 0 && atStart) || (dx < 0 && atEnd) ? dx / 3 : dx
    applyTransform(pageIndexRef.current, false, resisted)
  }

  function handlePointerUp(event: ReactPointerEvent) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dx = event.clientX - dragRef.current.startX
    if (dx < -DRAG_THRESHOLD && pageIndexRef.current < MOBILE_PAGES.length - 1) goToPage(pageIndexRef.current + 1)
    else if (dx > DRAG_THRESHOLD && pageIndexRef.current > 0) goToPage(pageIndexRef.current - 1)
    else goToPage(pageIndexRef.current)
  }

  return (
    <div className="new-songs__mobile-pager" ref={wrapRef}>
      <div
        className="new-songs__mobile-track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {MOBILE_PAGES.map((page, index) => (
          <div className="new-songs__mobile-page" key={index}>
            {page.map((song) => (
              <a key={song.id} href={songHref(song.id)} className="new-songs__item" draggable={false}>
                <ListItem title={song.title} plays={0} likes={0} shares={0} coverImage={song.cover} />
              </a>
            ))}
          </div>
        ))}
      </div>

      {MOBILE_PAGES.length > 1 && (
        <div className="new-songs__dots">
          {MOBILE_PAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`new-songs__dot${index === pageIndex ? ' new-songs__dot--active' : ''}`}
              aria-label={`Go to page ${index + 1}`}
              onClick={() => goToPage(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NewSongsSection() {
  return (
    <section className="new-songs">
      <SectionHeader title="Newly Released Songs" mobileTitle="New Songs" seeAllHref={SEE_ALL_HREF} />

      <div className="new-songs__layout">
        <div className="new-songs__column">
          {COLUMN_1.map((song) => (
            <a key={song.id} href={songHref(song.id)} className="new-songs__item">
              <ListItem title={song.title} plays={0} likes={0} shares={0} coverImage={song.cover} />
            </a>
          ))}
        </div>
        <div className="new-songs__column">
          {COLUMN_2.map((song) => (
            <a key={song.id} href={songHref(song.id)} className="new-songs__item">
              <ListItem title={song.title} plays={0} likes={0} shares={0} coverImage={song.cover} />
            </a>
          ))}
        </div>
      </div>

      <NewSongsMobilePager />
    </section>
  )
}

export default NewSongsSection
