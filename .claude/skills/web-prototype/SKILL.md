---
name: web-prototype
description: "Solution 2: Generate multi-file HTML+CSS+JS prototype from feature spec. Token-first CSS, semantic HTML, BEM naming, frame-by-frame approval gates. Use when brief specifies Output: web-prototype or no Figma B key."
allowed-tools: Read, Write, Edit, Bash, mcp__Claude_in_Chrome__*
---

# SKILL — Web Prototype Build

> **Solution 2:** Feature brief → multi-file web prototype (HTML + CSS + JS).
> Parallel to the Figma pipeline (Solution 1). Same spec input, different output target.

---

## PURPOSE

Generate a **verifiable, interactive web prototype** from a feature brief (`docs/features/<Feature>.md`). The output is a multi-file project using the {{PRODUCT}} token system, deployable as a static preview. The prototype is validated via automated audit + screenshot comparison.

---

## MANDATORY GATE — AskUserQuestion (before ANY file write)

**RULE: You MUST use the `AskUserQuestion` tool before writing any prototype files to disk.** Group questions into a single call covering these 3 areas:

| # | Area | What to confirm |
|---|---|---|
| 1 | **Scope & fidelity** | Which frames from §5 to build? Static mockup or interactive states? Desktop-only or responsive? |
| 2 | **Asset handling** | Use local `img/` library? Need Figma export for missing assets? Placeholder images acceptable? |
| 3 | **Output preferences** | Target folder name? Include dark mode variant? Any framework constraints (vanilla JS only, etc.)? |

Do NOT proceed to Stage 2 (Build) until the user answers. This prevents wasted iterations.

---

## PIPELINE

### Stage 0 — Feature Intake & Spec Gate

Create a project directory under `Project/`:
```
Project/YYYY-MM-DD-feature-name/
├── request.md         # Raw user input / spec — unprocessed original
├── requirements.md    # Agent's interpretation after AskUserQuestion
├── plan.md            # Numbered task groups (build sequence)
└── validation.md      # How to verify the implementation succeeded
```

**Sequence:** Save raw user input to `request.md` first. Then use `AskUserQuestion` to clarify, and populate the remaining files. Gate criteria:
- `request.md`: Raw input captured verbatim (always first).
- `requirements.md`: Surface + sub-type classified, UI zones defined, component list complete, workflow frames listed.
- `plan.md`: At least one numbered task group with clear deliverables.
- `validation.md`: **Criteria section only** — feature-specific functional + visual checks. Use `docs/validation-template.md`. Results filled at Stage 3.

Missing critical input → halt. Use `AskUserQuestion` to fill gaps.

### Stage 0a — AskUserQuestion Gate ★

Call `AskUserQuestion` with the 3 grouped questions above. Wait for answers. Persist choices in build context.

### Stage 1 — Token & Asset Inventory + Design System Discovery

**Single entry point:** load `design-system/SKILL.md` and follow its decision tree to load only the references this build needs. Do NOT load the legacy `skills/Skill_*.md` files — they are superseded.

1. Load `design-system/SKILL.md`. Read the decision tree at §"Decision tree — which reference do I load?".
2. Import the canonical token set: in the prototype's `css/tokens.css`, the first line is `@import url('../../../design-system/tokens/tokens.css');`. Never redefine tokens locally. Feature-specific accent tokens (rare) are added AFTER the import with a `--<feature>-` prefix.
3. Classify the surface via `design-system/references/surfaces.md` (Stage 0a output feeds this).
4. Read `design-system/references/layout-and-responsive.md` for header / sidebar / inspector / canvas constants. Apply unconditionally — never invent.
5. Build the component list. For each component, look up its row in `design-system/references/component-catalog.md` §2 (quick index) and load the matching `design-system/examples/<component>.html` snippet as the structural anchor.
6. **Design system discovery (mandatory only for gaps):** if the build needs a component the catalog flags as missing (or a variant not yet captured), use Figma MCP `search_design_system` to fill the gap. Document the gap in the prototype's `README.md`. Do not use MCP to look up components the catalog already covers — trust the catalog.
7. Scan `img/` folder per `skills/web-asset-library/SKILL.md`. Figma export fallback only if missing.
8. Load Cowork `/frontend-design` skill for production-grade output quality.

