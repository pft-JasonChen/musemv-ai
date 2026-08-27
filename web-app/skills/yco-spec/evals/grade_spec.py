#!/usr/bin/env python3
"""Tier 2 grader — deterministic assertions against a spec an agent produced.

Every assertion here is binary and machine-checked, with the burden of proof on
the expectation: it must name the evidence, not "look right". Judgement calls
(is the wording clear? would an RD have to ask?) belong to the LLM grader in the
runbook, not here.

    python3 skills/yco-spec/evals/grade_spec.py Project/<feature>
    python3 skills/yco-spec/evals/grade_spec.py Project/<feature> --json

Assertions are chosen so a baseline run WITHOUT the skill fails most of them.
An assertion a bare model would pass anyway (did it write a file? is there
prose?) measures nothing and does not belong here.
"""
import argparse, json, os, re, statistics, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
sys.path.insert(0, SKILL)

import lint_spec                              # noqa: E402  (word caps, payload coverage)
import spec_builder                           # noqa: E402


def grade(feature_dir):
    """[(id, passed, evidence)] — one row per assertion."""
    out = []

    def check(cid, passed, evidence):
        out.append((cid, bool(passed), evidence))

    # The build itself is an assertion: validate() refuses to write on a hard error.
    try:
        cfg = lint_spec.load_cfg(feature_dir)
    except SystemExit as e:
        return [('A0-builds', False, f'no loadable build_spec.py: {e}')]
    except Exception as e:
        return [('A0-builds', False, f'build_spec.py raised {type(e).__name__}: {e}')]

    import io, contextlib
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            spec_builder._apply_focus_map(cfg)
            spec_builder.validate(cfg)
            html = spec_builder._linkify(spec_builder._build(cfg, 'linked'))
        check('A0-builds', True, 'validate() passed and HTML rendered')
    except Exception as e:
        return [('A0-builds', False, f'{type(e).__name__}: {str(e)[:200]}')]

    steps = list(lint_spec.steps(cfg))

    # A1 — stable IDs. A bare model writes "Step 3", which renumbers on the next edit.
    ids = [rid for rid, _ in steps]
    check('A1-stable-ids', ids and all(re.fullmatch(r'P\d+-[SE]\d+', i) for i in ids),
          f'{len(ids)} step ids, e.g. {ids[:3]}')

    # A2 — data contract covers the whole sample payload.
    cov, unclassified = lint_spec.check_payload(cfg, feature_dir)
    if cov is None:
        check('A2-payload-coverage', False, 'no sample payload committed under specs/')
    else:
        covered, total = cov
        check('A2-payload-coverage', covered == total,
              f'{covered}/{total} keys accounted for; unclassified: '
              f'{[k for _, k in unclassified[:5]] or "none"}')

    # A3 — bullets stay short. Median, so one unavoidable long rule does not fail it.
    lens = []
    for _, s in steps:
        lims = s.get('limits') or []
        lims = [lims] if isinstance(lims, str) else lims
        for b in lims:
            rule = b[0] if isinstance(b, (list, tuple)) and len(b) == 2 else b
            lens.append(lint_spec.words(rule))
    med = statistics.median(lens) if lens else 0
    check('A3-bullet-length', lens and med <= lint_spec.LIMIT_WORDS,
          f'median {med} words over {len(lens)} bullets (cap {lint_spec.LIMIT_WORDS})')

    # A4 — every cross-reference resolves. The build already enforces this, so a
    # failure here means the agent shipped no references at all.
    missing = spec_builder._check_xrefs(html)
    xrefs = html.count('class="xref"')
    check('A4-xrefs-resolve', not missing and xrefs > 0,
          f'{xrefs} live cross-references, {len(missing)} dangling')

    # A5 — prototype simplifications are separated from the contract.
    leaked = [rid for rid, s in steps
              if 'prototype' in lint_spec.plain([s.get('limits'), s.get('system')]).lower()]
    check('A5-prototype-separated', not leaked or bool(cfg.get('prototype_deltas')),
          f'steps naming the prototype: {leaked or "none"}; '
          f'prototype_deltas rows: {len(cfg.get("prototype_deltas") or [])}')

    # A6 — engine-only keys never reach step text.
    # Only unmistakable identifiers count. A contract row may qualify a generic
    # word ("model, inside meta.prompt"), and the same word in prose is ordinary
    # English — "each entry shows the model used" is not a leak. Matching bare
    # `model` would fail a spec that is behaving correctly.
    dc = cfg.get('data_contract') or {}
    engine_keys, generic = set(), set()
    for t in (dc.get('tables') or []):
        if not re.search(r'engine.only', str(t.get('caption', '')), re.I):
            continue
        for k in re.findall(r'<code>([\w.\[\]]+)</code>', str(t.get('rows'))):
            (engine_keys if ('.' in k or '_' in k or len(k) >= 8) else generic).add(k)
    step_text = ' '.join(lint_spec.plain([s.get('limits'), s.get('exact'), s.get('system')])
                         for _, s in steps)
    leaked_keys = sorted(k for k in engine_keys
                         if re.search(r'\b' + re.escape(k.split('.')[-1].rstrip('[]')) + r'\b',
                                      step_text))
    check('A6-engine-only-hidden', not leaked_keys,
          f'{len(engine_keys)} qualified engine-only keys checked '
          f'({len(generic)} generic words skipped: {sorted(generic) or "none"}); '
          f'leaked: {leaked_keys or "none"}')

    # A7 — every acceptance criterion is traced, or explicitly excused.
    crit = cfg.get('criteria') or []
    plan = os.path.join(feature_dir, 'plan.md')
    n_plan = len(re.findall(r'^\s*- \[[ x]\] ', open(plan, encoding='utf-8').read(), re.M)) \
        if os.path.exists(plan) else 0
    traced = sum(1 for c in crit if c[2])
    excused = sum(1 for c in crit if not c[2] and len(c) > 3 and str(c[3]).strip())
    check('A7-criteria-traced', crit and (traced + excused) == len(crit) and len(crit) >= n_plan,
          f'{len(crit)} criteria ({traced} traced, {excused} excused) vs {n_plan} in plan.md')

    # A8 — undecided items are recorded as questions, not silently resolved.
    opens = re.findall(r'<strong>OPEN</strong>', html)
    oq = cfg.get('open_questions') or []
    check('A8-open-questions', not opens or bool(oq),
          f'{len(opens)} OPEN cells, {len(oq)} open_questions rows')

    # A9 — screenshot annotations survive print. Only meaningful if there are frames.
    labelled = sum(1 for _, s in steps for f in (s.get('focus') or []) if f.get('label'))
    legends = html.count('class="fkey"')
    check('A9-focus-legend', labelled == 0 or legends > 0,
          f'{labelled} labelled frames rendered into {legends} legends')

    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('feature_dir')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()

    rows = grade(a.feature_dir)
    passed = sum(1 for _, p, _ in rows if p)

    if a.json:
        print(json.dumps({'feature': a.feature_dir, 'passed': passed, 'total': len(rows),
                          'assertions': [{'id': i, 'pass': p, 'evidence': e}
                                         for i, p, e in rows]}, indent=2))
    else:
        for cid, p, ev in rows:
            print(f'{"PASS" if p else "FAIL"}  {cid:24} {ev}')
        print(f'\n{passed}/{len(rows)} assertions passed')
    sys.exit(0 if passed == len(rows) else 1)


if __name__ == '__main__':
    main()
