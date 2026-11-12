# PM Jason eBug triage — 2026-11-12
---


- Retrieved at: 2026-11-12T15:30:09+08:00
- Repository: origin/main `ed8bfc4` (fast-forwarded from `ef111e4`; 10 commits).
- Query: ProductID 315 (YouCam Muse Web), BugBelong PM, statuses NewCreated + Assigned (`search --ycm-web --pm-open`). 7 results; all Handler JASON_CHEN. Assignee JASON_CHEN for 6; SMITH_LEE for YMW261014P0001.
- Scope: user approved fixing the first four items from the discussion (YMW261021P0002, YMW261109P0002, YMW261103P0001, YMW261103P0002), explicitly choosing exit-fullscreen-before-report. Subsequently Jason approved the Newly Released MV definition for RD handoff (no implementation requested), and approved implementing the subscription-expiry prototype/spec (YMW261022P0001). Jason also approved keeping the crown as subscription entry and separating subscription/credit tracking by actual flow; spec and seven-ticket completeness audit are authorized. No commit, push, deployment, or ePF mutations performed.
- Evidence: full reports, deduplicated comments, status logs, and all 9 attachments read. Attachments remain in temporary scratch space, not this repository.
- Verification: typecheck PASS; lint exit 0 (one pre-existing unused `dirname` warning in scripts/computed-style-diff.mjs); all 209 Vitest tests PASS (26 files); production build PASS (network-enabled retry needed for existing Google Inter font). Guard greps, designer CSS check (46 verbatim files), and diff whitespace check PASS.
- Browser verification: all 6 cases in e2e/pm-jason-fixes.spec.ts PASS, run in three narrowly scoped pairs: `--grep 'monthly copy'` (8.3s), `--grep 'both effect strips'` (10.1s), `--grep 'fullscreen exits'` (final settled run 8.4s). CSS asset responses checked before measurements. Chromium screenshots inspected at 390/1440 for /profile Monthly dialog, /song/create language notice, /mv/edit Title/Subtitle strips; /watch signed-in and guest-to-sign-in-to-report at 1440.
- Mutation verification: disabling fullscreen waiting, mouse scroll movement, and language-reason mapping made 8 targeted tests fail; restoring the implementation made all 8 pass. No mutation remains.
- Verification limits: this is the local backend-less prototype, not RD testing/production; actual engine error transport/detection and native iOS fullscreen not tested. No full e2e or @visual snapshot run; canonical Linux baselines and storyboard images not regenerated. Monthly dialog copy changed; ordinary default Weekly subscribe baseline does not show it. Port 3100 left free; no build/test process left running.

---

## YMW261110P0003 — [Home] Published MVs don't appear in Newly Released Music Videos

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1110
- Reported by KURT_WANG at 2026-11-10T16:19:50
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261110P0003
- Retrieved at: 2026-11-12T15:30:09+08:00
- Triage: Clear to fix
- Local status: Investigating
- Decision needed: Resolved by Jason on 2026-11-12: Newly Released MV includes all users’ public, display-eligible MVs, ordered by publication time descending. RD must confirm existing visibility eligibility rules and API implementation; no prototype implementation requested in this follow-up.
- Related code/spec: src/components/community/MvExplore.tsx; src/components/community/MvGridSections.tsx; src/lib/mv/community.ts; specs/areas/04-explore-community.md

### Report

- Short Description:
  [Home] Published MVs don't appear in Newly Released Music Videos
- Repro Steps:
  1. Login YCM Web
  2. Home > click "See All" of trending music videos
  3. Scroll down and check Newly Released Music Videos
- Result:
  There only show old music videos that author is YouCam Muse.
- Expect Result:
  There should show newly published music videos.
- Note:
  In Top Picks Songs page, there can see other authors' songs and my published songs in newly songs list. (Refer 2026-11-10_163121-Newly_Song.jpg)

### Attachments
- 2026-11-10_161939.jpg  `iForm/2026/11/10/1379061b-98b6-46b7-b849-89787d47b2d5.jpg`
- 2026-11-10_163121-Newly_Song.jpg  `iForm/2026/11/10/b133397d-3566-4e4d-a64e-ce9b0bd3327d.jpg`

