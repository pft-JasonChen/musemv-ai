# 設計師新版 UI 轉移計畫 — 計畫之書(plan of record)

> **日期:** 2026-08-04
> **DP(Designer Prototype):** `designer-prototype/`(in-repo,commit `568e64c`,2026-08-04)
> **WA(Web App):** `web-app/` — 正式交付物
> **狀態:** 決策已拍板。**Phase 0 / 1 / 1.5 / 2a / 2b 完成;Phase 3 的 3a、3b 完成,
> 加上一個不動畫面的修復 slice「3-blur」(`backdrop-filter`,2026-08-05)。**
> 新 UI 目前涵蓋:全域 shell(側欄 + 手機 chrome)、`/history` 整頁、`/explore/mvs`
> (justified gallery)、`/explore/songs` + `/song/play`(合併成一個雙欄畫面 + 手機全螢幕播放器)。
> **`OWN_CHROME` 是誠實的帳本:16 條 route 移轉了 4 條。**

---

## ▶ 下一個 session 從這裡開始(2026-08-05 第二次交接)

**先讀這一節,再讀 §4 Phase 3。** 上一個 session 做完 Slice 3b 並跑完 G7,留下 A-1 / A-2 / A-3
三筆未結。**這一個 session 把三筆都收掉了**,做法是先做 A-3 那個修復 slice,並把 A-1 併進它的
基準重錄一次完成。

### A. 3b 的三筆未結 —— 全部已結(2026-08-05)

| #                                                 | 結果                                                                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A-1 視覺基準 12 張**                            | ✅ **已在 Linux 重錄**。剛好 12 個檔案變動,全部是 `-linux`,`-darwin` 一張沒碰,其餘 17 條 route 的基準一張沒動。                                      |
| **A-2 G7 的 a11y leg**                            | ✅ **已補跑**(獨立 context 代跑,不是具名的 `a11y-checker` —— 見下面的但書)。結論見 §A.2。                                                            |
| **A-3 `TODO.md` #4:build 砍掉 `backdrop-filter`** | ✅ **已修**,自己一個 slice。bundle 從 27 prefixed / 8 standard 變成 **27 / 27**。原因與計畫預期的不同,見 §A.3 —— 那三件事都值得下一個 session 知道。 |

#### A.2 a11y 這一格是誰跑的(重要但書)

`a11y-checker` 定義在 `web-app/.claude/agents/`,**只有以 `web-app/` 為 session root 才拿得到**。
這個 session 的 root 是 repo root,所以名單裡沒有它 —— 這正是 `CLAUDE.md` 那條「web-app 的活要從
`web-app/` 起 session」在講的事。**A-2 的封鎖原因從「API 錯誤」變成「agent 不在名單裡」。**
產品負責人拍板:開一個獨立 context 的 general-purpose agent,餵它 `a11y-checker.md` 的原指令。
這滿足 §10.7「建置者不得自我認證」的**用意**(獨立 context、不是建置者自己蓋章),
但**它不是那支具名 agent**,所以這裡不寫成「`a11y-checker` PASS」。
下次要正牌的,從 `web-app/` 起 session。

#### A.3 A-3 的三個實測結論,每一個都跟計畫寫的不一樣

1. **不是「minifier 設定」的問題,改設定救不回來。** 真正做這件事的是
   `@tailwindcss/postcss` 內部的 lightningcss:它把 `backdrop-filter` 與
   `-webkit-backdrop-filter` 在值相等時**合併成同一條**,**最後出現的那條決定要留哪個前綴**。
   DP 一律標準在前、前綴在後,所以標準的那條每次都輸。
   **實測 8 種 lightningcss 設定**(targets 從 `defaults` 到 `safari >= 9`,外加 `minify: false`)
   **全部都會塌掉** —— 唯一的變因是原始碼的宣告順序,而那個順序不是我們能動的(D1 verbatim)。
   所以解法是 `postcss-restore-backdrop-filter.mjs`:跑在 Tailwind **之後**,
   把只剩前綴的規則補回標準屬性。它是**加法**,本來就正常的 7 支不受影響。
2. **「會改動所有已移轉畫面的外觀、要全部重錄基準」—— 沒有發生,而且原因很重要。**
   `e2e:visual` 回來 **103/103 未變**,只有本來就過期的那 12 張是紅的。
   因為視覺基準用 `fullPage: true`,**是在 scroll 0 拍的 —— sticky navbar 後面永遠沒有東西**,
   所以 `backdrop-filter` 不可能影響到任何一張基準的像素。
   **⚠️ 視覺 gate 對這一整類 bug 是結構性失明的**,不是這次剛好沒拍到。
   真正的驗收是**捲動後的 A/B**(1024 / 1440 / 1920):修之前完全重現回報的破圖
   (歌曲列與縮圖清晰切過 Back 鍵與 tab pills),修之後那一列被柔化、控制項清楚可讀。
3. **順手抓到一支「不可能失敗的測試」,是靠變異測試發現的,不是靠讀它。**
   `e2e/backdrop-filter.spec.ts` 第一版用 `document.styleSheets` 掃 CSSOM,**在修好與沒修好兩種
   狀態下都是綠的** —— Chrome 根本沒實作 `-webkit-backdrop-filter`,解析時就把那條丟掉,
   於是 `getPropertyValue("-webkit-backdrop-filter")` 對**正好壞掉的那些規則**回傳空字串。
   改成用 HTTP 抓 stylesheet **原始文字**來掃才會動。**兩個方向的變異測試都做了:
   拿掉 plugin 6/6 紅,裝回去 6/6 綠。**

> **原本那條「不要用 `designer-overrides.css` 把 navbar 塗不透明」的禁令,結果是對的而且沒有被違反。**
> 修的是 build pipeline,`designer-overrides.css` 一個字都沒動。

### B. 下一個 slice = `/profile` + `/settings`(2026-08-05 已拍板)

§4 的順序是 `/watch` → `/profile` + `/settings` → `/creator` → Credits IAP → `/mv/room` → …
**但 `/watch` 被 `DESIGNER-TODO` A5 擋住**(DP 在 <767px 藏掉所有 navbar,而 `MVDetailPage`
沒有自己的返回鍵 —— 手機上進得去出不來)。A5 **不**擋 3b,已由實作確認:`SongDetailPage`
自帶有返回鍵的全螢幕手機播放器。

**產品負責人決定:跳過 `/watch`,下一個畫面 slice 做 `/profile` + `/settings`。**
理由:A5 要等設計師給稿,等它就是停工;`/profile` + `/settings` 不是 detail 畫面,不受 A5 影響。
而且 **`/profile` 是目前僅有的兩個走 `useT()` 的畫面之一**(R-8),移轉它會順便驗證 i18n
邊界有沒有被破壞 —— 這是別的畫面測不到的。`/watch` 等 A5 有答案再回頭做。

> **開工前先讀 R-8。** i18n 邊界在這一支特別容易被無意間拓寬:`ProfileView.tsx` 是
> `useT()` 的兩個真實消費者之一,重寫它的 JSX 時很容易把 `t()` 換成硬編英文,
> 而**那在英文下看起來完全正常**。同樣地也不要順手把 `/settings` 拉進 `useT()` ——
> 拓寬 scope 是獨立決定,不是 UI port 的副作用。

### C. 等設計師回覆的四筆(都不擋其他畫面)

- **A5** — 手機 detail 畫面的返回途徑(**擋 `/watch`**)
- **A7** 🆕 — DP transport 沒有 shuffle/repeat,**與 spec `AC-EXP-05` 相牴觸**;產品已拍板照 DP,
  所以現在 code 是刻意違反 spec 的狀態(plan **S21**)
