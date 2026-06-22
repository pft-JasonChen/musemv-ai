# YouCam Muse — Web Prototype

Desktop-native web port of the YouCam Muse mobile app. Backend-less and CEO-demoable, built
clean enough to hand to engineers (typed components, mock handlers behind a typed contract).

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
| `e2e` | Playwright flow + axe a11y tests |
| `storybook` / `build-storybook` | Component catalog |

## Implemented (Phases 1–3)
- **App shell**: sidebar (desktop) / bottom bar (mobile), top bar with credits.
- **AI MV flow (end to end)**: `/mv/room` (two-pane compose + live preview) → mode chooser →
  `/mv/thinking` · `/mv/creating` (mock progress) → `/mv/storyboard` (timeline editor) →
  `/mv/result` (player + actions) ; "View Later" → History. Mock engine: `MvFlowProvider`.

## Quality + review tooling
- **Hooks** (`.claude/settings.json`): prettier → eslint → tsc → vitest on edit; block `.env`;
  full tsc + vitest before "done".
- **Subagents** (`.claude/agents/`): component-architect, design-reviewer, a11y-checker, code-reviewer.
- **`/design-review`** command (`.claude/commands/`).
- **Vitest** tests (`src/**/*.test.tsx`); **Storybook** stories (`src/**/*.stories.tsx`).
- **Playwright** e2e + axe a11y (`e2e/`), config in `playwright.config.ts`.
- **`.mcp.json`**: Playwright, Chrome DevTools, shadcn MCP servers.

## Verified
`tsc`, `vitest` (6/6), `eslint` (0), `next build` (9 routes), `build-storybook`, and
`playwright test` (flow + a11y, 3/3, **0 axe WCAG A/AA violations**) all green.

## Structure & rules
See `AGENTS.md`. Specs: `specs/`. Design tokens (single source of truth): `src/styles/tokens.css`.

## Status
Phases 1 (foundation + full MV flow), 2 (quality guardrails), 3 (visual review loop) complete.
Next: Phase 4 handoff — Spec Kit (EARS) + typed API-contract stubs (Zod + mock handlers).
