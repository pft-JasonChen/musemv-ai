# YouCam Muse — Web Prototype

Desktop-native web port of the YouCam Muse mobile app. Backend-less and CEO-demoable, built
clean enough to hand to engineers: all generation flows run against a **typed API contract**
(`MuseApi`, Zod-validated) with a mock implementation behind a single swap point.

## Run
```bash
npm install                      # after pulling: installs all deps
npx playwright install chromium  # one-time, for e2e
npm run dev                      # http://localhost:3000
```

## Scripts
| Command | What |
|---|---|
| `dev` / `build` / `start` | Next.js dev / build / serve |
| `typecheck` | `tsc --noEmit` (strict) |
| `lint` / `format` | ESLint (+ jsx-a11y) / Prettier |
| `test` / `test:run` | Vitest unit + component |
| `e2e` | Playwright flow + axe a11y tests (build first; `CHROMIUM_PATH=…` to use a system chromium) |
| `storybook` / `build-storybook` | Component catalog |

## Implemented
- **App shell**: sidebar (desktop) / bottom bar + mobile header (phones), credits pill.
- **AI MV flow (end to end)**: `/mv/room` (two-pane compose + six overlays) → mode chooser →
  `/mv/thinking` · `/mv/creating` (mock progress) → `/mv/storyboard` (scene editor) →
  `/mv/result` (player + actions) → `/mv/edit`; "View Later" → History.
- **AI Song flow**: `/song/create` (Simple/Custom) → `/song/creating` → `/song/result`
  (player + playlist, Use-in-MV).
- **Community screens** (seed data only — feature not yet defined, see `TODO.md` #1):
  home feed sections, `/explore/mvs`, `/explore/songs`, `/watch`, `/song/play`, `/creator`,
  `/share/mv/[id]`.
- **History, profile, settings, credits/IAP dialogs, proof page** — 20 `page.tsx` routes,
  each served at nine locales.

## The designer-UI migration is DONE (2026-08-06)

Every screen you see is the designer prototype's UI, ported — **17 of 17 routes**, counting the
landing page. `OWN_CHROME` in `src/components/shell/AppShell.tsx` used to be the ledger; it was
**deleted on 2026-08-27** along with the legacy `TopBar` it gated, because with every route
migrated the list covered all of them and the fallback header was unreachable. The invariant now:
below `/`, the shell draws no header — every route renders its own. Two consequences you
will hit immediately if you don't know them:

- **`src/styles/designer/` (33 files) is copied byte-for-byte from the designer drop.**
  `npm run designer:check` fails if you edit one. A defect in there is fixed UPSTREAM and
  re-dropped; the temporary local patch goes in `src/styles/designer-overrides.css`, which has
  its own rules-for-adding at the top of the file. Editing a vendored file means the next
  re-sync silently reverts you and takes the reasoning with it.
- **Two screens are deliberately still the pre-migration UI**, and they are not oversights:
  `/mv/creating` (the designer has no MV-render progress screen at all) and `/share`
  (no share landing page in the drop). Both are recorded in `docs/DESIGNER-TODO.md` §B.

Where the migration's decisions live: `docs/archive/redesign-migration-plan.md` (plan of record),
`docs/DESIGNER-TODO.md` (what the designer still owes), `docs/CHANGELOG-RD.md` (contract
surface — the migration changed none of it, and the entry shows you how to verify that).

## Architecture (details: `docs/DEVELOPER-HANDOVER.md`)
- `src/lib/api/` — the backend boundary: `contract.ts` (`MuseApi`), `schemas.ts` (Zod = types),
  `mock.ts` (the only fake-backend code), `index.ts` (single swap point exporting `api`).
- `src/components/providers/` — client state: `AppProviders` stacks Credits / History / MvFlow /
  SongFlow; flow providers create jobs via `api` and poll them (`pollJob`) — no timers in UI state.
- `src/components/<area>/` — `"use client"` views; `src/app/**/page.tsx` stays thin.
- Design tokens: `src/styles/tokens.css` — **synced wholesale from the designer prototype**, never
  edited value-by-value. WA-only semantic names live in `src/styles/token-aliases.css`, a shrinking
  compatibility layer for the parts of the app that predate the migration.

## Quality + review tooling
- **Hooks** (`.claude/settings.json`): prettier → eslint → tsc → vitest on edit; block `.env`;
  full tsc + vitest before "done".
- **Subagents** (`.claude/agents/`): component-architect, design-reviewer, a11y-checker,
  code-reviewer. **They are discovered from the session's own project root**, so a session
  started at the repo root cannot see them — start it in `web-app/`.
- **`/design-review`** command (`.claude/commands/`).
- **Vitest** tests (`src/**/*.test.ts(x)`, incl. mock-API job engine); **Storybook** stories.
- **Playwright** e2e + axe a11y (`e2e/`), config in `playwright.config.ts`.
- **`.mcp.json`**: Playwright, Chrome DevTools, shadcn MCP servers.

## Verified (2026-08-06)
`tsc`, `eslint` (0 errors), `vitest` **84/84**, `next build`, plus the migration's own gates:
`guard-greps.sh`, `designer:check` (33 files byte-identical), `check-rd-changelog.sh`.
`npm run e2e` **150/150** — MV flow, song flow (both sign in via a seeded
`localStorage["muse_auth"]`), axe on every auto-discovered route, and a behaviour-regression
suite that guards the product rules the UI port could have silently dropped.
`npm run e2e:visual` **115/115** across six widths.

**Know what those gates do NOT see** before you trust them — all four are measured, not
theoretical, and each one let a real defect through at least once:

| Blind spot | Consequence |
|---|---|
| `visual-baseline.spec.ts` captures `fullPage` at scroll 0 | Anything that only appears once the page scrolls (backdrop blur, sticky stacking) cannot show up as a diff |
| `maxDiffPixelRatio: 0.002` is a share of PAGE AREA | The same lost control fails at 320/375 and passes at 768–1920 |
| `a11y.spec.ts` seeds no auth and sets no viewport | Guarded routes render only the sign-in modal to axe, and the entire mobile chrome has never been scanned (`TODO.md` #6) |
| e2e only walks the unprefixed English tree | A regression in the other eight locales won't go red |

The `-darwin` visual baselines are **unmaintained on purpose** — the `-linux` set is the
maintained one. On a Mac, expect `e2e:visual` to fail until you re-record locally; do not
re-record the Linux set to make your machine green.

Demo tips: every sample song has real audio (two mp3s mapped across the list); song rows
play/pause in place and trims can be re-edited + previewed. A description containing `[fail]`
demos the generation-failure + Retry state.

## Structure & rules
Read in this order:

| Document | What it is |
|---|---|
| `docs/DEVELOPER-HANDOVER.md` | **Start here as an engineer.** Full architecture map and the backend swap point. |
| `docs/CHANGELOG-RD.md` | The contract surface C1–C8 and every change to it. |
| `specs/` | Product behaviour per area, with `AC-*` acceptance criteria. `specs/OPEN-QUESTIONS.md` is the cross-area register of what is still undecided. |
| `AGENTS.md` | The working contract — conventions, gates, and the traps that have actually bitten. |
| `docs/archive/redesign-migration-plan.md` | Why the UI looks the way it does. |
| `docs/DESIGNER-TODO.md` | What the designer still owes (A1–A16). |
| `TODO.md` | Deferred product/engineering work. |
| `docs/archive/` | Superseded — never cite as current. |
