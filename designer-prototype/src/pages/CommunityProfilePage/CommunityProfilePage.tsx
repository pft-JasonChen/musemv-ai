import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import DetailNavbar from '../../components/DetailNavbar/DetailNavbar'
import Tabs from '../../components/Tabs/Tabs'
import IconButton from '../../components/IconButton/IconButton'
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch'
import ShareDialog, { shareOrOpenDialog } from '../../components/ShareDialog/ShareDialog'
import PublishDialog from '../../components/PublishDialog/PublishDialog'
import Toast from '../../components/Toast/Toast'
import { useAuth } from '../../components/AuthProvider/AuthProvider'
import { MUSIC_VIDEOS } from '../../data/musicVideos'
import { SONGS } from '../../data/songs'
import { isOwnUsername } from '../../data/profile'
import avatar from '../../assets/covers/Avatar/Sample_P3.png'
import icAccount from '../../assets/icons/ic_account.svg'
import icVideo from '../../assets/icons/ic_video.svg'
import icSong from '../../assets/icons/ic_song.svg'
import icHeadphones from '../../assets/icons/ic_headphones.svg'
import icFavoriteOff from '../../assets/icons/ic_favorite_off.svg'
import icFavoriteOn from '../../assets/icons/ic_favorite_on.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icMore from '../../assets/icons/ic_more.svg'
import icEdit from '../../assets/icons/ic_edit.svg'
import icPublish from '../../assets/icons/ic_publish.svg'
import icDownload from '../../assets/icons/ic_download.svg'
import icDelete from '../../assets/icons/ic_delete.svg'
import './CommunityProfilePage.css'

type ProfileTab = 'Music Videos' | 'Songs'

interface ProfileItem {
  id: string
  title: string
  cover: string
  href: string
  type: ProfileTab
}

const PROFILE_TABS: ProfileTab[] = ['Music Videos', 'Songs']

