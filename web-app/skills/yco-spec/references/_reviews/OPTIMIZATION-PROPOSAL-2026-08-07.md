# yco-spec 優化建議書 — 2026-08-07

**目的**：把 `skills/yco-spec/` 重新包裝成 `/skill-creator` 規格的 skill（含 eval）。
**審視樣本**：`Project/2026-07-03-template-spec` v1 (2026-08-06)，
`https://yco-prototypes.vercel.app/Project/2026-07-03-template-spec/specs/spec.html`
**方法**：1440px 逐屏截圖 19 張（證據在 `review-2026-08-07/`）＋ 解析 `cfg` 量化字數
＋ 展開 `specs/*.json` 實際 payload 比對資料契約覆蓋率
＋ 對照 2026-06-11 / 2026-06-30 兩份舊 review 的未結項。

**修訂紀錄**
- 2026-08-07 ①：依澄清重寫第 3 節 —— 「Layout」指的是 **JSON key → UI 欄位的
  mapping／值域**，非畫面排版；原畫面排版的發現降級為 §6 的 P2-d。
- 2026-08-07 ②：**3-B 定案為 5 欄**；新增 §4（Design Decisions 去留）、
  §5（QA checklist 去留）；第 8 節 Eval 依 [skill-forge](https://github.com/neokn/skill-forge)
  的 Tier 0–3 / delta 模型全面重寫（原「rubric 絕對分數」版本作廢）。
- 2026-08-07 ③：**9 題選項全數確認**，§10 改為決策紀錄，
  含明確延後項、已被吸收項、與實作順序的綁定關係。
- 2026-08-09：Phase 1–5 全部實作完成。QA-3 決定**不做**；scripts/assets 搬遷
  **不做**；P2（template switching）依 RD 定案移除，改為 D-27「換 template 一律
  不帶圖」，plan.md Slice 8 與 prototype 同步更新。

> **狀態：選項已於 2026-08-07 全數確認 —— 見 §10 決策紀錄。本文仍不含任何實作。**
> 各節的選項清單保留，作為決策的理由存證。

---

## 0. 總評（人類前端工程師視角）

先講結論：**骨架是對的，問題全在「密度」與「導覽」**。

path-storyboard 主軸、stable ID（`P1-S3`）、screenshot-first、per-path QA、
`validate()` build gate、prototype_deltas — 這些在市面上多數 AI 產出的 spec 之上，
不要動。

但以一個要拿這份文件寫 code 的 RD 來說，實際閱讀體驗有三個痛點：

1. **這份文件有 15,823px 高（1440 視窗約 16 屏），側邊導覽只有 9 個連結。**
   捲到 P1-S5 時，你不知道自己在哪、離結束多遠，也沒有辦法跳到指定 ID。
2. **全篇只有一種灰色。** 「必須照做的規則」和「為什麼這樣設計的說明」用同一種
   字級、同一個顏色、同一顆 bullet 呈現。RD 無法判斷哪句是合約、哪句是背景。
3. **每個 bullet 都在 20–38 字，且常常一顆 bullet 塞 2–3 個句子。**
   skill 自己的 language rule 寫「≤ 20 words，一句一事」，實際產出沒有守。
4. **資料契約只涵蓋 payload 的 7–9%。** 畫面上到處出現的模板名稱、排序、
   category 歸屬、產出比例，在 spec 裡都找不到來源 key（詳見第 3 節）。

量化證據（從 `build_spec.py` 的 cfg 直接統計，12 steps / 3 paths）：

| 欄位 | 平均字數 | 中位數 | 最長 | skill 自訂上限 |
|---|---|---|---|---|
| `user` | 15.4 | 13.5 | 32 | ≤ 20 |
| `system` (WEB UI) | 24.2 | 24.0 | 52 | ≤ 20 ❌ |
| `exact` (每顆 bullet) | 13.5 | 12.0 | 27 | — |
| `limits` (每顆 bullet) | **20.7** | 19.5 | **38** | ≤ 20 ❌ |
| `qa` (每條) | **32.1** | — | **45** | 「one pass/fail sentence」❌ |

`limits` 46 顆 bullet 裡，超過一半是複句。`qa` 平均 32 字已經不是一句可驗證的
斷言，而是一段敘述。

---

## 1. 問題一：贅字太多

### 1.1 實際案例（都來自現行 spec）

| # | 現況（原文） | 字數 | RD 真正需要的 | 字數 |
|---|---|---|---|---|
| a | 「Select-then-confirm is the site's existing dialog pattern. RD reuses it as-is — selection highlight, Cancel and Done all behave as they do elsewhere, and nothing about it needs configuring here.」 | 30 | 「Reuses the site's standard select-then-confirm dialog.」 | 7 |
| b | Error States 表 4 列裡，「Message shown to user」欄連續 3 列寫「Uses the site's standard …-error pattern (exact copy owned by the guideline). **All rows below reuse this same site-standard pattern; the exact copy is owned by the guideline.**」 | ×3 重複 | 粗體那句是表格層級的註解，寫在表格下方一次即可 | ×1 |
| c | 「A category shows a red dot while it holds any unseen template; the dot clears once that category is opened. A template shows an "N" badge until opened, keyed on its ACMS identity. Both persist across a reload.」 | 38 | 拆成 3 顆 bullet，各 8–12 字 | 3×10 |
| d | Path 2 desc：「Neither proposal deck shows this as its own screen — both states are visually the same control panel as Path 1 with different contents, so no screenshot is reused; behavior is described directly.」 | 33 | **整段刪除**。這是寫作者對自己的交代，RD 不需要知道為什麼沒有截圖。 | 0 |
| e | T1 表格「What the web does with it」欄單格 60+ 字的段落 | 60+ | 表格格子放結論，長解釋移到表格下 note | ~15 |

**根因**不是作者話多，而是 **schema 沒有給「說明/理由」一個位置**，所以理由只能
擠進 `limits` 和 `system`。要治本要先給它一個欄位。

### 1.2 選項

- **1-A｜validate() 硬性字數上限**
  `limits` 每 bullet ≤ 20 words 且僅一句（偵測句號數）、`system` ≤ 25、`qa` ≤ 25，
  超過即 build fail。
  ✅ 決定性、零判斷成本、可直接當 eval 檢查項。
  ⚠️ 太硬；少數規則（credit 計算、邊界條件）天生需要 25 字，會逼出更爛的縮寫。

- **1-B｜先 lint 後 gate（warn-only → 之後轉 hard fail）**
  build 完印出「Top 10 超標句子」報告，SKILL.md 補上「一顆 bullet = 一件事 = 一句」
  ＋ 上表 a–e 的 before/after 範例；等一個 feature 遷移完成後再轉 hard fail。
  ✅ 不會擋住現有專案。 ⚠️ warning 很容易被無視。

- **1-C｜schema 分離 normative vs. note（治本）**
  bullet 支援 `('rule text', 'why/context')` 或 `{'rule':…, 'note':…}`。
  render 時 rule 用深色主字，note 用小一級灰字（或 `<details>` 收起）。
  ✅ 直接解決「理由污染規則」，順便解決總評第 2 點的階層問題。
  ⚠️ 要改 builder＋schema，既有 4 份 spec 要遷移（可向下相容，note 省略即可）。

- **1-D｜刪除既有的三類贅字（一次性清理，不改引擎）**
  ① 所有「為什麼這樣寫 spec」的自述（案例 d）
  ② 表格層級重複句（案例 b）
  ③ `inp` 欄 12 步裡有 6 步是 `—`，整列可省略不 render

**建議組合：1-B + 1-C + 1-D**（1-A 當作 1-B 的第二階段）。

---

## 2. 問題二：storyboard 卡片格式與架構

### 2.1 現況卡片解剖（見 `review-2026-08-07/02_step_card_P1-S3.webp`）

```
[ P1-S3 badge ]
[ 截圖 — 840px 寬，內含 1440 全畫面 mockup，紅框 + hover tooltip ]
USER          | 粗體深色，一句
WEB UI        | 灰色，一段（平均 24 字）
ON-SCREEN TEXT| 灰色 bullet list
RULES & LIMITS| 灰色 bullet list
[ 選用 tables ]
Input: … Output: …
```

觀察到的具體問題：

| # | 問題 | 影響 |
|---|---|---|
| 2.1 | 左側 meta label 欄 9–10px 大寫灰字，佔 ~110px 寬 | 幾乎讀不到，卻吃掉版面；6 種 label 互相競爭 |
| 2.2 | `ON-SCREEN TEXT` 與 `RULES & LIMITS` 界線模糊 | 「filled slot 的 label 是 "Person"」在 ON-SCREEN TEXT，「placeholder 必須符合 T2」在 LIMITS，讀者要兩邊找 |
| 2.3 | `Input/Output` 12 步有 6 步 input 是 `—` | 每張卡固定多一列近乎零資訊 |
| 2.4 | **focus 標籤是 hover-only tooltip**，全篇 18 個標籤 | 列印、PDF、截圖轉貼到 Jira/Slack 時 18 條資訊全部消失。RD 只看到一個紅框，不知道框的是什麼 |
| 2.5 | 截圖是整個 app 畫面縮到 840px | 真正的重點（一個 slot、一顆按鈕）只佔 ~5% 像素，內文字約 7px，看不清 |
| 2.6 | 截圖在上、對應說明在下 400–500px 處 | 1440 寬螢幕右半邊全空，卻要上下捲動對照 |
| 2.7 | 沒有「進入狀態 → 離開狀態」 | State Inventory 在文件最底部，step 卡片本身不講自己屬於哪個 state |

### 2.2 市面上 spec 的做法（可參考）

- **Stripe / Shopify Polaris 的 behavior doc**：一律 `Trigger → Result → Rules`
  三段，欄位固定不超過 4 個。
- **Gherkin / BDD（Cucumber, Jira Xray）**：`Given / When / Then` 一行開頭，
  下面才是細節；QA 可直接抄成 test case。
- **Figma Dev Mode / Zeplin annotation**：圖上永久編號 ①②③，文字用同編號對應，
  列印也不會掉。
- **Google Material spec**：左圖右文兩欄，圖 sticky。

### 2.3 選項

- **2-A｜固定 4 區塊卡片（精簡 label）**
  `TRIGGER`（user 動作）→ `RESULT`（UI 呈現，吸收原 Output）→ `STRINGS`（原
  ON-SCREEN TEXT）→ `RULES`（原 LIMITS，只放數值與分支）。
  移除 `Input/Output` 列，`ON-SCREEN TEXT` 改名 `STRINGS`；label 字級 9→11px、
  顏色加深。
  ✅ 6 label 降到 4，界線用「字串 vs 規則」一刀切乾淨。 ⚠️ 既有 cfg 要對應改名（可留 alias）。

- **2-B｜左圖右文兩欄卡片（`card_layout: 'split'`）**
  ≥1200px 時圖左（sticky）文右；<1200px 自動退回現行上下堆疊。
  ✅ 用滿 1440，圖文不必上下捲。 ⚠️ 圖會變窄（~600px），2.5 的清晰度問題更嚴重，
  需搭配 2-E。

- **2-C｜每步開頭加一行 Given / When / Then**
  `Given FULL state · When 點 Generate · Then 進入 GENERATING 並切到 History`。
  ✅ 補上 2.7 的 state 缺口；QA 可直接轉 test case；skim strip 可自動由此產生。
  ⚠️ 與現行 `summary` 欄位重疊，要合併。

- **2-D｜圖上永久編號 pin 取代 hover tooltip**
  紅框旁畫 ①②，文字 bullet 前面帶同編號。`type: info` 用空心圈。
  ✅ 修好 2.4（列印/PDF/轉貼都留得住）。 ⚠️ builder overlay 要加編號 render；
  focus.json 量測流程不變。

- **2-E｜支援 `crop` 局部放大**
  一步可同時給全圖與一個 crop 區域（%），render 成「全圖 + 右下角放大框」。
  ✅ 修好 2.5。 ⚠️ 需要 capture 端或 builder 端裁切（builder 端用 CSS
  `object-fit` + `object-position` 即可，不必重拍）。

- **2-F｜維持現狀，只做微調**（字級 13→14px、label 9→11px 加深、移除空的
  Input/Output 列）。成本近乎 0，但 2.4 / 2.5 / 2.7 不會解決。

**建議組合：2-A + 2-D + 2-F 先做（P0）；2-C 次之（P1）；2-B / 2-E 做成 opt-in。**

---

## 3. 問題三：資料契約（JSON key → UI 欄位 mapping）不完整

> 依 2026-08-07 你的澄清重寫：這裡指的是 **ACMS payload 的哪個 key 對應到畫面上的
> 哪個欄位、有哪些合法值、缺值時怎麼辦** —— 不是畫面排版。

### 3.1 現況：已經有雛形，但只是「step 裡手寫的表格」

現行 spec 有三張表，方向完全正確：

| 表 | 位置 | 內容 |
|---|---|---|
| T1 | 藏在 P1-S3 步驟卡內 | `info.recInputNum`、`info.pocSmpImgTypes` 兩個欄位 |
| T2 | 藏在 P1-S3 步驟卡內 | input type GUID → 空 slot 文字 / 上傳後 label / tips 變體 / 範例圖數量（**這張是全篇最好的表**，有列舉值、有 Unknown fallback） |
| T3 | 藏在 P3-S1 步驟卡內 | 影片模板的同兩個欄位改放在 `effects[oaSubRef]` 之下 |

問題不在「沒有」，而在 **它不是一個一級概念**：這三張表是 `build_spec.py` 裡手寫的
`tables` dict，塞在某個 step 卡片中間。因此 —— 沒有錨點、側欄找不到、沒有任何驗證、
也沒有辦法從 UI 反查回 key。

### 3.2 覆蓋率量測（直接比對 `specs/*.json` 實際 payload）

| Payload | 實際 key path 總數 | spec 有記載 | 覆蓋率 |
|---|---|---|---|
| `acms-template-sample-script1.json`（圖片模板） | 27 | 2（T1） | **7%** |
| `acms-template-sample-script2.json`（影片模板） | 45 | 4（T3 有指名 key 的列） | **9%** |

即使只算「會影響畫面」的 key，圖片模板約 9 個裡也只記載了 2 個。

### 3.3 未記載但畫面上看得到的 key（實測值）

| ACMS key | sample 實際值 | 畫面上是什麼 | spec 現況 |
|---|---|---|---|
| `info.i18n[].data.title` | `"Pawbeats"` | **模板名稱** — dialog tile 下方、控制面板卡片、History 條目 | **完全沒提**。截圖裡到處是 "Cinema Screening"，spec 卻沒說這個字串從哪來 |
| `order` | `1` | 模板在 grid 的排序 | 內文寫「template list and sort order come from ACMS **(T1)**」—— 但 **T1 裡沒有這個欄位**，引用是空的 |
| `groupId` | `117112796700739832` | 模板屬於哪個 category | 內文寫「Categories are ACMS-driven」但從未指名 key |
| `guid` / `id` | `"zz_pet dj 02"` / `"…"` | 「N」新內容 badge 的識別依據 | 內文寫「keyed on its ACMS identity」—— 是 `guid` 還是 `id`？沒說。且 sample 的 `guid` 含空格，並非真 GUID，值域本身可疑 |
| `info.presets[].aspect_ratio` / `.quality` | `"1024x1536"` / `"medium"` | 產出比例 → preview 區的形狀與尺寸 | 沒提 |
| `info.srcImgs` | 2 個 CDN URL | 模板的來源圖 | `build_spec.py` 的註解裡有決策「web slots 不預填 srcImgs」，但 **spec 本文與 T1 都沒有這一列** |
| `info.usrFiles[].name` / `.paramKey` | `srcKeys` / `refKeys` | 影片模板的檔案參數 | 沒提 |
| `audio_material_files` | （存在於 payload） | dialog tile 上的音訊標記 | T3 只寫「audio flags **on the img2Vid stage**」—— **沒有指名 key**，這一列無法實作 |

### 3.4 六個結構性缺口

| # | 缺口 | 為什麼會出事 |
|---|---|---|
| G1 | **不是一級區塊** — 表格埋在 step 內，側欄無入口，無錨點 | RD 找資料契約要先猜它在哪一步 |
| G2 | **引用無驗證** — 內文「(T1)」指向 T1 裡不存在的欄位（sort order、category、identity 三處） | 讀者以為有定義，實際沒有；`validate()` 抓不到 |
| G3 | **欄位維度不足** — 目前只有「key ｜ 白話說明」兩欄 | 缺型別、必填與否、cardinality、合法值、預設值、**缺值/null/未知值時的行為**、範例值、誰擁有這個欄位 |
| G4 | **只有 key→UI，沒有 UI→key** | RD 要做「slot 下的 label」時，得從 27 個 key 裡反推 |
| G5 | **值域未列舉** — 只有 T2 做到了 | `effects[].name`（`oaSubRef` / `img2Vid`）、`presets.quality`、`aspect_ratio`、`usrFiles[].name`（`srcKeys` / `refKeys`）都沒有列舉，RD 只能猜 |
| G6 | **null / 缺欄位行為未定義** | 實測 `effects[1]`（`img2Vid` stage）的 `pocSmpImgTypes` 與 `srcImgs` 都是 `null`，T3 沒說 null 代表「不適用」還是「錯誤」 |

補充：`pocSmpImgTypes` 在 sample 裡是純字串（`female`/`male`/`pet`），而 T2 以 GUID 當
key —— 這一點 spec 有誠實標成 **D-12「PARTIALLY OPEN」**，做法正確，但也意味著
T2 的 key 欄位目前是**未驗證**的。

### 3.5 市面上的做法（可參考）

- **Stripe API reference / OpenAPI**：每個欄位固定六欄 —— 名稱、型別、必填、
  允許值、預設、描述；enum 一律展開列出。
- **JSON Schema / TypeScript `interface`**：把 payload 形狀本身當成合約附在文件裡，
  型別與必填由結構表達，不靠散文。
- **Contentful / Sanity 等 CMS 的 "content model" 文件**：一律附
  **欄位 ↔ 前台元件** 對照表（雙向），以及「未填時前台顯示什麼」。
- **Backstage / Storybook docs**：附一份可摺疊的**真實 sample payload**，並讓文件中
  每個欄位名可點擊跳到 payload 對應行。

### 3.6 選項

- **3-A｜`data_contract` 升為 cfg 一級區塊（建議・P0）**
  從 step 的 `tables` 抽出來成為獨立區塊：有 `id`、有側欄入口、有穩定錨點
  （`T1` / `DC-recInputNum`）。step 卡內只留一句摘要 + 連到完整表。
  ✅ 解 G1；順便讓 T1/T2/T3 可被全篇交叉引用。
  ⚠️ builder 要新增 section renderer；既有三張表要搬家（可自動遷移）。

- **3-B｜固定欄位模板 — ✅ 已定案 2026-08-07：先上 5 欄**

  | 欄 | 內容 | 範例 |
  |---|---|---|
  | 1. Key path | payload 的完整路徑 | `info.i18n[].data.title` |
  | 2. 合法值 / 列舉 | 有限值域必須全部列出 | `oaSubRef` \| `img2Vid` |
  | 3. 範例值 | 直接取自 sample payload，不自己編 | `"Pawbeats"` |
  | 4. 對應 UI 元素 | 畫面上的哪一個東西 | 模板名稱（dialog tile 下方 / 控制面板卡片 / History 條目） |
  | 5. 缺值·null·未知值時 | 三種情況的行為 | 缺值 → 隱藏標題列；未知 type → `"Add Image"`，永不顯示 GUID |

  ✅ 一次補齊 G3（部分）+ G5 + G6，欄位固定＝可被 lint 檢查。
  ✅ 5 欄在 1440 寬度下不需要橫向捲動。
  **延後到之後再上的 3 欄**：型別、必填與否、擁有者 —— 這三欄多半可以從
  範例值與缺值行為推得，先不佔版面。若日後 RD 反映需要，再以「預設收合」方式補上。

- **3-C｜由 sample payload 自動產生骨架 + 覆蓋率 gate（建議・P0，治本）**
  `lint_spec.py` 讀 `specs/*.json`，展開所有 key path，與 `data_contract` 比對，
  強迫每一個 key 被標記成三種之一：`documented` / `engine-only`（永不 render）/
  `ignored`（明確判定與 UI 無關）。有未分類的 key → build 印出清單（第一階段 warn，
  之後 hard fail）。
  ✅ 直接把 27→2 的落差變成可量測、可 gate 的數字，而且**不需要作者一開始就全知**。
  ✅ 順便解 G2：內文出現的 `T\d` / key 名可一併驗證存在。
  ⚠️ 需要 sample payload 進 repo（本 feature 已經有；其他 feature 要補）。

- **3-D｜UI→key 反查索引（P1）**
  兩種做法擇一：
  ① 獨立一張反查表（UI 元素 → 來源 key）；
  ② 在每個 step 的 `STRINGS` bullet 後面直接標來源，例如
  「模板名稱 ← `info.i18n[].data.title`」。
  ✅ 解 G4。 ⚠️ ② 會讓 bullet 變長，與第 1 節的精簡目標拉扯 —— 建議用小字上標樣式。

- **3-E｜「engine-only, never render」明確清單（建議・P0，成本極低）**
  反向合約：把 `meta.prompt[]`、`style_prompt`、`negative_prompt`、`model`、
  `input_fidelity` 等**絕對不可出現在 UI** 的 key 集中列一張表。
  ✅ 這是 IP/資安等級的規則，目前只在 T3 有一列散落的描述。
  ⚠️ 幾乎沒有缺點，建議直接做。

- **3-F｜內嵌可摺疊的真實 sample payload（P1）**
  在 data contract 區塊底部放一個 `<details>`，直接嵌入 `script1.json` /
  `script2.json` 的實際內容（語法highlight），並把 References 表裡的檔名變成連結
  —— 目前那兩個檔名是**純文字，不可點**，雖然檔案就躺在 `spec.html` 隔壁。
  ✅ RD 可以對照真實資料讀表。 ⚠️ bundled 檔會再大一點（JSON 只有幾十 KB，可忽略）。

- **3-G｜維持現狀，只補內容不改引擎（最小改動）**
  手動把 3.3 那 8 個 key 補進 T1/T3，並修掉 G2 的三處空引用。
  ✅ 一小時內可完成，立即受益。 ⚠️ 下一個 feature 會再犯一次同樣的錯。

**建議組合：3-A + 3-B + 3-C + 3-E（P0）；3-D + 3-F（P1）；3-G 可作為 P0 完成前的
即時止血。**

### 3.7 順帶影響：這一節改完，第 1 節的「贅字」也會少一截

現在很多 `limits` bullet 其實是在用散文描述資料規則，例如
「Slot count = the template's declared input count, 1–10」、
「A raw type GUID is never shown to the user — a type not in T2 reads "Add Image"」。
這些搬進固定欄位的 data contract 表之後，step 卡片可以只留行為，bullet 自然變短。

---

## 4. Design Decisions 這一節是否保留？

**建議：刪掉這個 section，但把內容分流到四個地方 —— 不是單純刪除。**

### 4.1 證據：它已經退化成三種東西混在一起

現行 spec 的 4 條 decision：

| ID | 內容 | 它實際上是什麼 |
|---|---|---|
| D-11 | 「Which ACMS thumbnail asset feeds which surface?」標 CLOSED | **資料契約的一列**（哪個 key 餵哪個畫面）→ 屬於第 3 節 |
| D-12 | 「What form does the per-slot input type arrive in?」標 **PARTIALLY OPEN** | **尚未定案的問題**，不是決策 |
| D-25 | 「Are Image Template and Video Template one catalog or two?」 | **範圍界定** → 屬於 Overview 的 Scope |
| D-26 | 「What is in scope for Video Template?」（明寫 deliberate scope-down） | 同上 |

更強的證據來自上一版：`specs/spec-content.md`（v1，9 條 decision）在「Also cited from」
欄位裡**自己標註了每一條的狀態**：

- D-01 / 02 / 03 / 05：`content is inline at P1-S3, not just cited` → **純重複**
- D-07 / 08：`content already inline, citation is just a source note` → **純重複**
- D-09：`content already inline per row, citation repeated 3×` → **重複三次**
- D-06：`bare pointer; full behavior is actually detailed in Path 2, not in this table` → **表格那列才是多餘的**
- D-04：`bare pointers, full answer only lives here` → **唯一真正承載資訊的一條**

**9 條裡 8 條是重複，而且是作者自己在文件裡寫下來的。**
你這一版已經砍到 4 條並關掉 `decisions_index` —— 方向正確，建議走完最後一步。

再加上第 6 節的 P0-a：19 次 `D-xx` 引用只有 1 次是活連結。
一個維護成本高、95% 引用是死的、內容 89% 重複的 section，留著的理由很薄。

### 4.2 但不能無條件刪 —— 它現在扛著兩個真功能

1. **「為什麼是這樣」的答案**，防止 RD 重新爭論（如 D-04「生成中可否離開畫面」）。
2. **標記還沒定案的事**（D-12 PARTIALLY OPEN）。

### 4.3 建議的四個去處

| 原本的內容 | 新家 |
|---|---|
| 資料相關的決策（D-11） | **第 3 節的 data contract 表** —— 「對應 UI」「缺值行為」兩欄自然吸收 |
| 範圍界定（D-25 / D-26） | **Overview 的 Scope 列**（已經有一條 Scope，合併即可） |
| 「為什麼這樣做」的理由 | **第 1 節選項 1-C 的 `note` 欄位** —— 理由貼在它所解釋的那條規則旁邊，不必跳到文件底部 |
| 尚未定案（D-12） | **新增 Open Questions 區塊**（欄位：問題 / 擋住什麼 / owner / 需要何時回覆）—— 這是目前唯一真的缺的東西 |

> **前提**：1-C（rule / note 分離）要先做，否則「理由」沒地方去。

### 4.4 選項

- **DD-1｜刪除 Design Decisions，依 4.3 分流 + 新增 Open Questions 區塊（建議）**
  ✅ 一次解掉重複、死連結、與「決策 vs 未定案」混淆三個問題。
  ⚠️ 綁定 1-C；既有 4 份 spec 要遷移。

- **DD-2｜保留，但改成「只放跨 path 的決策」**
  硬性規定：一條決策若內容已完整寫在某個 step 裡，就不得建立 D-xx；由 lint 檢查
  decision 文字與 step 文字的重疊度。
  ✅ 改動小。 ⚠️ 重疊度門檻很難調，容易變成形式檢查。

- **DD-3｜維持現狀**
  ⚠️ 不建議：目前 18/19 的引用是死的，維護成本高於它提供的價值。

---

## 5. QA checklist 是否保留？

### 5.1 先回答「其他公司都會有這項嗎？」——**一般沒有**

以我的理解（非正式調查，供你判斷）：

- **在行為/功能 spec 內附一份 QA checklist 不是主流做法。**
  分工通常是：spec 描述行為 → **acceptance criteria** 放在 spec 或 ticket →
  **test case** 由 QA 寫在測試管理工具（Jira Xray / TestRail / Zephyr / qase），
  兩邊用 requirement ID 互連。
- 會把測試寫進 spec 的是實行 **spec-by-example / BDD** 的團隊 —— 但那時
  Gherkin scenario **就是 spec 本體**，不是文件末尾另外附一份 checklist。
- 所以你的直覺是對的：**「spec 夠清楚，QA 自然知道怎麼測」確實是常態。**

### 5.2 現行做法的問題比「多餘」更具體 —— 它是同一份資訊的第三份拷貝

```
plan.md acceptance criteria  →  step 的 limits / system  →  path 末尾的 QA checklist
```

實測 P1 的 8 條 QA：平均 **32 字**、最長 **45 字**，內容基本是把該 step 的 rules 重講。

> **P1-S3 的 limits（三顆 bullet）**：「Slot count = the template's declared input count, 1–10」
> ＋「Every slot must stay reachable at 1440 without the page overflowing」
> ＋「a type not in T2 reads "Add Image"」
>
> **對應的 QA（一句 45 字）**：「A template declaring 2 inputs shows 2 slots; a template
> declaring 5 or more shows all of them with every slot reachable and no page-level
> overflow; an unrecognised type reads "Add Image" and never a GUID.」

三條規則被壓成一句 45 字的複句 —— 既不好讀，也不是一條可獨立判定 pass/fail 的測項。
P1 這一段目前佔掉約 **2 個螢幕**。

### 5.3 刪之前要注意：`validate()` 有一條 gate 綁在上面

目前 `validate()` 會 hard-fail「a path with zero QA lines」。
那條 gate 真正想達成的**不是**「要有 QA 文字」，而是
「**`plan.md` 的每條 acceptance criterion 都有被 spec 涵蓋**」。
直接刪 QA，會把這個保護一起刪掉。

### 5.4 選項

- **QA-1｜刪除散文 checklist，改成一張覆蓋率對照表（建議）**
  一行一條、無敘述：`plan.md criterion → 對應 step ID`。約 10 行、佔半屏，
  取代目前約 2 屏的散文。同時把 `validate()` 的 gate 從「path 要有 QA」改成
  「**每條 criterion 都要對應到至少一個 step**」—— 這才是原本真正想要的檢查。
  ✅ 砍掉 2 屏、保住追溯、gate 反而更嚴謹。

- **QA-2｜完全刪除，不留替代**
  ✅ 最乾淨。 ⚠️ 失去 plan.md ↔ spec 的追溯關係；下次改 spec 沒有東西提醒你漏了哪條。

- **QA-3｜改成 Gherkin / CSV，從 spec 拆出去**
  spec 裡不放，build 時另外輸出 `specs/spec-qa.feature`（或 `.csv`）給 QA 匯入工具。
  ✅ 符合「spec 歸 spec、test case 歸測試工具」的分工。
  ⚠️ **需要你確認 QA 團隊目前用什麼工具** —— 沒有工具的話這個檔沒人會開。

- **QA-4｜維持現狀**

**建議：QA-1**（成本低、保住追溯、砍掉 2 屏散文）。
若 QA 團隊確實在用 Xray / TestRail 之類，再疊加 **QA-3**。

---

## 6. 我另外發現的問題（依嚴重度排序）

### P0-a｜Design Decision 交叉引用有 15/19 是死的
`spec.html` 裡 `D-11 / D-12 / D-25 / D-26` 總共出現 19 次，但只有 **1 次**
（`#D-25`）是超連結；其餘 18 次是純文字。而且 `decisions_index: False` 時側欄
**完全沒有 Decisions 項目**，讀者看到「(see D-12)」只能 Ctrl+F。
> 2026-06-30 review 的 P0-2 只檢查「href 指到不存在的 id」，抓不到「該連結卻沒連結」。

**選項**：
- 4a-1 render 時自動 linkify 所有 `D-\d+` / `P\d-S\d` / `T\d` token，並在
  `validate()` 檢查目標存在（找不到即 build fail）。**建議**
- 4a-2 只補側欄的 Decisions 入口（成本低，但 18 個 inline 引用仍要 Ctrl+F）。

### P0-b｜QA checklist 不可執行
P1 有 8 條、平均 32 字、最長 45 字；沒有 ID、沒有指回 step、checkbox 是純 CSS
畫的（`type="checkbox"` 出現 0 次）—— 看起來可勾，實際不能勾。
> 2026-06-11 的 #7、2026-06-30 的 P1-2 都提過，至今未做。

**選項**：
- 4b-1 `qa` 升級為 `{id, given, when, then, covers:[step_ids], severity}`，
  render 成表格，並自動產出 traceability matrix（spec ID → QA ID）。**建議**
- 4b-2 只加 ID（`P1-QA1`）+ `covers`，文字維持散文。
- 4b-3 額外輸出 `spec-qa.csv` / Gherkin `.feature`，讓 QA 直接匯入。

### P1-a｜15,823px 長文只有 9 個導覽連結
沒有 step 層級錨點、沒有回到頂端、沒有跳轉輸入框、沒有閱讀進度。

**選項**：
- 4c-1 側欄 path 下展開 step 子項（可收合）+ scroll-spy。
- 4c-2 頂端 sticky bar 顯示目前 `P1 · S5`，附「跳到 ID」輸入框（打 `P2-S1` Enter）。
- 4c-3 兩者都做（**建議**，成本都在 builder，內容零改動）。

### P1-b｜表格格子被當段落用
T1「What the web does with it」單格 60+ 字。表格失去可掃描性。
**選項**：格子只放結論句（≤ 20 字），長解釋移到表格下方 note 列 / footnote。

### P1-c｜字級偏小
body 13px、meta label 9–10px、灰度偏淺。一份要讀一整天的文件建議 body 14px、
label 11px 且顏色加深。**成本極低，體感差異大。**

### P2-a｜`specs/spec-content.md` 已經過期
內容是 v1 (2026-07-03) 的 3 paths（含已移除的 Mobile Path 3），與 2026-08-06 實際
build 出來的內容不符。**過期的鏡像比沒有鏡像更危險。**
**選項**：(i) build 時自動由 cfg 產生；(ii) 直接刪除。

### P2-b｜截圖來源與 `capture_screenshots.py` 流程脫節
本 feature 的截圖來自 `.pptx` 匯出的 design mockup，不是 prototype 截圖，所以
`focus.json` 自動量測失效，全部改用 `focus_lock: True` 手調百分比 —— 正是
SKILL.md 明令「never hand-tune percentages for a final spec」的做法。
**選項**：SKILL.md 明確承認第二種截圖來源（design-mockup mode），並定義該模式下
focus 的量測方式（例如在 mockup 上量一次存成 focus.json）。

### P2-c｜`spec-bundled.html` 已達 12.6 MB
接近多數 email 附件上限。可考慮 bundled 版改用壓縮過的 WebP 而非原尺寸 PNG base64。

### P2-d｜「layout 歸 guideline」推出去了卻沒給路
（原本第 3 節的內容，依你的澄清降級為獨立小問題，非本輪主軸。）
Callout 明說「This spec **does not define layout, sizing or component choice** —
those belong to the design guideline linked above」，但 header 只有**一個全域 Figma
連結**（`node-id=14703-74776`），沒有 per-screen node。RD 被告知「去看 guideline」，
卻拿不到那一頁的位置。
**選項**：(i) step 增加 `guideline_node`，截圖角落出現「Guideline ↗」直接開到該 node；
(ii) 維持現狀，但在 callout 裡明說「per-screen 位置請向 Design 索取」，至少不留白。

---

## 7. 打包成 Skill（`/skill-creator` 結構）

### 7.1 現況問題
`SKILL.md` 269 行，同時塞了四種東西：硬規則、Phase 0–6 流程、cfg schema 全表、
引擎維護 DoD。skill-creator 的 progressive disclosure 原則是
**SKILL.md 只留「什麼時候用 + 怎麼開始」，細節下放 `references/`**。

### 7.2 選項

- **S-A｜單一 skill（建議）**
  ```
  skills/yco-spec/
  ├── SKILL.md                  ← 壓到 ~100 行：觸發條件、硬規則、Phase 流程總表
  ├── references/
  │   ├── cfg-schema.md         ← 完整欄位表（目前 SKILL.md 第 135–185 行）
  │   ├── writing-rules.md      ← 字數上限 + before/after 範例（第 1 節的產物）
  │   ├── card-anatomy.md       ← 卡片 4 區塊定義 + layout 區塊規範（第 2、3 節）
  │   ├── screenshots.md        ← capture_lib / focus.json / design-mockup mode
  │   └── engine-dod.md         ← 改 builder 的回歸測試規則
  ├── scripts/                  ← spec_builder.py, capture_lib.py, lint_spec.py
  ├── assets/                   ← cfg-template.py, spec-styles.css
  └── evals/                    ← 見第 6 節
  ```
  ✅ 一個觸發點、一份心智模型。 ⚠️ SKILL.md 要大改寫。

- **S-B｜拆成兩個 skill**
  `yco-spec-author`（Phase 0–2：grill、澄清、寫 cfg 內容）＋
  `yco-spec-build`（Phase 3–5：截圖、build、驗證）。
  ✅ 判斷密集的「寫作」與機械的「建置」可分別 eval、分別調 prompt。
  ⚠️ 兩份 SKILL.md 要同步，觸發詞容易互搶。

- **S-C｜維持現狀只補 references/**（最小改動）

**建議：S-A。** 等 eval 顯示「寫作」這半段分數明顯偏低，再考慮拆成 S-B。

### 7.3 順帶要處理的
- `SKILL-REVIEW-2026-06-30.md` / `OPTIMIZATION-REVIEW-2026-06-11.md` / 本文
  → 移到 `references/_reviews/` 或 `docs/_archive/`，不要留在 skill 根目錄
  （會被當成 skill 內容一起載入，白吃 context）。
- `spec-template.html` 已退役成一張紙條 → 刪除。

---

## 8. Eval 設計（採 skill-forge 的 Tier 0–3 模型）

> 依你指定的參考：https://github.com/neokn/skill-forge
> 本節取代我上一版的提案。

### 8.1 為什麼要換掉上一版

上一版我提的是「確定性 lint + rubric 評分」，量的是**絕對分數**。
skill-forge 的核心原則是 **delta, never absolute** —— 每次評估都必須
`with_skill` 與 `without_skill` **配對**跑，證明 skill 真的帶來提升。

這個差別對 yco-spec 特別關鍵：它的產出本來就「看起來很專業」（有截圖、有表格、
有 ID），絕對分數一定虛高。只有配對比較，才知道哪些分數是 skill 給的、
哪些是模型本來就會的。

skill-forge 的一句話值得直接抄進我們的 SKILL.md：
> **「Evals passing without the skill measure nothing.」**

### 8.2 前置問題：**目前 yco-spec 根本還不是一個 skill**

repo 裡 17 份 `SKILL.md`，**只有 `skills/yco-spec/SKILL.md` 沒有 YAML frontmatter**
（沒有 `name` / `description` / `allowed-tools`；其餘 16 份都有）。後果：

- 無法被自動發現與觸發，目前只能靠 `AGENTS.md` 用文字提到它；
- **Tier 1 觸發測試現在無題可測** —— 沒有 description 就沒有觸發面；
- Tier 0 靜態檢查會直接 fail。

→ **Phase 4「打包成 skill」必須排在 eval 之前**，且第一件事就是補 frontmatter，
description 要寫成「能被 16–20 條 query 區分出來」的形狀。

### 8.3 Tier 0–3 對應到 yco-spec

| Tier | 內容 | yco-spec 的具體題目 | 何時跑 |
|---|---|---|---|
| **0 靜態** | frontmatter、大小、TODO、死連結、禁用檔 | 補完 frontmatter 才有意義；再疊本專案自己的 `validate()` + `lint_spec.py`（第 3 節的 payload 覆蓋率、第 1 節的字數上限、第 6 節的錨點檢查） | 每次 commit |
| **1 觸發** | 16–20 條 query，一半該觸發、一半近鄰不該觸發 | **該觸發**：「幫 X 功能寫 RD spec」「產出交接文件」「這個 prototype 要給 RD 了」；**不該觸發**：「幫我改 prototype 的按鈕」「寫 PRD」「跑 Stage 3 validation」「產 flowchart」—— 後三條最容易誤觸，因為本 repo 真的有 `to-prd` / `web-validate` 這些鄰居 skill | 改 description 時 |
| **2 行為提升** | with_skill vs without_skill 配對 | 見 8.4 的 E1–E3 | 改 SKILL.md 內容時 |
| **3 壓力測試** | 3+ 情境 × 3+ 疊加壓力 | 見 8.5 | 改硬規則時 |

### 8.4 Tier 2 的三個 eval —— 特殊處：**這個 skill 設計上就會停下來問**

yco-spec 有 Phase 0 / Phase 2 兩道 HITL gate。直接丟 fixture 進去跑，每個 run 都會
卡在提問而無法完成。所以必須把「提問」和「建置」**拆成兩個 eval**，各有各的 fixture。

- **E1｜提問品質（recall / precision）** — P0，這是 yco-spec 最有價值也最難的能力
  **fixture**：一份**刻意留 5 個已知空白**的 `prd.md` + `plan.md`。建議的 5 個空白：
  ① credit 不足的邊界行為 ② 某個錯誤訊息的確切文字 ③ 切換模板時的保留規則
  ④ payload 某欄位為 null 時怎麼辦 ⑤ 模板名稱來自哪個 key。
  **assertion**（binary × 6）：5 個空白各自是否被問到；＋「無關問題不超過 N 條」。
  **baseline**：沒有 skill 的 agent 通常直接開始寫 → lift 應該非常明顯。

- **E2｜建置品質（答案給齊之後）** — P0
  **fixture**：完整 `prd.md` + `plan.md` + 5 張截圖 + `answers.md`（E1 那 5 題先答好）
  + 一份 sample payload JSON。
  **assertion**（全部 binary、可程式檢查）：
  - `validate()` 通過
  - 每個 path / step 都有 stable ID
  - data contract 涵蓋 payload **全部** key（`documented` / `engine-only` / `ignored` 三分類無遺漏）
  - `limits` bullet 中位數 ≤ 20 words
  - 所有 `D-xx` / `T\d` / `P\d-S\d` 引用都有對應錨點
  - prototype 的模擬行為進了 `prototype_deltas`，不是寫在 step 內文
  - engine-only key 未出現在任何 step 文字裡
  **baseline**：沒有 skill 時上述幾乎全滅 → lift 明顯。

- **E3｜版本更新紀律** — P1
  **fixture**：一份已存在的 spec + 一個變更需求。
  **assertion**：有沒有先 `archive_current`、有沒有 bump `version` + 加 `changelog`、
  有沒有用 `since` 標新內容、**有沒有手改 `spec.html`**（硬規則違反）。

### 8.5 Tier 3 壓力測試 —— yco-spec 特別需要

SKILL.md 裡白紙黑字寫著：

> 「This gate exists because specs were being generated immediately on request,
> before scope was confirmed.」

代表 Phase 0 gate **歷史上真的失守過**。這正是 pressure test 的最佳題材。

| 情境 | 疊加的壓力 |
|---|---|
| **PT-1 跳過提問** | ①「今天下班前要給 RD」②「你就照 prd 寫，不用問」③ `prd.md` 看起來很完整（實際缺 3 項） |
| **PT-2 抄 prototype code** | ①「RD 說直接把 prototype 的 class name 寫進去比較快」② prototype 原始碼就在 context 裡 ③ 時間壓力 |
| **PT-3 手改 HTML** | ①「只改一個錯字，不用 rebuild」② build 環境剛好壞掉 ③ 提出要求的是老闆 |

違規時**逐字記錄 agent 的合理化說法**，再判斷該修的是硬規則的**措辭**、**位置**、
還是**原則本身**。

### 8.6 Runbook（沿用 skill-forge 的 YAML 形狀）

```yaml
runbook: yco-spec
target_skill: skills/yco-spec
tiers: [0, 1, 2, 3]
configurations: [with_skill, without_skill]
executor: cli
runs_per_configuration: 3
gates: {min_pass_rate: 0.8, require_lift: true}
lang: zh-Hant-TW
grader: {model: claude-sonnet-5}
matrix:
  - {cli: claude, model: claude-opus-5, effort: medium}
evals:          # E1 / E2 / E3 / PT-1..PT-3
  - id: 2
    eval_name: build-quality-with-answers
    type: behavioral
    priority: P0
    prompt: <把 fixture 路徑與需求寫成完整獨立指令>
    expected_output: <一句話描述通過長什麼樣>
    expectations:
      - data contract 涵蓋 payload 全部 key，無未分類
      - limits bullet 中位數 ≤ 20 words
      - ...
trigger_evals:  # 16–20 條
  - {query: "這個 prototype 要交給 RD 了，幫我產 spec", should_trigger: true}
  - {query: "幫我把這頁的按鈕改成藍色", should_trigger: false}
```

結果落在 `result/yco-spec/iteration-N/`，並 append 到 `history.json`；
只跟 `(cli, model, effort, executor)` 四元組相同的 last-known-good 比較。

### 8.7 必須遵守的紀律（直接沿用 skill-forge，不打折）

- **agent 沒過 → 修 skill，絕不放寬 eval。**
- **沒有 skill 也能過的 eval 等於沒測到東西。** E2 的 assertion 要挑「baseline 一定
  做不到」的項目（stable ID、data contract 覆蓋率、`prototype_deltas` 分離），
  不要放「有沒有產出檔案」這種題。
- 跑之前先 **freeze inputs**；每個 run 在**獨立 sandbox**；grader 用**全新** headless
  CLI；**executor 看不到 assertion**。
- **回報原始次數，不對小樣本做統計修飾**（3 runs 就寫 `2/3`，不要寫 66.7%）。
- **fixture 要像真的** —— 用真實 `prd.md` 的凌亂程度，不要用乾淨的最小例子。
- 評的是**行為與產出**，不是**背誦規則**。
- harness 自己壞掉要修；inconclusive 不計入 pass rate；**每一個 spawn 出去的 run 都要計入結果**。

### 8.8 Fixture 選項

- **F-1｜合成小樣本**：2 path / 5 step + 5 張截圖 + 1 份 payload JSON。E1 / E2 的日常跑。
- **F-2｜真實回歸樣本**：`2026-05-20-support-chatbot`（prd / plan / 截圖都已進 repo）。
  改 SKILL.md 後的深跑。
- **F-3｜兩者都要（建議）**。

> ⚠️ 提醒：**現有已出貨的 spec 不能當作 E2 的標準答案** —— 它本身就有本文列出的問題。
> 標準答案應該是 **assertion 清單**，不是某一份 spec。

---

## 9. 建議的執行順序

| 階段 | 內容 | 對應選項 |
|---|---|---|
| **Phase 1 — 零風險快贏** | 字級調整、移除空 Input/Output 列、刪三類贅字、刪過期 `spec-content.md`、**手動補齊 3.3 的 8 個 key 並修掉三處空引用**、engine-only 清單、review 文件搬家 | 1-D, 2-F, 3-E, 3-G, P1-c, P2-a, 7.3 |
| **Phase 2 — 引擎改動** | 自動 linkify + 錨點驗證、focus 永久編號、`lint_spec.py`（warn-only，含 payload 覆蓋率）、side nav step 錨點 + 跳轉框、**QA 改為覆蓋率對照表**（gate 換成 criterion→step） | 4a-1, 2-D, 1-B, 3-C, 4c-3, QA-1 |
| **Phase 3 — schema 改動** | 卡片 4 區塊改名、`note` 欄位（rule/why 分離）、**`data_contract` 一級區塊 + 5 欄模板 + UI→key 反查**、**刪除 Design Decisions 並分流 + 新增 Open Questions** | 2-A, 1-C, 3-A, 3-B, 3-D, 3-F, DD-1 |
| **Phase 4 — 打包成 skill** | **先補 YAML frontmatter（Tier 0/1 的前置）**、SKILL.md 拆成 `references/` / `scripts/` / `assets/` | S-A, 8.2 |
| **Phase 5 — Eval** | Tier 0（lint 轉 hard gate）→ Tier 1（觸發）→ Tier 2（E1/E2/E3 配對跑）→ Tier 3（PT-1..3）；建立 runbook 與 `history.json` | 8.3–8.8, F-3 |

- Phase 1–2 **不動任何既有 cfg**，4 份現有 spec 直接受惠。
- Phase 3 需要遷移既有 spec（設計成向下相容，舊 cfg 仍能 build）。
- **Phase 4 必須在 Phase 5 之前** —— 沒有 frontmatter 就沒有 Tier 0/1。
- DD-1 綁 1-C，兩者同在 Phase 3。

---

## 10. 決策紀錄（2026-08-07 已確認）

| # | 題目 | 決定 |
|---|---|---|
| 1 | 贅字治法 | **1-B + 1-C + 1-D** ✅ |
| 2 | 卡片格式 | **2-A + 2-D + 2-F** ✅ |
| 3 | 資料契約 | **3-A + 3-B（5 欄）+ 3-C + 3-E**，先用 3-G 止血 ✅ |
| 4 | Design Decisions | **DD-1 — 刪除並四路分流 + 新增 Open Questions** ✅ |
| 5 | QA checklist | **QA-1 — 換成 criterion → step ID 覆蓋率對照表** ✅ |
| 6 | QA 測試管理工具 | **不做** ❌ — 2026-08-09 決定：QA-3 移除，不輸出 .feature / .csv |
| 7 | 其他問題 | **P0-a + 4c-3 + P1-b + P2-a/b/c** ✅ |
| 8 | skill 打包 | **S-A — 單一 skill** ✅ |
| 9 | Eval 範圍 | **Tier 0–3 全做，Tier 3 延後一輪** ✅ |
| 10 | 執行順序 | **照 Phase 1 → 5 依序** ✅ |

### 10.0 Phase 6 — grill-me 追加決策（2026-08-09 已確認、已實作）

三個問題來自 §3 / Phase 0 / 流程圖三個不同角落，但答案都指向同一件事：
**「機器要的完整」和「人要看的東西」是兩個工作，不該由同一張表同時做。**

| # | 題目 | 決定 | 落點 |
|---|---|---|---|
| Q1 | payload 是否全部列出 | **分離分類與顯示** —— linter 仍要求 100% triage，表只留「會改變 RD 怎麼做」的 key | `data_contract['engine_only']` / `['no_ui']` 兩則 note；template-spec 仍是 72/72 |
| Q1b | 哪些 key 進表 | **規則判定，不另設 gate** —— 寫不出「使用者看到什麼」就不是 UI key；有疑義的併入既有 Phase 2 clarification | linter 新增 `norender` 檢查 |
| Q2 | 確認流程是否必跑 | **依改動類型分層** —— 新 spec / 新 path / 行為改動要有證據；純改字不要求 | `validate()` 要求至少一列 `decisions` 或 `open_questions` |
| Q2b | change_type 誰判定 | **從 archive 推斷，不靠自評** —— 自評等於讓「決定可以跳過確認」的那個判斷去監督自己 | `infer_change_type()` 比對 `specs/_archive/` 的 path/step/decision ID |
| Q3 | 流程圖有無審查機制 | **版本戳硬擋 + `references/flowchart.md` 內容規範** | 見下方「四項檢查最後只做一項」 |
| Q3b | 舊 spec 怎麼辦 | **棘輪式** —— 沒戳的 7 份先 warn，新 spec 直接 fail | `flowchart-baseline.txt`，只會變短 |

**四項檢查最後只做一項，這是實作時查證的結果，不是縮水：**

| 原訂檢查 | 結果 |
|---|---|
| 檔案不存在 | 做了，FAIL |
| 版本戳對不上 | 做了，FAIL —— **這一項就抓得到今天這個 bug**（spec v2、圖還停在 v1） |
| 圖上有失效的 step / decision ID | **早就有了**。`_flow_html` 會把 SVG inline 進 spec.html，所以 `_check_xrefs` 讀得到圖裡的 `<text>`，畫錯 ID 本來就會 build 失敗。已補一條測試把這個行為釘住，沒有重複造輪子 |
| 每條 path 都畫到了 | **寫了、量了、刪了**。以字彙重疊判斷，8 份 spec 有 6 份誤報（P4「Browse the FAQ tab」畫成「FAQ」，調閾值救不回來）。每次都亮的警告會訓練人略過整個警告區，而版本戳的警告就在同一區 |

真正治本的不是任何一項檢查，而是 `references/flowchart.md` 的那條規則：
**圖只畫路徑並引用 step ID，規則留在 step card。** 不複述規則的圖，不可能跟規則牴觸。
四項檢查是安全網，這條規則才是拔掉病因。

### 10.1 明確延後 / 未採用（不是漏掉）

| 項目 | 狀態 | 說明 |
|---|---|---|
| **1-A** validate() 硬性字數上限 | 延後 | 作為 1-B 的第二階段 —— 等一個 feature 遷移完成、warn 清空後再轉 hard fail |
| **2-B** 左圖右文兩欄 · **2-E** crop 局部放大 | 延後 | 需成對做（2-B 讓圖變窄，必須搭 2-E）。做成 opt-in `card_layout`，不進本輪 |
| **2-C** Given/When/Then 開頭行 | 延後 | 2-A 落地後再評估是否還需要；與 `summary` 欄位重疊要一併處理 |
| **3-D** UI→key 反查索引 · **3-F** 內嵌 sample payload | 延後（P1） | 3-A/3-B 的表建起來之後才有東西可反查。3-F 順帶要修的「References 檔名不可點」併入 P2-a/b/c |
| **QA-3** 輸出 Gherkin / CSV | **不做** | 2026-08-09 決定移除。QA-1 的覆蓋表已提供追溯，測試案例本來就該寫在測試工具裡 |
| **DD-2 / DD-3** | 不採用 | 已由 DD-1 取代 |
| **Tier 3 壓力測試** | 延後一輪 | PT-1/PT-2/PT-3 的設計保留在 §8.5，下一輪補 |

### 10.2 已被其他決策吸收

- **§6 的 P0-b「QA checklist 不可執行」** —— 由 **QA-1** 完全取代。
  散文 checklist 連同那些 CSS 假 checkbox 一起消失，所以不需要另外處理
  「加 QA ID / covers / 真 checkbox」。
- **§6 的 P2-d「layout 歸 guideline 卻沒給路」** —— 未納入本輪。
  這是獨立的小問題，等 RD 實際反映需要 per-screen Figma node 再處理。

### 10.3 綁定關係（實作時的順序約束）

- **DD-1 依賴 1-C** —— `note` 欄位不存在，Design Decisions 的「為什麼」就沒地方去。
  兩者同在 Phase 3。
- **Tier 0 / Tier 1 依賴 S-A 的 frontmatter** —— 目前 `skills/yco-spec/SKILL.md`
  是 repo 裡 17 份 SKILL.md 中**唯一沒有 YAML frontmatter** 的。
  Phase 4 必須早於 Phase 5。
- **3-C 依賴 sample payload 進 repo** —— template-spec 已經有兩份；
  其他 feature 要導入時需先補。
- **QA-1 的 gate 改寫依賴 `plan.md` 的 acceptance criteria 有穩定編號** ——
  若目前是純散文條列，Phase 2 要順手給它們編號。

---

## 附錄 — 證據截圖

| 檔案 | 內容 |
|---|---|
| `review-2026-08-07/01_header_overview.webp` | Header、Reading this spec callout、Overview、All User Paths |
| `review-2026-08-07/02_step_card_P1-S3.webp` | 典型 step 卡片（label 欄、bullet 密度） |
| `review-2026-08-07/03_tables_and_decisions.webp` | T1/T2 表格段落化、inline decision 卡片 |
| `review-2026-08-07/04_qa_checklist.webp` | per-path QA checklist（假 checkbox、長句） |
| `review-2026-08-07/05_errors_references.webp` | Error States 重複句、References |

擷取方式：Chromium 1440×1000，`http://localhost:8977/Project/2026-07-03-template-spec/specs/spec.html`
（repo 現行版本，與 Vercel 部署同一份 `spec.html`）。
Console 唯一錯誤為 sandbox 網路政策擋掉 `gstatic.com` 的 Firebase SDK（comment layer），
與 spec 內容無關。
