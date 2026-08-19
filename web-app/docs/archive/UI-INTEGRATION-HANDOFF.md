# UI Integration Handoff — designer package → `web-app/`

**Read this before touching a single component.** It is the merge of three things that were
separate and partly contradicting each other:

- `docs/DEVELOPER-HANDOVER.md` — the architecture RD inherits (what must survive)
- `docs/redesign-migration-plan-2026-08-01.md` — the plan of record (phases, gates, decisions)
- the harness work of 2026-08-02/03 — what now blocks you automatically, and what does not

Supersedes `HANDOFF-harness-2026-08-03.md` (deleted — two overlapping handoffs is the same
drift problem this repo just spent two days removing).

**Status: not started, on purpose.** Waiting for the designer's final package. Nothing below
needs a decision from me; §5 is what needs decisions from you and the designer.

---

## 0. The three prototypes — get this straight first

Confusing them has already caused one wrong conclusion in this repo.

| Name | Path | Role |
|---|---|---|
| **WA** | `web-app/` | **The deliverable.** 20 routes, 82 tsx. Architecture + rules are OURS. |
| **DP** | `~/Downloads/YCM-main` | The designer's **web** prototype. 44 tsx, 41 css. **UI is theirs.** Vite SPA. |
| app prototype | `../ycmuse-app-prototype/` | The **mobile** app. Flow reference only. Never import. |

`DEVELOPER-HANDOVER.md` §9 calls the *mobile* prototype "source-of-truth" — that is true for
flow, and **not** true for the new UI. UI source of truth is DP.

---

## 1. What must survive — the five invariants

From `DEVELOPER-HANDOVER.md` §1–§3, restated as things the migration can break:

1. **The backend boundary is one interface and one swap point.** `MuseApi`
   (`src/lib/api/contract.ts`) + Zod schemas as the wire contract + `api` exported from
   `src/lib/api/index.ts`. Going live = implement the interface, change one line.
   *Migration risk:* DP has **no data layer at all** — no contract, no polling, no schemas.
   Take DP's DOM and CSS; never DP's state.
2. **Dependency direction:** `app → components → lib/api contract`. Views import `api`, never
   `MockMuseApi`.
3. **Generation is jobs, not promises.** `create*Job` → `pollJob` (120 ms) → `get*Job` until
   `done`/`failed`. DP collapses processing into same-page stages because it has no router;
   **plan D3 keeps WA's separate routes** for deep links, flow-guards, e2e and analytics.
4. **Credits are charged and refunded.** `COST_STORYBOARD 20` / `COST_RENDER 200` /
   `COST_SONG 10` / `COST_SONG_RECREATE 50`; charge at job start, refund from the poll's
   `onError` (GL-01). Insufficient balance routes to IAP — and the guard is in
   **`MvRoom.selectMode()`**, not the provider. DP has none of this (`credits={390}` hardcoded).
5. **Locale lives in the URL.** English unprefixed, 8 others prefixed; `localePath()` builds
   paths; `middleware.ts` resolves cookie → `Accept-Language` → English.

---

## 2. What the gate catches for you now

`.claude/hooks/stop-verify.sh` runs on every Stop — **~17s if no UI changed, ~84s if it did.**
Also reachable from a repo-root session via `../.claude/scripts/hook-dispatch.sh`, but see §6.

