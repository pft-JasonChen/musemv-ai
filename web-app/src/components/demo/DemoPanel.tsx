"use client";

import { useEffect, useState } from "react";
import { useModeration } from "@/components/community/useModeration";
import { moderationStore } from "@/lib/contentModeration";
import { REPORT_REASONS, resetReports, type ReportKind, type ContentRemoval } from "@/lib/report";
import {
  NEW_MVS,
  TRENDING_MVS,
  ALL_COMMUNITY_SONGS,
  CREATOR_MVS,
  CREATOR_SONGS,
  HERO_MVS,
} from "@/lib/mv/community";
import { HISTORY_SAMPLES } from "@/lib/mv/mock";
import { useHistory } from "@/components/providers/HistoryProvider";
import { authStore } from "@/lib/authStore";
import { demoStore, DEMO_FLAGS, type SubPlatform } from "@/lib/demoStore";
import { PUBLISH_REJECT_CODES, PUBLISH_REJECT_COPY } from "@/lib/publishReview";
import { useIsMounted } from "@/lib/ssr";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useDemoState } from "./useDemo";

/**
 * The bottom-left demo/QA switchboard. Product owner, 2026-08-27.
 *
 * Lets RD/QA trigger the empty / error / rejected states that a prototype
 * seeded with sample data cannot otherwise reach. Mounted from `AppShell`, so
 * it exists on every route.
 *
 * ── INVISIBLE UNTIL `?demo=1` ───────────────────────────────────────────────
 *
 * This is the load-bearing decision, and it is what keeps the panel from
 * costing anything. A `position: fixed` element that rendered by default would:
 *   · appear in all 115 `visual-baseline.spec.ts` screenshots, forcing a
 *     full re-record — and `AGENTS.md` is explicit that re-recording a baseline
 *     ACCEPTS whatever it sees, so that re-record could absorb a real
 *     regression on any of 17 routes;
 *   · be swept by `e2e/a11y.spec.ts` on every route; and
 *   · sit on screen during a CEO demo.
 * Hidden by default, none of that is true and no gate needed a change.
 *
 * `?demo=1` is the ENABLER, not the display condition: it writes
 * `localStorage["muse_demo"].enabled`, which is what the panel actually reads.
 * That is why the panel survives navigation even though `router.push()` drops
 * the query string, and why one visit is enough to arm it for the whole site.
 * `[x]` clears the flag (and every switch with it); `?demo=1` re-arms it.
 *
 * ── STYLING IS WA HOUSE STYLE, NOT DP ───────────────────────────────────────
 *
 * Tailwind arbitrary px + inline `var(--token)`, per `AGENTS.md`. Deliberately
 * NOT `src/styles/designer/` classes: there is no DP design for this panel
 * (there never will be — it is a tool, not a product surface), and inventing a
 * `.demo-panel__*` class no stylesheet defines renders as nothing at all.
 */

/** Reads `?demo=1` once, after mount, and arms the panel. */
function useDemoArming(): void {
  useEffect(() => {
    // `window.location.search`, not `useSearchParams()`, on purpose: the hook
    // would force every route under AppShell into a Suspense boundary for a
    // value only a QA ever sets.
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;
    if (demoStore.getSnapshot().enabled) return; // already armed — don't reset collapse
    // Arms COLLAPSED. Measured in the browser at 800px: expanded, the 290px card
    // sits directly on top of the sidebar's nav links and makes them
    // unclickable — and QA has to navigate while testing these states. The
    // product owner's requirement was explicitly that it not get in the way of
    // reading, so the default is the handle and opening it is one click.
    demoStore.set({ enabled: true, collapsed: true });
  }, []);
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors"
      style={{ background: checked ? "var(--accent)" : "var(--white-15)" }}
    >
      <span
        className="absolute top-[2px] h-[14px] w-[14px] rounded-full transition-all"
        // `--neutral-light-04` IS pure white. A raw hex literal here would trip
        // G1-b: AGENTS.md tolerates the EXISTING raw-colour backlog, but the
        // guard ratchets on per-file increases, and this is a new file.
        style={{ left: checked ? 16 : 2, background: "var(--neutral-light-04)" }}
      />
    </button>
  );
}

