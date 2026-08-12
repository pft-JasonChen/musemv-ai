# NEXT-SESSION.md — start here (updated 2026-08-12)

**Read this file, then `CLAUDE.md`'s "In flight" block. Nothing else, until you have picked a
task below.** Every number here was measured, not estimated; where something was not measured, it
says so.

**§2 — the landing page — is DONE.** It was the last unmigrated route, so **the designer-UI
migration is complete: 17 of 17.** What is left is verification and backlog, not porting.

> ## 🚦 2026-08-12 — can this go to RD?
>
> **The generation half yes; the community half no.** `MuseApi` has 6 endpoints, all MV/Song
> generation, and **zero** community endpoints — while **17 components across 9 routes** run on the
> hardcoded seeds in `lib/mv/community.ts`. That missing contract is `TBD-EXP-11`, and it is not a
> "small UI issue": it is a section of the spec that has never been written. The second blocker is
> `TBD-CC-06` (the credit payload). **`specs/OPEN-QUESTIONS.md` now opens with a
> handover-readiness section listing all five things to fill — read that before promising a date.**
>
> ### What changed on 2026-08-12, so you do not re-derive it
>
> - **Both create screens are now open to guests.** `/mv/room` (since 08-07) and `/song/create`
>   (new) render for a logged-out user; the gate moved to **Song Library** / **Create Music Video**
>   / **Create Song**. `Sidebar`'s `GATED` set and `MobileTabBar`'s create sheet stopped gating
>   navigation. `AuthGuard` now wraps **four** routes: `/history`, `/profile`, `/profile/credits`,
>   `/settings`. Specs 01/02/03/09 updated (AC-AUTH-08, AC-MV-01b, AC-SONG-01b).
> - **Credits Detail is a route** — `/profile/credits`, since 08-11. `CreditsDetailModal` is gone.
> - **CR-06 was reversed by a design drop and reinstated by the product owner.** Credit packs are
>   subscriber-only; a free user only ever sees Upgrade. A designer drop cannot overturn a Business
>   Model rule — that is the lesson, and `DESIGNER-TODO` **A21** asks for the free-user comp DP has
>   never drawn.
> - **`TODO.md` #5 is CLOSED** — see §1 below; there were **five** seek bars, not four.
> - **A spec↔code audit ran across all 11 areas.** 02/09 had factually wrong statements (the
>   guarded-route set, a 1.5s-vs-1800ms animation); 05/10 were clean; 01/06/07 were corrected. The
>   `specs/index.html` reader had also been stale for a rewrite. All fixed.
>
> ### For the designer specifically
>
> Nothing in `DESIGNER-TODO.md` was silently resolved. It gained **A21** (Credits Detail has no
> free-user CTA comp) and everything else A1–A20 is untouched and still owed. §3 item 2 below is
> still the right next designer-facing task.

---

## 0. Three things to do before your first edit

1. **Start the session from `web-app/`, not the repo root.** The four review subagents
   (`a11y-checker`, `design-reviewer`, `code-reviewer`, `component-architect`) and
   `/design-review` are discovered from the session's own project root. A root session cannot see
   them, so it cannot satisfy gates G3-c / G5-e / G7. The 2026-08-06 and both 2026-08-07 sessions
   all ran from the root and had to hand-roll their verification.
2. **`npm ci` first.** `node_modules/` is not in the container image; `tsc` fails with 200 lines
   of "cannot find module @playwright/test" and it looks like a code problem. It is not.
3. **`designer-prototype/src/assets/hero/` is now VENDORED and every future drop must re-copy it,
   into two places.** See §2.1 — miss it and DP's home page goes white with no error.

Playwright browser: `CHROMIUM_PATH=$(find /opt/pw-browsers -name chrome -type f | head -1) npm run e2e`
(do **not** run `npx playwright install`).

---

## 1. Where the project actually stands

