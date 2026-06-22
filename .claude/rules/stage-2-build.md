# Stage 2 — Build

Load `.claude/skills/web-prototype/SKILL.md` + Cowork `/frontend-design`.

Rules:
- CSS is token-first via `@import` in `css/tokens.css` — never redefine token values.
- Every BEM class must trace to `component-catalog.md`. Unknown class → halt and ask.
- Visual target: production URL screenshots from Stage 0a.

---

## Slice execution model

Work through every slice in `plan.md` in dependency order without stopping between slices unless a slice is explicitly labelled `HITL`.

**AFK slice (default):**
1. Build the slice.
2. Run `.claude/skills/webapp-testing/SKILL.md` — interactive checks (clicks, inputs, scroll) + console read + screenshots at 1440 / 1024 / 768 px.
3. Verify all acceptance criteria for this slice pass.
4. Emit `[Slice N: DONE — <slice name>]` and advance to the next slice immediately.

**HITL slice (explicit pause):**
1. Build the slice.
2. Run webapp-testing as above.
3. Post the live URL: `http://localhost:8000/prototypes/<feature>/<variant>/`
4. Use `AskUserQuestion` — present what was built and the acceptance criteria. Wait for approval before continuing.
5. On approval: emit `[Slice N: DONE]`, advance.
6. On rejection: restore to the last `[Slice N-1: DONE]` git commit, use `AskUserQuestion` to identify what to change, rebuild.

**Slice complete when:** all `plan.md` acceptance criteria pass (interactive, not just rendered HTML).

---

## Optional activations

- **Token efficiency (≥ 5 slices):** load `.claude/skills/caveman/SKILL.md` for the AFK-slice loop and routine messages. Carve-out: every `AskUserQuestion` prompt and user-facing errors always use normal English. Deactivate at Stage 3 entry.
- **JS tests (user opt-in):** load `.claude/skills/tdd/SKILL.md`, confirm before adding a test runner. Tests live in `prototypes/<feature>/<variant>/tests/`. Default: no tests.

---

## Stage 2 complete

Every slice in `plan.md` is marked Done AND every screen in `prd.md` renders AND no acceptance criterion is failing.
Tag: `[Build: COMPLETE — <N> slices]`
