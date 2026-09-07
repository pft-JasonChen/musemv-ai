#!/usr/bin/env python3
"""Regression tests for skills/yco-spec/flowchart_lib.py.

    /usr/bin/python3 -m unittest discover -s skills/yco-spec/tests -v

There is no golden snapshot here — the diagram is judged by eye. What these tests
guard is the part that has no visual tell until someone reads the PDF: whether a
label actually fits inside the box drawn around it. SVG has no layout engine, so
an overflowing label renders happily and silently.
"""
import os
import re
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))

from flowchart_lib import (Flow, KINDS, EDGES, TEXT_PAD, esc, text_width, wrap_text)


class TestMetrics(unittest.TestCase):
    def test_width_scales_with_font_size(self):
        self.assertAlmostEqual(text_width('hello', 24) / text_width('hello', 12), 2.0, places=6)

    def test_bold_is_wider(self):
        self.assertGreater(text_width('Generate', 14, bold=True), text_width('Generate', 14))

    def test_estimate_is_close_to_real_helvetica(self):
        # 'Feature room' in Helvetica 14 is ~82px; the estimate must be in the
        # right neighbourhood, and must not UNDER-estimate badly (that is the
        # direction that ships an overflow).
        w = text_width('Feature room', 14)
        self.assertTrue(78 <= w <= 95, w)

    def test_unknown_glyph_does_not_crash(self):
        self.assertGreater(text_width('日本語', 12), 0)


class TestWrap(unittest.TestCase):
    def test_short_text_is_one_line(self):
        lines, over = wrap_text('History', 14, 200, bold=True)
        self.assertEqual(lines, ['History'])
        self.assertEqual(over, [])

    def test_long_text_wraps_and_every_line_fits(self):
        s = 'the generated image lands here and then some more words'
        lines, over = wrap_text(s, 12, 120)
        self.assertGreater(len(lines), 1)
        self.assertEqual(over, [])
        for ln in lines:
            self.assertLessEqual(text_width(ln, 12), 120, ln)

    def test_wrap_preserves_all_words(self):
        s = 'one file per slot · P1-S4'
        lines, _ = wrap_text(s, 12, 60)
        self.assertEqual(' '.join(lines).split(), s.split())

    def test_unbreakable_word_is_reported(self):
        _, over = wrap_text('supercalifragilistic', 14, 40)
        self.assertEqual(over, ['supercalifragilistic'])


class TestNodeFit(unittest.TestCase):
    """Every glyph the builder emits must sit inside the rect it emits."""

    #: The SVG carries escaped text ("&quot;"), but the browser renders one glyph.
    #: Measure what is rendered, not what is stored, or every entity reads 6x wide.
    _UNESC = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#8212;': '—',
              '&#8211;': '–', '&#8594;': '→', '&#183;': '·', '&#8220;': '“',
              '&#8221;': '”', '&#8217;': '’'}

    def _plain(self, s):
        for k, v in self._UNESC.items():
            s = s.replace(k, v)
        return s

    def _boxes_and_text(self, svg):
        rects = [(float(m[0]), float(m[1]), float(m[2]), float(m[3])) for m in
                 re.findall(r'<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"', svg)]
        texts = re.findall(r'<text x="([-\d.]+)" y="([-\d.]+)" font-size="(\d+)"'
                           r'(?: font-weight="(\d+)")? fill="[^"]*" text-anchor="middle">([^<]*)</text>', svg)
        return rects, texts

    def test_wrapped_label_stays_inside_its_box(self):
        f = Flow('T', 'sub', version='v1', date='2026-01-01', width=600, node_w=180)
        f.node(f.SPINE, 40, 'Switch template ("See all")', 'reopens the dialog · P1-S2')
        svg = f.render()
        rects, texts = self._boxes_and_text(svg)
        box = [r for r in rects if r[2] == 180][0]
        self.assertGreater(len(texts), 2, 'expected the title to have wrapped')
        for x, y, size, weight, label in texts:
            half = text_width(self._plain(label), int(size), bold=bool(weight)) / 2
            self.assertGreaterEqual(float(x) - half, box[0], f'{label!r} overflows left')
            self.assertLessEqual(float(x) + half, box[0] + box[2], f'{label!r} overflows right')

    def test_box_grows_taller_for_wrapped_text(self):
        short = Flow('T', 's', version='v1', date='d', node_w=180)
        n1 = short.node(short.SPINE, 0, 'History', 'P1-S6')
        tall = Flow('T', 's', version='v1', date='d', node_w=180)
        n2 = tall.node(tall.SPINE, 0, 'History', 'a much longer subtitle that has to wrap over lines')
        self.assertEqual(n1.h, 50)                 # the reference geometry
        self.assertGreater(n2.h, n1.h)

    def test_single_line_geometry_matches_the_reference(self):
        f = Flow('T', 's', version='v1', date='d', node_w=180)
        f.node(0, 0, 'Home', 'CMS topics · P1-S3')
        svg = f.render()
        self.assertIn('height="50"', svg)
        self.assertIn('y="20"', svg)               # title baseline
        self.assertIn('y="38"', svg)               # subtitle baseline

    def test_overflow_is_warned_not_swallowed(self):
        f = Flow('T', 's', version='v1', date='d', node_w=80)
        f.node(0, 0, 'Antidisestablishmentarianism')
        self.assertTrue(f.warnings)

    def test_decision_widens_to_fit(self):
        f = Flow('T', 's', version='v1', date='d')
        narrow = f.decision(300, 100, 'Yes?')
        wide = f.decision(300, 300, 'Has every upload slot been filled in?')
        self.assertGreater(wide.w, narrow.w)


