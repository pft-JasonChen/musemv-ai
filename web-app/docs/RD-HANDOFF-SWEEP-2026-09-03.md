# 交接前地毯式掃描 — 找到什麼、修了什麼(2026-09-03)

> **這份取代 `RD-HANDOFF-READINESS-2026-09-02.md` 的 §5(已知但不擋交接)與 §6(交接順序)。**
> 那兩節在被寫下的當天稍晚就過期了 —— 見下方 §4。其餘各節(§0 一句話結論、§1 gate、§2 五份
> storyboard、§3 三個契約缺口、§4 PM 待拍板)仍然有效,本文件只補上這次掃描新發現的部分。
>
> **方法。** 這一輪不是讀文件,是三件事同時做:(a) 跑完所有 gate;(b) 用 Playwright 掃 21 條
> route × 2 個寬度,量 console / 網路狀態碼 / 破圖 / mask icon / 橫向溢位,並對每一個對話框
> 的每一顆控制項做 `elementFromPoint` 命中測試(這正是 09-02 那個 P0 的形狀);(c) 把 spec
> 裡可驗證的數字逐條拿去對程式碼。**下面每一條都標了是「量到的」還是「讀到的」。**

---

## 0. 一句話結論

**可以交。** 這次掃出 **11 個問題**,其中 8 個是**文件/spec 對 RD 說了錯話**、3 個是程式碼或
工具鏈缺陷;**全部已修**。過程中浮出的**唯一一條拍板題**(footer 的兩條法律連結)已於同日
裁示 **維持 inert**,所以程式碼與 gate 一行未動,只更正了 `DESIGNER-TODO` A29 的口徑(§3)。
四個 Definition-of-done gate、guard-greps、designer-css、token-map、10 份 storyboard
`validate()`、15 張 flowchart 幾何 gate,全綠。

| 類別                    | 數量 | 狀態                                        |
| ----------------------- | ---- | ------------------------------------------- |
| 程式碼缺陷              | 3    | ✅ 已修,各自有 e2e 守著且雙向 mutation 測過 |
| spec / 文件對 RD 說錯話 | 6    | ✅ 已修,其中兩項加了 gate 讓它不能再漂      |
| 交接工具鏈壞掉          | 2    | ✅ 已修                                     |
| 待產品負責人拍板        | 1    | ✅ 同日裁示「維持 inert」,見 §3             |

---

## 1. 🔴 程式碼缺陷(3,全部已修)

### 1.1 `/mv/edit` 的 `(26credits)` —— `TODO.md` #9,產品負責人 2026-08-28 裁示「等 S3 spec 落地後再修」

那句話一半寫「Recreate (26credits)」、另一半寫「Merge MV (10 credits)」,**原始碼兩處的空格
一模一樣**。`TODO.md` 特別交代「不要用 JSX 空白規則去推理,先在瀏覽器重現」—— 兩件都做了,
然後**讀了打包後的 bundle**,那才是真正說明白的東西:

```js
["Recreate (", sceneCost, "credits) … saved — Merge MV (", COST_MERGE, " credits) re-renders …"];
```

兩半在**原始碼裡本來就不對稱**。`{COST_MERGE}` 後面那個文字節點的第二行是純空白、會被 JSX
丟掉,等於單行節點,前導空格活下來;`{sceneCost}` 後面那個橫跨**兩行都有內容**,SWC 會把
併行結果的前導空白剪掉。**所以觸發條件是 Prettier 剛好把句子折在哪裡,不是前面那個
expression** —— 也就是說,下一次重新排版時,另外一半也可能掉空格,而 `{" "}` 只能修好今天
這個折行。

**改法:**整句改用字串常值,不留任何 JSX 文字節點給格式化工具去折。實測 DOM 現在讀到
`Recreate (26 credits) … Merge MV (10 credits) …`,並且**在重拍的
`13_scene_recreated_version.png` 上用眼睛確認過**(不只是 `textContent`)。
`e2e` 的 **「TODO#9」** 斷言的是**形狀**(兩個 `(N credits)`、任何位置都不得出現
`\d+credits`)而不是字面的 26 —— 因為 `recreateShotCost()` 會隨場景變動。雙向 mutation 測過:
還原成 JSX 文字會紅,修好會綠。