export function DemoPanel() {
  useDemoArming();
  const demo = useDemoState();
  const { loggedIn, subscribed, subscribe } = useAuth();
  const { credits, addCredits } = useCredits();
  // Mount gate: `enabled` is false on the server and on the first client paint
  // (see `getServerSnapshot`), so the panel can never cause a hydration diff.
  // `useIsMounted` from src/lib/ssr.ts rather than a local flag — that file
  // exists precisely so this pattern has one implementation.
  const mounted = useIsMounted();

  if (!mounted || !demo.enabled) return null;

  const card = {
    background: "var(--card-2)",
    borderColor: "var(--border-2)",
    color: "var(--neutral-dark-100)",
  };

  if (demo.collapsed) {
    return (
      <button
        type="button"
        onClick={() => demoStore.set({ collapsed: false })}
        className="fixed bottom-3 left-3 z-[400] h-[30px] rounded-full border px-3 text-[11px] font-bold"
        style={card}
      >
        DEMO
      </button>
    );
  }

  return (
    <aside
      aria-label="Demo state panel"
      className="fixed bottom-3 left-3 z-[400] flex max-h-[70vh] w-[290px] flex-col overflow-hidden rounded-xl border text-[11px]"
      style={card}
    >
      <header
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--border-2)" }}
      >
        <span className="flex-1 text-[11px] font-bold tracking-wide">DEMO STATES</span>
        <button
          type="button"
          onClick={() => demoStore.set({ collapsed: true })}
          aria-label="Collapse demo panel"
          className="px-1 font-bold"
          style={{ color: "var(--neutral-dark-64)" }}
        >
          –
        </button>
        <button
          type="button"
          onClick={() => {
            moderationStore.reset();
            demoStore.dismiss();
          }}
          aria-label="Close demo panel"
          className="px-1 font-bold"
          style={{ color: "var(--neutral-dark-64)" }}
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── The eight state flags ─────────────────────────────────────── */}
        {DEMO_FLAGS.map((f) => (
          <div key={f.key} className="flex items-start gap-2 py-1.5">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{f.label}</span>
              <span className="block" style={{ color: "var(--neutral-dark-64)" }}>
                {f.hint}
              </span>
              {f.status === "awaiting-design" && (
                // Honest about why a switch does nothing yet, rather than
                // shipping what looks like a broken control.
                <span className="block font-semibold" style={{ color: "var(--premium)" }}>
                  ⧗ awaiting designer artwork — flag is stored, no UI yet
                </span>
              )}
            </span>
            <Switch
              checked={demo.flags[f.key]}
              onChange={(next) => demoStore.setFlag(f.key, next)}
              label={f.label}
            />
          </div>
        ))}

        {/* Reason picker — only meaningful while the reject flag is on. */}
        {demo.flags.publishRejected && (
          <label className="mt-1 block py-1.5">
            <span className="mb-1 block font-semibold">Reject reason</span>
            <select
              value={demo.rejectReason}
              onChange={(e) =>
                demoStore.set({ rejectReason: e.target.value as typeof demo.rejectReason })
              }
              className="w-full rounded-lg border bg-transparent px-2 py-1"
              style={{ borderColor: "var(--border-2)", color: "var(--neutral-dark-100)" }}
            >
              {PUBLISH_REJECT_CODES.map((code) => (
                <option key={code} value={code}>
                  {PUBLISH_REJECT_COPY[code]}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Platform picker — only meaningful while the app-store flag is on. */}
        {demo.flags.subOnApp && (
          <label className="mt-1 block py-1.5">
            <span className="mb-1 block font-semibold">Subscribed via</span>
            <select
              value={demo.subPlatform}
              onChange={(e) => demoStore.set({ subPlatform: e.target.value as SubPlatform })}
              className="w-full rounded-lg border bg-transparent px-2 py-1"
              style={{ borderColor: "var(--border-2)", color: "var(--neutral-dark-100)" }}
            >
              <option value="ios">App Store (iOS)</option>
              <option value="android">Google Play (Android)</option>
            </select>
          </label>
        )}

        <ReportControls />

        {/* ── Account actions ───────────────────────────────────────────────
            These are ACTIONS, not flags, because the real stores already own
            this state: faking it with a flag would give two sources of truth
            for "is the user signed in". They write through the same store
            `AuthProvider` reads, so every screen reacts exactly as it would
            for a real sign-in. */}
        <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--border-2)" }}>
          <span className="mb-1.5 block font-bold tracking-wide">ACCOUNT</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => authStore.set(!loggedIn)}
              className="rounded-full border px-2 py-1 font-semibold"
              style={{ borderColor: "var(--border-2)" }}
            >
              {loggedIn ? "Sign out" : "Sign in"}
            </button>
            <button
              type="button"
              disabled={subscribed}
              onClick={() => subscribe("weekly_basic")}
              className="rounded-full border px-2 py-1 font-semibold disabled:opacity-40"
              style={{ borderColor: "var(--border-2)" }}
            >
              {subscribed ? "Muse Pro ✓" : "Subscribe"}
            </button>
            <button
              type="button"
              disabled={credits === 0}
              onClick={() => addCredits(-credits)}
              className="rounded-full border px-2 py-1 font-semibold disabled:opacity-40"
              style={{ borderColor: "var(--border-2)" }}
            >
              Credits → 0
            </button>
          </div>
          {/* Recorded where the next session will look: the reason there is no
              "Unsubscribe" button here is that nothing can unsubscribe. See the
              handover doc — `/settings`'s Unsubscribe only toasts. */}
          <p className="mt-1.5" style={{ color: "var(--neutral-dark-64)" }}>
            Credits: {credits} · no Unsubscribe action exists yet (see handover)
          </p>
        </div>
      </div>
    </aside>
  );
}

