# GTM Tracking Map (`data-gtm`)

- 來源需求：Confluence「[YCM] GA Event Tracking」（PFWeb / page `2215870467`）§ UI data-gtm Attribute — 第一波：header 按鈕、sidemenu 選單、generate 按鈕
- 命名規則：`GTM_TRACKING_GUIDE.md`（`{location}-{action}`，小寫 kebab-case；同一元件的變體用 `data-gtm-item` / `data-gtm-variant` 區分，不另開新值）
- 建立日期：2026-10-15 · 只加屬性，不改行為／樣式／文字；屬性值全部是靜態字串，不含任何個人資料

## GTM 設定（一次設好，之後新元素自動被追蹤）

- Trigger：**Click – All Elements**，條件 Click Element 符合 CSS selector `[data-gtm], [data-gtm] *`
- 變數（Custom JavaScript）：

  ```js
  function () {
    var el = {{Click Element}};
    var t = el && el.closest ? el.closest('[data-gtm]') : null;
    return t ? t.getAttribute('data-gtm') : undefined;
  }
  ```

  `data-gtm-item` / `data-gtm-variant` 以同樣方式讀取（把 `getAttribute` 的名稱換掉）。

- GA4 事件（例：`ui_click`）參數：`gtm_id` = 上面的變數、`gtm_item`、`gtm_variant`、`page_path` = `{{Page Path}}`
- 頁面不寫進 id：同一顆 header Login 在每頁都是 `header-login`，用 `Page Path` 區分。
- 語系：英文路徑無前綴（`/mv/room`），其他 8 語系有前綴（`/jpn/mv/room`）。GTM 若要依頁面分群，請以「去掉語系前綴後的路徑」比對。

## Location 詞彙（本專案）

| Location      | 意義                                                          | 備註                                               |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| `header`      | 桌機頂部導覽列（首頁 `Navbar`、`RoomNavbar`、`DetailNavbar`） | 指南既有                                           |
| `mobile-menu` | 手機版頂部列與底部 tab bar（< 768px）                         | 指南既有                                           |
| `sidemenu`    | 桌機左側欄 `Sidebar`                                          | **本專案新增**（對應 Confluence「sidemenu 選單」） |
| `tool`        | 創作工具內的操作（生成、重製、合併）                          | 指南既有                                           |
| `modal`       | 對話框內的按鈕                                                | 指南既有                                           |

## 1. Header 按鈕

| data-gtm                 | Extra attrs                                                                    | Component file                                                                                                   | Pages                                                                                                                                                                            | 說明                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `header-language`        | —                                                                              | `src/components/home/Navbar.tsx`                                                                                 | `/`、`/faq`（未登入）                                                                                                                                                            | 語系下拉選單開關（文字依語系變動，如 "English"）                                                                        |
| `header-language-option` | `data-gtm-item` = 語系碼 `enu` `jpn` `kor` `cht` `chs` `deu` `fra` `esp` `ptg` | `src/components/home/Navbar.tsx`                                                                                 | `/`、`/faq`（未登入）                                                                                                                                                            | 語系選單中的選項                                                                                                        |
| `header-login`           | —                                                                              | `src/components/home/Navbar.tsx`、`src/components/shell/RoomNavbar.tsx`、`src/components/shell/DetailNavbar.tsx` | 所有頁面（未登入）                                                                                                                                                               | Login 按鈕（三個 header 元件都標同一值）                                                                                |
| `header-start-free`      | —                                                                              | `src/components/home/Navbar.tsx`                                                                                 | `/`、`/faq`（未登入）                                                                                                                                                            | "Start for Free" 主 CTA → `/mv/room`                                                                                    |
| `header-credits`         | —                                                                              | `Navbar.tsx`、`RoomNavbar.tsx`、`DetailNavbar.tsx`                                                               | 所有頁面（已登入）                                                                                                                                                               | 點數餘額膠囊 → 開啟 Buy Credits 對話框                                                                                  |
| `header-upgrade`         | —                                                                              | `Navbar.tsx`、`RoomNavbar.tsx`、`DetailNavbar.tsx`                                                               | 所有頁面（已登入、未訂閱）                                                                                                                                                       | Upgrade 皇冠按鈕 → 開啟訂閱對話框                                                                                       |
| `header-back`            | —                                                                              | `src/components/shell/DetailNavbar.tsx`                                                                          | 使用 DetailNavbar 的頁面（`/watch`、`/creator`、`/settings`、`/credits`、`/explore/mvs`、`/song/play`、`/song/result`、`/mv/result`、`/mv/edit`、`/mv/storyboard`、生成中頁面…） | 返回按鈕（桌機與手機同一元素）                                                                                          |
| `header-tab`             | `data-gtm-item` = tab id                                                       | `src/components/shell/RoomNavbar.tsx`（`Tabs`）                                                                  | 有分頁列的頁面（`/history`、`/faq`、`/song/play`、`/explore/songs`、`/creator`、`/credits`）                                                                                     | Navbar 內的 pill 分頁；tab id 是程式內固定值，依頁面而異（`/song/play`、`/explore/songs` 為曲風名稱，含大寫，如 `All`） |

