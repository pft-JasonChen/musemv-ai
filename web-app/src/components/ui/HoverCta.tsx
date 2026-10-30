"use client";

/**
 * The hover CTA a card shows in its middle — "Use Skill" on the AI Shorts
 * skill cards, "Use" on Home's Music Video / Song inspiration cards (product
 * owner, 2026-10-30: one component, one look). A white pill, hidden until the
 * card is hovered or focused, never drawn on touch screens (the card itself is
 * the target there). Styles: `.hover-cta` in `agent.css`.
 *
 * The parent card must be `position: relative` and listed in the reveal rule
 * beside `.hover-cta`.
 *
 * · With `onClick` it is a real `<button>` (the inspiration card: the CTA and
 *   the card are separate controls).
 * · Without, it is a decorative `<span>` (the skill card: the whole tile is
 *   already a button, which may not contain another; its label names it).
 *
 * One size, medium (product owner, 2026-10-30): 15px on an 8 × 18px pill.
 */
export function HoverCta({ label, onClick }: { label: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <button type="button" className="hover-cta" onClick={onClick}>
        {label}
      </button>
    );
  }
  return (
    <span className="hover-cta" aria-hidden="true">
      {label}
    </span>
  );
}