/** QA actions are in-memory only, independent from the persisted demo flags. */
function ReportControls() {
  const state = useModeration();
  const { history } = useHistory();
  const [target, setTarget] = useState("song:sp-neon-static");
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>(REPORT_REASONS[2]);
  const [severity, setSeverity] = useState<ContentRemoval["kind"]>("removed");
  const options = [
    ...NEW_MVS.map((m) => ({ kind: "mv", id: m.id, title: m.title })),
    ...HERO_MVS.map((m) => ({ kind: "mv", id: m.id, title: m.title })),
    ...TRENDING_MVS.map((m) => ({ kind: "mv", id: m.id, title: m.title })),
    ...CREATOR_MVS.map((m) => ({ kind: "mv", id: m.id, title: m.title })),
    ...ALL_COMMUNITY_SONGS.map((m) => ({ kind: "song", id: m.id, title: m.title })),
    ...CREATOR_SONGS.map((m) => ({ kind: "song", id: m.id, title: m.title })),
    ...HISTORY_SAMPLES.filter((m) => m.kind !== "storyboard" && m.source !== "community").map(
      (m) => ({ kind: m.kind, id: m.id, title: m.title }),
    ),
    ...history.map((m) => ({ kind: m.kind, id: m.id, title: m.title })),
  ];
  const selected = options.find((m) => `${m.kind}:${m.id}` === target) ?? options[0];
  const controlStyle = {
    background: "var(--card-2)",
    color: "var(--text-1)",
    borderColor: "var(--border-2)",
  };
  return (
    <section
      className="mt-2 border-t pt-2"
      style={{ borderColor: "var(--border-2)" }}
      aria-label="Content report QA"
    >
      <p className="font-bold">CONTENT REPORT</p>
      <Switch
        checked={state.failReports}
        onChange={moderationStore.setFailure}
        label="Report submission fails"
      />
      <label className="block py-1">
        Review content
        <select
          aria-label="Review content"
          className="w-full rounded-lg border p-1"
          style={controlStyle}
          value={`${selected.kind}:${selected.id}`}
          onChange={(e) => setTarget(e.target.value)}
        >
          {options.map((m) => (
            <option key={`${m.kind}:${m.id}`} value={`${m.kind}:${m.id}`}>
              {m.kind}: {m.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block py-1">
        Removal reason
        <select
          aria-label="Removal reason"
          className="w-full rounded-lg border p-1"
          style={controlStyle}
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
        >
          {REPORT_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="block py-1">
        Removal type
        <select
          aria-label="Removal type"
          style={controlStyle}
          value={severity}
          onChange={(e) => setSeverity(e.target.value as typeof severity)}
        >
          <option value="removed">Removed</option>
          <option value="permanent">Permanently removed</option>
        </select>
      </label>
      <button
        type="button"
        className="rounded-lg border p-1"
        style={controlStyle}
        onClick={() =>
          moderationStore.remove(selected.kind as ReportKind, selected.id, reason, severity)
        }
      >
        Simulate reviewer removal
      </button>
      <button
        type="button"
        className="rounded-lg border p-1"
        style={controlStyle}
        onClick={() => {
          moderationStore.reset();
          resetReports();
        }}
      >
        Reset report QA session
      </button>
    </section>
  );
}
