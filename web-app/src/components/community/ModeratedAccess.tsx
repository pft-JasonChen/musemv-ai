"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { contentRemoval, isOwnContent } from "@/lib/contentModeration";
import { useModeration } from "./useModeration";
import type { ReportKind } from "@/lib/report";
import { CommunityEmpty } from "./EmptyState";

/** Keep removed media unmounted, so neither hidden audio nor video can continue. */
export function ModeratedAccess({
  kind,
  id,
  privateResult = false,
  children,
}: {
  kind: ReportKind;
  id: string;
  privateResult?: boolean;
  children: React.ReactNode;
}) {
  useModeration();
  const { loggedIn } = useAuth();
  const { history } = useHistory();
  const removed = contentRemoval(kind, id);
  if (
    removed &&
    !(
      privateResult &&
      loggedIn &&
      isOwnContent(
        kind,
        id,
        history.filter((h) => h.kind === kind).map((h) => h.id),
      )
    )
  ) {
    return <CommunityEmpty variant="not-found" />;
  }
  return children;
}
