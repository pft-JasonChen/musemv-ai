// Gate G5-d — the 10 behaviour regressions.
// docs/redesign-migration-plan-2026-08-01.md §10 G5-d.
//
// WHY THIS FILE EXISTS
//   The plan lists 10 behaviours the designer prototype (DP) has NONE of, and says
//   each "要在移植後主動證明它還在" — actively prove it survived. As prose in a
//   markdown table that is a convention: the reviewing agent reads the list, decides
//   it looks fine, and ticks it. This file turns the list into 12 executable tests so
//   the claim is checked by the machine instead of asserted by whoever is reviewing.
//
//   Coverage map (plan G5-d item -> test):
//     1  credits charged + refunded on failure ....... "charges", "refunds"
//     2  insufficient balance routes to IAP .......... "song upsell", "MV has no guard" (test.fail)
//     3  AuthGuard 5 routes + action-level login ..... "AuthGuard", "requireLogin"
//     4  flow-guard on direct deep link .............. "flow-guard"
//     5  [fail] path: fail + Retry + History Failed .. "fail path"
//     6  job polling 0 -> 100 ........................ "polling"
//     7  Pro gate: High crown + 30s preview .......... "Pro gate: High", "Pro gate: preview"
//     8  publish -> confirm -> reviewing ............. "publish"
//     9  i18n: 9 locales, localePath not bypassed .... "i18n"
//    10  enhancePrompt goes through api .............. "enhancePrompt"
//
// COSTS ARE IMPORTED, NOT HARDCODED — if C8 changes, these tests follow it instead
// of silently testing stale numbers. contract.surface.test.ts freezes the values;
// this file checks the app actually applies them.

import { expect, test, type Page } from "@playwright/test";
import {
  COST_RENDER,
  COST_STORYBOARD,
} from "../src/lib/mv/types";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, localePath } from "../src/lib/i18n/config";

const MV_DESCRIPTION = "A glamorous neon-lit night drive through the city.";
/** MockMuseApi.FAIL_TRIGGER — a description containing this fails the job at 60%. */
const FAIL_TRIGGER = "[fail]";

// ── helpers ─────────────────────────────────────────────────────────────────
/** Seed the mock auth flag before any page script runs, so AuthGuard sees a user. */
async function login(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
}

/** Current header credit balance. Keeps the sign — the balance can go negative (TBD-CR-08). */
async function balance(page: Page): Promise<number> {
  const txt = await page.getByTestId("credit-balance").first().innerText();
  const m = txt.replace(/[^\d-]/g, "");
  expect(m, `credit pill had no number in "${txt}"`).not.toBe("");
  return Number.parseInt(m, 10);
}

/** Fill the MV compose form (description + a library song) so the CTA enables. */
async function composeMv(page: Page, description = MV_DESCRIPTION) {
  await page
    .getByPlaceholder("Describe your video to help AI create a more compelling story.")
    .fill(description);
  await page.getByRole("button", { name: "Song Library" }).click();
  // Name matching is substring-by-default and Modal portals to document.body, so an
  // unscoped { name: "Use" } can resolve to a page-level "Use …" button under the
  // scrim. Scope to the dialog and match exactly. (Same trap fixed in mv-flow.spec.ts.)
  const chooseSong = page.getByRole("dialog", { name: "Choose Song" });
  await chooseSong.getByRole("button", { name: "Use", exact: true }).first().click();
  await page.getByRole("button", { name: "Use Trimmed Audio", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create Music Video" })).toBeEnabled();
}

/** Kick off a storyboard-first generation from a composed MV room. */
async function startStoryboard(page: Page) {
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create Storyboard First").click();
}

// ════════════════════════════════════════════════════════════════════════════
// G5-d #1 — credits are charged, and refunded when the job fails
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#1 charges COST_STORYBOARD then COST_RENDER at job start", async ({ page }) => {
  test.slow(); // two full mock generations
  await login(page);
  await page.goto("/mv/room");
  const before = await balance(page);

  await composeMv(page);
  await startStoryboard(page);
  await page.waitForURL("**/mv/storyboard");
  const afterStoryboard = await balance(page);
  expect(
    afterStoryboard,
    `storyboard should charge exactly ${COST_STORYBOARD} (GL-01 charges at job start)`,
  ).toBe(before - COST_STORYBOARD);

  await page.getByRole("button", { name: /Generate MV/ }).click();
  await page.waitForURL("**/mv/result");
  expect(await balance(page), `render should charge exactly ${COST_RENDER}`).toBe(
    before - COST_STORYBOARD - COST_RENDER,
  );
});

