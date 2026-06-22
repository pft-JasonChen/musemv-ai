---
name: figma-audit
description: "Stage 3 Figma validation — runs AFTER all frames built and user-approved. 14-point silent scan citing node IDs. Auto-remediates unbound tokens, raw hex, off-scale spacing. Checks feature-specific criteria from validation.md, records results in Results section. Halts on unresolvable failures."
allowed-tools: mcp__cf475d39*
---

# figma-audit — Stage 3 Evidence-Based Audit

> Runs at Stage 3 — AFTER all frames are built and user-approved.
> 14-point silent scan + feature-specific checks from validation.md.
> Records results in `validation.md` Results section.

---

## TIMING RULE

```
Stage 0 (Spec confirm) → Write validation.md CRITERIA section
Stage 2 (Build)        → Build all frames, get per-frame user approval
Stage 3 (Audit)        → Run this skill, fill validation.md RESULTS section
```

**Never run audit during build.** Per-frame screenshots during Stage 2 are approval gates, not validation. This skill runs once, after all frames are complete, as a final quality gate before delivery.

---

## INPUTS

| Input | Source | Required |
|---|---|---|
| Build log (node IDs) | `Project/<date>-<name>/plan.md` §8 | Yes |
| Target file key | Figma B from Stage −1 | Yes |
| Token map | Variables enumerated in Stage −1 | Yes |
| validation.md Criteria | `Project/<date>-<name>/validation.md` | Yes |

---

## Scan scope rules (read before writing any audit script)

**Only traverse nodes created or modified this session.** Node IDs are listed in the build log (plan.md). Do not call `frame.findAll()` on entire top-level frames — the library-linked component trees are very deep and cause timeouts. Instead:

1. Walk `frame.children` one level to find session-created containers.
2. For each container whose ID appears in the build log, check its direct properties.
3. For `type === 'INSTANCE'` nodes: **skip all padding, itemSpacing, and cornerRadius unbound checks.** Instance spacing/radius is owned by the component definition in the library — zero-value overrides on instances are inherited, not raw literals, and must not be flagged as violations. Only check `fills` and `strokes` on instances (these can be locally overridden).
4. Never call `.findAll()` into an instance subtree for spacing/padding checks.

---

## Procedure — 14-Point Scan

Run every check. Do not skip. Audit is not optional.

### 1. Capture scope
- Pull the list of node IDs built this session from plan.md.
- Record the first and last ID and total count.
- These IDs define the scan boundary for all subsequent checks.

### 2. Unbound bindable property scan
- For every **FRAME or GROUP node** in the build-log ID list, read `node.boundVariables`.
- For each property in the Property-Binding Checklist (see `docs/RULES.md`) that exists on the node but has no bound variable → record as unbound.
- **Skip `type === 'INSTANCE'` nodes for padding/spacing/radius checks.**
- Count must be **0**.

### 3. Raw color literal scan
- Scan `fills`, `strokes`, and `effects` on every node in scope for literal `r/g/b/a` objects without a `boundVariables` alias.
- Include INSTANCE nodes for fill/stroke checks (local fill overrides are legitimate audit targets).
- Count must be **0**.

### 4. Spacing scale scan
- Scan `paddingLeft/Right/Top/Bottom` and `itemSpacing` on **FRAME/GROUP nodes only** (not instances).
- Any value not divisible by 4 **and** not bound to a `spacing/*` variable → record as violation.
- Count must be **0**.

### 5. State coverage
- For every interactive component (button, input, toggle, tab, etc.), confirm `State=Default` is explicitly set.
- Record node IDs missing Default state.

### 6. Form validity coverage
- For every `text-input`, `combobox`, `select`, `date-picker`, `text-area`: confirm the component set exposes `Valid=False`.
- Record missing IDs. N/A if no form surface.

### 7. Modal affordance
- For every modal/dialog: confirm a visible close control and a focus-trap note in the overrides.
- Record missing IDs. N/A if no modal.

### 8. Canvas width ratio
- Only for editor surface. Compute `canvas.width / shell.width`. Must be ≥ 0.60.
- Record the ratio.

### 9. WCAG AA contrast
- For every text node, resolve its bound text color + nearest bound background color.
- Compute luminance ratio per WCAG 2.1.
- Record every node where ratio < **4.5** for body text or < **3.0** for large text (≥ 24px, or ≥ 18.66px bold).
- Count must be **0**.

### 10. Empty-state presence
- For every list, grid, table, gallery, search-result surface: confirm an `EmptyState` instance exists (may be hidden behind a variant).
- Record missing IDs. N/A if no such surface.

### 11. Orphaned imports
- Diff components imported this session against components placed on the canvas. Record names that were imported but never used.

