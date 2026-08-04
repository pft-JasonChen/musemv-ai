# Project Overview

- 產品名稱是 YCM。
- YCM 是一個使用 AI 製作 MV 與歌曲的網站。
- 這個專案是 UI Prototype，不是正式 Production Frontend。
- 主要用途是提供老闆在瀏覽器中 Review UI 與操作流程。
- 次要用途是讓 RD 查看並局部複製 Component 與 CSS。
- 不需要做到可直接串接後端或正式上線的程度。

# Technology

- React
- TypeScript
- Vite
- 一般 CSS
- 不使用 Tailwind
- 不使用 UI Framework
- 不使用 CSS-in-JS
- 不使用複雜狀態管理
- 不建立後端
- 不串接 API
- 不安裝額外套件，除非我明確同意

# Code Principles

- 程式碼要簡單、清楚、容易理解。
- Component 名稱要對應畫面上的 UI 功能。
- 不要過度拆分 Component。
- 重複出現的 UI 才拆成共用 Component。
- Component 專用 CSS 放在 Component 旁邊。
- 避免 inline style。
- 使用 Mock data 與 local state 模擬操作。
- 不要建立不必要的工程架構。
- 任何畫面上的動態變化（顯示/隱藏、展開/收合、狀態切換等）都要自動加上 transition，不可以是瞬間跳變。實作細節見 AGENTS.md 的 Coding and naming conventions。

# Page Structure

- 整個網站只使用一個 index.html。
- 不同頁面使用 React Page Component 管理。
- 頁面放在 src/pages。
- 共用 UI 放在 src/components。
- 共用頁面外框放在 src/layouts。
- 同一頁面的 Empty、Loading、Completed、Error 等屬於不同 state，不建立成不同 HTML。
- A/B 提案可以暫時建立 review 頁面，但確認後要整理回正式頁面。

# Responsive Design

正式參考尺寸：

- Wide Desktop / XL：1920px
- Desktop / L：1440px，主要設計基準
- Laptop / M：1024px
- Tablet / S：768px
- Mobile / XS：375px
- Minimum supported width：320px

規則：

- 不可以只將 Desktop 等比例縮小。
- 必須依空間調整欄數、排列、導覽與元件寬度。
- 避免水平捲軸。
- 文字必須自然換行。
- 圖片與影片必須支援 Landscape、Portrait、Square。
- 不可以拉伸圖片或影片。
- Mobile 行為若沒有設計稿，必須先提出建議並等我確認。
- 每個完成的頁面必須檢查 1920、1440、1024、768、375、320。

# Design Tokens

- 之後會提供 src/styles/tokens.css。
- 顏色、字級、字重、行高與漸層應優先使用 tokens.css。
- 不得自行新增與 tokens.css 重複的顏色或 Typography。
- 不得擅自修改 tokens.css，除非我明確要求。

# Visual Fidelity

- Figma 是唯一的視覺依據。
- 這是設計還原工作，不是重新設計工作。
- 不得自行美化、簡化或改成一般常見 UI。
- 不得增加 Figma 中不存在的元素。
- 不得因為其他間距看起來更標準，就改變 Figma 的設計。
- 不得以「大致相似」作為完成標準。

每次製作新頁面時：

1. 先讀取完整頁面與局部參考圖。
2. 先分析 Layout、尺寸、間距、字體、對齊與媒體比例。
3. 列出無法確認的部分，不得自行猜測。
4. 等我確認後再實作。
5. 第一輪先完成主要 Layout。
6. 第二輪校正尺寸、間距、Typography、Color、Border、Radius 與圖片處理。
7. 完成後主動比較目前畫面與 Figma。
8. 列出仍不一致的地方。
9. 在我確認前，不要宣告已完成。
10. 在我確認前，不要建立 Git commit。

# Communication

- 我是設計師，主要熟悉 HTML 與 CSS。
- 對 React、TypeScript、npm 與 Git 是初學者。
- 每次修改後，請用容易理解的方式說明：
  1. 修改了哪些檔案
  2. 每個檔案的用途
  3. React 程式對應到畫面上的哪個區塊
