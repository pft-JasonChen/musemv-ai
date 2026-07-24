#!/usr/bin/env python3
"""capture_lib.py — shared Playwright capture harness for spec screenshots.

One canonical implementation of everything the per-feature
`Project/<feature>/capture_screenshots.py` scripts used to copy-paste:
env/browser bootstrap, the ARM64-Linux libXdamage stub, the throwaway
http.server, element screenshots, focus-box measurement, focus.json output,
and console-error collection.

Feature scripts keep ONLY their flow logic:

    import os, sys, asyncio
    HERE = os.path.dirname(os.path.abspath(__file__))
    ROOT = os.path.dirname(os.path.dirname(HERE))
    sys.path.insert(0, os.path.join(ROOT, 'skills', 'yco-spec'))
    from capture_lib import Capture

    async def main():
        async with Capture(HERE, 'prototypes/<feature>/<variant>/index.html') as cap:
            page = cap.page
            ...drive the prototype...
            cb = await cap.shot('01_intro.png', '#panel')
            await cap.focus('01_intro.png', cb, ['.canned-list'], 'Popular questions')
        # focus.json + console-error report are written on exit

    asyncio.run(main())

Design notes:
- The port is chosen automatically from the free ephemeral range — feature
  scripts must NOT hardcode ports (drifted 9914/9912/9913/9001 in the old copies).
- `focus()` preserves the `type` ('action' | 'info') so `spec_builder`'s
  focus.json override keeps amber info-frames amber.
- Box percentages are measured against the captured container box, the same
  coordinate space as the element screenshot — matching spec_builder's contract.
"""
import asyncio
import json
import os
import socket
import subprocess
import time
from pathlib import Path

_HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(_HERE))

# Browser cache must be set BEFORE importing playwright.
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH',
                      os.path.join(ROOT, '.tools', 'ms-playwright'))

# ── ARM64 Linux sandbox workaround: stub libXdamage.so.1 if missing ──────────
_STUB_SRC = '''\
typedef unsigned long XID;
typedef void* Display;
typedef XID Damage;
typedef XID Drawable;
typedef int Bool;
Damage XDamageCreate(Display *d, Drawable drawable, int level) { return 0; }
void   XDamageDestroy(Display *d, Damage damage) {}
Bool   XDamageQueryExtension(Display *d, int *ev, int *er) { return 0; }
void   XDamageSubtract(Display *d, Damage damage, void *r, void *p) {}
'''


def ensure_xdamage_stub():
    if os.uname().sysname != 'Linux':
        return
    import ctypes.util
    if ctypes.util.find_library('Xdamage'):
        return
    stub = Path('/tmp/libXdamage.so.1')
    if not stub.exists():
        src = Path('/tmp/_xdamage_stub.c')
        src.write_text(_STUB_SRC)
        subprocess.run(['gcc', '-shared', '-fPIC', '-o', str(stub), str(src),
                        '-nostdlib'], check=True, capture_output=True)
    lp = os.environ.get('LD_LIBRARY_PATH', '')
    if '/tmp' not in lp.split(':'):
        os.environ['LD_LIBRARY_PATH'] = '/tmp:' + lp if lp else '/tmp'


