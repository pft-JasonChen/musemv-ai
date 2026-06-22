# Stage 0 — Feature Intake & Spec Gate

Create this folder structure before writing any prototype files:

```
Project/YYYY-MM-DD-feature-name/
├── prd.md
├── plan.md
├── validation.md
├── user-flowchart.svg   ← required before Stage 0 exits
├── handoffs/
└── specs/               ← multi-variant only
```

**Multi-variant rule:** use only when the user explicitly requests multiple UI variants. Shared docs stay functional-only; per-variant UI details go in `specs/<variant>.md`.

---

## Intake sequence (run in order)

**Step 1 — Clarify (conditional).**
Ambiguous brief, new surface sub-type, or conflicting past decisions → load `.claude/skills/grill-me/SKILL.md`.
Past terminology or rule questions → also load `.claude/skills/grill-with-docs/SKILL.md` with `docs/BUILD_RULES.md` as its context doc.

**Step 2 — Gate.**
Use `AskUserQuestion` to confirm before writing any file:

| # | Area | Confirm |
|---|---|---|
| 1 | Scope & fidelity | Which screens? Static or interactive? Desktop-only or responsive? |
| 2 | Asset handling | Local `img/`? Figma export for gaps? Placeholders OK? |
| 3 | Output preferences | Target location/name? Dark mode? Framework constraints? |

**Step 3 — PRD.**
Load `.claude/skills/to-prd/SKILL.md` for the template. Write `prd.md` locally: problem statement, user stories, implementation decisions, testing decisions, out-of-scope. Never publish to an issue tracker.

**Step 4 — Plan.**
Load `.claude/skills/to-issues/SKILL.md` for the slice template. Write `plan.md`: vertical slices labelled `HITL` or `AFK`, dependency order, and acceptance criteria per slice. Slice criteria live here only — do not copy them to `validation.md`.

- **AFK** = agent builds autonomously, runs webapp-testing, marks Done, advances.
- **HITL** = agent halts after building and uses `AskUserQuestion` before advancing. Reserve for slices requiring an explicit user decision (e.g. layout direction, content approval).

**Step 5 — Validation doc.**
Write `validation.md` Criteria section: feature-level functional checks only (happy path, error reachable, exit returns to entry). Use `docs/validation-template.md`. Results section filled at Stage 3.

**Step 6 — Specs (multi-variant only).**
One `specs/<variant>.md` per variant: layout pattern, per-screen UI, responsive behaviour, UI validation criteria. References `prd.md`; never duplicates it.

**Step 7 — Flowchart (always last, required).**
Generate the user flowchart as SVG using the built-in diagram tool — no external skill needed.
Cover: entry point, every screen in `prd.md`, decision branches, outcomes, exits.
Output → `Project/<feature>/user-flowchart.svg`.
Tag: `[Flowchart: DONE]` — Stage 0 does not pass without this file.

---

## Stage 0a — Reference selection & baseline capture

Ask which surface sub-type to use as reference (see `agent.config.json → surfaces`).
Screenshot the production URL via Chrome MCP at 1440 / 1024 / 768 px.
Optionally capture the Figma reference node via `get_screenshot` (file ID in `agent.config.json`).
Tag: `[Reference: <sub-type> — screenshots captured]`

## Stage 0b — Architecture health check (conditional)

Trigger when `prototypes/<feature>/` already has ≥ 2 variants or any `v2/` subfolder.
Load `.claude/skills/improve-codebase-architecture/SKILL.md`. It scans existing variants and writes an HTML report.

Decision (via `AskUserQuestion`):
- No consolidation needed → `[Health: PASS]`, continue.
- Consolidate first → prepend tasks to `plan.md`, block Stage 2 → `[Health: CONSOLIDATE — <n>]`.
- Defer → log to `Project/<feature>/handoffs/` → `[Health: DEFERRED]`.
