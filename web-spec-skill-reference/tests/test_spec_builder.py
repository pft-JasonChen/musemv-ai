#!/usr/bin/env python3
"""Regression tests for skills/yco-spec/spec_builder.py.

Run from the repo root (or anywhere):
    /usr/bin/python3 -m unittest discover -s skills/yco-spec/tests -v

Golden snapshot: tests/golden/spec.html is the committed reference output for
the fixture cfg. If a rendering change is INTENTIONAL, regenerate with:
    REGEN_GOLDEN=1 /usr/bin/python3 -m unittest skills.yco-spec... (or run this
    file directly with REGEN_GOLDEN=1), then review the golden diff in git.
"""
import base64
import copy
import json
import os
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import spec_builder  # noqa: E402

GOLDEN_DIR = os.path.join(HERE, 'golden')
GOLDEN = os.path.join(GOLDEN_DIR, 'spec.html')

# 1x1 transparent PNG — deterministic screenshot fixture.
PNG_1PX = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBg'
    'AAAABQABh6FO1AAAAABJRU5ErkJggg==')


def fixture_cfg(tmp):
    ss = os.path.join(tmp, 'screenshots')
    os.makedirs(ss, exist_ok=True)
    for name in ('01_intro.png', '02_send.png'):
        with open(os.path.join(ss, name), 'wb') as f:
            f.write(PNG_1PX)
    return {
        'feature_name': 'Fixture Feature',
        'breadcrumb': 'YCO &rarr; Fixture',
        'author': 'Test', 'date': '2026-01-01', 'status': 'Review',
        'description': 'A fixture feature used by the golden snapshot test.',
        'overview': [['Platform', 'Web']],
        'decisions': [('D-01', 'Q?', 'A.')],
        'states': [('IDLE', 'load', 'input empty', 'to COMPOSING', 'on input')],
        'errors': [('Network', 'timeout', 'Something went wrong', 'retry', 'N/A')],
        'prototype_deltas': [('Auth', 'prototype fakes it', 'production does it')],
        'paths': [{
            'id': 'path-happy', 'num': 1, 'name': 'Happy path',
            'desc': 'User sends a thing.', 'entry': 'Landing', 'outcome': 'Sent',
            'steps': [
                {'shot': '01_intro.png', 'num': 1,
                 'user': 'Arrives at the page.', 'system': 'Page renders.',
                 'inp': '', 'out': '', 'exact': ['Label: &ldquo;Send&rdquo;'],
                 'limits': ['Max 10 items.'],
                 'focus': [{'box': [10.0, 10.0, 20.0, 5.0], 'type': 'info',
                            'label': 'Key value'}],
                 'qa': 'Page renders with the Send button visible.'},
                {'shot': '02_send.png', 'num': 2,
                 'user': 'Clicks Send.', 'system': 'Item is sent.',
                 'qa': 'Clicking Send shows the sent state.'},
            ],
        }],
        'screenshots_dir': ss,
        'out_dir': os.path.join(tmp, 'specs'),
    }


