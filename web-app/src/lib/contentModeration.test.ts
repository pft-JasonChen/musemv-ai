import { beforeEach, describe, expect, it } from "vitest";
import {
  contentRemoval,
  isOwnContent,
  isPubliclyRemoved,
  moderationStore,
} from "./contentModeration";
import { hasReported, markReported, reportCount, resetReports, REPORT_SESSION_MAX } from "./report";
import { resolveShare } from "./share";
import { NEW_MVS, TOP_PICKS_SONGS } from "./mv/community";

describe("content report session and moderation", () => {
  beforeEach(() => {
    moderationStore.reset();
    resetReports();
  });
  it("counts unique successful keys across kinds without aliasing song and MV IDs", () => {
    markReported("mv", "same");
    markReported("song", "same");
    markReported("song", "same");
    expect(reportCount()).toBe(2);
    expect(hasReported("mv", "same")).toBe(true);
    expect(hasReported("mv", "different")).toBe(false);
    expect(REPORT_SESSION_MAX).toBe(5);
    resetReports();
    expect(reportCount()).toBe(0);
  });
  it("removal blocks public share resolution while retaining private removal details", () => {
    const mv = NEW_MVS[0];
    expect(resolveShare(mv.id, [])).not.toBeNull();
    moderationStore.remove("mv", mv.id, "Spam or commercial advertising");
    expect(isPubliclyRemoved("mv", mv.id)).toBe(true);
    expect(isPubliclyRemoved("song", mv.id)).toBe(false);
    expect(resolveShare(mv.id, [])).toBeNull();
    expect(contentRemoval("mv", mv.id)?.reason).toBe("Spam or commercial advertising");
    moderationStore.reset();
    expect(resolveShare(mv.id, [])).not.toBeNull();
  });
  it("recognizes owned fixtures and generated IDs, never treats liked community samples as owned", () => {
    expect(isOwnContent("song", TOP_PICKS_SONGS[0].id)).toBe(true);
    expect(isOwnContent("mv", NEW_MVS[0].id)).toBe(false);
    expect(isOwnContent("song", "generated", ["generated"])).toBe(true);
    expect(isOwnContent("mv", "h-love-melody-removed")).toBe(true);
  });
  it("successfully reporting content never removes it", () => {
    markReported("mv", NEW_MVS[0].id);
    expect(isPubliclyRemoved("mv", NEW_MVS[0].id)).toBe(false);
  });
  it("keeps external snapshots stable and resettable without persistence", () => {
    const listenerCalls: number[] = [];
    const off = moderationStore.subscribe(() => listenerCalls.push(1));
    expect(moderationStore.getSnapshot()).toBe(moderationStore.getSnapshot());
    moderationStore.setFailure(true);
    expect(moderationStore.getSnapshot().failReports).toBe(true);
    moderationStore.reset();
    expect(moderationStore.getSnapshot().failReports).toBe(false);
    expect(listenerCalls).toHaveLength(2);
    off();
  });
});
