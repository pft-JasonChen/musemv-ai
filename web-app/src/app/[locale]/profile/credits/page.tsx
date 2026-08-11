import { CreditsView } from "@/components/credits/CreditsView";
import { AuthGuard } from "@/components/auth/AuthGuard";

// New route (designer request, 2026-08-11): Credits Detail moves from a modal
// to a real page, matching DP's `/account/credits`. See CreditsView.tsx for
// why this was a modal in the first place and what changed. C7 route-map
// snapshot + docs/CHANGELOG-RD.md updated in the same change (G4-c/G4-g).
export default function Page() {
  return (
    <AuthGuard>
      <CreditsView />
    </AuthGuard>
  );
}