| Gate | Catches | Blocking |
|---|---|---|
| **G1-a** | `typecheck` · `lint` · `test:run` · `build` | ✅ |
| **G1-b** | 5 hard greps — `import.meta` (Vite-ism from DP), `fetch(`, `MockMuseApi` cross-layer, `sessionStorage` (DP's draft mechanism), `window.location.href=` — plus a raw-hex ratchet (38 hex lines / 19 files frozen; any increase fails) | ✅ |
| **G2-a** | tokens moved without regenerating `docs/token-map.md` | ✅ |
| **G4-a…f** | C1–C8 contract snapshots (inside `test:run`) | ✅ |
| **G4-g** | a C1–C8 change with no `docs/CHANGELOG-RD.md` entry | ✅ |
| **G5** | 46 Playwright + axe tests, incl. **25 behaviour regressions** covering all 10 of plan G5-d. Scoped to UI/e2e changes | ✅ |
| **G7** | a component/route change with no independent reviewer spawned this session | ✅ |
| checkpoint | `.claude/session-log/` on an EXIT trap — written even when a gate fails | never blocks |

**Three of those five greps exist specifically to catch DP artifacts crossing over**
(`import.meta`, `sessionStorage`, `window.location.href=`). That is not incidental — it is the
migration's main leakage path.

Run deliberately, not in the gate:

| Command | For |
|---|---|
| `npm run token-map` | Regenerate the WA⇄DP token map after a designer drop (plan §12 step 1) |
| `npm run e2e:visual` | Compare against **114 committed six-width baselines** (320/375/768/1024/1440/1920). ~3 min, stable |
| `npm run e2e:visual:update` | **Re-record — a decision, not a fix.** During Phase 1 the answer to a visual diff is to fix the token map |
| `npm run style:diff` | G2-b. Whole-document computed-style census (~4,400 samples/run) — reports which property on which element moved |

### The one thing the gate cannot catch

**i18n regression.** There is no gate on translation coverage, and §5 R-8 explains why that
matters more than it sounds.

---

## 3. Contradictions found while preparing this — 2 fixed, 3 open

Both documents were partly wrong. These were found by reading the code, not the prose.

### Fixed 2026-08-03

| | Was | Now |
|---|---|---|
| `DEVELOPER-HANDOVER.md` **§4** | "**Credits are cosmetic** — nothing decrements the balance" — while **§6 of the same file** said credits ARE charged. §6 was corrected on 08-02 and §4 was missed. Read only §4 and you build against a false premise. | Corrected, and points at §6's table. |
| **G1-b would have blocked the production migration.** §4 tells RD that after the real client lands, `fetch(` becomes "only inside the API implementation" — but the grep enforced **zero anywhere**. | `YCM_REAL_API=1` pre-wired: `fetch` allowed inside `src/lib/api/` only, banned elsewhere. Default stays strict. Tested in both directions; documented in §4's checklist where RD will hit it. |

### Open — these need your decision, not a fix

| | Conflict | Why it matters |
|---|---|---|
| **A** | `DEVELOPER-HANDOVER.md` §7 and `AGENTS.md` both say *"breakpoints are only `sm:` (640) and `lg:` (1024)"* and *"Never edit token values"*. The plan's **D2** and the **six-tier breakpoint decision** overturn both. | These are load-bearing rules that hooks and reviewers cite. Changing them is a deliberate act with a `CHANGELOG-RD.md` entry — not a side effect of Phase 1. Do it **before** Phase 1, or every reviewer will cite a rule you have already decided to break. |
| **B** | §7 says the mobile phone breakpoint is `sm:` 640. DP switches its mobile chrome at **767**. | Plan R12 correctly calls this a **behaviour** change, not styling: it changes which nav renders between 640 and 767. Needs its own slice and its own e2e. |
| **C** | §9 names `../ycmuse-app-prototype/` as "source-of-truth"; the UI source of truth is now DP. | See §0. Worth a one-line edit to §9 when Phase 1 starts. |

---

## 4. Measured facts (2026-08-03) — re-run before trusting them

| | Value | How |
|---|---|---|
| WA | 20 routes · 82 tsx | `find src/app -name page.tsx` |
| DP | 44 tsx · 41 css (11,658 lines BEM) | `find ~/Downloads/YCM-main/src` |
| Token map | WA 80 · DP 183 · **12 exact value matches** · 44 ambiguous · 24 WA-only · 69 DP-only | `npm run token-map` |
| **Type scale** | **11/11 steps carry the SAME value** — a pure rename | `docs/token-map.md` §2 |
| **Radius** | 4/10 shared; DP adds 20/22/26px | same |
| Genuinely different | pink · blue · gradient angle (135° vs 90°) | same |
| **DP SSR hazards** | **123 occurrences across 22 files** (`window` / `document` / `matchMedia` / `sessionStorage`) | matches plan R1 |
| **DP navigation** | 25 `window.location` reads · 15 `<a href>` · `App.tsx` routes by pathname string match | — |
| **DP i18n** | **none.** 0 dictionaries; `Navbar.tsx` hardcodes 12 language names | — |
| **WA i18n adoption** | `useT()` in **3** files (one is the provider) · `localePath()` in **8** · **57 view files hardcoded English** | — |

> The two token rows are worth re-reading. The plan rates **R2 🔴 高** on "圓角級距 / 字級命名
> 階梯完全不同". Measured: the type ladder is **entirely value-identical** (DP writes `rem`, WA
> writes `px`; `0.875rem` *is* `14px`), and radius shares 4 of 10. **R2 looks over-rated** —
> but confirm against the final package before re-sizing Phase 1.

---

## 4b. The plan's §8 spec differences — what changed since it was written

