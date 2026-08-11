"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useCredits } from "@/components/providers/CreditsProvider";
import { DpIcon } from "@/components/ui/DpIcon";
import { DpDialog } from "@/components/ui/DpDialog";
import {
  CREDIT_PACKS,
  CREDIT_SALE_PCT,
  DEFAULT_CREDIT_PACK_ID,
  displayDiscountPct,
  salePrice,
} from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onPurchased?: (credits: number) => void;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3f) ────────────────────
 *
 * DP source: `CreditsDialog` (Figma "IAP — Buy Credits - List_L", 1783:42703).
 * Classes from `src/styles/designer/CreditsDialog.css`, verbatim.
 *
 * ── S20: THE LAYOUT IS DP'S, THE NUMBERS ARE CODE'S ─────────────────────────
 *
 * DP hardcodes its own pack table with the struck-through original price and the
 * "20% OFF" tag baked in as strings. WA already models that properly:
 * `CREDIT_PACKS` holds the Business Model's list prices and SKUs, and
 * `CREDIT_SALE_PCT` derives the sale price, so the discount is one constant
 * rather than twelve literals. Two of DP's six prices disagree with the
 * Business Model outright — which is precisely why S20 says code wins.
 *
 * So this renders DP's layout (tags, struck original, current price, selected
 * state) over WA's data. Setting `CREDIT_SALE_PCT = 0` removes every OFF tag and
 * every struck price on its own; DP's hardcoded version cannot do that.
 *
 * ── WHAT IS NOT PORTED, AND WHY EACH ONE ────────────────────────────────────
 *
 * · DP's `Recover` button has no handler at all. Unlike `/creator`'s Download
 *   and Delete — which had WA implementations waiting for them — there is no
 *   credits-side restore behaviour in WA to wire this to. `SubscribeModal` owns
 *   Restore, where it is real. Shipping it here would be a dead control, so it
 *   stays out until there is something behind it.
 * · DP's `useMountTransition` — see `DpDialog` for the reasoning.
 *
 * DP's footer `Terms of Use` / `Privacy Policy` WAS left out here for the
 * same "no route, no dead link" reason as Recover — reversed by designer
 * request, 2026-08-11: ported as `href="#"`, same as DP, since the visual
 * presence of the footer was asked for explicitly and `guard-greps.sh`'s
 * R-9 rule only bans a literal internal (`/…`) href, not `#`.
 *
 * ── CR-06 REVERSED (designer decision, 2026-08-11) ──────────────────────────
 *
 * This used to gate the whole dialog behind `subscribed`, returning
 * `SubscribeModal` in its place for anyone not on Muse Pro ("credits are
 * sold to Muse Pro subscribers only" — the prior Business Model's Final
 * Decision, predating this migration). The designer overrode that directly:
 * credits are a standalone purchase, not conditional on a subscription.
 * Every caller (`RoomNavbar`/`DetailNavbar`'s credit pill, `CreditsView`'s
 * "Buy More", `HeaderActions`, `AccountMenu`) now reaches the real pack list
 * unconditionally — none of them needed to change, since they all just
 * open this same dialog and it decides its own content.
 */
export function BuyCreditsModal({ open, onClose, onPurchased }: Props) {
  const { credits, addCredits } = useCredits();
  const [selected, setSelected] = useState(DEFAULT_CREDIT_PACK_ID);
  const pack = CREDIT_PACKS.find((p) => p.id === selected)!;
  const sale = CREDIT_SALE_PCT > 0;

  function buy() {
    addCredits(pack.credits);
    onPurchased?.(pack.credits);
    onClose();
  }

  return (
    <DpDialog
      open={open}
      onClose={onClose}
      block="credits-dialog"
      label="Buy Credits"
      title="Buy Credits"
    >
      <div className="credits-dialog__balance">
        <p className="credits-dialog__balance-label">YOUR BALANCE</p>
        <div className="credits-dialog__balance-row">
          <div className="credits-dialog__balance-amount">
            {/* A plain <img>, not a mask — DP keeps the coin's own gold here
                rather than tinting it with currentColor like the other icons. */}
            <img
              src="/assets/icons/ui/ic_credit.svg"
              alt=""
              className="credits-dialog__balance-icon"
            />
            <span className="credits-dialog__balance-number">{credits}</span>
            <span className="credits-dialog__balance-unit">Credits</span>
          </div>
        </div>
      </div>

      <div className="credits-dialog__scroll">
        <p className="credits-dialog__section-label">Buy Credit Pack</p>

        <div className="credits-dialog__packs">
          {CREDIT_PACKS.map((p) => {
            const active = p.id === selected;
            const now = sale ? salePrice(p.price) : p.price;
            return (
              <div className="credits-dialog__pack-slot" key={p.id}>
                {(p.badge || sale) && (
                  <div className="credits-dialog__pack-tags">
                    {p.badge && (
                      <span
                        className={`credits-dialog__tag credits-dialog__tag--${
                          p.badge === "BEST VALUE" ? "purple" : "green"
                        }`}
                      >
                        {p.badge}
                      </span>
                    )}
                    {sale && (
                      <span className="credits-dialog__tag credits-dialog__tag--pink">
                        {displayDiscountPct(CREDIT_SALE_PCT)}% OFF
                      </span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className={`credits-dialog__pack${active ? " credits-dialog__pack--selected" : ""}`}
                  onClick={() => setSelected(p.id)}
                  aria-pressed={active}
                >
                  <div className="credits-dialog__pack-info">
                    <p className="credits-dialog__pack-label">Add Credit</p>
                    <div className="credits-dialog__pack-credits">
                      <DpIcon name="ic_credits" className="credits-dialog__pack-credits-icon" />
                      <span>{p.credits.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="credits-dialog__pack-price">
                    {sale && <span className="credits-dialog__pack-original">{p.price}</span>}
                    <span className="credits-dialog__pack-current">{now}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* CR-03: purchased credits are valid for 2 years (Business Model). DP's
            copy says they "never expire", which contradicts it — WA's wording
            wins for the same reason its prices do. */}
        <p className="credits-dialog__disclaimer">
          Purchased credits are valid for 2 years. Non-refundable and lost upon account deletion.
          Prices may vary by region.
        </p>
      </div>

      {/* Designer fix, 2026-08-11: "Buy Now" only — the trailing "— $price"
          was never DP's copy (Figma node 1783:42502 just says "Buy Now"),
          and the price is already shown on the selected pack's own row
          above. */}
      <button type="button" className="credits-dialog__cta" onClick={buy}>
        Buy Now
      </button>

      <div className="credits-dialog__footer">
        <a href="#">Terms of Use</a>
        <span>|</span>
        <a href="#">Privacy Policy</a>
      </div>
    </DpDialog>
  );
}
