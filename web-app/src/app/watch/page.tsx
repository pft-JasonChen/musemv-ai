import { Suspense } from "react";
import { CommunityMvPlayer } from "@/components/community/CommunityMvPlayer";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CommunityMvPlayer />
    </Suspense>
  );
}
