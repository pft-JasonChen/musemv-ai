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
| **S2** | `mv-creation` | 2 | 02 (MV-P1…P4, P6) | `/mv/room` + 6 sheets, `/mv/thinking` `/mv/storyboard` `/mv/creating` `/mv/result` | 8 | 43 | ✅ v1, 2026-08-27 |
| **S3** | `mv-edit` | 2 | 02 (MV-P5) | `/mv/edit` | 5 | 24 | ✅ v1, 2026-08-28 |
| **S4** | `history` | 6 | 05 | `/history` | 6 | 25 | ✅ v1, 2026-08-27 |
| **S5** | `credits-iap` | 5 | 07 | `SubscribeModal` `BuyCreditsModal` `/profile/credits` | 6 | 21 | ✅ v1, 2026-09-01 |
| **S6** | `shell-auth` | 1 | 01 + 09 | sidebar / tab bar / route navbars / `SignInModal` | 7 | 24 | ✅ v1, 2026-08-27 |
| **S7** | `profile-account` | 1 | 06 | `/profile` `/settings`, edit-profile, Send Feedback | 6 | 22 | ✅ v1, 2026-08-31 |
| **S8** | `explore-community` | 4 | 04 | `/` `/explore/mvs` `/explore/songs` `/watch` `/song/play` `/creator` | 7 | 38 | ✅ v1, 2026-09-01 |
| **S9** | `share` | 4 | 10 | `/share`, `ShareDialog` | 5 | 15 | ✅ v1, 2026-09-01 |
| **S10** | `credit-consumption` | — | 11 | none — **the area 11 md IS the spec** (D13) | — | 0 | ✅ 2026-09-01, one blank: `TBD-CC-06` |
| — | ~~proof-of-creation~~ | — | 08 | — | — | — | ❌ out of web scope (area 08 § Status) |

**Coverage check.** Areas 01–07, 09, 10 are covered by S2–S9 plus the finished S1; area 08 is
removed from scope; area 11 is S10 and is contract-shaped, not journey-shaped.

**As of 2026-09-01 the queue is DONE.** All ten are delivered. S10 is the one that is not an
`spec.html`: the product owner ruled it takes the same md-as-spec form S11 got (D13), and it ships
with exactly one blank — the payload's quantity field (`TBD-CC-06`, area 11 §1.1), which the
product owner will fill. Everything else in it is complete and testable.

### S8 scope — agreed at its Phase 0 gate, 2026-09-01

Six paths, 36 captures (desktop 1403×697 only). Larger than the ~6/~30 estimate above, and both
causes are structural rather than scope creep:

