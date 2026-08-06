"use client";

import { useEffect, useRef } from "react";

/**
 * "Has the user navigated inside this app since the page loaded?"
 *
 * WHY THIS EXISTS (plan Q6). A detail screen's Back goes `router.back()`, with a
 * fallback to the section entry when there is nowhere to go back TO — a shared
 * link, a deep link, a new tab. Getting that condition right needs a signal for
 * "we have our own history", and the two obvious ones are both wrong:
 *
 *  · `window.history.length` counts entries that are not ours. A tab opened
 *    straight onto a detail URL still reports length 2, because the entry it
 *    replaced (the new-tab page, the previous site, `about:blank` under
 *    Playwright) is in the count. MEASURED, not theorised: the first version of
 *    the Q6 test failed with the page sitting on `about:blank` after Back —
 *    `back()` had fired and left the app entirely, which is precisely the
 *    failure the fallback is supposed to prevent.
 *
 *  · Per-tab web storage would answer it, and is banned by G1-b — C5 pins auth
 *    to localStorage and a second storage mechanism blurs that boundary.
 *
 * So: count client-side route changes in a module-level variable. It survives
 * in-app navigation (the module is not re-evaluated) and resets on a full page
 * load — which is exactly the question being asked. No storage, no globals on
 * `window`, nothing to read during render, so it cannot become an R-2 hazard.
 */
let inAppNavigations = 0;

/** True once the user has made at least one client-side navigation this load. */
export function hasInAppHistory(): boolean {
  return inAppNavigations > 0;
}

/**
 * Counts route changes. Mounted once, in `AppShell`. The first run is the
 * initial render rather than a navigation, so it is skipped — otherwise every
 * cold load would claim to have history and the fallback would never fire.
 */
export function useTrackInAppNavigation(pathname: string): void {
  const seenFirstRender = useRef(false);

  useEffect(() => {
    if (!seenFirstRender.current) {
      seenFirstRender.current = true;
      return;
    }
    inAppNavigations++;
  }, [pathname]);
}

/** Test-only reset; no production caller. */
export function __resetInAppHistory(): void {
  inAppNavigations = 0;
}
