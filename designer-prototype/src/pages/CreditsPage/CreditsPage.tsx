import type { CSSProperties } from 'react'
import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import DetailNavbar from '../../components/DetailNavbar/DetailNavbar'
import Tabs from '../../components/Tabs/Tabs'
import Button from '../../components/Button/Button'
import CreditsDialog from '../../components/CreditsDialog/CreditsDialog'
import icCredit from '../../assets/icons/ic_credit.svg'
import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icSongAi from '../../assets/icons/ic_song_ai.svg'
import icScript from '../../assets/icons/ic_script.svg'
import icCrown from '../../assets/icons/ic_crown.svg'
import icGift from '../../assets/icons/ic_gift.svg'
import './CreditsPage.css'

type CreditTab = 'All' | 'Spend' | 'Earn'

interface CreditEntry {
  id: string
  title: string
  date: string
  amount: number
  icon: string
}

const CREDIT_TABS: CreditTab[] = ['All', 'Spend', 'Earn']
const CREDIT_ENTRIES: CreditEntry[] = [
  { id: 'mv-1', title: 'AI Music Video', date: '2026-06-05, 14:23', amount: -200, icon: icVideoAi },
  { id: 'song-1', title: 'AI Song', date: '2026-06-05, 11:04', amount: -10, icon: icSongAi },
  { id: 'purchase', title: 'Credit Purchase', date: '2026-06-04, 09:00', amount: 300, icon: icCredit },
  { id: 'mv-2', title: 'AI Music Video', date: '2026-06-03, 13:30', amount: -200, icon: icVideoAi },
  { id: 'storyboard', title: 'Storyboard', date: '2026-06-02, 10:05', amount: -20, icon: icScript },
  { id: 'song-2', title: 'AI Song', date: '2026-06-01, 14:35', amount: -10, icon: icSongAi },
  { id: 'subscription', title: 'Monthly Subscription', date: '2026-06-01, 12:30', amount: 2000, icon: icCrown },
  { id: 'new-user', title: 'New User', date: '2026-06-01, 09:00', amount: 10, icon: icGift },
]

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function CreditsPage() {
  const [activeTab, setActiveTab] = useState<CreditTab>('All')
  const [buyOpen, setBuyOpen] = useState(false)
  const visibleEntries = CREDIT_ENTRIES.filter((entry) => {
    if (activeTab === 'Spend') return entry.amount < 0
    if (activeTab === 'Earn') return entry.amount > 0
    return true
  })

  return (
    <AppLayout
      navbar={<DetailNavbar credits={390} backHref="/account" title="Credits Detail" />}
      showMobileHeader={false}
    >
      <section className="credits-page">
        <div className="credits-page__content">
          <div className="credits-page__balance">
            <div>
              <p>YOUR BALANCE</p>
              <strong><img src={icCredit} alt="" />360 <span>Credits</span></strong>
            </div>
            <Button size="Small" variant="PrimaryPayg" onClick={() => setBuyOpen(true)}>Buy More</Button>
          </div>

          <div className="credits-page__tabs">
            <Tabs tabs={CREDIT_TABS} active={activeTab} onChange={(tab) => setActiveTab(tab as CreditTab)} />
          </div>

          <div className="credits-page__list">
            {visibleEntries.map((entry) => (
              <div className="credits-page__entry" key={entry.id}>
                <span className="credits-page__entry-icon">
                  {/* Credit Purchase reuses the same coin artwork as the balance
                      hero above — rendered as a plain <img> (not the shared
                      currentColor mask) so it keeps its own gold color instead
                      of turning white like the other masked entry icons. */}
                  {entry.icon === icCredit ? (
                    <img src={icCredit} alt="" />
                  ) : (
                    <span style={maskStyle(entry.icon)} />
                  )}
                </span>
                <span className="credits-page__entry-copy"><strong>{entry.title}</strong><time>{entry.date}</time></span>
                <strong className={entry.amount > 0 ? 'credits-page__amount credits-page__amount--earned' : 'credits-page__amount'}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CreditsDialog isOpen={buyOpen} onClose={() => setBuyOpen(false)} balance={360} />
    </AppLayout>
  )
}

export default CreditsPage
