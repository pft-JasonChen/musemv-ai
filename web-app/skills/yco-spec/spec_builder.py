#!/usr/bin/env python3
"""yco-spec unified builder — reusable across every prototype.

Import this module from a small per-feature build script that defines the
content (paths, page sections, errors, decisions, …) and calls `write_specs(cfg)`.

Format (path-storyboard spine, RD-reviewed):
  - A short Feature block (description + optional background/goal) so a reader
    grasps WHAT the feature is before the details.
  - One section per user journey. Each step card is: ID header → screenshot
    (read first, with a red focus box on the user action) → USER action
    (emphasised) / WEB UI response, then ON-SCREEN TEXT and RULES & LIMITS as
    bullet lists, then Input/Output at the bottom.
  - Stable IDs on every path and step (P1, P1-S2, error P1-E1).
  - Per-path QA checklist; path-to-path bridge connector.
  - Flow Diagram first (collapsed), then State Inventory, Error States,
    Prototype Simplifications, Design Decisions, Changelog.
  - Behaviour only — no code, DOM IDs, JS names. English only (enforced).

Outputs (next to <feature>/specs/):
  spec.html          linked screenshots (small, diffable; open via localhost)
  spec-bundled.html  base64 self-contained (email / external share)

`write_specs(cfg)` runs `validate(cfg)` first and refuses to build on a hard
error. Config schema — see SKILL.md. Minimal example: cfg-template.py.
"""
import base64, html as _htmlmod, json, os, re, shutil, struct

def _apply_focus_map(cfg):
    """If specs/focus.json exists (written by capture_screenshots.py with exact,
    Playwright-measured boxes), use it as the source of truth for `focus` — so the
    red box matches the screenshot pixel-for-pixel. Manual `focus` in the build
    script is the offline fallback. A step can opt out with `focus_lock: True`."""
    fp = os.path.join(cfg.get('out_dir', ''), 'focus.json')
    if not os.path.exists(fp):
        return False
    with open(fp, encoding='utf-8') as f:
        fm = json.load(f)
    matched = set()
    for p in cfg.get('paths', []):
        for s in p['steps']:
            shot = s.get('shot')
            if shot in fm and not s.get('focus_lock'):
                if not fm[shot]:
                    continue  # empty measurement — keep the manual fallback
                manual = s.get('focus') or []
                merged = []
                for i, entry in enumerate(fm[shot]):
                    e = dict(entry)
                    # focus.json overrides the BOX; 'type'/'label' fall back to
                    # the manual entry so an info (amber) frame never silently
                    # reverts to the default action red.
                    if 'type' not in e and i < len(manual) and 'type' in manual[i]:
                        e['type'] = manual[i]['type']
                    if 'label' not in e and i < len(manual) and 'label' in manual[i]:
                        e['label'] = manual[i]['label']
                    merged.append(e)
                s['focus'] = merged
                matched.add(shot)
    stale = set(fm) - matched
    if stale:
        print('focus.json: WARNING — keys matching no step shot (renamed?): '
              + ', '.join(sorted(stale)))
    return True

# ── validation gate ───────────────────────────────────────────────────────────
class SpecValidationError(Exception):
    """Raised when cfg fails a hard validation check — no HTML is written."""

# CJK / kana / hangul / fullwidth — the spec is English-only.
_CJK = re.compile(r'[　-〿぀-ヿ㐀-䶿一-鿿'
                  r'豈-﫿＀-￯가-힯]')
# High-confidence implementation tokens that must never reach the spec text.
_CODE = re.compile(r'\b(?:function|getElementById|querySelector|addEventListener|'
                   r'innerHTML|classList|querySelectorAll)\b|=>|document\.|window\.')

_STEP_TEXT_KEYS = ('user', 'system', 'inp', 'out', 'exact', 'limits')

def _as_text(v):
    if isinstance(v, (list, tuple)):
        return ' '.join(str(x) for x in v)
    return v if isinstance(v, str) else ''

def _step_strings(cfg):
    for p in cfg.get('paths', []):
        for s in p['steps']:
            sid = s.get('req_id') or f"P{p['num']}-S{s.get('num','?')}"
            for k in _STEP_TEXT_KEYS:
                t = _as_text(s.get(k))
                if t.strip():
                    yield f"{sid}.{k}", t

def _prose_strings(cfg):
    """Every authored English sentence in the spec: step text plus criteria.

    Criteria used to escape the CJK gate because it only walked steps — invisible
    while every spec had steps, and a hole the moment one does not (a
    data-contract spec's criteria are most of its prose). Measured across the 9
    existing build_spec.py files: none has CJK in criteria, so closing this
    changes no current build."""
    yield from _step_strings(cfg)
    for c in cfg.get('criteria', []):
        if isinstance(c, (list, tuple)) and len(c) >= 2:
            t = _as_text(c[1])
            if t.strip():
                yield f"criterion {c[0]}", t

# ── flowchart gate ────────────────────────────────────────────────────────────
# The diagram is the only artifact in a feature folder that no build step touches,
# so it silently rots: template-spec shipped a v2 spec beside a diagram still
# stamped v1 and still drawing the carry-over rule D-27 had retired.
#
# Only ONE of the four possible checks is built here as a hard gate, because the
# others are already covered or would be noise:
#   - stale step/decision IDs on the diagram: ALREADY ENFORCED. _flow_html inlines
#     the SVG, so _check_xrefs sees its <text> and fails the build on a dangling
#     P1-S9 / D-99 exactly as it would in a step card. Nothing to add.
#   - the diagram restating a rule in prose: not machine-detectable without
#     guessing at English. references/flowchart.md removes the cause instead —
#     the diagram draws paths and cites step IDs; rules live in step cards. A
#     diagram that never restates a rule cannot contradict one.
# What is left is the stamp, and it is the precise catch: every rebuild that
# changes behaviour bumps cfg['version'], so a stamp that did not move proves
# the diagram was not re-read.
_FLOW_STAMP = re.compile(r'matches\s+spec\s+(v[\w.]+)', re.I)
_FLOW_BASELINE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                              'flowchart-baseline.txt')

def _svg_text(svg):
    """Visible text of an SVG: tags dropped, entities resolved, runs collapsed."""
    return re.sub(r'\s+', ' ', _htmlmod.unescape(re.sub(r'<[^>]+>', ' ', svg)))

def _flow_grandfathered(key):
    """Feature folders allowed to ship a diagram with no version stamp. Ratchet,
    not an exemption list to grow: a spec drops off it by gaining a stamp, and a
    new spec never goes on it."""
    try:
        with open(_FLOW_BASELINE, encoding='utf-8') as f:
            return key in {ln.strip() for ln in f
                           if ln.strip() and not ln.startswith('#')}
    except OSError:
        return False

def _check_flowchart(cfg):
    """Returns (errors, warnings) for cfg['svg_path']."""
    errors, warnings = [], []
    p = cfg.get('svg_path', '')
    if not p:
        errors.append("cfg has no 'svg_path' — every spec ships a user flowchart "
                      "(Stage 0 step 7); point it at Project/<feature>/user-flowchart.svg")
        return errors, warnings
    if not os.path.exists(p):
        errors.append(f"flowchart not found: {p}")
        return errors, warnings

    with open(p, encoding='utf-8') as f:
        text = _svg_text(f.read())
    key = os.path.basename(os.path.dirname(os.path.abspath(p)))

    m = _FLOW_STAMP.search(text)
    want = str(cfg.get('version', 'v1'))
    if m:
        if m.group(1).lower() != want.lower():
            errors.append(
                f"flowchart is stamped {m.group(1)} but the spec is {want} — re-read "
                f"{os.path.basename(p)} against the current paths, then update the stamp")
    elif _flow_grandfathered(key):
        warnings.append(
            f"flowchart has no version stamp: {p} — add "
            f"'matches spec {want}, <date>' to its subtitle so the next rebuild can "
            f"tell whether the diagram was re-read (see references/flowchart.md)")
    else:
        errors.append(
            f"flowchart has no version stamp: {p} — its subtitle must read "
            f"'matches spec {want}, <date>' (see references/flowchart.md)")

    # "Is every path drawn?" was built here as a word-overlap check and removed:
    # it warned on 6 of the 8 live specs, every one a false positive (P4 "Browse
    # the FAQ tab" is drawn, just worded differently). A warning nobody can act on
    # teaches readers to skip the warning list, which is where the stamp warning
    # lives. Coverage is a review question — references/flowchart.md carries it as
    # a checklist item for the person the stamp forces to re-read the diagram.
    return errors, warnings


# ── spec kinds ───────────────────────────────────────────────────────────────
# 'storyboard' (default) is the path-spine spec this skill was built for.
#
# 'data-contract' is for a spec whose subject is a payload mapping, not a
# journey — no screens to walk, so no steps and no user flowchart. It is a
# REPLACEMENT of those gates, never a way to switch validation off: the waived
# requirements are re-imposed as `data_contract` content plus a mandatory
# `criteria` table (see the data_only branch in validate). A flag that merely
# disabled three gates would be the invented-rule failure mode with a config
# key in front of it.
_SPEC_KINDS = ('storyboard', 'data-contract')

def _dc_ids(cfg):
    """Numbered anchors the Data Contract defines — table/schema captions ("T1 ·
    …") and the engine-only note. These are what a data-contract spec's criteria
    point at, the way a storyboard spec's point at Pn-Sn."""
    dc = cfg.get('data_contract') or {}
    out = set()
    for item in list(dc.get('schemas') or []) + list(dc.get('tables') or []):
        m = _TBL_TAG.match(str(item.get('caption', '')))
        if m:
            out.add(m.group(1))
    if dc.get('engine_only'):
        out.add(dc['engine_only'].get('id', 'T4'))
    return out

