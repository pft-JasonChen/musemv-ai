#!/usr/bin/env python3
"""flowchart_lib.py — the YCO spec flowchart visual language, as primitives.

A feature's `user-flowchart.svg` used to be hand-written XML, so every diagram
drifted: one used Arial and 2px black borders, the next used the system stack and
soft semantic fills. This module owns the styling; the author owns the layout.

    from flowchart_lib import Flow

    f = Flow('Image Template', 'Web (YCO Online Editor) - desktop 1440',
             version='v2', date='2026-08-11', width=980)
    entry = f.node(f.SPINE, 40, 'Sidebar "Image Template"', kind='entry')
    dlg   = f.node(f.SPINE, 112, 'Template Selection Dialog', 'ACMS categories - P1-S2')
    f.edge(entry, dlg)
    f.write('Project/<feature>/user-flowchart.svg')

Why coordinates rather than auto-layout: the diagrams worth reading put the happy
path on one spine and hang branches off it at chosen points. Auto-layout cannot
be told which branch matters, and the one thing these diagrams must do is make the
main path obvious at a glance.

**The diagram draws paths; rules live in step cards** — see references/flowchart.md.
A node says what happens and cites the step ID that owns the rule. It never
restates the rule, because a copy of a rule is a rule that can go stale silently.
"""
import math

# ── the visual language ───────────────────────────────────────────────────────
# Extracted from 2026-05-20-support-chatbot, the reference diagram. Node colour
# carries meaning (top legend); edge style carries meaning (bottom legend).

FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"

INK, MUTED, HAIRLINE = '#0c1c22', '#5a6b78', '#e5e9ed'

#: node kind -> (fill, stroke, meaning shown in the top legend)
KINDS = {
    'screen':   ('#ffffff', '#cfd8de', None),
    'entry':    ('#f4f6f8', '#c0ccd3', None),
    'aside':    ('#f4f6f8', '#c0ccd3', None),
    'decision': ('#fdf1df', '#e0a24a', 'amber = decision'),
    'success':  ('#e3f7ea', '#6cc79a', 'green = success / resolved'),
    'info':     ('#e0f7fd', '#6cc7e6', 'blue = system response'),
    'human':    ('#fdece9', '#e8a99f', 'coral = human hand-off'),
    'error':    ('#fdecec', '#e08a8a', 'red = error state'),
}

#: edge kind -> (stroke, width, dash, meaning shown in the bottom legend)
EDGES = {
    'primary':    ('#5a6b78', 1.8, None,    'Primary happy path'),
    'error':      ('#d6484a', 1.5, None,    'Error branch'),
    'structural': ('#a8b2ba', 1.5, None,    'Structural navigation (entry, exit, close)'),
    'deferred':   ('#a8b2ba', 1.5, '5 4',   'Deferred / reused elsewhere'),
    'retry':      ('#6cc7e6', 1.5, '2 3',   'Retry loop'),
}

NODE_W, NODE_H, NODE_H1 = 180, 50, 40   # default width; height with / without a subtitle
TEXT_PAD = 12                           # horizontal breathing room inside a node
DIAMOND_W, DIAMOND_H = 92, 32           # half-extents
PAD_L, HEAD_H = 40, 80                  # left margin; header block height

_ESC = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
        '—': '&#8212;', '–': '&#8211;', '→': '&#8594;', '·': '&#183;',
        '“': '&#8220;', '”': '&#8221;', '’': '&#8217;', '≥': '&#8805;', '≤': '&#8804;'}


def esc(t):
    """XML-safe text. The SVG is inlined into spec.html, so it must be valid XML
    and must keep its step IDs readable — _check_xrefs greps these <text> nodes."""
    s = str(t)
    for k, v in _ESC.items():
        s = s.replace(k, v)
    return s


# ── text metrics ──────────────────────────────────────────────────────────────
# SVG has no layout engine, so a label that does not fit simply spills out of its
# box and nothing complains. These are Helvetica advance widths (units per 1000
# em), close enough to the system stack to wrap against; BOLD_K covers the weight
# difference. Estimates run slightly wide, which is the safe direction.

