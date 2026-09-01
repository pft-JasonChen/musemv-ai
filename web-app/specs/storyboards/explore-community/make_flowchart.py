#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Explore & Community (S8) storyboard spec.

── WHY THIS IS SIX BANDS AND NOT ONE GRAPH (rewritten 2026-09-01) ──────────

The first version drew all six paths as one connected hub. It rendered wrong,
and the failure is worth recording because nothing catches it automatically:
four nodes were placed at negative x and were clipped off the canvas, two more
overlapped each other at the bottom, and two edge labels landed on top of one
another. `flowchart_lib` does not bounds-check — `node(x, y, …)` takes a LEFT
EDGE and draws wherever it is told, and `decision(cx, cy, …)` silently WIDENS
itself to fit its text, so a diamond can grow into whatever is beside it. The
only way to see any of that is to render the SVG and look at it.

So: one band per path, using the library's own `section()`, which exists for
exactly this. Each band is a short left-to-right run that fits inside the
canvas with room to spare, and the cross-path jumps are named in the band
rather than drawn as long edges across the whole diagram. That trades a little
"you can trace one line from top to bottom" for a diagram that is actually
legible — which is the right trade here, because Explore is a hub and no real
visit follows a single line through it anyway.

`assert_in_canvas()` below is the guard that would have caught the first
version. Every node goes through `place()`, and `write()` is only reached if
all of them are inside the margins. It fails the build rather than warning,
because a clipped node looks like a deliberate half-drawn box.

Re-run whenever a step ID cited on the diagram changes: `python3 make_flowchart.py`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                  # .../specs/storyboards/explore-community
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))  # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
from flowchart_lib import Flow  # noqa: E402

VERSION = 'v1'
DATE = '2026-09-01'
W, H = 1280, 2520
MARGIN = 40

# NOTE: NOT `&amp;` — `flowchart_lib` escapes the title itself, so an
# entity here is double-escaped and renders as literal "&amp;".
f = Flow('Explore & Community', 'YouCam Muse Web — desktop 1440 (D8)',
         version=VERSION, date=DATE, width=W, height=H)

_placed = []


def place(x, y, *a, **kw):
    """`Flow.node`, plus a record of where the box actually landed."""
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
       'A hub, not a sequence — so this is drawn as one band per path rather than one graph.')
f.note(MARGIN, 120,
       'Every route here is PUBLIC. The sign-in gate sits at the ACTION (Create / Like), never on the route.')
f.note(MARGIN, 140,
       'Every rail, grid and profile is a fixed seed array in array order: nothing is ranked, refreshed or personalised.')

# ══ Part 1 — the Home feed ══════════════════════════════════════════════════
f.section(210, 'Part 1 — The Home feed  ·  P1')

home = place(MARGIN, 240, '/  — Home feed', 'Public. Hero + two create cards + three seed rails · P1-S1',
             w=300, kind='entry')
rails = decide(640, 275, 'Which control?')
f.edge(home, rails, side='h')

preview = place(900, 240, 'SongPlayBar preview, in place',
                'The album art previews; the row TITLE navigates · P1-S5 (AC-EXP-03)',
                w=340, kind='info')
f.elbow(rails, preview, 'a song row’s album art', kind='structural', out='right', into='left', gap=40)

seeall = place(440, 380, '“See all” → Parts 2 and 3', 'The two catalog pages · P1-S2', w=300)
f.edge(rails, seeall)

arrows = place(900, 370, 'Rail arrows', 'Each appears only while the row can scroll that way · P1-S3, P1-S4',
               w=340, kind='info')
f.elbow(rails, arrows, 'a rail arrow', kind='structural', out='right', into='left', gap=30)

gate = place(MARGIN, 380, 'Sign-in modal — opens at the ACTION',
             'Every Create and every Like on this surface · P1-S7, P1-S8 (AC-EXP-02/08)',
             w=390, kind='human')
