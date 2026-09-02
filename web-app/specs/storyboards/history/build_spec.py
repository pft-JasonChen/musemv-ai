#!/usr/bin/env python3
"""yco-spec build script — History ("My Creations") storyboard.

Screenshot source: **live app capture**, not a static prototype — same
convention as `song-creation/build_spec.py` (S1). Every screenshot in
specs/screenshots/ was captured driving the real Next.js dev server
(`npm run dev -- -p 3220`) with Playwright, signed in via the same
`localStorage['muse_auth']` seed the e2e specs use. Full-page shots, not
viewport clips — see `capture_screenshots.py`'s own docstring for why.

Source of truth for every rule/copy string not directly re-verified against
the running app: specs/areas/05-history.md and specs/00-overview.md. Every
quoted string below was independently re-confirmed against the live app's
accessibility tree during capture (see the `_review/*.webp` thumbnails
written alongside the PNGs).

Scope (agreed at the Phase 0 gate recorded in specs/storyboards/PLAN.md,
2026-08-27): six paths, 1:1 with area 05's own HIST-P1..HIST-P6 journeys —
Browse & filter, Open a creation, the (...) menu (all five row-type
variants), Publish, Delete, and Edit MV / Create MV (menu tap only, no
follow-through into /mv/edit, /mv/storyboard or /mv/room — those screens
belong to S2/S3). Desktop 1440 only (D8) — captured at 1403x697, this
repo's established viewport (see AGENTS.md / the song-creation spec).
Comments layer disabled (no Firebase backend in this repo).

One gap surfaced at the Phase 0 gate, not built here: there is no review-
REJECTED state anywhere in the app (`confirmPublishMv()` sets `reviewing`
and `published` together and nothing ever clears `reviewing`). Flagged as
`TBD-HIST-05` in areas/05-history.md and carried into `open_questions`
below — not simulated for the capture.

Two small, genuine facts surfaced only by driving the live app, not
guessable from the area spec's prose alone (recorded as `decisions` below,
not `prototype_deltas` — neither is a prototype simplification, both are
just what the code actually does):
  - The Liked filter's "delete-to-empty" framing in PLAN.md's own scope note
    does not match the code: community rows never expose a Delete action at
    all (the (...) menu's community variant is Like/Share only). The empty
    state is reached by Unlike, not Delete — still one click on the one
    seeded community-liked row, just a different verb. See D-01.
  - Cinematic Night and Golden Hour are both seeded `liked: true`
    (HISTORY_SAMPLES in mock.ts), so their (...) menus open already reading
    "Unlike", not "Like" — captured as-is (P3-S1, P3-S2) rather than choosing
    unliked rows to force a "Like" label, since the menu always reflects
    live state and QA should see that on a real seed row. The one-way
    Like-to-Unlike demonstration (P3-S6) uses Neon City Nights instead,
    which is seeded `liked: false`.

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory; this repo is TypeScript/React, so relevant files are listed
individually below, following S1's precedent — see that file's docstring
for why the tag-stripper misfires on TSX and what that means for
`strings_ignore`.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/history
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE
AREA05 = os.path.join(WEB_APP, 'specs', 'areas', '05-history.md')

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'History (My Creations)',
    'breadcrumb': 'YouCam Muse Web &rarr; History',
    'author': 'Jason Chen', 'date': '2026-09-02', 'status': 'Draft',
    'version': 'v2',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        'The signed-in user&rsquo;s &ldquo;My Creations&rdquo; list (/history): filterable cards '
        'merging live in-memory jobs with a static seed, a per-row &ctdot; options menu, and the '
        'delete/publish confirm flows.'
    ),
    'background': (
        'The third spec in this repo&rsquo;s yco-spec storyboard programme (specs/storyboards/'
        'PLAN.md), following the trial Song Creation spec (S1) and preceding the shared Credits '
        'IAP spec (S5). Both S1 and S2 (AI Music Video) already end their happy paths with one '
        'step showing the new row appear in History and explicitly leave History&rsquo;s own '
        'behavior out of scope &mdash; this spec is what pays that off.'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of every /history behavior they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web (desktop) &mdash; captured at 1440px'],
        ['Audience', 'QA'],
        ['Scope', 'Browse &amp; filter, opening a creation, the &ctdot; menu (all five row-type variants), Publish, Delete, and the Edit MV / Create MV menu actions (tap only &mdash; see P6).'],
        ['Out of scope', 'The destination screens themselves (/mv/result area 02, /song/result area 03, /mv/storyboard &amp; /mv/edit area 02, /song/play area 04) &mdash; each gets one arrival step here and no further tour.'],
        ['Source', 'specs/areas/05-history.md, specs/00-overview.md, and the running app'],
    ],

    'short_nav': [
        'Browse &amp; filter', 'Open a creation', 'The &ctdot; menu (five row types)',
        'Publish', 'Delete', 'Edit MV / Create MV',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        {
            'id': 'p1-browse-filter', 'num': 1,
            'name': 'Browse &amp; filter',
            'desc': 'The four filter chips, and the empty state reached by emptying the cheapest one.',
            'entry': 'Sidebar &ldquo;History&rdquo;', 'outcome': 'Rows filtered per chip; empty-state card when a filter has none',
            'steps': [
                {
                    'shot': '01_all_filter.png', 'num': 1,
                    'user': 'Opens /history.',
                    'system': 'The All filter is selected by default: live jobs (newest first) prepended to the static seed, community rows excluded.',
                    'exact': ['Page title: &ldquo;My Creations&rdquo;', 'Filter chips: &ldquo;All&rdquo;, &ldquo;Music Videos&rdquo;, &ldquo;Songs&rdquo;, &ldquo;Liked&rdquo;'],
                    'limits': [
                        ('Every row shown here is the static seed &mdash; no live jobs exist in this capture session.', 'All excludes the one community seed row (AC-HIST-01).'),
                        ('A card&rsquo;s status pill reads Done, Generating&hellip;, or Failed.', 'A done storyboard shows no pill at all, only its Create MV pill.'),
                    ],
                },
                {
                    'shot': '02_mv_filter.png', 'num': 2,
                    'user': 'Taps the Music Videos filter chip.',
                    'system': 'Re-filters to mv and storyboard rows only, community still excluded.',
                    'limits': ['Music Videos = kind mv or storyboard, non-community (AC-HIST-02).'],
                    'focus': [{'box': [25.3, 11.5, 8.3, 4.9], 'type': 'action', 'label': 'Music Videos'}],
                },
                {
                    'shot': '03_songs_filter.png', 'num': 3,
                    'user': 'Taps the Songs filter chip.',
                    'system': 'Re-filters to song rows only, including the still-processing and the failed row.',
                    'limits': [
                        'Songs = kind song, non-community (AC-HIST-02).',
                        ('A processing row renders in every filter it matches, with no way to open or act on it (HIST-E1).', 'Confirmed in P2-S5: no &ctdot; button at all, and its click does not navigate.'),
                    ],
                    'focus': [{'box': [34.0, 11.5, 5.1, 4.9], 'type': 'action', 'label': 'Songs'}],
                },
                {
                    'shot': '04_liked_filter.png', 'num': 4,
                    'user': 'Taps the Liked filter chip.',
                    'system': 'Shows only community rows the user has liked &mdash; here, the single seeded community row.',
                    'limits': [
                        ('Liked never shows a liked OWN row, only community ones (HIST-03).', 'Cinematic Night is seeded liked:true but non-community, and stays excluded from this tab.'),
                        'A community row shows no status pill at all (HIST-E3) &mdash; only Done/Generating/Failed own rows do.',
                    ],
                    'focus': [{'box': [39.5, 11.5, 4.7, 4.9], 'type': 'action', 'label': 'Liked'}],
                },
                {
                    'shot': '05_liked_empty.png', 'num': 5,
                    'user': 'Opens that row&rsquo;s &ctdot; menu and taps Unlike.',
                    'system': 'The row drops out of the Liked filter immediately; with nothing left, the empty-state card renders.',
                    'exact': ['Empty state: &ldquo;Nothing here yet. Your liked will appear here.&rdquo;'],
                    'limits': [
                        ('Community rows expose no Delete action at all (P3-S4).', 'Unlike, not Delete, is the only way to empty this tab &mdash; one click, the cheapest of the four filters.'),
                        'The empty-state sentence&rsquo;s second half is the active chip&rsquo;s own label, lower-cased (&ldquo;creations&rdquo; on All) (HIST-E5).',
                    ],
                },
            ],
        },
        {
            'id': 'p2-open-creation', 'num': 2,
            'name': 'Open a creation',
            'desc': 'Where each row type routes on tap, and confirmation that a processing row is inert.',
            'entry': '/history, any filter', 'outcome': 'The row&rsquo;s own destination screen',
            'steps': [
                {
                    'shot': '06_open_done_mv.png', 'num': 1,
                    'user': 'Taps a done MV card (Cinematic Night).',
                    'system': 'Seeds the MV flow from this row and routes to /mv/result?id=&hellip; (area 02).',
                    'limits': [
                        ('Both the cover and the title are separate links to the same destination.', 'Either click intercepts and calls the same handler (R-9); middle-click and copy-link both resolve honestly since the href matches.'),
                        'The result screen&rsquo;s own controls are area 02&rsquo;s territory, not covered here (AC-HIST-04).',
                    ],
                },
                {
                    'shot': '07_open_done_song.png', 'num': 2,
                    'user': 'Taps a done song card (Golden Hour).',
                    'system': 'Seeds the Song flow and routes to /song/result?id=&hellip; (area 03).',
                    'limits': [
                        ('Genre and mood are never carried from a History row, so the result screen omits that line entirely.', 'Nothing in History records them for a seeded/live row.'),
                        ('Lyrics are looked up by the row&rsquo;s title against the mock catalog.', 'A title with no match shows no lyrics panel &mdash; the same fallback the Song Creation spec documents for a Simple-mode song.'),
                    ],
                },
                {
                    'shot': '08_open_storyboard.png', 'num': 3,
                    'user': 'Taps a storyboard card (Starlight in Your Eyes).',
                    'system': 'Seeds the MV flow and routes to /mv/storyboard?id=&hellip; (area 02).',
                    'limits': ['Same flow-seeding step P6&rsquo;s Create MV menu action uses on a storyboard row (AC-HIST-04, AC-HIST-07).'],
                },
                {
                    'shot': '09_open_community.png', 'num': 4,
                    'user': 'On the Liked filter, taps the community row (Whispers of the Past).',
                    'system': 'Routes straight to /song/play?id=&hellip; (area 04) &mdash; no flow-seeding step.',
                    'limits': [
                        ('A community row&rsquo;s destination id is its `communitySongId`, not the History row&rsquo;s own id.', 'The two happen to look similar (&ldquo;h-whispers-past&rdquo; vs &ldquo;ns-whispers-past&rdquo;) but are different keys into different data.'),
                        ('/song/play renders the full community catalog, not a standalone detail screen.', 'This row plays in the fixed player bar there &mdash; area 04&rsquo;s own territory.'),
                    ],
                },
                {
                    'shot': '', 'num': 5,
                    'user': 'Taps the processing row (New AI Song).',
                    'system': 'Nothing happens &mdash; the row has no &ctdot; button at all, and the click does not navigate.',
                    'summary': 'Confirms a processing row is inert (no menu, no navigation) &mdash; same screen as P1-S3.',
                    'limits': [('Confirmed live: zero &ctdot; buttons on the row, and the URL is unchanged after clicking its cover (HIST-E1).', '')],
                },
            ],
        },
        {
            'id': 'p3-menu', 'num': 3,
            'name': 'The &ctdot; menu &mdash; five row types, plus quick actions',
            'desc': 'One capture per row-type variant, per area 05&rsquo;s own &ldquo;Net per type&rdquo; table, plus Like/Unlike, Share and Download.',
            'entry': '/history, any filter', 'outcome': 'Menu open with that row type&rsquo;s exact action set',
            'steps': [
                {
                    'shot': '11_menu_mv_done.png', 'num': 1,
                    'user': 'Opens &ctdot; on a done MV row (Cinematic Night).',
                    'system': 'Menu shows Edit MV, Unlike, Share, a Publish toggle, Download, Delete.',
                    'exact': ['Menu rows, in order: &ldquo;Edit MV&rdquo;, &ldquo;Unlike&rdquo;, &ldquo;Share&rdquo;, &ldquo;Publish&rdquo;, &ldquo;Download&rdquo;, &ldquo;Delete&rdquo;'],
                    'limits': [('Cinematic Night is seeded liked:true, so this row&rsquo;s menu opens already reading &ldquo;Unlike&rdquo;.', 'The label always reflects live state, never a fixed &ldquo;Like&rdquo; &mdash; see P3-S6 for the reverse case.')],
                    'focus': [{'box': [35.7, 42.9, 2.0, 3.8], 'type': 'action', 'label': 'Options (&ctdot;)'}],
                },
                {
                    'shot': '12_menu_song_done.png', 'num': 2,
                    'user': 'Opens &ctdot; on a done song row (Golden Hour).',
                    'system': 'Menu shows Create MV, Unlike, Share, Publish, Download, Delete.',
                    'exact': ['Menu rows, in order: &ldquo;Create MV&rdquo;, &ldquo;Unlike&rdquo;, &ldquo;Share&rdquo;, &ldquo;Publish&rdquo;, &ldquo;Download&rdquo;, &ldquo;Delete&rdquo;'],
                    'focus': [{'box': [73.1, 42.9, 2.0, 3.8], 'type': 'action', 'label': 'Options (&ctdot;)'}],
                },
                {
                    'shot': '13_menu_storyboard.png', 'num': 3,
                    'user': 'Opens &ctdot; on a storyboard row (Starlight in Your Eyes).',
                    'system': 'Menu collapses to Create MV and Delete only &mdash; no Like, Share, Publish or Download (HIST-E7).',
                    'exact': ['Menu rows, in order: &ldquo;Create MV&rdquo;, &ldquo;Delete&rdquo;'],
                    'focus': [{'box': [91.7, 42.9, 2.0, 3.8], 'type': 'action', 'label': 'Options (&ctdot;)'}],
                },
                {
                    'shot': '14_menu_community.png', 'num': 4,
                    'user': 'On Liked, opens &ctdot; on the community row.',
                    'system': 'Menu is Like/Unlike and Share only &mdash; no CTA row, no Publish, Download or Delete (HIST-E3).',
                    'exact': ['Menu rows, in order: &ldquo;Unlike&rdquo;, &ldquo;Share&rdquo;'],
                    'focus': [{'box': [35.7, 45.9, 2.0, 4.0], 'type': 'action', 'label': 'Options (&ctdot;)'}],
                },
                {
                    'shot': '15_menu_failed.png', 'num': 5,
                    'user': 'On Songs, opens &ctdot; on the failed row (Midnight Drive).',
                    'system': 'Menu is Delete only &mdash; Like and Share are suppressed (HIST-06, HIST-E2).',
                    'exact': ['Menu row: &ldquo;Delete&rdquo;'],
                    'focus': [{'box': [91.7, 45.9, 2.0, 4.0], 'type': 'action', 'label': 'Options (&ctdot;)'}],
                },
                {
                    'shot': '16_like_toggle.png', 'num': 6,
                    'user': 'Taps Like inside an unliked MV row&rsquo;s menu (Neon City Nights).',
                    'system': 'The heart fills solid and the label flips to Unlike; the menu stays open.',
                    'limits': [('Like is local-only &mdash; no API call, no History write (TBD-EXP-08).', 'Confirmed: the toggle lives only in this page session; a reload restores the seed liked:false.')],
                },
                {
                    'shot': '17_share_dialog.png', 'num': 7,
                    'user': 'Taps Share inside a row&rsquo;s menu (Golden Hour).',
                    'system': 'The menu closes and a Share dialog opens with a copyable public link to that row.',
                    'exact': ['Title: &ldquo;Share&rdquo;', 'Body: Shareable public link to &ldquo;{title}&rdquo;', 'Button: &ldquo;Copy&rdquo;'],
                    'limits': ['Same ShareDialog and buildShareUrl(id) every other row type&rsquo;s Share uses (AC-HIST-08).'],
                },
                {
                    'shot': '18_download_toast.png', 'num': 8,
                    'user': 'Taps Download inside a row&rsquo;s menu (Golden Hour).',
                    'system': 'The menu closes; a toast reads &ldquo;Download started&rdquo;.',
                    'exact': ['Toast: &ldquo;Download started&rdquo;'],
                    'limits': [('Download saves fixture media, not the row&rsquo;s own render (TBD-HIST-01, &#128274;).', 'Song rows download the shared sample audio as &ldquo;{title}.mp3&rdquo;; mv/storyboard rows download the shared sample video as &ldquo;{title}.mp4&rdquo; (AC-HIST-08).')],
                },
            ],
        },
        {
            'id': 'p4-publish', 'num': 4,
            'name': 'Publish',
            'desc': 'MV goes through a confirm step; song publishes immediately.',
            'entry': '/history, any filter', 'outcome': 'Row marked published (song) or reviewing+published (MV)',
            'steps': [
                {
                    'shot': '19_publish_mv_confirm.png', 'num': 1,
                    'user': 'Taps the Publish toggle on an MV row (Cinematic Night).',
                    'system': 'A confirm modal opens: &ldquo;Ready to Go Public?&rdquo;.',
                    'exact': [
                        'Title: &ldquo;Ready to Go Public?&rdquo;',
                        'Body: &ldquo;Once published, your creation is visible to the community and may be shared on our social channels.&rdquo;',
                        'Buttons: &ldquo;Cancel&rdquo;, &ldquo;Confirm&rdquo;',
                    ],
                    'limits': ['Same shared confirm dialog every MV/storyboard publish action in the app uses (History, /mv/result, Community Profile).'],
                    'focus': [{'box': [49.9, 49.4, 10.8, 6.4], 'type': 'action', 'label': 'Confirm'}],
                },
                {
                    'shot': '20_publish_mv_toast.png', 'num': 2,
                    'user': 'Taps Confirm.',
                    'system': 'The row is marked reviewing and published in one write; a toast reads &ldquo;Submitted for review&rdquo;.',
                    'exact': ['Toast: &ldquo;Submitted for review&rdquo;'],
                    'limits': [
                        ('`confirmPublishMv()` sets reviewing and published together, in the same write.', 'Nothing in the app ever moves reviewing back to false on its own &mdash; see the open TBD-HIST-05 question below.'),
                    ],
                },
                {
                    'shot': '21_menu_mv_reviewing.png', 'num': 3,
                    'user': 'Reopens the same row&rsquo;s &ctdot; menu.',
                    'system': 'Edit MV is now the neutral &ldquo;Unpublish to edit&rdquo;, Publish reads &ldquo;Publish (Review)&rdquo; with the toggle on, and Delete is gone.',
                    'exact': [
                        'CTA label: &ldquo;Unpublish to edit&rdquo;',
                        'Publish label while reviewing: &ldquo;Publish (Review)&rdquo;',
                    ],
                    'limits': [
                        ('Unpublish to edit unpublishes the row on tap, then the menu reverts to plain Edit MV (MV-13).', 'It does not itself open /mv/edit &mdash; a second tap is needed once unpublished.'),
                        ('Delete is hidden whenever an MV is published or reviewing (AC-HIST-06).', 'Confirmed: the same menu that showed Delete in P3-S1 no longer does here.'),
                    ],
                    'focus': [{'box': [23.4, 65.8, 13.7, 7.5], 'type': 'info', 'label': 'Publish (Review)'}],
                },
                {
                    'shot': '22_publish_song_toggle.png', 'num': 4,
                    'user': 'Taps Publish on a song row (Midnight Drive).',
                    'system': 'Publishes immediately &mdash; no confirm modal &mdash; and a toast reads &ldquo;Published success&rdquo;.',
                    'exact': ['Toast: &ldquo;Published success&rdquo;'],
                    'limits': [
                        'A song publish never opens a confirm modal, unlike MV (AC-HIST-05).',
                        'Toggling again unpublishes directly, with a &ldquo;Unpublished success&rdquo; toast.',
                        'Delete is hidden for a published song too, same rule as MV (AC-HIST-06).',
                    ],
                    'focus': [{'box': [70.4, 72.0, 3.1, 2.9], 'type': 'info', 'label': 'Publish'}],
                },
            ],
        },
        {
            'id': 'p5-delete', 'num': 5,
            'name': 'Delete',
            'desc': 'Confirm modal, then removal from the list.',
            'entry': '/history, any filter', 'outcome': 'Row removed from the list',
            'steps': [
                {
                    'shot': '23_delete_confirm.png', 'num': 1,
                    'user': 'Taps Delete inside a row&rsquo;s menu (Midnight Drive, done song).',
                    'system': 'A confirm modal opens: &ldquo;Delete&rdquo;.',
                    'exact': [
                        'Title: &ldquo;Delete&rdquo;',
                        'Body: &ldquo;Are you sure you want to delete this item? This action cannot be undone.&rdquo;',
                        'Buttons: &ldquo;Cancel&rdquo;, &ldquo;Delete&rdquo;',
                    ],
                    'focus': [{'box': [49.8, 55.8, 11.8, 6.6], 'type': 'action', 'label': 'Delete'}],
                },
                {
                    'shot': '24_delete_removed.png', 'num': 2,
                    'user': 'Taps Delete.',
                    'system': 'The row is removed from the list immediately.',
                    'limits': [
                        ('Delete is list-local, not a server delete (&#128274;).', 'A reload restores the seed row &mdash; nothing is removed server-side.'),
                        ('Delete is hidden entirely for a published/reviewing row, before the menu is ever opened.', 'No separate capture needed &mdash; P4-S3 already shows the same live state with no Delete entry (AC-HIST-06).'),
                    ],
                },
            ],
        },
        {
            'id': 'p6-edit-create', 'num': 6,
            'name': 'Edit MV / Create MV',
            'desc': 'The &ctdot; menu tap only &mdash; the destination screens belong to S2/S3.',
            'entry': '/history, any filter', 'outcome': 'Seeds the MV flow; no follow-through capture',
            'steps': [
                {
                    'shot': '25_menu_editmv_focus.png', 'num': 1,
                    'user': '&ctdot; &rarr; Edit MV on an unpublished MV row (Cinematic Night).',
                    'system': 'Seeds the MV flow from this row and routes to /mv/edit?id=&hellip; &mdash; see area 02, S3.',
                    'limits': [('When published/reviewing, this same slot reads &ldquo;Unpublish to edit&rdquo; instead (P4-S3).', 'That tap unpublishes; it does not route anywhere on its own.')],
                },
                {
                    'shot': '26_menu_createmv_focus.png', 'num': 2,
                    'user': '&ctdot; &rarr; Create MV on a song row (Golden Hour).',
                    'system': 'Seeds the MV flow and routes to /mv/room &mdash; see area 02, S3.',
                    'limits': [
                        ('On a storyboard row the same action routes to /mv/storyboard?id=&hellip; instead of /mv/room.', 'Song has no existing storyboard to reopen; storyboard does.'),
                        ('A storyboard row also exposes this action as a cover pill (HIST-05), not just in the menu.', 'Visible on Starlight in Your Eyes in every earlier screenshot that includes it, e.g. P1-S1.'),
                    ],
                },
            ],
        },
        {
            'id': 'p7-demo-states', 'num': 7,
            'name': 'The two ?demo=1 states',
            'desc': 'Empty and slow-load &mdash; neither is reachable in a seeded prototype, so both are switches on the QA panel.',
            'entry': '/history?demo=1', 'outcome': 'The screen renders a state the seed can never produce',
            'steps': [
                {
                    'shot': '27_demo_history_empty.png', 'num': 1,
                    'user': 'Turns on &ldquo;History &mdash; no records&rdquo;.',
                    'system': 'Every filter renders its own empty card; the All tab offers a Start Creating shortcut.',
                    'exact': [
                        'Title: &ldquo;Your creations will appear here&rdquo;',
                        'Subtitle: &ldquo;Start making AI music or music videos and they&rsquo;ll all show up in one place.&rdquo;',
                        'CTA: &ldquo;Start Creating&rdquo;',
                    ],
                    'limits': [
                        ('Each of the four filters has its OWN title, subtitle and CTA.', 'Music Videos, Songs and Liked carry different copy and a different shortcut &mdash; P1-S5 shows the Liked one reached organically, by emptying the filter rather than by a flag.'),
                        ('The filter tabs and the Trending rail below both SURVIVE.', 'Only the list empties. A state that blanked the whole screen would be a different bug.'),
                        ('The panel stays on screen, collapsed.', 'That is how a tester knows which switch produced the state; dismissing it with `[x]` would clear every flag as it closed.'),
                    ],
                },
                {
                    'shot': '28_demo_history_loading.png', 'num': 2,
                    'user': 'Turns on &ldquo;History &mdash; slow load&rdquo;.',
                    'system': 'A three-dot animation replaces the list, and the filter tabs are hidden while it runs.',
                    'limits': [
                        ('The tabs are HIDDEN, not disabled.', 'Nothing is filterable before the rows exist, so the control is withdrawn rather than left inert.'),
                        ('The mock resolves instantly, so this state has no organic trigger.', 'It exists because a real backend will have one &mdash; the flag is the only way to review it before then.'),
                    ],
                },
            ],
        },
    ],

    # ── reference sections ───────────────────────────────────────────────────
    'states': [
        ('Row: processing', 'Live job status generating', 'Generating&hellip; pill, no &ctdot; menu, not clickable', '&rarr; done or failed on job outcome', '&mdash;'),
        ('Row: done (mv/song)', 'Live job done, or a done seed row', 'Status pill Done; full &ctdot; menu per kind', '&rarr; published/reviewing via Publish &middot; removed via Delete', 'On navigation away'),
        ('Row: done (storyboard)', 'Seed row, kind storyboard', 'No status pill; Create MV pill on the cover; &ctdot; menu is Create MV + Delete', '&rarr; removed via Delete', 'On navigation away'),
        ('Row: failed', 'Live job status failed, or the failed seed row', 'Failed pill, alert placeholder, &ctdot; menu is Delete only', '&rarr; removed via Delete', 'On navigation away'),
        ('Row: community', 'source is community', 'No status pill; &ctdot; menu is Like/Unlike + Share only', '&mdash; (no Publish/Delete/CTA)', '&mdash;'),
        ('MV: published/reviewing', 'Publish confirmed on an MV row', 'CTA reads &ldquo;Unpublish to edit&rdquo;; Publish reads &ldquo;Publish (Review)&rdquo;; Delete hidden', '&rarr; back to unpublished via Unpublish to edit', 'On toggle'),
        ('Song: published', 'Publish toggled on a song row', 'Publish toggle on; Delete hidden', '&rarr; back to unpublished via the same toggle', 'On toggle'),
    ],

    'errors': [
        (
            'Community row has no Delete or Publish',
            'Any &ctdot; menu opened on a source:community row (HIST-E3)',
            'Menu renders Like/Unlike and Share only &mdash; no CTA row, Publish, Download, or Delete',
            'N/A &mdash; not an error state, a deliberate reduced menu',
            'N/A &mdash; History never writes to the community backend (🔒)',
        ),
        (
            'Failed row has no Like/Share',
            'Any &ctdot; menu opened on a status:failed row (HIST-06, HIST-E2)',
            'Menu renders Delete only',
            'Delete removes the row from the list; no other recovery action exists in History',
            'N/A &mdash; nothing was charged for a failed generation to refund here',
        ),
        (
            'Reload loses live rows',
            'Any full page reload of /history (HIST-E4)',
            'Live in-memory jobs vanish; only the 8 static seed rows remain, with all overrides (liked/published/removed) reset',
            'None &mdash; there is nothing to retry; the data was never persisted',
            'N/A &mdash; 🔒 TBD-GL-04',
        ),
        (
            'Logged-out visitor',
            'Any attempt to reach /history while signed out (HIST-E6)',
            'AuthGuard renders the sign-in modal; the page body is not shown',
            'Sign in resumes the same navigation (see the Song Creation spec, P4)',
            'N/A &mdash; gated before any content renders',
        ),
    ],
    'errors_note': (
        'Publish&rsquo;s downstream server pipeline (moderation, review &rarr; community feed) is spec-only '
        '&mdash; TBD-HIST-04. This table covers only what the &ctdot; menu and its confirm modals do today.'
    ),

    'open_questions': [
        (
            'TBD-HIST-05',
            'What does a review-REJECTED MV look like? Publish sets reviewing and published together and nothing ever clears reviewing &mdash; there is no simulated delay, no rejection path, and no UI for it (status pill? a re-submit option in the menu? edit-first requirement? toast vs. persistent banner?).',
            'A &ldquo;review rejected&rdquo; step in this spec&rsquo;s Publish path (P4) &mdash; not built, per the Phase 0 scope decision.',
            'Product owner / design',
        ),
    ],

    'criteria': [
        # AC-HIST-09 (renders clean at all six widths) is NOT covered by this
        # deck and is deliberately not listed as if it were: every capture
        # here is a single desktop viewport (D8). Six-width rendering is
        # gated by e2e/visual-baseline.spec.ts.
        ('AC-HIST-01', 'The All filter shows live jobs prepended to the seed samples, community rows excluded.', ['P1-S1']),
        ('AC-HIST-02', 'Each filter chip shows only its matching rows (All=own, Music Videos=mv/storyboard, Songs=song, Liked=community-liked only).', ['P1-S2', 'P1-S3', 'P1-S4']),
        ('AC-HIST-03', 'Processing shows a Generating pill with open/menu disabled; failed shows a Failed pill and Delete-only menu; storyboard shows a Create MV pill plus a Create MV + Delete menu.', ['P1-S3', 'P2-S5', 'P3-S3', 'P3-S5']),
        ('AC-HIST-04', 'A done MV routes to /mv/result, a done song to /song/result, a storyboard to /mv/storyboard, a community row to /song/play &mdash; no detail dialog opens.', ['P2-S1', 'P2-S2', 'P2-S3', 'P2-S4']),
        ('AC-HIST-05', 'MV Publish shows the Ready to Go Public confirm and marks reviewing+published with a toast on confirm; a song publishes immediately with no confirm.', ['P4-S1', 'P4-S2', 'P4-S4']),
        ('AC-HIST-06', 'Delete confirmed removes the row; Delete is hidden for published/reviewing items.', ['P5-S1', 'P5-S2', 'P4-S3', 'P4-S4']),
        ('AC-HIST-07', 'Edit MV / Create MV seeds flow state and routes to /mv/edit / /mv/storyboard|/mv/room respectively.', ['P6-S1', 'P6-S2']),
        ('AC-HIST-08', 'Share opens ShareDialog with buildShareUrl(id); Download saves the fixture media as {title}.mp4|.mp3.', ['P3-S7', 'P3-S8']),
        ('HIST-E1', 'A processing row is not clickable and renders no &ctdot; menu.', ['P2-S5']),
        ('HIST-E3', 'A community row shows a reduced menu (Like/Share only) and no status pill.', ['P1-S4', 'P3-S4']),
        ('HIST-E5', 'An empty filter shows the &ldquo;Nothing here yet&rdquo; empty-state card.', ['P1-S5']),
    ],

    'prototype_deltas': [
        (
            'Live rows are in-memory only',
            'Live jobs prepended to the list vanish on a full page reload; only the static 8-row seed remains, and every override (liked/published/removed) resets with it.',
            'A real history endpoint (TBD-HIST-01, TBD-GL-04) must persist rows and their state server-side across reloads and devices.',
        ),
        (
            'Like / Publish / Delete are all local overrides',
            'None of the three write anywhere &mdash; `liked`/`published`/`reviewing` live in a per-row `ov` map in component state, and Delete just adds the id to a `removed` set. No API call is made for any of them.',
            'Real endpoints must exist for each; Publish additionally needs the moderation/review pipeline into the community feed that decides reviewing &rarr; published or reviewing &rarr; rejected (TBD-HIST-04, and the rejected half is TBD-HIST-05).',
        ),
        (
            'Download uses fixture media, not the row&rsquo;s own render',
            'Every song download is the same shared sample audio file; every mv/storyboard download is the same shared sample video file, regardless of which row triggered it.',
            'A real render pipeline must serve each row&rsquo;s own generated file at download time.',
        ),
    ],

    'decisions': [
        ('D-01', 'PLAN.md&rsquo;s own Phase 0 scope note describes the Liked-tab empty state as reached via &ldquo;a live delete-to-empty&rdquo; &mdash; does the code actually support deleting a community row?', 'No &mdash; confirmed live and in the &ctdot; menu&rsquo;s own net-per-type table (P3-S4): a community row exposes Like/Unlike and Share only, never Delete. The empty state is reached by Unlike instead, still the cheapest single click on the one seeded community-liked row. Captured as Unlike (P1-S5), not Delete.'),
        ('D-02', 'Cinematic Night and Golden Hour are both seeded liked:true &mdash; use them for the &ctdot; menu captures anyway, or pick unliked rows so the menu opens on &ldquo;Like&rdquo;?', 'Used them as-is (P3-S1, P3-S2): the menu always reflects live seed state, and showing that live state (here, &ldquo;Unlike&rdquo;) is more honest than staging an artificial &ldquo;Like&rdquo; label. The one Like-to-Unlike demonstration (P3-S6) uses Neon City Nights, which is seeded liked:false, so that transition is still shown once.'),
        ('D-03', 'Where does the History storyboard stop relative to the screens each row opens?', 'One arrival step per destination (P2), with its own controls left to that screen&rsquo;s own area spec/storyboard (area 02/03/04, S2/S3/S8) &mdash; matching S1&rsquo;s own precedent at the History boundary, applied here in the other direction.'),
        ('D-04', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo yet, same as S1.'),
    ],

    'references': [],

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Entry["Sidebar &quot;History&quot;"] --> All["/history (All filter)"]\n'
        '  All --> Filter{Filter chip?}\n'
        '  Filter -->|Music Videos / Songs / Liked| Filtered["Re-filtered rows"]\n'
        '  Filter -->|none left| Empty["Empty-state card"]\n'
        '  All --> Row{Tap a row}\n'
        '  Row -->|done mv| MvR["/mv/result (area 02)"]\n'
        '  Row -->|done song| SongR["/song/result (area 03)"]\n'
        '  Row -->|storyboard| SB["/mv/storyboard (area 02)"]\n'
        '  Row -->|community| Play["/song/play (area 04)"]\n'
        '  Row -->|processing| Inert["(inert, no menu)"]\n'
        '  All --> Menu["&ctdot; menu (5 row-type variants)"]\n'
        '  Menu --> Quick["Like/Unlike &middot; Share &middot; Download"]\n'
        '  Menu --> PubMv{Publish, kind?}\n'
        '  PubMv -->|MV| Confirm["Ready to Go Public? confirm"]\n'
        '  Confirm --> Reviewing["reviewing+published, toast"]\n'
        '  PubMv -->|song| Toggle["Immediate toggle, toast"]\n'
        '  Menu --> Del["Delete confirm"]\n'
        '  Del --> Removed["Row removed (local)"]\n'
        '  Menu --> Cta["Edit MV / Create MV (area 02, S3)"]\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'history', 'HistoryView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'history', 'useOpenCreation.ts'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'PublishConfirmDialog.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ShareDialog.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'Modal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ToggleSwitch.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'RoomNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'mock.ts'),
    ],
    'strings_ignore': [
        # {title} interpolated into the ShareDialog body at render time — the
        # curly-brace template is not literal on-screen text. Confirmed live
        # (P3-S7's screenshot shows "Shareable public link to Golden Hour").
        'Shareable public link to .',
        # HistoryView.tsx assembles the empty-state sentence from three JSX
        # text nodes ("Nothing here yet. Your " + {filterLabel} + " will
        # appear here."), so the literal quoted sentence in P1-S5 (with
        # "liked" substituted in) matches no single string in source. Directly
        # confirmed against the live accessibility tree during capture
        # (specs/screenshots/_review/05_liked_empty.webp).
        'Nothing here yet. Your liked will appear here.',
        # lint_spec.py's plain() tag-stripper regex (<[^>]+>) misfires on TSX:
        # OptRow's `label={p.liked ? "Unlike" : "Like"}` is a multi-line JSX
        # attribute with no `>` inside it before the tag's own closing `/>`,
        # so the regex treats the whole attribute list (including both quoted
        # string values) as "tag" and deletes it. `label` renders as the
        # button's visible text, so this is a real on-screen string, not an
        # invented one — confirmed directly via `grep '"Unlike"'
        # HistoryView.tsx` and independently against the live app (P3-S1,
        # P3-S2, P3-S4). Same false-positive class song-creation/build_spec.py
        # records for a different cause (a stray `<`/`>` from a comparison).
        'Unlike',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
