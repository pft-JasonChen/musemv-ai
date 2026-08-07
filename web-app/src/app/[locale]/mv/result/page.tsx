import { Suspense } from "react";
import { MvResult } from "@/components/mv/MvResult";

export default function Page() {
  // `MvResult` reads `?id=` (the share id when the screen was opened from a
  // /history row), so it must be inside a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <MvResult />
    </Suspense>
  );
}
