"use client";

// Route-level auth gate for signed-in-only pages (Settings, Profile, Credits, History).
//
// Two different things reach this guard logged-out, and they must NOT behave the
// same way:
//
//   · ARRIVED AS A GUEST — someone opens /history without an account. Prompt:
//     open the sign-in modal, and dismissing it returns Home.
//   · SIGNED OUT WHILE HERE — Sign Out lives on /settings, which is itself
//     guarded. Flipping `loggedIn` to false trips this guard on the very page
//     the user just used, so it re-prompted them to sign in the instant they
//     asked to leave. Go Home quietly instead; do not open the modal.
//
// `YMW260916P0020` is the second case. The product owner ruled on 2026-09-17
// that there is NO automatic sign-in popup after sign-out, and the prototype at
// musemv-ai.vercel.app was still doing it — reproduced 2026-09-22 on /settings:
// after Sign Out the URL was home AND `.login-modal--sign-in` was mounted.
// `!loggedIn` alone cannot tell the two apart, so the guard remembers whether it
// ever saw this visitor signed in.
//
// Guarded by `e2e/behaviour-regressions.spec.ts` → `YMW260916P0020`, which
// asserts BOTH halves — no modal after sign-out, and the guest prompt still
// works — because a fix that just stopped opening the modal would silently
// delete the guest gate.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loggedIn, hydrated, requireLogin } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();
  /** Whether this mount has ever observed a signed-in user. */
  const wasSignedIn = useRef(false);

  useEffect(() => {
    // `hydrated` is false on the first pass for everyone, so deciding anything
    // here would treat a signed-in user as a guest.
    if (!hydrated) return;

    if (loggedIn) {
      wasSignedIn.current = true;
      return;
    }

    if (wasSignedIn.current) {
      // Signed out on this page. Leave, but do not ask them to sign back in.
      wasSignedIn.current = false;
      router.replace(localePath(locale, "/"));
      return;
    }

    requireLogin(undefined, () => router.replace(localePath(locale, "/")));
  }, [hydrated, loggedIn, requireLogin, router, locale]);

  if (!hydrated || !loggedIn) return null;
  return <>{children}</>;
}
