import { Suspense } from "react";
import { SongResultView } from "@/components/song/SongResultView";

export default function Page() {
  // `SongResultView` reads `?id=` (the share id when the screen was opened from
  // a /history row), so it must be inside a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <SongResultView />
    </Suspense>
  );
}
