# NEXT-SESSION.md — start here (written 2026-08-06)

**Read this file, then `CLAUDE.md`'s "In flight" block. Nothing else, until you have picked a
task below.** This exists so the next session does not spend its budget re-deriving what this one
already measured. Every number here was measured, not estimated; where something was not
measured, it says so.

---

## 0. Two things to do before your first edit

1. **Start the session from `web-app/`, not the repo root.** The four review subagents
   (`a11y-checker`, `design-reviewer`, `code-reviewer`, `component-architect`) and
   `/design-review` are discovered from the session's own project root. A root session cannot see
   them, so it cannot satisfy gates G3-c / G5-e / G7. The 2026-08-06 session ran from the root and
   had to hand-roll its verification.
2. **`npm ci` first.** `node_modules/` is not in the container image; `tsc` fails with 200 lines
   of "cannot find module @playwright/test" and it looks like a code problem. It is not.

Playwright browser: `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run e2e`
(do **not** run `npx playwright install`).

---

## 1. Where the project actually stands

|                                |                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Phase 3 migration              | **DONE, 16/16 routes.**                                                                                                     |
| Seven post-merge DP mismatches | **FIXED** — `PHASE-3-ACCEPTANCE.md` §8 has the table and the root causes.                                                   |
| Gates                          | typecheck / lint / vitest 84 / build / `e2e` 164 / `e2e:visual` 115 / G4-b / G4-g / designer-css — **all green**.           |
| RD contract C1–C8              | Frozen and documented. One additive C4 change on 2026-08-06 (`setResultUrl`, `setSongResult`), logged in `CHANGELOG-RD.md`. |
| Dead code                      | **None.** Six orphaned components deleted 2026-08-06.                                                                       |

### The scope rule now in force (product owner, 2026-08-06)

> **This phase's deliverable is "the code architecture is sound enough for RD to wire the
> backend".** A finding that is _purely UI_ and touches neither the contract, nor the providers,
> nor a product rule is **deliberately left unfixed** until the designer ships the next DP drop.

That rule is why most of `TODO.md` #7 and nearly all of `DESIGNER-TODO.md` are open. **They are
not slipped work.** Do not "helpfully" fix them.

**One consequence to state plainly, because it is the uncomfortable one:** all of `TODO.md` 7a is
deferred, including the keyboard-seek half. Four playback seek bars (`/song/result`,
`/mv/result`, `/mv/edit`, `/song/play`) are bare `<div onPointerDown>` — pointer-only, WCAG 2.1.1
Serious — and on `/mv/result` that is a regression against the pre-migration `<video controls>`.
This was offered as a separable, pixel-neutral fix and deferred anyway. It is a known, accepted
gap, not an oversight.

---

## 2. The DP re-sync — measured 2026-08-06, so you do not have to

Upstream is **`2670ed2`, 2026-08-06 17:24 +0800**, "Widen SongPlayBar title space, cap progress bar
width, and re-center row". Vendored is `568e64c` (2026-08-04). Measured with a read-only clone;
`designer-prototype/` was **not** touched.

### The three answers that decide how big this slice is

| Question                       | Measured answer                                              | What it means                                                                                            |
| ------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Did `tokens.css` move?         | **NO — byte-identical.** `src/styles/` is unchanged in full. | **The biggest risk is not there.** No all-route colour/spacing re-check, no `npm run token-map` fallout. |
| Any icons added or removed?    | **NO — `src/assets/icons/` is identical.**                   | So the drop does **not** unblock 7a's ±15s glyph. Ask the designer for it explicitly.                    |
| Do the gated stylesheets move? | **13 of 33 changed.**                                        | This is the work. See the table below.                                                                   |

### The 13 gated stylesheets that moved, by size of change

