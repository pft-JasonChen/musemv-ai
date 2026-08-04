import { useEffect, useRef, useState } from 'react'
import Card from '../../components/Card/Card'
import SectionHeader from '../../components/SectionHeader/SectionHeader'
import IconButton from '../../components/IconButton/IconButton'
import icArrowLeft from '../../assets/icons/ic_arrow_left.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import { MUSIC_VIDEOS } from '../../data/musicVideos'
import './NewMVsSection.css'

// Same catalog as the MV Detail "See all" page (src/data/musicVideos.ts) —
// same ids/covers/videos, so clicking a card here plays the matching video
// there instead of an unrelated stand-in. All of them (not just a handful),
// so the row actually has more to reveal when the Next arrow is clicked.
const NEW_MVS = MUSIC_VIDEOS

// No real genre/duration data exists per video yet — decorative only.
const SUBTITLES = [
  'Storytelling | 2-3 min',
  'Cinematic | 2-3 min',
  'Hybrid | 2-3 min',
  'Trending | 1-2 min',
  'Fan fav | 1-2 min',
  'Vintage | 2-3 min',
]

function NewMVsSection() {
  const rowRef = useRef<HTMLDivElement>(null)
  const [canScrollBack, setCanScrollBack] = useState(false)
  const [canScrollForward, setCanScrollForward] = useState(false)

  function updateScrollState() {
    const row = rowRef.current
    if (!row) return
    setCanScrollBack(row.scrollLeft > 1)
    setCanScrollForward(row.scrollLeft + row.clientWidth < row.scrollWidth - 1)
  }

  useEffect(() => {
    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    return () => window.removeEventListener('resize', updateScrollState)
  }, [])

  function scrollByCard(direction: -1 | 1) {
    const row = rowRef.current
    const firstItem = row?.querySelector<HTMLElement>('.new-mvs__item')
    if (!row || !firstItem) return
    const gap = Number.parseFloat(window.getComputedStyle(row).columnGap) || 0
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: 'smooth' })
  }

  return (
    <section className="new-mvs">
      <SectionHeader title="New Music Videos" mobileTitle="New MVs" seeAllHref="/mv-detail?from=home" />

      <div className="new-mvs__row-wrapper">
        <div className="new-mvs__row" ref={rowRef} onScroll={updateScrollState}>
          {NEW_MVS.map((mv, index) => (
            <a key={mv.id} href={`/mv-detail?id=${mv.id}&from=home`} className="new-mvs__item">
              <Card
                type="Video"
                ratio={mv.ratio}
                title={mv.title}
                subtitle={SUBTITLES[index % SUBTITLES.length]}
                badge={mv.badge}
                coverImage={mv.cover}
              />
            </a>
          ))}
        </div>

        {canScrollBack && (
          <div className="new-mvs__previous">
            <IconButton size="Large" variant="Ghost" icon={icArrowLeft} label="Previous" onClick={() => scrollByCard(-1)} />
          </div>
        )}

        {canScrollForward && (
          <div className="new-mvs__next">
            <IconButton size="Large" variant="Ghost" icon={icArrowRight} label="Next" onClick={() => scrollByCard(1)} />
          </div>
        )}
      </div>
    </section>
  )
}

export default NewMVsSection