def validate(cfg):
    """Hard-fail on CJK, missing screenshots, a path with no QA, or a leaked
    'prototype' note with no Prototype Simplifications row. Warn (print, don't
    fail) on likely code/DOM tokens, a step screenshot with no focus highlight,
    and a missing Feature description. Returns the list of warnings.

    `cfg['spec_kind']` selects which gates apply — see _SPEC_KINDS."""
    errors, warnings = [], []
    ss = cfg.get('screenshots_dir', '')

    # ── schema gate (friendly errors instead of a raw KeyError later) ───────────
    kind = cfg.get('spec_kind', 'storyboard')
    if kind not in _SPEC_KINDS:
        raise SpecValidationError(
            f"spec validate: FAILED —\n  ✗ unknown spec_kind {kind!r} "
            f"(expected one of: {', '.join(sorted(_SPEC_KINDS))})")
    data_only = kind == 'data-contract'
    schema_errs = []
    required = {'feature_name': str, 'paths': list, 'screenshots_dir': str, 'out_dir': str}
    if data_only:
        # No screens means no screenshots directory to point at.
        required.pop('screenshots_dir')
        required.pop('paths')
    for k, t in required.items():
        if k not in cfg:
            schema_errs.append(f"missing required cfg key: '{k}'")
        elif not isinstance(cfg[k], t):
            schema_errs.append(f"cfg['{k}'] must be {t.__name__}, got {type(cfg[k]).__name__}")
    if data_only:
        # The waivers above are paid for here. A data-contract spec drops the
        # storyboard spine and the flowchart, so its content and its
        # traceability have to come from somewhere else — or the "spec" is an
        # unvalidated document, which this skill treats as worse than no spec.
        dc = cfg.get('data_contract') or {}
        if not (dc.get('schemas') or dc.get('tables')):
            schema_errs.append(
                "spec_kind='data-contract' needs data_contract['schemas'] or "
                "['tables'] — with no paths, that section is the whole spec")
        if not cfg.get('criteria'):
            schema_errs.append(
                "spec_kind='data-contract' requires 'criteria' — the per-path QA "
                "fallback cannot run with no paths, so this is the only thing "
                "tying acceptance criteria to the spec")
    if isinstance(cfg.get('paths'), list):
        if not cfg['paths'] and not data_only:
            schema_errs.append("cfg['paths'] is empty — a spec needs at least one path")
        for i, p in enumerate(cfg['paths']):
            if not isinstance(p, dict):
                schema_errs.append(f"paths[{i}] must be a dict"); continue
            for pk in ('num', 'name', 'desc', 'steps'):
                if pk not in p:
                    schema_errs.append(f"paths[{i}] ({p.get('name','?')}) missing '{pk}'")
            if isinstance(p.get('steps'), list):
                for j, s in enumerate(p['steps']):
                    if not isinstance(s, dict):
                        schema_errs.append(f"paths[{i}].steps[{j}] must be a dict"); continue
                    for sk in ('user', 'system'):
                        if sk not in s:
                            schema_errs.append(f"step P{p.get('num','?')}-S{s.get('num','?')} missing '{sk}'")
    if cfg.get('comments_enabled'):
        sid = str(cfg.get('comments_spec_id') or '').strip()
        if not sid:
            schema_errs.append("comments_enabled is True but 'comments_spec_id' is empty — set a stable unique slug")
        elif sid.upper().startswith('CHANGEME'):
            schema_errs.append("'comments_spec_id' is still the placeholder — set a stable unique slug (e.g. 'v2v-ai-agent')")
    if schema_errs:
        raise SpecValidationError('spec validate: FAILED —\n' + '\n'.join(f'  ✗ {e}' for e in schema_errs))

    for label, txt in _prose_strings(cfg):
        if _CJK.search(txt):
            errors.append(f"CJK characters in {label}: {txt[:50]!r}")
        if _CODE.search(txt):
            warnings.append(f"possible code/DOM token in {label}: {txt[:50]!r}")

    for p in cfg.get('paths', []):
        for s in p['steps']:
            shot = s.get('shot', '')
            if shot and ss and not os.path.exists(os.path.join(ss, shot)):
                # `shot_pending` = deliberately named but not captured yet; the
                # builder renders a visible "screenshot pending" placeholder so
                # the gap is obvious to RD instead of silently absent.
                if s.get('shot_pending'):
                    warnings.append(f"screenshot pending: {shot} (path {p['num']})")
                else:
                    errors.append(f"missing screenshot: {shot} (path {p['num']})")
            # Focus is discretionary: only steps with a click that advances the
            # flow get an (action) frame; passive steps legitimately have none.
    for sec in cfg.get('page_sections', []):
        shot = sec.get('shot', '')
        if shot and ss and not os.path.exists(os.path.join(ss, shot)):
            errors.append(f"missing screenshot: {shot} (page section {sec['name']})")
    cs = cfg.get('context_shot') or {}
    if cs.get('shot'):
        if not ss:
            errors.append("cfg has a 'context_shot' but no 'screenshots_dir' to find it in")
        elif not os.path.exists(os.path.join(ss, cs['shot'])):
            errors.append(f"missing screenshot: {cs['shot']} (context_shot)")

    # QA traceability. The point was never "there must be QA prose" — it was
    # "every acceptance criterion is covered somewhere". With cfg['criteria']
    # present we can check that directly; without it, fall back to the old
    # per-path prose rule so existing specs keep building.
    if cfg.get('criteria'):
        step_ids = {_step_rid(p, s) for p in cfg.get('paths', []) for s in p['steps']}
        # A criterion may also be covered by a numbered table or schema block —
        # the only kind of target a data-contract spec has, and a legitimate one
        # for a storyboard spec whose criterion is about a payload rather than a
        # screen. A typo'd Pn-Sn still fails; so does a Tn the spec never defines.
        step_ids |= _dc_ids(cfg)
        seen = set()
        for i, c in enumerate(cfg['criteria']):
            if not (isinstance(c, (list, tuple)) and len(c) >= 3):
                errors.append(f"criteria[{i}] must be (id, text, [step_ids], note?)")
                continue
            cid, steps_ref = c[0], (c[2] or [])
            if cid in seen:
                errors.append(f"duplicate criterion ID {cid!r}")
            seen.add(cid)
            for sid in steps_ref:
                if sid not in step_ids:
                    errors.append(f"criterion {cid} points at {sid!r}, which is not a step in this spec")
            if not steps_ref and not (len(c) > 3 and str(c[3]).strip()):
                errors.append(f"criterion {cid} maps to no step and gives no reason — "
                              f"add the step ID(s), or a note saying why this spec does not cover it")
    else:
        for p in cfg.get('paths', []):
            if not any(s.get('qa') for s in p['steps']):
                errors.append(f"path {p['num']} ({p.get('name','')}) has no QA line")

    # ── stable-ID uniqueness (duplicate ids break anchors + comment threads) ────
    seen_ids = {}
    for p in cfg.get('paths', []):
        pid = _path_rid(p)
        if pid in seen_ids:
            errors.append(f"duplicate path ID {pid!r} — path nums/req_ids must be unique")
        seen_ids[pid] = True
        for s in p['steps']:
            rid = _step_rid(p, s)
            if rid in seen_ids:
                errors.append(f"duplicate step ID {rid!r} — step nums/req_ids must be unique within the spec")
            seen_ids[rid] = True

    # ── focus box sanity (percent space: 0–100, box must stay on the image) ────
    for p in cfg.get('paths', []):
        for s in p['steps']:
            for f in (s.get('focus') or []):
                b = f.get('box')
                if not (isinstance(b, (list, tuple)) and len(b) == 4):
                    warnings.append(f"{_step_rid(p, s)}: focus entry without a [x,y,w,h] box")
                    continue
                x, y, w, h = b
                if min(x, y, w, h) < 0 or w == 0 or h == 0 \
                        or x + w > 100.5 or y + h > 100.5:
                    warnings.append(
                        f"{_step_rid(p, s)}: focus box {b} out of bounds "
                        f"(percent space 0-100) — frame will miss the component")

    # The flowchart gate guards diagram-vs-spec drift (a stale diagram drew a
    # retired rule for three days). A data-contract spec has no user journey to
    # draw, so the gate has nothing to guard — but if one is supplied anyway,
    # it is still version-checked.
    if not data_only or cfg.get('svg_path'):
        fe, fw = _check_flowchart(cfg)
        errors += fe
        warnings += fw

    # Phase 0 evidence gate, tiered by what actually changed (see
    # infer_change_type). A new spec or a structural change means somebody
    # decided something; if no decision and no open question survived into cfg,
    # the clarification round either did not happen or was not written down —
    # and an unrecorded answer is indistinguishable from a guess three weeks on.
    # Cosmetic rebuilds are exempt: nothing was decided, so there is nothing to
    # show. The gate asks for evidence, never for a specific answer.
    change_type = infer_change_type(cfg)
    if change_type in ('new', 'behaviour') and not (cfg.get('decisions') or cfg.get('open_questions')):
        errors.append(
            f"change type '{change_type}' but cfg records no 'decisions' and no "
            f"'open_questions' — run the clarification round and write down what was "
            f"settled (a decision row) and what was not (an open question). Nothing "
            f"was settled is itself an answer: record it as an open question.")
    print(f'change type: {change_type}')

    if not cfg.get('description'):
        warnings.append("no Feature 'description' — readers can't tell what this feature is at a glance")

    if not cfg.get('prototype_deltas'):
        for label, txt in _step_strings(cfg):
            if 'prototype' in txt.lower():
                errors.append(
                    f"the word 'prototype' appears in {label} but cfg has no "
                    f"'prototype_deltas' — move it to the Prototype Simplifications "
                    f"section with its real production behaviour")
                break

    if warnings:
        print('spec validate: WARNINGS —')
        for w in warnings:
            print(f'  ! {w}')
    if errors:
        msg = 'spec validate: FAILED —\n' + '\n'.join(f'  ✗ {e}' for e in errors)
        raise SpecValidationError(msg)
    print(f'spec validate: OK ({len(warnings)} warning(s))')
    return warnings

