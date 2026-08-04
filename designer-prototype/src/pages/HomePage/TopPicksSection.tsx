import { useEffect, useRef, useState } from 'react'
import Card from '../../components/Card/Card'
import SectionHeader from '../../components/SectionHeader/SectionHeader'
import IconButton from '../../components/IconButton/IconButton'
import icArrowLeft from '../../assets/icons/ic_arrow_left.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import { SONGS } from '../../data/songs'
import './TopPicksSection.css'

// Home teaser — first 12 of the real song catalog (src/data/songs.ts).
// Clicking the play button plays the actual audio inline; clicking
// elsewhere on the card goes to the full Song Detail page.
const TOP_PICKS = SONGS.slice(0, 12)

function TopPicksSection() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
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
    const firstItem = row?.querySelector<HTMLElement>('.top-picks__item')
    if (!row || !firstItem) return
    const gap = Number.parseFloat(window.getComputedStyle(row).columnGap) || 0
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: 'smooth' })
  }

  function handlePlayClick(id: string, src: string) {
    const audio = audioRef.current
    if (!audio) return

    if (playingId === id) {
      audio.pause()
      setPlayingId(null)
      return
    }

    audio.src = src
    audio.play()
    setPlayingId(id)
  }

  return (
    <section className="top-picks">
      <SectionHeader title="Top Picks Songs" seeAllHref="/song-detail?from=home" />

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <div className="top-picks__row-wrapper">
        <div className="top-picks__row" ref={rowRef} onScroll={updateScrollState}>
          {TOP_PICKS.map((song) => (
            <a key={song.id} href={`/song-detail?id=${song.id}&from=home`} className="top-picks__item">
              <Card
                type="Song"
                title={song.title}
                subtitle="AI Song"
                coverImage={song.cover}
                isPlaying={playingId === song.id}
                onPlayClick={() => handlePlayClick(song.id, song.audio)}
              />
            </a>
          ))}
        </div>

        {canScrollBack && (
          <div className="top-picks__previous">
            <IconButton size="Large" variant="Ghost" icon={icArrowLeft} label="Previous" onClick={() => scrollByCard(-1)} />
          </div>
        )}

        {canScrollForward && (
          <div className="top-picks__next">
            <IconButton size="Large" variant="Ghost" icon={icArrowRight} label="Next" onClick={() => scrollByCard(1)} />
          </div>
        )}
      </div>
    </section>
  )
}

export default TopPicksSection
