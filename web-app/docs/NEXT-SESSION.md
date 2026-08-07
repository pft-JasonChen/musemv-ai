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
| DP drop 2 (`2670ed2`) re-sync  | **DONE 2026-08-07.** Both blocked stylesheets resolved — see §2.0. Landing page still outstanding.                          |
| Gates                          | typecheck / lint / vitest 84 / build / `e2e` **170** / `e2e:visual` 115 / G4-b / G4-g / designer-css **34/34** — all green. |
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

## 2. The DP re-sync — ✅ **UNBLOCKED AND LANDED (2026-08-07).** §2.0 is kept as the record.

### 2.0 The blocker, and how it was resolved

Two of the 13 gated stylesheets assumed DOM that WA did not have, so re-copying them verbatim —
which gate G2-b demands — deleted working screens. Neither the file-level diff,
`check-designer-css.mjs`, typecheck, lint, vitest, build nor `guard-greps.sh` saw it: **six green
gates and two deleted screens.** It was found by `e2e`.

| Stylesheet           | What the drop did                                                         | Decision (product owner, 2026-08-07)                              |
| -------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `MVDetailPage.css`   | Hid every `.mv-detail__grid-section` below 768px, expecting a mobile grid | **Port DP's `.mv-detail__mobile-grid`** — two-column masonry      |
| `SongDetailPage.css` | Deleted the entire `.now-playing__*` block — 54 rules down to 2           | **Adopt DP fully** — desktop navigates to the result-stage player |

**Both are done. `e2e` is 170/170, `e2e:visual` 115/115, and all six other gates are green.**

#### What "adopt DP fully" actually cost, now that it has been paid

Less than §2.0 originally priced it, and for one specific reason: **the seeding pattern already
existed.** The fear was that adopting DP's routing meant "turning `/song/result` into a shared
player resolving creation results, history items AND community songs". But `/history` rows already
open `/song/result` by writing flow state before navigating (`useOpenCreation.ts`), because the
result screens read SongFlow and self-guard when it is empty. A community song is the same shape:
seed on click, plus a cold-resolve branch so a community `?id=` deep link works with no flow state
at all. That branch is ~8 lines, not a rewrite.

What DID have to move, exactly as predicted: `AC-EXP-03` and its e2e assertion, together. 3b had
pinned "a desktop row click does not navigate" in a passing test one day before the drop reversed
it — the error log's _"a test can hold a decision in place after the decision is wrong"_, arriving
on schedule. The assertion was rewritten to the new decision, not argued with.

#### The correction that had to be made first, and why it matters more than the fix

An earlier pass concluded from the CSS diff — `.now-playing__*` gone, a new `.song-bar` file —
that `SongPlayBar` had **replaced** the player, and that adopting it would delete four of
`AC-EXP-05`'s five requirements. **That was wrong, and the product owner caught it by running the
prototype.** `SongPlayBar` is a desktop _preview_ bar started from a row's album-art icon; it
replaces nothing. Drop 2 split the row's two affordances instead:

| surface                | drop 2                                               |
| ---------------------- | ---------------------------------------------------- |
| desktop, row **title** | navigates to the result-stage player                 |
| desktop, row **art**   | starts `SongPlayBar` in place, so browsing continues |
| phone                  | `MobileNowPlaying` + `LyricsSheet`, **unchanged**    |

So `AC-EXP-05` lost nothing — its disc player, Like, Lyrics and Create CTA all still exist, on
`/song/result` for desktop and in the full-screen player on phones. **Reading a CSS diff and
reasoning about the product is not measurement.** Same shape as the poisoned-environment a11y
audit: a cheap measurement that agreed with a wrong answer.

#### The two product decisions taken on the way, and what they cost

Neither was in the original three-options framing; both surfaced while reading DP's markup, and
both change what the user sees — so both were asked rather than encoded.

1. **`/explore/mvs` on phones shows Top Picks only.** DP hides every non-`--primary` section.
   Lossless for DP (its second section is its first reversed), **not** for WA. Decision: follow DP.
   ⚠️ **Measured after the decision: `TRENDING_MVS` is 3 items and `NEW_MVS` is 11, so a phone
   reaches 3 of 14.** The decision was taken on "a secondary catalog is hidden"; the ratio makes it
   heavier than that sounded. Recorded as `DESIGNER-TODO` **A19** and asserted in `e2e` so nobody
   "fixes" it by accident. If it is not acceptable, the answer is a designer mobile two-section
   design, not an override.
