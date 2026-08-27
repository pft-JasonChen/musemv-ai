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


# Minimal stamped flowchart. validate() requires one (see _check_flowchart) and
# the stamp must track cfg['version'], which the fixture leaves at the v1 default.
FLOW_SVG = ('<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">'
            '<text x="8" y="20" font-size="12">Fixture Feature - User Flowchart</text>'
            '<text x="8" y="40" font-size="9">desktop 1440 - matches spec v1, 2026-01-01</text>'
            '</svg>')


def fixture_cfg(tmp):
    ss = os.path.join(tmp, 'screenshots')
    os.makedirs(ss, exist_ok=True)
    for name in ('01_intro.png', '02_send.png'):
        with open(os.path.join(ss, name), 'wb') as f:
            f.write(PNG_1PX)
    svg = os.path.join(tmp, 'user-flowchart.svg')
    with open(svg, 'w', encoding='utf-8') as f:
        f.write(FLOW_SVG)
    return {
        'svg_path': svg,
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


class CrossReferences(unittest.TestCase):
    """Bare IDs in prose ("see D-01", "(T1)") become links; one with no target
    fails the build instead of shipping a promise the reader can't follow."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.cfg = fixture_cfg(self.tmp)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _build(self):
        spec_builder.write_specs(self.cfg, linked_only=True)
        with open(os.path.join(self.cfg['out_dir'], 'spec.html'), encoding='utf-8') as f:
            return f.read()

    def test_live_id_in_prose_becomes_a_link(self):
        self.cfg['paths'][0]['steps'][0]['limits'] = ['Bounded by the rule in D-01.']
        html = self._build()
        self.assertIn('<a class="xref" href="#D-01">D-01</a>', html)

    def test_step_id_in_prose_links_to_the_step(self):
        self.cfg['paths'][0]['steps'][1]['limits'] = ['Same dialog as P1-S1.']
        html = self._build()
        self.assertIn('<a class="xref" href="#P1-S1">P1-S1</a>', html)

    def test_step_badge_does_not_link_to_itself(self):
        html = self._build()
        self.assertIn('<span class="snum noxref">P1-S1</span>', html)

    def test_table_caption_anchors_itself(self):
        self.cfg['paths'][0]['steps'][0]['tables'] = [
            {'caption': 'T1 &middot; Fields', 'cols': ['a'], 'rows': [['b']]}]
        self.cfg['paths'][0]['steps'][1]['limits'] = ['Read the fields in T1.']
        html = self._build()
        self.assertIn('id="T1"', html)
        self.assertIn('<a class="xref" href="#T1">T1</a>', html)

    def test_dangling_id_hard_fails(self):
        self.cfg['paths'][0]['steps'][0]['limits'] = ['Bounded by the rule in D-99.']
        with self.assertRaises(spec_builder.SpecValidationError) as ctx:
            spec_builder.write_specs(self.cfg, linked_only=True)
        self.assertIn('D-99', str(ctx.exception))

    def test_unused_family_is_not_checked(self):
        """A spec with no numbered tables must not fail on prose that merely
        looks like a table tag."""
        self.cfg['paths'][0]['steps'][0]['limits'] = ['Resolution is capped at T4 quality.']
        self._build()  # must not raise

    def test_id_inside_code_is_left_alone(self):
        self.cfg['paths'][0]['steps'][0]['limits'] = ['Key <code>D-01</code> is engine-only.']
        html = self._build()
        self.assertIn('<code>D-01</code>', html)
        self.assertNotIn('<code><a class="xref"', html)

    def test_dangling_id_on_the_flowchart_hard_fails(self):
        """The SVG is inlined, so a step ID drawn on the diagram is checked
        exactly like one written in a step card. This is why _check_flowchart
        does not re-implement a stale-ID scan."""
        with open(self.cfg['svg_path'], 'w', encoding='utf-8') as f:
            f.write(FLOW_SVG.replace('User Flowchart', 'User Flowchart (see P1-S9)'))
        with self.assertRaises(spec_builder.SpecValidationError) as ctx:
            spec_builder.write_specs(self.cfg, linked_only=True)
        self.assertIn('P1-S9', str(ctx.exception))


class FlowchartGate(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.cfg = fixture_cfg(self.tmp)

    def _restamp(self, text):
        with open(self.cfg['svg_path'], 'w', encoding='utf-8') as f:
            f.write(FLOW_SVG.replace('matches spec v1, 2026-01-01', text))

    def test_matching_stamp_is_clean(self):
        self.assertEqual(spec_builder._check_flowchart(self.cfg), ([], []))

    def test_stale_stamp_hard_fails(self):
        self.cfg['version'] = 'v3'
        errors, _ = spec_builder._check_flowchart(self.cfg)
        self.assertTrue(any('stamped v1' in e and 'v3' in e for e in errors), errors)

    def test_missing_file_hard_fails(self):
        os.remove(self.cfg['svg_path'])
        errors, _ = spec_builder._check_flowchart(self.cfg)
        self.assertTrue(any('not found' in e for e in errors), errors)

    def test_absent_svg_path_hard_fails(self):
        self.cfg['svg_path'] = ''
        errors, _ = spec_builder._check_flowchart(self.cfg)
        self.assertTrue(any('svg_path' in e for e in errors), errors)

    def test_unstamped_new_spec_hard_fails(self):
        """A feature folder not on the ratchet ships the stamp from build one."""
        self._restamp('desktop 1440')
        errors, warns = spec_builder._check_flowchart(self.cfg)
        self.assertTrue(any('no version stamp' in e for e in errors), errors)
        self.assertEqual(warns, [])

    def test_unstamped_grandfathered_spec_only_warns(self):
        self._restamp('desktop 1440')
        real = spec_builder._flow_grandfathered
        spec_builder._flow_grandfathered = lambda key: True
        self.addCleanup(setattr, spec_builder, '_flow_grandfathered', real)
        errors, warns = spec_builder._check_flowchart(self.cfg)
        self.assertEqual(errors, [])
        self.assertTrue(any('no version stamp' in w for w in warns), warns)

    def test_baseline_file_lists_only_existing_features(self):
        """The ratchet only ever shrinks — a line for a folder that no longer
        exists would quietly re-permit an unstamped diagram under that name."""
        root = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
        with open(os.path.join(os.path.dirname(HERE), 'flowchart-baseline.txt'),
                  encoding='utf-8') as f:
            listed = [ln.strip() for ln in f
                      if ln.strip() and not ln.startswith('#')]
        for key in listed:
            self.assertTrue(os.path.isdir(os.path.join(root, 'Project', key)),
                            f'{key} is on the flowchart baseline but has no Project folder')


class ChangeTypeGate(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.cfg = fixture_cfg(self.tmp)

    def _archive(self, **kw):
        spec_builder.write_specs(self.cfg, linked_only=True, **kw)
        spec_builder.archive_current(self.cfg)

    def test_no_archive_reads_as_new(self):
        self.assertEqual(spec_builder.infer_change_type(self.cfg), 'new')

    def test_new_spec_without_evidence_hard_fails(self):
        self.cfg['decisions'] = []
        with self.assertRaises(spec_builder.SpecValidationError) as ctx:
            spec_builder.validate(self.cfg)
        self.assertIn('clarification round', str(ctx.exception))

    def test_open_question_alone_satisfies_the_gate(self):
        self.cfg['decisions'] = []
        self.cfg['open_questions'] = [('Q-01', 'What happens on timeout?', 'RD', 'P1-S2')]
        spec_builder.validate(self.cfg)  # must not raise

    def test_identical_rebuild_reads_as_cosmetic(self):
        self._archive()
        self.assertEqual(spec_builder.infer_change_type(self.cfg), 'cosmetic')

    def test_cosmetic_rebuild_needs_no_evidence(self):
        """Rewording a step decides nothing, so there is nothing to show. The
        first build is forced past the gate — it is the rebuild under test."""
        self.cfg['decisions'] = []
        self._archive(skip_validate=True)
        self.cfg['paths'][0]['steps'][0]['user'] = 'Lands on the page.'
        self.assertEqual(spec_builder.infer_change_type(self.cfg), 'cosmetic')
        spec_builder.validate(self.cfg)  # must not raise

    def test_dropping_a_decision_reads_as_behaviour(self):
        """Retiring a decision is a behaviour change in both directions."""
        self._archive()
        self.cfg['decisions'] = []
        self.assertEqual(spec_builder.infer_change_type(self.cfg), 'behaviour')

    def test_added_step_reads_as_behaviour(self):
        self._archive()
        self.cfg['paths'][0]['steps'].append(
            {'num': 3, 'user': 'Leaves.', 'system': 'Session ends.', 'qa': 'Exits cleanly.'})
        self.assertEqual(spec_builder.infer_change_type(self.cfg), 'behaviour')

    def test_changed_decision_reads_as_behaviour(self):
        self._archive()
        self.cfg['decisions'] = [('D-02', 'Different question?', 'Different answer.')]
        self.assertEqual(spec_builder.infer_change_type(self.cfg), 'behaviour')


class DataContractNotes(unittest.TestCase):
    """Keys that render nothing stay classified without costing a table row."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.cfg = fixture_cfg(self.tmp)
        self.cfg['data_contract'] = {
            'engine_only': {'id': 'T4', 'label': 'T4 &middot; Engine-only',
                            'keys': ['meta.prompt[]', 'srcKeys'],
                            'why': 'authored prompt content.'},
            'no_ui': [('info.srcImgs', 'slots always start empty')],
        }

    def _build(self):
        spec_builder.write_specs(self.cfg, linked_only=True)
        with open(os.path.join(self.cfg['out_dir'], 'spec.html'), encoding='utf-8') as f:
            return f.read()

    def test_notes_render_and_carry_every_key(self):
        html = self._build()
        self.assertIn('<code>meta.prompt[]</code>', html)
        self.assertIn('<code>srcKeys</code>', html)
        self.assertIn('<code>info.srcImgs</code>', html)

    def test_engine_only_note_is_still_a_cross_reference_target(self):
        self.cfg['paths'][0]['steps'][0]['limits'] = ['Never shown to the user (T4).']
        html = self._build()
        self.assertIn('id="T4"', html)
        self.assertIn('<a class="xref" href="#T4">T4</a>', html)


class JsonSchemaBlocks(unittest.TestCase):
    """data_contract['schemas'] — JSON shown as JSON, keys documented under it."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.cfg = fixture_cfg(self.tmp)
        self.cfg['data_contract'] = {'schemas': [{
            'caption': 'T1 &middot; Credit history record',
            'json': '{\n  "action": "pvImg2Vid_1080p",\n  "count": 3,\n'
                    '  "info": {"ok": true}\n}',
            'fields': [
                ('action', 'string', 'Maps to MSR <code>action_name</code>.'),
                ('info.ok', 'Untyped fields are legal.'),
            ],
        }]}

    def _build(self):
        spec_builder.write_specs(self.cfg, linked_only=True)
        with open(os.path.join(self.cfg['out_dir'], 'spec.html'), encoding='utf-8') as f:
            return f.read()

    def test_keys_values_and_literals_are_highlighted_apart(self):
        html = self._build()
        # A string before ':' is a key; the same token elsewhere is a value.
        self.assertIn('<span class="jk">"action"</span>', html)
        self.assertIn('<span class="jstr">"pvImg2Vid_1080p"</span>', html)
        self.assertIn('<span class="jlit">3</span>', html)
        self.assertIn('<span class="jlit">true</span>', html)

    def test_fields_render_with_and_without_a_type(self):
        html = self._build()
        self.assertIn('<span class="jf-type">string</span>', html)
        self.assertIn('<code>info.ok</code></div>', html)   # no badge emitted

    def test_caption_anchors_so_xrefs_resolve(self):
        self.cfg['paths'][0]['steps'][0]['limits'] = ['Read from the record (T1).']
        html = self._build()
        self.assertIn('id="T1"', html)
        self.assertIn('<a class="xref" href="#T1">T1</a>', html)

    def test_json_accepts_a_python_object(self):
        self.cfg['data_contract']['schemas'][0]['json'] = {'a': ['b']}
        html = self._build()
        self.assertIn('<span class="jk">"a"</span>', html)
        self.assertIn('<span class="jstr">"b"</span>', html)

    def test_markup_in_a_json_value_is_escaped(self):
        self.cfg['data_contract']['schemas'][0]['json'] = '{"x": "<b>&</b>"}'
        html = self._build()
        self.assertIn('&lt;b&gt;&amp;&lt;/b&gt;', html)
        self.assertNotIn('<b>&</b>', html)

    def test_cjk_in_a_payload_sample_is_allowed(self):
        # The CJK gate guards step prose. A translation table's whole point is
        # to carry localized values, so a JSON sample must be able to show them.
        self.cfg['data_contract']['schemas'][0]['json'] = '{"cht": "AI 髮型"}'
        spec_builder.validate(self.cfg)   # must not raise


class DataContractSpecKind(unittest.TestCase):
    """spec_kind='data-contract' — a payload mapping with no journey.

    The point of these tests is that the waived gates are REPLACED, not removed:
    an exemption that merely switched validation off would be the thing this
    skill exists to prevent, wearing a config key.
    """

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.cfg = {
            'spec_kind': 'data-contract',
            'feature_name': 'Credit Usage Description — Data Contract',
            'description': 'How a credit record resolves to a display name.',
            'author': 'Jason Chen', 'date': '2026-08-21', 'status': 'Review',
            'overview': [['Audience', 'Frontend RD / QA']],
            'out_dir': os.path.join(self.tmp, 'specs'),
            'data_contract': {'schemas': [{
                'caption': 'T1 &middot; Credit history record',
                'json': '{"action": "pvImg2Vid_1080p"}',
                'fields': [('action', 'string', 'Maps to MSR action_name.')],
            }]},
            'criteria': [('S1.1', 'Description resolves from action + feature name.', ['T1'])],
            'open_questions': [('Q-01', 'Language-code mapping?', 'T1', 'RD')],
        }

    def _build(self):
        spec_builder.write_specs(self.cfg, linked_only=True)
        with open(os.path.join(self.cfg['out_dir'], 'spec.html'), encoding='utf-8') as f:
            return f.read()

    # ---- what the kind waives ----
    def test_builds_with_no_paths_no_flowchart_no_screenshots(self):
        html = self._build()
        self.assertIn('Data Contract', html)
        self.assertIn('id="T1"', html)

    def test_empty_path_index_and_flow_diagram_are_omitted(self):
        html = self._build()
        self.assertNotIn('All User Paths', html)
        self.assertNotIn('id="flow-diagram"', html)
        self.assertNotIn('href="#paths"', html)

    def test_callout_does_not_promise_step_cards(self):
        html = self._build()
        self.assertNotIn('screenshot first', html)
        self.assertIn('data-contract specification', html)

    def test_a_supplied_flowchart_is_still_version_checked(self):
        self.cfg['svg_path'] = os.path.join(self.tmp, 'flow.svg')
        with open(self.cfg['svg_path'], 'w', encoding='utf-8') as f:
            f.write('<svg><text>matches spec v9, 2020-01-01</text></svg>')
        self.cfg['version'] = 'v1'
        with self.assertRaises(spec_builder.SpecValidationError):
            spec_builder.validate(self.cfg)

    # ---- what it demands in exchange ----
    def test_missing_data_contract_hard_fails(self):
        del self.cfg['data_contract']
        with self.assertRaises(spec_builder.SpecValidationError) as e:
            spec_builder.validate(self.cfg)
        self.assertIn('data_contract', str(e.exception))

    def test_empty_data_contract_hard_fails(self):
        self.cfg['data_contract'] = {'intro': 'nothing here'}
        with self.assertRaises(spec_builder.SpecValidationError):
            spec_builder.validate(self.cfg)

    def test_missing_criteria_hard_fails(self):
        del self.cfg['criteria']
        with self.assertRaises(spec_builder.SpecValidationError) as e:
            spec_builder.validate(self.cfg)
        self.assertIn('criteria', str(e.exception))

    def test_criterion_pointing_at_an_undefined_block_hard_fails(self):
        self.cfg['criteria'] = [('S1.1', 'Resolves.', ['T9'])]
        with self.assertRaises(spec_builder.SpecValidationError):
            spec_builder.validate(self.cfg)

    def test_phase0_evidence_gate_still_applies(self):
        del self.cfg['open_questions']
        with self.assertRaises(spec_builder.SpecValidationError):
            spec_builder.validate(self.cfg)

    def test_cjk_gate_still_applies_to_a_criterion(self):
        self.cfg['criteria'] = [('S1.1', '中文驗收條件', ['T1'])]
        with self.assertRaises(spec_builder.SpecValidationError):
            spec_builder.validate(self.cfg)

    def test_unknown_spec_kind_is_rejected(self):
        self.cfg['spec_kind'] = 'freeform'
        with self.assertRaises(spec_builder.SpecValidationError) as e:
            spec_builder.validate(self.cfg)
        self.assertIn('unknown spec_kind', str(e.exception))

    def test_storyboard_still_requires_paths(self):
        self.cfg['spec_kind'] = 'storyboard'
        with self.assertRaises(spec_builder.SpecValidationError) as e:
            spec_builder.validate(self.cfg)
        self.assertIn('paths', str(e.exception))

    # ---- context_shot: where the contract surfaces ----
    def test_context_shot_renders_inside_the_data_contract(self):
        ss = os.path.join(self.tmp, 'shots')
        os.makedirs(ss, exist_ok=True)
        with open(os.path.join(ss, '01_where.png'), 'wb') as f:
            f.write(PNG_1PX)
        self.cfg['screenshots_dir'] = ss
        self.cfg['context_shot'] = {'shot': '01_where.png', 'caption': 'Where it lands.'}
        html = self._build()
        dc = html[html.index('id="data-contract"'):]
        self.assertIn('screenshots/01_where.png', dc)
        self.assertIn('Where it lands.', dc)
        self.assertLess(dc.index('01_where.png'), dc.index('id="T1"'))

    def test_missing_context_shot_hard_fails(self):
        self.cfg['screenshots_dir'] = os.path.join(self.tmp, 'shots')
        os.makedirs(self.cfg['screenshots_dir'], exist_ok=True)
        self.cfg['context_shot'] = {'shot': 'nope.png'}
        with self.assertRaises(spec_builder.SpecValidationError) as e:
            spec_builder.validate(self.cfg)
        self.assertIn('nope.png', str(e.exception))

    def test_context_shot_without_a_screenshots_dir_hard_fails(self):
        self.cfg['context_shot'] = {'shot': '01_where.png'}
        with self.assertRaises(spec_builder.SpecValidationError) as e:
            spec_builder.validate(self.cfg)
        self.assertIn('screenshots_dir', str(e.exception))


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