f.elbow(home, gate, 'Create, logged out', kind='deferred', out='bottom', into='top', gap=20)

share = place(440, 480, 'Share dialog', 'Never gated. S9 owns its rules · P1-S6', w=300, kind='aside')
f.edge(seeall, share, 'Share on a song row', kind='structural')

# ══ Part 2 — Explore MVs ════════════════════════════════════════════════════
f.section(620, 'Part 2 — Explore MVs  ·  P2')

grid = place(MARGIN, 650, '/explore/mvs', 'Two sections: Top Picks (3) + Newly Released (11) · P2-S1',
             w=340)
uncapped = place(470, 650, 'ALL 14 seed items render — no cap',
                 'Counted live. A bigger backlist renders in full · P2-S1', w=340, kind='info')
f.edge(grid, uncapped, side='h')

card = place(900, 650, 'A card is a real, locale-prefixed link',
             'So middle-click and copy-link reach it too · P2-S2, P2-S3', w=340, kind='info')
f.edge(uncapped, card, side='h')

to_watch = place(470, 760, '→ Part 4: /watch?id=', 'Every MV card anywhere lands there · P2-S2', w=340)
f.edge(card, to_watch, 'press a card', kind='primary', side=('bottom', 'right'))

# ══ Part 3 — Explore songs ══════════════════════════════════════════════════
f.section(890, 'Part 3 — Explore songs  ·  P3')

songs = place(MARGIN, 920, '/explore/songs', 'Top Picks rail + All and the nine genre tabs · P3-S1',
              w=340)
tab = place(560, 920, 'A tab filters the LIST only',
            'What is playing never changes or restarts · P3-S2', w=340, kind='info')
f.edge(songs, tab, side='h')

# Fanned DOWNWARD from a centred diamond, not sideways: the first version sent
# one outcome back across the band and its edge crossed a sibling node.
row = decide(640, 1035, 'Where on the row?')
f.edge(tab, row)

art = place(MARGIN, 1090, 'Album art → previews in the bottom bar',
            'No navigation; real audio, no free-account cap · P3-S3 (AC-EXP-05)', w=380, kind='info')
f.edge(row, art, 'the album art', kind='structural', side=('bottom', 'top'))

title_nav = place(470, 1090, 'The TITLE → /song/result',
                  'At ≥768px. S1 owns that screen · P3-S4 (AC-EXP-03)', w=340, kind='success')
f.edge(row, title_nav, 'the title')

create_song = place(870, 1090, 'Create → /song/create, pre-filled',
                    'Genre, mood, title, lyrics. Gated · P3-S5 (AC-EXP-02)', w=370, kind='success')
f.edge(row, create_song, 'Create', kind='primary', side=('bottom', 'top'))

# ══ Part 4 — Watch an MV ════════════════════════════════════════════════════
f.section(1250, 'Part 4 — Watch an MV  ·  P4')

watch = place(MARGIN, 1280, '/watch?id=',
              'Stage in the item’s own 3:4 or 4:3; floating meta; transport · P4-S1 (AC-EXP-04)',
              w=340)
official = decide(660, 1310, 'Official MV?')
f.edge(watch, official, side='h')

mark = place(900, 1280, 'YCM watermark over the video',
             'The eight hero MVs only, against the video’s own rect · P4-S3 (AC-EXP-10)',
             w=340, kind='info')
f.edge(official, mark, 'yes', side='h')

drag = decide(265, 1450, 'Drag past the threshold?')
f.elbow(watch, drag, 'drag the stage', kind='structural', out='bottom', into='top', gap=20)

commit = place(520, 1425, 'Commits to the next / previous MV',
               'The URL is REPLACED, not pushed; no reload · P4-S5 (AC-EXP-11)', w=330, kind='info')
f.edge(drag, commit, 'yes', side='h')

spring = place(910, 1425, 'Springs back, nothing changes',
               'Also the only outcome for an id outside the feed · P4-S6, P4-S7', w=330, kind='info')
