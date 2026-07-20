import { ProfileView } from "@/components/profile/ProfileView";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function Page() {
  return (
    <AuthGuard>
      <ProfileView />
    </AuthGuard>
  );
}
