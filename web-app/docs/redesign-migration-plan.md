# 設計師新版 UI 轉移計畫 — 計畫之書(plan of record)

> **日期:** 2026-08-04
> **DP(Designer Prototype):** `designer-prototype/`(in-repo,commit `568e64c`,2026-08-04)
> **WA(Web App):** `web-app/` — 正式交付物
> **狀態:** 決策已拍板,尚未動任何元件。

## 這份文件與 `redesign-migration-plan-2026-08-01.md` 的關係

08-01 那份是**研究與提案**:它列出選項、風險與待決事項,很多條目寫的是「建議,未拍板」。
本文是**決策結果**:2026-08-04 的 grill 把當時所有待決項逐條問完並拍板。

- **§8 的 S1–S19、§7 的 Q1–Q10、R-1…R-9** 的**判定**以本文 §1 為準。
- 08-01 的 **§9(RD 契約面 C1–C8)** 與 **§10(Gate 制度 G1–G7)** 仍然有效且未被取代 ——
  本文 §5 只記錄對它們的**修訂**,不重寫。
- 兩份衝突時以本文為準。08-01 保留作為背景與推導過程。

> 這個 repo 剛花兩天清掉「兩份重疊文件各說各話」的問題。**不要再開第三份。**
> 新決策改本文;背景考古看 08-01;`UI-INTEGRATION-HANDOFF.md` 仍是入門讀物。

---

## 0. Step 0 實測結果(2026-08-04,以證據取代假設)

|                                | 07-31 舊包            | **本版**                      |
| ------------------------------ | --------------------- | ----------------------------- |
| tsx / css                      | 44 / 41 檔(11,658 行) | **57 / 52 檔(14,937 行)**     |
| 元件                           | 21                    | **28**                        |
| Route 覆蓋                     | 9/20                  | **15/20**(+ Credits IAP 整條) |
| SSR 危險讀取                   | 123 處 / 22 檔        | **192 處 / 33 檔**            |
| `<a href>` / `window.location` | 15 / 25               | **32 / 47**                   |
| i18n                           | 無                    | **仍然無**                    |

**新增覆蓋:** `/profile`(AccountPage)、`/settings`(`/account/settings`)、`/creator`
(CommunityProfilePage),以及 Credits IAP 整條(CreditsPage + `CreditsDialog` + `UpgradeDialog`)。

**S19 四個畫面都在了**,但設計師 `PROJECT_CONTEXT.md` 仍自標未收斂(Trim Audio 精修、
`SongResult` Figma 覆核、Account/Credits/Community Profile/History 六寬度視覺 pass)。
→ **可以搬,但要標 `@needs-figma-recheck`**。

**token-map 產生器有兩個靜默 bug,已修**(commit `da34346`):
逐行解析漏掉 WA 一行三宣告的 `--fw-*`/`--lh-*`(**110 個 token 只看到 80**)與 DP 跨行的
`--gradient-*`(**183 只看到 179**)。修正後 exact match 12 → **27**。
§4.2 五項衝突現況:**radius 與字級命名是同值改名(✅),粉紅/藍/漸層角度仍分歧(🔴 3/5)**。
`--gradient-mv` 實際存在且為 **90deg,色停點與 WA 的 135deg 版完全相同** —— S16 是純角度決策。
另外 generator 預設路徑已改指 in-repo DP,**G2-a 從「靜默 skip」變成真的會跑**。

---

## 1. 已拍板決策(2026-08-04)

### 1.1 Chrome / Shell

