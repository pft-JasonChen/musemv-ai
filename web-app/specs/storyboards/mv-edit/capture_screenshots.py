#!/usr/bin/env python3
"""Capture the AI MV Edit (S3) screenshots AND measure every focus box.

Screenshot source: **live app capture**, not a static prototype — same
convention as song-creation/mv-creation/history/shell-auth's capture scripts.
Every screenshot comes from driving the real Next.js dev server
(`npm run dev -- -p 3215`, this worktree's own port) with Playwright, signed
in via the same `localStorage['muse_auth']` seed the e2e specs use.
Full-page shots (`full_shot`, same helper as history/shell-auth), not
viewport clips — `/mv/edit` is taller than the viewport at every width.

VIEWPORTS — the SECOND D8 exception in this programme (PLAN.md §2, "S3
scope"). DESKTOP 1403x697 (this repo's established viewport — every focus box
is a percentage of the captured container, so this must not change) PLUS
~4 captures at PHONE 375x812 of the full-screen `.mv-edit-mobile-scene` view
ONLY (inline in `MvEditor.tsx:714`) — the rest of the screen stays
desktop-only. One of the four phone shots also looks at the general mobile
`/mv/edit` page's TOP AREA (before opening the scene editor) to check for
DESIGNER-TODO A16 (`display: contents` sorting `FloatingCTA`'s spacer to the
top below 768px on this screen — the same defect class as A16 on
`/mv/storyboard`, confirmed by reading `MVEditPage.css` lines 66-115: `.mv-edit__panel`/
`.mv-edit__side` go `display: contents` below 767px and give every section an
explicit `order`, but `FloatingCTA`'s `.floating-cta__spacer` (rendered as a
sibling of `.mv-edit__ctas` inside `.mv-edit__panel`) gets NO `order`, so it
defaults to `order: 0` and sorts before every ordered section).

CREDITS — TWO SERVER PROCESSES, ON PURPOSE (same reasoning as mv-creation).
    `DEFAULT_CREDITS` is 10; `COST_MERGE` is a flat 10 and `recreateShotCost`/
    `COST_COVER` add more on top, so under the plain default env even ONE
    Recreate makes a subsequent Merge naturally insufficient. That is exactly
    P5's insufficient-balance scenario, so P5's credits-gate step (plus the
    MV-E2 reload/no-state step, which needs a PRISTINE localStorage so no
    persisted storyboard survives the reload) is captured against a dev
    server with NO `NEXT_PUBLIC_DEMO_CREDITS` override. Every other step
    needs headroom for a real generation, three Recreates and a Merge, so it
    runs against a SECOND dev server started with `NEXT_PUBLIC_DEMO_CREDITS=2000`.
    `NEXT_PUBLIC_DEMO_CREDITS` is build-time-inlined, so switching it means
    restarting the dev server — see the two `--phase` invocations below.

THREE BROWSER SESSIONS WITHIN THE HI-CREDIT PHASE, ON PURPOSE
    Session A is the MAIN flow: a real storyboard-first generation, all the
    way to a `/mv/result` → Edit MV entry, then P2/P3(desktop+phone)/P4-S1/P5
    walked on that ONE real storyboard so edits accumulate naturally into one
    `dirty` state for Merge.
    Session B is the FABRICATED entry (History's Edit MV — `useSeedMvFlow`,
    `mockStoryboard()` + a synthetic song, `durationSec: 145`) plus the
    Delete-this-Project demonstration, which discards the flow — reusing
    Session A for this would have overwritten its real storyboard mid-flow
    (`seedMvFlow` calls the SAME `setStoryboard`/`saveStoryboard` Session A's
    own edits depend on) and then destroyed it, corrupting P2/P3/P4-S1/P5.
    Keeping them apart is not a style choice, it is required by the state
    model.

USAGE
    NEXT_PUBLIC_DEMO_CREDITS=2000 npm run dev -- -p 3215     # terminal 1
    python3 capture_screenshots.py --base http://localhost:3215
    # then restart the dev server with NO override (plain `npm run dev -- -p 3215`) and:
    python3 capture_screenshots.py --base http://localhost:3215 --credits-gate-only
    python3 build_spec.py
"""
import argparse
import asyncio
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/mv-edit
WEB_APP = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))   # .../web-app
sys.path.insert(0, os.path.join(WEB_APP, "skills", "yco-spec"))

