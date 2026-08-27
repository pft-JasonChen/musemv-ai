# Handover — 空狀態 / 錯誤狀態 / Reject UI(2026-08-27)

> **下一個開發 session 從這裡開始。** 這份文件是自足的:七項待辦的規格、每一項現在的程式碼長
> 什麼樣、該改哪一行、以及哪些決定已經拍板不用再問。**不需要回頭讀對話紀錄。**
>
> **給設計師(和設計師的 agent)的是另一份:`docs/DESIGNER-HANDOFF-2026-08-27.md`。**
> 同一批工作,但那份講稿 —— 15 張的清單、每一張可以直接打開的網址、要遵守的既有規則、交稿程序,
> 以及 5 個要設計師回答的問題。設計師來的時候把那份給他,不是這一份。

## 0. 一頁摘要

產品負責人 2026-08-27 提了三組需求。**第 1、2 組已經做完並通過所有 gate;第 3 組做完了「觸發機制」,
七個畫面本體等設計稿。**

| 組別              | 狀態            | 說明                                                |
| ----------------- | --------------- | --------------------------------------------------- |
| ① Footer 移除三條 | ✅ **完成**     | Pricing / Blogs / Storybook Creator。FAQ 刻意留佔位 |
| ② Feedback 調整   | ✅ **完成**     | 移除 Subject(含 `title` 合約)、附件上限 10MB → 5MB  |
| ③ 七個空/錯誤狀態 | 🟡 **骨幹完成** | demo panel 可觸發全部七項;**七個畫面本體等稿**      |

**這個 session 動過的檔案**(全部已 typecheck / lint / vitest / build 綠燈):

```
src/components/home/Footer.tsx              ① 移除三條連結
src/components/profile/FeedbackDialog.tsx   ② 移除 Subject 欄位
src/lib/feedback.ts                         ② 刪 SUBJECT_MAX、上限改 5MB
src/lib/api/schemas.ts                      ② 刪 title(C2 合約變更)
src/lib/api/mock.ts                         ② 錯誤訊息 · ③ 接上 jobFail flag
src/lib/i18n/dictionaries/en.ts             ② 刪 2 個 key、3 條文案改 5 MB
src/lib/publishReview.ts                    ③ 新增:7 種 reject 原因的 enum + 文案
src/lib/demoStore.ts                        ③ 新增:demo panel 的 external store
src/components/demo/useDemo.ts              ③ 新增:讀取用的 hook
src/components/demo/DemoPanel.tsx           ③ 新增:面板本體
src/components/shell/AppShell.tsx           ③ 掛載面板
+ 測試:demoStore.test.ts(新)· feedback.test.ts · behaviour-regressions.spec.ts
+ 文件:CHANGELOG-RD.md · specs/areas/06-profile-account.md · DESIGNER-TODO A29/A30
```

---

## 1. demo panel —— 先讀這一節,七項工作全部靠它驗收

### 怎麼打開

在任何網址後面加 `?demo=1`,例如 <http://localhost:3000/history?demo=1>。左下角會出現一顆
**`DEMO`** 小把手,點一下展開。

### 三件反直覺但刻意的設計

1. **`?demo=1` 是「開關」,不是「顯示條件」。** 它寫入 `localStorage["muse_demo"].enabled`,面板讀的
   是那個值。所以**只要加過一次,之後整站都看得到**,即使 `router.push()` 把 query 弄掉了也一樣。

2. **預設完全隱藏,而這是整個設計的地基。** 一個 `position: fixed` 的元素若預設就渲染,會:
   - 進到 `visual-baseline.spec.ts` 全部 **115 張**截圖 → 必須全部重拍。而 `AGENTS.md` 寫得很明確:
     **重拍基準圖等於接受它看到的一切**,所以那次重拍可能同時吸收掉 17 條路由上任何真實的回歸;
   - 進到 `e2e/a11y.spec.ts` 每一條路由的 axe 掃描;
   - 在 CEO demo 時出現在畫面上。

   預設隱藏,以上三件事一件都不會發生 —— **這次沒有任何 gate 需要改動**。這個性質有 e2e 守著
   (`demo panel: invisible by default…`),而且**雙向 mutation 測過**:把預設改成顯示,它會紅。