**Token naming rules:** use the production naming in `design-system/tokens/tokens.css`. Authoritative map (old → new): see `design-system/references/tokens-reference.md §3`. Examples:
```
--text-strong         (not --color-text-strong)
--background-base     (not --color-bg-base)
--fill-brand-strong   (not --color-fill-brand)
--spacing-8           (rem, not px)
--corner-radius-8     (not --radius-8)
--font-size-small     (unchanged)
```

Output: `[Inventory: PASS — <n> tokens imported, <n> components catalogued, <n> gaps]` or `[Inventory: FAIL — <reason>]`

### Stage 2 — Build (Multi-File Output)

Generate the following file structure:

```
prototypes/<feature-slug>/
├── index.html          # Main entry, semantic HTML5
├── css/
│   ├── tokens.css      # All {{PRODUCT}} design tokens as CSS custom properties
│   ├── components.css  # Component-level styles (BEM naming)
│   └── layout.css      # Grid, flexbox, responsive breakpoints
├── js/
│   ├── main.js         # Entry point, state management
│   └── components/     # Per-component interaction logic
│       └── <name>.js
├── img/                # Copied/exported assets for this prototype
│   └── (linked from project img/ or exported from Figma)
└── README.md           # Build notes, token mapping, known gaps
```

**Build rules:**

1. **Token-first CSS.** Every color, spacing, radius, typography, shadow MUST reference a `var(--token-name)`. No raw hex/px values except in `tokens.css` definitions.
2. **Semantic HTML.** Use `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`. No div soup.
3. **BEM class naming.** `.component__element--modifier` pattern. Map to {{PRODUCT}} component names.
4. **Component parity.** Every required component must have a corresponding HTML structure + CSS class.
5. **State coverage.** Build all states listed in Workflow Frames. Use JS to toggle `data-state` attributes or CSS classes.
6. **Responsive.** Desktop-first, with breakpoints at 1440px, 1024px, 768px (unless user specified otherwise).
7. **Image handling.** Reference assets via relative `img/` path. See `skills/web-asset-library/SKILL.md` for resolution rules.
8. **Empty states mandatory** for every list, grid, table, gallery, search result.
9. **Destructive actions → confirm** via modal pattern.
10. **WCAG AA.** Body text ≥ 4.5 contrast; large text ≥ 3.0. Keyboard-navigable focus states.
11. **No external dependencies** except Google Fonts (Roboto). Vanilla JS only unless user approved a framework.
12. **Design system fidelity (mandatory).** Components MUST match the {{PRODUCT}} production look discovered at Stage 1:
    - Use the **production token naming** in `design-system/tokens/tokens.css` (e.g. `--text-strong`, `--fill-brand-strong`, `--background-base`). **Do not use the legacy `--color-*` prefix.** Authoritative map: `design-system/references/tokens-reference.md §3`.
    - Every BEM class in the build MUST appear in `design-system/references/component-catalog.md` §2 quick index. **No invented classes.** If a needed pattern is missing from the catalog, halt and use `AskUserQuestion` (see Rule 9 below).
    - Match production component patterns (corner radius, padding, height) by binding to the tokens the catalog row lists.
    - Match production header height, nav structure, footer layout from `layout-and-responsive.md` and Stage 0a reference screenshots.
    - No inline `style=""` attributes in HTML except for dynamically computed values (e.g., JS-controlled width). All styling in CSS files.
    - No inventing component styles — every component must trace back to a row in `component-catalog.md`.
13. **Production URL as visual target.** When building, regularly compare against the Stage 0a reference screenshots. The prototype should be visually recognizable as a {{PRODUCT}} product page, not a generic web page.

**Build sequence:**

- Frame 1 → build → screenshot → halt → ask *"Does this initial frame match the spec? Confirm before I proceed."*
- Subsequent frames: build → screenshot → approval → next.

**Note:** Per-frame screenshots during build are APPROVAL GATES, not validation. Validation runs separately at Stage 3.

### Stage 3 — Validate (AFTER all frames built + approved)

Load `skills/web-validate/SKILL.md`. Run the full validation process against `validation.md` Criteria:

1. **Automated checklist** — 20 standard items + feature-specific items from Criteria section
2. **Chrome MCP screenshots** — mandatory at 1440px, 1024px, 768px for every frame
3. **Record results** — fill validation.md Results section with evidence

Output: `[Validate: PASS]`, `[Validate: REMEDIATED — <n>]`, or `[Validate: FAIL — <issues>]`

