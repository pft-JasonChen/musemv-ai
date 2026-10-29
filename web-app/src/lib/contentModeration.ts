// Session-only QA moderation and report outcomes. Never persisted or sent over a network.
import type { ContentRemoval, ReportKind, ReportReason } from "@/lib/report";
import { HISTORY_SAMPLES } from "@/lib/mv/mock";
import { getCommunityMv, getCommunitySong } from "@/lib/mv/community";
import { MOCK_USER } from "@/lib/user";

export interface ModerationState {
  failReports: boolean;
  removals: Readonly<Record<string, ContentRemoval>>;
}
const initial: ModerationState = { failReports: false, removals: {} };
let snapshot = initial;
const listeners = new Set<() => void>();
export const contentKey = (kind: ReportKind, id: string) => `${kind}:${id}`;
export const moderationStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => initial,
  setFailure(failReports: boolean) {
    snapshot = { ...snapshot, failReports };
    listeners.forEach((l) => l());
  },
  remove(
    kind: ReportKind,
    id: string,
    reason: ReportReason,
    severity: ContentRemoval["kind"] = "removed",
  ) {
    if (!id) return;
    const today = new Date().toISOString().slice(0, 10);
    snapshot = {
      ...snapshot,
      removals: {
        ...snapshot.removals,
        [contentKey(kind, id)]: {
          kind: severity,
          reason,
          publishedOn: today,
          removedOn: today,
        },
      },
    };
    listeners.forEach((l) => l());
  },
  reset() {
    snapshot = initial;
    listeners.forEach((l) => l());
  },
};
export function contentRemoval(
  kind: ReportKind,
  id: string,
  state = snapshot,
): ContentRemoval | undefined {
  return (
    state.removals[contentKey(kind, id)] ??
    HISTORY_SAMPLES.find((s) => s.kind === kind && s.id === id)?.removal
  );
}
export function isPubliclyRemoved(kind: ReportKind, id: string, state = snapshot): boolean {
  return !!contentRemoval(kind, id, state);
}
// The mock has one account. Compare immutable fixture attribution, not the editable profile name.
export function isOwnContent(
  kind: ReportKind,
  id: string,
  ownIds: readonly string[] = [],
): boolean {
  const sample = HISTORY_SAMPLES.find((s) => s.id === id && s.kind === kind);
  if (sample) return sample.source !== "community";
  if (ownIds.includes(id)) return true;
  return (kind === "mv" ? getCommunityMv(id) : getCommunitySong(id))?.creator === MOCK_USER.name;
}