Plan §8 lists 19 differences (S1–S19) as *"要找設計師討論"*. When it was written, WA's side of
each was an assertion. **It is now largely executable.** That changes the conversation with the
designer from *"we think we had this"* to *"here is the test that proves it — DP removes it, is
that intentional?"*

| S | WA implementation | Proven by | What the gate already does |
|---|---|---|---|
| **S1** Pro gate on High quality | `SettingsModal.tsx:103` `locked={{ High: !subscribed }}` + crown → IAP | e2e *"Pro gate: High resolution is locked for a free account"* | — |
| **S2** Trim ≥ 30s | `TrimAudioModal.tsx:22` `MIN_TRIM_SEC = 30`, blocks + shows "minimum 30s" | ⚠️ **not tested** | — |
| **S3** 30s free preview | `SongDetail.tsx:15` + `CommunitySongPlayer.tsx:23` | e2e *"Pro gate: free playback is capped at a 30s preview"* | — |
| **S4** BPM + Key | `types.ts:79-81`, `SongCompose.tsx:172` | ⚠️ **not tested** | — |
| **S5** Credits, whole line | charge / refund / upsell (§1 invariant 4) | **3** e2e tests | C8 snapshot freezes `COST_*` |
| **S6** Publish → review | `HistoryView.confirmPublishMv()` | e2e *"publish confirms, then enters reviewing"* | — |
| **S7** Auth, two layers | `AuthGuard` on 5 routes + action-level `requireLogin` | **6** e2e tests | — |
| **S8** Auth persistence | `localStorage["muse_auth"]` | C5 contract test | 🔒 **G1-b bans `sessionStorage` outright** |
| **S9** 9 vs 12 locales | `LOCALES` = 9 | C6 snapshot | 🔒 **snapshot freezes 9** |
| **S16** Gradient angle | 135° | `docs/token-map.md` §1 | G2-a |
| **S17** Radius ladder | measured: 4/10 shared, DP adds 20/22/26px | `docs/token-map.md` §2 | G2-a |

**Two things to take from this table.**

1. **S2 and S4 are the untested ones — and they are exactly the kind that get silently
   dropped.** Both are small product rules living inside a component DP will replace
   (`TrimAudioModal`, `SongCompose`). Add an e2e case for each **before** migrating those two
   screens, not after.
2. **On S8 and S9 the gate has already taken WA's side.** `sessionStorage` is a hard G1-b
   failure and `LOCALES` is a frozen snapshot. If the product decides in DP's favour, that is
   fine — but it now requires a deliberate contract change plus a `CHANGELOG-RD.md` entry, not
   a quiet edit. Tell whoever owns that decision, so they do not experience the gate as an
   obstacle when it is doing its job.

### Plan §7's ten routing questions are still all open

Q1–Q10 (transition seamlessness, browser history for intermediate routes, deep-link behaviour
with no flow state, URL naming, Blog/Storybook structure, chrome scope). **Q10 is R-4 in §5 and
the most expensive to defer.** Q3 is partly answered already — the flow-guard redirect exists
and is tested (*"G5-d#4 flow-guard"*) — so that one needs confirming, not designing.

---

## 5. Research questions — answer these before writing code

R-1…R-7 carried over; **R-8 and R-9 are new and I rate them higher than most of the original list.**

