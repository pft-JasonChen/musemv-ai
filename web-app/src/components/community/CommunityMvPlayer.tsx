"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { DpIcon } from "@/components/ui/DpIcon";
import { SeekBar } from "@/components/ui/SeekBar";
import { DetailNavbar, useBackNavigation } from "@/components/shell/DetailNavbar";
import { buildShareUrl } from "@/lib/share";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DEFAULT_COMPOSE } from "@/lib/mv/types";
import { getCommunityMv, mvCoverRatio, NEW_MVS, TRENDING_MVS } from "@/lib/mv/community";
import { CommunityEmpty } from "@/components/community/EmptyState";
import { MvGridSections } from "@/components/community/MvGridSections";

/**
 * Slice 3d — `/watch`, migrated to DP's `MVDetailPage` UPPER half (`.mv-player*`).
 * The lower half (the justified grid) is ALSO rendered here (designer request,
 * 2026-08-07) via `MvGridSections`, shared with `/explore/mvs`'s `MvExplore` —
 * `MVDetailPage.css` was copied verbatim in 3a and already carries these rules.
 * DP's own file keeps the same two sections mounted below the player in its
 * "selected" state; WA had split them into a separate route entirely, which
 * this restores. See `MvGridSections` for the extraction reasoning.
 *
 * ── This is the screen A5 blocked ───────────────────────────────────────────
 * `MVDetailPage` is where A5 was first found: DP hides every navbar below 767px
 * and this page has no in-page back, so on a phone it was enterable and not
 * leavable. WA worked around it with a bespoke control inside `DetailNavbar`;
 * the 2026-08-06 drop (`2670ed2`) answered it upstream — AppLayout stopped
 * hiding `.detail-navbar` and DetailNavbar.css grew a compact 50px back+title
 * bar — so the workaround is deleted and this screen is on DP's own control.
 *
 * DP goes one step further here and passes `hideMobileBar`, because its
 * MVDetailPage renders a Figma-specific `.mv-player__mobile-header` instead.
 * That header was NOT ported at first, so WA kept DetailNavbar's bar rather
 * than drop one affordance before building the other (exactly how A5 first
 * happened).
 *
 * ── `.mv-player__mobile-header` LANDS, 2026-08-20 (product owner, Figma node
 *    2730:119065) — `hideMobileBar` now passed too ─────────────────────────
 *
 * The other half of that trade is built: a phone gets Back + the MV's own
 * title/type-and-length instead of DetailNavbar's bare icon-only back (its
 * compact bar is now suppressed via `hideMobileBar`, matching what DP always
 * intended — desktop is untouched, that modifier only does anything under
 * 767px). Three more DP classes were sitting in `MVDetailPage.css` unused
 * until now, same "CSS ahead of the port" shape as the header itself:
 *
 *   · `.mv-player__mobile-profile` — a 34px gradient avatar, fixed to the
 *     right edge above the like/share pair, linking to `/creator` (the same
 *     destination `.mv-player__meta`'s own creator link already used).
 *   · `.mv-player__cta-desktop` / `.mv-player__cta-mobile` — DP's CTA reads
 *     "Create MV" at desktop width and "Create Music Video" once it becomes
 *     the full-width mobile pill (Figma's own two labels, not a rename).
 *   · The subtitle ("Singing | 1-2 min") pairs `mvType` with the duration
 *     half of `meta` (`meta`'s own shape is documented in schemas.ts as
 *     "Popular | 2-3 min" — the marketing half is dropped, the duration half
 *     is kept, exactly which half changes depending on the design pass).
 *
 * `AppShell`'s always-mounted `MobileHeader` / `MobileTabBar` are hidden for
 * this route via `designer-overrides.css` (`:has(.mv-detail)`) — see
 * `MvExplore.tsx`'s identical note; DP has no equivalent rule because DP has
 * no separate shell component for it to hide.
 *
 * ── What DP's overlay drops, and why that is allowed ────────────────────────
 * WA's pre-migration screen had a side panel with a "# Music Video" badge, the
 * meta line, a stats block (plays/likes/shares) and the source prompt. DP's is
 * an immersive player: video, floating title + creator, like/share, CTA and
 * transport. Those four are genuinely gone.
 *
 * That was checked against the spec rather than assumed. **AC-EXP-04** requires
 * muted 3:4 playback with play/pause + mute, and Like, Share and Create Music
 * Video pre-filling `/mv/room` — all present. The badge/meta/stats/prompt are
 * not in any AC, so this is a redesign, not a silent spec regression. Recorded
 * in `DESIGNER-TODO.md` so the designer sees what the port costs.
 *
 * DP also ADDS a seek bar and fullscreen. The seek bar goes through `SeekBar`,
 * which is keyboard-operable — DP's is pointer-only, the defect G7 logged
 * against the song player (`TODO.md` #5). No point shipping it twice.
 *
 * ── VERTICAL SWIPE TO PREV/NEXT MV, 2026-08-20 (product owner) ─────────────
 *
 * No DP reference for this at all — neither a Figma frame nor a shipped
 * class, unlike everything else on this screen. `MV_LIST` orders
 * `TRENDING_MVS` then `NEW_MVS` — the same two catalogs `MvGridSections`
 * shows below the player, in the same order — and steps circularly, the
 * same shape `SongPlayBar`'s prev/next already uses for its own catalog. A
 * `mv-* ` id that resolves to something OUTSIDE that combined list (a
 * `CREATOR_MVS` id, reached from `/creator`) has no defined "next" and the
 * gesture is a no-op rather than guessing one.
 *
 * Scoped to `.mv-player__stage` (the video itself), not the whole player —
 * the header, side rail, and bottom controls all sit in NORMAL flow above/
 * around it and stay put; only the video pans. Pointer events, not touch
 * events, so a mouse-drag on desktop works the same way (harmless there:
 * desktop never mounts the full-screen `.mv-detail--selected` treatment
 * this is really for).
 *
 * `router.replace`, not `.push` — matching every other "step to an
 * adjacent item" navigation in this codebase (`SongPlayBar`'s prev/next
 * pattern is state, not a route; the closer analogy is `GenerationView`'s
 * own `.replace()` for the same reason: a swipe is not a place the user
 * would ever want Back to return them to individually, one swipe per tap).
 *
 * ── THE DRAG PEEKS AT THE ADJACENT VIDEO, 2026-08-21 (product owner) ───────
 *
 * The first cut only translated the CURRENT video, so dragging revealed the
 * player's own dark background — functional, but the mockup shows an actual
 * sliver of the next/previous MV sliding into view (the short-form-feed
 * convention this gesture is borrowed from).
 *
 * ── REWRITTEN AS A 3-SLOT ROTATING TRACK, 2026-08-21 (product owner supplied
 *    `code-snippets/mv-drag-preview.snippet.html` as the reference) ─────────
 *
 * The peek-video cut above worked but reloaded a fresh `<video src>` on every
 * commit (`key={mv.id}` forced a remount) — a black-flash-and-buffer beat on
 * every swipe. The snippet's fix is three PERMANENT video elements
 * (`slotVideoRefs`, indices 0/1/2, never remounted) whose ROLE — which one is
 * "prev"/"curr"/"next" — rotates on commit (`rolesRef`) instead of the DOM
 * nodes themselves moving. Whichever slot was already preloaded in the drag's
 * direction simply BECOMES current — it was already decoding, so playback
 * continues with zero delay. Only the slot that just left the 3-item window
 * gets a new `src` loaded into it, off-screen, for the next drag.
 *
 * `videoRef` (used by `togglePlay`/`toggleMute`/`seek`/the control row) always
 * points at whichever slot currently plays role "curr" — its ref callback
 * re-runs that assignment on every render, so it tracks `rolesRef` without a
 * separate effect. `feedIdxRef` is this component's own cursor into
 * `MV_LIST`, advanced by swipes; `router.replace(...)` mirrors it into the URL
 * afterward (so the header/share-dialog/`createMv()` — everything keyed off
 * the `mv` prop — catch up), but never DRIVES the slot DOM, which is why the
 * resulting re-render doesn't disturb whatever is already playing.
 *
 * `lastSyncedIdRef` distinguishes a swipe-driven URL change (already reflected
 * in the slots, skip) from an EXTERNAL one — a different community-mv `Link`
 * clicked elsewhere, or a fresh page load — which hard-resets all three slots
 * from scratch (`resyncSlots`).
 *
 * Circular, not boundary-clamped: unlike the snippet's fixed `FEED` array,
 * `MV_LIST` wraps (see the "VERTICAL SWIPE" note below), so there is no first/
 * last item and therefore nothing for the snippet's edge rubber-band to
 * resist — intentionally not ported. The `.28s cubic-bezier(.4,0,.2,1)`
 * easing and the screen-height-relative commit threshold ARE ported
 * (`SWIPE_THRESHOLD_RATIO`, `SWIPE_TRANSITION`, `SWIPE_COMMIT_MS`).
 *
 * `.mv-player__mobile-header`, the like/share rail and the bottom CTA/controls
 * are siblings of the slots' outer viewport, not descendants, so they never
 * move (verified live: their measured rects are unchanged from idle at every
 * point during a drag).
 */