# ── screenshot helpers ───────────────────────────────────────────────────────
_MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
         '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml'}

# Bundled output embeds every screenshot as base64, so raw PNGs push the file
# past what mail servers accept. The spec column renders an image at ~904px, so
# a 2x cap is lossless to the eye; WebP then costs a fraction of PNG. Linked
# spec.html is untouched — it still points at the original PNGs.
BUNDLE_MAX_PX = 1808      # long edge; ~2x the widest rendered size
BUNDLE_WEBP_Q = 85

def _b64_bundle_bytes(path, ext):
    """(mime, bytes) for the bundled build: raster images are re-encoded to
    WebP and capped at BUNDLE_MAX_PX. Falls back to the original bytes when
    Pillow is unavailable or the format isn't raster."""
    raw = open(path, 'rb').read()
    if ext not in ('.png', '.jpg', '.jpeg'):
        return _MIME.get(ext, 'image/png'), raw
    try:
        from PIL import Image
    except ImportError:
        print('  ! Pillow not installed — bundling screenshots at full size')
        return _MIME.get(ext, 'image/png'), raw
    import io as _io
    im = Image.open(_io.BytesIO(raw))
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if max(im.size) > BUNDLE_MAX_PX:
        im.thumbnail((BUNDLE_MAX_PX, BUNDLE_MAX_PX), Image.LANCZOS)
    buf = _io.BytesIO()
    im.save(buf, 'WEBP', quality=BUNDLE_WEBP_Q, method=6)
    out = buf.getvalue()
    return ('image/webp', out) if len(out) < len(raw) else (_MIME.get(ext, 'image/png'), raw)

_IMG_SIZE_CACHE = {}

def _img_size(path):
    """(width, height) of a PNG, or None when it can't be read.

    Screenshots in this pipeline are always Playwright PNGs, so the size comes
    straight from the IHDR chunk — no Pillow dependency, and no risk of the
    output differing depending on whether Pillow happens to be installed on
    whatever machine builds the spec (it silently isn't on CI runners)."""
    if path not in _IMG_SIZE_CACHE:
        try:
            with open(path, 'rb') as f:
                head = f.read(24)
            if len(head) == 24 and head[:8] == b'\x89PNG\r\n\x1a\n' and head[12:16] == b'IHDR':
                _IMG_SIZE_CACHE[path] = struct.unpack('>II', head[16:24])
            else:
                _IMG_SIZE_CACHE[path] = None
        except OSError:
            _IMG_SIZE_CACHE[path] = None
    return _IMG_SIZE_CACHE[path]

def _b64(ss_dir, name):
    path = os.path.join(ss_dir, name)
    if not name or not os.path.exists(path):
        return ''
    mime, data = _b64_bundle_bytes(path, os.path.splitext(name)[1].lower())
    return f'data:{mime};base64,' + base64.b64encode(data).decode()

FOCUS_PAD_PX = 6  # outward gap so the frame surrounds the component, not overlays it

def _focus_boxes(focus):
    """Frame overlay(s) + their legend. focus = list of {box:[x,y,w,h] in %,
    label?, type?}. type 'action' (default) = solid red (the click that advances
    the flow); type 'info' = dashed amber (a key UI point to note).

    Each frame carries a PERMANENT number badge and its label is listed in a
    legend under the screenshot — a hover-only tooltip is invisible in print, in
    a PDF, and in a screenshot pasted into Jira, which is where specs are most
    often read. A fixed outward padding (FOCUS_PAD_PX) is added via calc() so
    the frame sits around the component with a small gap."""
    if not focus:
        return '', ''
    p, p2 = FOCUS_PAD_PX, FOCUS_PAD_PX * 2
    boxes, legend = [], []
    for i, f in enumerate(focus, 1):
        x, y, w, h = f['box']
        info = f.get('type') == 'info'
        cls = 'fbox fbox-info' if info else 'fbox'
        boxes.append(
            f'<div class="{cls}" style="left:calc({x}% - {p}px);top:calc({y}% - {p}px);'
            f'width:calc({w}% + {p2}px);height:calc({h}% + {p2}px)">'
            f'<span class="fpin">{i}</span></div>')
        if f.get('label'):
            legend.append(f'<li><span class="fpin{" fpin-info" if info else ""}">{i}</span>'
                          f'<span>{f["label"]}</span></li>')
    return ''.join(boxes), (f'<ul class="fkey">{"".join(legend)}</ul>' if legend else '')

def _img(ss_dir, name, mode, alt, focus=None):
    # Pending screenshot (named but not captured yet) — keep a placeholder.
    if name and not os.path.exists(os.path.join(ss_dir, name)):
        return (f'<div class="shot noshot">&#128247; screenshot pending &mdash; <code>{name}</code><br>'
                f'<span style="font-size:11px">run <code>capture_screenshots.py</code> then rebuild</span></div>')
    src = _b64(ss_dir, name) if mode == 'bundled' else f'screenshots/{name}'
    boxes, legend = _focus_boxes(focus)
    # Intrinsic size keeps the layout stable while lazy images are still
    # loading. Without it every anchor below the fold sits at the wrong
    # offset, so "jump to P2-S1" lands somewhere else entirely.
    dim = _img_size(os.path.join(ss_dir, name))
    size = f' width="{dim[0]}" height="{dim[1]}"' if dim else ''
    return (f'<div class="shot"><div class="shotwrap">'
            f'<img src="{src}"{size} alt="{alt}" loading="lazy"/>{boxes}</div>{legend}</div>')

# ── id / badge helpers ─────────────────────────────────────────────────────────
def _path_rid(p):
    return p.get('req_id') or f"P{p['num']}"

def _step_rid(p, s):
    if s.get('req_id'):
        return s['req_id']
    tag = 'E' if s.get('role') == 'error' else 'S'
    return f"{_path_rid(p)}-{tag}{s.get('num','?')}"

def _since(obj):
    return f'<span class="since">NEW &middot; {obj["since"]}</span>' if obj.get('since') else ''

# ── step / path / section renderers ──────────────────────────────────────────
def _is_blank(v):
    return (not v) or (isinstance(v, str) and v.strip() in ('', '&mdash;', '—', '-'))

def _meta_block(label, value):
    """A labelled detail block; list values render as a bullet list.

    A bullet may be a plain string, or a `(rule, why)` pair. The pair renders
    the rule as the normative line and the reason as a quieter second line, so
    a reader can tell at a glance which half is the contract. Before this
    existed the reason had nowhere to go and got written into the rule, which
    is how single bullets grew to three sentences."""
    if value is None or (isinstance(value, str) and value.strip() == ''):
        return ''
    if isinstance(value, (list, tuple)):
        items = ''.join(
            f'<li>{v[0]}<span class="why">{v[1]}</span></li>'
            if isinstance(v, (list, tuple)) and len(v) == 2 and v[1]
            else f'<li>{v[0] if isinstance(v, (list, tuple)) else v}</li>'
            for v in value)
        body = f'<ul class="mlist">{items}</ul>'
    else:
        body = f'<span class="mval">{value}</span>'
    return f'<div class="mline"><span class="mkey">{label}</span><div class="mbody">{body}</div></div>'

def _dc_caption(caption):
    """A "T1 · …" caption, self-anchored so every "(T1)" elsewhere in the spec
    becomes a working jump link. Shared by tables and JSON schema blocks."""
    if not caption:
        return ''
    m = _TBL_TAG.match(caption)
    anchor = f' id="{m.group(1)}"' if m else ''
    text = (f'<span class="noxref">{m.group(1)}</span>{caption[m.end(1):]}'
            if m else caption)
    return f'<div class="dc-cap"{anchor}>{text}</div>'

