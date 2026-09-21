# eBugs — 2026-09-21

Pulled from ePF over the REST API (`.claude/skills/ycm-ebug-fix/scripts/epf_ebug.py`), the first
run since the skill stopped depending on a browser SSO session.

- **Query:** `search --ycm-web --pm-open` → Product `YouCam Muse Web` (`ProductID 315`),
  `BugBelong: PM`, statuses `NewCreated` + `Assigned`. Retrieved 2026-09-18, re-checked 2026-09-21.
- **Returned 4:** `YMW260918P0003`, `YMW260917P0008`, `YMW260915P0012`, `YMW260911P0004`.
- **In scope this session (product owner):** `YMW260911P0004` and `YMW260917P0008` only.
  The other two were explicitly deferred — not triaged, not touched.

| #   | BugCode          | Status                                                        |
| --- | ---------------- | ------------------------------------------------------------- |
| 1   | `YMW260911P0004` | ↩️ **ROLLED BACK** (`53915d3`, pushed) — unfixed here; RD does the rail skeleton |
| 2   | `YMW260917P0008` | ✅ Implemented as new behaviour (`53915d3`, pushed to `main`)  |
| 3   | `YMW260918P0003` | ⏸️ Deferred by the product owner — not looked at              |
| 4   | `YMW260915P0012` | ⏸️ Deferred by the product owner — not looked at              |

---

## YMW260911P0004 — [AI Music Video] Grey, no loading animation on F5 / tab switch

- ePF status: NewCreated · Priority: 2 · Severity: 2 · Handler: JASON_CHEN
- Reported by ARIES_HONG, 2026-09-11 · Build 0911 · Note: `URL: https://testing-ycm.makeupar.com`
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260911P0004
- Triage: **Rolled back** (product owner, 2026-09-21)
- Local status: **Reverted to the pre-2026-09-12 behaviour.** Not fixed here by decision — the
  agreed solution is a rail skeleton that RD implements against the real backend (spec only on our
  side: `AC-MV-22` / `MV-E10` / `AC-SONG-20`).

### What happened, in order

1. **2026-09-12 (`fc28162`)** added `app/[locale]/loading.tsx`, a route-level fallback. It fixed
   the client-side tab-switch case.
2. **2026-09-14 (`9109683`)** swapped its custom spinner for History's own 3-dot animation,
   extracting `ui/LoadingDots.tsx`. It also recorded F5 as unfixable.
3. **2026-09-21 (this session)** found that diagnosis was wrong and fixed the F5 half in
   `AuthGuard` — which had been returning `null` while auth hydrated, so four guarded routes
   served an empty 34-byte `<main>` for the whole JS load.
4. **2026-09-21, same session:** the Stop hook blocked four times on e2e, and the cause traced
   back to step 1.

### Why step 1 was the problem

`loading.tsx` wraps **every** route under `[locale]` in a Suspense boundary, so Next streams each
page in two parts and parks a copy in a hidden `<div hidden>` until an inline script swaps it in.
Measured: SSR HTML has **one** copy of a given element and a settled page has **one**, but the
HTML also carries **two `<div hidden>` staging divs** — and in the failure snapshots the
accessibility tree shows **one** button while the CSS locator found **two**. Under load the swap
has not run when Playwright queries, so a locator matches both. Hence
`strict mode violation: … resolved to 2 elements` on whatever route each run happened to reach,
which is why the failing set changed every time (22 · 27 · 24 · 14).

**Users never see this** — the duplicate is hidden and lives for milliseconds. Only the test
suite trips on it.

### Decision and what was reverted

Product owner, 2026-09-21: **全部 rollback.** Reverted to the pre-2026-09-12 state:

- deleted `app/[locale]/loading.tsx`
- deleted `components/ui/LoadingDots.tsx`
- `HistoryView.tsx`: `HistoryLoadingDots` inline again, byte-identical to before `9109683`
- `components/auth/AuthGuard.tsx`: back to `if (!hydrated || !loggedIn) return null`
- deleted `components/auth/AuthGuard.test.tsx`

