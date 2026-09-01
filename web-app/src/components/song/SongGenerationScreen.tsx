"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { RoomNavbar } from "@/components/shell/RoomNavbar";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { isSongReady } from "@/lib/mv/types";

/** DP's own 23 bar heights, copied verbatim — there is no audio to derive from. */
const WAVE_BAR_HEIGHTS = [
  20, 35, 15, 48, 22, 55, 18, 40, 28, 60, 25, 52, 30, 45, 20, 38, 26, 50, 15, 42, 24, 36, 18,
];

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3j) ────────────────────
 *
 * DP source: `SongProcessing` inside `SongCreatePage.tsx` — the second of that
 * file's three stages. Classes from `src/styles/designer/SongCreatePage.css`,
 * verbatim. `/song/create` and `/song/result` are the other two.
 *
 * DP's version is a 4-second `setInterval` with a rotating canned status line.
 * This drives the bar from the real polled job's `gen.progress`, and the status
 * line is `gen.step` — the backend's actual stage text — instead of a timer
 * cycling four strings. The rotation is therefore NOT ported: it would be a
 * second, fictional progress indicator running beside a real one.
 *
 * Everything else DP has no design for is kept, for the same reasons as the
 * storyboard's processing stage: the failure path with Retry (DP cannot fail),
 * the `alreadyDone` forward that stops a rehydrated result hanging at 0%, and
 * the mid-flow guard back to `/song/create`.
 */
export function SongGenerationScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { startSong, songResult, songCompose, gen } = useSongFlow();

  const valid = songResult != null || isSongReady(songCompose);
  const alreadyDone = songResult != null;

  useEffect(() => {
    if (!valid) router.replace(localePath(locale, "/song/create"));
  }, [valid, router, locale]);

  // GL-01: `startSong` CHARGES credits, so this mount effect must be idempotent.
  // React Strict Mode (on by default in `next dev`) deliberately invokes every
  // mount effect twice to expose exactly this class of bug, and without a guard
  // that billed one generation twice: a 10-credit balance went to -2 for a 6-credit
  // vocal song. A ref survives Strict Mode's simulated remount (the component
  // instance is reused), so the second invocation is skipped. Retry calls
  // `startSong` directly and is deliberately NOT gated by this.
  const started = useRef(false);
  useEffect(() => {
    if (!valid || alreadyDone || started.current) return;
    started.current = true;
    startSong();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!valid) return;
    if (alreadyDone || gen.status === "done") {
      // `replace`, not `push` — see the same change in `GenerationView`: this
      // screen forwards itself on `alreadyDone`, so keeping it on the stack
      // turns Back from `/song/result` into a no-op loop.
      const t = setTimeout(() => router.replace(localePath(locale, "/song/result")), 350);
      return () => clearTimeout(t);
    }
  }, [valid, alreadyDone, gen.status, router, locale]);

  if (!valid) return null;

  const failed = gen.status === "failed";

  return (
    <>
      <RoomNavbar
        title="AI Song"
        mobileBackHref="/song/create"
        className="room-navbar__top--tight"
      />

      <div className="song-create">
        <div className="song-create__panel song-create__panel--full">
          <div className="song-processing" role={failed ? "alert" : undefined}>
            {!failed && (
              <div className="song-processing__wave" aria-hidden="true">
                {WAVE_BAR_HEIGHTS.map((height, i) => (
                  <span
                    key={i}
                    className="song-processing__wave-bar"
                    style={
                      {
                        "--peak-height": `${height}px`,
                        animationDelay: `${i * 0.06}s`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            )}

            <div className="song-processing__message">
              <p className="song-processing__title">
                {failed ? "Generation Failed" : "Composing Your Song"}
              </p>
              <p className="song-processing__subtitle">
                {failed ? (
                  "Something went wrong while generating. Your credits were not charged — you can retry now or adjust your input and try again."
                ) : (
                  <>
                    AI is generating your original track.
                    <br />
                    This usually takes about a minute.
                  </>
                )}
              </p>
            </div>

            {failed ? (
              <div className="song-processing__progress">
                <button
                  type="button"
                  className="button button--medium button--primary"
                  onClick={startSong}
                >
                  <span className="button__label">Retry</span>
                </button>
              </div>
            ) : (
              <div className="song-processing__progress">
                <div className="song-processing__progress-track">
                  <div
                    className="song-processing__progress-fill"
                    style={{ width: `${gen.progress}%` }}
                  />
                </div>
                <p className="song-processing__status">{gen.step || "Producing the track..."}</p>
              </div>
            )}

            {/* R-9: DP writes this as a bare anchor to the History path, which
                drops the locale prefix on all eight non-English trees. */}
            <Link
              href={localePath(locale, failed ? "/song/create" : "/history")}
              className="song-processing__view-later"
            >
              {failed ? "Back" : "View Later"}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
