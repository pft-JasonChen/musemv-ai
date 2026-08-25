# yco-spec — Optimization Review (Dev / QA lens)

**Reviewer:** Senior eng / AI-agent review · **Date:** 2026-06-11
**Scope:** `skills/yco-spec/SKILL.md` + `spec_builder.py`, sample = *AI Hairstyle Generator — Product Page* (`spec.html` + Confluence export).

---

## Verdict

The skill is well above the typical "AI spec" bar. The path-storyboard spine, per-path QA checklist, behavior-only discipline, inline screenshots, and the Confluence round-trip are genuinely good and RD-friendly. The sample reads cleanly and an RD could build most of it.

The gaps that remain are the ones that bite **during build and during QA execution** — traceability, state contracts, the prototype-vs-production boundary, responsive/error coverage, and machine-checkable structure. Those are the high-leverage fixes below.

---

## P0 — Fix first (highest impact on dev/QA)

### 1. No stable IDs → no traceability
Steps are numbered per path (1, 2, 3…), but there is no durable identifier. When QA files a bug or writes an automated test, there is nothing stable to reference, and the skill itself says specs "get edited a lot" — so step 3 today is step 4 tomorrow.

**Fix:** give every path and step a stable ID that never renumbers (`P1`, `P1-S2`, error `E-03`, decision `D-05`). Add a `req_id` field per step in `cfg`. Surface it in both the HTML step header and the Confluence step table. This is the single most valuable change — it unlocks a traceability matrix (spec ID → QA test case → Jira bug).

### 2. Prototype behavior is leaking into the production contract
The sample documents `~3.5s progress (prototype simulation)` and `non-image drop falls back to a placeholder portrait (prototype only)` inline. An RD skimming the step can easily code the *fake* behavior. The real contract (call backend, indeterminate vs determinate progress, timeout, what a real failure looks like) is absent.

**Fix:** add a mandatory **"Prototype simplifications — NOT the production contract"** section (new `cfg['prototype_deltas']` list of `(area, prototype_does, production_must_do)`). Every "prototype only" note moves here with its real-world counterpart spelled out. Make the builder *fail the build* if the string "prototype" appears in a step but no matching delta row exists.

### 3. State machine is implied, never tabulated
The hero has real states — EMPTY → PHOTO_LOADED → STYLE_SELECTED → GENERATING → RESULT, plus the sign-up gate. They're scattered across step prose and the Mermaid edges. An RD implementing this as a state machine has to reverse-engineer the per-state UI contract.

**Fix:** add a **State Inventory** table (`cfg['states']`): state name · entry condition · what's visible/enabled · allowed transitions · exit. The Mermaid shows transitions; this shows the *contract of each state*. Pairs naturally with the flow diagram.

### 4. Responsive behavior is claimed but not specified
Overview says "responsive 1440 / 1024 / 375", but Phase 3 captures **1440 only**, and CLAUDE.md validation mandates **1440 / 1024 / 768** — three different viewport sets across three documents. The storyboard shows desktop only, so reflow/stack behavior and the "canvas ≥ 60% width" rule at mobile are undefined.

**Fix:** (a) reconcile the viewport list across SKILL/CLAUDE/validation to one canonical set. (b) Capture key states at each breakpoint, or add a per-path **Responsive notes** field describing what stacks/hides/reflows. (c) State the mobile behavior of the canvas-width rule explicitly.

### 5. Error & edge coverage is thin for the actual feature
The Error States table is a strong idea but the sample only carries generic rows. For a hairstyle try-on the obvious, high-frequency real cases are missing: **no face detected**, generation/network failure, NSFW/invalid image, and the **insufficient-but-signed-in credit boundary**. The decision table says `<2 credits → open dialog`, but the genuinely tricky case — signed in, 5 credits, selects 3 styles (6 credits) — is undefined (CTA disabled? blocked? error?). That is exactly the boundary QA will hit on day one.

**Fix:** require error coverage for the canonical failure set (auth, payment/credits, input validation, model/inference, network/timeout) and force every numeric limit to state its **boundary behavior** (at, just under, just over).

### 6. The post-signup bridge is missing
Path 1 ends at the sign-up dialog. Path 2 starts "signed-in". The hand-off between them — does the previous photo + style selection persist after signup? does it auto-generate, or return to STYLE_SELECTED? — is not in any storyboard. The Mermaid hints `+5 credits → Signed in` but the UI contract for re-entry is blank. Classic QA gap.

