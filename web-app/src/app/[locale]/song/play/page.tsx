import { Suspense } from "react";
import { SongDetailView } from "@/components/song/SongDetailView";

/**
 * Same view as `/explore/songs` — slice 3b merged them (plan §4). This URL's job
 * is the `?id=` form: on desktop it preselects the right column, on a phone it
 * opens the full-screen player.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SongDetailView />
    </Suspense>
  );
}
