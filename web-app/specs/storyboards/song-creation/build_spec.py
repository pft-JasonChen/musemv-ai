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
capture.

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

Revised again 2026-08-25 after a QA-gap review of both compose screens end to
end: added Enhance, Clear, chip selection, Vocal toggle-off, the Supported
Languages popover, the Instrumental placeholder swap, and the 2500-char boundary
as new steps inside P1/P2 (they are sub-interactions of the same screen those
paths already walk through — not a separate path); and added P7, one new path
touring /song/result's remaining controls (Like, Share, Download, Volume, seek,
the Lyrics sheet modal, Publish, Recreate, Use in Music Video) from an
already-generated result, since none of those needs its own multi-step journey
either. Renumbered every P1/P2 step from the insertions; every cross-reference
below (criteria, the flow diagram, other steps) was updated to match — see D-11.

Two real app bugs turned up while capturing this round, handled differently on
the product owner's instruction:
  - Custom Lyrics' "Enhance" did nothing when tapped (EnhanceButton.tsx's
    DP-skinned branch never rendered the two-direction menu it was given, so the
    menu never showed and the enhance call never fired). FIXED in the app on
    2026-08-26 along with the product rules around it, so it is no longer a
    prototype limitation and carries no delta row: the chooser is reachable with
    Instrumental off (P2-S8), and with Instrumental on the same pill runs Refine
    Idea directly (P2-S6). The earlier capture named "enhance_menu" that showed
    no menu was photographing this defect; it has been recaptured.
  - Recreate always bounced back to /song/create instead of regenerating, from a
    state/navigation race in SongResultView.tsx (resetForRecreate() nulled
    songResult while the result screen's own self-guard effect was still
    mounted, and that guard's redirect won the race against the intended
    navigation). Unlike Enhance this was a complete feature simply broken by a
    timing bug, not a placeholder — fixed with a ref guard and verified live
    (D-09).
  - Prev/Next across My Creations can never show enabled in this mock, even with
    2 real completed songs: every generated song shares one fixture audio file
    (`SAMPLE_AUDIO` in mock.ts), so the result screen's own "exclude the current
    song" filter (matched by audioUrl) removes every other song too. Root cause
    is a shared mock fixture, not a logic bug — documented only (D-10).