_W = {' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
      '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
      ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
      '[': 333, '\\': 278, ']': 333, '^': 469, '_': 556, '`': 333,
      '{': 334, '|': 260, '}': 334, '~': 584,
      'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778, 'H': 722,
      'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778, 'P': 667,
      'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944, 'X': 667,
      'Y': 667, 'Z': 611,
      'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556, 'h': 556,
      'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556, 'p': 556,
      'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722, 'x': 500,
      'y': 500, 'z': 500,
      '·': 278, '—': 1000, '–': 556, '→': 838, '“': 333, '”': 333, '’': 222,
      '≥': 549, '≤': 549}
for _d in '0123456789':
    _W[_d] = 556
BOLD_K = 1.07


def text_width(s, size, bold=False):
    """Estimated rendered width in px."""
    w = sum(_W.get(c, 556) for c in str(s)) / 1000.0 * size
    return w * BOLD_K if bold else w


def wrap_text(s, size, max_w, bold=False):
    """Greedy word wrap. Returns the lines, plus any single word that still does
    not fit — an unbreakable label is a layout problem the author has to see."""
    words, lines, cur, over = str(s).split(' '), [], '', []
    for word in words:
        trial = f'{cur} {word}'.strip()
        if cur and text_width(trial, size, bold) > max_w:
            lines.append(cur)
            cur = word
        else:
            cur = trial
        if text_width(word, size, bold) > max_w:
            over.append(word)
    if cur:
        lines.append(cur)
    return lines or [''], over


class Node:
    """A placed box. Edges connect to its ports, never to raw coordinates —
    that is what stops an arrow from drifting when a box moves or resizes."""

    __slots__ = ('x', 'y', 'w', 'h', 'kind')

    def __init__(self, x, y, w, h, kind):
        self.x, self.y, self.w, self.h, self.kind = x, y, w, h, kind

    @property
    def cx(self): return self.x + self.w / 2

    @property
    def cy(self): return self.y + self.h / 2

    @property
    def top(self): return (self.cx, self.y)

    @property
    def bottom(self): return (self.cx, self.y + self.h)

    @property
    def left(self): return (self.x, self.cy)

    @property
    def right(self): return (self.x + self.w, self.cy)


