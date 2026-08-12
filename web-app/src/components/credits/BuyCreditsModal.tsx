"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { SubscribeModal } from "@/components/credits/SubscribeModal";
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
 * ── CR-06: SUBSCRIBER-ONLY. Reversed 2026-08-11, RESTORED 2026-08-12 ────────
 *
 * Credits are sold to Muse Pro subscribers only — Business Model "Credit Plans
 * → Proposal 1, Final Decision". A free user must never see a Buy-Credits
 * affordance; every entry point shows Subscribe instead, and this dialog is
 * the safety net for the in-flow insufficient-balance path.
 *
 * A designer drop dropped this gate on 2026-08-11 ("credits are a standalone
 * purchase"). **That was not the designer's call to make** — CR-06 comes from
 * the Business Model, not the comp — and the product owner reinstated the rule
 * on 2026-08-12. The gate is back; `specs/areas/07` never stopped specifying
 * it (it was left deliberately un-rewritten while the question was open — see
 * TBD-CR-10).
 *
 * The free-user comp is still missing from DP (it has no auth concept at all),
 * so the label falls back to WA's pre-existing "Get Muse Pro". Requested as
 * `DESIGNER-TODO` A21; adopting the real comp later is a label/style change,
 * not a behaviour change.
 */
export function BuyCreditsModal({ open, onClose, onPurchased }: Props) {
  const { subscribed } = useAuth();
  const { credits, addCredits } = useCredits();
  const [selected, setSelected] = useState(DEFAULT_CREDIT_PACK_ID);
  const pack = CREDIT_PACKS.find((p) => p.id === selected)!;
  const sale = CREDIT_SALE_PCT > 0;

  function buy() {
    addCredits(pack.credits);
    onPurchased?.(pack.credits);
    onClose();
  }

  // CR-06: a non-subscriber never reaches the pack list. Returning the
  // Subscribe dialog (rather than rendering a gate screen) keeps every caller
  // unchanged — they all just open "the purchase dialog" and it decides.
  if (!subscribed) {
    return <SubscribeModal open={open} onClose={onClose} />;
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
