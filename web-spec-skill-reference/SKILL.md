# yco-spec — YCO Prototype → Behavior Spec

Turn a validated YCO web prototype into a **path-storyboard behavior spec** for the front-end RD / QA team. The spec is the contract the RD builds production code against — the prototype source itself cannot be reused. Build it by writing a small per-feature `build_spec.py` that imports the shared builder (`skills/yco-spec/spec_builder.py`) and calls `spec_builder.write_specs(cfg)`.

**Hard rules (non-negotiable):**
- **Behavior only.** No code, no DOM IDs, no JS function/variable names. Describe what the user does and what the system shows.
- **English only.** No zh-tw anywhere in the spec. (Enforced by `validate()`.)
- **Path storyboard is the spine.** One section per user journey, opened by a **skim strip** (one line per step, each prefixed with its stable ID) so an RD can grasp the whole flow before drilling in. Each step shows USER / WEB UI, and — only when they carry real information — Input/Output, ON-SCREEN TEXT, and RULES & LIMITS.
- **Open with a Feature block.** `description` (required) — one or two sentences on what the feature is and what the user can do; optional `background` and `goal`. The overview table holds only environment/spec metadata, not the "what is this".
- **Screenshot first, then text.** In each step card the screenshot sits **above** the text (readers look at the image first, then the detail). Input/Output goes at the **bottom** of the card.
- **Label the response row `WEB UI`, not `SYSTEM`** (RDs found "SYSTEM" ambiguous). Configurable via `actor_label`. A step with no screenshot renders its WEB UI response as a readable "On screen" panel, not a faint row.
- **ON-SCREEN TEXT and RULES & LIMITS are bullet lists.** Pass `exact`/`limits` as a `list[str]` so each item is its own bullet — never cram several facts into one line.
- **Stable IDs everywhere.** Every path (`P1`) and step (`P1-S2`, error `P1-E1`) carries a durable ID that never renumbers, so QA and Jira can reference a step that survives edits. IDs auto-derive from `num`; pin one with `req_id`.
- **The USER action is the emphasised line.** It is bold/dark; the WEB UI row and meta lines are quieter. A dev should be able to scan the user actions down the page.
- **Frame the click-to-advance component (two types).** `focus` draws a frame over a component; the label is a **hover-only tooltip** that never covers the UI. Two types: **`action`** (solid red) marks the component the user clicks to move to the *next* flow — always frame this when the screenshot shows one; **`info`** (dashed amber) marks a key value/state/reply to call out. **Passive states** (landing with nothing to click, thinking, processing, generating, result, dialog-internals out of scope) get **no frame**. Focus is discretionary — `validate()` does not warn when a step has none. The frame is drawn with a small outward padding so it surrounds the component rather than overlaying it.
- **Flow Diagram goes first, collapsed.** It sits right after the overview (before the paths) inside a collapsed `<details>` — it orients the reader but, being large, does not push content down by default.
- **No Responsive section.** Spec screenshots are 1440 desktop only; responsive (1024/768) checks belong to the prototype's Stage 3 validation, not the spec.
- **Versioned in place.** Update the same spec; bump `version` + `changelog` (collapsible, at the bottom); mark new content with `since`; archive the superseded full HTML under `specs/_archive/` via `archive_current(cfg)`.
- **Prototype ≠ production.** Never bury a "prototype only / simulation" note inside a step. Every prototype simplification goes in the **Prototype Simplifications** table with its real production counterpart (`prototype_deltas`). The builder fails the build if "prototype" appears in a step and no delta row exists.
- **QA goes in a per-path checklist**, collected at the end of each path — never a tag on every step (it interrupts the flow).
- **Limited colour.** Brand cyan `#03ade2` for structure and links only; red for errors only; everything else neutral grey. Meta labels are quiet grey — never filled chips competing for attention.
- **Full-width inline screenshots** under each step — never thumbnails or lightboxes.
- **Two HTML outputs every time:** `spec.html` (linked screenshots, small + diffable, opened via localhost) and `spec-bundled.html` (base64 self-contained, for email / external share).
- **Inline review comments, on by default.** Every spec ships an RD/QA comment layer anchored to stable step IDs (see "Review comments"). Reviewers comment on the deployed spec itself — there is no separate review tool to keep in sync.
- **Confirm scope before building (mandatory gate).** Never generate spec files straight from the request. First run **grill-me** and confirm scope / paths / decisions with the user (Phase 0). Building is blocked until they approve.
- **Desktop 1440 only.** Spec step screenshots are the 1440px desktop view only — no 1024/768 in the spec. Mobile rules are out of scope until separately defined with the user.

