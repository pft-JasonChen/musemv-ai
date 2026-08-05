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
//     7  Pro gate: High crown ........................ "Pro gate: High"
//        …its 30s-preview half INVERTED by slice 3b ... "S3 / G5-d#7 inverted"
//     8  publish -> confirm -> reviewing ............. "publish"
//     9  i18n: 9 locales, localePath not bypassed .... "i18n"
//    10  enhancePrompt goes through api .............. "enhancePrompt"
//
// COSTS ARE IMPORTED, NOT HARDCODED — if C8 changes, these tests follow it instead
// of silently testing stale numbers. contract.surface.test.ts freezes the values;
// this file checks the app actually applies them.

import { expect, test, type Page } from "@playwright/test";
import { COST_RENDER, COST_STORYBOARD } from "../src/lib/mv/types";
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

// ── G5-d #7, PREVIEW HALF: INVERTED BY SLICE 3b (plan §5) ───────────────────
//
// This test used to assert the 30s cap EXISTED. §1.4 cancelled that gate long
// before, but the code never changed, so the test went on freezing the old
// behaviour — correctly, since until 3b nothing had decided to change it.
//
// S3 lands with the `/song/play` migration, so the assertion inverts here: free
// playback is NOT capped. The OTHER half of G5-d #7 — High quality locked behind
// a crown — is untouched and still asserted above; it lives on `/mv/room`, which
// has not been migrated yet.
//
// Asserting the absence of an upsell string alone would be a weak test: deleting
// the component that renders it would also pass. So it also proves playback
// actually goes past 30s.
test("S3 / G5-d#7 inverted: free playback is NOT capped at 30s", async ({ page }) => {
  await login(page); // logged in, NOT subscribed
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/song/play?id=sp-pop-anthem");

  await expect(page.getByText(/Free preview/)).toHaveCount(0);

  // The real <audio> the migrated player is built around. Wait for metadata
  // before seeking — currentTime cannot be set until duration is known.
  const audio = page.locator("audio");
  await expect
    .poll(async () => audio.evaluate((el: HTMLAudioElement) => el.duration || 0), {
      message: "audio metadata must load",
    })
    .toBeGreaterThan(60);

  // Seek to ~90% by clicking the progress bar. The old player clamped this to
  // `maxPct` (30/125) and opened SubscribeModal instead.
  const bar = page.locator(".now-playing__progress");
  const box = (await bar.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);

  await expect
    .poll(async () => audio.evaluate((el: HTMLAudioElement) => el.currentTime), {
      message: "playback position must be allowed past the old 30s cap",
    })
    .toBeGreaterThan(30);
  await expect(page.getByRole("dialog", { name: /Muse Pro|Subscribe/i })).toHaveCount(0);
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

// ════════════════════════════════════════════════════════════════════════════
// S2 — an MV needs at least 30s of audio (MV-01)
//
// WHY THIS TEST EXISTS, AND WHY NOW
//   redesign-migration-plan.md §1.4: S2 is decided — WA's 30s floor wins, DP's
//   8%-of-track TRIM_MIN_GAP is dropped. The handoff flags S2 as one of only two
//   product rules with NO test behind it, living inside a component DP replaces
//   wholesale (TrimAudioSheet). That combination is exactly how a rule disappears
//   during a port: nothing fails, the screen looks right, and the constraint is
//   simply gone. Written BEFORE TrimAudioModal is touched, so the port has to
//   keep it rather than rediscover it.
// ════════════════════════════════════════════════════════════════════════════
test("S2 trim floor: a selection under 30s is rejected with a reason", async ({ page }) => {
  await login(page);
  await page.goto("/mv/room");

  await page.getByRole("button", { name: "Song Library" }).click();
  const chooseSong = page.getByRole("dialog", { name: "Choose Song" });
  await chooseSong.getByRole("button", { name: "Use", exact: true }).first().click();

  const confirm = page.getByRole("button", { name: "Use Trimmed Audio", exact: true });
  // The default handles (15%–70% of a 114s track ≈ 63s) clear the floor, so the
  // dialog opens usable — otherwise this test would pass for the wrong reason.
  await expect(confirm).toBeEnabled();

  const startHandle = page.getByRole("slider", { name: "Trim start" });
  const endHandle = page.getByRole("slider", { name: "Trim end" });
  const startBox = await startHandle.boundingBox();
  const endBox = await endHandle.boundingBox();
  expect(startBox && endBox, "both trim handles must be rendered").toBeTruthy();

  // Each handle is `left: calc(pct% - 6px)` with width 12px, so its CENTRE sits
  // exactly on its percentage. Two known centres (15% and 70%) give the track
  // geometry without having to locate the track element itself.
  const startCentre = startBox!.x + startBox!.width / 2;
  const endCentre = endBox!.x + endBox!.width / 2;
  const trackWidth = (endCentre - startCentre) / 0.55;
  const trackLeft = startCentre - 0.15 * trackWidth;
  const y = endBox!.y + endBox!.height / 2;

  // Drag the end handle to 25%: a 10% span of a 114s track ≈ 11s, well under the
  // floor and clear of onMove's `startPct + 5` clamp.
  await page.mouse.move(endCentre, y);
  await page.mouse.down();
  await page.mouse.move(trackLeft + 0.25 * trackWidth, y, { steps: 12 });
  await page.mouse.up();

  // Both halves of the rule: the user is told why, and the action is blocked.
  await expect(page.getByText(/minimum 30s/)).toBeVisible();
  await expect(confirm).toBeDisabled();
});

// ════════════════════════════════════════════════════════════════════════════
// R12 / S13 — the shell's phone cutover and mobile IA
//
// WHY THIS IS A BEHAVIOUR TEST, NOT A VISUAL ONE
//   Plan R12 insists the 640 -> 767 move is a behaviour change, not styling: it
//   decides WHICH navigation renders between 640 and 767, and the mobile item set
//   went 5 -> 3 with Profile leaving the bar entirely (CH5). A screenshot would
//   record that something looks different; these assert which nav a user actually
//   gets, and that the account is still reachable after Profile left the tab bar.
// ════════════════════════════════════════════════════════════════════════════
const CUTOVER = 768; // DP switches at max-width:767px, so 768 is the first desktop px

test("R12 shell: desktop width shows the sidebar and no mobile chrome", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/history");
  await expect(page.locator(".sidebar")).toBeVisible();
  await expect(page.locator(".mobile-tabbar")).toBeHidden();
  await expect(page.locator(".mobile-header")).toBeHidden();
});

test("R12 shell: just below the cutover swaps sidebar for the mobile bars", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: CUTOVER - 1, height: 900 });
  await page.goto("/history");
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".mobile-tabbar")).toBeVisible();
  await expect(page.locator(".mobile-header")).toBeVisible();
});

