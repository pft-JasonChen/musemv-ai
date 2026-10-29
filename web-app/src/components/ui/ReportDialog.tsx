"use client";

import { authStore } from "@/lib/authStore";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useToastTimer } from "@/components/ui/useToastTimer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { isOwnContent, isPubliclyRemoved, moderationStore } from "@/lib/contentModeration";
import { useModeration } from "@/components/community/useModeration";
import { useDialogTransition, useEscapeToClose } from "@/components/ui/useDialogTransition";
import { PHONE_QUERY, useMediaQuery } from "@/lib/ssr";
import {
  hasReported,
  reportCount,
  REPORT_SESSION_MAX,
  markReported,
  REPORT_DETAILS_MAX,
  REPORT_OTHER,
  REPORT_REASONS,
  type ReportKind,
  type ReportReason,
} from "@/lib/report";

/** What a report carries: a listed reason, or "Something else" with the user's own words. */
export type ReportChoice = ReportReason | typeof REPORT_OTHER;

const TITLE: Record<ReportKind, string> = {
  song: "Report Song",
  mv: "Report Music Video",
};

export const REPORT_LIMIT = "You have reached the report limit for this session.";
export const REPORT_FAILED = "Couldn’t submit your report. Please try again.";

export const ALREADY_REPORTED = "You already reported this content.";

/**
 * Report flow for community content — Figma "Report Song" (nodes 5319:56800 /
 * 5319:56991): a centred dialog on desktop, a bottom sheet on phones, the same
 * steps in both. Pick one of six reasons → Submit Report → "Thank you for
 * keeping Muse safe". Submit stays disabled until a reason is picked.
 *
 * A seventh row, "Something else" (Figma 5375:181583 / 5375:178526), pushes a
 * second page with a Back row and a 1000-character "Details" box (✕ clears it).
 * Submit is on that page too — enabled once there is text — so nobody has to go
 * back to send it. The text survives Back and re-entering; it is in memory only.
 *
 * The body unmounts when closed (like `DpDialog`), so the picked reason and the
 * submitted step reset themselves on the next open — no reset effect needed.
 */
export function ReportDialog({
  open,
  kind,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  kind: ReportKind;
  onClose: () => void;
  onSubmitted: (reason: ReportChoice, details?: string) => void | Promise<void>;
}) {
  const { mounted, visible } = useDialogTransition(open);
  useEscapeToClose(open, onClose);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <ReportDialogBody
      open={open}
      visible={visible}
      kind={kind}
      onClose={onClose}
      onSubmitted={onSubmitted}
    />,
    document.body,
  );
}