> v1 (section-oriented) and v2 (storyboard) are retired — see `skills/_archive/`. This is the single unified skill. The builder owns **all** rendering — there is no hand-authored HTML template. Copy `cfg-template.py` to start a new `build_spec.py`. (`spec-template.html` is retired and now only a pointer notice.)

**Spec screenshots: 1440px desktop only.** The spec carries the single 1440 view per step. Prototype responsive validation at 1440/1024/768 is a separate Stage 3 concern in `Claude.md` — not part of the spec. Do not embed other widths; mobile is out of scope until defined with the user.

---

## Source of truth & editing model

**The `cfg` dict in `build_spec.py` is the source of truth; the HTML is generated from it.** Never hand-edit `spec.html` — change `cfg` and rebuild. The built spec carries an **inline RD/QA comment layer** (see "Review comments"), so reviewers leave feedback directly on the deployed HTML; there is no external canonical copy to keep in sync.

- **Spec content** changes in `cfg` → rebuild.
- **Review feedback** lives as comments on the deployed spec — anchored to stable step IDs and synced for the whole team, so it survives rebuilds.

---

## When to trigger

- "generate spec", "make the spec", "write the spec", "spec for [feature]"
- After Stage 3 validation is complete and the user asks for the RD handoff doc.

---

## Input files (read in this order)

| File | Read for |
|---|---|
| `Project/<feature>/prd.md` | Feature overview, user stories, scope, out-of-scope |
| `Project/<feature>/plan.md` | Slices + **acceptance criteria** (these become the QA VERIFIES lines) |
| `prototypes/<feature>/index.html` | **Visible UI labels only** — confirm exact on-screen text |
| `Project/<feature>/user-flowchart.svg` | Flow diagram (inlined into the spec) |

> Read `index.html` for visible strings and screen structure. You **may** read `main.js` / other JS to *understand* the flow when the PRD and HTML aren't enough — but nothing implementation-level (DOM IDs, logic, variable/function names) ever enters the spec. Understand from the code; describe only the behavior.

---

## Phase 0 — Confirm scope before building (mandatory gate)

**Never generate spec files straight from the request.** The moment you're asked to build a spec, lock the scope *with the user* first:

1. **Run grill-me.** Load `.claude/skills/grill-me/SKILL.md` and grill the feature — surface every ambiguous UX detail, branch, exact copy string, limit, and edge case (the Phase 2 checklist is the bar).
2. **Confirm with `AskUserQuestion`** before writing any file: which screens/paths are in scope, the target output location, the key design decisions, and viewport scope (**desktop 1440 only** unless the user explicitly asks for mobile — mobile rules are defined separately, with the user).
3. **Build is blocked until the user approves.** Only after they confirm do you proceed to Phase 1+ and write files. If core UX questions remain unanswered, output the open list and **stop** (same halt rule as Phase 2).

> This gate exists because specs were being generated immediately on request, before scope was confirmed. Confirm first, build second.

---

## Phase 1 — Read & extract user paths

1. Read `prd.md` and `plan.md` in full; skim `index.html` for exact button/label/message text.
2. List every distinct **user path** — one complete journey from entry point to outcome. Give each a short name and one-line description. Order happy path first, then variants, then error/edge paths.
3. For each path, list its **steps** in order. A step = one discrete user action with a visible system result. For each step capture: the user action, the system response, input, output, exact on-screen text, the numeric rules/limits that apply, and a pass/fail QA line lifted from the matching `plan.md` acceptance criterion.
4. **Page sections (product / marketing pages only):** if the prototype is a static SEO/marketing page rather than a pure flow app, also list each static section (hero, features, FAQ, etc.) with a one-line purpose. Omit entirely for flow-only apps.
5. **States:** list every distinct screen state (e.g. EMPTY → LOADED → GENERATING → RESULT) with its entry condition, what's visible/enabled, allowed transitions, and exit — this becomes the **State Inventory** (`states`).
6. **Prototype simplifications:** note everything the prototype fakes or stubs (simulated timers, canned results, mock auth, placeholder fallbacks). Each becomes a `prototype_deltas` row with its real production behaviour — never an inline step note.
7. **Hand-offs:** where one path ends and another begins (e.g. anonymous → signed-in), capture what persists and whether anything auto-resumes — this becomes the path `bridge`.