**Accepted consequence:** F5 on `/history`, `/profile`, `/settings`, `/profile/credits` shows an
empty `<main>` until hydration, and the AI Music Video ↔ AI Song switch has no animation. That is
exactly the behaviour that shipped before 2026-09-12.

**Do not re-add a route-level `loading.tsx`** without first measuring the e2e gate — that file is
what this rollback removed, and why. `AC-MV-22` now forbids it explicitly.

### The agreed solution (product owner, 2026-09-21) — spec only, RD implements

The eBug's own screenshot was a **panel-level skeleton in the right-hand rail**, not a page-level
spinner. That rail is what needs query time against a real backend, so the fix belongs there:

- the two create screens' side rail renders a **skeleton** while fetching
- **every other loading state keeps the 3-dot UI** — this narrows, not revokes, the 2026-09-14
  "one loading UI everywhere" instruction
- **RD implements it on the real backend.** Nothing is built here: `useMyCreations()` is a
  synchronous `useMemo` over in-memory state, so this prototype has no loading moment to render.
  `MV-E10` records that, so nobody later "implements" a skeleton that can never appear.

Specs updated: `areas/02-mv-creation.md` (**AC-MV-22**, **MV-E10**),
`areas/03-song-creation.md` (**AC-SONG-20**), plus a `CHANGELOG-SPEC.md` entry.

### Reply comment (paste into eBug)

> 此問題在 web prototype 這邊維持原狀，不另外處理。解法已確認由 RD 在實際後端實作時一併完成：
> 在 Trending MV / My Creation 這個側欄加上 skeleton（該欄需要 query 時間，回報截圖中的灰色
> 區塊就是這一欄）。其餘畫面的載入狀態維持現有的三點動畫。

（產品負責人 2026-09-21 指定：RD 尚未看過 09-12 / 09-14 那兩版載入動畫，所以對外不提它們
存在過或被移除，只說明目前狀態與後續由誰處理。內部原因見上方「Decision and what was
reverted」。**這段比原本核可的「乙」多了一句解法歸屬** —— 因為 skeleton 的決定是在核可之後
才定的，若不想對外揭露分工，改回單純一句「此問題尚未修正，仍在評估解法」即可。）

## YMW260917P0008 — [History] Delete Project in Edit Music Video deletes the original MV

- ePF status: NewCreated · Priority: 2 · Severity: 2 · Handler: JASON_CHEN
- Reported by KURT_WANG, 2026-09-17 · Build 0917
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260917P0008
- Retrieved at: 2026-09-18 (API), re-read 2026-09-21
- Triage: **Needs PM → answered.** The Expect Result and the newest comment contradict each other.
- Local status: **Pushed** — `53915d3` on `main` 2026-09-21. Production not yet re-checked.
- Related code/spec: `components/providers/HistoryProvider.tsx`,
  `components/history/HistoryView.tsx`, `components/mv/MvEditor.tsx`,
  `app/[locale]/mv/edit/page.tsx`, `specs/areas/02-mv-creation.md` **MV-P5-S6**

### Report

- Repro Steps: 1. Login 2. History > edit a MV 3. Change prompt of a scene > Recreate 4. After finishing recreating scene, click Delete Project
- Result: Delete the project deletes the original MV; it disappears from History.
- Expect Result: Delete the project shouldn't affect the original MV.
- Comment (SMITH*LEE, 2026-09-18): *"after discuss w/ PM, delete project would delete mv."\_

### The conflict, and how it was resolved

The Expect Result says the MV must survive; the comment says it should be deleted. **Measured
before asking:** the reported symptom does **not** reproduce in this prototype. Ran the exact
repro at 1440px — History → Edit MV on "Cinematic Night" → edited the scene prompt → Recreate →
Delete this Project → confirm — and landed back on `/history` with **all 8 rows intact**. The code
agreed: `deleteProject()` only reset the in-memory flow, `HistoryProvider` exposed no removal at
all, and History's own delete was local `HistoryView` state that `MvEditor` could not reach.

Put to the product owner as three options; **they chose "make delete remove the MV"** (2026-09-20).
So this is new behaviour, not a defect repair.

### Resolution and verification

