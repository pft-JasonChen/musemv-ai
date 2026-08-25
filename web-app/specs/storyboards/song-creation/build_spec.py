#!/usr/bin/env python3
"""yco-spec build script — AI Song Creation storyboard (trial).

Screenshot source: **live app capture**, not a static prototype. There is no
separate "prototype" build in this repo — `web-app/` itself is the thing being
specced, so every screenshot in specs/screenshots/ was captured by driving the
real Next.js dev server (`npm run dev`, localhost:3000) with Playwright, signed
in via the same `localStorage['muse_auth']` seed the e2e specs use.

Source of truth for every rule/copy string not directly re-verified against the
running app: specs/areas/03-song-creation.md, specs/areas/05-history.md, and
specs/00-overview.md (the existing as-built specs for this repo) — used in place
of a prd.md/plan.md, which this repo does not have. Every quoted string below was
also independently confirmed against the live app's accessibility tree during
capture (see capture-notes.md in this folder).

Scope (confirmed via /grill-me, 2026-08-24): Simple compose and Custom compose as
two full happy paths, plus one generation-failure path, each ending either at
/song/result or (failure) the Generation Failed screen; the two happy paths each
close with one step showing the new row in /history. History's own behavior
(filters, the (...) menu, publish, delete) is out of scope — see 05-history.md.
Comments layer disabled (no Firebase backend in this repo yet).

Revised 2026-08-24 after review feedback: added P4 (guest sign-in gate, two
connected steps), P5 (insufficient credits, one step) and P6 (the Trending/My
Creations side-rail swap, one step) — each lighter-weight than P1-P3 on purpose,
since none needs a multi-step journey to demonstrate. P5 and P6 are split out
from P4 rather than folded into it, since only P4's two steps are actually a
connected flow (guest taps Create Song -> signs in); P5 and P6 are independent
screens with no relation to each other or to P4 beyond sharing this repo's
edge-case backlog, and numbering them as a third and fourth P4 step read as if
they continued the guest flow. Also: every RULES bullet that asserted a
credit-cost number now points at the Credit Consume MSR instead (see the
`references` cfg key, left blank pending that spec's link); and the Idea/Lyrics
sample-fill rule was rewritten to state the actual selection mechanism (random
minus the current value only, so a preset CAN reappear non-consecutively) instead
of the imprecise "never repeats."

lint_spec.py's STRINGS check (`prototype_src`) is only partly usable here: it
scans directories for .html/.js only (this skill's original prototypes were
plain HTML/JS), so every relevant file is listed individually below instead of
as a directory. Even as individual files, its `plain()` tag-stripper (regex
`<[^>]+>`) misfires against TSX source — a stray unmatched `<`/`>` from a
TypeScript generic or comparison swallows everything up to the next `>`,
silently deleting real text rather than failing loudly. Three genuine on-screen
strings were false-positive "misses" for exactly this reason (see
strings_ignore below, each with its own note) and were instead confirmed by
grepping the named component files directly.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/song-creation
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE
AREA03 = os.path.join(WEB_APP, 'specs', 'areas', '03-song-creation.md')
AREA05 = os.path.join(WEB_APP, 'specs', 'areas', '05-history.md')

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'AI Song Creation',
    'breadcrumb': 'YouCam Muse Web &rarr; AI Song',
    'author': 'Jason Chen', 'date': '2026-08-24', 'status': 'Draft',
    'version': 'v1',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        'The end-to-end flow to create an AI song on the web: compose in Simple or '
        'Custom mode, watch generation, view the result, and see the finished song '
        'appear in History.'
    ),
    'background': (
        'A trial run of the yco-spec screenshot-first storyboard format in this repo, '
        'alongside the existing AI-facing area specs (specs/areas/*.md). Built to test '
        'whether this QA-facing format is worth adopting more broadly.'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of the Song Creation flow they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web (desktop) &mdash; captured at 1440px'],
        ['Audience', 'QA'],
        ['Scope', 'Simple compose, Custom compose, and a generation-failure path &mdash; each ending at /song/result or Generation Failed; the two happy paths close on the new row in /history. Plus three independent single-screen scenarios, each its own short path: guest sign-in gate (P4, two connected steps), insufficient credits (P5), and the Trending/My Creations side-rail swap (P6).'],
        ['Out of scope', 'History&rsquo;s own behavior (filters, &ctdot; menu, publish, delete) &mdash; see specs/areas/05-history.md'],
        ['Source', 'specs/areas/03-song-creation.md, specs/areas/05-history.md, specs/00-overview.md, and the running app'],
    ],

    'short_nav': ['Simple compose (happy path)', 'Custom compose + Lyrics (happy path)', 'Generation failure', 'Guest sign-in gate', 'Insufficient credits', 'Trending Songs vs My Creations'],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        {
            'id': 'p1-simple', 'num': 1,
            'name': 'Simple compose &mdash; happy path',
            'desc': 'Default tab. A one-line description is enough to generate.',
            'entry': 'Sidebar &ldquo;AI Song&rdquo;', 'outcome': 'New song row in History',
            'steps': [
                {
                    'shot': '01_simple_empty.png', 'num': 1,
                    'user': 'Arrives at /song/create.',
                    'system': 'Simple tab is selected by default; Create Song stays disabled until Describe has text.',
                    'exact': [
                        'Section label: &ldquo;DESCRIBE IDEA OF YOUR SONG&rdquo;',
                        'Placeholder: &ldquo;e.g. A bittersweet love song about leaving a city you called home, with a melancholic yet hopeful vibe...&rdquo;',
                        'Disabled button: &ldquo;Create Song 6&rdquo;',
                    ],
                    'limits': ['Create Song stays disabled while Describe is empty.'],
                },
                {
                    'shot': '02_simple_idea_filled.png', 'num': 2,
                    'user': 'Taps Idea.',
                    'system': 'Describe fills with a preset idea and Create Song becomes enabled.',
                    'exact': ['Enabled button: &ldquo;Create Song 6&rdquo;'],
                    'limits': [
                        ('Idea fills from a fixed content pool (T1), not an AI generation on tap.',
                         'A pool of 12 style+scene+tempo+mood briefs, the product owner&rsquo;s own copy.'),
                        ('Each tap excludes only the brief already shown, then picks uniformly from the rest.',
                         '11 of 12 briefs are eligible, so the same one can reappear later &mdash; just never twice in a row.'),
                        ('The Create Song cost shown is live and scales with Instrumental.',
                         'Exact amounts come from the Credit Consume MSR (References), not asserted here.'),
                    ],
                    'focus': [{'box': [22.01, 59.22, 3.61, 2.78], 'type': 'action', 'label': 'Idea'}],
                },
                {
                    'shot': '02_simple_idea_filled.png', 'num': 3,
                    'user': 'Taps Create Song.',
                    'system': 'Balance is charged the generation cost immediately; navigates to /song/creating.',
                    'limits': [
                        ('Charges on start and refunds on failure (AC-SONG-09).',
                         'Exact amounts come from the Credit Consume MSR (References), not asserted here.'),
                    ],
                    'focus': [{'box': [35.76, 66.44, 15.97, 5.11], 'type': 'action', 'label': 'Create Song'}],
                },
                {
                    'shot': '03_simple_creating.png', 'num': 4,
                    'user': 'Waits for generation to finish.',
                    'system': '/song/creating shows a progress ring, step label, and an estimate while the job runs.',
                    'exact': ['Estimate: &ldquo;This usually takes about a minute.&rdquo;', 'Link: &ldquo;View Later&rdquo; &rarr; /history.'],
                },
                {
                    'shot': '04_simple_result.png', 'num': 5,
                    'user': 'Generation finishes.',
                    'system': 'Navigates to /song/result &mdash; cover, title, genre &middot; mood line, seek/transport, Like/Share/Download, Publish toggle, and a My Creations rail.',
                    'exact': [
                        'Genre &middot; mood line format: &ldquo;Pop &middot; Uplifting&rdquo;',
                        'Empty-lyrics note: &ldquo;No lyrics available for this one yet&rdquo;',
                        'Publish state label: &ldquo;Off&rdquo;',
                    ],
                    'limits': [
                        'Simple mode never sets lyrics, so the result has only this fallback note, never a Lyrics panel.',
                        'Previous/Next stay disabled until more than one song exists in My Creations.',
                    ],
                },
                {
                    'shot': '05_history_simple.png', 'num': 6,
                    'user': 'Opens History from the sidebar.',
                    'system': 'The new song appears at the top of the list with a Done status pill.',
                    'exact': ['Status pill: &ldquo;Done&rdquo;'],
                    'limits': ['New rows are prepended to the list &mdash; most recent first.'],
                },
            ],
        },
        {
            'id': 'p2-custom', 'num': 2,
            'name': 'Custom compose + Lyrics &mdash; happy path',
            'desc': 'Custom tab with a full lyric sheet, producing a synced Lyrics panel on the result.',
            'entry': '/song/create &rarr; Custom tab', 'outcome': 'New song row (with Lyrics) in History',
            'steps': [
                {
                    'shot': '06_custom_empty.png', 'num': 1,
                    'user': 'Switches to the Custom tab.',
                    'system': 'Describe is replaced by a Lyrics textarea, plus Genre/Mood/Vocal chips and an optional Song Title; Create Song is enabled with no input needed.',
                    'exact': [
                        'Section label: &ldquo;LYRICS&rdquo;',
                        'Placeholder: &ldquo;Write your lyrics here... Or leave blank &mdash; AI will generate them based on your chosen style and mood.&rdquo;',
                        'Chip groups: &ldquo;GENRE&rdquo;, &ldquo;MOOD&rdquo;, &ldquo;VOCAL (Optional)&rdquo;',
                        'Default selected chips: &ldquo;Pop&rdquo;, &ldquo;Uplifting&rdquo;',
                        'Field label: &ldquo;SONG TITLE (Optional)&rdquo;',
                    ],
                    'limits': ['Custom mode&rsquo;s Create Song is enabled by default (AC-SONG-01).'],
                    'focus': [{'box': [26.46, 11.11, 5.63, 3.78], 'type': 'action', 'label': 'Custom tab'}],
                },
                {
                    'shot': '07_custom_lyrics_filled.png', 'num': 2,
                    'user': 'Taps the Lyrics sample-fill button.',
                    'system': 'The Lyrics box fills with a complete preset lyric sheet, marked with [intro]/[verse]/[chorus]/[bridge]/[outro].',
                    'exact': ['Sample-fill buttons: &ldquo;Idea&rdquo;, &ldquo;Lyrics&rdquo;'],
                    'limits': [
                        ('Lyrics fills from a fixed content pool (T1), not an AI generation on tap.',
                         '10 complete lyric sheets (one Japanese), the product owner&rsquo;s own copy.'),
                        ('Each tap excludes only the sheet already shown, then picks uniformly from the rest.',
                         '9 of 10 sheets are eligible, so the same one can reappear later &mdash; just never twice in a row (AC-SONG-02b).'),
                        'Lyrics is hidden while Instrumental is on; Idea stays visible either way.',
                    ],
                    'focus': [{'box': [25.90, 32.78, 4.24, 2.78], 'type': 'action', 'label': 'Lyrics'}],
                },
                {
                    'shot': '07_custom_lyrics_filled.png', 'num': 3,
                    'user': 'Taps Create Song.',
                    'system': 'Balance is charged; navigates to /song/creating &mdash; the same progress screen as the Simple path (P1-S4).',
                    'focus': [{'box': [35.76, 84.67, 15.97, 5.11], 'type': 'action', 'label': 'Create Song'}],
                },
                {
                    'shot': '', 'num': 4,
                    'user': 'Waits for generation to finish.',
                    'system': 'Same /song/creating progress screen as the Simple path (P1-S4).',
                    'summary': 'Waits for generation to finish (same screen as P1-S4).',
                },
                {
                    'shot': '08_custom_result_lyrics.png', 'num': 5,
                    'user': 'Generation finishes.',
                    'system': 'Navigates to /song/result with the full lyric sheet shown alongside the player.',
                    'exact': ['Genre &middot; mood line format: &ldquo;Pop &middot; Uplifting&rdquo;'],
                    'limits': [
                        'Custom mode plus typed lyrics is what produces the Lyrics panel &mdash; Simple mode never does (P1-S5).',
                        'Section markers ([intro], [verse], [chorus], [bridge], [outro]) render as their own lines, same as typed.',
                    ],
                },
                {
                    'shot': '09_history_custom.png', 'num': 6,
                    'user': 'Opens History from the sidebar.',
                    'system': 'The new song appears at the top of the list with a Done status pill.',
                    'exact': ['Status pill: &ldquo;Done&rdquo;'],
                    'limits': ['Same list behavior as the Simple path (P1-S6).'],
                },
            ],
        },
        {
            'id': 'p3-error', 'num': 3,
            'name': 'Generation failure',
            'desc': 'A QA hook forces a mid-generation failure so the error state can be checked without waiting on a real backend failure.',
            'entry': '/song/create (Simple tab)', 'outcome': 'Generation Failed screen',
            'steps': [
                {
                    'shot': '10_error_trigger.png', 'num': 1,
                    'user': 'Types a description containing the &ldquo;[fail]&rdquo; marker.',
                    'system': 'Create Song becomes enabled, same as any non-empty Simple description.',
                    'limits': ['Any Simple description containing &ldquo;[fail]&rdquo; triggers a mock failure at about 60% progress &mdash; a QA hook, not user-facing copy.'],
                },
                {
                    'shot': '10_error_trigger.png', 'num': 2,
                    'user': 'Taps Create Song.',
                    'system': 'Balance is charged; navigates to /song/creating; the job fails partway through.',
                    'focus': [{'box': [35.76, 66.44, 15.97, 5.11], 'type': 'action', 'label': 'Create Song'}],
                },
                {
                    'shot': '11_error_failed_screen.png', 'num': 3, 'role': 'error',
                    'user': 'The job fails at about 60% progress.',
                    'system': 'The Generation Failed screen replaces the progress ring, with Retry and Back.',
                    'exact': [
                        'Heading: &ldquo;Generation Failed&rdquo;',
                        'Body: &ldquo;Something went wrong while generating. Your credits were not charged &mdash; you can retry now or adjust your input and try again.&rdquo;',
                        'Buttons: &ldquo;Retry&rdquo;, &ldquo;Back&rdquo;',
                    ],
                    'limits': [
                        'Back returns to /song/create.',
                        'Retry re-runs generation from the same compose state.',
                        ('The charged balance is refunded in full on failure (AC-SONG-09).',
                         'The screenshot shows the balance back at its pre-charge value, matching the on-screen &ldquo;credits were not charged&rdquo; message.'),
                    ],
                },
            ],
        },
        {
            'id': 'p4-guest-gate', 'num': 4,
            'name': 'Guest sign-in gate',
            'desc': 'A signed-out visitor tries to generate; two steps, one continuous flow.',
            'entry': 'Signed-out visitor taps Create Song', 'outcome': 'Generation starts automatically after sign-in',
            'steps': [
                {
                    'shot': '12_guest_signin_modal.png', 'num': 1,
                    'user': 'A signed-out visitor types a description and taps Create Song.',
                    'system': 'The sign-in modal opens over the compose screen; the typed draft stays visible and untouched underneath.',
                    'exact': [
                        'Title: &ldquo;Sign in to YouCam Muse&rdquo;',
                        'Subtitle: &ldquo;Save your creations, sync across devices, and unlock your full creative history.&rdquo;',
                        'Buttons: &ldquo;Continue with Apple&rdquo;, &ldquo;Continue with Google&rdquo;',
                    ],
                    'limits': [
                        '/song/create has no route guard &mdash; the page renders for guests; the gate is on Create Song itself (AC-SONG-01b).',
                        'Dismissing the modal (backdrop or Escape) leaves the draft intact with no navigation.',
                    ],
                },
                {
                    'shot': '13_guest_signin_success.png', 'num': 2,
                    'user': 'Taps a sign-in provider (Apple or Google &mdash; both are mocked, no real OAuth).',
                    'system': 'A brief &ldquo;Signed in successfully!&rdquo; stage plays, then the ORIGINAL Create Song action fires automatically &mdash; generation starts immediately.',
                    'limits': [
                        ('The guest never returns to the compose screen after signing in.',
                         'Signing in resumes the exact action that opened the modal &mdash; here, Create Song.'),
                        ('The insufficient-credit check (P5-S1) runs only after sign-in resumes the action, never while still signed out (AC-SONG-01b).',
                         'A guest is never shown the buy-credits upsell for an account they don&rsquo;t have yet.'),
                    ],
                },
            ],
        },
        {
            'id': 'p5-insufficient-credit', 'num': 5,
            'name': 'Insufficient credits',
            'desc': 'One independent screen &mdash; not a continuation of P4.',
            'entry': 'Signed-in user, balance below the generation cost', 'outcome': 'Buy-credits IAP opens instead of generating',
            'steps': [
                {
                    'shot': '14_insufficient_credit_iap.png', 'num': 1,
                    'user': 'A signed-in user with a balance below the generation cost taps Create Song (shown here: Instrumental on, raising the cost above the balance).',
                    'system': 'Generation does not start; the buy-credits IAP opens instead (GL-01).',
                    'exact': ['Title: &ldquo;Upgrade Your Plan&rdquo;', 'Footer: &ldquo;Demo only &mdash; no real payment&rdquo;'],
                    'limits': [
                        ('Insufficient credits opens the subscription plan picker for a non-subscriber, not a credit-pack purchase.',
                         'Credit packs are subscriber-only.'),
                        ('The balance/cost threshold that triggers this gate is not asserted here.',
                         'Exact numbers come from the Credit Consume MSR (References).'),
                    ],
                },
            ],
        },
        {
            'id': 'p6-my-creations-rail', 'num': 6,
            'name': 'Trending Songs vs My Creations',
            'desc': 'One independent screen &mdash; not a continuation of P4 or P5.',
            'entry': 'Signed-in user with &ge;1 completed song revisits /song/create', 'outcome': 'Side rail shows My Creations',
            'steps': [
                {
                    'shot': '15_my_creations_rail.png', 'num': 1,
                    'user': 'A signed-in user with at least one completed song revisits /song/create.',
                    'system': 'The side rail shows &ldquo;My Creations&rdquo; (their own finished songs) in place of &ldquo;Trending Songs&rdquo;.',
                    'exact': ['Section label: &ldquo;My Creations&rdquo;'],
                    'limits': [
                        'The swap needs BOTH conditions &mdash; signed in AND at least one completed song; either alone still shows Trending Songs.',
                        'My Creations drops the &ldquo;See all&rdquo; link that Trending Songs has; each row opens that song&rsquo;s own result page instead.',
                    ],
                },
            ],
        },
    ],

    # ── reference sections ───────────────────────────────────────────────────
    'states': [
        ('EMPTY (Simple)', 'Arrive /song/create, Simple tab', 'Describe empty, Create Song disabled', '&rarr; READY on non-empty Describe', 'On Create Song'),
        ('READY', 'Describe non-empty (Simple) or Custom tab (always)', 'Create Song enabled, shows live cost', '&rarr; GENERATING on Create Song tap', 'On Create Song'),
        ('GENERATING', '/song/creating after Create Song', 'Progress ring, step label, estimate, View Later', '&rarr; RESULT on done &middot; &rarr; FAILED on mock failure', 'On job outcome'),
        ('RESULT', '/song/result after a successful job', 'Player, transport, Like/Share/Download, Publish toggle, My Creations rail; Lyrics panel only when lyrics exist', '&rarr; GENERATING via Recreate &middot; &rarr; History via Back', 'On navigation away'),
        ('FAILED', '/song/creating after a mock failure', 'Generation Failed message, Retry, Back', '&rarr; GENERATING via Retry &middot; &rarr; EMPTY/READY via Back', 'On Retry or Back'),
        ('Side rail: Trending Songs', 'Default &mdash; signed out, or signed in with zero completed songs', 'TOP_PICKS_SONGS with a &ldquo;See all&rdquo; link (P6-S1)', '&rarr; My Creations once both conditions below are met', '&mdash;'),
        ('Side rail: My Creations', 'Signed in AND &ge;1 completed song', 'The user&rsquo;s own finished songs, no &ldquo;See all&rdquo; (P6-S1)', '&rarr; Trending Songs on sign-out (no completed songs is not reachable once one exists)', '&mdash;'),
    ],

    'errors': [
        (
            'Song generation fails',
            'Simple-mode description contains &ldquo;[fail]&rdquo; &mdash; the QA hook for a mid-generation failure',
            'Generation Failed &mdash; &ldquo;Something went wrong while generating. Your credits were not charged &mdash; you can retry now or adjust your input and try again.&rdquo;',
            'Retry re-runs the job from the same compose state; Back returns to /song/create.',
            'Yes, in full (AC-SONG-09) &mdash; the balance returns to its pre-charge value.',
        ),
        (
            'Signed-out user taps Create Song',
            'Any compose state, no active session (P4-S1)',
            'Sign-in modal opens over the compose screen; no credits upsell is shown',
            'Sign in (P4-S2) resumes the original action automatically; dismissing the modal leaves the draft intact with no navigation',
            'N/A &mdash; never charged, gated before generation starts',
        ),
        (
            'Balance below the generation cost',
            'Signed in, credits &lt; cost at Create Song &mdash; e.g. Instrumental raises the cost above the balance (P5-S1)',
            'Buy-credits IAP opens (a subscription picker for a non-subscriber) instead of starting generation',
            'Close the IAP and lower the cost (turn off Instrumental) or top up, then retry',
            'N/A &mdash; never charged, gated before generation starts',
        ),
    ],
    'errors_note': 'Production trigger for a real generation failure is undefined &mdash; the &ldquo;[fail]&rdquo; marker is a mock-only QA hook (TBD-SONG-06, specs/areas/03-song-creation.md &sect;8).',

    # Q-01 ("confirm the refund number in a production build") is CLOSED, not
    # dropped: the discrepancy it tracked was a real double-charge bug, fixed
    # 2026-08-25 (see D-07). Every credit figure in this spec's screenshots is
    # now a single charge, verified against the running app.

    'criteria': [
        ('AC-SONG-01', 'Simple defaults with Create Song disabled until Describe is non-empty; Custom is enabled by default.', ['P1-S1', 'P2-S1']),
        ('AC-SONG-02b', 'Idea/Lyrics sample fills never repeat the value already in the box; Idea stays available under Instrumental, Lyrics does not.', ['P1-S2', 'P2-S2']),
        ('AC-SONG-04', 'Create Song resets flow state and navigates to /song/creating.', ['P1-S3', 'P2-S3']),
        ('AC-SONG-05', 'While processing: progress, step, estimate, View Later; on done, navigate to /song/result.', ['P1-S4', 'P1-S5', 'P2-S4', 'P2-S5']),
        ('AC-SONG-06', '/song/result exposes drag-to-seek, transport, Share, Download, a Lyrics panel when lyrics exist, Publish, Use in Music Video, and Recreate; uncapped playback.', ['P1-S5', 'P2-S5']),
        ('AC-SONG-08', 'A failed job shows the shared error state with Back and Retry.', ['P3-E3']),
        ('AC-SONG-09', 'A song job charges its cost on start and refunds it on failure.', ['P1-S3', 'P3-E3']),
        ('AC-HIST-01', 'History shows live jobs prepended to the seed list under All.', ['P1-S6', 'P2-S6']),
        ('AC-HIST-03', 'A done row shows a Done status pill.', ['P1-S6', 'P2-S6']),
        ('AC-SONG-01b', 'Logged-out users see the full compose screen with no sign-in modal; the modal opens only on Create Song, and the insufficient-credit upsell never shows to a guest.', ['P4-S1', 'P4-S2']),
        ('GL-01', 'When credits are below the generation cost, the CTA routes to the buy-credits IAP instead of starting generation.', ['P5-S1']),
        ('SONG-P1-S0', 'The compose side rail shows Trending Songs by default, swapping to My Creations once the user is signed in with at least one completed song.', ['P6-S1']),
    ],

    'prototype_deltas': [
        (
            'Generation timing',
            'The mock always resolves in a few seconds of wall-clock time, regardless of the on-screen &ldquo;~1 minute&rdquo; estimate.',
            'Real generation duration is backend-determined; the on-screen estimate must reflect the actual expected wait or be removed.',
        ),
        (
            'Credit balance persistence',
            'The balance is in-memory and resets to its demo default on every full page load, so a reload restores spent credits.',
            'A real balance is server-held: it must survive a reload, and the charge must be atomic with the generation request rather than applied client-side before it.',
        ),
    ],

    'decisions': [
        ('D-01', 'What source replaces prd.md/plan.md for this repo?', 'specs/areas/03-song-creation.md and 05-history.md (the existing as-built specs) plus direct verification against the running app.'),
        ('D-02', 'Where does the Song Creation storyboard stop relative to History?', 'One closing step per happy path showing the new row in History; History&rsquo;s own filters/menu/publish/delete stay out of scope (05-history.md already covers them).'),
        ('D-03', 'Comments layer for this trial?', 'Disabled &mdash; no Firebase backend exists in this repo yet.'),
        ('D-04', 'Show the guest sign-in gate, after the trial initially started every path already logged in?', 'Reversed on review feedback (2026-08-24) &mdash; added as P4/P5/P6, each single-screen or a short 2-step flow rather than a full connected path like P1&ndash;P3.'),
        ('D-06', 'Extra P4 steps, or separate paths, for insufficient credits and the side-rail swap?', 'Split into P5 (insufficient credits) and P6 (side-rail swap) on review feedback (2026-08-24) &mdash; only P4&rsquo;s own two steps are a connected flow; P5 and P6 are independent screens, and numbering them as further P4 steps read as if they were part of the guest flow.'),
        ('D-07', 'The negative credit balance visible in the first round of screenshots &mdash; capture artifact, or defect?', 'A real defect, fixed 2026-08-25. The generation-start effect charged credits with no idempotency guard, so React Strict Mode&rsquo;s deliberate double-invoke billed every generation twice (a 10-credit balance went to &minus;2 for one 6-credit song, and a failed job refunded only half of what it took). Both generation screens now guard the effect with a ref. Re-verified against the running app: one generation deducts one charge, and a failure returns the balance to its pre-charge value. All screenshots were recaptured.'),
        ('D-05', 'Where do credit-cost numbers come from in this spec?', 'Nowhere &mdash; every RULES bullet that used to assert a number (6/12 credits) now points at the Credit Consume MSR instead (see References). Verbatim on-screen text like &ldquo;Create Song 6&rdquo; is unaffected, since that is a true fact about the current build regardless of what the MSR prices it at.'),
    ],

    'references': [
        ('Credit Consume MSR &mdash; generation cost numbers', '', 'TBD'),
        ('AI Song Ideas &amp; Lyrics preset content (T1)', 'src/lib/mv/songIdeas.ts', 'Product owner'),
    ],

    'data_contract': {
        'intro': 'Static content pools behind the Idea and Lyrics sample-fill buttons on /song/create (P1-S2, P2-S2). Not a runtime API payload &mdash; a TypeScript module RD ships as real content, not a fixture.',
        'schemas': [{
            'caption': 'T1 &middot; Preset prompt pools (`src/lib/mv/songIdeas.ts`)',
            'json': (
                '{\n'
                '  "SONG_IDEA_PROMPTS": [\n'
                '    "Dark R&B Rock, wandering through a foggy neon alley, slow tense pulse, eerie cinematic intensity",\n'
                '    "... 12 entries total"\n'
                '  ],\n'
                '  "LYRIC_PRESETS": [\n'
                '    "[intro]\\n\\n[verse]\\nFrost climbs the window pane\\n...",\n'
                '    "... 10 entries total, one in Japanese"\n'
                '  ]\n'
                '}'
            ),
            'fields': [
                ('SONG_IDEA_PROMPTS', 'string[12]', 'Style + scene + tempo + mood briefs. Fills Simple&rsquo;s Describe and Custom&rsquo;s Lyrics via the Idea button.'),
                ('LYRIC_PRESETS', 'string[10]', 'Complete lyric sheets with [intro]/[verse]/[chorus]/[bridge]/[outro] markers. Fills Custom&rsquo;s Lyrics via the Lyrics button (non-instrumental only). One entry is Japanese.'),
            ],
            'note': (
                'The product owner&rsquo;s own copy, transcribed verbatim from two CSVs (2026-08-24). '
                'Do not reword, mock, or fold into `ENHANCE_SAMPLES` &mdash; that array is a different '
                'feature&rsquo;s fixture. Selection is uniform-random over the pool minus only the value '
                'already shown (P1-S2, P2-S2) &mdash; not a no-repeats guarantee across a whole session.'
            ),
        }],
    },

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Entry["Sidebar &quot;AI Song&quot;"] --> Mode{Compose mode?}\n'
        '  Mode -->|Simple| Simple["Compose - Simple (Idea fill)"]\n'
        '  Mode -->|Custom| Custom["Compose - Custom (Lyrics fill)"]\n'
        '  Simple --> Create["Tap Create Song"]\n'
        '  Custom --> Create\n'
        '  Create --> Creating["/song/creating"]\n'
        '  Creating --> Outcome{Job outcome}\n'
        '  Outcome -->|done| Result["/song/result"]\n'
        '  Outcome -->|&quot;[fail]&quot; marker| Failed["Generation Failed"]\n'
        '  Result --> History["/history (Done row)"]\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    # lint_spec.py's directory scan only picks up .html/.js (this skill's
    # original prototypes were plain HTML/JS); this repo is TypeScript/React,
    # so every relevant file is listed individually rather than as a directory.
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'song', 'SongCompose.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'song', 'SongGenerationScreen.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'song', 'SongResultView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'history', 'HistoryView.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'songIdeas.ts'),
        os.path.join(WEB_APP, 'src', 'components', 'auth', 'SignInModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'SubscribeModal.tsx'),
    ],
    'strings_ignore': [
        # Composed at render time from live data, never a literal source string.
        'Create Song 6',            # label + live songCost(instrumental) number
        'Pop . Uplifting',          # {genre} &middot; {mood} template
        # lint_spec.py's plain() strips anything matching <[^>]+> as an HTML tag.
        # That heuristic is unsafe against TSX source: a stray unmatched '<' or
        # '>' from a comparison or a generic (e.g. useState<string>, `a < b`)
        # makes the regex swallow everything between it and the next '>', which
        # silently deletes real text instead of failing loudly. Confirmed against
        # SongCompose.tsx/SongGenerationScreen.tsx directly (both strings are
        # present verbatim) and independently against the live app during capture.
        'e.g. A bittersweet love song about leaving a city you called home, with a melancholic yet hopeful vibe...',
        'Write your lyrics here... Or leave blank - AI will generate them based on your chosen style and mood.',
        'Something went wrong while generating. Your credits were not charged - you can retry now or adjust your input and try again.',
        'Upgrade Your Plan',
        'Demo only - no real payment',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
