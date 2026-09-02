"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DpIcon } from "@/components/ui/DpIcon";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { TERMS_URL, PRIVACY_URL } from "@/lib/legal";
import { useDemoState } from "@/components/demo/useDemo";

/**
 * Slice 3c — migrated to DP's `AccountPage` settings branch (Figma 1700:35001).
 *
 * R-8: `/settings` is NOT one of the two `useT()` consumers and does not become
 * one here. Its copy stays hardcoded English, matching the existing boundary —
 * widening `useT()` is a separate decision, not a side effect of a UI port.
 *
 * ── The phone back control now comes from DetailNavbar ─────────────────────
 * This screen was the second confirmed victim of A5: DP puts Back in
 * `DetailNavbar`, which `AppLayout.css` hides below 767px, and WA's
 * pre-migration `/settings` had a working Back at every width — so porting DP
 * verbatim would have deleted a working control on phones (A4's regression).
 * It was first fixed with a bespoke in-page control here; once the sweep found
 * FIVE affected screens, the fix moved into `DetailNavbar` itself so there is
 * one definition and one place to delete when a drop ships a mobile back
 * affordance. The 2026-08-06 drop shipped exactly that, so that one place has
 * now been deleted and this screen rides DP's own compact mobile bar. Nothing
 * screen-specific is needed here.
 *
 * ── UNSUBSCRIBE SPLITS ON WHERE THE SUBSCRIPTION WAS BOUGHT ─────────────────
 *
 * Product owner, 2026-08-27 (`TBD-PROF-04`, extended): a subscription bought
 * through the App Store or Google Play can't be cancelled from the website —
 * the store owns the billing relationship, not Muse. Clicking Unsubscribe now
 * checks the account's purchase platform first; a phone subscriber gets a
 * "manage it on your phone" dialog instead of the existing web cancel-confirm.
 * No real field exists for this yet (`subscriptionPlatform` is a C2 addition
 * RD hasn't shipped), so it's simulated the same way as every other unbuilt
 * backend fact here: the `?demo=1` panel's `subOnApp` flag + its iOS/Android
 * picker (`demoStore.ts`'s `subPlatform`) stand in for the real value. No
 * Figma was supplied for this dialog — the copy below is this session's own,
 * not ported from a design.
 */

type Dialog = null | "unsubscribe" | "unsubscribe-on-app" | "delete";

function SettingsRow({
  icon,
  title,
  subtitle,
  danger,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="account-page__row">
      <span className="account-page__row-icon-box">
        <DpIcon name={icon} className="account-page__row-icon" />
      </span>
      <span className="account-page__row-copy">
        <span
          className="account-page__row-title"
          style={danger ? { color: "var(--color-action-danger)" } : undefined}
        >
          {title}
        </span>
        {subtitle && <span className="account-page__row-subtitle">{subtitle}</span>}
      </span>
      <DpIcon name="ic_chevron-right" className="account-page__row-chevron" />
    </button>
  );
}

