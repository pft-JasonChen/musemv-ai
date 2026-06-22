---
name: figma-build
description: "Assemble UI on the target Figma canvas using only existing components, variants, variables, and styles. Delegates to Cowork built-in skills (figma-use, figma-generate-design, edit-figma-design) for Plugin API execution. Use after figma-inventory has produced .design-state.json. Do NOT use for audit (use figma-audit)."
---

# figma-build — Stage 2 procedure

> Assembles UI frame by frame on the target file.
> Delegates to Cowork built-in skills for API execution. Exemplar (Stage 0a) anchors clone-then-mutate. Mandatory Frame 1 human gate.

---

## Built-in skill delegation

This skill orchestrates the build sequence. Actual Figma Plugin API execution is delegated to Cowork built-in skills:

| Built-in skill | When to use | How |
|---|---|---|
| `/figma-use` | **Before every `use_figma` call** (mandatory) | Invoke skill, then call `use_figma`. Contains critical API rules (color ranges, font loading, etc.) |
| `/figma-generate-design` | Screen assembly from design system | Use for section-by-section build. Discovers components via `search_design_system`, imports them, assembles with tokens. |
| `/edit-figma-design` | Text → Figma design authoring | Use when building from a written description rather than cloning a reference. |
| `/apply-design-system` | Reconnect detached components | Use during remediation when audit finds detached instances or unbound tokens. |

**Rule:** Never call `use_figma` without first loading `/figma-use`. Never hardcode Plugin API patterns that the built-in skills already handle.

---

## When to load

- Stage 2 of every build, after `[Inventory: PASS]`.
- Any turn where the user asks to "build the next frame", "rebuild frame N", or "apply revisions".

## Inputs this skill expects

| Input | Source |
|---|---|
| `.design-state.json` | Written by `figma-inventory` — component node IDs + variable IDs |
| Pinned exemplar (or `none`) | Stage 0a output — full `refs/<surface>/<pattern>.json` if pinned |
| Active brief §4 / §5 | UI structure + workflow frames table |
| Anchor frame node ID | Brief §3 "Page / Anchor node", or the exemplar's `figma.nodeId` |

If any of the first three are missing → halt, do not improvise.

---

## The build mode decision (first thing every turn)

```
if exemplar pinned in Stage 0a:
    mode = "clone-then-mutate"
    anchor = exemplar.figma.nodeId
else:
    mode = "compose-from-spec"
    anchor = brief.§3.anchorNode  # explicit designer choice
```

**Clone-then-mutate is the preferred mode.** Only fall through to compose-from-spec when the designer has explicitly skipped the exemplar at Stage 0a or when no surface entries exist yet.

---

## Procedure — clone-then-mutate

Per frame in brief §5:

