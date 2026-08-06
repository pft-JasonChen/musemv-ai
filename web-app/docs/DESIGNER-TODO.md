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

> **✅ 我方已在 2026-08-05 自行止血,但這條仍需要設計答案。** 產品負責人決定不等稿,
> 否則剩下 10 條 route 有 5 條做不了。作法:**在 WA 自己的 `DetailNavbar` 元件裡**
> 加一顆手機專用的返回鍵(`phoneBack`,預設 **開**,所以新畫面預設不會被關住)。
> 它**刻意不用 `.detail-navbar` 的 class** —— 那個盒子正是被 `display:none` 的東西。
> 底欄可達的畫面(`/explore/mvs`、`/explore/songs` 清單半邊)明確傳 `phoneBack={false}`。
> **一個檔案、一個刪除點。** 設計師給稿後,把這段拿掉即可,不需要逐頁清。
> 已有 e2e 守住三件事:該有的有、該沒有的沒有、桌機不重複。

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

| DP page           | 控制項                          | 實測尺寸 | 對應 WA slice                                                 |
| ----------------- | ------------------------------- | -------- | ------------------------------------------------------------- |
| `AccountPage`(根) | `.icon-button`(編輯個人資料)    | 20×20    | **`/profile`**                                                |
| `SongCreatePage`  | `.toggle-switch__track`         | 36×20    | `/song/create`                                                |
| `SongCreatePage`  | `.song-create__idea-btn`        | 51×20    | `/song/create`                                                |
| `MVCreatePage`    | `.mv-create__idea-btn`          | 79×20    | `/mv/room`                                                    |
| `MVResultPage`    | `.mv-result__control-btn`       | 20×20    | `/mv/result`                                                  |
| `MVResultPage`    | `.toggle-switch__track`         | 36×20    | `/mv/result`                                                  |
| `HistoryPage`     | 兩個 `<a>`                      | ×18 高   | `/history`(已移轉)                                            |
| `AccountPage`(根) | `.icon-button`(`size="XSmall"`) | 20×20    | **`/profile`** —— 已移轉,**我方已改用 `--small`(28×28)**,見下 |

- **門檻用的是 24×24(2.5.8 AA),不是 44×44。** 44 是 2.5.5 AAA。第一版量錯用了 44,
  於是把 `.mobile-header__subscribe`(30×30)與 `.mobile-header__account`(28×28)
  誤報成失敗 —— **那兩個是過的**,寫在這裡免得下一個人重複誤判。
- **量過而且乾淨的:** `/home`、`/mv-detail`、`/mv-storyboard`、`/account/settings`、
  `/account/credits`、`/community-profile` 全部 ≥24×24。
- **需要的決定:** 這幾個要放大到 24,還是靠加大 hit area(padding / `::after`)?
  後者不動視覺,通常是設計師比較能接受的解法。**我們沒有自己改** —— 這些都在 verbatim stylesheet 裡。
- **`AccountPage` 那一列是例外,我方已經改了,理由不同:** 其他幾個是 CSS 尺寸,
  改了就等於改 verbatim stylesheet;但 `IconButton` 的大小是 **JSX 傳的 prop**
  (`size="XSmall"`),換成 `--small` **一個字都不用動 `IconButton.css`**。
  而且它不只是不到 AA —— **它同時是 WA 自己的回歸**:移轉前那顆編輯鍵是 32×32。
  所以這是「還原既有行為」,不是替設計師決定尺寸。**若設計師確認 XSmall 是刻意的,請告知**,
  我們再改回去並改用加大 hit area 的做法。

### A11. DP 在 320 / 375 **沒有任何水平溢出** —— 這是好消息,寫下來免得重查

同一輪實測順帶量的:12 條 DP route × {320, 375},`documentElement.scrollWidth` **全部等於視窗寬**,
沒有一個元素超出視窗邊界。**DP 的版面本身是會縮的**,手機問題不是「排版爆掉」,
而是 A5(沒返回鍵)、A8(文字被截到剩 1–2 字)、A9(對比)、A10(觸控目標)這種
**不改變 `scrollWidth` 的**失敗。

> ⚠️ **量的方法本身有一次假陰性,值得記下來。** 第一版只量水平溢出,12 條 route 全部「乾淨」——
> 但 A8 那種「標題被 ellipsis 截到剩 1 個字」根本不影響 `scrollWidth`。
> 拿已知會壞的 WA `/explore/songs` @320 去反測探針,才確認探針漏了整整 32 個被截斷的元素。
> **探針要先在已知壞掉的案例上驗過,才能相信它說「乾淨」。**

### A12. vendored 的 DP **跑不起來** —— ✅ 2026-08-06 已查明,是**兩批漏掉的素材**,不是頁面問題