export function SettingsView() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { locale } = useLocale();
  const demo = useDemoState();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  };
  const close = () => setDialog(null);
  // PROF-06 / AUTH-03: open the real legal pages in a new tab.
  const openLegal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <>
      {/* Q6: back goes to history, falling back to /profile on a cold open.
          Hidden below 768px by DP's AppLayout rule — hence the in-page control. */}
      <DetailNavbar fallbackPath={localePath(locale, "/profile")} title="Settings" />
      <section className="account-page">
        <div className="account-page__content">
          <div className="account-page__rows account-page__rows--settings">
            {/* PROF-06 / AUTH-03: Terms & Privacy open the real legal pages. */}
            <SettingsRow
              icon="ic_file_text"
              title="Terms of Use"
              onClick={() => openLegal(TERMS_URL)}
            />
            <SettingsRow
              icon="ic_shield_check"
              title="Privacy Policy"
              onClick={() => openLegal(PRIVACY_URL)}
            />
            <SettingsRow
              icon="ic_calendar_x"
              title="Unsubscribe"
              subtitle="Cancel your Muse Pro subscription"
              onClick={() => setDialog(demo.flags.subOnApp ? "unsubscribe-on-app" : "unsubscribe")}
            />
            <SettingsRow
              icon="ic_user_x"
              title="Delete Account"
              subtitle="Permanently remove your account"
              danger
              onClick={() => setDialog("delete")}
            />
            {/* PROF-03: Sign Out moved here from the profile screen. */}
            <SettingsRow
              icon="ic_log_out"
              title="Sign Out"
              onClick={() => {
                signOut();
                router.push(localePath(locale, "/"));
              }}
            />
          </div>
        </div>
      </section>

      {/* Unsubscribe confirm */}
      <Modal open={dialog === "unsubscribe"} onClose={close} title="Unsubscribe?" maxWidth={400}>
        <p className="mb-4 text-[13px] leading-relaxed" style={{ color: "var(--neutral-dark-64)" }}>
          You&apos;ll keep Muse Pro benefits until the end of your current billing period, then
          revert to the free plan.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={close}>
            Keep Pro
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              close();
              flash("Unsubscribed (demo)");
            }}
          >
            Unsubscribe
          </Button>
        </div>
      </Modal>

      {/* Subscribed on a phone — the website can't cancel a store purchase.
          No Figma for this one; copy is this session's own (see the header
          note above). */}
      <Modal
        open={dialog === "unsubscribe-on-app"}
        onClose={close}
        title={
          demo.subPlatform === "android"
            ? "Manage Subscription in Google Play"
            : "Manage Subscription in the App Store"
        }
        maxWidth={400}
      >
        <div className="mb-4 flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            // White, not the dark chip the Delete dialog uses — both logos
            // are drawn in dark strokes/fills, so a dark card background left
            // them nearly invisible.
            style={{ background: "var(--neutral-dark-100)" }}
          >
            <img
              src={`/assets/icons/ui/${demo.subPlatform === "android" ? "ic_google_logo" : "ic_apple_logo"}.svg`}
              width={20}
              height={20}
              alt=""
            />
          </span>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--neutral-dark-64)" }}>
            {demo.subPlatform === "android" ? (
              <>
                Your Muse Pro subscription was purchased through Google Play. To cancel it, open the
                Google Play Store app on your phone, tap your profile icon, then Payments &amp;
                subscriptions → Subscriptions, and cancel Muse Pro there.
              </>
            ) : (
              <>
                Your Muse Pro subscription was purchased through the App Store. To cancel it, open
                Settings on your iPhone, tap your name, then Subscriptions, and cancel Muse Pro
                there.
              </>
            )}
          </p>
        </div>
        <Button className="w-full" onClick={close}>
          Got It
        </Button>
      </Modal>

      {/* Delete Account — destructive confirm */}
      <Modal open={dialog === "delete"} onClose={close} title="Delete Account?" maxWidth={400}>
        <div className="mb-4 flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(239,68,68,.15)" }}
          >
            <img src="/assets/icons/ui/ic_shield_alert.svg" width={20} height={20} alt="" />
          </span>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--neutral-dark-64)" }}>
            This permanently deletes your account and all of your creations. This action cannot be
            undone.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={close}>
            Cancel
          </Button>
          <button
            onClick={() => {
              close();
              flash("Account deleted (demo)");
              // R-9 / TODO.md #7f, closed 2026-09-03. This was the last raw
              // unprefixed `router.push()` left in this file — the sign-out
              // path three rows up already went through `localePath()`, so a
              // Japanese user signing out navigated in place and a Japanese
              // user deleting their account took a cookie-redirect round-trip
              // to the same screen. Invisible in English, which is why it
              // outlived the 2026-08-06 half-fix.
              setTimeout(() => router.push(localePath(locale, "/")), 700);
            }}
            /* Designer request, 2026-08-11: pill, not rounded-xl — same
               filled-button rule as `Button.tsx`. */
            className="flex-1 rounded-full py-2.5 text-[14px] font-bold text-white transition-all hover:brightness-110"
            style={{ background: "var(--color-action-danger)" }}
          >
            Delete
          </button>
        </div>
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
