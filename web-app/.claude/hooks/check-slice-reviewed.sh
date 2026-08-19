#!/usr/bin/env bash
# Gate G7 — independent verification, machine-checked.
# docs/archive/redesign-migration-plan-2026-08-01.md §10 G7.
#
# THE PROBLEM THIS SOLVES
#   G7 says: "建置的那個 session / agent 不得宣告 PASS" — the session that built the code
#   may not sign it off. Every other gate in §10 checks a FILE; this one has to check
#   that a PROCESS happened, which is why it stayed convention-only. A convention is
#   what this project's own HARNESS_AUDIT flagged as H5 and left unfixed for six weeks.
#
#   The signal is in the session transcript: an `Agent` tool_use means a subagent with
#   its own context actually ran. That is checkable.
#
# WHEN IT FIRES
#   Only when a SLICE changed — something under src/components/ or src/app/. Doc, spec,
#   config, test and lib-only sessions are not slices and are not gated. G3-c/G5-e/G7 are
#   the gates that need this; they only apply to component and route work.
#
# WHAT COUNTS AS A REVIEWER
#   Either a purpose-built review agent (design-reviewer, a11y-checker, code-reviewer,
#   component-architect, validation-reviewer), or any subagent whose brief is a review
#   ("review"/"audit"/"verify"/"critique"). The second clause is deliberate: the recorded
#   history shows the reviews that DID happen were run as `general-purpose` with a review
#   prompt, and refusing to count those would fail sessions that did the right thing.
#   It also means a root session — where web-app's four agents are not discoverable —
#   can still satisfy G7. (Better: start the session from web-app/. See ../../CLAUDE.md.)
#
# ESCAPE HATCH
#   YCM_SKIP_REVIEW=1. If you use it, say so in the session. An unspoken skip is how a
#   gate quietly stops being one.
#
# EXIT  0 = satisfied or not applicable · 2 = slice changed with no independent review

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 0   # -> web-app/
# shellcheck source=./lib-transcript.sh
. ".claude/hooks/lib-transcript.sh"

HOOK_INPUT="${HOOK_INPUT:-}"
[ "${YCM_SKIP_REVIEW:-0}" = "1" ] && {
  echo "G7: review check skipped (YCM_SKIP_REVIEW=1) — mention this in the session"; exit 0; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -n "$ROOT" ] || { echo "G7: skipped (not a git repo)"; exit 0; }

SLICE_PATHS=( "web-app/src/components" "web-app/src/app" )
# Capture, never pipe to grep -q: pipefail + early grep exit = SIGPIPE(141) read as
# "clean", which would silently disable this gate. (Cost a debugging round on 08-02.)
slice_changed="$(git -C "$ROOT" status --porcelain -- "${SLICE_PATHS[@]}" 2>/dev/null
                 git -C "$ROOT" ls-files --others --exclude-standard -- "${SLICE_PATHS[@]}" 2>/dev/null)"
if [ -z "$slice_changed" ]; then
  echo "G7: not applicable — no component or route changes this session"
  exit 0
fi

TP_RAW="$(transcript_path "$HOOK_INPUT" || true)"
TP="$(printf '%s' "$TP_RAW" | cut -f1)"
TP_SRC="$(printf '%s' "$TP_RAW" | cut -f2)"

if [ -z "$TP" ] || [ "$TP_SRC" = "guess" ]; then
  # No authoritative transcript for THIS session => cannot prove or disprove.
  # A guess is not good enough in either direction: "newest transcript in this project
  # dir" matched a reviewer from a PREVIOUS session on the first run here and reported a
  # false PASS. Warn instead of blocking — a gate that fails on missing telemetry just
  # gets disabled — but never claim it passed.
  echo "G7: UNVERIFIED — a slice changed, but this session's transcript is not" >&2
  echo "    identifiable (${TP_SRC:-none}), so independent review could not be checked." >&2
  echo "    Spawn a reviewer anyway; do not read this as a pass." >&2
  exit 0
fi

REVIEW_AGENTS='design-reviewer|a11y-checker|code-reviewer|component-architect|validation-reviewer'
matched="$(agents_spawned "$TP" | grep -Ei "^($REVIEW_AGENTS)	|	.*(review|audit|verify|critique)" | head -3)"

if [ -n "$matched" ]; then
  echo "G7 PASS — independent review ran this session:"
  printf '%s\n' "$matched" | while IFS=$'\t' read -r kind brief; do
    echo "    $kind — ${brief:0:90}"
  done
  exit 0
fi

n_files="$(printf '%s\n' "$slice_changed" | grep -c . || true)"
{
  echo "[G7 FAIL] $n_files component/route file(s) changed and no independent reviewer ran."
  echo
  echo "  G7: the session that built a slice may not sign it off (§10 G7)."
  echo "  Spawn one of web-app's reviewers over the changed files, then Stop again:"
  echo "      design-reviewer · a11y-checker · code-reviewer · component-architect"
  echo "  (Those are discoverable only when the session starts in web-app/ — from the"
  echo "   repo root, use a general-purpose agent with an explicit review brief.)"
  echo
  echo "  Changed:"
  printf '%s\n' "$slice_changed" | sed 's/^/    /' | head -12
  echo
  echo "  Deliberately skipping? YCM_SKIP_REVIEW=1 — and say so in the session."
} >&2
exit 2
