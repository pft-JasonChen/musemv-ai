# Area 14 — Content Report Mechanism（內建檢舉原因）

> **Audience:** PM、Designer、RD、QA。遵循 `../00-overview.md` 的 Path / Step / EARS 格式。
> **Source:** Darren Liu 的 YCM Content Report PRD v1.1（October 2026）及產品負責人 2026-10-28–29 本次逐項決策。
> **狀態：產品行為已確認，2026-10-29。** Web 決策優先於舊 Word v1.1 的不同敘述。
> 🔒 無後端。Prototype 用目前文件生命週期內的記憶體模擬成功、失敗與 reviewer 下架；重新整理重設。正式 API 仍由 RD 串接。
> Related: [S11 Content Report storyboard](../storyboards/content-report/specs/spec.html)、[Word 修訂版](../../docs/requirements/YCM-content-report-v1.2-web.docx)。

## 1. Overview & scope

訪客與登入使用者都能檢舉 MV / Song；不要求登入。匿名代表**不向被檢舉創作者揭露檢舉者身分**，不代表後端不記錄識別資訊。後者由 RD 定義。
登入使用者不能檢舉自己的作品：隱藏 Report 並阻擋送出；訪客則可檢舉公開作品，登入後才依帳號判定是否本人。官方作品可檢舉。
成功檢舉**不會立即隱藏或下架**內容；審核確認後才移除公開存取，創作者保有私人播放。
不包含帳號檢舉／封鎖、申訴、重新送審、審核後台 UI 或 Profile Send Feedback 的 Community Report 分類。

## 2. Route / component / state / API map（RD）

| Surface | 行為 | Prototype 狀態 |
| --- | --- | --- |
| `/watch` | MV flag，Report Music Video | 共用 useReportContent |
| `/song/play`、`/explore/songs` | Song flag，Report Song | 同上 |
| `/song/result` | 保留既有 community Report 入口；自己的作品不顯示 | 同上 |
| `/share` | MV / Song More → Report；自己的作品不顯示 | 同上；公開下架後不可解析 |
| `/history` | 私人保留、更多選單通知、隱藏 Publish、Got It | History seed / job + moderation snapshot |
| `/mv/result`、`/song/result` | 創作者私人播放與下架通知；未授權不可用 | ModeratedAccess + ContentNotice |
| `/`、Explore、`/creator` | 公共列表過濾下架項目 | 同一 moderation snapshot |
| `?demo=1` | Report submission fails、reviewer 下架與 reset | 只限目前分頁，不寫入持久儲存 |

不新增 provider、MuseApi endpoint、資料庫或網路請求。
Prototype 的唯一 mock 帳號以固定 fixture 歸屬、History 自有資料判定所有權，不能以使用者可編輯的顯示名稱作為正式身分契約。

## 3. State model & rules

### 3.1 原因與按鈕

以下六項依序單選；第七項 **Something else** 開啟 Details 子頁，不是第七個內建分類。

| # | 英文原因 | 涵蓋範圍 |
| --- | --- | --- |
| 1 | Sexual or adult content | 裸露、露骨內容、涉及未成年人的性行為 |
| 2 | Harassment or hate speech | 針對性辱罵、仇恨言論、人身攻擊 |
| 3 | Spam or commercial advertising | 重複垃圾內容、假互動、誤導標題／縮圖 |
| 4 | Violent or disturbing content | 血腥暴力、傷害描繪或威脅 |
| 5 | Misinformation or misleading | 不實健康宣稱、捏造新聞、假訊息 |
| 6 | Copyright or unauthorized use | 未授權音樂、影片或美術作品 |

Submit Report **一直顯示**，未選原因時 disabled。Something else 的 Details 最多 1000 字（沿用瀏覽器 textarea maxLength）；trim 後非空才可送出，可清空，返回再進入保留文字；整個視窗關閉後重設。
手機 bottom sheet，桌機置中 dialog；保留目前 Close、Escape、點背景關閉方式。

### 3.2 送出、成功與失敗

送出中 Submit 停用，顯示 Submitting…，避免連點。
成功才標記已檢舉並計次，顯示：

- `Thank you for keeping Muse safe`
- `We'll review this content. If it violates our community guidelines, we'll take action — usually within 24 hours.`（畫面沿用英文彎引號排版）
- Done 手動關閉；**不加 3 秒自動關閉**。原有關閉方式仍可使用。

失敗不計次、不標記已檢舉、不進成功畫面，保留原因與 Details，顯示：
`Couldn’t submit your report. Please try again.`；使用者可再次按 Submit 重試。
24 小時為現有對外文案，不表示 prototype 有審核排程。成功檢舉不觸發下架。

