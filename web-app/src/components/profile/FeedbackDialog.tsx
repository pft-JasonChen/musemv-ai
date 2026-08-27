"use client";

import { useId, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale, useT } from "@/components/providers/LocaleProvider";
import { api } from "@/lib/api";
import {
  acceptAttachments,
  FEEDBACK_DESCRIPTION_MAX,
  FEEDBACK_TYPES,
  formatBytes,
  isValidEmail,
  MUSE_PROD_VER_ID,
  questionTypeIdOf,
  totalBytes,
  type FeedbackTypeKey,
} from "@/lib/feedback";

/**
 * Send Feedback — a CS support ticket. Spec: `specs/areas/06-profile-account.md`
 * §3.1, decisions in its §10, acceptance AC-PROF-10…16.
 *
 * FOUR fields in the product owner's order (Type → Description → Attachment →
 * Email): classification first, the prefilled contact detail last. The
 * payload's field names ARE the CSB params, so `api.submitFeedback` is the
 * only thing RD has to point at the real endpoint.
 *
 * ── SUBJECT WAS REMOVED (2026-08-27, product owner) ──────────────────────
 *
 * It used to be field 2 of five, and it fed CSB's `title` param. Both are
 * gone: the payload now omits `title` altogether rather than substituting
 * anything for it, which is a declared C2 contract change (see
 * `FeedbackTicketSchema`, and TBD-PROF-07 for the RD question it opens).
 * `AC-PROF-10`/`11`/`12` moved with it — a passing test asserting five fields
 * in that order would otherwise have pinned the old shape.
 *
 * Mounted CONDITIONALLY by its parent (`{fbOpen && <FeedbackDialog …/>}`), which
 * is what makes "re-opening gives a fresh empty form" true without a reset
 * effect — unmounting is the reset.
 *
 * Two things here are load-bearing rather than decorative:
 *
 * 1. **The Type control is a hand-built combobox**, chosen over a native
 *    `<select>` so it can carry DP's styling (§10 decision 11). That makes its
 *    keyboard and ARIA contract part of the spec (AC-PROF-16), not an
 *    implementation detail — it follows the APG select-only combobox pattern:
 *    focus stays on the trigger and `aria-activedescendant` moves, so there is
 *    no focus to trap and nothing to restore.
 * 2. **A failed submit must not cost the user their draft** (PROF-E6). Hence
 *    `status` is a separate axis from the field state: `error` re-enables Send
 *    with every value and attachment still mounted.
 */

