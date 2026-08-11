"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
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
import { downloadFile } from "@/lib/download";
import {
  HISTORY_SAMPLES,
  SAMPLE_RESULT_VIDEO,
  SAMPLE_AUDIO,
  type HistorySample,
} from "@/lib/mv/mock";
import { formatCount } from "@/lib/mv/community";
// Heart/Share are still WA's inline-SVG icons because the ⋯ menu is NOT migrated
// in this spike — D4 says convert only the screen you are migrating, and the menu
// is still Tailwind. The card itself uses DP's mask icons via DpIcon.
import { Heart, Share } from "@/components/community/ui";
import { RoomNavbar, Tabs } from "@/components/shell/RoomNavbar";
import { DpIcon } from "@/components/ui/DpIcon";

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

function I({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
const ICON = {
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  video: "M15 10l4.5-2.5v9L15 14M3 7h12v10H3z",
  publish: "M12 3v12m0-12 4 4m-4-4-4 4M5 21h14",
  timer: "M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  more: "M12 5h.01M12 12h.01M12 19h.01",
  alert:
    "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
};

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className="relative inline-block h-5 w-9 rounded-full transition-colors"
      style={{ background: on ? "var(--accent)" : "var(--card-3)" }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
        style={{ left: on ? "18px" : "2px" }}
      />
    </span>
  );
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
      thumb: h.status === "failed" ? undefined : h.thumb,
      meta: h.status === "failed" ? (h.kind === "song" ? "AI Song" : "AI MV") : undefined,
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

        <Modal
          open={pubConfirm != null}
          onClose={() => setPubConfirm(null)}
          title="Ready to Go Public?"
          maxWidth={420}
        >
          <p className="mb-5 text-[14px]" style={{ color: "var(--text-2)" }}>
            Once published, your creation is visible to the community and may be shared on our
            social channels.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setPubConfirm(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={confirmPublishMv}>
              Confirm
            </Button>
          </div>
        </Modal>

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
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  function toggle() {
    if (p.open) {
      p.setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    p.setOpen(true);
  }

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        aria-label="Options"
        onClick={toggle}
        className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:brightness-125"
        style={{ background: "var(--card-2)", color: "var(--text-2)" }}
      >
        <I d={ICON.more} />
      </button>

      {p.open &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => p.setOpen(false)} />
            <div
              className="fixed z-[91] w-60 overflow-hidden rounded-2xl border p-2 shadow-2xl"
              style={{
                top: pos.top,
                right: pos.right,
                background: "var(--card)",
                borderColor: "var(--border-2)",
              }}
            >
              {!community && !failed && (
                <div className="mb-1 flex gap-2 p-1">
                  {/* MV-13: a published / in-review MV must be unpublished before editing;
                    the Edit MV entry becomes a neutral "Unpublish to edit MV" that unpublishes. */}
                  {isMv &&
                    (p.published || p.reviewing ? (
                      <CtaBtn
                        label="Unpublish to edit"
                        icon={ICON.edit}
                        onClick={() => {
                          p.setOpen(false);
                          p.onPublish();
                        }}
                      />
                    ) : (
                      <CtaBtn
                        label="Edit MV"
                        primary
                        icon={ICON.edit}
                        onClick={() => {
                          p.setOpen(false);
                          p.onEditMv();
                        }}
                      />
                    ))}
                  {(isSong || isStoryboard) && (
                    <CtaBtn
                      label="Create MV"
                      primary
                      icon={ICON.video}
                      onClick={() => {
                        p.setOpen(false);
                        p.onCreateMv();
                      }}
                    />
                  )}
                </div>
              )}

              {/* HIST-06: a failed creation is Delete-only — no Like / Share. */}
              {!failed && (community || isMv || isSong) && (
                <OptRow
                  icon={<Heart size={18} filled={p.liked} />}
                  label={p.liked ? "Unlike" : "Like"}
                  active={p.liked}
                  onClick={p.onLike}
                />
              )}
              {!failed && (community || isMv || isSong) && (
                <OptRow icon={<Share size={18} />} label="Share" onClick={p.onShare} />
              )}

              {!community && !failed && (isMv || isSong) && (
                <>
                  <OptRow
                    icon={<I d={isMv && p.reviewing ? ICON.timer : ICON.publish} />}
                    label={isMv && p.reviewing ? "Publish (Review)" : "Publish"}
                    trailing={<Toggle on={p.published || p.reviewing} />}
                    onClick={p.onPublish}
                  />
                  <OptRow icon={<I d={ICON.download} />} label="Download" onClick={p.onDownload} />
                  {!hideDelete && (
                    <OptRow
                      icon={<I d={ICON.trash} />}
                      label="Delete"
                      danger
                      onClick={p.onDelete}
                    />
                  )}
                </>
              )}

              {(failed || isStoryboard) && (
                <OptRow icon={<I d={ICON.trash} />} label="Delete" danger onClick={p.onDelete} />
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
  primary,
  onClick,
}: {
  label: string;
  icon: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.97]"
      style={
        primary
          ? { background: "var(--accent)", color: "#fff" }
          : { background: "var(--card-2)", color: "var(--text)" }
      }
    >
      <I d={icon} size={15} /> {label}
    </button>
  );
}

function OptRow({
  icon,
  label,
  trailing,
  onClick,
  active,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-[var(--card-2)]"
      style={{ color: danger ? "#FF4E50" : active ? "var(--accent)" : "var(--text)" }}
    >
      <span className="grid w-5 place-items-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  );
}
