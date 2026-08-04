import './Tabs.css'

// Figma "Bar/Tabs" (node 1409:35934) — pill tab bar, first tab styled active.

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`tabs__tab${tab === active ? ' tabs__tab--active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export default Tabs
