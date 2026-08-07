import ListItem from '../../components/ListItem/ListItem'
import SectionHeader from '../../components/SectionHeader/SectionHeader'
import SongPlayBar from '../../components/SongPlayBar/SongPlayBar'
import { useSongPlayer } from '../../hooks/useSongPlayer'
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

// Below 768px (see NewSongsSection.css), .new-songs__layout switches from
// 2 side-by-side columns to 1 stacked column via flex-direction — so on
// mobile this renders all 6 songs (COLUMN_1 then COLUMN_2) as one flat
// list, same component/markup as desktop, just re-flowed by CSS. An earlier
// version paginated mobile into swipeable pages of 3 with dot indicators,
// but that hid 3 of the 6 songs behind a swipe most people never
// discovered — removed in favor of just showing all 6 directly.
function NewSongsSection() {
  // Same shared player as SongDetailPage's desktop list — clicking a
  // thumbnail plays it in place via the bottom bar instead of navigating
  // away. Mobile has no equivalent bar (SongPlayBar hides itself below
  // 767px), so its thumbnail tap falls back to navigating, same as the
  // title (see handleThumbnailPlay).
  const player = useSongPlayer(NEXT_SONGS)

  function handleThumbnailPlay(songId: string) {
    if (window.matchMedia('(max-width: 767px)').matches) {
      window.location.href = songHref(songId)
      return
    }
    player.play(songId)
  }

  function renderColumn(songs: typeof NEXT_SONGS) {
    return songs.map((song) => (
      <div key={song.id} className="new-songs__item">
        <ListItem
          title={song.title}
          username={song.username}
          cta
          createHref="/song-create?from=home"
          plays={0}
          likes={0}
          shares={0}
          coverImage={song.cover}
          isPlaying={player.activeSong?.id === song.id && player.playing}
          onSelect={() => {
            window.location.href = songHref(song.id)
          }}
          onPlay={() => handleThumbnailPlay(song.id)}
        />
      </div>
    ))
  }

  return (
    // Keeps the section's own bottom padding from sitting behind the fixed
    // bar once it's open — same fix as SongDetailPage's list container.
    <section className="new-songs" style={player.isOpen ? { paddingBottom: 96 } : undefined}>
      <SectionHeader title="Newly Released Songs" mobileTitle="New Songs" seeAllHref={SEE_ALL_HREF} />

      <audio {...player.audioProps} />

      <div className="new-songs__layout">
        <div className="new-songs__column">{renderColumn(COLUMN_1)}</div>
        <div className="new-songs__column">{renderColumn(COLUMN_2)}</div>
      </div>

      {player.isOpen && <SongPlayBar player={player} />}
    </section>
  )
}

export default NewSongsSection
