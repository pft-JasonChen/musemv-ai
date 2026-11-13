import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

async function effects(page: Page) {
  await page.getByRole("button", { name: "Edit Effects", exact: true }).click();
  await expect(page.locator(".report-overlay")).toHaveCount(1);
  await expect(page.locator(".report-overlay")).toHaveCSS("opacity", "1");
  return page.getByRole("dialog", { name: "Edit Title & Subtitle" });
}

async function dataMode(page: Page, value: "original" | "available" | "no-lyrics" | "untimed") {
  await page.getByRole("button", { name: "DEMO", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Demo state panel" });
  await panel.getByRole("combobox", { name: /MV subtitle data/ }).selectOption(value);
  await panel.getByRole("button", { name: "Collapse demo panel" }).click();
}

async function captureSubtitle(page: Page, path: string) {
  const dialog = page.getByRole("dialog", { name: "Edit Title & Subtitle" });
  const activeTab = dialog.getByRole("tab", { selected: true });
  await expect(activeTab).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await dialog.evaluate((el) =>
    Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)),
  );
  const notice = dialog.locator(".effects-dialog__status");
  const box = (await notice.count()) ? await notice.boundingBox() : null;
  await writeFile(`${path}.json`, JSON.stringify({ viewport: page.viewportSize(), notice: box }));
  await page.screenshot({ path });
}

for (const width of [1440, 390]) {
  test(`MV subtitle availability: all states and reversible demo at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
    await page.goto("/history?demo=1");
    const styles = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLLinkElement).href));
    expect(styles.length).toBeGreaterThan(0);
    for (const href of styles) {
      const response = await page.request.get(href);
      expect(response.status()).toBe(200);
      expect((await response.body()).length).toBeGreaterThan(100);
    }
    await page
      .locator(".history-card")
      .filter({ hasText: "Cinematic Night" })
      .getByRole("link", { name: "Cinematic Night" })
      .first()
      .click();
    await page.getByRole("button", { name: "Edit MV", exact: true }).click();
    const subtitleSwitch = page.getByRole("switch", { name: "Show Subtitle", exact: true });
    await expect(subtitleSwitch).toBeChecked();

    let dialog = await effects(page);
    const geometry = async () => {
      await dialog.evaluate((el) =>
        Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)),
      );
      return Promise.all(
        [
          dialog,
          dialog.locator(".mv-edit-mobile-scene__preview"),
          dialog.getByRole("tablist"),
          dialog.getByRole("button", { name: "Save", exact: true }),
        ].map((el) => el.boundingBox()),
      );
    };
    const initialGeometry = await geometry();
    await expect(dialog.getByText("Choose a title effect", { exact: true })).toBeVisible();
    await expect(dialog.locator(".effects-dialog__status")).toHaveCSS(
      "height",
      width === 1440 ? "32px" : "48px",
    );
    const expectStable = async () => {
      const boxes = await geometry();
      boxes.forEach((box, i) => {
        for (const key of ["x", "y", "width", "height"] as const)
          expect(Math.abs(box![key] - initialGeometry[i]![key])).toBeLessThan(1);
      });
    };
    await dialog.getByRole("radio").nth(1).click();
    await dialog.getByRole("tab", { name: "Subtitle", exact: true }).click();
    const savedChoice = await dialog.locator('[aria-checked="true"]').getAttribute("aria-label");
    await dataMode(page, "no-lyrics");
    const noLyrics = "Subtitles unavailable: this song has no lyrics.";
    await expect(dialog.getByText(noLyrics, { exact: true })).toBeVisible();
    await expect(subtitleSwitch).toHaveCount(0);
    await expect(page.locator(".mv-edit__toggle-row--subtitle")).toContainText(noLyrics);
    await expect(dialog.getByRole("switch")).toHaveCount(0);
    await expect(dialog.getByRole("tab", { name: "Subtitle", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("tab", { name: "Title", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(dialog.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");
    await expectStable();
    await expect(dialog.locator("video")).toBeVisible();
    // A Title draft is still saveable while Subtitle is unavailable.
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    dialog = await effects(page);
    await expect(dialog.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");
    await expect(dialog.getByRole("tab", { name: "Subtitle", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await captureSubtitle(page, `/tmp/mv-subtitle-no-lyrics-${width}.png`);

    await dataMode(page, "untimed");
    const untimed = "Subtitles unavailable: timed lyrics are missing.";
    await expect(dialog.getByText(untimed, { exact: true })).toBeVisible();
    await expect(page.locator(".mv-edit__toggle-row--subtitle")).toContainText(untimed);
    await expect(dialog.getByRole("switch")).toHaveCount(0);
    await expect(dialog.getByRole("tab", { name: "Subtitle", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("radiogroup")).toBeVisible();
    await expectStable();
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await captureSubtitle(page, `/tmp/mv-subtitle-untimed-${width}.png`);

    await dataMode(page, "available");
    await expect(dialog.getByRole("tab", { name: "Subtitle", exact: true })).toBeEnabled();
    await expect(subtitleSwitch).toBeChecked();
    await dialog.getByRole("tab", { name: "Subtitle", exact: true }).click();
    await expectStable();
    await expect(dialog.getByRole("radiogroup")).toBeVisible();
    await expect(dialog.locator('[aria-checked="true"]')).toHaveAttribute(
      "aria-label",
      savedChoice!,
    );
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await expect(dialog.getByText("Choose a subtitle effect", { exact: true })).toBeVisible();
    await captureSubtitle(page, `/tmp/mv-subtitle-available-${width}.png`);
    await dataMode(page, "original");
    await expect(dialog.getByRole("tab", { name: "Subtitle", exact: true })).toBeEnabled();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await subtitleSwitch.click();
    dialog = await effects(page);
    await dialog.getByRole("tab", { name: "Subtitle", exact: true }).click();
    await expect(dialog.getByText("Subtitles are off", { exact: true })).toBeVisible();
    const strip = dialog.getByRole("radiogroup");
    await expect(strip).toHaveAttribute("aria-disabled", "true");
    await expect(strip).toHaveCSS("overflow-x", "hidden");
    await expect(strip.locator('img[src$=".webp"]')).toHaveCount(0);
    await expect(strip.locator("button:not(:disabled)")).toHaveCount(0);
    const before = await strip.evaluate((el) => el.scrollLeft);
    const box = await strip.boundingBox();
    await page.mouse.move(box!.x + box!.width - 40, box!.y + 30);
    await page.mouse.down();
    await page.mouse.move(box!.x + 40, box!.y + 30, { steps: 8 });
    await page.mouse.up();
    await page.mouse.wheel(400, 0);
    await expect(strip).toHaveJSProperty("scrollLeft", before);
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await captureSubtitle(page, `/tmp/mv-subtitle-off-${width}.png`);
    await expectStable();
    await dialog.getByRole("switch", { name: "Turn subtitles on" }).click();
    await expectStable();
    await expect(strip).toHaveAttribute("aria-disabled", "false");
    await expect(strip).toHaveCSS("overflow-x", "auto");
    await strip.getByRole("radio").last().click();
    await expect(strip.getByRole("radio").last()).toHaveAttribute("aria-checked", "true");
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    await page.setViewportSize({ width, height: 500 });
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeInViewport();
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeInViewport();
  });
}