| Path | Covers |
|---|---|
| **P1** | The Home feed: the hero + two gated create cards, the three seed rails, the rail arrows' appear-only-when-scrollable rule, the album-art-previews-in-place split, one `ShareDialog` entry point (S9's boundary), and the logged-out screen plus the gate firing at the ACTION. |
| **P2** | `/explore/mvs`: two sections, **all 14 seed items with no cap** (counted live — this is the assertion that closes `DESIGNER-TODO` A19's "3 of 14" question), and cards that are real locale-prefixed links. |
| **P3** | `/explore/songs`: the Top Picks rail, the ten hardcoded genre tabs, "switching a tab must not change what is playing", and **both** halves of `AC-EXP-03`'s row split — art previews, title navigates. |
| **P4** | `/watch`: the player and its transport, the grid below it, the YCM watermark (`AC-EXP-10`), the vertical swipe in three states (held · committed · an id with no neighbour, `AC-EXP-11`), the gated Like beside the un-gated Share, the Create hand-off, and the not-found state. |
| **P5** | `/song/play`: the desktop arrival state, the bar opening on play, the creator-playlist swap (`EXP-09`), and the not-found state. |
| **P6** | `/creator`: someone else's page, your own, both owner-menu variants, and the `profileEmpty` demo state in both modes. |

**A SEVENTH path landed after the first build, and it is the product owner's own decision, not
scope creep.** At the 2026-09-01 spec review they were asked about four S8 findings and three
answers changed the app: `/song/play`'s deep link now MARKS its row (P5-S1, `AC-EXP-14`), every
feed surface gained a shared empty state (the new **P7**, `AC-EXP-13`, closing `TBD-EXP-06`), and
the "Trending Music Videos" rail's name/data mismatch was settled as correct rather than fixed
(D-07 — QA should not file it). Two more captures and one re-shoot; 6/36 became 7/38. The three
code changes each carry an e2e guard, mutation-tested both ways.

1. **`/watch` grew two acceptance criteria in the days before this build** — the watermark and the
   swipe feed — and the swipe alone needs three captures, because "commits", "springs back" and
   "never commits" are three different rules.
2. **`AC-EXP-03` carries TWO affordances on one row.** The album art previews and the title
   navigates; one capture covers half a criterion.

**The Curation PRD was read in full for the first time (D5), and the gate settled how to carry it.**
Product owner: the designer prototype **superseded the PRD's layout** — for the home page and, on
the same reasoning, for both explore pages — so the spec follows the shipped screen and the PRD's
rail counts, carousel sizes, pagination model and item caps are recorded once as superseded. The
**ranking / eligibility / moderation / refresh layer is only MARKED**, with the PDF named as the
authority, rather than restated as requirements. Two things the read turned up are carried as open
questions instead of being smoothed over: the PRD **contradicts itself twice** on its own scoring
(weight tables vs formulas, on both scored rails — Q-01), and it defines **no endpoint, field or
payload shape**, so `TBD-EXP-11` — the named handover blocker D5 expected this document to close —
**is still open** (Q-02).

**Five area-04 corrections came out of the capture, all under D11.** `/watch`'s control inventory
(the `# Music Video` tag, meta line, `Stats` block and prompt are all gone, and the transport's
seek/fullscreen and the grid below were never recorded); `/explore/songs` gained a Top Picks rail
and moved its tabs into the page body; `/creator` shows **no email** and has **no `⋯` menu at all**
on someone else's profile; the owner menu's first slot reads **Edit MV** on an MV and **Create MV**
on a song, not a flat "Edit"; and §3.4's desktop disc player and Lyrics overlay describe a column
DP drop 2 deleted. Two further findings are `open_questions` rather than corrections: the rail
titled "Trending Music Videos" shows the *newly released* catalog while the catalog the PRD calls
Trending has no home entry point at all (Q-03), and a shared song link opens the browse list with
**nothing marking which song it named** (Q-04).

**One capture-environment fact is recorded rather than worked around.** Every mp4 in this
environment fails to decode (`MediaError 4`, AGENTS.md's documented limit), so `/watch`'s stage is
blank in all ten of its captures — `CommunityMvPlayer`'s videos carry no `poster`, unlike the home
hero's, which is why the home page photographs perfectly and the player does not. Injecting a still
frame at capture time was rejected as a fabricated capture; the recommendation (give the player's
videos the `poster` the hero already uses) went to the product owner instead, since a build session
has no `src/` authority.

### S9 scope — agreed at its Phase 0 gate, 2026-09-01

Five paths, 15 captures. Larger than the ~4/~12 estimate, and the cause is a single fact the
estimate could not have known: **`/share` was redesigned on 2026-08-24** (product owner, Figma
"Share Page - MV"), reversing the 2026-07-23 "simplified chrome" decision `areas/10-share.md` still
described. The page is no longer a logo, some media and a Download button — it has a full custom
controller (play/pause, elapsed/total, seek, mute, fullscreen), a three-item **More** menu, and a
**second action pill**. The extra path is that menu, whose three actions would otherwise have no
photograph anywhere in the programme.

| Path | Covers |
|---|---|
| **P1** | A valid MV link: the bare page, the controller, the two pills, and the four-source resolution order (a static History sample resolving in a fresh session). |
| **P2** | The More menu: Download · Playback Speed · Picture in Picture — and the fact that **Playback Speed cycles and keeps the menu open** while the other two act once and close. |
| **P3** | A valid song link: cover art, **title and creator**, its own pill controller, and the kind-labelled Create pill. |
| **P4** | The unavailable state and all three ways in (bad id · no id · the QA switch), plus the prototype limit that produces it from a *working* link. |
| **P5** | The legacy share URL's server redirect, and `ShareDialog` itself — the copy-only dialog, and its 1.5-second confirmation. |

**The recipient session is deliberately SIGNED OUT** — the only spec in the programme where that is
the default. `/share` is public by design and mostly opened by people with no account; a signed-in
capture would photograph a state no real recipient sees. Only P5 runs signed in, because the dialog
lives on a player screen rather than on `/share`.

**Built after S8 on purpose (D6), and it paid off:** S8 had already captured the Share entry points
on the Home rows and on `/watch`, so S9 cross-references them instead of re-deriving them.

**Six area-10 corrections, all under D11** — §1, §2's route table, §3's valid-link bullet, §4's
`SHARE-P1-S2`, and `AC-SHARE-01`, whose "and nothing else" clause was asserting the absence of four
things now on screen. One finding is an `open_questions` row rather than a correction: **the MV
panel shows no title and no creator while the song panel shows both** (Q-01), which no document
explains — the component's own header says "title/creator … are back" without saying which panel.
A second (Q-02) asks whether both Create pills should keep kind-specific labels when both go to the
home page.

**Both S9 open questions were answered at the 2026-09-01 review, and one changed the app.** The
MV panel's missing title/creator is **deliberate** (D-08: a video carries its own title on screen,
a cover image does not), so it is now specified as a rule on both panels rather than left open.
The Create pill's label **was** wrong: it read `Create MV` / `Create Song` by media kind while both
went to the home page, so the button named a flow it never opened. One neutral string now serves
both kinds (`AC-SHARE-07`); only the gradient still varies. Guarded by e2e on both media kinds.

**One thing worth carrying to any future spec that draws a diagram citing a neighbour.**
`validate()` rejected this build because `make_flowchart.py` cited **S8's** step IDs (`P1-S6`,
`P4-S9`) on S9's own diagram: the SVG is inlined, so a bare `Pn-Sn` drawn there is
cross-reference-checked against *this* spec's steps and a neighbour's ID resolves to nothing.
Name the neighbouring spec, never its step IDs.

