#!/usr/bin/env python3
"""Capture the /history screenshots AND measure every focus box.

Screenshot source: **live app capture**, not a static prototype — same
convention as `song-creation/capture_screenshots.py` (S1), which this file
copies the pattern of almost exactly. `NextCapture` there is reused verbatim
in spirit: drive the already-running Next dev server with Playwright, no
throwaway static file server.

ONE REAL DEVIATION FROM S1's SCRIPT: full-page shots, not viewport clips.
    S1's `cap.shot(name)` with no selector takes a CLIPPED shot of exactly the
    viewport rectangle (`Capture.full_page_box()` — a misleading name; it is
    the viewport, not the document). That was fine for a single compose form
    that fits in 697px. `/history`'s 7-row seed grid does not: the "All"
    filter's full grid measures ~746px tall at this viewport width, 49px
    taller than the clip. A plain viewport shot would silently crop the
    bottom row and nobody would notice from the PNG alone. `full_shot()`
    below uses `page.screenshot(full_page=True)` instead, then re-opens the
    saved PNG with Pillow to read its REAL pixel dimensions and uses those
    (not `document.scrollHeight`, which can disagree by a few px) as the
    focus-box container. Every menu-open capture below is still arranged to
    use a filter where the target row is the top (only) row, so no
    `position: fixed` menu ever risks landing outside the shot regardless.

VIEWPORT
    1403x697 — matches every other screenshot in this repo's storyboard
    specs (song-creation). Do not change it; every focus box is a percentage
    of the captured container, so a different viewport invalidates them all.

USAGE
    npm run dev -- -p 3220        # in another terminal (this repo's own port)
    python3 capture_screenshots.py [--base http://localhost:3220]
    python3 build_spec.py
"""
import argparse
import asyncio
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from PIL import Image  # noqa: E402

VIEWPORT = (1403, 697)


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server — see
    song-creation/capture_screenshots.py's identical class for why this
    overrides only the lifecycle, not `shot()`/`focus()`."""

    def __init__(self, feature_dir, base_url, **kw):
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
        await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        self.page = await ctx.new_page()
        self.page.on("console", lambda m: self.errors.append(m.text)
                     if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        return self

    async def __aexit__(self, *a):
        self._server = None
        return await super().__aexit__(*a)

    async def full_shot(self, name):
        """Full-page PNG; returns the container box `focus()` needs, read
        back from the SAVED FILE's real pixel size (see module docstring)."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=True)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}


def card_sel(title, state=None):
    """A `.history-card` containing `title`'s exact text, disambiguated by
    state class when two rows share a title (both "Midnight Drive" rows)."""
    cls = f".history-card--{state}" if state else ".history-card"
    return f'{cls}:has-text("{title}")'


