// Publish review — the seven reasons a community submission can be REJECTED.
//
// Spec: `specs/areas/04-explore-community.md` (publish flow) + `05-history.md`.
// Product owner, 2026-08-27.
//
// ── WHY THE CODES LIVE ON THE FRONT END ─────────────────────────────────────
//
// Decided 2026-08-27: **the backend returns an enum code, the front end owns
// the copy.** The alternative (backend returns a display string) was weighed
// and rejected for two reasons — it would pin every user to whatever single
// language the backend composed, leaving the nine-locale translation to RD; and
// it would make it impossible for the UI to branch on the reason (a copyright
// rejection wants a different next step from a quality one).
//
// So this file is the contract for that enum. RD implements these seven values;
// anything else must be handled as `UNKNOWN` rather than rendered raw.
//
// ── i18n SCOPE (AGENTS.md R-8) ──────────────────────────────────────────────
//
// The copy below is hardcoded English, deliberately. Only `nav.*` and
// `profile.*` route through `useT()` today, and widening that boundary is a
// separate decision, not a side effect of adding a feature. When translation
// happens these become `TKey`s in `en.ts` — the shape here is already keyed so
// that change is mechanical.

/** The wire value. RD returns one of these; treat anything else as `UNKNOWN`. */
export const PUBLISH_REJECT_CODES = [
  "PLATFORM_POLICY",
  "EXPLICIT_CONTENT",
  "VIOLENCE",
  "HATE_SPEECH",
  "COPYRIGHT",
  "QUALITY",
  "DUPLICATE",
] as const;

export type PublishRejectCode = (typeof PUBLISH_REJECT_CODES)[number];

/**
 * The one line shown to the user, per the product owner's list, in their order.
 *
 * These are the REASON halves only. The sentence that frames them ("Your
 * submission wasn't approved…") belongs to the component that renders it,
 * because it differs between the History card and `/mv/result` — and the
 * designer has not drawn either yet.
 */
export const PUBLISH_REJECT_COPY: Record<PublishRejectCode, string> = {
  PLATFORM_POLICY: "Platform Policy Violation",
  EXPLICIT_CONTENT: "Explicit / Adult Content",
  VIOLENCE: "Violence or Disturbing",
  HATE_SPEECH: "Hate Speech / Discrimination",
  COPYRIGHT: "Suspected Copyright Issue",
  QUALITY: "Poor Audio / Video Quality",
  DUPLICATE: "Duplicate Content",
};

/**
 * Never render an unrecognised code raw — a future backend value would leak an
 * internal identifier into the UI. Falls back to the generic line.
 */
export function publishRejectLabel(code: string): string {
  return (PUBLISH_REJECT_COPY as Record<string, string>)[code] ?? "Content Guidelines";
}

/**
 * Product owner, 2026-08-28: submitting doesn't go straight to live — the
 * toggle sits OFF showing "In Review" for a beat, then either turns on
 * ("On") or comes back as the rejected state above. `MvResult`, `HistoryView`
 * and `CreatorProfile` all fake that turnaround with this one `setTimeout`
 * delay, so a QA session sees the same pacing everywhere instead of three
 * screens disagreeing on how long "review" takes.
 */
export const PUBLISH_REVIEW_DELAY_MS = 2500;

/**
 * ⚠️ **MV ONLY.** Confirmed by the product owner 2026-08-27, matching what the
 * code already did: an **MV** goes through review before appearing in the
 * community; a **song** publishes immediately (`/song/result` renders only
 * On/Off, and `HistoryView`'s `hideDelete` only consults `reviewing` for MVs).
 *
 * So a song can never carry a reject reason today — even though two of the
 * seven ("Poor Audio / Video Quality", "Suspected Copyright Issue") are
 * squarely song problems. That asymmetry is a recorded product decision, not an
 * oversight: if songs ever go to review, `/song/result`'s two-state toggle and
 * `HistoryView`'s `isSong` branch both have to change with it.
 */
export const PUBLISH_REVIEW_APPLIES_TO = ["mv"] as const;
