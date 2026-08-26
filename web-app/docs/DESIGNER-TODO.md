# Designer TODO — 回報給設計師的清單

**這份的讀者是設計師,不是工程師。** `TODO.md` 是我們自己延後的決定;這裡只放
**只有設計師能解決**的事:缺的稿、稿裡的瑕疵、以及需要設計判斷的取捨。

每一項都標了**是否擋開發**。多數不擋 —— 我們會照現況繼續搬,搬到了再回頭補。

> 來源:`designer-prototype/`(github.com/marukox1105/YCM @ `568e64c`, 2026-08-04)。
> 每次設計師交新版後,依 `docs/archive/redesign-migration-plan.md` §7 重跑對齊流程並更新本檔。

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

### A5. 手機上 detail 畫面**沒有任何返回途徑** —— ✅ **2026-08-06 設計師已在 drop `2670ed2` 回答,WA 已接上**

> **結論先寫在最前面,因為下面整段是「當時還沒答案」的記錄,現在有了。**
>
> 設計師在 `2670ed2` 這個 drop 直接改掉成因,而不是給一個 case-by-case 的答覆:
>
> - `AppLayout.css` 的手機隱藏清單**把 `.detail-navbar` 整條拿掉了**,`.room-navbar` 則改成
>   `:not(.room-navbar--mobile-back)` —— 也就是預設仍然隱藏,但頁面可以用新的
>   `mobileBackHref` prop 選擇加入。
> - `DetailNavbar.css` 在 `<767px` 給了一條 **50px 高的 compact bar**,用 `__top` 排成
>   `28px 1fr 28px` 的 grid:左邊返回鍵、中間標題、右邊留白。新增 `mobileTitle`(桌機保留
>   「‹ Back」文字連結、手機才顯示標題)與 `hideMobileBar`(頁面自己畫了 mobile header 時抑制)。
> - `RoomNavbar.css` 用 `--mobile-back` modifier 做同一套處理。
>
> **WA 這一側已經接上(2026-08-06,DP re-sync slice):** `DetailNavbar.tsx` 加了
> `mobileTitle` / `hideMobileBar`,並**刪掉了 WA 自己那套 Tailwind 權宜控制項**(原本的
> `phoneBack` prop)—— 兩個返回鍵疊在同一個手機畫面上本身就是缺陷。`phoneBack={false}` 的兩個
> caller(`/explore/mvs`、`/explore/songs`)改成 `hideMobileBar`,行為與 drop 前完全相同。
>
> 375px 實測(production build,已先證明 238KB stylesheet 是 200):
>
> | route                             | `.detail-navbar`        | 可用返回控制項             |
> | --------------------------------- | ----------------------- | -------------------------- |
> | `/explore/songs`、`/explore/mvs`  | `none`(`hideMobileBar`) | 0 —— tab bar 可達,刻意如此 |
> | `/watch`、`/creator`、`/settings` | **375×50**              | **1**                      |
>
> **兩個沒有一起解決的,記在這裡免得被當成已完成:**
>
> 1. **DP 自己更進一步,WA 沒有跟。** DP 的 `MVDetailPage` 傳 `hideMobileBar`,改用自己的
>    `.mv-detail__mobile-header` / `.mv-player__mobile-header`(返回鍵 + 標題 + 副標)。那兩個
>    header **還沒移轉**,所以 WA 的 `/watch` 目前用 `DetailNavbar` 的 bar —— 同樣的能力,
>    先不拆。要拆的話必須先蓋好再拆,A5 第一次發生就是反過來做的。
> 2. **`RoomNavbar` 的 `mobileBackHref` 還沒接進 WA。** DP 用在 AccountPage 與 SongCreatePage。
>    不接不會少任何東西(現況本來就是隱藏),但這是這個 drop 帶來、尚未採用的能力。
>
> **A4 的 override 因此砍掉一半。** 見 `designer-overrides.css`:`.detail-navbar` 那一半必須刪,
> 因為它藏的 `__top` 正是設計師剛把返回鍵放進去的地方 —— 而同一個 drop 又刻意藏掉
> `.detail-navbar__tabs`(「not designed for mobile yet」),兩者相加讓 `/explore/songs` 在 375px
> 變成一條 **375×50、既沒 tabs 也沒返回鍵的空 bar**,而且不會有任何測試變紅。
> `.room-navbar` 那一半**保留** —— DP 的註解明講 History 沒傳 `mobileBackHref`,仍然整條隱藏,
> HIST-03 的篩選 tabs 還是靠這個 override 活著。

