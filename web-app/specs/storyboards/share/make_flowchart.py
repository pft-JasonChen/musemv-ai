#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Share (S9) storyboard spec.

Layout note. This one IS close to a sequence, and it is drawn as two halves
meeting in the middle: the SENDER half (a Share control anywhere in the app
opens the dialog, which mints a link) and the RECIPIENT half (that link, or
the legacy form of it, resolves to media or to the unavailable state). The
resolution order is the branch that matters, so it gets a decision node with
its four sources spelled out rather than one arrow labelled "resolves".

The two panels are separate nodes because they are genuinely different
screens: only one of them shows a title and a creator, and only one has a
More menu.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                  # .../specs/storyboards/share
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-09-01'

f = Flow('Share', 'YouCam Muse Web — desktop 1440 (D8)',
         version=VERSION, date=DATE, width=1180, height=1180)
S = f.SPINE
CX = S + 90

f.note(40, 58,
       'Two halves. The SENDER mints a link from a dialog that is the same on every screen that '
       'offers it; the RECIPIENT opens that link with no account and no app chrome. Links do not '
       'expire — the unavailable state means an id that did not resolve, nothing else.')

# ── sender half ─────────────────────────────────────────────────────────────
share_btn = f.node(S, 118, 'A Share control anywhere in the app',
                   'MV / song result and player screens — their entry points are captured by S8', w=340, kind='entry')
dialog = f.node(S, 205, 'Share dialog — a read-only link and Copy',
                'No social targets, no native share · P5-S2 (AC-SHARE-04)', w=340)
f.edge(share_btn, dialog)

copied = f.node(S + 340, 205, 'Copied! for 1.5s, then reverts',
                'The clipboard holds the same link · P5-S3', w=280, kind='success')
f.elbow(dialog, copied, 'Copy', kind='structural', out='right', into='left', gap=50)

# ── recipient half ──────────────────────────────────────────────────────────
legacy = f.node(S - 400, 300, 'The legacy MV share URL',
                'Server redirect, language prefix kept · P5-S1 (AC-SHARE-03)', w=290, kind='aside')

page = f.node(S, 320, '/share?id= — bare, public, no app chrome',
              'No sidebar, no tab bar, no navbar · P1-S1 (AC-SHARE-01)', w=380)
f.edge(dialog, page, 'the recipient opens the link')
f.elbow(legacy, page, 'redirects to', kind='structural', out='right', into='left', gap=50)

resolve = f.decision(CX, 415, 'Does the id resolve?')
f.edge(page, resolve)

kind = f.decision(S - 260, 510, 'Which kind of media?')
f.elbow(resolve, kind, 'community item · a History sample · your own completed creation',
        kind='primary', out='left', into='top', gap=60)

mv = f.node(S - 520, 610, 'MV panel — video + controller',
            'NO title, NO creator · P1-S1, P1-S2', w=280, kind='info')
f.elbow(kind, mv, 'a music video', kind='structural', out='left', into='right', gap=50)

song = f.node(S - 160, 610, 'Song panel — art, title, creator, controller',
              'The only panel that identifies its media · P3-S1', w=300, kind='info')
f.edge(kind, song, 'a song')

more = f.node(S - 520, 720, 'More: Download · Playback Speed · Picture in Picture',
              'Speed cycles and the menu stays open · P2-S1, P2-S2', w=320, kind='info')
f.elbow(mv, more, 'More', kind='structural', out='left', into='top', gap=50)

actions = f.node(S - 340, 820, 'Two pills: Download, and Create',
                 'Create is kind-specific in LABEL only — both go home · P1-S3, P3-S3', w=340)
f.edge(mv, actions, 'always present', side='right')
f.edge(song, actions, 'always present')

home = f.node(S - 340, 920, 'The home page',
              'The logo, and both Create pills, land here · P1-S4', w=290, kind='success')
f.edge(actions, home, 'Create')

# ── the unavailable branch ──────────────────────────────────────────────────
gone = f.node(S + 330, 510, 'This link isn’t available',
              'Unresolvable id · no id at all · ?type=expired · P4-S1..S3 (AC-SHARE-02)',
              w=330, kind='error')
f.elbow(resolve, gone, 'no — and there is no expiry rule behind it',
        kind='error', out='right', into='top', gap=60)
f.elbow(gone, home, 'the header logo', kind='structural', out='right', into='right', gap=40)

live = f.node(S + 330, 640, 'A LIVE own creation, opened in a fresh tab',
              'Resolves from memory only, so it lands here too · P4-S4', w=330, kind='error')
f.edge(live, gone, 'no server-side resolution yet')

f.legend(1020)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
