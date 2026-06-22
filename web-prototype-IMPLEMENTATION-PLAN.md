# Web Prototype 實作計畫（待你核准）

> 搭配 `HARNESS-SETUP-BRIEF.md` 使用。本文件把建構指示書落地成「實際要跑的步驟」。
> **狀態：計畫階段，尚未動工。** 你核准後我才開始 Phase 1。

## 已確認的決策

1. **架構：全新 Next.js harness**（依建構指示書 §3）。`web-prototype-spec-kit/`（純 HTML pipeline）僅作參考，不沿用其建置方式。手機原型的螢幕會重寫成 React 元件。
2. **第一條垂直切片：MV 製作主流程**（`mv-style → mv-room → mv-mode → mv-thinking → mv-storyboard → mv-creating → mv-result`）。
3. **開發法：spec-driven + test-driven**。每條流程先寫 spec（UX flow 為主、不含後端細節）並與你對齊，acceptance criteria（EARS）直接變成測試，再開始寫元件。
4. **先產出設計系統 token 檔**，確保視覺一致性（已完成：`web-prototype/src/styles/tokens.css`）。
5. **Demo 目標：無後端也能完整 demo 給 CEO**。非同步操作（生成中…）用 mock handler + timer 模擬假資料；UI 走型別化介面 + Zod schema，工程師日後把 mock 換成真後端即可（程式碼可交接為內建加分）。
6. **Viewport：390（手機）/ 768 / 1024 / 1440**。手機版為與現有原型對齊的主基準，其餘為新增的桌機/平板版面。

### 本次已交付（對齊用，尚未 scaffold Next.js app）
- `web-prototype/src/styles/tokens.css` — 設計系統 token（從手機原型抽取）。
- `web-prototype/specs/mv-creation-flow.spec.md` — MV 流程 spec + EARS + 測試情境（**待你審閱/回答其 §6 開放問題**）。

> 尚未執行：`create-next-app`、安裝任何 skill/MCP、寫任何元件。等你核准 spec 後才動工。

---

## 來源盤點（我已讀過的東西）

| 來源 | 內容 | 在計畫裡的角色 |
|---|---|---|
| `ycmuse-prototype/muse-prototype-v2.html` | 8,772 行單檔手機原型，含完整 Figma 同步設計 token（12 階深色灰階、purple/pink accent、完整 Inter 字級）、互動邏輯 | **設計與行為的唯一真實來源**。token 與流程都從這裡抽取 |
| `ycmuse-prototype/assets/` | SVG icon、images、songs、videos | 直接搬進 `web-prototype/public/` |
| `ycmuse-prototype/History_Option_Menu_Spec.md` | History option menu 的狀態×型別矩陣 | 之後 History 切片的現成 spec |
| `web-prototype-spec-kit/` | 成熟但純 HTML 的 Stage 0→4 pipeline、spec-builder | 流程觀念參考；設計系統文件結構可借鏡，但實作改用 React/Storybook |

**手機原型完整螢幕清單（重建目標）：**
splash · onboard · home · song-create/creating/result/player · songs-all · **mv-room/style/storyboard/thinking/creating/result/edit/preview · mv-all · sb-detail** · credits/credits-detail · iap · history · profile · community-profile · proof

---

## 目標檔案結構（建構指示書 §3.1）

```
web-prototype/
  AGENTS.md                 # 共用、< 150 行；被 CLAUDE.md @ 匯入
  CLAUDE.md                 # 第一行 @AGENTS.md + 錯誤日誌
  .claude/
    settings.json           # hooks（prettier/eslint/tsc/vitest）、權限預算
    agents/                 # component-architect / design-reviewer / a11y-checker / code-reviewer
    skills/                 # 人工 import 的開源 skill
    workflows/              # 選用，存 ultracode run
  .mcp.json                 # playwright / chrome-devtools / shadcn
  specs/                    # Spec Kit 產出（EARS）— 交棒用
  src/
    app/                    # 預設 Server Components
    components/ui/          # 自有 shadcn/ui primitives
    styles/tokens.css       # 設計 token（單一真實來源）
  .storybook/               # 元件目錄兼交棒文件
  public/assets/            # 從手機原型搬來的 icon/image/song/video
```

