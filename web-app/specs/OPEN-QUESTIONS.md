# 待確認事項總表(Open Questions — 決策後狀態)

> **狀態:2026-07-22 已完成一輪決策。** 這份表已從「待你決定」更新為「決策後分類」。本輪**只改 spec、未動 codebase**;要動 codebase 的變更清單在 **[`handoff.md`](handoff.md)**。
>
> **權威來源:** 每項的正式決議記在該領域 spec 的第 8 節(或全域在 `00-overview.md` 第 9 節)。
>
> **圖例:** ✅ 已定案 · ⏸ Phase 2(MVP 不做)· 📄 只補 spec 不改 code(Curation)· 🔧 後端實作(RD)· 🐞 bug(RD 修)· ⏳ 仍待議/待設計。

**本輪結論一句話:** 大多數項目**比照 App**;**只剩 6 項仍需要你或設計師後續拍板**(見最下方 ⏳ 區);其餘為 RD 後端/bug,不需你決策。

---

## ✅ 已定案 — 比照 App(sync App)

前端可直接做(除標註後端者外),細節見 [`handoff.md`](handoff.md) §A。

| ID | 領域 | 決議 |
|---|---|---|
| TBD-GL-01 | 全域 | 真的扣點;餘額不足時 CTA 導去 IAP(擋住生成)。 |
| TBD-GL-02 | 全域 | 改為「動作級」登入門檻(Create MV/Song、Like、Get Proof 點擊當下才觸發登入)。 |
| TBD-GL-04 | 全域 | 狀態比照 App 持久化(**需後端**,見 🔧 區)。 |
| TBD-MV-01 | MV | Trim 強制 ≥30 秒(且不短於 MV 長度)。 |
| TBD-MV-02 | MV | 匯入音檔限 MP3/AAC/WAV/M4A、≤50MB。 |
| TBD-MV-04 | MV | 「High」畫質設為 Pro 專屬(免費顯示灰階+皇冠,點擊導 IAP)。 |
| TBD-MV-06 | MV | 前端保留發布確認流程(後端審查機制 → 見 📄 區)。 |
| TBD-MV-11 | MV | Choose Song 空狀態(「尚未建立歌曲」+ 建立捷徑)。 |
| TBD-SONG-01 | Song | Custom 模式補上 Genre + BPM 滑桿 + 調性 + 逐行歌詞。 |
| TBD-SONG-02 | Song | 免費用戶限試聽 30 秒;Pro 全曲。 |
| TBD-SONG-03 | Song | Recreate 收 50 點,並保留前一版於 History。 |
| TBD-SONG-04 | Song | Enhance:每 session 首次免費,之後每次 1 點。 |
| TBD-EXP-04 | Explore | 歌曲播放器補上隨機/重複、30 秒門檻、社群/自己兩種清單模式。 |
| TBD-EXP-06 | Explore | 空狀態/找不到內容/離線狀態(採 App 文案)。 |
| TBD-HIST-03 | History | Liked 分頁只顯示社群按讚過的內容。 |
| TBD-HIST-04 | History | Publish = 確認 → 送審 → 上社群(前端確認流程;審核 pipeline 見 📄 區)。 |
| TBD-HIST-05 | History | Storyboard 的「Create」改用列上 pill。 |
| TBD-PROF-03 | Profile | Sign Out 移進 Settings;`/settings` 經(已登入的)帳號進入。 |
| TBD-PROF-06 | Profile | 接上真正的在地化 Terms/Privacy 網頁(與 AUTH-03 同一組連結)。 |
| TBD-CR-02 | Credits | 方案改為 週/月/年 + 「800 Weekly Credits」標頭 + 6 項權益清單。 |
| TBD-CR-03 | Credits | 購買點數永不過期;訂閱點數每期重置。 |
| TBD-CR-05 | Credits | 補上 Restore Purchases + 「已是 Muse Pro」狀態。 |
| TBD-AUTH-03 | Auth | 接上 Terms/Privacy 連結(在地化;同 PROF-06)。 |
| TBD-SHELL-01 | Shell | 品牌字標改為 **「YouCam Muse」**。 |
| TBD-SHELL-03 | Shell | 帳號選單補上「通知」「意見回饋」列。 |

## ✅ 已定案 — 其他明確決定(維持現狀 / 特定值)

| ID | 領域 | 決議 |
|---|---|---|
| TBD-GL-06 | 全域 | i18n 用既有 AI 生成機制(**「Sync YCO i18n method」**);localization QA 不納入本 spec。 |
| TBD-GL-07 | 全域 | `/share` 維持**公開**。 |
| TBD-MV-05 | MV | Template 只帶入 prompt,**不**連動/鎖定歌曲(維持現狀)。 |
| TBD-MV-08 | MV | **改為比照 App(取代先前決定)** — Edit MV 不支援 Save/Project(編輯離頁即失);regenerate(場景/封面)**直接覆蓋、無挑選 take/cover、不可 undo**;保留 Merge 重算。移除的多-take/Save 機制**隱藏並註記**保留給未來版本(勿刪)。 |
| TBD-HIST-02 | History | **永久保留** — 生成後就不會刪除(取代先前的「30 天」與 code 的「14 天」文案)。分享**連結**的到期是另一回事(SHARE-01)。 |
| TBD-PROF-07 | Profile | `/profile` 中心頁 vs `/creator?self=1` 作品格狀頁的拆法 **確認 OK**,不改。 |
| TBD-AUTH-02 | Auth | 第一版**只做 Apple/Google SSO,不支援 email/密碼**(維持現狀)。 |
| TBD-SHELL-02 | Shell | **確認**維持 5 項側邊欄(含 Profile)、無「＋Create」浮動按鈕。 |
| TBD-SHARE-03 | Share | **要做**分享連結分析追蹤;細節待定。 |
| TBD-MV-12 | MV | MV result 的 Publish 打開時,跳 **「Ready to Go Public?」確認對話框**(比照 App,沿用 History 既有的)。 |
| TBD-MV-13 | MV | **已發布的 MV 必須先取消發布才能編輯** — 發布中 Edit MV 按鈕變中性(白底黑字)並顯示「Unpublish to edit MV」;取消發布後才回到「Edit MV」。result 與 History 都適用。 |
| TBD-HIST-07 | History | **Publish 時帶 language/locale code**,後端據此把社群 feed 以語系優先排序;前端只要跟後端要已排序資料即可(code 用 2 碼或 3 碼由 RD 定,見 EXP-10)。 |

