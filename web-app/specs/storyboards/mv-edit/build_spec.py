#!/usr/bin/env python3
"""yco-spec build script — AI Music Video Edit (S3) storyboard.

Screenshot source: **live app capture**, not a static prototype — same
convention as song-creation/mv-creation/history/shell-auth's build scripts.
Every screenshot in specs/screenshots/ was captured driving the real Next.js
dev server (`npm run dev -- -p 3215`, this worktree's own port) with
Playwright, signed in via the same `localStorage['muse_auth']` seed the e2e
specs use. Full-page shots (`capture_screenshots.py`'s `full_shot`), except
five `position: fixed`-sensitive states (the cover lightbox and every phone
shot) that use `viewport_shot` instead — see that script's own docstring for
why a full-page capture would misrepresent a fixed element there.

TWO VIEWPORTS — the SECOND D8 exception in this programme (`PLAN.md`, "S3
scope"). Desktop **1403&times;697** (this repo's established viewport; every
focus box is a percentage of the captured container, so it must not change)
PLUS four captures at phone **375&times;812**, scoped narrowly to the
full-screen `.mv-edit-mobile-scene` view (inline in `MvEditor.tsx:714`, not
its own file) and the general page's own top area below 768px. The rest of
the screen is desktop-only; D8 stands unchanged for every other queued spec.

Source of truth for every rule/copy string not directly re-verified against
the running app: `specs/areas/02-mv-creation.md` &sect;&sect;3&ndash;6 (MV-P5,
MV-E2, MV-E5, MV-E7, AC-MV-12/13/14/19/17b) and `specs/00-overview.md`. Every
quoted string below was independently re-confirmed against the live app's DOM
during capture (see the `_review/*.webp` thumbnails written alongside the
PNGs, and — for the one string whose rendering turned out to matter
byte-for-byte — a direct `textContent` read, described below).

&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;
READ THIS BEFORE THE `cfg` BELOW &mdash; THE AREA SPEC WAS WRONG ABOUT MERGE'S COST
&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;&#9552;

`specs/areas/02-mv-creation.md` said Merge MV charges `COST_RENDER` (200) and
that the old flat `COST_MERGE` (10) had been removed to avoid double-charging
with GL-01. Reading `src/lib/mv/types.ts` during capture found the opposite:
`COST_RENDER` does not exist anywhere in the codebase (it and
`COST_STORYBOARD`/`COST_REGEN` were removed 2026-08-19, per
`contract.surface.test.ts`'s own C8 comment, in favour of per-second/per-tier
pricing) and `COST_MERGE = 10` is very much alive — `MvFlowProvider.
startRender()` charges exactly that when `renderIntent === "merge"`. Confirmed
live twice: the Merge MV pill on screen reads "10" in every capture, and the
credit balance drops by exactly 10 across `21_merge_enabled.png` &rarr;
`23_creating_first_frame.png` (1480 &rarr; 1470). The Edit-MV scene Recreate
cost is similarly not the flat "20" the area spec named — it is
`recreateShotCost(kind, resolution, seconds)`, a per-shot rate (26 credits for
this capture's 9-second `sing`/`720p` scene). Both are corrected in place in
`specs/areas/02-mv-creation.md` under this program's D11 rule (&sect;3 Costs,
the MV-P5 docstring, MV-P5-S5, AC-MV-12, AC-MV-13, AC-MV-19, and the &sect;7 QA
checklist line) &mdash; this docstring is the short version. Per D2, this
spec's own RULES bullets still carry no numbers ("charges on start, refunds on
failure; cost per the Credit Consume MSR"); only the `exact` strings quote the
literal on-screen pill values, which is what this correction was needed to get
right.

A SECOND, unrelated app bug turned up in that same sentence: the live DOM read
`"Recreate (26credits) replaces a scene directly. Edits aren't saved &mdash;
Merge MV (10 credits) re-renders the video with your changes."` &mdash; note
"26credits" has NO space before "credits" while "10 credits" does, even though
`MvEditor.tsx`'s JSX source has an identical literal space in both places
(`{sceneCost} credits` / `{COST_MERGE} credits`). Reproduced with a direct
`page.locator(...).text_content()` read (ruling out a screenshot/font
rendering illusion) across two different scenes and cost values &mdash; always
missing before the DYNAMIC number, always present before the flat one. Filed
to the product owner as an app-bug finding (see this session's report); not
fixed here (no `src/` authority for this build). `exact` quotes the string
exactly as rendered, bug included, with a `strings_ignore` entry to match.

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory; this repo is TypeScript/React, so relevant files are listed
individually below, following S1/S4/S6's precedent.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/mv-edit
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'AI Music Video Edit',
    'breadcrumb': 'YouCam Muse Web &rarr; AI Music Video Edit',
    'author': 'Jason Chen', 'date': '2026-08-28', 'status': 'Draft',
    'version': 'v1',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        '<code>/mv/edit</code> &mdash; the post-generation editor for a music video: recreate the '
        'cover or any single scene in place, adjust the output settings (title/author/subtitle/'
        'watermark), and Merge to re-render. No Project mode and no Save; every edit is ephemeral '
        'until Merge, and lost if the user leaves first.'
    ),
    'background': (
        'The third spec in this repo&rsquo;s yco-spec storyboard programme (specs/storyboards/'
        'PLAN.md), covering area 02&rsquo;s MV-P5 journey. Split from mv-creation (S2, MV-P1&ndash;P4/P6) '
        'because the user re-enters here from the result screen and because charging changes from '
        'per-generation to four independently-priced micro-operations (D1).'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of every Edit MV behavior they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web &mdash; captured at 1403&times;697 (desktop) AND 375&times;812 (phone), the D8 exception (this programme&rsquo;s second)'],
        ['Audience', 'QA'],
        ['Scope', 'Both entries into /mv/edit (Result and History), Cover recreate, per-scene storyboard recreate (desktop + the phone full-screen scene view), output settings, Delete this Project, Merge MV and its insufficient-balance/reload edge cases.'],
        ['Out of scope', 'The destination screens Merge and Delete route to (/mv/creating is S2&rsquo;s; /history is S4&rsquo;s) &mdash; captured to their first frame and no further. Unpublish-before-edit (MV-E7) is named, not captured (S2&rsquo;s P8 / S4&rsquo;s P4 own it).'],
        ['Source', 'specs/areas/02-mv-creation.md (MV-P5, MV-E2, MV-E5, MV-E7, AC-MV-12/13/14/19/17b), specs/00-overview.md, and the running app'],
    ],

    'short_nav': [
        'Entry + screen tour', 'Cover', 'Scenes', 'Output settings & delete', 'Merge MV',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        {
            'id': 'p1-entry-tour', 'num': 1,
            'name': 'Entry + screen tour',
            'desc': 'Both ways into /mv/edit &mdash; a real generation&rsquo;s Edit MV, and History&rsquo;s Edit MV, which fabricates flow state &mdash; plus the header and section layout.',
            'entry': '/mv/result or /history (⋯ menu)', 'outcome': '/mv/edit renders with a real or fabricated storyboard',
            'steps': [
                {
                    'shot': '01_result_edit_entry.png', 'num': 1,
                    'user': 'On /mv/result, clicks &ldquo;Edit MV&rdquo; in Quick Actions.',
                    'system': 'Navigates to /mv/edit with the just-generated storyboard already in flow state.',
                    'limits': ['Only reachable while the MV is neither published nor in review &mdash; MV-E7, S2/S4&rsquo;s territory, not captured here.'],
                    'focus': [{'box': [72.2, 33.4, 10.8, 5.9], 'type': 'action', 'label': 'Edit MV'}],
                },
                {
                    'shot': '02_edit_header_tour.png', 'num': 2,
                    'user': 'Arrives on /mv/edit.',
                    'system': 'DetailNavbar alone: Back, the title, and the credit balance.',
                    'exact': ['Title: &ldquo;Edit Music Video&rdquo;'],
                    'limits': ['No Save button anywhere on this screen (MV-08) &mdash; every edit below is ephemeral until Merge.'],
                    'focus': [
                        {'box': [21.4, 1.6, 2.7, 3.0], 'type': 'info', 'label': 'Back'},
                        {'box': [80.1, 1.6, 6.9, 3.1], 'type': 'info', 'label': 'Credits'},
                    ],
                },
                {
                    'shot': '03_edit_layout_tour.png', 'num': 3,
                    'user': '&mdash;',
                    'system': 'Three sections render &mdash; STORYBOARD, COVER IMAGE, output settings &mdash; plus Delete this Project and a floating Merge MV footer.',
                    'limits': [
                        'STORYBOARD holds the clip strip, inline preview and scene editor (P3 below).',
                        'The output-settings rail holds four rows: MV TITLE, AUTHOR NAME, Show Subtitle, Show Watermark (P4 below).',
                        'No read-only type/song/ratio chips and no shot-count line (corrected 2026-08-20 against DP &mdash; DESIGNER-TODO A25).',
                        ('Output settings are inline rail sections, not a modal.', 'DP puts the title/author text inputs there; the two ON/OFF switches are WA&rsquo;s own addition (C2 contract fields, P4 below).'),
                    ],
                },
                {
                    'shot': '04_history_menu_editmv.png', 'num': 4,
                    'user': 'On /history, opens a done MV row&rsquo;s &ldquo;&#8942;&rdquo; menu and clicks &ldquo;Edit MV&rdquo;.',
                    'system': 'The rest of the menu (Unlike/Share/Publish/Download/Delete) is History&rsquo;s own territory &mdash; S4 owns it.',
                    'limits': ['The second, external entry point into this flow.'],
                    'focus': [{'box': [23.4, 48.4, 13.7, 5.6], 'type': 'action', 'label': 'Edit MV'}],
                },
                {
                    'shot': '05_edit_from_history.png', 'num': 5,
                    'user': '&mdash;',
                    'system': '/mv/edit renders with a FABRICATED storyboard: a synthetic song and a mock storyboard built from the row alone, not the MV&rsquo;s real prior generation.',
                    'exact': ['MV title field pre-filled with the row&rsquo;s own title: &ldquo;Cinematic Night&rdquo;'],
                    'limits': [
                        ('This is a prototype simplification, not a product rule.', 'See Prototype Simplifications below.'),
                        'Every other section (cover, scenes, settings) behaves identically to the real-entry path.',
                    ],
                },
            ],
        },
        {
            'id': 'p2-cover', 'num': 2,
            'name': 'Cover',
            'desc': 'Preview, expand-to-lightbox, and Recreate &mdash; overwrites the cover in place, no picker, no undo (AC-MV-12).',
            'entry': 'COVER IMAGE section', 'outcome': 'The cover image is replaced; the balance drops by the flat Recreate-cover cost',
            'steps': [
                {
                    'shot': '06_cover_section.png', 'num': 1,
                    'user': 'Views the COVER IMAGE section.',
                    'system': 'A large preview with Download/Expand actions, a Cover description textarea with Enhance, and a Recreate button.',
                    'exact': ['Section label: &ldquo;COVER IMAGE&rdquo;'],
                    'limits': [('Enhance replaces the cover description with an AI-rewritten version.', 'AC-MV-14 &mdash; same enhancePrompt round-trip as the scene editor (P3).')],
                    'focus': [{'box': [81.6, 33.6, 5.9, 1.9], 'type': 'action', 'label': 'Enhance'}],
                },
                {
                    'shot': '07_cover_lightbox.png', 'num': 2,
                    'user': 'Clicks Expand on the cover preview.',
                    'system': 'Opens a full-size lightbox overlay with a Close control; Escape also closes it.',
                    'limits': ['Download is available both in the lightbox and on the inline preview.'],
                    'focus': [{'box': [94.9, 2.9, 2.6, 5.2], 'type': 'action', 'label': 'Close'}],
                },
                {
                    'shot': '08_cover_recreate_click.png', 'num': 3,
                    'user': 'Closes the lightbox, then views Recreate on the cover.',
                    'system': 'Recreate is always enabled here (no dirty-gate, unlike the scene editor) and shows its flat cost.',
                    'exact': ['Recreate cost pill: &ldquo;4&rdquo;'],
                    'focus': [{'box': [78.8, 36.8, 9.3, 3.1], 'type': 'action', 'label': 'Recreate'}],
                },
                {
                    'shot': '09_cover_recreated.png', 'num': 4,
                    'user': 'Clicks Recreate.',
                    'system': 'The cover image is OVERWRITTEN directly; the credit balance drops by 4 (1510 &rarr; 1506 in this capture).',
                    'limits': [
                        ('No &ldquo;pick which cover&rdquo; tray, no undo.', 'AC-MV-12 &mdash; the previous cover is gone, not archived.'),
                        'Merge becomes enabled by this edit alone (storyboardDirty / a pending regen).',
                    ],
                },
            ],
        },
        {
            'id': 'p3-scenes', 'num': 3,
            'name': 'Scenes',
            'desc': 'The clip strip, the inline preview transport, the scene prompt (2500 max) + Enhance, the scene-version history row, and Recreate &mdash; overwrites that scene in place, no take tray, no undo (AC-MV-12). Below 768px the inline pair is replaced by a full-screen view (D8 exception).',
            'entry': 'STORYBOARD section (desktop) / a clip tap (phone)', 'outcome': 'The active scene&rsquo;s video is replaced; the balance drops by that shot&rsquo;s dynamic cost',
            'steps': [
                {
                    'shot': '10_scene_clip_strip.png', 'num': 1,
                    'user': 'Views the per-clip storyboard strip.',
                    'system': 'One thumbnail per scene; the active clip is bordered, and its video plays in the inline preview below with its own transport (play/seek/mute/fullscreen).',
                    'limits': ['Clicking a different clip switches BOTH the preview and the scene editor below it to that scene.'],
                    'focus': [{'box': [21.4, 12.2, 6.0, 6.6], 'type': 'action', 'label': 'Scene 1'}],
                },
                {
                    'shot': '11_scene_editor_enhance.png', 'num': 2,
                    'user': 'Views the scene editor for the active clip.',
                    'system': 'A prompt textarea (max 2500) with Enhance, a character counter, and a scene-version history row.',
                    'exact': ['Scene header: &ldquo;SCENE 1&rdquo; &middot; its time range &ldquo;00:00&ndash;00:09&rdquo;'],
                    'limits': [('Recreate starts DISABLED on this scene.', 'It only enables once the prompt text actually changes since this scene was selected (2026-08-11 designer request) &mdash; recreating an untouched scene would spend credits on a random result driven by nothing new.')],
                    'focus': [{'box': [56.2, 62.2, 5.9, 1.9], 'type': 'action', 'label': 'Enhance'}],
                },
                {
                    'shot': '12_scene_recreate_enabled.png', 'num': 3,
                    'user': 'Edits the scene prompt text.',
                    'system': 'Recreate becomes enabled and shows this shot&rsquo;s dynamic cost.',
                    'exact': ['Recreate cost pill in this capture: &ldquo;26&rdquo; (a 9-second &ldquo;sing&rdquo;/Standard shot)'],
                    'limits': [('The cost is per-shot, not a flat number.', 'It depends on shot kind (sing/story), resolution and the scene&rsquo;s own duration &mdash; not the MV&rsquo;s overall type or length.')],
                    'focus': [{'box': [51.2, 37.0, 16.4, 3.6], 'type': 'action', 'label': 'Recreate'}],
                },
                {
                    'shot': '13_scene_recreated_version.png', 'num': 4,
                    'user': 'Clicks Recreate.',
                    'system': 'The scene&rsquo;s video is OVERWRITTEN directly and a thumbnail is added to the scene-version history row.',
                    'exact': [
                        'Sublabel below the editor: &ldquo;Recreate (26credits) replaces a scene directly. Edits aren&rsquo;t saved &mdash; Merge MV (10 credits) re-renders the video with your changes.&rdquo;',
                    ],
                    'limits': [
                        ('No &ldquo;pick which take&rdquo; tray, no undo.', 'AC-MV-12 &mdash; same rule as the cover, per-scene.'),
                        'The scene-version row is a record of past generations, not a picker.',
                        ('The sublabel above is quoted verbatim, rendering bug included.', 'No space before &ldquo;credits&rdquo; after the dynamic number, unlike Merge&rsquo;s flat one &mdash; a live app bug, not a spec typo (D-02).'),
                    ],
                    'focus': [{'box': [22.6, 37.0, 28.0, 3.6], 'type': 'info', 'label': 'Generated scene history'}],
                },
                {
                    'shot': '14_mobile_top_a16.png', 'num': 5,
                    'user': 'On a 375px phone, views the top of /mv/edit (before opening a scene).',
                    'system': 'The Recreate/Merge sublabel sentence and the floating Merge MV bar both render ABOVE the STORYBOARD section, not below it.',
                    'limits': [('This is a known layout defect, not a new one.', 'DESIGNER-TODO A16 &mdash; `.mv-edit__panel`/`.mv-edit__side` switch to `display: contents` below 767px and give every section an explicit order, but the sublabel and `FloatingCTA`&rsquo;s spacer carry none, so both default to `order: 0` and sort first. Documented, not fixed (no `src/` authority this build).')],
                },
                {
                    'shot': '15_mobile_scene_editor.png', 'num': 6,
                    'user': 'Taps a clip in the storyboard strip.',
                    'system': 'A full-screen `.mv-edit-mobile-scene` view opens with its own Back control &mdash; the inline preview + scene editor pair has no room on a phone frame.',
                    'exact': ['Header: &ldquo;SCENE 1&rdquo;'],
                    'focus': [{'box': [4.3, 2.0, 8.5, 3.9], 'type': 'action', 'label': 'Back'}],
                },
                {
                    'shot': '16_mobile_scene_recreate.png', 'num': 7,
                    'user': 'Edits the scene prompt inside the full-screen view.',
                    'system': 'Recreate enables here exactly as it does on desktop &mdash; same dirty-gate, same dynamic cost.',
                    'focus': [{'box': [50.3, 89.7, 36.9, 5.7], 'type': 'action', 'label': 'Recreate'}],
                },
                {
                    'shot': '17_mobile_scene_back.png', 'num': 8,
                    'user': 'Taps Back.',
                    'system': 'Returns to the general /mv/edit page &mdash; the same A16 layout (sublabel + Merge bar above STORYBOARD) is still visible.',
                    'limits': ['The scene edit made inside the full-screen view persists (same in-memory storyboard as desktop).'],
                },
            ],
        },
        {
            'id': 'p4-settings-delete', 'num': 4,
            'name': 'Output settings & delete',
            'desc': 'MV title/Author toggles+inputs, Show Subtitle, Show Watermark &mdash; inline rail sections, not a modal &mdash; and Delete this Project.',
            'entry': 'Right rail (desktop) / below the scene editor (phone)', 'outcome': 'A settings change marks the flow dirty; Delete discards the in-memory flow and leaves',
            'steps': [
                {
                    'shot': '18_settings_rail.png', 'num': 1,
                    'user': 'Views and toggles &ldquo;Show Watermark&rdquo;.',
                    'system': 'Four ON/OFF switch rows; MV TITLE and AUTHOR NAME each pair theirs with a text input, disabled while off.',
                    'limits': [
                        ('The two switches are contract fields, not decoration.', '`settings.title.on` / `settings.author.on` (`MvSettingsSchema`, C2) decide whether the caption is burned into the rendered video at all &mdash; DP ships only the text inputs.'),
                        'Any change here marks the flow dirty, enabling Merge.',
                    ],
                    'focus': [
                        {'box': [92.1, 15.6, 2.6, 1.6], 'type': 'action', 'label': 'Show MV title'},
                        {'box': [92.1, 46.9, 2.6, 1.6], 'type': 'info', 'label': 'Show Watermark'},
                    ],
                },
                {
                    'shot': '19_delete_confirm.png', 'num': 2,
                    'user': 'Clicks &ldquo;Delete this Project&rdquo;.',
                    'system': 'A confirm dialog opens, reusing History&rsquo;s own delete wording.',
                    'exact': ['Title: &ldquo;Delete&rdquo;', 'Body: &ldquo;Are you sure you want to delete this project? This action cannot be undone.&rdquo;', 'Buttons: &ldquo;Cancel&rdquo;, &ldquo;Delete&rdquo;'],
                    'focus': [{'box': [49.8, 55.8, 11.8, 6.6], 'type': 'action', 'label': 'Delete'}],
                },
                {
                    'shot': '20_delete_done_history.png', 'num': 3,
                    'user': 'Confirms Delete.',
                    'system': 'Discards the in-memory flow and lands on /history &mdash; it does NOT call a backend delete.',
                    'limits': [('The History row this flow was seeded from is unaffected.', 'Confirmed live: the same row is still present afterward. &ldquo;Delete&rdquo; here means discarding an uncommitted edit, not removing a creation &mdash; there is nothing server-side to remove yet.')],
                },
            ],
        },
        {
            'id': 'p5-merge', 'num': 5,
            'name': 'Merge MV',
            'desc': 'Re-renders from the current (overwritten) cover/scenes + settings, enabled by ANY pending edit; insufficient balance routes to the buy-credits IAP instead; plus the two edge cases &mdash; leaving loses every edit, and a reload with no flow state redirects Home.',
            'entry': 'Floating Merge MV footer', 'outcome': '/mv/creating (sufficient balance) or the buy-credits IAP (insufficient)',
            'steps': [
                {
                    'shot': '21_merge_enabled.png', 'num': 1,
                    'user': 'Views Merge MV after the cover/scene recreates and the Watermark toggle above.',
                    'system': 'Merge is enabled &mdash; ANY pending edit is enough, individually or combined.',
                    'exact': ['Merge cost pill: &ldquo;10&rdquo;'],
                    'limits': [('Enabled by text edits too.', '`storyboardDirty` (an edited scene/cover prompt with no regenerate yet) also counts, same as a regenerate or a settings change.')],
                    'focus': [{'box': [36.9, 46.4, 16.4, 3.6], 'type': 'action', 'label': 'Merge MV'}],
                },
                {
                    'shot': '22_merge_insufficient_credits.png', 'num': 2,
                    'user': 'On a separate account with only default credits, after one cover Recreate, clicks Merge MV.',
                    'system': 'Opens the buy-credits IAP instead of navigating.',
                    'exact': ['Dialog title: &ldquo;Upgrade Your Plan&rdquo;'],
                    'limits': [('This is the SAME dialog a non-subscriber&rsquo;s credit pill opens elsewhere in the app.', 'BuyCreditsModal falls back to SubscribeModal for a non-subscriber (CR-06, confirmed cross-spec in shell-auth D-04) &mdash; there is no separate Buy Credits pack list to reach here either.')],
                },
                {
                    'shot': '23_creating_first_frame.png', 'num': 3,
                    'user': 'With sufficient balance, clicks Merge MV.',
                    'system': 'Navigates to /mv/creating; the balance drops by exactly the Merge cost (1480 &rarr; 1470 in this capture).',
                    'limits': [('This route&rsquo;s own progress/result screens are S2&rsquo;s territory.', 'Captured to its first frame only &mdash; not toured further here.')],
                },
                {
                    'shot': '24_mve2_reload_redirect.png', 'num': 4,
                    'user': 'Reloads (or deep-links) /mv/edit with no in-memory flow state.',
                    'system': 'After a brief tolerant wait for localStorage to hydrate, redirects to /mv/room (MV-E2).',
                    'limits': [('The same 400ms tolerant wait `/mv/storyboard` uses.', 'Long enough for a real storyboard to hydrate, short enough not to stall a cold visit.')],
                },
            ],
        },
    ],

    # ── reference sections ───────────────────────────────────────────────────
    'data_contract': {
        'intro': 'The two output-settings switches this screen adds are real `MvSettingsSchema` fields (C2), not UI-only decoration &mdash; they gate whether the paired text is burned into the rendered video.',
        'tables': [
            {
                'caption': 'T1 &middot; MvSettings fields Edit MV writes',
                'cols': ['Key', 'Type', 'Edit MV control', 'Effect when off', 'Effect when on'],
                'rows': [
                    ['settings.title.on', 'boolean', 'MV TITLE switch', 'No title burned into the render', 'Burns settings.title.text into the render'],
                    ['settings.title.text', 'string', 'MV TITLE input', 'Disabled, greyed', 'The title text, editable'],
                    ['settings.author.on', 'boolean', 'AUTHOR NAME switch', 'No author burned into the render', 'Burns settings.author.text into the render'],
                    ['settings.author.text', 'string', 'AUTHOR NAME input', 'Disabled, greyed', 'The author text, editable'],
                    ['settings.showSubtitle', 'boolean', 'Show Subtitle switch', 'No subtitle track', 'Subtitle burned in'],
                    ['settings.watermark', 'boolean', 'Show Watermark switch', 'No watermark', 'Watermark burned in'],
                ],
            },
        ],
        'reverse': [
            ('MV TITLE switch + input', 'settings.title.{on,text}'),
            ('AUTHOR NAME switch + input', 'settings.author.{on,text}'),
            ('Show Subtitle switch', 'settings.showSubtitle'),
            ('Show Watermark switch', 'settings.watermark'),
        ],
    },

    'states': [
        ('Merge MV button', 'Any pending edit exists &mdash; a regenerated scene/cover, a settings toggle, or an edited scene/cover prompt (storyboardDirty)', 'Enabled; cost pill reads &ldquo;10&rdquo;', '&rarr; /mv/creating (sufficient balance) or &ldquo;Upgrade Your Plan&rdquo; (insufficient) &mdash; AC-MV-13', 'Leaving the page with no Merge discards every edit (MV-E5)'),
        ('Merge MV button', 'No pending edit', 'Disabled (grey)', 'N/A', 'N/A'),
        ('Scene Recreate button', 'The active scene&rsquo;s prompt is unedited since it was selected', 'Disabled (grey)', 'Enables once the prompt text changes', 'Resets to disabled on switching to a different clip'),
        ('Scene Recreate button', 'The active scene&rsquo;s prompt has been edited', 'Enabled; a per-shot dynamic cost pill (e.g. &ldquo;26&rdquo;)', '&rarr; overwrites that scene&rsquo;s video in place, adds a version thumbnail &mdash; AC-MV-12', 'No undo; MV-08'),
        ('Cover Recreate button', 'Always &mdash; no dirty-gate', 'Enabled; flat cost pill &ldquo;4&rdquo;', '&rarr; overwrites the cover in place &mdash; AC-MV-12', 'No undo'),
    ],

    'errors': [
        (
            'Edits lost on leaving the page',
            'Navigate away (Back, sidebar link, browser back/reload) without tapping Merge MV',
            'No warning &mdash; the screen simply unmounts',
            'None; every regenerate, recreate and settings/text edit is ephemeral (MV-E5) &mdash; redo from scratch on return',
            'P2-S4 / P3-S4',
        ),
        (
            'Reload / deep-link with no flow state',
            'Full reload or a direct /mv/edit visit with no in-memory storyboard',
            'A brief tolerant wait for localStorage hydrate, then a silent redirect &mdash; no error toast',
            'Return via Result&rsquo;s or History&rsquo;s own Edit MV entry (MV-E2)',
            'P5-S4',
        ),
        (
            'Insufficient balance at Merge',
            'credits &lt; the Merge cost when Merge MV is tapped',
            'Opens &ldquo;Upgrade Your Plan&rdquo; instead of navigating',
            'Buy credits or subscribe, then retry Merge',
            'P5-S2',
        ),
        (
            'Attempt to Edit a published MV',
            'Tap Edit MV on a published/in-review row, from Result or History',
            'N/A here &mdash; the button itself reads &ldquo;Unpublish to edit&rdquo; and never opens this screen until unpublished',
            'Unpublish first, then Edit MV opens normally (MV-E7)',
            'Owned by S2&rsquo;s P8 / S4&rsquo;s P4 &mdash; not captured in this spec',
        ),
    ],
    'errors_last_col': 'Where',
    'errors_note': (
        'The first two are timing/silent conditions a static screenshot cannot fully depict &mdash; the '
        '&ldquo;Where&rdquo; column names the nearest captured step or the sibling spec that owns the boundary.'
    ),

    'open_questions': [
        ('Q-01', 'What does &ldquo;cost per the Credit Consume MSR&rdquo; resolve to for Merge/Recreate?', 'Quoting a concrete number in this spec&rsquo;s own RULES text (D2) &mdash; every spec in this programme carries this same row', 'Product / RD (the MSR document link is still TBD)'),
    ],

    'criteria': [
        ('AC-MV-12', 'WHEN Regenerate scene or Recreate cover is invoked, THE SYSTEM SHALL overwrite that scene/cover in place (no picker, no undo) and decrement the balance.', ['P2-S3', 'P2-S4', 'P3-S3', 'P3-S4']),
        ('AC-MV-13', 'WHEN Merge MV is invoked with sufficient balance, THE SYSTEM SHALL re-render from the current cover/scenes + edited text and charge on start (refunded on failure); WHEN insufficient, open the buy-credits IAP.', ['P5-S1', 'P5-S2', 'P5-S3']),
        ('AC-MV-14', 'WHEN Enhance is invoked on a scene prompt or the cover description, THE SYSTEM SHALL replace that field with the enhancePrompt result.', ['P2-S1', 'P3-S2']),
        ('AC-MV-19', 'WHEN render generation starts, THE SYSTEM SHALL charge the matching cost and refund on failure; WHEN the balance is insufficient at the CTA, route to the buy-credits IAP.', ['P5-S1', 'P5-S2', 'P5-S3']),
        ('AC-MV-17b', 'THE SYSTEM SHALL render /mv/edit at 320/375/768/1024/1440/1920px with no overflow.', [], 'Visual-only; the six-tier sweep is e2e/visual-baseline.spec.ts&rsquo;s job. This spec&rsquo;s own D8 exception captures only 1403&times;697 desktop and 375&times;812 phone (the full-screen mobile scene view), not the other four tiers.'),
    ],

    'prototype_deltas': [
        (
            'History&rsquo;s Edit MV fabricates flow state',
            'Instead of loading the MV&rsquo;s real prior generation, it builds a mock storyboard and a synthetic song (durationSec 145) from the row&rsquo;s own title and thumbnail alone, and pre-fills the MV title field with that same title.',
            'Production must load the actual persisted storyboard/song for that MV so Edit MV works on the real prior generation, not a placeholder rebuilt from a list-row summary.',
        ),
        (
            'Delete this Project calls no backend delete',
            'It discards only the in-memory flow and navigates to /history &mdash; the underlying creation, if any, is untouched.',
            'Once projects persist server-side, this needs a real delete/discard endpoint, and a decision on what discarding an unmerged edit should do to server state.',
        ),
    ],

    'decisions': [
        ('D-01', 'The area spec said Merge charges `COST_RENDER` (200) and that the flat `COST_MERGE` (10) had been removed &mdash; which does the running code actually do?', 'Neither claim held: `COST_RENDER` does not exist anywhere in `src/lib/mv/types.ts` (removed 2026-08-19 along with `COST_STORYBOARD`/`COST_REGEN`), and `COST_MERGE = 10` was never removed &mdash; confirmed live (the Merge pill reads &ldquo;10&rdquo;; the balance drops by exactly 10 across P5-S1&rarr;P5-S3). The scene Recreate cost is similarly not a flat 20 &mdash; it is `recreateShotCost`, a per-shot rate (26 in this capture). `specs/areas/02-mv-creation.md` is corrected in place (&sect;3 Costs, the MV-P5 docstring, its Merge-MV bullet, AC-MV-12/13/19, &sect;7) under this programme&rsquo;s D11 rule.'),
        ('D-02', 'The Recreate/Merge sublabel sentence reads &ldquo;(26credits)&rdquo; with no space before a DYNAMIC number but &ldquo;(10 credits)&rdquo; with one before Merge&rsquo;s flat number, even though the JSX source has an identical literal space in both places &mdash; typo in this spec, or a real app bug?', 'A real, reproducible app bug &mdash; confirmed via a direct DOM `textContent` read (not a screenshot/font artifact) across two different scenes and cost values, always missing before the dynamic number. Quoted verbatim in `exact` (P3-S4) rather than silently corrected, with a `strings_ignore` entry; filed to the product owner in this session&rsquo;s report (no `src/` authority for this build).'),
        ('D-03', 'The mobile top-of-page capture (`14_mobile_top_a16`) shows the Recreate/Merge sublabel and the floating Merge bar sorted ABOVE the STORYBOARD section &mdash; new finding, or already known?', 'Already known &mdash; `DESIGNER-TODO` A16, the same `display: contents`-with-no-`order` defect as `/mv/storyboard`&rsquo;s FloatingCTA spacer. Captured (P3-S5, P3-S8) as the evidence this screen was scoped to produce (`PLAN.md`, S3 scope note 1); not fixed here.'),
        ('D-04', '&ldquo;Unpublish to edit&rdquo; (MV-E7) blocks Edit MV on a published MV &mdash; does this spec walk that boundary?', 'No &mdash; it is asserted on `/mv/result` (S2&rsquo;s P8) and in History&rsquo;s menu (S4&rsquo;s P4). This spec names the precondition in the Error States table and captures nothing, the same neighbour-boundary convention shell-auth used for territory it does not own.'),
        ('D-05', 'Which History row demonstrates the fabricated Edit MV entry (P1-S4/S5)?', '&ldquo;Cinematic Night&rdquo;, a done-MV seed row with 0 plays/likes/shares &mdash; picked because it is a plain, never-engaged-with fixture, not because of anything about its content.'),
        ('D-06', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo yet, same as S1/S4/S6.'),
        ('D-07', 'Phone viewport and scope for the D8 exception?', '375&times;812, scoped to the full-screen `.mv-edit-mobile-scene` view plus one general-page top-of-screen shot (for A16) &mdash; not a full phone re-walk of every path. Documented in `capture_screenshots.py`&rsquo;s docstring so a later re-capture does not drift.'),
    ],

    'references': [],

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Entry["/mv/result Edit MV (real) OR History Edit MV (fabricated)"] --> Tour["Header + three sections"]\n'
        '  Tour --> Cover{Recreate cover?}\n'
        '  Cover -->|yes, flat 4| CoverDone["Cover overwritten, no undo"]\n'
        '  Tour --> Scene{Edit + Recreate a scene?}\n'
        '  Scene -->|yes, per-shot cost| SceneDone["Scene video overwritten, version row grows"]\n'
        '  Tour --> Settings{Toggle a setting?}\n'
        '  Settings -->|yes| SettingsDirty["Marked dirty"]\n'
        '  CoverDone --> Dirty{Any pending edit?}\n'
        '  SceneDone --> Dirty\n'
        '  SettingsDirty --> Dirty\n'
        '  Dirty -->|no| MergeOff["Merge MV disabled"]\n'
        '  Dirty -->|yes, sufficient balance| MergeOn["Merge MV -> /mv/creating (S2 territory)"]\n'
        '  Dirty -->|yes, insufficient balance| Iap["Upgrade Your Plan (buy-credits IAP)"]\n'
        '  Tour --> Delete{Delete this Project?}\n'
        '  Delete -->|confirm| DeleteDone["Discards in-memory flow -> /history (no backend delete)"]\n'
        '  Entry -.->|reload, no flow state| MvE2["router.replace(/mv/room) (MV-E2)"]\n'
        '  Tour -.->|leave with no Merge| MvE5["Every edit lost (MV-E5)"]\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'MvEditor.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'mv', 'MvResult.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'DetailNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'EnhanceButton.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ToggleSwitch.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'FloatingCTA.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'Modal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'Button.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'BuyCreditsModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'SubscribeModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'history', 'useOpenCreation.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'types.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'mv', 'mock.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'api', 'schemas.ts'),
        os.path.join(WEB_APP, 'src', 'components', 'providers', 'MvFlowProvider.tsx'),
    ],
    'strings_ignore': [
        # This sentence is quoted VERBATIM including a live, reproducible app bug
        # (a missing space before "credits" after the DYNAMIC cost number, present
        # after the flat one) — the source has an identical literal space in both
        # spots, so the rendered string can never byte-match the JSX. Confirmed via
        # a direct DOM textContent read across two different scenes/costs, not a
        # screenshot artifact. See decision D-02.
        'Recreate (26credits) replaces a scene directly. Edits aren&rsquo;t saved &mdash; Merge MV (10 credits) re-renders the video with your changes.',
        # `MvEditor.tsx` passes this as a JSX prop value —
        # `<DetailNavbar title="Edit Music Video" .../>` — not as rendered JSX text.
        # lint_spec.py's `plain()` strips anything that looks like an HTML/JSX tag,
        # attributes included, so the string is invisible to the STRINGS scan even
        # though it is right there in the source. Confirmed live on screen (02).
        'Edit Music Video',
        # `SCENE {scene.index}` (desktop `mv-edit__scene-title`) and
        # `SCENE {scene.index}` (phone `mv-edit-mobile-scene__header-title`) are
        # both template text broken by a JS expression — the literal string
        # "SCENE 1" never appears in the source as one token. Confirmed live (11, 15).
        'SCENE 1',
        # `mock.ts` stores each scene's range as `"00:00–00:09"` with a real Unicode
        # en dash; this spec's HTML-entity form (`&ndash;`) normalizes to an ASCII
        # hyphen for comparison, so the two can never byte-match — the same class
        # of miss as shell-auth's real arrow vs "->" entry. Confirmed live (11).
        '00:00-00:09',
        # `SubscribeModal.tsx` passes this as `title="Upgrade Your Plan"` on
        # `<DpDialog title=... label=.../>` — a JSX prop value, not rendered JSX
        # text, so `plain()`'s tag-stripping removes it along with the tag it
        # thinks it found. Same class of miss as "Edit Music Video" above.
        'Upgrade Your Plan',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
