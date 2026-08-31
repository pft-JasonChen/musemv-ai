import { forwardRef } from "react";
import { DpIcon } from "@/components/ui/DpIcon";

/**
 * DP's `IconButton` (`src/styles/designer/IconButton.css`), extracted on its
 * third hand-written copy — `DetailNavbar` and `MobileHeader` each inline the
 * class triplet, and `/creator` needs three per row.
 *
 * The icon is named, not imported: DP passes a Vite-inlined asset URL, WA serves
 * the same file from `public/assets/icons/ui/` (D4). `DpIcon` owns that mapping,
 * so this component never builds a `url()` of its own.
 *
 * `label` is required and has no visible counterpart, so it is the accessible
 * name — a variant with visible text is `Button`, not this.
 *
 * `forwardRef`, added 2026-08-31 for `CreatorProfile`'s own menu trigger —
 * synced onto History's `.history-card__menu` (portal + fixed positioning),
 * which needs the trigger's real `getBoundingClientRect()` to place the menu.
 */
export const IconButton = forwardRef<
  HTMLButtonElement,
  {
    size?: "large" | "medium" | "small" | "xsmall";
    variant?: "primary" | "secondary" | "tertiary" | "ghost";
    disabled?: boolean;
    /** Icon filename under `public/assets/icons/ui/`, without the extension. */
    icon: string;
    label: string;
    onClick?: () => void;
    className?: string;
  }
>(function IconButton(
  { size = "large", variant = "primary", disabled = false, icon, label, onClick, className },
  ref,
) {
  const classes = ["icon-button", `icon-button--${size}`, `icon-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type="button"
      className={classes}
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      <DpIcon name={icon} className="icon-button__icon" />
    </button>
  );
});
