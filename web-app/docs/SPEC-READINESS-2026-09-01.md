# Spec 完備度盤點 — 還缺什麼(2026-09-01,**第二版**)

> **第一版錯了兩處,而且是同一種錯:我讀了 2026-08-27 的 handover,沒有讀程式碼。**
> `AGENTS.md` 的規則寫得很清楚 —— 文件與程式碼衝突時 **CODE WINS** —— 第一版沒有遵守。
> 兩處都是產品負責人 2026-09-01 review 時抓出來的:
>
> | 第一版說                                      | 實際情況(已實測)                                                                          |
> | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
> | 七個空狀態「還沒有任何畫面在讀 flag」         | **全部七個都已接好,`DEMO_FLAGS` 九項全是 `live`**,`?demo=1` 直接可截圖                    |
> | `/mv/creating`「DP 沒有稿,該 route 無法移轉」 | 稿是沒有,但**畫面一直都在**(共用 `GenerationView`),87% / Encoding video / View Later 都在 |
>
> 這一版的每一條都經過**瀏覽器實測**,不是讀文件。下面標 ✅ 的都是量過的。

---

## 0. 一頁摘要 — 本次結案 18 項,剩 5 項

| 節  | 類別                             | 項目 | 誰能解 |
| --- | -------------------------------- | ---- | ------ |
| 1   | ✅ **本次結案**                  | 18   | —      |
| 2   | 🔵 **RD 契約缺**(不擋 spec 寫作) | 3    | RD     |
| 3   | ⚪ **Won't fix / 等 RD 補**      | 2    | —      |

**結論反轉:** 第一版說「第 1 節的六項會讓 storyboard spec 停在原地」。**現在一項都不擋。**
S5 / S8 / S9 都可以做;唯一仍然停擺的是 **S10**,卡在 `TBD-CC-06`(扣點欄位契約),那是 RD 的題。

---

## 1. ✅ 本次結案(2026-09-01,產品負責人裁示 + 實測)

### 1.1 七個空狀態 / 錯誤狀態 —— A30 ✅ **可截圖,寫進 spec**

產品負責人:「七個畫面只有字串換成其他的字串,畫面完全一樣,不需要出 7 個稿。」

**實測結果:七個 flag 全部已接上 UI,`DEMO_FLAGS` 九項的 `status` 全是 `live`。** 第一版說的
`awaiting-design` 是 2026-08-27 handover 的舊狀態,後來的 session 已經做完並翻成 `live`。
`/history?demo=1` + `historyEmpty` 實測畫面:

> **Your creations will appear here**
> Start making AI music or music videos and they'll all show up in one place.
> `[ Start Creating ]`

消費 flag 的元件(全部已驗證存在):`HistoryView`(`historyEmpty` / `historyLoading`)·
`ChooseSongModal`(`mySongsEmpty`)· `CreditsView`(`creditsEmpty`)· `CreatorProfile`
(`profileEmpty`)· `MvResult`(`publishRejected`)· `SubscribeModal` / `BuyCreditsModal`
(`apiError`)· `SettingsView`(`subOnApp`)。

→ **不需要設計稿,不需要 15 張 artboard。** 七個狀態直接寫進各自的 area spec,S5/S8 順帶截圖。

### 1.2 `/watch` 的【9:16 ↔ 3:4 切換】與【上滑看下一支】✅ **兩半結論相反**

產品負責人 2026-09-01 原本要求兩個都刪。實際讀程式碼後發現這兩半狀況完全不同,攤開後**當日再裁示**:

| 功能                 | 結論                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **9:16 ↔ 3:4 切換**  | ✅ **確定不做。** 本來就沒有 —— 比例一直依 `mvCoverRatio()` 逐項自動決定,沒有可操作的切換控制項。已從 spec 移除 |
| **上滑看下一支**     | ✅ **留著。** 它**早就做好了**,而且是產品負責人自己要求的                                                |

