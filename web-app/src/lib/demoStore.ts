// The demo/QA state switchboard — backing store for `components/demo/DemoPanel`.
//
// Product owner, 2026-08-27: RD and QA need to be able to trigger the empty /
// error / rejected states on demand, because most of them are unreachable in a
// prototype seeded with sample data (History ships `HISTORY_SAMPLES`, Credits
// ships `CREDIT_TRANSACTIONS`, the creator profile ships `CREATOR_MVS`).
//
// ── WHY AN EXTERNAL STORE AND NOT A PROVIDER ────────────────────────────────
//
// Deliberate: adding an eighth provider to `AppProviders` would put a demo tool
// inside the **C4 contract surface** RD codes against, for zero benefit. A
// `useSyncExternalStore` hook needs no provider, so the provider stack is
// untouched and `providers.surface.test.ts` never sees this file.
//
// It also gets SSR right for free, which is the harder half. This is the
// `authStore.ts` pattern verbatim — `getServerSnapshot()` returns the all-off
// default so the server render and the first client render agree. Reading
// `localStorage` during render instead is what produces React error 418, the
// failure `src/lib/ssr.ts` was extracted to stop us re-introducing.
//
// ⚠️ **THE SNAPSHOT MUST BE REFERENTIALLY STABLE.** `useSyncExternalStore` calls
// `getSnapshot()` on every render and re-renders when the result changes by
// IDENTITY. Parsing the JSON fresh each call returns a new object every time,
// which is an infinite render loop — not a subtle perf issue, a hung tab. Hence
// the raw-string cache below. Do not "simplify" it away.

import type { PublishRejectCode } from "@/lib/publishReview";

const LS_KEY = "muse_demo";

/**
 * One entry per switch in the panel.
 *
 * `status` is honest bookkeeping, not decoration. `awaiting-design` means the
 * flag is wired and persisted but **no screen consumes it yet** because the
 * designer has not delivered that state's artwork — so the panel can say so
 * instead of presenting a switch that appears broken. Flip an entry to `live`
 * in the same change that lands its UI.
 *
 * All eight are `live` as of 2026-08-28 — every state this panel was built
 * for now has real UI behind it. `status` is still typed as the two-value
 * `FlagStatus` union below rather than inferred from each entry's current
 * `"live"` literal, so the NEXT flag this panel gains can start out
 * `awaiting-design` again without `f.status === "awaiting-design"` (in
 * `DemoPanel.tsx`) becoming a comparison of disjoint literal types.
 */
type FlagStatus = "live" | "awaiting-design";

export const DEMO_FLAGS = [
  {
    key: "historyEmpty",
    label: "History — no records",
    hint: "All 4 tabs (All · Music Videos · Songs · Liked)",
    status: "live" as FlagStatus,
  },
  {
    key: "mySongsEmpty",
    label: "Create MV → Choose Song — My Songs empty",
    hint: "WA already ships a hand-built state here (MV-11)",
    status: "live" as FlagStatus,
  },
  {
    key: "creditsEmpty",
    label: "Credits Detail — no records",
    hint: "All 3 tabs (All · Spend · Earn)",
    status: "live" as FlagStatus,
  },
  {
    key: "profileEmpty",
    label: "Community profile — no MVs / Songs",
    hint: "/creator (own + others) and /profile's two tabs",
    status: "live" as FlagStatus,
  },
  {
    key: "publishRejected",
    label: "Publish review REJECTED",
    hint: "MV only — pick a reason below",
    status: "live" as FlagStatus,
  },
  {
    key: "apiError",
    label: "Backend API error",
    hint: "Subscribe / Buy Credits popups fail to load, with Retry",
    status: "live" as FlagStatus,
  },
  {
    key: "subOnApp",
    label: "Subscribed on a phone (App Store / Google Play)",
    hint: "/settings → Unsubscribe shows the go-to-your-phone dialog",
    status: "live" as FlagStatus,
  },
  {
    key: "jobFail",
    label: "Generation job fails",
    hint: 'Same failure as typing "[fail]" in a description',
    status: "live" as FlagStatus,
  },
] as const satisfies readonly {
  key: string;
  label: string;
  hint: string;
  status: FlagStatus;
}[];

