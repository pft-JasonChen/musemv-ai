---
name: figma-inventory
description: Read target Figma, confirm `components` page, build structured inventory (components/variables/styles), map scope to screens/flows/states. Use at start of every build/audit. Writes resolved inventory + token IDs to `.design-state.json` for `figma-build` and `figma-audit` to consume.
---

# figma-inventory — Stage 1 procedure

> Resolves every component and variable the brief touches into IDs, writes them to `.design-state.json`, and emits `[Inventory: PASS]` on success.
> Silent by default — never narrate the scan, never dump the cache to chat.

---

## When to load

- Stage 1 of every build, after `[Pre-flight: PASS]`.
- Any turn where the user asks to "refresh inventory" or after `docs/BUILD_RULES.md §5` is updated.

## Inputs this skill expects

| Input | Source |
|---|---|
| Active brief | `docs/features/<Feature>.md` — §3 (file key), §6 (component checklist) |
| {{PRODUCT}} common token IDs | `docs/BUILD_RULES.md §5` |
| Cache (if any) | `.design-state.json` from a previous session — adjacent to the active brief |

---

## Cache contract — `.design-state.json`

Single file, session-local, adjacent to the active brief. Schema:

```json
{
  "fileKey": "<Figma B fileKey>",
  "briefPath": "docs/features/<Feature>.md",
  "lastUpdated": "ISO-8601",
  "components": {
    "Tabs":            { "targetNodeId": "7:683",   "source": "native" },
    "Segmented control":{ "targetNodeId": "...",     "source": "imported", "importKey": "..." },
    "Empty Image":     { "targetNodeId": "...",     "source": "imported", "importKey": "8a469bc6..." }
  },
  "variables": {
    "color/text/primary":   "VariableID:...",
    "spacing/8":            "VariableID:ba5b634c.../13106:231",
    "radius/sm":            "VariableID:..."
  },
  "fallbacks": {
    "_description": "Logged for audit. Each entry mirrors brief §7.",
    "missingComponents": [],
    "tokenFallbacks": []
  }
}
```

If `fileKey` + `briefPath` of the existing cache match the current session, **reuse the cache — do not re-scan.** Stale or mismatched cache is regenerated.

---

## Procedure

### 1. Load or initialize cache

- If `.design-state.json` exists at the brief's directory and `(fileKey, briefPath)` match → reuse.
- Otherwise → create a fresh in-memory cache, ready to write at the end.

### 2. Resolve variables (token IDs first)

- For every variable family the brief touches (color, spacing, radius, type, motion, shadow, opacity, border):
  1. **Check `docs/BUILD_RULES.md §5` first.** Listed tokens go straight into the cache.
  2. For tokens not listed, call `getLocalVariableCollectionsAsync` once per collection, scan by name, cache the `VariableID:.../...` form.
  3. **Critical-token check.** If the brief touches a primary-surface fill or body text color and that variable cannot be resolved → halt with `[Inventory: FAIL] missing critical token: <name>`.

### 3. Resolve components

For each row in brief §6:

```
1. Look in target file: figma.root.findOne(n => n.name === <name> && n.type === "COMPONENT" || "COMPONENT_SET")
   → found: cache targetNodeId, source = "native"

2. Not found, importKey present in §6:
   - Call search_design_system to confirm assetType
   - assetType == "component_set":
       importComponentSetByKeyAsync(key)
       → cache the imported set's id; pick variant via componentSet.children[i].name match
   - assetType == "component":
       importComponentByKeyAsync(key)
       → cache the imported component's id
   → source = "imported"

3. Not found, no importKey:
   - Critical component → halt with `[Inventory: FAIL] missing critical component: <name>`
   - Non-critical component → log to cache.fallbacks.missingComponents,
                              mirror to brief §7 as a fallback row,
                              continue (figma-build will compose + badge per FALLBACK rule)
```

**Never improvise.** If a component is unresolvable and critical, halt — do not create a primitive substitute.

### 4. Resolve exemplar anchor (if Stage 0a pinned one)

- If `[Exemplar: <id>]` was emitted in Stage 0a, load `refs/<surface>/<id>.json`.
- Cache `exemplar.figma.nodeId` so `figma-build` can clone from it without re-reading the reference file.

### 5. Persist

Write `.design-state.json` to the brief's directory. Atomic — write to `.design-state.json.tmp`, then rename.

### 6. Emit

- Success → `[Inventory: PASS]` (single line, no body).
- Critical fail → `[Inventory: FAIL] <reason>`, halt.
- Non-critical fallbacks present → `[Inventory: PASS] (with <n> fallbacks logged in §7)`.

---

## Import API selection (cross-ref CLAUDE.md §RULES rule 10)

Always read `search_design_system` result's `assetType` before importing:

| `assetType` | API | Then |
|---|---|---|
| `component_set` | `importComponentSetByKeyAsync(key)` | `set.children[0].createInstance()` or find variant by `name` first |
| `component`     | `importComponentByKeyAsync(key)`    | `component.createInstance()` |

Never guess. Wrong API selection silently produces the wrong instance type, which the audit will flag downstream — but at higher cost.

---

## Performance / scope rules

- **Do not call `findAll()` on entire pages.** Library-linked component trees are deep; full-page traversal causes timeouts. Scan by name with `findOne` or by ID lookup.
- **Skip already-cached IDs on re-runs.** A re-scan only needs to resolve entries missing from the cache.
- **Variables: query by collection, not by individual variable lookup.** One `getLocalVariableCollectionsAsync` round-trip per collection beats N individual `getVariableByIdAsync` calls.

---

## Handoff to figma-build

On `[Inventory: PASS]`, `figma-build` reads `.design-state.json` to:

- Resolve every component reference in §4 to a `targetNodeId`.
- Bind every property in the property-binding table to a `VariableID`.
- Pick the build-mode anchor: exemplar's `figma.nodeId` if pinned, else brief §3 anchor.

If `figma-build` discovers a component reference missing from the cache mid-build → it must call back into `figma-inventory` rather than improvise.

---

## Failure modes

| Symptom | Action |
|---|---|
| `.design-state.json` exists but `fileKey` mismatches | Discard cache; re-scan from scratch. |
| Critical token unresolvable | Halt with `[Inventory: FAIL]`. Do not promote a similar-looking token. |
| Import succeeds but wrong variant fetched | Walk `componentSet.children` by `name`, pick exact match. Cache the variant's node ID, not the parent set's. |
| Designer added a new component to §6 mid-session | Re-run inventory; the cache merges by name, doesn't overwrite. |

---

## Cross-references (do not restate)

`CLAUDE.md` PIPELINE Stage 1 + Stage 0a (exemplar pin), `CLAUDE.md` §RULES rule 10 (import API selection), `CLAUDE.md` §FALLBACK (graceful degradation), `docs/BUILD_RULES.md §5` (token table), `refs/README.md` (exemplar schema).
