# Designer TODO — 回報給設計師的清單

**這份的讀者是設計師,不是工程師。** `TODO.md` 是我們自己延後的決定;這裡只放
**只有設計師能解決**的事:缺的稿、稿裡的瑕疵、以及需要設計判斷的取捨。

每一項都標了**是否擋開發**。多數不擋 —— 我們會照現況繼續搬,搬到了再回頭補。

> 來源:`designer-prototype/`(github.com/marukox1105/YCM @ `568e64c`, 2026-08-04)。
> 每次設計師交新版後,依 `docs/redesign-migration-plan.md` §7 重跑對齊流程並更新本檔。

---

## A. 稿裡的瑕疵(搬的時候撞到的)

### A1. 對比度不足 —— 三處,同一個系統性成因

**發現於:** 2026-08-04,`/history`(第一個移轉的畫面)與 Slice 2b 的 `Tabs`。

axe 實測(WCAG AA,小型文字需 **4.5:1**):

| 元件                             | 前景 / 背景                                | 實測對比                     | 字級       |
| -------------------------------- | ------------------------------------------ | ---------------------------- | ---------- |
| `.tabs__tab--active`(`Tabs.css`) | `#ffffff` on `#a855f7`                     | **3.95:1**                   | 13px / 700 |
| ~~`.tabs__tab`(未選中)~~         | ~~`rgba(255,255,255,.4)`~~ → **已改 `.6`** | ~~3.74:1~~ → **約 6.6:1 ✅** | 13px / 700 |
| `.badge--failed`(`Badge.css`)    | `#ff2600` on `#643839`                     | **2.55:1**                   | 9px / 700  |

> **更正:** 這份文件先前把 badge 記成 4.07:1 —— 那是拿卡片底色去合成算的。
> axe 是拿**實際疊在封面圖上的底色** `#643839` 算,結果是 **2.55:1**,比先前寫的嚴重得多。

