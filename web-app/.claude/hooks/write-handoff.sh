#!/usr/bin/env bash
# Session checkpoint, written on every Stop.
#
# THE PROBLEM
#   `.claude/rules/session-handoff.md` (and Prototype Automation's handoffs/ convention)
#   say to leave a handoff. Both depend on the model remembering to do it at the end of a
#   long session — which is exactly when it is most likely not to. The observable symptom
#   is "Continue from where you left off" turning up as an opening prompt.
#
#   So: a hook writes it, unconditionally, from facts. No model participation.
#
# WHAT IT RECORDS
#   Mechanical state (branch, HEAD, dirty files, gate outcome) plus the user's own turns
#   pulled from the transcript — the only durable record of INTENT. A hook cannot know
#   why; it can know what was asked and what state the tree was left in, which is what
#   the next session actually needs.
#
# WHERE
#   .claude/session-log/YYYY-MM-DD-<short>.md, plus LATEST.md pointing at the newest.
#   Gitignored: it is per-machine session metadata, not a project artifact.
#
# USAGE  bash write-handoff.sh <gate-exit-code>   (HOOK_INPUT env carries the hook JSON)
# Always exits 0 — a checkpoint must never be the reason a Stop fails.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null || exit 0   # -> web-app/
# shellcheck source=./lib-transcript.sh
. ".claude/hooks/lib-transcript.sh" 2>/dev/null || exit 0

GATE_RC="${1:-unknown}"
HOOK_INPUT="${HOOK_INPUT:-}"
OUT_DIR=".claude/session-log"
mkdir -p "$OUT_DIR" 2>/dev/null || exit 0

TP_RAW="$(transcript_path "$HOOK_INPUT" || true)"
TP="$(printf '%s' "$TP_RAW" | cut -f1)"
TP_SRC="$(printf '%s' "$TP_RAW" | cut -f2)"
# A guessed transcript may belong to another session — never mine it for intent.
[ "$TP_SRC" = "guess" ] && TP=""
SHORT="$([ -n "$TP" ] && basename "$TP" .jsonl | cut -c1-8 || echo local)"
STAMP="$(date '+%Y-%m-%d %H:%M')"
FILE="$OUT_DIR/$(date '+%Y-%m-%d')-$SHORT.md"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
HEAD_LINE="$(git -C "$ROOT" log -1 --format='%h %s' 2>/dev/null || echo 'no commits')"
DIRTY="$(git -C "$ROOT" status --porcelain 2>/dev/null)"
N_DIRTY="$(printf '%s\n' "$DIRTY" | grep -c . || true)"

case "$GATE_RC" in
  0) VERDICT="✅ all gates passed (G1 · G2-a · G4 · G5 · G7)" ;;
  2) VERDICT="🔴 BLOCKED — a gate failed; see the Stop output above" ;;
  *) VERDICT="⚠️ gate outcome unknown (rc=$GATE_RC)" ;;
esac

{
  echo "# Session checkpoint — $STAMP"
  echo
  echo "> Written by \`.claude/hooks/write-handoff.sh\` on Stop. Facts only — no model input."
  echo "> Next session: read this before touching anything."
  echo
  echo "**Gate outcome:** $VERDICT"
  echo "**Branch:** \`$BRANCH\` · **HEAD:** \`$HEAD_LINE\`"
  echo "**Uncommitted:** $N_DIRTY file(s)"
  # Self-diagnostic: tells you, after a real Stop, whether the hook payload actually
  # carries transcript_path. If this says `payload`, G7 is verifying for real. If it
  # says `guess`/`none` on every run, G7 can only ever report UNVERIFIED and needs a
  # different signal — check this line before trusting the gate.
  echo "**Transcript source:** \`${TP_SRC:-none}\` (payload/env = G7 can verify; guess/none = it cannot)"
  echo

  if [ -n "$DIRTY" ]; then
    echo "## Working tree"
    echo
    echo '```'
    printf '%s\n' "$DIRTY" | head -40
    [ "$N_DIRTY" -gt 40 ] && echo "… $((N_DIRTY - 40)) more"
    echo '```'
    echo
  fi

  if [ -n "$TP" ]; then
    echo "## What was asked (user turns, oldest first)"
    echo
    user_turns "$TP" 8 | sed 's/^/- /'
    echo

    AG="$(agents_spawned "$TP" | head -8)"
    if [ -n "$AG" ]; then
      echo "## Subagents spawned"
      echo
      printf '%s\n' "$AG" | while IFS=$'\t' read -r kind brief; do
        echo "- \`$kind\` — ${brief:0:120}"
      done
      echo
    else
      echo "## Subagents spawned"
      echo
      echo "- none. If this session changed components or routes, G7 should have blocked;"
      echo "  if it did not, check \`.claude/hooks/check-slice-reviewed.sh\`."
      echo
    fi
  else
    echo "## What was asked"
    echo
    echo "- transcript not locatable, so intent was not captured this time."
    echo
  fi

  echo "## Suggested next step"
  echo
  if [ "$GATE_RC" = "2" ]; then
    echo "- A gate is red. Fix that first — do not start new work on top of it."
  elif [ "$N_DIRTY" -gt 0 ]; then
    echo "- $N_DIRTY uncommitted file(s). Review and commit with explicit \`git add <paths>\`"
    echo "  (never \`git add -A\` — AGENTS.md). Ask before committing."
  else
    echo "- Tree is clean and gates are green. Safe starting point."
  fi
  echo
  echo "---"
  echo "<sub>Gitignored per-machine metadata. Regenerated on every Stop; old files are kept.</sub>"
} > "$FILE" 2>/dev/null || exit 0

cp "$FILE" "$OUT_DIR/LATEST.md" 2>/dev/null || true
echo "checkpoint -> $FILE"
exit 0