---

## Phase 計畫（對應建構指示書四週路線）

### Phase 1 — 地基（第 1 週）
**目標：整條迴圈跑得通（寫檔→lint→型別→測試→截圖）。**

1. `create-next-app`：TypeScript、Tailwind v4、App Router、ESLint，`src/` 目錄。
2. 開 `tsconfig` `strict: true`，禁 `any`。
3. **設計 token 遷移**：從 `muse-prototype-v2.html` 的 `:root` 抽出全部 CSS 變數 → `src/styles/tokens.css`，並映射進 Tailwind v4 `@theme`。token 是顏色/字級/間距/圓角的唯一來源。
4. 搬 `assets/` → `public/assets/`。
5. `/init` 產 `CLAUDE.md` / `AGENTS.md`；寫入棧設定（Tailwind v4 + shadcn/ui、TS strict、預設 Server Components）、目錄地圖、「一定做／先問我／絕不做」邊界。
6. 設 `.mcp.json`：Playwright（MS 官方）、shadcn（官方）。鎖版本。
7. import `frontend-design`（Anthropic 官方）+ Vercel `agent-skills`（`react-best-practices`、`web-design-guidelines`、`composition-patterns`）。**裝前逐一確認來源與版本。**
8. **驗收切片**：重建 `home` 畫面（純視覺，含 tab bar），用 Playwright 截圖比對手機原型，確認迴圈可用。
   - *完成定義：`tsc` 乾淨、畫面與手機原型像、截圖存檔。*

### Phase 2 — 品質護欄（第 2 週）
1. `.claude/settings.json` hooks：
   - PostToolUse（`Write|Edit|MultiEdit`）→ `prettier --write` → `eslint --fix` → `tsc --noEmit` → `vitest related`。
   - PreToolUse（`Write|Edit`）→ 擋 `.env` 寫入與危險 bash；強制 `'use client'` 規則、禁用套件清單。
   - Stop/SubagentStop → 跑完整 `tsc` + `vitest run` 才能宣告完成。
2. 建 subagent：`component-architect`（sonnet）、`code-reviewer`（sonnet，唯讀）、`a11y-checker`（haiku/sonnet + Playwright）。
3. 架 Storybook，作為元件目錄＋交棒文件。
4. 把 Phase 1 的 token/primitives 補上 story。

### Phase 3 — 視覺迴圈與 MV 切片打磨（第 3 週）
1. 加 OneRedOak `design-review` subagent + `/design-review`（clone 後複製進 `.claude/`）。
2. 加 Chrome DevTools MCP（Google 官方）→ Lighthouse，a11y 目標 ~100。
3. **逐螢幕重建 MV 主流程**（細節見下節），對著手機原型迭代到趨近。

### Phase 4 — 交棒（第 4 週）
1. 裝 Spec Kit（`--integration claude`，v0.10+）。
2. 把已完成切片蒸餾成 **EARS 驗收條件**（`WHEN [條件] THE SYSTEM SHALL [行為]`）寫進 `specs/`。
3. 匯出：元件清單（Storybook + 表）、設計 token theme 檔、**型別化 API 契約 stub**（interface + Zod schema + mock handler）。
4. repo（含 AGENTS.md）交工程師。

---

## 第一條垂直切片：MV 製作主流程（Phase 3 主體）

**螢幕序列：** `mv-room → mv-style → mv-storyboard → mv-creating（mv-thinking）→ mv-result`

**預計元件拆解（`src/components/`）：**
- `ui/`：Button、IconButton、Sheet/Modal、Toast、Chip/Tag、Card、ProgressIndicator、TabBar、NavBar（皆 token 驅動、shadcn 為底）。
- `mv/`：StyleCard（風格選擇）、StoryboardEditor、SceneCard、GenerationProgress（creating/thinking 狀態）、MvResultPlayer、MvActionBar。

