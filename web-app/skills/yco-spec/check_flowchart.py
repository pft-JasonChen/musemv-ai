#!/usr/bin/env python3
"""check_flowchart.py — geometric validator for `flowchart_lib` SVGs.

    python3 skills/yco-spec/check_flowchart.py <file-or-dir> [...]   # report
    python3 skills/yco-spec/check_flowchart.py --strict specs/       # exit 1 on findings

WHY THIS EXISTS
===============
`flowchart_lib` is a hand-placed layout engine: `node(x, y, …)` draws exactly
where it is told, `decision(cx, cy, …)` silently WIDENS itself to fit its text,
and `legend(y)` needs 20px of clear canvas per edge kind below it. None of
those can fail — the SVG is always well-formed — so a diagram whose boxes
overlap, whose labels sit on top of each other, or whose nodes are clipped off
the canvas builds green and ships. Three of them did.

Reading the generator does not catch it either, because the failure is in the
RENDERED result: text width depends on the font, and a diamond's width depends
on its own label. So this measures the real thing — it loads the SVG in
headless Chromium and reads `getBoundingClientRect()` off every element.

WHAT IT CHECKS
==============
  canvas    an element drawn outside the SVG's own width/height (clipped)
  overlap   two node shapes overlapping each other
  label     a free-standing label (edge label, note, section heading) sitting
            on top of a node — this is "文字壓到圖"
  overflow  text escaping the node it belongs to
  collide   two free labels overlapping each other
  legend    legend rows running past the bottom edge

WHAT IT DOES NOT CHECK
======================
Edge ROUTING. A connector line may still cross a node or another line; that is
a genuinely harder problem and, unlike a collision, a crossing line is usually
still readable. If crossings ever become the complaint, the answer is not a
better checker — it is automatic layout (Graphviz `dot`, or Mermaid, both of
which route edges themselves). That would replace `flowchart_lib` rather than
validate it, and it would cost the two things this programme depends on: the
version stamp `write_specs()` gates on, and step IDs drawn as plain text so the
inlined SVG is cross-reference-checked with the rest of the spec.
"""
import argparse
import asyncio
import glob
import json
import os
import re
import sys

os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")

# Overlaps below this many px² are ignored: touching borders, a 1.5px stroke
# shared between two adjacent boxes, and antialiasing all land here.
AREA_EPS = 12.0
# A label is "on" a node once this much of the LABEL's own area is covered.
LABEL_COVER = 0.12
# Text is allowed this much slack past its node's edge before it counts as
# overflowing — `flowchart_lib` pads nodes by 12px and text metrics vary.
TEXT_SLACK = 3.0


def chromium_path():
    env = os.environ.get("CHROMIUM_PATH")
    if env and os.path.exists(env):
        return env
    for pat in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome",
                "/opt/pw-browsers/chromium_headless_shell-*/"
                "chrome-headless-shell-linux64/chrome-headless-shell"):
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[-1]
    return None


def rects_overlap_area(a, b):
    w = min(a["right"], b["right"]) - max(a["left"], b["left"])
    h = min(a["bottom"], b["bottom"]) - max(a["top"], b["top"])
    return w * h if (w > 0 and h > 0) else 0.0


def area(r):
    return max(0.0, r["right"] - r["left"]) * max(0.0, r["bottom"] - r["top"])


def centre_inside(t, n):
    cx = (t["left"] + t["right"]) / 2
    cy = (t["top"] + t["bottom"]) / 2
    return n["left"] <= cx <= n["right"] and n["top"] <= cy <= n["bottom"]


MEASURE_JS = r"""
() => {
  const svg = document.querySelector('svg');
  const box = svg.getBoundingClientRect();
  const rel = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left - box.left, top: r.top - box.top,
             right: r.right - box.left, bottom: r.bottom - box.top };
  };
  const out = { width: box.width, height: box.height, nodes: [], texts: [] };
  // Node SHAPES: rounded boxes and decision diamonds. `line` elements are
  // edges and section rules; `path` elements are arrowheads.
  for (const el of svg.querySelectorAll('rect, polygon')) {
    const r = rel(el);
    if (r.right - r.left < 4 || r.bottom - r.top < 4) continue;  // hairlines
    // The full-canvas white background is a `<rect>` with NO stroke, and it
    // "overlaps" every node on the diagram. Real nodes always carry
    // `stroke="…" stroke-width="1.5"`, so the stroke is the discriminator —
    // not size, which would also drop a legitimately large node.
    const stroke = el.getAttribute('stroke');
    if (!stroke || stroke === 'none') continue;
    out.nodes.push({ ...r, tag: el.tagName.toLowerCase() });
  }
  for (const el of svg.querySelectorAll('text')) {
    const s = (el.textContent || '').trim();
    if (!s) continue;
    out.texts.push({ ...rel(el), text: s,
                     size: parseFloat(getComputedStyle(el).fontSize) || 0 });
  }
  return out;
}
"""


async def measure(path):
    from playwright.async_api import async_playwright
    svg = open(path, encoding="utf-8").read()
    m = re.search(r'<svg[^>]*width="(\d+)"[^>]*height="(\d+)"', svg)
    w, h = (int(m.group(1)), int(m.group(2))) if m else (1400, 3000)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path=chromium_path(),
                                     args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = await b.new_page(viewport={"width": w + 40, "height": min(h + 40, 4000)})
        await page.set_content(f'<body style="margin:0">{svg}</body>')
        await page.wait_for_timeout(250)
        data = await page.evaluate(MEASURE_JS)
        await b.close()
    data["declared"] = {"width": w, "height": h}
    return data