const MV_LIST = [...TRENDING_MVS, ...NEW_MVS];
/** Screen-height-relative drag distance before it commits to prev/next
 *  instead of springing back — the snippet's own `THRESHOLD_RATIO` (80/693). */
const SWIPE_THRESHOLD_RATIO = 80 / 693;
/** The snippet's own easing — Material standard, tuned for a fast
 *  short-form-feed snap (deliberately NOT the slower carousel-drag easing
 *  used elsewhere in this app; see the snippet's own "EASING NOTE"). */
const SWIPE_TRANSITION = "transform .28s cubic-bezier(.4, 0, .2, 1)";
/** Matches the transition length above, plus a hair of buffer — how long to
 *  wait before rotating slots and snapping the track back to 0. */
const SWIPE_COMMIT_MS = 280;

export function CommunityMvPlayer() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useLocale();
  const id = params.get("id");
  const found = getCommunityMv(id);
  // AC-EXP-07: a missing/invalid id falls back to a default item rather than crashing.
  const mv = found ?? NEW_MVS[0];
  // Designer fix, 2026-08-07: this was hardcoded to `--portrait` regardless of
  // the video's own cover ratio. DP picks the stage shape from `item.ratio`
  // (`isPortrait = item.ratio === '3:4'`); `mvCoverRatio` is the same per-id
  // ratio `MvGridSections`/`MvExplore` already use, so a video's stage shape
  // now matches the cover it was clicked from.
  const isPortrait = mvCoverRatio(mv.id) === "3:4";
  const goBackMobile = useBackNavigation("/explore/mvs");
  // Figma's own subtitle pairs the MV type with the duration half of `meta`
  // (schemas.ts: `meta` is documented as e.g. "Popular | 2-3 min" — a
  // marketing blurb plus a duration). `mvType` replaces the blurb half
  // rather than reusing `meta` wholesale.
  const mobileSubtitle = `${mv.mvType.charAt(0).toUpperCase()}${mv.mvType.slice(1)} | ${
    mv.meta.split("|")[1]?.trim() ?? mv.meta
  }`;

  const { setCompose } = useMvFlow();
  const { requireLogin } = useAuth();
  // Always points at whichever of the three slots (see header comment) is
  // currently playing role "curr" — kept in sync by that slot's own ref
  // callback, not by a separate effect. In the no-defined-neighbour fallback
  // path (`mvIndex < 0`, a single plain `<video>`) it's just that video.
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // See this file's "REWRITTEN AS A 3-SLOT ROTATING TRACK" header comment.
  // `dragY` is the slots' shared live translateY while a drag is in progress
  // (springs back to 0, or is driven to ±stageH to slide fully off before a
  // commit rotates the slots and resets it instantly); `dragging` toggles the
  // transition off for 1:1 finger tracking and for that instant post-rotation
  // reset, back on for every animated move. `dragStartRef` isn't state — it
  // only matters inside the gesture itself, never across a render.
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ y: number; pointerId: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // `-1` (not found in either catalog, e.g. a CREATOR_MVS id reached from
  // `/creator`) means no defined neighbour — the fallback single-video path
  // below, no drag/slots at all.
  const mvIndex = MV_LIST.findIndex((m) => m.id === mv.id);

  // The three permanent slot elements (a ref: which DOM node plays which
  // role is read only from event handlers/effects, never during render).
  const slotVideoRefs = useRef<Array<HTMLVideoElement | null>>([null, null, null]);
  // `roles[roleIdx] = slotIndex` (0=prev, 1=curr, 2=next) and the cursor into
  // `MV_LIST` — state, not refs, because the JSX below reads both to decide
  // each slot's position and content (`react-hooks/refs` disallows reading a
  // ref during render). Only ever written by `resyncSlots`/`commitSwipe`.
  const [roles, setRoles] = useState<[number, number, number]>([0, 1, 2]);
  const [feedIdx, setFeedIdx] = useState(mvIndex);
  const loadedIdsRef = useRef<Array<string | null>>([null, null, null]);
  const lastSyncedIdRef = useRef<string | null>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const [stageH, setStageH] = useState(0);

  // Measures the actual rendered stage height (the snippet's own integration
  // note: "compute it at runtime instead of hard-coding", since this player
  // is full-height on phones, not a fixed mock size) and keeps it current
  // across rotation/orientation changes.
  useEffect(() => {
    const el = stageViewportRef.current;
    if (!el) return;
    const update = () => setStageH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function itemAt(base: number, offset: -1 | 0 | 1) {
    return MV_LIST[(base + offset + MV_LIST.length) % MV_LIST.length];
  }

  function loadSlot(slotIdx: number, item: (typeof MV_LIST)[number] | undefined) {
    const el = slotVideoRefs.current[slotIdx];
    if (!el || !item || loadedIdsRef.current[slotIdx] === item.id) return;
    el.pause();
    el.src = item.video;
    el.load();
    el.currentTime = 0;
    loadedIdsRef.current[slotIdx] = item.id;
  }

  // Hard reset: point all three slots at `mv` and its neighbours from
  // scratch. Runs on mount and on any navigation that did NOT come from our
  // own swipe (a different community-mv `Link` clicked elsewhere) — see
  // `lastSyncedIdRef` below.
  function resyncSlots() {
    setFeedIdx(mvIndex);
    setRoles([0, 1, 2]);
    loadSlot(0, itemAt(mvIndex, -1));
    loadSlot(1, itemAt(mvIndex, 0));
    loadSlot(2, itemAt(mvIndex, 1));
    const curr = slotVideoRefs.current[1];
    if (curr) {
      curr.muted = muted;
      void curr.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
    lastSyncedIdRef.current = mv.id;
  }

  useEffect(() => {
    if (mvIndex < 0 || lastSyncedIdRef.current === mv.id) return;
    resyncSlots();
    // resyncSlots reads several refs/state (muted, feedIdxRef, ...) that are
    // intentionally NOT dependencies — it should only re-run when the URL's
    // `id` changes, not when e.g. mute is toggled mid-playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mv.id, mvIndex]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      // A cold load has no user activation, so play() can reject with
      // NotAllowedError. An unhandled rejection is a console error, and the R-2
      // specs assert the console is empty (the 3b lesson).
      void v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  }

  function seek(next: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = next;
    setCurrentTime(next);
  }

  // GL-02/EXP-02: gate at the action — creating from a community MV requires sign-in.
  function createMv() {
    requireLogin(() => {
      setCompose({
        ...DEFAULT_COMPOSE,
        mvType: mv.mvType,
        description: mv.prompt,
        song: {
          id: `tpl-${mv.id}`,
          source: "sample",
          title: mv.matchedSong.title,
          durationSec: mv.matchedSong.durationSec,
          art: mv.matchedSong.art,
        },
        settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: mv.title } },
      });
      router.push(localePath(locale, "/mv/room"));
    });
  }

  function toggleLike() {
    requireLogin(() => setLiked((l) => !l));
  }

  // See this file's "REWRITTEN AS A 3-SLOT ROTATING TRACK" header comment.
  // Rotates which slot plays which role — the slot already preloaded in the
  // drag's direction is promoted to "curr" and keeps playing uninterrupted;
  // only the now-recycled slot needs new content, loaded off-screen.
  function commitSwipe(direction: 1 | -1) {
    videoRef.current?.pause();
    const newRoles: [number, number, number] =
      direction === 1 ? [roles[1], roles[2], roles[0]] : [roles[2], roles[0], roles[1]];
    const newFeedIdx = (feedIdx + direction + MV_LIST.length) % MV_LIST.length;

    const promoted = slotVideoRefs.current[newRoles[1]];
    if (promoted) {
      promoted.muted = muted;
      void promoted.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
    setCurrentTime(promoted?.currentTime ?? 0);
    setDuration(promoted?.duration ?? 0);

    loadSlot(newRoles[direction === 1 ? 2 : 0], itemAt(newFeedIdx, direction === 1 ? 1 : -1));

    setRoles(newRoles);
    setFeedIdx(newFeedIdx);

    const target = itemAt(newFeedIdx, 0);
    lastSyncedIdRef.current = target.id; // this URL change came from us — resyncSlots must skip it
    router.replace(localePath(locale, `/watch?id=${target.id}`));
  }

  function onStagePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragStartRef.current = { y: e.clientY, pointerId: e.pointerId };
    setDragging(true);
  }

  function onStagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    setDragY(e.clientY - start.y);
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>, commit: boolean) {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (commit && start && start.pointerId === e.pointerId && mvIndex >= 0 && stageH > 0) {
      const delta = e.clientY - start.y;
      const threshold = stageH * SWIPE_THRESHOLD_RATIO;
      if (Math.abs(delta) >= threshold) {
        // Swipe UP (negative delta) reveals the NEXT item — the same
        // direction every short-form-video feed uses; swipe down goes to the
        // previous one. Slide the drag the rest of the way off-screen first
        // (animated), THEN rotate slots and snap back to 0 (instant — the
        // slide already got the user there, this just relabels which
        // physical slot is "curr" without any visible jump).
        const direction: 1 | -1 = delta < 0 ? 1 : -1;
        setDragging(false);
        setDragY(direction === 1 ? -stageH : stageH);
        window.setTimeout(() => {
          commitSwipe(direction);
          setDragging(true);
          setDragY(0);
          requestAnimationFrame(() => setDragging(false));
        }, SWIPE_COMMIT_MS);
        return;
      }
    }
    setDragging(false);
    setDragY(0); // below threshold, or no defined neighbour — spring back
  }

  // EXP-06: an id that resolves to nothing shows a not-found state, not a silent
  // fallback to the first MV.
  if (id && !found) {
    return (
      <>
        <DetailNavbar fallbackPath="/explore/mvs" />
        <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
          <CommunityEmpty
            variant="not-found"
            action={
              <Button onClick={() => router.push(localePath(locale, "/explore/mvs"))}>
                Explore Music Videos
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Compact mobile bar suppressed — `.mv-player__mobile-header` below is
          its DP-intended replacement, see this file's header comment. Desktop
          is unaffected: `hideMobileBar` only does anything under 767px. */}
      <DetailNavbar fallbackPath="/explore/mvs" hideMobileBar />

      {/* `mv-detail--selected` matters, not just naming symmetry: MVDetailPage.css's
          phone media query hides `.mv-detail__grid-section` (including `--primary`)
          specifically UNDER `.mv-detail--selected` — so without this wrapper the
          grid below would show on phones too, unlike DP's own detail state. */}
      <div className="mv-detail mv-detail--selected">
        <div className="mv-player" ref={playerRef}>
          <video
            className="mv-player__backdrop"
            src={mv.video}
            muted
            loop
            autoPlay
            playsInline
            aria-hidden="true"
          />
          <div className="mv-player__backdrop-scrim" aria-hidden="true" />

          {/* Phone-only (`display: none` until 767px — MVDetailPage.css): Back
              + the MV's own title/type-and-length, replacing DetailNavbar's
              now-hidden compact bar. */}
          <div className="mv-player__mobile-header">
            <a
              href={localePath(locale, "/explore/mvs")}
              onClick={(e) => {
                e.preventDefault();
                goBackMobile();
              }}
              className="mv-player__mobile-back"
              aria-label="Back"
            >
              <DpIcon name="ic_arrow_left" className="mv-player__mobile-back-icon" />
            </a>
            <div className="mv-player__mobile-heading">
              <p>{mv.title}</p>
              <span>{mobileSubtitle}</span>
            </div>
          </div>

          <div
            className={`mv-player__stage${mvIndex < 0 && isPortrait ? " mv-player__stage--portrait" : ""}`}
            ref={stageViewportRef}
            style={{ overflow: "hidden", touchAction: "none" }}
            onPointerDown={onStagePointerDown}
            onPointerMove={onStagePointerMove}
            onPointerUp={(e) => endDrag(e, true)}
            onPointerCancel={(e) => endDrag(e, false)}
          >
            {mvIndex < 0 ? (
              // No defined neighbour (e.g. a CREATOR_MVS id) — the plain
              // single video this screen always had; no slots, no peek.
              // Pointer handlers above still spring-back on a drag, matching
              // the tactile feel everywhere else, they just never commit.
              <video
                key={mv.id}
                ref={videoRef}
                className="mv-player__video"
                src={mv.video}
                autoPlay
                loop
                muted={muted}
                playsInline
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onClick={togglePlay}
              />
            ) : (
              [0, 1, 2].map((slotIdx) => {
                const role = roles.indexOf(slotIdx);
                const offset = (role - 1) as -1 | 0 | 1;
                const item = itemAt(feedIdx, offset);
                const isCurrent = role === 1;
                const slotPortrait = mvCoverRatio(item.id) === "3:4";
                return (
                  <div
                    key={`mvp-slot-${slotIdx}`}
                    className={`mv-player__preview-slot${slotPortrait ? " mv-player__preview-slot--portrait" : ""}`}
                    style={{
                      top: offset * stageH,
                      height: stageH || "100%",
                      transform: dragY ? `translateY(${dragY}px)` : undefined,
                      transition: dragging ? "none" : SWIPE_TRANSITION,
                    }}
                  >
                    <video
                      ref={(el) => {
                        // Ref callback, not a render-time read — runs at
                        // commit, keeping `videoRef` pointed at whichever
                        // slot currently plays "curr" (see header comment).
                        // eslint-disable-next-line react-hooks/refs
                        slotVideoRefs.current[slotIdx] = el;
                        if (isCurrent) videoRef.current = el;
                      }}
                      className="mv-player__video"
                      loop
                      playsInline
                      muted={isCurrent ? muted : true}
                      aria-hidden={isCurrent ? undefined : "true"}
                      onLoadedMetadata={(e) => {
                        if (isCurrent) setDuration(e.currentTarget.duration || 0);
                      }}
                      onTimeUpdate={(e) => {
                        if (isCurrent) setCurrentTime(e.currentTarget.currentTime);
                      }}
                      onPlay={() => {
                        if (isCurrent) setPlaying(true);
                      }}
                      onPause={() => {
                        if (isCurrent) setPlaying(false);
                      }}
                      onClick={isCurrent ? togglePlay : undefined}
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="mv-player__floating">
            <div className="mv-player__meta-row">
              <div className="mv-player__meta">
                <p className="mv-player__title">{mv.title}</p>
                {/* R-9: next/link + localePath. DP assigns window.location.href here,
                  which is a full page load AND loses the locale prefix. */}
                <Link href={localePath(locale, "/creator")} className="mv-player__user">
                  <span className="mv-player__avatar">
                    <DpIcon name="ic_account" className="mv-player__avatar-icon" />
                  </span>
                  <span className="mv-player__username">{mv.creator}</span>
                </Link>
              </div>

              <div className="mv-player__actions">
                {/* Phone-only (`display: none` until 767px), fixed to the
                    right edge above `.mv-player__like-share` — see this
                    file's header comment. Same `/creator` destination
                    `.mv-player__meta`'s own creator link already uses. */}
                <Link
                  href={localePath(locale, "/creator")}
                  className="mv-player__mobile-profile"
                  aria-label="View creator profile"
                >
                  <DpIcon name="ic_account" className="mv-player__avatar-icon" />
                </Link>
                <div className="mv-player__like-share">
                  <button
                    type="button"
                    onClick={toggleLike}
                    aria-label={liked ? "Unlike" : "Like"}
                    aria-pressed={liked}
                    className={`icon-button icon-button--medium icon-button--ghost mv-player__action-icon${
                      liked ? " mv-player__action-icon--active" : ""
                    }`}
                  >
                    <DpIcon
                      name={liked ? "ic_favorite_on" : "ic_favorite_off"}
                      className="icon-button__icon"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    aria-label="Share"
                    className="icon-button icon-button--medium icon-button--ghost mv-player__action-icon"
                  >
                    <DpIcon name="ic_share" className="icon-button__icon" />
                  </button>
                </div>
                <button
                  type="button"
                  className="button button--medium button--primary mv-player__cta"
                  onClick={createMv}
                >
                  {/* Designer fix, 2026-08-07: this was WA's pre-migration
                      Tailwind `Button` (`rounded-xl`, `var(--mv-grad)`, 15px
                      bold) — not pill-shaped and not DP's Button at all. DP's
                      own markup is `size="Medium" variant="Primary"
                      trailingIcon={icArrowRight}`, i.e. the shared `.button`
                      BEM classes with the icon AFTER the label. */}
                  {/* Two labels, one shown at a time via CSS (MVDetailPage.css's
                      `.mv-player__cta-desktop`/`--mobile`) — Figma's own
                      wording differs by width, not a rename of one string. */}
                  <span className="button__label mv-player__cta-desktop">Create MV</span>
                  <span className="button__label mv-player__cta-mobile">Create Music Video</span>
                  {/* `--mask` is what PAINTS it: `.button__icon` only sets 16×16,
                    and DP's own Button splits the two (`__icon` alone is for its
                    <img> form). Without the modifier this arrow was a 16×16 hole
                    — found by `.iconcheck.mjs`, not by any screenshot. */}
                  <DpIcon name="ic_arrow_right" className="button__icon button__icon--mask" />
                </button>
              </div>
            </div>

            <div className="mv-player__controls">
              <button
                type="button"
                className="mv-player__control-btn"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
              >
                <DpIcon
                  name={playing ? "ic_pause" : "ic_play"}
                  className="mv-player__control-icon"
                />
              </button>

              <span className="mv-player__time">{formatTime(currentTime)}</span>

              <SeekBar
                value={currentTime}
                max={duration}
                onSeek={seek}
                label="Seek"
                className="mv-player__progress"
                trackClassName="mv-player__progress-track"
                fillClassName="mv-player__progress-fill"
                thumbClassName="mv-player__progress-thumb"
              />

              <span className="mv-player__time">{formatTime(duration)}</span>

              <button
                type="button"
                className="mv-player__control-btn"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                <DpIcon
                  name={muted ? "ic_speaker_off" : "ic_speaker_on"}
                  className="mv-player__control-icon"
                />
              </button>

              {/* `mv-player__fullscreen` (on top of the base control-btn
                  class) is what MVDetailPage.css's mobile query hides —
                  Figma's mobile controller has no fullscreen button (same
                  frame that dropped the time labels). Without this class the
                  button had nothing to match and stayed visible on phones. */}
              <button
                type="button"
                className="mv-player__control-btn mv-player__fullscreen"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
              >
                <DpIcon name="ic_expand" className="mv-player__control-icon" />
              </button>
            </div>
          </div>
        </div>

        <MvGridSections />
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={mv.title}
        url={buildShareUrl(mv.id)}
      />
    </>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
