# cfg schema — the complete reference

`build_spec.py` defines one `cfg` dict and calls `spec_builder.write_specs(cfg)`.
This file is the full field reference; `SKILL.md` carries only the rules you must
not break. The copyable skeleton is `cfg-template.py`.

---

## Top-level keys

Top-level keys:

| Key | Type | Notes |
|---|---|---|
| `feature_name` | str | Spec title (e.g. "AI Agent — Video-to-Video (V2V)") |
| `breadcrumb` | str | e.g. "YCO Online Service → AI Agent" |
| `author`, `date`, `status` | str | Header meta; `status` shows as a badge (e.g. "Review") |
| `version` | str | Optional version shown in header (e.g. "v2"); pair with `changelog` |
| `actor_label` | str | Optional label for the response row; defaults to `WEB UI` (was `SYSTEM`) |
| `prototype_url` | str | Linked from the header. Production prefix is `https://yco-prototypes.vercel.app/` (not localhost) |
| `guideline` | str | Design guideline URL, openable from the header; empty/omitted shows "TBD" on hover (replaces the old `figma`) |
| `description` | str | **Feature description (required)** — what the feature is; renders as the top Feature block |
| `background` | str | Optional — why it exists / where it lives |
| `goal` | str | Optional — the outcome it drives |
| `overview` | list[[label, value]] | Rows of the overview card (Platform, Engines, Scope, Audience, …) |
| `callout` | str | Optional; defaults to the standard "Reading this spec" intro |
| `page_sections` | list[dict] | Optional; omit for flow-only apps (see below) |
| `states` | list[tuple] | Optional **State Inventory** — `(name, entry, visible/enabled, transitions, exit)` |
| `errors` | list[tuple] | Error States table (see below) |
| `errors_last_col` | str | Header of the Error States table's 5th column. Defaults to `Refund?`. A feature that spends no credits has no refund to report — set it to `Where` and put the step ID (`P1-E1`, `P2-S4`) in each row's 5th slot; the builder turns those into jump links like any other cross-reference (see `2026-05-20-support-chatbot`) |
| `errors_note` | str | Optional line under the Error States table. Put anything that holds for **every** row here — never repeat it in each row's cell |
| `spec_kind` | str | `'storyboard'` (default) or `'data-contract'`. Selects which gates apply — see **Spec kinds** below. An unknown value fails the build |
| `context_shot` | dict | `{shot, caption?, alt?, focus?}` — one screenshot showing *where* the spec's subject surfaces in the product, rendered at the top of the Data Contract section. Same `shot`/`focus` shape as a step, so `focus.json` measurement and the numbered-frame legend apply. Requires `screenshots_dir`; a missing file fails the build like any other screenshot |
| `data_contract` | dict | **Data Contract** section — `{intro?, schemas:[…], tables:[{caption, cols, rows}], engine_only?, no_ui?, reverse:[(ui_element, source_key)], payloads:[abs_path], redact?}`. Captions opening `T1 &middot; …` anchor themselves, in `schemas` and `tables` alike. Embedded payloads are **redacted** (prompt values replaced, keys kept) because the bundle is shared externally |
| ↳ `schemas` | list[dict] | `{caption, json, fields:[(key, type, desc)], note?}` — a JSON sample with its keys documented underneath, API-doc style. `json` is a raw JSON string or a dict/list (dumped for you); the builder does the syntax highlighting, so never hand-author `<span>`s. `type` may be omitted: a 2-tuple is `(key, desc)`. **Choose by what the contract is:** `schemas` when it is the payload's *shape* (nesting, arrays — a flat table cannot show either), `tables` when it is per-key render rules (allowed values, missing/null behaviour). A spec may use both |
| ↳ `engine_only` | dict | `{id?, label?, keys:[str], why:str}` — keys that must never reach the UI, rendered as one note rather than a table. `id` defaults to `T4`, so steps can cite `T4` and the cross-reference resolves |
| ↳ `no_ui` | list[(str, str)] | `(key, why)` — keys the payload carries that render nothing. Same purpose as `engine_only`, different reason: not secret, just inert |
| `open_questions` | list[tuple] | **Open Questions** — `(id, question, blocks, owner)`. Only genuinely undecided items. A settled answer belongs beside the rule it governs |
| `criteria` | list[tuple] | **QA Coverage** — `(id, criterion_text, [step_ids], reason?)`. One row per `plan.md` acceptance criterion, mapped to the step(s) that specify it. Supersedes the per-step `qa` prose |
| `data_contract_ignore` | list[str] | Key paths (or leaf names) in the sample payload that are deliberately outside the data contract, e.g. `createdTime`. Read by `lint_spec.py` |
| `prototype_src` | str \| list[str] | Path(s) to the prototype the spec describes (dir or file; `temp/` skipped). Enables the `lint_spec.py` **STRINGS** check, which verifies every string quoted in `exact` actually appears on screen. Set it — a quoted string nobody checked is how an invented label ships |
| `strings_ignore` | list[str] | Quoted strings the STRINGS check should pass: production-only copy, or copy belonging to a sibling prototype. Each entry is a deliberate exception, so record why in a comment |
| `prototype_deltas` | list[tuple] | Optional **Prototype Simplifications** — `(area, prototype_does, production_must_do)` |
| `decisions` | list[tuple] | Design Decisions table — `(id, question, decision)` (3-tuple, preferred) or `(question, decision)` |
| `changelog` | list[tuple] | Optional **Changelog** (collapsible, bottom) — `(version, date, what_changed)`, newest first |
| `mermaid` | str | Copyable Mermaid source block (rendered under the SVG) |
| `svg_path` | str | Absolute path to `user-flowchart.svg` — inlined into Flow Diagram |
| `screenshots_dir` | str | Absolute path to `specs/screenshots/` |
| `out_dir` | str | Absolute path to `specs/` (where both HTML files are written) |
| `short_nav` | list[str] | Optional short sidebar labels, one per path |
| `paths` | list[dict] | The storyboards (see below) — **the spine** |

