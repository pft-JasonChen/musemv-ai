#!/usr/bin/env bash
# hook-dispatch.sh — route Claude Code hook events to the right sub-project.
#
# WHY THIS EXISTS
#   ycmuse-web holds two harnesses:
#     web-app/  -> Next.js app with real gates in web-app/.claude/hooks/
#                  (tsc on every .ts/.tsx edit; tsc + vitest before Stop)
#     root      -> reference material and input docs; nothing to gate
#   Claude Code resolves settings/hooks from the SESSION's project root. 7 of 8
#   recorded ycmuse sessions started at this root, one level above web-app/ — so
#   web-app/.claude/settings.json was never loaded and none of its gates ever ran.
#   This dispatcher re-attaches them, path-scoped, without duplicating them.
#
# CONTRACT
#   Delegates verbatim: exits with the sub-hook's exit code. exit 2 = block Claude
#   (that is the point — web-app's gates are meant to block). Anything outside
#   web-app/ exits 0 untouched.
#
# USAGE   bash hook-dispatch.sh pre|post|stop     (hook JSON arrives on stdin)

set -uo pipefail

PHASE="${1:-}"
case "$PHASE" in
  pre|post|stop) ;;
  *) echo "hook-dispatch.sh: expected pre|post|stop, got '${PHASE}'" >&2; exit 0 ;;
esac

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
WEBAPP="$ROOT/web-app"
INPUT="$(cat 2>/dev/null || true)"

# web-app has its own hooks dir; if it ever disappears, degrade to no-op, never crash.
[ -d "$WEBAPP/.claude/hooks" ] || exit 0

edited_path() {
  printf '%s' "$INPUT" | /usr/bin/python3 -c 'import sys, json
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("file_path", "") or "")
except Exception:
    print("")' 2>/dev/null || true
}

run_webapp_hook() {  # $1 = script filename under web-app/.claude/hooks/
  local script="$WEBAPP/.claude/hooks/$1"
  [ -f "$script" ] || return 0
  # cd into web-app: its hooks call npx tsc/vitest/eslint and need that cwd.
  ( cd "$WEBAPP" && printf '%s' "$INPUT" | bash ".claude/hooks/$1" )
}

case "$PHASE" in
  pre|post)
    FILE="$(edited_path)"
    [ -z "$FILE" ] && exit 0
    # Match both the absolute path and a root-relative one.
    case "$FILE" in
      "$WEBAPP"/*|web-app/*|./web-app/*) ;;
      *) exit 0 ;;
    esac
    if [ "$PHASE" = "pre" ]; then
      run_webapp_hook pre-edit-guard.sh
    else
      run_webapp_hook post-edit-check.sh
    fi
    exit $?
    ;;
  stop)
    # Stop hooks carry no file_path — decide from what actually changed on disk.
    # No web-app changes this session => nothing to verify, don't tax the user.
    #
    # Capture instead of piping to `grep -q`: under `set -o pipefail` grep exits on
    # its first match and a still-writing producer takes SIGPIPE (141), which
    # pipefail reports as pipeline failure — a dirty tree would read as clean and
    # the gate would silently skip. This one command's output is small enough to
    # finish first today, but the failure mode is invisible, so don't rely on luck.
    dirty="$(git -C "$ROOT" status --porcelain -- web-app 2>/dev/null)"
    if [ -n "$dirty" ]; then
      run_webapp_hook stop-verify.sh
      exit $?
    fi
    exit 0
    ;;
esac