**這三處是同一個成因,不是三個獨立的小問題**:白字直接壓在品牌紫 `--accent` / `#a855f7` 上,
以及低不透明度的次要文字壓在深色卡片上。WA 自己既有的 accent pill 對比問題(`TODO.md` #2)
是完全相同的根因 —— 所以這是**設計系統層級**的決定,不是單一元件的微調。

- **擋開發嗎?不擋。** 目前的 a11y 自動測試不會登入,所以 `/history` 對 axe 只呈現登入 modal,
  這些元件它看不到。**它現在沒被擋下來,是因為測試有覆蓋缺口,不是因為問題不存在** ——
  這點要說清楚,免得日後補上登入測試時看起來像「突然壞掉」。
- **Gate 立場:** 計畫的 G5-e 要求已移轉 route **零 axe violation**。等 a11y 測試補上登入時,
  這條就會真的擋。
  **進度(2026-08-04):**

- ✅ **未選中 tab 已拍板並上線** —— 產品決定改 `rgba(255,255,255,.6)`,實測約 6.6:1。
  **但修在 `src/styles/designer-overrides.css`,不是改 `Tabs.css`** —— `designer/` 下的檔案是
  逐位元組複製,改了會被 `designer:check` 擋,而且下次交稿會把修正連同理由一起還原。
  **請在下次交稿時把 `Tabs.css` 的 `.tabs__tab` 改成 `.6`**,我們就會刪掉那個 override。
- ⬜ `.tabs__tab--active`(3.95:1)與 `.badge--failed`(2.55:1)**仍待決定**。

**進度(2026-08-05,Slice 3b):上面那句「日後補上登入測試時看起來像突然壞掉」的預測成真了 ——
而且不是靠補登入,是靠一條不需要登入的 route。** `/explore/songs` 與 `/song/play`
沒有 `AuthGuard`,所以它們的 tab 列是 **axe 第一次真的量到的那一列**,
`e2e/a11y.spec.ts` 當場兩條紅:`.tabs__tab--active`,實測 **3.95:1**,與上表一字不差。

- 這**不是 3b 造成的**。`/history` 從 Slice 2b 就有同一組 tab,只是 axe 看不到。
- 依 A1 選項 2 的既有慣例(比照 `TODO.md` #2 的 accent pill),已把
  `.tabs__tab--active` 加進 `a11y.spec.ts` 的 `KNOWN_CONTRAST_PILLS` 排除清單,
  註解指回本條。**沒有自己挑顏色** —— 挑顏色是設計判斷,而且要修在 DP 的
  `Tabs.css` / `tokens.css`,不是 override。
- **這條現在是唯一還靠排除清單活著的 DP 對比問題**;`.badge--failed` 尚未被 axe 量到
  (它只出現在 `/history`,仍在覆蓋缺口裡)。

- **剩下兩項需要的決定(擇一):**
  1. 調整品牌紫上的文字處理(加深底色、或改用深色文字、或加大字級到 ≥18px 讓門檻降為 3:1);
     次要文字不透明度從 40% 提高到約 60%;Failed badge 提高文字亮度或加深底色;或
  2. 產品明確接受這組例外,比照現有的 accent pill 例外處理(`TODO.md` #2)。

### A2. 四個 token 在 `tokens.css` 裡不存在 —— 不擋開發,但會靜默壞掉

已知有 **四個**(每搬一支檔就再發現一個)**DP 自己的 `tokens.css` 從未定義**的名稱被引用:

| 引用的名稱                                  | 問題                                                                 | 目前實際效果            |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------- |
| `--neutral-dark-48`(2 處)                   | 灰階只有 `44` 和 `54`,沒有 `48`                                      | 宣告被丟棄,顏色改為繼承 |
| `--neutral-dark-15`(1 處)                   | 只有 `14` 和 `24`,沒有 `15`                                          | 同上                    |
| `--line-height-body-s`(1 處)                | 有 `--font-body-s`,但 line-height 階梯**跳過了 `s`**                 | 行高改為預設值          |
| `--font-weight-regular`(`MobileTabBar.css`) | 字重只有 `medium` / `semibold` / `bold` / `extrabold`,沒有 `regular` | 字重改為繼承            |

**這是 CSS 最危險的失敗方式:沒有錯誤、沒有警告、build 照過,元素只是安靜地換了樣子。**

我們加了 `npm run designer:check` 自動掃這類問題,所以之後每次交稿都會立刻抓到。
但**修正要在設計師那邊做** —— 我們這邊的檔案是逐位元組複製的,在我們這裡改,下次交稿會被覆蓋掉。

- **需要的決定:** 這四處原本想用哪個值?是打錯字(48 → 44 或 54?),還是 tokens.css 少了這幾階?

### A3. `HistoryPage.css` 的斷點與議定的六階不一致 —— 不擋開發

該檔的 media query 是 **480 / 767 / 900 / 1200**,但雙方議定(且 `breakpoints.css` 自己也寫明)
的六階是 **320 / 375 / 768 / 1024 / 1440 / 1920`**。只有 **767** 對得上。

- **需要的決定:** 這是刻意為這一頁做的微調,還是應該收斂回六階?
  若是刻意的,我們照搬不動;若是疏漏,請在下次交稿時對齊。

### A4. `AppLayout.css` 的手機規則把 navbar 的 **tabs 列**一起藏掉 —— 已用 override 暫時處理

`AppLayout.css:82-89` 在 `max-width: 767px` 把 `.sidebar` / `.navbar` / `.detail-navbar` /
`.room-navbar` / `.footer` 整批 `display: none`,因為手機改用 MobileHeader + MobileTabBar。
**對 chrome 是對的,對 tabs 列不對** —— navbar 的 tabs 列是「頁面內容」,不是 chrome。

實際後果(已量測):我們把 History 的 **All / Music Videos / Songs / Liked** 篩選搬進
`RoomNavbar` 的 `tabsSlot` 之後,這條規則讓它們**在手機上整組消失** ——
DOM 在、`display:none`、使用者完全無法篩選。其中 **Liked 是有 spec 的行為(HIST-03)**,
不是裝飾。

**我們判斷這是疏漏而非刻意**,理由在稿子自己身上:`RoomNavbar.css` 檔尾**自己就寫了**
一段 `@media (max-width: 767px)`,把 `.room-navbar__tabs` 的側邊 padding 調成 16px ——
在父層被藏掉的前提下,那段是永遠跑不到的死碼。**有人為這一列做過手機樣式,只是被 layout 規則蓋掉了。**

- **我方已做的事(2026-08-05,產品負責人決定):** 在 `designer-overrides.css` 用
  `:has()` 只把「有 tabs 的 navbar」在 <767px 放回來,並單獨把 `__top`(標題/點數/Upgrade)
  維持隱藏 —— 那一列確實由 MobileHeader 取代。沒有 tabs 的 navbar(例如 `/explore/mvs` 的
  `DetailNavbar`)維持 DP 原樣隱藏。已補 7 支 e2e 鎖住這個行為。
- **需要的決定:** 下次交稿請讓 tabs 列在 <767px 保持顯示。屆時我們刪掉 override。

### A5. 手機上 detail 畫面**沒有任何返回途徑** —— 需要設計判斷

承 A4:`.detail-navbar` 在 <767px 也是 `display: none`,而 **`MobileHeader` 沒有 back 控制項**
(DP 與 WA 兩邊都沒有)。也就是說 **DP 的手機設計在 detail 畫面上完全沒有返回鍵**,
只能靠底欄的 Explore / ＋ / History 三個入口。

⚠️ 這與轉移計畫 §1.1 **CH2 的立論相反** —— 該條寫的是「DP 的 detail 畫面是繞著 `DetailNavbar`
的返回鍵設計的,沒有它,12 個畫面在手機上失去唯一的返回途徑」。實際讀 DP 的 CSS,
**那個返回鍵在手機上本來就不存在**。計畫的那句敘述需要更正。

- **目前影響:** `/explore/mvs` 不受傷(它本身就是 Explore 的落點,底欄可達)。
- **之後會受傷:** `/watch`、`/mv/result`、`/mv/edit` 等 detail 畫面,手機上會走進去出不來。
  **這擋 `/watch` 那個 slice。**

> #### ⚠️ A5 的實際範圍是 **5 個畫面,不是 1 個**(2026-08-05 實測,把 DP 跑起來量的)
>
> 上面「之後會受傷」是推測;現在有數字了。做法:把 DP 跑在 375px,對每一頁掃
> 「宣告了 back 控制項,但算出來高度是 0」的元素。**DP 有 9 支 page 用 `DetailNavbar`**,
> 其中 5 支在手機上真的**進得去、出不來**:
>
> | DP page                 | WA route         | 375px 量到           |
> | ----------------------- | ---------------- | -------------------- |
> | `MVDetailPage`          | `/watch`         | declared=1 visible=0 |
> | `AccountPage`(settings) | **`/settings`**  | declared=1 visible=0 |
> | `CommunityProfilePage`  | `/creator`       | declared=1 visible=0 |
> | `MVResultPage`          | `/mv/result`     | declared=1 visible=0 |
> | `MVStoryboardPage`      | `/mv/storyboard` | declared=1 visible=0 |
>
> 不受傷的(量過,列出來免得重查):`/account` 根頁、`/history`、`/mv-create`、
> `/song-create` 根本沒宣告 back(它們是 `RoomNavbar` 的頂層落點,底欄可達);
> `/account/credits` declared=2 **visible=1**(有一顆活的);`/song-detail` 見 A5 既有的例外說明。
> `MVEditPage`(`/mv/edit`)**沒量到** —— 見 A12,它在 vendored 這份 DP 裡跑不起來。
>
> **對計畫的直接影響:`/settings` 也在名單上。** 轉移計畫原本判定
> 「`/profile` + `/settings` 不是 detail 畫面,不受 A5 影響」——**那句話對 `/profile` 成立,
> 對 `/settings` 不成立**。DP 的 `/account/settings` 用的就是
> `<DetailNavbar backHref="/account">`,而它在 375px 是 `display:none`、back 鍵高度 0。

- ✅ **`/song/play` 是例外,不受傷(2026-08-05 讀 code 更正)。** `SongDetailPage` 自己就有一個
  全螢幕的 `MobileNowPlaying`(`SongDetailPage.tsx:269-470`),而且**它有自己的返回鍵**
  (`ic_arrow_left` → `closeMobilePlayer()`)。也就是說設計師在**這一個**畫面解決了手機返回,
  只是解法住在頁面內部而不是 chrome 裡。**這反而是 A5 想要的答案的參考範例** ——
  問題是它沒有推廣到其他 detail 畫面。
- **需要的決定:** 手機 detail 畫面的返回要放哪裡?(MobileHeader 加 back?detail-navbar
  在手機只留 back 一顆?還是把 `MobileNowPlaying` 的頁內返回鍵推廣成通則?)請給稿。

### A6. `SongDetailPage` 的 `Trending` tab 沒有對應資料 —— 不擋開發

`SongDetailPage.tsx:31` 有四個 tab(`All` / `Top Picks` / `Trending` / `New Releases`),
但**該檔自己的註解就說明了那是假的**:「no real per-tab data exists to actually filter by
(Top Picks/Trending/New Releases aren't distinguished in the song data)」——
四個 tab 只是把同一份 catalog 用不同方式重排(reverse / A→Z / Z→A)。

WA 這邊有**兩份真的**清單(`TOP_PICKS_SONGS`、`NEW_SONGS`),所以 Slice 3b 的作法是:
`All` ← 兩份合併、`Top Picks` ← `TOP_PICKS_SONGS`、`New Releases` ← `NEW_SONGS`,
**`Trending` 先不做**。與 `/explore/mvs` 的兩個 section 接真資料同一個判斷 ——
寧可少一個 tab,不要用排序假裝一個分類存在。

- **需要的決定:** `Trending` 的定義是什麼?(近 7 天播放成長?總播放數?人工精選?)
  給了定義我們就能接真資料把它加回來。若它其實只是視覺佔位,請在下次交稿移除。
- **已落地(2026-08-05):** Slice 3b 就是照上面做的,線上只有三個 tab,並有 e2e
  斷言 `Trending` 不存在 —— 所以它加回來時會是一個**刻意的**改動,不會悄悄長出來。

### A7. DP 的 transport 沒有 shuffle / repeat —— 不擋開發,但**與 spec 相牴觸**

**發現於:** 2026-08-05,Slice 3b(`/song/play`)。

`SongDetailPage` 的 `NowPlaying` 與 `MobileNowPlaying` 兩支 transport 都只有
**prev / play / next** 三顆。WA 原本的播放器有 **shuffle + repeat**,而且那不是隨手加的:
`specs` 的 **AC-EXP-05** 明文要求 `/song/play` 要有 shuffle + repeat(EXP-04,2026-07-23 加入)。

**產品決定(2026-08-05):照 DP 刪掉,並記在這裡問設計師。** 所以現在的狀態是
**code 與 spec 不一致,而且是刻意的** —— 這正是不能只靠截圖驗收的那類損失
(見 A4:重錄視覺基準會把功能損失一起收下)。

- **需要的決定(擇一):**
  1. transport 補回 shuffle / repeat —— 請給稿(五顆的排列、icon、選中態);或
  2. 產品確認這兩個功能取消,我們就把 **AC-EXP-05 改掉**,讓 spec 跟上。
- 在決定之前:`specs/00-overview.md` F13 與 `specs/areas/04-*` 的 AC-EXP-05
  已標註此差異,`plan §8` 記為 **S21**。

### A8. `TopSongListItem.css` **一條 media query 都沒有** —— 不擋開發,320/375 標題被截到不可讀

**發現於:** 2026-08-05,Slice 3b 的六寬度視覺檢查。

`TopSongListItem.css`(239 行)**沒有任何 `@media`**。它是照 1440 / 1920 兩個 Figma frame
畫的,而 `.top-song__actions`(愛心 + 分享 + Create 三顆)是 `flex-shrink: 0`,
所以在 320 / 375 擠壓的全是標題欄。實測(截圖存檔):

| 寬度  | 標題實際顯示                                            | 創作者          |
| ----- | ------------------------------------------------------- | --------------- |
| 375px | 「Pop Ant…」「Acoustic…」「Down th…」—— 約 10 字        | 「Melody…」     |
| 320px | 「P…」「C…」「El…」「A…」—— **1–2 個字元,完全讀不出來** | 「M」「S.」單字 |

**320px 是議定的最小支援寬度,在那裡這份清單是不能用的** —— 不是「有點擠」。

手機上這份清單是 Explore 的**頂層目的地**(底欄可達),不是次要畫面 —— 使用者主要就是
在這裡挑歌,而現在挑不出來。DP 自己在手機也是這個清單,所以這是稿本身缺手機版,
不是我們搬錯。

- **需要的決定:** 320–767px 這一列怎麼排?(例如:Create 收成 icon、
  stats 那一列收掉、或標題允許兩行)請給一個手機 frame。
- 我們**沒有自己改** —— 動 `top-song` 的行內配置就是在替設計師決定版面,
  而且會變成 `designer-overrides.css` 裡一條很難刪的規則。

### A9. `MobileTabBar` 未選中的文字 **3.74:1**,不到 WCAG AA —— 與 A1 同一類,不能自己挑顏色

**發現於:** 2026-08-05,`backdrop-filter` slice 的 G7 獨立 a11y 驗收(axe 實測)。

`.mobile-tabbar__label` 在未選中態量到 **3.74–3.80:1**(`#6d6d6e` / `#6b6b6d` 壓
`#09090b` / `#0b0b0d`),AA 要求 4.5:1。成因不是顏色本身,而是
**`.mobile-tabbar__item { opacity: .4 }` 疊在近黑底上**把有效前景色整個拉灰。

- **與 `backdrop-filter` 無關。** 那條 bar 自己的底是 `rgba(9, 9, 11, .95)` —— 95% 不透明,
  blur 對它的對比幾乎沒有影響。這是**既有**問題,不是 blur 復原造成的。
- **為什麼一直沒被擋下來:** `e2e/a11y.spec.ts` **從來沒有設 viewport**,跑在 Playwright 的
  桌機預設寬度,而 `.mobile-tabbar` 在那裡是 `display: none` —— **axe 從來沒有掃過手機 chrome**。
  這一條要補進 gate,但補之前得先有顏色決定,否則 gate 一加就紅。
- **需要的決定:** 未選中 tab 的顏色要調到多少?(建議不要靠 `opacity` 壓,直接給一個
  過得了 4.5:1 的 label 顏色;`opacity` 會連 icon 一起吃掉,而且無法逐項調。)
- 我們**沒有自己挑顏色** —— 依 A1 的既有慣例,這是設計決定。
  `MobileTabBar.css` 是 verbatim 的 designer stylesheet(D1),改它會失去 file-level re-sync。

### A10. 手機上 6 個控制項小於 24×24(WCAG 2.5.8 AA)—— 依畫面列,不擋開發

**發現於:** 2026-08-05,把 DP 跑在 375px 逐頁量 `getBoundingClientRect()`。

| DP page           | 控制項                       | 實測尺寸 | 對應 WA slice      |
| ----------------- | ---------------------------- | -------- | ------------------ |
| `AccountPage`(根) | `.icon-button`(編輯個人資料) | 20×20    | **`/profile`**     |
| `SongCreatePage`  | `.toggle-switch__track`      | 36×20    | `/song/create`     |
| `SongCreatePage`  | `.song-create__idea-btn`     | 51×20    | `/song/create`     |
| `MVCreatePage`    | `.mv-create__idea-btn`       | 79×20    | `/mv/room`         |
| `MVResultPage`    | `.mv-result__control-btn`    | 20×20    | `/mv/result`       |
| `MVResultPage`    | `.toggle-switch__track`      | 36×20    | `/mv/result`       |
| `HistoryPage`     | 兩個 `<a>`                   | ×18 高   | `/history`(已移轉) |

- **門檻用的是 24×24(2.5.8 AA),不是 44×44。** 44 是 2.5.5 AAA。第一版量錯用了 44,
  於是把 `.mobile-header__subscribe`(30×30)與 `.mobile-header__account`(28×28)
  誤報成失敗 —— **那兩個是過的**,寫在這裡免得下一個人重複誤判。
- **量過而且乾淨的:** `/home`、`/mv-detail`、`/mv-storyboard`、`/account/settings`、
  `/account/credits`、`/community-profile` 全部 ≥24×24。
- **需要的決定:** 這幾個要放大到 24,還是靠加大 hit area(padding / `::after`)?
  後者不動視覺,通常是設計師比較能接受的解法。**我們沒有自己改** —— 這些都在 verbatim stylesheet 裡。

### A11. DP 在 320 / 375 **沒有任何水平溢出** —— 這是好消息,寫下來免得重查

同一輪實測順帶量的:12 條 DP route × {320, 375},`documentElement.scrollWidth` **全部等於視窗寬**,
沒有一個元素超出視窗邊界。**DP 的版面本身是會縮的**,手機問題不是「排版爆掉」,
而是 A5(沒返回鍵)、A8(文字被截到剩 1–2 字)、A9(對比)、A10(觸控目標)這種
**不改變 `scrollWidth` 的**失敗。

> ⚠️ **量的方法本身有一次假陰性,值得記下來。** 第一版只量水平溢出,12 條 route 全部「乾淨」——
> 但 A8 那種「標題被 ellipsis 截到剩 1 個字」根本不影響 `scrollWidth`。
> 拿已知會壞的 WA `/explore/songs` @320 去反測探針,才確認探針漏了整整 32 個被截斷的元素。
> **探針要先在已知壞掉的案例上驗過,才能相信它說「乾淨」。**

### A12. vendored 的 DP **跑不起來**,`/song-detail` 與 `/mv-edit` 連桌機都是白畫面

`PROVENANCE.md` 已經寫了「this copy will not `npm run dev` with real media」——
實測確認,而且比預期嚴重:少的不只是圖,`vite` 直接在 import 階段就失敗。

把 25 個缺檔補成 stub 之後其餘 12 條 route 都正常,但**這兩條在 320 / 375 / 1440 都是白的**,
console 是 `TypeError: Cannot read properties of undefined (reading 'id')`(song-detail)與
`reading 'video'`(mv-edit)—— **三個寬度都一樣,所以不是手機問題,是 fixture 依賴被排除的媒體。**

- `/song-detail` 已經移轉完(3b),**WA 那份現在才是可量的基準**,不影響。
- **`/mv/edit` 那個 slice 開工前要先想辦法把 `MVEditPage` 跑起來**,否則它的手機狀況
  完全沒有人看過 —— 它也在 A5 的 `DetailNavbar` 名單上,只是量不到。
- 想重跑這個稽核:把 `designer-prototype/` 複製到 repo 外,補 stub,再跑 `vite`。
  **不要在 `designer-prototype/` 裡面補檔**,那是唯讀參考。

---

## B. 還沒有設計稿的畫面(擋該畫面,不擋其他)

| 畫面                           | 狀況                                                                                                                                                        | 影響                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **`/mv/creating`**             | ⚠️ **DP 完全沒有 MV render 的進度畫面。** `MVResultPage` 只有結果態。Song 與 Storyboard 都有 processing stage,唯獨 MV render 沒有                           | 該 route 無法移轉,維持現行 UI                     |
| **`/share`、`/share/mv/[id]`** | 只有 `ShareDialog` 元件,沒有分享落地頁                                                                                                                      | 同上                                              |
| **Landing page**               | 已決定延後。目前 `/home` 與 `/home-review-b` 兩版並存未選                                                                                                   | 連帶行銷 Navbar / Footer / 語言選單都不在本次範圍 |
| **Profile 頭像上傳 + 裁切**    | ⚠️ **完全空白。** `AccountPage.tsx:106` 的 `Change Photo` 是**沒有 onClick 的死按鈕**;全套件沒有頭像用的 `type="file"`、沒有 `FileReader`、沒有任何 crop UI | 需要完整的上傳 → 裁切 → 預覽 → 儲存流程稿         |

> 關於頭像:設計師在 `PROJECT_CONTEXT.md` 已自述 MV Create 的臉部偵測是
> 「綁定單張 `group.jpg` 的確定性模擬,任意上傳與真實座標抽取不在 prototype 範圍」。
> 所以這不是漏做,是明確排除在 prototype 之外 —— 但產品需要它,需要補稿。

---

## C. 設計師自述未完成(來自 `PROJECT_CONTEXT.md`)

這些是設計師自己列的,我們照抄過來以免遺漏。搬到這些畫面時會標 `@needs-figma-recheck`:

- **Trim Audio** 的精修與移動播放頭
- **`SongResult`** 尚待 Figma 覆核
- **Account / Credits / Community Profile / History** 的六寬度視覺 pass
- **`/home-review-b`** 是暫時的 A/B 路由,選定方向後要刪除
- Footer 的 **Pricing / FAQ** 仍是佔位連結(沒有目的地頁)
- MV Create 臉部偵測的四個裁切位置是「視覺微調的百分比」,若 Figma 流程再變需要重新比對

---

## D. 需要設計判斷的產品差異(不是瑕疵,是取捨)

| #           | 項目              | 現況落差                                                                                                                                                   |
| ----------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S2**      | MV 音訊最短 30 秒 | spec 要求 30 秒下限並顯示提示;DP 的 `TrimAudioSheet` 只有 `TRIM_MIN_GAP = 0.08`(軌長 8%),沒有絕對秒數下限。**已拍板保留 30 秒下限**,需要對應的錯誤提示視覺 |
| **S20**     | Weekly 方案價     | DP 的 `UpgradeDialog` 寫 **$9.99**,程式碼是 **$19.99**。已拍板**以程式碼為準**,請下次交稿對齊(其餘兩檔 $29.99 / $59.99 一致)                               |
| **credits** | 全站硬寫 `390`    | DP 有 19 處硬寫 credit 數字。我們會接上真實餘額 —— 這裡只是告知,**不需要設計師改**,但餘額不足 / 歸零的視覺狀態目前沒有稿                                   |

---

## 我們這邊已經處理掉、不需要設計師動作的

留一份清單,免得重複討論:

- **90 個 icon 檔名**與我們原有的 84 個完全同源,已全數收進 `public/assets/icons/ui/`,
  並改用 DP 的 `mask-image` + `currentColor` 做法。
- **檔名含空白**:這一版只剩 8 個,全部在 `covers/`(demo 媒體,我們沒有收進 repo)。
  原本計畫裡的 slugify script 不需要了。
- **`sessionStorage` 登入**:我們維持 `localStorage`,DP 的 `AuthProvider` 整支不搬。
- **`<a href>` 整頁導航**:我們一律改成 `next/link` + locale 前綴,否則非英文語系會壞。