lint_spec.py's STRINGS check (`prototype_src`) is only partly usable here: it
scans directories for .html/.js only (this skill's original prototypes were
plain HTML/JS), so every relevant file is listed individually below instead of
as a directory. Even as individual files, its `plain()` tag-stripper (regex
`<[^>]+>`) misfires against TSX source — a stray unmatched `<`/`>` from a
TypeScript generic or comparison swallows everything up to the next `>`,
silently deleting real text rather than failing loudly. Several genuine
on-screen strings are false-positive "misses" for exactly this reason (see
strings_ignore below) and were instead confirmed by grepping the named
component files directly.
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
    'author': 'Jason Chen', 'date': '2026-08-25', 'status': 'Draft',
    'version': 'v2',
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
        ['Scope', 'Simple compose, Custom compose, a generation-failure path, and the full set of /song/result controls (P7) &mdash; plus three independent single-screen scenarios: guest sign-in gate (P4), insufficient credits (P5), and the Trending/My Creations side-rail swap (P6).'],
        ['Out of scope', 'History&rsquo;s own behavior (filters, &ctdot; menu, publish, delete) &mdash; see specs/areas/05-history.md'],
        ['Source', 'specs/areas/03-song-creation.md, specs/areas/05-history.md, specs/00-overview.md, and the running app'],
    ],

    'short_nav': [
        'Simple compose (happy path)', 'Custom compose + Lyrics (happy path)', 'Generation failure',
        'Guest sign-in gate', 'Insufficient credits', 'Trending Songs vs My Creations',
        'Result screen — remaining controls',
    ],

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
                    'exact': [
                        'Enabled button: &ldquo;Create Song 6&rdquo;',
                        'Also visible once text exists: an &ldquo;Enhance&rdquo; pill and a Clear (&times;) button beside the character count.',
                    ],
                    'limits': [
                        ('Idea fills from a fixed content pool (T1), not an AI generation on tap.',
                         'A pool of 12 style+scene+tempo+mood briefs, the product owner&rsquo;s own copy.'),
                        ('Each tap excludes only the brief already shown, then picks uniformly from the rest.',
                         '11 of 12 briefs are eligible, so the same one can reappear later &mdash; just never twice in a row.'),
                        ('The Create Song cost shown is live and scales with Instrumental.',
                         'Exact amounts come from the Credit Consume MSR (References), not asserted here.'),
                        'Enhance and Clear both hide themselves while the field is empty (P1-S1) and appear the instant it has text.',
                    ],
                    'focus': [{'box': [22.01, 59.22, 3.61, 2.78], 'type': 'action', 'label': 'Idea'}],
                },
                {
                    'shot': '16_simple_enhance.png', 'num': 3,
                    'user': 'Taps Enhance.',
                    'system': 'AI Enhance rewrites Describe in place with a fuller version of the same idea.',
                    'exact': ['Busy label while working: &ldquo;Enhancing&hellip;&rdquo;'],
                    'limits': [
                        ('AI Enhance charges nothing, ever (AC-SONG-13).', 'Confirmed &mdash; the credit pill is unchanged after use.'),
                        'Simple&rsquo;s Enhance is single-shot: no menu, it rewrites the field directly.',
                    ],
                },
                {
                    'shot': '17_simple_char_limit.png', 'num': 4,
                    'user': 'Types or pastes text past the length limit.',
                    'system': 'Input stops accepting new characters at exactly 2500; the counter reads &ldquo;2500/2500&rdquo;.',
                    'exact': ['Counter at the cap: &ldquo;2500/2500&rdquo;'],
                    'limits': [
                        ('Typed/pasted input is capped at 2500 characters (AC-SONG-03).',
                         'Confirmed via a real browser fill/paste event, not a programmatic value assignment &mdash; those bypass the cap.'),
                    ],
                },
                {
                    'shot': '30_simple_create_song.png', 'num': 5,
                    'user': 'Taps Create Song.',
                    'system': 'Balance is charged the generation cost immediately; navigates to /song/creating.',
                    'limits': [
                        ('Charges on start and refunds on failure (AC-SONG-09).',
                         'Exact amounts come from the Credit Consume MSR (References), not asserted here.'),
                    ],
                    'focus': [{'box': [35.76, 66.44, 15.97, 5.11], 'type': 'action', 'label': 'Create Song'}],
                },
                {
                    'shot': '03_simple_creating.png', 'num': 6,
                    'user': 'Waits for generation to finish.',
                    'system': '/song/creating shows a progress ring, step label, and an estimate while the job runs.',
                    'exact': ['Estimate: &ldquo;This usually takes about a minute.&rdquo;', 'Link: &ldquo;View Later&rdquo; &rarr; /history.'],
                },
                {
                    'shot': '04_simple_result.png', 'num': 7,
                    'user': 'Generation finishes.',
                    'system': 'Navigates to /song/result &mdash; cover, title, genre &middot; mood line, seek/transport, Like/Share/Download, Publish toggle, and a My Creations rail.',
                    'exact': [
                        'Genre &middot; mood line format: &ldquo;Pop &middot; Uplifting&rdquo;',
                        'Empty-lyrics note: &ldquo;No lyrics available for this one yet&rdquo;',
                        'Publish state label: &ldquo;Off&rdquo;',
                    ],
                    'limits': [
                        'Simple mode never sets lyrics, so the result has only this fallback note, never a Lyrics panel.',
                        ('Previous/Next stay disabled until more than one song exists in My Creations.',
                         'See P7-S1 for why that never happens in this mock.'),
                    ],
                },
                {
                    'shot': '05_history_simple.png', 'num': 8,
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
                        'Section label: &ldquo;LYRICS / IDEA&rdquo; &mdash; the box takes either a finished lyric sheet or a style/scene brief, and has a fill button for each.',
                        'Placeholder: &ldquo;Write your lyrics here... Or leave blank &mdash; AI will generate them based on your chosen style and mood.&rdquo;',
                        'Chip groups: &ldquo;GENRE&rdquo;, &ldquo;MOOD&rdquo;, &ldquo;VOCAL (Optional)&rdquo;',
                        'Default selected chips: &ldquo;Pop&rdquo;, &ldquo;Uplifting&rdquo;',
                        'Field label: &ldquo;SONG TITLE (Optional)&rdquo;',
                    ],
                    'limits': ['Custom mode&rsquo;s Create Song is enabled by default (AC-SONG-01).'],
                    'focus': [{'box': [26.46, 11.11, 5.63, 3.78], 'type': 'action', 'label': 'Custom tab'}],
                },
                {
                    'shot': '18_custom_supported_languages.png', 'num': 2,
                    'user': 'Taps the &ldquo;i&rdquo; icon beside LYRICS / IDEA.',
                    'system': 'A popover lists the languages lyric generation supports.',
                    'exact': [
                        'Title: &ldquo;Supported Languages&rdquo;',
                        'Body: &ldquo;English, Japanese, German, Portuguese, Italian, French, Spanish, Turkish, Chinese, Korean, and Hindi&rdquo;',
                    ],
                    'limits': ['The popover only toggles on the icon&rsquo;s own click &mdash; it does not auto-close on an outside click.'],
                    'focus': [{'box': [24.79, 18.0, 1.25, 1.67], 'type': 'action', 'label': 'Supported languages'}],
                },
                {
                    'shot': '21_custom_instrumental_placeholder.png', 'num': 3,
                    'user': 'Toggles Instrumental on while Lyrics is still empty.',
                    'system': 'The placeholder swaps to instrumental-specific copy; Create Song&rsquo;s cost rises; the Lyrics sample-fill button hides (Idea stays).',
                    'exact': ['Placeholder, both lines: &ldquo;No lyrics needed - AI will create a pure instrumental track.&rdquo; / &ldquo;Describe the mood or vibe of your instrumental...&rdquo; (AC-SONG-02c).'],
                    'limits': [
                        'Lyrics is the ONLY control that hides under Instrumental; Idea stays visible either way (AC-SONG-02b).',
                        ('Enhance is absent here because the box is EMPTY, not because of the toggle.',
                         'EnhanceButton renders nothing while its field is blank, in either toggle state. With text present it stays visible under Instrumental &mdash; see P2-S5 and P2-S6.'),
                    ],
                },
                {
                    'shot': '07_custom_lyrics_filled.png', 'num': 4,
                    'user': 'Turns Instrumental back off, then taps the Lyrics sample-fill button.',
                    'system': 'The Lyrics box fills with a complete preset lyric sheet, marked with [intro]/[verse]/[chorus]/[bridge]/[outro].',
                    'exact': ['Sample-fill buttons: &ldquo;Idea&rdquo;, &ldquo;Lyrics&rdquo;'],
                    'limits': [
                        ('Lyrics fills from a fixed content pool (T1), not an AI generation on tap.',
                         '10 complete lyric sheets (one Japanese), the product owner&rsquo;s own copy.'),
                        ('Each tap excludes only the sheet already shown, then picks uniformly from the rest.',
                         '9 of 10 sheets are eligible, so the same one can reappear later &mdash; just never twice in a row (AC-SONG-02b).'),
                    ],
                    'focus': [{'box': [25.90, 32.78, 4.24, 2.78], 'type': 'action', 'label': 'Lyrics'}],
                },
                {
                    'shot': '22_custom_instrumental_keeps_lyrics.png', 'num': 5,
                    'user': 'Toggles Instrumental on again, now that Lyrics has text.',
                    'system': 'The typed text stays exactly as it was; the Lyrics sample-fill disappears, while Idea and Enhance both remain.',
                    'limits': [
                        ('Toggling Instrumental never edits the box, in either direction (AC-SONG-02).',
                         'A rule that CLEARED the box on toggle-on was in place for one day (2026-08-25) and was withdrawn on 2026-08-26 &mdash; the toggle is not a destructive control. Any older capture showing an emptied box is stale.'),
                        ('Lyrics is the only control that hides; Enhance stays and changes behaviour instead (P2-S6).',
                         'The field is still sent on generation even though no lyric sheet is expected, so a result can carry lyrics despite Instrumental being on (SONG-E4).'),
                    ],
                },
                {
                    'shot': '28_custom_instrumental_enhance.png', 'num': 6,
                    'user': 'Taps Enhance while Instrumental is still on.',
                    'system': 'No chooser appears &mdash; Refine Idea runs immediately and rewrites the box with a refined brief.',
                    'limits': [
                        ('Under Instrumental, Enhance is single-tap: it always means Refine Idea (AC-SONG-14).',
                         'Lyrics are not supported in this mode, so there is nothing to choose between. With Instrumental OFF the same pill asks first &mdash; see P2-S8 for that branch.'),
                        ('The pill disables itself and shows a spinning icon for the duration of the call.',
                         'That round-trip is the real `enhancePrompt` API call, not a local string edit.'),
                    ],
                },
                {
                    'shot': '19_custom_chips_selected.png', 'num': 7,
                    'user': 'Turns Instrumental back off, then selects Genre, Mood, and Vocal chips.',
                    'system': 'Each group highlights the tapped chip; Vocal is optional and clears if the selected chip is tapped again.',
                    'exact': ['Chips shown selected here: &ldquo;R&amp;B&rdquo;, &ldquo;Energetic&rdquo;, &ldquo;Male&rdquo;'],
                    'limits': [
                        'Genre and Mood always have exactly one selection; tapping another chip just moves it.',
                        'Vocal is the one optional group: tapping its selected chip again clears it back to none.',
                    ],
                },
                {
                    'shot': '20_custom_enhance_menu.png', 'num': 8,
                    'user': 'Turns Instrumental back off, then taps Enhance.',
                    'system': 'A chooser opens above the pill offering two directions; nothing is sent until one is picked.',
                    'exact': [
                        'Menu title: &ldquo;What would you like to enhance?&rdquo;',
                        'Choice 1: &ldquo;Refine Idea&rdquo; &mdash; &ldquo;Sharpen the mood, tone, and detail&rdquo;',
                        'Choice 2: &ldquo;Refine Lyrics&rdquo; &mdash; &ldquo;Polish wording, rhythm, and flow&rdquo;',
                    ],
                    'limits': [
                        ('The chooser exists only while Instrumental is OFF (AC-SONG-14).',
                         'With it OFF the box may hold either a lyric sheet or a brief, so the front end cannot know which the user meant. With it ON, lyrics are unsupported and the same pill runs Refine Idea directly &mdash; P2-S6.'),
                        ('Each direction is its own API call &mdash; RD owns both refine modes.',
                         'The front end only selects the `kind` (&ldquo;song&rdquo; vs &ldquo;lyrics&rdquo;); it does not define what &ldquo;refine&rdquo; means for either. QA should verify the returned text differs meaningfully between the two directions once RD&rsquo;s implementation lands.'),
                        ('&#127912; The menu has no design yet.',
                         'DP ships no enhance chooser, so this visual is WA-authored and provisional &mdash; DESIGNER-TODO A28, which also has to settle its behaviour at 375px.'),
                    ],
                },
                {
                    'shot': '31_custom_create_song.png', 'num': 9,
                    'user': 'Taps Create Song.',
                    'system': 'Balance is charged; navigates to /song/creating &mdash; the same progress screen as the Simple path (P1-S6).',
                    'focus': [{'box': [35.76, 84.67, 15.97, 5.11], 'type': 'action', 'label': 'Create Song'}],
                },
                {
                    'shot': '', 'num': 10,
                    'user': 'Waits for generation to finish.',
                    'system': 'Same /song/creating progress screen as the Simple path (P1-S6).',
                    'summary': 'Waits for generation to finish (same screen as P1-S6).',
                },
                {
                    'shot': '08_custom_result_lyrics.png', 'num': 11,
                    'user': 'Generation finishes.',
                    'system': 'Navigates to /song/result with the full lyric sheet shown alongside the player.',
                    'exact': ['Genre &middot; mood line format: &ldquo;Pop &middot; Uplifting&rdquo;'],
                    'limits': [
                        'Custom mode plus typed lyrics is what produces the Lyrics panel &mdash; Simple mode never does (P1-S7).',
                        'Section markers ([intro], [verse], [chorus], [bridge], [outro]) render as their own lines, same as typed.',
                    ],
                },
                {
                    'shot': '09_history_custom.png', 'num': 12,
                    'user': 'Opens History from the sidebar.',
                    'system': 'The new song appears at the top of the list with a Done status pill.',
                    'exact': ['Status pill: &ldquo;Done&rdquo;'],
                    'limits': ['Same list behavior as the Simple path (P1-S8).'],
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
                    'shot': '32_error_create_song.png', 'num': 2,
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
                        ('Recreate (P7-S5) is gated by the same balance check.',
                         'Confirmed live: a balance below cost opens this IAP instead of regenerating.'),
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
        {
            'id': 'p7-result-controls', 'num': 7,
            'name': 'Result screen &mdash; remaining controls',
            'desc': 'Seven independent single-screen scenarios on /song/result, starting from an already-generated result &mdash; not a continuation of P1/P2, and not a connected journey with each other.',
            'entry': 'Arrives at an already-generated /song/result (any path)', 'outcome': 'Varies per step',
            'steps': [
                {
                    'shot': '23_result_like_seek.png', 'num': 1,
                    'user': 'Taps Like, then drags the progress bar to a new position.',
                    'system': 'The heart fills solid; playback jumps to the dragged position; the inline Lyrics panel&rsquo;s highlighted line follows along.',
                    'limits': [
                        ('Like is local-only &mdash; no API call, no History write (TBD-EXP-08).', 'A user may like their own creation (resolved 2026-08-19).'),
                        ("The inline lyrics panel's highlighted line stays synced to the current playback position.",
                         'Confirmed at a scrubbed, non-zero position, not just during normal playback.'),
                        ('Previous/Next stay disabled here even though this account has 2 completed songs (D-10).',
                         'Every generated song shares one fixture audio file, so the player&rsquo;s own &ldquo;exclude the current song&rdquo; filter removes every other song too &mdash; this cannot show enabled in this mock regardless of how many songs exist.'),
                    ],
                },
                {
                    'shot': '24_result_share_dialog.png', 'num': 2,
                    'user': 'Taps Share.',
                    'system': 'A dialog opens with a copyable public link to this song.',
                    'exact': ['Title: &ldquo;Share&rdquo;', 'Body: Shareable public link to &ldquo;{title}&rdquo;', 'Button: &ldquo;Copy&rdquo;'],
                    'limits': [
                        'Download (desktop-only) saves fixture audio as &ldquo;{title}.mp3&rdquo; &mdash; not the row&rsquo;s own render (TBD-HIST-01, 🔒).',
                        ('Volume (desktop-only) is a real audio slider with its own Mute/Unmute toggle.',
                         'Neither opens a dialog, so neither needs its own screenshot here.'),
                    ],
                },
                {
                    'shot': '25_result_lyrics_sheet.png', 'num': 3,
                    'user': 'Taps the Lyrics icon.',
                    'system': 'A separate Lyrics sheet opens as its own overlay, with its own mini player.',
                    'exact': ['Title: &ldquo;Lyrics&rdquo;'],
                    'limits': [
                        ('This is a DIFFERENT surface from the always-visible inline lyrics panel (P2-S10).',
                         'Both exist at once on desktop; the icon only ever appears when the song has lyrics, same gate as the inline panel (AC-SONG-06).'),
                    ],
                },
                {
                    'shot': '26_result_publish_on.png', 'num': 4,
                    'user': 'Turns the Publish toggle on.',
                    'system': 'The song publishes immediately &mdash; no confirmation step (GL-02, unlike MV&rsquo;s Publish).',
                    'exact': ['Publish state label: &ldquo;On&rdquo;'],
                    'limits': [
                        ('The My Creations rail below carries its OWN separate Like/Share per row.',
                         'Visible in this same screenshot &mdash; easy to confuse with the main player&rsquo;s Like/Share above, but a fully independent pair of controls (`toggleRailLike`).'),
                    ],
                },
                {
                    'shot': '', 'num': 5,
                    'user': 'Taps Recreate.',
                    'system': 'Charges the standard cost, keeps the current song in History, and regenerates a new result at /song/creating (SONG-03).',
                    'summary': 'Taps Recreate (charges, keeps the prior song, regenerates).',
                    'limits': [
                        ('Recreate was completely broken before 2026-08-25 &mdash; always bounced to /song/create instead of regenerating (D-09).',
                         'Root cause: `resetForRecreate()` nulled `songResult` while this screen&rsquo;s own self-guard effect was still mounted, and that effect&rsquo;s redirect won the race against the intended navigation. Fixed with a ref guard in SongResultView.tsx; re-verified live after the fix.'),
                    ],
                },
                {
                    'shot': '29_result_from_history.png', 'num': 6,
                    'user': 'Opens a completed song from a /history row.',
                    'system': 'Lands on /song/result showing that row&rsquo;s song, with the row id carried in the URL as ?id= and a Back control on the stage.',
                    'limits': [
                        ('This is the cold-start path into the result screen (AC-SONG-11).',
                         'Flow state is seeded by `useOpenCreation` rather than by a generation, so the screen resolves the song from the id alone. That is also what makes Share build a link to THIS row rather than to whatever was last generated.'),
                        ('History&rsquo;s own row controls (filters, row menu, publish, delete) are out of scope here.',
                         'They belong to the History storyboard &mdash; this step covers only the hand-off INTO /song/result (D-02).'),
                    ],
                },
                {
                    'shot': '27_result_use_in_mv.png', 'num': 7,
                    'user': 'Taps Use in Music Video.',
                    'system': 'Navigates to /mv/room with this song pre-loaded into &ldquo;Choose a Song&rdquo;.',
                    'exact': ['Section label: &ldquo;CHOOSE A SONG (Required)&rdquo;', 'Preloaded source label: &ldquo;Song Library&rdquo;'],
                    'limits': [
                        ('The song&rsquo;s title, duration, and lyrics all carry over into MV compose (AC-SONG-07).',
                         'This screen does not display the carried-over lyrics, but they are present internally.'),
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
            'Signed in, credits &lt; cost at Create Song or Recreate &mdash; e.g. Instrumental raises the cost above the balance (P5-S1)',
            'Buy-credits IAP opens (a subscription picker for a non-subscriber) instead of starting generation',
            'Close the IAP and lower the cost (turn off Instrumental) or top up, then retry',
            'N/A &mdash; never charged, gated before generation starts',
        ),
        (
            'Reload mid-flow',
            'Reloading /song/creating or /song/result with no in-memory flow state (SONG-E2)',
            'Redirects immediately to /song/create &mdash; no error message, no distinct screen',
            'Compose again from /song/create; nothing to retry, since the job that would have generated the missing state existed only in memory',
            'N/A &mdash; a reload this deep never reaches a charge in the first place',
        ),
    ],
    'errors_note': (
        'Production trigger for a real generation failure is undefined &mdash; the &ldquo;[fail]&rdquo; marker is a '
        'mock-only QA hook (TBD-SONG-06, specs/areas/03-song-creation.md &sect;8). It also only checks Simple mode&rsquo;s '
        'Describe field, never Custom&rsquo;s Lyrics &mdash; a Custom-mode song cannot be failed through the UI at all today.'
    ),

    # Q-01 ("confirm the refund number in a production build") is CLOSED, not
    # dropped: the discrepancy it tracked was a real double-charge bug, fixed
    # 2026-08-25 (see D-07). Every credit figure in this spec's screenshots is
    # now a single charge, verified against the running app.

    'criteria': [
        # AC-SONG-10 (renders clean at 320/375/768/1024/1440/1920) is NOT covered
        # by this deck and is deliberately not listed as if it were: every capture
        # here is a single desktop viewport. Six-width rendering is gated by
        # e2e/visual-baseline.spec.ts, and AC-SONG-11b is superseded by plan S4.
        ('AC-SONG-01', 'Simple defaults with Create Song disabled until Describe is non-empty; Custom is enabled by default.', ['P1-S1', 'P2-S1']),
        ('AC-SONG-02', 'Toggling Instrumental never edits the box in either direction; only the Lyrics sample-fill hides while it is ON.', ['P2-S3', 'P2-S5']),
        ('AC-SONG-02c', 'While Instrumental is ON the box placeholder reads exactly the two specified lines.', ['P2-S3']),
        ('AC-SONG-02b', 'Idea/Lyrics sample fills never repeat the value already in the box; Idea stays available under Instrumental, Lyrics does not.', ['P1-S2', 'P2-S3', 'P2-S4']),
        ('AC-SONG-14', 'Custom Enhance opens the two-mode chooser while Instrumental is OFF, and runs Refine Idea directly with no chooser while it is ON; Simple never shows a chooser.', ['P1-S3', 'P2-S6', 'P2-S8']),
        ('AC-SONG-03', 'Typed/pasted Describe or Lyrics input is capped at 2500 characters.', ['P1-S4']),
        ('AC-SONG-04', 'Create Song resets flow state and navigates to /song/creating.', ['P1-S5', 'P2-S9']),
        ('AC-SONG-05', 'While processing: progress, step, estimate, View Later; on done, navigate to /song/result.', ['P1-S6', 'P1-S7', 'P2-S10', 'P2-S11']),
        ('AC-SONG-06', '/song/result exposes drag-to-seek, transport, Like, Share, Download, a Lyrics panel/sheet when lyrics exist, Publish, Use in Music Video, and Recreate; uncapped playback.', ['P1-S7', 'P2-S11', 'P7-S1', 'P7-S2', 'P7-S3', 'P7-S4', 'P7-S5']),
        ('AC-SONG-07', 'Use in Music Video pre-loads the song (including lyrics) into MV compose and navigates to /mv/room.', ['P7-S7']),
        ('AC-SONG-11', '/song/result reached from a History row shows that row&rsquo;s song, carries ?id= for Share, and exposes Back.', ['P7-S6']),
        ('AC-SONG-12', 'Recreate charges a full generation, keeps the prior song in History, and regenerates.', ['P7-S5']),
        ('AC-SONG-08', 'A failed job shows the shared error state with Back and Retry.', ['P3-E3']),
        ('AC-SONG-09', 'A song job charges its cost on start and refunds it on failure.', ['P1-S5', 'P3-E3']),
        ('AC-SONG-13', 'AI Enhance charges nothing, ever.', ['P1-S3']),
        ('AC-HIST-01', 'History shows live jobs prepended to the seed list under All.', ['P1-S8', 'P2-S12']),
        ('AC-HIST-03', 'A done row shows a Done status pill.', ['P1-S8', 'P2-S12']),
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
        (
            'Prev/Next across My Creations (D-10)',
            'Every generated song shares one fixture audio file (`SAMPLE_AUDIO` in mock.ts), so the result screen&rsquo;s own &ldquo;exclude the current song&rdquo; playlist filter (matched by audio URL) removes every OTHER song too. Confirmed live with 2 real completed songs in one session: transport stayed disabled.',
            'Real generations return distinct audio per song, so the same filter will correctly exclude only the current song and Prev/Next will enable normally once &ge;1 other song exists.',
        ),
    ],

    'decisions': [
        ('D-01', 'What source replaces prd.md/plan.md for this repo?', 'specs/areas/03-song-creation.md and 05-history.md (the existing as-built specs) plus direct verification against the running app.'),
        ('D-02', 'Where does the Song Creation storyboard stop relative to History?', 'One closing step per happy path showing the new row in History; History&rsquo;s own filters/menu/publish/delete stay out of scope (05-history.md already covers them).'),
        ('D-03', 'Comments layer for this trial?', 'Disabled &mdash; no Firebase backend exists in this repo yet.'),
        ('D-04', 'Show the guest sign-in gate, after the trial initially started every path already logged in?', 'Reversed on review feedback (2026-08-24) &mdash; added as P4/P5/P6, each single-screen or a short 2-step flow rather than a full connected path like P1&ndash;P3.'),
        ('D-05', 'Where do credit-cost numbers come from in this spec?', 'Nowhere &mdash; every RULES bullet that used to assert a number (6/12 credits) now points at the Credit Consume MSR instead (see References). Verbatim on-screen text like &ldquo;Create Song 6&rdquo; is unaffected, since that is a true fact about the current build regardless of what the MSR prices it at.'),
        ('D-06', 'Extra P4 steps, or separate paths, for insufficient credits and the side-rail swap?', 'Split into P5 (insufficient credits) and P6 (side-rail swap) on review feedback (2026-08-24) &mdash; only P4&rsquo;s own two steps are a connected flow; P5 and P6 are independent screens, and numbering them as further P4 steps read as if they were part of the guest flow.'),
        ('D-07', 'The negative credit balance visible in the first round of screenshots &mdash; capture artifact, or defect?', 'A real defect, fixed 2026-08-25. The generation-start effect charged credits with no idempotency guard, so React Strict Mode&rsquo;s deliberate double-invoke billed every generation twice (a 10-credit balance went to &minus;2 for one 6-credit song, and a failed job refunded only half of what it took). Both generation screens now guard the effect with a ref. Re-verified against the running app: one generation deducts one charge, and a failure returns the balance to its pre-charge value. All screenshots were recaptured.'),
        ('D-08', 'The Enhance direction chooser had no design &mdash; ship the placeholder popover, or build the real one?', 'Built the real one (2026-08-27). The first pass was a WA-authored anchored popover standing in for a design DP does not ship. The product owner supplied the intended UI, which matches the mobile app prototype&rsquo;s &ldquo;Enhance Direction Sheet&rdquo; (<code>muse-prototype-v2.html:5726</code>): a centred dialog with a gradient icon tile per direction. Both gradients and both icon names are copied from there verbatim into <code>src/styles/enhance-dialog.css</code>. This answers the first of DESIGNER-TODO A28&rsquo;s two questions (anchored popover vs centred dialog); the second &mdash; whether phones should get the prototype&rsquo;s bottom SHEET instead &mdash; is still open.'),
        ('D-09', 'Recreate always bounced to /song/create instead of regenerating &mdash; fix now or document?', 'Fixed (2026-08-25) &mdash; unlike Enhance, this was a complete feature broken by a state/navigation race in SongResultView.tsx, not a placeholder. Patched with a ref guard; re-verified live that Recreate now charges, keeps the prior song in History, and regenerates correctly.'),
        ('D-10', 'Prev/Next never shows enabled, even with 2 real completed songs &mdash; fix or document?', 'Documented only (2026-08-25) &mdash; root cause is a shared mock audio fixture (every song plays the same file), not a logic bug. A real fix needs additional distinct audio assets, which is content/asset work outside this spec&rsquo;s scope.'),
        ('D-11', 'How to fold ~20 newly-found QA gaps into P1/P2 without a separate "compose controls" path?', 'Inserted as new steps directly into P1/P2 (they are sub-interactions of the same screens those paths already walk through), and added one new path, P7, touring /song/result&rsquo;s remaining controls from an already-generated result. Every cross-reference (criteria, the flow diagram, cited step IDs) was updated for the resulting renumbering.'),
    ],

    'references': [
        ('Credit Consume MSR &mdash; generation cost numbers', '', 'TBD'),
        ('[YCM] AI Song Ideas &amp; Lyrics &mdash; source sheet for T1 (shipped as <code>src/lib/mv/songIdeas.ts</code>)', 'https://docs.google.com/spreadsheets/d/1768iG99Kdz7wFdP8maemE5zkeghxP4SKAazxkUOIKEQ/edit?gid=1249424592#gid=1249424592', 'Product owner'),
    ],

    'data_contract': {
        'intro': 'Static content pools behind the Idea and Lyrics sample-fill buttons on /song/create (P1-S2, P2-S4). Not a runtime API payload &mdash; a TypeScript module RD ships as real content, not a fixture.',
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
                'The product owner&rsquo;s own copy, transcribed verbatim from the two <a href="https://docs.google.com/spreadsheets/d/1768iG99Kdz7wFdP8maemE5zkeghxP4SKAazxkUOIKEQ/edit?gid=1249424592#gid=1249424592" target="_blank">[YCM] AI Song Ideas &amp; Lyrics</a> sheets (2026-08-24). '
                'Do not reword, mock, or fold into `ENHANCE_SAMPLES` &mdash; that array is a different '
                'feature&rsquo;s fixture. Selection is uniform-random over the pool minus only the value '
                'already shown (P1-S2, P2-S4) &mdash; not a no-repeats guarantee across a whole session.'
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
        '  Outcome -->|done| Result["/song/result (P7: remaining controls)"]\n'
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
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ShareDialog.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'LyricsSheet.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'MvRoom.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'EnhanceButton.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'mock.ts'),
    ],
    'strings_ignore': [
        # Composed at render time from live data, never a literal source string.
        'Create Song 6',            # label + live songCost(instrumental) number
        'Pop . Uplifting',          # {genre} &middot; {mood} template
        'Shareable public link to .',  # {title} interpolated into the ShareDialog body
        '2500/2500',                 # {s.describe.length}/{DESCRIPTION_MAX} — the value at the cap
        # lint_spec.py's own entity table maps &hellip; to three ASCII dots, but
        # EnhanceButton.tsx's source uses the real Unicode ellipsis character
        # (…) — confirmed correct by direct grep of the source, not a miss.
        'Enhancing...',
        # lint_spec.py's plain() strips anything matching <[^>]+> as an HTML tag.
        # That heuristic is unsafe against TSX source: a stray unmatched '<' or
        # '>' from a comparison or a generic (e.g. useState<string>, `a < b`)
        # makes the regex swallow everything between it and the next '>', which
        # silently deletes real text instead of failing loudly. Confirmed against
        # the named component files directly, and independently against the live
        # app during capture.
        'e.g. A bittersweet love song about leaving a city you called home, with a melancholic yet hopeful vibe...',
        'Write your lyrics here... Or leave blank - AI will generate them based on your chosen style and mood.',
        'Something went wrong while generating. Your credits were not charged - you can retry now or adjust your input and try again.',
        'Upgrade Your Plan',
        'Demo only - no real payment',
        'Describe the mood or vibe of your instrumental... No lyrics needed - AI will create a pure instrumental track.',
        'CHOOSE A SONG (Required)',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
