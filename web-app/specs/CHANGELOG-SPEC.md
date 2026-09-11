# CHANGELOG-SPEC — what moved in these specs, and where

> **For RD and QA.** One row per change, newest first. Each row names the **bug/decision code**, the
> **spec IDs** that moved, the **code** that implements it, and the **test** that holds it — so you can
> get from "what changed?" to the exact file without diffing.

## What belongs here, and what does not

There are three change logs in this repo and they answer three different questions. Reaching for the
wrong one is why this file exists.

| Log                                                  | Question it answers                                                                                | Audience  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| **This file**                                        | "Which acceptance criteria / storyboard steps changed, and where is the code and the test?"        | RD + QA   |
| `../docs/CHANGELOG-RD.md`                            | "Did the **wire contract** move?" — C1–C8 only (`MuseApi`, Zod schemas, hook keys, routes, costs)  | RD        |
| Each storyboard's own **Changelog** section          | "Which screenshots and steps in *this* walkthrough are stale?" — plus the `NEW · vN` badges inline | QA        |

`CHANGELOG-RD.md` is deliberately narrow: a UI or copy change never appears there no matter how large,
and a criterion can flip meaning without touching a single byte of contract. That is exactly the gap
this file covers. When a change does both, it appears in both, and the row below says so.

**A storyboard's own Changelog is the finer-grained one** and worth opening second: it badges the
individual steps that moved with a green `NEW · vN` marker, and it is where a stale SCREENSHOT is
recorded. This file points you at which storyboards to open.

---

## 2026-09-11 — `/explore/mvs` phone layout: "Newly Released MV" un-hidden, Trending MV becomes a row

Figma node 3940:150442 ("New MVs — See All — Community"). No contract change — pure layout/CSS,
one behaviour reversal.