| #       | 決策                                                                                               | 理由 / 影響                                                                                                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CH1** | **Sidebar + MobileHeader + MobileTabBar 全域一次移轉**,單獨一個 slice,以 DP 為準                   | 側欄是**持續性 chrome**。若 Home 用舊版、`/history` 用新版,側欄會在導航時**當場變形**,比靜態新舊並存更糟。Home 因此會先拿到新側欄 —— 這是 landing 延後期間唯一會變的部分                                                              |
| **CH2** | 採 DP 的 **per-page `RoomNavbar`/`DetailNavbar`**;WA 全域 `TopBar` 降級為「未移轉 route 的預設值」 | DP 的 detail 畫面是**繞著 `DetailNavbar` 的返回鍵設計的**(這正是 `AppLayout` 只在 Home/History 顯示 `MobileTabBar` 的原因)。沒有它,12 個畫面在手機上**失去唯一的返回途徑**。實務上 `TopBar` 只剩 Home 在用,landing 設計到位時一併刪除 |
| **CH3** | **行銷 `Navbar` 不在本次範圍**                                                                     | 它只出現在 Home(`AppLayout` 的 `??` fallback),而 Home 已延後。連帶:它內含的 12 語 `LanguagePicker` 本次也碰不到(見 S9)                                                                                                                |
| **CH4** | **`Footer` 不在本次範圍**                                                                          | 只出現在 landing 與 `/blog`(`showFooter`),兩者都延後                                                                                                                                                                                  |
| **CH5** | 手機底欄 **5 項 @640px → 3 項 @767px**(Explore / ＋建立 / History)                                 | Profile 從底欄消失,改由 **Sidebar 的 profile footer**(桌機)與 **`MobileHeader` 帳號 icon**(手機)進入。**這是行為變更(R12/S13),要自己的 slice 與自己的 e2e**                                                                           |
| **CH6** | Sidebar **隱藏 AI Storybook 與 Blog**,保留登入後 profile footer + Upgrade 鈕                       | AI Storybook `href="#"` 連畫面都沒有;Blog 已定 V2。以常數控制,V2 開回來只改一行。避免 CEO demo 點到空頁                                                                                                                               |

### 1.2 Token / 樣式

| #              | 決策                                                                                                       | 備註                                                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D2**         | tokens.css 換成 DP 版 + 新增 `token-aliases.css` 對映 WA 舊名                                              | 08-01 已拍板                                                                                                                                                                                                                       |
| **R-5**        | **已移轉的 markup 一律寫 DP 原生 token 名**;alias 只服務尚未移轉的舊元件,**每搬一支就少一條,最後整檔刪除** | alias 是**有明確終點的暫時橋**,不是永久翻譯層。反向做法(全部走 alias)與 D1 相衝 —— DP 的 52 支 BEM CSS 直接寫 `var(--radius-lg)`,改寫它們就失去「設計師改版可檔案級 re-sync」這個 D1 的核心好處                                    |
| **D4**         | **採 DP 的 `mask-image` + `currentColor`**,隨畫面移轉逐步收斂,**不做全站大重構**                           | 實測 WA 的 **84 個 `ic_*.svg` 檔名 84/84 全數出現在 DP 的 90 個裡**(同源),DP 多 6 個要收進 `public/assets/icons/ui/`。WA 只有 10 處引用 icon 檔,其餘是手抄 inline `<svg>`。AGENTS.md 禁止擅自 mass-refactor,所以只在移轉到的畫面改 |
| **Breakpoint** | 六階 320 / 375 / 768 / 1024 / 1440 / 1920                                                                  | 08-01 已拍板。DP 的 `src/styles/breakpoints.css` 用的是同一組,兩邊已對齊                                                                                                                                                           |
| **data-theme** | root layout 必須加 `<html data-theme="dark">`                                                              | 少了這個屬性,DP 的 `--color-*` **全部解析成淺色**。它看起來像 CSS bug,但不是                                                                                                                                                       |

### 1.3 i18n / 導航(兩條都是「英文看起來正常、其他語言才壞」的靜默失敗)

| #       | 決策                                                                                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-8** | **維持現行分界**:移轉後的 `Sidebar` / `MobileTabBar` / `MobileHeader` / `AccountPage` **繼續走 `useT()`**,其餘畫面照 AGENTS.md 慣例硬寫英文。等於精確保留現狀,不擴大範圍,也**不讓 `useT()` 消費者從 2 個掉到 1 個** |
| **R-9** | 每個移轉的連結**一律 `next/link` + `localePath()`**;同時在 `.claude/hooks/guard-greps.sh` **新增 `<a href="/` 硬 grep**,讓 DP 的寫法過不了 Stop gate。規則有機器把關,不靠記憶                                       |
| **S9**  | **維持 9 語**。`LanguagePicker` 只存在於行銷 Navbar(本次範圍外),所以這次根本碰不到。**轉移完成後**再議是否擴充 —— 屆時屬 C6 契約變更                                                                                |

