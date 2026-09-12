# YouCam Muse Web — eBugs to Fix (pulled 2026-09-11)

Source: ePF eBug UI (`https://eperfect.perfectcorp.com/IF3/ebug/BPM/Start/SearchRequest/Query`),
cross-checked against `TSR.EbugSearch`, filtered:
- Product: **YouCam Muse Web** (ProductID 315)
- Project: All Project
- Belongs to: **PM**
- Status: **NewCreated, Assigned**

Result: **11 bugs**, all currently `NewCreated`. Handler on all 11 is `JASON_CHEN`.

**Final status (2026-09-11):**

| # | Bug | Status |
|---|-----|--------|
| 1 | YMW260910P0011 | ⏸️ Not touched — you're having someone else handle it |
| 2 | YMW260910P0010 | ⏸️ Not touched — already fixed previously; you'll reply to the eBug directly |
| 3 | YMW260910P0006 | ✅ Fixed 2026-09-12, spec updated, confirmed live |
| 4 | YMW260910P0001 | ✅ Fixed, spec updated, confirmed live |
| 5 | YMW260909P0009 | ✅ Fixed 2026-09-12 — spec screenshot re-captured with clearer annotation |
| 6 | YMW260909P0008 | ✅ Fixed, spec updated, confirmed live |
| 7 | YMW260909P0003 | ✅ Fixed, confirmed live |
| 8 | YMW260907P0012 | ✅ Fixed (root cause found); can't confirm on real iOS from here |
| 9 | YMW260903P0012 | ✅ Fixed, spec updated, confirmed live |
| 10 | YMW260903P0005 | ✅ Fixed, confirmed live (one caveat noted) |
| 11 | YMW260903P0001 | ⏸️ Skipped — you're discussing this directly with RD |

`typecheck` / `lint` / `test:run` / `build` are all green throughout.

---

## [ ] 1. YMW260910P0011 — not touched
**Short Description:** [Home][Mobile] MV list of Trending MV "See all" page is inconsistent with mockup

