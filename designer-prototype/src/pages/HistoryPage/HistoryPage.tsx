import { useEffect, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import { useMountTransition } from '../../hooks/useMountTransition'
import RoomNavbar from '../../components/RoomNavbar/RoomNavbar'
import Tabs from '../../components/Tabs/Tabs'
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch'
import Badge from '../../components/Badge/Badge'
import PublishDialog from '../../components/PublishDialog/PublishDialog'
import Toast from '../../components/Toast/Toast'
import { useAuth } from '../../components/AuthProvider/AuthProvider'
import { MUSIC_VIDEOS } from '../../data/musicVideos'
import { SONGS } from '../../data/songs'
import { STORYBOARD_COVER } from '../../data/storyboardClips'
import icAlert from '../../assets/icons/ic_alert.svg'
import icDelete from '../../assets/icons/ic_delete.svg'
import icDownload from '../../assets/icons/ic_download.svg'
import icEdit from '../../assets/icons/ic_edit.svg'
import icFavoriteOff from '../../assets/icons/ic_favorite_off.svg'
import icFavoriteOn from '../../assets/icons/ic_favorite_on.svg'
import icHeadphones from '../../assets/icons/ic_headphones.svg'
import icMore from '../../assets/icons/ic_more.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPublish from '../../assets/icons/ic_publish.svg'
import icScript from '../../assets/icons/ic_script.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icSong from '../../assets/icons/ic_song.svg'
import icTimer from '../../assets/icons/ic_timer.svg'
import icVideo from '../../assets/icons/ic_video.svg'
import './HistoryPage.css'

type HistoryType = 'Music Video' | 'Song' | 'Storyboard'
type HistoryStatus = 'Generating' | 'Done' | 'Failed' | 'Ready'
type HistoryTab = 'All' | 'Music Videos' | 'Songs' | 'Liked'
type PublishState = 'review' | 'published'

interface HistoryItem {
  id: string
  type: HistoryType
  title: string
  cover: string
  date: string
  status: HistoryStatus
  liked: boolean
  plays?: number
  likes?: number
  shares?: number
  href: string
}

const TABS: HistoryTab[] = ['All', 'Music Videos', 'Songs', 'Liked']
const SWEET_FOREVER = SONGS.find((song) => song.title === 'Sweet Forever') ?? SONGS[0]

// Figma "New Songs Section" (node 1591:29611).
const HISTORY_ITEMS: HistoryItem[] = [
  { id: 'generating-mv', type: 'Music Video', title: 'New Music Video', cover: '', date: '2026-07-31', status: 'Generating', liked: false, href: '/history' },
  { id: 'storyboard-ready', type: 'Storyboard', title: 'Starlight in Your Eyes', cover: STORYBOARD_COVER, date: '2026-07-30', status: 'Ready', liked: false, href: '/mv-storyboard?from=history&stage=edit' },
  { id: 'cinematic-night', type: 'Music Video', title: MUSIC_VIDEOS[0]?.title ?? 'Cinematic Night', cover: MUSIC_VIDEOS[0]?.cover ?? '', date: '2026-07-29', status: 'Done', liked: true, plays: 108, likes: 38, shares: 15, href: '/mv-result?from=history' },
  { id: 'generating-song', type: 'Song', title: 'Forest Morning', cover: '', date: '2026-07-28', status: 'Generating', liked: false, href: '/history' },
  { id: 'sweet-forever', type: 'Song', title: SWEET_FOREVER?.title ?? 'Sweet Forever', cover: SWEET_FOREVER?.cover ?? '', date: '2026-07-24', status: 'Done', liked: true, plays: 108, likes: 38, shares: 15, href: `/song-create?stage=result&id=${SWEET_FOREVER?.id ?? ''}&from=history` },
  { id: 'failed-song', type: 'Song', title: 'Midnight Drive', cover: '', date: '2026-07-20', status: 'Failed', liked: false, href: '/song-create' },
  { id: 'neon-city', type: 'Song', title: SONGS[1]?.title ?? 'Neon City Nights', cover: SONGS[1]?.cover ?? '', date: '2026-07-18', status: 'Done', liked: true, plays: 94, likes: 31, shares: 12, href: `/song-create?stage=result&id=${SONGS[1]?.id ?? ''}&from=history` },
  { id: 'midnight-drive', type: 'Music Video', title: MUSIC_VIDEOS[1]?.title ?? 'Midnight Drive', cover: MUSIC_VIDEOS[1]?.cover ?? '', date: '2026-07-12', status: 'Done', liked: false, plays: 76, likes: 24, shares: 8, href: '/mv-result?from=history' },
  { id: 'morning-forest', type: 'Music Video', title: MUSIC_VIDEOS[2]?.title ?? 'Morning in the Forest', cover: MUSIC_VIDEOS[2]?.cover ?? '', date: '2026-07-08', status: 'Done', liked: true, plays: 68, likes: 21, shares: 6, href: '/mv-result?from=history' },
]

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function typeIcon(type: HistoryType) {
  if (type === 'Music Video') return icVideo
  if (type === 'Song') return icSong
  return icScript
}

function StatusBadge({ status }: { status: HistoryStatus }) {
  if (status === 'Ready') return null
  return <Badge status={status === 'Generating' ? 'Processing' : status} />
}

function itemHref(item: HistoryItem, activeTab: HistoryTab) {
  if (activeTab !== 'Liked' || item.type !== 'Song' || item.status !== 'Done') return item.href
  const song = SONGS.find((candidate) => candidate.title === item.title)
  return song ? `/song-detail?id=${song.id}&from=history` : '/song-detail?from=history'
}

function SocialStat({ icon, value }: { icon: string; value: number }) {
  return (
    <span className="history-card__social-stat">
      <span style={maskStyle(icon)} aria-hidden="true" />
      {value}
    </span>
  )
}

interface HistoryCardProps {
  item: HistoryItem
  menuOpen: boolean
  liked: boolean
  publishState?: PublishState
  onToggleMenu: () => void
  onCloseMenu: () => void
  onToggleLike: () => void
  onTogglePublish: (nextPublished: boolean) => void
  onPrimaryAction: () => void
  onDelete: () => void
}

function HistoryCard({
  item,
  menuOpen,
  liked,
  publishState,
  onToggleMenu,
  onCloseMenu,
  onToggleLike,
  onTogglePublish,
  onPrimaryAction,
  onDelete,
}: HistoryCardProps) {
  const isComplete = item.status === 'Done'
  const isFailed = item.status === 'Failed'
  const isStoryboard = item.type === 'Storyboard'
  const isMusicVideo = item.type === 'Music Video'
  const isSong = item.type === 'Song'
  const isPublished = publishState !== undefined

  return (
    <article className={`history-card history-card--${item.status.toLowerCase()}`}>
      <a href={item.href} className={`history-card__cover history-card__cover--${item.type.toLowerCase().replaceAll(' ', '-')}`} aria-label={item.title}>
        {item.cover && <img src={item.cover} alt="" />}
        {isComplete && <span className="history-card__cover-scrim" aria-hidden="true" />}
        <div className="history-card__status-slot"><StatusBadge status={item.status} /></div>
        {item.status === 'Generating' && <span className="history-card__state-icon history-card__state-icon--generating" style={maskStyle(icTimer)} />}
        {item.status === 'Failed' && <span className="history-card__state-icon history-card__state-icon--failed" style={maskStyle(icAlert)} />}
        {item.status === 'Ready' && (
          <span className="history-card__create" onClick={(event) => { event.preventDefault(); onPrimaryAction() }}>
            <span style={maskStyle(icVideo)} aria-hidden="true" />
            Create MV
          </span>
        )}
        {isComplete && <span className="history-card__play"><span style={maskStyle(icPlay)} aria-hidden="true" /></span>}
        <span className="history-card__type-icon" style={maskStyle(typeIcon(item.type))} aria-hidden="true" />
      </a>

      <div className="history-card__info">
        <div className="history-card__copy">
          <a href={item.href}>{item.title}</a>
          {item.status === 'Generating' || item.status === 'Failed' || item.status === 'Ready' ? (
            <p>{item.type}</p>
          ) : (
            <div className="history-card__social">
              <SocialStat icon={icHeadphones} value={item.plays ?? 0} />
              <SocialStat icon={liked ? icFavoriteOn : icFavoriteOff} value={item.likes ?? 0} />
              <SocialStat icon={icShare} value={item.shares ?? 0} />
            </div>
          )}
          <time>{item.date}</time>
        </div>
        {item.status !== 'Generating' && <div className="history-card__menu-shell">
          <button type="button" className="history-card__more" aria-label={`More actions for ${item.title}`} aria-expanded={menuOpen} onClick={onToggleMenu}>
            <span style={maskStyle(icMore)} aria-hidden="true" />
          </button>
          {menuOpen && (
            <>
              <button className="history-card__menu-backdrop" type="button" aria-label="Close actions" onClick={onCloseMenu} />
              <div className="history-card__menu" role="menu" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
                <span className="history-card__menu-handle" aria-hidden="true" />

                {isStoryboard && !isFailed && (
                  <button type="button" className="history-card__menu-primary history-card__menu-primary--gradient" role="menuitem" onClick={onPrimaryAction}>
                    <span style={maskStyle(icVideo)} aria-hidden="true" />
                    Create MV
                  </button>
                )}

                {isMusicVideo && !isFailed && !isPublished && (
                  <a href="/mv-edit?from=history" className="history-card__menu-primary" role="menuitem">
                    <span style={maskStyle(icEdit)} aria-hidden="true" />
                    Edit MV
                  </a>
                )}

                {isSong && !isFailed && (
                  <button type="button" className="history-card__menu-primary history-card__menu-primary--gradient" role="menuitem" onClick={onPrimaryAction}>
                    <span style={maskStyle(icVideo)} aria-hidden="true" />
                    Create MV
                  </button>
                )}

                {!isStoryboard && !isFailed && (
                  <>
                    <button type="button" role="menuitem" onClick={onToggleLike}>
                      <span style={maskStyle(liked ? icFavoriteOn : icFavoriteOff)} aria-hidden="true" />
                      {liked ? 'Unlike' : 'Like'}
                    </button>
                    <button type="button" role="menuitem" onClick={onCloseMenu}>
                      <span style={maskStyle(icShare)} aria-hidden="true" />
                      Share
                    </button>
                    <div className="history-card__menu-publish">
                      <span>
                        <i style={maskStyle(publishState === 'review' ? icTimer : icPublish)} aria-hidden="true" />
                        Publish{publishState === 'review' ? ' (Review)' : ''}
                      </span>
                      <ToggleSwitch checked={isPublished} onChange={onTogglePublish} />
                    </div>
                    <button type="button" role="menuitem" onClick={onCloseMenu}>
                      <span style={maskStyle(icDownload)} aria-hidden="true" />
                      Download
                    </button>
                  </>
                )}

                {!isPublished && (
                  <button type="button" role="menuitem" className="history-card__menu-delete" onClick={onDelete}>
                    <span style={maskStyle(icDelete)} aria-hidden="true" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>}
      </div>
    </article>
  )
}

function HistoryPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('All')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState(() => new Set(HISTORY_ITEMS.filter((item) => item.liked).map((item) => item.id)))
  const [publishStates, setPublishStates] = useState<Record<string, PublishState>>({})
  const [deletedIds, setDeletedIds] = useState(() => new Set<string>())
  const [pendingPublishId, setPendingPublishId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { isSignedIn, requireSignIn, openSignIn } = useAuth()
  const deleteTransition = useMountTransition(!!pendingDeleteId)

  // History is personal data — signed-out visitors (e.g. a direct link, not
  // just a nav click) get the sign-in modal instead of ever seeing the
  // page content, matching the same rule on AccountPage.
  useEffect(() => {
    if (!isSignedIn) openSignIn()
  }, [isSignedIn, openSignIn])

  useEffect(() => {
    if (!openMenuId) return
    function closeMenu(event: MouseEvent) {
      if (!(event.target as Element).closest('.history-card__menu-shell')) setOpenMenuId(null)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMenuId])

  useEffect(() => {
    const reviewIds = Object.entries(publishStates).filter(([, state]) => state === 'review').map(([id]) => id)
    if (reviewIds.length === 0) return
    const timer = window.setTimeout(() => {
      setPublishStates((current) => {
        const next = { ...current }
        reviewIds.forEach((id) => {
          if (next[id] === 'review') next[id] = 'published'
        })
        return next
      })
      setToastMessage('Published success')
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [publishStates])

  const visibleItems = HISTORY_ITEMS.filter((item) => {
    if (deletedIds.has(item.id)) return false
    if (activeTab === 'All') return true
    if (activeTab === 'Music Videos') return item.type === 'Music Video' || item.type === 'Storyboard'
    if (activeTab === 'Songs') return item.type === 'Song'
    return likedIds.has(item.id)
  })

  function toggleSet(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
    setter((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handlePublishChange(itemId: string, nextPublished: boolean) {
    setOpenMenuId(itemId)
    if (nextPublished) {
      const item = HISTORY_ITEMS.find((candidate) => candidate.id === itemId)
      if (item?.type === 'Music Video') setPendingPublishId(itemId)
      else {
        setPublishStates((current) => ({ ...current, [itemId]: 'published' }))
        setToastMessage('Published success')
      }
      return
    }
    setPublishStates((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
    setToastMessage('Unpublished success')
  }

  function confirmPublish() {
    if (!pendingPublishId) return
    setPublishStates((current) => ({ ...current, [pendingPublishId]: 'review' }))
    setPendingPublishId(null)
  }

  function confirmDelete() {
    if (!pendingDeleteId) return
    setDeletedIds((current) => new Set(current).add(pendingDeleteId))
    setOpenMenuId(null)
    setPendingDeleteId(null)
  }

  function runPrimaryAction(item: HistoryItem) {
    const destination = item.type === 'Storyboard'
      ? '/mv-storyboard?from=history&stage=edit'
      : `/mv-create?from=history&song=${encodeURIComponent(item.id)}`
    requireSignIn(() => { window.location.href = destination })
  }

  if (!isSignedIn) {
    return (
      <AppLayout navbar={<RoomNavbar title="My Creations" credits={0} />} showMobileTabBar>
        <div className="history-page" />
      </AppLayout>
    )
  }

  return (
    <AppLayout
      navbar={
        <RoomNavbar
          title="My Creations"
          credits={390}
          tabsSlot={
            <div className="history-page__tabs">
              <Tabs tabs={TABS} active={activeTab} onChange={(tab) => { setActiveTab(tab as HistoryTab); setOpenMenuId(null) }} />
            </div>
          }
        />
      }
      showMobileTabBar
    >
      <div className="history-page">
        <div className="history-page__grid">
          {visibleItems.map((item) => (
            <HistoryCard
              key={item.id}
              item={{ ...item, href: itemHref(item, activeTab) }}
              menuOpen={openMenuId === item.id}
              liked={likedIds.has(item.id)}
              publishState={publishStates[item.id]}
              onToggleMenu={() => setOpenMenuId((current) => current === item.id ? null : item.id)}
              onCloseMenu={() => setOpenMenuId(null)}
              onToggleLike={() => toggleSet(setLikedIds, item.id)}
              onTogglePublish={(nextPublished) => handlePublishChange(item.id, nextPublished)}
              onPrimaryAction={() => runPrimaryAction(item)}
              onDelete={() => setPendingDeleteId(item.id)}
            />
          ))}
        </div>
      </div>
      <PublishDialog
        isOpen={!!pendingPublishId}
        onCancel={() => setPendingPublishId(null)}
        onConfirm={confirmPublish}
      />
      {deleteTransition.shouldRender && (
        <div
          className={`history-publish-dialog__backdrop${deleteTransition.visible ? ' history-publish-dialog__backdrop--visible' : ''}`}
          role="presentation"
          onMouseDown={() => setPendingDeleteId(null)}
        >
          <section className="history-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="history-delete-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="history-delete-dialog-title">Delete this creation?</h2>
            <p>This creation will be removed from your history. This action cannot be undone.</p>
            <div className="history-publish-dialog__actions">
              <button type="button" onClick={() => setPendingDeleteId(null)}>Cancel</button>
              <button type="button" className="history-publish-dialog__delete" onClick={confirmDelete}>Delete</button>
            </div>
          </section>
        </div>
      )}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </AppLayout>
  )
}

export default HistoryPage
