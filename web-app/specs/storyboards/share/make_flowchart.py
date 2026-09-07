#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Share (S9) storyboard spec.

── WHY THIS IS FIVE BANDS AND NOT ONE GRAPH (rewritten 2026-09-01) ─────────

The first version drew the sender and recipient halves as one connected graph
and rendered wrong: two nodes were placed at negative x and were clipped off
the canvas, one edge left the right margin and wrapped back in, two labels
landed on top of each other, and the bottom legend was cut off. None of that
fails a build — `flowchart_lib` draws wherever it is told, `decision()`
silently widens itself to fit its text, and `legend()` needs 20px of clear
canvas per edge kind BELOW the y it is given. The only way to see any of it is
to render the SVG and look at the picture.

So: one band per path, using the library's own `section()`. Each band is a
short left-to-right run well inside the margins, and the two cross-band jumps
(the dialog's link into Part 1, the legacy URL's redirect) are drawn as short
local edges rather than as long lines across the whole diagram.

`assert_in_canvas()` is the guard that would have caught the first version.
Every node goes through `place()`, and `write()` is only reached once all of
them are inside the margins — it fails the build rather than warning, because
a clipped node looks like a deliberate half-drawn box.

Nothing here cites another spec's step IDs, and that is a build gate rather
than a style choice: the SVG is inlined into spec.html, so a bare `Pn-Sn`
drawn here is cross-reference-checked against THIS spec's own steps, and a
neighbouring spec's ID resolves to nothing and fails the build. Name the
neighbouring spec, never its step IDs.

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
W, H = 1280, 1860
MARGIN = 40

f = Flow('Share', 'YouCam Muse Web — desktop 1440 (D8)',
         version=VERSION, date=DATE, width=W, height=H)

_placed = []


def place(x, y, *a, **kw):
    n = f.node(x, y, *a, **kw)
    _placed.append((a[0] if a else kw.get('title', '?'), n))
    return n


def decide(cx, cy, title, **kw):
    n = f.decision(cx, cy, title, **kw)
    _placed.append((title, n))
    return n


def assert_in_canvas():
    bad = [f'{t!r} spans x {n.x:g}..{n.x + n.w:g}, y {n.y:g}..{n.y + n.h:g}'
           for t, n in _placed
           if n.x < MARGIN or n.x + n.w > W - MARGIN or n.y < 0 or n.y + n.h > H]
    if bad:
        raise SystemExit('nodes outside the canvas:\n  ' + '\n  '.join(bad))


f.note(MARGIN, 100,
       'Two halves. The SENDER mints a link from a dialog that is identical on every screen offering it;')
f.note(MARGIN, 120,
       'the RECIPIENT opens that link with no account and no app chrome. Drawn as one band per path.')
f.note(MARGIN, 140,
       'Links DO NOT EXPIRE — the unavailable state means an id that did not resolve, and nothing else.')

# ══ Part 1 — a valid MV link ════════════════════════════════════════════════
f.section(210, 'Part 1 — A valid MV link  ·  P1')

link = place(MARGIN, 240, '/share?id=  — bare and public',
             'No sidebar, tab bar, header or navbar · P1-S1 (AC-SHARE-01)', w=340, kind='entry')
panel = place(470, 240, 'MV panel — video + controller',
              'NO title and NO creator — deliberate, D-08 · P1-S1', w=340, kind='info')
f.edge(link, panel, side='h')

controls = place(900, 240, 'Play · elapsed / total · seek · mute · fullscreen · More',
                 'The product’s own controls, not the browser’s · P1-S2', w=340, kind='info')
f.edge(panel, controls, side='h')

pills = place(470, 370, 'Two pills: Download, and a neutral Create',
              'One label for both kinds; only the gradient differs · P1-S3 (AC-SHARE-07)', w=340)
f.edge(panel, pills)

sources = place(900, 370, 'Four resolution sources, in order',
                'Community MV · community song · your own completed creation · the samples · P1-S4',
                w=340, kind='info')
f.edge(pills, sources, side='h')

home = place(MARGIN, 370, 'The home page',
             'Where the pill says it goes — never a create flow · P1-S3', w=340, kind='success')
f.edge(pills, home, 'Create', kind='primary', side=('left', 'right'))