<details>
<summary>以下是 2026-08-05 之前的原始記錄(當時還沒有答案),保留備查</summary>

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
>
> **上面這段描述的 `phoneBack` 已於 2026-08-06 刪除** —— 「設計師給稿後把這段拿掉」就是這次做的事。
> 那三個 e2e 斷言一個字都沒改,因為它們寫的是「375px 有沒有可用的返回控制項」,不是「有沒有那顆
> Tailwind 按鈕」;實作被換掉而測試照樣通過,這正是當初寫成行為測試而非標記測試的理由。

</details>

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

### A7. ~~DP 的 transport 沒有 shuffle / repeat~~ ✅ **已結案 2026-08-19 —— 選了第 2 條路**

**發現於:** 2026-08-05,Slice 3b(`/song/play`)。

`SongDetailPage` 的 `NowPlaying` 與 `MobileNowPlaying` 兩支 transport 都只有
**prev / play / next** 三顆。WA 原本的播放器有 **shuffle + repeat**,而且那不是隨手加的:
`specs` 的 **AC-EXP-05** 明文要求 `/song/play` 要有 shuffle + repeat(EXP-04,2026-07-23 加入)。

**產品決定(2026-08-05):照 DP 刪掉,並記在這裡問設計師。** 所以現在的狀態是
**code 與 spec 不一致,而且是刻意的** —— 這正是不能只靠截圖驗收的那類損失
(見 A4:重錄視覺基準會把功能損失一起收下)。

**決定(產品負責人,2026-08-19):選 2 —— 確認取消,spec 跟上 code。**
`AC-EXP-05` 已改寫,不再要求 shuffle / repeat;`specs/areas/04-*` 的相關註記與
§1 摘要也一併更新。**S21 隨之關閉。**

- 對設計師的意義:**這兩顆按鈕不需要給稿了。**
- 對後續的意義:transport 現在是 prev / play / next 三顆,而且這是規格本身的內容,
  不再是「code 偏離 spec」的暫時狀態。日後若要五顆,那是**新需求**,不是回到舊規格。
- 原始脈絡保留在上面,因為它是 A4 那個教訓的第二個實例:**功能損失不會出現在截圖比對裡,
  只有逐條讀 `AC-*` 才找得到。**

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

- **✅ 第 1 批(`hero/`)2026-08-07 已由我們自己補上,而且是**收進 repo**的。**
  landing page 移轉需要它,產品拍板 vendor 這 13 MB(對比 `covers/` 的 257 MB),
  `PROVENANCE.md` 的排除表已改,re-sync 程序也已經加上「hero 要 copy 到兩個地方」
  (`designer-prototype/src/assets/hero/` 與 `web-app/public/assets/hero/`)。
  所以 `designer-prototype/` 現在**跑得起來,除了 `covers/` 與 `storyboard-clips/` 的媒體**。
  ⚠️ 這一條同時推翻了本文件下面「檔名含空白只剩 covers/」那句話 —— hero 裡有 4 個檔名有空白,
  WA 用 `encodeURIComponent` 在引用點處理(`home/heroItems.ts`)。
- **仍請設計師把 `storyboard-clips/` 補進 drop**(`hero/` 現在我們自己接住了,但由 upstream
  出貨仍然比較乾淨)。下一次 re-drop 如果 `hero/` 又漏而我們忘了 copy,同樣的白畫面會再來一次,
  而且一樣會被誤判成某一頁的問題。
- 重跑方式:把 `designer-prototype/` 複製到 repo 外,補齊剩下那批素材,再跑 `vite`。
  **除了 `hero/` 這個已拍板的例外之外,不要在 `designer-prototype/` 裡面補檔**,那是唯讀參考。
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

### A19. `/explore/mvs` 手機版只看得到 **14 支裡的 3 支** —— 已依 DP 拍板,但數字請設計師確認

**發現於:** 2026-08-07,drop 2(`2670ed2`)的 re-sync。

`MVDetailPage.css` 在 `max-width: 767px` 把所有 `.mv-detail__grid-section` `display: none`,
再單獨把 `--primary` 那一段放回來(`.mv-detail__mobile-grid`,兩欄 masonry)。

