#!/usr/bin/env python3
"""lint_spec.py — advisory quality checks on a built spec.

`validate()` inside spec_builder is the hard gate: it refuses to write HTML on
CJK, a missing screenshot, a dead cross-reference. This linter is the softer
half — it reports the things that make a spec *tiring to read* rather than
wrong, so an author can see them before RD does.

    python3 skills/yco-spec/lint_spec.py Project/<feature>
    python3 skills/yco-spec/lint_spec.py Project/<feature> --strict   # exit 1 on any finding

Checks
  words     RULES & LIMITS bullets over the word cap, or carrying more than one
            sentence. One bullet = one fact = one sentence.
  meta      Sentences about the spec itself ("this spec does not…", "no
            screenshot is reused") — narration RD does not need.
  payload   Every key path in specs/*.json must be accounted for: documented in
            a table, listed as engine-only, or explicitly ignored via
            cfg['data_contract_ignore']. Unclassified keys are the finding.
  norender  A data-contract row whose "Renders as" cell says Nothing / N/A / —.
            The key is classified correctly and still costs a full-width row to
            say "ignore this" — it belongs in data_contract['no_ui'] or
            ['engine_only'], which keep the classification and drop the row.
  strings   Every string quoted in `exact` claims those characters are on screen.
            This finds the ones that are not, by searching cfg['prototype_src'].
            Provenance, not prose: the other checks all assume a line is true and
            ask only whether it reads well. Needs cfg['prototype_src'];
            cfg['strings_ignore'] holds the deliberate exceptions.

Nothing here fails a build by default. Run it, read it, fix what is real.
"""
import argparse, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

LIMIT_WORDS = 20     # one rule, one sentence — see SKILL.md "Language rules"
SYSTEM_WORDS = 25
QA_WORDS = 25

# Phrases that talk *about* the spec instead of about the product.
META_PATTERNS = [
    r'\bthis spec\b', r'\bno screenshot is reused\b', r'\bnot restated\b',
    r'\bis a guideline decision\b', r'\bnot a spec one\b', r'\bproposal deck\b',
    r'\bRD reuses it\b', r'\bdescribed directly\b', r'\bfor completeness\b',
    r'\bworth noting\b', r'\bit is worth\b', r'\bas mentioned (?:above|earlier)\b',
]
_META = re.compile('|'.join(META_PATTERNS), re.I)
_TAG = re.compile(r'<[^>]+>')
_ENT = {'&mdash;': '-', '&ndash;': '-', '&rsquo;': "'", '&ldquo;': '"',
        '&rdquo;': '"', '&middot;': '.', '&nbsp;': ' ', '&amp;': '&',
        '&rarr;': '->', '&ge;': '>=', '&le;': '<=', '&hellip;': '...'}


def plain(v):
    """HTML/entity-stripped text for counting."""
    if isinstance(v, (list, tuple)):
        return ' '.join(plain(x) for x in v)
    s = _TAG.sub('', str(v))
    for k, r in _ENT.items():
        s = s.replace(k, r)
    return s


def words(v):
    return len(plain(v).split())


def sentences(v):
    """Sentence count, ignoring abbreviations and decimals."""
    t = plain(v).strip()
    if not t:
        return 0
    return len(re.findall(r'[.!?](?:\s+[A-Z"(]|$)', t)) or 1


def load_cfg(feature_dir):
    """Import the feature's build_spec.py without letting it write files."""
    bs = os.path.join(feature_dir, 'build_spec.py')
    if not os.path.exists(bs):
        sys.exit(f'no build_spec.py in {feature_dir}')
    src = open(bs, encoding='utf-8').read()
    for call in ('spec_builder.write_specs(cfg)', 'spec_builder.archive_current(cfg)',
                 'spec_builder.version_diff(cfg)'):
        src = src.replace(call, 'pass')
    g = {'__file__': os.path.abspath(bs), '__name__': 'lint'}
    import io, contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(src, bs, 'exec'), g)
    return g['cfg']


def steps(cfg):
    for p in cfg.get('paths', []):
        for s in p['steps']:
            rid = s.get('req_id') or f"P{p['num']}-S{s.get('num','?')}"
            yield rid, s


# ── checks ────────────────────────────────────────────────────────────────────

