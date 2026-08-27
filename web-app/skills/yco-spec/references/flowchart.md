# The user flowchart

`Project/<feature>/user-flowchart.svg`. Written at Stage 0 step 7, inlined into
the spec by `_flow_html`, and — until this document existed — the only artifact
in a feature folder that no build step ever checked.

## Draw it with `flowchart_lib`, not by hand

`skills/yco-spec/flowchart_lib.py` owns the visual language; a per-feature
`make_flowchart.py` owns the layout. Hand-written SVG is how the diagrams drifted
apart in the first place — one ended up in Arial with 2px black borders, the next
in the system stack with soft semantic fills.

```python
import os, sys
sys.path.insert(0, os.path.join(ROOT, 'skills', 'yco-spec'))
from flowchart_lib import Flow

f = Flow('Image & Video Template', 'Web (YCO Online Editor) — desktop 1440',
         version='v2', date='2026-08-11', width=1100)
S = f.SPINE                                    # x of a centred default node
dlg  = f.node(S, 118, 'Template selection dialog', 'ACMS categories · P1-S2')
room = f.node(S, 196, 'Feature room — N upload slots', '1–10 typed slots · P1-S3')
f.edge(dlg, room)
f.elbow(info, room, 'Retry restores the sources', kind='retry', out='left', into='left', gap=270)
f.legend(1290)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
```

Pass text **plain** — `—`, `·`, `"` and `&` are escaped exactly once on render.
Writing your own entities gets them double-escaped into `&amp;#8212;`.

`Flow(version=, date=)` composes the stamp, so the one string `validate()` checks
cannot be mistyped. Bumping it still means re-reading the diagram (below).

Layout stays manual on purpose: these diagrams are worth reading because the happy
path runs down one spine with branches hung off it, and no auto-layout can be told
which path is the one that matters.

### The visual language

Reference implementation: `2026-05-20-support-chatbot`, and template-spec redrawn
from it. Two legends, because colour and line encode different things and a reader
can infer neither:

| | |
|---|---|
| **Node colour** (header line, auto-built from the kinds you use) | `decision` amber · `info` blue (system response) · `success` green · `human` coral · `error` red · `screen` white · `entry`/`aside` grey |
| **Line style** (bottom legend, via `f.legend(y)`) | `primary` dark grey spine · `structural` light grey · `error` red · `deferred` dashed · `retry` dotted cyan |

- **One spine.** Happy path down the centre; errors hang left, structural exits
  right. A reader should find the main path without reading a word.
- **Two lines per node.** Bold title, then a grey subtitle carrying the step ID.
- **`entry` renders as a stadium** so a start point is recognisable as one.
- **Both edges out of a `decision` carry a label.** An unlabelled fork is the
  commonest way a diagram quietly stops matching the spec.
- **Connect nodes, never coordinates.** `f.edge(a, b)` uses ports, so an arrow
  cannot drift when a box moves. Use `f.elbow` for branches that leave and return.
- Route loops **clear of the side columns** — check the rendered PNG, not the code.

## The one rule

**The diagram draws paths. Rules live in step cards.**

A diagram that restates a rule can contradict it. That is not hypothetical:
template-spec drew

> Apply type+order+count retention rule:
> exact match → carry over images
> mismatch → clear all slots

for three days after D-27 retired the rule and P1-S2 said the opposite. Nothing
caught it, because nothing was wrong with the *spec* — the spec was right and the
picture beside it was lying.

So a node says **what happens and where the rule is written**, not what the rule
is:

```
  bad   Apply type+order+count retention rule:
        exact match → carry over images / mismatch → clear all slots

  good  Switch Template ("See all")
        reopens the dialog · returns to an empty feature room (P1-S2)
```

The step ID is what makes this safe. A cited ID that stops existing fails the
build (see *What is enforced* below), and a reader who follows it lands on the
live rule instead of a copy of it.

## Required content

| | |
|---|---|
| Title | feature name + "User Flowchart" |
| Subtitle | surface + viewport + **`matches spec <version>, <date>`** |
| One region per path | titled `Part N — <path name>`, in the spec's path order |
| Entry points | every way a user reaches the feature — one node each |
| Nodes | screen or state, named as the user would name it |
| Branches | a decision node per fork, both outgoing edges labelled |
| Errors | every `P<n>-E<n>` reachable from the drawn path |
| Exits | where the journey ends, including exits to other tools |
| Step IDs | cite `P1-S2` wherever a node needs a rule the reader can't guess |

Anything the diagram cannot say in a node label belongs in the step card, not in
a paragraph pinned to the canvas.

## The version stamp

The subtitle carries it, matching `cfg['version']` exactly:

```xml
<text x="30" y="58" font-size="13" fill="#666">Web (YCO Online Editor) — desktop 1440 · matches spec v2, 2026-08-06</text>
```

`v2` here is not decoration. Every rebuild that changes behaviour bumps the
version, so a stamp that did not move is proof the diagram was not re-read. That
is the whole mechanism: the gate cannot tell whether your diagram is *correct*,
but it can refuse to let you claim it matches a version you never checked it
against.

Updating the stamp means re-reading the diagram against the current paths first.
Bumping the number to clear the gate, without opening the picture, is the one way
to make this worse than having no gate at all.

## What is enforced

Run by `validate()` on every build:

| Check | Outcome |
|---|---|
| `svg_path` unset, or the file is missing | **FAIL** |
| Stamp present but ≠ `cfg['version']` | **FAIL** |
| No stamp, feature listed in `flowchart-baseline.txt` | warn |
| No stamp, feature not listed | **FAIL** |
| A `P<n>-S<n>` / `D-<n>` / `T<n>` on the diagram with no target | **FAIL** |

The last one is not new code. `_flow_html` inlines the SVG, so `_check_xrefs`
reads its `<text>` exactly as it reads a step card — a diagram citing a step that
was deleted or renumbered fails the build already.

`flowchart-baseline.txt` is a ratchet, seeded 2026-08-09 from the 7 specs that
already existed. It only shrinks: a spec leaves the list by gaining a stamp, and
a spec created after that date is never added.

Not enforced, and deliberately so: whether every path is *drawn*. It was built as
a word-overlap check and removed — it fired on 6 of 8 live specs and every hit
was a false positive, because a path called "Browse the FAQ tab" is drawn as
"FAQ" and no amount of threshold tuning fixes that. Coverage is a review
question, which is what the stamp buys you.

## Review checklist

Before you touch the stamp, walk the diagram against `cfg['paths']`:

- [ ] Every path in `cfg['paths']` has a region on the canvas.
- [ ] Every step whose behaviour a reader could not guess is either a node or
      cited by one.
- [ ] Every error state in `cfg['errors']` reachable from the drawn path appears.
- [ ] No node states a rule. Nodes state outcomes and cite IDs.
- [ ] Every cited ID still exists in the spec (the build enforces this — but find
      it here rather than in a stack trace).
- [ ] Retired behaviour is gone from the canvas, not struck through.
- [ ] Stamp matches `cfg['version']`.
