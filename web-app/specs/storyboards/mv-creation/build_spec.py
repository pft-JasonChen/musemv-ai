#!/usr/bin/env python3
"""yco-spec build script — AI Music Video (MV) Creation storyboard (S2).

Screenshot source: **live app capture**, not a static prototype — same
methodology as ../song-creation/build_spec.py. Every screenshot in
specs/screenshots/ was captured by driving the real Next.js dev server
(`npm run dev`, a private port) with Playwright, signed in via the same
`localStorage['muse_auth']` seed the e2e specs use, except P5 (guest gate)
which deliberately omits it.

RE-RUN, 2026-08-27 — capture run 1 (44 shots) was VOIDED and is not reused.
It was taken against a pre-rebase branch whose `/mv/room` still carried an
Enhance button that `origin/main`'s `3bdff87` removed for V1 the next day
(product owner, 2026-08-25 — "not available in V1"). The branch has since
been rebased onto `origin/main`; every screenshot referenced below is a fresh
capture against the current tree, and the filenames do not match run 1's
(P2 drops one shot — Enhance — so everything after it renumbers by one).
See PLAN.md's "S2 scope" note and specs/storyboards/mv-creation/capture_screenshots.py's
own header for the full account.

Source of truth for every rule/copy string not directly re-verified against
the running app: specs/areas/02-mv-creation.md (as-built, carries ⚠️
corrections in place) and specs/00-overview.md — used in place of a
prd.md/plan.md, which this repo does not have. Every quoted string below was
independently re-confirmed against the live app's accessibility tree during
this capture run, including three corrections `areas/02-mv-creation.md`
already carried in from an earlier (pre-rebase) capture pass:
  - the `hybrid` MV type displays as "Sing & Story", id stays `hybrid`.
  - ChooseSongModal HAS an in-modal inline preview (hover a row) since 3g-2.
  - Trim's footer button reads "Confirm", not "Use Trimmed Audio".
All three held up unchanged on the rebased tree.

Scope (confirmed at Phase 0, PLAN.md "S2 scope", 2026-08-27): eight paths —
P1 storyboard-first end to end, P2 direct generation (**Templates only** —
Enhance is explicitly NOT part of this path), P3 generation failure at both
stages, P4 the six sheets and their numeric boundaries, P5 the guest gate,
P6 insufficient credits, P7 the side-rail Trending/My Creations swap, P8 a
controls tour of /mv/result. /mv/edit (MV-P5 in the area spec) is OUT of
scope — that is S3. History's own behavior (filters, row menu, publish,
delete) is out of scope — see specs/areas/05-history.md; P1 closes with one
step showing the new row, matching S1's convention.

Two corrections to areas/02-mv-creation.md were made FROM THIS capture run
(D-08 below), both about the same removed control:
  - MV-P1-S4's row still listed "Enhance" as a Describe shortcut alongside
    Templates. It no longer exists on `/mv/room` (3bdff87). Corrected in
    place with a ⚠️ note.
  - AC-MV-14 still named "the description" as one of Enhance's four target
    fields. Corrected to the three that remain (visual style, scene prompt,
    cover description) — all three live on /mv/storyboard or /mv/edit, not
    /mv/room, and `enhancePrompt` itself is unchanged.

A real app bug was found and fixed while capturing (D-09, D10 of PLAN.md's
programme decisions): `StoryboardGenerationScreen` started the mock
storyboard job from a bare mount effect, and `next dev`'s default React
Strict Mode double-invokes every mount effect — so it fired TWO jobs,
double-charging the account and leaving the first job's History row stuck
reading "Generating..." forever (its poll is silently cancelled the instant
the second job's `track()` call replaces the shared `cancelPoll.current`,
with no `markFailed`/`markCompleted` on the way out). Fixed with a `started`
ref guard, the same pattern `GenerationView.tsx` already carries for
/mv/creating and /song/creating (commit `e739c4e`).

The owed regression test (D10) is
`src/components/mv/StoryboardGenerationScreen.test.tsx`, mutation-tested both
directions: guard removed, the double mount calls the start callback twice and
the test fails; guard restored, once, and it passes.

It is a UNIT test, deliberately, and that placement is the point. The
double-invoked mount effect only exists in React's DEVELOPMENT build; the
Playwright suite serves `next start` (production), where React elides it. A
guard written there passes with OR without the fix — verified by mutation, not
assumed — which is the "a test that cannot fail is worse than no test" trap in
AGENTS.md. The browser test that WAS written for it has been renamed to the
production invariant it really checks (one start, one charge, one History row)
and carries a header saying what it does not cover.

Severity, corrected: the observable double charge is a `next dev` artifact, NOT
a production billing bug — earlier wording in this session's commit message said
otherwise. The guard is still correct, since any remount would otherwise charge
again, and it restores parity with `GenerationView.tsx`.

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory (this skill's original prototypes were plain HTML/JS); this repo is
TypeScript/React, so every relevant file is listed individually below,
following S1's convention.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/mv-creation
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE
AREA02 = os.path.join(WEB_APP, 'specs', 'areas', '02-mv-creation.md')
AREA05 = os.path.join(WEB_APP, 'specs', 'areas', '05-history.md')

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'AI Music Video (MV) Creation',
    'breadcrumb': 'YouCam Muse Web &rarr; AI Music Video',
    'author': 'Jason Chen', 'date': '2026-09-02', 'status': 'Draft',
    'version': 'v2',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        'The end-to-end flow to create an AI music video on the web: compose a brief '
        '(type, song, description, character photos, output settings), choose '
        'storyboard-first or direct generation, watch generation, optionally review '
        'and edit a storyboard, view the result, and see the finished MV appear in '
        'History.'
    ),
    'background': (
        'The second yco-spec screenshot-first storyboard in the programme (PLAN.md), '
        'following the finished AI Song Creation spec. MV is specced as TWO documents '
        '(PLAN.md D1) — this one covers /mv/room through /mv/result; /mv/edit is S3.'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of the MV Creation flow they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web (desktop) &mdash; captured at 1440px'],
        ['Audience', 'QA'],
        ['Scope', 'Storyboard-first end to end (P1), direct generation with Templates only (P2), generation failure at both stages (P3), the six compose sheets and their numeric boundaries (P4), the guest sign-in gate (P5), insufficient credits (P6), the Trending MVs / My Creations side-rail swap (P7), and a controls tour of /mv/result (P8).'],
        ['Out of scope', '/mv/edit (MV-P5 in the area spec) &mdash; see specs/storyboards/mv-edit (S3, postponed). History&rsquo;s own behavior (filters, &ctdot; menu, publish, delete) &mdash; see specs/areas/05-history.md.'],
        ['Source', 'specs/areas/02-mv-creation.md, specs/areas/05-history.md, specs/00-overview.md, and the running app'],
    ],

    'short_nav': [
        'Storyboard-first (happy path)', 'Direct generation (Templates only)', 'Generation failure',
        'The six sheets', 'Guest sign-in gate', 'Insufficient credits',
        'Trending MVs vs My Creations', 'Result screen &mdash; controls tour',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        {
            'id': 'p1-storyboard-first', 'num': 1,
            'name': 'Storyboard-first &mdash; happy path',
            'desc': 'Compose a brief, review and edit an AI-drafted storyboard, then render. Ends with the new row in History.',
            'entry': 'Sidebar &ldquo;AI Music Video&rdquo;', 'outcome': 'New row in History',
            'steps': [
                {
                    'shot': '01_mv_room_empty.png', 'num': 1,
                    'user': 'Arrives at /mv/room.',
                    'system': 'Renders the compose form with &ldquo;Singing&rdquo; selected by default; Create Music Video stays disabled until a song and a description both exist.',
                    'exact': [
                        'Title: &ldquo;AI Music Video&rdquo;',
                        'Section labels: &ldquo;SELECT MV TYPE&rdquo;, &ldquo;CHOOSE A SONG (Required)&rdquo;, &ldquo;DESCRIBE YOUR VIDEO IDEA (Required)&rdquo;, &ldquo;UPLOAD CHARACTER PHOTO&rdquo;',
                        'Song source buttons: &ldquo;Song Library&rdquo;, &ldquo;Import Audio&rdquo;',
                    ],
                    'limits': [
                        ('Create Music Video stays disabled while song is unset OR the description is empty (AC-MV-01).',
                         'Both are required; either alone is not enough.'),
                        'Character photo and Settings are both optional at this step.',
                    ],
                },
                {
                    'shot': '02_mv_type_selected.png', 'num': 2,
                    'user': 'Taps the third MV-type card.',
                    'system': 'Selects the type (purple border); each card autoplays its own muted preview video.',
                    'exact': [
                        'Card labels: &ldquo;Storytelling&rdquo;, &ldquo;Singing&rdquo;, &ldquo;Sing &amp; Story&rdquo;',
                    ],
                    'limits': [
                        ('The third card&rsquo;s on-screen label is &ldquo;Sing &amp; Story&rdquo;, not &ldquo;Hybrid&rdquo; (product owner request).',
                         'Its internal id stays `hybrid` &mdash; a frozen contract field; only the DISPLAY name changed.'),
                        'The three autoplaying preview videos ARE the type introduction &mdash; there is no separate carousel.',
                    ],
                    'focus': [{'box': [51.9, 14.4, 14.7, 30.7], 'type': 'action', 'label': 'Sing &amp; Story'}],
                },
                {
                    'shot': '03_choose_song_modal.png', 'num': 3,
                    'user': 'Taps Song Library, then hovers the first row.',
                    'system': 'Opens Choose Song; hovering a row starts an in-modal preview and reveals its Use pill.',
                    'exact': [
                        'Dialog title: &ldquo;Choose Song&rdquo;',
                        'Tabs: &ldquo;My Songs&rdquo; (default), &ldquo;Sample Songs&rdquo;',
                    ],
                    'limits': [
                        ('The Use pill is hidden (opacity 0) until its row is active.',
                         'Hovering, tapping, or focusing a row starts its preview AND reveals Use &mdash; a plain click on a row alone never selects the song.'),
                    ],
                    'focus': [{'box': [56.5, 39.6, 3.3, 3.1], 'type': 'action', 'label': 'Use'}],
                },
                {
                    'shot': '04_trim_audio_default.png', 'num': 4,
                    'user': 'Taps Use on &ldquo;My Wedding Ballad&rdquo;.',
                    'system': 'Every song source (library, sample, or import) routes through Trim before it is set (AC-MV-02).',
                    'exact': [
                        'Dialog title: &ldquo;Trim Audio&rdquo;',
                        'Subtitle: &ldquo;Only trim the audio to the parts you like the best.&rdquo;',
                        'Footer button: &ldquo;Confirm&rdquo; &mdash; not &ldquo;Use Trimmed Audio&rdquo;.',
                    ],
                    'limits': [
                        'Default selection is a mid-track window, not the full song.',
                        ('The selected length must be &ge;30s or Confirm stays disabled (MV-01, AC-MV-16).',
                         'See P4-S6 for the disabled state at the floor.'),
                    ],
                    'focus': [{'box': [50.0, 64.2, 10.4, 4.4], 'type': 'action', 'label': 'Confirm'}],
                },
                {
                    'shot': '05_song_added.png', 'num': 5,
                    'user': 'Taps Confirm.',
                    'system': 'The song card replaces the two source buttons, showing source, title, and the trimmed (effective) duration.',
                    'exact': ['Source label: &ldquo;Song Library&rdquo;'],
                    'limits': ['The card shows the TRIMMED duration, not the source track&rsquo;s full length.'],
                },
                {
                    'shot': '06_description_filled.png', 'num': 6,
                    'user': 'Types a description.',
                    'system': 'Updates the character counter live; Create Music Video is still disabled until a song also exists (already satisfied here).',
                    'exact': ['Counter format: &ldquo;126/2500&rdquo;'],
                    'limits': [
                        ('Typed/pasted input is capped at 2500 characters (AC-MV-03), confirmed via a real fill event.',
                         'A programmatic value assignment bypasses `maxLength`; only a real browser fill/paste event proves the cap.'),
                        ('The only fill shortcut on this field is Templates (P2-S1) &mdash; Enhance was removed from this screen for V1.',
                         '`enhancePrompt` itself is unchanged and reachable from /mv/storyboard and /mv/edit; only /mv/room stopped rendering the button (2026-08-25, product owner). See D-08.'),
                        'Templates&rsquo; own fill is not length-capped (only typed/pasted input is).',
                    ],
                },
                {
                    'shot': '07_photo_sample_added.png', 'num': 7,
                    'user': 'Taps a Sample Photo.',
                    'system': 'Adds it directly as the character photo, with a Name label and an edit (crop) control.',
                    'exact': ['Secondary slot label: &ldquo;2nd face photo (Optional)&rdquo;'],
                    'limits': [
                        'Character photo is optional; the CTA does not need one.',
                        ('Sample Photos skip the consent dialog and FacePicker crop (P4-S7).', 'They are pre-cropped fixtures.'),
                        'Up to 2 photos.',
                    ],
                    'focus': [{'box': [20.8, 68.4, 2.8, 4.4], 'type': 'action', 'label': 'Sample photo'}],
                },
                {
                    'shot': '08_create_cta_ready.png', 'num': 8,
                    'user': 'Both a song and a description now exist.',
                    'system': 'Create Music Video becomes enabled.',
                    'limits': [('Settings defaults: 9:16, Standard quality, MV Title on, Author Name on, Show Subtitle on, Show Watermark off.',
                                'Unchanged unless the user opens Settings (P4-S8).')],
                    'focus': [{'box': [35.8, 88.2, 16.0, 5.1], 'type': 'action', 'label': 'Create Music Video'}],
                },
                {
                    'shot': '09_mode_modal_storyboard.png', 'num': 9,
                    'user': 'Taps Create Music Video.',
                    'system': 'Clears any previous MV&rsquo;s generation state and opens the mode chooser, leaving the brief on screen untouched (AC-MV-04).',
                    'exact': [
                        'Title: &ldquo;How would you like to create?&rdquo;',
                        'Subtitle: &ldquo;Choose your creative workflow. You can always adjust later.&rdquo;',
                        'Card 1: &ldquo;Create Storyboard First&rdquo; &mdash; &ldquo;Review scenes before rendering.&rdquo; &mdash; badge &ldquo;Recommended&rdquo; &mdash; &ldquo;~1 min&rdquo;.',
                        'Card 2: &ldquo;Create MV Directly&rdquo; &mdash; &ldquo;Generate your MV instantly.&rdquo; &mdash; &ldquo;~2 min&rdquo;.',
                    ],
                    'limits': [('Both cards show a live credit cost, priced per second of the trimmed song.',
                                'Exact amounts come from the Credit Consume MSR (References), not asserted here.')],
                    'focus': [{'box': [37.9, 40.9, 23.2, 15.4], 'type': 'action', 'label': 'Create Storyboard First'}],
                },
                {
                    'shot': '10_mv_thinking_progress.png', 'num': 10,
                    'user': 'Taps Create Storyboard First.',
                    'system': 'Navigates to /mv/thinking; starts a storyboard job and inserts a Generating row in History immediately (AC-MV-05, AC-MV-06).',
                    'exact': [
                        'Title: &ldquo;Edit Storyboard&rdquo;',
                        'Heading: &ldquo;Crafting Your Storyboard&rdquo;',
                        'Estimate label: &ldquo;Estimated time remaining&rdquo; &mdash; &ldquo;~1 minute&rdquo;.',
                        'Link: &ldquo;View Later&rdquo; &rarr; /history.',
                    ],
                    'limits': [
                        ('Charges the storyboard cost on start; refunds in full on failure (AC-MV-19).',
                         'Exact amounts come from the Credit Consume MSR (References), not asserted here.'),
                        ('The job starts exactly once per generation, even when the mount effect runs twice (D-09).',
                         'Fixed 2026-08-27 (`e739c4e`) &mdash; guarded by a unit test that mounts the screen twice as React&rsquo;s dev build does, mutation-tested both directions. The double-invoke is a DEV-build behaviour, so the browser suite (which serves a production build) cannot see it.'),
                        'The &ldquo;~1 minute&rdquo; estimate is display-only; the mock resolves in a few seconds (prototype_deltas).',
                    ],
                },
                {
                    'shot': '11_mv_storyboard_editor.png', 'num': 11,
                    'user': 'The storyboard job finishes.',
                    'system': 'Navigates to /mv/storyboard, populated with visual style, story, timed scenes, and lyrics (AC-MV-07).',
                    'exact': [
                        'Section labels: &ldquo;VISUAL STYLE&rdquo;, &ldquo;STORY&rdquo;, &ldquo;STORY LINE&rdquo;, &ldquo;MV SONG&rdquo;, &ldquo;LYRICS&rdquo;',
                        'Per-field Enhance pills beside Visual Style and each Scene.',
                    ],
                    'limits': [
                        ('Visual Style and each Scene&rsquo;s text are editable; Story and Lyrics are read-only.',
                         'AC-MV-08.'),
                        ('The MV Song is play-only here &mdash; tap its thumbnail to preview, but it cannot be changed.',
                         'Locked after creation; changing the song means starting a new MV from /mv/room.'),
                        ('There is no Save button.',
                         'Edits are ephemeral in memory and carried into the next Generate MV / Merge tap, never persisted independently (AC-MV-08).'),
                        ('This Enhance is the same `enhancePrompt` call the removed /mv/room shortcut used to reach (D-08).', 'Still fully functional &mdash; just relocated to fields that kept it.'),
                    ],
                },
                {
                    'shot': '12_mv_storyboard_generate.png', 'num': 12,
                    'user': 'Scrolls to and taps Generate MV.',
                    'system': 'Runs `resetForRerender()` and navigates to /mv/creating, rendering from the (possibly edited) storyboard (AC-MV-09).',
                    'limits': [('Renders using whatever the storyboard currently holds, including any unsaved edits made in this session.', 'There is nothing to explicitly save first.')],
                    'focus': [{'box': [36.8, 88.2, 16.0, 5.1], 'type': 'action', 'label': 'Generate MV'}],
                },
                {
                    'shot': '13_mv_creating_progress.png', 'num': 13,
                    'user': 'Waits for the render to finish.',
                    'system': '/mv/creating shows a progress ring, step label, estimate, and View Later while the job runs.',
                    'exact': [
                        'Title: &ldquo;Creating Your Music Video&rdquo;',
                        'Subtitle: &ldquo;Your cinematic MV is being rendered. We&rsquo;ll notify you when it&rsquo;s ready.&rdquo;',
                        'Estimate label: &ldquo;Estimated time remaining&rdquo;, value &ldquo;~2 minutes&rdquo;.',
                        'Control: &ldquo;View Later&rdquo;',
                    ],
                    'limits': [
                        ('This screen is deliberately still the pre-migration shared `GenerationView`, not a designer-UI screen.',
                         'Source: specs/areas/02-mv-creation.md &sect;1 &mdash; DP has no design for /mv/creating.'),
                        ('Charges the render cost on start; refunds in full on failure (AC-MV-19).',
                         'Exact amounts come from the Credit Consume MSR (References), not asserted here.'),
                    ],
                },
                {
                    'shot': '14_mv_result_storyboard_first.png', 'num': 14,
                    'user': 'The render finishes.',
                    'system': 'Navigates to /mv/result: looping muted video, Like/Dislike, Quick Actions, Publish toggle, and a Detail panel (AC-MV-10).',
                    'exact': ['Title: &ldquo;Result&rdquo;'],
                    'limits': [
                        'The full control set is toured independently in P8, starting from a result screen just like this one.',
                        ('Publish starts Off and Edit MV reads plain &ldquo;Edit MV&rdquo; here.', 'The &ldquo;Unpublish to edit&rdquo; state (P8-S3/S4) only appears once published.'),
                    ],
                },
                {
                    'shot': '15_history_new_mv_row.png', 'num': 15,
                    'user': 'Opens History from the sidebar.',
                    'system': 'The new MV appears at the top of the list.',
                    'exact': ['Page title: &ldquo;My Creations&rdquo; &mdash; not &ldquo;History&rdquo;, despite the /history route.'],
                    'limits': [
                        'New rows are prepended &mdash; most recent first.',
                        'History&rsquo;s own filters, row menu, publish, and delete are out of scope here &mdash; see specs/areas/05-history.md.',
                    ],
                },
            ],
        },
        {
            'id': 'p2-direct', 'num': 2,
            'name': 'Direct generation &mdash; Templates only',
            'desc': 'A brief filled from a Template, then rendered directly with no storyboard review stage. Enhance is deliberately NOT part of this path.',
            'entry': '/mv/room (continuing from P1&rsquo;s History)', 'outcome': 'New row in History (second row)',
            'steps': [
                {
                    'shot': '16_templates_sheet.png', 'num': 1,
                    'user': 'Taps Templates.',
                    'system': 'Opens a grid of preset templates, each a cover image plus a written prompt.',
                    'exact': [
                        'Dialog title: &ldquo;Select a Template&rdquo;',
                        'Template names shown: &ldquo;Neon City&rdquo;, &ldquo;Cinematic Dark&rdquo;, &ldquo;Late Night Stage&rdquo;, &ldquo;Anime Style&rdquo;, &ldquo;Nature Earth&rdquo;, &ldquo;Urban Performer&rdquo;',
                    ],
                    'limits': [('Templates fill from a fixed content pool (T1), not an AI generation on tap.', '6 preset templates, each a name + cover + written prompt.')],
                    'focus': [{'box': [49.9, 78.4, 16.0, 5.1], 'type': 'action', 'label': 'Confirm'}],
                },
                {
                    'shot': '17_templates_applied.png', 'num': 2,
                    'user': 'Picks &ldquo;Cinematic Dark&rdquo;, then taps Confirm.',
                    'system': 'Fills the description with that template&rsquo;s prompt and shows a removable chip under the field.',
                    'limits': [
                        ('Selecting a template does not auto-select or lock a song.',
                         'The song still has to be added separately &mdash; a claim to the contrary in an older spec version was wrong (TBD-MV-05).'),
                        'Templates&rsquo; fill is not length-capped (AC-MV-03 only bounds typed/pasted input).',
                    ],
                    'focus': [{'box': [22.0, 81.6, 7.8, 3.1], 'type': 'action', 'label': 'Templates'}],
                },
                {
                    'shot': '', 'num': 3,
                    'user': 'Adds a song (&ldquo;Summer Vibes&rdquo;) and a second sample photo.',
                    'system': 'Same Choose Song &rarr; Trim &rarr; Sample Photo flow as P1 (P1-S3&hellip;S5, P1-S7).',
                    'summary': 'Adds a song and a sample photo (same flow as P1-S3&hellip;S7).',
                },
                {
                    'shot': '18_mode_modal_direct.png', 'num': 4,
                    'user': 'Taps Create Music Video, then reviews the mode chooser.',
                    'system': 'Same &ldquo;How would you like to create?&rdquo; chooser as P1-S9; this path picks the second card.',
                    'exact': ['Card 2 subtitle: &ldquo;Generate your MV instantly.&rdquo;'],
                    'limits': [('Enhance is not offered anywhere in this path.',
                                'It never appears on /mv/room (removed for V1, D-08) and this path never visits /mv/storyboard, the only other screen with a Describe-adjacent Enhance.')],
                    'focus': [{'box': [37.9, 57.7, 23.2, 15.4], 'type': 'action', 'label': 'Create MV Directly'}],
                },
                {
                    'shot': '19_mv_result_direct.png', 'num': 5,
                    'user': 'Taps Create MV Directly.',
                    'system': 'Navigates straight to /mv/creating, then /mv/result &mdash; no storyboard review stage at all.',
                    'limits': [('Direct mode renders from the compose brief with no editable intermediate storyboard.',
                                'Contrast P1, which stops at /mv/storyboard for review before rendering.')],
                },
                {
                    'shot': '20_history_two_mv_rows.png', 'num': 6,
                    'user': 'Opens History from the sidebar.',
                    'system': 'Both MVs from this session are listed, most recent first.',
                    'limits': ['Same list behavior as P1-S15.'],
                },
            ],
        },
        {
            'id': 'p3-failure', 'num': 3,
            'name': 'Generation failure &mdash; both stages',
            'desc': 'A QA hook forces a mid-generation failure at each of the two stages a generation can start from.',
            'entry': '/mv/room', 'outcome': 'Generation Failed screen',
            'steps': [
                {
                    'shot': '21_fail_description.png', 'num': 1,
                    'user': 'Composes a brief whose description contains the &ldquo;[fail]&rdquo; marker.',
                    'system': 'Create Music Video becomes enabled, same as any complete brief.',
                    'limits': [('The &ldquo;[fail]&rdquo; marker is read once, when the job is first created, and reused when it re-renders.',
                                'So a storyboard-first job with this marker fails at the STORYBOARD (thinking) stage; a direct job fails at CREATING &mdash; never both, and never at the other stage.')],
                    'focus': [{'box': [35.8, 88.2, 16.0, 5.1], 'type': 'action', 'label': 'Create Music Video'}],
                },
                {
                    'shot': '22_thinking_failed.png', 'num': 2, 'role': 'error',
                    'user': 'Picks Create Storyboard First; the job fails around 60% progress.',
                    'system': '/mv/thinking swaps to a Generation Failed state with Retry and Back.',
                    'exact': [
                        'Heading: &ldquo;Generation stopped&rdquo; (icon caption) / &ldquo;Generation Failed&rdquo; (title)',
                        'Body: &ldquo;Something went wrong while generating. Your credits were not charged &mdash; you can retry now or adjust your input and try again.&rdquo;',
                        'Buttons: &ldquo;Retry&rdquo;, &ldquo;Back&rdquo;',
                    ],
                    'limits': [
                        'Back returns to /mv/room.',
                        ('Retry re-runs the SAME compose, which still contains &ldquo;[fail]&rdquo;, so it re-fails deterministically (MV-E1).',
                         'The copy says &ldquo;adjust your input&rdquo; but Retry itself performs no in-place edit; only Back returns to the form to change it (mock-only artifact).'),
                        ('The charged storyboard cost is refunded in full on failure (AC-MV-11, AC-MV-19).', 'Matches the on-screen &ldquo;credits were not charged&rdquo; message.'),
                        'The History row for this job shows Failed.',
                    ],
                },
                {
                    'shot': '23_creating_failed.png', 'num': 3, 'role': 'error',
                    'user': 'A fresh &ldquo;[fail]&rdquo; brief, this time picking Create MV Directly; the job fails around 60% progress.',
                    'system': '/mv/creating shows the same Generation Failed layout as /mv/thinking.',
                    'limits': [('Same copy, same Retry/Back behavior as P3-E2 &mdash; only the stage differs.',
                                'Direct mode has no storyboard stage to fail at, so its failure always happens here, at creating.')],
                    'focus': [{'box': [55.8, 73.6, 4.1, 4.3], 'type': 'action', 'label': 'Retry'}],
                },
            ],
        },
        {
            'id': 'p4-sheets', 'num': 4,
            'name': 'The six sheets and their boundaries',
            'desc': 'Choose Song, Import, Trim, Face Picker, and Settings, focused on the numeric/format rules QA tests individually.',
            'entry': '/mv/room', 'outcome': 'Varies per step',
            'steps': [
                {
                    'shot': '24_choose_song_sample_tab.png', 'num': 1,
                    'user': 'Opens Choose Song, then taps the Sample Songs tab.',
                    'system': 'Switches from My Songs to a fixture list of sample tracks.',
                    'limits': [],
                    'focus': [{'box': [45.5, 33.0, 8.4, 3.9], 'type': 'action', 'label': 'Sample Songs'}],
                },
                {
                    'shot': '25_choose_song_sample_list.png', 'num': 2,
                    'user': 'Views the Sample Songs list.',
                    'system': 'Five sample tracks, each with title and duration.',
                    'exact': ['Titles shown: &ldquo;Top Flow - Party&rdquo;, &ldquo;Party Dance&rdquo;, &ldquo;Forest Morning&rdquo;, &ldquo;Golden Hour&rdquo;, &ldquo;Neon Pulse&rdquo;'],
                    'limits': [('Sample songs route through Trim exactly like a library or imported song (AC-MV-02).',
                                'Sample-song trimming is web-new &mdash; the app only trims library imports.')],
                },
                {
                    'shot': '26_import_reject_format.png', 'num': 3,
                    'user': 'Selects Import Audio and picks a non-audio file.',
                    'system': 'Rejects the file with a toast; no import happens.',
                    'exact': ['Toast: &ldquo;Unsupported format. Use MP3, AAC, WAV, or M4A.&rdquo;'],
                    'limits': [('Import accepts only MP3/AAC/WAV/M4A, by extension or MIME (MV-02, AC-MV-17).', 'Anything else is rejected outright.')],
                },
                {
                    'shot': '27_import_reject_size.png', 'num': 4,
                    'user': 'Picks a valid-format audio file over 50MB.',
                    'system': 'Rejects the file with a toast; no import happens.',
                    'exact': ['Toast: &ldquo;File too large. Maximum size is 50MB.&rdquo;'],
                    'limits': [('The 50MB ceiling applies even to an otherwise valid format (MV-02, AC-MV-17).', 'Format and size are independent checks; either alone can reject.')],
                },
                {
                    'shot': '44_import_reject_too_short.png', 'num': 5,
                    'user': 'Picks a valid-format audio file shorter than 30 seconds.',
                    'system': 'Rejects it with a toast at UPLOAD time; the trim dialog never opens.',
                    'exact': ['Toast: &ldquo;Audio must be at least 30 seconds.&rdquo;'],
                    'limits': [
                        ('The 30s floor is now enforced twice: here, and again inside the trim dialog (next step).',
                         'Until 2026-09-02 it ran only in the trim dialog, which made a short upload a DEAD END &mdash; a 20s file opened Trim, showed &ldquo;minimum 30s&rdquo; in red, and left Confirm disabled forever, because a 20s track cannot be trimmed UP to 30s. The only way out was to close the dialog. Both checks read the same exported `MIN_TRIM_SEC`, so the two cannot drift apart.'),
                        ('A file whose duration cannot be read is let THROUGH, on purpose.',
                         'The check is `durationSec &gt; 0 &amp;&amp; durationSec &lt; MIN_TRIM_SEC`, so an unreadable-but-valid track falls through to the trim dialog rather than being rejected on a failed decode &mdash; the pre-existing behaviour for that case.'),
                    ],
                },
                {
                    'shot': '28_trim_floor.png', 'num': 6,
                    'user': 'Drags the trim window&rsquo;s end handle to under 30 seconds.',
                    'system': 'Shows the live selected length and a floor hint; Confirm stays disabled.',
                    'exact': ['Hint format: &ldquo;Selected: 00:07 &middot; minimum 30s&rdquo;'],
                    'limits': [('Confirm is disabled while the selected length is under 30s (MV-01, AC-MV-16).',
                                'The boundary is inclusive at exactly 30s and up; anything shorter blocks Confirm.')],
                    'focus': [{'box': [38.6, 39.3, 21.8, 2.0], 'type': 'info', 'label': 'Selected'}],
                },
                {
                    'shot': '29_face_picker_crop.png', 'num': 7,
                    'user': 'Uploads a character photo (not a Sample Photo).',
                    'system': 'Opens a manual crop tool with a drag-to-frame square and a size slider.',
                    'exact': [
                        'Dialog title: &ldquo;Select a Face&rdquo;',
                        'Subtitle: &ldquo;Drag the square to frame the face you want&rdquo;',
                        'Button: &ldquo;Use This Face&rdquo;',
                    ],
                    'limits': [('Crop is manual only &mdash; no auto face detection (TBD-MV-03).',
                                'The component supports detected-face suggestions but /mv/room does not pass any in.')],
                    'focus': [{'box': [41.5, 75.8, 16.0, 5.1], 'type': 'action', 'label': 'Use This Face'}],
                },
                {
                    'shot': '30_settings_high_crown.png', 'num': 8,
                    'user': 'Opens Settings.',
                    'system': 'Shows Aspect Ratio, Quality, and the output toggles; High quality is greyed with a crown.',
                    'exact': [
                        'Dialog title: &ldquo;Settings&rdquo;',
                        'Section labels: &ldquo;ASPECT RATIO&rdquo;, &ldquo;QUALITY&rdquo;, &ldquo;MV TITLE&rdquo;, &ldquo;AUTHOR NAME&rdquo;',
                        'Toggle hints: &ldquo;Subtitles will appear in the video&rdquo;, &ldquo;The YouCam Muse logo will appear.&rdquo;',
                    ],
                    'limits': [('On the free plan, tapping High opens the subscribe IAP instead of selecting it (MV-04, AC-MV-18b).',
                                'Subscribers select High normally &mdash; see P4-S9.')],
                    'focus': [{'box': [49.8, 36.5, 10.6, 5.2], 'type': 'action', 'label': 'High'}],
                },
                {
                    'shot': '31_subscribe_from_settings.png', 'num': 9,
                    'user': 'Taps High while on the free plan.',
                    'system': 'Opens the subscribe IAP; the Quality selection does not change.',
                    'exact': ['Title: &ldquo;Upgrade Your Plan&rdquo;', 'Footer: &ldquo;Demo only &mdash; no real payment&rdquo;'],
                    'limits': [('Reuses the site&rsquo;s shared subscribe IAP (same dialog as the Song spec&rsquo;s P5-S1).',
                                'Closing it leaves Quality on Standard.')],
                },
            ],
        },
        {
            'id': 'p5-guest-gate', 'num': 5,
            'name': 'Guest sign-in gate',
            'desc': 'A signed-out visitor can browse and compose freely; only Song Library and Create Music Video are gated.',
            'entry': 'Signed-out visitor at /mv/room', 'outcome': 'Signed in, resuming the gated action',
            'steps': [
                {
                    'shot': '39_guest_room.png', 'num': 1,
                    'user': 'A signed-out visitor arrives at /mv/room.',
                    'system': 'Renders the full compose screen with no sign-in modal; the sidebar shows a &ldquo;Login&rdquo; control instead of an account menu.',
                    'limits': [('/mv/room has no route guard (AC-MV-01b).',
                                'Unlike most authed routes, this screen is the destination of the marketing Navbar&rsquo;s Start for Free, so a guest must be able to browse and compose before signing in.')],
                },
                {
                    'shot': '40_guest_import_ungated.png', 'num': 2,
                    'user': 'Imports a local audio file, then confirms Trim.',
                    'system': 'Import Audio works with no sign-in prompt at any point; the song is added like a signed-in session.',
                    'exact': ['Source label after import: &ldquo;Imported Audio&rdquo;'],
                    'limits': [('Import Audio stays ungated even for a guest (AC-MV-01b).',
                                'A file the user already holds locally is not account data &mdash; it is the only song source a guest can use without signing in, since Song Library IS gated.')],
                },
                {
                    'shot': '41_guest_signin_gate.png', 'num': 3,
                    'user': 'Fills the description, then taps Create Music Video.',
                    'system': 'The sign-in modal opens over the compose screen; the composed draft stays visible and untouched underneath.',
                    'exact': [
                        'Title: &ldquo;Sign in to YouCam Muse&rdquo;',
                        'Subtitle: &ldquo;Save your creations, sync across devices, and unlock your full creative history.&rdquo;',
                        'Buttons: &ldquo;Continue with Apple&rdquo;, &ldquo;Continue with Google&rdquo;',
                    ],
                    'limits': [('Reuses the site&rsquo;s shared sign-in modal (same as the Song spec&rsquo;s P4-S1).',
                                'The gate is on the ACTION (Create Music Video, and separately Song Library), never on the route.')],
                },
                {
                    'shot': '42_guest_signed_in.png', 'num': 4,
                    'user': 'Taps a sign-in provider (Apple or Google &mdash; both mocked).',
                    'system': 'A brief &ldquo;Signed in successfully!&rdquo; stage plays, then the ORIGINAL Create Music Video action resumes automatically.',
                    'exact': ['Message: &ldquo;Signed in successfully!&rdquo; &mdash; &ldquo;Welcome back, Scott &middot; via Apple&rdquo;'],
                    'limits': [('The guest never returns to a blank compose screen after signing in &mdash; the action that opened the modal resumes.',
                                'Here, that is the mode chooser Create Music Video would have opened.'),
                               ('The insufficient-credit check (P6-S1) runs only after sign-in resumes the action, never while still signed out.',
                                'A guest is never shown the buy-credits upsell for an account they do not have yet.')],
                },
            ],
        },
        {
            'id': 'p6-insufficient-credit', 'num': 6,
            'name': 'Insufficient credits',
            'desc': 'One independent screen &mdash; not a continuation of P5.',
            'entry': 'Signed-in user, balance below the storyboard cost', 'outcome': 'Buy-credits IAP opens instead of generating',
            'steps': [
                {
                    'shot': '43_insufficient_credits.png', 'num': 1,
                    'user': 'A signed-in user on the default (unfunded) balance composes a brief and picks Create Storyboard First.',
                    'system': 'Generation does not start; the buy-credits IAP opens instead (GL-01, AC-MV-19).',
                    'exact': ['Title: &ldquo;Upgrade Your Plan&rdquo;'],
                    'limits': [
                        ('The balance/cost threshold is not asserted here.', 'Exact numbers come from the Credit Consume MSR (References).'),
                        ('The default demo balance is already below MV&rsquo;s cheapest possible generation.',
                         'So an unfunded signed-in account reaches this gate on its very first attempt, at either mode card.'),
                    ],
                },
            ],
        },
        {
            'id': 'p7-side-rail', 'num': 7,
            'name': 'Trending MVs vs My Creations',
            'desc': 'One independent screen &mdash; not a continuation of P5 or P6.',
            'entry': 'Signed-in user with &ge;1 completed MV revisits /mv/room', 'outcome': 'Side rail shows My Creations',
            'steps': [
                {
                    'shot': '32_side_rail_trending.png', 'num': 1,
                    'user': 'A signed-in user with zero completed MVs (or a fresh page load) arrives at /mv/room.',
                    'system': 'The side rail shows &ldquo;Trending MVs&rdquo; with a &ldquo;See all&rdquo; link to /explore/mvs.',
                    'limits': [('History is in-memory only, so a page reload puts the rail back to Trending even after generating an MV (prototype_deltas).',
                                'A real backend would keep the account&rsquo;s own completed MVs across a reload.')],
                    'focus': [{'box': [89.5, 10.9, 7.0, 4.0], 'type': 'action', 'label': 'See all'}],
                },
                {
                    'shot': '33_side_rail_my_creations.png', 'num': 2,
                    'user': 'Generates one MV in-session (client-side navigation only, no reload), then returns to /mv/room via Recreate.',
                    'system': 'The rail swaps to &ldquo;My Creations&rdquo;, listing that MV.',
                    'exact': ['Section label: &ldquo;My Creations&rdquo;'],
                    'limits': [
                        'The swap needs BOTH conditions &mdash; signed in AND at least one completed MV; either alone still shows Trending MVs.',
                        'My Creations drops the &ldquo;See all&rdquo; link that Trending MVs has.',
                    ],
                },
            ],
        },
        {
            'id': 'p8-result-controls', 'num': 8,
            'name': 'Result screen &mdash; controls tour',
            'desc': 'Five independent single-screen scenarios on /mv/result, starting from an already-generated result &mdash; not a continuation of P1/P2, and not a connected journey with each other.',
            'entry': 'Arrives at an already-generated /mv/result (any path)', 'outcome': 'Varies per step',
            'steps': [
                {
                    'shot': '34_result_like.png', 'num': 1,
                    'user': 'Taps Like.',
                    'system': 'The thumbs-up fills solid; Dislike is mutually exclusive with it.',
                    'limits': [('Like/Dislike is local-only &mdash; no API call, no History write, same pattern as the Song spec.', 'A user may like their own creation.')],
                    'focus': [{'box': [89.2, 11.7, 2.5, 4.0], 'type': 'info', 'label': 'Like'}],
                },
                {
                    'shot': '35_result_share_dialog.png', 'num': 2,
                    'user': 'Taps Share.',
                    'system': 'A dialog opens with a copyable public link to this MV.',
                    'exact': ['Title: &ldquo;Share&rdquo;', 'Body: Shareable public link to &ldquo;{title}&rdquo;', 'Button: &ldquo;Copy&rdquo;'],
                    'limits': [('Download saves the fixture render, not a per-row unique file (mock reality).',
                                'Same limitation the Song spec&rsquo;s result screen has for its own Download.')],
                },
                {
                    'shot': '36_result_publish_confirm.png', 'num': 3,
                    'user': 'Turns the Publish toggle on.',
                    'system': 'A confirm dialog appears before publishing &mdash; unlike Song, which publishes with no confirmation step.',
                    'exact': [
                        'Title: &ldquo;Ready to Go Public?&rdquo;',
                        'Body: &ldquo;Once published, your creation is visible to the community and may be shared on our social channels.&rdquo;',
                        'Buttons: &ldquo;Cancel&rdquo;, &ldquo;Confirm&rdquo;',
                    ],
                    'limits': [('MV&rsquo;s Publish requires this confirm step; Song&rsquo;s equivalent toggle does not.',
                                'Same shared confirm dialog History uses for its own row-level publish.')],
                    'focus': [{'box': [49.9, 52.2, 10.5, 5.3], 'type': 'action', 'label': 'Confirm'}],
                },
                {
                    'shot': '37_result_publish_pending.png', 'num': 4,
                    'user': 'Taps Confirm.',
                    'system': 'Publish shows &ldquo;Published &middot; pending review&rdquo;, and Edit MV is replaced by a neutral &ldquo;Unpublish to edit&rdquo; action.',
                    'exact': ['Publish state: &ldquo;Published &middot; pending review&rdquo;', 'Replaced button: &ldquo;Unpublish to edit&rdquo;'],
                    'limits': [
                        ('A published (or in-review) MV cannot be edited directly (TBD-MV-13, MV-E7).',
                         '&ldquo;Unpublish to edit&rdquo; renders in a neutral (white/black) style, distinct from the accent-colored &ldquo;Edit MV&rdquo; it replaces.'),
                        'Tapping it unpublishes, after which the button returns to accent &ldquo;Edit MV&rdquo; and opens the editor.',
                        ('The backend review pipeline behind &ldquo;pending review&rdquo; is undefined (TBD-MV-06).',
                         'Only the front-end publish-confirm and this status label are built.'),
                    ],
                },
                {
                    'shot': '38_result_from_history.png', 'num': 5,
                    'user': 'Opens a completed MV from a /history row (cold start, no prior flow state).',
                    'system': 'Lands on /mv/result showing that row&rsquo;s MV, with a Back control and the row&rsquo;s data seeded fresh (AC-MV-18).',
                    'limits': [
                        ('Flow state is seeded by `useOpenCreation`, not carried over from a generation.', 'This is what makes Share build a link to THIS row rather than whatever was last generated.'),
                        ('Back returns to /history (its fallback), via `router.back()`.', 'The generation screens `replace` rather than `push`, so Back off a freshly rendered MV reaches /mv/room, not the creating screen.'),
                        ('History&rsquo;s own row controls (filters, row menu, publish, delete) are out of scope here.', 'They belong to the History storyboard &mdash; this step covers only the hand-off INTO /mv/result.'),
                    ],
                },
            ],
        },
    ],

    # ── reference sections ───────────────────────────────────────────────────
    'states': [
        ('EMPTY', 'Arrive /mv/room', 'Song and description both unset, Create Music Video disabled', '&rarr; READY once both a song and a description exist', 'On Create Music Video'),
        ('READY', 'Song set AND description non-empty', 'Create Music Video enabled', '&rarr; MODE_SELECT on Create Music Video tap', 'On Create Music Video'),
        ('MODE_SELECT', 'Create Music Video tapped', 'Mode chooser open, compose preserved underneath', '&rarr; THINKING (storyboard-first) or &rarr; CREATING (direct)', 'On mode pick'),
        ('THINKING', '/mv/thinking after Storyboard First', 'Progress ring, step label, estimate, View Later', '&rarr; STORYBOARD_EDIT on done &middot; &rarr; FAILED on mock failure', 'On job outcome'),
        ('STORYBOARD_EDIT', '/mv/storyboard after a done storyboard job', 'Visual style / scenes editable, story / lyrics read-only, MV Song play-only, no Save', '&rarr; CREATING via Generate MV', 'On Generate MV'),
        ('CREATING', '/mv/creating after direct mode or Generate MV', 'Progress ring, step label, estimate, View Later', '&rarr; RESULT on done &middot; &rarr; FAILED on mock failure', 'On job outcome'),
        ('RESULT', '/mv/result after a successful job', 'Player, Like/Dislike, Share, Download, Publish toggle, Recreate, Edit MV / Unpublish to edit, Detail panel', '&rarr; MODE_SELECT via Recreate (returns to /mv/room) &middot; &rarr; History via Back', 'On navigation away'),
        ('FAILED', '/mv/thinking or /mv/creating after a mock failure', 'Generation Failed message, Retry, Back', '&rarr; THINKING/CREATING via Retry &middot; &rarr; /mv/room via Back', 'On Retry or Back'),
        ('Side rail: Trending MVs', 'Default &mdash; signed out, or signed in with zero completed MVs', 'NEW_MVS with a &ldquo;See all&rdquo; link (P7-S1)', '&rarr; My Creations once both conditions below are met', '&mdash;'),
        ('Side rail: My Creations', 'Signed in AND &ge;1 completed MV', 'The user&rsquo;s own finished MVs, no &ldquo;See all&rdquo; (P7-S2)', '&rarr; Trending MVs on sign-out or reload (History is in-memory)', '&mdash;'),
    ],

    'errors': [
        (
            'MV generation fails',
            'Description contains &ldquo;[fail]&rdquo; &mdash; the QA hook for a mid-generation failure; storyboard-first fails at thinking, direct fails at creating (MV-E1)',
            'Generation Failed &mdash; &ldquo;Something went wrong while generating. Your credits were not charged &mdash; you can retry now or adjust your input and try again.&rdquo;',
            'Retry re-runs the job from the same compose state (and re-fails, since it still contains &ldquo;[fail]&rdquo;); Back returns to /mv/room.',
            'Yes, in full (AC-MV-11, AC-MV-19) &mdash; the balance returns to its pre-charge value.',
        ),
        (
            'Signed-out user taps Create Music Video or Song Library',
            'Any compose state, no active session (P5-S1&hellip;S3)',
            'Sign-in modal opens over the compose screen; no credits upsell is shown; Import Audio stays ungated (AC-MV-01b)',
            'Sign in (P5-S4) resumes the original action automatically; dismissing the modal leaves the draft intact with no navigation',
            'N/A &mdash; never charged, gated before generation starts',
        ),
        (
            'Balance below the storyboard/render cost',
            'Signed in, credits &lt; cost at either mode card (P6-S1)',
            'Buy-credits IAP opens (a subscription picker for a non-subscriber) instead of starting generation',
            'Close the IAP and top up, then retry',
            'N/A &mdash; never charged, gated before generation starts',
        ),
        (
            'Reload mid-flow',
            'Reloading /mv/thinking, /mv/storyboard, /mv/creating, or /mv/result with no in-memory flow state (MV-E2)',
            'Redirects to /mv/room &mdash; immediate on thinking/creating/result; a brief tolerant wait on /mv/storyboard for localStorage hydration',
            'Compose again from /mv/room; nothing to retry, since the job that would have generated the missing state existed only in memory',
            'N/A &mdash; a reload this deep never reaches a charge in the first place',
        ),
        (
            'Import: unsupported format or file too large',
            'A local file with a disallowed extension/MIME, or a valid one over 50MB (MV-02, P4-S3/S4)',
            'Toast &mdash; &ldquo;Unsupported format. Use MP3, AAC, WAV, or M4A.&rdquo; or &ldquo;File too large. Maximum size is 50MB.&rdquo;',
            'Pick a different file; the compose form is otherwise untouched',
            'N/A &mdash; nothing was charged',
        ),
    ],
    'errors_note': (
        'Production trigger for a real generation failure is undefined &mdash; the &ldquo;[fail]&rdquo; marker is a '
        'mock-only QA hook (specs/areas/02-mv-creation.md MV-E1). It is read once, when the job is first created, '
        'and reused when it re-renders, which is why the SAME marker fails storyboard-first at thinking and direct at creating, '
        'never both stages of one job.'
    ),

    'criteria': [
        # Four of the area spec's 22 criteria map to no step here. Each is listed
        # BELOW with its reason rather than left out: a criterion absent from this
        # table is invisible to the reader, who then cannot tell "covered" from
        # "never considered". The builder prints "N of M map to a step", so
        # listing them is also what makes that ratio honest.
        ('AC-MV-01', 'Default mvType=singing; Create Music Video stays disabled until song AND description both exist.', ['P1-S1', 'P1-S8']),
        ('AC-MV-01b', 'Guest: full compose screen with no sign-in modal; gate is on Song Library and Create Music Video only; Import Audio stays ungated.', ['P5-S1', 'P5-S2', 'P5-S3', 'P5-S4']),
        ('AC-MV-02', 'Any song source routes through Trim before it is set; on confirm, shows the song card with effective (trimmed) duration.', ['P1-S3', 'P1-S4', 'P1-S5', 'P4-S2']),
        ('AC-MV-03', 'Typed/pasted description beyond 2500 chars is rejected; programmatic fills (Templates) are not capped.', ['P1-S6', 'P2-S2']),
        ('AC-MV-04', 'Create Music Video clears the previous MV&rsquo;s generation state and opens the mode chooser, preserving the brief.', ['P1-S9']),
        ('AC-MV-05', 'Storyboard First navigates to /mv/thinking and starts a storyboard job; Directly navigates to /mv/creating and starts a render job.', ['P1-S10', 'P2-S5']),
        ('AC-MV-06', 'A started job inserts a Generating row in History; while processing shows progress/step/estimate/View Later.', ['P1-S10', 'P1-S13']),
        ('AC-MV-07', 'A done storyboard job navigates to /mv/storyboard populated with character image, song, visual style, story, scenes, and lyrics.', ['P1-S11']),
        ('AC-MV-08', 'Visual Style and Scene text are editable and ephemeral (no Save); MV Song is play-only; edits carry into the next Generate MV.', ['P1-S11']),
        ('AC-MV-09', 'Generate MV renders using the (possibly edited) storyboard and lands on /mv/result.', ['P1-S12', 'P1-S13', 'P1-S14']),
        ('AC-MV-10', '/mv/result loops muted video and exposes Like/Dislike, Share, Download, a Publish toggle with a &ldquo;Ready to Go Public?&rdquo; confirm on turn-on, Recreate, and Edit MV (replaced by &ldquo;Unpublish to edit&rdquo; while published).', ['P1-S14', 'P8-S1', 'P8-S2', 'P8-S3', 'P8-S4']),
        ('AC-MV-11', 'A failed job shows the error state with Back and Retry, and marks the History row Failed.', ['P3-E2', 'P3-E3']),
        ('AC-MV-12', 'Regenerate scene / Recreate cover overwrite in place, with no picker and no undo, and decrement the balance.', [],
         'Edit MV only &mdash; out of scope here; owned by the mv-edit spec (S3).'),
        ('AC-MV-13', 'Merge MV re-renders from the current cover/scenes and charges on generation start, refunded on failure.', [],
         'Edit MV only &mdash; out of scope here; owned by the mv-edit spec (S3).'),
        ('AC-MV-14', 'Enhance on visual style, scene prompt, or cover description replaces that field with the matching `enhancePrompt` result.', ['P1-S11']),
        ('AC-MV-15', 'Withdrawn upstream 2026-08-19 &mdash; it asserted generation does NOT change the balance, contradicting AC-MV-19 and the code.', [],
         'Withdrawn in the area spec itself; superseded by AC-MV-19. Nothing should map to it.'),
        ('AC-MV-16', 'A track shorter than 30s is refused at UPLOAD with a toast, and trim stores {start,end} only when the selection is &ge;30s &mdash; below that Confirm is disabled with a minimum-30s hint.', ['P1-S4', 'P4-S5', 'P4-S6']),
        ('AC-MV-17', 'Imported audio accepts only MP3/AAC/WAV/M4A &le;50MB and rejects anything else with an error toast.', ['P4-S3', 'P4-S4']),
        ('AC-MV-18', '/mv/result reached from a History row shows that row&rsquo;s MV, seeded fresh via useOpenCreation, with Back to /history.', ['P8-S5']),
        ('AC-MV-18b', 'On the free plan, tapping High quality opens the subscribe IAP instead of selecting it.', ['P4-S8', 'P4-S9']),
        ('AC-MV-19', 'Storyboard/render generation charges its cost on start and refunds on failure; insufficient balance routes to the buy-credits IAP instead of generating.', ['P1-S10', 'P1-S13', 'P3-E2', 'P3-E3', 'P6-S1']),
        ('AC-MV-17b', '/mv/room, /mv/storyboard, /mv/result and /mv/edit render at 320/375/768/1024/1440/1920px with no overflow.', [],
         'Only 1440px is verified here &mdash; <strong>five of its six widths are unverified by this spec</strong>. Every capture is a single desktop viewport (D8). The six-width sweep is e2e/visual-baseline.spec.ts, not this document.'),
        ('AC-HIST-01', 'History shows live jobs prepended to the seed list under All.', ['P1-S15', 'P2-S6']),
        ('AC-HIST-03', 'A done row shows a Done status pill.', ['P1-S15', 'P2-S6']),
        ('GL-01', 'When credits are below the generation cost, the CTA routes to the buy-credits IAP instead of starting generation.', ['P6-S1']),
        ('MV-P1-S0', 'The compose side rail shows Trending MVs by default, swapping to My Creations once the user is signed in with at least one completed MV.', ['P7-S1', 'P7-S2']),
    ],

    'prototype_deltas': [
        (
            'Backend',
            'Only `MockMuseApi` exists &mdash; there is no real backend anywhere in this repo.',
            'A production build swaps in a real API implementing the same `MuseApi` contract; every job, poll, and cost in this spec is the mock&rsquo;s behavior, not a guarantee about real timing or exact pricing.',
        ),
        (
            'Generation timing',
            'The mock resolves a storyboard or render job in a few seconds of wall-clock time, regardless of the on-screen &ldquo;~1 minute&rdquo; / &ldquo;~2 minutes&rdquo; estimates.',
            'Real generation duration is backend-determined; the on-screen estimates must reflect the actual expected wait or be removed.',
        ),
        (
            'In-memory History and credits',
            'Both the History list and the credit balance are in-memory React state that resets to its default on every full page load (confirmed live in P7: reloading /mv/room puts the side rail back to Trending even right after generating an MV).',
            'A real balance and History are server-held and must survive a reload; the charge must be atomic with the generation request rather than applied client-side before it.',
        ),
        (
            'Seeded libraries',
            'My Songs (2), Sample Songs (5), Sample Photos (8), and Templates (6) are all static fixture arrays in `src/lib/mv/mock.ts`, not a real per-account library or a CMS-fed catalog.',
            'Production needs a real per-account song/photo library and a CMS-authored template catalog; an always-populated Choose Song also means the intended empty-state (TBD-MV-11) is unbuilt and unverifiable here.',
        ),
        (
            'MV-E1&rsquo;s deterministic re-fail',
            'The &ldquo;[fail]&rdquo; marker is a QA-only hook with no production trigger; Retry re-runs the identical compose and therefore re-fails every time, which is why the on-screen &ldquo;adjust your input&rdquo; copy has no matching affordance in this build.',
            'A real failure needs a real trigger (timeout, model error, moderation reject, &hellip;); production Retry should reasonably succeed once whatever caused the failure has cleared.',
        ),
    ],

    'decisions': [
        ('D-01', 'What source replaces prd.md/plan.md for this repo?', 'specs/areas/02-mv-creation.md and 05-history.md (the existing as-built specs) plus direct verification against the running app, matching the Song spec&rsquo;s D-01.'),
        ('D-02', 'MV is one spec or two?', 'Two (PLAN.md D1) &mdash; this document covers /mv/room through /mv/result; /mv/edit is its own spec, S3 (mv-edit), postponed. The cut lands where the user re-enters from the result screen and where charging changes from per-generation to per-micro-op.'),
        ('D-03', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo yet, matching the Song spec.'),
        ('D-04', 'P2&rsquo;s scope: Templates only, or Templates + Enhance?', 'Templates only (PLAN.md &ldquo;S2 scope&rdquo;) &mdash; Enhance is explicitly excluded from P2 and from this spec&rsquo;s /mv/room screens generally, since `origin/main`&rsquo;s `3bdff87` removed it from that screen for V1 (product owner, 2026-08-25) before this capture run began.'),
        ('D-05', 'Where do credit-cost numbers come from in this spec?', 'Nowhere &mdash; every RULES bullet that would assert a number points at the Credit Consume MSR instead (PLAN.md D2), matching the Song spec&rsquo;s D-05. Verbatim on-screen text (e.g. a mode card&rsquo;s live &ldquo;15 Credits&rdquo;) is unaffected, since that is a true fact about the current build regardless of what the MSR prices it at.'),
        ('D-06', '/mv/creating still uses the pre-migration shared GenerationView &mdash; call it out how?', 'One RULES line on the step that captures it (P1-S13), sourced to specs/areas/02-mv-creation.md &sect;1. Not a prototype_deltas row, since nothing about it is faked &mdash; it is a real, deliberate scope decision (DP has no design for this screen).'),
        ('D-07', 'Where does the MV Creation storyboard stop relative to History?', 'One closing step per generation path showing the new row in History (P1-S15, P2-S6); History&rsquo;s own filters/menu/publish/delete stay out of scope (05-history.md already covers them), matching the Song spec&rsquo;s D-02.'),
        ('D-08', 'A capture run 1 contradiction: two areas/02 lines still described the /mv/room Enhance button, which the rebase removed &mdash; fix in place?', 'Yes (PLAN.md D11) &mdash; MV-P1-S4&rsquo;s row and AC-MV-14 both named a description-field Enhance shortcut that no longer exists on this screen (removed 2026-08-25, `3bdff87`, product owner). Both corrected in place with a ⚠️ note and this capture&rsquo;s date, in the same branch as this spec.'),
        ('D-09', 'A real bug found while capturing (StoryboardGenerationScreen double-starting the storyboard job under Strict Mode) &mdash; fix now or document?', 'Fixed (`e739c4e`, 2026-08-27) &mdash; a one-file fix with an obvious e2e guard (PLAN.md D10). Same `started` ref pattern `GenerationView.tsx` already carries for the other two generation screens. The owed regression test was written and mutation-tested in both directions in this same session.'),
        ('D-10', 'Voided capture run 1 &mdash; reuse any of its 44 screenshots?', 'No &mdash; all void (PLAN.md &ldquo;S2 scope&rdquo;). They photographed a control (Enhance on /mv/room) the product owner had already removed from V1 the day after that run captured. Every screenshot in this spec is a fresh capture against the rebased tree; filenames were renumbered rather than left with a gap where the Enhance shot used to be.'),
        ('D-11', 'Viewport scope?', 'Desktop 1440 only (D8, PLAN.md programme decision) &mdash; the phone chrome and /mv/edit&rsquo;s MobileSceneDetail get no QA storyboard here.'),
    ],

    'references': [
        ('Credit Consume MSR &mdash; generation cost numbers', '', 'TBD'),
        ('specs/areas/02-mv-creation.md &sect;8 TBD-MV-03', '', 'Multi-face auto-detect deferred &mdash; MVP keeps manual crop (P4-S7).'),
        ('specs/areas/02-mv-creation.md &sect;8 TBD-MV-06', '', 'Publish-to-community backend pipeline undefined (P8-S4).'),
        ('specs/areas/02-mv-creation.md &sect;8 TBD-MV-11', '', 'Choose Song&rsquo;s empty-state is unbuilt &mdash; the seed is always populated (prototype_deltas).'),
    ],

    'open_questions': [
        ('Q-01', 'Where does the Credit Consume MSR live, so RULES bullets can cite a real link instead of &ldquo;TBD&rdquo;?', 'Every credit-cost RULES bullet in this spec (P1-S4, P1-S9, P1-S10, P1-S13, P6-S1)', 'Product owner (carried over from the Song spec&rsquo;s own open Q-01-equivalent, D-05)'),
        ('Q-02', 'When is the real (non-QA-hook) generation-failure trigger and message defined?', 'Whether production Retry can ever succeed (errors_note, P3)', 'RD / backend'),
        ('Q-03', 'Is TBD-MV-11&rsquo;s empty-library empty-state (&ldquo;You haven&rsquo;t created any songs yet&rdquo; + create shortcut) still planned for Choose Song?', 'P4-S1/S2 &mdash; cannot be captured until the seed can be emptied', 'Product owner'),
        ('Q-04', 'What does &ldquo;pending review&rdquo; actually do server-side once TBD-MV-06 is answered?', 'P8-S4&rsquo;s publish flow &mdash; only the front-end confirm and status label exist today', 'RD (Curation PRD)'),
    ],

    'data_contract': {
        'intro': 'Static content fixtures behind /mv/room&rsquo;s Choose Song, Templates, and MV-type cards. Not a runtime API payload &mdash; a TypeScript module RD ships as real content (or a real API), not a fixture.',
        'schemas': [{
            'caption': 'T1 &middot; Preset MV fixtures (`src/lib/mv/mock.ts`)',
            'json': (
                '{\n'
                '  "MV_TYPES": [\n'
                '    { "id": "storytelling", "name": "Storytelling" },\n'
                '    { "id": "singing", "name": "Singing" },\n'
                '    { "id": "hybrid", "name": "Sing &amp; Story" }\n'
                '  ],\n'
                '  "MY_SONGS": [ "My Wedding Ballad", "Summer Vibes" ],\n'
                '  "SAMPLE_SONGS": [\n'
                '    "Top Flow - Party", "Party Dance", "Forest Morning",\n'
                '    "Golden Hour", "Neon Pulse", "... 7 entries total"\n'
                '  ],\n'
                '  "TEMPLATES": [\n'
                '    { "name": "Neon City", "prompt": "A glamorous night drive through a neon-lit city..." },\n'
                '    "... 6 entries total"\n'
                '  ]\n'
                '}'
            ),
            'fields': [
                ('MV_TYPES', '{id, name, desc, video}[3]', 'The three type cards. `id` is a frozen contract field; only `hybrid`&rsquo;s DISPLAY `name` (&ldquo;Sing &amp; Story&rdquo;) diverges from its id (P1-S2).'),
                ('MY_SONGS', 'Song[2]', 'The signed-in user&rsquo;s own song library, tab &ldquo;My Songs&rdquo; in Choose Song.'),
                ('SAMPLE_SONGS', 'Song[7]', 'A shared sample catalog, tab &ldquo;Sample Songs&rdquo; in Choose Song (P4-S1/S2 shows 5 of 7 in frame).'),
                ('TEMPLATES', '{id, name, cover, prompt}[6]', 'The Templates sheet grid (P2-S1); selecting one fills the description with its `prompt`.'),
            ],
            'note': (
                'All four arrays are static fixtures with no CMS or per-account backing today (prototype_deltas). '
                'Only two real audio files exist behind the 9 total songs (`MY_SONGS` + `SAMPLE_SONGS`) &mdash; every '
                'song maps to one of them, so playback/trim previews always have real audio to work with.'
            ),
        }],
    },

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Entry["Sidebar &quot;AI Music Video&quot;"] --> Compose["Compose - type, song, description, photo (P1-S1..S8)"]\n'
        '  Compose --> Create["Tap Create Music Video"]\n'
        '  Create --> Mode{Mode?}\n'
        '  Mode -->|Storyboard First| Think["/mv/thinking"]\n'
        '  Mode -->|Directly, Templates only| Rendering["/mv/creating"]\n'
        '  Think --> Outcome1{Job outcome}\n'
        '  Outcome1 -->|done| SB["/mv/storyboard (edit)"]\n'
        '  Outcome1 -->|&quot;[fail]&quot;| Failed1["Generation Failed"]\n'
        '  SB --> |Generate MV| Rendering\n'
        '  Rendering --> Outcome2{Job outcome}\n'
        '  Outcome2 -->|done| Result["/mv/result (P8: controls tour)"]\n'
        '  Outcome2 -->|&quot;[fail]&quot;| Failed2["Generation Failed"]\n'
        '  Result --> History["/history (P1/P2 closing step)"]\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    # lint_spec.py's directory scan only picks up .html/.js (this skill's
    # original prototypes were plain HTML/JS); this repo is TypeScript/React,
    # so every relevant file is listed individually rather than as a directory
    # (matches the Song spec's convention).
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'MvRoom.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'StoryboardGenerationScreen.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'StoryboardEditor.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'RenderGenerationScreen.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'MvResult.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'ChooseSongModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'TrimAudioModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'FacePickerModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'SettingsModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'TemplateSheet.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'ModeModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'history', 'HistoryView.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'mock.ts'),
        os.path.join(WEB_APP, 'src', 'components', 'auth', 'SignInModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'SubscribeModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ShareDialog.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'PublishConfirmDialog.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'EnhanceButton.tsx'),
    ],
    'strings_ignore': [
        # Composed at render time from live data, never a literal source string.
        '126/2500',                    # {description.length}/{DESCRIPTION_MAX} — the value at capture time
        'Shareable public link to .',  # {title} interpolated into the ShareDialog body
        '15 Credits',                  # live scriptCost() number, not a literal string
        '297 Credits',                 # live createMvCost()/generateMvCost() number, not a literal string
        'Selected: 00:07 . minimum 30s',  # {mm:ss} interpolated live-drag readout
        # `MvRoom.tsx` composes this as `Audio must be at least ${MIN_TRIM_SEC}
        # seconds.` — the 30 is the SAME constant `TrimAudioModal` exports and
        # enforces, deliberately not written twice, so the literal sentence
        # cannot appear in source. Quoted verbatim from the capture (P4-S5).
        'Audio must be at least 30 seconds.',
        'Welcome back, Scott . via Apple',  # {MOCK_USER.name} / {provider} interpolated
        # lint_spec.py's plain() strips anything matching <[^>]+> as an HTML
        # tag; a stray unmatched '<'/'>' from TSX generics or comparisons
        # swallows real text. Confirmed correct by direct grep of the
        # component files, and independently against the live app during
        # capture (same false-positive class the Song spec's build script
        # documents for this same lint check).
        'Something went wrong while generating. Your credits were not charged - you can retry now or adjust your input and try again.',
        'Upgrade Your Plan',
        'Demo only - no real payment',
        'Save your creations, sync across devices, and unlock your full creative history.',
        'Sign in to YouCam Muse',
        'CHOOSE A SONG (Required)',
        'Once published, your creation is visible to the community and may be shared on our social channels.',
        # lint_spec.py's plain() extracts rendered TEXT NODES, not JSX
        # attribute VALUES passed to a child component (e.g.
        # `<RoomNavbar title="AI Music Video" />`, `<DetailNavbar
        # title="Creating Your Music Video" subtitle="..." />`,
        # `<TemplateSheet title="Select a Template" />`). All confirmed
        # correct by direct grep of the named component files and
        # independently against the live app during capture.
        'AI Music Video',
        'Creating Your Music Video',
        "Your cinematic MV is being rendered. We'll notify you when it's ready.",
        '~2 minutes',
        'Select a Template',
        # Deliberately quoted as a NEGATIVE example — it is what this footer
        # button used to read before slice 3g-2's generic Cancel/Confirm
        # shell, and P1-S4 exists to correct that stale assumption. It is
        # intentionally NOT on screen.
        'Use Trimmed Audio',
        # Two separate text nodes split by a <br/> in MvRoom.tsx
        # ("2nd face photo" then "(Optional)" on its own line) — renders as
        # one visual line, confirmed in the 07_photo_sample_added.png capture,
        # but is not one literal source string.
        '2nd face photo (Optional)',
        # lint_spec.py's entity table does not map &middot; the same way the
        # source's real "·" character compares; confirmed correct by direct
        # grep of MvResult.tsx (`{published ? "Published · pending review" : "Off"}`).
        'Published . pending review',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
