# NEXT-SESSION.md — start here (rewritten 2026-08-07)

**Read this file, then `CLAUDE.md`'s "In flight" block. Nothing else, until you have picked a
task below.** Every number here was measured, not estimated; where something was not measured, it
says so. **The next slice is §2, the landing page, and its four product decisions are already
taken — you can start writing code after §0.**

---

## 0. Three things to do before your first edit

1. **Start the session from `web-app/`, not the repo root.** The four review subagents
   (`a11y-checker`, `design-reviewer`, `code-reviewer`, `component-architect`) and
   `/design-review` are discovered from the session's own project root. A root session cannot see
   them, so it cannot satisfy gates G3-c / G5-e / G7. The 2026-08-06 and 2026-08-07 sessions both
   ran from the root and had to hand-roll their verification.
2. **`npm ci` first.** `node_modules/` is not in the container image; `tsc` fails with 200 lines
   of "cannot find module @playwright/test" and it looks like a code problem. It is not.
3. **The landing page needs an asset drop before any of it renders.** See §2.1 — this is the one
   step that cannot be worked around, and skipping it produces a white screen with no error.

Playwright browser: `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run e2e`
(do **not** run `npx playwright install`).

---

## 1. Where the project actually stands

|                               |                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Phase 3 migration             | **DONE, 16/16 routes.** The landing page is a **17th**, not part of it.                                                     |
| DP drop 2 (`2670ed2`) re-sync | **DONE 2026-08-07.** Both blocked stylesheets resolved — Appendix A is the record.                                          |
| Gates                         | typecheck / lint / vitest 84 / build / `e2e` **170** / `e2e:visual` 115 / designer-css **34/34** / guard-greps — all green. |
| RD contract C1–C8             | Frozen. One additive C4 change on 2026-08-06 (`setResultUrl`, `setSongResult`), logged in `CHANGELOG-RD.md`.                |
| Dead code                     | **None.** Six orphaned components deleted 2026-08-06.                                                                       |

### The scope rule still in force (product owner, 2026-08-06)

> **This phase's deliverable is "the code architecture is sound enough for RD to wire the
> backend".** A finding that is _purely UI_ and touches neither the contract, nor the providers,
> nor a product rule is **deliberately left unfixed** until the designer ships the next DP drop.

That rule is why most of `TODO.md` #7 and nearly all of `DESIGNER-TODO.md` are open. **They are
not slipped work.** Do not "helpfully" fix them.

**The uncomfortable consequence, stated plainly:** all of `TODO.md` 7a is deferred, including the
keyboard-seek half. Four playback seek bars (`/song/result`, `/mv/result`, `/mv/edit`,
`/song/play`) are bare `<div onPointerDown>` — pointer-only, WCAG 2.1.1 Serious — and on
`/mv/result` that is a regression against the pre-migration `<video controls>`. Offered as a
separable, pixel-neutral fix and deferred anyway. Known and accepted, not an oversight.

---

## 2. THE NEXT SLICE — the landing page (`/`), a 17th route migration

**WA's `/` is `src/components/home/HomeView.tsx` (181 lines) and has never been migrated.** It is
still the original Tailwind screen. So this is not a re-sync of migrated markup; it is a fresh
screen migration, and it should get its own slice, its own six-width check and new visual
baselines for `/`.

### 2.0 What you are porting, measured

DP's `src/pages/HomePage/` is **8 components, ~996 lines of tsx and ~1426 lines of CSS**, and
**none of its 8 stylesheets are vendored yet** — the gated set goes **34 → 42**.

| DP file                 | tsx | css | Notes                                                    |
| ----------------------- | --: | --: | -------------------------------------------------------- |
| `HeroBannerSection`     | 400 | 484 | mobile hero. **Imports the 10 hero assets by name.**     |
| `HeroBannerSectionV3`   | 160 | 191 | desktop hero. Re-imports `HERO_ITEMS` from the above.    |
| `ToolSelectorSection`   |  61 | 283 | mobile tool selector                                     |
| `ToolSelectorSectionV3` |  52 | 198 | desktop tool selector                                    |
| `NewMVsSection`         |  88 | 103 | manual scroll row + prev/next arrows                     |
| `TopPicksSection`       |  96 | 102 |                                                          |
| `NewSongsSection`       |  84 |  36 | **needs `SongPlayBar`, which is already ported**         |
| `HomePage`              |  55 |  29 | the `isMobile` branch that picks which hero pair renders |

`HomePage.tsx` renders **mobile → `HeroBannerSection` + `ToolSelectorSection`; desktop →
the V3 pair.** Both sets ship; this is not an A/B leftover. (`HomePageReviewB`,
`ToolSelectorSectionAlt` and the `/home-review-b` route were removed upstream.)

### 2.1 ⛔ THE BLOCKER YOU MUST CLEAR FIRST — the hero assets

`HeroBannerSection.tsx` lines 7–16 import **5 mp4s and 5 poster images by name** from
`src/assets/hero/`, and `PROVENANCE.md` **deliberately excludes that directory** (13 MB of demo
media). `HeroBannerSectionV3` imports `HERO_ITEMS` from `HeroBannerSection`, so **"just do the
desktop one" does not escape it.**

