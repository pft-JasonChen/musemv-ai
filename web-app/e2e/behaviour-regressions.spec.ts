// Gate G5-d — the 10 behaviour regressions.
// docs/archive/redesign-migration-plan-2026-08-01.md §10 G5-d.
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
import AxeBuilder from "@axe-core/playwright";
import { COST_MERGE, COST_RECREATE } from "../src/lib/mv/types";
import { SONG_IDEA_PROMPTS, LYRIC_PRESETS } from "../src/lib/mv/songIdeas";
import { DEFAULT_CREDITS } from "../src/lib/user";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, localePath } from "../src/lib/i18n/config";

const MV_DESCRIPTION = "A glamorous neon-lit night drive through the city.";
/** MockMuseApi.FAIL_TRIGGER — a description containing this fails the job at 60%. */
const FAIL_TRIGGER = "[fail]";

// ── helpers ─────────────────────────────────────────────────────────────────
/** Seed the mock auth flag before any page script runs, so AuthGuard sees a user. */
async function login(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
}

/**
 * Give the account enough credits to drive a full generation flow, **in place**.
 *
 * Needed since 2026-08-12: `DEFAULT_CREDITS` dropped 390 → 10 (`TBD-CR-06a`), so a
 * fresh free account cannot afford a storyboard (20) or a render (200), and every
 * multi-step flow test would otherwise stop at the IAP upsell — which is the
 * intended product behaviour, not a bug.
 *
 * ⚠️ **Call this AFTER `page.goto()`, never before, and never navigate between
 * funding and the flow under test.** `subscribed` and the credit balance are
 * in-memory React state (`AuthProvider` / `CreditsProvider`); only `muse_auth`
 * persists to localStorage (AUTH-E1 / `TBD-GL-04`). A `goto` is a full page load,
 * so it resets the balance straight back to 10 — which is exactly how the first
 * two attempts at this helper failed, silently, with the flow then stopping at the
 * upsell instead of erroring.
 *
 * It funds through the REAL subscribe flow rather than injecting a balance, so the
 * path a user actually takes stays exercised (and CR-06 keeps holding: credit packs
 * are subscriber-only, so subscribing IS how you get funds). Featured card =
 * Weekly Pro = 1,000 credits.
 */
async function fundAccount(page: Page, plan: "weekly" | "weekly_pro" = "weekly_pro") {
  await page.getByRole("button", { name: "Upgrade" }).first().click();
  // DP's dialog is one Subscribe button PER CARD, not a shared selection, so the
  // card decides the plan — same locator the 3f tests use. Weekly Pro (featured)
  // grants 1,000; Weekly grants 200, which some tests need because they assert on
  // a LOW balance afterwards and 1,000 would overshoot the precondition.
  const card =
    plan === "weekly_pro"
      ? page.locator(".upgrade-dialog__card--featured")
      : page.locator(".upgrade-dialog__card").first();
  await card.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByRole("dialog", { name: "Upgrade Your Plan" })).toBeHidden();
  await expect.poll(() => balance(page)).toBeGreaterThan(DEFAULT_CREDITS);
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
  // Name matching is substring-by-default and the sheet portals to document.body, so
  // an unscoped { name: "Use" } can resolve to a page-level "Use …" button under the
  // scrim. Scope to the dialog and match exactly. (Same trap fixed in mv-flow.spec.ts.)
  const chooseSong = page.getByRole("dialog", { name: "Choose Song" });
  // Slice 3g-2: DP reveals the row's "Use" pill only while the row is active, so
  // hover the row first or the pill is `pointer-events: none`.
  const songRow = chooseSong.locator(".mv-song-picker__row").first();
  await songRow.hover();
  await songRow.getByRole("button", { name: "Use", exact: true }).click();
  await trimConfirm(page).click();
  await expect(page.getByRole("button", { name: "Create Music Video" })).toBeEnabled();
}

/**
 * The Trim sheet's confirming action. Slice 3g-2 replaced WA's "Use Trimmed Audio"
 * button with DP's Cancel/Confirm footer row (the phone header check is the same
 * action, and is the only one rendered below 768px).
 */
function trimConfirm(page: Page) {
  return page
    .getByRole("dialog", { name: "Trim Audio" })
    .getByRole("button", { name: "Confirm", exact: true });
}

/** A locator's box once it has stopped moving — see the `.song-bar` note below. */
async function settledBox(loc: ReturnType<Page["locator"]>) {
  let prev = await loc.boundingBox();
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 100));
    const next = await loc.boundingBox();
    if (prev && next && prev.x === next.x && prev.y === next.y && prev.width === next.width) {
      return next;
    }
    prev = next;
  }
  expect(prev, "the bar never settled").not.toBeNull();
  return prev!;
}

/**
 * `.history-card` count once it has stopped changing between reads — the
 * first navigation to any route under `next dev` can take a moment to
 * compile, so an immediate `.count()` right after `goto`/a client nav can
 * undercount a page that is still rendering. Mirrors `settledBox`'s
 * poll-until-stable shape above.
 */
async function stableHistoryCardCount(page: Page): Promise<number> {
  const loc = page.locator(".history-card");
  let prev = -1;
  for (let i = 0; i < 30; i++) {
    const cur = await loc.count();
    if (cur === prev) return cur;
    prev = cur;
    await page.waitForTimeout(300);
  }
  return prev;
}

/** Kick off a storyboard-first generation from a composed MV room. */
async function startStoryboard(page: Page) {
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create Storyboard First").click();
}

/**
 * The credit number a control is SHOWING, as an integer.
 *
 * Since 2026-08-19 none of the MV prices is a constant — spec 11 bills per
 * second of the trimmed song and per resolution tier, so the same dialog says
 * different things for different tracks. Tests therefore assert the invariant
 * that actually matters, "you are charged exactly what the button said", rather
 * than re-implementing the price table and drifting from it.
 */
async function shownCost(page: Page, selector: string): Promise<number> {
  const loc = page.locator(selector);
  await loc.first().waitFor({ state: "attached" });
  // `textContent`, not `innerText`: some of these badges live inside a
  // `FloatingCTA` that is not laid out at every width, and `innerText` returns
  // "" for anything the layout engine skipped. The number is still the contract.
  const texts = await loc.allTextContents();
  for (const t of texts) {
    const n = /(\d+)/.exec(t.replace(/[\s,]/g, ""));
    if (n) return Number(n[1]);
  }
  throw new Error(`no credit number found in ${JSON.stringify(texts)} (${selector})`);
}

// ════════════════════════════════════════════════════════════════════════════
// G5-d #1 — credits are charged, and refunded when the job fails
// ════════════════════════════════════════════════════════════════════════════
test("G5-d#1 charges the script then the render, exactly as displayed", async ({ page }) => {
  test.slow(); // two full mock generations
  await login(page);
  await page.goto("/mv/room");
  await fundAccount(page);
  const before = await balance(page);

  await composeMv(page);

  // Read the price off the dialog BEFORE committing to it (spec 11 §3.3).
  await page.getByRole("button", { name: "Create Music Video" }).click();
  const scriptPrice = await shownCost(page, ".mv-mode-card__tag--credit");
  await page.getByText("Create Storyboard First").click();

  await page.waitForURL("**/mv/storyboard");
  const afterStoryboard = await balance(page);
  expect(
    afterStoryboard,
    `storyboard should charge exactly the ${scriptPrice} it advertised (GL-01 charges at job start)`,
  ).toBe(before - scriptPrice);

  // …and again for Generate MV (§3.4), whose price is lower than a direct
  // render by exactly the amount the script already cost.
  const renderPrice = await shownCost(page, ".song-create__cta-credits");
  await page.getByRole("button", { name: /Create MV/ }).click();
  await page.waitForURL("**/mv/result");
  expect(await balance(page), `render should charge exactly the ${renderPrice} it advertised`).toBe(
    afterStoryboard - renderPrice,
  );
});

test("G5-d#1 refunds the charge when the job fails", async ({ page }) => {
  await login(page);
  await page.goto("/mv/room");
  await fundAccount(page);
  const before = await balance(page);

  await composeMv(page, `${MV_DESCRIPTION} ${FAIL_TRIGGER}`);
  await startStoryboard(page);

  // GL-01: the refund runs from pollJob's onError, so wait for the failure UI first.
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect
    .poll(() => balance(page), {
      message:
        'a failed job must refund the full charge so the "credits were not charged" copy stays true',
    })
    .toBe(before);
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #2 — insufficient balance routes to IAP instead of generating
// ════════════════════════════════════════════════════════════════════════════
// GL-01, enforced in MvRoom.selectMode() — NOT in MvFlowProvider. The provider's
// startStoryboard/startRender charge unconditionally; the balance check lives one
// level up, at the point the user picks a mode:
//     const cost = mode === "storyboard_first" ? storyboardCost : directCost;
//     if (credits < cost) { setBuyOpen(true); return; }
// Reading only the provider makes it look like there is no guard. There is.
//
// REWRITTEN 2026-08-19, and it was already RED before that. The test drove two
// full generations to drain the balance, on the arithmetic "DEFAULT_CREDITS 390
// − 20 − 200 = 170". `DEFAULT_CREDITS` became **10** on 2026-08-12 and this test
// never called `fundAccount`, so it could not afford the FIRST job and timed out
// waiting for `/mv/storyboard`. Nothing about the drain was needed any more: a
// free account is already below every price, so the test now asserts the refusal
// directly. (Found by the spec audit's follow-up, after the two `3c` failures.)
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

  // No draining run any more — a free account IS the low balance. Both prices on
  // the dialog must exceed it, which is the precondition the old two-generation
  // drain existed to manufacture.
  await page.getByRole("button", { name: "Create Music Video" }).click();
  const prices = await page.locator(".mv-mode-card__tag--credit").allTextContents();
  const numbers = prices.map((t) => Number(/(\d+)/.exec(t.replace(/[\s,]/g, ""))?.[1] ?? 0));
  expect(numbers.length, "both mode cards must advertise a price").toBe(2);
  for (const n of numbers) {
    expect(
      n,
      `precondition: ${n} must be unaffordable on a ${before}-credit account`,
    ).toBeGreaterThan(before);
  }

  await page.getByText("Create MV Directly").click();

  // The point: no job starts, no navigation, and an IAP surface opens instead.
  //
  // WHICH surface depends on tier (CR-06): credits are sold to Muse Pro subscribers
  // only, so BuyCreditsModal renders SubscribeModal for a free account and the pack
  // picker ("Buy Credits") for a subscriber. This test signs in as a free user, so
  // it gets Subscribe — accept either so the test tracks the rule rather than one
  // tier's rendering of it.
  //
  // Slice 3f renamed the sell surface to DP's own title, "Upgrade Your Plan"
  // (the "Muse Pro" name now belongs to the already-subscribed state). The copy
  // is the selector, so it is updated here as part of that slice, not patched
  // around — see AGENTS.md, "e2e selectors are exact UI copy".
  await expect(
    page.getByRole("dialog", { name: /Upgrade Your Plan|Muse Pro|Buy Credits/i }),
  ).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/mv/room");
  expect(await balance(page), "a refused generation must not charge").toBe(before);
});

// ════════════════════════════════════════════════════════════════════════════
// G5-d #3 — AuthGuard on every signed-in-only route
// ════════════════════════════════════════════════════════════════════════════
// NEITHER create route is in this list. `/mv/room` dropped its `AuthGuard` on
// 2026-08-07 (designer request) and `/song/create` followed on 2026-08-12
// (product decision) — a guest must be able to open both and compose before
// deciding to sign in. Their gates are on the actions instead; see the
// "guest-reachable" blocks below, which assert that for each of them.
//
// `/profile/credits` joined the list on 2026-08-12. It became a route on
// 2026-08-11 and was guarded from the start, but nothing here covered it for a
// day — the standing `a11y.spec.ts` sweep never seeds auth, so a guarded route
// can look green while only its sign-in wall was ever tested.
const GUARDED_ROUTES = ["/settings", "/profile", "/history", "/profile/credits"];

for (const route of GUARDED_ROUTES) {
  test(`G5-d#3 AuthGuard: ${route} is closed to guests`, async ({ page }) => {
    // No login() — arrive as a guest.
    await page.goto(route);
    // AuthGuard renders null and calls requireLogin(), which opens the sign-in modal.
    await expect(page.getByRole("dialog", { name: /Sign in/i })).toBeVisible();
  });
}

test("G5-d#3 /mv/room is guest-reachable, unlike the routes above", async ({ page }) => {
  // No login() — arrive as a guest. If `/mv/room` were still behind AuthGuard
  // this would render nothing and pop the sign-in dialog, same as the loop above.
  await page.goto("/mv/room");
  await expect(page.getByRole("dialog", { name: /Sign in/i })).not.toBeVisible();
  await expect(page.locator(".mv-create__panel")).toBeVisible();
});

test("G5-d#3 /mv/room's gate moved to Create Music Video", async ({ page }) => {
  // Still a guest — compose is allowed, generating is not.
  //
  // ⚠️ This test used `composeMv()` from 0748b66 (the commit that opened
  // /mv/room to guests) until 2026-08-12, and had NEVER passed: `composeMv`
  // picks a song through **Song Library**, which the same commit's designer
  // decision put behind `requireLogin`. So the sign-in modal opened at the
  // library and the "Choose Song" dialog never appeared — the test timed out on
  // a premise that contradicted the feature it was guarding.
  //
  // The real guest path to a composed MV is **Import Audio**, which is
  // deliberately ungated (a file the user already has is not account data).
  // `isComposeReady` needs a song AND a description, so both are required
  // before the CTA is even enabled.
  await page.goto("/mv/room");

  await page.locator('input[type="file"][accept="audio/*"]').setInputFiles({
    name: "guest-track.mp3",
    mimeType: "audio/mpeg",
    // Minimal MP3 frame — enough for the import handler to accept the file.
    buffer: Buffer.from("SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA", "base64"),
  });
  // Import opens the Trim sheet; the song only lands in `compose.song` once it
  // is confirmed. (The probe's `error` handler falls back to duration 0, so an
  // undecodable buffer still reaches this step — no real audio needed.)
  await trimConfirm(page).click();

  await page
    .getByPlaceholder("Describe your video to help AI create a more compelling story.")
    .fill("A neon city at night, rain on the windows.");

  const cta = page.getByRole("button", { name: "Create Music Video" });
  await expect(cta).toBeEnabled();
  await cta.click();
  await expect(page.getByRole("dialog", { name: /Sign in/i })).toBeVisible();
});

test("G5-d#3 /mv/room's Song library is gated too", async ({ page }) => {
  // The second gate on this screen: the library lists the user's OWN songs, so
  // a guest has nothing to show — opening it must ask for sign-in rather than
  // render an empty sheet.
  await page.goto("/mv/room");
  await page.getByRole("button", { name: /Song library/i }).click();
  await expect(page.getByRole("dialog", { name: /Sign in/i })).toBeVisible();
});

test("G5-d#3 /song/create is guest-reachable, unlike the routes above", async ({ page }) => {
  // No login(). Until 2026-08-12 this route had an `AuthGuard` and a guest saw
  // only the sign-in wall; it now mirrors `/mv/room`.
  await page.goto("/song/create");
  await expect(page.getByRole("dialog", { name: /Sign in/i })).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Create Song/i })).toBeVisible();
});

test("G5-d#3 /song/create's gate moved to Create Song", async ({ page }) => {
  // Still a guest — compose is allowed, generating is not. The description is
  // what makes the CTA `--active`; a disabled button would pass this test for
  // the wrong reason, so assert it is enabled before clicking.
  await page.goto("/song/create");
  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams.");
  const cta = page.getByRole("button", { name: /Create Song/i });
  await expect(cta).toBeEnabled();
  await cta.click();
  await expect(page.getByRole("dialog", { name: /Sign in/i })).toBeVisible();
});

test("G5-d#3 a guest is never shown the credits upsell before signing in", async ({ page }) => {
  // Ordering rule inside `SongCompose.generate()`: `requireLogin` wraps the
  // GL-01 balance check, so a logged-out user cannot be asked to buy credits
  // for an account that does not exist yet. Sign-in must come first.
  await page.goto("/song/create");
  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams.");
  await page.getByRole("button", { name: /Create Song/i }).click();
  await expect(page.getByRole("dialog", { name: /Sign in/i })).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Buy Credits/i })).not.toBeVisible();
});