### 手機版 header（< 768px）

| data-gtm              | Extra attrs | Component file                                                                 | Pages                                  | 說明                                                                                      |
| --------------------- | ----------- | ------------------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `mobile-menu-upgrade` | —           | `src/components/shell/MobileHeader.tsx`、`src/components/shell/RoomNavbar.tsx` | `/`、`/history`（未訂閱）              | 手機頂部皇冠按鈕 → 訂閱對話框                                                             |
| `mobile-menu-account` | —           | `MobileHeader.tsx`、`RoomNavbar.tsx`                                           | `/`、`/history`                        | 手機頂部帳號按鈕 → `/profile`                                                             |
| `mobile-menu-back`    | —           | `src/components/shell/RoomNavbar.tsx`                                          | `/mv/room`、`/song/create`、`/profile` | 手機版返回鍵（DetailNavbar 頁面的手機返回鍵送的是 `header-back`，統計手機返回需兩值合計） |

> 手機版沒有 Language / Login / Start for Free 的對應按鈕（首頁手機版 header 只有標題、皇冠、帳號），所以指南中的 `mobile-menu-language` / `mobile-menu-login` / `mobile-menu-start-free` **在本專案不存在**，未建立。

## 2. Sidemenu 選單

| data-gtm            | Extra attrs                                                         | Component file                     | Pages                            | 說明                                                                                                      |
| ------------------- | ------------------------------------------------------------------- | ---------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `sidemenu-logo`     | —                                                                   | `src/components/shell/Sidebar.tsx` | 所有頁面（桌機，側欄展開時）     | 左上 MUSE logo → 首頁                                                                                     |
| `sidemenu-collapse` | `data-gtm-variant` = `collapse` \| `expand`（點擊當下要執行的動作） | `Sidebar.tsx`                      | 所有頁面（桌機）                 | 側欄收合／展開                                                                                            |
| `sidemenu-nav`      | `data-gtm-item` = `home` \| `mv` \| `song` \| `history`             | `Sidebar.tsx`                      | 所有頁面（桌機）                 | 主選單項目：Home / Create MV / Create Song / History（`story`、`blog` 目前隱藏，日後開啟會自動帶上 item） |
| `sidemenu-profile`  | —                                                                   | `Sidebar.tsx`                      | 所有頁面（桌機、已登入）         | 側欄底部個人資料卡 → `/profile`                                                                           |
| `sidemenu-upgrade`  | —                                                                   | `Sidebar.tsx`                      | 所有頁面（桌機、已登入、未訂閱） | 側欄底部 Upgrade 按鈕 → 訂閱對話框                                                                        |

### 手機底部 tab bar（< 768px，等同手機版 sidemenu）

| data-gtm                    | Extra attrs                           | Component file                          | Pages                 | 說明                                                 |
| --------------------------- | ------------------------------------- | --------------------------------------- | --------------------- | ---------------------------------------------------- |
| `mobile-menu-nav`           | `data-gtm-item` = `home` \| `history` | `src/components/shell/MobileTabBar.tsx` | 有底部 tab bar 的頁面 | Explore（首頁）／History                             |
| `mobile-menu-create`        | —                                     | `MobileTabBar.tsx`                      | 同上                  | 中間 ＋ 按鈕，開啟「What would you like to create?」 |
| `mobile-menu-create-option` | `data-gtm-item` = `mv` \| `song`      | `MobileTabBar.tsx`                      | 同上                  | 上述選單中的 Create MV／Create Song                  |

## 3. Generate 按鈕

