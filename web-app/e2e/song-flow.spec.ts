import { test, expect } from "@playwright/test";

// Walks the AI Song creation flow (mock backend).
test("AI Song: describe -> compose -> result", async ({ page }) => {
  await page.goto("/song/create");

  const cta = page.getByRole("button", { name: /Generate Song/ });
  await expect(cta).toBeDisabled();

  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await expect(cta).toBeEnabled();

  await cta.click();
  await page.waitForURL("**/song/result", { timeout: 14000 });

  // Result view shows the genre/mood tag line (defaults: Pop · Uplifting).
  await expect(page.getByText(/Pop · Uplifting/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Use in Music Video" })).toBeVisible();
});
