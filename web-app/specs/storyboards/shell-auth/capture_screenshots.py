#!/usr/bin/env python3
"""Capture the shell-auth (S6) screenshots AND measure every focus box.

Screenshot source: **live app capture**, not a static prototype — same
convention as song-creation/history's capture scripts. Drives the already-
running Next dev server with Playwright, no throwaway static file server.

TWO VIEWPORTS, NOT ONE — the one deliberate exception in this programme (D8,
specs/storyboards/PLAN.md §2 S6 table). Every other storyboard spec captures
desktop 1440 only; S6 also captures 375 because `MobileTabBar`/`MobileHeader`
are a DIFFERENT component tree from `Sidebar`/`TopBar`, not a reflow of it.
    DESKTOP  1403x697  — this repo's established viewport (song-creation,
                          history). Every focus box is a percentage of the
                          captured container, so this must not change.
    PHONE     375x812  — a plain iPhone-width viewport. Chosen because it is
                          well inside `PHONE_QUERY = "(max-width: 767px)"`
                          and matches the "375" tier in the six-width scale
                          AGENTS.md documents (320/375/768/1024/1440/1920).
Both are captured in ONE Playwright session (`page.set_viewport_size` between
the desktop and phone passes), not two — auth/subscription state carries
across the resize the same way it would across a real resize in one tab.

THREE FINDINGS FROM PHASE 0/1 READING SHAPE THIS SCRIPT AND ARE WORTH KNOWING
BEFORE READING THE STEPS BELOW (full detail + area-spec corrections in
build_spec.py's own docstring and the D11 corrections in specs/areas/01 and
09):
  1. `AccountMenu`/`HeaderActions`/`TopBar` are UNREACHABLE dead code — no
     route in AppShell's routing table ever selects `TopBar` today. There is
     no avatar, no dropdown, no PRO/FREE badge anywhere live. Confirmed by a
     DOM sweep in `sweep_no_account_menu()` below, run against five routes;
     the sweep is the "screenshot" for that finding (no image, see
     `shot=''` steps in build_spec.py).
  2. `MobileTabBar`/`MobileHeader` mount ONLY on Home and `/history`
     (`AppShell.tsx`'s `MOBILE_TAB_ROUTES`/`isHome`), not on every route
     below 767px. The phone captures below reflect that — there is no
     "generic phone header" to shoot on `/mv/room`.
  3. The visible logged-out control everywhere reads **"Login"**, never
     "Sign In" (that string lives only in the dead `HeaderActions`).

Sidebar's real nav-item text is `t('nav.createMv')` = "AI Music Video", not
the shorthand "Create MV" area 01 uses as a route label — verified against
`src/lib/i18n/dictionaries/en.ts` and used verbatim in every selector below.

USAGE
    npm run dev -- -p 3210        # in another terminal (this worktree's own port)
    python3 capture_screenshots.py [--base http://localhost:3210]
    python3 build_spec.py
"""
import argparse
import asyncio
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))                   # .../specs/storyboards/shell-auth
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