test("R12 shell: 700px is mobile now — this is the 640->767 change itself", async ({ page }) => {
  // Under the old 640px cutover this width rendered the DESKTOP rail. The whole
  // point of R12 is that it no longer does; if someone reverts the breakpoint,
  // this is the test that goes red.
  await login(page);
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto("/history");
  await expect(page.locator(".mobile-tabbar")).toBeVisible();
  await expect(page.locator(".sidebar")).toBeHidden();
});

test("S13 mobile IA: the bar is Explore / Create / History — Profile is not on it", async ({
  page,
}) => {
  await login(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/history");
  const bar = page.locator(".mobile-tabbar");
  await expect(bar.getByText("Explore")).toBeVisible();
  await expect(bar.getByText("History")).toBeVisible();
  await expect(bar.getByRole("button", { name: "Create" })).toBeVisible();
  // Profile left the bottom bar (5 -> 3). Losing it here without a replacement
  // would strand the account on phones, so assert both halves of that change.
  await expect(bar.getByText("Profile")).toHaveCount(0);
  await expect(page.locator(".mobile-header").getByRole("link", { name: "Account" })).toBeVisible();
});

test("S13 mobile IA: the + tab opens the create sheet with both creators", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/history");
  await page.locator(".mobile-tabbar").getByRole("button", { name: "Create" }).click();
  const sheet = page.getByRole("dialog", { name: /What would you like to create/i });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("AI Music Video")).toBeVisible();
  await expect(sheet.getByText("AI Song")).toBeVisible();
});

