"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { isComposeReady } from "@/lib/mv/types";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3h) ────────────────────
 *
 * DP source: `MVStoryboardProcessing` inside `MVStoryboardPage.tsx` — the
 * FIRST of that file's two stages (Figma "Create Storyboard — Processing",
 * node 48:93). Classes from `src/styles/designer/MVStoryboardPage.css`,
 * verbatim. The second stage is `StoryboardEditor`; they are one DP file and
 * two WA routes, which is why the navbar and the `.mv-storyboard` wrapper are
 * repeated in both rather than lifted.
 *
 * ── WHY THIS NO LONGER USES `GenerationView` ────────────────────────────────
 *
 * `GenerationView` is shared with `/mv/creating` and `/song/creating`, and DP
 * has no design for either (its own header note says `#screen-mv-creating` was
 * never built). Migrating the shared component would have restyled two screens
 * this slice never looked at. So this screen gets DP's markup and the other two
 * keep `GenerationView` until their own slices.
 *
 * ── WHAT DP DOES NOT HAVE, AND IS KEPT ──────────────────────────────────────
 *
 * · A real job. DP animates a 3-second `setInterval` to 100% and calls that
 *   progress. This drives `gen.progress` from the actual polled mock job, and
 *   `gen.step` — the live stage text — goes in DP's caption slot, which DP
 *   hardcodes to "Finalizing storyboard...".
 * · The FAILURE path (`[fail]` in the description). DP cannot fail, so it has
 *   no design for it; the error state reuses this block's own typography and
 *   the shared `.button` component, and keeps Retry + Back.
 * · MV-09's `alreadyDone` forward. On reload the storyboard rehydrates from
 *   persistence while `gen` resets to idle, so the job status never reaches
 *   "done" and a progress-driven screen would hang at 0% forever.
 * · The mid-flow guard: no compose state and no storyboard means a deep link,
 *   so `router.replace()` back to the flow entry rather than generating from
 *   empty input.
 */
export function StoryboardGenerationScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { startStoryboard, storyboard, compose, gen } = useMvFlow();

  const valid = storyboard != null || isComposeReady(compose);
  const alreadyDone = storyboard != null;

  useEffect(() => {
    if (!valid) router.replace(localePath(locale, "/mv/room"));
  }, [valid, router, locale]);

  // Start the mock generation once on mount.
  //
  // GL-01: `startStoryboard` CHARGES credits, so this must be idempotent.
  // React Strict Mode (on by default in `next dev`) deliberately invokes every
  // mount effect twice to expose exactly this class of bug — without a guard
  // it fires TWO separate storyboard jobs, double-charging `scriptCost` and
  // leaving the first job's History row stuck at "Generating..." forever (its
  // poll is silently cancelled when the second job's `track()` call replaces
  // `cancelPoll.current`, with no `markFailed`/`markCompleted` on the way out).
  // Same bug, same fix as `GenerationView.tsx`'s own `started` ref (that one
  // covers `/mv/creating` and `/song/creating`; this screen stopped routing
  // through it in slice 3h — see the header note — and the guard did not come
  // along for the ride). A ref survives Strict Mode's simulated remount (the
  // component instance is reused), so the second invocation is skipped.
  const started = useRef(false);
  useEffect(() => {
    if (!valid || alreadyDone || started.current) return;
    started.current = true;
    startStoryboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate when done. Trust the job status alone — a real backend may report
  // "done" before progress reaches exactly 100 (the mock always hits 100).
  useEffect(() => {
    if (!valid) return;
    if (alreadyDone || gen.status === "done") {
      const t = setTimeout(() => router.push(localePath(locale, "/mv/storyboard")), 350);
      return () => clearTimeout(t);
    }
  }, [valid, alreadyDone, gen.status, router, locale]);

  if (!valid) return null;

  const failed = gen.status === "failed";

  return (
    <>
      <DetailNavbar title="Edit Storyboard" fallbackPath="/mv/room" />

      <div className="mv-storyboard mv-storyboard--processing">
        <div className="mv-storyboard-processing" role={failed ? "alert" : undefined}>
          <div className="mv-storyboard-processing__card">
            <DpIcon
              name={failed ? "ic_alert" : "ic_script"}
              className="mv-storyboard-processing__icon"
            />
            {!failed && (
              <p className="mv-storyboard-processing__percent">{Math.round(gen.progress)}%</p>
            )}
            <p className="mv-storyboard-processing__caption">
              {failed ? "Generation stopped" : gen.step || "Finalizing storyboard..."}
            </p>
          </div>

          <div className="mv-storyboard-processing__message">
            <p className="mv-storyboard-processing__title">
              {failed ? "Generation Failed" : "Crafting Your Storyboard"}
            </p>
            <p className="mv-storyboard-processing__subtitle">
              {failed
                ? "Something went wrong while generating. Your credits were not charged — you can retry now or adjust your input and try again."
                : "AI is analyzing your audio and description to build the perfect cinematic sequence."}
            </p>
          </div>

          {failed ? (
            <div className="mv-storyboard-processing__progress">
              <button
                type="button"
                className="button button--medium button--primary"
                onClick={startStoryboard}
              >
                <span className="button__label">Retry</span>
              </button>
              <Link
                href={localePath(locale, "/mv/room")}
                className="mv-storyboard-processing__view-later"
              >
                Back
              </Link>
            </div>
          ) : (
            <>
              <div className="mv-storyboard-processing__progress">
                <div className="mv-storyboard-processing__progress-track">
                  <div
                    className="mv-storyboard-processing__progress-fill"
                    style={{ width: `${gen.progress}%` }}
                  />
                </div>
                <p className="mv-storyboard-processing__eta-label">Estimated time remaining</p>
                <p className="mv-storyboard-processing__eta-value">~1 minute</p>
              </div>

              {/* R-9: DP writes this as a bare anchor to the History path, which
                  drops the locale prefix on all eight non-English trees. */}
              <Link
                href={localePath(locale, "/history")}
                className="mv-storyboard-processing__view-later"
              >
                View Later
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
