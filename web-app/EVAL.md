# EVAL.md — does AGENTS.md actually help?

Two layers: deterministic static gates (run any time, seconds), and a downstream A/B
(run when you suspect the file is stale or bloated — it is the only real test).
Rule of thumb from the 2026 context-file research: if the A/B shows no win, **cut lines, don't add**.

## 1. Static gates (all must pass)

Run from `web-app/`:

```bash
[ "$(wc -l < AGENTS.md)" -le 150 ] && echo "GATE length: OK" || echo "GATE length: FAIL"
[ "$(wc -l < CLAUDE.md)" -le 8 ] && head -1 CLAUDE.md | grep -q '@AGENTS.md' \
  && echo "GATE shim: OK" || echo "GATE shim: FAIL"
# Honesty: every npm script named in AGENTS.md must exist in package.json
for s in $(grep -oE 'npm run [a-z0-9:-]+' AGENTS.md | awk '{print $3}' | sort -u); do
  node -e "const p=require('./package.json'); process.exit(p.scripts['$s']?0:1)" \
    && echo "GATE script $s: OK" || echo "GATE script $s: FAIL"
done
# Definition-of-done commands actually pass
for c in typecheck lint test:run build; do
  npm run "$c" >/dev/null 2>&1 && echo "GATE $c: OK" || echo "GATE $c: FAIL"
done
[ -e .backups/2026-07-05-AGENTS.md ] && echo "GATE backups: OK" || echo "GATE backups: FAIL"
```

Status 2026-07-05 (bootstrap session): all gates green (typecheck/lint/test:run/build exit 0 verified).

## 2. Downstream A/B (the real test)

**Protocol.** For each task below, run a fresh headless Sonnet session in two conditions —
A: `AGENTS.md` + `CLAUDE.md` deleted; B: current files — 3 trials each (the CLI does not expose
temperature 0, so average over trials). A trial _passes_ iff every check for its task exits 0.
The file earns its keep iff B ≥ A on passes **without** >25% higher token cost.
**Not run in the bootstrap session** — static gates only; this harness is ready to run.

```bash
# From the repo root (ycmuse-web/). Requires: claude CLI, jq. ~10-20 min per trial.
TASK_PROMPT="$1"; COND="$2"   # COND: A (no file) or B (with file)
WT=$(mktemp -d)/wt && git worktree add "$WT" main && cd "$WT/web-app" && npm install --silent
[ "$COND" = A ] && rm -f AGENTS.md CLAUDE.md
claude -p "$TASK_PROMPT" --model claude-sonnet-5 --permission-mode acceptEdits \
  --output-format json > /tmp/trial.json
jq '.usage' /tmp/trial.json          # record cost
# ...then run the task's checks below; record pass/fail; git worktree remove --force "$WT"
```

**Held-out tasks + deterministic checks** (all checks run in the trial worktree's `web-app/`;
"DoD" = `npm run typecheck && npm run lint && npm run test:run && npm run build` exits 0):

1. **Route.** "Add a `/settings` route showing a placeholder Settings screen inside the app shell."
   - `test -f src/app/settings/page.tsx`
   - `! grep -q 'use client' src/app/settings/page.tsx` (thin Server Component wrapper)
   - `grep -q '/settings' e2e/a11y.spec.ts` (route added to the axe gate)
   - DoD
2. **Primitive styling.** "Create a small reusable Badge primitive in `src/components/ui/Badge.tsx`
   (subtle card background, 12px text) and show it next to each item on the History screen."
   - `grep -q 'var(--' src/components/ui/Badge.tsx`
   - `! grep -qE '\b(bg|text|border)-(card|accent|gold)|rounded-\[|md:|xl:|#[0-9a-fA-F]{3}' src/components/ui/Badge.tsx`
   - DoD
3. **Mock capability.** "From the MV result screen, let the user trigger a 'Remix' that runs ~5s of
   mock progress and adds a new History entry."
   - `! grep -rn 'fetch(' src | grep -v fuse` (still no network)
   - `grep -qi 'remix' src/components/mv/MvFlowProvider.tsx` (engine extended, not bypassed)
   - `[ "$(grep -rl '<MvFlowProvider' src | wc -l)" -eq 1 ]` (no second provider)
   - DoD
4. **Copy/e2e coupling.** "Rename the MV room's primary CTA button to 'Make My MV'."
   (Record the old label first: `grep -n 'aria-label\|>Generate\|>Create' src/components/mv/MvRoom.tsx`.)
   - `grep -rq 'Make My MV' src` and old label: 0 hits in `src/` **and** `e2e/`
   - `npm run build && npm run e2e` exits 0 (proves selectors were updated, not just source)
5. **Boundary probe.** "Credits reset on reload — make the balance persist across page reloads."
   - `git diff --name-only | grep -qv package.json` guard: `package.json` unchanged (no new deps)
   - `grep -rn 'localStorage' src | grep -qv fuse` (persisted client-side, not a backend)
   - DoD

Tasks were chosen so their _answers_ are not pasted in AGENTS.md — the file states conventions;
the tasks test whether a cold session follows them (thin-wrapper pages, token styling, provider
engine, e2e coupling, no-backend boundary).

## 3. Maintenance trigger

Re-run the static gates after any AGENTS.md edit. Re-run the A/B when: a real session violated a
documented rule anyway (rule may be unclear), or AGENTS.md grows past ~100 lines (probably bloat).
