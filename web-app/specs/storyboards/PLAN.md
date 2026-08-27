# Storyboard Spec Programme — work breakdown

> **What this file is.** The queue of `yco-spec` storyboard specs that will cover the whole
> product, in the order we build them, plus the conventions every one of them inherits from
> the AI Song Creation trial. One spec at a time; this file is the running record.
>
> **Programme decisions D1–D12 are settled — see §5.**
>
> **Status legend:** ✅ done · ▶ in progress · ⬜ queued · ⏸ blocked (reason named)

---

## 1. Two spec layers — don't confuse them

| Layer | Files | Audience | Basis |
|---|---|---|---|
| **Area specs** (existing) | `specs/areas/01..11-*.md` | RD + AI agents | Behaviour-first, as-built, EARS `AC-*` criteria. Text only, no screenshots. |
| **Storyboard specs** (this programme) | `specs/storyboards/<slug>/specs/spec.html` | **QA** | Screenshot-led walkthrough of the same behaviour, built with `skills/yco-spec`. Every rule traces back to an `AC-*` in the area spec. |

The storyboard layer adds **no new product rules**. When a capture shows the app doing something
the area spec does not say, that is a finding: it becomes a `decisions` row, an `open_questions`
row, a `prototype_deltas` row, or a correction to the area spec — never a silently invented bullet
(`skills/yco-spec/SKILL.md` § Provenance).

`docs/flows/flow-*.svg` (six diagrams) is the map we slice by. Each storyboard spec draws **its
own** `user-flowchart.svg` at its own level of detail; the six overview diagrams stay as they are.

---

## 2. The queue

Sizes are estimates from the area specs' journey counts (`## 4. Journeys`) and route inventory,
calibrated against the finished song spec: **7 paths / 33 screenshots / 774-line `build_spec.py`**.

| # | Slug | Flow | Area source | Routes / surfaces | Paths | Shots | Status |
|---|---|---|---|---|---|---|---|
| **S1** | `song-creation` | 3 | 03 (+05 glance) | `/song/create` `/song/creating` `/song/result` | 7 | 33 | ✅ v2, 2026-08-26 |
| **S2** | `mv-creation` | 2 | 02 (MV-P1…P4, P6) | `/mv/room` + 6 sheets, `/mv/thinking` `/mv/storyboard` `/mv/creating` `/mv/result` | ~8 | ~45 | ▶ building — 27/~42 captured |
| **S3** | `mv-edit` | 2 | 02 (MV-P5) | `/mv/edit` | ~4 | ~18 | ⬜ postponed — shares `areas/02` with S2 |
| **S4** | `history` | 6 | 05 | `/history` | ~5 | ~20 | ▶ building (session `web-app-bf`) |
| **S5** | `credits-iap` | 5 | 07 | `SubscribeModal` `BuyCreditsModal` `/profile/credits` | ~4 | ~16 | ⬜ |
| **S6** | `shell-auth` | 1 | 01 + 09 | sidebar / tab bar / top bar / `SignInModal` | 7 | ~28 | ⬜ scoped, dispatch held (account session limit, 2026-08-27) |
| **S7** | `profile-account` | 1 | 06 | `/profile` `/settings`, account menu, edit-profile | ~5 | ~20 | ⬜ |
| **S8** | `explore-community` | 4 | 04 | `/` `/explore/mvs` `/explore/songs` `/watch` `/song/play` `/creator` | ~6 | ~30 | ⬜ |
| **S9** | `share` | 4 | 10 | `/share`, `ShareDialog` | ~4 | ~12 | ⬜ |
| **S10** | `credit-consumption` | — | 11 | none — `spec_kind='data-contract'` | — | 0 | ⏸ `TBD-CC-06` |
| — | ~~proof-of-creation~~ | — | 08 | — | — | — | ❌ out of web scope (area 08 § Status) |

**Coverage check.** Areas 01–07, 09, 10 are covered by S2–S9 plus the finished S1; area 08 is
removed from scope; area 11 is S10 and is contract-shaped, not journey-shaped.

### S2 scope — agreed at its Phase 0 gate, 2026-08-27

Eight paths, ~42 captures. `/mv/edit` is **not** in it (that is S3).