**S3 在同一次改動裡重拍**(24 張全部)、`build_spec.py` 升到 v2、flowchart 版本戳一起升。
`strings_ignore` 那一條**沒有如 `TODO.md` 預期的消失**,但它的理由整個換掉了:`lint_spec.py`
的 `_ENT` 會把 spec 的 `&mdash;` 正規化成 ASCII 連字號,而原始碼帶的是真正的 U+2014,所以那
一句無論文案怎麼寫都不可能 byte-match。原本「容忍這個 bug」的註解換成這個解釋,而告訴 QA
「少空格是刻意的」那條 `limits` 直接刪掉。

### 1.2 `SettingsView` 的 Delete Account 用未加語系前綴的 `router.push("/")` —— `TODO.md` #7f 的另一半

R-9 的老問題,2026-08-06 只關掉一半。**這個檔案本來就 import 了 `localePath` 和 `useLocale`**,
往上 100 行的登出也用對了 —— 所以缺陷不是「這個檔案不懂語系」,而是一個藏在 `setTimeout` 裡
面、`onClick` 裡面的呼叫點。英文下 cookie redirect 還是會把你送到對的頁面,所以**測試的人永遠
看不出來**。這正是 R-9 存在的理由,而 `guard-greps.sh` 抓不到它:那條規則 grep 的是字面的
`<a href="/`,不是 `router.push`。

修好之後 `grep -rn 'router\.push("\|router\.replace("' src` 只剩一則註解 —— **`src/` 裡已經沒有
未加前綴的導覽了。**

### 1.3 Buy Credits 對話框的 Terms / Privacy 是死連結,它的雙胞胎卻不是

`BuyCreditsModal` 底部的 **Terms of Use** / **Privacy Policy** 是 `href="#"`。但
`TERMS_URL` / `PRIVACY_URL` 從 PROF-06 / AUTH-03 起就在 `src/lib/legal.ts`,而且**已經活在四個
元件裡**,其中一個正是它的雙胞胎:2026-09-01 產品負責人把 `SubscribeModal` 的 footer 換掉,
換上的就是這兩個常數(那邊的註解直接把 DP 的 `#` 稱為 dead)。那一輪只是沒改到隔壁檔案。

所以兩個 IAP 對話框長著同一個 footer,**一個能點、一個不能**。`DESIGNER-TODO` A29 把這兩條
算進「還缺 5 個目的地」,而且自己寫著「本則從來沒有算進去」—— 它們從來就不缺目的地。

已接上。守它的 e2e 斷言的是**兩個對話框一致**,不是斷言某個特定網址,所以將來任一邊改動而
另一邊沒跟上都會紅。**footer 的三條沒有動,那是產品負責人的決定 —— 見 §3。**

---

## 2. 🟠 spec / 文件對 RD 說錯話(6,全部已修)

### 2.1 `specs/areas/12-notifications-email.md` 根本沒被索引 —— RD 打開入口永遠看不到它

`specs/build-index.py` 的 `ROWS` 只有 00–11 + OQ。area 12 是 2026-09-02 新增的 **300 行後端
契約**(五封信的 trigger / 收件人 / 時機 / 動態欄位 / deep link),但它不在清單裡,所以
`specs/index.html` —— 我們給 RD 和 QA 的**唯一入口** —— 從來沒有連到它。沒有任何東西壞掉、
沒有任何 gate 會紅,那一行只是沒有人寫。

已補。實測:索引現在列 14 份 spec,點 12 會正確渲染(20,151 字、5 個表格、0 console error)。

### 2.2 索引的 QA 欄裡,十個「N AC」有七個是錯的 —— 而且**全部少算**