class Flow:
    """One flowchart. Build it with node()/decision()/edge(), then write().

    `version` and `date` are not decoration: write_specs() refuses to build when
    the stamp does not match cfg['version'], so the subtitle is composed here
    rather than typed by hand each time.
    """

    def __init__(self, title, subtitle, version, date, width=980, height=None,
                 desc=None, node_w=NODE_W):
        self.title, self.subtitle = title, subtitle
        self.version, self.date = version, date
        self.width, self._height, self.desc = width, height, desc
        self.node_w = node_w
        self.SPINE = width / 2 - node_w / 2      # x of a centred spine node
        self._body, self._kinds_used, self._edges_used = [], [], []
        self._max_y = 0
        self.warnings = []

    # ── nodes ────────────────────────────────────────────────────────────────

    def node(self, x, y, title, sub=None, kind='screen', w=None, h=None):
        """A rounded box. `entry` renders as a stadium — it reads as a start.

        Text is measured and wrapped to fit `w`, and the box grows taller to hold
        the extra lines. Nothing here widens the box: a spine of ragged-width
        boxes is harder to read than one of ragged-height boxes.
        """
        fill, stroke, meaning = KINDS[kind]
        if meaning and meaning not in self._kinds_used:
            self._kinds_used.append(meaning)
        w = w or self.node_w
        inner = w - 2 * TEXT_PAD
        t_lines, t_over = wrap_text(title, 14, inner, bold=True)
        s_lines, s_over = wrap_text(sub, 12, inner) if sub else ([], [])
        for word in t_over + s_over:
            self.warnings.append(f'"{word}" does not fit a {w:g}px node at ({x:g},{y:g}) — '
                                 f'widen it with w=, or shorten the label')

        # Baselines chosen so the common one-line/one-subtitle case renders
        # byte-identically to the hand-drawn reference: 20 / 38 in a 50px box.
        ys, cur = [], 20
        for i in range(len(t_lines)):
            ys.append(cur)
            cur += 17
        cur += 1
        for i in range(len(s_lines)):
            ys.append(cur)
            cur += 15
        need = ys[-1] + 12
        h = h or max(need, NODE_H if sub else NODE_H1)
        if not sub and len(t_lines) == 1:
            ys = [h / 2 + 5]

        rx = min(h, NODE_H1) / 2 if kind == 'entry' else 8
        dash = ' stroke-dasharray="5 4"' if kind == 'aside' else ''
        self._body.append(
            f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{rx:g}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="1.5"{dash}/>')
        cx = x + w / 2
        for i, line in enumerate(t_lines):
            self._body.append(_txt(cx, y + ys[i], line, 14, INK, weight=700))
        for j, line in enumerate(s_lines):
            self._body.append(_txt(cx, y + ys[len(t_lines) + j], line, 12, MUTED))
        n = Node(x, y, w, h, kind)
        self._max_y = max(self._max_y, y + h)
        return n

    def decision(self, cx, cy, title, sub=None, hw=DIAMOND_W, hh=DIAMOND_H):
        """An amber diamond. Both outgoing edges must be labelled — an unlabelled
        fork is the most common way a diagram stops matching the spec.

        Widens to fit its text rather than wrapping: a diamond tapers, so a second
        line has far less room than the first and would collide with the edges.
        """
        fill, stroke, meaning = KINDS['decision']
        if meaning not in self._kinds_used:
            self._kinds_used.append(meaning)
        # Usable width at the text baselines is roughly the diamond's half-width.
        need = max(text_width(title, 13, bold=True), text_width(sub or '', 11))
        hw = max(hw, need + 24)
        pts = f'{cx:g},{cy-hh:g} {cx+hw:g},{cy:g} {cx:g},{cy+hh:g} {cx-hw:g},{cy:g}'
        self._body.append(f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
        if sub:
            self._body.append(_txt(cx, cy - 2, title, 13, INK, weight=700))
            self._body.append(_txt(cx, cy + 15, sub, 11, MUTED))
        else:
            self._body.append(_txt(cx, cy + 5, title, 13, INK, weight=700))
        n = Node(cx - hw, cy - hh, hw * 2, hh * 2, 'decision')
        self._max_y = max(self._max_y, cy + hh)
        return n

    def section(self, y, label):
        """A `Part N — <path name>` band. One per path in cfg['paths']."""
        self._body.append(f'<line x1="{PAD_L}" y1="{y-22:g}" x2="{self.width-PAD_L}" y2="{y-22:g}" '
                          f'stroke="{HAIRLINE}" stroke-width="1"/>')
        self._body.append(f'<text x="{PAD_L}" y="{y:g}" font-size="15" font-weight="700" '
                          f'fill="{INK}">{esc(label)}</text>')
        self._max_y = max(self._max_y, y)

    def note(self, x, y, text, size=12):
        self._body.append(f'<text x="{x:g}" y="{y:g}" font-size="{size}" fill="{MUTED}">{esc(text)}</text>')
        self._max_y = max(self._max_y, y)

    # ── edges ────────────────────────────────────────────────────────────────

    def edge(self, a, b, label=None, kind='primary', side=None, label_dx=12, label_dy=-6,
             label_clearance=14):
        """Connect two nodes. `side` picks the ports — 'v' (bottom→top, default),
        'h' (right→left), or an explicit ('right','top')-style pair.

        A steep (near-vertical) edge places its label beside the line, offset
        sideways by `label_dx`/`label_dy` — unchanged from before. A shallow or
        diagonal edge instead offsets PERPENDICULAR to the line's own slope by
        `label_clearance` px. A flat vertical nudge is not enough clearance for
        a long label on a shallow line: the line's y barely changes across the
        label's width, so the two stay close for the label's full span and the
        line visibly crosses the text (see tests/test_flowchart_lib.py's
        regression for the P3-S1 case this was written against).
        """
        if kind not in self._edges_used:
            self._edges_used.append(kind)
        p1, p2 = _ports(a, b, side)
        self._line(p1, p2, kind)
        if label:
            mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
            dx, dy = p2[0] - p1[0], p2[1] - p1[1]
            steep = abs(dx) < abs(dy)
            if steep:
                anchor = 'start'
                lx, ly = mx + label_dx, my + label_dy
            else:
                anchor = 'middle'
                length = math.hypot(dx, dy) or 1.0
                nx, ny = -dy / length, dx / length
                if ny > 0:          # keep the offset pointing "up" on screen
                    nx, ny = -nx, -ny
                lx, ly = mx + nx * label_clearance, my + ny * label_clearance
            self._body.append(_txt(lx, ly, label, 12, MUTED, anchor=anchor))

    def elbow(self, a, b, label=None, kind='structural', out='right', into='left', gap=30):
        """A routed edge that leaves `a` sideways, turns, and enters `b` sideways.

        Two different shapes share this method, and the routing x (`mx`, where
        the vertical turn happens) is NOT the same for both:

        - **Wrap-around** — the target's entry port is on the same side the edge
          left from, so the connector has to clear BOTH boxes before doubling
          back ('None of above', 'asks again'). `mx` goes `gap` px past the
          outermost of the two ports. This is what `gap` was designed for.
        - **Forward** — the target sits further along in the direction of travel
          and is entered on its NEAR edge. Here the turn must happen in the space
          BETWEEN the two boxes. Pushing it `gap` past the outermost port lands
          it inside the target's own span, and the connector is then drawn
          straight through the target box before doubling back to its edge —
          measured on the AI Song diagram, where `mx` came out at 890 for a
          target spanning x=800..980 (see tests/test_flowchart_lib.py).

        The label sits centred just above node `b`, not at the corner: the
        corner's x is derived from `b`'s own position, so a corner-anchored
        label sits on top of `b`'s title once `gap` is small relative to node
        width — and two elbows fanning out from one origin port put both
        corners at the same x, so their labels would collide with each other.
        `b`'s own y is what actually differs between such calls.
        """
        if kind not in self._edges_used:
            self._edges_used.append(kind)
        p1 = getattr(a, out)
        p2 = getattr(b, into)
        forward = (p2[0] > p1[0]) if out == 'right' else (p2[0] < p1[0])
        if not forward:
            mx = (max(p1[0], p2[0]) + gap) if out == 'right' else (min(p1[0], p2[0]) - gap)
        elif out == 'right':
            mx = min(p1[0] + gap, (p1[0] + p2[0]) / 2)
        else:
            mx = max(p1[0] - gap, (p1[0] + p2[0]) / 2)
        d = f'M{p1[0]:g} {p1[1]:g} L{mx:g} {p1[1]:g} L{mx:g} {p2[1]:g} L{p2[0]:g} {p2[1]:g}'
        stroke, w, dash, _ = EDGES[kind]
        dash = f' stroke-dasharray="{dash}"' if dash else ''
        self._body.append(f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{w}"{dash} '
                          f'marker-end="url(#fc-{kind})"/>')
        if label:
            self._body.append(_txt(b.cx, b.y - 8, label, 11, MUTED, anchor='middle'))

    def _line(self, p1, p2, kind):
        stroke, w, dash, _ = EDGES[kind]
        dash = f' stroke-dasharray="{dash}"' if dash else ''
        self._body.append(
            f'<line x1="{p1[0]:g}" y1="{p1[1]:g}" x2="{p2[0]:g}" y2="{p2[1]:g}" '
            f'stroke="{stroke}" stroke-width="{w}"{dash} marker-end="url(#fc-{kind})"/>')

    # ── output ───────────────────────────────────────────────────────────────

    def legend(self, y, extra_note=None):
        """The bottom legend: what each *line style* means. Node colour is
        explained in the header line; both are needed because the two encode
        different things and a reader cannot infer either one."""
        self._body.append(f'<line x1="{PAD_L}" y1="{y-24:g}" x2="{self.width-PAD_L}" y2="{y-24:g}" '
                          f'stroke="{HAIRLINE}" stroke-width="1"/>')
        yy = y
        for kind in self._edges_used:
            stroke, w, dash, meaning = EDGES[kind]
            dash = f' stroke-dasharray="{dash}"' if dash else ''
            self._body.append(f'<line x1="{PAD_L}" y1="{yy-4:g}" x2="{PAD_L+34}" y2="{yy-4:g}" '
                              f'stroke="{stroke}" stroke-width="{w}"{dash} marker-end="url(#fc-{kind})"/>')
            self._body.append(f'<text x="{PAD_L+46}" y="{yy:g}" font-size="12" fill="{MUTED}">{esc(meaning)}</text>')
            yy += 20
        if extra_note:
            yy += 4
            self._body.append(f'<text x="{PAD_L}" y="{yy:g}" font-size="12" fill="{MUTED}">{esc(extra_note)}</text>')
            yy += 20
        self._max_y = max(self._max_y, yy)

    def render(self):
        h = self._height or int(self._max_y + HEAD_H + 40)
        defs = ''.join(
            f'<marker id="fc-{k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" fill="none" stroke="{v[0]}" '
            f'stroke-width="1.5"/></marker>' for k, v in EDGES.items())
        # Text is passed in plain and escaped exactly once, here. Callers writing
        # their own entities would be double-escaped ("&amp;#8212;") — pass "—".
        stamp = esc(f'{self.subtitle} · matches spec {self.version}, {self.date}')
        head = [
            f'<text x="{PAD_L}" y="30" font-size="17" font-weight="700" fill="{INK}">'
            f'{esc(self.title)} &#8212; User Flowchart</text>',
            f'<text x="{PAD_L}" y="50" font-size="13" fill="{MUTED}">{stamp}</text>',
        ]
        if self._kinds_used:
            head.append(f'<text x="{PAD_L}" y="70" font-size="12" fill="{MUTED}">'
                        f'{esc(" · ".join(self._kinds_used))}</text>')
        desc = f'\n<desc>{esc(self.desc)}</desc>' if self.desc else ''
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.width:g}" height="{h}" '
                f'viewBox="0 0 {self.width:g} {h}" font-family="{FONT}" role="img">\n'
                f'<title>{esc(self.title)} &#8212; User Flowchart</title>{desc}\n'
                f'<defs>{defs}</defs>\n'
                f'<rect width="{self.width:g}" height="{h}" fill="#ffffff"/>\n'
                + '\n'.join(head) + f'\n\n<g transform="translate(0,{HEAD_H})">\n'
                + '\n'.join(self._body) + '\n</g>\n</svg>\n')

    def write(self, path):
        svg = self.render()
        with open(path, 'w', encoding='utf-8') as f:
            f.write(svg)
        for w in self.warnings:
            print(f'  ! {w}')
        return path


def _txt(x, y, t, size, fill, weight=None, anchor='middle'):
    w = f' font-weight="{weight}"' if weight else ''
    return (f'<text x="{x:g}" y="{y:g}" font-size="{size}"{w} fill="{fill}" '
            f'text-anchor="{anchor}">{esc(t)}</text>')


def _ports(a, b, side):
    if isinstance(side, (tuple, list)):
        return getattr(a, side[0]), getattr(b, side[1])
    if side == 'h':
        return (a.right, b.left) if b.cx > a.cx else (a.left, b.right)
    return (a.bottom, b.top) if b.cy > a.cy else (a.top, b.bottom)
