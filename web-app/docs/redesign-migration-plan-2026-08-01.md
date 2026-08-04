# 設計師新版 UI 轉移計畫(Research / Plan only)

> **日期:** 2026-08-01
> **來源 prototype:** `/Users/jasonchen/Downloads/YCM-main`(以下稱 **DP** = Designer Prototype)
> **目標專案:** `web-app/`(以下稱 **WA** = Web App,正式交付物)
> **本文範圍:** 架構比對 + 轉移研究 + 風險 + **驗證/Gate 制度**。**不含實作**。
> DP 仍未完成(缺 Profile / Settings / Credits IAP / Share / Explore 等面),所以 §8 的
> spec 差異清單是**目前可見範圍**,設計師補齊後要用 §11 的流程再跑一次。

## 已拍板決策(2026-08-01)

| # | 決策 | 影響 |
|---|---|---|
| **D2** | **Token source of truth 換成 DP 版**,加 alias 層維持現有元件相容 | 需改 `AGENTS.md` 的 "NEVER edit token values" 規則 |
| **Breakpoint** | **擴充為六階**(320 / 375 / 768 / 1024 / 1440 / 1920),同步改 `AGENTS.md` | 新增 `md:` / `xl:`,推翻現行「只有 sm/lg」規則 |
| **D3** | **路由模型保留 WA 的拆法**(processing 維持獨立 route) | 待與設計師確認 10 項,見 §7 |

## 協作前提(本次新增的最高約束)

**分工:UI 由我們的 prototype 出,RD 負責串 API 與帳號。**
→ 這代表這次轉移是 **UI-only 變更**,對 RD 的介面必須**零破壞**。
→ 因此本文新增 **§9「RD 契約面」** 與 **§10「Gate 制度」**:
> **任何 slice 只要沒有全數通過該層的 Gate,就不算完成 —— agent 不得自行宣告 Done。**

---

## 1. 結論先講(TL;DR)

1. **兩邊 design token 同源。** DP 的 `--neutral-dark-04…100` 與 WA 的 `--n04…--n100`
   **13 階灰階值完全一致**,主色 `#A855F7`、`--pf-red #FF2600`、`--pf-green #01B37B`、
   MV/Song 漸層停點也一致。顏色不是重畫,是**改名對映**。
2. **但圓角級距、字級命名階梯、breakpoint 三者完全不同** —— 這三項是視覺走鐘的主要來源。
3. **DP 沒有任何資料層。** 沒有 API contract、job polling、provider、credits 扣款、Zod schema。
   → 轉移方向必須是**「拿 DP 的 DOM + CSS,接 WA 的 provider / MuseApi」**。
4. **DP 只覆蓋我們 20 個 route 中的 9 個。** 剩下 11 個沒有新設計稿。
5. **DP 帶進兩個全新產品面**:**Blog**(2 個概念稿)與 **AI Storybook**(側欄 NEW badge,`href="#"`
   未做)。現行 spec 完全沒有,屬新增 scope。
6. **策略:CSS 原樣搬(BEM 全域樣式表),元件外殼重寫成 Next client component,資料一律接 WA 既有 provider。**

---

## 2. 技術棧對照

| 項目 | DP(設計師) | WA(我們) | 影響 |
|---|---|---|---|
| Framework | Vite 8 + React 19.2.7(SPA) | **Next.js 16.2 App Router** + React 19.2.4 | 高 |
| 語言 | TS ~6.0(非 strict) | TS 5 **strict** | 中 |
| 路由 | `window.location.pathname` 字串比對 + 整頁 `<a href>` 導頁 | Next file-based route + `useRouter()` | 高 |
| 樣式 | **純 CSS**,41 檔 / 11,658 行,BEM,元件旁 colocate | **Tailwind v4** arbitrary value + inline `style={{ var() }}` | 高 |
| 狀態 | 只有 local `useState` + 一個 `sessionStorage` draft | Provider stack(Auth→Credits→History→MvFlow→SongFlow)+ `pollJob` | 高 |
| 資料 | `import.meta.glob` 掃資料夾組 mock catalog | `MuseApi` contract + Zod schemas + `MockMuseApi` | 高 |
| Assets | `src/assets/**`,210 處 `import … from '…assets/…'` | `public/assets/**`,字串路徑 | 中 |
| Icon | 89 個 `ic_*.svg`,一律 CSS `mask-image` + `currentColor` | 85 個**同名** `ic_*.svg`,但多數畫面用 inline `<svg>` | 中 |
| i18n | 無。硬寫英文 + 12 語 mock 下拉 | 9 語 URL-prefixed + middleware + dictionaries | 中 |
| 測試 | 無 | vitest + Playwright + axe + Storybook | 中 |
| 規模 | 44 tsx(7,567 行)+ 41 css(11,658 行);11 pages / 21 components | 60 tsx(8,538 行);20 routes / ~55 components | — |

---

## 3. 資訊架構(IA)差異

### 3.1 路由對照

