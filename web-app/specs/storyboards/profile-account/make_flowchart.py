#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Profile, Account &amp; Settings (S7)
storyboard spec.

Layout note: like mv-edit, six branches hang off ONE entry point
("/profile, signed in") because a real visit does not walk P1-P6 in
sequence — a user lands on the hub, then touches whichever rows they touch,
in whatever order. Settings and Send Feedback are drawn as their own
sub-spines because each has its own internal branching (Settings: Terms/
Privacy vs. the two Unsubscribe variants vs. Delete; Feedback: the form ->
submit -> success/error). The logged-out gate (P6) is a separate entry point,
not a branch off the signed-in one — it can only be reached WITHOUT a session.

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

f = Flow('Profile, Account & Settings', 'YouCam Muse Web — desktop 1403×697 (D8)',
          version=VERSION, date=DATE, width=1180, height=1200)
S = f.SPINE
CX = S + 90

f.note(40, 65, 'Six branches off one signed-in entry point, not a sequence — a visit touches '
               'whichever rows it touches. Every "not captured" node is another spec\'s '
               'territory (S5/S6/area 04); this diagram does not draw past it.')

entry = f.node(S, 100, '/profile', 'Signed in, auth-gated · P1-S1, P1-S2', kind='entry')

# ── P1 — tiles (name destinations only) ──────────────────────────────────
tiles = f.node(S - 480, 100, 'Credits / MVs / Songs tiles', 'Destinations named, not toured · P1-S1', kind='aside')
f.elbow(entry, tiles, 'tap a tile', kind='deferred', out='left', into='right', gap=60)

# ── P2 — edit profile ─────────────────────────────────────────────────────
edit = f.decision(CX, 190, 'Edit Profile?')
f.edge(entry, edit)
editdone = f.node(S - 260, 280, 'Name/avatar updated, toast', 'In-memory only · P2-S3 (AC-PROF-03)')
f.edge(edit, editdone, 'Save')

# ── P3 — Muse Pro & Language ─────────────────────────────────────────────
pro = f.decision(CX, 380, 'Muse Pro tap?')
f.edge(entry, pro)
iap = f.node(S - 260, 470, 'SubscribeModal', 'S5, on hold — not captured · P3-S1', kind='error')
f.elbow(pro, iap, 'not subscribed', kind='deferred', out='left', into='right', gap=60)
creditsdetail = f.node(S + 330, 470, '/profile/credits', 'S5 — named, not toured · P3-S2', kind='aside')
f.elbow(pro, creditsdetail, 'subscribed', kind='deferred', out='right', into='left', gap=90)

lang = f.decision(CX, 560, 'Change Language?')
f.edge(entry, lang)
langdone = f.node(S - 260, 650, 'URL + Language subtitle update', 'Rest of screen stays English · P3-S4 (AC-PROF-05)', w=250)
f.edge(lang, langdone, 'pick a locale')

# ── P4 — settings ─────────────────────────────────────────────────────────
settings = f.node(S, 740, '/settings', 'P4-S1', kind='screen')
f.edge(entry, settings, 'Settings row')

legal = f.node(S - 480, 830, 'Terms / Privacy', 'Real links, new tab · P4-S1 (AC-PROF-09)', kind='aside')
f.elbow(settings, legal, 'tap', kind='deferred', out='left', into='right', gap=60)

unsub = f.decision(CX, 830, 'Unsubscribe tap?')
f.edge(settings, unsub)
unsubtoast = f.node(S - 260, 920, 'Confirm -> demo toast', 'subscribed unchanged · P4-S2, P4-S3 (AC-PROF-07)', w=230)
f.elbow(unsub, unsubtoast, 'subOnApp off (default)', kind='structural', out='left', into='right', gap=60)
unsubphone = f.node(S + 330, 920, 'Manage-on-your-phone dialog', 'D11 correction · P4-S6', kind='error', w=230)
f.elbow(unsub, unsubphone, 'subOnApp on (?demo=1)', kind='deferred', out='right', into='left', gap=90)

delete = f.decision(CX, 1010, 'Delete Account tap?')
f.edge(settings, delete)
deletedone = f.node(S - 260, 1100, 'Demo toast -> Home', 'Nothing deleted · P4-S5 (AC-PROF-07)', kind='success')
f.edge(delete, deletedone, 'confirm')

signout = f.node(S + 330, 1010, 'Sign Out row', 'Flow owned by S6 · P4-S1 (AC-PROF-06)', kind='aside')
f.elbow(settings, signout, 'row shown', kind='deferred', out='right', into='left', gap=90)

# ── P5 — send feedback ────────────────────────────────────────────────────
fb = f.node(S, 1150, 'Send Feedback', 'FORM: Type -> Description -> Attachment -> Email · P5-S1', kind='screen')
f.edge(entry, fb, 'Send Feedback row')

send = f.decision(CX, 1240, 'Send (valid form)?')
f.edge(fb, send)
sent = f.node(S - 260, 1330, 'Feedback Sent + Done', 'No toast · P5-S7 (AC-PROF-13)', kind='success')
f.edge(send, sent, 'resolves')
fberr = f.node(S + 330, 1330, 'Inline error, draft preserved', 'Not reachable in this build · P5-E9 (Q-02)', kind='error')
f.elbow(send, fberr, 'rejects (undemonstrable)', kind='deferred', out='right', into='left', gap=90)

toolarge = f.node(S - 480, 1240, 'Attachment refused whole', '5 MB cumulative · P5-S6 (AC-PROF-15)', kind='error')
f.elbow(fb, toolarge, 'pick > budget', kind='error', out='left', into='right', gap=60)

# ── P6 — logged-out gate (separate entry point) ──────────────────────────
gate = f.node(S, 1150 + 260, '/settings, logged out', 'Separate entry — no session · P6-S1', kind='entry')
signin = f.node(S + 330, 1150 + 260, 'Sign-in modal; dismiss -> Home', 'AC-PROF-17', kind='error')
f.elbow(gate, signin, 'AuthGuard', kind='error', out='right', into='left', gap=90)

f.legend(1730)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
