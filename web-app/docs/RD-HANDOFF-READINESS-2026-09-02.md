# 交接盤點 — 可以交給 RD 了嗎?(2026-09-02)

> **這份取代 `SPEC-READINESS-2026-09-01.md` 的「第 4 節隊列」與「第 5 節結論」。**
> 前一份的結論是「隊列清空」,那是對的 —— 十份 storyboard spec 都建好了。但它同時在第 4 節
> 標了四個「需補」,那四個**到今天都還沒補**,而且當天稍晚的程式碼改動又讓第五份過期。
> 這份的每一條都經過**實測**(跑 gate、grep 程式碼、開截圖看),不是讀文件。

---

## 0. 一句話結論

**程式碼可以交,QA 的 storyboard spec 還不能當 final。**

| 交付物                       | 狀態                                             |
| ---------------------------- | ------------------------------------------------ |
| 程式碼 + 12 份 area spec     | ✅ 可以交 —— 但 RD 會被 3 個**契約缺口**擋住實作 |
| 10 份 storyboard spec(給 QA) | 🟠 **5 份與現況不符**,QA 會照著錯的截圖測        |
| 15 張 flow diagram           | ✅ 2026-09-02 全部重畫並加上幾何 gate,0 findings |

---

## 1. ✅ 今天實測過的 gate

| Gate                          | 結果                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `npm run typecheck`           | exit 0                                                        |
| `npm run lint`                | exit 0                                                        |
| `npm run test:run`            | 120 passed (12 files)                                         |
| `npm run build`               | exit 0                                                        |
| 10 份 storyboard `validate()` | 全部 OK,0 warnings                                            |
| `lint_spec.py`                | 9 份 0 findings;`song-creation` 5 findings(advisory,字數上限) |
| `check_flowchart.py --strict` | 15 張圖 0 findings                                            |

`npm run e2e` 依 `AGENTS.md` 由 Stop hook 跑,不在這裡執行。

---

## 2. 🟠 交 QA 前必補 —— 5 份 storyboard spec 與程式碼不符

這是本次掃描**新發現**的。`518bc71`(2026-09-02)那一輪改了六處產品行為,但只有
`song-creation` 重拍了截圖,而它連截圖都拍到舊狀態。

| Spec                     | 建置版本       | 問題                                                                                                                                                                                                                                | 嚴重度                    |
| ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **S1 `song-creation`**   | v2, 2026-08-25 | **截圖裡 GENRE `Pop` / MOOD `Uplifting` 是選中的**,程式碼 `DEFAULT_SONG_COMPOSE` 已改成 `""` / `""`(產品負責人 2026-09-01 第二次裁示)。spec 文字還寫「They start non-empty」。實測 `06_custom_empty.png` 兩顆 chip 都有紫色選取框。 | 🔴 QA 會照錯的截圖測      |
| **S7 `profile-account`** | v1, 2026-08-31 | spec 說 Change Photo 是「a mock _Change Photo_ cycle」。程式碼已改成**真的 `<input type="file">` + 圓形裁切**(`FacePickerModal variant="avatar"`,192×192 正圓)。                                                                    | 🔴 描述的是已被取代的行為 |
| **S2 `mv-creation`**     | v1, 2026-08-27 | 缺兩項:①「上傳不到 30 秒的音檔會在**上傳當下**跳 toast」(`Audio must be at least 30 seconds.`);② `/mv/creating` 的 render 進度畫面(Encoding video… / Estimated time remaining / **View Later**)。                                   | 🟠 少了兩條可測行為       |
| **S6 `shell-auth`**      | v1, 2026-08-27 | 缺 Footer **Contact 的登入閘** —— 登出點擊開 Sign in dialog,登入後才開 Send Feedback。                                                                                                                                              | 🟠 少了一條可測行為       |
| **S4 `history`**         | v1, 2026-08-27 | 缺 `historyEmpty` / `historyLoading` 兩個 `?demo=1` 狀態。目前只有「篩選後沒東西」的空狀態(P1-S5)。                                                                                                                                 | 🟠 少了兩個可測狀態       |

**補法:** S1 / S7 需要**重拍截圖 + 改 spec 文字**;S2 / S4 / S6 是**加 path/step**(各 2 shots 左右)。
全部都要重跑 `build_spec.py` + `lint_spec.py`。

---

## 3. 🔴 擋 RD 實作的三個契約缺口