### 1.4 產品規則(§8 的 S 項判定)

| #                      | 判定                                                                                                                     | 後續動作                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1**                 | **取消** High 畫質的 Pro 鎖,免費開放                                                                                     | 與 DP 一致。**理由是連貫的**:DP 的 `UpgradeDialog` 顯示新方案賣的是 **credits 不是功能**($9.99/200、$29.99/1,000、$59.99/2,000)                                                                     |
| **S3**                 | **取消** 30 秒試聽門檻,免費全曲播放                                                                                      | 同上                                                                                                                                                                                                |
| **S1/S3 的 Gate 處理** | **反轉測試,不刪除**                                                                                                      | G5-d #7 從「Pro 門檻存在」改寫成「**High 對免費帳號可選、播放不設上限**」。Gate 維持 10 項不降級,並防止門檻日後被誤加回來                                                                           |
| **S2**                 | **只保留 30 秒 trim 下限**,拿掉 DP 的 8% 軌長 gap                                                                        | 以 MV-01 spec 為準。**移轉 `TrimAudioSheet` 前先補上 S2 的 e2e**                                                                                                                                    |
| **S4**                 | **拿掉 BPM + Key**,跟 DP 一致                                                                                            | ⚠️ 動到 `src/lib/mv/types.ts` 的 `bpm`/`musicKey` → **屬 C8,需獨立 PR + `CHANGELOG-RD.md`**,不可夾在 UI slice。同步更新 SONG-01 spec                                                                |
| **S6**                 | **保留審核流程**;MV 的 confirm 用 DP 新的 `PublishDialog`,`reviewing` / `Submitted for review` 沿用 WA;Song 維持現行行為 | DP 這版剛好把 confirm 那一半補回來了                                                                                                                                                                |
| **S8**                 | **維持 `localStorage["muse_auth"]`**                                                                                     | DP 的 `AuthProvider`(用 `sessionStorage`)**整支不搬**,只取 `LoginModal` 外觀接 WA 既有 `AuthProvider`。零契約變更                                                                                   |
| **S20** 🆕             | 方案價**以 code 為準:Weekly $19.99**                                                                                     | 新發現,不在 08-01 的 §8。DP 寫 $9.99,與**已知過時**的 DEVELOPER-HANDOVER 一致而非與 code 一致 —— 典型的 code/doc 陷阱。移轉 `UpgradeDialog` 時**只搬版面,價格一律讀 `SUBSCRIPTION_PLANS`**,不得硬寫 |
| **S5**                 | credits 扣款 / 退款 / 餘額不足導購 **完全不動**                                                                          | 非協商項。DP 全站硬寫 `credits={390}`(19 處),移轉時**一律改接 `useCredits()`**                                                                                                                      |

### 1.5 路由

| #            | 決策                                                                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D3**       | 保留 WA 的獨立 route 拆法(08-01 已拍板)。DP 把 processing 做成同頁 stage 只是因為它沒有 router                                                                                                             |
| **Q2**       | 中間進度頁(`/mv/creating`、`/mv/thinking`、`/song/creating`)改用 **`router.replace()`** —— 不進瀏覽器歷史。現況全是 `push()`,所以從 result 按上一頁會回到一個**已經跑完的進度頁**。屬行為變更,需自己的 e2e |
| **Q6 / S18** | detail 頁返回用 **`router.back()`,無歷史時 fallback 到該區入口**(`/explore/mvs`、`/song/play` 或 `/`)。不採 DP 的 `?from=` query —— 漏帶就退化成回首頁,且參數會混進分享出去的 URL                          |
| **Q7**       | 對外 URL 命名維持 WA(`/explore/mvs` 而非 `/mv-detail`)。DP 的 URL 只是找設計稿的座標,不是要採用的位址                                                                                                      |

---

## 2. 範圍

### 2.1 本次要移轉(16 route + Credits IAP)

