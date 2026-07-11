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
- **App shell**: sidebar (desktop) / bottom bar (mobile), top bar with credits.
- **AI MV flow (end to end)**: `/mv/room` (two-pane compose + live preview) → mode chooser →
  `/mv/thinking` · `/mv/creating` (mock progress) → `/mv/storyboard` (timeline editor) →
  `/mv/result` (player + actions) → `/mv/edit`; "View Later" → History.
- **AI Song flow**: `/song/create` → `/song/creating` → `/song/result` (player, Use-in-MV).
- **Community screens** (seed data only — feature not yet defined, see `TODO.md` #1):
  home feed sections, `/explore/mvs`, `/explore/songs`, `/watch`, `/song/play`, `/creator`,
  `/share/mv/[id]`.
- **History, profile, credits/IAP modal, proof page** — 19 routes total.

## Architecture (details: `docs/DEVELOPER-HANDOVER.md`)
- `src/lib/api/` — the backend boundary: `contract.ts` (`MuseApi`), `schemas.ts` (Zod = types),
  `mock.ts` (the only fake-backend code), `index.ts` (single swap point exporting `api`).
- `src/components/providers/` — client state: `AppProviders` stacks Credits / History / MvFlow /
  SongFlow; flow providers create jobs via `api` and poll them (`pollJob`) — no timers in UI state.
- `src/components/<area>/` — `"use client"` views; `src/app/**/page.tsx` stays thin.
- Design tokens (single source of truth): `src/styles/tokens.css`.

## Quality + review tooling
- **Hooks** (`.claude/settings.json`): prettier → eslint → tsc → vitest on edit; block `.env`;
  full tsc + vitest before "done".
- **Subagents** (`.claude/agents/`): component-architect, design-reviewer, a11y-checker, code-reviewer.
- **`/design-review`** command (`.claude/commands/`).
- **Vitest** tests (`src/**/*.test.ts(x)`, incl. mock-API job engine); **Storybook** stories.
- **Playwright** e2e + axe a11y (`e2e/`), config in `playwright.config.ts`.
- **`.mcp.json`**: Playwright, Chrome DevTools, shadcn MCP servers.

## Verified (2026-07-11)
`tsc`, `vitest` (11/11), `eslint` (0), `next build` (19 routes) all green.
`playwright test`: MV flow, song flow, and `/mv/room` axe gate pass; the `/` axe gate has a
**known pre-existing color-contrast failure** awaiting a design decision — see `TODO.md` #2.

## Structure & rules
See `AGENTS.md` (agent contract) and `docs/DEVELOPER-HANDOVER.md` (engineer handover).
Specs: `specs/`. Deferred work: `TODO.md`.
