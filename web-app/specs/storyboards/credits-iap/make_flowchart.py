#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Credits & IAP (S5) storyboard spec.

Layout note: like profile-account (S7), the diagram hangs several branches off
ONE signed-in entry point rather than drawing P1..P6 as a strict sequence -- a
real visit touches whichever entry point it touches (header pill, sidebar
crown, the Muse Pro row, the Credits tile), not all of them in order. The
already-Pro state (P2) and the free-user redirect (P4) are drawn as decision
outcomes off the SAME "open a purchase dialog" fork, because that fork -- not
subscription status -- is the one branch point the two paths share. The two
demo-flag error/empty states (P6) hang off their own dialogs/route rather than
off a separate entry, since `?demo=1` does not change how a screen is reached,
only what it renders once open.

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

f = Flow('Credits & IAP', 'YouCam Muse Web — desktop 1440 (D8)',
          version=VERSION, date=DATE, width=1180, height=1360)
S = f.SPINE
CX = S + 90

f.note(40, 60, 'Any entry point can open Subscribe or Buy Credits; the fork that matters is '
               'subscribed-or-not, not which entry point was used. Free-user and demo-flag '
               'branches hang off that same fork rather than off a separate entry.')

entry = f.node(S, 105, 'Signed in — any entry point', 'Header crown/pill · sidebar · Muse Pro row · Credits tile · P1-S1, P4-S1', w=340)

# ── P1/P4 — open a purchase dialog: the CR-06 fork ──────────────────────────
open_dlg = f.decision(CX, 200, 'Open Subscribe or Buy Credits?')
f.edge(entry, open_dlg)

sub_dlg = f.node(S - 480, 290, 'SubscribeModal — duration tabs, 2 tiers each', 'Weekly/Monthly/Yearly x Basic/Pro · P1-S2..S4', w=280)
f.elbow(open_dlg, sub_dlg, 'Subscribe, or free user taps Buy Credits', kind='primary', out='left', into='right', gap=60)

buy_gate = f.decision(CX, 290, 'Buy Credits — subscribed?')
f.elbow(open_dlg, buy_gate, 'Buy Credits tapped', kind='structural', out='right', into='top', gap=40)
f.elbow(buy_gate, sub_dlg, 'no (CR-06) — renders SubscribeModal, no gate screen · P4-S2', kind='deferred', out='left', into='right', gap=90)

pack_grid = f.node(S + 330, 290, 'BuyCreditsModal — 6 packs, default 2,000', 'Discount tags shown, values not specced (TBD-CR-07) · P3-S1', w=280)
f.edge(buy_gate, pack_grid, 'yes')

# ── P1 — subscribe outcome ───────────────────────────────────────────────────
subscribe_ok = f.node(S - 480, 400, 'subscribe(plan) + addCredits(plan)', 'Toast "Welcome to Muse Pro!" · P1-S5 (AC-CR-02)', w=280, kind='success')
f.edge(sub_dlg, subscribe_ok, 'pick a card’s Subscribe')

shell = f.node(S - 480, 490, 'Shell reflects PRO', 'Sidebar plan name, Muse Pro row, no more crown · P1-S6 (AC-CR-09)', w=280)
f.edge(subscribe_ok, shell)

# ── P2 — already subscribed ─────────────────────────────────────────────────
reopen = f.decision(S - 260, 590, 'Reopen SubscribeModal?')
f.edge(shell, reopen)
already = f.node(S - 480, 680, '"You’re already on Muse Pro" + Done', 'No plan cards — CR-05 · P2-S1 (AC-CR-06)', w=280, kind='info')
f.edge(reopen, already, 'yes')

# ── P3 — buy credits outcome ─────────────────────────────────────────────────
buy_ok = f.node(S + 330, 400, 'addCredits(pack) + toast', '"Added N credits" · P3-S3 (AC-CR-01)', w=280, kind='success')
f.edge(pack_grid, buy_ok, 'pick a pack, Buy Now')

# ── P5 — /profile/credits ────────────────────────────────────────────────────
detail = f.node(S, 800, '/profile/credits', 'Balance + All/Spend/Earn + 7-entry ledger · P5-S1 (AC-CR-03)')
f.edge(shell, detail, 'Credits tile')
f.edge(buy_ok, detail, 'Buy More CTA', side='right')

cta = f.decision(CX, 890, 'Purchase CTA label?')
f.edge(detail, cta)
buymore = f.node(S - 260, 980, '"Buy More" → BuyCreditsModal', 'Subscriber · P5-S1', w=250)
f.elbow(cta, buymore, 'subscribed', kind='structural', out='left', into='right', gap=60)
getpro = f.node(S + 330, 980, '"Get Muse Pro" → SubscribeModal', 'Free user, same dialog as P4 · P5-S4 (AC-CR-08)', w=250, kind='info')
f.elbow(cta, getpro, 'not subscribed', kind='deferred', out='right', into='left', gap=90)

# ── P6 — demo-flag states ────────────────────────────────────────────────────
apierr = f.node(S - 480, 1090, 'apiError (?demo=1)', '"Something Went Wrong" + Retry, both dialogs · P6-S1..S3 (AC-CR-11)', w=300, kind='error')
f.elbow(sub_dlg, apierr, 'flag on — checked once per open', kind='error', out='left', into='top', gap=60)
f.elbow(pack_grid, apierr, 'flag on, subscriber only', kind='error', out='right', into='top', gap=180)

emptyledger = f.node(S + 330, 1090, 'creditsEmpty (?demo=1)', '"No activity yet", all 3 tabs · P6-S4, P6-S5 (AC-CR-12)', w=300, kind='error')
f.elbow(detail, emptyledger, 'flag on', kind='error', out='right', into='top', gap=60)

f.legend(1230)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