| WA route                    | DP 來源                                           | 備註                                         |
| --------------------------- | ------------------------------------------------- | -------------------------------------------- |
| `/history`                  | `HistoryPage`                                     | **第一支**,R-1/R-2 spike 用                  |
| `/explore/mvs`              | `MVDetailPage`                                    | justified gallery(S15,刻意改版)              |
| `/explore/songs`            | `SongDetailPage` `?tab=New Releases`              | 取其清單區塊                                 |
| `/watch`                    | `MVDetailPage` `?id=`                             | 取其播放器狀態                               |
| `/song/play`                | `SongDetailPage`                                  |                                              |
| `/mv/room`                  | `MVCreatePage`(1,441 行,最大)                     | 含 `TrimAudioSheet`、face picker、5 個 sheet |
| `/mv/thinking`              | `MVStoryboardPage` `stage='processing'`           |                                              |
| `/mv/storyboard`            | `MVStoryboardPage` `stage='edit'`                 |                                              |
| `/mv/result`                | `MVResultPage`                                    | `@needs-figma-recheck`                       |
| `/mv/edit`                  | `MVEditPage`(785 行)                              | `@needs-figma-recheck`                       |
| `/song/create`              | `SongCreatePage` `stage='form'`                   | S4 拿掉 BPM/Key                              |
| `/song/creating`            | `SongCreatePage` `stage='processing'`             |                                              |
| `/song/result`              | `SongCreatePage` `stage='result'`                 | `@needs-figma-recheck`                       |
| `/profile`                  | `AccountPage`                                     |                                              |
| `/settings`                 | `AccountPage` `/account/settings`                 |                                              |
| `/creator`                  | `CommunityProfilePage`                            |                                              |
| Credits IAP(modal,非 route) | `CreditsPage` + `CreditsDialog` + `UpgradeDialog` | 價格讀 WA 常數(S20)                          |

### 2.2 不在本次範圍 —— 要回報給設計師的 todo

| 項目                           | 狀況                                                                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`/` landing page**           | 你已決定延後。DP 有 `/home` 與 `/home-review-b` 兩個未選版本,設計師自己也列為「pending selection and cleanup」                                                                                                                                                                 |
| **`/mv/creating`**             | ⚠️ **DP 沒有 MV render 進度畫面**。`MVResultPage` 只有 result。Song 與 Storyboard 都有 processing stage,唯獨 MV render 沒有                                                                                                                                                    |
| **`/share`、`/share/mv/[id]`** | 先不改設計。DP 只有 `ShareDialog` 元件,沒有落地頁                                                                                                                                                                                                                              |
| **Profile 頭像上傳 + 裁切**    | ⚠️ **完全空白**。`AccountPage.tsx:106` 的 `Change Photo` 是**沒有 onClick 的死按鈕**;全 repo 沒有頭像用的 `type="file"`、沒有 `FileReader`、沒有任何 crop UI。設計師明載 MV Create 的臉部偵測是「綁定單張 `group.jpg` 的確定性模擬,任意上傳與真實座標抽取不在 prototype 範圍」 |
| **Blog**                       | V2                                                                                                                                                                                                                                                                             |
| **AI Storybook**               | 只有側欄入口,`href="#"`,無畫面。本次隱藏                                                                                                                                                                                                                                       |

---

## 3. 未定 / 待確認清單

> 這些**不阻擋**開工,但每一項都要有人追。標 🔴 的會影響已排程的 slice。

| #     | 項目                                                                                                                                                                 | 卡住誰                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| U1 🔴 | **Song Length**:DP 用 `SHOW_SONG_LENGTH = false` 藏起來。是暫時隱藏還是要移除?(S4 已決定拿掉 BPM/Key,但 Song Length 未表態)                                          | `/song/create`                                      |
| U2 🔴 | **D1 尚未驗證**:「DP 的 BEM CSS 與 Tailwind 在固定載入順序下共存」**沒有人在任何一個畫面上試過**。specificity 互咬是主要風險                                         | 由 `/history` spike 回答(§4 Phase 1.5)              |
| U3 🔴 | **R-2 SSR 模式未定**:192 處危險讀取散在 33 檔。要先在一個畫面上定出唯一模式(`"use client"` + 讀取移進 `useEffect` + SSR-safe 初值),再機械套用                        | 同上                                                |
| U4    | 300MB demo 媒體(44 mp4 + 36 mp3)是否進 git —— **轉移完成後**再看                                                                                                     | 無(目前用設計師的 Vercel 版做並排比對)              |
| U5    | S9 語言擴充(9 → 12 或其他)—— 轉移後定案,屬 C6                                                                                                                        | 無                                                  |
| U6    | **C1–C8 清單未經 RD 確認**(2026-08-04 決定不寄確認信)。這不是待辦,是一項已知事實:G4 只能保護清單上的東西,所以它證明的範圍以這張我方自訂的清單為準                    | 無                                                  |
| U7    | 08-01 §7 的 **Q1、Q3、Q4、Q5、Q8、Q9** 尚未處理(轉場無縫度、deep-link 無 flow state、`/mv/thinking` 完成後是否換 URL、Blog/Storybook URL 結構、未登入開受保護 route) | Q3 其實已有答案(flow-guard 已實作且有 e2e),只需確認 |
| U8    | **S14 Home 區塊組成**、**S12 行銷 chrome 雙層 IA** —— 隨 landing 一起決定                                                                                            | landing                                             |
| U9    | `MVResultPage` / `MVEditPage` / `SongResult` 的 Figma 覆核 —— 設計師自標未收斂                                                                                       | 搬時標 `@needs-figma-recheck`                       |

