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
import base64, json, os, re, shutil

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

def validate(cfg):
    """Hard-fail on CJK, missing screenshots, a path with no QA, or a leaked
    'prototype' note with no Prototype Simplifications row. Warn (print, don't
    fail) on likely code/DOM tokens, a step screenshot with no focus highlight,
    and a missing Feature description. Returns the list of warnings."""
    errors, warnings = [], []
    ss = cfg.get('screenshots_dir', '')

    # ── schema gate (friendly errors instead of a raw KeyError later) ───────────
    schema_errs = []
    for k, t in {'feature_name': str, 'paths': list, 'screenshots_dir': str, 'out_dir': str}.items():
        if k not in cfg:
            schema_errs.append(f"missing required cfg key: '{k}'")
        elif not isinstance(cfg[k], t):
            schema_errs.append(f"cfg['{k}'] must be {t.__name__}, got {type(cfg[k]).__name__}")
    if isinstance(cfg.get('paths'), list):
        if not cfg['paths']:
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

    for label, txt in _step_strings(cfg):
        if _CJK.search(txt):
            errors.append(f"CJK characters in {label}: {txt[:50]!r}")
        if _CODE.search(txt):
            warnings.append(f"possible code/DOM token in {label}: {txt[:50]!r}")

    for p in cfg.get('paths', []):
        for s in p['steps']:
            shot = s.get('shot', '')
            if shot and ss and not os.path.exists(os.path.join(ss, shot)):
                errors.append(f"missing screenshot: {shot} (path {p['num']})")
            # Focus is discretionary: only steps with a click that advances the
            # flow get an (action) frame; passive steps legitimately have none.
    for sec in cfg.get('page_sections', []):
        shot = sec.get('shot', '')
        if shot and ss and not os.path.exists(os.path.join(ss, shot)):
            errors.append(f"missing screenshot: {shot} (page section {sec['name']})")

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
def _b64(ss_dir, name):
    path = os.path.join(ss_dir, name)
    if not name or not os.path.exists(path):
        return ''
    with open(path, 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()

FOCUS_PAD_PX = 6  # outward gap so the frame surrounds the component, not overlays it

def _focus_boxes(focus):
    """Frame overlay(s). focus = list of {box:[x,y,w,h] in %, label?, type?}.
    type 'action' (default) = solid red (the click that advances the flow);
    type 'info' = dashed amber (a key UI point to note). The label is a
    hover-only tooltip. A fixed outward padding (FOCUS_PAD_PX) is added via
    calc() so the frame sits around the component with a small gap."""
    if not focus:
        return ''
    p, p2 = FOCUS_PAD_PX, FOCUS_PAD_PX * 2
    out = []
    for f in focus:
        x, y, w, h = f['box']
        cls = 'fbox fbox-info' if f.get('type') == 'info' else 'fbox'
        lbl = f'<span class="fbox-label">{f["label"]}</span>' if f.get('label') else ''
        out.append(
            f'<div class="{cls}" style="left:calc({x}% - {p}px);top:calc({y}% - {p}px);'
            f'width:calc({w}% + {p2}px);height:calc({h}% + {p2}px)">{lbl}</div>')
    return ''.join(out)

def _img(ss_dir, name, mode, alt, focus=None):
    # Pending screenshot (named but not captured yet) — keep a placeholder.
    if name and not os.path.exists(os.path.join(ss_dir, name)):
        return (f'<div class="shot noshot">&#128247; screenshot pending &mdash; <code>{name}</code><br>'
                f'<span style="font-size:11px">run <code>capture_screenshots.py</code> then rebuild</span></div>')
    src = _b64(ss_dir, name) if mode == 'bundled' else f'screenshots/{name}'
    boxes = _focus_boxes(focus)
    return (f'<div class="shot"><div class="shotwrap">'
            f'<img src="{src}" alt="{alt}" loading="lazy"/>{boxes}</div></div>')

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
    """A labelled detail block; list values render as a bullet list."""
    if value is None or (isinstance(value, str) and value.strip() == ''):
        return ''
    if isinstance(value, (list, tuple)):
        items = ''.join(f'<li>{v}</li>' for v in value)
        body = f'<ul class="mlist">{items}</ul>'
    else:
        body = f'<span class="mval">{value}</span>'
    return f'<div class="mline"><span class="mkey">{label}</span><div class="mbody">{body}</div></div>'

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
        cap = (f'<div style="font-size:9.5px;font-weight:700;letter-spacing:.5px;'
               f'text-transform:uppercase;color:#8a9aa6;margin:0 0 7px">{t["caption"]}</div>'
               if t.get('caption') else '')
        thead = ''
        if t.get('cols'):
            thead = '<thead><tr>' + ''.join(f'<th>{c}</th>' for c in t['cols']) + '</tr></thead>'
        rows = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in t.get('rows', []))
        out += (f'<div class="mline"><div class="mbody" style="width:100%">{cap}'
                f'<div class="table-wrap"><table>{thead}<tbody>{rows}</tbody></table></div></div></div>')
    return out

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

