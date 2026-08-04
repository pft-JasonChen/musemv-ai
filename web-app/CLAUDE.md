@AGENTS.md

## In flight — read before starting

**The designer-UI migration is live.** The package landed 2026-08-04 and is vendored at
`../designer-prototype/` (DP). Read in this order:

1. **`docs/redesign-migration-plan.md`** — the **plan of record**. §1 is what was decided and
   why; §2 is scope; §3 is the nine open items; §4 is the phase/slice order. R-1…R-9 and the
   S1–S20 spec differences are **answered here** — earlier documents state them as open.
2. **`docs/UI-INTEGRATION-HANDOFF.md`** — still the best orientation to what the gates catch
   and how the three prototypes differ (§0 and §2). Its §5 decision queue is now closed.
3. `docs/redesign-migration-plan-2026-08-01.md` — background and derivation only. Its §9
   (RD contract C1–C8) and §10 (gates G1–G7) remain in force; its judgements do not.

Phase 0 is complete; **Phase 1 (地基) is next and no component has moved yet.** Two things are
still unproven and are the point of the `/history` spike: whether DP's BEM CSS coexists with
Tailwind (D1/R-1), and the one pattern for DP's 192 SSR-unsafe reads (R-2). Do not migrate a
second screen before both have answers.

## Error log (one line per user correction; fold recurring lessons into an AGENTS.md rule)

- 2026-07-21: a large feature commit (auth/i18n/subscriptions, `79eb1b1`) changed `src/` without
  updating AGENTS.md/README/DEVELOPER-HANDOVER/specs — docs drifted. When changing code, update
  the affected docs in the same change.