## ⏸ Phase 2 — MVP 不做,放進 Phase 2 待辦

| ID | 領域 | 說明 |
|---|---|---|
| TBD-GL-03 | 全域 | Onboarding / Splash 網頁版先不做,之後可能新增。 |
| TBD-MV-03 | MV | 多臉自動偵測延後;MVP 維持手動裁切。 |
| TBD-PROOF-01~04 | Proof | Proof of Creation 整個功能不列入 web MVP。 |

## 📄 只補 spec、不改 codebase — Curation(後端由 RD 之後實作)

| ID | 領域 | 說明 |
|---|---|---|
| TBD-GL-05 | 全域 | Curation 排序 + 審核為後端 track;只補 spec,不動 code。 |
| TBD-EXP-01 | Explore | 4 條內容軌的評分/資格/更新/去重(依 Curation PRD)。 |
| TBD-EXP-07 | Explore | Publish→動態牆 + AI/人工審核 + 管理員置頂(依 Curation PRD)。 |

## 🔧 後端實作 — RD 負責(prototype 維持 mock)

| ID | 領域 | 說明 |
|---|---|---|
| TBD-GL-04 | 全域 | 正式環境的狀態持久化(行為比照 App)。 |
| TBD-CR-01 | Credits | 真的 IAP(App Store / Play Store)。 |
| TBD-CR-04 | Credits | 真實點數帳本。 |
| TBD-AUTH-01 | Auth | 真的登入整合(供應商、session/token)。 |
| TBD-PROF-01 | Profile | 通知推播串接。 |
| TBD-PROF-02 | Profile | 意見回饋送出的目的地。 |
| TBD-PROF-04 | Profile | 真的取消訂閱 + 真的刪除帳號。 |
| TBD-PROF-05 | Profile | 真實統計資料來源。 |
| TBD-SHARE-01 | Share | 伺服器端分享連結解析 + 真的到期。 |
| TBD-EXP-08 | Explore | 真實 like/share/play 計數 + 登入門檻。 |
| TBD-SONG-06 | Song | 正式環境的歌曲失敗觸發機制。 |
| TBD-EXP-10 | Explore | Publish/feed 的 **language code 格式(2 碼 vs 3 碼)由 RD 討論後給答案**;前端只負責傳遞並向後端要已排序資料。 |

## 🐞 已知 bug — RD 直接修(非策略選擇)

| ID | 領域 | 說明 |
|---|---|---|
| TBD-EXP-09 | Explore | 創作者 Songs 分頁播錯歌(播放清單查找)。 |
| TBD-MV-09 | MV | 生成畫面在「有 storyboard 但 idle」時卡在 0%。 |
| ~~TBD-MV-10~~ | MV | **已併入 MV-08 的 Edit MV 改版** — 移除 Save 後,Merge 由任何編輯觸發,不需另修。 |
| TBD-HIST-06 | History | 失敗項目應只剩 Delete(現多了 Like+Share)。 |
| TBD-SONG-05 | Song | 歌曲頁點數顯示寫死 390,應接即時餘額。 |
| TBD-SHELL-04 | Shell | 載入時的登入狀態閃爍(頂部列未等 hydrated)。 |
| _(EXP-02)_ | Explore | Create 門檻不一致 → 已併入 GL-02 一起處理。 |

## ⏳ 仍待議 / 待設計 — 這 6 項還需要你或設計師後續拍板

| ID | 領域 | 待處理 |
|---|---|---|
| TBD-MV-07 | MV | MV 類型介紹 / Style-Picker → **等設計師出 guideline + UX flow**。 |
| TBD-SONG-07 | Song | 歌詞生成支援的語言清單。 |
| TBD-EXP-03 | Explore | MV 播放器 9:16↔3:4 切換 + 上滑看下一支。 |
| TBD-EXP-05 | Explore | 真實多元創作者 + 檢舉/封鎖。 |
| TBD-AUTH-04 | Auth | **Web 專屬**的訪客瀏覽/門檻規範(需詳細訂,不能直接照 App)。 |
| TBD-SHARE-02 | Share | Web 適合的社群分享平台(和 App 不同,細節待補)。 |

---

## PM 該去哪裡看(導覽)

- **這份檔案** — 決策後的分類總覽。你目前主要還要處理的是最下方 ⏳ 的 6 項。
- **[`handoff.md`](handoff.md)** — 要改 codebase 的變更清單(給下一個 session)。
- **`index.html`** — 視覺化導覽首頁。
- **每份 `areas/<n>.md` 第 8 節** — 各領域決議的權威記錄。
- **`00-overview.md` 第 9 節** — 全域決議 + 第 8 節 App→Web 對照表。

| 日期 | 變更 |
|---|---|
| 2026-07-22 | 首次彙整所有 TBD。 |
| 2026-07-22 | 改寫為台灣繁體中文。 |
| 2026-07-22 | 新增「若無異議→建議做法」欄位。 |
| 2026-07-22 | PM 完成一輪決策;改為「決策後分類」呈現,並連動 `handoff.md`。 |