test("R9 shell: every sidebar link carries the locale prefix", async ({ page }) => {
  // The failure this guards is invisible in English: DP links with a bare
  // <a href="/home">, the NEXT_LOCALE cookie redirects to the right page anyway,
  // and only the other 8 locales are broken. Assert the prefix is really in the DOM.
  await login(page);
  await page.goto("/jpn/history");
  const hrefs = await page
    .locator(".sidebar__nav-item")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href).toMatch(/^\/jpn(\/|$)/);
});

// ════════════════════════════════════════════════════════════════════════════
// Q6 / R-2 — /explore/mvs, the first Phase 3 screen (plan §4)
//
// Two things this slice introduces that a screenshot cannot see:
//
//   Q6  Back is `router.back()` with a fallback to the section entry, NOT DP's
//       `?from=` query. The two only differ when there IS no history — a shared
//       or deep-linked URL — which is exactly the case a reviewer clicking
//       around the app never reaches.
//
//   R-2 The justified grid reads `matchMedia` to choose its layout. DP does that
//       in a `useState` initializer, which slice 2a measured as a hydration
//       failure. That failure is a CONSOLE error and a silently patched DOM, not
//       a visual diff, so it needs asserting directly.
// ════════════════════════════════════════════════════════════════════════════

test("Q6 back: with no history, Back falls back to the section entry", async ({ page }) => {
  // A cold load — the deep-link / shared-URL case, and the whole reason Q6
  // rejected DP's `?from=` scheme. This is the test that caught the first
  // implementation: `window.history.length` counts the entry the app replaced,
  // so `router.back()` fired and landed on about:blank — outside the app.
  await page.goto("/explore/mvs");
  await page.locator(".detail-navbar__back").click();
  await expect(page).toHaveURL(/\/(enu)?\/?$/);
  await expect(page.locator(".sidebar")).toBeVisible(); // still inside the app
});

test("Q6 back: after navigating in-app, Back really goes back", async ({ page }) => {
  // A REAL client-side navigation (Home's "See all"), not a second page.goto —
  // a full load is not in-app history and must not count as one.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page
    .getByRole("link", { name: /See all/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/explore\/mvs$/);
  await page.locator(".detail-navbar__back").click();
  await expect(page).toHaveURL(/\/(enu)?\/?$/);

  // Both paths end on "/" here, so the URL alone cannot tell them apart — the
  // forward entry can. A real back() leaves /explore/mvs ahead of us; the
  // fallback would have PUSHED "/" onto the end of the stack, with nothing
  // forward to return to.
  await page.goForward();
  await expect(page).toHaveURL(/\/explore\/mvs$/);
});

test("Q6 back: the back control is a real link, not a bare clickable", async ({ page }) => {
  // The href is what makes middle-click and "copy link address" work and what
  // lets axe see a destination — the click handler overrides it for plain clicks.
  await page.goto("/explore/mvs");
  await expect(page.locator(".detail-navbar__back")).toHaveAttribute("href", "/");
});

for (const width of [1440, 1000, 700]) {
  test(`R-2 hydration: /explore/mvs is clean at ${width}px`, async ({ page }) => {
    // 1000px is the width that made the Sidebar's version of this pattern throw:
    // wide enough that the media query disagrees with the server's assumption.
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(m.text());
    });
    page.on("pageerror", (e) => problems.push(String(e)));

    await page.setViewportSize({ width, height: 900 });
    await page.goto("/explore/mvs");
    await expect(page.locator(".mv-detail__grid").first()).toBeVisible();
    expect(problems).toEqual([]);
  });
}

