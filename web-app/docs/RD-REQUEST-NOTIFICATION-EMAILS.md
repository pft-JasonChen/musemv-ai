# RD Request — 通知信件

## 這是什麼

Prototype（`web-app/`）目前**完全沒有寄信功能**——沒有 mail service、沒有寄信 API，`email` 只是
個人資料上的一個欄位而已。這份文件是要請 RD 在真正的後端上實作「事件觸發寄信」，並直接提供
文案內容（含 placeholder 格式，比照 RD 現有系統的 FreeMarker + `.properties` 做法）。

## 現況釐清（跟 RD 對過的結論）

| 情境                        | 誰寄                                                                                  | 這份文件要不要提                      |
| --------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| 驗證信（Verify your email） | **RD** 已經在寄，這次是補上 Muse 專屬文案                                             | ✅ 情境 1                             |
| Onboarding / Welcome 信     | 原本 **marcom** 用第三方平台寄；marcom 已確認**停用第三方平台**，希望改回請 **RD** 寄 | ✅ 情境 2（這是要再提一次的 request） |
| 影片生成完成信              | **RD** 產生 template                                                                  | ✅ 情境 3                             |
| Storyboard 生成完成信       | **RD** 產生 template                                                                  | ✅ 情境 4                             |
| 訂閱成功信                  | **MM 在 2Checkout（2CO，金流商）後台設定**，不是 RD 做                                | ❌ 移出這份 request，見文末備註       |

> `done.ftl`（RD 提供的參考檔）RD 說是訂閱成功用的 template，但內容結構（`${congratulation}`
> `${content1}` `${content2}` 等 placeholder）其實跟 `language.properties` 裡 `mail.task.done.*`
> 系列（各種「你的成果生成好了」信）完全對得上。我們沒有另外去釐清 RD 內部這支 html 實際掛在
> 哪個情境——反正訂閱成功信不用我們提 request，所以這份文件只借用它的 **placeholder 結構**
> 來套「情境 3、4」這兩封「成果好了，回來看看」的信，如果跟 RD 實際要用的檔案對不起來，麻煩
> RD 直接說。

**品牌色更正**：RD 參考文件裡的連結顏色 `#03ade2`（藍色）是別的產品的主題色，**Muse 的主題色是
紫色 `#a855f7`**（`--accent`，`token-aliases.css`），下面所有文案的連結顏色都已經改用這個值，
連結樣式其他部分（底線、字重）維持 RD 原本的寫法不動。

## 情境總表

| #   | 情境                    | 觸發時機                                           | 收件人   | 動態欄位                                   |
| --- | ----------------------- | -------------------------------------------------- | -------- | ------------------------------------------ |
| 1   | 驗證信                  | 使用者完成註冊表單、後端建立帳號的當下             | 註冊信箱 | `{userName}` `{link}` `{helpMailReciever}` |
| 2   | Onboarding / Welcome 信 | 信箱驗證通過（帳號正式啟用）之後                   | 帳號信箱 | `{userName}` `{helpMailReciever}`          |
| 3   | 影片生成完成信          | MV 生成 job 完成（狀態變成 done）                  | 帳號信箱 | `{userName}` `{link}`                      |
| 4   | Storyboard 生成完成信   | Storyboard job 完成（狀態變成 done，還沒生成影片） | 帳號信箱 | `{userName}` `{link}`                      |

文案格式比照 RD 提供的 `language.properties`：`mail.<情境>.<欄位> = 文字`，連結一律用
`<strong><a href="{link}" rel="noopener" style="text-decoration: underline; color: #a855f7;" target="_blank"><u>文字</u></a></strong>`
這個既有樣式（顏色已改成 Muse 的紫色）。

---

## 情境 1：驗證信

- **觸發**：使用者填完註冊表單、後端建立帳號的當下（不是每次登入都寄，只有新帳號才寄）
- **收件人**：註冊時填的信箱
- **時機**：帳號建立後立即寄出
- **動態欄位**：`{userName}`、`{link}`（驗證連結，含一次性 token，由 RD 後端產生）、
  `{helpMailReciever}`（客服信箱）