QA 是拿這一欄規劃覆蓋率的,所以少算不是筆誤,是**默默縮小的測試計畫**:

| spec         | 索引寫 | 實際   |
| ------------ | ------ | ------ |
| 01 App Shell | 8      | **10** |
| 03 Song      | 13     | **17** |
| 04 Explore   | 10     | **14** |
| 06 Profile   | 10     | **18** |
| 07 Credits   | 9      | **12** |
| 09 Auth      | 7      | **8**  |
| 10 Share     | 6      | **7**  |

沒有人打錯字 —— 是 spec 長出了新的條目,而沒有人回頭改這個檔案。已全部更正,並加上
`verify_ac_counts()`:重新數每份 markdown 裡自己前綴的 `AC-<PREFIX>-NN`,對不上就**拒絕產生
索引**(跨領域引用不會灌水,因為只數自己的前綴)。雙向 mutation 測過。

### 2.3 索引的 dev 欄還在講已經刪掉的常數與已經取消的規則

`02` 寫 `COST_STORYBOARD / RENDER / REGEN / COVER`(前三個 2026-08-19 就刪了)、
`03` 寫 `COST_SONG=10`(實際是 `songCost()` 6/12)和「30s free-preview gate」(S3 已取消)、
`07` 寫「★ Pricing updated 2026-07-24」(2026-09-01 已被 Web SKUs & Pricing: Final 取代)。
全部改成現況。

### 2.4 「最便宜的 MV 是 220」—— 三份文件都這樣寫,而這個價格已經不存在

220 是 `COST_STORYBOARD` 20 + `COST_RENDER` 200,**兩個常數都在 2026-08-19 隨依秒計價一起被
刪掉**。之後就沒有單一 MV 價格可以引用了:`createMvCost()` 是 `45 + 費率 × 秒數`,費率隨 MV
類型與解析度變。所以下限是**最便宜的組合**:30 秒(trim 下限,`AC-MV-16`)的 storytelling
MV、Standard/720p,`45 + 2×30` = **105**。storyboard 路線 **107**,而**預設 compose**
(singing/Standard)30 秒是 **195**。

錯在 `src/lib/user.ts` 的 `DEFAULT_CREDITS` 註解、`specs/areas/07` §1、`specs/OPEN-QUESTIONS.md`
—— 三份都改了。**並且加進 `contract.surface.test.ts`**(「the CHEAPEST reachable MV is 105」),
所以下一次改價會弄紅一個測試,而不是又留三份文件在原地。沒有人重新算過它,**因為沒有任何東
西斷言過它**。

### 2.5 五個檔案的註解還在指名不存在的常數

`COST_RENDER` / `COST_REGEN`(`MvEditor.tsx`、`MvResult.tsx`)、`COST_SONG`
(`SongCompose.tsx`)、`COST_SONG_RECREATE`(`SongResultView.tsx` ×2)—— 全部改成現在真的存在
的函式名。RD 讀到一個 grep 不到的常數,只會浪費時間。

### 2.6 `RD-HANDOFF-READINESS-2026-09-02.md` 的 §5 / §6 在寫下的當天就過期了

§5 說「`OPEN-QUESTIONS.md` 過期,停在 2026-08-12」、「`specs/index.html` 過期,完全沒有任何
storyboard spec 的連結,重建需要 `pip install markdown`(這台機器沒有)」,§6 把這兩件列為
交接順序的第 2、3 項。**兩件在那份文件被提交之前就已經做完了** —— `OPEN-QUESTIONS.md` 標頭
自己寫著「更新到 2026-09-02 現況」,`index.html` 是同一個 commit 重建的,含 9 份 storyboard
連結 + S10。PM 照 §6 走會去做兩件已經完成的事,同時漏掉真正還缺的 area 12(§2.1)。
本文件取代那兩節。

---

## 3. ✅ 唯一需要拍板的一條 —— 已於 2026-09-03 裁示