### Comments
- **RUBY_FENG** (2026-11-11T11:35:33): Currently, the MV API only provides two categories: trendingMvs and officialMvs.
The UI titles are mapped to the following API categories:
Trending Music Videos → trendingMvs
Newly Released Music Videos → officialMvs

However, the backend currently does not provide a category specifically for newly released MVs. We need to discuss the backend logic and confirm whether a new category should be added for newly released MVs.

### Evidence and proposed resolution

RD Ruby 11/11 留言指出目前 Newly Released 對應 officialMvs，API 僅有 trendingMvs / officialMvs。建議 RD 增加或提供按發布時間排序的公開 MV 分類；前端對接該分類。需定義審核、隱藏、刪除及分頁；本 repo 使用 NEW_MVS 靜態 fixture，無真實 API，不能由 prototype 驗證 RD 分類。

### Status log

- 2026-11-10T16:19:50.069 — Create / Create eBug (KURT_WANG)
- 2026-11-10T16:19:50.227 — NewCreated / Assign (RUBY_FENG)
- 2026-11-11T11:35:52.053 — Assign / Save (RUBY_FENG)

### Resolution and verification

- Root cause: 程式／附件證據及限制見上；未宣稱已重現 RD 環境。
- Resolution: Product scope approved; handoff draft below. Awaiting RD implementation; not fixed in prototype or deployed.
- Verified: ePF metadata / report / comments / attachments / status logs read; relevant current source inspected.
- Not verified: local browser behavior, RD build, production, automated checks.

### Reply comment (paste into eBug)


### RD handoff draft — approved product definition (2026-11-12)

Newly Released Music Videos must include public, display-eligible MVs published by all users, not only official YouCam Muse content. Sort by publication time descending (newest first), not creation/generation/update time. Keep Trending Music Videos behavior unchanged.

Ruby’s 2026-11-11 comment says this section currently maps to officialMvs. Please provide the appropriate newly released feed/category and have the frontend consume it; the API/category name is RD’s implementation choice. Use the existing public-display eligibility rules to exclude private, unpublished, deleted, or otherwise ineligible content. Please confirm which publication timestamp and eligibility rules the API will use. Stable ordering and pagination should avoid duplicates/omissions when publication timestamps tie.

Acceptance: a non-official user publishes an eligible public MV → it appears ahead of older publications after feed refresh; a newer draft/generation without publication does not outrank a later publication; private/unpublished/deleted/ineligible content is excluded; existing official content is eligible under the same rules; Trending is unaffected. Republication timestamp semantics are not decided in this discussion and should be raised separately if the existing behavior is undefined.

This is a handoff proposal, not a claim that a fix has shipped. No ePF comment posted.

---

## YMW261109P0002 — [Home][AI Music Video] Report Music Video window doesn't appear on top if user reports the music video in full-screen mode

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1109
- Reported by KURT_WANG at 2026-11-09T18:14:37
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261109P0002
- Retrieved at: 2026-11-12T15:30:09+08:00
- Triage: Clear to fix
- Local status: Verified
- Decision needed: Resolved by user on 2026-11-12; first four approved, fullscreen report exits first.
- Related code/spec: src/components/community/CommunityMvPlayer.tsx; src/components/ui/ReportDialog.tsx; src/lib/fullscreen.ts; src/components/share/ShareLinkView.tsx; specs/areas/14-content-report.md

### Report

- Short Description:
  [Home][AI Music Video] Report Music Video window doesn't appear on top if user reports the music video in full-screen mode
- Repro Steps:
  1. Login YCM Web
  2. Home > click a Music Video
  3. Enter full-screen mode
  4. Click the report button
- Result:
  UI is no reaction. User needs to exit full-screen mode to see the window.
- Expect Result:
  The window appear on the top in full screen mode, or exit the full-screen mode and show the window.
- Note:
  On prototype, behavior is the same as current implementation.

### Evidence and proposed resolution