**This fails silently and catastrophically.** `DESIGNER-TODO` A12 is the proof: one unresolved
import took DP's entire module graph down and **every** route rendered white — for four handoffs
that was misdiagnosed as "DP's `/mv-edit` page does not render".

> #### ✅ DECIDED 2026-08-07 (product owner): **vendor the 13 MB.**
>
> Break the exclusion rule for `src/assets/hero/` specifically. The reasoning on record: 13 MB is
> a different order of magnitude from `covers/`'s 257 MB, and it is the only option that renders
> the hero as designed.
>
> **What that obliges you to do, and it is more than copying files:**
>
> 1. **Amend `PROVENANCE.md`'s exclusion table** — remove the `src/assets/hero/` row and add a
>    line saying why this one is vendored while `covers/` and `storyboard-clips/` are not.
>    An exclusion list that no longer matches reality is how the next re-sync goes wrong.
> 2. **Every future drop must re-copy it.** Add it to the §7 re-sync procedure, or drop 3 silently
>    reverts to a white home page.
> 3. **WA serves from `public/`, not Vite's `src/assets/`.** DP's `import x from '…?url'` has no
>    Next equivalent here — the existing convention is `public/assets/…` referenced by path (see
>    how `songAudioUrl` and `public/assets/icons/ui/` already work). Put them under
>    `public/assets/hero/` and reference by string; do **not** try to make the `?url` imports work.
> 4. **Check the filenames.** Four of the ten contain **spaces** (`hero_01_Vintage Car.png`).
>    `DESIGNER-TODO` notes the remaining space-in-filename cases are all in `covers/` — that is
>    now wrong, and a raw space in a URL path will 404. URL-encode at the reference site, the way
>    `community.ts`'s `AUDIO` array already does (`Party%20Dance.mp3`).

### 2.2 The other three decisions, already taken (2026-08-07)

| #   | Decision                                    | What it means when you write the code                                                                                                          |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Port BOTH hero/tool-selector treatments** | All four components, the `isMobile` branch included. Do not collapse them — the whole point is that the next drop can re-sync each file whole. |
| 2   | **Follow DP: DELETE the Trending marquee**  | WA's 45s infinite marquee has no DP equivalent. See §2.3 — it has a consequence you must record, and an e2e test that must go with it.         |
| 3   | **A19 stands: keep following DP**           | `/explore/mvs` on phones still shows 3 of 14 MVs. Do not "fix" it; `e2e` asserts the loss on purpose.                                          |

### 2.3 ⚠️ The one consequence of decision 2 that nobody has ruled on yet

Deleting the marquee **removes `TRENDING_MVS`'s only entry point on the home page**, and DP's
three rails do not put it back: they map to `NEW_MVS`, `TOP_PICKS_SONGS` and `NEW_SONGS`. After
this slice, **`TRENDING_MVS` (3 items) is reachable only from `/explore/mvs`.**

That is survivable — it is still the `--primary` section there, so it is the one catalog a phone
_can_ see (A19) — but it was not part of what was decided. **State it in the slice's commit and in
`DESIGNER-TODO`; do not quietly let it happen.** If the product owner wants a Trending rail on
home, that is a designer request for a rail DP has not drawn.

Two things must move with the deletion:

- `e2e/behaviour-regressions.spec.ts` → **"landing page: clicking a Trending MV lands on the same
  /watch screen"** (line ~682) drives `.marquee-animate button`. It is guarding a real rule —
  home and `/explore/mvs` must not drift into two behaviours — so **re-point it at whichever DP
  rail still reaches `/watch`**, do not delete it.
- The `addStyleTag` that freezes the marquee animation becomes dead; remove it with the selector.

### 2.4 What WA has that DP does not — check these BEFORE you delete anything