**上滑那一半的證據**(`src/components/community/CommunityMvPlayer.tsx`):約 150 行 ——
`SWIPE_THRESHOLD_RATIO` / `SWIPE_TRANSITION` / `SWIPE_COMMIT_MS`、`.mv-player__stage` 上的
pointer 拖曳、**三格輪替的影片緩衝**、`router.replace()` 同步網址,**不分寬度**。檔頭註解記了
三次迭代(2026-08-20 / 08-21),每次都掛名產品負責人,其中一次還附上
`code-snippets/mv-drag-preview.snippet.html` 當參考。

**為什麼會差點被誤刪 —— 這一段值得記住:**

1. `DESIGNER-TODO` **A26 說「web 兩個都沒有」是過期的**,只有前半正確。
2. 產品負責人是**在以為它不存在的前提下**說「不支援,拿掉」—— 那是要移除一個他以為不存在的
   東西,不是要砍掉能動的程式碼。
3. **它有零測試覆蓋**,所以刪掉不會有任何 gate 變紅。
4. 我這份文件前兩版都照抄 A26,**同一個錯犯了兩次**(引用 register 而沒讀程式碼)。

→ **已補上 e2e**(`2026-09-01: /watch swipes vertically to the next MV and syncs the URL`),
雙向 mutation 測過:拿掉 `onPointerDown` 會紅,裝回去會綠。A26 與 `TBD-EXP-03` 都已更正結案。
`src/` 沒有刪掉任何東西。

### 1.3 Profile 頭像上傳 + 裁切 ✅ **已實作**

產品負責人指定:沿用 `/mv/room` 的 **Select a Face** dialog,方形裁切框改**圓形**,文案換掉。
已完成並實測:

| 項目   | 值                                                 |
| ------ | -------------------------------------------------- |
| Title  | Edit Profile Picture                               |
| 說明   | Move and scale the box to select your avatar area. |
| CTA    | Set as Profile Picture                             |
| 裁切框 | `border-radius: 50%`,實測 192×192(正圓,不是橢圓)   |

作法是給 `FacePickerModal` 一個 `variant="avatar"`,**共用同一套拖曳 / 縮放 / canvas 裁切**,
不是第二份實作。`Change Photo` 從「循環 6 張範例圖」的 mock 換成真的 `<input type="file">`
(image/\*,10MB 上限,超過跳 toast)。裁切結果進 `avatarDraft`,由既有的 **Save** 提交,
Cancel 一樣丟棄。🔒 沒有真的上傳到任何地方 —— 後端要把 data URL 換成上傳 + 網址。

> 🐞 **順手修掉一個既有的 bug,而且它比頭像本身嚴重。**
> `boxRatio`(2026-08-14 加的裁切框長寬修正)**從上線那天起就沒有生效過**:圖片載入前 CSS 的
> min/max clamp 讓預覽框是正方形,`measureBox()` 量到 `boxRatio = 1`;圖片載入後框變成 384×288,
> 但 ResizeObserver 沒有再觸發。實測 probe:框已經是 384×288,`boxRatio` 還停在 `1.0000001`。
>
> **後果不是美觀問題:** 畫面上的框是「兩軸各 `crop.size`%」(4:3 圖上是 192×144),而
> `cropToDataUrl` 一直都是裁**正方形** `s × s`。**使用者框的區域從來不是他拿到的區域** ——
> `/mv/room` 的 Select a Face 也一樣,只是方形框看不太出來,圓形框一畫就變成明顯的橢圓才被發現。
> 修法:`<img onLoad={measureBox}>` —— 少的就是這個觸發點。實測修好後 192×192。

### 1.4 `/mv/creating` 的 MV render 進度畫面 ✅ **畫面一直都在**

產品負責人附截圖指正。`RenderGenerationScreen` 走共用的 `GenerationView`:百分比、
「Encoding video…」階段字、進度條、Estimated time remaining ~2 minutes、**View Later**。
第一版把「DP 沒有出這張稿」寫成「沒有畫面」—— 兩件事。→ 補進 area 02 spec,可截圖。

### 1.5 / 1.6 email 相關 ✅ **md 即 spec,不需要畫面**

