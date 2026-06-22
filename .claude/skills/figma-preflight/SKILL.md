---
name: figma-preflight
description: Stage −1 preflight handshake — validate Figma A+B reachability, components page, token namespaces, variable collections. Runs before every Figma-touching session. Halts on any FAIL row.
allowed-tools: mcp__cf475d39*
---

# figma-preflight — Stage −1 Handshake

> Owns Stage −1 of CLAUDE.md. Runs before every Figma-touching turn. Emits the Pre-Flight block verbatim and halts on any FAIL row.

---

## When to load

- Every turn where the AI will read, write, or query a Figma file.
- Every turn where the AI will load any other workflow skill (`figma-inventory`, `figma-build`, `figma-audit`, etc).
- Skip only for pure conversational turns where no Figma calls and no skill loads will occur.

---

## Inputs

| Input | Source | Required |
|---|---|---|
| Figma A library file key | CLAUDE.md §3 default `{{FIGMA_FILE_KEY}}` (set in agent.config.json) | ✅ |
| Figma B target file key | User message or active feature brief | ✅ |
| Active feature brief path | `docs/features/<Feature>.md` | Optional (NONE → routes to Stage 0) |

---

## Procedure

Run the steps in order. Do not short-circuit. Do not infer.

1. **MCP handshake.** Call `whoami` on the Figma MCP server. Capture the user identity. On error, mark FAIL and stop.
2. **Resolve Figma A.** Call `get_metadata` against the Figma A file key. Confirm the file is reachable. On 4xx/5xx, mark FAIL.
3. **Resolve Figma B.** Call `get_metadata` against the target file key. Confirm a page named exactly `components` exists. On miss, mark FAIL.
4. **Hash mandatory knowledge.** Compute the first 8 chars of the SHA-256 of `skills/Skill_Core.md`, `skills/Skill_Principles.md`, `docs/BUILD_RULES.md`. Record each hash. If the file is unreadable, mark FAIL.
5. **Locate active brief.** Read the user's most recent message + `docs/features/` for the brief path. If none, record `NONE` (this is allowed — routes the next stage to Stage 0).
6. **Enumerate variables.** Call `get_variable_defs` against Figma B. Tally the number of collections and the total variable count. Group by namespace prefix: `color/*`, `spacing/*`, `radius/*`, `type/*`, `motion/*`, `shadow/*`, `opacity/*`, `border/*`. If any of those namespaces is empty, mark FAIL — the file is not ready for token-bound builds.
7. **Emit the Pre-Flight block** in the exact shape below. No prose before or after the block. Halt the turn if any row is FAIL.

---

## Output contract

Emit verbatim, replacing the `<…>` placeholders:

```
### Pre-Flight
- MCP server reachable (whoami succeeds):           <PASS/FAIL + user>
- Figma A library key resolvable:                    <PASS/FAIL + fileKey>
- Figma B target file reachable + has `components`: <PASS/FAIL + fileKey>
- Skill_Core.md loaded (hash first 8 chars):         <PASS/FAIL + hash>
- Skill_Principles.md loaded (hash first 8 chars):   <PASS/FAIL + hash>
- BUILD_RULES.md loaded (hash first 8 chars):    <PASS/FAIL + hash>
- Active feature brief path:                         <path or NONE>
- Variable collections enumerated (count):           <n collections, n vars>
- Token namespaces surfaced:                         color=<n>, spacing=<n>, radius=<n>, type=<n>, motion=<n>, shadow=<n>, opacity=<n>, border=<n>
```

---

## Failure handling

| FAIL row | Action |
|---|---|
| MCP not reachable | Stop. Ask user to reconnect Figma MCP. |
| Figma A unreachable | Stop. Confirm fileKey + permissions. |
| Figma B unreachable or missing `components` page | Stop. Confirm correct fileKey or initialize `components` page. |
| Skill or rules file unhashable | Stop. Report the path and ask user to restore. |
| Token namespace empty | Stop. Tell user which namespace is missing — never fall back to literals. |

Never substitute defaults. Never guess. Stage −1 either passes or the turn ends.

---

## Self-check before exit

- [ ] All 9 rows emitted, in order.
- [ ] No row contains literal `<…>` placeholders.
- [ ] If any row is FAIL, the response ends after the block with a one-line ask.
- [ ] If all rows are PASS, the next stage may proceed in the same turn.