| DP 路由 | WA 路由 | 狀態 |
|---|---|---|
| `/` `/home` HomePage | `/` HomeView | **改版**(區塊組成不同,見 3.2) |
| `/mv-detail` See-All MV(justified gallery) | `/explore/mvs` MvExplore | **改版** |
| `/song-detail` 播放器 + Top Songs | `/song/play` + 部分 `/explore/songs` | **改版 + 合併** |
| `/song-create`(表單 / processing / result 同頁 stage) | `/song/create` → `/song/creating` → `/song/result` | **路由模型:維持 WA 拆法** |
| `/mv-create` | `/mv/room` | **改版** |
| `/mv-storyboard`(processing + editor 同頁) | `/mv/thinking` → `/mv/storyboard` | **路由模型:維持 WA 拆法** |
| `/mv-result` | `/mv/creating` → `/mv/result` | **路由模型:維持 WA 拆法** |
| `/mv-edit` | `/mv/edit` | **改版** |
| `/history` | `/history` | **改版**(DP 改成 grid card) |
| `/blog1` `/blog3` | — | 🆕 **全新 scope** |
| 側欄「AI Storybook」`href="#"` | — | 🆕 **全新 scope(未做)** |
| `/components`(內部 showcase) | Storybook | 對應,不需搬 |
| — | `/watch` 社群 MV 播放器 | ❌ DP 未設計 |
| — | `/creator` 創作者頁 | ❌ DP 未設計 |
| — | `/profile` `/settings` | ❌ DP 未設計 |
| — | `/share` `/share/mv/[id]` | ❌ DP 未設計 |
| — | Subscribe / BuyCredits / CreditsDetail modal | ❌ DP 未設計 |
| — | `/explore/songs` | ❌ DP 未設計 |

> **⚠️ DP 只覆蓋 9/20 route。** 剩下 11 個(含整條 Profile / Credits / Share 線)沒稿。
> 必須先決定:等設計師補完一次全換,還是分批換並接受一段時間新舊視覺並存。

### 3.2 全域 chrome 差異

| | DP | WA |
|---|---|---|
| 桌面側欄 | Home / AI Music Video / AI Song / **AI Storybook(NEW)** / History / **Blog** | Home / Create MV / Create Song / History / **Profile** |
| 側欄行為 | ≤1024px 自動收合 icon-only,**可手動 toggle** | 無收合,`sm:` 以下換底部 bar |
| 頂部 | **行銷 Navbar**:語言選擇 + Login + 「Start for Free」;登入後只剩 credit pill | TopBar:credit pill + AccountMenu |
| 底部 | **Footer**(Studio / Company) | 無 |
| 手機 | `MOBILE_LAYOUT='app'` → MobileHeader + MobileTabBar(**Explore / Create / History**),斷點 **767px** | 底部 5 項 tab bar,斷點 **640px** |
| 背景 | Home 專屬 colorflow 影片(5 支輪播 + crossfade) | 無 |

---

## 4. Design token / 樣式差異

### 4.1 完全一致(可直接對映)

| WA | DP | 值 |
|---|---|---|
| `--n04 … --n100`(13 階) | `--neutral-dark-04 … -100` | **13 階全數相同** |
| `--accent` | `--purple-500` / `--color-accent-purple` | `#A855F7` |
| `--red` | `--pf-red` | `#FF2600` |
| `--green` | `--pf-green` | `#01B37B` |
| MV 漸層停點 | `--gradient-mv` | `#FF6BCE → #A855F7 → #4338CA` |
| Song 漸層停點 | `--gradient-song` | `#FFB347 → #FF4E50 → #D63AF9` |

### 4.2 ⚠️ 不一致(要逐項拍板 / 已列入 §8)

| 項目 | WA | DP | 備註 |
|---|---|---|---|
| **圓角級距** | `--r-sm 8 / md 10 / lg 12 / xl 14 / 2xl 16` | `--radius-sm 12 / md 14 / lg 16 / xl 20 / 2xl 22 / 3xl 26` | **整條不同**。我們 `rounded-xl`(14px)= 他們 `--radius-md`。`@theme` 必須整個重算 |
| **字級命名階梯** | `title-l 30 / title-m 26 / title-s 17 / title-xs 15`,`headline 20` | `title-xl 30 / title-l 26 / **title-m 20** / title-s 17 / title-xs 15` | **名稱錯位一階**。DP 的 `title-m`(20px)= WA 的 `headline` |
| **漸層角度** | `135deg` | `90deg` | 要確認 Figma 正解 |
| **粉紅** | `--accent-2 #EC4899` | `--pf-pink #F23B77` | 不同色 |
| **藍** | `--blue #38BDF8` | `--pf-light-blue #03ADE2` | 不同色 |
| **橘 / 金** | `--gold #F59E0B` `--orange #F97316` `--premium #FFA614` | `--pf-orange #FF8A02` | DP 一個橘 vs 我們三個語意色 |
| **預設主題** | `:root` 直接深色 | `:root` 是**淺色**,靠 `<html data-theme="dark">` 切深 | 忘了加 `data-theme` → DP 的 `--color-*` 全解析成淺色 |
| **spacing** | `--sp-1…10`(px,實際未用) | `--spacing-4…48`(rem) | 低風險 |

### 4.3 Breakpoint(已拍板:六階)

| 階 | 寬 | 用途 | WA 現況 |
|---|---|---|---|
| XS-min | 320 | 最小支援寬 | ❌ 未驗 |
| XS | 375 | 手機 | ⚠️ 現在驗 390 |
| S | 768 | 平板;**DP 手機 chrome 切點在 767** | ❌ 無 `md:` |
| M | 1024 | 筆電;**DP 側欄收合切點** | ✅ `lg:` |
| L | 1440 | **主要設計基準** | ✅ 驗證寬度 |
| XL | 1920 | 寬桌機 | ❌ 無 |

**要改的地方:**
1. `globals.css` `@theme` 新增 `--breakpoint-md: 768px` / `--breakpoint-xl: 1920px`。
2. shell 的手機切點從 `sm`(640)改到 `md`(768)—— **這會改變 `AppShell` / `Sidebar` 的行為,是行為變更不是純樣式**,要單獨一個 slice 加 e2e。
3. `AGENTS.md` 的 "Breakpoints: only `sm:` and `lg:`" 段落重寫。
4. Playwright 截圖寬度從 390/768/1024/1440 改成 **320/375/768/1024/1440/1920**。

