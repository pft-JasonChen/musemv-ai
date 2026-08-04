#!/usr/bin/env bash
# guard-greps.sh — Gate G1-b from docs/redesign-migration-plan-2026-08-01.md §10.0.
#
# Run from web-app/. Blocks (exit 2) on any hard violation; prints and passes on
# ratchet warnings. Called by post-edit-check.sh (per edit) and stop-verify.sh
# (per slice), so a violation cannot survive to "Done".
#
# Verified 2026-08-02 against the live tree: all five hard rules were 0 hits, so
# turning this on blocks nothing that already exists.
#
# RAW HEX is deliberately NOT a hard rule. web-app/AGENTS.md: raw #fff/#000 and
# rgba() scrims are "existing tolerated practice — match the surrounding file;
# don't mass-convert". 50 occurrences across 19 files today. So instead of a
# blanket ban this uses a RATCHET: the per-file counts are frozen in
# .claude/baseline-rawhex.txt; a file may keep what it has, but any increase — or
# any brand-new file with hex — fails. Existing debt stays, new debt cannot land.
# After a Phase-1 token pass, regenerate the baseline:
#   bash .claude/hooks/guard-greps.sh --rebaseline

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 0   # -> web-app/
BASELINE=".claude/baseline-rawhex.txt"
fail=0

hard() {  # $1 = human label, $2 = grep command
  local hits
  hits="$(eval "$2" 2>/dev/null)" || true
  if [ -n "$hits" ]; then
    echo "[G1-b FAIL] $1" >&2
    printf '%s\n' "$hits" | head -12 >&2
    fail=1
  fi
}

count_hex() {  # per-file counts of raw hex in src, "path:n", sorted
  grep -rcE '#[0-9a-fA-F]{3,8}\b' src --include='*.tsx' --include='*.ts' 2>/dev/null \
    | awk -F: '$2>0' | sort
}

if [ "${1:-}" = "--rebaseline" ]; then
  mkdir -p "$(dirname "$BASELINE")"
  count_hex > "$BASELINE"
  echo "rebaselined: $BASELINE ($(wc -l < "$BASELINE" | tr -d ' ') files)"
  exit 0
fi

# ── the five hard rules (plan §10.0 G1-b) ───────────────────────────────────
hard "import.meta — Vite-ism leaked in from the designer prototype" \
     "grep -rn 'import\.meta' src"
# `fetch(` is banned everywhere in the prototype (AGENTS.md). But DEVELOPER-HANDOVER §4
# tells RD that once the real client lands the grep becomes "only inside the API
# implementation" — so as written this rule would BLOCK the documented production
# migration. Rather than leave that trap for whoever hits it at the worst moment, the
# relaxation is pre-wired and deliberate:
#   YCM_REAL_API=1  → fetch allowed inside src/lib/api/ only; still banned everywhere else.
# Default stays strict, so nothing changes for prototype work.
if [ "${YCM_REAL_API:-0}" = "1" ]; then
  echo "[G1-b note] YCM_REAL_API=1 — fetch() permitted inside src/lib/api/ only" >&2
  hard "fetch( outside src/lib/api — the API layer is the only place allowed to reach a network" \
       "grep -rn 'fetch(' src --exclude-dir=api"
else
  hard "fetch( — AGENTS.md forbids any network call in this prototype (set YCM_REAL_API=1 when the real client lands — DEVELOPER-HANDOVER §4)" \
       "grep -rn 'fetch(' src"
fi
hard "MockMuseApi imported outside src/lib/api — cross-layer import" \
     "grep -rn 'MockMuseApi' src --exclude-dir=api"
hard "sessionStorage — DP's draft mechanism must not come across (auth uses localStorage, C5)" \
     "grep -rn 'sessionStorage' src"
hard "window.location.href assignment — use next/navigation router instead" \
     "grep -rn 'window\.location\.href[[:space:]]*=' src"

# ── raw-hex ratchet ─────────────────────────────────────────────────────────
if [ -f "$BASELINE" ]; then
  now="$(count_hex)"
  while IFS=: read -r f n; do
    [ -z "$f" ] && continue
    was="$(awk -F: -v k="$f" '$1==k{print $2}' "$BASELINE")"
    was="${was:-0}"
    if [ "$n" -gt "$was" ]; then
      echo "[G1-b FAIL] raw hex increased in $f ($was -> $n) — bind to a token in" \
           "src/styles/tokens.css and consume via var()" >&2
      fail=1
    fi
  done <<< "$now"
else
  echo "[G1-b note] $BASELINE missing — run: bash .claude/hooks/guard-greps.sh --rebaseline" >&2
fi

[ "$fail" -eq 0 ] || exit 2
exit 0