|                               |                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Designer-UI migration         | **DONE, 17/17 routes.** The landing page landed 2026-08-07 and was the last one.                                            |
| DP drop 2 (`2670ed2`) re-sync | **DONE 2026-08-07.** Appendix A is the record.                                                                              |
| Gates                         | typecheck / lint / vitest **84** / build / `e2e` (Stop hook owns the run — see below) / `e2e:visual` 115 / designer-css **42/42** / guard-greps — all green. |
| RD contract C1–C8             | Frozen. Additive C4 on 2026-08-06; **additive C8 on 2026-08-12** (`COST_REGEN` / `COST_COVER` moved in from `MvEditor.tsx` and frozen in the snapshot). Both in `CHANGELOG-RD.md`. |
| Dead code                     | **None.** Six orphaned components deleted 2026-08-06; five now-unused `community/ui` exports deleted with the landing page. |

### The scope rule still in force (product owner, 2026-08-06)

> **This phase's deliverable is "the code architecture is sound enough for RD to wire the
> backend".** A finding that is _purely UI_ and touches neither the contract, nor the providers,
> nor a product rule is **deliberately left unfixed** until the designer ships the next DP drop.

That rule is why most of `TODO.md` #7 and nearly all of `DESIGNER-TODO.md` are open. **They are
not slipped work.** Do not "helpfully" fix them.

**That consequence USED to be the seek bars. It is not any more — `TODO.md` #5 closed 2026-08-12.**
All of them now render through `ui/SeekBar` (role=slider, tabIndex, aria-valuenow, arrow / page /
Home-End keys), markup and class names unchanged so it is pixel-neutral. **There were FIVE, not the
four every list said:** `/song/result`, `/mv/result`, `/mv/edit`, `/song/play` **and `SongPlayBar`**
— the last arrived with the drop-2 re-sync on 2026-08-07, *after* those lists were written, carrying
the same defect. It was found by grepping for the defect rather than working from the list, which is
the transferable part. Guarded by `e2e`'s "TODO#5: every ported seek bar is a keyboard-operable
slider", mutation-tested both ways.

**The rest of 7a — the ±15s glyph and the five-slot transport — is still deferred and still blocked
on designer artwork.** The scope rule above still applies to everything else.

---

## 2. THE LANDING PAGE — DONE 2026-08-07. Kept as the record.

**Nothing in this section is outstanding work.** Read it if you need to know why something on `/`
is the way it is, or before the next drop touches `HomePage/`.

WA's `/` was `src/components/home/HomeView.tsx`, 181 lines of Tailwind, and had never been
migrated. So this was not a re-sync of migrated markup; it was a fresh screen migration, and it
got its own slice, its own six-width check and new visual baselines.

### 2.0 What was ported

DP's `src/pages/HomePage/` — **8 components, ~996 lines of tsx and ~1426 lines of CSS**. None of
its 8 stylesheets were vendored; the gated set went **34 → 42**, and `npm run designer:check`
passes at 42/42 verbatim.

| DP file                 | WA file                          | Notes                                                     |
| ----------------------- | -------------------------------- | --------------------------------------------------------- |
| `HomePage`              | `home/HomeView.tsx`              | the `isPhone` branch that picks which pair renders        |
| `HeroBannerSection`     | `home/HeroBannerSection.tsx`     | phone hero (+ the desktop `.hero-banner` DP keeps in it)  |
| `HeroBannerSectionV3`   | `home/HeroBannerSectionV3.tsx`   | desktop hero, a scroll-snap filmstrip                     |
| `ToolSelectorSection`   | `home/ToolSelectorSection.tsx`   | phone tool tiles                                          |
| `ToolSelectorSectionV3` | `home/ToolSelectorSectionV3.tsx` | desktop tool cards                                        |
| `NewMVsSection`         | `home/NewMVsSection.tsx`         | ← `NEW_MVS`                                               |
| `TopPicksSection`       | `home/TopPicksSection.tsx`       | ← `TOP_PICKS_SONGS`, real audio preview                   |
| `NewSongsSection`       | `home/NewSongsSection.tsx`       | ← `NEW_SONGS.slice(0,6)`, **consumes `SongPlayBar`**      |
| —                       | `home/heroItems.ts`              | DP's `HERO_ITEMS`, re-expressed as `public/` path strings |

