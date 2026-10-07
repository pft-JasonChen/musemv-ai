# eBugs to fix — 2026-10-07

- **Query:** `epf_ebug.py search --ycm-web --pm-open` — Product YouCam Muse Web (315), BugBelong PM, status NewCreated + Assigned.
- **Retrieved at:** 2026-10-07 18:42 CST. 11 eBugs, none in an earlier ledger.
- Attachments were downloaded to the session scratchpad and reviewed; none are in the repo.

## Summary

| eBug | Title (short) | Triage | Local status |
| --- | --- | --- | --- |
| YMW260930P0004 | [Auto][AI Music Video] Default audio trim length is less than required minimum when uploading 30s–50s audio | Clear to fix | Verified (locally) |
| YMW261006P0004 | [Auto][AI Music Video] Able to generate when a scene input box is cleared in Storyboard or Edit MV | Needs PM | Blocked |
| YMW261006P0003 | [Auto][AI Music Video] Able to select the same sample photo twice without deduplication | Needs PM | Blocked |
| YMW261006P0001 | [Auto][AI Music Video] No input character length limit on Title and Author fields, causing generation fail. | Needs PM | Blocked |
| YMW261005P0002 | [Auto][Account] Free plan (expired subscription) allows downloading MV/Song and toggling watermark removal | Needs PM | Blocked |
| YMW261002P0006 | [Account][Credits detail] There displays an earn credits record in Spend tab if the credits are returned by failed to generate a MV | Needs PM | Blocked |
| YMW260930P0009 | [Auto][Account] Credits Detail history is limited to 25 items and does not load more on scroll | Needs PM / RD | Blocked |
| YMW260930P0002 | [Auto][Account] AI Song Simple + Instrumental generation is missing from Credits Detail | Needs PM / RD confirm | Blocked |
| YMW260924P0003 | [SHARE] Unavailable share page shows an extra "Try YouCam Muse" button; logo is not the only exit | Needs PM | Blocked |
| YMW260923P0013 | [EXPLORE COMMUNITY] Creator song player does not use the creator's collection | Not a prototype defect | Diagnosed |
| YMW260930P0008 | [Home][Countly event][YCM_Subscription_Page] There is no event when upgrade with the bottom-left upgrade button | Not a prototype item | Diagnosed |

---

## YMW260930P0004 — [Auto][AI Music Video] Default audio trim length is less than required minimum when uploading 30s–50s audio

- ePF status: NewCreated
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: 
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 0930
- Reported by CRUZ_CHU at 2026-09-30T14:16:42
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260930P0004
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Clear to fix** — reproduced in the prototype ("Same on mockup"); the spec's own ≥30s floor (MV-01) makes the 15%→70% default a dead end for every import 30–53s.
- Local status: **Shipped** — `7242bb2`, production check passed.
- Decision needed: None for the defect. One small choice made: the short-track default is exactly 30s, widened at the end first (start stays at 15%), slid back if it would pass the track end. Say if you want it centred or starting at 0:00 instead.
- Related code/spec: `src/components/mv/TrimAudioModal.tsx` (`defaultTrim`, the only place the default is set — initial state and the re-seed on open both call it); upload floor `MvRoom.importAudio` unchanged; spec `specs/areas/02-mv-creation.md` MV-P6-C; e2e `behaviour-regressions.spec.ts:773` (114s library song — unchanged path). Grepped `DEFAULT_START_PCT|DEFAULT_END_PCT|15%.*70%` across src/specs/e2e: no other copy.

### Report

- Short Description:
  [Auto][AI Music Video] Default audio trim length is less than required minimum when uploading 30s–50s audio
- Repro Steps:
  1. Go to MV page
  2. Upload an audio with duration between 30 and 50 seconds.
- Result:
  The default audio trim duration is shorter than 30s.
- Expect Result:
  Please check if this is expected or needs to be adjusted.
- Note:
  Same on mockup.

### Attachments
- result.png  `iForm/2026/09/30/72ebdfcc-5cba-4866-8871-17b9c16cca09.png`

### Comments
- none

### Resolution and verification

