"use client";

import { DpIcon } from "@/components/ui/DpIcon";

/**
 * Product owner, 2026-08-28, Figma "Popup/Dialog - Edit" → "Error Message"
 * (node 3232:73132 / 3232:73535) — the backend-error state `SubscribeModal`
 * and `BuyCreditsModal` both fall into when the `?demo=1` panel's `apiError`
 * flag simulates a failed purchase request. Identical icon/title/subtitle/
 * Retry in both dialogs, so it lives here once rather than twice.
 *
 * Reuses History's own `.history-page__empty-icon/-message/-title/-subtitle/
 * -cta` classes verbatim (identical type spec to this Figma node) — only the
 * centering wrapper (`.api-error-state`) is new.
 */
export function ApiErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="api-error-state">
      <DpIcon name="ic_alert" className="history-page__empty-icon" />
      <div className="history-page__empty-message">
        <p className="history-page__empty-title">Something Went Wrong</p>
        <p className="history-page__empty-subtitle">
          We couldn&apos;t load this right now. Please check your connection and try again.
        </p>
      </div>
      <button type="button" className="history-page__empty-cta" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
