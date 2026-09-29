# eBugs to fix — 2026-09-29

- **Query:** by BugCode, as requested (`epf_ebug.py full <BugCode>`), 2026-09-29 ~11:00.
- **In scope this session (product owner):** `YMW260924P0006`, `YMW260917P0008`.

| #   | BugCode          | Outcome                                                                         |
| --- | ---------------- | ------------------------------------------------------------------------------- |
| 1   | `YMW260917P0008` | ✅ Fixed + verified locally. **Not committed** (awaiting the go-ahead).         |
| 2   | `YMW260924P0006` | ⏸ **Needs Designer**, as the product owner decided. Diagnosed, nothing changed. |

---

## YMW260917P0008 — [History] Delete Project in Edit Music Video page will delete the original MV

- ePF status: Assigned
- Priority: 2 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.0 | Build: 0917
- Reported by KURT_WANG at 2026-09-17T18:58:34
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260917P0008
- Retrieved at: 2026-09-29
- Triage: **Clear to fix** (retest failure on an already-decided behaviour) + one **Needs PM**, answered
- Local status: **Verified** (locally). Not committed.
- Decision needed: none left. Asked and answered 2026-09-29: a just-generated MV is deleted too.
- Related code/spec: `components/mv/MvResult.tsx` (`editMv`), `components/mv/MvEditor.tsx`
  (`deleteProject`, header comment), `components/history/HistoryView.tsx` (`editMv` — already
  passed `?id=`), `components/community/CreatorProfile.tsx` (`doEdit` — no History id, deliberately
  unchanged), `specs/areas/02-mv-creation.md` **MV-P5-S6**, storyboard S3 `mv-edit` **P4-S3**.

### Report

- Short Description: [History] Delete Project in Edit Music Video page will delete the original MV
- Repro Steps: 1. Login 2. History > edit a MV 3. Change prompt of a scene > Recreate 4. After
  finishing recreating scene, click Delete Project
- Result: Delete the project in Edit Music Video page will delete the original MV. The original MV
  disappears in history page.
- Expect Result: Delete the project shouldn't affect the original MV.

### Attachments

- `YouCam Muse — Web - Google Chrome 2026-09-24 14-15-33.mp4` (14 s). Frames read: `/cht/history` →
  **clicks the Cinematic Night card** → `/mv/result` → **Edit MV** → URL `/cht/mv/edit` (**no
  `?id=`**) → Delete this Project → back on History, Cinematic Night still there.
- `2026-09-24_141735.jpg` — storyboard S3 **P4-S3** still saying "The History row this flow was
  seeded from is unaffected… there is nothing server-side to remove yet".

### Comments

- SMITH_LEE (2026-09-18): after discuss w/ PM, delete project would delete mv.
- JASON_CHEN (2026-09-21): posted the 2026-09-21 fix (`53915d3`), marked resolved.
- KURT_WANG (2026-09-24): 9/24 verified, **fail**. Prototype still inconsistent with the testing
  website; see the mp4. Spec needs changing; see the jpg.

### Resolution and verification

- **Root cause:** the 2026-09-21 fix read the History row's id from `/mv/edit?id=`, and only the
  History card menu's **Edit MV** put it there. QA took the other route: open the MV, then Edit MV
  on `/mv/result`. That button went to a bare `/mv/edit`, so Delete only discarded the flow. The
  2026-09-21 verification used the card menu, so it never covered this path. Separately, the S3
  storyboard was never updated for the 2026-09-21 behaviour change.
- **Resolution:** `/mv/result`'s Edit MV forwards the MV's History id. That is the `?id=` it was
  opened with, or else the live job's id (the same `shareId` the page already used for Share). The
  second case was a question: the old carve-out said "opened from `/mv/result`… nothing is in
  History yet", but a just-generated MV **is** already a live History entry. **Product owner,
  2026-09-29: delete it too.** `/creator` keeps no id and is unchanged.
- Spec: MV-P5-S6 rewritten; `CHANGELOG-SPEC.md` entry. Storyboard S3 → **v3**: P4-S3 rules
  rewritten, flowchart node updated, **shot 20 recaptured** (only that shot, via the storyboard's
  own `NextCapture`/`make_shoot`; the other 23 are untouched), `specs/index.html` rebuilt.
- No route file or C1–C8 surface touched → no `CHANGELOG-RD.md` entry.
- **Tests:** new e2e "YMW260917P0008: History → Result → Edit MV → Delete this Project deletes that
  MV". "3k: Delete this Project confirms…" now asserts the edit URL carries an id and that the
  fresh MV leaves History. The `openEditor` helper's `waitForURL("**/mv/edit")` was widened to
  `**/mv/edit**`, because a bare glob does not match the new query string.
- **Checks run:** typecheck 0 · lint 0 errors (1 old warning in `scripts/computed-style-diff.mjs`,
  untouched) · test:run 155/155 · build 0.
- **Verified live:**
  - `/cht` at 1440px, QA's exact path: History → Cinematic Night → `/cht/mv/result?id=h-cinematic-night`
    → Edit MV → `/cht/mv/edit?id=h-cinematic-night` → Delete → History **8 → 7 rows**, Cinematic
    Night gone.
  - Fresh generation (headless, demo credits): `/mv/result` → Edit MV →
    `/mv/edit?id=<job uuid>` → Delete → History **8 rows, new MV absent**.
    **Control** (same flow, sidebar to History instead of Delete): **9 rows, new MV present**.
