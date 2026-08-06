/**
 * DP's `ToggleSwitch` (`src/styles/designer/ToggleSwitch.css`), ported on its
 * first consumer — the `/creator` per-item options menu's Publish row.
 *
 * DP renders the label as a plain `<span>` next to the switch and passes the
 * same text as `aria-label`. That is kept: the label sits outside the control in
 * DP's layout (`.community-profile__menu-publish` justifies them apart), so
 * wrapping them in a `<label>` would change the box model the stylesheet expects.
 *
 * `role="switch"` + `aria-checked` rather than a checkbox input — DP's CSS styles
 * `.toggle-switch__track` as the visual control, and a real input would have to be
 * hidden and mirrored, which buys nothing here.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible text rendered beside the switch. DP uses it on Song Create. */
  label?: string;
  /**
   * Accessible name when the visible text is NOT part of this component — the
   * `/creator` menu puts "Publish" in a sibling span, which DP's version leaves
   * the switch with no accessible name at all. Passing `label` there instead
   * would print the name into the menu row; measured, it did.
   */
  ariaLabel?: string;
}) {
  return (
    <div className="toggle-switch">
      {label && <span className="toggle-switch__label">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        className={`toggle-switch__track${checked ? " toggle-switch__track--on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-switch__knob" />
      </button>
    </div>
  );
}
