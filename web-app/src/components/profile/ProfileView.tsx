"use client";

import { useRef, useState } from "react";
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
import { FeedbackDialog } from "./FeedbackDialog";
import { FacePickerModal } from "@/components/mv/FacePickerModal";
import { SAMPLE_CREATIONS } from "@/lib/mv/mock";
import { SUBSCRIPTION_PLANS, planDisplayName } from "@/lib/user";

/**
 * Slice 3c — migrated to DP's `AccountPage` (Figma 1700:33262).
 *
 * Structure and classes come from `src/styles/designer/AccountPage.css`; every
 * behaviour below is WA's and predates the migration. Two things DP does NOT
 * have, kept deliberately (they are real product behaviour, not decoration):
 * Language opens WA's 9-locale picker rather than being a static "English"
 * subtitle, and Send Feedback opens a real support-ticket form (`FeedbackDialog`,
 * spec areas/06 §3.1) rather than a dead row.
 * (The notification toggle this comment used to cite is gone — the row was
 * removed 2026-08-14 because the web has no push flow behind it.)
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

export function ProfileView() {
  const router = useRouter();
  const { credits } = useCredits();
  const { profile, subscribed, subscribedPlan, updateProfile } = useAuth();
  // Shared with RoomNavbar's header pill and Sidebar's Upgrade button
  // (2026-08-11 designer fix) — one dialog instance, opened from anywhere,
  // instead of this page owning its own private copy.
  const { openSubscribe } = useSubscribe();
  const subscribedPlanRow = SUBSCRIPTION_PLANS.find((p) => p.id === subscribedPlan);
  const planName = subscribedPlanRow && planDisplayName(subscribedPlanRow);
  const { locale, setLocale } = useLocale();
  const t = useT();
  // Edit-profile draft state (committed to the provider on Save).
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(profile.avatar);
  const [editOpen, setEditOpen] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  // Avatar upload → crop. `pendingAvatar` is the raw object URL waiting to be
  // cropped; `avatarDraft` is the cropped result, committed by Save.
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
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
  /**
   * Change Photo — a REAL upload + crop since 2026-09-01 (product owner).
   *
   * It used to cycle `AVATAR_SAMPLES`, a mock that could not produce any image
   * the user actually owned. The replacement deliberately reuses `/mv/room`'s
   * `FacePickerModal` (`variant="avatar"`) rather than growing a second crop
   * implementation — same drag/scale/canvas pipeline, circular frame, avatar
   * copy. `DESIGNER-TODO` B's "Profile avatar upload is completely blank" is
   * closed by this.
   *
   * The cropped result is a data URL held in `avatarDraft` and committed by
   * Save, exactly like `nameDraft` — so Cancel still discards it and there is
   * no new commit path to reason about. 🔒 Nothing is uploaded anywhere; a real
   * backend has to replace the data URL with an upload + stored URL.
   */
  function pickAvatarFile() {
    avatarFileRef.current?.click();
  }
  function onAvatarFile(file: File | undefined) {
    if (!file) return;
    // Same accept/size shape as `MvRoom`'s character-photo upload, so the two
    // entry points into this dialog cannot disagree about what they take.
    if (!file.type.startsWith("image/")) {
      flash("Unsupported format. Please choose an image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      flash("File too large. Maximum size is 10MB.");
      return;
    }
    setPendingAvatar(URL.createObjectURL(file));
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
          migrated screen owns its chrome and the shell draws none of its own. */}
      <RoomNavbar title={t("nav.account")} mobileBackHref="/" />
      <section className="account-page">
        <div className="account-page__content">
          <div className="account-page__profile">
            <div className="account-page__identity">
              {/* Product owner, 2026-08-31: the photo/name/email all open the
                  same public creator profile the MVs/Songs stat pills below
                  already link to — same destination, default (MV) tab, so
                  omitting `tab=` here rather than repeating `tab=mv`. Grouped
                  under one `Link` rather than three (image, name, email
                  separately) since they're one identity, not three
                  destinations — Edit stays its own control, outside the link,
                  since it does something else entirely. */}
              <Link
                href={localePath(locale, "/creator?self=1")}
                className="account-page__identity-link"
              >
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
              </Link>
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
              // Product owner request, 2026-08-14 — supersedes G7 finding 1's
              // Subscribe/Manage pill (kept 2026-08-05 so the row's only purchase
              // entry point wasn't a bare chevron indistinguishable from
              // Notifications/Language). For a subscribed user "Manage" is gone
              // entirely — the row itself is still the click target below, so
              // nothing is lost, only the redundant label — and the pill is now
              // reserved for the one case that sells something: not-yet-subscribed
              // users get a solid button-styled "Upgrade" pill (`.button--secondary`,
              // same white-pill/dark-text look as Sidebar's own Upgrade button) in
              // place of the old subtle `badge--purple` treatment. A `<span>`, not a
              // `<button>`, because the whole row is already a `<button>` below —
              // nesting would be invalid HTML; `.button--secondary` is class-based
              // (not an element selector) so it renders identically either way.
              right={
                subscribed ? undefined : (
                  <span className="button button--small button--secondary">
                    <span className="button__label">{t("profile.upgrade")}</span>
                  </span>
                )
              }
              onClick={() =>
                subscribed
                  ? router.push(localePath(locale, "/profile/credits"))
                  : openSubscribe(() => flash(t("profile.toast.subscribed")))
              }
            />
            <div className="account-page__divider" />
            {/* Product owner request, 2026-08-14 — removed: notifications aren't a
                feature this webpage can deliver (no browser push/permission flow
                behind it, just local demo state that toggled a subtitle). */}
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
            onClick={pickAvatarFile}
            className="account-page__avatar relative"
            aria-label={t("profile.changePhoto")}
          >
            {avatarDraft ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarDraft} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              // Matches the identity row's own fallback one section up (both read
              // from the same `.account-page__avatar > span:first-child` 31×31 mask
              // rule) instead of the initial-letter span this used before — that
              // was a third, inconsistent fallback style with its own inline sizing.
              <DpIcon name="ic_user" />
            )}
            <span className="account-edit__camera">
              <DpIcon name="ic_camera" />
            </span>
          </button>
          <button onClick={pickAvatarFile} className="account-edit__change-photo" type="button">
            {t("profile.changePhoto")}
          </button>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onAvatarFile(e.target.files?.[0]);
              // Reset so re-picking the SAME file fires `change` again.
              e.target.value = "";
            }}
          />
        </div>
        <label className="account-edit__field">
          {t("profile.name")}
          <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={30} />
        </label>
        <label className="account-edit__field mt-3">
          {t("profile.email")}
          <input value={profile.email} readOnly />
        </label>
        {/* `.account-edit__actions`/`.button` come from AccountPage.css — a 50/50
            grid + gray/white pill pair that already existed for exactly this
            Cancel/Save shape (account-confirm's delete dialog) but had zero .tsx
            consumers until now. Cancel just closes; openEdit() re-seeds the drafts
            from the live profile next time the dialog opens, so there's nothing to
            roll back here. */}
        <div className="account-edit__actions mt-4">
          <button
            type="button"
            className="button button--medium button--tertiary"
            onClick={() => setEditOpen(false)}
          >
            <span className="button__label">{t("profile.cancel")}</span>
          </button>
          <button
            type="button"
            className="button button--medium button--secondary"
            onClick={saveProfile}
          >
            <span className="button__label">{t("profile.save")}</span>
          </button>
        </div>
      </Modal>

      {/* Conditionally mounted, unlike the two Modals above: unmounting IS the
          form reset, so re-opening never shows a stale draft (PROF-P5-S6).
          There is no toast on success — the dialog's own "Feedback Sent" step
          replaces it (spec §3.1 / AC-PROF-13). */}
      {fbOpen && <FeedbackDialog onClose={() => setFbOpen(false)} />}

      {/* Edit Profile Picture — `/mv/room`'s crop dialog in its avatar variant.
          Mounted here (not inside the edit Modal) so it layers ABOVE it. */}
      <FacePickerModal
        open={pendingAvatar != null}
        imageUrl={pendingAvatar ?? ""}
        variant="avatar"
        onClose={() => {
          if (pendingAvatar) URL.revokeObjectURL(pendingAvatar);
          setPendingAvatar(null);
        }}
        onConfirm={(dataUrl) => {
          setAvatarDraft(dataUrl);
          if (pendingAvatar) URL.revokeObjectURL(pendingAvatar);
          setPendingAvatar(null);
        }}
      />

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