程式證據：播放器請求 container fullscreen，ReportDialog portal 到 document.body；Fullscreen top layer 外的 dialog 無法靠 z-index 蓋上。建議點 Report 後先 await exitFullscreen，再執行登入／檢舉／重複檢舉提示，失敗需處理。檢查共用 useReportContent 的所有入口，包含訪客登入與原生影片全螢幕 fallback。未進行瀏覽器重現。

### Status log

- 2026-11-09T18:14:37.285 — Create / Create eBug (KURT_WANG)
- 2026-11-09T18:14:37.5 — NewCreated / Assign (RUBY_FENG)
- 2026-11-10T10:23:35.176 — Assign / Save (RUBY_FENG)

### Resolution and verification

- Root cause: Evidence and diagnosis above; browser/units establish the prototype behavior. No claim of a live RD build fix.
- Resolution: Shared useReportContent now awaits exitFullscreen before report/sign-in/duplicate/limit flow, deduplicates presses while exiting, catches exit failures and portals guidance into the fullscreen player. Every useReportContent caller benefits, including CommunityMvPlayer and ShareLinkView; no duplicate report-entry implementation found. ReportDialog unit tests cover pending exit, guest continuation, exit failure/retry; real Home → /watch fullscreen → report and guest → Google mock sign-in → report pass. Area 14 and CHANGELOG-SPEC updated.
- Verified: Shared Definition of Done, scoped browser checks and mutation tests listed at the top. Local prototype only.
- Not verified: RD testing/production; full e2e; canonical Linux visual snapshots. No commit/push/deployment.

### Reply comment (paste into eBug)

本機 prototype 現在於全螢幕點檢舉後，先退出全螢幕再顯示檢舉視窗；訪客則先登入，成功後接續檢舉。已驗證兩條流程，尚未 commit 或部署，RD 測試站及正式站尚未更新。

---

## YMW261103P0002 — [AI Music Video][Edit MV] User can't drag to scroll horizontally through the thumbnails of title effect and subtitle effect

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1103
- Reported by KURT_WANG at 2026-11-09T11:43:17
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261103P0002
- Retrieved at: 2026-11-12T15:30:09+08:00
- Triage: Clear to fix
- Local status: Verified
- Decision needed: Resolved by user on 2026-11-12; first four approved, fullscreen report exits first.
- Related code/spec: src/components/mv/EditTitleSubtitleDialog.tsx; src/styles/designer-overrides.css (.effects-dialog__strip); specs/areas/02-mv-creation.md

### Report

- Short Description:
  [AI Music Video][Edit MV] User can't drag to scroll horizontally through the thumbnails of title effect and subtitle effect
- Repro Steps:
  1. Login YCM Web
  2. History > edit a MV > Edit effects
  3. Try to drag to scroll horizontally through the thumbnails
- Result:
  User can't drag to scroll horizontally through the thumbnails of title effect and subtitle effect.
- Expect Result:
  Please help check if it's need to support drag to scroll horizontally.
- Note:
  Current behavior is the same as prototype.

### Attachments
- 2026-11-09_114255.jpg  `iForm/2026/11/09/1bdd2a69-ec2d-4a6d-994e-1c7f85f9591e.jpg`

### Evidence and proposed resolution

程式具有水平 overflow 與鍵盤操作，未見滑鼠拖曳處理。建議保留 touch/trackpad 原生捲動，增加滑鼠 pointer 拖曳，超過門檻才算拖動，拖動結束不得誤選效果；兩個 tab 同步涵蓋，不影響鍵盤選取。QA 說明與 prototype 一致，屬待產品確認的互動擴充。

### Status log

- 2026-11-09T11:43:17.083 — Create / Create eBug (KURT_WANG)
- 2026-11-09T11:43:17.334 — NewCreated / Assign (RUBY_FENG)
- 2026-11-10T10:22:15.078 — Assign / Save (RUBY_FENG)

### Resolution and verification

