"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { TERMS_URL, PRIVACY_URL } from "@/lib/legal";

type Dialog = null | "unsubscribe" | "delete";

function Row({ icon, title, sub, danger, onClick }: { icon: string; title: string; sub?: string; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-1 py-3.5 text-left">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "var(--card-2)", border: "1px solid var(--border-2)" }}>
        <img src={icon} width={20} height={20} alt="" style={danger ? undefined : { opacity: 0.85 }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold" style={danger ? { color: "var(--red)" } : undefined}>{title}</div>
        {sub && <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{sub}</div>}
      </div>
      <span style={{ color: "var(--text-3)" }}>›</span>
    </button>
  );
}

export function SettingsView() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { locale } = useLocale();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1800); };
  const close = () => setDialog(null);
  // PROF-06 / AUTH-03: open the real legal pages in a new tab.
  const openLegal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <button aria-label="Back" onClick={() => router.back()} className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="text-[22px] font-extrabold">Settings</h1>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border-3)" }}>
        {/* PROF-06 / AUTH-03: Terms & Privacy open the real legal pages. */}
        <Row icon="/assets/icons/ui/ic_file_text.svg" title="Terms of Use" onClick={() => openLegal(TERMS_URL)} />
        <Row icon="/assets/icons/ui/ic_shield_check.svg" title="Privacy Policy" onClick={() => openLegal(PRIVACY_URL)} />
        <Row icon="/assets/icons/ui/ic_calendar_x.svg" title="Unsubscribe" sub="Cancel your Muse Pro subscription" onClick={() => setDialog("unsubscribe")} />
        <Row icon="/assets/icons/ui/ic_user_x.svg" title="Delete Account" sub="Permanently remove your account" danger onClick={() => setDialog("delete")} />
        {/* PROF-03: Sign Out moved here from the profile screen. */}
        <Row icon="/assets/icons/ui/ic_user_x.svg" title="Sign Out" onClick={() => { signOut(); router.push(localePath(locale, "/")); }} />
      </div>

      {/* Unsubscribe confirm */}
      <Modal open={dialog === "unsubscribe"} onClose={close} title="Unsubscribe?" maxWidth={400}>
        <p className="mb-4 text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
          You&apos;ll keep Muse Pro benefits until the end of your current billing period, then revert to the free plan.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={close}>Keep Pro</Button>
          <Button className="flex-1" onClick={() => { close(); flash("Unsubscribed (demo)"); }}>Unsubscribe</Button>
        </div>
      </Modal>

      {/* Delete Account — destructive confirm */}
      <Modal open={dialog === "delete"} onClose={close} title="Delete Account?" maxWidth={400}>
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "rgba(239,68,68,.15)" }}>
            <img src="/assets/icons/ui/ic_shield_alert.svg" width={20} height={20} alt="" />
          </span>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            This permanently deletes your account and all of your creations. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
          <button
            onClick={() => { close(); flash("Account deleted (demo)"); setTimeout(() => router.push("/"), 700); }}
            className="flex-1 rounded-xl py-2.5 text-[14px] font-bold text-white transition-all hover:brightness-110"
            style={{ background: "var(--red)" }}
          >
            Delete
          </button>
        </div>
      </Modal>

      {toast && <div className="anim-toast fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: "var(--card-3)", color: "var(--text)" }}>{toast}</div>}
    </div>
  );
}
