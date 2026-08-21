"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";

type Filter = "all" | "mv" | "song" | "liked";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mv", label: "Music Videos" },
  { id: "song", label: "Songs" },
  { id: "liked", label: "Liked" },
];

interface Override {
  liked?: boolean;
  published?: boolean;
  reviewing?: boolean;
}

/** `useLayoutEffect` warns during SSR; fall back to `useEffect` there. Same
 *  pattern `SongDetailView.tsx` uses for its own navbar-height measurement. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

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

  // ── ROOM-NAVBAR STICKY OFFSET, 2026-08-23 (product owner) ────────────────
  // `.room-navbar` is `position: sticky; top: 0` (RoomNavbar.css) — correct
  // everywhere else RoomNavbar is used, but on THIS route `.mobile-header` is
  // ALSO sticky at `top: 0, z-index: 20` (same z-index), rendered by
  // `AppShell` just above it in the DOM (History is one of the two "layer 1"
  // routes that keep the shell header — see AppShell.tsx's own comment). Two
  // sticky elements both pinned to the exact same `top: 0` land on top of
  // each other rather than stacking — `.room-navbar` was sticking, just
  // directly UNDERNEATH `.mobile-header`, invisible for the entire scroll.
  // Measuring `.mobile-header`'s real height and feeding it in as `top` is
  // the same fix (same reason: a runtime value, not a breakpoint one) as
  // `SongDetailView.tsx`'s own navbar-height measurement. On desktop
  // `.mobile-header` is DP's own `display: none`, so `getBoundingClientRect()`
  // reports 0 and `top` resolves back to 0 — no breakpoint check needed here.
  const [navbarTop, setNavbarTop] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const header = document.querySelector(".mobile-header");
    if (!header) return;

    function measure() {
      setNavbarTop(document.querySelector(".mobile-header")?.getBoundingClientRect().height ?? 0);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }
  const patch = (id: string, p: Override) => setOv((o) => ({ ...o, [id]: { ...o[id], ...p } }));
  const liked = (r: HistorySample) => ov[r.id]?.liked ?? r.liked;
  const published = (r: HistorySample) => ov[r.id]?.published ?? r.published ?? false;
  const reviewing = (r: HistorySample) => ov[r.id]?.reviewing ?? false;

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

  const shown = rows.filter((r) => {
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
      patch(r.id, { published: false, reviewing: false });
      showToast("Unpublished success");
      return;
    }
    setPubConfirm(r.id);
  }
  function confirmPublishMv() {
    if (pubConfirm) {
      patch(pubConfirm, { reviewing: true, published: true });
      showToast("Submitted for review");
    }
    setPubConfirm(null);
  }

  return (
    <>
      {/*
        The page renders its own navbar (plan CH2 / Slice 2b). DP passes it as a
        prop to AppLayout; App Router cannot, since the page lives inside the
        layout — but `.room-navbar` is `position: sticky`, so rendering it as the
        first child here behaves identically. `AppShell.OWN_CHROME` lists this
        route so the legacy TopBar stays out of the way.

        The title and the filter tabs both move up into it, which is where DP puts
        them: the tabs stop scrolling away with the page body.
      */}
      <RoomNavbar
        title="My Creations"
        tabsSlot={<Tabs tabs={FILTERS} active={filter} onChange={setFilter} />}
        style={{ top: navbarTop }}
      />

      <div className="history-page">
        {/* HIST-02's disclosure line lived here (retention policy: no 14-day
            auto-delete) — removed 2026-08-11 per explicit designer request,
            after flagging that it carried a product rule rather than being
            decoration. The underlying retention BEHAVIOR is unchanged; this
            only removes the on-screen copy stating it. */}
        {shown.length === 0 ? (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}
          >
            Nothing here yet. Your{" "}
            {filter === "all"
              ? "creations"
              : FILTERS.find((f) => f.id === filter)?.label.toLowerCase()}{" "}
            will appear here.
          </div>
        ) : (
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
/** DP's Badge (styles/designer/Badge.css) for the states the cover shows. */
function DpBadge({ status }: { status: "Done" | "Failed" | "Processing" }) {
  const icon = status === "Done" ? "ic_check" : status === "Failed" ? "ic_close" : "ic_star";
  const label = status === "Processing" ? "Generating..." : status;
  return (
    <span className={`badge badge--${status.toLowerCase()}`}>
      <DpIcon name={icon} className="badge__icon" />
      <span>{label}</span>
    </span>
  );
}

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
      <button
        ref={btnRef}
        aria-label="Options"
        onClick={toggle}
        className="history-card__more"
      >
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
                  {/* MV-13: a published / in-review MV must be unpublished before editing;
                    the Edit MV entry becomes a neutral "Unpublish to edit MV" that unpublishes.
                    Figma has no separate look for this corrective action, so it shares
                    Edit MV's plain white pill rather than inventing an undesigned variant. */}
                  {isMv &&
                    (p.published || p.reviewing ? (
                      <CtaBtn
                        label="Unpublish to edit"
                        icon="ic_edit"
                        onClick={() => {
                          p.setOpen(false);
                          p.onPublish();
                        }}
                      />
                    ) : (
                      <CtaBtn
                        label="Edit MV"
                        icon="ic_edit"
                        onClick={() => {
                          p.setOpen(false);
                          p.onEditMv();
                        }}
                      />
                    ))}
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
                      {isMv && p.reviewing ? "Publish (Review)" : "Publish"}
                    </span>
                    <ToggleSwitch
                      checked={p.published || p.reviewing}
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
