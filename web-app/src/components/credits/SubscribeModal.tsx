"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { MUSE_PRO_FEATURES, SUBSCRIPTION_PLANS, WEEKLY_CREDITS, type PlanId } from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubscribed?: (planName: string) => void;
}

export function SubscribeModal({ open, onClose, onSubscribed }: Props) {
  const { subscribe, subscribed } = useAuth();
  const { addCredits } = useCredits();
  const [selected, setSelected] = useState<PlanId>("monthly");
  const [restored, setRestored] = useState(false);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selected)!;

  function confirm() {
    subscribe(plan.id);
    addCredits(plan.credits);
    onSubscribed?.(plan.name);
    onClose();
  }

  // CR-05: already-Pro state — no plan picker, just a confirmation + Restore.
  if (subscribed) {
    return (
      <Modal open={open} onClose={onClose} title="Muse Pro" maxWidth={460}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: "var(--mv-grad)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>
          </span>
          <div className="text-[16px] font-bold">You&apos;re already on Muse Pro</div>
          <div className="text-[13px]" style={{ color: "var(--text-2)" }}>Enjoy your {WEEKLY_CREDITS} weekly credits, HD renders, and full playback.</div>
          <Button className="mt-2 w-full" onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Muse Pro" maxWidth={460}>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: "var(--mv-grad)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>
        </span>
        <div>
          {/* CR-02: headline benefit + feature list. */}
          <div className="text-[15px] font-bold">{WEEKLY_CREDITS} Weekly Credits</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>Everything in Muse Pro, one subscription.</div>
        </div>
      </div>

      {/* CR-02: six-feature list */}
      <ul className="mb-4 grid grid-cols-1 gap-1.5">
        {MUSE_PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-2)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 13l4 4L19 7" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {f}
          </li>
        ))}
      </ul>

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
                <div className="text-[11px]" style={{ color: "var(--text-3)" }}>/ {p.per}</div>
              </div>
            </button>
          );
        })}
      </div>

      <Button className="mt-5 w-full" onClick={confirm}>
        Subscribe — {plan.price}
      </Button>
      {/* CR-05: Restore Purchases for users who already bought on another device. */}
      <button onClick={() => setRestored(true)} className="mt-2 w-full text-center text-[12px] font-semibold" style={{ color: "var(--accent)" }}>
        Restore Purchases
      </button>
      {restored && (
        <p className="mt-1 text-center text-[11px]" style={{ color: "var(--text-2)" }}>No previous purchases found on this account.</p>
      )}
      <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-3)" }}>
        {/* CR-03: subscription credits reset each billing cycle. */}
        Demo only — no real payment. Subscription credits reset each cycle. Cancel anytime.
      </p>
    </Modal>
  );
}