def _dec_inline_html(s, dec_map):
    if not dec_map:
        return ''
    out = ''
    for did in _dec_refs(s):
        d = dec_map.get(did)
        if not d:
            continue
        out += (f'<div class="dec-inline"><a class="dec-inline-id" href="#{did}">{did}</a>'
                f'<div class="dec-inline-body"><span class="dec-inline-q">{d[0]}</span>'
                f'{d[1]}</div></div>')
    return out

def _step(p, s, ss_dir, mode, al, dec_map=None):
    is_err = s.get('role') == 'error'
    rid = _step_rid(p, s)
    user_label = '&#9888; ERROR' if is_err else 'USER'
    user_cls = 'r-err' if is_err else 'r-user'
    user_row = (f'<div class="srow"><span class="role {user_cls}">{user_label}</span>'
                f'<span class="stext su{" err" if is_err else ""}">{s["user"]}</span></div>')
    # Input/Output — rendered LAST (bottom of the step body).
    io = ''
    if not (_is_blank(s.get('inp')) and _is_blank(s.get('out'))):
        io = (f'<div class="io"><strong>Input:</strong> {s.get("inp") or "&mdash;"} '
              f'&nbsp;&middot;&nbsp; <strong>Output:</strong> {s.get("out") or "&mdash;"}</div>')
    extra = _meta_block('On-screen text', s.get('exact')) + _meta_block('Rules &amp; limits', s.get('limits')) + _step_tables(s)
    dec = _dec_inline_html(s, dec_map)
    head = (f'<div class="{"step-head err" if is_err else "step-head"}">'
            f'<span class="snum{" err" if is_err else ""}">{rid}</span>{_since(s)}</div>')
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

def _path(p, ss_dir, mode, al, dec_map=None):
    rid = _path_rid(p)
    steps = p['steps']
    strip = ''.join(
        f'<li><span class="skid">{_step_rid(p, s)}</span> {s.get("summary") or s["user"]}</li>'
        for s in steps)
    skim = f'<ol class="skim">{strip}</ol>' if strip else ''
    body = ''.join(_step(p, s, ss_dir, mode, al, dec_map) for s in steps)
    qa_items = [s['qa'] for s in steps if s.get('qa')]
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
            f'<div class="path-head"><span class="pbadge">{rid}</span>'
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