```properties
mail.emailVerification.subject = Verify Your Account
mail.emailVerification.greeting = Hi {userName},
mail.emailVerification.welcome = Welcome to YouCam Muse!
mail.emailVerification.content1 = You're receiving this message because you recently signed up for YouCam Muse. Confirm your email address by clicking the button below. So you won’t miss out on future product updates, new features, or special offers.
mail.emailVerification.linkButt = Verify Your Email Address
mail.emailVerification.content2 = This link will expire in 24 hours. If you have questions, we're <strong><a href="mailto:{helpMailReciever}" rel="noopener" style="text-decoration: underline; color: #a855f7;" target="_blank"><u>here</u></a></strong> to help.
mail.emailVerification.end1 = Sincerely,
mail.emailVerification.end2 = The Perfect Corp. YouCam Team
```

---

## 情境 2：Onboarding / Welcome 信

**這是要再提一次的 request** —— 原本 marcom 透過第三方平台寄，marcom 已確認不再用第三方平台，
希望改回請 RD 寄。內容比照 RD 參考文件 welcome 信的豐富版格式（功能亮點區塊 + CTA），但**只放
兩個核心功能**，其他先不放：

| 順序 | 功能                   | 說明                                                                                 | CTA 連結       |
| ---- | ---------------------- | ------------------------------------------------------------------------------------ | -------------- |
| 01   | AI Music Video Creator | Upload a selfie, choose a style, and let AI craft a stunning music video in minutes. | `/mv/room`     |
| 02   | AI Song Composer       | Write your lyrics, pick a style, and let AI generate a full original song.           | `/song/create` |

- **觸發**：信箱驗證通過、帳號正式啟用之後（緊接在情境 1 之後）
- **收件人**：帳號信箱
- **時機**：驗證通過當下寄出
- **動態欄位**：`{userName}`、`{helpMailReciever}`

```properties
mail.welcome.subject = Welcome to YouCam Muse — Let's Get Creative!
mail.welcome.greeting = Hi {userName},
mail.welcome.content1 = Thank you for joining YouCam Muse!
mail.welcome.content2 = Ready to turn your ideas into AI-generated music videos and original songs? We're excited to see what you'll create.
mail.welcome.content3 = Try These Features to See What YouCam Muse Can Do!
mail.welcome.featureTotal = / 02
mail.welcome.feature1.num = 01
mail.welcome.feature1.content1 = AI Music Video Creator
mail.welcome.feature1.content2 = Upload a selfie, choose a style, and let AI craft a stunning music video in minutes.
mail.welcome.feature1.linkButt = Try it Now
mail.welcome.feature2.num = 02
mail.welcome.feature2.content1 = AI Song Composer
mail.welcome.feature2.content2 = Write your lyrics, pick a style, and let AI generate a full original song.
mail.welcome.feature2.linkButt = Try it Now
mail.welcome.content4 = Ready to start creating?
mail.welcome.content5 = <span>Start creating now — <strong><a href="{link}" rel="noopener" style="text-decoration: underline; color: #a855f7;" target="_blank"><u>go to YouCam Muse</u></a></strong></span>
mail.welcome.content6 = We are always <strong><a href="mailto:{helpMailReciever}" rel="noopener" style="text-decoration: underline; color: #a855f7;" target="_blank">here</a></strong> to help with any questions or feedback!
mail.welcome.content7 = Have fun exploring YouCam Muse!
mail.welcome.end1 = Sincerely,
mail.welcome.end2 = The Perfect Corp. YouCam Team
```

**備註**：兩個功能亮點的連結指到 `/mv/room` 或 `/song/create` 這兩個既有入口，兩個路由
未登入也能開啟，登入卡在按下建立按鈕那一步（跟 app 內其他地方一致），所以信件連結不用額外做
免登入機制。

---

## 情境 3：影片生成完成信

- **觸發**：MV 生成 job 完成（狀態變成 done，`resultUrl` 已產生）
- **收件人**：帳號信箱
- **時機**：job 完成時寄出（使用者當下可能已經離開頁面，是非同步的）
- **動態欄位**：`{userName}`、`{link}`（建議路由：`/mv/result?id={mv_id}`）
- **備註**：Muse 的影片不會過期刪除，所以**不放**「請儘速下載，逾期刪除」這類提醒。