`ui/ListItem.tsx` also grew DP's **`community` variant** (username + plays/likes/shares + the
like/share/Create actions row); `NewSongsSection` is its first caller. The `song` variant's markup
was left byte-for-byte alone so `/mv/room`, `/song/create` and `/song/result` baselines did not
move — the component grew, it did not change.

### 2.1 ⛔ THE HERO ASSETS ARE VENDORED, AND EVERY DROP MUST RE-COPY THEM

`HeroBannerSection.tsx` imports **8 mp4s and 8 posters BY NAME**, and `HeroBannerSectionV3`
re-imports `HERO_ITEMS` from it — so "just do the desktop one" never escaped it. `PROVENANCE.md`
used to exclude `src/assets/hero/` along with `covers/` and `storyboard-clips/`.

**Product owner decided 2026-08-07: vendor the 13 MB.** 13 MB is a different order of magnitude
from `covers/`'s 257 MB, and it is the only option that renders the hero as designed. What that
obliged, and what was done:

1. **`PROVENANCE.md`'s exclusion table is amended** — `src/assets/hero/` has its own section
   explaining why this one is vendored while the other two are not. The reason is not size alone:
   the other two are read through `import.meta.glob`, which yields `[]` instead of throwing, so a
   missing file costs missing media. `hero/` is name-imported, so ONE missing file takes DP's whole
   module graph down and **every** route renders white — that is `DESIGNER-TODO` A12, which four
   handoffs misread as "DP's `/mv-edit` page does not render".
2. **The re-sync procedure in `PROVENANCE.md` now copies it into BOTH places** —
   `designer-prototype/src/assets/hero/` (so DP runs) and `web-app/public/assets/hero/` (so WA
   serves it). Miss either and something goes silently blank. There is a sparse-checkout recipe
   there if the full clone is too big.
3. **WA references by path string, not `?url`.** Next serves `public/`; DP's Vite import has no
   equivalent. `home/heroItems.ts` owns that mapping.
4. **Four of the sixteen filenames contain a SPACE** (`hero_01_Vintage Car.png`). Vite hashed them
   away; Next does not. `encodeURIComponent` on the filename is what makes them load — verified
   both ways on 2026-08-07 (encoded → 200, raw space → the request never forms).

### 2.2 The four decisions, all taken and all applied

| #   | Decision                                    | How it landed                                                                                                                             |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Port BOTH hero/tool-selector treatments** | All four components ship; `HomeView` branches on `useMediaQuery(PHONE_QUERY)`. Not collapsed — each file re-syncs whole on the next drop. |
| 2   | **Follow DP: DELETE the Trending marquee**  | Gone, along with its `globals.css` keyframes and three class names. See §2.3.                                                             |
| 3   | **A19 stands: keep following DP**           | `/explore/mvs` on phones still shows 3 of 14 MVs. Untouched.                                                                              |
| 4   | **Vendor the 13 MB of hero assets**         | §2.1.                                                                                                                                     |

### 2.3 Decision 2's consequence — now ruled on

Deleting the marquee removed `TRENDING_MVS`'s only entry point on the home page, and DP's three
rails do not put it back (they map to `NEW_MVS`, `TOP_PICKS_SONGS` and `NEW_SONGS`). The previous
handoff flagged that nobody had ruled on it.