def _errors_html(cfg):
    """Error States section + its nav link. ('', '') when cfg has no errors."""
    rows = ''.join(
        f'<tr><td class="idcell">{e[0]}</td><td>{e[1]}</td>'
        f'<td>&ldquo;{e[2]}&rdquo;</td><td>{e[3]}</td><td>{e[4]}</td></tr>' for e in cfg.get('errors', []))
    if not rows:
        return '', ''
    html = (f'<div id="errors" class="section"><div class="section-title"><span class="num">!</span> Error States</div>'
            f'<div class="table-wrap"><table><thead><tr><th>Error</th><th>Trigger</th>'
            f'<th>Message shown to user</th><th>Recovery</th><th>Refund?</th></tr></thead>'
            f'<tbody>{rows}</tbody></table></div></div>')
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
            return (f'<tr id="{d[0]}"><td class="idcell">{d[0]}</td><td>{d[1]}</td>'
                    f'<td>{d[2]}{back}</td></tr>')
        return f'<tr><td class="idcell">{d[0]}</td><td>{d[1]}</td><td>{d[2]}</td></tr>'
    rows = ''.join(_dec_row(d) for d in cfg.get('decisions', []))
    dec_has_id = any(len(d) == 3 for d in cfg.get('decisions', []))
    dec_head = ('<tr><th>ID</th><th>Question</th><th>Decision</th></tr>' if dec_has_id
                else '<tr><th>Question</th><th>Decision</th></tr>')
    return rows, dec_head

def _build(cfg, mode):
    ss = cfg['screenshots_dir']
    al = cfg.get('actor_label', 'WEB UI')
    short = cfg.get('short_nav') or [p["name"] for p in cfg['paths']]
    nav_paths = ''.join(
        f'<a class="nav-link nav-path" href="#{_path_rid(p)}"><span class="pid">{_path_rid(p)}</span>{s}</a>'
        for p, s in zip(cfg['paths'], short))
    nav_sections = '<a class="nav-link" href="#sections">Page Sections</a>' if cfg.get('page_sections') else ''
    states_html, nav_states = _states_html(cfg)
    proto_html, nav_proto = _proto_html(cfg)
    references_html, nav_references = _references_html(cfg)
    changelog_html, nav_changelog = _changelog_html(cfg)
    dec_map = _decision_map(cfg)
    first_ref = {}
    if dec_map:
        for p in cfg['paths']:
            for s in p['steps']:
                for did in _dec_refs(s):
                    first_ref.setdefault(did, _step_rid(p, s))
    paths = ''.join(_path(p, ss, mode, al, dec_map) for p in cfg['paths'])
    poverview = ''.join(
        f'<tr><td><span class="pn">{_path_rid(p)}</span></td>'
        f'<td><a href="#{_path_rid(p)}">{p["name"]}</a> {_since(p)}</td>'
        f'<td>{p.get("entry","&mdash;")}</td><td><span class="sc">{len(p["steps"])} steps</span></td>'
        f'<td>{p.get("outcome","&mdash;")}</td></tr>' for p in cfg['paths'])
    overview_rows = ''.join(f'<tr><td>{k}</td><td>{v}</td></tr>' for k, v in cfg['overview'])
    sections_html = ''
    if cfg.get('page_sections'):
        cards = ''.join(_section_card(s, ss, mode) for s in cfg['page_sections'])
        sections_html = (f'<div id="sections" class="section">'
                         f'<div class="section-title"><span class="num">&#9635;</span> Page Sections</div>'
                         f'<p class="section-note">Static marketing / SEO sections of the page (no interaction beyond the flows above).</p>{cards}</div>')
    errors_html, nav_errors = _errors_html(cfg)
    flow_html = _flow_html(cfg)
    decisions, dec_head = _decisions_data(cfg, dec_map, first_ref)
    version = cfg.get('version', '')
    version_meta = (f'<span class="meta-sep">&middot;</span><span class="meta-item"><strong>Version:</strong> {version}</span>'
                    if version else '')
    callout = cfg.get('callout',
        'This is a behavior specification for the front-end RD, not production code &mdash; the prototype source cannot be reused. '
        'Each step card shows the <strong>screenshot first</strong>, then what the <strong>user does</strong> (bold) and what the '
        f'<strong>{al}</strong> shows, with on-screen text, rules &amp; limits, and input/output below. On a screenshot, a '
        '<strong style="color:#e8392b">solid red</strong> frame marks the click that advances the flow; a '
        '<strong style="color:#e08a00">dashed amber</strong> frame marks a key point to note (hover a frame for its label). '
        'Steps carry a stable ID (e.g. <strong>P1-S2</strong>).')

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
  <div class="nav-label">Overview</div>
  <a class="nav-link" href="#overview">Overview</a>
  <a class="nav-link" href="#flow-diagram">Flow Diagram</a>
  <a class="nav-link" href="#paths">All Paths</a>
  <div class="nav-label">User Paths</div>
  {nav_paths}
  <div class="nav-label">Reference</div>
  {nav_sections}
  {nav_states}
  {nav_errors}
  {nav_proto}
  <a class="nav-link" href="#decisions">Design Decisions</a>
  {nav_references}
  {nav_changelog}
