# yco-spec evals

Does this skill actually make the agent better, or does it just look like it?

The shape follows [skill-forge](https://github.com/neokn/skill-forge): a tier
pyramid from cheap-and-static to expensive-and-behavioural, and one rule above
all the others — **measure the delta, never the absolute**. A spec this skill
produces looks professional whether or not the skill was loaded. Only a paired
`with_skill` / `without_skill` run tells you which part the skill contributed.

```
Tier 0  static      seconds       always            validate_skill.py, unit tests, lint --strict
Tier 1  trigger     minutes       on description change   20 queries, half near-misses
Tier 2  behaviour   subagent      on SKILL.md change      E1 asking / E2 building / E3 updating
Tier 3  pressure    subagent      on hard-rule change     designed in the runbook, deferred one round
```

---

## Run Tier 0 now

```bash
python3 skills/yco-spec/evals/validate_skill.py skills/yco-spec
/usr/bin/python3 -m unittest discover -s skills/yco-spec/tests
python3 skills/yco-spec/lint_spec.py Project/2026-07-03-template-spec --strict
```

Zero FAILs required. Warnings get investigated, not dismissed.

## Grade a produced spec (the Tier 2 grader, standalone)

```bash
python3 skills/yco-spec/evals/grade_spec.py Project/<feature>
python3 skills/yco-spec/evals/grade_spec.py Project/<feature> --json
```

Ten binary assertions, each printing the evidence it judged on. Useful on its
own as a pre-handoff check, not only inside an eval run.

---

## The two things Tier 2 measures separately

This skill **stops and asks by design** — Phase 0 and Phase 2 are gates. Drop a
fixture at it and a single run would stall at the clarification round and score
nothing. So the two abilities are measured apart:

**E1 — asking.** `fixtures/mini-feature/` is a brief that reads as finished and
hides exactly five things a spec cannot be written without. The score is recall
over those five, and precision against the four "noise" questions the brief
already answers. `GAPS.md` is the answer key — it never goes to the agent.

**E2 — building.** Same fixture plus `answers.md`, so the gates have nothing
left to block on. Graded by `grade_spec.py`: ten machine-checked assertions,
chosen so a baseline run fails most of them. An assertion a bare model would
pass anyway (did it write a file? is there prose?) measures nothing and is not
in the list.

**E3 — updating.** Change one rule on an existing spec. Checks the in-place
discipline: archive, version bump, changelog, no hand-edited HTML, no renumbered
IDs.

---

## The fixture

```
fixtures/mini-feature/
├── prd.md          reads finished; five gaps planted
├── plan.md         11 acceptance criteria across 4 slices
├── GAPS.md         E1 answer key — never given to the agent
├── answers.md      E2 only: the five gaps answered, plus the strings a spec needs
└── specs/
    ├── acms-sticker-pack-sample.json    real payload shape, incl. engine-only keys
    └── screenshots/                     five 1440px frames
```

The payload deliberately carries `meta.prompt[]` (model, style_prompt,
negative_prompt) and `createdTime` / `lastModified`, so A2 and A6 have something
real to catch: everything must be classified, and the prompt content must never
surface.

---

## Rules that do not bend

- **Agent fails an eval → fix the skill, never weaken the eval.**
- **An eval that passes without the skill measures nothing.** If both
  configurations score the same on an assertion, the assertion was too easy —
  that is a finding about the eval, not a result about the skill.
- Freeze inputs before a run; each run in its own sandbox; graders fresh per run;
  the executor never sees the assertions.
- Report raw counts (`2/3`), not percentages, on samples this small.
- Grade behaviour and artifacts — never whether the agent recited the rules.
- A harness error gets repaired and re-run. Inconclusive never counts as a pass.
- Compare only against a last-known-good with a matching
  `(cli, model, effort, executor)`.

---

## Status

| Tier | Built | Executed here |
|---|---|---|
| 0 | yes | yes — passing |
| 1 | 20 queries written | no — needs the headless CLI runner |
| 2 | fixture + grader built, grader smoke-tested against the real template-spec (10/10) | no — needs paired agent runs |
| 3 | designed in `runbook.yaml` | deferred one round, by decision |

Tier 1 and Tier 2 need a runner that can spawn `with_skill` / `without_skill`
sessions and diff them. The runbook, fixture, graders and assertions are ready
for it; nothing here reports a score that was not actually measured.
