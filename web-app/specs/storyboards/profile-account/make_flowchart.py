#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Profile, Account & Settings (S7)
storyboard spec.

── WHY THIS IS SEVEN BANDS AND NOT ONE SPINE (rewritten 2026-09-02) ────────

The layout note used to say "like mv-edit, six branches hang off ONE entry
point", and that is precisely what made both diagrams unreadable. Six branches
off one box means six bottom→top edges leaving the same port and running down
the same x — so each one is drawn straight THROUGH every diamond between it
and its target, and the boxes themselves were spaced as if they were 50px tall
when four of them wrap to 65–82px.

Measured 2026-09-02 before the rewrite: four pairs of boxes physically
overlapped, one edge label sat entirely inside a node, and — because
`height=1200` was passed while the content reached y=1873 — the whole bottom
third of the diagram (P5's Send Feedback path, P6, and the legend) was not in
the file at all. Nothing failed; the SVG was valid, just truncated.

A visit does not walk P1–P6 in sequence, so a spine was the wrong shape from
the start. Each part is now its own band, read left to right, and Part 4 is
split across two bands because /settings has two independent decisions and a
second one cannot be reached without crossing the first. Every band starts
from the screen its heading names; the note under Part 1 says so once, rather
than six edges asserting it and colliding while they do.

`flowchart_lib` now refuses to write a diagram whose boxes collide or fall off
the canvas (`Flow.check()`), and an explicit `height=` can only grow, never
truncate. `skills/yco-spec/check_flowchart.py` is the same check measured in a
real browser rather than estimated from font metrics.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                  # .../specs/storyboards/profile-account
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-08-31'
MARGIN = 40
COL_A, COL_B, COL_C = 40, 480, 820   # lead-in · middle outcome · right outcome
NW = 300

f = Flow('Profile, Account & Settings', 'YouCam Muse Web — desktop 1403×697 (D8)',
         version=VERSION, date=DATE, width=1180)

f.note(MARGIN, 65, 'Six branches off one signed-in entry point, not a sequence — a visit touches '
                   'whichever rows it touches.')
f.note(MARGIN, 85, 'Every "not captured" node is another spec’s territory (S5/S6/area 04); this '
                   'diagram does not draw past it.')

# ══ Part 1 — the hub ════════════════════════════════════════════════════════
f.section(150, 'Part 1 — /profile, signed in  ·  P1')

entry = f.node(COL_A, 180, '/profile', 'Signed in, auth-gated · P1-S1, P1-S2', w=NW, kind='entry')
tiles = f.node(COL_C, 180, 'Credits / MVs / Songs tiles', 'Destinations named, not toured · P1-S1',
               w=NW, kind='aside')
f.edge(entry, tiles, 'tap a tile', kind='deferred', side='h')

f.note(MARGIN, 262, 'Parts 2–5 below each START from this screen. They are branches off it, '
                    'not steps after it.')

# ══ Part 2 — edit profile ═══════════════════════════════════════════════════
f.section(320, 'Part 2 — Edit Profile  ·  P2')

edit = f.decision(200, 380, 'Edit Profile?')
editdone = f.node(COL_C, 350, 'Name/avatar updated, toast', 'In-memory only · P2-S3 (AC-PROF-03)',
                  w=NW)
f.edge(edit, editdone, 'Save', side='h')

# ══ Part 3 — Muse Pro, credits, language ════════════════════════════════════
f.section(450, 'Part 3 — Muse Pro and Language  ·  P3')

pro = f.decision(200, 510, 'Muse Pro tap?')
iap = f.node(COL_B, 480, 'SubscribeModal', 'S5, on hold — not captured · P3-S1', w=NW, kind='error')
f.edge(pro, iap, 'not subscribed', kind='deferred', side='h')
creditsdetail = f.node(COL_C, 570, '/profile/credits', 'S5 — named, not toured · P3-S2',
                       w=NW, kind='aside')
f.edge(pro, creditsdetail, 'subscribed', kind='deferred', side=('bottom', 'left'))

lang = f.decision(200, 680, 'Change Language?')
langdone = f.node(COL_C, 660, 'URL + Language subtitle update',
                  'Rest of screen stays English · P3-S4 (AC-PROF-05)', w=NW)
f.edge(lang, langdone, 'pick a locale', side='h')

# ══ Part 4a — /settings: Terms, Sign Out, Unsubscribe ═══════════════════════
f.section(770, 'Part 4 — /settings: Terms, Sign Out, Unsubscribe  ·  P4')

settings = f.node(COL_A, 800, '/settings', 'P4-S1', w=NW, kind='screen')
legal = f.node(COL_C, 800, 'Terms / Privacy', 'Real links, new tab · P4-S1 (AC-PROF-09)',
               w=NW, kind='aside')
f.edge(settings, legal, 'tap', kind='deferred', side='h')
signout = f.node(COL_C, 900, 'Sign Out row', 'Flow owned by S6 · P4-S1 (AC-PROF-06)',
                 w=NW, kind='aside')
f.edge(settings, signout, 'row shown', kind='deferred', side=('bottom', 'left'))

unsub = f.decision(200, 950, 'Unsubscribe tap?')
f.edge(settings, unsub)
unsubtoast = f.node(COL_B, 930, 'Confirm -> demo toast',
                    'subscribed unchanged · P4-S2, P4-S3 (AC-PROF-07)', w=NW)
f.edge(unsub, unsubtoast, 'subOnApp off (default)', kind='structural', side='h')
unsubphone = f.node(COL_C, 1060, 'Manage-on-your-phone dialog', 'D11 correction · P4-S6',
                    w=NW, kind='error')
f.edge(unsub, unsubphone, 'subOnApp on (?demo=1)', kind='deferred', side=('bottom', 'left'))

# ══ Part 4b — /settings: Delete Account ═════════════════════════════════════
# Its own band: the second decision on /settings cannot be reached from the
# same box without the edge crossing the first one.
f.section(1180, 'Part 4 (continued) — /settings: Delete Account  ·  P4')

delete = f.decision(200, 1250, 'Delete Account tap?')
deletedone = f.node(COL_B, 1220, 'Demo toast -> Home', 'Nothing deleted · P4-S5 (AC-PROF-07)',
                    w=NW, kind='success')
f.edge(delete, deletedone, 'confirm', side='h')

# ══ Part 5 — send feedback ══════════════════════════════════════════════════
f.section(1350, 'Part 5 — Send Feedback  ·  P5')

fb = f.node(COL_A, 1380, 'Send Feedback', 'FORM: Type -> Description -> Attachment -> Email · P5-S1',
            w=NW, kind='screen')
toolarge = f.node(COL_C, 1380, 'Attachment refused whole', '5 MB cumulative · P5-S6 (AC-PROF-15)',
                  w=NW, kind='error')
f.edge(fb, toolarge, 'pick > budget', kind='error', side='h')

send = f.decision(200, 1530, 'Send (valid form)?')
f.edge(fb, send)
sent = f.node(COL_B, 1500, 'Feedback Sent + Done', 'No toast · P5-S7 (AC-PROF-13)',
              w=NW, kind='success')
f.edge(send, sent, 'resolves', side='h')
fberr = f.node(COL_C, 1600, 'Inline error, draft preserved', 'Not reachable in this build · P5-E9 (Q-02)',
               w=NW, kind='error')
f.edge(send, fberr, 'rejects (undemonstrable)', kind='deferred', side=('bottom', 'left'))

# ══ Part 6 — the logged-out gate, a SEPARATE entry point ════════════════════
f.section(1710, 'Part 6 — /settings with no session  ·  P6')

gate = f.node(COL_A, 1740, '/settings, logged out', 'Separate entry — no session · P6-S1',
              w=NW, kind='entry')
signin = f.node(COL_C, 1740, 'Sign-in modal; dismiss -> Home', 'AC-PROF-17', w=NW, kind='error')
f.edge(gate, signin, 'AuthGuard', kind='error', side='h')

f.legend(1870)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