> **裁示:footer 三條全部維持 inert,只更正文件的數字。**
> `Footer.tsx`、`AC-SHELL-10`、以及守著「三條都是 `href="#"`」的那條 e2e **都不動**。
> `DESIGNER-TODO` A29 已改口徑:真正還在等網址的只有 **FAQ 一條**;footer 的 Terms of
> Service / Privacy Policy 是**有網址但刻意不接**,`BuyCreditsModal` 的兩條**已接**。
> 下面是提出這一題時的原始說明,保留作為理由的記錄。


**首頁 footer 的 Terms of Service / Privacy Policy 要不要接上 `lib/legal.ts` 的同兩個網址?**

現況是矛盾的,而且是**刻意**的矛盾,所以程式碼這邊不能自己決定:

- `AC-SHELL-10`(2026-09-02,產品負責人)明文要求 FAQ / Terms of Service / Privacy Policy
  **維持 inert**,並且註明「這半條是刻意斷言的,否則有人在網址定案前自己編一個上去也會過」。
  `e2e` 有斷言守著這三條都是 `href="#"`。
- 但其中**後兩條和 §1.3 剛接上的那兩條是同樣的兩個目的地**,而那兩個目的地已經在
  `SignInModal`、`SettingsView`、`FaceConsentDialog`、`SubscribeModal`、`BuyCreditsModal`
  五個地方活著了。

`DESIGNER-TODO` A29 說「還缺 5 個真實網址」是不準的:**只有 FAQ 真的缺網址。** 另外四個裡,
兩個已接(§1.3),兩個等這個決定。回答「接」的話是三行改動 —— 改 `Footer.tsx`、改
`AC-SHELL-10`、改那條 e2e 斷言;回答「不接」的話,把 A29 的數字從 5 改成 1 就好。

**→ 產品負責人選了「不接」,所以只改了 A29 的口徑,程式碼與 gate 一行未動。**

---

## 4. 🔧 交接工具鏈:兩份 storyboard 在乾淨機器上**根本無法重拍**

這是這次掃描的意外收穫,而且它比看起來嚴重 —— 交接的重點之一就是 QA 拿得到、跑得動這些腳本。

**`specs/storyboards/mv-edit/` 與 `specs/storyboards/credits-iap/` 的 `capture_screenshots.py`
從來沒有採用 `capture_lib.chromium_path()`。** `capture_lib.py` 自己的 docstring 就寫著
「三個 capture 腳本各自長出同一份 helper,有兩個沒有」—— 那兩個就是這兩份,而且一直沒補。
後果:Playwright 去啟動它自己版本釘住的 build,sandbox image 出的是別的 build,失敗訊息是
`Executable doesn't exist …` 外加一句叫你去跑 `playwright install`(那是錯的做法 —— 瀏覽器
就在那裡,只是 build number 不同)。**S3 和 S5 在這台機器上一張都拍不出來。** 兩份都改用共用
的 resolver 了。

**另外,S3 的餘額不足那一步是會 flake 的,而且 flake 的樣子跟「扣點閘壞掉」一模一樣。**
腳本點完 Recreate cover 之後硬睡 2500ms,而 `recreateCover()` 裡的 `setTimeout` 是 2200ms ——
300ms 的餘裕,在一台同時跑著 dev server 和 build 的機器上等於沒有。負載下封面還沒落地、
`dirty` 還是 false、Merge 還是 `disabled`,點下去什麼都沒發生,30 秒後死在
`waiting for .upgrade-dialog-overlay--visible`。**同一支腳本幾分鐘後在閒置機器上就過了** ——
這正是 `AGENTS.md` 說的「在負載下失敗的 gate 不是 bug 的證據」。改成等
`.mv-edit__merge-btn:not([disabled])` 這個真正的前置條件,就不會再這樣壞。

順帶一提,重拍也順手抓到 **S3 的舊截圖在側欄 logo 上也已經過期** —— logo 在 2026-08-28 之後
換過,而沒有人重拍過 S3。

---

## 5. ✅ 掃過但**沒有**問題的(記下來,免得下一個 session 重掃一次)

