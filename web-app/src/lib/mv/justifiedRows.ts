/**
 * Justified-row grid maths, ported verbatim in behaviour from DP's
 * `MVDetailPage.tsx` (plan Phase 3, /explore/mvs slice).
 *
 * Each row is filled edge to edge before wrapping, instead of flex-wrap's
 * default of leaving whatever remainder sits at the end of each row (visible as
 * a ragged gap on the second row). Cover height is shared per row and picked
 * within [MIN_ROW_HEIGHT, MAX_ROW_HEIGHT], so a row mixing 3:4 and 4:3 items
 * still lines up, and each item's width is that shared height times its own
 * aspect ratio.
 *
 * It lives in `lib/` rather than beside the component because it is pure
 * arithmetic with fiddly edge cases (see the tests) — DP could not test it, we
 * can, and later screens reusing the gallery get it for free.
 */

export type MvRatio = "3:4" | "4:3";

export const GRID_GAP = 20;
export const MIN_ROW_HEIGHT = 240;
export const MAX_ROW_HEIGHT = 280;
/** Below this the rows have no room to justify — the caller falls back to a
 *  plain wrapping grid. Matches the agreed 1024 breakpoint tier. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

export function aspectRatioOf(ratio: MvRatio): number {
  return ratio === "4:3" ? 4 / 3 : 3 / 4;
}

export interface JustifiedRow<T> {
  items: T[];
  coverHeight: number;
}

/**
 * @param containerWidth measured width in px; 0 (not yet measured) yields a
 *        single unsplit row at MAX_ROW_HEIGHT so the first paint is not empty.
 */
export function computeJustifiedRows<T extends { ratio: MvRatio }>(
  items: readonly T[],
  containerWidth: number,
): JustifiedRow<T>[] {
  if (containerWidth <= 0) return [{ items: [...items], coverHeight: MAX_ROW_HEIGHT }];

  const rows: JustifiedRow<T>[] = [];
  let i = 0;

  while (i < items.length) {
    let aspectSum = 0;
    let count = 0;
    let height = MAX_ROW_HEIGHT;
    let ranOutOfItems = true;

    while (i + count < items.length) {
      const aspect = aspectRatioOf(items[i + count].ratio);
      const newAspectSum = aspectSum + aspect;
      const newCount = count + 1;
      const availableWidth = containerWidth - GRID_GAP * (newCount - 1);
      const heightIfIncluded = availableWidth / newAspectSum;

      if (count === 0 || heightIfIncluded >= MIN_ROW_HEIGHT) {
        aspectSum = newAspectSum;
        count = newCount;
        height = heightIfIncluded;
        continue;
      }

      // Adding the next item would shrink the row below the floor. Pick
      // whichever of "stop here" (row ends up taller than MAX) or "include it
      // anyway" (row ends up shorter than MIN) lands closer to the target
      // range — either way the row still fills the container exactly, since
      // neither branch clamps.
      const overshootIfStop = Math.max(0, height - MAX_ROW_HEIGHT);
      const undershootIfInclude = MIN_ROW_HEIGHT - heightIfIncluded;
      if (undershootIfInclude < overshootIfStop) {
        aspectSum = newAspectSum;
        count = newCount;
        height = heightIfIncluded;
      }
      ranOutOfItems = false;
      break;
    }

    // Only the trailing row (stopped because there simply weren't enough items
    // left, not because of a deliberate fit decision) is allowed to not fully
    // justify — clamp its height instead of stretching content that isn't
    // there to fill the row.
    if (ranOutOfItems) {
      height = Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, height));
    }

    rows.push({ items: items.slice(i, i + count), coverHeight: height });
    i += count;
  }

  return rows;
}
