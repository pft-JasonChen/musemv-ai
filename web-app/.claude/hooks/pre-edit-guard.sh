#!/usr/bin/env bash
# Block edits to env files. Reads hook JSON from stdin.
set -uo pipefail
input="$(cat)"
path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
case "$path" in
  *.env|*.env.*) echo "Blocked: refusing to modify env files ($path)" >&2; exit 2 ;;
esac
exit 0
