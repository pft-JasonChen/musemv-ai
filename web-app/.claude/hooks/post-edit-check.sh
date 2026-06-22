#!/usr/bin/env bash
# Format + lint the edited file, then typecheck + related tests.
set -uo pipefail
input="$(cat)"
path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$path" ] && exit 0
case "$path" in
  *.ts|*.tsx|*.css|*.json|*.md) npx prettier --write "$path" >/dev/null 2>&1 || true ;;
esac
case "$path" in
  *.ts|*.tsx)
    npx eslint --fix "$path" >/dev/null 2>&1 || true
    npx tsc --noEmit || { echo "tsc failed after editing $path" >&2; exit 2; }
    npx vitest related --run "$path" >/dev/null 2>&1 || true ;;
esac
exit 0
