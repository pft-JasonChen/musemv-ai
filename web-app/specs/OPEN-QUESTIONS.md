# 待確認事項總表(Open Questions — 仍待處理項目)

> **權威來源:** 每項的完整說明記在該領域 spec 的第 8 節(或全域在 `00-overview.md` 第 9 節)。這份檔案
> 只彙整**跨領域**且**仍待你或設計師拍板**的項目;已定案並已實作的項目不再列出(見各 spec 的現況描述)。
>
> **圖例:** ⏸ Phase 2(MVP 不做)· 📄 只補 spec、後端由 RD 之後實作(Curation)· 🔧 後端實作(RD)·
> ⏳ 仍待議/待設計。

---

## ⏸ Phase 2 — MVP 不做,放進 Phase 2 待辦

| ID | 領域 | 說明 |
|---|---|---|
| TBD-GL-03 | 全域 | Onboarding / Splash 網頁版先不做,之後可能新增。 |
| TBD-MV-03 | MV | 多臉自動偵測延後;MVP 維持手動裁切。 |

## 📄 只補 spec、不改 codebase — Curation(後端由 RD 之後實作)

| ID | 領域 | 說明 |
|---|---|---|
| TBD-GL-05 | 全域 | Curation 排序 + 審核為後端 track;只補 spec,不動 code。 |
| TBD-EXP-01 | Explore | 4 條內容軌的評分/資格/更新/去重(依 Curation PRD)。 |
| TBD-EXP-07 | Explore | Publish→動態牆 + AI/人工審核 + 管理員置頂(依 Curation PRD)。 |
| TBD-MV-06 | MV | Publish 前端確認流程已完成;後端審查 pipeline 仍未定義(同上,依 Curation PRD)。 |
| TBD-HIST-04 | History | Publish = 確認→送審→上社群 的前端流程已完成;後端 pipeline 仍未定義(同上)。 |

## 🔧 後端實作 — RD 負責(prototype 維持 mock)

| ID | 領域 | 說明 |
|---|---|---|
| TBD-GL-04 | 全域 | 正式環境的狀態持久化(history、storyboard、credits、subscription、profile 皆需接後端)。 |
| TBD-CR-01 | Credits | 真的 IAP(App Store / Play Store)。 |
| TBD-CR-04 | Credits | 真實點數帳本(`CreditsDetailModal` 目前是靜態假資料)。 |
| TBD-AUTH-01 | Auth | 真的登入整合(供應商、session/token)。 |
| TBD-PROF-01 | Profile | 通知推播串接。 |
| TBD-PROF-02 | Profile | 意見回饋送出的目的地。 |
| TBD-PROF-04 | Profile | 真的取消訂閱 + 真的刪除帳號。 |
| TBD-PROF-05 | Profile | 真實統計資料來源(目前是靜態 `SAMPLE_CREATIONS`)。 |
| TBD-SHARE-01 | Share | 伺服器端分享連結解析 + 真的到期。 |
| TBD-EXP-08 | Explore | 真實 like/share/play 計數持久化(登入門檻已完成)。 |
| TBD-SONG-06 | Song | 正式環境的歌曲失敗觸發機制。 |
| TBD-EXP-10 | Explore | Publish/feed 的 **language code 格式(2 碼 vs 3 碼)由 RD 討論後給答案**;前端只負責傳遞並向後端要已排序資料。 |

## ⏳ 仍待議 / 待設計 — 這 7 項還需要你或設計師後續拍板

| ID | 領域 | 待處理 |
|---|---|---|
| TBD-MV-07 | MV | MV 類型介紹 / Style-Picker → **等設計師出 guideline + UX flow**。 |
| TBD-MV-11 | MV | Choose Song 的空狀態("尚未建立歌曲" + 建立捷徑)尚未實作,seed 目前一律有資料。 |
| TBD-SONG-07 | Song | 歌詞生成支援的語言清單。 |
| TBD-EXP-03 | Explore | MV 播放器 9:16↔3:4 切換 + 上滑看下一支。 |
| TBD-EXP-05 | Explore | 真實多元創作者 + 檢舉/封鎖。 |
| TBD-AUTH-04 | Auth | **Web 專屬**的訪客瀏覽/門檻規範(需詳細訂,不能直接照 App)。 |
| TBD-SHARE-02 | Share | Web 適合的社群分享平台(和 App 不同,細節待補);社群分享目前 MVP 移除,只剩複製連結。 |
| TBD-SHARE-03 | Share | 已決定分享連結要帶分析追蹤,但追蹤哪些收件者資料仍未定義。 |
| TBD-CR-06a | Credits | 點數改為「僅訂閱者可購買」後,免費用戶的起始點數該給多少(0?小額試用包?)仍待拍板。 |

---

## Proof of Creation — 已移除(不在 web 範圍)

2026-07-24:App F21「創作證明」決定不做,`/proof` 路由與 `ProofView` 元件已從程式碼移除,History 選單
的「Get Proof」也已拿掉。詳見 [`areas/08-proof-of-creation.md`](areas/08-proof-of-creation.md)。

---

## PM 該去哪裡看(導覽)

- **這份檔案** — 跨領域、仍待拍板的項目彙整。
- **每份 `areas/<n>.md` 第 8 節** — 各領域仍待處理項目的完整說明。
- **`00-overview.md` 第 9 節** — 全域仍待處理項目 + 第 8 節 App→Web 對照表。
- **`index.html`** — 視覺化導覽首頁。