| # | Question | Why it must be answered first |
|---|---|---|
| **R-8** 🔴 | **Migrating DP's `Sidebar` deletes one of only two real `useT()` consumers.** WA's `useT()` lives in exactly 3 files — `LocaleProvider` (the provider), `Sidebar.tsx`, `ProfileView.tsx`. DP ships its own `Sidebar` and **has no i18n at all**. | i18n adoption silently drops from 2 consumers to 1 and **nothing gates it**. Decide now: port `useT()` into every migrated component as you go, or accept an explicit i18n freeze with a dated entry in `TODO.md`. Doing neither is how 9 locales quietly become 1. |
| **R-9** 🔴 | **DP's navigation pattern breaks locale prefixes — and only in non-English.** DP uses `<a href="/home">` and `window.location.pathname`; WA's prefixes depend on `localePath()` (8 files) or the `NEXT_LOCALE` cookie → middleware **redirect**. | If DP's `<a href>` comes across, every navigation is a full page load **and** drops the prefix. The cookie redirect makes it still land on the right page, so **it looks perfect in English and is broken in the other 8 locales** — invisible to whoever tests it. Rule needed before Phase 2: every migrated link goes through `next/link` + `localePath()`. Consider a G1-b grep for `<a href="/`. |
| **R-1** | How does DP's BEM CSS coexist with Tailwind? Plan D1 proposes copying all 41 files behind one `@import` with a fixed load order. | **Nobody has tried it on one screen.** A one-screen spike settles it in an afternoon; guessing wrong shows up as unexplainable drift on every migrated screen. |
| **R-2** | 123 SSR-unsafe reads across 22 DP files. `Sidebar.tsx` reads `window.matchMedia()` in a `useState` initialiser; `App.tsx` reads `window.location.pathname` during render. | Hydration mismatch is the most likely way this goes sideways. Decide the pattern **once** — `"use client"` + reads in `useEffect` + SSR-safe initial values — then apply mechanically. |
| **R-3** | DP covers 9 of 20 routes. 11 undesigned, including the whole Profile / Settings / Credits-IAP / Share line. | Wait for coverage, or accept mixed visuals for a period. Stakeholder call; determines whether Phase 3 is one push or a long tail. |
| **R-4** | Marketing chrome layering (plan Q10) — which routes get DP's Navbar + Footer? | Decides how many layout layers the shell needs. **Cheapest to decide now, most expensive to change later.** |
| **R-5** | Where does `token-aliases.css` stop? Does migrated markup use DP names directly or go through aliases? | Without a rule both appear and the token layer becomes two systems. Write it into `AGENTS.md` before Phase 2. |
| **R-6** | See §3 conflict A — `AGENTS.md` + `DEVELOPER-HANDOVER.md` §7 must be rewritten for D2 and six-tier breakpoints. | Load-bearing rules cited by hooks and reviewers. |
| **R-7** | Is the final package the same shape as the one measured here? The generator expects `src/styles/tokens.css`. | `npm run token-map --dp <path>` handles a new location; a different internal layout needs the parser adjusted. **Check, do not assume.** |

---

## 6. Sequence when the package lands

1. **`npm run token-map`** against the final. Read §1 and §2 of the regenerated
   `docs/token-map.md`. Re-rate R2 if the ladders still line up.
2. **Answer R-4 and R-3** with whoever owns the product decision — they gate scope.
3. **Write the rules for R-8 and R-9 down** before any component moves. Both are silent
   failures; a rule after the fact means an audit after the fact.
4. **Update `AGENTS.md` + `DEVELOPER-HANDOVER.md` §7** for D2 and six-tier (R-6/conflict A),
   with a `CHANGELOG-RD.md` entry.
5. **Spike R-1 and R-2 on ONE screen** — `/history` is the plan's own first pick and the least
   entangled. Do not migrate a second screen until both have answers.
6. Then Phase 1. Its acceptance test is already wired: `npm run e2e:visual` **zero diff** and
   `npm run style:diff` **zero**. Non-zero means the token map is wrong — **fix the map, do
   not re-record the baseline.**

### Two operational notes

- **Start web-app sessions from `web-app/`, not the repo root.** Hooks forward from the root;
  **subagents and slash commands do not** — they are discovered from the session's own project
  root. Only from `web-app/` do you get `a11y-checker`, `design-reviewer`, `code-reviewer`,
  `component-architect`, and `/design-review`. G3-c / G5-e / G7 all depend on them.
- **Check whether G7 can actually verify.** It needs `transcript_path` from the Stop payload;
  without it it reports `UNVERIFIED` honestly, but that means it is not verifying. After your
  next real Stop: `grep 'Transcript source' .claude/session-log/LATEST.md` — `payload`/`env` =
  verifying; always `guess`/`none` = it needs a different signal.

---

## 7. Still open, not blocking the migration

- **B5 — RD has not confirmed the C1–C8 contract list.** One email. **The G4 gate can only
  protect what is on that list**, so its value is capped by that list's accuracy. Worth doing
  while the migration is parked; it costs nothing.
- **Commit the harness work.** 27 modified + 22 untracked as of 2026-08-03; no deploy is hooked
  to this repo. One size decision: `e2e/visual-baseline.spec.ts-snapshots/` is 8.6 MB / 114 PNGs.
  **Commit them** — they are the Phase-0 baseline plan §11 step 2 asks for, and a baseline that
  exists on one laptop cannot gate Phase 1.
- **`TODO.md` #1/#2/#3** unchanged: community undefined, `/` axe contrast, 7 dev-dep audit findings.

---

> **The one habit to carry into this migration.** Every gate here was built by checking what the
> code *does*, never what a document *says* it does — and that is not a stylistic preference.
> Three findings during this work were wrong for exactly that reason, including a document that
> told RD credits were display-only while the code had been charging them for weeks, in the same
> file that elsewhere said the opposite. When DP, the specs, and the code disagree, **read the code.**