class TestLabelClearance(unittest.TestCase):
    """A label with no visual tell either: SVG has no collision detection, so an
    edge/elbow label sitting on top of the line or box it's meant to explain
    renders happily and silently. Regression coverage for the 2026-08-24 fix,
    mutation-tested against the pre-fix `edge()`/`elbow()` (both cases below
    failed against the old code; see the fix commit for the mutation log):
    a long label on a shallow diagonal edge crossed its own line (spec's
    outcome -> Generation Failed edge, "[fail]" marker), and an elbow's label
    sat on top of its own target node's title (spec's P4-S1 "guest").
    """

    def _label_texts(self, svg):
        """(x, y, text) for every plain <text> node (not inside a <tspan>/xref)."""
        return [(float(x), float(y), t) for x, y, t in
                re.findall(r'<text x="([-\d.]+)" y="([-\d.]+)"[^>]*>([^<]*)</text>', svg)]

    def _elbow_turn_x(self, svg):
        """The x where an elbow's connector turns vertical.

        Only paths carrying `marker-end` are edges — the arrowheads in <defs>
        are also <path d="M0 0 L10 5 L0 10"> and match a naive `<path d="M...`
        regex first, which silently returns 10.0 for every assertion.
        """
        paths = [m for m in re.findall(r'<path d="([^"]+)"[^>]*marker-end="[^"]*"', svg)]
        self.assertTrue(paths, 'no marker-terminated path found in the render')
        return float(paths[0].split(' L')[1].split(' ')[0])

    def test_long_label_on_shallow_diagonal_clears_the_line(self):
        # Mirrors the spec's outcome-decision -> Generation Failed edge: a long
        # label, a wide dx and a shallow dy — the shape that put the old fixed
        # -6px vertical nudge on top of the line for the label's full width.
        f = Flow('T', 's', version='v1', date='d', node_w=180)
        a = f.decision(550, 610, 'Job outcome')
        b = f.node(140, 700, 'Generation Failed', kind='error')
        f.edge(a, b, '"[fail]" marker - a long label that spans a wide x range', kind='error')
        svg = f.render()
        texts = self._label_texts(svg)
        label = [t for t in texts if 'fail' in t[2]][0]
        lx, ly, _ = label
        # The line's y at the label's x (linear interpolation between the ports).
        p1, p2 = a.bottom, b.top
        t = (lx - p1[0]) / (p2[0] - p1[0])
        line_y_here = p1[1] + t * (p2[1] - p1[1])
        self.assertGreater(abs(ly - line_y_here), 8,
                            'label baseline sits within one text-height of the line at its own x')

    def test_forward_elbow_turns_between_the_boxes_not_inside_the_target(self):
        """The 2026-08-24 routing bug: `mx = max(p1,p2) + gap` is only right for
        the wrap-around shape. Entering a target's NEAR edge, it put the turn
        inside the target's own span, so the connector was drawn through the box
        and doubled back. Measured on the AI Song diagram: mx=890 for a target
        spanning x=800..980."""
        f = Flow('T', 's', version='v1', date='d', node_w=180)
        origin = f.node(460, 410, 'Tap Create Song')
        target = f.node(800, 390, 'No active session', 'Sign-in gate opens', kind='aside')
        f.elbow(origin, target, kind='deferred', out='right', into='left', gap=90)
        turn_x = self._elbow_turn_x(f.render())
        self.assertGreater(turn_x, origin.x + origin.w,
                           'turn happens inside/behind the source box')
        self.assertLess(turn_x, target.x,
                        'turn happens inside the target box — connector crosses it')

    def test_wraparound_elbow_still_clears_both_boxes(self):
        """The shape `gap` was designed for must keep its old behaviour: the
        target is entered on the same side the edge left from, so the turn has
        to sit beyond BOTH boxes rather than between them."""
        f = Flow('T', 's', version='v1', date='d', node_w=180)
        a = f.node(300, 100, 'info')
        b = f.node(300, 300, 'room')
        f.elbow(a, b, 'retry', kind='retry', out='right', into='right', gap=40)
        turn_x = self._elbow_turn_x(f.render())
        self.assertAlmostEqual(turn_x, max(a.x + a.w, b.x + b.w) + 40, places=6)

    def test_elbow_label_sits_above_target_not_on_its_title(self):
        f = Flow('T', 's', version='v1', date='d', node_w=180)
        origin = f.node(300, 400, 'Tap Create Song')
        target = f.node(700, 390, 'No active session', 'Sign-in gate opens', kind='aside')
        f.elbow(origin, target, 'guest', kind='deferred', out='right', into='left', gap=90)
        svg = f.render()
        texts = self._label_texts(svg)
        label = [t for t in texts if t[2] == 'guest'][0]
        title = [t for t in texts if 'No active session' in t[2]][0]
        self.assertLess(label[1], title[1], 'elbow label does not sit above the target’s own title')
        self.assertGreater(title[1] - label[1], 6, 'elbow label is too close to the target’s title')


