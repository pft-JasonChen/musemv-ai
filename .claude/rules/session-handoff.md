# Session-End Handoff

## When to trigger

Trigger when Stage 4 is not yet reached AND any of:
1. User invokes `/handoff`, says "save progress", "end session", or "wrap up".
2. A stage boundary was just completed and remaining context is insufficient for the next stage.
3. User signals they are stepping away.

## How to run

Load `.claude/skills/handoff/SKILL.md`.
Override its default output path — write to `Project/<feature>/handoffs/YYYY-MM-DD-handoff.md` (create the directory if absent).

Capture: current stage, decisions made, open questions, next steps, skills to load next session.
Tag: `[Handoff: SAVED — <path>]`

## Session start

If `handoffs/` contains a doc dated after the most recent `plan.md` change, read it before loading any other skill.