**狀態與資料：**
- 用 React state 管流程（選風格 → 故事板 → 生成中 → 結果）。
- 生成過程的非同步狀態（pending/processing/done/failed）以 mock handler 模擬。

**型別化 API 契約 stub（交棒關鍵）：**
- `createMvJob(input: MvCreateRequest): MvJob`
- `getMvJob(id): MvJob`（含 status 機）
- Zod schema：`MvStyle`、`Storyboard`、`Scene`、`MvJob`、`MvResult`。
- mock handler 回傳假資料，工程師之後接真後端。

**驗收（EARS 範例）：**
- WHEN 使用者在 mv-style 選定風格並點繼續，THE SYSTEM SHALL 進入 mv-storyboard 並帶入該風格。
- WHEN MV job status 為 `processing`，THE SYSTEM SHALL 顯示 GenerationProgress 且禁用返回。
- WHEN job status 轉為 `failed`，THE SYSTEM SHALL 顯示錯誤狀態與重試 CTA。

---

## 要 import 的開源 Skill（裝前逐一確認來源/版本）

| Skill | 來源 | 階段 |
|---|---|---|
| frontend-design（官方） | `anthropics/skills` | Phase 1 |
| Vercel agent-skills | `vercel-labs/agent-skills` | Phase 1 |
| OneRedOak design-review | `OneRedOak/claude-code-workflows` | Phase 3 |
| shadcn/ui MCP | shadcn 官方 | Phase 1 |
| Context7（選用） | upstash | 視需要 |
| GitHub Spec Kit | `github/spec-kit`（`--integration claude`） | Phase 4 |

> **不裝 BMAD**（對單人前端原型過重）。第三方 skill 視為不可信程式碼，先第一方、鎖版本。

### Skill 安裝怎麼進行（我會逐一引導，不自動裝）

每要裝一個 skill，我會給你三樣東西，由你決定：
1. **來源與版本**：repo 全名 + 要鎖的 commit/tag，並說明為何信任（第一方優先）。
2. **確切指令**：例如 `npx skills add vercel-labs/agent-skills`（或 `git clone` 後複製 `design-review/` 進 `.claude/`）。
3. **執行方式**：你自己在終端機跑，或核准我在 sandbox 跑給你看。

你可以隨時說「跳過」。沒有你的確認，我不會安裝任何第三方 skill / MCP。

---

## 風險與待確認

1. **單檔 → 元件化的工作量**：手機原型是一個 8.7k 行 HTML，重寫成 React 元件是最大成本。建議按切片漸進，不一次全搬。
2. **手機 → 桌面 RWD**：手機原型是 320px 固定框。網頁版 viewport 為 390/768/1024/1440。**這需要你的設計決策**：MV 流程在寬螢幕怎麼擺？（見 spec §6 開放問題 #2。）
3. **互動邏輯落差**：手機原型的 JS 行為（sheet、toast、狀態機）要對照重建，會用 Playwright 視覺迴圈補「能跑 vs 真的能跑」的落差。
4. **版本飄移**：Claude Code 近乎每日發版；正式採用前對照 changelog。`fable` 模型別名不可依賴。

---

## 我等你拍板的點

- 核准本計畫 → 我開始 **Phase 1**（地基 + home 驗收切片）。
- 或先調整：四週節奏、第一切片選擇、桌面版面方向，都可在開工前改。


## Roadmap — later (from Sondo competitive review)

> Proposed, not yet implemented. Captured 2026-06-21.

- **Discovery / community feed** — an Explore page with Trending / New MVs and Hot / New Songs, play counts + creator attribution (Sondo leads here; we only have private My Creations).
- **Public shareable MV pages** (`/share-mv/...`) with OG tags per video, so Share targets a real public page instead of a placeholder link.
- **Dual-product split** — distinct "Music Video Generator" and "Music Generator" entry points if song creation enters scope.
- **Gallery-style landing** — surface inspiration first rather than a tool dashboard.
