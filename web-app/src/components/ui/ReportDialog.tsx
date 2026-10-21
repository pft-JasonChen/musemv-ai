"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useToast } from "@/components/ui/Toast";
import { useDialogTransition, useEscapeToClose } from "@/components/ui/useDialogTransition";
import { PHONE_QUERY, useMediaQuery } from "@/lib/ssr";
import {
  hasReported,
  markReported,
  REPORT_REASONS,
  type ReportKind,
  type ReportReason,
} from "@/lib/report";

const TITLE: Record<ReportKind, string> = {
  song: "Report Song",
  mv: "Report Music Video",
};

export const ALREADY_REPORTED = "You already reported this content.";

/**
 * Report flow for community content — Figma "Report Song" (nodes 5319:56800 /
 * 5319:56991): a centred dialog on desktop, a bottom sheet on phones, the same
 * two steps in both. Pick one of six reasons → Submit Report → "Thank you for
 * keeping Muse safe". Submit stays disabled until a reason is picked.
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
  onSubmitted: (reason: ReportReason) => void;
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
  onSubmitted: (reason: ReportReason) => void;
}) {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!reason) return;
    onSubmitted(reason);
    setSubmitted(true);
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
            </div>
            <button
              type="button"
              className="report-dialog__cta report-dialog__cta--submit"
              onClick={submit}
              disabled={!reason}
            >
              Submit Report
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
  const { show, toast } = useToast();

  function openReport() {
    if (hasReported(kind, contentId)) show(ALREADY_REPORTED);
    else setOpen(true);
  }

  const reportNode = (
    <>
      <ReportDialog
        open={open}
        kind={kind}
        onClose={() => setOpen(false)}
        onSubmitted={() => markReported(kind, contentId)}
      />
      {toast}
    </>
  );

  return { openReport, reportNode };
}
