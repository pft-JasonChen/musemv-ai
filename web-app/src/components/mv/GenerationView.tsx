"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";
import { DetailNavbar } from "@/components/shell/DetailNavbar";

interface Props {
  kind: "storyboard" | "render" | "song";
  title: string;
  subtitle: string;
  estimate: string;
  /** route to go to when this generation completes */
  nextHref: string;
  /** start function pulled from context */
  start: () => void;
  /** guard: if this is already satisfied, skip starting (e.g. storyboard exists) */
  alreadyDone: boolean;
}

/**
 * Product owner request, 2026-08-14 — match `StoryboardGenerationScreen`'s
 * DP-styled processing card (`.mv-storyboard-processing__*`,
 * MVStoryboardPage.css). That screen stopped using this shared component in
 * slice 3h specifically because DP never designed `/mv/creating` or
 * `/song/creating` (its own header note said so) — but the classes
 * themselves are generic ("processing card with icon/percent/caption, title/
 * subtitle, progress bar, ETA, View Later"), not storyboard-specific, so
 * reusing them here is the same "borrow DP's classes for an undesigned
 * screen" move already made for `.song-create__cta-credits` on this file's
 * own MV Storyboard CTA. `song`'s branch is otherwise dead — `/song/creating`
 * has had its own independently-migrated `SongGenerationScreen` since before
 * this change and no longer renders through here — so only the copy/prop
 * plumbing for it is kept, not a duplicate style path.
 *
 * ── `DetailNavbar` ADDED, 2026-08-22 (product owner, "layer 1 vs everything
 *    else" — AppShell.tsx's own comment) ────────────────────────────────
 *
 * `/mv/creating` was the one route with NEITHER a migrated navbar NOR a
 * phone back/title bar at all — DP never designed a render-progress screen,
 * so it had stayed on the legacy `TopBar` and was not in `OWN_CHROME`. Once
 * `AppShell` stopped mounting its own `MobileHeader` outside Home/History,
 * this screen would have had NO header whatsoever on a phone. Adding
 * `DetailNavbar` (now also added to `OWN_CHROME`) gives it the exact same
 * back+title bar every sibling generation-adjacent screen already has,
 * without needing DP to ever design one — `title`/`backHref` were already
 * computed here for the in-body copy and the failed-state Back link.
 */
export function GenerationView({
  kind,
  title,
  subtitle,
  estimate,
  nextHref,
  start,
  alreadyDone,
}: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  // MV and Song generations each own their progress; pick by what this screen shows.
  const mvGen = useMvFlow().gen;
  const songGen = useSongFlow().gen;
  const gen = kind === "song" ? songGen : mvGen;

  // Start the mock generation once on mount.
  //
  // GL-01: `start` CHARGES credits, so this must be idempotent. React Strict
  // Mode (on by default in `next dev`) deliberately invokes every mount effect
  // twice to expose exactly this class of bug, and without a guard that billed
  // one generation twice — measured on the song flow, where a 10-credit balance
  // went to -2 for a 6-credit vocal song. A ref survives Strict Mode's
  // simulated remount (the component instance is reused), so the second
  // invocation is skipped. Retry calls `start` directly and is not gated here.
  const started = useRef(false);
  useEffect(() => {
    if (alreadyDone || started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate when done. Trust the job status alone — a real backend may report
  // "done" before progress reaches exactly 100 (the mock always hits 100).
  // MV-09: on reload the storyboard/result rehydrates from persistence while
  // `gen` resets to idle, so the job status never reaches "done" and the screen
  // would hang at 0%. `alreadyDone` means the artifact already exists — forward
  // to the next screen instead of waiting on a generation that will never run.
  //
  // `replace`, not `push` (2026-08-06). This screen forwards itself the moment
  // the artifact exists, so leaving it on the history stack makes Back from the
  // result a no-op LOOP: back lands here, `alreadyDone` is true, and 350ms later
  // it pushes the result again. That is not a theoretical stack tidy-up — it is
  // what made "Back on /mv/result does nothing" reproducible. With `replace`,
  // Back from the result reaches the screen the user actually came from.
  useEffect(() => {
    if (alreadyDone || gen.status === "done") {
      const t = setTimeout(() => router.replace(nextHref), 350);
      return () => clearTimeout(t);
    }
  }, [alreadyDone, gen.status, nextHref, router]);

  const backHref = kind === "song" ? "/song/create" : "/mv/room";
  const failed = gen.status === "failed";

  return (
    <>
      <DetailNavbar title={title} fallbackPath={backHref} />
      <div className="mv-storyboard mv-storyboard--processing">
        <div className="mv-storyboard-processing" role={failed ? "alert" : undefined}>
          <div className="mv-storyboard-processing__card">
            <DpIcon
              name={failed ? "ic_alert" : "ic_video_ai"}
              className="mv-storyboard-processing__icon"
            />
            {!failed && (
              <p className="mv-storyboard-processing__percent">{Math.round(gen.progress)}%</p>
            )}
            <p className="mv-storyboard-processing__caption">
              {failed ? "Generation stopped" : gen.step}
            </p>
          </div>

          <div className="mv-storyboard-processing__message">
            <p className="mv-storyboard-processing__title">
              {failed ? "Generation Failed" : title}
            </p>
            <p className="mv-storyboard-processing__subtitle">
              {failed
                ? "Something went wrong while generating. Your credits were not charged — you can retry now or adjust your input and try again."
                : subtitle}
            </p>
          </div>

          {failed ? (
            <div className="mv-storyboard-processing__progress">
              <button
                type="button"
                className="button button--medium button--primary"
                onClick={start}
              >
                <span className="button__label">Retry</span>
              </button>
              <Link
                href={localePath(locale, backHref)}
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
                <p className="mv-storyboard-processing__eta-value">{estimate}</p>
              </div>

              <Link
                href={localePath(locale, "/history")}
                className="mv-storyboard-processing__view-later"
              >
                View Later
              </Link>
            </>
          )}

          <p className="sr-only">{kind} generation in progress</p>
        </div>
      </div>
    </>
  );
}