- **A8** 🆕 — `TopSongListItem.css` 零 media query,320px 標題只剩 1–2 字元
- **A1** — `.tabs__tab--active` 3.95:1;3b 是第一個真的被 axe 量到的畫面,已依 A1 選項 2 排除

### D. 3b 留下的三條可重用經驗(寫在 `CLAUDE.md`,別重新踩)

1. **寫 URL 就是跳頁,`replace` 也一樣** —— 「桌機點了不導航」意味著 active 狀態是 component state。
2. **`audio.play()` 的 rejection 一定要 catch** —— 冷載入必然 `NotAllowedError`,未處理就是 console error,
   而 R-2 那幾支測試斷言 console 是空的。
3. **`opacity: 0` 不等於 hidden** —— 仍在 tab order 與 a11y tree 裡。用常駐掛載 + `inert`,
   並且**掃 DOM 驗證**,不要用推論(3b 第一版就漏了同一畫面上的第二個遮罩)。

### D2. 3-blur slice 再留下三條(2026-08-05)

4. **視覺基準是 `fullPage: true`,永遠在 scroll 0 拍 —— 它看不見任何「捲動時才發生」的事。**
   sticky navbar 後面在 scroll 0 沒有東西,所以 `backdrop-filter`、scroll-shadow、
   sticky 疊層這一整類問題,基準 115 張全綠也證明不了。要驗它就得自己捲一下再拍。
   這和 A4 是同一句話的兩面:**A4 是「基準會吸收掉功能損失」,D2-4 是「基準根本拍不到某些損失」。**
5. **變異測試不只驗「測試會不會抓到 bug」,更會抓到「這支測試根本不可能失敗」。**
   `backdrop-filter` 的 CSSOM 版掃描在修好與沒修好兩種狀態下都綠 —— 讀它讀不出來,
   跑一次變異當場現形。**新增守門測試時,兩個方向都跑一次。**
6. **「build 砍掉了 X」先確認是哪一段 pipeline 砍的,再去找開關。**
   這次直覺是「minifier 設定 / browserslist」,實測 8 種設定全部無效,
   真正的行為是 lightningcss 的**宣告合併**(值相等時後者決定前綴),
   而 `@tailwindcss/postcss` 內部就跑了它 —— 想「跑在它前面修」也不行,
   因為 `@import` 正是它 inline 的。**先用 20 行 probe 把行為釘死,再決定修哪裡。**

---

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

| #       | 決策                                                                                               | 理由 / 影響                                                                                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CH1** | **Sidebar + MobileHeader + MobileTabBar 全域一次移轉**,單獨一個 slice,以 DP 為準                   | 側欄是**持續性 chrome**。若 Home 用舊版、`/history` 用新版,側欄會在導航時**當場變形**,比靜態新舊並存更糟。Home 因此會先拿到新側欄 —— 這是 landing 延後期間唯一會變的部分 |
| **CH2** | 採 DP 的 **per-page `RoomNavbar`/`DetailNavbar`**;WA 全域 `TopBar` 降級為「未移轉 route 的預設值」 | ⚠️ **理由已於 2026-08-05 更正,決策不變** —— 見下方修正框。實務上 `TopBar` 只剩 Home 在用,landing 設計到位時一併刪除                                                      |

> **CH2 原本的理由是錯的(2026-08-05,`/explore/mvs` slice 實測)。** 原文寫的是
> 「DP 的 detail 畫面是繞著 `DetailNavbar` 的返回鍵設計的,沒有它,12 個畫面在手機上失去唯一的
> 返回途徑」。實際讀 DP 的 CSS:`AppLayout.css:82-89` 在 `max-width: 767px` 把
> `.detail-navbar` 連同 `.sidebar`/`.navbar`/`.room-navbar`/`.footer` 一起 `display: none`,
> 而 `MobileHeader` **沒有任何 back 控制項**(DP 與 WA 都沒有)。
> 也就是說**那個返回鍵在手機上本來就不存在** —— 它是桌機專屬的。
>
> **決策本身仍然成立**(per-page navbar 是對的,`DetailNavbar` 在桌機確實是返回途徑),
> 但「手機」那半段不能再拿來當理由,也不能拿來當「手機返回已解決」的證據。
> **手機 detail 返回是一個尚未解決的開放問題,記在 `DESIGNER-TODO.md` A5,並且擋 `/watch`。**
> 這條記在這裡而不是默默改掉,因為它正是計畫自己說的
> 「DP、spec 與 code 三者衝突時,讀 code」的第三個實例。
> | **CH3** | **行銷 `Navbar` 不在本次範圍** | 它只出現在 Home(`AppLayout` 的 `??` fallback),而 Home 已延後。連帶:它內含的 12 語 `LanguagePicker` 本次也碰不到(見 S9) |
> | **CH4** | **`Footer` 不在本次範圍** | 只出現在 landing 與 `/blog`(`showFooter`),兩者都延後 |
> | **CH5** | 手機底欄 **5 項 @640px → 3 項 @767px**(Explore / ＋建立 / History) | Profile 從底欄消失,改由 **Sidebar 的 profile footer**(桌機)與 **`MobileHeader` 帳號 icon**(手機)進入。**這是行為變更(R12/S13),要自己的 slice 與自己的 e2e** |
> | **CH6** | Sidebar **隱藏 AI Storybook 與 Blog**,保留登入後 profile footer + Upgrade 鈕 | AI Storybook `href="#"` 連畫面都沒有;Blog 已定 V2。以常數控制,V2 開回來只改一行。避免 CEO demo 點到空頁 |

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

| #                      | 判定                                                                                                                     | 後續動作                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1**                 | **取消** High 畫質的 Pro 鎖,免費開放                                                                                     | 與 DP 一致。**理由是連貫的**:DP 的 `UpgradeDialog` 顯示新方案賣的是 **credits 不是功能**($9.99/200、$29.99/1,000、$59.99/2,000)                                                                                                                                                                                                                                                                                                                             |
| **S3**                 | **取消** 30 秒試聽門檻,免費全曲播放                                                                                      | 同上                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **S1/S3 的 Gate 處理** | **反轉測試,不刪除**                                                                                                      | G5-d #7 從「Pro 門檻存在」改寫成「**High 對免費帳號可選、播放不設上限**」。Gate 維持 10 項不降級,並防止門檻日後被誤加回來                                                                                                                                                                                                                                                                                                                                   |
| **S2**                 | **只保留 30 秒 trim 下限**,拿掉 DP 的 8% 軌長 gap                                                                        | 以 MV-01 spec 為準。**移轉 `TrimAudioSheet` 前先補上 S2 的 e2e**                                                                                                                                                                                                                                                                                                                                                                                            |
| **S4**                 | **拿掉 BPM + Key**,跟 DP 一致                                                                                            | ⚠️ 動到 `src/lib/mv/types.ts` 的 `bpm`/`musicKey` → **屬 C8,需獨立 PR + `CHANGELOG-RD.md`**,不可夾在 UI slice。同步更新 SONG-01 spec                                                                                                                                                                                                                                                                                                                        |
| **S6**                 | **保留審核流程**;MV 的 confirm 用 DP 新的 `PublishDialog`,`reviewing` / `Submitted for review` 沿用 WA;Song 維持現行行為 | DP 這版剛好把 confirm 那一半補回來了                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **S8**                 | **維持 `localStorage["muse_auth"]`**                                                                                     | DP 的 `AuthProvider`(用 `sessionStorage`)**整支不搬**,只取 `LoginModal` 外觀接 WA 既有 `AuthProvider`。零契約變更                                                                                                                                                                                                                                                                                                                                           |
| **S20** 🆕             | 方案價**以 code 為準:Weekly $19.99**                                                                                     | 新發現,不在 08-01 的 §8。DP 寫 $9.99,與**已知過時**的 DEVELOPER-HANDOVER 一致而非與 code 一致 —— 典型的 code/doc 陷阱。移轉 `UpgradeDialog` 時**只搬版面,價格一律讀 `SUBSCRIPTION_PLANS`**,不得硬寫                                                                                                                                                                                                                                                         |
| **S5**                 | credits 扣款 / 退款 / 餘額不足導購 **完全不動**                                                                          | 非協商項。DP 全站硬寫 `credits={390}`(19 處),移轉時**一律改接 `useCredits()`**                                                                                                                                                                                                                                                                                                                                                                              |
| **S21** 🆕             | `/song/play` 的 **shuffle + repeat 照 DP 刪掉**,並回報設計師                                                             | 新發現於 Slice 3b(2026-08-05),不在 08-01 的 §8,也不在 3b 的 pre-flight —— **pre-flight 漏的第二個東西**(第一個是 `createPortal`)。DP 兩支 transport 都只有 prev/play/next;WA 有 shuffle + repeat,而且 **spec AC-EXP-05 明文要求**(EXP-04,2026-07-23)。產品拍板照 DP,所以**這是 code 刻意違反 spec 的狀態**:已寫進 `DESIGNER-TODO.md` A7 等設計判斷,並回寫 spec 標註差異。**沒有反轉測試可寫** —— 這是功能移除,不是門檻反轉,守它的是 A7 那筆待辦而非一條 e2e |

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