- Root cause: Evidence and diagnosis above; browser/units establish the prototype behavior. No claim of a live RD build fix.
- Resolution: One shared strip implementation handles both tabs: left mouse drag starts after 6px, captures pointer and changes scrollLeft; post-drag pointer click is suppressed, keyboard clicks remain active. Touch/trackpad are left native. Cancel/lost capture clear drag state; drag styling stays in designer-overrides.css (gated designer CSS untouched). Both-tab units and real pointer dragging at 390/1440 pass, followed by ordinary click/keyboard selection. Area 02 EFX-1 and CHANGELOG-SPEC updated.
- Verified: Shared Definition of Done, scoped browser checks and mutation tests listed at the top. Local prototype only.
- Not verified: RD testing/production; full e2e; canonical Linux visual snapshots. No commit/push/deployment.

### Reply comment (paste into eBug)

本機 prototype 的 Title／Subtitle 效果縮圖列已支援滑鼠水平拖曳，拖動不會誤選效果，原有點選與鍵盤操作維持可用。已檢查 390／1440px，尚未 commit 或部署，RD 測試站及正式站尚未更新。

---

## YMW261103P0001 — [AI Songs] The warning message that appears after clicking 'Enhance' with an unsupported language is not clear enough

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1103
- Reported by KURT_WANG at 2026-11-03T15:45:36
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261103P0001
- Retrieved at: 2026-11-12T15:30:09+08:00
- Triage: Clear to fix
- Local status: Verified
- Decision needed: Resolved by user on 2026-11-12; first four approved, fullscreen report exits first.
- Related code/spec: src/components/ui/EnhanceButton.tsx; src/components/song/SongCompose.tsx; src/lib/mv/songLanguage.ts; specs/areas/03-song-creation.md AC-SONG-22

### Report

- Short Description:
  [AI Songs] The warning message that appears after clicking 'Enhance' with an unsupported language is not clear enough
- Repro Steps:
  1. Login YCM Web
  2. AI Songs > input contents for idea in čeština
  3. Click Enhance button and check result
- Result:
  The warning message that appears after clicking 'Enhance' with an unsupported language is not clear enough.
- Expect Result:
  Please help check if it's need to be changed or not.

### Attachments
- 2026-11-03_153740-response.jpg  `iForm/2026/11/03/52483ada-2977-4b88-8405-b2f467ad2121.jpg`
- 2026-11-03_153722.jpg  `iForm/2026/11/03/cd482646-440d-4fd4-8725-f430635b5660.jpg`

### Evidence and proposed resolution

附件 response 明確指出 unsupported song language: Czech，UI 卻顯示 internal error。現有 AC-SONG-22 僅規範 Create Song，EnhanceButton 無 catch 錯誤分流；應以 RD 的結構化語言錯誤識別映射提示，其他錯誤仍走一般失敗，不把所有 invalid_parameter 當成語言問題，不加前端語言偵測；保留輸入、釋放 loading、不收 credits。prototype mock 不回傳這個實際錯誤，需 mock 支援才能演示。

### Status log

- 2026-11-03T15:45:35.137 — Create / Create eBug (KURT_WANG)
- 2026-11-03T15:45:36.267 — NewCreated / Assign (RUBY_FENG)
- 2026-11-03T15:47:54.049 — Assign / Save (RUBY_FENG)

### Resolution and verification

- Root cause: Evidence and diagnosis above; browser/units establish the prototype behavior. No claim of a live RD build fix.
- Resolution: EnhanceButton catches rejections and supplies an optional per-caller error callback (generic fallback for other contexts). Both SongCompose instances (Simple describe and Custom lyrics with song/lyrics directions) map only the explicit `unsupported song language` reason in errorMessage or adapter Error.message to the existing supported-language toast/list. Generic invalid_parameter remains generic. API signature unchanged; RD must preserve the reason in its rejection. Input remains intact, busy clears, no credits charged; existing demo flag extends to Enhance after the API response without mutating input. 6 SongCompose integration unit cases, 7 classifier cases and 2 EnhanceButton tests pass. Browser demo verified 390/1440. Area 03 and CHANGELOG-SPEC updated.
- Verified: Shared Definition of Done, scoped browser checks and mutation tests listed at the top. Local prototype only.
- Not verified: RD testing/production; full e2e; canonical Linux visual snapshots. No commit/push/deployment.