def check_words(cfg):
    out = []
    if cfg.get('criteria'):
        for rid, s in steps(cfg):
            if s.get('qa'):
                out.append((f'{rid}.qa', "superseded by cfg['criteria'] — delete it",
                            plain(s['qa'])))
    for rid, s in steps(cfg):
        lims = s.get('limits') or []
        lims = [lims] if isinstance(lims, str) else lims
        for i, b in enumerate(lims, 1):
            # A (rule, why) pair has already separated the two halves — the cap
            # applies to the rule, which is the normative line. Counting them
            # together would penalise exactly the split we want authors to make.
            rule = b[0] if isinstance(b, (list, tuple)) and len(b) == 2 else b
            w, n = words(rule), sentences(rule)
            if w > LIMIT_WORDS or n > 1:
                why = []
                if w > LIMIT_WORDS:
                    why.append(f'{w} words (cap {LIMIT_WORDS})')
                if n > 1:
                    why.append(f'{n} sentences — split into {n} bullets')
                out.append((f'{rid}.limits[{i}]', ' · '.join(why), plain(rule)))
        if words(s.get('system', '')) > SYSTEM_WORDS:
            out.append((f'{rid}.system', f'{words(s["system"])} words (cap {SYSTEM_WORDS})',
                        plain(s['system'])))
        # With a coverage table, per-step qa prose is superseded, not just long.
        if not cfg.get('criteria') and s.get('qa') and words(s['qa']) > QA_WORDS:
            out.append((f'{rid}.qa', f'{words(s["qa"])} words (cap {QA_WORDS}) — '
                        f'a QA line is one pass/fail assertion', plain(s['qa'])))
    return out


def check_meta(cfg):
    out = []
    fields = ('user', 'system', 'exact', 'limits', 'qa')
    for rid, s in steps(cfg):
        for f in fields:
            hit = _META.search(plain(s.get(f, '')))
            if hit:
                out.append((f'{rid}.{f}', f'reads as narration about the spec ({hit.group(0)!r})',
                            plain(s.get(f))))
    for p in cfg.get('paths', []):
        hit = _META.search(plain(p.get('desc', '')))
        if hit:
            out.append((f"P{p['num']}.desc", f'narration about the spec ({hit.group(0)!r})',
                        plain(p['desc'])))
    return out


def key_paths(obj, prefix=''):
    """Every key path in a payload, arrays collapsed to their first element."""
    out = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f'{prefix}.{k}' if prefix else k
            out.append(p)
            out += key_paths(v, p)
    elif isinstance(obj, list) and obj:
        out += key_paths(obj[0], prefix + '[]')
    return out


def check_payload(cfg, feature_dir):
    """Every key in a committed sample payload must be documented, declared
    engine-only, or explicitly ignored. Unclassified keys are the finding —
    this is what turned a 7% data contract into a number you can see."""
    spec_dir = cfg.get('out_dir') or os.path.join(feature_dir, 'specs')
    payloads = sorted(glob.glob(os.path.join(spec_dir, '*.json')))
    payloads = [p for p in payloads if os.path.basename(p) != 'focus.json']
    if not payloads:
        return None, []

    # Everything the spec says, in one bag: table cells carry the key names.
    # Tables live either inside a step or in the first-class data_contract
    # section — scan both, or moving one silently drops coverage.
    def table_text(tbls):
        tbls = [tbls] if isinstance(tbls, dict) else (tbls or [])
        return ' '.join(plain(t.get('cols', [])) + ' ' + plain(t.get('rows', []))
                        for t in tbls if isinstance(t, dict))

    haystack = ''
    for _, s in steps(cfg):
        haystack += ' ' + table_text(s.get('tables'))
        haystack += ' ' + plain(s.get('limits')) + ' ' + plain(s.get('exact'))
    dc = cfg.get('data_contract') or {}
    haystack += ' ' + table_text(dc.get('tables')) + ' ' + plain(dc.get('reverse', []))
    # A JSON schema block documents its keys in `fields`, not in table cells.
    # Miss these and a spec that documents everything via `schemas` reports 0%
    # coverage — the same trap the step/data_contract split above warns about.
    for s in (dc.get('schemas') or []):
        haystack += ' ' + plain(s.get('fields', [])) + ' ' + plain(s.get('note', ''))
    # Classified-but-not-displayed keys count as documented. Coverage is about
    # triage; the table is about what RD builds. See _dc_notes in spec_builder.
    haystack += ' ' + plain((dc.get('engine_only') or {}).get('keys', []))
    haystack += ' ' + plain((dc.get('engine_only') or {}).get('why', ''))
    haystack += ' ' + plain(dc.get('no_ui', []))
    haystack += ' ' + plain(cfg.get('decisions', [])) + ' ' + plain(cfg.get('open_questions', []))
    ignore = set(cfg.get('data_contract_ignore', []))

    def named(path):
        """Does the spec name this exact key path, or its leaf?"""
        leaf = path.split('.')[-1].replace('[]', '')
        return path in haystack or bool(re.search(r'\b' + re.escape(leaf) + r'\b', haystack))

    def ancestors(path):
        """Every prefix of a key path, longest first."""
        parts = path.split('.')
        return ['.'.join(parts[:i]) for i in range(len(parts) - 1, 0, -1)]

    unclassified, total = [], 0
    for pf in payloads:
        with open(pf, encoding='utf-8') as f:
            data = json.load(f)
        for kp in key_paths(data):
            total += 1
            leaf = kp.split('.')[-1].replace('[]', '')
            if kp in ignore or leaf in ignore:
                continue
            if named(kp):
                continue
            # Coverage is inherited: declaring `meta.prompt[]` engine-only
            # settles everything underneath it. Listing each nested leaf would
            # be busywork that says nothing new.
            if any(a in ignore or named(a) for a in ancestors(kp)):
                continue
            unclassified.append((os.path.basename(pf), kp))
    covered = total - len(unclassified)
    return (covered, total), unclassified