function ReportDialogBody({
  open,
  visible,
  kind,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  visible: boolean;
  kind: ReportKind;
  onClose: () => void;
  onSubmitted: (reason: ReportChoice, details?: string) => void | Promise<void>;
}) {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [view, setView] = useState<"list" | "other">("list");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const inOther = view === "other";
  const canSubmit = inOther ? details.trim().length > 0 : reason !== null;

  async function submit() {
    if (!canSubmit || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError("");
    try {
      await onSubmitted(inOther ? REPORT_OTHER : reason!, inOther ? details.trim() : undefined);
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : REPORT_FAILED);
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  const closeButton = (
    <button type="button" className="report-dialog__close" onClick={onClose} aria-label="Close">
      <DpIcon name="ic_close" className="report-dialog__close-icon" />
    </button>
  );

  return (
    <div className={`report-overlay${visible ? " report-overlay--visible" : ""}`}>
      <div className="report-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className={isPhone ? "report-dialog report-dialog--sheet" : "report-dialog"}
        role="dialog"
        aria-modal="true"
        aria-label={TITLE[kind]}
        inert={!open}
      >
        {isPhone && <span className="report-dialog__handle" aria-hidden="true" />}

        {submitted ? (
          <>
            {isPhone && <div className="report-dialog__header">{closeButton}</div>}
            <div className="report-dialog__done">
              <span className="report-dialog__success" aria-hidden="true">
                <DpIcon name="ic_check" className="report-dialog__success-icon" />
              </span>
              <div className="report-dialog__message">
                <p className="report-dialog__message-title">Thank you for keeping Muse safe</p>
                <p className="report-dialog__subtitle">
                  We&apos;ll review this content. If it violates our community guidelines,
                  we&apos;ll take action — usually within 24 hours.
                </p>
              </div>
              <button
                type="button"
                className="report-dialog__cta report-dialog__cta--done"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="report-dialog__header">
              {isPhone && closeButton}
              <h2 className="report-dialog__title">{TITLE[kind]}</h2>
              {!isPhone && closeButton}
            </div>

            {inOther ? (
              <>
                <hr className="report-dialog__divider" />
                <div className="report-dialog__other">
                  <button
                    type="button"
                    className="report-dialog__back-row"
                    onClick={() => setView("list")}
                    aria-label="Back from Something else"
                  >
                    <span className="report-dialog__back">
                      <DpIcon name="ic_arrow_left" className="report-dialog__close-icon" />
                    </span>
                    <span className="report-dialog__back-title">{REPORT_OTHER}</span>
                  </button>
                  <p className="report-dialog__hint">
                    Share as much detail as you can. Don&apos;t include personal or sensitive info.
                  </p>
                  <div className="report-dialog__field">
                    <label className="report-dialog__field-label" htmlFor="report-details">
                      Details
                    </label>
                    <div className="report-dialog__input-box">
                      <textarea
                        id="report-details"
                        className="report-dialog__textarea"
                        value={details}
                        maxLength={REPORT_DETAILS_MAX}
                        placeholder="Tell us what’s wrong with this content"
                        autoFocus={!isPhone}
                        onChange={(e) => setDetails(e.target.value)}
                      />
                      <div className="report-dialog__counter">
                        <span>
                          {details.length}/{REPORT_DETAILS_MAX}
                        </span>
                        {details.length > 0 && (
                          <button
                            type="button"
                            className="report-dialog__clear"
                            onClick={() => setDetails("")}
                            aria-label="Clear"
                          >
                            <DpIcon name="ic_close" className="report-dialog__clear-icon" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="report-dialog__subtitle">
                  Why are you reporting this? Your report is anonymous.
                </p>
                <div className="report-dialog__reasons" role="radiogroup" aria-label="Reason">
                  {REPORT_REASONS.map((r) => {
                    const selected = r === reason;
                    return (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`report-dialog__reason${selected ? " report-dialog__reason--selected" : ""}`}
                        onClick={() => setReason(r)}
                      >
                        <span className="report-dialog__reason-label">{r}</span>
                        <span className="report-dialog__radio" aria-hidden="true" />
                      </button>
                    );
                  })}
                  {/* Not a radio: it does not pick a reason, it opens the details page. */}
                  <button
                    type="button"
                    className="report-dialog__reason report-dialog__reason--other"
                    onClick={() => setView("other")}
                  >
                    <span className="report-dialog__reason-label">{REPORT_OTHER}</span>
                    <DpIcon name="ic_chevron-right" className="report-dialog__chevron" />
                  </button>
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="report-dialog__subtitle">
                {error}
              </p>
            )}
            <button
              type="button"
              className="report-dialog__cta report-dialog__cta--submit"
              onClick={submit}
              disabled={!canSubmit || sending}
            >
              {sending ? "Submitting…" : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Everything a player screen needs for the report entry point: click the flag →
 * toast if this content was already reported, otherwise the dialog. Render
 * `reportNode` once anywhere in the screen. `contentId` may be empty while a
 * screen is still resolving its content — the flag is not shown then anyway.
 */
export function useReportContent(kind: ReportKind, contentId: string) {
  const [open, setOpen] = useState(false);
  const { loggedIn } = useAuth();
  const { history } = useHistory();
  useModeration();
  const canReport =
    !!contentId &&
    !(
      loggedIn &&
      isOwnContent(
        kind,
        contentId,
        history.filter((h) => h.kind === kind).map((h) => h.id),
      )
    ) &&
    !isPubliclyRemoved(kind, contentId);
  const { toast: message, show, hold } = useToastTimer<string>(3000);
  function blocked() {
    if (
      !canReport ||
      isPubliclyRemoved(kind, contentId) ||
      (authStore.getSnapshot() &&
        isOwnContent(
          kind,
          contentId,
          history.filter((h) => h.kind === kind).map((h) => h.id),
        ))
    )
      return "This content cannot be reported.";
    if (hasReported(kind, contentId)) return ALREADY_REPORTED;
    if (reportCount() >= REPORT_SESSION_MAX) return REPORT_LIMIT;
    return null;
  }
  function openReport() {
    if (!canReport) return;
    const error = blocked();
    if (error) show(error);
    else setOpen(true);
  }
  const reportNode = (
    <>
      <ReportDialog
        key={`${kind}:${contentId}`}
        open={open && canReport}
        kind={kind}
        onClose={() => setOpen(false)}
        onSubmitted={async () => {
          const error = blocked();
          if (error) throw new Error(error);
          // Yield one frame with a disabled CTA; this is a local mock, not an API.
          await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
          const latest = blocked();
          if (latest) throw new Error(latest);
          if (moderationStore.getSnapshot().failReports) throw new Error(REPORT_FAILED);
          markReported(kind, contentId);
        }}
      />
      {message && (
        <div
          tabIndex={0}
          role="status"
          {...hold}
          className={`popup-toast${message === REPORT_LIMIT ? " popup-toast--warning" : " popup-toast--report-neutral"}`}
        >
          {message}
        </div>
      )}
    </>
  );
  return { openReport, reportNode, canReport };
}