- **對 DP 無損:** DP 的第二段是第一段 reverse 的同一份 catalog,藏掉不會少任何東西。
- **對 WA 有損:** 我們兩段是**兩份不同的 catalog**。`TRENDING_MVS` = **3 支**,
  `NEW_MVS` = **11 支** —— 所以手機使用者只摸得到 **3 / 14**,其餘 11 支在手機上沒有任何入口。
- **產品拍板 2026-08-07:跟 DP 走**,理由是「在兩個 section 都掛 `--primary`」雖然只差一個 class,
  卻是**每次交稿都會被還原**的偏離(和 `/mv/room` 的 `Ideas` 按鈕同一類 —— `/song/create` 的兩顆 `Idea` 已於 2026-08-24 加回,不再屬於這一類)。
- ⚠️ **拍板當下的說法是「次要 catalog 被藏起來」,3 / 14 這個比例是事後量出來的。**
  記在這裡是因為它把取捨的份量整個換掉了:這不是藏掉一個補充區塊,是手機版
  Explore MV 只剩兩成內容。若設計師認為不可接受,需要的是**手機版雙 section 的設計**,
  不是我們加 override。
- 已用 `e2e/behaviour-regressions.spec.ts`(「/explore/mvs still has a grid on a phone」)
  把這個損失**寫成斷言**,免得下一個 session 當成 bug 順手「修好」。

### A20. 首頁刪掉跑馬燈之後,`TRENDING_MVS` 在首頁**沒有任何入口**

**發現於:** 2026-08-07,規劃 landing page 移轉時。
**✅ 已實作 2026-08-07**(landing page 移轉那一刀),連帶後果也已由產品負責人**當面確認**:
「TRENDING_MVS 不用首頁(Match DP)」。所以下面第二點的 ⚠️ 不再是「拍板時沒一起裁示」,
是**已經裁示過的**;但下一段那個「兩件事疊起來」的圖仍然成立,設計師該回答的問題沒有變。

WA 首頁目前有一條「Trending MV」45 秒無限跑馬燈(`TRENDING_MVS` 複製兩份);
DP 的 `HomePage` **完全沒有這個區塊**,它的三條 rail 分別吃
`NEW_MVS` / `TOP_PICKS_SONGS` / `NEW_SONGS`。

- **產品拍板 2026-08-07:跟 DP 走,刪掉跑馬燈。已刪。** `globals.css` 的 `@keyframes marquee`
  與 `.marquee-wrap` / `.marquee-animate` / `.marquee-clone` 三個 class 也一起刪掉了 ——
  唯一的使用者跟著走了,留著就只是三個到不了的 class 名。
- ⚠️ **連帶後果(已由產品負責人確認接受):** 刪掉之後 `TRENDING_MVS`(3 支)
  **在首頁再也沒有入口**,唯一入口變成 `/explore/mvs`。
- 這件事本身還過得去 —— 它在 `/explore/mvs` 正是 `--primary` 那一段,
  也就是 A19 之下手機唯一看得到的 catalog。但**兩件事疊起來**才是完整的圖:
  首頁看不到 Trending,手機的 Explore 又只看得到 Trending。
- **需要設計判斷:** 首頁要不要一條 Trending rail?若要,那是 DP 還沒畫過的區塊。
- e2e 的「landing page: clicking a Trending MV lands on the same /watch screen」是在守
  「首頁與 `/explore/mvs` 不可以走岔」這條真規則。**已改指到 `.new-mvs__item`**
  (「Trending Music Videos」那條,是還在的、會走到 `/watch` 的 rail),沒有刪掉;
  凍結跑馬燈動畫的 `addStyleTag` 跟著那條 rail 一起移除了。
- 另外新增了「landing page: the Trending marquee is gone and stays gone」——
  把**這個損失本身寫成斷言**(和 A19 同一手法),免得下次交稿或下個 session
  順手把 WA 自己的 rail 加回來。

### A21. Credits Detail 的「Buy More」少了 free user 狀態 —— 🔴 **擋開發,且已經改錯了 code**

**發現於:** 2026-08-12,spec 與 code 對齊掃描。**產品負責人已於同日裁決:spec 是對的。**

**規則(Business Model,CR-06):**