def analyse(name, d):
    """Return a list of (kind, message). Ordered worst-first."""
    W, H = d["declared"]["width"], d["declared"]["height"]
    nodes, texts = d["nodes"], d["texts"]
    findings = []

    def label_of(r):
        """The nearest text inside a node, for naming it in a message."""
        best = None
        for t in texts:
            if centre_inside(t, r) and (best is None or t["size"] > best["size"]):
                best = t
        return (best["text"][:44] if best else "(unlabelled)")

    # ── canvas ───────────────────────────────────────────────────────────────
    for r in nodes:
        if r["left"] < -0.5 or r["top"] < -0.5 or r["right"] > W + 0.5 or r["bottom"] > H + 0.5:
            findings.append(("canvas", f'node {label_of(r)!r} is clipped — '
                                       f'x {r["left"]:.0f}..{r["right"]:.0f}, '
                                       f'y {r["top"]:.0f}..{r["bottom"]:.0f} vs canvas {W}x{H}'))
    for t in texts:
        if t["left"] < -0.5 or t["top"] < -0.5 or t["right"] > W + 0.5 or t["bottom"] > H + 0.5:
            findings.append(("canvas", f'text {t["text"][:44]!r} is clipped — '
                                       f'x {t["left"]:.0f}..{t["right"]:.0f}, '
                                       f'y {t["top"]:.0f}..{t["bottom"]:.0f} vs canvas {W}x{H}'))

    # ── node ↔ node ──────────────────────────────────────────────────────────
    for i, a in enumerate(nodes):
        for b in nodes[i + 1:]:
            ov = rects_overlap_area(a, b)
            if ov > AREA_EPS:
                findings.append(("overlap", f'{label_of(a)!r} and {label_of(b)!r} overlap '
                                            f'by {ov:.0f}px²'))

    # ── classify text: owned by a node, or free-standing ─────────────────────
    owned, free = [], []
    for t in texts:
        host = next((n for n in nodes if centre_inside(t, n)), None)
        (owned if host else free).append((t, host))

    # ── text escaping its own node ───────────────────────────────────────────
    for t, host in owned:
        if (t["left"] < host["left"] - TEXT_SLACK or t["right"] > host["right"] + TEXT_SLACK
                or t["top"] < host["top"] - TEXT_SLACK or t["bottom"] > host["bottom"] + TEXT_SLACK):
            findings.append(("overflow", f'text {t["text"][:44]!r} escapes its node '
                                         f'{label_of(host)!r}'))

    # ── a free label sitting ON a node — this is 文字壓到圖 ──────────────────
    for t, _ in free:
        ta = area(t) or 1.0
        for n in nodes:
            cov = rects_overlap_area(t, n) / ta
            if cov > LABEL_COVER:
                findings.append(("label", f'label {t["text"][:44]!r} sits on node '
                                          f'{label_of(n)!r} ({cov * 100:.0f}% covered)'))
                break

    # ── two free labels on top of each other ─────────────────────────────────
    for i, (a, _) in enumerate(free):
        for b, _ in free[i + 1:]:
            ov = rects_overlap_area(a, b)
            if ov > AREA_EPS:
                findings.append(("collide", f'labels {a["text"][:30]!r} and '
                                            f'{b["text"][:30]!r} overlap by {ov:.0f}px²'))

    # ── legend / anything running off the bottom ─────────────────────────────
    lowest = max((t["bottom"] for t in texts), default=0)
    if lowest > H + 0.5:
        findings.append(("legend", f'content runs {lowest - H:.0f}px past the bottom edge '
                                   f'(canvas is {H}px tall)'))
    return findings


def collect(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            out += sorted(glob.glob(os.path.join(p, "**", "*.svg"), recursive=True))
        elif p.endswith(".svg"):
            out.append(p)
    return out


async def main_async(files, as_json):
    total, report = 0, {}
    for f in files:
        d = await measure(f)
        fs = analyse(f, d)
        report[f] = fs
        total += len(fs)
        if as_json:
            continue
        head = f"{os.path.relpath(f)}  ({d['declared']['width']}x{d['declared']['height']}, " \
               f"{len(d['nodes'])} shapes, {len(d['texts'])} texts)"
        if not fs:
            print(f"✅ {head}")
        else:
            print(f"❌ {head} — {len(fs)} finding(s)")
            seen = set()
            for kind, msg in fs:
                key = (kind, msg)
                if key in seen:
                    continue
                seen.add(key)
                print(f"     [{kind}] {msg}")
    if as_json:
        print(json.dumps({k: [{"kind": a, "msg": b} for a, b in v]
                          for k, v in report.items()}, indent=2))
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--strict", action="store_true", help="exit 1 if anything is found")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    files = collect(a.paths)
    if not files:
        print("no .svg files found", file=sys.stderr)
        return 2
    total = asyncio.run(main_async(files, a.json))
    if not a.json:
        print(f"\n{len(files)} diagram(s), {total} finding(s)")
    return 1 if (a.strict and total) else 0


if __name__ == "__main__":
    sys.exit(main())
