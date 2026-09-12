// Route-segment loading fallback (YMW260911P0004). Next mounts this
// automatically as the Suspense boundary around every page under [locale]
// while its chunk streams in, replacing what was otherwise a blank/gray
// `<main>` with no feedback on a slow load or a route switch (e.g. AI Music
// Video <-> AI Song). AppShell (sidebar, nav) is the stable parent layout and
// keeps rendering around this — only the page content area shows the spinner.
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin"
        aria-hidden
      >
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />
      </svg>
    </div>
  );
}