| 使用者           | Credits Detail 的 CTA                                    | 點下去                          |
| ---------------- | -------------------------------------------------------- | ------------------------------- |
| **未訂閱(free)** | **只能 Upgrade** —— 不可出現「Buy More」/「Buy Credits」 | `SubscribeModal`(Muse Pro 方案) |
| **已訂閱**       | **Buy More**                                             | `BuyCreditsModal`(點數包)       |

也就是**點數包是訂閱者專屬**,free user 在任何可以買點數的入口都只看得到 Upgrade。

**稿面缺口:** DP 沒有 auth,更沒有訂閱狀態,所以 `CreditsPage.tsx` 的
`<Button variant="PrimaryPayg">Buy More</Button>` 是**無條件**的 —— free user 的那一版
從來沒被畫過。同樣的缺口也在 `CreditsDialog`(DP 的買點數 dialog)。

**需要設計師提供:**

1. Credits Detail(Figma 636:11875)**free user 版**的 CTA —— 文案與樣式。WA 目前暫用
   「Get Muse Pro」,但那是工程補的,不是設計決定的。
2. 這顆 CTA 在 free 狀態要不要換 variant?現在是 `PrimaryPayg`(帶點數叢集的付費樣式),
   導向訂閱時語意上未必合適。
3. 順帶確認:餘額不足時從創作流程彈出的購買入口,free user 是否走同一條規則
   (目前 spec 的 CR-E4/CR-E5 說是)。

**⚠️ 這一項跟其他 A 項不同 —— code 已經被改成錯的,要改回來。**
`d329719`(2026-08-11)的 `BuyCreditsModal.tsx:56` 宣告
`── CR-06 REVERSED (designer decision, 2026-08-11) ──`,把 `subscribed` gate 整個拿掉,
`CreditsView` 的 CTA 也跟著變成無條件「Buy More」。**CR-06 出自 Business Model,不是稿面
可以推翻的範圍。** 依裁決要復原:

- `BuyCreditsModal.tsx` —— 恢復 `if (!subscribed) return <SubscribeModal … />` 的 gate
- `CreditsView.tsx` —— CTA 恢復依 `subscribed` 分支
- 兩處都要回歸測試(free / subscribed 兩種狀態)

登記為 `specs/areas/07` 的 **TBD-CR-10**,`specs/OPEN-QUESTIONS.md` 亦有。
**這是 spec 從頭到尾都寫對、code 走偏的案例** —— 所以 spec 沒有被改成配合 code。

### A22. MV 角色照的「生物特徵同意」彈窗 —— **完全沒有稿,目前由我們代畫**

**新增於:** 2026-08-19,產品負責人指定。**不擋開發(已上線),但每次交稿都會重新變成問題。**

`/mv/room` 上傳角色照時,第一次點擊要先跳一個生物特徵資料處理同意彈窗,勾選後才會打開
檔案選擇器。這是法遵需求,不是視覺需求 —— 所以它**先做了**,沒有等稿。

- **來源是 YouCam Online Editor 的線上彈窗截圖**,不是 DP。DP 裡沒有任何對應元件。
- 我們的實作走 DP 既有的 `DpDialog` 外殼(overlay / fade / `inert` / Escape 全部一致),
  樣式寫在 `web-app/src/styles/consent-dialog.css`,顏色圓角字級**全部取自 `tokens.css`**,
  所以它看起來屬於同一套系統。但它**不在 `src/styles/designer/`**,因為那裡每個檔案都必須
  跟 DP byte-identical。

**為什麼還是要請設計師處理:**

1. **它永遠不會出現在 Figma 裡。** 下一次交稿不會覆蓋它(它不在 gated 檔案集內),但也
   永遠不會被更新 —— 它會長期是 WA 單獨維護的一支 UI,和設計系統各走各的。這正是 A15
   / S20 那類「稿與碼各說各話」的起點。
2. **版式是我們照截圖抓的,不是設計決定。** 卡片 420px、24px padding、標題置中兩行、
   長文在 320px 由內文區自行捲動而 CONTINUE 固定在底部 —— 這些都是可用的,但沒有人
   從設計角度看過。
3. **未勾選時 CONTINUE 是 disabled 態**(產品負責人拍板:文案寫「勾選此框構成明示書面
   同意」,不勾也能按的話那句話就不成立)。截圖裡的按鈕看起來是可按的,所以這一點
   **我們刻意和截圖不同**,請確認。

