"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { CreationDialog, type CreationLike } from "@/components/mv/CreationDialog";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl } from "@/lib/share";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { downloadFile } from "@/lib/download";
import { HISTORY_SAMPLES, SAMPLE_RESULT_VIDEO, SAMPLE_AUDIO, mockStoryboard, type HistorySample } from "@/lib/mv/mock";
import { DEFAULT_COMPOSE } from "@/lib/mv/types";
import { formatCount } from "@/lib/mv/community";
import { Headphones, Heart, Share } from "@/components/community/ui";

type Filter = "all" | "mv" | "song" | "liked";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mv", label: "Music Videos" },
  { id: "song", label: "Songs" },
  { id: "liked", label: "Liked" },
];

interface Override { liked?: boolean; published?: boolean; reviewing?: boolean }

function I({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}
const ICON = {
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  proof: "M12 2l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V6z M9 12l2 2 4-4",
  video: "M15 10l4.5-2.5v9L15 14M3 7h12v10H3z",
  publish: "M12 3v12m0-12 4 4m-4-4-4 4M5 21h14",
  timer: "M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  more: "M12 5h.01M12 12h.01M12 19h.01",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
};

function Toggle({ on }: { on: boolean }) {
  return (
    <span className="relative inline-block h-5 w-9 rounded-full transition-colors" style={{ background: on ? "var(--accent)" : "var(--card-3)" }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: on ? "18px" : "2px" }} />
    </span>
  );
}