test("G5-d#3 requireLogin: dismissing the sign-in modal returns Home", async ({ page }) => {
  await page.goto("/profile");
  const dialog = page.getByRole("dialog", { name: /Sign in/i });
  await expect(dialog).toBeVisible();
  // This dialog has no sticky title bar, so there is no Close button — Modal's own
  // Escape handler is the dismissal. AuthGuard passes onCancel, which router.replace()s
  // back to the locale home.
  //
  // Settle first (added 2026-08-19, after this flaked ~1 run in 3): `toBeVisible()`
  // is true while the modal is still fading in, and Modal registers its `keydown`
  // listener in an effect — so an Escape sent in that window is delivered to
  // nothing and the test waits forever for a navigation that will never happen.
  await page.waitForTimeout(300);
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
  // Funding added 2026-08-19. `DEFAULT_CREDITS` dropped 390 → 10 on 2026-08-12
  // and this test drives a real storyboard job, so it had been stopping at the
  // IAP upsell ever since — red before the credit-pricing work, not because of it.
  await fundAccount(page);
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
  // Funding added 2026-08-19. `DEFAULT_CREDITS` dropped 390 → 10 on 2026-08-12
  // and this test drives a real storyboard job, so it had been stopping at the
  // IAP upsell ever since — red before the credit-pricing work, not because of it.
  await fundAccount(page);
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
  // Slice 3f: DP's sell dialog is titled "Upgrade Your Plan".
  await expect(
    page.getByRole("dialog", { name: /Upgrade Your Plan|Muse Pro|Subscribe/i }),
  ).toBeVisible();
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

  // Retargeted 2026-08-07: drop 2 deleted `.now-playing__progress` along with
  // the whole desktop column, and the desktop seek now lives on the preview bar
  // — which a row's album art opens. S3 itself has not moved; only the surface
  // that has to honour it.
  //
  // The bar is opened BEFORE the metadata poll, not after. Picking a row swaps
  // `audio.src`, which resets duration to NaN — poll first and the number you
  // waited for belongs to a track that is no longer loaded. Same family as the
  // "never measure a DP overlay mid-animation" rule: the assertion passes, and
  // it describes something that no longer exists.
  await page.locator(".top-song__album-art").first().click();
  const bar = page.locator(".song-bar__progress");
  await expect(bar).toBeVisible();

  // The real <audio> the migrated player is built around. Wait for metadata
  // before seeking — currentTime cannot be set until duration is known.
  const audio = page.locator("audio");
  await expect
    .poll(async () => audio.evaluate((el: HTMLAudioElement) => el.duration || 0), {
      message: "audio metadata must load",
    })
    .toBeGreaterThan(60);

  // …and then for the BAR to have that duration too. Added 2026-08-19: waiting
  // only on `audio.duration` was a race, and it failed in the one way that looks
  // exactly like the bug this test guards. `SeekBar` computes its seek target as
  // `pct × max`, so a click landing before `max` arrives seeks to `0 × 0.9 = 0`
  // — a currentTime of 0, indistinguishable from "the 30s cap clamped me".
  await expect
    .poll(async () => Number((await bar.getAttribute("aria-valuemax")) ?? 0), {
      message: "the seek bar itself must know the duration before it can be clicked",
    })
    .toBeGreaterThan(60);

  // Seek to ~90% by clicking the progress bar. The old player clamped this to
  // `maxPct` (30/125) and opened SubscribeModal instead.
  //
  // `.song-bar` SLIDES IN, so a `boundingBox()` read the moment it becomes
  // visible describes a bar that has already moved by the time the click lands —
  // AGENTS.md's "never measure a DP overlay while it is still animating in", one
  // component further along. Wait until two consecutive reads agree.
  const box = await settledBox(bar);
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

  // Open the row menu on the first MV entry and flip Publish.
  //
  // A `switch`, not a `button`: the menu row is a label plus a `ToggleSwitch`
  // (`HistoryView.tsx:631-643`). The old `getByRole("button", …)` could never
  // match, so this test had been red independently of anything the credit work
  // touched — found while clearing the pre-existing failures on 2026-08-19.
  await page.getByRole("button", { name: "Options" }).first().click();
  await page
    .getByRole("switch", { name: /^Publish$/ })
    .first()
    .click();

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

  // Slice 3j: the DP-skinned EnhanceButton labels itself "Enhance" (DP's own
  // copy) instead of WA's "Enhance with AI". The behaviour under it is unchanged.
  const enhance = page.getByRole("button", { name: "Enhance", exact: true }).first();
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
  const songRow = chooseSong.locator(".mv-song-picker__row").first();
  await songRow.hover();
  await songRow.getByRole("button", { name: "Use", exact: true }).click();

  const confirm = trimConfirm(page);
  // Wait out the sheet's ENTRY transition before measuring anything geometric.
  // `.mv-sheet` scales 0.96 -> 1 over 300ms, so a `boundingBox()` taken while it
  // is still growing describes a card that no longer exists by `mouse.down()` —
  // the handle has moved out from under the cursor and the drag lands short.
  // Measured 2026-08-06: roughly one run in three failed exactly that way, and
  // the failure is indistinguishable from the floor not being enforced.
  await sheetSettled(page);
  // The default handles (15%–70% of a 114s track ≈ 63s) clear the floor, so the
  // dialog opens usable — otherwise this test would pass for the wrong reason.
  await expect(confirm).toBeEnabled();

  const startHandle = page.getByRole("slider", { name: "Trim start" });
  const endHandle = page.getByRole("slider", { name: "Trim end" });
  const startBox = await startHandle.boundingBox();
  const endBox = await endHandle.boundingBox();
  expect(startBox && endBox, "both trim handles must be rendered").toBeTruthy();

  // Each handle is `left: pct%` with `margin-left: -6px` and width 12px (DP's
  // `.mv-trim-sheet__handle`; WA's pre-3g-2 version spelled the same geometry as
  // `left: calc(pct% - 6px)`), so its CENTRE sits exactly on its percentage. Two
  // known centres (15% and 70%) give the track geometry without having to locate
  // the track element itself.
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
    // Which grid it is depends on the width, and that is the point of running
    // this at three of them: drop 2 added a third layout below 768px, so 700
    // now renders `.mv-detail__mobile-grid` where it used to render
    // `.mv-detail__grid`. Asserting "a grid, painted" keeps this a hydration
    // test rather than quietly becoming a layout test.
    const grid = width < 768 ? ".mv-detail__mobile-grid" : ".mv-detail__grid";
    await expect(page.locator(grid).first()).toBeVisible();
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

test("/explore/mvs: clicking a card NAVIGATES to /watch, it does not open a dialog", async ({
  page,
}) => {
  // Slice 3a kept WA's in-place `CommunityMvDialog` and this test asserted it,
  // with a note that a later slice moving to real navigation would be "a
  // deliberate decision — this test is where it should show up". It showed up on
  // 2026-08-06: DP's grid links at `/mv-detail?id=`, which is this app's
  // `/watch`, and the product owner reported the dialog as a DP mismatch.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/mvs");
  await page.locator(".mv-detail__grid-item").first().click();
  await page.waitForURL(/\/watch\?id=/);
  await expect(page.locator(".mv-player__stage")).toBeVisible();
  // And nothing modal is left behind on the way.
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("landing page: clicking a Trending MV lands on the same /watch screen", async ({ page }) => {
  // Item 7 of the same report. This route already navigated; the test exists so
  // that stays true — it and /explore/mvs must not drift into two behaviours.
  //
  // ── RE-POINTED WITH THE LANDING-PAGE MIGRATION (2026-08-07) ───────────────
  //
  // It used to drive `.marquee-animate button`, WA's own 45s infinite Trending
  // marquee — a rail DP does not have, deleted here on the product owner's
  // decision to follow DP. The RULE it guards outlived the rail, so the test was
  // re-pointed at `.new-mvs__item` (the "Trending Music Videos" row, which is
  // the surviving DP rail that reaches `/watch`) rather than deleted. The
  // `addStyleTag` that used to freeze the marquee animation went with the rail;
  // this row is a plain scroll container with nothing animating.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator(".new-mvs__item").first().click();
  await page.waitForURL(/\/watch\?id=/);
  await expect(page.locator(".mv-player__stage")).toBeVisible();
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

// ── DROP 2 REVERSED 3b's DESKTOP DECISION, AND THESE TWO REPLACE ITS GUARD ──
//
// The test that was here asserted "clicking a song swaps the right column
// without navigating". It was correct for exactly one day. DP drop `2670ed2`
// deleted the desktop Now Playing column outright — 54 `.now-playing__*` rules
// down to 2 — so the column that assertion described no longer has a stylesheet
// behind it, and the product owner chose to adopt DP (2026-08-07).
//
// It is the error log's rule arriving on schedule: **a test can hold a decision
// in place after the decision is wrong.** The assertion moved with `AC-EXP-03`
// rather than being argued with.
//
// Two tests, not one, because drop 2 SPLIT the row's affordances — and
// conflating them is precisely the mistake that produced a confident, wrong
// reading of this drop earlier in the week.

test("drop 2 desktop: clicking a song navigates to its result screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs");

  const title = await page.locator(".top-song__title").nth(1).innerText();
  await page.locator(".top-song__title").nth(1).click();

  await expect(page).toHaveURL(/\/song\/result\?id=.*from=song-detail/);
  // Seeded, not bounced: SongResultView replaces to /song/create when SongFlow
  // is empty, which is what made this look like a bigger change than it is.
  await expect(page.locator(".song-result__title")).toHaveText(title);
});

test("drop 2 desktop: the album art previews in place without navigating", async ({ page }) => {
  // The other half. If this ever navigates, the bar has no reason to exist.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs");

  await expect(page.locator(".song-bar")).toHaveCount(0);
  await page.locator(".top-song__album-art").nth(1).click();

  await expect(page.locator(".song-bar")).toBeVisible();
  await expect(page).toHaveURL(/\/explore\/songs$/);

  // Closing it puts the page back, so the bar cannot strand the list.
  await page.getByRole("button", { name: "Close player" }).click();
  await expect(page.locator(".song-bar")).toHaveCount(0);
});

test("drop 2: a community song id deep-links into /song/result with no flow state", async ({
  page,
}) => {
  // The claim that adopting DP's routing required "turning /song/result into a
  // shared player" rested on this: SongResultView.tsx replaces to /song/create
  // whenever SongFlow is empty, so a community id bounced straight back out.
  // A cold goto has no seeding click in front of it — this is the real test.
  await page.goto("/song/result?id=sp-pop-anthem&from=song-detail");

  await expect(page).toHaveURL(/\/song\/result/);
  await expect(page.locator(".song-result__title")).toHaveText("Pop Anthem");
});

test("drop 2: a community song offers no Recreate and no Publish", async ({ page }) => {
  // Product owner, 2026-08-07. DP varies nothing but the rail here, and porting
  // it verbatim would charge COST_SONG_RECREATE to re-roll a stranger's track
  // into the signed-in user's own History.
  await login(page);
  await page.goto("/song/result?id=sp-pop-anthem&from=song-detail");
  await expect(page.locator(".song-result__title")).toBeVisible();

  await expect(page.getByRole("button", { name: /Recreate/ })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Publish to community" })).toHaveCount(0);
  // The rail swaps rather than disappearing, and what STAYS matters as much as
  // what goes: a community song is exactly what "Use in Music Video" is for.
  await expect(page.locator(".song-result__creations-title")).toHaveText("Newly Released Songs");
  await expect(page.getByRole("button", { name: /Use in Music Video/ })).toBeVisible();
});

test("drop 2: a CREATED song keeps Recreate and Publish", async ({ page }) => {
  // The other direction of the same guard — without this, deleting the controls
  // outright would pass the test above.
  await login(page);
  await page.goto("/song/create");
  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await page.getByRole("button", { name: /Create Song/ }).click();
  await page.waitForURL("**/song/result", { timeout: 20_000 });

  await expect(page.getByRole("button", { name: /Recreate/ })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Publish to community" })).toBeVisible();
  await expect(page.locator(".song-result__creations-title")).toHaveText("My Creations");
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

  // Retargeted 2026-08-07 onto the preview bar: drop 2 deleted the desktop Now
  // Playing column this used to read. The BUG it guards is unchanged — a live
  // `displayedSongs[0]` default moves when the tab moves — and the bar is now
  // the thing that says what is playing, so it has to be started first.
  await page.locator(".top-song__album-art").first().click();
  const nowPlaying = page.locator(".song-bar__title");
  await expect(nowPlaying).toBeVisible();
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

  // The LIST is the assertion, not a player panel — that was always what EXP-09
  // is about, and it is the half drop 2 left untouched. The requested song has
  // to BE in it; asserting which row comes first only pins the fixture order.
  // `exact` matters: every row also has "Play/Like/Share <title>" controls, so a
  // substring match resolves to four elements and fails on strict mode.
  await expect(page.getByRole("button", { name: "Midnight Drive", exact: true })).toBeVisible();
  // And it is the creator's playlist, not the community catalog behind it —
  // `cps-*` ids belong to none of the three tabs, which is the whole point.
  await expect(page.getByRole("button", { name: "Golden Hour", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pop Anthem", exact: true })).toHaveCount(0);
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
  // The not-found state REPLACES the screen — no list behind it either.
  await expect(page.locator(".top-song")).toHaveCount(0);
});

test("3b / GL-02: Create still requires sign-in", async ({ page }) => {
  // NOT logged in. The gate is at the action, not the route.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore/songs");

  // The row's own Create, now that the panel-level CTA is gone. Same gate, same
  // GL-02 rule — this screen still must not reach /song/create logged out.
  await page.getByRole("button", { name: "Create" }).first().click();
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

test("drop 2 / A4: the song screen trades its phone tabs for a phone back control", async ({
  page,
}) => {
  // ── THIS TEST ASSERTED THE OPPOSITE UNTIL 2026-08-07, AND THAT IS THE POINT ─
  //
  // It used to require the tab pills to be usable at 375px, which the A4
  // override kept alive by hiding `.detail-navbar__top`. Drop 2 (`2670ed2`)
  // answers A5 by putting the new mobile BACK control inside `__top` — the very
  // row the override hid — while separately hiding `.detail-navbar__tabs` on
  // phones on purpose. Both halves cancelled: `/explore/songs` measured 375x50
  // with neither tabs nor a way back, and six gates stayed green through it.
  //
  // Product owner decided 2026-08-06 to FOLLOW DP. The cost is real and is
  // recorded rather than hidden: WA's three tabs are three different catalogs,
  // so a phone user now reaches the "All" catalog only. Asserting the loss
  // deliberately is what stops it being re-"fixed" by the next session.
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/explore/songs");

  await expect(page.locator(".tabs")).toBeHidden();

  // NO phone back here, and that is not the A5 bug — this screen passes
  // `hideMobileBar` on purpose because it is a mobile tab-bar destination, so
  // there is nothing to be trapped in. (The screens that DO need one are swept
  // by the A5 loop below, against `DETAIL_NAVBAR_ROUTES`.) The way out is the
  // tab bar, so assert that it is actually there.
  await expect(page.locator(".mobile-tabbar")).toBeVisible();

  // And the list itself must still be there — the failure mode this whole
  // family of tests exists for is chrome with nothing under it. `/explore/songs`
  // measured 375x50 with neither tabs nor content while six gates stayed green.
  await expect(page.locator(".top-song").first()).toBeVisible();
  await expect(page.locator(".top-song__title").first()).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3c — /profile + /settings migrated to DP's AccountPage
// ════════════════════════════════════════════════════════════════════════════

// A5's fix lives in DetailNavbar, so this sweep covers every route that renders
// one — and automatically covers each new migrated detail screen as it lands.
// DP used to hide `.detail-navbar` below 767px with no back in its MobileHeader,
// so the screens were enterable and not leavable on a phone. Measured on DP
// itself: 5 of its pages declared a back whose computed height was 0 at 375.
//
// The 2026-08-06 drop answers it upstream, and this test deliberately did NOT
// change with it. It asserts a usable back control exists at 375 — it never
// asserted WHICH element provides one — so the same assertions now cover DP's
// compact mobile bar instead of WA's deleted Tailwind row. A guard written
// against behaviour survives the implementation being replaced; one written
// against markup would have had to be rewritten, and a rewritten guard proves
// nothing about the migration it was meant to catch.
//
// Only the routes that NEED it: a screen the mobile tab bar can reach (Explore,
// Create, History) passes `hideMobileBar`, because back solves nothing there.
// Every migrated detail screen from here on gets it by default, so this list
// grows with the migration rather than being remembered.
const DETAIL_NAVBAR_ROUTES = ["/settings", "/watch"];

/**
 * A back control identified by its ACCESSIBLE NAME, not by its tag.
 *
 * These guards used to say `getByRole("button", { name: "Back" })`, which was
 * true of WA's own workaround and is not true of DP's — the 2026-08-06 drop's
 * control is an `<a>`, and R-9 requires it stay one. Widening the role is a
 * legitimate update; the assertion it feeds ("there is a usable way back at
 * 375px") has not moved an inch.
 *
 * Keeping the NAME half strict is the point. On a phone DP hides the visible
 * word "Back", so an unlabelled anchor computes to an empty accessible name and
 * this query finds nothing — which is exactly what happened on the first run of
 * the re-sync and is why `DetailNavbar` now labels the anchor unconditionally.
 * A `.detail-navbar__back` CSS selector would have passed straight through that.
 */
function backControl(page: import("@playwright/test").Page) {
  return page
    .getByRole(/* button or link */ "link", { name: "Back" })
    .or(page.getByRole("button", { name: "Back" }));
}

for (const route of DETAIL_NAVBAR_ROUTES) {
  test(`A5: ${route} has a working back control at 375px`, async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(route);

    const back = backControl(page);
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
  await expect(backControl(page)).toHaveCount(0);
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

  const back = backControl(page);
  await expect(back).toBeVisible();
  const box = await back.boundingBox();
  expect(box, "Back must have a real hit area, not a 0-height ghost").not.toBeNull();
  expect(box!.height).toBeGreaterThan(0);

  await back.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/profile");
});

test("3c: the Credits stat reaches /profile/credits, locale prefix intact", async ({ page }) => {
  // REWRITTEN 2026-08-19. The original assertion ("opens a dialog and stays on
  // /profile") was written when Credits was a modal and WA had no /credits
  // route. The designer request of 2026-08-11 made it a REAL route, and this
  // test was never updated — so it sat red until the spec audit ran it.
  //
  // What is worth guarding now is not "button vs link" but the navigation
  // itself, and specifically that it goes through `localePath()`. The tile is
  // still a <button> doing `router.push(localePath(...))` while its two
  // siblings are <Link>s, so it is the one stat that could silently lose the
  // locale prefix — R-9's failure mode, invisible in English.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Scoped to the stats row: the header's credit pill carries aria-label
  // "Credits" too, so an unscoped role query is a strict-mode violation.
  const statCredits = page.locator(".account-page__stats").getByRole("button", { name: /Credits/ });

  await page.goto("/profile");
  await statCredits.click();
  await page.waitForURL("**/profile/credits");

  // The half a grep cannot see: same control, non-default locale.
  await page.goto("/jpn/profile");
  await statCredits.click();
  await page.waitForURL("**/jpn/profile/credits");
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

test("3c: /profile has NO Notifications row — removed on purpose", async ({ page }) => {
  // INVERTED 2026-08-19. This used to assert the notification switch survived
  // the migration. The product owner then removed the row entirely on
  // 2026-08-14 (`ProfileView.tsx:240` — the web has no push/permission flow
  // behind it, so the control was local demo state that toggled a subtitle),
  // and nobody updated the test, so it sat red until the spec audit ran it.
  //
  // Kept rather than deleted, and inverted, for the reason this repo keeps
  // relearning: a deliberate ABSENCE that nothing asserts gets "fixed" back in
  // by the next person who reads the old spec. Same pattern as A19/A20.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/profile");

  // The rows that ARE meant to be there, so this cannot pass on a blank page.
  await expect(page.getByRole("button", { name: /Language/i })).toBeVisible();
  await expect(page.getByRole("switch", { name: /Notifications/i })).toHaveCount(0);
  await expect(page.getByText(/Notifications/i)).toHaveCount(0);
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
              return {
                cls: (el.className || "").toString().split(" ")[0],
                w: r.width,
                h: r.height,
              };
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

test("TODO#5: every ported seek bar is a keyboard-operable slider, not a bare div", async ({
  page,
}) => {
  // TODO.md #5 closed 2026-08-12. `/watch` (above) already used `SeekBar`; these are
  // the five that were still bare `<div onPointerDown>` — a Serious WCAG 2.1.1 failure.
  // Asserting the ROLE, not the class, is the point: the markup and class names were
  // deliberately unchanged by the swap, so only the a11y contract can prove it happened.
  //
  // `SongPlayBar` is here because it was the FIFTH — it arrived with the drop-2
  // re-sync after TODO #5 was written, carrying the same defect, and was on no list.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // /mv/edit — reachable with flow state seeded the way /history rows do it.
  await page.goto("/song/create");
  await page.getByPlaceholder(/A bittersweet love song/).fill("A slow piano ballad.");
  await page.getByRole("button", { name: /Create Song/i }).click();
  await page.waitForURL(/\/song\/(creating|result)/);
  await page.waitForURL(/\/song\/result/, { timeout: 30_000 });

  // Scope by name: the transport also has a volume <input type="range">, which is
  // ALSO role=slider and comes first in the DOM.
  const slider = page.getByRole("slider", { name: "Seek within the song" });
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute("aria-valuenow", /\d+/);
  await expect(slider).toHaveAttribute("tabindex", "0");
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

// ════════════════════════════════════════════════════════════════════════════
// Slice 3e — /creator migrated to DP's CommunityProfilePage
// ════════════════════════════════════════════════════════════════════════════

test("3e: all six options-menu actions exist and none of them is dead", async ({ page }) => {
  // The handoff flagged this screen because DP's own Download and Delete only
  // close the menu. The decision was to port all six and wire every one, so the
  // regression to guard is "a control is present but does nothing" — which no
  // screenshot and no render test can see. Each assertion below drives the
  // action and checks the state it is supposed to change.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/creator?self=1");

  const firstRow = page.locator(".community-profile__item").first();
  const title = await firstRow.locator(".community-profile__copy > strong").innerText();

  await firstRow.getByRole("button", { name: "More" }).click();
  const menu = page.locator(".community-profile__menu");
  await expect(menu).toBeVisible();

  // All six are present.
  await expect(menu.getByRole("menuitem", { name: /Edit MV/ })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /^(Like|Unlike)$/ })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Share" })).toBeVisible();
  await expect(menu.getByRole("switch")).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Download" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeVisible();

  // Publish: MV confirms first (MV-vs-Song split), then toasts.
  await menu.getByRole("switch").click();
  await expect(page.getByRole("dialog", { name: "Ready to Go Public?" })).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Submitted for review")).toBeVisible();

  // Delete: confirms, then the row actually leaves the list.
  const before = await page.locator(".community-profile__item").count();
  await firstRow.getByRole("button", { name: "More" }).click();
  await menu.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: "Delete" })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".community-profile__item")).toHaveCount(before - 1);
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

test("3e: Download triggers a real download, not a menu close", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/creator?self=1");

  const firstRow = page.locator(".community-profile__item").first();
  await firstRow.getByRole("button", { name: "More" }).click();

  const download = page.waitForEvent("download");
  await page
    .locator(".community-profile__menu")
    .getByRole("menuitem", { name: "Download" })
    .click();
  expect((await download).suggestedFilename()).toMatch(/\.(mp4|mp3)$/);
});

test("3e: switching tabs does NOT write the URL", async ({ page }) => {
  // 3b's lesson: a URL write is a page jump even with `replace`. DP changes tabs
  // with history.replaceState; porting that would turn /creator into a navigation.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/creator?self=1");

  await page.getByRole("button", { name: "Songs" }).click();
  await expect(page.locator(".community-profile__item").first()).toBeVisible();
  await expect(page).toHaveURL(/\/creator\?self=1$/);
});

test("3e: someone else's profile has no owner menu", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/creator");
  await expect(page.locator(".community-profile__item").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "More" })).toHaveCount(0);
  // Like and Share stay — they are public actions.
  await expect(page.getByRole("button", { name: "Like" }).first()).toBeVisible();
});

test("3e / A5: /creator has a working back control at 375px", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/creator?self=1");
  const back = backControl(page);
  await expect(back).toBeVisible();
  const box = await back.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(0);
});

test("3e / R9: row links carry the locale prefix", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/jpn/creator?self=1");
  await expect(page.locator(".community-profile__item-main").first()).toHaveAttribute(
    "href",
    /^\/jpn\//,
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3f — Credits IAP migrated to DP's CreditsDialog / UpgradeDialog / CreditsPage
// ════════════════════════════════════════════════════════════════════════════

/** Open Credits Detail from the Profile screen's Credits stat. */
async function openCreditsDetail(page: Page) {
  await page.goto("/profile");
  await page.getByText("Credits", { exact: true }).first().click();
  await expect(page.locator(".credits-page__balance")).toBeVisible();
}

test("3f / S20: the plan prices are WA's, not DP's — including the period suffix", async ({
  page,
}) => {
  // DP hardcodes $9.99 for Weekly and renders a literal "/ week" on ALL THREE
  // cards, Yearly included. Porting its markup verbatim would have shipped a
  // $59.99-per-week plan. This is the assertion that would have caught it.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openCreditsDetail(page);
  await page.getByRole("button", { name: /Get Muse Pro|Buy More/ }).click();

  const cards = page.locator(".upgrade-dialog__card");
  await expect(cards).toHaveCount(3);
  for (const [i, price, period] of [
    [0, "$19.99", "/ week"],
    [1, "$29.99", "/ week"],
    [2, "$59.99", "/ year"],
  ] as const) {
    await expect(cards.nth(i).locator(".upgrade-dialog__price")).toContainText(price);
    await expect(cards.nth(i).locator(".upgrade-dialog__price-period")).toHaveText(period);
  }
  await expect(page.getByText("$9.99")).toHaveCount(0);
});

test("3f / CR-06: a free account cannot reach Buy Credits", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openCreditsDetail(page);
  // The gate is on the button's own label, and on what it opens.
  await page.getByRole("button", { name: "Get Muse Pro" }).click();
  await expect(page.getByRole("dialog", { name: "Upgrade Your Plan" })).toBeVisible();
  await expect(page.locator(".credits-dialog__pack")).toHaveCount(0);
});

test("3f: subscribing from a card grants that plan's credits", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/profile");
  const before = await balance(page);

  await page.getByText("Credits", { exact: true }).first().click();
  await page.getByRole("button", { name: "Get Muse Pro" }).click();
  // DP's model is one Subscribe per card, not a shared selection — so which
  // card is clicked has to decide which plan is bought.
  await page
    .locator(".upgrade-dialog__card--featured")
    .getByRole("button", { name: "Subscribe" })
    .click();

  // Weekly Pro = 1,000 credits.
  await expect.poll(() => balance(page)).toBe(before + 1000);
});

test("3f: buying a pack adds exactly that pack's credits", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/profile");

  // Subscribe first — CR-06 means Buy Credits is unreachable otherwise.
  await page.getByText("Credits", { exact: true }).first().click();
  await page.getByRole("button", { name: "Get Muse Pro" }).click();
  await page
    .locator(".upgrade-dialog__card--featured")
    .getByRole("button", { name: "Subscribe" })
    .click();

  const before = await balance(page);
  await page.getByText("Credits", { exact: true }).first().click();
  await page.getByRole("button", { name: "Buy More" }).click();
  await expect(page.getByRole("dialog", { name: "Buy Credits" })).toBeVisible();

  // Default selection is the BEST VALUE pack (2,000).
  await page.getByRole("button", { name: /Buy Now/ }).click();
  await expect.poll(() => balance(page)).toBe(before + 2000);
});

test("3f: a closed dialog is not in the tab order", async ({ page }) => {
  // The `opacity: 0; pointer-events: none` trap G7 found on the lyrics overlay.
  // DP's dialog overlays have exactly that closed state, so if these were
  // always-mounted every page would carry six invisible pack buttons.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/profile");

  const focusable = await page.evaluate(
    () =>
      [...document.querySelectorAll(".credits-dialog button, .upgrade-dialog button")].filter(
        (el) => !el.closest("[inert]"),
      ).length,
  );
  expect(focusable).toBe(0);
});

test("3f: Escape closes the dialog", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openCreditsDetail(page);
  await page.getByRole("button", { name: "Get Muse Pro" }).click();
  await expect(page.getByRole("dialog", { name: "Upgrade Your Plan" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Upgrade Your Plan" })).toHaveCount(0);
});

test("3f: CR-05 Restore Purchases survived DP's footer", async ({ page }) => {
  // DP's footer is two dead `href="#"` links and has no Restore at all. WA's is
  // a real action, so it took the slot — this is the affordance-loss check.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openCreditsDetail(page);
  await page.getByRole("button", { name: "Get Muse Pro" }).click();
  await page.getByRole("button", { name: "Restore Purchases" }).click();
  await expect(page.getByText("No previous purchases found on this account.")).toBeVisible();
});

test("3f: the credit pill's coin icon actually paints", async ({ page }) => {
  // `.credit-balance img` is an ELEMENT selector with no mask treatment, so the
  // `<span className="credit-balance__icon">` this was ported as matched no rule
  // at all — 0x0 and transparent on every migrated screen since slice 2b. A mask
  // with nothing to clip is invisible without erroring, so nothing went red.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/watch");

  const box = await page.locator(".credit-balance img").first().boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(0);
  expect(box?.height ?? 0).toBeGreaterThan(0);
});

/**
 * Sweep whatever is on screen right now for mask icons that paint nothing. A
 * `mask-image` on an element with no background clips nothing; a mask sized by
 * an ELEMENT selector the port did not use is 0x0. Both are silent — no error,
 * and not reliably visible in a screenshot diff.
 *
 * Extracted from the 3f route sweep when 3g-2 needed to run it against overlays
 * that only exist while open, which no `page.goto()` can reach.
 */
async function invisibleMaskIcons(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const hidden = (el: Element) => {
      for (let n: Element | null = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === "none" || s.visibility === "hidden") return true;
      }
      return false;
    };
    return [...document.querySelectorAll("span, i")]
      .filter((el) => {
        const s = getComputedStyle(el);
        const mask = s.maskImage !== "none" ? s.maskImage : s.webkitMaskImage;
        if (!mask || mask === "none" || hidden(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return true;
        return (
          s.backgroundColor === "rgba(0, 0, 0, 0)" &&
          (!s.backgroundImage || s.backgroundImage === "none")
        );
      })
      .map((el) => el.className || el.tagName);
  });
}

test("3f: every mask icon on a migrated screen has something to clip", async ({ page }) => {
  // The general form of the two bugs above. Add each newly-migrated route here.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });

  for (const route of [
    "/watch",
    "/creator?self=1",
    "/profile",
    "/history",
    "/explore/mvs",
    "/mv/room", // slice 3g
    "/", // the landing page, migrated 2026-08-07
  ]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    expect(await invisibleMaskIcons(page), `invisible mask icons on ${route}`).toEqual([]);
  }
});

test("drop 2: SongPlayBar's icons have something to clip", async ({ page }) => {
  // The sweep above cold-`goto`s each route, and this bar does not exist until a
  // row's album art is clicked — so it would never be reached. Its own screen is
  // in the list; the bar is not, and a mask icon fails silently in two different
  // ways. `.song-bar__cover` is the one that must NOT be a mask: DP sizes it with
  // `width`/`height` and no `mask-*`, so a DpIcon there clips nothing.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/explore/songs");
  await page.locator(".top-song__album-art").first().click();
  await expect(page.locator(".song-bar")).toBeVisible();

  expect(await invisibleMaskIcons(page), "invisible mask icons on the song bar").toEqual([]);
  await expect(page.locator("img.song-bar__cover")).toBeVisible();
});

test("drop 2: /explore/mvs still has a grid on a phone", async ({ page }) => {
  // ── THE FAILURE THIS EXISTS FOR SHIPPED SIX GREEN GATES ────────────────────
  //
  // Drop 2's `MVDetailPage.css` hides every `.mv-detail__grid-section` below
  // 768px and expects `.mv-detail__mobile-grid` to take over. Re-copying it
  // verbatim — which G2-b requires — therefore rendered this screen BLANK on
  // phones: the grid still in the DOM, `display: none`, nothing painted.
  // typecheck, lint, vitest, build, guard-greps and designer-css were all green
  // through it, because a verbatim-copy gate cannot see markup two files away.
  for (const width of [320, 375, 767]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/explore/mvs");

    // Scoped to `--primary`, because BOTH sections render a mobile grid and only
    // the primary one is shown — see the Newly Released assertion below.
    const grid = page.locator(".mv-detail__grid-section--primary .mv-detail__mobile-grid");
    await expect(grid, `mobile grid at ${width}px`).toBeVisible();
    // Painted, not merely present — a zero-height grid is the same blank screen.
    const box = await grid.boundingBox();
    expect(box!.height, `mobile grid must have real height at ${width}px`).toBeGreaterThan(100);
    await expect(grid.locator(".mv-detail__mobile-column")).toHaveCount(2);
    await expect(grid.locator(".card--video").first()).toBeVisible();

    // THE ACCEPTED LOSS, ASSERTED SO IT CANNOT BE SILENTLY "FIXED". DP hides
    // every non-primary section on phones. That costs DP nothing (its second
    // section is the first one reversed) and costs WA a whole catalog: NEW_MVS
    // is desktop-only. Product owner decided 2026-08-07 to follow DP. If this
    // goes red, someone has re-added the section — which is a designer request
    // for a mobile two-section design, not a code fix.
    //
    // MEASURE IT BEFORE DEFENDING IT: TRENDING_MVS has **3** items and NEW_MVS
    // has **11**, so a phone reaches 3 of the 14 MVs in the catalog. The
    // decision was taken on "a secondary catalog is hidden"; the number was
    // counted afterwards and is recorded here and in DESIGNER-TODO A19 so the
    // next person weighs the real cost rather than the framing.
    await expect(
      page.locator(".mv-detail__grid-section:not(.mv-detail__grid-section--primary)"),
    ).toBeHidden();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3g — /mv/room page body migrated to DP's MVCreatePage
// ════════════════════════════════════════════════════════════════════════════

test("3g: the page renders DP's blocks, not the old Tailwind layout", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mv/room");
  await expect(page.locator(".mv-create__panel")).toBeVisible();
  await expect(page.locator(".mv-create__section")).toHaveCount(5);
  await expect(page.locator(".mv-create__side")).toBeVisible();
});

test("3g: the CTA docks to the viewport bottom and tracks its column", async ({ page }) => {
  // FloatingCTA is `position: fixed` and publishes its parent's geometry as
  // custom properties. If that effect stops running the bar silently falls back
  // to full viewport width — which a fullPage screenshot cannot show, because
  // fixed elements are captured at scroll 0 wherever the viewport happens to be.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mv/room");

  const cta = page.locator(".floating-cta");
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(901);
  // Aligned to the panel column, not the whole window.
  expect(box!.width).toBeLessThan(1440);
  expect(box!.x).toBeGreaterThan(0);
});

test("3g: the character photo name is editable (DP-only affordance)", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mv/room");

  // Add a photo via a sample face so a filled slot exists.
  await page.getByRole("button", { name: "Use sample photo" }).first().click();
  await expect(page.locator(".mv-create__photo-filled")).toHaveCount(1);
  await expect(page.locator(".mv-create__photo-name")).toHaveText("Name");

  await page.getByRole("button", { name: "Edit name" }).click();
  await page.locator(".mv-create__photo-name-input").fill("Ada");
  await page.keyboard.press("Enter");
  await expect(page.locator(".mv-create__photo-name")).toHaveText("Ada");
});

test("3g / S2: the trim entry point survived the migration", async ({ page }) => {
  // DP's song row has ONE control where WA has two (Edit trim vs Change song).
  // Collapsing them to DP's single button would have deleted the only way back
  // into the trim editor, and with it the only surface that enforces the 30s
  // floor — behaviour that stays green while the affordance disappears.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mv/room");

  await composeMv(page);

  await expect(page.locator(".mv-create__song-added")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit trim" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove song" })).toBeVisible();
});

test("3g / R9: the create-screen rail links carry the locale prefix", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/jpn/mv/room");
  await expect(page.locator(".mv-create__side-item").first()).toHaveAttribute("href", /^\/jpn\//);
  await expect(page.locator(".mv-create__side-see-all")).toHaveAttribute(
    "href",
    "/jpn/explore/mvs",
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3g-2 — /mv/room's six overlays migrated to DP's sheets
// ════════════════════════════════════════════════════════════════════════════

/**
 * Wait out the sheet's own fade before measuring anything about opacity.
 *
 * `toBeVisible()` is not enough and the first version of these tests learned it
 * the hard way: Playwright treats `opacity: 0` as visible, and DP's overlay
 * animates opacity over 300ms, so `getComputedStyle` right after the assertion
 * returns an INTERPOLATED value near 0 for every control in the sheet. The
 * failure looked exactly like the bug being guarded against.
 *
 * It also has to wait for the PREVIOUS sheet to leave. Choosing a song opens
 * Trim and closes Choose Song in the same commit, so for 300ms two sheets are
 * mounted — and the outgoing one is still near opacity 1 at the instant the
 * incoming one is still near 0. A naive "first overlay reads 1" check passes
 * immediately against the wrong sheet, then measures its controls as they fade.
 * So: settled means exactly one sheet in the DOM, at full opacity.
 */
async function sheetSettled(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const sheets = document.querySelectorAll(".mv-sheet, .face-picker");
        if (sheets.length !== 1) return -1;
        const overlay = sheets[0].closest(".mv-sheet-overlay, .face-picker-overlay");
        return overlay ? Number(getComputedStyle(overlay).opacity) : -1;
      }),
    )
    .toBe(1);
}

/** Open each of the overlays in turn and run `fn` while it is on screen and settled. */
async function forEachSheet(page: Page, fn: (name: string) => Promise<void>) {
  // Choose Song -> Trim Audio (the trim sheet is only reachable through it).
  await page.getByRole("button", { name: "Song Library" }).click();
  await expect(page.getByRole("dialog", { name: "Choose Song" })).toBeVisible();
  await sheetSettled(page);
  await fn("Choose Song");

  const songRow = page
    .getByRole("dialog", { name: "Choose Song" })
    .locator(".mv-song-picker__row")
    .first();
  await songRow.hover();
  await songRow.getByRole("button", { name: "Use", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Trim Audio" })).toBeVisible();
  await sheetSettled(page);
  await fn("Trim Audio");
  await trimConfirm(page).click();

  await page.getByRole("button", { name: "Open MV settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await sheetSettled(page);
  await fn("Settings");
  await page
    .getByRole("dialog", { name: "Settings" })
    .getByRole("button", { name: "Cancel" })
    .click();

  await page.getByRole("button", { name: "Templates" }).click();
  await expect(page.getByRole("dialog", { name: "Select a Template" })).toBeVisible();
  await sheetSettled(page);
  await fn("Select a Template");
  await page
    .getByRole("dialog", { name: "Select a Template" })
    .getByRole("button", { name: "Cancel" })
    .click();

  // Face Picker: a sample photo skips the file input, which Playwright cannot fill.
  // It goes straight into a filled slot, so the picker is exercised on its own below.

  await page
    .getByPlaceholder("Describe your video to help AI create a more compelling story.")
    .fill(MV_DESCRIPTION);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await expect(page.getByRole("dialog", { name: /How would you like to create/ })).toBeVisible();
  await sheetSettled(page);
  await fn("Mode");
}

test("3g-2: every mask icon inside the migrated sheets has something to clip", async ({ page }) => {
  // The 3f sweep can only see what a `goto` renders. These five only exist while
  // open, and every one of them carries masks DP paints as `<img>` somewhere else
  // on the same screen — the exact confusion that shipped `.{block}__close-icon`
  // and `.button__icon` blank.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");

  await forEachSheet(page, async (name) => {
    expect(await invisibleMaskIcons(page), `invisible mask icons in the ${name} sheet`).toEqual([]);
  });
});

test("3g-2: every control a sheet puts in the tab order is visible once focused", async ({
  page,
}) => {
  test.slow(); // focuses every control in five sheets and waits out each transition

  // DP hides the header check at >=768px with `opacity: 0; pointer-events: none`,
  // which is invisible to the eye and the mouse but NOT to the keyboard — the
  // defect G7 found on `.now-playing__lyrics-overlay`. `MvSheet` renders that
  // check only when the phone query matches, so on desktop it must not exist.
  //
  // WHY THE ASSERTION IS "VISIBLE WHEN FOCUSED", NOT "NEVER AT ZERO OPACITY".
  // A static sweep for opacity-0 focusables cannot express this screen: DP's
  // `.mv-song-picker__use` is DESIGNED to sit at zero until its row is active,
  // and the port makes focus one of the things that activates it. The invariant
  // that distinguishes the design from the defect is what happens on focus — so
  // this focuses each control in turn and requires it to be painted by then.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");

  await forEachSheet(page, async (name) => {
    const ghosts = await page.evaluate(async () => {
      const root = document.querySelector(".mv-sheet, .face-picker");
      if (!root) return ["NO SHEET IN THE DOM"];
      const sel = "a[href], button:not([disabled]), input, select, textarea, [tabindex]";
      const bad: string[] = [];
      for (const el of [...root.querySelectorAll(sel)] as HTMLElement[]) {
        el.focus();
        // Longest opacity transition on this screen is 300ms (the overlay);
        // the pill's own is 150ms.
        await new Promise((r) => setTimeout(r, 320));
        // Opacity multiplies down the tree, so an ancestor at 0 hides the subtree.
        let painted = 1;
        for (let n: Element | null = el; n; n = n.parentElement) {
          painted *= Number(getComputedStyle(n).opacity);
        }
        if (painted === 0) bad.push(el.className || el.tagName);
      }
      return bad;
    });
    expect(ghosts, `focusable but unpainted controls in the ${name} sheet`).toEqual([]);
  });
});

test("3g-2 / S2: the 30s floor blocks DP's footer Confirm, not just WA's old button", async ({
  page,
}) => {
  // The floor moved from a WA-authored button to DP's Cancel/Confirm footer. The
  // rule is only enforced if the NEW control is the one that goes disabled — a
  // port that styled the footer but left the guard on the old element would look
  // right and charge for a 4-second MV.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");

  await page.getByRole("button", { name: "Song Library" }).click();
  const songRow = page
    .getByRole("dialog", { name: "Choose Song" })
    .locator(".mv-song-picker__row")
    .first();
  await songRow.hover();
  await songRow.getByRole("button", { name: "Use", exact: true }).click();

  const sheet = page.getByRole("dialog", { name: "Trim Audio" });
  await expect(sheet.locator(".mv-trim-sheet__waveform")).toBeVisible();
  // Same reason as the older S2 test: measure only after the scale-in finishes.
  await sheetSettled(page);
  await expect(trimConfirm(page)).toBeEnabled();

  const endHandle = page.getByRole("slider", { name: "Trim end" });
  const startBox = (await page.getByRole("slider", { name: "Trim start" }).boundingBox())!;
  const endBox = (await endHandle.boundingBox())!;
  const startCentre = startBox.x + startBox.width / 2;
  const endCentre = endBox.x + endBox.width / 2;
  const trackWidth = (endCentre - startCentre) / 0.55;
  const y = endBox.y + endBox.height / 2;

  await page.mouse.move(endCentre, y);
  await page.mouse.down();
  await page.mouse.move(startCentre - 0.15 * trackWidth + 0.25 * trackWidth, y, { steps: 12 });
  await page.mouse.up();

  await expect(trimConfirm(page)).toBeDisabled();
  await expect(sheet.getByText(/minimum 30s/)).toBeVisible();
});

test("3g-2: the Choose Song 'Use' pill is reachable by keyboard, not hover only", async ({
  page,
}) => {
  // DP ships `.mv-song-picker__use` at `opacity: 0; pointer-events: none`,
  // revealed by `:hover`. Ported as designed that leaves one invisible, unusable
  // but FOCUSABLE pill per row. The port makes focus inside a row count as
  // active, which needs no new CSS — the designer stylesheets are gated verbatim.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");

  await page.getByRole("button", { name: "Song Library" }).click();
  const use = page
    .getByRole("dialog", { name: "Choose Song" })
    .locator(".mv-song-picker__row")
    .first()
    .getByRole("button", { name: "Use", exact: true });

  // Before focus: DP's hidden state. Focus alone must reveal AND enable it.
  await sheetSettled(page);
  expect(await use.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  await use.focus();
  await expect(use).toBeFocused();
  // `opacity` is animated over 150ms, so poll rather than read once — the first
  // version of this test read an interpolated 0 and failed for the wrong reason.
  await expect.poll(() => use.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  expect(await use.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("auto");

  // And it actually works from the keyboard.
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Trim Audio" })).toBeVisible();
});

test("3g-2: DP's sheet chrome replaced WA's Modal on every overlay", async ({ page }) => {
  // A shape check, so a half-migrated overlay cannot hide behind green behaviour
  // tests: each one must be a `.mv-sheet` (or the face picker's own DP block),
  // and none of them WA's old `Modal`.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");

  await forEachSheet(page, async (name) => {
    await expect(page.locator(".mv-sheet"), `${name} should be the only DP sheet`).toHaveCount(1);
    await expect(page.locator(".mv-sheet__footer-btn--confirm")).toHaveCount(
      name === "Choose Song" || name === "Mode" ? 0 : 1,
    );
  });
});

test("3g-2: the face picker wears DP's block and still crops the real upload", async ({ page }) => {
  // DP's face picker is a canned demo over one bundled group photo. WA's takes
  // the user's own file. The port keeps WA's crop inside DP's shell, so both the
  // block AND the real controls have to be present.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");

  await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
    name: "face.png",
    mimeType: "image/png",
    // 1x1 PNG — enough for the canvas crop to succeed.
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });

  const picker = page.getByRole("dialog", { name: "Select a Face" });
  await expect(picker).toBeVisible();
  await expect(page.locator(".face-picker__preview")).toBeVisible();
  await expect(page.getByRole("slider", { name: "Crop size" })).toBeVisible();

  await page.getByRole("button", { name: "Use This Face", exact: true }).click();
  await expect(page.locator(".mv-create__photo-filled")).toHaveCount(1);
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3h — /mv/thinking + /mv/storyboard (one DP file, two stages)
// ════════════════════════════════════════════════════════════════════════════

test("3h: both stages render DP's blocks, not the old Tailwind layout", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");
  await fundAccount(page);
  await composeMv(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create Storyboard First").click();

  // Stage 1 — processing. Caught before it completes; the mock job takes seconds.
  await expect(page.locator(".mv-storyboard--processing")).toBeVisible();
  await expect(page.locator(".mv-storyboard-processing__card")).toBeVisible();
  await expect(page.locator(".mv-storyboard-processing__progress-fill")).toBeVisible();

  // Stage 2 — edit.
  await page.waitForURL("**/mv/storyboard");
  await expect(page.locator(".mv-storyboard__panel")).toBeVisible();
  await expect(page.locator(".mv-storyboard__side")).toBeVisible();
  // The six sections DP's phone reorder addresses by class. A missing modifier
  // does not break the desktop layout at all — it silently drops that section to
  // the end of the single-column phone sequence, which is invisible at 1440.
  for (const mod of ["visual-style", "story", "story-line", "char-image", "mv-song", "lyrics"]) {
    await expect(
      page.locator(`.mv-storyboard__section--${mod}`),
      `section modifier --${mod} must survive the port`,
    ).toHaveCount(1);
  }
});

test("3h: every mask icon on both storyboard stages has something to clip", async ({ page }) => {
  // Neither stage is reachable by `goto` — both guard on flow state — so the 3f
  // route sweep structurally cannot cover them.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");
  await composeMv(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create Storyboard First").click();

  await expect(page.locator(".mv-storyboard-processing__card")).toBeVisible();
  expect(await invisibleMaskIcons(page), "invisible mask icons on /mv/thinking").toEqual([]);

  await page.waitForURL("**/mv/storyboard");
  await expect(page.locator(".mv-storyboard__panel")).toBeVisible();
  expect(await invisibleMaskIcons(page), "invisible mask icons on /mv/storyboard").toEqual([]);
});

test("3h: the character image's Download and Expand survived, and Expand really opens", async ({
  page,
}) => {
  // Both are DP-only affordances this slice ADDED, and both are the icon shape
  // that fails silently: `.mv-storyboard__char-download img` is an ELEMENT
  // selector setting width/height only, so porting them as `DpIcon` spans would
  // give two 0x0 holes inside two visible circles.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");
  await fundAccount(page);
  await composeMv(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create Storyboard First").click();
  await page.waitForURL("**/mv/storyboard");

  for (const label of ["Download character image", "Expand character image"]) {
    const box = await page.getByRole("button", { name: label }).locator("img").boundingBox();
    expect(box?.width ?? 0, `${label} icon must have a size`).toBeGreaterThan(0);
  }

  await page.getByRole("button", { name: "Expand character image" }).click();
  const preview = page.getByRole("dialog", { name: "Character image preview" });
  await expect(preview).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
});

test("3h: STORY LINE collapses, and the scenes are the job's, not DP's mock", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");
  await composeMv(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create Storyboard First").click();
  await page.waitForURL("**/mv/storyboard");

  // DP hardcodes exactly four `MOCK_SCENES`; these come from the storyboard the
  // mock backend generated, so the count tracks the job rather than the design.
  const scenes = page.locator(".mv-storyboard__scene");
  const count = await scenes.count();
  expect(count).toBeGreaterThan(0);

  const toggle = page.getByRole("button", { name: /STORY LINE/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(scenes).toHaveCount(0);
  await toggle.click();
  await expect(scenes).toHaveCount(count);
});

test("3h / GL-01: the storyboard CTA still states its cost and still gates on it", async ({
  page,
}) => {
  // DP's CTA reads "Create MV", navigates unconditionally, and never says what
  // it costs. This is the second place a 200-credit charge can start, so both
  // the number and the gate have to survive the reskin.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");
  await fundAccount(page);
  await composeMv(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create Storyboard First").click();
  await page.waitForURL("**/mv/storyboard");

  const cta = page.locator(".mv-storyboard__cta");
  await expect(cta).toContainText("Create MV");
  await expect(cta).toContainText("200");
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3i — /mv/result migrated to DP's MVResultPage
// ════════════════════════════════════════════════════════════════════════════

/** Compose an MV and take the direct-render path all the way to /mv/result. */
async function renderToResult(page: Page) {
  await page.goto("/mv/room");
  await composeMv(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create MV Directly").click();
  await page.waitForURL("**/mv/result", { timeout: 60_000 });
  await expect(page.locator(".mv-result__player")).toBeVisible();
}

test("3i: the result page renders DP's blocks and picks a layout from the aspect", async ({
  page,
}) => {
  test.slow(); // a full mock render
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await renderToResult(page);

  await expect(page.locator(".mv-result__panel")).toBeVisible();
  await expect(page.locator(".mv-result__side")).toBeVisible();
  // DEFAULT_SETTINGS.ratio is 9:16, so DP's portrait treatment (blurred backdrop
  // behind a pillarboxed video) is the one that must be applied.
  await expect(page.locator(".mv-result__player--portrait")).toHaveCount(1);
  await expect(page.locator(".mv-result__bg")).toBeVisible();
});

test("3i: every mask icon on the result page has something to clip", async ({ page }) => {
  // /mv/result guards on flow state, so the 3f route sweep cannot reach it. This
  // screen also mixes both icon kinds one line apart — `.mv-result__action img`
  // is a real <img>, the control/reaction/publish icons are masks.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await renderToResult(page);

  expect(await invisibleMaskIcons(page), "invisible mask icons on /mv/result").toEqual([]);

  // And the other half of the trap: the four quick-action icons must have a size.
  for (const label of ["Download", "Share", "Edit MV", "Recreate"]) {
    const box = await page
      .getByRole("button", { name: label, exact: true })
      .locator("img")
      .boundingBox();
    expect(box?.width ?? 0, `${label} icon must have a size`).toBeGreaterThan(0);
  }
});

test("3i / MV-12 + MV-13: publish confirms first, and blocks Edit until unpublished", async ({
  page,
}) => {
  // DP's Publish toggle flips with no confirmation and its Edit MV is an
  // unconditional link, so both rules are WA-only and both are the kind that
  // survive a reskin as dead state.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await renderToResult(page);

  await expect(page.getByRole("button", { name: "Edit MV", exact: true })).toBeVisible();

  // MV-12: turning it ON asks first, and cancelling leaves it off.
  await page.getByRole("switch", { name: "Publish to community" }).click();
  const confirm = page.getByRole("dialog", { name: "Ready to Go Public?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("switch", { name: "Publish to community" })).toHaveAttribute(
    "aria-checked",
    "false",
  );

  await page.getByRole("switch", { name: "Publish to community" }).click();
  await page
    .getByRole("dialog", { name: "Ready to Go Public?" })
    .getByRole("button", {
      name: "Confirm",
    })
    .click();
  await expect(page.getByRole("switch", { name: "Publish to community" })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // MV-13: the Edit slot is now Unpublish, not gone.
  await expect(page.getByRole("button", { name: "Edit MV", exact: true })).toHaveCount(0);
  const unpublish = page.getByRole("button", { name: "Unpublish to edit" });
  await expect(unpublish).toBeVisible();

  // Unpublishing is immediate — no second confirm — and Edit comes back.
  await unpublish.click();
  await expect(page.getByRole("button", { name: "Edit MV", exact: true })).toBeVisible();
});

test("3i: the DETAIL list kept the three rows DP dropped", async ({ page }) => {
  // DP's DETAIL has six rows and none of them is Music, Scenes or Character.
  // Those came from WA's `MvDetail`, and dropping them is exactly the silent
  // information loss the /watch migration was pulled up on (DESIGNER-TODO A14).
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await renderToResult(page);

  const detail = page.locator(".mv-result__section").last();
  for (const key of [
    "Author",
    "MV Type",
    "Music",
    "Aspect Ratio",
    "Quality",
    "Scenes",
    "Character",
    "Subtitle",
    "Watermark",
  ]) {
    await expect(detail.getByText(key, { exact: true }), `DETAIL row "${key}"`).toBeVisible();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3j — /song/create + /song/creating + /song/result (one DP file, 3 stages)
// ════════════════════════════════════════════════════════════════════════════

test("3j: all three song stages render DP's blocks", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");

  await expect(page.locator(".song-create__panel")).toBeVisible();
  await expect(page.locator(".song-create__side")).toBeVisible();

  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await page.getByRole("button", { name: /Create Song/ }).click();

  await expect(page.locator(".song-processing__wave")).toBeVisible();
  await expect(page.locator(".song-processing__progress-fill")).toBeVisible();

  await page.waitForURL("**/song/result", { timeout: 30_000 });
  await expect(page.locator(".song-result__player")).toBeVisible();
  await expect(page.locator(".song-result__creations")).toBeVisible();
});

test("3j: every mask icon on the migrated song stages has something to clip", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });

  await page.goto("/song/create");
  await page.waitForLoadState("networkidle");
  expect(await invisibleMaskIcons(page), "invisible mask icons on /song/create").toEqual([]);

  // Custom mode has a different control set (info button, Lyrics idea button).
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await expect(page.locator(".song-create__style")).toBeVisible();
  expect(await invisibleMaskIcons(page), "invisible mask icons on /song/create custom").toEqual([]);

  await page.getByRole("button", { name: "Simple", exact: true }).click();
  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await page.getByRole("button", { name: /Create Song/ }).click();
  await page.waitForURL("**/song/result", { timeout: 30_000 });
  await expect(page.locator(".song-result__player")).toBeVisible();
  expect(await invisibleMaskIcons(page), "invisible mask icons on /song/result").toEqual([]);
});

test("3j / S4: the Tempo and Key CONTROLS are gone; the contract fields are not", async ({
  page,
}) => {
  // S4 removes BPM/Key from this form. §11 says removing the FIELDS is a C8
  // change needing its own PR, so this slice removes only the controls — the
  // distinction is the whole point, and a later session must not "finish the
  // job" here by accident.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await page.getByRole("button", { name: "Custom", exact: true }).click();

  await expect(page.getByRole("slider", { name: "Tempo (BPM)" })).toHaveCount(0);
  await expect(page.getByText(/\d+ BPM/)).toHaveCount(0);
  // Genre / Mood / Vocal are the three chip groups that DO survive.
  await expect(page.locator(".song-create__chip-group")).toHaveCount(3);
});

test("3j / 2026-08-24: an Idea fill in both tabs, and Custom keeps a separate Lyrics fill", async ({
  page,
}) => {
  // These buttons were REMOVED on 2026-08-06 and restored on 2026-08-24 with the
  // product owner's own copy behind them (`src/lib/mv/songIdeas.ts`). Both halves
  // are worth pinning: a drop that re-applies the old "re-remove Idea" note would
  // delete a requested control, and a fill that silently repeats what is already in
  // the box looks like a dead button.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");

  const describe = page.getByPlaceholder(/A bittersweet love song/);
  const idea = page.getByRole("button", { name: "Idea", exact: true });

  await idea.click();
  const first = await describe.inputValue();
  expect(SONG_IDEA_PROMPTS).toContain(first);
  // Simple's CTA is gated on `describe`, so the fill has to unlock it (AC-SONG-01).
  await expect(page.getByRole("button", { name: /Create Song/ })).toBeEnabled();
  // Random, but never the string already there — a no-op click reads as broken.
  await idea.click();
  expect(await describe.inputValue()).not.toBe(first);

  await page.getByRole("button", { name: "Custom", exact: true }).click();
  const lyrics = page.getByRole("textbox", { name: "Lyrics" });

  await page.getByRole("button", { name: "Lyrics", exact: true }).click();
  const sheet = await lyrics.inputValue();
  expect(LYRIC_PRESETS).toContain(sheet);
  expect(sheet).toContain("[chorus]"); // the format is the point of that control

  // Same box, other pool: Custom's Idea writes a brief, not a lyric sheet.
  await page.getByRole("button", { name: "Idea", exact: true }).click();
  expect(SONG_IDEA_PROMPTS).toContain(await lyrics.inputValue());

  // Instrumental: Lyrics goes with the other lyric-only controls, Idea stays.
  await page.getByRole("switch", { name: "Instrumental" }).click();
  await expect(page.getByRole("button", { name: "Lyrics", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Idea", exact: true })).toBeVisible();
});

test("3j / SONG-03: Recreate names its price and gates on the balance", async ({ page }) => {
  // DP's Recreate is free and just returns to the form. WA's is a paid re-roll,
  // which is exactly the kind of rule a reskin drops without anything going red.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await page.getByRole("button", { name: /Create Song/ }).click();
  await page.waitForURL("**/song/result", { timeout: 30_000 });

  const recreate = page.locator(".song-result__cta-secondary");
  await expect(recreate).toContainText("Recreate");

  // ⚠️ This used to assert the button also showed "50". It NEVER passed:
  // `.song-result__cta-secondary` renders an icon + the word "Recreate" and no
  // price — verified 2026-08-12 by reading the received text ("Recreate"), and the
  // markup is unchanged since the 3j migration. AC-SONG-12 only requires the charge
  // and the gate, not a label, so the assertion over-reached the spec.
  //
  // What IS the rule, and what this now guards: a Recreate is a PAID re-roll, and
  // below the price it must route to IAP instead of regenerating. Since 2026-08-12
  // that price is one normal generation (6 vocal / 12 instrumental), not a flat 50.
  // The account starts on 10 and this song cost 6, leaving 4 — under the 6 needed.
  await expect(page.getByTestId("credit-balance").first()).toContainText("4");
  await recreate.click();
  await expect(
    page.getByRole("dialog", { name: /Upgrade Your Plan|Muse Pro|Buy Credits/i }),
  ).toBeVisible();

  // The missing price LABEL is a real affordance gap (a paid action with no warning)
  // — raised as DESIGNER-TODO A23, not silently accepted here.
});

test("3j: the result still says what was generated, not just its title", async ({ page }) => {
  // DP's `.song-result__meta` holds the title alone. Genre/mood is the only
  // description of the generated track on this screen — the A14 loss shape.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await page.getByRole("button", { name: /Create Song/ }).click();
  await page.waitForURL("**/song/result", { timeout: 30_000 });

  await expect(page.locator(".song-result__meta")).toContainText(/Pop · Uplifting/);
});

// ════════════════════════════════════════════════════════════════════════════
// Slice 3k — /mv/edit, the last route (A12 closed)
// ════════════════════════════════════════════════════════════════════════════

/** Compose an MV, render it directly, and open the editor from the result. */
async function openEditor(page: Page) {
  await page.goto("/mv/room");
  // Weekly Pro (1,000), not Weekly (200). Until 2026-08-19 a direct render was a
  // flat 200 and Weekly's 210 was chosen so the leftover balance would sit UNDER
  // the scene-recreate cost. Spec 11 §3.2 prices the render per second now — the
  // fixture song is minutes long, so 200 no longer even covers the render and
  // the flow stopped at the IAP instead of reaching the editor. The downstream
  // test reads the recreate price off its own button rather than assuming a
  // leftover, so overshooting here is safe.
  await fundAccount(page, "weekly_pro");
  await composeMv(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  await page.getByText("Create MV Directly").click();
  await page.waitForURL("**/mv/result", { timeout: 60_000 });
  await page.getByRole("button", { name: "Edit MV", exact: true }).click();
  await page.waitForURL("**/mv/edit", { timeout: 20_000 });
  await expect(page.locator(".mv-edit__panel")).toBeVisible();
}

test("3k: /mv/edit renders DP's blocks, and the scene editor is its own section", async ({
  page,
}) => {
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openEditor(page);

  await expect(page.locator(".mv-edit__side")).toBeVisible();
  await expect(page.locator(".mv-edit__preview")).toBeVisible();
  // `.mv-edit__section--scene-editor` is `display: none` below 768px and
  // `MobileSceneDetail` replaces it. Nesting it inside --storyboard (which was
  // the first attempt) makes that rule match nothing and leaks the desktop
  // editor onto phones — invisible at 1440, wrong at 375.
  await expect(page.locator(".mv-edit__section--scene-editor")).toHaveCount(1);
  // The six sections DP's phone reorder addresses by class.
  for (const mod of ["storyboard", "scene-editor", "cover", "title", "author"]) {
    await expect(
      page.locator(`.mv-edit__section--${mod}`),
      `section modifier --${mod} must survive the port`,
    ).toHaveCount(1);
  }
});

test("3k: the desktop scene editor does not leak onto phones", async ({ page }) => {
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await openEditor(page);

  await expect(page.locator(".mv-edit__section--scene-editor")).toBeHidden();
  await expect(page.locator(".mv-edit__preview")).toBeHidden();

  // Tapping a clip opens DP's full-screen editor instead.
  await page.locator(".mv-edit__clip").first().click();
  const sheet = page.getByRole("dialog", { name: /Scene \d/ });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator(".mv-edit-mobile-scene__preview-video")).toBeVisible();
  await sheet.getByRole("button", { name: "Back" }).click();
  await expect(sheet).toHaveCount(0);
});

test("3k: every mask icon on /mv/edit has something to clip", async ({ page }) => {
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openEditor(page);
  expect(await invisibleMaskIcons(page), "invisible mask icons on /mv/edit").toEqual([]);

  // And the <img>-shaped rules on this screen, checked the other way round.
  // `.mv-edit__recreate-scene` is the shared Button component, whose coin is
  // `.button__icon` WITHOUT `--mask` — the modifier is what paints, so a mask
  // span there is the `/watch` arrow bug again.
  for (const sel of [
    ".mv-edit__merge-credits img",
    ".mv-edit__regen-credits img",
    ".mv-edit__recreate-scene .button__icon",
  ]) {
    const box = await page.locator(sel).first().boundingBox();
    expect(box?.width ?? 0, `${sel} must have a size`).toBeGreaterThan(0);
  }
});

test("3k / MV-08: Merge is inert until something is edited, then it costs", async ({ page }) => {
  // DP's Merge is always live and free. WA charges for it, so an always-enabled
  // Merge would let a user pay to re-render an unchanged video — the rule is
  // WA-only and exactly the kind a reskin drops silently. The price is spec 11
  // §3.6's flat `COST_MERGE`, no longer the full render cost.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openEditor(page);

  const merge = page.locator(".mv-edit__merge-btn");
  await expect(merge).toBeDisabled();
  await expect(merge).toContainText(String(COST_MERGE));

  // Any edit arms it — here, an output-settings change.
  await page.getByRole("switch", { name: "Show Watermark" }).click();
  await expect(merge).toBeEnabled();
});

test("3k / GL-01: Recreate routes to IAP when the balance cannot cover it", async ({ page }) => {
  // Two Recreates on this screen and DP charges for neither. Drain the balance
  // with two full generations, then check the gate. The scene price is now
  // per-shot (spec 11 §3.5, `recreate` 8 + per-second by shot kind), so it is
  // read off the button rather than compared to a constant.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openEditor(page);
  const before = await balance(page);

  // ⚠️ Recreate starts DISABLED and only enables once THIS scene's prompt has
  // actually been edited (designer request, 2026-08-11 — recreating an untouched
  // scene would spend COST_REGEN on a result the edit did not drive). The test
  // predates that rule and clicked the disabled button, so it could not pass in
  // either branch; edit the prompt first. Found 2026-08-12.
  await page
    .getByRole("textbox", { name: /^Scene / })
    .first()
    .fill("A neon alley in the rain.");
  const recreate = page.locator(".mv-edit__recreate-scene");
  await expect(recreate).toBeEnabled();

  // Whatever the button says is what must happen — refused below it, charged
  // exactly at or above it. Never less than the flat `recreate` component.
  const scenePrice = await shownCost(page, ".mv-edit__recreate-scene .button__credits-count");
  expect(
    scenePrice,
    "a shot recreate always includes the flat `recreate` 8",
  ).toBeGreaterThanOrEqual(COST_RECREATE);

  if (before < scenePrice) {
    await recreate.click();
    await expect(
      page.getByRole("dialog", { name: /Upgrade Your Plan|Muse Pro|Buy Credits/i }),
    ).toBeVisible();
    expect(await balance(page), "a refused recreate must not charge").toBe(before);
  } else {
    await recreate.click();
    await expect.poll(() => balance(page)).toBe(before - scenePrice);
  }
});

test("3k: Delete this Project confirms before discarding", async ({ page }) => {
  // DP ships this control with a dead handler. Per the /creator precedent it is
  // wired — but to a confirm first, and then only to discarding the in-memory
  // flow, not to an invented backend delete.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openEditor(page);

  await page.locator(".mv-edit__delete-btn").click();
  const confirm = page.getByRole("dialog", { name: "Delete" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Cancel" }).click();
  expect(new URL(page.url()).pathname).toBe("/mv/edit");

  await page.locator(".mv-edit__delete-btn").click();
  await page
    .getByRole("dialog", { name: "Delete" })
    .getByRole("button", { name: "Delete" })
    .click();
  await page.waitForURL("**/history");
});

// ════════════════════════════════════════════════════════════════════════════
// G7 acceptance findings — affordances the migration lost, and their guards
//
// Every one of these shipped through typecheck, lint, vitest, e2e 150/150 and
// visual 115/115. They are affordances, not rules, and no gate looked at them
// until a reviewer diffed the migrated components control-by-control against
// the pre-migration code. These tests are what stops each one coming back.
// ════════════════════════════════════════════════════════════════════════════

test("G7 3i-1: the finished MV can be un-muted", async ({ page }) => {
  // Pre-migration this was a `<video controls>`, so volume came free with the
  // native bar. DP's bar is hand-built and has no volume control at all, so
  // porting it verbatim left the audio of a COST_RENDER render unreachable.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await renderToResult(page);

  const video = page.locator(".mv-result__video");
  await expect(video).toHaveJSProperty("muted", true);

  await page.getByRole("button", { name: "Unmute" }).click();
  await expect(video).toHaveJSProperty("muted", false);
  await page.getByRole("button", { name: "Mute" }).click();
  await expect(video).toHaveJSProperty("muted", true);
});

test("G7 3g2-1: the Settings sheet's Cancel actually cancels", async ({ page }) => {
  // Every control in this sheet commits on touch, so a Cancel wired to onClose
  // did exactly what Confirm did. The Cancel is the migration's own addition —
  // the pre-migration Modal had no footer — which is what made it easy to miss.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/mv/room");

  const chips = page.locator(".mv-create__settings-chips");
  await expect(chips).toContainText("9:16");

  await page.getByRole("button", { name: "Open MV settings" }).click();
  await sheetSettled(page);
  await page.getByRole("button", { name: "16:9" }).click();
  await page.locator(".mv-sheet__footer-btn--cancel").click();
  await expect(chips).toContainText("9:16");

  // ...and Confirm still keeps the change, or "Cancel reverts" would be
  // satisfied by a sheet that never commits anything at all.
  await page.getByRole("button", { name: "Open MV settings" }).click();
  await sheetSettled(page);
  await page.getByRole("button", { name: "16:9" }).click();
  await page.locator(".mv-sheet__footer-btn--confirm").click();
  await expect(chips).toContainText("16:9");
});

test("G7 3g-3: a rail titled for the user's own work does not show other people's", async ({
  page,
}) => {
  // Both create screens titled their rail "My Creations" when logged in while
  // rendering community fixtures with other creators' names underneath. Both
  // routes are auth-guarded, so the lying branch was the one almost every user
  // saw. The assertion is on the pairing, not on the wording: a rail may say
  // "My Creations" only if its items link into the user's own creations.
  //
  // 2026-08-06: the rail now has TWO modes again (items 4/5), so the pairing is
  // checked against the ITEM hrefs rather than "See all" — DP drops "See all"
  // entirely in the My Creations branch, so its absence is not evidence.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });

  for (const [url, rail, item, own] of [
    ["/mv/room", ".mv-create__side-title", ".mv-create__side-item", "/mv/result"],
    ["/song/create", ".song-create__side-title", ".song-create__side-item", "/song/result"],
  ] as const) {
    await page.goto(url);
    const title = (await page.locator(rail).innerText()).trim();
    const hrefs = await page
      .locator(item)
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
    expect(hrefs.length, `${url} rail has no items`).toBeGreaterThan(0);
    for (const href of hrefs) {
      if (/my creations/i.test(title)) {
        expect(href, `"${title}" on ${url} must lead to the user's own work`).toContain(own);
      } else {
        expect(href, `"${title}" on ${url} must lead to community content`).not.toContain(own);
      }
    }
  }
});

test("items 4/5: a signed-in user with nothing generated still sees Trending", async ({ page }) => {
  // DP can key this on `isSignedIn` alone because its MY_CREATIONS fixture is
  // never empty. WA's comes from real (session-local) History, so the signed-in
  // branch has to also require that the user HAS something — otherwise the rail
  // is a "My Creations" heading over nothing.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });

  await page.goto("/mv/room");
  await expect(page.locator(".mv-create__side-title")).toHaveText("Trending MVs");
  await expect(page.locator(".mv-create__side-see-all")).toBeVisible();

  await page.goto("/song/create");
  await expect(page.locator(".song-create__side-title")).toHaveText("Trending Songs");
  await expect(page.locator(".song-create__side-see-all")).toBeVisible();
});

test("items 4/5: generating a song flips /song/create's rail to My Creations", async ({ page }) => {
  // The other half of the pair, and the one that would silently rot: the rail
  // only changes once History has a completed entry, and History is in-memory,
  // so this has to be driven through a real generation in the same page context.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await expect(page.locator(".song-create__side-title")).toHaveText("Trending Songs");

  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await page.getByRole("button", { name: /Create Song/ }).click();
  await page.waitForURL("**/song/result", { timeout: 30_000 });

  // IN-APP navigation, deliberately. History is in-memory (`HistoryProvider`),
  // so a `page.goto` here would reload the app, empty it, and the rail would
  // correctly read "Trending Songs" again — a green-looking test measuring the
  // wrong thing.
  await page.locator(".sidebar__nav-item[href$='/song/create']").click();
  await page.waitForURL("**/song/create");
  await expect(page.locator(".song-create__side-title")).toHaveText("My Creations");
  // DP renders no "See all" in this branch.
  await expect(page.locator(".song-create__side-see-all")).toHaveCount(0);
});

test("G7 3k-1: MV Edit still explains why Merge is disabled", async ({ page }) => {
  // MV-08 stayed enforced through the migration; the sentence that EXPLAINED it
  // did not, so Merge sat disabled with no stated reason and edits looked saved.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await openEditor(page);

  await expect(page.locator(".mv-edit__merge-btn")).toBeDisabled();
  await expect(
    page.locator(".mv-edit__sublabel").filter({ hasText: /aren.t saved/i }),
  ).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
// 2026-08-06 — the DP mismatches the product owner reported, and their guards
//
// Items 1/2/3 of that report, all one shape: /history's done rows opened a
// pre-migration modal (`CreationDialog`) instead of the result screens DP links
// them at, and neither result screen could get back to History. Nothing was red
// — the modal worked, and Back "worked" too, it just went somewhere else.
// ════════════════════════════════════════════════════════════════════════════

/**
 * The cover link of the first DONE row of a given kind on /history. The card
 * shows no type LABEL — the type lives in the cover's modifier class, which is
 * also what DP keys its per-type cover treatment on.
 */
function doneCover(page: Page, kind: "music-video" | "song") {
  return page.locator(`.history-card--done .history-card__cover--${kind}`).first();
}

test("item 3: a done MV row opens /mv/result, not a dialog", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/history");

  await doneCover(page, "music-video").click();
  await page.waitForURL(/\/mv\/result\?id=/);
  await expect(page.locator(".mv-result__player")).toBeVisible();
  await expect(page.locator("[role=dialog][aria-modal=true]")).toHaveCount(0);
});

test("item 3: a done song row opens /song/result, not a dialog", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/history");

  await doneCover(page, "song").click();
  await page.waitForURL(/\/song\/result\?id=/);
  await expect(page.locator(".song-result__player")).toBeVisible();
  // Specifically the pre-migration `Modal` shape (`role=dialog aria-modal=true`),
  // not "any dialog": this screen keeps its Lyrics sheet MOUNTED and `inert`
  // while closed (the 3b pattern) and DP's overlay closes to `opacity: 0`, which
  // Playwright still reports as visible. A bare dialog count would be 1 forever.
  await expect(page.locator("[role=dialog][aria-modal=true]")).toHaveCount(0);
});

test("item 3: the row href matches where the click actually goes", async ({ page }) => {
  // The href is not decoration — it is what middle-click and copy-link use, and
  // it carries the locale prefix (R-9). If the two ever disagree, copy-link
  // silently sends someone somewhere the app never navigates.
  await login(page);
  await page.goto("/jpn/history");
  // `evaluateAll` does NOT auto-wait — it resolves against whatever is in the DOM
  // at that instant and returns [] rather than retrying, so this raced hydration
  // and failed roughly one full run in three (measured 2026-08-07; it passes
  // every time in isolation, which is exactly what makes it look like a real
  // regression when a long run goes red). Anchor on the first link with an
  // assertion that DOES retry. Same fix the sibling R9 test already carries.
  await expect(page.locator(".history-card__copy a").first()).toBeAttached();
  const hrefs = await page
    .locator(".history-card__copy a")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(href).toMatch(/^\/jpn\//);
  expect(hrefs.some((h) => h.startsWith("/jpn/mv/result?id="))).toBe(true);
  expect(hrefs.some((h) => h.startsWith("/jpn/song/result?id="))).toBe(true);
});

test("items 1/2: Back on both result screens returns to /history", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });

  for (const [kind, url] of [
    ["music-video", /\/mv\/result\?id=/],
    ["song", /\/song\/result\?id=/],
  ] as const) {
    await page.goto("/history");
    await doneCover(page, kind).click();
    await page.waitForURL(url);
    await page.locator(".detail-navbar__back").click();
    await page.waitForURL(/\/history$/);
  }
});

test("items 1/2: /song/result carries a back control at all — it had none", async ({ page }) => {
  // It rendered `RoomNavbar`, which has no back affordance; DP switches this one
  // stage of SongCreatePage to `DetailNavbar backHref="/history"`.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/history");
  await doneCover(page, "song").click();
  await page.waitForURL(/\/song\/result\?id=/);
  await expect(page.locator(".detail-navbar__back")).toBeVisible();
  await expect(page.locator(".room-navbar")).toHaveCount(0);
});

test("item 1: after a fresh render, Back off /mv/result is not a no-op loop", async ({ page }) => {
  // The generation screens forward themselves the moment the artifact exists, so
  // while they were `push`ed, Back from the result landed on /mv/creating, which
  // 350ms later pushed the result straight back. Indistinguishable from "Back
  // does nothing". They `replace` now, so Back reaches the compose screen.
  test.slow();
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await renderToResult(page);

  await page.locator(".detail-navbar__back").click();
  await expect(page).not.toHaveURL(/\/mv\/(result|creating)/);
});

test("item 3: Share from an opened history row carries that row's id", async ({ page }) => {
  // The result screens derived their share id by matching a LIVE History job.
  // A seed row is a fixture, not a job, so opening one and hitting Share built
  // `/share?id=` — a link that resolves to the expired state. The id in the URL
  // is what fixes it, which is also why these pages now read `?id=`.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/history");
  await doneCover(page, "music-video").click();
  await page.waitForURL(/\/mv\/result\?id=/);
  const id = new URL(page.url()).searchParams.get("id");

  await page.locator(".mv-result__action").filter({ hasText: "Share" }).click();
  const field = page.getByRole("dialog").locator("input");
  await expect(field).toHaveValue(new RegExp(`/share\\?id=${id}$`));
});

// ════════════════════════════════════════════════════════════════════════════
// THE LANDING PAGE — the 17th route migration (2026-08-07)
//
// `/` was the last screen still on the original Tailwind build. Three things
// about it need behaviour tests rather than a screenshot, and each one is a
// lesson this project has already paid for once:
//
//  · IT BRANCHES IN JS. `HomeView` mounts a DIFFERENT hero and a DIFFERENT tool
//    selector below 768px, so the phone components are not in the DOM at 1440
//    and the desktop ones are not in the DOM at 375. The 3f mask sweep cold-
//    `goto`s at 1440 and therefore cannot see half of this screen — which is
//    exactly the shape of the `/watch` arrow and credit-pill bugs it exists to
//    catch. Hence a second sweep at 375.
//  · THE HERO CTAs ARE GATED. `requireLogin` on both is WA's, not DP's (DP has
//    no auth at all). Five migrated screens have now lost a control DP does not
//    draw; a screenshot would not notice.
//  · THE TRENDING MARQUEE IS GONE ON PURPOSE. Asserting its absence is what
//    stops a future drop, or a well-meaning "fix", quietly putting WA's own rail
//    back — the same reason A19's loss is asserted rather than left implicit.
// ════════════════════════════════════════════════════════════════════════════

test("landing page: each width mounts its own hero and tool selector", async ({ page }) => {
  // Both treatments ship and the JS branch picks. If the branch inverted, the
  // page would still render something plausible at both widths — DP's phone hero
  // is `display:none` above 768px and its desktop hero below it, so an inverted
  // branch is a BLANK hero, not a wrong one. Assert presence at both ends.
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");
  await expect(page.locator(".hero-banner-v3")).toBeVisible();
  await expect(page.locator(".tool-selector-v3")).toBeVisible();
  await expect(page.locator(".hero-banner-mobile")).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expect(page.locator(".hero-banner-mobile")).toBeVisible();
  await expect(page.locator(".tool-selector")).toBeVisible();
  await expect(page.locator(".hero-banner-v3")).toHaveCount(0);
});

test("landing page: every mask icon has something to clip on a phone too", async ({ page }) => {
  // The 3f sweep runs at 1440 and never sees `.tool-selector__icon` or anything
  // else inside the phone branch. `.tool-selector__icon` is `background-color`
  // + `mask-*` (a DpIcon); rendering it as an `<img>` — or under a tag DP's CSS
  // does not select — is invisible and silent.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(await invisibleMaskIcons(page), "invisible mask icons on / at 375px").toEqual([]);
});

test("landing page: both hero CTAs require login", async ({ page }) => {
  // AC-EXP-02 / GL-02. DP navigates straight to its create page; WA must not.
  // Checked on BOTH branches, because they are two different components with two
  // separate handlers — fixing one and not the other is exactly the kind of miss
  // a single-width test lets through.
  for (const [width, cta] of [
    [1440, ".tool-selector-v3__card"],
    [375, ".tool-selector__card"],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.locator(cta).first().click();
    await expect(page.getByRole("dialog", { name: /sign in/i })).toBeVisible();
    await expect(page).not.toHaveURL(/\/mv\/room/);
  }
});

test("landing page: the Trending marquee is gone and stays gone", async ({ page }) => {
  // Product owner, 2026-08-07: follow DP, which has no such rail. The classes
  // and the keyframes were deleted with it, so this asserts the DOM as well as
  // the decision. `TRENDING_MVS` therefore has NO home entry point — it is
  // reachable from /explore/mvs only. DESIGNER-TODO A20.
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");
  await expect(page.locator(".marquee-animate")).toHaveCount(0);
  await expect(page.locator(".marquee-wrap")).toHaveCount(0);

  // The three rails that DP does draw are all present, in DP's order.
  await expect(page.locator(".new-mvs")).toBeVisible();
  await expect(page.locator(".top-picks")).toBeVisible();
  await expect(page.locator(".new-songs")).toBeVisible();
});

test("landing page: a New Songs row splits title-navigates from art-previews", async ({ page }) => {
  // Drop 2's two-way split, which `/explore/songs` already implements. Home and
  // that screen must not drift into two behaviours — the same rule the Trending
  // MV test above guards for the MV side.
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");

  // Album art: previews in place, does NOT navigate.
  await page.locator(".new-songs__item .list-item__album-art").first().click();
  await expect(page.locator(".song-bar")).toBeVisible();
  await expect(page).toHaveURL(/\/(enu)?\/?$/);

  // Title: navigates.
  await page.locator(".new-songs__item .list-item__title--button").first().click();
  await page.waitForURL(/\/song\/play\?id=/);
});

test("landing page: New Songs' Create requires login", async ({ page }) => {
  // AC-EXP-02 again, on the third gate DP does not have. The pre-migration home
  // had it; a port that dropped it would look identical.
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/");
  await page.locator(".new-songs__item").first().getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("dialog", { name: /sign in/i })).toBeVisible();
});

// ── Send Feedback = a CS support ticket (spec areas/06 §3.1, AC-PROF-10…16) ──
//
// Three of these guard failures that a screenshot cannot see: a Send button that
// enables on an incomplete form, an attachment refusal that silently truncates
// the pick, and a hand-built combobox that only works with a mouse.

async function openFeedback(page: Page) {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/profile");
  await page.getByRole("button", { name: "Send Feedback" }).click();
  return page.getByRole("dialog", { name: "Send Feedback" });
}

test("PROF-P5: four fields in spec order, Email prefilled, Send gated until valid", async ({
  page,
}) => {
  const dialog = await openFeedback(page);

  // AC-PROF-10 — the product owner's order, not T3's. Asserted as positions so a
  // reshuffle fails here rather than passing on "all four exist".
  const text = (await dialog.innerText()).replace(/\s+/g, " ");
  const order = ["Type", "Description", "Attachment", "Email"].map((l) => text.indexOf(l));
  expect(order, text).toEqual([...order].sort((a, b) => a - b));
  expect(Math.min(...order)).toBeGreaterThanOrEqual(0);

  // 2026-08-27: Subject is REMOVED, and its absence is asserted rather than
  // merely un-asserted. Dropping a field is the mirror of the affordance
  // regressions this file exists for: nothing would go red if it came back, and
  // a returning Subject would silently re-open the `title` contract question
  // (TBD-PROF-07). There must also be exactly ONE textbox before Email now.
  await expect(dialog.getByRole("textbox", { name: "Subject" })).toHaveCount(0);
  expect(text).not.toContain("What's this about?"); // the old placeholder

  const send = dialog.getByRole("button", { name: "Send", exact: true });
  const email = dialog.getByRole("textbox", { name: "Email" });
  await expect(email).not.toHaveValue(""); // prefilled from the account
  await expect(send).toBeDisabled();

  // AC-PROF-11 — each required field alone is not enough.
  await dialog.getByRole("combobox").click();
  await dialog.getByRole("option", { name: "Feature Issue" }).click();
  await expect(send).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Description" }).fill("Every MV I open stalls.");
  await expect(send).toBeEnabled();

  // A malformed email must re-disable it — the one required field that can be
  // non-empty and still invalid.
  await email.fill("not-an-email");
  await expect(send).toBeDisabled();
  await email.fill("jason@example.com");
  await expect(send).toBeEnabled();

  // AC-PROF-13 — confirmation in place, and NO toast (the old behaviour).
  await send.click();
  await expect(dialog.getByText("Feedback Sent")).toBeVisible();
  await expect(dialog.getByText(/we'll reply to jason@example\.com/i)).toBeVisible();
  await expect(page.locator(".anim-toast")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();

  // PROF-P5-S6 — re-opening starts clean. The dialog is conditionally mounted
  // precisely so this is true without a reset effect.
  await page.getByRole("button", { name: "Send Feedback" }).click();
  const reopened = page.getByRole("dialog", { name: "Send Feedback" });
  await expect(reopened.getByRole("textbox", { name: "Description" })).toHaveValue("");
  await expect(reopened.getByRole("combobox")).toContainText("Select an issue type");
});

test("PROF-E5: an oversized attachment is refused WHOLE and explained inline", async ({ page }) => {
  const dialog = await openFeedback(page);
  const file = (name: string, mb: number) => ({
    name,
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(Math.round(mb * 1024 * 1024)),
  });
  const input = dialog.locator('input[type="file"]');

  // Under the cap: accepted, chip shown. The cap is 5 MB (product owner,
  // 2026-08-27); it was 10 MB, inherited from YCO's CS spec. See
  // FEEDBACK_MAX_TOTAL_BYTES.
  await input.setInputFiles([file("small.log", 1)]);
  await expect(dialog.getByText("small.log")).toBeVisible();
  await expect(dialog.getByText("File too large — 5 MB total.")).toBeHidden();

  // A batch that would cross 5 MB in total is refused ENTIRELY — the 0.5 MB
  // file must not sneak in alongside the 4.4 MB one. A partial add is the
  // failure mode that reads as success (AC-PROF-15).
  await input.setInputFiles([file("huge.bin", 4.4), file("tiny.txt", 0.5)]);
  await expect(dialog.getByText("File too large — 5 MB total.")).toBeVisible();
  await expect(dialog.getByText("huge.bin")).toBeHidden();
  await expect(dialog.getByText("tiny.txt")).toBeHidden();
  await expect(dialog.getByText("small.log")).toBeVisible(); // the earlier pick survives

  // Inline, never a toast — the CS spec is explicit about this (AC-22).
  await expect(page.locator(".anim-toast")).toHaveCount(0);

  // Removing a chip clears the refusal and the chip.
  await dialog.getByRole("button", { name: /Remove file: small\.log/ }).click();
  await expect(dialog.getByText("small.log")).toBeHidden();
  await expect(dialog.getByText("File too large — 5 MB total.")).toBeHidden();
});

test("AC-PROF-16: the Type combobox is fully operable by keyboard alone", async ({ page }) => {
  // The reason a custom listbox needed spec'ing at all (§10 decision 11): a
  // native <select> gets this for free, a hand-built one gets it only if someone
  // writes it. Mutation-tested by deleting the keydown handler — this goes red.
  const dialog = await openFeedback(page);
  const combo = dialog.getByRole("combobox");

  await combo.focus();
  await expect(combo).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("ArrowDown"); // opens
  await expect(combo).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByRole("listbox")).toBeVisible();

  // Focus stays on the trigger; the active option moves via aria-activedescendant.
  await expect(combo).toBeFocused();
  const active = async () => (await combo.getAttribute("aria-activedescendant")) ?? "";
  const first = await active();
  await page.keyboard.press("ArrowDown");
  expect(await active()).not.toBe(first);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(combo).toContainText("Others"); // End -> last option
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await expect(combo).toBeFocused(); // focus returned, not lost to the body

  // Escape closes the list WITHOUT closing the dialog and losing the draft.
  await dialog.getByRole("textbox", { name: "Description" }).fill("keep me");
  await combo.focus();
  await page.keyboard.press("ArrowDown");
  await expect(dialog.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("listbox")).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Description" })).toHaveValue("keep me");
});

test("AC-PROF-16: the open feedback dialog is axe-clean at 1440 and 375", async ({ page }) => {
  // `a11y.spec.ts` cannot cover this surface for two documented reasons: it does
  // not seed auth (so /profile renders only the sign-in modal to axe) and it sets
  // no viewport (so it never sees a phone). Both widths are scanned here because
  // the dialog scrolls its body at 375 — a different layout, not a smaller one.
  const dialog = await openFeedback(page);
  await dialog.getByRole("combobox").click(); // scan the listbox open, too

  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    // Let the mount animation finish before axe reads colours. `Modal` fades and
    // pops in over ~.24s (`globals.css` `.anim-fade`/`.anim-pop`) and
    // `toBeVisible()` is already true at opacity 0 — so a scan that lands mid-fade
    // measures text against a BLENDED background and reports contrast violations
    // that do not exist a frame later. This test passed alone and failed in a
    // group for exactly that reason (2026-08-19); it is the same trap AGENTS.md
    // records for the DP sheets, one component over.
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include('[role="dialog"]')
      .analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.length}`),
      `axe violations at ${width}px`,
    ).toEqual([]);
  }
});

// ── MV character photo — biometric consent (product owner, 2026-08-19) ───────
//
// Guarded here rather than left to the visual baseline for the reason this file
// keeps re-learning: `visual-baseline.spec.ts` captures with every overlay
// closed, so it photographs `/mv/room` exactly the same whether this gate
// exists or not. Every assertion below is about BEHAVIOUR the screenshots
// cannot see.
//
// Mutation-tested both ways, 2026-08-19: making `openPhotoPicker` call the
// input unconditionally reddens the first two; dropping `disabled={!checked}`
// reddens the third; resetting `checked` on close instead of on open reddens
// the fourth; gating `addSampleFace` reddens the fifth.

/**
 * Open `/mv/room` with a click-counter on the character-photo file input.
 *
 * Installed as a CAPTURING listener on `document` before first paint, not bound
 * to the input node: leaving the route and coming back remounts that node, and
 * a listener attached to the old one silently stops counting — which reads
 * exactly like "the picker never opened". `preventDefault` stops the OS file
 * dialog, which would otherwise hang the run.
 */
async function mvRoomWithPickerSpy(page: Page) {
  await login(page);
  await page.addInitScript(() => {
    (window as unknown as { __picks: number }).__picks = 0;
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (t instanceof HTMLInputElement && t.type === "file" && t.accept === "image/*") {
          (window as unknown as { __picks: number }).__picks++;
          e.preventDefault();
        }
      },
      true,
    );
  });
  await page.goto("/mv/room");
  return {
    add: page.locator(".mv-create__photo-add--primary"),
    overlay: page.locator(".consent-dialog-overlay"),
    picks: () => page.evaluate(() => (window as unknown as { __picks: number }).__picks),
  };
}

test("consent: the first character-photo upload is gated, and dismissing opens nothing", async ({
  page,
}) => {
  const { add, overlay, picks } = await mvRoomWithPickerSpy(page);

  await add.click();
  await expect(overlay).toHaveClass(/consent-dialog-overlay--visible/);
  expect(await picks(), "the picker must not open behind the notice").toBe(0);

  await page.keyboard.press("Escape");
  await expect(overlay).toHaveCount(0);
  expect(await picks(), "dismissing is not consent — still no picker").toBe(0);
});

test("consent: accepting opens the picker, and the rest of the session skips the notice", async ({
  page,
}) => {
  const { add, overlay, picks } = await mvRoomWithPickerSpy(page);

  await add.click();
  await page.locator(".consent-dialog__checkbox").check();
  await page.locator(".consent-dialog__continue").click();
  await expect(overlay).toHaveCount(0);
  expect(await picks()).toBe(1);

  // Second upload, same session: straight through. `hasFaceConsent()` is
  // module-scoped precisely so this survives leaving the route and coming back
  // — but only via CLIENT-SIDE navigation. `page.goto` is a document load and
  // resets it, which is the intended "once per session, not once per account"
  // boundary, so this leaves and returns the way a user does.
  await page.getByRole("link", { name: "History" }).click();
  await page.waitForURL("**/history");
  await page.getByRole("link", { name: "AI Music Video" }).click();
  await page.waitForURL("**/mv/room");
  await add.click();
  await expect(overlay).toHaveCount(0);
  expect(await picks()).toBe(2);
});

test("consent: CONTINUE is inert until the box is ticked", async ({ page }) => {
  // The copy calls ticking the box "an express written consent". A CONTINUE that
  // works without it would make that sentence describe something that never
  // happened — so this is a product rule, not a form-validation nicety.
  const { add } = await mvRoomWithPickerSpy(page);
  await add.click();
  const cont = page.locator(".consent-dialog__continue");
  await expect(cont).toBeDisabled();
  await page.locator(".consent-dialog__checkbox").check();
  await expect(cont).toBeEnabled();
});

test("consent: re-opening after a dismissal starts from an unticked box", async ({ page }) => {
  // A remembered tick would be a consent nobody gave on this showing.
  const { add } = await mvRoomWithPickerSpy(page);
  await add.click();
  await page.locator(".consent-dialog__checkbox").check();
  await page.locator(".consent-dialog__close").click();
  await expect(page.locator(".consent-dialog-overlay")).toHaveCount(0);

  await add.click();
  await expect(page.locator(".consent-dialog__checkbox")).not.toBeChecked();
});

test("consent: Sample Photos are NOT gated — they are ours, not the user's face", async ({
  page,
}) => {
  // Deliberate asymmetry (product owner, 2026-08-19). Bundled sample faces carry
  // no Biometric Data of the user's, so there is nothing for the notice to be
  // consent over. Asserted so nobody "fixes" the inconsistency without asking.
  const { overlay, picks } = await mvRoomWithPickerSpy(page);
  await page.locator(".mv-create__sample").first().click();
  await expect(page.locator(".mv-create__photo-name")).toHaveCount(1);
  await expect(overlay).toHaveCount(0);
  expect(await picks(), "a sample never touches the file input").toBe(0);
});

test("consent: the open notice is axe-clean at 1440 and 375", async ({ page }) => {
  // `a11y.spec.ts` cannot cover this: it seeds no auth and sets no viewport, and
  // it only ever visits pages with every overlay closed. Both widths, because at
  // 375 the card caps against the viewport and scrolls its body — a different
  // layout, not a smaller one.
  const { add } = await mvRoomWithPickerSpy(page);
  await add.click();
  await expect(page.locator(".consent-dialog-overlay")).toHaveClass(
    /consent-dialog-overlay--visible/,
  );

  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include(".consent-dialog")
      .analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.length}`),
      `axe violations at ${width}px`,
    ).toEqual([]);
  }
});

// ── TODO#8: two defects the 2026-08-19 spec audit found ─────────────────────
//
// Both are cases where the SPEC was already right and the CODE had drifted, so
// neither was fixed by editing a document. Guards written the way this file
// keeps learning to write them: assert the product rule, not the markup.

test("TODO#8a: a guest liking a Home song rail row is gated, not silently accepted", async ({
  page,
}) => {
  // GL-02 / AC-EXP-08 / EXP-E2. `ui/ListItem` used to own `liked` in its own
  // `useState` and flip it directly — the only community like control in the
  // app that never called `requireLogin`. A guest could like a song and the UI
  // pretended it had worked. Like is controlled by the caller now.
  //
  // NO login() here on purpose — arriving as a guest is the whole test.
  await page.goto("/");
  const row = page.locator(".new-songs__item").first();
  await row.scrollIntoViewIfNeeded();

  const like = row.getByRole("button", { name: /^Like$/ });
  await expect(like).toHaveAttribute("aria-pressed", "false");

  await like.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  // and the like did NOT go through behind the modal
  await expect(like).toHaveAttribute("aria-pressed", "false");
});

test("TODO#8b: a song with no lyrics offers no Lyrics affordance at all", async ({ page }) => {
  // AC-SONG-06 / SONG-P3-S2 both say the sheet appears only WHEN LYRICS EXIST.
  // `FALLBACK_LYRICS` meant a Simple-mode song — which has none — opened a sheet
  // of generic filler presented as the user's own words.
  //
  // Drives the real create flow rather than seeding state: the point is a song
  // that genuinely has no lyrics, and Simple mode is how a user makes one.
  await login(page);
  await page.goto("/song/create");
  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An instrumental-feeling summer anthem about chasing dreams.");
  await page.getByRole("button", { name: /Create Song/ }).click();
  await page.waitForURL("**/song/result", { timeout: 20000 });

  // The stage rendered — so a missing Lyrics button is absence, not a blank page.
  await expect(page.getByRole("button", { name: "Use in Music Video" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Lyrics" })).toHaveCount(0);
  // DESIGNER-TODO A23, closed 2026-08-20: the 426px panel itself is no longer
  // absent — it now renders an honest empty-state (icon + message) instead of
  // vanishing. The Lyrics BUTTON and sheet stay exactly as strict as AC-SONG-06
  // (b) / SONG-P3-S2 require ("only when lyrics exist"); only the passive
  // desktop panel changed.
  await expect(page.locator(".song-result__lyrics-inline")).toBeVisible();
  await expect(page.locator(".song-result__lyrics-empty-icon")).toBeVisible();
  await expect(page.locator(".song-result__lyrics-empty-text")).toHaveText(
    "No lyrics available for this one yet",
  );
  // and none of the retired filler survives anywhere on the page
  await expect(page.getByText(/Hold this afterglow/i)).toHaveCount(0);
});

test("AC-SONG-06: a song that HAS lyrics renders the panel and the control", async ({ page }) => {
  // The other half of TODO#8b. Removing `FALLBACK_LYRICS` was correct, but it
  // exposed that `useOpenCreation` never seeded `lyrics` AT ALL — so every
  // catalogue song opened from History rendered without a lyrics panel, which
  // looks exactly like the bug rather than the fix. The data existed in
  // `community.ts` the whole time; only the wiring was missing (2026-08-20).
  //
  // Guards the pair together: a catalogue title HAS lyrics, and TODO#8b still
  // asserts a Simple-mode song does not.
  // A community song, which cold-resolves from `?id=` alone. History rows cannot
  // (they need in-memory flow state), which is exactly why `DESIGNER-TODO` A23
  // hands the designer an `sp-*` URL for the broken state and a click-path for
  // the History one.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/result?id=sp-pop-anthem");
  await expect(page.getByRole("button", { name: "Use in Music Video" })).toBeVisible();

  await expect(page.locator(".song-result__lyrics-inline")).toBeVisible();
  // The control is asserted by COUNT, not visibility: `/song/result` renders the
  // transport twice and lets CSS pick which copy is laid out at each width, so a
  // `toBeVisible()` here would be testing the layout, not the wiring. TODO#8b
  // asserts the same locator is 0 for a song with no lyrics, so the pair brackets
  // the actual rule.
  await expect(page.locator(".song-result__icon-btn--lyrics")).toHaveCount(1);
});

test("A23: `sp-synth-wave`'s no-lyrics panel shows the empty-state, not a blank one", async ({
  page,
}) => {
  // DESIGNER-TODO A23, closed 2026-08-20. This test used to guard the OPPOSITE
  // thing — that `sp-synth-wave` kept reproducing the bug (zero panels, side
  // panel down to one child) so the ticket wouldn't silently look fixed while
  // the design still didn't exist. The design landed (Figma "Song Result_no
  // Lyrics_L", node 2695:116795: a 54px `ic_song` glyph + "No lyrics available
  // for this one yet", matched exactly), so the guard now points the other way:
  // the empty-state must actually render, and the side panel must be back to
  // its normal two children.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/result?id=sp-synth-wave");
  await expect(page.getByRole("button", { name: "Use in Music Video" })).toBeVisible();

  // The Lyrics BUTTON and sheet are unaffected — still absent, per AC-SONG-06
  // (b) / SONG-P3-S2 ("a Lyrics sheet — only when lyrics exist").
  await expect(page.locator(".song-result__icon-btn--lyrics")).toHaveCount(0);

  await expect(page.locator(".song-result__lyrics-inline")).toBeVisible();
  await expect(page.locator(".song-result__lyrics-empty-icon")).toBeVisible();
  await expect(page.locator(".song-result__lyrics-empty-text")).toHaveText(
    "No lyrics available for this one yet",
  );
  // The side panel is back to its normal two children (the lyrics-inline
  // block, now showing the empty-state, and the CTAs) — not the one-child
  // collapse A23 originally reported.
  await expect(page.locator(".song-result__side-panel > *")).toHaveCount(2);
});

// ── /song/create Custom tab: Enhance and Instrumental (product owner, 2026-08-26) ──
//
// One pill, two behaviours, and Instrumental selects between them (AC-SONG-14):
// OFF the box may hold a lyric sheet or a brief, so Enhance asks first; ON
// lyrics are unsupported, so it runs Refine Idea on the first tap. The toggle
// itself never edits the text (AC-SONG-02) — a rule that cleared the box on
// toggle-on stood for one day and was withdrawn.

test("Custom Enhance opens the two-mode menu, and is not a dead button", async ({ page }) => {
  // It WAS a dead button. `EnhanceButton`'s `bem` branch returned the button
  // alone while `onClick` set `menuOpen`, so the only caller that passes
  // `directions` — this one — toggled invisible state and did nothing. The menu
  // lived in the legacy rendering and was not carried across in the DP migration.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await page.getByText("Custom", { exact: true }).first().click();

  // Enhance only appears once there is something to enhance (`!value.trim()`).
  const box = page.locator(".song-create__textarea").first();
  await box.fill("a hopeful song about leaving home");
  const enhance = page.locator(".song-create__enhance-btn").first();
  await expect(enhance).toBeVisible();
  await expect(enhance).toHaveAttribute("aria-expanded", "false");

  await enhance.click();
  await expect(enhance).toHaveAttribute("aria-expanded", "true");
  const dialog = page.getByRole("dialog", { name: "What would you like to enhance?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Refine Idea")).toBeVisible();
  await expect(dialog.getByText("Refine Lyrics")).toBeVisible();

  // The gradient tiles are the design's whole point, and a mask glyph with no
  // background to clip is the repo's recurring invisible-icon bug — so assert
  // both tiles actually paint (2026-08-26, app prototype's Enhance sheet).
  await expect(dialog.locator(".enhance-dialog__opt-ico--idea")).toBeVisible();
  await expect(dialog.locator(".enhance-dialog__opt-ico--lyrics")).toBeVisible();
  for (const g of await dialog.locator(".enhance-dialog__opt-glyph").all()) {
    const bg = await g.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    const box = await g.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);
  }

  // Picking a direction closes the chooser and rewrites the field.
  await dialog.getByText("Refine Idea").click();
  await expect(dialog).toBeHidden();
  await expect
    .poll(async () => box.inputValue(), { timeout: 15000 })
    .not.toBe("a hopeful song about leaving home");
});

test("Under Instrumental, Enhance runs Refine Idea directly with no chooser", async ({ page }) => {
  // AC-SONG-14's second branch. `SongCompose` withholds `directions` while
  // Instrumental is ON, and that is what turns the chooser off — so this asserts
  // BOTH that no menu appears and that the field is still rewritten. Asserting
  // only the absence would also pass on a button that did nothing at all, which
  // is precisely the defect the test above exists for.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await page.getByText("Custom", { exact: true }).first().click();

  const box = page.locator(".song-create__textarea").first();
  const original = "warm analogue synths at dusk";
  await box.fill(original);
  await page.getByRole("switch", { name: "Instrumental" }).first().click();

  const enhance = page.locator(".song-create__enhance-btn").first();
  await expect(enhance).toBeVisible();
  // No `directions` ⇒ no popup semantics at all, not merely a closed dialog.
  await expect(enhance).not.toHaveAttribute("aria-haspopup", "dialog");

  await enhance.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("What would you like to enhance?")).toHaveCount(0);

  // …and it really ran: the mock awaits ~900ms, then replaces the text.
  await expect(enhance).toBeDisabled();
  await expect.poll(async () => box.inputValue(), { timeout: 15000 }).not.toBe(original);
});

test("Toggling Instrumental never edits the box; only the Lyrics fill hides", async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await page.getByText("Custom", { exact: true }).first().click();

  const box = page.locator(".song-create__textarea").first();
  const original = "Verse one, the city lights are low";
  await box.fill(original);

  const lyricsFill = page.getByRole("button", { name: "Lyrics", exact: true });
  const ideaFill = page.getByRole("button", { name: "Idea", exact: true });
  await expect(lyricsFill).toBeVisible();

  // ON: text untouched; Lyrics gone; Idea and Enhance both stay.
  await page.getByRole("switch", { name: "Instrumental" }).first().click();
  await expect(box).toHaveValue(original);
  await expect(lyricsFill).toHaveCount(0);
  await expect(ideaFill).toBeVisible();
  await expect(page.locator(".song-create__enhance-btn")).toBeVisible();

  // The placeholder still swaps — it is simply not visible behind text.
  await expect(box).toHaveAttribute("placeholder", /No lyrics needed - AI will create/);
  await expect(box).toHaveAttribute("placeholder", /Describe the mood or vibe/);

  // OFF: still untouched, and Lyrics comes back.
  await page.getByRole("switch", { name: "Instrumental" }).first().click();
  await expect(box).toHaveValue(original);
  await expect(lyricsFill).toBeVisible();
});

test("Custom's box is labelled LYRICS / IDEA, matching what it accepts", async ({ page }) => {
  // It read just "LYRICS" until 2026-08-25, which under-described a box that
  // also takes a style/scene brief and has an `Idea` fill sitting inside it.
  // The spec (§3) and this component's own comments had said DP calls it
  // "LYRICS / IDEA" the whole time — the label was the piece that never caught up.
  await login(page);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("/song/create");
  await page.getByText("Custom", { exact: true }).first().click();

  const label = page
    .locator(".song-create__label")
    .filter({ hasText: /LYRICS/ })
    .first();
  await expect(label).toHaveText("LYRICS / IDEA");
  // Both fills live under it — and they SHARE the pill class, which is why the
  // label has to name both rather than just the one the field is called after.
  await expect(page.locator(".song-create__idea-btn")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Idea", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lyrics", exact: true })).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════
// e739c4e — /mv/thinking must not double-start the storyboard job under
// React Strict Mode (found while capturing the S2 mv-creation storyboard spec)
// ════════════════════════════════════════════════════════════════════════════
// `StoryboardGenerationScreen` used to call `startStoryboard()` from a bare
// mount effect. `next dev`'s React Strict Mode deliberately invokes every
// mount effect twice, so it fired TWO separate storyboard jobs:
//   - `startStoryboard` charges credits (GL-01), so the account was charged
//     twice for one storyboard.
//   - Each job gets its own History row (`upsertGenerating` keyed by job id).
//     The FIRST job's poll is silently cancelled the instant the second job's
//     `track()` call replaces `MvFlowProvider`'s shared `cancelPoll.current`,
//     with no `markFailed`/`markCompleted` on the way out — so the first row
//     is stuck reading "Generating..." forever.
// Fixed with a `started` useRef guard, the same pattern `GenerationView.tsx`
// already carries for `/mv/creating` and `/song/creating` (this screen split
// off from `GenerationView` in slice 3h and the guard did not come along).
//
// Mutation-tested 2026-08-27 (both directions, against a fresh `npm run build`
// each time — `next start` reads its manifest once at boot, so testing against
// a stale build would not have exercised the mutated source):
//   - RED: with `started.current` removed from StoryboardGenerationScreen's
//     mount-effect guard, this test failed on both assertions — the balance
//     dropped by 2x the advertised script price, and History gained 2 new
//     rows (one of them stuck "Generating...") for a single storyboard start.
//   - GREEN: with the guard restored, both assertions pass.
// NOTE ON WHAT THIS DOES *NOT* GUARD. This suite boots `next start -p 3100`
// (playwright.config.ts) — the PRODUCTION build, where React elides Strict
// Mode's double-invoked mount effect entirely. So this test cannot observe the
// e739c4e double-start regression: it passes with or without the `started` ref.
// Verified by mutation, 2026-08-27. What it does assert, and usefully, is the
// production invariant — one start, one charge, one new History row.
// The real guard for the double-start lives where the mechanism exists, in
// React's dev build: src/components/mv/StoryboardGenerationScreen.test.tsx.
test("AC-MV-06/19: one storyboard start charges once and adds exactly one History row", async ({
  page,
}) => {
  test.slow(); // a full mock generation
  await login(page);

  // Count History's starting rows BEFORE funding/composing — a full page load
  // (`page.goto`) resets the in-memory balance and compose state (see
  // `fundAccount`'s own warning above), so this has to happen first, not as a
  // client-side hop later. `HISTORY_SAMPLES` is a static seed merged in
  // alongside the live (in-memory) rows, so this is never actually 0 — but the
  // very first navigation to any route in `next dev` can take a moment to
  // compile, so wait for the count to settle rather than reading it the
  // instant `goto` resolves (an early read undercounts and every assertion
  // below it becomes a false failure, not a sign of the bug).
  await page.goto("/history");
  const rowsBefore = await stableHistoryCardCount(page);

  await page.locator('.sidebar__nav-item[href="/mv/room"]').click();
  await page.waitForURL("**/mv/room");
  await fundAccount(page);
  await composeMv(page);

  const before = await balance(page);
  await page.getByRole("button", { name: "Create Music Video" }).click();
  const scriptPrice = await shownCost(page, ".mv-mode-card__tag--credit");
  await page.getByText("Create Storyboard First").click();
  await page.waitForURL("**/mv/storyboard");

  // Exactly one charge for one storyboard, not two.
  expect(
    await balance(page),
    "a Strict-Mode double mount must not double-charge the storyboard (GL-01)",
  ).toBe(before - scriptPrice);

  // Exactly one new History row, not a stuck duplicate.
  await page.locator('.sidebar__nav-item[href="/history"]').click();
  await page.waitForURL("**/history");
  expect(
    await stableHistoryCardCount(page),
    "one storyboard start must add exactly one History row, not a stuck duplicate",
  ).toBe(rowsBefore + 1);
});

// ── Demo/QA state panel (product owner, 2026-08-27) ─────────────────────────
//
// The panel's whole cost model rests on ONE property: it renders nothing until
// `?demo=1` has armed it. If that breaks, a `position: fixed` card lands in all
// 115 `visual-baseline.spec.ts` screenshots and in every `a11y.spec.ts` sweep —
// and re-recording those baselines would ACCEPT whatever else had changed on 17
// routes at the same time (the A4 lesson). So the default-hidden state is
// asserted here rather than trusted.

const DEMO_PANEL = '[aria-label="Demo state panel"]';
const DEMO_HANDLE = 'button:text-is("DEMO")';

test("demo panel: invisible by default on every kind of route, and writes nothing", async ({
  page,
}) => {
  await login(page);
  // One migrated route, the landing page (which branches its layout in JS), and
  // /share (which AppShell renders bare through an early return).
  for (const route of ["/history", "/", "/share"]) {
    await page.goto(route);
    await expect(page.locator(DEMO_PANEL)).toHaveCount(0);
    await expect(page.locator(DEMO_HANDLE)).toHaveCount(0);
    // Not merely hidden — nothing is persisted either, so an un-armed session
    // cannot leave a flag behind for the next one.
    expect(await page.evaluate(() => localStorage.getItem("muse_demo"))).toBeNull();
  }
});

test("demo panel: ?demo=1 arms it collapsed, it survives navigation, [x] clears the flags", async ({
  page,
}) => {
  await login(page);

  // Arms COLLAPSED — expanded, the card covers the sidebar's nav links, and QA
  // has to be able to navigate while driving these states.
  await page.goto("/history?demo=1");
  await expect(page.locator(DEMO_HANDLE)).toBeVisible();
  await expect(page.locator(DEMO_PANEL)).toHaveCount(0);

  // `?demo=1` is the ENABLER, not the display condition: the armed state lives
  // in localStorage, which is why it survives a navigation that drops the query.
  await page.goto("/profile");
  await expect(page.locator(DEMO_HANDLE)).toBeVisible();
  expect(page.url()).not.toContain("demo=1");

  await page.locator(DEMO_HANDLE).click();
  const panel = page.locator(DEMO_PANEL);
  await expect(panel).toBeVisible();

  // The reason picker is conditional on the reject flag, and carries exactly the
  // seven reasons the product owner supplied — no more, no fewer.
  await expect(panel.locator("select")).toHaveCount(0);
  await panel.getByRole("switch", { name: /Publish review REJECTED/ }).click();
  const reasons = panel.locator("select").first();
  await expect(reasons).toBeVisible();
  await expect(reasons.locator("option")).toHaveCount(7);
  await expect(reasons.locator("option").first()).toHaveText("Platform Policy Violation");

  // [x] must clear the flags as well as hide, or a fake state stays on screen
  // with no visible control left to turn it off.
  await panel.getByRole("button", { name: "Close demo panel" }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator(DEMO_HANDLE)).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("muse_demo") ?? "{}"));
  expect(stored.enabled).toBe(false);
  expect(Object.values(stored.flags ?? {}).some(Boolean)).toBe(false);

  // Dismissal is permanent across a reload; re-arming is `?demo=1` again.
  await page.goto("/profile");
  await expect(page.locator(DEMO_HANDLE)).toHaveCount(0);
  await page.goto("/profile?demo=1");
  await expect(page.locator(DEMO_HANDLE)).toBeVisible();
});
