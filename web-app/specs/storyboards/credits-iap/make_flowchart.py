#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Credits & IAP (S5) storyboard spec.

── WHY THIS IS FIVE BANDS AND NOT ONE FORK (rewritten 2026-09-02) ──────────

The first version's own layout note said it "hangs several branches off ONE
signed-in entry point, like profile-account (S7)". Both diagrams were measured
2026-09-02 and both were broken in the same four ways, because that shape is
what breaks:

  * two pairs of boxes physically overlapped — a `decision()` WIDENS itself to
    fit its label, so 'Open Subscribe or Buy Credits?' and 'Purchase CTA
    label?' each grew across the box beside them after the coordinates were
    chosen;
  * two pairs of edge labels landed on top of each other, and a third sat 70%
    inside a node, because four elbows fanned out of the same port;
  * the intro note was one 1190px line on a 1180px canvas;
  * `height=1360` was passed while the content reached 1373, so the legend's
    last row was cut off.

Each part is now its own band, read left to right, with nothing crossing
anything. The two cross-band jumps — CR-06's redirect into Part 1, and the two
ways into /profile/credits — are a short local node and a note respectively,
rather than long lines back up the diagram (the same convention the Share (S9)
diagram uses, and for the same reason).

`flowchart_lib` now refuses to write a diagram whose boxes collide or fall off
the canvas (`Flow.check()`), and an explicit `height=` can only grow, never
truncate. `skills/yco-spec/check_flowchart.py` re-measures the written file in
a real browser rather than trusting the font-metric estimate.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                  # .../specs/storyboards/credits-iap
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-09-01'
MARGIN = 40
# Narrow enough that the 130px 'pick a card’s Subscribe' label fits in the
# GAP between two columns instead of resting on both boxes: a label that
# only overlaps a node by a few px clears check_flowchart's 12% threshold
# and still reads as broken.
COL_A, COL_B, COL_C = 40, 480, 850
NW = 290

f = Flow('Credits & IAP', 'YouCam Muse Web — desktop 1440 (D8)',
         version=VERSION, date=DATE, width=1180)

f.note(MARGIN, 60, 'Any entry point can open Subscribe or Buy Credits; the fork that matters is '
                   'subscribed-or-not, not which entry point was used.')
f.note(MARGIN, 80, 'Free-user and demo-flag branches hang off that same fork rather than off a '
                   'separate entry. One band per path.')

# ══ Part 1 — subscribe ══════════════════════════════════════════════════════
f.section(150, 'Part 1 — Subscribe  ·  P1')

entry = f.node(COL_A, 180, 'Signed in — any entry point',
               'Header crown/pill · sidebar · Muse Pro row · Credits tile · P1-S1, P4-S1',
               w=NW, kind='entry')
open_dlg = f.decision(600, 300, 'Open Subscribe or Buy Credits?')
f.edge(entry, open_dlg)

# sub_dlg sits under the diamond rather than beside it so this edge is STEEP.
# A 230px label on a shallow line is the one case `edge()` cannot place: the
# line drops further across the label's own width than any perpendicular
# offset can lift it, so the connector is drawn through the text.
sub_dlg = f.node(COL_B, 430, 'SubscribeModal — duration tabs, 2 tiers each',
                 'Weekly/Monthly/Yearly x Basic/Pro · P1-S2..S4', w=NW)
f.edge(open_dlg, sub_dlg, 'Subscribe, or free user taps Buy Credits', kind='primary')

subscribe_ok = f.node(COL_B, 560, 'subscribe(plan) + addCredits(plan)',
                      'Toast "Welcome to Muse Pro!" · P1-S5 (AC-CR-02)', w=NW, kind='success')
f.edge(sub_dlg, subscribe_ok, 'pick a card’s Subscribe')
shell = f.node(COL_C, 560, 'Shell reflects PRO',
               'Sidebar plan name, Muse Pro row, no more crown · P1-S6 (AC-CR-09)', w=NW)