`PROVENANCE.md` 已經寫了「this copy will not `npm run dev` with real media」——
實測確認,而且比預期嚴重:少的不只是圖,`vite` 直接在 import 階段就失敗。

**這一條前四次交接都記成「`/mv-edit` 這一頁跑不起來」,那是錯的。** 2026-08-06 把
`designer-prototype/` 複製到 repo 外、逐層補上缺檔之後,查出來是兩個各自獨立的漏素材:

1. **`src/assets/hero/`(9 支影片 + 9 張靜圖)整批不在。**
   `HomePage/HeroBannerSection.tsx` 用具名 import 引它們,一個 import 解不到就整個 module
   graph 失敗 —— 所以**每一條 route 都是白的**,不是這一頁。症狀看起來像頁面問題,其實不是。
2. **`src/assets/storyboard-clips/` 也整批不在。**
   `data/storyboardClips.ts` 用 Vite 的 eager glob 讀它。**glob 讀不到東西不會報錯**,只會給 `[]`,
   於是 `STORYBOARD_CLIPS[0]` 是 `undefined`,`MVEditPage` 第一次 render 就掛在 `.video`。
   輸入靜靜地空掉,錯誤在一層之外炸開 —— 這是這一條難查的真正原因。

補上這兩批(clip 的 `.jpg` 直接用 WA `public/assets/videos/storyboard-clips/` 的,
`.mp4` 用任一支影片充當)之後,**`/mv-edit?from=history` 六個寬度全部正常 render**,
slice 3k 就是照著它搬的。

- **請設計師把這兩個資料夾補進 drop。** WA 這邊不需要動作了,但下一次 re-drop 如果又漏,
  同樣的白畫面會再來一次,而且一樣會被誤判成某一頁的問題。
- 重跑方式:把 `designer-prototype/` 複製到 repo 外,補齊這兩批素材,再跑 `vite`。
  **不要在 `designer-prototype/` 裡面補檔**,那是唯讀參考。
- `/song-detail` 的 `reading 'id'` 是同一個成因的另一個受害者;那條 route 已經移轉完(3b),
  **WA 那份現在才是可量的基準**,不影響。

### A13. `AccountPage.css` 的 stats 說明文字 **約 3.3–3.8:1**,不到 WCAG AA —— 與 A1 同一類

**發現於:** 2026-08-05,Slice 3c 的 G7 獨立驗收(axe 實測,1440 與 375 兩個寬度都紅)。

`.account-page__stats span`(「Credits」「MVs」「Songs」三個說明字)用
`--neutral-dark-44`(`rgb(103,103,121)`)壓在頁面深色底上,**約 3.3–3.8:1**,AA 要求 4.5:1。

- **成因在上游。** `AccountPage.css` 與 DP 逐位元組相同(D1 已驗),所以不是我們搬錯。
- **我們沒有自己挑顏色**,依 A1 的既有慣例。這是設計決定。
- **需要的決定:** 這些說明字要調到哪一階?(`--neutral-dark-54` 或更亮?
  或者這種 caption 級文字要不要有自己的一階?)在那之前,若要先止血,
  可以在 `designer-overrides.css` 放一條暫時的覆寫 —— 但**要產品先拍板值**,我們不自己選。

> #### ⚠️ 升級(2026-08-05,Slice 3e):**不是一支檔的疏漏,是 token 層級的選擇**
>
> A13 原本寫「`--neutral-dark-44` 在 `src/styles/designer/` 底下只有 `AccountPage.css`
> 一支檔用到」。搬 `/creator` 時**同一個 token 又出現兩次**,axe 在 `/creator` 實測
> **3.59:1**(`#676779` 壓 `#09090b`):
>
> | 選擇器                           | 內容               | 比值   |
> | -------------------------------- | ------------------ | ------ |
> | `.community-profile__stats span` | 「Plays」「Likes」 | 3.59:1 |
> | `.community-profile__copy time`  | 每一列的日期       | 3.59:1 |
>
> **所以這不是「某一支 stylesheet 挑錯色」,而是「caption 級文字的預設階就是不到 AA」。**
> 每多搬一條用到 caption 的 route,這個數字就多出現一次 —— 換句話說,
> **修在 token 而不是修在個別檔案**,才會是一次修完。這一點請設計師一併決定。
>
> 目前處置(產品負責人 2026-08-05 拍板):**維持 verbatim,不自己挑值**,
> 兩個選擇器加進 `e2e/a11y.spec.ts` 的既有排除清單(和 A8 的 accent pill 同一個機制),
> 註解直接指回這一條。設計師給值之後,把排除拿掉就是驗收。