test("S15 gallery: the desktop grid justifies rows to the container width", async ({ page }) => {
  // The redesign's actual point. Below 1024 the layout falls back to a plain
  // wrapping grid, so assert the justified rows exist only above it.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/mvs");
  await expect(page.locator(".mv-detail__grid-row").first()).toBeVisible();
  await expect(page.locator(".mv-detail__grid--wrap")).toHaveCount(0);

  await page.setViewportSize({ width: 900, height: 900 });
  await expect(page.locator(".mv-detail__grid--wrap").first()).toBeVisible();
  await expect(page.locator(".mv-detail__grid-row")).toHaveCount(0);
});

test("R9 /explore/mvs: card and creator links carry the locale prefix", async ({ page }) => {
  // Same invisible-in-English failure as the sidebar test above, one screen down.
  await page.goto("/jpn/explore/mvs");
  const hrefs = await page
    .locator(".mv-detail__grid-item")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href).toMatch(/^\/jpn\/watch\?id=/);
  await expect(page.locator(".detail-navbar__back")).toHaveAttribute("href", "/jpn");
});

test("/explore/mvs: clicking a card still opens the dialog, not a navigation", async ({ page }) => {
  // The migration replaced markup, not behaviour. If a later slice moves this
  // screen to real navigation that is a deliberate decision — this test is where
  // it should show up.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/mvs");
  await page.locator(".mv-detail__grid-item").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/explore\/mvs$/);
});

// ════════════════════════════════════════════════════════════════════════════
// A4 — the navbar tabs row survives the mobile cutover
//
// This is the test that would have caught slice 2b. DP's AppLayout hides every
// navbar below 767px because MobileHeader/MobileTabBar replace them — correct
// for chrome, wrong for the tabs row, which is page content. Moving History's
// filters into `tabsSlot` therefore deleted them on phones: still in the DOM,
// display:none, no way to filter at all. Nothing failed; the 2b baselines were
// re-recorded at all six widths and accepted the loss.
//
// A visual test cannot catch this class of bug — it records whatever it sees.
// Asserting the control is USABLE is what makes it a regression test.
// ════════════════════════════════════════════════════════════════════════════

