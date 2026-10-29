// Targeted UI verification and storyboard capture. Never starts the full e2e suite.
import { chromium, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "node:fs";
const OUT = path.join(__dirname, "specs/screenshots");
const BASE = process.env.REPORT_BASE_URL || "http://localhost:3201";
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const focus = {};
    const shot = async (name) => {
      await page.waitForTimeout(350);
      const targets = {
        "01_reasons": page.getByRole("radio").first(),
        "02_selected": page.getByRole("button", { name: "Submit Report", exact: true }),
        "03_details": page.getByRole("button", { name: "Submit Report", exact: true }),
        "04_success": page.getByRole("button", { name: "Done", exact: true }),
        "07_failure": page.getByRole("button", { name: "Submit Report", exact: true }),
        "10_private_removed": page.getByRole("button", { name: /Removed from community/ }),
        "11_history_notice": page
          .locator(".history-card__menu--visible")
          .getByRole("menuitem", { name: /Removed from community/ }),
        "12_notice_detail": page.getByRole("button", { name: "Got It", exact: true }),
        "13_mobile_reasons": page.getByRole("radio").first(),
        "14_mobile_details": page.getByRole("button", { name: "Submit Report", exact: true }),
        "15_mobile_success": page.getByRole("button", { name: "Done", exact: true }),
      };
      if (targets[name]) {
        const box = await targets[name].boundingBox();
        const view = page.viewportSize();
        if (box && box.y >= 0 && box.y + box.height <= view.height)
          focus[name + ".png"] = [
            {
              box: [
                (box.x / view.width) * 100,
                (box.y / view.height) * 100,
                (box.width / view.width) * 100,
                (box.height / view.height) * 100,
              ],
              label: "Next action",
            },
          ];
      }
      await page.screenshot({ path: path.join(OUT, name + ".png") });
      fs.writeFileSync(
        path.join(__dirname, "specs/focus.json"),
        JSON.stringify(focus, null, 2) + "\n",
      );
      console.log("captured", name);
    };
    const report = () =>
      page.getByRole("button", { name: "Report", exact: true }).filter({ visible: true }).first();
    const submit = () => page.getByRole("button", { name: "Submit Report", exact: true });
    const done = async () => {
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await page.waitForTimeout(350);
    };
    const open = async () => {
      await report().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(350);
    };
    // Native same-document history changes exercise the shared report session without a reload.
    const navMv = async (id) => {
      await page.evaluate((id) => window.history.pushState(null, "", "/watch?id=" + id), id);
      await expect(page).toHaveURL(new RegExp(id));
      await page.waitForTimeout(400);
    };
    const panel = async () => {
      const handle = page.getByRole("button", { name: "DEMO", exact: true });
      if (await handle.isVisible()) await handle.click();
      await expect(page.getByRole("complementary", { name: "Demo state panel" })).toBeVisible();
    };
    const collapse = async () => {
      await page.getByRole("button", { name: "Collapse demo panel" }).click();
    };
    // Public visitor: no auth seed. Confirm every stylesheet loaded before trusting pixels.
    await page.goto(BASE + "/watch?id=mv-cinematic-dark");
    await expect(report()).toBeVisible();
    for (const href of await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((nodes) => nodes.map((n) => n.href))) {
      const r = await page.request.get(href);
      if (!r.ok() || (await r.body()).length < 100) throw new Error("Missing stylesheet " + href);
    }
    await open();
    await expect(submit()).toBeDisabled();
    await expect(page.getByRole("radio")).toHaveCount(6);
    await shot("01_reasons");
    await page.getByRole("radio", { name: "Spam or commercial advertising", exact: true }).click();
    await expect(submit()).toBeEnabled();
    await shot("02_selected");
    await page.getByRole("button", { name: "Something else", exact: true }).click();
    await page.getByLabel("Details", { exact: true }).fill("   ");
    await expect(submit()).toBeDisabled();
    await page
      .getByLabel("Details", { exact: true })
      .fill("The title and thumbnail do not match this content.");
    await shot("03_details");
    await page.getByRole("button", { name: "Back from Something else" }).click();
    await page.getByRole("button", { name: "Something else", exact: true }).click();
    await expect(page.getByLabel("Details", { exact: true })).toHaveValue(
      "The title and thumbnail do not match this content.",
    );
    await submit().click();
    await expect(page.getByText("Thank you for keeping Muse safe", { exact: true })).toBeVisible();
    await page.waitForTimeout(3200);
    await expect(page.getByRole("button", { name: "Done", exact: true })).toBeVisible();
    await shot("04_success");
    await done();
    await report().click();
    await expect(page.getByRole("status")).toHaveText("You already reported this content.");
    await shot("05_duplicate");
    // Four more successful MV reports across client navigation retain one session.
    for (const id of ["mv-nature-earth", "mv-late-night-stage", "mv-neon-city", "mv-anime-style"]) {
      await navMv(id);
      await open();
      await page.getByRole("radio").first().click();
      await submit().click();
      await expect(page.getByRole("button", { name: "Done", exact: true })).toBeVisible();
      await done();
    }
    await navMv("mv-law-rhythm");
    await report().click();
    await expect(page.getByRole("status")).toHaveText(
      "You have reached the report limit for this session.",
    );
    await shot("06_cap");
    const toast = page.getByRole("status");
    await toast.hover();
    await page.waitForTimeout(3100);
    await expect(toast).toBeVisible();
    await toast.focus();
    await page.mouse.move(1400, 0);
    await page.waitForTimeout(3100);
    await expect(toast).toBeVisible();
    await toast.evaluate((n) => n.blur());
    await navMv("mv-cinematic-dark");
    await report().click();
    await expect(page.getByRole("status")).toHaveText("You already reported this content.");
    // Refresh resets both guards. QA can disable a failing backend while retaining draft.
    await page.goto(BASE + "/watch?id=mv-cinematic-dark&demo=1");
    await panel();
    await page.getByRole("switch", { name: "Report submission fails" }).click();
    await collapse();
    await open();
    await page.getByRole("button", { name: "Something else", exact: true }).click();
    await page.getByLabel("Details", { exact: true }).fill("Please review the misleading title.");
    await submit().click();
    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
      "Couldn’t submit your report. Please try again.",
    );
    await expect(page.getByLabel("Details", { exact: true })).toHaveValue(
      "Please review the misleading title.",
    );
    await shot("07_failure");
    await panel();
    await page.getByRole("switch", { name: "Report submission fails" }).click();
    await collapse();
    await submit().click();
    await expect(page.getByRole("button", { name: "Done", exact: true })).toBeVisible();
    await done();
    // Share is public, but reviewer removal makes the currently-open page unavailable.
    await page.goto(BASE + "/share?id=mv-cinematic-dark&demo=1");
    await panel();
    await page.getByLabel("Review content", { exact: true }).selectOption("mv:mv-cinematic-dark");
    await page.getByRole("button", { name: "Simulate reviewer removal" }).click();
    await collapse();
    await expect(page.getByText("This link isn't available", { exact: true })).toBeVisible();
    await expect(page.locator("video,audio")).toHaveCount(0);
    await shot("08_share_removed");
    // Authenticated owner: no report, removal stays privately playable, History notice.
    await page.evaluate(() => localStorage.setItem("muse_auth", "1"));
    await page.goto(BASE + "/song/result?id=sp-neon-static&demo=1");
    await expect(page.locator(".song-result")).toBeVisible();
    await expect(report()).toHaveCount(0);
    await shot("09_own_result");
    await panel();
    await page.getByLabel("Review content", { exact: true }).selectOption("song:sp-neon-static");
    await page.getByRole("button", { name: "Simulate reviewer removal" }).click();
    await collapse();
    await expect(page.getByRole("button", { name: /Removed from community/ })).toBeVisible();
    await shot("10_private_removed");
    await page
      .getByRole("link", { name: "History", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/history/);
    const card = page
      .locator(".history-card")
      .filter({ has: page.locator('a[href="/song/result?id=sp-neon-static"]') })
      .first();
    console.log("history cards", await page.locator(".history-card").count());
    await card.getByRole("button", { name: "Options", exact: true }).click();
    await expect(
      page
        .locator(".history-card__menu--visible")
        .getByRole("menuitem", { name: /Removed from community/ }),
    ).toBeVisible();
    await shot("11_history_notice");
    await page
      .locator(".history-card__menu--visible")
      .getByRole("menuitem", { name: /Removed from community/ })
      .click();
    await expect(page.getByRole("dialog", { name: "Content Notice" })).toBeVisible();
    await shot("12_notice_detail");
    await page.getByRole("button", { name: "Got It", exact: true }).click();
    // Narrow-layout visual QA: dialog + details + failure + success, separate tab session.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + "/watch?id=mv-cinematic-dark");
    await open();
    await shot("13_mobile_reasons");
    await page.getByRole("button", { name: "Something else", exact: true }).click();
    await page.getByLabel("Details", { exact: true }).fill("Please review this content.");
    await shot("14_mobile_details");
    await submit().click();
    await expect(page.getByRole("button", { name: "Done", exact: true })).toBeVisible();
    await shot("15_mobile_success");
    await done();
    if (errors.length) throw new Error(errors.join("\n"));
    fs.writeFileSync(
      path.join(__dirname, "verification.json"),
      JSON.stringify(
        {
          date: "2026-10-29",
          viewports: [1440, 390],
          checks: [
            "guest-report",
            "six-reasons",
            "disabled-submit",
            "details-validation-and-retention",
            "done-only",
            "duplicate",
            "five-success-cap",
            "duplicate-priority",
            "toast-hover-focus",
            "reload-reset",
            "failure-retry",
            "owner-no-report",
            "public-share-removal",
            "private-result",
            "history-notice",
          ],
          screenshots: fs.readdirSync(OUT).length,
        },
        null,
        2,
      ) + "\n",
    );
    console.log("Report verification passed");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
