# Archive

Superseded working documents, kept because they are the **record of how decisions were
reached** — not because anything should be built from them. Archived 2026-08-19, when the
designer-UI migration finished and the spec audit closed out its findings.

**If you are looking for what is true today, go up one level** — `docs/README.md` is the index.

Nothing in here is maintained. Where one of these files disagrees with a current document or
with the code, it is wrong, and the current document wins.

| File                                    | What it was                                                                                                                               | Why it moved                                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `redesign-migration-plan.md`            | The plan of record for porting 17 routes onto the designer UI.                                                                            | **The migration is complete** (17/17 routes, 2026-08-07). Its phase/slice order describes work that no longer exists.               |
| `redesign-migration-plan-2026-08-01.md` | The earlier derivation of that plan.                                                                                                      | Superseded the day after it was written. ⚠️ **Two of its sections are still in force** — see below.                                 |
| `PHASE-3-ACCEPTANCE.md`                 | Acceptance record for Phase 3, including the seven mismatches the product owner found after merge.                                        | The phase is closed. Its lessons were folded into `AGENTS.md` and `CLAUDE.md`.                                                      |
| `UI-INTEGRATION-HANDOFF.md`             | Orientation to the three prototypes and the gate set.                                                                                     | Its §5 decision queue is closed; the durable half lives in `DEVELOPER-HANDOVER.md`.                                                 |
| `NEXT-SESSION.md`                       | Handoff between working sessions during the migration.                                                                                    | There is no next migration session. Its open-items-by-owner table was folded into the spec audit.                                   |
| `handoff-2026-07-23.md`                 | The first handoff, pre-migration.                                                                                                         | Two designer drops and a full migration out of date.                                                                                |
| `song-idea-lyrics-msr.json`             | Candidate MSR (cloud-config) JSON for `/song/create`'s Idea/Lyrics preset content, drafted for RD to evaluate against keeping it in code. | **RD decided build-in (2026-08-25).** `src/lib/mv/songIdeas.ts` stays the source of truth — see specs/areas/03-song-creation.md §3. |

## ⚠️ Two things in here are still binding

`redesign-migration-plan-2026-08-01.md` is archived, but **§9 and §10 are still enforced by
tooling and still bind any change under `web-app/`**:

- **§9 — the RD contract surface `C1`–`C8`.** `scripts/check-rd-changelog.sh` reads this list;
  touching any of those files without a `docs/CHANGELOG-RD.md` entry fails the Stop gate.
- **§10 — gates `G1`–`G7`.** `guard-greps.sh` (G1-b), `build-token-map.mjs` (G2-a),
  `check-designer-css.mjs`, and the e2e suite all cite section numbers from it.

They were left in place rather than copied out: a copied rule is a rule that can go stale
without anyone noticing, which is the failure this whole archive exists to document.
