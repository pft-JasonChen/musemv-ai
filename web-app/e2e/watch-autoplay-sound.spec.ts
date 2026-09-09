// YMW260902P0002 — `/watch` must play WITH SOUND by default.
//
// ── WHY THIS IS ITS OWN SPEC FILE ───────────────────────────────────────────
//
// Chromium refuses to autoplay WITH SOUND unless the document has user
// activation, or its media-engagement heuristics vouch for the origin. Headless
// Playwright has neither, and a `page.goto` carries no activation across from
// the previous document — so on a cold load `CommunityMvPlayer`'s documented
// fallback correctly mutes, and the DEFAULT becomes unobservable.
//
// That is measured, not assumed: this assertion first failed exactly that way
// (`muted: true`) inside `behaviour-regressions.spec.ts`, which is the same
// shape as the bug it guards and would have read as "the fix did not land".
//
// `--autoplay-policy=no-user-gesture-required` puts this file's browser in the
// state a returning user's real browser is in, so the assertion is about OUR
// default rather than about Chrome's policy. It has to be a separate FILE
// because Playwright rejects `test.use({ launchOptions })` inside a describe
// ("it forces a new worker") — and it SHOULD be scoped rather than put in
// `playwright.config.ts`, because every other spec wants the strict default:
// that is the state the muted fallback exists for, and
// `behaviour-regressions.spec.ts` asserts that half there.
//
// `executablePath` is re-supplied because `launchOptions` REPLACES the config's
// object rather than merging into it — see AGENTS.md's `CHROMIUM_PATH` note for
// when that variable is needed at all.

import { expect, test } from "@playwright/test";

test.use({
  launchOptions: {
    args: ["--autoplay-policy=no-user-gesture-required"],
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  },
});

/**
 * `:not([aria-hidden])` picks the CURRENT video: the three-slot swipe track
 * means a bare `.mv-player__video` matches THREE elements, two of them the
 * off-screen neighbours, which are muted by design. Asserting on the bare
 * selector could not tell "the MV is muted" from "a neighbour is".
 */
const CURRENT_MV_VIDEO = ".mv-player__video:not([aria-hidden])";

test("YMW260902P0002 / AC-EXP-04: /watch plays with sound on", async ({ page }) => {
  // Same auth seeding every authed spec uses (see AGENTS.md → Tests).
  await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/watch");

  // Element state, not pixels — headless chromium has no H.264 decoder and
  // paints the stage black (AGENTS.md).
  const video = page.locator(CURRENT_MV_VIDEO);
  await expect(video).toHaveJSProperty("muted", false);
  await expect(video).toHaveJSProperty("paused", false);

  // Sound is on, so the control offers to turn it OFF. Asserting the LABEL as
  // well as the property is what catches a player that unmutes the element and
  // leaves the button lying — the two are separate pieces of state.
  await expect(page.getByRole("button", { name: "Mute" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Unmute" })).toHaveCount(0);
});

test("YMW260902P0002: the three-slot swipe track keeps the NEIGHBOURS muted", async ({ page }) => {
  // The bound on the fix. Sound on means the CURRENT video only: the prev/next
  // slots are permanently mounted and preloading, so unmuting them would play
  // two or three tracks at once. Nothing about that is visible in a screenshot,
  // and the flag above is what makes it reachable at all in a test — without
  // it every slot stays muted and this passes for the wrong reason.
  await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/watch");

  await expect(page.locator(CURRENT_MV_VIDEO)).toHaveJSProperty("muted", false);

  const neighbours = page.locator('.mv-player__video[aria-hidden="true"]');
  await expect(neighbours).toHaveCount(2);
  const muted = await neighbours.evaluateAll((els) =>
    els.map((e) => (e as HTMLVideoElement).muted),
  );
  expect(muted, "an off-screen slot is unmuted — two MVs would play at once").toEqual([true, true]);
});