class NextCapture(Capture):
    """`Capture` against an already-running Next dev server, signed in via the
    same `localStorage['muse_auth']` seed the e2e specs use — see
    history/capture_screenshots.py's identical class for why this overrides
    only the lifecycle, not `shot()`/`focus()`. Auth is seeded here but NOT
    forced on for every page — several steps below deliberately run logged
    out, clearing it mid-session via `sign_out()`."""

    def __init__(self, feature_dir, base_url, **kw):
        kw.setdefault("viewport", DESKTOP)
        super().__init__(feature_dir, "", **kw)
        self.base_url = base_url.rstrip("/")

    async def __aenter__(self):
        os.makedirs(self.save_dir, exist_ok=True)
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await self._browser.new_context(
            viewport=self.viewport, device_scale_factor=1)
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
        back from the SAVED FILE's real pixel size (matches history's
        `full_shot` — the same reason: some captured pages run taller than
        the viewport, e.g. the phone create sheet)."""
        path = os.path.join(self.save_dir, name)
        await self.page.screenshot(path=path, full_page=True)
        self._record(name, path)
        with Image.open(path) as im:
            w, h = im.size
        return {"x": 0, "y": 0, "width": w, "height": h}


async def main(base):
    async with NextCapture(HERE, base) as cap:
        page = cap.page

        async def go(path="/", locale=""):
            url = f"{base}{locale}{path}"
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(500)

        async def sign_in():
            """Writes the persisted flag directly (bypassing `authStore.set`'s
            listener notification) AND reloads — `authStore.getSnapshot()` is
            only re-read on mount or a real 'storage' event (cross-tab), so a
            same-tab localStorage write needs the reload to take effect.
            Requires a document to already be loaded (localStorage is
            inaccessible on about:blank) — call `go()` at least once first."""
            await page.evaluate("() => window.localStorage.setItem('muse_auth', '1')")
            await page.reload(wait_until="networkidle")
            await page.wait_for_timeout(500)

        async def sign_out():
            """Same reasoning as `sign_in()`, in reverse."""
            await page.evaluate("() => window.localStorage.removeItem('muse_auth')")
            await page.reload(wait_until="networkidle")
            await page.wait_for_timeout(500)

        async def modal_settled(overlay_sel):
            """Wait until exactly the named overlay reads opacity 1 — the
            `sheetSettled()` pattern AGENTS.md requires for any DP overlay
            (never measure one still animating in)."""
            await page.wait_for_selector(overlay_sel, state="visible")
            await page.wait_for_function(
                "(sel) => { const o = document.querySelector(sel);"
                " return o && getComputedStyle(o).opacity === '1'; }",
                arg=overlay_sel, timeout=3000)
            await page.wait_for_timeout(150)

        async def modal_gone(overlay_sel):
            """Wait for a DpDialog-family overlay to finish its fade-OUT and
            unmount (useDialogTransition, 300ms) rather than just checking
            visibility, which stays true mid-fade."""
            await page.wait_for_function(
                "(sel) => !document.querySelector(sel)", arg=overlay_sel, timeout=3000)
            await page.wait_for_timeout(100)

        async def check(targets):
            """Fail loudly on a focus selector matching nothing or matching a
            hidden/ambiguous duplicate — see history's identical helper."""
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

        async def shoot(name, targets=None, label=None, kind="action"):
            await page.wait_for_timeout(150)
            if targets:
                await check(targets)
            cb = await cap.full_shot(name)
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

        MV_NAV = '.sidebar__nav-item:has-text("AI Music Video")'
        HISTORY_NAV = '.sidebar__nav-item:has-text("History")'
        LOGIN_OVERLAY = ".login-modal-overlay--visible"
        UPGRADE_OVERLAY = ".upgrade-dialog-overlay--visible"

        # ══════════════════════════════════════════════════════════════════
        # DESKTOP PASS — 1403x697
        # ══════════════════════════════════════════════════════════════════

        # ── P1 · Signed-in navigation ────────────────────────────────────
        await go("/")
        await sign_in()
        await shoot("01_sidebar_home_active.png",
                    ['.sidebar__nav-item:has-text("Home")'], "Home (active)",
                    kind="info")

        await page.locator(MV_NAV).click()
        await page.wait_for_url("**/mv/room")
        await page.wait_for_timeout(400)
        await shoot("02_sidebar_nav_click.png", [MV_NAV], "AI Music Video")

        await go("/history", locale="/jpn")
        await shoot("03_sidebar_nav_locale.png", [HISTORY_NAV], "History")

        await page.locator(".sidebar__upgrade-button").click()
        await modal_settled(UPGRADE_OVERLAY)
        await shoot("04_sidebar_upgrade_open.png")
        await page.keyboard.press("Escape")
        await modal_gone(UPGRADE_OVERLAY)

        # ── P2 · Gated nav while logged out ─────────────────────────────
        await sign_out()
        await go("/")
        await page.locator(HISTORY_NAV).click()
        await modal_settled(LOGIN_OVERLAY)
        await shoot("05_gated_history_click.png", [HISTORY_NAV], "History")

        await page.keyboard.press("Escape")
        await modal_gone(LOGIN_OVERLAY)
        await shoot("06_gated_dismiss_stay.png")
        if "/history" in page.url:
            raise SystemExit("dismissing the gated-nav modal navigated — should stay put")

        await page.locator(HISTORY_NAV).click()
        await modal_settled(LOGIN_OVERLAY)
        await page.locator('.login-modal__social:has-text("Google")').click()
        await page.wait_for_url("**/history", timeout=3000)
        await page.wait_for_timeout(400)
        await shoot("07_gated_signin_lands_history.png")

        # ── P3 · Header Sign In (no queued action) ──────────────────────
        await sign_out()
        await go("/mv/room")
        await page.locator(".room-navbar__login").click()
        await modal_settled(LOGIN_OVERLAY)
        await shoot("08_header_login_click.png", ['.room-navbar__login'], "Login")

        await page.locator('.login-modal__social:has-text("Apple")').click()
        await modal_gone(LOGIN_OVERLAY)
        await page.wait_for_timeout(300)
        if not page.url.endswith("/mv/room"):
            raise SystemExit("header Sign In with no queued action navigated away")
        await shoot("09_header_signin_success.png", ['.credit-balance'], "Credits", kind="info")

        # ── P4 · Gated route entry (AuthGuard) ───────────────────────────
        await sign_out()
        await go("/history")
        await modal_settled(LOGIN_OVERLAY)
        await shoot("10_authguard_blocked.png")

        await page.keyboard.press("Escape")
        await page.wait_for_url("**/")
        await page.wait_for_timeout(300)
        await shoot("11_authguard_dismiss_home.png")

        await go("/history")
        await modal_settled(LOGIN_OVERLAY)
        await page.locator('.login-modal__social:has-text("Apple")').click()
        await modal_gone(LOGIN_OVERLAY)
        await page.wait_for_timeout(400)
        if "/history" not in page.url:
            raise SystemExit("AuthGuard did not stay on /history after sign-in")
        await shoot("12_authguard_signin_success.png")

        # ── P5 · Account entry points (the account MENU has none — see P5-S3) ──
        await go("/mv/room")
        await page.locator(".credit-balance").click()
        await modal_settled(UPGRADE_OVERLAY)
        await shoot("13_credit_balance_click.png")
        await page.keyboard.press("Escape")
        await modal_gone(UPGRADE_OVERLAY)

        await go("/")
        await page.locator(".sidebar__profile").click()
        await page.wait_for_url("**/profile")
        await page.wait_for_timeout(400)
        await shoot("14_sidebar_profile_click.png")

        # P5-S3: no screenshot — a DOM sweep proving the account-MENU control
        # (`[aria-label="Account menu"]`, HeaderActions/AccountMenu's own
        # marker) exists nowhere, on five representative signed-in routes.
        for route in ["/", "/history", "/profile", "/watch", "/settings"]:
            await go(route)
            found = await page.locator('[aria-label="Account menu"]').count()
            if found:
                raise SystemExit(
                    f"account-menu trigger unexpectedly found on {route} — "
                    "the P5-S3 dead-component finding no longer holds, "
                    "re-check specs/areas/01-app-shell.md's D11 correction")
        print("P5-S3 sweep: confirmed no [aria-label=\"Account menu\"] on 5 routes")

        # ── P6 · Sign out (Settings) + AUTH-E1 (reload drops subscription) ──
        await go("/settings")
        signout_btn = page.get_by_role("button", name="Sign Out", exact=True)
        await check(['button:has-text("Sign Out")'])
        await shoot("15_settings_signout_click.png",
                    ['button:has-text("Sign Out")'], "Sign Out")
        await signout_btn.click()
        await page.wait_for_url("**/")
        await page.wait_for_timeout(400)
        await shoot("16_signout_home_guest.png", ['.navbar__actions button:has-text("Login")'],
                    "Login", kind="info")

        await go("/mv/room")
        await sign_in()
        await page.locator(".upgrade-button").click()
        await modal_settled(UPGRADE_OVERLAY)
        await page.locator(".upgrade-dialog__cta").first.click()
        await modal_gone(UPGRADE_OVERLAY)
        await page.wait_for_timeout(300)
        # `subscribed` is in-memory React state, not persisted (AUTH-E1) — a
        # `page.goto()`/full browser navigation here would reset it before the
        # "before reload" shot is even taken, silently pre-empting the exact
        # thing being demonstrated. Use a client-side Link click instead, the
        # same as a real user staying in the SPA.
        await page.locator('.sidebar__nav-item:has-text("Home")').click()
        await page.wait_for_url(f"{base}/")
        await page.wait_for_timeout(400)
        no_upgrade_pill = await page.locator(".sidebar__upgrade-button").count()
        if no_upgrade_pill:
            raise SystemExit("subscribe click did not take effect — Upgrade button still shown")
        await shoot("17_authE1_before_reload.png",
                    ['.sidebar__profile-plan'], "Subscribed plan", kind="info")

        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(500)
        still_logged_in = await page.locator(".sidebar__profile").count()
        if not still_logged_in:
            raise SystemExit("AUTH-E1: reload unexpectedly signed the user out entirely")
        reset_to_free = await page.locator(".sidebar__upgrade-button").count()
        if not reset_to_free:
            raise SystemExit("AUTH-E1: reload unexpectedly kept the subscription")
        await shoot("18_authE1_after_reload.png",
                    ['.sidebar__profile-plan'], "Reset to Free plan", kind="info")

        # ── P7 · Bare page ────────────────────────────────────────────────
        await go("/share?id=mv-cinematic-dark")
        no_shell = await page.locator(".sidebar, .room-navbar, .detail-navbar").count()
        if no_shell:
            raise SystemExit("/share unexpectedly rendered shell chrome")
        await shoot("19_bare_share.png")

        # ══════════════════════════════════════════════════════════════════
        # PHONE PASS — 375x812 (D8 exception, see module docstring)
        # ══════════════════════════════════════════════════════════════════
        await page.set_viewport_size({"width": PHONE[0], "height": PHONE[1]})

        # ── P1 (phone) · MobileTabBar / MobileHeader / the create sheet ──
        await go("/")
        await sign_in()
        await shoot("20_mobile_home_chrome.png",
                    ['.mobile-tabbar__create'], "Create (+)")

        await page.locator(".mobile-tabbar__create").click()
        await page.wait_for_selector(".mobile-tabbar-sheet-overlay--visible", state="visible")
        await page.wait_for_function(
            "() => { const o = document.querySelector('.mobile-tabbar-sheet-overlay--visible');"
            " return o && getComputedStyle(o).opacity === '1'; }", timeout=3000)
        await page.wait_for_timeout(150)
        await shoot("21_mobile_create_sheet.png",
                    ['.mobile-tabbar-sheet__option:has-text("AI Music Video")'], "AI Music Video")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # ── P2 (phone) · Gated History tab ──────────────────────────────
        await sign_out()
        await page.set_viewport_size({"width": PHONE[0], "height": PHONE[1]})
        await go("/")
        history_tab = '.mobile-tabbar__item:has-text("History")'
        await page.locator(history_tab).click()
        await modal_settled(LOGIN_OVERLAY)
        await shoot("22_mobile_gated_history_tap.png", [history_tab], "History")

        await page.keyboard.press("Escape")
        await modal_gone(LOGIN_OVERLAY)
        await shoot("23_mobile_gated_dismiss_stay.png")
        if "/history" in page.url:
            raise SystemExit("phone: dismissing the gated tab modal navigated — should stay put")

        # ── P5 (phone) · History's RoomNavbar absorbs mobileHeaderActions ──
        await go("/history")
        await sign_in()
        await page.wait_for_timeout(300)
        stacked = await page.locator(".mobile-header").count()
        if stacked:
            raise SystemExit(
                "/history unexpectedly stacks the generic MobileHeader under "
                "RoomNavbar on phone — the 2026-08-23 'one div' fix regressed")
        await shoot("24_mobile_history_chrome.png",
                    ['.room-navbar__mobile-actions .mobile-header__account'],
                    "Account (direct link, no menu)")

        print("console errors:", cap.errors or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3210")
    asyncio.run(main(ap.parse_args().base))