---

## Phase 2 — Clarification gate (act as a senior engineer)

**This is a gate, not a quick pass.** A spec with an unanswered UX question ships that question to every RD, who then asks it and the spec gets edited again and again. Your job here is to ask everything a sharp senior engineer would ask **now**, so the spec needs no clarifying round later.

**The bar:** *Could an RD build every screen and transition from this spec without asking a single question?* If not, you are not done asking.

**How to run it:**
1. Compare `prd.md` against what `index.html` actually shows, and walk every path/step from Phase 1.
2. Enumerate **every** unknown against this checklist — do not stop at 5 questions; ask in as many `AskUserQuestion` rounds as it takes:
   - **Entry conditions** — what state/permissions/data must exist before each path starts?
   - **Every transition** — the exact trigger for each state change, and what the user sees mid-transition (loading / disabled / skeleton)?
   - **Every branch** — each condition spelled out, both/all sides, no implicit "else"?
   - **Exact copy** — every label, button, toast, confirmation, empty-state and error message, verbatim?
   - **Limits & validation** — concrete numbers (sizes, durations, counts, credit math) and what happens at each boundary?
   - **Errors & recovery** — trigger, exact message, recovery action, and refund/rollback for each failure?
   - **Edge & empty states** — no data, max data, slow network, mid-flow abandon/return, back / cancel / dismiss, re-entry?
   - **Gating** — what is allowed vs blocked while busy/locked/logged-out, and what unlocks it?
3. Track answers; re-ask anything still fuzzy. Borderline items become rows in the **Open Questions** handling — but a question about **how the UX behaves** is never "open", it must be resolved.

**Halt rule:** if core UX-flow questions remain unanswered after asking, **do not generate the spec.** Output the unresolved list and stop. A spec built on guesses is worse than no spec.

Record every resolved decision as a row for the **Design Decisions** table (`decisions` in cfg), each with a stable ID (`D-01`, `D-02`, …) so steps and bridges can reference it. Example: `('D-01', 'Confirmation before generation?', 'No confirmation when credits are sufficient; processing starts immediately.')`. A decision a step depends on (e.g. a credit boundary) should cite its ID in the step's `limits`.

---

## Phase 3 — Screenshots

1. **Confirm the server is reachable.** Hit `http://localhost:8000` (Chrome MCP). If unreachable, tell the user to run `./start-server.sh` and **stop** — do not screenshot from the Linux sandbox and never use `file://`.
2. Drive the prototype through **every state** in every path (and one capture per page section). Capture at **1440px** wide (desktop) only — the spec carries the 1440 view. Do not capture or embed 1024/768 screens in the spec (the per-path `responsive` field is deprecated).
3. Save PNGs to `Project/<feature>/specs/screenshots/` named `NN_name.png` (e.g. `03_trim_dialog.png`). The `NN_name.png` filename is exactly what each step's `shot` key references.

**Driving states (important).** Do not pixel-click the OS file picker — it cannot be automated. Most prototypes expose global state functions (e.g. `showState(...)`, `showResult(...)`) or accept state via the browser JS console. Prefer the JS console / global functions to jump straight to each state, then screenshot — driving JS for capture is fine; JS detail still never enters the spec text.

**Measure focus boxes while capturing.** In the same state, before/after each shot, measure the user-action element's bounding box relative to the captured container and append it to `specs/focus.json`. The builder applies it automatically (see the `focus` note in Phase 4). This is the only reliable way to make the red box match the screenshot exactly — never hand-tune percentages for a final spec.