**文案已依 YCM 調整過四處**(產品負責人 2026-08-19 逐條確認),請一併看過:

| 原文(Online Editor)                                        | YCM 版                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `your uploaded photo/video`                                   | `your uploaded photo`(角色照只吃 `image/*`)             |
| `AI editing and generative AI experience`                     | `AI music video generation experience`                    |
| `Any outcome of the Service will be stored ... up to 365 days` | **整句刪除**(YCM 的產出會一直留著,承諾 365 天是假的)   |
| `...would be transmitted to any third parties...`             | 句尾加 `unless you choose to publish your creation to the community.` |

> 最後一列是**和既有產品規則的實際衝突**,不是潤稿:原句承諾「產出不會給第三方」,
> 但 `PublishConfirmDialog` 寫的是「發布後會出現在社群,並可能被分享到我們的社群頻道」。
> 兩份文件本來會互相打臉,加但書是產品負責人選的解法。

**需要設計師給的:** 這個彈窗的正式稿(含未勾選 / 已勾選 / 320px 捲動三態),
以及它要不要進 DP 的共用 dialog 家族。**Sample Photos 不跳這個彈窗**(內建範例臉不是
使用者的臉),這個不對稱也請一併確認是否要在視覺上表達出來。

---

### A23. ~~`/song/result` 沒有「這首歌沒有歌詞」的 UI —— 整個右半邊會變成空白~~ ✅ **2026-08-20 結案 —— 空狀態已上線,完全比照設計稿**

**新增於:** 2026-08-19。

2026-08-11 設計師要求:剛生成、比對不到目錄的歌,`.song-result__lyrics-inline`(426px 的側欄)
只有一行佔位會顯得很空,所以請我們放一段**通用假歌詞**當墊底。

**產品負責人 2026-08-19 決定拿掉它**,理由是:Simple 模式產生的歌**本來就沒有歌詞**,
於是畫面把一段陌生的詞當成使用者自己的作品呈現;而規格 `AC-SONG-06` 與 `SONG-P3-S2`
兩處都寫明歌詞面板**只在有歌詞時出現**。所以那之後一段時間:Lyrics 按鈕不渲染、
側欄歌詞區不渲染、歌詞 sheet 也打不開 —— 這才是這張票真正要修的洞(見下方截圖對照)。

**更新 2026-08-20(a):** History 的 sample 歌曲一度補上歌詞資料(`lyricsForTitle()`),
但隨即決定保留 `h-whispers-past` 為**刻意沒有歌詞**的樣本(見 `community.ts` 註解),
確保這個狀態除了 `sp-*` 社群歌曲外,也能從使用者自己的作品路徑重現。

**更新 2026-08-20(b)——結案:** 空狀態已實作並比對 Figma 確認,**只改側欄本身**:

- 依 Figma **"Song Result_no Lyrics_L"**(node `2695:116795`,其 "Text" 子節點
  `2695:116838`)還原:`ic_song` icon(54×54)+「No lyrics available for this one yet」,
  文字樣式與 `.song-result__lyrics-inline-line`(滿 opacity)相同。
- **只有** `.song-result__lyrics-inline` 這塊改成「一律渲染,依有無歌詞切換內容」——
  Lyrics 按鈕與歌詞 sheet **維持原規則不變**,沒有歌詞時仍然不渲染 / 打不開,
  `AC-SONG-06`(b) / `SONG-P3-S2` 因此完全沒有被打破。
- `sp-synth-wave` 不再是「刻意留著重現 bug」的參考網址,e2e 測項改成反向斷言
  (空狀態必須渲染、side-panel 恢復兩個子元素),避免將來又悄悄退回空白。

## 🔗 直接打開來看(不用跑任何指令,貼上網址即可)

| 狀態 | 網址 | 說明 |
| --- | --- | --- |
| ✅ 沒有歌詞(空狀態) | **`/song/result?id=sp-synth-wave`** | 可直接貼網址開啟。右半邊是 `ic_song` icon + 「No lyrics available for this one yet」,CTA 位置不變。 |
| ✅ 有歌詞(對照組) | `/song/result?id=sp-pop-anthem` | 同一個元件,右半邊是歌詞欄,CTA 錨在歌詞下方。 |
| ✅ 沒有歌詞・**自己的作品**(真實情境) | `/history` → 點 **「Whispers of the Past」** | 使用者自己的創作路徑,同一套空狀態。這一筆**刻意保留沒有歌詞**,見 `community.ts` 的註解。 |

