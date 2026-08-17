// Send Feedback = a CS support ticket. Spec: `specs/areas/06-profile-account.md` §3.1.
//
// This file is the ONE place the CSB mapping lives, so RD has a single grep
// target when wiring the real endpoint (Feedback API doc:
// https://ecl.cyberlink.com/dc/DocView.aspx?d=4828 · test tool:
// https://stage2.cyberlink.com/prog/support/app/feedback-test.htm).
//
// The ids come from the CS Chatbot support-ticket spec §T3, which describes YCO
// (prodVerId 504). Muse Web reuses the same endpoint, so four of the five type
// ids carry over verbatim; the two values §T3 cannot supply are `null` here and
// tracked as TBD-PROF-06.

import type { TKey } from "@/lib/i18n/dictionaries/en";

/**
 * `prodVerId` for YouCam Muse Web. ❓ TBD-PROF-06 — YCO's is 504; Muse needs its
 * own. `null` until CS/RD supplies it: a wrong constant would file real tickets
 * against the wrong product, which is worse than an incomplete payload the
 * backend can reject.
 */
export const MUSE_PROD_VER_ID: number | null = null;

/**
 * The Type dropdown, in display order. `questionTypeId` is what CSB receives.
 *
 * ❓ **Community Report is `null`** (TBD-PROF-06) — it is a Muse-only category
 * with no YCO id. The label ships because the product owner asked for five
 * types; a submission with it carries `questionTypeId: null` until the id lands.
 * Do NOT quietly map it to Others (211) — that would silently misfile every
 * community report, and the whole point of the category is a separate queue.
 */
export const FEEDBACK_TYPES = [
  { key: "purchase", labelKey: "profile.feedback.typePurchase", questionTypeId: 313 },
  { key: "account", labelKey: "profile.feedback.typeAccount", questionTypeId: 348 },
  { key: "feature", labelKey: "profile.feedback.typeFeature", questionTypeId: 204 },
  { key: "community", labelKey: "profile.feedback.typeCommunity", questionTypeId: null },
  { key: "others", labelKey: "profile.feedback.typeOthers", questionTypeId: 211 },
] as const satisfies readonly { key: string; labelKey: TKey; questionTypeId: number | null }[];

export type FeedbackTypeKey = (typeof FEEDBACK_TYPES)[number]["key"];

/** Field limits (§3.1). Enforced by `maxLength` in the UI and by the wire schema. */
export const FEEDBACK_SUBJECT_MAX = 100;
export const FEEDBACK_DESCRIPTION_MAX = 1000;

/** Any file type, 10 MB across ALL attachments — not per file (CS spec AC-22). */
export const FEEDBACK_MAX_TOTAL_BYTES = 10 * 1024 * 1024;

export function questionTypeIdOf(key: FeedbackTypeKey): number | null {
  return FEEDBACK_TYPES.find((t) => t.key === key)?.questionTypeId ?? null;
}

/**
 * Deliberately permissive: this gates a Send button, so its job is to catch a
 * typo, not to adjudicate RFC 5322. The backend is the real authority.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function totalBytes(files: readonly { size: number }[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}

/**
 * Accept-or-refuse for a batch of newly-picked files. The pick is refused
 * **whole** — never partially added — because a silent truncation reads as
 * success (PROF-E5).
 */
export function acceptAttachments<T extends { size: number }>(
  current: readonly T[],
  picked: readonly T[],
): { accepted: T[]; refused: boolean } {
  if (picked.length === 0) return { accepted: [...current], refused: false };
  const next = [...current, ...picked];
  if (totalBytes(next) > FEEDBACK_MAX_TOTAL_BYTES) return { accepted: [...current], refused: true };
  return { accepted: next, refused: false };
}

/** "1.4 MB" / "812 KB" — chip labels and the running total. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
