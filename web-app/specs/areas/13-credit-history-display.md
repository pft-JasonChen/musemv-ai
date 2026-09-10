# Area 13 — Credit History Display Mapping（RD 顯示規格）

> **Audience:** RD（App / Web 前端 + 後端串接）與 QA。
> **Source of truth:** `ycm-credit-history.json`（產品提供，2026-09-10）。
> **Purpose:** 使用 credit record 的 `feature_name` + `action_name`，從表中取得扣款紀錄的
> 顯示字串 key 與 icon。這份文件只定義資料契約與顯示規則；**不要求修改目前 prototype**。
>
> Related: 扣點 action 與計價 → `11-credit-consumption.md`；Credits History 畫面 →
> `07-credits-iap.md`。

---

## 1. 輸入與輸出

每一筆 credit record 至少提供以下兩個欄位：

```json
{
  "feature_name": "ai_mv",
  "action_name": "create_mv"
}
```

| 資料 | 型別 | 說明 |
| --- | --- | --- |
| record.`feature_name` | string | 功能識別字；目前表內唯一值為 `ai_mv`。 |
| record.`action_name` | string | 本次扣款的 action 識別字。 |
| 使用者語言 | string | 用來選擇 `translation[].i18n` 內的語系字串。 |

成功對應後，畫面取得：

| 輸出 | 來源 | 用途 |
| --- | --- | --- |
| `credit_detail_name_key` | 命中的 `credit_detail[]` 項目 | 再到 `translation[]` 查顯示字串。 |
| display name | 命中的 `translation[].i18n` | 顯示在 Credit History 的扣款明細名稱。 |
| `icon` | 命中的 `credit_detail[]` 項目 | 顯示該筆明細的 icon。 |

`feature_name`、`action_name`、`credit_detail_name_key`、語系碼及 icon 檔名都是
**case-sensitive 的識別字**，RD 不得改寫、正規化或自行修正拼字。

---

## 2. Form 結構

Top-level 是 country 設定陣列；目前只有預設設定 `country: "def"`：

```text
country[]
└─ country: "def"
   ├─ credit_detail[]
   │  ├─ feature_name
   │  ├─ action_name[]
   │  ├─ credit_detail_name_key
   │  └─ icon
   └─ translation[]
      ├─ key
      └─ i18n.{language_code}
```

本版只定義使用 `country: "def"`。未來若增加其他 country，如何選擇 country config
必須另訂，不能由 RD 猜測。

特別注意兩個名稱相近但型別不同的欄位：

- credit record 的 `action_name` 是單一 **string**。
- form 中 `credit_detail[].action_name` 是 **string array**，代表陣列內任一 action 都共用
  同一組 `credit_detail_name_key` 與 `icon`。

---

## 3. 查找與顯示流程

對每一筆 credit record，RD MUST 依序執行：

1. 取得 `country === "def"` 的設定物件。
2. 在 `credit_detail[]` 找到同時符合以下兩項的唯一項目：
   - `credit_detail.feature_name === record.feature_name`
   - `credit_detail.action_name.includes(record.action_name)`
3. 從命中項目取得 `credit_detail_name_key` 與 `icon`。
4. 在 `translation[]` 找到 `translation.key === credit_detail_name_key` 的唯一項目。
5. 以使用者語言碼讀取 `translation.i18n[language]`。
6. 若該語系不存在或值為空字串，改讀 `translation.i18n.enu`。
7. 顯示第 5 或第 6 步得到的字串，並使用第 3 步取得的 icon。

語言 fallback 僅在「欄位不存在」或「值為空字串」時發生。不得因翻譯內容看似不完整、
與英文相同或含空白而自行改用其他語言。`enu` 是唯一 fallback；不做語系鏈式 fallback。

### 範例 A：使用者語言有翻譯

假設 `cht` 日後更新為 `建立 MV`：

```text
record = (ai_mv, create_mv)
→ credit_detail_name_key = create_mv_name
→ icon = ic_video_ai.svg
→ i18n.cht = 建立 MV
→ 顯示「建立 MV」+ ic_video_ai.svg
```

### 範例 B：使用者語言為空，fallback 至英文

依目前提供的表，`cht` 仍是空字串：

```text
record = (ai_mv, edit_poster)
→ credit_detail_name_key = edit_poster_name
→ icon = ic_video_ai.svg
→ i18n.cht = ""
→ fallback i18n.enu = "Edit MV - Recreate Cover Image"
→ 顯示英文 + ic_video_ai.svg
```

---

## 4. 完整 mapping（2026-09-10）

下表逐字反映 form；拼字看似有誤的值仍是本顯示表的精確識別字。

