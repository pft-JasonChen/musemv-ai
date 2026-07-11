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
  Known-failing: the `/` axe gate (pre-existing accent-contrast issue — see `TODO.md` #2).
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
- **State** (`src/components/providers/`): `AppProviders` (mounted once, in the root layout — never
  a second time) stacks Credits → History → MvFlow → SongFlow. Providers poll jobs via `pollJob`;
  they own no fake timers. Hooks: `useCredits`, `useHistory`, `useMvFlow`, `useSongFlow`.
- New mock capability: schema in `schemas.ts` → endpoint on `MuseApi` + `MockMuseApi` → fixtures in
  `src/lib/mv/mock.ts` (community seed: `community.ts`) → a `start<Name>` callback in the matching
  provider → consume via its domain hook.
- Mid-flow routes guard themselves: if their flow state is missing, `router.replace()` to
  the flow entry (pattern: `src/components/mv/MvResult.tsx`). Flow state is in-memory; a reload loses it.

## Tests

- Unit tests are colocated `src/**/<name>.test.ts(x)`. Always
  `import { describe, it, expect } from "vitest"` — vitest globals are on, but tsc doesn't see them.
- New route → append it to the route array in `e2e/a11y.spec.ts`; the axe gate only covers listed routes.
- E2e selectors are exact UI copy: changing a button label or placeholder requires updating `e2e/*.spec.ts`.
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