產品負責人:「storyboard spec 都不用畫面,或是直接用 md 當成 spec 即可。」
→ `specs/areas/12-notifications-email.md` **就是** email 的 spec,S11 不另外做截圖版。
1.5(深連結無法冷開)與 1.6(社群登入不收 email)兩個技術問題**仍然成立**,但它們是
**RD 的實作題**,不是 spec 寫不出來 —— 已記在 area 12 的 `TBD-MAIL-01` / `TBD-MAIL-04`。

### 2.1 Footer Contact ✅ **改為需要登入**

產品負責人:「Contact 要登入才能 send feedback,沒有登入會跳 login dialog。」
已改並實測:登出點 Contact → **Sign in to YouCam Muse** dialog;登入後點 → Send Feedback 表單。
→ 順帶解決第一版記的 `TBD-SHELL-01`(訪客看到假 email `scott_wu@mail.com` 預填)——
擋在登入後面就不會發生了,**該 TBD 直接關掉**。
FAQ / Terms of Service / Privacy Policy 三條**仍是 `href="#"`**,等網址(A29,見第 3 節)。

### 2.2 手機版 `/watch` 疊兩個 header ✅ **已修,實測確認**

375px 實測,**登入與訪客兩種狀態都測過**:只有一個可見頁首 `.mv-player__mobile-header`(70px);
`.detail-navbar` 存在但 `display:none`;沒有 `.mobile-header`;**可見的 Login 控制項 0 個**。
→ A27 結案。

### 2.3 `/song/create` Custom 的 Enhance 選單(手機版)✅ **與桌機相同**

375px 實測:同一個 `.enhance-dialog`,標題 **What would you like to enhance?**,兩個選項
**Refine Idea** / **Refine Lyrics** 文案完全一致。`.enhance-dialog` 沒有任何 media query,
所以「手機版同桌機版」是**由結構保證**的,不是巧合。→ A28 結案。

### 2.4 Credits Detail 的 free user 狀態 ✅ **有畫面**

產品負責人:一註冊就送 10 credits,所以一定有記錄,不會是空的。
→ free user 的 CTA 是 **Get Muse Pro**(subscriber 是 Buy More),這個分支已實作且可截圖。
`creditsEmpty` demo flag 涵蓋「真的空」的極端狀況。S5 會拍到。

### 2.5 MV 角色照的「生物特徵同意」彈窗 ✅ **我們畫的即定案**

產品負責人:「目前我們畫的就是結案,請直接用。」→ `FaceConsentDialog` 現況即規格,A22 結案。

### 2.6 ±15s 快轉 / 倒轉圖示 ✅ **刪除,沒有這個功能**

產品負責人:「我記得很久以前就從 spec 拿掉了,目前沒有這個功能,請刪除。」
→ `TODO.md` #7a 整條刪除,area 03/04 若有殘留敘述一併移除。**不再是等素材,是不做。**

### 2.7 `/creator` 768px 破版 ✅ **已修,實測確認**

768px 實測:stats 區塊 `left 272 → right 592`,右側最近的控制項(tabs)從 `left 624` 開始,
**沒有重疊**;`scrollWidth 753 ≤ 768`,**沒有水平溢出**。→ A17 結案。

### 2.8 手機上別人的創作者頁沒有分享入口 ✅ **已修,實測確認**

375px 的 `/creator`(非 `?self=1`)實測:**3 個可見的 Share 按鈕**,每個 28×28
(過 WCAG 2.5.8 的 24×24 門檻),無水平溢出。→ A18 結案。

### 2.9 MV 音訊 30 秒下限 ✅ **一半是對的,另一半本次補上**

| 情境                     | 第一版說法 | 實測                                                                     |
| ------------------------ | ---------- | ------------------------------------------------------------------------ |
| Trim 拉太短              | 有紅字     | ✅ 正確 —— `· minimum 30s`,`--color-action-danger`,Confirm 同時 disabled |
| 上傳一首**不到 30 秒**的 | 會跳 toast | ❌ **原本沒有。** `importAudio` 只擋格式與 50MB,短檔直接放行             |

