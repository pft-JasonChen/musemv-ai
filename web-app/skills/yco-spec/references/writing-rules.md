# Writing rules — how a spec sentence should read

A spec is read under deadline by someone about to write code. Every extra word is
a word they pay for. `lint_spec.py` measures most of this; the examples below are
what it cannot judge.

---

## The caps

| Field | Cap | Why |
|---|---|---|
| a `limits` bullet | ≤ 20 words, **one sentence** | one bullet = one fact |
| `system` (WEB UI) | ≤ 25 words | it describes one response, not a paragraph |
| a data-contract cell | a conclusion, not a paragraph | a table you have to read like prose is not a table |

A `(rule, why)` bullet is counted on the **rule** half only — that is the point of
splitting it. Put the reason in the second element, never inside the rule.

---

## Rule and reason are different things

The reason a rule exists is useful, but it is not the contract. Give it the second
half of the pair so a reader can tell the binding line from the background.

```python
# Before — 30 words, three facts, no way to tell which part is binding
'Select-then-confirm is the site’s existing dialog pattern. RD reuses it as-is — '
'selection highlight, Cancel and Done all behave as they do elsewhere, and nothing '
'about it needs configuring here.'

# After
'Reuses the site’s standard select-then-confirm dialog pattern.'
```

---

## Name the pattern, then stop

This is the compression above taken seriously. Naming a shared pattern **is** the
specification of it. What follows the name may only be what this feature does
*differently* — anything else re-specifies a pattern this spec does not own, and
the copy becomes a competing contract the day the real pattern changes.

```python
# Before — the named pattern, then four bullets re-deriving it
'Reuses the site’s standard select-then-confirm dialog pattern.',
'One selection at a time; clicking another tile moves it.',
'Done applies whichever tile is selected.',
'Done is the only way to apply; clicking a tile alone never loads the template.',
'Cancel discards the selection.',

# After — the name, plus only what is local to this feature
'Reuses the site’s standard select-then-confirm dialog pattern.',
'Applying a template always clears every filled slot (D-27).',
```

The tell: a bullet you could write without knowing anything about *this* feature
belongs to the pattern, not to the spec.

---

## Every line passes the audience test

The reader is a web front-end RD. Ask of each line: **could they build something
differently because of it?** No → cut it, however true it is.

| Cut | Why it fails |
|---|---|
| "Which thumbnail asset feeds which surface mirrors the app one-to-one (D-11)." | Names no key and no ratio. RD still has to go ask. |
| "Web uses the browser file input, so the app's multi-select picker rules do not apply." | A rule about the app's behaviour, phrased as a rule about the web. |
| "The 3 samples are identical for every template of that type." | Content-ops fact; changes nothing RD builds. |
| "Most templates do both and appear in both." | Catalog trivia behind a rule that already states the filter. |

A pointer is only worth its line when it carries the value. "Grid tile uses the 3:4
thumbnail; the feature-room preview uses the 9:16" is a rule. "Mirrors the app" is
an errand.

```python
# Before — the rule is buried behind its own justification
'The user is NOT locked to this screen: progress is engine-reported, so they may '
'move to History or leave the feature room entirely and the result still appears there.'

# After — rule first, reason quieter
('The user is never locked to this screen.',
 'Progress is engine-reported, so they may move to History or leave the feature '
 'room entirely and the result still appears there.')
```

---

## One bullet, one fact

A full stop in the middle of a bullet is a second bullet trying to get out.

```python
# Before
'Results are retained 30 days, then removed. The countdown is per result and shown on the entry.'

# After
'Results are retained 30 days, then removed.',
'The countdown is per result and shown on the entry.',
```

---

## Never narrate the spec

Sentences about the document itself cost the reader time and tell them nothing
about the product. `lint_spec.py` flags the common phrasings; the rule is broader
than the regex.

| Delete | Why |
|---|---|
| "Neither proposal deck shows this as its own screen, so no screenshot is reused; behavior is described directly." | The reader does not need to know why there is no screenshot. |
| "How the Next Action shortcuts are arranged is a guideline decision; this spec fixes only the item set." | Says what the spec is not doing. |
| "That is a deliberate scope-down, not an omission." | Defensive. State the scope; do not defend it. |
| A sentence repeated in every row of a table | It belongs under the table once — use `errors_note`. |

