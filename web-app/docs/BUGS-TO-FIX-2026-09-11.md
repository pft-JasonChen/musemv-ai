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
| 3 | YMW260910P0006 | ❓ Needs a design decision — see below |
| 4 | YMW260910P0001 | ✅ Fixed, spec updated, confirmed live |
| 5 | YMW260909P0009 | ⏸️ Ignored, per your instruction (code shows it's already gated) |
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

## [ ] 3. YMW260910P0006 — needs a design decision
**Short Description:** [History] Shows additional avatar on sharing music link.

**Investigated but not implemented — this needs your call, not a guess.**

- The Song share panel ([ShareLinkView.tsx](src/components/share/ShareLinkView.tsx)) renders
  exactly ONE avatar element — a generic gray "person" icon (`ic_user`) next to the creator's name.
  There's no code-level duplication.
- Checked live at `http://localhost:3000/share?id=sp-neon-static` (a community song credited to the
  current user): confirmed only one avatar node in the DOM.
- The data model has **no real per-creator avatar image at all** — `CommunitySong`/`CommunityMv`
  only carry a `creator: string` name (`src/lib/mv/community.ts`), so "show the correct avatar"
  would mean adding new avatar data/assets, not just a code fix.
- The bug's own **Expected Result** offers two different fixes: *"Should not show it, or should
  show the correct avatar"* — those are two different amounts of work (remove an element vs. add a
  data field), and I don't think you meant for me to pick one silently.

**Question:** for a shared song/MV's creator row, do you want (a) the avatar removed entirely, or
(b) real avatar data added per creator? SMITH_LEE's comment also pointed at two comparison links —
`https://musemv-ai.vercel.app/cht/share?id=h-golden-hour` and `.../share?id=ns-memory-lane` — worth
opening those against current `/share?id=sp-neon-static` if you want to eyeball the difference
yourself.

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

## [ ] 5. YMW260909P0009 — ignored, per your instruction
**Short Description:** [EXPLORE COMMUNITY] Signed-out creation action bypasses the sign-in gate

You said: if this is already fixed, ignore it. Matches what I found — every creation entry point
(Home hero, tool selector, `/watch`'s Create MV) already calls `requireLogin` before navigating,
and the bug's own repro path ("Trending Music Videos → see all → AI Music Video creation card")
doesn't match any element on `/explore/mvs` (that page has no creation card). No code change made.

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