**Fix:** add the re-entry step(s) explicitly, including selection/photo persistence and whether generation auto-resumes.

---

## P1 — Strongly recommended

### 7. Make QA lines executable, not just readable
The per-path QA checklist is good prose but isn't structured for execution: no preconditions/test data, no expected-vs-actual, no severity/priority, no link back to a step ID. QA has to rebuild context each time.

**Fix:** give each QA item `{id, precondition, action, expected, severity, covers:[step_ids]}`. Render as a table. Optionally emit Gherkin (Given/When/Then) so it drops into automation. This also produces the traceability matrix for free.

### 8. Accessibility is mandated but unspecified
CLAUDE.md requires WCAG AA. The spec mentions "Escape or backdrop" once and nothing else — no modal focus trap, tab order, ARIA roles, alt text, or contrast acceptance on the credit-aware CTA. QA can't test a11y against silence.

**Fix:** add an **A11y acceptance** block (focus management, keyboard path, contrast, alt text, reduced-motion for the progress animation). Could be a standard reusable section the builder injects.

### 9. Single source of truth is contradictory → round-trip is brittle
The skill says "Confluence is the source of truth," but the builder's real input is a hand-authored Python `cfg` dict, and the round-trip re-parses Confluence by scraping `[shot: …]` markers and a fixed table shape. A PM merging a cell, reordering rows, or adding a column in Confluence silently breaks the mechanical read-back. Two "sources of truth" that can drift.

**Fix:** make a structured data file (`spec.yaml`/`spec.json`) the *real* canonical source. Generate HTML **and** Confluence storage-format from it. Treat Confluence as a rendered, comment-only surface, or build a schema-validated parser. Pick one master; don't let the cfg and the Confluence page both claim it.

### 10. The builder does no validation — Phase 5 is manual
The build script is hand-written per feature and the builder trusts it completely. Phase 5 asks a human to eyeball broken images, leaked code, and zh-tw.

**Fix:** add a `validate(cfg)` pass that *fails the build* on: missing screenshot files for referenced `shot`s, any CJK characters (regex `[一-鿿]`), DOM-id/JS-looking tokens (`#id`, `camelCase()`, `.className`), a path with zero QA items, a numeric limit with no boundary note, and the prototype-delta rule from #2. Fail fast beats manual review.

---

## P2 — Nice to have

- **Versioning / changelog.** Specs are edited often but there's no human-readable "what changed / when" at the top, and `status` is a single page-level badge. Add a changelog block and optional per-path status.
- **Analytics / telemetry events.** A marketing/conversion page almost certainly needs tracked events (upload, select_style, click_generate, signup_open). Either spec them or state explicitly that they're out of scope.
- **Per-screen Figma reference.** One global Figma node sits in the header; link the specific node per screenshot so RDs can pull redlines/tokens for that exact state.
- **Print / PDF CSS.** The Confluence PDF wraps text mid-word and breaks tables awkwardly (this is how the spec actually got shared for this review). Add `@media print` rules; tables shouldn't fracture across pages.
- **i18n.** Exact on-screen text is English-only — state whether strings are localized (translation keys) or single-locale.

---

## What to keep (don't regress)

Path-storyboard spine + skim strip, behavior-only rule, per-path QA checklist (not per-step), restrained color palette, full-width inline screenshots, session-agnostic screenshot capture (deriving paths from `__file__`), and the dual HTML output (linked + base64 bundled). These are the parts RDs will actually thank you for.

---

## Suggested cfg schema additions (summary)

| New key | Type | Serves |
|---|---|---|
| `req_id` (per path & step) | str | Traceability (#1, #7) |
| `prototype_deltas` | list[(area, proto, prod)] | Contract clarity (#2) |
| `states` | list[(name, entry, visible, transitions, exit)] | State machine (#3) |
| `responsive` (per path) | str/list | Breakpoint behavior (#4) |
| `qa` → dict `{id, precondition, action, expected, severity, covers}` | structured | Executable QA (#7) |
| `a11y` | list | WCAG acceptance (#8) |
| `changelog` | list[(date, change)] | Versioning (P2) |

And a builder-side `validate(cfg)` gate (#10) that runs before any HTML is written.
