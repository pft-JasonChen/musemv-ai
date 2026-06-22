# Harness 建構指示書 — Web App 從手機原型到網頁原型

> **這份文件給誰看：** Claude（在這個 Cowork 專案裡）。
> **目的：** 一次把「要建什麼樣的 harness」「要人工 import 哪些開源 skill」「用什麼順序開工」講清楚，讓 Claude 直接照著把開發環境（harness）搭起來，然後協作把網頁原型做到趨近 production。
> **負責人：** 我（產品經理，PM）。我負責前端原型與規格；後端與資料庫不在我範圍，之後交給工程師。


---

## 0. 給 Claude 的開場指令（請先讀這段，再開始動作）

你是這個專案的資深前端工程協作者。我是 PM，不是重度工程師。我已經有一個**手機 app 版的 prototype**，現在要做**網頁版（website app）的 prototype**。

請依本文件，**先把 harness（包覆你的開發結構）建立起來，再開始寫任何功能**。建立順序見 §6 的四週路線；但若我要你「現在就全部建好」，請一次跑完第 1–2 週的所有設定步驟。
其他參考檔案: 
1. /web-prototype-spec-kit, 之前website prototype 初階Harness架構，可當作參考，但還是以這份文件的harness架構為準。
2. /ycmuse-prototype, 現階段mobile app prototype，目標是將其作成Website版本，需要使用一樣的使用者流程與設計，因此你需要根據現有prototype製作spec 與test，並且使用一樣的DESIGN SYSTEM進行設計。

核心原則（全程遵守）：

1. **你只負責判斷，結構負責其餘。** 順序、驗證、停止條件盡量交給 hooks 與 script，不要靠你「記得」。
2. **範圍 = 前端。** Next.js / React / TypeScript。後端與 DB 不要實作，只產生**型別化的 API 契約 stub**（介面、Zod schema、mock handler）給工程師接。
3. **前端要趨近 production，不是 demo。** 元件架構、TypeScript 嚴格模式、設計 token、無障礙（a11y）、可測試性都要顧。
4. **每次我指出你做錯，就把教訓寫進 `CLAUDE.md`**（複利工程）。
5. **第三方 skill / MCP 視為不可信程式碼**：優先用 Anthropic／Vercel／Microsoft／Google 第一方來源，鎖版本，不亂裝。
6. 任何破壞性操作（刪檔、`git reset --hard`、改 `.env`）一律先問我。

---

## 1. 專案情境與目標

| 項目 | 內容 |
|---|---|
| 我的角色 | PM，單人開發 prototype |
| 現況 | 只有手機 app 版 prototype |
| 要做的 | 網頁版（website app）prototype |
| 技術棧 | Next.js（App Router）+ React + TypeScript + Tailwind v4 |
| 我的範圍 | **前端**：UI、元件、互動、設計系統、a11y |
| 不在我範圍 | 後端 API 實作、資料庫（交工程師） |
| 最終交付 | (1) 趨近 production 的前端原型 repo；(2) 一份工程師能照著做的 spec／交棒包 |

**這份 harness 要同時服務兩個目標：** 讓 AI 幫我把前端做到接近 production 品質，並且產出能無縫交棒給工程師的規格與契約。

---

## 2. 取捨結論：採用並精簡（adopt-and-thin），不要從零自建

我（PM）不該手刻一套 orchestration harness。最快達到接近 production 的路徑，是**在 Claude Code／Cowork 已經很強的原生能力之上，組合幾個經過實戰驗證、且專為前端設計的開源零件**。

- **不要自建複雜 harness**：那要寫／維護 JS 編排、hooks、subagent 定義，正是我想避開的工程負擔。
- **不要上重量級方法論（如 BMAD、完整 Agile 多 agent 流程）**：對「單人前端原型」是殺雞用牛刀（一次完整規劃到實作的循環有人實測約 $200 用量）。連 Agent OS v3 都已把編排退回交給 Claude Code 的 Plan Mode。
- **Dynamic Workflows（`ultracode`）只在偶爾的大型平行任務時用**（例如一次稽核所有元件的 a11y），不要用在日常單一元件開發。

> 一句話策略：**用 `create-next-app` 當地基 → 疊官方 frontend-design + Vercel agent-skills + Playwright MCP 視覺審查迴圈 → 用 Spec Kit 做交棒。**

---

## 3. 要建立的 Harness 架構

### 3.1 檔案結構（請建立成這樣）

```
web-prototype/
  AGENTS.md                 # 正規、共用、< 150 行；被 CLAUDE.md 以 @ 匯入
  CLAUDE.md                 # 第一行：@AGENTS.md ＋ Claude 專屬補充與錯誤日誌
  .claude/
    settings.json           # hooks（prettier/eslint/tsc/vitest）、權限預算
    agents/                 # 自訂 subagents（見 3.2）
      component-architect.md
      design-reviewer.md
      a11y-checker.md
      code-reviewer.md
    skills/                 # 人工 import 的開源 skill（見 §4）
    workflows/              # 偶爾存下的 ultracode run（選用）
  .mcp.json                 # MCP 伺服器：playwright、chrome-devtools、shadcn
  specs/                    # Spec Kit 產出（EARS 驗收條件）— 交棒用
  src/
    app/                    # 預設 Server Components
    components/
      ui/                   # 自有的 shadcn/ui primitives
    styles/
      tokens.css            # 設計 token（單一真實來源）
  .storybook/               # 元件目錄，兼交棒文件
```