### 3.3 兩項防濫用

正式修正舊 Word 的「three independent safeguards」為**兩項**：

1. **Duplicate guard**：同 kind:id 在本 session 已成功檢舉，不開 sheet，顯示 `You already reported this content.`（neutral border）。
2. **Session cap**：MV＋Song 成功送出合計最多 5 次，第 5 次可送，第 6 個不同內容阻擋，不開 sheet，顯示 `You have reached the report limit for this session.`（amber border）。

同時成立時 duplicate 優先。取消、失敗不計次。送出前再次檢查，避免開啟中的視窗繞過上限。
Session 為**同一分頁目前文件生命週期**：client navigation 保留；重新整理／新文件／新分頁重設；登入、登出不重設。song:id 與 mv:id 是不同內容。
兩種 toast 統一 **3000ms**，hover／focus 暫停；離開後重新倒數完整 3 秒，沿用全域 toast 行為。手機位於 tab bar 上方。

### 3.4 審核後下架與通知

下架後從公開 feed（含首頁與 Explore）、公開 creator profile 移除。公開 Share、播放器直連不可用，即使創作者已登入也不走公開路徑繞過。
只有登入的創作者能從 History／自己的 Result 私人播放；Result 保留下架通知。未登入或非本人不可私人播放。
History 列表外觀維持普通項目，沒有 badge／灰縮圖／狀態字；`···` 頂部顯示警告 notice：

- `Removed from community`
- `A reviewer removed this content. Tap to see the reason.`

被下架項目隱藏 Publish。點 notice 開啟 Content Notice；手機全頁、桌機 dialog。
**沿用現有設計**：保留 Content Removed / Permanently Removed、縮圖／標題／類型／發布日期／移除資訊、六分類 reason chip 與原因說明、Got It；不提供重新送審指引或資格資訊。六分類既有敘述全部沿用。
永久下架與一般下架對本版的公開／私人存取規則相同。

### 3.5 QA 模擬

僅既有 `?demo=1` 面板提供檢舉失敗、選擇作品／六原因／下架類型、Simulate reviewer removal 及 Reset report QA session。
同一作品的移除狀態即時影響列表、公開連結與私人頁；不改動固定 fixtures。一般檢舉成功不會觸發 reviewer 動作。
面板新狀態只保留於目前分頁記憶體；重新整理重設。Reset 清除本次 reviewer 模擬、失敗與檢舉次數，固定下架範例仍保留。關閉面板清除本次 reviewer 模擬與失敗，正常檢舉次數不受影響。

## 4. User journeys

| Step | 操作 | 回應 |
| --- | --- | --- |
| RPT-P1-S1 | 訪客／登入者點他人或官方作品 Report | duplicate → cap 檢查後開正確標題 |
| RPT-P1-S2 | 選一原因，或 Something else 填 Details | 有效輸入才啟用 Submit |
| RPT-P1-S3 | Submit | 送出中停用；成功進確認，Done 手動關閉 |
| RPT-P2-S1 | 已成功檢舉同作品再點 Report | duplicate toast，不開 sheet |
| RPT-P2-S2 | 成功檢舉 5 次後對新作品點 Report | cap toast，不開 sheet |
| RPT-P3-S1 | 開 QA 失敗再送出 | 保留輸入，錯誤提示、不計次 |
| RPT-P3-S2 | 關 QA 失敗再按 Submit | 重試成功；不重複計次 |
| RPT-P4-S1 | 登入者檢視自己的作品 | Report 隱藏，送出也被禁止 |
| RPT-P5-S1 | QA reviewer 下架 | 公開列表／直連／Share 不可用 |
| RPT-P5-S2 | 創作者進 History → 更多選單 → notice | 私人播放保留、Publish 隱藏，Got It 返回 |

## 5. Error & edge states

| ID | 狀態 | 規則 |
| --- | --- | --- |
| RPT-E1 | 第六筆不同內容 | cap，3 秒 warning toast |
| RPT-E2 | 重複，包含已滿 5 次 | duplicate 優先，3 秒 neutral toast |
| RPT-E3 | 未選原因／Details 全空白 | Submit disabled |
| RPT-E4 | 取消未送出 | 不計次，下次開啟重設輸入 |
| RPT-E5 | 送出失敗 | 已確認文案，保留輸入，可重試，不計次 |
| RPT-E6 | 下架作品公開直連或非本人私人頁 | unavailable；不得掛載可播放媒體 |

## 6. Acceptance criteria（EARS）