### S5 scope — agreed at its Phase 0 gate, 2026-09-01

Six paths, 21 captures (desktop 1403×697 only). Larger than the ~4/~16 estimate above, for two
structural reasons recorded here so the growth is not mistaken for scope creep:

| Path | Covers |
|---|---|
| P1 | Subscribe: the three duration tabs, six plans, a real card press, and what it changes |
| P2 | The already-on-Muse-Pro branch (CR-05) |
| P3 | Buy Credits as a subscriber: six packs, selection, purchase |
| P4 | The CR-06 free-user gate — every entry point, no interstitial |
| P5 | `/profile/credits`: balance, All/Spend/Earn, ledger, branching CTA |
| P6 | `apiError` on both dialogs (including its interaction with CR-06) and `creditsEmpty` |

1. **`SubscribeModal` is six plans across a duration Tab Bar**, not the flat three-card list the
   estimate assumed — that redesign landed 2026-08-28, after this row was written.
2. **The empty/error states are built and `live`.** The estimate (and `DESIGNER-TODO` A30) assumed
   they were awaiting artwork; they are not, so P6 has real screens to photograph.

Two findings came out of the build and are carried as open questions in the spec rather than
smoothed over: **CR-05's already-subscribed state has no live trigger** (every `openSubscribe()`
call site is conditioned on `!subscribed`, so nothing reopens the dialog once you subscribe —
Q-01), and **a pack purchase only toasts when it started from `/profile/credits`** (the shared
dialog the header credit pills open is mounted with no `onPurchased` callback anywhere — Q-02).

### S3 scope — agreed at its Phase 0 gate, 2026-08-27

Five paths, ~24 captures (~20 desktop + ~4 phone). Larger than the ~4/~18 estimate above, for two
reasons recorded here so the growth is not mistaken for scope creep: the screen has **four**
independently-priced micro-operations rather than one generation, and it is the second spec to earn
the D8 exception.

