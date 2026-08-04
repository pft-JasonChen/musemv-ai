#!/usr/bin/env bash
# Gate G4-g — RD contract changes must be announced.
# docs/redesign-migration-plan-2026-08-01.md §9 (C1–C8) + §10 G4-g:
#   "若 PR 動到 C1–C8 的檔案,但沒有動 CHANGELOG-RD.md → 直接 fail."
#
# This is the one gate in §10 that no test can express, because the thing being
# enforced is a communication step, not a code property. RD is implementing
# against C1–C8 right now; a silent change there breaks them off-screen.
#
# MODES
#   (default)        working tree vs HEAD — what the Stop hook uses
#   --staged         staged changes only  — for a pre-commit hook
#   --range A..B     a commit range       — for CI / PR checks
#   --list           print the watched paths and exit
#
# WHY A COMMENT-ONLY EDIT ALSO TRIPS THIS
#   It does, deliberately. The plan chose file-level granularity, and the cost of
#   a false positive is one line in the changelog ("comment only, no contract
#   change") whereas the cost of a false negative is RD building against a
#   contract that moved. Writing that line is the point: it is an explicit
#   statement that you looked.
#
# EXIT  0 ok / nothing touched · 1 usage error · 2 gate failure (blocks Claude)

set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "check-rd-changelog: not a git repo — skipping" >&2; exit 0; }
cd "$ROOT" || exit 1

CHANGELOG="web-app/docs/CHANGELOG-RD.md"

# C1–C8 from §9. Globs are matched against git's path output, not the filesystem.
WATCH=(
  "web-app/src/lib/api/contract.ts"                       # C1 backend boundary
  "web-app/src/lib/api/schemas.ts"                        # C2 wire schema
  "web-app/src/lib/api/index.ts"                          # C3 swap point
  "web-app/src/components/providers/AuthProvider.tsx"     # C4 provider hooks
  "web-app/src/components/providers/CreditsProvider.tsx"  # C4
  "web-app/src/components/providers/HistoryProvider.tsx"  # C4
  "web-app/src/components/providers/MvFlowProvider.tsx"   # C4
  "web-app/src/components/providers/SongFlowProvider.tsx" # C4
  "web-app/src/lib/authStore.ts"                          # C5 auth storage
  "web-app/src/lib/i18n/config.ts"                        # C6 locale model
  "web-app/src/middleware.ts"                             # C6 locale routing
  "web-app/src/lib/mv/types.ts"                           # C8 domain constants
)
# C7 (route map) and the frozen surface snapshots, matched by prefix/suffix.
WATCH_PREFIX=( "web-app/src/app/" )
WATCH_SUFFIX=( "/__snapshots__/contract.surface.test.ts.snap"
               "/__snapshots__/providers.surface.test.ts.snap" )

if [ "${1:-}" = "--list" ]; then
  printf '%s\n' "${WATCH[@]}"
  printf '%s**\n' "${WATCH_PREFIX[@]}"
  printf '**%s\n' "${WATCH_SUFFIX[@]}"
  exit 0
fi

changed_files() {
  case "${1:-}" in
    --staged) git diff --cached --name-only ;;
    --range)
      [ -n "${2:-}" ] || { echo "check-rd-changelog: --range needs A..B" >&2; exit 1; }
      git diff --name-only "$2" ;;
    "")  { git diff --name-only HEAD; git ls-files --others --exclude-standard; } ;;
    *)   echo "check-rd-changelog: unknown mode '$1'" >&2; exit 1 ;;
  esac
}

CHANGED="$(changed_files "${1:-}" "${2:-}" | sort -u)"
[ -n "$CHANGED" ] || exit 0

is_watched() {
  local f="$1" w
  for w in "${WATCH[@]}";        do [ "$f" = "$w" ] && return 0; done
  for w in "${WATCH_PREFIX[@]}"; do case "$f" in "$w"*) return 0 ;; esac; done
  for w in "${WATCH_SUFFIX[@]}"; do case "$f" in *"$w") return 0 ;; esac; done
  return 1
}

hits=()
while IFS= read -r f; do
  [ -n "$f" ] && is_watched "$f" && hits+=("$f")
done <<< "$CHANGED"

[ "${#hits[@]}" -gt 0 ] || exit 0

# Plain-bash membership test. Piping to `grep -q` under `set -o pipefail` risks a
# SIGPIPE(141) from the producer once grep exits early, which pipefail turns into a
# false negative — here that would mean "changelog not updated" and a spurious block.
changelog_touched=0
while IFS= read -r f; do
  [ "$f" = "$CHANGELOG" ] && changelog_touched=1 && break
done <<< "$CHANGED"

if [ "$changelog_touched" -eq 1 ]; then
  echo "G4-g PASS — contract surface touched (${#hits[@]} file(s)) and $CHANGELOG updated"
  exit 0
fi

{
  echo "[G4-g FAIL] RD contract surface (§9 C1–C8) changed without a changelog entry."
  echo "  Touched:"
  printf '    %s\n' "${hits[@]}"
  echo "  Required: add an entry to $CHANGELOG in the SAME change, and tell RD."
  echo "  Not a contract change (comment/format only)? Say exactly that in the entry —"
  echo "  the point is the explicit statement, not the ceremony."
} >&2
exit 2