全部是量到的,不是讀到的:

| 掃描           | 範圍                                                    | 結果                                                                                                       |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Route 健檢     | 21 條 route × 375/1440,已登入                           | 0 console error、0 pageerror、0 個 4xx/5xx、0 張破圖、0 處橫向溢位                                         |
| **對話框遮擋** | 每個對話框的每一顆可互動控制項做 `elementFromPoint`     | **0 個被遮住** —— 09-02 那個 P0(頭像裁切被 Edit Profile 蓋住)沒有第二例                                    |
| 關閉中的 sheet | `.mobile-tabbar-sheet`                                  | overlay 帶 `inert`,tab 序列與 a11y tree 都碰不到(160 次 Tab 取樣,0 次落進去)                               |
| 扣點安全       | 每一個 `addCredits(-n)` 呼叫點                          | 全部有前置餘額檢查;三條 job 路徑都有失敗退款                                                               |
| `?demo=1`      | 10 個 flag                                              | 全部有真實 UI 讀取,全部標 `live` —— 面板沒有在說謊                                                         |
| 扣點模型       | `types.ts` vs `[YCM] Credit Consume Cloud Config .json` | 逐項相符                                                                                                   |
| R-9            | 全 `src/`                                               | 已無未加語系前綴的 `router.push` / `replace`                                                               |
| 影片           | 所有 `<video>`                                          | `MediaError 4` 是 Playwright 的 Chromium 不能解 H.264,**不是 app 缺陷**(`AGENTS.md` 已記載);真實瀏覽器正常 |

**mask icon 的 0×0 回報要小心解讀。** 掃描會把「在該寬度被 `display:none` 的父層底下」的 icon
一起報出來(1440 下的 mobile chrome、375 下的 sidebar),那是預期的,不是缺陷。唯一一個
「有 mask 沒背景」的命中是 `.hero-banner-v3__track`,那是輪播的邊緣淡出遮罩,不是 icon。

---

## 6. Gate 結果(2026-09-03 實跑)

| Gate                          | 結果                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| `npm run typecheck`           | exit 0                                                             |
| `npm run lint`                | exit 0(1 個既有 warning,在 `scripts/` 不在 `src/`)                 |
| `npm run test:run`            | **121 passed**(12 files;+1 = 新增的 105/195 斷言)                  |
| `npm run build`               | exit 0                                                             |
| `guard-greps.sh`              | 0                                                                  |
| `check-designer-css.mjs`      | PASS —— all files verbatim                                         |
| `token-map:check`             | G2-a PASS                                                          |
| 10 份 storyboard `validate()` | 全部 OK,0 warnings                                                 |
| `lint_spec.py`                | 9 份 0 findings;`song-creation` 5 findings(既有 advisory,字數上限) |
| `check_flowchart.py --strict` | 15 張圖 0 findings                                                 |

`npm run e2e` 依 `AGENTS.md` 由 Stop hook 跑,不在這裡執行。本次新增的兩支 e2e
(「TODO#9」與「the two IAP dialogs' legal footers agree」)已用 `--grep` 單獨跑過並雙向
mutation 測過:mutation 下 2 紅,還原後 2 綠。

---

## 7. 交接順序(取代 09-02 那份的 §6)

1. ✅ ~~重建 `specs/index.html`~~、~~更新 `OPEN-QUESTIONS.md`~~ —— **09-02 就已完成**,那份文件
   自己不知道(§2.6)。這次補的是它們都漏掉的 **area 12**(§2.1)與 AC 數字(§2.2)。
2. ✅ ~~回答 §3 的那一條~~ —— **同日裁示:維持 inert**,只更正 A29 的口徑;程式碼與 gate 未動。
3. 09-02 那份的 **§3 三個契約缺口**(Explore/Community API、扣點 payload 欄位、Send Feedback
   端點)與 **§4 PM 待拍板**仍然照原樣有效,**平行進行,不擋交接**。
