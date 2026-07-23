import { SettingsView } from "@/components/profile/SettingsView";
import { AuthGuard } from "@/components/auth/AuthGuard";

// PROF-03: Settings is reached via the (gated) account and is itself gated —
// it now hosts Sign Out, so a guest must sign in before landing here.
export default function Page() {
  return (
    <AuthGuard>
      <SettingsView />
    </AuthGuard>
  );
}
