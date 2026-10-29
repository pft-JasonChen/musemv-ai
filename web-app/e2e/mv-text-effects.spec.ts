import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`MV text effects: samples, draft/discard and reverting at ${width}px`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/history");
    await page
      .locator(".history-card")
      .filter({ hasText: "Cinematic Night" })
      .getByRole("link", { name: "Cinematic Night" })
      .first()
      .click();
    await page.getByRole("button", { name: "Edit MV", exact: true }).click();
    const merge = page.locator(".mv-edit__merge-btn");
    await expect(merge).toBeDisabled();
    const title = page.getByRole("textbox", { name: "MV title", exact: true });
    await expect(title).toHaveAttribute("maxlength", "60");
    await expect(page.getByRole("switch", { name: "Show Subtitle", exact: true })).toBeEnabled();

    const open = async () => {
      await page.getByRole("button", { name: "Edit Effects", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Edit Title & Subtitle" });
      await expect(dialog).toHaveCount(1);
      await expect(page.locator(".report-overlay")).toHaveCount(1);
      await expect(page.locator(".report-overlay")).toHaveCSS("opacity", "1");
      await expect(dialog.getByRole("button", { name: "Retry" })).toHaveCount(0);
      await expect(dialog.getByText(/Live MV preview/)).toHaveCount(0);
      await expect(dialog.getByRole("tab", { name: "Title", exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      return dialog;
    };
    let dialog = await open();
    await expect(dialog.getByRole("radio")).toHaveCount(8);
    await expect
      .poll(() => dialog.locator('.effects-dialog__thumb img[src$=".webp"]').count())
      .toBeGreaterThan(1);
    // Scrolling changes motion only; it must not select or dirty the draft.
    await dialog.locator(".effects-dialog__strip").evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(dialog.getByRole("radio").first().locator("img")).toHaveAttribute(
      "src",
      /\/covers\//,
    );
    await expect(dialog.getByRole("radio").last().locator("img")).toHaveAttribute("src", /\.webp$/);
    await expect(dialog.getByRole("radio", { name: "快速淡入", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(dialog.getByRole("button", { name: /Use default/i })).toHaveCount(0);
    await expect(dialog.locator("video")).toBeVisible();
    await expect(dialog.locator("video")).toHaveAttribute("autoplay", "");
    await expect(dialog.locator(".fx-title, .fx-sub")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await dialog.getByRole("radio", { name: "作者接標題", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    await expect(
      dialog.locator(
        '.effects-dialog__thumb img[src="/assets/title_mv/title_effect_author_title.webp"]',
      ),
    ).toBeVisible();
    // Ensure supplied sample/cover assets really loaded, not just a valid-looking DOM.
    await expect
      .poll(() =>
        dialog
          .locator("img")
          .evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0)),
      )
      .toBe(true);
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(merge).toBeEnabled();

    dialog = await open();
    await expect(dialog.getByRole("radio", { name: "作者接標題", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await dialog.getByRole("radio", { name: "柔和淡入", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    dialog = await open();
    await expect(dialog.getByRole("radio", { name: "作者接標題", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.screenshot({ path: `/tmp/mv-effects-${width}.png` });
    await dialog.getByRole("tab", { name: "Subtitle", exact: true }).click();
    await expect(dialog.getByRole("radio")).toHaveCount(17);
    await expect(dialog.getByRole("radio", { name: "書法淡入", exact: true })).toBeEnabled();
    await expect
      .poll(() => dialog.locator('.effects-dialog__thumb img[src$=".webp"]').count())
      .toBeGreaterThan(1);
    await expect(dialog.locator('img[src*="/title_effect_"][src$=".webp"]')).toHaveCount(0);
    await dialog.getByRole("radio", { name: "書法淡入", exact: true }).click();
    await expect(dialog.getByRole("radio", { name: "書法淡入", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(
      dialog.locator(
        'img[src="/assets/title_mv/subtitle_effect_left_calligraphy_fadein_modular.webp"]',
      ),
    ).toBeVisible();
    const card = dialog.getByRole("radio", { name: "書法淡入", exact: true });
    const frame = await card.locator(".effects-dialog__sample-frame").boundingBox();
    const label = await card.locator(".effects-dialog__sample-label").boundingBox();
    expect(frame).not.toBeNull();
    expect(label!.y).toBeGreaterThanOrEqual(frame!.y + frame!.height - 1);
    expect(frame!.width / frame!.height).toBeCloseTo(16 / 9, 1);
    await page.screenshot({ path: `/tmp/mv-subtitle-effects-${width}.png` });
    // Restore Subtitle as well before checking the baseline Merge state.
    await dialog.getByRole("radio", { name: "置中靜態", exact: true }).click();
    await dialog.getByRole("tab", { name: "Title", exact: true }).click();
    await dialog.getByRole("radio", { name: "快速淡入", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(merge).toBeDisabled();
  });
}

test("MV text effects: successful Merge restores settings and effects from History", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
  await page.goto("/history");
  const openRow = async () => {
    await page
      .locator(".history-card")
      .filter({ hasText: "Cinematic Night" })
      .getByRole("link", { name: "Cinematic Night" })
      .first()
      .click();
    await page.getByRole("button", { name: "Edit MV", exact: true }).click();
  };
  await openRow();
  await page.getByRole("textbox", { name: "MV title", exact: true }).fill("Caption after Merge");
  await page.getByRole("button", { name: "Edit Effects", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Edit Title & Subtitle" });
  await expect(dialog.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(dialog.getByText(/Live MV preview/)).toHaveCount(0);
  await dialog.getByRole("radio", { name: "作者接標題", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await page.locator(".mv-edit__merge-btn").click();
  await page.waitForURL("**/mv/result?id=*");
  await page.getByRole("link", { name: "History", exact: true }).first().click();
  await openRow();
  await expect(page.getByRole("textbox", { name: "MV title", exact: true })).toHaveValue(
    "Caption after Merge",
  );
  await expect(page.locator(".mv-edit__merge-btn")).toBeDisabled();
  await page.getByRole("button", { name: "Edit Effects", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Edit Title & Subtitle" });
  await expect(dialog.getByRole("radio", { name: "作者接標題", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
});
