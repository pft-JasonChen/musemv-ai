#!/usr/bin/env bash
# Gate "done": full typecheck + test run must pass.
set -uo pipefail
npx tsc --noEmit || { echo "Stop blocked: tsc errors remain." >&2; exit 2; }
npx vitest run || { echo "Stop blocked: tests failing." >&2; exit 2; }
exit 0