export function HistoryView() {
  const router = useRouter();
  const { history } = useHistory();
  const { setStoryboard, saveStoryboard, setCompose } = useMvFlow();
  const [filter, setFilter] = useState<Filter>("all");
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [ov, setOv] = useState<Record<string, Override>>({});
  const [selected, setSelected] = useState<CreationLike | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [share, setShare] = useState<{ title: string; url: string } | null>(null);
  const [del, setDel] = useState<HistorySample | null>(null);
  const [pubConfirm, setPubConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200); }
  const patch = (id: string, p: Override) => setOv((o) => ({ ...o, [id]: { ...o[id], ...p } }));
  const liked = (r: HistorySample) => ov[r.id]?.liked ?? r.liked;
  const published = (r: HistorySample) => ov[r.id]?.published ?? r.published ?? false;
  const reviewing = (r: HistorySample) => ov[r.id]?.reviewing ?? false;

  /**
   * Seed flow state so the storyboard/MV editors render for THIS sample item.
   * The storyboard's cover/character art is taken from the row thumbnail so each
   * history entry opens its own result rather than a shared generic storyboard.
   */
  function seedFlow(r: HistorySample) {
    const base = mockStoryboard({ description: r.title, title: r.title });
    const sb = r.thumb ? { ...base, coverImage: r.thumb, characterImage: r.thumb } : base;
    setStoryboard(sb);
    saveStoryboard(sb);
    setCompose({
      ...DEFAULT_COMPOSE,
      description: r.title,
      song: r.thumb ? { id: `h-${r.id}`, source: "sample", title: r.title, durationSec: 145, art: r.thumb } : null,
      settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: r.title } },
    });
  }

  const rows: HistorySample[] = useMemo(() => {
    const live: HistorySample[] = history.map((h) => ({
      id: h.id, kind: h.kind, title: h.title,
      thumb: h.status === "failed" ? undefined : h.thumb,
      meta: h.status === "failed" ? (h.kind === "song" ? "AI Song" : "AI MV") : undefined,
      status: h.status === "generating" ? "processing" : h.status === "failed" ? "failed" : "done",
      date: "Just now", plays: 0, likes: 0, shares: 0, liked: false,
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
    if (r.source === "community" && r.communitySongId) { router.push(`/song/play?id=${r.communitySongId}`); return; }
    if (r.kind === "storyboard") { seedFlow(r); router.push(`/mv/storyboard?id=${r.id}`); return; }
    setSelected({ id: r.id, kind: r.kind, title: r.title, thumb: r.thumb ?? "", date: r.date, plays: r.plays, likes: r.likes, shares: r.shares, liked: liked(r) });
  }

  function toggleLike(r: HistorySample) { patch(r.id, { liked: !liked(r) }); }
  function doDownload(r: HistorySample) {
    if (r.kind === "song") downloadFile(SAMPLE_AUDIO, `${r.title}.mp3`);
    else downloadFile(SAMPLE_RESULT_VIDEO, `${r.title}.mp4`);
    setOpenMenu(null); showToast("Download started");
  }
  function editMv(r: HistorySample) { seedFlow(r); router.push(`/mv/edit?id=${r.id}`); }
  function createMv(r: HistorySample) { seedFlow(r); router.push(r.kind === "storyboard" ? `/mv/storyboard?id=${r.id}` : "/mv/room"); }
  function togglePublishSong(r: HistorySample) {
    const next = !published(r);
    patch(r.id, { published: next });
    showToast(next ? "Published success" : "Unpublished success");
  }
  function togglePublishMv(r: HistorySample) {
    if (published(r) || reviewing(r)) { patch(r.id, { published: false, reviewing: false }); showToast("Unpublished success"); return; }
    setPubConfirm(r.id);
  }
  function confirmPublishMv() {
    if (pubConfirm) { patch(pubConfirm, { reviewing: true, published: true }); showToast("Submitted for review"); }
    setPubConfirm(null);
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <h1 className="text-[24px] font-extrabold tracking-tight">My Creations</h1>
      {/* HIST-02: creations are retained permanently (no 14-day auto-delete). */}
      <p className="mb-4 text-[12px]" style={{ color: "var(--text-2)" }}>Your creations are saved here permanently. Download anytime to keep a copy.</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
            style={{ background: filter === f.id ? "var(--accent)" : "var(--card-2)", color: filter === f.id ? "#fff" : "var(--text-2)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}>
          Nothing here yet. Your {filter === "all" ? "creations" : FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} will appear here.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <li key={r.id}>
              <HistoryCard
                r={r}
                liked={liked(r)}
                onOpen={() => openRow(r)}
                cta={
                  // HIST-05: storyboards surface Create as a row pill, not only the ⋯ menu.
                  r.kind === "storyboard" && r.status === "done" ? (
                    <button
                      onClick={() => createMv(r)}
                      className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
                      style={{ background: "var(--accent)" }}
                    >
                      Create MV
                    </button>
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
                      onShare={() => { setOpenMenu(null); setShare({ title: r.title, url: buildShareUrl(r.id) }); }}
                      onDownload={() => doDownload(r)}
                      onDelete={() => { setOpenMenu(null); setDel(r); }}
                      onPublish={() => (r.kind === "mv" ? togglePublishMv(r) : togglePublishSong(r))}
                      onEditMv={() => editMv(r)}
                      onCreateMv={() => createMv(r)}
                      onProof={() => router.push("/proof")}
                    />
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}

      <CreationDialog key={selected?.id ?? "none"} open={selected != null} creation={selected} onClose={() => setSelected(null)} onDelete={(id) => setRemoved((s) => new Set(s).add(id))} />
      <ShareDialog open={share != null} onClose={() => setShare(null)} title={share?.title ?? ""} url={share?.url ?? ""} />

      <Modal open={del != null} onClose={() => setDel(null)} title="Delete" maxWidth={380}>
        <p className="mb-5 text-[14px]" style={{ color: "var(--text-2)" }}>Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDel(null)}>Cancel</Button>
          <Button className="flex-1" onClick={() => { if (del) setRemoved((s) => new Set(s).add(del.id)); setDel(null); }}>Delete</Button>
        </div>
      </Modal>

      <Modal open={pubConfirm != null} onClose={() => setPubConfirm(null)} title="Ready to Go Public?" maxWidth={420}>
        <p className="mb-5 text-[14px]" style={{ color: "var(--text-2)" }}>Once published, your creation is visible to the community and may be shared on our social channels.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setPubConfirm(null)}>Cancel</Button>
          <Button className="flex-1" onClick={confirmPublishMv}>Confirm</Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg" style={{ background: "rgba(20,20,24,.95)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ r, liked, onOpen, menu, cta }: { r: HistorySample; liked: boolean; onOpen: () => void; menu: React.ReactNode; cta?: React.ReactNode }) {
  const clickable = r.status === "done";
  const showStats = r.status === "done" && (r.kind === "mv" || r.kind === "song");
  const kindLabel = r.kind === "storyboard" ? "STORYBOARD" : r.kind.toUpperCase();

  return (
    <div className="hover-lift group overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border-2)" }}>
      {/* Thumbnail */}
      <button onClick={onOpen} disabled={!clickable} className="relative block aspect-video w-full" style={{ cursor: clickable ? "pointer" : "default", background: "var(--card-2)" }}>
        {r.thumb ? (
          <img src={r.thumb} alt="" className="h-full w-full object-cover" />
        ) : r.status === "processing" ? (
          <span className="grid h-full w-full place-items-center text-white" style={{ background: "linear-gradient(135deg,#FFB347,#FF4E50 50%,#D63AF9)" }}><I d={ICON.timer} size={30} /></span>
        ) : (
          <span className="grid h-full w-full place-items-center" style={{ background: "var(--card-3)", color: "var(--text-2)" }}><I d={ICON.alert} size={30} /></span>
        )}

        {/* 20% scrim over thumbnails for badge/label legibility */}
        {r.thumb && <span className="pointer-events-none absolute inset-0" style={{ background: "rgba(0,0,0,0.2)" }} />}

        {/* hover play — only for MV (storyboard has no output yet; song plays via its dialog, not a video) */}
        {clickable && r.thumb && r.kind === "mv" && (
          <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: "rgba(0,0,0,.5)" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20" /></svg></span>
          </span>
        )}

        {/* status badge */}
        <StatusPill r={r} />

        {/* kind badge with type-indicator icon */}
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "rgba(0,0,0,.55)" }}>
          {/* Storyboard has no video yet → no camera icon (frames glyph instead). */}
          {r.kind === "song" ? (
            <I d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" size={11} />
          ) : r.kind === "mv" ? (
            <I d="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" size={11} />
          ) : (
            <I d="M3 6h18v12H3zM9 6v12M15 6v12" size={11} />
          )}
          {kindLabel}
        </span>
      </button>

      {/* Footer */}
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold">{r.title}</div>
          {showStats ? (
            <div className="mt-1 flex items-center gap-3 text-[11px]" style={{ color: "var(--text-2)" }}>
              <span className="inline-flex items-center gap-1"><Headphones /> {formatCount(r.plays)}</span>
              <span className="inline-flex items-center gap-1"><Heart filled={liked} /> {formatCount(r.likes + (liked && !r.liked ? 1 : 0))}</span>
              <span className="inline-flex items-center gap-1"><Share /> {formatCount(r.shares)}</span>
            </div>
          ) : (
            <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-2)" }}>{r.meta}</div>
          )}
          <div className="mt-1 text-[11px]" style={{ color: "var(--text-3)" }}>{r.date}</div>
        </div>
        {cta}
        {menu}
      </div>
    </div>
  );
}