---

## 5. 轉移策略

### 原則
> **搬「視覺層」,不搬「邏輯層」。**
> DP 的 `.css` + JSX 結構 = 要的。DP 的 `useState` mock、`sessionStorage` draft、
> `import.meta.glob` = **一律丟掉**,改接 WA 的 `MuseApi` / provider。

### D1 — CSS 原樣搬(建議,未拍板)

DP 的 41 個 `.css` 原封不動複製到 `src/styles/designer/`,用一支 `designer.css` 統一 `@import`,
由 `globals.css` 載入。BEM class 名不變。

- ✅ 保真度最高 ✅ 之後設計師改版可**檔案級 re-sync** ✅ 改動量最小
- Next.js 只允許在 **layout** 匯入非 module 的全域 CSS —— 走 `globals.css` 剛好符合,
  不需要動 JSX 的 className 字串。這是選它而非 CSS Modules 的關鍵理由。
- 載入順序固定:`tokens → token-aliases → tailwind → designer`。

### D2 — Token:改以 DP 版為 source of truth ✅ 已拍板

1. DP `tokens.css` → 收成新的 `src/styles/tokens.css`。
2. 新增 `src/styles/token-aliases.css`,把 WA 現有名稱(`--bg` `--card` `--text` `--accent` `--r-*`)
   **對映到 DP 名稱**,讓既有 60 支元件零改動繼續跑。
3. `globals.css` 的 `@theme` 依 §4.2 重算 radius / font 對映。
4. root layout 補 `<html data-theme="dark">`。
5. **`AGENTS.md` 的 "NEVER edit token values in `src/styles/tokens.css`" 改寫**成:
   > tokens.css 由設計師 Figma export 同步,**只能整檔置換,不可手改單一值**;
   > WA 專用語意名一律寫在 `token-aliases.css`。
6. **必須產出 `docs/token-map.md`**(WA 舊名 → DP 新名 → 值),這是 Gate G2 的比對依據。

### D3 — 路由模型:保留 WA 拆法 ✅ 已拍板

DP 把 processing 做成同頁 stage 只是因為它沒有 router。WA 拆成獨立 route 是為了 deep link、
flow-guard、e2e 與埋點 —— **保留**,只把 DP 的 processing 畫面當成該 route 的 view 搬過來。
待設計師確認的 10 項見 **§7**。

### D4 — Icon:統一改成 DP 的 mask 方式(建議)

DP 89 個與我們 85 個 icon **檔名一致**(同源)。DP 用 CSS mask + `currentColor`,比我們
「inline SVG 手抄 path」一致性高。建議隨改版收斂,並補齊缺的 4 個。

### D5 — Mock catalog:必須改寫

`import.meta.glob` 是 **Vite 專屬**。三支 catalog(`songs.ts` / `musicVideos.ts` /
`storyboardClips.ts`)改成:
- 短期:一次性 script 掃 `public/assets` 產出靜態 `.ts`。
- 正式:本來就該來自 `MuseApi`,改接 mock endpoint。
- **不可**把 glob 邏輯留在 runtime。

---

## 6. 風險登記表

| # | 風險 | 嚴重度 | 說明 | 解法 / 對應 Gate |
|---|---|---|---|---|
| R1 | **SSR / hydration 崩壞** | 🔴 高 | DP 有 **123 處** `window.` / `document.` / `sessionStorage` / `matchMedia`,散在 **22 支檔案**。典型:`Sidebar.tsx` 在 `useState` initializer 讀 `window.matchMedia()`;`App.tsx` render 期讀 `window.location.pathname` | 每支加 `"use client"`;`window` 讀取移進 `useEffect`;初值給 SSR-safe 預設。**Gate G1-c(hydration 零 warning)** |
| R2 | **圓角 / 字級對映錯位** | 🔴 高 | §4.2 | 先產 `docs/token-map.md` 並 review 通過。**Gate G2** |
| R3 | **只有 9/20 route 有新設計** | 🔴 高 | Profile / Settings / Credits / Share / Watch / Creator 沒稿 | 先定交付順序;分批換要明確接受新舊並存 |
| R4 | **Credits 消耗完全沒被設計** | 🔴 高 | DP navbar 寫死 `credits={390}`,零扣款、零導購、零 IAP。WA 已實作扣款 + 失敗退款 + 餘額不足導購 | 保留 WA 邏輯,UI 缺口列給設計師。**Gate G5-d(credits 行為回歸)** |
| R5 | **破壞 RD 契約面** | 🔴 高 | RD 正在串 API/帳號,任何 `MuseApi` / schema / provider hook / route / locale 變動都會打斷他們 | **§9 契約面凍結 + Gate G4** |
| R6 | **檔名含空白** | 🟠 中 | DP assets **150 個檔名含空白**;另有 `covers/Ｘ/` 全形資料夾(設計師暫存區,**不可動**) | 搬進 `public/` 統一 slugify,產 old→new 對照表 |
| R7 | **兩套樣式系統並存** | 🟠 中 | Tailwind utility 與 DP BEM 全域樣式 specificity 互咬 | 單一 `designer.css` 入口 + 固定載入順序;已移植畫面禁止再混 Tailwind。**Gate G3-d** |
| R8 | **i18n 語言清單衝突** | 🟠 中 | DP 12 語 vs WA `LOCALES` 9 語 | 產品拍板;**擴 `LOCALES` 屬於 RD 契約面變更**,見 §9 |
| R9 | **e2e / Storybook 大量紅燈** | 🟠 中 | e2e selector 是**字面 UI 文案**,改版必然失效 | e2e 更新是 slice DoD 的一部分,不是收尾。**Gate G3-e / G5** |
| R10 | **DP 本身未完工** | 🟠 中 | 設計師自陳:Trim Audio 待 Figma `90:1600` 精修;Song Result / MV Result / MV Edit 未重新對稿;Detail Back 未做 | **先不要搬**,或搬了標 `@needs-figma-recheck` |
| R11 | **交接文件已脫節** | 🟠 中 | `docs/DEVELOPER-HANDOVER.md` §6 寫「Credits are display-only、nothing subtracts them」+ 舊方案價($9.99/$29.99/$69.99、plan id `super`),但 code 早已扣款(`MvFlowProvider:110`)且 plan id 是 `weekly/weekly_pro/yearly` | **Phase 0 先修**,否則 RD 照舊文件實作會做錯。**Gate G6** |
| R12 | **手機切點 640→768 是行為變更** | 🟠 中 | 不是純樣式:會改變 `AppShell` 在 640–767 之間渲染哪一套 nav | 單獨 slice + e2e,不要夾在視覺 slice 裡 |
| R13 | TS strict | 🟢 低 | DP 非 strict | 逐檔修 |
| R14 | `@container` | 🟢 低 | DP `ListItem` 用 container query | Next/Tailwind v4 原生支援 |