class ValidateGates(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cfg = fixture_cfg(self.tmp)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def assert_fails(self, cfg, fragment):
        with self.assertRaises(spec_builder.SpecValidationError) as ctx:
            spec_builder.validate(cfg)
        self.assertIn(fragment, str(ctx.exception))

    def test_clean_fixture_passes(self):
        self.assertEqual(spec_builder.validate(self.cfg), [])

    def test_cjk_hard_fails(self):
        self.cfg['paths'][0]['steps'][0]['user'] = 'User clicks 送出.'
        self.assert_fails(self.cfg, 'CJK')

    def test_missing_screenshot_hard_fails(self):
        self.cfg['paths'][0]['steps'][0]['shot'] = '99_missing.png'
        self.assert_fails(self.cfg, 'missing screenshot')

    def test_zero_qa_path_hard_fails(self):
        for s in self.cfg['paths'][0]['steps']:
            s['qa'] = ''
        self.assert_fails(self.cfg, 'no QA line')

    def test_prototype_leak_hard_fails(self):
        self.cfg.pop('prototype_deltas')
        self.cfg['paths'][0]['steps'][0]['system'] = 'Prototype shows a canned result.'
        self.assert_fails(self.cfg, 'prototype_deltas')

    def test_missing_desc_is_friendly_schema_error(self):
        self.cfg['paths'][0].pop('desc')
        self.assert_fails(self.cfg, "missing 'desc'")

    def test_changeme_comment_id_fails(self):
        self.cfg['comments_enabled'] = True
        self.cfg['comments_spec_id'] = 'CHANGEME-foo'
        self.assert_fails(self.cfg, 'placeholder')

    def test_duplicate_step_id_hard_fails(self):
        self.cfg['paths'][0]['steps'][1]['num'] = 1
        self.assert_fails(self.cfg, 'duplicate step ID')

    def test_duplicate_path_id_hard_fails(self):
        p2 = copy.deepcopy(self.cfg['paths'][0])
        p2['id'] = 'path-two'
        self.cfg['paths'].append(p2)
        self.assert_fails(self.cfg, 'duplicate path ID')

    def test_out_of_bounds_focus_warns(self):
        self.cfg['paths'][0]['steps'][0]['focus'] = [
            {'box': [95.0, 10.0, 20.0, 5.0], 'label': 'overflows right'}]
        warnings = spec_builder.validate(self.cfg)
        self.assertTrue(any('out of bounds' in w for w in warnings), warnings)


class FocusMapMerge(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cfg = fixture_cfg(self.tmp)
        os.makedirs(self.cfg['out_dir'], exist_ok=True)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def write_focus(self, data):
        with open(os.path.join(self.cfg['out_dir'], 'focus.json'), 'w') as f:
            json.dump(data, f)

    def test_box_overridden_type_preserved(self):
        # focus.json entry has a measured box but no 'type' — the manual
        # entry's 'info' must survive the override.
        self.write_focus({'01_intro.png': [{'box': [1.0, 2.0, 3.0, 4.0],
                                            'label': 'measured'}]})
        spec_builder._apply_focus_map(self.cfg)
        f = self.cfg['paths'][0]['steps'][0]['focus'][0]
        self.assertEqual(f['box'], [1.0, 2.0, 3.0, 4.0])
        self.assertEqual(f['type'], 'info')

    def test_focus_lock_respected(self):
        self.cfg['paths'][0]['steps'][0]['focus_lock'] = True
        self.write_focus({'01_intro.png': [{'box': [1, 2, 3, 4]}]})
        spec_builder._apply_focus_map(self.cfg)
        self.assertEqual(self.cfg['paths'][0]['steps'][0]['focus'][0]['box'],
                         [10.0, 10.0, 20.0, 5.0])

    def test_empty_measurement_keeps_manual(self):
        self.write_focus({'01_intro.png': []})
        spec_builder._apply_focus_map(self.cfg)
        self.assertEqual(self.cfg['paths'][0]['steps'][0]['focus'][0]['box'],
                         [10.0, 10.0, 20.0, 5.0])


class GoldenSnapshot(unittest.TestCase):
    def test_linked_output_matches_golden(self):
        tmp = tempfile.mkdtemp()
        try:
            cfg = fixture_cfg(tmp)
            spec_builder.write_specs(cfg, linked_only=True)
            out = os.path.join(cfg['out_dir'], 'spec.html')
            with open(out, encoding='utf-8') as f:
                built = f.read()
            if os.environ.get('REGEN_GOLDEN'):
                os.makedirs(GOLDEN_DIR, exist_ok=True)
                shutil.copy(out, GOLDEN)
                self.skipTest('golden regenerated — review the git diff')
            self.assertTrue(os.path.exists(GOLDEN),
                            'golden missing — run once with REGEN_GOLDEN=1')
            with open(GOLDEN, encoding='utf-8') as f:
                golden = f.read()
            self.assertEqual(built, golden,
                             'spec_builder output changed. If intentional, '
                             'REGEN_GOLDEN=1 and commit the golden diff.')
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_structural_invariants(self):
        tmp = tempfile.mkdtemp()
        try:
            cfg = fixture_cfg(tmp)
            spec_builder.write_specs(cfg, linked_only=True)
            with open(os.path.join(cfg['out_dir'], 'spec.html'), encoding='utf-8') as f:
                html = f.read()
            for fragment in ('id="P1"', 'id="P1-S1"', 'id="P1-S2"',
                             'screenshots/01_intro.png', 'Prototype Simplifications',
                             'D-01'):
                self.assertIn(fragment, html)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    unittest.main()
