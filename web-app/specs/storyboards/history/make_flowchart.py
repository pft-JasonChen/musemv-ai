#!/usr/bin/env python3
"""Builds user-flowchart.svg for the History (My Creations) storyboard spec.

Layout note: the four filter chips (P1) and the five ... menu row-type
variants (P3) are each drawn as ONE decision/branch rather than one node per
chip or per row type — the individual variants are what the step cards and
the "Net per type" table in areas/05-history.md already own; the diagram's
job is to show WHERE each branch leads, not re-derive the table. Destination
screens that belong to a different area/spec (mv/result, song/result,
mv/storyboard, song/play, and the Edit MV / Create MV hand-off) are drawn as
dashed asides, per the visual language's "errors hang left, structural exits
right" convention — none of them is this spec's territory to draw further.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))          # .../specs/storyboards/history
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-08-27'

f = Flow('History (My Creations)', 'YouCam Muse Web — desktop 1440',
          version=VERSION, date=DATE, width=1140)
S = f.SPINE
CX = S + 90  # centerline x for diamonds

f.note(40, 65, 'Filter chips (P1) and the ⋯ menu’s five row-type variants (P3) are '
               'each one decision here — see the step cards for each variant’s exact content.')

entry = f.node(S, 100, 'Sidebar "History"', kind='entry')
room = f.node(S, 190, '/history — All filter', 'Live jobs + seed, community excluded · P1-S1')
f.edge(entry, room)

filt = f.decision(CX, 300, 'Filter chip?')
f.edge(room, filt)
filtered = f.node(S - 260, 390, 'Re-filtered rows', 'Music Videos / Songs / Liked · P1-S2..S4')
empty = f.node(S + 260, 390, 'Empty-state card', '"Nothing here yet…" · P1-S5')
f.edge(filt, filtered, 'MV / Songs / Liked')
f.edge(filt, empty, 'nothing matches')

rowtap = f.decision(CX, 500, 'Tap a row?')
f.edge(room, rowtap)
inert = f.node(30, 500, 'Processing row', 'No menu, no navigation · P2-S5', kind='aside')
f.elbow(rowtap, inert, 'processing', kind='deferred', out='left', into='right', gap=60)

destinations = f.node(S + 330, 500, 'Row destinations', 'mv result / song result / storyboard editor / '
                       'community player · P2-S1..S4 (areas 02–04)', kind='aside')
f.elbow(rowtap, destinations, 'done mv / song / storyboard / community', kind='deferred',
        out='right', into='left', gap=90)

menu = f.node(S, 610, '⋯ menu — 5 row-type variants', 'MV / song / storyboard / community / failed · P3-S1..S5', kind='screen')
f.edge(room, menu)

quick = f.node(30, 610, 'Like/Unlike · Share · Download', 'P3-S6..S8', kind='aside')
f.elbow(menu, quick, 'quick actions', kind='deferred', out='left', into='right', gap=60)

pub = f.decision(CX, 720, 'Publish, kind?')
f.edge(menu, pub)
mvconfirm = f.node(S - 260, 810, '"Ready to Go Public?" confirm', 'P4-S1', kind='decision')
reviewing = f.node(S - 260, 900, 'reviewing + published', 'toast: Submitted for review · P4-S2..S3', kind='success')
f.edge(pub, mvconfirm, 'MV')
f.edge(mvconfirm, reviewing)
songtoggle = f.node(S + 260, 810, 'Immediate toggle', 'toast: Published success · P4-S4', kind='success')
f.edge(pub, songtoggle, 'song')

delc = f.node(S, 810, 'Delete confirm', 'P5-S1', kind='decision')
f.edge(menu, delc)
removed = f.node(S, 900, 'Row removed (local)', 'P5-S2', kind='success')
f.edge(delc, removed)

cta = f.node(S + 330, 610, 'Edit MV / Create MV', '/mv/edit or /mv/room or /mv/storyboard · P6-S1..S2 (area 02, S3)', kind='aside')
f.elbow(menu, cta, 'CTA row', kind='deferred', out='right', into='left', gap=90)

f.legend(1000)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
