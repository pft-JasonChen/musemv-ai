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
  // Scope to the dialog and match the name EXACTLY. getByRole name matching is
  // substring-by-default, so a bare { name: "Use" } also matches "Use Trimmed
  // Audio" / "Use in Music Video". Modal portals to document.body, so those
  // page-level buttons come earlier in DOM order and .first() resolved to one
  // sitting under the modal scrim — the click then retried against the scrim for
  // the whole 20s expect timeout. (Fixed 2026-08-02: this suite was in no gate,
  // so the breakage sat unnoticed. That is what C2 is about.)
  const chooseSong = page.getByRole("dialog", { name: "Choose Song" });
  // Slice 3g-2: DP reveals the row's "Use" pill only while the row is active
  // (`opacity: 0; pointer-events: none` otherwise), so the row has to be
  // hovered before the pill will accept a click.
  const songRow = chooseSong.locator(".mv-song-picker__row").first();
  await songRow.hover();
  await songRow.getByRole("button", { name: "Use", exact: true }).click(); // AC2 (opens Trim)
  // Slice 3g-2: DP's sheets confirm with a Cancel/Confirm footer, not WA's old
  // "Use Trimmed Audio" button.
  await page
    .getByRole("dialog", { name: "Trim Audio" })
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(cta).toBeEnabled();

  await cta.click(); // AC5
  await page.getByText("Create Storyboard First").click(); // AC6

  await page.waitForURL("**/mv/storyboard"); // AC10
  await expect(page.getByText("Scene 1")).toBeVisible();

  await page.getByRole("button", { name: /Create MV/ }).click(); // AC14
  await page.waitForURL("**/mv/result"); // AC11
  await expect(page.locator("video")).toBeVisible(); // AC15
});