### 12. Gallery layout
- If any image-dominant grid was built, confirm it uses the justified algorithm from `Skill_Gallery.md` (row-based, target row height ±15%).
- Record the target row-height value used. N/A if no gallery.

### 13. Feature-specific checks
- Read validation.md **Criteria → Functional** and **Criteria → Visual** sections.
- Verify each feature-specific item against the built frames.
- Record pass/fail per item with node IDs as evidence.

### 14. Exemplar perceptual diff *(skipped if no exemplar pinned)*

If Stage 0a pinned an exemplar (`[Exemplar: <id>]`), compare the built frame against the reference screenshot:

1. Take fresh screenshot of built frame via `get_screenshot`.
2. Re-fetch exemplar screenshot via `get_screenshot` against the exemplar node ID.
3. Compare for: spacing-rhythm drift, hierarchy inversion, density mismatch (>25%), region-order changes, missing affordances.
4. Parse: `OK` → pass. `high` severity → FAIL. `med` → soft warning. `low` → log only.

**Skip condition:** If Stage 0a emitted `[Exemplar: none]`, record `N/A — no exemplar pinned`.

### 15. Production URL comparison *(if reference URL captured at Stage 0a)*

If Stage 0a captured a production URL screenshot:

1. Screenshot built frame via `get_screenshot`.
2. Screenshot production URL via Chrome MCP at same viewport width.
3. Compare layout structure, component patterns, visual hierarchy, spacing density, brand consistency.
4. Report drift items. `high` severity → FAIL. `med` → warning. `low` → log only.

**Skip condition:** If no production URL was captured at Stage 0a, record `N/A — no production reference`.

### 16. Design system pre-scan *(via Cowork built-in)*

Run Cowork `/audit-design-system` on built frames for generic drift detection (detached instances, unbound tokens, local overrides). Use findings to inform rows 2–4. If remediation needed, delegate to Cowork `/apply-design-system`.

This is a supplementary check — it catches drift that the {{PRODUCT}}-specific rows might miss (e.g., a component was detached from the library after placement).

---

## Output contract (silent by default)

The scan is an **internal scratchpad**, not user-facing output. Run it, then emit only the stage tag:

- Clean → `[Audit: PASS]`
- Remediated → `[Audit: REMEDIATED — <n>]`
- Unresolvable → `[Audit: FAIL]` followed by only the offending rows

Never emit the full 14-row block on PASS or REMEDIATED. Format for FAIL rows:

```
[Audit: FAIL]
77:4611 · rule 3 (unbound fill) · provide color/text/primary variable
77:4638 · rule 9 (WCAG AA)   · body text ratio 3.9; need ≥ 4.5 — confirm token swap
```

---

## RECORDING RESULTS IN validation.md

After scan completes, fill the **Results** section of `validation.md`:

```markdown
## Results

> Filled by agent at Stage 3. Do not modify Criteria section above.

### Run metadata
- Date: YYYY-MM-DD
- Figma B file key: <key>
- Nodes scanned: <count> (IDs: first..last)

### 14-point audit
- Status: PASS | REMEDIATED (n) | FAIL
- Items remediated: [list with node IDs or "none"]
- Items failed: [list with node IDs or "none"]

### Feature-specific checks
- Status: PASS | FAIL
- Items failed: [list or "none"]

### Final verdict
[Audit: PASS] or [Audit: FAIL — <reason>]
```

---

## Auto-remediation policy

Only rows 2, 3, 4, 9 are auto-remediable, and only when a clean token swap exists:

| Row | Allowed remediation |
|---|---|
| 2 — Unbound properties | Bind to the matching variable from the enumerated token map. |
| 3 — Raw color | Swap to the nearest `color/*` variable whose resolved RGB matches the literal to ≤ 0.5% delta. |
| 4 — Off-scale spacing | Snap to the nearest `spacing/*` variable. Never round silently when delta > 4px. |
| 9 — Contrast failure | Swap text token to nearest higher-contrast on-surface variant. Never swap background. |

If remediation is impossible, emit `[Audit: FAIL]` with offending rows. Never ship a silent fix.

---

## Refusal triggers

Stop the audit and raise to user if:
- Build log is empty or unreadable.
- Token map from Stage −1 is not in context (re-run Stage −1).
- Any row produces an error that prevents evaluation (e.g. `boundVariables` unreadable on > 10% of nodes).
- validation.md has no Criteria section (re-run Stage 0).

---

## Self-check before exit

- [ ] All 14 rows evaluated.
- [ ] Every row cites a node ID range, a numeric count, or explicit N/A with reason.
- [ ] No yes/no answers anywhere in the block.
- [ ] validation.md Results section filled.
- [ ] Final stage tag emitted.
