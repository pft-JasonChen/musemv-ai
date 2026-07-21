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
  The a11y spec auto-discovers routes from `src/app/`; known accent-pill contrast issues are
  excluded via selectors in `e2e/a11y.spec.ts` until the design decision lands (`TODO.md` #2).
- `npm run storybook` / `npm run build-storybook`

**Definition of done:** `npm run typecheck && npm run lint && npm run test:run && npm run build`
all exit 0. Hooks (`.claude/settings.json`) already format/lint on every edit, block any .ts/.tsx
edit that breaks `tsc --noEmit`, and block Stop until tsc + vitest pass — so sequence multi-file
refactors so the project typechecks after each individual edit (add the new before removing the old).

## Boundaries

- This folder has no `.git` — the repo root is one level up (`ycmuse-web/`). The root
  `.claude/rules/stage-*.md` pipeline (BEM classes, `prototypes/`, port 8000) belongs to a
  DIFFERENT sub-project; ignore it here. Inside `web-app/`, this file is the contract.
- NEVER: add a backend, DB, or `fetch()` call (`grep -rn 'fetch(' src` must stay empty); edit
  token values in `src/styles/tokens.css` (synced from the mobile Figma); reference
  `../ycmuse-app-prototype/` from code or config.
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
- Breakpoints: only `sm:` (640px — where the shell switches bottom-bar → sidebar) and `lg:` (1024px).
  No `md:`/`xl:` anywhere. 390/768/1024/1440 are review viewports, not code breakpoints.
- Raw `#fff`/`#000`, `rgba()` scrims, and gradient stops are existing tolerated practice — match
  the surrounding file; don't mass-convert. A NEW semantic color = add a token to `tokens.css`
  `:root` and consume it via `var()`.
- Hover/press transitions and the focus-visible ring are applied globally in `globals.css` — don't
  re-add them per component.

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