def _table_parts(t):
    """(caption_html, thead_html, rows_html) for a {caption, cols, rows} table."""
    cap = _dc_caption(t.get('caption'))
    thead = ''
    if t.get('cols'):
        thead = '<thead><tr>' + ''.join(f'<th>{c}</th>' for c in t['cols']) + '</tr></thead>'
    rows = t.get('_rows_html') or ''.join(
        '<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in (t.get('rows') or []))
    return cap, thead, rows

def _table_block(t):
    """A standalone captioned table — the section-level counterpart of an
    in-step table, so the same {caption, cols, rows} dict renders in both."""
    cap, thead, rows = _table_parts(t)
    return f'{cap}<div class="table-wrap"><table>{thead}<tbody>{rows}</tbody></table></div>'

def _step_tables(s):
    """Render optional in-step tables. `s['tables']` is a dict or list of dicts:
    {caption?, cols:[...], rows:[[...], ...]}. Reuses the global .table-wrap/table
    styling so step tables match the section tables (State Inventory, Decisions)."""
    tbls = s.get('tables')
    if not tbls:
        return ''
    if isinstance(tbls, dict):
        tbls = [tbls]
    out = ''
    for t in tbls:
        cap, thead, rows = _table_parts(t)
        out += (f'<div class="mline"><div class="mbody" style="width:100%">{cap}'
                f'<div class="table-wrap"><table>{thead}<tbody>{rows}</tbody></table></div></div></div>')
    return out

# ── cross-references ─────────────────────────────────────────────────────────
# A spec is full of bare "(T1)", "see D-12", "as in P1-S3". Written by hand they
# are plain text, so the reader has to Ctrl+F — and a typo'd one is silent.
# _linkify turns every token that has a matching anchor into a real link, and
# _check_xrefs fails the build on one that points nowhere.
_TBL_TAG = re.compile(r'^(T\d+)\b')
_XREF = re.compile(r'\b(D-\d+|P\d+-[SE]\d+|T\d+)\b')
_XREF_SKIP = ('a', 'code', 'script', 'style', 'title', 'textarea')

def _xref_scan(html, on_token):
    """Walk text outside links/code/scripts and elements marked `noxref`,
    calling on_token(token) -> replacement (or None to leave it alone)."""
    out, skip_depth, skip_tag = [], 0, None
    for chunk in re.split(r'(<[^>]+>)', html):
        if chunk.startswith('<'):
            out.append(chunk)
            m = re.match(r'</?([a-zA-Z0-9]+)', chunk)
            if not m or chunk.startswith('<!') or chunk.endswith('/>'):
                continue
            tag = m.group(1).lower()
            closing = chunk.startswith('</')
            if skip_depth:
                if tag == skip_tag:
                    skip_depth += -1 if closing else 1
            elif not closing and (tag in _XREF_SKIP or 'noxref' in chunk):
                skip_depth, skip_tag = 1, tag
            continue
        if skip_depth or not chunk.strip():
            out.append(chunk)
            continue
        out.append(_XREF.sub(lambda m: on_token(m.group(1)) or m.group(1), chunk))
    return ''.join(out)

def _linkify(html):
    ids = set(re.findall(r'\bid="([^"]+)"', html))
    return _xref_scan(html, lambda t: f'<a class="xref" href="#{t}">{t}</a>' if t in ids else None)

def _check_xrefs(html):
    """Bare ID tokens with no anchor, as {token: count}. Only families the spec
    actually defines are checked, so prose that merely looks like an ID in a
    spec with no decisions / no numbered tables never false-positives."""
    ids = set(re.findall(r'\bid="([^"]+)"', html))
    families = {t[0] if t[0] == 'T' else ('D' if t.startswith('D-') else 'P')
                for t in ids if _XREF.fullmatch(t)}
    bad = {}
    def _note(tok):
        fam = tok[0] if tok[0] == 'T' else ('D' if tok.startswith('D-') else 'P')
        if tok not in ids and fam in families:
            bad[tok] = bad.get(tok, 0) + 1
        return None
    _xref_scan(html, _note)
    return bad

# ── inline design decisions (opt-in) ──────────────────────────────────────────
_DEC_ID = re.compile(r'\bD-\d{2}\b')

def _decision_map(cfg):
    """Ordered {id: (question, decision)} for 3-tuple decisions. Empty unless
    cfg['inline_decisions'] is set — keeps every other spec byte-identical."""
    if not cfg.get('inline_decisions'):
        return {}
    return {d[0]: (d[1], d[2]) for d in cfg.get('decisions', []) if len(d) == 3}

def _dec_refs(s):
    """Ordered, de-duped decision IDs a step's limits / on-screen text cite."""
    txt = _as_text(s.get('limits')) + ' ' + _as_text(s.get('exact'))
    seen = []
    for m in _DEC_ID.finditer(txt):
        if m.group(0) not in seen:
            seen.append(m.group(0))
    return seen

def _dec_inline_html(s, dec_map, anchored=None):
    """`anchored` is a set used when the recap index is suppressed: the first
    inline card for a decision becomes that decision's anchor, so every #D-xx
    link in the page still resolves."""
    if not dec_map:
        return ''
    out = ''
    for did in _dec_refs(s):
        d = dec_map.get(did)
        if not d:
            continue
        if anchored is None:
            head = f'<a class="dec-inline-id" href="#{did}">{did}</a>'
        else:
            own = did not in anchored
            anchored.add(did)
            head = (f'<span class="dec-inline-id" id="{did}">{did}</span>' if own
                    else f'<a class="dec-inline-id" href="#{did}">{did}</a>')
        out += (f'<div class="dec-inline">{head}'
                f'<div class="dec-inline-body"><span class="dec-inline-q">{d[0]}</span>'
                f'{d[1]}</div></div>')
    return out

def _step(p, s, ss_dir, mode, al, dec_map=None, anchored=None):
    is_err = s.get('role') == 'error'
    rid = _step_rid(p, s)
    user_label = '&#9888; ERROR' if is_err else 'TRIGGER'
    user_cls = 'r-err' if is_err else 'r-user'
    user_row = (f'<div class="srow"><span class="role {user_cls}">{user_label}</span>'
                f'<span class="stext su{" err" if is_err else ""}">{s["user"]}</span></div>')
    # Input/Output — rendered LAST (bottom of the step body). Each half is shown
    # only when it carries a value; a step with no meaningful input no longer
    # spends a line on "Input: —".
    halves = [f'<strong>{lbl}:</strong> {s[key]}'
              for lbl, key in (('Input', 'inp'), ('Output', 'out'))
              if not _is_blank(s.get(key))]
    io = f'<div class="io">{"&nbsp;&middot;&nbsp; ".join(halves)}</div>' if halves else ''
    # 2-A: four blocks — TRIGGER (user) / RESULT (system) / STRINGS / RULES.
    # `exact` and `limits` keep their names in cfg; only the labels changed, so
    # the boundary reads as "quoted UI text" vs "numbers and branching".
    extra = _meta_block('Strings', s.get('exact')) + _meta_block('Rules', s.get('limits')) + _step_tables(s)
    dec = _dec_inline_html(s, dec_map, anchored)
    head = (f'<div class="{"step-head err" if is_err else "step-head"}">'
            f'<span class="snum noxref{" err" if is_err else ""}">{rid}</span>{_since(s)}</div>')
    shot = s.get('shot', '')
    if shot:
        # Screenshot first, then USER / WEB UI, then bullets, then Input/Output.
        sys_row = (f'<div class="srow"><span class="role r-sys">{al}</span>'
                   f'<span class="stext">{s["system"]}</span></div>')
        img = _img(ss_dir, shot, mode, rid, s.get('focus'))
        body = f'<div class="step-body">{user_row}{sys_row}{extra}{dec}{io}</div>'
        return f'<div class="step" id="{rid}">{head}{img}{body}</div>'
    # No screenshot — present the WEB UI response as a readable panel so it
    # stands on its own (a bare row is hard to parse without an image).
    panel = (f'<div class="screen-panel"><span class="sp-key">{al}</span>'
             f'<div class="sp-body">{s["system"]}</div></div>')
    body = f'<div class="step-body">{user_row}{panel}{extra}{dec}{io}</div>'
    return f'<div class="step" id="{rid}">{head}{body}</div>'

def _path(p, ss_dir, mode, al, dec_map=None, anchored=None, prose_qa=True):
    rid = _path_rid(p)
    steps = p['steps']
    strip = ''.join(
        f'<li><span class="skid">{_step_rid(p, s)}</span> {s.get("summary") or s["user"]}</li>'
        for s in steps)
    skim = f'<ol class="skim">{strip}</ol>' if strip else ''
    body = ''.join(_step(p, s, ss_dir, mode, al, dec_map, anchored) for s in steps)
    qa_items = [s['qa'] for s in steps if s.get('qa')] if prose_qa else []
    qa = ''
    if qa_items:
        lis = ''.join(f'<li><span class="qa-check">&#9744;</span><span>{q}</span></li>' for q in qa_items)
        qa = (f'<div class="qa-box"><div class="qa-box-title">QA verifies &mdash; {rid} &middot; {p["name"]}</div>'
              f'<ul>{lis}</ul></div>')
    tail = p.get('tail', '')
    bridge = ''
    if p.get('bridge'):
        bridge = f'<div class="bridge"><span class="bridge-i">&darr;</span><div>{p["bridge"]}</div></div>'
    return (f'<section id="{rid}" class="path">'
            f'<div class="path-head"><span class="pbadge noxref">{rid}</span>'
            f'<span class="pname">{p["name"]}</span>{_since(p)}</div>'
            f'<p class="pdesc">{p["desc"]}</p>{skim}{body}{qa}{tail}{bridge}</section>')

def _section_card(sec, ss_dir, mode):
    img = _img(ss_dir, sec.get('shot', ''), mode, sec['name'])
    return (f'<div class="psec"><div class="psec-body">'
            f'<div class="psec-name">{sec["name"]}</div>'
            f'<div class="psec-purpose">{sec["purpose"]}</div></div>{img}</div>')

# ── SVG inline ────────────────────────────────────────────────────────────────
def _svg(path):
    if not path or not os.path.exists(path):
        return '<p style="color:#9aabb6;font-size:13px">(flow SVG not found)</p>'
    with open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    i = s.find('<svg')
    return s[i:] if i >= 0 else s

# Spec CSS lives in the sibling spec-styles.css (externalized 2026-07-19, R-21).
# Edit that file, not a Python string; the golden test guards byte-identical output.
_STYLES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec-styles.css')
with open(_STYLES_PATH, encoding='utf-8') as _f:
    CSS = _f.read()

def _feature_html(cfg):
    if not (cfg.get('description') or cfg.get('background') or cfg.get('goal')):
        return ''
    rows = ''
    if cfg.get('background'):
        rows += f'<div class="fmeta"><span class="fk">Background</span><div>{cfg["background"]}</div></div>'
    if cfg.get('goal'):
        rows += f'<div class="fmeta"><span class="fk">Goal</span><div>{cfg["goal"]}</div></div>'
    desc = f'<p class="feature-desc">{cfg["description"]}</p>' if cfg.get('description') else ''
    return f'<div class="feature">{desc}{rows}</div>'

def _states_html(cfg):
    if not cfg.get('states'):
        return '', ''
    rows = ''.join(
        f'<tr><td class="idcell">{s[0]}</td><td>{s[1]}</td><td>{s[2]}</td><td>{s[3]}</td><td>{s[4]}</td></tr>'
        for s in cfg['states'])
    html = (f'<div id="states" class="section"><div class="section-title"><span class="num">&#9783;</span> State Inventory</div>'
            f'<p class="section-note">The contract of each screen state. The flow diagram shows the transitions; this shows what each state must render.</p>'
            f'<div class="table-wrap"><table><thead><tr><th>State</th><th>Entry condition</th>'
            f'<th>Visible / enabled</th><th>Transitions</th><th>Exit</th></tr></thead>'
            f'<tbody>{rows}</tbody></table></div></div>')
    return html, '<a class="nav-link" href="#states">State Inventory</a>'

def _proto_html(cfg):
    if not cfg.get('prototype_deltas'):
        return '', ''
    rows = ''.join(
        f'<tr><td>{d[0]}</td><td>{d[1]}</td><td class="proto-prod">{d[2]}</td></tr>'
        for d in cfg['prototype_deltas'])
    html = (f'<div id="prototype" class="section"><div class="section-title"><span class="num">&#9888;</span> Prototype Simplifications &mdash; NOT the production contract</div>'
            f'<p class="section-note">Where the prototype fakes or stubs behaviour. Build the <strong>production must do</strong> column &mdash; never the prototype behaviour.</p>'
            f'<div class="table-wrap proto-wrap"><table><thead><tr><th>Area</th><th>Prototype does</th><th>Production must do</th></tr></thead>'
            f'<tbody>{rows}</tbody></table></div></div>')
    return html, '<a class="nav-link" href="#prototype">Prototype Simplifications</a>'

def _references_html(cfg):
    refs = cfg.get('references', [])
    if not refs:
        return '', ''
    def _ref_row(r):
        item, link, owner = r[0], r[1], r[2] if len(r) > 2 else ''
        link_cell = f'<a href="{link}" target="_blank">Open &nearr;</a>' if link and link.startswith('http') else (link or '&mdash;')
        return f'<tr><td>{item}</td><td class="ref-link">{link_cell}</td><td>{owner}</td></tr>'
    rows = ''.join(_ref_row(r) for r in refs)
    html = (f'<div id="references" class="section"><div class="section-title"><span class="num">&#128279;</span> References</div>'
            f'<div class="table-wrap"><table><thead><tr><th>Item</th><th>Link</th><th>Owner</th></tr></thead>'
            f'<tbody>{rows}</tbody></table></div></div>')
    return html, '<a class="nav-link" href="#references">References</a>'

def _changelog_html(cfg):
    if not cfg.get('changelog'):
        return '', ''
    rows = ''.join(f'<tr><td class="idcell">{c[0]}</td><td>{c[1]}</td><td>{c[2]}</td></tr>' for c in cfg['changelog'])
    html = (f'<div id="changelog" class="section"><div class="section-title"><span class="num">&#8635;</span> Changelog</div>'
            f'<p class="section-note">Newest first. New or changed content above is marked with a green <span class="since" style="vertical-align:middle">NEW</span> badge. Superseded full versions are archived under <code>specs/_archive/</code>.</p>'
            f'<div class="table-wrap"><table><thead><tr><th>Version</th><th>Date</th><th>What changed</th></tr></thead>'
            f'<tbody>{rows}</tbody></table></div></div>')
    return html, '<a class="nav-link" href="#changelog">Changelog</a>'

def _flow_html(cfg):
    mermaid = cfg.get('mermaid', '')
    inner = _svg(cfg.get('svg_path', ''))
    mer = (f'<details style="margin-top:10px"><summary style="font-size:13px;color:#4a6070;cursor:pointer">Mermaid source</summary>'
           f'<pre class="mermaid-src">{mermaid}</pre></details>') if mermaid else ''
    return (f'<div id="flow-diagram" class="flow-box"><details class="flow-details">'
            f'<summary><span class="num">&darr;</span> Flow Diagram &mdash; full user journey (click to expand)</summary>'
            f'<div class="flow-inner">{inner}{mer}</div></details></div>')

def _original_spec_meta(cfg):
    if cfg.get('original_spec_url'):
        return ('<span class="meta-sep">&middot;</span><span class="meta-item"><strong>Original spec:</strong> '
                f'<a href="{cfg["original_spec_url"]}" target="_blank">Open &nearr;</a></span>')
    return ''

def _prototype_meta(cfg):
    """Header link to the interactive prototype. Omitted entirely when the cfg
    has no 'prototype_url' — a spec built without one must not show a dead link."""
    url = cfg.get('prototype_url')
    if not url:
        return ''
    return ('<span class="meta-sep">&middot;</span>\n'
            '    <span class="meta-item"><strong>Prototype:</strong> '
            f'<a href="{url}" target="_blank">Open &nearr;</a></span>')

def _guideline_meta(cfg):
    if cfg.get('guideline'):
        g = f'<a href="{cfg["guideline"]}" target="_blank">Open &nearr;</a>'
    else:
        g = '<span class="tbd" title="TBD — link to be added">Open &nearr;</span>'
    return f'<span class="meta-sep">&middot;</span><span class="meta-item"><strong>Guideline:</strong> {g}</span>'

def _central_firebase():
    """Shared Firebase config from <project-root>/agent.config.json ("firebase" key).
    Lets every spec share one comment backend without copying the config into each
    build_spec.py. Returns None if the file/key is absent (→ localStorage fallback)."""
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    try:
        with open(os.path.join(root, 'agent.config.json'), encoding='utf-8') as f:
            fb = json.load(f).get('firebase')
        return {k: v for k, v in fb.items() if not k.startswith('_')} if fb else None
    except (OSError, ValueError, AttributeError):
        return None

def _comments_html(cfg, mode):
    """Return the comment-system bootstrap injected before </body>.

    Off unless cfg['comments_enabled'] is truthy. Linked mode references the
    shared module at /shared/yco-comments.js (served from the project root by
    the localhost server / Vercel). Bundled mode inlines the module source so
    the single file stays self-contained — the Firebase SDK (when a config is
    present) still loads from CDN at runtime, and the localStorage fallback
    works fully offline.
    """
    if not cfg.get('comments_enabled'):
        return ''
    spec_id = cfg.get('comments_spec_id') or cfg.get('out_dir', 'spec')
    # Per-spec firebase_config wins; otherwise fall back to the shared block in
    # agent.config.json so every spec uses one project without copying the config.
    fb = cfg.get('firebase_config') or _central_firebase()
    fb_json = json.dumps(fb) if fb else 'null'
    spec_id_json = json.dumps(spec_id)
    if mode == 'bundled':
        # .../<feature>/specs -> project root is three levels up
        root = os.path.dirname(os.path.dirname(os.path.dirname(cfg['out_dir'])))
        src_path = os.path.join(root, 'shared', 'yco-comments.js')
        try:
            with open(src_path, encoding='utf-8') as f:
                module_src = f.read()
        except OSError:
            return '<!-- yco-comments: shared/yco-comments.js not found; comments skipped in bundled build -->'
        return (f'<script type="module">\n{module_src}\n'
                f'window.YCO_FIREBASE_CONFIG = {fb_json};\n'
                f'initComments({spec_id_json});\n</script>')
    # linked
    return (f'<script type="module">\n'
            f'import {{ initComments }} from "/shared/yco-comments.js";\n'
            f'window.YCO_FIREBASE_CONFIG = {fb_json};\n'
            f'initComments({spec_id_json});\n</script>')

# A spec ships as spec-bundled.html for external share, so an embedded sample
# payload must not carry authored prompt content — the same IP the spec's own
# engine-only table says must never surface. Values are replaced, keys are kept,
# so the shape an RD needs to read is still intact.
_DEFAULT_REDACT = ('style_prompt', 'negative_prompt', 'motion_prompt', 'prompt',
                   'sys_prompt', 'system_prompt')

def _redact(node, keys):
    if isinstance(node, dict):
        return {k: ('<redacted — engine-only, see the engine-only table>'
                    if k in keys and isinstance(v, str) else _redact(v, keys))
                for k, v in node.items()}
    if isinstance(node, list):
        return [_redact(v, keys) for v in node]
    return node

# ── JSON schema blocks ───────────────────────────────────────────────────────
# A five-column table answers "what does this key render as". It cannot answer
# "what shape is this payload" — nesting and arrays flatten out of it, and the
# RD has to rebuild the structure in their head from dotted key paths. For a
# payload whose contract IS its shape, show the JSON and document the keys
# underneath: the layout every RD already reads API docs in.
#
# The builder highlights the JSON itself. Hand-authored <span>s in a cfg were
# the alternative, and they rot — a value edited without its markup silently
# loses colour, and nothing catches it.
_JSON_TOK = re.compile(
    r'(?P<str>"(?:\\.|[^"\\])*")(?P<colon>[ \t]*:)?'
    r'|(?P<punc>[{}\[\],])'
    r'|(?P<lit>-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)')

def _esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def _json_html(src):
    """Syntax-highlight a JSON sample. A string followed by ':' is a key, so the
    reader can tell the contract's field names from its example values."""
    out, last = [], 0
    for m in _JSON_TOK.finditer(src):
        out.append(_esc(src[last:m.start()]))
        if m.group('str') is not None:
            s = _esc(m.group('str'))
            if m.group('colon'):
                out.append(f'<span class="jk">{s}</span>'
                           f'<span class="jpunc">{_esc(m.group("colon"))}</span>')
            else:
                out.append(f'<span class="jstr">{s}</span>')
        elif m.group('punc'):
            out.append(f'<span class="jpunc">{_esc(m.group("punc"))}</span>')
        else:
            out.append(f'<span class="jlit">{_esc(m.group("lit"))}</span>')
        last = m.end()
    out.append(_esc(src[last:]))
    return ''.join(out)

_COPY_JS = ("const t=this.closest('.jb').querySelector('code').innerText;"
            "navigator.clipboard.writeText(t);this.dataset.copied=1;"
            "setTimeout(()=>this.removeAttribute('data-copied'),1200)")
_COPY_SVG = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
             'stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/>'
             '<path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>')

