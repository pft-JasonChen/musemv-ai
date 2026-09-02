---
name: yco-spec
description: "Turn a validated YCO web prototype into a path-storyboard behavior spec (spec.html) for the front-end RD/QA handoff — screenshot-first step cards, stable step IDs, an API/CMS data contract, and a QA coverage table. Use when asked to generate, build, extend or rebuild the RD spec, the developer handoff doc, or the behavior spec for a finished prototype. Not for writing a PRD (use to-prd), not for building or fixing prototype code (use web-prototype), not for running Stage 3 prototype validation (use web-validate), and not for producing the user flowchart."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# yco-spec — YCO Prototype → Behavior Spec

Turn a validated YCO web prototype into a **path-storyboard behavior spec** for the
front-end RD / QA team. The spec is the contract RD builds production code against —
the prototype source itself cannot be reused.

Write a small per-feature `build_spec.py` that imports the shared builder
(`skills/yco-spec/spec_builder.py`), defines one `cfg` dict, and calls
`spec_builder.write_specs(cfg)`. The builder owns **all** rendering; there is no
hand-authored HTML.

**References — load on demand, not up front:**

| File | When |
|---|---|
| `references/cfg-schema.md` | Writing or extending a `cfg` — every key, every tuple shape, versioning |
| `references/writing-rules.md` | Wording a step: caps, rule-vs-reason, tone & vocabulary, before/after examples |
| `references/screenshots.md` | Phase 3 — capture, the two screenshot sources, focus measurement |
| `references/flowchart.md` | `user-flowchart.svg` — drawing it with `flowchart_lib`, the visual language, the version stamp, the geometry gate (`check_flowchart.py`), the review checklist |
| `references/engine-dod.md` | Editing `spec_builder.py` / `capture_lib.py` / `spec-styles.css` |
| `cfg-template.py` | The copyable skeleton for a new `build_spec.py` |

---

## Hard rules

**Provenance — the rule this skill exists to enforce**

A spec is a contract. RD cannot tell a rule someone decided from a rule that reads
like something someone would decide, so the spec must not contain the second kind.

- **No line without a source.** Every `limits` bullet and every `exact` string traces
  to one of: `prd.md` / `plan.md` · a string or behaviour actually present in the
  prototype · a design mockup you are building the spec from · a `decisions` row the
  user approved · the sample payload. A fact you can infer is still a fact you must
  source.
- **An unknown becomes a question, never a default.** If you cannot source it, it is
  an `open_questions` row or a question to the user — never a plausible bullet.
  Plausibility is the failure mode, not the defence: the invented rules that ship are
  precisely the ones that sounded right.
- **Naming a shared pattern is the whole specification of it.** "Reuses the site's
  standard select-then-confirm dialog pattern" already binds selection, Cancel and
  Done. Re-listing them re-specifies a pattern this spec does not own — and the
  restatement silently becomes the contract on the day the shared pattern changes.
  Name it, then add bullets **only** for what this feature does differently.
- **Sourced from a mockup ≠ true of the prototype.** When the spec follows a design
  mockup and the prototype does something else, that is a `prototype_deltas` row, not
  a discrepancy to leave standing. A spec with no deltas is claiming the prototype
  matches it exactly.
