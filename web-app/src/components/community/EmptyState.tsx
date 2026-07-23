"use client";

import { useEffect, useState } from "react";

// EXP-06: shared empty / not-found / offline states for community surfaces,
// with App-style copy.

/** Tracks browser connectivity so community views can show an offline state. */
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);
  return online;
}

interface Props {
  variant: "empty" | "not-found" | "offline";
  /** Optional call-to-action (e.g. a Create button). */
  action?: React.ReactNode;
}

const COPY: Record<Props["variant"], { icon: string; title: string; body: string }> = {
  empty: {
    icon: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    title: "Nothing here yet",
    body: "Be the first to create!",
  },
  "not-found": {
    icon: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    title: "We couldn’t find this",
    body: "It may have been removed or the link is broken.",
  },
  offline: {
    icon: "M1 1l22 22M16.7 16.7A11 11 0 0 1 5 12M8.5 8.5A11 11 0 0 1 23 12M12 20h.01",
    title: "You’re offline",
    body: "Check your connection and try again.",
  },
};

export function CommunityEmpty({ variant, action }: Props) {
  const c = COPY[variant];
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border px-6 py-12 text-center" style={{ borderColor: "var(--border-2)" }}>
      <span className="grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={c.icon} /></svg>
      </span>
      <div>
        <div className="text-[15px] font-bold">{c.title}</div>
        <div className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>{c.body}</div>
      </div>
      {action}
    </div>
  );
}