### Reply comment (paste into eBug)

本機 prototype 的 Enhance 收到明確「不支援歌曲語言」原因時，會顯示不支援語言提示與支援列表，保留輸入並可重試；其他錯誤維持一般失敗提示。已用錯誤模擬及 demo 狀態驗證，RD 仍須保留引擎的語言錯誤原因供畫面判別；尚未 commit 或部署。

---

## YMW261022P0001 — [Account] Credit record does not show the expired subscription credit

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1022
- Reported by JOANNE_HSIEH at 2026-10-22T18:48:42
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261022P0001
- Retrieved at: 2026-11-12T15:30:09+08:00
- Triage: Clear to fix
- Local status: Verified
- Decision needed: Resolved by Jason on 2026-11-12: add a negative unused-remainder expiry row in All only, exclude Spend and Earn; update prototype/spec and prepare RD handoff.
- Related code/spec: src/components/credits/CreditsView.tsx; src/lib/user.ts (CreditTxn / CREDIT_TRANSACTIONS); src/components/providers/CreditsProvider.tsx (read only); src/lib/demoStore.ts; src/components/credits/CreditsView.test.tsx; e2e/pm-jason-fixes.spec.ts; specs/areas/07-credits-iap.md AC-CR-14; specs/storyboards/credits-iap/build_spec.py (S5 v4)

### Report

- Short Description:
  [Account] Credit record does not show the expired subscription credit
- Repro Steps:
  1. Login https://develop.d266r77tgi2360.amplifyapp.com/en
  2. Subscribe Pro
  3. Cancel the subscription
  4. Wait for the credit to expire
  5. Check the credit record
- Result:
  Credit record does not show the expired subscription credit
- Expect Result:
  Pls check if this is ok

### Attachments
- result (12).png  `iForm/2026/10/22/41b26ea8-e5a0-4e56-a035-31aa8bd9005e.png`

### Evidence and resolution

The prototype had only a static Welcome bonus row and classified Spend by negative amount, which would incorrectly include any expiry deduction. Actual time-based expiry is explicitly backend-deferred; this run changes the presentation and specification, not a live accounting service.

- Added explicit local transaction kinds (earn/spend/refund/expiry). All includes expiry; Spend contains usage and generation refunds; Earn contains grants/purchases. No C1–C8 wire contract changed.
- Default new-account history remains Welcome bonus +10. New reversible Demo-panel flag **Credits — expired subscription history** (`creditsExpiryHistory`) shows a dated +1,000 grant, -300 MV usage, -700 Subscription Credits Expired, plus Welcome +10. The example sums to the default 10 balance without mutating CreditsProvider. `creditsEmpty` wins over the fixture.
- Spec now defines actual expiry of unused remainder, retention of original grant, no immediate deduction on cancellation, per-batch idempotency and consistent balance/ledger posting, with other valid credits preserved. Real expiry calculation/posting remains RD-owned.
- Updated area 07 CR-P3-S2/S3, AC-CR-14, QA checklist and TBD-CR-04; CHANGELOG-SPEC; S5 v4 authoring source, flowchart, linked/bundled HTML; generated specs/index.html. Existing default-state S5 screenshots retained and explicitly distinguished from the expiry demo.

### Status log

- 2026-10-22T18:48:42.008 — Create / Create eBug (JOANNE_HSIEH)
- 2026-10-22T18:48:42.243 — NewCreated / Assign (RUBY_FENG)
- 2026-10-29T16:09:31.269 — Assign / Save (RUBY_FENG)

### Resolution and verification