f.edge(commit, spring, 'no', side='h')

grid_below = place(MARGIN, 1570, 'The same two sections below the player',
                   'Identical to Part 2’s · P4-S2', w=340, kind='info')
f.elbow(drag, grid_below, 'scroll down', kind='structural', out='bottom', into='top', gap=20)

like_share = place(490, 1570, 'Like is GATED · Share is NOT',
                   'Both act at the press; Like is session-local · P4-S8, P4-S9 (AC-EXP-08)',
                   w=340, kind='human')
f.edge(grid_below, like_share, side='h')

create_mv = place(880, 1570, 'Create MV → /mv/room, pre-filled',
                  'mvType, prompt, matched song, title. S2 owns it · P4-S10', w=360, kind='success')
f.edge(like_share, create_mv, side='h')

# ══ Part 5 — Play a community song ══════════════════════════════════════════
f.section(1700, 'Part 5 — Play a community song  ·  P5')

play = place(MARGIN, 1730, '/song/play?id=',
             'The SAME screen as /explore/songs — the id only pre-selects · P5-S1', w=340)
closed = place(470, 1730, 'The bar arrives CLOSED',
               'And nothing marks which song the link named (Q-04) · P5-S1', w=340, kind='error')
f.edge(play, closed, side='h')

opened = place(900, 1730, 'Play opens the bar on that track',
               'On the linked song, not the list’s first row · P5-S2', w=340, kind='info')
f.edge(closed, opened, side='h')

playlist = place(470, 1850, 'A creator id swaps the whole list',
                 'Eight creator tracks, and NO tab is active · P5-S3 (EXP-09)', w=340, kind='info')
f.elbow(play, playlist, 'a cps- id', kind='structural', out='bottom', into='left', gap=25)

# ══ Part 6 — The creator profile, and the states nothing else reaches ═══════
f.section(1970, 'Part 6 — The creator profile, and the states nothing else reaches  ·  P6')

creator = place(MARGIN, 2000, '/creator',
                'Name + Plays / Likes + Music Videos / Songs tabs. No email · P6-S1 (AC-EXP-06)',
                w=340)
whose = decide(660, 2030, 'Whose profile?')
f.edge(creator, whose, side='h')

other = place(900, 2000, 'Someone else’s — Like + Share inline',
              'No overflow menu at all, and no Report / Block · P6-S2', w=340, kind='info')
f.edge(whose, other, 'a creator link', side='h')

own = place(470, 2120, 'Your own (?self=1) — a six-slot menu',
            'First slot: Edit MV on an MV, Create MV on a song · P6-S4, P6-S5', w=380, kind='info')
f.edge(whose, own, '?self=1')

empty = place(MARGIN, 2240, 'profileEmpty (?demo=1) — “No works released yet”',
              'The subtitle and the create CTA only on your OWN page · P6-S6, P6-S7 (AC-EXP-12)',
              w=390, kind='error')
f.elbow(creator, empty, 'the demo switch — the only way in', kind='error', out='bottom', into='top', gap=25)

notfound = place(490, 2240, 'Unresolvable id → an Explore CTA',
                 'On EITHER player; never a silent fallback · P4-S11, P5-S4 (AC-EXP-09)',
                 w=340, kind='error')
f.edge(empty, notfound, side='h')

prd = place(900, 2240, 'Ranking · eligibility · moderation · refresh',
            'The Curation PRD’s whole layer — UNBUILT. No edge on this diagram passes through it '
            '(TBD-EXP-01 / 07)', w=340, kind='aside')

assert_in_canvas()
# The legend draws ONE 20px row per edge kind used (four here), starting AT
# this y — so it needs y..y+80 of clear canvas. Both earlier versions cut it
# off, because `Flow` sizes to an explicit height without checking.
f.legend(2380)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
for w in f.warnings:
    print('WARN:', w)
