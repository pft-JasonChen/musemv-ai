# AGENTS.md — YouCam Muse Web (`web-app/`)

Desktop-native web port of the YouCam Muse mobile app: a backend-less, CEO-demoable prototype.
Next.js 16.2 (App Router) + React 19 + TypeScript strict + Tailwind v4. Package manager: npm.

## Commands

- `npm run dev` — http://localhost:3000
- `npm run typecheck` · `npm run lint` · `npm run test:run` — tsc / eslint / vitest
- `npm run build` — production build
- `npm run e2e` — Playwright + axe. It serves the LAST production build (`next start -p 3100`),
  so run `npm run build` immediately before. One-time per machine: `npx playwright install chromium`.
  Sandboxed envs with a system chromium: `CHROMIUM_PATH=/path/to/chromium npm run e2e` (no download).
  You need this whenever Playwright's pinned browser build differs from the image's — the error
  names a build number that "doesn't exist" and tells you to run `npx playwright install`; don't,
  just point `CHROMIUM_PATH` at the binary that IS there
  (`find /opt/pw-browsers -name chrome -o -name chrome-headless-shell`).
  The a11y spec auto-discovers routes from `src/app/`; known accent-pill contrast issues are
  excluded via selectors in `e2e/a11y.spec.ts` until the design decision lands (`TODO.md` #2).
  **Run it on a quiet machine, and don't leave a `next start -p 3100` of your own running.**
  Two ways that bites (both measured 2026-08-05): a server already on :3100 makes the run abort
  immediately (`reuseExistingServer` is false on purpose — see `playwright.config.ts`); and CPU
  contention makes the long chained specs flake on a `.click()` timeout. `G5-d#2` failed that way
  while three review subagents were driving their own browsers, then passed alone and passed again
  once the machine was idle. **A gate that fails under load is not evidence of a bug — re-run it
  quiet before believing either answer.**
- `npm run storybook` / `npm run build-storybook`

**Definition of done:** `npm run typecheck && npm run lint && npm run test:run && npm run build`
all exit 0. Hooks (`.claude/settings.json`) already format/lint on every edit, block any .ts/.tsx
edit that breaks `tsc --noEmit`, and block Stop until tsc + vitest pass — so sequence multi-file
refactors so the project typechecks after each individual edit (add the new before removing the old).

## Boundaries

- This folder has no `.git` — the repo root is one level up (`ycmuse-web/`). The root
  `.claude/rules/stage-*.md` pipeline (BEM classes, `prototypes/`, port 8000) belongs to a
  DIFFERENT sub-project; ignore it here. Inside `web-app/`, this file is the contract.
- NEVER: add a backend, DB, or `fetch()` call (`grep -rn 'fetch(' src` must stay empty);
  hand-edit a single token value in `src/styles/tokens.css`; reference
  `../ycmuse-app-prototype/` from code or config.
  **Tokens changed hands on 2026-08-04** (plan D2): `tokens.css` is now synced from the
  DESIGNER prototype (`designer-prototype/src/styles/tokens.css`), not the mobile Figma.
  It may be **replaced wholesale from a designer drop**, never edited value-by-value.
  WA-specific semantic names live in `src/styles/token-aliases.css`.
- Commit with explicit `git add <paths>` from the repo root, never `git add -A`.
  (`tsconfig.tsbuildinfo` and `.fuse_hidden*` junk are gitignored since 2026-07-11; if a stray
  `.fuse_hidden*` appears under `src/`, ignore it — never read, edit, or cite it.)
- ASK FIRST: new dependencies; changing design tokens or the design system; mass-refactoring the
  existing raw-hex/px backlog; destructive git operations.
- When a requirement is ambiguous or two sources disagree (spec vs code, README vs behavior),
  ask the user instead of guessing — a question is cheap, a silently wrong guess is not.
- When code and a doc disagree about current behavior, CODE wins — docs are being caught up
  after the fact, not the other way round. `specs/*.md` are the exception: they describe
  intended product behavior, which may be ahead of or behind the code. Either way, flag the
  divergence to the user instead of silently trusting (or silently overriding) the doc.

## Styling — how it actually works (globals.css is misleading)

- Colors: inline `style={{ background: "var(--card)" }}` using tokens from `tokens.css`. The
  `@theme` color utilities (`bg-card`, `text-accent`, …) compile but have zero adoption — don't use them.
- Sizes/type: Tailwind arbitrary px values matching the token scale — `text-[14px]`, `h-[46px]`.
  The `.t-*` classes and `--sp-*`/`--fs-*` tokens are unused; don't adopt them or `text-sm`-style named sizes.
- Radii: `rounded-*` is remapped in the `globals.css` `@theme` (`rounded-xl` = 14px, not Tailwind's
  12px). Use the named utilities; never `rounded-[Npx]`.
- Breakpoints: **six tiers — 320 / 375 / 768 / 1024 / 1440 / 1920** (plan D2). `md:` (768) and
  `xl:` (1920) are being added to the `@theme`; 320 is the minimum supported width and has no
  query of its own (it is the unprefixed default). These are BOTH code breakpoints and the
  six screenshot widths — the old "review viewports are not code breakpoints" split is gone.
  _In flight:_ the shell's phone cutover moves `sm:` (640) → `md:` (768) as part of the Shell
  slice. Until that slice lands you will still see `sm:` doing that job — it is mid-migration,
  not a rule violation. Check `docs/redesign-migration-plan.md` §4 for where it is up to.
- Raw `#fff`/`#000`, `rgba()` scrims, and gradient stops are existing tolerated practice — match
  the surrounding file; don't mass-convert. A NEW semantic color = add a token to `tokens.css`
  `:root` and consume it via `var()`.
- Hover/press transitions and the focus-visible ring are applied globally in `globals.css` — don't
  re-add them per component.
- **`backdrop-filter` only survives the build because of a PostCSS plugin.**
  `postcss-restore-backdrop-filter.mjs` (wired after `@tailwindcss/postcss`) re-adds the standard
  property to any rule that lightningcss left with only `-webkit-`. Without it every frosted-glass
  surface renders flat in production while looking fine in `next dev`. Don't remove it, don't
  reorder it before Tailwind, and don't "fix it properly" by editing `src/styles/designer/*.css` —
  those are gated verbatim. Guarded by `e2e/backdrop-filter.spec.ts`; the whole diagnosis is in
  `TODO.md` #4.

### Migrating a screen to the designer UI (`docs/redesign-migration-plan.md`)

- **Which token names to write (R-5).** Migrated markup uses **DP's native names**
  (`var(--radius-lg)`, `var(--color-…)`). `token-aliases.css` exists only so components that
  have NOT been migrated keep working; it shrinks with every slice and is deleted at the end.
  Do not "tidy" migrated markup back onto the WA aliases — that is the one change that would
  make the alias layer permanent. (The reverse rule is impossible anyway: DP's 52 stylesheets
  are copied verbatim and already reference DP names, and rewriting them forfeits file-level
  re-sync on the next drop.)
- **Style purity.** A migrated component's classes come from `src/styles/designer/`. Don't mix
  Tailwind utilities into it (Gate G3-d).
- **Icons (D4).** Migrated screens use DP's `mask-image` + `currentColor`. All 84 of WA's
  `ic_*.svg` filenames already exist in DP's 90, so this is a rename, not a redraw. Convert
  **only the screen you are migrating** — the inline-`<svg>` backlog is not yours to mass-refactor.
- **But NOT every DP icon is a mask, and guessing wrong renders nothing without erroring.**
  Read the rule before choosing the tag:
  - `width`/`height` only, no `mask-*` ⇒ DP paints it as a real `<img>`; use one. A `DpIcon`
    there is a mask with no background to clip — invisible. (`.credit-balance img`,
    `.{block}__close-icon`.)
  - `background: currentColor` + `mask-*` ⇒ `DpIcon`.
  - the selector names an ELEMENT (`.community-profile__social i`) ⇒ `DpIcon as="i"`. A `<span>`
    matches no rule at all and computes to 0×0.
  - a paint modifier exists (`.button__icon` sizes, `.button__icon--mask` paints) ⇒ pass **both**.

  All four were shipped broken at least once. `e2e/behaviour-regressions.spec.ts`'s
  "every mask icon on a migrated screen has something to clip" sweeps for both failure shapes —
  **add your route to its list when you migrate one.**

- **DP's choice of TAG is part of the style contract.** Beyond element selectors, swapping an
  `<a>` for a `<button>` can lose a specificity fight: `.community-profile__menu > button` is
  (0,1,1) and overrides the white-pill `.community-profile__menu-primary` at (0,1,0), so the
  migrated menu's primary action silently rendered as a plain transparent row. Keep DP's element
  and intercept the click for routing (R-9) instead of changing it.

House style in one line:

```tsx
<div className="rounded-xl p-4 text-[14px] lg:w-[220px]"
     style={{ background: "var(--card)", color: "var(--text-2)" }}>
```

## Architecture (full map: `docs/DEVELOPER-HANDOVER.md`)

- Every `src/app/**/page.tsx` is a thin page that returns a `"use client"` view from
  `src/components/<area>/` (a few tiny pages are client components using hooks directly).
  Wrap the view in `<Suspense>` if it uses `useSearchParams`.
- **API layer** (`src/lib/api/`): `contract.ts` defines `MuseApi` (job-based create/poll);
  `schemas.ts` holds the Zod schemas that ARE the entity types; `mock.ts` is the only fake-backend
  code; `index.ts` exports `api` — the single backend swap point. UI/providers import only `api`.
- **State** (`src/components/providers/`): `AppProviders` (mounted once, in
  `src/app/[locale]/layout.tsx` — never a second time) stacks Auth → Credits → History → MvFlow →
  SongFlow. Providers poll jobs via `pollJob`; they own no fake timers. Hooks: `useAuth`,
  `useCredits`, `useHistory`, `useMvFlow`, `useSongFlow`.
- New mock capability: schema in `schemas.ts` → endpoint on `MuseApi` + `MockMuseApi` → fixtures in
  `src/lib/mv/mock.ts` (community seed: `community.ts`) → a `start<Name>` callback in the matching
  provider → consume via its domain hook.
- Mid-flow routes guard themselves: if their flow state is missing, `router.replace()` to
  the flow entry (pattern: `src/components/mv/MvResult.tsx`). Flow state is in-memory; a reload loses it.

## i18n

- 9 locales, product codes not BCP-47: `enu jpn kor cht chs deu fra esp ptg`
  (`LOCALES` in `src/lib/i18n/config.ts`). English (`enu`) is the `DEFAULT_LOCALE` and is served
  UNPREFIXED (`/profile`); every other locale is URL-prefixed (`/jpn/profile`) — build paths with
  `localePath(locale, path)`, never string-concat a prefix.
- Dictionaries (`src/lib/i18n/dictionaries/`) currently cover ~40 keys — nav + the Profile screen
  only. `en.ts` is the source of truth and the fallback; all 8 non-English files (`jpn.ts`, `kor.ts`,
  `cht.ts`, `chs.ts`, `deu.ts`, `fra.ts`, `esp.ts`, `ptg.ts`) are intentionally EMPTY (`{}` typed
  `Partial<Dictionary>`). This is deliberate, not a bug — translation is deferred, an RD will fill
  them in later. `useT()`'s `t(key)` already falls back to English per-key when a translation is
  missing or empty, so the empty files render correctly today. Do not "fix" them by copying English
  into them or by deleting them.
- **New user-facing strings:** only `nav.*` and `profile.*` currently route through `useT()`
  (`Sidebar.tsx`, `ProfileView.tsx`) — everywhere else (Home, MV, Song, Community, History, Auth,
  Credits modals, …) is hardcoded English JSX, matching existing convention. Add a `TKey` to
  `en.ts` when the string belongs to nav or Profile; elsewhere, hardcoded English is still the
  norm — don't unilaterally wire a random component into `useT()` as a side quest, ask first if
  the scope is unclear.
- **Navigation:** `localePath(locale, path)` (used in `AuthGuard.tsx`, `LocaleProvider.tsx`,
  `Sidebar.tsx`, `ProfileView.tsx`, `AccountMenu.tsx`) preserves the active locale prefix. Most
  in-app `router.push()` calls instead use raw unprefixed paths (e.g. `router.push("/mv/room")` in
  `HomeView.tsx`, `CreationDialog.tsx`, `MvResult.tsx`, …) — these still land on the right locale
  because `setLocale()` writes a `NEXT_LOCALE` cookie that `middleware.ts` reads on the next
  request, but it costs a redirect round-trip instead of an in-place navigation. Going forward,
  prefer `localePath(locale, path)` for new `router.push()` calls; don't propagate the raw-path
  pattern.
- **Migrated links are not optional about this (R-9).** Every link in a migrated component goes
  through `next/link` + `localePath()`. DP navigates with `<a href="/home">` and reads
  `window.location.pathname`; copy that across and each navigation becomes a full page load
  **and** loses the locale prefix. The cookie redirect still lands you on the right page, so
  **it looks perfect in English and is broken in the other 8 locales** — nobody testing in
  English will ever see it. `guard-greps.sh` now fails on a literal `<a href="/`, but 20 of DP's
  links are `href={variable}` and no grep sees those: the rule is yours to hold, the grep only
  catches the easy half.
- **i18n scope during the migration (R-8).** Keep the existing boundary exactly: the migrated
  `Sidebar` / `MobileTabBar` / `MobileHeader` / Account screens **stay on `useT()`**, everything
  else stays hardcoded English. `useT()` has only two real consumers today and migrating the
  Sidebar is what would silently take it to one. Do not widen the scope either — wiring new
  areas into `useT()` is a separate decision, not a side effect of a UI port.

## Tests

- Unit tests are colocated `src/**/<name>.test.ts(x)`. Always
  `import { describe, it, expect } from "vitest"` — vitest globals are on, but tsc doesn't see them.
- New routes are axe-gated automatically (`e2e/a11y.spec.ts` scans `src/app/**/page.tsx`;
  dynamic `[param]` segments are skipped). Demo failure path: a description containing `[fail]`
  makes the mock job fail at 60% (error + Retry UI).
- `e2e/mv-flow.spec.ts` and `e2e/song-flow.spec.ts` sign in by seeding
  `localStorage["muse_auth"] = "1"` via `page.addInitScript()` before `page.goto()`, so `AuthGuard`
  sees a logged-in user instead of opening the sign-in modal. Do the same in any new spec that
  exercises an authed route.
- a11y-coverage caveat: `a11y.spec.ts` does NOT seed auth, so the four guarded routes (`mv/room`,
  `song/create`, `history`, `profile`) render only the sign-in modal to axe, not the real screen —
  the gate is real but narrower than it looks. It also only scans unprefixed English URLs
  (`discoverRoutes()` strips the `[locale]` segment); the 8 non-English locale trees aren't
  axe-scanned at all.
- **The visual baseline is captured `fullPage: true`, i.e. at scroll offset 0.** Nothing is ever
  behind a sticky navbar in those screenshots, so anything that only appears once the page scrolls
  — backdrop blur, scroll shadows, sticky stacking — cannot show up as a baseline diff. 115/115
  green is not evidence about those. Scroll and capture yourself instead.
- **`maxDiffPixelRatio: 0.002` is a fraction of PAGE AREA, so the visual gate is far less
  sensitive on wide viewports.** A fixed-size element is a bigger share of a 320px page than of
  a 1440px one: measured 2026-08-05, restoring a 64×22 pill to `/profile` failed at 320 and 375
  and **passed at 768/1024/1440/1920** — the same change, tolerated four times out of six. So a
  control can appear or vanish on the desktop baselines without the gate saying a word. When a
  screen really changed, re-record with `--update-snapshots=all` scoped by `--grep`; a plain
  `--update-snapshots` only rewrites the widths that happened to fail and leaves the rest
  committed as a screen that no longer exists.
- **Mutation-test a new guard test in both directions before believing it.** Break the thing it
  guards and watch it go red, then restore and watch it go green. `e2e/backdrop-filter.spec.ts`'s
  first CSS sweep read the CSSOM and passed in BOTH states, because Chrome discards
  `-webkit-backdrop-filter` while parsing — reading the test would never have shown that.
- E2e selectors are exact UI copy: changing a button label or placeholder requires updating
  `e2e/*.spec.ts`. For localized components (nav, Profile) the copy lives in
  `src/lib/i18n/dictionaries/en.ts`, not the component — editing a dictionary value can break
  e2e/Storybook just like editing the component would. E2e only ever exercises the English
  (unprefixed) tree, so a non-English-only regression won't be caught here.
- Stories only for components with no `next/*` imports (runner is @storybook/react-vite). tsconfig
  excludes `*.stories.tsx`, so verify story changes with `npm run build-storybook`, not typecheck.

## Judgment

- **Done** means the four Definition-of-done commands exit 0 — and for visual work, the changed
  screen checked at 390px and 1440px. Good: "typecheck/lint/test:run/build all green, screenshots
  at both widths." Bad: "it renders in dev, so it's done."
- **Ask, don't guess.** Good: "The spec says trim is 30s max but the code allows 60s — which wins?"
  Bad: silently picking one, or adding a library to route around the ambiguity.
- **Same error twice → change approach, don't retry harder.** Reaching for `as any`, a non-null `!`,
  deleting a failing test, or a second timeout bump means your model of the problem is wrong — go
  re-read `types.ts` / `MvFlowProvider.tsx` instead. Good: "tsc keeps rejecting this state shape;
  the type says the flow can be null here — add the guard." Bad: a third `setTimeout` increase.

When a session gets corrected by the user, update the one rule here that would have prevented it
(and append a line to CLAUDE.md's error log).