| `feature_name` | record `action_name` | `credit_detail_name_key` | `enu` 顯示 | `icon` |
| --- | --- | --- | --- | --- |
| `ai_mv` | `ai_song_simple_vocal` | `create_song_name` | Create Song | `ic_song_ai.svg` |
| `ai_mv` | `ai_song_custom_vocal` | `create_song_name` | Create Song | `ic_song_ai.svg` |
| `ai_mv` | `ai_song_simpe_instrumental` | `create_song_name` | Create Song | `ic_song_ai.svg` |
| `ai_mv` | `ai_song_custom_instrumental` | `create_song_name` | Create Song | `ic_song_ai.svg` |
| `ai_mv` | `create_script_upload_song` | `create_storyboard_name` | Create Storyboard | `ic_script.svg` |
| `ai_mv` | `generate_mv` | `storyboard_generate_mv_name` | Storyboard - Create MV | `ic_video_ai.svg` |
| `ai_mv` | `create_mv` | `create_mv_name` | Create MV | `ic_video_ai.svg` |
| `ai_mv` | `edit_mv` | `revreate_scene_name` | Edit MV - Recreate Scene | `ic_video_ai.svg` |
| `ai_mv` | `merge_mv` | `merge_mv_name` | Edit MV - Merge | `ic_video_ai.svg` |
| `ai_mv` | `edit_poster` | `edit_poster_name` | Edit MV - Recreate Cover Image | `ic_video_ai.svg` |

### 原始識別字注意事項

- `ai_song_simpe_instrumental` 的 `simpe`（少一個 `l`）是 form 目前的原始值。
- `revreate_scene_name` 的 `revreate` 是 form 目前的原始值。
- form 的葡萄牙語語系碼是 `prt`；目前 Web app 的產品語系碼是 `ptg`。兩者不相等，
  不得在沒有明確轉換契約時自動視為同一語系；因此 `ptg` 目前會 fallback 至 `enu`。
- `11-credit-consumption.md` 已將扣點 action 定義為修正後的
  `ai_song_simple_instrumental`。它與本 form 的 `ai_song_simpe_instrumental` 不一致；
  若 record 傳修正後的名稱，本版 form **不會命中**。顯示 mapping 與計價 action 是兩份不同
  契約，RD 不得私自選其中一個拼法替另一個兜底。

---

## 5. 無法對應與資料異常

以下均視為 **config / contract error**，不能以猜測的字串或 icon 取代：

- 找不到 `country: "def"`。
- `(feature_name, action_name)` 找不到 mapping。
- 同一組 `(feature_name, action_name)` 命中超過一個 `credit_detail[]` 項目。
- 找不到對應的 `translation.key`，或同一 key 出現超過一次。
- fallback 後的 `i18n.enu` 仍不存在或為空字串。
- `icon` 缺少、為空，或資源不存在。

本 form 尚未定義上述 error 在產品 UI 上應顯示什麼。RD MUST 記錄可觀測的 config error，
但不得把 `credit_detail_name_key` 或 `action_name` 直接當成使用者字串。正式 UI fallback
需由產品另行決定。

---

## 6. 驗收條件

- **AC-CD-01** — GIVEN record 含有效的 `feature_name` 與 `action_name`，WHEN 系統解析
  Credit History 明細，THEN 系統 SHALL 以兩者共同查得唯一的
  `credit_detail_name_key` 與 `icon`。
- **AC-CD-02** — WHEN 使用者語言的翻譯存在且不是空字串，THEN 系統 SHALL 顯示該語言字串。
- **AC-CD-03** — WHEN 使用者語言欄位不存在或為空字串，THEN 系統 SHALL 顯示同一 key 的
  `enu` 字串。
- **AC-CD-04** — THEN 系統 SHALL 使用命中 mapping 的 `icon`，且字串與 icon 必須來自同一筆
  `credit_detail[]` mapping。
- **AC-CD-05** — WHEN 多個 action 共用一筆 `credit_detail[]`，THEN 陣列內每個 action SHALL
  得到相同的字串 key 與 icon。
- **AC-CD-06** — WHEN mapping、translation 或英文 fallback 無法唯一且完整解析，THEN 系統
  SHALL 將其視為 config / contract error，且 SHALL NOT 將內部 key 直接顯示給使用者。
- **AC-CD-07** — RD SHALL 對所有識別字做 case-sensitive 精確比對，不得修正 typo 或自動轉換
  `prt` / `ptg`。
- **AC-CD-08** — 本規格不得造成 prototype 行為或 UI 變更。

### QA 最小測試集

1. 每一個 §4 action 都能得到表列的 key、英文與 icon。
2. 非英文翻譯有值時顯示該值。
3. 非英文翻譯缺少與為空字串時，兩者都顯示 `enu`。
4. 錯誤的 `feature_name`、錯誤的 `action_name`、重複 mapping、缺 translation、空英文與缺 icon
   均走 config / contract error。
5. `ai_song_simple_instrumental` 不應誤命中表內的 `ai_song_simpe_instrumental`。
6. 使用者語言為 `ptg` 時，在沒有明確轉換契約前 fallback 至 `enu`。