---

## 7. 路由模型:要和設計師確認的 10 項

已決定保留 WA 的獨立 route 拆法,但以下由「同頁 stage → 獨立 route」帶出的行為必須由設計師定義:

| # | 問題 | 為什麼要問 |
|---|---|---|
| Q1 | **Processing → Result 的轉場**要不要無縫?DP 是同頁淡入,我們換 route 會有一次 navigation | 若要求無縫,得用 shared layout + View Transition,成本不同 |
| Q2 | **中間 route 要不要進瀏覽器歷史?** 從 result 按上一頁會回到還在跑的 `/mv/creating` | 建議 `router.replace`,但這是產品行為 |
| Q3 | **重新整理 / 直接開 `/mv/result`** 沒有 flow state 時要顯示什麼?WA 現在是 redirect 回入口 | DP 完全沒定義;未來 job id 進 URL 才是正解 |
| Q4 | `/mv/thinking` 完成後 URL 要不要換成 `/mv/storyboard`? | 影響上一頁語意與分享連結 |
| Q5 | Song 流程同 Q1–Q4(`/song/create` → `/song/creating` → `/song/result`) | 同上 |
| Q6 | **MV / Song Detail 的 Back 來源**:DP 打算用 `from=home\|mv-create\|song-create` query;我們要不要改用真實 route 階層 | DP 自己標記未實作,現在決定成本最低 |
| Q7 | **對外 URL 命名用哪一套?** `/mv-detail` vs `/explore/mvs`、`/song-detail` vs `/song/play` | 影響 SEO 與已發出的分享連結 |
| Q8 | **Blog / Storybook 的 URL 結構**:要不要 locale 前綴、要不要靜態化 | 若要 SEO,結構要先定 |
| Q9 | **未登入直接開受保護 route** 的行為:WA 開 modal、dismiss 回 Home;DP 沒有 route gate | 連動 S7(§8) |
| Q10 | **Marketing chrome(Navbar/Footer)出現在哪些 route?** 全部,還是只有 Home/Blog | 決定 shell 要拆成幾層 layout —— 這是**架構決定**,越晚改越貴 |

---

## 8. 🔴 目前發現的 spec 差異(要找設計師討論)

> 分類:**[A] 設計師改掉了 spec 訂的行為**、**[B] 設計師漏做**、**[C] 設計師新增、spec 沒有**。
> DP 未完工,清單會隨補稿增加。