| WA route                    | DP 來源                                           | 備註                                                                                          |
| --------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/history`                  | `HistoryPage`                                     | **第一支**,R-1/R-2 spike 用                                                                   |
| `/explore/mvs`              | `MVDetailPage`                                    | justified gallery(S15,刻意改版)                                                               |
| `/explore/songs`            | `SongDetailPage` `?tab=New Releases`              | ⚠️ **拆法已改,見 Phase 3 的 Slice 3b** —— 清單無法單獨抽出,與 `/song/play` 共用同一個移轉畫面 |
| `/watch`                    | `MVDetailPage` `?id=`                             | 取其播放器狀態                                                                                |
| `/song/play`                | `SongDetailPage`                                  | 與 `/explore/songs` 同一個 slice(3b),同一個畫面                                               |
| `/mv/room`                  | `MVCreatePage`(1,441 行,最大)                     | 含 `TrimAudioSheet`、face picker、5 個 sheet                                                  |
| `/mv/thinking`              | `MVStoryboardPage` `stage='processing'`           |                                                                                               |
| `/mv/storyboard`            | `MVStoryboardPage` `stage='edit'`                 |                                                                                               |
| `/mv/result`                | `MVResultPage`                                    | `@needs-figma-recheck`                                                                        |
| `/mv/edit`                  | `MVEditPage`(785 行)                              | `@needs-figma-recheck`                                                                        |
| `/song/create`              | `SongCreatePage` `stage='form'`                   | S4 拿掉 BPM/Key                                                                               |
| `/song/creating`            | `SongCreatePage` `stage='processing'`             |                                                                                               |
| `/song/result`              | `SongCreatePage` `stage='result'`                 | `@needs-figma-recheck`                                                                        |
| `/profile`                  | `AccountPage`                                     |                                                                                               |
| `/settings`                 | `AccountPage` `/account/settings`                 |                                                                                               |
| `/creator`                  | `CommunityProfilePage`                            |                                                                                               |
| Credits IAP(modal,非 route) | `CreditsPage` + `CreditsDialog` + `UpgradeDialog` | 價格讀 WA 常數(S20)                                                                           |

### 2.2 不在本次範圍 —— 要回報給設計師的 todo

> **完整清單在 `docs/DESIGNER-TODO.md`** —— 缺的稿、稿裡的瑕疵、需要設計判斷的取捨,
> 每項都標了是否擋開發。下面只列 route 層級的缺口。

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

| #         | 項目                                                                                                                                                                                                                                                              | 卡住誰                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| U1 🔴     | **Song Length**:DP 用 `SHOW_SONG_LENGTH = false` 藏起來。是暫時隱藏還是要移除?(S4 已決定拿掉 BPM/Key,但 Song Length 未表態)                                                                                                                                       | `/song/create`                                      |
| ~~U2~~ ✅ | **D1 已驗證**(2026-08-04 spike):共存,機制是 cascade layer 而非載入順序;擴散範圍實測為 0(115 項視覺測試只有 history 的 6 項變動)                                                                                                                                   | 已關閉                                              |
| ~~U3~~ ✅ | **R-2 已驗證**(2026-08-04 Shell slice)。反向實測:把 DP 原本的 `useState` initializer 讀 `matchMedia` 放回去,1000px 立刻拋 **React #418 hydration failed**;換成「SSR-safe 初值 + isomorphic `useLayoutEffect`」後 1440 / 1000 / 700 三個寬度皆 **0 console issue** | 已關閉                                              |
| U4        | 300MB demo 媒體(44 mp4 + 36 mp3)是否進 git —— **轉移完成後**再看                                                                                                                                                                                                  | 無(目前用設計師的 Vercel 版做並排比對)              |
| U5        | S9 語言擴充(9 → 12 或其他)—— 轉移後定案,屬 C6                                                                                                                                                                                                                     | 無                                                  |
| U6        | **C1–C8 清單未經 RD 確認**(2026-08-04 決定不寄確認信)。這不是待辦,是一項已知事實:G4 只能保護清單上的東西,所以它證明的範圍以這張我方自訂的清單為準                                                                                                                 | 無                                                  |
| U7        | 08-01 §7 的 **Q1、Q3、Q4、Q5、Q8、Q9** 尚未處理(轉場無縫度、deep-link 無 flow state、`/mv/thinking` 完成後是否換 URL、Blog/Storybook URL 結構、未登入開受保護 route)                                                                                              | Q3 其實已有答案(flow-guard 已實作且有 e2e),只需確認 |
| U8        | **S14 Home 區塊組成**、**S12 行銷 chrome 雙層 IA** —— 隨 landing 一起決定                                                                                                                                                                                         | landing                                             |
| U9        | `MVResultPage` / `MVEditPage` / `SongResult` 的 Figma 覆核 —— 設計師自標未收斂                                                                                                                                                                                    | 搬時標 `@needs-figma-recheck`                       |

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

**✅ 執行完成 2026-08-04。範圍:history card(DP BEM markup + CSS)搬進 WA 既有頁面,
provider / handler / ⋯ 選單全部保留不動。**

#### U2 / R-1 —— ✅ 答案:共存,而且機制不是「載入順序」

**真正的機制是 cascade layer,不是順序。** Tailwind v4 產出
`@layer base, components, properties, theme, utilities`;`designer.css` 是**無 layer** 匯入的,
而 **CSS 規則裡「無 layer」永遠贏過「有 layer」,與 specificity 和先後順序都無關**。
所以已移轉元件上的 DP BEM 一定贏 Tailwind utility —— D1 能成立靠的是這個,不是 `@import` 的位置。

證據:

- DP `HistoryPage.css` 79 條規則**全部**掛在 `.history-*` BEM 之下,**0 個 `!important`**,
  3 個裸元素選擇器全是 BEM 塊的子代(`.history-card__copy > a` 這類),不會外洩。
  唯一跨界的 `.app-layout__content:has(.history-card__menu)` 指向 DP 自己的 layout,在 WA 不匹配。
- DP 兩支樣式表定義的 class 名與 WA 全部 markup **零重疊**(逐 class 比對)。
- **實測擴散範圍:視覺測試 115 項中恰好 6 項變動,全部是 `history`(六個寬度);其餘 18 條 route
  的 109 項一項未動。** 全域匯入 DP 樣式表對其他畫面**零影響**。

⚠️ **代價要知道**:因為無 layer 恆勝,已移轉元件上若混入 Tailwind utility,**它會靜默失效**。
G3-d 的「不得混用」因此不是風格偏好,而是**量出來的後果**。

#### U3 / R-2 —— ⚠️ 模式已定,但**這個畫面沒有真正的難題**

`/history` 的 DP 危險讀取**全是良性的**:`document.addEventListener` 與 `window.setTimeout`
都已經在 `useEffect` 裡(本來就 SSR-safe),另有一處 `window.location.href =` —— 那條被 G1-b 硬擋,
改用 WA 的 router 即可。

**真正危險的那一類(render 期或 `useState` initializer 讀 window)在這個畫面完全沒有出現** ——
它住在 `Sidebar.tsx` 的 `window.matchMedia()` 與 `App.tsx` 的 `window.location.pathname`,
兩者都在 **Phase 2 的 Shell slice**。

已定下的模式(待 Shell slice 真正驗證):

> `"use client"` + 所有 `window`/`document` 讀取移進 `useEffect` + 初值給 SSR-safe 預設值 +
> **絕不在 render 或 `useState` initializer 裡讀 window**。

**所以 R-2 尚未真正關閉。** 誠實記錄:spike 無法測到它該測的東西,Shell slice 才是它的考場。

#### 在 DP 套件裡找到的三個瑕疵(搬第一支檔就出現)

| #   | 問題                                                                                                                                  | 影響                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `HistoryPage.css` 引用 **DP 自己 tokens.css 沒定義**的三個 token:`--neutral-dark-48`(×2)、`--neutral-dark-15`、`--line-height-body-s` | CSS **靜默丟棄**該宣告,元素改為繼承。無錯誤、無警告。階梯有 44/54 沒有 48,有 14/24 沒有 15,有 `--font-body-s` 卻沒有對應的 line-height |
| 2   | `.badge--failed` 對比度 **≈4.07:1**(`#FF2600` 疊在 `rgba(255,38,0,.2)` 上,合成後 `rgb(68,24,20)`),9px/700 需要 **4.5:1**              | **axe serious violation**。G5-e 要求該 route 零 violation → 目前 `/history` 過不了,需設計師修或比照 accent pill 加例外                 |
| 3   | `HistoryPage.css` 的 media query 是 **480 / 767 / 900 / 1200**,只有 767 對得上議定的六階                                              | 與 §1.2 的六階 breakpoint 不一致,要跟設計師確認                                                                                        |

