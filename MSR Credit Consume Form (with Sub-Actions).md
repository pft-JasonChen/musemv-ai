# MSR Credit Consume Form (with Sub-Actions)

此設計旨在解決多種服務組合時，計費規則因「排列組合」導致維護成本爆炸的問題。透過 **Sub-Actions (子服務)** 的概念，將複合型服務拆解為多個獨立計費的服務，再由系統動態組合計算總價。

## 1. 核心概念與優勢

### 傳統單一 Action 的痛點

以 「AI MV 生成」為例，該服務包含三個面向的選擇：

1. 影片畫質 (540, 720, 1080 共 3 種)
2. 語音旁白 (Eng, Jpn, Cht 共 3 種)
3. AI 歌手計費模式 (Per Song, Per Sec 共 2 種)

若只能用單一 Action 定義價格，系統需要窮舉並維護 **3 * 3 * 2 = 18 種** 組合與定價。未來只要每增加一種新語言或新解析度，所有組合就必須全部重新計算與設定，極難維護。

### 引入 Sub-Actions 的優勢

* **拒絕組合爆炸：** 每個服務（Action）獨立計算，運行任務時再動態把需要的服務放進 `subActions` 籃子。
* **高可複用性（Reusability）：** 這些子服務（Sub-Actions）同時也是獨立的服務（Actions），並非完全依賴或綁死在某個主服務（Main Action）下。未來如果系統要推出「獨立 AI 朗讀功能」或「獨立 AI 歌手」，可以直接調用相同的 Sub-Action 計費模組，不需重複開發與定義。
* **高擴充性：** 未來若要新增第 4 種語言或 2K/4K 畫質，只需「多加 1 個 Sub-Action 設定」即可，完全不影響現有的其他計費規則。

---

## 2. 設定方式與資料結構

啟用 Sub-Action 機制需要定義兩層結構：

1. **Main Action (主操作)：** 用於記錄在扣點歷史 (Token History) 中，本身不設定計費規則（Rule 留空），將計費權限完全委派給子操作。
2. **Sub Actions (子操作)：** 各自擁有獨立的 `consumedType` 與 `rule` 計費邏輯。

### MSR form 設定範例 (JSON Schema)

這裡定義了 `ai_mv` 主操作，以及其旗下支援的所有子操作庫：

```json
{
  "ai_mv": { 
    "action": "ai_mv",
    "consumedType": "duration",
    "rule": [] // 主操作無計費規則，點數計算完全委派給 subActions
  },
  // 生成影片相關 action
  "text_to_video_540":{"action":"txt2Vid_540","consumedType":"duration","rule":[{"token":3,"tknPerPfAud":3,"procUnit":1}]},
  "text_to_video_720":{"action":"txt2Vid_720","consumedType":"duration","rule":[{"token":4,"tknPerPfAud":4,"procUnit":1}]},
  "text_to_video_1080":{"action":"txt2Vid_1080","consumedType":"duration","rule":[{"token":6,"tknPerPfAud":6,"procUnit":1}]},
  // 生成旁白相關 action
  "ai_speech_generator_eng": {"action":"txt2Spe_a","consumedType":"duration","rule":[{"procUnit":1,"tknPerChar":0.2}]},
  "ai_speech_generator_jpn": {"action":"txt2Spe_b","consumedType":"duration","rule":[{"procUnit":1,"tknPerChar":0.3}]}, 
  "ai_speech_generator_cht": {"action":"txt2Spe_b","consumedType":"duration","rule":[{"procUnit":1,"tknPerChar":1.2}]},
  // 生成歌曲相關 action
  "ai_singer_per_song": {"action":"audCamp_perSong","consumedType":"duration","rule":[{"procUnit":1,"tknPerRes":12}]},
  "ai_singer_per_sec": {"action":"audCamp_perSec","consumedType":"duration","rule":[{"procUnit":1,"token":1}]}
}

```

---

## 3. 應用程式 (App) 呼叫範例

當使用者在 App 端發起一個 **「1080p 高畫質 + 英文旁白 + 按歌曲計費的 AI 歌手」** 的 AI MV 任務時，後端或 App 呼叫 API 呼叫只需帶上 `main action` 並動態組合對應的 `subActions` 陣列即可：

```json
{
  "action": "ai_mv",
  "subActions": [
    "text_to_video_1080",
    "ai_speech_generator_eng",
    "ai_singer_per_song"
  ]
}

```

系統將會自動撈取這三個子操作的計費規則，加總算出此單次任務的最終扣點總額。