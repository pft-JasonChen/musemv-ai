#!/usr/bin/env python3
"""Builds user-flowchart.svg for the AI Song Creation storyboard spec.

Layout note: P1 (Simple) and P2 (Custom) are drawn as ONE branch-and-converge
tree, not two separate regions. Both paths share the exact same Create Song tap,
/song/creating screen, outcome decision, /song/result and /history nodes — the
only real difference is the compose screen itself (Simple vs Custom) and whether
the result carries a Lyrics panel. Drawing that shared tail twice would just be
noise; the single node covers both step IDs instead. P3 (the failure path) hangs
off the same outcome decision, to the left, per the visual language's "errors
hang left" convention.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))          # .../specs/storyboards/song-creation
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v2'
DATE = '2026-08-25'

f = Flow('AI Song Creation', 'YouCam Muse Web — desktop 1440',
          version=VERSION, date=DATE, width=1100)
S = f.SPINE
CX = S + 90  # centerline x for diamonds (node_w/2)

f.note(40, 65, 'Simple and Custom converge at Create Song; the generation, '
               'result and History screens are shared (drawn once).')

entry = f.node(S, 100, 'Sidebar "AI Song"', kind='entry')
mode = f.decision(CX, 210, 'Compose mode?')
f.edge(entry, mode)

simple = f.node(S - 220, 300, 'Compose — Simple', 'Idea, Enhance, char cap · P1-S1..S4')
custom = f.node(S + 220, 300, 'Compose — Custom', 'Lyrics, chips, Instrumental, Enhance · P2-S1..S8')
f.edge(mode, simple, 'Simple')
f.edge(mode, custom, 'Custom')

create = f.node(S, 410, 'Tap Create Song', 'Charges generation cost · P1-S5, P2-S9')
f.edge(simple, create)
f.edge(custom, create)

guest = f.node(S + 340, 390, 'No active session', 'Sign-in gate opens · P4-S1 → P4-S2', kind='aside')
low_balance = f.node(S + 340, 490, 'Balance below cost', 'Buy-credits IAP · P5-S1', kind='aside')
f.elbow(create, guest, 'guest', kind='deferred', out='right', into='left', gap=90)
f.elbow(create, low_balance, 'insufficient credits', kind='deferred', out='right', into='left', gap=90)

# The side rail is an annotation on BOTH compose screens, so it is drawn as a
# dashed aside rather than a floating paragraph: at 880px wide, the paragraph
# version crossed both diagonals converging into Tap Create Song, and
# references/flowchart.md rules out pinning prose to the canvas anyway.
# x=30 keeps it clear of Compose — Simple (240..420); nothing else is drawn
# left of x=240 on this row.
f.node(30, 300, 'Side rail', 'Trending Songs, or My Creations · P6-S1', kind='aside')

creating = f.node(S, 500, '/song/creating', 'Progress ring + estimate · P1-S6, P2-S10')
f.edge(create, creating)

outcome = f.decision(CX, 610, 'Job outcome', 'mock timing')
f.edge(creating, outcome)

result = f.node(S, 700, '/song/result', 'Player; Lyrics panel on Custom only · P1-S7, P2-S11', kind='success')
f.edge(outcome, result, 'done')

result_controls = f.node(S + 340, 700, 'Result screen controls', 'Like, Share, Lyrics sheet, Publish, Recreate, from History, Use in MV · P7-S1..S7', kind='aside')
f.elbow(result, result_controls, 'once already on the result screen', kind='deferred', out='right', into='left', gap=90)

history = f.node(S, 800, '/history', 'New row, Done pill · P1-S8, P2-S12', kind='success')
f.edge(result, history)

failed = f.node(S - 320, 700, 'Generation Failed', 'Retry / Back · P3-E3', kind='error')
f.edge(outcome, failed, '“[fail]” marker · P3-S1', kind='error')

f.legend(920)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