_NORENDER = re.compile(r'^\s*(?:nothing|none|n/?a|-|not rendered|no ui(?: effect)?)\b', re.I)

def check_norender(cfg):
    """Data-contract rows that render nothing.

    Such a row is not wrong — the key really is classified, and dropping it would
    cost the coverage guarantee. It is the wrong *shape*: five columns wide, four
    of them answering questions about a key whose answer to the only question
    that matters is "ignore this". The fix keeps the classification and moves it
    to a note (`data_contract['no_ui']` / `['engine_only']`), which the payload
    check reads as documented.

    Matching is lexical and cannot be otherwise: "Nothing directly — decides
    where the slot fields live" describes a key that shapes the whole layout, and
    no regex separates it from "Nothing — slots always start empty". Both get
    reported. Both are also badly worded: a cell that opens by denying something
    makes the reader work out what is left. Rewriting it to say what the key does
    is the right answer to this finding as often as moving the row is."""
    hits = []
    dc = cfg.get('data_contract') or {}
    tables = list(dc.get('tables') or [])
    for _, s in steps(cfg):
        t = s.get('tables')
        tables += [t] if isinstance(t, dict) else (t or [])
    for t in tables:
        if not isinstance(t, dict):
            continue
        cols = [plain(c).strip().lower() for c in (t.get('cols') or [])]
        if 'renders as' not in cols:
            continue
        i = cols.index('renders as')
        cap = plain(t.get('caption', '?')).strip()
        for row in (t.get('rows') or []):
            if len(row) <= i:
                continue
            if _NORENDER.match(plain(row[i]).strip()):
                hits.append((cap, plain(row[0]).strip()[:60], plain(row[i]).strip()[:60]))
    return hits


_QUOTED = re.compile(r'&ldquo;(.+?)&rdquo;|“(.+?)”')
_SRC_EXT = ('.html', '.js')


def _norm(t):
    return re.sub(r'\s+', ' ', plain(t)).strip().lower()