export type DemoFlagKey = (typeof DEMO_FLAGS)[number]["key"];

export type SubPlatform = "ios" | "android";

export interface DemoState {
  /**
   * Is the panel showing at all? **Only `?demo=1` can turn this on** — the
   * panel is invisible by default on purpose, so that all 115 visual baselines
   * and the axe sweep stay pixel-identical and a CEO demo never shows a QA
   * tool. The panel's `[x]` sets it back to false, permanently, and `?demo=1`
   * is how you get it back.
   */
  enabled: boolean;
  /** Collapsed to a small handle, vs. the full switch list. Purely cosmetic. */
  collapsed: boolean;
  flags: Record<DemoFlagKey, boolean>;
  /** Which of the seven reasons the rejected state reports. */
  rejectReason: PublishRejectCode;
  /** Which store the fake app-store subscription came from. */
  subPlatform: SubPlatform;
}

function defaults(): DemoState {
  return {
    enabled: false,
    collapsed: false,
    flags: Object.fromEntries(DEMO_FLAGS.map((f) => [f.key, false])) as Record<
      DemoFlagKey,
      boolean
    >,
    rejectReason: "PLATFORM_POLICY",
    subPlatform: "ios",
  };
}

/** The all-off state, as ONE frozen object — see the identity note in the header. */
const SERVER_STATE: DemoState = Object.freeze(defaults());

let cachedRaw: string | null = null;
let cachedState: DemoState = SERVER_STATE;

const listeners = new Set<() => void>();

function parse(raw: string | null): DemoState {
  const base = defaults();
  if (!raw) return base;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return base;
    const o = parsed as Partial<DemoState>;
    return {
      enabled: o.enabled === true,
      collapsed: o.collapsed === true,
      // Merged onto the defaults, never trusted wholesale: a stored blob written
      // by an older build is missing whatever flags were added since, and
      // `flags[key]` returning undefined would make a switch uncontrolled.
      flags: { ...base.flags, ...(o.flags ?? {}) },
      rejectReason: o.rejectReason ?? base.rejectReason,
      subPlatform: o.subPlatform === "android" ? "android" : "ios",
    };
  } catch {
    return base;
  }
}

export const demoStore = {
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    // `storage` fires only in OTHER tabs, which is exactly what we want it for:
    // a QA with two tabs open sees both react. Same-tab updates come from `set`.
    if (typeof window !== "undefined") window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      if (typeof window !== "undefined") window.removeEventListener("storage", cb);
    };
  },

  getSnapshot(): DemoState {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(LS_KEY);
    } catch {
      return SERVER_STATE; // private mode / storage blocked — behave as all-off
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedState = parse(raw);
    }
    return cachedState;
  },

  getServerSnapshot(): DemoState {
    return SERVER_STATE;
  },

  set(patch: Partial<DemoState>): void {
    const next: DemoState = { ...demoStore.getSnapshot(), ...patch };
    try {
      const raw = JSON.stringify(next);
      localStorage.setItem(LS_KEY, raw);
      cachedRaw = raw;
      cachedState = next;
    } catch {
      // Storage unavailable: keep the change in memory for this page's lifetime
      // so the panel still works, it just will not survive a reload.
      cachedRaw = null;
      cachedState = next;
    }
    listeners.forEach((l) => l());
  },

  setFlag(key: DemoFlagKey, on: boolean): void {
    demoStore.set({ flags: { ...demoStore.getSnapshot().flags, [key]: on } });
  },

  /** `[x]` — hide the panel and clear every flag, so dismissing never leaves a
   *  fake state stuck on for someone who can no longer see the switch. */
  dismiss(): void {
    demoStore.set({ ...defaults(), enabled: false });
  },
};
