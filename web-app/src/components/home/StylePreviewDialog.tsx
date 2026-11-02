"use client";

import { useState } from "react";
import { DpDialog } from "@/components/ui/DpDialog";
import type { HeroCard } from "./HeroBannerSectionV3";

/**
 * Preview of a Music Video inspiration card (product owner, 2026-11-02):
 * clicking the card (or its ▶) opens this instead of applying the style at
 * once — the full video plays with sound, so the user can judge it the way
 * the Trending MV row lets them, then "Use this Style" loads it into the
 * composer. It is the same file `/watch` plays, so there is no separate
 * "watch the full video" link. A bottom sheet on phones.
 *
 * The click that opens it is a user gesture, so the browser lets the video
 * start unmuted. `card` is kept through the closing fade (`shown`), so the
 * dialog does not empty out while it animates away. Styles: `.style-preview`
 * in agent.css.
 */
export function StylePreviewDialog({
  card,
  onClose,
  onUse,
}: {
  card: HeroCard | null;
  onClose: () => void;
  onUse: (card: HeroCard) => void;
}) {
  const [shown, setShown] = useState<HeroCard | null>(card);
  if (card && card !== shown) setShown(card);

  return (
    <DpDialog
      open={card !== null}
      onClose={onClose}
      block="style-preview"
      label={shown ? `${shown.title} preview` : "Style preview"}
      title={shown?.title}
    >
      <div className="style-preview__handle" aria-hidden="true" />
      {shown && (
        <>
          {shown.video ? (
            <video
              key={shown.id}
              className="style-preview__video"
              src={shown.video}
              poster={shown.thumbnail}
              autoPlay
              loop
              controls
              // No "⋮" menu (product owner, 2026-11-02): with download,
              // speed, picture-in-picture and casting all off, the browser
              // has nothing to put in it and leaves it out.
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              disableRemotePlayback
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="style-preview__video" src={shown.thumbnail} alt="" />
          )}
          <div className="style-preview__actions">
            <button
              type="button"
              className="button button--large button--primary style-preview__use"
              onClick={() => onUse(shown)}
            >
              <span className="button__label">Use this Style</span>
            </button>
          </div>
        </>
      )}
    </DpDialog>
  );
}
