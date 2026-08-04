@AGENTS.md

## In flight — read before starting

- **`docs/UI-INTEGRATION-HANDOFF.md`** — read before touching a component. Merges
  DEVELOPER-HANDOVER (what must survive), the redesign migration plan (phases + gates), and
  the harness work: what now blocks you automatically, the contradictions found between those
  documents, and the **9 research questions (R-1…R-9) that must be answered before any
  designer-UI migration starts**. Parked until the designer's final package lands.

## Error log (one line per user correction; fold recurring lessons into an AGENTS.md rule)

- 2026-07-21: a large feature commit (auth/i18n/subscriptions, `79eb1b1`) changed `src/` without
  updating AGENTS.md/README/DEVELOPER-HANDOVER/specs — docs drifted. When changing code, update
  the affected docs in the same change.