| Stylesheet            | Changed lines | Routes it dresses                      |
| --------------------- | ------------: | -------------------------------------- |
| `SongDetailPage.css`  |       **510** | `/explore/songs`, `/song/play`         |
| `MVDetailPage.css`    |       **277** | `/explore/mvs`, `/watch`               |
| `AppLayout.css`       |            59 | every route (shell)                    |
| `DetailNavbar.css`    |            59 | every detail route                     |
| `RoomNavbar.css`      |            54 | `/history`, `/mv/room`, `/song/create` |
| `ListItem.css`        |            51 | both create-screen rails               |
| `SongCreatePage.css`  |            28 | all three `/song/*` stages             |
| `Tabs.css`            |            19 | `/history`, `/song/create`, `/creator` |
| `SectionHeader.css`   |            12 | `/explore/mvs`                         |
| `CreditsPage.css`     |             5 | the three IAP modals                   |
| `LyricsSheet.css`     |             2 | `/song/play`, `/song/result`           |
| `TopSongListItem.css` |             2 | `/explore/songs`                       |
| `MobileTabBar.css`    |             1 | every route below 768px                |

`check-designer-css.mjs` (G2-b) gates all 33 as byte-identical, so **each of those 13 fails the
gate until it is re-copied**, and re-copying is what forces the six-width re-check.

### The landing page itself

DP's HomePage was reworked and **the new sections are live on desktop**, not experimental:

- New files: `HeroBannerSectionV3.tsx/.css` (160 + 191 lines), `ToolSelectorSectionV3.tsx/.css`
  (52 + 198 lines).
- `HomePage.tsx` renders **mobile → the old `HeroBannerSection` + `ToolSelectorSection`;
  desktop → the V3 pair.** Both sets ship.
- Also changed: `NewSongsSection.tsx` (155 lines), `HeroBannerSection.tsx` (64),
  `TopPicksSection.css` (39), `HomePage.tsx` (33).
- Removed upstream: `HomePageReviewB`, `ToolSelectorSectionAlt` (and the `/home-review-b` route).

**WA's `/` is `HomeView.tsx` and has never been migrated** — it is still the original Tailwind
screen. So the landing page is not a re-sync of migrated markup; it is **a 17th route migration**,
on top of re-syncing 13 stylesheets. Budget it as its own slice, and expect new visual baselines
for `/`.

### Also new upstream, and not yet assessed

- `src/components/SongPlayBar/` (147 tsx + 261 css) and `src/hooks/useSongPlayer.ts` (146) — a
  persistent play bar WA has no equivalent of. **Nobody has decided whether it is in scope.**
- `ComponentsPage/TabsShowcase.tsx` — DP's own showcase, not product.

### How to do the re-sync when you start it

`docs/redesign-migration-plan.md` §7 is the procedure. In short: clone upstream, replace
`designer-prototype/` using **`PROVENANCE.md`'s exclusion list** (`.git/`, `src/assets/covers/`,
`storyboard-clips/`, `hero/` — 295 MB of demo media that is deliberately not vendored), update
`PROVENANCE.md`'s commit row, `npm run token-map`, then `git diff --stat designer-prototype/`.
Then the §12 five steps: classify each change (visual / flow / new screen) → map flow changes onto
`specs/areas/*.md` → decide "new flow" vs "was not finished" → update docs → if C1–C8 moved,
`CHANGELOG-RD.md` + tell RD.

---

## 3. Recommended order, and why it is this order