> **順帶記一筆給自己的教訓(不是給設計師的):** 這一支在修 G7 finding 1 時,
> 一度寫了 `badge--brand` / `badge--neutral` 兩個**根本不存在**的 modifier。
> `Badge.css` 只有 `purple / gold / processing / done / failed / hot / new / sale / popular`。
> 不存在的 class **不會報錯**,只會安靜地渲染成沒有樣式的 pill —— 正是 A2 記的那個失敗形狀。
> 已改用真的 modifier,並且該支測試會斷言 pill 的 `backgroundColor` 不是透明,
> 所以「class 名打錯」這件事現在會被測出來,而不是靠肉眼。

---

### A14. `/watch` 移轉後少了 4 個資訊區塊,以及 375px 標題被截斷

**發現於:** 2026-08-05,Slice 3d(`/watch` 移轉)。

**(a) DP 的播放器沒有這四樣,WA 移轉前有:** `# Music Video` 標籤、meta 行、
統計區塊(plays / likes / shares)、以及來源 prompt 文字。
DP 的 `.mv-player__floating` 只有標題 + 創作者 + like/share + CTA + transport。

- **這不是 spec 違規** —— 已逐條比對:`AC-EXP-04` 只要求「靜音 3:4 播放 + play/pause + mute +
  Like + Share + Create Music Video 預填 `/mv/room`」,那四樣都不在任何 AC 裡。
  所以照 DP 走是**改版**,不是靜默回歸。與 3b 的 S21 同一個判斷路徑,只是這次 spec 沒有牴觸。
- **但要讓設計師知道港口的代價:** 統計數字與 prompt 是社群頁面上唯一能看到「這支 MV 表現如何 /
  用什麼 prompt 生的」的地方,拿掉之後 `/watch` 變成純播放器。
- **需要的決定:** 這是刻意的嗎?若要保留統計 / prompt,請給一個能放它們的版位。

**(b) 375px 標題被截斷。** `.mv-player__title` 在 375px 只顯示到「Cinemat…」,
成因與 A8 同一類:`.mv-player__meta-row` 是 flex,右側 like/share/CTA 是固定寬,
壓縮的全是標題。**不擋開發**,但手機上看不到完整片名。

