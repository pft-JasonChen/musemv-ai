import { useState } from 'react'
import Tabs from '../../components/Tabs/Tabs'

const TAB_OPTIONS = ['All', 'Music Videos', 'Songs', 'Liked']

function TabsShowcase() {
  const [active, setActive] = useState(TAB_OPTIONS[0])

  return (
    <section className="components-page__component">
      <h2 className="components-page__component-name type-title-l">Tabs</h2>
      <p className="components-page__hint type-caption-m">
        Figma "Bar/Tabs" — 桌機（node 1357:30289）8px 16px padding + Label/M 13px Bold，剛好 34px 高；App-mobile（node
        283:6506）5px 10px padding + Caption/M 11px Medium，剛好 26px 高。同一個元件、同一組顏色 token（inactive
        white-60、active 紫底白字），手機版只有尺寸縮小。
      </p>
      <div className="components-page__row">
        <Tabs tabs={TAB_OPTIONS} active={active} onChange={setActive} />
      </div>
    </section>
  )
}

export default TabsShowcase