#### 新增工具:`scripts/check-designer-css.mjs`(`npm run designer:check`)

D1 的「原樣搬」會把設計師的錯一起搬進來,而 **CSS 是靜默失敗**。這支腳本檢查兩件事:

1. `src/styles/designer/` 每支檔案與 drop **逐位元組相同**(擋「我改一下就好」—— 下次 re-drop 會把它悄悄還原)
2. 它們引用的每個 `var(--token)` 都真的解析得到

已接上 Stop hook:**drift 直接 blocking**;未解析 token 只列印不擋 —— 讓它擋反而會逼人去改 verbatim 檔,
正是第 1 條要防的事。drift 偵測已做變異測試(改一行 → exit 2,還原 → exit 0)。

#### 一個 DP CSS 逼出來的結構調整

`.history-card__copy > a` 是**直接子代元素選擇器**,標題的整套視覺(顏色/字級/ellipsis)都掛在上面 ——
用 `<button>` 會完全沒有樣式。所以標題改成 `<a>`,**給真實 href 並攔截 click**:行為與先前完全相同
(照樣開 dialog),但 middle-click / 複製連結可用,axe 也看到一個有目的地的 anchor 而非裸可點 `<a>`。
href 一律用 **WA 自己的 route**(D3),不採 DP 的 `?from=` 方案。

#### Gate 結果

`typecheck` · `lint` · `test:run(76)` · `build` · G1-b greps · G2-a · D1 verbatim · G4-g **全綠**;
**e2e 47/47**;視覺 109/115 未動 + history 6 張已**明確重錄**(該畫面是刻意改版,非 Phase 1 的零差異情境)。

> 觀察到一次 flake:`G5-d#3 requireLogin` 在滿載並行下 20s timeout,單獨跑 461ms 通過,
> 第二次完整跑 47/47 全綠。記錄下來而非當作雜訊 —— 「單獨跑會過」正是負載敏感 flake 的長相。

### Phase 2 — Shell + 共用元件

- **Slice 2a — Shell** ✅ **完成 2026-08-04**(CH1/CH5/CH6):`Sidebar` + `MobileHeader` +
  `MobileTabBar`,外層改用 DP 的 `AppLayout` class。

  **R-2 在這裡才真正被驗證**(spike 測不到)。DP 的
  `useState(() => typeof window !== 'undefined' ? matchMedia(q).matches : false)` 看起來安全 ——
  `typeof window` 保護讓它不會在 SSR 崩潰 —— 但它保證了 **hydration 不一致**:server 給 `false`,
  client 首次 render 讀真實媒體查詢,≤1024px 兩邊就對不上。**實測把它放回去,1000px 立刻拋
  React #418 `hydration failed`**;改成 SSR-safe 初值 + isomorphic `useLayoutEffect` 後,
  1440 / 1000 / 700 三個寬度皆零 console issue。

  用 `useLayoutEffect` 而非 `useEffect` 是因為 **DP 的 CSS 沒有 collapsed 的 media query**
  (純 class 驅動),在 paint 之後才修正會讓 240px 側欄在每次筆電寬度載入時閃一下再縮成 72px。

  **行為變更(R12/S13),已補 6 支 e2e:** 手機切點 640 → **767**;底欄 5 項 → **3 項**
  (Explore / ＋ / History);**Profile 離開底欄**,改由 `MobileHeader` 帳號鍵與側欄 profile footer 進入。
  另補一支 R-9 測試,直接斷言 `/jpn/history` 的側欄連結全都帶 `/jpn` 前綴 ——
  這個失敗在英文環境下完全看不出來。

  **視覺基準重錄 108/114**,未變動的正好是 `/share` 的 6 個寬度 —— 那是 `AppShell` 唯一 bare
  渲染的 route。擴散範圍恰好等於「有 shell 的每一條 route」,反過來證明 bare 路徑仍然正確。

  **Gate:** typecheck · lint · test:run(76) · build · G1-b · G2-a · D1-verbatim · G4-g 全綠;
  **e2e 53/53**(47 + 新增 6)。

- **Slice 2b — navbar slot** ✅ **完成 2026-08-04**(CH2):`RoomNavbar` + `Tabs` +
  `CreditBalance` / `UpgradeButton` 版面,並把 `/history` 完整收尾(標題與篩選 tab 上移進 navbar,
  grid 換成 DP 的四欄 `.history-page__grid`)。

  **slot 在 App Router 的作法。** DP 是把 navbar 當 prop 傳給 `AppLayout`;App Router 反過來 ——
  page 在 layout 內部,傳不上去。解法是 `.room-navbar` 本來就是 `position: sticky`,所以
  **由已移轉的 view 自己 render 成第一個子元素**,行為完全相同;`AppShell` 只需要一份
  `OWN_CHROME` 清單知道哪些 route 不要再畫 legacy `TopBar`。那份清單每移轉一個畫面加一列,
  最後一個畫面搬完就連同 `TopBar` 一起刪除。

  **`DetailNavbar` 刻意還沒做** —— 它要等 Phase 3 第一個 detail 畫面才有真正的使用者,
  現在做等於憑空猜介面。

  **credits 已接真值:** DP 19 處硬寫的 `390` 換成 `useCredits()`;`CreditBalance` 與
  `UpgradeButton` 都導到 `/profile`,WA 的 credits 與訂閱介面本來就在那裡,
  不在 shell slice 裡再搬一套 IAP。

  **Gate:** typecheck · lint · test:run(76) · build · G1-b · G2-a · D1-verbatim · G4-g 全綠;
  **e2e 53/53**。axe 在已登入的 `/history` 抓到 **5 個 color-contrast node**,全部是 DP 的
  `Tabs` 與 `Badge`(見 `DESIGNER-TODO.md` A1)—— 我方元件零 violation。