def _schema_block(s):
    """One JSON payload + its field documentation.

    `{caption, json, fields:[(key, type, desc)], note?}`. `json` is a raw JSON
    string (or a dict/list, dumped here). A field's `type` may be omitted.
    Fields are stacked, never two-column: a long key path overlapped its own
    description in the side-by-side version this replaced."""
    src = s['json']
    if not isinstance(src, str):
        src = json.dumps(src, indent=2, ensure_ascii=False)
    rows = ''
    for f in s.get('fields', []):
        key, typ, desc = (f if len(f) == 3 else (f[0], '', f[1]))
        badge = f'<span class="jf-type">{typ}</span>' if typ else ''
        rows += (f'<div class="jf-row"><div class="jf-key"><code>{key}</code>{badge}</div>'
                 f'<div class="jf-desc">{desc}</div></div>')
    note = f'<p class="jf-note">{s["note"]}</p>' if s.get('note') else ''
    return (f'{_dc_caption(s.get("caption"))}'
            f'<div class="dc-block"><div class="jb"><div class="jb-toolbar">'
            f'<span class="jb-badge">JSON</span>'
            f'<button class="jb-copy" type="button" title="Copy" '
            f'onclick="{_COPY_JS}">{_COPY_SVG}</button></div>'
            f'<pre><code>{_json_html(src)}</code></pre></div>'
            f'<div class="jf">{rows}</div>{note}</div>')

