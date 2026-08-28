#!/usr/bin/env python3
"""Builds user-flowchart.svg for the AI Music Video Edit (S3) storyboard spec.

Layout note: all five paths branch off ONE entry point ("arrive at /mv/edit,
real or fabricated"), because a user does not walk P1-P5 in sequence on a
single visit — they land, then touch whichever sections they touch, in
whatever order, before Merge or Delete or simply leaving. Cover/Scene/Settings
hang off the tour as independent branches that all feed one "any pending
edit?" gate, which is the actual condition Merge's enabled state checks.
Structural exits into other specs' territory (S2's /mv/creating, S4's
/history) hang right, per the visual language's own convention; error/dead
ends (insufficient balance, the two edge cases) hang left.

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

f = Flow('AI Music Video Edit', 'YouCam Muse Web — desktop 1403×697 AND phone 375×812 (D8 exception)',
          version=VERSION, date=DATE, width=1180)
S = f.SPINE
CX = S + 90

f.note(40, 65, 'Five branches off one entry point, not a sequence — a visit touches whichever '
               'sections it touches before Merge or Delete or leaving. Every "opened, stop" node '
               'is another spec\'s territory (S2/S4); this diagram does not draw past it.')

entry = f.node(S, 100, '/mv/edit', 'Real entry (Result) or fabricated (History) · P1-S1..S5', kind='entry')

# ── P1 — entry variants ───────────────────────────────────────────────────
mve2 = f.node(S - 480, 100, 'Reload, no flow state', 'router.replace(/mv/room) · P5-S4 (MV-E2)', kind='error')
f.elbow(entry, mve2, 'no storyboard', kind='error', out='left', into='right', gap=60)

tour = f.node(S, 190, 'Header + three sections render', 'Cover · Scenes · Output settings · P1-S2, P1-S3')
f.edge(entry, tour)

# ── P2 — cover ────────────────────────────────────────────────────────────
cover = f.decision(CX, 290, 'Recreate cover?')
f.edge(tour, cover)
coverdone = f.node(S - 260, 380, 'Cover overwritten, no undo', 'Flat 4 credits · P2-S3, P2-S4 (AC-MV-12)')
f.edge(cover, coverdone, 'yes')

# ── P3 — scenes ───────────────────────────────────────────────────────────
scene = f.decision(CX, 480, 'Edit + Recreate a scene?')
f.edge(tour, scene)
scenedone = f.node(S - 260, 570, 'Scene video overwritten', 'Per-shot dynamic cost · P3-S3, P3-S4 (AC-MV-12)')
f.edge(scene, scenedone, 'yes')
phone = f.node(S + 330, 480, 'Phone: full-screen scene view', 'Same dirty-gate, same cost · P3-S5..S8 (D8, A16)', kind='aside')
f.elbow(scene, phone, '<768px', kind='deferred', out='right', into='left', gap=90)

# ── P4 — settings + delete ───────────────────────────────────────────────
settings = f.decision(CX, 670, 'Toggle a setting?')
f.edge(tour, settings)
settingsdirty = f.node(S - 260, 760, 'Marked dirty', 'title/author/subtitle/watermark · P4-S1 (C2)', w=230)
f.edge(settings, settingsdirty, 'yes')
delete = f.node(S + 330, 670, 'Delete this Project', 'Confirm · P4-S2', kind='screen')
f.elbow(tour, delete, 'Delete', kind='deferred', out='right', into='left', gap=90)
deletedone = f.node(S + 330, 760, 'Discards in-memory flow -> /history', 'No backend delete · P4-S3', kind='success')
f.edge(delete, deletedone, 'confirm')

# ── P5 — merge ────────────────────────────────────────────────────────────
dirty = f.decision(CX, 860, 'Any pending edit?')
f.edge(coverdone, dirty)
f.edge(scenedone, dirty)
f.edge(settingsdirty, dirty)
mergeoff = f.node(S - 480, 860, 'Merge MV disabled', 'No pending edit', kind='error')
f.elbow(dirty, mergeoff, 'no', kind='error', out='left', into='right', gap=60)
mergeon = f.decision(CX, 960, 'Sufficient balance?')
f.edge(dirty, mergeon, 'yes')
creating = f.node(S - 260, 1050, '/mv/creating', 'Flat 10 credits charged · P5-S1, P5-S3 (AC-MV-13/19)', kind='aside')
f.elbow(mergeon, creating, 'yes', kind='deferred', out='left', into='right', gap=60)
iap = f.node(S + 330, 1050, 'Upgrade Your Plan (buy-credits IAP)', 'P5-S2', kind='error')
f.elbow(mergeon, iap, 'no', kind='error', out='right', into='left', gap=90)

mve5 = f.node(S, 1150, 'Leave with no Merge -> every edit lost', 'MV-E5', kind='error')
f.edge(tour, mve5)

f.legend(1470)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