- **The audience test.** The reader is a **web front-end RD**. If they cannot build
  anything differently because of a line, it is not a rule — cut it. Mobile-app
  parity notes, ACMS authoring concerns, cross-platform rationale and scope defences
  all fail this test. A pointer that withholds the value it points at ("mirrors the
  app one-to-one", without the mapping) fails it twice: it costs a line and still
  sends RD somewhere else.

**Content**
- **Behavior only.** No code, no DOM IDs, no JS function or variable names.
- **English only.** No zh-tw anywhere in the spec. Enforced by `validate()` on
  step text. A localized *value* quoted inside a data-contract JSON sample is the
  one exception and is not gated — a translation table whose point is the
  localized strings cannot show them in English.
- **Prototype ≠ production.** Never bury a "prototype only" note in a step — it goes
  in `prototype_deltas` with its real production counterpart. The build fails if the
  word "prototype" appears in a step with no delta row.
- **Desktop 1440 only.** No 1024/768 in the spec; that is the prototype's Stage 3
  concern. Mobile is out of scope until defined separately with the user.
- **A rule and its reason are separate.** A `limits` bullet is a `str` or a
  `(rule, why)` pair. One bullet = one fact = one sentence.
  See `references/writing-rules.md`.

**Structure**
- **Path storyboard is the spine.** One section per user journey, opened by a skim
  strip (one line per step, prefixed with its stable ID).
- **Two spec kinds, and the second is not an escape hatch.** `spec_kind`
  defaults to `'storyboard'` — the journey spec above. `'data-contract'` is for a
  spec whose subject is a payload mapping with no screens to walk: it drops
  `paths`, the flowchart and `screenshots_dir`, and in exchange **requires**
  `data_contract` (≥ 1 `schemas`/`tables` entry) and `criteria`. Reach for it
  only when there is genuinely no journey — a feature with screens gets a
  storyboard, however tempting the shortcut. Never add a kind that merely
  switches gates off: the storyboard *was* the content and per-path QA *was* the
  traceability, so a waiver that asks for nothing back leaves an unvalidated
  document, which this skill holds to be worse than no spec. Table in
  `references/cfg-schema.md`.
- **Four blocks per card: TRIGGER / WEB UI / STRINGS / RULES.** `exact` renders as
  STRINGS (quoted UI text), `limits` as RULES (numbers and branching). Input/Output
  sits at the bottom; each half renders only when it carries a value.
- **Label the response row `WEB UI`, not `SYSTEM`** — RDs found "SYSTEM" ambiguous.
  Configurable via `actor_label`.
- **Screenshot first, then text.** The image sits above the text in every step card.
- **The TRIGGER line is the emphasised one.** A reader should be able to scan the
  user actions straight down the page.
- **Open with a Feature block.** `description` is required — one or two sentences on
  what the feature is. The overview table holds metadata, not "what is this".
- **Stable IDs everywhere.** `P1`, `P1-S2`, error `P1-E1`, criterion `S3.2`,
  question `Q-01`. IDs **never renumber** — deleting a path leaves a gap, it does not
  renumber the ones after it. Auto-derived from `num`; pin one with `req_id`.
- **The data contract is its own section**, not tables buried in a step. Any API/CMS
  payload the UI reads gets a `data_contract`, plus a reverse index (on screen →
  source key) and the real sample payload committed beside the spec so
  `lint_spec.py` can measure coverage. Steps cite `T1`/`T2` and the links do the
  rest. Two renderers, and the choice is about what the contract *is*:
  - `tables` — per-key **render rules**: five columns (key · allowed values ·
    example · renders as · missing/null/unknown).
  - `schemas` — the payload's **shape**: the JSON, syntax-highlighted, with its
    keys documented underneath in API-doc layout. Reach for this when nesting or
    arrays carry the meaning; a five-column table flattens both away and leaves
    RD rebuilding the structure from dotted key paths. The builder highlights the
    JSON — never hand-author the markup, it rots the first time a value is edited.

  A spec may use both. Neither replaces the other: a shape nobody can see and a
  render rule nobody wrote are different failures.
- **Settled, undecided and scope are three different things.** A settled answer lives
  beside the rule it governs; an undecided one goes in `open_questions` with what it
  blocks and who owns it; scope goes in the overview. Only genuinely cross-cutting
  answers earn a `decisions` row.
- **QA is a coverage table, not a checklist.** `criteria` maps each `plan.md`
  acceptance criterion to the step(s) that specify it. A criterion with no step must
  carry a reason; `validate()` rejects a silent gap. Test cases belong in the test
  tool — the spec's job is the trace back.
- **No Responsive section, no RD Review section.**

**Rendering**
- **Cross-references are live.** A bare `D-12` / `P1-S3` / `T1` in prose becomes a
  jump link at build time, and one that resolves to nothing **fails the build**.
  Never reference something the spec does not define.
- **Focus frames carry a visible number**, with the label in a legend under the
  screenshot — a hover tooltip is invisible in print, in a PDF, and in a screenshot
  pasted into a ticket. `action` = solid red (the click that advances the flow),
  `info` = dashed amber. Passive states get no frame.
- **Full-width inline screenshots.** Never thumbnails, never a lightbox.
- **Limited colour.** Brand cyan `#03ade2` for structure and links; red for errors;
  everything else neutral grey.
- **Two HTML outputs every time:** `spec.html` (linked, diffable) and
  `spec-bundled.html` (base64, self-contained for external share).
- **Versioned in place.** One living doc: bump `version`, prepend a `changelog` row,
  mark new content with `since`, archive the old HTML via `archive_current(cfg)`.

**Process**
- **Confirm scope before building.** Phase 0 is a gate, not a formality.
- **The `cfg` dict is the source of truth.** Never hand-edit `spec.html`.

---

## When to trigger

- "generate/build/update the spec", "spec for [feature]", "RD handoff doc"
- After Stage 3 validation completes and the user asks for the developer handoff.

Not this skill: writing a PRD (`to-prd`), building or fixing prototype code
(`web-prototype`), Stage 3 prototype validation (`web-validate`), the user flowchart.

---

## Input files (read in this order)

| File | Read for |
|---|---|
| `Project/<feature>/prd.md` | Feature overview, user stories, scope, out-of-scope |
| `Project/<feature>/plan.md` | Slices + **acceptance criteria** (these become `criteria`) |
| `prototypes/<feature>/index.html` | **Visible UI labels only** — confirm exact on-screen text |
| `Project/<feature>/*.pdf` (design decks, app specs) | Screens the prototype never built, and strings the prototype spells differently. **A legitimate source — but name it.** |
| `Project/<feature>/user-flowchart.svg` | Flow diagram (inlined into the spec) |
| the real API/CMS sample payload | The data contract, and what `lint_spec.py` measures against |

> These are the **only** sources. A line that traces to none of them is not a spec
> line. When a deck and the prototype disagree, the deck usually wins the spec and
> the difference becomes a `prototype_deltas` row — but write the row, because
> "the deck said so" is invisible to everyone reading the spec afterwards.

> You **may** read `main.js` to understand the flow when the PRD and HTML are not
> enough — but nothing implementation-level ever enters the spec. Understand from the
> code; describe only the behavior.

---

## Phase 0 — Confirm scope (mandatory gate)

**Never generate spec files straight from the request.**

1. **Run grill-me** (`.claude/skills/grill-me/SKILL.md`) — surface every ambiguous UX
   detail, branch, exact copy string, limit and edge case.
2. **Confirm with `AskUserQuestion`** before writing any file: which paths are in
   scope, the output location, the key decisions, and viewport scope.
3. **Build is blocked until the user approves.** If core UX questions remain
   unanswered, output the open list and **stop**.

> This gate exists because specs were being generated immediately on request, before
> scope was confirmed. Confirm first, build second.

---

## Phase 1 — Read & extract user paths

1. Read `prd.md` and `plan.md` in full; skim `index.html` for exact UI text.
2. List every distinct **user path** — one journey from entry point to outcome.
   Happy path first, then variants, then error paths.
3. For each path list its **steps**: the user action, the system response, exact
   on-screen text, and the numeric rules that apply.
4. **States** — every distinct screen state with entry condition, what is
   visible/enabled, transitions and exit (`states`).
5. **Data contract** — every key the UI reads out of the payload, and what each one
   turns into on screen. Include the reverse direction.
6. **Prototype simplifications** — everything the prototype fakes (`prototype_deltas`).
7. **Hand-offs** — where one path ends and another begins (`bridge`).
8. **Page sections** — marketing/SEO pages only; omit for flow apps.

---

## Phase 2 — Clarification gate (act as a senior engineer)

**The bar:** *could an RD build every screen and transition from this spec without
asking a single question?* If not, you are not done asking.

**The counter-bar, and it wins ties.** Completeness never licenses invention. This
phase is a list of questions to *ask*, not gaps to *fill*. Name the source as you
close each one — a prd.md line, a prototype string, a user decision, a payload key.
A gap closed from your own sense of how such a screen usually works is the exact
defect this phase exists to prevent, and it is undetectable downstream: it reads
like every sourced rule around it, and every later pass will polish it rather than
question it. **An incomplete spec advertises what it is missing. An invented one
does not.**

Enumerate **every** unknown — do not stop at five questions:

- **Entry conditions** — what state, permissions or data must exist first?
- **Every transition** — exact trigger, and what the user sees mid-transition?
- **Every branch** — both sides spelled out, no implicit "else"?
- **Exact copy** — every label, button, toast, empty state and error, verbatim?
- **Limits & validation** — concrete numbers, and the behaviour at each boundary?
- **Errors & recovery** — trigger, message, recovery, refund/rollback?
- **Edge & empty states** — no data, max data, slow network, abandon and return?
- **Gating** — what is blocked while busy or logged out, and what unlocks it?
- **Data contract** — for every key: allowed values, and what happens when it is
  missing, null, or a value you do not recognise?

**Halt rule:** if core UX questions remain unanswered, **do not generate the spec.**
Output the unresolved list and stop. A spec built on guesses is worse than no spec.

"Core" qualifies the *halt*, not the sourcing rule. A small gap does not earn a
default either — it earns a one-line question or an `open_questions` row. The cost
of asking is one message; the cost of guessing is production code.

A question about how the UX behaves is never "open" — it must be resolved. A question
only another team can answer (a payload's production shape, an asset that does not
exist yet) is a legitimate `open_questions` row: record what it blocks and who owns it.

---

## Phase 3 — Screenshots

Capture every state at **1440px**, save to `Project/<feature>/specs/screenshots/` as
`NN_name.png`, and measure each focus box while capturing rather than eyeballing it
afterwards. Full detail — including the two permitted screenshot sources and the
reproducibility rules — in **`references/screenshots.md`**.

Never screenshot from the Linux sandbox and never use `file://`.

---

## Phase 4 — Build

Copy `cfg-template.py` to `Project/<feature>/build_spec.py`, fill in the `cfg`, run
`python3 build_spec.py`. Every key is documented in **`references/cfg-schema.md`**.

`write_specs(cfg)` runs `validate(cfg)` first and writes nothing on a hard failure.

**`validate()` hard-fails on:** CJK characters in step **or criterion** text · a
referenced screenshot that does not exist (including `context_shot`) · a
cross-reference (`D-xx` / `Pn-Sn` / `Tn`) the spec never defines · a criterion
pointing at a missing step or data-contract block, or mapping to nothing without a
reason · a path with zero QA lines (only when `criteria` is unset) · the word
"prototype" in a step with no `prototype_deltas` row · a duplicate path/step ID ·
a missing or stale-stamped flowchart · an unknown `spec_kind` · a
`spec_kind='data-contract'` spec missing `data_contract` or `criteria` · a
structural change with nothing recorded in `decisions` or `open_questions`.

**The flowchart is checked too.** `svg_path` must exist and its subtitle must read
`matches spec <cfg['version']>, <date>`. A stamp that does not match the version
fails the build — a diagram nobody re-read is a diagram that contradicts the spec,
which is exactly how template-spec drew a retired rule for three days. Because the
SVG is inlined, a step ID drawn on it is cross-reference-checked like any other.
Rules belong in step cards; the diagram draws paths and cites IDs. Details and the
pre-stamp review checklist: **`references/flowchart.md`**.

**Phase 0 leaves evidence.** The change type is inferred from `specs/_archive/`, not
declared: a new spec, or one whose path / step / decision IDs moved, must carry at
least one `decisions` or `open_questions` row. Rewording an existing step is
cosmetic and exempt. The gate asks that *something* was recorded, never what the
answer is — "nothing was settled" is recorded as an open question.

**Section order** (empty sections are omitted): header → Feature block → "Reading this
spec" callout → overview → Flow Diagram (collapsed) → All User Paths → path
storyboards → Page Sections → **Data Contract** → State Inventory → **Open Questions**
→ **QA Coverage** → Error States → Prototype Simplifications → Design Decisions →
References → Changelog.

---

## Phase 4b — Lint (advisory)

`validate()` is the hard gate. `lint_spec.py` reports what makes a spec *tiring*
rather than wrong, and never fails a build on its own:

```bash
python3 skills/yco-spec/lint_spec.py Project/<feature>            # report
python3 skills/yco-spec/lint_spec.py Project/<feature> --strict   # exit 1 on any finding
```

- **words** — `limits` bullets over 20 words or carrying more than one sentence;
  `system` over 25. A `(rule, why)` pair is counted on the rule half only.
- **meta** — sentences about the spec itself.
- **payload** — every key path in `specs/*.json` must be documented in a table,
  declared engine-only, or listed in `data_contract_ignore`. Coverage is inherited:
  declaring `meta.prompt[]` engine-only settles everything beneath it.
- **strings** — every string quoted in `exact` **or in a step's `tables`** is searched
  for in `prototype_src`. This is the only check that tests whether the spec is *true*
  rather than whether it reads well; set `prototype_src` or you lose it. A miss needs an
  explanation, then a fix or a `strings_ignore` entry — never a shrug. (Tables were added
  2026-08-10: moving copy out of `exact` into a table used to drop it out of the check
  silently, which is the one failure this check exists to prevent.)
- **norender** — a data-contract row whose "Renders as" cell says *Nothing* / *N/A*.
  Classification and display are different jobs: keep the key triaged (coverage
  should stay at 100%) but move it to `data_contract['no_ui']` or `['engine_only']`,
  which render as a note instead of a five-column row that resolves to "ignore this".
  Rewording the cell to say what the key *does* answers the finding just as often.

Aim for zero findings before handing the spec to RD.

---

## Phase 5 — Verify (the visual pass `validate()` cannot do)

1. Open `spec.html` via **localhost** — `http://localhost:8000/Project/<feature>/specs/spec.html`.
2. Every screenshot loads; nav anchors and the jump-to-ID box land on the right
   element; no step card is broken.
3. Read it as a reader: does the TRIGGER line stand out? Do the cards stay light now
   that the data contract has its own section?
4. Spot-check that rules read as behavior — no leaked code, IDs, or zh-tw.
5. Confirm both files were written (`spec.html` small, `spec-bundled.html` larger).

---

## Phase 6 — Review comments (shipped automatically)

Every built spec includes an inline RD/QA comment layer (`shared/yco-comments.js`),
on by default. The shared Firebase backend is read centrally from
`agent.config.json → firebase`; a spec sets only its own `comments_spec_id`.

- Reviewers click **+ Comment** on any step or select text to open a thread. Identity
  is requested **lazily** — never on load, only on the first write action.
- Threads sync via Firestore, so the whole team sees the same comments on the
  deployed spec. They survive rebuilds — they anchor to stable step IDs.
- `comments_spec_id` must be a **stable slug**, set once and never changed. It is not
  derived from the folder path; renaming a folder must not orphan its comments.
- Sharing a spec = sharing its deployed URL, or `spec-bundled.html`. No publish step.

---

## Output

Confirm `[Spec: DONE — Project/<feature>/specs/spec.html]`, citing both file paths.

**Open comments before sign-off.** When re-confirming a spec as DONE after a review
round, do not treat it as closed while threads are still open — surface the count and
confirm with the user whether to address them first.
