# Developer Handover — YouCam Muse Web Prototype → Production Frontend

**Audience:** the engineering team taking `web-app/` to production.
**Assumed path (product-owner decision, 2026-07-11):** evolve THIS codebase into the
production frontend — do not rebuild. The prototype is deliberately structured so the
demo-mock parts are isolated and swappable.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Zod ·
Vitest · Playwright (+axe) · Storybook. Package manager: npm.

---

## 1. The one-paragraph mental model

The app is a fully working product UI wired to a **fake backend**. Everything the UI knows
about "the server" goes through one typed interface — `MuseApi` in `src/lib/api/contract.ts`
— whose entities are defined once as Zod schemas (`src/lib/api/schemas.ts`; the TypeScript
types are inferred from them). The only implementation today is `MockMuseApi`
(`src/lib/api/mock.ts`), which simulates async generation as time-based jobs. The UI's
stateful glue is four small React context providers (`src/components/providers/`) that
create jobs via the contract and poll them. **To go live you implement `MuseApi` against
the real backend and change one line in `src/lib/api/index.ts`.**

## 2. Layer map

```
src/
├── app/                    # Routes (App Router). Thin: each page returns a view component.
├── components/
│   ├── providers/          # Client state (the only stateful glue)
│   │   ├── AppProviders    #   mounted once in app/layout.tsx
│   │   ├── CreditsProvider #   useCredits()  — balance + addCredits
│   │   ├── HistoryProvider #   useHistory()  — session "My Creations" list
│   │   ├── MvFlowProvider  #   useMvFlow()   — MV compose/storyboard/render state
│   │   ├── SongFlowProvider#   useSongFlow() — song compose/result state
│   │   └── progress.ts     #   Gen (idle/processing/done) derived from job snapshots
│   ├── ui/                 # Primitives (Button, Modal, …) — no app state
│   └── <area>/             # Feature views: mv/ song/ community/ history/ home/ shell/ …
├── lib/
│   ├── api/                # ★ THE BACKEND BOUNDARY
│   │   ├── contract.ts     #   MuseApi interface (job-based create/poll)
│   │   ├── schemas.ts      #   Zod schemas = entity types (z.infer)
│   │   ├── mock.ts         #   MockMuseApi — the ONLY fake-backend code
│   │   ├── poll.ts         #   pollJob() helper (framework-free)
│   │   └── index.ts        #   exports `api` — the single swap point
│   ├── mv/
│   │   ├── types.ts        #   domain constants/rules; re-exports entity types
│   │   ├── mock.ts         #   static fixtures (sample songs, templates, history seeds)
│   │   └── community.ts    #   community seed data (feature undefined — TODO.md #1)
│   ├── user.ts             #   mock user + credit packs
│   └── download.ts         #   client download helper
└── styles/tokens.css       # design tokens (synced from mobile Figma) — DO NOT edit values
```

Dependency direction (enforce in review): `app → components → lib/api contract`.
Views never import `MockMuseApi` directly; providers and views import only `api` from
`@/lib/api`. Fixtures (`lib/mv/mock.ts`) are static demo content, imported freely by views.

## 3. How generation flows work (and how the backend replaces them)

All async generation is modelled as **jobs**:

1. A provider calls `api.createMvJob({ mode, compose })` / `api.createSongJob(compose)` /
   `api.renderMvJob(id, storyboard)` and gets an initial job snapshot.
2. It registers a History entry and starts `pollJob()` (120 ms interval) on
   `api.getMvJob(id)` / `api.getSongJob(id)`.
3. Every tick updates `gen` (progress %, step label) — this drives the progress screens
   (`GenerationView`). When `status === "done"` the provider reads the attached payload
   (`job.storyboard`, `job.resultUrl`, `job.result`) and updates state + History.

The mock derives progress from wall-clock time (7 s storyboard / 11 s render / 8 s song —
the demo pacing), exactly like polling a real endpoint. A real implementation keeps this
shape over REST; if you use WebSocket/SSE pushes instead, bridge them behind the same
contract (resolve `get*Job` from the latest pushed snapshot) so no UI changes.

**Job statuses:** `queued | processing | done | failed` (+ `idle` in UI-side `Gen`).
The mock never emits `failed`; the UI's `pollJob` already routes `failed` to `onError`,
but **no failure UX exists yet** — see § Production gaps.

## 4. Going to production — checklist

Replace the mock (per endpoint, in any order — the contract isolates each):

