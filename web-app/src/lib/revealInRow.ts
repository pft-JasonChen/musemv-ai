/**
 * Scrolls a chip or tile fully into view inside its horizontal row, clear of the
 * row's faded edge (`.edge-fade` fades 56px; product owner, 2026-11-27). Picking
 * something that sits half under that fade scrolls it out; in a row that fits, or
 * at the row's ends, `scrollBy` has nothing to do.
 *
 * Extracted on its third consumer (Home's `ExploreRow` and `AgentComposer`, and
 * `/mv/room`'s template and sample-character rows) — the arithmetic was already
 * written out twice.
 */
const EDGE_FADE = 56;

export function revealInRow(el: HTMLElement, row: HTMLElement | null = el.parentElement) {
  if (!row) return;
  const item = el.getBoundingClientRect();
  const box = row.getBoundingClientRect();
  const left = item.left - (box.left + EDGE_FADE);
  const right = item.right - (box.right - EDGE_FADE);
  if (left < 0) row.scrollBy({ left, behavior: "smooth" });
  else if (right > 0) row.scrollBy({ left: right, behavior: "smooth" });
}
