#!/usr/bin/env bash
# lib-transcript.sh — locate and query the CURRENT session's transcript.
#
# Shared by check-slice-reviewed.sh (G7) and write-handoff.sh (session checkpoint).
# Both need to answer questions about what happened THIS session — "was a reviewer
# spawned?", "what did the user ask for?" — which is not derivable from the filesystem.
#
# Source it, then use:  transcript_path   agents_spawned   user_turns
#
# The hook payload normally carries `transcript_path`; everything else here is a
# fallback for when it does not (older builds, odd invocations, manual testing).
# Never fail hard: a checkpoint or a reviewer check that crashes the Stop hook is
# worse than one that degrades.

# Prints "<path>\t<source>" where source is payload | env | guess.
# $1 = the raw hook JSON (may be empty)
#
# THE SOURCE MATTERS. `payload`/`env` identify THIS session. `guess` is "newest
# transcript in this project directory", which can easily be a DIFFERENT session —
# the first G7 run proved it, matching a reviewer from a previous session and
# reporting a false PASS. Callers must never treat a guess as authoritative.
transcript_path() {
  local input="${1:-}" p=""
  if [ -n "$input" ]; then
    p="$(printf '%s' "$input" | /usr/bin/python3 -c 'import sys,json
try:
    d = json.load(sys.stdin)
    print(d.get("transcript_path") or "")
except Exception:
    print("")' 2>/dev/null || true)"
  fi
  [ -n "$p" ] && [ -f "$p" ] && { printf '%s\tpayload' "$p"; return 0; }
  [ -n "${CLAUDE_TRANSCRIPT_PATH:-}" ] && [ -f "$CLAUDE_TRANSCRIPT_PATH" ] && {
    printf '%s\tenv' "$CLAUDE_TRANSCRIPT_PATH"; return 0; }

  # Guess: newest transcript in this cwd's project dir. Claude Code sanitises the
  # absolute path by replacing / . and space with '-' and keeping '_'
  # (…/Claude/Projects/Prototype Automation -> -Users-…-Projects-Prototype-Automation).
  local slug dir newest
  slug="$(printf '%s' "$PWD" | sed 's|[/. ]|-|g')"
  dir="$HOME/.claude/projects/$slug"
  [ -d "$dir" ] || return 1
  newest="$(ls -t "$dir"/*.jsonl 2>/dev/null | head -1)"
  [ -n "$newest" ] || return 1
  printf '%s\tguess' "$newest"
}

# Subagents spawned this session, as "subagent_type<TAB>description" lines.
# $1 = transcript path
agents_spawned() {
  [ -f "${1:-}" ] || return 0
  /usr/bin/python3 - "$1" <<'PY' 2>/dev/null || true
import json, sys
for line in open(sys.argv[1], errors="replace"):
    if '"tool_use"' not in line:
        continue
    try:
        o = json.loads(line)
    except ValueError:
        continue
    if o.get("type") != "assistant":
        continue
    for b in (o.get("message") or {}).get("content") or []:
        if not isinstance(b, dict) or b.get("type") != "tool_use":
            continue
        if b.get("name") not in ("Agent", "Task"):
            continue
        i = b.get("input") or {}
        # The prompt matters as much as the type: a general-purpose agent given a
        # review brief is still an independent pair of eyes, which is what G7 wants.
        blob = " ".join(str(i.get(k, "")) for k in ("description", "prompt"))
        print("%s\t%s" % (i.get("subagent_type", "?"), blob[:400].replace("\n", " ")))
PY
}

# The user's own turns this session, newest last — the only record of intent.
# $1 = transcript path, $2 = how many (default 6)
user_turns() {
  [ -f "${1:-}" ] || return 0
  /usr/bin/python3 - "$1" "${2:-6}" <<'PY' 2>/dev/null || true
import json, sys
keep = int(sys.argv[2])
turns = []
for line in open(sys.argv[1], errors="replace"):
    try:
        o = json.loads(line)
    except ValueError:
        continue
    if o.get("type") != "user" or o.get("isSidechain"):
        continue
    c = (o.get("message") or {}).get("content")
    if isinstance(c, str):
        text = c
    elif isinstance(c, list):
        text = "".join(b.get("text", "") for b in c
                       if isinstance(b, dict) and b.get("type") == "text")
    else:
        continue
    text = (text or "").strip()
    # Skip tool results, system reminders, and hook echoes — not user intent.
    if not text or text.startswith("<") or text.startswith("Result of calling"):
        continue
    turns.append(" ".join(text.split())[:300])
for t in turns[-keep:]:
    print(t)
PY
}
