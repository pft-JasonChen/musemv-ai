#!/usr/bin/env python3
"""Builds user-flowchart.svg for the Explore & Community (S8) storyboard spec.

Layout note. Explore is a HUB, not a sequence: `/` is the only real entry, and
everything else is a destination reachable from it (and, in most cases, from
the others too). So the diagram draws `/` at the top with the three rails and
the two "See all" pages beneath it, then the two players, then `/creator` as
the sink both players and both grids feed. Drawing P1..P6 as a strict chain
would assert an order no visit actually follows.

Three things are drawn deliberately rather than incidentally:

  · The `requireLogin` gate is ONE node with several edges into it, because it
    is one gate — the same modal, at the action rather than at the route. Every
    Create and Like on this whole surface routes through it (GL-02).
  · The swipe feed is drawn as a self-loop on `/watch`, not as a separate
    screen, because that is what it is: `router.replace` swaps the id under a
    player that never unmounts.
  · The ranking / moderation layer the Curation PRD specifies is drawn ONCE,
    as a detached aside, so a reader can see it exists and see that nothing on
    the diagram passes through it.

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

f = Flow('Explore &amp; Community', 'YouCam Muse Web — desktop 1440 (D8)',
         version=VERSION, date=DATE, width=1240, height=1430)
S = f.SPINE
CX = S + 90

f.note(40, 58,
       'A hub, not a sequence. Every route here is PUBLIC — nothing is behind a route guard; '
       'the sign-in gate sits at the ACTION (Create / Like), which is why it is one node with '
       'many edges into it. Every rail and grid is a static seed array in array order.')

home = f.node(S, 118, '/  — Home feed', 'Hero + tool selector + three seed rails · P1-S1', w=340, kind='entry')

gate = f.node(S - 520, 210, 'Sign-in modal — at the action', 'requireLogin, then the action runs · P1-S8, P4-S8 (AC-EXP-02/08)',
              w=300, kind='human')
f.elbow(home, gate, 'Create MV / Create Song / Create / Like, logged out',
        kind='deferred', out='left', into='top', gap=60)

# ── P1 — what the rails themselves do ───────────────────────────────────────
rails = f.decision(CX, 215, 'Which rail control?')
f.edge(home, rails)

preview = f.node(S + 340, 300, 'SongPlayBar preview — in place', 'Album art previews; the row TITLE navigates · P1-S5 (AC-EXP-03)',
                 w=300, kind='info')
f.elbow(rails, preview, 'a song row’s album art', kind='structural', out='right', into='left', gap=60)

# ── P2 / P3 — the two See-all pages ─────────────────────────────────────────
exp_mv = f.node(S - 300, 330, '/explore/mvs', 'Top Picks (3) + Newly Released (11), uncapped · P2-S1', w=250)
f.elbow(rails, exp_mv, '"See all" on Trending Music Videos', kind='primary', out='left', into='top', gap=45)

exp_song = f.node(S + 20, 400, '/explore/songs', 'Top Picks rail + All & the nine genre tabs · P3-S1', w=250)
f.edge(rails, exp_song, '"See all" on either songs rail')

# ── P4 — the MV player ──────────────────────────────────────────────────────
watch = f.node(S - 300, 470, '/watch?id=', '3:4 or 4:3 stage, floating meta, transport · P4-S1 (AC-EXP-04)', w=250)
f.edge(exp_mv, watch, 'a card')
f.elbow(home, watch, 'an MV card on the Trending rail', kind='deferred', out='left', into='left', gap=30)

swipe = f.node(S - 640, 470, 'Swipe up / down — next / prev in the feed',
               'Commits past 80/693 of stage height; router.replace, no page load · P4-S4, P4-S5 (AC-EXP-11)',
               w=300, kind='info')
f.elbow(watch, swipe, 'drag the stage', kind='structural', out='left', into='right', gap=40)

wm = f.decision(S - 300 + 90, 570, 'Official MV?')
f.edge(watch, wm)
wm_on = f.node(S - 640, 650, 'YCM watermark over the video', 'isOfficialMv — the eight hero MVs only · P4-S3 (AC-EXP-10)',
               w=290, kind='info')
f.elbow(wm, wm_on, 'yes', kind='structural', out='left', into='right', gap=50)

# ── P5 — the song player ────────────────────────────────────────────────────
play = f.node(S + 20, 560, '/song/play?id=', 'Same screen as /explore/songs; the bar opens on play · P5-S1, P5-S2',
              w=250)
f.edge(exp_song, play, 'a row, or a deep link')
f.elbow(home, play, 'a Top Picks / New Songs card', kind='deferred', out='right', into='right', gap=30)

playlist = f.node(S + 340, 640, 'The playlist follows the song', 'A creator id swaps the list; no tab is active · P5-S3 (EXP-09)',
                  w=290, kind='info')
f.elbow(play, playlist, 'a cps- id', kind='structural', out='right', into='left', gap=50)

# ── Create hand-offs into other areas ───────────────────────────────────────
create_mv = f.node(S - 640, 780, '/mv/room — pre-filled', 'mvType + prompt + matched song · P4-S10 (area 02, S2)',
                   w=290, kind='success')
f.elbow(watch, create_mv, 'Create Music Video', kind='primary', out='left', into='top', gap=110)

create_song = f.node(S + 340, 780, '/song/create — pre-filled', 'genre + mood + title + lyrics · P3-S5 (area 03, S1)',
                     w=290, kind='success')
f.elbow(play, create_song, 'Create AI Song', kind='primary', out='right', into='top', gap=110)

f.elbow(gate, create_mv, 'on success the queued action runs', kind='deferred', out='left', into='left', gap=40)

# ── P6 — the creator profile, the sink ──────────────────────────────────────
creator = f.node(S, 880, '/creator', 'Header + Plays / Likes + Music Videos / Songs tabs · P6-S1 (AC-EXP-06)',
                 w=340)
f.edge(watch, creator, 'the creator link', side='right')
f.edge(play, creator, 'the creator link')

whose = f.decision(CX, 975, 'Whose profile?')
f.edge(creator, whose)

other = f.node(S - 300, 1060, 'Someone else’s — Like + Share inline', 'No owner menu at all · P6-S2', w=280, kind='info')
f.elbow(whose, other, 'a creator link (?self absent)', kind='structural', out='left', into='right', gap=60)

own = f.node(S + 340, 1060, 'Your own (?self=1) — six-slot owner menu', 'Edit MV / Create MV · Like · Share · Publish · Download · Delete · P6-S4, P6-S5',
             w=300, kind='info')
f.elbow(whose, own, '/profile stat tile (?self=1)', kind='deferred', out='right', into='left', gap=90)

empty = f.node(S, 1160, 'profileEmpty (?demo=1) — "No works released yet"',
               'Subtitle + a tab-specific CTA only on your own profile · P6-S6, P6-S7 (AC-EXP-12)',
               w=380, kind='error')
f.elbow(creator, empty, 'flag on', kind='error', out='left', into='left', gap=30)

notfound = f.node(S - 640, 1160, 'Not found — an Explore CTA', 'An unresolvable id on either player · P4-S11, P5-S4 (AC-EXP-09)',
                  w=290, kind='error')
f.elbow(watch, notfound, 'unresolvable ?id', kind='error', out='left', into='top', gap=170)

prd = f.node(S + 340, 1160, 'Ranking · eligibility · moderation · refresh',
             'The Curation PRD’s whole layer — UNBUILT, no edge passes through it (TBD-EXP-01/07)',
             w=340, kind='aside')

f.legend(1270)
f.write(os.path.join(HERE, 'user-flowchart.svg'))
print('Wrote', os.path.join(HERE, 'user-flowchart.svg'))
if f.warnings:
    for w in f.warnings:
        print('WARN:', w)