- **Slice 2b…** 依相依序:`Button` → `IconButton` → `Chip` → `ToggleSwitch` → `Tabs` → `Card` → `ListItem`
  → `SectionHeader` → `Badge` → `CreditBalance` → `RoomNavbar` / `DetailNavbar` → `Toast` → `LoginModal`
  → `PublishDialog` → `ShareDialog` → `UpgradeButton` / `UpgradeDialog` / `CreditsDialog` → `FloatingCTA`
  → `LyricsSheet` → `TopSongListItem`
- **`CreditBalance` 必須接 `useCredits()`**,不可沿用硬寫的 390(19 處)。
- **`LoginModal` 接 WA 的 `AuthProvider`**(S8)。
- **`UpgradeDialog` 價格讀 `SUBSCRIPTION_PLANS`**,不可硬寫(S20)。

**Gate(每支):** G1 + G3 + G4 + G6。

### Phase 3 — 畫面(依相依性由低到高)

> **開工前先讀:R-2 的第二個實例已經找到。** `MVDetailPage.tsx:316` 的 `MvGrid` 用了
> **和 Sidebar 一模一樣**的寫法:
> `useState(() => typeof window !== 'undefined' ? matchMedia(DESKTOP_QUERY).matches : false)`。
> 這正是 Slice 2a 實測會拋 **React #418 hydration failed** 的那個 pattern。
> 全 DP 掃過,這個危險寫法**只出現在兩支檔**:`Sidebar.tsx`(已修)與 `MVDetailPage.tsx`(待修)。
> 套 §4 Phase 1.5 記錄的模式即可:SSR-safe 初值 + isomorphic `useLayoutEffect`。
>
> **`/explore/mvs` 的規模要先知道:** DP 的 `MVDetailPage` 是 436 行 + 330 行 CSS,而且它
> **一支檔同時涵蓋我們兩條 route** —— 上半的 `.mv-player*` 是 `/watch`,下半的
> `.mv-detail__grid*`(justified gallery,S15)才是 `/explore/mvs`。兩者要拆成兩個 slice 搬,
> 不要一次吃掉。另需帶進 `Card` 與 `SectionHeader` 兩個共用元件,以及 `computeJustifiedRows` 的排版計算。
>
> `DetailNavbar`(64 行)隨這條 route 一起落地 —— 它是 **Q6「返回導向」第一次真正被實作**:
> `router.back()`,無歷史時 fallback 到該區入口,不採 DP 的 `?from=` query。

`/history`(已於 1.5 完成)→ `/explore/mvs` → `/explore/songs` → `/watch` → `/song/play` →
`/profile` + `/settings` → `/creator` → Credits IAP → `/mv/room`(最大)→
`/mv/thinking` + `/mv/storyboard` → `/mv/result` → `/mv/edit` →
`/song/create` + `/song/creating` + `/song/result`

每個畫面固定作法:**保留** WA 的 provider 呼叫、flow-guard、credits 扣款、auth gate、job polling;
**替換** JSX 結構與 class 名;**逐條比對** §8 差異,發現新差異就記錄,不自行決定。

**Gate(每個 route):** G1 + G4 + **G5(含行為回歸清單)** + G6 + G7。

#### Slice 3b — `/explore/songs` + `/song/play` ✅ **完成 2026-08-05**

下面 pre-flight 的四個決定全部照做,並且**沒有一個在實作時被推翻** —— 但 pre-flight
漏了兩件事,兩件都是「照搬就會默默弄壞 spec」的那一類:

- **S21(新):DP 的 transport 沒有 shuffle / repeat**,而 `AC-EXP-05` 明文要求。
  產品拍板照 DP 刪掉 → `DESIGNER-TODO.md` A7 + spec 回寫。這是 A4 的教訓第二次出現:
  截圖看不出少了兩顆按鈕,`e2e` 也不會紅,**只有逐條比對 spec 才會發現**。
- **EXP-09(既有 spec 行為)在合併後無處可去**。`?id=cps-*` 從 `/creator` 進來,
  那些歌不在三個 tab 的任何一個裡。產品拍板:**左清單切成 `CREATOR_SONGS`**,
  點任一 tab 切回社群目錄,`activeTab === null` 表示這個狀態(所以 `Tabs` 改收 `null`)。

**實作上與 pre-flight 不同的一處(pre-flight 想得不夠細):** pre-flight 說手機點歌
`router.push`、桌機「只換右欄」,但沒說桌機的 `?id=` 怎麼寫。**桌機一個字都不能寫進 URL** ——
`router.replace('/song/play?id=')` 會讓 `/explore/songs` 悄悄變成 `/song/play`,
那正是這一支要消滅的跳頁。所以 active song 是 **state**,URL 只當起始值,
並記住「這個選擇是對哪個 `?id=` 做的」,`?id=` 一變就讓位(寫成推導,不是 effect 改 state)。
prev/next 同樣走 state:若它們推 URL,手機播放器的返回就會變成往回跳歌而不是回清單。

**三個 SSR 危險讀取都照 pre-flight 的表處理,而且 `createPortal` 那一列真的會擋 build。**
另外**多修了一處 pre-flight 沒點到的**:`audio.play()` 的 rejection 一定要 catch ——
冷載入沒有 user activation 時它必然 reject(`NotAllowedError`),
未處理的 rejection 就是一個 console error,而 R-2 那三支測試斷言 console 是空的。

**`useMediaQuery` / `useIsMounted` 抽成 `src/lib/ssr.ts`。** pre-flight 要求
「改走已定的 media-query hook,不要兩套來源」—— 但那個 hook 不存在,3a 是內嵌在
`MvGrid` 裡的。所以這一支抽出來,並把 3a 那份改成呼叫它(照 `DpIcon` 在第二個畫面抽出的前例)。

**`useMountTransition` 沒有搬,而且是想清楚之後決定不搬。** DP 用它是為了讓
`LyricsSheet` 關閉時還能播完退場動畫。但它的關閉態是 `opacity: 0; pointer-events: none` ——
眼睛和滑鼠看不到,**tab 順序和螢幕閱讀器看得到**。所以改成:常駐掛載 + 關閉時 `inert`
(React 19 原生支援),退場動畫自然兩個方向都會播,而且不會多一個隱形的可聚焦 dialog。
**這件事是測試量到的,不是推論**:第一版沒有把 `LyricsSheet` 限定在手機播放器開啟時才掛載,
`/explore/songs` 上的 `getByRole("dialog")` 當場解析到兩個元素。

**A1 的預言成真了 —— 而且不是靠補登入測試。** A1 早就寫下「現在沒被擋是因為測試有覆蓋缺口,
免得日後看起來像突然壞掉」。`/explore/songs` 與 `/song/play` **沒有 `AuthGuard`**,
所以它們的 tab 列是 axe 第一次真的量到的那一列:`.tabs__tab--active` 白字壓品牌紫,
**3.95:1,與 A1 表上的數字一字不差**。依 A1 選項 2 的既有慣例加進 `a11y.spec.ts` 的排除清單
並註解指回 A1 —— **沒有自己挑顏色**。這不是 3b 造成的。

**A8(新):`TopSongListItem.css` 一條 media query 都沒有。** 六寬度視覺檢查量到
320px 的標題被截到只剩 1–2 個字元(「P…」「C…」),375px 約 10 字。
手機上這份清單是 Explore 的頂層目的地,**在最小支援寬度是不能用的**。
沒有自己改配置(那是替設計師決定版面),記進 `DESIGNER-TODO.md` A8 要手機 frame。

