---
name: web-validate
description: "Web prototype validation — runs AFTER build completes. Phase 1: programmatic 20-item checklist (tokens, components, a11y, responsive, assets). Phase 2: mandatory Chrome MCP screenshot comparison at 3 breakpoints. Checks items defined in validation.md Criteria section, records results in Results section."
allowed-tools: Read, Grep, Glob, mcp__Claude_in_Chrome__*
---

# SKILL — Web Prototype Validation

> Runs at Stage 3 — AFTER all frames are built and user-approved.
> Two mandatory phases: Automated Checklist → Chrome Screenshot Comparison.
> Records results in `validation.md` Results section.

---

## TIMING RULE

```
Stage 0 (Spec confirm) → Write validation.md CRITERIA section
Stage 2 (Build)        → Build all frames, get per-frame user approval
Stage 3 (Validate)     → Run this skill, fill validation.md RESULTS section
```

**Never run validation during build.** Per-frame screenshots during Stage 2 are approval gates, not validation. This skill runs once, after all frames are complete, as a final quality gate before delivery.

---

## INPUTS

| Input | Source | Required |
|---|---|---|
| Completed prototype files | `prototypes/<feature-slug>/` | Yes |
| validation.md Criteria section | `Project/<date>-<name>/validation.md` | Yes |
| Chrome MCP connection | `mcp__Claude_in_Chrome__*` tools | Yes |

---

## PHASE 1 — Automated Checklist (Programmatic)

Run these checks by reading the generated files. Log pass/fail per item.

### 1.1 Token Compliance

| # | Check | Method | Pass criteria |
|---|---|---|---|
| 1 | No raw hex/rgb/hsl in `components.css` or `layout.css` | Grep for `#[0-9a-f]`, `rgb(`, `hsl(` outside `tokens.css` | Zero matches |
| 2 | No raw px for spacing/radius in component/layout CSS | Grep for px values not inside `var()` or `tokens.css` | Zero matches (exception: `0px`, `1px` border) |
| 3 | All token variables in `tokens.css` resolve to Skill_Core values | Cross-reference with `Skill_Core.md` §2–§6 | 100% match |
| 4 | Spacing values on 4-based scale only | Parse all spacing vars → check divisible by 4 (exception: 2px) | All pass |

### 1.2 Component Completeness

| # | Check | Method | Pass criteria |
|---|---|---|---|
| 5 | Every required component has HTML structure | Parse HTML for corresponding BEM class per component in requirements.md | All present |
| 6 | Every frame is reachable | Check JS state transitions or separate HTML pages cover all frames in requirements.md | All frames addressable |
| 7 | Empty states present | For every list/grid/table, check for `[data-state="empty"]` or `.--empty` variant | All present |
| 8 | Destructive actions have confirm modals | Grep for delete/remove/destroy actions → confirm modal pattern exists | All guarded |

### 1.3 Accessibility (WCAG AA)

| # | Check | Method | Pass criteria |
|---|---|---|---|
| 9 | Color contrast — body text | Compute contrast ratio: text-strong on bg-base ≥ 4.5:1 | Pass |
| 10 | Color contrast — large text | Text ≥ 24px or ≥ 18.66px bold on any bg ≥ 3.0:1 | Pass |
| 11 | Focus states defined | Every interactive element has `:focus-visible` style | All present |
| 12 | Semantic landmarks | `<main>`, `<nav>`, `<header>` present where appropriate | Present |
| 13 | Alt text on images | All `<img>` tags have non-empty `alt` (or `role="presentation"` for decorative) | All present |
| 14 | Keyboard navigation | Tab order logical; no tabindex > 0 | Pass |

### 1.4 Responsive & Layout

| # | Check | Method | Pass criteria |
|---|---|---|---|
| 15 | Breakpoints defined | `@media` queries at 1440, 1024, 768 in layout.css | Present |
| 16 | No horizontal overflow at 768px | Check for `overflow-x` issues (elements wider than viewport) | None |
| 17 | Gallery law compliance | Image grids use `flex-wrap` with aspect-ratio scaling, not fixed columns | Correct pattern |

### 1.5 Asset Integrity

