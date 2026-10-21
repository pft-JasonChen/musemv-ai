"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { MobileScenePreview } from "@/components/mv/MobileScenePreview";
import { useDialogTransition, useEscapeToClose } from "@/components/ui/useDialogTransition";
import { PHONE_QUERY, useMediaQuery } from "@/lib/ssr";
import {
  SAMPLE_SUBTITLE,
  SUBTITLE_STYLES,
  TITLE_EFFECTS,
  type SubtitleStyleId,
  type TitleEffectId,
} from "@/lib/mv/textEffects";

type Tab = "title" | "subtitle";

export interface TextEffectSelection {
  titleEffect: TitleEffectId;
  subtitleStyle: SubtitleStyleId;
}

/**
 * Figma "Edit Title & Subtitle" (node 5356:174566): a live preview of the MV with
 * its title and subtitle drawn over it, a Title / Subtitle switch, and a strip
 * of looks to pick from. Desktop is a centred dialog with Cancel / Save; phones
 * are a bottom sheet whose ✕ cancels and ✓ saves.
 *
 * The draft lives in the body, which unmounts on close, so Cancel (or Escape, or
 * the backdrop) discards it and the next open starts from the saved choice.
 */
export function EditTitleSubtitleDialog({
  open,
  onClose,
  onSave,
  selection,
  titleText,
  videoSrc,
  poster,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (next: TextEffectSelection) => void;
  selection: TextEffectSelection;
  titleText: string;
  videoSrc: string;
  poster: string;
}) {
  const { mounted, visible } = useDialogTransition(open);
  useEscapeToClose(open, onClose);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <DialogBody
      open={open}
      visible={visible}
      onClose={onClose}
      onSave={onSave}
      selection={selection}
      titleText={titleText}
      videoSrc={videoSrc}
      poster={poster}
    />,
    document.body,
  );
}

function DialogBody({
  open,
  visible,
  onClose,
  onSave,
  selection,
  titleText,
  videoSrc,
  poster,
}: {
  open: boolean;
  visible: boolean;
  onClose: () => void;
  onSave: (next: TextEffectSelection) => void;
  selection: TextEffectSelection;
  titleText: string;
  videoSrc: string;
  poster: string;
}) {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [tab, setTab] = useState<Tab>("title");
  const [draft, setDraft] = useState(selection);

  const options = tab === "title" ? TITLE_EFFECTS : SUBTITLE_STYLES;
  const current = tab === "title" ? draft.titleEffect : draft.subtitleStyle;

  // Keep the picked look fully in view: the strip scrolls sideways (always on a
  // phone, and for Subtitle's ten on desktop), so a saved choice near the end —
  // or one picked on the edge — could sit clipped. Runs on open, on a tab change
  // and on every pick. Measured against the strip's own box and scrolled by hand:
  // `scrollIntoView` would also move the page behind the dialog.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = stripRef.current;
    const picked = strip?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!strip || !picked) return;
    const margin = 12; // the selected ring + a sliver of the neighbour
    const box = strip.getBoundingClientRect();
    const rect = picked.getBoundingClientRect();
    if (rect.left - margin < box.left) {
      strip.scrollBy({ left: rect.left - margin - box.left, behavior: "smooth" });
    } else if (rect.right + margin > box.right) {
      strip.scrollBy({ left: rect.right + margin - box.right, behavior: "smooth" });
    }
  }, [tab, current]);

  const closeButton = (
    <button
      type="button"
      className={isPhone ? "effects-dialog__icon-btn" : "report-dialog__close"}
      onClick={onClose}
      aria-label={isPhone ? "Cancel" : "Close"}
    >
      <DpIcon name="ic_close" className="report-dialog__close-icon" />
    </button>
  );

  return (
    <div className={`report-overlay${visible ? " report-overlay--visible" : ""}`}>
      <div className="report-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className={`report-dialog effects-dialog${isPhone ? " report-dialog--sheet" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Edit Title & Subtitle"
        inert={!open}
      >
        {isPhone && <span className="report-dialog__handle" aria-hidden="true" />}

        <div className="report-dialog__header">
          {isPhone && closeButton}
          <h2 className="report-dialog__title">Edit Title &amp; Subtitle</h2>
          {isPhone ? (
            <button
              type="button"
              className="effects-dialog__icon-btn effects-dialog__icon-btn--done"
              onClick={() => onSave(draft)}
              aria-label="Save"
            >
              <DpIcon name="ic_check" className="report-dialog__close-icon" />
            </button>
          ) : (
            closeButton
          )}
        </div>

        <MobileScenePreview
          src={videoSrc}
          poster={poster}
          overlay={
            <>
              <p className={`fx-title fx-title--${draft.titleEffect}`}>
                {titleText || "Your Title"}
              </p>
              <p className={`fx-sub fx-sub--${draft.subtitleStyle}`}>{SAMPLE_SUBTITLE}</p>
            </>
          }
        />

        <div className="effects-dialog__tabs" role="tablist" aria-label="Edit">
          {(["title", "subtitle"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`effects-dialog__tab${tab === t ? " effects-dialog__tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "title" ? "Title" : "Subtitle"}
            </button>
          ))}
        </div>

        <div
          ref={stripRef}
          className="effects-dialog__strip"
          role="radiogroup"
          aria-label={tab === "title" ? "Title effect" : "Subtitle style"}
        >
          <div className="effects-dialog__strip-inner">
            {options.map((o) => {
              const selected = o.id === current;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={o.label}
                  className={`effects-dialog__thumb${selected ? " effects-dialog__thumb--selected" : ""}`}
                  onClick={() =>
                    setDraft((d) =>
                      tab === "title"
                        ? { ...d, titleEffect: o.id as TitleEffectId }
                        : { ...d, subtitleStyle: o.id as SubtitleStyleId },
                    )
                  }
                >
                  <img src={o.thumb} alt="" />
                  {selected && (
                    <span className="effects-dialog__check" aria-hidden="true">
                      <DpIcon name="ic_check" className="effects-dialog__check-icon" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {!isPhone && (
          <div className="effects-dialog__actions">
            <button type="button" className="effects-dialog__btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="effects-dialog__btn effects-dialog__btn--primary"
              onClick={() => onSave(draft)}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