---

## 4. 分階段計畫

> **規則不變:一次一個 slice,slice 之間 Gate 全綠。禁止 big-bang PR。**

### Phase 0 — 前置(不動任何畫面)

1. ✅ DP 進 repo + PROVENANCE(`da34346`)
2. ✅ token-map generator 修正 + G2-a 生效(`da34346`)
3. ✅ **`AGENTS.md` 改寫**:breakpoint 六階、token 規則(D2 + R-5)、icon(D4)、導航(R-9)、i18n 分界(R-8)。
   推翻了現行的「只有 sm/lg」與「NEVER edit token values」—— 兩條都是 hook 與 reviewer 會引用的載重規則,
   所以必須趕在 Phase 1 之前改完,否則每個 reviewer 都會引用一條已經決定要打破的規則。
4. ✅ **`guard-greps.sh` 新增 `<a href="/` grep**(R-9)。
   實測可抓到 DP 的 17 個字面連結,且不誤傷 `https://` / `#anchor` / `mailto:`。
   ⚠️ **另有 20 個是 `href={變數}`,grep 看不見** —— 這條規則抬高地板,沒有關上門。
5. ✅ **`DEVELOPER-HANDOVER.md` §7**(breakpoint + token 來源)+ **§9**(UI source of truth 改為 DP,
   mobile prototype 降為 flow-only)
6. ✅ 114 張六寬度 baseline 確認仍在且已 committed(320/375/768/1024/1440/1920 全在)
7. ✅ **補上 S2 的 e2e**(30 秒 trim 下限),趕在 `TrimAudioSheet` 被碰之前。
   **已做變異測試**:把 `MIN_TRIM_SEC` 改成 0 → 測試紅;改回 30 → 綠。它真的在守這條規則,
   不是剛好通過。

**Gate 實測(2026-08-04):** typecheck ✓ lint ✓ test:run 76 ✓ build ✓ ·
guard-greps ✓ token-map ✓ rd-changelog ✓ · **e2e 47 passed**(46 + 新增的 S2)。

### Phase 1 — 地基(不動任何畫面)

**✅ 完成 2026-08-04。驗收雙綠:G2-b computed-style diff = 0、G2-c pixel diff = 0。**

1. ✅ `tokens.css` 換成 DP 版(整檔 + 出處 header);新增 `token-aliases.css`
2. ✅ 六階 breakpoint 進 `@theme`(`xs` 375 / `xl` 1440 / `2xl` 1920)
3. ✅ root layout 加 `data-theme="dark"`
4. ✅ 載入順序改為 D1 的 `tokens → token-aliases → tailwind → designer`
5. ✅ 建 `src/styles/designer/` 與 `designer.css` 入口(**故意留空**,先證明管線會 build 且零影響)
6. ✅ 補齊 DP 多的 6 個 icon → WA 現在具備全部 90 個 DP icon 檔名