**順手修掉一個擋 Stop gate 的 G2-a 缺陷(見 §5 的 G2-a 列)。** token map 的生成物
把絕對路徑寫進去,所以 `--check` 在第二台機器上一定失敗,而且謊稱是 token 動了。
改成 git-root 相對路徑,token 資料逐位元組不變。

**G7 抓到兩個真的缺陷,而且兩個都是「同一份文件裡剛寫下的教訓,自己沒套用」。**
這是 §10.7「建置者不得自我認證」最好的一次辯護:兩者都在自我回報「82/82 全綠」之後才浮出來。

1. **桌機歌詞遮罩關閉時仍可被 Tab 聚焦。** `.now-playing__lyrics-overlay` 的關閉態是
   `opacity: 0; pointer-events: none` —— **正是本 slice 為 `LyricsSheet` 加 `inert` 的那個理由**,
   但同一個畫面上的第二個遮罩漏了。已加 `inert={!showLyrics}`。
   **有量測**:掃 1440px DOM 找「可聚焦但不可見且不在 `[inert]` 內」的節點,修前恰好回傳
   `now-playing__lyrics-close`(「Close lyrics」)一個,修後回傳空陣列。
2. **切換瀏覽 tab 會換掉並重啟正在播的歌。** Now Playing 的預設值是即時從
   `displayedSongs[0]` 推導的,而使用者明確點過的歌是黏著的 —— 所以**只有在還沒點任何歌時**
   才會發生,一般點來點去的驗收永遠碰不到。
   **根因正是本 slice 自己記過的那個 DP 差異卻沒追到底**:DP 四個 tab 是**同一份** catalog 的
   四種排序,即時推導無害;WA 三個 tab 是**三份不同**的 catalog。
   **有量測**:`/explore/songs` 什麼都不點,All → New Releases 讓 Now Playing 從
   「Pop Anthem」變成「Down the Memory Lane」,並觸發載入 effect 重新播放。
   已把 `defaultId` 在掛載時凍結,並補一支 e2e(`switching a browse filter does not change what
is playing`)—— 依 A4 的教訓,由行為測試守,不是由「我注意到了」守。

**Gate:** typecheck ✓ lint ✓ test:run 84 ✓ build ✓ · `designer:check` 19 檔全 verbatim ✓ ·
G1-b greps ✓ · **G2-a ✓**(修好後才真的會過)· G4 契約零 diff(`src/lib/api/`、`types.ts` 未動)✓ ·
G4-g ✓ · **e2e 83/83**(69 → +14 本 slice)· 六寬度截圖已看過。
**桌機不跳頁那一支做了 mutation test**:把 `setSelectedId` 換回 `router.replace` → 該支當場紅在
`toHaveURL` 那一行,反轉後恢復綠。
**e2e 曾經紅過一次 `G5-d#2`,那是機器負載造成的,不是 bug** —— 當時三支 review subagent
各自在跑 chromium。單獨重跑綠、機器閒下來全跑也綠。已把這個陷阱記進 `AGENTS.md` 的 e2e 段。
**G7 獨立驗收(已跑,結論如下):**

- **`code-reviewer` → FAIL,一條確認的 spec/code 分歧,已修。** 這一支把 `AC-EXP-05` 改得很仔細,
  卻漏了它的兄弟條目:`AC-EXP-03` 與 journey `EXP-P3-S1` 仍宣稱「歌曲卡一律導向 `/song/play?id`」,
  在桌機已經是假的。順帶發現 §3.2 / §3.4 整段仍在描述已刪除的 `CommunitySongPlayer`,
  **而且 §3.2 的 `/explore/mvs` 那行是 slice 3a 留下的同類漂移**(還寫成 2/3/4 欄 grid)。全部已修並註明日期。
- **`design-reviewer` → REMEDIATED**,確認 A8 的數字精確、1:1 分欄在 1024/1440/1920 完全相等、
  ≥1920 的 stats reflow 正確、手機播放器在 ≥768 確實 `display:none`。
  **但它唯一的新發現是錯的,已實測推翻:** 它說 `.now-playing` 的 `top: 124px` 比 navbar 矮 6px
  導致封面被切掉。實測 navbar 高 **138px**,容器確實重疊 14px,**但容器沒有背景且有 20px padding,
  第一個可見子元素(封面)落在 144px —— 比 navbar 底部低 6px,是「淨空 6px」不是「被切 6px」**,
  方向與結論都相反,沒有任何東西被裁切。
- **`a11y-checker` 兩次都被 API 錯誤中斷,沒有產出報告 —— 這一項仍是空白。**

**追查那 6px 時撞到一個真正嚴重、而且 reviewer 沒看出來的問題 → `TODO.md` #4。**
截圖顯示歌曲列表**清晰地**穿過 navbar 下半部,與 Back 鍵和 tabs 疊在一起無法閱讀。
根因不是 DP 也不是這一支:**production build 把標準的 `backdrop-filter` 砍掉,只留過時的
`-webkit-` 前綴,而 Chrome 149 完全不認前綴版**(已用同一顆 chromium 兩邊對照實測)。
DP 的 navbar 背景是「不透明漸層到全透明」,靠那層 blur 撐可讀性 —— blur 從來沒生效過。
**影響 19 支 designer stylesheet 中的 13 支**,不是這個畫面的問題。
`/history` 之所以從沒暴露:它在 1440×800 根本不會滾動(`scrollHeight` 等於視窗高)。
**沒有在這一支修**:改 build 設定會一次改動所有已移轉畫面的外觀,要自己的 slice 與自己的基準;
**也刻意沒有用 `designer-overrides.css` 把 navbar 塗成不透明** —— 那是遮症狀,留下另外 12 支。

<details>
<summary>原 pre-flight 與拆法決定(保留,實作即照此進行)</summary>

#### Slice 3b 的原始 pre-flight:**§2.1 的拆法在這裡行不通,已改**(2026-08-05)

§2.1 原本把 `/explore/songs` 寫成「取 `SongDetailPage` 的**清單區塊**」,`/song/play` 另外一條。
**照做會得到半個設計。** `MVDetailPage` 能拆是因為它的播放器是**整寬、疊在**整寬 grid 上面;
`SongDetailPage` 不是 —— 它在 ≥1024px 是 **1:1 雙欄**:

```css
@media (min-width: 1024px) {
  .song-detail {
    flex-wrap: nowrap;
  }
  .song-detail__lists {
    flex: 0 0 calc(50% - 20px);
  } /* 清單 = 左半 */
}
```

`SongDetailPage.tsx:575-603` 的 `.song-detail__lists` 與 `<NowPlaying>` 是**兄弟節點,
共用同一份 `activeId` / `playing` / 同一個 `<audio>`**。CSS 註解自己引了 Figma
1409:34847 / 1778:28997:「兩個等寬 516px 欄位,真正的 1:1」。只搬左欄 =
1440px 下右半邊空著。

兩邊的模型本來就不同:**WA** 是 `/explore/songs` 清單 → 點擊 `router.push("/song/play?id=")`
(`SongExplore.tsx:40`);**DP** 是同一個畫面,桌機點歌只換右欄不導航,手機才開全螢幕播放器。

**決定(2026-08-05,產品負責人):兩條 URL 共用同一個移轉畫面。**
`/explore/songs` 與 `/song/play` 都渲染 DP 完整的 `SongDetailPage`(清單 + 播放器雙欄),
差別只在 `?id=` / `?tab=`。

- **C7 契約零 diff** —— 兩個 `page.tsx` 都保留,URL 形狀沒變,G4-c 照樣過,
  現有指向這兩條 URL 的連結全部照常運作。這是選這個做法而不是「合併成一條 route」的關鍵理由。