| # | Check | Method | Pass criteria |
|---|---|---|---|
| 18 | All `<img src>` resolve | Check each referenced path exists in prototype `img/` folder | All resolve |
| 19 | No broken links | Internal hrefs/anchors resolve to valid targets | All resolve |
| 20 | Placeholder badge visible | If any placeholder image used, `.img-placeholder-badge` is present | Badge shown |

### 1.6 Feature-Specific Checks

In addition to the 20 standard items above, check every item listed in the **Criteria → Functional** and **Criteria → Visual** sections of `validation.md`. These are feature-specific and vary per project.

### Checklist Output

```
[Checklist: PASS — 20/20 standard + N/N feature-specific]
```
or
```
[Checklist: FAIL — items 2, 9, 18 + feature: "phone validation"]
  - Item 2: raw `16px` in components.css line 47 → replace with var(--spacing-16)
  - Item 9: contrast 3.8:1 on .card__subtitle → switch to Text/Strong token
  - Item 18: img/hero-banner.webp missing → run Figma export or use placeholder
  - Feature: phone validation rejects 9 digits but spec says accept 9-10
```

**Auto-remediation:** Items 1–4 (token issues) and item 20 (placeholder badge) can be auto-fixed. Fix and re-check. Items 9–10 (contrast) can be auto-fixed by swapping to a stronger token. Report all fixes as `[Checklist: REMEDIATED — <n> items]`.

---

## PHASE 2 — Chrome Screenshot Comparison (Mandatory)

### Prerequisites
- Chrome MCP (`mcp__Claude_in_Chrome__*`) must be connected.
- Prototype must be served over **http** and opened by its http origin. `file://` is REFUSED by the Chrome MCP extension — never use it. Use `http://localhost:<PORT>/...` (Mac-side server) during build, or the deployed Vercel URL for final sign-off. See CLAUDE.md → "MANDATORY — Render Verification".
- Run the server pre-check: navigate to `http://localhost:<PORT>/`; if unreachable, halt and ask the user to start the server (`cd "<workspace>" && python3 -m http.server <PORT>` or `./start-server.sh`). Never `[Validate: PASS]` without a rendered screenshot — emit `[Validate: BLOCKED — <reason>]` instead.
- All Phase 1 issues must be resolved (or explicitly deferred by user).

### Process

1. **Open prototype in Chrome:**
   - Use `tabs_create_mcp` → `navigate` to the prototype's **http origin** (`http://localhost:<PORT>/prototypes/<feature>/<variant>/` or the Vercel URL). Never `file://`.
   - Wait for page load.

2. **Capture screenshots at 3 mandatory breakpoints per frame:**

   For each frame listed in requirements.md:

   | Breakpoint | Width | Represents |
   |---|---|---|
   | Desktop | 1440px | Full desktop experience |
   | Tablet | 1024px | Tablet / narrow desktop |
   | Mobile | 768px | Mobile landscape / small tablet |

   Steps per frame per breakpoint:
   - Set the appropriate JS state / navigate to the correct page.
   - `resize_window` to target width.
   - Take screenshot via `computer` tool (action: `screenshot`).
   - Save screenshot reference for comparison.

3. **Visual verification against spec:**

   Compare each screenshot against the validation.md **Criteria → Visual** section. Check for:

   | Check | What to verify |
   |---|---|
   | Layout fidelity | Spatial arrangement matches spec zones from requirements.md |
   | Typography hierarchy | Headings, body, labels visually distinct and proportional |
   | Color application | Brand colors, backgrounds, text colors appear correct |
   | Component presence | All specified components visible in expected positions |
   | Spacing rhythm | Consistent spacing between sections, no cramped/loose areas |
   | Image rendering | Assets display correctly, proper sizing, no broken images |
   | Responsive behavior | Layout adapts correctly at each breakpoint |

4. **Present to user for approval:**
   - Show screenshot(s) to the user.
   - Ask: *"Validation complete for [Frame Name] at [breakpoint]. Does this match your expectations? Any adjustments needed?"*
   - On approval → mark frame as validated in Results section.
   - On rejection → collect feedback, remediate, re-capture, re-validate.

### Screenshot Output