| Path | Covers |
|---|---|
| **P1** | Entry + screen tour: arriving from `/mv/result`'s **Edit MV**, `DetailNavbar` (back · "Edit Music Video" · credit balance) and the three sections — cover, storyboard + scene editor, output settings — plus the Merge footer and its cost pill. **Also the second entry**: arriving from History's **Edit MV**, which fabricates flow state (`mockStoryboard()` + a synthetic song, `durationSec: 145`) — captured here, with the fabrication as a `prototype_deltas` row. S4's P6 owns the menu tap and cross-references. |
| **P2** | Cover: description + **Enhance**, **Expand** → lightbox + Download, **Recreate** cover — overwrites in place, no picker, no undo (`AC-MV-12`). |
| **P3** | Scenes: the clip strip, the inline preview transport, the scene prompt (2500 max) + **Enhance**, the scene-version history row, **Recreate scene** — overwrites that scene's video in place, no take tray, no undo (`AC-MV-12`). |
| **P4** | Output settings as inline rail sections, not a modal: MV title toggle+input, Author name toggle+input, Show Subtitle, Show Watermark — **the two switches are `MvSettingsSchema` fields (C2), not decoration** (`MV-P5-S4`) — and **Delete this Project**, which confirms with History's wording and then discards the in-memory flow and leaves. It calls no backend delete. |
| **P5** | **Merge MV** → `resetForRerender()` → `/mv/creating` (stop at the destination's first frame; S2 owns that route), enabled by ANY pending edit incl. `storyboardDirty`; **insufficient balance opens `BuyCreditsModal` instead** (`AC-MV-13`/`AC-MV-19`); plus **MV-E5** — leaving the page loses every edit, there is no Save — and **MV-E2**, reload with no flow state → `router.replace("/mv/room")` after the 400ms hydrate wait. |

Three capture notes settled at the same gate:

- **D8 exception #2, scoped to the scene view alone.** Below 768px the inline scene editor **and**
  the preview are both replaced by a full-screen `.mv-edit-mobile-scene` (inline in
  `MvEditor.tsx:714`, not its own file) with its own back control — the same "different component
  tree, behaviour that exists nowhere else" argument S6 won on, and the only way `DESIGNER-TODO`
  **A16** (`display: contents` sorting `FloatingCTA`'s spacer to the top below 1024px) gets
  photographed at all. ~4 captures at 375×812; **the rest of the screen stays desktop-only**, and
  D8 still stands for S5 / S7 / S8 / S9.
- **D2 holds, and this is the screen that tests it.** `/mv/edit` is the one place the product
  **prints** its costs — `{COST_MERGE}`, `{COST_COVER}`, `{COST_REGEN}` render inside
  `.mv-edit__merge-credits` / `.mv-edit__regen-credits`. Those pill values are quoted in `exact`,
  as on-screen UI copy re-confirmed against the live app like any other string; every RULES cost
  bullet still reads "charges on start, refunds on failure; cost per the Credit Consume MSR". D2
  governs rules, not screen text — and the MSR link is still `TBD`, so the `open_questions` row
  every spec carries applies here too.
- **`MV-E7` is NOT S3's.** "Unpublish to edit" is asserted on `/mv/result` (S2's P8) and in
  History's menu (S4's P4); S3 names the precondition in RULES and captures nothing. Same
  neighbour rule S6 used: one step showing the boundary, then stop.

**Watch for what 3k already learned the hard way** (`CLAUDE.md`): a section modifier here can be
load-bearing for a phone-only rule, and `/mv/edit`'s scene **Recreate** is the shared `Button`
(`variant="PrimaryPayg"`) whose coin is `.button__icon` **without** `--mask`. Both were invisible
at 1440.

### S7 scope — agreed at its Phase 0 gate, 2026-08-31

Six paths, ~24 captures. Two things moved since the queue row above was written, and both change
the shape: **the account menu is gone** (deleted 2026-08-27, S6 `Q-01`) so it is not a surface any
more, and **Send Feedback has grown seven acceptance criteria of its own** (`AC-PROF-10`…`16`),
which is why it gets a path rather than a few steps inside the rows.

