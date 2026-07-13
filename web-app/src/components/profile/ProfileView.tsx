"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCredits } from "@/components/providers/CreditsProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { CreditsDetailModal } from "@/components/credits/CreditsDetailModal";
import { SAMPLE_CREATIONS } from "@/lib/mv/mock";
import { MOCK_USER } from "@/lib/user";

function I({ d }: { d: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onToggle} className="relative h-6 w-10 rounded-full transition-colors" style={{ background: on ? "var(--accent)" : "var(--card-3)" }}>
      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} />
    </button>
  );
}
function Row({ icon, title, sub, right, onClick }: { icon: React.ReactNode; title: string; sub?: string; right?: React.ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold">{title}</div>
        {sub && <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{sub}</div>}
      </div>
      {right}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-1 py-3 text-left";
  // Non-clickable rows (e.g. a row whose action is its trailing switch) render
  // as a div — a wrapping button would nest interactive elements.
  return onClick ? (
    <button onClick={onClick} className={cls}>{body}</button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function ProfileView() {
  const router = useRouter();
  const { credits } = useCredits();
  const [name, setName] = useState(MOCK_USER.name);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [notif, setNotif] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsDetailOpen, setCreditsDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1800); };

  const mvCount = SAMPLE_CREATIONS.filter((c) => c.kind === "mv").length;
  const songCount = SAMPLE_CREATIONS.filter((c) => c.kind === "song").length;

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--mv-grad)", fontWeight: 700, fontSize: 22 }}>{name.charAt(0)}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[20px] font-bold">{name}</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{email}</div>
        </div>
        <button aria-label="Edit profile" onClick={() => setEditOpen(true)} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
          <I d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </button>
      </div>

      <div className="mt-5 flex items-center rounded-2xl border" style={{ borderColor: "var(--border-2)" }}>
        <button onClick={() => setCreditsDetailOpen(true)} className="flex flex-1 flex-col items-center py-4">
          <span className="inline-flex items-center gap-1 text-[20px] font-bold" style={{ color: "var(--gold)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" opacity="0.25" /><circle cx="12" cy="12" r="6" /></svg>{credits}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Credits</span>
        </button>
        <div className="h-8 w-px" style={{ background: "var(--border-2)" }} />
        <Link href="/creator?self=1&tab=mv" className="flex flex-1 flex-col items-center py-4"><span className="text-[20px] font-bold">{mvCount}</span><span className="text-[11px]" style={{ color: "var(--text-2)" }}>MVs</span></Link>
        <div className="h-8 w-px" style={{ background: "var(--border-2)" }} />
        <Link href="/creator?self=1&tab=songs" className="flex flex-1 flex-col items-center py-4"><span className="text-[20px] font-bold">{songCount}</span><span className="text-[11px]" style={{ color: "var(--text-2)" }}>Songs</span></Link>
      </div>

      <div className="mt-4 divide-y" style={{ borderColor: "var(--border-3)" }}>
        <Row icon={<I d="M12 3l2.5 6 6 .5-4.5 4 1.5 6L12 16l-5.5 3.5 1.5-6L3.5 9.5l6-.5z" />} title="Muse Pro" sub="Validity: 2026-08-10"
          right={<span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold" style={{ color: "#09090B" }}>Upgrade</span>} onClick={() => setCreditsOpen(true)} />
        <Row icon={<I d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />} title="Notifications" sub={notif ? "On" : "Off"} right={<Toggle label="Notifications" on={notif} onToggle={() => setNotif((v) => !v)} />} />
        <Row icon={<I d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />} title="Send Feedback" onClick={() => setFbOpen(true)} />
        <Row icon={<I d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />} title="Settings" onClick={() => router.push("/settings")} />
        <div className="pt-1"><Row icon={<I d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />} title="Sign Out" onClick={() => { flash("Signed out (demo)"); setTimeout(() => router.push("/"), 600); }} /></div>
      </div>

      <BuyCreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} onPurchased={(n) => flash(`Added ${n} credits`)} />
      <CreditsDetailModal open={creditsDetailOpen} onClose={() => setCreditsDetailOpen(false)} onBuy={() => { setCreditsDetailOpen(false); setCreditsOpen(true); }} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" maxWidth={400}>
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mb-3 w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "var(--card-2)", color: "var(--text)" }} />
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4 w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "var(--card-2)", color: "var(--text)" }} />
        <Button className="w-full" onClick={() => { setEditOpen(false); flash("Profile updated"); }}>Save</Button>
      </Modal>

      <Modal open={fbOpen} onClose={() => setFbOpen(false)} title="Send Feedback" maxWidth={420}>
        <textarea placeholder="Tell us what you think…" className="mb-4 min-h-[100px] w-full resize-none rounded-lg p-3 text-[14px] outline-none" style={{ background: "var(--card-2)", color: "var(--text)" }} />
        <Button className="w-full" onClick={() => { setFbOpen(false); flash("Thanks for your feedback!"); }}>Send</Button>
      </Modal>

      {toast && <div className="anim-toast fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: "var(--card-3)", color: "var(--text)" }}>{toast}</div>}
    </div>
  );
}
