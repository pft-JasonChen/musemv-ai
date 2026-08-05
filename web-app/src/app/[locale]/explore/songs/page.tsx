import { Suspense } from "react";
import { SongDetailView } from "@/components/song/SongDetailView";

/**
 * Slice 3b merged this screen with `/song/play` — one view, two URLs (plan §4).
 * Both routes are kept so C7 stays at zero diff and existing links still work.
 *
 * `<Suspense>` is new here and is required, not decorative: the view reads
 * `?id=` / `?tab=` through `useSearchParams`.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SongDetailView />
    </Suspense>
  );
}