This is the trap that has bitten **five** times (A4's tabs row, A7's shuffle/repeat, `/settings`'
Back, the Muse Pro pill, `/mv/result`'s unmute). DP's HomePage has **no auth at all** — its
`AuthProvider` was never ported — so every gate below exists only in WA:

- **`requireLogin` on both hero CTAs** (`AC-EXP-02` / GL-02). DP's tool selector just navigates.
- **`requireLogin` on New Songs' `Create`** (`AC-EXP-02`). Same.
- **`SectionHead href` → "See all"**, which `e2e`'s Q6 back test navigates through
  (`getByRole("link", { name: /See all/i })`, line ~592). Keep a real `next/link` with a
  `localePath()` href (R-9), not DP's `<a href="/mv-detail">`.

`AC-EXP-01` requires "the hero CTAs and the four seed rails in seed order" — re-read it against
what you ship, because decision 2 changes the rail count.

### 2.5 The standing rules this slice will hit

- **R-9:** every link through `next/link` + `localePath()`. DP navigates with `<a href="/home">`
  and reads `window.location.pathname`. `guard-greps.sh` catches a literal `<a href="/`; DP's
  `href={variable}` links are yours to hold.
- **R-2:** `HomePage.tsx`'s `isMobile` is DP's SSR-unsafe
  `useState(() => typeof window !== 'undefined' && matchMedia(...).matches)` shape. Use
  `useMediaQuery(PHONE_QUERY)` from `src/lib/ssr.ts`. **This is the third instance**; the previous
  sweep found "exactly two files in the drop" and that count is now stale.
- **Icons (D4):** decide `<img>` vs `DpIcon` vs `DpIcon as="i"` from DP's CSS, not habit, and
  **add `/` to the mask-icon sweep** in `e2e/behaviour-regressions.spec.ts`.
- **The `Idea` / `Ideas` buttons** are a deliberate subtraction from DP and **come back on every
  drop**. Check whether HomePage has any before you copy.
- **Style purity (G3-d):** no Tailwind utilities inside the migrated subtree. `HomeView.tsx` is
  100% Tailwind today, so this is a rewrite, not an edit.

### 2.6 Definition of done for this slice

`npm run typecheck && npm run lint && npm run test:run && npm run build` all exit 0; `designer:check`
passes at **42/42**; `e2e` green with the marquee test re-pointed and `/` added to the mask sweep;
new `/` baselines recorded at all six widths with `--update-snapshots=all --grep "@visual home @"`.

---

## 3. Everything still outstanding, in the order it should be done

| #     | Work                                                                  | Blocked on | Notes                                                                                                                                                                                                                                                                                                                                                                            |
| ----- | --------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **The landing page** (§2)                                             | —          | Decisions taken. Clear §2.1's asset blocker first.                                                                                                                                                                                                                                                                                                                               |
| **2** | **The deferred UI backlog** — `TODO.md` 7a–7h, `DESIGNER-TODO` A1–A19 | designer   | The next drop is when these get answers. Put 7a's ±15s glyph and A1/A9/A13's contrast in front of the designer **with** the drop, plus the two new ones this week added (A19, and 7j's record).                                                                                                                                                                                  |
| **3** | **a11y A1–A5, re-run**                                                | #1, #2     | `PHASE-3-ACCEPTANCE` §7.1. **The one verification that ran and was thrown away.** Also widen `a11y.spec.ts` to a mobile viewport (`TODO.md` #6) — but sequence it: that turns A9's 3.74:1 into an immediate gate failure, so either A9's colour lands first or the mobile pass ships with A9 excluded and a comment.                                                             |
| **4** | **Community spec + API contract** (`TODO.md` #1)                      | product    | **The actual RD blocker.** `MuseApi` has no community endpoints at all, so half the product has nothing for RD to implement. Source: `ycmuse-app-skill/YouCam_Muse_Explore_Curation_PRD  -  V2.pdf` at the REPO ROOT. **Still not read** — page 03's homepage UI is superseded by DP, everything else stands. Read it properly when its phase starts; do not skim and summarise. |
| **5** | **RD hand-off doc consolidation**                                     | #1–#4      | Fold README / DEVELOPER-HANDOVER / PHASE-3-ACCEPTANCE §7 / TODO / DESIGNER-TODO into one RD entry point. Best done last so it describes the finished state.                                                                                                                                                                                                                      |

### Open items by owner, so nobody re-derives who is waiting on what

**The designer owes:** A1 / A9 / A13 (contrast); 7a's ±15s icon **and** a five-slot transport
(neither DP's 90 icons nor WA's contain a ±15s glyph, and drop 2 added no icons at all — this is
blocked on artwork, not effort); 7b (Face Picker Cancel); 7c ("Change song" affordance); 7d
(`/song/result`'s phone volume); 7h (`/mv/room`'s disabled-CTA hint class); A16; A17; A18;
**A19 (new)** — a phone-friendly two-section design for `/explore/mvs`; and a mobile tabs design
for `/explore/songs` if the three-catalog loss turns out to matter.

**The product owner owes:** the community scope (#4 above); whether `TRENDING_MVS` deserves a home
rail after §2.3 removes its only one; and whether to delete `token-aliases.css`'s **85 dead names**
(of 110, only 25 are consumed — a design-system change under the ASK FIRST rule, so it must be
proposed, not done as a side quest).

**Already answered, do not re-ask:** `SongPlayBar` is **in** and is ported (2026-08-07); 7g (rails
show both by state); 7e (six dead components deleted); A5 (closed by drop 2); S2's 30s floor; S20's
prices.

### Known gaps that are accepted, not forgotten

- **Four seek bars are pointer-only** (WCAG 2.1.1 Serious) — `TODO.md` #5 / 7a. `SeekBar`
  (`src/components/ui/SeekBar.tsx`) already exists, is keyboard-operable, takes its BEM class
  names as props and is in production on `/watch`. Swapping the four bare tracks onto it is
  mechanical and pixel-neutral **whenever it is unblocked**.
- **`e2e/a11y.spec.ts` has three blind spots**: no auth seeding (four guarded routes show only the
  sign-in modal to axe), desktop viewport only, unprefixed English routes only.
- **`/explore/songs` phones show one of three catalogs**; **`/explore/mvs` phones show 3 of 14
  MVs** (A19). Both are asserted in `e2e` as deliberate.

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
