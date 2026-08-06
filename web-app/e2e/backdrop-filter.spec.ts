// Regression guard for TODO.md #4 — the production build must not strip the
// standard `backdrop-filter`.
//
// WHY THIS EXISTS
//   lightningcss (inside `@tailwindcss/postcss`) collapses `backdrop-filter` and
//   `-webkit-backdrop-filter` into one declaration when their values match, and
//   the LAST one wins. Every designer stylesheet writes standard-first, so the
//   bundle kept only the `-webkit-` form — which Chrome ignores completely. 13 of
//   the 19 copied designer stylesheets lost their blur, and nothing went red:
//   `/history` is the only other migrated screen with a two-row navbar and at
//   1440x800 it never scrolls, so nothing ever passed behind the gradient to make
//   the missing blur visible. `postcss-restore-backdrop-filter.mjs` repairs it.
//
// WHY IT ASSERTS THE COMPUTED VALUE AND NOT THE STYLESHEET TEXT
//   Grepping the built CSS would prove the property is present; only
//   `getComputedStyle` proves the browser ACCEPTED it. Those came apart here
//   before — the CSS did contain a backdrop-filter, just the prefixed spelling,
//   and Chrome 149 resolves that to `none`. This is the assertion that would have
//   caught the bug on the day it shipped.
//
//   Playwright serves the LAST production build (`next start -p 3100`), so this
//   runs against exactly the pipeline that broke. In `next dev` the bug does not
//   reproduce at all.
//
// NOT tagged @visual: it is fast, and a broken blur is a functional regression
// on every migrated screen, so it belongs in the default `npm run e2e` run.

import { expect, test } from "@playwright/test";

/**
 * One case per DP stylesheet that carries a `backdrop-filter` AND is reachable
 * on a migrated route today. Each names the screen that would visibly break.
 */
const CASES = [
  {
    stylesheet: "DetailNavbar.css",
    route: "/explore/mvs",
    selector: ".detail-navbar",
    width: 1440,
  },
  {
    // /history, not /explore/songs: SongDetailView only borrows RoomNavbar's
    // `Tabs`, it does not render the `.room-navbar` shell itself.
    stylesheet: "RoomNavbar.css",
    route: "/history",
    selector: ".room-navbar",
    width: 1440,
    auth: true,
  },
  {
    stylesheet: "Sidebar.css",
    route: "/explore/mvs",
    selector: ".sidebar",
    width: 1440,
  },
  {
    stylesheet: "MobileTabBar.css",
    route: "/explore/mvs",
    selector: ".mobile-tabbar",
    width: 375,
  },
  {
    stylesheet: "MobileHeader.css",
    route: "/explore/mvs",
    selector: ".mobile-header",
    width: 375,
  },
] as const;

for (const testCase of CASES) {
  const { stylesheet, route, selector, width } = testCase;
  test(`${stylesheet}: ${selector} keeps a real backdrop-filter at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    if ("auth" in testCase && testCase.auth) {
      // AuthGuard would otherwise render only the sign-in modal — same seeding
      // trick the mv-flow / song-flow specs use.
      await page.addInitScript(() => localStorage.setItem("muse_auth", "1"));
    }
    await page.goto(route);

    const target = page.locator(selector).first();
    await expect(target).toBeAttached();

    const computed = await target.evaluate((el) => getComputedStyle(el).backdropFilter);

    // "none" is what Chrome reports when only `-webkit-backdrop-filter` survived.
    expect(computed, `${selector} lost its blur — see TODO.md #4`).not.toBe("none");
    expect(computed).toContain("blur");
  });
}

test("no rule in the shipped CSS has -webkit-backdrop-filter without the standard property", async ({
  page,
}) => {
  await page.goto("/explore/songs");

  // Read the stylesheet TEXT over HTTP, not the CSSOM. The CSSOM cannot see this
  // bug at all: Chrome does not implement `-webkit-backdrop-filter`, so it drops
  // the declaration while parsing and `getPropertyValue("-webkit-backdrop-filter")`
  // comes back empty for exactly the rules that are broken. A CSSOM version of
  // this test passed both with and without the fix — measured, not assumed.
  const hrefs = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  expect(hrefs.length).toBeGreaterThan(0);

  const orphans: string[] = [];
  for (const href of hrefs) {
    const css = await (await page.request.get(href)).text();
    // Each rule body between braces; enough for minified output, which is what ships.
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(^|[;\s])-webkit-backdrop-filter\s*:/.test(body)) continue;
      if (/(^|[;{\s])backdrop-filter\s*:/.test(body)) continue;
      orphans.push(selector.trim());
    }
  }

  expect(orphans, "these rules would render unblurred in Chrome — see TODO.md #4").toEqual([]);
});
