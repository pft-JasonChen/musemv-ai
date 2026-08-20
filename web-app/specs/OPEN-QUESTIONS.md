# 待確認事項總表(Open Questions — 仍待處理項目)

> **權威來源:** 每項的完整說明記在該領域 spec 的第 8 節(或全域在 `00-overview.md` 第 9 節)。這份檔案
> 只彙整**跨領域**且**仍待你或設計師拍板**的項目;已定案並已實作的項目不再列出(見各 spec 的現況描述)。
>
> **圖例:** ⏸ Phase 2(MVP 不做)· 📄 只補 spec、後端由 RD 之後實作(Curation)· 🔧 後端實作(RD)·
> ⏳ 仍待議/待設計。

---

## 🚦 可以交接給 RD 了嗎?(2026-08-12 盤點)

**一句話:生成(MV / Song)那一半可以交,社群(Explore / Community)那一半不行 —— 而缺的是「還沒寫的
section」,不是「小的 UI 問題」。**

### ✅ 已經 RD-ready

- **MV + Song 生成全流程** —— `MuseApi` 6 個 endpoint、job 輪詢模型、Zod schema 即 wire contract、
  `MockMuseApi` 可整包抽換(`src/lib/api/index.ts` 一行)。契約面 C1–C8 已凍結並有 snapshot 測試。
- **Credits / IAP 的 UI 與規則** —— 方案、點數包、CR-06 訂閱閘、GL-01 餘額不足導購,全部有 spec 與
  e2e。(**但數字還不能用 —— 見下方 CC-05。**)
- **Auth 模型、i18n(9 語)、routing、shell、History** —— 形狀都已定義,RD 只需接真實後端。
- **11 個 area spec 全部存在**;其中 01/02/05/06/07/09/10 於 2026-08-12 逐行對照過 code。

### 🔴 交接前必須補的 —— 這兩項是硬阻礙