- **行為變更:桌機點歌不再跳頁,改成換右欄。** 需要自己的 e2e。
- **`SongDetailPage.tsx:473` 在 render 期讀 `window.location.search`** —— R-2 同一類的
  SSR 危險讀取(不同形狀:不是 `matchMedia`)。WA 一律改用 `useSearchParams`。
- 這一支只需要 `TopSongListItem`,**不需要 `ListItem`**(該頁沒用到)。
- 必須保留 WA 既有行為:歌詞、Create MV from song、share、like、credits 守門。

##### 3b 的 pre-flight(2026-08-05,開工前對 code 實測)

**A5 不擋這一支 —— 已實際讀過 DP 的 code 確認。** `SongDetailPage` 自帶一個全螢幕
`MobileNowPlaying`(`SongDetailPage.tsx:269-470`),而且它**有自己的返回鍵**
(`icArrowLeft` → `closeMobilePlayer()`)。`/watch` 之所以被 A5 擋住是因為 `MVDetailPage`
沒有這個東西,不是因為「所有 detail 畫面都沒有」。清單那一半在手機上是 Explore 的頂層目的地
(底欄可達),本來就不需要返回鍵。

**手機全螢幕播放器的機制要換掉,行為保持一樣。** DP 是
`window.history.pushState({...}, '', '/song-detail?id=…')` + `popstate` 監聽 + `history.back()`。
WA 改成:手機點歌 → `router.push(localePath(locale, '/song/play?id=…'))`,
**「播放器是否全開」由 `?id=` 是否存在決定**,返回沿用 3a 的 `navHistory.ts`
(有歷史 → `router.back()`,冷開 → fallback 到 `/explore/songs`)。
這剛好與「兩條 URL 共用同一畫面」的決定咬合:桌機 `?id=` 只是選中右欄,手機 `?id=` 是全螢幕 ——
**與 DP 自己的規則一致**(它的註解就寫 explicit `?id=` deep link 直接開全螢幕播放器)。
`pushState` 與 `popstate` 兩者都不要搬,`window.location.href =` 兩處(`:187`、`:367`,
指向 creator)一律換成 `next/link` + `localePath()` —— 那兩處會被 G1-b 硬擋。

**SSR 危險讀取在這一支有四處,只有一處是 R-2 的原形:**

| 位置                    | 形狀                                                     | 後果                                                  | 作法                                         |
| ----------------------- | -------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| `:337` / `:468`         | `createPortal(…, document.body)` **render 期無條件執行** | **SSR 直接拋錯**,不是 hydration 不一致 —— 比 R-2 更硬 | mounted flag,掛載後才 portal                 |
| `:473`                  | render 期讀 `window.location.search`                     | 同 R-2 類(不同形狀)                                   | `useSearchParams` + `<Suspense>`             |
| `:533`                  | `selectSong` 裡讀 `matchMedia`                           | 在事件處理器內,**其實是安全的**                       | 但仍改走已定的 media-query hook,不要兩套來源 |
| `:119-123` / `:322-326` | `pointermove`/`pointerup` 在 effect 內                   | 良性(本來就 SSR-safe)                                 | 照搬                                         |

> ⚠️ 第一列是新發現,§4 Phase 3 的 pre-flight 只提到 `matchMedia` 與 `window.location.search`。
> **`createPortal` 那兩處會讓 `next build` 當場失敗**,不是靜默問題 —— 但也因此不會被漏掉。

**S3 在這一支一併實作(2026-08-05,產品負責人)。** §1.4 早就判定取消 30 秒試聽門檻,
但 code 從沒改:`CommunitySongPlayer.tsx:22` 與 `SongDetail.tsx:14` 都還有
`FREE_PREVIEW_SEC = 30`,`e2e/behaviour-regressions.spec.ts:266` 還在斷言**門檻存在**。
3b 正好重寫其中一支,所以:

- 移轉後的畫面**沒有** 30s 上限、沒有 `maxPct` 夾擠、沒有 seek 觸發的 `SubscribeModal` 導購。
- **`G5-d #7` 的 preview 半段依 §5 反轉**成「播放不設上限」,清單維持 10 項。
- **High 畫質(S1)那半段留給 `/mv/room` slice** —— 它住在還沒移轉的畫面,不在這一支動。
- `SongDetail.tsx`(`/song/result` 用)的 `FREE_PREVIEW_SEC` **本支不動**,它屬後面的 slice。

**音訊改接真的 `<audio>`,URL 在 presentation 層推導(2026-08-05,產品負責人)。**
`CommunitySongSchema` 是 **C2,凍結**,沒有 `audio` 欄位;而 DP 整個播放器是繞著真 `<audio>` 建的
(`duration` / `currentTime` / `onEnded` 全來自它)。WA 現況是 `setInterval` 假進度 + 寫死
`DURATION = 125`。作法**照 3a 的 `ratio` 前例**:在 `community.ts` 依 id 一次指派到現有的
2 個 mp3(`public/assets/songs/`),**契約零 diff**。等 API 長出 `audio` 欄位再換掉。
代價已知並接受:所有歌只有 2 種聲音 —— 這是 demo 媒體(U4)的限制,不是這個做法的缺陷。

**Tab 組成:取 3 個,不搬 Trending。** DP 是 4 個
(`All` / `Top Picks` / `Trending` / `New Releases`),但**它自己的註解說那是假的** ——
「no real per-tab data exists to actually filter by」,四個 tab 只是把同一份 catalog 用不同方式
重排。WA 有兩份真資料,所以:`All` ← 兩份合併、`Top Picks` ← `TOP_PICKS_SONGS`、
`New Releases` ← `NEW_SONGS`,**`Trending` 不做**(沒有對應的真資料)。
與 3a「兩個 section 接真資料」同一個判斷,記進 `DESIGNER-TODO.md` 問設計師 Trending 要餵什麼。

**歌詞面板:這一支帶 DP 的 `LyricsSheet`(105 行 + 230 行 CSS),WA 既有的 `LyricsPanel` 留著** ——
它還被未移轉的 `/song/result` 與 `CreationDialog` 用著,刪它是後面 slice 的事。

**預計動到的檔案:**

- **新增** `src/styles/designer/SongDetailPage.css`(965 行)、`TopSongListItem.css`(239)、
  `LyricsSheet.css`(230)—— 三支逐位元組複製;`src/components/ui/TopSongListItem.tsx`、
  `src/components/ui/LyricsSheet.tsx`;`src/components/song/SongDetailView.tsx`(合併後的畫面)
- **改寫** `src/components/community/SongExplore.tsx` 與
  `src/components/community/CommunitySongPlayer.tsx` 併入上面那一支;
  `src/app/[locale]/explore/songs/page.tsx`(**目前沒有 `<Suspense>`,要加**)與
  `src/app/[locale]/song/play/page.tsx` 改指新 view