for (const width of [320, 375, 767, 768, 1440]) {
  test(`A4 /history: the filter tabs are usable at ${width}px`, async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/history");

    const tabs = page.locator(".tabs");
    await expect(tabs).toBeVisible();
    // HIST-03: Liked is a spec'd behaviour, so assert it specifically rather
    // than just counting pills.
    await expect(tabs.getByRole("button", { name: "Liked" })).toBeVisible();

    // Usable, not merely painted.
    await tabs.getByRole("button", { name: "Songs" }).click();
    await expect(tabs.getByRole("button", { name: "Songs" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
}

test("A4: the override restores the tabs row only, not the whole navbar", async ({ page }) => {
  // The title/credits/Upgrade row must STAY hidden on phones — MobileHeader
  // carries those, and showing both would double them up. If this goes red the
  // override has widened beyond what was decided.
  await login(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/history");
  await expect(page.locator(".room-navbar__tabs")).toBeVisible();
  await expect(page.locator(".room-navbar__top")).toBeHidden();
  await expect(page.locator(".mobile-header")).toBeVisible();
});

test("A4: a navbar with no tabs stays hidden on mobile, exactly as DP intends", async ({
  page,
}) => {
  // /explore/mvs passes no tabsSlot, so its DetailNavbar is pure chrome and the
  // `:has()` scoping must leave DP's rule alone. Mobile back navigation is a
  // separate open question (DESIGNER-TODO A5) — this asserts we did NOT quietly
  // answer it here.
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/explore/mvs");
  await expect(page.locator(".detail-navbar")).toBeHidden();
  await expect(page.locator(".mobile-tabbar")).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3b — /explore/songs + /song/play, one migrated screen behind two URLs
//
// This slice changes BEHAVIOUR, not just markup, and A4 is the reason every one
// of those changes gets a test here instead of a screenshot: re-recording a
// visual baseline accepts whatever it sees, so slice 2b's baselines absorbed the
// total loss of History's mobile filter tabs without a single test going red.
//
// The changes, each asserted below:
//   · desktop: clicking a song swaps the right column and does NOT navigate
//   · mobile:  clicking a song opens the full-screen player, and Back returns
//   · cold `?id=` deep link: Back lands on /explore/songs, not outside the app
//   · `?tab=` selects that tab
//   · EXP-09 survives the merge: a `cps-*` id lists the creator's playlist
//   · EXP-06 survives: an unresolvable id is still a not-found state
//   · the Create gate (GL-02/EXP-02) survives
//   · no hydration failure from the phone-cutover media query (R-2)
//
// S3 (playback uncapped) is asserted with the G5-d #7 inversion further up.
// ════════════════════════════════════════════════════════════════════════════

test("3b desktop: clicking a song swaps the right column without navigating", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs");

  const nowPlayingTitle = page.locator(".now-playing__title");
  const first = await nowPlayingTitle.innerText();

  // Second row — a different song from whatever is already Now Playing.
  await page.locator(".top-song__title").nth(1).click();

  await expect(nowPlayingTitle).not.toHaveText(first);
  // The whole point of the merge: the URL does not jump to /song/play.
  await expect(page).toHaveURL(/\/explore\/songs$/);
});

test("3b mobile: tapping a song opens the full-screen player, Back returns to the list", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/explore/songs");

  const player = page.locator(".song-detail-mobile-player");
  await expect(player).toBeHidden();

  await page.locator(".top-song__title").first().click();

  // A real route change (router.push), not DP's history.pushState.
  await expect(page).toHaveURL(/\/song\/play\?id=/);
  await expect(player).toBeVisible();

  // A5 does NOT block this screen precisely because this control exists.
  await player.locator(".song-detail-mobile-player__back").click();
  await expect(page).toHaveURL(/\/explore\/songs$/);
  await expect(player).toBeHidden();
});

test("3b mobile: a cold ?id= deep link's Back falls back into the app, not out of it", async ({
  page,
}) => {
  // Q6's fallback, on the screen where getting it wrong is most visible: a
  // shared link opened in a fresh tab has no in-app history, and `history.length`
  // would wrongly claim it does (see src/lib/navHistory.ts).
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/song/play?id=sp-chill-rnb");

  // DP's own rule: an explicit ?id= opens straight into the full-screen player.
  const player = page.locator(".song-detail-mobile-player");
  await expect(player).toBeVisible();

  await player.locator(".song-detail-mobile-player__back").click();
  await expect(page).toHaveURL(/\/explore\/songs$/);
  await expect(page.locator(".top-song").first()).toBeVisible(); // still inside the app
});

test("3b: ?tab= selects that tab, and Trending is not offered", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs?tab=New%20Releases");

  await expect(page.getByRole("button", { name: "New Releases" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // DP ships four tabs and admits three are fake. Trending has no real data
  // behind it, so it was deliberately not built (DESIGNER-TODO A7).
  await expect(page.getByRole("button", { name: "Trending" })).toHaveCount(0);
});

test("3b: switching a browse filter does not change what is playing", async ({ page }) => {
  // Found by G7's independent review and then measured: the Now Playing default was
  // derived live from `displayedSongs[0]`, and WA's three tabs are three different
  // catalogs (DP's four are reorderings of one), so All -> New Releases moved Now
  // Playing from "Pop Anthem" to "Down the Memory Lane" and the load effect
  // restarted the audio. A filter must not touch playback.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs");

  const nowPlaying = page.locator(".now-playing__title");
  const before = await nowPlaying.innerText();

  // No song clicked — only the filter changes.
  await page.getByRole("button", { name: "New Releases" }).click();
  await expect(page.locator(".tabs__tab--active")).toHaveText("New Releases");
  await expect(nowPlaying).toHaveText(before);

  await page.getByRole("button", { name: "Top Picks" }).click();
  await expect(nowPlaying).toHaveText(before);
});

test("3b: a tab switch changes the list", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs");
  const rows = page.locator(".top-song");
  const all = await rows.count();

  await page.getByRole("button", { name: "Top Picks" }).click();
  await expect(rows).not.toHaveCount(all); // All = both catalogs, Top Picks = one
});

test("3b / EXP-09: a creator song id lists the creator's playlist", async ({ page }) => {
  // The merge could easily have dropped this: `cps-*` ids arrive from /creator
  // and belong to none of the three community tabs. Product owner decided
  // 2026-08-05 that the LIST follows the playlist, so the two agree.
  await page.setViewportSize({ width: 1440, height: 900 });
  const id = "cps-midnight-drive";
  await page.goto(`/song/play?id=${id}`);

  await expect(page.locator(".now-playing")).toBeVisible();
  // No tab drives this list, so none may claim to be selected.
  await expect(page.locator(".tabs__tab--active")).toHaveCount(0);

  // Clicking a tab switches back to the community catalog.
  await page.getByRole("button", { name: "Top Picks" }).click();
  await expect(page.locator(".tabs__tab--active")).toHaveCount(1);
});

test("3b / EXP-06: an unresolvable id is still a not-found state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/song/play?id=does-not-exist");
  await expect(page.getByRole("button", { name: "Explore Songs" })).toBeVisible();
  await expect(page.locator(".now-playing")).toHaveCount(0);
});

test("3b / GL-02: Create still requires sign-in", async ({ page }) => {
  // NOT logged in. The gate is at the action, not the route.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs");

  await page.locator(".now-playing__cta").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/explore\/songs$/); // did not reach /song/create
});

test("3b / R9: the migrated links carry the locale prefix", async ({ page }) => {
  // Invisible in English, broken in the other 8 locales — the failure mode R-9
  // exists for. DP navigates by assigning to the document location.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/jpn/explore/songs");

  // `evaluateAll` does NOT auto-wait — it resolves against whatever is in the DOM
  // at that instant, and returns [] rather than retrying. The `.top-song` rows are
  // server-rendered but the creator link inside them only exists after hydration
  // (measured: `.top-song` = 16 immediately, `.top-song__user-row` = 0 until ~100ms),
  // so this raced hydration and failed ~2 runs in 3. Anchor on the first link first;
  // `toBeAttached` is the assertion that retries.
  await expect(page.locator(".top-song__user-row").first()).toBeAttached();

  const hrefs = await page
    .locator(".top-song__user-row")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href).toBe("/jpn/creator");
  await expect(page.locator(".now-playing__user")).toHaveAttribute("href", "/jpn/creator");
});

for (const width of [1440, 1000, 700]) {
  test(`3b / R-2 hydration: the song screen is clean at ${width}px`, async ({ page }) => {
    // The screen reads the phone cutover through `useMediaQuery`, and it portals
    // the mobile player to <body>. DP's shapes of both are a hydration failure
    // and a BUILD failure respectively; neither shows up as a visual diff, and
    // one of them is a console error, so assert the console directly.
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(m.text());
    });
    page.on("pageerror", (e) => problems.push(String(e)));

    await page.setViewportSize({ width, height: 900 });
    await page.goto("/song/play?id=sp-electronic");
    await expect(page.locator(".song-detail").first()).toBeVisible();
    expect(problems).toEqual([]);
  });
}

