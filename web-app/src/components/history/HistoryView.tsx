"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath, type Locale } from "@/lib/i18n/config";
import { creationHref, useOpenCreation, useSeedMvFlow } from "@/components/history/useOpenCreation";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl } from "@/lib/share";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PublishConfirmDialog } from "@/components/ui/PublishConfirmDialog";
import { downloadFile } from "@/lib/download";
import {
  HISTORY_SAMPLES,
  SAMPLE_RESULT_VIDEO,
  SAMPLE_AUDIO,
  type HistorySample,
} from "@/lib/mv/mock";
import { formatCount } from "@/lib/mv/community";
import { RoomNavbar, Tabs } from "@/components/shell/RoomNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { DpBadge } from "@/components/ui/DpBadge";
import { DpDialog } from "@/components/ui/DpDialog";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import { useDemoFlag, useDemoState } from "@/components/demo/useDemo";
import {
  publishRejectLabel,
  PUBLISH_REVIEW_DELAY_MS,
  type PublishRejectCode,
} from "@/lib/publishReview";
import { NewMVsSection } from "@/components/home/NewMVsSection";
import { TopPicksSection } from "@/components/home/TopPicksSection";

type Filter = "all" | "mv" | "song" | "liked";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mv", label: "Music Videos" },
  { id: "song", label: "Songs" },
  { id: "liked", label: "Liked" },
];

/** Product owner, 2026-08-27, Figma "History — {All,MV,Song,Liked} Empty"
 *  (nodes 1724:39052 / 40449 / 40757 / 41144). `Liked` has no CTA — it's
 *  someone else's liked content, not something to "go create" (HIST-03: the
 *  tab only ever shows community rows the user liked). */
const EMPTY_STATE: Record<
  Filter,
  {
    icon: string;
    title: string;
    subtitle: string;
    cta?: { label: string; kind: "sheet" | "mv" | "song" };
  }
> = {
  all: {
    icon: "ic_media",
    title: "Your creations will appear here",
    subtitle: "Start making AI music or music videos and they'll all show up in one place.",
    cta: { label: "Start Creating", kind: "sheet" },
  },
  mv: {
    icon: "ic_video_ai",
    title: "No music videos yet",
    subtitle: "Turn your selfie and a song into a cinematic AI music video in minutes.",
    cta: { label: "Create Music Video", kind: "mv" },
  },
  song: {
    icon: "ic_song_ai",
    title: "No songs yet",
    subtitle: "Describe your vibe and let AI compose an original song just for you.",
    cta: { label: "Create Song", kind: "song" },
  },
  liked: {
    icon: "ic_media",
    title: "No likes yet",
    subtitle: "Songs and videos you like will show up here.",
  },
};

interface Override {
  liked?: boolean;
  published?: boolean;
  reviewing?: boolean;
  /** Set only by a rejected submission; cleared the moment a resubmit succeeds. */
  rejectReason?: PublishRejectCode | null;
}

/**
 * The card's title and cover are `<a>` elements because DP's CSS styles them via
 * `.history-card__copy > a` — a direct-child ELEMENT selector carrying the whole
 * title treatment, so a `<button>` renders with none of it.
 *
 * Every click is intercepted (`preventDefault()` → `onOpen()`), so this href never
 * navigates in normal use and behaviour is identical to before. It exists so the
 * markup is honest: middle-click and "copy link address" work, and axe sees an
 * anchor with a destination rather than a bare clickable `<a>`.
 *
 * These are WA's own routes — D3 keeps WA's route model, so DP's `?from=` scheme
 * is not adopted. Mid-flow targets still self-guard when opened without flow state.
 *
 * R-9: locale-prefixed, because copy-link and middle-click are exactly the two
 * paths the `NEXT_LOCALE` cookie redirect does NOT rescue. (Recorded as an open
 * R-9 shape in `PHASE-3-ACCEPTANCE.md` §3 "Also noted"; closed here.)
 */
/** Product owner, 2026-08-31, Figma "History — Loading" (3261:44705, `?demo=1`
 *  panel's "History — slow load"). The design is a static two-frame snapshot
 *  (one dot raised, the other two at rest) rather than a real animation
 *  export — matches the CSS `@keyframes` below (`designer-overrides.css`):
 *  each dot floats up 8px and back, staggered 150ms after the previous one,
 *  "one after another" per the product owner's own description. */