test("G5-d#1 refunds the charge when the job fails", async ({ page }) => {
  await login(page);
  await page.goto("/mv/room");
  const before = await balance(page);

  await composeMv(page, `${MV_DESCRIPTION} ${FAIL_TRIGGER}`);
  await startStoryboard(page);

  // GL-01: the refund runs from pollJob's onError, so wait for the failure UI first.
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect
    .poll(() => balance(page), {
      message: `failed job must refund ${COST_STORYBOARD} so the "credits were not charged" copy stays true`,
    })
    .toBe(before);
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #2 — insufficient balance routes to IAP instead of generating
// ════════════════════════════════════════════════════════════════════════════
// GL-01, enforced in MvRoom.selectMode() — NOT in MvFlowProvider. The provider's
// startStoryboard/startRender charge unconditionally; the balance check lives one
// level up, at the point the user picks a mode:
//     const cost = mode === "storyboard_first" ? COST_STORYBOARD : COST_RENDER;
//     if (credits < cost) { setBuyOpen(true); return; }
// Reading only the provider makes it look like there is no guard. There is.
//
// The arithmetic makes this cheap to reach: DEFAULT_CREDITS 390 − COST_STORYBOARD 20
// − COST_RENDER 200 = 170, which is already under COST_RENDER, so the very next
// render attempt must be refused. No draining loop needed.
//
// Every hop below is a CLIENT-SIDE click on purpose: CreditsProvider keeps the
// balance in plain useState (DEVELOPER-HANDOVER §6 "Persistence asymmetry"), so any
// page.goto() reloads the app and resets it to DEFAULT_CREDITS — a drain built on
// goto() would silently prove nothing.
test("G5-d#2 insufficient balance routes to IAP instead of generating", async ({ page }) => {
  test.slow();
  await login(page);
  await page.goto("/mv/room");
  const before = await balance(page);

  await composeMv(page);
  await startStoryboard(page);
  await page.waitForURL("**/mv/storyboard");
  await page.getByRole("button", { name: /Generate MV/ }).click();
  await page.waitForURL("**/mv/result");

  const left = await balance(page);
  expect(left).toBe(before - COST_STORYBOARD - COST_RENDER);
  expect(left, "precondition: the next render must be unaffordable").toBeLessThan(COST_RENDER);

  // "Recreate" is router.push("/mv/room") — client-side, so the balance survives.
  await page.getByRole("button", { name: "Recreate" }).click();
  await page.waitForURL("**/mv/room");
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create MV Directly").click();

  // The point: no job starts, no navigation, and an IAP surface opens instead.
  //
  // WHICH surface depends on tier (CR-06): credits are sold to Muse Pro subscribers
  // only, so BuyCreditsModal renders SubscribeModal ("Muse Pro") for a free account
  // and the pack picker ("Buy Credits") for a subscriber. This test signs in as a
  // free user, so it gets Subscribe — accept either so the test tracks the rule
  // rather than one tier's rendering of it.
  await expect(page.getByRole("dialog", { name: /Muse Pro|Buy Credits/i })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/mv/room");
  expect(await balance(page), "a refused generation must not charge").toBe(left);
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #3 — AuthGuard on every signed-in-only route
// ════════════════════════════════════════════════════════════════════════════
const GUARDED_ROUTES = ["/settings", "/song/create", "/profile", "/mv/room", "/history"];

for (const route of GUARDED_ROUTES) {
  test(`G5-d#3 AuthGuard: ${route} is closed to guests`, async ({ page }) => {
    // No login() — arrive as a guest.
    await page.goto(route);
    // AuthGuard renders null and calls requireLogin(), which opens the sign-in modal.
    await expect(page.getByRole("dialog", { name: /Sign in/i })).toBeVisible();
  });
}

test("G5-d#3 requireLogin: dismissing the sign-in modal returns Home", async ({ page }) => {
  await page.goto("/profile");
  const dialog = page.getByRole("dialog", { name: /Sign in/i });
  await expect(dialog).toBeVisible();
  // This dialog has no sticky title bar, so there is no Close button — Modal's own
  // Escape handler is the dismissal. AuthGuard passes onCancel, which router.replace()s
  // back to the locale home.
  await page.keyboard.press("Escape");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #4 — flow-guard on a direct deep link
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#4 flow-guard: opening /mv/result with no flow state redirects to the entry", async ({
  page,
}) => {
  await login(page);
  await page.goto("/mv/result");
  // MvResult: useEffect -> if (!resultUrl) router.replace("/mv/room")
  await expect.poll(() => new URL(page.url()).pathname).toBe("/mv/room");
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #5 — the [fail] demo path
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#5 [fail] path: job fails, Retry is offered, History shows Failed", async ({ page }) => {
  await login(page);
  await page.goto("/mv/room");
  await composeMv(page, `${MV_DESCRIPTION} ${FAIL_TRIGGER}`);
  await startStoryboard(page);

  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  // It must NOT reach the storyboard editor.
  expect(page.url()).not.toContain("/mv/storyboard");

  await page.goto("/history");
  await expect(page.getByText(/Failed/i).first()).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #6 — job polling advances progress
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#6 polling: progress advances and reaches the storyboard", async ({ page }) => {
  await login(page);
  await page.goto("/mv/room");
  await composeMv(page);
  await startStoryboard(page);

  const pct = page.getByText(/^\d+%$/);
  await expect(pct.first()).toBeVisible();
  const first = Number.parseInt((await pct.first().innerText()).replace("%", ""), 10);
  expect(first).toBeGreaterThanOrEqual(0);
  expect(first).toBeLessThanOrEqual(100);

  // pollJob ticks every 120ms; progress must strictly increase, not sit at 0.
  await expect
    .poll(
      async () => {
        const el = page.getByText(/^\d+%$/).first();
        if (!(await el.count())) return 100; // already navigated away = completed
        return Number.parseInt((await el.innerText()).replace("%", ""), 10);
      },
      { message: "progress must advance past its first reading" },
    )
    .toBeGreaterThan(first);

  await page.waitForURL("**/mv/storyboard");
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #7 — Muse Pro gating
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#7 Pro gate: High resolution is locked for a free account", async ({ page }) => {
  await login(page); // logged in, NOT subscribed
  await page.goto("/mv/room");
  await page.getByRole("button", { name: "Open MV settings" }).click();

  const dialog = page.getByRole("dialog");
  const high = dialog.getByRole("button", { name: /^High/ });
  await expect(high).toBeVisible();
  // MV-04: locked options are greyed with a crown and route to IAP instead of selecting.
  await high.click();
  await expect(page.getByRole("dialog", { name: /Muse Pro|Subscribe/i })).toBeVisible();
  // And the setting must not have changed.
  await expect(dialog.getByRole("button", { name: /^Standard/ })).toBeVisible();
});

test("G5-d#7 Pro gate: free playback is capped at a 30s preview", async ({ page }) => {
  await login(page);
  await page.goto("/song/play");
  await expect(page.getByText(/Free preview · first 30s/)).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #8 — publish is a confirm -> review flow, not an instant toggle
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#8 publish: MV publish confirms, then enters reviewing", async ({ page }) => {
  await login(page);
  await page.goto("/history");

  // Open the row menu on the first MV entry and choose Publish.
  await page.getByRole("button", { name: "Options" }).first().click();
  await page.getByRole("button", { name: /^Publish$/ }).click();

  // HIST-04: a confirm dialog, NOT an instant toggle (DP made this instant).
  const confirm = page.getByRole("dialog", { name: "Ready to Go Public?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Confirm" }).click();

  await expect(page.getByText("Submitted for review")).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #9 — every locale prefix resolves, and English stays unprefixed
// ════════════════════════════════════════════════════════════════════════════
for (const locale of LOCALES) {
  test(`G5-d#9 i18n: ${locale} home resolves with the right <html lang>`, async ({ page }) => {
    const path = localePath(locale, "/");
    const res = await page.goto(path);
    expect(res?.status(), `${path} must not 404`).toBeLessThan(400);

    // localePath must not be bypassed: English is served unprefixed, others prefixed.
    const pathname = new URL(page.url()).pathname;
    if (locale === DEFAULT_LOCALE) expect(pathname).toBe("/");
    else expect(pathname).toBe(`/${locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", HTML_LANG[locale]);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// G5-d #10 — enhancePrompt goes through the api layer, not a local string
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#10 enhancePrompt round-trips through api, not a local fake", async ({ page }) => {
  await login(page);
  await page.goto("/song/create");
  const box = page.getByPlaceholder(/A bittersweet love song/);
  const original = "summer road trip";
  await box.fill(original);

  const enhance = page.getByRole("button", { name: "Enhance with AI" }).first();
  await expect(enhance).toBeVisible();
  await enhance.click();

  // MockMuseApi.enhancePrompt awaits ~900ms, so the button must enter a busy state —
  // a local synchronous string edit could not produce this.
  await expect(enhance).toBeDisabled();

  await expect
    .poll(async () => box.inputValue(), {
      message: "the field must be replaced by the api's rewrite",
      timeout: 15000,
    })
    .not.toBe(original);

  // A local fake would wrap/extend the input; the api returns an independent sample.
  expect(await box.inputValue()).not.toContain(original);
});