| | |
| --- | --- |
| **Criteria** | Area 04 §3.2's `/explore/mvs` paragraph, corrected in place — see the `⚠️ Superseded 2026-09-11` note there for the full before/after. No AC number changes; this was prose, not a numbered criterion. |
| **Decision reversed** | The 2026-08-07 "follow DP, hide every non-`--primary` `.mv-detail__grid-section` on phone" call (`DESIGNER-TODO` A20) is reversed for this screen: Figma's phone frame shows both sections. `DESIGNER-TODO` A20 gets a partial-resolution note — the "phone only reaches Trending" half is fixed; "Home still has no Trending rail of its own" is unchanged and stays open. |
| **What changed** | Primary section (mobile title "Trending MV", was "Top Picks"): now a horizontal-scroll row at phone widths too (was the two-column masonry every other width still uses below 1024px; desktop already had this row, `asRow` in `MvGridSections.tsx`, since 2026-09-07). Secondary section (mobile title "Newly Released MV", was "New MVs"): no longer hidden below 768px, same masonry as before. Card radius/type size shrunk on the new phone row to match Figma and to fix a real overflow bug the narrower cards exposed (a single long word could overflow `Card`'s default 17px title into the next card). `.mv-detail`'s own mobile padding/gaps re-tuned across several same-day follow-ups, landing at: 16px horizontal (matching `.home-page`), 16px between the two sections plus a 16px `margin-bottom` on the primary section (32px total above "Newly Released MV"), 10px between each section's own header and its content. Both `/explore/mvs`' and `/explore/songs`' Top Picks rows, and Home's own `new-mvs`/`top-picks` rows, also gained a both-edges peek bleed (previously next-card-only on Home, none on the two explore rows). |
| **Code** | `src/components/community/MvGridSections.tsx` (`MvTopPicksRow` takes a `rowHeight` prop, phone opt-in in `MvGrid`) · `src/components/community/MvExplore.tsx` (dropped the fixed `<h1>Trending MV</h1>`, now a duplicate of the SectionHeader) · `src/styles/designer-overrides.css` (all the sizing/spacing/bleed rules — each has its own dated comment). |
| **Tests** | `drop 2: /explore/mvs still has a grid on a phone` in `e2e/behaviour-regressions.spec.ts`, rewritten to assert the reversed behaviour (both sections visible, titled, painted) instead of the old hidden state — same test, opposite assertion, not a new one. Run standalone and confirmed passing (`--grep`, not the full suite — see `AGENTS.md`'s port-3100 rule). |
| **Contract** | None. |

---

## 2026-09-11 — `/explore/mvs` follow-up: tablet row, and a second "Trending Music Videos"

Two same-day product-owner requests on top of the phone-layout change above. No contract change.

| | |
| --- | --- |
| **Criteria** | Area 04 §3.2's `/explore/mvs` paragraph, same block as above — two new bullets appended in place. §3.1's "Trending Music Videos" name/data-mismatch note also amended (see below). |
| **What changed** | (1) **Tablet (768–1023px)** was left out of the phone-layout work — `MvGrid`'s tablet branch ignored `asRow` and kept rendering the plain wrapping grid regardless. It now renders the same horizontal-scroll row phone and desktop use, at its own height (`TABLET_ROW_HEIGHT` = 200, a middle value with no Figma frame behind it — Figma only supplied a phone frame). "Newly Released MV" is untouched at every width. (2) The **desktop/tablet title** (shown ≥768px) changed from "Top Picks Music Videos" to **"Trending Music Videos"** — matching the mobile title's "Trending" naming, just unabbreviated. |
| **A naming collision worth flagging to QA** | This section is now titled "Trending Music Videos" on desktop/tablet, which is **already the title of a different section on Home** (`NewMVsSection.tsx`, fed by `NEW_MVS`) — §3.1 already carries a note that this pairing (same title, different route, different array) is a settled, non-defect state from 2026-09-01; this row is the second instance of it, not a new decision. |
| **Code** | `src/components/community/MvGridSections.tsx` — `TABLET_ROW_HEIGHT` constant, `MvGrid`'s `!isDesktop && asRow` branch, and the `SectionHeader` `title` prop. |
| **Tests** | No test asserts the old tablet-wraps-instead-of-rows behaviour or the old title string, so nothing needed rewriting; verified live via DOM measurement at 768/800/1023/1024px (the tablet↔desktop boundary) instead. |
| **Contract** | None. |

---

## 2026-09-11 — Two eBug-driven product decisions

Both from the same PM triage pass over `YMW26091*`/`YMW26090*` eBugs. Neither is a "fix the bug as
described" — each one reverses or narrows a decision already recorded in the spec, so the PM ruling
is the change, not the code alone.

### Profile's MVs/Songs stat pills now open History, not the public Creator profile

| | |
| --- | --- |
| **Criteria** | `areas/06-profile-account.md` §3 ("Stat tiles"), §4 (PROF-P1-S2), §6 (AC-PROF-02), and the §7 flowchart. |
| **Why** | `YMW260910P0001` — a user tapping their own MV/Song count expects to land on **their own creations list**, not the read-only public profile grid. |
| **Decision** | Product owner, 2026-09-11: MVs/Songs pills → `/history?tab=mv`\|`songs`. The **identity block** (photo + name + email) is unchanged — still `/creator?self=1`, the public profile — only the count pills moved. This narrows, not reverses, the 2026-08-31 decision that grouped all three under one destination. |
| **Code** | `ProfileView.tsx` (pill hrefs); `HistoryView.tsx` (`?tab=` now seeds the initial filter, same one-time-seed convention as `CreatorProfile`'s own `?tab=`); `app/[locale]/history/page.tsx` (wrapped in `<Suspense>` for the new `useSearchParams()` read). |
| **Tests** | Not yet added — flagged for a follow-up pass. |
| **Contract** | None. |

### History: Share is gated on `published` for an own MV/Song row

| | |
| --- | --- |
| **Criteria** | `areas/05-history.md` §3 (`⋯` menu contents, "Net per type"), §4 (HIST-P3-S1), §6 (AC-HIST-08). |
| **Why** | `YMW260903P0012` — an MV or Song could be shared before it was ever published; the link worked but pointed at content nobody else could see as "theirs" yet. |
| **Decision** | Product owner, 2026-09-11: **add the gate.** Share now only appears on an own mv/song row once `published` is true (reviewing/rejected count as not-published). **Community rows are unaffected** — they're already someone else's published content. Like stays ungated, as before. |
| **Code** | `HistoryView.tsx`'s `Menu` component, the Share `OptRow` condition. |
| **Scope note** | `CreatorProfile.tsx` has its own, separately-coded Share entry that is documented as mirroring `HistoryView`'s menu — **not touched in this pass**, flagged for the PM to confirm before extending the same gate there. |
| **Tests** | Not yet added — flagged for a follow-up pass. |
| **Contract** | None. |

---

## 2026-09-10 — Credit History display mapping contract

No prototype change. Added `areas/13-credit-history-display.md` from the product-provided
`ycm-credit-history.json` form.

| | |
| --- | --- |
| **Criteria** | New `AC-CD-01`–`AC-CD-08`: map record `feature_name` + `action_name` to `credit_detail_name_key` + `icon`, then localize the key. |
| **Fallback** | Product owner decision, 2026-09-10: a missing or empty locale value displays the same key's `enu` value. |
| **Contract fidelity** | Form identifiers remain exact and case-sensitive, including `ai_song_simpe_instrumental`, `revreate_scene_name`, and `prt`; the spec explicitly records their divergences from the existing billing/web locale contracts. |
| **Code / tests** | None — documentation-only by request; the prototype is unchanged. The spec includes a QA minimum test set for RD implementation. |

---

## 2026-09-10 — e2e triage: one criterion withdrawn, plus a spec/code divergence to settle

No feature work. The `npm run e2e` gate was failing **46 of 225** on the Windows dev machine, which
blocked the Stop hook in every session. Triaging it turned up one product decision to withdraw, one
divergence RD/QA need to know about, and a long tail of tests that had outlived decisions already
taken. **Only the two rows below change what the product is supposed to do**; everything else was a
test catching up with a decision the code had already implemented.

### `/song/play?id=` — "do not auto-play" is WITHDRAWN

| | |
| --- | --- |
| **Criteria** | Area 04 §3's `/song/play` deep-link note (the `P5-S1` block). The **"mark the row"** half stands; the **"do not auto-play"** half is withdrawn. |
| **Why** | It contradicted the 2026-08-13 rule still live in the code — `SongDetailView`'s `skipFirstAutoplayRef` makes an explicit `?id=` autoplay ("a real request for that song"). The code never stopped autoplaying, so the guard's "nothing is playing" half only passed when Chromium **refused** the unmuted `play()`. It was measuring browser policy, and it was flaky: 3 fails / 1 pass over four single-worker runs, at HEAD too. |
| **Decision** | Product owner, 2026-09-09: **2026-08-13 wins.** A deep link marks the row **and** autoplays, with the documented muted fallback where the browser refuses. |
| **Code** | Unchanged — this is the case where the CODE was right and two docs disagreed. |
| **Tests** | `2026-09-01: a /song/play deep link MARKS its row` (renamed; the media-playing assertions removed, marker assertions strengthened) in `e2e/behaviour-regressions.spec.ts`. Mutation-tested both ways. |
| **Contract** | None. |

### ✅ RESOLVED — `MV-13`: a published MV's Edit control is REMOVED, not relabelled

**Product owner ruling, 2026-09-10: the CODE is the source of truth. The spec was wrong.**

| | |
| --- | --- |
| **The rule now** | While an MV is **published or in review**, the **Edit MV control is removed entirely** from `/mv/result`'s actions row and from History's `⋯` menu. The **Publish toggle is the only way back to editable**; turning it off restores Edit MV. There is no "Unpublish to edit" affordance anywhere in the product. |
| **Was** | Both surfaces were specified to REPLACE Edit MV with a neutral (white bg / black text) **"Unpublish to edit"** action that unpublished on tap. That was superseded in code by the product owner on **2026-08-28** and never reached the specs. |
| **Criteria** | Area 02 — `MV-P4-S4`, `MV-E7`, `AC-MV-10`, the MV-P4 review checklist. Area 05 — the History `⋯` CTA-row rule, the "Net per type" table, and the `HIST-E2/E3/E7` checklist. `TBD-MV-13` keeps its ID; only its content moved. |
| **Code** | Unchanged, and already consistent across both surfaces: `MvResult.tsx` (`{!published && !pending && …}`) and `HistoryView.tsx` (`{isMv && !p.published && !p.reviewing && …}`). |
| **Tests** | `3i / MV-12 + MV-13` in `e2e/behaviour-regressions.spec.ts` asserts Edit MV is absent while published, that **no** "Unpublish to edit" control exists (so re-introducing it also fails), and that toggling Publish off restores Edit MV. |
| **Contract** | None. |

> **✅ Storyboards regenerated 2026-09-10 — `history` v2 → v3, `mv-edit` v1 → v2.** Sources,
> flowchart stamps, both `spec.html` / `spec-bundled.html` pairs and `specs/index.html` are
> rebuilt; `PLAN.md`'s S2-P8 / S4-P4 rows are corrected. **No screenshot needed re-taking** —
> `21_menu_mv_reviewing.png` was captured 2026-09-02, after the 2026-08-28 behaviour change,
> and already showed the menu with no Edit MV entry. Only the prose had been stale.

### ✅ RESOLVED — `TBD-HIST-05`: the review-REJECTED state exists (and review is no longer terminal)

**Found 2026-09-10 while re-reading S4's flowchart for the MV-13 fix. It had been answered on
2026-08-28 and both the area spec and the storyboard still said "not built".**

| | |
| --- | --- |
| **Was** | area 05 §Publish: "there is no REJECTED state · `confirmPublishMv()` sets `reviewing: true, published: true` in the same write and nothing ever moves `reviewing` back to `false` on its own · flagged, not built". S4's `open_questions` carried the same question, and its flowchart drew review as one terminal `reviewing + published` node. |
| **As built** (`25fa0f0`, 2026-08-28) | `confirmPublishMv()` writes `reviewing: true, **published: false**` and toasts "Submitted for review", then resolves **itself** after `PUBLISH_REVIEW_DELAY_MS` (2500 ms) into **approved** (`published: true`) or **REJECTED** (`rejectReason` set, row back to unpublished). All three of the old clauses are false. |
| **Three menu states, not two** | pending → `ic_timer`, "Publish (Review)", toggle **OFF** · approved → "Publish", toggle ON · rejected → **"Publish (Rejected)"** in red plus a reason line, toggle OFF. |
| **Contract** | ⚠️ **Relevant to RD:** the seven reason codes are `PUBLISH_REJECT_CODES` (`src/lib/publishReview.ts`). Decided 2026-08-27: **the backend returns the enum, the front end owns the copy** — so RD implements those seven values and maps anything else to `UNKNOWN` rather than rendering it raw. |
| **Reachability** | Only through the `?demo=1` panel's `publishRejected` / `rejectReason` flags — a backend-less prototype has no real moderator. Not captured in S4; a capture would need that query armed, so it is left for a later re-capture. |
| **Code / tests** | Unchanged — this row is the spec catching up with code that shipped two weeks ago. |

### Tests that were pinning superseded decisions (no criterion moved)

Recorded so nobody re-derives them. Each was red because a **product decision had already changed**
and the guard still described the old behaviour — the failure mode this repo's error log lists three
times over. All are in `e2e/behaviour-regressions.spec.ts` unless noted.

| Decision that moved | When | Test that was still asserting the old one |
| --- | --- | --- |
| `/explore/songs` tabs = "All" + the nine creation `GENRES` (was New Releases / Top Picks) | 2026-09-01 | `3b: ?tab= …`, `3b: switching a browse filter …`, `3b: a tab switch changes the list`, `3b / EXP-09` |
| Row-wide click: `ListItem`/`TopSongListItem` titles became plain `<p>`, `onSelect` moved to the row | 2026-08-11 | `landing page: a New Songs row splits …` (also asserted the phone route at 1440), `3b / EXP-09` |
| `SongPlayBar` is always mounted; `open` parks it off-screen instead of unmounting | 2026-08-14 | `drop 2 desktop: the album art previews in place …` (its "no bar" check had been passing only by racing hydration) |
| "layer 1": `MobileTabBar` only on Home + `/history`; every other route gets its own back+title bar | 2026-08-22 | `A4: a navbar with no tabs …`, `A5: a mobile tab-bar destination …`, `drop 2 / A4: the song screen …` |
| `/history` stopped mounting `MobileHeader`; `RoomNavbar` absorbs it via `mobileHeaderActions` | 2026-08-23 | `R12 shell: just below the cutover …`, `S13 mobile IA: the bar is Explore …`, `A4: the override restores the tabs row …` (premise inverted) |
| `/explore/songs`' Top Picks rail + heading/tabs are shown at **every** width | 2026-08-19 | `drop 2 / A4: the song screen …` — and a stale comment in `SongDetailView.tsx`, corrected here |
| Muse Pro row's pill: `badge--purple` "Subscribe/Manage" → `.button--secondary` "Upgrade"; none when subscribed | 2026-08-14 | `3c / G7-1: the Muse Pro row …` |
| Subscription plans: 6 plans / 3 cadences behind a `DurationTabs` tablist (was 3 cards at once); `$9.99` is now a real WA price | — | `3f / S20: the plan prices are WA's …` — rewritten data-driven over `SUBSCRIPTION_PLANS`; mutation-tested by re-introducing DP's hardcoded `/ week` |
| Character Image folded into the Visual Style section (`--char-image` modifier deleted) | 2026-08-14 | `3h: both stages render DP's blocks …` |
| Storyboard render cost is `COST_FROM_SCRIPT` 35 + a per-**second** rate, not a flat 200 | spec 11 §3.4 | `3h / GL-01: the storyboard CTA …` (also hit `FloatingCTA`'s two copies of its children) |
| `EnhanceButton`'s chooser is a `DpDialog`; the button never had `aria-expanded` | 2026-08-25 | `Custom Enhance opens the two-mode menu …` (also used class names that never existed) |

Two more were not stale but **environmental / fixture-order**: six `renderToResult` callers and two
`3h` tests never funded the account, so every one of them died at the IAP paywall after
`DEFAULT_CREDITS` dropped 390 → 10 on 2026-08-12 (`mv-flow.spec.ts` was fixed for this and says so;
these were missed); and `G5-d#8 publish` took the FIRST history row, which became a **song** when
`a523f05` inserted the `h-neon-static` fixture at the top — only an MV opens the publish confirm.

## 2026-09-09 — three product-owner bug reports

Commit `a523f05`. All three were reported against the running prototype. **One contract change between
them** (`SongResult.lyricsLrc`); the other two are behaviour-only.

### `YMW260902P0002` — `/watch` played muted

| | |
| --- | --- |
| **Criteria** | **`AC-EXP-04`** changed (area 04). Was "play the MV **muted**"; now "play the MV **with sound on**", plus a new fallback clause. |
| **Storyboard** | **S8 Explore & Community v2** → `P4-S1`. Screenshot 16 predates the change and is flagged in that step. |
| **Also** | area 04 §2 route table, §3.3, `EXP-P4-S1`, and the EXP-P4 review checklist line. |
| **Code** | `src/components/community/CommunityMvPlayer.tsx` — the `muted` state's default and the new `startPlayback()`. |
| **Tests** | `e2e/watch-autoplay-sound.spec.ts` (the sound-on default — its own spec file, see below) · `YMW260902P0002: when autoplay-with-sound is REFUSED, the MV still plays` in `e2e/behaviour-regressions.spec.ts` (the fallback). |
| **Contract** | None. |

**The fallback clause is the part to read before testing this.** A browser only permits autoplay *with
sound* while the document has user activation, and the click that opened `/watch` belongs to the
*previous* document — it does not carry across a navigation. So an unmuted `play()` can be refused, and
the criterion now says what happens then: the player mutes, keeps playing, and the mute control
reflects it. **It never leaves the video paused**, which would be worse than the reported bug.

Two consequences for QA:

- **Behaviour is legitimately environment-dependent.** On a browser that refuses (a cold profile, a
  first visit) you may correctly see a muted-but-playing video with the control offering "Unmute". That
  is the fallback, not the bug. The bug was a *paused-or-silent* video whose control offered "Unmute"
  and never played with sound after you pressed it.
- **Only the CURRENT video is unmuted.** `/watch` keeps three permanently-mounted `<video>` slots for
  the swipe feed; the two off-screen neighbours stay muted by design, or three tracks would play at
  once. Asserted separately in `watch-autoplay-sound.spec.ts`.

### `YMW260903P0005` — a lyric line could not be clicked to seek

| | |
| --- | --- |
| **Criteria** | **`AC-SONG-18` NEW** (area 03). Also `AC-EXP-05` and `SONG-P3-S2` / `EXP-P5-S1` amended to name it. |
| **Storyboard** | **S1 AI Song Creation v4** → `P2-S11` (desktop inline panel), `P7-S3` (Lyrics sheet). |
| **Code** | `src/lib/mv/lyrics.ts` (`parseLrc`, `timedLyrics`) · `src/components/ui/LyricsSheet.tsx` · `src/components/song/SongResultView.tsx` · `src/components/song/SongDetailView.tsx` · `src/styles/lyric-seek.css`. |
| **Fixtures** | `src/lib/mv/community.ts` (`NEON_STATIC_LRC`, `lyricsLrcForTitle`, `timedSongAudio`) · `src/lib/mv/mock.ts` (`h-neon-static`) · `public/assets/songs/Neon Static.mp3` · `public/assets/images/album-art/album_neon_static.png`. |
| **Tests** | five `YMW260903P0005` cases in `e2e/behaviour-regressions.spec.ts` · `src/lib/mv/lyrics.test.ts`. |
| **Contract** | ✅ **YES — `SongResult.lyricsLrc`.** See `../docs/CHANGELOG-RD.md` 2026-09-09 for the one field RD must populate. |

**Where the timestamps come from, because there are two sources and they are not equivalent:**

- **Real** per-line timing, where the result carries it — `SongResult.lyricsLrc`, the LRC block the AI
  Song backend already returns as `timestamps.lyrics_lrc_timestamps`.
- **Derived** timing otherwise — the lines spread evenly across the track duration. Not new: this is
  what has always driven the current-line highlight.

**Click-to-seek is offered on every song, not only timed ones.** The highlight already asserts a
line↔time correspondence on an untimed song, so seeking to the same estimate is consistent with what
the screen is already showing; withholding the control would leave the reported bug in place for every
song a user actually generates. What real timing changes is *accuracy*.

**🔒 In the prototype exactly ONE song has real timing** — the vendored `Neon Static` sample the product
owner supplied (audio, cover and LRC). Two ways to reach it:

- as the signed-in user's own creation — `/history` or the `/song/create` rail → `/song/result?id=h-neon-static`
- as a catalog song — `/explore/songs` → `/song/result?id=sp-neon-static&from=song-detail`, or `/song/play?id=sp-neon-static` on a phone

It plays its **own** mp3, not one of the two shared demo tracks: cues measured against one track land
on the wrong beats of another.

**Where an LRC exists it is also what gets DISPLAYED**, and the sung lines differ from the written ones
on purpose — `Neon Static` sings "System failing / Pulse is low" as two lines, adds a "Go, go, go…"
ad-lib that is in no written line, contracts "There is" to "There's", and drops the
`[intro]`/`[verse]`/`[chorus]` tags. **So the same song can show a different line count in the lyrics
panel than in the lyrics you typed. That is specified, not a defect.**

**No pixels moved.** The lines became `<button>`s styled back to their exact previous appearance
(`lyric-seek.css` is a reset only), so the visual baselines are unchanged and the storyboard
screenshots are still accurate about how the panel *looks* — and silent about the new affordance.
Hover / press / focus states have no design yet: `../docs/DESIGNER-TODO.md` **A31**.

### `YMW260902P0013` — the song page's rail showed Trending where the MV page showed My Creations

| | |
| --- | --- |
| **Criteria** | **`AC-SONG-19` NEW** (area 03) and **`AC-MV-21` NEW** (area 02). The full reasoning is written once, in `AC-SONG-19`. |
| **Storyboard** | **S1 AI Song Creation v4** → `P6-S1`; **S2 AI Music Video Creation v4** → `P7-S1`, `P7-S2`. ⚠️ S2's screenshot 32 is now stale — flagged in that step. |
| **Also** | `MV-P1-S0` (area 02) and `SONG-P1-S0` (area 03) route-step rows; `SHELL-E1` (area 01 §5) gains a second surface. |
| **Code** | `src/components/history/useMyCreations.ts` **NEW** · `src/components/mv/MvRoom.tsx` · `src/components/song/SongCompose.tsx`. |
| **Tests** | `YMW260902P0013: signed in, BOTH create rails show My Creations` · `… signed OUT, both create rails still fall back to Trending` · `items 4/5: generating a song adds it to /song/create's rail` · `3g / R9` and `G7 3g-3` rewritten. |
| **Contract** | None. `useMyCreations` is a plain hook, **not** a C4 provider — no provider return key changed. |

**What the defect actually was, because the diagnosis is counter-intuitive.** The two rails were already
running *identical* code over the *same* source: the session-local `HistoryProvider`, which starts
**empty**. So a signed-in user saw "My Creations" on whichever create screen they had just generated
something on, and "Trending" on the other. The reporter had made an MV and no song. **The code was the
same and the data was lopsided** — there was never a difference between the two screens to find.

Both rails now read `useMyCreations()`: live session jobs **merged with the same
seeded creations `/history` has always shown**. Two exclusions, and both matter for testing:

- `status: "done"` only — a rail row navigates straight to a result screen, so a processing or failed
  row has nothing to open.
- `source: "community"` excluded — `h-whispers-past` is a community song that appears in History, not
  something the user made, and a rail titled "My Creations" must not claim it.

The "has at least one creation" condition **survives**, but only to keep a signed-**out** visitor on
Trending. (`/mv/room` is not auth-guarded — it is the marketing navbar's "Start for Free" destination —
so that state is reachable.) DP's literal `isSignedIn` plus an empty-state card was shipped and
reverted on 2026-08-07: a "My Creations" heading over a blank card read as broken rather than empty.

**One known, unfixed side effect, now visible.** The rail flashes the signed-out branch for a frame on a
signed-in reload, because every route is prerendered with `authStore.getServerSnapshot() === false`.
This is **`SHELL-E1`**, the same pre-hydration swap the navbar's Login ↔ credit-pill has — it was
invisible here only because both branches used to render the same thing. A backend-less prototype has
no server-side auth to fix it with. Recorded in area 01 §5, **not** worked around. If you write an
automated check against these rails, assert the rail's title before counting its rows.

---

## Notes for whoever adds the next row

- **Name the IDs, not the screens.** "the rail changed" costs the reader a search; "`AC-MV-21`,
  `P7-S1`" does not.
- **Say when there is no contract change**, explicitly. "Contract: none" is information; an absent row
  is ambiguous, and `CHANGELOG-RD.md` makes the same demand for the same reason.
- **Bump the storyboard's `version` when its content changes** and badge the changed steps with
  `since: 'vN'`. The version bump is enforced: `spec_builder` fails the build if the flowchart's
  `matches spec vN` stamp does not move with it, which is what forces someone to re-read the diagram.
  Then update that storyboard's row in `build-index.py`'s `STORYBOARDS` list so the index shows the
  new version, and re-run `python specs/build-index.py`.
- **Flag a stale screenshot in the step itself**, not only here. A reader who opens the storyboard
  should not have to have read this file first.