test("3b / A4: the song screen's tabs are usable on a phone", async ({ page }) => {
  // Same class of loss as History's: this DetailNavbar passes a tabsSlot, so DP's
  // "hide every navbar below 767px" rule would delete the tabs unless the A4
  // override catches it. The list IS reachable from the bottom bar, so the __top
  // row staying hidden is correct — it is the filters that are page content.
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/explore/songs");

  const tabs = page.locator(".tabs");
  await expect(tabs).toBeVisible();
  await expect(page.locator(".detail-navbar__top")).toBeHidden();

  await tabs.getByRole("button", { name: "New Releases" }).click();
  await expect(tabs.getByRole("button", { name: "New Releases" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3c — /profile + /settings migrated to DP's AccountPage
// ════════════════════════════════════════════════════════════════════════════

// A5's fix lives in DetailNavbar, so this sweep covers every route that renders
// one — and automatically covers each new migrated detail screen as it lands.
// DP hides `.detail-navbar` below 767px and its MobileHeader has no back, so
// without this the screens are enterable and not leavable on a phone. Measured
// on DP itself: 5 of its pages declare a back whose computed height is 0 at 375.
// Only the routes that NEED it: a screen the mobile tab bar can reach (Explore,
// Create, History) passes phoneBack={false}, because back solves nothing there.
// Every migrated detail screen from here on gets it by default, so this list
// grows with the migration rather than being remembered.
const DETAIL_NAVBAR_ROUTES = ["/settings", "/watch"];

for (const route of DETAIL_NAVBAR_ROUTES) {
  test(`A5: ${route} has a working back control at 375px`, async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(route);

    const back = page.getByRole("button", { name: "Back" });
    await expect(back).toBeVisible();
    const box = await back.boundingBox();
    expect(box, `${route}: Back must have a real hit area, not a 0-height ghost`).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(24);
  });
}

test("A5: a mobile tab-bar destination does NOT get a phone back row", async ({ page }) => {
  // The opt-out has to be real, or every Explore screen gains a useless row.
  await login(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/explore/mvs");
  await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);
});

test("A5: the phone back control is NOT duplicated on desktop", async ({ page }) => {
  // The DP navbar carries its own back at >=768; showing both would be a defect.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: "Back" })).toBeHidden();
  await expect(page.locator(".detail-navbar__back")).toBeVisible();
});

test("3c / A5: /settings still has a reachable back control on a phone", async ({ page }) => {
  // THE test for this slice. DP puts Back in DetailNavbar, which AppLayout.css
  // hides below 767px — measured on DP itself: height 0 at 375px. WA's
  // pre-migration /settings had a working Back at every width, so porting DP
  // verbatim would have deleted it on phones and no screenshot would have
  // complained (A4's lesson). If this goes red, that regression is back.
  await login(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/profile");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/settings");

  const back = page.getByRole("button", { name: "Back" });
  await expect(back).toBeVisible();
  const box = await back.boundingBox();
  expect(box, "Back must have a real hit area, not a 0-height ghost").not.toBeNull();
  expect(box!.height).toBeGreaterThan(0);

  await back.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/profile");
});

test("3c: the Credits stat opens the balance breakdown instead of navigating", async ({ page }) => {
  // DP's three stats are all <a>. WA has no /credits route — Credits is a modal —
  // so that one is a <button>. If it ever becomes a link it would 404 silently.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/profile");
  await page.getByRole("button", { name: /Credits/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/profile$/);
});

test("3c / R-8: the migrated profile still renders through useT()", async ({ page }) => {
  // /profile is one of only two real useT() consumers. DP hardcodes English, so
  // the failure mode here is invisible in English: the screen would look perfect
  // and the other 8 locales would silently lose their dictionary. Asserting the
  // locale-prefixed tree renders and keeps its prefix is the cheap proxy.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/jpn/profile");
  // Scoped to the account rows — the Sidebar has its own History link, so an
  // unscoped match is a strict-mode violation rather than a real assertion.
  await expect(
    page.locator(".account-page__rows").getByRole("link", { name: /History/ }),
  ).toHaveAttribute("href", "/jpn/history");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/jpn/settings");
});

test("3c: the notification toggle survived the migration", async ({ page }) => {
  // DP's Notifications row is a static "On" subtitle with a chevron; WA's is a
  // real switch over real state. Copying DP verbatim would have silently
  // downgraded a working control into decoration.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/profile");
  const sw = page.getByRole("switch", { name: /Notifications/i });
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "false");
});

test("3c / G7-1: the Muse Pro row keeps a visible Subscribe CTA, not just a chevron", async ({
  page,
}) => {
  // G7 found this: the migration kept the click target and dropped the pill, so
  // the only purchase entry point on the screen looked identical to Notifications
  // and Language. The action working is not the same as the affordance existing.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/profile");

  const pill = page.locator(".account-page__rows .badge").first();
  await expect(pill).toBeVisible();
  await expect(pill).toHaveText(/Subscribe|Manage/);

  // An invented modifier would still render — assert it actually picked up styling.
  const bg = await pill.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg, "the pill must resolve to a real Badge.css modifier").not.toBe("rgba(0, 0, 0, 0)");
});

test("3c / G7-2: every control on the account screens meets the 24x24 AA floor", async ({
  page,
}) => {
  // WCAG 2.5.8. The edit-profile button arrived at 20x20 from DP's size="XSmall",
  // a regression from WA's pre-migration 32x32 that only a measurement catches.
  await login(page);
  for (const route of ["/profile", "/settings"]) {
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const small = await page
        .locator(".account-page button, .account-page a[href]")
        .evaluateAll((els) =>
          els
            .map((el) => {
              const r = el.getBoundingClientRect();
              return { cls: (el.className || "").toString().split(" ")[0], w: r.width, h: r.height };
            })
            .filter((m) => m.w > 0 && m.h > 0 && (m.w < 24 || m.h < 24)),
        );
      expect(small, `${route} @${width} has sub-24px targets`).toEqual([]);
    }
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3d — /watch migrated to DP's MVDetailPage player half
// ════════════════════════════════════════════════════════════════════════════

test("3d / AC-EXP-04: /watch plays muted with play/pause, mute, Like, Share and Create", async ({
  page,
}) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/watch");

  // Muted 3:4 playback is the AC, so assert the element state, not the pixels —
  // headless chromium has no H.264 decoder and paints the stage black.
  const video = page.locator(".mv-player__video");
  await expect(video).toHaveJSProperty("muted", true);

  await expect(page.getByRole("button", { name: /Pause|Play/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mute|Unmute/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Like" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Create MV/ })).toBeVisible();
});

test("3d: the seek bar is operable by keyboard, not just pointer", async ({ page }) => {
  // DP's seek bar is a bare div with onPointerDown — the exact WCAG 2.1.1 defect
  // G7 logged against the song player (TODO.md #5). /watch got SeekBar instead,
  // so this asserts the thing that made it worth extracting.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/watch");

  const slider = page.getByRole("slider", { name: "Seek" });
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute("aria-valuenow", /\d+/);
  await slider.focus();
  await expect(slider).toBeFocused();
});

test("3d / EXP-06: an unresolvable /watch id is a not-found state", async ({ page }) => {
  await login(page);
  await page.goto("/watch?id=does-not-exist");
  await expect(page.getByRole("button", { name: "Explore Music Videos" })).toBeVisible();
});

test("3d / GL-02: Create MV from /watch requires sign-in", async ({ page }) => {
  // NOT logged in — the gate is at the action, not the route.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/watch");
  await page.getByRole("button", { name: /Create MV/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/watch$/);
});

test("3d / R9: the creator link carries the locale prefix", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/jpn/watch");
  await expect(page.locator(".mv-player__user")).toHaveAttribute("href", "/jpn/creator");
});
