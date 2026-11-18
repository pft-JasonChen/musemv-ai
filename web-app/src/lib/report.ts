export type ReportKind = "song" | "mv";

/** Figma "Report Sheet" (nodes 5319:56306 / 5126:62262) — the six reasons, in order. */
export const REPORT_REASONS = [
  "Sexual or adult content",
  "Harassment or hate speech",
  "Spam or commercial advertising",
  "Violent or disturbing content",
  "Misinformation or misleading",
  "Copyright or unauthorized use",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * The seventh choice, "Something else" (Figma 5375:181583 / 5375:178526): it is not
 * one of the six removal reasons (so it is NOT in `REPORT_REASONS`, which
 * `REMOVAL_REASON_COPY` is keyed on) — it opens a free-text page instead.
 */
export const REPORT_OTHER = "Something else";
export const REPORT_DETAILS_MAX = 1000;

/**
 * Content this visit has already reported, by `kind:id`.
 *
 * Module scope, in memory only (product owner, 2026-10-21): it survives
 * client-side navigation between the player screens and resets on a real
 * document load, the same boundary `faceConsent.ts` and `HistoryView`'s
 * remembered tab use. There is no backend to record a report against, so
 * this is the whole of the "already reported" state.
 */
export const REPORT_SESSION_MAX = 5;
const reported = new Set<string>();
export function reportCount(): number {
  return reported.size;
}
export function resetReports(): void {
  reported.clear();
}

const key = (kind: ReportKind, id: string) => `${kind}:${id}`;

export function hasReported(kind: ReportKind, id: string): boolean {
  return reported.has(key(kind, id));
}

export function markReported(kind: ReportKind, id: string): void {
  reported.add(key(kind, id));
}

/**
 * A creation that a reviewer took down after a community report — Figma
 * "Menu + Removed Notice" (node 5323:170908). Dates are ISO `YYYY-MM-DD`.
 *
 * YMW261112P0005 (product owner, 2026-11-18): there is no ordinary-vs-permanent
 * removal rule, so the former `kind: "removed" | "permanent"` is gone — every
 * removal reads the same, and only `reason` changes the copy.
 */
export interface ContentRemoval {
  reason: ReportReason;
  publishedOn: string;
  removedOn: string;
}

/**
 * What the notice says about each report reason. `label` is the chip; `clause`
 * completes "This content contained …".
 *
 * Spam and Copyright come from Figma; the other four were drafted in the same
 * voice and APPROVED by the product owner as written (YMW261112P0005,
 * 2026-11-18), with Copyright's "authorisation" changed to US spelling.
 */
export const REMOVAL_REASON_COPY: Record<ReportReason, { label: string; clause: string }> = {
  "Sexual or adult content": {
    label: "Sexual or Adult Content",
    clause: "sexually explicit or adult material that is not permitted on Muse",
  },
  "Harassment or hate speech": {
    label: "Harassment or Hate Speech",
    clause: "harassment, hate speech, or content that targets people or groups",
  },
  "Spam or commercial advertising": {
    label: "Spam or Commercial Advertising",
    clause:
      "repetitive spam, fake engagement signals, or deceptive titles and thumbnails that misrepresent the actual content",
  },
  "Violent or disturbing content": {
    label: "Violent or Disturbing Content",
    clause: "violent or disturbing material that is not permitted on Muse",
  },
  "Misinformation or misleading": {
    label: "Misinformation or Misleading",
    clause: "false or misleading information presented as fact",
  },
  "Copyright or unauthorized use": {
    label: "Copyright or Unauthorized Use",
    clause:
      "copyrighted music, video footage, or artwork used without authorization from the rights holder",
  },
};

export function removalDetail(removal: ContentRemoval): string {
  const { clause } = REMOVAL_REASON_COPY[removal.reason];
  return `This content contained ${clause}.`;
}

/** "2026-10-13" -> "Oct 13, 2026" (UTC, so the day never shifts with the viewer's timezone). */
export function formatNoticeDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