1. **Clone the anchor.** Call `node.clone()` on the anchor (`exemplar.figma.nodeId` for Frame 1; previous frame's node ID for Frame 2+).
2. **Rename** to the brief's frame name (e.g. `dt_<feature>_<NN>_<StateName>`).
3. **Diff against §4 spec.** Walk regions defined in `exemplar.structure.regions`; for each region:
   - Compare the spec's required components (§4.x) against the exemplar's components.
   - **Same component, same variant** → leave as-is.
   - **Same component, different variant** → call `instance.setProperties({ ... })` with the variant override.
   - **Different component** → swap: import the spec component, replace via `parent.insertChild(index, newInstance); oldInstance.remove()`.
   - **Spec adds a region not in exemplar** → append to the exemplar's parent region with explicit `appendChild`.
   - **Spec removes a region present in exemplar** → set `visible = false`; never delete (preserves audit traceability).
4. **Apply text overrides** via `textNode.characters = ...`. Never restyle — the underlying type style is owned by the component definition.
5. **Apply visibility / state per §5** ("Inspector State", "Canvas State" columns).
6. **Resize layout containers** only via `resize()` after auto-layout settles. Do not set absolute sizes on auto-layout children.
7. **Send the full payload** to the MCP server. Do **not** pre-chunk by mutation count — MCP handles batching, pagination, retries, and rate limits. React to the server's response (success / chunk-required / retry).
8. **Log the new node ID** and status into brief §8.
9. **Take screenshot** via `get_screenshot`.
10. **Frame 1 only** — halt and ask: *"Does this initial state match? Confirm before I proceed."* No Frame 2+ without explicit ACK.
11. **Frame 2+** — present screenshot, await approval per frame.

## Procedure — compose-from-spec (no exemplar)

Same procedure, except step 1 replaces "clone the anchor" with "create a new top-level frame via `parent.appendChild(figma.createFrame())`" — but **only the top-level frame may be a primitive**. Every child must still come from the components inventory.

---

## Permitted UI-creation methods

| Method | Use for |
|---|---|
| `componentSet.children[i].createInstance()` | Imported component sets — pick the variant by index or by `name` match |
| `component.createInstance()` | Imported singleton components |
| `instance.clone()` | Replicating an already-placed instance with the same overrides |
| `node.clone()` | Cloning a frame including its children (the clone-then-mutate primary tool) |
| `figma.createFrame()` | **Only** for the top-level frame in compose-from-spec mode. Never for nested layout. |

**Forbidden:** `figma.createText()`, `figma.createRectangle()`, `figma.createEllipse()`, `figma.createPolygon()`, `figma.createLine()`. Detaching instances. Rewriting `boundVariables` to literals.

---

## Permitted overrides

- Text content via `characters`.
- Variant property selection via `setProperties`.
- Visibility (`visible = true|false`).
- Resize on auto-layout containers only (never on instances unless the component allows it).
- Image-placeholder fill replacement via `imagePaint` swap on a node whose component definition has an image placeholder.
- State switching (Default / Hover / Active / Disabled / Selected) via the variant property.

## Forbidden overrides

- Detaching nested components.
- Rewriting variable bindings to literal values.
- Restyling fills, strokes, type, radius, or shadow to "fit" a screenshot.
- Inserting raw rectangles or text nodes inside an instance subtree.

---

## Auto-layout rules (every container, no exceptions)

Every `FRAME` or `GROUP` Claude creates or modifies must set, explicitly, all of:

```
layoutMode                  HORIZONTAL | VERTICAL
primaryAxisSizingMode       FIXED | AUTO
counterAxisSizingMode       FIXED | AUTO
itemSpacing                 bound to spacing/* variable
paddingTop / paddingRight / paddingBottom / paddingLeft   bound to spacing/* variable
primaryAxisAlignItems       MIN | CENTER | MAX | SPACE_BETWEEN
counterAxisAlignItems       MIN | CENTER | MAX
```

Absolute positioning (`layoutPositioning = "ABSOLUTE"`) is allowed only for: floating overlays, drag handles, canvas media. Document the reason in brief §8 when used.

---

## Screenshot / reference interpretation

Screenshots provided by the designer (or the pinned exemplar's `screenshot.localPath`) inform: structure, hierarchy, state, flow, content density, relative spacing, interaction intent.

They do **not** authorize: inventing new components, colors, icons, or tokens; restyling for visual fit; bypassing token bindings.

If a screenshot shows a pattern the inventory does not contain, halt and raise as a §7 blocker — do not improvise.

---

## Image / asset rules

- **Components with built-in images or icons** → use the instance, do not rebuild.
- **New images required** → use Figma's image placeholder. If the environment cannot insert the asset, log `manual asset required` in brief §8 and continue.
- **Screenshot-as-asset** → preserve aspect ratio (no stretch), record source and purpose in brief §8.

---

## Figma MCP execution rules

**Permitted operations:** `setCurrentPageAsync`, `createInstance`, `clone`, `appendChild`, `insertChild`, `resize`, `setProperties`, auto-layout API, text override, visibility control, `setBoundVariable`, `importComponentByKeyAsync`, `importComponentSetByKeyAsync`.

**Prohibited operations:** external fetch, unstable remote imports, arbitrary image generation, dependencies on library publishing.

**Environment limitations:** if the MCP cannot complete a required step, halt the frame, log the limitation in §8, and provide the manual-continuation path. Never silently substitute.

---

## Handoff to figma-audit

On Stage 2 completion the build hands forward to `figma-audit`:

- Final node ID for every frame, in brief §8.
- Override log: list of every `setProperties` and visibility override applied.
- Auto-layout decisions: any region where `layoutPositioning=ABSOLUTE` was used, with rationale.
- Items flagged `manual asset required`, `Missing Component`, or `Token Fallback`.
- Pinned exemplar reference (or `none`) — Stage 3 row 14 needs this for perceptual diff.

---

## Failure modes

| Symptom | Action |
|---|---|
| Required component discovered missing mid-build | Stop. Re-enter `figma-inventory`. Do not improvise. |
| Variant property not in component's matrix | Stop. Halt the frame. Raise as §7 blocker. |
| Auto-layout collapses a region (size 0) | Check `primaryAxisSizingMode` / `counterAxisSizingMode`; never paper over with absolute positioning. |
| Exemplar's region is structurally incompatible with spec | Drop to compose-from-spec for that frame only; log the deviation in brief §7 and the exemplar's `knownDeviations`. |
| MCP server rejects payload as too large | Trust the server's chunk-required signal; resend per the server's hint. Do not invent a 12-mutation rule. |

---

## Cross-references (do not restate)

`CLAUDE.md` ONE LAW (§4), Property-binding table (§5a), FALLBACK rules (§FALLBACK), exemplar retrieval (Stage 0a). `refs/README.md` for the reference-frame schema.
