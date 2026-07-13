"use client";
/* eslint-disable @next/next/no-img-element */

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCredits } from "@/components/providers/CreditsProvider";
import { CREDIT_TRANSACTIONS } from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Opens the Buy Credits flow. */
  onBuy: () => void;
}

/** Credits Detail — current balance + transaction ledger, with a Buy Credits CTA. */
export function CreditsDetailModal({ open, onClose, onBuy }: Props) {
  const { credits } = useCredits();

  return (
    <Modal open={open} onClose={onClose} title="Credits" maxWidth={460}>
      {/* Balance */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl p-4" style={{ background: "var(--card-2)" }}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: "var(--mv-grad)" }}>
          <img src="/assets/icons/ui/ic_credits.svg" width={22} height={22} alt="" style={{ filter: "brightness(0) invert(1)" }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>Your balance</div>
          <div className="flex items-end gap-1.5">
            <span className="text-[28px] font-extrabold leading-none" style={{ color: "var(--gold)" }}>{credits}</span>
            <span className="mb-1 text-[12px] font-semibold" style={{ color: "var(--text-3)" }}>credits</span>
          </div>
        </div>
        <Button className="!h-9 px-4 text-[13px]" onClick={onBuy}>Buy Credits</Button>
      </div>

      {/* Transaction ledger */}
      <div className="mb-2 text-[13px] font-bold">Transaction History</div>
      <div className="max-h-[280px] overflow-y-auto pr-2">
        {CREDIT_TRANSACTIONS.map((t) => {
          const positive = t.amount > 0;
          return (
            <div key={t.id} className="flex items-center gap-3 border-b py-2.5" style={{ borderColor: "var(--border-3)" }}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                <img src="/assets/icons/ui/ic_credits.svg" width={16} height={16} alt="" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{t.label}</div>
                <div className="text-[11px]" style={{ color: "var(--text-3)" }}>{t.date}</div>
              </div>
              <span className="text-[14px] font-bold tabular-nums" style={{ color: positive ? "var(--green)" : "var(--text-2)" }}>
                {positive ? "+" : ""}{t.amount}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