**Reproducibility — capture once, never redo.** Screenshots get needlessly recaptured when capture tooling breaks across sessions. Prevent it:
- Put capture in `Project/<feature>/capture_screenshots.py` — **flow logic only**, built on the shared harness `skills/yco-spec/capture_lib.py` (`from capture_lib import Capture`, async context manager). The lib owns env/browser bootstrap, the throwaway server on an auto-picked free port, `shot()`/`focus()`, focus.json output, and console-error collection. Never copy that boilerplate back into a feature script, never hardcode a port. Exemplar: `Project/2026-05-20-support-chatbot/capture_screenshots.py`.
- **Derive every path from `__file__`** — never hardcode `/sessions/<name>/mnt/…`; that mount name changes each session and is the #1 cause of re-runs.
- **Persist the browser binary in-repo** so it downloads once, not per session (the lib sets `PLAYWRIGHT_BROWSERS_PATH` to `.tools/ms-playwright` before importing Playwright).
- **Commit the PNGs** in `specs/screenshots/`. Once captured they are reused by every build; recapture only when the UI actually changes.
- Don't rely on the Chrome MCP `save_to_disk` for spec screenshots — it doesn't reliably persist. Use the Playwright capture script.

---

## Phase 4 — Build

Write a small per-feature `build_spec.py` in the feature's `Project/<feature>/` folder. It imports the shared builder, defines one `cfg` dict, and calls `spec_builder.write_specs(cfg)`. Do **not** copy the builder's CSS or HTML — the builder owns all rendering.

### cfg schema

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