2. **A community song on `/song/result` gets no Recreate and no Publish.** DP varies nothing but
   the bottom rail here ("Newly Released Songs" instead of "My Creations"), and following it
   exactly would have offered a paid `COST_SONG_RECREATE` re-roll of a stranger's track into the
   user's own History, plus a publish toggle on something they do not own. Download and "Use in
   Music Video" deliberately stay.

#### Still not adopted from this drop

`RoomNavbar`'s `mobileBackHref`; DP's page-specific `.mv-detail__mobile-header` /
`.mv-player__mobile-header` (which is why `/watch` keeps `DetailNavbar`'s bar rather than passing
`hideMobileBar`). Both are `TODO.md` **7i** — unused affordances, not regressions.

#### And the warning about how this was measured, kept because it is the record

The first full `e2e` reported **26** failures. Re-run alone on a quiet machine it reported **7**.
The 19 that evaporated were the Stop hook firing a second concurrent `e2e` against the same port
and build — the documented poisoning, third occurrence. The 2026-08-07 session then measured
**3**, not 7: four of the seven were the A5 selector change that the previous session had fixed
but never verified. **Before believing any red list: one run, one machine, and prove the 238 KB
stylesheet is 200 first.**

### 2.1 The measurements — all verified, all held

> **Status: the drop is vendored, the 13 stylesheets are re-copied, and the two screens they
> broke are fixed (2026-08-07 — see §2.0).**
> `PROVENANCE.md` now names `2670ed2`; `check-designer-css.mjs` is back to 34/34 verbatim
> (`SongPlayBar.css` joined the gated set, and is now consumed rather than inert).
> Every number in this section was re-verified against the real upstream clone before acting on
> it, and every one was right: `src/styles/` byte-identical, `src/assets/icons/` byte-identical,
> exactly 13 of 33 gated stylesheets changed and 0 removed, upstream HEAD still `2670ed2`.
> `npm run token-map` moved one line — the generated date — which is the same fact from a
> second direction.
>
> **What the re-sync turned out to change, beyond CSS bytes:**
>
> - **A5 is answered upstream** (see `DESIGNER-TODO.md` A5, now closed). `AppLayout.css` stopped
>   hiding `.detail-navbar` on phones and `DetailNavbar.css` grew a 50px compact back+title bar;
>   `RoomNavbar` got the same via a `mobileBackHref` opt-in. WA's own Tailwind workaround
>   (`phoneBack`) is deleted and the three A5 e2e assertions were left untouched on purpose —
>   they assert a usable back control at 375, not which element provides it, so they carried
>   straight over to DP's implementation.
> - **Half of the A4 override had to go, and NOT noticing would have shipped an empty navbar.**
>   The override hid `.detail-navbar__top` — which is exactly where the designer had just put the
>   back control — while the same drop deliberately hides `.detail-navbar__tabs` on mobile. Both
>   halves cancelling: `/explore/songs` measured 375×50 at 375px with neither tabs nor a way back.
>   No gate would have said a word. The `.room-navbar` half stays; DP's own comment confirms
>   History is still hidden on phones, so HIST-03's filters still depend on it.
> - **Product owner decided 2026-08-06: follow DP on the mobile tabs.** `/explore/songs` and
>   `/song/play` lose their tab pills on phones. The cost is recorded in the override's header
>   rather than hidden: WA's three tabs are three different catalogs, so a phone user now sees
>   only the default one.
>
> **Still not adopted from this drop** (nothing is lost by the delay, but they are real gaps):
> `RoomNavbar`'s `mobileBackHref`; DP's page-specific `.mv-detail__mobile-header` /
> `.mv-player__mobile-header`, which is why `/watch` keeps `DetailNavbar`'s bar instead of
> passing `hideMobileBar` the way DP does.
>
> **Untouched by the drop, so still open:** A6, A7, A8 (`TopSongListItem.css` still has zero
> media queries — the only change was `flex-wrap: wrap` → `nowrap`), A9 (`.mobile-tabbar__label`
> still `opacity: 0.4`), A13, A15 (`/ week` still hardcoded on all three plan cards), A16, A17,
> A18. Do not re-check these against the drop; it was done.

### The original measurement, kept because it is the record

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
| **1** | ~~DP re-sync~~ **DONE**; **the landing page remains** | The re-sync landed 2026-08-07 (see §2.0) — both blocked stylesheets resolved, `e2e` 170/170. What is left of this row is the landing page, which is a **17th route migration**, not a re-sync: WA's `/` is still the original Tailwind `HomeView.tsx`. It still must precede the a11y run — a whole new route changes what there is to measure, and doing a11y first throws the result away, which has already happened once (`PHASE-3-ACCEPTANCE` §6). `SongPlayBar` is now ported and consumed, so `NewSongsSection` has its bar waiting. | — |
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
