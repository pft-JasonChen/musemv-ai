"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useDialogTransition, useEscapeToClose } from "@/components/ui/useDialogTransition";
import { PHONE_QUERY, useMediaQuery } from "@/lib/ssr";
import {
  formatNoticeDate,
  REMOVAL_REASON_COPY,
  removalDetail,
  type ContentRemoval,
} from "@/lib/report";

export interface NoticeSubject {
  title: string;
  thumb?: string;
  kind: "mv" | "song" | "storyboard";
  removal: ContentRemoval;
}

const KIND_LABEL: Record<NoticeSubject["kind"], string> = {
  mv: "Music Video",
  song: "Song",
  storyboard: "Storyboard",
};

function NoticeBody({ subject }: { subject: NoticeSubject }) {
  const { removal } = subject;
  const permanent = removal.kind === "permanent";
  return (
    <>
      <div className="content-notice__hero">
        <span className="content-notice__icon" aria-hidden="true">
          <DpIcon name="ic_alert" className="content-notice__icon-glyph" />
        </span>
        <div className="content-notice__message">
          <p className="content-notice__headline">
            {permanent ? "Permanently Removed" : "Content Removed"}
          </p>
          <p className="content-notice__text">
            {permanent
              ? "This content violated our content policy."
              : "A reviewer removed this content after a community report."}
          </p>
        </div>
      </div>

      <div className="content-notice__card">
        <span className="content-notice__art">
          {subject.thumb && <img src={subject.thumb} alt="" />}
        </span>
        <div className="content-notice__info">
          <p className="content-notice__title">{subject.title}</p>
          <p className="content-notice__meta">
            {KIND_LABEL[subject.kind]} · Published {formatNoticeDate(removal.publishedOn)}
          </p>
          <span className="content-notice__badge">
            <DpIcon name="ic_close" className="content-notice__badge-icon" />
            {permanent ? "Permanently Removed" : `Removed ${formatNoticeDate(removal.removedOn)}`}
          </span>
        </div>
      </div>

      <div className="content-notice__reason">
        <p className="content-notice__label">REMOVAL REASON</p>
        <div className="content-notice__chip">
          <DpIcon name="ic_shield_alert" className="content-notice__chip-icon" />
          {REMOVAL_REASON_COPY[removal.reason].label}
        </div>
        <p className="content-notice__text">{removalDetail(removal)}</p>
      </div>
    </>
  );
}

/**
 * Figma "Content Notice" (nodes 5319:54582 / 5319:55464 desktop, 5319:55196 /
 * 5319:55332 phone): what a reviewer took down and why. A dialog on desktop, a
 * full page on phones — the phone version is a full-screen overlay with its own
 * navbar rather than a route, so Back just dismisses it and History is exactly
 * where you left it.
 *
 * Pass `null` to close. The last subject is kept while the fade-out plays so the
 * card does not blank out mid-transition.
 */
export function ContentNotice({
  subject,
  onClose,
}: {
  subject: NoticeSubject | null;
  onClose: () => void;
}) {
  const open = subject !== null;
  const { mounted, visible } = useDialogTransition(open);
  const isPhone = useMediaQuery(PHONE_QUERY);
  useEscapeToClose(open, onClose);

  const [last, setLast] = useState<NoticeSubject | null>(subject);
  if (subject && subject !== last) setLast(subject);
  const shown = subject ?? last;

  if (!mounted || !shown || typeof document === "undefined") return null;

  if (isPhone) {
    return createPortal(
      <div
        className={`content-notice-page${visible ? " content-notice-page--visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Content Notice"
        inert={!open}
      >
        <header className="content-notice-page__bar">
          <button
            type="button"
            className="content-notice-page__back"
            onClick={onClose}
            aria-label="Back"
          >
            <DpIcon name="ic_arrow_left" className="content-notice-page__back-icon" />
          </button>
          <h2 className="content-notice-page__title">Content Notice</h2>
          <span className="content-notice-page__spacer" aria-hidden="true" />
        </header>
        <div className="content-notice-page__body">
          <NoticeBody subject={shown} />
        </div>
        <div className="content-notice-page__cta">
          <button type="button" className="content-notice__got-it" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className={`report-overlay${visible ? " report-overlay--visible" : ""}`}>
      <div className="report-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="report-dialog content-notice-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Content Notice"
        inert={!open}
      >
        <div className="report-dialog__header">
          <h2 className="report-dialog__title">Content Notice</h2>
          <button type="button" className="report-dialog__close" onClick={onClose} aria-label="Close">
            <DpIcon name="ic_close" className="report-dialog__close-icon" />
          </button>
        </div>
        <NoticeBody subject={shown} />
        <button
          type="button"
          className="report-dialog__cta report-dialog__cta--done content-notice__got-it"
          onClick={onClose}
        >
          Got It
        </button>
      </div>
    </div>,
    document.body,
  );
}