### 3.2 要建立的 Subagents（放 `.claude/agents/`）

| Subagent | 建議模型 | 工具權限 | 職責 |
|---|---|---|---|
| `component-architect` | sonnet | Read, Glob, Grep, 有限 Write | 規劃元件層級、props / 型別、composition 模式；先計畫再寫 |
| `design-reviewer` | sonnet（+ Playwright MCP） | Read, Bash, Playwright | 對活的元件截圖、比對參考設計、檢查視覺層級／RWD／各種狀態 |
| `a11y-checker` | haiku 或 sonnet | Read, Bash, Playwright | 跑 axe-core / jsx-a11y ＋ Playwright 無障礙樹快照，標 WCAG AA 問題 |
| `code-reviewer` | sonnet | **唯讀**：Read, Grep, Glob | TS 嚴格度、prop drilling、死碼；獨立 context 做對抗式審查（修自我偏袒） |

> `design-reviewer` 請參考 OneRedOak 的 design-review 模式（見 §4），它用 Playwright 對真實 UI 即時互動測試，對標 Stripe／Airbnb／Linear 級標準與 WCAG AA+。
> 探索程式碼時用內建的 **Explore**（Haiku、唯讀）即可，不必另建。

### 3.3 要設定的 Hooks（`.claude/settings.json`）

- **PostToolUse（matcher: `Write|Edit|MultiEdit`）** → 對改動檔依序跑：`prettier --write` → `eslint --fix` → `tsc --noEmit`（型別檢查）→ `vitest related`（只測碰到的）。寫檔當下就抓違規，不要等 CI。
- **PreToolUse（matcher: `Write|Edit`）** → 擋 `.env` 寫入與危險 bash；強制 Next.js 規則（例如 client 元件要有 `'use client'`、禁用的套件清單）。
- **Stop / SubagentStop** → 宣告完成前跑完整 `tsc` ＋ `vitest run`，沒過不准說「done」。
- （選用）**PreCompact** → 在 context 壓縮前重申「不可遺忘」的目標與禁改檔案，對抗 goal drift。

### 3.4 CLAUDE.md / AGENTS.md 內容原則

- `AGENTS.md` 當**正規共用層**，維持 < 150 行：指令清單、程式風格、目錄地圖、測試方式、邊界（「一定做 / 先問我 / 絕不做」三段）。讓未來工程師的 agent 工具（Cursor／Codex 等）也讀得到。
- `CLAUDE.md` **第一行寫 `@AGENTS.md`** 匯入，下面放 Claude 專屬補充與**錯誤日誌**（我每次糾正你，你就在這裡加一條）。
- `create-next-app` 會自動生成 Next.js 受管區塊（指向版本對應的 bundled docs）——**保留它**，把我的棧設定（Tailwind v4 + shadcn/ui、TS strict、預設 Server Components）寫在受管標記之外。

### 3.5 要設定的 MCP 伺服器（`.mcp.json`）

| MCP | 來源 | 用途 |
|---|---|---|
| **Playwright MCP** | Microsoft（官方） | 視覺／互動測試、無障礙樹快照——design-reviewer 與 a11y-checker 的眼睛 |
| **Chrome DevTools MCP** | Google（官方） | Lighthouse 稽核、Core Web Vitals、a11y 樹 |
| **shadcn/ui MCP** | shadcn（官方免費版） | 正確安裝元件、不會幻想 props |
| （選用）**Figma MCP** | Figma | 匯入設計 token / 規格 |

---

## 4. 要「人工 import」的開源 Skill（請我手動加入，或指示我怎麼加）

> 以下都用 `npx skills add ...` 或從 repo 複製到 `.claude/skills/`。**先裝第一方（Anthropic／Vercel／Microsoft／Google），鎖版本。**

| Skill / 套件 | 來源（repo） | 約星數 | 作用 | 取得方式 |
|---|---|---|---|---|
| **frontend-design**（官方） | `anthropics/skills` | — | 逼出有辨識度、production 級 UI，避開「AI slop」（千篇一律字體、紫色漸層 SaaS 版型） | Anthropic 官方 skill 庫 / plugin marketplace |
| **Vercel agent-skills** | `vercel-labs/agent-skills` | ~27.6k★ | `react-best-practices`（8 類 40+ 規則）、`web-design-guidelines`（100+ a11y/perf/UX 規則）、`composition-patterns` | `npx skills add vercel-labs/agent-skills` |
| **OneRedOak design-review** | `OneRedOak/claude-code-workflows` | ~3.3k★ | `/design-review` slash command + Playwright 驅動的視覺審查 subagent（對標頂級產品標準與 WCAG AA+） | clone 後把 `design-review/` 複製進 `.claude/` |
| **shadcn/ui MCP / skill** | shadcn（官方） | — | 無障礙、可自有的元件 primitives | 官方 MCP server（免費） |
| **Context7**（選用） | upstash | — | 即時版本對應的套件文件，減少幻想 API | MCP / skill |
| **GitHub Spec Kit** | `github/spec-kit` | ~111k★ | 交棒階段產生 spec / EARS 驗收條件 | `--integration claude`（v0.10+ 用 `--integration`，不要用舊的 `--ai`） |