- Root cause: `TrimAudioModal` always opened at a fixed 15%→70% of the track = 55% of its length. Imports are allowed from 30s up (MV-P6-B upload floor), so any import ≤53s opened below `MIN_TRIM_SEC` (45s → 24s), Confirm disabled and the red `minimum 30s` hint shown before the user did anything. Library songs (114s/160s) never hit it.
- Resolution: New exported `defaultTrim(total)`: keeps 15%→70% when that window is ≥30s; otherwise opens at exactly 30s (end widened first, then slid back to end at the track's end). Unit test `TrimAudioModal.test.ts` sweeps every length 30–300s. Spec MV-P6-C + `CHANGELOG-SPEC.md` 2026-10-07 updated, `specs/index.html` regenerated. No C1–C8 surface touched.
- Verified: typecheck / lint / test:run (165/165) / build exit 0. Local and Production `https://musemv-ai.vercel.app` after `7242bb2` deployed (2026-10-08): `/mv/room`, Import Audio with a generated 45s WAV → Trim opens 00:07–00:37, "Selected: 00:30", Confirm enabled.
- Not verified: Not checked on testing-ycm (RD's build) — RD must port the same default. e2e is left to the Stop hook. Visual gate not evaluated (no baseline shows an imported track).

### Reply comment (paste into eBug)

Fixed on the mockup, live now at musemv-ai.vercel.app. When an imported track is too short for the default 15%–70% selection to reach 30s (anything up to ~53s), Trim Audio now opens with exactly 30s selected, so Confirm works straight away; longer tracks keep the old default. RD's build needs the same default — testing-ycm will show the old behaviour until it is ported.

---

## YMW261006P0004 — [Auto][AI Music Video] Able to generate when a scene input box is cleared in Storyboard or Edit MV

- ePF status: NewCreated
- Priority: 5 | Severity: 3
- ePF handler: JASON_CHEN | Assignee: 
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1006
- Reported by CRUZ_CHU at 2026-10-06T14:48:00
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261006P0004
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Needs PM — product/UX choice** (QA asks to confirm; no spec says a scene must be non-empty).
- Local status: **Blocked** — diagnosed, no change made.
- Decision needed: Should an empty scene block generation? (a) Block: disable Storyboard **Create MV**, Edit MV **Merge MV** and that scene's **Recreate** while any scene text is blank after trim, with a hint; (b) allow it as today (engine generates from the remaining context — QA notes generation completes fine).
- Related code/spec: `src/components/mv/StoryboardEditor.tsx` (scene textarea, `generateMv` gates credits only, CTA has no `disabled`); `src/components/mv/MvEditor.tsx` (scene editor rendered twice: inline + phone portal; `dirty` gate on Merge; `sceneTextEdited` gate on Recreate — clearing a scene ENABLES both); `MvFlowProvider.startRender`; `SceneSchema.text` is plain `z.string()`. Spec 02 AC-MV-08 / MV-P5-S3 give only a 2500 max.

### Report

- Short Description:
  [Auto][AI Music Video] Able to generate when a scene input box is cleared in Storyboard or Edit MV
- Repro Steps:
  1. Go to MV Storyboard or Edit MV.
  2. Clear a scene input box.
  3. Click generate.
- Result:
  Allows generation to proceed with an empty scene.
- Expect Result:
  Please confirm if this is expected behavior or if validation is required.
- Note:
  The generation process completes correctly.

### Attachments
- result.png  `iForm/2026/10/06/0867a951-be1b-4921-9685-1b95d7d90628.png`

### Comments
- none

### Resolution and verification

- Root cause: No validation exists anywhere in the chain; not a regression.
- Resolution: —
- Verified: —
- Not verified: —

### Reply comment (paste into eBug)

<!-- Pending the decision above. -->

---

## YMW261006P0003 — [Auto][AI Music Video] Able to select the same sample photo twice without deduplication

- ePF status: NewCreated
- Priority: 5 | Severity: 3
- ePF handler: JASON_CHEN | Assignee: 
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1006
- Reported by CRUZ_CHU at 2026-10-06T14:31:15
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261006P0003
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Needs PM — product/UX choice** (QA asks to confirm; spec says only "max 2").
- Local status: **Blocked** — diagnosed, no change made.
- Decision needed: Should a sample photo be pickable twice? Options: (a) dedupe — a sample already in a slot shows as selected and a second tap does nothing (or removes it); (b) allow (two characters with the same face is legitimate). Related, also undecided: when both slots are full the strip still looks tappable and silently ignores taps.
- Related code/spec: `src/components/mv/MvRoom.tsx` `addSampleFace` (new UUID per tap, `.slice(0,2)`, no URL compare) and the sample strip; uploads (`addCroppedPhoto`) don't dedupe either. Spec 02 MV-P1-S5 "max 2". Noticed in passing, not in scope: `characterNames` isn't shifted when slot 1 is removed, so a name can follow the wrong photo.

### Report

- Short Description:
  [Auto][AI Music Video] Able to select the same sample photo twice without deduplication
- Repro Steps:
  1. Go to MV page
  2. Select same sample photo twice.
- Result:
  Duplicate selections are allowed without deduplication.
- Expect Result:
  Please confirm if this behavior is expected.

### Attachments
- result.png  `iForm/2026/10/06/d7a0d657-6b15-4627-be96-217646484138.png`

### Comments
- none

### Resolution and verification

- Root cause: Selections are an array with no dedupe; by construction, not a regression.
- Resolution: —
- Verified: —
- Not verified: —

### Reply comment (paste into eBug)

<!-- Pending the decision above. -->

---

## YMW261006P0001 — [Auto][AI Music Video] No input character length limit on Title and Author fields, causing generation fail.

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1006
- Reported by CRUZ_CHU at 2026-10-06T08:47:20
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261006P0001
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Needs PM — needs a number** (RD's comment: confirm the Engine's limit and update the mockup).
- Local status: **Blocked** — diagnosed, no change made.
- Decision needed: The character caps for MV **Title** and **Author** (and probably the character-photo **Name**, which has none either), from the Engine team. Once given, the change is mechanical — `maxLength` + counter at the 4 inputs, following the Song Title 120 precedent (YMW260916P0022).
- Related code/spec: `src/components/mv/SettingsModal.tsx` Title/Author inputs; `src/components/mv/MvEditor.tsx` Title/Author inputs; `MvRoom.tsx` character Name input; `MvSettingsSchema` (`schemas.ts`) has no `.max()`; precedent `SONG_TITLE_MAX = 120` in `src/lib/mv/types.ts`. Spec 02 gives no title/author cap.

### Report

- Short Description:
  [Auto][AI Music Video] No input character length limit on Title and Author fields, causing generation fail.
- Repro Steps:
  1. Go to MV
  2. Upload an audio and fill prompt.
  3. Enter an long string (e.g., ~1,000,000 characters) into the Title or Author field.
  4. Generate MV.
- Result:
  Generate fail.
- Expect Result:
  Please verify whether the generation failure is caused by the extreme character length, 
  and check if input length limits or validation rules should be implemented for these fields.
- Note:
  ~1008738 characters (reproduce probability  3/3)
  sessionId: "0cb24a07-ca72-4613-90a6-3e2082ef69fd"
  taskId: "jSgpTdkCuKifB-AQ5CBEjr_VI9H3N0B7DF-ZWhUr544DYYXNdDIf23gib9TuUv91"

### Attachments
- result.png  `iForm/2026/10/06/e0d82939-05e3-449a-abe8-7370bcacf1ad.png`

### Comments
- **RUBY_FENG** (2026-10-06T11:57:29): Hi Jason,
We need to add a character limit UI to the mockup. It looks like the engine has a character limit for the task input parameters, and the task may fail if the limit is exceeded.
Could you please confirm the character limit with the Engine team and update the mockup accordingly?
Thank you very much!

### Resolution and verification

- Root cause: No cap specified or implemented.
- Resolution: —
- Verified: —
- Not verified: —

### Reply comment (paste into eBug)

<!-- Pending the decision above. -->

---

## YMW261005P0002 — [Auto][Account] Free plan (expired subscription) allows downloading MV/Song and toggling watermark removal

- ePF status: NewCreated
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: 
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1005
- Reported by CRUZ_CHU at 2026-10-05T16:27:04
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261005P0002
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Decided 2026-10-08 — option (b)**: keep Download and the watermark switch open to every plan; drop them from the Pro perk list.
- Local status: **Shipped** — `7242bb2`, production check passed.
- Decision needed: Answered — see Triage.
- Related code/spec: Perk list `src/lib/user.ts` `MUSE_PRO_FEATURES`, `SubscribeModal.tsx`, `en.ts` `profile.proSubtitle`; Download in `MvResult.tsx`, `SongResultView.tsx`, `HistoryView.tsx`, `CreatorProfile.tsx`, `ShareLinkView.tsx`; watermark toggle `SettingsModal.tsx`, `MvEditor.tsx`, default `types.ts` `watermark:false`; plan state `AuthProvider` (`guest|free|subscriber`, no expired). Specs: AC-MV-10, AC-SONG-06, AC-HIST-08, MV-P6-E.

### Report

- Short Description:
  [Auto][Account] Free plan (expired subscription) allows downloading MV/Song and toggling watermark removal
- Repro Steps:
  1. 使用訂閱已到期（轉為 Free plan）的帳號前往 History 頁面。
  2. 檢查結果頁面的 Download 功能。
  3. 前往 MV 頁面，檢查 MV Without Watermark 功能設定。
- Result:
  1. 結果頁面的 Download 按鈕未顯示鎖定狀態或升級提示，可直接下載，與升級彈窗中標示「Enable Download MV & Song」為付費權益的說明矛盾。
  2. MV 設定區塊的「MV Without Watermark」選項預設關閉且可自由切換開啟，無任何升級提示，與升級彈窗中標示無浮水印為付費權益的說明矛盾。
- Expect Result:
  因點數係經由付費購買，相關下載與去浮水印行為是否屬於合理開放範圍，請確認現行付費權益與 UI 提示邏輯是否符合預期。

### Comments
- **PFTMIS** (2026-10-05T16:44:33): CRUZ_CHU has moved this bug from YouCam Muse Web 1.0
- **PFTMIS** (2026-10-05T17:17:09): CRUZ_CHU has moved this bug from YouCam Muse Web 1.1

### Attachments
- none

### Resolution and verification

- Root cause: No decision recorded either way.
- Resolution: Removed "MV without Watermark" and "Enable Download MV & Song" from `MUSE_PRO_FEATURES` (`src/lib/user.ts`); "watermark-free MVs" removed from SubscribeModal's already-Pro line; "no watermark" removed from `profile.proSubtitle` (`en.ts`; the 8 other dictionaries are empty). Spec 07 SubscribeModal note, `CHANGELOG-SPEC.md` 2026-10-08, storyboard S5 → v3 (recaptured).
- Verified: typecheck / lint / test:run / build exit 0; S5 recapture. Production `https://musemv-ai.vercel.app` after `7242bb2` deployed (2026-10-08): `/profile` subtitle reads "More credits · faster renders"; Upgrade dialog cards list only Priority AI Generation, Commercial License, Credits Expire.
- Not verified: `/profile` and Subscribe-dialog `-linux` visual baselines will need re-recording on Linux (copy changed); visual gate not evaluated here.

### Reply comment (paste into eBug)

Confirmed as intended: Download and the watermark switch stay available on every plan, including Free / expired subscriptions, so no lock or upgrade prompt is needed. What was wrong is the upgrade dialog — "MV without Watermark" and "Enable Download MV & Song" are removed from the Muse Pro benefits (and "no watermark" from the Account Muse Pro subtitle) on the mockup, live now; RD's build needs the same copy change.

---

## YMW261002P0006 — [Account][Credits detail] There displays an earn credits record in Spend tab if the credits are returned by failed to generate a MV

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1002
- Reported by KURT_WANG at 2026-10-02T16:24:07
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261002P0006
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Decided 2026-10-08**: the refund belongs in **Spend** — product owner answered on the ticket as not-a-bug.
- Local status: **Shipped** (spec only) — `7242bb2`. Answered on the ticket by the product owner.
- Decision needed: Answered — see Triage.
- Related code/spec: `src/components/credits/CreditsView.tsx` tab filter is by sign of `amount`; `src/lib/user.ts` `CreditTxn` has no type; refunds in `MvFlowProvider`/`SongFlowProvider` change the balance but write no ledger row (ledger is a static seed). Spec 07 CR-P3-S2, spec 11 §5 (refund on failure), TBD-CR-04.

### Report

- Short Description:
  [Account][Credits detail] There displays an earn credits record in Spend tab if the credits are returned by failed to generate a MV
- Repro Steps:
  1. Create a MV
  2. After failed to generate the MV, enter credits detail and check records in Spend tab
- Result:
  There displays an earn credits record in Spend tab if the credits are returned by failed to generate a MV.
- Expect Result:
  Spend tab shouldn't display the earn credits record.

### Attachments
- 2026-10-02_161632.jpg  `iForm/2026/10/02/00fd84b0-9698-4f05-a961-ef78d73f1f19.jpg`

### Comments
- **SMITH_LEE** (2026-10-05T09:06:10): returned credits does not belong to earn credits
- **KURT_WANG** (2026-10-05T14:51:04): Hi PM, 
 Please help check if it's expected or not, thanks.

### Resolution and verification

- Root cause: Production shows the refund as a second "MV - Create Video" row with +2047 under Spend, i.e. RD's tab filter isn't sign-based and/or the refund has no distinct type. The prototype has no refund row to compare.
- Resolution: Spec 07 CR-P3-S2 + `TBD-CR-04`: a failed-generation refund is listed under Spend, so the live ledger needs a per-row type, not the sign. No reply needed (answered on the ticket).
- Verified: Spec text only.
- Not verified: —

### Reply comment (paste into eBug)

<!-- Not needed: product owner answered on the ticket (refund belongs in Spend). -->

---

## YMW260930P0009 — [Auto][Account] Credits Detail history is limited to 25 items and does not load more on scroll

- ePF status: NewCreated
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: 
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 0930
- Reported by CRUZ_CHU at 2026-09-30T15:34:16
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260930P0009
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Decided 2026-10-08**: 25 entries per page, next page loaded on scroll.
- Local status: **Shipped** (spec only) — `7242bb2`.
- Decision needed: Answered — see Triage.
- Related code/spec: `src/components/credits/CreditsView.tsx` renders the full list; spec 07 TBD-CR-04 (live ledger owed by RD); no spec on history length.

### Report

- Short Description:
  [Auto][Account] Credits Detail history is limited to 25 items and does not load more on scroll
- Repro Steps:
  1. Go to Account
  2. Click credits.
  3. Scroll down to bottom.
- Result:
  Only 25 items are displayed.
- Expect Result:
  Please check if this is expected or if needs to be adjusted.
- Note:
  Oldest visible record is pushed out when a new credit transaction is added.

### Attachments
- result.png  `iForm/2026/09/30/c46b0813-4aa4-4038-80b9-e11fdb803a59.png`

### Comments
- none

### Resolution and verification

- Root cause: Production frontend fetches one page and never requests the next.
- Resolution: Spec 07 CR-P3-S2 + `TBD-CR-04`: 25 per page, load the next page at the bottom, never push the oldest out.
- Verified: Spec text only.
- Not verified: —

### Reply comment (paste into eBug)

Expected behaviour: Credits Detail loads 25 records per page and fetches the next 25 when the user scrolls to the bottom, and older records must never drop off the list. The spec is updated (Credits Detail CR-P3-S2); this needs RD to add paging to the ledger request — the mockup has no real ledger, so there is nothing to compare there.

---

## YMW260930P0002 — [Auto][Account] AI Song Simple + Instrumental generation is missing from Credits Detail

- ePF status: Assigned
- Priority: 1 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 0930
- Reported by CRUZ_CHU at 2026-09-30T10:59:15
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260930P0002
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Decided 2026-10-08**: the form now uses `simple`; product owner closed the ticket.
- Local status: **Shipped** (spec only) — `7242bb2`. Ticket closed by the product owner.
- Decision needed: Answered — see Triage.
- Related code/spec: Root `[YCM] Credit Consume Cloud Config .json` uses `ai_song_simple_instrumental`; `specs/areas/11-credit-consumption.md` §3; `specs/areas/13-credit-history-display.md` §3/§5, AC-CD-06/07; `specs/CHANGELOG-SPEC.md` (keeps `simpe` on purpose).

### Report

- Short Description:
  [Auto][Account] AI Song Simple + Instrumental generation is missing from Credits Detail
- Repro Steps:
  1. Go to AI song.
  2. Select Simple + Instrumental, then generate a song.
  3. Go to Account > Credits
- Result:
  The credit consumption record for this generation is missing.
- Expect Result:
  Displayed correctly
- Note:
  API / Script Payload: ycm_credit_history_def 
  -> result[0].payload.credit_detail[0].action_name[2] returns "ai_song_simpe_instrumental" (typo in action name payload/mapping).

### Attachments
- result.png  `iForm/2026/09/30/7aab155d-b201-4e21-ba94-bc476471f05f.png`

### Comments
- **PFTMIS** (2026-09-30T11:16:46): KURT_WANG has moved this bug from YouCam Muse Web 1.0
- **JUNHAO_CHEN** (2026-10-02T10:29:38): There is a typo in the action name ai_song_simpe_instrumental returned by the Credit API, which causes a mapping error. Please help check it. Thank you.
- **YANG_HUNG** (2026-10-02T11:25:05): Hi,
Could you please provide the task Id or user Id
Thanks
- **INGRID_LEE** (2026-10-02T11:58:29): credit history updated
https://eperfect.perfectcorp.com/MSR/Project/FormQuery.aspx?FormCode=PFA261002-0001

### Resolution and verification

- Root cause: Charge record carries `ai_song_simple_instrumental`, display form had `ai_song_simpe_instrumental`; exact-match rule (AC-CD-06) drops the row.
- Resolution: Spec 13 §4 table, identifier notes and QA item 5 switched to `ai_song_simple_instrumental`; `simpe` recorded as retired. No reply needed.
- Verified: Spec text only.
- Not verified: —

### Reply comment (paste into eBug)

<!-- Not needed: product owner closed the ticket. -->

---

## YMW260924P0003 — [SHARE] Unavailable share page shows an extra "Try YouCam Muse" button; logo is not the only exit

- ePF status: Assigned
- Priority: 4 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 0924
- Reported by BARRY_KAO at 2026-09-24T11:57:05
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260924P0003
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Decided 2026-10-08 — option (a)**: keep the Try YouCam Muse button; update the spec.
- Local status: **Shipped** — spec + storyboard in `7242bb2`; code unchanged.
- Decision needed: Answered — see Triage.
- Related code/spec: `src/components/share/ShareLinkView.tsx` unavailable branch (button + 09-09 comment); `src/styles/designer-overrides.css` spacing rule; commit `41c5b36`; specs `10-share.md` (note says the old "Go to YouCam Muse" button was removed 2026-07-23), `storyboards/share/build_spec.py`, `make_flowchart.py`, `capture_screenshots.py`, `specs/focus.json`.

### Report

- Short Description:
  [SHARE] Unavailable share page shows an extra "Try YouCam Muse" button; logo is not the only exit
- Repro Steps:
  1. https://testing-ycm.makeupar.com/en/share?id=01M1WTBRG24S0JMKGJBG953XXW (a share id that matches no creation).
  3. Wait until the loading skeleton resolves and the "This link isn't available" page is shown.
  4. Check the controls visible on the page.
- Result:
  The unavailable page shows the YouCam Muse logo header, a warning icon, "This link isn't available" and "We couldn't find this creation. Ask the sender to share it again." with no media, but it also shows a prominent "Try YouCam Muse →" button (links to /en). The header logo is therefore not the only exit to Home.
- Expect Result:
  Opening /share with an unresolvable id shows the public unavailable state with no media or action pills, and the header YouCam Muse logo is the only exit to Home (spec P4-S1: "There is no retry and no Try-the-app button - the header logo is the only way out", AC-SHARE-02).
- Note:
  MUSE-SHARE-0908-S012-B001

### Attachments
- OBS-030.jpg  `iForm/2026/09/24/d63fcf41-6be8-4c34-bf9a-dc174a04cc58.jpg`
- slide-012-20260908.jpg  `iForm/2026/09/24/d8879cbb-7c23-4cf0-a773-895113d6a2d4.jpg`

### Comments
- **PFTMIS** (2026-09-24T15:40:31): BARRY_KAO has moved this bug from Youcam Muse Web Agent Test
- **RUBY_FENG** (2026-10-01T11:45:47): Hi Jason,
Could you please help check the behavior of the Share page when the content cannot be found?
Currently, the mockup displays “This link isn’t available” along with a button below:
https://musemv-ai.vercel.app/cht/share?id=testtest

Could you please confirm whether we should update it to match the spec layout shown in the QA screenshot? If so, please also help update the mockup accordingly.
Thank you!

### Resolution and verification

- Root cause: Spec drift: decision landed in code only.
- Resolution: `10-share.md` unavailable state + AC-SHARE-02 now describe the pill (added 2026-09-09, reconfirmed); storyboard S9 → v2 (P4-S1 text, focus box, state/error tables, flowchart label; all 15 shots recaptured); `CHANGELOG-SPEC.md` 2026-10-08.
- Verified: Recaptured S9 shot 10; spec validate OK. Production `https://musemv-ai.vercel.app` after `7242bb2` deployed (2026-10-08): `/share?id=01M1WTBRG24S0JMKGJBG953XXW` shows "This link isn't available" and the Try YouCam Muse pill → `/cht` (locale-prefixed home).
- Not verified: —

### Reply comment (paste into eBug)

The button is intended, please keep it. "Try YouCam Muse" on the unavailable page was added on 09-09 (Figma "Share Page - Empty"), but the spec and storyboard were never updated, which is what this report tested against. Both are updated now (AC-SHARE-02, storyboard S9 P4-S1 v2): the page shows the unavailable message plus a Try YouCam Muse button to Home, and the logo also links Home — no UI change on the mockup or RD's build.

---

## YMW260923P0013 — [EXPLORE COMMUNITY] Creator song player does not use the creator's collection

- ePF status: Assigned
- Priority: 4 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 0923
- Reported by BARRY_KAO at 2026-09-23T18:11:22
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260923P0013
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Not a prototype defect** — the prototype already does what P5-S3 says; the bug is in RD's build. Answer to BARRY_KAO's question needed from PM, no code change.
- Local status: **Diagnosed** — no change needed in the prototype.
- Decision needed: Confirm the reading below for QA, and route to RD.
- Related code/spec: `src/components/song/SongDetailView.tsx` (a `cps-*` creator song id → list = `CREATOR_SONGS`, `activeTab = null`; Prev/Next step `displayedSongs`; any tab click restores the community catalog); `CreatorProfile.tsx` links `/song/play?id=<cps-id>`; e2e `behaviour-regressions.spec.ts` "3b / EXP-09"; spec `04-explore-community.md` EXP-09, storyboard explore-community P5-S3. The prototype never emits `from=creator&creatorId=` — that URL is RD's own.

### Report

- Short Description:
  [EXPLORE COMMUNITY] Creator song player does not use the creator's collection
- Repro Steps:
  1. Sign in and open https://testing-ycm.makeupar.com/EN/explore/songs
  2. Select the Songs that own collection (open https://testing-ycm.makeupar.com/en/creator?id=01M1DXXPRG202F7SHH90HECYPK.)
  3. Select Not the End from the creator's song collection.
  4. Wait for the song player to finish loading.
  5. Check the Previous and Next controls, the list shown below the player, and the genre-tab state.
- Result:
  The URL preserves from=creator and creatorId, but Previous and Next are disabled. The list below the player is the cross-creator Newly Released Songs community catalog instead of the selected creator's five-song collection, and no genre tab is available to return to the community catalog.
- Expect Result:
  Selecting a creator's song switches transport to that creator's collection with no genre tab active; returning to a genre tab restores the community catalog.
- Note:
  MUSE-EXPLORE-COMMUNITY-0909-S033-B001

### Attachments
- OBS-097-creator-songs-baseline.jpg  `iForm/2026/09/23/eb63eef6-b024-495b-ac75-d39a41e1ca45.jpg`
- OBS-098-creator-song-player.jpg  `iForm/2026/09/23/3cfcd863-a53b-459b-8505-cf03e0b133c2.jpg`
- slide-033-20260909.jpg  `iForm/2026/09/23/7e6bb049-aeb2-4690-88f1-8a4a4ffe5b5b.jpg`

### Comments
- **PFTMIS** (2026-09-24T16:12:55): BARRY_KAO has moved this bug from Youcam Muse Web Agent Test
- **BARRY_KAO** (2026-10-01T15:17:35): Hello PM, I'd like to ask if P5-S3 in the Explore & Community storyboard means that clicking on a song's creator will filter all of that creator's songs (currently it redirects to the creator's song collection page). If the current behavior is correct, it might be necessary to modify the storyboard.

### Resolution and verification

- Root cause: RD's build carries the creator context in the URL but doesn't switch the list/transport to the creator's collection.
- Resolution: —
- Verified: Prototype behaviour guarded by existing e2e 3b / EXP-09 (not re-run by hand; the Stop hook runs it).
- Not verified: RD build not tested from here.

### Reply comment (paste into eBug)

No change needed in the mockup: it already behaves as storyboard P5-S3 describes. Opening one of a creator's songs, from their creator page, switches the list below the player to that creator's collection, with no genre tab active; Previous/Next step through that list, and tapping any genre tab returns to the community catalog. P5-S3 does not mean that clicking a creator filters the list. The trigger is opening a song from the creator's collection, so the current redirect to the creator page is fine. What's broken is RD's build: with from=creator in the URL it still shows the community list and disables Previous/Next.

---

## YMW260930P0008 — [Home][Countly event][YCM_Subscription_Page] There is no event when upgrade with the bottom-left upgrade button

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 0930
- Reported by JOANNE_HSIEH at 2026-09-30T14:59:28
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW260930P0008
- Retrieved at: 2026-10-07 18:42 CST
- Triage: **Not a prototype item** — the prototype has no analytics/Countly code at all; the tracking spec was already updated by YVONNE_LIU on 10-01 (`sidebar_premium_icon`, `account_premium_icon`). This is RD implementation work.
- Local status: **Diagnosed** — no change needed in the prototype.
- Decision needed: Transfer to RD (or confirm you want the prototype to model a `source` per upgrade entry point — it currently has none).
- Related code/spec: Upgrade entry points: `Sidebar.tsx` (bottom-left), `ProfileView.tsx` Muse Pro row, `CreditsView.tsx` "Get Muse Pro" (opens its own `BuyCreditsModal`→`SubscribeModal`, not the shared `openSubscribe`), plus top-right crowns in `Navbar`/`DetailNavbar`/`RoomNavbar`/`MobileHeader`. `SubscribeProvider.openSubscribe` takes no source.

### Report

- Short Description:
  [Home][Countly event][YCM_Subscription_Page] There is no event when upgrade with the bottom-left upgrade button
- Repro Steps:
  1. Login https://testing-ycm.makeupar.com/en with account that hasn't upgraded
  2. Click the bottom-left upgrade button
  3. Select a plan and subscribe
  4. Click close button in credit card payment page
  5. Check event in dev tool Network
- Result:
  There is no event when upgrade with the bottom-left upgrade button
- Expect Result:
  Pls check if this is expected
  It should has YCM_Popup_Subscribe event when user close the credit card payment page
- Note:
  It has event when upgrade with the top-right upgrade button

### Attachments
- bottom-left upgrade button.mp4  `iForm/2026/09/30/9ddd1a7a-2a15-49cd-aff0-3a79baff0e77.mp4`
- bottom-left upgrade button.png  `iForm/2026/09/30/beb3c275-15e6-4372-80b6-99b950ea9c2c.png`
- top-right upgrade button.mp4  `iForm/2026/09/30/2387ef6a-7b31-4c9a-a093-7da3f0fa6fba.mp4`
- top-right upgrade button.png  `iForm/2026/09/30/f898e375-4e08-4b32-949d-7bf4fc578712.png`
- upgrade button in Account.png  `iForm/2026/09/30/f81d8dd1-d181-4ca8-bfab-aa42a076b59f.png`
- Get-Muse-Pro button.png  `iForm/2026/09/30/0fcdbf5f-351e-467c-a818-158b55c12976.png`

### Comments
- **JOANNE_HSIEH** (2026-09-30T15:10:32): There's no event when clicking the upgrade button on '/profile' and '/profile/credits' page (upgrade button in Account.png)(Get-Muse-Pro button.png)
Pls also check if this is expected
- **SMITH_LEE** (2026-10-01T15:03:12): no proper 'source' for upgrade button from doc
- **YVONNE_LIU** (2026-10-01T16:40:10): spec updated: https://perfectcorp365-my.sharepoint.com/:x:/r/personal/dept_management_internal_perfectcorp_com/_layouts/15/Doc.aspx?sourcedoc=%7B08375050-3127-4249-8CD6-58303A8FD883%7D&file=YCM_1.0_spec_trackingrequest.xlsx&action=default&mobileredirect=true
Add souce "sidebar_premium_icon" when clicking bottom-left upgrade button
Add source "account_premium_icon" when clicking account upgrade button

### Resolution and verification

- Root cause: Production fires the event only from the top-right entry point; the other entry points pass no source.
- Resolution: —
- Verified: —
- Not verified: —

### Reply comment (paste into eBug)

No change in the mockup: it has no analytics code, so there is nothing to fix or compare against there. The tracking spec was updated on 10-01 (sidebar_premium_icon for the bottom-left Upgrade, account_premium_icon for the Account upgrade buttons, including Get Muse Pro on /profile/credits), so this is now for RD to implement. Please transfer to RD.

---
