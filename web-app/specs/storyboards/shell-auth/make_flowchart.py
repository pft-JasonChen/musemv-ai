#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Shell & Auth (S6) storyboard spec.

── WHY THIS IS SEVEN BANDS AND NOT ONE SPINE (rewritten 2026-09-02) ────────

The old layout note said "the seven paths collapse to ONE spine because they
are all branches off the same starting point". They do share a starting point,
and that is exactly the argument for NOT drawing them on one spine: seven
branches leaving one port means seven edges down the same x, each drawn
through whatever sits between it and its target.

Measured 2026-09-02 before the rewrite: three pairs of boxes overlapped
outright (a `decision()` widens itself to fit its label, so 'Guest clicks
History?' grew across the box beside it after its coordinates were picked),
one node's title escaped its own box, and two edge labels sat on top of nodes —
one of them 92% covered, i.e. simply unreadable. None of it failed a build,
because an SVG has no layout engine to complain to.

A visit hits exactly one of these paths, so the bands are the honest shape:
one per path, read left to right, and where a path is reached from an earlier
one the band heading and a note say so instead of a long line back up the page.

`flowchart_lib` now refuses to write a diagram whose boxes collide or fall off
the canvas (`Flow.check()`); `skills/yco-spec/check_flowchart.py` re-measures
the written file in a real browser rather than trusting font-metric estimates.

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
MARGIN = 40
COL_A, COL_B, COL_C = 40, 470, 830
NW = 310

f = Flow('Shell & Auth', 'YouCam Muse Web — desktop 1403×697 AND phone 375×812 (D8 exception)',
         version=VERSION, date=DATE, width=1180)

f.note(MARGIN, 65, 'Seven branches off one entry point, not a sequence — a visit hits exactly one. '
                   'Every "opened, stop" node is')
f.note(MARGIN, 85, 'another spec’s territory (S5/S7); this diagram does not draw past it. One band '
                   'per path.')

# ══ Part 1 — signed-in navigation ═══════════════════════════════════════════
f.section(150, 'Part 1 — Navigating the shell  ·  P1')

entry = f.node(COL_A, 180, 'Any route', 'Signed in or not · P1-S1', w=NW, kind='entry')
navclick = f.decision(600, 300, 'Nav click?')
f.edge(entry, navclick)

navroute = f.node(COL_A, 400, 'Route changes, active state updates',
                  'Locale prefix preserved · P1-S2, P1-S3', w=NW)
f.edge(navclick, navroute, 'signed in, item')
sheet = f.node(COL_C, 400, '"+" create sheet (phone)', 'AI Music Video / AI Song, ungated · P1-S5, P1-S6',
               w=NW, kind='aside')
f.edge(navclick, sheet, 'phone tab bar', kind='deferred')

# ══ Part 2 — gated nav (History is the only gated item) ═════════════════════
f.section(500, 'Part 2 — A guest clicks History  ·  P2')

f.note(MARGIN, 520, 'Reached from Part 1’s nav click while logged out. History is the only gated '
                    'nav item.')

guestnav = f.decision(240, 580, 'Guest clicks History?')
gatedmodal = f.node(COL_C, 550, 'SignInModal, /history queued', 'Sidebar or MobileTabBar · P2-S1, P2-S4',
                    w=NW)
f.edge(guestnav, gatedmodal, 'sidebar / tab bar', side='h')
staygone = f.node(COL_B, 660, 'Dismiss → stay put', 'No redirect · P2-S2, P2-S5', w=NW, kind='error')
f.edge(gatedmodal, staygone, 'dismiss', kind='error', side=('bottom', 'right'))
gatedin = f.node(COL_C, 660, 'Sign in → lands on /history', 'Queued nav runs · P2-S3', w=NW, kind='success')
f.edge(gatedmodal, gatedin, 'sign in')

# ══ Part 4 — a guest opens a gated route directly ═══════════════════════════
f.section(760, 'Part 4 — Direct URL to a gated route (AuthGuard)  ·  P4')

directurl = f.node(COL_A, 790, 'Direct URL: /history /profile /settings', 'Guest · P4-S1', w=NW)
guardmodal = f.node(COL_B, 790, 'AuthGuard: renders nothing, SignInModal opens', 'No queued action · P4-S1',
                    w=NW)
f.edge(directurl, guardmodal, side='h')
guardhome = f.node(COL_A, 920, 'Dismiss → router.replace(home)', 'Opposite of P2’s dismiss · P4-S2',
                   w=NW, kind='error')
f.edge(guardmodal, guardhome, 'dismiss', kind='error')
guardin = f.node(COL_B, 920, 'Sign in → SAME url now renders', 'No separate navigation · P4-S3',
                 w=NW, kind='success')
f.edge(guardmodal, guardin, 'sign in')

# ══ Part 3 — the header Sign In, with nothing queued ════════════════════════
f.section(1020, 'Part 3 — Header Login, no queued action  ·  P3')

loginbtn = f.node(COL_A, 1050, '"Login" button (own-chrome route)',
                  'RoomNavbar / DetailNavbar / Navbar · P3-S1', w=NW)
loginmodal = f.node(COL_B, 1050, 'SignInModal, no queued action', 'P3-S1', w=NW)
f.edge(loginbtn, loginmodal, side='h')
loginsuccess = f.node(COL_B, 1170, 'Same page, logged-in cluster',
                      'Credit pill + Upgrade (if !subscribed) · P3-S2', w=NW, kind='success')
f.edge(loginmodal, loginsuccess, 'sign in')

# ══ Part 5 — the account controls, and the menu that does not exist ═════════
f.section(1290, 'Part 5 — Account entry points  ·  P5')

account = f.decision(240, 1350, 'Account control?')
credit = f.node(COL_B, 1320, 'Credit pill → "Upgrade Your Plan"', 'S5’s territory · P5-S1',
                w=NW, kind='aside')
f.edge(account, credit, 'credit pill', kind='deferred', side='h')
profile = f.node(COL_C, 1440, 'Sidebar footer → /profile', 'S7’s territory · P5-S2, P5-S4',
                 w=NW, kind='aside')
f.edge(account, profile, 'profile footer', kind='deferred', side=('bottom', 'left'))
deadmenu = f.node(COL_A, 1470, 'No menu exists', 'DOM-swept, 5 routes · P5-S3', w=NW, kind='error')
f.edge(account, deadmenu, 'avatar / menu?', kind='error')

# ══ Part 6 — sign out, sign back in, reload ═════════════════════════════════
f.section(1590, 'Part 6 — Sign Out and the reload reset  ·  P6')

signout = f.node(COL_A, 1620, 'Settings → Sign Out', 'Only reachable entry point · P6-S1', w=NW)
guestchrome = f.node(COL_B, 1620, 'Guest chrome, routed Home', 'P6-S2', w=NW, kind='success')
f.edge(signout, guestchrome, side='h')
resub = f.node(COL_C, 1620, 'Sign back in + subscribe', 'P6-S3', w=NW)
f.edge(guestchrome, resub, side='h')
reload = f.node(COL_C, 1730, 'Full reload', 'loggedIn persists, subscribed/profile reset · P6-S4 (AUTH-E1)',
                w=NW, kind='info')
f.edge(resub, reload)

# ══ Part 7 — the bare page ══════════════════════════════════════════════════
f.section(1860, 'Part 7 — A path that starts /share  ·  P7')

bare = f.node(COL_A, 1890, '/share…', 'No sidebar, no top bar · P7-S1', w=NW, kind='aside')
f.note(COL_B, 1915, 'The shell draws no chrome at all — S9 owns everything on that page.')

f.legend(2020)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
