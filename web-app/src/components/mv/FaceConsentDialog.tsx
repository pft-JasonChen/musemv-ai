"use client";

import { useId, useState } from "react";
import { DpDialog } from "@/components/ui/DpDialog";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal";

/**
 * Biometric data processing consent — shown the first time the user opens the
 * file picker for a CHARACTER PHOTO on `/mv/room` (product owner, 2026-08-19).
 * Accepting it opens the picker; dismissing it opens nothing.
 *
 * Copy and layout follow YouCam Online Editor's live "Allow Data Processing"
 * popup, with four product-owner-approved adjustments for YCM:
 *
 *   1. "your uploaded photo/video" -> "your uploaded photo". The character
 *      input is `accept="image/*"`; promising to cover video we never take is
 *      a wider consent than we need.
 *   2. "AI editing and generative AI experience" / "the AI editing service" ->
 *      "AI music video generation experience" / "the AI music video service".
 *   3. The Online Editor's "Any outcome of the Service will be stored in
 *      Perfect's server up to 365 days" sentence is DROPPED: YCM keeps
 *      creations indefinitely (they are the user's library and their community
 *      posts), so a 365-day retention promise would be false here.
 *   4. The third-party sentence carries a proviso. As written upstream it says
 *      neither the Biometric Data NOR THE OUTCOME leaves Perfect — which
 *      `PublishConfirmDialog` then contradicts in as many words ("visible to
 *      the community and may be shared on our social channels"). The proviso
 *      carves publishing out instead of quietly shipping two documents that
 *      disagree.
 *
 * Sample Photos deliberately do NOT open this: those faces are bundled assets,
 * not the user's, so there is no Biometric Data of theirs to consent over and
 * the sentence "your action of checking this box" would have nothing to attach
 * to. Only the real upload path is gated.
 *
 * Hardcoded English, matching every screen outside nav/Profile (AGENTS.md
 * i18n). Legal links reuse `lib/legal.ts`, the same destinations Settings and
 * the sign-in modal already point at.
 */
export function FaceConsentDialog({
  open,
  onClose,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const checkboxId = useId();

  // Re-opening after a dismissal must start from unchecked — the box IS the
  // consent act, so a remembered tick would be a consent nobody gave. The
  // dialog stays mounted through its fade-out (DpDialog/`useDialogTransition`),
  // so unmounting cannot do this reset for us the way it does for
  // conditionally-mounted dialogs like `FeedbackDialog`.
  //
  // React's "adjust state when a prop changes" pattern rather than an effect:
  // an effect is both a lint error here (`react-hooks/set-state-in-effect`)
  // and a worse fit — resetting on CLOSE would untick the box on screen during
  // the 300ms fade-out. This resets on OPEN, after the card is gone.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setChecked(false);
  }

  return (
    <DpDialog
      open={open}
      onClose={onClose}
      block="consent-dialog"
      label="Allow data processing"
      title="Allow Data Processing for Better Experience"
    >
      <div className="consent-dialog__body">
        <p className="consent-dialog__para">
          We may process, collect, capture, store, use, receive or otherwise obtain a scan of your
          face, hair or any data or information based on your uploaded photo, which may include your
          face geometry (&ldquo;Biometric Data&rdquo;) for the purpose of providing you with a
          personalized AI music video generation experience (&ldquo;Service&rdquo;).
        </p>
        <p className="consent-dialog__para">
          For certain features that require cloud computing, your Biometric Data might be processed
          via Perfect&rsquo;s server, and will be deleted from Perfect&rsquo;s server within seven
          (7) days after you finish the Service. Neither your Biometric Data nor outcome of the
          Service would be transmitted to any third parties during or after completion of the
          Service, unless you choose to publish your creation to the community.
        </p>
        <label className="consent-dialog__consent" htmlFor={checkboxId}>
          <input
            id={checkboxId}
            type="checkbox"
            className="consent-dialog__checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>
            In order to provide the AI music video service, you acknowledge that your action of
            checking this box constitutes an express written consent authorizing Perfect to process
            your Biometric Data in accordance with these terms and our{" "}
            <a
              className="consent-dialog__link"
              href={PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              className="consent-dialog__link"
              href={TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
            .
          </span>
        </label>
      </div>
      <button
        type="button"
        className="button button--large button--primary consent-dialog__continue"
        // Product owner, 2026-08-19: the box is mandatory. The copy above calls
        // ticking it "an express written consent" — if CONTINUE worked without
        // it, that sentence would describe something that never happened.
        disabled={!checked}
        onClick={onContinue}
      >
        <span className="button__label">CONTINUE</span>
      </button>
    </DpDialog>
  );
}