f.edge(subscribe_ok, shell, side='h')

# ══ Part 2 — already subscribed ═════════════════════════════════════════════
f.section(690, 'Part 2 — Reopening Subscribe once PRO  ·  P2')

reopen = f.decision(240, 750, 'Reopen SubscribeModal?')
already = f.node(COL_B, 720, '"You’re already on Muse Pro" + Done',
                 'No plan cards — CR-05 · P2-S1 (AC-CR-06)', w=NW, kind='info')
f.edge(reopen, already, 'yes', side='h')

# ══ Part 3 / Part 4 — buy credits, and the CR-06 redirect ═══════════════════
f.section(840, 'Parts 3 and 4 — Buy Credits, and the free-user redirect  ·  P3, P4')

buy_gate = f.decision(280, 900, 'Buy Credits — subscribed?')
pack_grid = f.node(COL_C, 870, 'BuyCreditsModal — 6 packs, default 2,000',
                   'Discount tags shown, values not specced (TBD-CR-07) · P3-S1', w=NW)
f.edge(buy_gate, pack_grid, 'yes', side='h')
buy_ok = f.node(COL_C, 1010, 'addCredits(pack) + toast', '"Added N credits" · P3-S3 (AC-CR-01)',
                w=NW, kind='success')
f.edge(pack_grid, buy_ok, 'pick a pack, Buy Now')

# Drawn as a local hand-off rather than a line back up to Part 1: a free user
# tapping Buy Credits gets the SubscribeModal itself, with no gate screen.
cr06 = f.node(COL_B, 1010, '→ Part 1: SubscribeModal',
              'CR-06 — renders it directly, no gate screen · P4-S2', w=NW, kind='aside')
f.edge(buy_gate, cr06, 'no', kind='deferred')

# ══ Part 5 — /profile/credits ═══════════════════════════════════════════════
f.section(1150, 'Part 5 — /profile/credits  ·  P5')

f.note(MARGIN, 1170, 'Reached two ways: the shell’s Credits tile (Part 1), or Buy More on the '
                     'Part 3 toast.')

detail = f.node(COL_A, 1200, '/profile/credits', 'Balance + All/Spend/Earn + 7-entry ledger · P5-S1 (AC-CR-03)',
                w=NW)
cta = f.decision(600, 1300, 'Purchase CTA label?')
f.edge(detail, cta, side=('bottom', 'left'))
buymore = f.node(COL_B, 1400, '"Buy More" → BuyCreditsModal', 'Subscriber · P5-S1', w=NW)
# label_dx pushes this one LEFT of its line so it cannot collide with the
# 'not subscribed' label on the branch beside it.
f.edge(cta, buymore, 'subscribed', kind='structural', label_dx=-74)
getpro = f.node(COL_C, 1400, '"Get Muse Pro" → SubscribeModal',
                'Free user, same dialog as P4 · P5-S4 (AC-CR-08)', w=NW, kind='info')
f.edge(cta, getpro, 'not subscribed', kind='deferred', side=('bottom', 'left'))

# ══ Part 6 — the two demo-flag states ═══════════════════════════════════════
f.section(1520, 'Part 6 — ?demo=1 states  ·  P6')

apierr = f.node(COL_A, 1550, 'apiError (?demo=1)',
                '"Something Went Wrong" + Retry, both dialogs · P6-S1..S3 (AC-CR-11)',
                w=NW, kind='error')
emptyledger = f.node(COL_B, 1550, 'creditsEmpty (?demo=1)',
                     '"No activity yet", all 3 tabs · P6-S4, P6-S5 (AC-CR-12)', w=NW, kind='error')

f.note(MARGIN, 1670, 'apiError is checked once per dialog OPEN, on both Subscribe and Buy Credits; '
                     'creditsEmpty applies to /profile/credits only.')
f.note(MARGIN, 1690, '?demo=1 changes what a screen renders, never how it is reached — which is why '
                     'neither has an entry edge of its own.')

f.legend(1760)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