async def main(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page

        async def go(path="/history"):
            await page.goto(f"{base}{path}", wait_until="networkidle")
            await page.wait_for_timeout(700)

        async def click_filter(label):
            await page.get_by_role("button", name=label, exact=True).click()
            await page.wait_for_timeout(350)

        async def open_menu(title, state=None):
            btn = page.locator(card_sel(title, state) + " .history-card__more")
            await btn.click()
            await page.wait_for_selector(".history-card__menu--visible", state="visible")
            # `.history-card__menu` fades 0.2s (HistoryView.tsx) — never
            # measure/shoot mid-transition (AGENTS.md).
            await page.wait_for_function(
                "() => { const m = document.querySelector('.history-card__menu--visible');"
                " return m && getComputedStyle(m).opacity === '1'; }", timeout=3000)
            await page.wait_for_timeout(150)
            return page.locator(".history-card__menu--visible")

        async def check(targets):
            """Fail loudly on a focus selector matching nothing, or matching
            a hidden/ambiguous duplicate — see song-creation's identical
            helper and its docstring for why this exists."""
            for sel in targets:
                loc = page.locator(sel) if isinstance(sel, str) else sel
                n = await loc.count()
                if n == 0:
                    raise SystemExit(f"focus selector matched nothing: {sel}")
                vis = await loc.filter(visible=True).count()
                if n > 1 and vis != 1:
                    raise SystemExit(
                        f"focus selector {sel} matched {n} elements "
                        f"({vis} visible) — narrow it")

        async def shoot(name, targets=None, label=None, kind="action"):
            await page.wait_for_timeout(200)
            if targets:
                await check(targets)
            cb = await cap.full_shot(name)
            if targets:
                sels = [t if isinstance(t, str) else t for t in targets]
                # capture_lib.focus() takes selector strings via page.query_selector,
                # which can't resolve a Locator — so resolve locators to a stable
                # attribute-free CSS path is not possible generically; instead we
                # pass plain selector strings everywhere below (no Locators here).
                await cap.focus(name, cb, sels, label, kind=kind)
                got = cap.focus_map[name][-1]["box"]
                x, y, w, h = got
                if not (0 <= x < 100 and 0 <= y < 100
                        and 0 < w <= 100 and 0 < h <= 100
                        and x + w <= 101 and y + h <= 101):
                    raise SystemExit(
                        f"{name}: focus box {got} is outside its own "
                        f"screenshot — the frame would miss the control")

        MORE = " .history-card__more"

        # ── P1 · Browse & filter ─────────────────────────────────────────
        await go()
        await shoot("01_all_filter.png")

        await click_filter("Music Videos")
        await shoot("02_mv_filter.png", ['button:has-text("Music Videos")'], "Music Videos")

        await click_filter("Songs")
        await shoot("03_songs_filter.png", ['button:has-text("Songs")'], "Songs")

        await click_filter("Liked")
        await shoot("04_liked_filter.png", ['button:has-text("Liked")'], "Liked")

        # Unlike the one community-liked seed row — the cheapest way to empty
        # a filter (1 click; community rows have no Delete option at all, see
        # the Menu net-per-type table, so "delete-to-empty" is not literally
        # available here — Unlike is the real mechanism).
        menu = await open_menu("Whispers of the Past")
        await menu.get_by_role("menuitem", name="Unlike", exact=True).click()
        await page.wait_for_timeout(300)
        await shoot("05_liked_empty.png")

        # ── P2 · Open a creation ─────────────────────────────────────────
        await go()
        await page.locator(card_sel("Cinematic Night") + " a.history-card__cover").click()
        await page.wait_for_url("**/mv/result**")
        await page.wait_for_timeout(600)
        await shoot("06_open_done_mv.png")

        await go()
        await page.locator(card_sel("Golden Hour") + " a.history-card__cover").click()
        await page.wait_for_url("**/song/result**")
        await page.wait_for_timeout(600)
        await shoot("07_open_done_song.png")

        await go()
        await page.locator(card_sel("Starlight in Your Eyes") + " a.history-card__cover").click()
        await page.wait_for_url("**/mv/storyboard**")
        await page.wait_for_timeout(600)
        await shoot("08_open_storyboard.png")

        await go()
        await click_filter("Liked")
        await page.locator(card_sel("Whispers of the Past") + " a.history-card__cover").click()
        await page.wait_for_url("**/song/play**")
        await page.wait_for_timeout(600)
        await shoot("09_open_community.png")

        # P2-S5 (processing row is inert) is asserted, not screenshotted — it
        # reuses 03_songs_filter.png, which already shows the row.
        await go()
        await click_filter("Songs")
        proc = page.locator(card_sel("New AI Song"))
        proc_menu_btn = proc.locator(MORE)
        if await proc_menu_btn.count() != 0:
            raise SystemExit("processing row unexpectedly has a ⋯ menu button")
        before_url = page.url
        await proc.locator("a.history-card__cover").click()
        await page.wait_for_timeout(400)
        if page.url != before_url:
            raise SystemExit("processing row unexpectedly navigated on click")

        # ── P3 · The ⋯ menu — five row-type variants + quick actions ─────
        await go()
        menu = await open_menu("Cinematic Night")
        await shoot("11_menu_mv_done.png", [card_sel("Cinematic Night") + MORE], "Options (⋯)")

        await go()
        menu = await open_menu("Golden Hour")
        await shoot("12_menu_song_done.png", [card_sel("Golden Hour") + MORE], "Options (⋯)")

        await go()
        menu = await open_menu("Starlight in Your Eyes")
        await shoot("13_menu_storyboard.png",
                    [card_sel("Starlight in Your Eyes") + MORE], "Options (⋯)")

        await go()
        await click_filter("Liked")
        menu = await open_menu("Whispers of the Past")
        await shoot("14_menu_community.png",
                    [card_sel("Whispers of the Past") + MORE], "Options (⋯)")

        await go()
        await click_filter("Songs")  # keeps the failed row in the single top row
        menu = await open_menu("Midnight Drive", state="failed")
        await shoot("15_menu_failed.png",
                    [card_sel("Midnight Drive", "failed") + MORE], "Options (⋯)")

        await go()
        await click_filter("Music Videos")  # 3 rows, Neon City Nights stays top-row
        menu = await open_menu("Neon City Nights")
        like_row = menu.get_by_role("menuitem", name="Like", exact=True)
        await check(['.history-card__menu--visible [role="menuitem"]:has-text("Like")'])
        await like_row.click()
        await page.wait_for_timeout(250)
        await shoot("16_like_toggle.png")

        await go()
        menu = await open_menu("Golden Hour")
        await menu.get_by_role("menuitem", name="Share", exact=True).click()
        await page.wait_for_selector('[role="dialog"][aria-label="Share"]', state="visible")
        await page.wait_for_timeout(300)
        await shoot("17_share_dialog.png")

        await go()
        menu = await open_menu("Golden Hour")
        await menu.get_by_role("menuitem", name="Download", exact=True).click()
        await page.wait_for_selector('text="Download started"', state="visible")
        await shoot("18_download_toast.png")

        # ── P4 · Publish ──────────────────────────────────────────────────
        await go()
        menu = await open_menu("Cinematic Night")
        publish_switch = menu.get_by_role("switch", name="Publish", exact=True)
        await check(['.history-card__menu--visible [role="switch"]'])
        await publish_switch.click()
        await page.wait_for_selector('[role="dialog"][aria-modal="true"] h2:has-text("Ready to Go Public?")',
                                     state="visible")
        await page.wait_for_function(
            "() => { const o = document.querySelector('.publish-dialog-overlay--visible');"
            " return o && getComputedStyle(o).opacity === '1'; }", timeout=3000)
        await page.wait_for_timeout(150)
        await shoot("19_publish_mv_confirm.png",
                    ['.publish-dialog__confirm'], "Confirm")

        await page.locator(".publish-dialog__confirm").click()
        await page.wait_for_selector('text="Submitted for review"', state="visible")
        await shoot("20_publish_mv_toast.png")

        menu = page.locator(".history-card__menu--visible")
        if await menu.count() == 0:
            # Menu auto-closed with the dialog; reopen on the now-reviewing row.
            menu = await open_menu("Cinematic Night")
        await shoot("21_menu_mv_reviewing.png",
                    ['.history-card__menu--visible .history-card__menu-publish'],
                    "Publish (Review)", kind="info")

        await go()
        await click_filter("Songs")
        menu = await open_menu("Midnight Drive", state="done")
        song_switch = menu.get_by_role("switch", name="Publish", exact=True)
        await song_switch.click()
        await page.wait_for_selector('text="Published success"', state="visible")
        await shoot("22_publish_song_toggle.png",
                    ['.history-card__menu--visible [role="switch"]'],
                    "Publish", kind="info")

        # ── P5 · Delete ───────────────────────────────────────────────────
        await go()
        await click_filter("Songs")
        menu = await open_menu("Midnight Drive", state="done")
        await menu.get_by_role("menuitem", name="Delete", exact=True).click()
        await page.wait_for_selector('[role="dialog"][aria-label="Delete"]', state="visible")
        await page.wait_for_timeout(300)
        await shoot("23_delete_confirm.png",
                    ['[role="dialog"][aria-label="Delete"] button:has-text("Delete")'], "Delete")

        await page.locator('[role="dialog"][aria-label="Delete"] button:has-text("Delete")').click()
        await page.wait_for_timeout(400)
        await shoot("24_delete_removed.png")

        # ── P6 · Edit MV / Create MV — menu tap only, no follow-through ──
        await go()
        menu = await open_menu("Cinematic Night")
        await shoot("25_menu_editmv_focus.png",
                    ['.history-card__menu--visible [role="menuitem"]:has-text("Edit MV")'],
                    "Edit MV")

        await go()
        menu = await open_menu("Golden Hour")
        await shoot("26_menu_createmv_focus.png",
                    ['.history-card__menu--visible [role="menuitem"]:has-text("Create MV")'],
                    "Create MV")

        print("console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3220")
    asyncio.run(main(ap.parse_args().base))
