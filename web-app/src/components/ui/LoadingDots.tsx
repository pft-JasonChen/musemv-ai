/**
 * Shared "3-dot" loading indicator. Originally History's own
 * (`HistoryView.tsx`, product owner 2026-08-31, Figma "History — Loading"
 * 3261:44705, `?demo=1` panel's "History — slow load") — extracted here so
 * every other loading state reuses the same component instead of each
 * screen inventing its own (`YMW260911P0004`, product owner 2026-09-14: "loading 狀況請統一改成用那個UI，不要寫新的UI").
 *
 * The design is a static two-frame snapshot (one dot raised, the other two
 * at rest) rather than a real animation export — matches the CSS
 * `@keyframes` in `designer-overrides.css`: each dot floats up 8px and back,
 * staggered 150ms after the previous one, "one after another" per the
 * product owner's own description.
 */
export function LoadingDots() {
  return (
    <div className="history-page__loading-dots" role="status" aria-label="Loading">
      <span className="history-page__loading-dot history-page__loading-dot--1" />
      <span className="history-page__loading-dot history-page__loading-dot--2" />
      <span className="history-page__loading-dot history-page__loading-dot--3" />
    </div>
  );
}