type Status = "form" | "sending" | "sent" | "error";

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const { profile } = useAuth();

  const [type, setType] = useState<FeedbackTypeKey | null>(null);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [tooLarge, setTooLarge] = useState(false);
  const [email, setEmail] = useState(profile.email);
  const [status, setStatus] = useState<Status>("form");

  // Type combobox
  const [typeOpen, setTypeOpen] = useState(false);
  /** Keyboard position — what `aria-activedescendant` points at and Enter commits. */
  const [activeIdx, setActiveIdx] = useState(0);
  /** Pointer position — paints only. See the note on the option's `onMouseEnter`. */
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const listId = useId();
  const typeLabelId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const sending = status === "sending";
  const canSend = type !== null && description.trim() !== "" && isValidEmail(email) && !sending;

  const used = totalBytes(files);
  const selectedLabel = type ? t(FEEDBACK_TYPES.find((x) => x.key === type)!.labelKey) : null;

  function commitType(index: number) {
    setType(FEEDBACK_TYPES[index].key);
    setActiveIdx(index);
    setTypeOpen(false);
  }

  /** APG select-only combobox keys — AC-PROF-16. */
  function onTypeKeyDown(e: React.KeyboardEvent) {
    const last = FEEDBACK_TYPES.length - 1;
    // Any navigation key hands the highlight back to the keyboard, so a hover
    // left behind by a stationary cursor cannot keep painting a different row
    // than the one Enter would commit.
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) setHoverIdx(null);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!typeOpen) setTypeOpen(true);
        else setActiveIdx((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!typeOpen) setTypeOpen(true);
        else setActiveIdx((i) => Math.max(0, i - 1));
        break;
      case "Home":
        if (typeOpen) {
          e.preventDefault();
          setActiveIdx(0);
        }
        break;
      case "End":
        if (typeOpen) {
          e.preventDefault();
          setActiveIdx(last);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (typeOpen) commitType(activeIdx);
        else setTypeOpen(true);
        break;
      case "Escape":
        // Stops at the combobox: Modal's own Escape handler would otherwise
        // close the whole dialog and take the draft with it.
        if (typeOpen) {
          e.preventDefault();
          e.stopPropagation();
          setTypeOpen(false);
        }
        break;
      case "Tab":
        setTypeOpen(false);
        break;
    }
  }

  function pickFiles(picked: FileList | null) {
    if (!picked || picked.length === 0) return;
    const { accepted, refused } = acceptAttachments(files, Array.from(picked));
    setFiles(accepted);
    setTooLarge(refused); // one message, inside the form — never a toast (PROF-E5)
  }

  async function send() {
    setStatus("sending");
    try {
      await api.submitFeedback({
        email: email.trim(),
        questionTypeId: questionTypeIdOf(type!),
        // No `title` — the Subject field is gone (see the header note).
        q: description.trim(), // description ALONE — no User ID, no Order ID
        language: locale, // product code (`enu`…`ptg`), not BCP-47
        prodVerId: MUSE_PROD_VER_ID,
        attachment: files,
      });
      setStatus("sent");
    } catch {
      setStatus("error"); // draft stays mounted — PROF-E6
    }
  }

  // Matches `.account-edit__field input` (AccountPage.css) for the two controls
  // that rule cannot reach, because it selects `input` by element: the combobox
  // trigger and the textarea. `rounded-xl` is 14px here — globals.css remaps it.
  const controlStyle = { borderColor: "var(--white-15)", color: "var(--neutral-dark-100)" };
  const controlClass =
    "w-full rounded-xl border bg-transparent px-2.5 text-[14px] font-medium outline-none";

  if (status === "sent") {
    return (
      <Modal open onClose={onClose} title={t("profile.sendFeedback")} maxWidth={460}>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <h3 className="text-[17px] font-bold">{t("profile.feedback.sentTitle")}</h3>
          <p className="text-[13px]" style={{ color: "var(--neutral-dark-64)" }}>
            {t("profile.feedback.sentBody").replace("{email}", email.trim())}
          </p>
          <Button className="mt-3 w-full" onClick={onClose}>
            {t("profile.feedback.done")}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={t("profile.sendFeedback")} maxWidth={460}>
      {/* ── Type ─────────────────────────────────────────────────────────── */}
      <div className="account-edit__field">
        <span id={typeLabelId}>{t("profile.feedback.type")}</span>
        <div
          className="relative"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setTypeOpen(false);
          }}
        >
          <button
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={typeOpen}
            aria-controls={listId}
            aria-labelledby={typeLabelId}
            aria-activedescendant={typeOpen ? `${listId}-${activeIdx}` : undefined}
            disabled={sending}
            onClick={() => setTypeOpen((o) => !o)}
            onKeyDown={onTypeKeyDown}
            className={`${controlClass} flex h-12 items-center justify-between text-left`}
            style={controlStyle}
          >
            <span style={{ color: selectedLabel ? undefined : "var(--neutral-dark-64)" }}>
              {selectedLabel ?? t("profile.feedback.typePlaceholder")}
            </span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {typeOpen && (
            <ul
              id={listId}
              role="listbox"
              aria-labelledby={typeLabelId}
              // Keeps focus on the trigger through the click: mousedown → blur
              // would unmount this list before the click ever landed on an option.
              onMouseDown={(e) => e.preventDefault()}
              onMouseLeave={() => setHoverIdx(null)}
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-xl border py-1"
              style={{ background: "var(--card-2)", borderColor: "var(--border-2)" }}
            >
              {FEEDBACK_TYPES.map((option, i) => (
                <li
                  key={option.key}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={type === option.key}
                  onClick={() => commitType(i)}
                  // Hover PAINTS but does not move `activeIdx`, and that
                  // separation is the fix for a real bug, not fussiness: the
                  // pointer does not have to move for `mouseenter` to fire —
                  // opening the list under a stationary cursor fires it too. When
                  // hover wrote `activeIdx`, opening with ArrowDown highlighted
                  // whatever the mouse happened to be sitting over and Enter
                  // committed THAT, so keyboard selection depended on where the
                  // mouse was left. Caught by the AC-PROF-16 e2e test, which read
                  // `aria-activedescendant` as option 5 immediately after opening.
                  onMouseEnter={() => setHoverIdx(i)}
                  className="cursor-pointer px-2.5 py-2 text-[14px] font-medium"
                  style={{
                    background:
                      i === (hoverIdx ?? activeIdx) ? "var(--neutral-dark-14)" : "transparent",
                  }}
                >
                  {t(option.labelKey)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <label className="account-edit__field mt-3">
        {t("profile.feedback.description")}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("profile.feedbackPlaceholder")}
          maxLength={FEEDBACK_DESCRIPTION_MAX}
          readOnly={sending}
          className={`${controlClass} min-h-[104px] resize-none py-2.5`}
          style={controlStyle}
        />
      </label>
      <p className="mt-1 text-right text-[11px]" style={{ color: "var(--neutral-dark-64)" }}>
        {description.length}/{FEEDBACK_DESCRIPTION_MAX}
      </p>

      {/* ── Attachment ───────────────────────────────────────────────────── */}
      <div className="account-edit__field mt-2">
        <span>{t("profile.feedback.attachment")}</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={sending}
            onClick={() => fileRef.current?.click()}
            className="h-9 rounded-full border px-3 text-[13px] font-semibold"
            style={{ borderColor: "var(--border-2)", color: "var(--neutral-dark-100)" }}
          >
            {t("profile.feedback.addFile")}
          </button>
          <span className="text-[11px] font-medium" style={{ color: "var(--neutral-dark-64)" }}>
            {files.length === 0
              ? t("profile.feedback.attachmentHint")
              : `${formatBytes(used)} ${t("profile.feedback.attachmentTotal")}`}
          </span>
        </div>
        {/* Hidden input + styled trigger — the MvRoom.tsx pattern. `multiple`
            because the attachment budget is cumulative, not per file. */}
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium"
                style={{ background: "var(--neutral-dark-14)" }}
              >
                <span className="min-w-0 truncate">{file.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span style={{ color: "var(--neutral-dark-64)" }}>{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    aria-label={`${t("profile.feedback.removeFile")}: ${file.name}`}
                    disabled={sending}
                    onClick={() => {
                      setFiles((prev) => prev.filter((_, idx) => idx !== i));
                      setTooLarge(false);
                    }}
                    className="grid h-5 w-5 place-items-center rounded-full"
                    style={{ background: "var(--white-15)" }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                      <path
                        d="M1 1l6 6M7 1L1 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {tooLarge && (
          <p className="text-[12px] font-medium" style={{ color: "var(--color-action-danger)" }}>
            {t("profile.feedback.attachmentTooLarge")}
          </p>
        )}
      </div>

      {/* ── Email (prefilled, editable — §10 decision 7) ─────────────────── */}
      <label className="account-edit__field mt-3">
        {t("profile.email")}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("profile.feedback.emailPlaceholder")}
          readOnly={sending}
        />
      </label>

      {status === "error" && (
        <p className="mt-3 text-[12px] font-medium" style={{ color: "var(--color-action-danger)" }}>
          {t("profile.feedback.sendError")}
        </p>
      )}

      <div className="account-edit__actions mt-4">
        <button
          type="button"
          className="button button--medium button--tertiary"
          disabled={sending}
          onClick={onClose}
        >
          <span className="button__label">{t("profile.cancel")}</span>
        </button>
        <Button disabled={!canSend} onClick={send}>
          {sending ? t("profile.feedback.sending") : t("common.send")}
        </Button>
      </div>
    </Modal>
  );
}
