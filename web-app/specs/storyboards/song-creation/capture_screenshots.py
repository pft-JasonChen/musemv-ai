#!/usr/bin/env python3
"""Capture the /song/create screenshots AND measure every focus box.

WHY THIS FILE EXISTS (2026-08-27)
    The first two rounds of captures were ad hoc and the `focus` boxes in
    `build_spec.py` were hand-estimated percentages. Several missed their
    control badly — P1-S5's "Create Song" frame landed in the middle of the
    textarea, P2-S2's "Supported languages" frame landed on the Simple tab.
    `skills/yco-spec/references/screenshots.md` says why, and says not to:

        "Measure focus boxes while capturing... This is the only reliable way to
         make the red box match the screenshot exactly — never hand-tune
         percentages for a final spec."

    So this fixes the CAUSE, not the seven numbers. Each state is shot and
    measured in the same breath; `spec_builder._apply_focus_map` then overrides
    the manual values from `specs/focus.json`. The manual `focus` entries stay in
    `build_spec.py` as the offline fallback the schema intends.

ONE SHOT PER FRAME — A HARD CONSTRAINT, NOT A STYLE CHOICE
    `focus.json` is keyed by SHOT FILENAME and `_apply_focus_map` writes the
    entry onto *every* step using that shot. Three steps used to share a
    screenshot with a *different* frame each (P1-S2/P1-S5 on `02`, P2-S4/P2-S9
    on `07`, P3-S1/P3-S2 on `10`), which that structure simply cannot express —
    both steps would get the same box. Hence shots 30/31/32: each action step
    owns its own capture. Do not re-merge them.

ONE DEVIATION FROM THE SHARED HARNESS
    `capture_lib.Capture` spins up a throwaway `python3 -m http.server` for a
    STATIC prototype. This feature's subject is the Next.js app, so
    `NextCapture` overrides only the lifecycle: no static server, and the page
    is pointed at an already-running dev server. Everything else — `shot()`,
    `focus()`, focus.json output, review WebPs, console-error collection — is
    the shared lib, untouched.

USAGE
    npm run dev                        # in another terminal
    python3 capture_screenshots.py [--base http://localhost:3000]
    python3 build_spec.py

VIEWPORT
    1403x697 — matches the screenshots already committed. Changing it silently
    invalidates every measurement, since focus boxes are percentages of the
    captured container.
"""
import argparse
import asyncio
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

# `capture_lib` points PLAYWRIGHT_BROWSERS_PATH at an in-repo `.tools/` cache so
# a static prototype downloads its browser once. This repo already has the exact
# build in the shared cache `npm run e2e` uses, so reuse that rather than pull a
# second ~150 MB copy into the tree. `setdefault` there is what lets setting the
# variable BEFORE the import win.
_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

VIEWPORT = (1403, 697)

SIMPLE_IDEA = (
    "Modern J-Pop, racing through a bright city at dawn, fast driving pop rhythm, "
    "bittersweet cinematic energy"
)
FAIL_IDEA = "A glitchy synthwave night drive that falls apart halfway through [fail]"
LYRICS = """[Verse]
Headlights cutting through the dark
Your voice still echoes where you left your mark
I'm holding onto everything we said

[Chorus]
And if the night forgets my name
I'll still remember how you stayed"""