> ⚠️ `h-*` 開頭的 History id **不能直接貼網址開啟** —— 那條路徑需要 in-memory flow state,
> 冷開會被導走。所以上表第三列請從 `/history` 點進去。第一列的 `sp-*` 社群歌曲則可以直接開。

**截圖對照:** [`designer-refs/song-result-nolyrics-1440.png`](designer-refs/song-result-nolyrics-1440.png)
· [`designer-refs/song-result-haslyrics-1440.png`](designer-refs/song-result-haslyrics-1440.png)

## 曾經實際發生什麼事(2026-08-19 ~ 2026-08-20 結案前)

不是「歌詞區留白」,是**整塊不渲染**:

- `.song-result__lyrics-inline`(426px 的歌詞欄)—— **不渲染**
- Lyrics 按鈕(控制列上的麥克風 icon)—— **不渲染**
- 歌詞 sheet —— 打不開
- 結果:`.song-result__side-panel` 的子元素從 2 個掉到 1 個,**CTA 直接往上跳到卡片頂端**,
  播放器右半邊約一半的面積是死空間。

**這不是空狀態,是一個洞。** 我們之所以會走到這裡,是因為 2026-08-11 設計師要求用一段
通用假歌詞把版面填滿,而產品負責人 2026-08-19 判定那是 bug(把陌生的詞當成使用者自己的作品呈現)
並要求移除。移除是對的,但那之後**一度沒有任何東西頂替**。

~~**需要設計師給的:**~~ **不需要了。** 2026-08-20 已依 Figma "Song Result_no Lyrics_L"
(node `2695:116795`)實作並比對確認 —— 見上方「結案」段落。`.song-result__lyrics-inline`
現在一律渲染,`.song-result__side-panel` 也恢復兩個子元素;Lyrics 按鈕與 sheet 的
「只在有歌詞時出現」規則完全沒動。

### A24. `ModeModal` 的兩個點數不再是固定值 —— 稿面的「20 / 200」現在幾乎永遠是錯的

**新增於:** 2026-08-19。**不擋開發。**

規格 `11-credit-consumption` §3.2/§3.3 把 MV 的價格改成**依歌曲長度、MV 類型與畫質計算**:

- Create Storyboard First = 依歌長分三階 **12 / 15 / 18**
- Create MV Directly = **45 + 每秒 N 點**(N 依 MV 類型 × 720p/1080p,例如 30 秒 singing/High = **225**)

程式已照規格改,所以同一個對話框對 30 秒和 60 秒的歌會顯示**不同數字**。
DP 的 `MVCreatePage` 稿上寫死的 **20 / 200** 因此在幾乎任何長度下都不成立。

**需要設計師確認的:**

1. 這兩張卡的點數欄位請當成**動態數字**處理(位數會從兩位到四位,版面要撐得住)。
2. 要不要一併顯示計算方式(例如「45 + 6/秒 × 30 秒」)?目前**沒有**顯示,因為稿上沒有這個位置。
   使用者現在只看得到結果數字,看不出為什麼修短歌曲會變便宜。
3. `/mv/edit` 的 Recreate 與 Merge 也一樣:Recreate 依 shot 長度與類型變動,Merge 從 200 改成**固定 10**。

---

### A25. ~~`/mv/edit` 的頁首少了「N shots」與三個唯讀 chips~~ ✅ **2026-08-20 結案 —— 規格錯了,不是畫面錯了**

**新增於:** 2026-08-19(規格盤點)。**不擋開發,但這一項我們補不了。**

規格 `02-mv-creation` 的 **MV-P5-S1** 要求 `/mv/edit` 頁首顯示:

1. **「N shots」** 的鏡頭數
2. **type / song / ratio 三個唯讀 chips**
3. 說明文案 **「Style & song are locked after creation」**

三者在 `MvEditor.tsx` 與 `MVEditPage.css` 全文搜尋皆不存在。**關鍵是第二點:
`MVEditPage.css` 裡沒有任何 shots / chip / locked 相關的 class**,所以要做只有三條路,
每一條都違反一個既有規則:

