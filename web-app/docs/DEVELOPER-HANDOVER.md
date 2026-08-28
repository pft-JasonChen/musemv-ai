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
stateful glue is five small React context providers (`src/components/providers/`) that
create jobs via the contract and poll them. **To go live you implement `MuseApi` against
the real backend and change one line in `src/lib/api/index.ts`.**

## 2. Layer map

```
src/
├── middleware.ts           # i18n locale routing (cookie/Accept-Language → URL prefix)
├── app/                    # Routes (App Router). Thin: each page returns a view component.
├── components/
│   ├── providers/          # Client state (the only stateful glue)
│   │   ├── AppProviders    #   mounted once in app/[locale]/layout.tsx
│   │   ├── AuthProvider    #   useAuth()     — mock login, profile, subscription state
│   │   ├── CreditsProvider #   useCredits()  — balance + addCredits
│   │   ├── HistoryProvider #   useHistory()  — session "My Creations" list
│   │   ├── MvFlowProvider  #   useMvFlow()   — MV compose/storyboard/render state
│   │   ├── SongFlowProvider#   useSongFlow() — song compose/result state
│   │   └── progress.ts     #   Gen (idle/processing/done) derived from job snapshots
│   ├── ui/                 # Primitives (Button, Modal, …) — no app state
│   └── <area>/             # Feature views: mv/ song/ community/ history/ home/ shell/ auth/ account/ profile/ credits/ …
├── lib/
│   ├── api/                # ★ THE BACKEND BOUNDARY
│   │   ├── contract.ts     #   MuseApi interface (job-based create/poll)
│   │   ├── schemas.ts      #   Zod schemas = entity types (z.infer)
│   │   ├── mock.ts         #   MockMuseApi — the ONLY fake-backend code
│   │   ├── poll.ts         #   pollJob() helper (framework-free)
│   │   └── index.ts        #   exports `api` — the single swap point
│   ├── i18n/               #   locale config (9 locales) + dictionaries (`config.ts`, `dictionaries/`)
│   ├── mv/
│   │   ├── types.ts        #   domain constants/rules; re-exports entity types
│   │   ├── mock.ts         #   static fixtures (sample songs, templates, history seeds)
│   │   └── community.ts    #   community seed data (feature undefined — TODO.md #1)
│   ├── authStore.ts        #   mock auth boolean, persisted to localStorage["muse_auth"]
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
A description containing `[fail]` (`FAIL_TRIGGER` in `mock.ts`) makes the job fail at ~60%
progress; `pollJob` routes `failed` to `onError` and `GenerationView` shows an error + Retry
state — see § 4.

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
- [ ] Auth: mock only (`AuthProvider` + `authStore.ts`). The logged-in boolean persists to
      `localStorage["muse_auth"]`; subscription status, plan, and profile (name/avatar) stay
      in-memory React state and are lost on reload. `MOCK_USER` in `lib/user.ts` backs the
      default profile — wire real auth + persistence here.
- [ ] Delete `src/lib/api/mock.ts` + the `mockStoryboard`/`mockSongResult` generators once
      nothing imports them. `grep -rn 'fetch(' src` currently returns nothing — after your
      real client lands, that grep becomes "only inside the API implementation".
- [ ] **Flip the guard when you add the first `fetch`.** `.claude/hooks/guard-greps.sh`
      (Gate G1-b) enforces zero `fetch(` anywhere in `src`, so your first real client would
      be blocked by the Stop hook. Export **`YCM_REAL_API=1`** and the rule becomes
      "`fetch` inside `src/lib/api/` only, still banned everywhere else" — which is exactly
      the invariant you want to keep from then on. Pre-wired 2026-08-03 and tested in both
      directions; the default stays strict so prototype work is unaffected.

Also budget for these **production gaps** (fine for a demo, not for launch):

- **Failure UX is demo-grade** — a description containing `[fail]` makes the mock job
  fail at 60% and `GenerationView` shows an error + Retry state; History marks the entry
  Failed. Real backends need real error taxonomies (quota, moderation-block, timeout)
  mapped onto this path.
- **Reload loses mid-flow state** — flow state is in-memory by design; mid-flow routes
  self-guard by redirecting to the flow entry (`MvResult.tsx` pattern). Decide what should
  survive reload once jobs are server-side (job id in the URL is the natural fix).
- **Credits ARE charged, and the ledger is not** — generation deducts and refunds on
  failure (§6 has the full table and the guard locations). What is still demo-grade is
  `CREDIT_TRANSACTIONS`: a static 7-entry seed that never reflects real usage, and the fact
  that the balance itself is in-memory and resets on reload. Wire both to the backend.
  _(Corrected 2026-08-03. This bullet used to read "Credits are cosmetic … nothing
  decrements the balance", contradicting §6 in the same document — §6 was fixed on 08-02
  and this one was missed. If you read only §4, you would have built against a false
  premise.)_
- **Community is undefined** — screens exist, product definition doesn't. TODO.md #1.
- **`/` axe gate fails** (accent-contrast, pre-existing) — TODO.md #2.
- **npm audit**: 7 dev-tooling findings (Storybook/Vitest chain) — TODO.md #3.

## 5. Internationalization (i18n)

**Locale model** (`src/lib/i18n/config.ts`): 9 product-code locales — `enu jpn kor cht chs deu
fra esp ptg` (`LOCALES`), NOT BCP-47 tags. `DEFAULT_LOCALE` is `enu` (English). A separate
`HTML_LANG` map holds the actual BCP-47 tag per locale (`enu → en`, `cht → zh-Hant`, …) for the
`<html lang>` attribute — the two naming schemes are deliberately kept apart.

**URL shape:** English is served UNPREFIXED (`/profile`); every other locale is prefixed
(`/jpn/profile`). `localePath(locale, path)` builds a path for a given locale; `stripLocalePrefix()`
does the inverse. Every route lives under `src/app/[locale]/…`, and
`generateStaticParams()` in `src/app/[locale]/layout.tsx` prerenders one static tree per locale
(`LOCALES.map(...)`).

**Middleware routing** (`src/middleware.ts`, matcher excludes `_next`, `/api`, and any path with a
dot): for each request it inspects the first path segment —

- Segment is a non-default locale (`/jpn/...`) → served as-is, no rewrite.
- Segment is the default locale (`/enu/...`) → canonicalized: redirect to the same path with the
  `/enu` prefix stripped (default locale must never appear in the URL bar).
- No locale segment → resolve the target locale from `NEXT_LOCALE` cookie first, else
  `matchLocale(Accept-Language)` (quality-ordered tag match, e.g. `zh-Hant`/`zh-TW`/`zh-HK`/`zh-MO`
  → `cht`, other `zh*` → `chs`), else English. English resolves via an internal `rewrite()` (URL
  stays clean); any other resolved locale is a `redirect()` to its prefixed URL.

**Dictionaries** (`src/lib/i18n/dictionaries/`): `en.ts` is the source of truth and the fallback —
today it holds ~40 keys covering nav and the Profile screen only. The 8 other files (`jpn.ts`,
`kor.ts`, `cht.ts`, `chs.ts`, `deu.ts`, `fra.ts`, `esp.ts`, `ptg.ts`) are each `export const <code>:
Partial<Dictionary> = {}` — intentionally empty stubs, not missing work. `LocaleProvider`'s `t(key)`
looks up `DICTIONARIES[locale]?.[key]` and falls back to the English value whenever the key is
missing or an empty string, so the app always renders even with zero translations. Filling these in
is explicitly deferred to an RD; don't "complete" them as a drive-by fix.

**`LocaleProvider`** (`src/components/providers/LocaleProvider.tsx`, mounted in
`src/app/[locale]/layout.tsx` around `AppProviders`): exposes `useLocale()` (`{ locale, t,
setLocale }`) and the convenience `useT()` (`() => t`). Syncs `document.documentElement.lang` from
`HTML_LANG`. `setLocale(next)` writes a 1-year `NEXT_LOCALE` cookie (so middleware honours the
choice on subsequent unprefixed requests) and `router.push(localePath(next, stripLocalePrefix(pathname)))`
to move the current page under the new locale prefix.

**Adoption is partial, by design:** only `Sidebar.tsx` and `ProfileView.tsx` currently call
`useT()`. Everything else (Home, MV, Song, Community, History, Auth, Credits modals, …) is
hardcoded English JSX. Similarly, only 5 files build paths with `localePath()`
(`AuthGuard.tsx`, `LocaleProvider.tsx`, `Sidebar.tsx`, `ProfileView.tsx`, `MobileHeader.tsx`); most
in-app `router.push()` calls use raw unprefixed paths (e.g. `MvResult.tsx`).
**Every MIGRATED screen is on `localePath()` — R-9 requires it** — so the raw-path set is now the
unmigrated remainder, not a cross-section of the app. (`HomeView.tsx` used to be the headline
example of the raw pattern; the landing-page migration moved it and all seven of its sections
onto `localePath()` on 2026-08-07.) Raw pushes still resolve to the correct locale because the `NEXT_LOCALE` cookie
set by `setLocale()` is picked up by `middleware.ts` on the next request — but as a redirect, not
an in-place navigation. `localePath()` is the preferred pattern going forward.

**How to add a locale** — exact touch-points, reading `config.ts` and `dictionaries/index.ts`:

1. `src/lib/i18n/config.ts`: add the code to the `LOCALES` tuple; add an entry to `LOCALE_NAMES`
   (`{ native, english }`); add an entry to `HTML_LANG` (the BCP-47 tag); if the locale needs
   Accept-Language matching, add a case to `tagToLocale()`.
2. `src/lib/i18n/dictionaries/`: add `<code>.ts` exporting `export const <code>: Partial<Dictionary>
= {}` (or populated, if translations are ready).
3. `src/lib/i18n/dictionaries/index.ts`: import the new dictionary and add it to the `DICTIONARIES`
   record.
4. Nothing else needs touching — `generateStaticParams()` derives its list from `LOCALES`, and
   `middleware.ts`/`localePath()`/`matchLocale()` are all keyed off `LOCALES`/`isLocale()`.

## 6. Subscriptions & credits (mock)

**Account tiers** (`AuthProvider`, `src/components/providers/AuthProvider.tsx`): `status` is
derived, not stored — `guest` (logged out) → `free` (logged in, `loggedIn` true) → `subscriber`
(logged in AND `subscribed` true). `subscribe(plan: PlanId)` just sets `subscribed = true` and
`subscribedPlan = plan`; it does not itself grant credits — callers (`SubscribeModal`) call
`addCredits(plan.credits)` separately. `PlanId` and the three tiers live in `src/lib/user.ts`
(`SUBSCRIPTION_PLANS`) — the as-approved Business Model (2026-07-13) figures:

| `PlanId`     | Name       | Price  | Credits | Cadence | Badge        | Store SKU                           |
| ------------ | ---------- | ------ | ------- | ------- | ------------ | ----------------------------------- |
| `weekly`     | Weekly     | $19.99 | 200     | Weekly  | MOST POPULAR | `subscribe_1_week_no_trial_ycm`     |
| `weekly_pro` | Weekly Pro | $29.99 | 1000    | Weekly  | BEST VALUE   | `subscribe_1_week_pro_no_trial_ycm` |
| `yearly`     | Yearly     | $59.99 | 2000    | Yearly  | —            | `subscribe_12_month_no_trial_ycm`   |

`DEFAULT_PLAN_ID` is `weekly_pro`. Credits granted per cycle expire on the plan's cadence.
(Corrected 2026-08-02 — this table previously listed a non-existent `super` plan and the wrong
prices for `weekly`/`yearly`. `src/lib/api/contract.surface.test.ts` now freezes the real values.)

**Credit balance** (`CreditsProvider`, `src/components/providers/CreditsProvider.tsx`): a single
`useState(DEFAULT_CREDITS)` (`DEFAULT_CREDITS = 390` in `src/lib/user.ts`) plus `addCredits(n)`.
`CREDIT_TRANSACTIONS` in `lib/user.ts` is a static 7-entry seed ledger (purchases, spends, bonuses)
shown in `CreditsDetailModal` — it does not react to `addCredits()` calls or reflect real usage.

**Modals** (`src/components/credits/`): `SubscribeModal` (→ `subscribe()` +
`addCredits(plan.credits)`), `CreditsDetailModal` (balance + `CREDIT_TRANSACTIONS` ledger, "Buy
Credits" CTA), `BuyCreditsModal` (`CREDIT_PACKS` picker → `addCredits(pack.credits)`). All three are
"Demo only — no real payment" per their own copy.

**Migrated to the designer UI in slice 3f (2026-08-05).** Three things changed shape for anyone
reading this section against the code:

- `SubscribeModal` is **no longer a plan picker**. DP's `UpgradeDialog` is three self-contained
  cards, each with its own Subscribe button, so there is no shared selection state — the clicked
  card is the plan bought. `DEFAULT_PLAN_ID` no longer drives this screen (it is still exported).
- Every price and period comes from `SUBSCRIPTION_PLANS` / `CREDIT_PACKS`, never from the
  designer markup (S20). DP's own values are wrong in several places — see `DESIGNER-TODO` A15.
- All three now render through `src/components/ui/DpDialog.tsx`, a shared shell for DP's overlay
  pattern. It **unmounts when closed** rather than staying mounted with `inert`, because DP's
  closed state is `opacity: 0; pointer-events: none` — invisible but still focusable. Its header
  explains when to use which pattern.

**Persistence asymmetry:** the logged-in boolean is the only piece that survives a reload — it's a
plain external store (`src/lib/authStore.ts`) backed by `localStorage["muse_auth"]`, read via
`useSyncExternalStore`. `subscribed`, `subscribedPlan`, and `profile` (name/email/avatar) are plain
React `useState` in `AuthProvider` — in-memory only, reset to guest defaults on reload (and on
`signOut()`). Credits are the same: `CreditsProvider`'s balance is in-memory and resets to
`DEFAULT_CREDITS` on reload.

**Credits ARE charged — generation deducts, and refunds on failure.** (Rewritten 2026-08-02: this
section previously said "Credits are display-only … nothing in the codebase subtracts them", which
had been wrong since charging landed. It was RD's only written source, so treat the table below as
the contract. `e2e/behaviour-regressions.spec.ts` now proves each row.)

Costs live in `src/lib/mv/types.ts` and are frozen by `src/lib/api/contract.surface.test.ts` (C8):

| Constant             | Value    | Charged where                                                         | On failure |
| -------------------- | -------- | --------------------------------------------------------------------- | ---------- |
| `COST_STORYBOARD`    | 20       | `MvFlowProvider.startStoryboard()` — `addCredits(-20)` at job start   | refunded   |
| `COST_RENDER`        | 200      | `MvFlowProvider.startRender()` — `addCredits(-200)` at job start      | refunded   |
| `COST_SONG`          | 10       | `SongFlowProvider` / `SongCompose`                                    | refunded   |
| `COST_SONG_RECREATE` | 50       | `SongResultView` recreate                                             | refunded   |
| Enhance              | 0 then 1 | `CreditsProvider.consumeEnhance()` — first per session free (SONG-04) | n/a        |

The charge/refund rule is **GL-01**: charge when the job starts, refund from the poll's `onError`
so the "credits were not charged" failure copy stays true. See the `refund` closures in
`MvFlowProvider`.

**Insufficient balance routes to IAP instead of generating.** Note WHERE the guard lives — reading
only `MvFlowProvider` makes it look absent, because `startStoryboard()`/`startRender()` charge
unconditionally. The balance check sits one level up, at the point the user commits:

| Path            | Guard                                                                                                  | Location              |
| --------------- | ------------------------------------------------------------------------------------------------------ | --------------------- |
| MV (both modes) | `if (credits < cost) { setBuyOpen(true); return; }` where `cost` is `COST_STORYBOARD` or `COST_RENDER` | `MvRoom.selectMode()` |
| Song create     | `credits < COST_SONG`                                                                                  | `SongCompose`         |
| Song recreate   | `credits < COST_SONG_RECREATE`                                                                         | `SongResultView`      |

All three open `BuyCreditsModal` and return early — no job starts, nothing is charged.
`e2e/behaviour-regressions.spec.ts` proves this for the MV path (390 − 20 − 200 = 170, which is
already under `COST_RENDER`, so the next render must be refused).

`CREDIT_TRANSACTIONS` in `lib/user.ts` remains a static 7-entry seed ledger shown in
`CreditsDetailModal` — it does NOT react to `addCredits()` and does not reflect real usage.

## 7. Conventions you must keep (they're load-bearing)

Read `AGENTS.md` — it is the working contract for this repo and stays accurate by policy.
Highlights engineers most often trip on:

- **Styling:** colors via inline `style={{ background: "var(--card)" }}` from
  `tokens.css`; sizes as Tailwind arbitrary px (`text-[14px]`); radii via the remapped
  `rounded-*` names. New semantic color = new token in `tokens.css` consumed via `var()`.
  **Breakpoints are six tiers — 320 / 375 / 768 / 1024 / 1440 / 1920** (changed 2026-08-04,
  `docs/archive/redesign-migration-plan.md` §1.2); they are both the code breakpoints and the six
  screenshot widths. This replaced the old "only `sm:` (640) and `lg:` (1024)" rule, and the
  shell's phone cutover moves 640 → 768 as part of the Shell slice — until that lands you
  will still see `sm:` doing that job.
  **Never hand-edit a single token value** — but note the source changed on the same date:
  `tokens.css` is synced from the DESIGNER prototype (`designer-prototype/`), not the mobile
  Figma, and is replaced wholesale per drop. WA-specific semantic names go in
  `src/styles/token-aliases.css`.
- **State:** contexts stay small and domain-shaped. New async capability = schema →
  contract endpoint → mock impl → provider callback → domain hook (recipe in AGENTS.md).
- **Pages stay thin**; interactive code lives in `src/components/<area>/`.
- **E2e selectors are exact UI copy** — changing a label means updating `e2e/*.spec.ts`
  (two selectors had drifted; repaired 2026-07-11).

## 8. Quality gates

Definition of done: `npm run typecheck && npm run lint && npm run test:run && npm run build`
all exit 0.

- **Unit (Vitest):** colocated `src/**/*.test.ts(x)`. `src/lib/api/mock.test.ts` covers the
  job engine with fake timers — port these to contract tests against your real API client.
- **E2e (Playwright):** `npm run build && npm run e2e`. Serves the LAST production build on
  :3100. In sandboxed/CI environments with a system chromium:
  `CHROMIUM_PATH=/path/to/chromium npm run e2e`. New routes are axe-gated automatically —
  `e2e/a11y.spec.ts` scans `src/app/**/page.tsx` (dynamic `[param]` segments skipped); known
  accent-pill contrast issues are excluded via selectors until TODO.md #2 is resolved.
- **Storybook:** stories only for components without `next/*` imports; verify with
  `npm run build-storybook` (tsconfig excludes stories).

## 9. Key references

| What                                    | Where                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Working agreement / conventions         | `AGENTS.md`                                                                                             |
| Deferred decisions                      | `TODO.md`                                                                                               |
| MV flow spec (EARS acceptance criteria) | `specs/mv-creation-flow.spec.md`                                                                        |
| Backend contract                        | `src/lib/api/contract.ts` + `schemas.ts`                                                                |
| Design tokens                           | `src/styles/tokens.css` (synced from `designer-prototype/`)                                             |
| **UI source of truth**                  | **`../designer-prototype/`** — the designer's WEB prototype (DP). Copy its DOM and CSS; never its state |
| Flow reference (mobile)                 | `../ycmuse-app-prototype/` — source of truth for **flow only**, not UI. Reference; never import         |
| UI migration plan of record             | `docs/archive/redesign-migration-plan.md`                                                                       |

> **Two prototypes, two jobs — confusing them has already produced one wrong conclusion here.**
> The last row used to read "Source-of-truth mobile prototype", which was true when written and
> became misleading on 2026-08-04: the mobile prototype still defines **flow**, but the new **UI**
> now comes from the designer's web prototype. See `docs/archive/UI-INTEGRATION-HANDOFF.md` §0.