---

## Say the boundary, not the range

Every numeric limit needs the behaviour **at**, **just under**, and **just over**
it. "1–10 slots" tells an RD nothing about what an 11-slot record does. The
data contract's "missing / null / unknown" column exists for exactly this.

---

## Quote what is on screen — and check that it is

Exact UI text goes in `exact`, quoted with HTML entities
(`&ldquo;Generate Image&rdquo;`). State names are plain phrases — "processing
state", not `PROCESSING` in code formatting. Nothing implementation-level ever
enters spec text: no DOM IDs, no function names, no class names.

**A quoted string is a claim that those characters appear on screen.** Verify it
against the prototype source or the mockup before you write it — never from memory
of what such a button is usually called. Set `prototype_src` in the cfg and
`lint_spec.py` checks every quoted string for you:

```bash
python3 skills/yco-spec/lint_spec.py Project/<feature>   # STRINGS section
```

A miss is not automatically a defect — the string may be production-only, or live in
a sibling prototype — but each one has to be *explained*, then either fixed or added
to `strings_ignore`. Silence is what let `&ldquo;expire in 30 days&rdquo;` ship as an
on-screen string that existed nowhere and that `prd.md` had ruled out of scope.

---

## Active voice, present tense

"The user taps Send", not "Send is tapped". "Generate becomes available", not
"Generate will be enabled". The spec describes how the product behaves, not a
sequence of things that will be built.

---

## Tone & vocabulary

A spec sentence should read the way a plain, professional PM or engineer would
say it out loud — not the way a marketing page or a novel would. Ask of each
sentence: would a non-native English speaker understand it on the first pass?

- **Simple, literal verbs over creative ones.** A verb like "land" or "carry"
  asks the reader to translate a metaphor into a mechanism before they can act
  on it. Name the mechanism directly instead.
- **No metaphors or idioms.** "Nothing is a surprise", "picks survive a group
  change" both need a second read. Say the mechanism: "Users can see the
  pending styles before they are generated." / "Selected styles remain when
  the user switches groups."
- **Standard product/UX terms** — display, show, save, select, upload,
  generate, switch, remove, edit — the words RD and QA already use in tickets
  and stand-ups.
- **Don't add meaning the source doesn't have.** This is the Provenance rule
  above, restated for word choice: a more evocative verb than the source
  supports is still an invented fact.
- (Implicit-subject fragments are still fine — "Reuses the site's standard
  dialog pattern" is not a vague subject, it's the compression this skill
  already asks for. The rule above is about *word choice*, not about forcing
  "The system..." onto every bullet.)

### Two verb families this spec engine uses constantly

| Describing... | Use | Not |
|---|---|---|
| how the user reaches a screen | arrive at, redirect to, reach | land on |
| how data moves between screens | store, pass, send | carry, hold, hand-off |

Most step cards in this project are one of these two things: a user arriving
somewhere, or a prompt/file moving from one screen to the next. Reach for the
verb on the left — the ones on the right make the reader stop and interpret
what actually happens before they can act on the sentence.

### Vocabulary guardrail

Swap these on sight, unless the original word is technically exact (e.g.
"OAuth" stays "OAuth" — only the vague, general-purpose sense gets replaced):

| Avoid | Prefer |
|---|---|
| land | arrive at / appear / be displayed / be saved |
| survive | remain |
| carry (over) | remain / be retained / pass |
| hold | contain / have / store |
| surface *(as a verb)* | show / display |
| hand-off | transition |
| unlock | allow / enable |
| seamless(ly) | smooth / simple / automatically |
| leverage | use |
| utilize | use |
| facilitate | allow / help |
| ensure | make sure |
| journey | process |
| experience *(as a noun for a flow)* | workflow / process |
| empower | allow |
| streamline | simplify |
| robust | reliable |
| intuitive | easy to use |
| frictionless | simple / easy |
| dynamically | automatically |

`surface` as a noun (a screen — "which surface shows this") is fine; the
guardrail is the verb sense ("surfaces the info"), not the noun.