- 自己發明 class —— 遷移過的畫面樣式必須來自 `src/styles/designer/`(Gate G3-d)
- 借用別的畫面的 class —— 可行但那是視覺決定,不是工程決定
- 寫進 `designer-overrides.css` —— 那個檔案只收「已經寫明的缺陷 + 已經拍板的值」

~~**需要設計師給的:**~~ **不需要了。** 產品負責人 2026-08-20 指示以 DP 為準,而 DP 的
`MVEditPage.tsx:404` 頁首就只有 `<DetailNavbar title="Edit Music Video" credits={…} backHref={…} />` ——
**三個元素 DP 一個都沒有**。規格描述的是遷移前的 WA 畫面,已從 `MV-P5-S1` 移除。
本則不需要任何稿。

> 這一則和 A24 是同一個成因的兩面:規格描述的是**遷移前**的 WA 畫面,DP 的稿沒有這些元素。
> 差別在 A24 是「DP 有但數字會變」,這一則是「DP 根本沒畫」。

---

### A26. `/watch` 缺【9:16 ↔ 3:4 切換】與【上滑看下一支】—— **V1 要做,等稿**

**新增於:** 2026-08-19(規格盤點,產品負責人決定留在 V1)。

手機 app 的 MV 播放器有兩個互動,web 目前**兩個都沒有**(`TBD-EXP-03`):

1. **9:16 ↔ 3:4 比例切換** —— 讓觀看者自己決定要滿版還是完整構圖
2. **上滑看下一支 MV** —— app 的 feed 式瀏覽

**需要設計師回答的,不只是「畫出來」:**

- **切換控制項放哪、長什麼樣?** `/watch` 目前的控制列是 play/pause + mute,沒有第三個位置。
- **「上滑」在桌機是什麼?** 這是本題的重點。上滑是手機原生手勢,桌機沒有對應動作 ——
  是滾輪?是上下箭頭鍵?還是畫面邊緣的 Prev/Next 按鈕?**三者的版面需求完全不同。**
  在這題有答案之前,這個功能在桌機上無法實作。
- **切換後的舞台尺寸怎麼算?** 目前舞台依內容的 cover ratio 決定(3:4 或 4:3,見 `AC-EXP-04`),
  加上使用者可切換之後,兩者的優先順序要定。

> 這一則和 A24/A25 不同:那兩則是「規格描述遷移前的畫面」,這一則是**產品確定要做、但 web 的
> 互動形式從來沒有被設計過**。手機稿直接搬不過來。

---

### A27. 手機版 `/watch` 疊了兩個 header,且訪客會看到 Login —— **產品負責人指定由設計師重出圖**

**新增於:** 2026-08-20(產品負責人回報,附截圖)。**不擋開發,但畫面目前是壞的。**

手機上 `/watch` 同時渲染了**兩層頁首**:全站的 `MobileHeader`(「YouCam Muse」+ 皇冠 + 帳號)
加上 `DetailNavbar` 的手機返回列(返回箭頭 + **Login**)。

**成因已經查清楚,而且不是缺稿:**

- DP 的 `MVDetailPage` 對這個畫面 **同時關掉兩者** —— `showMobileHeader={false}` 與
  `hideMobileBar`(`MVDetailPage.tsx:485`),改用它自己的頁內 header
  `.mv-player__mobile-header`(返回 + 標題/meta + 對稱空位,`MVDetailPage.tsx:117-126`)。
- **那支 CSS 已經在我們的 gated 樣式表裡**(`designer/MVDetailPage.css:20,489`),只有 markup 沒 port。
  WA 因此保留 `DetailNavbar` 的通用列當替代品 —— 這個取捨本身是有記錄的(`TODO.md` 7i),
  當時的理由是「在替代品做出來之前不要先拿掉返回鍵」(A5 的教訓)。
- 訪客看到的 **Login 是 DP 自己的設計**(`DetailNavbar.tsx:67`),不是 WA 加的。

**產品負責人決定(2026-08-20):這一頁的手機版由設計師重出圖,程式碼先保留現狀不動。**
所以這裡不採用「照 DP port 過去」的做法。

**需要設計師回答的:**

