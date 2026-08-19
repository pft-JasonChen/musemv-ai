@web-app/AGENTS.md

<!-- Router, not a shim. This repo holds TWO sub-projects and sessions almost always
     start here at the root, one level above web-app/. Without this @-import, web-app's
     contract (and its CLAUDE.md error log) never loads, and its hooks never fire —
     see .claude/scripts/hook-dispatch.sh. -->

## Start web-app code work FROM web-app/

If the task is web-app code, the session should start in `web-app/`, not here. Only there do
you get its four subagents (`a11y-checker`, `design-reviewer`, `code-reviewer`,
`component-architect`) and `/design-review` — subagents and slash commands are discovered from
the session's own project root and CANNOT be forwarded the way hooks can. The migration plan's
G3-c / G5-e / G7 all depend on those agents, so a root session cannot satisfy those gates.

Staying here is fine for docs, specs, credit tables, and cross-folder work. The hook dispatcher
(`.claude/scripts/hook-dispatch.sh`) exists so that an *incidental* web-app edit from a root
session still hits web-app's tsc / greps / Stop gates — it is a safety net, not the intended lane.

## Where you are

- `web-app/` — the only code in this repo. Next.js 16.2 / React 19 / TS strict.
  The @-imported `web-app/AGENTS.md` above is the contract for everything under it.
  Run npm commands from `web-app/`, never from this root.
  In flight: `web-app/docs/archive/redesign-migration-plan-2026-08-01.md` — the designer-UI migration.
  Its §9 (RD contract surface C1–C8) and §10 (gates G1–G7) bind any change under `web-app/`.
- `ycmuse-app-prototype/` — the mobile app prototype. READ-ONLY reference: it is the
  source of truth for user flow and UI, never a place to edit. Never reference it from
  web-app code or config.
- `ycmuse-app-skill/`, `web-spec-skill-reference/` — READ-ONLY design/spec references.
- `*.pdf`, `*.md`, `[YCM] Credit Consume Cloud Config .json` at this root — input
  documents from RD/BD. Read them; don't restructure them.

## Root-level rules

- `.claude/rules/stage-*.md` describe the port-8000 / BEM / `prototypes/` pipeline from
  the Prototype Automation repo. **This repo has no `prototypes/` folder — those rules
  apply to nothing here.** Do not follow them; do not cite them.
- Git root is this folder. Commit with explicit `git add <paths>`, never `git add -A`.
  Ask before commit/push.
- When a requirement is ambiguous or two sources disagree, ask — a question is cheap.
