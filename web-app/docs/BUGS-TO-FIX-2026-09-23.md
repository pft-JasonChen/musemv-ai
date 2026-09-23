# eBugs — 2026-09-23

- **Query:** `full YMW260921P0013` only — the product owner scoped this run to that one eBug, so
  the PM-open working set was not re-pulled. Retrieved 2026-09-23.

| #   | BugCode          | Status                                                           |
| --- | ---------------- | ---------------------------------------------------------------- |
| 1   | `YMW260921P0013` | ✅ Fixed + verified locally (buttons hidden, per PM/RD decision) |

---

## YMW260921P0013 — [History] Like/dislike status not saved after navigating back

- ePF status: NewCreated
- Priority: 2 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JUNHAO_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.0 | Build: 0921
- Reported by JOANNE_HSIEH at 2026-09-21T16:57:13
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260921P0013
- Retrieved at: 2026-09-23
- Triage: Clear to fix — the decision is on the ticket (PM comment 2026-09-22: hide the buttons).
- Local status: Verified
- Decision needed: none.
- Related code/spec: `src/components/mv/MvResult.tsx` (the only own-creation Like/Dislike pair in
  `src/`); `specs/areas/02-mv-creation.md` (route row, MV-P4-S2, AC-MV-10, MV-P4 checklist).
  Searched `dislike`, `ic_like`, `ic_dislike`, `aria-pressed`, `reaction` across `src/`. The other
  Like buttons (`CommunityMvPlayer`, `SongDetailView`, `SongPlayBar`, `SongResultView`'s rail,
  `ui/ListItem`) are **community** Like on other people's work — a different feature, not in scope.
  **`/song/result`'s own-song Like — ANSWERED, no change** (product owner, 2026-09-23): it is a
  heart icon, i.e. the community Like record. The rule: **thumbs up/down = video feedback** (hidden
  by this eBug); **heart = community Like** (stays). Recorded in `MvResult.tsx` and
  `specs/CHANGELOG-SPEC.md`.
  MV-creation storyboard updated to **v7** at the product owner's request (see below).

### Report

- Short Description: [History] Like/dislike status not saved after navigating back
- Repro Steps:
  1. Login https://testing-ycm.makeupar.com/en
  2. Go to History, click a MV
  3. Click Like or Dislike
  4. Back to previous page
  5. Click the same MV and check Like/Dislike status
- Result: Like/dislike status not saved after navigating back
- Expect Result: Pls check if this is expected. Same behavior on mockup

### Attachments

- `result (6).mp4`, `mockup (8).mp4` — not downloaded; the thread's decision made them unnecessary
  (the repro is fully explained by the code: `vote` was `useState` in `MvResult`).

### Comments

- **JASON_CHEN** (2026-09-21): Like/Dislike should be saved on the server and remain when the user
  returns; asked RD to fix.
- **SMITH_LEE** (2026-09-22): It should be a single like/unlike toggle; please update the prototype.
- **JASON_CHEN** (2026-09-22): Like/dislike is not saved to the server yet; after discussing with
  RD, the feature moves to a patch, and the UI hides the like/dislike buttons for now.

### Resolution and verification

- Root cause: the vote was local component state (`useState` in `MvResult`) with no API call and
  no History write — spec'd that way ("local-only"). Leaving the screen unmounted it.
- Resolution: removed the `.mv-result__reactions` pair and its `vote` state from `MvResult`; a
  comment at the old site records why and that the patch version is a single toggle. Spec area 02
  and `specs/CHANGELOG-SPEC.md` updated. New e2e guard `YMW260921P0013` in
  `e2e/behaviour-regressions.spec.ts`. Not a C1–C8 change (the vote never reached `MuseApi`).
