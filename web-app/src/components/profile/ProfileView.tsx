"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { LOCALE_NAMES, LOCALES, localePath } from "@/lib/i18n/config";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { CreditsDetailModal } from "@/components/credits/CreditsDetailModal";
import { SubscribeModal } from "@/components/credits/SubscribeModal";
import { SAMPLE_CREATIONS } from "@/lib/mv/mock";
import { AVATAR_SAMPLES, SUBSCRIPTION_PLANS } from "@/lib/user";

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
  const { profile, subscribed, subscribedPlan, updateProfile } = useAuth();
  const planName = SUBSCRIPTION_PLANS.find((p) => p.id === subscribedPlan)?.name;
  const { locale, setLocale } = useLocale();
  const t = useT();
  // Edit-profile draft state (committed to the provider on Save).
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(profile.avatar);
  const [notif, setNotif] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsDetailOpen, setCreditsDetailOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1800); };

  // Reset the draft to the live profile each time the edit dialog opens.
  function openEdit() {
    setNameDraft(profile.name);
    setAvatarDraft(profile.avatar);
    setEditOpen(true);
  }
  function cycleAvatar() {
    const i = avatarDraft ? AVATAR_SAMPLES.indexOf(avatarDraft) : -1;
    setAvatarDraft(AVATAR_SAMPLES[(i + 1) % AVATAR_SAMPLES.length]);
  }
  function saveProfile() {
    updateProfile({ name: nameDraft.trim() || profile.name, avatar: avatarDraft });
    setEditOpen(false);
    flash(t("profile.toast.updated"));
  }

  const mvCount = SAMPLE_CREATIONS.filter((c) => c.kind === "mv").length;
  const songCount = SAMPLE_CREATIONS.filter((c) => c.kind === "song").length;

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full text-white" style={{ background: "var(--mv-grad)", fontWeight: 700, fontSize: 22 }}>
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.name.charAt(0)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[20px] font-bold">{profile.name}</div>
            {subscribed && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--mv-grad)" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>
                {t("profile.musePro")}
              </span>
            )}
          </div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{profile.email}</div>
        </div>
        <button aria-label={t("profile.editProfile")} onClick={openEdit} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
          <I d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </button>
      </div>

      <div className="mt-5 flex items-center rounded-2xl border" style={{ borderColor: "var(--border-2)" }}>
        <button onClick={() => setCreditsDetailOpen(true)} className="flex flex-1 flex-col items-center py-4">
          <span className="inline-flex items-center gap-1 text-[20px] font-bold" style={{ color: "var(--gold)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" opacity="0.25" /><circle cx="12" cy="12" r="6" /></svg>{credits}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-2)" }}>{t("profile.credits")}</span>
        </button>
        <div className="h-8 w-px" style={{ background: "var(--border-2)" }} />
        <Link href={localePath(locale, "/creator?self=1&tab=mv")} className="flex flex-1 flex-col items-center py-4"><span className="text-[20px] font-bold">{mvCount}</span><span className="text-[11px]" style={{ color: "var(--text-2)" }}>{t("profile.mvs")}</span></Link>
        <div className="h-8 w-px" style={{ background: "var(--border-2)" }} />
        <Link href={localePath(locale, "/creator?self=1&tab=songs")} className="flex flex-1 flex-col items-center py-4"><span className="text-[20px] font-bold">{songCount}</span><span className="text-[11px]" style={{ color: "var(--text-2)" }}>{t("profile.songs")}</span></Link>
      </div>

      <div className="mt-4 divide-y" style={{ borderColor: "var(--border-3)" }}>
        <Row
          icon={<I d="M12 3l2.5 6 6 .5-4.5 4 1.5 6L12 16l-5.5 3.5 1.5-6L3.5 9.5l6-.5z" />}
          title={t("profile.musePro")}
          sub={subscribed ? `${planName ?? t("profile.musePro")} · ${t("profile.validity")}: 2026-08-10` : t("profile.proSubtitle")}
          right={
            subscribed
              ? <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)", border: "1px solid var(--border-2)" }}>{t("profile.manage")}</span>
              : <span className="rounded-full px-3 py-1 text-[12px] font-bold text-white" style={{ background: "var(--accent)" }}>{t("profile.subscribe")}</span>
          }
          onClick={() => (subscribed ? setCreditsDetailOpen(true) : setSubOpen(true))}
        />
        <Row icon={<I d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />} title={t("profile.notifications")} sub={notif ? t("profile.on") : t("profile.off")} right={<Toggle label={t("profile.notifications")} on={notif} onToggle={() => setNotif((v) => !v)} />} />
        <Row icon={<I d="M2 12h5l2-3 3 6 2-3h6" />} title={t("profile.language")} sub={LOCALE_NAMES[locale].native} onClick={() => setLangOpen(true)} />
        <Row icon={<I d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />} title={t("profile.sendFeedback")} onClick={() => setFbOpen(true)} />
        {/* PROF-03: Sign Out lives in Settings now, not on the profile screen. */}
        <Row icon={<I d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />} title={t("profile.settings")} onClick={() => router.push(localePath(locale, "/settings"))} />
      </div>

      <BuyCreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} onPurchased={(n) => flash(`Added ${n} credits`)} />
      <CreditsDetailModal open={creditsDetailOpen} onClose={() => setCreditsDetailOpen(false)} onBuy={() => { setCreditsDetailOpen(false); setCreditsOpen(true); }} />

      <Modal open={langOpen} onClose={() => setLangOpen(false)} title={t("language.title")} maxWidth={380}>
        <p className="mb-3 text-[12px]" style={{ color: "var(--text-2)" }}>{t("language.subtitle")}</p>
        <div className="flex flex-col gap-1">
          {LOCALES.map((code) => {
            const active = code === locale;
            return (
              <button
                key={code}
                onClick={() => { setLocale(code); setLangOpen(false); }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors"
                style={{ background: active ? "var(--card-2)" : "transparent" }}
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{LOCALE_NAMES[code].native}</span>
                  <span className="block text-[11px]" style={{ color: "var(--text-2)" }}>{LOCALE_NAMES[code].english}</span>
                </span>
                {active && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 13l4 4L19 7" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t("profile.editProfile")} maxWidth={400}>
        {/* Avatar + Change Photo (cycles sample photos — mock upload) */}
        <div className="mb-5 flex flex-col items-center gap-2">
          <button onClick={cycleAvatar} className="relative h-16 w-16 overflow-hidden rounded-full" aria-label={t("profile.changePhoto")} style={{ background: "var(--mv-grad)" }}>
            {avatarDraft ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarDraft} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[26px] font-bold text-white">{nameDraft.charAt(0) || profile.name.charAt(0)}</span>
            )}
            <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full border-2 text-white" style={{ background: "var(--accent)", borderColor: "var(--card)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="3.5" /></svg>
            </span>
          </button>
          <button onClick={cycleAvatar} className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>{t("profile.changePhoto")}</button>
        </div>
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>{t("profile.name")}</label>
        <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={30} className="mb-3 w-full rounded-lg px-3 py-2 text-[14px] outline-none" style={{ background: "var(--card-2)", color: "var(--text)" }} />
        <label className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>{t("profile.email")}</label>
        <div className="mb-4 w-full rounded-lg px-3 py-2 text-[14px]" style={{ background: "var(--card-3)", color: "var(--text-2)" }}>{profile.email}</div>
        <Button className="w-full" onClick={saveProfile}>{t("profile.save")}</Button>
      </Modal>

      <SubscribeModal open={subOpen} onClose={() => setSubOpen(false)} onSubscribed={() => flash(t("profile.toast.subscribed"))} />

      <Modal open={fbOpen} onClose={() => setFbOpen(false)} title={t("profile.sendFeedback")} maxWidth={420}>
        <textarea placeholder={t("profile.feedbackPlaceholder")} className="mb-4 min-h-[100px] w-full resize-none rounded-lg p-3 text-[14px] outline-none" style={{ background: "var(--card-2)", color: "var(--text)" }} />
        <Button className="w-full" onClick={() => { setFbOpen(false); flash(t("profile.toast.feedback")); }}>{t("common.send")}</Button>
      </Modal>

      {toast && <div className="anim-toast fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: "var(--card-3)", color: "var(--text)" }}>{toast}</div>}
    </div>
  );
}
