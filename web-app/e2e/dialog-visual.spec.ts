// Six-width visual baseline for the OVERLAYS — the surfaces `visual-baseline.spec.ts`
// structurally cannot reach.
//
// WHY THIS FILE EXISTS (2026-08-19 spec audit)
//   `visual-baseline.spec.ts` discovers routes from `src/app/**/page.tsx` and captures
//   each one cold. Three surfaces the specs make width claims about are not routes and
//   were therefore never photographed at any width:
//
//     · `AC-CR-05`   — SubscribeModal / BuyCreditsModal / Credits detail dialogs.
//     · `AC-AUTH-07` — SignInModal. Worse than uncovered: the route baseline seeds
//       `muse_auth = "1"` precisely so the sign-in modal does NOT appear, so the one
//       spec that runs at six widths is the one guaranteed to skip it.
//
//   And `styles/designer/CreditsDialog.css` carries no `@media` rule at all, while its
//   two siblings do — so "renders correctly at 320" was a claim nothing had ever tested.
//
// TAGGED @visual, same as the route baseline: excluded from `npm run e2e`, run with
//   npm run e2e:visual          compare
//   npm run e2e:visual:update   re-record (a DECISION — see that file's header)
//
// Each dialog is opened through the UI rather than mounted directly: how you reach a
// surface is part of what can break, and a dialog rendered outside its real trigger
// tells you nothing about whether the trigger still opens it.
//
// ⚠️ THE `-linux` BASELINES DO NOT EXIST YET. These 18 were recorded on darwin, which
// is the only platform the recording machine had. `visual-baseline.spec.ts` commits
// BOTH platforms for every route; until someone runs
// `npx playwright test e2e/dialog-visual.spec.ts --grep @visual -u` on Linux, the first
// Linux run writes the missing files and reports them as failures. That is a known,
// one-time gap — not a regression — and it is written here rather than left for
// whoever hits it.
//
// The second half of this file needs no baseline and runs in the ordinary gate, so the
// 320px claim is protected on every platform today regardless.

import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [320, 375, 768, 1024, 1440, 1920] as const;

async function signedIn(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
}

/** Settle: the DP overlays fade + scale over 300ms and `toBeVisible()` is true at opacity 0. */
async function settled(page: Page) {
  await page.waitForTimeout(500);
}

const CASES: Array<{
  name: string;
  /** Leave `auth` false to capture the signed-OUT surface. */
  auth: boolean;
  open: (page: Page) => Promise<void>;
  selector: string;
}> = [
  {
    // AC-AUTH-07. The one the route baseline is built to avoid.
    name: "sign-in",
    auth: false,
    open: async (page) => {
      // Reached through `AuthGuard`, not the header button. The marketing navbar
      // collapses below 768px and its "Login" control does not exist at 320 — a
      // trigger that only exists at some widths cannot open a six-width baseline.
      // A guest hitting a guarded route gets this modal at every width.
      await page.goto("/history", { waitUntil: "networkidle" });
    },
    selector: '[role="dialog"]',
  },
  {
    // AC-CR-05. A free account opening Buy Credits gets SubscribeModal (CR-06).
    name: "subscribe",
    auth: true,
    open: async (page) => {
      await page.goto("/profile", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Upgrade" }).first().click();
    },
    selector: '[role="dialog"]',
  },
  {
    // AC-CR-05. The pack picker only exists for a subscriber, so subscribe first —
    // which is also the only honest way to reach it.
    name: "buy-credits",
    auth: true,
    open: async (page) => {
      await page.goto("/profile", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Upgrade" }).first().click();
      await page
        .locator(".upgrade-dialog__card--featured")
        .getByRole("button", { name: "Subscribe" })
        .click();
      await expect(page.getByRole("dialog", { name: "Upgrade Your Plan" })).toBeHidden();
      // Via the credits page, not the header pill: `.credit-balance` is the DESKTOP
      // header control and does not exist at 320. Its CTA reads "Buy More" once
      // subscribed (CR-06).
      //
      // CLIENT-SIDE navigation, never `page.goto`: `subscribed` lives in provider
      // state with no persistence, so a document load silently un-subscribes the
      // account and the CTA reverts to "Get Muse Pro". Same trap `G5-d#2` documents
      // for the balance.
      await page.locator(".account-page__stats").getByRole("button", { name: /Credits/ }).click();
      await page.waitForURL("**/profile/credits");
      await page.getByRole("button", { name: "Buy More" }).first().click();
    },
    selector: '[role="dialog"]',
  },
];

for (const c of CASES) {
  for (const width of WIDTHS) {
    test(`@visual dialog ${c.name} @ ${width}`, async ({ page }) => {
      test.slow();
      if (c.auth) await signedIn(page);
      await page.setViewportSize({ width, height: 900 });
      await c.open(page);

      const dialog = page.locator(c.selector).first();
      await expect(dialog).toBeVisible();
      await settled(page);

      // The whole viewport, not just the card: a dialog that overflows its own
      // overlay, or pushes the page sideways, is exactly the failure being guarded.
      await expect(page).toHaveScreenshot(`dialog-${c.name}-${width}.png`, {
        animations: "disabled",
        caret: "hide",
        mask: [page.locator("video"), page.locator("img")],
        maxDiffPixelRatio: 0.002,
      });
    });
  }
}

// Behaviour, not pixels — this half runs in the ORDINARY gate.
// A screenshot proves what a dialog looked like on one machine; it does not prove the
// page never scrolled sideways, and `maxDiffPixelRatio` is a share of page area, so on
// a wide viewport a small overflow can hide inside the tolerance (measured 2026-08-05).
for (const c of CASES) {
  test(`AC-CR-05 / AC-AUTH-07: the ${c.name} dialog fits 320px without scrolling the page`, async ({
    page,
  }) => {
    test.slow();
    if (c.auth) await signedIn(page);
    await page.setViewportSize({ width: 320, height: 568 });
    await c.open(page);

    const dialog = page.locator(c.selector).first();
    await expect(dialog).toBeVisible();
    await settled(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "the page must not scroll horizontally at 320px").toBeLessThanOrEqual(1);

    const box = (await dialog.boundingBox())!;
    expect(box.width, "the dialog must fit inside 320px").toBeLessThanOrEqual(320);
    expect(box.x, "the dialog must not start off-screen").toBeGreaterThanOrEqual(0);
  });
}
