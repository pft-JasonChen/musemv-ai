"use client";
import { useSyncExternalStore } from "react";
import { moderationStore } from "@/lib/contentModeration";
export function useModeration() {
  return useSyncExternalStore(
    moderationStore.subscribe,
    moderationStore.getSnapshot,
    moderationStore.getServerSnapshot,
  );
}
