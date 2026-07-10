# Letter to the next session (bootstrap, 2026-07-05)

**What this session did:** rewrote `AGENTS.md` (source of truth), reduced `CLAUDE.md` to a shim +
error log, added `EVAL.md` (static gates + an A/B harness to test whether AGENTS.md earns its
cost). Originals are in `.backups/`. All four Definition-of-done commands were verified exit 0.

## The things nobody will tell you

1. **The old docs described a codebase that doesn't exist.** The previous AGENTS.md rules — "no
   raw hex/px", "tokens via @theme utilities", "768px breakpoint", "async mocked via MvApi" — are
   contradicted hundreds of times by the code. The rewrite documents the _actual_ conventions
   (inline `var(--token)` colors, arbitrary-px sizes, `sm:`/`lg:` only, `MvFlowProvider` as the
   engine, `MvApi` a dead stub). If you "fix" the code to match old docs you will mass-refactor a
   working demo; if you trust `globals.css`'s @theme color block you will write utilities nobody
   else uses. Trust AGENTS.md's Styling section; it was verified by grep on 2026-07-05.
2. **You are inside a bigger repo with a rival rule set.** `ycmuse-web/.claude/rules/stage-*.md`
   (BEM, `prototypes/`, port 8000) is a _different_ sub-project's pipeline and it gets injected
   into your context anyway. Ignore it inside `web-app/`. Git lives at the parent, not here.

## How this setup goes stale, and the fix

Most likely drift: a convention changes in code (e.g. someone finally adopts the `@theme` color
utilities, or wires real breakpoints) and AGENTS.md keeps asserting the old world — which is
exactly the failure that made the previous file harmful. The flywheel: **every time the user
corrects you, or a documented rule turns out wrong, edit the specific AGENTS.md line in the same
turn** and add one line to CLAUDE.md's error log. `EVAL.md` §1 gates keep the file honest about
commands and length; §2 is the A/B to run if you suspect the file has stopped paying rent.

## Rapid diagnosis (what was actually missing/wrong, 3 items)

1. Docs contradicted code (styling rules, MvApi, breakpoints) → fixed by rewrite; do not revert.
2. The real done-bar (hooks force tsc+vitest; e2e serves a stale production build unless you
   rebuild) was undocumented → now in AGENTS.md Commands.
3. No eval existed, so doc quality was unfalsifiable → `EVAL.md` added; A/B **not yet run** (only
   static gates were run this session — an honest gap, not an oversight).

## Cleanup backlog (safe, unglamorous, ask user before doing)

Delete the 8 tracked `.fuse_hidden*` junk files under `src/components/`; `git rm --cached
tsconfig.tsbuildinfo` + gitignore it; refresh README's stale "Implemented/Verified" claims
(9→20 routes, song flow shipped, `specs/mv-creation-flow.spec.md` exists).

## Resume note (2026-07-10)

Bootstrap is **complete and verified**; nothing on disk changed since 2026-07-05. On resume this
session re-ran EVAL §1: length (AGENTS 93≤150), shim (CLAUDE 5 lines, `@AGENTS.md`, no duplicated
sections), script-honesty (all 8 `npm run …` names in AGENTS.md exist in package.json), backups,
and the four DoD commands — **all green**. Recon that grounds the rewrite is cached at
`workflows/.../wf_a271ccf3-31b/journal.jsonl` if you need the file:line evidence again.

Two open items, both intentional, not oversights:

1. **EVAL §2 A/B never run** — needs the `claude` CLI at Sonnet-tier + worktrees (see `EVAL.md`).
   Nothing here validates it; run it before trusting the file pays its ~20% inference tax.
2. **Cleanup backlog** above is being handled in a **separate background session the user
   spawned** ("Clean tracked junk and stale README claims"). Don't also do it here — you'd
   conflict. Check whether that session landed before touching `.fuse_hidden*`/README.