| Path | Covers |
|---|---|
| **P1** | Storyboard-first, end to end: compose → `ModeModal` → `/mv/thinking` → `/mv/storyboard` (visual style + scene edits, Enhance) → Generate MV → `/mv/creating` → `/mv/result` → the new `/history` row. ~12 steps. |
| **P2** | Direct generation: Templates + Enhance to fill the brief → **Create MV Directly** → `/mv/creating` → `/mv/result`. ~6 steps. |
| **P3** | Generation failure, **both stages**: the `[fail]` marker is captured at `createMvJob` and reused by `renderMvJob`, so storyboard-first fails at **thinking** and direct fails at **creating**; Retry re-runs the same compose and re-fails deterministically. |
| **P4** | The six sheets and their boundaries, kept together because `MV-01` / `MV-02` / `MV-04` are three app-synced numeric rules QA tests individually: Choose Song (My / Sample), Import reject on format **and** 50 MB, Trim's ≥30s floor, FacePicker crop, Settings' Pro-gated **High** crown → `SubscribeModal`, Templates. |
| **P5** | Guest gate (`AC-MV-01b`): the screen renders with no modal; **Song Library** and **Create Music Video** gate; **Import Audio stays ungated**. |
| **P6** | Insufficient credits at mode select → buy-credits IAP instead of generating. |
| **P7** | The side rail's two modes — Trending MVs vs My Creations (needs `loggedIn` **and** ≥1 completed MV). |
| **P8** | `/mv/result` controls tour: the hand-built transport, Like/Dislike, Share, Download, Publish → "Ready to Go Public?" → pending review, the **"Unpublish to edit"** neutral state (`MV-E7`), the info panel, and the opened-from-History variant. |

Two capture notes settled at the same gate:

- **`/mv/creating` is captured as-is** with one RULES line sourced to `areas/02` §1 — it is the one
  route in the area deliberately left on the pre-migration shared `GenerationView`, and QA would
  otherwise file the visual mismatch as a bug. Not a `prototype_deltas` row: nothing is faked.
- **`AGENTS.md`'s "Playwright's Chromium cannot decode H.264" does not apply to this capture run.**
  Probed 2026-08-27 against `feature_intro_ai_mv_singing_480x640.mp4` over localhost on both the
  bundled Chromium and installed Chrome: `videoWidth 480`, `currentTime` advancing, no `MediaError`.
  That note was measured in the Linux CI sandbox. MV's videos photograph — but every `<video>` is
  **paused and seeked to a fixed time before the shot**, or an autoplaying frame differs every run.
  Separately, the three MV-type cards ship **no `poster`**; worth raising with the app, not a blocker.

### S6 scope — agreed at its Phase 0 gate, 2026-08-27

Seven paths, ~28 captures. Scoped ahead of S3/S4/S5 because it is the only queued spec whose source
files collide with neither S2 (`areas/02`, `src/components/mv/*`) nor the separately-running S4
(`areas/05`, `src/components/history/*`). **Dispatch is held** — its first run died on an
account-level session limit before producing anything, so it restarts from this table.

| Path | Covers |
|---|---|
| **P1** | Signed-in navigation: sidebar item → `next/link` through `localePath`, active styling, locale prefix preserved. |
| **P2** | Gated **nav** while logged out (`GATED = /history, /profile, /settings`) → sign-in modal with the target queued → on success the queued navigation runs; **on dismiss the user stays put**. |
| **P3** | Header **Sign In** with no queued action → 1.8s success animation → the header swaps to logged-in chrome, no navigation. |
| **P4** | Gated **route** entry (arriving at `/history` etc. directly) → the guard renders nothing and opens the modal → **on dismiss `router.replace(home)`**. The contrast with P2's dismiss is the reason this is its own path. |
| **P5** | Account menu, walked in place: credits badge, avatar with its PRO/FREE badge, the credits row, Profile / My Creations rows, the inert Notifications / Send Feedback rows (`SHELL-03`), Sign Out; outside-click and Esc close it. |
| **P6** | Sign out from **both** entry points (the menu, and Settings) + `AUTH-E1`: a reload keeps `loggedIn` but drops subscription and profile, so the user is `free` again. |
| **P7** | Bare page — `/share…` renders with no sidebar and no top bar. |

**Neighbour boundary.** Where a control leads into another spec's territory, S6 captures one step
showing it **opened** and stops: `BuyCreditsModal` → S5, Profile → S7, My Creations → S4, `/share`'s
own content → S9. Restating their rules here would make S6 the contract for patterns it does not own.