- Verified: `typecheck` ✅ · `lint` ✅ (1 pre-existing warning, untouched file) · `test:run`
  155/155 ✅ · `build` ✅. Live on `next dev`: History → done MV (`Cinematic Night`) →
  `/mv/result?id=h-cinematic-night` — 0 reactions blocks, 0 Like/Dislike buttons; title row lays
  out cleanly at 1440 and 390.
- G7: independent `code-reviewer` — no findings.
- Storyboard v7 (`specs/storyboards/mv-creation`): P8-S1 "Taps Like" + frame 34 deleted; P1-S14,
  States RESULT row, AC-MV-10, AC-MV-18 (→ P8-S4) and the flowchart node updated; P8 reordered
  Publish confirm → In Review → Share → from History, because Share only renders once published
  AND approved (`YMW260916P0013`) — the old "Share on a fresh result" step could not happen any
  more. Retook 14, 19, 35, 36, 37, 38 against `next dev` (demo credits); reviewed 14/35/37/38 by
  eye — no thumbs, layout intact. `spec.html` and `user-flowchart.svg` rebuilt.
- Capture-script findings (`capture_screenshots.py`): three pre-existing breakages fixed so a
  re-run works — Chromium sent the OS language, so on this zh-TW Mac every page was `/cht/…` and
  `href="/history"` matched nothing (context now pinned `en-US`); History rows are no longer links
  named after the song (now opened via the done-MV cover, like e2e's `doneCover`); Share was
  clicked before publishing. New `--result-only` mode. A fourth, in `skills/yco-spec/capture_lib.py`:
  `chromium_path()` only searched the Linux sandbox paths, so on macOS the Python `playwright`
  (pins build 1243) could not find the npm-installed Chromium (1217) — it now also searches
  `~/Library/Caches/ms-playwright`. With Python `playwright` / Pillow / `markdown` installed
  (product owner OK, 2026-09-23), `capture_screenshots.py --result-only` ran clean — 6 frames, 0
  console errors, frame 36's focus box identical to the recorded one — and produced the committed
  frames.
- Not verified: the new e2e test was not run by hand — the Stop hook's `npm run e2e` owns it.
  Visual gate not affected: `visual-baseline.spec.ts` never photographs `/mv/result`.
  `spec-bundled.html` rebuilt with Pillow (3.3 MB, was 3.4 MB — a first build without Pillow came
  out at 19 MB and was discarded); `specs/index.html` rebuilt (S2 → v7 · 2026-09-23, 43 shots).
- eBug evidence (before/after, same seeded MV "Cinematic Night" opened from History, 1440 + 390):
  "before" captured by temporarily restoring HEAD's `MvResult.tsx` on `next dev`, then the fixed
  file put back and checked byte-identical with `cmp`. Files handed to the product owner in-session
  (not committed): `YMW260921P0013-compare-1440.png`, `-compare-390.png`, and the four singles.
- Observed, NOT a bug, left alone: frame 38 (a freshly generated MV reopened from History) shows
  title **and Music** "New MV". The row title is RD's fixed placeholder `GENERATING_MV_TITLE`
  (`src/lib/mv/types.ts`, 2026-09-14: a real MV job carries no title), and `useOpenCreation`
  rebuilds the result screen from the row title alone, so the Music row inherits it. Showing the
  real song would mean storing it on the History row — a schema / C-contract change, so it is a
  product-owner/RD call, not part of this eBug.

### Reply comment (paste into eBug)

Fixed locally, **not committed and not on production** — retesting on testing-ycm now proves nothing.
Once deployed: the thumbs-up / thumbs-down buttons are gone from the MV result page (opened from
History or right after creating an MV), per the 2026-09-22 decision; they come back in a patch as a
single like/unlike toggle saved on the server. Rule for retesting: **thumbs up/down = feedback on
the generated video** (hidden now); **heart = community Like** (unchanged everywhere, including the
Like on the song result page). The MV Creation storyboard is updated to v7 to match.
Attached: before/after of the same MV opened from History, desktop (1440) and phone (390) width.
