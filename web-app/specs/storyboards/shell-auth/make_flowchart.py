#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Shell & Auth (S6) storyboard spec.

Layout note: the seven paths collapse to ONE spine because they are all
branches off the same starting point ("any route, signed in or not"), not a
sequence — a user hits exactly one of these on a given visit, never all
seven in order. Errors/dead-ends (dismiss-and-stay, the unreachable account
menu) hang left; structural exits into other specs' territory (S5's Upgrade
dialog, S7's Profile) hang right, per the visual language's own convention.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))          # .../specs/storyboards/shell-auth
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-08-27'

f = Flow('Shell & Auth', 'YouCam Muse Web — desktop 1403×697 AND phone 375×812 (D8 exception)',
          version=VERSION, date=DATE, width=1180)
S = f.SPINE
CX = S + 90

f.note(40, 65, 'Seven branches off one entry point, not a sequence — a visit hits exactly one. '
               'Every "opened, stop" node is another spec\'s territory (S5/S7); this diagram does '
               'not draw past it.')

entry = f.node(S, 100, 'Any route', 'Signed in or not · P1-S1', kind='entry')

# ── P1 — signed-in navigation ────────────────────────────────────────────
navclick = f.decision(CX, 190, 'Nav click?')
f.edge(entry, navclick)
navroute = f.node(S - 260, 280, 'Route changes, active state updates', 'Locale prefix preserved · P1-S2, P1-S3')
f.edge(navclick, navroute, 'signed in, item')
sheet = f.node(S + 300, 280, '"+" create sheet (phone)', 'AI Music Video / AI Song, ungated · P1-S5, P1-S6', kind='aside')
f.elbow(navclick, sheet, 'phone tab bar', kind='deferred', out='right', into='left', gap=90)

# ── P2 — gated nav (History only) ────────────────────────────────────────
guestnav = f.decision(CX, 380, 'Guest clicks History?')
f.edge(navclick, guestnav, 'logged out')
gatedmodal = f.node(S - 260, 470, 'SignInModal, /history queued', 'Sidebar or MobileTabBar · P2-S1, P2-S4')
f.edge(guestnav, gatedmodal, 'sidebar / tab bar')
staygone = f.node(S - 480, 560, 'Dismiss → stay put', 'No redirect · P2-S2, P2-S5', kind='error')
f.elbow(gatedmodal, staygone, 'dismiss', kind='error', out='left', into='right', gap=60)
gatedin = f.node(S - 260, 560, 'Sign in → lands on /history', 'Queued nav runs · P2-S3', kind='success')
f.edge(gatedmodal, gatedin, 'sign in')

# ── P4 — gated route entry (AuthGuard) ───────────────────────────────────
directurl = f.node(S, 380, 'Direct URL: /history /profile /settings', 'Guest · P4-S1', kind='screen')
f.edge(entry, directurl, 'guest, direct')
guardmodal = f.node(S, 470, 'AuthGuard: renders nothing, SignInModal opens', 'No queued action · P4-S1')
f.edge(directurl, guardmodal)
guardhome = f.node(S - 130, 560, 'Dismiss → router.replace(home)', 'Opposite of P2\'s dismiss · P4-S2', kind='error')
f.elbow(guardmodal, guardhome, 'dismiss', kind='error', out='left', into='right', gap=60)
guardin = f.node(S + 130, 560, 'Sign in → SAME url now renders', 'No separate navigation · P4-S3', kind='success')
f.edge(guardmodal, guardin, 'sign in')

# ── P3 — header Sign In (no queued action) ───────────────────────────────
loginbtn = f.node(S, 660, '"Login" button (own-chrome route)', 'RoomNavbar / DetailNavbar / Navbar · P3-S1')
f.edge(entry, loginbtn, 'guest, clicks Login')
loginmodal = f.node(S, 750, 'SignInModal, no queued action', 'P3-S1')
f.edge(loginbtn, loginmodal)
loginsuccess = f.node(S, 840, 'Same page, logged-in cluster', 'Credit pill + Upgrade (if !subscribed) · P3-S2', kind='success')
f.edge(loginmodal, loginsuccess, 'sign in')

# ── P5 — account entry points (no menu) ──────────────────────────────────
account = f.decision(CX, 940, 'Account control?')
f.edge(loginsuccess, account)
credit = f.node(S + 330, 940, 'Credit pill → "Upgrade Your Plan"', 'S5\'s territory · P5-S1', kind='aside')
f.elbow(account, credit, 'credit pill', kind='deferred', out='right', into='left', gap=90)
profile = f.node(S + 330, 1020, 'Sidebar footer → /profile', 'S7\'s territory · P5-S2, P5-S4', kind='aside')
f.elbow(account, profile, 'profile footer', kind='deferred', out='right', into='left', gap=90)
deadmenu = f.node(S - 330, 980, 'No menu exists', 'DOM-swept, 5 routes · P5-S3', kind='error')
f.elbow(account, deadmenu, 'avatar / menu?', kind='error', out='left', into='right', gap=90)

# ── P6 — sign out + reload ────────────────────────────────────────────────
signout = f.node(S, 1120, 'Settings → Sign Out', 'Only reachable entry point · P6-S1')
f.edge(account, signout)
guestchrome = f.node(S, 1210, 'Guest chrome, routed Home', 'P6-S2', kind='success')
f.edge(signout, guestchrome)
resub = f.node(S, 1300, 'Sign back in + subscribe', 'P6-S3')
f.edge(guestchrome, resub)
reload = f.node(S, 1390, 'Full reload', 'loggedIn persists, subscribed/profile reset · P6-S4 (AUTH-E1)', kind='info')
f.edge(resub, reload)

# ── P7 — bare page ────────────────────────────────────────────────────────
bare = f.node(S - 480, 100, '/share…', 'No sidebar, no top bar · P7-S1', kind='aside')
f.elbow(entry, bare, 'path starts /share', kind='deferred', out='left', into='left', gap=60)

f.legend(1470)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