function HistoryLoadingDots() {
  return (
    <div className="history-page__loading-dots" role="status" aria-label="Loading">
      <span className="history-page__loading-dot history-page__loading-dot--1" />
      <span className="history-page__loading-dot history-page__loading-dot--2" />
      <span className="history-page__loading-dot history-page__loading-dot--3" />
    </div>
  );
}

function rowHref(locale: Locale, r: HistorySample): string {
  const path =
    r.source === "community" && r.communitySongId
      ? `/song/play?id=${r.communitySongId}`
      : r.kind === "storyboard"
        ? `/mv/storyboard?id=${r.id}`
        : creationHref({ id: r.id, kind: r.kind });
  return localePath(locale, path);
}

export function HistoryView() {
  const router = useRouter();
  const { history } = useHistory();
  const { locale } = useLocale();
  const openCreation = useOpenCreation();
  const seedMvFlow = useSeedMvFlow();
  const [filter, setFilter] = useState<Filter>("all");
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [ov, setOv] = useState<Record<string, Override>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [share, setShare] = useState<{ title: string; url: string } | null>(null);
  const [del, setDel] = useState<HistorySample | null>(null);
  const [pubConfirm, setPubConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const demoEmpty = useDemoFlag("historyEmpty");
  const demoLoading = useDemoFlag("historyLoading");
  const demo = useDemoState();

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }
  const patch = (id: string, p: Override) => setOv((o) => ({ ...o, [id]: { ...o[id], ...p } }));
  const liked = (r: HistorySample) => ov[r.id]?.liked ?? r.liked;
  const published = (r: HistorySample) => ov[r.id]?.published ?? r.published ?? false;
  const reviewing = (r: HistorySample) => ov[r.id]?.reviewing ?? false;
  const rejectReason = (r: HistorySample) => ov[r.id]?.rejectReason ?? null;

  const rows: HistorySample[] = useMemo(() => {
    const live: HistorySample[] = history.map((h) => ({
      id: h.id,
      kind: h.kind,
      title: h.title,
      // Designer request, 2026-08-11: a still-generating card must not show
      // its source/preview photo — only the gradient + hourglass DP draws
      // for `.history-card--generating`. Previously only "failed" cleared
      // the thumb, so a live job's own seed photo leaked through while it
      // was still rendering.
      thumb: h.status === "failed" || h.status === "generating" ? undefined : h.thumb,
      // Same request: without a stats row, a generating card was one text
      // line shorter than a done card (title+time vs. title+stats+time),
      // which is what made the grid row heights uneven. Giving it the same
      // kind-label meta line failed rows already use keeps every card's
      // info block at 3 lines.
      meta:
        h.status === "failed" || h.status === "generating"
          ? h.kind === "song"
            ? "AI Song"
            : "AI MV"
          : undefined,
      status: h.status === "generating" ? "processing" : h.status === "failed" ? "failed" : "done",
      date: "Just now",
      plays: 0,
      likes: 0,
      shares: 0,
      liked: false,
      resultUrl: h.resultUrl,
    }));
    return [...live, ...HISTORY_SAMPLES].filter((r) => !removed.has(r.id));
  }, [history, removed]);

  // `demoEmpty` (`?demo=1` panel) has to be the LAST thing that decides what
  // renders, not a change to `rows` itself — see `src/lib/demoStore.ts`. Both
  // of `rows`'s sources (live `history` and the `HISTORY_SAMPLES` seed) are
  // covered this way, since the flag is applied after they're combined above.
  const shown = demoEmpty
    ? []
    : rows.filter((r) => {
        const community = r.source === "community";
        // HIST-03: the Liked tab shows only community-liked content, not liked own rows.
        if (filter === "liked") return community && liked(r);
        if (filter === "all") return !community;
        if (filter === "mv") return !community && (r.kind === "mv" || r.kind === "storyboard");
        return !community && r.kind === "song";
      });

  function openRow(r: HistorySample) {
    if (r.status !== "done") return;
    if (r.source === "community" && r.communitySongId) {
      router.push(localePath(locale, `/song/play?id=${r.communitySongId}`));
      return;
    }
    if (r.kind === "storyboard") {
      seedMvFlow(r);
      router.push(localePath(locale, `/mv/storyboard?id=${r.id}`));
      return;
    }
    // A done MV/song row opens ITS OWN result screen (2026-08-06). It used to
    // open `CreationDialog`, a pre-migration Tailwind modal DP has no
    // equivalent of — DP links these rows straight at `/mv-result` and
    // `/song-create?stage=result`. `useOpenCreation` seeds the flow first,
    // because both result screens guard on it.
    openCreation({
      id: r.id,
      kind: r.kind,
      title: r.title,
      thumb: r.thumb,
      resultUrl: r.resultUrl,
    });
  }

  function toggleLike(r: HistorySample) {
    patch(r.id, { liked: !liked(r) });
  }
  function doDownload(r: HistorySample) {
    if (r.kind === "song") downloadFile(SAMPLE_AUDIO, `${r.title}.mp3`);
    else downloadFile(SAMPLE_RESULT_VIDEO, `${r.title}.mp4`);
    setOpenMenu(null);
    showToast("Download started");
  }
  function editMv(r: HistorySample) {
    seedMvFlow(r);
    router.push(localePath(locale, `/mv/edit?id=${r.id}`));
  }
  function createMv(r: HistorySample) {
    seedMvFlow(r);
    router.push(
      localePath(locale, r.kind === "storyboard" ? `/mv/storyboard?id=${r.id}` : "/mv/room"),
    );
  }
  function togglePublishSong(r: HistorySample) {
    const next = !published(r);
    patch(r.id, { published: next });
    showToast(next ? "Published success" : "Unpublished success");
  }
  function togglePublishMv(r: HistorySample) {
    if (published(r) || reviewing(r)) {
      patch(r.id, { published: false, reviewing: false, rejectReason: null });
      showToast("Unpublished success");
      return;
    }
    setPubConfirm(r.id);
  }
  // 2.5: the `?demo=1` panel's `publishRejected` flag decides what a submission
  // comes back as — the same "fake backend result" shape `[fail]` already uses
  // for job generation. Rule 2 (product owner, 2026-08-27): a rejection reverts
  // to unpublished (not a fourth persistent state), so the reason lives beside
  // `published`/`reviewing` in the override map and clears itself the moment a
  // resubmit is accepted.
  //
  // Product owner, 2026-08-28: submitting doesn't resolve immediately —
  // `reviewing` sits true (toggle OFF, "Publish (Review)") for
  // `PUBLISH_REVIEW_DELAY_MS`, THEN `published` flips true (toggle ON) or the
  // reject reason lands, matching `MvResult`'s own pending phase. The flag/
  // reason are captured now, not re-read when the timer fires, so a QA
  // toggling the panel mid-review doesn't change an already-submitted result.
  function confirmPublishMv() {
    if (pubConfirm) {
      const id = pubConfirm;
      const rejected = demo.flags.publishRejected;
      const reason = demo.rejectReason;
      patch(id, { reviewing: true, published: false, rejectReason: null });
      showToast("Submitted for review");
      window.setTimeout(() => {
        if (rejected) {
          patch(id, { reviewing: false, published: false, rejectReason: reason });
        } else {
          patch(id, { reviewing: false, published: true, rejectReason: null });
        }
      }, PUBLISH_REVIEW_DELAY_MS);
    }
    setPubConfirm(null);
  }

  return (
    <>
      {/*
        The page renders its own navbar (plan CH2 / Slice 2b). DP passes it as a
        prop to AppLayout; App Router cannot, since the page lives inside the
        layout — but `.room-navbar` is `position: sticky`, so rendering it as the
        first child here behaves identically. The shell draws no header of its own
        on this route (or any route below `/`).

        The title and the filter tabs both move up into it, which is where DP puts
        them: the tabs stop scrolling away with the page body.

        `mobileHeaderActions` (2026-08-23): on mobile this also carries the
        subscribe-crown/account-link pair the shell's `MobileHeader` used to
        render as a SEPARATE sticky bar above this one — `AppShell.tsx` no
        longer mounts that on `/history`, so this is now the only header, on
        both desktop and mobile, matching how every other RoomNavbar/
        DetailNavbar page already works.
      */}
      <RoomNavbar
        title="My Creations"
        tabsSlot={
          demoLoading ? undefined : <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
        }
        mobileHeaderActions
      />

      <div className="history-page">
        {/* Product owner, 2026-08-31, Figma "History — Loading" (3261:44705).
            A slow-load state, not another empty variant — the tabs (nothing
            to filter yet) and the empty state's recommend rails are both
            hidden in the design, so this is its own branch rather than a
            fifth `EMPTY_STATE` entry. */}
        {demoLoading ? (
          <div className="history-page__loading">
            <HistoryLoadingDots />
          </div>
        ) : (
          <>
            {/* HIST-02's disclosure line lived here (retention policy: no 14-day
                auto-delete) — removed 2026-08-11 per explicit designer request,
                after flagging that it carried a product rule rather than being
                decoration. The underlying retention BEHAVIOR is unchanged; this
                only removes the on-screen copy stating it. */}
            {shown.length === 0 ? (
              <div className="history-page__empty">
                <DpIcon name={EMPTY_STATE[filter].icon} className="history-page__empty-icon" />
                <div className="history-page__empty-message">
                  <p className="history-page__empty-title">{EMPTY_STATE[filter].title}</p>
                  <p className="history-page__empty-subtitle">{EMPTY_STATE[filter].subtitle}</p>
                </div>
                {EMPTY_STATE[filter].cta && (
                  <button
                    type="button"
                    className="history-page__empty-cta"
                    onClick={() => {
                      const cta = EMPTY_STATE[filter].cta!;
                      if (cta.kind === "sheet") setCreateSheetOpen(true);
                      else
                        router.push(
                          localePath(locale, cta.kind === "mv" ? "/mv/room" : "/song/create"),
                        );
                    }}
                  >
                    {EMPTY_STATE[filter].cta.label}
                  </button>
                )}
              </div>
            ) : null}

            {/* Product owner request, 2026-08-28 — give the empty tabs somewhere to
                send a user besides the CTA. Desktop only: neither rail has a Figma
                treatment for the History page below 768px, and the tabs' own
                artboards are desktop-only (1440px). Reuses Home's existing rails
                verbatim rather than inventing a third "recommendation" component. */}
            {shown.length === 0 &&
              (filter === "all" || filter === "mv" ? (
                <div className="history-page__recommend">
                  <NewMVsSection />
                </div>
              ) : (
                <div className="history-page__recommend">
                  <TopPicksSection />
                </div>
              ))}

            {shown.length > 0 && (
              <ul className="history-page__grid">
                {shown.map((r) => (
                  <li key={r.id}>
                    <HistoryCard
                      r={r}
                      liked={liked(r)}
                      onOpen={() => openRow(r)}
                      href={rowHref(locale, r)}
                      cta={
                        // HIST-05: storyboards surface Create outside the ⋯ menu. DP places
                        // it on the cover itself (.history-card__create) rather than as a
                        // row pill; same affordance, same handler.
                        r.kind === "storyboard" && r.status === "done" ? (
                          <span
                            className="history-card__create"
                            onClick={(e) => {
                              e.preventDefault();
                              createMv(r);
                            }}
                          >
                            <DpIcon name="ic_video" />
                            Create MV
                          </span>
                        ) : null
                      }
                      menu={
                        r.status === "processing" ? null : (
                          <Menu
                            r={r}
                            liked={liked(r)}
                            published={published(r)}
                            reviewing={reviewing(r)}
                            rejectReason={rejectReason(r)}
                            open={openMenu === r.id}
                            setOpen={(v) => setOpenMenu(v ? r.id : null)}
                            onLike={() => toggleLike(r)}
                            onShare={() => {
                              setOpenMenu(null);
                              setShare({ title: r.title, url: buildShareUrl(r.id) });
                            }}
                            onDownload={() => doDownload(r)}
                            onDelete={() => {
                              setOpenMenu(null);
                              setDel(r);
                            }}
                            onPublish={() =>
                              r.kind === "mv" ? togglePublishMv(r) : togglePublishSong(r)
                            }
                            onEditMv={() => editMv(r)}
                            onCreateMv={() => createMv(r)}
                          />
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <ShareDialog
          open={share != null}
          onClose={() => setShare(null)}
          title={share?.title ?? ""}
          url={share?.url ?? ""}
        />

        <Modal open={del != null} onClose={() => setDel(null)} title="Delete" maxWidth={380}>
          <p className="mb-5 text-[14px]" style={{ color: "var(--text-2)" }}>
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDel(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (del) setRemoved((s) => new Set(s).add(del.id));
                setDel(null);
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>

        <PublishConfirmDialog
          open={pubConfirm != null}
          onCancel={() => setPubConfirm(null)}
          onConfirm={confirmPublishMv}
        />

        <CreateSheet open={createSheetOpen} onClose={() => setCreateSheetOpen(false)} />

        {toast && (
          <div
            className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg"
            style={{ background: "rgba(20,20,24,.95)" }}
          >
            {toast}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The "All" empty state's CTA (product owner, 2026-08-27, Figma "History —
 * All Empty Create", node 1724:41428) — a centred picker on desktop/tablet,
 * the same "mobile-tabbar-sheet" bottom-sheet style as the home tab bar's own
 * create sheet on phones (that sheet is a separate instance, triggered from a
 * different entry point; this one matches its look for consistency on a page
 * where both could plausibly be seen). No DP source for this exact dialog, so
 * its classes are new, in `designer-overrides.css` — see that file's header.
 */
function CreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { locale } = useLocale();

  function go(path: string) {
    onClose();
    router.push(localePath(locale, path));
  }

  return (
    <DpDialog
      open={open}
      onClose={onClose}
      block="create-sheet"
      label="What would you like to create?"
    >
      <div className="create-sheet__handle" aria-hidden="true" />
      <div className="create-sheet__header">
        <p className="create-sheet__title">What would you like to create?</p>
        <button type="button" className="create-sheet__close" onClick={onClose} aria-label="Close">
          <img src="/assets/icons/ui/ic_close.svg" alt="" className="create-sheet__close-icon" />
        </button>
      </div>
      <div className="create-sheet__options">
        <button type="button" className="create-sheet__option" onClick={() => go("/mv/room")}>
          <span className="create-sheet__option-icon create-sheet__option-icon--mv">
            <DpIcon name="ic_video_ai" className="create-sheet__option-icon-glyph" />
          </span>
          <span className="create-sheet__option-info">
            <span className="create-sheet__option-label">AI Music Video</span>
            <span className="create-sheet__option-sub">Selfie + music → cinematic MV</span>
          </span>
          <DpIcon name="ic_chevron-right" className="create-sheet__option-chevron" />
        </button>
        <button type="button" className="create-sheet__option" onClick={() => go("/song/create")}>
          <span className="create-sheet__option-icon create-sheet__option-icon--song">
            <DpIcon name="ic_song_ai" className="create-sheet__option-icon-glyph" />
          </span>
          <span className="create-sheet__option-info">
            <span className="create-sheet__option-label">AI Song</span>
            <span className="create-sheet__option-sub">Lyrics + style → original track</span>
          </span>
          <DpIcon name="ic_chevron-right" className="create-sheet__option-chevron" />
        </button>
      </div>
    </DpDialog>
  );
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 1.5 spike) ──────────────────────
 *
 * Markup and classes come from `src/styles/designer/HistoryPage.css`, copied
 * verbatim from DP. Per G3-d this subtree carries NO Tailwind utilities — mixing
 * them is what makes the two systems fight. Everything the card *does* is still
 * WA's: the props, the handlers, and the menu are unchanged.
 *
 * Two adaptations DP's CSS forces, both deliberate:
 *  · The title must be an `<a>` — `.history-card__copy > a` is a direct-child
 *    element selector carrying the whole title treatment (colour/size/ellipsis),
 *    so a `<button>` renders unstyled. It gets a real href AND an intercepted
 *    click, so behaviour is exactly as before (the dialog still opens) while the
 *    row gains middle-click and copy-link. See `rowHref()`.
 *  · The date must be a `<time>` for the same reason.
 */
function HistoryCard({
  r,
  liked,
  onOpen,
  menu,
  cta,
  href,
}: {
  r: HistorySample;
  liked: boolean;
  onOpen: () => void;
  menu: React.ReactNode;
  cta?: React.ReactNode;
  href: string;
}) {
  const clickable = r.status === "done";
  const showStats = r.status === "done" && (r.kind === "mv" || r.kind === "song");
  // DP models a done storyboard as its own "Ready" state (Create MV on the cover)
  // rather than as a fourth status; WA carries that as kind + status.
  const ready = r.kind === "storyboard" && r.status === "done";
  const state = r.status === "processing" ? "generating" : ready ? "ready" : r.status;
  const typeClass = r.kind === "mv" ? "music-video" : r.kind;
  const typeIcon = r.kind === "song" ? "ic_song" : r.kind === "mv" ? "ic_video" : "ic_script";

  // The click is always intercepted, so this href never navigates in normal use —
  // it exists so the title is a real link (DP's CSS requires `> a`) and so
  // middle-click / copy-link behave. Mid-flow routes still self-guard if opened cold.
  function open(e: React.MouseEvent) {
    e.preventDefault();
    onOpen();
  }

  return (
    <article className={`history-card history-card--${state}`}>
      <a
        href={href}
        onClick={open}
        className={`history-card__cover history-card__cover--${typeClass}`}
        aria-label={r.title}
        tabIndex={clickable ? 0 : -1}
      >
        {r.thumb && <img src={r.thumb} alt="" />}
        {r.status === "done" && <span className="history-card__cover-scrim" aria-hidden="true" />}
        <div className="history-card__status-slot">
          {r.status === "processing" && <DpBadge status="Processing" />}
          {r.status === "failed" && <DpBadge status="Failed" />}
          {r.status === "done" && !ready && r.source !== "community" && <DpBadge status="Done" />}
        </div>
        {r.status === "processing" && (
          <DpIcon
            name="ic_timer"
            className="history-card__state-icon history-card__state-icon--generating"
          />
        )}
        {r.status === "failed" && (
          <DpIcon
            name="ic_alert"
            className="history-card__state-icon history-card__state-icon--failed"
          />
        )}
        {ready && cta}
        {r.status === "done" && !ready && (
          <span className="history-card__play">
            <DpIcon name="ic_play" />
          </span>
        )}
        <DpIcon name={typeIcon} className="history-card__type-icon" />
      </a>

      <div className="history-card__info">
        <div className="history-card__copy">
          <a href={href} onClick={open}>
            {r.title}
          </a>
          {showStats ? (
            <div className="history-card__social">
              <span className="history-card__social-stat">
                <DpIcon name="ic_headphones" />
                {formatCount(r.plays)}
              </span>
              <span className="history-card__social-stat">
                <DpIcon name={liked ? "ic_favorite_on" : "ic_favorite_off"} />
                {formatCount(r.likes + (liked && !r.liked ? 1 : 0))}
              </span>
              <span className="history-card__social-stat">
                <DpIcon name="ic_share" />
                {formatCount(r.shares)}
              </span>
            </div>
          ) : (
            <p>{r.meta}</p>
          )}
          <time>{r.date}</time>
        </div>
        {menu}
      </div>
    </article>
  );
}

interface MenuProps {
  r: HistorySample;
  liked: boolean;
  published: boolean;
  reviewing: boolean;
  rejectReason: PublishRejectCode | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  onLike: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onEditMv: () => void;
  onCreateMv: () => void;
}

function Menu(p: MenuProps) {
  const { r } = p;
  const community = r.source === "community";
  const failed = r.status === "failed";
  const isMv = r.kind === "mv";
  const isSong = r.kind === "song";
  const isStoryboard = r.kind === "storyboard";
  const hideDelete = (isMv && (p.published || p.reviewing)) || (isSong && p.published);

  const btnRef = useRef<HTMLButtonElement>(null);
  // See this component's render below ("MOBILE BOTTOM SHEET, 2026-08-23").
  const isPhone = useMediaQuery(PHONE_QUERY);
  // Fade in/out, 0.2s (2026-08-14): the portal is now ALWAYS mounted (see the
  // render below) rather than conditionally on `p.open` — same "always-
  // mounted + inert instead of a timed unmount" convention already used for
  // WA's other overlays (`useMountTransition` was deliberately NOT ported,
  // per AGENTS.md). It plays the transition in both directions for free and
  // needs no JS timer to keep the closing menu around long enough to fade
  // out: the element is already in the DOM before `p.open` ever flips, so
  // toggling its class in the SAME click handler that flips `p.open` is
  // enough for the browser to animate from the resting (opacity: 0) state.
  // A start position of `{0, 0}` is fine — it's `inert` and invisible until
  // the first open, at which point `toggle()` below computes the real one.
  const [pos, setPos] = useState({ top: 0, right: 0 });

  function toggle() {
    if (!p.open) {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        // `document.documentElement.getBoundingClientRect().width`, NOT
        // `window.innerWidth` NOR `clientWidth` — measured live, both of
        // those report 1440 on a page whose actual rendered viewport (same
        // coordinate space `getBoundingClientRect()` and `position: fixed`
        // both use) is 1425: `clientWidth` disagreed with its own element's
        // rect. That 15px mismatch alone was the entire "menu is too far
        // from the button" drift — the gap itself was only ever the
        // intended few px. Product owner request, 2026-08-14 ("much closer
        // to the menu button") also drops the vertical gap 6px -> 4px.
        const viewportWidth = document.documentElement.getBoundingClientRect().width;
        setPos({
          top: rect.bottom + 4,
          right: Math.max(8, viewportWidth - rect.right),
        });
      }
    }
    p.setOpen(!p.open);
  }

  // Product owner request, 2026-08-14 — close on scroll rather than tracking
  // the card (an earlier version of this fix recomputed `pos` on scroll to
  // follow the card; replaced by this simpler close-on-scroll per updated
  // direction). `capture: true` catches scrolling on any nested scrollable
  // ancestor too, not just the window — scroll events don't bubble, so a
  // plain bubble-phase listener would miss those.
  useEffect(() => {
    if (!p.open) return;
    function close() {
      p.setOpen(false);
    }
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.open]);

  return (
    <div className="shrink-0">
      {/* Designer fix, 2026-08-11: this was a generic Tailwind circle (36px,
          --card-2 fill, an inline-SVG dot icon) — not DP's actual
          `.history-card__more` (28px, white-15 fill + border, its own
          `ic_more` mask icon). Swapped to the real class + DpIcon so this
          matches DP's design instead of an approximation of it. */}
      <button ref={btnRef} aria-label="Options" onClick={toggle} className="history-card__more">
        <DpIcon name="ic_more" />
      </button>

      {createPortal(
        <>
          {/* ── MOBILE BOTTOM SHEET, 2026-08-23 (product owner) ────────────
              `.history-card__menu`'s own mobile rule (HistoryPage.css,
              `@media (max-width: 767px)`) already makes it a full-width,
              rounded-top bottom sheet (`left:0; right:0; bottom:0; top:auto`)
              with a matching dim `.history-card__menu-backdrop` and a
              `.history-card__menu-handle` drag bar — both fully styled but
              never rendered until now, the same "CSS ahead of the port"
              shape this codebase keeps hitting. The reason it never fit the
              screen width on phones: the desktop dropdown-positioning
              `style={{ top, right }}` below is INLINE, so it always wins
              over the stylesheet's `left/right/bottom/top` regardless of
              specificity — with all four insets effectively set, the box
              stretched between the inline `right` (a few px from the ⋯
              button) and the CSS `left: 0` instead of spanning edge to
              edge. Skipping the inline positioning on phone lets the
              stylesheet's bottom-sheet rule fully own the box. */}
          {p.open &&
            (isPhone ? (
              <div className="history-card__menu-backdrop" onClick={() => p.setOpen(false)} />
            ) : (
              <div className="fixed inset-0 z-[90]" onClick={() => p.setOpen(false)} />
            ))}
          {/* Product owner request, 2026-08-14 — this popup was still raw Tailwind
              (see the file header note this replaces): a generic dark card with
              inline-SVG icons instead of DP's real `.history-card__menu` system
              (HistoryPage.css lines 320-436), which already has both CTA looks
              built (`--gradient` for "Create MV", plain white for "Edit MV") plus
              colour-correct row icons and a red `.history-card__menu-delete`. The
              portal + JS-computed fixed position is kept (proven to escape the
              grid card's stacking context); only the visual classes change. */}
          <div
            className={`history-card__menu${p.open ? " history-card__menu--visible" : ""}`}
            role="menu"
            inert={!p.open}
            style={isPhone ? undefined : { position: "fixed", top: pos.top, right: pos.right }}
          >
            {isPhone && <div className="history-card__menu-handle" aria-hidden="true" />}
            {!community && !failed && (
              <>
                {/* MV-13: a published / in-review MV must be unpublished before
                    editing. Product owner, 2026-08-28: the entry now disappears
                    rather than becoming "Unpublish to edit" — the Publish toggle
                    below is the only way back to editable. */}
                {isMv && !p.published && !p.reviewing && (
                  <CtaBtn
                    label="Edit MV"
                    icon="ic_edit"
                    onClick={() => {
                      p.setOpen(false);
                      p.onEditMv();
                    }}
                  />
                )}
                {(isSong || isStoryboard) && (
                  <CtaBtn
                    label="Create MV"
                    gradient
                    icon="ic_video_ai"
                    onClick={() => {
                      p.setOpen(false);
                      p.onCreateMv();
                    }}
                  />
                )}
              </>
            )}

            {/* HIST-06: a failed creation is Delete-only — no Like / Share. */}
            {!failed && (community || isMv || isSong) && (
              <OptRow
                icon={p.liked ? "ic_favorite_on" : "ic_favorite_off"}
                label={p.liked ? "Unlike" : "Like"}
                onClick={p.onLike}
                active={p.liked}
              />
            )}
            {!failed && (community || isMv || isSong) && (
              <OptRow icon="ic_share" label="Share" onClick={p.onShare} />
            )}

            {!community && !failed && (isMv || isSong) && (
              <>
                <div className="history-card__menu-publish">
                  <span>
                    <DpIcon as="i" name={isMv && p.reviewing ? "ic_timer" : "ic_publish"} />
                    {isMv && p.rejectReason ? (
                      // Product owner, 2026-08-28, Figma "History - Menu"
                      // (node 2695:117710): title gains a red "(Rejected)"
                      // suffix, plus a reason line no other Publish state has.
                      <span className="history-card__menu-publish-text">
                        <span className="history-card__menu-publish-title">
                          Publish <em>(Rejected)</em>
                        </span>
                        <span className="history-card__menu-publish-reason">
                          {publishRejectLabel(p.rejectReason)}
                        </span>
                      </span>
                    ) : isMv && p.reviewing ? (
                      "Publish (Review)"
                    ) : (
                      "Publish"
                    )}
                  </span>
                  {/* Product owner, 2026-08-28: the toggle stays OFF through
                        the pending phase (`reviewing`) and only turns on once
                        approved (`published`) — it is no longer "on for either". */}
                  <ToggleSwitch
                    checked={p.published}
                    onChange={() => p.onPublish()}
                    ariaLabel={isMv && p.reviewing ? "Publish (Review)" : "Publish"}
                  />
                </div>
                <OptRow icon="ic_download" label="Download" onClick={p.onDownload} />
                {!hideDelete && (
                  <OptRow icon="ic_delete" label="Delete" danger onClick={p.onDelete} />
                )}
              </>
            )}

            {(failed || isStoryboard) && (
              <OptRow icon="ic_delete" label="Delete" danger onClick={p.onDelete} />
            )}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

function CtaBtn({
  label,
  icon,
  gradient,
  onClick,
}: {
  label: string;
  icon: string;
  gradient?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`history-card__menu-primary${gradient ? " history-card__menu-primary--gradient" : ""}`}
    >
      <DpIcon name={icon} />
      {label}
    </button>
  );
}

function OptRow({
  icon,
  label,
  onClick,
  danger,
  active,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={danger ? "history-card__menu-delete" : undefined}
    >
      <DpIcon name={icon} className={active ? "history-card__menu-item-icon--active" : undefined} />
      {label}
    </button>
  );
}
