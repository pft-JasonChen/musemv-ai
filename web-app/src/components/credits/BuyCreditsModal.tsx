"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { CREDIT_PACKS, CREDIT_SALE_PCT, DEFAULT_CREDIT_PACK_ID, displayDiscountPct, salePrice } from "@/lib/user";
import { SubscribeModal } from "@/components/credits/SubscribeModal";

interface Props {
  open: boolean;
  onClose: () => void;
  onPurchased?: (credits: number) => void;
}

export function BuyCreditsModal({ open, onClose, onPurchased }: Props) {
  const { credits, addCredits } = useCredits();
  const { subscribed } = useAuth();
  const [selected, setSelected] = useState(DEFAULT_CREDIT_PACK_ID);
  const pack = CREDIT_PACKS.find((p) => p.id === selected)!;
  const sale = CREDIT_SALE_PCT > 0;

  function buy() {
    addCredits(pack.credits);
    onPurchased?.(pack.credits);
    onClose();
  }

  // CR-06 (Business Model, Final Decision): credits are sold to Muse Pro
  // subscribers only. Buy Credits is never shown to a non-subscriber — every
  // entry point routes them to Subscribe, and this is the safety net for the
  // in-flow "insufficient balance" path.
  if (!subscribed) {
    return <SubscribeModal open={open} onClose={onClose} />;
  }

  return (
    <Modal open={open} onClose={onClose} title="Buy Credits" maxWidth={460}>
      <div className="mb-5">
        <div className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
          Your balance
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-[40px] font-extrabold leading-none">{credits}</span>
          <span className="mb-1.5 text-[12px] font-semibold" style={{ color: "var(--text-3)" }}>credits</span>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[15px] font-bold">Credit Pack</span>
        {/* TBD-CR-07 sample: limited-time sale banner. */}
        {sale && (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{ background: "rgba(255,138,2,.85)" }}>
            Limited-time · {displayDiscountPct(CREDIT_SALE_PCT)}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {CREDIT_PACKS.map((p) => {
          const active = p.id === selected;
          const isBest = p.badge === "BEST VALUE";
          const now = sale ? salePrice(p.price) : p.price;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="relative flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors"
              style={{
                background: isBest ? "linear-gradient(to right, rgba(66,37,3,1), var(--card))" : "var(--card-2)",
                border: `1.5px solid ${active ? (isBest ? "var(--gold)" : "var(--accent)") : "var(--border-2)"}`,
              }}
            >
              {/* TBD-CR-07 sample: a card can carry its tier badge and a "% off" badge together. */}
              <div className="absolute -top-2 right-3 flex items-center gap-1.5">
                {p.badge && (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: isBest ? "rgba(255,138,2,.85)" : "var(--accent)" }}>
                    {p.badge}
                  </span>
                )}
                {sale && (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: "var(--red)" }}>
                    {displayDiscountPct(CREDIT_SALE_PCT)}% OFF
                  </span>
                )}
              </div>
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-2)" }}>Add Credit</div>
                <div className="text-[17px] font-bold">{p.credits.toLocaleString()}</div>
              </div>
              <div className="text-right">
                {sale && (
                  <div className="text-[12px] line-through" style={{ color: "var(--text-3)" }}>{p.price}</div>
                )}
                <div className="text-[20px] font-extrabold">{now}</div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-3)" }}>
        {/* CR-03: purchased credits are valid for 2 years (Business Model). */}
        Purchased credits are valid for 2 years. Non-refundable. Prices may vary by region.
      </p>

      <div className="mt-4">
        <Button className="w-full" onClick={buy}>Buy Now — {sale ? salePrice(pack.price) : pack.price}</Button>
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-2)" }}>Subscriber-only · No commitment</p>
      </div>
    </Modal>
  );
}