- Root cause: missing expiry presentation fixture/type; sign-only filtering would conflate expiry with usage. Production expiry posting is outside this backend-less repo.
- Local status: Verified prototype/spec; no commit or deployment.
- Definition of Done: typecheck PASS, lint exit 0 (pre-existing computed-style-diff.mjs unused dirname warning), all 213 tests PASS (27 files), fresh production build PASS.
- Regression: four CreditsView unit cases pass; restoring sign-only Spend filtering makes the All-only test fail, restoring type-based filtering makes it pass.
- Browser: two scoped `subscription expiry history` cases PASS (final run 4.3s); real Demo-panel enable/disable, All/Spend/Earn behavior, default restoration, expiry date/amount and painted icon checked at 390/1440. CSS assets returned 200. All/Spend screenshots inspected after transitions.
- Spec: flowchart geometry and spec validation PASS (0 warnings); S5 v4 regenerated, opened in Chromium and P5 screenshot inspected; image references load. Consolidated index regenerated.
- Not verified: real backend expiry/balance posting, RD testing/production, full e2e and canonical Linux visual snapshots. Default /profile/credits baseline is unchanged because the new fixture is opt-in; no snapshot baselines re-recorded. No server/build/test left running.

### Reply comment (paste into eBug / RD handoff)

PM 確認：訂閱 credits 實際到期時，請新增「Subscription Credits Expired」負數明細，顯示到期日期與該批次尚未使用的到期數量，只顯示於 All，不列入 Spend／Earn，並保留原始發放紀錄（例如發放 +1,000、使用 -300、到期 -700）。取消訂閱當下不直接扣除；請由後端處理到期扣款及明細的一致性與去重，不影響其他仍有效的 credits。Prototype 與 spec 已完成本機更新與驗證，尚未部署；RD 仍需實作實際到期帳務，正式站尚未變更。

---

## YMW261021P0002 — [Auto][Account] Monthly plan subtitle claims "5x the credits" when actual increase is only 2x

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1021
- Reported by CRUZ_CHU at 2026-10-21T15:17:26
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261021P0002
- Retrieved at: 2026-11-12T15:30:09+08:00
- Triage: Clear to fix
- Local status: Verified
- Decision needed: Resolved by user on 2026-11-12; first four approved, fullscreen report exits first.
- Related code/spec: src/lib/user.ts (SUBSCRIPTION_PLANS.monthly_pro); src/components/credits/SubscribeModal.tsx; specs/areas/07-credits-iap.md

### Report

- Short Description:
  [Auto][Account] Monthly plan subtitle claims "5x the credits" when actual increase is only 2x
- Repro Steps:
  1. Go to Home > Upgrade Plan.
  2. Select Monthly billing option.
  3. Compare the subscription plan subtitle with the actual credit allocation.
- Result:
  The subtitle displays "5x the credits, create more freely."
  The credit increases from 1,000 credits (Monthly Standard) to 2,000 credits (Monthly Pro), which is only a 2x increase.
- Expect Result:
  The subtitle text accurately reflect the credit multiplier (e.g., "2x the credits"),

### Attachments
- result.png  `iForm/2026/10/21/2d069244-cc67-4e67-a07e-cfb87a779f78.png`

### Evidence and proposed resolution

程式與附件一致：Monthly Basic 1000，Pro 2000，description 誤寫 5x。建議僅把 Monthly Pro 改為 2x the credits, create more freely.；Weekly 的 1000/200=5x 正確保留，Yearly 現無倍數文案不擴大修改。實作時查核所有相同文案與桌機／手機共用卡片。

### Status log

- 2026-10-21T15:17:25.577 — Create / Create eBug (CRUZ_CHU)
- 2026-10-21T15:17:25.816 — NewCreated / Assign (RUBY_FENG)
- 2026-10-29T16:08:43.176 — Assign / Save (RUBY_FENG)

### Resolution and verification

- Root cause: Evidence and diagnosis above; browser/units establish the prototype behavior. No claim of a live RD build fix.
- Resolution: Changed only SUBSCRIPTION_PLANS.monthly_pro.description from 5x to 2x. Weekly remains 5x; Yearly unchanged. Browser confirms Monthly/Weekly switching at 1440 and correct DOM data at 390 (phone design intentionally omits description text). Area 07 and CHANGELOG-SPEC updated.
- Verified: Shared Definition of Done, scoped browser checks and mutation tests listed at the top. Local prototype only.
- Not verified: RD testing/production; full e2e; canonical Linux visual snapshots. No commit/push/deployment.

### Reply comment (paste into eBug)

