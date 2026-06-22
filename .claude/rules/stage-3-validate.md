# Stage 3 — Validate

Run only after `[Build: COMPLETE]`. Load `.claude/skills/web-validate/SKILL.md`.

Use `.claude/skills/webapp-testing/SKILL.md` for all rendered checks — it manages the local server automatically via `scripts/with_server.py`.

**Rendering constraints (do not work around these):**
- Never use `file://` — the browser extension refuses it.
- Never screenshot from the Linux sandbox — it has no browser and no route to the Mac.
- All screenshots must come from an http origin the Mac browser can reach.

**Access ladder (stop at first success):**
1. `http://localhost:8000/prototypes/<feature>/<variant>/` — default during build. The server is expected to be always-on via the `com.product.prototype-server` LaunchAgent (port 8000, serving project root). If unreachable, halt and give the user the exact command (`./start-server.sh` or install per `tools/README.md`).
2. Deployed Vercel URL (from `agent.config.json → urls.vercel`) — Stage 3 final / Stage 4.
3. Neither reachable → `[Validate: BLOCKED — <reason>]`, halt.

---

## Per-variant checklist

1. Verify the server is reachable (webapp-testing handles startup, but confirm the URL responds before proceeding).
2. Use webapp-testing to: navigate every screen in `prd.md`, interact with key controls (clicks, inputs, scroll), capture screenshots at 1440 / 1024 / 768 px, and read the browser console.
3. Any JS error → record under Results and block PASS.
4. Run the 20+6 item compliance checklist from `.claude/skills/web-validate/SKILL.md` (`compliance-audit.md`).
5. Map every criterion in `validation.md`, `plan.md` slices, and `specs/*.md` (multi-variant) to a named screenshot → pass / fail. A criterion with no screenshot is `BLOCKED`.
6. Compare against Stage 0a reference captures — report layout, hierarchy, density, and brand-colour drift.
7. **Fresh-context verification (required for sign-off).** Spawn a Task subagent that re-opens the saved screenshots and re-checks them against `prd.md` independently. The build session may not self-certify PASS.
8. Optionally run Cowork `/audit-design-system` + `/apply-design-system` for design-system drift.

Fill `validation.md` Results with screenshot paths, criterion → pass/fail, and console excerpts.

**Outcomes:**
- Clean → `[Validate: PASS]` (cite screenshot paths)
- Fixed → `[Validate: REMEDIATED — <n>]`
- Unresolvable → `[Validate: FAIL — <reason>]`, halt
- Render unavailable → `[Validate: BLOCKED — <reason>]`, halt

---

## Validation rules (Tier A + Tier B)

**Tier A — Static (after every HTML/CSS/JS edit):**
- Grep: key elements present, no raw hex, no broken function refs, no undefined IDs.
- Cross-variant: confirm both variants updated when a shared component changes.
- Emit `[STATIC: OK]` or `[STATIC: FAIL — <reason>]`. Tier A alone never emits PASS.

**Tier B — Rendered (required before any PASS):**
- Run via webapp-testing: interactive checks (click, type, scroll) + console read + screenshot at all three viewports.
- Confirm the changed element is visually correct in the screenshot.
- Emit `[VALIDATE: PASS]` only when citing the screenshot path.

**Cadence:** Tier A after every edit. Tier B at each HITL slice gate and Stage 3. Non-visual edits (copy, JS logic) may defer Tier B to the next checkpoint. Layout / positioning / overflow edits always require Tier B before closing.
