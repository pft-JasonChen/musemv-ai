"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { LOCALE_NAMES, LOCALES, localePath } from "@/lib/i18n/config";
import { DpIcon } from "@/components/ui/DpIcon";
import { RoomNavbar } from "@/components/shell/RoomNavbar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SAMPLE_CREATIONS } from "@/lib/mv/mock";
import { AVATAR_SAMPLES, SUBSCRIPTION_PLANS } from "@/lib/user";

/**
 * Slice 3c — migrated to DP's `AccountPage` (Figma 1700:33262).
 *
 * Structure and classes come from `src/styles/designer/AccountPage.css`; every
 * behaviour below is WA's and predates the migration. Two things DP does NOT
 * have, kept deliberately (they are real product behaviour, not decoration):
 * the notification toggle is a real switch over local state, and Language opens
 * WA's 9-locale picker rather than being a static "English" subtitle.
 *
 * R-8: this screen is one of only two real `useT()` consumers. Every visible
 * string stays on `t()` — DP hardcodes English, and copying that across is the
 * one change here that would look perfect in English and be broken in the
 * other 8 locales.
 */

/** DP's account row. `href` renders a link, `onClick` a button, neither a div. */
function AccountRow({
  icon,
  title,
  subtitle,
  href,
  onClick,
  iconColor,
  right,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  iconColor?: string;
  right?: React.ReactNode;
}) {
  const body = (
    <>
      {/* The icon is a mask tinted by `currentColor`, so an accent colour is set
          on the box rather than on the icon itself. */}
      <span
        className="account-page__row-icon-box"
        {...(iconColor ? { style: { color: iconColor } } : {})}
      >
        <DpIcon name={icon} className="account-page__row-icon" />
      </span>
      <span className="account-page__row-copy">
        <span className="account-page__row-title">{title}</span>
        {subtitle && <span className="account-page__row-subtitle">{subtitle}</span>}
      </span>
      {right ?? <DpIcon name="ic_chevron-right" className="account-page__row-chevron" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="account-page__row">
        {body}
      </Link>
    );
  }
  // A row whose action lives in a trailing control renders as a div — wrapping a
  // switch in a button would nest interactive elements.
  return onClick ? (
    <button type="button" onClick={onClick} className="account-page__row">
      {body}
    </button>
  ) : (
    <div className="account-page__row">{body}</div>
  );
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="relative h-6 w-10 shrink-0 rounded-full transition-colors"
      style={{ background: on ? "var(--color-accent-purple)" : "var(--neutral-dark-14)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? 18 : 2 }}
      />
    </button>
  );
}

export function ProfileView() {
  const router = useRouter();
  const { credits } = useCredits();
  const { profile, subscribed, subscribedPlan, updateProfile } = useAuth();
  // Shared with RoomNavbar's header pill and Sidebar's Upgrade button
  // (2026-08-11 designer fix) — one dialog instance, opened from anywhere,
  // instead of this page owning its own private copy.
  const { openSubscribe } = useSubscribe();
  const planName = SUBSCRIPTION_PLANS.find((p) => p.id === subscribedPlan)?.name;
  const { locale, setLocale } = useLocale();
  const t = useT();
  // Edit-profile draft state (committed to the provider on Save).
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(profile.avatar);
  const [notif, setNotif] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  };

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
    <>
      {/* Rendered here, not in AppShell — App Router has no per-route slot, so a
          migrated screen owns its chrome and `OWN_CHROME` keeps TopBar away. */}
      <RoomNavbar title={t("nav.account")} />
      <section className="account-page">
        <div className="account-page__content">
          <div className="account-page__profile">
            <div className="account-page__identity">
              <span className="account-page__avatar">
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <DpIcon name="ic_user" />
                )}
              </span>
              <span className="account-page__identity-copy">
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
              </span>
              {subscribed && <span className="badge badge--purple">{t("profile.musePro")}</span>}
              <button
                type="button"
                onClick={openEdit}
                aria-label={t("profile.editProfile")}
                // G7 finding 2: DP specifies size="XSmall" here, which computes to
                // 20x20 — under WCAG 2.5.8 AA's 24x24 floor, and a regression from
                // WA's pre-migration 32x32. `--small` is 28x28 and matches the back
                // control on /settings. DP's spec is logged as DESIGNER-TODO A10.
                className="icon-button icon-button--small icon-button--tertiary"
              >
                <DpIcon name="ic_edit" className="icon-button__icon" />
              </button>
            </div>

            <div className="account-page__stats">
              {/* Credits opens the balance breakdown — a real route since
                  2026-08-11 (designer request), matching DP's /account/credits. */}
              <button
                type="button"
                onClick={() => router.push(localePath(locale, "/profile/credits"))}
              >
                <strong>
                  {credits}
                  {/* DP renders this one as a real <img>, not a currentColor mask —
                      the coin is multi-colour, so masking it would drop the gold. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/icons/ui/ic_credit.svg" alt="" />
                </strong>
                <span>{t("profile.credits")}</span>
              </button>
              <i />
              <Link href={localePath(locale, "/creator?self=1&tab=mv")}>
                <strong>{mvCount}</strong>
                <span>{t("profile.mvs")}</span>
              </Link>
              <i />
              <Link href={localePath(locale, "/creator?self=1&tab=songs")}>
                <strong>{songCount}</strong>
                <span>{t("profile.songs")}</span>
              </Link>
            </div>
          </div>

          <div className="account-page__rows">
            <AccountRow
              icon="ic_crown"
              // DP hardcodes the crown gold inline here and has no token for it;
              // WA's `--premium` alias is that exact value, and WA-specific
              // semantic names are what token-aliases.css is for.
              iconColor="var(--premium)"
              title={t("profile.musePro")}
              subtitle={
                subscribed
                  ? `${planName ?? t("profile.musePro")} · ${t("profile.validity")}: 2026-08-10`
                  : t("profile.proSubtitle")
              }
              // G7 finding 1: DP's row ends in a bare chevron, which makes the only
              // purchase entry point on this screen look identical to Notifications
              // and Language. WA had an explicit Subscribe/Manage pill before the
              // migration; the click target survived the port but the affordance
              // did not, and nothing would have gone red. Kept, same as the
              // /settings back control — a working affordance is not decoration.
              right={
                // `badge--purple` / `badge--processing` are real modifiers in
                // Badge.css. An invented one (badge--brand) would not error — it
                // would just render an unstyled pill, which is A2's failure mode.
                <span className={`badge ${subscribed ? "badge--processing" : "badge--purple"}`}>
                  {subscribed ? t("profile.manage") : t("profile.subscribe")}
                </span>
              }
              onClick={() =>
                subscribed
                  ? router.push(localePath(locale, "/profile/credits"))
                  : openSubscribe(() => flash(t("profile.toast.subscribed")))
              }
            />
            <div className="account-page__divider" />
            <AccountRow
              icon="ic_notification"
              title={t("profile.notifications")}
              subtitle={notif ? t("profile.on") : t("profile.off")}
              right={
                <Toggle
                  label={t("profile.notifications")}
                  on={notif}
                  onToggle={() => setNotif((v) => !v)}
                />
              }
            />
            <AccountRow
              icon="ic_language"
              title={t("profile.language")}
              subtitle={LOCALE_NAMES[locale].native}
              onClick={() => setLangOpen(true)}
            />
            <AccountRow
              icon="ic_history_OL"
              title={t("nav.history")}
              href={localePath(locale, "/history")}
            />
            <AccountRow
              icon="ic_send"
              title={t("profile.sendFeedback")}
              onClick={() => setFbOpen(true)}
            />
            <AccountRow
              icon="ic_settings"
              title={t("profile.settings")}
              onClick={() => router.push(localePath(locale, "/settings"))}
            />
            {/* PROF-03: Sign Out lives in Settings, not on the profile screen. */}
          </div>
        </div>
      </section>

      <Modal
        open={langOpen}
        onClose={() => setLangOpen(false)}
        title={t("language.title")}
        maxWidth={380}
      >
        <p className="mb-3 text-[12px]" style={{ color: "var(--neutral-dark-64)" }}>
          {t("language.subtitle")}
        </p>
        <div className="flex flex-col gap-1">
          {LOCALES.map((code) => {
            const active = code === locale;
            return (
              <button
                key={code}
                onClick={() => {
                  setLocale(code);
                  setLangOpen(false);
                }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors"
                style={{ background: active ? "var(--neutral-dark-14)" : "transparent" }}
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">
                    {LOCALE_NAMES[code].native}
                  </span>
                  <span className="block text-[11px]" style={{ color: "var(--neutral-dark-64)" }}>
                    {LOCALE_NAMES[code].english}
                  </span>
                </span>
                {active && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="var(--color-accent-purple)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("profile.editProfile")}
        maxWidth={400}
      >
        {/* Avatar + Change Photo (cycles sample photos — mock upload) */}
        <div className="mb-5 flex flex-col items-center gap-2">
          <button
            onClick={cycleAvatar}
            className="account-page__avatar relative"
            aria-label={t("profile.changePhoto")}
          >
            {avatarDraft ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarDraft} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[26px] font-bold text-white">
                {nameDraft.charAt(0) || profile.name.charAt(0)}
              </span>
            )}
            <span className="account-edit__camera">
              <DpIcon name="ic_camera" />
            </span>
          </button>
          <button onClick={cycleAvatar} className="account-edit__change-photo" type="button">
            {t("profile.changePhoto")}
          </button>
        </div>
        <label className="account-edit__field">
          {t("profile.name")}
          <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={30} />
        </label>
        <label className="account-edit__field mt-3">
          {t("profile.email")}
          <input value={profile.email} readOnly />
        </label>
        <Button className="mt-4 w-full" onClick={saveProfile}>
          {t("profile.save")}
        </Button>
      </Modal>

      <Modal
        open={fbOpen}
        onClose={() => setFbOpen(false)}
        title={t("profile.sendFeedback")}
        maxWidth={420}
      >
        <textarea
          placeholder={t("profile.feedbackPlaceholder")}
          className="mb-4 min-h-[100px] w-full resize-none rounded-lg p-3 text-[14px] outline-none"
          style={{ background: "var(--neutral-dark-14)", color: "var(--neutral-dark-100)" }}
        />
        <Button
          className="w-full"
          onClick={() => {
            setFbOpen(false);
            flash(t("profile.toast.feedback"));
          }}
        >
          {t("common.send")}
        </Button>
      </Modal>

      {toast && (
        <div
          className="anim-toast fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{ background: "var(--neutral-dark-14)", color: "var(--neutral-dark-100)" }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
