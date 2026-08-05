#!/usr/bin/env bash
# Gate G1-a + G1-b + G4-g from docs/redesign-migration-plan-2026-08-01.md §10.
#
# The plan lists G1-a as "npm run typecheck && lint && test:run && build, 四支全
# exit 0" and files it under "每一次 edit 之後". That placement is not viable —
# `next build` after every Edit would make the session unusable. So it is split:
#   per edit  -> post-edit-check.sh : tsc on the touched file + guard-greps
#   per slice -> this hook          : all four of G1-a + guard-greps
# Same coverage, viable cost. Measured 2026-08-02 on this tree: tsc, lint,
# vitest all pass and `next build` takes 8.3s (Turbopack), so the full four is
# a reasonable Stop gate.
#
# Reached from a repo-root session via ../.claude/scripts/hook-dispatch.sh.
set -uo pipefail

# The hook JSON on stdin carries transcript_path, which G7 and the checkpoint both need.
# Read it once here and pass it down by env — the sub-scripts cannot re-read stdin.
HOOK_INPUT="$(cat 2>/dev/null || true)"
export HOOK_INPUT

# The checkpoint must be written even when a gate fails — especially then, since a red
# gate is exactly the state the next session needs to know about. An EXIT trap runs on
# every path out of this script, including the `exit 2`s below.
trap 'bash .claude/hooks/write-handoff.sh "$?" || true' EXIT

step() {  # $1 = label, $2... = command
  local label="$1"; shift
  if ! "$@" > /tmp/_g1a.log 2>&1; then
    echo "Stop blocked — G1-a $label failed:" >&2
    tail -30 /tmp/_g1a.log >&2
    exit 2
  fi
}

step "typecheck" npm run typecheck
step "lint"      npm run lint
step "test:run"  npm run test:run
step "build"     npm run build

# G1-b — cheap, and the plan wants it on every gate pass.
bash .claude/hooks/guard-greps.sh || exit 2

# G4-g — a C1–C8 change must carry a docs/CHANGELOG-RD.md entry (§10 G4-g).
# G4-a..G4-f need no hook: they are snapshot tests inside `npm run test:run` above
# (src/lib/api/contract.surface.test.ts + src/components/providers/providers.surface.test.ts).
bash scripts/check-rd-changelog.sh || exit 2

# ── G2-a — the token map must not go stale ──────────────────────────────────
# Pure file parsing, ~100ms, so it runs unconditionally. Exit codes are distinct:
#   1 = the designer prototype is not on this machine -> skip, not a failure
#   2 = tokens moved without `npm run token-map` -> block
if [ -f scripts/build-token-map.mjs ]; then
  node scripts/build-token-map.mjs --check > /tmp/_g2a.log 2>&1
  case "$?" in
    0) : ;;
    1) echo "G2-a: skipped ($(head -1 /tmp/_g2a.log))" ;;
    *) echo "Stop blocked — G2-a:" >&2; cat /tmp/_g2a.log >&2; exit 2 ;;
  esac
fi

# ── D1 — the designer stylesheets must stay verbatim ────────────────────────
# Blocks only on DRIFT (a local edit to a copied file), because a re-drop would
# silently revert that edit and take the fix with it. Unresolved var(--token)
# references are the DESIGNER's bugs: they are printed, not fatal — making them
# fatal would just pressure someone into editing the verbatim copy, which is the
# one thing this check exists to prevent. Found 3 on the first file migrated.
if [ -f scripts/check-designer-css.mjs ]; then
  node scripts/check-designer-css.mjs > /tmp/_d1.log 2>&1
  if [ "$?" -ne 0 ]; then
    echo "Stop blocked — designer CSS drifted from the drop:" >&2; cat /tmp/_d1.log >&2; exit 2
  fi
  grep -q 'never defined' /tmp/_d1.log && sed -n '/never defined/,$p' /tmp/_d1.log
fi

# ── G5 / G3 — e2e (Playwright + axe) ────────────────────────────────────────
# The only leg that actually LOOKS at the rendered screen. tsc and vitest cannot
# catch a button that stopped rendering; G5-d's 10 behaviour regressions and the
# a11y sweep live here. It was in no gate until 2026-08-02 — and had silently
# broken (mv-flow.spec.ts, a substring-matched locator resolving under a modal
# scrim), which is exactly the failure mode an ungated suite has.
#
# ~70s for 46 tests, so it is SCOPED: only run when something it could plausibly
# break has changed. Doc-only and lib-only sessions stay fast. It reuses the
# `npm run build` above (playwright's webServer runs `next start -p 3100`).
#
# Escape hatch: YCM_SKIP_E2E=1 to skip deliberately. If you use it, say so in the
# session — an unspoken skip is how a gate quietly stops being one.
E2E_PATHS=(
  "web-app/src/app" "web-app/src/components" "web-app/src/middleware.ts"
  "web-app/e2e" "web-app/playwright.config.ts" "web-app/src/lib/i18n"
)
if [ "${YCM_SKIP_E2E:-0}" = "1" ]; then
  echo "G5: e2e skipped (YCM_SKIP_E2E=1) — mention this in the session"
elif ! command -v npx >/dev/null 2>&1; then
  echo "G5: e2e skipped (no npx on PATH)" >&2
else
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
  if [ -z "$ROOT" ]; then
    touched=1   # not a git repo: cannot scope, so run it
  else
    # Capture into a variable rather than piping to `grep -q`. With `set -o pipefail`,
    # grep -q exits on its first match and the still-writing producer takes SIGPIPE
    # (141), which pipefail then reports as pipeline failure — so a dirty tree reads
    # as clean and the gate silently skips. Cost us one debugging round on 2026-08-02.
    changed="$(git -C "$ROOT" status --porcelain -- "${E2E_PATHS[@]}" 2>/dev/null
               git -C "$ROOT" ls-files --others --exclude-standard -- "${E2E_PATHS[@]}" 2>/dev/null)"
    [ -n "$changed" ] && touched=1 || touched=0
  fi
  if [ "$touched" = "1" ]; then
    echo "G5: UI/e2e files changed — running Playwright + axe (~70s)"
    npm run e2e > /tmp/_g5e2e.log 2>&1 || {
      echo "Stop blocked — G5 e2e failed:" >&2
      tail -40 /tmp/_g5e2e.log >&2
      exit 2
    }
    grep -E '[0-9]+ passed' /tmp/_g5e2e.log | tail -1
  else
    echo "G5: e2e skipped — no UI or e2e files changed this session"
  fi
fi

# ── G7 — independent verification actually happened ─────────────────────────
# The only gate here that checks a PROCESS rather than a file. Fires only when a
# slice (components/routes) changed; see the script's header for what counts.
bash .claude/hooks/check-slice-reviewed.sh 2>/tmp/_g7.log || { cat /tmp/_g7.log >&2; exit 2; }
cat /tmp/_g7.log >&2 2>/dev/null || true

# Report G7 honestly. It has three outcomes, not two: PASS, UNVERIFIED (no authoritative
# transcript — cannot check, deliberately not blocking), and FAIL (already exited above).
# Printing "G7 PASS" for an UNVERIFIED run is the kind of overclaim these gates exist to
# stop, so the summary line distinguishes them.
if grep -q 'UNVERIFIED' /tmp/_g7.log 2>/dev/null; then
  G7_STATE="G7 UNVERIFIED"
else
  G7_STATE="G7 PASS"
fi
echo "G1+G2a+G4+G5 PASS · ${G7_STATE} — typecheck / lint / test:run / build /"
echo "  guard-greps / rd-changelog / token-map / e2e / independent-review"
exit 0
