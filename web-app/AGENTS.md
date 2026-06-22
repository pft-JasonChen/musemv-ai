# AGENTS.md - YouCam Muse Web Prototype

Front-end prototype that ports the YouCam Muse mobile app to a desktop-native web app.
Goal: a CEO-demoable, backend-less prototype that is also clean enough to hand to engineers.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 (tokens mapped via `@theme` in `src/app/globals.css`)
- No backend: async work is mocked via a typed `MvApi` contract (`src/lib/mv/`)

## Project map
- `src/app/` - routes (Server Components by default; add `"use client"` only when needed)
- `src/components/shell/` - AppShell, Sidebar (rail -> bottom bar), TopBar
- `src/components/ui/` - reusable primitives (Button, Modal, CreditPill, SectionLabel)
- `src/components/mv/` - MV creation flow (MvRoom, LivePreview, modals)
- `src/lib/mv/` - types.ts (typed API contract + state model), mock.ts (sample data)
- `src/styles/tokens.css` - design tokens (SINGLE SOURCE OF TRUTH; synced from mobile Figma)
- `public/assets/` - icons, images, songs, videos (from the mobile prototype)
- `specs/` - behavior specs (EARS acceptance criteria) - the handoff contract

## Conventions
- Every colour/size derives from a token in `tokens.css`. No raw hex/px in components.
- Components are typed; no `any`. Default to Server Components; mark interactivity with `"use client"`.
- Responsive targets: 390 (mobile) / 768 / 1024 / 1440. Mobile = parity with the app; >=768 = desktop-native.
- Accessibility: semantic roles, `aria-*`, keyboard-operable modals (Esc to close), WCAG AA contrast.

## Boundaries
- ALWAYS DO: keep front-end only; model backend work as the typed `MvApi` + mock handlers.
- ASK FIRST: changing the design system / tokens; adding dependencies; destructive git ops.
- NEVER: implement a real backend/DB; invent hex colours; commit secrets or `.env`.

## Commands
- `npm install` then `npm run dev` (http://localhost:3000)
- `npm run build` - production build (must pass before "done")
- `npx tsc --noEmit` - type check