**一個對 D2 字面的刻意偏離:`token-aliases.css` 存的是「凍結的字面值」,不是 `var(--dp-name)`。**
27 個 WA token 確實有同值的 DP token,寫 `--r-xl: var(--radius-md)` 今天可行 —— 但那等於讓
**下一次設計師改版靜默移動所有尚未移轉的畫面**:上游把 `--radius-md` 改成 15px,WA 的 `--r-xl`
就跟著動,而我們自己的檔案一行 diff 都沒有,也沒有任何 gate 會發現。Phase 1 的契約是
「未移轉畫面不動」,凍結字面值才是真正執行這條契約的作法。對應關係沒有遺失 —— 它記在
`docs/token-map.md`(生成物,受 G2-a 檢查)。

**R6 已解除。** 舊包 150 個含空白檔名,這一版只剩 8 個,而且**全部在 `covers/`** ——
也就是我們排除掉的 demo 媒體。vendored 的資產零個含空白,slugify script 不需要做。

**⚠️ G2-c 的基準檔原本在這台機器上根本無法運作。** committed 的 114 張 baseline 全是
`-darwin`,linux 上 0 張。Playwright 在非 macOS 找不到對應快照 → 每一張都判定失敗並「順手寫一張新的」,
看起來像大量 diff,實際上是缺基準。handoff 說「把 baseline commit 進來,只存在一台筆電的基準無法
gate Phase 1」——**commit 是必要條件,但不是充分條件:基準是綁平台的。** 本次已補錄 114 張
`-linux` 基準(**從 swap 前的 code 錄的**,不是為了讓 diff 消失而重錄),G2-c 因此在這個平台上
第一次真的會跑。

**踩到並修掉的兩個工具問題**(兩者都會讓 gate 假性通過或無法執行):

- `computed-style-diff.mjs` 不吃 `CHROMIUM_PATH`,在這個環境**完全無法啟動** → G2-b 等於不存在。
- port 3100 殘留的舊 `next start` 會被 Playwright 的 `reuseExistingServer` 接手,servers 舊 build,
  CSS chunk 回 **500**,於是整站**無樣式**渲染 → 截圖高達 913×16891。這會產出看似「巨大視覺差異」
  的假訊號。**跑視覺測試前先確認 3100 沒有殘留 server。**

**驗收條件(維持不變,供下次動 token 時使用):`npm run e2e:visual` 六寬度 pixel diff = 0
且 `npm run style:diff` = 0。** 非零代表 token 對映錯了 —— **改 `docs/token-map.md` 再對映一次,
絕不重錄 baseline。**

### Phase 1.5 — spike `/history`(回答 U2 / U3)

只搬一個畫面,回答兩件事後**停下來報告**:

- **R-1**:DP 的 BEM CSS 在 `tokens → token-aliases → tailwind → designer` 的固定載入順序下,與 Tailwind 共存得如何?
- **R-2**:SSR 危險讀取的唯一模式是什麼?

**兩題都有答案之前,不得移轉第二個畫面。**

### Phase 2 — Shell + 共用元件

- **Slice 2a — Shell**(CH1/CH2/CH5):`Sidebar` + `MobileHeader` + `MobileTabBar` + `AppShell` 的 navbar slot。
  ⚠️ 內含**行為變更**(底欄 5→3 項、切點 640→767、Profile 改由 profile footer 進入),**要自己的 e2e**。
- **Slice 2b…** 依相依序:`Button` → `IconButton` → `Chip` → `ToggleSwitch` → `Tabs` → `Card` → `ListItem`
  → `SectionHeader` → `Badge` → `CreditBalance` → `RoomNavbar` / `DetailNavbar` → `Toast` → `LoginModal`
  → `PublishDialog` → `ShareDialog` → `UpgradeButton` / `UpgradeDialog` / `CreditsDialog` → `FloatingCTA`
  → `LyricsSheet` → `TopSongListItem`
- **`CreditBalance` 必須接 `useCredits()`**,不可沿用硬寫的 390(19 處)。
- **`LoginModal` 接 WA 的 `AuthProvider`**(S8)。
- **`UpgradeDialog` 價格讀 `SUBSCRIPTION_PLANS`**,不可硬寫(S20)。

**Gate(每支):** G1 + G3 + G4 + G6。

### Phase 3 — 畫面(依相依性由低到高)

