"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubscribed?: (planName: string) => void;
}

export function SubscribeModal({ open, onClose, onSubscribed }: Props) {
  const { subscribe } = useAuth();
  const { addCredits } = useCredits();
  const [selected, setSelected] = useState<PlanId>("super");
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selected)!;

  function confirm() {
    subscribe(plan.id);
    addCredits(plan.credits);
    onSubscribed?.(plan.name);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Muse Pro" maxWidth={460}>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: "var(--mv-grad)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>
        </span>
        <div>
          <div className="text-[15px] font-bold">Unlock Muse Pro</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>More credits, faster renders, no watermark.</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SUBSCRIPTION_PLANS.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="relative flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors"
              style={{
                background: active ? "linear-gradient(to right, rgba(66,13,107,1), var(--card))" : "var(--card-2)",
                border: `1.5px solid ${active ? "var(--accent)" : "var(--border-2)"}`,
              }}
            >
              {p.badge && (
                <span className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ background: "var(--accent)" }}>
                  {p.badge}
                </span>
              )}
              <div>
                <div className="text-[15px] font-bold">{p.name}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--gold)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="12" r="9" opacity="0.25" /><circle cx="12" cy="12" r="6" /></svg>
                  {p.credits.toLocaleString()} credits · resets {p.cadence.toLowerCase()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[17px] font-extrabold">{p.price}</div>
                <div className="text-[11px]" style={{ color: "var(--text-3)" }}>/ {p.cadence === "Yearly" ? "year" : "week"}</div>
              </div>
            </button>
          );
        })}
      </div>

      <Button className="mt-5 w-full" onClick={confirm}>
        Subscribe — {plan.price}
      </Button>
      <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-3)" }}>
        Demo only — no real payment. Cancel anytime.
      </p>
    </Modal>
  );
}
