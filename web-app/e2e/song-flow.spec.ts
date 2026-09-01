import { test, expect } from "@playwright/test";

// Walks the AI Song creation flow (mock backend).
test("AI Song: describe -> compose -> result", async ({ page }) => {
  // /song/create is open to guests since 2026-08-12, but this spec drives the
  // FULL create flow and Create Song is gated — so seed the mock auth flag
  // before any page script
  // runs so the guard sees a logged-in user instead of opening the sign-in modal.
  await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
  await page.goto("/song/create");

  const cta = page.getByRole("button", { name: /Create Song/ });
  await expect(cta).toBeDisabled();

  await page
    .getByPlaceholder(/A bittersweet love song/)
    .fill("An upbeat summer anthem about chasing dreams with friends.");
  await expect(cta).toBeEnabled();

  await cta.click();
  await page.waitForURL("**/song/result", { timeout: 14000 });

  // Product owner, 2026-09-01: GENRE and MOOD now start EMPTY, so a Simple-tab
  // song generated without opening STYLE has no genre/mood to report and the
  // result's tag line stays hidden. (It was "Pop · Uplifting" until that change
  // — the seeds were removed, not the line.) The line's own content is guarded
  // where it is actually populated: `behaviour-regressions.spec.ts` → "3j: the
  // result still says what was generated".
  await expect(page.locator(".song-result__meta .song-create__title-hint--hidden")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Use in Music Video" })).toBeVisible();
});