> **重要：別裝 BMAD（~49k★）** 之類重量級多 agent 方法 —— 對單人前端原型過重。需要時再說。
> **安全提醒：** 有研究指某些市集逾 13% 的 skill 含嚴重漏洞、約 36% 帶 prompt injection。每個 skill 裝前請我確認來源與版本。

---

## 5. 怎麼讓原型「趨近 production」（請把這些織進 harness）

1. **元件驅動開發 + Storybook**：每個元件獨立、有文件；Storybook 同時是交棒文件。
2. **設計 token 為單一真實來源**：在 `styles/tokens.css` / Tailwind v4 theme 定義；design-reviewer 要強制「每個顏色／字級都從 token 衍生」。
3. **視覺審查迴圈**：Playwright MCP + `design-reviewer` 讓你能**真的看到**畫面、讀 console、改視窗大小、自我修正 —— 補上「應該能跑 vs 真的能跑」的落差。
4. **無障礙**：axe-core / jsx-a11y 進 CI + Playwright 無障礙樹快照 + Lighthouse（經 Chrome DevTools MCP）。保留一次人工鍵盤／螢幕報讀器檢查（自動工具只完整覆蓋少數 WCAG 成功準則）。
5. **Playwright 視覺回歸 / E2E**：把審查迴圈產出的測試存成可重用的測試碼。
6. **TypeScript 嚴格**：`strict: true`，由 PostToolUse 的 `tsc` hook 強制；不准用 `any`。

---

## 6. 開工順序（單人 PM 約 4 週）

### 第 1 週 — 地基
- `create-next-app`（TypeScript、Tailwind、App Router）。
- 跑 `/init` 生成 CLAUDE.md / AGENTS.md。
- import `frontend-design` + Vercel skills；加 Playwright + shadcn MCP。
- 寫 AGENTS.md（棧、token、「預設 Server Components」、TS strict）。
- vibe-code 一個畫面，驗證整條迴圈跑得通。

### 第 2 週 — 品質護欄
- 加 PostToolUse hooks（prettier → eslint → tsc → vitest）。
- 建 `code-reviewer` 與 `a11y-checker` subagent。
- 架 Storybook；定義設計 token。

### 第 3 週 — 視覺迴圈與打磨
- 加 OneRedOak `design-reviewer` subagent + `/design-review`。
- 對著參考設計逐元件迭代；經 Chrome DevTools MCP 接 Lighthouse，目標 a11y 分數 ~100。

### 第 4 週 — 交棒
- 裝 Spec Kit（`--integration claude`）。
- 把原型蒸餾成帶 **EARS 驗收條件**（`WHEN [條件] THE SYSTEM SHALL [行為]`）的 spec。
- 匯出**元件清單 + 設計 token + 型別化 API 契約 stub**。
- 把 repo（含 AGENTS.md）交給工程師——AGENTS.md 會隨 repo 一起走，他們的 agent 工具直接繼承慣例。

---

## 7. 交棒包（給工程師的最終交付）

請在 `specs/` 與 repo 內備齊：

1. **Spec + EARS 驗收條件**（Spec Kit `/speckit.specify` 產生）：user story、功能與非功能需求（效能預算、a11y 目標）、out-of-scope 註記。
2. **元件清單**：Storybook + 一張表（元件、props/型別、狀態）。
3. **設計 token**：匯出的 theme 檔。
4. **API 契約 stub**：型別化 interface / Zod schema / mock handler，工程師填真實後端。這讓我的前端與後端解耦，也給工程師明確契約。
5. **可運作的原型 repo 本身**（含 AGENTS.md）。

---

## 8. 何時升級到 Dynamic Workflows（`ultracode`）

只在偶爾的大型平行任務用，例如：

```
ultracode：稽核 src/components 底下每個元件的 WCAG AA 與缺漏的鍵盤事件處理
```

**日常單一元件開發不要用**（會多花不少 token）。第一次跑務必縮小範圍試成本，用 `/workflows` 看 token 用量。

---

## 9. 注意事項（請記得提醒我）

- Claude Code 幾乎每天發版；版本相關行為可能再變，正式採用前對照 `code.claude.com/docs/changelog`。
- 星數／安裝數是近似值，視為方向性參考。
- `fable` 模型別名雖存在，但 Fable 5 / Mythos 5 已暫停存取，**不要把 harness 建立在它可用的假設上**。
- 對不信任的 repo 要小心（sandboxing 有過繞過漏洞史）；建議開 `/sandbox` 但仍保持警覺。

---

*本指示書搭配《Claude Code Harness 進階實戰手冊 v3》使用 —— 手冊講原理，這份講「在本專案怎麼落地」。*
