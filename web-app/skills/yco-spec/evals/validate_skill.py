#!/usr/bin/env python3
"""Tier 0 — static validation of the skill itself.

Cheapest tier in the pyramid: no model, no browser, seconds to run. It checks
that the skill is well-formed enough to be discovered and read, which is the
precondition for every tier above it. A skill that fails here cannot be
triggered, so a Tier 1 result against it would be meaningless.

    python3 skills/yco-spec/evals/validate_skill.py skills/yco-spec
    python3 skills/yco-spec/evals/validate_skill.py skills/yco-spec --quiet

Exit 0 = zero FAILs. Warnings do not fail the run, but investigate them rather
than dismissing them.
"""
import argparse, os, re, sys

MAX_SKILL_LINES = 500      # progressive disclosure: detail belongs in references/
MAX_DESC_CHARS = 1024
REQUIRED_FRONTMATTER = ('name', 'description', 'allowed-tools')
# CHANGEME is a deliberate sentinel in this repo — validate() fails a build that
# still carries it, so its presence in the template is the feature, not a defect.
MARKERS = r'\b(TODO|FIXME|XXX)\b'
# Files the skill documents but does not own — they live in Project/<feature>/.
NOT_SKILL_OWNED = {'prd.md', 'plan.md', 'build_spec.py', 'index.html', 'spec.html',
                   'spec-bundled.html', 'capture_screenshots.py', 'focus.json',
                   'agent.config.json', 'user-flowchart.svg'}
FORBIDDEN = ('.DS_Store', '__pycache__', '.pyc', 'node_modules')


def frontmatter(text):
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not m:
        return None, text
    block, body = m.group(1), text[m.end():]
    fields = {}
    for fm in re.finditer(r'^([a-zA-Z-]+):\s*(.*(?:\n(?![a-zA-Z-]+:).*)*)', block, re.M):
        fields[fm.group(1)] = fm.group(2).strip().strip('"').strip("'")
    return fields, body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skill_dir')
    ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()

    fails, warns, oks = [], [], []

    def fail(m): fails.append(m)
    def warn(m): warns.append(m)
    def ok(m): oks.append(m)

    sk = os.path.join(a.skill_dir, 'SKILL.md')
    if not os.path.exists(sk):
        print(f'FAIL  no SKILL.md in {a.skill_dir}')
        sys.exit(1)
    text = open(sk, encoding='utf-8').read()

    # ── frontmatter: without it the skill cannot be discovered at all ─────────
    fm, body = frontmatter(text)
    if fm is None:
        fail('SKILL.md has no YAML frontmatter — the skill cannot be discovered or triggered')
        fm = {}
    else:
        ok('frontmatter present')
    for k in REQUIRED_FRONTMATTER:
        if not fm.get(k):
            fail(f'frontmatter missing "{k}"')
    if fm.get('name') and fm['name'] != os.path.basename(a.skill_dir.rstrip('/')):
        warn(f'frontmatter name {fm["name"]!r} != directory name')
    desc = fm.get('description', '')
    if desc:
        if len(desc) > MAX_DESC_CHARS:
            fail(f'description is {len(desc)} chars (max {MAX_DESC_CHARS})')
        elif len(desc) < 80:
            warn('description is short — Tier 1 needs enough signal to discriminate')
        else:
            ok(f'description {len(desc)} chars')
        # A description that only says what the skill does cannot separate itself
        # from a neighbour that does something adjacent.
        if not re.search(r'\bnot for\b|\bnot\b.*\buse\b', desc, re.I):
            warn('description states no negative triggers — near-miss queries will over-fire')
        else:
            ok('description names its near-miss exclusions')

    # ── size: the always-loaded surface ──────────────────────────────────────
    n = text.count('\n') + 1
    if n > MAX_SKILL_LINES:
        fail(f'SKILL.md is {n} lines (max {MAX_SKILL_LINES}) — move detail into references/')
    else:
        ok(f'SKILL.md {n} lines')

    # ── unfinished markers, in TRACKED files only ────────────────────────────
    tracked = git_tracked(a.skill_dir)
    if tracked is None:
        warn('not a git checkout — scanning the filesystem instead of tracked files')
        tracked = [f for f in walk(a.skill_dir)]
    # Skip archived reviews, and this file — a checker that names its own
    # patterns is not an unfinished task.
    self_path = os.path.abspath(__file__)
    scan = [f for f in tracked
            if f.endswith(('.md', '.py'))
            and '/references/_reviews/' not in f.replace(os.sep, '/')
            and os.path.abspath(f) != self_path]
    for f in scan:
        for i, line in enumerate(open(f, encoding='utf-8', errors='replace'), 1):
            if re.search(MARKERS, line):
                warn(f'{rel(f, a.skill_dir)}:{i} unfinished marker: {line.strip()[:60]}')
    ok(f'{len(scan)} tracked docs/scripts scanned for unfinished markers')

    # ── dead references: a skill that points at a missing file wastes a turn ──
    refs = {r for r in re.findall(r'`([\w./-]+\.(?:md|py|css|json|yaml))`', text)
            if os.path.basename(r) not in NOT_SKILL_OWNED}
    unresolved = [r for r in sorted(refs)
                  if not any(os.path.exists(os.path.join(b, r)) for b in (a.skill_dir, '.'))]
    for r in unresolved:
        fail(f'SKILL.md references a file that does not exist: {r}')
    ok(f'{len(refs) - len(unresolved)}/{len(refs)} skill-owned file references resolve')

    # ── forbidden files ──────────────────────────────────────────────────────
    for f in tracked:
        if any(bad in f for bad in FORBIDDEN):
            fail(f'forbidden path is COMMITTED: {rel(f, a.skill_dir)}')

    # ── the skill must ship its own eval ─────────────────────────────────────
    for need in ('evals/runbook.yaml', 'evals/README.md'):
        if not os.path.exists(os.path.join(a.skill_dir, need)):
            fail(f'missing {need} — a skill without an eval cannot be measured')
    if not fails:
        ok('eval harness present')

    if not a.quiet:
        for m in oks:
            print(f'ok    {m}')
    for m in warns:
        print(f'WARN  {m}')
    for m in fails:
        print(f'FAIL  {m}')
    print(f'\nTier 0: {len(fails)} fail, {len(warns)} warn, {len(oks)} ok')
    sys.exit(1 if fails else 0)


def git_tracked(d):
    """Files git tracks under d, or None outside a checkout. Untracked build
    droppings are not the skill."""
    import subprocess
    try:
        out = subprocess.run(['git', 'ls-files', '-z', d], capture_output=True, check=True)
    except Exception:
        return None
    return [f for f in out.stdout.decode().split('\0') if f]


def walk(d):
    for root, _, files in os.walk(d):
        for f in files:
            yield os.path.join(root, f)


def rel(f, d):
    return os.path.relpath(f, d)


if __name__ == '__main__':
    main()
