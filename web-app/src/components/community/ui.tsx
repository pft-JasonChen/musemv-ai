"use client";

/**
 * WA's original Tailwind community primitives.
 *
 * ── ONLY `Heart` AND `Share` SURVIVE, AND ONLY FOR ONE CALLER ──────────────
 *
 * Everything else here (`Headphones`, `Play`, `ChevronRight`, `BadgePill`,
 * `Stats`, `SectionHead`) was deleted when the landing page migrated — it was
 * their last call site, and the designer UI supplies each one:
 * `ui/SectionHeader` for the heading, `ui/Card`'s `card__badge` for the pill,
 * `ui/ListItem`'s `list-item__social-row` for the stats, and `DpIcon` for the
 * glyphs. Keeping them "just in case" is how the six dead components deleted on
 * 2026-08-06 accumulated in the first place.
 *
 * `Heart` and `Share` stay because `/history`'s ⋯ overflow menu still draws
 * them, and that menu is NOT migrated — it is still WA's Tailwind popover. They
 * go with it when it moves.
 */
export function Heart({ size = 12, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
export function Share({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}