BOX = ".song-create__textarea"
ENHANCE = ".song-create__enhance-btn"
# `:visible` is load-bearing. `FloatingCTA` renders a HIDDEN measuring copy of
# the CTA as well as the real one (visibility:hidden, 173px lower, below the
# fold), and `capture_lib.box()` uses `query_selector`, which takes the FIRST
# match. Without the filter the frame measured 109.5% — off the bottom of its
# own screenshot. Playwright counts `visibility:hidden` as not visible.
CTA = ".song-create__cta:visible"
IDEA_BTN = ".song-create__idea-btn"
INFO_BTN = ".song-create__info-btn"
TOOLTIP = ".song-create__tooltip"
CUSTOM_TAB = ".tabs__tab:nth-child(2)"


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server.

    Overrides the lifecycle only: the base class would start a static file
    server and navigate into the repo, but here the app IS the server.
    """

    def __init__(self, feature_dir, base_url, **kw):
        # The viewport MUST reach the base class: `full_page_box()` — the
        # container every focus box is a percentage of — is built from
        # `self.viewport`, and it defaults to 1440x900. Omitting it here
        # measured against 1440x900 while the browser ran at 1403x697, so every
        # box came out scaled and the frames missed their controls. That was the
        # original defect in this file; do not drop the argument again.
        kw.setdefault("viewport", VIEWPORT)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
        # `/song/create` is guest-reachable, but the credit pill and the
        # My Creations rail are not — every committed shot is a signed-in one.
        await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        self.page = await ctx.new_page()
        self.page.on("console", lambda m: self.errors.append(m.text)
                     if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        return self

    async def __aexit__(self, *a):
        self._server = None          # nothing to terminate
        return await super().__aexit__(*a)


async def main(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page

        async def go(path):
            await page.goto(f"{base}{path}", wait_until="networkidle")
            await page.wait_for_timeout(700)

        async def custom():
            await go("/song/create")
            await page.click(CUSTOM_TAB)
            await page.wait_for_timeout(400)

        async def check(targets):
            """Fail loudly on the two ways a focus selector silently lies:
            matching nothing, or matching a hidden/duplicate element. Both
            produce a frame in the wrong place rather than an error, which is
            exactly how the boxes this script replaces went wrong."""
            for sel in targets:
                n = await page.locator(sel).count()
                if n == 0:
                    raise SystemExit(f"focus selector matched nothing: {sel}")
                vis = await page.locator(sel).filter(visible=True).count() \
                    if hasattr(page.locator(sel), "filter") else n
                if n > 1 and vis != 1:
                    raise SystemExit(
                        f"focus selector {sel} matched {n} elements "
                        f"({vis} visible) — narrow it, or the frame lands on "
                        f"whichever the DOM happens to order first")

        async def shoot(name, targets=None, label=None, kind="action"):
            await page.wait_for_timeout(250)
            if targets:
                await check(targets)
            cb = await cap.shot(name)
            if targets:
                await cap.focus(name, cb, targets, label, kind=kind)
                got = cap.focus_map[name][-1]["box"]
                x, y, w, h = got
                if not (0 <= x < 100 and 0 <= y < 100
                        and 0 < w <= 100 and 0 < h <= 100
                        and x + w <= 101 and y + h <= 101):
                    raise SystemExit(
                        f"{name}: focus box {got} is outside its own "
                        f"screenshot — the frame would miss the control")

        # ── P1 · Simple ──────────────────────────────────────────────────────
        await go("/song/create")
        await page.fill(BOX, SIMPLE_IDEA)
        await shoot("02_simple_idea_filled.png", [IDEA_BTN], "Idea")
        await shoot("16_simple_enhance.png")
        await shoot("30_simple_create_song.png", [CTA], "Create Song")

        # ── P2-S1 · the Custom tab control ───────────────────────────────────
        await custom()
        await shoot("06_custom_empty.png", [CUSTOM_TAB], "Custom tab")

        # ── P2-S2 · Supported languages popover (amber info frame) ───────────
        await page.click(INFO_BTN)
        await page.wait_for_selector(TOOLTIP, state="visible")
        await shoot("18_custom_supported_languages.png", [INFO_BTN, TOOLTIP],
                    "Supported languages", kind="info")

        # ── P2-S3 · Instrumental ON with an empty box ────────────────────────
        await custom()
        await page.get_by_role("switch", name="Instrumental").first.click()
        await shoot("21_custom_instrumental_placeholder.png")

        # ── P2-S4 · the Lyrics sample fill ───────────────────────────────────
        await custom()
        await page.fill(BOX, LYRICS)
        await shoot("07_custom_lyrics_filled.png",
                    ["button:has-text('Lyrics')"], "Lyrics")

        # ── P2-S5 · Instrumental ON keeps the text ───────────────────────────
        await page.get_by_role("switch", name="Instrumental").first.click()
        await shoot("22_custom_instrumental_keeps_lyrics.png")

        # ── P2-S6 · Instrumental ON, Enhance runs Refine Idea directly ───────
        await page.click(ENHANCE)
        await page.wait_for_function(
            "orig => document.querySelector('.song-create__textarea').value !== orig",
            arg=LYRICS, timeout=15000)
        await shoot("28_custom_instrumental_enhance.png")

        # ── P2-S8 · Instrumental OFF, the direction chooser ──────────────────
        # The dialog scales 0.96 -> 1 and fades over 300ms; never photograph it
        # mid-transition (AGENTS.md: "never measure a DP overlay while it is
        # still animating in"). Wait for the overlay to actually read opacity 1.
        await custom()
        await page.fill(BOX, LYRICS)
        await page.click(ENHANCE)
        await page.wait_for_selector(".enhance-dialog", state="visible")
        await page.wait_for_function(
            "() => getComputedStyle(document.querySelector"
            "('.enhance-dialog-overlay')).opacity === '1'", timeout=5000)
        await page.wait_for_timeout(200)
        await shoot("20_custom_enhance_menu.png")

        # ── P2-S9 · Create Song (Custom) ─────────────────────────────────────
        await custom()
        await page.fill(BOX, LYRICS)
        await shoot("31_custom_create_song.png", [CTA], "Create Song")

        # ── P3 · the [fail] path ─────────────────────────────────────────────
        await go("/song/create")
        await page.fill(BOX, FAIL_IDEA)
        await shoot("10_error_trigger.png")
        await shoot("32_error_create_song.png", [CTA], "Create Song")

        print("console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    asyncio.run(main(ap.parse_args().base))
