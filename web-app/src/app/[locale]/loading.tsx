import { LoadingDots } from "@/components/ui/LoadingDots";

// Route-segment loading fallback (YMW260911P0004). Next mounts this
// automatically as the Suspense boundary around every page under [locale]
// while its chunk streams in, replacing what was otherwise a blank/gray
// `<main>` with no feedback on a route switch (e.g. AI Music Video <-> AI
// Song). AppShell (sidebar, nav) is the stable parent layout and keeps
// rendering around this — only the page content area shows the dots.
//
// Reuses History's own "slow load" 3-dot animation (`LoadingDots`,
// `?demo=1` panel's "History — slow load") rather than a new spinner —
// product owner, 2026-09-14: every loading state in the app should be this
// same UI, not a screen-by-screen invention. `.history-page__loading`'s
// centering (including its `min-height: 60vh`) is reused verbatim too.
export default function Loading() {
  return (
    <div className="history-page__loading">
      <LoadingDots />
    </div>
  );
}