| Path | Covers |
|---|---|
| **P1** | Profile hub: the identity block (avatar · name · email · Edit — **no plan badge**, `AC-PROF-01` as corrected 2026-08-19), the three stat tiles and where each navigates (`AC-PROF-02`: Credits → `/profile/credits`, MVs/Songs → `/creator?self=1&tab=…`), and the row list. |
| **P2** | Edit profile → `updateProfile` commits name/avatar and the shell reflects it in-memory (`AC-PROF-03`). |
| **P3** | `/profile`'s rows: **Muse Pro** (see the IAP boundary below) and **Language** → `setLocale`, with a localized surface changing with it (`AC-PROF-05`). ⚠️ **Terms / Privacy moved to P4 during the build** — this gate put them here, but they live on `SettingsView`, as area 06 §2's own table says. Same six paths. |
| **P4** | `/settings`: the row order, **Terms / Privacy** opening the real legal URL in a new tab (`AC-PROF-09`), **Unsubscribe** and **Delete Account** — both demo toasts that cancel and delete nothing (`AC-PROF-07`, pending `TBD-PROF-04`) — and **Sign Out**, which since 2026-08-27 is the app's ONLY sign-out control (`AC-PROF-06` / `AC-AUTH-05`; S6's P6 owns the flow, S7 owns the screen). |
| **P5** | **Send Feedback**, its own path: exactly four fields in order Type → Description → Attachment → Email with Email prefilled and **no Subject** (`AC-PROF-10` — the absence is asserted, because a returning Subject silently re-opens `TBD-PROF-07`); Send stays disabled until Type + Description are non-empty and Email is well-formed (`AC-PROF-11`); the success confirmation with **Done** and no toast (`AC-PROF-13`); the failure path that keeps every value and attachment and re-enables Send (`AC-PROF-14`, `PROF-E6`); and the **5 MB total** rejection that adds nothing and messages inside the form (`AC-PROF-15`). The Type control's keyboard contract (`AC-PROF-16`) is a step, not a screenshot — it is behaviour a picture cannot carry. |
| **P6** | `/settings` is `AuthGuard`-gated: logged out, it renders nothing and opens the sign-in modal (`AC-PROF-17`). S6's P4 owns the dismiss behaviour; S7 shows the gate on this route and stops. |

Three notes settled at the same gate:

