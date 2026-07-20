import { Suspense } from "react";
import { CreatorProfile } from "@/components/community/CreatorProfile";

export default function Page() {
  return (
    <Suspense>
      <CreatorProfile />
    </Suspense>
  );
}
