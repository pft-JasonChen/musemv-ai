import { test, expect } from "@playwright/test";

// Walks the MV creation flow end-to-end (mock backend). Maps to spec ACs 1,2,5,6,8,10,11,14,15.
test("MV creation: compose -> storyboard -> render -> result", async ({ page }) => {
  // /mv/room is behind AuthGuard; seed the mock auth flag before any page script
  // runs so the guard sees a logged-in user instead of opening the sign-in modal.
  await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
  await page.goto("/mv/room");

  // AC1/AC4: CTA disabled until song + description present.
  const cta = page.getByRole("button", { name: "Create Music Video" });
  await expect(cta).toBeDisabled();

  await page
    .getByPlaceholder("Describe your video to help AI create a more compelling story.")
    .fill("A glamorous neon-lit night drive through the city.");
  await page.getByRole("button", { name: "Song Library" }).click(); // opens Choose Song modal
  await page.getByRole("button", { name: "Use" }).first().click(); // AC2 (opens Trim)
  await page.getByRole("button", { name: "Use Trimmed Audio" }).click();
  await expect(cta).toBeEnabled();

  await cta.click(); // AC5
  await page.getByText("Create Storyboard First").click(); // AC6

  await page.waitForURL("**/mv/storyboard"); // AC10
  await expect(page.getByText("Scene 1")).toBeVisible();

  await page.getByRole("button", { name: /Generate MV/ }).click(); // AC14
  await page.waitForURL("**/mv/result"); // AC11
  await expect(page.locator("video")).toBeVisible(); // AC15
});