def _context_shot_html(cfg, ss, mode):
    """One screenshot showing where the contract surfaces in the product.

    A data-contract spec has no step cards, so it had nowhere to put the screen
    it is about — and a payload mapping with no picture of where it lands makes
    the reader guess which column of which table is in scope. Optional, and
    equally usable by a storyboard spec that wants a locator shot up front.

    `cfg['context_shot']` = {shot, caption?, focus?} — same shot/focus shape as
    a step, so `focus.json` measurement and the numbered-frame legend apply."""
    cs = cfg.get('context_shot')
    if not cs:
        return ''
    body = _img(ss, cs['shot'], mode, cs.get('alt', 'Where this contract renders'),
                cs.get('focus'))
    cap = f'<p class="jf-note">{cs["caption"]}</p>' if cs.get('caption') else ''
    return f'<div class="dc-block">{body}{cap}</div>'

def _dc_notes(dc):
    """Keys that are classified but not displayed.

    Classification and display are different jobs and were being done by the same
    table. The linter needs every payload key triaged — that is a completeness
    guarantee, and it should stay at 100%. An RD reading the contract needs the
    keys that change what they build. A five-column row whose "Renders as" cell
    says *Nothing* satisfies the first and costs the second: it is a full-width
    row that resolves to "ignore this".

    So the triage still happens, in a form sized to what it says. `engine_only`
    and `no_ui` keep every key name in the document — the linter's haystack reads
    them, `_check_xrefs` links them, a reader searching for `srcKeys` still finds
    it — while the table is left to the keys that render something.

        'engine_only': {'label': 'T4 · …', 'keys': [...], 'why': '…'}
        'no_ui': [(keys_html, why), …]
    """
    out = ''
    eo = dc.get('engine_only')
    if eo:
        keys = ' &middot; '.join(f'<code>{k}</code>' for k in eo['keys'])
        out += (f'<p class="dc-note" id="{eo.get("id", "T4")}">'
                f'<strong>{eo.get("label", "Engine-only &mdash; must never reach the UI")}.</strong> '
                f'{keys} &mdash; {eo["why"]}</p>')
    if dc.get('no_ui'):
        items = ' &middot; '.join(f'<code>{k}</code> ({why})' for k, why in dc['no_ui'])
        out += (f'<p class="dc-note" id="no-ui-keys">'
                f'<strong>{dc.get("no_ui_label", "Read from the payload, renders nothing")}.</strong> '
                f'{items}</p>')
    return out

def _data_contract_html(cfg, mode='linked'):
    """Data Contract — a first-class section instead of tables buried in a step.

    `cfg['data_contract']` = {intro?, schemas:[...], tables:[...],
    reverse:[(ui_element, key)], payloads:[path]}. Tables use the same
    {caption, cols, rows} shape as step tables, so an existing in-step table
    moves here unchanged. `schemas` renders JSON-plus-field-docs instead — use
    it when the contract is the payload's SHAPE, tables when it is per-key
    render rules; a spec may use both. The reverse index answers the other
    direction — an RD building one element wants to know which key feeds it,
    not to scan every key looking for their element."""
    dc = cfg.get('data_contract')
    if not dc:
        return '', ''
    body = f'<p class="section-note">{dc["intro"]}</p>' if dc.get('intro') else ''
    body += _context_shot_html(cfg, cfg.get('screenshots_dir', ''), mode)
    for s in dc.get('schemas', []):
        body += _schema_block(s)
    for t in dc.get('tables', []):
        body += _table_block(t)
    body += _dc_notes(dc)
    if dc.get('reverse'):
        rows = ''.join(f'<tr><td>{ui}</td><td><code>{key}</code></td></tr>'
                       for ui, key in dc['reverse'])
        body += _table_block({'caption': 'R1 &middot; On screen &rarr; source key',
                              'cols': ['What the user sees', 'Comes from'],
                              'rows': None, '_rows_html': rows})
    redact = dc.get('redact', _DEFAULT_REDACT)
    for pf in dc.get('payloads', []):
        if not os.path.exists(pf):
            continue
        with open(pf, encoding='utf-8') as f:
            data = json.load(f)
        shown = json.dumps(_redact(data, redact), indent=2, ensure_ascii=False)
        body += (f'<details class="payload"><summary>Sample payload &mdash; '
                 f'<code>{os.path.basename(pf)}</code></summary>'
                 f'<pre>{shown.replace("&", "&amp;").replace("<", "&lt;")}</pre></details>')
    html = (f'<div id="data-contract" class="section">'
            f'<div class="section-title"><span class="num">&#123;&#125;</span> Data Contract</div>'
            f'{body}</div>')
    return html, '<a class="nav-link" href="#data-contract">Data Contract</a>'

def _open_questions_html(cfg):
    """Open Questions — what is still undecided, who owns it, and what it blocks.

    Design Decisions used to hold three different things at once: settled
    answers, scope statements, and questions nobody had answered yet. Only the
    last needs its own section; a settled answer belongs beside the rule it
    governs, and scope belongs in the overview."""
    oq = cfg.get('open_questions')
    if not oq:
        return '', ''
    rows = ''.join(
        f'<tr id="{q[0]}"><td class="idcell noxref">{q[0]}</td><td>{q[1]}</td>'
        f'<td>{q[2]}</td><td>{q[3]}</td></tr>' for q in oq)
    html = (f'<div id="open-questions" class="section">'
            f'<div class="section-title"><span class="num">?</span> Open Questions</div>'
            f'<p class="section-note">Undecided, and blocking something. Everything settled lives '
            f'beside the rule it governs, not here.</p>'
            f'<div class="table-wrap"><table><thead><tr><th>ID</th><th>Question</th>'
            f'<th>Blocks</th><th>Owner</th></tr></thead><tbody>{rows}</tbody></table></div></div>')
    return html, '<a class="nav-link" href="#open-questions">Open Questions</a>'

def _criteria_html(cfg):
    """QA coverage — `plan.md` acceptance criterion -> the step(s) that specify it.

    Replaces the per-path prose checklist. Those lines restated rules the step
    had already stated, so the same fact was written three times (plan.md, the
    step, the checklist) and none of them was a single pass/fail assertion. What
    QA actually needs from a spec is the mapping: which criterion lives where.
    Test cases themselves belong in the test tool, not in a behavior spec."""
    crit = cfg.get('criteria')
    if not crit:
        return '', ''
    rows = []
    for c in crit:
        cid, text, steps = c[0], c[1], (c[2] or [])
        note = c[3] if len(c) > 3 else ''
        where = (' &middot; '.join(f'<a href="#{s}">{s}</a>' for s in steps) if steps
                 else f'<span class="oos">{note or "not specified here"}</span>')
        rows.append(f'<tr id="{cid}"><td class="idcell noxref">{cid}</td>'
                    f'<td>{text}</td><td>{where}</td></tr>')
    covered = sum(1 for c in crit if c[2])
    html = (f'<div id="qa-coverage" class="section">'
            f'<div class="section-title"><span class="num">&#9745;</span> QA Coverage</div>'
            f'<p class="section-note">Every acceptance criterion in <code>plan.md</code> and where this '
            f'spec defines it &mdash; {covered} of {len(crit)} map to a step. '
            f'Write the test cases in your test tool; this table is the trace back to the spec.</p>'
            f'<div class="table-wrap"><table><thead><tr><th>Criterion</th><th>What it asserts</th>'
            f'<th>Specified in</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div></div>')
    return html, '<a class="nav-link" href="#qa-coverage">QA Coverage</a>'

