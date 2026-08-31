#!/usr/bin/env python3
"""yco-spec build script — Profile, Account & Settings (S7) storyboard.

Screenshot source: **live app capture**, not a static prototype — same
convention as song-creation/mv-creation/history/shell-auth/mv-edit's build
scripts. Every screenshot in specs/screenshots/ was captured driving the real
Next.js dev server (`npm run dev -- -p 3216`, this worktree's own port) with
Playwright, signed in via the same `localStorage['muse_auth']` seed the e2e
specs use. All full-page shots except Modal captures and the two demo-panel
states, which use a plain viewport shot (Modals and the demo panel are both
`position: fixed`, mis-measured by a full-page capture's artificially tall
viewport — see `capture_screenshots.py`'s `viewport_shot` docstring).

ONE VIEWPORT — D8 stands, unchanged: desktop 1403x697 only. Neither `/profile`
nor `/settings` mounts a distinct phone component tree: `/profile`'s phone
back is `RoomNavbar`'s own `mobileBackHref`, the same shell affordance S6
already captured on History, and `/settings`'s old `md:hidden` workaround was
deleted when drop 2 closed A5 (`PLAN.md`, "S7 scope", note 3).

TWO WAYS THIS SPEC'S PATHS DIVERGE FROM PLAN.md's SCOPE-TABLE WORDING, BOTH
FOUND BY READING SOURCE BEFORE CAPTURE (see also `capture_screenshots.py`'s
own docstring, which found them first):

1. PLAN.md's P3 row lists "Terms / Privacy opening the real legal URL" beside
   Muse Pro and Language, as if all three were `/profile` rows. They are not:
   `ProfileView.tsx` renders Muse Pro/Language/History/Send Feedback/Settings;
   `SettingsView.tsx` renders Terms of Use/Privacy Policy/Unsubscribe/Delete
   Account/Sign Out. The area spec's own §2 route map already gets this
   right. Captured under P4 here, not P3 — same six paths, same ~24 captures,
   just organized by the screen that actually owns each row.
2. PLAN.md's IAP-boundary note describes "subscribed on a phone" as a THIRD
   STATE of the Muse Pro row (`.../profile`). It is not: `ProfileView.tsx`'s
   Muse Pro row branches only on the real `subscribed` boolean (two states,
   captured in P3). The demo panel's `subOnApp` flag instead gates
   `SettingsView.tsx`'s Unsubscribe row (`SettingsView.tsx:122`), captured
   under P4 — and is a real gap in `specs/areas/06-profile-account.md`
   corrected in place under D11 in this same branch (see this script's
   `decisions` list, D-02).

THE FEEDBACK-SUBMIT FAILURE (AC-PROF-14 / PROF-E6) HAS NO CAPTURABLE TRIGGER
TODAY. PLAN.md's S7 scope note assumed `?demo=1` would cover it, matching the
attachment-refusal and subscribed-on-phone states. It doesn't:
`FeedbackDialog.tsx` reads no `useDemoState()`/`useDemoFlag()` at all, and
`MockMuseApi.submitFeedback` only throws when the attachment batch exceeds
5 MB — a condition the UI's own pick-refusal (PROF-E5) already prevents from
ever reaching Send. There is no flag comparable to `jobFail` for this dialog.
The behaviour is still specified — P5-E9 below, sourced verbatim from
`specs/areas/06-profile-account.md` §5 PROF-E6 — but it carries no screenshot,
and `open_questions` Q-02 records the gap and a recommended fix rather than
inventing a way to trigger it.

Source of truth for every rule/copy string not directly re-verified against
the running app: `specs/areas/06-profile-account.md` §§1-10 (route map,
state model, §3.1 Send Feedback, journeys PROF-P1..P5, error states,
AC-PROF-01..17) and `specs/00-overview.md`. Every quoted string below was
independently re-confirmed against the live app's accessibility tree during
capture (see the `_review/*.webp` thumbnails written alongside the PNGs).

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory; this repo is TypeScript/React, so relevant files are listed
individually below, following S1/S4/S6/S3's precedent.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/profile-account
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'Profile, Account &amp; Settings',
    'breadcrumb': 'YouCam Muse Web &rarr; Profile, Account &amp; Settings',
    'author': 'Jason Chen', 'date': '2026-08-31', 'status': 'Draft',
    'version': 'v1',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        '<code>/profile</code> &mdash; the signed-in account hub (identity, Credits/MVs/Songs '
        'stats, Edit Profile, Muse Pro, Language, History, Send Feedback, Settings) &mdash; and '
        '<code>/settings</code> &mdash; legal links, Unsubscribe, Delete Account and the app&rsquo;s '
        'only Sign Out control.'
    ),
    'background': (
        'The seventh spec in this repo&rsquo;s yco-spec storyboard programme (specs/storyboards/'
        'PLAN.md), covering area 06 end to end. Scoped ahead of S5 (credits-iap, on hold pending '
        'designer artwork) and after S6 (shell-auth, which deleted the account dropdown and left '
        'Settings as the app&rsquo;s only Sign Out entry point).'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of every Profile/Account/Settings behavior they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web &mdash; captured at 1403&times;697 (desktop only, D8)'],
        ['Audience', 'QA'],
        ['Scope', '/profile (identity, stats, Edit Profile, Muse Pro, Language, Send Feedback) and /settings (Terms/Privacy, Unsubscribe in both its variants, Delete Account, Sign Out row) plus the logged-out gate on /settings.'],
        ['Out of scope', 'SubscribeModal and /profile/credits (S5, on hold for designer IAP artwork &mdash; named as destinations, not toured); the community grid at /creator?self=1 (area 04); the Sign Out FLOW once triggered (S6&rsquo;s P6 owns it &mdash; this spec captures the row only).'],
        ['Source', 'specs/areas/06-profile-account.md (&sect;&sect;1-10, AC-PROF-01..17) and the running app'],
    ],

    'short_nav': [
        'Profile hub', 'Edit profile', 'Muse Pro &amp; Language', 'Settings', 'Send Feedback', 'Logged-out gate',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        {
            'id': 'p1-profile-hub', 'num': 1,
            'name': 'Profile hub',
            'desc': 'The identity block (avatar &middot; name &middot; email &middot; Edit &mdash; no plan badge, AC-PROF-01), the three stat tiles and where each navigates, and the five-row list.',
            'entry': '/profile (auth-gated)', 'outcome': 'The hub renders; each tile/row names its destination',
            'steps': [
                {
                    'shot': '01_profile_identity_stats.png', 'num': 1,
                    'user': 'Opens /profile while signed in.',
                    'system': 'Header shows avatar, name, email and an Edit control; three stat tiles (Credits &middot; MVs &middot; Songs) sit below.',
                    'exact': ['Route title: &ldquo;Account&rdquo;'],
                    'limits': [
                        ('No plan/PRO badge next to the name.', 'AC-PROF-01, corrected 2026-08-19 &mdash; DP&rsquo;s identity block is avatar + name + email + Edit, with no class for a badge. Subscription state surfaces only in the Muse Pro row (P3) and the sidebar footer, not here.'),
                        'Credits tile &rarr; /profile/credits (S5, on hold &mdash; named as the destination, not toured).',
                        'MVs tile &rarr; /creator?self=1&amp;tab=mv; Songs tile &rarr; /creator?self=1&amp;tab=songs (area 04, not toured here).',
                    ],
                },
                {
                    'shot': '02_profile_rows_overview.png', 'num': 2,
                    'user': '&mdash;',
                    'system': 'Five rows render in order: Muse Pro, Language, History, Send Feedback, Settings.',
                    'limits': [
                        'Muse Pro and Language are walked in P3.',
                        'History navigates to /history (area 05, not toured).',
                        'Send Feedback opens the form walked in P5.',
                        'Settings navigates to /settings, walked in P4.',
                        ('Sign Out is NOT one of these five rows.', 'AC-PROF-06 &mdash; since 2026-08-27 (S6 Q-01) it lives only in Settings (P4).'),
                    ],
                },
            ],
        },
        {
            'id': 'p2-edit-profile', 'num': 2,
            'name': 'Edit profile',
            'desc': 'The inline Edit-Profile modal: a mock &ldquo;Change Photo&rdquo; cycle, an editable name, a read-only email, and Save committing both in-memory.',
            'entry': 'Edit control on the identity block', 'outcome': 'Name/avatar update in the hub and the sidebar footer; no toast on the destination, a toast on this screen',
            'steps': [
                {
                    'shot': '03_edit_profile_open.png', 'num': 1,
                    'user': 'Taps the Edit control.',
                    'system': 'The Edit Profile modal opens with a draft seeded from the live profile.',
                    'exact': ['Title: &ldquo;Edit Profile&rdquo;'],
                    'limits': [('Email is read-only here.', 'Unlike Send Feedback&rsquo;s Email field (P5), which is editable &mdash; a deliberate difference, not an inconsistency (area spec &sect;10 decision 7).')],
                    'focus': [{'box': [46.5, 41.2, 5.8, 2.6], 'type': 'action', 'label': 'Change Photo'}],
                },
                {
                    'shot': '04_edit_profile_avatar_name_changed.png', 'num': 2,
                    'user': 'Clicks &ldquo;Change Photo&rdquo;, then edits Name.',
                    'system': 'The avatar cycles to the next sample photo; Name accepts up to 30 characters.',
                    'limits': [
                        ('&ldquo;Change Photo&rdquo; is a mock cycle, not a real upload.', 'It steps through a fixed `AVATAR_SAMPLES` list &mdash; there is no file picker here (contrast Send Feedback&rsquo;s real attachment picker, P5).'),
                        'Name is capped at 30 characters (maxLength).',
                    ],
                    'focus': [{'box': [49.9, 72.8, 12.3, 5.6], 'type': 'action', 'label': 'Save'}],
                },
                {
                    'shot': '05_edit_profile_saved_toast.png', 'num': 3,
                    'user': 'Clicks Save.',
                    'system': 'updateProfile commits the name/avatar in-memory, the modal closes, and a toast confirms.',
                    'exact': ['Toast: &ldquo;Profile updated&rdquo;'],
                    'limits': [('In-memory only.', 'A reload resets both to their seed values &mdash; PROF-E3, `TBD-GL-04`.')],
                },
            ],
        },
        {
            'id': 'p3-muse-pro-language', 'num': 3,
            'name': 'Muse Pro &amp; Language',
            'desc': 'Muse Pro in its two REAL states (not subscribed / subscribed) &mdash; the IAP boundary stops at the click target, no SubscribeModal capture &mdash; and Language&rsquo;s 9-locale picker.',
            'entry': 'Muse Pro / Language rows', 'outcome': 'Muse Pro opens SubscribeModal or /profile/credits (neither toured); Language switches the active locale',
            'steps': [
                {
                    'shot': '06_muse_pro_not_subscribed.png', 'num': 1,
                    'user': 'Views the Muse Pro row while not subscribed.',
                    'system': 'The row shows a solid &ldquo;Upgrade&rdquo; pill.',
                    'limits': [
                        ('Tapping the row opens SubscribeModal &mdash; not captured.', 'S5 (credits-iap) is deliberately on hold until the designer delivers the IAP artwork; any capture of that modal would carry a known expiry date (PLAN.md, S7 scope note 1). AC-PROF-04.'),
                    ],
                    'focus': [{'box': [74.4, 38.7, 5.0, 4.4], 'type': 'action', 'label': 'Upgrade'}],
                },
                {
                    'shot': '07_muse_pro_subscribed.png', 'num': 2,
                    'user': 'Views the same row once subscribed.',
                    'system': 'The pill is gone; the row instead shows the plan name and a hardcoded validity date.',
                    'exact': ['Subtitle: &ldquo;Weekly &middot; Validity: 2026-08-10&rdquo; (plan name varies; the date is a hardcoded placeholder &mdash; TBD-PROF-05)'],
                    'limits': [('Tapping the row now navigates to /profile/credits instead &mdash; not toured.', 'S5&rsquo;s own route; named as the destination only, same boundary as the stat tile (P1-S1). AC-PROF-04.')],
                },
                {
                    'shot': '08_language_picker.png', 'num': 3,
                    'user': 'Taps the Language row.',
                    'system': 'A 9-locale picker opens; the active locale is checked.',
                    'limits': ['setLocale(code) writes a `NEXT_LOCALE` cookie and navigates to the same route under the new locale prefix.'],
                },
                {
                    'shot': '09_language_switched.png', 'num': 4,
                    'user': 'Picks a different locale (German, in this capture).',
                    'system': 'The URL gains the locale prefix and the Language row&rsquo;s own subtitle updates to the new locale&rsquo;s native name.',
                    'limits': [
                        ('Every OTHER string on this screen stays English.', 'The 8 non-English dictionaries are intentionally empty (`Partial&lt;Dictionary&gt;`); `useT()` falls back to English per-key when a translation is missing (AGENTS.md). The Language row&rsquo;s subtitle is the one exception &mdash; it reads from a separate, always-populated `LOCALE_NAMES` map, not from `t()`. AC-PROF-05.'),
                    ],
                },
            ],
        },
        {
            'id': 'p4-settings', 'num': 4,
            'name': 'Settings',
            'desc': 'The row order (Terms of Use, Privacy Policy, Unsubscribe, Delete Account, Sign Out), the real legal links, Unsubscribe in BOTH its variants, and the destructive Delete confirm.',
            'entry': 'Settings row on /profile', 'outcome': 'Each row completes its own demo-only action; Sign Out routes to S6&rsquo;s own flow',
            'steps': [
                {
                    'shot': '10_settings_overview.png', 'num': 1,
                    'user': 'Views /settings.',
                    'system': 'Five rows, in this order: Terms of Use, Privacy Policy, Unsubscribe, Delete Account (styled as destructive), Sign Out.',
                    'limits': [
                        ('Terms of Use / Privacy Policy open the REAL legal pages in a new tab.', '`lib/legal.ts`&rsquo;s `TERMS_URL`/`PRIVACY_URL` &mdash; the same pair the sign-in modal uses (AUTH-03). AC-PROF-09.'),
                        ('Sign Out is a row here only &mdash; its flow is walked in shell-auth (S6), not here.', 'S6&rsquo;s P6 owns sign-out end to end (both entry points, the reload edge case). This is the app&rsquo;s ONLY Sign Out control since 2026-08-27 (S6 Q-01). AC-PROF-06.'),
                    ],
                },
                {
                    'shot': '11_unsubscribe_confirm.png', 'num': 2,
                    'user': 'Taps Unsubscribe.',
                    'system': 'A confirm dialog opens, explaining Pro benefits continue until the billing period ends.',
                    'exact': ['Title: &ldquo;Unsubscribe?&rdquo;', 'Buttons: &ldquo;Keep Pro&rdquo;, &ldquo;Unsubscribe&rdquo;'],
                    'focus': [{'box': [49.8, 55.5, 12.5, 6.6], 'type': 'action', 'label': 'Unsubscribe'}],
                },
                {
                    'shot': '12_unsubscribe_toast.png', 'num': 3,
                    'user': 'Confirms Unsubscribe.',
                    'system': 'A toast confirms; the subscription is NOT actually cancelled.',
                    'exact': ['Toast: &ldquo;Unsubscribed (demo)&rdquo;'],
                    'limits': [('Placeholder behaviour, not a real cancellation.', 'AC-PROF-07, PROF-E4 &mdash; pending `TBD-PROF-04`. This is the DEFAULT branch only; P4-S6 below is the other one.')],
                },
                {
                    'shot': '13_delete_account_confirm.png', 'num': 4,
                    'user': 'Taps Delete Account.',
                    'system': 'A destructive confirm dialog opens.',
                    'exact': ['Title: &ldquo;Delete Account?&rdquo;', 'Body: this permanently deletes the account and all creations; cannot be undone.', 'Buttons: &ldquo;Cancel&rdquo;, &ldquo;Delete&rdquo;'],
                    'focus': [{'box': [51.2, 55.5, 11.0, 6.6], 'type': 'action', 'label': 'Delete'}],
                },
                {
                    'shot': '14_delete_account_done_home.png', 'num': 5,
                    'user': 'Confirms Delete.',
                    'system': 'A toast confirms and the app redirects Home &mdash; nothing is actually deleted.',
                    'exact': ['Toast: &ldquo;Account deleted (demo)&rdquo;'],
                    'limits': [('Placeholder behaviour, not a real deletion.', 'AC-PROF-07 &mdash; pending `TBD-PROF-04`. No `signOut()` call, so the (fake) session survives this &mdash; confirmed live: the very next step re-enters as the same account.')],
                },
                {
                    'shot': '15_unsubscribe_on_phone.png', 'num': 6,
                    'user': 'With <code>?demo=1</code> on the URL, expands the DEMO panel, switches on &ldquo;Subscribed on a phone (App Store / Google Play)&rdquo;, then taps Unsubscribe again.',
                    'system': 'A DIFFERENT dialog opens &mdash; not the confirm from P4-S2 &mdash; explaining the subscription was bought through a store and must be cancelled there.',
                    'exact': ['Title: &ldquo;Manage Subscription in the App Store&rdquo; or &ldquo;Manage Subscription in Google Play&rdquo;, depending on the panel&rsquo;s iOS/Android picker', 'Single control: &ldquo;Got It&rdquo;'],
                    'limits': [
                        ('Neither AC-PROF-07 nor &sect;3 documented this branch before this capture.', 'D11 correction &mdash; see `specs/areas/06-profile-account.md`&rsquo;s &sect;3 note and decision D-02 below.'),
                        'No confirm, no toast &mdash; &ldquo;Got It&rdquo; just closes the dialog.',
                        'Nothing here could be cancelled from the web even in production.',
                        ('No Figma exists for this dialog.', 'Its copy is this session&rsquo;s own (`SettingsView.tsx`&rsquo;s own header comment) &mdash; flagged as `open_questions` Q-01 for a design review.'),
                    ],
                    'focus': [{'box': [36.7, 58.6, 25.5, 6.6], 'type': 'action', 'label': 'Got It'}],
                },
            ],
        },
        {
            'id': 'p5-send-feedback', 'num': 5,
            'name': 'Send Feedback',
            'desc': 'The 4-field support-ticket form (Type &rarr; Description &rarr; Attachment &rarr; Email, no Subject), its Send-gating, the attachment budget, success, and the two states with no screenshot: keyboard-only Type control and the submit-failure path.',
            'entry': 'Send Feedback row on /profile', 'outcome': '`MuseApi.submitFeedback` resolves to a &ldquo;Feedback Sent&rdquo; confirmation, or (unreachable in this build) rejects to an inline error',
            'steps': [
                {
                    'shot': '16_feedback_form_empty.png', 'num': 1,
                    'user': 'Taps Send Feedback.',
                    'system': 'The dialog opens on its empty FORM state.',
                    'exact': [
                        'Exactly four fields, in order: Type (placeholder &ldquo;Select an issue type&rdquo;), Description (placeholder &ldquo;Tell us what you think&hellip;&rdquo;), Attachment, Email.',
                        'Email is prefilled from the account.',
                    ],
                    'limits': [
                        ('There is no Subject field.', 'AC-PROF-10 asserts the ABSENCE &mdash; a returning Subject would silently re-open `TBD-PROF-07` (whether Muse posts to a different endpoint than YCO&rsquo;s CSB, and whether that endpoint wants a `title`).'),
                        'Send is disabled until Type and Description are non-empty and Email is well-formed (AC-PROF-11).',
                    ],
                    'focus': [{'box': [34.6, 25.4, 29.8, 6.9], 'type': 'action', 'label': 'Type'}],
                },
                {
                    'shot': '17_feedback_type_open.png', 'num': 2,
                    'user': 'Clicks the Type trigger.',
                    'system': 'A 5-option list opens.',
                    'exact': ['Options, in order: Purchase and Payment, Account, Feature Issue, Community Report, Others'],
                    'limits': [('Community Report has no CSB id yet.', '`questionTypeId: null` until `TBD-PROF-06` supplies one &mdash; the label ships regardless, per the product owner.')],
                    'focus': [{'box': [34.6, 33.5, 29.7, 5.3], 'type': 'action', 'label': 'Purchase and Payment'}],
                },
                {
                    'shot': '', 'num': 3,
                    'user': 'Operates the same control by keyboard alone: &darr;/&uarr; move, Home/End jump, Enter/Space select, Esc closes.',
                    'system': 'The trigger shows the chosen label and keyboard focus returns to the trigger &mdash; never trapped inside the list.',
                    'limits': [
                        ('Behaviour a screenshot cannot carry, per PLAN.md&rsquo;s S7 scope.', 'AC-PROF-16 &mdash; `role="listbox"`/`role="option"` semantics, `aria-activedescendant` tracking the highlighted option, and Esc stopping at the combobox instead of closing the whole dialog (`FeedbackDialog.tsx`&rsquo;s own `onTypeKeyDown`).'),
                        'Must pass axe at 375 and 1440 (AC-PROF-16).',
                        ('The 1440 half is this build&rsquo;s own D8 desktop capture.', '375 is `e2e/a11y.spec.ts`&rsquo;s job, not re-run here.'),
                    ],
                },
                {
                    'shot': '18_feedback_valid_send_enabled.png', 'num': 4,
                    'user': 'Types a Description with a Type already chosen and a valid Email present.',
                    'system': 'Send enables.',
                    'limits': [('Description is capped at 1000 characters with a live counter.', 'AC-PROF-11.')],
                    'focus': [{'box': [49.9, 81.5, 14.5, 6.6], 'type': 'action', 'label': 'Send'}],
                },
                {
                    'shot': '19_feedback_attachment_chip.png', 'num': 5,
                    'user': 'Clicks &ldquo;Add file&rdquo; and picks one small file.',
                    'system': 'A removable chip renders with the file&rsquo;s name and size; a running total is shown.',
                    'limits': ['Any file type is accepted; the budget is 5 MB, cumulative across every picked file.'],
                    'focus': [{'box': [34.6, 64.8, 29.8, 4.6], 'type': 'info', 'label': 'Attached file'}],
                },
                {
                    'shot': '20_feedback_attachment_too_large.png', 'num': 6,
                    'user': 'Picks a second file whose size ALONE crosses the 5 MB cumulative budget.',
                    'system': 'The pick is refused WHOLE &mdash; nothing is added &mdash; and one inline message appears; the first file&rsquo;s chip is untouched.',
                    'exact': ['Message: &ldquo;File too large &mdash; 5 MB total.&rdquo;'],
                    'limits': [
                        ('Refused whole, never truncated or partially added.', 'PROF-E5, AC-PROF-15 &mdash; a silent partial add would read as success.'),
                        ('One message inside the form, never a toast.', 'CS spec AC-22 (as adapted &mdash; the 5 MB figure itself is Muse&rsquo;s own, not CS&rsquo;s 10 MB; see area spec &sect;3.1).'),
                    ],
                    'focus': [{'box': [34.6, 70.5, 29.8, 2.6], 'type': 'info', 'label': 'Refusal message'}],
                },
                {
                    'shot': '21_feedback_success_done.png', 'num': 7,
                    'user': 'Clicks Send.',
                    'system': 'After a brief SUBMITTING state (Send disabled, fields read-only), the form is replaced by a confirmation.',
                    'exact': ['Title: &ldquo;Feedback Sent&rdquo;', 'Body: &ldquo;Thanks &mdash; we&rsquo;ll reply to &lt;email&gt;.&rdquo;', 'Control: &ldquo;Done&rdquo;'],
                    'limits': [('No toast anywhere in this flow.', 'AC-PROF-13 &mdash; the in-dialog confirmation replaces the toast the old one-textarea modal used to show.')],
                    'focus': [{'box': [34.6, 56.6, 29.8, 6.6], 'type': 'action', 'label': 'Done'}],
                },
                {
                    'shot': '', 'num': 8,
                    'user': 'Clicks Done, then reopens Send Feedback.',
                    'system': 'The dialog closes with no toast; the reopened dialog is a completely FRESH form.',
                    'limits': [('Unmounting IS the reset.', 'The dialog is mounted conditionally (`{fbOpen &amp;&amp; &lt;FeedbackDialog/&gt;}`) rather than hidden, so there is no stale-draft effect to write &mdash; Email is re-prefilled from the account, every other field is empty (PROF-P5-S6).')],
                },
                {
                    'shot': '', 'num': 9, 'role': 'error',
                    'user': 'Submits with a valid form and the request fails (network / 500 / oversized multipart).',
                    'system': 'The dialog stays open with every field AND attachment intact; one inline error appears above the actions; Send re-enables.',
                    'exact': ['Error line: &ldquo;Couldn&rsquo;t send. Please try again.&rdquo;'],
                    'limits': [
                        ('NOT CAPTURABLE in this build &mdash; documented from the area spec, not photographed.', 'PROF-E6, AC-PROF-14. `FeedbackDialog.tsx` reads no demo flag, and the mock only rejects on an attachment overage the UI&rsquo;s own pick-refusal (P5-S6) already prevents from ever reaching Send. See `open_questions` Q-02.'),
                        'Nothing is discarded &mdash; the retry path is Send again, no re-entry of any field.',
                    ],
                },
            ],
        },
        {
            'id': 'p6-settings-gate', 'num': 6,
            'name': 'Logged-out gate',
            'desc': 'Direct-navigating /settings while logged out.',
            'entry': '/settings, no session', 'outcome': 'The sign-in modal opens; the route renders nothing behind it',
            'steps': [
                {
                    'shot': '22_settings_logged_out_gate.png', 'num': 1,
                    'user': 'Navigates directly to /settings with no active session.',
                    'system': '`AuthGuard` renders nothing and opens the sign-in modal.',
                    'exact': ['Dialog title: &ldquo;Sign in to YouCam Muse&rdquo;'],
                    'limits': [
                        ('Dismissing sends the user Home, unlike a gated NAV click elsewhere in the app.', 'AC-PROF-17 &mdash; `AuthGuard`&rsquo;s own `requireLogin(undefined, () =&gt; router.replace(home))`. S6&rsquo;s P4 owns this contrast (gated route entry vs. gated nav dismiss) in full; the gate on /settings is shown here and walked no further.'),
                    ],
                },
            ],
        },
    ],

    # ── reference sections ───────────────────────────────────────────────────
    'data_contract': {
        'intro': 'What `FeedbackDialog.tsx` sends `MuseApi.submitFeedback` &mdash; the field names ARE the CSB wire params (area spec &sect;3.1), so there is no mapping layer between this shape and the real endpoint.',
        'schemas': [
            {
                'caption': 'T1 &middot; FeedbackTicket payload (P5-S4 onward)',
                'json': (
                    '{\n'
                    '  "email": "scott_wu@mail.com",\n'
                    '  "questionTypeId": 313,\n'
                    '  "q": "The trim slider on /mv/room jumps back to 0:00 after I drag it past 45 seconds.",\n'
                    '  "language": "enu",\n'
                    '  "prodVerId": null,\n'
                    '  "attachment": []\n'
                    '}'
                ),
                'fields': [
                    ('email', 'string', 'The Email field, trimmed. Prefilled from `profile.email`, user-editable.'),
                    ('questionTypeId', 'number | null', 'From the Type selection &mdash; 313/348/204/211, or `null` for Community Report (`TBD-PROF-06`).'),
                    ('q', 'string', 'The Description field ALONE, trimmed &mdash; no User ID, no Order ID composed in (area spec &sect;3.1 divergences 2 &amp; 3).'),
                    ('language', 'string', 'The active product locale code (`enu`&hellip;`ptg`), not BCP-47.'),
                    ('prodVerId', 'number | null', 'Always `null` until `TBD-PROF-06` supplies Muse Web&rsquo;s own id (YCO&rsquo;s is 504).'),
                    ('attachment', 'File[]', 'Zero or more picked files, held in memory; RD sends as `multipart/form-data`.'),
                ],
                'note': 'There is no `title` key at all &mdash; not `null`, absent. Removed 2026-08-27 with the Subject field (a declared C2 contract change); see `TBD-PROF-07` for whether the real endpoint needs one back.',
            },
        ],
        'reverse': [
            ('Type trigger label', 'questionTypeId (via the 5-option label &rarr; id map)'),
            ('Description textarea', 'q'),
            ('Email field', 'email'),
            ('Attachment chips', 'attachment[]'),
        ],
    },

    'states': [
        ('Muse Pro row', 'Not subscribed', 'Shows an &ldquo;Upgrade&rdquo; pill', 'Tap &rarr; SubscribeModal (S5, not captured)', 'N/A'),
        ('Muse Pro row', 'Subscribed', 'Shows plan name + hardcoded validity, no pill', 'Tap &rarr; /profile/credits (S5, not toured)', 'N/A'),
        ('Settings &middot; Unsubscribe', 'Demo `subOnApp` flag OFF (default)', 'Confirm dialog (&ldquo;Keep Pro&rdquo; / &ldquo;Unsubscribe&rdquo;)', 'Confirm &rarr; demo toast, `subscribed` unchanged', 'Cancel (Keep Pro) or the toast fading'),
        ('Settings &middot; Unsubscribe', 'Demo `subOnApp` flag ON', '&ldquo;Manage Subscription&rdquo; dialog, single &ldquo;Got It&rdquo;', 'Got It &rarr; just closes, nothing changes', 'Got It'),
        ('Send Feedback &middot; Send control', 'Type or Description empty, or Email malformed', 'Disabled, no field-level error shown', 'Enables once all three conditions clear', 'N/A'),
        ('Send Feedback &middot; Send control', 'Type + Description non-empty AND Email well-formed', 'Enabled', 'Tap &rarr; SUBMITTING (fields read-only)', 'Resolve &rarr; SUCCESS; reject &rarr; ERROR (not reachable in this build)'),
    ],

    'errors': [
        (
            'Attachment pick exceeds the 5 MB total',
            'A newly-picked file (or batch) would push the cumulative total over 5 MB',
            'The pick is refused WHOLE &mdash; nothing is added &mdash; one message under the field',
            'Remove an existing file to free budget, or pick a smaller one',
            'P5-S6',
        ),
        (
            'submitFeedback rejects',
            'Network failure / 500 / oversized multipart at the real endpoint (unreachable in this mock build)',
            'Dialog stays open, every field and attachment intact, one inline error, Send re-enabled',
            'Tap Send again &mdash; no re-entry of any field',
            'P5-E9 (documented, not captured &mdash; see open_questions Q-02)',
        ),
        (
            'Direct /settings visit while logged out',
            'No active session',
            'AuthGuard renders nothing and opens the sign-in modal',
            'Sign in (queued nav resumes) or dismiss (&rarr; Home)',
            'P6-S1',
        ),
    ],
    'errors_last_col': 'Where',
    'errors_note': (
        'The submitFeedback rejection is a timing/network condition this mock build cannot reproduce '
        'on demand &mdash; the &ldquo;Where&rdquo; column names the step that specifies it in text.'
    ),

    'open_questions': [
        (
            'Q-01',
            'The &ldquo;subscribed on a phone&rdquo; Unsubscribe dialog (P4-S6) has no Figma &mdash; its copy is this build session&rsquo;s own wording, not a design.',
            'Whether the copy ships as-is or gets a design pass before this becomes a real, non-demo feature',
            'Design / product owner',
        ),
        (
            'Q-02',
            'There is no way to trigger the feedback-submit failure (AC-PROF-14 / PROF-E6) today &mdash; neither organically nor via the `?demo=1` panel. Should a `feedbackFail` flag be added to `demoStore.ts`, read by `FeedbackDialog.send()`, paralleling how `jobFail` already drives MV/Song generation failures?',
            'Ever photographing this state for QA; today it is text-only (P5-E9)',
            'RD / product owner',
        ),
        (
            'Q-03',
            'What does &ldquo;cost per the Credit Consume MSR&rdquo; resolve to, generally? (Carried per D2 even though no step in THIS spec quotes a credit cost &mdash; Profile/Account spends nothing.)',
            'N/A to this spec&rsquo;s own steps; recorded because every spec in the programme carries this row',
            'Product / RD (the MSR document link is still TBD)',
        ),
    ],

    'criteria': [
        ('AC-PROF-01', 'WHEN /profile loads for a signed-in user, THE SYSTEM SHALL show avatar/name/email (no plan badge) and the Credits/MVs/Songs tiles and row list.', ['P1-S1']),
        ('AC-PROF-02', 'WHEN a stat tile is tapped, THE SYSTEM SHALL navigate to /profile/credits (Credits) or /creator?self=1&amp;tab=mv|songs (MVs/Songs).', ['P1-S1']),
        ('AC-PROF-03', 'WHEN Edit-Profile is saved, THE SYSTEM SHALL commit name/avatar via updateProfile and reflect them in the shell (in-memory).', ['P2-S1', 'P2-S2', 'P2-S3']),
        ('AC-PROF-04', 'WHEN the Muse Pro row is tapped, THE SYSTEM SHALL open SubscribeModal (not subscribed) or Credits detail (subscribed).', ['P3-S1', 'P3-S2']),
        ('AC-PROF-05', 'WHEN Language is changed, THE SYSTEM SHALL switch locale via setLocale and reflect it in localized surfaces.', ['P3-S3', 'P3-S4']),
        ('AC-PROF-06', 'WHEN Sign Out is invoked (Settings, or the flow S6 owns), THE SYSTEM SHALL clear auth and redirect Home; it SHALL NOT appear on /profile.', ['P1-S2', 'P4-S1']),
        ('AC-PROF-07', 'WHEN Unsubscribe or Delete Account is confirmed, THE SYSTEM SHALL show a demo toast (Delete redirects Home) without actually cancelling/deleting &mdash; EXCEPT the subOnApp branch (D11), which shows a different dialog and neither toasts nor confirms.', ['P4-S2', 'P4-S3', 'P4-S4', 'P4-S5', 'P4-S6']),
        ('AC-PROF-08', 'THE SYSTEM SHALL render /profile and /settings at 320/375/768/1024/1440/1920px with no overflow.', [], 'Visual-only; the six-tier sweep is e2e/visual-baseline.spec.ts&rsquo;s job. This spec&rsquo;s own D8 scope captures only 1403&times;697 desktop.'),
        ('AC-PROF-09', 'WHEN Terms of Use / Privacy Policy is tapped, THE SYSTEM SHALL open the shared real legal URL in a new tab.', ['P4-S1']),
        ('AC-PROF-10', 'WHEN Send Feedback is opened, THE SYSTEM SHALL show exactly four fields (Type, Description, Attachment, Email) with Email prefilled and Send disabled, and SHALL NOT render a Subject field.', ['P5-S1']),
        ('AC-PROF-11', 'THE SYSTEM SHALL keep Send disabled until Type and Description are non-empty AND Email is well-formed, with no field-level error for the merely-incomplete case.', ['P5-S1', 'P5-S4']),
        ('AC-PROF-12', 'WHEN a valid form is submitted, THE SYSTEM SHALL call submitFeedback with questionTypeId/q/email/language per the mapping and SHALL NOT include title, a User ID, or an Order ID.', ['P5-S4', 'T1']),
        ('AC-PROF-13', 'WHEN the submit resolves, THE SYSTEM SHALL replace the form with a &ldquo;Feedback Sent&rdquo; confirmation and a Done control, and SHALL NOT show a toast.', ['P5-S7']),
        ('AC-PROF-14', 'WHEN the submit rejects, THE SYSTEM SHALL keep the dialog open with every value/attachment intact, show one inline error, and re-enable Send.', ['P5-E9']),
        ('AC-PROF-15', 'THE SYSTEM SHALL accept attachments up to 5 MB total; a pick that would exceed it SHALL add nothing and show one inline message, not a toast.', ['P5-S6']),
        ('AC-PROF-16', 'THE Type control SHALL be operable by keyboard alone with listbox/option semantics and focus returning to its trigger, and SHALL pass axe at 375 and 1440.', ['P5-S3']),
        ('AC-PROF-17', '/settings SHALL be auth-gated; WHEN logged out, it SHALL open the sign-in modal.', ['P6-S1']),
    ],

    'prototype_deltas': [
        (
            'Edit-Profile avatar upload',
            'Cycles a fixed 5-photo `AVATAR_SAMPLES` array &mdash; there is no file picker and no real upload.',
            'Production needs a real image picker/uploader and storage for the result.',
        ),
        (
            'Unsubscribe / Delete Account',
            'Both are demo toasts (or, for a store-bought subscription, a &ldquo;Got It&rdquo; explainer) &mdash; nothing is cancelled or deleted server-side.',
            'Production needs the real store-cancellation deeplink (App F19) and a real, permanent account-delete endpoint (TBD-PROF-04).',
        ),
        (
            'Send Feedback endpoint',
            '`MuseApi.submitFeedback` is a mock that validates, waits ~900ms, and always resolves with a fake ticket id &mdash; it never actually reaches CS.',
            'RD points the same function at the real CSB (or Muse-specific, per TBD-PROF-07) endpoint; the UI needs no change (the single-swap-point contract, area spec &sect;3.1).',
        ),
        (
            'Muse Pro validity date',
            'Hardcoded &ldquo;2026-08-10&rdquo; regardless of which plan or when it was purchased.',
            'Production needs the real subscription record&rsquo;s renewal/expiry date (TBD-PROF-05).',
        ),
    ],

    'decisions': [
        ('D-01', 'PLAN.md&rsquo;s P3 scope row lists Muse Pro, Language AND Terms/Privacy together, as if all three were /profile rows &mdash; does this spec follow that grouping?', 'No &mdash; `SettingsView.tsx` renders Terms of Use/Privacy Policy, not `ProfileView.tsx` (confirmed against source and the area spec&rsquo;s own &sect;2 route map). Captured under P4 with the rest of /settings instead. Same six paths, same ~24 captures &mdash; this only changes which path owns which row, not what is covered.'),
        ('D-02', 'The demo panel&rsquo;s `subOnApp` flag is described in PLAN.md as a third STATE of the Muse Pro row &mdash; is that what the code does?', 'No &mdash; `ProfileView.tsx`&rsquo;s Muse Pro row branches only on the real `subscribed` boolean (P3&rsquo;s two states). `subOnApp` instead gates `SettingsView.tsx`&rsquo;s Unsubscribe row (`:122`), opening a completely different dialog. Captured under P4-S6. `specs/areas/06-profile-account.md` did not document this branch at all before this build &mdash; corrected in place under D11 (&sect;3&rsquo;s new &#9888; note, and AC-PROF-07&rsquo;s own line).'),
        ('D-03', 'PLAN.md assumed `?demo=1` covers the feedback-submit failure the same way it covers the attachment-refusal and subscribed-on-phone states &mdash; does it?', 'No &mdash; verified by reading `FeedbackDialog.tsx` (no `useDemoState()`/`useDemoFlag()` calls at all) and `MockMuseApi.submitFeedback` (throws only on an attachment overage the UI already prevents from reaching Send). Recorded as `open_questions` Q-02 with a recommended fix (a `feedbackFail` flag paralleling `jobFail`), not captured, not faked. P5-E9 documents the intended behaviour from the area spec text alone.'),
        ('D-04', 'Which locale demonstrates AC-PROF-05 (P3-S4), and does its choice matter?', 'German &mdash; picked only because it is Latin-script, so nothing quoted from the screen risks the spec&rsquo;s own CJK-in-step-text gate. The finding it surfaces (only the Language row&rsquo;s subtitle changes; everything else stays English via per-key fallback) would be identical for any of the 8 non-English locales.'),
        ('D-05', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo yet, same as S1/S3/S4/S6.'),
        ('D-06', 'Does this spec re-tour SubscribeModal, /profile/credits, or the Sign Out flow, since all three are one click away from a captured screen?', 'No &mdash; all three are S5&rsquo;s or S6&rsquo;s territory. The IAP boundary is explicitly TIGHTER than the usual neighbour rule for S5 (PLAN.md, S7 scope note 1): stop at the click target, no boundary shot of SubscribeModal at all, because S5 is on hold for designer artwork with a known expiry date. Sign Out gets the usual neighbour treatment: the row is shown (P4-S1), the flow is not.'),
    ],

    'references': [],

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Profile["/profile (auth-gated)"] --> Tiles["Credits/MVs/Songs tiles -- name destinations only"]\n'
        '  Profile --> Edit{Edit Profile?}\n'
        '  Edit -->|Save| EditDone["Name/avatar updated in-memory, toast"]\n'
        '  Profile --> Pro{Muse Pro tap?}\n'
        '  Pro -->|not subscribed| Iap["SubscribeModal (S5, not captured)"]\n'
        '  Pro -->|subscribed| Credits["/profile/credits (S5, not toured)"]\n'
        '  Profile --> Lang{Change Language?}\n'
        '  Lang -->|pick a locale| LangDone["URL + Language subtitle update; rest stays English"]\n'
        '  Profile --> FB["Send Feedback"]\n'
        '  FB --> FBForm["FORM: Type -> Description -> Attachment -> Email"]\n'
        '  FBForm -->|valid + Send| FBSend["SUBMITTING"]\n'
        '  FBSend -->|resolved| FBOk["Feedback Sent + Done, no toast"]\n'
        '  FBSend -.->|rejected, not reachable| FBErr["inline error, draft preserved (Q-02)"]\n'
        '  Profile --> Settings["/settings"]\n'
        '  Settings --> Legal["Terms / Privacy -> real links, new tab"]\n'
        '  Settings --> Unsub{Unsubscribe?}\n'
        '  Unsub -->|subOnApp off, default| UnsubToast["Confirm -> demo toast"]\n'
        '  Unsub -->|subOnApp on, demo panel| UnsubPhone["Manage-on-your-phone dialog (D11)"]\n'
        '  Settings --> Del{Delete Account?}\n'
        '  Del -->|confirm| DelDone["Demo toast -> Home, nothing deleted"]\n'
        '  Settings --> Out["Sign Out row (S6 owns the flow)"]\n'
        '  Gate["/settings, logged out"] -.->|AuthGuard| SignIn["Sign-in modal; dismiss -> Home"]\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'profile', 'ProfileView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'profile', 'SettingsView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'profile', 'FeedbackDialog.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'Modal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'Button.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'RoomNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'DetailNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'auth', 'SignInModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'demo', 'DemoPanel.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'feedback.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'user.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'i18n', 'dictionaries', 'en.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'i18n', 'config.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'api', 'schemas.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'api', 'mock.ts'),
    ],
    'strings_ignore': [
        # `t("nav.account")` renders as JSX TEXT ("Account"), but the string
        # itself lives only in en.ts as a dictionary VALUE assigned to a key —
        # lint_spec.py's STRINGS check greps literal source text, and
        # "Account" as a bare word is common enough in comments/prose across
        # these files that a false NEGATIVE (falsely reported missing) is not
        # the risk; a stray unrelated match is. Confirmed live (01, 10).
        'Account',
        # Toast copy assembled with string concatenation / template literals
        # in some builds of this convention across the repo — confirmed
        # verbatim in en.ts as dictionary VALUES (not JSX text), which the
        # tag-stripping `plain()` pass in lint_spec.py does not scan into.
        'Profile updated',
        'Unsubscribed (demo)',
        'Account deleted (demo)',
        # FeedbackDialog's success body interpolates `{email}` via
        # `.replace()` at runtime — the literal template string
        # "Thanks — we'll reply to {email}." is what's in en.ts, but the
        # RENDERED text substitutes a real address, so neither form appears
        # byte-for-byte in the other. Confirmed live (21) with the real
        # address substituted for the template's own literal placeholder.
        "Thanks &mdash; we&rsquo;ll reply to &lt;email&gt;.",
        # `SettingsView.tsx` composes this dialog's title from a ternary
        # returning STRING literals per platform (`"Manage Subscription in
        # the App Store"` / `"Manage Subscription in Google Play"`), passed
        # as the `title` PROP on `<Modal .../>` — `plain()`'s tag-stripper
        # treats the whole opening tag, attributes included, as markup and
        # removes it, so neither half of the ternary is visible to the scan
        # even though both are right there in the source (same class of miss
        # as mv-edit's "Upgrade Your Plan" and "Edit Music Video"). Confirmed
        # live (15) with the iOS half rendered.
        'Manage Subscription in the App Store',
        'Manage Subscription in Google Play',
        # Same JSX-attribute-value miss: `<Modal title="Unsubscribe?" .../>`
        # and `<Modal title="Delete Account?" .../>` — confirmed live (11, 13).
        'Unsubscribe?',
        'Delete Account?',
        # `Weekly &middot; Validity: 2026-08-10` — `ProfileView.tsx` builds
        # this subtitle with a real Unicode middle dot (`&middot;` in JS
        # source, not an HTML entity), which this spec's own `&middot;`
        # entity normalizes to ASCII `.` for comparison — the two can never
        # byte-match. Same class of miss as mv-edit's real-en-dash-vs-`&ndash;`
        # entry. Confirmed live (07).
        'Weekly &middot; Validity: 2026-08-10',
        # `en.ts`'s `profile.feedbackPlaceholder` value ends in a real Unicode
        # ellipsis character (`…`), not the three-dot `&hellip;` this spec
        # normalizes to for comparison — same normalization mismatch.
        # Confirmed live (16).
        'Tell us what you think&hellip;',
        # `en.ts`'s `profile.feedback.attachmentTooLarge` value uses a real
        # Unicode em dash (`—`), which this spec's `&mdash;` normalizes to
        # ASCII `-` for comparison — same normalization mismatch as the
        # "00:00-00:09" entry in mv-edit's own ignore list. Confirmed live (20).
        'File too large &mdash; 5 MB total.',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
