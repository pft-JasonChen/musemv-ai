#!/usr/bin/env python3
"""Builds user-flowchart.svg for the AI Music Video Edit (MV Edit) storyboard spec.

── WHY THIS IS SIX BANDS AND NOT ONE SPINE (rewritten 2026-09-02) ──────────

The first version hung all five branches off the single `Header + three
sections render` box on the centreline, and that is exactly what broke it.
Three things went wrong at once and none of them failed a build:

  * every box on that spine is 82px tall — two title lines AND two subtitle
    lines — not the 50px the y-spacing assumed, so each diamond began 14px
    INSIDE the box above it;
  * `Generation Failed`'s twin here, the MV-E5 box, was reached by a straight
    bottom→top edge from the entry screen down to y=1150, which drew a line
    through all five diamonds on the way;
  * the intro note was one 1219px line on a 1180px canvas, so its tail was
    simply not in the file.

A spine is the right shape for a sequence. P2–P4 are not a sequence: a visit
touches whichever sections it touches, in any order. So each is its own band,
left to right, and nothing has to cross anything.

`flowchart_lib` now refuses to write a diagram whose boxes collide or fall off
the canvas (`Flow.check()`), which is what would have caught all three; run
`python3 skills/yco-spec/check_flowchart.py` for the same check measured in a
real browser rather than estimated.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))          # .../specs/storyboards/mv-edit
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-08-28'
W = 1180
MARGIN = 40
COL_A, COL_C = MARGIN, 820      # left lead-in column; right outcome column
NW = 300                        # every band node is the same width

f = Flow('AI Music Video Edit', 'YouCam Muse Web — desktop 1403×697 AND phone 375×812 (D8 exception)',
         version=VERSION, date=DATE, width=W)

f.note(MARGIN, 65, 'Five branches off one entry point, not a sequence — a visit touches whichever '
                   'sections it touches')
f.note(MARGIN, 85, 'before Merge or Delete or leaving. Every "opened, stop" node is another spec’s '
                   'territory (S2/S4); this diagram does not draw past it.')

# ══ P1 — entry and its one failure mode ═════════════════════════════════════
f.section(150, 'Part 1 — Opening /mv/edit  ·  P1')

entry = f.node(COL_A, 180, '/mv/edit', 'Real entry (Result) or fabricated (History) · P1-S1..S5',
               w=NW, kind='entry')
gate = f.decision(600, 205, 'Storyboard in memory?')
f.edge(entry, gate, side='h')

tour = f.node(COL_C, 180, 'Header + three sections render',
              'Cover · Scenes · Output settings · P1-S2, P1-S3', w=NW)
f.edge(gate, tour, 'yes', side='h')

mve2 = f.node(COL_C, 290, 'Reload, no flow state', 'router.replace(/mv/room) · P5-S4 (MV-E2)',
              w=NW, kind='error')
f.edge(gate, mve2, 'no', kind='error', side=('bottom', 'left'))

# ══ P2 — cover ══════════════════════════════════════════════════════════════
f.section(400, 'Part 2 — Recreate the cover  ·  P2')

csec = f.node(COL_A, 430, 'Cover section', 'On the P1 screen · P2-S1..S2', w=NW, kind='entry')
cover = f.decision(600, 460, 'Recreate cover?')
f.edge(csec, cover, side='h')
coverdone = f.node(COL_C, 430, 'Cover overwritten, no undo',
                   'Flat 4 credits · P2-S3, P2-S4 (AC-MV-12)', w=NW)
f.edge(cover, coverdone, 'yes', side='h')

# ══ P3 — scenes ═════════════════════════════════════════════════════════════
f.section(570, 'Part 3 — Edit and recreate a scene  ·  P3')

ssec = f.node(COL_A, 600, 'Scenes section', 'On the P1 screen · P3-S1, P3-S2', w=NW, kind='entry')
scene = f.decision(600, 630, 'Edit + Recreate a scene?')
f.edge(ssec, scene, side='h')
scenedone = f.node(COL_C, 600, 'Scene video overwritten',
                   'Per-shot dynamic cost · P3-S3, P3-S4 (AC-MV-12)', w=NW)
f.edge(scene, scenedone, 'yes', side='h')
phone = f.node(COL_C, 700, 'Phone: full-screen scene view',
               'Same dirty-gate, same cost · P3-S5..S8 (D8, A16)', w=NW, kind='aside')
f.edge(scene, phone, '<768px', kind='deferred', side=('bottom', 'left'))

# ══ P4 — output settings and delete ═════════════════════════════════════════
f.section(830, 'Part 4 — Output settings, and Delete this Project  ·  P4')

psec = f.node(COL_A, 860, 'Output settings section', 'On the P1 screen · P4-S1..S3',
              w=NW, kind='entry')
settings = f.decision(600, 890, 'Toggle a setting?')
f.edge(psec, settings, side='h')
settingsdirty = f.node(COL_C, 860, 'Marked dirty', 'title/author/subtitle/watermark · P4-S1 (C2)',
                       w=NW)
f.edge(settings, settingsdirty, 'yes', side='h')

delete = f.node(COL_C, 960, 'Delete this Project', 'Confirm · P4-S2', w=NW)
f.edge(settings, delete, 'Delete', kind='deferred', side=('bottom', 'left'))
deletedone = f.node(COL_C, 1060, 'Discards in-memory flow → /history', 'No backend delete · P4-S3',
                    w=NW, kind='success')
f.edge(delete, deletedone, 'confirm')

# ══ P5 — merge ══════════════════════════════════════════════════════════════
f.section(1190, 'Part 5 — Merge MV  ·  P5')

dirty = f.decision(200, 1250, 'Any pending edit?')
mergeoff = f.node(COL_A, 1330, 'Merge MV disabled', 'No pending edit', w=NW, kind='error')
f.edge(dirty, mergeoff, 'no', kind='error')

mergeon = f.decision(600, 1250, 'Sufficient balance?')
f.edge(dirty, mergeon, 'yes', side='h')
creating = f.node(COL_C, 1220, '/mv/creating', 'Flat 10 credits charged · P5-S1, P5-S3 (AC-MV-13/19)',
                  w=NW, kind='aside')
f.edge(mergeon, creating, 'yes', side='h')
iap = f.node(COL_C, 1330, 'Upgrade Your Plan (buy-credits IAP)', 'P5-S2', w=NW, kind='error')
f.edge(mergeon, iap, 'no', kind='error', side=('bottom', 'left'))

# ══ MV-E5 — its own band, because it hangs off P1 and not off P5 ════════════
f.section(1470, 'MV-E5 — leaving without Merge')

mve5 = f.node(COL_A, 1500, 'Leave with no Merge → every edit lost', 'MV-E5', w=NW, kind='error')
f.note(COL_C - 380, 1530, 'Reachable from every band above, not just this one — nothing on')
f.note(COL_C - 380, 1550, '/mv/edit is persisted until Merge MV completes.')

f.legend(1640)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
