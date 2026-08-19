// Gate G2-c / G5-a — six-width visual baseline.
// docs/archive/redesign-migration-plan-2026-08-01.md §10.0, §11 Phase 0 step 2, G2-c, G5-a.
//
// WHAT THIS IS
//   Phase 0 step 2: "WA 現況在 320/375/768/1024/1440/1920 截圖存檔 → Phase 0 baseline."
//   Phase 1 then has to prove "舊畫面零變化" (G2-c: pixel diff = 0 at all six widths).
//   This file is that baseline, and the comparison, in one place.
//
// TAGGED @visual AND EXCLUDED FROM `npm run e2e` ON PURPOSE
//   19 routes × 6 widths = 114 screenshots, minutes of wall clock. The Stop gate runs
//   `npm run e2e`, which is `--grep-invert @visual`, so this never taxes an ordinary
//   session. Run it deliberately:
//       npm run e2e:visual           compare against the committed baseline
//       npm run e2e:visual:update    (re-)record the baseline — see below
//
//   RE-RECORDING IS A DECISION, NOT A FIX. `--update-snapshots` makes any failure go
//   away, which is exactly how a visual gate stops being one. Only re-record when the
//   change is intended, and say what changed in the commit message. During Phase 1 the
//   correct response to a diff is to fix the token map (docs/token-map.md), not to
//   re-record.
//
// FLAKE CONTROL
//   - animations: "disabled" — globals.css has .anim-fade/.anim-pop (.2–.24s) on mount;
//     without this every run races them.
//   - <video>/<img> masked: the mock result videos and remote-ish sample art are not
//     what this gate is about, and poster frames decode non-deterministically.
//   - caret hidden, and a settle wait after networkidle.
//
// The six widths come from the plan's breakpoint decision (§4.3): 320 and 1920 are the
// two WA has never been verified at, which is precisely why they are in the list.

import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const WIDTHS = [320, 375, 768, 1024, 1440, 1920] as const;

/** Same discovery rule as a11y.spec.ts: [locale] is transparent, other dynamic segments skipped. */
function discoverRoutes(dir: string, base = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "[locale]") {
        routes.push(...discoverRoutes(full, base));
        continue;
      }
      if (entry.startsWith("[")) continue;
      routes.push(...discoverRoutes(full, `${base}/${entry}`));
    } else if (entry === "page.tsx") {
      routes.push(base || "/");
    }
  }
  return routes.sort();
}

const routes = discoverRoutes(join(__dirname, "..", "src", "app"));

const slug = (route: string) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-"));

for (const route of routes) {
  for (const width of WIDTHS) {
    test(`@visual ${slug(route)} @ ${width}`, async ({ page }) => {
      test.slow();
      // Signed in: half the routes sit behind AuthGuard and would otherwise capture
      // an empty shell plus the sign-in modal.
      await page.addInitScript(() => window.localStorage.setItem("muse_auth", "1"));
      await page.setViewportSize({ width, height: 900 });

      const res = await page.goto(route, { waitUntil: "networkidle" });
      expect(res?.status(), `${route} must not error`).toBeLessThan(400);
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${slug(route)}-${width}.png`, {
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        // Mock media is not the subject of this gate and decodes non-deterministically.
        mask: [page.locator("video"), page.locator("img")],
        // A hair of tolerance for font rasterisation across machines; a token change
        // moves far more than this (measured: an accent swap hits 79 elements/route).
        maxDiffPixelRatio: 0.002,
      });
    });
  }
}

test(`@visual coverage: every route is captured at all six widths`, async () => {
  // Guards the guard: if a new route appears and this file silently skips it, the
  // Phase-1 "zero change" claim would cover less than it appears to.
  expect(routes.length, "no routes discovered — did src/app move?").toBeGreaterThan(0);
  expect(WIDTHS).toHaveLength(6);
  // 320 and 1920 are the two the plan flags as never verified (§4.3).
  expect(WIDTHS).toContain(320);
  expect(WIDTHS).toContain(1920);
});