不擋 spec 寫作,但 RD 拿到也寫不出來。

| #   | 缺什麼                                                                                                                                                                                                                                                                                                               | 誰能解          | 追蹤                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------- |
| 1   | **整條 Explore / Community 的 API 契約** —— `MuseApi` 完全沒有 community endpoint(feed / detail / like / share / publish / creator)。17 個元件、9 條 route 跑在 `lib/mv/community.ts` 的寫死種子上。Curation PRD 定義了排名**語意**(訊號、權重、資格、更新頻率),但**沒有 endpoint、沒有欄位名、沒有 payload 形狀**。 | RD              | `TBD-EXP-11` `TBD-GL-05` `TBD-EXP-01` `TBD-EXP-07` |
| 2   | **扣點 payload 的欄位契約** —— `consumedType` 全改為 `"credit"` 後,前端須自行帶數量／秒數。欄位名、單位、委派型 action 的數量對應皆未定。`areas/11` §1.1 是**刻意留白的空表**,等產品負責人補。                                                                                                                       | 產品負責人 + RD | `TBD-CC-06`                                        |
| 3   | **Send Feedback 打哪個端點** —— Muse 與 YCO 的 CSB 不是同一套 API。四個 `questionTypeId`、`prodVerId 504`、5 MB 上限在 RD 指認真實端點前**全是暫定值**。                                                                                                                                                             | RD              | `TBD-PROF-07`                                      |

---

## 4. 🟡 PM 待拍板 —— 含 footer link

### 4.1 Footer 死連結(`DESIGNER-TODO` A29)—— 實測 5 條

`src/components/home/Footer.tsx` 目前:

| 欄位        | 連結                                | 狀態                                                                               |
| ----------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| **Studio**  | Music Video Creator · Song Composer | `href="#"` —— **要拍板指向站內哪裡**(推測 `/mv/room`、`/song/create`,但沒人拍板過) |
| **Support** | FAQ                                 | `href="#"` —— 刻意留的佔位,**等真實網址**                                          |
| **Company** | Terms of Service · Privacy Policy   | `href="#"` —— **等真實網址**                                                       |
| **Company** | Contact                             | ✅ 已改為登入閘,不是死連結                                                         |

> ⚠️ **A29 漏算了 2 條。** `BuyCreditsModal.tsx:220,222` 底部還有 **Terms of Use** 與
> **Privacy Policy** 兩條 `href="#"`,和 footer 的是同一個問題(同一批網址),但 A29 沒有列進去。
> 拍板網址時請一起給,**共 5 個目的地**:FAQ、Terms of Service、Privacy Policy、Terms of Use、
> 以及 Studio 兩條的站內目標。

### 4.2 各 spec 掛著的 open question

