// MV character photo — biometric data processing consent (product owner,
// 2026-08-19). Before the FIRST time the file picker is opened on /mv/room, the
// user has to read and accept the consent notice; after that the picker opens
// straight away for the rest of the session.
//
// WHY THIS LIVES OUTSIDE REACT, and why it is memory-only:
//
//   * Outside React, because "once per session" has to survive navigating away
//     from /mv/room and back. Component state resets on unmount, so the notice
//     would reappear on every visit; a module-level flag does not.
//   * Memory-only (no localStorage), decided by the product owner: a real
//     consent record belongs on the ACCOUNT, server-side — this prototype has
//     no backend to hold one, and a browser-local flag would be the wrong
//     shape for RD to inherit. Resetting on reload also keeps the flow
//     demoable. **RD: replace these two functions with a profile field.**
//
// Not a subscribable store on purpose — nothing renders from it. It is only
// read inside a click handler, so there is no state to keep in sync.
let granted = false;

export function hasFaceConsent(): boolean {
  return granted;
}

export function grantFaceConsent(): void {
  granted = true;
}

/** Test-only: restore the pre-consent state between cases. */
export function resetFaceConsent(): void {
  granted = false;
}
