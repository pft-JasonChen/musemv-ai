#!/usr/bin/env python3
"""yco-spec build script — Shell & Auth (S6) storyboard.

Screenshot source: **live app capture**, not a static prototype — same
convention as song-creation/mv-creation/history's build scripts. Every
screenshot in specs/screenshots/ was captured driving the real Next.js dev
server (`npm run dev -- -p 3210`, this worktree's own port) with Playwright,
signed in via the same `localStorage['muse_auth']` seed the e2e specs use.
Full-page shots (`capture_screenshots.py`'s `full_shot`), not viewport clips
— same reason as history: several pages here run taller than the viewport.

TWO VIEWPORTS — the one deliberate exception in this programme (D8,
specs/storyboards/PLAN.md, "S6 scope" table). Desktop 1403x697 (this repo's
established viewport) AND phone 375x812. Every other storyboard spec is
desktop-only; S6 is not, because `MobileTabBar`/`MobileHeader` are a
DIFFERENT component tree from `Sidebar`/`TopBar`, not a reflow of it — see
`capture_screenshots.py`'s own docstring for the full reasoning.

Source of truth for every rule/copy string not directly re-verified against
the running app: specs/areas/01-app-shell.md, specs/areas/09-auth-
onboarding.md, and specs/00-overview.md. Every quoted string below was
independently re-confirmed against the live app's accessibility tree during
capture (see the `_review/*.webp` thumbnails written alongside the PNGs).

═══════════════════════════════════════════════════════════════════════════
READ THIS BEFORE THE `cfg` BELOW — THREE FINDINGS RESHAPED THIS SPEC'S SCOPE
═══════════════════════════════════════════════════════════════════════════

Phase 0 scoped S6 around area 01's own description of the account chrome:
a top bar with a "Sign In" button, an avatar that opens a dropdown
`AccountMenu` (Buy Credits, Profile, My Creations, Notifications, Send
Feedback, Sign Out). Phase 1 reading `src/components/shell/AppShell.tsx`
and driving the live app found that description no longer matches what
ships, in three connected ways. All three are corrected in place in
`specs/areas/01-app-shell.md` and `specs/areas/09-auth-onboarding.md` under
the programme's D11 rule (a capture that contradicts an area-spec `AC-*`
corrects the area spec, ⚠️-annotated, in the same branch) — this docstring
is the short version; the area specs carry the full correction text and
live-repro detail.

1. **`AccountMenu` (and its only mount path, `HeaderActions` → `TopBar`) is
   UNREACHABLE dead code.** `AppShell` renders `TopBar` only for a route
   that is neither in `OWN_CHROME` nor `/`; `OWN_CHROME`'s list has grown to
   cover every route the app actually serves except `/` (which gets the
   marketing `Navbar` instead) and `/share*` (bare). Confirmed live
   2026-08-27: no `[aria-label="Account menu"]` anywhere, on five
   representative signed-in routes (P5-S3's DOM sweep, run in
   `capture_screenshots.py`, not a screenshot — there is nothing to
   photograph). No `e2e/` spec exercises any of the three files either.
   Each own-chrome route instead renders its own inline cluster
   (`RoomNavbar`/`DetailNavbar`/`Navbar`): a **credit-balance pill** that
   opens `BuyCreditsModal` directly, and — only while not subscribed — a
   separate **Upgrade** button that opens `SubscribeModal` directly. No
   avatar, no PRO/FREE badge, no dropdown, anywhere. This is the reason
   P5 below is "Account entry points" rather than "Account menu, walked in
   place" as originally scoped — there is no menu to walk.
2. **The logged-out control reads "Login", never "Sign In".** "Sign In"
   lives only inside the dead `HeaderActions`. Every reachable trigger
   (`RoomNavbar`, `DetailNavbar`, `home/Navbar`) renders a button whose
   visible text is "Login", independently of each other and of the dead
   component. Quoted as "Login" throughout this spec.
3. **`MobileTabBar`/`MobileHeader` mount ONLY on Home and `/history`**
   (`AppShell.tsx`'s `MOBILE_TAB_ROUTES = ["/history"]` / `isHome`), not on
   every route below 767px as area 01 implied. Confirmed live: neither
   element exists in the DOM on `/watch`, `/mv/room`, or `/profile`, at any
   width. This is why the phone pass below shoots exactly two chrome
   states (Home, History) rather than a generic "phone header" reused
   across routes — there isn't one.

None of the three is fixed here — this build session has no `src/`
authority (see the dispatch prompt's Boundaries section); each is reported
to the product owner as an app-bug finding in the session's final report,
with the corrected area-spec text as the durable record.

Two smaller, genuine facts surfaced only by driving the live app (recorded
as `decisions` below, not `prototype_deltas` — neither is a prototype
simplification, both are just what the code actually does):
  - Sidebar's nav-item text is `t('nav.createMv')` = **"AI Music Video"**
    and `t('nav.createSong')` = **"AI Song"** — not the shorthand
    "Create MV"/"Create Song" area 01 uses as a plain-English route label.
    This spec quotes the real on-screen text.
  - A free (non-subscribed) user's credit-balance pill opens the SAME
    "Upgrade Your Plan" dialog the Upgrade button does, not a Buy Credits
    pack list — `BuyCreditsModal`'s own code comment names this CR-06 ("a
    non-subscriber never reaches the pack list") and returns
    `<SubscribeModal>` instead. Captured as-is (P5-S1), not worked around
    by forcing a subscribed state first.

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory; this repo is TypeScript/React, so relevant files are listed
individually below, following S1/S4's precedent.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/shell-auth
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'Shell & Auth',
    'breadcrumb': 'YouCam Muse Web &rarr; Shell &amp; Auth',
    'author': 'Jason Chen', 'date': '2026-08-27', 'status': 'Draft',
    'version': 'v1',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        'The persistent app frame &mdash; sidebar / bottom tab bar, each route&rsquo;s own inline '
        'account cluster, and the mock sign-in gate (<code>SignInModal</code> / <code>AuthGuard</code>) '
        'that every other area assumes is already in place.'
    ),
    'background': (
        'The sixth spec in this repo&rsquo;s yco-spec storyboard programme (specs/storyboards/'
        'PLAN.md), covering areas 01 (App Shell) and 09 (Auth &amp; Onboarding) as one spec (D4) '
        'because SHELL-P2 (gated nav while logged out) IS AUTH-P2&rsquo;s trigger &mdash; splitting '
        'them would put the trigger and the response in different documents.'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of every shell/auth behavior they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web &mdash; captured at 1403&times;697 (desktop) AND 375&times;812 (phone), the one exception in this programme (D8)'],
        ['Audience', 'QA'],
        ['Scope', 'Signed-in navigation, gated nav vs. gated route entry, header Sign In, account entry points (there is no account menu &mdash; see the Feature block), sign-out + reload behavior, and the bare /share page.'],
        ['Out of scope', 'BuyCreditsModal/SubscribeModal&rsquo;s own content (area 07 / S5), /profile itself (area 06 / S7), /history itself (area 05 / S4), /share&rsquo;s own content (S9) &mdash; each gets one arrival step here and no further tour.'],
        ['Source', 'specs/areas/01-app-shell.md, specs/areas/09-auth-onboarding.md, specs/00-overview.md, and the running app'],
    ],

    'short_nav': [
        'Signed-in navigation', 'Gated nav vs. gated route', 'Header Sign In',
        'Gated route entry', 'Account entry points', 'Sign out + reload', 'Bare page',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        {
            'id': 'p1-signed-in-nav', 'num': 1,
            'name': 'Signed-in navigation',
            'desc': 'Sidebar item click, active state, locale-prefix preservation, and the phone equivalent &mdash; the tab bar and its &ldquo;+&rdquo; create sheet.',
            'entry': 'Sidebar / MobileTabBar (signed in)', 'outcome': 'Active route changes; locale prefix carries through',
            'steps': [
                {
                    'shot': '01_sidebar_home_active.png', 'num': 1,
                    'user': 'Opens / while signed in.',
                    'system': 'Sidebar renders five nav destinations plus a signed-in profile footer; Home is active.',
                    'exact': ['Nav labels: &ldquo;Home&rdquo;, &ldquo;AI Music Video&rdquo;, &ldquo;AI Song&rdquo;, &ldquo;History&rdquo;', 'Profile footer: &ldquo;Scott Wu&rdquo; &middot; &ldquo;Free plan&rdquo;'],
                    'limits': [
                        ('Sidebar&rsquo;s nav labels are the real on-screen text, not area 01&rsquo;s shorthand.', '&ldquo;Create MV&rdquo;/&ldquo;Create Song&rdquo; there are route labels; the app itself reads &ldquo;AI Music Video&rdquo;/&ldquo;AI Song&rdquo; (D-05).'),
                        'The profile footer only renders while signed in (AC-SHELL-01).',
                    ],
                    'focus': [{'box': [1.1, 4.3, 14.8, 2.1], 'type': 'info', 'label': 'Home (active)'}],
                },
                {
                    'shot': '02_sidebar_nav_click.png', 'num': 2,
                    'user': 'Clicks &ldquo;AI Music Video&rdquo; in the sidebar.',
                    'system': 'Routes to /mv/room via next/link; the clicked item becomes active.',
                    'limits': ['Active-state matching is prefix-based (pathname.startsWith), not exact (AC-SHELL-02).'],
                    'focus': [{'box': [1.1, 11.1, 14.8, 3.4], 'type': 'action', 'label': 'AI Music Video'}],
                },
                {
                    'shot': '03_sidebar_nav_locale.png', 'num': 3,
                    'user': 'Under the /jpn/ locale prefix, clicks &ldquo;History&rdquo;.',
                    'system': 'Routes to /jpn/history &mdash; the prefix is preserved end to end.',
                    'limits': [
                        'Every in-app Link uses localePath(locale, href), so the prefix survives any nav click (AC-SHELL-02).',
                        ('Nav labels stay in English even under /jpn/.', 'jpn.ts is an intentionally empty dictionary; useT() falls back to English per key (00-overview.md &sect;i18n).'),
                    ],
                    'focus': [{'box': [1.1, 33.0, 14.8, 5.9], 'type': 'action', 'label': 'History'}],
                },
                {
                    'shot': '04_sidebar_upgrade_open.png', 'num': 4,
                    'user': 'Clicks &ldquo;Upgrade&rdquo; in the sidebar profile footer.',
                    'system': 'Opens the &ldquo;Upgrade Your Plan&rdquo; dialog directly, in place.',
                    'limits': [
                        'Its own content and every Subscribe action are S5&rsquo;s territory &mdash; captured opened, not toured further.',
                        'The Upgrade button renders only while signed in and not subscribed (AC-SHELL-05).',
                    ],
                },
                {
                    'shot': '20_mobile_home_chrome.png', 'num': 5,
                    'user': 'On a 375px phone, opens / while signed in.',
                    'system': 'MobileHeader (wordmark, crown, account icon) tops the page; MobileTabBar (Explore / + / History) sits fixed at the bottom.',
                    'limits': [
                        ('This chrome exists ONLY on Home and History.', 'MobileTabBar/MobileHeader mount on isHome || pathname starts with /history &mdash; every other route (confirmed: /watch, /mv/room, /profile) draws its own back-affordance instead, with no bottom tab bar at all (see the Feature block, finding 3).'),
                        'The crown (Upgrade) only renders while not subscribed, same rule as desktop.',
                    ],
                    'focus': [{'box': [43.6, 48.7, 12.8, 3.2], 'type': 'action', 'label': 'Create (+)'}],
                },
                {
                    'shot': '21_mobile_create_sheet.png', 'num': 6,
                    'user': 'Taps the &ldquo;+&rdquo; create button.',
                    'system': 'A bottom sheet slides up with the two create destinations.',
                    'exact': [
                        'Title: &ldquo;What would you like to create?&rdquo;',
                        'Options: &ldquo;AI Music Video&rdquo; &middot; &ldquo;Selfie + music &rarr; cinematic MV&rdquo;; &ldquo;AI Song&rdquo; &middot; &ldquo;Lyrics + style &rarr; original track&rdquo;',
                    ],
                    'limits': [
                        ('Neither option is gated for a guest.', 'Un-gated 2026-08-12 by product decision &mdash; a guest may open either compose screen and browse freely; the gate sits on the actions inside them (area 02/03).'),
                        'Tapping either option routes there directly and closes the sheet.',
                    ],
                    'focus': [{'box': [0.0, 44.0, 100.0, 4.0], 'type': 'action', 'label': 'AI Music Video'}],
                },
            ],
        },
        {
            'id': 'p2-gated-nav', 'num': 2,
            'name': 'Gated nav while logged out',
            'desc': 'History is the only nav item that is both gated AND visible to a guest &mdash; on the sidebar and on the phone tab bar.',
            'entry': 'Sidebar / MobileTabBar (logged out)', 'outcome': 'SignInModal opens with the target queued; dismiss leaves the user where they were',
            'steps': [
                {
                    'shot': '05_gated_history_click.png', 'num': 1,
                    'user': 'Logged out, clicks &ldquo;History&rdquo; in the sidebar.',
                    'system': 'Navigation is prevented; requireLogin opens SignInModal and queues /history.',
                    'limits': [
                        ('History is the ONLY nav item this can happen on.', 'Create MV/Create Song were removed from GATED on 2026-08-12 (guests may compose freely); Profile&rsquo;s footer link only renders while signed in, so a guest never sees it to click at all (AC-SHELL-03).'),
                    ],
                    'focus': [{'box': [1.1, 11.7, 14.8, 2.1], 'type': 'action', 'label': 'History'}],
                },
                {
                    'shot': '06_gated_dismiss_stay.png', 'num': 2,
                    'user': 'Dismisses the modal (Escape).',
                    'system': 'The modal closes; the user stays on the current page &mdash; no navigation.',
                    'limits': [('This is the OPPOSITE of AuthGuard&rsquo;s dismiss (P4-S2).', 'A gated-nav click has no onCancel, so dismiss is a no-op; AuthGuard passes router.replace(home) as onCancel. Same modal, opposite dismiss behaviour (AC-AUTH-03).')],
                },
                {
                    'shot': '07_gated_signin_lands_history.png', 'num': 3,
                    'user': 'Clicks &ldquo;History&rdquo; again, then signs in (Google).',
                    'system': 'After the success animation, the queued navigation runs &mdash; the page routes to /history.',
                    'limits': ['The queued callback is router.push(target), captured here as the request completing successfully (AC-AUTH-02).'],
                },
                {
                    'shot': '22_mobile_gated_history_tap.png', 'num': 4,
                    'user': 'On a 375px phone, logged out, taps &ldquo;History&rdquo; in MobileTabBar.',
                    'system': 'Same gate as the sidebar: navigation is prevented, SignInModal opens with /history queued.',
                    'limits': ['MobileTabBar&rsquo;s guardHistory is a direct copy of Sidebar&rsquo;s gate &mdash; same GATED set, same requireLogin call.'],
                    'focus': [{'box': [74.1, 50.4, 17.1, 2.1], 'type': 'action', 'label': 'History'}],
                },
                {
                    'shot': '23_mobile_gated_dismiss_stay.png', 'num': 5,
                    'user': 'Dismisses the modal.',
                    'system': 'Stays on Home &mdash; the History tab does not become active.',
                },
            ],
        },
        {
            'id': 'p3-header-signin', 'num': 3,
            'name': 'Header Sign In (no queued action)',
            'desc': 'The &ldquo;Login&rdquo; control every own-chrome route and the marketing Navbar render inline &mdash; not a single global top bar.',
            'entry': '/mv/room (guest)', 'outcome': 'Signed in, in place, with no navigation',
            'steps': [
                {
                    'shot': '08_header_login_click.png', 'num': 1,
                    'user': 'Logged out on /mv/room, clicks &ldquo;Login&rdquo; in RoomNavbar.',
                    'system': 'openSignIn() opens SignInModal with no queued action.',
                    'exact': [
                        'Login control text: &ldquo;Login&rdquo;',
                        'Modal title: &ldquo;Sign in to YouCam Muse&rdquo;',
                        'Subtitle: &ldquo;Save your creations, sync across devices, and unlock your full creative history.&rdquo;',
                        'Buttons: &ldquo;Continue with Apple&rdquo;, &ldquo;Continue with Google&rdquo;',
                        'Footer: links to &ldquo;Terms of Service&rdquo; and &ldquo;Privacy Policy&rdquo;',
                    ],
                    'limits': [
                        ('/mv/room renders its full compose screen behind the modal, unprompted.', 'Guests are never auto-gated here (AC-AUTH-08) &mdash; this modal only opened because Login was clicked.'),
                        ('The control text is &ldquo;Login&rdquo;, never &ldquo;Sign In&rdquo;.', '&ldquo;Sign In&rdquo; exists only in the dead HeaderActions component &mdash; see the Feature block (AC-SHELL-04).'),
                    ],
                    'focus': [{'box': [91.5, 1.5, 4.2, 3.0], 'type': 'action', 'label': 'Login'}],
                },
                {
                    'shot': '09_header_signin_success.png', 'num': 2,
                    'user': 'Picks &ldquo;Continue with Apple&rdquo;.',
                    'system': 'After a 1.8s success animation, the modal closes and RoomNavbar swaps to its logged-in cluster &mdash; still on /mv/room.',
                    'exact': ['Success title: &ldquo;Signed in successfully!&rdquo;', 'Success subtitle: &ldquo;Welcome back, Scott &middot; via Apple&rdquo;'],
                    'limits': [
                        ('No navigation happens.', 'openSignIn() queues no onSuccess callback, unlike the gated-nav path (P2) (AC-AUTH-02).'),
                        ('The logged-in cluster is a credit-balance pill and, while not subscribed, an Upgrade button.', 'No avatar appears &mdash; see the Feature block finding 1 (AC-SHELL-05).'),
                    ],
                    'focus': [{'box': [82.0, 1.5, 6.1, 3.1], 'type': 'info', 'label': 'Credits'}],
                },
            ],
        },
        {
            'id': 'p4-gated-route-entry', 'num': 4,
            'name': 'Gated route entry (AuthGuard)',
            'desc': 'Arriving at a personal-data route directly, with no prior nav click &mdash; the opposite dismiss behaviour from P2.',
            'entry': '/history (direct, guest)', 'outcome': 'Either the guarded page renders, or the user is redirected Home',
            'steps': [
                {
                    'shot': '10_authguard_blocked.png', 'num': 1,
                    'user': 'Navigates directly to /history while logged out.',
                    'system': 'AuthGuard renders nothing (only the sidebar shell) and opens SignInModal.',
                    'limits': [
                        'Same four routes: /history, /profile, /profile/credits, /settings (AC-AUTH-01).',
                        ('This queues no onSuccess, but DOES pass an onCancel.', 'requireLogin(undefined, () =&gt; router.replace(home)) &mdash; the opposite pairing from a gated nav click (P2).'),
                    ],
                },
                {
                    'shot': '11_authguard_dismiss_home.png', 'num': 2,
                    'user': 'Dismisses the modal.',
                    'system': 'router.replace(home) runs &mdash; the browser lands on / (guest chrome).',
                    'limits': [('This is the OPPOSITE of P2-S2&rsquo;s dismiss.', 'Same SignInModal component, different onCancel wiring depending on the trigger (AC-AUTH-03).')],
                },
                {
                    'shot': '12_authguard_signin_success.png', 'num': 3,
                    'user': 'Navigates to /history again, then signs in (Apple).',
                    'system': 'No separate navigation runs &mdash; the guard simply stops returning null and /history&rsquo;s own content renders, on the SAME url the whole time.',
                    'limits': [('AuthGuard never pushes a route.', 'It renders null while !loggedIn and its children once loggedIn flips true &mdash; the browser was never anywhere but /history.')],
                },
            ],
        },
        {
            'id': 'p5-account-entry-points', 'num': 5,
            'name': 'Account entry points',
            'desc': 'There is no account MENU &mdash; each destination the original design put behind one dropdown is its own separate, reachable control. Renamed from &ldquo;Account menu, walked in place&rdquo; for that reason (see the Feature block).',
            'entry': 'Signed-in header / sidebar', 'outcome': 'Each control&rsquo;s own destination; confirmation that no menu exists anywhere',
            'steps': [
                {
                    'shot': '13_credit_balance_click.png', 'num': 1,
                    'user': 'Signed in on /mv/room, clicks the credit-balance pill.',
                    'system': 'Opens &ldquo;Upgrade Your Plan&rdquo; &mdash; the SAME dialog the Upgrade button opens.',
                    'limits': [
                        ('A non-subscriber&rsquo;s credit pill never reaches a Buy Credits pack list.', 'BuyCreditsModal returns &lt;SubscribeModal&gt; instead while !subscribed (its own CR-06 comment) &mdash; captured as-is, not worked around (D-04).'),
                        'Its content is S5&rsquo;s territory &mdash; captured opened, not toured further.',
                    ],
                },
                {
                    'shot': '14_sidebar_profile_click.png', 'num': 2,
                    'user': 'Clicks the sidebar profile footer (avatar / name / plan).',
                    'system': 'Routes straight to /profile &mdash; a plain link, not a menu.',
                    'limits': [
                        ('Profile / My Creations / Send Feedback / Notifications all now live at /profile.', 'Not behind any menu &mdash; S7&rsquo;s territory, captured opened only.'),
                        ('&ldquo;My Creations&rdquo; still exists as a label &mdash; just not here.', 'It is /history&rsquo;s own page title (RoomNavbar), already shown in every P1/P2 History screenshot above.'),
                    ],
                },
                {
                    'shot': '', 'num': 3,
                    'user': 'A sweep of five signed-in routes (/, /history, /profile, /watch, /settings) for any account-menu trigger.',
                    'system': 'None found &mdash; no [aria-label=&ldquo;Account menu&rdquo;] anywhere, at desktop width.',
                    'summary': 'Confirms the account MENU itself has no live entry point on any route (not just the two walked above).',
                    'limits': [('There is no account menu in the product &mdash; AccountMenu/HeaderActions/TopBar were unreachable dead code and were DELETED on 2026-08-27 (D-10).', 'This sweep was the evidence that raised it. It still holds, now by construction: see the D11 corrections in specs/areas/01-app-shell.md &sect;1 point 5 / &sect;2 / &sect;3, and AC-SHELL-06 (retired).')],
                },
                {
                    'shot': '24_mobile_history_chrome.png', 'num': 4,
                    'user': 'On a 375px phone, signed in on /history.',
                    'system': 'RoomNavbar itself carries the crown + account-icon pair inline (mobileHeaderActions) &mdash; the account icon is still a direct link, not a menu trigger.',
                    'limits': [
                        ('History shows exactly ONE header on phone, not two stacked.', 'RoomNavbar absorbs MobileHeader&rsquo;s job here (2026-08-23 fix) rather than mounting both &mdash; confirmed live: no .mobile-header exists on this route.'),
                    ],
                    'focus': [{'box': [88.3, 0.6, 7.5, 1.1], 'type': 'action', 'label': 'Account (direct link, no menu)'}],
                },
            ],
        },
        {
            'id': 'p6-signout-reload', 'num': 6,
            'name': 'Sign out + reload (AUTH-E1)',
            'desc': 'Settings is currently the ONLY sign-out entry point (the account-menu one from area 09 does not exist &mdash; see P5). A reload afterward keeps the session but drops the subscription.',
            'entry': '/settings (signed in)', 'outcome': 'Guest chrome; a later reload while signed in resets subscription/credits only',
            'steps': [
                {
                    'shot': '15_settings_signout_click.png', 'num': 1,
                    'user': 'On /settings, clicks &ldquo;Sign Out&rdquo;.',
                    'system': 'Clears the persisted session and routes Home.',
                    'exact': ['Settings rows, in order: &ldquo;Terms of Use&rdquo;, &ldquo;Privacy Policy&rdquo;, &ldquo;Unsubscribe&rdquo;, &ldquo;Delete Account&rdquo;, &ldquo;Sign Out&rdquo;'],
                    'limits': [('This is the only reachable Sign Out control today.', 'Area 09&rsquo;s &ldquo;from the header account menu, or from Settings&rdquo; is corrected &mdash; the menu path does not exist (AC-AUTH-05).')],
                    'focus': [{'box': [37.2, 51.1, 42.8, 8.6], 'type': 'action', 'label': 'Sign Out'}],
                },
                {
                    'shot': '16_signout_home_guest.png', 'num': 2,
                    'user': '&mdash;',
                    'system': 'Lands on / with guest chrome &mdash; &ldquo;Login&rdquo; visible, no credits pill.',
                    'limits': ['signOut() clears muse_auth and resets subscribed/profile to guest defaults in the same call (AC-AUTH-05).'],
                    'focus': [{'box': [82.2, 1.0, 4.2, 1.8], 'type': 'info', 'label': 'Login'}],
                },
                {
                    'shot': '17_authE1_before_reload.png', 'num': 3,
                    'user': 'Signs back in and subscribes (Upgrade &rarr; Weekly plan &rarr; Subscribe).',
                    'system': 'Now subscribed &mdash; the Upgrade button disappears and the sidebar profile footer shows the plan name.',
                    'exact': ['Profile footer plan text: &ldquo;Weekly&rdquo;'],
                    'limits': ['Subscribing also credits the plan&rsquo;s allotment immediately (visible in the credit pill) &mdash; not itself an AUTH rule, background only.'],
                    'focus': [{'box': [5.4, 29.2, 7.6, 0.8], 'type': 'info', 'label': 'Subscribed plan'}],
                },
                {
                    'shot': '18_authE1_after_reload.png', 'num': 4,
                    'user': 'Reloads the page.',
                    'system': 'Still signed in &mdash; but subscribed/profile/credits reset to guest defaults; the Upgrade button and &ldquo;Free plan&rdquo; text return.',
                    'exact': ['Profile footer plan text: &ldquo;Free plan&rdquo;'],
                    'limits': [
                        ('Only the logged-in flag survives a reload.', 'It is the sole value backed by localStorage; subscribed/profile/credits are React state, reset on any full reload (AUTH-E1, &#128274; TBD-GL-04).'),
                        'The user is never signed out by this &mdash; loggedIn stays true throughout.',
                    ],
                    'focus': [{'box': [5.4, 26.5, 7.6, 0.8], 'type': 'info', 'label': 'Reset to Free plan'}],
                },
            ],
        },
        {
            'id': 'p7-bare-page', 'num': 7,
            'name': 'Bare page',
            'desc': 'The one route the app shell opts out of entirely.',
            'entry': '/share?id=&hellip;', 'outcome': 'No sidebar, no top bar &mdash; the share page&rsquo;s own header only',
            'steps': [
                {
                    'shot': '19_bare_share.png', 'num': 1,
                    'user': 'Opens a /share link.',
                    'system': 'Renders standalone &mdash; no Sidebar, no RoomNavbar/DetailNavbar, only the share page&rsquo;s own wordmark header.',
                    'limits': [
                        ('AppShell strips the locale prefix and checks for a /share start BEFORE deciding any chrome.', 'The check happens ahead of the sidebar/topbar branch entirely (AC-SHELL-07).'),
                        'The page&rsquo;s own content (player, Download/Create MV) is S9&rsquo;s territory &mdash; not toured here.',
                    ],
                },
            ],
        },
    ],

    # ── reference sections ───────────────────────────────────────────────────
    'states': [
        ('Header: logged out', 'No muse_auth in localStorage, or pre-hydration', 'A single &ldquo;Login&rdquo; button; no credits pill, no Upgrade', '&rarr; logged-in cluster via SignInModal success', '&mdash;'),
        ('Header: logged in, free', 'loggedIn true, subscribed false', 'Credit-balance pill + Upgrade button', '&rarr; subscribed cluster via SubscribeModal; &rarr; guest via Sign Out', 'Sign Out (Settings) or full reload (resets subscribed only, not loggedIn)'),
        ('Header: logged in, subscribed', 'subscribed true (React state, in-memory)', 'Credit-balance pill only, no Upgrade button', '&rarr; free again on Unsubscribe, sign-out, or ANY reload', 'Full page reload (AUTH-E1) or Sign Out'),
        ('AccountMenu (dead)', 'Never reached &mdash; no control opens it on any live route', 'N/A', 'N/A', 'N/A &mdash; see P5-S3'),
    ],

    'errors': [
        (
            'Account-menu trigger has no live entry point',
            'Any attempt to find an avatar/account-menu control on a signed-in route',
            'None exists &mdash; HeaderActions/TopBar/AccountMenu are unreachable dead code',
            'Use the reachable equivalents instead: credit-balance pill, Upgrade button, Sidebar profile footer, Settings Sign Out',
            'P5-S3',
        ),
        (
            'Pre-hydration flash',
            'First paint, before hydratedStore flips true (SHELL-E1 / AUTH-E2)',
            'HeaderActions/MobileHeader reserve a fixed-height placeholder instead of flashing logged-out chrome',
            'Self-resolving once hydrated &mdash; not a user action',
            'N/A &mdash; a timing window, not a state a static screenshot can depict',
        ),
        (
            'Cross-tab auth sync',
            'Sign-in/out completed in a second browser tab (AUTH-E4)',
            'authStore listens for the &ldquo;storage&rdquo; event, so this tab&rsquo;s header updates too',
            'N/A &mdash; automatic',
            'N/A &mdash; needs two live browser contexts, not captured in this single-session run',
        ),
        (
            'Dismissal blocked during the success animation',
            'Escape or backdrop click during the 1.8s post-provider-pick window (AC-AUTH-04)',
            'onClose is swallowed until the animation completes',
            'Wait for the animation to finish, then dismiss normally',
            'N/A &mdash; a screenshot cannot show a blocked click; interaction-only',
        ),
    ],
    'errors_last_col': 'Where',
    'errors_note': (
        'Most of this area&rsquo;s genuine edge cases are timing or multi-context conditions a static '
        'screenshot cannot depict &mdash; the &ldquo;Where&rdquo; column says so plainly rather than '
        'forcing a step reference that does not exist.'
    ),

    # Q-01 (&ldquo;wire AccountMenu back in, or delete it?&rdquo;) was raised by this build and
    # ANSWERED the same day &mdash; product owner: delete. It is therefore a decision
    # (D-10), not an open question. Nothing else in this spec is undecided.
    'open_questions': [],

    'criteria': [
        ('AC-SHELL-01', 'Sidebar (&ge;768px, five destinations) vs. bottom tab bar (&lt;768px, on Home/History only, three items); every other route below 768px shows its own back-affordance instead.', ['P1-S1', 'P1-S5', 'P5-S4'], 'Full six-width sweep is e2e/visual-baseline.spec.ts&rsquo;s job (visual); these steps evidence the ROUTE-SCOPE half this build corrected (AC-SHELL-01, D11).'),
        ('AC-SHELL-02', 'Nav click navigates under the active locale prefix and reflects the active item.', ['P1-S2', 'P1-S3']),
        ('AC-SHELL-03', 'A logged-out click on the gated History nav item opens SignInModal and proceeds to the queued route on success.', ['P2-S1', 'P2-S3', 'P2-S4']),
        ('AC-SHELL-04', 'Logged out: a Login button in each route&rsquo;s own navbar, no credits badge/avatar.', ['P3-S1']),
        ('AC-SHELL-05', 'Logged in: the credits pill; an additional Upgrade button while not subscribed.', ['P3-S2', 'P1-S4']),
        ('AC-SHELL-06', 'RETIRED 2026-08-27 (D-10): the account dropdown it described is deleted, so there is nothing left to assert. Its destinations are covered by AC-SHELL-05 (credits/Upgrade), AC-AUTH-05 (Sign Out, Settings-only) and area 06 (Send Feedback).', ['P5-S3'], 'Kept as a trace target rather than renumbered. P5-S3 remains the evidence: it sweeps five routes for an account menu and finds none.'),
        ('AC-SHELL-07', '/share renders bare, no sidebar/top bar.', ['P7-S1']),
        ('AC-SHELL-08', 'Renders at all six widths with no overflow.', [], 'Visual-only; six-width sweep is e2e/visual-baseline.spec.ts&rsquo;s job, not this per-path storyboard (D8: this spec captures 1403&times;697 and 375&times;812 only).'),
        ('AC-AUTH-01', 'A guarded route entered logged out renders no content and opens SignInModal.', ['P4-S1']),
        ('AC-AUTH-08', '/mv/room and /song/create render their full compose screen for a guest with no auto-modal; the gate is action-level inside them.', ['P3-S1'], 'Only the &ldquo;renders fully, no auto-gate&rdquo; half is this spec&rsquo;s to show; the action-level gate itself is area 02/03&rsquo;s territory (S2/S3).'),
        ('AC-AUTH-02', 'Mock sign-in success sets the persisted flag and runs any queued action.', ['P2-S3', 'P3-S2']),
        ('AC-AUTH-03', 'Dismissing an AuthGuard-opened modal goes Home; dismissing after a gated-nav click leaves the page unchanged.', ['P4-S2', 'P2-S2']),
        ('AC-AUTH-04', 'Modal dismissal is blocked while the success animation plays.', [], 'A screenshot cannot show a blocked click &mdash; interaction-only, not this storyboard&rsquo;s shape.'),
        ('AC-AUTH-05', 'Sign out clears the logged-in flag and resets subscription/profile to guest defaults.', ['P6-S1', 'P6-S2']),
        ('AC-AUTH-06', 'Only the logged-in flag persists across reload.', ['P6-S3', 'P6-S4']),
        ('AC-AUTH-07', 'SignInModal renders correctly across widths.', ['P2-S1', 'P2-S4'], 'Two of the four named widths (1403 desktop, 375 phone); the full sweep is e2e/visual-baseline.spec.ts&rsquo;s job.'),
    ],

    'prototype_deltas': [
        (
            'Sign-in is entirely mock',
            'Picking Apple or Google runs a fixed 1.8s timer, then a canned success message &mdash; no real OAuth handshake, no provider is actually contacted.',
            'A real auth integration needs a provider, a session/token model, and a decision on where it sits relative to MuseApi &mdash; entirely undefined today (TBD-AUTH-01).',
        ),
        (
            'Only the logged-in flag persists',
            'subscribed/profile/credits are React state, reset to guest defaults on any full reload or sign-out.',
            'Production must persist all account state server-side, not just a boolean (TBD-GL-04).',
        ),
    ],

    'decisions': [
        ('D-01', 'P5 was scoped as &ldquo;Account menu, walked in place&rdquo; &mdash; but the account MENU (AccountMenu.tsx) turned out to have no live trigger anywhere in the app. How to capture it?', 'Renamed the path &ldquo;Account entry points&rdquo; and walked the REACHABLE equivalents instead (credit-balance&rarr;Upgrade dialog, sidebar profile footer&rarr;/profile), plus a DOM-sweep step proving no menu exists on five routes. Filed as an app-bug finding in the session report (no src/ authority to fix it) and corrected specs/areas/01-app-shell.md &sect;1/&sect;2/&sect;3/AC-SHELL-06 under D11, rather than fabricating a screenshot of dead UI.'),
        ('D-02', 'Area 01/09 both quote the logged-out control as &ldquo;Sign In&rdquo; &mdash; does the live app say that?', 'No &mdash; every reachable trigger (RoomNavbar, DetailNavbar, home/Navbar) renders &ldquo;Login&rdquo;. &ldquo;Sign In&rdquo; exists only in the dead HeaderActions. This spec quotes &ldquo;Login&rdquo; throughout; area 01 AC-SHELL-04 and area 09 AUTH-P1-S1 are corrected.'),
        ('D-03', 'Does MobileTabBar/MobileHeader render on every route below 768px, as AC-SHELL-01 implied, or only some?', 'Only Home and History (confirmed live: absent on /watch, /mv/room, /profile). The phone pass below shoots exactly those two chrome states rather than a generic &ldquo;phone header&rdquo; reused elsewhere &mdash; there isn&rsquo;t one. AC-SHELL-01 corrected accordingly.'),
        ('D-04', 'A free user&rsquo;s credit-balance pill opened &ldquo;Upgrade Your Plan&rdquo;, not a Buy Credits pack list &mdash; bug or intended?', 'Intended (CR-06, the component&rsquo;s own code comment: a non-subscriber never reaches the pack list). Captured as-is (P5-S1) rather than forcing a subscribed state first to reach the &ldquo;real&rdquo; Buy Credits dialog &mdash; that dialog is S5&rsquo;s territory either way.'),
        ('D-05', 'Sidebar&rsquo;s actual nav-item text is &ldquo;AI Music Video&rdquo;/&ldquo;AI Song&rdquo;, not area 01&rsquo;s &ldquo;Create MV&rdquo;/&ldquo;Create Song&rdquo; &mdash; which does this spec quote?', 'The real on-screen text, everywhere in `exact`. Area 01&rsquo;s shorthand is a route label, not a claim about the rendered string, so it is left as-is rather than corrected.'),
        ('D-06', 'Area 09 says Sign Out is reachable from &ldquo;the header account menu, or Settings&rdquo; &mdash; both?', 'Settings only, today &mdash; the account-menu path does not exist (D-01). Area 09 AUTH-P4-S1 corrected; P6 captures the one reachable entry point.'),
        ('D-07', 'Which non-English locale demonstrates prefix preservation (P1-S3)?', 'jpn, picked arbitrarily from the 9 supported locales &mdash; reached by navigating directly to /jpn/&hellip; rather than through a UI language switcher, since a signed-in user has no in-app locale switcher (Navbar&rsquo;s LanguagePicker only renders logged-out, on Home).'),
        ('D-08', 'Phone viewport for the D8 exception?', '375&times;812 &mdash; well inside PHONE_QUERY (max-width: 767px) and the &ldquo;375&rdquo; tier of AGENTS.md&rsquo;s six-width scale. Documented in capture_screenshots.py&rsquo;s docstring so a later re-capture does not drift.'),
        ('D-09', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo yet, same as S1/S4.'),
        ('D-10', 'Q-01 &mdash; the account dropdown (AccountMenu &larr; HeaderActions &larr; TopBar) was reachable from no route. Wire a trigger back in, or delete it?', '<b>Deleted</b> (product owner, 2026-08-27, same day this build raised it). All three files are removed from src/, and AppShell&rsquo;s OWN_CHROME list went with them &mdash; its only job was gating TopBar. The invariant that replaces it: below /, the shell draws NO header; every route renders its own, so a new route must bring one. This spec&rsquo;s steps are unchanged by the deletion &mdash; every one of them was already photographing the reachable surface, and P5-S3&rsquo;s negative sweep is now true by construction rather than by accident. Area 01&rsquo;s AC-SHELL-06 is retired (id kept and struck, not renumbered, so QA traces do not silently re-point).'),
    ],

    'references': [],

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Entry["Any route, signed in"] --> Nav{Nav click?}\n'
        '  Nav -->|item| Route["Navigate, active state updates (locale-prefixed)"]\n'
        '  Entry --> Guest{Signed out?}\n'
        '  Guest -->|History nav / MobileTabBar tab| GatedNav["SignInModal, target queued"]\n'
        '  GatedNav -->|sign in| Route\n'
        '  GatedNav -->|dismiss| StayPut["Stay put &mdash; no redirect"]\n'
        '  Guest -->|direct URL: /history /profile /settings| Guard["AuthGuard: renders nothing, SignInModal opens"]\n'
        '  Guard -->|sign in| SamePage["Same URL now renders"]\n'
        '  Guard -->|dismiss| Home["router.replace(home)"]\n'
        '  Guest -->|Login button, any own-chrome route| HeaderSignIn["SignInModal, no queued action"]\n'
        '  HeaderSignIn -->|sign in| StaySamePage["Same page, logged-in cluster"]\n'
        '  Entry --> Account["Credit pill &rarr; Upgrade dialog (S5) &middot; Profile footer &rarr; /profile (S7)"]\n'
        '  Entry --> Out{Sign out?}\n'
        '  Out -->|Settings| Reset["Guest defaults, routed Home"]\n'
        '  Entry --> Reload["Full reload: loggedIn persists, subscribed/profile reset (AUTH-E1)"]\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'AppShell.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'Sidebar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'MobileTabBar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'MobileHeader.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'RoomNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'DetailNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'auth', 'AuthGuard.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'auth', 'SignInModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'home', 'Navbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'profile', 'SettingsView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'SubscribeModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'BuyCreditsModal.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'i18n', 'dictionaries', 'en.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'user.ts'),
    ],
    'strings_ignore': [
        # Interpolated at render time ("Welcome back, {firstName} · via
        # {provider}") — the curly-brace template is not literal on-screen
        # text. Confirmed live: the capture shows "Welcome back, Scott · via
        # Apple" (09_header_signin_success.png).
        'Welcome back, Scott &middot; via Apple',
        # lint_spec.py's ENT map converts the &rarr; entity to ASCII "->" for
        # comparison, but the live source (MobileTabBar.tsx:146,171) uses the
        # real Unicode arrow "→" — the two can never byte-match. Confirmed
        # directly: `grep '→' src/components/shell/MobileTabBar.tsx` finds
        # both lines verbatim, and the live capture shows the real arrow
        # (specs/screenshots/_review/21_mobile_create_sheet.webp).
        'Selfie + music -> cinematic MV',
        'Lyrics + style -> original track',
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
