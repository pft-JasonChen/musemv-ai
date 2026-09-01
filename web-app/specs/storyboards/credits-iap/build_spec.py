#!/usr/bin/env python3
"""yco-spec build script — Credits & IAP (S5) storyboard.

Screenshot source: **live app capture**, not a static prototype — the same
convention every other spec in this programme follows. Each screenshot in
specs/screenshots/ was captured by driving the real Next.js dev server with
Playwright, signed in via the same `localStorage['muse_auth']` seed the e2e
specs use. Full-page shots throughout EXCEPT the dialog/toast/demo-panel
states, which use a plain viewport shot — every DpDialog overlay, every toast
and the demo panel are `position: fixed`, and a full-page capture's
artificially tall viewport repositions all three (see `capture_screenshots.py`
for the same note against its own `viewport_shot`).

ONE VIEWPORT — D8 stands: desktop 1403x697 only. Confirmed with the product
owner at this spec's Phase 0 gate (2026-09-01): the three IAP surfaces are
dialogs whose six-width behaviour is already a VISUAL criterion (AC-CR-05,
swept by `e2e/visual-baseline.spec.ts`), and a storyboard walks behaviour,
which does not change by width. **One thing that DOES change by width is
recorded as a delta rather than captured** — below 1024px `SubscribeModal`
collapses its two self-contained cards into a shared Basic/Pro `selectedTier`
toggle with a single Subscribe button. That is a real interaction difference
and it is in `prototype_deltas`, not silently omitted.

SCOPE — agreed at the Phase 0 gate, 2026-09-01
    Six paths, 21 captures. Larger than PLAN.md's "~4 paths / ~16 shots"
    estimate for two reasons worth stating so the growth is not mistaken for
    scope creep: (1) `SubscribeModal` gained a Weekly/Monthly/Yearly duration
    Tab Bar with two tiers each on 2026-08-28, so "the plan picker" is six
    plans across three tabs rather than one flat list; and (2) the seven
    empty/error states shipped and went `live` in `demoStore.ts`, so P6 has
    real screens to photograph where the estimate assumed none.

THREE BROWSER SESSIONS, NOT ONE — and it is a source-reading finding, not a
style choice. `capture_screenshots.py`'s header carries the full reasoning;
the short version is that **every `openSubscribe()` call site in the app is
conditioned on `!subscribed`**, so once an account IS a subscriber there is no
control anywhere that reopens `SubscribeModal`. CR-05's "already on Muse Pro"
branch therefore has exactly one real trigger: the dialog stays mounted while
`subscribed` flips true underneath it. That is what P2 captures, and it is why
P2 lives in the demo session rather than in P1's.

lint_spec.py's STRINGS check (`prototype_src`) only scans .html/.js by
directory; this repo is TypeScript/React, so the relevant files are listed
individually below, following S1/S3/S4/S6/S7's precedent.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/credits-iap
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, 'skills', 'yco-spec'))
import spec_builder  # noqa: E402

FEAT = HERE

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'Credits &amp; IAP',
    'breadcrumb': 'YouCam Muse Web &rarr; Credits &amp; IAP',
    'author': 'Jason Chen', 'date': '2026-09-01', 'status': 'Draft',
    'version': 'v1',
    'actor_label': 'WEB UI',
    'prototype_url': '',    # no separate hosted prototype — the live dev app IS the subject
    'guideline': '',

    # ── Feature block ───────────────────────────────────────────────────────
    'description': (
        'The whole monetization surface: <code>SubscribeModal</code> (Muse Pro &mdash; six plans '
        'across a Weekly/Monthly/Yearly duration Tab Bar), <code>BuyCreditsModal</code> (six '
        'credit packs, subscriber-only), and the <code>/profile/credits</code> route (balance, '
        'All/Spend/Earn ledger filter, and a purchase CTA that branches on subscription state).'
    ),
    'background': (
        'The eighth spec in this repo&rsquo;s yco-spec storyboard programme (specs/storyboards/'
        'PLAN.md), covering area 07 end to end. It was on hold behind two things that both '
        'cleared on 2026-09-01: pricing (the &ldquo;YCM FINAL Pricing (confirmed)&rdquo; deck '
        'settled all six plans and all six pack prices) and the empty/error states (which turned '
        'out to be built and `live` already, not awaiting artwork).'
    ),
    'goal': 'Give QA a screenshot-led walkthrough of every Credits/IAP behavior they can follow without cross-referencing code.',

    # ── overview card ──────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YouCam Muse Web &mdash; captured at 1403&times;697 (desktop only, D8)'],
        ['Audience', 'QA'],
        ['Scope', 'SubscribeModal (all three duration tabs, both tiers, subscribe, and the already-Pro branch), BuyCreditsModal (packs, selection, purchase), the CR-06 free-user gate on every entry point, /profile/credits (balance, filter, ledger, branching CTA), and the apiError / creditsEmpty states.'],
        ['Out of scope', 'The in-flow insufficient-balance route into IAP (GL-01/AC-CR-07 &mdash; it starts on /mv/room or /song/create, areas 02/03); how generation SPENDS credits (area 11); real store integration, which does not exist (see Prototype vs production).'],
        ['Source', 'specs/areas/07-credits-iap.md (&sect;&sect;1-9, AC-CR-01..11) and the running app'],
    ],

    'short_nav': [
        'Subscribe', 'Already Pro', 'Buy Credits', 'Free-user gate', 'Credits detail', 'Error &amp; empty',
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'paths': [
        {
            'id': 'p1-subscribe', 'num': 1,
            'name': 'Subscribe to Muse Pro',
            'desc': 'Where the dialog opens from, the duration Tab Bar and its six plans, and what a Subscribe press actually changes.',
            'entry': 'Any Upgrade control while signed in and NOT subscribed',
            'outcome': 'The account becomes a subscriber, the plan&rsquo;s own credits are granted, and the shell reflects PRO',
            'steps': [
                {
                    'shot': '01_profile_before_subscribe.png', 'num': 1,
                    'user': 'Opens /profile while signed in and not subscribed.',
                    'system': 'Three separate Upgrade controls are visible &mdash; the Muse Pro row&rsquo;s pill, the sidebar footer, and the header crown. All three open the same dialog.',
                    'exact': [
                        'Sidebar plan label: &ldquo;Free plan&rdquo;',
                    ],
                    'limits': [
                        ('Every Upgrade entry point in the app opens the SAME `SubscribeModal`; none of them is a different screen.',
                         'Area 07 &sect;1. The full set is the Muse Pro row, the sidebar footer, the header crown, and (on other routes) RoomNavbar/DetailNavbar/MobileHeader plus MV Settings&rsquo; High-quality crown.'),
                        ('Each one is conditioned on NOT being subscribed.',
                         'Once subscribed, none of them renders an Upgrade affordance any more &mdash; which is why P2 needs the route it uses.'),
                    ],
                },
                {
                    'shot': '02_subscribe_open_weekly.png', 'num': 2,
                    'user': 'Taps any Upgrade control.',
                    'system': 'The plan dialog opens on the Weekly tab, showing that duration&rsquo;s two tiers side by side, each with its own Subscribe button.',
                    'exact': [
                        'Dialog title: &ldquo;Upgrade Your Plan&rdquo;',
                        'Duration tabs: &ldquo;Weekly&rdquo;, &ldquo;Monthly&rdquo;, &ldquo;Yearly&rdquo;',
                        'Weekly: &ldquo;$9.99&rdquo; / week, &ldquo;200&rdquo; Weekly Credits, badge &ldquo;MOST POPULAR&rdquo;',
                        'Weekly Pro: &ldquo;$29.99&rdquo; / week, &ldquo;1,000&rdquo; Weekly Credits, badge &ldquo;BEST VALUE&rdquo;',
                        'Benefit rows: &ldquo;MV without Watermark&rdquo;, &ldquo;Enable Download MV &amp; Song&rdquo;, &ldquo;Priority AI Generation&rdquo;, &ldquo;Commercial License&rdquo;',
                        'Expiry line: &ldquo;Credits Expire Weekly&rdquo;',
                        'Footer: &ldquo;Terms of Use&rdquo; | &ldquo;Privacy Policy&rdquo;',
                    ],
                    'limits': [
                        ('There is NO shared selection on desktop &mdash; each card subscribes itself.',
                         'AC-CR-09. `DEFAULT_PLAN_ID` still exists as the Business Model&rsquo;s stated default but does not drive this screen.'),
                        ('The billing period is per-plan, not a fixed string.',
                         'The Yearly cards read &ldquo;/ year&rdquo;, not &ldquo;/ week&rdquo; &mdash; see P1-S4. The designer comp hardcodes &ldquo;/ week&rdquo; on every card; the build deliberately does not.'),
                        ('The two footer links are REAL URLs, not placeholders.',
                         'AC-CR-04. They replaced a &ldquo;Restore Purchases | Demo only&rdquo; row on 2026-09-01 &mdash; web does not offer Restore Purchases at all, it is an app-only affordance.'),
                    ],
                },
                {
                    'shot': '03_subscribe_monthly.png', 'num': 3,
                    'user': 'Taps the Monthly tab.',
                    'system': 'The same two-tier layout re-renders with the Monthly plans; the expiry line follows the duration.',
                    'exact': [
                        'Monthly: &ldquo;$34.99&rdquo; / month, &ldquo;1,000&rdquo; Monthly Credits',
                        'Monthly Pro: &ldquo;$49.99&rdquo; / month, &ldquo;2,000&rdquo; Monthly Credits',
                        'Expiry line: &ldquo;Credits Expire Monthly&rdquo;',
                    ],
                    'limits': [
                        ('Switching a tab changes only which pair of plans is shown.',
                         'It is not a selection and it commits nothing &mdash; no purchase happens until a card&rsquo;s own Subscribe is pressed.'),
                    ],
                },
                {
                    'shot': '04_subscribe_yearly.png', 'num': 4,
                    'user': 'Taps the Yearly tab.',
                    'system': 'The Yearly plans render, reading &ldquo;/ year&rdquo;, and the yearly cards carry one benefit the other durations do not.',
                    'exact': [
                        'Yearly: &ldquo;$59.99&rdquo; / year, &ldquo;2,000&rdquo; Yearly Credits',
                        'Yearly Pro: &ldquo;$89.99&rdquo; / year, &ldquo;4,000&rdquo; Yearly Credits',
                        'Expiry line: &ldquo;Credits Expire Yearly&rdquo;',
                    ],
                    'limits': [
                        ('Yearly plans carry an extra benefit row the weekly/monthly ones do not.',
                         '`YEARLY_EXTRA_FEATURES` &mdash; see the framed region in this capture.'),
                        ('All six prices are the confirmed FINAL web pricing.',
                         'Area 07 &sect;1. Web and app are priced separately and must not be reconciled against each other.'),
                    ],
                },
                {
                    'shot': '05_subscribe_click_toast.png', 'num': 5,
                    'user': 'Presses Subscribe on one of the cards.',
                    'system': 'The account becomes a subscriber, that plan&rsquo;s credits are added to the balance, a toast confirms it, and the dialog closes.',
                    'limits': [
                        ('The credits granted are the PICKED plan&rsquo;s own `credits` value, not a fixed number.',
                         'AC-CR-02. This is why P1 subscribes with a real card press rather than the demo panel&rsquo;s shortcut &mdash; the shortcut could not demonstrate it.'),
                        ('No payment step of any kind occurs.',
                         'AC-CR-01/02 are satisfied entirely in memory &mdash; see Prototype vs production.'),
                    ],
                },
                {
                    'shot': '06_profile_after_subscribe_shell.png', 'num': 6,
                    'user': '&mdash;',
                    'system': 'The shell reflects the new state: the sidebar footer names the plan instead of &ldquo;Free plan&rdquo;, and the Muse Pro row loses its Upgrade pill.',
                    'limits': [
                        ('The header credit count now includes the granted credits.',
                         'AC-CR-09 &mdash; the count and the expiry cadence both track the plan actually subscribed to.'),
                        'The Muse Pro row now navigates to /profile/credits instead of opening the dialog (P5).',
                    ],
                },
            ],
        },
        {
            'id': 'p2-already-pro', 'num': 2,
            'name': 'Already on Muse Pro',
            'desc': 'The CR-05 branch that prevents a subscriber buying a second subscription &mdash; and the one route by which it can actually be reached.',
            'entry': 'The plan dialog is open when `subscribed` becomes true',
            'outcome': 'The plan cards are replaced by a confirmation with a single Done action',
            'steps': [
                {
                    'shot': '07_subscribe_reopen_already_pro.png', 'num': 1,
                    'user': 'Is already a subscriber while the plan dialog is open.',
                    'system': 'The six plan cards are replaced by an already-subscribed confirmation naming the current plan&rsquo;s credit allowance, with Done as the only action.',
                    'exact': [
                        'Dialog title: &ldquo;Muse Pro&rdquo;',
                        'Heading: &ldquo;You&rsquo;re already on Muse Pro&rdquo;',
                        'Action: &ldquo;Done&rdquo;',
                    ],
                    'limits': [
                        ('There is no plan picker and no way to re-subscribe from this state.',
                         'AC-CR-06 &mdash; without this branch a subscriber could buy a second subscription.'),
                        ('This state has NO live trigger once you are a subscriber.',
                         'Every `openSubscribe()` call site in the app is conditioned on `!subscribed`, so nothing reopens the dialog afterwards. The only way it renders for real is the one the code supports: the dialog stays mounted while `subscribed` flips true underneath it. Recorded as Q-01.'),
                        ('Restore Purchases is NOT reachable here, and no longer exists anywhere.',
                         'It was removed on 2026-09-01 &mdash; web does not support it. AC-CR-06&rsquo;s old warning about it being unreachable from this branch is therefore moot.'),
                    ],
                },
            ],
        },
        {
            'id': 'p3-buy-credits', 'num': 3,
            'name': 'Buy a credit pack (subscriber)',
            'desc': 'The six packs, the default selection, the discount presentation, and what a purchase changes.',
            'entry': 'Any Buy-Credits entry point while subscribed',
            'outcome': 'The pack&rsquo;s credits are added to the balance and the dialog closes',
            'steps': [
                {
                    'shot': '08_buycredits_packs_default.png', 'num': 1,
                    'user': 'Opens Buy Credits while subscribed.',
                    'system': 'The current balance sits above six packs, largest first, with one pre-selected.',
                    'exact': [
                        'Dialog title: &ldquo;Buy Credits&rdquo;',
                        'Balance label: &ldquo;YOUR BALANCE&rdquo;',
                        'Section label: &ldquo;Buy Credit Pack&rdquo;',
                        'Pack sizes, top to bottom: &ldquo;8,000&rdquo;, &ldquo;5,000&rdquo;, &ldquo;2,000&rdquo;, &ldquo;1,000&rdquo;, &ldquo;600&rdquo;, &ldquo;300&rdquo;',
                        'Tier badges: &ldquo;BEST VALUE&rdquo; on 2,000, &ldquo;POPULAR&rdquo; on 1,000',
                        'Action: &ldquo;Buy Now&rdquo;',
                    ],
                    'limits': [
                        ('2,000 is pre-selected.',
                         '`DEFAULT_CREDIT_PACK_ID`, the Business Model&rsquo;s stated default.'),
                        ('A card can carry its tier badge and a discount badge at the same time.',
                         'Visible on 2,000 and 1,000 in this capture.'),
                        ('The discount presentation is a set of UI ELEMENTS; its numbers are not spec.',
                         'AC-CR-10 &mdash; a struck-through list price, an &ldquo;N% OFF&rdquo; badge per pack, and the discounted price on the CTA. The percentage, its rounding, and whether any discount runs at all are backend/marketing-owned and change at will.'),
                        ('Purchased credits are valid 2 years and are non-refundable.',
                         'AC-CR-04 &mdash; this dialog carries that copy; the plan dialog and the ledger do not.'),
                    ],
                },
                {
                    'shot': '09_buycredits_select_pack.png', 'num': 2,
                    'user': 'Taps a different pack.',
                    'system': 'Selection moves to the tapped pack; the CTA follows it.',
                    'limits': [
                        'Exactly one pack is selected at a time; nothing is committed until Buy Now.',
                    ],
                },
                {
                    'shot': '10_buycredits_buy_toast.png', 'num': 3,
                    'user': 'Presses Buy Now.',
                    'system': 'The pack&rsquo;s credits are added to the balance, a toast confirms it, and the dialog closes.',
                    'limits': [
                        ('No payment step occurs &mdash; the balance is mutated directly.',
                         'AC-CR-01. See Prototype vs production.'),
                        ('The toast only appears for a purchase made from /profile/credits&rsquo; own Buy More.',
                         'The shared dialog every header credit pill opens is mounted with no `onPurchased` callback anywhere in the app, so buying through a header pill adds the credits silently. Recorded as Q-02 &mdash; this is a real inconsistency, not a capture artefact.'),
                    ],
                },
            ],
        },
        {
            'id': 'p4-free-user-gate', 'num': 4,
            'name': 'Free user and Buy Credits (CR-06)',
            'desc': 'Credit packs are subscriber-only. What a free user sees at each entry point instead.',
            'entry': 'Any credits entry point while signed in and NOT subscribed',
            'outcome': 'The plan dialog opens; no Buy-Credits UI is ever shown',
            'steps': [
                {
                    'shot': '11_free_profile_entry_points.png', 'num': 1,
                    'user': 'Is signed in but not subscribed.',
                    'system': 'Every monetization entry point offers Subscribe; the credit pill is present but leads to the plan dialog, not to packs.',
                    'limits': [
                        ('Credit packs are subscriber-only.',
                         'AC-CR-08 &mdash; the Business Model&rsquo;s Final Decision, independently confirmed by the pricing deck&rsquo;s own &ldquo;free user can buy? no&rdquo; row.'),
                    ],
                },
                {
                    'shot': '12_free_creditpill_opens_subscribe.png', 'num': 2,
                    'user': 'Taps the credit pill (the Buy-Credits entry point).',
                    'system': 'The plan dialog opens directly.',
                    'exact': [
                        'Dialog title: &ldquo;Upgrade Your Plan&rdquo;',
                    ],
                    'limits': [
                        ('There is NO intermediate gate screen.',
                         'AC-CR-08 &mdash; no &ldquo;credit packs are a Muse Pro perk&rdquo; interstitial and no &ldquo;See Muse Pro Plans&rdquo; step. `BuyCreditsModal` renders `SubscribeModal` itself, which is what makes the label and the destination impossible to drift apart.'),
                    ],
                },
            ],
        },
        {
            'id': 'p5-credits-detail', 'num': 5,
            'name': 'Credits detail',
            'desc': 'The /profile/credits route: balance, the All/Spend/Earn filter, the ledger, and a CTA that branches on subscription state.',
            'entry': '/profile/credits (auth-gated)',
            'outcome': 'Balance + filtered ledger + a purchase CTA appropriate to the account',
            'steps': [
                {
                    'shot': '13_credits_detail_subscriber_all.png', 'num': 1,
                    'user': 'Opens /profile/credits while subscribed.',
                    'system': 'A balance card sits above a three-way filter and the transaction ledger.',
                    'exact': [
                        'Route title: &ldquo;Credits Detail&rdquo;',
                        'Balance label: &ldquo;YOUR BALANCE&rdquo;',
                        'Filter tabs: &ldquo;All&rdquo;, &ldquo;Spend&rdquo;, &ldquo;Earn&rdquo;',
                        'CTA (subscriber): &ldquo;Buy More&rdquo;',
                    ],
                    'limits': [
                        ('This is a ROUTE, not a modal.',
                         'It is deep-linkable and survives browser back/forward &mdash; the reason it stopped being a modal on 2026-08-11.'),
                        ('The ledger is a fixed seed and does NOT reflect purchases made in this session.',
                         'AC-CR-03 &mdash; the balance card is live, the rows below it are not. See Prototype vs production.'),
                    ],
                },
                {
                    'shot': '14_credits_detail_spend.png', 'num': 2,
                    'user': 'Taps Spend.',
                    'system': 'The ledger filters to debits only.',
                    'limits': [
                        ('The filter derives from the SIGN of each entry&rsquo;s amount.',
                         'There is no stored category &mdash; Spend is the negative rows, Earn the positive ones.'),
                    ],
                },
                {
                    'shot': '15_credits_detail_earn.png', 'num': 3,
                    'user': 'Taps Earn.',
                    'system': 'The ledger filters to credits only; All restores every row.',
                },
                {
                    'shot': '16_credits_detail_free_getmusepro.png', 'num': 4,
                    'user': 'Opens the same route as a free user.',
                    'system': 'The screen is identical except the CTA, which offers the subscription instead of packs.',
                    'exact': [
                        'CTA (free user): &ldquo;Get Muse Pro&rdquo;',
                    ],
                    'limits': [
                        ('Both labels open the same control, which itself branches on subscription state.',
                         'AC-CR-08 &mdash; that is deliberate: the label and its destination cannot drift apart, because there is only one destination.'),
                        ('A brand-new account never sees an EMPTY ledger in practice.',
                         'Sign-up grants 10 credits, so there is always at least one entry. The genuinely-empty case is P6-S4.'),
                    ],
                },
            ],
        },
        {
            'id': 'p6-error-empty', 'num': 6,
            'name': 'Error &amp; empty states',
            'desc': 'The backend-failure state on both dialogs and the empty ledger &mdash; all three reachable only through the ?demo=1 panel.',
            'entry': '?demo=1, then the matching switch',
            'outcome': 'Each surface shows its own failure or empty treatment',
            'steps': [
                {
                    'shot': '17_apierror_subscribemodal.png', 'num': 1,
                    'user': 'Turns on the demo panel&rsquo;s backend-error switch, then opens the plan dialog.',
                    'system': 'The plan cards are replaced by an error state with a single retry action; the dialog keeps its own title.',
                    'exact': [
                        'Heading: &ldquo;Something Went Wrong&rdquo;',
                        'Body: &ldquo;We couldn&rsquo;t load this right now. Please check your connection and try again.&rdquo;',
                        'Action: &ldquo;Retry&rdquo;',
                    ],
                    'limits': [
                        ('The error replaces the dialog BODY, not the dialog.',
                         'The title and close control stay, so the user is never trapped.'),
                        ('This state has no organic trigger in this build.',
                         'There is no real backend to fail &mdash; the `?demo=1` panel is the only way to reach it, which is exactly why the panel exists.'),
                    ],
                },
                {
                    'shot': '18_apierror_buycreditsmodal.png', 'num': 2,
                    'user': 'With the same switch on, opens Buy Credits as a subscriber.',
                    'system': 'The pack list is replaced by the same error treatment.',
                    'limits': [
                        ('Both dialogs read the same flag and render the same treatment.',
                         'One state, two surfaces &mdash; not two independently-worded errors.'),
                    ],
                },
                {
                    'shot': '19_apierror_freeuser_redirect.png', 'num': 3,
                    'user': 'With the same switch on, opens Buy Credits as a FREE user.',
                    'system': 'The plan dialog&rsquo;s error state shows &mdash; not a Buy-Credits error.',
                    'limits': [
                        ('CR-06 is applied BEFORE the error state.',
                         'AC-CR-08 holds even when the backend is failing: a free user is redirected to the plan dialog first, so the error they see is that dialog&rsquo;s. This is the interaction between the two rules, and it is the reason this step exists as its own capture.'),
                    ],
                },
                {
                    'shot': '20_creditsempty_all.png', 'num': 4,
                    'user': 'Turns on the demo panel&rsquo;s empty-ledger switch and opens /profile/credits.',
                    'system': 'The balance card and filter stay; the ledger is replaced by an empty state.',
                    'exact': [
                        'Heading: &ldquo;No activity yet&rdquo;',
                        'Body: &ldquo;Start creating AI Music Videos or songs to see your credit history here.&rdquo;',
                    ],
                    'limits': [
                        ('The balance card and the filter remain &mdash; only the rows are replaced.',
                         'The balance is real state; the ledger is what is empty.'),
                    ],
                },
                {
                    'shot': '21_creditsempty_spend.png', 'num': 5,
                    'user': 'Taps Spend, then Earn.',
                    'system': 'Every filter shows the same empty state.',
                    'limits': [
                        'Verified for all three tabs during capture; only Spend is shown, since Earn is identical.',
                    ],
                },
            ],
        },
    ],

    'states': [
        ('Plan dialog', 'Not subscribed', 'Duration Tab Bar + the duration&rsquo;s two plan cards', 'A card&rsquo;s Subscribe &rarr; subscriber + that plan&rsquo;s credits', 'Close, or Subscribe'),
        ('Plan dialog', 'Subscribed (flipped while open)', 'Already-on-Muse-Pro confirmation, no cards', 'Done &rarr; closes; nothing else is offered', 'Done'),
        ('Plan dialog', 'Backend error (demo)', 'Error body, dialog title retained', 'Retry', 'Close, or Retry'),
        ('Buy Credits', 'Subscribed', 'Balance + six packs, 2,000 pre-selected', 'Buy Now &rarr; credits added', 'Close, or Buy Now'),
        ('Buy Credits', 'NOT subscribed', 'Renders the plan dialog instead &mdash; no pack UI at all', 'Whatever the plan dialog offers', 'N/A (CR-06)'),
        ('Credits detail CTA', 'Subscribed', '&ldquo;Buy More&rdquo;', 'Opens Buy Credits (packs)', 'N/A'),
        ('Credits detail CTA', 'NOT subscribed', '&ldquo;Get Muse Pro&rdquo;', 'Opens Buy Credits, which renders the plan dialog', 'N/A'),
        ('Credits ledger', 'Empty (demo)', 'Balance + filter retained, rows replaced by an empty state', 'Filters still switch; all three are empty', 'N/A'),
    ],

    'errors': [
        (
            'Backend load failure (plan dialog)',
            'The demo panel&rsquo;s backend-error switch; in production, any failure loading plans',
            'Dialog body replaced by an error state with Retry; the title and close control remain',
            'Retry, or close the dialog',
            'P6-S1',
        ),
        (
            'Backend load failure (Buy Credits)',
            'Same switch, opened as a subscriber',
            'Pack list replaced by the same error treatment',
            'Retry, or close the dialog',
            'P6-S2',
        ),
        (
            'Backend load failure while NOT subscribed',
            'Same switch, opened as a free user',
            'CR-06 applies first, so the PLAN dialog&rsquo;s error is what renders',
            'Retry, or close the dialog',
            'P6-S3',
        ),
        (
            'Empty credit ledger',
            'The demo panel&rsquo;s empty-ledger switch; in production, an account with no transactions',
            'Balance and filter retained; rows replaced by an empty state, identically on all three filters',
            'Create something, or buy credits',
            'P6-S4, P6-S5',
        ),
        (
            'Insufficient balance for a generation',
            'Starting an MV/song job the balance cannot cover',
            'The CTA opens the buy-credits IAP instead of starting the job; for a free user that is the plan dialog (CR-06)',
            'Subscribe or buy a pack, then retry the generation',
            'Not captured &mdash; the trigger lives on /mv/room and /song/create (areas 02/03). Specified by AC-CR-07.',
        ),
    ],
    'errors_last_col': 'Where',
    'errors_note': (
        'Every error in this table except the last is reachable ONLY through the `?demo=1` panel &mdash; '
        'there is no real backend in this build to fail on its own. The last one has a real trigger, '
        'but it starts on another area&rsquo;s screen, so the &ldquo;Where&rdquo; column names the criterion '
        'that specifies it instead of a step in this spec.'
    ),

    'open_questions': [
        (
            'Q-01',
            'CR-05&rsquo;s already-on-Muse-Pro state has no live trigger: every `openSubscribe()` call site is conditioned on `!subscribed`, so once an account subscribes nothing reopens the dialog. It renders only if `subscribed` flips while the dialog is already open. Is the state still wanted, and if so does something need to be able to open it?',
            'Whether P2 describes a state a real user can ever reach, or only a defensive branch',
            'Product owner',
        ),
        (
            'Q-02',
            'A pack purchase toasts only when it was started from /profile/credits&rsquo; own Buy More. The shared dialog every header credit pill opens is mounted with no `onPurchased` callback anywhere in the app, so buying through a header pill adds credits with no confirmation at all. Intended, or an oversight?',
            'Whether P3-S3&rsquo;s confirmation is a rule or an accident of which entry point was used',
            'Product owner / RD',
        ),
        (
            'Q-03',
            'The confirmed pricing deck lists PRICES but no store identifiers, so the build still carries app-shaped SKUs (`ycm_ios_*` for packs, `subscribe_*_ycm` for plans) that have never been confirmed for web.',
            'Real store integration &mdash; RD cannot wire a purchase to an unconfirmed SKU',
            'RD (tracked as TBD-CR-11)',
        ),
        (
            'Q-04',
            'What does &ldquo;cost per the Credit Consume MSR&rdquo; resolve to, generally? (Carried per the programme&rsquo;s own convention; no step in THIS spec quotes a generation cost &mdash; Credits/IAP grants credits, it does not spend them.)',
            'N/A to this spec&rsquo;s own steps; recorded because every spec in the programme carries this row',
            'Product / RD (the MSR document link is still TBD)',
        ),
    ],

    'criteria': [
        ('AC-CR-01', 'WHEN a credit pack is purchased, THE SYSTEM SHALL add the pack&rsquo;s credits to the balance, toast, and close &mdash; with no real payment step.', ['P3-S3']),
        ('AC-CR-02', 'WHEN a plan is subscribed, THE SYSTEM SHALL set the account to subscriber, add the plan&rsquo;s credits, and reflect PRO status in the shell/profile.', ['P1-S5', 'P1-S6']),
        ('AC-CR-03', 'WHEN a signed-in user opens /profile/credits, THE SYSTEM SHALL show the current balance, the All/Spend/Earn filter, the static transaction ledger, and a purchase CTA.', ['P5-S1', 'P5-S2', 'P5-S3']),
        ('AC-CR-04', 'THE SYSTEM SHALL show the per-surface footer copy: real Terms of Use / Privacy Policy links on the plan dialog, the 2-year validity and non-refundable copy on Buy Credits, and none on Credits detail.', ['P1-S2', 'P3-S1', 'P5-S1']),
        ('AC-CR-05', 'THE SYSTEM SHALL render the three dialogs at 320/375/768/1024/1440/1920px with no overflow.', [], 'Visual-only; the six-tier sweep is e2e/visual-baseline.spec.ts&rsquo;s job. This spec&rsquo;s D8 scope captures 1403&times;697 desktop only &mdash; the one BEHAVIOURAL difference by width is recorded in Prototype vs production instead.'),
        ('AC-CR-06', 'WHILE already subscribed, WHEN the plan dialog is shown, THE SYSTEM SHALL show the already-on-Muse-Pro state (no plan cards) with a Done action.', ['P2-S1']),
        ('AC-CR-07', 'WHEN a generation is started with credits below its cost, THE SYSTEM SHALL open the buy-credits IAP instead of generating.', [], 'The trigger is on /mv/room and /song/create (areas 02/03), outside this spec&rsquo;s scope &mdash; agreed at the Phase 0 gate. Listed in the error table so QA can find it.'),
        ('AC-CR-08', 'WHILE NOT subscribed, THE SYSTEM SHALL never present a Buy-Credits affordance: entry points SHALL show Subscribe, and Buy Credits SHALL render the plan dialog.', ['P4-S1', 'P4-S2', 'P5-S4', 'P6-S3']),
        ('AC-CR-09', 'WHEN a plan is subscribed to, THE SYSTEM SHALL update the header credit count and expiry cadence to that plan; there SHALL be no default selection on desktop &mdash; each card carries its own Subscribe.', ['P1-S2', 'P1-S3', 'P1-S4', 'P1-S6']),
        ('AC-CR-10', 'WHILE a discount is running, THE SYSTEM SHALL render a struck-through list price, an &ldquo;N% OFF&rdquo; badge per pack, and the discounted price on the Buy CTA. The values themselves are backend/marketing-owned and are not specified here.', ['P3-S1']),
        ('AC-CR-11', 'THE SYSTEM SHALL show six subscription plans across three duration tabs and six credit packs at the confirmed final web prices.', ['P1-S2', 'P1-S3', 'P1-S4', 'P3-S1']),
    ],

    'prototype_deltas': [
        (
            'There is no payment of any kind',
            'Both Subscribe and Buy Now mutate an in-memory balance directly and resolve instantly &mdash; no store, no payment sheet, no receipt, no failure path.',
            'Production needs the real store integration (App Store / Play Store, or the web payment provider) plus receipt validation and the real grant.',
        ),
        (
            'Nothing persists',
            'Balance and subscription both live in memory: a reload resets the balance to the sign-up grant and clears the subscription entirely.',
            'Production needs a real account record; RD should expect the balance and plan to be server state, not client state.',
        ),
        (
            'The ledger is a fixed seed',
            'The rows on /profile/credits are a static list that never reflects a purchase or a spend made in the session &mdash; only the balance card above them is live.',
            'Production needs a real transaction ledger endpoint.',
        ),
        (
            'The discount is a placeholder',
            'A single fixed percentage is applied to every pack so the discount UI has something to render.',
            'Production needs backend-driven promotion values and rules; the elements are the contract, the numbers are not.',
        ),
        (
            'SubscribeModal is a different interaction below 1024px',
            'Desktop shows the duration&rsquo;s two tiers as self-contained cards, each with its own Subscribe. Below 1024px they collapse into a shared Basic/Pro toggle with ONE Subscribe button, defaulting to Pro.',
            'Not a production gap &mdash; recorded because this spec is desktop-only by scope, so the narrower layout&rsquo;s selection model appears nowhere in the captures above.',
        ),
        (
            'Store SKUs are app-shaped',
            'Packs carry `ycm_ios_*` identifiers and plans `subscribe_*_ycm`, inherited from the app; the confirmed web pricing deck supplies prices but no store identifiers.',
            'RD needs the real web SKUs before any purchase can be wired (Q-03 / TBD-CR-11).',
        ),
    ],

    'decisions': [
        ('D-01', 'PLAN.md estimated ~4 paths / ~16 shots. This spec is 6 / 21 &mdash; is that scope creep?', 'No, and both causes are structural. `SubscribeModal` gained a Weekly/Monthly/Yearly duration Tab Bar with two tiers each on 2026-08-28, so the plan picker is six plans across three tabs rather than one flat list of three; and the empty/error states the estimate assumed were unbuilt are live in `demoStore.ts`, so P6 has real screens. Confirmed with the product owner at the Phase 0 gate, 2026-09-01.'),
        ('D-02', 'Desktop only, or add phone captures for the collapsed plan picker?', 'Desktop 1403&times;697 only (D8), confirmed at the Phase 0 gate. The three surfaces are dialogs whose six-width rendering is already a VISUAL criterion (AC-CR-05) swept by `e2e/visual-baseline.spec.ts`, and a storyboard walks behaviour. The one genuine behavioural difference &mdash; the `selectedTier` collapse below 1024px &mdash; is recorded in Prototype vs production rather than left invisible.'),
        ('D-03', 'How is CR-05&rsquo;s already-subscribed state reached for capture, given no control reopens the dialog once subscribed?', 'By the only route the code supports: open the dialog while free, then flip `subscribed` underneath it using the demo panel&rsquo;s real ACCOUNT &rarr; Subscribe action (a genuine `subscribe()` call, not a demo flag &mdash; the same bypass S7 used for its own P3-S2). This is a finding, not a workaround: it is recorded as Q-01 because it means the state may be unreachable for a real user.'),
        ('D-04', 'Why does P1 subscribe with a real card press when the demo panel has a one-click Subscribe?', 'Because AC-CR-02 is specifically that the credits granted are the PICKED plan&rsquo;s own value. The demo shortcut cannot demonstrate that &mdash; it does not pick a plan. The shortcut is also `disabled={subscribed}`, so it can only be used once per session; P1 needs the real press and P2 needs the shortcut, which is why they are separate browser sessions.'),
        ('D-05', 'Does this spec tour the in-flow insufficient-balance route (AC-CR-07)?', 'No &mdash; agreed at the Phase 0 gate. Its trigger is a generation CTA on /mv/room or /song/create, which belongs to areas 02/03 and to S2/S1. It is listed in the error table so QA can find it, with the criterion carrying the reason it has no step.'),
        ('D-06', 'Comments layer for this spec?', 'Disabled &mdash; no Firebase backend exists in this repo yet, same as S1/S3/S4/S6/S7.'),
    ],

    'references': [],

    # ── flow diagram ───────────────────────────────────────────────────────
    'mermaid': (
        'flowchart TD\n'
        '  Entry["Any Upgrade / credit-pill entry point"] --> Sub{subscribed?}\n'
        '  Sub -->|no| Plans["Plan dialog: Weekly | Monthly | Yearly, two tiers each"]\n'
        '  Plans -->|a card Subscribe| Granted["subscriber + that plan\'s credits + toast"]\n'
        '  Granted --> Shell["Shell shows the plan; Upgrade controls disappear"]\n'
        '  Plans -.->|subscribed flips while open| AlreadyPro["Already on Muse Pro + Done (Q-01)"]\n'
        '  Sub -->|yes| Packs["Buy Credits: six packs, 2,000 preselected"]\n'
        '  Packs -->|Buy Now| Added["credits added (toast only from Credits detail, Q-02)"]\n'
        '  Buy["Buy Credits entry point"] --> Gate{subscribed?}\n'
        '  Gate -->|no| Plans\n'
        '  Gate -->|yes| Packs\n'
        '  Detail["/profile/credits"] --> Bal["Balance (live) + All/Spend/Earn + ledger (seed)"]\n'
        '  Bal --> Cta{subscribed?}\n'
        '  Cta -->|yes| Packs\n'
        '  Cta -->|no| Plans\n'
        '  Demo["?demo=1 panel"] -.->|backend error| Err["Error body + Retry, on either dialog"]\n'
        '  Demo -.->|empty ledger| Empty["No activity yet; balance + filter retained"]\n'
    ),
    'svg_path': os.path.join(FEAT, 'user-flowchart.svg'),

    # ── output paths ─────────────────────────────────────────────────────────
    'screenshots_dir': os.path.join(FEAT, 'specs', 'screenshots'),
    'out_dir': os.path.join(FEAT, 'specs'),

    # ── STRINGS lint source ──────────────────────────────────────────────────
    'prototype_src': [
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'SubscribeModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'BuyCreditsModal.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'credits', 'CreditsView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'profile', 'ProfileView.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'DpDialog.tsx'),
        # The shared backend-error body BOTH dialogs render (P6). It is its own
        # component, not inline in either dialog — omitting it made P6-S1's two
        # quoted strings look like they were invented.
        os.path.join(WEB_APP, 'src', 'components', 'ui', 'ApiErrorState.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'Sidebar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'RoomNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'shell', 'DetailNavbar.tsx'),
        os.path.join(WEB_APP, 'src', 'components', 'demo', 'DemoPanel.tsx'),
        os.path.join(WEB_APP, 'src', 'lib', 'user.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'demoStore.ts'),
        os.path.join(WEB_APP, 'src', 'lib', 'i18n', 'dictionaries', 'en.ts'),
    ],
    'strings_ignore': [
        # `<DpDialog label="Upgrade Your Plan" title="Upgrade Your Plan">` — the
        # string is a JSX ATTRIBUTE VALUE, and `plain()`'s tag-stripper removes
        # the whole opening tag, attributes included, before the scan. Same
        # class of miss S7 documented for its own `<Modal title=…>` titles.
        # Confirmed live (02, 12).
        'Upgrade Your Plan',
        # Composed at render time: `` `Credits Expire ${plan.cadence}` `` in
        # SubscribeModal.tsx. The three RENDERED forms below never appear
        # literally in source, and the template that produces them never appears
        # literally on screen — the two can't byte-match in either direction.
        # Confirmed live (02, 03, 04).
        'Credits Expire Weekly',
        'Credits Expire Monthly',
        'Credits Expire Yearly',
        # Source writes the apostrophe as the JSX entity `&apos;`
        # (`You&apos;re already on Muse Pro`); this spec normalizes apostrophes
        # to `&rsquo;`. Same normalization mismatch S7 hit with its own
        # em-dash/ellipsis entries. Confirmed live (07).
        'You&rsquo;re already on Muse Pro',
        "We couldn&rsquo;t load this right now. Please check your connection and try again.",
    ],

    # ── comments (disabled — no Firebase backend in this repo) ────────────────
    'comments_enabled': False,
}

if __name__ == '__main__':
    spec_builder.write_specs(cfg)