function StatusPill({ r }: { r: HistorySample }) {
  let label: string | null = null;
  let color = "var(--green)";
  if (r.status === "processing") { label = "Generating…"; color = "var(--gold)"; }
  else if (r.status === "failed") { label = "Failed"; color = "#FF4E50"; }
  else if (r.source === "community") { label = null; }
  else { label = "Done"; color = "var(--green)"; }
  if (!label) return null;
  return <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(0,0,0,.6)", color }}>{label}</span>;
}

interface MenuProps {
  r: HistorySample; liked: boolean; published: boolean; reviewing: boolean;
  open: boolean; setOpen: (v: boolean) => void;
  onLike: () => void; onShare: () => void; onDownload: () => void; onDelete: () => void;
  onPublish: () => void; onEditMv: () => void; onCreateMv: () => void; onProof: () => void;
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
    if (p.open) { p.setOpen(false); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    p.setOpen(true);
  }

  return (
    <div className="shrink-0">
      <button ref={btnRef} aria-label="Options" onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:brightness-125" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
        <I d={ICON.more} />
      </button>

      {p.open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => p.setOpen(false)} />
          <div className="fixed z-[91] w-60 overflow-hidden rounded-2xl border p-2 shadow-2xl" style={{ top: pos.top, right: pos.right, background: "var(--card)", borderColor: "var(--border-2)" }}>
            {!community && !failed && (
              <div className="mb-1 flex gap-2 p-1">
                {/* MV-13: a published / in-review MV must be unpublished before editing;
                    the Edit MV entry becomes a neutral "Unpublish to edit MV" that unpublishes. */}
                {isMv && (p.published || p.reviewing ? (
                  <CtaBtn label="Unpublish to edit" icon={ICON.edit} onClick={() => { p.setOpen(false); p.onPublish(); }} />
                ) : (
                  <CtaBtn label="Edit MV" primary icon={ICON.edit} onClick={() => { p.setOpen(false); p.onEditMv(); }} />
                ))}
                {(isSong || isStoryboard) && <CtaBtn label="Create MV" primary icon={ICON.video} onClick={() => { p.setOpen(false); p.onCreateMv(); }} />}
                {(isMv || isSong) && <CtaBtn label="Get Proof" icon={ICON.proof} onClick={() => { p.setOpen(false); p.onProof(); }} />}
              </div>
            )}

            {/* HIST-06: a failed creation is Delete-only — no Like / Share. */}
            {!failed && (community || isMv || isSong) && <OptRow icon={<Heart size={18} filled={p.liked} />} label={p.liked ? "Unlike" : "Like"} active={p.liked} onClick={p.onLike} />}
            {!failed && (community || isMv || isSong) && <OptRow icon={<Share size={18} />} label="Share" onClick={p.onShare} />}

            {!community && !failed && (isMv || isSong) && (
              <>
                <OptRow
                  icon={<I d={isMv && p.reviewing ? ICON.timer : ICON.publish} />}
                  label={isMv && p.reviewing ? "Publish (Review)" : "Publish"}
                  trailing={<Toggle on={p.published || p.reviewing} />}
                  onClick={p.onPublish}
                />
                <OptRow icon={<I d={ICON.download} />} label="Download" onClick={p.onDownload} />
                {!hideDelete && <OptRow icon={<I d={ICON.trash} />} label="Delete" danger onClick={p.onDelete} />}
              </>
            )}

            {(failed || isStoryboard) && <OptRow icon={<I d={ICON.trash} />} label="Delete" danger onClick={p.onDelete} />}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

function CtaBtn({ label, icon, primary, onClick }: { label: string; icon: string; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-all hover:brightness-110 active:scale-[0.97]"
      style={primary ? { background: "var(--accent)", color: "#fff" } : { background: "var(--card-2)", color: "var(--text)" }}>
      <I d={icon} size={15} /> {label}
    </button>
  );
}

function OptRow({ icon, label, trailing, onClick, active, danger }: { icon: React.ReactNode; label: string; trailing?: React.ReactNode; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-[var(--card-2)]"
      style={{ color: danger ? "#FF4E50" : active ? "var(--accent)" : "var(--text)" }}>
      <span className="grid w-5 place-items-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  );
}