def check_strings(cfg, feature_dir):
    """Quoted `exact` strings that appear nowhere in the prototype source.

    Every other check in this file assumes the spec is true and asks only whether
    it reads well. That assumption is what let an invented on-screen string survive
    five tidying passes: compression makes an unsourced line look *more*
    authoritative, because it strips the hedging that would have exposed it.

    A miss is a prompt, not a verdict — a string may be production-only, or belong
    to a sibling prototype this feature also specifies. But it must be explained
    and then fixed or listed in cfg['strings_ignore'], because the alternative is
    what already happened: nobody looked.
    """
    src = cfg.get('prototype_src')
    if not src:
        return None, []
    src = [src] if isinstance(src, str) else src

    hay, roots = '', []
    for s in src:
        p = s if os.path.isabs(s) else os.path.join(feature_dir, s)
        if os.path.isfile(p):
            files = [p]
        else:
            files = [f for f in glob.glob(os.path.join(p, '**', '*'), recursive=True)
                     if os.path.isfile(f) and f.endswith(_SRC_EXT)
                     and f'{os.sep}temp{os.sep}' not in f]
        if files:
            roots.append(os.path.basename(p.rstrip(os.sep)))
        for f in files:
            with open(f, encoding='utf-8', errors='ignore') as fh:
                hay += ' ' + fh.read()
    if not hay.strip():
        return None, []
    hay = _norm(hay)

    ignore = {_norm(s) for s in cfg.get('strings_ignore', [])}

    def quoted_sources(s):
        """Every place a step quotes on-screen copy. `exact` is the usual one, but
        a step table quotes copy just as often — support-chatbot moved three upload
        messages into one, and they silently stopped being checked."""
        out = list(s.get('exact') or [])
        tbls = s.get('tables')
        tbls = [tbls] if isinstance(tbls, dict) else (tbls or [])
        for t in tbls:
            if isinstance(t, dict):
                for row in (t.get('rows') or []):
                    out.extend(row)
        return out

    misses, total = [], 0
    for rid, s in steps(cfg):
        for entry in quoted_sources(s):
            for m in _QUOTED.finditer(str(entry)):
                q = m.group(1) or m.group(2) or ''
                qn = _norm(q)
                if len(qn) < 3:
                    continue
                total += 1
                if qn in ignore or qn in hay:
                    continue
                misses.append((rid, plain(q).strip()))
    return (total - len(misses), total, roots), misses


# ── report ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('feature_dir')
    ap.add_argument('--strict', action='store_true',
                    help='exit 1 when anything is reported (for CI)')
    ap.add_argument('--top', type=int, default=10, help='how many offenders to print per check')
    a = ap.parse_args()

    cfg = load_cfg(a.feature_dir)
    findings = 0

    def section(title, rows, fmt):
        nonlocal findings
        print(f'\n{title} — {len(rows)} finding(s)')
        if not rows:
            print('  clean')
            return
        findings += len(rows)
        for r in rows[:a.top]:
            print(fmt(r))
        if len(rows) > a.top:
            print(f'  … and {len(rows) - a.top} more')

    wordy = sorted(check_words(cfg), key=lambda r: -len(r[2]))
    section('WORDS', wordy, lambda r: f'  {r[0]:<22} {r[1]}\n      {r[2][:130]}')

    section('META', check_meta(cfg), lambda r: f'  {r[0]:<22} {r[1]}\n      {r[2][:130]}')

    section('NORENDER', check_norender(cfg),
            lambda r: f'  {r[0]}\n      {r[1]}  →  "{r[2]}"\n'
                      f'      → move to data_contract[\'no_ui\'] or [\'engine_only\']')

    scov, smisses = check_strings(cfg, a.feature_dir)
    if scov is None:
        print("\nSTRINGS — skipped (set cfg['prototype_src'] to check quoted UI text)")
    else:
        found, stotal, roots = scov
        print(f'\nSTRINGS — {found}/{stotal} quoted strings found in {", ".join(roots) or "source"}')
        if smisses:
            findings += len(smisses)
            for rid, q in smisses[:a.top]:
                print(f'  not on screen  {rid:<10} "{q}"')
            if len(smisses) > a.top:
                print(f'  … and {len(smisses) - a.top} more')
            print("  → fix the string, or add it to cfg['strings_ignore'] with a reason")

    cov, unclassified = check_payload(cfg, a.feature_dir)
    if cov is None:
        print('\nPAYLOAD — skipped (no sample payload committed under specs/)')
    else:
        covered, total = cov
        pct = 100.0 * covered / total if total else 100.0
        print(f'\nPAYLOAD — {covered}/{total} keys accounted for ({pct:.0f}%)')
        if unclassified:
            findings += len(unclassified)
            for f, kp in unclassified[:a.top]:
                print(f'  unclassified  {kp}   ({f})')
            if len(unclassified) > a.top:
                print(f'  … and {len(unclassified) - a.top} more')
            print("  → document it in a table, list it as engine-only, or add it to "
                  "cfg['data_contract_ignore']")

    print(f'\ntotal findings: {findings}')
    if a.strict and findings:
        sys.exit(1)


if __name__ == '__main__':
    main()
