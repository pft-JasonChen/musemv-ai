// "Is this sign-in a NEW sign-up?" — the mock's stand-in for the backend's
// sign-up-gift answer (spec 07-credits-iap CR-P4).
//
// The prototype has no sign-up/sign-in distinction, so a sign-in counts as a
// new sign-up when either:
//   - it is the FIRST sign-in on this browser (`muse_signup_gift_seen` unset), or
//   - the `?demo=1` panel's `newSignup` flag is on — every sign-in then replays
//     the new-account flow, so QA can test it repeatedly without DevTools.
// `SignInModal` reads this to pick its "Welcome" vs "Welcome back" copy, and
// `AuthProvider` reads it (then marks it seen) to schedule the gift toast.

import { demoStore } from "@/lib/demoStore";

const SEEN_KEY = "muse_signup_gift_seen";

export function isNewSignup(): boolean {
  if (demoStore.getSnapshot().flags.newSignup) return true;
  try {
    return localStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    return false;
  }
}

export function markSignupGiftSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}