- `HistoryProvider` gains `removed: ReadonlySet<string>` + `remove(id)` — **C4 additive**.
  Deletion has to be a filter, not a splice: the grid draws from live jobs **and** the
  `HISTORY_SAMPLES` module constant, which cannot be spliced.
- `HistoryView`'s local `removed` state lifted to the provider.
- `?id=` is already in the URL: `/history`'s "Edit MV" has linked `/mv/edit?id=<historyId>`
  since slice 3k. `deleteProject` removes that row before navigating.
- `MvEditor.deleteProject()` reads the query with `window.location.search` **at click time**.
  The first attempt used `useSearchParams`, which needs a `<Suspense>` boundary and opts the
  route out of prerendering — see "What the Stop hook caught" below. No route file changed, so
  this is **not** a C7 change.
- **Scoped deliberately:** reached from `/mv/result` or `/creator` there is no `id`, nothing is in
  History yet, and it discards the flow only, exactly as before.
- **Checks run:** typecheck / lint / test:run / build all exit 0. New
  `components/providers/HistoryProvider.test.tsx` (5 tests), **mutation-tested both ways**.
  `providers.surface.test.ts`'s C4 snapshot caught the two new keys — updated, diff is exactly two
  added lines, nothing renamed or removed. G4-g passes with the `CHANGELOG-RD.md` entry.
- **Verified live** at 1440px: History 8 rows → **7**, "Cinematic Night" gone, the other two MVs
  untouched. Boundary case also verified: `/mv/result` → Edit MV → Delete this Project (no `?id=`)
  left History at **7 rows** with nothing removed.
- **Side effect, deliberate and worth telling QA:** deleting from `/history` itself now persists
  for the session. It was component state before, so a deleted row reappeared as soon as you
  navigated away — that had to change for `/mv/edit` to reach it, and was never right on its own.
- **Not verified:** the `@visual` gate, same machine reason as above.

### Reply comment (paste into eBug)