```
[Screenshot: Frame 1 — CAPTURED at 1440px, 1024px, 768px]
[Visual check: PASS — layout, typography, color, components all match spec]
```
or
```
[Screenshot: Frame 1 — CAPTURED at 1440px]
[Visual check: ISSUES]
  - Sidebar width appears < 240px (spec says 280px) → adjust layout.css
  - Card grid has 4 columns at 1440 (spec says 3) → fix grid template
```

---

## PHASE 3 — Reference Comparison (Production URL / Figma)

### Prerequisites
- Stage 0a must have captured reference screenshots (production URL at 1440/1024/768px).
- If no reference was captured (`[Reference: custom — no baseline]`), skip this phase.

### Process

1. **Retrieve reference screenshots** captured at Stage 0a from the project context.

2. **Side-by-side comparison** for each frame at each breakpoint:
   - Open both the prototype and production URL in Chrome MCP.
   - Screenshot both at the same breakpoint width.
   - Compare for:

   | Check | What to verify |
   |---|---|
   | Layout structure | Major zones (header, sidebar, content, footer) match production layout |
   | Component patterns | Buttons, cards, inputs match production component style (pill vs square, etc.) |
   | Visual hierarchy | Heading/body/caption weight ratios match production |
   | Spacing density | Overall content density comparable to production |
   | Brand consistency | Colors, logo treatment, icon style match production |
   | Navigation pattern | Header nav, side menu, footer links match production structure |

3. **Report drift:**

```
[Reference comparison: PASS — prototype matches production patterns]
```
or
```
[Reference comparison: DRIFT]
  - Header: prototype uses 60px height, production uses 64px
  - Buttons: prototype uses square corners, production uses pill (radius-32)
  - Spacing: prototype sections more dense than production
```

4. **If Figma design system components available:** Additionally verify that the CSS components (BEM classes) map to equivalent Figma components from the design system. Use `search_design_system` to confirm naming alignment.

### Skip condition
If Stage 0a emitted `[Reference: custom — no baseline]`, record `N/A — no reference captured` and skip.

---

## RECORDING RESULTS IN validation.md

After all phases complete, fill the **Results** section of `validation.md`:

```markdown
## Results

> Filled by agent at Stage 3. Do not modify Criteria section above.

### Run metadata
- Date: YYYY-MM-DD
- Prototype path: prototypes/<feature-slug>/
- Chrome MCP: connected

### Standard checklist (20 items)
- Status: PASS | REMEDIATED (n) | FAIL
- Items remediated: [list or "none"]
- Items failed: [list or "none"]

### Feature-specific checks
- Status: PASS | FAIL
- Items failed: [list or "none"]

### Screenshot comparison
| Frame | 1440px | 1024px | 768px | User approved |
|---|---|---|---|---|
| Frame 1 | PASS | PASS | PASS | Yes |
| Frame 2 | PASS | PASS | PASS | Yes |

### Reference comparison (production URL)
- Reference URL: [production URL or "none"]
- Status: PASS | DRIFT | N/A
- Drift items: [list or "none"]

### Final verdict
[Validate: PASS] or [Validate: FAIL — <reason>]
```

---

## COMBINED RESULT

| Scenario | Output | Action |
|---|---|---|
| Both phases pass | `[Validate: PASS]` | Proceed to Stage 4 (Deliver) |
| Checklist remediated + screenshots pass | `[Validate: REMEDIATED — <n>]` | Proceed |
| Checklist fail (non-auto-fixable) | `[Validate: FAIL — checklist items <list>]` | Halt, report, ask user |
| Screenshot issues | `[Validate: FAIL — visual <description>]` | Fix, re-validate |
| Feature-specific check fails | `[Validate: FAIL — feature: <item>]` | Halt, report, ask user |

---

## TOOLS USED

| Tool | Purpose |
|---|---|
| `Read` / `Grep` / `Glob` | Phase 1 — parse files for token violations, component presence |
| `mcp__Claude_in_Chrome__tabs_create_mcp` | Phase 2 — create tab for prototype |
| `mcp__Claude_in_Chrome__navigate` | Phase 2 — open prototype in browser |
| `mcp__Claude_in_Chrome__resize_window` | Phase 2 — test responsive breakpoints |
| `mcp__Claude_in_Chrome__computer` (screenshot) | Phase 2 — capture visual state |
| `AskUserQuestion` | Phase 2 — user approval of screenshots |
