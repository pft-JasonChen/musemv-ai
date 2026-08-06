import { useState } from 'react'
import ButtonPillShowcase from './ButtonPillShowcase'
import IconButtonShowcase from './IconButtonShowcase'
import CardShowcase from './CardShowcase'
import ListItemShowcase from './ListItemShowcase'
import BadgeShowcase from './BadgeShowcase'
import TabsShowcase from './TabsShowcase'
import './ComponentsPage.css'

const NAV_ITEMS = [
  { key: 'button-pill', label: 'Button / Pill' },
  { key: 'icon-button', label: 'Icon Button' },
  { key: 'card', label: 'Card' },
  { key: 'list-item', label: 'List Item' },
  { key: 'badge', label: 'Badge' },
  { key: 'tabs', label: 'Tabs' },
] as const

type ComponentKey = (typeof NAV_ITEMS)[number]['key']

function ComponentsPage() {
  const [activeKey, setActiveKey] = useState<ComponentKey>('button-pill')

  return (
    <div className="components-page">
      <h1 className="components-page__title type-display">YCM Components</h1>

      <div className="components-page__layout">
        <nav className="components-page__sidebar">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                'components-page__nav-item type-body-m' +
                (item.key === activeKey ? ' components-page__nav-item--active' : '')
              }
              onClick={() => setActiveKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="components-page__content">
          {activeKey === 'button-pill' && <ButtonPillShowcase />}
          {activeKey === 'icon-button' && <IconButtonShowcase />}
          {activeKey === 'card' && <CardShowcase />}
          {activeKey === 'list-item' && <ListItemShowcase />}
          {activeKey === 'badge' && <BadgeShowcase />}
          {activeKey === 'tabs' && <TabsShowcase />}
        </div>
      </div>
    </div>
  )
}

export default ComponentsPage