- **G7 review (code-reviewer, independent context):** no defect in the diff itself. One HIGH
  finding, confirmed and **deliberately out of scope**, because it predates this change and lives
  in Merge. `MvFlowProvider.startRender` reuses `jobId.current`, which opening a History row never
  resets. So Merge on an MV opened from History files the render as a **new** History job (the
  original row stays), or, if the session generated another MV earlier, re-renders into **that**
  job's record. Merge always returns to a bare `/mv/result`, so after a Merge `shareId` names that
  new or reused job, and Delete removes it rather than the row originally opened. Before this
  change the post-Merge path deleted nothing at all.
  **Fixed later the same day** (product owner: Merge replaces the row in place and shows
  Generating…). Merge now re-renders the creation named by `?id=`, keeping the History id separate
  from the API job id. The id rides `/mv/creating?id=` → `/mv/result?id=`, and seed rows are
  overlaid in place. Verified live with an unrelated MV generated first: 9 rows before the Merge,
  9 after it, Cinematic Night in the same slot, the unrelated MV untouched; Delete → 8. New e2e
  "2026-09-29: Merge on a History MV re-renders THAT row in place…"; new `MvFlowProvider.test.tsx`
  (mutation-tested). `CHANGELOG-RD.md` and `CHANGELOG-SPEC.md` 2026-09-29 entries.
  A second G7 review (code-reviewer) of that change found no wrong-row writes. Fixed from it: the
  My Creations rails ignored `removed` (a deleted MV stayed on `/mv/room`'s rail; verified gone
  live after the fix, present before), and `/mv/result` now looks up its entry by `?id=` first.
  Not taken: making `forwardId` depend on flow state rather than the URL. Only Merge ever puts
  `?id=` on `/mv/creating`, so it's low risk, and noted here.
- **Not verified:** the new/changed e2e tests have not been run by hand. They are left to the Stop
  hook (port-3100 rule). The `@visual` gate was not evaluated on this machine. Production is
  unchanged because nothing is committed or pushed.

### Reply comment (paste into eBug)

> Found why the retest failed: Delete only worked when the editor was opened from the History card's
> ⋯ menu. Opening the MV first and then pressing Edit MV on its result page (the path in your video)
> kept the MV. That path now deletes it too, and so does Edit MV right after generating a new MV. The
> storyboard page in your screenshot is corrected. **Not on the web prototype yet**: this is fixed
> locally and not deployed, so retesting now will still show the old behaviour.

---

## YMW260924P0006 — [History] Black rectangle on result song page has no padding

- ePF status: NewCreated
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee:
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.0 | Build: 0924
- Reported by JOANNE_HSIEH at 2026-09-24T16:05:55
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260924P0006
- Retrieved at: 2026-09-29
- Triage: **Needs Designer** (product owner, 2026-09-29: "don't handle this one, I'll pass it to the designer")
- Local status: **Blocked** — diagnosed, no change made.
- Decision needed: how the phone `/song/result` backdrop should look (designer).
- Related code/spec: `src/styles/designer-overrides.css` (the 2026-08-23 block that shows
  `.song-result__bg` / `__bg-overlay` below 768px), `src/styles/designer/SongCreatePage.css`
  (`.song-result`, desktop card at ≥1024px), `components/song/SongResultView.tsx`.

### Report

- Short Description: [History] Black rectangle on result song page has no padding
- Repro Steps: 1. Login https://testing-ycm.makeupar.com/en 2. Go to History > tap a song 3. Check
  the black rectangle area on result song page
- Result: Black rectangle in the middle of result song page has no padding
- Expect Result: Pls check if this is expected. It also happens on mockup

### Attachments

- `mockup.jpg` — this prototype (`musemv-ai.vercel.app`), phone, "Golden Hour": the blurred box's
  left edge sits exactly on the title, progress bar and CTAs.
- `test link.jpg` — `testing-ycm.makeupar.com`, same layout, same flush edges.

### Comments

(none)

### Resolution and verification

- **Root cause (measured at 375px, `/song/result?id=h-golden-hour`):** none of the player's
  ancestors has a background. The box is `.song-result__bg` (blurred cover `<img>`) plus
  `__bg-overlay`, both `inset: 0` on `.song-result` (x=20, w=335, **padding 0**). DP shows them only at
  ≥1024px, where `.song-result` also gets `padding: 24px`, `border-radius` and `overflow: hidden`.
  That makes a card. The 2026-08-23 override (product owner: give this screen `/song/play`'s
  full-screen phone look) copied the blur below 768px but not the card's padding or radius, so the
  blur is exactly the size of the content. Also noted: 768–1023px gets neither treatment.
- **Options put to the product owner:** full-screen blur like `/song/play`'s phone player, a padded
  card, or removing the phone backdrop. **Answer: don't handle; goes to the designer.**
- **Not verified / not done:** no code change.

### Reply comment (paste into eBug)

> Not expected. On phones the blurred cover backdrop is exactly the size of the player content, so
> the title, progress bar and buttons sit flush against its edges. On desktop the same backdrop sits
> inside a padded, rounded card. Nothing has been changed; this is going to the designer to decide
> how the phone version should look.
