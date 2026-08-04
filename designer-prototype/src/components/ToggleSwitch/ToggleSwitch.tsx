import './ToggleSwitch.css'

// Figma "Selection/Toggle" — the Instrumental switch on Song Create's Simple
// and Custom panels (nodes 1357:30174 / 1367:32358's Subheader).

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <div className="toggle-switch">
      {label && <span className="toggle-switch__label">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`toggle-switch__track${checked ? ' toggle-switch__track--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-switch__knob" />
      </button>
    </div>
  )
}

export default ToggleSwitch