3. **展開時預設是收合的把手。** 在瀏覽器實測(800px):展開的 290px 卡片會**壓在 sidebar 的導覽連結
   上讓它們點不到**,而 QA 測這些狀態時必須能一邊切換一邊導覽。所以 arm 時給把手,展開是一次點擊。

4. **`[x]` 會連 flag 一起清掉,不只是隱藏。** 否則會留下一個假的空畫面在螢幕上,而使用者已經看不到
   那個開關了。清掉後只有 `?demo=1` 能救回來。

### 面板上有什麼

**八個狀態開關**(定義在 `src/lib/demoStore.ts` 的 `DEMO_FLAGS`):

| flag key          | 對應本文件第幾項 | `status` 欄位     |
| ----------------- | ---------------- | ----------------- |
| `historyEmpty`    | 2.1              | `awaiting-design` |
| `mySongsEmpty`    | 2.2              | `awaiting-design` |
| `creditsEmpty`    | 2.3              | `awaiting-design` |
| `profileEmpty`    | 2.4              | `awaiting-design` |
| `publishRejected` | 2.5(+ 原因下拉） | `awaiting-design` |
| `apiError`        | 2.6              | `awaiting-design` |
| `subOnApp`        | 2.7(+ 平台下拉） | `awaiting-design` |
| `jobFail`         | 額外(生成失敗）  | **`live`** ✅     |

`status` 是**誠實的記帳,不是裝飾**。`awaiting-design` 表示 flag 已接好、會存進 localStorage,但
**還沒有任何畫面在讀它**,面板上會顯示「⧗ awaiting designer artwork」。
**接上一項 UI 時,請在同一個 change 裡把它改成 `live`** —— 否則面板會繼續說謊。

**三顆帳號動作**(不是 flag,因為真正的 store 已經擁有這些狀態,用 flag 會變成兩個真相來源):
`Sign in / Sign out`(寫 `authStore`)· `Subscribe`(呼叫 `useAuth().subscribe`)· `Credits → 0`。

### 接一個 flag 進畫面的正確寫法

```tsx
const demoEmpty = useDemoFlag("historyEmpty");
const shown = demoEmpty ? [] : rows.filter(…);
```

**flag 必須是「最後決定畫什麼」的那一步**,不能是改變真實資料流的那一步。不要去把
`HISTORY_SAMPLES` 清空,也不要在 provider 裡短路 —— 一個會改動真實 state 的 demo 開關,可能把 app
留在面板自己都救不回來的狀態,而且會改變 flag 關閉時 production build 的行為。

### 為什麼不是一個 provider

刻意的。多加第八個 provider 到 `AppProviders` 會把一個 demo 工具塞進 **RD 依賴的 C4 合約面**,而
換不到任何好處。`useSyncExternalStore` 不需要 provider,所以 provider stack 完全沒動,
`providers.surface.test.ts` 也永遠看不到這些檔案。

> ⚠️ **`demoStore.getSnapshot()` 必須回傳「同一個物件」。** `useSyncExternalStore` 每次 render 都會
> 呼叫它,並用**物件identity**判斷要不要重新 render。每次都重新 parse JSON 就是無限 render loop ——
> 不是效能問題,是**整個 tab 當掉**。所以有那個 raw-string 快取,**不要把它「簡化」掉**。
> `demoStore.test.ts` 第一個測試就是守這件事,而且 mutation 測過(移掉快取 → 只有那一個測試會紅)。

---

## 2. 七項待辦 —— 每一項的規格與現況

### 2.1 History 無紀錄 —— 需要 **4 張**稿

- **檔案:** `src/components/history/HistoryView.tsx:232`
- **現況:** 一段通用文字,四個 tab 共用,靠字串插值換名詞
  (`Nothing here yet. Your {creations|music videos|songs|liked} will appear here.`)
- **四個 tab:** `All` · `Music Videos` · `Songs` · `Liked`(`FILTERS`,`HistoryView.tsx:30`)
- **接 flag 時要知道的兩件事:**
  - 這個畫面有**兩種來源**的資料:`history`(provider 裡真實產生的)與 `HISTORY_SAMPLES`(種子常數)。
    `historyEmpty` 要讓 `shown` 變成 `[]`,**兩種都要蓋掉**,否則永遠看不到空狀態。
  - `Liked` tab 的來源不一樣 —— 它只顯示 `source === "community"` 且被 like 的列
    (`HistoryView.tsx:130`,HIST-03)。所以「Liked 是空的」在真實世界比其他三個 tab 常見得多。

### 2.2 Choose Song → My Songs 空 —— 1 張(**且要先問要不要換掉現有的**)

- **檔案:** `src/components/mv/ChooseSongModal.tsx:116`
- **現況:** ⚠️ **七項裡唯一已經有 UI 的。** MV-11 的空狀態已經上線,是 WA 自撰的(用 DP 自己的
  `.mv-settings__row-title` / `--desc` 排版 + 共用 `.button`),因為 **DP 的歌曲目錄是常數、永遠不可能
  是空的**,所以 DP 根本沒有這張稿。
- **所以這一項的問題不是「畫一張」,而是「要不要換掉」。** 請把現況給設計師看,再決定。
- 另外注意:My Songs 對新使用者**本來就是空的**(那是預設狀態),不需要 demo 開關才看得到 ——
  `mySongsEmpty` 的價值只在於「已經有歌的帳號也能重現這個畫面」。

### 2.3 Credits Detail 無紀錄 —— 需要 **3 張**稿

- **檔案:** `src/components/credits/CreditsView.tsx`(`entries.map(...)`,約 line 105)
- **現況:** 🔴 **完全沒有空狀態分支。** `entries.map()` 直接展開,零筆就渲染一個空的 `<div>` ——
  不是「空狀態」,是**一片空白**。
- **三個 tab:** `All` · `Spend` · `Earn`(`CREDIT_TABS`)。三張是因為「All 空」與「Spend 空但 Earn 有」
  是不同情境:filter 是依 `amount` 正負推導的,所以單一 tab 空掉很常見。
- 種子資料是 `CREDIT_TRANSACTIONS`(`src/lib/user.ts:234`)。

### 2.4 Community profile 無作品 —— 需要 **3 張**稿

- **檔案:** `src/components/community/CreatorProfile.tsx`(`items.map(...)`,約 line 280)
  與 `src/components/profile/ProfileView.tsx`(Music Videos / Songs 兩個 tab)
- **現況:** 🔴 **兩個檔案都沒有空狀態分支。**
- **為什麼是 3 張(產品負責人拍板):**
  1. `/creator?self=1` —— **自己的**公開頁,空的。**要有「去建立」CTA。**
  2. `/creator` —— **別人的**頁,空的。**不能有 CTA** —— 叫使用者幫別人建立作品邏輯上是錯的。
  3. `/profile` 的兩個 tab —— 自己的帳號頁。
- `/creator` 用 `?self=1` 這個 query 區分前兩種視角(`CreatorProfile.tsx:117`)。
- 順帶一提,`src/components/community/EmptyState.tsx` 已經有一組 `CommunityEmpty`
  (`empty` / `not-found` / `offline` 三態),被 `MvExplore` / `SongDetailView` / `CommunityMvPlayer`
  用著。**它是 WA 自撰、不是 DP 的**,可以當作參考或替換對象。

### 2.5 送審被 reject —— 需要 **2 處** UI + 7 種原因文案

這一項**不只是 UI**,是七項裡唯一會動到狀態機與後端合約的。

- **要顯示在哪(產品負責人拍板 2 處,不是 4 處):**
  1. **History 列表的卡片上** —— 使用者回頭找自己作品的主要入口。目前這裡**卡面上看不出任何審核
     狀態**,只有 ⋯ 菜單裡有「Publish (Review)」+ `ic_timer`(`HistoryView.tsx:668`)。
  2. **`/mv/result` 的 Publish 區塊** —— 已經有一行狀態文字
     (`Published · pending review` / `Off`,`MvResult.tsx:352`),reject 只是第三種字串。
  - **明確不做:** Creator/Community profile(被 reject 的內容本來就不該出現在公開頁,那裡應該是
    「消失」而不是「顯示 reject」)、以及 `/song/result`(見下方歌曲那條)。

- **7 種原因** —— enum 與文案已經寫好在 `src/lib/publishReview.ts`,照產品負責人給的順序與字面:

  | code               | 顯示文案                     |
  | ------------------ | ---------------------------- |
  | `PLATFORM_POLICY`  | Platform Policy Violation    |
  | `EXPLICIT_CONTENT` | Explicit / Adult Content     |
  | `VIOLENCE`         | Violence or Disturbing       |
  | `HATE_SPEECH`      | Hate Speech / Discrimination |
  | `COPYRIGHT`        | Suspected Copyright Issue    |
  | `QUALITY`          | Poor Audio / Video Quality   |
  | `DUPLICATE`        | Duplicate Content            |

- **拍板的四個決定,不用再問:**
  1. **後端回 enum code,前端擁有文案。** 不是後端回顯示字串。理由:否則九語言翻譯落到 RD 身上,
     且前端無法依原因分歧行為(版權跟品質的下一步不一樣)。未知 code 走
     `publishRejectLabel()` 的 fallback,**不可以原樣渲染**。
  2. **被 reject 後自動回到「未發布」,可編輯、可重新送審。** 與現行 MV-13 規則自然相容
     (已經不在發布中,所以直接能編輯),不需要多一個例外分支。
  3. **只有 MV 送審,歌曲直接上架。** 這**符合現行程式碼**:`/song/result` 只有 On/Off
     (`SongResultView.tsx:615`),`HistoryView` 的 `hideDelete` 也只對 MV 判斷 `reviewing`
     (`HistoryView.tsx:499`)。所以歌曲永遠不會有 reject 畫面 —— 即使七種原因裡的
     「音訊品質不佳」與「版權疑慮」對歌曲才最適用。**這是拍板的產品決定,已寫進
     `publishReview.ts` 的 `PUBLISH_REVIEW_APPLIES_TO`,不是漏掉。**
  4. **V1 不寄 reject 通知信。** `docs/RD-REQUEST-NOTIFICATION-EMAILS.md` 的三個情境維持不變。
     ⚠️ 已知代價:審核是非同步的,使用者不會回站上守結果,所以這個 UI 多數時候沒人看到。

- **🔴 這一項需要一次合約新增,規劃時要算進去。** 目前 `MuseApi` **完全沒有 publish 端點**,
  發布狀態是 `HistoryView` 裡兩個**本地 boolean**(`published` / `reviewing`,由 `ov` 覆寫 map 持有)。
  「被 reject」是**第三態**,再加上一個原因 code —— 這是 **C1 + C2 變更**,要:
  改 `contract.ts` / `schemas.ts` → 更新 frozen snapshot → 寫 `CHANGELOG-RD.md`(G4-g 會擋)。
  本 session 刻意沒動,因為它需要與畫面一起設計。

### 2.6 後端 API 錯誤 —— 需要 1 張整頁稿

- **現況:** 🔴 `src/app` 底下**沒有任何 `error.tsx` / `global-error.tsx`**。
- **拍板的形態:** **整頁 error boundary + 保留現有 inline retry。** 也就是新增
  `src/app/[locale]/error.tsx` 接「頁面根本載不起來」等級的失敗;而 flow 裡 job 失敗維持現有的
  inline Retry UI(`RenderGenerationScreen` 等)。兩種失敗本質不同,硬要統一會把還能救的畫面也炸掉。
- ⚠️ **新增 `src/app/**` 底下的檔案會觸發 G4-g**(`WATCH_PREFIX`涵蓋整個`web-app/src/app/`,
為了抓 C7 路由圖)。`error.tsx`不是路由,但仍然要在`CHANGELOG-RD.md` 寫一行
  「看過了,這不是合約變更」—— 那一行就是重點。

### 2.7 手機訂閱者想在網頁取消 —— 需要 1 張 dialog 稿

- **入口已經存在,我一開始找錯了。** `src/components/profile/SettingsView.tsx:104` 有一列
  **Unsubscribe**(副標 `Cancel your Muse Pro subscription`),點了開一個「Unsubscribe?」確認框。
- **現況:** ⚠️ **那個確認框其實不會取消訂閱** —— 按下 Unsubscribe 只執行
  `flash("Unsubscribed (demo)")`(`SettingsView.tsx:142`)。`AuthProvider` 也**沒有對外提供
  unsubscribe**(唯一的 `setSubscribed(false)` 在 `signOut` 裡)。這就是為什麼 demo panel 上
  **沒有** Unsubscribe 按鈕 —— 沒有東西可以呼叫。
  這一點 spec 早就記著了:**`TBD-PROF-04`**(「real Unsubscribe(store deeplink per App F19)…
  Both are demo toasts today」)。所以這一項是**延伸 TBD-PROF-04,不是新問題**。
- **拍板:要分兩條路。**
  - 平台 = App Store / Google Play → 跳「請回手機的商店設定取消」提示 dialog(**設計師會做**)
  - 平台 = 網頁 → 走現有的取消流程(網頁有 `SubscribeModal` 可以買,所以這條路真的存在)
- **🔴 需要後端新增一個欄位** `subscriptionPlatform`(`ios` / `android` / `web`)。這是 C2/C4 新增,
  同樣要走 `CHANGELOG-RD.md`。demo panel 的 `subOnApp` + 平台下拉就是在模擬這個欄位。

---

## 3. 已經做完的兩項,以及它們留下的一個 RD 待答

### ① Footer

移除 **Pricing / Blogs / Storybook Creator**;**FAQ 依產品負責人指示留為佔位**,所以 Support 欄
維持存在、只剩一條。細節與剩下 5 條死連結的問題寫在 **`DESIGNER-TODO` A29**。

> ⚠️ 這三條是**會隨版本回來的偏移**:下次 DP 交稿若又出現,請再移除一次,那是 DP 走在 V1 範圍
> 前面,不是 DP 在糾正我們。目前這類偏移共兩則(另一則是 `/mv/room` 的 `Ideas`)。

### ② Feedback dialog

- **Subject 欄位移除**,dialog 從五欄變**四欄**:Type → Description → Attachment → Email。
- **附件上限 10 MB → 5 MB**,語意不變(所有附件累計、超過整批退件)。
- **`title` 完全不送。** `FeedbackTicketSchema.title` 已刪除 —— 這是 **C2 合約變更**,
  frozen snapshot 與 `CHANGELOG-RD.md` 已在同一個 change 裡更新,G4-g 通過。
- spec `06-profile-account.md` 已同步:§3.1 欄位表、on-screen order、states 表、PROF-P5-S1/S3、
  PROF-E5、AC-PROF-10/11/12/15、mermaid 圖、§10 決定 6。

> ### 🔴 兩個要轉給 RD / CS 的問題
>
> 1. **`TBD-PROF-07`:CSB 的 `title` 是必填嗎?** 如果是,現在每一筆 submit 都會失敗,而且這個決定
>    要**回到產品負責人**。已經評估並被否決的替代方案有三個(Type 標籤、description 前 60 字、
>    固定字串)—— **不要自己挑一個**,CS 每個客服都是靠這個欄位做 triage 的。
> 2. **5 MB 刻意低於 CS 自己的 AC-22(10 MB）。** 下次讀 CS 規格時會看到不一致,**那是決定,不是
>    抄錯** —— `FEEDBACK_MAX_TOTAL_BYTES`、spec、測試三處都寫了這個警告。

---

## 4. 建議的施工順序

1. **先接不需要稿的那半**:2.5 的狀態機與合約(C1+C2 三態 + reason code)、2.6 的
   `error.tsx` 骨架、2.7 的 `subscriptionPlatform` 欄位。這三項的**資料層**都不依賴設計。
2. **稿到了再一項一項接畫面**,每接完一項就把 `DEMO_FLAGS` 裡對應的 `status` 從
   `awaiting-design` 改成 `live`。
3. **2.2 先問,不要先做** —— 它已經有 UI,問題是要不要換掉。

### 收工前的三個提醒(都是這個 repo 有前科的)

- **不要自己跑 `npm run e2e`。** Stop hook 會跑。它的 `next start -p 3100` 撞port已經發生過
  **六次**。要針對性驗證就用 `--grep` **點名**少數幾個測試(本 session 的 demo panel 兩個測試
  跑 3.7 秒)。收工前:**3100 空著、留一份新鮮的 `npm run build`**。
- **新的 guard test 一定要雙向 mutation 測。** 本 session 兩個都測了:拿掉 store 快取 → identity
  測試紅;把預設改成顯示 → default-hidden 測試紅。不能失敗的測試比沒有測試更糟。
- **改 `src/app/**`或`src/lib/api/\*` 一定會觸發 G4-g\*\*,即使只是註解。寫那一行「我看過了」
  就是重點,不是文書作業。