### Stage 4 — Deliver

- Copy final prototype to workspace folder.
- Provide `computer://` link to `index.html`.
- Log completion in brief §8.

---

## RULES (violation = rejected output)

1. **AskUserQuestion before disk writes.** No prototype files are created before user answers the 3-area gate.
2. **Token-only styling.** No raw color/spacing/radius/typography values in component or layout CSS. Only `tokens.css` contains raw values.
3. **Component completeness.** Every §6 component must appear in the prototype with all specified variants/states.
4. **Frame completeness.** Every §5 workflow frame must be reachable (via JS state toggle, navigation, or separate page).
5. **Validation mandatory.** No delivery without passing Stage 3.
6. **Image sourcing rules.** Follow `web-asset-library/SKILL.md` — local first, Figma export fallback, placeholder last resort with visible badge.
7. **Gallery law.** Image grids use justified layout (row-based, aspect-ratio-scaled). Masonry and fixed N-column forbidden for image-dominant content.
8. **No framework without approval.** Vanilla HTML/CSS/JS unless user explicitly approved React, Vue, etc.
9. **Catalog guard (no invented classes).** Every BEM class in HTML and component CSS MUST trace back to a row in `design-system/references/component-catalog.md` §2 (quick index). If the build needs a pattern the catalog does not cover:
    - Halt before writing the unknown class.
    - Use `AskUserQuestion` with: (a) what pattern is needed, (b) closest catalog candidate, (c) recommendation (use closest, or add new component).
    - If user authorises a new component → log it under `## Catalog gaps` in the prototype's `README.md` and proceed with a placeholder class prefixed `.x-` (eg. `.x-suggestion-chip`) so it shows up at audit. **Never silently invent a `.foo` class.**
10. **Production token names only.** Use `--text-strong`, `--fill-brand-strong`, `--background-base`, etc. — the naming in `design-system/tokens/tokens.css`. The legacy `--color-*` prefix is forbidden in new builds. Map: `design-system/references/tokens-reference.md §3`.

---

## TOKEN MAPPING (CSS Custom Properties)

**Canonical source:** `design-system/tokens/tokens.css`. Import this file at the top of every prototype's `css/tokens.css` — never redefine token values locally.

```css
/* css/tokens.css — first line in every prototype */
@import url('../../../design-system/tokens/tokens.css');

/* Feature-specific accents only after the import.
   Prefix with --<feature>- so they are easy to audit out later. */
:root {
  --ai-mv-accent: var(--fill-brand-strong);
}
```

**Naming convention:** see `design-system/references/tokens-reference.md §1` for the namespace+role+emphasis pattern. **Old→new map:** `tokens-reference.md §3`. Production naming examples: `--text-strong`, `--background-base`, `--fill-brand-strong`, `--spacing-8` (rem), `--corner-radius-8` (rem), `--font-size-small`. The legacy `--color-*` prefix is forbidden in new builds.

---

## SKILL ROUTING — Solution 2 (web)

Single entry: **`design-system/SKILL.md`**. Its decision tree (§"Decision tree — which reference do I load?") points to the specific reference file needed. Legacy `Skill_*.md` files are superseded and should not be loaded for web builds.

| Phase / Topic | Load |
|---|---|
| Stage 1 (Inventory) — every build | `design-system/SKILL.md` (entry) |
| Tokens & token names | `design-system/tokens/tokens.css` + `design-system/references/tokens-reference.md` |
| Brand color, banned hexes, inverse | `design-system/references/brand-rules.md` |
| Surface classification (Stage 0a) | `design-system/references/surfaces.md` |
| Layout, breakpoints, header, sidebar, canvas | `design-system/references/layout-and-responsive.md` |
| Any component (Forms / Nav / Data / Feedback / Gallery) | `design-system/references/component-catalog.md` § for that category |
| Per-component copy-paste anchor | `design-system/examples/<component>.html` |
| Image grid / thumbnail / asset picker patterns | `design-system/references/gallery-and-grids.md` |
| Alert, modal, loading, tooltip, empty state | `design-system/references/feedback-and-states.md` |
| Image assets | `skills/web-asset-library/SKILL.md` |
| Visual hierarchy, density, affordance | `skills/Skill_Principles.md` *(still loaded — will fold into web-design-system later)* |
| Validation (Stage 3) | `skills/web-validate/SKILL.md` + `design-system/references/compliance-audit.md` |