| 來源                 | 問題                                                                                                                                                                   | 誰能解            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| S5 `Q-01`            | CR-05「你已經是 Muse Pro」狀態**沒有活的觸發點** —— 每個 `openSubscribe()` 都條件在 `!subscribed`,訂閱後沒有任何東西會重開對話框。這個狀態要留還是刪?                  | 產品負責人        |
| S5 `Q-02`            | 從 header credit pill 買點數**不會有 toast** —— 共用對話框在全 app 都沒掛 `onPurchased`,只有從 `/profile/credits` 的 Buy More 進去才有確認。                           | 產品負責人 / RD   |
| S5 `Q-03`            | 確認版 pricing deck 只給價格,**沒給 store identifier**。程式碼還帶 app 形狀 SKU(`ycm_ios_*` / `subscribe_*_ycm`),從未為 web 確認過。                                   | RD(`TBD-CR-11`)   |
| S8 `Q-01`            | **Curation PRD 自己矛盾兩次。** Trending MV 權重表寫 45 / 30 / 15 / 10,公式寫 0.35 / 0.25 / 0.15 / 0.10(加總 0.85);Top Picks 也有同樣的落差。**規則有效,數字待重出。** | 產品 / RD         |
| S2 `Q-03`            | `TBD-MV-11` 的 Choose Song 空狀態(「You haven't created any songs yet」+ 建立捷徑)還算不算 V1?UI 已寫好但 `MY_SONGS` 固定兩筆讓它永遠碰不到 —— 是死碼不是未實作。      | 產品負責人        |
| S2 `Q-04`            | 「pending review」在後端**實際上做什麼**?                                                                                                                              | RD(Curation PRD)  |
| S7 `Q-01`            | 「在手機上訂閱」的 Unsubscribe 對話框(P4-S6)**沒有 Figma** —— 現在的文案是 build session 自己寫的。                                                                    | 設計 / 產品負責人 |
| S7 `Q-02`            | Feedback 送出失敗**沒有任何觸發途徑**(AC-PROF-14 / PROF-E6),`?demo=1` 也沒有。要不要比照 `jobFail` 加一個 `feedbackFail` flag?                                         | RD / 產品負責人   |
| S4 `TBD-HIST-05`     | **審核被退件的 MV 長什麼樣?** Publish 同時設 `reviewing` 與 `published`,沒有任何東西會清掉 `reviewing` —— 沒有延遲、沒有退件路徑、沒有 UI。                            | 產品負責人 / 設計 |
| S1/S2/S3/S5/S7/S8/S9 | **Credit Consume MSR 文件的連結** —— 七份 spec 的 RULES 條目都掛著「TBD」,無法引用真實出處。                                                                           | 產品負責人        |

### 4.3 仍待議 / 待設計(來自 `OPEN-QUESTIONS.md`)

`TBD-SONG-07` 歌詞生成支援的語言清單 · `TBD-AUTH-04` **Web 專屬**的訪客瀏覽/門檻規範(不能直接照
App)· `TBD-SHARE-03` 分享成效追蹤要收哪些欄位(BA 定義,前端刻意留空不先猜)·
`TBD-EXP-05` 真實多元創作者 + 檢舉/封鎖。

---

## 5. ⚪ 已知但不擋交接

| 項目                                   | 說明                                                                                                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`OPEN-QUESTIONS.md` 過期**           | 停在 2026-08-12(含 08-19/08-20 補丁),**沒跟上 09-01 的裁示**。`TBD-EXP-03`、`TBD-SHELL-01`、`TBD-CR-08` 都已結案卻還列在待辦裡;「來源 PRD 至今未讀」也已不成立(09-01 讀完了)。PM 拿這份給 RD 會誤導。                |
| **`specs/index.html` 過期**            | 最後建於 2026-08-27。九份 area spec 在 09-02 改過、`12-notifications-email.md` 是新增的,索引都不知道;而且**完全沒有任何 storyboard spec 的連結** —— QA 沒有單一入口。重建需要 `pip install markdown`(這台機器沒有)。 |
| **`TODO.md` #9**                       | `/mv/edit` 的 `Recreate (26credits)` 少一個空格。產品負責人 2026-08-28 裁示「等 S3 spec 落地後再修」—— 現在可以修了,但修了要重拍 S3 的 2 張截圖並拿掉 `strings_ignore`。                                             |
| **a11y 驗收從未完成**                  | G7 的 A1–A5 唯一跑過的一次因環境壞掉被作廢。`e2e/a11y.spec.ts` 有三個盲點:不 seed 登入(4 條 guarded route 只掃到登入牆)、只有桌機寬度(整套手機 chrome 從未被掃過)、只掃英文未加前綴的路由。                          |
| **`DESIGNER-TODO` 還開著 15 條**       | A1 A2 A3 A4 A6 A8 A9 A10 A13 A14 A15 A16 A20 A24 A29。依 2026-08-06 的 scope rule **刻意保留給下一版設計稿**,不是漏做的工。其中 A1 / A9 / A13 是 WCAG AA 對比度(A1 的 accent pill 已由產品負責人裁示 Won't fix)。    |
| **`song-creation` 5 個 lint findings** | advisory(`P2-S1.system` 26 字超過 25 字上限等),不擋 build。既有,不是這次產生的。                                                                                                                                     |

---

## 6. 建議的交接順序

1. **補第 2 節的 5 份 storyboard spec** —— 這是唯一會讓 QA 測錯的東西,也是最快能做完的(S1 / S7 重拍,S2 / S4 / S6 加 step)。
2. **重建 `specs/index.html`,把 10 份 storyboard spec 加進去** —— QA 需要一個入口。
3. **更新 `OPEN-QUESTIONS.md` 到 09-02 的現況** —— 否則 RD 會去追已經結案的題。
4. 以上三項完成後,**程式碼與 spec 可以交**;第 3 節的三個契約缺口與第 4 節的拍板事項**平行進行**,不必等。