- [ ] Implement `MuseApi` (`src/lib/api/contract.ts`) against the real backend.
      Validate responses with the Zod schemas at the boundary (`MvJobSchema.parse(...)`),
      exactly as `mock.ts` does — the schemas are the wire contract.
- [ ] Swap `src/lib/api/index.ts` to construct the real client (feature-flag both during
      migration if useful: `export const api = flag ? realApi : mockApi`).
- [ ] Replace fixture-backed content: sample songs / templates / ideas (`lib/mv/mock.ts`),
      community feeds (`lib/mv/community.ts` — blocked on the community spec, TODO.md #1),
      history seeds (`HISTORY_SAMPLES`), user + credits (`lib/user.ts`).
- [ ] Persist state that is currently session-only: History (in-memory), storyboard
      (localStorage `"mv-storyboard"`), credits (in-memory) → backend endpoints, then thin
      out the corresponding providers to fetch instead of seed.
- [ ] Auth: none exists. `MOCK_USER` in `lib/user.ts`; the account menu is decorative.
- [ ] Delete `src/lib/api/mock.ts` + the `mockStoryboard`/`mockSongResult` generators once
      nothing imports them. `grep -rn 'fetch(' src` currently returns nothing — after your
      real client lands, that grep becomes "only inside the API implementation".

Also budget for these **production gaps** (fine for a demo, not for launch):

- **No failure/error UX** — jobs can't fail in the mock; design retry/error states
  (the mobile prototype has a failed-state spec in History).
- **Reload loses mid-flow state** — flow state is in-memory by design; mid-flow routes
  self-guard by redirecting to the flow entry (`MvResult.tsx` pattern). Decide what should
  survive reload once jobs are server-side (job id in the URL is the natural fix).
- **Credits are cosmetic** — costs exist as constants (`COST_STORYBOARD/RENDER/SONG` in
  `lib/mv/types.ts`) but nothing decrements the balance.
- **Community is undefined** — screens exist, product definition doesn't. TODO.md #1.
- **`/` axe gate fails** (accent-contrast, pre-existing) — TODO.md #2.
- **npm audit**: 7 dev-tooling findings (Storybook/Vitest chain) — TODO.md #3.

## 5. Conventions you must keep (they're load-bearing)

Read `AGENTS.md` — it is the working contract for this repo and stays accurate by policy.
Highlights engineers most often trip on:

- **Styling:** colors via inline `style={{ background: "var(--card)" }}` from
  `tokens.css`; sizes as Tailwind arbitrary px (`text-[14px]`); radii via the remapped
  `rounded-*` names; breakpoints are only `sm:` (640, bottom-bar→sidebar) and `lg:` (1024).
  Never edit token values — they're synced from the mobile Figma. New semantic color =
  new token in `tokens.css` consumed via `var()`.
- **State:** contexts stay small and domain-shaped. New async capability = schema →
  contract endpoint → mock impl → provider callback → domain hook (recipe in AGENTS.md).
- **Pages stay thin**; interactive code lives in `src/components/<area>/`.
- **E2e selectors are exact UI copy** — changing a label means updating `e2e/*.spec.ts`
  (two selectors had drifted; repaired 2026-07-11).

## 6. Quality gates

Definition of done: `npm run typecheck && npm run lint && npm run test:run && npm run build`
all exit 0.

- **Unit (Vitest):** colocated `src/**/*.test.ts(x)`. `src/lib/api/mock.test.ts` covers the
  job engine with fake timers — port these to contract tests against your real API client.
- **E2e (Playwright):** `npm run build && npm run e2e`. Serves the LAST production build on
  :3100. In sandboxed/CI environments with a system chromium:
  `CHROMIUM_PATH=/path/to/chromium npm run e2e`. New route → add it to the route array in
  `e2e/a11y.spec.ts` (the axe gate only covers listed routes).
- **Storybook:** stories only for components without `next/*` imports; verify with
  `npm run build-storybook` (tsconfig excludes stories).

## 7. Key references

| What | Where |
|---|---|
| Working agreement / conventions | `AGENTS.md` |
| Deferred decisions | `TODO.md` |
| MV flow spec (EARS acceptance criteria) | `specs/mv-creation-flow.spec.md` |
| Backend contract | `src/lib/api/contract.ts` + `schemas.ts` |
| Design tokens | `src/styles/tokens.css` |
| Source-of-truth mobile prototype | `../ycmuse-app-prototype/` (reference only — never import) |
