"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogTransition, useEscapeToClose } from "@/components/ui/useDialogTransition";
import { MOCK_USER } from "@/lib/user";
import { TERMS_URL, PRIVACY_URL } from "@/lib/legal";

/**
 * DP's `LoginModal` (Figma "Popup/Dialog - Sign In", node 1724:43347 +
 * "Sign In — Successful", node 310:4720) — was still WA's original
 * pre-migration Tailwind modal until now (a hand-drawn "M" badge, inline SVG
 * glyphs, a generic `Modal` wrapper). Classes are from
 * `src/styles/designer/LoginModal.css`, verbatim from DP.
 *
 * ── WHAT'S ADAPTED, NOT PORTED VERBATIM ──────────────────────────────────
 * DP's footer line is plain, non-clickable text (it has no backend to link
 * to) and hardcodes "Scott" as the mock name. WA already had a REAL Terms/
 * Privacy destination (`AUTH-03`, the same links Settings uses) and a real
 * `MOCK_USER` first name — both kept, just laid out inside DP's exact markup
 * instead of dropped to match DP's lower bar.
 *
 * `useMountTransition` (DP) isn't ported — `useDialogTransition` is WA's
 * already-extracted equivalent (`DpDialog`'s second consumer), same
 * `{mounted, visible}` shape. `useEscapeToClose` added for parity with WA's
 * other dialogs; DP has no keyboard-close at all since it has no `Modal`.
 */
type Provider = "Apple" | "Google";

const SUCCESS_DURATION_MS = 1800;

interface Props {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void;
}

export function SignInModal({ open, onClose, onSignedIn }: Props) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const { mounted, visible } = useDialogTransition(open);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Block Escape/backdrop dismissal while the success stage plays, matching
  // the old `Modal`-based version.
  useEscapeToClose(open, provider ? () => {} : onClose);

  // Reset to the sign-in stage on every re-open. Adjusted during render (the
  // `useDialogTransition` pattern), not in an effect — a `setState` synchronous
  // in an effect body is exactly `react-hooks/set-state-in-effect`'s target.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setProvider(null);
  }

  useEffect(() => {
    if (!provider) return;
    timer.current = setTimeout(() => {
      setProvider(null);
      onSignedIn();
    }, SUCCESS_DURATION_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [provider, onSignedIn]);

  if (!mounted || typeof document === "undefined") return null;

  const firstName = MOCK_USER.name.split(" ")[0];

  return createPortal(
    <div
      className={`login-modal-overlay${provider ? "" : " login-modal-overlay--sign-in"}${visible ? " login-modal-overlay--visible" : ""}`}
    >
      <div className="login-modal-backdrop" onClick={provider ? undefined : onClose} aria-hidden="true" />
      {provider ? (
        <div className="login-modal login-modal--success" role="dialog" aria-modal="true" aria-label="Signed in successfully">
          <div className="login-modal__handle" aria-hidden="true" />

          <div className="login-modal__success-circle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icons/ui/ic_check.svg" alt="" className="login-modal__success-check" />
          </div>

          <div className="login-modal__message">
            <p className="login-modal__title">Signed in successfully!</p>
            <p className="login-modal__success-subtitle">
              Welcome back, {firstName} · via {provider}
            </p>
          </div>

          <div className="login-modal__processing">
            <p className="login-modal__processing-text">Entering your account...</p>
            <div className="login-modal__dots" aria-hidden="true">
              <span className="login-modal__dot" />
              <span className="login-modal__dot" />
              <span className="login-modal__dot" />
            </div>
          </div>
        </div>
      ) : (
        <div className="login-modal login-modal--sign-in" role="dialog" aria-modal="true" aria-label="Sign in to YouCam Muse">
          <div className="login-modal__handle" aria-hidden="true" />

          <div className="login-modal__content">
            <div className="login-modal__app-message">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/brand/ic_app_ycm.svg" alt="" className="login-modal__logo" />

              <div className="login-modal__message">
                <p className="login-modal__title">Sign in to YouCam Muse</p>
                <p className="login-modal__subtitle">
                  Save your creations, sync across devices,
                  <br />
                  and unlock your full creative history.
                </p>
              </div>
            </div>

            <div className="login-modal__cta">
              <div className="login-modal__buttons">
                <button type="button" className="login-modal__social" onClick={() => setProvider("Apple")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/icons/ui/ic_apple_logo.svg" alt="" className="login-modal__social-icon" />
                  Continue with Apple
                </button>
                <button type="button" className="login-modal__social" onClick={() => setProvider("Google")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/icons/ui/ic_google_logo.svg" alt="" className="login-modal__social-icon" />
                  Continue with Google
                </button>
              </div>

              <p className="login-modal__footer">
                {/* AUTH-03: wire to the same legal links as Settings (PROF-06) — DP's
                    footer line is plain text with nowhere to link to. */}
                By continuing, you agree to our{" "}
                <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