**Each path dict:** `id` (anchor slug — `req_id` auto-derives as `P{num}`), `num` (int), `name`, `desc`, `entry` (entry point, shown in overview table), `outcome` (shown in overview table), `responsive` (optional per-path reflow note, rendered under the desc), `tail` (optional HTML appended after the steps), `bridge` (optional hand-off note to the next path — persistence, auto-resume, re-entry — rendered as a dashed connector), `since` (optional — green "NEW · vN" badge), `steps` (list).

**Each step dict:** `shot` (`NN_name.png` filename, rendered **above** the text; or empty string for a no-screenshot continuation step), `num` (step number — stable ID auto-derives as `P{p}-S{num}`, or `P{p}-E{num}` when `role='error'`), `user` (user action — **the emphasised line**), `system` (the WEB-UI response), `inp` (Input), `out` (Output), `exact` (ON-SCREEN TEXT — str **or `list[str]` for bullets**, exact quoted strings), `limits` (RULES & LIMITS — str or `list[str]`; **state the boundary behaviour** at/just-under/just-over each number), `focus` (optional list of `{box:[x,y,w,h] in %, type?, label?}` frame overlays on the screenshot), `role` (`'user'` default, or `'error'`), `since` (optional "NEW · vN" badge), `req_id` (optional ID override), `summary` (optional short line for the skim strip — defaults to `user`), `tables` (optional `dict` or `list[dict]` of `{caption?, cols, rows}` — full-width tables rendered after RULES & LIMITS using the spec's shared table styling; use for matrices like upload-limit grids or selection-rule tables, e.g. V2V P1-S3 / P2-S1).

> Rendering notes: `inp`/`out`, `exact`, and `limits` are **shown only when non-empty** — leave them blank on trivial steps to keep the card light. `inp` and `out` render independently, so a step with output but no meaningful input shows only `Output:` — never `Input: —`. `qa` is **not** shown on the step; `qa` is superseded by `criteria` — with a coverage table present, per-step `qa` is dead data.

**Each data-contract table:** same `{caption, cols, rows}` shape as a step table, so a table moves between a step and the section unchanged. Use five columns: key path &middot; allowed values &middot; example value &middot; renders as &middot; missing/null/unknown. Enumerate every finite value set; say what happens when the key is absent — `OPEN` is an acceptable answer, and it belongs in `open_questions` too.
**Each open question tuple:** `(id, question, what_it_blocks, owner)`.
**Each error tuple:** `(name, trigger, message, recovery, last)` — the 5th slot is whatever `errors_last_col` names, `Refund?` by default. Cover the canonical failure set: auth, payment/credits (incl. the signed-in-but-insufficient boundary), input validation, model/inference, network/timeout.
**Each state tuple:** `(name, entry condition, visible/enabled, transitions, exit)`.
**Each prototype_delta tuple:** `(area, prototype_does, production_must_do)`.
**Each decision tuple:** `(id, question, decision)` (preferred) or `(question, decision)`.
**Each changelog tuple:** `(version, date, what_changed)`, newest first.
**Each page_section dict:** `shot`, `name`, `purpose`.

**`focus` (screenshot annotation).** `focus` is a list of `{'box':[x,y,w,h], 'type':'action'|'info', 'label':'...'}` where `x,y,w,h` are **percent of the screenshot** (0–100, the true component bounds — do not pre-pad). The builder draws the frame as an HTML overlay on top of the image — not baked into the PNG, works in both linked and bundled output, tuned without recapturing. `type` defaults to `action` (**solid red** — the click that advances the flow); use `info` (**dashed amber**) for a key point to note. Each frame renders a permanent number badge; the label appears in a legend under the screenshot. The builder adds a fixed **outward padding** (`FOCUS_PAD_PX`, ~6px) so the frame surrounds the component, not overlays it. **Add one only when the screenshot shows a click-to-advance component (action) or a key value (info); passive states (landing/thinking/processing/generating/result, dialog-internals) get none.** `validate()` does not warn about missing focus.

**Get the box EXACTLY right — measure, don't eyeball.** Hand-estimated percentages drift (boxes land on the wrong panel or off the target). Because each shot is an *element screenshot*, the screenshot's coordinate space is that element's box, so the same engine that captures the PNG can measure the target in the same space. `capture_screenshots.py` does this: for each shot it records the user-action element's `getBoundingClientRect`/`bounding_box()` as a percentage of the captured container and writes `specs/focus.json` (`{shot: [{box,label}]}`). The builder auto-loads `focus.json` and it **overrides** the manual `focus` in the build script (which is just the offline fallback). So the box matches pixel-for-pixel by construction. A step can opt out of the override with `focus_lock: True`. Re-run `capture_screenshots.py` whenever the prototype layout changes.

> Use HTML entities in strings (`&ldquo; &rdquo;` for quotes, `&rarr;`, `&middot;`, `&mdash;`, `&ge;`, `&le;`) — the builder injects these verbatim.

## Spec kinds

`spec_kind` picks which gates `validate()` runs. There are two, and the second is
a **replacement** of the first's gates, never a way to switch validation off.

| | `'storyboard'` (default) | `'data-contract'` |
|---|---|---|
| Subject | a user journey | a payload mapping |
| `paths` | **required**, ≥ 1 | not required (no screens to walk) |
| flowchart (`svg_path`) | **required**, version-stamped | not required — but still version-checked if you supply one |
| `screenshots_dir` | **required** | not required |
| `data_contract` | optional | **required**, with ≥ 1 `schemas` or `tables` entry |
| `criteria` | optional (falls back to per-step `qa` prose) | **required** |
| criterion targets | `Pn-Sn` step IDs | `Tn` block IDs (both kinds accept either) |

**Why the swap, not a waiver.** Drop `paths` and the flowchart and you also drop
everything that made the document checkable: the storyboard was the content and
the per-path QA prose was the traceability. A flag that removed three gates and
asked for nothing back would be an unvalidated document with a config key in
front of it — and this skill's whole position is that a spec built on guesses is
worse than no spec. So a data-contract spec must say what the payloads are
(`data_contract`) and must map every acceptance criterion to the block that
specifies it (`criteria`). Same bar, different shape.

**What a data-contract spec renders.** Header → Feature block → callout (a
data-contract-specific one; the default promises step cards that do not exist) →
overview → Data Contract (with `context_shot` first, if set) → State Inventory →
Open Questions → QA Coverage → Error States → Design Decisions → Changelog. The
empty *All User Paths* index and *Flow Diagram* accordion are omitted entirely,
along with their sidebar links — an empty section reads as a spec that forgot its
content. Worked example: `Project/2026-08-18-credit-usage-description-msr/build_spec.py`.

### Copyable skeleton

The authoritative, fully-commented skeleton is **`skills/yco-spec/cfg-template.py`**. Copy it to `Project/<feature>/build_spec.py` and fill it in. It already has the session-agnostic path header (derive from `__file__`, never hardcode `/sessions/<name>/…`) and every optional section stubbed. The richest worked example is `Project/2026-05-30-ai-hairstyle-product-page/build_spec.py` (the exemplar — exercises states, prototype_deltas, responsive, real errors, a post-signup bridge, and ID'd decisions).

Run it: `python3 build_spec.py`. `write_specs(cfg)` runs `validate(cfg)` first, then writes both files into `out_dir`:
- `spec.html` — screenshots **linked** as `screenshots/NN_name.png` (small, diffable; open via localhost).
- `spec-bundled.html` — screenshots **base64-embedded** (self-contained, for email / external share). Raster screenshots are re-encoded to WebP and capped at `BUNDLE_MAX_PX` (2x the rendered width) for the bundle only, which keeps it roughly 10x smaller than raw-PNG base64. `spec.html` still links the original PNGs.

Pass `linked_only=True` for only `spec.html`, or `skip_validate=True` to bypass the gate (not recommended).

**Validation gate (`validate(cfg)`).** Hard-fails the build (no HTML written) on: CJK characters in any step text; a referenced `shot` file that doesn't exist; a cross-reference (`D-xx` / `Pn-Sn` / `Tn`) the spec never defines; a criterion pointing at a step that doesn't exist, or mapping to no step without a reason; a path with zero QA lines (only when `criteria` is unset); or the word "prototype" in a step when no `prototype_deltas` row exists. It prints (does not fail on) likely code/DOM tokens. This replaces most of the manual Phase 5 eyeballing.

Section order — see SKILL.md Phase 4. The builder auto-emits, in order: header → **Feature block** (description + optional background/goal) → "Reading this spec" callout → overview card → **Flow Diagram** (collapsed `<details>`, SVG + Mermaid) → "All User Paths" table → path storyboards (each = skim strip → step cards `screenshot (with focus) → USER/WEB UI → bullet ON-SCREEN TEXT & RULES → Input/Output` → **per-path QA checklist** → optional `bridge` connector) → Page Sections → State Inventory → Error States → Prototype Simplifications → Design Decisions → **Changelog** (if any). Sections with no data are omitted. There is no Responsive section and no RD Review section. You do not hand-write any of these sections.

---

## Extending a spec later (versioning)

Specs are updated **in place** — one living doc, not a new file per change:
1. Before a meaningful change, call `spec_builder.archive_current(cfg)` to copy the current `spec.html` / `spec-bundled.html` into `specs/_archive/spec-<version>-<date>.html`.
2. Edit the `cfg`, bump `version`, and prepend a `changelog` row describing what changed.
3. Mark genuinely new paths/steps with `since: '<version>'` so they show a green "NEW · vN" badge; the Changelog at the bottom is the findable history.
4. Re-run `build_spec.py`. Review comments persist across rebuilds — they're anchored to stable step IDs in Firestore, independent of the regenerated HTML.
5. Optionally call `spec_builder.version_diff(cfg)` after rebuilding to print which path/step IDs were **added/removed** vs the last archived `spec.html` — a quick check that the changelog matches what actually changed.
