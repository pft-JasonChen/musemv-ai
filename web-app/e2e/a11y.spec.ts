import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync, statSync } from "fs";
import { join } from "path";

// Routes are discovered from the filesystem so new pages are gated
// automatically. Dynamic segments ([id]) are skipped — they need seeded data.
function discoverRoutes(dir: string, base = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // The [locale] root wraps every route. English (the default locale) is
      // served UNPREFIXED, so recurse with the base unchanged to test the real
      // URLs (/profile, not /enu/profile). Other dynamic segments ([id]) are
      // skipped (they need seeded data).
      if (entry === "[locale]") {
        routes.push(...discoverRoutes(full, base));
        continue;
      }
      if (entry.startsWith("[")) continue; // dynamic segment
      routes.push(...discoverRoutes(full, `${base}/${entry}`));
    } else if (entry === "page.tsx") {
      routes.push(base || "/");
    }
  }
  return routes.sort();
}

const routes = discoverRoutes(join(__dirname, "..", "src", "app"));

// KNOWN ISSUE (TODO.md #2): the accent "Create" pills (white 12px text on
// var(--accent) #A855F7) fail WCAG AA contrast. The token is Figma-synced and
// awaiting a design decision, so those specific pills are excluded to keep the
// gate meaningful for everything else. Remove this exclusion once the design
// owner picks a fix.
const KNOWN_CONTRAST_PILLS = [
  "button.px-3\\.5.py-1\\.5",
  "button.px-4.py-1\\.5",
  // KNOWN ISSUE (DESIGNER-TODO A8) — the SELECTED tab pill, white 13px bold on
  // var(--color-accent-purple) #A855F7, measures 3.95:1 against the 4.5:1 AA
  // needs. Same defect family as the Create pills above (white on the accent at
  // a small bold size) and the same reason it is excluded rather than patched:
  // picking the replacement colour is the designer's call, and DP's own
  // Tabs.css / tokens.css are the place it has to be fixed.
  //
  // WHY IT SURFACES ONLY NOW, WITH SLICE 3b: `/history` has had these tabs since
  // slice 2b, but this spec does not seed auth, so /history renders nothing but
  // the sign-in modal to axe (the coverage caveat in AGENTS.md). `/explore/songs`
  // and `/song/play` are not auth-guarded, so their tab bar is the first one axe
  // has ever actually measured. Pre-existing, newly visible — not 3b's doing.
  ".tabs__tab--active",
  // KNOWN ISSUE (DESIGNER-TODO A13) — `--neutral-dark-44` (#676779) as caption
  // text on the near-black page measures 3.59:1 against AA's 4.5:1. A13 logged
  // it on `/profile`'s stats captions; slice 3e found `CommunityProfilePage.css`
  // reaching for the same token twice more, so this is A13's second ROUTE, not a
  // new defect — and it is the first evidence that the token is a system-level
  // choice rather than one stylesheet's slip.
  //
  // Excluded rather than overridden on the product owner's call (2026-08-05):
  // we do not pick designer colours (the A1 convention). Both stylesheets are
  // gated verbatim, so the fix has to land upstream in the drop.
  ".community-profile__stats span",
  ".community-profile__copy time",

  // ── ADDED 2026-09-09 ──────────────────────────────────────────────────────
  // Six selectors, three defect families, THIRTEEN routes. All of them are
  // `color-contrast` and nothing else: a full axe sweep of all 21 discovered
  // routes produced exactly one violation id, on 13 routes, and every offending
  // rule lives in `src/styles/designer/` — i.e. all of it is DP-authored colour
  // in a stylesheet that is gated VERBATIM, so none of it can be fixed here.
  // (The 8 clean routes are genuinely clean, not excluded into silence.)
  //
  // Product owner, 2026-09-09: exclude all six, referencing the two entries
  // that already own them. NOT a new design decision — see per-family notes.

  // FAMILY 1 — white on the brand accent #A855F7 at 3.95:1 (12px).
  // `/` and `/faq` (the primary CTA label) and `/watch` (the desktop Create-MV
  // CTA). This is `TODO.md` #2 to the decimal place, and #2 was closed
  // ⚪ WON'T FIX by the product owner on 2026-09-01 with the explicit
  // instruction "do not treat a future session's re-discovery of this contrast
  // ratio as a new finding". So these are new SELECTORS of an already-decided
  // defect, not a new one. Only the accent-backed sizes are excluded —
  // `.button--large.button--primary` is `var(--gradient-mv)`, a different
  // background, and stays gated.
  ".button--medium.button--primary > .button__label",
  ".button--small.button--primary > .button__label",
  ".mv-player__cta-desktop",

  // FAMILY 2 — low-opacity secondary text on a dark surface. This is the OTHER
  // half of DESIGNER-TODO A1's stated systemic cause ("低不透明度的次要文字壓在
  // 深色卡片上"), and A1's fix option 1 already names the remedy: raise the
  // secondary-text alpha from 40% to ~60%, exactly what was done to
  // `.tabs__tab` and shipped. Not applied here because the remedy belongs in
  // DP's own stylesheets (these two rules are `rgba(255,255,255,0.4)` inside
  // verbatim `MVCreatePage.css` / `SongCreatePage.css`) and because doing it in
  // an override would move pixels on 9 routes whose `-linux` visual baselines
  // cannot be re-recorded on Windows. 3.84:1 on 9 routes.
  ".mv-create__char-count",
  ".song-create__char-count",
  // Same family, worst ratio in the whole sweep — 2.39:1 — and a fourth
  // MECHANISM: not a colour at all but `opacity: 0.3` on an already-dim chip
  // (`MVCreatePage.css`). Worth calling out to the designer separately: an
  // opacity multiplier cannot be fixed by choosing a better foreground colour.
  ".mv-create__settings-chip--dim",

  // FAMILY 3 — `.badge--failed`, `--pf-red` #ff2600 on a 20% tint of itself,
  // 3.53:1 at 9px bold, on `/creator`. This is A1's OWN third table row, which
  // A1 recorded as "尚未被 axe 量到 (它只出現在 /history,仍在覆蓋缺口裡)" —
  // unmeasured because it only appeared on an auth-guarded route that axe sees
  // only as a sign-in modal. `/creator` is not guarded, so the coverage gap has
  // closed on it and A1's prediction came true a second time (the first was
  // `.tabs__tab--active` arriving via `/explore/songs`, noted above).
  // Pre-existing and newly visible — not a regression.
  ".badge--failed",
];

for (const route of routes) {
  test(`a11y: ${route} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    for (const sel of KNOWN_CONTRAST_PILLS) builder = builder.exclude(sel);
    const results = await builder.analyze();
    expect(results.violations).toEqual([]);
  });
}