def _errors_html(cfg):
    """Error States section + its nav link. ('', '') when cfg has no errors."""
    rows = ''.join(
        f'<tr><td class="idcell">{e[0]}</td><td>{e[1]}</td>'
        f'<td>&ldquo;{e[2]}&rdquo;</td><td>{e[3]}</td><td>{e[4]}</td></tr>' for e in cfg.get('errors', []))
    if not rows:
        return '', ''
    # A statement that holds for every row belongs under the table once, not
    # repeated in each row's cell.
    note = f'<p class="note">{cfg["errors_note"]}</p>' if cfg.get('errors_note') else ''
    # The fifth column started life as "Refund?" because the first specs were all
    # credit-spending flows. A feature that spends nothing has no refund to
    # report, and the column is better spent saying WHERE the error appears —
    # step IDs there become jump links like any other cross-reference. Default
    # unchanged so every existing spec renders byte-identically.
    last_col = cfg.get('errors_last_col', 'Refund?')
    html = (f'<div id="errors" class="section"><div class="section-title"><span class="num">!</span> Error States</div>'
            f'<div class="table-wrap"><table><thead><tr><th>Error</th><th>Trigger</th>'
            f'<th>Message shown to user</th><th>Recovery</th><th>{last_col}</th></tr></thead>'
            f'<tbody>{rows}</tbody></table></div>{note}</div>')
    return html, '<a class="nav-link" href="#errors">Error States</a>'

def _decisions_data(cfg, dec_map, first_ref):
    """Return (rows_html, thead_html) for the Design Decisions table. In inline
    mode each 3-tuple row anchors itself and back-links to its governing step."""
    def _dec_row(d):
        if len(d) != 3:
            return f'<tr><td>{d[0]}</td><td colspan="2">{d[1]}</td></tr>'
        if dec_map:  # inline mode: anchor the row + back-link to the governing step
            back = (f'<a class="dec-back" href="#{first_ref[d[0]]}">&#8617; {first_ref[d[0]]}</a>'
                    if d[0] in first_ref else '')
            return (f'<tr id="{d[0]}"><td class="idcell noxref">{d[0]}</td><td>{d[1]}</td>'
                    f'<td>{d[2]}{back}</td></tr>')
        # Anchor the row in plain mode too, so a "see D-01" anywhere in the spec
        # still resolves — and _check_xrefs can catch one that doesn't.
        return (f'<tr id="{d[0]}"><td class="idcell noxref">{d[0]}</td>'
                f'<td>{d[1]}</td><td>{d[2]}</td></tr>')
    rows = ''.join(_dec_row(d) for d in cfg.get('decisions', []))
    dec_has_id = any(len(d) == 3 for d in cfg.get('decisions', []))
    dec_head = ('<tr><th>ID</th><th>Question</th><th>Decision</th></tr>' if dec_has_id
                else '<tr><th>Question</th><th>Decision</th></tr>')
    return rows, dec_head

def _build(cfg, mode):
    ss = cfg.get('screenshots_dir', '')
    al = cfg.get('actor_label', 'WEB UI')
    short = cfg.get('short_nav') or [p["name"] for p in cfg.get('paths', [])]
    # Each path expands to its own steps. A 16-screen document with only
    # section-level links leaves the reader with no idea where they are.
    def _nav_path(p, label):
        rid = _path_rid(p)
        steps = ''.join(
            f'<a class="nav-link nav-step" href="#{_step_rid(p, st)}">'
            f'<span class="pid">{_step_rid(p, st)}</span>'
            f'{st.get("summary") or st["user"]}</a>' for st in p['steps'])
        return (f'<details class="nav-group" open><summary class="nav-link nav-path">'
                f'<span class="pid">{rid}</span>{label}</summary>{steps}</details>')
    nav_paths = ''.join(_nav_path(p, s) for p, s in zip(cfg.get('paths', []), short))
    nav_sections = '<a class="nav-link" href="#sections">Page Sections</a>' if cfg.get('page_sections') else ''
    states_html, nav_states = _states_html(cfg)
    proto_html, nav_proto = _proto_html(cfg)
    references_html, nav_references = _references_html(cfg)
    changelog_html, nav_changelog = _changelog_html(cfg)
    dec_map = _decision_map(cfg)
    first_ref = {}
    if dec_map:
        for p in cfg.get('paths', []):
            for s in p['steps']:
                for did in _dec_refs(s):
                    first_ref.setdefault(did, _step_rid(p, s))
    # Opt-out: with inline decisions on, the recap table can be pure duplication.
    # Default True keeps every existing spec byte-identical.
    show_dec_index = cfg.get('decisions_index', True)
    dec_anchored = None if show_dec_index else set()
    criteria_html, nav_criteria = _criteria_html(cfg)
    dc_html, nav_dc = _data_contract_html(cfg, mode)
    oq_html, nav_oq = _open_questions_html(cfg)
    # With a coverage table present, the per-path prose checklist is the third
    # copy of the same facts — drop it.
    paths = ''.join(_path(p, ss, mode, al, dec_map, dec_anchored,
                          prose_qa=not cfg.get('criteria'))
                    for p in cfg.get('paths', []))
    poverview = ''.join(
        f'<tr><td><span class="pn noxref">{_path_rid(p)}</span></td>'
        f'<td><a href="#{_path_rid(p)}">{p["name"]}</a> {_since(p)}</td>'
        f'<td>{p.get("entry","&mdash;")}</td><td><span class="sc">{len(p["steps"])} steps</span></td>'
        f'<td>{p.get("outcome","&mdash;")}</td></tr>' for p in cfg.get('paths', []))
    # A spec with no journey renders neither the path index nor its nav links —
    # an empty "All User Paths" table reads as a spec that forgot its content.
    if cfg.get('paths'):
        paths_html = f"""<div id="paths" class="section">
  <div class="section-title"><span class="num">&rarr;</span> All User Paths</div>
  <div class="poverview"><table>
    <thead><tr><th>ID</th><th>Path</th><th>Entry point</th><th>Steps</th><th>Outcome</th></tr></thead>
    <tbody>{poverview}</tbody>
  </table></div>
</div>
{paths}"""
        nav_overview_paths = '<a class="nav-link" href="#paths">All Paths</a>'
        nav_paths_label = '<div class="nav-label">User Paths</div>'
    else:
        paths_html = nav_overview_paths = nav_paths_label = ''
    overview_rows = ''.join(f'<tr><td>{k}</td><td>{v}</td></tr>' for k, v in cfg['overview'])
    sections_html = ''
    if cfg.get('page_sections'):
        cards = ''.join(_section_card(s, ss, mode) for s in cfg['page_sections'])
        sections_html = (f'<div id="sections" class="section">'
                         f'<div class="section-title"><span class="num">&#9635;</span> Page Sections</div>'
                         f'<p class="section-note">Static marketing / SEO sections of the page (no interaction beyond the flows above).</p>{cards}</div>')
    errors_html, nav_errors = _errors_html(cfg)
    # Same rule for the diagram: no journey and no supplied SVG means no
    # (empty) Flow Diagram accordion, and no nav link pointing into nothing.
    if cfg.get('svg_path') or cfg.get('mermaid'):
        flow_html = _flow_html(cfg)
        nav_flow = '<a class="nav-link" href="#flow-diagram">Flow Diagram</a>'
    else:
        flow_html = nav_flow = ''
    decisions, dec_head = _decisions_data(cfg, dec_map, first_ref)
    nav_decisions = '<a class="nav-link" href="#decisions">Design Decisions</a>' if show_dec_index else ''
    dec_note = ('<p class="section-note">Each decision also appears inline beside the step it governs; '
                'this is the recap. Follow the &#8617; link to jump to the first step that relies on it.</p>'
                ) if dec_map else ''
    dec_suffix = ' &mdash; reference index' if dec_map else ''
    decisions_html = f"""<div id="decisions" class="section">
  <div class="section-title"><span class="num">&#10003;</span> Design Decisions{dec_suffix}</div>
  {dec_note}
  <div class="table-wrap"><table><thead>{dec_head}</thead>
  <tbody>{decisions}</tbody></table></div>
</div>""" if show_dec_index else ''
    version = cfg.get('version', '')
    version_meta = (f'<span class="meta-sep">&middot;</span><span class="meta-item"><strong>Version:</strong> {version}</span>'
                    if version else '')
    # The default callout describes step cards and focus frames. A data-contract
    # spec has neither, so pointing the reader at them would be a lie in the
    # first paragraph.
    if cfg.get('spec_kind') == 'data-contract':
        # No literal ID here: boilerplate that cites "T2" as an example fails
        # _check_xrefs in any spec that stops at T1. Describe the family instead.
        _default_callout = (
            'This is a data-contract specification for the front-end RD, not production code. '
            'It defines how a payload resolves to what the user sees: each numbered block in '
            '<strong>Data Contract</strong> is one payload, shown as JSON with its keys '
            'documented underneath, and the resolution rule states how the blocks chain. '
            'The QA Coverage table maps every acceptance criterion to the block that specifies it.')
    else:
        _default_callout = (
            'This is a behavior specification for the front-end RD, not production code &mdash; the prototype source cannot be reused. '
            'Each step card shows the <strong>screenshot first</strong>, then what the <strong>user does</strong> (bold) and what the '
            f'<strong>{al}</strong> shows, with on-screen text, rules &amp; limits, and input/output below. On a screenshot, a '
            '<strong style="color:#e8392b">solid red</strong> frame marks the click that advances the flow; a '
            '<strong style="color:#e08a00">dashed amber</strong> frame marks a key point to note (hover a frame for its label). '
            'Steps carry a stable ID (e.g. <strong>P1-S2</strong>).')
    callout = cfg.get('callout', _default_callout)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>{cfg['feature_name']} &mdash; Spec</title>
