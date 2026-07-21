import { Suspense } from "react";
import { ShareLinkView } from "@/components/share/ShareLinkView";

// Public share-link page: domain/share?id={hash} (spec P2-S1).
export default function Page() {
  return (
    <Suspense>
      <ShareLinkView />
    </Suspense>
  );
}