**The product owner ruled on it, in the same breath as the slice: "TRENDING_MVS 不用首頁 (Match
DP)".** So it is decided, not inherited. `TRENDING_MVS` (3 items) is reachable from
`/explore/mvs` alone, where it is the `--primary` section — which under A19 is also the only MV
catalog a phone can reach there. `DESIGNER-TODO` **A20** carries both halves of that picture,
because together they are heavier than either alone, and the designer question ("should home have
a Trending rail?") is still open.

Two things moved with the deletion, as the previous handoff required:

- `e2e`'s **"landing page: clicking a Trending MV lands on the same /watch screen"** was
  **re-pointed at `.new-mvs__item`**, not deleted — it guards a real rule (home and `/explore/mvs`
  must not drift into two behaviours) and that rule outlived the rail.
- The `addStyleTag` that froze the marquee animation went with the selector.

A new test, **"the Trending marquee is gone and stays gone"**, asserts the loss on purpose — same
technique A19 uses, so a future drop or a well-meaning fix cannot quietly restore WA's own rail.

### 2.4 What WA has that DP does not — all three kept

DP's HomePage has **no auth at all** (its `AuthProvider` was never ported), so every gate below
exists only in WA and every one is now covered by its own e2e:

- **`requireLogin` on both hero CTAs and both tool-selector cards** (`AC-EXP-02` / GL-02) —
  checked on BOTH branches, because they are two components with two handlers.
- **`requireLogin` on New Songs' `Create`**, plus the `patchSongCompose` seeding the
  pre-migration home already did.
- **`SectionHeader href` → "See all"** as a real `next/link` + `localePath()` (R-9), which Q6's
  back test navigates through.

### 2.5 Two things this slice learned that are not obvious

- **Playwright's Chromium has no H.264 decoder, so an mp4 is a black box in every screenshot.**
  `MediaError 4 DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, no throw, no console output, and
  `canPlayType` still says `"maybe"`. Two consequences, both now in `AGENTS.md`: a video region of
  a visual baseline proves nothing, and `poster` is worth adding to any `<video>` whose first frame
  is the design. That poster is the ONE attribute the two hero components add to DP's markup.
- **The 3f mask sweep runs at 1440 and physically cannot see this screen's phone half.**
  `HomeView` branches in JS, so `.tool-selector__icon` and the whole phone hero are simply not in
  the DOM at desktop width. A second sweep at 375 was added. Any future screen that JS-branches on
  a breakpoint has the same hole.

### 2.6 What DP has on this screen that WA still does not

Neither is a loss introduced by this slice, and neither is this slice's to add — but do not
mistake them for oversights:

- **The rotating colorflow background** (`AppLayout showBackground`) and **the marketing Footer**
  (`showFooter`). Both are SHELL, not page: CH3/CH4 put the marketing Navbar and Footer out of
  scope, and `AppShell` has never rendered `.app-layout__background` on any route.
- **The AI Storybooks card** in the desktop tool selector. DP's stylesheet still carries its
  `--story` rules and its tsx still carries the commented-out card; the product owner asked for it
  to stay hidden until the feature ships. Adding it later is markup, since the CSS is vendored
  whole.
- `/` is the one route NOT in `AppShell`'s `OWN_CHROME`, so it still gets the legacy `TopBar`.
  That is deliberate and it is the same CH3/CH4 boundary — and note that `"/"` could not go in
  that list anyway: the check is `path.startsWith(r)`, which `"/"` matches for every route.

---

## 3. Everything still outstanding, in the order it should be done

| #     | Work                                                                  | Blocked on | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----- | --------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ~~1~~ | ~~**The landing page** (§2)~~                                         | —          | **DONE 2026-08-07.** §2 is the record. The migration is now 17/17.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **2** | **The deferred UI backlog** — `TODO.md` 7a–7h, `DESIGNER-TODO` A1–A20 | designer   | The next drop is when these get answers. Put 7a's ±15s glyph and A1/A9/A13's contrast in front of the designer **with** the drop, plus the three new ones this week added (A19, **A20**, and 7j's record).                                                                                                                                                                                                                                                                                                                                                         |
| **3** | **a11y A1–A5, re-run**                                                | #2         | `PHASE-3-ACCEPTANCE` §7.1. **The one verification that ran and was thrown away**, and now the whole app is migrated it is the biggest single hole. Also widen `a11y.spec.ts` to a mobile viewport (`TODO.md` #6) — but sequence it: that turns A9's 3.74:1 into an immediate gate failure, so either A9's colour lands first or the mobile pass ships with A9 excluded and a comment. **`/` is newly in scope for it and is the only route with a JS-branched layout**, so it needs auditing at BOTH a phone and a desktop width — one sweep sees half the screen. |
| **3.5** | **Credit payload contract** (`TBD-CC-06`)                          | RD         | **New handover blocker, 2026-08-12.** The cloud config flipped `consumedType` to `"credit"` on all 23 actions and the product owner confirmed the **frontend** must now send the quantity/seconds (it was derived backend-side before). Field name, unit, and how a delegating action's quantity maps to its sub-actions are all undefined, so the deduction call cannot be written. `specs/areas/11` §「數量由誰提供」 has the reversal written up. |
| **4** | **Community spec + API contract** (`TODO.md` #1 / `TBD-EXP-11`) | product | **The #1 handover blocker.** `MuseApi` has **zero** community endpoints while **17 components across 9 routes** run on the hardcoded seeds in `lib/mv/community.ts`. The Zod schemas (`CommunityMv` / `CommunitySong` / `CommunityCreator`) exist; nothing consumes them. Source: `ycmuse-app-skill/YouCam_Muse_Explore_Curation_PRD  -  V2.pdf` at the REPO ROOT — **still not read**; page 03's homepage UI is superseded by DP, everything else stands. Read it properly when its phase starts; do not skim and summarise. |
| **5** | **RD hand-off doc consolidation**                                     | #2–#4      | Fold README / DEVELOPER-HANDOVER / PHASE-3-ACCEPTANCE §7 / TODO / DESIGNER-TODO into one RD entry point. Best done last so it describes the finished state.                                                                                                                                                                                                                                                                                                                                                                                                        |

### Open items by owner, so nobody re-derives who is waiting on what

**The designer owes:** A1 / A9 / A13 (contrast); 7a's ±15s icon **and** a five-slot transport
(neither DP's 90 icons nor WA's contain a ±15s glyph, and drop 2 added no icons at all — this is
blocked on artwork, not effort); 7b (Face Picker Cancel); 7c ("Change song" affordance); 7d
(`/song/result`'s phone volume); 7h (`/mv/room`'s disabled-CTA hint class); A16; A17; A18;
**A19** — a phone-friendly two-section design for `/explore/mvs`; **A20** — whether home
deserves a Trending rail now that the marquee is gone, which would be a block DP has not drawn;
**A21 (new 2026-08-12)** — Credits Detail's **free-user CTA**: DP has no auth concept, so its
`CreditsPage` has one unconditional "Buy More" and the free-user state was never drawn. WA falls
back to its own "Get Muse Pro" copy. Also confirm whether the `PrimaryPayg` variant is right when
the button leads to Subscribe rather than a purchase;
and a mobile tabs design for `/explore/songs` if the three-catalog loss turns out to matter.

**The product owner owes:** the community scope (#4 above); and whether to delete
`token-aliases.css`'s **85 dead names** (of 110, only 25 are consumed — a design-system change
under the ASK FIRST rule, so it must be proposed, not done as a side quest).

**Already answered, do not re-ask:** **CR-06 stands — credit packs are subscriber-only, a free user
only ever sees Upgrade** (product owner, 2026-08-12, after a design drop reversed it); **both create
screens are open to guests with action-level gates** (2026-08-12); `SongPlayBar` is **in** and is ported (2026-08-07); the
landing page's four decisions incl. **`TRENDING_MVS` is not wanted on home, match DP** (§2.3);
7g (rails show both by state); 7e (six dead components deleted); A5 (closed by drop 2); S2's 30s
floor; S20's prices.

### Known gaps that are accepted, not forgotten

- ~~**Four seek bars are pointer-only**~~ ✅ **CLOSED 2026-08-12 — and there were five.** All of
  `/song/result`, `/mv/result`, `/mv/edit`, `/song/play` and **`SongPlayBar`** now use
  `ui/SeekBar`. The fifth was on no list because it landed with drop 2 after the lists were
  written. Lesson worth keeping: **when a list of defect sites is more than a few days old, grep
  for the defect instead of trusting the list.**
- **`e2e/a11y.spec.ts` has three blind spots**: no auth seeding (the **four** guarded routes —
  `/history`, `/profile`, `/profile/credits`, `/settings` — show only the sign-in modal to axe;
  note `/song/create` LEFT that set on 2026-08-12 and is now genuinely scanned), desktop viewport
  only, unprefixed English routes only. The second one now
  costs more than it used to: `/` mounts a **different hero and tool selector** below 768px, so a
  desktop-only sweep does not merely miss the mobile chrome, it misses half of one route's content.
- **`/explore/songs` phones show one of three catalogs**; **`/explore/mvs` phones show 3 of 14
  MVs** (A19); **`TRENDING_MVS` has no home entry point** (A20). All three are asserted in `e2e`
  as deliberate.
- **A visual baseline can say nothing about a video.** Playwright's Chromium has no H.264 decoder,
  so every mp4 region is a stable black rectangle — the hero, `/watch`'s stage, `/mv/result`'s
  player. `poster` mitigates it where the poster is the design; it does not fix the gate.

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
- **Do NOT run `npm run e2e` yourself in an agent session — the Stop hook already does.** A full
  run takes ~14 min but the Bash tool caps at 10, so the call is ALWAYS backgrounded and its
  `next start -p 3100` is ALWAYS still holding the port when the hook fires its own run, which
  then dies on "port already used". That is **five** occurrences now (two on 2026-08-12 alone,
  after §A.1's first three). Leave the port free and a fresh build; use `--grep` on one spec file
  when you need a targeted answer. Rule is in `AGENTS.md`.
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

---

## Appendix A — the DP drop 2 re-sync, kept as the record

**Status: DONE 2026-08-07.** Read this only if you need to know why something is the way it is;
nothing here is outstanding work.

### A.1 The blocker, and how it was resolved

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

### A.2 The measurements — all verified, all held

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

### A.3 The original measurement, kept because it is the record

Upstream is **`2670ed2`, 2026-08-06 17:24 +0800**, "Widen SongPlayBar title space, cap progress bar
width, and re-center row". Vendored is `568e64c` (2026-08-04). Measured with a read-only clone;
`designer-prototype/` was **not** touched.

### A.4 The three answers that decided how big the re-sync was

| Question                       | Measured answer                                              | What it means                                                                                            |
| ------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Did `tokens.css` move?         | **NO — byte-identical.** `src/styles/` is unchanged in full. | **The biggest risk is not there.** No all-route colour/spacing re-check, no `npm run token-map` fallout. |
| Any icons added or removed?    | **NO — `src/assets/icons/` is identical.**                   | So the drop does **not** unblock 7a's ±15s glyph. Ask the designer for it explicitly.                    |
| Do the gated stylesheets move? | **13 of 33 changed.**                                        | This is the work. See the table below.                                                                   |

### A.5 The 13 gated stylesheets that moved, by size of change

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

### A.6 The landing page as drop 2 left it (superseded by §2 — kept for the upstream detail)

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

### A.7 Also new upstream

- ~~`src/components/SongPlayBar/`~~ — **DECIDED AND PORTED 2026-08-07.** It is in scope, it is
  `src/components/song/SongPlayBar.tsx`, and its stylesheet is gated. `useSongPlayer` was
  deliberately NOT ported (see the component header). `NewSongsSection` can consume it directly.
- `ComponentsPage/TabsShowcase.tsx` — DP's own showcase, not product.

### A.8 How to do a re-sync (the procedure, still current for drop 3)

`docs/redesign-migration-plan.md` §7 is the procedure. In short: clone upstream, replace
`designer-prototype/` using **`PROVENANCE.md`'s exclusion list** (`.git/`, `src/assets/covers/`,
`storyboard-clips/`, `hero/` — 295 MB of demo media that is deliberately not vendored), update
`PROVENANCE.md`'s commit row, `npm run token-map`, then `git diff --stat designer-prototype/`.
Then the §12 five steps: classify each change (visual / flow / new screen) → map flow changes onto
`specs/areas/*.md` → decide "new flow" vs "was not finished" → update docs → if C1–C8 moved,
`CHANGELOG-RD.md` + tell RD.

---
