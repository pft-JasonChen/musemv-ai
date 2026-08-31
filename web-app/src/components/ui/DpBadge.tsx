import { DpIcon } from "@/components/ui/DpIcon";

/**
 * DP's Badge (`styles/designer/Badge.css`) for the states a cover shows —
 * `.badge--{done,failed,processing}` are all already defined there.
 *
 * Extracted from `HistoryView.tsx` on its second consumer (`CreatorProfile`'s
 * own Failed MV/Song rows, 2026-08-31) rather than copied twice — same
 * reasoning as `DpDialog`'s own extraction.
 */
export function DpBadge({ status }: { status: "Done" | "Failed" | "Processing" }) {
  const icon = status === "Done" ? "ic_check" : status === "Failed" ? "ic_close" : "ic_star";
  const label = status === "Processing" ? "Generating..." : status;
  return (
    <span className={`badge badge--${status.toLowerCase()}`}>
      <DpIcon name={icon} className="badge__icon" />
      <span>{label}</span>
    </span>
  );
}