class TestDocument(unittest.TestCase):
    def test_stamp_is_composed_from_version_and_date(self):
        svg = Flow('T', 'Web — desktop 1440', version='v7', date='2026-08-11').render()
        self.assertIn('matches spec v7, 2026-08-11', svg)

    def test_text_is_escaped_exactly_once(self):
        svg = Flow('A & B', 'x — y', version='v1', date='d').render()
        self.assertIn('A &amp; B', svg)
        self.assertNotIn('&amp;amp;', svg)
        self.assertNotIn('&amp;#8212;', svg)

    def test_legends_list_only_what_was_drawn(self):
        f = Flow('T', 's', version='v1', date='d')
        a = f.node(0, 0, 'a')
        b = f.node(0, 100, 'b', kind='error')
        f.edge(a, b, kind='error')
        f.legend(300)
        svg = f.render()
        self.assertIn(KINDS['error'][2], svg)
        self.assertIn(EDGES['error'][3], svg)
        self.assertNotIn(KINDS['success'][2], svg)      # never used
        self.assertNotIn(EDGES['retry'][3], svg)

    def test_edges_connect_ports_so_they_track_their_nodes(self):
        f = Flow('T', 's', version='v1', date='d', node_w=180)
        a = f.node(100, 0, 'a')
        b = f.node(100, 200, 'b')
        f.edge(a, b)
        self.assertIn(f'x1="{a.cx:g}" y1="{a.y + a.h:g}" x2="{b.cx:g}" y2="{b.y:g}"', f.render())

    def test_render_is_wellformed_xml(self):
        from xml.dom.minidom import parseString
        f = Flow('T & co', 'sub', version='v1', date='d')
        a = f.node(0, 0, 'Start "here"', 'x · y', kind='entry')
        d = f.decision(300, 200, 'Ok?')
        f.edge(a, d, 'go')
        f.elbow(d, a, 'back', kind='retry')
        f.section(400, 'Part 1 — x')
        f.legend(450)
        parseString(f.render())      # raises on malformed output