- **AC-RPT-01** — WHEN 訪客或登入者點非本人作品 Report，THE SYSTEM SHALL 在未受防濫用阻擋時開對應標題的檢舉 UI，不要求登入。
- **AC-RPT-02** — THE SYSTEM SHALL 依 §3.1 顯示六分類＋Something else，並執行單選、1000 字上限、trim 非空及返回保留規則。
- **AC-RPT-03** — THE SYSTEM SHALL 一直顯示 Submit；未選有效原因／說明或正在送出時 SHALL disabled。
- **AC-RPT-04** — WHEN 成功，THE SYSTEM SHALL 顯示 §3.2 確認與 Done，SHALL NOT 在 3 秒自動關閉。
- **AC-RPT-05** — WHEN 成功檢舉，THE SYSTEM SHALL NOT 因此立即隱藏、移除或阻擋內容播放。
- **AC-RPT-06** — THE SYSTEM SHALL 依 §3.3 合計成功次數，只允許前 5 次；取消／失敗不計次。
- **AC-RPT-07** — WHEN 同內容重複，THE SYSTEM SHALL 優先顯示 duplicate 而非 cap，並在送出時再次防護。
- **AC-RPT-08** — THE SYSTEM SHALL 依 §3.3 顯示兩種 3 秒 toast，hover／focus 暫停，離開後重新倒數。
- **AC-RPT-09** — WHEN 審核下架，THE SYSTEM SHALL 阻擋所有公開存取，保留登入創作者的 History／Result 私人播放。
- **AC-RPT-10** — THE SYSTEM SHALL 保持 History 列表普通外觀，在更多選單顯示 Removed from community notice 並隱藏 Publish。
- **AC-RPT-11** — WHEN 開 notice，THE SYSTEM SHALL 沿用 §3.4 完整詳情設計、六原因說明與 Got It，不提供重新送審。
- **AC-RPT-12** — THE SYSTEM SHALL 區別本功能與 Send Feedback 的 Community Report，不共用未確認 CS reason ID；匿名僅承諾不向創作者揭露檢舉者。
- **AC-RPT-13** — WHEN 登入者是作品擁有者，THE SYSTEM SHALL 隱藏 Report 並禁止送出；官方作品仍可檢舉。
- **AC-RPT-14** — WHEN 送出失敗，THE SYSTEM SHALL 顯示已確認錯誤文案、保留輸入並允許重試，不標記成功。
- **AC-RPT-15** — THE SYSTEM SHALL 依 §3.5 提供可重設的分頁記憶體 QA 狀態，不持久化或改動固定 fixtures。

## 7. Per-path QA checklist

2026-10-29：174 項單元測試、定向 browser report／access 檢查及 15 張 390／1440 截圖已通過。逐項證據與測試範圍見 [S11 verification](../storyboards/content-report/VERIFICATION.md)；下表保留為完整回歸清單，不代表 Linux visual／全套 axe 已在本次執行。

- [ ] RPT-P1：免登入、雙標題、六分類＋其他、disabled、成功超過 3 秒仍開啟、Done。
- [ ] RPT-P2：跨 MV／Song 五次、duplicate 優先、第六次 cap、hover／focus hold、reload 重設。
- [ ] RPT-P3：連點不重複提交、失敗輸入保留、不計次、關 QA 後重試成功。
- [ ] RPT-P4：登入自己無入口；訪客與他人／官方可檢舉。
- [ ] RPT-P5：同作品跨公開列表／profile／player／share 同步；只有本人登入可私人播放；登出即阻擋。
- [ ] History 通知、無 Publish、一般／永久下架與六原因說明、Got It。
- [ ] 390 / 1440 視覺檢查；其餘六階寬度與既有全站行為交給專案 gate，不宣告本次已重錄 Linux baseline。

## 8. Open items for RD

產品決策 `TBD-RPT-01`–`06` **已結案（2026-10-29）**；完整取代先前提問，不再保留候選方案。
唯一未定為 **TBD-RPT-07 — RD 整合契約**：endpoint、reason IDs、payload、reporter/session 識別、送出成功回應、冪等／重試協定、reviewer 狀態來源及授權／跨裝置同步。RD 須依已定 UI 行為提供契約，不能因尚未串接便改動產品規則。
Prototype 不宣稱具有匿名安全、防濫用安全或真正私人授權；這些須由正式後端執行。

## 9. Mockup / prototype update assessment

已批准調整：五次上限與 amber 提示、三秒 toast、失敗重試、自有作品入口與送出防護、History notice 文案、跨頁 reviewer 狀態與公開／私人存取、QA 控制。
沿用：六原因＋Something else、disabled Submit、Done-only、手機／桌機設計、永久下架與既有原因敘述。
S11 是共用功能的單一 storyboard；S4 / S8 / S9 / Result storyboard 交叉引用，避免不同流程重複定義同一檢舉規則。
