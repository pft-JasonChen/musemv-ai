"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMvFlow } from "@/components/mv/MvFlowProvider";
import { CREDIT_PACKS } from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onPurchased?: (credits: number) => void;
}

export function BuyCreditsModal({ open, onClose, onPurchased }: Props) {
  const { credits, addCredits } = useMvFlow();
  const [selected, setSelected] = useState(2);
  const pack = CREDIT_PACKS.find((p) => p.id === selected)!;

  function buy() {
    addCredits(pack.credits);
    onPurchased?.(pack.credits);
    onClose();
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

      <div className="mb-2 text-[15px] font-bold">Credit Pack</div>
      <div className="flex flex-col gap-3">
        {CREDIT_PACKS.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="relative flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors"
              style={{
                background: p.popular ? "linear-gradient(to right, rgba(66,37,3,1), var(--card))" : "var(--card-2)",
                border: `1.5px solid ${active ? (p.popular ? "var(--gold)" : "var(--accent)") : "var(--border-2)"}`,
              }}
            >
              {p.popular && (
                <span className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: "rgba(255,138,2,.85)" }}>
                  POPULAR
                </span>
              )}
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-2)" }}>Add Credit</div>
                <div className="text-[17px] font-bold">{p.credits}</div>
              </div>
              <div className="text-[20px] font-extrabold">{p.price}</div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-3)" }}>
        Credits are non-refundable and expire after 12 months. Prices may vary by region.
      </p>

      <div className="mt-4">
        <Button className="w-full" onClick={buy}>Buy Now — {pack.price}</Button>
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-2)" }}>Cancel anytime · No commitment</p>
      </div>
    </Modal>
  );
}