| # | 類 | 項目 | spec / WA 現況 | DP 現況 | 要問設計師 |
|---|---|---|---|---|---|
| S1 | A | **MV 畫質命名與 Pro 門檻** | `Standard` / `High`,**High 需 Muse Pro**(皇冠 + 導 IAP,MV-04) | `SD` / `HD`,**沒有 Pro 鎖** | 改名還是取消付費門檻?這是營收設計 |
| S2 | B | **Trim 最短長度** | MV-01:至少 30 秒,不足會擋並顯示「minimum 30s」 | 只有 `TRIM_MIN_GAP = 0.08`(軌長 8%),**沒有 30 秒下限與提示** | 30 秒規則還在嗎?UI 放哪 |
| S3 | B | **歌曲 30 秒免費試聽門檻** | SONG-02 / EXP-04:免費只聽前 30 秒,Pro 解鎖,播放器有升級提示條 | **沒有任何門檻與提示** | 付費轉換點,確認是否刪除 |
| S4 | A | **Song 進階參數** | SONG-01:Custom 有 **BPM slider + Key 選擇器** | **沒有 BPM、沒有 Key**;Song Length 被 `SHOW_SONG_LENGTH=false` 藏起來 | 拿掉還是沒畫?Song Length 何時回來 |
| S5 | B | **Credits 全線** | 扣款(`COST_STORYBOARD 20 / COST_RENDER 200 / COST_SONG 10`)、失敗退款、餘額不足改導購、Subscribe / BuyCredits / CreditsDetail / Restore Purchases | navbar 寫死 `credits={390}`,**零扣款、零導購、零 IAP 畫面** | 整條 credits/IAP 視覺何時給?餘額不足長怎樣 |
| S6 | A | **Publish 流程** | MV 發布是**確認 dialog → 送審 →「Submitted for review」reviewing 狀態**(HIST-04 / TBD-MV-06) | History 卡片是**即時 toggle**,無確認、無審核狀態 | 審核流程拿掉了還是沒畫 |
| S7 | A | **登入門檻層級** | route-level `AuthGuard`(5 route)+ action-level `requireLogin` **雙層** | **只有 action-level**;未登入可完整瀏覽 `/mv-create` | 這回答了未決的 `TBD-AUTH-04`,要正式拍板 |
| S8 | A | **登入持久性** | `localStorage["muse_auth"]`,跨分頁保留 | `sessionStorage`,關分頁即登出 | 以哪個為準(**屬 RD 契約面**,見 §9) |
| S9 | C | **語言清單** | `LOCALES` 9 語 | 選單 **12 語**(多 Italiano / Türkçe / ภาษาไทย / Bahasa Indonesia) | 要擴嗎?連動翻譯與 URL 前綴(**屬 RD 契約面**) |
| S10 | C | **Blog** | spec 完全沒有 | `/blog1`、`/blog3` 兩概念稿 | 新需求還是探索稿?選哪版?需要 PRD |
| S11 | C | **AI Storybook** | spec 完全沒有 | 側欄入口 + NEW badge,`href="#"` 無畫面 | 新產品線?時程? |
| S12 | C | **行銷 chrome** | 無 Footer、無 marketing navbar | Footer + Navbar(語言 + Login + **Start for Free**) | Web 要走「行銷站 + App」雙層 IA 嗎?連動 Q10 |
| S13 | A | **手機 IA** | 底部 5 項(Home/MV/Song/History/Profile),切點 **640px** | 底部 3 項(**Explore/Create/History**),切點 **767px**,另有 MobileHeader | 少了 Profile,Home 改叫 Explore,切點也不同 |
| S14 | A | **Home 區塊組成** | 2 hero CTA + **Trending MV 跑馬燈** + New MVs + Top Picks + New Songs;New Songs 每列有 play/like/share 計數 + 「Create」(EXP-08) | Hero 影片輪播 + **Tool Selector**(新)+ New MVs + Top Picks + New Songs;**無 like/share 計數與 Create** | Trending 軌沒了?社群互動數據刻意拿掉還是漏畫 |
| S15 | A | **Explore MV 排版** | 一般 grid | justified gallery | 確認是刻意改版 |
| S16 | A | **漸層角度** | `135deg` | `90deg` | 哪個是 Figma 正解 |
| S17 | A | **圓角級距整體變大** | `xl = 14px` | 對應階 `= 20px` | 刻意的視覺語言更新嗎?(影響全站) |
| S18 | B | **Detail 頁 Back 導向** | — | 設計師自陳未實作,一律回 `/home` | 連動 Q6 |
| S19 | B | **設計師自標未完成** | — | Trim Audio 待 Figma `90:1600`;Song Result / MV Result / MV Edit 未重新對稿 | 先不要搬,等收斂 |

> **S1 / S3 / S5 是營收相關**(Pro 門檻、試聽門檻、IAP),**S8 / S9 會動到 RD 契約面**,
> 這五項優先級最高,建議先單獨開會過。

---

## 9. RD 契約面(Contract Surface)—— 本次轉移的不可破壞邊界

RD 依賴的**不是畫面**,是下面這組介面。**UI 轉移對它們必須是零 diff。**
任何一項要改,都不能夾在 UI slice 裡偷偷改 —— 必須獨立 PR + 通知 RD + 更新交接文件。

| 層 | 具體檔案 / 介面 | RD 依賴什麼 | 允許變更? |
|---|---|---|---|
| **C1 後端邊界** | `src/lib/api/contract.ts`(`MuseApi` 6 個方法) | 他們要實作這個 interface | ❌ 凍結 |
| **C2 wire schema** | `src/lib/api/schemas.ts`(Zod = 型別 = wire contract) | 回應格式驗證 | ❌ 凍結 |
| **C3 swap point** | `src/lib/api/index.ts`(`export const api`) | 換成真 client 的唯一一行 | ❌ 凍結 |
| **C4 provider hook 介面** | `useAuth` / `useCredits` / `useHistory` / `useMvFlow` / `useSongFlow` 的回傳鍵 | 接帳號、餘額、歷史時要 patch 這些 | ⚠️ 只可**新增**,不可改名/刪除 |
| **C5 auth 儲存** | `src/lib/authStore.ts` → `localStorage["muse_auth"]` | 接真登入的落點 | ⚠️ 需獨立 PR(連動 S8) |
| **C6 locale 模型** | `src/lib/i18n/config.ts`(`LOCALES` 9 語、`localePath`、`HTML_LANG`)+ `middleware.ts` | URL 結構、SEO、後端語系參數 | ⚠️ 需獨立 PR(連動 S9) |
| **C7 route map** | `src/app/**/page.tsx` 的 URL 形狀 | deep link、分享連結、埋點 | ⚠️ 需獨立 PR(連動 Q7) |
| **C8 domain 常數** | `src/lib/mv/types.ts`(`COST_*`、`DEFAULT_SETTINGS`、`isComposeReady`) | 對帳 / 扣點規則 | ⚠️ 只可加 |
| **C9 交接文件** | `docs/DEVELOPER-HANDOVER.md`、`AGENTS.md`、`specs/` | 他們的唯一書面依據 | ✅ **必須同批更新** |

### 降低 RD 衝擊的四個機制

1. **契約快照(Phase 0 建立)** —— 把 C1–C8 序列化成 checked-in 快照檔,
   每次 CI 比對。有 diff 就紅燈,強制作者說明。
2. **`docs/CHANGELOG-RD.md`** —— **只**記錄契約面變更。CI 規則:
   *若 PR 動到 C1–C8 的檔案,但沒有動 `CHANGELOG-RD.md` → 直接 fail。*
3. **Route-level 分批切換** —— 一次只換一條 route,RD 未被觸及的 route 完全不受影響。
   **禁止 big-bang PR。**