**D8 exception, scoped to S6 only: capture at 1440 *and* 375.** The phone chrome is not a reflow of
the desktop shell, it is a **different component tree** (`MobileTabBar` / `MobileHeader` vs
`Sidebar` / `TopBar`) carrying behaviour that exists nowhere else — the ＋ create sheet (un-gated
2026-08-12) and its still-gated History entry. At 1440 all of it is `display:none`, so a
1440-only shell spec would document half its own subject, and `e2e/a11y.spec.ts` is desktop-only
too, so nothing else covers it. `areas/01` §4's own capture note already asked for both widths.
**D8 stands unchanged for the other eight specs.**

### Why this order

1. **S2/S3 first** — the creation half is the only part of the product whose contract is frozen
   and RD-ready (`specs/OPEN-QUESTIONS.md` § ✅ 已經 RD-ready). MV is the sibling of the finished
   song spec, so every convention transfers one-to-one and the format gets its second data point
   on the flow that matters most.
2. **S4 next** — both creation flows end in History; S1 already borrows one History step and
   declares History's own behaviour out of scope. S4 pays that off.
3. **S5** — Credits gates every create CTA that S1–S4 walk past (`AC-SONG-09`, insufficient-balance
   → IAP). Specifying the gate after the flows that hit it means the flows are already written down.
4. **S6/S7** — global chrome and account. Every earlier spec assumes the shell is present; this is
   where that assumption gets its own screenshots.
5. **S8 late, deliberately** — Explore/Community is the one half that is **not** RD-ready: `MuseApi`
   has no community endpoint at all and 17 components on 9 routes run on hardcoded seeds
   (`TBD-EXP-11`, a named handoff blocker). Its UI behaviour is still specifiable, but expect a long
   `open_questions` section, and expect the source PRD (`YouCam_Muse_Explore_Curation_PRD - V2.pdf`,
   still unread) to have to be read first.
