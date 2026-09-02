#!/usr/bin/env python3
"""Builds user-flowchart.svg for the AI Music Video (MV) Creation storyboard spec.

Layout note: P1 (Storyboard First) and P2 (Directly) branch at the mode
chooser and CONVERGE again at /mv/creating — direct mode skips /mv/storyboard
entirely, storyboard-first passes through it first. P3 (the failure path)
hangs off each outcome decision, to the left, per the visual language's
"errors hang left" convention — drawn once per decision since the SAME
"[fail]" marker fails a different stage depending on which mode started the
job (MV-E1).

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))          # .../specs/storyboards/mv-creation
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-08-27'

f = Flow('AI Music Video (MV) Creation', 'YouCam Muse Web — desktop 1440',
          version=VERSION, date=DATE, width=1180)
S = f.SPINE
CX = S + 90  # centerline x for diamonds (node_w/2)

f.note(40, 65, 'Storyboard First and Directly branch at the mode chooser and '
               'converge again at /mv/creating — Directly skips /mv/storyboard.')

entry = f.node(S, 100, 'Sidebar "AI Music Video"', kind='entry')
compose = f.node(S, 195, 'Compose', 'type, song (via Trim), description, photo · P1-S1..S8')
f.edge(entry, compose)

guest = f.node(S + 360, 175, 'No active session', 'Sign-in gate opens · P5-S1..S4', kind='aside')
low_balance = f.node(S + 360, 275, 'Balance below cost', 'Buy-credits IAP · P6-S1', kind='aside')
f.elbow(compose, guest, 'guest', kind='deferred', out='right', into='left', gap=90)
f.elbow(compose, low_balance, 'insufficient credits', kind='deferred', out='right', into='left', gap=90)

rail = f.node(30, 195, 'Side rail', 'Trending MVs, or My Creations · P7-S1/S2', kind='aside')

create = f.node(S, 300, 'Tap Create Music Video', 'clears previous MV state · P1-S9', kind='info')
f.edge(compose, create)

# 'Tap Create Music Video' wraps to two title lines and two subtitle lines,
# so it is an 82px box, not the 50px the spine assumes — the diamond used to
# start 14px INSIDE it. Every y below is spaced off the measured height.
mode = f.decision(CX, 440, 'Mode?')
f.edge(create, mode)

think = f.node(S - 260, 520, '/mv/thinking', 'Progress + estimate · P1-S10', kind='info')
f.edge(mode, think, 'Storyboard First')

think_outcome = f.decision(S - 260 + 90, 640, 'Job outcome')
f.edge(think, think_outcome)

sb_editor = f.node(S - 260, 720, '/mv/storyboard', 'Visual style + scenes editable, no Save · P1-S11', kind='success')
f.edge(think_outcome, sb_editor, 'done')

# S - 560 is x = -60: this box was drawn OFF the left edge of the canvas and
# the whole 'Generation Failed' card was simply not in the file. The failure
# branch still hangs left, but at the left margin rather than past it.
think_failed = f.node(30, 740, 'Generation Failed', 'Retry / Back · P3-E2', kind='error')
f.edge(think_outcome, think_failed, '"[fail]" · P3-S1, P3-E2', kind='error')

rendering = f.node(S, 850, '/mv/creating', 'Progress + estimate · P1-S13, P2-S5', kind='info')
f.edge(sb_editor, rendering, 'Generate MV · P1-S12')

direct = f.node(S + 260, 520, 'Directly (Templates only)', 'Enhance NOT offered · P2-S1..S4', kind='info')
f.edge(mode, direct, 'Directly')
f.edge(direct, rendering)

render_outcome = f.decision(CX, 980, 'Job outcome')
f.edge(rendering, render_outcome)

result = f.node(S, 1060, '/mv/result', 'P8: Like, Share, Publish confirm, Recreate, Edit MV · P1-S14', kind='success')
f.edge(render_outcome, result, 'done')

render_failed = f.node(S - 320, 1075, 'Generation Failed', 'Retry / Back · P3-E3', kind='error')
f.edge(render_outcome, render_failed, '"[fail]" · P3-S1, P3-E3', kind='error')

history = f.node(S, 1160, '/history', 'New row, prepended · P1-S15, P2-S6', kind='success')
f.edge(result, history)

f.legend(1290)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
