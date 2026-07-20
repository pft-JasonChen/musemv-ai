import { MvRoom } from "@/components/mv/MvRoom";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function MvRoomPage() {
  return (
    <AuthGuard>
      <MvRoom />
    </AuthGuard>
  );
}