class TestGeometryCheck(unittest.TestCase):
    """`check()` and the auto-fitting canvas — added 2026-09-02, after seven of
    the nine storyboard diagrams were measured and found broken.

    Every case here is mutation-tested: the "clean" assertion and the "dirty"
    assertion sit side by side, so a check that cannot fail would show up as
    two passing halves that say the same thing.
    """

    def _flow(self, **kw):
        return Flow('T', 's', version='v1', date='d', width=600, **kw)

    def test_overlapping_nodes_are_found_and_separated_ones_are_not(self):
        f = self._flow()
        f.node(40, 100, 'left')
        f.node(40, 300, 'right')
        self.assertEqual(f.check(), [])
        g = self._flow()
        g.node(40, 100, 'left')
        g.node(40, 130, 'right')                      # 20px of vertical overlap
        self.assertTrue(any('overlap' in m for m in g.check()))

    def test_a_diamond_that_widened_into_its_neighbour_is_found(self):
        """The failure that broke credits-iap AND profile-account: `decision()`
        grows to fit its own label, so a box placed beside it at authoring time
        can end up underneath it."""
        f = self._flow()
        f.node(40, 100, 'box')                        # x 40..220 at node_w=180
        f.decision(420, 125, 'short?')                # hw=92 -> x 328..512
        self.assertEqual(f.check(), [])
        g = self._flow()
        g.node(40, 100, 'box')
        g.decision(420, 125, 'a decision whose label is very much longer')
        self.assertTrue(any('overlap' in m for m in g.check()))

    def test_a_node_off_the_canvas_is_found(self):
        f = self._flow()
        f.node(-60, 100, 'clipped')                   # mv-creation drew one at x=-60
        self.assertTrue(any('off the canvas' in m for m in f.check()))

    def test_a_label_lying_on_a_node_is_found(self):
        f = self._flow()
        a = f.node(40, 100, 'a')
        b = f.node(40, 400, 'b')
        f.edge(a, b, 'plenty of room')
        self.assertEqual(f.check(), [])
        g = self._flow()
        c = g.node(40, 100, 'a')
        d = g.node(40, 152, 'b')                      # 2px apart: nowhere for a label
        g.edge(c, d, 'no room at all')
        self.assertTrue(any(m.startswith('label ') for m in g.check()))

    def test_explicit_height_can_only_grow(self):
        """profile-account passed height=1200 and drew to 1873, so its bottom
        third — two whole paths and the legend — was not in the file."""
        f = self._flow(height=200)
        f.node(40, 100, 'a')
        f.legend(600)
        svg = f.render()
        h = int(re.search(r'<svg[^>]*height="(\d+)"', svg).group(1))
        self.assertGreater(h, 600)
        self.assertTrue(any('too small' in w for w in f.warnings))

    def test_generous_explicit_height_is_honoured(self):
        f = self._flow(height=2000)
        f.node(40, 100, 'a')
        self.assertIn('height="2000"', f.render())
        self.assertEqual(f.warnings, [])

    def test_write_refuses_a_broken_diagram(self):
        import tempfile
        f = self._flow()
        f.node(40, 100, 'a')
        f.node(40, 130, 'b')
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, 'x.svg')
            with self.assertRaises(SystemExit):
                f.write(out)
            self.assertFalse(os.path.exists(out))     # nothing written
            f.write(out, strict=False)                # ...unless asked to look
            self.assertTrue(os.path.exists(out))


if __name__ == '__main__':
    unittest.main(verbosity=2)