4. **每個 Phase 開始前公告凍結範圍** —— 明確告訴 RD「這一週我們會動 `src/components/mv/**`,
   請避開」;`src/lib/api/**` 我們**全程不動**。

---

## 10. Gate 制度(驗證)

> **規則:每一層的 Gate 全綠才算完成。任何一條紅燈,該 slice 就是未完成 —— agent 不得自行宣告 Done,
> 也不得跳過或改寫 Gate 條件來讓它變綠。**
> 每個 slice 收尾時必須輸出一張 **Gate Report**(§10.8 格式),缺任何一列視同未通過。

### 10.0 需要先建的驗證工具(Phase 0,約 1.5–2 天)

| 工具 | 做什麼 | 實作方式(不需新依賴) |
|---|---|---|
| `scripts/snapshot-contract.ts` | 產出 C1–C8 契約快照 | `tsc --emitDeclarationOnly` 產 `.d.ts` + vitest snapshot(見下) |
| `src/lib/api/contract.surface.test.ts` | 鎖住 `MuseApi` 方法名與 Zod schema 形狀 | `expect(Object.keys(api).sort()).toMatchSnapshot()`;schema 用遞迴取 `.shape` 的 key 樹再 snapshot |
| `src/components/providers/*.surface.test.tsx` | 鎖住 5 個 hook 的回傳鍵 | render provider → `expect(Object.keys(hookValue).sort()).toMatchSnapshot()` |
| `e2e/route-map.spec.ts` | 鎖住 route 清單 | 沿用 `a11y.spec.ts` 既有的 `discoverRoutes()` → snapshot |
| `scripts/computed-style-diff.ts` | 抓固定選擇器清單的 computed style | Playwright `getComputedStyle`,輸出 JSON 供比對 |
| `scripts/guard-greps.sh` | 一組禁用樣式的 grep | 見 G1-b |
| Playwright 視覺基準 | 六個寬度的 baseline 截圖 | `toHaveScreenshot()` |

### G1 — 靜態 Gate(**每一次 edit 之後**)

| 代號 | 檢查 | 通過條件 |
|---|---|---|
| G1-a | `npm run typecheck && npm run lint && npm run test:run && npm run build` | 四支全 exit 0 |
| G1-b | `scripts/guard-greps.sh` | 全部零命中:<br>• `grep -rn 'import\.meta' src` → Vite-ism 洩漏<br>• `grep -rn 'fetch(' src` → AGENTS.md 既有鐵律<br>• `grep -rn 'MockMuseApi' src --exclude-dir=lib/api` → 越層 import<br>• `grep -rn 'sessionStorage' src` → DP 的 draft 機制不可帶進來<br>• `grep -rn "window\.location\.href\s*=" src` → 應改用 `router`<br>• 新增/移植檔內 raw hex(`#[0-9a-fA-F]{3,6}`)→ 應走 token |
| G1-c | Dev server console + build output | **零 hydration warning、零 React error**(R1 的守門) |
| G1-d | `"use client"` 稽核 | 任何含 `window` / `document` / `useState` 的移植檔都有 `"use client"` |

> G1 全綠**不代表完成**,只代表可以往下驗。

### G2 — Token 對映 Gate(Phase 1 一次性 + 每次動 token)

| 代號 | 檢查 | 通過條件 |
|---|---|---|
| G2-a | `docs/token-map.md` 存在且經 review | 每個 WA 舊名都有對應 DP 新名與值 |
| G2-b | `scripts/computed-style-diff.ts` 對 **Phase 0 基準**跑 | **20 個既有 route 的 computed style diff = 0**(色/圓角/字級/行高) |
| G2-c | Playwright 視覺比對 vs Phase 0 baseline | **六個寬度全部 pixel diff = 0** |

> **Phase 1 的驗收條件就是「舊畫面零變化」。** 地基階段若有任何畫面差異,代表 token 對映錯了,
> 必須退回改 map,不可「看起來還好」就放行。

### G3 — 元件 Gate(Phase 2,每個共用元件)

| 代號 | 檢查 | 通過條件 |
|---|---|---|
| G3-a | Storybook story 涵蓋所有 variant / size / state | 無 `next/*` import 的元件必須有 story;`npm run build-storybook` 綠 |
| G3-b | 六寬度截圖 vs DP 同元件 | 並排比對,差異需說明(DOM 不同,不做 pixel-exact) |
| G3-c | axe(`@storybook/addon-a11y` + e2e) | 零 violation(既有已知例外除外) |
| G3-d | 樣式純度 | 該元件的 JSX **不得混用 Tailwind utility**(D1 規定);class 全部來自 `styles/designer/` |
| G3-e | 使用該元件的既有畫面回歸 | 所有引用點的截圖與 e2e 重跑,全綠 |

### G4 — RD 契約 Gate(**每一個 PR,無例外**)

| 代號 | 檢查 | 通過條件 |
|---|---|---|
| G4-a | 契約快照比對(C1–C3) | **diff = 0**。有 diff 一律紅燈 |
| G4-b | provider hook surface snapshot(C4) | 只允許**新增**鍵;改名 / 刪除 = 紅燈 |
| G4-c | route map snapshot(C7) | diff = 0,除非該 PR 是宣告過的 route 變更 |
| G4-d | locale 模型(C6) | `LOCALES` / `localePath` / `HTML_LANG` / `middleware.ts` 未變 |
| G4-e | storage key(C5) | `localStorage["muse_auth"]` 未變;**不得出現 `sessionStorage`** |
| G4-f | domain 常數(C8) | `COST_*` 數值未變 |
| G4-g | CHANGELOG 強制 | 若 C1–C8 任一檔有 diff,`docs/CHANGELOG-RD.md` 必須同 PR 更新,否則 fail |