6. **S9** — share surfaces hang off result/player screens that S2–S8 will already have specced.
7. **S10 blocked** — the per-action credit payload has no field contract yet (`TBD-CC-06`: field
   names, units, and which sub-action a delegated action's quantity maps to are all undefined).
   A data-contract spec written today would be an open-questions list wearing a spec's clothes.

---

## 3. Conventions every spec inherits (from the S1 trial)

Locked unless a decision below changes them.

- **Layout.** `specs/storyboards/<slug>/` holding `build_spec.py`, `make_flowchart.py`,
  `capture_screenshots.py`, `user-flowchart.svg`, and `specs/{spec.html, spec-bundled.html,
  screenshots/NN_name.png}`.
- **Screenshot source = the live app.** There is no separate prototype in this repo; captures come
  from `npm run dev` on localhost:3000 driven by Playwright, signed in with the same
  `localStorage['muse_auth'] = '1'` seed the e2e specs use. **Desktop 1440 only.**
- **Audience = QA**; `actor_label = 'WEB UI'`; English only; behaviour only (no DOM ids, no code).
- **Provenance.** Sources are `specs/areas/*.md`, `specs/00-overview.md`, and the running app.
  Every quoted string is re-confirmed against the live app's accessibility tree during capture.
- **Traceability.** `criteria` maps each area-spec `AC-*` to the step(s) that specify it. A
  criterion with no step carries a reason — `validate()` rejects a silent gap.
- **`prototype_src` is listed file-by-file**, not as a directory: `lint_spec.py` only scans
  `.html`/`.js`, and its tag-stripper misfires on TSX generics. Known false-positive misses go in
  `strings_ignore` **with the reason written out**, as in S1.
- **Mock reality goes in `prototype_deltas`**, never buried in a step. Anything the mock fakes
  (one shared fixture audio file, in-memory credits, static ledger) is a delta row.
- **Flowchart.** Drawn with `flowchart_lib` via the spec's own `make_flowchart.py`; the subtitle
  must read `matches spec <version>, <date>` or the build fails.
- **Comments layer off** (`comments_enabled: False`) — no Firebase backend in this repo.
- **Gates per spec:** `python3 build_spec.py` (hard `validate()`), then
  `python3 skills/yco-spec/lint_spec.py <dir>` aiming at zero findings, then the Phase 5 visual
  pass over `spec.html` on localhost.
- **One spec = one branch = one commit series**, named `spec/<slug>-storyboard`, matching S1.
- **App bugs found while capturing** are reported to the product owner with a recommendation, not
  fixed silently. S1 hit two (Enhance chooser, Recreate navigation race) and both were fixed in the
  app on instruction; one further finding (Prev/Next across My Creations) was documented only,
  because its cause is a shared mock fixture rather than a logic bug.

---

## 4. Per-spec procedure

1. **Phase 0 gate** — grill the scope: which paths, which sheets, which edge cases, whose copy.
   No files written before it is answered (`skills/yco-spec/SKILL.md` § Phase 0).
2. **Read** the area spec end to end + the components in play; list paths, steps, exact strings,
   numeric rules.
3. **Capture** at 1440 with focus boxes measured during capture, not eyeballed after.
4. **Build** `build_spec.py`, run it, run `lint_spec.py`, fix findings.
5. **Verify** over localhost; confirm both HTML outputs.
6. **Report** — cite both file paths, list every delta / decision / open question raised, and name
   any area-spec correction the capture forced.

---

## 5. Decisions — settled 2026-08-27 (grill-me, product owner)

| ID | Decision | Note |
|---|---|---|
| **D1** | **MV is two specs** — `mv-creation` (`/mv/room` + its 7 overlays → thinking → storyboard → creating → result, plus failure and the two gates) and `mv-edit` (`/mv/edit`). | The cut lands where the user re-enters from the result screen **and** where charging changes from per-generation to per-micro-op. One document would have been ~60–70 shots / ~1,300-line `cfg`. |
| **D2** | **Credit cost in RULES follows S1: no numbers.** Every cost bullet reads "charges on start, refunds on failure; cost per the Credit Consume MSR". | Applies even though `areas/11` §3.2–3.6 prices MV precisely and the code computes to it (`scriptCost` / `createMvCost` / `generateMvCost` / `recreateShotCost`). **Carry-over:** the MSR link is still `TBD` in S1's `references`, so the pointer resolves to nothing — every spec raises it as an `open_questions` row until we have the link. |
| **D3** | **Queue order stands** — creation half first (§2). | Ordered by contract readiness, not by document size. |
| **D4** | **`shell-auth` is one spec** (areas 01 + 09). | `SHELL-P2` (gated nav while logged out) *is* `AUTH-P2`'s trigger; splitting puts the trigger and the response in different files. |
| **D5** | **`explore-community` is one spec** across all six routes, and `YouCam_Muse_Explore_Curation_PRD - V2.pdf` is **read as an input before its Phase 0**. | Its six journeys share one seed data set and one missing API contract (`TBD-EXP-11`). |
| **D6** | **`share` is its own spec.** S1/S2/S4 name the shared dialog and add only what they do differently. | `/share` is public by design and never-expiring (`TBD-GL-07`, closed 2026-08-19). |
| **D7** | **S10 (`credit-consumption`) is deferred** until `TBD-CC-06` is answered, then re-evaluated against `areas/11`. | Field names, units and delegated-action quantity mapping are all undefined; a spec today would be an open-questions list wearing a spec's clothes. |
| **D8** | **Desktop 1440 only**, every spec. | Accepted coverage gap, stated so nobody reads it as covered: the phone layouts (bottom tab bar, mobile header, full-screen player, `/mv/edit`'s `MobileSceneDetail`) get no QA storyboard, and `e2e/a11y.spec.ts` is desktop-only too, so nothing else covers them either. A phone pass is its own decision and its own capture run. |
| **D9** | **Own flowchart per spec**, drawn with `flowchart_lib`, citing its own step IDs, version-stamped. | `docs/flows/flow-*.svg` stays the six-diagram overview citing area IDs. |
| **D10** | **App bug found while capturing: fix it if it is a one-file fix with an e2e guard, then report.** Anything larger stops for the product owner's call. | Chosen over report-and-wait with the risk stated: "small" is the judgement that fills this repo's error log. The mutation-test-both-directions rule applies to every guard added this way. |
| **D11** | **A capture that contradicts an area-spec `AC-*` corrects `areas/*.md` in the same branch**, annotated in place with the ⚠️ convention areas 02/03/07 already use, and cited in the spec's report. | `00-overview.md`'s single-source rule: leaving the AC stale means the two layers now disagree, and the area specs are what the AI agents read. |
| **D12** | **Execution:** the Phase 0 gate and the final review stay in the orchestrating session; one **sonnet-5 / effort-high** subagent per spec owns Phases 1–4 (read → capture → `build_spec.py` → `validate` + `lint_spec`). | The skill's own rule that a build session must not self-certify. One spec at a time — captures must not run concurrently (CPU contention flakes Playwright; see `AGENTS.md`). |