| data-gtm                   | Extra attrs                                   | Component file                                             | Pages                                                                         | 說明                                                                                |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `tool-mv-generate`         | —                                             | `src/components/mv/MvRoom.tsx`                             | `/mv/room`                                                                    | "Create Music Video" 主 CTA（未登入會先跳登入；登入後開模式選擇）                   |
| `modal-mv-mode-select`     | `data-gtm-variant` = `storyboard` \| `direct` | `src/components/mv/ModeModal.tsx`                          | `/mv/room`（對話框）                                                          | 選擇「Create Storyboard First」或「Create MV Directly」——實際觸發生成／扣點的那一下 |
| `tool-storyboard-generate` | —                                             | `src/components/mv/StoryboardEditor.tsx`                   | `/mv/storyboard`                                                              | 分鏡確認後的 "Create MV"                                                            |
| `tool-song-generate`       | —                                             | `src/components/song/SongCompose.tsx`                      | `/song/create`                                                                | "Create Song"                                                                       |
| `tool-scene-recreate`      | —                                             | `src/components/mv/MvEditor.tsx`（桌機與手機各一處，同值） | `/mv/edit`                                                                    | 單一場景 "Recreate"                                                                 |
| `tool-cover-recreate`      | —                                             | `MvEditor.tsx`                                             | `/mv/edit`                                                                    | 封面 "Recreate"                                                                     |
| `tool-mv-merge`            | —                                             | `MvEditor.tsx`                                             | `/mv/edit`                                                                    | "Merge MV"（以修改後場景重新合成）                                                  |
| `tool-mv-recreate`         | —                                             | `src/components/mv/MvResult.tsx`                           | `/mv/result`                                                                  | 結果頁 "Recreate" → 回 `/mv/room`                                                   |
| `tool-song-recreate`       | —                                             | `src/components/song/SongResultView.tsx`                   | `/song/result`                                                                | 結果頁 "Recreate"（僅自己的作品）                                                   |
| `tool-generation-retry`    | —                                             | `src/components/mv/GenerationView.tsx`                     | `/mv/creating`（生成失敗時；`/mv/thinking`、`/song/creating` 目前沒有 Retry） | 生成失敗後的 "Retry"                                                                |

## Outcome events（提案，未實作）

Confluence 文件「GTM Datalayer Event」列出的事件需要在程式內 `window.dataLayer.push()`，點擊追蹤無法精準取代。以下是對應的建議位置，**本次未改程式**：

| Event                  | 觸發時機（Confluence）                             | 建議位置                                                                                                       | 備註                                                                                            |
| ---------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `dialog-signup`        | 跳出 sign-up dialog 時                             | `src/components/auth/SignInModal.tsx`（`open` 由 false → true 時）                                             | 也涵蓋 `requireLogin()` 被動跳出的情況                                                          |
| `signup` (`method`)    | 任何方式註冊成功                                   | `SignInModal.tsx` 成功階段／`AuthProvider` 登入完成處                                                          | 目前是無後端原型，**沒有「註冊 vs 登入」的區分，也沒有真實 method**——需 RD 接上後端後由回應判斷 |
| `login` (`method`)     | 任何方式登入成功（註冊後依序送 `signup`、`login`） | 同上                                                                                                           | 同上                                                                                            |
| `planDialogImpression` | pricing dialog 顯示時                              | `src/components/credits/SubscribeModal.tsx`（`open` 變 true 時）；或集中於 `SubscribeProvider.openSubscribe()` | Buy Credits 對話框（`BuyCreditsModal.tsx`）是否也算 pricing dialog，需 PM 決定                  |
| `purchaseSucceed`      | 收到後端付費成功、跳成功 dialog 時                 | `SubscribeModal.tsx` 的 `onSubscribed` 回呼、`BuyCreditsModal.tsx` 的 `onPurchased` 回呼                       | 現為 mock 流程，正式值應在後端確認後送出                                                        |

## 第二波候選（尚未加，需確認後再做）

依指南「第一波之外先提案」，以下尚未標記：

- 首頁 hero / tool selector 的 CTA（`HeroBannerSection*.tsx`「Create MV / Create Music Video」→ 建議 `hero-create-mv`、`section-tools-select`）
- 首頁 Footer 連結（`footer-*`）
- 社群播放頁 `/watch` 的 "Create MV"（`CommunityMvPlayer.tsx`）、創作者頁的 Create 按鈕（`CreatorProfile.tsx`）
- `/mv/result` 的 Edit MV、Publish、Share、Download
- 訂閱／購點對話框內的方案選擇（`pricing-plan-select` + `data-gtm-plan` / `data-gtm-billing`）
- 登入對話框內的登入方式按鈕（`modal-signin-*`）
- History 空狀態 CTA（`HistoryView.tsx` 的 Create Music Video／Create Song）

## 驗證紀錄（2026-10-15）

- `npm run typecheck` / `lint` / `test:run`（165 passed）/ `build` 全部通過
- 從 build 預渲染 HTML 確認屬性確實出現在 DOM（含 `next/link` 產生的 `<a>`）：`header-login`、`header-language`、`header-start-free`、`header-back`、`sidemenu-*`、`mobile-menu-*`、`tool-mv-generate`、`tool-song-generate` 等。登入後／對話框內才出現的元素（credits、upgrade、mode modal、recreate…）為同樣的原生 `<button>`，屬性同樣直接輸出
- 只新增屬性：視覺、e2e selector、a11y 均不受影響
- 查核指令：`grep -rn 'data-gtm=' src`