而且原本的行為是**死路**:20 秒的檔案進到 Trim,紅字寫著「minimum 30s」,Confirm 永遠 disabled,
**而 20 秒的軌是不可能被 trim 到 30 秒的** —— 使用者除了關掉沒有別條路。
→ 依產品負責人裁示,已在 `importAudio` 加上長度檢查,短檔在**上傳當下**就用 toast 擋掉
(`Audio must be at least 30 seconds.`),和既有的格式 / 大小 toast 同一套。
30 這個數字改為從 `TrimAudioModal` **export 同一個 `MIN_TRIM_SEC`**,兩處不會再各寫各的。
→ D-S2 結案,兩條規則都寫進 area 02。

### 3.3 Restore Purchases ✅ **全站已經沒有了**

產品負責人:「website 不支援,只有 app 有,如果有檢查出哪裡有請跟我說,要拿掉。」
→ **`src/` 與 `e2e/` 全文檢索:0 個。** 2026-09-01 已被 Terms of Use / Privacy Policy 連結取代。
不需要再拿掉任何東西。`TBD-CR-08` 已結案(moot)。

### 3.4 折扣呈現 ✅ **spec 只寫 UI**

產品負責人:「spec 只要列出 UI 就好,實際折扣等不用寫在 spec 內(隨時會改)。」
→ spec 描述**元件**(刪除線原價、`N% OFF` 徽章、CTA 上的折後價),不寫死 `CREDIT_SALE_PCT = 20`
或任何具體數字。`TBD-CR-07` 收斂成「數值由後端 / 行銷決定」。

### 3.6 `/explore/mvs` 手機只看得到 3 支 ✅ **不是規則,是 fixture**

產品負責人:「DP 只是示範,實際看後端拿到幾隻影片就顯示幾隻。」
→ spec 寫「顯示後端回傳的全部項目」,不寫 3/14。A19 結案 —— 那個比例是 mock 種子的產物。

### 1.7 `/song/create` 的 GENRE / MOOD 預設值 ✅ **改成一開始就空白**

產品負責人第二次裁示,推翻同日第一次的判斷。原本保留 `Pop` / `Uplifting` 當「起始值」,
理由是 `SongResultView` 的 `genre · mood` 行需要有值才顯示。**這個理由不成立** ——
「保住結果頁的一行字」不足以讓使用者去取消一個他從沒選過的 genre。
→ `DEFAULT_SONG_COMPOSE` 的 `genre` / `mood` 改為 `""`,實測三欄開場皆未選取。
結果頁那一行用 `visibility: hidden`(不是 `display: none`)隱藏,版面高度不變。
兩個 e2e 斷言同步改寫:一個改為斷言「沒選就不顯示」,另一個**先選 chip 再斷言**,
所以 A14 的守門並沒有被拿掉,反而變成同時守住新規則。

---

## 2. 🔵 RD 契約缺(不擋 spec 寫作,擋 RD 實作)

| #   | 缺什麼                                   | 為什麼擋住 RD                                                                                                                            | 出處                                     |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 2.1 | **整條 Explore / Community 的 API 契約** | `MuseApi` **完全沒有** community endpoint(feed / detail / like / share / publish / creator)。17 個元件、跨 9 條 route 目前跑在寫死種子上 | `TBD-GL-05` / `TBD-EXP-01`               |
| 2.2 | **扣點 payload 的欄位契約**              | `consumedType` 全改為 `"credit"` 後,前端須自行帶數量／秒數。欄位名、單位、委派型 action 對應哪個 sub action —— 全未定                    | `TBD-CC-06`                              |
| 2.3 | **email 的寄送實作**                     | 四封由 RD 實作、Marcom 供文案,**9/9 ready**。第五封(訂閱認證信)由金流商寄:**美國 Stripe,其他 2Checkout**                                 | `docs/RD-REQUEST-NOTIFICATION-EMAILS.md` |