| # | 缺什麼 | 為什麼擋住 RD |
| --- | --- | --- |
| **1** | **整條 Explore / Community 的 API 契約**(`TBD-GL-05` / `TBD-EXP-01` / `TBD-EXP-07` / `TODO.md` #1) | `MuseApi` **完全沒有** community endpoint(feed / detail / like / share / publish / creator)。**17 個元件、橫跨 9 條 route** 目前跑在 `src/lib/mv/community.ts` 的寫死種子上。schema(`CommunityMv` / `CommunitySong` / `CommunityCreator`)有了,消費它們的介面沒有。**來源 PRD `ycmuse-app-skill/YouCam_Muse_Explore_Curation_PRD - V2.pdf` 至今未讀。** 這是「未出現的 section」本身。 |
| **2** | **扣點 payload 的欄位契約**(`TBD-CC-06`) | cloud config 2026-08-12 把 `consumedType` 全改為 `"credit"`,**前端須自行帶數量／秒數**(原由後端從 task 取得)。欄位名、單位(秒?結果數?)、委派型 action(`create_mv`/`generate_mv`/`edit_mv`)的數量要對應到哪個 sub action —— 全未定。**RD 拿到也寫不出扣點呼叫。** |

### 🟠 交接前最好補的 —— 不補 RD 會照錯的數字實作

| # | 缺什麼 | 風險 |
| --- | --- | --- |
| ~~**3**~~ | ✅ **2026-08-19 全部結案** — 六個 placeholder 已全數依 `areas/11` 重算。`COST_STORYBOARD` / `COST_RENDER` / `COST_REGEN` **已刪除**,改為 `scriptCost()` / `createMvCost()` / `generateMvCost()` / `recreateShotCost()` 四個依規格計算的函式;Merge 改為固定 10。**這四個函式就是接後端時唯一的替換點**,`contract.surface.test.ts` 用規格自己的計算範例(225 / 95 / 28 / 12·15·18)鎖住它們。詳見 `docs/CHANGELOG-RD.md` 2026-08-19。 |
| ~~**4**~~ | ✅ **2026-08-12 結案** — `enhanceCost` / `consumeEnhance` 已從 `useCredits` 移除,費用徽章也拿掉。⚠️ 這是 **C4 的刪除**(C4 原則只可新增),刻意為之並記在 `CHANGELOG-RD.md`。 |
| ~~**5**~~ | ✅ **2026-08-12 結案** — `DEFAULT_CREDITS = 10`。⚠️ 10 **做不出任何 MV**(最便宜 220),免費帳號生一首人聲歌就撞到付費牆 —— 這是刻意的漏斗。demo 另有 `NEXT_PUBLIC_DEMO_CREDITS` 環境變數可覆寫。 |

### ⚪ 不擋交接(但要讓 RD 知道)

- **a11y A1–A5 驗收從未完成** —— 唯一跑過又被作廢的驗證(環境壞掉,`PHASE-3-ACCEPTANCE` §6/§7.1)。
  這是品質缺口,不是契約缺口。
- **`e2e/a11y.spec.ts` 三個盲點**:不 seed 登入(4 條 guarded route 只掃到登入牆)、只有桌機寬度、
  只掃英文未加前綴的路由。
- **`DESIGNER-TODO` A1–A26 多數仍開** —— 依 2026-08-06 的 scope rule 刻意保留給下一版設計稿,
  **不是漏做的工**。

---

## ⏸ Phase 2 — MVP 不做,放進 Phase 2 待辦

| ID        | 領域 | 說明                                            |
| --------- | ---- | ----------------------------------------------- |
| TBD-GL-03 | 全域 | Onboarding / Splash 網頁版先不做,之後可能新增。 |
| TBD-MV-03 | MV   | 多臉自動偵測延後;MVP 維持手動裁切。             |

## 📄 只補 spec、不改 codebase — Curation(後端由 RD 之後實作)

| ID          | 領域    | 說明                                                                          |
| ----------- | ------- | ----------------------------------------------------------------------------- |
| TBD-GL-05   | 全域    | Curation 排序 + 審核為後端 track;只補 spec,不動 code。                        |
| TBD-EXP-01  | Explore | 4 條內容軌的評分/資格/更新/去重(依 Curation PRD)。                            |
| TBD-EXP-07  | Explore | Publish→動態牆 + AI/人工審核 + 管理員置頂(依 Curation PRD)。                  |
| TBD-MV-06   | MV      | Publish 前端確認流程已完成;後端審查 pipeline 仍未定義(同上,依 Curation PRD)。 |
| TBD-HIST-04 | History | Publish = 確認→送審→上社群 的前端流程已完成;後端 pipeline 仍未定義(同上)。    |

## 🔧 後端實作 — RD 負責(prototype 維持 mock)

| ID            | 領域               | 說明                                                                                                                                                                                                                                                                                                        |
| ------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TBD-CC-06** 🔴 | **Credits / 契約** | **交接阻礙。** cloud config 2026-08-12 把 `consumedType` 全部改為 `"credit"`,產品負責人確認**前端須自行在 payload 帶數量／秒數**(原本由後端從 task 取得)。欄位名、單位、委派型 action 的數量對應皆未定 —— 前端無法實作扣點呼叫。詳見 `areas/11` §「數量由誰提供」。 |
| **TBD-EXP-11** 🔴 | **Explore / 契約** | **交接阻礙。** `MuseApi` 完全沒有 community endpoint(feed / detail / like / share / publish / creator),但 17 個元件、9 條 route 跑在 `lib/mv/community.ts` 的寫死種子上。schema 已存在(`CommunityMv` / `CommunitySong` / `CommunityCreator`),消費它們的介面不存在。來源 PRD 尚未讀。見 `TODO.md` #1。 |
| ~~TBD-GL-06~~ | 全域 / i18n        | ✅ **2026-08-19 結案 — V1 的範圍是「路由不壞」。** 翻譯尚未進場（8 個字典刻意留空、逐 key fallback 英文），所以 V1 要守的是 **9 個語系前綴都能正確解析、且導航不掉前綴** —— 這已有 e2e 覆蓋（`G5-d#9`、R-9 相關）。實際的文案 QA 等翻譯入庫後重新定義。 |
| ~~TBD-GL-07~~ | 全域 / Auth        | ✅ **2026-08-19 結案 — 完全公開。** 任何人拿到分享連結都能觀看與下載，不需登入。連結**永不過期**（同日決定，見 `areas/10` §3）。 |
| TBD-GL-04     | 全域               | 正式環境的狀態持久化(history、storyboard、credits、subscription、profile 皆需接後端)。                                                                                                                                                                                                                      |
| TBD-CR-01     | Credits            | 真的 IAP(App Store / Play Store)。                                                                                                                                                                                                                                                                          |
| TBD-CR-04     | Credits            | 真實點數帳本(`/profile/credits` 目前是靜態假資料)。                                                                                                                                                                                                                                                         |
| TBD-AUTH-01   | Auth               | 真的登入整合(供應商、session/token)。                                                                                                                                                                                                                                                                       |
| TBD-PROF-01   | Profile            | 通知推播串接。                                                                                                                                                                                                                                                                                              |
| TBD-PROF-02   | Profile            | 意見回饋送出的目的地。                                                                                                                                                                                                                                                                                      |
| TBD-PROF-04   | Profile            | 真的取消訂閱 + 真的刪除帳號。                                                                                                                                                                                                                                                                               |
| TBD-PROF-05   | Profile            | 真實統計資料來源(目前是靜態 `SAMPLE_CREATIONS`)。                                                                                                                                                                                                                                                           |
| TBD-SHARE-01  | Share              | 伺服器端分享連結解析。**「真的到期」已於 2026-08-19 移除** —— 連結永不過期,只需要能解析。 |
| TBD-EXP-08    | Explore            | 真實 like/share/play 計數持久化(登入門檻已完成)。                                                                                                                                                                                                                                                           |
| TBD-SONG-06   | Song               | 正式環境的歌曲失敗觸發機制。                                                                                                                                                                                                                                                                                |
| TBD-EXP-10    | Explore            | **完全由 RD 負責(產品負責人 2026-08-20)。** Publish/feed 的語系排序與 language code 格式由 RD 端到端決定與實作,**前端不處理、也不預期要傳**。刻意不列為前端缺口,以免 RD 誤以為在等我們。 |

## ⏳ 仍待議 / 待設計 — 這 7 項還需要你或設計師後續拍板

| ID           | 領域    | 待處理                                                                            |
| ------------ | ------- | --------------------------------------------------------------------------------- |
| ~~TBD-MV-07~~ | MV      | ✅ **2026-08-20 結案 — 不需要 carousel。** DP 的三張類型卡各自播放 `feature_intro_*` 影片,那就是類型介紹;carousel 是遷移前的舊描述。 |
| TBD-MV-11    | MV      | ⚠️ **描述已過時(2026-08-19 查證)** — 空狀態 UI **已經實作**(`ChooseSongModal.tsx:116-131`,含 Create Song CTA),只是 `MY_SONGS` 固定兩筆讓它永遠碰不到。是「已建但死碼」,不是「未實作」。 |
| TBD-SONG-07  | Song    | 歌詞生成支援的語言清單。                                                          |
| TBD-EXP-03   | Explore | 🎨 **V1 要做,等設計稿(2026-08-19)** — MV 播放器 9:16↔3:4 切換 + 上滑看下一支。桌機上「上滑」對應什麼互動尚未設計,見 `DESIGNER-TODO` **A26**。 |
| TBD-EXP-05   | Explore | 真實多元創作者 + 檢舉/封鎖。                                                      |
| TBD-AUTH-04  | Auth    | **Web 專屬**的訪客瀏覽/門檻規範(需詳細訂,不能直接照 App)。                        |
| ~~TBD-SHARE-02~~ | Share   | ✅ **2026-08-19 結案 — V1 只做複製連結。** 社群分享管道移到下一階段 roadmap。 |
| TBD-SHARE-03 | Share   | 📋 **BA 待設計(2026-08-19)** — 需要完整的成效追蹤,但收集哪些欄位由 BA 定義。前端刻意留空,不先猜著埋參數。 |
| ~~TBD-CR-06a~~ | Credits | ✅ **2026-08-19 結案** — 免費用戶起始額度定為 **10 credits**（產品負責人）。 |

---

## Proof of Creation — 已移除(不在 web 範圍)

2026-07-24:App F21「創作證明」決定不做,`/proof` 路由與 `ProofView` 元件已從程式碼移除,History 選單
的「Get Proof」也已拿掉。詳見 [`areas/08-proof-of-creation.md`](areas/08-proof-of-creation.md)。

---

## 近期結案(2026-08-12,留一行備查)

- **TBD-CR-10** — CR-06 訂閱閘曾於 2026-08-11 被設計稿單方面推翻(買點數不再需要訂閱)。產品負責人
  裁決 **spec 對**,code 已改回:免費用戶只能 Upgrade,訂閱後才變 Buy Credits。free user 版稿面仍
  待設計師(`DESIGNER-TODO` A21)。詳見 `areas/07-credits-iap.md`。
- **TBD-CC-01** — `create_script_upload_song` 的 `[1,40] = 12` 級距已補回,三階與 PDF 一致。
- **TBD-CC-02** — Edit MV 封面 Recreate 的後端 action 已補上,即 **`edit_poster`**(每次 4 點)。

---

## PM 該去哪裡看(導覽)

- **這份檔案** — 跨領域、仍待拍板的項目彙整。
- **每份 `areas/<n>.md` 第 8 節** — 各領域仍待處理項目的完整說明。
- **`00-overview.md` 第 9 節** — 全域仍待處理項目 + 第 8 節 App→Web 對照表。
- **`index.html`** — 視覺化導覽首頁。
