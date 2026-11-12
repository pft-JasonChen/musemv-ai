import { expect, test, type Page } from "@playwright/test";

// Run narrowly scoped cases while the Stop hook owns the broad suite.
async function cssLoaded(page: Page) {
  const links = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLLinkElement).href));
  expect(links.length).toBeGreaterThan(0);
  for (const href of links) {
    const response = await page.request.get(href);
    expect(response.status()).toBe(200);
    expect((await response.body()).length).toBeGreaterThan(100);
  }
}

for (const entry of ["/", "/history"]) {
  test(`PM fixes: launcher crown keeps subscription separate from credit packs on ${entry}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 950 });
    await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
    await page.goto(entry);
    await cssLoaded(page);
    const crown = page.locator(".mobile-header__subscribe:visible");
    await crown.click();
    const subscribe = page.getByRole("dialog", { name: "Upgrade Your Plan" });
    await expect(subscribe).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Buy Credits", exact: true })).toHaveCount(0);
    await subscribe.getByRole("button", { name: "Subscribe", exact: true }).click();
    await expect(subscribe).toBeHidden();
    await expect(crown).toHaveCount(0);
    // Client-side navigation retains the in-memory subscription.
    await page.locator(".mobile-header__account:visible").click();
    await page.locator(".account-page__stats > button").click();
    await page.getByRole("button", { name: "Buy More", exact: true }).click();
    const credits = page.getByRole("dialog", { name: "Buy Credits", exact: true });
    await expect(credits).toBeVisible();
    await expect(subscribe).toHaveCount(0);
  });
}

for (const width of [1440, 390]) {
  test(`PM fixes: subscription expiry history is All-only at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
    await page.goto("/profile/credits");
    await cssLoaded(page);
    await expect(page.locator(".credits-page__entry")).toHaveCount(1);
    await expect(page.getByRole("complementary", { name: "Demo state panel" })).toHaveCount(0);
    await page.goto("/profile/credits?demo=1");
    await page.getByRole("button", { name: "DEMO", exact: true }).click();
    const demo = page.getByRole("complementary", { name: "Demo state panel" });
    const expiryFlag = demo.getByRole("switch", {
      name: "Credits — expired subscription history",
      exact: true,
    });
    await expiryFlag.click();
    await demo.getByRole("button", { name: "Collapse demo panel" }).click();
    const expiry = page
      .locator(".credits-page__entry")
      .filter({ hasText: "Subscription Credits Expired" });
    await expect(expiry).toContainText("-700");
    await expect(expiry).toContainText("2026-11-12");
    await expect(page.locator(".credits-page__entry")).toHaveCount(4);
    const icon = expiry.locator(".credits-page__entry-icon > span");
    await expect(icon).toHaveCSS("width", "22px");
    await expect(icon).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await page.screenshot({ path: `/tmp/ycm-credit-expiry-all-${width}.png` });
    await page.getByRole("button", { name: "Spend", exact: true }).click();
    await expect(expiry).toHaveCount(0);
    await expect(page.locator(".credits-page__entry")).toHaveCount(1);
    await expect(page.locator(".credits-page__entry")).toContainText("-300");
    await expect(page.getByRole("button", { name: "Spend", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page
      .locator(".credits-page__tabs")
      .evaluate((el) =>
        Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)),
      );
    await page.screenshot({ path: `/tmp/ycm-credit-expiry-spend-${width}.png` });
    await page.getByRole("button", { name: "Earn", exact: true }).click();
    await expect(expiry).toHaveCount(0);
    await expect(page.locator(".credits-page__entry")).toHaveCount(2);
    await expect(page.getByText("Subscription Credits", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(expiry).toBeVisible();
    await page.getByRole("button", { name: "DEMO", exact: true }).click();
    await expiryFlag.click();
    await demo.getByRole("button", { name: "Close demo panel" }).click();
    await expect(expiry).toHaveCount(0);
    await expect(page.locator(".credits-page__entry")).toHaveCount(1);
    await expect(page.getByText("Welcome bonus", { exact: true })).toBeVisible();
  });
}

for (const width of [1440, 390]) {
  test(`PM fixes: monthly copy and Enhance language notice at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.addInitScript(() => {
      localStorage.setItem("muse_auth", "1");
      localStorage.setItem("muse_demo", JSON.stringify({ flags: { songLangUnsupported: true } }));
    });
    await page.goto("/profile");
    await cssLoaded(page);
    await page.getByRole("button", { name: /Muse Pro.*Upgrade/ }).click();
    const plans = page.getByRole("dialog", { name: "Upgrade Your Plan" });
    await plans.getByRole("tab", { name: "Monthly", exact: true }).click();
    // At phone widths the desktop descriptions are intentionally not painted.
    const subtitle = plans.locator(".upgrade-dialog__card--featured .upgrade-dialog__plan-desc");
    await expect(subtitle).toHaveText("2x the credits, create more freely.");
    if (width === 1440) await expect(subtitle).toBeVisible();
    await expect(page.locator(".upgrade-dialog-overlay")).toHaveCSS("opacity", "1");
    await page.screenshot({ path: `/tmp/ycm-monthly-${width}.png` });
    await plans.getByRole("tab", { name: "Weekly", exact: true }).click();
    await expect(subtitle).toHaveText("5x the credits, create more freely.");

    await page.goto("/song/create");
    await cssLoaded(page);
    await page.getByRole("button", { name: "Simple", exact: true }).click();
    const input = page.locator("textarea").first();
    await input.fill("A Czech idea that must remain unchanged");
    await page.getByRole("button", { name: "Enhance", exact: true }).click();
    const alert = page.locator('.popup-toast[role="alert"]');
    await expect(alert).toContainText("This language isn’t supported yet.");
    await alert.hover();
    await alert.getByRole("button", { name: "Supported languages" }).click();
    await expect(page.getByRole("tooltip")).toContainText("English, Japanese");
    await expect(input).toHaveValue("A Czech idea that must remain unchanged");
    await expect(page.getByRole("button", { name: "Enhance", exact: true })).toBeEnabled();
    await page.screenshot({ path: `/tmp/ycm-enhance-${width}.png` });
  });

  test(`PM fixes: both effect strips drag without choosing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
    await page.goto("/history");
    await cssLoaded(page);
    await page
      .locator(".history-card")
      .filter({ hasText: "Cinematic Night" })
      .getByRole("link", { name: "Cinematic Night" })
      .first()
      .click();
    await page.getByRole("button", { name: "Edit MV", exact: true }).click();
    await page.getByRole("button", { name: "Edit Effects", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Title & Subtitle" });
    await expect(page.locator(".report-overlay")).toHaveCount(1);
    await expect(page.locator(".report-overlay")).toHaveCSS("opacity", "1");
    for (const tab of ["Title", "Subtitle"]) {
      await dialog.getByRole("tab", { name: tab, exact: true }).click();
      const strip = dialog.getByRole("radiogroup");
      const selected = await strip.locator('[aria-checked="true"]').getAttribute("aria-label");
      await strip.evaluate((el) => {
        el.scrollLeft = 0;
      });
      await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBe(0);
      const box = await strip.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.move(box!.x + box!.width - 65, box!.y + 35);
      await page.mouse.down();
      await page.mouse.move(box!.x + 65, box!.y + 35, { steps: 12 });
      await page.mouse.up();
      await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(50);
      await expect(strip.locator('[aria-checked="true"]')).toHaveAttribute("aria-label", selected!);
      await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
      await page.screenshot({ path: `/tmp/ycm-drag-${tab}-${width}.png` });
      const last = strip.getByRole("radio").last();
      await last.click();
      await expect(last).toHaveAttribute("aria-checked", "true");
      // Revert via keyboard to keep the next tab's dirty-state check meaningful.
      await last.press("Home");
      if (tab === "Title") await strip.getByRole("radio", { name: selected!, exact: true }).click();
    }
  });
}

for (const loggedIn of [true, false]) {
  test(`PM fixes: fullscreen exits before ${loggedIn ? "report" : "sign-in"}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    if (loggedIn) await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
    await page.goto("/");
    await cssLoaded(page);
    await page.locator('a[href*="/watch?id="]').first().click();
    await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
    await page.locator(".mv-player").getByRole("button", { name: "Report", exact: true }).click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    if (loggedIn) await expect(dialog).toHaveAttribute("aria-label", "Report Music Video");
    else {
      await expect(dialog).toHaveAttribute("aria-label", "Sign in to YouCam Muse");
      await page.screenshot({ path: "/tmp/ycm-fullscreen-guest.png" });
      await dialog.getByRole("button", { name: "Continue with Google" }).click();
      await expect(page.getByRole("dialog", { name: "Report Music Video" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
    }
    await expect(page.locator(".report-overlay")).toHaveCount(1);
    await expect(page.locator(".report-overlay")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: `/tmp/ycm-fullscreen-${loggedIn ? "report" : "after-login"}.png`,
    });
  });
}