> Behaviour now matches the decision in the comment above: **Delete this Project deletes that
> music video from History.** Worth knowing for retest — the web prototype never had the reported
> bug (the original MV stayed in History, so it didn't reproduce here); this is the agreed
> behaviour being added rather than a fix. If you open the editor from somewhere other than History
> — the MV result page, for example — Delete still only discards the unsaved edits, because there
> is no saved creation behind it yet.

---

## The e2e gate on this machine is unstable, and it is not this change

The Stop hook blocked twice. Chasing it produced one real simplification and one wrong
conclusion, and the measurement that settled it was a **full-suite run on a stashed clean tree**:

| Tree | Result |
| --- | --- |
| Mine, run 1 | **22 failed** / 203 passed |
| Mine, run 2 (after the `useSearchParams` change was backed out) | **27 failed** / 198 passed |
| **Clean tree (`git stash`, rebuilt), full suite** | **24 failed** / 201 passed |

**The clean tree fails at the same rate**, and the failing SETS differ in all three runs. The clean
run failed six tests that never failed on mine (`G5-d#2`, `3g` blocks, `3h / GL-01`, `3i` DETAIL
list, `3k / MV-08`, `item 1`). Almost every failure, in every run, is the same signature:
`strict mode violation: … resolved to 2 elements` — the page momentarily rendering twice — on
whichever route the run happened to hit. Re-run alone the same tests pass: `mv-flow` 2/2,
`G7 3k-1` 3/3, and the two that failed the final targeted run passed immediately afterwards at
**both** `--workers=1` and `--workers=4`.

So roughly 10% of this suite fails non-deterministically on this machine regardless of worker
count and regardless of the diff. **A gate that red cannot attribute a failure to a change**, and
the honest reading of the two blocked Stops is "the gate is broken here", not "this change broke
23 tests". `AGENTS.md` already says a gate that fails under load is not evidence of a bug; what
this adds is that it is not reliable evidence when quiet either. Worth its own investigation —
nothing in this session's scope fixes it.

### Root cause of the duplication — CONFIRMED by removal

Every one of those failures is a CSS locator matching **two** copies of one element. Measured:

- The **SSR HTML has exactly one** copy (`curl /mv/room` → 1 `mv-create__photo-add--primary`), and
  a **settled page in a browser has exactly one**. The duplicate is transient.
- The SSR HTML also contains **two `<div hidden>` staging divs** — Next's streaming buffers, where
  content waits until the inline swap script moves it into place.
- Playwright's failure snapshots show the **accessibility tree with only one** button while the CSS
  locator found two. A hidden staging div is invisible to the a11y tree and visible to a CSS
  locator. That is the signature.

So under load the server streams slowly, the swap script has not run, and a locator evaluated in
that window sees the in-place copy plus the staged one. **The thing that creates that split for
every page is `src/app/[locale]/loading.tsx`** — a Suspense boundary wrapping every route under
`[locale]`, added 2026-09-12 in `fc28162`, which is the PREVIOUS fix for `YMW260911P0004`.

**CONFIRMED 2026-09-21 by removing it and re-running the full suite:**

| Tree | Full suite |
| --- | --- |
| Clean tree (control, `loading.tsx` present) | **24 failed** / 201 passed |
| Mine, `loading.tsx` present | 22 · 27 · 14 failed |
| **After the rollback (`loading.tsx` deleted)** | **6 failed / 219 passed** |

**Five of those six are in the clean-tree baseline** — pre-existing, nothing to do with either
eBug. The sixth (`G5-d#3 /mv/room's Song library is gated too`) passed 3/3 when re-run alone, so
it is residual flake. Removing one file took the gate from ~24 non-deterministic failures to
5 deterministic pre-existing ones.

### Two failures are deterministic, pre-existing, and worth their own fix

Not flake: `3g-2: the face picker wears DP's block` and
`consent: accepting opens the picker` failed **3/3** in a repeat-each run, and both fail on the
clean tree too. They are real, they predate this session, and nothing here touches them.

### What I got wrong on the way, twice

1. **A browser measurement that confirmed my hypothesis.** I counted 2 `.mv-create__panel` on my
   build vs 1 on a clean build and concluded I had caused a double render. The reading was taken
   moments after a `resize_window` and was a transient; my own build reads 1 at the same viewport
   when re-measured. Two build cycles were spent on it.
2. **Attributing five failures to this change.** After single-test retries I reported 12 flake,
   5 pre-existing, "5 genuinely mine". The clean-tree full run shows that split was over-confident:
   those five pass on this tree now, and tests that passed on mine fail on clean. The only
   defensible statement is the one above — the suite is too noisy here to attribute anything.

**One real improvement survived the detour.** Reading `?id=` with `useSearchParams` forces a
`<Suspense>` boundary on `/mv/edit` and opts the route out of prerendering, which is a genuine
rendering-mode change to a route that did not ask for one. It is now read from
`window.location.search` inside the click handler — no hook, no boundary, no prerender deopt, and
`src/app/**/page.tsx` untouched, so the change is C4-additive only. That is a better shape on its
own merits, whatever the gate was doing. Rule recorded in `AGENTS.md` → Architecture.

## Not done in this session

- **`specs/index.html` is stale, and it was stale before this session.** It is generated from the
  markdown specs by `specs/build-index.py`. Regenerating it from **unmodified** markdown already
  produced a 388-insertion / 28-deletion diff against the committed file, touching `AC-EXP-02`,
  `AC-EXP-03`, `AC-EXP-05`, `AC-PROF-06`, `EXP-P1-S3` and more — i.e. spec drift from earlier
  sessions that was never regenerated. Regenerating it here would have bundled all of that into an
  eBug commit, so `index.html` is left untouched and the markdown (`areas/02-mv-creation.md`,
  `CHANGELOG-SPEC.md`) is the accurate source. **Worth its own change.** Note `build-index.py`
  needs the `markdown` package, which is not installed on this machine.
- **The full e2e suite was not re-run by hand** after the fix — only the named tests above, each
  finishing in seconds. Port 3100 is free, no `next start` or `next build` of mine is running, and
  the build is fresh, so the Stop hook owns the full run.
- **Five pre-existing e2e failures are still red** (listed above). They predate this session and
  are not fixed here; worth their own triage.
- No e2e spec was added for either fix. Both are covered by mutation-tested unit tests and live
  verification; an e2e test written here could not be mutation-tested without a full-suite run,
  and an unverified guard is the thing `AGENTS.md` warns about.