# ══ Part 2 — the More menu ══════════════════════════════════════════════════
f.section(500, 'Part 2 — The More menu  ·  P2')

more = place(MARGIN, 530, 'More, on the MV controller', 'Opens over the video · P2-S1', w=340)
menu = place(470, 530, 'Download · Playback Speed · Picture in Picture',
             'Exactly three items, in this order · P2-S1', w=340, kind='info')
f.edge(more, menu, side='h')

speed = place(900, 530, 'Playback Speed CYCLES, and the menu STAYS OPEN',
              '1 → 1.5 → 2 → 0.5, wrapping. Measured live · P2-S2', w=340, kind='info')
f.edge(menu, speed, side='h')

oneshot = place(470, 660, 'Download and Picture in Picture act once, then close',
                'Picture in Picture is a no-op where the browser lacks it · P2-S1, P2-S3',
                w=340, kind='aside')
f.edge(menu, oneshot)

# ══ Part 3 — a valid song link ══════════════════════════════════════════════
f.section(790, 'Part 3 — A valid song link  ·  P3')

songlink = place(MARGIN, 820, '/share?id=  on a song', 'The same bare page · P3-S1', w=340, kind='entry')
songpanel = place(470, 820, 'Song panel — art, title, creator',
                  'Cover art carries no words, so a song is named · P3-S1', w=340, kind='info')
f.edge(songlink, songpanel, side='h')

songctl = place(900, 820, 'Play · elapsed / total · seek · mute · download',
                'No fullscreen and no More menu on a song · P3-S2', w=340, kind='info')
f.edge(songpanel, songctl, side='h')

songpills = place(470, 950, 'Two pills: Download, and the same Create',
                  'Identical to Part 1’s in label AND destination · P3-S3', w=340)
f.edge(songpanel, songpills)

# ══ Part 4 — an unavailable link ════════════════════════════════════════════
f.section(1080, 'Part 4 — An unavailable link  ·  P4')

bad = place(MARGIN, 1110, 'An id that matches nothing', 'P4-S1', w=340, kind='error')
noid = place(470, 1110, 'No id at all', 'P4-S2', w=340, kind='error')
forced = place(900, 1110, '?type=expired — the QA switch',
               'Forces the state on an id that WOULD resolve · P4-S3', w=340, kind='error')

gone = place(470, 1240, '“This link isn’t available”',
             'One state, three ways in. The header logo is the only way out · AC-SHARE-02',
             w=340, kind='error')
f.edge(bad, gone, kind='error', side=('bottom', 'left'))
f.edge(noid, gone, kind='error')
f.edge(forced, gone, kind='error', side=('bottom', 'right'))

live = place(900, 1240, 'A LIVE own creation, opened elsewhere',
             'Held in the sender’s own session, so no other session resolves it · P4-S4',
             w=340, kind='error')
f.edge(live, gone, kind='error', side=('left', 'right'))

# ══ Part 5 — minting a link ═════════════════════════════════════════════════
f.section(1380, 'Part 5 — Minting a link  ·  P5')

ctl = place(MARGIN, 1410, 'A Share control on any result or player screen',
            'S8 captures those entry points · P5-S2', w=340, kind='entry')
dialog = place(470, 1410, 'Share dialog — a read-only link and Copy',
               'No social targets, no native share · P5-S2 (AC-SHARE-04)', w=340)
f.edge(ctl, dialog, side='h')

copied = place(900, 1410, '“Copied!” for 1.5s, then reverts',
               'The dialog stays open; the clipboard holds that link · P5-S3', w=340, kind='success')
f.edge(dialog, copied, 'Copy', side='h')

legacy = place(MARGIN, 1540, 'The legacy MV share URL',
               'Server redirect, language prefix kept · P5-S1 (AC-SHARE-03)', w=340, kind='aside')
backto = place(470, 1540, '→ Part 1: /share?id=',
               'The canonical page — same media, same panel · P5-S1', w=340)
f.edge(legacy, backto, 'redirects to', kind='structural', side='h')
f.edge(dialog, backto, 'the recipient opens the link', kind='primary')

assert_in_canvas()
# The legend draws ONE 20px row per edge kind used, starting AT this y — so it
# needs y..y+80 of clear canvas below it. The first version cut it off.
f.legend(1680)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
for w in f.warnings:
    print('WARN:', w)
