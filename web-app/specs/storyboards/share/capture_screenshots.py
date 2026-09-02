#!/usr/bin/env python3
"""Capture the Share (S9) screenshots AND measure every focus box.

Screenshot source: **live app capture**, not a static prototype — the same
convention every other spec in this programme follows. Every screenshot comes
from driving the real Next.js dev server on :3000 with Playwright.

VIEWPORT — D8 stands: desktop 1403x697 only, this repo's established capture
viewport.

TWO SESSIONS, AND THE FIRST ONE IS DELIBERATELY SIGNED OUT
==========================================================
  Session A (`main_recipient`) — NOT signed in, no `muse_auth` seed. That is
        the whole point of `/share`: it is public by design, reached by people
        with no account. Seeding auth would photograph a state a real
        recipient never sees. It walks P1..P4.
  Session B (`main_sender`) — SIGNED IN, for P5's `ShareDialog`, which is
        opened from a player screen rather than from `/share` (the dialog has
        not been used on `/share` since 2026-07-23).

WHAT THIS RUN MEASURED, BOTH RECORDED IN build_spec.py
======================================================
1. **The share page's MV DOES photograph, unlike `/watch`'s.** The same
   codec limit applies — `MediaError 4` on every mp4 in this browser — but
   `MvPanel` passes `poster={media.posterUrl}`, and a poster is exactly what a
   non-decoding browser paints. This is the attribute AGENTS.md recommends for
   any `<video>` whose first frame is the design, and the reason S8's `/watch`
   captures are blank while these are not.
2. **The MV panel carries NO title and NO creator; the song panel carries
   both.** Read off the live DOM rather than from the component's own header
   comment, which says "title/creator ... are back" without qualifying which
   panel. Area 10 says neither panel has them, which was true before the
   2026-08-24 redesign and is now wrong in both directions.

USAGE
    # dev server already running on :3000
    python3 capture_screenshots.py [--base http://localhost:3000]
    python3 build_spec.py
"""
import argparse
import asyncio
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/share
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from PIL import Image  # noqa: E402

DESKTOP = (1403, 697)