<style>{CSS}</style>
</head>
<body>
<div class="layout">
<nav class="sidebar">
  <div class="sidebar-logo"><div class="dot"></div><span>YCO Spec</span></div>
  <input class="nav-jump" id="nav-jump" type="search" placeholder="Jump to ID (P1-S3, T1, D-12)" autocomplete="off"/>
  <div class="nav-label">Overview</div>
  <a class="nav-link" href="#overview">Overview</a>
  {nav_flow}
  {nav_overview_paths}
  {nav_paths_label}
  {nav_paths}
  <div class="nav-label">Reference</div>
  {nav_sections}
  {nav_dc}
  {nav_states}
  {nav_oq}
  {nav_criteria}
  {nav_errors}
  {nav_proto}
  {nav_decisions}
  {nav_references}
  {nav_changelog}
</nav>
<main class="main">
<div class="herebar">You are at <span id="here">the top</span></div>
<div class="spec-header">
  <div class="breadcrumb">{cfg.get('breadcrumb','YCO')}</div>
  <h1>{cfg['feature_name']}</h1>
  <div class="meta">
    <span class="badge">{cfg.get('status','Review')}</span>
    {version_meta}
    <span class="meta-sep">&middot;</span>
    <span class="meta-item"><strong>Author:</strong> {cfg.get('author','')}</span>
    <span class="meta-sep">&middot;</span>
    <span class="meta-item"><strong>Date:</strong> {cfg.get('date','')}</span>
    {_prototype_meta(cfg)}
    {_original_spec_meta(cfg)}
    {_guideline_meta(cfg)}
  </div>
</div>
{_feature_html(cfg)}
<div class="callout"><strong>Reading this spec.</strong> {callout}</div>
<div id="overview" class="overview-card"><table>{overview_rows}</table></div>
{flow_html}
{paths_html}
{sections_html}
{dc_html}
{states_html}
{oq_html}
{criteria_html}
{errors_html}
{proto_html}
{decisions_html}
{references_html}
{changelog_html}
</main>
</div>
<script>
const links=document.querySelectorAll('.nav-link');
const obs=new IntersectionObserver(e=>{{e.forEach(en=>{{if(en.isIntersecting){{
  links.forEach(l=>l.classList.remove('active'));
  const a=document.querySelector('.nav-link[href="#'+en.target.id+'"]');
  if(a)a.classList.add('active');}}}});}},{{rootMargin:'-20% 0px -70% 0px'}});
document.querySelectorAll('[id]').forEach(s=>obs.observe(s));
const active=()=>document.querySelector('.nav-link.active');
const obs2=new IntersectionObserver(e=>{{e.forEach(en=>{{if(en.isIntersecting){{
  const h=document.getElementById('here');
  if(h)h.textContent=en.target.id;}}}});}},{{rootMargin:'-10% 0px -85% 0px'}});
document.querySelectorAll('.step[id],.path[id],.section[id]').forEach(s=>obs2.observe(s));
const jump=document.getElementById('nav-jump');
if(jump)jump.addEventListener('keydown',ev=>{{
  if(ev.key!=='Enter')return;
  const t=document.getElementById(jump.value.trim().toUpperCase());
  if(t){{t.scrollIntoView({{block:'start'}});jump.classList.remove('bad');}}
  else jump.classList.add('bad');}});
if(jump)jump.addEventListener('input',()=>jump.classList.remove('bad'));
</script>
{_comments_html(cfg, mode)}
</body>
</html>"""

def archive_current(cfg, label=None):
    """Copy the existing spec.html / spec-bundled.html into specs/_archive/ before
    a version bump, so the old full version stays findable. Call BEFORE rebuilding.
    `label` defaults to the previous version+date, e.g. 'v1-2026-06-15'."""
    out_dir = cfg['out_dir']
    arc = os.path.join(out_dir, '_archive')
    os.makedirs(arc, exist_ok=True)
    tag = label or f"{cfg.get('version','v1')}-{cfg.get('date','')}"
    moved = []
    for fn in ('spec.html', 'spec-bundled.html'):
        src = os.path.join(out_dir, fn)
        if os.path.exists(src):
            dst = os.path.join(arc, fn.replace('.html', f'-{tag}.html'))
            shutil.copy2(src, dst)
            moved.append(dst)
    print(f'archived {len(moved)} file(s) → {arc}')
    return moved

def _archive_snaps(cfg):
    """Archived linked spec.html files, oldest first.

    Ordered by mtime, not filename. The name carries the version it was archived
    under, and a version line is not guaranteed to sort chronologically — this
    feature went v1.1 -> v3 -> v2 -> v4, so `spec-v3-.html` sorted last and
    version_diff reported 15 phantom removals against a superseded structure.
    When the archive was written is a fact; what it was called is an intention.
    """
    arc = os.path.join(cfg['out_dir'], '_archive')
    if not os.path.isdir(arc):
        return arc, []
    snaps = [f for f in os.listdir(arc)
             if f.startswith('spec-') and f.endswith('.html') and 'bundled' not in f]
    return arc, sorted(snaps, key=lambda f: os.path.getmtime(os.path.join(arc, f)))

def _spec_ids(path):
    """(structure IDs, decision IDs) read out of a built spec.html."""
    try:
        html = open(path, encoding='utf-8').read()
    except OSError:
        return set(), set()
    steps = set(re.findall(r'<div class="step[^"]*" id="(P\d+-[SE]\d+)"', html))
    paths = set(re.findall(r'<section id="(P\d+)" class="path"', html))
    decs = set(re.findall(r'<tr id="(D-\d+)"', html))
    return steps | paths, decs

def version_diff(cfg):
    """Print which path/step IDs were added or removed vs the most recently archived
    spec.html. Run after `archive_current(cfg)` + rebuild to see what changed between
    versions (complements the manual changelog + 'NEW' badges). ID-level, so it is
    robust to copy edits and ignores wording changes."""
    arc, snaps = _archive_snaps(cfg)
    if not snaps:
        print('version_diff: no archived spec.html in _archive/ yet (run archive_current first)')
        return None
    prev, _ = _spec_ids(os.path.join(arc, snaps[-1]))
    cur, _ = _spec_ids(os.path.join(cfg['out_dir'], 'spec.html'))
    added, removed = sorted(cur - prev), sorted(prev - cur)
    print(f'version_diff vs {snaps[-1]}:')
    print(f'  + added:   {", ".join(added) or "none"}')
    print(f'  - removed: {", ".join(removed) or "none"}')
    return {'added': added, 'removed': removed}

def infer_change_type(cfg):
    """'new' | 'behaviour' | 'cosmetic' — read off the archive, never declared.

    A self-declared change type buys nothing: the same judgement that decides a
    change is "just cosmetic" is the judgement that would skip the clarification
    round, so asking the agent to classify its own work only moves the gap. The
    previous version's own HTML is evidence instead.

      new        no archived spec.html — nothing to compare against
      behaviour  a path/step/decision ID appeared or disappeared
      cosmetic   the structure is identical; only wording moved

    Wording changes inside a step read as cosmetic, and that is the intended
    trade. A rule rewritten in place without a new decision row is exactly the
    edit this cannot see — which is why the gate below asks for evidence rather
    than trying to grade the edit."""
    arc, snaps = _archive_snaps(cfg)
    if not snaps:
        return 'new'
    prev_s, prev_d = _spec_ids(os.path.join(arc, snaps[-1]))
    cur_s = {_path_rid(p) for p in cfg.get('paths', [])} | \
            {_step_rid(p, s) for p in cfg.get('paths', []) for s in p['steps']}
    cur_d = {str(d[0]) for d in cfg.get('decisions', []) if d}
    if prev_s != cur_s or prev_d != cur_d:
        return 'behaviour'
    return 'cosmetic'

def _check_anchors(html):
    """Return internal links that point nowhere. Collects every emitted id and every
    in-page `<a href="#x">`, and reports fragments with no matching id. Scoped to <a>
    tags so the inlined flowchart SVG's marker refs (url(#…), <use href="#…">) and
    empty `href="#"` don't false-positive."""
    ids = set(re.findall(r'\bid="([^"]+)"', html))
    bad = []
    for m in re.finditer(r'<a\b[^>]*\shref="#([^"]+)"', html):
        frag = m.group(1)
        if frag and frag not in ids:
            bad.append(frag)
    return sorted(set(bad))

def write_specs(cfg, outdir=None, linked_only=False, skip_validate=False):
    """Validate cfg, then write spec.html (linked) and spec-bundled.html (base64).
    Exact focus boxes from specs/focus.json (if present) override manual estimates."""
    _apply_focus_map(cfg)
    if not skip_validate:
        validate(cfg)
    outdir = outdir or cfg['out_dir']
    os.makedirs(outdir, exist_ok=True)
    html = _linkify(_build(cfg, 'linked'))
    if not skip_validate:
        dangling = _check_anchors(html)
        if dangling:
            raise SpecValidationError(
                'dangling internal links — these href="#…" targets have no matching id: '
                + ', '.join('#' + d for d in dangling))
        # A bare "(T4)" or "see D-09" that resolves to nothing reads as if the
        # spec defines it. Fail rather than ship a promise with no target.
        missing = _check_xrefs(html)
        if missing:
            raise SpecValidationError(
                'cross-references with no target — the spec cites these IDs but never defines them: '
                + ', '.join(f'{k} (x{v})' for k, v in sorted(missing.items())))
    p = os.path.join(outdir, 'spec.html')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'spec.html written ({os.path.getsize(p)//1024} KB)')
    if not linked_only:
        pb = os.path.join(outdir, 'spec-bundled.html')
        with open(pb, 'w', encoding='utf-8') as f:
            f.write(_linkify(_build(cfg, 'bundled')))
        print(f'spec-bundled.html written ({os.path.getsize(pb)//1024} KB)')