</nav>
<main class="main">
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
    <span class="meta-sep">&middot;</span>
    <span class="meta-item"><strong>Prototype:</strong> <a href="{cfg.get('prototype_url','#')}" target="_blank">Open &nearr;</a></span>
    {_original_spec_meta(cfg)}
    {_guideline_meta(cfg)}
  </div>
</div>
{_feature_html(cfg)}
<div class="callout"><strong>Reading this spec.</strong> {callout}</div>
<div id="overview" class="overview-card"><table>{overview_rows}</table></div>
{flow_html}
<div id="paths" class="section">
  <div class="section-title"><span class="num">&rarr;</span> All User Paths</div>
  <div class="poverview"><table>
    <thead><tr><th>ID</th><th>Path</th><th>Entry point</th><th>Steps</th><th>Outcome</th></tr></thead>
    <tbody>{poverview}</tbody>
  </table></div>
</div>
{paths}
{sections_html}
{states_html}
{errors_html}
{proto_html}
<div id="decisions" class="section">
  <div class="section-title"><span class="num">&#10003;</span> Design Decisions{' &mdash; reference index' if dec_map else ''}</div>
  {'<p class="section-note">Each decision also appears inline beside the step it governs; this is the recap. Follow the &#8617; link to jump to the first step that relies on it.</p>' if dec_map else ''}
  <div class="table-wrap"><table><thead>{dec_head}</thead>
  <tbody>{decisions}</tbody></table></div>
</div>
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

def version_diff(cfg):
    """Print which path/step IDs were added or removed vs the most recently archived
    spec.html. Run after `archive_current(cfg)` + rebuild to see what changed between
    versions (complements the manual changelog + 'NEW' badges). ID-level, so it is
    robust to copy edits and ignores wording changes."""
    arc = os.path.join(cfg['out_dir'], '_archive')
    snaps = sorted(f for f in os.listdir(arc)) if os.path.isdir(arc) else []
    snaps = [f for f in snaps if f.startswith('spec-') and f.endswith('.html') and 'bundled' not in f]
    if not snaps:
        print('version_diff: no archived spec.html in _archive/ yet (run archive_current first)')
        return None
    def _ids(path):
        try:
            html = open(path, encoding='utf-8').read()
        except OSError:
            return set()
        steps = set(re.findall(r'<div class="step[^"]*" id="(P\d+-[SE]\d+)"', html))
        paths = set(re.findall(r'<section id="(P\d+)" class="path"', html))
        return steps | paths
    prev = _ids(os.path.join(arc, snaps[-1]))
    cur = _ids(os.path.join(cfg['out_dir'], 'spec.html'))
    added, removed = sorted(cur - prev), sorted(prev - cur)
    print(f'version_diff vs {snaps[-1]}:')
    print(f'  + added:   {", ".join(added) or "none"}')
    print(f'  - removed: {", ".join(removed) or "none"}')
    return {'added': added, 'removed': removed}

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
    html = _build(cfg, 'linked')
    if not skip_validate:
        dangling = _check_anchors(html)
        if dangling:
            raise SpecValidationError(
                'dangling internal links — these href="#…" targets have no matching id: '
                + ', '.join('#' + d for d in dangling))
    p = os.path.join(outdir, 'spec.html')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'spec.html written ({os.path.getsize(p)//1024} KB)')
    if not linked_only:
        pb = os.path.join(outdir, 'spec-bundled.html')
        with open(pb, 'w', encoding='utf-8') as f:
            f.write(_build(cfg, 'bundled'))
        print(f'spec-bundled.html written ({os.path.getsize(pb)//1024} KB)')
