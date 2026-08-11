"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { Tabs } from "@/components/shell/RoomNavbar";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { CREDIT_TRANSACTIONS } from "@/lib/user";

/**
 * `/profile/credits` — Figma "Credits Detail" (636:11875). Classes from
 * `src/styles/designer/CreditsPage.css`, verbatim.
 *
 * ── WAS A MODAL, NOW A ROUTE (designer request, 2026-08-11) ─────────────────
 *
 * This used to be `CreditsDetailModal`, deliberately kept off the C7 route map
 * per plan §2.1 (Credits IAP was scoped "modal, not route" to avoid touching
 * RD's frozen route contract for a screen WA opened from anywhere via the
 * credit pill). The designer asked for DP's actual full-page treatment
 * instead — that IS a C7 change, so it's a declared one: this route was added
 * to the frozen snapshot (`contract.surface.test.ts.snap`) and logged in
 * `docs/CHANGELOG-RD.md` in the same change, per G4-c/G4-g. `CreditsDetailModal`
 * is deleted; both its former callers in `ProfileView` now navigate here.
 *
 * Buy Credits and Upgrade are NOT affected — DP has no route for either of
 * those, so they stay modals (`BuyCreditsModal`/`SubscribeModal`), opened from
 * this page exactly as they were opened from the old modal.
 *
 * ── WHAT DP ADDED THAT WA DID NOT HAVE ──────────────────────────────────────
 *
 * The All / Spend / Earn filter, and a per-row icon — both ported from DP,
 * same as the modal version. The filter derives from the sign of `amount`.
 */
type CreditTab = "all" | "spend" | "earn";
const CREDIT_TABS = [
  { id: "all" as const, label: "All" },
  { id: "spend" as const, label: "Spend" },
  { id: "earn" as const, label: "Earn" },
];

export function CreditsView() {
  const { credits } = useCredits();
  const { locale } = useLocale();
  const [tab, setTab] = useState<CreditTab>("all");
  const [buyOpen, setBuyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  };

  const entries = CREDIT_TRANSACTIONS.filter((t) => {
    if (tab === "spend") return t.amount < 0;
    if (tab === "earn") return t.amount > 0;
    return true;
  });

  return (
    <>
      {/* Q6: back goes to history, falling back to /profile on a cold open —
          same convention as Settings, the other /profile sub-route. */}
      <DetailNavbar fallbackPath={localePath(locale, "/profile")} title="Credits Detail" />
      <section className="credits-page">
        <div className="credits-page__content">
          <div className="credits-page__balance">
            <div>
              <p>YOUR BALANCE</p>
              <strong>
                {/* Plain <img> so the coin keeps its gold — DP's own note. */}
                <img src="/assets/icons/ui/ic_credit.svg" alt="" />
                {credits} <span>Credits</span>
              </strong>
            </div>
            {/* Designer fix, 2026-08-11: DP's own unconditional "Buy More"
                (Figma node 1783:39034), no per-subscriber label swap —
                Buy Credits is a standalone purchase now (CR-06 reversed,
                see `BuyCreditsModal`'s own note), so there's no longer a
                reason for this button to say anything else. */}
            <button
              type="button"
              className="button button--small button--primary-payg"
              onClick={() => setBuyOpen(true)}
            >
              <span className="button__label">Buy More</span>
            </button>
          </div>

          <div className="credits-page__tabs">
            <Tabs tabs={CREDIT_TABS} active={tab} onChange={setTab} />
          </div>

          <div className="credits-page__list">
            {entries.map((t) => (
              <div className="credits-page__entry" key={t.id}>
                <span className="credits-page__entry-icon">
                  {t.icon === "ic_credit" ? (
                    <img src="/assets/icons/ui/ic_credit.svg" alt="" />
                  ) : (
                    <DpIcon name={t.icon} />
                  )}
                </span>
                <span className="credits-page__entry-copy">
                  <strong>{t.label}</strong>
                  <time>{t.date}</time>
                </span>
                <strong
                  className={
                    t.amount > 0
                      ? "credits-page__amount credits-page__amount--earned"
                      : "credits-page__amount"
                  }
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BuyCreditsModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        onPurchased={(n) => flash(`Added ${n} credits`)}
      />

      {toast && (
        <div
          role="status"
          className="anim-toast fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{ background: "var(--neutral-dark-100)", color: "var(--neutral-dark-04)" }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