- **編輯** `src/styles/designer.css`(+3 `@import`)、`src/components/shell/AppShell.tsx` 的
  `OWN_CHROME`(+`/explore/songs`、`/song/play`)、`src/lib/mv/community.ts`(推導 audio URL)、
  `e2e/behaviour-regressions.spec.ts`(反轉 G5-d#7 preview + 新增桌機不跳頁 / 手機全螢幕 / 返回 fallback)
- **視覺基準** `explore-songs` 與 `song-play` 各六寬度 = 12 張重錄

**這一支的行為測試清單(不能只靠截圖 —— A4 的教訓):** 桌機點歌只換右欄且 URL 不跳頁 ·
手機點歌開全螢幕且返回回到清單 · 冷開 `?id=` 後返回落在 `/explore/songs` 而非走出 app ·
免費帳號可播到底(S3)· `?tab=` 選中對應 tab · Create AI Song 的 `requireLogin` 守門仍在。

**實際落地的清單比上面多 7 支(共 13 支):** 上列 6 項全數實作,另加
tab 切換真的換清單 · EXP-09 的 creator 清單 · EXP-06 not-found · R-9 locale 前綴 ·
R-2 hydration ×3(1440 / 1000 / 700)· A4 手機 tabs 可用。
**檔案清單與上面預估的差異:** 多了 `src/lib/ssr.ts`(抽出的 hook)、
`e2e/a11y.spec.ts`(A1 的排除清單)、`src/components/shell/RoomNavbar.tsx`(`Tabs` 收 `null`);
`SongExplore.tsx` 與 `CommunitySongPlayer.tsx` 是**刪除**而非改寫。
**視覺基準那 12 張沒有重錄** —— 見下面的說明。

> **⚠️ 視覺基準:12 張未重錄,而且不是遺漏。** `visual-baseline.spec.ts-snapshots/` 同時存
> `-linux` 與 `-darwin` 兩套。**Phase 1 以來的每一次重錄都只動 `-linux`**
> (`git log` 可查:`explore-mvs-1440-darwin.png` 最後一次變更是 `8452d37`,
> 移轉還沒開始),所以 `-darwin` 那 114 張早已是舊 UI 的存檔,不只這 12 張。
> 這一支是在 **macOS** 上做的,只能產出 `-darwin`,**產出來也對不上維護中的那條線**。
> 需要在 Linux 環境跑一次 `npm run e2e:visual:update`,把
> `explore-songs` / `song-play` 各六寬度收進 `-linux`。**這是 3b 唯一未完成的產出。**

</details>

#### Slice 3a — `/explore/mvs` ✅ **完成 2026-08-05**

範圍照上面的 pre-flight 走:只搬 `MVDetailPage` 的**下半**(`.mv-detail__grid*`),
`.mv-player*` 留給 `/watch`。帶進 `Card`(160 行)、`SectionHeader`、`DetailNavbar`,
以及 `computeJustifiedRows`。

**R-2 第二個實例已修並且有測試證明。** 套 Phase 1.5 的模式(SSR-safe 初值 + isomorphic
`useLayoutEffect`)。新增 3 支 e2e 在 1440 / 1000 / 700 斷言 console 零 error ——
hydration 失敗是 console error 加上被默默修掉的 DOM,**視覺測試看不到它**,所以要直接斷言。
全 DP 的這個 pattern 至此**兩支檔都已修完,沒有第三支**。

**`ratio` 沒有進 schema(照 §5 的契約紀律)。** DP 的 justified 版面吃 `mv.ratio`,
WA 的 `CommunityMvSchema` 沒有這個欄位 —— 而它是 **C2,凍結,G4-a 零 diff**。
實際去讀 DP 的來源:它自己也是 `RATIOS[index % RATIOS.length]`,**不是真資料**。
所以改在 presentation 層推導(`community.ts` 的 `mvCoverRatio()`,依 id 一次指派),
**契約零 diff**。等 API 真的長出這個欄位再換掉。

**兩個 section 接真資料。** DP 靠「把同一份 catalog 反轉」湊出第二段,因為它只有一份;
WA 有兩份真的:Top Picks ← `TRENDING_MVS`,Newly Released ← `NEW_MVS`。

**Q6 第一次真正被實作 —— 而且第一版是錯的,被測試抓到。** 第一版用
`window.history.length > 1` 判斷「有沒有歷史」。它**看起來對,實際是錯的**:
那個數字包含 app 之前的那一筆(新分頁、上一個網站、Playwright 的 `about:blank`),
所以**冷開一個 detail URL 也會宣稱自己有歷史**,`router.back()` 直接走出 app ——
正好是 fallback 要防的那件事。測試當場停在 `about:blank`。
改用 `src/lib/navHistory.ts`:模組層計數 client-side 導航,整頁載入自然歸零,
**這正是要問的問題**。不用 per-tab web storage(G1-b 禁,且會糊掉 C5 的邊界)。
兩個方向的變異測試都做了(恆真 → 冷開那支紅;恆假 → 有歷史那支紅)。

**手機上撞到 A4 / A5(見 `DESIGNER-TODO.md`)。**

- **A4 是一個已經進版的回歸,不是這個 slice 造成的。** DP 的 `AppLayout.css` 在 <767px
  把所有 navbar 藏掉,而 **slice 2b 把 History 的篩選 tab 搬進了 `RoomNavbar`** ——
  於是**手機上 History 的 All/MV/Songs/Liked 整組消失**(DOM 在,`display:none`)。
  Liked 是有 spec 的行為(HIST-03)。2b 當時六個寬度的基準全部重錄,**等於把這個損失一起收下了**。
  已用 `designer-overrides.css` 的 `:has()` 只放回「有 tabs 的 navbar」,`__top` 維持隱藏,
  並補 7 支 e2e。**教訓:視覺基準重錄會吸收掉功能損失 —— 行為要由行為測試守,不是截圖。**
- **A5 擋 `/watch`:** 手機 detail 畫面沒有任何返回途徑(見上面 CH2 的修正框)。

**視覺基準變動 8 張,而且剛好只有這 8 張:** `explore-mvs` 六個寬度(刻意改版)+
`history` 的 **320 / 375**(A4 override 放回 tabs 列)。`history` 的 768/1024/1440/1920
**一張沒動** —— 反過來證明 override 只作用在手機分支。其餘 17 條 route 全數未動。

**Gate:** typecheck · lint · test:run(84,含 8 支 `justifiedRows` 單元測試) · build ·
G1-b · G2-a · D1-verbatim · G4 全綠;**e2e 69/69**(53 → +9 本 slice → +7 A4)。
`e2e:visual` 115/115(8 張已重錄)。

### Phase 4 — 待設計師補件

`/mv/creating`、`/share`、Profile 頭像上傳 + 裁切、landing page。

### Phase 5 — V2

Blog、AI Storybook、S9 語言擴充。

---

## 5. 對既有 Gate 制度的修訂

08-01 §10 的 G1–G7 continue to apply。本次**只改這四處**:

| Gate          | 修訂                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **G1-b**      | **新增** `<a href="/` grep(R-9)。既有 5 條(`import.meta`、`fetch(`、`MockMuseApi`、`sessionStorage`、`window.location.href=`)全部保留                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **G5-d #7**   | **反轉**:從「Pro 門檻(High 畫質 crown、30 秒試聽)存在」改為「**High 對免費帳號可選、播放不設上限**」。清單維持 10 項。**分兩次落地(2026-08-05):播放上限那半段已在 Slice 3b 反轉** ✅ —— 測試改名為 `S3 / G5-d#7 inverted`,除了斷言導購文案消失,還實際把 `<audio>` seek 到 90% 並斷言 `currentTime > 30`(只斷言文案不見的話,把元件刪掉也會通過)。**High 畫質那半段仍等 `/mv/room` slice**,`Pro gate: High` 那支照舊有效                                                                                                                                                       |
| **G5-d 新增** | S2(30 秒 trim 下限)與 Q2(中間頁不進歷史)各需一個 e2e                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **G2-a**      | 已生效(generator 預設路徑改指 in-repo DP)。此前它在所有非設計者機器上都是靜默 skip。**2026-08-05(Slice 3b)又修一次,同一個病的另一面:** 生成物把**絕對路徑**寫進去(`/home/user/musemv-ai/…`),而 `--check` 是整檔比對 —— 所以它在**任何第二台機器上都會失敗**,錯誤訊息還說「tokens moved without regenerating」,而 token 一個都沒動。在 macOS 上直接擋住 Stop gate。**改成輸出 git-root 相對路徑**(日期本來就已被 `strip()` 排除,同一個理由),token 資料逐位元組不變。若當時選擇「重新生成了事」,只會把失敗甩給下一台機器 —— 就是 `-darwin`/`-linux` 視覺基準現在卡住的那個乒乓 |

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
