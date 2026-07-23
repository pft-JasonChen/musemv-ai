"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { MOCK_USER } from "@/lib/user";

type Provider = "Apple" | "Google";

interface Props {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void;
}

function AppleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17.05 12.536c-.028-2.87 2.346-4.254 2.45-4.318-1.335-1.953-3.41-2.22-4.147-2.248-1.763-.178-3.44 1.04-4.333 1.04-.893 0-2.27-1.014-3.733-.987-1.916.028-3.69 1.11-4.678 2.814-1.99 3.454-.512 8.577 1.434 11.382.953 1.374 2.09 2.916 3.58 2.858 1.44-.058 1.983-.927 3.724-.927 1.74 0 2.23.927 3.74.9 1.55-.028 2.527-1.402 3.47-2.782 1.097-1.594 1.548-3.14 1.576-3.22-.035-.014-3.017-1.157-3.047-4.597-.003-.005-.034-.005-.037-.005zM14.236 4.16c.79-.957 1.323-2.287 1.178-3.61-1.138.047-2.517.757-3.336 1.714-.732.847-1.375 2.202-1.202 3.503 1.27.098 2.568-.644 3.36-1.607z"
        fill="#000"
      />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function SignInModal({ open, onClose, onSignedIn }: Props) {
  const [signingIn, setSigningIn] = useState<Provider | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timer if the modal unmounts mid-animation.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function pick(provider: Provider) {
    setSigningIn(provider);
    timer.current = setTimeout(() => {
      // Reset before the parent closes so a later re-open starts clean.
      setSigningIn(null);
      onSignedIn();
    }, 1500);
  }

  const firstName = MOCK_USER.name.split(" ")[0];

  return (
    // While the success animation plays, block dismissal by swallowing onClose.
    <Modal open={open} onClose={signingIn ? () => {} : onClose} maxWidth={400}>
      {signingIn ? (
        <div className="flex flex-col items-center gap-2.5 px-2 py-8 text-center">
          <div
            className="mb-1 grid h-16 w-16 place-items-center rounded-full text-white"
            style={{ background: "var(--mv-grad)", boxShadow: "0 8px 24px rgba(255,78,80,.3)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-[20px] font-extrabold tracking-tight">Signed in successfully!</div>
          <div className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
            Welcome back, {firstName} · via {signingIn}
          </div>
          <div className="mt-1 flex gap-1.5">
            {[0.9, 0.55, 0.25].map((o, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--text-3)", opacity: o }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-1 pb-2">
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-2xl text-[22px] font-extrabold text-white"
              style={{ background: "var(--mv-grad)", boxShadow: "0 4px 20px rgba(168,85,247,.35)" }}
            >
              M
            </div>
            <div className="mb-1.5 text-[20px] font-extrabold tracking-tight">Sign in to YouCam Muse</div>
            <div className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--text-2)" }}>
              Save your creations, sync across devices,
              <br />
              and unlock your full creative history.
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => pick("Apple")}
              className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl bg-white transition-opacity hover:opacity-90 active:opacity-80"
            >
              <AppleGlyph />
              <span className="text-[15px] font-bold text-black">Continue with Apple</span>
            </button>
            <button
              onClick={() => pick("Google")}
              className="flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl bg-white transition-opacity hover:opacity-90 active:opacity-80"
            >
              <GoogleGlyph />
              <span className="text-[15px] font-bold text-black">Continue with Google</span>
            </button>
            <p className="mt-1 text-center text-[11px] font-medium leading-relaxed" style={{ color: "var(--text-3)" }}>
              By continuing, you agree to our{" "}
              <span style={{ color: "var(--text-2)" }}>Terms of Service</span> and{" "}
              <span style={{ color: "var(--text-2)" }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