> **G4 是這次轉移最重要的一層。** 它把「不要影響 RD」從口頭約定變成機器檢查。

### G5 — 畫面 Gate(Phase 3,每個 route)

| 代號 | 檢查 | 通過條件 |
|---|---|---|
| G5-a | 六寬度截圖(**320 / 375 / 768 / 1024 / 1440 / 1920**) | 無水平捲軸、文字自然換行、圖片/影片不變形(landscape / portrait / square 都要看) |
| G5-b | 與 DP 同寬度並排比對 | 逐項列出差異並分類(刻意 / 待修 / 待問設計師) |
| G5-c | 互動驗證(Playwright,非只是 render) | 每個可點元素都被點過;所有 modal/sheet 可開可關;鍵盤 focus 順序正確 |
| G5-d | **行為回歸清單**(DP 沒有、最容易在移植中被弄丟的) | 全數通過:<br>1. credits 扣款(`COST_STORYBOARD/RENDER/SONG`)+ **失敗退款**<br>2. 餘額不足 → **改導購**而非產生<br>3. `AuthGuard` 5 個 route + action-level `requireLogin`<br>4. flow-guard(直接開 `/mv/result` 應 redirect 回入口)<br>5. `[fail]` 失敗路徑(描述含 `[fail]` → 60% 失敗 + Retry + History 標 Failed)<br>6. job polling(`pollJob` 120ms,progress 0→100)<br>7. Pro 門檻(High 畫質 crown、30 秒試聽)<br>8. Publish 確認 → 送審 → reviewing 狀態<br>9. i18n:9 個 locale 前綴都能開,`localePath()` 沒被繞過<br>10. `enhancePrompt` 走 `api`,不是本地假字串 |
| G5-e | axe a11y | 該 route 零 violation(既有已知例外除外) |
| G5-f | e2e 同批更新 | `e2e/*.spec.ts` 的文案 selector 已隨新 UI 更新並全綠 |

> **G5-d 是防「視覺搬過來、邏輯掉光」的核心。** DP 沒有這 10 項的任何一項,
> 所以每一項都要在移植後主動證明它還在。

### G6 — 文件同步 Gate(每個 Phase)

| 代號 | 檢查 | 通過條件 |
|---|---|---|
| G6-a | `AGENTS.md` | breakpoint / token / 樣式規則已隨實作更新 |
| G6-b | `docs/DEVELOPER-HANDOVER.md` | 與 code 一致。**Phase 0 先修 R11 的 §6 credits 脫節** |
| G6-c | `specs/areas/*.md` + `00-overview.md` §8 | 判定為 flow 更新的差異已回寫 |
| G6-d | `docs/CHANGELOG-RD.md` | 契約面變更已記錄 |
| G6-e | 本文 §8 | 新發現的差異已追加,含判定理由與日期 |

### G7 — 獨立驗收 Gate(每個 Phase,**不可自我認證**)

依 `AGENTS.md` 與 root `stage-3-validate` 慣例:
- **建置的那個 session / agent 不得宣告 PASS。**
- 開一個獨立 context 的 reviewer(`validation-reviewer` 這類唯讀 agent),
  拿 Gate Report + 截圖 + `specs/areas/*.md` 逐條核。
- reviewer 只能輸出 **PASS / REMEDIATED / FAIL / BLOCKED**,不能自行修改判定條件。
- 差異一律進 §8 清單,**不在 review 當場自行決定**。

### 10.8 Gate Report 格式(每個 slice 必附)

```
[Slice N] <名稱>
G1 靜態      : PASS / FAIL — typecheck ✓ lint ✓ test ✓ build ✓ / greps ✓ / hydration ✓
G2 Token     : PASS / N/A  — computed-style diff = 0 / 視覺 diff = 0
G3 元件      : PASS / N/A  — story ✓ a11y ✓ 樣式純度 ✓ 既有引用點回歸 ✓
G4 RD 契約   : PASS / FAIL — C1-C8 diff = 0 (必附 diff 輸出)
G5 畫面      : PASS / N/A  — 六寬度 ✓ 互動 ✓ 行為回歸 10/10 ✓ axe ✓ e2e ✓
G6 文件      : PASS / FAIL — 已更新: <清單>
G7 獨立驗收  : PASS / FAIL — reviewer: <who>, 報告: <path>
截圖         : <路徑清單,六個寬度>
未解差異     : <進 §8 的項次>
```

**任一列 FAIL 或缺漏 → 該 slice 未完成。**

---

## 11. 分階段計畫

### Phase 0 — 凍結基準與建工具(2–3 天,不動任何畫面)
1. DP 現況 snapshot 進 repo(或記下 commit),之後所有 diff 以此為基準。
2. WA 現況在 **320/375/768/1024/1440/1920** 截圖存檔 → Phase 0 baseline。
3. **建 §10.0 的七套驗證工具**,並產出 C1–C8 契約快照。
4. 建 `docs/CHANGELOG-RD.md`。
5. **修 R11**:`docs/DEVELOPER-HANDOVER.md` §6 的 credits / 方案價脫節。
6. 產出 `docs/token-map.md`(§4.2)並 review 通過。
- **Gate:** G1 + G4(快照建立)+ G6。**這階段結束前不得開始 Phase 1。**

### Phase 1 — 地基(2–3 天,不動任何畫面)
1. tokens 換 DP 版 + `token-aliases.css`(D2)。
2. `@theme` radius / font 對映重算。
3. root layout 加 `data-theme="dark"`。
4. 六階 breakpoint + 更新 `AGENTS.md`。
5. Assets 搬移 script(slugify + old→new 對照表)。
6. 建 `src/styles/designer/` 與 `designer.css` 入口(先空的,接好管線)。
- **Gate:** G1 + **G2(舊畫面零變化,pixel diff = 0)** + G4 + G6 + G7。
- ⚠️ **手機切點 640→768 單獨一個 slice**(R12),要有自己的 e2e。