月費 Pro 的說明已在本機 prototype 改為「2x the credits」，週費的 5x 維持不變；已檢查月／週方案切換與桌機、手機版。尚未 commit 或部署，RD 測試站及正式站尚未更新。

---

## YMW261014P0001 — [Home][Event countly][YCM_Credit_Purchase_Page][YCM_Credit_Popup_Page] Can't find the event which source is launcher_premium_icon

- ePF status: NewCreated
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: SMITH_LEE
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1014
- Reported by KURT_WANG at 2026-10-14T11:50:39
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261014P0001
- Retrieved at: 2026-11-12T15:30:09+08:00
- Triage: Clear to fix
- Local status: Verified
- Decision needed: Product decision resolved on 2026-11-12: crown remains subscription; track subscription and credit-pack flows separately. RD must supply actual subscription event names/schema and verify Countly delivery.
- Related code/spec: src/components/shell/MobileHeader.tsx; src/components/shell/RoomNavbar.tsx; src/components/providers/SubscribeProvider.tsx; specs/areas/01-app-shell.md; specs/areas/07-credits-iap.md

### Report

- Short Description:
  [Home][Event countly][YCM_Credit_Purchase_Page][YCM_Credit_Popup_Page] Can't find the event which source is launcher_premium_icon
- Repro Steps:
  1. Login testing website (https://develop.d266r77tgi2360.amplifyapp.com/en/history)
  2. Click the premium button in homepage on a mobile device
  3. Check event
- Result:
  Can't find the event which source is launcher_premium_icon. It always pops up a upgrade the plan window.
- Expect Result:
  Please help check if it's expected.

### Attachments
- 2026-10-14_114836.jpg  `iForm/2026/10/14/4fd6a4c0-aa6b-42b4-ae53-ab0162c97b61.jpg`
- 2026-10-28_163619.jpg  `iForm/2026/10/28/bdcbd8a3-ef44-40ed-9ffd-463ad3515818.jpg`

### Comments
- **TIMOTHY_LIU** (2026-10-16T11:33:44): Please have RD review this to ensure it complies with the specifications.
- **SMITH_LEE** (2026-10-19T16:59:47): Hi PM,
on prototype,
mobile header has no premium button for buying credits.
pls check.

### Evidence and proposed resolution

10/28 附件列出的 Credit_Purchase/Popup source 包含 launcher_premium_icon；RD Smith 留言問 prototype 無買 credits 皇冠。程式有 2026-08-23 產品決策：皇冠 openSubscribe，且 subscribed 用戶不顯示；購買 credits 為訂閱者專屬。因此不能僅為產生 credit 事件改變皇冠目的地。建議先對齊 tracking spec，為實際顯示訂閱頁／購買 credits 的事件保留正確 source；本 repo 無找到這兩個事件或 Countly 實作，RD 端實際送出須另驗。

### Status log

- 2026-10-14T11:50:39.119 — Create / Create eBug (KURT_WANG)
- 2026-10-14T11:50:39.382 — NewCreated / Assign (TIMOTHY_LIU)
- 2026-10-16T11:33:56.966 — Assign / Save (TIMOTHY_LIU)
- 2026-10-16T11:33:57.112 — Assigned / Assign (RUBY_FENG)
- 2026-10-16T16:49:07.007 — Assign / Save (RUBY_FENG)
- 2026-10-16T16:49:07.241 — Assigned / Edit BugBelong (SMITH_LEE)
- 2026-10-19T16:58:29.288 — Edit BugBelong / Save (SMITH_LEE)

### Resolution and verification

- Root cause: the credit-event source list in the ticket attachment does not match the approved crown subscription route. This is evidence of a tracking-expectation mismatch, not proof of missing production telemetry.
- Resolution: area 07 §3.1/AC-CR-15 defines event-family/source mapping; area 01 documents both phone crown copies. `launcher_premium_icon` remains a subscription source; credit page/result events require an actual credit-pack flow. Exact existing subscription event names/schema remain RD follow-up (`TBD-CR-12`).
- Prototype: no product code change needed. MobileHeader and RoomNavbar already openSubscribe and hide the crown when subscribed. BuyCreditsModal already gates packs to subscribers. No analytics SDK, fake transport or extra purchase entry added.
- Verified: two scoped browser cases (Home and History, 390px) PASS in 8.7s: crown opens Upgrade Your Plan, not Buy Credits; subscribe hides crown; client-side navigation to the actual Buy More entry opens Buy Credits. CSS assets checked. Six affected storyboard sources/flowcharts regenerated with zero validation warnings; Monthly screenshot refreshed.
- Not verified: actual Countly event delivery, subscription event names/schema, RD testing/production. No deployment, commit or ePF change. No full e2e/visual baseline run.

### Reply comment (paste into eBug / RD handoff)

PM 確認：手機 Home／History 皇冠維持開啟訂閱方案，訂閱流程請記錄 source=launcher_premium_icon，實際訂閱事件名稱及參數請 RD 對照現有 Countly 定義確認。YCM_Credit_Purchase_Page／YCM_Credit_Popup_Page 僅用於真正的購買 credits 流程，請移除目前購點事件規格中不可到達的 launcher_premium_icon 來源預期；不要為了產生事件改變皇冠入口或補送購點事件。Spec 與入口行為已完成本機確認、尚未部署；prototype 沒有 Countly SDK，請 RD 確認訂閱事件是否已正確上報，若已上報則修正 tracking spec／QA 預期，若漏報再補訂閱埋點。

---

## Final seven-ticket prototype/spec audit — 2026-11-12

| eBug | Approved requirement | Authoritative spec / storyboard | Local prototype status | RD / production still required |
| --- | --- | --- | --- | --- |
| YMW261021P0002 | Monthly Pro 2x; Weekly remains 5x | Area 07, S5 v5 | Changed and verified; Monthly screenshot refreshed | Carry copy change to RD app |
| YMW261109P0002 | Exit fullscreen before report/sign-in | Area 14, S11 v3 | Changed and verified for signed-in/guest; exit-failure retry units | Apply/verify in RD app; native iOS not tested |
| YMW261103P0001 | Clear unsupported-language Enhance feedback | Area 03, S1 v6 | Both compose paths and directions changed; rejection/demo verified | Preserve engine language reason in adapter; real engine transport not tested |
| YMW261103P0002 | Mouse drag both effect strips without accidental selection | Area 02, S3 v10 | Changed; Title/Subtitle at 390/1440 verified | Apply/verify in RD app |
| YMW261110P0003 | All-user eligible public MVs sorted by publication time | Area 04 AC-EXP-15, S8 v5 | Existing multi-author, newest-first static fixture retained; no live feed is claimed | Newest-publication API/category, timestamp/eligibility, refresh and stable paging |
| YMW261022P0001 | Negative expiry remainder row in All only | Area 07 AC-CR-14, S5 v5 | Reversible Demo fixture and typed filtering changed; four units and two browsers pass | Actual expiry accounting, idempotent posting and matching balance |
| YMW261014P0001 | Crown stays subscription; event family follows actual flow | Areas 01/07 AC-CR-15, S6 v5 / S5 v5 | Existing routing retained; two new phone browser cases pass; no SDK present | Confirm subscription event names/schema and Countly reporting; align tracking sheet |

- All seven now have an approved product decision, an area-spec update, and synchronized relevant storyboard text. Five required prototype changes; two preserve existing UI and specify real-service requirements for RD. This does not mean all seven are fixed in the RD application.
- Latest full local checks: typecheck/lint/213 unit tests/build passed during this sequence. Scoped browser checks total ten cases across the five local fixes and two crown entry paths; full e2e and canonical visual snapshots are not claimed.
- Storyboard versions: S1 v6, S3 v10, S5 v5, S6 v5, S8 v5, S11 v3. Existing step IDs preserved. Flowchart geometry/spec validation passed; generated linked/bundled HTML and specs/index.html synchronized. Only S5's old Monthly 5x screenshot required a content correction and was recaptured; no blanket screenshot re-recording.
- No commit, push, deployment or external ePF comment/status change. Original unrelated ../.claude/launch.json preserved. Servers/builds/tests must be stopped before handoff.
