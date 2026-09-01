#!/usr/bin/env python3
"""yco-spec build script — Share (S9) storyboard.

Screenshot source: **live app capture**, not a static prototype — the same
convention every other spec in this programme follows. Each screenshot in
specs/screenshots/ was captured by driving the real Next.js dev server with
Playwright (`capture_screenshots.py`).

THE RECIPIENT SESSION IS SIGNED OUT ON PURPOSE, and this is the one spec in
the programme where that is the default rather than the exception. `/share` is
public by design and is mostly opened by people with no account; seeding
`localStorage['muse_auth']` would photograph a state a real recipient never
sees. Only P5 — the dialog that MINTS a link, which lives on a player screen
rather than on `/share` — runs signed in.

ONE VIEWPORT — D8 stands: desktop 1403x697 only, this repo's established
capture viewport.

SCOPE — agreed at the Phase 0 gate, 2026-09-01
    Five paths, 15 captures. PLAN.md estimated ~4 paths / ~12 shots, and the
    growth has ONE cause, which is also the reason this spec had to be built
    from the code rather than from its area spec: **`/share` was redesigned on
    2026-08-24** (product owner, Figma "Share Page - MV"), reversing the
    2026-07-23 "simplified chrome" decision that `specs/areas/10-share.md`
    still describes. The page is no longer a logo, some media and a Download
    button. It now carries a full custom media controller (play/pause, elapsed
    and total time, seek, mute, fullscreen), a three-item More menu, and a
    SECOND action pill. Area 10 is corrected in the same branch under D11; the
    extra path is the More menu, whose three actions would otherwise have no
    photograph anywhere in the programme.

TWO THINGS THIS RUN MEASURED THAT NO DOCUMENT SAYS
    1. **The MV panel has NO title and NO creator; the song panel has both.**
       The component's own header comment says "title/creator ... are back"
       without saying which panel, and area 10 says neither has them — which
       was true before the redesign and is now wrong in both directions.
       Read off the live DOM; recorded as a decision and as an open question.
    2. **The share page's video photographs, unlike `/watch`'s.** Same codec
       limit in this capture browser, but `MvPanel` passes a `poster`, which
       is exactly what a non-decoding browser paints. That one attribute is
       the whole difference between these captures and S8's blank stage.

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory; this repo is TypeScript/React, so the relevant files are listed
individually below, following S1/S3/S4/S6/S7/S8's precedent.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/share
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'Share',
    'breadcrumb': 'YouCam Muse Web &rarr; Share',
    'author': 'Jason Chen', 'date': '2026-09-01', 'status': 'Draft',
    'version': 'v1',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        'The public share link and the dialog that mints it: <code>/share</code> &mdash; a bare, '
        'unauthenticated landing page carrying the media, a full playback controller and two '
        'actions &mdash; and <code>ShareDialog</code>, the copy-link-only dialog every result and '
        'player screen in the app opens.'
    ),
    'background': (
        'The tenth spec in this repo&rsquo;s yco-spec storyboard programme (specs/storyboards/'
        'PLAN.md), covering area 10 end to end. It is its own spec rather than a section of the '
        'screens that link to it because <code>/share</code> is the one surface that is public by '
        'design and never expires (programme decision D6); S1, S2, S4 and S8 each name the shared '
        'dialog and add only what they do differently.'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of what a share-link recipient sees, and of the dialog that produced the link.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web &mdash; captured at 1403&times;697 (desktop only, D8)'],
        ['Audience', 'QA'],
        ['Scope', '/share for a valid MV and a valid song (panel, controller, More menu, both action pills), the unavailable state and all three ways to reach it, the legacy share URL, and the ShareDialog with its Copy confirmation.'],
        ['Out of scope', 'The result and player screens that OPEN the dialog (areas 02/03/04 &mdash; S1, S2, S8, which capture the entry points); real server-side link resolution, which does not exist (see Prototype vs production); share-link analytics, which has no field spec yet.'],
        ['Source', 'specs/areas/10-share.md (&sect;&sect;1-9, AC-SHARE-01..06) and the running app'],
    ],

    'short_nav': [
        'Valid MV link', 'The More menu', 'Valid song link', 'Unavailable', 'Minting a link',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p1-mv-link', 'num': 1,
            'name': 'A valid MV link',
            'desc': 'What a recipient with no account gets when the link resolves to a music video.',
            'entry': 'Opening /share?id= &mdash; no sign-in, no app',
            'outcome': 'The recipient watches it, saves it, or goes to the product',
            'steps': [
                {
                    'shot': '01_mv_valid_link.png', 'num': 1,
                    'user': 'Opens a shared music-video link, with no account and nothing signed in.',
                    'system': 'A bare page: a logo header, the video, and two actions. No app chrome of any kind.',
                    'exact': [
                        'Header wordmark: &ldquo;YouCam Muse&rdquo;',
                        'Actions: &ldquo;Download&rdquo;, &ldquo;Create MV&rdquo;',
                    ],
                    'limits': [
                        ('The page renders with NO sidebar, tab bar, header or navbar.',
                         'AC-SHARE-01. Verified on every state below, not only this one.'),
                        ('The MV panel shows the media and nothing that identifies it &mdash; no title, no creator.',
                         'Measured live. The song panel DOES show both, which is why P3 is a separate path; raised as Q-01.'),
                        ('The route is not behind any guard, and nothing on it asks for an account.',
                         'The whole point of a share link is that the recipient does not have one.'),
                    ],
                },
                {
                    'shot': '02_mv_controller.png', 'num': 2,
                    'user': 'Looks at the controller under the video.',
                    'system': 'Play/pause, the elapsed and total time, a seek bar, mute, fullscreen and a More control.',
                    'limits': [
                        ('The controller is the product&rsquo;s own, not the browser&rsquo;s default video controls.',
                         'AC-SHARE-01 as redesigned 2026-08-24; it matches the vocabulary the in-app players use.'),
                        ('The seek control is keyboard-operable, like every other seek bar in the app.',
                         'It is the shared seek component, not a bespoke one.'),
                        'The time reads elapsed and total as one pair, not as two separate labels.',
                    ],
                },
                {
                    'shot': '03_mv_actions.png', 'num': 3,
                    'user': 'Looks at the two pills below the panel.',
                    'system': 'Download on the left, a gradient Create action on the right.',
                    'limits': [
                        ('Download saves the media under the creation&rsquo;s own title with the matching extension.',
                         'AC-SHARE-05.'),
                        ('Download renders only when there is a media URL to save.',
                         'A creation with no file offers no Download.'),
                        ('The Create pill&rsquo;s LABEL follows the media kind, but its destination does not.',
                         'Both go to the home page, so a visitor with no account meets the product first instead of being dropped into a create flow. Confirmed live.'),
                    ],
                },
                {
                    'shot': '04_mv_history_sample.png', 'num': 4,
                    'user': 'Opens a link to one of the sample creations, in a completely fresh session.',
                    'system': 'It resolves and plays, exactly like a community item.',
                    'limits': [
                        ('An id resolves from four sources in order: community MV, community song, your own completed creation, then the samples.',
                         'AC-SHARE-01. The first, second and fourth survive a reload; the third does not &mdash; see P4-S4.'),
                        ('Which source an id came from changes nothing on screen.',
                         'Verified live: the sample renders the same panel as P1-S1.'),
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p2-more-menu', 'num': 2,
            'name': 'The More menu',
            'desc': 'Three actions the redesign added, and the one that behaves differently from the other two.',
            'entry': 'The More control on a valid MV link',
            'outcome': 'The recipient saves the file, changes the speed, or pops the video out',
            'steps': [
                {
                    'shot': '05_mv_more_menu.png', 'num': 1,
                    'user': 'Presses More on the controller.',
                    'system': 'A three-item menu opens over the video.',
                    'exact': [
                        'Menu, in order: &ldquo;Download&rdquo;, &ldquo;Playback Speed&rdquo;, &ldquo;Picture in Picture&rdquo;',
                    ],
                    'limits': [
                        ('Exactly three items, in this order.',
                         'Read off the live menu during capture.'),
                        ('Download here is the same action as the pill below the panel.',
                         'AC-SHARE-05. It is offered twice, not two different things.'),
                        ('The menu closes on Escape, on an outside press, and on Download or Picture in Picture.',
                         'Those two are one-shot actions; Playback Speed is not &mdash; see P2-S2.'),
                    ],
                },
                {
                    'shot': '06_mv_playback_speed.png', 'num': 2,
                    'user': 'Presses Playback Speed repeatedly.',
                    'system': 'The rate beside it changes on each press and the menu stays open.',
                    'limits': [
                        ('Playback Speed CYCLES; it does not open a submenu and does not close the menu.',
                         'Measured live across three consecutive presses, each landing on a different rate.'),
                        ('The rate shown beside the item is the rate actually applied to the video.',
                         'Confirmed live by reading it back off the media element.'),
                        ('The cycle wraps, so the starting rate comes back round.',
                         'There is no reset control; pressing on is how you get back.'),
                    ],
                },
                {
                    'num': 3,
                    'user': 'Presses Picture in Picture.',
                    'system': 'The video pops out into the browser&rsquo;s own floating window, and the menu closes.',
                    'limits': [
                        ('It is a no-op where the browser does not support picture-in-picture.',
                         'The item is always shown; the request is simply not made.'),
                        'No screenshot: the floating window belongs to the browser, so a page capture cannot photograph it.',
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p3-song-link', 'num': 3,
            'name': 'A valid song link',
            'desc': 'The other panel &mdash; and the only one that tells the recipient what they are listening to.',
            'entry': 'Opening /share?id= on a song',
            'outcome': 'The recipient listens, saves it, or goes to the product',
            'steps': [
                {
                    'shot': '07_song_valid_link.png', 'num': 1,
                    'user': 'Opens a shared song link.',
                    'system': 'The same bare page, with cover art above a title and a creator.',
                    'exact': [
                        'Title on this example: &ldquo;Pop Anthem&rdquo;',
                        'Creator on this example: &ldquo;MelodyMaker123&rdquo;',
                    ],
                    'limits': [
                        ('The song panel identifies its media; the MV panel does not.',
                         'Measured live on both. Raised as Q-01 &mdash; it is not clear the asymmetry is intended.'),
                        ('The creator line renders only when the media carries one.',
                         'A sample creation has no creator, so the line is simply absent.'),
                        'The header, the two action pills and the bare-page rule are identical to the MV panel.',
                    ],
                },
                {
                    'shot': '08_song_controller.png', 'num': 2,
                    'user': 'Looks at the controller under the artwork.',
                    'system': 'A single pill holding play/pause, the elapsed and total time, a seek bar, mute and download.',
                    'limits': [
                        ('The song controller carries Download; the MV controller carries fullscreen and More instead.',
                         'The two panels are different components, not one with a switch.'),
                        ('There is no fullscreen and no More menu on a song.',
                         'Neither applies to audio with a still cover.'),
                        'Playback is a real audio element — the position and duration are its own.',
                    ],
                },
                {
                    'shot': '09_song_actions.png', 'num': 3,
                    'user': 'Looks at the two pills below the panel.',
                    'system': 'Download, and a Create action labelled for a song.',
                    'exact': [
                        'Actions: &ldquo;Download&rdquo;, &ldquo;Create Song&rdquo;',
                    ],
                    'limits': [
                        ('Download saves the audio under the song&rsquo;s title with the audio extension.',
                         'AC-SHARE-05.'),
                        ('The Create pill reads differently from the MV one and goes to the same place.',
                         'Both land on the home page &mdash; see P1-S3.'),
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p4-unavailable', 'num': 4,
            'name': 'An unavailable link',
            'desc': 'One state, three ways in &mdash; and the reason it is NOT called expiry.',
            'entry': 'Opening /share with an id that does not resolve',
            'outcome': 'The recipient is told the link did not resolve, and can reach the product',
            'steps': [
                {
                    'shot': '10_unavailable_bad_id.png', 'num': 1,
                    'user': 'Opens a share link whose id matches nothing.',
                    'system': 'A message that the link is not available, under the same logo header.',
                    'exact': [
                        'Heading: &ldquo;This link isn&rsquo;t available&rdquo;',
                        'Body: &ldquo;We couldn&rsquo;t find this creation. Ask the sender to share it again.&rdquo;',
                    ],
                    'limits': [
                        ('Share links DO NOT EXPIRE &mdash; this state means an id did not resolve, and nothing else.',
                         'AC-SHARE-02. The copy deliberately says so rather than naming a deadline the product does not enforce.'),
                        ('There is no retry and no Try-the-app button &mdash; the header logo is the only way out.',
                         'AC-SHARE-02.'),
                    ],
                },
                {
                    'shot': '11_unavailable_no_id.png', 'num': 2,
                    'user': 'Opens /share with no id at all.',
                    'system': 'The same state.',
                    'limits': [
                        ('No id and an unresolvable id are one state, not two.',
                         'AC-SHARE-02. Verified live.'),
                    ],
                },
                {
                    'shot': '12_unavailable_forced.png', 'num': 3,
                    'user': 'Opens a link with the expired-state switch in the address.',
                    'system': 'The same state again, even though the id itself would have resolved.',
                    'limits': [
                        ('The switch forces the state on a GOOD id, which is how QA reaches it deliberately.',
                         'Verified live: the same id renders media without it.'),
                        ('It is a QA affordance, not a product rule &mdash; nothing in the product sets it.',
                         'It is the only way to see this state without inventing a broken id.'),
                    ],
                },
                {
                    'num': 4,
                    'user': 'Shares one of their OWN just-finished creations, and the recipient opens it.',
                    'system': 'The unavailable state &mdash; the creation exists, but not anywhere the link can reach.',
                    'limits': [
                        ('A live own creation is held in the sender&rsquo;s own session only, so no other session can resolve its id.',
                         'The community items and the static samples resolve because they are compiled in; see Prototype vs production.'),
                        ('This is the single most likely false report on this screen.',
                         'It looks exactly like a broken link and is the one case a working link produces it.'),
                        'No screenshot: the result is pixel-identical to P4-S1.',
                    ],
                },
            ],
        },
        # ══════════════════════════════════════════════════════════════════════
        {
            'id': 'p5-minting', 'num': 5,
            'name': 'Minting a link',
            'desc': 'The dialog that produces these links, and the legacy URL that still resolves to them.',
            'entry': 'Any Share control in the app; or an old-format share URL',
            'outcome': 'A link on the clipboard, or a legacy URL landing on the canonical page',
            'steps': [
                {
                    'shot': '13_legacy_url_redirect.png', 'num': 1,
                    'user': 'Opens an old-format MV share URL.',
                    'system': 'It lands on the canonical share page for the same item.',
                    'limits': [
                        ('The redirect happens on the server and keeps the active language prefix.',
                         'AC-SHARE-03. Verified live.'),
                        ('The destination is the ordinary share page &mdash; nothing about it differs.',
                         'Compare with P1-S1: same media, same panel, same actions.'),
                    ],
                },
                {
                    'shot': '14_share_dialog.png', 'num': 2,
                    'user': 'Presses Share on a player screen.',
                    'system': 'A small dialog with a read-only link and one action.',
                    'exact': [
                        'Body: &ldquo;Shareable public link to&rdquo;',
                        'Action: &ldquo;Copy&rdquo;',
                    ],
                    'limits': [
                        ('Copy is the ONLY action &mdash; no social-platform targets, no native share button.',
                         'AC-SHARE-04. Both were removed for this release; social channels are a later decision.'),
                        ('The link is the public share URL, built from the app&rsquo;s own origin.',
                         'Confirmed live: the offered link opens P1-S1.'),
                        ('The dialog is identical wherever it is opened from.',
                         'The entry points themselves are captured by the specs that own those screens.'),
                    ],
                },
                {
                    'shot': '15_share_dialog_copied.png', 'num': 3,
                    'user': 'Presses Copy.',
                    'system': 'The action confirms in place, then goes back to how it was.',
                    'exact': [
                        'Confirmation: &ldquo;Copied!&rdquo;',
                    ],
                    'limits': [
                        ('The confirmation lasts 1.5 seconds and then reverts; the dialog does not close.',
                         'So a second copy is possible without reopening it.'),
                        ('The clipboard holds exactly the link the field was showing.',
                         'Verified live by reading the clipboard back.'),
                        ('Where the clipboard is unavailable, Copy fails silently &mdash; no confirmation, no error.',
                         'AC-SHARE-04. The recipient-facing half is unaffected; the link in the field is still selectable.'),
                    ],
                },
            ],
        },
    ],

    'states': [
        ('/share', 'Id resolves to an MV', 'Logo, video, controller, Download + Create MV', 'Play, seek, mute, fullscreen, More; Download; Create', 'The logo, or Create'),
        ('/share', 'Id resolves to a song', 'Logo, art, title, creator, controller, Download + Create Song', 'Play, seek, mute, Download; Create', 'The logo, or Create'),
        ('/share', 'Id does not resolve', 'Logo and an unavailable message', 'Nothing but the logo', 'The logo'),
        ('More menu', 'Open', 'Download, Playback Speed with its current rate, Picture in Picture', 'Speed cycles in place; the other two act and close', 'Escape, or an outside press'),
        ('Share dialog', 'Open', 'A read-only link and Copy', 'Copy writes to the clipboard', 'Close'),
        ('Share dialog', 'Just copied', 'The action reads as confirmed', 'Reverts by itself after 1.5s', 'Close'),
    ],

    'errors': [
        (
            'Unresolvable id',
            'A share link whose id matches no creation',
            'The unavailable state; the logo is the only way out',
            'Ask the sender for the link again',
            'P4-S1',
        ),
        (
            'No id at all',
            'Opening /share with nothing after it',
            'The same state',
            'Same',
            'P4-S2',
        ),
        (
            'A live own creation, opened elsewhere',
            'Sharing a creation that has just been made, then opening it in another session',
            'The same state, because it is held only in the sender&rsquo;s own session',
            'None available today &mdash; it needs server-side resolution',
            'P4-S4',
        ),
        (
            'No media URL',
            'A creation with nothing to save',
            'The Download pill is not rendered at all',
            'Nothing to recover &mdash; playback is unaffected',
            'P1-S3',
        ),
        (
            'Clipboard unavailable',
            'A browser or context that refuses clipboard writes',
            'Copy does nothing and shows no confirmation and no error',
            'Select the link in the field and copy it manually',
            'P5-S3',
        ),
    ],
    'errors_last_col': 'Where',
    'errors_note': (
        'Every row here resolves to ONE screen &mdash; the unavailable state &mdash; or to a control '
        'quietly not rendering. There is no error toast and no retry anywhere on this surface, '
        'which is deliberate: the recipient has no account and no way to act on a failure beyond '
        'asking the sender.'
    ),

    'open_questions': [
        (
            'Q-01',
            'The MV panel shows no title and no creator; the song panel shows both. Is the asymmetry intended, or did the 2026-08-24 redesign only add them to one panel?',
            'What a recipient of an MV link can tell about what they are watching (P1-S1 vs P3-S1)',
            'Product owner / designer',
        ),
        (
            'Q-02',
            'Both Create pills go to the home page, but their labels name a specific creation kind. Should the label match the destination, or should the destination follow the label?',
            'Whether the pill is a promise the page keeps (P1-S3, P3-S3)',
            'Product owner',
        ),
        (
            'Q-03',
            'Share-link analytics has no field specification. The frontend deliberately carries no tracking parameters rather than guessing at them, so today a shared link reports nothing at all.',
            'Any measurement of sharing; the link format itself, if parameters have to be added later',
            'BA (tracked as TBD-SHARE-03)',
        ),
        (
            'Q-04',
            'What does &ldquo;cost per the Credit Consume MSR&rdquo; resolve to, generally? (Carried per the programme&rsquo;s own convention; no step in THIS spec quotes a cost &mdash; nothing on this surface spends credits.)',
            'N/A to this spec&rsquo;s own steps; recorded because every spec in the programme carries this row',
            'Product / RD (the MSR document link is still TBD)',
        ),
    ],

    'criteria': [
        ('AC-SHARE-01', 'WHEN /share?id= resolves to media, THE SYSTEM SHALL render it bare (no app chrome) with a logo header, the media and its controller, and the action pills.', ['P1-S1', 'P1-S2', 'P1-S4', 'P3-S1', 'P3-S2']),
        ('AC-SHARE-02', 'WHEN the id is missing or unresolvable, or the expired-state switch is set, THE SYSTEM SHALL render the unavailable state; the logo header links home.', ['P4-S1', 'P4-S2', 'P4-S3']),
        ('AC-SHARE-03', 'WHEN the legacy MV share URL is opened, THE SYSTEM SHALL redirect to the canonical share URL for the same id, preserving the language prefix.', ['P5-S1']),
        ('AC-SHARE-04', 'WHEN Share is invoked, THE SYSTEM SHALL open the share dialog exposing a copyable public link and a Copy action &mdash; and NO social-platform targets and no native-share button.', ['P5-S2', 'P5-S3']),
        ('AC-SHARE-05', 'WHEN Download is pressed on a valid link, THE SYSTEM SHALL save the media under the creation&rsquo;s title with the matching extension.', ['P1-S3', 'P2-S1', 'P3-S3']),
        ('AC-SHARE-06', 'THE SYSTEM SHALL render /share (valid and unavailable) and the share dialog at 320/375/768/1024/1440/1920px.', [], 'Visual-only; the six-tier sweep is e2e/visual-baseline.spec.ts&rsquo;s job. This spec&rsquo;s D8 scope captures 1403&times;697 desktop only.'),
    ],

    'prototype_deltas': [
        (
            'There is no server-side link resolution',
            'An id is resolved entirely in the recipient&rsquo;s own browser, against data compiled into the app plus whatever is in that session&rsquo;s memory. A creation made moments ago resolves for its author and for nobody else.',
            'Production must resolve any id on the server. This is the single behaviour a QA tester is most likely to file as a broken link (P4-S4).',
        ),
        (
            'Links never expire, and nothing enforces that either way',
            'There is no expiry rule in the code, and none is wanted &mdash; creations are kept indefinitely, so a link to one has no reason to lapse. The unavailable state is only ever a resolution failure.',
            'Production needs no expiry logic. The requirement was removed rather than deferred, so it should not reappear as a backend to-do.',
        ),
        (
            'Download saves a shared demo file',
            'Every MV maps onto one demo clip and every song onto one of two demo tracks, so a download is the right filename over the wrong bytes.',
            'Production serves the real media. The filename rule is the contract; the file behind it is not.',
        ),
        (
            'The share link carries no tracking at all',
            'The URL is the origin, the path and the id. No campaign, sender, medium or channel parameters are attached.',
            'This is deliberate rather than missing: the field specification is a BA deliverable and the frontend is holding blank until it lands (Q-03).',
        ),
        (
            'The dialog offers no social channels',
            'Copy-link is the only action. The four social composer links and the native share button were removed for this release.',
            'Social channels are a later phase, and the web channel set is expected to differ from the mobile app&rsquo;s; they are not simply unimplemented.',
        ),
    ],

    'decisions': [
        ('D-01', 'PLAN.md estimated ~4 paths / ~12 shots. This spec is 5 / 15 &mdash; why?', 'Because /share was REDESIGNED on 2026-08-24, after that estimate was written and after area 10 was last revised. The 2026-07-23 "simplified chrome" decision the area spec still describes &mdash; logo, media, Download, nothing else &mdash; was reversed: the page now has a full custom media controller, a three-item More menu and a second action pill. The extra path is that menu, whose three actions would otherwise have no photograph anywhere in the programme. Confirmed with the product owner at the Phase 0 gate, 2026-09-01.'),
        ('D-02', 'Area 10 describes the pre-redesign page. Which wins?', 'The code, and area 10 is corrected in the same branch under programme decision D11. Its &sect;1, &sect;3 and AC-SHARE-01 all describe a page with no title, no creator, no controller and one action; all four claims are now wrong on the running app. The corrections are annotated in place with the file&rsquo;s own convention.'),
        ('D-03', 'Why is the recipient session signed OUT, when every other spec in this programme seeds auth?', 'Because that is the subject. /share is public by design and is mostly opened by people with no account, so a signed-in capture would photograph a state a real recipient never sees. Only P5 &mdash; the dialog, which lives on a player screen rather than on /share &mdash; runs signed in.'),
        ('D-04', 'Does this spec capture the screens that OPEN the dialog?', 'No. S1, S2, S4 and S8 own those screens and already capture their Share controls as entry points; S8&rsquo;s own captures were taken first for exactly this reason. This spec picks up at the opened dialog and specifies what it does.'),
        ('D-05', 'The MV panel has no title or creator and the song panel has both. Specify it, or report it?', 'Both. It is specified as measured &mdash; the steps say what each panel shows &mdash; and raised as Q-01, because nothing in the code, the area spec or the component&rsquo;s own comment says the asymmetry was intended. Writing it down as if it were a rule would make an accident into a contract.'),
        ('D-06', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo, same as S1 and S3 through S8.'),
    ],

    'references': [
        (
            'Area spec 10 — Share',
            'specs/areas/10-share.md',
            'The behaviour-first as-built spec these screenshots walk. AC-SHARE-01..06 are traced in QA Coverage. Corrected in this branch under D11 &mdash; see D-02.',
        ),
    ],

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Btn["A Share control on any result or player screen"] --> Dlg["Share dialog: a read-only link + Copy"]\n'
        '  Dlg -->|Copy| Copied["Copied! for 1.5s, then reverts"]\n'
        '  Dlg -->|the recipient opens the link| Page["/share?id= - bare, public, no app chrome"]\n'
        '  Legacy["The legacy MV share URL"] -->|server redirect| Page\n'
        '  Page --> Resolve{Does the id resolve?}\n'
        '  Resolve -->|community item, History sample, or your own completed creation| Kind{Which kind?}\n'
        '  Kind -->|music video| Mv["MV panel: video + controller, no title, no creator"]\n'
        '  Kind -->|song| Song["Song panel: art, title, creator, controller"]\n'
        '  Mv -->|More| Menu["Download / Playback Speed / Picture in Picture"]\n'
        '  Mv --> Pills["Download + a kind-labelled Create pill"]\n'
        '  Song --> Pills\n'
        '  Pills -->|Create| Home["The home page - both pills land here"]\n'
        '  Resolve -->|no| Gone["This link is not available"]\n'
        '  Live["A LIVE own creation, opened in a fresh session"] --> Gone\n'
        '  Gone -->|the header logo| Home\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'share', 'ShareLinkView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ShareDialog.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'Modal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'SeekBar.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'share.ts'),
        # The example title and creator P3-S1 quotes are fixture values, not
        # component strings — without this file they read as invented.
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'community.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'mock.ts'),
    ],
    'strings_ignore': [
        # Source writes both apostrophes as the JSX entity `&apos;`
        # (`This link isn&apos;t available`, `We couldn&apos;t find this…`);
        # this spec normalizes apostrophes to `&rsquo;`, so the two can never
        # byte-match. Same normalization mismatch S5 and S7 each documented.
        # Confirmed live (10, 11, 12).
        'This link isn&rsquo;t available',
        'We couldn&rsquo;t find this creation. Ask the sender to share it again.',
        # ShareDialog writes this as `Shareable public link to “{title}”` — the
        # quoted half is split around a JSX expression, so no contiguous source
        # substring matches. Confirmed live (14).
        'Shareable public link to',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