def chromium_path():
    """AGENTS.md's `CHROMIUM_PATH` escape hatch, resolved automatically — see
    the explore-community capture script's identical helper for why."""
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


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server. `seed_auth`
    defaults to FALSE here — the opposite of every other spec in this
    programme, because `/share`'s subject is an unauthenticated recipient."""

    def __init__(self, feature_dir, base_url, seed_auth=False, **kw):
        kw.setdefault("viewport", DESKTOP)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")
        self.seed_auth = seed_auth

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            executable_path=chromium_path(),
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1,
            # The share dialog's only action writes to the clipboard; without
            # this the write rejects and the "Copied!" confirmation never shows.
            permissions=["clipboard-read", "clipboard-write"])
        if self.seed_auth:
            await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        await ctx.add_init_script(
            "document.addEventListener('DOMContentLoaded', () => {"
            " const s = document.createElement('style');"
            " s.textContent = 'nextjs-portal{display:none!important}';"
            " document.head.appendChild(s);"
            "});"
        )
        self.page = await ctx.new_page()
        self.page.on("console", lambda m: self.errors.append(m.text)
                     if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        return self

    async def __aexit__(self, *a):
        self._server = None
        # MERGE — two `Capture` instances write this run's focus.json.
        if self.focus_map and os.path.exists(self.focus_path):
            with open(self.focus_path, encoding="utf-8") as f:
                existing = json.load(f)
            existing.update(self.focus_map)
            self.focus_map = existing
        return await super().__aexit__(*a)

    async def full_shot(self, name):
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=True)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}

    async def viewport_shot(self, name):
        """Reserved for any state with a `position: fixed` element — the More
        menu's backdrop and the share dialog's overlay."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=False)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}


async def js_click(page, selector):
    ok = await page.evaluate(
        "(sel) => { const el = document.querySelector(sel);"
        " if (el) { el.click(); return true; } return false; }", selector)
    if not ok:
        raise SystemExit(f"js_click: selector matched nothing: {selector}")


async def check(page, targets):
    for sel in targets:
        loc = page.locator(sel)
        n = await loc.count()
        if n == 0:
            raise SystemExit(f"focus selector matched nothing: {sel}")
        vis = await loc.filter(visible=True).count()
        if n > 1 and vis != 1:
            raise SystemExit(
                f"focus selector {sel} matched {n} elements ({vis} visible) -- narrow it")


def make_shoot(cap, page, full_page=True):
    async def shoot(name, targets=None, label=None, kind="action"):
        await page.wait_for_timeout(200)
        if targets:
            await check(page, targets)
        cb = await (cap.full_shot(name) if full_page else cap.viewport_shot(name))
        if targets:
            await cap.focus(name, cb, targets, label, kind=kind)
            x, y, w, h = cap.focus_map[name][-1]["box"]
            if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                    and x + w <= 101 and y + h <= 101):
                raise SystemExit(
                    f"{name}: focus box {[x, y, w, h]} is outside its own screenshot")
    return shoot


async def multi_focus(cap, page, name, frames, full_page=True):
    await page.wait_for_timeout(200)
    for targets, _label, _kind in frames:
        await check(page, targets)
    cb = await (cap.full_shot(name) if full_page else cap.viewport_shot(name))
    for targets, label, kind in frames:
        await cap.focus(name, cb, targets, label, kind=kind)
        x, y, w, h = cap.focus_map[name][-1]["box"]
        if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                and x + w <= 101 and y + h <= 101):
            raise SystemExit(
                f"{name}: focus box {[x, y, w, h]} is outside its own screenshot")


async def freeze_media(page):
    await page.evaluate(
        """() => { for (const m of document.querySelectorAll('video, audio')) {
             try { m.pause(); m.currentTime = 0; } catch {} } }""")
    await page.wait_for_timeout(120)


async def assert_bare(page):
    """Every /share screen renders with NO app chrome (area 01's SHELL rule).
    Asserted on every state rather than photographed once, because the whole
    claim is that it holds for all of them."""
    chrome = await page.evaluate(
        """() => [...document.querySelectorAll(
             '.sidebar, .mobile-tabbar, .mobile-header, .detail-navbar, .room-navbar, .navbar')]
             .filter(e => e.offsetParent !== null || e.getClientRects().length).length""")
    if chrome:
        raise SystemExit(f"/share rendered {chrome} piece(s) of app chrome — it must be bare")


# ── Session A: an unauthenticated recipient — P1..P4 ────────────────────────
async def main_recipient(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        fixed = make_shoot(cap, page, full_page=False)

        # ══ P1 — a valid MV link ════════════════════════════════════════════
        await page.goto(f"{base}/share?id=mv-cinematic-dark", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        await assert_bare(page)
        meta = await page.evaluate(
            """() => ({ title: !!document.querySelector('.share-mv__title'),
                        creator: !!document.querySelector('.share-mv__creator'),
                        poster: !!(document.querySelector('.share-mv__video') || {}).poster,
                        pills: [...document.querySelectorAll('.share-page__pill')]
                                 .map(e => e.textContent.trim()) })""")
        print("   MV panel:", meta)
        if meta["title"] or meta["creator"]:
            raise SystemExit("the MV panel grew a title/creator — area 10 and this spec disagree")
        if not meta["poster"]:
            raise SystemExit("the share video lost its poster; these captures depend on it")
        if meta["pills"] != ["Download", "Try YouCam Muse"]:
            raise SystemExit(f"unexpected MV action pills: {meta['pills']}")
        await multi_focus(cap, page, "01_mv_valid_link.png", [
            ([".share-page__header"], "Logo header — the only way home", "info"),
            ([".share-mv"], "The media, and nothing identifying it", "info"),
        ])

        await shoot("02_mv_controller.png", [".share-mv__controller"],
                    "Play/pause, elapsed / total, seek, mute, fullscreen, More", kind="info")

        await multi_focus(cap, page, "03_mv_actions.png", [
            (['.share-page__pill--dark'], "Download — saves the file", "action"),
            (['.share-page__pill--gradient-mv'], "Neutral label, and it goes to the home page", "action"),
        ])

        # Resolution: a static History sample resolves like a community item.
        await page.goto(f"{base}/share?id=h-cinematic-night", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        await assert_bare(page)
        if await page.locator(".share-mv").count() != 1:
            raise SystemExit("a static History sample id did not resolve to a media panel")
        await shoot("04_mv_history_sample.png", [".share-mv__video"],
                    "A History sample resolves in a fresh session, like a community item",
                    kind="info")

        # ══ P2 — the MV controller's More menu ══════════════════════════════
        await page.goto(f"{base}/share?id=mv-cinematic-dark", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        # Scroll to the bottom FIRST. The menu is `position: absolute` and opens
        # UPWARD from the controller, but the controller sits near the bottom of
        # a 1010px page in a 697px viewport, so at scroll 0 the menu's own top
        # edge is still below the fold.
        await page.evaluate("() => window.scrollTo(0, document.documentElement.scrollHeight)")
        await page.wait_for_timeout(400)
        await js_click(page, '.share-mv__controller [aria-label="More"]')
        await page.wait_for_selector(".share-mv__menu", state="visible", timeout=5000)
        await page.wait_for_timeout(400)
        items = await page.evaluate(
            """() => [...document.querySelectorAll('.share-mv__menu-item')]
                 .map(e => e.textContent.trim())""")
        print("   More menu:", items)
        if len(items) != 3:
            raise SystemExit(f"expected three More items, got {items}")
        await fixed("05_mv_more_menu.png", [".share-mv__menu"],
                    "Download, Playback Speed, Picture in Picture")

        # Playback Speed CYCLES and the menu stays open for repeated presses.
        rates = []
        for _ in range(3):
            await js_click(page, '.share-mv__menu-item:nth-of-type(2)')
            await page.wait_for_timeout(250)
            rates.append(await page.evaluate(
                "() => (document.querySelector('.share-mv__menu-item-value') || {}).textContent"))
            if not await page.locator(".share-mv__menu").count():
                raise SystemExit("the menu closed on a Playback Speed press — it must stay open")
        actual = await page.evaluate(
            "() => (document.querySelector('.share-mv__video') || {}).playbackRate")
        print(f"   speed cycled through {rates}; element playbackRate now {actual}")
        if len(set(rates)) != 3:
            raise SystemExit(f"Playback Speed did not cycle: {rates}")
        await fixed("06_mv_playback_speed.png", [".share-mv__menu-item-value"],
                    "The rate cycles on each press; the menu stays open")

        # ══ P3 — a valid song link ══════════════════════════════════════════
        await page.goto(f"{base}/share?id=sp-pop-anthem", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        await assert_bare(page)
        song = await page.evaluate(
            """() => ({ title: (document.querySelector('.share-song__title') || {}).textContent,
                        creator: (document.querySelector('.share-song__creator-name') || {}).textContent,
                        pills: [...document.querySelectorAll('.share-page__pill')]
                                 .map(e => e.textContent.trim()) })""")
        print("   song panel:", song)
        if song["title"] != "Pop Anthem" or not song["creator"]:
            raise SystemExit(f"the song panel lost its title/creator: {song}")
        if song["pills"] != ["Download", "Try YouCam Muse"]:
            raise SystemExit(f"unexpected song action pills: {song['pills']}")
        await multi_focus(cap, page, "07_song_valid_link.png", [
            ([".share-song__art"], "Cover art", "info"),
            ([".share-song__meta"], "Title and creator — the MV panel has neither", "info"),
        ])

        await shoot("08_song_controller.png", [".share-song__controller"],
                    "Play/pause, elapsed / total, seek, mute, download", kind="info")

        await multi_focus(cap, page, "09_song_actions.png", [
            (['.share-page__pill--dark'], "Download — saves the audio", "action"),
            (['.share-page__pill--gradient-song'], "The same label; only the gradient differs by kind", "action"),
        ])

        # ══ P4 — the unavailable state ══════════════════════════════════════
        await page.goto(f"{base}/share?id=this-id-does-not-exist", wait_until="networkidle")
        await page.wait_for_timeout(900)
        await assert_bare(page)
        await multi_focus(cap, page, "10_unavailable_bad_id.png", [
            ([".share-page__expired-title"], "The unavailable state", "info"),
            ([".share-page__logo-link"], "The header logo is the only way out", "action"),
        ])

        await page.goto(f"{base}/share", wait_until="networkidle")
        await page.wait_for_timeout(900)
        await assert_bare(page)
        if not await page.locator(".share-page__expired").count():
            raise SystemExit("/share with no id did not render the unavailable state")
        await shoot("11_unavailable_no_id.png", [".share-page__expired"],
                    "No id at all lands in the same state", kind="info")

        await page.goto(f"{base}/share?type=expired", wait_until="networkidle")
        await page.wait_for_timeout(900)
        await assert_bare(page)
        if not await page.locator(".share-page__expired").count():
            raise SystemExit("?type=expired did not force the unavailable state")
        await shoot("12_unavailable_forced.png", [".share-page__expired"],
                    "The QA switch reaches the same state on a resolvable id", kind="info")

        print("Session A console errors:", cap.errors or "none")


# ── Session B: signed in — P5, the legacy URL and the share dialog ──────────
async def main_sender(base):
    async with NextCapture(HERE, base, seed_auth=True) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        fixed = make_shoot(cap, page, full_page=False)

        # The legacy MV share URL redirects on the server.
        await page.goto(f"{base}/share/mv/mv-cinematic-dark", wait_until="networkidle")
        await page.wait_for_timeout(1200)
        await freeze_media(page)
        print("   legacy URL landed on:", page.url)
        if not page.url.endswith("/share?id=mv-cinematic-dark"):
            raise SystemExit(f"legacy URL did not redirect as expected: {page.url}")
        await assert_bare(page)
        await shoot("13_legacy_url_redirect.png", [".share-mv"],
                    "The legacy path lands on the canonical one, same media", kind="info")

        # The dialog that MINTS these links. S8 captured the entry points.
        await page.goto(f"{base}/watch?id=mv-cinematic-dark", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await freeze_media(page)
        await js_click(page, '.mv-player__like-share [aria-label="Share"]')
        await page.wait_for_selector('input[aria-label="Share link"]', timeout=6000)
        await page.wait_for_timeout(500)
        url = await page.locator('input[aria-label="Share link"]').input_value()
        buttons = await page.evaluate(
            """() => [...document.querySelectorAll('[role="dialog"] button, .modal button')]
                 .map(e => e.textContent.trim()).filter(Boolean)""")
        print("   dialog link:", url, "| buttons:", buttons)
        if "/share?id=" not in url:
            raise SystemExit(f"the dialog did not offer a /share link: {url}")
        await fixed("14_share_dialog.png", ['input[aria-label="Share link"]'],
                    "The link is the /share URL this whole spec is about")

        # By text, not by selector: `js_click` goes through `document.querySelector`,
        # which does not implement Playwright's `:has-text()`.
        clicked = await page.evaluate(
            """() => { const b = [...document.querySelectorAll('button')]
                 .find(e => e.textContent.trim() === 'Copy');
                 if (b) { b.click(); return true; } return false; }""")
        if not clicked:
            raise SystemExit("the share dialog had no Copy button")
        await page.wait_for_timeout(500)
        label = await page.evaluate(
            """() => { const b = [...document.querySelectorAll('button')]
                 .find(e => /^(Copy|Copied!)$/.test(e.textContent.trim()));
                 return b ? b.textContent.trim() : null; }""")
        print("   copy button now reads:", label)
        if label != "Copied!":
            raise SystemExit(f"Copy did not confirm (button reads {label!r})")
        clip = await page.evaluate("() => navigator.clipboard.readText()")
        if clip != url:
            raise SystemExit(f"the clipboard holds {clip!r}, not the offered link")
        await fixed("15_share_dialog_copied.png",
                    ['button:has-text("Copied!")'],
                    "Confirms for 1.5 seconds, then reverts")

        print("Session B console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--only", default="", help="comma-separated: recipient,sender")
    args = ap.parse_args()
    only = [s for s in args.only.split(",") if s]
    runs = {"recipient": main_recipient, "sender": main_sender}
    for key, fn in runs.items():
        if only and key not in only:
            continue
        print(f"\n═══ session: {key} ═══")
        asyncio.run(fn(args.base))