> **順帶一提,我方在這一支主動修掉了 DP 的一個 a11y 缺陷。** DP 的進度條是純 `<div>` +
> `onPointerDown`,沒有 role / tabIndex / 鍵盤處理 —— 就是 G7 對歌曲播放器記下的
> WCAG 2.1.1 缺陷(`TODO.md` #5)。`/watch` 改用 `src/components/ui/SeekBar.tsx`,
> 有 `role="slider"`、方向鍵 / PageUp / Home / End,並補了測試。
> **歌曲播放器可以直接改用同一支收掉 #5。**

### A15. `UpgradeDialog` 三張卡片都寫死 `/ week`,**包含 Yearly** —— 稿面文案錯誤

**發現於:** 2026-08-05,Slice 3f(Credits IAP 移轉)。

`UpgradeDialog.tsx` 的價格列是:

```tsx
{
  plan.price;
}
<span className="upgrade-dialog__price-period"> / week</span>;
```

`/ week` 是**寫死的字串**,不是從方案來的,所以 **Yearly 那張卡顯示「$59.99 / week」**。
另外 `CreditsDialog` / `UpgradeDialog` 的價格與 Business Model 至少兩處不符
(Weekly 寫 $9.99,實際 $19.99;credit pack 有兩檔對不上)。

- **不擋開發,已在 WA 側處理完畢。** 依 S20「價格以 code 為準」,WA 版每張卡片的
  週期後綴改成逐案輸出(`per` 欄位),數字全部取自 `SUBSCRIPTION_PLANS` / `CREDIT_PACKS`。
  e2e 已斷言三張卡的價格與後綴,所以這件事不會再悄悄回來。
- **仍要請設計師修上游的稿**,否則下一次 re-drop 又會帶回同一個錯字;而且
  「$59.99 / week」這種數字錯誤如果出現在給老闆看的 review 版本,是會被當真的。
- 另外兩個 dead control 一併回報:`CreditsDialog` 的 **Recover** 按鈕沒有任何 handler,
  兩個 dialog 的 **Terms of Use / Privacy Policy** 都是 `href="#"`。
  WA 版沒有搬這三個(沒有可接的行為),Restore Purchases 則用 WA 自己的實作補在 footer。

### A16. `MVStoryboardPage` 手機版把 `FloatingCTA` 的 spacer 排到**畫面最上面**

**發現於:** 2026-08-06,Slice 3h(`/mv/thinking` + `/mv/storyboard` 移轉)。

`MVStoryboardPage.css` 在 `max-width: 1023px` 把 `.mv-storyboard__panel` 與
`.mv-storyboard__side` 設成 `display: contents`,再用 `order: 1…6` 把兩欄交錯成單一序列
(Character Image → MV Song → Visual Style → Story → Story Line → Lyrics)。

`display: contents` 會把 panel 的**每一個**子元素都提升成 `.mv-storyboard` 的 flex item ——
包含 `FloatingCTA` 自己 render 的 `.floating-cta__spacer`。那個 spacer 沒有 `order`,
所以是 `order: 0`,**排在所有 order 1–6 的 section 前面**。後果有兩個,而且兩個都只在手機出現:

1. 標題列下方多出約 **84px 的空白**(spacer 在手機是 `height: 84px`)。
2. **spacer 完全失去作用。** 它存在的理由是給頁尾留出被 `position: fixed` CTA 蓋住的空間;
   跑到最上面之後,最後一個 section(LYRICS)底部沒有任何淨空,被 CTA 蓋住。

- **不擋開發。** WA 版**照搬,沒有 override** —— `designer-overrides.css` 的規矩是
  「只處理已寫進本文件、且產品負責人已裁示的缺陷」,這一條兩者都還沒有。
- **修法很小:** 上游給 `.mv-storyboard .floating-cta__spacer`(或 `.mv-storyboard__panel > *`
  的最後一個)一個 `order: 7`。只影響 `<1024px`。
- 同一支 `FloatingCTA` 在 `MVCreatePage` 沒有這個問題,因為 `.mv-create__panel`
  **不是** `display: contents`。所以這是 `display: contents` 交錯排版特有的副作用,
  不是 `FloatingCTA` 自己的 bug。
- **2026-08-06 補充:`MVEditPage` 有一模一樣的問題。** 它的 `.mv-edit__panel` /
  `.mv-edit__side` 在 `max-width: 767px` 也是 `display: contents` + `order: 1…7`,
  spacer 同樣落在最前面。所以這不是單一頁面的疏漏,是這個交錯手法本身的副作用 ——
  **上游修的時候兩頁一起修**(給 spacer 一個大於最後一個 section 的 `order`)。

### A17. `CommunityProfilePage` 在 768px 讓 stats 文字撞進右側按鈕

**發現於:** 2026-08-06,Phase 3 驗收(G5-b 六階寬度比對)。證據:`3e-creator-768.png`。

`/creator` 的每一列右側是 Like / Share / More;左側 `.community-profile__social` 是
播放數・愛心數・分享數。**分享數只要 2–3 位數,文字就會溢出去壓到 Like 按鈕上**——
截圖裡 `8`、`45`、`13` 三列都撞到,`0`、`19` 兩列沒有。

- 成因:同一列的 `.community-profile__copy > strong`(標題)有
  `overflow: hidden; text-overflow: ellipsis`,但 `.community-profile__social` **兩者都沒有**,
  也沒有 `min-width: 0`,所以它不會截斷,只會把 flex 容器撐開、擠進
  `.community-profile__actions`。
- **只發生在 768 這一階。** 1024 以上欄寬夠;767 以下是另一套手機排版。
  `@media (max-width: 1100px)` 把清單欄縮窄,是觸發條件。
- **不擋開發**,但 768 是議定的六階之一,不是邊角案例。
- **修法(上游):** 給 `.community-profile__social` 加 `overflow: hidden` + `min-width: 0`,
  或讓它在空間不足時 `flex-shrink`。WA 這邊**沒有 override** —— 照 A16 的規矩,
  `designer-overrides.css` 只收「已寫進本文件、且產品負責人已裁示」的缺陷。

### A18. 手機上「不是自己的」創作者頁**沒有任何分享入口**

**發現於:** 2026-08-06,Phase 3 驗收(G7 affordance 比對)。

`CommunityProfilePage.css:57` 在 `max-width: 767px` 把
`.community-profile__actions > .icon-button:nth-child(2)`(也就是 Share)`display: none`。
剩下的 Share 只存在於 `⋯` 選單裡,而那個選單只有**看自己的頁面時**才 render
(`ownerMenu = self && loggedIn`)。合起來:**手機 + 別人的創作者頁 = 分享不到。**

- 移轉前 Share 在永遠存在的 More 選單裡,所以這是**移轉造成的功能流失**,
  不是 DP 沒設計。
- 這是 A5 那一類的親戚:手機規則藏掉一個控制項,行為還在、affordance 沒了,
  沒有任何測試會紅。
- **需要設計判斷:** 手機上這一列要留 Share 嗎?若要,放哪裡(列上?長按?底部 sheet?)。
- WA 這邊同樣**沒有 override**,先記在這裡等裁示。

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
