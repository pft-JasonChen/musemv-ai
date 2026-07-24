#!/usr/bin/env python3
"""yco-spec — cfg TEMPLATE / authoritative skeleton.

Copy this into a feature's Project/<feature>/build_spec.py and fill it in.
The shared builder (spec_builder.py) owns ALL rendering — never hand-author
HTML. `write_specs(cfg)` runs `validate(cfg)` first and refuses to build on a
hard error (CJK, missing screenshot, a path with no QA, or a leaked
'prototype' note with no prototype_deltas row).

Every key marked OPTIONAL may be omitted; the matching section is then skipped.
Stable IDs (P1, P1-S2, E-..) are auto-derived from `num`; set `req_id` to pin one.
Use HTML entities in strings (&ldquo; &rdquo; &rarr; &middot; &mdash; &ge; &le; &times;).
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))     # .../Project/<feature>
ROOT = os.path.dirname(os.path.dirname(HERE))         # .../Prototype Automation
sys.path.insert(0, os.path.join(ROOT, 'skills', 'yco-spec'))
import spec_builder
FEAT = HERE

cfg = {
    # ── header ───────────────────────────────────────────────────────────────
    'feature_name': 'My Feature — Behavior Spec',
    'breadcrumb':   'YCO Online Service &rarr; My Feature',
    'author': 'Jason Chen', 'date': '2026-06-15', 'status': 'Review',
    'version': 'v1',                                   # OPTIONAL — shown in header; pair with `changelog`
    'actor_label': 'WEB UI',                           # OPTIONAL — the 2nd row label (default 'WEB UI'); was 'SYSTEM'
    # Production prototype prefix is https://yco-prototypes.vercel.app/ (not localhost).
    'prototype_url': 'https://yco-prototypes.vercel.app/prototypes/my-feature/v1/',
    'guideline': '',                                   # design guideline URL (openable); '' → shows "TBD" on hover
    # 'callout': '<custom intro html>',                # OPTIONAL — defaults to standard

    # ── Feature block (top of the spec; description required) ─────────────────
    'description': 'One or two sentences: what this feature is and what the user can do with it.',
    'background': 'OPTIONAL — why it exists / where it lives.',
    'goal': 'OPTIONAL — the outcome this feature is meant to drive.',

    # ── overview card ──────────────────────────────────────────────────────────
    'overview': [
        ['Platform', 'YCO Web (desktop) — responsive 1440 / 1024 / 768'],
        ['Audience', 'Frontend RD / QA'],
    ],

    # ── the spine: user paths ────────────────────────────────────────────────
    'short_nav': ['Happy path'],                       # OPTIONAL sidebar labels, one per path
    'paths': [{
        'id': 'path-1', 'num': 1,                      # req_id auto = "P1"
        'name': 'Happy path &mdash; upload &rarr; generate &rarr; result',
        'desc': 'Main flow when credits are sufficient.',
        'entry': 'Greeting page', 'outcome': 'Result in chat',
        'responsive': 'At 768 the inspector stacks below the canvas.',  # OPTIONAL per-path note
        'tail': '',                                    # OPTIONAL html appended after steps
        'bridge': 'After sign-up the photo + selection persist; returns to STYLE_SELECTED, no auto-generate.',  # OPTIONAL hand-off to the next path
        'steps': [{
            'shot': '01_greeting.png', 'num': 1,       # req_id auto = "P1-S1"
            'user':  'Opens the page and taps a quick-action card.',   # EMPHASISED (bold) line
            'system':'Prompt pre-fills and the upload slot is primed.',
            'inp': '&mdash;', 'out': 'Filled prompt + primed slot',     # shown only if non-blank
            # Frame overlay. box = [x, y, w, h] as PERCENT of the image (true component
            # bounds — the builder adds ~6px outward padding). type 'action' (default) =
            # solid red (the click that ADVANCES the flow); 'info' = dashed amber (a key
            # point to note). Label is a HOVER-ONLY tooltip. Add a frame ONLY when the
            # screenshot shows a click-to-advance component or a key value; passive states
            # (landing / thinking / processing / result / dialog-internals) get none.
            # PIXEL-PERFECT: capture_screenshots.py measures each target → specs/focus.json,
            # which OVERRIDES this value (offline fallback). Opt out: focus_lock=True.
            'focus': [{'box': [11, 24, 38, 37], 'type': 'action', 'label': 'Quick-action card'}],
            # exact / limits accept a list[str] → rendered as a bullet list (preferred,
            # more readable), or a plain string. ON-SCREEN TEXT must be verbatim.
            'exact':  ['Card label: &ldquo;Enhance Video Quality&rdquo;'],
            'limits': ['Trim range 5&ndash;60s', 'File &le; 200MB',
                       'Boundary: 200MB accepted, &gt; 200MB rejected'],
            'qa':     'Tapping the card prefills the prompt and shows the &ldquo;+ Add Video&rdquo; slot.',
            # OPTIONAL full-width table(s) after RULES & LIMITS — for matrices like
            # upload-limit grids or selection rules. dict or list[dict].
            # 'tables': [{
            #     'caption': 'Upload limits',
            #     'cols': ['Already attached', 'Add slot (UI)', 'Can still add?'],
            #     'rows': [
            #         ['<b>1 image</b>', '&ldquo;+ Add Media&rdquo; visible', 'Up to 9 images, or 1 video'],
            #         ['<b>1 video + 1 image</b>', 'Slot hidden', 'Nothing more &rarr; toast'],
            #     ],
            # }],
            'role': 'user',                            # 'user' (default) or 'error'
            # 'since': 'v2',                            # OPTIONAL — shows a green "NEW · v2" badge
            # 'req_id': 'P1-S1',                        # OPTIONAL override
            # 'summary': 'short skim-strip line',       # OPTIONAL (defaults to `user`)
        }],
    }],

    # ── reference sections (all OPTIONAL) ───────────────────────────────────────
    'states': [   # State Inventory — the contract of each screen state
        # (name, entry condition, visible/enabled, transitions, exit)
        ('EMPTY', 'Page load', 'Upload zone, disabled CTA', '→ LOADED on upload', 'On upload'),
    ],
    # NOTE: no `responsive` section — spec screenshots are 1440 desktop only.
    # (Prototype responsive checks at 1024/768 live in Stage 3 validation, not the spec.)
    'page_sections': [   # OMIT entirely for pure-flow apps
        {'shot': '20_hero.png', 'name': 'Hero', 'purpose': 'Headline + primary CTA above the fold.'},
    ],
    'errors': [   # (name, trigger, message shown, recovery, refund?)
        ('No face detected', 'Image has no face', 'We couldn&rsquo;t find a face. Try a front-facing photo.',
         'Upload another', 'No (not charged)'),
    ],
    'prototype_deltas': [   # Prototype Simplifications — NOT the production contract
        # (area, what the prototype does, what production must do)
        ('Generation backend', 'Fixed ~3.5s simulated timer; canned result image.',
         'Call the real backend; indeterminate progress; define timeout + failure path.'),
    ],
    'decisions': [   # (id, question, decision)  — or 2-tuple (question, decision)
        ('D-01', 'Confirmation before generation?', 'No confirmation when credits are sufficient.'),
    ],
    'changelog': [   # newest first — renders as a collapsible section at the bottom
        # (version, date, what changed)
        ('v1', '2026-06-15', 'Initial spec.'),
    ],

    # ── flow diagram ───────────────────────────────────────────────────────────
    'mermaid': 'flowchart LR\n  A([Page]) --&gt; B[Upload] --&gt; C([Result])',
    'svg_path':        f'{FEAT}/user-flowchart.svg',

    # ── output paths ───────────────────────────────────────────────────────────
    'screenshots_dir': f'{FEAT}/specs/screenshots',
    'out_dir':         f'{FEAT}/specs',

    # ── RD/QA review comments (shared, inline on the spec) ───────────────────────
    # On by default — every spec ships the inline comment/review layer. Reviewers
    # highlight ANY content (steps, decisions, states, …) to comment; threads sync
    # via Firestore so the whole team sees the same comments.
    'comments_enabled': True,
    # STABLE slug, unique per spec. Set it ONCE and NEVER change it — comments are
    # keyed to this string in Firestore, so renaming/moving the feature folder must
    # NOT change it or every existing comment orphans. Use a short slug, not the path.
    'comments_spec_id': 'CHANGEME-feature-slug',   # e.g. 'v2v-ai-agent'
    # NOTE: the Firebase backend is read centrally from agent.config.json ("firebase").
    # Do NOT paste it here. Add a per-spec 'firebase_config' dict only to override it.
}

spec_builder.write_specs(cfg)   # validates, then writes spec.html + spec-bundled.html