You said: *"這張不要動，我請其他人處理"* (don't touch this, someone else will handle it). Left as-is.
For the record, the reason I'd flagged it: `specs/areas/04-explore-community.md` already documents
"Top Picks Music Videos" / "Newly Released Music Videos" as a deliberate rename to match the
designer prototype (DESIGNER-TODO A19/A20, asserted in e2e) — whoever picks this up should read
that section first, since it isn't simply "rename the label back."

---

## [ ] 2. YMW260910P0010 — not touched, you're replying directly
**Short Description:** [AI Music Video] "Unpublish to edit" does not remove while mv had published.

You said this was already fixed in a previous session and you'll reply to the eBug directly. No
code change made. For the record: a 2026-08-28 decision (recorded in `MvResult.tsx`,
`HistoryView.tsx`, `CreatorProfile.tsx`) replaced "Unpublish to edit" everywhere — Edit MV now just
disappears while published/in-review, and the Publish toggle is the only way back to editable.
There's no "Unpublish to edit" control left to reproduce this bug against.

---

## [x] 3. YMW260910P0006 — ✅ FIXED, confirmed live
**Short Description:** [History] Shows additional avatar on sharing music link.

**Your 2026-09-12 decision:** show the avatar on every shared song link — you confirmed
`share?id=h-golden-hour` was the one actually missing it, which is what earlier investigation
(comparing it against `sp-neon-static`, which had one) had flagged as the discrepancy but stopped
short of diagnosing.

- **Root cause:** [share.ts](src/lib/share.ts)'s `resolveShare()` has four resolution branches —
  community MV fixture, community song fixture, the user's own completed History item, and static
  `HISTORY_SAMPLES`. Only the two COMMUNITY branches ever set `creator`; the two HISTORY-derived
  branches (own creation, static sample) never did. `SongPanel`'s creator row (avatar + name) is
  conditional on `media.creator` being present, so any song shared from either History-derived
  branch silently rendered with no creator row at all. `h-golden-hour` is a `HISTORY_SAMPLES` id —
  exactly the branch that omitted it.
- **Fix:** both branches now set `creator: MOCK_USER.name` — the same attribution `/history`
  already shows for these exact rows ("Golden Hour / Scott Wu").
- Spec updated: `specs/areas/10-share.md` §3; recorded in `specs/CHANGELOG-SPEC.md`.
- **Confirmed live:** `/share?id=h-golden-hour` now shows the avatar + "Scott Wu", where it
  previously showed nothing.
- **Scope note:** this only affects `SongPanel` — `MvPanel` never renders a creator row at all
  (settled as deliberate per this spec's own D-11-adjacent note, "a music video usually carries its
  own title on screen"), so MV share links are unaffected and unchanged.

---

## [x] 4. YMW260910P0001 — ✅ FIXED, confirmed live
**Short Description:** [Feedback][Account] 點MV or Song這兩顆本來是導去Creator page；要改成導到History page

**Your decision:** MVs/Songs stat pills → History (their own tab); photo/username identity link
stays on the public Creator profile.

- [ProfileView.tsx](src/components/profile/ProfileView.tsx): MVs/Songs pill hrefs changed from
  `/creator?self=1&tab=mv|songs` to `/history?tab=mv|songs`. Identity block (photo/name/email)
  unchanged — still `/creator?self=1`.
- [HistoryView.tsx](src/components/history/HistoryView.tsx): now reads `?tab=mv|songs` once on
  first render to seed the active filter (same one-time-seed convention `CreatorProfile` already
  uses for its own `?tab=`).
- [app/[locale]/history/page.tsx](src/app/[locale]/history/page.tsx): wrapped in `<Suspense>` for
  the new `useSearchParams()` read.
- Spec updated: `specs/areas/06-profile-account.md` (stat tiles, PROF-P1-S2, AC-PROF-02, flowchart,
  decisions summary) and `specs/areas/05-history.md` (new entry-point note). Recorded in
  `specs/CHANGELOG-SPEC.md`.
- **Confirmed live:** clicked "3 MVs" and "2 Songs" on `/profile` — both land on `/history` with
  the correct tab pre-selected (screenshots taken during this session).
- **Noted, not fixed (out of scope):** the pill's *count* still comes from the static
  `SAMPLE_CREATIONS` fixture, not the same live+seed list History now opens — that mismatch existed
  before too (just less visible), flagged in the spec rather than silently fixed.

---

## [x] 5. YMW260909P0009 — ✅ FIXED (spec clarity, no behavior change), confirmed
**Short Description:** [EXPLORE COMMUNITY] Signed-out creation action bypasses the sign-in gate

**Reopened 2026-09-12.** You identified the actual root cause: QA misread this exact storyboard
screenshot (`specs/storyboards/explore-community`, step **P1-S8**,
`08_guest_toolcard_gated.png`) as "entering the creation page shows a sign-in dialog", when the
real (and correctly-implemented) rule is "pressing a create card on Home opens the gate without
navigating" (`AC-EXP-02`/`AC-EXP-08`) — confirmed unchanged and correct by re-reading
`capture_screenshots.py`'s own capture steps. You chose **"re-capture with clearer annotation"**:
same screen, same behavior, but make the trigger visually unambiguous.

- [capture_screenshots.py](specs/storyboards/explore-community/capture_screenshots.py): the shot
  now uses `multi_focus` with TWO labeled frames instead of one — the tool-selector card that was
  actually pressed (still visible, dimmed, behind the modal backdrop) gets its own box and label
  ("...still on Home, not a route"), alongside the existing modal frame.
- Re-captured live against a running dev server (`CHROMIUM_PATH` pointed at an installed build
  since the pinned one wasn't present, per `AGENTS.md`'s own escape hatch) and rebuilt
  `spec.html`/`spec-bundled.html`. `user-flowchart.svg`'s version stamp and `build_spec.py`'s
  header/changelog bumped to **v3** (2026-09-12) — the validator requires the stamp to match the
  spec version; no path or step actually moved, confirmed by a near-zero SVG diff (1 line, the
  stamp text only).
- `specs/index.html` regenerated to pick up this and the same-day P0006/P0008/P0020 spec edits.
- **Verified via direct DOM/computed-style inspection** (both `.fbox` annotation elements present
  at the recorded coordinates, image loaded at full resolution) — the Browser pane's screenshot
  tool would not paint this specific scroll depth for a visual check, a pane-side quirk unrelated
  to the content.
- **No app code changed** — `AC-EXP-02`/`AC-EXP-08` and the gate itself are untouched; this was a
  documentation-clarity fix only.

---

## [x] 6. YMW260909P0008 — ✅ FIXED, confirmed live
**Short Description:** [EXPLORE COMMUNITY] Home rail Next advances three cards instead of one

**Your decision:** the RD build's faster multi-card step is the one to keep — the 1-card step read
as too slow.

- [MvGridSections.tsx](src/components/community/MvGridSections.tsx): `scrollByCard` now steps by
  the row's full visible width (`row.clientWidth`, a "page" per click) instead of one card + gap.
- Spec updated in `specs/areas/04-explore-community.md`; recorded in `specs/CHANGELOG-SPEC.md`.
- **Confirmed live** on `/explore/mvs`: one click on Next moves `scrollLeft` to exactly
  `clientWidth` (measured 905px → 905.33px after the click settled).

---

## [x] 7. YMW260909P0003 — ✅ FIXED, confirmed live
**Short Description:** [UI][Mobile] Dialog top handle cannot be dragged down to close

- [MvSheet.tsx](src/components/mv/MvSheet.tsx): the shared bottom-sheet shell now tracks a pointer
  drag on `.mv-sheet__handle` — follows the finger via an imperative `transform`, commits the close
  past 25% of the sheet's own height (continuing the same downward motion), springs back short of
  that. Fixes every sheet built on `MvSheet` at once (Trim Audio, Song Picker, Mode, Settings...).
- **Confirmed live** on the Trim Audio sheet: a simulated 150px drag (> 25% of its ~385px height)
  correctly closed it (`inert` flipped true, `transform: translateY(100%)`); a 30px drag correctly
  sprang back open (`inert` stayed false, inline transform cleared).

---

## [x] 8. YMW260907P0012 — ✅ FIXED (root cause confirmed); can't verify on real iOS here
**Short Description:** [Community][Mobile] Video full screen mode cannot be triggered

- **Root cause:** iOS Safari has no Fullscreen API for a plain container `<div>` — only `<video>`
  exposes the non-standard `webkitEnterFullscreen()`. `container.requestFullscreen()` either
  doesn't exist or silently rejects there, which is exactly what an iPhone 15 Plus repro would show.
- [`toggleMvFullscreen`](src/lib/fullscreen.ts): new shared helper tries the standard API first,
  falls back to the video element's `webkitEnterFullscreen()`. Wired into
  [CommunityMvPlayer.tsx](src/components/community/CommunityMvPlayer.tsx) (`/watch`) and
  [MvPreviewCard.tsx](src/components/community/MvPreviewCard.tsx) (Home inline preview).
- **Cannot confirm from this session** — this machine's Chrome already supports the standard
  Fullscreen API, so it never exercises the iOS-specific fallback path. Please verify on an actual
  iPhone/iOS device or simulator.

---

## [x] 9. YMW260903P0012 — ✅ FIXED, confirmed live
**Short Description:** [History] MV and song can be shared when they are not published

**Your decision:** add the gating — Share only once published.

- [HistoryView.tsx](src/components/history/HistoryView.tsx)'s `Menu`: Share now only renders for an
  own mv/song row once `published` is true (reviewing/rejected count as not-published); community
  rows are unaffected (already someone else's published content); Like stays ungated, unchanged.
- Spec updated in `specs/areas/05-history.md` (§3 menu contents, HIST-P3-S1, AC-HIST-08); recorded
  in `specs/CHANGELOG-SPEC.md`.
- **Scope note:** `CreatorProfile.tsx` (`/creator?self=1`, the public profile) has its own,
  separately-coded Share entry that's documented as mirroring History's menu — **not touched**,
  since the bug and your approval were both specifically about History. Flag me if you want the
  same gate applied there for consistency.
- **Confirmed live:** opened the `⋯` menu on an unpublished song — no Share option (Like/Publish/
  Download/Delete only). Toggled Publish on, reopened the menu — Share appeared, Delete correctly
  disappeared.

---

## [x] 10. YMW260903P0005 — ✅ FIXED, confirmed live (one caveat)
**Short Description:** [AI Music Video] Can't click and jump to a specific timestamp

You said your earlier "Prototype update" comment was wrong — it's still broken. Confirmed: the Trim
Audio waveform had drag handles for the trim range but no click-to-seek at all.

- [TrimAudioModal.tsx](src/components/mv/TrimAudioModal.tsx): added a click handler on the waveform
  track that computes the clicked position and calls `useAudioPlayer`'s existing (but previously
  unused) `seek()`; clicks landing on a handle are ignored so dragging still works.
- **Confirmed live:** clicking at 40% and 70% across the waveform moved the playhead to ~40%/~70%
  correctly.
- **Caveat found while testing, not introduced by this fix:** clicking close enough to the very END
  of the trim selection (so the seek clamps to exactly the trim end) snaps the playhead back to the
  trim START instead. That's `useAudioPlayer`'s existing "reached end of clip, loop to start"
  `timeupdate` handler firing — built for playback naturally reaching the end, not an explicit
  click-seek. It's a pre-existing interaction I didn't write, and fixing it means touching shared
  playback logic used elsewhere, so I left it alone rather than change more than this bug asked for.
  Flag me if you want that edge case addressed too.

---

## [ ] 11. YMW260903P0001 — skipped, per your instruction
**Short Description:** [AI Song] Generate an AI song failed

You're discussing this directly with RD. Not touched. For the record: RD (IVAN_LIM) already
root-caused it (OpenAI flagged the generated lyrics as copyrighted content) and shipped
`error_nsfw_content_detected`
([commit](https://github.com/perfect-corp/MTAudio/commit/0ab65e31fff1bd60d3eb697402294e7469ba08ab));
the open ask from SMITH_LEE was for PM to specify the user-facing behavior for that error.

---

# Re-pull (same day, 2026-09-11) — 8 new eBugs

Re-queried `TSR.EbugSearch` (same filters) at your request ("又有新的bug，請上網頁重新撈下來"). Of
12 currently-open PM bugs, 8 are new since the pull above (the other 4 — P0006/P0009/P0010 unchanged
below; the rest of the original 11 have moved off NewCreated/Assigned since being fixed/decided).

**Result:**

| # | Bug | Status |
|---|-----|--------|
| 1 | YMW260910P0008 | ✅ Spec corrected (2026-09-12 decision); no code change |
| 2 | YMW260910P0020 | ✅ Fixed (Retry removed), spec updated, confirmed live |
| 3 | YMW260910P0021 | ✅ Fixed, spec updated, confirmed live |
| 4 | YMW260910P0022 | ✅ Fixed, spec updated, confirmed live |
| 5 | YMW260911P0003 | ⏸️ Deferred to designer, per your instruction — not touched |
| 6 | YMW260911P0004 | ✅ Fixed (loading fallback added) |
| 7 | YMW260911P0005 | ✅ Fixed, spec updated, confirmed live |
| 8 | YMW260911P0007 | ✅ Fixed, spec updated, confirmed live |

`typecheck` / `lint` / `test:run` / `build` are all green throughout both passes. Not committed
(per your instruction).

---

## [x] 1. YMW260910P0008 — ✅ spec corrected, per your 2026-09-12 decision
**Short Description:** [EXPLORE COMMUNITY] Create MV handoff omits matched song and title

I had flagged that the code (`CommunityMvPlayer.tsx`'s `createMv()`, since 2026-08-05) actually
prefills matched song + title too, live-verified, contradicting the eBug and your own earlier
comment. You reaffirmed 2026-09-12: **V1 only carries prompt + video type; spec needs updating** —
so this is the decided scope regardless of what the demo currently shows.

- Spec updated: `specs/areas/04-explore-community.md` §3.3 (`/watch` MV player row) now states V1's
  intended scope (prompt + type only) as the primary line, with an inline note recording that the
  current mock/prototype code still prefills the matched song + title too (unchanged — nobody
  asked for that to be removed) so the two don't silently drift back into agreement unnoticed.
- **No code change** — `createMv()` is untouched. If you want the demo brought down to match V1's
  reduced scope exactly, that's a separate ask.
- Recorded in `specs/CHANGELOG-SPEC.md`.

---

## [x] 2. YMW260910P0020 — ✅ FIXED (Retry removed), confirmed live
**Short Description:** [AI Song] UI for failed to generate AI song is inconsistent with mockup

Your 2026-09-12 instruction: **remove the Retry button from the prototype and spec.**

- [SongGenerationScreen.tsx](src/components/song/SongGenerationScreen.tsx): the failure state's
  Retry button (and its container) is removed; the subtitle copy no longer says "you can retry
  now". The screen now offers **Back** only — matching the precedent already set on the MV
  storyboard's own failure screen (`e2e`'s `G5-d#5`, product owner, 2026-09-02, same reasoning: a
  `[fail]` compose always re-fails deterministically, so Retry was a dead-end affordance).
- Spec updated: `specs/areas/03-song-creation.md` §5 (SONG-E1); recorded in
  `specs/CHANGELOG-SPEC.md`.
- **Confirmed live:** `/song/create` → Simple → `[fail] ...` → Create Song → the failure screen
  shows "Generation Failed" + the updated message + a single **Back** button, no Retry.
- **Not addressed (out of scope, per SMITH_LEE's own ticket comment):** the back-button question is
  tracked in a different eBug; "Description is different" (exact copy vs. the mockup image) wasn't
  re-checked, since your instruction only named Retry.

---

## [x] 3. YMW260910P0021 — ✅ FIXED, confirmed live
**Short Description:** [Alice Feedback] AI Song 預設Tab 改成 Custom，另外把Custom 跟 Simple Tab 位置對調

- [types.ts](src/lib/mv/types.ts): `DEFAULT_SONG_COMPOSE.mode` → `"custom"` (was `"simple"`).
- [SongCompose.tsx](src/components/song/SongCompose.tsx): tab row now maps `["custom", "simple"]`
  (was `["simple", "custom"]`) — a straight swap of DP's order, not a rename.
- Spec updated: `specs/areas/03-song-creation.md` (SONG-P1-S1, AC-SONG-01, the §4 decisions
  paragraph); recorded in `specs/CHANGELOG-SPEC.md`.
- **Scope note:** this default flip broke the *implicit* assumption in 11 e2e tests (they went
  straight to `/song/create` and filled the Simple placeholder with no tab click). All 11 in
  `e2e/behaviour-regressions.spec.ts` plus 1 in `e2e/song-flow.spec.ts` now explicitly select
  **Simple** before touching it — same behavior under test, just no longer relying on which tab
  happens to be first.
- **Confirmed live:** `/song/create` opens on **Custom** (LYRICS/IDEA, STYLE, GENRE/MOOD/VOCAL,
  SONG TITLE all visible by default; Create Song shows "6" and is enabled), Simple is the second tab.
- **Not evaluated:** `npm run e2e` itself (per `AGENTS.md` — the Stop hook owns that run); the visual
  baseline for `/song/create` will need re-recording since the default screen changed (flagged, not
  done, per the same rule other slices have followed).

---

## [x] 4. YMW260910P0022 — ✅ FIXED, confirmed live
**Short Description:** [Feedback] Explore/ Trending MV/ Top Picked Songs 無需標示HOT tag

- [community.ts](src/lib/mv/community.ts): all 5 `badge: "HOT"` fixture rows → `badge: null`.
  `"NEW"` badges are untouched. This is the single shared fixture file every HOT/NEW-showing rail
  (Home's Trending MVs / Top Picks Songs, `/explore/mvs`, `/explore/songs`) reads from, so one
  data-level change covers all of them — no component code changed.
- Spec note added in `specs/areas/04-explore-community.md`; recorded in `specs/CHANGELOG-SPEC.md`.
- **Confirmed live** on `/`: the card that showed the "HOT" pill now shows no badge at all; the
  adjacent "NEW" card is unchanged.

---

## [ ] 5. YMW260911P0003 — deferred to designer, per your instruction
**Short Description:** [AI Song][Mobile] Volume adjustment is only available in History's song

You said: *"我們現在不用處理，會請designer調整"* (no need to handle this now, will have the
designer adjust it). Left as-is — no code or spec change. For the record: the ticket's own Expected
Result was a question ("please check if this needs to be synced or is expected behavior"), not a
defect with a known answer, which is why this was flagged rather than guessed at.

---

## [x] 6. YMW260911P0004 — ✅ FIXED
**Short Description:** [AI Music Video] Display gray without any loading animation after pressing F5 or switching tab between AI Music Video and AI Songs.

- **Root cause:** no route in the tree had a `loading.tsx`, so Next.js had no fallback UI to show
  while a route's JS streamed in on a slow load or a segment switch — just whatever the page
  background happens to be, with nothing on it.
- [app/[locale]/loading.tsx](src/app/[locale]/loading.tsx): one shared spinner (existing
  `--accent` token, no new visual asset) covering every route under the locale segment, rather than
  one per screen.
- Spec note added in `specs/CHANGELOG-SPEC.md` (cross-cutting, not tied to one area's spec).
- **Not verified with a slow-load repro** — this needs network throttling deep enough to observe
  the fallback actually mount, which wasn't practical to stage reliably in this session; the
  typecheck/build passing confirms the file is wired into the route tree correctly. Flag me if you
  want it checked with DevTools throttling before you consider this closed.

---

## [x] 7. YMW260911P0005 — ✅ FIXED, confirmed live
**Short Description:** [History] Title of generating MV shows "Untitled Creation" which is not sync with Songs.

- **Root cause:** `MvFlowProvider`'s `upsertGenerating` built the History row's title as
  `compose.song?.title ?? "Untitled MV"` — the SOURCE SONG's title, never the user's own "MV TITLE"
  setting (`compose.settings.title.text`, the field in MV Settings). A generating SONG's row already
  used the real generated title; a generating MV's row never could, no matter what the user typed
  into the MV name field.
- [types.ts](src/lib/mv/types.ts): new `mvDisplayTitle(compose)` helper — `settings.title.text ||
  song?.title || "Untitled MV"` — mirrors the precedence the mock backend's own storyboard snapshot
  already used, so History and the storyboard now agree.
- [MvFlowProvider.tsx](src/components/providers/MvFlowProvider.tsx): both `upsertGenerating` calls
  (`startStoryboard`, `startRender`) now use it.
- Spec updated in `specs/CHANGELOG-SPEC.md`.
- **Confirmed live:** set a custom MV name ("My Custom MV Name P0005") in Settings, generated with a
  different song ("Summer Vibes") attached — the History "Generating…" card showed the custom name,
  not the song's.

---

## [x] 8. YMW260911P0007 — ✅ FIXED, confirmed live
**Short Description:** [AI Music Video] Character always shows "—".

- **Root cause:** the Character detail row on `/mv/result` reads `compose.photos.length`, but
  `useOpenCreation.ts` (what seeds the flow when a History row or a "My Creations" rail item is
  opened) never reconstructs `photos` — it can't, the actual uploaded images aren't persisted
  anywhere. So **any** MV opened from History showed "—" for Character regardless of whether
  character photos were used at creation time, which is exactly what "select any MV to check
  result" would show. The row isn't dead — it does reflect real state for a fresh, in-session
  result — it's just that reopening one from History always destroyed the information.
- [HistoryProvider.tsx](src/components/providers/HistoryProvider.tsx): new optional
  `HistoryItem.photoCount` field (additive).
- [MvFlowProvider.tsx](src/components/providers/MvFlowProvider.tsx): both `upsertGenerating` calls
  now pass `photoCount: compose.photos.length`.
- [MvResult.tsx](src/components/mv/MvResult.tsx): Character row now reads
  `entry?.photoCount ?? compose.photos.length` — the persisted count when opened from History, the
  live array otherwise.
- Spec updated in `specs/CHANGELOG-SPEC.md`.
- **Confirmed live:** generated an MV with 2 character photos and a custom name, then opened it from
  the History rail — Character correctly read **"2"**, not "—".
- **Noted, not fixed (separate, pre-existing, out of scope):** reopening an MV from History also
  shows the MV's own title in the "Music" detail row instead of the original matched song's title
  — `useOpenCreation`'s reseeding never distinguished the two either. Same limitation as the
  Character count had, just not the thing this eBug asked about; flag me if you want that
  addressed too.
