import { chromium, expect } from "@playwright/test";
const base = process.env.REPORT_BASE_URL || "http://localhost:3201";
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.addInitScript(() => localStorage.setItem("muse_auth", "1"));
  const page = await ctx.newPage();
  const panel = async () => {
    const h = page.getByRole("button", { name: "DEMO", exact: true });
    if (await h.isVisible()) await h.click();
  };
  const collapse = async () => page.getByRole("button", { name: "Collapse demo panel" }).click();
  const remove = async (value) => {
    await panel();
    await page.getByLabel("Review content", { exact: true }).selectOption(value);
    await page.getByRole("button", { name: "Simulate reviewer removal" }).click();
    await collapse();
  };
  await page.goto(base + "/song/result?id=sp-neon-static&demo=1");
  await expect(page.locator(".song-result")).toBeVisible();
  await remove("song:sp-neon-static");
  await expect(page.getByRole("button", { name: /Removed from community/ })).toBeVisible();
  await panel();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await collapse();
  await expect(page.locator("audio,video")).toHaveCount(0);
  await expect(page.getByText("We couldn’t find this", { exact: true })).toBeVisible();
  console.log("PASS private playback revoked on sign-out");
  // New document resets moderation. All following navigation uses actual visible links.
  await page.goto(base + "/?demo=1");
  await expect(page.locator('a[href="/watch?id=mv-cinematic-dark"]').first()).toBeVisible();
  await remove("mv:mv-cinematic-dark");
  await expect(page.locator('a[href="/watch?id=mv-cinematic-dark"]')).toHaveCount(0);
  await remove("mv:hero-vintage-drive");
  await expect(page.locator('a[href="/watch?id=hero-vintage-drive"]')).toHaveCount(0);
  console.log("PASS Home rail and official hero removal");
  await page.locator('a[href="/explore/mvs"]').first().click();
  await expect(page).toHaveURL(/\/explore\/mvs/);
  await expect(page.locator('a[href="/watch?id=mv-cinematic-dark"]')).toHaveCount(0);
  console.log("PASS public Explore retains removal across client navigation");
  await page.goto(base + "/creator?demo=1");
  await expect(page.getByRole("button", { name: "Cinematic Night", exact: true })).toBeVisible();
  await remove("mv:cp-cinematic-night");
  await expect(page.getByRole("button", { name: "Cinematic Night", exact: true })).toHaveCount(0);
  console.log("PASS public creator profile removal");
  await page.goto(base + "/watch?id=mv-cinematic-dark&demo=1");
  await expect(
    page.getByRole("button", { name: "Report", exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await remove("mv:mv-cinematic-dark");
  await expect(page.locator("audio,video")).toHaveCount(0);
  await expect(page.getByText("We couldn’t find this", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Report", exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  console.log("PASS public player removal and refresh reset");
} finally {
  await browser.close();
}
