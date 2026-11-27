import type { ComposeState } from "./types";

/**
 * "This compose form has been used up" — the one bit of state behind /mv/room opening
 * EMPTY after an MV has been made (product owner, 2026-11-27).
 *
 * The form lives in `MvFlowProvider` and survives navigation on purpose: the result
 * page, the storyboard editor and Merge all read it. So it cannot be cleared when the
 * MV finishes. Instead the result page marks the form it is showing as spent, and the
 * next time /mv/room opens it empties the form **only if it is still that exact
 * object** — i.e. nobody has touched it since. Anything that carries something into
 * the room first (Home's MV input, a community MV's "Create", a song's "Use in MV")
 * calls `setCompose` / `patchCompose`, which makes a NEW object, so those hand-offs
 * are never wiped. The Recreate button on the result page un-marks it to keep the form.
 *
 * Module state, not provider state, so the RD-facing provider surface (C4, add-only)
 * is not widened for a UI policy.
 */
let spent: ComposeState | null = null;

/** Mark `compose` as spent, or pass `null` to keep it (Recreate). */
export function markComposeSpent(compose: ComposeState | null): void {
  spent = compose;
}

/** True once, when `current` is the form that was marked and nothing has changed it. */
export function consumeSpentCompose(current: ComposeState): boolean {
  const hit = spent !== null && spent === current;
  spent = null;
  return hit;
}