`/history`(已於 1.5 完成)→ `/explore/mvs` → `/explore/songs` → `/watch` → `/song/play` →
`/profile` + `/settings` → `/creator` → Credits IAP → `/mv/room`(最大)→
`/mv/thinking` + `/mv/storyboard` → `/mv/result` → `/mv/edit` →
`/song/create` + `/song/creating` + `/song/result`

每個畫面固定作法:**保留** WA 的 provider 呼叫、flow-guard、credits 扣款、auth gate、job polling;
**替換** JSX 結構與 class 名;**逐條比對** §8 差異,發現新差異就記錄,不自行決定。

**Gate(每個 route):** G1 + G4 + **G5(含行為回歸清單)** + G6 + G7。

### Phase 4 — 待設計師補件

`/mv/creating`、`/share`、Profile 頭像上傳 + 裁切、landing page。

### Phase 5 — V2

Blog、AI Storybook、S9 語言擴充。

---

## 5. 對既有 Gate 制度的修訂

08-01 §10 的 G1–G7 continue to apply。本次**只改這四處**:

| Gate          | 修訂                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **G1-b**      | **新增** `<a href="/` grep(R-9)。既有 5 條(`import.meta`、`fetch(`、`MockMuseApi`、`sessionStorage`、`window.location.href=`)全部保留 |
| **G5-d #7**   | **反轉**:從「Pro 門檻(High 畫質 crown、30 秒試聽)存在」改為「**High 對免費帳號可選、播放不設上限**」。清單維持 10 項                  |
| **G5-d 新增** | S2(30 秒 trim 下限)與 Q2(中間頁不進歷史)各需一個 e2e                                                                                  |
| **G2-a**      | 已生效(generator 預設路徑改指 in-repo DP)。此前它在所有非設計者機器上都是靜默 skip                                                    |

### 需要 `CHANGELOG-RD.md` 條目的變更

| 變更                           | 契約面      | 處理                                            |
| ------------------------------ | ----------- | ----------------------------------------------- |
| **S4 拿掉 `bpm` / `musicKey`** | **C8**      | ⚠️ **獨立 PR**,不可夾在 UI slice                |
| S1 / S3 取消門檻               | 非 C1–C8    | 不需 changelog,但需在本文 §1.4 留判定紀錄(已留) |
| S8 維持 localStorage           | C5 **不變** | 無需異動 —— 這正是選它的理由                    |
| S9 維持 9 語                   | C6 **不變** | 同上                                            |
| Q7 維持 WA URL                 | C7 **不變** | 同上                                            |

> 四項決策裡有三項的價值就是**讓契約面不用動**。這不是巧合 ——
> RD 正在同時串 API 與帳號,契約零 diff 是這次轉移最重要的產出。

---

## 6. 移轉時的不可破壞邊界(重申)

DP **沒有任何資料層**:沒有 contract、沒有 polling、沒有 schema、沒有 credits。
**拿 DP 的 DOM 與 CSS,絕不拿 DP 的 state。**

1. `MuseApi` + Zod schemas + `src/lib/api/index.ts` 的單一 swap point
2. 相依方向 `app → components → lib/api`;view 只 import `api`,絕不 import `MockMuseApi`
3. 生成一律是 job + `pollJob`
4. credits 扣款與退款(餘額不足的守門在 **`MvRoom.selectMode()`**,不在 provider)
5. locale 住在 URL:英文不加前綴,其他 8 語加前綴

---

## 7. 每次設計師交新版時(§12 流程,維持有效)

```bash
git clone --depth 1 https://github.com/marukox1105/YCM.git /tmp/YCM-new
# 依 designer-prototype/PROVENANCE.md 的排除清單置換該資料夾,然後:
cd web-app && npm run token-map
git diff --stat designer-prototype/    # 這就是 §12 step 1 要的 drop-to-drop diff
```

然後跑 §12 的五步:變更分類(視覺 / flow / 新畫面)→ flow 變更對 `specs/areas/*.md` →
判定「新 flow」還是「沒做好」→ 更新文件 → 動到 C1–C8 就同步 `CHANGELOG-RD.md` 並通知 RD。

> **不變的原則:DP、spec 與 code 三者衝突時,讀 code。**
> 這次已經抓到兩個實例:token-map 產生器比它引用的文件更不可信;
> DP 的 $9.99 與**已知過時**的交接文件一致,而不是與 code 一致。