> ⚠️ `TBD-CC-06` 是 **S10 唯一**的阻礙 —— 那份 spec 是契約形狀不是旅程形狀,契約沒定就沒東西可寫。
> 依產品負責人指示,第 4 類「spec 可以先忽略或寫 TBD」—— S10 維持 ⏸。

---

## 3. ⚪ Won't fix / 等 RD 補

| #   | 項目                         | 裁示                                                                                                            |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 3.1 | **Accent pill 對比度不足**   | **Won't fix**(產品負責人)。`e2e/a11y.spec.ts` 維持用 selector 排除;`TODO.md` #2 標為不修,不再列為缺口。         |
| 3.2 | **Send Feedback 打哪個端點** | Muse 與 YCO 的 CSB **不是同一套 API**,**等 RD 補**。四個 `questionTypeId`、`prodVerId 504` 在那之前都是暫定值。 |

> 另有 **web 的 store SKU**(`TBD-CR-11`):Final Pricing 只給價格沒給 store identifier,
> 程式碼仍帶 app 形狀的 SKU。歸在「等 RD 補」,不擋 spec。

---

## 4. Storyboard spec 隊列 — 現在只剩 S10 擋住

> _更新 2026-09-01(同日稍晚):S8 與 S9 已完成,隊列只剩 S10。_

| 代號 | Slug                  | 狀態                                                            |
| ---- | --------------------- | --------------------------------------------------------------- |
| S1   | `song-creation`       | ✅ v3 — 2026-09-01 更新(STYLE 規則 + 14 張截圖)                 |
| S2   | `mv-creation`         | ✅ v1 — 需補 1.4(`/mv/creating`)與 2.9 的上傳 toast             |
| S3   | `mv-edit`             | ✅ v1                                                           |
| S4   | `history`             | ✅ v1 — 需補 1.1 的 `historyEmpty` / `historyLoading`           |
| S6   | `shell-auth`          | ✅ v1 — 需補 2.1(Footer Contact 登入閘)                         |
| S7   | `profile-account`     | ✅ v1 — 需補 1.3(頭像上傳 + 圓形裁切)                           |
| S5   | `credits-iap`         | ✅ **v1 完成 2026-09-01** —— 6 paths / 21 shots,validate 與 lint 全綠(56/56 strings) |
| S8   | `explore-community`   | ✅ **v1 完成 2026-09-01** —— 6 paths / 36 shots,validate 與 lint 全綠(56/56 strings)。Curation PRD 首次完整讀過:版面依原型(D-02),排名/審核層只標註並以 PDF 為準(D-03);PRD 自相矛盾與 `TBD-EXP-11` 仍開著,記為 Q-01 / Q-02 |
| S9   | `share`               | ✅ **v1 完成 2026-09-01** —— 5 paths / 15 shots,validate 與 lint 全綠(15/15 strings)。`/share` 2026-08-24 已改版,area 10 依 D11 就地更正 |
| S10  | `credit-consumption`  | ⏸ 卡在 `TBD-CC-06`(見 2.2)—— 依裁示先寫 TBD                     |
| S11  | `notifications-email` | ✅ **不做截圖版** —— area 12 的 md 即 spec(產品負責人裁示)      |

---

## 5. 一句話結論

**第一版說「六項擋住 spec」,實測後一項都不擋。** 其中兩項根本不是缺口 —— 是我讀了過期的
handover 而沒有讀程式碼。真正還開著的只有**三個 RD 契約**(第 2 節)與**兩個等回覆**(第 3 節),
而那些擋的是 RD 實作,不是 spec 寫作。~~**S5、S8、S9 現在都可以做。**~~ **S5、S8、S9 都已於
2026-09-01 完成;隊列只剩 S10,仍卡在 `TBD-CC-06`。**

> **同一天又證實了一次「以程式碼為準」。** S8 與 S9 的拍攝各自推翻了自家 area spec 的既有敘述:
> area 04 的 `/watch` 控制項清單、`/creator` 的 email 與 `⋯` 選單、`/song/play` 桌機到站狀態,
> 以及 area 10 整個「只有三樣東西」的 `/share` 描述(2026-08-24 已改版)。全部依 D11 就地更正。
