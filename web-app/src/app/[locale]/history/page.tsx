import { Suspense } from "react";
import { HistoryView } from "@/components/history/HistoryView";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function HistoryPage() {
  return (
    <AuthGuard>
      <Suspense>
        <HistoryView />
      </Suspense>
    </AuthGuard>
  );
}