### Phase 2 — 共用元件層(3–5 天)
依相依序搬 DP 的 21 個元件:
`Button` → `IconButton` → `Chip` → `ToggleSwitch` → `Tabs` → `Card` → `ListItem` → `SectionHeader`
→ `CreditBalance` → `Sidebar` / `Navbar` / `RoomNavbar` / `DetailNavbar` → `Footer` → `MobileHeader` /
`MobileTabBar` → `FloatingCTA` → `LoginModal` → `ShareDialog` → `TopSongListItem`
- `CreditBalance` **必須接 `useCredits()`**,不可沿用寫死的 390。
- `LoginModal` 接 WA 的 `AuthProvider`(DP 用 `sessionStorage`,WA 用 `localStorage` —— 以 WA 為準,
  除非 S8 另有決定)。
- **Gate(每支元件):** G1 + G3 + G4 + G6。

### Phase 3 — 已有設計的 9 個畫面(1.5–2 週)
順序(相依性由低到高):
1. `/history` 2. `/`(Home) 3. `/explore/mvs` 4. `/song/play`
5. `/mv/room`(DP 1,309 行,最大一支,含 5 個 sheet)
6. `/mv/thinking` + `/mv/storyboard` 7. `/mv/creating` + `/mv/result`
8. `/mv/edit` 9. `/song/create` + `/song/creating` + `/song/result`

每個畫面固定作法:
- **保留** WA 的 provider 呼叫、flow-guard、credits 扣款、auth gate、`MuseApi` job polling。
- **替換** JSX 結構與 class 名為 DP 版本。
- **逐條比對** §8 清單,發現差異就記錄,**不自行決定**。
- **Gate(每個 route):** G1 + G4 + **G5(含 10 項行為回歸)** + G6 + G7。

### Phase 4 — 新 scope(等產品拍板)
Blog(先選一個概念)、AI Storybook(DP 只有入口沒畫面)。兩者都要先補 PRD / spec。

### Phase 5 — 補齊未設計的 11 個 route
等設計師交 Profile / Settings / Credits IAP / Share / Watch / Creator / Explore Songs。

---

## 12. 設計師交新版時的對齊流程(可重複執行)

每次設計師交新版都跑這五步:

1. **Snapshot & Diff** —— 新版 DP 放固定位置,對上一版 `diff -r`(有 git 就
   `git log --stat <上次 commit>..HEAD`),列出所有變更檔案。

2. **變更分類** —— 每個變更歸三類之一:
   - **視覺調整** — 只有 CSS 值變動,不影響 flow → 直接跟進,不需討論。
   - **Flow 變更** — JSX 結構 / 新增或移除步驟 / 狀態機改變 → **一律要對 spec**。
   - **新增畫面** — 需要 PRD/spec 才能進 backlog。

3. **對 spec** —— 每個「Flow 變更」查 `specs/areas/*.md` 的 Path / Step / AC:
   - spec 有寫、DP 照做 → ✅ 對齊
   - spec 有寫、DP 不同 → 🔴 進 §8,標記待判定
   - spec 沒寫、DP 有 → 🟡 spec 缺漏,要補寫

4. **判定「新 flow」還是「沒做好」** —— 三個問題:

   | 問題 | 是 → | 否 → |
   |---|---|---|
   | 設計師在 handoff / PROJECT_CONTEXT 有**主動說明**這個改動? | 傾向刻意改版 | 傾向漏做 |
   | 這個改動**跨畫面一致**(不是只有一頁)? | 傾向刻意改版 | 傾向漏做 |
   | 拿掉的東西是**營收 / 法遵 / 資料完整性**相關(Pro 門檻、審核、credits、同意條款)? | **一定要問**,不可預設刻意 | 可先當視覺調整 |

   三題都指向「刻意」→ 記為 **flow 更新**,更新 spec 並在 `00-overview.md` §8 對照表標註。
   任一題指向「漏做」或碰到營收/法遵 → 進 §8 討論清單。

5. **更新文件**
   - flow 更新 → 改 `specs/areas/<n>.md` + `00-overview.md` §8 + `OPEN-QUESTIONS.md`。
   - 漏做 → 回報設計師,**不改 spec**。
   - 兩者都在 §8 追加一列,保留判定理由與日期。
   - 若動到 §9 的 C1–C8 → 同步 `docs/CHANGELOG-RD.md` 並通知 RD。

> **不變的原則:code 與 doc 衝突時 code 為準;但 `specs/*.md` 是例外 —— 它寫的是「意圖」,
> 可能領先或落後 code。任何一方不一致都要主動 flag,不可默默採信或默默覆蓋。**(`AGENTS.md`)

---

## 13. 建議的下一步

1. **開會過 §8**,優先 S1 / S3 / S5(營收三項)+ S8 / S9(會動 RD 契約面)+ S10–S12(新 scope)。
2. **和設計師過 §7 的 10 項路由問題**,特別是 Q10(marketing chrome 的 layout 分層,越晚改越貴)。
3. **確認 D1 / D4 / D5**(D2 與 breakpoint、D3 已拍板)。
4. **和 RD 同步 §9** —— 讓他們確認 C1–C8 這張清單就是他們真正依賴的東西,有漏的要補進去。
   這張表的正確性決定 G4 有沒有意義。
5. 以上都完成後才開 Phase 0。**地基與 Gate 工具沒到位之前不要搬任何畫面。**
