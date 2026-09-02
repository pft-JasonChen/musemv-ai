#!/usr/bin/env python3
"""yco-spec build script — Explore &amp; Community (S8) storyboard.

Screenshot source: **live app capture**, not a static prototype — the same
convention every other spec in this programme follows. Each screenshot in
specs/screenshots/ was captured by driving the real Next.js dev server with
Playwright (`capture_screenshots.py`), signed in via the same
`localStorage['muse_auth']` seed the e2e specs use — except the four guest
shots, which are a deliberately UNSEEDED session, because `requireLogin` runs
the action straight through once a session is authenticated and the gate would
never render. Full-page shots throughout EXCEPT any state carrying a
`position: fixed` element (`SongPlayBar`, the sign-in modal, the share dialog,
the portalled owner menu, the demo panel), which use a plain viewport shot —
a full-page capture's artificially tall viewport repositions all of them.

ONE VIEWPORT — D8 stands: desktop 1403x697 only, this repo's established
capture viewport. Confirmed with the product owner at this spec's Phase 0
gate (2026-09-01). Two behaviours that DO change by width are recorded as
deltas rather than captured: below 768px `/explore/mvs` hides its second
section outright (so a phone reaches 3 of the 14 seed MVs), and below 768px
the song screens replace the preview bar with a full-screen player that has
the Lyrics sheet the desktop screen does not.

SCOPE — agreed at the Phase 0 gate, 2026-09-01
    Six paths, 36 captures. Larger than PLAN.md's "~6 paths / ~30 shots"
    estimate, and the growth is in two places worth naming so it is not
    mistaken for scope creep: (1) `/watch` grew the YCM watermark
    (`AC-EXP-10`) and the vertical swipe feed (`AC-EXP-11`) in the days
    before this build, and the swipe alone needs three states — held,
    committed, and an id with no neighbour; (2) `AC-EXP-03` turned out to
    have TWO affordances on one row (the album art previews, the title
    navigates), so covering it takes two shots, not one.

WHAT THE SOURCE PRD DOES AND DOES NOT SETTLE
    `ycmuse-app-skill/YouCam_Muse_Explore_Curation_PRD  -  V2.pdf` was read
    in full before Phase 0 (programme decision D5) — the first time in this
    programme. The product owner's ruling at the gate: **the designer
    prototype superseded the PRD's layout, and the spec follows the shipped
    screen**; the PRD's ranking / eligibility / moderation / refresh layer is
    not something the prototype implements, so this spec MARKS it and points
    at the PDF as the authority rather than restating its formulas as if they
    were requirements. Two things the PRD did not settle came out of the read
    and are carried as open questions rather than smoothed over: its own
    scoring tables disagree with its own formulas (Q-01), and it defines no
    endpoint, field or payload shape, so `TBD-EXP-11` — the named handover
    blocker D5 expected this document to close — is still open (Q-02).

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory; this repo is TypeScript/React, so the relevant files are listed
individually below, following S1/S3/S4/S6/S7's precedent.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/explore-community
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'Explore &amp; Community',
    'breadcrumb': 'YouCam Muse Web &rarr; Explore &amp; Community',
    'author': 'Jason Chen', 'date': '2026-09-01', 'status': 'Draft',
    'version': 'v1',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        'The whole discovery and community-consumption surface: the Home feed and its three '
        'rails, the two &ldquo;See all&rdquo; explore pages, the MV player at <code>/watch</code>, '
        'the community song player at <code>/song/play</code>, and the creator profile at '
        '<code>/creator</code>. Every route is public; the sign-in gate sits on the ACTION, '
        'never on the route.'
    ),
    'background': (
        'The ninth spec in this repo&rsquo;s yco-spec storyboard programme (specs/storyboards/'
        'PLAN.md), covering area 04 end to end. It was deliberately scheduled late: this is the '
        'one half of the product that is NOT RD-ready &mdash; there is no community endpoint on '
        'the API at all, and every rail, grid and profile on these six routes runs on a fixed '
        'seed array. The source Curation PRD was read in full for the first time at this '
        'spec&rsquo;s Phase 0 gate.'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of every Explore/Community behavior they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web &mdash; captured at 1403&times;697 (desktop only, D8)'],
        ['Audience', 'QA'],
        ['Scope', 'The Home feed (hero, tool selector, three rails), /explore/mvs, /explore/songs, /watch (including the YCM watermark and the vertical swipe feed), /song/play, and /creator (both modes, plus the demo-flag empty state). The sign-in gate is walked on this surface because it fires at the action, not at the route.'],
        ['Out of scope', 'The create flows the CTAs lead into (areas 02/03 &mdash; S1, S2); the shell and the sign-in modal itself (areas 01/09 &mdash; S6); the share dialog&rsquo;s own rules (area 10 &mdash; S9); the ranking, eligibility, moderation and refresh layer, which is unbuilt (see Prototype vs production).'],
        ['Source', 'specs/areas/04-explore-community.md (&sect;&sect;1-9, AC-EXP-01..12), the Explore Curation PRD, and the running app'],
    ],

    'short_nav': [
        'Home feed', 'Explore MVs', 'Explore songs', 'Watch', 'Song play', 'Creator', 'Empty feed',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p1-home', 'num': 1,
            'name': 'The Home feed',
            'desc': 'What a visitor lands on: the hero, the two create cards, the three rails, and the two things a song row can do.',
            'entry': 'Open / (public &mdash; no sign-in required)',
            'outcome': 'The visitor either browses on, previews a song in place, or is asked to sign in at a create action',
            'steps': [
                {
                    'shot': '01_home_hero_tools.png', 'num': 1,
                    'user': 'Opens the home page.',
                    'system': 'A heading over two create cards, with the hero filmstrip below it.',
                    'exact': [
                        'Heading: &ldquo;What would you like to create today?&rdquo;',
                        'Card 1: &ldquo;AI Music Video&rdquo; / &ldquo;Upload a selfie and let AI create your music video.&rdquo;',
                        'Card 2: &ldquo;AI Song&rdquo; / &ldquo;Write your lyrics or idea and let AI create the song.&rdquo;',
                        'Hero card CTA: &ldquo;Create MV&rdquo;',
                    ],
                    'limits': [
                        ('At 768px and above the create cards sit ABOVE the hero; below 768px that order reverses.',
                         'AC-EXP-01. Each side of the branch is a different component, chosen in JavaScript from a media query rather than by CSS, so one width shows only half of what this screen can be.'),
                        ('Only the centred hero card plays its video; the rest show their poster image.',
                         'The filmstrip scroll-snaps, and playback follows whichever card is centred.'),
                        'This route is public — arriving here signed out renders exactly the same screen (P1-S7).',
                    ],
                },
                {
                    'shot': '02_home_three_rails.png', 'num': 2,
                    'user': 'Scrolls down.',
                    'system': 'Three rails render in a fixed order, each with its own &ldquo;See all&rdquo; link.',
                    'exact': [
                        'Rail 1: &ldquo;Trending Music Videos&rdquo;',
                        'Rail 2: &ldquo;Top Picks Songs&rdquo;',
                        'Rail 3: &ldquo;Newly Released Songs&rdquo;',
                        'Section link: &ldquo;See all&rdquo;',
                        'Song card subtitle: &ldquo;AI Song&rdquo;',
                    ],
                    'limits': [
                        ('THREE rails, in this order, always.',
                         'AC-EXP-01. The order is the order the components are mounted in; it is not ranked and it does not vary by visitor.'),
                        ('Every rail is a fixed list in array order — nothing here is ranked, refreshed or personalised.',
                         'The scoring, eligibility and refresh rules the Curation PRD specifies are unbuilt; see Prototype vs production.'),
                        ('&ldquo;Trending Music Videos&rdquo; and &ldquo;See all&rdquo; do NOT show the same catalog.',
                         'The rail shows the newly-released MVs; the Top Picks catalog behind them is reachable only from /explore/mvs. Raised as Q-03.'),
                        'Newly Released Songs shows six rows in two columns; the rest of that catalog is behind its "See all".',
                    ],
                },
                {
                    'shot': '03_home_rail_next.png', 'num': 3,
                    'user': 'Looks at the Trending Music Videos rail before touching it.',
                    'system': 'A Next arrow is offered on the right; there is no Previous arrow yet.',
                    'exact': [
                        'Arrow labels: &ldquo;Previous&rdquo;, &ldquo;Next&rdquo;',
                    ],
                    'limits': [
                        ('An arrow renders only while the row can actually scroll that way.',
                         'At rest the row is at its start, so only Next exists. Verified during capture.'),
                    ],
                },
                {
                    'shot': '04_home_rail_scrolled.png', 'num': 4,
                    'user': 'Presses Next.',
                    'system': 'The row scrolls by exactly one card, and a Previous arrow appears.',
                    'limits': [
                        ('One press advances by one card width plus the gap, not by a page.',
                         'Measured live during capture.'),
                        'The same two-arrow rule applies to the Top Picks Songs rail.',
                    ],
                },
                {
                    'shot': '05_home_preview_bar.png', 'num': 5,
                    'user': 'Presses the play control on a Newly Released Songs row.',
                    'system': 'A player bar opens along the bottom and the song plays; the page does not navigate.',
                    'limits': [
                        ('A song row carries TWO different affordances: the album art previews in place, the title navigates.',
                         'AC-EXP-03. The split is deliberate, so browsing can continue while a preview plays.'),
                        ('Only one preview bar can be open on this page at a time.',
                         'Top Picks and Newly Released each own a preview; starting one closes the other.'),
                        ('The bar is desktop-only; below 768px the same press navigates instead.',
                         'The bar is hidden at that width, so previewing would start audio with no visible transport.'),
                        'The URL is unchanged by a preview — verified during capture.',
                    ],
                },
                {
                    'shot': '06_home_share_entry.png', 'num': 6,
                    'user': 'Presses Share on a song row.',
                    'system': 'The shared share dialog opens with a copyable public link.',
                    'exact': [
                        'Dialog body: &ldquo;Shareable public link to&rdquo;',
                        'Action: &ldquo;Copy&rdquo;',
                    ],
                    'limits': [
                        ('This is the same dialog every Share on the surface opens; its own rules are S9&rsquo;s.',
                         'The entry point is the boundary: S9 owns what the dialog then does.'),
                        ('Share is NOT gated: a signed-out visitor gets the dialog, not a sign-in prompt.',
                         'Shown at P4-S9.'),
                    ],
                },
                {
                    'shot': '07_guest_home_public.png', 'num': 7,
                    'user': 'Opens the same page with nobody signed in.',
                    'system': 'The full feed renders. No modal opens, nothing is hidden, nothing is disabled.',
                    'limits': [
                        ('None of the six Explore routes is behind a route guard.',
                         'Area 04 &sect;2: every route in the area is public.'),
                    ],
                },
                {
                    'shot': '08_guest_toolcard_gated.png', 'num': 8,
                    'user': 'While signed out, presses a create card.',
                    'system': 'The sign-in modal opens and the navigation does not happen.',
                    'limits': [
                        ('The gate is on the ACTION, not the route: the screen was already fully visible.',
                         'AC-EXP-02 / AC-EXP-08.'),
                        ('On success the queued action runs, so the user lands where they were going.',
                         'The modal&rsquo;s own behaviour, dismissal and success animation belong to S6.'),
                        ('Every Create and every Like on this surface goes through the same gate.',
                         'The hero CTAs, both create cards, each song row&rsquo;s Create, and both players.'),
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p2-explore-mvs', 'num': 2,
            'name': 'Explore MVs',
            'desc': 'The MV catalog behind &ldquo;See all&rdquo; &mdash; two sections, every item, and a card that is a real link.',
            'entry': '&ldquo;See all&rdquo; on Trending Music Videos, or /explore/mvs directly',
            'outcome': 'The visitor picks an MV and lands on the player',
            'steps': [
                {
                    'shot': '09_explore_mvs_sections.png', 'num': 1,
                    'user': 'Opens /explore/mvs.',
                    'system': 'Two sections render as a justified gallery, above a back control.',
                    'limits': [
                        ('There is no item cap: every seed item renders, in both sections.',
                         'Counted live during capture &mdash; 3 in the first section, 11 in the second. A different catalog size renders in full.'),
                        ('The two sections are two different catalogs, not one list shown twice.',
                         'The first is the Top Picks catalog, which has no entry point on the Home feed at all.'),
                        ('Back returns to wherever the visitor came from, falling back to the Home feed.',
                         'The screen is its own section&rsquo;s entry point, so it needs a destination when there is no history.'),
                        ('Below 768px only the FIRST section renders.',
                         'A phone therefore reaches 3 of the 14 seed items; recorded as a delta, not captured here (D8).'),
                        ('An empty catalog renders the shared feed empty block &mdash; see P7.',
                         'Verified live with the switch on: the block replaces the sections and no card remains.'),
                    ],
                },
                {
                    'shot': '10_explore_mvs_card.png', 'num': 2,
                    'user': 'Presses a card.',
                    'system': 'The MV player opens for that item.',
                    'limits': [
                        ('Every card is a real link carrying the item id, not a click handler.',
                         'AC-EXP-03. So plain click, middle-click and copy-link all reach the same screen.'),
                        ('The link keeps the active language prefix.',
                         'Verified in the markup during capture.'),
                    ],
                },
                {
                    'num': 3,
                    'user': 'Middle-clicks a card, or copies its link and opens it in a new tab.',
                    'system': 'The same player opens, on the same item, in the new tab.',
                    'limits': [
                        ('This is a consequence of the cards being real links, and it is the reason they are.',
                         'AC-EXP-03 / the area&rsquo;s own EXP-P2-S2.'),
                        'No screenshot: a new tab showing the same screen as P4-S1 would photograph identically.',
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p3-explore-songs', 'num': 3,
            'name': 'Explore songs',
            'desc': 'The song catalog: a Top Picks rail, ten genre tabs, and the two things a row does.',
            'entry': '&ldquo;See all&rdquo; on either songs rail, or /explore/songs directly',
            'outcome': 'The visitor previews a song, opens it, or starts creating one from it',
            'steps': [
                {
                    'shot': '11_explore_songs_all.png', 'num': 1,
                    'user': 'Opens /explore/songs.',
                    'system': 'A Top Picks rail sits above a heading, a tab bar, and the song list.',
                    'exact': [
                        'Rail heading: &ldquo;Top Picks Songs&rdquo;',
                        'List heading: &ldquo;Newly Released Songs&rdquo;',
                        'Tabs, in this order: &ldquo;All&rdquo;, &ldquo;Pop&rdquo;, &ldquo;Hip-Hop&rdquo;, &ldquo;R&amp;B&rdquo;, &ldquo;Rock&rdquo;, &ldquo;Jazz&rdquo;, &ldquo;Electronic&rdquo;, &ldquo;Rap&rdquo;, &ldquo;Classical&rdquo;, &ldquo;Country&rdquo;',
                        'Row action: &ldquo;Create&rdquo;',
                    ],
                    'limits': [
                        ('TEN tabs: All, then the nine genres the song create screen offers, in that order.',
                         'They are the create screen&rsquo;s own list, not a list derived from the catalog &mdash; the product owner reversed the earlier derivation on 2026-09-01 so the two vocabularies match.'),
                        ('The All tab lists the whole community catalog &mdash; 24 rows in the seed data.',
                         'Counted live during capture.'),
                        ('A genre with no songs would render an empty list with no empty state.',
                         'The seed catalog was re-tagged so every tab has at least two songs; keeping it that way is a constraint on future catalog edits.'),
                        ('Below 768px the tab bar is hidden, so a phone sees the All catalog only.',
                         'Recorded as a delta, not captured here (D8).'),
                    ],
                },
                {
                    'shot': '12_explore_songs_genre_tab.png', 'num': 2,
                    'user': 'Starts a song playing, then presses the Hip-Hop tab.',
                    'system': 'The list filters to that genre. What is playing does not change.',
                    'limits': [
                        ('Switching a tab changes the LIST only; it never changes or restarts what is playing.',
                         'A browse filter is not a playback control. Verified live during capture and guarded by an e2e test.'),
                        ('Hip-Hop shows 4 of the 24 rows in the seed catalog.',
                         'Counted live during capture; the number is a property of the seed data, not a rule.'),
                    ],
                },
                {
                    'shot': '13_explore_songs_preview.png', 'num': 3,
                    'user': 'Presses the play control on a row.',
                    'system': 'The bottom player bar plays that song while the list stays where it was.',
                    'exact': [
                        'Transport labels: &ldquo;Previous&rdquo;, &ldquo;Next&rdquo;',
                    ],
                    'limits': [
                        ('Playback is a real audio element &mdash; duration, position, seeking and advance-on-end all come from it.',
                         'AC-EXP-05.'),
                        ('There is no playback cap for free accounts.',
                         'AC-EXP-05. The 30-second preview gate was cancelled and is asserted against in the e2e suite.'),
                        ('Previous / Next step through whichever list is currently displayed.',
                         'Which list that is can change &mdash; see P5-S3.'),
                        'There is no shuffle and no repeat: the transport is Previous, Play/Pause, Next.',
                    ],
                },
                {
                    'shot': '14_explore_songs_row_navigates.png', 'num': 4,
                    'user': 'Presses a row&rsquo;s title.',
                    'system': 'The result-stage player opens for that song, carrying where it was opened from.',
                    'limits': [
                        ('The row&rsquo;s title navigates and the row&rsquo;s album art does not.',
                         'AC-EXP-03. Both halves are live on the same row; this is the half P3-S3 does not show.'),
                        ('This applies at 768px and above; below that the same press opens the full-screen player.',
                         'AC-EXP-03. The narrow layout is out of scope under D8.'),
                        ('The destination screen belongs to S1.',
                         'This step stops at its first frame.'),
                    ],
                },
                {
                    'shot': '15_explore_songs_create.png', 'num': 5,
                    'user': 'Presses Create on a row.',
                    'system': 'The song create screen opens with that song&rsquo;s details already filled in.',
                    'limits': [
                        ('Create seeds the compose form with the song&rsquo;s genre, mood, title and lyrics before navigating.',
                         'AC-EXP-02.'),
                        ('It is gated: signed out, this opens the sign-in modal instead and runs afterwards.',
                         'AC-EXP-08; the gate itself is shown at P1-S8.'),
                        ('The destination screen belongs to S1.',
                         'This step stops at its first frame.'),
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p4-watch', 'num': 4,
            'name': 'Watch an MV',
            'desc': 'The MV player: the stage and its controls, the official-video watermark, the vertical swipe feed, the two gated actions, and the create hand-off.',
            'entry': 'An MV card anywhere, or /watch?id= directly',
            'outcome': 'The visitor watches, swipes on through the feed, or leaves to create their own MV',
            'steps': [
                {
                    'shot': '16_watch_player.png', 'num': 1,
                    'user': 'Opens an MV.',
                    'system': 'The video plays muted on a stage sized to the item, with the title, creator and actions floating over it and a transport below.',
                    'exact': [
                        'Primary action: &ldquo;Create MV&rdquo;',
                        'Control labels: &ldquo;Like&rdquo;, &ldquo;Share&rdquo;, &ldquo;Mute&rdquo;, &ldquo;Fullscreen&rdquo;',
                    ],
                    'limits': [
                        ('The stage takes the item&rsquo;s OWN aspect ratio &mdash; 3:4 or 4:3 &mdash; not a fixed one.',
                         'AC-EXP-04. The catalog deliberately mixes the two; there is no viewer control to switch them.'),
                        ('Playback starts muted, and the transport offers play/pause, seek, mute and fullscreen.',
                         'AC-EXP-04. The seek control is keyboard-operable.'),
                        ('The primary action reads &ldquo;Create MV&rdquo; here and &ldquo;Create Music Video&rdquo; on a narrow layout.',
                         'Two labels shown one at a time, not a rename.'),
                        'Like is stored for this browsing session only — it is not counted, not persisted, and gone on reload.',
                    ],
                },
                {
                    'shot': '17_watch_grid_below.png', 'num': 2,
                    'user': 'Scrolls below the player.',
                    'system': 'The same two catalog sections /explore/mvs shows render underneath.',
                    'limits': [
                        ('Identical sections, identical order, same behaviour as P2-S1.',
                         'One shared component draws both screens&rsquo; grids.'),
                        ('Below 768px both sections are hidden on this screen.',
                         'Recorded as a delta, not captured here (D8).'),
                    ],
                },
                {
                    'shot': '18_watch_watermark_official.png', 'num': 3,
                    'user': 'Opens an OFFICIAL music video &mdash; one published under the YouCam Muse name.',
                    'system': 'The YCM watermark overlays the video.',
                    'exact': [
                        'Creator name on an official video: &ldquo;YouCam Muse&rdquo;',
                    ],
                    'limits': [
                        ('The watermark is on officialness alone, never on whether the video is currently playing.',
                         'AC-EXP-10. It identifies the video, the way a broadcast mark does.'),
                        ('It is positioned against the VIDEO&rsquo;s own rendered rectangle, not the stage&rsquo;s.',
                         'AC-EXP-10. The stage centres the video, so a stage-relative offset would land in the blank space beside a shorter video. Verified live during capture.'),
                        ('A user-submitted MV never shows it &mdash; verified on the MV at P4-S1.',
                         'Only the eight official hero videos carry the official creator name.'),
                    ],
                },
                {
                    'shot': '19_watch_swipe_dragging.png', 'num': 4,
                    'user': 'Drags vertically on the video stage and holds past the threshold.',
                    'system': 'The stage follows the drag and the next MV slides in behind it.',
                    'limits': [
                        ('The gesture is on the STAGE only &mdash; the header, meta row, actions and transport never move.',
                         'AC-EXP-11. Verified live: their measured positions are unchanged throughout a drag.'),
                        ('It is a pointer gesture, so a mouse drag works exactly like a touch drag, at every width.',
                         'AC-EXP-11. It is not inside a phone-only branch.'),
                        ('The commit threshold is a fraction of the stage height, not a fixed pixel distance.',
                         'Measured live at this viewport: a 578px stage commits past about 67px.'),
                    ],
                },
                {
                    'shot': '20_watch_swipe_committed.png', 'num': 5,
                    'user': 'Releases past the threshold.',
                    'system': 'The next MV is playing and the address bar now names it.',
                    'limits': [
                        ('The feed is the two catalogs in order, and it wraps &mdash; there is no first or last item.',
                         'AC-EXP-11. Swiping up goes forward, down goes back.'),
                        ('The URL is REPLACED, not pushed, so Back does not walk back one swipe at a time.',
                         'AC-EXP-11. A swipe is not a place a user wants to return to individually.'),
                        ('There is no reload between items: the neighbour was already buffered and simply becomes current.',
                         'Three video slots rotate roles rather than the elements being replaced.'),
                    ],
                },
                {
                    'num': 6,
                    'user': 'Drags a short distance and releases before the threshold.',
                    'system': 'The stage springs back. The MV, and the address bar, are unchanged.',
                    'limits': [
                        ('Below the threshold nothing commits &mdash; not the item, not the URL.',
                         'AC-EXP-11. Verified live during capture.'),
                        'No screenshot: once it has sprung back the screen is identical to P4-S5.',
                    ],
                },
                {
                    'shot': '21_watch_no_neighbour.png', 'num': 7,
                    'user': 'Opens an MV reached from a creator profile, then drags on the stage.',
                    'system': 'Nothing happens. The stage springs back however far it is dragged.',
                    'limits': [
                        ('An item that is not part of the feed has no next or previous, so the gesture is a no-op.',
                         'AC-EXP-11. Verified live at half the stage height, which is well past the threshold.'),
                        ('That item plays through a single video element rather than the three-slot feed.',
                         'The same fallback carries the official videos at P4-S3.'),
                    ],
                },
                {
                    'shot': '22_guest_like_gated.png', 'num': 8,
                    'user': 'While signed out, presses Like.',
                    'system': 'The sign-in modal opens and nothing is liked.',
                    'limits': [
                        ('Like is gated at the press, like every Create on this surface.',
                         'AC-EXP-08.'),
                        ('Signed in, it still only changes this session &mdash; nothing is counted or stored.',
                         'Real counters are backend work; see Prototype vs production.'),
                    ],
                },
                {
                    'shot': '23_guest_share_ungated.png', 'num': 9,
                    'user': 'While still signed out, presses Share.',
                    'system': 'The share dialog opens normally.',
                    'limits': [
                        ('Share is deliberately NOT gated, on any surface, signed in or out.',
                         'A public link is public; there is nothing to attribute to an account.'),
                        ('The dialog&rsquo;s own rules are S9&rsquo;s.',
                         'Named as the boundary; this step shows only that it opens.'),
                    ],
                },
                {
                    'shot': '24_watch_create_prefilled.png', 'num': 10,
                    'user': 'Presses Create MV.',
                    'system': 'The MV create screen opens with this video&rsquo;s brief already filled in.',
                    'limits': [
                        ('It seeds the MV type, the source prompt, the matched song and the title before navigating.',
                         'AC-EXP-04.'),
                        ('Gated while signed out, like every other create action here.',
                         'AC-EXP-08.'),
                        ('The destination screen belongs to S2.',
                         'This step stops at its first frame.'),
                    ],
                },
                {
                    'shot': '25_watch_notfound.png', 'num': 11,
                    'user': 'Opens /watch with an id that resolves to nothing.',
                    'system': 'A not-found state renders with a way back into the catalog.',
                    'exact': [
                        'Action: &ldquo;Explore Music Videos&rdquo;',
                    ],
                    'limits': [
                        ('An unresolvable id shows this state; it never silently plays a different MV.',
                         'AC-EXP-09.'),
                        ('A MISSING id is different: with no id at all the screen falls back to the first item.',
                         'AC-EXP-07. Not captured &mdash; the result is P4-S1&rsquo;s screen on a different item.'),
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p5-song-play', 'num': 5,
            'name': 'Play a community song',
            'desc': 'What a song link opens on a desktop screen, and what a creator&rsquo;s song does to the list beside it.',
            'entry': 'A song card on the Home feed, a creator profile row, or /song/play?id= directly',
            'outcome': 'The song plays, from whichever playlist its id belongs to',
            'steps': [
                {
                    'shot': '26_songplay_arrival.png', 'num': 1,
                    'user': 'Opens a song link.',
                    'system': 'The browse list renders with the linked song marked. Nothing is playing yet and no player bar is showing.',
                    'limits': [
                        ('/song/play and /explore/songs are ONE screen behind two addresses.',
                         'The two were merged; the id only decides which song is queued up.'),
                        ('The row the link named is MARKED, and exactly one row is.',
                         'Product owner, 2026-09-01 (D-08). Before that a recipient landed on an unmarked catalog with no way to tell which song had been shared.'),
                        ('Marking it does NOT start it &mdash; the player bar stays closed until the visitor presses play.',
                         'The decision was explicitly &ldquo;mark the row, do not auto-play&rdquo;. Verified live: no media element is playing and the bar is still parked below the fold.'),
                    ],
                },
                {
                    'shot': '27_songplay_bar_open.png', 'num': 2,
                    'user': 'Presses play on the linked song&rsquo;s row.',
                    'system': 'The bar slides up playing that song.',
                    'limits': [
                        ('The song the bar opens on is the one the id named, not the first row of the list.',
                         'Verified live during capture.'),
                        ('The desktop screen has no disc player and no lyrics sheet.',
                         'AC-EXP-05 puts both on the result-stage player P3-S4 navigates to, and in the narrow layout&rsquo;s full-screen player.'),
                    ],
                },
                {
                    'shot': '28_songplay_creator_playlist.png', 'num': 3,
                    'user': 'Opens a song belonging to a creator&rsquo;s own collection.',
                    'system': 'The list beside it becomes that creator&rsquo;s collection, and no genre tab is marked as active.',
                    'limits': [
                        ('The playlist follows the song: a creator&rsquo;s song switches the list to that creator&rsquo;s catalog.',
                         'AC-EXP-05. It shows 8 rows in the seed data, counted live.'),
                        ('No tab is active because no tab is driving the list.',
                         'Pressing any tab returns to the community catalog.'),
                        ('Previous / Next then step through the creator&rsquo;s collection, not the community one.',
                         'The transport always follows the displayed list.'),
                    ],
                },
                {
                    'shot': '29_songplay_notfound.png', 'num': 4,
                    'user': 'Opens /song/play with an id that resolves to nothing.',
                    'system': 'A not-found state renders with a way back into the catalog.',
                    'exact': [
                        'Action: &ldquo;Explore Songs&rdquo;',
                    ],
                    'limits': [
                        ('The same rule as the MV player: an unresolvable id never silently plays something else.',
                         'AC-EXP-09.'),
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p6-creator', 'num': 6,
            'name': 'The creator profile',
            'desc': 'One screen serving two jobs &mdash; somebody else&rsquo;s public page and your own &mdash; plus the one state on this surface that only the demo panel can reach.',
            'entry': 'A creator link on either player, or the profile screen&rsquo;s own MV / Song tiles',
            'outcome': 'The visitor opens one of that creator&rsquo;s works, or acts on one of their own',
            'steps': [
                {
                    'shot': '30_creator_other_mv.png', 'num': 1,
                    'user': 'Presses a creator name on either player.',
                    'system': 'That creator&rsquo;s page opens on the Music Videos tab, with their name and two stats above it.',
                    'exact': [
                        'Stat labels: &ldquo;Plays&rdquo;, &ldquo;Likes&rdquo;',
                        'Tabs: &ldquo;Music Videos&rdquo;, &ldquo;Songs&rdquo;',
                    ],
                    'limits': [
                        ('The header shows a name and two stats &mdash; and deliberately NO email address.',
                         'AC-EXP-06. This page is public, so an email has no business on it. Verified live during capture.'),
                        ('Rows open the matching player.',
                         'AC-EXP-06. An MV row opens the MV player, a song row the song player.'),
                        ('Every creator in the seed data is the same sample creator.',
                         'One avatar and one set of stats stand behind every name on this surface; see Prototype vs production.'),
                    ],
                },
                {
                    'shot': '31_creator_other_actions.png', 'num': 2,
                    'user': 'Looks at the row controls on somebody else&rsquo;s page.',
                    'system': 'Each row offers Like and Share, side by side. There is no overflow menu.',
                    'limits': [
                        ('A visitor gets exactly two actions, and they are inline &mdash; there is no menu to open.',
                         'The owner menu is conditioned on the page being yours AND you being signed in. Verified live during capture.'),
                        ('There is no Report and no Block anywhere on this screen.',
                         'The Curation PRD puts user reporting out of scope for this release; see Prototype vs production.'),
                    ],
                },
                {
                    'shot': '32_creator_self.png', 'num': 3,
                    'user': 'Arrives on their OWN page &mdash; from the profile screen&rsquo;s MV or Song tile.',
                    'system': 'The header shows the signed-in user&rsquo;s own name, above the same stats and the same works.',
                    'limits': [
                        ('Only the IDENTITY changes in self mode &mdash; the stats and works stay the sample creator&rsquo;s.',
                         'AC-EXP-06. Verified live during capture; see Prototype vs production.'),
                        ('One screen serves two jobs: a public creator page, and your own community profile.',
                         'Only how it was opened tells the two apart.'),
                    ],
                },
                {
                    'shot': '33_creator_self_menu.png', 'num': 4,
                    'user': 'Opens the overflow menu on one of their own music videos.',
                    'system': 'Six actions, wired to the same implementations the history screen uses.',
                    'exact': [
                        'Menu, in order: &ldquo;Edit MV&rdquo;, &ldquo;Like&rdquo;, &ldquo;Share&rdquo;, &ldquo;Publish&rdquo;, &ldquo;Download&rdquo;, &ldquo;Delete&rdquo;',
                    ],
                    'limits': [
                        ('The menu needs BOTH: the page is yours, and you are signed in.',
                         'Neither alone is enough &mdash; a signed-out visit to your own page shows P6-S2&rsquo;s inline controls.'),
                        ('Publish is a switch, not a one-shot action; the other five are actions.',
                         'Verified live during capture.'),
                        ('Delete removes the row from the list and nothing else &mdash; no server is called.',
                         'See Prototype vs production.'),
                    ],
                },
                {
                    'shot': '34_creator_self_menu_song.png', 'num': 5,
                    'user': 'Opens the overflow menu on one of their own songs.',
                    'system': 'The same six slots, with the first one different.',
                    'exact': [
                        'Menu, in order: &ldquo;Create MV&rdquo;, &ldquo;Like&rdquo;, &ldquo;Share&rdquo;, &ldquo;Publish&rdquo;, &ldquo;Download&rdquo;, &ldquo;Delete&rdquo;',
                    ],
                    'limits': [
                        ('A song has no Edit here; its first slot spins off a music video instead.',
                         'The same rule the history screen&rsquo;s own menu follows. Both menus verified live during capture.'),
                    ],
                },
                {
                    'shot': '35_creator_empty_self.png', 'num': 6,
                    'user': 'Opens their own page with the demo panel&rsquo;s empty-profile switch on &mdash; /creator?self=1&amp;tab=mv&amp;demo=1.',
                    'system': 'The active tab&rsquo;s list is replaced by an empty state with an invitation to create.',
                    'exact': [
                        'Title: &ldquo;No works released yet&rdquo;',
                        'Call to action: &ldquo;Create Music Video&rdquo;',
                    ],
                    'limits': [
                        ('The demo switch is the only way to reach this state.',
                         'AC-EXP-12. The seed collections are fixed constants and can never empty on their own.'),
                        ('The call to action follows the active tab &mdash; the Songs tab offers &ldquo;Create Song&rdquo;.',
                         'AC-EXP-12.'),
                        ('Only the list is emptied &mdash; the header, the stats and the tabs all stay.',
                         'The switch is applied as the last step before rendering, so nothing underneath is disturbed.'),
                    ],
                },
                {
                    'shot': '36_creator_empty_other.png', 'num': 7,
                    'user': 'Opens somebody else&rsquo;s empty page &mdash; /creator?demo=1.',
                    'system': 'The same block, with the subtitle and the call to action gone.',
                    'limits': [
                        ('A visitor gets the title alone: no subtitle, no create button.',
                         'AC-EXP-12. Prompting a visitor to go and create on a stranger&rsquo;s page reads as wrong. Verified live during capture.'),
                        ('Nothing else on the screen changes between the two modes.',
                         'The header and tabs are identical to P6-S1.'),
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p7-empty-feed', 'num': 7,
            'name': 'The empty feed',
            'desc': 'One block, five surfaces &mdash; and the switch that is the only way to reach it.',
            'entry': 'Any feed surface with the empty-feed demo switch on',
            'outcome': 'The visitor is told the catalog is empty instead of reading blank space',
            'steps': [
                {
                    'shot': '37_feed_empty_home.png', 'num': 1,
                    'user': 'Opens the home page with the empty-feed switch on &mdash; /?demo=1.',
                    'system': 'All three rails show the same empty block. Their headings and &ldquo;See all&rdquo; links stay.',
                    'exact': [
                        'Title: &ldquo;Nothing here yet&rdquo;',
                        'Body: &ldquo;Be the first to create!&rdquo;',
                    ],
                    'limits': [
                        ('Only the ROWS are replaced &mdash; every heading and &ldquo;See all&rdquo; link stays.',
                         'Counted live with the switch on: three empty blocks, three headings, zero cards.'),
                        ('The switch is the only way to reach this state.',
                         'The seed catalogs are fixed module constants and can never be empty on their own.'),
                        ('The same block serves all five feed surfaces, sharing /creator&rsquo;s treatment.',
                         'Product owner, 2026-09-01 (D-09). Before that the rails and the song list had no empty state at all.'),
                    ],
                },
                {
                    'shot': '38_feed_empty_songs.png', 'num': 2,
                    'user': 'Opens /explore/songs with the same switch on.',
                    'system': 'The list is replaced by the block. The Top Picks rail above it and all ten tabs stay.',
                    'limits': [
                        ('The tab bar survives &mdash; the switch empties the LIST, not the screen.',
                         'Counted live: ten tabs, zero rows.'),
                        ('This surface has a SECOND trigger the others do not: a genre tab whose catalog holds no songs.',
                         'That case used to render a bare list with no message at all.'),
                    ],
                },
                {
                    'num': 3,
                    'user': 'Opens /explore/mvs with the same switch on.',
                    'system': 'The same block replaces both sections.',
                    'limits': [
                        ('Identical block, identical copy &mdash; this surface had an older, different one until 2026-09-01.',
                         'Verified live: one block, zero cards.'),
                        'No screenshot: it is the same block P7-S1 already shows, on a page P2-S1 already shows populated.',
                    ],
                },
            ],
        },
    ],

    'states': [
        ('Home rails', 'Any visitor', 'Three seed rails in fixed order, each with "See all"', 'A card opens a player; "See all" opens a catalog', 'Navigate away'),
        ('Song row', 'Desktop', 'Album art, title, Like, Share, Create', 'Art previews in place; title navigates', 'N/A'),
        ('Preview bar', 'Playing on a desktop width', 'Cover, title, Previous / Play / Next, seek, volume', 'Steps through the displayed list', 'Close, or navigate away'),
        ('/explore/mvs', 'Any visitor', 'Two sections, every seed item, no cap', 'A card opens the MV player', 'Back'),
        ('/explore/songs', 'Any visitor', 'Top Picks rail + ten tabs + the filtered list', 'A tab filters; a row previews or navigates', 'Back'),
        ('MV stage', 'An item in the feed', 'Three rotating video slots', 'A drag past the threshold commits to a neighbour', 'Navigate away'),
        ('MV stage', 'An item outside the feed', 'One video element', 'A drag always springs back', 'Navigate away'),
        ('MV stage', 'An official video', 'The YCM watermark over the video rectangle', 'Unaffected by play, pause or swipe', 'N/A'),
        ('Either player', 'An unresolvable id', 'A not-found block with an Explore action', 'The action returns to the catalog', 'N/A'),
        ('Song list', 'A creator song is playing', "That creator's collection, no tab active", 'Any tab returns to the community catalog', 'N/A'),
        ('/creator', "Somebody else's page", 'Name + stats + tabs; rows carry Like and Share', 'A row opens a player', 'Back'),
        ('/creator', 'Your own page, signed in', 'The same, plus a six-slot overflow menu per row', 'Edit / Create MV, Like, Share, Publish, Download, Delete', 'Back'),
        ('/creator', 'Empty (demo switch)', 'Header and tabs kept; the list replaced', 'On your own page only, a create CTA', 'Switch the flag off'),
        ('Any create or Like', 'Signed out', 'The sign-in modal, opened at the press', 'On success the queued action runs', 'Dismiss and stay put'),
    ],

    'errors': [
        (
            'Unresolvable id on the MV player',
            'Opening /watch?id= with an id no item matches',
            'A not-found block with an "Explore Music Videos" action; never a silent fallback to another MV',
            'Return to the catalog',
            'P4-S11',
        ),
        (
            'Unresolvable id on the song player',
            'Opening /song/play?id= with an id no song matches',
            'The same treatment, with an "Explore Songs" action',
            'Return to the catalog',
            'P5-S4',
        ),
        (
            'Missing id',
            'Opening either player with no id at all',
            'The first item of the default list plays; this is a fallback, not an error',
            'None needed',
            'Not captured &mdash; the result is P4-S1 on a different item (AC-EXP-07)',
        ),
        (
            'Empty creator collection',
            'The demo panel&rsquo;s empty-profile switch; in production, a creator with nothing published',
            'The list is replaced by an empty block; on your own page it adds a subtitle and a create CTA',
            'Create something, or browse elsewhere',
            'P6-S6, P6-S7',
        ),
        (
            'Empty rail or empty catalog',
            'A feed surface with no items; reachable today only through the empty-feed demo switch',
            'The shared empty block replaces the items; the surface&rsquo;s heading, tabs and links stay',
            'Nothing to recover &mdash; it is a state, not a failure',
            'P7-S1, P7-S2, P7-S3',
        ),
        (
            'Browser offline',
            'Losing connectivity on either explore grid',
            'An offline block replaces the grid',
            'Reconnect',
            'Not captured &mdash; it needs a network condition the capture harness does not simulate',
        ),
        (
            'A create or Like while signed out',
            'Pressing any create card, hero CTA, row Create, or Like without an account',
            'The sign-in modal opens at the press and the action is queued',
            'Sign in, and the queued action runs',
            'P1-S8, P4-S8',
        ),
    ],
    'errors_last_col': 'Where',
    'errors_note': (
        'Only one row here is a real backend failure, and it is the one that has no live state to '
        'photograph: the empty rail. Everything else on this surface reads from a fixed seed, so '
        'the only reachable empty state is the one the <code>?demo=1</code> panel drives.'
    ),

    'open_questions': [
        (
            'Q-01',
            'The Curation PRD&rsquo;s ranking RULES stand, but its numbers cannot be quoted: it contradicts itself twice on its own scoring. Trending MV&rsquo;s weight table reads 45 / 30 / 15 / 10 while its formula reads 0.35 / 0.25 / 0.15 / 0.10 (summing to 0.85); Top Picks&rsquo; table reads 60 / 40 and labels both signals as a 7-day window, while its notes say all-time and its formula reads 0.30 / 0.25 (summing to 0.55). Which half of each pair is authoritative?',
            'Nothing in this spec &mdash; no rail is ranked today. It blocks whoever implements ranking.',
            'Product / RD &mdash; the product owner settled the RULES half on 2026-09-01 (they stand, see D-07); only the numbers are reopened',
        ),
        (
            'Q-02',
            'TBD-EXP-11 &mdash; the named handover blocker &mdash; is still open after the PRD was read. The PRD defines ranking SEMANTICS (signals, weights, eligibility, refresh cadence) but no endpoint, no field names and no payload shape, so there is still nothing for the frontend to code against. What supplies the community API contract?',
            'The whole area: 17 components across these six routes run on fixed seed arrays with no API behind them.',
            'RD (tracked as TBD-EXP-11)',
        ),
        (
            'Q-03',
            'What does &ldquo;cost per the Credit Consume MSR&rdquo; resolve to, generally? (Carried per the programme&rsquo;s own convention; no step in THIS spec quotes a cost &mdash; nothing on this surface spends credits.)',
            'N/A to this spec&rsquo;s own steps; recorded because every spec in the programme carries this row',
            'Product / RD (the MSR document link is still TBD)',
        ),
    ],

    'criteria': [
        ('AC-EXP-01', 'WHEN the home page loads, THE SYSTEM SHALL render the hero, the tool selector and the three seed rails in seed order &mdash; and SHALL mount the narrow treatment of the hero and tool selector below 768px and the desktop treatment at or above it.', ['P1-S1', 'P1-S2']),
        ('AC-EXP-02', 'WHEN a hero CTA, a tool-selector card, or a row Create is pressed, THE SYSTEM SHALL run the sign-in gate and, on success, navigate to the create flow with the song pre-filled.', ['P1-S8', 'P3-S5']),
        ('AC-EXP-03', 'WHEN an MV card is pressed anywhere, THE SYSTEM SHALL open the MV player for it. WHEN a song row is pressed on /explore/songs at 768px and above, THE SYSTEM SHALL navigate to the result-stage player; WHEN the row&rsquo;s album art is pressed instead, THE SYSTEM SHALL preview it in the bottom bar WITHOUT navigating.', ['P1-S5', 'P2-S2', 'P3-S3', 'P3-S4']),
        ('AC-EXP-04', 'WHEN the MV player loads, THE SYSTEM SHALL play the MV muted in the item&rsquo;s OWN aspect ratio, with play/pause and mute, and expose Like, Share and Create Music Video pre-filling the MV create flow.', ['P4-S1', 'P4-S10']),
        ('AC-EXP-05', 'WHEN the song player loads, THE SYSTEM SHALL resolve the id to the correct playlist, present real audio progress with Previous/Next, Like/Share and a lyrics sheet where one exists, and SHALL NOT cap playback for free accounts.', ['P3-S3', 'P5-S2', 'P5-S3'], 'The disc player and the lyrics sheet live on the result-stage player (P3-S4&rsquo;s destination, owned by S1) and in the narrow layout&rsquo;s full-screen player, which is outside this spec&rsquo;s desktop-only scope (D8). The playlist resolution, the real audio and the absence of a cap are all covered by the steps listed.'),
        ('AC-EXP-06', 'WHEN the creator profile loads, THE SYSTEM SHALL show the profile header and stats and the Music Videos / Songs tabs, whose rows open the respective players; the self variant SHALL show the signed-in user&rsquo;s identity.', ['P6-S1', 'P6-S3']),
        ('AC-EXP-07', 'WHEN an id is missing or invalid on either player, THE SYSTEM SHALL fall back to a default item without crashing.', [], 'The MISSING-id half produces P4-S1&rsquo;s screen on a different item, so a screenshot of it would be indistinguishable; it is listed in the error table instead. The INVALID-id half is not a fallback at all &mdash; it is the not-found state, specified by AC-EXP-09 at P4-S11 and P5-S4.'),
        ('AC-EXP-08', 'WHEN a community Like or Create is invoked while signed out, THE SYSTEM SHALL open the sign-in modal at the action and run it on success.', ['P1-S8', 'P4-S8']),
        ('AC-EXP-08b', 'THE SYSTEM SHALL render all six surfaces at 320/375/768/1024/1440/1920px with no overflow.', [], 'Visual-only; the six-tier sweep is e2e/visual-baseline.spec.ts&rsquo;s job. This spec&rsquo;s D8 scope captures 1403&times;697 desktop only, and the behavioural differences by width are recorded in Prototype vs production instead.'),
        ('AC-EXP-09', 'WHEN a /watch or /song/play id is unresolvable, THE SYSTEM SHALL show a not-found state; WHEN an explore grid is empty or the browser is offline, THE SYSTEM SHALL show the empty / offline state.', ['P4-S11', 'P5-S4'], 'The not-found half is captured on both players. The empty and offline halves have no live trigger &mdash; the seed arrays cannot be empty and the capture harness cannot simulate offline &mdash; so both are listed in the error table, and the missing empty-rail design is Q-05.'),
        ('AC-EXP-10', 'WHEN the MV player plays an official MV, THE SYSTEM SHALL overlay the YCM watermark positioned against the video&rsquo;s own rendered rectangle; WHEN the MV is user-submitted, THE SYSTEM SHALL NOT show it.', ['P4-S1', 'P4-S3']),
        ('AC-EXP-11', 'WHEN the viewer drags vertically on the MV stage past the swipe threshold, THE SYSTEM SHALL commit to the next or previous item in the feed, replacing the URL without a full page navigation; WHEN the current id has no neighbour, THE SYSTEM SHALL take no action on any drag.', ['P4-S4', 'P4-S5', 'P4-S6', 'P4-S7']),
        ('AC-EXP-13', 'WHEN any feed surface &mdash; the three Home rails, either explore catalog, or the genre-filtered song list &mdash; has no items, THE SYSTEM SHALL render the shared empty block in place of the items, keeping the surface&rsquo;s own heading, tabs and links.', ['P7-S1', 'P7-S2', 'P7-S3']),
        ('AC-EXP-14', 'WHEN /song/play is opened with an id, THE SYSTEM SHALL mark that song&rsquo;s row in the list and SHALL NOT begin playback or open the player bar until the visitor starts it.', ['P5-S1', 'P5-S2']),
        ('AC-EXP-12', 'WHEN the creator profile loads with the empty-profile demo switch on, THE SYSTEM SHALL render the active tab&rsquo;s list as an empty block; WHEN it is also the self variant, THE SYSTEM SHALL additionally show the subtitle and a tab-specific create CTA.', ['P6-S6', 'P6-S7']),
    ],

    'prototype_deltas': [
        (
            'There is no community API at all',
            'Every rail, grid, player and profile on these six routes reads a fixed array compiled into the app. There is no feed endpoint, no detail endpoint, no like, no share, no publish and no creator endpoint.',
            'This is the named handover blocker (Q-02 / TBD-EXP-11). Production needs the whole contract before any of these screens can be wired.',
        ),
        (
            'Nothing is ranked, gated, moderated or refreshed',
            'The Curation PRD specifies four independently ranked rails with per-signal scoring, eligibility gates, dedup rules and 1-hourly / 6-hourly refresh jobs, plus an AI review pass on publish and a human moderation queue with admin pin/unpin. None of it exists: order is array order and nothing is reviewed.',
            'Backend work, and the PDF is the authority on the rules themselves &mdash; this spec deliberately does not restate its formulas as requirements (see References, and Q-01 on its internal contradictions).',
        ),
        (
            'The prototype&rsquo;s layout supersedes the PRD&rsquo;s',
            'The PRD describes four rails, a 10-card auto-advancing Trending carousel, a paginated 2-column masonry grid for New MVs, and a top-50-computed / top-20-shown model with an infinite-scroll See All for Top Picks. The shipped screens are three rails, a scroll row with arrows, an uncapped justified gallery, and a tabbed list.',
            'Settled at this spec&rsquo;s Phase 0 gate (product owner, 2026-09-01): the designer prototype superseded the PRD&rsquo;s layout, so the spec follows the screen. Recorded so nobody re-derives the PRD&rsquo;s numbers as a gap.',
        ),
        (
            'There is one creator behind every name',
            'Every avatar, every stat pair and every creator link on this surface resolves to the same sample creator. The self variant of the profile shows the signed-in user&rsquo;s identity over that sample creator&rsquo;s stats and works.',
            'Production needs real creator records. Until then, QA cannot tell two creators apart on this surface.',
        ),
        (
            'Likes, shares and plays are not counted',
            'A Like changes this browsing session and nothing else &mdash; not persisted, not counted, gone on reload. The counts shown on cards and profiles are fixed numbers in the seed data.',
            'Production needs real counters and storage.',
        ),
        (
            'The whole song catalog is two audio files',
            'Audio is derived per id from two demo tracks, because the song entity carries no audio field. Playback is genuinely real &mdash; a real audio element, real duration, real seeking &mdash; but every song is one of two sounds.',
            'Production supplies a real per-song audio URL. Nothing about the playback behaviour changes.',
        ),
        (
            'The overflow menu&rsquo;s actions are local',
            'Publish, Download and Delete on your own profile reuse the history screen&rsquo;s implementations, which act on in-memory state: Delete removes the row from the list, Publish flips a local flag.',
            'Production needs the real publish pipeline and a real delete; the publish-to-feed pipeline in particular does not exist at all.',
        ),
        (
            'The empty feed exists but has no real trigger',
            'All five feed surfaces now render the same empty block, but only the demo switch can reach it &mdash; the seed catalogs are module constants. The one exception is /explore/songs, where a genre tab with no songs empties the list for real.',
            'Production reaches it whenever the feed returns zero items. Nothing more is needed: the state is built, not stubbed.',
        ),
        (
            'Two behaviours differ below 768px and are not captured',
            'The MV catalog hides its second section, so a phone reaches 3 of the 14 seed items; and the song screens replace the preview bar with a full-screen player that carries the lyrics sheet and the disc the desktop screen does not have.',
            'Not a production gap &mdash; recorded because this spec is desktop-only by scope (D8), so neither appears in the captures above.',
        ),
        (
            'The MV stage photographs black in these captures',
            'The capture browser cannot decode the video codec the sample MVs use, so the stage is a blank rectangle in every /watch screenshot. Everything the spec asserts there &mdash; the meta row, the actions, the transport, the watermark, the drag &mdash; sits over the stage and photographs correctly.',
            'Not a product defect and not a production gap. Recorded so a reader does not report the blank stage as one; see D-04 for the recommendation it produced.',
        ),
    ],

    'decisions': [
        ('D-01', 'PLAN.md estimated ~6 paths / ~30 shots. This spec is 6 / 36 &mdash; is that scope creep?', 'No, and both causes are structural. /watch grew two acceptance criteria in the days before this build &mdash; the official-video watermark and the vertical swipe feed &mdash; and the swipe needs three states to specify (held, committed, and an id with no neighbour). Separately, AC-EXP-03 turned out to carry TWO affordances on one row: the album art previews and the title navigates, so covering it takes two captures rather than one. Confirmed with the product owner at the Phase 0 gate, 2026-09-01.'),
        ('D-02', 'The Curation PRD disagrees with the shipped screens on nearly every layout rule. Which wins?', 'The shipped screen, on every layout question &mdash; product owner at the Phase 0 gate, 2026-09-01: the designer prototype superseded the PRD for the home page and, on the same reasoning, for both explore pages. The PRD&rsquo;s rail count, carousel sizes, pagination model and item caps are recorded once as superseded (see Prototype vs production) rather than carried as gaps for RD to close.'),
        ('D-03', 'How does this spec carry the PRD&rsquo;s ranking and moderation layer, which is entirely unbuilt?', 'By marking that it exists and pointing at the PDF, not by restating it &mdash; product owner at the Phase 0 gate: the prototype does not implement detailed ranking or moderation, so the spec only needs to note it, and the PDF is the authority for anything further. One Prototype-vs-production row names the whole layer; no step asserts any of it as current behaviour, and the two places the PRD contradicts itself are Q-01 rather than quoted numbers.'),
        ('D-04', 'The MV stage is blank in every /watch capture. Fix it, or ship it?', 'Ship it, and say so. The capture browser cannot decode the sample MVs&rsquo; codec &mdash; a documented limitation of this repo&rsquo;s capture environment, not a defect. Injecting a still frame at capture time was rejected: a screenshot showing something the app does not render is a fabricated capture, and provenance outranks a prettier picture. The recommendation that came out of it &mdash; give the player&rsquo;s videos the poster image the home hero already uses, so a non-decoding browser shows the design instead of a hole &mdash; is reported to the product owner rather than applied here, since a build session has no authority over app code.'),
        ('D-05', 'Does the sign-in gate belong in this spec at all, given S6 owns the modal?', 'The gate does; the modal does not. On this surface the gate fires at the ACTION rather than at the route, which is a rule about these screens and is specified by two of their own acceptance criteria. So P1-S8 and P4-S8 show that it opens and what it blocks, and stop there &mdash; the modal&rsquo;s own behaviour, dismissal and success animation are S6&rsquo;s.'),
        ('D-06', 'Desktop only, or add narrow captures for the two screens that behave differently?', 'Desktop 1403&times;697 only (D8), confirmed at the Phase 0 gate. Neither difference is a different component tree of the kind that earned S6 and S3 their exceptions: one is a CSS section-hiding rule and the other is a layout swap on the same screen. Both are recorded in Prototype vs production rather than left invisible.'),
        ('D-07', 'The rail titled &ldquo;Trending Music Videos&rdquo; shows the NEWLY-RELEASED catalog, and the catalog the PRD calls Trending has no entry point on the home page at all. Title wrong, data wrong, or neither?', 'Neither &mdash; product owner, 2026-09-01. Once ranking is wired, &ldquo;Trending&rdquo; will BE the ranked result and the rail&rsquo;s name comes true; what it shows today is the seed data standing in for a rank that does not exist yet. The spec records what the rail is fed rather than treating the name as a defect, and no code changed. QA should not file the mismatch.'),
        ('D-08', 'A shared song link landed the recipient on an unmarked browse list &mdash; nothing said which song the link named, because the player bar only opens once playback starts. Fix, and how?', 'Mark the row, do NOT auto-play &mdash; product owner, 2026-09-01. Autoplay was rejected: browsers block it without a user gesture, so it would have opened a silent bar and looked broken in a different way. The row now carries a resting highlight (not the playing state, which also swaps the album-art glyph), and the bar still waits for a press. Both halves are asserted by e2e, in both directions.'),
        ('D-09', 'The three Home rails and /explore/songs&rsquo; list had NO empty state, and /explore/mvs had an older, different one. Build now, or wait for a design?', 'Build now, reusing /creator&rsquo;s block &mdash; product owner, 2026-09-01, explicitly &ldquo;do not wait for a drawing&rdquo;. All five feed surfaces now share it (P7). One thing was decided rather than inherited and is flagged for confirmation: the VISUAL is /creator&rsquo;s, but the COPY is the existing feed empty state&rsquo;s (&ldquo;Nothing here yet&rdquo; / &ldquo;Be the first to create!&rdquo;) rather than /creator&rsquo;s &ldquo;No works released yet&rdquo;, which is about one person&rsquo;s own output and reads wrong on a global feed. Both strings were already approved; inventing a third would have put an unsourced product decision into this spec. No CTA, because a feed has no owner for the /creator rule to key off.'),
        ('D-10', 'What happens to the Curation PRD&rsquo;s ranking layer now that its layout half is superseded?', 'The RULES stand and the NUMBERS do not &mdash; product owner, 2026-09-01. The scoring design is still what the backend will implement, so the spec keeps pointing at the PDF for it; but its two self-contradictions mean no weight in that document can be quoted as authoritative, and the values have to be reissued before anyone builds against them. That is why Q-01 stays open on the numbers alone.'),
        ('D-11', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo, same as S1 and S3 through S7.'),
    ],

    'references': [
        (
            'YouCam Muse Explore Curation PRD (V2)',
            'ycmuse-app-skill/YouCam_Muse_Explore_Curation_PRD  -  V2.pdf',
            'The authority on the ranking, eligibility, moderation and refresh layer &mdash; none of which is built. Read in full before this spec&rsquo;s Phase 0 gate. Its layout half is superseded by the designer prototype (D-02); its scoring half contradicts itself in two places (Q-01); and it supplies no API contract, so it does not close TBD-EXP-11 (Q-02).',
        ),
        (
            'Area spec 04 — Explore &amp; Community',
            'specs/areas/04-explore-community.md',
            'The behaviour-first as-built spec these screenshots walk. AC-EXP-01..12 are traced in QA Coverage.',
        ),
    ],

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Home["/ - Home feed: hero + 2 create cards + 3 seed rails"] --> Rails{Which control?}\n'
        '  Rails -->|album art| Preview["SongPlayBar previews in place - no navigation"]\n'
        '  Rails -->|See all: MVs| ExpMv["/explore/mvs - 2 sections, every item"]\n'
        '  Rails -->|See all: songs| ExpSong["/explore/songs - Top Picks rail + 10 genre tabs"]\n'
        '  Rails -->|MV card| Watch\n'
        '  ExpMv -->|a card| Watch["/watch?id - stage + floating meta + transport"]\n'
        '  ExpSong -->|row title| Result["/song/result (S1)"]\n'
        '  ExpSong -->|a song| Play["/song/play?id - same screen, bar opens on play"]\n'
        '  Watch -->|drag past threshold| Watch\n'
        '  Watch -.->|official MV| Mark["YCM watermark over the video"]\n'
        '  Watch -->|Create MV| Room["/mv/room pre-filled (S2)"]\n'
        '  Play -->|Create AI Song| Song["/song/create pre-filled (S1)"]\n'
        '  Play -.->|a creator song| List["The playlist follows the song; no tab active"]\n'
        '  Watch -->|creator| Creator["/creator"]\n'
        '  Play -->|creator| Creator\n'
        '  Creator --> Whose{Whose page?}\n'
        '  Whose -->|someone else| Other["Like + Share inline, no menu"]\n'
        '  Whose -->|your own| Own["Six-slot overflow menu per row"]\n'
        '  Gate["Sign-in modal - at the action (S6)"]\n'
        '  Home -.->|Create or Like, signed out| Gate\n'
        '  Watch -.->|Like, signed out| Gate\n'
        '  Bad["Unresolvable id: not-found + an Explore action"]\n'
        '  Watch -.-> Bad\n'
        '  Play -.-> Bad\n'
        '  Demo["?demo=1 empty-profile switch"] -.-> Empty["No works released yet"]\n'
        '  Creator -.-> Empty\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'home', 'HomeView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'home', 'ToolSelectorSectionV3.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'home', 'HeroBannerSectionV3.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'home', 'NewMVsSection.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'home', 'TopPicksSection.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'home', 'NewSongsSection.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'community', 'MvExplore.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'community', 'MvGridSections.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'community', 'CommunityMvPlayer.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'community', 'CreatorProfile.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'community', 'EmptyState.tsx'),
        # P7's block. Its two strings also live in EmptyState.tsx (they are
        # deliberately the same copy), but this is the component that actually
        # renders them on the five feed surfaces.
        os.path.join(WEB_APP, 'src', 'components', 'community', 'FeedEmpty.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'song', 'SongDetailView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'song', 'SongPlayBar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'SectionHeader.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ListItem.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'TopSongListItem.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ShareDialog.tsx'),
        # The nine genre chips the tab bar imports verbatim (P3-S1) live here,
        # not in any component — omitting it would make ten quoted tab labels
        # look invented.
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'mock.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'community.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'demoStore.ts'),
    ],
    'strings_ignore': [
        # `aria-label="Like"` / `"Share"` etc. are JSX ATTRIBUTE VALUES, and
        # `plain()`'s tag-stripper removes the whole opening tag — attributes
        # included — before the scan. Same class of miss S5 and S7 each
        # documented for their own dialog titles. All confirmed live during
        # capture (16, 22, 23).
        'Mute',
        'Fullscreen',
        # Composed at render time in `IconButton`/`ListItem` as a template
        # literal (`` `Play ${title}` ``, `liked ? "Unlike" : "Like"`), so the
        # rendered form never appears literally in source and the source form
        # never appears literally on screen. Confirmed live (03, 04, 13).
        'Previous',
        'Next',
        # ShareDialog writes this as `Shareable public link to “{title}”` — the
        # quoted half is split around a JSX expression, so no contiguous source
        # substring matches. Confirmed live (06, 23).
        'Shareable public link to',
        # The documented tag-stripper misfire, and this one was MEASURED rather
        # than assumed. `lint_spec.plain()` strips `<[^>]+>` from the whole
        # concatenated haystack, so a bare `<` in TypeScript opens a pseudo-tag
        # that runs to the next `>` anywhere at all. In `community.ts` the `<`
        # in the comment `mvIndex < 0` opens one that closes 820 characters
        # later on the `>` of `Record<string, string>` — and the line it eats on
        # the way is `export const OFFICIAL_CREATOR_NAME = "YouCam Muse"`, the
        # very string P4-S3 quotes. Confirmed live (18): it is the creator name
        # rendered on every official video.
        'YouCam Muse',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