- **IAP boundary — tighter than the usual neighbour rule, on purpose.** The Muse Pro row is
  captured in its **states only** (not subscribed · subscribed · "subscribed on a phone", the last
  reachable via the demo panel's `subOnApp` flag) and the walk **stops at the click target**.
  `SubscribeModal` is NOT photographed, even though the neighbour rule would normally allow one
  boundary shot: **S5 is deliberately on hold until the designer delivers the IAP artwork**
  (product owner, 2026-08-28), so any capture of that modal is a capture with a known expiry date.
  RULES names the destination and cross-references S5.
- **`?demo=1` is in scope where — and only where — area 06 already has an `AC` for the state**, and
  **the exact `?demo=1` URL is printed in the step** so QA reproduces it in one click. This gate
  named two such states; the build found only one of them real:
  - **`subOnApp` — captured (P4-S6), but not on the row this gate claimed.** The flag gates
    `SettingsView.tsx:122`'s **Unsubscribe** row, branching it into a "manage it on your phone"
    dialog. It does not touch `/profile`'s Muse Pro row at all.
  - **The feedback-submit failure (`AC-PROF-14` / `PROF-E6`) is NOT reachable.** `FeedbackDialog`
    reads no demo flag, and the mock's `submitFeedback` throws only on an attachment overage the UI
    already refuses before submit. Specified as a **no-shot step** rather than invented — which is
    why `open_questions` **Q-02** proposes a `feedbackFail` flag paralleling `jobFail`. **Until that
    exists, AC-PROF-14 has no photograph anywhere in the programme.**

  This is not a tour of the panel — the panel spans 17 routes and would be its own spec if anyone
  wanted one.
- **D8 stands: desktop only.** Neither `/profile` nor `/settings` mounts a distinct phone component
  tree — `/profile`'s phone back is `RoomNavbar`'s own `mobileBackHref`, the same shell affordance
  S6 already captured on History, and `/settings`'s old `md:hidden` workaround was deleted when
  drop 2 closed A5. The two D8 exceptions granted so far (S6's shell chrome, S3's
  `.mv-edit-mobile-scene`) were each a *different component tree*; this is not one.

### S2 scope — agreed at its Phase 0 gate, 2026-08-27

Eight paths, ~42 captures. `/mv/edit` is **not** in it (that is S3).

| Path | Covers |
|---|---|
| **P1** | Storyboard-first, end to end: compose → `ModeModal` → `/mv/thinking` → `/mv/storyboard` (visual style + scene edits, Enhance) → Generate MV → `/mv/creating` → `/mv/result` → the new `/history` row. ~12 steps. |
| **P2** | Direct generation: **Templates** (and, again, **Enhance**) fills the brief → **Create MV Directly** → `/mv/creating` → `/mv/result`. ~6 steps. |
| **P3** | Generation failure, **both stages**: the `[fail]` marker is captured at `createMvJob` and reused by `renderMvJob`, so storyboard-first fails at **thinking** and direct fails at **creating**; Retry re-runs the same compose and re-fails deterministically. |
| **P4** | The six sheets and their boundaries, kept together because `MV-01` / `MV-02` / `MV-04` are three app-synced numeric rules QA tests individually: Choose Song (My / Sample), Import reject on format **and** 50 MB, Trim's ≥30s floor, FacePicker crop, Settings' Pro-gated **High** crown → `SubscribeModal`, Templates. |
| **P5** | Guest gate (`AC-MV-01b`): the screen renders with no modal; **Song Library** and **Create Music Video** gate; **Import Audio stays ungated**. |
| **P6** | Insufficient credits at mode select → buy-credits IAP instead of generating. |
| **P7** | The side rail's two modes — Trending MVs vs My Creations (needs `loggedIn` **and** ≥1 completed MV). |
| **P8** | `/mv/result` controls tour: the hand-built transport, Like/Dislike, Share, Download, Publish → "Ready to Go Public?" → pending review, the **"Unpublish to edit"** neutral state (`MV-E7`), the info panel, and the opened-from-History variant. |

**Capture run 1 was voided and re-run (2026-08-27).** Its 44 screenshots were taken against the
pre-rebase branch, whose `/mv/room` still carried an **Enhance** button that `origin/main` had
removed for V1 on 2026-08-25 (`3bdff87`, product owner). The spec was therefore about to document a
control that does not ship, and P2's scope named it outright. The branch was rebased onto
`origin/main` — app code for `EnhanceButton` / `MvRoom` / `globals.css` is now main's verbatim, the
duplicate `enhance-dialog.css` is deleted, and the whole capture set is re-shot. **Nothing about a
screenshot's age reveals this: the old captures are sharp, complete and wrong.**

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

### S4 scope — agreed at its Phase 0 gate, 2026-08-27

Six paths, ~26 captures, 1:1 with area 05's own `HIST-P1`..`HIST-P6` journeys — each already
covers meaningfully different mechanics, unlike S1's folded sub-steps which were minor variations
of one screen.

| Path | Covers |
|---|---|
| **P1** | Browse & filter: All / Music Videos / Songs / Liked, plus the empty state (reached via **Unlike**, not delete — corrected during the build: community rows expose no Delete at all, so Unlike is the only way to empty Liked). |
| **P2** | Open a creation: done MV → `/mv/result?id=`, done song → `/song/result?id=`, storyboard → `/mv/storyboard?id=`, community → `/song/play?id=`, processing → inert (not clickable, no menu). |
| **P3** | The `⋯` menu, both its actions AND its five row-type variants — this is the highest-value coverage in the spec, the one place a content change could regress silently with no test catching it. One capture per variant (MV / song / storyboard / community / failed) showing the menu open, per the area spec's own "Net per type" table, plus Like/Unlike, Share (`ShareDialog`), and Download (toast, fixture media). |
| **P4** | Publish: MV → live "Ready to Go Public?" confirm → "Submitted for review" toast → the menu now shows **Publish (Review)** and Edit MV becomes **"Unpublish to edit"** (MV-13). Song → immediate toggle, no confirm. |
| **P5** | Delete: confirm modal ("cannot be undone") → row removed; hidden for published/reviewing rows. |
| **P6** | Edit MV / Create MV: the `⋯` menu tap only — no follow-through capture of `/mv/edit` / `/mv/storyboard` / `/mv/room`, which S2/S3 already own in full. RULES cites the destination and cross-references the owning spec. |

**One gap surfaced at this gate, not before it:** there is no review-REJECTED state anywhere in
the app — `confirmPublishMv()` sets `reviewing`+`published` together and nothing ever clears
`reviewing`. Flagged in `areas/05-history.md` as `TBD-HIST-05` and carried into S4 as an
`open_questions` row; **not** simulated or invented for the capture.

**D8 applies unchanged.** Desktop 1440 only — S6's 375 exception is scoped to the shell chrome
alone and does not extend to History's own layout.

**Execution:** running in an isolated worktree (`.claude/worktrees/history-storyboard`, branch
`spec/history-storyboard`, based on `spec/song-creation-storyboard`'s tip) after the shared-checkout
collision that reverted this section once already — see S2/S6's own note above and `db938e3`.
Own dev server on :3220 (S2 has :3000, S6 has :3210).

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

**S2's captures are stale on one point (2026-08-27, same day as the build).** `origin/main`'s
`3bdff87` had removed `/mv/room`'s Enhance shortcut for V1 (product owner: no supported backend API);
S2 was captured during that window, so its 43 screenshots and P2's scope correctly showed Templates
as the only Describe shortcut. **RD confirmed the API exists on 2026-08-26**, the product owner
reversed the removal the same day S2 shipped, and `MvRoom.tsx` now renders `EnhanceButton` again
(same `kind="mv"` call as before `3bdff87`). `specs/areas/02-mv-creation.md` MV-P1-S4 / `AC-MV-14`
are corrected in place. **S2's screenshots of the Describe footer (at minimum `01_mv_room_empty`,
`08_create_cta_ready`, `17_templates_applied`, `21_fail_description`) need a v2 re-shoot** to show
the restored button; nothing else in the 8-path scope changes. Filed here rather than re-run
immediately — S6 is the priority next spec.

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

**Built 2026-08-27 — 24 captures (19 desktop / 5 phone), and TWO of the seven paths were reshaped
by what the capture found, not dropped.** `TopBar` → `HeaderActions` → `AccountMenu` is a chain
of **unreachable dead code**: `AppShell` renders `TopBar` only for a route that is neither in
`OWN_CHROME` nor `/`, and `OWN_CHROME`'s prefix list now covers every non-home route the app
serves (`/profile/credits` included, via prefix match), while `/` takes the marketing `Navbar` and
`/share*` renders bare. So there is no account menu to walk: **P5 became "Account entry points"**
(the credit pill, the Sidebar profile footer, `MobileHeader`'s account icon, plus one
negative-result DOM sweep asserting no `[aria-label="Account menu"]` exists on five routes), and
**P6 has one sign-out entry point, not two** — only `Settings`. Two more copy/mount facts came
with it: the live logged-out control reads **"Login"**, not "Sign In" (that string lives only in
the dead `HeaderActions`), and `MobileTabBar`/`MobileHeader` are **Layer-1 only** — Home and
History, not every route under 768px. Areas 01 and 09 are corrected in place under **D11**
(§1, §2's table, §3, SHELL-P2/P3/P4, AC-SHELL-01/03/04/05/06, AUTH-P1-S1, AUTH-P4-S1); the
"wire it back or delete it" call is `open_questions` **Q-01** for the product owner, and the
three files were left untouched — a build session has no `src/` authority.

**Phone captures are scoped to where the component tree actually differs** (Home, History, the
gated History tap) rather than duplicated across all seven paths: the Layer-1 finding means
`/mv/room`, `/settings` and `/share` have no distinct phone chrome to photograph. That is the D8
exception honoured, not narrowed — but it is why the count is 24 and not ~28.

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
   > **Both halves of that came true, 2026-09-01.** The PRD was read in full at S8's Phase 0 gate
   > (see the S8 scope block above) and the spec does carry six open questions — but the prediction
   > was one step short: the PRD **does not close `TBD-EXP-11`**. It specifies ranking semantics and
   > no wire contract at all — no endpoint, no field names, no payload shape — so the named handover
   > blocker survives the document D5 expected to answer it.
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
| **D13** | **S10 (`credit-consumption`) ships as `specs/areas/11-credit-consumption.md` itself, not as a generated `spec.html`** (product owner, 2026-09-01), reusing the same ruling S11 got: "storyboard spec 都不用畫面,或是直接用 md 當成 spec 即可". | Supersedes D7's "deferred until `TBD-CC-06` is answered". The reason it is not merely convenience: the subject has **no journey to walk**, and the skill's `data-contract` form REQUIRES a complete field table — the one thing still missing. A generated document with a hole in its required section is not more handover-ready than the md. The md gained an S10 header, a §1.1 blank-field table, and a §9 QA checklist whose 8th row is the single red light. |
| **D12** | **Execution:** the Phase 0 gate and the final review stay in the orchestrating session; one **sonnet-5 / effort-high** subagent per spec owns Phases 1–4 (read → capture → `build_spec.py` → `validate` + `lint_spec`). | The skill's own rule that a build session must not self-certify. One spec at a time — captures must not run concurrently (CPU contention flakes Playwright; see `AGENTS.md`). |
