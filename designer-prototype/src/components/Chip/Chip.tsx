import './Chip.css'

// Figma "Chip" — Genre/Mood/Vocal style picker on Song Create's Custom panel
// (node 1367:32359's Chips groups). Selected = purple outline + tint.

interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip${selected ? ' chip--selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default Chip