```properties
mail.task.done.mv.subject = Your AI Generated Music Video from YouCam Muse is ready!
mail.task.done.mv.greeting = Hi {userName},
mail.task.done.mv.congratulation = <strong>Congratulations! Your AI generated music video is ready!</strong>
mail.task.done.mv.content1 = Your music video has finished generating and is ready to view anytime from your account.
mail.task.done.mv.content2 = <strong><a href="{link}" rel="noopener" style="text-decoration: underline; color: #a855f7;" target="_blank"><u>View Your Video Now</u></a></strong>
mail.task.done.mv.end1 = Sincerely,
mail.task.done.mv.end2 = The Perfect Corp. YouCam Team
```

---

## 情境 4：Storyboard 生成完成信

MV 有兩段式生成：先產生 **storyboard**（分鏡腳本，使用者可以在 `/mv/storyboard` 檢視/編輯），
使用者確認後按下「Create MV」才會真的送出去生成影片——這兩段是各自獨立的 job，storyboard 做完
**不會自動接著生成影片**。這封信就是 storyboard 做完時，請使用者回來看一下、按生成影片用的。

- **觸發**：Storyboard job 完成（狀態變成 done，storyboard 內容已產生，但還沒觸發影片生成）
- **收件人**：帳號信箱
- **時機**：storyboard job 完成時寄出（非同步，使用者當下可能已經離開頁面）
- **動態欄位**：`{userName}`、`{link}`（建議路由：`/mv/storyboard?id={storyboard_id}`，這是 app
  內現有導到 storyboard 頁面的既有路由格式，`/history` 點進某個 storyboard 項目時就是用這個）

```properties
mail.task.done.storyboard.subject = Your Storyboard is Ready — Come Create Your Video!
mail.task.done.storyboard.greeting = Hi {userName},
mail.task.done.storyboard.congratulation = <strong>Your storyboard is ready for review!</strong>
mail.task.done.storyboard.content1 = We've finished putting together your storyboard. Come take a look, make any edits you'd like, and generate your music video when you're ready.
mail.task.done.storyboard.content2 = <strong><a href="{link}" rel="noopener" style="text-decoration: underline; color: #a855f7;" target="_blank"><u>Review Your Storyboard</u></a></strong>
mail.task.done.storyboard.end1 = Sincerely,
mail.task.done.storyboard.end2 = The Perfect Corp. YouCam Team
```

**備註**：CTA 文案故意用「Review Your Storyboard」而不是「Create MV」——點進信之後使用者是先
落地在 storyboard 檢視頁，「Create MV」是使用者看完、確認沒問題之後在頁面上按的下一步，這個
按鈕文字跟頁面上現有的 CTA 用字一致（`StoryboardEditor` 的送出按鈕就叫 "Create MV"）。

---

## 給 RD 的重要提醒：情境 3、4 的連結目前還不能真的「帶 id 冷開」

情境 3、4 建議的路由都帶了 `?id=`，但**這是要請 RD 在真正後端一起做的，不是 prototype 現在就有
的能力**：`/mv/result` 和 `/mv/storyboard` 這兩頁目前都只讀瀏覽器記憶體裡的流程 state
（`useMvFlow()`），`?id=` 目前只在 App 內部導頁時使用（例如 `/history` 點某一列），並沒有「純
用 id 去後端撈那支影片/storyboard 內容」的邏輯——如果現在把信寄出去，使用者在別的裝置或分頁點
連結，畫面會因為沒有流程 state 直接被導回 `/mv/room`。等 RD 做真正後端時，這兩個路由需要一併
支援「用 `id` 查詢並還原對應內容」，email 連結才會真的可以打開，而不只是好看的網址格式。

---

## 訂閱成功信（不是這份 request 的一部分）

訂閱成功信是 **MM 在 2Checkout（2CO）後台**設定的，跟 RD 無關，所以這份文件不提供文案。留在
這裡只是備查：如果之後 2CO 那邊的信件內容需要跟 RD 這邊的品牌用語（產品名稱、簽名檔、主題色）
對齊，可以參考本文件情境 1–4 的 `end1`/`end2`/產品名稱/`#a855f7` 寫法。
