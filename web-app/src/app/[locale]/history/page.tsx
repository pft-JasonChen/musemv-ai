import { HistoryView } from "@/components/history/HistoryView";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryView />
    </AuthGuard>
  );
}