**Each step dict:** `shot` (`NN_name.png` filename, rendered **above** the text; or empty string for a no-screenshot continuation step), `num` (step number — stable ID auto-derives as `P{p}-S{num}`, or `P{p}-E{num}` when `role='error'`), `user` (user action — **the emphasised line**), `system` (the WEB-UI response), `inp` (Input), `out` (Output), `exact` (ON-SCREEN TEXT — str **or `list[str]` for bullets**, exact quoted strings), `limits` (RULES & LIMITS — str or `list[str]`; **state the boundary behaviour** at/just-under/just-over each number), `focus` (optional list of `{box:[x,y,w,h] in %, label?}` red-box overlays on the screenshot), `qa` (pass/fail line from `plan.md`), `role` (`'user'` default, or `'error'`), `since` (optional "NEW · vN" badge), `req_id` (optional ID override), `summary` (optional short line for the skim strip — defaults to `user`), `tables` (optional `dict` or `list[dict]` of `{caption?, cols, rows}` — full-width tables rendered after RULES & LIMITS using the spec's shared table styling; use for matrices like upload-limit grids or selection-rule tables, e.g. V2V P1-S3 / P2-S1).

> Rendering notes: `inp`/`out`, `exact`, and `limits` are **shown only when non-empty** — leave them blank on trivial steps to keep the card light. `qa` is **not** shown on the step; the builder gathers every step's `qa` into one **per-path QA checklist** at the end of the path.

**Each error tuple:** `(name, trigger, message, recovery, refund)`. Cover the canonical failure set: auth, payment/credits (incl. the signed-in-but-insufficient boundary), input validation, model/inference, network/timeout.
**Each state tuple:** `(name, entry condition, visible/enabled, transitions, exit)`.
**Each prototype_delta tuple:** `(area, prototype_does, production_must_do)`.
**Each decision tuple:** `(id, question, decision)` (preferred) or `(question, decision)`.
**Each changelog tuple:** `(version, date, what_changed)`, newest first.
**Each page_section dict:** `shot`, `name`, `purpose`.

**`focus` (screenshot annotation).** `focus` is a list of `{'box':[x,y,w,h], 'type':'action'|'info', 'label':'...'}` where `x,y,w,h` are **percent of the screenshot** (0–100, the true component bounds — do not pre-pad). The builder draws the frame as an HTML overlay on top of the image — not baked into the PNG, works in both linked and bundled output, tuned without recapturing. `type` defaults to `action` (**solid red** — the click that advances the flow); use `info` (**dashed amber**) for a key point to note. The label is a **hover-only tooltip**. The builder adds a fixed **outward padding** (`FOCUS_PAD_PX`, ~6px) so the frame surrounds the component, not overlays it. **Add one only when the screenshot shows a click-to-advance component (action) or a key value (info); passive states (landing/thinking/processing/generating/result, dialog-internals) get none.** `validate()` does not warn about missing focus.

**Get the box EXACTLY right — measure, don't eyeball.** Hand-estimated percentages drift (boxes land on the wrong panel or off the target). Because each shot is an *element screenshot*, the screenshot's coordinate space is that element's box, so the same engine that captures the PNG can measure the target in the same space. `capture_screenshots.py` does this: for each shot it records the user-action element's `getBoundingClientRect`/`bounding_box()` as a percentage of the captured container and writes `specs/focus.json` (`{shot: [{box,label}]}`). The builder auto-loads `focus.json` and it **overrides** the manual `focus` in the build script (which is just the offline fallback). So the box matches pixel-for-pixel by construction. A step can opt out of the override with `focus_lock: True`. Re-run `capture_screenshots.py` whenever the prototype layout changes.

> Use HTML entities in strings (`&ldquo; &rdquo;` for quotes, `&rarr;`, `&middot;`, `&mdash;`, `&ge;`, `&le;`) — the builder injects these verbatim.

### Copyable skeleton

The authoritative, fully-commented skeleton is **`skills/yco-spec/cfg-template.py`**. Copy it to `Project/<feature>/build_spec.py` and fill it in. It already has the session-agnostic path header (derive from `__file__`, never hardcode `/sessions/<name>/…`) and every optional section stubbed. The richest worked example is `Project/2026-05-30-ai-hairstyle-product-page/build_spec.py` (the exemplar — exercises states, prototype_deltas, responsive, real errors, a post-signup bridge, and ID'd decisions).

Run it: `python3 build_spec.py`. `write_specs(cfg)` runs `validate(cfg)` first, then writes both files into `out_dir`:
- `spec.html` — screenshots **linked** as `screenshots/NN_name.png` (small, diffable; open via localhost).
- `spec-bundled.html` — screenshots **base64-embedded** (self-contained, for email / external share).

Pass `linked_only=True` for only `spec.html`, or `skip_validate=True` to bypass the gate (not recommended).

**Validation gate (`validate(cfg)`).** Hard-fails the build (no HTML written) on: CJK characters in any step text; a referenced `shot` file that doesn't exist; a path with zero QA lines; or the word "prototype" in a step when no `prototype_deltas` row exists. It prints (does not fail on) likely code/DOM tokens. This replaces most of the manual Phase 5 eyeballing.

The builder auto-emits, in order: header → **Feature block** (description + optional background/goal) → "Reading this spec" callout → overview card → **Flow Diagram** (collapsed `<details>`, SVG + Mermaid) → "All User Paths" table → path storyboards (each = skim strip → step cards `screenshot (with focus) → USER/WEB UI → bullet ON-SCREEN TEXT & RULES → Input/Output` → **per-path QA checklist** → optional `bridge` connector) → Page Sections → State Inventory → Error States → Prototype Simplifications → Design Decisions → **Changelog** (if any). Sections with no data are omitted. There is no Responsive section and no RD Review section. You do not hand-write any of these sections.

### Extending a spec later (versioning)

Specs are updated **in place** — one living doc, not a new file per change:
1. Before a meaningful change, call `spec_builder.archive_current(cfg)` to copy the current `spec.html` / `spec-bundled.html` into `specs/_archive/spec-<version>-<date>.html`.
2. Edit the `cfg`, bump `version`, and prepend a `changelog` row describing what changed.
3. Mark genuinely new paths/steps with `since: '<version>'` so they show a green "NEW · vN" badge; the Changelog at the bottom is the findable history.
4. Re-run `build_spec.py`. Review comments persist across rebuilds — they're anchored to stable step IDs in Firestore, independent of the regenerated HTML.
5. Optionally call `spec_builder.version_diff(cfg)` after rebuilding to print which path/step IDs were **added/removed** vs the last archived `spec.html` — a quick check that the changelog matches what actually changed.

---

## Phase 5 — Verify

`validate(cfg)` already gates CJK, missing screenshots, no-QA paths, and prototype leaks at build time — so this phase is the **visual** pass it can't do.

1. Open `spec.html` via **localhost** in Chrome. The local server serves the **repo root** (see `tools/com.yco.prototype-server.plist` → WorkingDirectory), so the URL is `http://localhost:8000/Project/<feature>/specs/spec.html`. If unsure of the root, open `http://localhost:8000/` and read the directory listing.
2. Confirm every screenshot loads (no broken images), the sidebar nav anchors jump correctly, and no step layout is broken.
3. Judge the hierarchy like a reader: the USER action should clearly stand out from SYSTEM; cards should not be cluttered with competing labels; each path→path hand-off should read clearly (the `bridge` note).
4. Spot-check that QA lines, on-screen text, and limits read as behavior — no leaked code, IDs, or zh-tw.
5. Check both file sizes from the build output (`spec.html` small; `spec-bundled.html` larger — confirms base64 embedded).

---

## Phase 6 — Review comments (shipped automatically)

Every built spec includes an inline **RD/QA comment layer** (`shared/yco-comments.js`, injected by the builder when `comments_enabled` is set). It is **on by default** — `cfg-template.py` sets `comments_enabled: True`, and the shared Firebase backend (incl. the App Check site key) is read **centrally from `agent.config.json` → `firebase`**, so a spec ships it with no extra config. Each spec sets only its own `comments_spec_id`. Reviewers highlight **any** content (steps, decisions, states, …) to comment, so there is no second canonical copy to maintain.

- Reviewers click **+ Comment** on any step (or select text) to open a thread; PM / RD / QA / Design / MM / Marcom identify themselves once (name + dept) and reply. A right-side panel lists all threads with filters, resolve, and an activity log.
- **Identity is requested lazily — never on load.** The &ldquo;Who&rsquo;s reviewing?&rdquo; dialog does **not** appear when someone merely opens the spec (most readers never comment, so an on-open prompt was needlessly blocking). It appears only the first time a user **creates, edits, deletes, resolves, or reopens** a comment; after they enter name + dept once (stored on-device), the pending action resumes automatically. Read-only viewing never prompts. Implemented via `_withIdentity(fn)` in `shared/yco-comments.js`; there is no auto-show in `init()`.
- Threads **sync via Firestore**, so the whole team sees the same comments on the deployed spec (or on `spec-bundled.html`, which loads the SDK from CDN).
- The only per-spec value is **`comments_spec_id`** — keep it unique (the template uses the spec's folder path) so different specs never share threads. One Firestore project holds every spec's comments, separated by this field.
- Backend: Firestore project `yco-spec-comment`, protected by structured security rules + **App Check** (reCAPTCHA v3). The web `apiKey` and reCAPTCHA site key are public client identifiers — safe to commit.
- **Sharing a spec = sharing its deployed URL** (Vercel) or `spec-bundled.html`. There is no publish step.

---

## Language rules

- English only. Short sentences (≤ 20 words). Active voice: "User taps Send" not "Send is tapped".
- Quote exact UI text in `exact`/error messages (`&ldquo;Use Video&rdquo;`). State names are plain phrases ("processing state") — never code formatting.
- `RULES & LIMITS` are concrete numbers: durations (5–60s), sizes (≤ 200MB), resolution caps (long side ≤ 1920px), credit math (rate × seconds), retention (30 days).
- `QA VERIFIES` is one pass/fail sentence an RD can test, drawn from a `plan.md` acceptance criterion.
- No idioms, no jargon, no implementation language.

---

## Engine changes (DoD for editing spec_builder.py / capture_lib.py)

Any edit to `spec_builder.py` or `capture_lib.py` must pass the regression suite
before it counts as done:

```bash
/usr/bin/python3 -m unittest discover -s skills/yco-spec/tests -v
```

The suite covers every `validate()` gate branch, the focus.json merge rules
(measured box overrides, manual `type`/`label` preserved, `focus_lock`, stale-key
warning), and a **golden HTML snapshot** (`tests/golden/spec.html`). If a rendering
change is intentional, regenerate with `REGEN_GOLDEN=1`, review the golden diff in
git, and commit it together with the change.

**Spec CSS lives in `skills/yco-spec/spec-styles.css`** (externalized 2026-07-19),
not in a Python string — edit that file to change spec styling. The builder inlines
it into every spec's `<style>`; the golden snapshot guards byte-identical output, so
a CSS edit that shifts any byte will fail the suite until you regenerate the golden.

## Output

Confirm: `[Spec: DONE — Project/<feature>/specs/spec.html]` (cite both file paths). The spec ships with the inline comment layer, so share the deployed URL (or `spec-bundled.html`) with RD/QA for review — no publish step needed.

**Open comments before sign-off.** Review threads live on the deployed spec (the panel header shows the open count). When re-confirming a spec as DONE after a review round, don't treat it as closed while comments are still open — surface that there are unresolved threads and confirm with the user whether to address them first.