// "Back" should return wherever the user actually came from (an avatar
// click from any content page — Song Detail, MV Detail, etc.) rather than
// always landing on /account, which is only correct for the one flow that
// reaches this page via Account's own MVs/Songs stat links.
function computeBackHref(): string {
  try {
    const referrerUrl = new URL(document.referrer)
    if (referrerUrl.origin === window.location.origin) {
      return referrerUrl.pathname + referrerUrl.search
    }
  } catch {
    // No referrer (direct visit) or unparsable — fall through to default.
  }
  return '/account'
}

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function toggleSet(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
  setter((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}

function CommunityProfilePage() {
  const params = new URLSearchParams(window.location.search)
  const requestedTab = params.get('tab')
  // Figma "Community Profile — Song" (node 1711:42478, someone else's — no
  // per-item More icon since you can't edit their content) vs "Community
  // User Profile — MV" (node 1711:43159, your own — keeps the More menu).
  const requestedUser = params.get('user')
  const isOwnProfile = !requestedUser || isOwnUsername(requestedUser)
  const backHref = computeBackHref()
  const displayName = isOwnProfile ? 'Scott Wu' : requestedUser!
  const displayEmail = isOwnProfile
    ? 'scott_wu@mail.com'
    : `${requestedUser!.toLowerCase().replace(/\s+/g, '_')}@mail.com`
  const [activeTab, setActiveTab] = useState<ProfileTab>(requestedTab === 'songs' ? 'Songs' : 'Music Videos')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState(() => new Set<string>())
  const [publishedIds, setPublishedIds] = useState(() => new Set<string>())
  const [shareItem, setShareItem] = useState<ProfileItem | null>(null)
  const [pendingPublishItem, setPendingPublishItem] = useState<ProfileItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { isSignedIn, openSignIn } = useAuth()

  // Music Videos confirm first (PublishDialog's "Ready to Go Public?");
  // Songs just toast — same MV-vs-Song split as History/MV Result/Song
  // Create.
  function handlePublishToggle(item: ProfileItem, nextPublished: boolean) {
    setOpenMenuId(null)
    if (nextPublished && item.type === 'Music Videos') {
      setPendingPublishItem(item)
      return
    }
    toggleSet(setPublishedIds, item.id)
    setToastMessage(nextPublished ? 'Published success' : 'Unpublished success')
  }

  function confirmItemPublish() {
    if (!pendingPublishItem) return
    toggleSet(setPublishedIds, pendingPublishItem.id)
    setPendingPublishItem(null)
    setToastMessage('Published success')
  }

  // Someone else's profile is public — only your OWN profile is gated,
  // same "must be signed in" convention as Account/History.
  useEffect(() => {
    if (isOwnProfile && !isSignedIn) openSignIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnProfile, isSignedIn, openSignIn])

  // Carries `from=community-profile` so MVDetailPage/SongDetailPage's own
  // back button returns here instead of defaulting to /home — same
  // click-source convention already used from Home/Create/History.
  const items = useMemo<ProfileItem[]>(() => activeTab === 'Music Videos'
    ? MUSIC_VIDEOS.slice(0, 7).map((item) => ({ id: item.id, title: item.title, cover: item.cover, href: `/mv-detail?id=${item.id}&from=community-profile`, type: 'Music Videos' }))
    : SONGS.slice(0, 7).map((item) => ({ id: item.id, title: item.title, cover: item.cover, href: `/song-detail?id=${item.id}&from=community-profile`, type: 'Songs' })), [activeTab])

  useEffect(() => {
    if (!openMenuId) return
    function closeMenu(event: MouseEvent) {
      if (!(event.target as Element).closest('.community-profile__menu-shell')) setOpenMenuId(null)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMenuId])

  function changeTab(tab: ProfileTab) {
    setActiveTab(tab)
    setOpenMenuId(null)
    window.history.replaceState(null, '', `/community-profile?tab=${tab === 'Songs' ? 'songs' : 'music-videos'}`)
  }

  if (isOwnProfile && !isSignedIn) {
    return (
      <AppLayout navbar={<DetailNavbar credits={0} backHref="/account" mobileTitle="Profile" />} showMobileHeader={false}>
        <section className="community-profile" />
      </AppLayout>
    )
  }

  return (
    <AppLayout navbar={<DetailNavbar credits={390} backHref={backHref} mobileTitle={displayName} />} showMobileHeader={false}>
      <section className="community-profile">
        <aside className="community-profile__summary">
          <div className="community-profile__identity">
            {isOwnProfile ? (
              <img src={avatar} alt={displayName} />
            ) : (
              <span className="community-profile__avatar-fallback">
                <span style={maskStyle(icAccount)} />
              </span>
            )}
            <div><h1>{displayName}</h1><p>{displayEmail}</p></div>
          </div>
          <div className="community-profile__stats">
            <div><strong>1.2k</strong><span>Plays</span></div><i />
            <div><strong>472</strong><span>Likes</span></div>
          </div>
        </aside>

        <div className="community-profile__main">
          <Tabs tabs={PROFILE_TABS} active={activeTab} onChange={(tab) => changeTab(tab as ProfileTab)} />
          <div className="community-profile__list">
            {items.map((item) => {
              const liked = likedIds.has(item.id)
              const published = publishedIds.has(item.id)
              const menuOpen = openMenuId === item.id
              return (
                <article className="community-profile__item" key={item.id}>
                  <a className="community-profile__item-main" href={item.href}>
                    <span className="community-profile__cover">
                      <img src={item.cover} alt="" />
                      <span style={maskStyle(item.type === 'Music Videos' ? icVideo : icSong)} />
                    </span>
                    <span className="community-profile__copy">
                      <strong>{item.title}</strong>
                      <span className="community-profile__social">
                        <span><i style={maskStyle(icHeadphones)} />108</span>
                        <span><i style={maskStyle(icFavoriteOff)} />38</span>
                        <span><i style={maskStyle(icShare)} />15</span>
                      </span>
                      <time>2026-06-05</time>
                    </span>
                  </a>
                  <div className="community-profile__actions">
                    <IconButton size="Small" variant="Ghost" icon={liked ? icFavoriteOn : icFavoriteOff} label={liked ? 'Unlike' : 'Like'} onClick={() => toggleSet(setLikedIds, item.id)} />
                    <IconButton size="Small" variant="Ghost" icon={icShare} label="Share" onClick={() => shareOrOpenDialog(item.title, () => setShareItem(item))} />
                    {isOwnProfile && (
                      <div className="community-profile__menu-shell">
                        <IconButton size="XSmall" variant="Tertiary" icon={icMore} label="More" onClick={() => setOpenMenuId((current) => current === item.id ? null : item.id)} />
                        {menuOpen && (
                          <div className="community-profile__menu" role="menu">
                            <a href={item.type === 'Music Videos' ? '/mv-edit' : '/song-create'} className="community-profile__menu-primary" role="menuitem"><span style={maskStyle(icEdit)} />{item.type === 'Music Videos' ? 'Edit MV' : 'Edit Song'}</a>
                            <button type="button" role="menuitem" onClick={() => toggleSet(setLikedIds, item.id)}><span style={maskStyle(liked ? icFavoriteOn : icFavoriteOff)} />{liked ? 'Unlike' : 'Like'}</button>
                            <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); shareOrOpenDialog(item.title, () => setShareItem(item)) }}><span style={maskStyle(icShare)} />Share</button>
                            <div className="community-profile__menu-publish"><span><i style={maskStyle(icPublish)} />Publish</span><ToggleSwitch checked={published} onChange={(next) => handlePublishToggle(item, next)} /></div>
                            <button type="button" role="menuitem" onClick={() => setOpenMenuId(null)}><span style={maskStyle(icDownload)} />Download</button>
                            <button type="button" role="menuitem" className="community-profile__menu-delete" onClick={() => setOpenMenuId(null)}><span style={maskStyle(icDelete)} />Delete</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
      <ShareDialog title={shareItem?.title ?? ''} isOpen={shareItem !== null} onClose={() => setShareItem(null)} />
      <PublishDialog
        isOpen={pendingPublishItem !== null}
        onCancel={() => setPendingPublishItem(null)}
        onConfirm={confirmItemPublish}
      />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </AppLayout>
  )
}

export default CommunityProfilePage