| #     | Work                                                                  | Why here                                                                                                                                                                                                                                                                                                                           | Blocked on |
| ----- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **1** | **DP re-sync + landing page**                                         | Must precede any a11y run: 13 stylesheets and a whole new route change what there is to measure. Doing a11y first throws the result away — which has already happened once to this project (`PHASE-3-ACCEPTANCE` §6).                                                                                                              | —          |
| **2** | **The deferred UI backlog** (`TODO.md` 7a–7h, `DESIGNER-TODO` A1–A18) | The drop is the moment those get answers. Re-put 7a's ±15s icon and A1/A9/A13's contrast in front of the designer _with_ the drop.                                                                                                                                                                                                 | designer   |
| **3** | **a11y A1–A5, re-run**                                                | `PHASE-3-ACCEPTANCE` §7.1. The one verification that ran and was **thrown away**. Also widen `a11y.spec.ts` to a mobile viewport (`TODO.md` #6) — but sequence it: that turns A9's 3.74:1 into an immediate gate failure, so either A9's colour lands first or the mobile pass ships with A9 excluded and a comment.               | #1, #2     |
| **4** | **Community spec + API contract** (`TODO.md` #1)                      | **The actual RD blocker.** `MuseApi` has no community endpoints at all, so half the product has nothing for RD to implement. Source is now `ycmuse-app-skill/YouCam_Muse_Explore_Curation_PRD  -  V2.pdf` (repo root, one level up). **It has not been read** — page 03's homepage UI is superseded by DP, everything else stands. | product    |
| **5** | **RD hand-off doc consolidation**                                     | Fold README / DEVELOPER-HANDOVER / PHASE-3-ACCEPTANCE §7 / TODO / DESIGNER-TODO into one RD entry point. Cheap, and best done last so it describes the finished state.                                                                                                                                                             | #1–#4      |

---

## 4. Things this project has already paid for. Do not re-learn them.

Full versions are in `AGENTS.md` and `CLAUDE.md`; this is the index.

- **A broken environment reports findings, not errors.** An a11y audit ran two full sweeps
  against a page whose 238 KB designer stylesheet was returning 500, and produced a long,
  confident, entirely wrong report. **Before trusting any browser measurement, fetch the page and
  confirm every `_next/static/chunks/*.css` is 200 with a real body — one is ~238 KB.** Never run
  `npm run build` against a running `next start`.
- **The visual gate has three structural blind spots**, all measured: `fullPage` captures at
  scroll 0 (nothing is ever behind a sticky navbar); `maxDiffPixelRatio` is a share of _page
  area_, so a fixed-size control can vanish on wide viewports without failing; and it cold-`goto`s
  each route with no flow state, so the `/mv/result` and `/song/result` baselines are actually
  pictures of `/mv/room` and `/song/create`. **115/115 green is not evidence about any of those.**
- **Mutation-test every new guard in both directions.** Break the thing, watch it go red; restore,
  watch it go green. A CSSOM-reading test once passed in both states.
- **A mask icon fails silently in two different ways.** Decide the tag from DP's CSS, not habit:
  `width/height` only ⇒ real `<img>`; `background: currentColor` + `mask-*` ⇒ `DpIcon`; an element
  selector ⇒ `DpIcon as="i"`. Add every newly migrated route to the mask sweep in
  `e2e/behaviour-regressions.spec.ts`.
- **A scope decision that changes what the user sees is a product decision — ask, don't encode
  it.** Four of the seven mismatches reported on 2026-08-06 came from slices that recorded a
  defensible decision in a code comment or, worse, in a passing test. `e2e` literally asserted
  "clicking a card still opens the dialog, not a navigation" for two weeks after that stopped
  being what anyone wanted.
- **Run `npm run e2e` on a quiet machine.** A gate that fails under load is not evidence of a bug.

### Verification, and what it should cost

Split it, and do not use the same tool for both halves:

- **Running gates and collecting evidence** — mechanical, checklist-driven. A Sonnet 5 (high
  effort) subagent is fine and saves the parent context the tool output. **Serially, never in
  parallel** (concurrent browsers flake the long specs), and its step 0 is proving the CSS loads.
- **Writing an acceptance verdict (G5-b / G7)** — keep on a strong model, in an independent
  context, per plan §10.7. This project's real failures are not "not enough checks were run", they
  are "the green light meant nothing" — and those were all caught by noticing a contradiction.

---

## 5. What changed on 2026-08-06, in one list

Two commits on `claude/phase-3-acceptance-fixes-isr2yl`:

1. **The seven DP mismatches** — `/history` rows open the result screens; both result screens get
   Back; the create-screen rails get DP's two modes; `/explore/mvs` navigates instead of opening a
   dialog. New shared hook `src/components/history/useOpenCreation.ts`. Additive C4 change. 13 new
   e2e guards, one mutation-tested. Full table: `PHASE-3-ACCEPTANCE.md` §8.
2. **This one** — the three `Idea`/`Ideas` buttons removed (V1 has no canned-sample fillers; a
   deliberate subtraction _from_ DP, so **it will come back on every drop and must be re-removed**),
   six dead components deleted, `community-strategy-proposal.html` deleted in favour of the PRD,
   and the 7a / 7e / 7f / 7g decisions recorded.

Open decisions still sitting with people, not with code: the designer owes A1/A9/A13 (contrast),
A5 (phone back), 7a's ±15s icon + five-slot transport, 7b, 7c, 7d, 7h; the product owner owes the
community scope and whether DP's new `SongPlayBar` is in.
