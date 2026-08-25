# yco-spec Skill Review — 2026-06-30

**Lens:** `/product-management:write-spec` discipline (tight scope, P0/P1/P2, testable acceptance criteria).
**Sample reviewed:** `Project/2026-06-02-v2v-ai-agent` (`spec.html`, `build_spec.py`, `cfg`).
**Reviewer:** Claude, at Jason's request.

---

## Verdict

The skill is in good shape and just got stronger this week: Confluence's dual-source-of-truth problem is gone (the `cfg` dict is now the single source), and the inline RD/QA comment layer makes the deployed spec the one place review happens. The path-storyboard spine, stable IDs (`P1-S2`), screenshot-first cards, behavior-only discipline, and the `validate()` gate are genuinely RD-friendly and hold up well on the V2V sample.

The recommendations below are about **traceability, link integrity, and a rename-proofing fix** — not structural rework.

**Scope boundary (intentional non-goal):** yco-spec is a *behavior* spec for RD/QA, not a PRD. It should **not** grow Problem/Goals/Success-Metrics sections — those belong in `prd.md` upstream. This review respects that line.

---

## P0 — Fix soon

### P0-1. Make `comments_spec_id` stable and rename-proof
**Problem.** The template now keys comments to the feature **folder path** (`comments_spec_id = f'{FEAT}/specs'`, e.g. `Project/2026-06-02-v2v-ai-agent/specs`). Firestore separates each spec's comments by this exact string. If the folder is ever renamed or moved, every existing comment **orphans** — they stay in the database under the old id and silently stop appearing.
**Recommendation.** Use a short, stable slug decoupled from the path (e.g. `'v2v-ai-agent'`), assigned once and never changed. Document it as a permanent identifier in SKILL.md and `cfg-template.py`.
**Acceptance criteria.**
- [ ] Renaming/moving a feature folder does not lose its comments.
- [ ] `cfg-template.py` comment explains: "stable slug, set once, never change after first share."
- [ ] V2V's `comments_spec_id` migrated to a stable slug (with a note that existing test comments under the old path id will not carry over).

### P0-2. Validate internal anchor integrity at build time
**Problem.** The V2V spec is full of in-page cross-links — `#P1-S3`, `#decisions`, `#P1`, `#P2-S1`. A typo'd `href="#..."` produces a dead in-page jump with no error; `validate()` doesn't catch it.
**Recommendation.** Extend `validate(cfg)` to collect every emitted `id` and every internal `href="#x"`, and fail (or warn loudly) on any anchor with no matching target.
**Acceptance criteria.**
- [ ] A `cfg` link to a non-existent step/section id fails the build with a named offender.
- [ ] The V2V spec passes the new check with zero dangling anchors.

---

## P1 — High value, soon after

### P1-1. Document the new `tables` step field
**Problem.** Step-level tables (added 2026-06-30 for P1-S3 / P2 upload-limit matrices) work but are undocumented — a future author won't know the field exists.
**Recommendation.** Add a `tables` example to `cfg-template.py` and a one-line entry in SKILL.md's field list (`tables: [{caption, cols, rows}]`, renders full-width with the shared table styling).
**Acceptance criteria.** Template shows a working `tables` example; SKILL.md lists it among step fields.

### P1-2. Per-step QA traceability
**Problem.** QA lines are collected per *path*, not tied to individual steps, so there's no spec-id → test → Jira matrix. The prior review wanted this; stable step IDs now make it cheap.
**Recommendation.** Give each QA item a stable id (`P1-QA1`) and an optional `covers: ['P1-S5']`. Optionally emit a small traceability table.
**Acceptance criteria.** Each QA item renders an id; a QA item can name the step(s) it verifies; ids are stable across rebuilds.

### P1-3. Print / PDF CSS for the spec body
**Problem.** Specs get shared as `spec-bundled.html` and sometimes printed/PDF'd; tables fracture mid-row and text wraps awkwardly (flagged in the 2026-06-11 review, still open). The comment layer already has `@media print` rules; the spec body does not.
**Recommendation.** Add `@media print` to the builder CSS: `break-inside: avoid` on step cards and table rows, hide nav chrome, keep tables intact.
**Acceptance criteria.** Print preview of a built spec keeps step cards and tables un-fractured and hides the comment toggle/panel.

---

## P2 — Future considerations (design-aware, not now)

- **Export / summarize comments.** A "download open comments (CSV/markdown)" or push-to-Jira action would help at RD handoff. The Firestore schema (`spec_id`, `step_id`, `status`) already supports it.
- **Stronger `cfg` schema validation.** Required-key/type checks with clear messages, so a malformed `cfg` fails with guidance instead of a Python traceback.
- **Comment notifications.** Email/Slack on new or unresolved comments — useful once multiple specs are in active review.
- **Tighten Firestore App Check enforcement** (already tracked separately): flip enforcement on once verified traffic shows.

---

## Already strong — keep as-is

- Single source of truth is now unambiguous (`cfg` → HTML; review via inline comments).
- Stable IDs on paths and steps; behavior-only + English-only enforced by `validate()`.
- Screenshot-first cards, focus frames (action/info), per-path QA checklist, Prototype Simplifications gate.
- Comment layer is on by default via the template and shared across all specs (one Firestore project, separated by `spec_id`).

---

## Suggested order

1. P0-1 (rename-proof spec_id) and P0-2 (anchor validation) — both small, both prevent silent data/link loss.
2. P1-1 (document `tables`) — trivial, closes a docs gap from today's work.
3. P1-2 / P1-3 as capacity allows.
