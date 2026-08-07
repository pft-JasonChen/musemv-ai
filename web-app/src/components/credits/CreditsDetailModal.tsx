"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Tabs } from "@/components/shell/RoomNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { CREDIT_TRANSACTIONS } from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Opens the Buy Credits flow. */
  onBuy: () => void;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3f) ────────────────────
 *
 * DP source: `CreditsPage` (Figma "Credits Detail", 636:11875). Classes from
 * `src/styles/designer/CreditsPage.css`, verbatim.
 *
 * ── DP'S IS A ROUTE, WA'S IS A MODAL — DELIBERATELY ─────────────────────────
 *
 * DP ships this as `/account/credits` with its own navbar and a phone-only
 * header. Plan §2.1 lists Credits IAP as "modal, not route": WA opens it from
 * the credit pill anywhere in the app, and promoting it to a route would change
 * the C7 route map, which G4 freezes. So the PAGE shell is not ported — only
 * the content blocks (`__balance`, `__tabs`, `__list`, `__entry`), which are all
 * single-class selectors and stand alone inside WA's `Modal`.
 *
 * `.credits-page__mobile-header` is skipped for the same reason: `Modal` already
 * supplies a titled, dismissible header, and DP's version is a back link to a
 * route that does not exist here.
 *
 * ── WHAT DP ADDED THAT WA DID NOT HAVE ──────────────────────────────────────
 *
 * The All / Spend / Earn filter, and a per-row icon. Both are ported. The filter
 * derives from the sign of `amount`, exactly as DP derives it, so it needed no
 * new field; the icons did (`CreditTxn.icon`).
 */
type CreditTab = "all" | "spend" | "earn";
const CREDIT_TABS = [
  { id: "all" as const, label: "All" },
  { id: "spend" as const, label: "Spend" },
  { id: "earn" as const, label: "Earn" },
];

export function CreditsDetailModal({ open, onClose, onBuy }: Props) {
  const { credits } = useCredits();
  const { subscribed } = useAuth();
  const [tab, setTab] = useState<CreditTab>("all");

  const entries = CREDIT_TRANSACTIONS.filter((t) => {
    if (tab === "spend") return t.amount < 0;
    if (tab === "earn") return t.amount > 0;
    return true;
  });

  return (
    <Modal open={open} onClose={onClose} title="Credits Detail" maxWidth={600}>
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
          {/* CR-06: Buy Credits is subscriber-only; a free user gets Subscribe.
              DP has one unconditional "Buy More" — porting that verbatim would
              walk a non-subscriber into a purchase flow the Business Model
              closes to them. */}
          <button
            type="button"
            className="button button--small button--primary-payg"
            onClick={onBuy}
          >
            <span className="button__label">{subscribed ? "Buy More" : "Get Muse Pro"}</span>
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
    </Modal>
  );
}