_SHARED = os.path.expanduser("~/Library/Caches/ms-playwright")
if "PLAYWRIGHT_BROWSERS_PATH" not in os.environ and os.path.isdir(_SHARED):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = _SHARED

from capture_lib import Capture  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from PIL import Image  # noqa: E402

DESKTOP = (1403, 697)
PHONE = (375, 812)

DESCRIPTION = (
    "A dreamy pop anthem about chasing golden-hour light across a rain-slicked "
    "city skyline, warm neon reflections and slow drifting camera moves."
)


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server, signed in via the
    same `localStorage['muse_auth']` seed the e2e specs use — identical to
    mv-creation/history/shell-auth's own class."""

    def __init__(self, feature_dir, base_url, seed_auth=True, **kw):
        kw.setdefault("viewport", DESKTOP)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")
        self.seed_auth = seed_auth

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
        if self.seed_auth:
            await ctx.add_init_script("window.localStorage.setItem('muse_auth', '1')")
        self.page = await ctx.new_page()
        self.page.on("console", lambda m: self.errors.append(m.text)
                     if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        return self

    async def __aexit__(self, *a):
        self._server = None
        # MERGE with whatever is already on disk instead of clobbering it.
        # This script runs THREE separate `Capture` instances against the same
        # focus.json (session_a, session_b within `main()`, plus a fourth
        # process invocation for `main_credits_gate`) — the shared
        # `Capture.__aexit__` in capture_lib.py writes `self.focus_map`
        # wholesale, so the second and third instance's exit was overwriting
        # the first's entries instead of adding to them. Confirmed: a prior
        # run of this script left focus.json with only session_b's two
        # entries (04, 19), session_a's ~13 having been clobbered by
        # session_b's own __aexit__ moments later.
        if self.focus_map and os.path.exists(self.focus_path):
            with open(self.focus_path, encoding="utf-8") as f:
                existing = json.load(f)
            existing.update(self.focus_map)
            self.focus_map = existing
        return await super().__aexit__(*a)

    async def full_shot(self, name):
        """Full-page PNG; returns the container box `focus()` needs, read
        back from the SAVED FILE's real pixel size — matches history/
        shell-auth's identical helper (some captured states run taller than
        the viewport, e.g. the phone create sheet there / the desktop rail
        here)."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=True)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}

    async def viewport_shot(self, name):
        """Plain (non-full-page) viewport PNG at the current scroll position.
        Reserved for the ONE case a full-page shot actively misleads: a
        `position: fixed`/`sticky` element is repositioned relative to the
        ARTIFICIALLY TALL viewport Chromium uses for `full_page=True`, so a
        full-page capture of a page with a `position: fixed` bottom bar (this
        screen's `.floating-cta`) shows that bar and the sticky header at
        wrong, duplicated-looking heights — a capture artifact, not the bug
        being photographed (A16). A plain viewport shot avoids it."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=False)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}


async def check(page, targets):
    """Fail loudly on a focus selector matching nothing, or matching a
    hidden/ambiguous duplicate — see history/shell-auth's identical
    helper and its docstring for why this exists."""
    for sel in targets:
        loc = page.locator(sel)
        n = await loc.count()
        if n == 0:
            raise SystemExit(f"focus selector matched nothing: {sel}")
        vis = await loc.filter(visible=True).count()
        if n > 1 and vis != 1:
            raise SystemExit(
                f"focus selector {sel} matched {n} elements "
                f"({vis} visible) — narrow it")


def make_shoot(cap, page, full_page=True):
    """`full_page=False` for any state with a `position: fixed` element —
    `.floating-cta` on the general page, `.mv-edit-mobile-scene` on phone
    (both `inset: 0`/fixed) — where a full-page capture repositions the
    fixed element against Chromium's artificially tall full-page viewport
    instead of the real one. See `viewport_shot`'s own docstring."""
    async def shoot(name, targets=None, label=None, kind="action"):
        await page.wait_for_timeout(200)
        if targets:
            await check(page, targets)
        cb = await (cap.full_shot(name) if full_page else cap.viewport_shot(name))
        if targets:
            await cap.focus(name, cb, targets, label, kind=kind)
            got = cap.focus_map[name][-1]["box"]
            x, y, w, h = got
            if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                    and x + w <= 101 and y + h <= 101):
                raise SystemExit(
                    f"{name}: focus box {got} is outside its own "
                    f"screenshot — the frame would miss the control")
    return shoot


async def multi_focus(cap, page, name, frames):
    """Same shot, MULTIPLE labeled frames — `cap.focus()` appends to
    `focus_map[name]`, so calling it more than once per shot is how a
    single screenshot gets more than one numbered badge (cfg-schema.md's
    `focus` list). Takes the screenshot first, then measures each frame
    against that container box."""
    await page.wait_for_timeout(200)
    for targets, _label, _kind in frames:
        await check(page, targets)
    cb = await cap.full_shot(name)
    for targets, label, kind in frames:
        await cap.focus(name, cb, targets, label, kind=kind)
        got = cap.focus_map[name][-1]["box"]
        x, y, w, h = got
        if not (0 <= x < 100 and 0 <= y < 100 and 0 < w <= 100 and 0 < h <= 100
                and x + w <= 101 and y + h <= 101):
            raise SystemExit(
                f"{name}: focus box {got} is outside its own "
                f"screenshot — the frame would miss the control")


async def modal_settled(page, overlay_sel):
    """Wait until exactly the named overlay reads opacity 1 — the
    `sheetSettled()` pattern AGENTS.md requires for any DP overlay."""
    await page.wait_for_selector(overlay_sel, state="visible")
    await page.wait_for_function(
        "(sel) => { const o = document.querySelector(sel);"
        " return o && getComputedStyle(o).opacity === '1'; }",
        arg=overlay_sel, timeout=3000)
    await page.wait_for_timeout(150)


async def main(base):
    # ══════════════════════════════════════════════════════════════════════
    # SESSION A — main flow, hi-credit server: real storyboard-first
    # generation → /mv/result → Edit MV → P2 (cover) → P3 (scenes, desktop
    # then phone) → P4-S1 (settings rail) → P5 (merge, sufficient balance)
    # ══════════════════════════════════════════════════════════════════════
    async def session_a(base):
        async with NextCapture(HERE, base) as cap:
            page = cap.page
            shoot = make_shoot(cap, page)
            # Any `position: fixed` DIALOG (Modal/DpDialog family, the cover
            # lightbox) is the same full-page-viewport-resize pitfall as
            # FloatingCTA/the mobile-scene overlay — see `make_shoot`'s
            # docstring.
            overlay_shoot = make_shoot(cap, page, full_page=False)

            async def go(path):
                await page.goto(f"{base}{path}", wait_until="networkidle")
                await page.wait_for_timeout(700)

            # ── build a real MV up to /mv/result ────────────────────────
            await go("/mv/room")
            await page.fill(".mv-create__textarea", DESCRIPTION)
            await page.wait_for_timeout(150)
            await page.locator(".mv-create__song-option:nth-child(1)").click()
            await page.wait_for_selector(".mv-song-picker__row", state="visible")
            row = page.locator(".mv-song-picker__row").nth(0)
            await row.click()
            await page.wait_for_timeout(200)
            await row.locator(".mv-song-picker__use").click()
            await page.wait_for_selector(".mv-trim-sheet__trimmer", state="visible")
            await page.wait_for_timeout(400)
            await page.click(".mv-sheet__footer-btn--confirm")
            await page.wait_for_timeout(400)

            await page.click(".mv-create__cta:visible")
            await page.wait_for_selector(".mv-mode-sheet__intro", state="visible")
            await page.wait_for_timeout(300)
            await page.click(".mv-mode-card--featured")  # Create Storyboard First
            await page.wait_for_url("**/mv/thinking**", timeout=15000)
            await page.wait_for_url("**/mv/storyboard**", timeout=15000)
            await page.wait_for_timeout(500)

            await page.locator(".mv-storyboard__cta:visible").scroll_into_view_if_needed()
            await page.wait_for_timeout(200)
            await page.click(".mv-storyboard__cta:visible")  # Generate MV
            await page.wait_for_url("**/mv/creating**", timeout=15000)
            await page.wait_for_url("**/mv/result**", timeout=20000)
            await page.wait_for_timeout(600)

            # ══════════════════════════════════════════════════════════
            # P1-S1..S3 — real entry + screen tour
            # ══════════════════════════════════════════════════════════
            await shoot("01_result_edit_entry.png",
                        ['.mv-result__action:has-text("Edit MV")'], "Edit MV")
            await page.click('.mv-result__action:has-text("Edit MV")')
            await page.wait_for_url("**/mv/edit**", timeout=5000)
            await page.wait_for_timeout(500)

            await multi_focus(cap, page, "02_edit_header_tour.png", [
                (['.detail-navbar__back'], "Back", "info"),
                (['.credit-balance'], "Credits", "info"),
            ])
            await shoot("03_edit_layout_tour.png")

            # ══════════════════════════════════════════════════════════
            # P2 — Cover
            # ══════════════════════════════════════════════════════════
            await shoot("06_cover_section.png",
                        ['.mv-edit__section--cover .mv-edit__enhance-btn'], "Enhance")

            await page.click('.mv-edit__media-action--expand')
            await page.wait_for_selector('.mv-edit__lightbox-overlay', state="visible")
            await page.wait_for_timeout(250)
            await overlay_shoot("07_cover_lightbox.png",
                        ['.mv-edit__lightbox-close'], "Close")
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(250)

            await shoot("08_cover_recreate_click.png",
                        ['.mv-edit__regen-btn'], "Recreate")
            await page.click('.mv-edit__regen-btn')
            await page.wait_for_timeout(2500)  # recreateCover's 2.2s mock delay
            await shoot("09_cover_recreated.png")

            # ══════════════════════════════════════════════════════════
            # P3 — Scenes (desktop)
            # ══════════════════════════════════════════════════════════
            await shoot("10_scene_clip_strip.png",
                        ['.mv-edit__clip:nth-child(1)'], "Scene 1")

            await shoot("11_scene_editor_enhance.png",
                        ['.mv-edit__section--scene-editor .mv-edit__enhance-btn'], "Enhance")

            scene_box = ".mv-edit__section--scene-editor .mv-edit__textarea"
            current = await page.locator(scene_box).input_value()
            await page.fill(scene_box, current + " Slow push-in on her face.")
            await page.wait_for_timeout(150)
            await shoot("12_scene_recreate_enabled.png",
                        ['.mv-edit__recreate-scene'], "Recreate")
            await page.click('.mv-edit__recreate-scene')
            await page.wait_for_timeout(2900)  # recreateScene's 2.6s mock delay
            await shoot("13_scene_recreated_version.png",
                        ['.mv-edit__scene-versions'], "Generated scene history", kind="info")

            # ══════════════════════════════════════════════════════════
            # P4-S1 — Output settings rail (Delete is Session B's job)
            # ══════════════════════════════════════════════════════════
            title_toggle = '[role="switch"][aria-label="Show MV title"]'
            watermark_toggle = '[role="switch"][aria-label="Show Watermark"]'
            await page.locator(watermark_toggle).scroll_into_view_if_needed()
            await page.wait_for_timeout(200)
            await multi_focus(cap, page, "18_settings_rail.png", [
                ([title_toggle], "Show MV title", "action"),
                ([watermark_toggle], "Show Watermark", "info"),
            ])
            await page.click(watermark_toggle)  # toggling makes settingsDirty=true
            await page.wait_for_timeout(200)

            # ══════════════════════════════════════════════════════════
            # P3-S5..S8 — Scenes, phone (D8 exception #2)
            # ══════════════════════════════════════════════════════════
            await page.set_viewport_size({"width": PHONE[0], "height": PHONE[1]})
            await page.wait_for_timeout(300)
            # Plain viewport shot, NOT full_page — a full-page capture of a
            # `position: fixed` bottom bar renders it at the wrong height
            # (see `viewport_shot`'s own docstring). DESIGNER-TODO A16
            # candidate: confirmed live via computed style (see build_spec.py's
            # docstring) that `.mv-edit__sublabel` AND `.floating-cta__spacer`
            # both compute `order: 0` below 767px, sorting ahead of every
            # explicitly-ordered section.
            await page.evaluate("() => window.scrollTo(0, 0)")
            await page.wait_for_timeout(150)
            await cap.viewport_shot("14_mobile_top_a16.png")

            # `phone_shoot` (full_page=False): both the mobile-scene overlay
            # AND the general page below it are `position: fixed`/`inset: 0`
            # or carry one (see `make_shoot`'s docstring) — every remaining
            # phone shot uses it, not the desktop `shoot`.
            phone_shoot = make_shoot(cap, page, full_page=False)

            first_clip = page.locator(".mv-edit__clip").first
            await first_clip.scroll_into_view_if_needed()
            await page.wait_for_timeout(200)
            await first_clip.click()
            await page.wait_for_selector(".mv-edit-mobile-scene", state="visible")
            await page.wait_for_timeout(300)
            await phone_shoot("15_mobile_scene_editor.png",
                        ['.mv-edit-mobile-scene__back'], "Back")

            mobile_scene_box = ".mv-edit-mobile-scene .mv-edit__textarea"
            mcur = await page.locator(mobile_scene_box).input_value()
            await page.fill(mobile_scene_box, mcur + " Handheld drift.")
            await page.wait_for_timeout(150)
            recreate_btn = page.locator(".mv-edit-mobile-scene .mv-edit__recreate-scene")
            await recreate_btn.scroll_into_view_if_needed()
            await page.wait_for_timeout(200)
            await phone_shoot("16_mobile_scene_recreate.png",
                        ['.mv-edit-mobile-scene .mv-edit__recreate-scene'], "Recreate")

            await page.click('.mv-edit-mobile-scene__back')
            await page.wait_for_selector(".mv-edit-mobile-scene", state="detached")
            await page.wait_for_timeout(300)
            await page.evaluate("() => window.scrollTo(0, 0)")
            await page.wait_for_timeout(150)
            await phone_shoot("17_mobile_scene_back.png")

            await page.set_viewport_size({"width": DESKTOP[0], "height": DESKTOP[1]})
            await page.wait_for_timeout(300)

            # ══════════════════════════════════════════════════════════
            # P5-S1, S4 — Merge, sufficient balance
            # ══════════════════════════════════════════════════════════
            await page.locator(".mv-edit__merge-btn").scroll_into_view_if_needed()
            await page.wait_for_timeout(200)
            await shoot("21_merge_enabled.png",
                        ['.mv-edit__merge-btn'], "Merge MV")
            await page.click(".mv-edit__merge-btn")
            await page.wait_for_url("**/mv/creating**", timeout=5000)
            await page.wait_for_timeout(400)
            await shoot("23_creating_first_frame.png")

            print("Session A console errors:", cap.errors or "none")

    # ══════════════════════════════════════════════════════════════════════
    # SESSION B — fabricated entry (History's Edit MV) + Delete this Project
    # ══════════════════════════════════════════════════════════════════════
    async def session_b(base):
        async with NextCapture(HERE, base) as cap:
            page = cap.page
            shoot = make_shoot(cap, page)
            overlay_shoot = make_shoot(cap, page, full_page=False)

            await page.goto(f"{base}/history", wait_until="networkidle")
            await page.wait_for_timeout(700)

            btn = page.locator('.history-card:has-text("Cinematic Night") .history-card__more')
            await btn.click()
            await page.wait_for_selector(".history-card__menu--visible", state="visible")
            await page.wait_for_function(
                "() => { const m = document.querySelector('.history-card__menu--visible');"
                " return m && getComputedStyle(m).opacity === '1'; }", timeout=3000)
            await page.wait_for_timeout(150)
            await shoot("04_history_menu_editmv.png",
                        ['.history-card__menu--visible [role="menuitem"]:has-text("Edit MV")'],
                        "Edit MV")
            await page.click('.history-card__menu--visible [role="menuitem"]:has-text("Edit MV")')
            await page.wait_for_url("**/mv/edit**", timeout=5000)
            await page.wait_for_timeout(500)
            await shoot("05_edit_from_history.png")

            # ── P4-S2, S3 — Delete this Project ─────────────────────────
            await page.locator(".mv-edit__delete-btn").scroll_into_view_if_needed()
            await page.click(".mv-edit__delete-btn")
            await page.wait_for_selector('[role="dialog"][aria-label="Delete"]', state="visible")
            await page.wait_for_timeout(250)
            await overlay_shoot("19_delete_confirm.png",
                        ['[role="dialog"][aria-label="Delete"] button:has-text("Delete")'],
                        "Delete")
            await page.click('[role="dialog"][aria-label="Delete"] button:has-text("Delete")')
            await page.wait_for_url("**/history**", timeout=5000)
            await page.wait_for_timeout(500)
            await shoot("20_delete_done_history.png")

            print("Session B console errors:", cap.errors or "none")

    await session_a(base)
    await session_b(base)


async def main_credits_gate(base):
    """P5-S5 (MV-E2, reload with no flow state — needs PRISTINE localStorage,
    so it runs FIRST, before anything else writes a persisted storyboard) and
    P5-S3 (insufficient balance at Merge), both against the PLAIN
    default-credit server (see module docstring)."""
    async with NextCapture(HERE, base) as cap:
        page = cap.page
        shoot = make_shoot(cap, page)
        overlay_shoot = make_shoot(cap, page, full_page=False)

        # ── P5-S5 — MV-E2: reload / deep-link with no in-memory state ───
        await page.goto(f"{base}/mv/edit", wait_until="networkidle")
        await page.wait_for_timeout(900)  # past the 400ms tolerant hydrate wait
        if "/mv/room" not in page.url:
            raise SystemExit(f"MV-E2: expected redirect to /mv/room, got {page.url}")
        await shoot("24_mve2_reload_redirect.png")

        # ── P5-S3 — insufficient balance at Merge ────────────────────────
        await page.goto(f"{base}/history", wait_until="networkidle")
        await page.wait_for_timeout(700)
        btn = page.locator('.history-card:has-text("Cinematic Night") .history-card__more')
        await btn.click()
        await page.wait_for_selector(".history-card__menu--visible", state="visible")
        await page.wait_for_function(
            "() => { const m = document.querySelector('.history-card__menu--visible');"
            " return m && getComputedStyle(m).opacity === '1'; }", timeout=3000)
        await page.wait_for_timeout(150)
        await page.click('.history-card__menu--visible [role="menuitem"]:has-text("Edit MV")')
        await page.wait_for_url("**/mv/edit**", timeout=5000)
        await page.wait_for_timeout(500)

        # One Recreate cover (COST_COVER=4) drops the default 10 credits to 6
        # and sets `dirty=true` — cheaper and more direct than draining
        # credits through a real generation, and it is itself a real Edit-MV
        # action, not a shortcut around one.
        await page.click(".mv-edit__regen-btn")
        await page.wait_for_timeout(2500)

        await page.locator(".mv-edit__merge-btn").scroll_into_view_if_needed()
        await page.wait_for_timeout(200)
        await page.click(".mv-edit__merge-btn")
        await page.wait_for_selector(".upgrade-dialog-overlay--visible", state="visible")
        await modal_settled(page, ".upgrade-dialog-overlay--visible")
        if "/mv/creating" in page.url:
            raise SystemExit("insufficient-balance Merge unexpectedly navigated to /mv/creating")
        await overlay_shoot("22_merge_insufficient_credits.png")

        print("Credits-gate console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3215")
    ap.add_argument("--credits-gate-only", action="store_true",
                     help="Run only the MV-E2 + insufficient-balance steps "
                          "(point --base at a server with NO "
                          "NEXT_PUBLIC_DEMO_CREDITS override).")
    args = ap.parse_args()
    if args.credits_gate_only:
        asyncio.run(main_credits_gate(args.base))
    else:
        asyncio.run(main(args.base))
