import { Suspense } from "react";
import { CommunitySongPlayer } from "@/components/community/CommunitySongPlayer";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CommunitySongPlayer />
    </Suspense>
  );
}
