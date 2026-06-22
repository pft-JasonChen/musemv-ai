# Stage 1 — Inventory (silent)

Load `design-system/SKILL.md` (single entry point — routes to all sub-references).

**Token setup:** create `css/tokens.css` in the prototype with `@import` as the first line:
```css
/* css/tokens.css — import only, never redefine */
@import url('../../../design-system/tokens/tokens.css');

/* Feature-specific accents only — use --<feature>- prefix */
```
Never copy token values inline. The source file is the single source of truth.

For each slice in `plan.md`:
1. List every component the slice requires.
2. Confirm each exists in `component-catalog.md`. Pull the relevant row and `examples/<component>.html` anchor.
3. Use Figma MCP `search_design_system` only for catalog gaps.

Scan `img/` per `.claude/skills/web-asset-library/SKILL.md`. Confirm asset coverage for every screen in `prd.md`.

Halt conditions:
- Missing critical token → halt, report the gap.
- Missing component → document the gap, halt for user confirmation. Never invent a BEM class.

Pass condition: all components and assets accounted for.
Tag: `[Inventory: PASS — <N> components, <M> assets]`