ensure_xdamage_stub()
from playwright.async_api import async_playwright  # noqa: E402


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class Capture:
    """Async context manager owning server + browser + focus map for one run."""

    def __init__(self, feature_dir, base_path, viewport=(1440, 900),
                 shots_subdir=os.path.join('specs', 'screenshots'),
                 settle_ms=1500):
        self.feature_dir = feature_dir
        self.base_path = base_path.lstrip('/')
        self.viewport = {'width': viewport[0], 'height': viewport[1]}
        self.save_dir = os.path.join(feature_dir, shots_subdir)
        self.focus_path = os.path.join(feature_dir, 'specs', 'focus.json')
        self.settle_ms = settle_ms
        self.port = free_port()
        self.base_url = f'http://localhost:{self.port}/{self.base_path}'
        self.focus_map = {}
        self.errors = []
        self._server = None
        self._pw = None
        self._browser = None
        self.page = None

    # ── lifecycle ────────────────────────────────────────────────────────────
    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._server = subprocess.Popen(
            ['python3', '-m', 'http.server', str(self.port)], cwd=ROOT,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        deadline = time.time() + 15
        while time.time() < deadline:
            try:
                with socket.create_connection(('127.0.0.1', self.port), timeout=1):
                    break
            except OSError:
                time.sleep(0.2)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            channel='chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
        self.page = await self._browser.new_page(viewport=self.viewport)
        self.page.on('console',
                     lambda m: self.errors.append(m.text) if m.type == 'error' else None)
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        await self.page.goto(self.base_url)
        await self.page.wait_for_timeout(self.settle_ms)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        try:
            if self._browser:
                await self._browser.close()
            if self._pw:
                await self._pw.stop()
        finally:
            if self._server:
                self._server.terminate()
        if self.focus_map:
            os.makedirs(os.path.dirname(self.focus_path), exist_ok=True)
            with open(self.focus_path, 'w', encoding='utf-8') as f:
                json.dump(self.focus_map, f, indent=2)
            print('focus map ->', self.focus_path)
        print('screenshots ->', self.save_dir)
        print('console errors:', self.errors if self.errors else 'none')
        return False

    # ── capture primitives ───────────────────────────────────────────────────
    async def box(self, selector):
        el = await self.page.query_selector(selector)
        return (await el.bounding_box()) if el else None

    def full_page_box(self):
        return {'x': 0, 'y': 0,
                'width': self.viewport['width'], 'height': self.viewport['height']}

    async def shot(self, name, selector=None, clip=None):
        """Element screenshot (or clipped page shot). Returns the container box
        that `focus()` measurements must be relative to."""
        path = os.path.join(self.save_dir, name)
        if selector:
            el = await self.page.query_selector(selector)
            if el:
                try:
                    await el.scroll_into_view_if_needed()
                except Exception:  # noqa: BLE001 — best-effort scroll
                    pass
                await self.page.wait_for_timeout(150)
                await el.screenshot(path=path)
                print('  +', name)
                return await el.bounding_box()
        cb = clip or self.full_page_box()
        await self.page.screenshot(path=path, clip=cb)
        print('  +', name)
        return cb

    async def focus(self, name, container_box, targets, label, kind='action'):
        """Measure the union of `targets` as % of `container_box` and record it
        for focus.json. kind: 'action' (solid red) | 'info' (dashed amber)."""
        xs, ys, xe, ye = [], [], [], []
        for sel in targets:
            b = await self.box(sel)
            if not b:
                continue
            xs.append(b['x']); ys.append(b['y'])
            xe.append(b['x'] + b['width']); ye.append(b['y'] + b['height'])
        if not xs:
            print('    ! focus target not found for', name, targets)
            return
        cb = container_box
        x0, y0, x1, y1 = min(xs), min(ys), max(xe), max(ye)
        box = [round((x0 - cb['x']) / cb['width'] * 100, 1),
               round((y0 - cb['y']) / cb['height'] * 100, 1),
               round((x1 - x0) / cb['width'] * 100, 1),
               round((y1 - y0) / cb['height'] * 100, 1)]
        entry = {'box': box, 'type': kind, 'label': label}
        self.focus_map.setdefault(name, []).append(entry)
        print('    []', name, kind, box)

    # ── common page helpers (were re-implemented per feature) ────────────────
    async def scroll(self, selector, to='bottom'):
        await self.page.evaluate(
            "([sel, y]) => { const b = document.querySelector(sel);"
            " if (b) b.scrollTop = y; }",
            [selector, 0 if to == 'top' else 999999])
        await self.page.wait_for_timeout(200)

    async def js_click(self, selector):
        await self.page.evaluate(
            "(sel) => { const b = document.querySelector(sel); if (b) b.click(); }",
            selector)
