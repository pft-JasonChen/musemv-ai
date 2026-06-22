#!/usr/bin/env bash
# .claude/scripts/guard-protected-files.sh
# PreToolUse guard for Write|Edit|MultiEdit.
#
# CONTRACT — ENFORCING (opposite of tier-a-static-check.sh):
#   tier-a-static-check.sh is ADVISORY  -> always exit 0, only prints findings.
#   THIS guard is ENFORCING             -> exit 2 (blocks the tool call) and
#                                          prints the reason to STDERR when the
#                                          target is a protected foundation path.
#   It is the hard-stop layer that backs the `ask` permission tier.
#
# INTENTIONAL ASYMMETRY (do not "fix" by adding shared/ back):
#   - docs/BUILD_RULES.md  -> HARD-BLOCKED here. It is an append-only,
#       self-growing decision log; a mid-task rewrite would corrupt accumulated
#       rules, so it must never be edited by the agent's file tools.
#   - shared/**                -> NOT blocked here; governed by the `ask` tier in
#       settings.json instead. Shared chrome IS edited occasionally, with human
#       confirmation — a hard-block would make that `ask` dead (stricter wins).
#   They are deliberately treated differently.
#
# Protected paths (project-relative): docs/BUILD_RULES.md, agent.config.json,
# and .claude/** (the harness itself).
# Everything else (incl. all new prototype files under prototypes/**, and
# shared/** which is ask-governed) -> exit 0.

INPUT="$(cat 2>/dev/null || true)"

# Program comes from the heredoc (stdin); the payload is passed as argv[1].
CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}" python3 - "$INPUT" <<'PYEOF'
import sys, os, json

raw = sys.argv[1] if len(sys.argv) > 1 else ""
try:
    fp = json.loads(raw).get("tool_input", {}).get("file_path", "")
except Exception:
    fp = ""          # unparseable payload -> do not block (fail-open is safe:
if not fp:           # the advisory check + permission tier still apply)
    sys.exit(0)

root = os.path.abspath(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))

# Absolute-ize, normalize, then express relative to the project root.
absf = fp if os.path.isabs(fp) else os.path.join(root, fp)
absf = os.path.normpath(absf)
try:
    rel = os.path.relpath(absf, root).replace(os.sep, "/")
except Exception:
    sys.exit(0)

# Outside the project root -> not ours to guard.
if rel == ".." or rel.startswith("../"):
    sys.exit(0)

def block(reason):
    sys.stderr.write("[GUARD: BLOCKED] %s — %s\n" % (rel, reason))
    sys.exit(2)

if rel == "docs/BUILD_RULES.md":
    block("self-growing decision log — append-only by intent; add confirmed rules at Stage 4, never rewrite mid-task")
if rel == "agent.config.json":
    block("centralized config (audit-flagged) — edit deliberately, not mid-build")
if rel == ".claude" or rel.startswith(".claude/"):
    block("harness config (agents/settings/scripts/rules) — change only with explicit human intent, not mid-build")

sys.exit(0)
PYEOF
# Propagate python's exit code (0 = allow, 2 = block) to Claude Code.
exit $?