1. 手機 `/watch` 的頁首要長什麼樣?是 DP 的頁內 header(返回 + 標題 + meta),還是別的?
2. **未登入的訪客在這一頁要不要有登入入口?** DP 的頁內 header 沒有 —— 照搬的話,
   手機訪客在這頁完全無法登入,只能先退回上一頁。這是需要決定的,不是實作細節。
3. 全站 `MobileHeader` 在這一頁要不要保留?DP 是關掉的。

> 這一則和 A26 是同一頁的兩件事:A26 是**功能**(比例切換、上滑),這一則是**版面**。
> 建議一起出。

---

### A28. `/song/create` Custom 的 Enhance 兩模式選單 —— **功能已上線,但視覺是我們代畫的**

**新增於:** 2026-08-25(產品負責人指出)。**不擋開發。**

Custom tab 按下 **Enhance** 會開一個小選單,標題「What would you like to enhance?」,兩個選項:

| 選項 | 副標 | API `kind` |
| --- | --- | --- |
| **Refine Idea** | Sharpen the mood, tone, and detail | `song` |
| **Refine Lyrics** | Polish wording, rhythm, and flow | `lyrics` |

引擎有兩種 refine 模式,所以**兩個選項各自對應一支 API,由 RD 負責**。前端只負責挑 `kind`。

**兩件事要一起知道:**

1. **這個選單在 DP 皮膚下曾經完全打不開。** `EnhanceButton` 的 `bem` 分支只回傳按鈕,
   而點擊處理器設的是一個沒有人渲染的 state —— 所以 Custom tab 的 Enhance **是一顆死按鈕**,
   點下去毫無反應。兩個模式、文案、`kind` 區分一直都在程式碼裡,只有渲染在遷移時掉了。
   **2026-08-25 已接回來**,並有 e2e 守著。
2. **但 DP 沒有這個選單**,所以現在的視覺是 WA 自撰:一個 `w-60` 的圓角浮層,深色底 + 邊框,
   標題列 + 兩個兩行選項。可用,但沒有人從設計角度看過。

**需要設計師給的:** 這個選單的正式稿。特別是:

- 它應該是**貼著按鈕的浮層**(現在的做法),還是**置中的 dialog**?兩者在手機上差很多。
- 兩個選項的 icon —— 目前**沒有 icon**,只有文字。
- 手機版的行為:目前浮層寬 240px 靠右對齊,在 375px 下貼著邊。

> 這一則和 A22(生物特徵同意彈窗)是同一類:**功能先於設計上線的浮層**。差別在 A22 是法遵需求
> 不得不先做,這一則是**原本就有、遷移時弄丟又補回來的**。

---

## B. 還沒有設計稿的畫面(擋該畫面,不擋其他)

| 畫面                           | 狀況                                                                                                                                                        | 影響                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **`/mv/creating`**             | ⚠️ **DP 完全沒有 MV render 的進度畫面。** `MVResultPage` 只有結果態。Song 與 Storyboard 都有 processing stage,唯獨 MV render 沒有                           | 該 route 無法移轉,維持現行 UI                     |
| ~~**`/share`、`/share/mv/[id]`**~~ | ✅ **2026-08-19 更正:這一列是錯的。** `ShareLinkView.tsx` 是 118 行的完整落地頁(logo header／影音播放／Download／過期態),`/share/mv/[id]` 是可用的 server redirect。稿仍未經設計師審過,但「沒有落地頁」不成立                                                                                                                      | 同上                                              |
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
- **檔名含空白**:~~這一版只剩 8 個,全部在 `covers/`(demo 媒體,我們沒有收進 repo)。~~
  **2026-08-07 更正:`hero/` 收進 repo 之後,有 4 個含空白的檔名進到 `web-app/public/`**
  (`hero_01_Vintage Car.png` 等)。原始碼裡一律用 `encodeURIComponent`
  (`home/heroItems.ts`),和 `community.ts` 的 `AUDIO` 陣列同一套做法 ——
  raw space 的路徑根本組不成合法請求,而且**失敗是靜默的**(video/img 不會丟錯,只會空著)。
  slugify script 仍然不需要,但「只剩 covers/」這句話已經不對了。
- **`sessionStorage` 登入**:我們維持 `localStorage`,DP 的 `AuthProvider` 整支不搬。
- **`<a href>` 整頁導航**:我們一律改成 `next/link` + locale 前綴,否則非英文語系會壞。
